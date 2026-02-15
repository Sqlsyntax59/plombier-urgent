import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { findBestArtisan, getNextArtisanInCascade } from "@/lib/services/attribution";

/**
 * POST /api/leads/assign
 *
 * Endpoint appelé par n8n pour attribuer un lead à un artisan.
 *
 * Body: {
 *   leadId: string,
 *   mode: 'first' | 'next'  // first = première attribution, next = cascade
 * }
 *
 * Response: {
 *   success: boolean,
 *   artisan?: { id, firstName, phone, whatsappPhone, city },
 *   assignmentId?: string,
 *   error?: string,
 *   noArtisanAvailable?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, mode = "first" } = body;

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: "leadId requis" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Récupérer les infos du lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, vertical_id, status, cascade_count")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { success: false, error: "Lead non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que le lead est en pending
    if (lead.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Lead déjà traité", status: lead.status },
        { status: 400 }
      );
    }

    let result;

    if (mode === "next") {
      // Cascade: trouver le prochain artisan
      result = await getNextArtisanInCascade(leadId);
    } else {
      // Première attribution
      result = await findBestArtisan({
        leadId,
        verticalId: lead.vertical_id,
        cascadePosition: 1,
      });
    }

    if (!result.success) {
      // Si aucun artisan disponible, marquer le lead comme unassigned
      if (result.noArtisanAvailable) {
        await supabase.from("leads").update({ status: "unassigned" }).eq("id", leadId);
      }

      return NextResponse.json({
        success: false,
        error: result.error,
        noArtisanAvailable: result.noArtisanAvailable,
      });
    }

    // Anti court-circuit: ne pas exposer les données artisan (PRD ligne 423)
    // n8n utilise /api/notifications/send-whatsapp avec assignmentId pour notifier
    return NextResponse.json({
      success: true,
      artisan_id: result.artisan?.id,
      assignmentId: result.assignmentId,
    });
  } catch (error) {
    console.error("Erreur assign lead:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
