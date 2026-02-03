"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { VerificationStatus } from "@/types/database.types";

interface VerificationState {
  isLoading: boolean;
  isVerified: boolean;
  status: VerificationStatus | null;
  canAcceptLeads: boolean;
  canBuyCredits: boolean;
  canViewClientInfo: boolean;
}

/**
 * Hook pour vérifier le statut de vérification de l'artisan
 * et contrôler l'accès aux fonctionnalités payantes
 */
export function useVerificationGuard(): VerificationState {
  const [state, setState] = useState<VerificationState>({
    isLoading: true,
    isVerified: false,
    status: null,
    canAcceptLeads: false,
    canBuyCredits: false,
    canViewClientInfo: false,
  });

  useEffect(() => {
    async function checkVerification() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setState({
          isLoading: false,
          isVerified: false,
          status: null,
          canAcceptLeads: false,
          canBuyCredits: false,
          canViewClientInfo: false,
        });
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("verification_status")
        .eq("id", user.id)
        .single();

      const status = (profile?.verification_status as VerificationStatus) || "registered";
      const isVerified = status === "verified";

      setState({
        isLoading: false,
        isVerified,
        status,
        canAcceptLeads: isVerified,
        canBuyCredits: isVerified,
        canViewClientInfo: isVerified,
      });
    }

    checkVerification();
  }, []);

  return state;
}

/**
 * Vérifie côté serveur si l'artisan peut effectuer une action payante
 * À utiliser dans les Server Actions
 */
export async function checkVerificationServer(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<{
  allowed: boolean;
  status: VerificationStatus | null;
  error?: string;
}> {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("verification_status")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    return {
      allowed: false,
      status: null,
      error: "Profil introuvable",
    };
  }

  const status = profile.verification_status as VerificationStatus;

  if (status !== "verified") {
    return {
      allowed: false,
      status,
      error: "Votre compte doit être vérifié pour effectuer cette action",
    };
  }

  return {
    allowed: true,
    status,
  };
}
