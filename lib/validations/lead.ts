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

// Schema pour l'etape 2 : Description et photo
export const leadStep2Schema = z.object({
  description: z
    .string()
    .min(10, "La description doit contenir au moins 10 caracteres")
    .max(500, "La description ne peut pas depasser 500 caracteres"),
  photoUrl: z.string().url("URL invalide").optional().or(z.literal("")),
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
