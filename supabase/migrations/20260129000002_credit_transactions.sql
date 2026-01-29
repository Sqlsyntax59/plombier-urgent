-- Epic 4: Table des transactions de credits
-- Audit complet de tous les mouvements de credits artisan

-- Types de transactions
CREATE TYPE credit_transaction_type AS ENUM (
  'purchase',     -- Achat de pack credits
  'lead_debit',   -- Debit pour lead accepte
  'refund',       -- Remboursement
  'bonus',        -- Credit bonus admin
  'initial'       -- Credits initiaux inscription
);

-- Table des transactions
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Artisan concerne
  artisan_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Type et montant
  type credit_transaction_type NOT NULL,
  amount INTEGER NOT NULL, -- Positif = credit, Negatif = debit

  -- Solde apres transaction
  balance_after INTEGER NOT NULL,

  -- Reference lead si applicable
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,

  -- Metadata (reference facture, raison admin, etc.)
  metadata JSONB DEFAULT '{}',

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour queries frequentes
CREATE INDEX idx_credit_transactions_artisan ON credit_transactions(artisan_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX idx_credit_transactions_created ON credit_transactions(created_at DESC);
CREATE INDEX idx_credit_transactions_lead ON credit_transactions(lead_id)
  WHERE lead_id IS NOT NULL;

-- Commentaires
COMMENT ON TABLE credit_transactions IS 'Historique complet des mouvements de credits';
COMMENT ON COLUMN credit_transactions.amount IS 'Montant: positif=credit, negatif=debit';
COMMENT ON COLUMN credit_transactions.balance_after IS 'Solde artisan apres cette transaction';
COMMENT ON COLUMN credit_transactions.metadata IS 'Donnees supplementaires (facture, raison, etc.)';

-- RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Artisans peuvent voir leur historique
CREATE POLICY "Artisans can view own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = artisan_id);

-- Service role peut tout faire
CREATE POLICY "Service role full access"
  ON credit_transactions FOR ALL
  USING (auth.role() = 'service_role');
