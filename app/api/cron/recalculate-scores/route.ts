import { withCronMonitoring } from "@/lib/cron-monitor";

// GET /api/cron/recalculate-scores
// Recalcule les scores de reactivite des artisans
export const GET = withCronMonitoring("recalculate-scores", async (supabase) => {
  const { data, error } = await supabase.rpc("recalculate_reactive_scores");
  if (error) throw error;
  return { success: true, updated: data };
});
