-- Story 2.5: Champs pour page publique artisan

-- Slug unique pour URL publique /artisan/[slug]
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Lien vers fiche Google My Business
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS google_business_url TEXT;

-- Rayon d'intervention en km
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS radius_km INTEGER DEFAULT 20;

-- Index pour recherche par slug (URLs publiques)
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug) WHERE slug IS NOT NULL;

-- Fonction pour generer un slug automatique a partir du prenom et ville
-- Note: Le slug sera genere cote application lors de l'inscription
COMMENT ON COLUMN profiles.slug IS 'Identifiant URL unique pour la page publique artisan';
COMMENT ON COLUMN profiles.google_business_url IS 'Lien vers la fiche Google My Business de l''artisan';
COMMENT ON COLUMN profiles.radius_km IS 'Rayon d''intervention en kilometres';
