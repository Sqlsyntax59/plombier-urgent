import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/cron/auto-consume
// Marque les leads accepted > 7 jours comme completed
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin.rpc("auto_consume_stale_leads");

    if (error) throw error;

    return NextResponse.json({ success: true, consumed: data });
  } catch (err) {
    console.error("Erreur auto-consume:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
