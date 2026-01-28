-- Migration: Add artisan-specific fields to profiles
-- Story: 2.1 - Formulaire d'Inscription Artisan

-- Ajouter last_name (nom de famille)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Ajouter trade (metier)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trade TEXT;

-- Ajouter email (copie de auth.users.email pour queries simplifiees)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Index pour recherche par metier
CREATE INDEX IF NOT EXISTS idx_profiles_trade ON profiles(trade);

-- Commentaires pour documentation
COMMENT ON COLUMN profiles.last_name IS 'Nom de famille de l artisan';
COMMENT ON COLUMN profiles.trade IS 'Metier: plombier, electricien, serrurier, etc.';
COMMENT ON COLUMN profiles.email IS 'Email (copie de auth.users.email)';
