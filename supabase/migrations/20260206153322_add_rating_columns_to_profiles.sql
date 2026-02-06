-- Ajouter colonnes rating manquantes sur profiles (partiellement appliquees depuis migration 20260128000010)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(2,1) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
