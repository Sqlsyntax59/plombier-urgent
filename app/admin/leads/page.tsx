"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Search,
  Filter,
  Calendar,
  MapPin,
  Phone,
  User,
  RefreshCw,
  Download,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getLeadsHistory,
  type LeadWithArtisan,
} from "@/lib/actions/admin-dashboard";
import {
  PROBLEM_TYPE_LABELS,
  LEAD_STATUS_LABELS,
  type LeadStatus,
  type ProblemType,
} from "@/types/database.types";

const statusColors: Record<LeadStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  assigned: "bg-blue-100 text-blue-700",
  accepted: "bg-green-100 text-green-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-700",
  unassigned: "bg-red-100 text-red-700",
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<LeadWithArtisan[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const { data, total, error } = await getLeadsHistory({
      status: statusFilter,
      search: searchTerm || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      limit,
      offset: page * limit,
    });
    if (error) {
      setError(error);
    } else {
      setLeads(data);
      setTotal(total);
      setError(null);
    }
    setLoading(false);
  }, [statusFilter, searchTerm, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Export CSV
  const handleExport = () => {
    const headers = ["Date", "Ville", "Type", "Statut", "Artisan", "Telephone"];
    const rows = leads.map((lead) => [
      formatDate(lead.created_at),
      lead.client_city || "",
      PROBLEM_TYPE_LABELS[lead.problem_type as ProblemType],
      LEAD_STATUS_LABELS[lead.status],
      lead.artisan ? `${lead.artisan.first_name} ${lead.artisan.last_name}` : "",
      lead.client_phone,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Historique des Leads</h2>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-center text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-500" />
            Historique des Leads
          </h2>
          <p className="text-muted-foreground">
            {total} lead{total > 1 ? "s" : ""} au total
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={leads.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
          <Button variant="outline" onClick={fetchLeads} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Ville ou telephone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
                className="pl-10"
              />
            </div>

            {/* Statut */}
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as LeadStatus | "all");
                setPage(0);
              }}
            >
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="assigned">Assigne</SelectItem>
                <SelectItem value="accepted">Accepte</SelectItem>
                <SelectItem value="completed">Realise</SelectItem>
                <SelectItem value="cancelled">Annule</SelectItem>
                <SelectItem value="unassigned">Non assigne</SelectItem>
              </SelectContent>
            </Select>

            {/* Date debut */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(0);
                }}
                className="pl-10"
              />
            </div>

            {/* Date fin */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(0);
                }}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des leads */}
      <Card>
        <CardHeader>
          <CardTitle>Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : leads.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun lead trouve avec ces filtres
            </p>
          ) : (
            <div className="divide-y">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="py-4 hover:bg-slate-50 -mx-4 px-4 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Info principale */}
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">
                            {PROBLEM_TYPE_LABELS[lead.problem_type as ProblemType]}
                          </span>
                          <Badge className={statusColors[lead.status]}>
                            {LEAD_STATUS_LABELS[lead.status]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {lead.client_city || "Ville inconnue"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {lead.client_phone}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(lead.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Artisan assigne */}
                    <div className="flex items-center gap-3">
                      {lead.artisan ? (
                        <div className="flex items-center gap-2 text-sm bg-green-50 px-3 py-1.5 rounded-lg">
                          <User className="w-4 h-4 text-green-600" />
                          <span className="text-green-700 font-medium">
                            {lead.artisan.first_name} {lead.artisan.last_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Pas d&apos;artisan assigne
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description (tronquee) */}
                  {lead.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2 ml-14">
                      {lead.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} sur {Math.ceil(total / limit)}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Precedent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={(page + 1) * limit >= total}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
