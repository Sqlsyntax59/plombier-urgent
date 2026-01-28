"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Phone,
  Clock,
  Shield,
  ChevronRight,
  Camera,
  X,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { createLead } from "@/lib/actions/lead";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PROBLEM_TYPES, PRICE_RANGES } from "@/lib/validations/lead";

type FormData = {
  problemType: string;
  description: string;
  photoUrl: string;
  clientPhone: string;
  clientEmail: string;
  clientCity: string;
};

export default function DemandePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    problemType: "",
    description: "",
    photoUrl: "",
    clientPhone: "",
    clientEmail: "",
    clientCity: "",
  });
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSelectProblemType = (type: string) => {
    setFormData({ ...formData, problemType: type });
    setCurrentStep(2);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDescriptionChange = (value: string) => {
    setFormData({ ...formData, description: value });
    if (value.length > 0 && value.length < 10) {
      setDescriptionError("La description doit contenir au moins 10 caracteres");
    } else if (value.length > 500) {
      setDescriptionError("La description ne peut pas depasser 500 caracteres");
    } else {
      setDescriptionError(null);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Verifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("La photo ne doit pas depasser 5MB");
        return;
      }

      // Preview local (upload Firebase sera fait a la soumission)
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setFormData({ ...formData, photoUrl: "" });
  };

  const canContinueStep2 = () => {
    return (
      formData.description.length >= 10 &&
      formData.description.length <= 500 &&
      !descriptionError
    );
  };

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, clientPhone: value });
    // Regex pour format mobile francais
    const phoneRegex = /^(?:(?:\+|00)33|0)\s*[67](?:[\s.-]*\d{2}){4}$/;
    if (value.length > 0 && !phoneRegex.test(value)) {
      setPhoneError("Numero invalide (format mobile 06/07 attendu)");
    } else {
      setPhoneError(null);
    }
  };

  const handleEmailChange = (value: string) => {
    setFormData({ ...formData, clientEmail: value });
    if (value.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        setEmailError("Adresse email invalide");
      } else {
        setEmailError(null);
      }
    } else {
      setEmailError(null);
    }
  };

  const canSubmit = () => {
    const phoneRegex = /^(?:(?:\+|00)33|0)\s*[67](?:[\s.-]*\d{2}){4}$/;
    return phoneRegex.test(formData.clientPhone) && !phoneError && !emailError;
  };

  const getSelectedProblemLabel = () => {
    return PROBLEM_TYPES.find((t) => t.value === formData.problemType)?.label;
  };

  const getPriceRange = () => {
    if (!formData.problemType) return null;
    return PRICE_RANGES[formData.problemType];
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    const result = await createLead({
      problemType: formData.problemType as "fuite" | "wc_bouche" | "ballon_eau_chaude" | "canalisation" | "robinetterie" | "autre",
      description: formData.description,
      photoUrl: formData.photoUrl,
      clientPhone: formData.clientPhone,
      clientEmail: formData.clientEmail,
      clientCity: formData.clientCity,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setSubmitError(result.error || "Une erreur est survenue");
    } else {
      setIsSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          {currentStep === 1 ? (
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Link href="/" className="font-bold text-xl text-primary">
            Plombier Urgent
          </Link>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="container mx-auto px-4 py-8 max-w-xl">
        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full transition-colors ${
                  step === currentStep
                    ? "bg-primary"
                    : step < currentStep
                      ? "bg-primary/50"
                      : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Etape 1: Selection type de panne */}
        {currentStep === 1 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">
                Quel est votre probleme ?
              </CardTitle>
              <p className="text-sm text-muted-foreground">Etape 1 sur 3</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {PROBLEM_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleSelectProblemType(type.value)}
                    className={`p-4 rounded-xl border-2 text-center transition-all hover:border-primary hover:bg-primary/5 ${
                      formData.problemType === type.value
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                  >
                    <span className="text-3xl block mb-2">{type.emoji}</span>
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Etape 2: Description et photo */}
        {currentStep === 2 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Decrivez votre probleme</CardTitle>
              <p className="text-sm text-muted-foreground">Etape 2 sur 3</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Fourchette de prix indicative */}
              {getPriceRange() && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-center">
                  <p className="text-sm text-muted-foreground">
                    Prix indicatif pour {getSelectedProblemLabel()?.toLowerCase()}
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {getPriceRange()?.min} - {getPriceRange()?.max} €
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    * Prix TTC indicatif, devis gratuit sur place
                  </p>
                </div>
              )}
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Decrivez votre probleme en detail (ex: fuite sous l'evier de la cuisine depuis ce matin...)"
                  value={formData.description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
                <div className="flex justify-between text-xs">
                  {descriptionError ? (
                    <span className="text-destructive">{descriptionError}</span>
                  ) : (
                    <span className="text-muted-foreground">
                      Minimum 10 caracteres
                    </span>
                  )}
                  <span
                    className={
                      formData.description.length > 500
                        ? "text-destructive"
                        : "text-muted-foreground"
                    }
                  >
                    {formData.description.length}/500
                  </span>
                </div>
              </div>

              {/* Photo optionnelle */}
              <div className="space-y-2">
                <Label>Photo (optionnelle)</Label>
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Apercu"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                    <button
                      onClick={handleRemovePhoto}
                      className="absolute top-2 right-2 p-1 bg-background/80 rounded-full hover:bg-background"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                    <Camera className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Ajouter une photo
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Max 5MB
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </label>
                )}
              </div>

              <Button
                className="w-full gap-2"
                size="lg"
                onClick={() => setCurrentStep(3)}
                disabled={!canContinueStep2()}
              >
                Continuer
                <ChevronRight className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Etape 3: Coordonnees */}
        {currentStep === 3 && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Vos coordonnees</CardTitle>
              <p className="text-sm text-muted-foreground">Etape 3 sur 3</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recap avec fourchette de prix */}
              {getPriceRange() && (
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm">
                    {getSelectedProblemLabel()} - Estimation :{" "}
                    <span className="font-semibold text-primary">
                      {getPriceRange()?.min} - {getPriceRange()?.max} €
                    </span>
                  </p>
                </div>
              )}

              {/* Telephone */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Telephone <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="06 12 34 56 78"
                  value={formData.clientPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                />
                {phoneError && (
                  <p className="text-xs text-destructive">{phoneError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  L'artisan vous appellera sur ce numero
                </p>
              </div>

              {/* Email optionnel */}
              <div className="space-y-2">
                <Label htmlFor="email">Email (optionnel)</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.fr"
                  value={formData.clientEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                />
                {emailError && (
                  <p className="text-xs text-destructive">{emailError}</p>
                )}
              </div>

              {/* Ville optionnelle */}
              <div className="space-y-2">
                <Label htmlFor="city">Ville (optionnel)</Label>
                <Input
                  id="city"
                  placeholder="Paris"
                  value={formData.clientCity}
                  onChange={(e) =>
                    setFormData({ ...formData, clientCity: e.target.value })
                  }
                />
              </div>

              {submitError && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
                  {submitError}
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                disabled={!canSubmit() || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Contacter un artisan maintenant"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Ecran de confirmation */}
        {isSubmitted && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-xl mb-2">Demande envoyee !</CardTitle>
              <p className="text-muted-foreground mb-6">
                Un artisan va vous contacter dans les prochaines minutes.
                Gardez votre telephone a portee de main.
              </p>

              {/* Recap */}
              <div className="p-4 rounded-lg bg-muted/50 text-left mb-6">
                <p className="text-sm mb-2">
                  <span className="text-muted-foreground">Type de panne :</span>{" "}
                  <span className="font-medium">{getSelectedProblemLabel()}</span>
                </p>
                <p className="text-sm">
                  <span className="text-muted-foreground">Estimation :</span>{" "}
                  <span className="font-medium text-primary">
                    {getPriceRange()?.min} - {getPriceRange()?.max} €
                  </span>
                </p>
              </div>

              <Button variant="outline" asChild>
                <Link href="/">Retour a l'accueil</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Trust indicators */}
        <div className="grid grid-cols-3 gap-4 mt-8">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Reponse rapide</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Contact direct</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Artisans verifies</p>
          </div>
        </div>
      </main>
    </div>
  );
}
