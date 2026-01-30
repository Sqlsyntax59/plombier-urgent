-- Migration: Ajouter field_summary pour stocker la synthèse terrain
-- Story: Descriptif Guidé (FR6.1-FR6.6)

-- Ajout de la colonne field_summary à la table leads
ALTER TABLE leads
ADD COLUMN field_summary TEXT;

-- Commentaire explicatif
COMMENT ON COLUMN leads.field_summary IS 'Synthèse terrain générée automatiquement à partir des réponses guidées';
