-- Epic 10 / Story 10.3 : Champs réactivité sur profiles
-- Note: latitude, longitude, intervention_radius_km existent déjà

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_reactive BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reactive_score INTEGER DEFAULT 0;

CREATE INDEX idx_profiles_reactive ON profiles(is_reactive) WHERE is_reactive = true;
CREATE INDEX idx_profiles_reactive_score ON profiles(reactive_score DESC);

COMMENT ON COLUMN profiles.is_reactive IS 'Badge Réactif: response_rate >= 80% AND fast_rate >= 80%';
COMMENT ON COLUMN profiles.reactive_score IS 'Score réactivité 0-100';
