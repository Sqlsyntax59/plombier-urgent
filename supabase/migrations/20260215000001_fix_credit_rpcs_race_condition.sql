-- Migration: Fix race condition sur refund_artisan_credits + drop legacy credit_artisan
-- Issue #6 (P1): SELECT sans FOR UPDATE puis UPDATE avec valeur calculee

-- ============================================
-- 1. Fix refund_artisan_credits() — pattern atomique
-- ============================================
-- AVANT: SELECT credits (sans lock) → calcul PL/pgSQL → UPDATE valeur fixe
-- APRES: SELECT FOR UPDATE → calcul → UPDATE
-- NOTE: "refund" = retrait de credits artisan apres remboursement client LemonSqueezy
--       (le solde BAISSE — c'est un clawback, pas un credit)

CREATE OR REPLACE FUNCTION refund_artisan_credits(
  p_artisan_id UUID,
  p_credits INTEGER,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_credits INTEGER;
  v_new_balance INTEGER;
  v_actual_refund INTEGER;
BEGIN
  IF p_credits IS NULL OR p_credits <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_CREDITS'
    );
  END IF;

  -- Lock la ligne pour eviter race condition
  SELECT credits INTO v_current_credits
  FROM profiles
  WHERE id = p_artisan_id
  FOR UPDATE;

  IF v_current_credits IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ARTISAN_NOT_FOUND'
    );
  END IF;

  -- Calcul avec plancher a 0
  v_actual_refund := LEAST(p_credits, v_current_credits);
  v_new_balance := v_current_credits - v_actual_refund;

  -- Update atomique (lock deja acquis)
  UPDATE profiles
  SET credits = v_new_balance,
      updated_at = NOW()
  WHERE id = p_artisan_id;

  -- Log transaction
  INSERT INTO credit_transactions (
    artisan_id, type, amount, balance_after, metadata
  )
  VALUES (
    p_artisan_id, 'refund', -v_actual_refund, v_new_balance, p_metadata
  );

  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', v_current_credits,
    'credits_removed', v_actual_refund,
    'new_balance', v_new_balance
  );
END;
$$;

-- ============================================
-- 2. Drop legacy credit_artisan() — 0 usage cote TS
-- ============================================
-- Pas de log transaction, pas d'idempotence, pas de FOR UPDATE.
-- Remplacee par credit_artisan_simple() depuis migration 20260203000002.
DROP FUNCTION IF EXISTS credit_artisan(UUID, INTEGER, UUID);
