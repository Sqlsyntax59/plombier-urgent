-- Epic 10 / Story 10.3 : RPC recalcul nightly des scores réactivité

CREATE OR REPLACE FUNCTION recalculate_reactive_scores()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_updated INTEGER := 0;
  v_artisan RECORD;
  v_total_offers INTEGER;
  v_responded INTEGER;
  v_fast_responses INTEGER;
  v_response_rate DECIMAL;
  v_fast_rate DECIMAL;
  v_score INTEGER;
  v_is_reactive BOOLEAN;
BEGIN
  -- Parcourir les artisans avec >= 20 offres sur 30 jours
  FOR v_artisan IN
    SELECT artisan_id
    FROM lead_assignments
    WHERE notified_at >= NOW() - INTERVAL '30 days'
    GROUP BY artisan_id
    HAVING COUNT(*) >= 20
  LOOP
    -- Calculer les métriques
    SELECT
      COUNT(*),
      COUNT(*) FILTER (WHERE status IN ('accepted', 'rejected')),
      COUNT(*) FILTER (WHERE status = 'accepted' AND response_ms IS NOT NULL AND response_ms < 120000)
    INTO v_total_offers, v_responded, v_fast_responses
    FROM lead_assignments
    WHERE artisan_id = v_artisan.artisan_id
      AND notified_at >= NOW() - INTERVAL '30 days';

    IF v_total_offers > 0 AND v_responded > 0 THEN
      v_response_rate := v_responded::DECIMAL / v_total_offers;
      v_fast_rate := v_fast_responses::DECIMAL / v_responded;
      v_score := ROUND(100 * v_response_rate * v_fast_rate);
      v_is_reactive := (v_response_rate >= 0.8 AND v_fast_rate >= 0.8);
    ELSE
      v_score := 0;
      v_is_reactive := false;
    END IF;

    UPDATE profiles
    SET
      reactive_score = v_score,
      is_reactive = v_is_reactive,
      updated_at = NOW()
    WHERE id = v_artisan.artisan_id;

    v_updated := v_updated + 1;
  END LOOP;

  -- Reset artisans avec < 20 offres sur 30j
  UPDATE profiles
  SET is_reactive = false, reactive_score = 0, updated_at = NOW()
  WHERE role = 'artisan'
    AND id NOT IN (
      SELECT artisan_id FROM lead_assignments
      WHERE notified_at >= NOW() - INTERVAL '30 days'
      GROUP BY artisan_id
      HAVING COUNT(*) >= 20
    )
    AND (is_reactive = true OR reactive_score > 0);

  RETURN v_updated;
END;
$$;

GRANT EXECUTE ON FUNCTION recalculate_reactive_scores TO service_role;

COMMENT ON FUNCTION recalculate_reactive_scores IS 'Recalcule les scores réactivité de tous les artisans (cron nightly)';
