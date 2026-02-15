import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

type CronResult = { success: boolean; [key: string]: unknown };

export function withCronMonitoring(
  cronName: string,
  handler: (supabase: SupabaseClient) => Promise<CronResult>
) {
  return async function GET(request: NextRequest): Promise<NextResponse> {
    // Auth check
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const startedAt = new Date();

    // Insert running row
    const { data: run } = await supabase
      .from("cron_runs")
      .insert({ cron_name: cronName, status: "running", started_at: startedAt.toISOString() })
      .select("id")
      .single();

    const runId = run?.id;

    try {
      const result = await handler(supabase);
      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - startedAt.getTime();

      if (runId) {
        await supabase
          .from("cron_runs")
          .update({
            status: "success",
            finished_at: finishedAt.toISOString(),
            duration_ms: durationMs,
            result,
          })
          .eq("id", runId);
      }

      return NextResponse.json(result);
    } catch (err) {
      const finishedAt = new Date();
      const durationMs = finishedAt.getTime() - startedAt.getTime();
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";

      console.error(`Cron ${cronName} error:`, err);

      if (runId) {
        await supabase
          .from("cron_runs")
          .update({
            status: "error",
            finished_at: finishedAt.toISOString(),
            duration_ms: durationMs,
            error_message: errorMessage,
          })
          .eq("id", runId);
      }

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 500 }
      );
    }
  };
}
