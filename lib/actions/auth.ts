"use server";

import { createClient } from "@/lib/supabase/server";
import {
  artisanSignUpSchema,
  loginPasswordSchema,
  magicLinkSchema,
  type ArtisanSignUpInput,
  type LoginPasswordInput,
  type MagicLinkInput,
} from "@/lib/validations/artisan";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export type AuthResult = {
  success: boolean;
  error?: string;
  message?: string;
};

export async function signUpArtisan(data: ArtisanSignUpInput): Promise<AuthResult> {
  // Validation serveur
  const parsed = artisanSignUpSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Donnees invalides",
    };
  }

  const { email, password, firstName, lastName, phone, city, trade, specializations } = parsed.data;

  const supabase = await createClient();

  // 1. Creer le compte Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  if (authError) {
    // Gestion des erreurs courantes
    if (authError.message.includes("already registered")) {
      return {
        success: false,
        error: "Cette adresse email est deja utilisee",
      };
    }
    return {
      success: false,
      error: authError.message,
    };
  }

  if (!authData.user) {
    return {
      success: false,
      error: "Erreur lors de la creation du compte",
    };
  }

  // 2. Mettre a jour le profil avec les infos supplementaires
  // Note: Le trigger handle_new_user cree automatiquement le profil vide
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      phone,
      city,
      trade,
      specializations,
      email,
      role: "artisan",
      cgv_accepted_at: new Date().toISOString(),
    })
    .eq("id", authData.user.id);

  if (profileError) {
    console.error("Erreur mise a jour profil:", profileError);
    // On ne bloque pas l'inscription, le profil peut etre complete plus tard
  }

  // 3. Redirection vers configuration WhatsApp
  redirect("/artisan/whatsapp");
}

// Connexion avec mot de passe
export async function loginWithPassword(
  data: LoginPasswordInput
): Promise<AuthResult> {
  const parsed = loginPasswordSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Donnees invalides",
    };
  }

  const { email, password } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      return {
        success: false,
        error: "Email ou mot de passe incorrect",
      };
    }
    return {
      success: false,
      error: error.message,
    };
  }

  redirect("/artisan/dashboard");
}

// Envoi magic link
export async function sendMagicLink(data: MagicLinkInput): Promise<AuthResult> {
  const parsed = magicLinkSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Donnees invalides",
    };
  }

  const { email } = parsed.data;
  const supabase = await createClient();

  // Obtenir l'URL de base avec redirect vers dashboard artisan
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const redirectTo = `${protocol}://${host}/auth/confirm?next=/artisan/dashboard`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Un email avec le lien de connexion a ete envoye",
  };
}

// Deconnexion
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
