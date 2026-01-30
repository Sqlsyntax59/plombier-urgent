"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArtisanHeader } from "@/components/artisan-header";
import {
  LayoutDashboard,
  Users,
  User,
  CreditCard,
  Droplets,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/artisan/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/artisan/leads",
    label: "Mes Leads",
    icon: Users,
  },
  {
    href: "/artisan/profil",
    label: "Mon Profil",
    icon: User,
  },
  {
    href: "/artisan/credits",
    label: "Acheter des crédits",
    icon: CreditCard,
    highlight: true,
  },
];

export default function ArtisanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 via-purple-50/30 to-white">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 bg-white/95 backdrop-blur-sm border-r border-slate-200/80 flex flex-col transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <Droplets className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Plombier Urgent
            </span>
          </Link>
          <button
            className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-blue-100 text-blue-800 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  item.highlight && !isActive && "text-blue-600"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5",
                    isActive ? "text-blue-700" : item.highlight ? "text-blue-600" : "text-slate-500"
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight className="h-4 w-4 text-blue-400" />}
                {item.highlight && !isActive && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full font-semibold">
                    Pro
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer sidebar */}
        <div className="p-4 border-t border-slate-100">
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
            <p className="text-sm font-semibold text-slate-800 mb-1">
              Besoin d'aide ?
            </p>
            <p className="text-xs text-slate-500 mb-3">
              Contactez notre support
            </p>
            <a
              href="mailto:support@plombier-urgent.fr"
              className="text-xs text-blue-600 font-medium hover:underline"
            >
              support@plombier-urgent.fr
            </a>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Header */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-lg border-b border-slate-200">
          <div className="h-full px-4 lg:px-6 flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 hover:bg-slate-100 rounded-lg"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5 text-slate-600" />
            </button>

            {/* Page title - could be dynamic */}
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-slate-800 hidden sm:block">
                Espace Artisan
              </h1>
            </div>

            {/* Header actions */}
            <ArtisanHeader />
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
