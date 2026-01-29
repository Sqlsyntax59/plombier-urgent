-- Epic 4: Fonctions RPC pour gestion cascade et attribution leads
-- Toutes les fonctions sont SECURITY DEFINER pour bypasser RLS

-- ============================================
-- 1. Trouver artisan disponible pour un lead
-- ============================================
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
  -- Recuperer coordonnees et vertical du lead
  SELECT latitude, longitude, vertical_id
  INTO v_lead_lat, v_lead_lng, v_vertical_id
  FROM leads
  WHERE id = p_lead_id;

  -- Utiliser vertical passe en param ou celui du lead
  IF p_vertical_id IS NOT NULL THEN
    v_vertical_id := p_vertical_id;
  END IF;

  RETURN QUERY
  SELECT
    p.id AS artisan_id,
    p.company_name AS artisan_name,
    p.telegram_chat_id,
    -- Calcul distance Haversine simplifie (km)
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
      ELSE 9999 -- Distance par defaut si coordonnees manquantes
    END AS distance_km
  FROM profiles p
  WHERE
    -- Artisan actif
    p.role = 'artisan'
    AND p.is_active = true
    AND p.is_suspended = false
    -- A des credits
    AND p.credits > 0
    -- A un telegram configure
    AND p.telegram_chat_id IS NOT NULL
    -- Meme vertical que le lead (si applicable)
    AND (v_vertical_id IS NULL OR p.vertical_id = v_vertical_id)
    -- N'a pas deja ete notifie pour ce lead
    AND NOT EXISTS (
      SELECT 1 FROM lead_assignments la
      WHERE la.lead_id = p_lead_id AND la.artisan_id = p.id
    )
  ORDER BY
    distance_km ASC,
    p.credits DESC -- Priorite aux artisans avec plus de credits
  LIMIT 1;
END;
$$;

COMMENT ON FUNCTION find_available_artisan IS 'Trouve le meilleur artisan disponible pour un lead (distance, credits, non suspendu)';

-- ============================================
-- 2. Creer une attribution de lead
-- ============================================
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
  -- Expiration dans 2 minutes
  v_expires_at := NOW() + INTERVAL '2 minutes';

  INSERT INTO lead_assignments (
    lead_id,
    artisan_id,
    cascade_order,
    status,
    notified_at,
    expires_at
  )
  VALUES (
    p_lead_id,
    p_artisan_id,
    p_cascade_order,
    'pending',
    NOW(),
    v_expires_at
  )
  RETURNING id INTO v_assignment_id;

  -- Mettre a jour le statut du lead
  UPDATE leads
  SET
    status = 'assigned',
    cascade_count = p_cascade_order,
    updated_at = NOW()
  WHERE id = p_lead_id;

  RETURN v_assignment_id;
END;
$$;

COMMENT ON FUNCTION create_assignment IS 'Cree une attribution de lead a un artisan avec expiration 2 min';

-- ============================================
-- 3. Accepter un lead (atomique)
-- ============================================
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
  v_lead_cost INTEGER := 1; -- Cout fixe par lead
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

  -- Verifier que le lead n'est pas deja accepte par un autre
  SELECT status INTO v_lead_status
  FROM leads
  WHERE id = v_lead_id;

  IF v_lead_status = 'accepted' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'LEAD_ALREADY_ACCEPTED',
      'message', 'Ce lead a deja ete accepte par un autre artisan'
    );
  END IF;

  -- Verifier credits artisan
  SELECT credits INTO v_artisan_credits
  FROM profiles
  WHERE id = p_artisan_id;

  IF v_artisan_credits < v_lead_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INSUFFICIENT_CREDITS',
      'message', 'Credits insuffisants'
    );
  END IF;

  -- === TRANSACTION ATOMIQUE ===

  -- 1. Debiter les credits
  v_new_balance := v_artisan_credits - v_lead_cost;

  UPDATE profiles
  SET
    credits = v_new_balance,
    consecutive_missed_leads = 0, -- Reset compteur
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

COMMENT ON FUNCTION accept_lead IS 'Accepte un lead de maniere atomique: debit credit + maj statuts';

-- ============================================
-- 4. Expirer une attribution
-- ============================================
CREATE OR REPLACE FUNCTION expire_assignment(
  p_assignment_id UUID
)
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
  -- Recuperer infos attribution
  SELECT artisan_id, lead_id, status
  INTO v_artisan_id, v_lead_id, v_assignment_status
  FROM lead_assignments
  WHERE id = p_assignment_id;

  IF v_artisan_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ASSIGNMENT_NOT_FOUND'
    );
  END IF;

  -- Ne rien faire si deja traite
  IF v_assignment_status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', true,
      'already_processed', true
    );
  END IF;

  -- Marquer comme expire
  UPDATE lead_assignments
  SET
    status = 'expired',
    responded_at = NOW()
  WHERE id = p_assignment_id;

  -- Incrementer compteur de leads manques
  UPDATE profiles
  SET
    consecutive_missed_leads = consecutive_missed_leads + 1,
    -- Suspendre apres 3 leads manques consecutifs
    is_suspended = CASE
      WHEN consecutive_missed_leads + 1 >= 3 THEN true
      ELSE is_suspended
    END,
    updated_at = NOW()
  WHERE id = v_artisan_id
  RETURNING consecutive_missed_leads, is_suspended
  INTO v_consecutive_missed, v_is_now_suspended;

  RETURN jsonb_build_object(
    'success', true,
    'artisan_id', v_artisan_id,
    'lead_id', v_lead_id,
    'consecutive_missed', v_consecutive_missed,
    'is_suspended', v_is_now_suspended
  );
END;
$$;

COMMENT ON FUNCTION expire_assignment IS 'Expire une attribution et incremente le compteur de leads manques';

-- ============================================
-- 5. Verifier statut lead (pour eviter double-clic)
-- ============================================
CREATE OR REPLACE FUNCTION check_lead_status(
  p_lead_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lead RECORD;
  v_assigned_artisan RECORD;
BEGIN
  SELECT id, status, assigned_artisan_id, cascade_count
  INTO v_lead
  FROM leads
  WHERE id = p_lead_id;

  IF v_lead.id IS NULL THEN
    RETURN jsonb_build_object(
      'exists', false,
      'error', 'LEAD_NOT_FOUND'
    );
  END IF;

  -- Si accepte, recuperer infos artisan
  IF v_lead.status = 'accepted' AND v_lead.assigned_artisan_id IS NOT NULL THEN
    SELECT company_name, phone
    INTO v_assigned_artisan
    FROM profiles
    WHERE id = v_lead.assigned_artisan_id;

    RETURN jsonb_build_object(
      'exists', true,
      'status', v_lead.status,
      'is_accepted', true,
      'assigned_artisan', jsonb_build_object(
        'id', v_lead.assigned_artisan_id,
        'name', v_assigned_artisan.company_name,
        'phone', v_assigned_artisan.phone
      ),
      'cascade_count', v_lead.cascade_count
    );
  END IF;

  RETURN jsonb_build_object(
    'exists', true,
    'status', v_lead.status,
    'is_accepted', false,
    'cascade_count', v_lead.cascade_count
  );
END;
$$;

COMMENT ON FUNCTION check_lead_status IS 'Verifie le statut actuel d''un lead';

-- ============================================
-- 6. Obtenir details lead pour notification
-- ============================================
CREATE OR REPLACE FUNCTION get_lead_details(
  p_lead_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_lead RECORD;
  v_vertical_name TEXT;
BEGIN
  SELECT *
  INTO v_lead
  FROM leads
  WHERE id = p_lead_id;

  IF v_lead.id IS NULL THEN
    RETURN jsonb_build_object('error', 'LEAD_NOT_FOUND');
  END IF;

  -- Recuperer nom du vertical
  IF v_lead.vertical_id IS NOT NULL THEN
    SELECT name INTO v_vertical_name
    FROM verticals
    WHERE id = v_lead.vertical_id;
  END IF;

  RETURN jsonb_build_object(
    'id', v_lead.id,
    'problem_type', v_lead.problem_type,
    'description', v_lead.description,
    'client_phone', v_lead.client_phone,
    'client_email', v_lead.client_email,
    'client_city', v_lead.client_city,
    'photo_url', v_lead.photo_url,
    'latitude', v_lead.latitude,
    'longitude', v_lead.longitude,
    'vertical_id', v_lead.vertical_id,
    'vertical_name', v_vertical_name,
    'status', v_lead.status,
    'cascade_count', v_lead.cascade_count,
    'created_at', v_lead.created_at
  );
END;
$$;

COMMENT ON FUNCTION get_lead_details IS 'Recupere les details complets d''un lead pour notification';

-- ============================================
-- Grants pour service_role
-- ============================================
GRANT EXECUTE ON FUNCTION find_available_artisan TO service_role;
GRANT EXECUTE ON FUNCTION create_assignment TO service_role;
GRANT EXECUTE ON FUNCTION accept_lead TO service_role;
GRANT EXECUTE ON FUNCTION expire_assignment TO service_role;
GRANT EXECUTE ON FUNCTION check_lead_status TO service_role;
GRANT EXECUTE ON FUNCTION get_lead_details TO service_role;
