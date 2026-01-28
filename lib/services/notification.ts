import { createClient } from "@/lib/supabase/server";
import type { ProblemType } from "@/types/database.types";

// Labels français pour les types de panne
const PROBLEM_TYPE_LABELS: Record<ProblemType, string> = {
  fuite: "Fuite d'eau",
  wc_bouche: "WC bouché",
  ballon_eau_chaude: "Ballon d'eau chaude",
  canalisation: "Canalisation",
  robinetterie: "Robinetterie",
  autre: "Autre problème",
};

interface WhatsAppMessageData {
  success: boolean;
  message?: {
    to: string; // Numéro WhatsApp artisan
    templateName: string;
    templateLanguage: string;
    components: {
      type: "body";
      parameters: Array<{ type: "text"; text: string }>;
    }[];
    // Données brutes pour personnalisation
    raw: {
      artisanFirstName: string;
      problemTypeLabel: string;
      city: string;
      description: string;
      photoUrl: string | null;
      acceptUrl: string;
    };
  };
  error?: string;
}

interface SMSMessageData {
  success: boolean;
  message?: {
    to: string;
    body: string;
    acceptUrl: string;
  };
  error?: string;
}

interface EmailMessageData {
  success: boolean;
  message?: {
    to: string;
    subject: string;
    html: string;
    acceptUrl: string;
  };
  error?: string;
}

/**
 * Prépare les données pour la notification WhatsApp.
 * n8n utilise ces données pour envoyer via WhatsApp Cloud API.
 */
export async function prepareWhatsAppNotification(
  assignmentId: string,
  baseUrl: string
): Promise<WhatsAppMessageData> {
  const supabase = await createClient();

  // Récupérer l'assignment avec le lead et l'artisan
  const { data: assignment, error: assignmentError } = await supabase
    .from("lead_assignments")
    .select(
      `
      id,
      lead_id,
      artisan_id,
      leads (
        problem_type,
        description,
        photo_url,
        client_city
      ),
      profiles (
        first_name,
        whatsapp_phone,
        phone
      )
    `
    )
    .eq("id", assignmentId)
    .single();

  if (assignmentError || !assignment) {
    return { success: false, error: "Assignment non trouvé" };
  }

  // Type assertion via unknown car Supabase génère des types génériques
  const lead = assignment.leads as unknown as {
    problem_type: ProblemType;
    description: string;
    photo_url: string | null;
    client_city: string | null;
  };

  const artisan = assignment.profiles as unknown as {
    first_name: string | null;
    whatsapp_phone: string | null;
    phone: string | null;
  };

  const whatsappNumber = artisan.whatsapp_phone || artisan.phone;
  if (!whatsappNumber) {
    return { success: false, error: "Artisan sans numéro WhatsApp" };
  }

  const problemTypeLabel = PROBLEM_TYPE_LABELS[lead.problem_type] || lead.problem_type;
  const city = lead.client_city || "Non précisé";
  const description =
    lead.description.length > 100
      ? lead.description.substring(0, 97) + "..."
      : lead.description;

  // URL d'acceptation avec token
  const acceptUrl = `${baseUrl}/api/leads/accept?assignmentId=${assignmentId}`;

  return {
    success: true,
    message: {
      to: whatsappNumber,
      templateName: "lead_notification",
      templateLanguage: "fr",
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: artisan.first_name || "Artisan" },
            { type: "text", text: problemTypeLabel },
            { type: "text", text: city },
            { type: "text", text: description },
          ],
        },
      ],
      raw: {
        artisanFirstName: artisan.first_name || "Artisan",
        problemTypeLabel,
        city,
        description: lead.description,
        photoUrl: lead.photo_url,
        acceptUrl,
      },
    },
  };
}

/**
 * Prépare les données pour la notification SMS (fallback).
 */
export async function prepareSMSNotification(
  assignmentId: string,
  baseUrl: string
): Promise<SMSMessageData> {
  const supabase = await createClient();

  const { data: assignment, error } = await supabase
    .from("lead_assignments")
    .select(
      `
      id,
      leads (
        problem_type,
        client_city
      ),
      profiles (
        first_name,
        phone
      )
    `
    )
    .eq("id", assignmentId)
    .single();

  if (error || !assignment) {
    return { success: false, error: "Assignment non trouvé" };
  }

  const lead = assignment.leads as unknown as {
    problem_type: ProblemType;
    client_city: string | null;
  };

  const artisan = assignment.profiles as unknown as {
    first_name: string | null;
    phone: string | null;
  };

  if (!artisan.phone) {
    return { success: false, error: "Artisan sans numéro de téléphone" };
  }

  const problemTypeLabel = PROBLEM_TYPE_LABELS[lead.problem_type] || lead.problem_type;
  const city = lead.client_city || "";
  const acceptUrl = `${baseUrl}/api/leads/accept?assignmentId=${assignmentId}`;

  // SMS court et concis
  const body = `Nouveau lead ${problemTypeLabel}${city ? ` à ${city}` : ""}. Acceptez vite: ${acceptUrl}`;

  return {
    success: true,
    message: {
      to: artisan.phone,
      body,
      acceptUrl,
    },
  };
}

/**
 * Prépare les données pour la notification Email (fallback ultime).
 */
export async function prepareEmailNotification(
  assignmentId: string,
  baseUrl: string
): Promise<EmailMessageData> {
  const supabase = await createClient();

  const { data: assignment, error } = await supabase
    .from("lead_assignments")
    .select(
      `
      id,
      artisan_id,
      leads (
        problem_type,
        description,
        photo_url,
        client_city
      ),
      profiles (
        first_name
      )
    `
    )
    .eq("id", assignmentId)
    .single();

  if (error || !assignment) {
    return { success: false, error: "Assignment non trouvé" };
  }

  // Récupérer l'email depuis auth.users
  const { data: userData } = await supabase.auth.admin.getUserById(
    assignment.artisan_id
  );

  const email = userData?.user?.email;
  if (!email) {
    return { success: false, error: "Artisan sans email" };
  }

  const lead = assignment.leads as unknown as {
    problem_type: ProblemType;
    description: string;
    photo_url: string | null;
    client_city: string | null;
  };

  const artisan = assignment.profiles as unknown as {
    first_name: string | null;
  };

  const problemTypeLabel = PROBLEM_TYPE_LABELS[lead.problem_type] || lead.problem_type;
  const acceptUrl = `${baseUrl}/api/leads/accept?assignmentId=${assignmentId}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Nouveau Lead Urgent</h2>
      <p>Bonjour ${artisan.first_name || ""},</p>
      <p>Un nouveau client a besoin de votre aide :</p>

      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p><strong>Type de panne :</strong> ${problemTypeLabel}</p>
        ${lead.client_city ? `<p><strong>Localisation :</strong> ${lead.client_city}</p>` : ""}
        <p><strong>Description :</strong></p>
        <p style="color: #4b5563;">${lead.description}</p>
        ${lead.photo_url ? `<p><a href="${lead.photo_url}">Voir la photo</a></p>` : ""}
      </div>

      <p style="text-align: center; margin: 24px 0;">
        <a href="${acceptUrl}"
           style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Accepter ce lead
        </a>
      </p>

      <p style="color: #6b7280; font-size: 12px;">
        Vous avez 2 minutes pour accepter avant que le lead soit proposé à un autre artisan.
      </p>
    </div>
  `;

  return {
    success: true,
    message: {
      to: email,
      subject: `Nouveau Lead Urgent - ${problemTypeLabel}`,
      html,
      acceptUrl,
    },
  };
}
