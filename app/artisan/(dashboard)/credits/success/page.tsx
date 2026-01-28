"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, ArrowRight, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function CreditsSuccessPage() {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCredits() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits")
          .eq("id", user.id)
          .single();

        setCredits(profile?.credits ?? 0);
      }
      setLoading(false);
    }

    // Attendre un peu pour que le webhook soit traite
    const timer = setTimeout(fetchCredits, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="max-w-md mx-auto py-12">
      <Card className="text-center">
        <CardContent className="py-8">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-800 mb-2">
              Paiement reussi !
            </h2>
            <p className="text-muted-foreground">
              Vos credits ont ete ajoutes a votre compte.
            </p>
          </div>

          {!loading && credits !== null && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-600 mb-1">Votre nouveau solde</p>
              <p className="text-3xl font-bold text-blue-800 flex items-center justify-center gap-2">
                <CreditCard className="h-6 w-6" />
                {credits} credits
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/artisan/leads">
                Voir mes leads
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/artisan/dashboard">
                Retour au dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
