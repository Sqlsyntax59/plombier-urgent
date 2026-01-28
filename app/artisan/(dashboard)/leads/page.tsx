"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Clock, Phone, MapPin, ChevronRight, Filter, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

type PeriodFilter = "7d" | "30d" | "all";
type StatusFilter = "all" | "accepted" | "pending" | "expired";

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
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

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

  // Filtrer par période
  const filteredByPeriod = useMemo(() => {
    if (periodFilter === "all") return leads;

    const now = new Date();
    const daysAgo = periodFilter === "7d" ? 7 : 30;
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    return leads.filter((l) => new Date(l.created_at) >= cutoffDate);
  }, [leads, periodFilter]);

  // Filtrer par statut
  const filteredLeads = useMemo(() => {
    if (statusFilter === "all") return filteredByPeriod;
    return filteredByPeriod.filter((l) => l.assignment_status === statusFilter);
  }, [filteredByPeriod, statusFilter]);

  // Stats de conversion
  const stats = useMemo(() => {
    const total = filteredByPeriod.length;
    const accepted = filteredByPeriod.filter((l) => l.assignment_status === "accepted").length;
    const rate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    return { total, accepted, rate };
  }, [filteredByPeriod]);

  // Séparer les leads par statut (pour affichage groupé quand "all")
  const acceptedLeads = filteredLeads.filter((l) => l.assignment_status === "accepted");
  const pendingLeads = filteredLeads.filter((l) => l.assignment_status === "pending");
  const expiredLeads = filteredLeads.filter((l) => l.assignment_status === "expired");

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

      {/* Filtres et Stats */}
      {!loading && leads.length > 0 && (
        <>
          {/* Stats de conversion */}
          <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Taux de conversion</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{stats.rate}%</div>
                  <div className="text-xs text-gray-500">
                    {stats.accepted} acceptés sur {stats.total}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filtres */}
          <div className="flex flex-wrap gap-3 items-center">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
                <SelectItem value="all">Tout l'historique</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="accepted">Acceptés</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="expired">Expirés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
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
      ) : filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              Aucun lead ne correspond à ces filtres.
            </p>
            <Button
              variant="link"
              onClick={() => {
                setPeriodFilter("all");
                setStatusFilter("all");
              }}
            >
              Réinitialiser les filtres
            </Button>
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
