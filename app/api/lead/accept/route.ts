import { NextRequest, NextResponse } from "next/server";
import { verifyAcceptToken, acceptLead } from "@/lib/actions/assignment";

// GET: Pour liens cliquables Telegram (redirige vers page de resultat)
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(
      new URL("/artisan/lead-error?code=MISSING_TOKEN", request.url)
    );
  }

  // Verifier le token
  const verification = await verifyAcceptToken(token);

  if (!verification.valid) {
    return NextResponse.redirect(
      new URL(
        `/artisan/lead-error?code=INVALID_TOKEN&message=${encodeURIComponent(verification.error || "")}`,
        request.url
      )
    );
  }

  // Tenter d'accepter le lead
  const result = await acceptLead(
    verification.assignmentId!,
    verification.artisanId!
  );

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

// POST: Pour appels API depuis dashboard artisan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, assignmentId, artisanId } = body;

    // Methode 1: Via token JWT
    if (token) {
      const verification = await verifyAcceptToken(token);

      if (!verification.valid) {
        return NextResponse.json(
          { success: false, error: verification.error, code: "INVALID_TOKEN" },
          { status: 401 }
        );
      }

      const result = await acceptLead(
        verification.assignmentId!,
        verification.artisanId!
      );

      return NextResponse.json(result, {
        status: result.success ? 200 : 400,
      });
    }

    // Methode 2: Via IDs directs (pour dashboard authentifie)
    if (assignmentId && artisanId) {
      // TODO: Verifier que l'utilisateur authentifie est bien l'artisan
      // Pour l'instant, cette methode n'est pas utilisee

      const result = await acceptLead(assignmentId, artisanId);

      return NextResponse.json(result, {
        status: result.success ? 200 : 400,
      });
    }

    return NextResponse.json(
      { success: false, error: "Missing token or IDs" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 }
    );
  }
}
