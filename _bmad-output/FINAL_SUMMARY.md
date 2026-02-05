# Project Summary - Plombier Urgent

**Version:** v0.9.0 (Phase 1 complète)
**Date:** 2026-02-06
**Status:** 8/10 Epics DONE — Prêt pour Phase 2

## Epics Completed

| Epic | Description | Stories | Status |
|------|-------------|---------|--------|
| 1 | Setup Projet & Fondations | 4 | ✅ DONE |
| 2 | Inscription & Profil Artisan | 6 | ✅ DONE |
| 3 | Soumission de Demande Client | 6 | ✅ DONE |
| 4 | Notification & Attribution des Leads | 10 | ✅ DONE |
| 5 | Dashboard Artisan | 5 | ✅ DONE |
| 6 | Paiement & Crédits (LemonSqueezy) | 5 | ✅ DONE |
| 7 | Suivi Client J+3 & Ratings | 5 | ✅ DONE |
| 8 | Dashboard Admin | 7 | ✅ DONE |
| 9 | Multi-Tenant & Verticales | 4 | ⬜ Backlog |
| 10 | Lead Scoring + Badge + Géoloc | 4 | ⬜ Backlog |

**Total implémenté :** 48 stories + 8 features hors-epic

## Stack Technique

- **Framework:** Next.js 16 App Router + TypeScript
- **Database:** Supabase PostgreSQL (23 migrations, RLS activé)
- **Auth:** Supabase Auth (magic link + password)
- **UI:** shadcn/ui + Tailwind CSS (Dark Premium V4)
- **Validation:** Zod + React Hook Form
- **Orchestration:** n8n sur VPS Contabo
- **Notifications:** WhatsApp Cloud API (template Meta validé)
- **Email:** Resend (transactionnel)
- **Paiement:** LemonSqueezy (webhooks)
- **Storage:** Firebase Storage (photos clients)
- **Tests:** Vitest (169 tests, 52% coverage)

## Features Implemented

### Client (B2C)
- Landing page Dark Premium V4 avec animations
- Formulaire urgence multi-étapes
- Sélection type de panne (6 types)
- Questions guidées dynamiques par type de panne (guided intake)
- Synthèse terrain automatique pour l'artisan
- Détection urgence automatique
- Upload photo optionnel (Firebase Storage)
- Fourchette de prix indicative dynamique
- Confirmation de demande
- Feedback J+3 (satisfaction OUI/NON)

### Artisan (B2B)
- Inscription avec CGV + vérification SIRET (API INSEE Sirene)
- Vérification assurance (attestation + numéro police)
- Statuts vérification : registered → pending_verification → verified → suspended
- Configuration WhatsApp
- Page publique avec badge "Réactif"
- Dashboard avec stats temps réel
- Liste des leads avec filtres (période, statut)
- Détail lead avec coordonnées masquées (révélées après acceptation)
- Acceptation lead avec décompte crédit
- Acceptation simplifiée via lien WhatsApp
- Achat packs crédits (5/10/20 leads) via LemonSqueezy
- Historique achats + génération reçus
- Spécialisations artisan

### Système
- Attribution prioritaire par zone/crédits
- Cascade 2min jusqu'à 3 artisans (corrigée pour 3 artisans)
- Notifications multi-canal (WhatsApp → SMS → Email)
- WhatsApp Cloud API avec template `lead_notification` validé Meta
- Fallback webhook n8n
- API endpoints pour intégration n8n (17 routes)
- Retry notifications admin
- Désactivation auto artisan après 3 leads ratés

### Admin
- Dashboard métriques (leads, taux réponse, artisans actifs)
- Gestion artisans (activation/désactivation)
- Historique leads avec filtres
- Gestion réclamations (feedbacks négatifs)
- Attribution crédits gratuits
- Retry notifications failed
- Page verticales (placeholder)

## Database Schema (23 migrations)

### Tables principales
- `verticals` — Verticales métier
- `profiles` — Artisans (crédits, SIRET, assurance, vérification)
- `leads` — Demandes clients (géoloc, field_summary, satisfaction)
- `lead_assignments` — Attribution avec cascade et tracking notification
- `credit_transactions` — Historique crédits (purchase, debit, refund, bonus)
- `credit_purchases` — Achats LemonSqueezy
- `price_ranges` — Fourchettes de prix par type/verticale
- `client_feedback` — Retours clients J+3

### Enums
- `problem_type`: fuite, wc_bouche, ballon_eau_chaude, canalisation, robinetterie, autre
- `lead_status`: pending, assigned, accepted, completed, cancelled, unassigned
- `assignment_status`: pending, accepted, expired, rejected
- `notification_channel`: whatsapp, sms, email
- `verification_status`: registered, pending_verification, verified, suspended

## API Endpoints (17 routes)

| Endpoint | Description |
|----------|-------------|
| `/api/leads/assign` | Attribution lead |
| `/api/leads/accept` | Acceptation lead |
| `/api/leads/redistribute` | Cascade/redistribution |
| `/api/lead/accept-simple` | Acceptation WhatsApp simplifiée |
| `/api/notifications/prepare` | Formatage notification |
| `/api/notifications/send-whatsapp` | Envoi WhatsApp Cloud API |
| `/api/webhooks/n8n/trigger-lead` | Trigger workflow n8n |
| `/api/webhooks/n8n/notification-status` | Callback notification |
| `/api/webhooks/n8n/followup` | Suivi J+3 |
| `/api/webhooks/lemonsqueezy` | Paiements |
| `/api/feedback` | Retour clients |
| `/api/n8n/generate-accept-url` | URL acceptation |
| `/api/n8n/callback` | Callback n8n |
| `/api/admin/leads/retry-notifications` | Retry notifications |
| `/api/artisan/receipt/[id]` | Reçu achat |

## Pages (30)

- **Publiques (4):** Landing, Demande, CGV, Feedback
- **Auth (6):** Login, Sign-up, Success, Forgot/Update password, Error
- **Artisan (13):** Dashboard, Leads, Lead detail, Profil, Crédits, Historique, Success, WhatsApp, Vérification, Inscription, Login, Page publique, Lead accepted/error
- **Admin (5):** Dashboard, Artisans, Leads, Réclamations, Verticales

## Bugs Critiques Connus

| Sévérité | Bug | Statut |
|----------|-----|--------|
| P0 | Race condition `accept_lead()` | ⚠️ Open |
| P1 | Pas d'auto-completion leads | ⚠️ Open |
| P1 | Pas de période de grâce crédit (30min) | ⚠️ Open |
| P2 | Relance J+3 sans cron trigger | ⚠️ Open |
| P2 | Notifications failed sans retry auto | ⚠️ Open |

## Next Steps

### Priorité 1 : Bugs P0/P1
- Fix race condition accept_lead (FOR UPDATE lock)
- Auto-completion leads (timer → completed)
- Période de grâce crédit (30min annulation)

### Priorité 2 : Epic 10 — Lead Scoring + Badge + Géoloc
- 10-1: Géocodage API BAN (FR50-52)
- 10-2: Lead Scoring 0-100 (FR53-56)
- 10-3: Badge Artisan Réactif (FR57-61)
- 10-4: Attribution Multi-Artisans simultanée (FR62-67)

### Priorité 3 : Epic 9 — Multi-Tenant
- Verticales métier (électricien, serrurier, vitrier)
- Isolation données par vertical_id
- Grilles tarifaires par verticale

## Infrastructure

| Service | Statut |
|---------|--------|
| Vercel | ✅ Déployé |
| GitHub | ✅ Public |
| Supabase | ✅ Production |
| n8n VPS | ✅ Configuré |
| WhatsApp Cloud | ✅ Template validé |
| Firebase Storage | ✅ Actif |
| LemonSqueezy | ⚠️ À tester prod |
| Resend | ✅ Configuré |

## Métriques

| Métrique | Valeur |
|----------|--------|
| Fichiers TypeScript | 115 |
| Lignes de code | ~6,011 |
| Composants React | 31 |
| Routes API | 17 |
| Pages | 30 |
| Migrations SQL | 23 |
| Workflows n8n | 6 |
| Tests unitaires | 169 (52% coverage) |

## Git History (Commits clés)

```
e832063 fix: add send-whatsapp to public API routes
59516b6 fix: race condition accept_lead + cascade workflow 3 artisans
883bdb5 test: add unit tests with Vitest (169 tests, 52% coverage)
bb34d17 feat(credits): add purchase history and receipt generation
3fd3270 fix(security): audit sprint 2 - RLS, headers CSP, verification guards
f834c3b style(landing): dark premium redesign with animations
144c338 feat(artisan): story 2.1 SIRET verification & insurance
c11e077 feat(n8n): complete WhatsApp workflow with template lead_notification
5f1a6df feat(epic8): complete admin dashboard with all stories
3d176d8 feat(epic5): complete artisan dashboard
```

---

*Summary updated: 2026-02-06 | v0.9.0 | 8/10 Epics done*
