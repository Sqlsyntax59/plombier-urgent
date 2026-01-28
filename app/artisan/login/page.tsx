"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2, Mail, KeyRound } from "lucide-react";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  // Formulaire mot de passe
  const passwordForm = useForm<LoginPasswordInput>({
    resolver: zodResolver(loginPasswordSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Formulaire magic link
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
    // Si success, redirect est geree par le Server Action
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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link href="/" className="font-bold text-xl text-primary">
            Plombier Urgent
          </Link>
        </div>
      </header>

      {/* Formulaire */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Connexion Artisan</CardTitle>
            <p className="text-muted-foreground">
              Accedez a votre espace professionnel
            </p>
          </CardHeader>
          <CardContent>
            {magicLinkSent ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <Mail className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg">Email envoye !</h3>
                <p className="text-muted-foreground">
                  Un lien de connexion a ete envoye a votre adresse email.
                  Cliquez sur le lien pour vous connecter.
                </p>
                <p className="text-sm text-muted-foreground">
                  Le lien expire dans 15 minutes.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setMagicLinkSent(false)}
                >
                  Renvoyer un email
                </Button>
              </div>
            ) : (
              <Tabs defaultValue="password" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="password" className="gap-2">
                    <KeyRound className="h-4 w-4" />
                    Mot de passe
                  </TabsTrigger>
                  <TabsTrigger value="magiclink" className="gap-2">
                    <Mail className="h-4 w-4" />
                    Magic Link
                  </TabsTrigger>
                </TabsList>

                {/* Connexion mot de passe */}
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
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="votre@email.com"
                                {...field}
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
                            <FormLabel>Mot de passe</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="Votre mot de passe"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                          {error}
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connexion...
                          </>
                        ) : (
                          "Se connecter"
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                {/* Connexion magic link */}
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
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="votre@email.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <p className="text-sm text-muted-foreground">
                        Un lien de connexion sera envoye a votre email. Aucun
                        mot de passe requis.
                      </p>

                      {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                          {error}
                        </div>
                      )}

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Envoi en cours...
                          </>
                        ) : (
                          "Recevoir le lien"
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            )}

            {/* Liens */}
            {!magicLinkSent && (
              <div className="mt-6 text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Pas encore inscrit ?{" "}
                  <Link
                    href="/artisan/inscription"
                    className="text-primary hover:underline"
                  >
                    Creer un compte
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
