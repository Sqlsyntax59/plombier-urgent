"use server";

import { createClient } from "@/lib/supabase/server";
import { insuranceSchema, type InsuranceInput } from "@/lib/validations/artisan";
import { revalidatePath } from "next/cache";

export type VerificationResult = {
  success: boolean;
  error?: string;
  message?: string;
};

/**
 * Met à jour les informations d'assurance de l'artisan
 * Transition: registered → pending_verification
 */
export async function updateInsurance(
  data: InsuranceInput
): Promise<VerificationResult> {
  // Validation serveur
  const parsed = insuranceSchema.safeParse(data);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Données invalides",
    };
  }

  const {
    insuranceProvider,
    insurancePolicyNumber,
    insuranceValidUntil,
    insuranceAttestationPath,
  } = parsed.data;

  const supabase = await createClient();

  // Vérifier l'utilisateur connecté
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      success: false,
      error: "Vous devez être connecté",
    };
  }

  // Vérifier que l'artisan est en status 'registered'
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("verification_status")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      success: false,
      error: "Profil introuvable",
    };
  }

  // Ne pas permettre si déjà verified ou suspended
  if (profile.verification_status === "verified") {
    return {
      success: false,
      error: "Votre compte est déjà vérifié",
    };
  }

  if (profile.verification_status === "suspended") {
    return {
      success: false,
      error: "Votre compte est suspendu",
    };
  }

  // Mettre à jour le profil avec les infos d'assurance
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      insurance_provider: insuranceProvider,
      insurance_policy_number: insurancePolicyNumber,
      insurance_valid_until: insuranceValidUntil,
      insurance_attestation_path: insuranceAttestationPath || null,
      verification_status: "pending_verification",
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("Erreur mise à jour assurance:", updateError);
    return {
      success: false,
      error: "Erreur lors de la mise à jour",
    };
  }

  revalidatePath("/artisan/dashboard");
  revalidatePath("/artisan/verification");

  return {
    success: true,
    message: "Vos informations d'assurance ont été enregistrées. Validation en cours.",
  };
}

/**
 * Récupère le statut de vérification de l'artisan connecté
 */
export async function getVerificationStatus(): Promise<{
  status: string | null;
  siretVerified: boolean;
  insuranceProvider: string | null;
  error?: string;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      status: null,
      siretVerified: false,
      insuranceProvider: null,
      error: "Non connecté",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("verification_status, siret_verified, insurance_provider")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return {
      status: null,
      siretVerified: false,
      insuranceProvider: null,
      error: "Profil introuvable",
    };
  }

  return {
    status: profile.verification_status,
    siretVerified: profile.siret_verified || false,
    insuranceProvider: profile.insurance_provider,
  };
}
