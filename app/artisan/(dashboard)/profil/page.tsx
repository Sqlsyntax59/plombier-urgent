"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save, ExternalLink } from "lucide-react";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // Charger le profil existant
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
      // Recharger pour obtenir le slug genere
      const profile = await getCurrentProfile();
      if (profile?.slug) {
        setSlug(profile.slug);
      }
    }
    setIsLoading(false);
  }

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mon Profil</h2>
        <p className="text-muted-foreground">
          Gerez vos informations personnelles et professionnelles
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Formulaire principal */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* Nom / Prenom */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prenom</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Nom</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Telephone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telephone principal</FormLabel>
                      <FormControl>
                        <Input type="tel" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* WhatsApp */}
                <FormField
                  control={form.control}
                  name="whatsappPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numero WhatsApp</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="06 12 34 56 78"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Pour recevoir les notifications de leads
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Ville */}
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Rayon d'intervention */}
                <FormField
                  control={form.control}
                  name="radiusKm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rayon d'intervention</FormLabel>
                      <Select
                        onValueChange={(val) => field.onChange(parseInt(val))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selectionnez un rayon" />
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
                      <FormDescription>
                        Zone dans laquelle vous acceptez les interventions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Google Business */}
                <FormField
                  control={form.control}
                  name="googleBusinessUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lien Google My Business</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://g.co/..."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Sera affiche sur votre page publique pour les avis
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Messages */}
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 rounded-lg bg-green-500/10 text-green-600 text-sm">
                    Profil mis a jour avec succes !
                  </div>
                )}

                {/* Submit */}
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Enregistrer
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Sidebar - Page publique */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Page publique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {slug ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Votre page publique est accessible a cette adresse :
                  </p>
                  <Button variant="outline" className="w-full gap-2" asChild>
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
                <p className="text-sm text-muted-foreground">
                  Enregistrez votre profil pour generer votre page publique.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conseils</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Gardez vos informations a jour</li>
                <li>• Ajoutez votre lien Google pour les avis</li>
                <li>• Definissez un rayon realiste</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
