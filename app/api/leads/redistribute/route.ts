import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getNextArtisanInCascade, expirePendingAssignments } from "@/lib/services/attribution";

/**
 * POST /api/leads/redistribute
 *
 * Endpoint appelé par n8n après expiration du timer 2 minutes.
 * Expire l'assignment actuel et attribue le lead au prochain artisan.
 *
 * Body: {
 *   leadId: string,
 *   currentAssignmentId?: string  // Si fourni, expire cet assignment spécifiquement
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, currentAssignmentId } = body;

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: "leadId requis" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Vérifier l'état actuel du lead
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, status, cascade_count")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { success: false, error: "Lead non trouvé" },
        { status: 404 }
      );
    }

    // Si le lead n'est plus en pending, ne rien faire
    if (lead.status !== "pending") {
      return NextResponse.json({
        success: false,
        error: "Lead déjà traité",
        leadStatus: lead.status,
        noAction: true,
      });
    }

    // Expirer l'assignment spécifique ou tous les pending
    if (currentAssignmentId) {
      // Vérifier que cet assignment est bien en pending
      const { data: assignment } = await supabase
        .from("lead_assignments")
        .select("status")
        .eq("id", currentAssignmentId)
        .single();

      if (assignment?.status === "pending") {
        await supabase
          .from("lead_assignments")
          .update({ status: "expired" })
          .eq("id", currentAssignmentId);
      }
    } else {
      // Expirer tous les assignments pending pour ce lead
      await supabase
        .from("lead_assignments")
        .update({ status: "expired" })
        .eq("lead_id", leadId)
        .eq("status", "pending");
    }

    // Vérifier le nombre de cascade
    const cascadeCount = lead.cascade_count || 0;

    // Maximum 3 artisans en cascade normale, 4 si > 4 minutes totales
    // (Dans n8n, vérifier le temps écoulé pour décider si on va au 4ème)
    if (cascadeCount >= 3) {
      // Cascade terminée, marquer le lead comme unassigned
      await supabase.from("leads").update({ status: "unassigned" }).eq("id", leadId);

      return NextResponse.json({
        success: false,
        error: "Cascade terminée, aucun artisan disponible",
        cascadeComplete: true,
        leadStatus: "unassigned",
      });
    }

    // Trouver le prochain artisan
    const result = await getNextArtisanInCascade(leadId);

    if (!result.success) {
      // Marquer le lead comme unassigned si aucun artisan trouvé
      if (result.noArtisanAvailable) {
        await supabase.from("leads").update({ status: "unassigned" }).eq("id", leadId);
      }

      return NextResponse.json({
        success: false,
        error: result.error,
        noArtisanAvailable: result.noArtisanAvailable,
      });
    }

    return NextResponse.json({
      success: true,
      artisan: result.artisan,
      assignmentId: result.assignmentId,
      cascadePosition: (cascadeCount || 0) + 1,
    });
  } catch (error) {
    console.error("Erreur redistribute lead:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/leads/redistribute
 *
 * Endpoint pour vérifier et expirer les assignments en attente.
 * Peut être appelé par un cron job ou n8n.
 */
export async function GET() {
  try {
    const result = await expirePendingAssignments();

    return NextResponse.json({
      success: true,
      expiredCount: result.expired,
    });
  } catch (error) {
    console.error("Erreur expiration assignments:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
