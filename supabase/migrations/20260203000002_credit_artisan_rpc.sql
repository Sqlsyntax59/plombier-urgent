-- Migration: RPC atomique pour crediter un artisan
-- Resout: AUDIT #1 - RPC credit_artisan_simple n'existe pas

-- ============================================
-- 1. Contrainte CHECK pour empecher credits negatifs
-- ============================================
ALTER TABLE profiles
ADD CONSTRAINT profiles_credits_non_negative CHECK (credits >= 0);

-- ============================================
-- 2. RPC credit_artisan_simple (atomique avec transaction log)
-- ============================================
CREATE OR REPLACE FUNCTION credit_artisan_simple(
  p_artisan_id UUID,
  p_credits INTEGER,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_credits INTEGER;
  v_new_balance INTEGER;
  v_artisan_exists BOOLEAN;
BEGIN
  -- Verifier que l'artisan existe
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = p_artisan_id AND role = 'artisan'
  ) INTO v_artisan_exists;

  IF NOT v_artisan_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ARTISAN_NOT_FOUND',
      'message', 'Artisan non trouve'
    );
  END IF;

  -- Verifier credits positifs
  IF p_credits <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_CREDITS',
      'message', 'Le nombre de credits doit etre positif'
    );
  END IF;

  -- Mise a jour atomique avec RETURNING
  UPDATE profiles
  SET
    credits = credits + p_credits,
    updated_at = NOW()
  WHERE id = p_artisan_id
  RETURNING credits INTO v_new_balance;

  -- Calculer ancien solde pour le log
  v_current_credits := v_new_balance - p_credits;

  -- Enregistrer la transaction
  INSERT INTO credit_transactions (
    artisan_id,
    type,
    amount,
    balance_after,
    metadata
  )
  VALUES (
    p_artisan_id,
    'purchase',
    p_credits,
    v_new_balance,
    p_metadata
  );

  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', v_current_credits,
    'credits_added', p_credits,
    'new_balance', v_new_balance,
    'message', 'Credits ajoutes avec succes'
  );
END;
$$;

COMMENT ON FUNCTION credit_artisan_simple IS 'Ajoute des credits a un artisan de maniere atomique avec log transaction';

-- ============================================
-- 3. RPC pour remboursement atomique
-- ============================================
CREATE OR REPLACE FUNCTION refund_artisan_credits(
  p_artisan_id UUID,
  p_credits INTEGER,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_credits INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Lire credits actuels
  SELECT credits INTO v_current_credits
  FROM profiles
  WHERE id = p_artisan_id;

  IF v_current_credits IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ARTISAN_NOT_FOUND'
    );
  END IF;

  -- Calculer nouveau solde (minimum 0)
  v_new_balance := GREATEST(0, v_current_credits - p_credits);

  -- Mise a jour atomique
  UPDATE profiles
  SET
    credits = v_new_balance,
    updated_at = NOW()
  WHERE id = p_artisan_id;

  -- Enregistrer la transaction
  INSERT INTO credit_transactions (
    artisan_id,
    type,
    amount,
    balance_after,
    metadata
  )
  VALUES (
    p_artisan_id,
    'refund',
    -LEAST(p_credits, v_current_credits), -- Montant reel debite
    v_new_balance,
    p_metadata
  );

  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', v_current_credits,
    'credits_removed', LEAST(p_credits, v_current_credits),
    'new_balance', v_new_balance
  );
END;
$$;

COMMENT ON FUNCTION refund_artisan_credits IS 'Retire des credits lors d''un remboursement (min 0)';

-- ============================================
-- 4. Grants
-- ============================================
GRANT EXECUTE ON FUNCTION credit_artisan_simple TO service_role;
GRANT EXECUTE ON FUNCTION refund_artisan_credits TO service_role;
