"use client";

import { useEffect, useState } from "react";
import { LogOut, User, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export function ArtisanHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setEmail(user.email || null);
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
        <div className="w-24 h-4 bg-slate-100 rounded animate-pulse hidden sm:block" />
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-3 p-2 pr-3 hover:bg-slate-100 rounded-xl transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
          <User className="h-5 w-5 text-white" />
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-sm font-medium text-slate-800 max-w-[150px] truncate">
            {email}
          </p>
          <p className="text-xs text-slate-500">Artisan</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown menu */}
      {dropdownOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setDropdownOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
            <div className="px-4 py-2 border-b border-slate-100">
              <p className="text-sm font-medium text-slate-800 truncate">{email}</p>
              <p className="text-xs text-slate-500">Compte artisan</p>
            </div>
            <form action={signOut} className="p-2">
              <Button
                variant="ghost"
                size="sm"
                type="submit"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Se déconnecter
              </Button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
