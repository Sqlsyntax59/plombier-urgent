import { NextRequest, NextResponse } from "next/server";

/**
 * Redirect vers la route canonique /api/lead/accept
 * Le template WhatsApp envoie le token JWT via ?t=
 */
export async function GET(request: NextRequest) {
  const t = request.nextUrl.searchParams.get("t");
  const target = new URL("/api/lead/accept", request.url);
  if (t) target.searchParams.set("token", t);
  return NextResponse.redirect(target, 307);
}
