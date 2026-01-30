# Deploiement Vercel - Plombier Urgent

## Prerequisites

- Compte [Vercel](https://vercel.com)
- Projet [Supabase](https://supabase.com) configure
- Compte [LemonSqueezy](https://lemonsqueezy.com) avec produits crees
- Instance [n8n](https://n8n.io) avec workflows actifs

## Variables d'Environnement

Configurer dans Vercel Dashboard > Settings > Environment Variables :

### Supabase (Obligatoire)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cle anonyme (publique) |
| `SUPABASE_SERVICE_ROLE_KEY` | Cle service (serveur uniquement) |

### n8n (Obligatoire)

| Variable | Description |
|----------|-------------|
| `N8N_WEBHOOK_URL` | URL webhook n8n pour lead-created |
| `NEXT_PUBLIC_APP_URL` | URL publique de l'app (ex: https://plombier-urgent.vercel.app) |

### LemonSqueezy (Obligatoire)

| Variable | Description |
|----------|-------------|
| `LEMONSQUEEZY_API_KEY` | Cle API LemonSqueezy |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | Secret pour valider webhooks |
| `LEMONSQUEEZY_STORE_ID` | ID du store |
| `NEXT_PUBLIC_LEMONSQUEEZY_STORE_ID` | ID du store (public) |
| `NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_STARTER` | Variant ID pack Starter |
| `NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_PRO` | Variant ID pack Pro |
| `NEXT_PUBLIC_LEMONSQUEEZY_VARIANT_ENTERPRISE` | Variant ID pack Enterprise |

## Etapes de Deploiement

### 1. Connexion Vercel

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Lier le projet
vercel link
```

### 2. Configuration Variables

```bash
# Ajouter chaque variable (production)
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# ... etc

# Ou via le dashboard Vercel (recommande)
```

### 3. Deploiement

```bash
# Preview (branche actuelle)
vercel

# Production
vercel --prod
```

### 4. Configuration Webhooks

Apres deploiement, configurer les callbacks :

#### LemonSqueezy
1. Dashboard LemonSqueezy > Settings > Webhooks
2. URL: `https://votre-domaine.vercel.app/api/webhooks/lemonsqueezy`
3. Events: `order_created`, `subscription_payment_success`

#### n8n
1. Mettre a jour `NEXT_PUBLIC_APP_URL` dans n8n avec l'URL Vercel
2. Tester le workflow lead-created

#### Supabase
1. Authentication > URL Configuration
2. Site URL: `https://votre-domaine.vercel.app`
3. Redirect URLs: Ajouter `https://votre-domaine.vercel.app/**`

## Domaine Personnalise

1. Vercel Dashboard > Domains
2. Ajouter votre domaine
3. Configurer DNS selon instructions Vercel

## Monitoring

- **Logs**: Vercel Dashboard > Deployments > Functions
- **Analytics**: Vercel Analytics (optionnel)
- **Errors**: Integrer Sentry si necessaire

## Checklist Pre-Production

- [ ] Variables d'environnement configurees
- [ ] Webhooks LemonSqueezy configures
- [ ] URL Supabase Auth mises a jour
- [ ] n8n workflows pointes vers URL production
- [ ] Test parcours client complet
- [ ] Test parcours artisan complet
- [ ] Test achat credits

## Rollback

```bash
# Lister les deploiements
vercel ls

# Rollback vers un deploiement specifique
vercel rollback [deployment-url]
```
