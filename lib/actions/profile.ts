"use server";

import { createClient } from "@/lib/supabase/server";
import {
  whatsappConfigSchema,
  type WhatsAppConfigInput,
} from "@/lib/validations/artisan";
import { redirect } from "next/navigation";

export type ActionResult = {
  success: boolean;
  error?: string;
};

export async function updateWhatsAppConfig(
  data: WhatsAppConfigInput
): Promise<ActionResult> {
  // Validation serveur
  const parsed = whatsappConfigSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Donnees invalides",
    };
  }

  const { whatsappPhone } = parsed.data;

  const supabase = await createClient();

  // Verifier que l'utilisateur est connecte
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Vous devez etre connecte",
    };
  }

  // Normaliser le numero (supprimer espaces et tirets)
  const normalizedPhone = whatsappPhone.replace(/[\s.-]/g, "");

  // Mettre a jour le profil
  const { error } = await supabase
    .from("profiles")
    .update({
      whatsapp_phone: normalizedPhone,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Erreur mise a jour WhatsApp:", error);
    return {
      success: false,
      error: "Erreur lors de la sauvegarde",
    };
  }

  // Redirection vers le dashboard
  redirect("/artisan/dashboard");
}

// Recuperer le profil de l'utilisateur connecte
export async function getCurrentProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile;
}

// Type pour le profil public (donnees visibles par tous)
export type PublicProfile = {
  first_name: string;
  city: string | null;
  trade: string | null;
  radius_km: number | null;
  google_business_url: string | null;
  // Metriques calculees (placeholder pour l'instant)
  is_reactive: boolean;
  response_time_avg: number | null;
};

// Recuperer le profil public d'un artisan par son slug
export async function getPublicProfile(
  slug: string
): Promise<PublicProfile | null> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "first_name, city, trade, radius_km, google_business_url"
    )
    .eq("slug", slug)
    .eq("role", "artisan")
    .single();

  if (error || !profile) {
    return null;
  }

  // Pour l'instant, placeholder pour les metriques de reactivite
  // Sera calcule depuis la table leads dans une story future
  return {
    ...profile,
    is_reactive: true, // Placeholder
    response_time_avg: null, // Sera calcule depuis leads
  };
}
