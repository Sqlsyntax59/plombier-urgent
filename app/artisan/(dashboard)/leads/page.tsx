"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock, Phone, MapPin, ChevronRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

// Labels français pour les types de panne
const PROBLEM_TYPE_LABELS: Record<string, string> = {
  fuite: "Fuite d'eau",
  wc_bouche: "WC bouché",
  ballon_eau_chaude: "Ballon d'eau chaude",
  canalisation: "Canalisation",
  robinetterie: "Robinetterie",
  autre: "Autre problème",
};

// Messages d'erreur
const ERROR_MESSAGES: Record<string, string> = {
  missing_id: "Lien invalide",
  not_found: "Lead non trouvé",
  already_processed: "Ce lead a déjà été traité",
  already_assigned: "Ce lead a déjà été attribué à un autre artisan",
  expired: "Le délai de réponse a expiré",
  no_credits: "Vous n'avez plus de crédits disponibles",
  server_error: "Une erreur est survenue, veuillez réessayer",
};

interface LeadWithAssignment {
  id: string;
  problem_type: string;
  description: string;
  client_city: string | null;
  status: string;
  created_at: string;
  assignment_status: string;
  client_phone?: string;
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<LeadsPageSkeleton />}>
      <LeadsPageContent />
    </Suspense>
  );
}

function LeadsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mes Leads</h2>
        <p className="text-muted-foreground">
          Consultez et gérez vos demandes clients
        </p>
      </div>
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    </div>
  );
}

function LeadsPageContent() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get("error");

  const [leads, setLeads] = useState<LeadWithAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeads() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      // Récupérer les assignments de l'artisan avec les leads
      const { data: assignments, error } = await supabase
        .from("lead_assignments")
        .select(
          `
          id,
          status,
          lead_id,
          leads (
            id,
            problem_type,
            description,
            client_city,
            client_phone,
            status,
            created_at
          )
        `
        )
        .eq("artisan_id", user.id)
        .order("notified_at", { ascending: false });

      if (error) {
        console.error("Erreur fetch leads:", error);
        setLoading(false);
        return;
      }

      // Transformer les données
      const leadsData = assignments
        ?.filter((a) => a.leads)
        .map((a) => {
          const lead = a.leads as unknown as {
            id: string;
            problem_type: string;
            description: string;
            client_city: string | null;
            client_phone: string;
            status: string;
            created_at: string;
          };
          return {
            id: lead.id,
            problem_type: lead.problem_type,
            description: lead.description,
            client_city: lead.client_city,
            status: lead.status,
            created_at: lead.created_at,
            assignment_status: a.status,
            client_phone: a.status === "accepted" ? lead.client_phone : undefined,
          };
        });

      setLeads(leadsData || []);
      setLoading(false);
    }

    fetchLeads();
  }, []);

  const errorMessage = errorCode ? ERROR_MESSAGES[errorCode] : null;

  // Séparer les leads par statut
  const acceptedLeads = leads.filter((l) => l.assignment_status === "accepted");
  const pendingLeads = leads.filter((l) => l.assignment_status === "pending");
  const expiredLeads = leads.filter((l) => l.assignment_status === "expired");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mes Leads</h2>
        <p className="text-muted-foreground">
          Consultez et gérez vos demandes clients
        </p>
      </div>

      {/* Message d'erreur */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-red-800">{errorMessage}</p>
            {errorCode === "already_assigned" && (
              <p className="text-sm text-red-600 mt-1">
                Activez les notifications pour réagir plus rapidement aux prochains leads.
              </p>
            )}
            {errorCode === "no_credits" && (
              <Link href="/artisan/credits">
                <Button size="sm" variant="outline" className="mt-2">
                  Acheter des crédits
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : leads.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Aucun lead pour le moment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Vos leads apparaîtront ici une fois que vous en recevrez.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Leads acceptés */}
          {acceptedLeads.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Leads acceptés ({acceptedLeads.length})
              </h3>
              <div className="space-y-3">
                {acceptedLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} showPhone />
                ))}
              </div>
            </div>
          )}

          {/* Leads en attente */}
          {pendingLeads.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                En attente de réponse ({pendingLeads.length})
              </h3>
              <div className="space-y-3">
                {pendingLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} />
                ))}
              </div>
            </div>
          )}

          {/* Leads expirés */}
          {expiredLeads.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-gray-500">
                Expirés ({expiredLeads.length})
              </h3>
              <div className="space-y-3">
                {expiredLeads.map((lead) => (
                  <LeadCard key={lead.id} lead={lead} expired />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LeadCard({
  lead,
  showPhone,
  expired,
}: {
  lead: LeadWithAssignment;
  showPhone?: boolean;
  expired?: boolean;
}) {
  const problemLabel = PROBLEM_TYPE_LABELS[lead.problem_type] || lead.problem_type;
  const createdAt = new Date(lead.created_at).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <Link href={`/artisan/leads/${lead.id}`}>
      <Card
        className={`hover:shadow-md transition-shadow cursor-pointer ${
          expired ? "opacity-60" : ""
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">{problemLabel}</div>
              {lead.client_city && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="h-3 w-3" />
                  {lead.client_city}
                </div>
              )}
              <div className="text-xs text-gray-400">{createdAt}</div>
            </div>

            <div className="flex items-center gap-3">
              {showPhone && lead.client_phone && (
                <a
                  href={`tel:${lead.client_phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 bg-blue-100 rounded-full hover:bg-blue-200"
                >
                  <Phone className="h-4 w-4 text-blue-600" />
                </a>
              )}
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
