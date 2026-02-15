"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, RefreshCw, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

type CronRun = {
  id: string;
  cron_name: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  result: Record<string, unknown> | null;
  error_message: string | null;
};

const CRON_LABELS: Record<string, string> = {
  "auto-consume": "Auto-consume (leads > 7j)",
  "recalculate-scores": "Recalcul scores reactivite",
  "retry-notifications": "Retry notifications",
  "trigger-followup": "Suivi J+3",
};

const CRON_SCHEDULES: Record<string, string> = {
  "auto-consume": "04:00 UTC",
  "recalculate-scores": "03:00 UTC",
  "retry-notifications": "06:00 UTC",
  "trigger-followup": "10:00 UTC",
};

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  success: { color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  error: { color: "bg-red-100 text-red-700", icon: XCircle },
  running: { color: "bg-yellow-100 text-yellow-700", icon: Loader2 },
};

const PAGE_SIZE = 20;

export default function AdminCronsPage() {
  const [runs, setRuns] = useState<CronRun[]>([]);
  const [latestByName, setLatestByName] = useState<Record<string, CronRun>>({});
  const [loading, setLoading] = useState(true);
  const [filterName, setFilterName] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    // Latest run per cron
    const { data: allLatest } = await supabase
      .from("cron_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(50);

    if (allLatest) {
      const byName: Record<string, CronRun> = {};
      for (const run of allLatest) {
        if (!byName[run.cron_name]) byName[run.cron_name] = run;
      }
      setLatestByName(byName);
    }

    // Filtered history
    let query = supabase
      .from("cron_runs")
      .select("*", { count: "exact" })
      .order("started_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filterName !== "all") query = query.eq("cron_name", filterName);
    if (filterStatus !== "all") query = query.eq("status", filterStatus);

    const { data, count } = await query;
    setRuns(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [filterName, filterStatus, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (ms: number | null) => {
    if (ms === null) return "-";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Monitoring Crons</h2>
          <p className="text-sm text-muted-foreground">
            Historique d'execution des 4 crons Vercel
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Rafraichir
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.keys(CRON_LABELS).map((name) => {
          const latest = latestByName[name];
          const cfg = latest ? statusConfig[latest.status] || statusConfig.error : null;
          const Icon = cfg?.icon || Clock;

          return (
            <Card key={name} className="relative overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {CRON_LABELS[name]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {latest ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={cfg?.color}>
                        <Icon className={`h-3 w-3 mr-1 ${latest.status === "running" ? "animate-spin" : ""}`} />
                        {latest.status}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        {formatDuration(latest.duration_ms)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {formatDate(latest.started_at)}
                    </p>
                    {latest.error_message && (
                      <p className="text-xs text-red-600 truncate" title={latest.error_message}>
                        {latest.error_message}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Aucune execution</p>
                )}
                <p className="text-xs text-slate-400 mt-2">
                  Planifie : {CRON_SCHEDULES[name]}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select value={filterName} onValueChange={(v) => { setFilterName(v); setPage(0); }}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les crons" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les crons</SelectItem>
                {Object.entries(CRON_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(0); }}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="running">Running</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* History list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Historique ({total} executions)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : runs.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              Aucune execution trouvee
            </p>
          ) : (
            <div className="divide-y">
              {runs.map((run) => {
                const cfg = statusConfig[run.status] || statusConfig.error;
                const Icon = cfg.icon;
                return (
                  <div key={run.id} className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-2 rounded">
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge className={cfg.color} variant="secondary">
                        <Icon className={`h-3 w-3 mr-1 ${run.status === "running" ? "animate-spin" : ""}`} />
                        {run.status}
                      </Badge>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800">
                          {CRON_LABELS[run.cron_name] || run.cron_name}
                        </p>
                        {run.error_message && (
                          <p className="text-xs text-red-600 truncate max-w-xs" title={run.error_message}>
                            {run.error_message}
                          </p>
                        )}
                        {run.result && !run.error_message && (
                          <p className="text-xs text-slate-500 truncate max-w-xs">
                            {JSON.stringify(run.result).slice(0, 80)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm text-slate-600">
                        {formatDate(run.started_at)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDuration(run.duration_ms)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <p className="text-sm text-slate-500">
                Page {page + 1} sur {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                >
                  Precedent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages - 1}
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
