-- Epic 10 / Story 10.4 : RPC find_available_artisans (pluriel, multi-artisans)
-- Remplace find_available_artisan (singulier) pour le mode multi-attribution

CREATE OR REPLACE FUNCTION find_available_artisans(
  p_lead_id UUID,
  p_vertical_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
  artisan_id UUID,
  artisan_name TEXT,
  whatsapp_phone TEXT,
  phone TEXT,
  distance_km DECIMAL,
  reactive_score INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lead_lat DECIMAL;
  v_lead_lng DECIMAL;
  v_vertical_id UUID;
BEGIN
  -- Récupérer coordonnées et vertical du lead
  SELECT l.latitude, l.longitude, l.vertical_id
  INTO v_lead_lat, v_lead_lng, v_vertical_id
  FROM leads l
  WHERE l.id = p_lead_id;

  IF p_vertical_id IS NOT NULL THEN
    v_vertical_id := p_vertical_id;
  END IF;

  RETURN QUERY
  SELECT
    p.id AS artisan_id,
    COALESCE(p.company_name, p.first_name, 'Artisan') AS artisan_name,
    p.whatsapp_phone,
    p.phone,
    CASE
      WHEN v_lead_lat IS NOT NULL AND v_lead_lng IS NOT NULL
           AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
      THEN (
        6371 * acos(
          LEAST(1.0, GREATEST(-1.0,
            cos(radians(v_lead_lat)) * cos(radians(p.latitude)) *
            cos(radians(p.longitude) - radians(v_lead_lng)) +
            sin(radians(v_lead_lat)) * sin(radians(p.latitude))
          ))
        )
      )
      ELSE 9999
    END AS distance_km,
    COALESCE(p.reactive_score, 0) AS reactive_score
  FROM profiles p
  WHERE
    p.role = 'artisan'
    AND p.is_active = true
    AND p.is_suspended = false
    AND p.credits > 0
    AND (p.whatsapp_phone IS NOT NULL OR p.phone IS NOT NULL)
    AND (v_vertical_id IS NULL OR p.vertical_id = v_vertical_id)
    AND NOT EXISTS (
      SELECT 1 FROM lead_assignments la
      WHERE la.lead_id = p_lead_id AND la.artisan_id = p.id
    )
  ORDER BY
    distance_km ASC,
    reactive_score DESC,
    p.credits DESC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION find_available_artisans TO service_role;

COMMENT ON FUNCTION find_available_artisans IS 'Trouve les N meilleurs artisans pour un lead (distance, réactivité, crédits)';
