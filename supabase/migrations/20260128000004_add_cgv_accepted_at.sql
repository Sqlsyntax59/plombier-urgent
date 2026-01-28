-- Story 2.2: Ajout du champ CGV acceptation
-- Enregistre la date d'acceptation des CGV par l'artisan

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cgv_accepted_at TIMESTAMP WITH TIME ZONE;

-- Index pour requetes sur les artisans ayant accepte les CGV
CREATE INDEX IF NOT EXISTS idx_profiles_cgv_accepted ON profiles(cgv_accepted_at) WHERE cgv_accepted_at IS NOT NULL;

COMMENT ON COLUMN profiles.cgv_accepted_at IS 'Date et heure d''acceptation des CGV par l''artisan';
