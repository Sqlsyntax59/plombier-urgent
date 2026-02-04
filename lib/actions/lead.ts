"use server";

import { createAdminClient } from "@/lib/supabase/server";
import {
  leadSubmitSchema,
  type LeadSubmitInput,
  type GuidedAnswers,
  checkUrgency,
  generateFieldSummary,
} from "@/lib/validations/lead";
import { triggerLeadWorkflow } from "@/lib/n8n/trigger";

export type LeadResult = {
  success: boolean;
  leadId?: string;
  error?: string;
};

// Creer un nouveau lead (demande client)
export async function createLead(
  data: LeadSubmitInput & { guidedAnswers?: GuidedAnswers }
): Promise<LeadResult> {
  // Validation serveur
  const parsed = leadSubmitSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Donnees invalides",
    };
  }

  const {
    problemType,
    description,
    photoUrl,
    clientPhone,
    clientEmail,
    clientCity,
  } = parsed.data;

  // Récupérer les réponses guidées (optionnel)
  const guidedAnswers = data.guidedAnswers || {};

  // Calculer urgence et synthèse terrain
  const urgency = checkUrgency(problemType, guidedAnswers);
  const fieldSummary = generateFieldSummary(problemType, guidedAnswers, description);

  const supabase = createAdminClient();

  // Normaliser le numero de telephone (supprimer espaces et tirets)
  const normalizedPhone = clientPhone.replace(/[\s.-]/g, "");

  // Obtenir la verticale par defaut (plombier)
  // Note: Dans une future story, on gerera le multi-tenant
  const { data: vertical } = await supabase
    .from("verticals")
    .select("id")
    .eq("slug", "plombier")
    .single();

  // Creer le lead
  const { data: lead, error } = await supabase
    .from("leads")
    .insert({
      problem_type: problemType,
      description,
      field_summary: fieldSummary || null,
      photo_url: photoUrl || null,
      client_phone: normalizedPhone,
      client_email: clientEmail || null,
      client_city: clientCity || null,
      vertical_id: vertical?.id || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Erreur creation lead:", error);
    return {
      success: false,
      error: "Erreur lors de la soumission. Veuillez reessayer.",
    };
  }

  // Déclencher le workflow n8n pour notification artisan
  const workflowResult = await triggerLeadWorkflow({
    leadId: lead.id,
    clientPhone: normalizedPhone,
    clientCity: clientCity || undefined,
    problemType,
    description,
    // Données enrichies pour la synthèse terrain
    fieldSummary,
    isUrgent: urgency.isUrgent,
    urgencyReason: urgency.reason,
  });

  // Mettre a jour le statut notification du lead
  if (workflowResult.success) {
    await supabase
      .from("leads")
      .update({
        notification_status: "sent",
        notification_attempts: 1,
        notification_last_attempt: new Date().toISOString(),
      })
      .eq("id", lead.id);
  } else {
    // Marquer comme echoue pour retry ulterieur
    console.error("Echec workflow n8n pour lead:", lead.id, workflowResult.error);
    await supabase
      .from("leads")
      .update({
        notification_status: "failed",
        notification_error: workflowResult.error || "Erreur inconnue",
        notification_attempts: 1,
        notification_last_attempt: new Date().toISOString(),
      })
      .eq("id", lead.id);
  }

  // On retourne success au client meme si n8n a echoue
  // Le lead est cree, la notification sera retentee
  return {
    success: true,
    leadId: lead.id,
  };
}
