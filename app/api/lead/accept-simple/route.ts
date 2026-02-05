import { NextRequest, NextResponse } from "next/server";
import { acceptLead } from "@/lib/actions/assignment";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/lead/accept-simple?t={assignmentId}
 *
 * Route simplifiée pour accepter un lead depuis WhatsApp.
 * Utilise la RPC accept_lead (FOR UPDATE) pour éviter la race condition.
 */
export async function GET(request: NextRequest) {
  const assignmentId = request.nextUrl.searchParams.get("t");

  if (!assignmentId) {
    return NextResponse.redirect(
      new URL("/artisan/lead-error?code=MISSING_ID", request.url)
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
