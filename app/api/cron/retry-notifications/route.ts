import { withCronMonitoring } from "@/lib/cron-monitor";
import { triggerLeadWorkflow } from "@/lib/n8n/trigger";

const MAX_ATTEMPTS = 3;

// GET /api/cron/retry-notifications
// Retente automatiquement les notifications en echec
export const GET = withCronMonitoring("retry-notifications", async (supabase) => {
  const { data: failedLeads, error: fetchError } = await supabase
    .from("leads")
    .select("id, client_phone, client_city, problem_type, description, field_summary, notification_attempts")
    .eq("notification_status", "failed")
    .lt("notification_attempts", MAX_ATTEMPTS)
    .order("created_at", { ascending: true })
    .limit(10);

  if (fetchError) throw fetchError;

  if (!failedLeads || failedLeads.length === 0) {
    return { success: true, message: "Aucun lead en echec", retried: 0 };
  }

  let successCount = 0;
  let failedCount = 0;

  for (const lead of failedLeads) {
    await supabase
      .from("leads")
      .update({ notification_status: "retrying" })
      .eq("id", lead.id);

    const result = await triggerLeadWorkflow({
      leadId: lead.id,
      clientPhone: lead.client_phone,
      clientCity: lead.client_city || undefined,
      problemType: lead.problem_type,
      description: lead.description,
      fieldSummary: lead.field_summary || undefined,
    });

    const newAttempts = (lead.notification_attempts || 0) + 1;

    if (result.success) {
      await supabase
        .from("leads")
        .update({
          notification_status: "sent",
          notification_error: null,
          notification_attempts: newAttempts,
          notification_last_attempt: new Date().toISOString(),
        })
        .eq("id", lead.id);
      successCount++;
    } else {
      await supabase
        .from("leads")
        .update({
          notification_status: "failed",
          notification_error: result.error || "Erreur inconnue",
          notification_attempts: newAttempts,
          notification_last_attempt: new Date().toISOString(),
        })
        .eq("id", lead.id);
      failedCount++;
    }
  }

  return { success: true, retried: failedLeads.length, success_count: successCount, failed_count: failedCount };
});
