import Link from "next/link";
import { ArtisanHeader } from "@/components/artisan-header";

export default function ArtisanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar artisan */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="h-16 border-b flex items-center px-6">
          <Link href="/" className="font-bold text-lg text-primary">
            Plombier Urgent
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/artisan/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/artisan/leads"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
          >
            Mes Leads
          </Link>
          <Link
            href="/artisan/profil"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
          >
            Mon Profil
          </Link>
          <Link
            href="/artisan/credits"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors text-primary font-medium"
          >
            Acheter des crédits
          </Link>
        </nav>
        <div className="p-4 border-t">
          <span className="text-xs text-muted-foreground">Espace Artisan</span>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col">
        <ArtisanHeader />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
