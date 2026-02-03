"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  CreditCard,
  Zap,
  Star,
  Crown,
  Sparkles,
  Shield,
  Clock,
  ArrowRight,
  History,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { CREDIT_PACKS, getCheckoutUrl } from "@/lib/lemonsqueezy/client";
import { CreditPack } from "@/lib/lemonsqueezy/types";

interface UserProfile {
  id: string;
  email: string;
  credits: number;
  first_name?: string;
}

const PACK_ICONS: Record<string, { icon: typeof Zap; color: string; bg: string }> = {
  starter: { icon: Zap, color: "text-blue-700", bg: "from-blue-500 to-cyan-500" },
  pro: { icon: Star, color: "text-purple-700", bg: "from-purple-500 to-pink-500" },
  enterprise: { icon: Crown, color: "text-amber-700", bg: "from-amber-500 to-orange-500" },
};

export default function CreditsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, credits, first_name")
        .eq("id", user.id)
        .single();

      setProfile({
        id: user.id,
        email: user.email || "",
        credits: profileData?.credits ?? 0,
        first_name: profileData?.first_name,
      });
      setLoading(false);
    }

    fetchProfile();
  }, []);

  const handlePurchase = (pack: CreditPack) => {
    if (!profile) return;

    setPurchasing(pack.id);

    const checkoutUrl = getCheckoutUrl({
      productId: pack.id,
      variantId: pack.variantId,
      email: profile.email,
      name: profile.first_name,
      customData: {
        artisan_id: profile.id,
        pack_name: pack.name,
        credits: pack.credits,
      },
    });

    window.location.href = checkoutUrl;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="mt-4 text-slate-500">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Acheter des crédits
          </h1>
          <p className="text-slate-500 mt-1">
            1 crédit = 1 lead accepté. Choisissez le pack adapté à votre activité.
          </p>
        </div>
        <Button asChild variant="outline" className="sm:self-start">
          <Link href="/artisan/credits/history">
            <History className="h-4 w-4 mr-2" />
            Historique
          </Link>
        </Button>
      </div>

      {/* Solde actuel */}
      <Card className="border-2 border-blue-400/50 shadow-xl shadow-blue-600/20 bg-gradient-to-r from-blue-600 to-cyan-500 text-white overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Votre solde actuel</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{profile?.credits ?? 0}</span>
                <span className="text-blue-100">crédits</span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <CreditCard className="h-8 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Packs */}
      <div className="grid md:grid-cols-3 gap-6">
        {CREDIT_PACKS.map((pack) => {
          const iconData = PACK_ICONS[pack.id] || PACK_ICONS.starter;
          const IconComponent = iconData.icon;
          const pricePerCredit = (pack.priceEur / pack.credits).toFixed(2);

          return (
            <Card
              key={pack.id}
              className={`relative bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-lg shadow-slate-900/[0.08] overflow-hidden transition-all duration-200 hover:shadow-xl hover:scale-[1.02] hover:border-blue-200 ${
                pack.popular ? "ring-2 ring-purple-500" : ""
              }`}
            >
              {pack.popular && (
                <div className="absolute top-0 right-0">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold px-4 py-1.5 rounded-bl-xl">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    Populaire
                  </div>
                </div>
              )}

              <div className={`h-2 bg-gradient-to-r ${iconData.bg}`} />

              <CardContent className="p-6">
                {/* Icon & Name */}
                <div className="text-center mb-6">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${iconData.bg} flex items-center justify-center`}>
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">{pack.name}</h3>
                  <p className="text-slate-500">{pack.credits} crédits</p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-slate-900">
                      {pack.priceEur.toFixed(0)}
                    </span>
                    <span className="text-xl text-slate-500">€</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    soit {pricePerCredit}€ / crédit
                  </p>
                </div>

                {/* Button */}
                <Button
                  className={`w-full h-12 rounded-xl font-semibold transition-all ${
                    pack.popular
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25"
                      : "bg-slate-800 hover:bg-slate-900"
                  }`}
                  onClick={() => handlePurchase(pack)}
                  disabled={purchasing !== null || !pack.variantId}
                >
                  {purchasing === pack.id ? (
                    "Redirection..."
                  ) : (
                    <>
                      Acheter
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                {/* Features */}
                <ul className="mt-6 space-y-2">
                  {[
                    "Paiement sécurisé",
                    "Crédits immédiats",
                    "Sans engagement",
                  ].map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-slate-500"
                    >
                      <Check className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info */}
      <Card className="bg-white/80 backdrop-blur-sm border border-slate-200/80 shadow-lg shadow-slate-900/[0.08]">
        <CardContent className="p-6">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Comment ça marche ?
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: CreditCard, title: "1. Achetez", desc: "Choisissez votre pack" },
              { icon: Zap, title: "2. Recevez", desc: "Crédits ajoutés instantanément" },
              { icon: Clock, title: "3. Utilisez", desc: "1 lead = 1 crédit" },
              { icon: Shield, title: "4. Convertissez", desc: "Transformez les leads en clients" },
            ].map((step) => (
              <div key={step.title} className="p-4 bg-white rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
                  <step.icon className="h-5 w-5 text-blue-700" />
                </div>
                <p className="font-semibold text-slate-800">{step.title}</p>
                <p className="text-sm text-slate-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
