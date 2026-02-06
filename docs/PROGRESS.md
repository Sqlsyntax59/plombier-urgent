# Suivi d'Avancement - SaaS Artisans Urgents

> Dernière mise à jour : 2026-02-06

## Statut Global

| Epic | Nom | Statut | Progression |
|------|-----|--------|-------------|
| 1 | Setup Projet & Fondations | ✅ Complete | 100% |
| 2 | Inscription & Profil Artisan | ✅ Complete | 100% |
| 3 | Soumission Demande Client | ✅ Complete | 100% |
| 4 | Notification & Attribution Leads | ✅ Complete | 100% |
| 5 | Dashboard Artisan | ✅ Complete | 100% |
| 6 | Paiement & Crédits | ✅ Complete | 100% |
| 7 | Suivi Client J+3 | ✅ Complete | 100% |
| 8 | Dashboard Admin | ✅ Complete | 100% |
| 9 | Multi-Tenant & Verticales | ⏳ Backlog | 10% |
| **10** | **Lead Scoring + Badge Réactif + Multi-Artisan** | ✅ Complete | 100% |

**Progress global:** 95% (9/10 Epics complets + P2 stabilisation, Epic 9 backlog)

---

## 🔴 Bugs Critiques Identifiés (Audit 04/02)

| Bug | Sévérité | Impact | Statut |
|-----|----------|--------|--------|
| **Race condition accept_lead** | CRITIQUE | 2 artisans peuvent accepter le même lead | ✅ Fixé (migration `20260204000001` — FOR UPDATE lock) |
| **Workflow cascade #3 manquant** | CRITIQUE | n8n n'a que 2 artisans, pas 3 | ✅ Remplacé par multi-artisan simultané (workflow n8n `6tTzHp4lV0FeKRp8`) |
| **Auto-consommation inexistante** | HIGH | Leads restent en `accepted` indéfiniment | ✅ Fixé — RPC `auto_consume_stale_leads()` + cron `0 4 * * *` |
| **Période de grâce inexistante** | HIGH | Crédit débité immédiatement, pas de remboursement | ✅ Fixé — RPC `cancel_lead_acceptance()` + route `/api/lead/cancel` |
| **Relance J+3 non déclenchée** | MEDIUM | Workflow existe mais aucun cron/trigger | ✅ Fixé — cron `/api/cron/trigger-followup` `0 10 * * *` |
| **Notifications failed jamais retry** | MEDIUM | Leads orphelins si n8n down | ✅ Fixé — cron `/api/cron/retry-notifications` `0 6 * * *` |

---

## ✅ Epic 10 : Lead Scoring + Badge Réactif + Multi-Artisan (Implémenté 06/02)

### Phase 1 : Géocodage ✅
- [x] Table `geocode_cache` (migration `20260207000001`)
- [x] Service `lib/services/geocoding.ts` (API BAN adresse.data.gouv.fr, cache 30j)
- [x] Intégration dans création lead

### Phase 2 : Lead Scoring ✅
- [x] Colonnes `lead_score`, `lead_quality`, `scoring_factors` sur leads (migration `20260207000002`)
- [x] Table `lead_events` (migration `20260207000003`)
- [x] Service `lib/services/scoring.ts` (score 0-100)
- [x] Règles : base 30 + urgence 25 + photo 15 + geocoded 10 + desc 5/-30

### Phase 3 : Badge Artisan Réactif ✅
- [x] Colonnes `is_reactive`, `reactive_score` sur profiles (migration `20260207000004`)
- [x] Colonne `response_ms` sur lead_assignments (migration `20260207000005`)
- [x] RPC `recalculate_reactive_scores()` (migration `20260207000006`)
- [x] Cron `/api/cron/recalculate-scores`

### Phase 4 : Attribution Multi-Artisans ✅
- [x] RPC `find_available_artisans()` (migration `20260207000007`)
- [x] Action n8n `find_artisans_multi` dans callback route
- [x] Workflow n8n multi-artisan 2 waves (ID: `6tTzHp4lV0FeKRp8`)

---

## Fonctionnalités Implémentées (FRs)

### Epic 1: Setup Projet ✅ 100%
- [x] FR-infra: Next.js 16 + TypeScript + Tailwind
- [x] FR-infra: Supabase Auth configuré
- [x] FR-infra: shadcn/ui installé (31 composants)
- [x] FR-infra: Structure fichiers App Router

### Epic 2: Inscription & Profil Artisan ✅ 100%
- [x] FR33: Formulaire inscription artisan (12 champs)
- [x] FR34: Acceptation CGV (+ page /cgv créée)
- [x] FR35: Configuration WhatsApp
- [x] FR36: Page publique artisan /artisan/[slug]
- [x] FR38: Connexion magic link / mot de passe
- [x] **Story 2.1**: Vérification SIRET (API INSEE Sirene)
- [x] **Story 2.2**: Vérification assurance décennale
- [x] **BONUS**: Spécialisations par métier (checkboxes)
- [x] **BONUS**: Header avec email + déconnexion
- [x] **BONUS**: UI V4 - Dark premium redesign

### Epic 3: Soumission Demande Client ✅ 100%
- [x] FR1: Formulaire demande urgence (wizard multi-étapes)
- [x] FR2: Sélection type de panne (6 types)
- [x] FR3: Upload photo (Firebase Storage)
- [x] FR4: Description libre
- [x] FR5: Numéro téléphone client
- [x] FR6: Fourchette prix indicative
- [x] **BONUS**: Questions guidées dynamiques (field_summary)
- [x] **BONUS**: Détection urgence automatique (isUrgent)

### Epic 4: Notification & Attribution ✅ 100%
- [x] FR11: Notification Telegram (WhatsApp en attente)
- [x] FR12: Détails complets dans notification
- [x] FR16: Attribution artisan prioritaire (distance + crédits)
- [x] FR17: Acceptation lead via lien sécurisé
- [x] FR18-19: Cascade 2 min (3 artisans max via n8n)
- [x] FR20: Décompte crédit automatique
- [x] FR21: Message "Lead déjà attribué"
- [x] **BONUS**: Redistribution si refus/timeout

### Epic 5: Dashboard Artisan ✅ 100%
- [x] FR22: Liste leads avec filtres (statut, date)
- [x] FR23: Détail lead complet
- [x] FR24: Solde crédits affiché
- [x] FR25: Historique leads
- [x] FR26: Accès coordonnées après acceptation
- [x] **BONUS**: Statistiques (taux conversion, leads acceptés)
- [x] **BONUS**: Page profil éditable
- [x] **BONUS**: Page crédits avec packs

### Epic 6: Paiement & Crédits ✅ 100%
- [x] FR27-29: Page packs crédits (5/10/20)
- [x] FR30: Intégration LemonSqueezy checkout
- [x] FR31: Facture PDF automatique
- [x] FR32: Historique achats + reçus téléchargeables

### Epic 7: Suivi Client J+3 ✅ 100%
- [x] FR8: Nom artisan dans confirmation
- [x] FR9: Workflow n8n followup automatique
- [x] FR10: Email client J+3 (Resend)
- [x] **BONUS**: Page feedback /feedback/[token]
- [x] **BONUS**: Notation artisan (1-5 étoiles)
- [x] **BONUS**: Commentaire optionnel

### Epic 8: Dashboard Admin ✅ 100%
- [x] FR39: Page métriques temps réel
- [x] FR40: Liste artisans avec recherche/filtres
- [x] FR41: Actions admin (activer/désactiver/suspendre)
- [x] FR42: Attribution crédits gratuits
- [x] FR43: Historique leads avec export CSV
- [x] FR44: Gestion réclamations (feedbacks négatifs)
- [x] FR45: Désactivation auto après 3 leads ratés

### Epic 9: Multi-Tenant ⏳ 10%
- [x] FR47: Table verticals créée
- [ ] FR46, FR48-49: Isolation complète par verticale

---

## Commits Récents

| Date | Commit | Description |
|------|--------|-------------|
| 04/02 | `c18ba25` | fix(api): use responded_at instead of accepted_at |
| 04/02 | `4f95b27` | feat(api): add /api/lead/accept-simple route for WhatsApp |
| 04/02 | `cc54e6d` | fix(notification): flatten WhatsApp data structure for n8n |
| 04/02 | `e2ed4db` | fix: use cascade_order column name (matches DB schema) |
| 04/02 | `451b91c` | fix: use admin client for n8n API routes (bypass RLS) |
| 04/02 | `3766cb2` | fix: add n8n API routes to public middleware |
| 03/02 | `883bdb5` | test: add unit tests with Vitest (169 tests, 52% coverage) |
| 03/02 | `94c0748` | docs: update sprint status and add audit results |
| 03/02 | `bb34d17` | feat(credits): add purchase history and receipt generation |

---

## Base de Données

### Tables Créées (10 tables)
- `verticals` - Verticales métiers
- `profiles` - Profils artisans (extends auth.users)
- `leads` - Demandes clients (+ field_summary, isUrgent)
- `lead_assignments` - Attributions leads avec cascade
- `credit_transactions` - Historique crédits
- `credit_purchases` - Achats LemonSqueezy
- `price_ranges` - Fourchettes prix
- `client_feedback` - Notes clients J+3

### Migrations (23 fichiers)
- Setup initial: 10 migrations (28/01)
- Ajouts récents: field_summary, specializations, verification (30/01-03/02)
- RLS policies actives sur toutes les tables

### RPC Functions
- `calculate_distance()` - Calcul distance géographique
- `assign_lead_to_artisan()` - Attribution transactionnelle

---

## Intégrations

| Service | Statut | Notes |
|---------|--------|-------|
| Supabase | ✅ Actif | Auth + DB + RLS (23 migrations) |
| Vercel | ✅ Actif | Déploiement auto sur push master |
| Telegram | ⏸️ Désactivé | Remplacé par WhatsApp |
| WhatsApp Cloud | ✅ Actif | Template validé par Meta |
| n8n | ✅ Actif | 6 workflows configurés |
| LemonSqueezy | ⚠️ À vérifier | Webhooks à tester en prod |
| Firebase Storage | ✅ Actif | Upload photos clients |
| Resend | ✅ Actif | Emails transactionnels |
| API INSEE Sirene | ✅ Actif | Validation SIRET |

---

## UI/Design

### Version Actuelle: UI V4 (Dark Premium) - 03/02/2026

**Landing Page (Redesign complet):**
- Theme dark professionnel (`#0a0f1a`)
- Background animé (orbes gradient + grid pattern)
- Hero avec gradient animé "2 minutes"
- Compteurs stats animés au scroll (500+, 2min, 98%, 24/7)
- Cards services avec images Unsplash HD (6 types pannes)
- Hover effects (lift, zoom image, glow blur)
- Timeline "Comment ça marche" connectée
- Carousel témoignages avec avatars
- Header/Footer glassmorphism premium

**Design Tokens:**
```css
Background: bg-[#0a0f1a]
Gradients: from-blue-500 to-cyan-400, from-orange-500 to-red-500
Cards: bg-white/[0.08] border-white/10 backdrop-blur
Glow: blur-xl opacity-50
```

**Autres Pages (V3):**
- Dashboard artisan: sidebar responsive, glassmorphism
- Formulaire demande: wizard multi-étapes avec icônes
- Login/Inscription: tabs, sections avec icônes
- Pages leads/profil/crédits: gradient mesh backgrounds

---

## Tests

### Couverture Actuelle
- **Tests unitaires**: ✅ 169 tests (52% coverage) - Vitest
- **Tests E2E**: Playwright configuré (audit prod)
- **Audit production**: ✅ Passé (100% routes OK)

### Résultats Audit (03/02/2026)
```
✅ Site accessible (200 OK, 132ms)
✅ HTTPS valide
✅ 8 routes testées sans erreur
✅ Aucun lien cassé
✅ 80 endpoints API valides
```

---

## Prochaines Étapes

### P0 - Bugs Critiques ✅
- [x] Fix race condition `accept_lead()` (FOR UPDATE lock — migration `20260204000001`)
- [x] Fix workflow n8n cascade → remplacé par multi-artisan simultané
- [ ] Test achat LemonSqueezy en production réel

### P1 - Epic 10 ✅
- [x] Phase 1 : Géocodage API BAN + cache
- [x] Phase 2 : Lead scoring (urgence + photo + description)
- [x] Phase 3 : Badge "Artisan Réactif" (taux réponse > 80%, < 2min)
- [x] Phase 4 : Attribution multi-artisans (3 simultanés)

### P2 - Stabilisation ✅
- [x] Auto-consommation : RPC `auto_consume_stale_leads()` + cron `/api/cron/auto-consume`
- [x] Période de grâce 30min : RPC `cancel_lead_acceptance()` + route `/api/lead/cancel`
- [x] Cron retry notifications : `/api/cron/retry-notifications` (max 3 tentatives)
- [x] Cron déclencher feedback J+3 : `/api/cron/trigger-followup`

### P3 - Growth (Post-MVP)
- [ ] Multi-verticales (électricien, serrurier, vitrier)
- [ ] App mobile artisans (React Native)
- [ ] Chatbot WhatsApp conversationnel

---

## Comptes Test

| Email | Role | Notes |
|-------|------|-------|
| graous@gmail.com | artisan | Compte principal |
| maleocokesix@gmail.com | artisan | Test |

---

*Document mis à jour le 2026-02-06*
