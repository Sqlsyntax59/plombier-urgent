-- Epic 10 / Story 10.2 : Champs scoring sur leads

CREATE TYPE lead_quality AS ENUM ('low', 'medium', 'high', 'premium');

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS lead_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lead_quality lead_quality,
  ADD COLUMN IF NOT EXISTS scoring_factors JSONB DEFAULT '{}';

CREATE INDEX idx_leads_quality ON leads(lead_quality);
CREATE INDEX idx_leads_score ON leads(lead_score DESC);

COMMENT ON COLUMN leads.lead_score IS 'Score qualité 0-100 calculé automatiquement';
COMMENT ON COLUMN leads.lead_quality IS 'Classification: low/medium/high/premium';
COMMENT ON COLUMN leads.scoring_factors IS 'Détail des facteurs de scoring en JSONB';
