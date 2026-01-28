"use server";

import { createClient } from "@/lib/supabase/server";
import { artisanSignUpSchema, type ArtisanSignUpInput } from "@/lib/validations/artisan";
import { redirect } from "next/navigation";

export type SignUpResult = {
  success: boolean;
  error?: string;
};

export async function signUpArtisan(data: ArtisanSignUpInput): Promise<SignUpResult> {
  // Validation serveur
  const parsed = artisanSignUpSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Donnees invalides",
    };
  }

  const { email, password, firstName, lastName, phone, city, trade } = parsed.data;

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
