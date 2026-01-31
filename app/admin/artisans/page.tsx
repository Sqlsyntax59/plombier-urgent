"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search,
  Filter,
  MoreHorizontal,
  UserCheck,
  UserX,
  Gift,
  RefreshCw,
  Loader2,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  getArtisansList,
  updateArtisanStatus,
  creditArtisan,
  type ArtisanListItem,
} from "@/lib/actions/admin-dashboard";

type StatusFilter = "all" | "active" | "inactive" | "suspended";

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );
}

export default function AdminArtisansPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AdminArtisansContent />
    </Suspense>
  );
}

function AdminArtisansContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get("status") as StatusFilter) || "all";

  const [artisans, setArtisans] = useState<ArtisanListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatus);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  // Dialogs
  const [creditDialog, setCreditDialog] = useState<{ open: boolean; artisan: ArtisanListItem | null }>({
    open: false,
    artisan: null,
  });
  const [creditAmount, setCreditAmount] = useState(5);
  const [creditReason, setCreditReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchArtisans = useCallback(async () => {
    setLoading(true);
    const { data, total, error } = await getArtisansList({
      status: statusFilter,
      search: searchTerm || undefined,
      limit,
      offset: page * limit,
    });
    if (error) {
      setError(error);
    } else {
      setArtisans(data);
      setTotal(total);
      setError(null);
    }
    setLoading(false);
  }, [statusFilter, searchTerm, page]);

  useEffect(() => {
    fetchArtisans();
  }, [fetchArtisans]);

  // Handle status change
  const handleStatusChange = async (artisanId: string, action: "activate" | "deactivate" | "suspend" | "unsuspend") => {
    setActionLoading(true);
    const { success, error } = await updateArtisanStatus(artisanId, action);
    if (success) {
      fetchArtisans();
    } else {
      alert(error || "Erreur lors de la mise a jour");
    }
    setActionLoading(false);
  };

  // Handle credit
  const handleCreditArtisan = async () => {
    if (!creditDialog.artisan) return;
    setActionLoading(true);
    const { success, error } = await creditArtisan(
      creditDialog.artisan.id,
      creditAmount,
      creditReason
    );
    if (success) {
      setCreditDialog({ open: false, artisan: null });
      setCreditAmount(5);
      setCreditReason("");
      fetchArtisans();
    } else {
      alert(error || "Erreur lors du credit");
    }
    setActionLoading(false);
  };

  // Status badge
  const getStatusBadge = (artisan: ArtisanListItem) => {
    if (artisan.is_suspended) {
      return <Badge variant="destructive">Suspendu</Badge>;
    }
    if (!artisan.is_active) {
      return <Badge variant="secondary">Inactif</Badge>;
    }
    return <Badge className="bg-green-100 text-green-700">Actif</Badge>;
  };

  // Update URL when filter changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }
    router.replace(`/admin/artisans${params.toString() ? `?${params.toString()}` : ""}`);
  }, [statusFilter, router]);

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Gestion des Artisans</h2>
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
          <h2 className="text-2xl font-bold">Gestion des Artisans</h2>
          <p className="text-muted-foreground">
            {total} artisan{total > 1 ? "s" : ""} au total
          </p>
        </div>
        <Button variant="outline" onClick={fetchArtisans} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou ville..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as StatusFilter);
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
                <SelectItem value="suspended">Suspendus</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des artisans */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des artisans</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-100 rounded animate-pulse" />
              ))}
            </div>
          ) : artisans.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun artisan trouve
            </p>
          ) : (
            <div className="divide-y">
              {artisans.map((artisan) => (
                <div
                  key={artisan.id}
                  className="flex items-center justify-between py-4 hover:bg-slate-50 -mx-4 px-4 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium">
                      {artisan.first_name?.[0] || "?"}{artisan.last_name?.[0] || ""}
                    </div>
                    <div>
                      <div className="font-medium">
                        {artisan.first_name} {artisan.last_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {artisan.city || "Ville non renseignee"} • {artisan.phone || "Pas de tel"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Stats */}
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-blue-600">{artisan.credits}</div>
                        <div className="text-muted-foreground text-xs">Credits</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-green-600">{artisan.leadsAccepted}</div>
                        <div className="text-muted-foreground text-xs">Acceptes</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-semibold ${artisan.consecutiveExpired >= 3 ? "text-red-600" : "text-slate-600"}`}>
                          {artisan.consecutiveExpired}
                        </div>
                        <div className="text-muted-foreground text-xs">Rates cons.</div>
                      </div>
                    </div>
                    {/* Status */}
                    {getStatusBadge(artisan)}
                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {artisan.is_suspended ? (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(artisan.id, "unsuspend")}
                            disabled={actionLoading}
                          >
                            <UserCheck className="w-4 h-4 mr-2 text-green-600" />
                            Lever la suspension
                          </DropdownMenuItem>
                        ) : artisan.is_active ? (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(artisan.id, "deactivate")}
                              disabled={actionLoading}
                            >
                              <UserX className="w-4 h-4 mr-2 text-slate-600" />
                              Desactiver
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleStatusChange(artisan.id, "suspend")}
                              disabled={actionLoading}
                              className="text-red-600"
                            >
                              <UserX className="w-4 h-4 mr-2" />
                              Suspendre
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(artisan.id, "activate")}
                            disabled={actionLoading}
                          >
                            <UserCheck className="w-4 h-4 mr-2 text-green-600" />
                            Activer
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setCreditDialog({ open: true, artisan })}
                        >
                          <Gift className="w-4 h-4 mr-2 text-purple-600" />
                          Offrir des credits
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
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
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Precedent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={(page + 1) * limit >= total}
                >
                  Suivant
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog credits */}
      <Dialog open={creditDialog.open} onOpenChange={(open) => setCreditDialog({ open, artisan: open ? creditDialog.artisan : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Offrir des credits</DialogTitle>
            <DialogDescription>
              Offrir des credits gratuits a {creditDialog.artisan?.first_name} {creditDialog.artisan?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="credits">Nombre de credits</Label>
              <Input
                id="credits"
                type="number"
                min={1}
                max={100}
                value={creditAmount}
                onChange={(e) => setCreditAmount(parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Raison (optionnel)</Label>
              <Input
                id="reason"
                placeholder="Ex: compensation suite a reclamation"
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditDialog({ open: false, artisan: null })}>
              Annuler
            </Button>
            <Button onClick={handleCreditArtisan} disabled={actionLoading}>
              {actionLoading ? "En cours..." : `Offrir ${creditAmount} credit${creditAmount > 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
