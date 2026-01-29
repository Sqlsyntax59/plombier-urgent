-- ============================================
-- TOUTES LES MIGRATIONS - SCRIPT COMPLET
-- Executer dans le SQL Editor Supabase
-- ============================================

-- ============================================
-- 1. TABLE VERTICALS
-- ============================================
CREATE TABLE IF NOT EXISTS verticals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price_grid JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verticals_slug ON verticals(slug);

ALTER TABLE verticals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Verticals are viewable by everyone" ON verticals;
CREATE POLICY "Verticals are viewable by everyone"
  ON verticals FOR SELECT
  USING (true);

INSERT INTO verticals (name, slug, price_grid)
SELECT 'Plomberie', 'plombier', '{
  "fuite": {"min": 90, "max": 150},
  "wc_bouche": {"min": 80, "max": 120},
  "ballon": {"min": 150, "max": 300},
  "canalisation": {"min": 100, "max": 180},
  "robinet": {"min": 60, "max": 100},
  "autre": {"min": 80, "max": 250}
}'
WHERE NOT EXISTS (SELECT 1 FROM verticals WHERE slug = 'plombier');

-- ============================================
-- 2. TABLE PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  vertical_id UUID REFERENCES verticals(id),
  role TEXT NOT NULL DEFAULT 'artisan' CHECK (role IN ('artisan', 'admin', 'super_admin')),
  first_name TEXT,
  city TEXT,
  phone TEXT,
  whatsapp_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  credits INTEGER DEFAULT 0,
  google_place_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_vertical_id ON profiles(vertical_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Champs artisan supplementaires
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS company_name TEXT,
  ADD COLUMN IF NOT EXISTS siret TEXT,
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS cgv_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS availability TEXT DEFAULT 'available',
  ADD COLUMN IF NOT EXISTS intervention_radius_km INTEGER DEFAULT 20;

-- ============================================
-- 3. TABLE LEADS
-- ============================================
DO $$ BEGIN
  CREATE TYPE problem_type AS ENUM (
    'fuite', 'wc_bouche', 'ballon_eau_chaude', 'canalisation', 'robinetterie', 'autre'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM (
    'pending', 'assigned', 'accepted', 'completed', 'cancelled', 'unassigned'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_type problem_type NOT NULL,
  description TEXT NOT NULL,
  photo_url TEXT,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  client_city TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  vertical_id UUID REFERENCES verticals(id),
  status lead_status NOT NULL DEFAULT 'pending',
  cascade_count INTEGER DEFAULT 0,
  satisfaction TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_vertical ON leads(vertical_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- ============================================
-- EPIC 4: LEAD ASSIGNMENTS
-- ============================================
DO $$ BEGIN
  CREATE TYPE assignment_status AS ENUM ('pending', 'accepted', 'expired', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

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

CREATE INDEX IF NOT EXISTS idx_lead_assignments_lead ON lead_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_artisan ON lead_assignments(artisan_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_status ON lead_assignments(status);

ALTER TABLE lead_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Artisans can view own assignments" ON lead_assignments;
CREATE POLICY "Artisans can view own assignments"
  ON lead_assignments FOR SELECT USING (auth.uid() = artisan_id);

DROP POLICY IF EXISTS "Service role full access" ON lead_assignments;
CREATE POLICY "Service role full access"
  ON lead_assignments FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- EPIC 4: CREDIT TRANSACTIONS
-- ============================================
DO $$ BEGIN
  CREATE TYPE credit_transaction_type AS ENUM ('purchase', 'lead_debit', 'refund', 'bonus', 'initial');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

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

CREATE INDEX IF NOT EXISTS idx_credit_transactions_artisan ON credit_transactions(artisan_id);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Artisans can view own transactions" ON credit_transactions;
CREATE POLICY "Artisans can view own transactions"
  ON credit_transactions FOR SELECT USING (auth.uid() = artisan_id);

DROP POLICY IF EXISTS "Service role full access transactions" ON credit_transactions;
CREATE POLICY "Service role full access transactions"
  ON credit_transactions FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- EPIC 4: CHAMPS CASCADE
-- ============================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS consecutive_missed_leads INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS assigned_artisan_id UUID REFERENCES profiles(id);

-- ============================================
-- EPIC 4: FONCTIONS RPC
-- ============================================

CREATE OR REPLACE FUNCTION find_available_artisan(p_lead_id UUID, p_vertical_id UUID DEFAULT NULL)
RETURNS TABLE (artisan_id UUID, artisan_name TEXT, telegram_chat_id TEXT, distance_km DECIMAL)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_lead_lat DECIMAL; v_lead_lng DECIMAL; v_vertical_id UUID;
BEGIN
  SELECT latitude, longitude, vertical_id INTO v_lead_lat, v_lead_lng, v_vertical_id FROM leads WHERE id = p_lead_id;
  IF p_vertical_id IS NOT NULL THEN v_vertical_id := p_vertical_id; END IF;
  RETURN QUERY SELECT p.id, p.company_name, p.telegram_chat_id,
    CASE WHEN v_lead_lat IS NOT NULL AND v_lead_lng IS NOT NULL AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
    THEN 6371 * acos(cos(radians(v_lead_lat)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(v_lead_lng)) + sin(radians(v_lead_lat)) * sin(radians(p.latitude)))
    ELSE 9999 END
  FROM profiles p WHERE p.role = 'artisan' AND p.is_active = true AND p.is_suspended = false AND p.credits > 0 AND p.telegram_chat_id IS NOT NULL
    AND (v_vertical_id IS NULL OR p.vertical_id = v_vertical_id)
    AND NOT EXISTS (SELECT 1 FROM lead_assignments la WHERE la.lead_id = p_lead_id AND la.artisan_id = p.id)
  ORDER BY 4 ASC, p.credits DESC LIMIT 1;
END; $$;

CREATE OR REPLACE FUNCTION create_assignment(p_lead_id UUID, p_artisan_id UUID, p_cascade_order INTEGER DEFAULT 1)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_assignment_id UUID;
BEGIN
  INSERT INTO lead_assignments (lead_id, artisan_id, cascade_order, status, notified_at, expires_at)
  VALUES (p_lead_id, p_artisan_id, p_cascade_order, 'pending', NOW(), NOW() + INTERVAL '2 minutes')
  RETURNING id INTO v_assignment_id;
  UPDATE leads SET status = 'assigned', cascade_count = p_cascade_order, updated_at = NOW() WHERE id = p_lead_id;
  RETURN v_assignment_id;
END; $$;

CREATE OR REPLACE FUNCTION accept_lead(p_assignment_id UUID, p_artisan_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_lead_id UUID; v_status assignment_status; v_lead_status lead_status; v_credits INTEGER; v_new_balance INTEGER;
BEGIN
  SELECT lead_id, status INTO v_lead_id, v_status FROM lead_assignments WHERE id = p_assignment_id AND artisan_id = p_artisan_id;
  IF v_lead_id IS NULL THEN RETURN '{"success":false,"error":"ASSIGNMENT_NOT_FOUND"}'::jsonb; END IF;
  IF v_status != 'pending' THEN RETURN '{"success":false,"error":"ASSIGNMENT_NOT_PENDING"}'::jsonb; END IF;
  SELECT status INTO v_lead_status FROM leads WHERE id = v_lead_id;
  IF v_lead_status = 'accepted' THEN RETURN '{"success":false,"error":"LEAD_ALREADY_ACCEPTED"}'::jsonb; END IF;
  SELECT credits INTO v_credits FROM profiles WHERE id = p_artisan_id;
  IF v_credits < 1 THEN RETURN '{"success":false,"error":"INSUFFICIENT_CREDITS"}'::jsonb; END IF;
  v_new_balance := v_credits - 1;
  UPDATE profiles SET credits = v_new_balance, consecutive_missed_leads = 0, updated_at = NOW() WHERE id = p_artisan_id;
  INSERT INTO credit_transactions (artisan_id, type, amount, balance_after, lead_id) VALUES (p_artisan_id, 'lead_debit', -1, v_new_balance, v_lead_id);
  UPDATE lead_assignments SET status = 'accepted', responded_at = NOW() WHERE id = p_assignment_id;
  UPDATE lead_assignments SET status = 'expired' WHERE lead_id = v_lead_id AND id != p_assignment_id AND status = 'pending';
  UPDATE leads SET status = 'accepted', assigned_artisan_id = p_artisan_id, updated_at = NOW() WHERE id = v_lead_id;
  RETURN jsonb_build_object('success', true, 'lead_id', v_lead_id, 'new_balance', v_new_balance);
END; $$;

CREATE OR REPLACE FUNCTION expire_assignment(p_assignment_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_artisan_id UUID; v_status assignment_status; v_missed INTEGER; v_suspended BOOLEAN;
BEGIN
  SELECT artisan_id, status INTO v_artisan_id, v_status FROM lead_assignments WHERE id = p_assignment_id;
  IF v_artisan_id IS NULL THEN RETURN '{"success":false,"error":"ASSIGNMENT_NOT_FOUND"}'::jsonb; END IF;
  IF v_status != 'pending' THEN RETURN '{"success":true,"already_processed":true}'::jsonb; END IF;
  UPDATE lead_assignments SET status = 'expired', responded_at = NOW() WHERE id = p_assignment_id;
  UPDATE profiles SET consecutive_missed_leads = consecutive_missed_leads + 1,
    is_suspended = CASE WHEN consecutive_missed_leads + 1 >= 3 THEN true ELSE is_suspended END, updated_at = NOW()
  WHERE id = v_artisan_id RETURNING consecutive_missed_leads, is_suspended INTO v_missed, v_suspended;
  RETURN jsonb_build_object('success', true, 'consecutive_missed', v_missed, 'is_suspended', v_suspended);
END; $$;

CREATE OR REPLACE FUNCTION check_lead_status(p_lead_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_lead RECORD;
BEGIN
  SELECT id, status, assigned_artisan_id, cascade_count INTO v_lead FROM leads WHERE id = p_lead_id;
  IF v_lead.id IS NULL THEN RETURN '{"exists":false}'::jsonb; END IF;
  RETURN jsonb_build_object('exists', true, 'status', v_lead.status, 'is_accepted', v_lead.status = 'accepted', 'cascade_count', v_lead.cascade_count);
END; $$;

CREATE OR REPLACE FUNCTION get_lead_details(p_lead_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_lead RECORD;
BEGIN
  SELECT * INTO v_lead FROM leads WHERE id = p_lead_id;
  IF v_lead.id IS NULL THEN RETURN '{"error":"LEAD_NOT_FOUND"}'::jsonb; END IF;
  RETURN jsonb_build_object('id', v_lead.id, 'problem_type', v_lead.problem_type, 'description', v_lead.description,
    'client_phone', v_lead.client_phone, 'client_city', v_lead.client_city, 'status', v_lead.status);
END; $$;

-- Grants
GRANT EXECUTE ON FUNCTION find_available_artisan TO service_role;
GRANT EXECUTE ON FUNCTION create_assignment TO service_role;
GRANT EXECUTE ON FUNCTION accept_lead TO service_role;
GRANT EXECUTE ON FUNCTION expire_assignment TO service_role;
GRANT EXECUTE ON FUNCTION check_lead_status TO service_role;
GRANT EXECUTE ON FUNCTION get_lead_details TO service_role;

-- ============================================
-- FIN - TOUTES LES MIGRATIONS APPLIQUEES
-- ============================================
