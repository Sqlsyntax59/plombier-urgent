import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/leads/accept?assignmentId=xxx
 *
 * Endpoint appelé quand l'artisan clique sur "J'accepte" dans la notification.
 * Redirige vers une page de confirmation ou d'erreur.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const assignmentId = searchParams.get("assignmentId");

  if (!assignmentId) {
    return NextResponse.redirect(
      new URL("/artisan/leads?error=missing_id", request.url)
    );
  }

  const supabase = await createClient();

  // 1. Récupérer l'assignment avec le lead
  const { data: assignment, error: assignmentError } = await supabase
    .from("lead_assignments")
    .select(
      `
      id,
      lead_id,
      artisan_id,
      status,
      expires_at,
      leads (
        id,
        status
      )
    `
    )
    .eq("id", assignmentId)
    .single();

  if (assignmentError || !assignment) {
    return NextResponse.redirect(
      new URL("/artisan/leads?error=not_found", request.url)
    );
  }

  // 2. Vérifier que l'assignment est toujours pending
  if (assignment.status !== "pending") {
    // L'assignment a déjà été traité (expiré ou autre)
    return NextResponse.redirect(
      new URL("/artisan/leads?error=already_processed", request.url)
    );
  }

  // 3. Vérifier que le lead n'a pas déjà été attribué
  const lead = assignment.leads as unknown as { id: string; status: string };
  if (lead.status !== "pending") {
    // Le lead a été pris par un autre artisan
    return NextResponse.redirect(
      new URL("/artisan/leads?error=already_assigned", request.url)
    );
  }

  // 4. Vérifier que le timer n'a pas expiré
  if (assignment.expires_at) {
    const expiresAt = new Date(assignment.expires_at);
    if (expiresAt < new Date()) {
      // Marquer l'assignment comme expiré
      await supabase
        .from("lead_assignments")
        .update({ status: "expired" })
        .eq("id", assignmentId);

      return NextResponse.redirect(
        new URL("/artisan/leads?error=expired", request.url)
      );
    }
  }

  // 5. Vérifier que l'artisan a des crédits
  const { data: artisan, error: artisanError } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", assignment.artisan_id)
    .single();

  if (artisanError || !artisan || artisan.credits < 1) {
    return NextResponse.redirect(
      new URL("/artisan/leads?error=no_credits", request.url)
    );
  }

  // 6. Transaction: accepter le lead
  // a) Marquer l'assignment comme accepted
  const { error: updateAssignmentError } = await supabase
    .from("lead_assignments")
    .update({
      status: "accepted",
      responded_at: new Date().toISOString(),
    })
    .eq("id", assignmentId);

  if (updateAssignmentError) {
    console.error("Erreur update assignment:", updateAssignmentError);
    return NextResponse.redirect(
      new URL("/artisan/leads?error=server_error", request.url)
    );
  }

  // b) Marquer le lead comme assigned
  const { error: updateLeadError } = await supabase
    .from("leads")
    .update({ status: "assigned" })
    .eq("id", assignment.lead_id);

  if (updateLeadError) {
    console.error("Erreur update lead:", updateLeadError);
    // Rollback l'assignment
    await supabase
      .from("lead_assignments")
      .update({ status: "pending" })
      .eq("id", assignmentId);

    return NextResponse.redirect(
      new URL("/artisan/leads?error=server_error", request.url)
    );
  }

  // c) Décompter 1 crédit de l'artisan (atomique avec RPC serait mieux)
  const { error: updateCreditsError } = await supabase
    .from("profiles")
    .update({ credits: artisan.credits - 1 })
    .eq("id", assignment.artisan_id)
    .eq("credits", artisan.credits); // Optimistic locking

  if (updateCreditsError) {
    console.error("Erreur update credits:", updateCreditsError);
    // On continue quand même, le crédit sera corrigé manuellement si nécessaire
  }

  // d) Expirer tous les autres assignments en pending pour ce lead
  await supabase
    .from("lead_assignments")
    .update({ status: "expired" })
    .eq("lead_id", assignment.lead_id)
    .eq("status", "pending")
    .neq("id", assignmentId);

  // 7. Rediriger vers les détails du lead
  return NextResponse.redirect(
    new URL(`/artisan/leads/${assignment.lead_id}?accepted=true`, request.url)
  );
}

/**
 * POST /api/leads/accept
 *
 * Version API pour appels programmatiques (depuis dashboard, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignmentId } = body;

    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: "assignmentId requis" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Même logique que GET mais retourne JSON
    const { data: assignment, error: assignmentError } = await supabase
      .from("lead_assignments")
      .select(
        `
        id,
        lead_id,
        artisan_id,
        status,
        expires_at,
        leads (
          id,
          status,
          client_phone,
          client_email,
          description,
          problem_type,
          photo_url
        )
      `
      )
      .eq("id", assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { success: false, error: "Assignment non trouvé" },
        { status: 404 }
      );
    }

    if (assignment.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Assignment déjà traité", alreadyProcessed: true },
        { status: 400 }
      );
    }

    const lead = assignment.leads as unknown as {
      id: string;
      status: string;
      client_phone: string;
      client_email: string | null;
      description: string;
      problem_type: string;
      photo_url: string | null;
    };

    if (lead.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Lead déjà attribué", alreadyAssigned: true },
        { status: 400 }
      );
    }

    // Vérifier expiration
    if (assignment.expires_at && new Date(assignment.expires_at) < new Date()) {
      await supabase
        .from("lead_assignments")
        .update({ status: "expired" })
        .eq("id", assignmentId);

      return NextResponse.json(
        { success: false, error: "Délai expiré", expired: true },
        { status: 400 }
      );
    }

    // Vérifier crédits
    const { data: artisan } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", assignment.artisan_id)
      .single();

    if (!artisan || artisan.credits < 1) {
      return NextResponse.json(
        { success: false, error: "Crédits insuffisants", noCredits: true },
        { status: 400 }
      );
    }

    // Accepter le lead
    await supabase
      .from("lead_assignments")
      .update({
        status: "accepted",
        responded_at: new Date().toISOString(),
      })
      .eq("id", assignmentId);

    await supabase.from("leads").update({ status: "assigned" }).eq("id", assignment.lead_id);

    await supabase
      .from("profiles")
      .update({ credits: artisan.credits - 1 })
      .eq("id", assignment.artisan_id);

    // Expirer autres assignments
    await supabase
      .from("lead_assignments")
      .update({ status: "expired" })
      .eq("lead_id", assignment.lead_id)
      .eq("status", "pending")
      .neq("id", assignmentId);

    return NextResponse.json({
      success: true,
      lead: {
        id: lead.id,
        clientPhone: lead.client_phone,
        clientEmail: lead.client_email,
        description: lead.description,
        problemType: lead.problem_type,
        photoUrl: lead.photo_url,
      },
    });
  } catch (error) {
    console.error("Erreur accept lead:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
