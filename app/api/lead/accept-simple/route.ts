import { NextRequest, NextResponse } from "next/server";

/**
 * DEPRECATED — Redirect vers la route canonique /api/lead/accept
 * Conservé pour rétrocompatibilité avec d'éventuels anciens liens WhatsApp.
 */
export async function GET(request: NextRequest) {
  console.warn("[DEPRECATED] /api/lead/accept-simple called — migrate to /api/lead/accept");
  const assignmentId = request.nextUrl.searchParams.get("t");
  const target = new URL("/api/lead/accept", request.url);
  if (assignmentId) target.searchParams.set("assignmentId", assignmentId);
  return NextResponse.redirect(target, 307);
}
