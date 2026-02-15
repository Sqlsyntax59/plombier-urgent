import { NextRequest, NextResponse } from "next/server";

/**
 * DEPRECATED — Redirect vers la route canonique /api/lead/accept
 * Conservé pour rétrocompatibilité avec d'éventuels anciens liens.
 */
export async function GET(request: NextRequest) {
  const assignmentId = request.nextUrl.searchParams.get("assignmentId");
  const target = new URL("/api/lead/accept", request.url);
  if (assignmentId) target.searchParams.set("assignmentId", assignmentId);
  return NextResponse.redirect(target, 307);
}

export async function POST() {
  return NextResponse.json(
    { success: false, error: "Route dépréciée. Utilisez POST /api/lead/accept" },
    { status: 410 }
  );
}
