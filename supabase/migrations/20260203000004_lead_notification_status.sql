-- Migration: Statut notification pour leads
-- Resout: AUDIT #6 - Leads orphelins (workflow n8n echoue silencieusement)

-- ============================================
-- 1. Type enum pour statut notification
-- ============================================
CREATE TYPE notification_status AS ENUM (
  'pending',      -- En attente d'envoi
  'sent',         -- Workflow declenche avec succes
  'failed',       -- Echec envoi (a retenter)
  'retrying'      -- Retry en cours
);

-- ============================================
-- 2. Ajouter colonne a la table leads
-- ============================================
ALTER TABLE leads
  ADD COLUMN notification_status notification_status DEFAULT 'pending',
  ADD COLUMN notification_error TEXT,
  ADD COLUMN notification_attempts INTEGER DEFAULT 0,
  ADD COLUMN notification_last_attempt TIMESTAMP WITH TIME ZONE;

-- ============================================
-- 3. Index pour trouver les leads a retenter
-- ============================================
CREATE INDEX idx_leads_notification_failed ON leads(notification_status)
  WHERE notification_status = 'failed';

-- ============================================
-- 4. Commentaires
-- ============================================
COMMENT ON COLUMN leads.notification_status IS 'Statut du declenchement workflow n8n';
COMMENT ON COLUMN leads.notification_error IS 'Message erreur si echec';
COMMENT ON COLUMN leads.notification_attempts IS 'Nombre de tentatives d''envoi';
COMMENT ON COLUMN leads.notification_last_attempt IS 'Date derniere tentative';
