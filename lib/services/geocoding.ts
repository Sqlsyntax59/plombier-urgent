import { createAdminClient } from "@/lib/supabase/server";

export interface GeocodingResult {
  success: boolean;
  latitude?: number;
  longitude?: number;
  cityName?: string;
  source: "cache" | "api_ban" | "none";
  error?: string;
}

interface BanFeature {
  geometry: { coordinates: [number, number] };
  properties: { label?: string; city?: string; name?: string };
}

interface BanResponse {
  features: BanFeature[];
}

const BAN_API_URL = "https://api-adresse.data.gouv.fr/search";
const BAN_TIMEOUT_MS = 5000;

/**
 * Géocode un code postal ou nom de ville via API BAN avec cache Supabase (TTL 30j).
 */
export async function geocodePostalCode(
  location: string
): Promise<GeocodingResult> {
  const normalized = location?.trim();
  if (!normalized || normalized.length < 2) {
    return { success: false, source: "none", error: "Localisation invalide" };
  }

  const supabase = createAdminClient();
  const cacheKey = normalized.toLowerCase();

  // 1. Vérifier le cache
  const { data: cached } = await supabase
    .from("geocode_cache")
    .select("latitude, longitude, city_name")
    .eq("postal_code", cacheKey)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (cached) {
    return {
      success: true,
      latitude: Number(cached.latitude),
      longitude: Number(cached.longitude),
      cityName: cached.city_name ?? undefined,
      source: "cache",
    };
  }

  // 2. Appeler API BAN
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), BAN_TIMEOUT_MS);

    const isPostalCode = /^\d{5}$/.test(normalized);
    const url = `${BAN_API_URL}?q=${encodeURIComponent(normalized)}&type=municipality&limit=1${isPostalCode ? "" : ""}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      return { success: false, source: "none", error: `API BAN HTTP ${response.status}` };
    }

    const data: BanResponse = await response.json();

    if (!data.features || data.features.length === 0) {
      return { success: false, source: "none", error: "Code postal non trouvé" };
    }

    const feature = data.features[0];
    const [lng, lat] = feature.geometry.coordinates;
    const cityName = feature.properties.city || feature.properties.name || null;

    // 3. Mettre en cache (upsert)
    await supabase.from("geocode_cache").upsert(
      {
        postal_code: cacheKey,
        latitude: lat,
        longitude: lng,
        city_name: cityName,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: "postal_code" }
    );

    return {
      success: true,
      latitude: lat,
      longitude: lng,
      cityName: cityName ?? undefined,
      source: "api_ban",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("Erreur géocodage API BAN:", message);
    return { success: false, source: "none", error: message };
  }
}

/**
 * Enregistre un événement dans lead_events (audit trail).
 */
export async function recordLeadEvent(
  leadId: string,
  eventType: string,
  payload: Record<string, unknown> = {}
): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("lead_events").insert({
    lead_id: leadId,
    event_type: eventType,
    payload,
  });
}
