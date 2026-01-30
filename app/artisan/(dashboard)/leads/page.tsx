"use client";

import { Suspense, useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  ChevronRight,
  TrendingUp,
  Inbox,
  Filter,
  Droplets,
  Wrench,
  Flame,
  Zap,
  X,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
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

const PROBLEM_TYPE_LABELS: Record<string, string> = {
  fuite: "Fuite d'eau",
  wc_bouche: "WC bouché",
  ballon_eau_chaude: "Ballon d'eau chaude",
  canalisation: "Canalisation",
  robinetterie: "Robinetterie",
  autre: "Autre problème",
};

const PROBLEM_TYPE_ICONS: Record<string, { icon: typeof Droplets; color: string; bg: string }> = {
  fuite: { icon: Droplets, color: "text-blue-500", bg: "bg-blue-50" },
  wc_bouche: { icon: Wrench, color: "text-amber-500", bg: "bg-amber-50" },
  ballon_eau_chaude: { icon: Flame, color: "text-orange-500", bg: "bg-orange-50" },
  canalisation: { icon: Droplets, color: "text-cyan-500", bg: "bg-cyan-50" },
  robinetterie: { icon: Wrench, color: "text-purple-500", bg: "bg-purple-50" },
  autre: { icon: Zap, color: "text-red-500", bg: "bg-red-50" },
};

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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Mes Leads</h1>
        <p className="text-slate-500">Consultez et gérez vos demandes clients</p>
      </div>
      <div className="grid gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-2xl animate-pulse" />
        ))}
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
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: assignments, error } = await supabase
        .from("lead_assignments")
        .select(`
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
        `)
        .eq("artisan_id", user.id)
        .order("notified_at", { ascending: false });

      if (error) {
        console.error("Erreur fetch leads:", error);
        setLoading(false);
        return;
      }

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

  const filteredByPeriod = useMemo(() => {
    if (periodFilter === "all") return leads;
    const now = new Date();
    const daysAgo = periodFilter === "7d" ? 7 : 30;
    const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    return leads.filter((l) => new Date(l.created_at) >= cutoffDate);
  }, [leads, periodFilter]);

  const filteredLeads = useMemo(() => {
    if (statusFilter === "all") return filteredByPeriod;
    return filteredByPeriod.filter((l) => l.assignment_status === statusFilter);
  }, [filteredByPeriod, statusFilter]);

  const stats = useMemo(() => {
    const total = filteredByPeriod.length;
    const accepted = filteredByPeriod.filter((l) => l.assignment_status === "accepted").length;
    const rate = total > 0 ? Math.round((accepted / total) * 100) : 0;
    return { total, accepted, rate };
  }, [filteredByPeriod]);

  const acceptedLeads = filteredLeads.filter((l) => l.assignment_status === "accepted");
  const pendingLeads = filteredLeads.filter((l) => l.assignment_status === "pending");
  const expiredLeads = filteredLeads.filter((l) => l.assignment_status === "expired");

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Mes Leads</h1>
        <p className="text-slate-500 mt-1">Consultez et gérez vos demandes clients</p>
      </div>

      {/* Message d'erreur */}
      {errorMessage && (
        <div className="relative overflow-hidden rounded-2xl bg-red-50 border border-red-200 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-red-800">{errorMessage}</p>
              {errorCode === "already_assigned" && (
                <p className="text-sm text-red-600 mt-1">
                  Activez les notifications pour réagir plus rapidement.
                </p>
              )}
              {errorCode === "no_credits" && (
                <Link href="/artisan/credits">
                  <Button size="sm" className="mt-3 bg-red-600 hover:bg-red-700">
                    Acheter des crédits
                  </Button>
                </Link>
              )}
            </div>
            <button className="p-1 hover:bg-red-100 rounded-lg">
              <X className="h-4 w-4 text-red-400" />
            </button>
          </div>
        </div>
      )}

      {/* Stats et Filtres */}
      {!loading && leads.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Stats card */}
          <Card className="flex-1 border-0 shadow-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-white/80 text-sm">Taux de conversion</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">{stats.rate}%</span>
                    <span className="text-white/60 text-sm">
                      ({stats.accepted}/{stats.total})
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filtres */}
          <div className="flex gap-2 items-center">
            <Filter className="h-4 w-4 text-slate-400 hidden sm:block" />
            <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
              <SelectTrigger className="w-[140px] bg-white border-slate-200">
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
                <SelectItem value="all">Tout</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="w-[140px] bg-white border-slate-200">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="accepted">Acceptés</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="expired">Expirés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Contenu */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="mt-4 text-slate-500">Chargement des leads...</p>
        </div>
      ) : leads.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Inbox className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Aucun lead pour le moment
            </h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              Vos leads apparaîtront ici une fois que des clients auront fait des demandes dans votre zone.
            </p>
          </CardContent>
        </Card>
      ) : filteredLeads.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="py-12 text-center">
            <p className="text-slate-500 mb-4">Aucun lead ne correspond à ces filtres.</p>
            <Button
              variant="outline"
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
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <h2 className="font-semibold text-slate-800">
                  Acceptés ({acceptedLeads.length})
                </h2>
              </div>
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
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-orange-500" />
                </div>
                <h2 className="font-semibold text-slate-800">
                  En attente ({pendingLeads.length})
                </h2>
              </div>
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
              <div className="flex items-center gap-2 mb-3">
                <h2 className="font-medium text-slate-500">
                  Expirés ({expiredLeads.length})
                </h2>
              </div>
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
  const iconData = PROBLEM_TYPE_ICONS[lead.problem_type] || PROBLEM_TYPE_ICONS.autre;
  const IconComponent = iconData.icon;

  const createdAt = new Date(lead.created_at).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <Link href={`/artisan/leads/${lead.id}`}>
      <Card
        className={`group border-0 shadow-md hover:shadow-xl transition-all cursor-pointer ${
          expired ? "opacity-50" : ""
        }`}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-xl ${iconData.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
              <IconComponent className={`h-6 w-6 ${iconData.color}`} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                  {problemLabel}
                </p>
                {showPhone && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    Accepté
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                {lead.client_city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {lead.client_city}
                  </span>
                )}
                <span>{createdAt}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {showPhone && lead.client_phone && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = `tel:${lead.client_phone}`;
                  }}
                  className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center hover:bg-blue-200 transition-colors"
                >
                  <Phone className="h-5 w-5 text-blue-600" />
                </button>
              )}
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
