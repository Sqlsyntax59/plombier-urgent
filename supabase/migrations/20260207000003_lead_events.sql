-- Epic 10 / Story 10.2 : Table audit trail lead_events

CREATE TABLE lead_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_lead_events_lead ON lead_events(lead_id);
CREATE INDEX idx_lead_events_type ON lead_events(event_type);
CREATE INDEX idx_lead_events_created ON lead_events(created_at DESC);

ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access lead_events"
  ON lead_events FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE lead_events IS 'Audit trail événements lead (scoring, geocodage, attribution)';
