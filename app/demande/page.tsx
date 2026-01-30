"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Phone,
  Clock,
  Shield,
  ChevronRight,
  Camera,
  X,
  Loader2,
  CheckCircle2,
  Droplets,
  Wrench,
  Flame,
  Zap,
  MapPin,
  Mail,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import { createLead } from "@/lib/actions/lead";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PROBLEM_TYPES, PRICE_RANGES, GUIDED_QUESTIONS, type GuidedAnswers } from "@/lib/validations/lead";

type FormData = {
  problemType: string;
  description: string;
  photoUrl: string;
  clientPhone: string;
  clientEmail: string;
  clientCity: string;
  guidedAnswers: GuidedAnswers;
};

const problemTypeIcons: Record<string, { icon: typeof Droplets; color: string; bg: string }> = {
  fuite: { icon: Droplets, color: "text-blue-700", bg: "bg-blue-100 border-blue-300" },
  wc_bouche: { icon: Wrench, color: "text-amber-700", bg: "bg-amber-100 border-amber-300" },
  ballon_eau_chaude: { icon: Flame, color: "text-orange-700", bg: "bg-orange-100 border-orange-300" },
  canalisation: { icon: Droplets, color: "text-cyan-700", bg: "bg-cyan-100 border-cyan-300" },
  robinetterie: { icon: Wrench, color: "text-purple-700", bg: "bg-purple-100 border-purple-300" },
  autre: { icon: Zap, color: "text-red-700", bg: "bg-red-100 border-red-300" },
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
    guidedAnswers: {},
  });
  const [descriptionError, setDescriptionError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSelectProblemType = (type: string) => {
    setFormData({ ...formData, problemType: type, guidedAnswers: {} });
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
      setDescriptionError("La description doit contenir au moins 10 caractères");
    } else if (value.length > 500) {
      setDescriptionError("La description ne peut pas dépasser 500 caractères");
    } else {
      setDescriptionError(null);
    }
  };

  const handleGuidedAnswer = (questionId: string, value: string | boolean) => {
    setFormData({
      ...formData,
      guidedAnswers: { ...formData.guidedAnswers, [questionId]: value },
    });
  };

  const getGuidedQuestions = () => {
    return GUIDED_QUESTIONS[formData.problemType] || [];
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("La photo ne doit pas dépasser 5MB");
        return;
      }
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
    const phoneRegex = /^(?:(?:\+|00)33|0)\s*[67](?:[\s.-]*\d{2}){4}$/;
    if (value.length > 0 && !phoneRegex.test(value)) {
      setPhoneError("Numéro invalide (format mobile 06/07 attendu)");
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
      guidedAnswers: formData.guidedAnswers,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setSubmitError(result.error || "Une erreur est survenue");
    } else {
      setIsSubmitted(true);
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Quel est votre problème ?";
      case 2: return "Décrivez la situation";
      case 3: return "Vos coordonnées";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 via-purple-50/30 to-white">
      {/* Header moderne */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 border-b border-slate-100">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          {currentStep === 1 ? (
            <Button variant="ghost" size="icon" className="hover:bg-slate-100" asChild>
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
          ) : (
            <Button variant="ghost" size="icon" className="hover:bg-slate-100" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <Droplets className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Plombier Urgent
            </span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        {!isSubmitted && (
          <>
            {/* Progress bar moderne */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">{getStepTitle()}</span>
                <span className="text-sm text-slate-500">Étape {currentStep}/3</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(currentStep / 3) * 100}%` }}
                />
              </div>
            </div>
          </>
        )}

        {/* Étape 1: Sélection type de panne */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-6">
              <p className="text-slate-600">Sélectionnez le type d'intervention</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {PROBLEM_TYPES.map((type) => {
                const iconData = problemTypeIcons[type.value] || problemTypeIcons.autre;
                const IconComponent = iconData.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => handleSelectProblemType(type.value)}
                    className={`group relative p-5 rounded-2xl border-2 text-center transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${
                      formData.problemType === type.value
                        ? `${iconData.bg} border-2 shadow-md`
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className={`w-14 h-14 mx-auto mb-3 rounded-xl ${iconData.bg.split(' ')[0]} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <IconComponent className={`h-7 w-7 ${iconData.color}`} />
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Étape 2: Description et photo */}
        {currentStep === 2 && (
          <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-xl shadow-slate-900/[0.08] animate-in fade-in slide-in-from-right-4 duration-300">
            <CardContent className="p-6 space-y-5">
              {/* Fourchette de prix */}
              {getPriceRange() && (
                <div className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-full blur-2xl opacity-50" />
                  <div className="relative">
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-1">
                      <Sparkles className="h-4 w-4 text-blue-500" />
                      Prix indicatif pour {getSelectedProblemLabel()?.toLowerCase()}
                    </div>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {getPriceRange()?.min} - {getPriceRange()?.max} €
                    </p>
                    <p className="text-xs text-slate-500 mt-1">* Devis gratuit sur place</p>
                  </div>
                </div>
              )}

              {/* Questions guidées */}
              {getGuidedQuestions().length > 0 && (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-slate-700">
                    Quelques questions rapides :
                  </p>
                  {getGuidedQuestions().map((q) => (
                    <div key={q.id} className="space-y-2">
                      <Label className="text-sm text-slate-600">{q.label}</Label>
                      {q.type === "select" && q.options && (
                        <div className="flex flex-wrap gap-2">
                          {q.options.map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => handleGuidedAnswer(q.id, option)}
                              className={`px-4 py-2 text-sm rounded-full border-2 transition-all ${
                                formData.guidedAnswers[q.id] === option
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white border-slate-200 hover:border-blue-300 text-slate-700"
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                      {q.type === "boolean" && (
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => handleGuidedAnswer(q.id, true)}
                            className={`flex-1 px-4 py-2.5 text-sm rounded-xl border-2 font-medium transition-all ${
                              formData.guidedAnswers[q.id] === true
                                ? "bg-blue-600 text-white border-blue-600"
                                : "bg-white border-slate-200 hover:border-blue-300 text-slate-700"
                            }`}
                          >
                            Oui
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGuidedAnswer(q.id, false)}
                            className={`flex-1 px-4 py-2.5 text-sm rounded-xl border-2 font-medium transition-all ${
                              formData.guidedAnswers[q.id] === false
                                ? "bg-slate-200 text-slate-700 border-slate-300"
                                : "bg-white border-slate-200 hover:border-slate-300 text-slate-700"
                            }`}
                          >
                            Non
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-semibold text-slate-700">
                  Décrivez le problème <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder={
                    formData.problemType === "fuite"
                      ? "Ex: La fuite a commencé ce matin, il y a une flaque sous l'évier..."
                      : formData.problemType === "wc_bouche"
                      ? "Ex: Les WC sont bouchés depuis hier soir..."
                      : formData.problemType === "ballon_eau_chaude"
                      ? "Ex: Plus d'eau chaude depuis ce matin..."
                      : "Décrivez votre problème en quelques mots..."
                  }
                  value={formData.description}
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  className="min-h-[120px] resize-none rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                />
                <div className="flex justify-between text-xs">
                  {descriptionError ? (
                    <span className="text-red-500">{descriptionError}</span>
                  ) : (
                    <span className="text-slate-400">Minimum 10 caractères</span>
                  )}
                  <span className={formData.description.length > 500 ? "text-red-500" : "text-slate-400"}>
                    {formData.description.length}/500
                  </span>
                </div>
              </div>

              {/* Photo */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-slate-700">Photo (optionnelle)</Label>
                {photoPreview ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <img src={photoPreview} alt="Aperçu" className="w-full h-40 object-cover" />
                    <button
                      onClick={handleRemovePhoto}
                      className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <X className="h-4 w-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all">
                    <Camera className="h-8 w-8 text-slate-400 mb-2" />
                    <span className="text-sm text-slate-500">Ajouter une photo</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                  </label>
                )}
              </div>

              <Button
                className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/25 rounded-xl"
                onClick={() => setCurrentStep(3)}
                disabled={!canContinueStep2()}
              >
                Continuer
                <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Étape 3: Coordonnées */}
        {currentStep === 3 && (
          <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-xl shadow-slate-900/[0.08] animate-in fade-in slide-in-from-right-4 duration-300">
            <CardContent className="p-6 space-y-5">
              {/* Recap */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-3">
                  {formData.problemType && (
                    <>
                      {(() => {
                        const iconData = problemTypeIcons[formData.problemType] || problemTypeIcons.autre;
                        const IconComponent = iconData.icon;
                        return (
                          <div className={`w-10 h-10 rounded-lg ${iconData.bg.split(' ')[0]} flex items-center justify-center`}>
                            <IconComponent className={`h-5 w-5 ${iconData.color}`} />
                          </div>
                        );
                      })()}
                    </>
                  )}
                  <div>
                    <p className="font-semibold text-slate-800">{getSelectedProblemLabel()}</p>
                    <p className="text-sm text-blue-600 font-medium">
                      {getPriceRange()?.min} - {getPriceRange()?.max} € (estimation)
                    </p>
                  </div>
                </div>
              </div>

              {/* Téléphone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">
                  <Phone className="h-4 w-4 inline mr-1" />
                  Téléphone <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="06 12 34 56 78"
                  value={formData.clientPhone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="h-12 rounded-xl border-2 border-slate-200 focus:border-blue-500 text-lg"
                />
                {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
                <p className="text-xs text-slate-500">L'artisan vous appellera sur ce numéro</p>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                  <Mail className="h-4 w-4 inline mr-1" />
                  Email (optionnel)
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="votre@email.fr"
                  value={formData.clientEmail}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="h-12 rounded-xl border-2 border-slate-200 focus:border-blue-500"
                />
                {emailError && <p className="text-xs text-red-500">{emailError}</p>}
              </div>

              {/* Ville */}
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-semibold text-slate-700">
                  <MapPin className="h-4 w-4 inline mr-1" />
                  Ville (optionnel)
                </Label>
                <Input
                  id="city"
                  placeholder="Paris"
                  value={formData.clientCity}
                  onChange={(e) => setFormData({ ...formData, clientCity: e.target.value })}
                  className="h-12 rounded-xl border-2 border-slate-200 focus:border-blue-500"
                />
              </div>

              {submitError && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm text-center">
                  {submitError}
                </div>
              )}

              <Button
                className="w-full h-14 text-base bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/25 rounded-xl"
                disabled={!canSubmit() || isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    Envoyer ma demande
                    <ChevronRight className="h-5 w-5 ml-1" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Écran de confirmation */}
        {isSubmitted && (
          <div className="text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-32 h-32 bg-green-100 rounded-full blur-2xl opacity-50" />
              </div>
              <div className="relative w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-xl shadow-green-500/30">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <PartyPopper className="h-6 w-6 text-amber-500" />
              <h2 className="text-2xl font-bold text-slate-900">Demande envoyée !</h2>
              <PartyPopper className="h-6 w-6 text-amber-500 scale-x-[-1]" />
            </div>

            <p className="text-slate-600 mb-8">
              Un artisan va vous contacter dans les prochaines minutes.<br />
              <span className="font-medium text-slate-800">Gardez votre téléphone à portée de main.</span>
            </p>

            <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-lg shadow-slate-900/[0.08] mb-8">
              <CardContent className="p-5">
                <div className="flex items-center gap-4">
                  {formData.problemType && (
                    <>
                      {(() => {
                        const iconData = problemTypeIcons[formData.problemType] || problemTypeIcons.autre;
                        const IconComponent = iconData.icon;
                        return (
                          <div className={`w-12 h-12 rounded-xl ${iconData.bg.split(' ')[0]} flex items-center justify-center`}>
                            <IconComponent className={`h-6 w-6 ${iconData.color}`} />
                          </div>
                        );
                      })()}
                    </>
                  )}
                  <div className="text-left">
                    <p className="font-semibold text-slate-800">{getSelectedProblemLabel()}</p>
                    <p className="text-lg font-bold text-blue-600">
                      {getPriceRange()?.min} - {getPriceRange()?.max} €
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button variant="outline" size="lg" className="rounded-xl" asChild>
              <Link href="/">Retour à l'accueil</Link>
            </Button>
          </div>
        )}

        {/* Trust indicators */}
        {!isSubmitted && (
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { icon: Clock, label: "Réponse rapide", color: "text-blue-700", bg: "bg-blue-100" },
              { icon: Phone, label: "Contact direct", color: "text-green-700", bg: "bg-green-100" },
              { icon: Shield, label: "Artisans vérifiés", color: "text-purple-700", bg: "bg-purple-100" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className={`w-12 h-12 mx-auto mb-2 rounded-xl ${item.bg} flex items-center justify-center`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <p className="text-xs font-medium text-slate-600">{item.label}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
