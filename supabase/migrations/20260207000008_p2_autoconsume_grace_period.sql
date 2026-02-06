-- P2: Auto-consommation leads + Période de grâce
-- Leads accepted > 7 jours → completed automatiquement
-- Annulation possible dans les 30 min avec remboursement crédit

-- 1. Ajouter 'cancelled' à l'enum assignment_status
ALTER TYPE assignment_status ADD VALUE IF NOT EXISTS 'cancelled';

-- 2. Colonne pour période de grâce
ALTER TABLE lead_assignments
  ADD COLUMN IF NOT EXISTS grace_period_expires_at TIMESTAMPTZ;

COMMENT ON COLUMN lead_assignments.grace_period_expires_at
  IS 'Fin de la période de grâce (30 min après acceptation)';

-- 2. Mettre à jour accept_lead pour inclure grace_period
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
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ASSIGNMENT_NOT_FOUND',
      'message', 'Attribution non trouvee ou non autorisee'
    );
  END IF;

  IF v_assignment_status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ASSIGNMENT_NOT_PENDING',
      'message', 'Cette attribution a deja ete traitee'
    );
  END IF;

  -- Lock FOR UPDATE (race condition fix)
  SELECT status INTO v_lead_status
  FROM leads
  WHERE id = v_lead_id
  FOR UPDATE;

  IF v_lead_status = 'accepted' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'LEAD_ALREADY_ACCEPTED',
      'message', 'Ce lead a deja ete accepte par un autre artisan'
    );
  END IF;

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

  v_new_balance := v_artisan_credits - v_lead_cost;

  UPDATE profiles
  SET credits = v_new_balance, consecutive_missed_leads = 0, updated_at = NOW()
  WHERE id = p_artisan_id;

  INSERT INTO credit_transactions (artisan_id, type, amount, balance_after, lead_id, metadata)
  VALUES (p_artisan_id, 'lead_debit', -v_lead_cost, v_new_balance, v_lead_id,
          jsonb_build_object('assignment_id', p_assignment_id));

  -- Acceptation avec période de grâce 30 min
  UPDATE lead_assignments
  SET status = 'accepted',
      responded_at = NOW(),
      grace_period_expires_at = NOW() + INTERVAL '30 minutes'
  WHERE id = p_assignment_id;

  UPDATE lead_assignments
  SET status = 'expired'
  WHERE lead_id = v_lead_id AND id != p_assignment_id AND status = 'pending';

  UPDATE leads
  SET status = 'accepted', assigned_artisan_id = p_artisan_id, updated_at = NOW()
  WHERE id = v_lead_id;

  RETURN jsonb_build_object(
    'success', true,
    'lead_id', v_lead_id,
    'new_balance', v_new_balance,
    'grace_period_expires_at', (NOW() + INTERVAL '30 minutes')::TEXT,
    'message', 'Lead accepte avec succes'
  );
END;
$$;

-- 3. RPC: Annuler un lead pendant la période de grâce (remboursement)
CREATE OR REPLACE FUNCTION cancel_lead_acceptance(
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
  v_grace_expires TIMESTAMPTZ;
  v_artisan_credits INTEGER;
  v_new_balance INTEGER;
  v_lead_cost INTEGER := 1;
BEGIN
  -- Vérifier l'attribution
  SELECT la.lead_id, la.status, la.grace_period_expires_at
  INTO v_lead_id, v_assignment_status, v_grace_expires
  FROM lead_assignments la
  WHERE la.id = p_assignment_id AND la.artisan_id = p_artisan_id;

  IF v_lead_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ASSIGNMENT_NOT_FOUND',
      'message', 'Attribution non trouvee');
  END IF;

  IF v_assignment_status != 'accepted' THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_ACCEPTED',
      'message', 'Ce lead n''est pas en statut accepte');
  END IF;

  -- Vérifier période de grâce
  IF v_grace_expires IS NULL OR NOW() > v_grace_expires THEN
    RETURN jsonb_build_object('success', false, 'error', 'GRACE_PERIOD_EXPIRED',
      'message', 'La periode de grace de 30 minutes est expiree');
  END IF;

  -- Lock lead
  SELECT status INTO v_assignment_status FROM leads WHERE id = v_lead_id FOR UPDATE;

  -- Rembourser le crédit
  SELECT credits INTO v_artisan_credits FROM profiles WHERE id = p_artisan_id FOR UPDATE;
  v_new_balance := v_artisan_credits + v_lead_cost;

  UPDATE profiles SET credits = v_new_balance, updated_at = NOW() WHERE id = p_artisan_id;

  INSERT INTO credit_transactions (artisan_id, type, amount, balance_after, lead_id, metadata)
  VALUES (p_artisan_id, 'refund', v_lead_cost, v_new_balance, v_lead_id,
          jsonb_build_object('assignment_id', p_assignment_id, 'reason', 'grace_period_cancel'));

  -- Remettre le lead en pending
  UPDATE lead_assignments SET status = 'cancelled' WHERE id = p_assignment_id;
  UPDATE leads SET status = 'pending', assigned_artisan_id = NULL, updated_at = NOW() WHERE id = v_lead_id;

  RETURN jsonb_build_object(
    'success', true,
    'lead_id', v_lead_id,
    'new_balance', v_new_balance,
    'message', 'Lead annule, credit rembourse'
  );
END;
$$;

-- 4. RPC: Auto-consommation des leads stagnants (accepted > 7 jours → completed)
CREATE OR REPLACE FUNCTION auto_consume_stale_leads()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  WITH consumed AS (
    UPDATE leads
    SET status = 'completed', updated_at = NOW()
    WHERE status = 'accepted'
      AND updated_at < NOW() - INTERVAL '7 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_count FROM consumed;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION cancel_lead_acceptance IS 'Annule un lead accepte pendant la periode de grace (30 min) et rembourse le credit';
COMMENT ON FUNCTION auto_consume_stale_leads IS 'Marque les leads accepted depuis plus de 7 jours comme completed';
