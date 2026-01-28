/**
 * Utilitaires pour déclencher les workflows n8n
 */

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

interface TriggerResult {
  success: boolean;
  error?: string;
}

/**
 * Déclenche le workflow n8n pour traiter un nouveau lead.
 * Le workflow n8n doit être configuré pour:
 * 1. Recevoir le leadId
 * 2. Appeler /api/webhooks/n8n/trigger-lead pour récupérer les données
 * 3. Exécuter l'algorithme d'attribution
 * 4. Envoyer les notifications (WhatsApp → SMS → Email)
 * 5. Appeler /api/webhooks/n8n/notification-status pour confirmer
 */
export async function triggerLeadWorkflow(leadId: string): Promise<TriggerResult> {
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
        event: "lead.created",
        leadId,
        timestamp: new Date().toISOString(),
        callbackUrls: {
          triggerLead: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/n8n/trigger-lead`,
          notificationStatus: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/n8n/notification-status`,
          acceptLead: `${process.env.NEXT_PUBLIC_APP_URL}/api/leads/accept`,
        },
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
