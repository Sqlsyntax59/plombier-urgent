"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  AlertTriangle,
  Layers,
  Clock,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/artisans",
    label: "Artisans",
    icon: Users,
  },
  {
    href: "/admin/leads",
    label: "Leads",
    icon: FileText,
  },
  {
    href: "/admin/reclamations",
    label: "Reclamations",
    icon: AlertTriangle,
  },
  {
    href: "/admin/verticales",
    label: "Verticales",
    icon: Layers,
  },
  {
    href: "/admin/crons",
    label: "Crons",
    icon: Clock,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar admin */}
      <aside className="w-64 border-r bg-white flex flex-col shadow-sm">
        <div className="h-16 border-b flex items-center px-6 bg-gradient-to-r from-red-50 to-orange-50">
          <Link href="/admin/dashboard" className="font-bold text-lg">
            <span className="text-red-600">Admin</span>
            <span className="text-slate-500 ml-1">Panel</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-red-50 text-red-700 border border-red-200"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-red-600" : "text-slate-400")} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Quitter l&apos;admin
          </Link>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b bg-white flex items-center justify-between px-6 shadow-sm">
          <h1 className="font-semibold text-slate-800">Administration</h1>
          <div className="flex items-center gap-4">
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
              Mode Admin
            </span>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
