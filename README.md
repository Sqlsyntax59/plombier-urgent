# Plombier Urgent

Plateforme de mise en relation entre clients et artisans plombiers pour interventions urgentes.

**Version:** v1.2.0 | **Statut:** MVP 89% | **Production:** https://plombier-urgent.vercel.app

## Métriques Projet

| Métrique | Valeur |
|----------|--------|
| Fichiers TypeScript | 115 |
| Lignes de code | ~6,011 |
| Composants React | 31 |
| Routes API | 16 |
| Migrations SQL | 23 |

## Stack Technique

| Couche | Technologies |
|--------|--------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes, Server Actions |
| Database | Supabase PostgreSQL + RLS |
| Auth | Supabase Auth (magic link + password) |
| Paiements | LemonSqueezy |
| Notifications | n8n + WhatsApp Cloud API (template en attente Meta) |
| Emails | Resend |
| Storage | Firebase Storage (photos clients) |
| Validation | API INSEE Sirene (SIRET) |

## Fonctionnalités

### Client
- **Landing page premium** (dark theme, animations, images HD)
- Formulaire de demande d'intervention (wizard multi-étapes)
- Description guidée par type de panne
- Upload photos
- Suivi J+3 avec notation artisan

### Artisan
- Inscription avec spécialisations
- Dashboard avec statistiques
- Réception leads par notification
- Système de crédits pour accepter les leads
- Profil public

### Admin
- Dashboard métriques temps réel
- Gestion artisans (activation/suspension)
- Attribution crédits gratuits
- Historique leads avec export CSV
- Gestion réclamations clients

## Installation

```bash
# Cloner le repo
git clone https://github.com/Sqlsyntax59/plombier-urgent.git
cd plombier-urgent

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés Supabase

# Lancer en dev
npm run dev
```

## Variables d'Environnement

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
LEMONSQUEEZY_WEBHOOK_SECRET=
N8N_WEBHOOK_URL=
```

## Structure du Projet

```
plombier-urgent/
├── app/                    # Next.js App Router (48 fichiers)
│   ├── (public)/          # Pages publiques (landing, demande, CGV)
│   ├── admin/             # Dashboard admin (6 pages)
│   ├── artisan/           # Espace artisan (dashboard, leads, profil, crédits)
│   ├── api/               # 16 routes API
│   ├── auth/              # Authentification Supabase
│   └── feedback/          # Retour clients J+3
├── components/            # 31 composants React (UI + métier)
├── lib/                   # 19 fichiers utilitaires
│   ├── actions/          # Server Actions (7 fichiers)
│   ├── services/         # Services métier (3 fichiers)
│   └── validations/      # Schémas Zod
├── supabase/
│   └── migrations/       # 23 migrations SQL
├── n8n-workflows/        # 6 workflows JSON
└── docs/                 # Documentation
```

## Workflows n8n

| Workflow | Fichier | Statut |
|----------|---------|--------|
| Lead Created - WhatsApp | `01-lead-created-whatsapp.json` | ⏳ Attente Meta |
| Lead Created - Telegram | `01-lead-created-telegram.json` | ⏸️ Désactivé |
| Lead Accepted - Email | `02-lead-accepted-email.json` | ✅ Actif |
| Followup J+3 | `03-followup-j3-feedback.json` | ✅ Actif |
| Cascade Attribution | `lead-created-cascade.json` | ✅ Actif |

Les fichiers JSON sont dans `n8n-workflows/`.

## Déploiement

Le projet est déployé automatiquement sur Vercel à chaque push sur `master`.

- **Production**: https://plombier-urgent.vercel.app
- **n8n**: https://vmi3051008.contaboserver.net

## Commandes

```bash
npm run dev      # Développement local
npm run build    # Build production
npm run start    # Serveur production
npm run lint     # Linting ESLint
```

## Statut

Voir [PROJECT_STATUS.md](PROJECT_STATUS.md) pour le suivi détaillé des epics et features.

## Licence

Propriétaire - Tous droits réservés
