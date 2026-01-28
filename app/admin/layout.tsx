import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar admin */}
      <aside className="w-64 border-r bg-card flex flex-col">
        <div className="h-16 border-b flex items-center px-6 bg-primary/5">
          <Link href="/admin/dashboard" className="font-bold text-lg">
            <span className="text-primary">Admin</span>
            <span className="text-muted-foreground ml-1">Panel</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/artisans"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
          >
            Artisans
          </Link>
          <Link
            href="/admin/leads"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
          >
            Leads
          </Link>
          <Link
            href="/admin/verticales"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
          >
            Verticales
          </Link>
        </nav>
        <div className="p-4 border-t">
          <span className="text-xs text-destructive font-medium">
            Administration
          </span>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b bg-card flex items-center justify-between px-6">
          <h1 className="font-semibold">Administration</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-destructive">Admin</span>
          </div>
        </header>
        <main className="flex-1 p-6 bg-background">{children}</main>
      </div>
    </div>
  );
}
