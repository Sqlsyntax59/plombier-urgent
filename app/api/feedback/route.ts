import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/feedback?token=xxx
 *
 * Recuperer les infos du feedback pour affichage page client.
 * Pas d'auth requise - token sert de validation.
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { error: "Token requis" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Recuperer feedback avec infos lead et artisan
    const { data: feedback, error } = await supabase
      .from("client_feedbacks")
      .select(`
        id,
        token,
        satisfied,
        rating,
        submitted_at,
        lead:leads(
          problem_type,
          client_city,
          created_at
        ),
        artisan:profiles(
          first_name,
          city
        )
      `)
      .eq("token", token)
      .single();

    if (error || !feedback) {
      return NextResponse.json(
        { error: "Feedback non trouve" },
        { status: 404 }
      );
    }

    // Marquer comme ouvert si pas encore
    if (!feedback.submitted_at) {
      await supabase
        .from("client_feedbacks")
        .update({ opened_at: new Date().toISOString() })
        .eq("token", token)
        .is("opened_at", null);
    }

    // Deja soumis ?
    if (feedback.submitted_at) {
      return NextResponse.json({
        success: true,
        already_submitted: true,
        feedback: {
          satisfied: feedback.satisfied,
          rating: feedback.rating,
        },
      });
    }

    return NextResponse.json({
      success: true,
      feedback: {
        id: feedback.id,
        artisan_name: feedback.artisan?.first_name || "Votre artisan",
        artisan_city: feedback.artisan?.city,
        problem_type: feedback.lead?.problem_type,
        intervention_date: feedback.lead?.created_at,
      },
    });

  } catch (error) {
    console.error("Erreur GET feedback:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/feedback
 *
 * Soumettre le feedback client.
 * Body: { token, satisfied, rating?, comment?, issues? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, satisfied, rating, comment, issues } = body;

    if (!token || satisfied === undefined) {
      return NextResponse.json(
        { error: "Token et satisfaction requis" },
        { status: 400 }
      );
    }

    // Valider rating si fourni
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: "Rating doit etre entre 1 et 5" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verifier que feedback existe et pas deja soumis
    const { data: existing } = await supabase
      .from("client_feedbacks")
      .select("id, submitted_at, lead_id")
      .eq("token", token)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Feedback non trouve" },
        { status: 404 }
      );
    }

    if (existing.submitted_at) {
      return NextResponse.json(
        { error: "Feedback deja soumis" },
        { status: 400 }
      );
    }

    // Mettre a jour le feedback
    const { error: updateError } = await supabase
      .from("client_feedbacks")
      .update({
        satisfied,
        rating: rating || null,
        comment: comment || null,
        issues: issues || null,
        submitted_at: new Date().toISOString(),
      })
      .eq("token", token);

    if (updateError) {
      console.error("Erreur update feedback:", updateError);
      return NextResponse.json(
        { error: "Erreur sauvegarde" },
        { status: 500 }
      );
    }

    // Mettre a jour satisfaction sur lead
    await supabase
      .from("leads")
      .update({
        satisfaction: satisfied ? "yes" : "no",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.lead_id);

    return NextResponse.json({
      success: true,
      message: "Merci pour votre retour !",
    });

  } catch (error) {
    console.error("Erreur POST feedback:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
