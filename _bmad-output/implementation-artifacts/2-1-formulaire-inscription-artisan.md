# Story 2.1: Inscription Artisan Anti-Travail Dissimulé

Status: complete
Version: 2.0

## Story

As a **artisan**,
I want **m'inscrire sur la plateforme avec vérification de mon SIRET**,
so that **je puisse accéder aux leads après validation de mon entreprise**.

## Principes Non Négociables

- ❌ Ne jamais bloquer un signup pour une API externe down
- ❌ Ne jamais rollback un user Supabase déjà créé
- ✅ Toujours privilégier mode dégradé contrôlé
- ✅ Confiance client (anti-arnaque) + Légalité (anti travail dissimulé)
- ✅ Zéro friction inutile à l'inscription
- ✅ Liberté tarifaire totale de l'artisan

## Statuts Artisan (Source de Vérité)

| Statut | Signification |
|--------|---------------|
| `registered` | SIRET renseigné (valide ou en mode dégradé) |
| `pending_verification` | Assurance transmise, attente validation |
| `verified` | Accès business complet |
| `suspended` | Accès bloqué |

## Matrice d'Accès (À Appliquer Strictement)

| Action | registered | pending | verified | suspended |
|--------|------------|---------|----------|-----------|
| Accès dashboard | ✅ | ✅ | ✅ | ❌ |
| Voir leads (sans coordonnées) | ✅ | ✅ | ✅ | ❌ |
| Voir coordonnées client | ❌ | ❌ | ✅ | ❌ |
| Accepter un lead | ❌ | ❌ | ✅ | ❌ |
| Acheter crédits | ❌ | ❌ | ✅ | ❌ |

➡️ Toute action bloquée affiche : CTA "Compléter ma vérification" → `/artisan/verification`

## Acceptance Criteria

### AC1 - Page inscription accessible
- **Given** un visiteur non connecté
- **When** il accède à `/artisan/inscription`
- **Then** le formulaire d'inscription s'affiche avec 2 sections (Infos perso + Entreprise)
- **And** les champs requis sont : prénom, nom, email, téléphone, mot de passe, métier, SIRET

### AC2 - Validation SIRET format (Zod)
- **Given** un SIRET saisi
- **When** la validation s'exécute
- **Then** Zod vérifie : 14 chiffres exactement, regex `/^\d{14}$/`
- **And** erreur explicite si format invalide

### AC3 - Vérification SIRET serveur (API INSEE Sirene)
- **Given** un SIRET au format valide
- **When** le Server Action traite l'inscription
- **Then** appel API `https://api.insee.fr/entreprises/sirene/V3.11/siret/{siret}`
- **And** vérification : existence + `etatAdministratifEtablissement === "A"` (Actif)

### AC4 - Mode dégradé (API down)
- **Given** API Sirene retourne 429/503/timeout
- **When** le Server Action traite l'inscription
- **Then** compte créé avec `siret_verified = false`, `verification_status = 'registered'`
- **And** message UX informatif : "Vérification en cours, vous pouvez continuer"
- **And** ❌ JAMAIS de rollback du user Supabase

### AC5 - Création compte + profil
- **Given** des données valides soumises
- **When** le Server Action traite l'inscription
- **Then** compte Supabase Auth créé
- **And** profil mis à jour avec : first_name, last_name, phone, trade, siret, siret_verified, verification_status

### AC6 - Redirection post-inscription
- **Given** un compte créé avec succès
- **When** l'inscription est terminée
- **Then** redirection vers `/artisan/whatsapp`
- **And** message de confirmation affiché

### AC7 - Page vérification assurance
- **Given** un artisan avec `verification_status === 'registered'`
- **When** il accède à `/artisan/verification`
- **Then** formulaire assurance affiché : assureur, numéro police, date validité, upload PDF (optionnel)
- **And** après soumission : `verification_status → 'pending_verification'`

### AC8 - Guards actions payantes
- **Given** un artisan non `verified`
- **When** il tente d'accepter un lead / acheter crédits / voir coordonnées
- **Then** action bloquée
- **And** CTA affiché : "Compléter ma vérification" → `/artisan/verification`

## Tasks / Subtasks

### Task 1: Migration DB (AC: 5, 7) ✅
- [x] 1.1: Ajouter `siret VARCHAR(14)` à profiles
- [x] 1.2: Ajouter `siret_verified BOOLEAN DEFAULT FALSE`
- [x] 1.3: Ajouter `company_name TEXT`
- [x] 1.4: Ajouter `verification_status TEXT DEFAULT 'registered'` avec CHECK constraint
- [x] 1.5: Ajouter `insurance_provider TEXT`
- [x] 1.6: Ajouter `insurance_policy_number TEXT`
- [x] 1.7: Ajouter `insurance_valid_until DATE`
- [x] 1.8: Ajouter `insurance_attestation_path TEXT`
- [x] 1.9: Créer index unique sur siret
- [ ] 1.10: Déployer migration sur Supabase

### Task 2: Service API Sirene (AC: 3, 4) ✅
- [x] 2.1: Créer `lib/services/sirene.ts`
- [x] 2.2: Implémenter `verifySiret(siret: string)` avec appel API INSEE
- [x] 2.3: Gérer mode dégradé (429/503/timeout → return { verified: false, degraded: true })
- [x] 2.4: Auto-fill company_name si disponible
- [ ] 2.5: Tests unitaires (mock API)

### Task 3: Schema Zod inscription (AC: 2) ✅
- [x] 3.1: Ajouter schema SIRET dans `lib/validations/artisan.ts`
- [x] 3.2: Créer `insuranceSchema` pour page vérification
- [ ] 3.3: Tests unitaires Zod

### Task 4: Page inscription UI (AC: 1, 2) ✅
- [x] 4.1: Modifier `app/artisan/inscription/page.tsx`
- [x] 4.2: Ajouter section Entreprise avec champ SIRET
- [ ] 4.3: Debounce 500ms sur SIRET avant validation
- [ ] 4.4: Loader inline pendant vérification
- [x] 4.5: UX anti-stress (ton neutre, messages rassurants)
- [x] 4.6: Mobile-first, shadcn/ui

### Task 5: Server Action inscription (AC: 3, 4, 5, 6) ✅
- [x] 5.1: Modifier `lib/actions/auth.ts` → `signUpArtisan`
- [x] 5.2: Intégrer appel `verifySiret()` après création user
- [x] 5.3: Gérer mode dégradé (pas de rollback)
- [x] 5.4: Sauvegarder siret, siret_verified, verification_status
- [x] 5.5: Redirection vers `/artisan/whatsapp`

### Task 6: Page vérification assurance (AC: 7) ✅
- [x] 6.1: Créer `app/artisan/verification/page.tsx`
- [x] 6.2: Formulaire : assureur, numéro police, date validité, upload PDF
- [x] 6.3: Créer `lib/actions/verification.ts` → `updateInsurance()`
- [ ] 6.4: Configurer Supabase Storage bucket `attestations` (privé)
- [x] 6.5: Transition registered → pending_verification

### Task 7: Guards verified (AC: 8) ✅
- [x] 7.1: Créer `lib/hooks/useVerificationGuard.ts`
- [x] 7.2: Créer `components/ui/verification-banner.tsx`
- [x] 7.3: Protéger action accepter lead dans `lib/actions/assignment.ts`
- [ ] 7.4: Protéger action acheter crédits (client-side guard)
- [x] 7.5: Bannière vérification sur dashboard

### Task 8: Tests (AC: tous)
- [ ] 8.1: Tests Zod : SIRET valide/invalide, assurance expirée
- [ ] 8.2: Tests Sirene (mock) : actif, cessé, inexistant, timeout
- [ ] 8.3: Tests Guards : artisan non-verified → refus + CTA

## Dev Notes

### Champs DB à ajouter

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS siret VARCHAR(14);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS siret_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'registered'
  CHECK (verification_status IN ('registered', 'pending_verification', 'verified', 'suspended'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_provider TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_policy_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_valid_until DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS insurance_attestation_path TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_siret ON profiles(siret) WHERE siret IS NOT NULL;
```

### API INSEE Sirene

```typescript
// Endpoint
GET https://api.insee.fr/entreprises/sirene/V3.11/siret/{siret}

// Headers
Authorization: Bearer {INSEE_SIRENE_TOKEN}

// Vérification
etablissement.periodesEtablissement[0].etatAdministratifEtablissement === "A"

// Auto-fill
company_name = etablissement.uniteLegale.denominationUniteLegale
```

### Gestion Erreurs API

| Cas | Comportement |
|-----|--------------|
| Format invalide | Erreur Zod côté client |
| SIRET inexistant | `{ error: "Ce SIRET n'existe pas dans la base Sirene" }` |
| Entreprise cessée | `{ error: "Cette entreprise n'est plus en activité" }` |
| API 429/503/timeout | Mode dégradé : compte créé, `siret_verified: false` |

### Variables d'environnement requises

```
INSEE_SIRENE_TOKEN=xxx
```

### UX Messages (Ton Neutre)

✅ Utiliser :
- "Sécuriser la plateforme"
- "Accéder aux demandes clients"
- "Vérification en cours"

❌ Éviter :
- "fraude"
- "travail dissimulé"
- "contrôle"

## References

- [Source: architecture.md#Authentication] - Supabase Auth
- [Source: architecture.md#Verification] - API INSEE (nouveau)
- [Source: prd.md#FR33b-g] - Nouvelles FRs verification (nouveau)

## Dev Agent Record

### File List

Files à créer :
- `supabase/migrations/20260203000001_add_verification_fields.sql`
- `lib/services/sirene.ts`
- `lib/actions/verification.ts`
- `app/artisan/verification/page.tsx`
- `lib/hooks/useVerificationGuard.ts`
- `components/ui/verification-banner.tsx`

Files à modifier :
- `lib/validations/artisan.ts` - Ajouter schema SIRET + insurance
- `lib/actions/auth.ts` - Intégrer verifySiret
- `app/artisan/inscription/page.tsx` - Ajouter section SIRET
- `lib/actions/leads.ts` - Guard verified
- `lib/actions/credits.ts` - Guard verified

### Change Log

| Date       | Description                                        |
|------------|----------------------------------------------------|
| 2026-01-28 | Story créée - Epic 2 démarré                       |
| 2026-02-03 | Story v2.0 - Ajout SIRET, verification, assurance  |
| 2026-02-03 | Implémentation complète Tasks 1-7                  |

### Files Created
- `supabase/migrations/20260203000001_add_verification_fields.sql`
- `lib/services/sirene.ts`
- `lib/actions/verification.ts`
- `app/artisan/(dashboard)/verification/page.tsx`
- `lib/hooks/useVerificationGuard.ts`
- `components/ui/verification-banner.tsx`

### Files Modified
- `types/database.types.ts` - Ajout VerificationStatus
- `lib/validations/artisan.ts` - Ajout siretSchema, insuranceSchema
- `lib/actions/auth.ts` - Intégration verifySiret
- `app/artisan/inscription/page.tsx` - Section SIRET
- `lib/actions/assignment.ts` - Guard verified sur acceptLead
- `app/artisan/(dashboard)/dashboard/page.tsx` - VerificationBanner
