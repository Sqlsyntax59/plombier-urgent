-- Migration: Create verticals table
-- Story: 1.2 - Configuration Supabase et Schema Initial
-- AC2: Table verticals creee

-- Table verticals pour multi-tenant
CREATE TABLE verticals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price_grid JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour recherche par slug
CREATE INDEX idx_verticals_slug ON verticals(slug);

-- RLS: Lecture publique
ALTER TABLE verticals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verticals are viewable by everyone"
  ON verticals FOR SELECT
  USING (true);

-- Seed: verticale plomberie par defaut
INSERT INTO verticals (name, slug, price_grid) VALUES (
  'Plomberie',
  'plomberie',
  '{
    "fuite": {"min": 90, "max": 150},
    "wc_bouche": {"min": 80, "max": 120},
    "ballon": {"min": 150, "max": 300},
    "canalisation": {"min": 100, "max": 180},
    "robinet": {"min": 60, "max": 100},
    "autre": {"min": 80, "max": 250}
  }'
);
