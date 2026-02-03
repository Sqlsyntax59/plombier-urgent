-- Migration: Add verification fields for anti-fraud
-- Story: 2.1 V2 - Inscription Artisan Anti-Travail Dissimulé

-- SIRET verification
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS siret VARCHAR(14);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS siret_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Verification status workflow
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'registered';

-- Add CHECK constraint for verification_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_verification_status_check'
  ) THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_verification_status_check
      CHECK (verification_status IN ('registered', 'pending_verification', 'verified', 'suspended'));
  END IF;
END $$;

-- Insurance fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_provider TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_valid_until DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_attestation_path TEXT;

-- Unique index on SIRET (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_siret
  ON profiles(siret)
  WHERE siret IS NOT NULL;

-- Index for verification status queries
CREATE INDEX IF NOT EXISTS idx_profiles_verification_status
  ON profiles(verification_status);

-- Comments for documentation
COMMENT ON COLUMN profiles.siret IS 'SIRET 14 digits - verified via INSEE Sirene API';
COMMENT ON COLUMN profiles.siret_verified IS 'True if SIRET was validated by INSEE API (false = degraded mode)';
COMMENT ON COLUMN profiles.company_name IS 'Company name from INSEE or manual input';
COMMENT ON COLUMN profiles.verification_status IS 'registered -> pending_verification -> verified | suspended';
COMMENT ON COLUMN profiles.insurance_provider IS 'Insurance company name';
COMMENT ON COLUMN profiles.insurance_policy_number IS 'Insurance policy number';
COMMENT ON COLUMN profiles.insurance_valid_until IS 'Insurance expiry date';
COMMENT ON COLUMN profiles.insurance_attestation_path IS 'Path to insurance PDF in Supabase Storage';
