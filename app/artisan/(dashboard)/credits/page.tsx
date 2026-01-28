"use client";

import { useEffect, useState } from "react";
import { Check, CreditCard, Zap, Star, Crown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { CREDIT_PACKS, getCheckoutUrl } from "@/lib/lemonsqueezy/client";
import { CreditPack } from "@/lib/lemonsqueezy/types";

interface UserProfile {
  id: string;
  email: string;
  credits: number;
  first_name?: string;
}

const PACK_ICONS: Record<string, React.ReactNode> = {
  starter: <Zap className="h-6 w-6" />,
  pro: <Star className="h-6 w-6" />,
  enterprise: <Crown className="h-6 w-6" />,
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

    // Redirect vers checkout LemonSqueezy
    window.location.href = checkoutUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Acheter des credits</h2>
        <p className="text-muted-foreground">
          1 credit = 1 lead accepte. Choisissez le pack adapte a votre activite.
        </p>
      </div>

      {/* Solde actuel */}
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600 font-medium">Votre solde actuel</p>
              <p className="text-3xl font-bold text-blue-800">
                {profile?.credits ?? 0} credits
              </p>
            </div>
            <CreditCard className="h-12 w-12 text-blue-400" />
          </div>
        </CardContent>
      </Card>

      {/* Packs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {CREDIT_PACKS.map((pack) => (
          <Card
            key={pack.id}
            className={`relative ${
              pack.popular
                ? "border-2 border-primary shadow-lg"
                : "border-border"
            }`}
          >
            {pack.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                  Populaire
                </span>
              </div>
            )}

            <CardHeader className="text-center pb-2">
              <div className={`mx-auto mb-2 p-3 rounded-full ${
                pack.popular ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}>
                {PACK_ICONS[pack.id]}
              </div>
              <CardTitle className="text-xl">{pack.name}</CardTitle>
              <CardDescription>
                {pack.credits} credits
              </CardDescription>
            </CardHeader>

            <CardContent className="text-center">
              <div className="mb-4">
                <span className="text-4xl font-bold">{pack.priceEur.toFixed(2)}€</span>
              </div>
              <div className="text-sm text-muted-foreground">
                soit {(pack.priceEur / pack.credits).toFixed(2)}€ / credit
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              <Button
                className="w-full"
                variant={pack.popular ? "default" : "outline"}
                onClick={() => handlePurchase(pack)}
                disabled={purchasing !== null || !pack.variantId}
              >
                {purchasing === pack.id ? (
                  "Redirection..."
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Acheter
                  </>
                )}
              </Button>

              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600" />
                  Paiement securise
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600" />
                  Credits immediatement disponibles
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-green-600" />
                  Sans engagement
                </li>
              </ul>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Info */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <h3 className="font-semibold mb-2">Comment ca marche ?</h3>
          <ol className="text-sm text-muted-foreground space-y-2">
            <li>1. Choisissez votre pack et payez en toute securite</li>
            <li>2. Vos credits sont ajoutes instantanement a votre compte</li>
            <li>3. Chaque lead accepte deduit 1 credit de votre solde</li>
            <li>4. Sans credits, vous ne recevez plus de notifications</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
