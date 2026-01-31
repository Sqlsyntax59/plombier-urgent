"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Phone,
  MessageSquare,
  Star,
  Calendar,
  RefreshCw,
  User,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  getReclamations,
  creditArtisan,
  type Reclamation,
} from "@/lib/actions/admin-dashboard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PROBLEM_TYPE_LABELS, type ProblemType } from "@/types/database.types";

export default function AdminReclamationsPage() {
  const [reclamations, setReclamations] = useState<Reclamation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const limit = 20;

  // Dialog credit
  const [creditDialog, setCreditDialog] = useState<{
    open: boolean;
    artisanId: string | null;
    artisanName: string;
  }>({ open: false, artisanId: null, artisanName: "" });
  const [creditAmount, setCreditAmount] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReclamations = useCallback(async () => {
    setLoading(true);
    const { data, total, error } = await getReclamations({
      limit,
      offset: page * limit,
    });
    if (error) {
      setError(error);
    } else {
      setReclamations(data);
      setTotal(total);
      setError(null);
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchReclamations();
  }, [fetchReclamations]);

  const handleCreditArtisan = async () => {
    if (!creditDialog.artisanId) return;
    setActionLoading(true);
    const { success, error } = await creditArtisan(
      creditDialog.artisanId,
      creditAmount,
      "Compensation reclamation client"
    );
    if (success) {
      setCreditDialog({ open: false, artisanId: null, artisanName: "" });
      setCreditAmount(1);
      alert("Credits offerts avec succes");
    } else {
      alert(error || "Erreur lors du credit");
    }
    setActionLoading(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? "text-yellow-400 fill-yellow-400" : "text-slate-300"
            }`}
          />
        ))}
      </div>
    );
  };

  const issueLabels: Record<string, string> = {
    retard: "Retard",
    prix: "Prix eleve",
    qualite: "Qualite du travail",
    communication: "Communication",
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Reclamations</h2>
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
            <AlertTriangle className="w-6 h-6 text-red-500" />
            Reclamations
          </h2>
          <p className="text-muted-foreground">
            {total} reclamation{total > 1 ? "s" : ""} client{total > 1 ? "s" : ""} a traiter
          </p>
        </div>
        <Button variant="outline" onClick={fetchReclamations} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Liste des reclamations */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="h-24 bg-slate-100 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reclamations.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-medium">Aucune reclamation en attente</p>
              <p className="text-muted-foreground">Tous les clients sont satisfaits</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reclamations.map((reclamation) => (
            <Card key={reclamation.id} className="border-red-200 bg-red-50/30">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">
                        Lead #{reclamation.lead_id.slice(0, 8)}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {formatDate(reclamation.submitted_at)}
                      </div>
                    </div>
                  </div>
                  {renderStars(reclamation.rating)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Problemes signales */}
                {reclamation.issues && reclamation.issues.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {reclamation.issues.map((issue) => (
                      <Badge key={issue} variant="destructive" className="text-xs">
                        {issueLabels[issue] || issue}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Commentaire */}
                {reclamation.comment && (
                  <div className="bg-white p-3 rounded-lg border">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm">{reclamation.comment}</p>
                    </div>
                  </div>
                )}

                {/* Infos lead et artisan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Client</p>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium">
                        {reclamation.lead.client_phone}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {reclamation.lead.client_city} •{" "}
                      {PROBLEM_TYPE_LABELS[reclamation.lead.problem_type as ProblemType]}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Artisan concerne</p>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium">
                        {reclamation.artisan.first_name} {reclamation.artisan.last_name}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {reclamation.artisan.phone}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCreditDialog({
                        open: true,
                        artisanId: reclamation.artisan_id,
                        artisanName: `${reclamation.artisan.first_name} ${reclamation.artisan.last_name}`,
                      })
                    }
                  >
                    Offrir credit compensation
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/artisans?search=${reclamation.artisan.first_name}`}>
                      Voir artisan
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between pt-4">
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

      {/* Dialog credits compensation */}
      <Dialog
        open={creditDialog.open}
        onOpenChange={(open) =>
          setCreditDialog({ open, artisanId: open ? creditDialog.artisanId : null, artisanName: "" })
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Compensation client</DialogTitle>
            <DialogDescription>
              Offrir des credits a l&apos;artisan {creditDialog.artisanName} en compensation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="credits">Nombre de credits</Label>
              <Input
                id="credits"
                type="number"
                min={1}
                max={10}
                value={creditAmount}
                onChange={(e) => setCreditAmount(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreditDialog({ open: false, artisanId: null, artisanName: "" })}
            >
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
