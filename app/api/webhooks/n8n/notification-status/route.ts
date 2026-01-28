import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/webhooks/n8n/notification-status
 *
 * Callback n8n pour mettre à jour le statut de notification d'un assignment.
 *
 * Body: {
 *   assignmentId: string,
 *   channel: 'whatsapp' | 'sms' | 'email',
 *   success: boolean,
 *   externalId?: string,
 *   error?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignmentId, channel, success, externalId, error } = body;

    if (!assignmentId || !channel) {
      return NextResponse.json(
        { success: false, error: "assignmentId et channel requis" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Mettre à jour l'assignment avec le statut de notification
    const updateData: Record<string, unknown> = {
      notification_channel: channel,
    };

    if (success) {
      updateData.notification_external_id = externalId || null;
      // Définir l'expiration à 2 minutes
      updateData.expires_at = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    } else {
      updateData.notification_error = error || "Échec envoi notification";
    }

    const { error: updateError } = await supabase
      .from("lead_assignments")
      .update(updateData)
      .eq("id", assignmentId);

    if (updateError) {
      console.error("Erreur update assignment:", updateError);
      return NextResponse.json(
        { success: false, error: "Erreur mise à jour" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur notification-status webhook:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
