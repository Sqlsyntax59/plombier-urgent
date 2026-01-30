-- Fix: Corriger le type de retour de distance_km
-- Le calcul mathématique retourne double precision, pas DECIMAL

-- D'abord supprimer la fonction existante
DROP FUNCTION IF EXISTS find_available_artisan(UUID, UUID);

CREATE OR REPLACE FUNCTION find_available_artisan(
  p_lead_id UUID,
  p_vertical_id UUID DEFAULT NULL
)
RETURNS TABLE (
  artisan_id UUID,
  artisan_name TEXT,
  telegram_chat_id TEXT,
  distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lead_lat DECIMAL;
  v_lead_lng DECIMAL;
  v_vertical_id UUID;
BEGIN
  SELECT latitude, longitude, vertical_id
  INTO v_lead_lat, v_lead_lng, v_vertical_id
  FROM leads
  WHERE id = p_lead_id;

  IF p_vertical_id IS NOT NULL THEN
    v_vertical_id := p_vertical_id;
  END IF;

  RETURN QUERY
  SELECT
    p.id AS artisan_id,
    p.company_name AS artisan_name,
    p.telegram_chat_id,
    CASE
      WHEN v_lead_lat IS NOT NULL AND v_lead_lng IS NOT NULL
           AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
      THEN (
        6371 * acos(
          cos(radians(v_lead_lat)) * cos(radians(p.latitude)) *
          cos(radians(p.longitude) - radians(v_lead_lng)) +
          sin(radians(v_lead_lat)) * sin(radians(p.latitude))
        )
      )
      ELSE 9999.0
    END AS distance_km
  FROM profiles p
  WHERE
    p.role = 'artisan'
    AND p.is_active = true
    AND p.is_suspended = false
    AND p.credits > 0
    AND p.telegram_chat_id IS NOT NULL
    AND (v_vertical_id IS NULL OR p.vertical_id = v_vertical_id)
    AND NOT EXISTS (
      SELECT 1 FROM lead_assignments la
      WHERE la.lead_id = p_lead_id AND la.artisan_id = p.id
    )
  ORDER BY
    distance_km ASC,
    p.credits DESC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION find_available_artisan TO service_role;
