-- Migration: Create client feedback & ratings
-- Epic 7: Suivi Client J+3
-- Feedback client + notation artisan + boucle qualite

-- Table feedback client
CREATE TABLE client_feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Token unique pour lien feedback (securite)
  token UUID UNIQUE DEFAULT gen_random_uuid(),

  -- Satisfaction globale
  satisfied BOOLEAN,

  -- Note artisan (1-5 etoiles)
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),

  -- Commentaire optionnel
  comment TEXT,

  -- Problemes signales (multi-select)
  issues TEXT[], -- ['retard', 'prix', 'qualite', 'communication']

  -- Tracking
  sent_at TIMESTAMPTZ DEFAULT now(),
  opened_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  channel TEXT CHECK (channel IN ('whatsapp', 'sms', 'email')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index performance
CREATE INDEX idx_client_feedbacks_lead ON client_feedbacks(lead_id);
CREATE INDEX idx_client_feedbacks_artisan ON client_feedbacks(artisan_id);
CREATE INDEX idx_client_feedbacks_token ON client_feedbacks(token);
CREATE INDEX idx_client_feedbacks_submitted ON client_feedbacks(submitted_at) WHERE submitted_at IS NOT NULL;

-- RLS Policies
ALTER TABLE client_feedbacks ENABLE ROW LEVEL SECURITY;

-- Policy: Artisan peut voir ses propres feedbacks (soumis uniquement)
CREATE POLICY "Artisans can view own feedbacks"
  ON client_feedbacks FOR SELECT
  USING (
    auth.uid() = artisan_id
    AND submitted_at IS NOT NULL
  );

-- Policy: Insertion via service role (webhook n8n)
CREATE POLICY "Service role can insert feedbacks"
  ON client_feedbacks FOR INSERT
  WITH CHECK (true);

-- Policy: Update via token (client anonyme)
CREATE POLICY "Anyone can update by token"
  ON client_feedbacks FOR UPDATE
  USING (true);

-- Vue statistiques artisan (ratings moyens)
CREATE OR REPLACE VIEW artisan_ratings AS
SELECT
  artisan_id,
  COUNT(*) FILTER (WHERE submitted_at IS NOT NULL) as total_reviews,
  COUNT(*) FILTER (WHERE satisfied = true) as positive_reviews,
  COUNT(*) FILTER (WHERE satisfied = false) as negative_reviews,
  ROUND(AVG(rating)::numeric, 1) as average_rating,
  ROUND(
    (COUNT(*) FILTER (WHERE satisfied = true)::numeric /
     NULLIF(COUNT(*) FILTER (WHERE submitted_at IS NOT NULL), 0) * 100)::numeric, 0
  ) as satisfaction_rate
FROM client_feedbacks
GROUP BY artisan_id;

-- Ajouter colonne average_rating au profil (cache)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(2,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;

-- Fonction pour mettre a jour le cache rating apres feedback
CREATE OR REPLACE FUNCTION update_artisan_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET
    average_rating = (
      SELECT ROUND(AVG(rating)::numeric, 1)
      FROM client_feedbacks
      WHERE artisan_id = NEW.artisan_id
      AND submitted_at IS NOT NULL
      AND rating IS NOT NULL
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM client_feedbacks
      WHERE artisan_id = NEW.artisan_id
      AND submitted_at IS NOT NULL
    ),
    updated_at = now()
  WHERE id = NEW.artisan_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_rating_on_feedback
  AFTER INSERT OR UPDATE OF rating, submitted_at ON client_feedbacks
  FOR EACH ROW
  WHEN (NEW.submitted_at IS NOT NULL)
  EXECUTE FUNCTION update_artisan_rating();

-- Table pour tracker les envois de suivi (eviter doublons)
CREATE TABLE followup_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email')),
  sent_at TIMESTAMPTZ DEFAULT now(),
  delivered BOOLEAN DEFAULT NULL,
  UNIQUE(lead_id, channel)
);

CREATE INDEX idx_followup_sends_lead ON followup_sends(lead_id);
