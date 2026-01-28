-- Migration: Create credit_purchases table
-- Epic 6: Paiement & Credits (LemonSqueezy)
-- Suivi des achats de credits artisan

-- Enum pour statut achat
CREATE TYPE purchase_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Table credit_purchases
CREATE TABLE credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Infos LemonSqueezy
  lemonsqueezy_order_id TEXT UNIQUE,
  lemonsqueezy_product_id TEXT,
  lemonsqueezy_variant_id TEXT,
  lemonsqueezy_customer_id TEXT,

  -- Details achat
  pack_name TEXT NOT NULL,
  credits_purchased INTEGER NOT NULL CHECK (credits_purchased > 0),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT DEFAULT 'EUR',

  -- Statut
  status purchase_status DEFAULT 'pending',

  -- Webhooks tracking
  webhook_event_id TEXT,
  webhook_received_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Index performance
CREATE INDEX idx_credit_purchases_artisan ON credit_purchases(artisan_id);
CREATE INDEX idx_credit_purchases_status ON credit_purchases(status);
CREATE INDEX idx_credit_purchases_lemonsqueezy_order ON credit_purchases(lemonsqueezy_order_id);
CREATE INDEX idx_credit_purchases_created ON credit_purchases(created_at DESC);

-- RLS Policies
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;

-- Policy: Artisan peut voir ses propres achats
CREATE POLICY "Artisans can view own purchases"
  ON credit_purchases FOR SELECT
  USING (auth.uid() = artisan_id);

-- Policy: Insertion via service role uniquement (webhook)
CREATE POLICY "Service role can insert purchases"
  ON credit_purchases FOR INSERT
  WITH CHECK (true);

-- Policy: Update via service role uniquement (webhook)
CREATE POLICY "Service role can update purchases"
  ON credit_purchases FOR UPDATE
  USING (true);

-- Fonction pour crediter artisan (appelee par webhook)
CREATE OR REPLACE FUNCTION credit_artisan(
  p_artisan_id UUID,
  p_credits INTEGER,
  p_purchase_id UUID
)
RETURNS void AS $$
BEGIN
  -- Ajouter credits au profil
  UPDATE profiles
  SET credits = credits + p_credits,
      updated_at = now()
  WHERE id = p_artisan_id;

  -- Marquer achat complete
  UPDATE credit_purchases
  SET status = 'completed',
      completed_at = now()
  WHERE id = p_purchase_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Vue statistiques achats (pour admin)
CREATE VIEW credit_purchase_stats AS
SELECT
  DATE_TRUNC('day', created_at) as day,
  COUNT(*) as total_purchases,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN status = 'completed' THEN credits_purchased ELSE 0 END) as total_credits,
  SUM(CASE WHEN status = 'completed' THEN amount_cents ELSE 0 END) as total_revenue_cents
FROM credit_purchases
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY day DESC;
