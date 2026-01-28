-- Story 4.1: Table lead_assignments pour tracer les attributions

-- Statut de l'assignment
CREATE TYPE assignment_status AS ENUM (
  'pending',    -- En attente de reponse artisan
  'accepted',   -- Artisan a accepte
  'expired',    -- Timer 2min expire
  'rejected'    -- Artisan a refuse (futur)
);

-- Canal de notification utilise
CREATE TYPE notification_channel AS ENUM (
  'whatsapp',
  'sms',
  'email'
);

-- Table des attributions de leads aux artisans
CREATE TABLE lead_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Lead concerne
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Artisan notifie
  artisan_id UUID NOT NULL REFERENCES profiles(id),

  -- Position dans la cascade (1, 2, 3)
  cascade_position INTEGER NOT NULL DEFAULT 1,

  -- Statut de l'attribution
  status assignment_status NOT NULL DEFAULT 'pending',

  -- Canal de notification utilise
  notification_channel notification_channel,

  -- Identifiant externe du message (WhatsApp message ID, etc.)
  notification_external_id TEXT,

  -- Erreur de notification si echec
  notification_error TEXT,

  -- Timestamps
  notified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  responded_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Contrainte: un artisan ne peut etre notifie qu'une fois par lead
  UNIQUE(lead_id, artisan_id)
);

-- Index pour recherches frequentes
CREATE INDEX idx_lead_assignments_lead ON lead_assignments(lead_id);
CREATE INDEX idx_lead_assignments_artisan ON lead_assignments(artisan_id);
CREATE INDEX idx_lead_assignments_status ON lead_assignments(status);
CREATE INDEX idx_lead_assignments_expires ON lead_assignments(expires_at) WHERE status = 'pending';

-- Commentaires
COMMENT ON TABLE lead_assignments IS 'Attributions de leads aux artisans avec suivi du statut';
COMMENT ON COLUMN lead_assignments.cascade_position IS 'Position dans la cascade (1=premier notifie, 2=second, etc.)';
COMMENT ON COLUMN lead_assignments.notification_channel IS 'Canal utilise: whatsapp, sms, ou email (fallback)';
COMMENT ON COLUMN lead_assignments.expires_at IS 'Date d''expiration (2 minutes apres notification)';

-- Trigger pour mettre a jour updated_at sur leads quand assignment change
CREATE OR REPLACE FUNCTION update_lead_on_assignment_change()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE leads SET updated_at = NOW() WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lead_on_assignment
  AFTER INSERT OR UPDATE ON lead_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_on_assignment_change();
