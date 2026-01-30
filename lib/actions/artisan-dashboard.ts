"use server";

import { createClient } from "@/lib/supabase/server";
import type { LeadWithAssignment, Profile, AssignmentStatus } from "@/types/database.types";

/**
 * Recupere le profil de l'artisan connecte
 */
export async function getArtisanProfile(): Promise<{
  data: Profile | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: "Non authentifie" };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as Profile, error: null };
}

/**
 * Recupere les leads de l'artisan connecte
 * @param statusFilter Filtre optionnel par statut d'assignment
 */
export async function getArtisanLeads(statusFilter?: AssignmentStatus): Promise<{
  data: LeadWithAssignment[];
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: [], error: "Non authentifie" };
  }

  // Recuperer les assignments de l'artisan
  let query = supabase
    .from("lead_assignments")
    .select(`
      *,
      lead:leads(*)
    `)
    .eq("artisan_id", user.id)
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: assignments, error } = await query;

  if (error) {
    return { data: [], error: error.message };
  }

  // Transformer les donnees en LeadWithAssignment
  const leads: LeadWithAssignment[] = (assignments || [])
    .filter((a) => a.lead)
    .map((assignment) => ({
      ...assignment.lead,
      assignment: {
        id: assignment.id,
        lead_id: assignment.lead_id,
        artisan_id: assignment.artisan_id,
        cascade_position: assignment.cascade_position,
        status: assignment.status,
        notification_channel: assignment.notification_channel,
        notification_external_id: assignment.notification_external_id,
        notification_error: assignment.notification_error,
        notified_at: assignment.notified_at,
        expires_at: assignment.expires_at,
        responded_at: assignment.responded_at,
      },
    }));

  return { data: leads, error: null };
}

/**
 * Recupere un lead specifique par son ID d'assignment
 * Masque le numero de telephone si le lead n'est pas accepte
 */
export async function getLeadDetail(assignmentId: string): Promise<{
  data: LeadWithAssignment | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: "Non authentifie" };
  }

  const { data: assignment, error } = await supabase
    .from("lead_assignments")
    .select(`
      *,
      lead:leads(*)
    `)
    .eq("id", assignmentId)
    .eq("artisan_id", user.id)
    .single();

  if (error || !assignment?.lead) {
    return { data: null, error: error?.message || "Lead non trouve" };
  }

  const lead = assignment.lead as LeadWithAssignment;

  // Masquer le telephone si pas encore accepte
  const clientPhone =
    assignment.status === "accepted"
      ? lead.client_phone
      : maskPhoneNumber(lead.client_phone);

  return {
    data: {
      ...lead,
      client_phone: clientPhone,
      assignment: {
        id: assignment.id,
        lead_id: assignment.lead_id,
        artisan_id: assignment.artisan_id,
        cascade_position: assignment.cascade_position,
        status: assignment.status,
        notification_channel: assignment.notification_channel,
        notification_external_id: assignment.notification_external_id,
        notification_error: assignment.notification_error,
        notified_at: assignment.notified_at,
        expires_at: assignment.expires_at,
        responded_at: assignment.responded_at,
      },
    },
    error: null,
  };
}

/**
 * Recupere les statistiques du dashboard artisan
 */
export async function getArtisanStats(): Promise<{
  data: {
    credits: number;
    leadsThisMonth: number;
    acceptedLeads: number;
    completedLeads: number;
    conversionRate: number;
  } | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: "Non authentifie" };
  }

  // Recuperer le profil pour les credits
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", user.id)
    .single();

  // Debut du mois courant
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Recuperer les assignments du mois
  const { data: assignments } = await supabase
    .from("lead_assignments")
    .select("status, created_at")
    .eq("artisan_id", user.id)
    .gte("created_at", startOfMonth.toISOString());

  const leadsThisMonth = assignments?.length || 0;
  const acceptedLeads =
    assignments?.filter((a) => a.status === "accepted").length || 0;

  // Pour les leads completed, on regarde dans leads
  const { data: completedLeadsData } = await supabase
    .from("lead_assignments")
    .select(`
      id,
      lead:leads!inner(status)
    `)
    .eq("artisan_id", user.id)
    .eq("status", "accepted");

  const completedLeads = completedLeadsData?.filter(
    (a) => {
      const lead = a.lead as unknown as { status: string } | null;
      return lead?.status === "completed";
    }
  ).length || 0;

  const conversionRate =
    leadsThisMonth > 0 ? Math.round((acceptedLeads / leadsThisMonth) * 100) : 0;

  return {
    data: {
      credits: profile?.credits || 0,
      leadsThisMonth,
      acceptedLeads,
      completedLeads,
      conversionRate,
    },
    error: null,
  };
}

/**
 * Masque un numero de telephone (ex: 06 12 34 56 78 -> 06 ** ** ** 78)
 */
function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 6) return "** ** ** ** **";

  // Nettoyer le numero
  const cleaned = phone.replace(/\s/g, "");

  if (cleaned.length >= 10) {
    return `${cleaned.slice(0, 2)} ** ** ** ${cleaned.slice(-2)}`;
  }

  return "** ** ** ** **";
}
