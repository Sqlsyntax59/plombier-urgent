# MAP.md — Cartographie Projet Plombier Urgent

> Date : 2026-02-15 | Commit HEAD : `5d33985`

---

## 1. Arborescence (3 niveaux)

```
plombier-urgent/
├── app/                         # Next.js App Router (50+ pages, 27 API routes)
│   ├── (public)/                # Pages publiques (landing, demande, cgv, feedback)
│   ├── artisan/                 # Inscription, login, dashboard artisan, profil public
│   │   ├── (dashboard)/         # Routes protegees artisan (leads, credits, profil, verif)
│   │   └── [slug]/              # Page publique artisan dynamique
│   ├── admin/                   # Dashboard admin (artisans, leads, reclamations, verticales)
│   ├── auth/                    # Login, signup, forgot-password, confirm
│   └── api/                     # 27 endpoints (n8n, webhooks, crons, leads, notifications)
│
├── components/                  # 34 composants React (~2530 LOC)
│   ├── ui/                      # shadcn/ui primitives (15 composants Radix)
│   ├── tutorial/                # Legacy starter Supabase (code mort)
│   └── *.tsx                    # Header, login/signup forms, theme, logos
│
├── lib/                         # Logique metier (~2723 LOC)
│   ├── actions/                 # 7 server actions (admin, artisan, lead, profile, auth, assignment, verif)
│   ├── services/                # 6 services (attribution, geocoding, notification, scoring, sirene, multi-attribution)
│   ├── supabase/                # Clients Supabase (client, server, proxy)
│   ├── validations/             # Schemas Zod (artisan, lead)
│   ├── hooks/                   # useVerificationGuard
│   ├── lemonsqueezy/            # Client + types LemonSqueezy
│   └── n8n/                     # Trigger n8n webhooks
│
├── supabase/                    # 30 migrations SQL + scripts batch
│   └── migrations/              # 20260128* -> 20260207* (10 tables, 23+ RPCs)
│
├── n8n-workflows/               # 8 workflows JSON (WhatsApp, cascade, multi-artisan, followup)
├── __tests__/                   # 13 fichiers test Vitest (169 tests, 52% coverage)
├── scripts/                     # Audit prod Playwright
├── docs/                        # PROGRESS.md, DEPLOYMENT.md, regle-du-jeux-v2.md
└── _bmad-output/                # PRD, specs, artefacts planning
```

---

## 2. Points d'entree

### 2.1 Pages Next.js (50+)

| Section | Route | Fichier | LOC |
|---------|-------|---------|-----|
| Landing | `/` | `app/(public)/page.tsx` | 686 |
| Demande client | `/demande` | `app/(public)/demande/page.tsx` | 605 |
| Inscription artisan | `/artisan/inscription` | `app/artisan/inscription/page.tsx` | 549 |
| Login artisan | `/artisan/login` | `app/artisan/login/page.tsx` | 304 |
| Profil public | `/artisan/[slug]` | `app/artisan/[slug]/page.tsx` | ~200 |
| Dashboard artisan | `/artisan/dashboard` | `app/artisan/(dashboard)/dashboard/page.tsx` | 296 |
| Leads artisan | `/artisan/leads` | `app/artisan/(dashboard)/leads/page.tsx` | 463 |
| Detail lead | `/artisan/leads/[id]` | `app/artisan/(dashboard)/leads/[id]/page.tsx` | 318 |
| Profil edition | `/artisan/profil` | `app/artisan/(dashboard)/profil/page.tsx` | 539 |
| Verification | `/artisan/verification` | `app/artisan/(dashboard)/verification/page.tsx` | 306 |
| Credits | `/artisan/credits` | `app/artisan/(dashboard)/credits/page.tsx` | ~200 |
| Feedback J+3 | `/feedback/[token]` | `app/(public)/feedback/[token]/page.tsx` | 337 |
| Admin dashboard | `/admin/dashboard` | `app/admin/dashboard/page.tsx` | ~200 |
| Admin artisans | `/admin/artisans` | `app/admin/artisans/page.tsx` | 419 |
| Admin leads | `/admin/leads` | `app/admin/leads/page.tsx` | 339 |
| Admin reclamations | `/admin/reclamations` | `app/admin/reclamations/page.tsx` | 346 |

### 2.2 Routes API (27 endpoints)

| Route | Methode | Role | Auth |
|-------|---------|------|------|
| `/api/n8n/callback` | POST | Facade RPC pour n8n (8 actions) | N8N_CALLBACK_SECRET |
| `/api/n8n/generate-accept-url` | POST | URL accept dynamique | N8N_CALLBACK_SECRET |
| `/api/lead/accept` | GET/POST | Accept lead (token JWT) | Token JWT |
| `/api/lead/accept-simple` | POST | Accept simplifie | Public |
| `/api/lead/cancel` | POST | Cancel grace 30min | Auth artisan |
| `/api/leads/accept` | POST | Accept lead (public) | Public |
| `/api/leads/assign` | POST | Assignment | Public |
| `/api/leads/redistribute` | POST | Redistribution | Public |
| `/api/notifications/prepare` | POST | Preparation notif | Public |
| `/api/notifications/send-whatsapp` | POST | Envoi WhatsApp | Public |
| `/api/webhooks/n8n/trigger-lead` | POST | Lead created | Public |
| `/api/webhooks/n8n/notification-status` | POST | Status notif | Public |
| `/api/webhooks/n8n/followup` | POST | Followup J+3 | Public |
| `/api/webhooks/lemonsqueezy` | POST | Paiement webhook | Signature HMAC |
| `/api/cron/recalculate-scores` | GET | Badge reactif (3h) | CRON_SECRET |
| `/api/cron/auto-consume` | GET | Auto-consommation (4h) | CRON_SECRET |
| `/api/cron/retry-notifications` | GET | Retry notif (6h) | CRON_SECRET |
| `/api/cron/trigger-followup` | GET | Feedback J+3 (10h) | CRON_SECRET |
| `/api/artisan/receipt/[id]` | GET | PDF recu paiement | Auth artisan |
| `/api/feedback` | POST | Soumission feedback | Public (token) |
| `/api/auth/signout` | POST | Deconnexion | Auth |
| `/api/admin/leads/retry-notifications` | POST | Retry manual | Auth admin |

### 2.3 Server Actions (`lib/actions/`)

| Fichier | LOC | Fonctions principales |
|---------|-----|----------------------|
| `admin-dashboard.ts` | 562 | getAdminMetrics, getAdminArtisans, getAdminLeads |
| `artisan-dashboard.ts` | 259 | getArtisanMetrics, getLastLead |
| `lead.ts` | 182 | createLead, getLeadById, listLeads |
| `profile.ts` | 222 | getProfile, updateProfile |
| `auth.ts` | 208 | signUp, signIn, signOut |
| `assignment.ts` | 156 | acceptLead, generateAcceptToken, verifyAcceptToken |
| `verification.ts` | 154 | verifySiret, uploadInsurance |

### 2.4 Services Metier (`lib/services/`)

| Fichier | LOC | Role |
|---------|-----|------|
| `notification.ts` | 308 | Envoi WhatsApp/Telegram/Email via n8n |
| `attribution.ts` | 202 | Find artisan le plus proche (cascade) |
| `sirene.ts` | 165 | Validation SIRET API INSEE |
| `multi-attribution.ts` | 130 | Top 3 artisans geolocalisees |
| `geocoding.ts` | 118 | API BAN adresse.data.gouv.fr + cache 30j |
| `scoring.ts` | 57 | Score lead 0-100 (base+urgence+photo+geo+desc) |

### 2.5 RPC PostgreSQL (23+)

**Attribution :** `accept_lead`, `find_available_artisan`, `find_available_artisans`, `create_assignment`, `expire_assignment`, `auto_consume_stale_leads`, `cancel_lead_acceptance`

**Credits :** `credit_artisan`, `credit_artisan_simple`, `refund_artisan_credits`

**Status :** `check_lead_status`, `get_lead_details`, `update_artisan_rating`, `update_lead_on_assignment_change`

**Scoring :** `recalculate_reactive_scores`, `compute_response_ms`

**Triggers :** `handle_new_user`, `update_updated_at`

### 2.6 Workflows n8n (8)

| Workflow | Statut | Role |
|----------|--------|------|
| `lead-created-multi-artisan.json` | Actif | Multi-artisans simultane (prod) |
| `01-lead-created-whatsapp.json` | Pret | Template WhatsApp lead_notification |
| `lead-created-cascade.json` | Actif | Cascade sequentielle 3 artisans |
| `lead-created-whatsapp-cascade.json` | Actif | Cascade WhatsApp |
| `02-lead-accepted-email.json` | Actif | Confirmation email artisan |
| `03-followup-j3-feedback.json` | Actif | Feedback client J+3 |
| `01-lead-created-telegram.json` | Desactive | Remplace par WhatsApp |
| `test-whatsapp-hello-world.json` | Test | Sandbox |

### 2.7 Crons Vercel (4)

| Route | Schedule | Role |
|-------|----------|------|
| `/api/cron/recalculate-scores` | `0 3 * * *` | Badge reactif |
| `/api/cron/auto-consume` | `0 4 * * *` | Auto-consommation leads |
| `/api/cron/retry-notifications` | `0 6 * * *` | Retry notif echouees |
| `/api/cron/trigger-followup` | `0 10 * * *` | Feedback J+3 |

---

## 3. Base de donnees (10 tables)

| Table | Migration | Role |
|-------|-----------|------|
| `verticals` | 20260128000001 | Verticales metiers |
| `profiles` | 20260128000002 | Profils artisans (extends auth.users) |
| `leads` | 20260128000006 | Demandes clients |
| `lead_assignments` | 20260128000008 | Attributions avec cascade_order |
| `credit_transactions` | 20260129000002 | Historique credits |
| `credit_purchases` | 20260128000009 | Achats LemonSqueezy |
| `price_ranges` | 20260128000007 | Fourchettes prix |
| `client_feedbacks` | 20260128000010 | Feedbacks J+3 |
| `geocode_cache` | 20260207000001 | Cache API BAN 30j |
| `lead_events` | 20260207000003 | Event log |

---

## 4. Integrations externes (9)

| Service | Statut | Usage |
|---------|--------|-------|
| Supabase | Actif | Auth + DB + RLS + RPCs |
| Vercel | Actif | Hosting + Crons (CDG1 Paris) |
| n8n | Actif | Orchestration workflows |
| WhatsApp Cloud | Actif | Notifications artisans |
| LemonSqueezy | Actif | Paiement credits |
| API INSEE Sirene | Actif | Validation SIRET |
| API BAN | Actif | Geocodage adresses |
| Firebase Storage | Actif | Photos clients |
| Resend | Actif | Emails transactionnels |
