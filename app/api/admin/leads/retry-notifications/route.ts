import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { triggerLeadWorkflow } from "@/lib/n8n/trigger";

// Client Supabase avec service_role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MAX_ATTEMPTS = 3;

/**
 * POST /api/admin/leads/retry-notifications
 *
 * Retente l'envoi des notifications pour les leads en échec.
 * Requiert authentification admin (vérifiée par middleware).
 */
export async function POST(request: NextRequest) {
  try {
    // Optionnel: limit le nombre de leads à traiter
    const { limit = 10 } = await request.json().catch(() => ({}));

    // Récupérer les leads en échec (max 3 tentatives)
    const { data: failedLeads, error: fetchError } = await supabaseAdmin
      .from("leads")
      .select("id, client_phone, client_city, problem_type, description, field_summary, notification_attempts")
      .eq("notification_status", "failed")
      .lt("notification_attempts", MAX_ATTEMPTS)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (fetchError) {
      throw fetchError;
    }

    if (!failedLeads || failedLeads.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucun lead en échec à retenter",
        processed: 0,
      });
    }

    const results = {
      success: 0,
      failed: 0,
      maxAttemptsReached: 0,
      details: [] as { leadId: string; status: string; error?: string }[],
    };

    // Traiter chaque lead
    for (const lead of failedLeads) {
      // Marquer comme retrying
      await supabaseAdmin
        .from("leads")
        .update({ notification_status: "retrying" })
        .eq("id", lead.id);

      // Tenter le workflow
      const workflowResult = await triggerLeadWorkflow({
        leadId: lead.id,
        clientPhone: lead.client_phone,
        clientCity: lead.client_city || undefined,
        problemType: lead.problem_type,
        description: lead.description,
        fieldSummary: lead.field_summary || undefined,
      });

      const newAttempts = (lead.notification_attempts || 0) + 1;

      if (workflowResult.success) {
        await supabaseAdmin
          .from("leads")
          .update({
            notification_status: "sent",
            notification_error: null,
            notification_attempts: newAttempts,
            notification_last_attempt: new Date().toISOString(),
          })
          .eq("id", lead.id);

        results.success++;
        results.details.push({ leadId: lead.id, status: "sent" });
      } else {
        // Échec - vérifier si max attempts atteint
        const status = newAttempts >= MAX_ATTEMPTS ? "failed" : "failed";

        await supabaseAdmin
          .from("leads")
          .update({
            notification_status: status,
            notification_error: workflowResult.error || "Erreur inconnue",
            notification_attempts: newAttempts,
            notification_last_attempt: new Date().toISOString(),
          })
          .eq("id", lead.id);

        if (newAttempts >= MAX_ATTEMPTS) {
          results.maxAttemptsReached++;
        } else {
          results.failed++;
        }
        results.details.push({
          leadId: lead.id,
          status: newAttempts >= MAX_ATTEMPTS ? "max_attempts" : "failed",
          error: workflowResult.error,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Traitement terminé: ${results.success} réussis, ${results.failed} échoués, ${results.maxAttemptsReached} max attempts`,
      processed: failedLeads.length,
      results,
    });
  } catch (error) {
    console.error("Erreur retry notifications:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/leads/retry-notifications
 *
 * Retourne les statistiques des leads en échec.
 */
export async function GET() {
  try {
    // Compter les leads par statut de notification
    const { data: stats, error } = await supabaseAdmin
      .from("leads")
      .select("notification_status")
      .not("notification_status", "is", null);

    if (error) throw error;

    const counts = {
      pending: 0,
      sent: 0,
      failed: 0,
      retrying: 0,
    };

    stats?.forEach((lead) => {
      const status = lead.notification_status as keyof typeof counts;
      if (status in counts) {
        counts[status]++;
      }
    });

    // Récupérer les leads en échec récents
    const { data: failedLeads } = await supabaseAdmin
      .from("leads")
      .select("id, client_city, problem_type, notification_error, notification_attempts, created_at")
      .eq("notification_status", "failed")
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      stats: counts,
      failedLeads: failedLeads || [],
      maxAttempts: MAX_ATTEMPTS,
    });
  } catch (error) {
    console.error("Erreur stats notifications:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
