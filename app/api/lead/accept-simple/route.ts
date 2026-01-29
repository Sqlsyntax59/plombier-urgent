import { NextRequest, NextResponse } from "next/server";
import { acceptLead } from "@/lib/actions/assignment";

// Route simplifiee pour acceptation (sans JWT)
// Usage: /api/lead/accept-simple?assignmentId=xxx&artisanId=xxx
// Note: En production, utiliser la route /api/lead/accept avec JWT

export async function GET(request: NextRequest) {
  const assignmentId = request.nextUrl.searchParams.get("assignmentId");
  const artisanId = request.nextUrl.searchParams.get("artisanId");

  if (!assignmentId || !artisanId) {
    return NextResponse.redirect(
      new URL("/artisan/lead-error?code=MISSING_PARAMS", request.url)
    );
  }

  // Tenter d'accepter le lead
  const result = await acceptLead(assignmentId, artisanId);

  if (!result.success) {
    return NextResponse.redirect(
      new URL(
        `/artisan/lead-error?code=${result.errorCode}&message=${encodeURIComponent(result.error || "")}`,
        request.url
      )
    );
  }

  // Succes: rediriger vers page de confirmation
  return NextResponse.redirect(
    new URL(
      `/artisan/lead-accepted?leadId=${result.leadId}&balance=${result.newBalance}`,
      request.url
    )
  );
}
