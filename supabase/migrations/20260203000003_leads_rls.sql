-- Migration: RLS sur table leads
-- Resout: AUDIT #4 - Pas de RLS sur la table leads (donnees clients exposees)

-- ============================================
-- 1. Activer RLS
-- ============================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Supprimer policies existantes sur leads si elles existent
DROP POLICY IF EXISTS "Admins full access on leads" ON leads;
DROP POLICY IF EXISTS "Artisans can view assigned leads" ON leads;
DROP POLICY IF EXISTS "Service role full access on leads" ON leads;
DROP POLICY IF EXISTS "Public can insert leads" ON leads;

-- ============================================
-- 2. Policy: Admins ont acces complet
-- ============================================
CREATE POLICY "Admins full access on leads"
  ON leads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 3. Policy: Artisans peuvent voir leurs leads assignes
-- ============================================
CREATE POLICY "Artisans can view assigned leads"
  ON leads FOR SELECT
  USING (
    -- Lead directement assigne a l'artisan
    assigned_artisan_id = auth.uid()
    OR
    -- Lead pour lequel l'artisan a un assignment (meme pending)
    EXISTS (
      SELECT 1 FROM lead_assignments
      WHERE lead_assignments.lead_id = leads.id
      AND lead_assignments.artisan_id = auth.uid()
    )
  );

-- ============================================
-- 4. Policy: Service role acces complet (webhooks, API internes)
-- Note: service_role bypass RLS par defaut, mais on l'explicite
-- ============================================
CREATE POLICY "Service role full access on leads"
  ON leads FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================
-- 5. Policy: Insertion publique pour formulaire client
-- Les clients non authentifies peuvent soumettre des leads
-- ============================================
CREATE POLICY "Public can insert leads"
  ON leads FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 6. Commentaires
-- ============================================
COMMENT ON POLICY "Admins full access on leads" ON leads IS
  'Les admins peuvent voir et modifier tous les leads';

COMMENT ON POLICY "Artisans can view assigned leads" ON leads IS
  'Les artisans ne voient que les leads qui leur sont assignes ou pour lesquels ils ont un assignment';

COMMENT ON POLICY "Service role full access on leads" ON leads IS
  'Service role pour webhooks n8n et API internes';

COMMENT ON POLICY "Public can insert leads" ON leads IS
  'Permet aux clients non authentifies de soumettre des demandes';

-- ============================================
-- 7. RLS sur lead_assignments
-- ============================================
ALTER TABLE lead_assignments ENABLE ROW LEVEL SECURITY;

-- Supprimer policies existantes si elles existent
DROP POLICY IF EXISTS "Admins full access on lead_assignments" ON lead_assignments;
DROP POLICY IF EXISTS "Artisans can view own assignments" ON lead_assignments;
DROP POLICY IF EXISTS "Artisans can update own assignments" ON lead_assignments;
DROP POLICY IF EXISTS "Service role full access on lead_assignments" ON lead_assignments;

-- Admins acces complet
CREATE POLICY "Admins full access on lead_assignments"
  ON lead_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Artisans voient leurs propres assignments
CREATE POLICY "Artisans can view own assignments"
  ON lead_assignments FOR SELECT
  USING (artisan_id = auth.uid());

-- Artisans peuvent mettre a jour leurs assignments (accepter/refuser)
CREATE POLICY "Artisans can update own assignments"
  ON lead_assignments FOR UPDATE
  USING (artisan_id = auth.uid())
  WITH CHECK (artisan_id = auth.uid());

-- Service role acces complet
CREATE POLICY "Service role full access on lead_assignments"
  ON lead_assignments FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
