-- Migration: Table monitoring des crons Vercel
-- #15: Historique d'execution pour /admin/crons

CREATE TABLE cron_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cron_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_cron_runs_name_started ON cron_runs(cron_name, started_at DESC);
CREATE INDEX idx_cron_runs_status ON cron_runs(status);

ALTER TABLE cron_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view cron runs"
  ON cron_runs FOR SELECT USING (true);

CREATE POLICY "Service role can manage cron runs"
  ON cron_runs FOR ALL USING (true);
