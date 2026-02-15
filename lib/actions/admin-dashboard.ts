"use server";

import { createClient } from "@/lib/supabase/server";
import type { Profile, Lead, LeadStatus, AssignmentStatus } from "@/types/database.types";

// Types pour l'admin
export type AdminStats = {
  activeArtisans: number;
  suspendedArtisans: number;
  leadsToday: number;
  leadsThisMonth: number;
  acceptedLeadsToday: number;
  revenueThisMonth: number;
  totalVerticals: number;
  avgResponseTime: number;
  reclamationsCount: number;
};

export type ArtisanListItem = Profile & {
  leadsAccepted: number;
  leadsExpired: number;
  consecutiveExpired: number;
};

export type LeadWithArtisan = Lead & {
  artisan?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    city: string | null;
  } | null;
  assignmentStatus?: AssignmentStatus;
};

export type Reclamation = {
  id: string;
  lead_id: string;
  artisan_id: string;
  satisfied: boolean;
  rating: number | null;
  comment: string | null;
  issues: string[] | null;
  submitted_at: string;
  lead: Lead;
  artisan: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
  };
};

/**
 * Verifie que l'utilisateur est admin
 */
async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { supabase: null, error: "Non authentifie" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    return { supabase: null, error: "Acces non autorise" };
  }

  // Verifier MFA (AAL2) pour les admins
  const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!aalData || aalData.currentLevel !== "aal2") {
    return { supabase: null, error: "MFA requis — veuillez verifier votre code 2FA" };
  }

  return { supabase, error: null };
}

/**
 * Recupere les statistiques globales du dashboard admin
 */
export async function getAdminStats(): Promise<{
  data: AdminStats | null;
  error: string | null;
}> {
  const { supabase, error: authError } = await verifyAdmin();
  if (authError || !supabase) {
    return { data: null, error: authError };
  }

  // Dates de reference
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now);
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Artisans actifs/suspendus
  const { data: artisans } = await supabase
    .from("profiles")
    .select("is_active, is_suspended")
    .eq("role", "artisan");

  const activeArtisans = artisans?.filter(a => a.is_active && !a.is_suspended).length || 0;
  const suspendedArtisans = artisans?.filter(a => a.is_suspended).length || 0;

  // Leads aujourd'hui
  const { data: leadsToday } = await supabase
    .from("leads")
    .select("id, status")
    .gte("created_at", startOfDay.toISOString());

  // Leads ce mois
  const { data: leadsMonth } = await supabase
    .from("leads")
    .select("id")
    .gte("created_at", startOfMonth.toISOString());

  // Leads acceptes aujourd'hui
  const acceptedToday = leadsToday?.filter(l => l.status === "accepted" || l.status === "completed").length || 0;

  // Revenus du mois (achats completes)
  const { data: purchases } = await supabase
    .from("credit_purchases")
    .select("amount_cents")
    .eq("status", "completed")
    .gte("completed_at", startOfMonth.toISOString());

  const revenueThisMonth = purchases?.reduce((sum, p) => sum + (p.amount_cents || 0), 0) || 0;

  // Verticales
  const { count: verticalCount } = await supabase
    .from("verticals")
    .select("id", { count: "exact", head: true });

  // Temps de reponse moyen (leads acceptes cette semaine)
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { data: assignments } = await supabase
    .from("lead_assignments")
    .select("notified_at, responded_at")
    .eq("status", "accepted")
    .gte("responded_at", weekAgo.toISOString());

  let avgResponseTime = 0;
  if (assignments && assignments.length > 0) {
    const times = assignments
      .filter(a => a.notified_at && a.responded_at)
      .map(a => {
        const notified = new Date(a.notified_at!).getTime();
        const responded = new Date(a.responded_at!).getTime();
        return (responded - notified) / 1000; // secondes
      });
    avgResponseTime = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  }

  // Reclamations (feedbacks negatifs)
  const { count: reclamationsCount } = await supabase
    .from("client_feedbacks")
    .select("id", { count: "exact", head: true })
    .eq("satisfied", false)
    .not("submitted_at", "is", null);

  return {
    data: {
      activeArtisans,
      suspendedArtisans,
      leadsToday: leadsToday?.length || 0,
      leadsThisMonth: leadsMonth?.length || 0,
      acceptedLeadsToday: acceptedToday,
      revenueThisMonth,
      totalVerticals: verticalCount || 0,
      avgResponseTime,
      reclamationsCount: reclamationsCount || 0,
    },
    error: null,
  };
}

/**
 * Recupere la liste des artisans avec filtres
 */
export async function getArtisansList(filters?: {
  status?: "active" | "inactive" | "suspended" | "all";
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  data: ArtisanListItem[];
  total: number;
  error: string | null;
}> {
  const { supabase, error: authError } = await verifyAdmin();
  if (authError || !supabase) {
    return { data: [], total: 0, error: authError };
  }

  const limit = filters?.limit || 20;
  const offset = filters?.offset || 0;

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .eq("role", "artisan")
    .order("created_at", { ascending: false });

  // Filtre par statut
  if (filters?.status && filters.status !== "all") {
    if (filters.status === "active") {
      query = query.eq("is_active", true).eq("is_suspended", false);
    } else if (filters.status === "inactive") {
      query = query.eq("is_active", false);
    } else if (filters.status === "suspended") {
      query = query.eq("is_suspended", true);
    }
  }

  // Recherche par nom ou ville
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},city.ilike.${searchTerm}`);
  }

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data: profiles, count, error } = await query;

  if (error) {
    return { data: [], total: 0, error: error.message };
  }

  // Pour chaque artisan, recuperer les stats d'assignments
  const artisansWithStats: ArtisanListItem[] = await Promise.all(
    (profiles || []).map(async (profile) => {
      // Compter les leads acceptes
      const { count: accepted } = await supabase
        .from("lead_assignments")
        .select("id", { count: "exact", head: true })
        .eq("artisan_id", profile.id)
        .eq("status", "accepted");

      // Compter les leads expires
      const { count: expired } = await supabase
        .from("lead_assignments")
        .select("id", { count: "exact", head: true })
        .eq("artisan_id", profile.id)
        .eq("status", "expired");

      // Compter les leads expires consecutifs recents
      const { data: recentAssignments } = await supabase
        .from("lead_assignments")
        .select("status")
        .eq("artisan_id", profile.id)
        .order("notified_at", { ascending: false })
        .limit(10);

      let consecutiveExpired = 0;
      if (recentAssignments) {
        for (const a of recentAssignments) {
          if (a.status === "expired") {
            consecutiveExpired++;
          } else {
            break;
          }
        }
      }

      return {
        ...profile,
        leadsAccepted: accepted || 0,
        leadsExpired: expired || 0,
        consecutiveExpired,
      };
    })
  );

  return {
    data: artisansWithStats,
    total: count || 0,
    error: null,
  };
}

/**
 * Active ou desactive un artisan
 */
export async function updateArtisanStatus(
  artisanId: string,
  action: "activate" | "deactivate" | "suspend" | "unsuspend"
): Promise<{ success: boolean; error: string | null }> {
  const { supabase, error: authError } = await verifyAdmin();
  if (authError || !supabase) {
    return { success: false, error: authError };
  }

  const updates: { is_active?: boolean; is_suspended?: boolean } = {};

  switch (action) {
    case "activate":
      updates.is_active = true;
      updates.is_suspended = false;
      break;
    case "deactivate":
      updates.is_active = false;
      break;
    case "suspend":
      updates.is_suspended = true;
      break;
    case "unsuspend":
      updates.is_suspended = false;
      break;
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", artisanId)
    .eq("role", "artisan");

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * Credite des leads gratuits a un artisan
 */
export async function creditArtisan(
  artisanId: string,
  credits: number,
  reason?: string
): Promise<{ success: boolean; error: string | null }> {
  const { supabase, error: authError } = await verifyAdmin();
  if (authError || !supabase) {
    return { success: false, error: authError };
  }

  if (credits <= 0 || credits > 100) {
    return { success: false, error: "Nombre de credits invalide (1-100)" };
  }

  // Recuperer credits actuels
  const { data: profile } = await supabase
    .from("profiles")
    .select("credits")
    .eq("id", artisanId)
    .single();

  if (!profile) {
    return { success: false, error: "Artisan non trouve" };
  }

  // Mettre a jour les credits
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ credits: profile.credits + credits })
    .eq("id", artisanId);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Enregistrer l'achat gratuit
  await supabase.from("credit_purchases").insert({
    artisan_id: artisanId,
    pack_name: `Cadeau admin: ${reason || "compensation"}`,
    credits_purchased: credits,
    amount_cents: 0,
    status: "completed",
    completed_at: new Date().toISOString(),
  });

  return { success: true, error: null };
}

/**
 * Recupere l'historique des leads avec filtres
 */
export async function getLeadsHistory(filters?: {
  status?: LeadStatus | "all";
  dateFrom?: string;
  dateTo?: string;
  artisanId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  data: LeadWithArtisan[];
  total: number;
  error: string | null;
}> {
  const { supabase, error: authError } = await verifyAdmin();
  if (authError || !supabase) {
    return { data: [], total: 0, error: authError };
  }

  const limit = filters?.limit || 20;
  const offset = filters?.offset || 0;

  let query = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  // Filtre par statut
  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  // Filtre par date
  if (filters?.dateFrom) {
    query = query.gte("created_at", filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte("created_at", filters.dateTo);
  }

  // Recherche par ville ou telephone
  if (filters?.search) {
    const searchTerm = `%${filters.search}%`;
    query = query.or(`client_city.ilike.${searchTerm},client_phone.ilike.${searchTerm}`);
  }

  // Pagination
  query = query.range(offset, offset + limit - 1);

  const { data: leads, count, error } = await query;

  if (error) {
    return { data: [], total: 0, error: error.message };
  }

  // Pour chaque lead, recuperer l'artisan assigne
  const leadsWithArtisan: LeadWithArtisan[] = await Promise.all(
    (leads || []).map(async (lead) => {
      const { data: assignment } = await supabase
        .from("lead_assignments")
        .select(`
          status,
          artisan:profiles(id, first_name, last_name, city)
        `)
        .eq("lead_id", lead.id)
        .eq("status", "accepted")
        .single();

      return {
        ...lead,
        artisan: assignment?.artisan as LeadWithArtisan["artisan"],
        assignmentStatus: assignment?.status as AssignmentStatus,
      };
    })
  );

  // Filtre additionnel par artisan si specifie
  let filteredLeads = leadsWithArtisan;
  if (filters?.artisanId) {
    filteredLeads = leadsWithArtisan.filter(l => l.artisan?.id === filters.artisanId);
  }

  return {
    data: filteredLeads,
    total: count || 0,
    error: null,
  };
}

/**
 * Recupere les reclamations (feedbacks negatifs)
 */
export async function getReclamations(filters?: {
  resolved?: boolean;
  limit?: number;
  offset?: number;
}): Promise<{
  data: Reclamation[];
  total: number;
  error: string | null;
}> {
  const { supabase, error: authError } = await verifyAdmin();
  if (authError || !supabase) {
    return { data: [], total: 0, error: authError };
  }

  const limit = filters?.limit || 20;
  const offset = filters?.offset || 0;

  const { data, count, error } = await supabase
    .from("client_feedbacks")
    .select(`
      *,
      lead:leads!lead_id(*),
      artisan:profiles!artisan_id(id, first_name, last_name, phone)
    `, { count: "exact" })
    .eq("satisfied", false)
    .not("submitted_at", "is", null)
    .order("submitted_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return { data: [], total: 0, error: error.message };
  }

  return {
    data: (data || []) as unknown as Reclamation[],
    total: count || 0,
    error: null,
  };
}

/**
 * Verifie et suspend automatiquement les artisans avec 3 leads rates consecutifs
 */
export async function checkAutoSuspend(): Promise<{
  suspended: string[];
  error: string | null;
}> {
  const { supabase, error: authError } = await verifyAdmin();
  if (authError || !supabase) {
    return { suspended: [], error: authError };
  }

  // Recuperer tous les artisans actifs
  const { data: artisans } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "artisan")
    .eq("is_active", true)
    .eq("is_suspended", false);

  const suspended: string[] = [];

  for (const artisan of artisans || []) {
    // Recuperer les 3 derniers assignments
    const { data: lastAssignments } = await supabase
      .from("lead_assignments")
      .select("status")
      .eq("artisan_id", artisan.id)
      .order("notified_at", { ascending: false })
      .limit(3);

    // Verifier si les 3 derniers sont expires
    if (
      lastAssignments &&
      lastAssignments.length >= 3 &&
      lastAssignments.every(a => a.status === "expired")
    ) {
      // Suspendre l'artisan
      await supabase
        .from("profiles")
        .update({ is_suspended: true })
        .eq("id", artisan.id);

      suspended.push(artisan.id);
    }
  }

  return { suspended, error: null };
}
