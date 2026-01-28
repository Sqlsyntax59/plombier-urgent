import { NextRequest, NextResponse } from "next/server";
import {
  prepareWhatsAppNotification,
  prepareSMSNotification,
  prepareEmailNotification,
} from "@/lib/services/notification";

/**
 * POST /api/notifications/prepare
 *
 * Prépare les données de notification pour n8n.
 *
 * Body: {
 *   assignmentId: string,
 *   channel: 'whatsapp' | 'sms' | 'email'
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignmentId, channel } = body;

    if (!assignmentId || !channel) {
      return NextResponse.json(
        { success: false, error: "assignmentId et channel requis" },
        { status: 400 }
      );
    }

    // URL de base pour les liens d'acceptation
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || request.headers.get("origin") || "";

    let result;

    switch (channel) {
      case "whatsapp":
        result = await prepareWhatsAppNotification(assignmentId, baseUrl);
        break;
      case "sms":
        result = await prepareSMSNotification(assignmentId, baseUrl);
        break;
      case "email":
        result = await prepareEmailNotification(assignmentId, baseUrl);
        break;
      default:
        return NextResponse.json(
          { success: false, error: "Channel invalide" },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur préparation notification:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
