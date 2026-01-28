"use server";

import { createClient } from "@/lib/supabase/server";
import { leadSubmitSchema, type LeadSubmitInput } from "@/lib/validations/lead";

export type LeadResult = {
  success: boolean;
  leadId?: string;
  error?: string;
};

// Creer un nouveau lead (demande client)
export async function createLead(data: LeadSubmitInput): Promise<LeadResult> {
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

  const supabase = await createClient();

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

  // TODO: Declencher le webhook n8n pour notification artisan (Epic 4)
  // await triggerN8nNotification(lead.id);

  return {
    success: true,
    leadId: lead.id,
  };
}
