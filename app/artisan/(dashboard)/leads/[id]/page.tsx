"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Phone, Mail, MapPin, ArrowLeft, CheckCircle2, Clock, Image } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface LeadDetails {
  id: string;
  problem_type: string;
  description: string;
  photo_url: string | null;
  client_phone: string;
  client_email: string | null;
  client_city: string | null;
  status: string;
  created_at: string;
}

export default function LeadDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const leadId = params.id as string;
  const justAccepted = searchParams.get("accepted") === "true";

  const [lead, setLead] = useState<LeadDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLead() {
      const supabase = createClient();

      // Vérifier que l'artisan est connecté
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Non connecté");
        setLoading(false);
        return;
      }

      // Vérifier que l'artisan a bien ce lead assigné
      const { data: assignment } = await supabase
        .from("lead_assignments")
        .select("id, status")
        .eq("lead_id", leadId)
        .eq("artisan_id", user.id)
        .eq("status", "accepted")
        .single();

      if (!assignment) {
        setError("Accès non autorisé");
        setLoading(false);
        return;
      }

      // Récupérer le lead
      const { data: leadData, error: leadError } = await supabase
        .from("leads")
        .select("*")
        .eq("id", leadId)
        .single();

      if (leadError || !leadData) {
        setError("Lead non trouvé");
        setLoading(false);
        return;
      }

      setLead(leadData);
      setLoading(false);
    }

    fetchLead();
  }, [leadId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600 text-center">{error}</p>
            <div className="mt-4 text-center">
              <Link href="/artisan/leads">
                <Button variant="outline">Retour aux leads</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!lead) {
    return null;
  }

  const problemLabel = PROBLEM_TYPE_LABELS[lead.problem_type] || lead.problem_type;
  const createdAt = new Date(lead.created_at).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/artisan/leads"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Retour aux leads
      </Link>

      {/* Success banner */}
      {justAccepted && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div>
            <p className="font-medium text-green-800">Lead accepté avec succès</p>
            <p className="text-sm text-green-600">
              Contactez le client rapidement pour planifier l'intervention.
            </p>
          </div>
        </div>
      )}

      {/* Lead details */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">{problemLabel}</CardTitle>
            <span className="inline-flex items-center gap-1 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              {createdAt}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Description */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
            <p className="text-gray-900">{lead.description}</p>
          </div>

          {/* Photo */}
          {lead.photo_url && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Photo</h3>
              <a
                href={lead.photo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={lead.photo_url}
                  alt="Photo du problème"
                  className="rounded-lg max-h-64 object-cover"
                />
              </a>
            </div>
          )}

          {/* Localisation */}
          {lead.client_city && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span>{lead.client_city}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact client */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg text-blue-900">Contact client</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Téléphone */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-blue-600" />
              <span className="font-medium">{lead.client_phone}</span>
            </div>
            <a href={`tel:${lead.client_phone}`}>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Phone className="h-4 w-4 mr-2" />
                Appeler
              </Button>
            </a>
          </div>

          {/* Email */}
          {lead.client_email && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <span>{lead.client_email}</span>
              </div>
              <a href={`mailto:${lead.client_email}`}>
                <Button variant="outline">Envoyer un email</Button>
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conseils */}
      <div className="text-sm text-gray-500 space-y-2">
        <p>
          <strong>Conseil :</strong> Appelez le client dans les prochaines minutes pour
          maximiser vos chances d'intervention.
        </p>
        <p>
          N'oubliez pas de confirmer l'adresse exacte et d'estimer le coût de
          l'intervention.
        </p>
      </div>
    </div>
  );
}
