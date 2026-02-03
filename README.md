# Plombier Urgent

Plateforme de mise en relation entre clients et artisans plombiers pour interventions urgentes.

## Stack Technique

| Couche | Technologies |
|--------|--------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes, Server Actions |
| Database | Supabase PostgreSQL + RLS |
| Auth | Supabase Auth (magic link + password) |
| Paiements | LemonSqueezy |
| Notifications | n8n + Telegram (migration WhatsApp en cours) |

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
app/
├── (public)/           # Pages publiques (landing, demande)
├── admin/              # Dashboard admin
├── artisan/            # Espace artisan (dashboard, leads, profil)
├── api/                # API Routes
│   ├── leads/          # Gestion leads
│   ├── webhooks/       # Webhooks (n8n, LemonSqueezy)
│   └── feedback/       # Retours clients J+3
└── auth/               # Authentification
```

## Workflows n8n

| Workflow | Description |
|----------|-------------|
| Lead Created | Notification artisans (Telegram/WhatsApp) |
| Lead Accepted | Confirmation au client |
| Followup J+3 | Relance client pour notation |

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
