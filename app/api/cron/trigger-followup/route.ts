import { withCronMonitoring } from "@/lib/cron-monitor";

// GET /api/cron/trigger-followup
// Declenche le suivi J+3 pour les leads accepted il y a 3 jours sans feedback
export const GET = withCronMonitoring("trigger-followup", async (supabase) => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const startOfDay = new Date(threeDaysAgo);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(threeDaysAgo);
  endOfDay.setHours(23, 59, 59, 999);

  const { data: eligibleLeads, error: fetchError } = await supabase
    .from("leads")
    .select(`
      id, client_phone, client_email, problem_type,
      assigned_artisan_id,
      profiles!leads_assigned_artisan_id_fkey(first_name, last_name)
    `)
    .eq("status", "accepted")
    .is("satisfaction", null)
    .gte("updated_at", startOfDay.toISOString())
    .lte("updated_at", endOfDay.toISOString())
    .limit(20);

  if (fetchError) throw fetchError;

  if (!eligibleLeads || eligibleLeads.length === 0) {
    return { success: true, message: "Aucun lead eligible pour J+3", triggered: 0 };
  }

  let triggered = 0;

  for (const lead of eligibleLeads) {
    const { data: existingFeedback } = await supabase
      .from("client_feedbacks")
      .select("id")
      .eq("lead_id", lead.id)
      .limit(1);

    if (existingFeedback && existingFeedback.length > 0) continue;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://plombier-urgent.vercel.app";
    const res = await fetch(`${appUrl}/api/webhooks/n8n/followup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.id }),
    });

    if (res.ok) triggered++;
  }

  return { success: true, eligible: eligibleLeads.length, triggered };
});
