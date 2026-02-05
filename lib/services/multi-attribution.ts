import { createAdminClient } from "@/lib/supabase/server";
import { generateAcceptUrl } from "@/lib/actions/assignment";

export interface MultiAttributionCriteria {
  leadId: string;
  verticalId: string | null;
  waveNumber: number;
  artisanCount?: number;
}

export interface ArtisanAttribution {
  id: string;
  name: string;
  phone: string;
  whatsappPhone: string | null;
  distanceKm: number;
  reactiveScore: number;
  assignmentId: string;
  acceptUrl: string;
}

export interface MultiAttributionResult {
  success: boolean;
  artisans: ArtisanAttribution[];
  wave: number;
  error?: string;
  noArtisanAvailable?: boolean;
}

const WAVE_EXPIRES_MINUTES = 5;

/**
 * Trouve N artisans et crée les assignments simultanément.
 * Chaque artisan reçoit un assignment avec expires_at = NOW() + 5 min.
 */
export async function findMultipleArtisans(
  criteria: MultiAttributionCriteria
): Promise<MultiAttributionResult> {
  const { leadId, verticalId, waveNumber, artisanCount = 3 } = criteria;
  const supabase = createAdminClient();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://plombier-urgent.vercel.app";

  // 1. Trouver les artisans via RPC
  const { data: artisans, error: rpcError } = await supabase.rpc(
    "find_available_artisans",
    {
      p_lead_id: leadId,
      p_vertical_id: verticalId || null,
      p_limit: artisanCount,
    }
  );

  if (rpcError) {
    console.error("Erreur RPC find_available_artisans:", rpcError);
    return { success: false, artisans: [], wave: waveNumber, error: rpcError.message };
  }

  if (!artisans || artisans.length === 0) {
    return {
      success: false,
      artisans: [],
      wave: waveNumber,
      noArtisanAvailable: true,
      error: "Aucun artisan disponible",
    };
  }

  // 2. Créer les assignments pour chaque artisan
  const expiresAt = new Date(Date.now() + WAVE_EXPIRES_MINUTES * 60 * 1000).toISOString();
  const results: ArtisanAttribution[] = [];

  for (let i = 0; i < artisans.length; i++) {
    const artisan = artisans[i];
    const cascadeOrder = (waveNumber - 1) * artisanCount + (i + 1);

    const { data: assignment, error: assignError } = await supabase
      .from("lead_assignments")
      .insert({
        lead_id: leadId,
        artisan_id: artisan.artisan_id,
        cascade_order: cascadeOrder,
        wave_number: waveNumber,
        status: "pending",
        notified_at: new Date().toISOString(),
        expires_at: expiresAt,
      })
      .select("id")
      .single();

    if (assignError) {
      console.error("Erreur création assignment:", assignError);
      continue;
    }

    const acceptUrl = await generateAcceptUrl(
      assignment.id,
      artisan.artisan_id,
      baseUrl
    );

    results.push({
      id: artisan.artisan_id,
      name: artisan.artisan_name || "Artisan",
      phone: artisan.phone || "",
      whatsappPhone: artisan.whatsapp_phone,
      distanceKm: Number(artisan.distance_km),
      reactiveScore: artisan.reactive_score || 0,
      assignmentId: assignment.id,
      acceptUrl,
    });
  }

  // 3. Mettre à jour le lead
  if (results.length > 0) {
    await supabase
      .from("leads")
      .update({
        status: "assigned",
        cascade_count: waveNumber,
      })
      .eq("id", leadId);
  }

  return {
    success: results.length > 0,
    artisans: results,
    wave: waveNumber,
    noArtisanAvailable: results.length === 0,
  };
}
