"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  Download,
  ArrowRight,
  CreditCard,
  Receipt,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

interface PurchaseDetails {
  id: string;
  pack_name: string;
  credits_purchased: number;
  amount_cents: number;
  currency: string;
  created_at: string;
  completed_at: string | null;
  lemonsqueezy_order_id: string;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const [purchase, setPurchase] = useState<PurchaseDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [newBalance, setNewBalance] = useState<number>(0);

  useEffect(() => {
    async function fetchPurchase() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Attendre un peu pour que le webhook soit traité
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Récupérer le dernier achat complété
      const { data: purchaseData } = await supabase
        .from("credit_purchases")
        .select("*")
        .eq("artisan_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .single();

      if (purchaseData) {
        setPurchase(purchaseData);
      }

      // Récupérer le solde actuel
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();

      setNewBalance(profile?.credits ?? 0);
      setLoading(false);
    }

    fetchPurchase();
  }, [searchParams]);

  const handleDownloadReceipt = () => {
    if (!purchase) return;
    window.open(`/api/artisan/receipt/${purchase.id}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="mt-4 text-slate-500">Vérification du paiement...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Success Header */}
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Paiement confirmé !
        </h1>
        <p className="text-slate-500">
          Vos crédits ont été ajoutés à votre compte instantanément.
        </p>
      </div>

      {/* New Balance */}
      <Card className="border-2 border-green-400/50 shadow-xl shadow-green-600/20 bg-gradient-to-r from-green-600 to-emerald-500 text-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium mb-1">
                Nouveau solde
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{newBalance}</span>
                <span className="text-green-100">crédits</span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <CreditCard className="h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Details */}
      {purchase && (
        <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Receipt className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-slate-800">
                Détails de l&apos;achat
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-slate-500">Référence</span>
                <span className="font-medium text-slate-900">
                  #{purchase.lemonsqueezy_order_id}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-slate-500">Pack</span>
                <span className="font-medium text-slate-900">
                  {purchase.pack_name}
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-slate-500">Crédits achetés</span>
                <span className="font-medium text-slate-900">
                  +{purchase.credits_purchased} crédits
                </span>
              </div>
              <div className="flex justify-between py-3 border-b border-slate-100">
                <span className="text-slate-500">Montant</span>
                <span className="font-bold text-slate-900">
                  {(purchase.amount_cents / 100).toFixed(2)} €
                </span>
              </div>
              <div className="flex justify-between py-3">
                <span className="text-slate-500">Date</span>
                <span className="text-slate-900">
                  {new Date(
                    purchase.completed_at || purchase.created_at
                  ).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full mt-6"
              onClick={handleDownloadReceipt}
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger le reçu
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild className="flex-1 h-12 bg-blue-600 hover:bg-blue-700">
          <Link href="/artisan/leads">
            Voir mes leads
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1 h-12">
          <Link href="/artisan/credits/history">Historique des achats</Link>
        </Button>
      </div>
    </div>
  );
}

export default function CreditsSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="mt-4 text-slate-500">Chargement...</p>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
