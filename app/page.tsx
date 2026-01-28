import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
        <div className="container mx-auto px-4 py-12">
          {/* Hero section */}
          <section className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">
              Besoin d&apos;un{" "}
              <span className="text-primary">plombier urgent</span> ?
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Trouvez un artisan disponible 24h/24, 7j/7 pres de chez vous.
              Intervention rapide garantie.
            </p>
            <Button size="lg" asChild>
              <Link href="/demande">Demander un devis gratuit</Link>
            </Button>
          </section>

          {/* Navigation test - a supprimer apres dev */}
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">
                Navigation de test (dev)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/artisan/dashboard">Espace Artisan</Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/admin/dashboard">Espace Admin</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
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
