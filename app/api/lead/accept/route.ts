import { NextRequest, NextResponse } from "next/server";
import { verifyAcceptToken, acceptLead } from "@/lib/actions/assignment";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

// GET: Route canonique d'acceptation lead (token JWT ou assignmentId)
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const assignmentId = request.nextUrl.searchParams.get("assignmentId");

  // Methode 1: Via token JWT (securise, pour liens WhatsApp/SMS/Email)
  if (token) {
    const verification = await verifyAcceptToken(token);

    if (!verification.valid) {
      return NextResponse.redirect(
        new URL(
          `/artisan/lead-error?code=INVALID_TOKEN&message=${encodeURIComponent(verification.error || "")}`,
          request.url
        )
      );
    }

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

    return NextResponse.redirect(
      new URL(
        `/artisan/lead-accepted?leadId=${result.leadId}&balance=${result.newBalance}`,
        request.url
      )
    );
  }

  // Methode 2: Via assignmentId (pour dashboard authentifie)
  if (assignmentId) {
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

  return NextResponse.redirect(
    new URL("/artisan/lead-error?code=MISSING_TOKEN", request.url)
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
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || user.id !== artisanId) {
        return NextResponse.json(
          { success: false, error: "Non autorise", code: "UNAUTHORIZED" },
          { status: 403 }
        );
      }

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
