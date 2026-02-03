---
stepsCompleted: ['step-01-init', 'step-02-context', 'step-03-starter', 'step-04-decisions', 'step-05-patterns', 'step-06-structure', 'step-07-validation', 'step-08-complete']
inputDocuments: ['prd.md', 'brainstorming-session-2026-01-27.md']
workflowType: 'architecture'
project_name: 'SaaS Artisans Urgents'
user_name: 'Graous'
date: '2026-01-27'
status: 'complete'
completedAt: '2026-01-27'
lastStep: 8
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
49 FRs couvrant le parcours complet B2C (demande → intervention → suivi) et B2B (inscription → leads → conversion). L'architecture doit supporter :
- Formulaire client anonyme avec upload photo
- Système de notification temps réel multi-canal
- Algorithme d'attribution avec cascade temporisée
- Dashboard artisan avec gestion crédits
- Interface admin pour monitoring et modération

**Non-Functional Requirements:**
24 NFRs définissant les contraintes qualité :
- Performance : notifications < 10s, pages < 3s mobile
- Sécurité : RGPD, TLS 1.2+, 2FA admin, PCI-DSS (délégué LemonSqueezy)
- Fiabilité : 99% uptime, fallback automatique, retry ×3
- Scalabilité : 100-500 leads/jour, architecture stateless

**Scale & Complexity:**
- Primary domain: Full-stack SaaS marketplace
- Complexity level: Medium
- Estimated architectural components: 8-10 modules

### Technical Constraints & Dependencies

- **Auth clients** : Pas de compte requis (formulaire anonyme)
- **Auth artisans** : Magic link ou mot de passe simple (Supabase Auth)
- **Paiements** : Délégués à LemonSqueezy (pas de gestion PCI)
- **Notifications** : Dépendance forte WhatsApp Cloud API
- **Automation** : n8n pour workflows (cascade, J+3, alertes)
- **Stockage** : Firebase Storage pour photos (max 5MB, compression)

### Cross-Cutting Concerns Identified

| Concern | Impact architectural |
|---------|---------------------|
| Observabilité | Monitoring n8n, logs centralisés, alertes |
| Résilience | Circuit breaker APIs, retry automatique, fallback canal |
| Sécurité | Masquage PII logs, webhooks signés, RGPD |
| Performance | Indexation leads/zone, cache config tarifaire |
| Multi-tenancy | Isolation par vertical_id, routing sous-domaines |

## Starter Template Evaluation

### Primary Technology Domain

Full-stack SaaS Web Application basé sur l'analyse des exigences projet.

### Starter Options Considered

| Starter | Tech | Verdict |
|---------|------|---------|
| Vercel Supabase Starter | Next.js 15 + Supabase SSR | ✅ Sélectionné |
| create-t3-turbo | Next.js + Expo + tRPC | Trop complexe pour MVP |
| MakerKit Lite | Next.js SaaS boilerplate | Overkill |
| supabase-nextjs-template | Next.js 15 + RLS complet | Trop de code initial |

### Selected Starter: Vercel Supabase Starter

**Rationale:**

- MVP lean : partir minimal, ajouter les briques métier
- Officiellement maintenu par Vercel + Supabase
- Auth SSR cookies-based prêt à l'emploi
- Extensible pour intégrations (LemonSqueezy, n8n, Firebase)

**Initialization Command:**

```bash
npx create-next-app@latest -e with-supabase
```

**Architectural Decisions Provided by Starter:**

| Aspect | Configuration |
|--------|---------------|
| Language & Runtime | TypeScript, Node.js, Next.js 15 App Router |
| Styling Solution | Tailwind CSS + shadcn/ui components |
| Build Tooling | Turbopack (dev), Webpack (prod) |
| Authentication | Supabase Auth avec cookies SSR |
| Code Organization | App Router conventions (/app, /components, /lib) |
| Development Experience | Hot reload, TypeScript strict, ESLint |

**Integrations to Add:**

- LemonSqueezy (webhooks paiement)
- WhatsApp Cloud API (via n8n)
- Firebase Storage (upload photos)
- n8n workflows (cascade, J+3, alertes)

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

- Database : Supabase (PostgreSQL avec RLS)
- Auth : Supabase Auth (magic link + password)
- Paiements : LemonSqueezy (webhooks)
- Notifications : WhatsApp Cloud API via n8n

**Important Decisions (Shape Architecture):**

- ORM : Supabase JS client (natif, RLS intégré)
- Validation : Zod (TypeScript-first)
- API pattern : Next.js Server Actions
- Forms : React Hook Form + Zod

**Deferred Decisions (Post-MVP):**

- Lead scoring AI
- Chatbot WhatsApp conversationnel
- App mobile artisan

### Data Architecture

| Aspect | Décision | Rationale |
|--------|----------|-----------|
| Database | Supabase PostgreSQL | Inclus dans stack, RLS natif |
| Query client | Supabase JS | API native, types auto-générés |
| Validation | Zod | TypeScript-first, schémas partagés client/serveur |
| Migrations | Supabase CLI | Intégré, versionné |
| RLS | Activé | Isolation multi-tenant par vertical_id |

### Authentication & Security

| Aspect | Décision | Rationale |
|--------|----------|-----------|
| Auth artisans | Supabase Auth (magic link/password) | Simplicité, SSR cookies |
| Auth clients | Anonyme (pas de compte) | Friction minimale urgence |
| Auth admin | Supabase Auth + 2FA | Sécurité renforcée |
| Sessions | Cookies SSR | Hydration Next.js compatible |
| Webhooks | Signature vérification | LemonSqueezy, n8n |

### Verification & Anti-Fraud (Anti-Travail Dissimulé)

| Aspect | Décision | Rationale |
|--------|----------|-----------|
| SIRET obligatoire | 14 chiffres, Zod client+serveur | Légalité, confiance client |
| Vérification SIRET | API INSEE Sirene côté serveur | Source officielle française |
| Mode dégradé | Si API down : compte créé, siret_verified=false | Zéro friction bloquante |
| Statuts artisan | registered → pending_verification → verified → suspended | Contrôle progressif |
| Assurance | Post-inscription, formulaire dédié | Anti-abandon à l'inscription |
| Stockage attestations | Supabase Storage bucket privé | Sécurité documents sensibles |
| Guards verified | Server-side check avant actions payantes | Pas de confiance client |

**Statuts de Vérification :**

| Statut | Signification | Droits |
|--------|---------------|--------|
| `registered` | SIRET renseigné (validé ou mode dégradé) | Dashboard, voir leads (sans coords) |
| `pending_verification` | Assurance soumise, en attente validation | Idem registered |
| `verified` | Validation admin OK | Accès complet : leads, crédits, coordonnées |
| `suspended` | Compte bloqué | Aucun accès |

**API INSEE Sirene :**

```
Endpoint: GET https://api.insee.fr/entreprises/sirene/V3.11/siret/{siret}
Auth: Bearer INSEE_SIRENE_TOKEN
Vérification: etablissement.periodesEtablissement[0].etatAdministratifEtablissement === "A"
Fallback: 429/503/timeout → mode dégradé (pas de blocage)
```

**Règle Non Négociable :**
- ❌ Ne JAMAIS rollback un user Supabase Auth déjà créé
- ❌ Ne JAMAIS bloquer l'inscription pour une API externe down
- ✅ Toujours créer le compte, puis traiter la vérification

### API & Communication Patterns

| Aspect | Décision | Rationale |
|--------|----------|-----------|
| API interne | Server Actions | Next.js 15, moins de boilerplate |
| API externe | Route Handlers | Webhooks LemonSqueezy, n8n |
| Validation | Zod middleware | Schémas partagés |
| Errors | Structured errors | Code + message + details |
| n8n trigger | Webhooks sortants | Temps réel < 10s |

### Frontend Architecture

| Aspect | Décision | Rationale |
|--------|----------|-----------|
| Rendering | Server Components (default) | Performance, SEO landing |
| State | Server Components + revalidate | Simplicité MVP |
| Forms | React Hook Form + Zod | Validation TypeScript |
| UI | shadcn/ui + Tailwind | Starter inclus |
| Responsive | Mobile-first | NFR-A1 |

### Infrastructure & Deployment

| Aspect | Décision | Rationale |
|--------|----------|-----------|
| Hosting | Vercel | Starter optimisé, edge |
| CI/CD | Vercel auto-deploy | GitHub push = deploy |
| Env vars | Vercel + .env.local | Secrets gérés |
| Monitoring | n8n + Supabase dashboard | MVP suffisant |
| Logs | Vercel logs + Supabase | Centralisé post-MVP |

### Decision Impact Analysis

**Implementation Sequence:**

1. Init projet (starter Supabase)
2. Schema DB + RLS policies
3. Auth artisans (Supabase Auth)
4. Landing page + formulaire client
5. Intégration Firebase Storage
6. Intégration LemonSqueezy
7. Workflows n8n (cascade, J+3)
8. Dashboard artisan
9. Dashboard admin

**Cross-Component Dependencies:**

- n8n dépend de webhooks Next.js configurés
- Dashboard dépend de RLS policies actives
- Paiements dépendent de LemonSqueezy webhooks
- Notifications dépendent de WhatsApp templates validés

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database Naming:**

| Élément | Convention | Exemple |
|---------|------------|---------|
| Tables | snake_case, pluriel | `leads`, `artisans`, `credit_transactions` |
| Colonnes | snake_case | `created_at`, `vertical_id`, `phone_number` |
| Foreign keys | `{table_singulier}_id` | `artisan_id`, `lead_id` |
| Index | `idx_{table}_{columns}` | `idx_leads_vertical_zone` |

**API Naming:**

| Élément | Convention | Exemple |
|---------|------------|---------|
| Routes | kebab-case, pluriel | `/api/leads`, `/api/artisans` |
| Query params | camelCase | `?verticalId=1&status=pending` |
| Webhooks | `/api/webhooks/{provider}` | `/api/webhooks/lemonsqueezy` |

**Code Naming:**

| Élément | Convention | Exemple |
|---------|------------|---------|
| Composants | PascalCase | `LeadForm.tsx`, `ArtisanCard.tsx` |
| Pages | `page.tsx` (App Router) | `app/dashboard/page.tsx` |
| Variables | camelCase | `leadData`, `artisanId` |
| Env vars | SCREAMING_SNAKE | `SUPABASE_URL`, `WHATSAPP_TOKEN` |

### Structure Patterns

```text
/app
  /(public)/              # Routes anonymes
    page.tsx              # Landing
    demande/page.tsx      # Formulaire client
  /(artisan)/             # Routes auth artisan
    dashboard/page.tsx
    leads/page.tsx
    profil/page.tsx
  /(admin)/               # Routes auth admin + 2FA
    dashboard/page.tsx
    artisans/page.tsx
  /api/
    webhooks/
      lemonsqueezy/route.ts
      n8n/route.ts
/components
  /ui/                    # shadcn/ui
  /forms/                 # LeadForm, ArtisanForm
  /dashboard/             # Cards, Tables
/lib
  /supabase/
    client.ts             # Browser client
    server.ts             # Server client
    middleware.ts         # Auth middleware
  /validations/           # Schémas Zod
  /utils/                 # Helpers
/types
  database.types.ts       # Auto-généré Supabase
  index.ts                # Types métier
```

### Format Patterns

**API Response Format:**

```typescript
// Succès
{ data: T, error: null }

// Erreur
{ data: null, error: { code: string, message: string } }
```

**Zod Validation Pattern:**

```typescript
// /lib/validations/lead.ts
export const leadSchema = z.object({
  phone: z.string().regex(/^0[67]\d{8}$/, "Numéro invalide"),
  problemType: z.enum(["fuite", "wc_bouche", "ballon", "canalisation", "robinet", "autre"]),
  description: z.string().min(10).max(500),
  photoUrl: z.string().url().optional(),
})
```

### Process Patterns

**Error Handling:**

```typescript
try {
  // Action
} catch (error) {
  return { data: null, error: { code: "UNKNOWN", message: "Erreur inattendue" } }
}
```

**Loading States:** `isLoading`, `isPending`, `isSubmitting`

**Auth Check:** Middleware Next.js + `supabase.auth.getUser()`

### Enforcement Guidelines

**Tous les agents IA DOIVENT :**

- Utiliser les schémas Zod pour toute validation
- Retourner le format `{ data, error }` pour les Server Actions
- Respecter la structure `/app/(group)/` pour le routing
- Utiliser Supabase JS (pas d'ORM tiers)
- Nommer les tables en snake_case pluriel

### 🖌️ UI Design Directive

**Outil de conception :** Gemini AI + MCP (Material Components Projects)

Les inspirations et prompts UI sont construits via Gemini AI, avec une attention particulière portée à :

| Critère | Description |
|---------|-------------|
| **Clarté de lecture** | Métier → action rapide, information hiérarchisée |
| **Cohérence multi-verticales** | Thème adaptable par vertical (couleur accent) |
| **Intégration technique** | Harmonisation shadcn/ui + Tailwind CSS |

**Objectif UI :** Interface élégante, épurée et rassurante.

**Traitement différencié par zone :**

| Zone | Style | Caractéristiques |
|------|-------|------------------|
| **Pages publiques** (landing, demande) | Accueillant, confiance | CTA clairs, visuels rassurants, formulaire simplifié |
| **Dashboard artisan** | Professionnel, efficace | Data-dense, actions rapides, notifications visibles |
| **Dashboard admin** | Fonctionnel, complet | Tables filtrable, KPIs, monitoring temps réel |

**Palette de base :**
- Primary: Bleu confiance (`#2563eb`)
- Success: Vert validation (`#16a34a`)
- Warning: Orange alerte (`#ea580c`)
- Background: Gris clair (`#f8fafc`)

## Project Structure & Boundaries

### Complete Project Directory Structure

```text
plombier-urgent/
├── README.md
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── .env.local
├── .env.example
├── .gitignore
├── components.json
│
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   │
│   ├── (public)/
│   │   ├── demande/page.tsx
│   │   └── artisan/[slug]/page.tsx
│   │
│   ├── (artisan)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── leads/page.tsx
│   │   ├── leads/[id]/page.tsx
│   │   └── profil/page.tsx
│   │
│   ├── (admin)/
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── artisans/page.tsx
│   │   └── leads/page.tsx
│   │
│   ├── auth/
│   │   ├── login/page.tsx
│   │   ├── callback/route.ts
│   │   └── signout/route.ts
│   │
│   └── api/webhooks/
│       ├── lemonsqueezy/route.ts
│       └── n8n/route.ts
│
├── components/
│   ├── ui/
│   ├── forms/
│   │   ├── LeadForm.tsx
│   │   └── ArtisanProfileForm.tsx
│   └── dashboard/
│       ├── LeadCard.tsx
│       ├── StatsCard.tsx
│       └── LeadTable.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── validations/
│   │   ├── lead.ts
│   │   └── artisan.ts
│   ├── actions/
│   │   ├── leads.ts
│   │   ├── artisans.ts
│   │   └── credits.ts
│   └── utils/
│       ├── firebase.ts
│       └── format.ts
│
├── types/
│   ├── database.types.ts
│   └── index.ts
│
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   │   └── 001_initial_schema.sql
│   └── seed.sql
│
└── public/
    ├── favicon.ico
    └── images/
```

### Architectural Boundaries

**API Boundaries:**

| Boundary | Type | Responsabilité |
|----------|------|----------------|
| `/api/webhooks/lemonsqueezy` | Externe | Réception paiements |
| `/api/webhooks/n8n` | Externe | Callbacks cascade/J+3 |
| Server Actions (`lib/actions/`) | Interne | Mutations DB |

**Data Boundaries:**

| Boundary | Isolation |
|----------|-----------|
| Artisans | RLS par `artisan_id` |
| Leads | RLS par `vertical_id` + `artisan_id` |
| Admin | RLS role-based |

### Requirements to Structure Mapping

| Catégorie FRs | Dossiers/Fichiers |
|---------------|-------------------|
| Soumission (FR1-6) | `app/(public)/demande/`, `components/forms/LeadForm.tsx` |
| Confirmation (FR7-10) | n8n workflow externe |
| Notifications (FR11-15) | `app/api/webhooks/n8n/`, n8n externe |
| Attribution (FR16-21) | `lib/actions/leads.ts`, n8n cascade |
| Dashboard artisan (FR22-26) | `app/(artisan)/`, `components/dashboard/` |
| Paiement (FR27-32) | `app/api/webhooks/lemonsqueezy/`, `lib/actions/credits.ts` |
| Profil (FR33-38) | `app/(artisan)/profil/`, `app/(public)/artisan/[slug]/` |
| Admin (FR39-45) | `app/(admin)/` |
| Multi-tenant (FR46-49) | RLS policies, `vertical_id` filter |

### Integration Points

**External Integrations:**

| Service | Point d'entrée | Direction |
|---------|----------------|-----------|
| Supabase | `lib/supabase/` | Bidirectionnel |
| LemonSqueezy | `/api/webhooks/lemonsqueezy` | Entrant |
| n8n | `/api/webhooks/n8n` + webhooks sortants | Bidirectionnel |
| Firebase Storage | `lib/utils/firebase.ts` | Sortant |
| WhatsApp Cloud API | Via n8n | Sortant |

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
Toutes les décisions technologiques sont compatibles : Next.js 15 + Supabase + Vercel forment un stack validé et officiellement supporté.

**Pattern Consistency:**
Les patterns (Server Actions + Zod + RLS) sont cohérents et alignés avec le stack choisi.

**Structure Alignment:**
La structure App Router avec groupes de routes supporte parfaitement l'isolation des rôles (public/artisan/admin).

### Requirements Coverage Validation ✅

**Functional Requirements (49 FRs):**

| Catégorie | Couverture | Support architectural |
|-----------|------------|----------------------|
| Soumission (FR1-6) | 100% | LeadForm + Server Actions |
| Confirmation (FR7-10) | 100% | n8n workflows |
| Notifications (FR11-15) | 100% | WhatsApp via n8n |
| Attribution (FR16-21) | 100% | Server Actions + n8n cascade |
| Dashboard artisan (FR22-26) | 100% | /app/(artisan)/ |
| Paiement (FR27-32) | 100% | LemonSqueezy webhooks |
| Profil (FR33-38) | 100% | Supabase Auth + pages |
| Admin (FR39-45) | 100% | /app/(admin)/ |
| Multi-tenant (FR46-49) | 100% | RLS vertical_id |

**Non-Functional Requirements (24 NFRs):**

| Catégorie | Couverture | Support architectural |
|-----------|------------|----------------------|
| Performance (NFR-P1-5) | 100% | Vercel edge, Server Components |
| Security (NFR-S1-7) | 100% | Supabase RLS, 2FA, HTTPS |
| Reliability (NFR-R1-5) | 100% | Fallback multi-canal, retry |
| Integration (NFR-I1-6) | 100% | Webhooks signés, circuit breaker |
| Scalability (NFR-SC1-4) | 100% | Stateless, indexation DB |
| Accessibility (NFR-A1-4) | 100% | Mobile-first, WCAG AA |

### Implementation Readiness Validation ✅

| Critère | Statut |
|---------|--------|
| Décisions documentées avec versions | ✅ |
| Patterns de nommage complets | ✅ |
| Structure projet détaillée | ✅ |
| Boundaries clairement définis | ✅ |
| Mapping FRs → fichiers | ✅ |
| Exemples de code fournis | ✅ |

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Contexte projet analysé
- [x] Complexité évaluée (Medium)
- [x] Contraintes techniques identifiées
- [x] Cross-cutting concerns mappés

**✅ Architectural Decisions**
- [x] Décisions critiques documentées
- [x] Stack technologique spécifié
- [x] Patterns d'intégration définis
- [x] Performance adressée

**✅ Implementation Patterns**
- [x] Conventions de nommage établies
- [x] Patterns de structure définis
- [x] Patterns de communication spécifiés
- [x] Patterns de process documentés

**✅ Project Structure**
- [x] Structure répertoires complète
- [x] Boundaries composants établis
- [x] Points d'intégration mappés
- [x] Mapping requirements → structure

### Architecture Readiness Assessment

**Overall Status:** ✅ READY FOR IMPLEMENTATION

**Confidence Level:** HIGH

**Key Strengths:**
- Stack validé et officiellement supporté
- Couverture 100% des FRs et NFRs
- Patterns clairs pour les agents IA
- Structure projet détaillée

**Areas for Future Enhancement:**
- Schema DB détaillé (à créer en implémentation)
- Templates WhatsApp (validation Meta requise)
- Tests E2E (post-MVP)

### Implementation Handoff

**AI Agent Guidelines:**
- Suivre toutes les décisions architecturales exactement
- Utiliser les patterns d'implémentation de manière cohérente
- Respecter la structure projet et les boundaries
- Se référer à ce document pour toute question architecturale

**First Implementation Priority:**

```bash
npx create-next-app@latest plombier-urgent -e with-supabase
```

