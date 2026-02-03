import { createAdminClient } from "@/lib/supabase/server";
import type { Profile, Lead } from "@/types/database.types";

interface AttributionResult {
  success: boolean;
  artisan?: {
    id: string;
    firstName: string;
    phone: string;
    whatsappPhone: string | null;
    city: string | null;
    credits: number;
  };
  assignmentId?: string;
  error?: string;
  noArtisanAvailable?: boolean;
}

interface AttributionCriteria {
  leadId: string;
  verticalId: string | null;
  cascadePosition: number;
  excludeArtisanIds?: string[];
}

/**
 * Algorithme d'attribution prioritaire.
 *
 * Critères de sélection (par priorité):
 * 1. Artisan actif (is_active = true)
 * 2. Crédits > 0
 * 3. Même verticale que le lead
 * 4. Non déjà notifié pour ce lead
 * 5. (Futur: distance < rayon d'action)
 *
 * Retourne l'artisan sélectionné et crée l'assignment.
 */
export async function findBestArtisan(
  criteria: AttributionCriteria
): Promise<AttributionResult> {
  const { leadId, verticalId, cascadePosition, excludeArtisanIds = [] } = criteria;

  const supabase = createAdminClient();

  // 1. Récupérer les artisans déjà notifiés pour ce lead
  const { data: existingAssignments } = await supabase
    .from("lead_assignments")
    .select("artisan_id")
    .eq("lead_id", leadId);

  const alreadyNotifiedIds = existingAssignments?.map((a) => a.artisan_id) || [];
  const allExcludedIds = [...new Set([...excludeArtisanIds, ...alreadyNotifiedIds])];

  // 2. Construire la requête pour trouver l'artisan prioritaire
  let query = supabase
    .from("profiles")
    .select("id, first_name, phone, whatsapp_phone, city, credits")
    .eq("role", "artisan")
    .eq("is_active", true)
    .gt("credits", 0);

  // Filtrer par verticale si spécifié
  if (verticalId) {
    query = query.eq("vertical_id", verticalId);
  }

  // Exclure les artisans déjà notifiés
  if (allExcludedIds.length > 0) {
    query = query.not("id", "in", `(${allExcludedIds.join(",")})`);
  }

  // Ordonner par crédits décroissants (priorité aux plus actifs)
  // puis par date de création (ancienneté)
  query = query.order("credits", { ascending: false }).order("created_at", { ascending: true });

  // Limiter à 1 résultat
  query = query.limit(1);

  const { data: artisans, error: artisanError } = await query;

  if (artisanError) {
    console.error("Erreur recherche artisan:", artisanError);
    return { success: false, error: "Erreur recherche artisan" };
  }

  if (!artisans || artisans.length === 0) {
    return {
      success: false,
      noArtisanAvailable: true,
      error: "Aucun artisan disponible",
    };
  }

  const artisan = artisans[0];

  // 3. Créer l'assignment
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

  const { data: assignment, error: assignmentError } = await supabase
    .from("lead_assignments")
    .insert({
      lead_id: leadId,
      artisan_id: artisan.id,
      cascade_position: cascadePosition,
      status: "pending",
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (assignmentError) {
    console.error("Erreur création assignment:", assignmentError);
    return { success: false, error: "Erreur création attribution" };
  }

  // 4. Mettre à jour le compteur de cascade du lead
  await supabase
    .from("leads")
    .update({ cascade_count: cascadePosition })
    .eq("id", leadId);

  return {
    success: true,
    artisan: {
      id: artisan.id,
      firstName: artisan.first_name || "Artisan",
      phone: artisan.phone || "",
      whatsappPhone: artisan.whatsapp_phone,
      city: artisan.city,
      credits: artisan.credits,
    },
    assignmentId: assignment.id,
  };
}

/**
 * Récupère le prochain artisan à notifier dans la cascade.
 * Appelé par n8n après expiration du timer 2 minutes.
 */
export async function getNextArtisanInCascade(
  leadId: string
): Promise<AttributionResult> {
  const supabase = createAdminClient();

  // Récupérer le lead pour avoir la verticale et le cascade_count
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("vertical_id, cascade_count, status")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) {
    return { success: false, error: "Lead non trouvé" };
  }

  // Vérifier que le lead est toujours en pending
  if (lead.status !== "pending") {
    return { success: false, error: "Lead déjà traité" };
  }

  const nextPosition = (lead.cascade_count || 0) + 1;

  // Maximum 3 artisans en cascade normale, 4 si > 4 minutes
  if (nextPosition > 4) {
    // Marquer le lead comme unassigned
    await supabase.from("leads").update({ status: "unassigned" }).eq("id", leadId);
    return { success: false, noArtisanAvailable: true, error: "Cascade terminée" };
  }

  return findBestArtisan({
    leadId,
    verticalId: lead.vertical_id,
    cascadePosition: nextPosition,
  });
}

/**
 * Expire les assignments en attente qui ont dépassé leur délai.
 * Appelé par un cron job ou un workflow n8n.
 */
export async function expirePendingAssignments(): Promise<{
  expired: number;
  error?: string;
}> {
  const supabase = createAdminClient();

  const now = new Date().toISOString();

  const { data: expiredAssignments, error } = await supabase
    .from("lead_assignments")
    .update({ status: "expired" })
    .eq("status", "pending")
    .lt("expires_at", now)
    .select("id, lead_id");

  if (error) {
    console.error("Erreur expiration assignments:", error);
    return { expired: 0, error: "Erreur expiration" };
  }

  return { expired: expiredAssignments?.length || 0 };
}
