import { NextRequest, NextResponse } from "next/server";
import { prepareWhatsAppNotification } from "@/lib/services/notification";

const WHATSAPP_PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_API_VERSION = "v22.0";

/**
 * POST /api/notifications/send-whatsapp
 *
 * Prépare ET envoie la notification WhatsApp en une seule requête.
 * Utilisé par le workflow n8n cascade.
 *
 * Body: {
 *   assignmentId: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignmentId } = body;

    if (!assignmentId) {
      return NextResponse.json(
        { success: false, error: "assignmentId requis" },
        { status: 400 }
      );
    }

    // Vérifier la config WhatsApp
    if (!WHATSAPP_PHONE_ID || !WHATSAPP_ACCESS_TOKEN) {
      console.error("WhatsApp not configured: missing PHONE_ID or ACCESS_TOKEN");
      return NextResponse.json(
        { success: false, error: "WhatsApp non configuré" },
        { status: 500 }
      );
    }

    // URL de base
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://plombier-urgent.vercel.app";

    // 1. Préparer les données
    const prepareResult = await prepareWhatsAppNotification(assignmentId, baseUrl);

    if (!prepareResult.success || !prepareResult.message) {
      return NextResponse.json(
        { success: false, error: prepareResult.error || "Erreur préparation" },
        { status: 400 }
      );
    }

    const msg = prepareResult.message;

    // 2. Formater le numéro (doit inclure indicatif pays sans +)
    let phoneNumber = msg.to.replace(/[^0-9]/g, "");
    // Si commence par 0, remplacer par 33 (France)
    if (phoneNumber.startsWith("0")) {
      phoneNumber = "33" + phoneNumber.substring(1);
    }

    // 3. Construire le payload WhatsApp Cloud API
    const whatsappPayload = {
      messaging_product: "whatsapp",
      to: phoneNumber,
      type: "template",
      template: {
        name: msg.templateName,
        language: {
          code: msg.templateLanguage,
        },
        components: [
          {
            type: "body",
            parameters: msg.components[0].parameters,
          },
          {
            type: "button",
            sub_type: "url",
            index: 0,
            parameters: [
              {
                type: "text",
                text: assignmentId,
              },
            ],
          },
        ],
      },
    };

    console.log("WhatsApp payload:", JSON.stringify(whatsappPayload, null, 2));

    // 4. Envoyer via WhatsApp Cloud API
    const whatsappResponse = await fetch(
      `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE_ID}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(whatsappPayload),
      }
    );

    const whatsappResult = await whatsappResponse.json();

    if (!whatsappResponse.ok) {
      console.error("WhatsApp API error:", whatsappResult);
      return NextResponse.json(
        {
          success: false,
          error: "Erreur envoi WhatsApp",
          details: whatsappResult.error?.message || whatsappResult,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: whatsappResult.messages?.[0]?.id,
      artisan: {
        name: msg.artisanFirstName,
        phone: msg.to,
      },
    });
  } catch (error) {
    console.error("Erreur send-whatsapp:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
