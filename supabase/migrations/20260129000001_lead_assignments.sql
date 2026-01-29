-- Epic 4: Table des attributions de leads
-- Trace chaque tentative de notification artisan dans la cascade

-- Types de statut attribution
CREATE TYPE assignment_status AS ENUM (
  'pending',    -- En attente de reponse artisan
  'accepted',   -- Accepte par artisan
  'expired',    -- Timeout 2 minutes
  'rejected'    -- Refuse explicitement
);

-- Table des attributions
CREATE TABLE lead_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Position dans la cascade (1, 2, 3...)
  cascade_order INTEGER NOT NULL DEFAULT 1,

  -- Statut
  status assignment_status NOT NULL DEFAULT 'pending',

  -- Timestamps de gestion
  notified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  responded_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Contraintes unicite
  CONSTRAINT unique_lead_artisan UNIQUE(lead_id, artisan_id),
  CONSTRAINT unique_lead_cascade_order UNIQUE(lead_id, cascade_order)
);

-- Index pour queries frequentes
CREATE INDEX idx_lead_assignments_lead ON lead_assignments(lead_id);
CREATE INDEX idx_lead_assignments_artisan ON lead_assignments(artisan_id);
CREATE INDEX idx_lead_assignments_status ON lead_assignments(status);
CREATE INDEX idx_lead_assignments_pending_expires ON lead_assignments(expires_at)
  WHERE status = 'pending';

-- Commentaires
COMMENT ON TABLE lead_assignments IS 'Trace chaque attribution de lead a un artisan dans la cascade';
COMMENT ON COLUMN lead_assignments.cascade_order IS 'Position dans la cascade (1=premier notifie, 2=deuxieme, etc.)';
COMMENT ON COLUMN lead_assignments.expires_at IS 'Date expiration (2 minutes apres notification)';
COMMENT ON COLUMN lead_assignments.responded_at IS 'Date de reponse artisan (acceptation ou refus)';

-- RLS
ALTER TABLE lead_assignments ENABLE ROW LEVEL SECURITY;

-- Artisans peuvent voir leurs propres attributions
CREATE POLICY "Artisans can view own assignments"
  ON lead_assignments FOR SELECT
  USING (auth.uid() = artisan_id);

-- Service role peut tout faire (pour n8n)
CREATE POLICY "Service role full access"
  ON lead_assignments FOR ALL
  USING (auth.role() = 'service_role');
