import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { triggerLeadWorkflow } from "@/lib/n8n/trigger";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_ATTEMPTS = 3;

// GET /api/cron/retry-notifications
// Retente automatiquement les notifications en échec
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { data: failedLeads, error: fetchError } = await supabaseAdmin
      .from("leads")
      .select("id, client_phone, client_city, problem_type, description, field_summary, notification_attempts")
      .eq("notification_status", "failed")
      .lt("notification_attempts", MAX_ATTEMPTS)
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchError) throw fetchError;

    if (!failedLeads || failedLeads.length === 0) {
      return NextResponse.json({ success: true, message: "Aucun lead en echec", retried: 0 });
    }

    let success = 0;
    let failed = 0;

    for (const lead of failedLeads) {
      await supabaseAdmin
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
        await supabaseAdmin
          .from("leads")
          .update({
            notification_status: "sent",
            notification_error: null,
            notification_attempts: newAttempts,
            notification_last_attempt: new Date().toISOString(),
          })
          .eq("id", lead.id);
        success++;
      } else {
        await supabaseAdmin
          .from("leads")
          .update({
            notification_status: "failed",
            notification_error: result.error || "Erreur inconnue",
            notification_attempts: newAttempts,
            notification_last_attempt: new Date().toISOString(),
          })
          .eq("id", lead.id);
        failed++;
      }
    }

    return NextResponse.json({ success: true, retried: failedLeads.length, success_count: success, failed_count: failed });
  } catch (err) {
    console.error("Erreur cron retry-notifications:", err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
