import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Award, ExternalLink, Clock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { getPublicProfile } from "@/lib/actions/profile";
import { TRADES } from "@/lib/validations/artisan";

// Generer metadata dynamique
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);

  if (!profile) {
    return {
      title: "Artisan non trouve",
    };
  }

  const tradeName =
    TRADES.find((t) => t.value === profile.trade)?.label || profile.trade;

  return {
    title: `${profile.first_name} - ${tradeName} a ${profile.city}`,
    description: `Profil de ${profile.first_name}, ${tradeName} professionnel a ${profile.city}. Intervention rapide.`,
  };
}

export default async function PublicArtisanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getPublicProfile(slug);

  if (!profile) {
    notFound();
  }

  const tradeName =
    TRADES.find((t) => t.value === profile.trade)?.label || profile.trade;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl text-primary">
            Plombier Urgent
          </Link>
          <Button asChild size="sm">
            <Link href="/demande">Demander une intervention</Link>
          </Button>
        </div>
      </header>

      {/* Contenu */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center pb-2">
            {/* Avatar placeholder */}
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">
                {profile.first_name.charAt(0).toUpperCase()}
              </span>
            </div>

            <CardTitle className="text-2xl">{profile.first_name}</CardTitle>
            <p className="text-muted-foreground">{tradeName}</p>

            {/* Badges */}
            <div className="flex justify-center gap-2 mt-3">
              {profile.is_reactive && (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  Reactif
                </Badge>
              )}
              <Badge variant="outline" className="gap-1">
                <Award className="h-3 w-3" />
                Professionnel verifie
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Localisation */}
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">{profile.city}</p>
                {profile.radius_km && (
                  <p className="text-sm text-muted-foreground">
                    Intervient dans un rayon de {profile.radius_km} km
                  </p>
                )}
              </div>
            </div>

            {/* Metriques */}
            {profile.response_time_avg && (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-2xl font-bold text-primary">
                    {"<"} 2 min
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Temps de reponse moyen
                  </p>
                </div>
              </div>
            )}

            {/* Lien Google Business */}
            {profile.google_business_url && (
              <Button variant="outline" className="w-full gap-2" asChild>
                <a
                  href={profile.google_business_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                  Voir les avis Google
                </a>
              </Button>
            )}

            {/* CTA */}
            <div className="pt-4 border-t">
              <p className="text-center text-sm text-muted-foreground mb-4">
                Besoin d'une intervention urgente ?
              </p>
              <Button className="w-full" size="lg" asChild>
                <Link href="/demande">Demander un devis gratuit</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer info */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          Plombier Urgent met en relation des clients avec des artisans
          professionnels qualifies.
        </p>
      </main>
    </div>
  );
}
