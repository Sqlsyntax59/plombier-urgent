export type LeadQuality = "low" | "medium" | "high" | "premium";

export interface ScoreInput {
  problemType: string;
  description: string;
  photoUrl: string | null;
  isUrgent: boolean;
  isGeocoded: boolean;
}

export interface ScoringFactors {
  base: number;
  urgency: number;
  photo: number;
  geocoded: number;
  description: number;
}

export interface ScoreResult {
  score: number;
  quality: LeadQuality;
  factors: ScoringFactors;
}

/**
 * Calcule le score qualité d'un lead (0-100).
 *
 * Barème :
 *  +30 base
 *  +25 urgence (fuite active, inondation)
 *  +15 photo fournie
 *  +10 adresse géocodée
 *  +5  description > 100 chars
 *  -30 description < 20 chars
 */
export function calculateLeadScore(input: ScoreInput): ScoreResult {
  const descLength = (input.description || "").length;

  const factors: ScoringFactors = {
    base: 30,
    urgency: input.isUrgent ? 25 : 0,
    photo: input.photoUrl ? 15 : 0,
    geocoded: input.isGeocoded ? 10 : 0,
    description: descLength > 100 ? 5 : descLength < 20 ? -30 : 0,
  };

  const raw = factors.base + factors.urgency + factors.photo + factors.geocoded + factors.description;
  const score = Math.max(0, Math.min(100, raw));

  let quality: LeadQuality;
  if (score >= 90) quality = "premium";
  else if (score >= 70) quality = "high";
  else if (score >= 40) quality = "medium";
  else quality = "low";

  return { score, quality, factors };
}
