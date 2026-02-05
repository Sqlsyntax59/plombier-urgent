-- Epic 10 / Story 10.3 : Temps de réponse + numéro de vague

ALTER TABLE lead_assignments
  ADD COLUMN IF NOT EXISTS response_ms INTEGER,
  ADD COLUMN IF NOT EXISTS wave_number INTEGER DEFAULT 1;

COMMENT ON COLUMN lead_assignments.response_ms IS 'Temps de réponse en ms (responded_at - notified_at)';
COMMENT ON COLUMN lead_assignments.wave_number IS 'Numéro de vague pour attribution multi-artisans (1, 2, 3...)';

-- Calcul automatique de response_ms quand responded_at est défini
CREATE OR REPLACE FUNCTION compute_response_ms()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.responded_at IS NOT NULL AND OLD.responded_at IS NULL AND NEW.notified_at IS NOT NULL THEN
    NEW.response_ms := EXTRACT(EPOCH FROM (NEW.responded_at - NEW.notified_at)) * 1000;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_compute_response_ms
  BEFORE UPDATE ON lead_assignments
  FOR EACH ROW
  EXECUTE FUNCTION compute_response_ms();
