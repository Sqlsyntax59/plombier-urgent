import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/cron/trigger-followup
// Déclenche le suivi J+3 pour les leads accepted il y a 3 jours sans feedback
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Leads accepted il y a 3 jours, sans feedback envoyé
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const startOfDay = new Date(threeDaysAgo);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(threeDaysAgo);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: eligibleLeads, error: fetchError } = await supabaseAdmin
      .from("leads")
      .select(`
        id, client_phone, client_email, problem_type,
        assigned_artisan_id,
        profiles!leads_assigned_artisan_id_fkey(first_name, last_name)
      `)
      .eq("status", "accepted")
      .is("satisfaction", null)
      .gte("updated_at", startOfDay.toISOString())
      .lte("updated_at", endOfDay.toISOString())
      .limit(20);

    if (fetchError) throw fetchError;

    if (!eligibleLeads || eligibleLeads.length === 0) {
      return NextResponse.json({ success: true, message: "Aucun lead eligible pour J+3", triggered: 0 });
    }

    let triggered = 0;

    for (const lead of eligibleLeads) {
      // Vérifier si un feedback a déjà été envoyé
      const { data: existingFeedback } = await supabaseAdmin
        .from("client_feedbacks")
        .select("id")
        .eq("lead_id", lead.id)
        .limit(1);

      if (existingFeedback && existingFeedback.length > 0) continue;

      // Appeler l'endpoint followup interne
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://plombier-urgent.vercel.app";
      const res = await fetch(`${appUrl}/api/webhooks/n8n/followup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });

      if (res.ok) triggered++;
    }

    return NextResponse.json({ success: true, eligible: eligibleLeads.length, triggered });
  } catch (err) {
    console.error("Erreur cron trigger-followup:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
