"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  Save,
  ExternalLink,
  User,
  Phone,
  MapPin,
  Globe,
  MessageCircle,
  Target,
  CheckCircle2,
  Lightbulb,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  profileUpdateSchema,
  type ProfileUpdateInput,
} from "@/lib/validations/artisan";
import { updateProfile, getCurrentProfile } from "@/lib/actions/profile";

const RADIUS_OPTIONS = [5, 10, 15, 20, 30, 50, 75, 100];

export default function ProfilPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      whatsappPhone: "",
      city: "",
      radiusKm: 20,
      googleBusinessUrl: "",
    },
  });

  useEffect(() => {
    async function loadProfile() {
      const profile = await getCurrentProfile();
      if (profile) {
        form.reset({
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          phone: profile.phone || "",
          whatsappPhone: profile.whatsapp_phone || "",
          city: profile.city || "",
          radiusKm: profile.radius_km || 20,
          googleBusinessUrl: profile.google_business_url || "",
        });
        setSlug(profile.slug);
      }
      setIsFetching(false);
    }
    loadProfile();
  }, [form]);

  async function onSubmit(data: ProfileUpdateInput) {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const result = await updateProfile(data);

    if (!result.success) {
      setError(result.error || "Une erreur est survenue");
    } else {
      setSuccess(true);
      const profile = await getCurrentProfile();
      if (profile?.slug) {
        setSlug(profile.slug);
      }
    }
    setIsLoading(false);
  }

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="mt-4 text-slate-500">Chargement du profil...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Mon Profil</h1>
        <p className="text-slate-500 mt-1">
          Gérez vos informations personnelles et professionnelles
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulaire principal */}
        <Card className="lg:col-span-2 bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-lg shadow-slate-900/[0.08]">
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Section identité */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-700" />
                    </div>
                    <h3 className="font-semibold text-slate-800">Identité</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Prénom</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="h-11 rounded-xl border-slate-200 focus:border-blue-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Nom</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="h-11 rounded-xl border-slate-200 focus:border-blue-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Section contact */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <Phone className="h-4 w-4 text-green-700" />
                    </div>
                    <h3 className="font-semibold text-slate-800">Contact</h3>
                  </div>
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Téléphone principal</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              {...field}
                              className="h-11 rounded-xl border-slate-200 focus:border-blue-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="whatsappPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-green-500" />
                            Numéro WhatsApp
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              placeholder="06 12 34 56 78"
                              {...field}
                              className="h-11 rounded-xl border-slate-200 focus:border-blue-500"
                            />
                          </FormControl>
                          <FormDescription className="text-slate-400">
                            Pour recevoir les notifications de leads
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Section localisation */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-purple-700" />
                    </div>
                    <h3 className="font-semibold text-slate-800">Localisation</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700">Ville</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="h-11 rounded-xl border-slate-200 focus:border-blue-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="radiusKm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-700 flex items-center gap-2">
                            <Target className="h-4 w-4 text-purple-500" />
                            Rayon d'intervention
                          </FormLabel>
                          <Select
                            onValueChange={(val) => field.onChange(parseInt(val))}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger className="h-11 rounded-xl border-slate-200">
                                <SelectValue placeholder="Sélectionnez" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {RADIUS_OPTIONS.map((km) => (
                                <SelectItem key={km} value={km.toString()}>
                                  {km} km
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Section Google */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Globe className="h-4 w-4 text-amber-700" />
                    </div>
                    <h3 className="font-semibold text-slate-800">Visibilité</h3>
                  </div>
                  <FormField
                    control={form.control}
                    name="googleBusinessUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-700">Lien Google My Business</FormLabel>
                        <FormControl>
                          <Input
                            type="url"
                            placeholder="https://g.co/..."
                            {...field}
                            className="h-11 rounded-xl border-slate-200 focus:border-blue-500"
                          />
                        </FormControl>
                        <FormDescription className="text-slate-400">
                          Affiché sur votre page publique pour les avis clients
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Messages */}
                {error && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-4 rounded-xl bg-green-50 border border-green-200 text-green-600 text-sm flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Profil mis à jour avec succès !
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto h-12 px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/25 rounded-xl"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer les modifications
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Page publique */}
          <Card className="bg-white/90 backdrop-blur-sm border border-slate-200/80 shadow-lg shadow-slate-900/[0.08] overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />
            <CardContent className="p-5">
              <h3 className="font-semibold text-slate-800 mb-3">Page publique</h3>
              {slug ? (
                <>
                  <p className="text-sm text-slate-500 mb-4">
                    Votre page est accessible à cette adresse :
                  </p>
                  <Button variant="outline" className="w-full gap-2 rounded-xl" asChild>
                    <a
                      href={`/artisan/${slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Voir ma page
                    </a>
                  </Button>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  Enregistrez votre profil pour générer votre page publique.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Conseils */}
          <Card className="bg-amber-50/80 backdrop-blur-sm border border-amber-200/60 shadow-lg shadow-amber-900/[0.05]">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <h3 className="font-semibold text-slate-800">Conseils</h3>
              </div>
              <ul className="text-sm text-slate-600 space-y-3">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  Gardez vos informations à jour
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  Ajoutez votre lien Google pour les avis
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  Définissez un rayon réaliste
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
