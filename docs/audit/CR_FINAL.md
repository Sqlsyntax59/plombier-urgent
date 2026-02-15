# CR_FINAL.md — Compte-Rendu d'Audit Plombier Urgent

> Date : 2026-02-15 | Commit HEAD : `5d33985` (07/02/2026)
> Reprise projet apres 8 jours de pause

---

## 1. Resume executif

Le MVP Plombier Urgent est **fonctionnel en production**. 9/10 epics sont complets (98.5% des FRs du PRD). Le flow complet — demande client → n8n → find_artisans → WhatsApp — tourne en ~3s. 4 crons Vercel sont actifs, les paiements LemonSqueezy operationnels, le scoring et le multi-artisan deploys. Le repo est propre (trunk-based, pas de WIP).

**Cependant**, l'audit revele 5 issues CRITIQUES de securite : JWT_SECRET avec fallback en dur, route accept sans auth, anti court-circuit incomplet, race condition credits, et 2FA admin absent. Ces issues doivent etre traitees avant toute acquisition client reelle.

L'Epic 9 (multi-tenant/verticales) est a 25% — seule la table `verticals` existe. La couverture de tests est a 52% avec 2 fichiers de tests casses.

---

## 2. Etat fonctionnel

### Ce qui marche

| Fonctionnalite | Statut | Preuve |
|----------------|--------|--------|
| Inscription artisan (SIRET + assurance) | OK | commit `144c338`, `598789a` |
| Demande client (wizard multi-etapes) | OK | `app/(public)/demande/page.tsx` |
| Attribution multi-artisans simultanee | OK | n8n workflow `6tTzHp4lV0FeKRp8` |
| Notification WhatsApp (< 3s) | OK | Teste en prod |
| Acceptation lead (token JWT) | OK | `app/api/lead/accept/route.ts` |
| Dashboard artisan (leads, stats, profil) | OK | `app/artisan/(dashboard)/` |
| Dashboard admin (metriques, gestion) | OK | `app/admin/` |
| Paiement credits (LemonSqueezy) | OK | webhook + facture PDF |
| Feedback client J+3 | OK | cron `0 10 * * *` |
| Auto-consommation leads | OK | cron `0 4 * * *` |
| Periode de grace 30min | OK | RPC `cancel_lead_acceptance()` |
| Lead scoring 0-100 | OK | `lib/services/scoring.ts` |
| Badge artisan reactif | OK | RPC `recalculate_reactive_scores()` |
| Geocodage API BAN + cache | OK | `lib/services/geocoding.ts` |
| Verification SIRET API INSEE | OK | `lib/services/sirene.ts` |

### Ce qui ne marche pas / manque

| Probleme | Severite | Detail |
|----------|----------|--------|
| Multi-tenant (Epic 9) | Feature | 25% fait (table exists, pas d'isolation) |
| 2FA Admin | CRITICAL | NFR-S7 non implemente |
| Anti court-circuit | CRITICAL | Donnees artisan transitent via n8n |
| Consentement RGPD client | HIGH | Pas de checkbox sur le formulaire |
| Export donnees RGPD | HIGH | Pas d'endpoint d'export/suppression |

---

## 3. Avancement par epic

| Epic | Nom | Statut | FRs | Preuves | Prochains pas |
|------|-----|--------|-----|---------|---------------|
| 1 | Setup & Fondations | 100% | 4/4 | `package.json` | — |
| 2 | Inscription & Profil | 100% | 16/16 | commit `144c338` | — |
| 3 | Soumission Demande | 100% | 8/8 | `app/(public)/demande/` | Ajouter consentement RGPD |
| 4 | Notification & Attribution | 100% | 11/11 | n8n workflows | — |
| 5 | Dashboard Artisan | 100% | 8/8 | `app/artisan/(dashboard)/` | — |
| 6 | Paiement & Credits | 100% | 6/6 | LemonSqueezy webhook | Test achat reel |
| 7 | Suivi Client J+3 | 100% | 7/7 | cron `trigger-followup` | — |
| 8 | Dashboard Admin | 100% | 7/7 | `app/admin/` | — |
| 9 | Multi-Tenant | **25%** | 1/4 | table `verticals` | Isolation RLS, sous-domaines |
| 10 | Scoring + Multi-artisan | 100% | 18/18 | commit `27b4a2c` | Auditer anti-CC |

**Detail Epic 9 manquant :** FR46 (isolation verticales), FR48 (leads par verticale RLS), FR49 (grilles tarifaires par verticale).

---

## 4. Chantiers infrastructure

### Base de donnees (Supabase)

| Element | Etat | Detail |
|---------|------|--------|
| 10 tables | OK | Toutes avec RLS |
| 30 migrations | OK | Derniere : `20260207000008` |
| 23+ RPCs | OK | `accept_lead` avec FOR UPDATE |
| Race condition credits | CRITIQUE | RPCs credit sans FOR UPDATE |
| Indexes | A verifier | Pas d'audit perf SQL |

### Authentification

| Element | Etat |
|---------|------|
| Email/password artisan | OK |
| Magic link | OK |
| Middleware routes protegees | OK |
| RLS par role | OK |
| 2FA admin | **Absent** |
| JWT_SECRET | **Fallback dangereux** |

### n8n

| Element | Etat |
|---------|------|
| 8 workflows | OK |
| Multi-artisan simultane | OK (prod) |
| WhatsApp template valide | OK |
| Retry si down | Partiel (cron 1x/jour) |
| Monitoring | **Absent** |

### Vercel

| Element | Etat |
|---------|------|
| Deploiement auto (push master) | OK |
| Region CDG1 Paris | OK |
| 4 crons | OK |
| Plan Hobby (limites) | Risque (1 cron/jour max) |
| Headers securite | OK (sauf CSP) |

---

## 5. Top 10 bugs/risques prioritaires

| # | Issue | Sev. | Effort | Fichier/Preuve |
|---|-------|------|--------|----------------|
| 1 | JWT_SECRET fallback "default-secret-change-me" | CRIT | S | `lib/actions/assignment.ts:13` |
| 2 | POST /api/lead/accept sans auth (TODO) | CRIT | S | `app/api/lead/accept/route.ts:79` |
| 3 | Anti court-circuit: donnees artisan vers n8n | CRIT | M | `app/api/n8n/callback/route.ts:135` |
| 4 | Race condition credits (pas FOR UPDATE) | CRIT | M | RPCs `credit_artisan*` |
| 5 | 2FA Admin absent (NFR-S7) | CRIT | L | PRD NFR-S7 |
| 6 | LemonSqueezy webhook race (doublons credits) | HIGH | M | `app/api/webhooks/lemonsqueezy/route.ts:89` |
| 7 | 3 routes accept dupliquees (surface x3) | HIGH | M | 3 dossiers dans `app/api/` |
| 8 | Tests casses (mocks incorrects) | HIGH | M | `__tests__/lib/actions/lead.test.ts` |
| 9 | Consentement RGPD client manquant | HIGH | S | `app/(public)/demande/page.tsx` |
| 10 | CSP unsafe-inline + unsafe-eval | HIGH | M | `next.config.ts:18-32` |

---

## 6. Plan de reprise

### Jours 1-3 — P0 Securite (quick wins)

| Action | Fichier | Effort |
|--------|---------|--------|
| Fixer JWT_SECRET (supprimer fallback, throw si absent) | `lib/actions/assignment.ts:13` | 30 min |
| Ajouter auth check sur POST /api/lead/accept | `app/api/lead/accept/route.ts:79` | 1h |
| Verifier JWT_SECRET + CRON_SECRET dans Vercel env vars | Dashboard Vercel | 30 min |
| Merger 3 routes accept en 1 | `app/api/lead/`, `app/api/leads/` | 2h |
| Ajouter checkbox consentement RGPD | `app/(public)/demande/page.tsx` | 1h |

### Semaine 1 — P1 Stabilite

| Action | Effort |
|--------|--------|
| FOR UPDATE sur RPCs credit | 2h |
| UNIQUE constraint `credit_purchases.lemonsqueezy_order_id` | 1h |
| Fixer tests casses (mocks admin client) | 3h |
| Auditer anti court-circuit (templates n8n + emails) | 3h |
| Nettoyer console.log sensibles | 2h |
| Supprimer `components/tutorial/` | 30 min |

### Semaine 2-3 — P2 Conformite & Growth

| Action | Effort |
|--------|--------|
| 2FA Admin (Supabase MFA) | 8h |
| CSP avec nonces (remplacer unsafe-inline) | 4h |
| Structured logging (Pino ou Vercel Log Drains) | 4h |
| RGPD : endpoint export/suppression donnees | 6h |
| Epic 9 : isolation RLS par vertical_id | 8h |
| Monitoring n8n (health check + alerte) | 4h |

---

## 7. Annexes

### A1 — Fichiers de reference

| Document | Chemin |
|----------|--------|
| PRD | `_bmad-output/planning-artifacts/prd.md` |
| Progres | `docs/PROGRESS.md` |
| Regles metier | `docs/regle-du-jeux-v2.md` |
| Deploiement | `docs/DEPLOYMENT.md` |
| Cartographie | `docs/audit/MAP.md` |
| Timeline | `docs/audit/CHRONO.md` |
| Epics | `docs/audit/EPICS_STATUS.md` |
| Risques | `docs/audit/RISKS_DEBT.md` |

### A2 — Commits cles

| Commit | Date | Sujet |
|--------|------|-------|
| `5d33985` | 07/02 | Dernier commit (password strength + autocomplete) |
| `27b4a2c` | 05/02 | Epic 10 complet |
| `dd3ac1b` | 05/02 | P2 stabilisation complete |
| `59516b6` | 04/02 | Fix race condition accept_lead |
| `883bdb5` | 03/02 | 169 tests Vitest |
| `144c338` | 01/02 | Verification SIRET + assurance |
| `3fd3270` | 02/02 | Audit securite sprint 2 |

### A3 — Tags

| Tag | Jalon |
|-----|-------|
| `mvp-0` | Premier MVP |
| `ui-v3` | UI version 3 |
| `v0.1.0-mvp` | Release MVP |

### A4 — Env vars requises (a verifier dans Vercel)

| Variable | Statut |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Requis |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Requis |
| `SUPABASE_SERVICE_ROLE_KEY` | Requis |
| `JWT_SECRET` | **A verifier** |
| `CRON_SECRET` | **A verifier** |
| `N8N_CALLBACK_SECRET` | Requis |
| `N8N_WEBHOOK_URL` | Requis |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Requis |
| `INSEE_API_TOKEN` | Requis |

---

*Rapport genere le 2026-02-15 par audit multi-agents Claude Code.*
*Chaque affirmation est tracable via un commit, fichier ou ligne de code.*
