import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/webhooks/n8n/followup
 *
 * Recupere les leads eligibles au suivi J+3.
 * Appele par n8n scheduler chaque jour.
 *
 * Query: ?days=3 (defaut 3)
 * Response: { leads: [...] }
 */
export async function GET(request: NextRequest) {
  try {
    const days = parseInt(request.nextUrl.searchParams.get("days") || "3", 10);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Date cible: leads crees il y a X jours
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - days);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Recuperer leads acceptes sans feedback envoye
    const { data: leads, error } = await supabase
      .from("leads")
      .select(`
        id,
        client_phone,
        client_email,
        problem_type,
        client_city,
        created_at,
        satisfaction,
        lead_assignments!inner(
          artisan_id,
          status,
          responded_at
        )
      `)
      .gte("created_at", startOfDay.toISOString())
      .lte("created_at", endOfDay.toISOString())
      .eq("lead_assignments.status", "accepted")
      .is("satisfaction", null);

    if (error) {
      console.error("Erreur fetch leads followup:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Filtrer ceux qui n'ont pas deja de feedback envoye
    const leadIds = leads?.map(l => l.id) || [];

    const { data: existingFeedbacks } = await supabase
      .from("client_feedbacks")
      .select("lead_id")
      .in("lead_id", leadIds);

    const alreadySent = new Set(existingFeedbacks?.map(f => f.lead_id) || []);

    const eligibleLeads = leads?.filter(l => !alreadySent.has(l.id)) || [];

    return NextResponse.json({
      success: true,
      count: eligibleLeads.length,
      leads: eligibleLeads.map(lead => ({
        lead_id: lead.id,
        client_phone: lead.client_phone,
        client_email: lead.client_email,
        problem_type: lead.problem_type,
        city: lead.client_city,
        created_at: lead.created_at,
        artisan_id: lead.lead_assignments[0]?.artisan_id,
      })),
    });

  } catch (error) {
    console.error("Erreur GET followup:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * POST /api/webhooks/n8n/followup
 *
 * Cree un feedback et retourne le lien pour envoi SMS/WhatsApp.
 *
 * Body: { lead_id, channel }
 * Response: { feedback_url, message }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lead_id, channel } = body;

    if (!lead_id) {
      return NextResponse.json({ error: "lead_id requis" }, { status: 400 });
    }

    const validChannels = ["whatsapp", "sms", "email"];
    if (channel && !validChannels.includes(channel)) {
      return NextResponse.json({ error: "Channel invalide" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verifier lead existe et a un assignment accepte
    const { data: lead } = await supabase
      .from("leads")
      .select(`
        id,
        client_phone,
        client_email,
        problem_type,
        lead_assignments!inner(artisan_id, status)
      `)
      .eq("id", lead_id)
      .eq("lead_assignments.status", "accepted")
      .single();

    if (!lead) {
      return NextResponse.json({ error: "Lead non trouve ou non accepte" }, { status: 404 });
    }

    const artisanId = lead.lead_assignments[0].artisan_id;

    // Verifier si feedback existe deja
    const { data: existingFeedback } = await supabase
      .from("client_feedbacks")
      .select("id, token")
      .eq("lead_id", lead_id)
      .single();

    let feedbackToken: string;

    if (existingFeedback) {
      feedbackToken = existingFeedback.token;
    } else {
      // Creer nouveau feedback
      const { data: newFeedback, error: insertError } = await supabase
        .from("client_feedbacks")
        .insert({
          lead_id,
          artisan_id: artisanId,
          channel: channel || "sms",
        })
        .select("token")
        .single();

      if (insertError || !newFeedback) {
        console.error("Erreur creation feedback:", insertError);
        return NextResponse.json({ error: "Erreur creation feedback" }, { status: 500 });
      }

      feedbackToken = newFeedback.token;
    }

    // Tracker envoi
    await supabase
      .from("followup_sends")
      .upsert({
        lead_id,
        channel: channel || "sms",
        sent_at: new Date().toISOString(),
      }, { onConflict: "lead_id,channel" });

    // Construire URL et message
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const feedbackUrl = `${baseUrl}/feedback/${feedbackToken}`;

    const messages = {
      whatsapp: `Bonjour ! Suite a votre intervention plomberie, etes-vous satisfait du service ? Donnez votre avis : ${feedbackUrl}`,
      sms: `Plombier Urgent: Satisfait? Votre avis: ${feedbackUrl}`,
      email: {
        subject: "Votre avis sur l'intervention",
        body: `Bonjour,\n\nSuite à notre intervention, nous aimerions avoir votre retour.\n\nDonnez votre avis : ${feedbackUrl}\n\nMerci !\nL'équipe Plombier Urgent`,
      },
    };

    return NextResponse.json({
      success: true,
      feedback_url: feedbackUrl,
      token: feedbackToken,
      client_phone: lead.client_phone,
      client_email: lead.client_email,
      message: channel === "email" ? messages.email : messages[channel as keyof typeof messages] || messages.sms,
    });

  } catch (error) {
    console.error("Erreur POST followup:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
