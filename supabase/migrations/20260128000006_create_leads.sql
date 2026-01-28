-- Story 3.2-3.6: Table leads pour demandes clients

-- Types de pannes disponibles
CREATE TYPE problem_type AS ENUM (
  'fuite',
  'wc_bouche',
  'ballon_eau_chaude',
  'canalisation',
  'robinetterie',
  'autre'
);

-- Statuts du lead
CREATE TYPE lead_status AS ENUM (
  'pending',
  'assigned',
  'accepted',
  'completed',
  'cancelled',
  'unassigned'
);

-- Table des leads (demandes clients)
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Type de probleme
  problem_type problem_type NOT NULL,

  -- Description et photo
  description TEXT NOT NULL,
  photo_url TEXT,

  -- Coordonnees client
  client_phone TEXT NOT NULL,
  client_email TEXT,
  client_city TEXT,

  -- Localisation (pour attribution par distance)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Verticale metier
  vertical_id UUID REFERENCES verticals(id),

  -- Statut et attribution
  status lead_status NOT NULL DEFAULT 'pending',
  cascade_count INTEGER DEFAULT 0,

  -- Satisfaction client (suivi J+3)
  satisfaction TEXT, -- 'yes', 'no', null

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherches frequentes
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_vertical ON leads(vertical_id);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- Commentaires
COMMENT ON TABLE leads IS 'Demandes urgence soumises par les clients';
COMMENT ON COLUMN leads.problem_type IS 'Type de panne selectionne';
COMMENT ON COLUMN leads.description IS 'Description libre du probleme (10-500 caracteres)';
COMMENT ON COLUMN leads.photo_url IS 'URL Firebase Storage de la photo optionnelle';
COMMENT ON COLUMN leads.client_phone IS 'Numero de telephone du client (format FR)';
COMMENT ON COLUMN leads.cascade_count IS 'Nombre d''artisans notifies en cascade';
COMMENT ON COLUMN leads.satisfaction IS 'Reponse au suivi J+3 (yes/no)';
