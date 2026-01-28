import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/webhooks/n8n/trigger-lead
 *
 * Endpoint appelé après création d'un lead pour déclencher le workflow n8n.
 * n8n récupère les données du lead et lance le processus d'attribution.
 *
 * Body: { leadId: string }
 * Response: { success: boolean, lead?: LeadData, error?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: "leadId requis" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Récupérer le lead avec toutes les infos nécessaires pour n8n
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select(
        `
        id,
        problem_type,
        description,
        photo_url,
        client_phone,
        client_email,
        client_city,
        latitude,
        longitude,
        vertical_id,
        status,
        cascade_count,
        created_at
      `
      )
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
        { success: false, error: "Lead déjà traité" },
        { status: 400 }
      );
    }

    // Récupérer les infos de la verticale
    let verticalData = null;
    if (lead.vertical_id) {
      const { data: vertical } = await supabase
        .from("verticals")
        .select("slug, name")
        .eq("id", lead.vertical_id)
        .single();
      verticalData = vertical;
    }

    // Retourner les données pour n8n
    return NextResponse.json({
      success: true,
      lead: {
        ...lead,
        vertical: verticalData,
      },
    });
  } catch (error) {
    console.error("Erreur trigger-lead webhook:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
