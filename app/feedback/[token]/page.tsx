"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle, Star, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface FeedbackInfo {
  id: string;
  artisan_name: string;
  artisan_city?: string;
  problem_type: string;
  intervention_date: string;
}

const PROBLEM_LABELS: Record<string, string> = {
  fuite: "Fuite d'eau",
  wc_bouche: "WC bouché",
  ballon_eau_chaude: "Ballon d'eau chaude",
  canalisation: "Canalisation",
  robinetterie: "Robinetterie",
  autre: "Autre intervention",
};

const ISSUE_OPTIONS = [
  { id: "retard", label: "Retard important" },
  { id: "prix", label: "Prix trop élevé" },
  { id: "qualite", label: "Qualité du travail" },
  { id: "communication", label: "Manque de communication" },
  { id: "proprete", label: "Manque de propreté" },
];

export default function FeedbackPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [info, setInfo] = useState<FeedbackInfo | null>(null);
  const [satisfied, setSatisfied] = useState<boolean | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [issues, setIssues] = useState<string[]>([]);

  useEffect(() => {
    async function fetchFeedback() {
      try {
        const res = await fetch(`/api/feedback?token=${token}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Lien invalide");
          setLoading(false);
          return;
        }

        if (data.already_submitted) {
          setAlreadySubmitted(true);
          setLoading(false);
          return;
        }

        setInfo(data.feedback);
      } catch {
        setError("Erreur de connexion");
      }
      setLoading(false);
    }

    fetchFeedback();
  }, [token]);

  const handleSubmit = async () => {
    if (satisfied === null) return;

    setSubmitting(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          satisfied,
          rating: rating > 0 ? rating : undefined,
          comment: comment.trim() || undefined,
          issues: issues.length > 0 ? issues : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        setSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Erreur lors de l'envoi");
    }
    setSubmitting(false);
  };

  const toggleIssue = (issueId: string) => {
    setIssues(prev =>
      prev.includes(issueId)
        ? prev.filter(i => i !== issueId)
        : [...prev, issueId]
    );
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Erreur
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <p className="text-sm text-muted-foreground">
              Ce lien n'est plus valide ou a expiré.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Deja soumis
  if (alreadySubmitted || submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full text-center">
          <CardContent className="py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-xl font-bold mb-2">Merci pour votre retour !</h2>
            <p className="text-muted-foreground">
              Votre avis nous aide à améliorer la qualité de notre service.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary mb-2">
            Plombier Urgent
          </h1>
          <p className="text-muted-foreground">
            Donnez-nous votre avis sur l'intervention
          </p>
        </div>

        {/* Info intervention */}
        {info && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="py-4">
              <p className="text-sm text-blue-800">
                <strong>{info.artisan_name}</strong>
                {info.artisan_city && ` (${info.artisan_city})`}
              </p>
              <p className="text-sm text-blue-600">
                {PROBLEM_LABELS[info.problem_type] || info.problem_type}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Question satisfaction */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Êtes-vous satisfait de l'intervention ?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 justify-center">
              <Button
                variant={satisfied === true ? "default" : "outline"}
                size="lg"
                className={`flex-1 h-20 ${satisfied === true ? "bg-green-600 hover:bg-green-700" : ""}`}
                onClick={() => setSatisfied(true)}
              >
                <ThumbsUp className="h-8 w-8 mr-2" />
                Oui
              </Button>
              <Button
                variant={satisfied === false ? "default" : "outline"}
                size="lg"
                className={`flex-1 h-20 ${satisfied === false ? "bg-red-600 hover:bg-red-700" : ""}`}
                onClick={() => setSatisfied(false)}
              >
                <ThumbsDown className="h-8 w-8 mr-2" />
                Non
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Rating etoiles (si satisfait) */}
        {satisfied === true && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Quelle note donnez-vous ?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-10 w-10 ${
                        star <= (hoverRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center text-sm text-muted-foreground mt-2">
                  {rating === 5 && "Excellent !"}
                  {rating === 4 && "Très bien"}
                  {rating === 3 && "Correct"}
                  {rating === 2 && "Peut mieux faire"}
                  {rating === 1 && "Décevant"}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Problemes (si pas satisfait) */}
        {satisfied === false && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Qu'est-ce qui n'a pas été ?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ISSUE_OPTIONS.map((issue) => (
                <div key={issue.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={issue.id}
                    checked={issues.includes(issue.id)}
                    onCheckedChange={() => toggleIssue(issue.id)}
                  />
                  <Label htmlFor={issue.id} className="cursor-pointer">
                    {issue.label}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Commentaire */}
        {satisfied !== null && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Un commentaire ? (optionnel)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Partagez votre expérience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        {satisfied !== null && (
          <Button
            className="w-full h-12 text-lg"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              "Envoyer mon avis"
            )}
          </Button>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Vos données sont confidentielles et utilisées uniquement pour améliorer notre service.
        </p>
      </div>
    </div>
  );
}
