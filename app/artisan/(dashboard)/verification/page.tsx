"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Shield,
  Building2,
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  insuranceSchema,
  type InsuranceInput,
} from "@/lib/validations/artisan";
import {
  updateInsurance,
  getVerificationStatus,
} from "@/lib/actions/verification";

export default function VerificationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const form = useForm<InsuranceInput>({
    resolver: zodResolver(insuranceSchema),
    defaultValues: {
      insuranceProvider: "",
      insurancePolicyNumber: "",
      insuranceValidUntil: "",
      insuranceAttestationPath: "",
    },
  });

  // Charger le statut actuel
  useEffect(() => {
    async function loadStatus() {
      const result = await getVerificationStatus();
      setStatus(result.status);
      setStatusLoading(false);
    }
    loadStatus();
  }, []);

  async function onSubmit(data: InsuranceInput) {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const result = await updateInsurance(data);

    if (result.success) {
      setSuccess(result.message || "Informations enregistrées");
      setStatus("pending_verification");
    } else {
      setError(result.error || "Une erreur est survenue");
    }

    setIsLoading(false);
  }

  // Affichage selon le statut
  if (statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Déjà vérifié
  if (status === "verified") {
    return (
      <div className="max-w-lg mx-auto py-8 px-4">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-green-800 mb-2">
                Compte vérifié
              </h2>
              <p className="text-green-600 mb-6">
                Votre compte est vérifié. Vous avez accès à toutes les
                fonctionnalités.
              </p>
              <Button onClick={() => router.push("/artisan/dashboard")}>
                Retour au dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // En attente de validation
  if (status === "pending_verification") {
    return (
      <div className="max-w-lg mx-auto py-8 px-4">
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-16 w-16 text-amber-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-amber-800 mb-2">
                Vérification en cours
              </h2>
              <p className="text-amber-600 mb-6">
                Vos informations d'assurance ont été transmises. Notre équipe les
                vérifie dans les plus brefs délais.
              </p>
              <Button
                variant="outline"
                onClick={() => router.push("/artisan/dashboard")}
              >
                Retour au dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Suspendu
  if (status === "suspended") {
    return (
      <div className="max-w-lg mx-auto py-8 px-4">
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-800 mb-2">
                Compte suspendu
              </h2>
              <p className="text-red-600">
                Votre compte a été suspendu. Veuillez contacter le support.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Formulaire assurance (status = registered)
  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
          <Shield className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Compléter ma vérification
        </h1>
        <p className="text-slate-500">
          Pour accéder aux leads et accepter des interventions, nous avons besoin
          de vos informations d'assurance professionnelle.
        </p>
      </div>

      <Card className="bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Assurance responsabilité civile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="insuranceProvider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-600 text-sm flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-400" />
                      Nom de l'assureur
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="AXA, MAAF, Allianz..."
                        {...field}
                        className="h-11 rounded-xl border-slate-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="insurancePolicyNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-600 text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-400" />
                      Numéro de police
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="123456789"
                        {...field}
                        className="h-11 rounded-xl border-slate-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="insuranceValidUntil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-600 text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      Date de validité
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        className="h-11 rounded-xl border-slate-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Message informatif */}
              <Alert className="bg-blue-50 border-blue-200">
                <Shield className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700 text-sm">
                  Ces informations permettent de sécuriser la plateforme et de
                  rassurer vos futurs clients.
                </AlertDescription>
              </Alert>

              {/* Erreur */}
              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {/* Succès */}
              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-700">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/25 rounded-xl font-semibold"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Soumettre pour vérification"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
