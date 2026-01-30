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
}

/**
 * Déclenche le workflow n8n pour traiter un nouveau lead.
 * Envoie toutes les données nécessaires pour la notification Telegram.
 */
export async function triggerLeadWorkflow(data: LeadData): Promise<TriggerResult> {
  if (!N8N_WEBHOOK_URL) {
    console.warn("N8N_WEBHOOK_URL non configuré - workflow non déclenché");
    return { success: true }; // Silently succeed in dev
  }

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        leadId: data.leadId,
        phone: data.clientPhone,
        address: data.clientCity || "Non précisée",
        urgencyType: data.problemType,
        description: data.description,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Erreur n8n webhook:", response.status, text);
      return { success: false, error: `n8n error: ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    console.error("Erreur appel n8n:", error);
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
