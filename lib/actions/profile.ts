"use server";

import { createClient } from "@/lib/supabase/server";
import {
  whatsappConfigSchema,
  profileUpdateSchema,
  type WhatsAppConfigInput,
  type ProfileUpdateInput,
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
  // Metriques calculees
  is_reactive: boolean;
  response_time_avg: number | null;
  // Ratings Epic 7
  average_rating: number | null;
  total_reviews: number;
};

// Recuperer le profil public d'un artisan par son slug
export async function getPublicProfile(
  slug: string
): Promise<PublicProfile | null> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "first_name, city, trade, radius_km, google_business_url, average_rating, total_reviews, is_reactive, reactive_score"
    )
    .eq("slug", slug)
    .eq("role", "artisan")
    .single();

  if (error || !profile) {
    return null;
  }

  return {
    ...profile,
    is_reactive: profile.is_reactive ?? false,
    response_time_avg: null,
    average_rating: profile.average_rating || null,
    total_reviews: profile.total_reviews || 0,
  };
}

// Generer un slug unique a partir du prenom et de la ville
function generateSlug(firstName: string, city: string): string {
  const base = `${firstName}-${city}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Supprimer accents
    .replace(/[^a-z0-9]+/g, "-") // Remplacer caracteres speciaux par -
    .replace(/^-|-$/g, ""); // Supprimer - en debut/fin

  // Ajouter un suffixe aleatoire pour l'unicite
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

// Mettre a jour le profil complet de l'artisan
export async function updateProfile(
  data: ProfileUpdateInput
): Promise<ActionResult> {
  const parsed = profileUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Donnees invalides",
    };
  }

  const {
    firstName,
    lastName,
    phone,
    whatsappPhone,
    city,
    radiusKm,
    googleBusinessUrl,
  } = parsed.data;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Vous devez etre connecte",
    };
  }

  // Verifier si le profil a deja un slug
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("slug")
    .eq("id", user.id)
    .single();

  // Generer un slug si pas existant
  const slug = existingProfile?.slug || generateSlug(firstName, city);

  // Normaliser les numeros de telephone
  const normalizedPhone = phone.replace(/[\s.-]/g, "");
  const normalizedWhatsApp = whatsappPhone
    ? whatsappPhone.replace(/[\s.-]/g, "")
    : null;

  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      phone: normalizedPhone,
      whatsapp_phone: normalizedWhatsApp,
      city,
      radius_km: radiusKm,
      google_business_url: googleBusinessUrl || null,
      slug,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Erreur mise a jour profil:", error);
    return {
      success: false,
      error: "Erreur lors de la sauvegarde",
    };
  }

  return {
    success: true,
  };
}
