import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/lead/cancel
// Annule un lead pendant la période de grâce (30 min) avec remboursement
export async function POST(request: NextRequest) {
  try {
    const { assignmentId, artisanId } = await request.json();

    if (!assignmentId || !artisanId) {
      return NextResponse.json(
        { success: false, error: "assignmentId et artisanId requis" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin.rpc("cancel_lead_acceptance", {
      p_assignment_id: assignmentId,
      p_artisan_id: artisanId,
    });

    if (error) {
      console.error("RPC cancel_lead_acceptance error:", error);
      return NextResponse.json(
        { success: false, error: "Erreur lors de l'annulation" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Cancel lead error:", err);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
