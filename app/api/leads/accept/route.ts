import { NextRequest, NextResponse } from "next/server";
import { acceptLead } from "@/lib/actions/assignment";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/leads/accept?assignmentId=xxx
 *
 * Endpoint appelé quand l'artisan clique sur "J'accepte" dans la notification.
 * Utilise la RPC accept_lead (FOR UPDATE) pour éviter la race condition.
 */
export async function GET(request: NextRequest) {
  const assignmentId = request.nextUrl.searchParams.get("assignmentId");

  if (!assignmentId) {
    return NextResponse.redirect(
      new URL("/artisan/lead-error?code=MISSING_ID", request.url)
    );
  }

  // Récupérer l'artisan_id depuis l'assignment (admin client pour bypass RLS)
  const supabase = createAdminClient();
  const { data: assignment } = await supabase
    .from("lead_assignments")
    .select("artisan_id")
    .eq("id", assignmentId)
    .single();

  if (!assignment) {
    return NextResponse.redirect(
      new URL("/artisan/lead-error?code=ASSIGNMENT_NOT_FOUND", request.url)
    );
  }

  // Utiliser acceptLead (RPC avec FOR UPDATE lock)
  const result = await acceptLead(assignmentId, assignment.artisan_id);

  if (!result.success) {
    return NextResponse.redirect(
      new URL(
        `/artisan/lead-error?code=${result.errorCode}&message=${encodeURIComponent(result.error || "")}`,
        request.url
      )
    );
  }

  return NextResponse.redirect(
    new URL(
      `/artisan/lead-accepted?leadId=${result.leadId}&balance=${result.newBalance}`,
      request.url
    )
  );
}

/**
 * POST /api/leads/accept
 *
 * Version API pour appels programmatiques (depuis dashboard, etc.)
 * Utilise la RPC accept_lead (FOR UPDATE) pour éviter la race condition.
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

    // Récupérer l'artisan_id depuis l'assignment
    const supabase = createAdminClient();
    const { data: assignment } = await supabase
      .from("lead_assignments")
      .select("artisan_id")
      .eq("id", assignmentId)
      .single();

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: "Assignment non trouvé" },
        { status: 404 }
      );
    }

    // Utiliser acceptLead (RPC avec FOR UPDATE lock)
    const result = await acceptLead(assignmentId, assignment.artisan_id);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error, code: result.errorCode },
        { status: 400 }
      );
    }

    // Récupérer les détails du lead pour la réponse
    const { data: lead } = await supabase
      .from("leads")
      .select("id, client_phone, client_email, description, problem_type, photo_url")
      .eq("id", result.leadId)
      .single();

    return NextResponse.json({
      success: true,
      lead: lead
        ? {
            id: lead.id,
            clientPhone: lead.client_phone,
            clientEmail: lead.client_email,
            description: lead.description,
            problemType: lead.problem_type,
            photoUrl: lead.photo_url,
          }
        : { id: result.leadId },
    });
  } catch (error) {
    console.error("Erreur accept lead:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
