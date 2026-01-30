"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CreditCard,
  TrendingUp,
  Users,
  Zap,
  ArrowRight,
  Sparkles,
  Target,
  Clock,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

interface DashboardStats {
  credits: number;
  leadsThisMonth: number;
  totalLeads: number;
  acceptedLeads: number;
}

export default function ArtisanDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Récupérer crédits et prénom du profil
      const { data: profile } = await supabase
        .from("profiles")
        .select("credits, first_name")
        .eq("id", user.id)
        .single();

      setFirstName(profile?.first_name || null);

      // Compter leads acceptés ce mois
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: leadsThisMonth } = await supabase
        .from("lead_assignments")
        .select("*", { count: "exact", head: true })
        .eq("artisan_id", user.id)
        .eq("status", "accepted")
        .gte("responded_at", startOfMonth.toISOString());

      // Total leads (tous statuts confondus)
      const { count: totalLeads } = await supabase
        .from("lead_assignments")
        .select("*", { count: "exact", head: true })
        .eq("artisan_id", user.id);

      // Leads acceptés (total)
      const { count: acceptedLeads } = await supabase
        .from("lead_assignments")
        .select("*", { count: "exact", head: true })
        .eq("artisan_id", user.id)
        .eq("status", "accepted");

      setStats({
        credits: profile?.credits ?? 0,
        leadsThisMonth: leadsThisMonth ?? 0,
        totalLeads: totalLeads ?? 0,
        acceptedLeads: acceptedLeads ?? 0,
      });
      setLoading(false);
    }

    fetchStats();
  }, []);

  const credits = stats?.credits ?? 0;
  const lowCredits = credits <= 2;
  const conversionRate = stats?.totalLeads
    ? Math.round((stats.acceptedLeads / stats.totalLeads) * 100)
    : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bonjour";
    if (hour < 18) return "Bon après-midi";
    return "Bonsoir";
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* En-tête avec salutation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            {getGreeting()}{firstName ? `, ${firstName}` : ""} 👋
          </h1>
          <p className="text-slate-500 mt-1">
            Voici un aperçu de votre activité
          </p>
        </div>
        <Link href="/artisan/credits">
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/25">
            <Sparkles className="h-4 w-4 mr-2" />
            Acheter des crédits
          </Button>
        </Link>
      </div>

      {/* Alerte crédits bas */}
      {!loading && lowCredits && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 p-5 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg">
                {credits === 0 ? "Plus de crédits !" : `Seulement ${credits} crédit${credits > 1 ? "s" : ""} restant${credits > 1 ? "s" : ""}`}
              </p>
              <p className="text-white/80 text-sm">
                Rechargez pour continuer à recevoir des leads qualifiés.
              </p>
            </div>
            <Link href="/artisan/credits">
              <Button className="bg-white text-orange-600 hover:bg-white/90 shadow-lg">
                <CreditCard className="h-4 w-4 mr-2" />
                Recharger
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Crédits */}
        <Card className="bg-white/90 backdrop-blur-sm border border-blue-200/60 shadow-lg shadow-blue-900/[0.08] overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Zap className="h-5 w-5 text-blue-700" />
              </div>
              {lowCredits && (
                <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-semibold rounded-full">
                  Bas
                </span>
              )}
            </div>
            <p className={`text-3xl font-bold ${lowCredits ? "text-orange-600" : "text-blue-600"}`}>
              {loading ? "..." : credits}
            </p>
            <p className="text-sm text-slate-500 mt-1">Crédits disponibles</p>
          </CardContent>
        </Card>

        {/* Leads ce mois */}
        <Card className="bg-white/90 backdrop-blur-sm border border-green-200/60 shadow-lg shadow-green-900/[0.08] overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-green-700" />
              </div>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {loading ? "..." : stats?.leadsThisMonth ?? 0}
            </p>
            <p className="text-sm text-slate-500 mt-1">Leads ce mois</p>
          </CardContent>
        </Card>

        {/* Taux de conversion */}
        <Card className="bg-white/90 backdrop-blur-sm border border-purple-200/60 shadow-lg shadow-purple-900/[0.08] overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-700" />
              </div>
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {loading ? "..." : `${conversionRate}%`}
            </p>
            <p className="text-sm text-slate-500 mt-1">Taux de conversion</p>
          </CardContent>
        </Card>

        {/* Total leads acceptés */}
        <Card className="bg-white/90 backdrop-blur-sm border border-amber-200/60 shadow-lg shadow-amber-900/[0.08] overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <Target className="h-5 w-5 text-amber-700" />
              </div>
            </div>
            <p className="text-3xl font-bold text-amber-600">
              {loading ? "..." : stats?.acceptedLeads ?? 0}
            </p>
            <p className="text-sm text-slate-500 mt-1">Total acceptés</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/artisan/leads">
          <Card className="group bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-lg shadow-slate-900/[0.08] hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-200 cursor-pointer overflow-hidden">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="h-7 w-7 text-blue-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                  Voir mes leads
                </h3>
                <p className="text-sm text-slate-500">
                  Consultez et gérez vos demandes
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </CardContent>
          </Card>
        </Link>

        <Link href="/artisan/profil">
          <Card className="group bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-lg shadow-slate-900/[0.08] hover:shadow-xl hover:border-blue-200 hover:scale-[1.01] transition-all duration-200 cursor-pointer overflow-hidden">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="h-7 w-7 text-green-700" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 group-hover:text-green-600 transition-colors">
                  Mon profil
                </h3>
                <p className="text-sm text-slate-500">
                  Configurez vos préférences
                </p>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Conseils */}
      <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/80 shadow-lg shadow-slate-900/[0.08]">
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Conseils pour maximiser vos conversions
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                title: "Répondez rapidement",
                desc: "Les clients attendent une réponse sous 2 minutes",
              },
              {
                title: "Activez les notifications",
                desc: "Ne manquez aucune opportunité",
              },
              {
                title: "Complétez votre profil",
                desc: "Un profil complet inspire confiance",
              },
            ].map((tip, i) => (
              <div key={i} className="p-4 bg-white rounded-xl">
                <p className="font-medium text-slate-800 mb-1">{tip.title}</p>
                <p className="text-sm text-slate-500">{tip.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
