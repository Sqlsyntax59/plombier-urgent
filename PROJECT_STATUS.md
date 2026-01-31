# Plombier Urgent - Statut du Projet

**Dernière mise à jour:** 2026-01-31
**Version:** v1.1.0
**Statut global:** MVP + ADMIN DASHBOARD

---

## Infrastructure

| Service | Status | URL / Config |
|---------|--------|--------------|
| **Vercel** | ✅ Déployé | https://plombier-urgent.vercel.app |
| **GitHub** | ✅ Public | https://github.com/Sqlsyntax59/plombier-urgent |
| **Supabase** | ✅ Production | Connecté (env vars configurées) |
| **n8n VPS** | ✅ Configuré | https://vmi3051008.contaboserver.net |
| **Telegram Bot** | ✅ Actif | Notifications artisans |
| **LemonSqueezy** | ⚠️ À vérifier | Paiements artisans |
| **WhatsApp Cloud** | ❌ Non migré | Encore sur Telegram (dev) |

---

## Epics - Statut

| # | Epic | Status | Dernier commit |
|---|------|--------|----------------|
| 1 | Setup Projet & Fondations | ✅ DONE | `9caf28c` |
| 2 | Inscription & Profil Artisan | ✅ DONE | `3137b74` |
| 3 | Soumission Demande Client | ✅ DONE | `b12db6b` |
| 4 | Notification & Attribution Leads | ✅ DONE | `37e11ac` |
| 5 | Dashboard Artisan | ✅ DONE | `3d176d8` |
| 6 | Paiement & Crédits (LemonSqueezy) | ✅ DONE | `4a1bfad` |
| 7 | Suivi Client J+3 & Ratings | ✅ DONE | `495dfe9` |
| 8 | Dashboard Admin | ✅ DONE | `pending` |
| 9 | Multi-Tenant & Verticales | ❌ BACKLOG | Prévu post-MVP |

**Progress:** 8/9 Epics (89%)

---

## UI/UX - Version 3

**Status:** ✅ Déployé (PR #1 mergée le 30/01/2026)

### Pages redesignées
- [x] Landing page (hero gradient, stats animées, témoignages)
- [x] Formulaire demande (wizard multi-étapes, icônes colorées)
- [x] Dashboard artisan (sidebar responsive, header glassmorphism)
- [x] Page leads (cards avec icônes, badges statut)
- [x] Page profil (formulaire sectionné, sidebar conseils)
- [x] Page crédits (packs gradients, badge populaire)
- [x] Login artisan (tabs password/magic link)
- [x] Inscription artisan (sections avec icônes, avantages)

### Design tokens
- Background: `gradient-to-br from-slate-100 via-blue-50 via-purple-50/30 to-white`
- Cards: `bg-white/90 backdrop-blur border-slate-200/80`
- Shadows: `shadow-lg shadow-slate-900/[0.08]`

---

## Features Récentes (Janvier 2026)

### 31 janvier 2026
- ✅ Epic 8: Dashboard Admin complet
  - Dashboard métriques temps réel (artisans, leads, CA, temps réponse)
  - Liste artisans avec filtres, recherche, pagination
  - Actions admin: activer/désactiver/suspendre artisans
  - Attribution crédits gratuits
  - Gestion réclamations clients (feedbacks négatifs)
  - Historique leads avec filtres et export CSV
  - Désactivation auto après 3 leads ratés consécutifs

### 30 janvier 2026
- ✅ UI V3 complète (PR #1 mergée)
- ✅ Premium gradient mesh background
- ✅ CGV page + spécialisations artisans
- ✅ Descriptif guidé (questions dynamiques par type de panne)
- ✅ field_summary persisté en DB
- ✅ Détection urgence automatique (isUrgent, urgencyReason)
- ✅ Fix n8n: $json.body prefix pour webhooks
- ✅ Fix routes publiques (lead-accepted, lead-error)

### 29 janvier 2026
- ✅ Epic 7: Followup J+3 + ratings
- ✅ Epic 6: Paiements LemonSqueezy

### 28 janvier 2026
- ✅ Epic 5: Dashboard artisan complet
- ✅ Epic 4: Notifications multi-canal + cascade

---

## Stack Technique

| Couche | Technologies |
|--------|--------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind, shadcn/ui |
| Backend | Next.js API Routes, Server Actions |
| Database | Supabase PostgreSQL 16 + RLS |
| Auth | Supabase Auth (magic link + password) |
| Payments | LemonSqueezy (webhooks) |
| Files | Firebase Storage (photos clients) |
| Notifications | n8n → Telegram (prod: WhatsApp) |

---

## Base de Données

### Migrations (10 fichiers)
```
20260128000001: verticals
20260128000002: profiles
20260128000003: artisan_fields
20260128000004: cgv_accepted_at
20260128000005: public_profile_fields
20260128000006: leads
20260128000007: price_ranges
20260128000008: lead_assignments
20260128000009: credit_purchases
20260128000010: client_feedback
```

### Tables principales
- `profiles` - Artisans avec crédits
- `leads` - Demandes clients (+ field_summary)
- `lead_assignments` - Attribution avec cascade
- `credit_purchases` - Paiements LemonSqueezy
- `client_feedback` - Notes J+3

---

## Workflows n8n

| # | Nom | Trigger | Status |
|---|-----|---------|--------|
| 1 | Lead Created - Telegram | Webhook POST | ✅ Actif |
| 2 | Lead Accepted - Email | Webhook POST | ✅ Config |
| 3 | Followup J+3 - Feedback | Schedule | ✅ Config |

**Fichiers:** `n8n-workflows/*.json`

---

## TODO - Prochaines étapes

### P0 - Bloqueurs production
- [ ] Migrer Telegram → WhatsApp Cloud API
- [ ] Vérifier LemonSqueezy en prod (webhooks actifs?)
- [ ] Tests E2E flows critiques

### P1 - Epic 8 (Admin Dashboard) ✅ DONE
- [x] Page métriques (leads/jour, taux réponse, artisans actifs)
- [x] Modération artisans (disable, reset crédits)
- [x] Historique leads avec filtres et export CSV
- [x] Opérations manuelles crédits (attribution gratuite)
- [x] Gestion réclamations clients

### P2 - Améliorations
- [ ] Lead scoring (urgence, photo, description)
- [ ] Badge "Artisan Réactif"
- [x] Alertes artisan (3 leads manqués = suspension auto)
- [ ] README.md projet à jour

### P3 - Growth (post-MVP)
- [ ] Multi-verticales (électricien, serrurier)
- [ ] App mobile artisans
- [ ] Chatbot WhatsApp conversationnel

---

## Commandes Utiles

```bash
# Dev local
npm run dev

# Build
npm run build

# Déploiement (auto via Vercel)
git push origin master

# Supabase migrations
npx supabase db push
```

---

## Contacts & Ressources

- **Repo:** https://github.com/Sqlsyntax59/plombier-urgent
- **Prod:** https://plombier-urgent.vercel.app
- **n8n:** https://vmi3051008.contaboserver.net
- **Supabase:** Dashboard Supabase (projet plombier-urgent)

---

*Ce fichier est mis à jour manuellement. Dernière révision: 2026-01-31*
