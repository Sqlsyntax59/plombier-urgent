"use client";

import { useEffect, useState } from "react";
import { LogOut, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export function ArtisanHeader() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      <h1 className="font-semibold">Tableau de bord</h1>
      <div className="flex items-center gap-4">
        {loading ? (
          <span className="text-sm text-muted-foreground">Chargement...</span>
        ) : (
          <>
            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full">
              <Mail className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">{email}</span>
            </div>
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="h-4 w-4 mr-2" />
                Deconnexion
              </Button>
            </form>
          </>
        )}
      </div>
    </header>
  );
}
