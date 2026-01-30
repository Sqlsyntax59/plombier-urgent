"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2, Mail, KeyRound, Droplets, CheckCircle2, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  loginPasswordSchema,
  magicLinkSchema,
  type LoginPasswordInput,
  type MagicLinkInput,
} from "@/lib/validations/artisan";
import { loginWithPassword, sendMagicLink } from "@/lib/actions/auth";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const passwordForm = useForm<LoginPasswordInput>({
    resolver: zodResolver(loginPasswordSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const magicLinkForm = useForm<MagicLinkInput>({
    resolver: zodResolver(magicLinkSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onPasswordSubmit(data: LoginPasswordInput) {
    setIsLoading(true);
    setError(null);

    const result = await loginWithPassword(data);

    if (!result.success) {
      setError(result.error || "Une erreur est survenue");
      setIsLoading(false);
    }
  }

  async function onMagicLinkSubmit(data: MagicLinkInput) {
    setIsLoading(true);
    setError(null);

    const result = await sendMagicLink(data);

    if (!result.success) {
      setError(result.error || "Une erreur est survenue");
    } else {
      setMagicLinkSent(true);
    }
    setIsLoading(false);
  }

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
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
              Connexion Artisan
            </h1>
            <p className="text-slate-500">
              Accédez à votre espace professionnel
            </p>
          </div>

          <Card className="bg-white/95 backdrop-blur-sm border border-slate-200/80 shadow-xl shadow-slate-900/[0.1]">
            <CardContent className="p-6">
              {magicLinkSent ? (
                <div className="text-center py-6">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                    <CheckCircle2 className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">Email envoyé !</h2>
                  <p className="text-slate-500 mb-6">
                    Un lien de connexion a été envoyé à votre adresse email.
                    <br />
                    <span className="text-slate-400 text-sm">Le lien expire dans 15 minutes.</span>
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setMagicLinkSent(false)}
                    className="rounded-xl"
                  >
                    Renvoyer un email
                  </Button>
                </div>
              ) : (
                <>
                  <Tabs defaultValue="password" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-slate-100 p-1">
                      <TabsTrigger
                        value="password"
                        className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        <KeyRound className="h-4 w-4" />
                        Mot de passe
                      </TabsTrigger>
                      <TabsTrigger
                        value="magiclink"
                        className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm"
                      >
                        <Mail className="h-4 w-4" />
                        Magic Link
                      </TabsTrigger>
                    </TabsList>

                    {/* Password login */}
                    <TabsContent value="password">
                      <Form {...passwordForm}>
                        <form
                          onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                          className="space-y-4"
                        >
                          <FormField
                            control={passwordForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-700">Email</FormLabel>
                                <FormControl>
                                  <Input
                                    type="email"
                                    placeholder="votre@email.com"
                                    {...field}
                                    className="h-12 rounded-xl border-slate-200 focus:border-blue-500"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={passwordForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-700">Mot de passe</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    placeholder="Votre mot de passe"
                                    {...field}
                                    className="h-12 rounded-xl border-slate-200 focus:border-blue-500"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {error && (
                            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                              {error}
                            </div>
                          )}

                          <Button
                            type="submit"
                            className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/25 rounded-xl"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Connexion...
                              </>
                            ) : (
                              <>
                                Se connecter
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </>
                            )}
                          </Button>
                        </form>
                      </Form>
                    </TabsContent>

                    {/* Magic link login */}
                    <TabsContent value="magiclink">
                      <Form {...magicLinkForm}>
                        <form
                          onSubmit={magicLinkForm.handleSubmit(onMagicLinkSubmit)}
                          className="space-y-4"
                        >
                          <FormField
                            control={magicLinkForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-slate-700">Email</FormLabel>
                                <FormControl>
                                  <Input
                                    type="email"
                                    placeholder="votre@email.com"
                                    {...field}
                                    className="h-12 rounded-xl border-slate-200 focus:border-blue-500"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <p className="text-sm text-slate-500 p-3 rounded-xl bg-slate-50">
                            Un lien de connexion sera envoyé à votre email. Aucun mot de passe requis.
                          </p>

                          {error && (
                            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                              {error}
                            </div>
                          )}

                          <Button
                            type="submit"
                            className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/25 rounded-xl"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Envoi en cours...
                              </>
                            ) : (
                              <>
                                <Mail className="mr-2 h-4 w-4" />
                                Recevoir le lien
                              </>
                            )}
                          </Button>
                        </form>
                      </Form>
                    </TabsContent>
                  </Tabs>

                  {/* Link to signup */}
                  <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                    <p className="text-sm text-slate-500">
                      Pas encore inscrit ?{" "}
                      <Link
                        href="/artisan/inscription"
                        className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                      >
                        Créer un compte
                      </Link>
                    </p>
                  </div>
                </>
              )}
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
