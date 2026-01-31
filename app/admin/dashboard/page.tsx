"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  FileText,
  TrendingUp,
  AlertTriangle,
  Clock,
  CreditCard,
  Layers,
  UserX,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAdminStats, type AdminStats } from "@/lib/actions/admin-dashboard";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      const { data, error } = await getAdminStats();
      if (error) {
        setError(error);
      } else {
        setStats(data);
      }
      setLoading(false);
    }
    fetchStats();
  }, []);

  const formatResponseTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const formatRevenue = (cents: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Administration</h2>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-slate-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-slate-200 rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Dashboard Administration</h2>
          <p className="text-destructive">{error}</p>
        </div>
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Vous devez etre connecte en tant qu&apos;admin pour acceder a cette page.
            </p>
            <div className="flex justify-center mt-4">
              <Button asChild>
                <Link href="/login">Se connecter</Link>
              </Button>
            </div>
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
          <h2 className="text-2xl font-bold">Dashboard Administration</h2>
          <p className="text-muted-foreground">
            Vue d&apos;ensemble de la plateforme
          </p>
        </div>
        <Badge variant="destructive" className="text-sm">
          Admin
        </Badge>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200/60">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-blue-700">
              Artisans actifs
            </CardTitle>
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              {stats?.activeArtisans || 0}
            </div>
            {(stats?.suspendedArtisans || 0) > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                +{stats?.suspendedArtisans} suspendus
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border-green-200/60">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-green-700">
              Leads aujourd&apos;hui
            </CardTitle>
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">
              {stats?.leadsToday || 0}
            </div>
            <p className="text-xs text-green-600 mt-1">
              {stats?.acceptedLeadsToday || 0} acceptes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200/60">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-purple-700">
              CA ce mois
            </CardTitle>
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">
              {formatRevenue(stats?.revenueThisMonth || 0)}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              {stats?.leadsThisMonth || 0} leads ce mois
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-200/60">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-amber-700">
              Temps reponse moyen
            </CardTitle>
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-900">
              {formatResponseTime(stats?.avgResponseTime || 0)}
            </div>
            <p className="text-xs text-amber-600 mt-1">
              Moyenne 7 derniers jours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stats secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`${(stats?.reclamationsCount || 0) > 0 ? "border-red-300 bg-red-50" : ""}`}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reclamations en attente
            </CardTitle>
            <AlertTriangle className={`w-5 h-5 ${(stats?.reclamationsCount || 0) > 0 ? "text-red-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.reclamationsCount || 0) > 0 ? "text-red-600" : ""}`}>
              {stats?.reclamationsCount || 0}
            </div>
            {(stats?.reclamationsCount || 0) > 0 && (
              <Button variant="link" className="p-0 h-auto text-red-600" asChild>
                <Link href="/admin/reclamations">Voir les reclamations</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className={`${(stats?.suspendedArtisans || 0) > 0 ? "border-amber-300 bg-amber-50" : ""}`}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Artisans suspendus
            </CardTitle>
            <UserX className={`w-5 h-5 ${(stats?.suspendedArtisans || 0) > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.suspendedArtisans || 0) > 0 ? "text-amber-600" : ""}`}>
              {stats?.suspendedArtisans || 0}
            </div>
            {(stats?.suspendedArtisans || 0) > 0 && (
              <Button variant="link" className="p-0 h-auto text-amber-600" asChild>
                <Link href="/admin/artisans?status=suspended">Gerer</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Verticales actives
            </CardTitle>
            <Layers className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalVerticals || 0}</div>
            <Button variant="link" className="p-0 h-auto" asChild>
              <Link href="/admin/verticales">Gerer les verticales</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Actions rapides
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/admin/artisans">
              <Users className="w-4 h-4 mr-2" />
              Gerer les artisans
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/leads">
              <FileText className="w-4 h-4 mr-2" />
              Historique leads
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/reclamations">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Reclamations
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Retour site public</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
