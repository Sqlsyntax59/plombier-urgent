import { z } from "zod";

// Metiers disponibles (MVP - vertical plombier)
export const TRADES = [
  { value: "plombier", label: "Plombier" },
  { value: "plombier-chauffagiste", label: "Plombier-Chauffagiste" },
] as const;

export const tradeValues = TRADES.map((t) => t.value) as [string, ...string[]];

// Schema d'inscription artisan
export const artisanSignUpSchema = z.object({
  firstName: z
    .string()
    .min(2, "Le prenom doit contenir au moins 2 caracteres")
    .max(50, "Le prenom ne peut pas depasser 50 caracteres"),
  lastName: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caracteres")
    .max(50, "Le nom ne peut pas depasser 50 caracteres"),
  email: z.string().email("Adresse email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre"
    ),
  phone: z
    .string()
    .regex(
      /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
      "Numero de telephone invalide (format francais attendu)"
    ),
  city: z
    .string()
    .min(2, "La ville doit contenir au moins 2 caracteres")
    .max(100, "La ville ne peut pas depasser 100 caracteres"),
  trade: z.enum(tradeValues, {
    message: "Veuillez selectionner un metier",
  }),
  acceptCgv: z
    .boolean()
    .refine((val) => val === true, {
      message: "Vous devez accepter les CGV pour vous inscrire",
    }),
});

export type ArtisanSignUpInput = z.infer<typeof artisanSignUpSchema>;

// Schema pour mise a jour profil (tous les champs optionnels sauf id)
export const artisanUpdateSchema = artisanSignUpSchema
  .omit({ email: true, password: true })
  .partial();

export type ArtisanUpdateInput = z.infer<typeof artisanUpdateSchema>;

// Schema pour configuration WhatsApp
export const whatsappConfigSchema = z.object({
  whatsappPhone: z
    .string()
    .regex(
      /^(?:(?:\+|00)33|0)\s*[67](?:[\s.-]*\d{2}){4}$/,
      "Numero WhatsApp invalide (format mobile francais 06/07 attendu)"
    ),
});

export type WhatsAppConfigInput = z.infer<typeof whatsappConfigSchema>;

// Schema pour connexion avec mot de passe
export const loginPasswordSchema = z.object({
  email: z.string().email("Adresse email invalide"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export type LoginPasswordInput = z.infer<typeof loginPasswordSchema>;

// Schema pour magic link
export const magicLinkSchema = z.object({
  email: z.string().email("Adresse email invalide"),
});

export type MagicLinkInput = z.infer<typeof magicLinkSchema>;
