"use client";

import Link from "next/link";
import { Shield, AlertCircle, Clock, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { VerificationStatus } from "@/types/database.types";

interface VerificationBannerProps {
  status: VerificationStatus | null;
  compact?: boolean;
}

/**
 * Bannière affichant le statut de vérification de l'artisan
 * avec CTA vers la page de vérification si nécessaire
 */
export function VerificationBanner({
  status,
  compact = false,
}: VerificationBannerProps) {
  // Pas de bannière si vérifié
  if (status === "verified") {
    return null;
  }

  // Suspendu
  if (status === "suspended") {
    return (
      <Alert className="bg-red-50 border-red-200 mb-4">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-700 flex items-center justify-between">
          <span>
            Votre compte est suspendu. Veuillez contacter le support.
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  // En attente de validation
  if (status === "pending_verification") {
    return (
      <Alert className="bg-amber-50 border-amber-200 mb-4">
        <Clock className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-700 flex items-center justify-between flex-wrap gap-2">
          <span>
            {compact
              ? "Vérification en cours..."
              : "Vos informations d'assurance sont en cours de vérification."}
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  // Registered - besoin de compléter la vérification
  return (
    <Alert className="bg-blue-50 border-blue-200 mb-4">
      <Shield className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-700 flex items-center justify-between flex-wrap gap-2">
        <span>
          {compact
            ? "Complétez votre vérification pour accéder aux leads"
            : "Pour accepter des interventions et voir les coordonnées clients, complétez votre vérification."}
        </span>
        <Button
          asChild
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Link href="/artisan/verification">
            Compléter
            <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Message bloquant pour les actions non autorisées
 */
export function VerificationBlocker({
  action,
}: {
  action: "accept_lead" | "buy_credits" | "view_contact";
}) {
  const messages = {
    accept_lead: "Vous devez compléter votre vérification pour accepter ce lead.",
    buy_credits: "Vous devez compléter votre vérification pour acheter des crédits.",
    view_contact:
      "Vous devez compléter votre vérification pour voir les coordonnées du client.",
  };

  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
      <Shield className="h-8 w-8 text-slate-400 mx-auto mb-2" />
      <p className="text-slate-600 text-sm mb-3">{messages[action]}</p>
      <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
        <Link href="/artisan/verification">
          Compléter ma vérification
          <ArrowRight className="ml-1 h-3 w-3" />
        </Link>
      </Button>
    </div>
  );
}
