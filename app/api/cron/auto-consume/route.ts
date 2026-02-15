import { withCronMonitoring } from "@/lib/cron-monitor";

// GET /api/cron/auto-consume
// Marque les leads accepted > 7 jours comme completed
export const GET = withCronMonitoring("auto-consume", async (supabase) => {
  const { data, error } = await supabase.rpc("auto_consume_stale_leads");
  if (error) throw error;
  return { success: true, consumed: data };
});
