"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  Loader2,
  Droplets,
  User,
  Mail,
  Lock,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  ArrowRight,
  Shield,
  Zap,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";

import {
  artisanSignUpSchema,
  type ArtisanSignUpInput,
  TRADES,
  SPECIALIZATIONS,
} from "@/lib/validations/artisan";
import { signUpArtisan } from "@/lib/actions/auth";

const BENEFITS = [
  { icon: Zap, text: "Leads qualifiés en temps réel" },
  { icon: Users, text: "Clients dans votre zone" },
  { icon: Shield, text: "Paiement sécurisé" },
];

export default function InscriptionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ArtisanSignUpInput>({
    resolver: zodResolver(artisanSignUpSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phone: "",
      city: "",
      trade: undefined,
      siret: "",
      specializations: [],
      acceptCgv: false,
    },
  });

  async function onSubmit(data: ArtisanSignUpInput) {
    setIsLoading(true);
    setError(null);

    const result = await signUpArtisan(data);

    if (!result.success) {
      setError(result.error || "Une erreur est survenue");
      setIsLoading(false);
    }
  }

  const selectedTrade = form.watch("trade");
  const availableSpecs = selectedTrade ? SPECIALIZATIONS[selectedTrade] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 via-purple-50/30 to-white flex flex-col">
      {/* Header */}
      <header className="h-16 flex items-center px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
            <Droplets className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Plombier Urgent
          </span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="w-full max-w-lg">
          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Rejoignez le réseau
            </h1>
            <p className="text-slate-500">
              Recevez des leads qualifiés dans votre zone
            </p>
          </div>

          {/* Benefits */}
          <div className="flex justify-center gap-4 mb-6">
            {BENEFITS.map((benefit, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl shadow-sm"
              >
                <benefit.icon className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-slate-600 hidden sm:inline">
                  {benefit.text}
                </span>
              </div>
            ))}
          </div>

          <Card className="bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-xl shadow-slate-900/[0.1]">
            <CardContent className="p-6">
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
                >
                  {/* Section Identité */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                        <User className="h-3.5 w-3.5 text-blue-600" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">Identité</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 text-sm">Prénom</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Jean"
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
                            <FormLabel className="text-slate-600 text-sm">Nom</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Dupont"
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

                  {/* Section Contact */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                        <Mail className="h-3.5 w-3.5 text-green-600" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">Contact</span>
                    </div>
                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 text-sm">Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="jean.dupont@email.com"
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
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 text-sm flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              Téléphone
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="06 12 34 56 78"
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

                  {/* Section Sécurité */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                        <Lock className="h-3.5 w-3.5 text-purple-600" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">Sécurité</span>
                    </div>
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-600 text-sm">Mot de passe</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="8 caractères minimum"
                              {...field}
                              className="h-11 rounded-xl border-slate-200 focus:border-blue-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Section Localisation */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center">
                        <MapPin className="h-3.5 w-3.5 text-amber-600" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">Localisation</span>
                    </div>
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-600 text-sm">Ville</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Paris"
                              {...field}
                              className="h-11 rounded-xl border-slate-200 focus:border-blue-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Section Métier */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-cyan-100 flex items-center justify-center">
                        <Briefcase className="h-3.5 w-3.5 text-cyan-600" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">Activité</span>
                    </div>
                    <div className="space-y-3">
                      <FormField
                        control={form.control}
                        name="trade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-slate-600 text-sm">Métier</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                form.setValue("specializations", []);
                              }}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="h-11 rounded-xl border-slate-200">
                                  <SelectValue placeholder="Sélectionnez votre métier" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {TRADES.map((trade) => (
                                  <SelectItem key={trade.value} value={trade.value}>
                                    {trade.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Spécialisations */}
                      {availableSpecs && availableSpecs.length > 0 && (
                        <FormField
                          control={form.control}
                          name="specializations"
                          render={() => (
                            <FormItem>
                              <FormLabel className="text-slate-600 text-sm">
                                Spécialisations
                              </FormLabel>
                              <div className="grid grid-cols-1 gap-2 p-3 bg-slate-50 rounded-xl">
                                {availableSpecs.map((spec) => (
                                  <FormField
                                    key={spec.value}
                                    control={form.control}
                                    name="specializations"
                                    render={({ field }) => (
                                      <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(spec.value)}
                                            onCheckedChange={(checked) => {
                                              const current = field.value || [];
                                              if (checked) {
                                                field.onChange([...current, spec.value]);
                                              } else {
                                                field.onChange(
                                                  current.filter((v: string) => v !== spec.value)
                                                );
                                              }
                                            }}
                                            className="border-slate-300 data-[state=checked]:bg-blue-600"
                                          />
                                        </FormControl>
                                        <FormLabel className="font-normal text-sm text-slate-600 cursor-pointer">
                                          {spec.label}
                                        </FormLabel>
                                      </FormItem>
                                    )}
                                  />
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>

                  {/* Section Entreprise */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Building2 className="h-3.5 w-3.5 text-indigo-600" />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">Entreprise</span>
                    </div>
                    <FormField
                      control={form.control}
                      name="siret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-slate-600 text-sm">
                            Numéro SIRET
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="12345678901234"
                              maxLength={14}
                              {...field}
                              className="h-11 rounded-xl border-slate-200 focus:border-blue-500 font-mono"
                            />
                          </FormControl>
                          <p className="text-xs text-slate-400 mt-1">
                            14 chiffres - Sécurise la plateforme pour les clients
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* CGV */}
                  <FormField
                    control={form.control}
                    name="acceptCgv"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 bg-slate-50 rounded-xl">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="border-slate-300 data-[state=checked]:bg-blue-600 mt-0.5"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="font-normal text-sm text-slate-600">
                            J'accepte les{" "}
                            <Link
                              href="/cgv"
                              target="_blank"
                              className="text-blue-600 hover:text-blue-700 hover:underline"
                            >
                              Conditions Générales de Vente
                            </Link>
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Erreur */}
                  {error && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/25 rounded-xl font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Inscription en cours...
                      </>
                    ) : (
                      <>
                        Créer mon compte
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  {/* Lien connexion */}
                  <div className="pt-4 border-t border-slate-100 text-center">
                    <p className="text-sm text-slate-500">
                      Déjà inscrit ?{" "}
                      <Link
                        href="/artisan/login"
                        className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                      >
                        Se connecter
                      </Link>
                    </p>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Back to home */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
