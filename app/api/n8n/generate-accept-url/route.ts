import { NextRequest, NextResponse } from "next/server";
import { generateAcceptUrl } from "@/lib/actions/assignment";

// Verification du secret n8n
function verifyN8nSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = process.env.N8N_CALLBACK_SECRET;

  if (!expectedSecret) {
    console.error("N8N_CALLBACK_SECRET not configured");
    return false;
  }

  return authHeader === `Bearer ${expectedSecret}`;
}

export async function POST(request: NextRequest) {
  // Verifier authentification
  if (!verifyN8nSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { assignmentId, artisanId } = await request.json();

    if (!assignmentId || !artisanId) {
      return NextResponse.json(
        { error: "Missing assignmentId or artisanId" },
        { status: 400 }
      );
    }

    const acceptUrl = await generateAcceptUrl(assignmentId, artisanId);

    return NextResponse.json({
      success: true,
      acceptUrl,
    });
  } catch (error) {
    console.error("Generate accept URL error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
