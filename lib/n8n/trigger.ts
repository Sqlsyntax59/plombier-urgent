/**
 * Utilitaires pour déclencher les workflows n8n
 */

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

interface TriggerResult {
  success: boolean;
  error?: string;
}

export interface LeadData {
  leadId: string;
  clientPhone: string;
  clientCity?: string;
  problemType: string;
  description: string;
  // Nouvelles données enrichies (optionnelles pour rétrocompatibilité)
  fieldSummary?: string;
  isUrgent?: boolean;
  urgencyReason?: string | null;
}

/**
 * Déclenche le workflow n8n pour traiter un nouveau lead.
 * Fallback: appelle directement /api/leads/assign si webhook n8n échoue.
 */
export async function triggerLeadWorkflow(data: LeadData): Promise<TriggerResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://plombier-urgent.vercel.app";

  // Essai 1: Webhook n8n
  if (N8N_WEBHOOK_URL) {
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: data.leadId, appUrl }),
      });

      if (response.ok) {
        return { success: true };
      }
      console.warn("n8n webhook failed, using fallback:", response.status);
    } catch (error) {
      console.warn("n8n webhook error, using fallback:", error);
    }
  }

  // Fallback: Appel direct à l'API d'attribution
  try {
    const assignResponse = await fetch(`${appUrl}/api/leads/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: data.leadId, mode: "first" }),
    });

    if (!assignResponse.ok) {
      const text = await assignResponse.text();
      console.error("Erreur assign fallback:", assignResponse.status, text);
      return { success: false, error: `assign error: ${assignResponse.status}` };
    }

    const assignResult = await assignResponse.json();

    // Si artisan trouvé, envoyer WhatsApp
    if (assignResult.success && assignResult.assignmentId) {
      const n8nSecret = process.env.N8N_CALLBACK_SECRET;
      await fetch(`${appUrl}/api/notifications/send-whatsapp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(n8nSecret ? { Authorization: `Bearer ${n8nSecret}` } : {}),
        },
        body: JSON.stringify({ assignmentId: assignResult.assignmentId }),
      }).catch(err => console.error("WhatsApp notification error:", err));
    }

    return { success: true };
  } catch (error) {
    console.error("Erreur fallback:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

/**
 * Déclenche le workflow n8n pour le suivi J+3.
 */
export async function triggerFollowUpWorkflow(leadId: string): Promise<TriggerResult> {
  if (!N8N_WEBHOOK_URL) {
    console.warn("N8N_WEBHOOK_URL non configuré");
    return { success: true };
  }

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event: "lead.followup_j3",
        leadId,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      return { success: false, error: `n8n error: ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    console.error("Erreur appel n8n followup:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}
