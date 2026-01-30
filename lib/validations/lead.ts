import { z } from "zod";

// Types de pannes disponibles
export const PROBLEM_TYPES = [
  { value: "fuite", label: "Fuite d'eau", emoji: "💧" },
  { value: "wc_bouche", label: "WC bouché", emoji: "🚽" },
  { value: "ballon_eau_chaude", label: "Ballon d'eau chaude", emoji: "🔥" },
  { value: "canalisation", label: "Canalisation", emoji: "🚿" },
  { value: "robinetterie", label: "Robinetterie", emoji: "🔧" },
  { value: "autre", label: "Autre", emoji: "❓" },
] as const;

export const problemTypeValues = PROBLEM_TYPES.map((t) => t.value) as [
  string,
  ...string[],
];

// Schema pour l'etape 1 : Selection type de panne
export const leadStep1Schema = z.object({
  problemType: z.enum(problemTypeValues, {
    message: "Veuillez selectionner un type de probleme",
  }),
});

export type LeadStep1Input = z.infer<typeof leadStep1Schema>;

// Schema pour l'etape 2 : Description et photo + réponses guidées
export const leadStep2Schema = z.object({
  description: z
    .string()
    .min(10, "La description doit contenir au moins 10 caracteres")
    .max(500, "La description ne peut pas depasser 500 caracteres"),
  photoUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  guidedAnswers: z.record(z.string(), z.union([z.string(), z.boolean()])).optional(),
});

export type LeadStep2Input = z.infer<typeof leadStep2Schema>;

// Schema pour l'etape 3 : Coordonnees client
export const leadStep3Schema = z.object({
  clientPhone: z
    .string()
    .regex(
      /^(?:(?:\+|00)33|0)\s*[67](?:[\s.-]*\d{2}){4}$/,
      "Numero de telephone invalide (format mobile francais 06/07 attendu)"
    ),
  clientEmail: z
    .string()
    .email("Adresse email invalide")
    .optional()
    .or(z.literal("")),
  clientCity: z
    .string()
    .min(2, "La ville doit contenir au moins 2 caracteres")
    .max(100, "La ville ne peut pas depasser 100 caracteres")
    .optional()
    .or(z.literal("")),
});

export type LeadStep3Input = z.infer<typeof leadStep3Schema>;

// Schema complet pour soumission du lead
export const leadSubmitSchema = leadStep1Schema
  .merge(leadStep2Schema)
  .merge(leadStep3Schema);

export type LeadSubmitInput = z.infer<typeof leadSubmitSchema>;

// Fourchettes de prix indicatives (donnees cote client pour affichage immediat)
// Ces valeurs sont synchronisees avec la table price_ranges en base
export const PRICE_RANGES: Record<string, { min: number; max: number }> = {
  fuite: { min: 90, max: 150 },
  wc_bouche: { min: 80, max: 130 },
  ballon_eau_chaude: { min: 150, max: 350 },
  canalisation: { min: 120, max: 250 },
  robinetterie: { min: 60, max: 120 },
  autre: { min: 80, max: 200 },
};

// === QUESTIONS GUIDEES PAR TYPE DE PANNE ===

export type GuidedQuestion = {
  id: string;
  label: string;
  type: "select" | "boolean";
  options?: string[];
  urgentIf?: boolean; // Si true et réponse = true → urgence
  urgencyReason?: string;
};

export const GUIDED_QUESTIONS: Record<string, GuidedQuestion[]> = {
  fuite: [
    {
      id: "location",
      label: "Où se situe la fuite ?",
      type: "select",
      options: ["Sous évier/lavabo", "WC/chasse d'eau", "Salle de bain", "Chauffe-eau", "Tuyau apparent", "Ne sais pas"],
    },
    {
      id: "continuous",
      label: "L'eau coule-t-elle en continu ?",
      type: "boolean",
      urgentIf: true,
      urgencyReason: "Fuite continue non maîtrisée",
    },
    {
      id: "shutoff",
      label: "Avez-vous coupé l'arrivée d'eau ?",
      type: "boolean",
    },
  ],
  wc_bouche: [
    {
      id: "overflow",
      label: "L'eau remonte-t-elle ou déborde ?",
      type: "boolean",
      urgentIf: true,
      urgencyReason: "WC qui déborde",
    },
    {
      id: "tried_plunger",
      label: "Avez-vous essayé une ventouse ?",
      type: "boolean",
    },
    {
      id: "other_wc",
      label: "Avez-vous d'autres WC disponibles ?",
      type: "boolean",
    },
  ],
  ballon_eau_chaude: [
    {
      id: "symptom",
      label: "Quel est le problème ?",
      type: "select",
      options: ["Plus d'eau chaude", "Eau tiède seulement", "Fuite sur le ballon", "Bruit anormal", "Autre"],
    },
    {
      id: "leak",
      label: "Y a-t-il une fuite visible ?",
      type: "boolean",
      urgentIf: true,
      urgencyReason: "Fuite sur ballon d'eau chaude",
    },
    {
      id: "age",
      label: "Le ballon a-t-il plus de 10 ans ?",
      type: "boolean",
    },
  ],
  canalisation: [
    {
      id: "symptom",
      label: "Quel est le problème ?",
      type: "select",
      options: ["Eau stagnante", "Mauvaises odeurs", "Écoulement lent", "Bouchon total", "Autre"],
    },
    {
      id: "total_block",
      label: "L'écoulement est-il totalement bloqué ?",
      type: "boolean",
      urgentIf: true,
      urgencyReason: "Canalisation totalement bouchée",
    },
    {
      id: "multiple",
      label: "Plusieurs évacuations sont-elles touchées ?",
      type: "boolean",
    },
  ],
  robinetterie: [
    {
      id: "symptom",
      label: "Quel est le problème ?",
      type: "select",
      options: ["Fuite au robinet", "Robinet bloqué", "Goutte à goutte", "Pression faible", "Autre"],
    },
    {
      id: "shutoff_possible",
      label: "Pouvez-vous couper l'eau à ce robinet ?",
      type: "boolean",
    },
  ],
  autre: [
    {
      id: "category",
      label: "Ça concerne plutôt :",
      type: "select",
      options: ["Fuite/eau", "Évacuation/bouchon", "Robinet/mitigeur", "Chauffe-eau", "Autre"],
    },
    {
      id: "urgent_feeling",
      label: "Estimez-vous que c'est urgent ?",
      type: "boolean",
      urgentIf: true,
      urgencyReason: "Urgence signalée par le client",
    },
  ],
};

// === TYPES POUR LES REPONSES GUIDEES ===

export type GuidedAnswers = Record<string, string | boolean>;

export type UrgencyResult = {
  isUrgent: boolean;
  reason: string | null;
};

// === FONCTIONS UTILITAIRES ===

/**
 * Détermine si la demande est urgente selon les réponses guidées
 */
export function checkUrgency(problemType: string, answers: GuidedAnswers): UrgencyResult {
  const questions = GUIDED_QUESTIONS[problemType] || [];

  for (const q of questions) {
    if (q.urgentIf !== undefined && answers[q.id] === q.urgentIf) {
      return { isUrgent: true, reason: q.urgencyReason || "Urgence détectée" };
    }
  }

  return { isUrgent: false, reason: null };
}

/**
 * Génère une synthèse terrain lisible pour l'artisan
 */
export function generateFieldSummary(
  problemType: string,
  answers: GuidedAnswers,
  description: string
): string {
  const questions = GUIDED_QUESTIONS[problemType] || [];
  const problemLabel = PROBLEM_TYPES.find(t => t.value === problemType)?.label || problemType;

  const parts: string[] = [`📍 ${problemLabel}`];

  for (const q of questions) {
    const answer = answers[q.id];
    if (answer === undefined || answer === "") continue;

    if (q.type === "boolean") {
      parts.push(`• ${q.label} ${answer ? "✓ Oui" : "✗ Non"}`);
    } else if (q.type === "select" && typeof answer === "string") {
      parts.push(`• ${q.label.replace(" ?", "")} : ${answer}`);
    }
  }

  if (description && description.trim().length > 0) {
    parts.push(`\n💬 "${description.trim()}"`);
  }

  return parts.join("\n");
}

// Schema pour les réponses guidées (validation souple)
export const guidedAnswersSchema = z.record(z.string(), z.union([z.string(), z.boolean()])).optional();
