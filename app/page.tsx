import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Clock, Shield, AlertTriangle, ChevronRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header minimaliste */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl text-primary">
            Plombier Urgent
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link
              href="/artisan/login"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Espace Artisan
            </Link>
          </nav>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1">
        {/* Hero section avec CTA urgence */}
        <section className="bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 py-12 md:py-20">
            <div className="max-w-2xl mx-auto text-center">
              {/* Badge urgence */}
              <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-destructive/10 text-destructive text-sm font-medium">
                <AlertTriangle className="h-4 w-4" />
                <span>Intervention 24h/24 - 7j/7</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                Besoin d&apos;un{" "}
                <span className="text-primary">plombier urgent</span> ?
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Un artisan qualifie vous rappelle en moins de 2 minutes.
                Devis gratuit, sans engagement.
              </p>

              {/* CTA principal */}
              <Button size="lg" className="text-lg h-14 px-8 gap-2" asChild>
                <Link href="/demande">
                  Contacter un artisan maintenant
                  <ChevronRight className="h-5 w-5" />
                </Link>
              </Button>

              <p className="mt-4 text-sm text-muted-foreground">
                Plus de 500 artisans disponibles en France
              </p>
            </div>
          </div>
        </section>

        {/* Trust indicators */}
        <section className="py-12 border-t bg-card">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-14 h-14 mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Clock className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Reponse rapide</h3>
                <p className="text-sm text-muted-foreground">
                  Un artisan vous rappelle en moins de 2 minutes
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-14 h-14 mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Shield className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Artisans verifies</h3>
                <p className="text-sm text-muted-foreground">
                  Tous nos artisans sont qualifies et assures
                </p>
              </div>
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-14 h-14 mb-4 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Phone className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold mb-1">Devis gratuit</h3>
                <p className="text-sm text-muted-foreground">
                  Estimation de prix avant intervention
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Types de pannes */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">
              Quel est votre probleme ?
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
              {[
                { emoji: "💧", label: "Fuite d'eau" },
                { emoji: "🚽", label: "WC bouche" },
                { emoji: "🔥", label: "Ballon d'eau chaude" },
                { emoji: "🚿", label: "Canalisation" },
                { emoji: "🔧", label: "Robinetterie" },
                { emoji: "❓", label: "Autre" },
              ].map((item) => (
                <Card key={item.label} className="hover:border-primary transition-colors">
                  <Link href="/demande">
                    <CardContent className="p-4 text-center">
                      <span className="text-3xl mb-2 block">{item.emoji}</span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="py-12 bg-primary/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">
              Une urgence ? Ne perdez pas de temps
            </h2>
            <p className="text-muted-foreground mb-6">
              Decrivez votre probleme et recevez un appel dans les 2 minutes
            </p>
            <Button size="lg" className="gap-2" asChild>
              <Link href="/demande">
                Demander une intervention
                <ChevronRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer simple */}
      <footer className="border-t bg-card py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Plombier Urgent - Tous droits
          reserves
        </div>
      </footer>
    </div>
  );
}
