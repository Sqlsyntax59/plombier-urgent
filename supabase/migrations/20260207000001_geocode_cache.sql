-- Epic 10 / Story 10.1 : Table cache géocodage API BAN
-- TTL 30 jours pour éviter les appels redondants

CREATE TABLE geocode_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  postal_code TEXT NOT NULL,
  city_name TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  UNIQUE(postal_code)
);

CREATE INDEX idx_geocode_cache_postal ON geocode_cache(postal_code);
CREATE INDEX idx_geocode_cache_expires ON geocode_cache(expires_at);

ALTER TABLE geocode_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access geocode_cache"
  ON geocode_cache FOR ALL
  USING (auth.role() = 'service_role');

COMMENT ON TABLE geocode_cache IS 'Cache geocodage API BAN (adresse.data.gouv.fr), TTL 30 jours';
