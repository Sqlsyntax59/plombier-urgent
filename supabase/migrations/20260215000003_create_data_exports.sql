-- #16 RGPD: table de traçabilité des exports de données personnelles
CREATE TABLE data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('processing', 'ready', 'failed'))
);

CREATE INDEX idx_data_exports_user ON data_exports(user_id, created_at DESC);

ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;

-- L'utilisateur peut voir ses propres exports
CREATE POLICY "Users can view own exports"
  ON data_exports FOR SELECT
  USING (auth.uid() = user_id);

-- Service role insère
CREATE POLICY "Service role can insert"
  ON data_exports FOR INSERT
  WITH CHECK (true);
