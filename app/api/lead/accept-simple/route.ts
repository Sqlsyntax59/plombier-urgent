import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/lead/accept-simple?t={assignmentId}
 *
 * Route simplifiée pour accepter un lead depuis WhatsApp.
 * Le paramètre `t` contient l'assignmentId directement.
 */
export async function GET(request: NextRequest) {
  const assignmentId = request.nextUrl.searchParams.get("t");

  if (!assignmentId) {
    return NextResponse.redirect(
      new URL("/artisan/lead-error?code=MISSING_ID", request.url)
    );
  }

  const supabase = createAdminClient();

  // 1. Récupérer l'assignment
  const { data: assignment, error: assignmentError } = await supabase
    .from("lead_assignments")
    .select("id, lead_id, artisan_id, status, expires_at")
    .eq("id", assignmentId)
    .single();

  if (assignmentError || !assignment) {
    return NextResponse.redirect(
      new URL("/artisan/lead-error?code=ASSIGNMENT_NOT_FOUND", request.url)
    );
  }

  // 2. Vérifier que l'assignment est encore pending
  if (assignment.status !== "pending") {
    const message = assignment.status === "accepted"
      ? "Ce lead a déjà été accepté"
      : "Ce lead n'est plus disponible";
    return NextResponse.redirect(
      new URL(`/artisan/lead-error?code=ALREADY_PROCESSED&message=${encodeURIComponent(message)}`, request.url)
    );
  }

  // 3. Vérifier que l'assignment n'a pas expiré
  if (new Date(assignment.expires_at) < new Date()) {
    return NextResponse.redirect(
      new URL("/artisan/lead-error?code=EXPIRED&message=Le délai pour accepter ce lead est dépassé", request.url)
    );
  }

  // 4. Vérifier que le lead est encore pending
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, status")
    .eq("id", assignment.lead_id)
    .single();

  if (leadError || !lead) {
    return NextResponse.redirect(
      new URL("/artisan/lead-error?code=LEAD_NOT_FOUND", request.url)
    );
  }

  if (lead.status !== "pending") {
    return NextResponse.redirect(
      new URL("/artisan/lead-error?code=LEAD_TAKEN&message=Ce lead a déjà été pris par un autre artisan", request.url)
    );
  }

  // 5. Déduire les crédits de l'artisan
  const { data: artisan, error: artisanError } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", assignment.artisan_id)
    .single();

  if (artisanError || !artisan) {
    return NextResponse.redirect(
      new URL("/artisan/lead-error?code=ARTISAN_NOT_FOUND", request.url)
    );
  }

  const leadCost = 3; // Coût d'un lead en crédits
  if (artisan.credits < leadCost) {
    return NextResponse.redirect(
      new URL("/artisan/lead-error?code=INSUFFICIENT_CREDITS&message=Crédits insuffisants", request.url)
    );
  }

  const newBalance = artisan.credits - leadCost;

  // 6. Transaction: mettre à jour assignment, lead et crédits
  const { error: updateAssignmentError } = await supabase
    .from("lead_assignments")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString()
    })
    .eq("id", assignmentId);

  if (updateAssignmentError) {
    console.error("Erreur update assignment:", updateAssignmentError);
    return NextResponse.redirect(
      new URL("/artisan/lead-error?code=UPDATE_ERROR", request.url)
    );
  }

  const { error: updateLeadError } = await supabase
    .from("leads")
    .update({
      status: "assigned",
      assigned_artisan_id: assignment.artisan_id
    })
    .eq("id", assignment.lead_id);

  if (updateLeadError) {
    console.error("Erreur update lead:", updateLeadError);
  }

  const { error: updateCreditsError } = await supabase
    .from("profiles")
    .update({ credits: newBalance })
    .eq("id", assignment.artisan_id);

  if (updateCreditsError) {
    console.error("Erreur update credits:", updateCreditsError);
  }

  // 7. Expirer les autres assignments pour ce lead
  await supabase
    .from("lead_assignments")
    .update({ status: "expired" })
    .eq("lead_id", assignment.lead_id)
    .neq("id", assignmentId)
    .eq("status", "pending");

  // 8. Rediriger vers la page de succès
  return NextResponse.redirect(
    new URL(`/artisan/lead-accepted?leadId=${assignment.lead_id}&balance=${newBalance}`, request.url)
  );
}
