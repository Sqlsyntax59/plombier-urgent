-- Epic 4: Champs supplementaires pour gestion cascade

-- Champs sur profiles pour suspension automatique
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS consecutive_missed_leads INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

-- Index pour filtrer artisans actifs
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON profiles(is_suspended)
  WHERE is_suspended = false;

CREATE INDEX IF NOT EXISTS idx_profiles_telegram ON profiles(telegram_chat_id)
  WHERE telegram_chat_id IS NOT NULL;

-- Commentaires
COMMENT ON COLUMN profiles.consecutive_missed_leads IS 'Nombre de leads manques consecutifs (reset a 0 apres acceptation)';
COMMENT ON COLUMN profiles.is_suspended IS 'Compte suspendu automatiquement apres 3 leads manques';
COMMENT ON COLUMN profiles.telegram_chat_id IS 'Chat ID Telegram pour notifications (depuis @userinfobot)';

-- Champs sur leads pour artisan attribue
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS assigned_artisan_id UUID REFERENCES profiles(id);

CREATE INDEX IF NOT EXISTS idx_leads_assigned_artisan ON leads(assigned_artisan_id)
  WHERE assigned_artisan_id IS NOT NULL;

COMMENT ON COLUMN leads.assigned_artisan_id IS 'Artisan qui a accepte ce lead';
