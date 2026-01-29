-- ============================================
-- EPIC 4: TOUTES LES MIGRATIONS
-- Executer ce script dans le SQL Editor Supabase
-- https://supabase.com/dashboard/project/zoyfbfnvbczfgblyjzzf/sql/new
-- ============================================

-- ============================================
-- MIGRATION 1: Table lead_assignments
-- ============================================

-- Types de statut attribution
DO $$ BEGIN
  CREATE TYPE assignment_status AS ENUM (
    'pending',
    'accepted',
    'expired',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Table des attributions
CREATE TABLE IF NOT EXISTS lead_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  cascade_order INTEGER NOT NULL DEFAULT 1,
  status assignment_status NOT NULL DEFAULT 'pending',
  notified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_lead_artisan UNIQUE(lead_id, artisan_id),
  CONSTRAINT unique_lead_cascade_order UNIQUE(lead_id, cascade_order)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_lead_assignments_lead ON lead_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_artisan ON lead_assignments(artisan_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_status ON lead_assignments(status);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_pending_expires ON lead_assignments(expires_at)
  WHERE status = 'pending';

-- RLS
ALTER TABLE lead_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Artisans can view own assignments" ON lead_assignments;
CREATE POLICY "Artisans can view own assignments"
  ON lead_assignments FOR SELECT
  USING (auth.uid() = artisan_id);

DROP POLICY IF EXISTS "Service role full access" ON lead_assignments;
CREATE POLICY "Service role full access"
  ON lead_assignments FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- MIGRATION 2: Table credit_transactions
-- ============================================

-- Types de transactions
DO $$ BEGIN
  CREATE TYPE credit_transaction_type AS ENUM (
    'purchase',
    'lead_debit',
    'refund',
    'bonus',
    'initial'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Table des transactions
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type credit_transaction_type NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_credit_transactions_artisan ON credit_transactions(artisan_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_lead ON credit_transactions(lead_id)
  WHERE lead_id IS NOT NULL;

-- RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Artisans can view own transactions" ON credit_transactions;
CREATE POLICY "Artisans can view own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = artisan_id);

DROP POLICY IF EXISTS "Service role full access transactions" ON credit_transactions;
CREATE POLICY "Service role full access transactions"
  ON credit_transactions FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- MIGRATION 3: Champs cascade sur profiles/leads
-- ============================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS consecutive_missed_leads INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON profiles(is_suspended)
  WHERE is_suspended = false;

CREATE INDEX IF NOT EXISTS idx_profiles_telegram ON profiles(telegram_chat_id)
  WHERE telegram_chat_id IS NOT NULL;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS assigned_artisan_id UUID REFERENCES profiles(id);

CREATE INDEX IF NOT EXISTS idx_leads_assigned_artisan ON leads(assigned_artisan_id)
  WHERE assigned_artisan_id IS NOT NULL;

-- ============================================
-- MIGRATION 4: Fonctions RPC
-- ============================================

-- 1. Trouver artisan disponible
CREATE OR REPLACE FUNCTION find_available_artisan(
  p_lead_id UUID,
  p_vertical_id UUID DEFAULT NULL
)
RETURNS TABLE (
  artisan_id UUID,
  artisan_name TEXT,
  telegram_chat_id TEXT,
  distance_km DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lead_lat DECIMAL;
  v_lead_lng DECIMAL;
  v_vertical_id UUID;
BEGIN
  SELECT latitude, longitude, vertical_id
  INTO v_lead_lat, v_lead_lng, v_vertical_id
  FROM leads
  WHERE id = p_lead_id;

  IF p_vertical_id IS NOT NULL THEN
    v_vertical_id := p_vertical_id;
  END IF;

  RETURN QUERY
  SELECT
    p.id AS artisan_id,
    p.company_name AS artisan_name,
    p.telegram_chat_id,
    CASE
      WHEN v_lead_lat IS NOT NULL AND v_lead_lng IS NOT NULL
           AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
      THEN (
        6371 * acos(
          cos(radians(v_lead_lat)) * cos(radians(p.latitude)) *
          cos(radians(p.longitude) - radians(v_lead_lng)) +
          sin(radians(v_lead_lat)) * sin(radians(p.latitude))
        )
      )
      ELSE 9999
    END AS distance_km
  FROM profiles p
  WHERE
    p.role = 'artisan'
    AND p.is_active = true
    AND p.is_suspended = false
    AND p.credits > 0
    AND p.telegram_chat_id IS NOT NULL
    AND (v_vertical_id IS NULL OR p.vertical_id = v_vertical_id)
    AND NOT EXISTS (
      SELECT 1 FROM lead_assignments la
      WHERE la.lead_id = p_lead_id AND la.artisan_id = p.id
    )
  ORDER BY
    distance_km ASC,
    p.credits DESC
  LIMIT 1;
END;
$$;

-- 2. Creer attribution
CREATE OR REPLACE FUNCTION create_assignment(
  p_lead_id UUID,
  p_artisan_id UUID,
  p_cascade_order INTEGER DEFAULT 1
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_assignment_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  v_expires_at := NOW() + INTERVAL '2 minutes';

  INSERT INTO lead_assignments (
    lead_id, artisan_id, cascade_order, status, notified_at, expires_at
  )
  VALUES (
    p_lead_id, p_artisan_id, p_cascade_order, 'pending', NOW(), v_expires_at
  )
  RETURNING id INTO v_assignment_id;

  UPDATE leads
  SET status = 'assigned', cascade_count = p_cascade_order, updated_at = NOW()
  WHERE id = p_lead_id;

  RETURN v_assignment_id;
END;
$$;

-- 3. Accepter lead (atomique)
CREATE OR REPLACE FUNCTION accept_lead(
  p_assignment_id UUID,
  p_artisan_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lead_id UUID;
  v_assignment_status assignment_status;
  v_lead_status lead_status;
  v_artisan_credits INTEGER;
  v_new_balance INTEGER;
  v_lead_cost INTEGER := 1;
BEGIN
  SELECT la.lead_id, la.status
  INTO v_lead_id, v_assignment_status
  FROM lead_assignments la
  WHERE la.id = p_assignment_id AND la.artisan_id = p_artisan_id;

  IF v_lead_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ASSIGNMENT_NOT_FOUND', 'message', 'Attribution non trouvee');
  END IF;

  IF v_assignment_status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'ASSIGNMENT_NOT_PENDING', 'message', 'Attribution deja traitee');
  END IF;

  SELECT status INTO v_lead_status FROM leads WHERE id = v_lead_id;

  IF v_lead_status = 'accepted' THEN
    RETURN jsonb_build_object('success', false, 'error', 'LEAD_ALREADY_ACCEPTED', 'message', 'Lead deja accepte');
  END IF;

  SELECT credits INTO v_artisan_credits FROM profiles WHERE id = p_artisan_id;

  IF v_artisan_credits < v_lead_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_CREDITS', 'message', 'Credits insuffisants');
  END IF;

  v_new_balance := v_artisan_credits - v_lead_cost;

  UPDATE profiles
  SET credits = v_new_balance, consecutive_missed_leads = 0, updated_at = NOW()
  WHERE id = p_artisan_id;

  INSERT INTO credit_transactions (artisan_id, type, amount, balance_after, lead_id, metadata)
  VALUES (p_artisan_id, 'lead_debit', -v_lead_cost, v_new_balance, v_lead_id, jsonb_build_object('assignment_id', p_assignment_id));

  UPDATE lead_assignments SET status = 'accepted', responded_at = NOW() WHERE id = p_assignment_id;
  UPDATE lead_assignments SET status = 'expired' WHERE lead_id = v_lead_id AND id != p_assignment_id AND status = 'pending';
  UPDATE leads SET status = 'accepted', assigned_artisan_id = p_artisan_id, updated_at = NOW() WHERE id = v_lead_id;

  RETURN jsonb_build_object('success', true, 'lead_id', v_lead_id, 'new_balance', v_new_balance, 'message', 'Lead accepte');
END;
$$;

-- 4. Expirer attribution
CREATE OR REPLACE FUNCTION expire_assignment(p_assignment_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_artisan_id UUID;
  v_lead_id UUID;
  v_assignment_status assignment_status;
  v_consecutive_missed INTEGER;
  v_is_now_suspended BOOLEAN := false;
BEGIN
  SELECT artisan_id, lead_id, status
  INTO v_artisan_id, v_lead_id, v_assignment_status
  FROM lead_assignments WHERE id = p_assignment_id;

  IF v_artisan_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ASSIGNMENT_NOT_FOUND');
  END IF;

  IF v_assignment_status != 'pending' THEN
    RETURN jsonb_build_object('success', true, 'already_processed', true);
  END IF;

  UPDATE lead_assignments SET status = 'expired', responded_at = NOW() WHERE id = p_assignment_id;

  UPDATE profiles
  SET
    consecutive_missed_leads = consecutive_missed_leads + 1,
    is_suspended = CASE WHEN consecutive_missed_leads + 1 >= 3 THEN true ELSE is_suspended END,
    updated_at = NOW()
  WHERE id = v_artisan_id
  RETURNING consecutive_missed_leads, is_suspended INTO v_consecutive_missed, v_is_now_suspended;

  RETURN jsonb_build_object('success', true, 'artisan_id', v_artisan_id, 'consecutive_missed', v_consecutive_missed, 'is_suspended', v_is_now_suspended);
END;
$$;

-- 5. Verifier statut lead
CREATE OR REPLACE FUNCTION check_lead_status(p_lead_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lead RECORD;
  v_assigned_artisan RECORD;
BEGIN
  SELECT id, status, assigned_artisan_id, cascade_count INTO v_lead FROM leads WHERE id = p_lead_id;

  IF v_lead.id IS NULL THEN
    RETURN jsonb_build_object('exists', false, 'error', 'LEAD_NOT_FOUND');
  END IF;

  IF v_lead.status = 'accepted' AND v_lead.assigned_artisan_id IS NOT NULL THEN
    SELECT company_name, phone INTO v_assigned_artisan FROM profiles WHERE id = v_lead.assigned_artisan_id;
    RETURN jsonb_build_object('exists', true, 'status', v_lead.status, 'is_accepted', true, 'assigned_artisan', jsonb_build_object('id', v_lead.assigned_artisan_id, 'name', v_assigned_artisan.company_name), 'cascade_count', v_lead.cascade_count);
  END IF;

  RETURN jsonb_build_object('exists', true, 'status', v_lead.status, 'is_accepted', false, 'cascade_count', v_lead.cascade_count);
END;
$$;

-- 6. Details lead
CREATE OR REPLACE FUNCTION get_lead_details(p_lead_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lead RECORD;
  v_vertical_name TEXT;
BEGIN
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;

  IF v_lead.id IS NULL THEN
    RETURN jsonb_build_object('error', 'LEAD_NOT_FOUND');
  END IF;

  IF v_lead.vertical_id IS NOT NULL THEN
    SELECT name INTO v_vertical_name FROM verticals WHERE id = v_lead.vertical_id;
  END IF;

  RETURN jsonb_build_object(
    'id', v_lead.id, 'problem_type', v_lead.problem_type, 'description', v_lead.description,
    'client_phone', v_lead.client_phone, 'client_city', v_lead.client_city,
    'vertical_name', v_vertical_name, 'status', v_lead.status, 'cascade_count', v_lead.cascade_count
  );
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION find_available_artisan TO service_role;
GRANT EXECUTE ON FUNCTION create_assignment TO service_role;
GRANT EXECUTE ON FUNCTION accept_lead TO service_role;
GRANT EXECUTE ON FUNCTION expire_assignment TO service_role;
GRANT EXECUTE ON FUNCTION check_lead_status TO service_role;
GRANT EXECUTE ON FUNCTION get_lead_details TO service_role;

-- ============================================
-- FIN DES MIGRATIONS EPIC 4
-- ============================================
