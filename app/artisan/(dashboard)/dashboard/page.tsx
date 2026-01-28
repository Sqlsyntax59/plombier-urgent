"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

interface DashboardStats {
  credits: number;
  leadsThisMonth: number;
}

export default function ArtisanDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Récupérer crédits du profil
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();

      // Compter leads acceptés ce mois
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: leadsCount } = await supabase
        .from("lead_assignments")
        .select("*", { count: "exact", head: true })
        .eq("artisan_id", user.id)
        .eq("status", "accepted")
        .gte("responded_at", startOfMonth.toISOString());

      setStats({
        credits: profile?.credits ?? 0,
        leadsThisMonth: leadsCount ?? 0,
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  const credits = stats?.credits ?? 0;
  const lowCredits = credits <= 2;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Bienvenue sur votre dashboard</h2>
        <p className="text-muted-foreground">
          Gerez vos leads et votre activite
        </p>
      </div>

      {/* Alerte crédits bas */}
      {!loading && lowCredits && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-orange-800">
              {credits === 0 ? "Plus de crédits !" : `Seulement ${credits} crédit${credits > 1 ? "s" : ""} restant${credits > 1 ? "s" : ""}`}
            </p>
            <p className="text-sm text-orange-600">
              Rechargez pour continuer à recevoir des leads.
            </p>
          </div>
          <Link href="/artisan/credits">
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
              <CreditCard className="h-4 w-4 mr-2" />
              Acheter
            </Button>
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Credits disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${lowCredits ? "text-orange-600" : "text-primary"}`}>
              {loading ? "..." : credits}
            </div>
            <Link href="/artisan/credits" className="text-xs text-blue-600 hover:underline">
              Acheter des crédits
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leads ce mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : stats?.leadsThisMonth ?? 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">--%</div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation test */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">
            Navigation de test (dev)
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/">Retour Public</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/dashboard">Espace Admin</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
