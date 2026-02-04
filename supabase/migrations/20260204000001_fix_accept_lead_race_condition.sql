-- Fix race condition dans accept_lead()
-- Ajout de FOR UPDATE pour verrouiller le lead pendant la transaction

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
  -- Verifier que l'attribution existe et appartient a l'artisan
  SELECT la.lead_id, la.status
  INTO v_lead_id, v_assignment_status
  FROM lead_assignments la
  WHERE la.id = p_assignment_id AND la.artisan_id = p_artisan_id;

  IF v_lead_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ASSIGNMENT_NOT_FOUND',
      'message', 'Attribution non trouvee ou non autorisee'
    );
  END IF;

  -- Verifier que l'attribution est encore pending
  IF v_assignment_status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ASSIGNMENT_NOT_PENDING',
      'message', 'Cette attribution a deja ete traitee'
    );
  END IF;

  -- ====================================
  -- FIX RACE CONDITION: Lock le lead avec FOR UPDATE
  -- Cela bloque les autres transactions qui tentent de lire/modifier ce lead
  -- ====================================
  SELECT status INTO v_lead_status
  FROM leads
  WHERE id = v_lead_id
  FOR UPDATE; -- LOCK EXCLUSIF sur la ligne

  IF v_lead_status = 'accepted' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'LEAD_ALREADY_ACCEPTED',
      'message', 'Ce lead a deja ete accepte par un autre artisan'
    );
  END IF;

  -- Verifier credits artisan (aussi avec FOR UPDATE pour eviter double-debit)
  SELECT credits INTO v_artisan_credits
  FROM profiles
  WHERE id = p_artisan_id
  FOR UPDATE;

  IF v_artisan_credits < v_lead_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INSUFFICIENT_CREDITS',
      'message', 'Credits insuffisants'
    );
  END IF;

  -- === TRANSACTION ATOMIQUE (le lock est deja acquis) ===

  -- 1. Debiter les credits
  v_new_balance := v_artisan_credits - v_lead_cost;

  UPDATE profiles
  SET
    credits = v_new_balance,
    consecutive_missed_leads = 0,
    updated_at = NOW()
  WHERE id = p_artisan_id;

  -- 2. Enregistrer la transaction
  INSERT INTO credit_transactions (
    artisan_id,
    type,
    amount,
    balance_after,
    lead_id,
    metadata
  )
  VALUES (
    p_artisan_id,
    'lead_debit',
    -v_lead_cost,
    v_new_balance,
    v_lead_id,
    jsonb_build_object('assignment_id', p_assignment_id)
  );

  -- 3. Marquer l'attribution comme acceptee
  UPDATE lead_assignments
  SET
    status = 'accepted',
    responded_at = NOW()
  WHERE id = p_assignment_id;

  -- 4. Marquer les autres attributions comme expirees
  UPDATE lead_assignments
  SET status = 'expired'
  WHERE lead_id = v_lead_id
    AND id != p_assignment_id
    AND status = 'pending';

  -- 5. Mettre a jour le lead
  UPDATE leads
  SET
    status = 'accepted',
    assigned_artisan_id = p_artisan_id,
    updated_at = NOW()
  WHERE id = v_lead_id;

  RETURN jsonb_build_object(
    'success', true,
    'lead_id', v_lead_id,
    'new_balance', v_new_balance,
    'message', 'Lead accepte avec succes'
  );
END;
$$;

COMMENT ON FUNCTION accept_lead IS 'Accepte un lead de maniere atomique avec lock FOR UPDATE pour eviter race condition';
