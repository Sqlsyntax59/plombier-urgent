"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Loader2, MessageCircle, CheckCircle2 } from "lucide-react";

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
  whatsappConfigSchema,
  type WhatsAppConfigInput,
} from "@/lib/validations/artisan";
import { updateWhatsAppConfig, getCurrentProfile } from "@/lib/actions/profile";

export default function WhatsAppConfigPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testSent, setTestSent] = useState(false);

  const form = useForm<WhatsAppConfigInput>({
    resolver: zodResolver(whatsappConfigSchema),
    defaultValues: {
      whatsappPhone: "",
    },
  });

  // Charger le numero existant si present
  useEffect(() => {
    async function loadProfile() {
      const profile = await getCurrentProfile();
      if (profile?.whatsapp_phone) {
        form.setValue("whatsappPhone", profile.whatsapp_phone);
      }
    }
    loadProfile();
  }, [form]);

  async function onSubmit(data: WhatsAppConfigInput) {
    setIsLoading(true);
    setError(null);

    const result = await updateWhatsAppConfig(data);

    if (!result.success) {
      setError(result.error || "Une erreur est survenue");
      setIsLoading(false);
    }
    // Si success, redirect est geree par le Server Action
  }

  function handleTestMessage() {
    // Placeholder - sera implemente avec n8n dans Epic 4
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configuration WhatsApp</h2>
        <p className="text-muted-foreground">
          Configurez votre numero WhatsApp pour recevoir les notifications de
          leads instantanement
        </p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-green-600" />
            Numero WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="whatsappPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numero de telephone</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="06 12 34 56 78"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Format mobile francais (06 ou 07). Ce numero recevra les
                      notifications de nouveaux leads.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Erreur globale */}
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              {/* Boutons */}
              <div className="flex flex-col gap-3">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer et continuer"
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestMessage}
                  disabled={!form.watch("whatsappPhone") || testSent}
                >
                  {testSent ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                      Message test envoye !
                    </>
                  ) : (
                    "Envoyer un message test"
                  )}
                </Button>

                <Button variant="ghost" asChild>
                  <Link href="/artisan/dashboard">Passer cette etape</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Info complementaire */}
      <Card className="max-w-lg">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">Comment ca marche ?</h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>
              • Quand un client soumet une demande dans votre zone, vous recevez
              une notification WhatsApp
            </li>
            <li>
              • Vous avez 2 minutes pour accepter le lead avant qu'il soit
              propose a un autre artisan
            </li>
            <li>
              • Si WhatsApp echoue, vous recevrez un SMS puis un email en
              fallback
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
