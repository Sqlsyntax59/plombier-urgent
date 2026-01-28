# Story 1.1: Initialisation du Projet Next.js

Status: done

## Story

As a **développeur**,
I want **initialiser le projet avec le starter Vercel Supabase**,
so that **j'ai une base de code fonctionnelle avec l'authentification configurée**.

## Acceptance Criteria

1. **AC1 - Projet créé avec starter template**
   - **Given** un environnement de développement configuré (Node.js 18+, npm/pnpm)
   - **When** j'exécute `npx create-next-app@latest plombier-urgent -e with-supabase`
   - **Then** le projet Next.js 15 est créé avec App Router activé
   - **And** le dossier `plombier-urgent/` contient la structure de base

2. **AC2 - Tailwind CSS configuré**
   - **Given** le projet créé
   - **When** je vérifie la configuration
   - **Then** `tailwind.config.ts` existe avec la config de base
   - **And** `globals.css` contient les directives Tailwind (@tailwind base/components/utilities)

3. **AC3 - TypeScript configuré**
   - **Given** le projet créé
   - **When** je vérifie `tsconfig.json`
   - **Then** TypeScript strict mode est activé
   - **And** les paths aliases sont configurés (@/)

4. **AC4 - Projet compile sans erreur**
   - **Given** le projet initialisé
   - **When** j'exécute `npm run dev` ou `pnpm dev`
   - **Then** le serveur démarre sans erreur
   - **And** la page d'accueil s'affiche sur `http://localhost:3000`

## Tasks / Subtasks

- [x] Task 1: Exécuter la commande d'initialisation (AC: 1)
  - [x] 1.1: Vérifier Node.js >= 18 installé (`node -v`) → v22.22.0
  - [x] 1.2: Exécuter `npx create-next-app@latest plombier-urgent -e with-supabase`
  - [x] 1.3: Répondre aux prompts interactifs (--yes flag utilisé)
  - [x] 1.4: Vérifier que le dossier projet est créé

- [x] Task 2: Valider la structure du projet (AC: 1, 2, 3)
  - [x] 2.1: Vérifier l'existence de `/app/layout.tsx` et `/app/page.tsx`
  - [x] 2.2: Vérifier `tailwind.config.ts` présent
  - [x] 2.3: Vérifier `tsconfig.json` avec `strict: true`
  - [x] 2.4: Vérifier les fichiers Supabase (`/lib/supabase/client.ts`, `server.ts`, `proxy.ts`)

- [x] Task 3: Lancer et tester le projet (AC: 4)
  - [x] 3.1: Dépendances installées automatiquement (409 packages)
  - [x] 3.2: Lancer le serveur de développement (`npm run dev`)
  - [x] 3.3: Accéder à `http://localhost:3000` → HTTP 200
  - [x] 3.4: Build réussi sans erreur (`npm run build`)

- [x] Task 4: Documenter l'environnement
  - [x] 4.1: Version Next.js: 16.1.5 (Turbopack)
  - [x] 4.2: `.env.example` existe avec variables Supabase
  - [x] 4.3: `.gitignore` inclut `.env*.local` et `.env`

## Dev Notes

### Architecture Requirements

**Commande d'initialisation exacte:**
```bash
npx create-next-app@latest plombier-urgent -e with-supabase
```

**Stack attendu après initialisation:**

- Next.js 15 avec App Router
- TypeScript (strict mode)
- Tailwind CSS
- Supabase Auth helpers (cookies SSR)

**Structure minimale attendue:**

```text
plombier-urgent/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
├── lib/
│   └── supabase/ (ou utils/supabase/)
├── public/
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts (ou .mjs)
├── package.json
└── .env.local.example
```

**Variables d'environnement requises (à configurer dans Story 1.2):**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Technical Constraints

1. **Node.js version**: Minimum 18.17 (Next.js 15 requirement)
2. **Package manager**: npm ou pnpm (recommandé: pnpm pour performance)
3. **Port dev**: 3000 par défaut

### Conventions à respecter

Depuis le document Architecture:

- **Nommage composants**: PascalCase (`LeadForm.tsx`)
- **Nommage variables**: camelCase
- **Structure routes**: App Router avec route groups `(public)`, `(artisan)`, `(admin)`

### Project Structure Notes

Cette story établit la fondation. Les stories suivantes ajouteront:

- Story 1.2: Configuration Supabase et schéma DB
- Story 1.3: shadcn/ui et composants de base
- Story 1.4: Structure fichiers et layouts

### References

- [Source: architecture.md#Selected-Starter] - Starter Vercel Supabase
- [Source: architecture.md#Core-Architectural-Decisions] - Stack technologique
- [Source: architecture.md#Project-Structure-Boundaries] - Structure projet cible
- [Source: epics.md#Story-1.1] - Critères d'acceptation originaux

### Testing Requirements

**Validation manuelle pour cette story:**

1. Le projet compile (`npm run build` sans erreur)
2. Le serveur dev démarre (`npm run dev`)
3. La page d'accueil s'affiche dans le navigateur

**Pas de tests automatisés requis** - C'est une story d'initialisation.

### Latest Tech Information

**Next.js 15 (janvier 2026):**

- App Router stable
- Server Components par défaut
- Turbopack en dev
- React 19 support

**Supabase JS v2:**

- Auth helpers intégrés pour SSR
- createServerClient / createBrowserClient

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Aucun (story d'initialisation)

### Completion Notes List

- [x] Projet créé le 2026-01-27
- [x] Version Next.js: 16.1.5 (avec Turbopack)
- [x] Package manager utilisé: npm
- [x] React 19, TypeScript 5, Tailwind 3.4.1
- [x] Supabase SSR helpers inclus (@supabase/ssr)

### File List

Files créés (via template):

- `plombier-urgent/` - Dossier projet complet généré par le starter
- `plombier-urgent/app/` - App Router avec layout.tsx, page.tsx, globals.css
- `plombier-urgent/lib/supabase/` - client.ts, server.ts, proxy.ts
- `plombier-urgent/components/` - Composants UI de base
- `plombier-urgent/tailwind.config.ts` - Config Tailwind avec shadcn/ui
- `plombier-urgent/tsconfig.json` - TypeScript strict mode + paths aliases

### Change Log

| Date       | Description                                |
|------------|--------------------------------------------|
| 2026-01-27 | Story créée par create-story workflow      |
| 2026-01-27 | Implémentation complète - tous ACs validés |
