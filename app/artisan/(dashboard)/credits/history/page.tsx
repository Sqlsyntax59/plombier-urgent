"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Receipt,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";

interface Purchase {
  id: string;
  pack_name: string;
  credits_purchased: number;
  amount_cents: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  created_at: string;
  completed_at: string | null;
  lemonsqueezy_order_id: string;
}

const STATUS_CONFIG = {
  pending: {
    label: "En attente",
    icon: Clock,
    variant: "secondary" as const,
    color: "text-amber-600",
  },
  completed: {
    label: "Complété",
    icon: CheckCircle,
    variant: "default" as const,
    color: "text-green-600",
  },
  failed: {
    label: "Échoué",
    icon: XCircle,
    variant: "destructive" as const,
    color: "text-red-600",
  },
  refunded: {
    label: "Remboursé",
    icon: RefreshCw,
    variant: "outline" as const,
    color: "text-slate-600",
  },
};

export default function CreditsHistoryPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);

  useEffect(() => {
    async function fetchHistory() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("credit_purchases")
        .select("*")
        .eq("artisan_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setPurchases(data);
        const completed = data.filter((p) => p.status === "completed");
        setTotalSpent(completed.reduce((sum, p) => sum + p.amount_cents, 0) / 100);
        setTotalCredits(completed.reduce((sum, p) => sum + p.credits_purchased, 0));
      }

      setLoading(false);
    }

    fetchHistory();
  }, []);

  const handleDownloadReceipt = (purchaseId: string) => {
    window.open(`/api/artisan/receipt/${purchaseId}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="mt-4 text-slate-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button asChild variant="ghost" size="sm" className="h-8 px-2">
              <Link href="/artisan/credits">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Retour
              </Link>
            </Button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Historique des achats
          </h1>
          <p className="text-slate-500 mt-1">
            Retrouvez tous vos achats de crédits et téléchargez vos reçus.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Total dépensé</p>
                <p className="text-2xl font-bold text-slate-900">{totalSpent.toFixed(2)} €</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Crédits achetés</p>
                <p className="text-2xl font-bold text-slate-900">{totalCredits} crédits</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {purchases.length === 0 ? (
        <Card className="bg-white/80">
          <CardContent className="py-16 text-center">
            <Receipt className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700 mb-2">Aucun achat</h3>
            <p className="text-slate-500 mb-6">Vous n&apos;avez pas encore acheté de crédits.</p>
            <Button asChild>
              <Link href="/artisan/credits">Acheter des crédits</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => {
            const statusConfig = STATUS_CONFIG[purchase.status];
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={purchase.id} className="bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <Receipt className="h-6 w-6 text-slate-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900">{purchase.pack_name}</span>
                          <Badge variant={statusConfig.variant}>
                            <StatusIcon className={`h-3 w-3 mr-1 ${statusConfig.color}`} />
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500">
                          {new Date(purchase.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                          {" • Réf. #"}{purchase.lemonsqueezy_order_id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 sm:gap-6">
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{(purchase.amount_cents / 100).toFixed(2)} €</p>
                        <p className="text-sm text-slate-500">+{purchase.credits_purchased} crédits</p>
                      </div>
                      {purchase.status === "completed" && (
                        <Button variant="outline" size="sm" onClick={() => handleDownloadReceipt(purchase.id)}>
                          <Download className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Reçu</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
