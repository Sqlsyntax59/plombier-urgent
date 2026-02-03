# Plombier Urgent - Statut du Projet

**Dernière mise à jour:** 2026-02-03
**Version:** v1.2.0
**Statut global:** MVP COMPLET - EN ATTENTE VALIDATION WHATSAPP

---

## Infrastructure

| Service | Status | URL / Config |
|---------|--------|--------------|
| **Vercel** | ✅ Déployé | https://plombier-urgent.vercel.app |
| **GitHub** | ✅ Public | https://github.com/Sqlsyntax59/plombier-urgent |
| **Supabase** | ✅ Production | 10 migrations, RLS activé |
| **n8n VPS** | ✅ Configuré | https://vmi3051008.contaboserver.net |
| **Telegram Bot** | ⏸️ Désactivé | Remplacé par WhatsApp |
| **LemonSqueezy** | ⚠️ À vérifier | Webhooks à tester en prod |
| **WhatsApp Cloud** | ⏳ En attente | Template `lead_notification` soumis à Meta |
| **Firebase Storage** | ✅ Actif | Upload photos clients |
| **Resend** | ✅ Configuré | Emails transactionnels

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
| 8 | Dashboard Admin | ✅ DONE | `5f1a6df` |
| 9 | Multi-Tenant & Verticales | ❌ BACKLOG | Prévu post-MVP |

**Progress:** 8/9 Epics (89%) - MVP Fonctionnel

---

## UI/UX - Version 4 (Dark Premium)

**Status:** ✅ Déployé le 03/02/2026

### Landing Page - Redesign complet
- [x] Theme dark premium (`#0a0f1a`)
- [x] Background animé (orbes gradient + grid pattern)
- [x] Hero avec gradient animé "2 minutes"
- [x] Stats avec compteurs animés au scroll (IntersectionObserver)
- [x] Cards services avec images Unsplash HD
- [x] Hover effects (lift, zoom, glow)
- [x] Timeline "Comment ça marche" avec connexion visuelle
- [x] Carousel témoignages avec avatars
- [x] CTA final avec badge "disponible maintenant"
- [x] Header glassmorphism avec backdrop-blur
- [x] Footer premium avec sections organisées

### Autres pages (V3)
- [x] Formulaire demande (wizard multi-étapes, icônes colorées)
- [x] Dashboard artisan (sidebar responsive, header glassmorphism)
- [x] Page leads (cards avec icônes, badges statut)
- [x] Page profil (formulaire sectionné, sidebar conseils)
- [x] Page crédits (packs gradients, badge populaire)
- [x] Login artisan (tabs password/magic link)
- [x] Inscription artisan (sections avec icônes, avantages)

### Design tokens Landing
- Background: `bg-[#0a0f1a]` (dark)
- Gradients: `from-blue-500 to-cyan-400`, `from-orange-500 to-red-500`
- Cards: `bg-white/[0.08] border-white/10`
- Glow: `blur-xl opacity-50`

---

## Features Récentes

### 3 février 2026
- ✅ **Landing Page V4 - Dark Premium Redesign**
  - Theme sombre professionnel (#0a0f1a)
  - Background avec orbes gradient animés + grid pattern
  - Compteurs stats animés au scroll (500+, 2min, 98%, 24/7)
  - Cards services avec images Unsplash HD (6 types de pannes)
  - Hover effects: lift, zoom image, glow blur
  - Timeline "Comment ça marche" connectée
  - Carousel témoignages avec avatars et dates
  - Header/Footer glassmorphism premium
  - Commits: `f834c3b`, `c2b5d6b`, `651b4a4`, `4019757`
- ✅ Fix API INSEE (nouveau portail, header `X-INSEE-Api-Key-Integration`)
- ✅ Story 2.1: Vérification SIRET + assurance artisan
- ✅ Audit complet du projet (PRD, architecture, epics)
- ✅ Migration WhatsApp Cloud API avancée
  - Workflow n8n complet (`01-lead-created-whatsapp.json`)
  - Template `lead_notification` soumis à Meta Business
  - 4 paramètres body + bouton CTA dynamique
  - Credential `WhatsApp Cloud API` configuré dans n8n
- ⏳ En attente validation template Meta (quelques heures à 24h)

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
| 1 | Lead Created - Telegram | Webhook POST | ⏸️ Désactivé (remplacé) |
| 2 | Lead Created - WhatsApp | Webhook POST | ⏳ Prêt (attente template Meta) |
| 3 | Lead Accepted - Email | Webhook POST | ✅ Configuré |
| 4 | Followup J+3 - Feedback | Schedule | ✅ Configuré |

**Fichiers locaux:** `n8n-workflows/*.json`
- `01-lead-created-whatsapp.json` - Flow complet avec template `lead_notification`
- `test-whatsapp-hello-world.json` - Test sandbox

---

## TODO - Prochaines étapes

### P0 - Bloqueurs production
- [x] Migrer Telegram → WhatsApp Cloud API
  - [x] Workflow n8n créé
  - [x] Template `lead_notification` soumis à Meta
  - [ ] Attendre validation Meta (en cours)
  - [ ] Activer workflow après validation
- [ ] Vérifier LemonSqueezy en prod (tester un achat réel)
- [ ] Tests E2E flows critiques (lead → notif → accept)

### P1 - Epic 8 (Admin Dashboard) ✅ DONE
- [x] Page métriques (leads/jour, taux réponse, artisans actifs)
- [x] Modération artisans (disable, reset crédits)
- [x] Historique leads avec filtres et export CSV
- [x] Opérations manuelles crédits (attribution gratuite)
- [x] Gestion réclamations clients

### P2 - Améliorations
- [x] Landing page V4 dark premium (redesign complet)
- [x] Images HD services (Unsplash)
- [x] Animations scroll (compteurs, hover effects)
- [ ] Lead scoring (urgence, photo, description)
- [ ] Badge "Artisan Réactif"
- [x] Alertes artisan (3 leads manqués = suspension auto)
- [x] README.md projet à jour

### P3 - Growth (post-MVP) - Epic 9
- [ ] Multi-verticales (électricien, serrurier, vitrier)
- [ ] App mobile artisans (React Native)
- [ ] Chatbot WhatsApp conversationnel
- [ ] Lead scoring AI

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

*Ce fichier est mis à jour manuellement. Dernière révision: 2026-02-03*
