---
status: UPDATED
frozenAt: '2026-01-28'
updatedAt: '2026-02-06'
readinessStatus: READY
project: SaaS Artisans Urgents
stack: Next.js 16 + Supabase + LemonSqueezy + WhatsApp Cloud API
epics: 10
stories: 55
frs: 67
nfrs: 33
---

# Implementation Context - SaaS Artisans Urgents

> **Ce fichier est le point de vérité unique pour l'implémentation.**
> Mis à jour le 2026-02-06 pour refléter l'état réel du projet.

## Quick Reference

| Élément | Valeur |
|---------|--------|
| Framework | Next.js 16 App Router + TypeScript |
| Auth | Supabase Auth (magic link / password) |
| Paiement | LemonSqueezy (webhooks) |
| Notifications | WhatsApp Cloud API → SMS → Email (fallback) |
| Storage | Firebase Storage (photos) |
| Automation | n8n sur VPS Contabo |
| UI | shadcn/ui + Tailwind CSS |
| Validation | Zod + React Hook Form |
| Tests | Vitest (169 tests, 52% coverage) |
| Email | Resend (transactionnel) |

## Infrastructure Production

| Service | URL | Statut |
|---------|-----|--------|
| Vercel | https://plombier-urgent.vercel.app | ✅ Déployé |
| GitHub | https://github.com/Sqlsyntax59/plombier-urgent | ✅ Public |
| Supabase | Production (23 migrations) | ✅ RLS activé |
| n8n VPS | https://vmi3051008.contaboserver.net | ✅ Configuré |
| WhatsApp Cloud | Template `lead_notification` validé Meta | ✅ Actif |
| Firebase Storage | Upload photos clients | ✅ Actif |
| LemonSqueezy | Webhooks paiement | ⚠️ À tester prod |

## Artefacts

| Document | Chemin | Status |
|----------|--------|--------|
| PRD | `planning-artifacts/prd.md` | ✅ À jour (Epic 10 ajouté) |
| Architecture | `planning-artifacts/architecture.md` | ✅ Frozen |
| Epics & Stories | `planning-artifacts/epics.md` | ✅ Mis à jour 2026-02-06 |
| Readiness Report | `planning-artifacts/implementation-readiness-report.md` | ✅ Frozen |
| Sprint Status | `implementation-artifacts/sprint-status.yaml` | ✅ Mis à jour 2026-02-06 |

## Epic Sequence (Implémentation)

| # | Epic | Stories | FRs | Statut |
|---|------|---------|-----|--------|
| 1 | Setup Projet & Fondations | 4 | infra | ✅ Done |
| 2 | Inscription & Profil Artisan | 6 | FR33-38 | ✅ Done |
| 3 | Soumission Demande Client | 6 | FR1-6 | ✅ Done |
| 4 | Notification & Attribution Leads | 10 | FR11-21 | ✅ Done |
| 5 | Dashboard Artisan | 5 | FR22-26 | ✅ Done |
| 6 | Paiement & Crédits | 5 | FR27-32 | ✅ Done |
| 7 | Suivi Client J+3 & Ratings | 5 | FR7-10 | ✅ Done |
| 8 | Dashboard Admin | 7 | FR39-45 | ✅ Done |
| 9 | Multi-Tenant & Verticales | 4 | FR46-49 | ⬜ Backlog |
| 10 | Lead Scoring + Badge + Géoloc | 4 | FR50-67 | ⬜ Backlog |

### Features hors-epic (post-Bmad)

| Feature | FRs | Statut |
|---------|-----|--------|
| Vérification SIRET/Assurance | FR33b-33m | ✅ Done |
| Guided Intake (questions dynamiques) | FR6.1-6.6 | ✅ Done |
| Landing V4 Dark Premium | - | ✅ Done |
| WhatsApp Cloud API workflow | - | ✅ Done |
| Tests unitaires Vitest | - | ✅ Done (169 tests) |
| Route accept-simple WhatsApp | - | ✅ Done |
| Génération reçus achats | - | ✅ Done |
| Admin retry notifications | - | ✅ Done |

## Tables DB (Schéma Actuel - 23 migrations)

```
verticals (id, name, slug, pricing_grid)

profiles (id, user_id, vertical_id, role, first_name, last_name, company_name,
          city, phone, whatsapp_phone, email, is_active, credits, google_place_id,
          siret, siret_verified, verification_status,
          insurance_provider, insurance_policy_number, insurance_valid_until,
          insurance_attestation_path, slug, specializations)

leads (id, vertical_id, problem_type, description, photo_url,
       client_phone, client_email, client_name, client_city,
       latitude, longitude, status, cascade_count, satisfaction,
       field_summary, artisan_id)

lead_assignments (id, lead_id, artisan_id, cascade_position, status,
                  notification_channel, notification_external_id, notification_error,
                  notified_at, responded_at, expires_at)

credit_transactions (id, artisan_id, type, amount, balance_after, lead_id, metadata)

credit_purchases (id, artisan_id, pack_size, amount, lemon_tx_id, status)

price_ranges (id, vertical_id, problem_type, min_price, max_price)

client_feedback (id, lead_id, token, satisfied, comment, created_at)
```

### Enums

```
problem_type: fuite, wc_bouche, ballon_eau_chaude, canalisation, robinetterie, autre
lead_status: pending, assigned, accepted, completed, cancelled, unassigned
assignment_status: pending, accepted, expired, rejected
notification_channel: whatsapp, sms, email
verification_status: registered, pending_verification, verified, suspended
credit_type: purchase, lead_debit, refund, bonus, initial
```

### RPC Functions

```
calculate_distance(lat1, lng1, lat2, lng2) → float
assign_lead_to_artisan(lead_id, artisan_id) → void
```

## Routes API (17)

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/leads/assign` | POST | Attribution lead |
| `/api/leads/accept` | GET/POST | Acceptation lead |
| `/api/leads/redistribute` | POST/GET | Cascade timer |
| `/api/lead/accept` | GET/POST | Acceptation lead (variante) |
| `/api/lead/accept-simple` | GET/POST | Acceptation simple WhatsApp |
| `/api/notifications/prepare` | POST | Formatage notification |
| `/api/notifications/send-whatsapp` | POST | Envoi WhatsApp |
| `/api/webhooks/n8n/trigger-lead` | POST | Trigger n8n |
| `/api/webhooks/n8n/notification-status` | POST | Callback notification |
| `/api/webhooks/n8n/followup` | POST | Suivi J+3 |
| `/api/webhooks/lemonsqueezy` | POST | Paiements LemonSqueezy |
| `/api/auth/signout` | POST | Déconnexion |
| `/api/feedback` | POST | Retour clients |
| `/api/n8n/generate-accept-url` | POST | Génération URL acceptation |
| `/api/n8n/callback` | POST | Callback n8n |
| `/api/admin/leads/retry-notifications` | POST | Retry notifications |
| `/api/artisan/receipt/[id]` | GET | Reçu achat |

## Pages (30)

**Publiques :** Landing, Demande, CGV, Feedback J+3
**Auth (6) :** Login, Sign-up, Forgot password, Update password, Error, Success
**Artisan (13) :** Dashboard, Leads, Lead detail, Profil, Crédits, Historique achats, Success paiement, WhatsApp, Vérification, Inscription, Login, Page publique, Lead accepted/error
**Admin (5) :** Dashboard, Artisans, Leads, Réclamations, Verticales

## Bugs Critiques Connus (Audit 2026-02-04)

| Sévérité | Bug | Statut |
|----------|-----|--------|
| P0 | Race condition `accept_lead()` — 2 artisans peuvent accepter le même lead | ⚠️ Open |
| P0 | Workflow cascade 3 artisans | ✅ Fixed (commit 59516b6) |
| P1 | Leads restent en `accepted` indéfiniment (pas d'auto-completion) | ⚠️ Open |
| P1 | Pas de période de grâce 30min pour annulation crédit | ⚠️ Open |
| P2 | Relance J+3 non déclenchée (pas de cron trigger) | ⚠️ Open |
| P2 | Notifications failed sans retry automatique | ⚠️ Open |

## Rôles RBAC

| Rôle | Permissions |
|------|-------------|
| client (anon) | Soumettre demande, feedback J+3 |
| artisan | Dashboard, accepter leads, profil, acheter crédits |
| admin | Tout voir, modérer, créditer, retry notifications |

## Critères de Performance (NFRs Clés)

| NFR | Cible |
|-----|-------|
| NFR-P1 | Notification < 10s |
| NFR-P2 | Landing < 3s (mobile 4G) |
| NFR-P3 | Dashboard < 2s |
| NFR-R1 | Uptime ≥ 99% |
| NFR-R2 | Fallback WhatsApp → SMS → Email |

## Commandes Développement

```bash
# Développement local
npm run dev

# Tests
npm run test

# Workflow Claude Code
/focus <module>          # Restreindre contexte
/patch <modification>    # Appliquer changement
/verify                  # Valider
commit-commands:commit   # Git commit
```

## Règles d'Implémentation

1. **Lire** le code existant avant de modifier
2. **Valider** avec `/verify` avant commit
3. **Respecter** les NFRs de performance
4. **Tester** chaque FR avec son critère d'acceptation
5. **Corriger** les bugs P0 avant de démarrer Epic 10
6. **Commits atomiques** avec message clair

## Métriques Projet

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

## Variables d'Environnement

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
N8N_WEBHOOK_URL=
NEXT_PUBLIC_BASE_URL=
WHATSAPP_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
RESEND_API_KEY=
LEMONSQUEEZY_WEBHOOK_SECRET=
```

---

*Context frozen: 2026-01-28 | Updated: 2026-02-06 | Epics done: 8/10*
