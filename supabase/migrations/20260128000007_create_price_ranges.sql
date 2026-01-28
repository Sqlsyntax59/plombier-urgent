-- Story 3.5: Fourchettes de prix indicatives par type de panne

CREATE TABLE price_ranges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Type de panne (enum defini dans leads)
  problem_type problem_type NOT NULL,

  -- Verticale metier (NULL = toutes verticales)
  vertical_id UUID REFERENCES verticals(id),

  -- Fourchette de prix
  min_price INTEGER NOT NULL,
  max_price INTEGER NOT NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contrainte d'unicite par type et verticale
  UNIQUE(problem_type, vertical_id)
);

-- Index
CREATE INDEX idx_price_ranges_problem_type ON price_ranges(problem_type);
CREATE INDEX idx_price_ranges_vertical ON price_ranges(vertical_id);

-- Commentaires
COMMENT ON TABLE price_ranges IS 'Fourchettes de prix indicatives par type de probleme';
COMMENT ON COLUMN price_ranges.min_price IS 'Prix minimum indicatif en euros';
COMMENT ON COLUMN price_ranges.max_price IS 'Prix maximum indicatif en euros';

-- Donnees initiales pour la verticale plombier (vertical_id = NULL signifie par defaut)
INSERT INTO price_ranges (problem_type, vertical_id, min_price, max_price) VALUES
  ('fuite', NULL, 90, 150),
  ('wc_bouche', NULL, 80, 130),
  ('ballon_eau_chaude', NULL, 150, 350),
  ('canalisation', NULL, 120, 250),
  ('robinetterie', NULL, 60, 120),
  ('autre', NULL, 80, 200);
