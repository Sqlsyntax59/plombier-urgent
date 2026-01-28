# Story 1.4: Structure de Fichiers et Layout de Base

Status: done

## Story

As a **developpeur**,
I want **creer la structure de fichiers et les layouts de base**,
so that **l'architecture du projet est organisee selon les conventions definies**.

## Acceptance Criteria

1. **AC1 - Route groups crees**
   - **Given** le projet initialise avec shadcn/ui
   - **When** je cree les dossiers pour les zones (public), (artisan), (admin)
   - **Then** chaque route group a son layout.tsx
   - **And** les layouts sont differencies (public = minimaliste, artisan/admin = sidebar)

2. **AC2 - Dossiers de base crees**
   - **Given** la structure Next.js existante
   - **When** je cree les dossiers utilitaires
   - **Then** `/lib`, `/types`, `/components/forms`, `/components/dashboard` existent
   - **And** chaque dossier a un fichier index ou placeholder

3. **AC3 - Navigation de base**
   - **Given** les route groups et layouts crees
   - **When** je navigue entre les zones
   - **Then** chaque zone s'affiche avec son layout propre
   - **And** les liens de test permettent de basculer entre zones

## Tasks / Subtasks

- [ ] Task 1: Creer les route groups (AC: 1)
  - [ ] 1.1: Creer `app/(public)/layout.tsx`
  - [ ] 1.2: Creer `app/(artisan)/layout.tsx`
  - [ ] 1.3: Creer `app/(admin)/layout.tsx`

- [ ] Task 2: Creer les dossiers utilitaires (AC: 2)
  - [ ] 2.1: Creer `lib/` avec utils.ts (deja present via shadcn)
  - [ ] 2.2: Creer `types/index.ts` placeholder
  - [ ] 2.3: Creer `components/forms/` placeholder
  - [ ] 2.4: Creer `components/dashboard/` placeholder

- [ ] Task 3: Creer pages placeholder navigation (AC: 3)
  - [ ] 3.1: Page placeholder `app/(public)/page.tsx`
  - [ ] 3.2: Page placeholder `app/(artisan)/dashboard/page.tsx`
  - [ ] 3.3: Page placeholder `app/(admin)/dashboard/page.tsx`

## Dev Notes

### Architecture Requirements

**Route Groups (depuis architecture.md):**
- `(public)` : Routes anonymes (landing, formulaire client)
- `(artisan)` : Routes auth artisan (dashboard, leads, profil)
- `(admin)` : Routes auth admin + 2FA (dashboard, artisans, leads)

**Structure cible (corrigee - segments URL explicites):**
```text
app/
  (public)/
    layout.tsx      # Minimaliste, header simple
    page.tsx        # Placeholder landing → /
  artisan/          # Segment URL explicite /artisan/*
    layout.tsx      # Sidebar navigation artisan
    dashboard/
      page.tsx      # → /artisan/dashboard
  admin/            # Segment URL explicite /admin/*
    layout.tsx      # Sidebar navigation admin
    dashboard/
      page.tsx      # → /admin/dashboard
lib/
  utils.ts          # Deja present (shadcn)
types/
  index.ts          # Types globaux
components/
  forms/
    index.ts        # Exports formulaires
  dashboard/
    index.ts        # Exports dashboard
```

### References

- [Source: architecture.md#Frontend-Structure]
- [Source: epics.md#Story-1.4]

## Dev Agent Record

### File List

Files crees :
- `app/(public)/layout.tsx`
- `app/(public)/page.tsx`
- `app/(artisan)/layout.tsx`
- `app/(artisan)/dashboard/page.tsx`
- `app/(admin)/layout.tsx`
- `app/(admin)/dashboard/page.tsx`
- `types/index.ts`
- `components/forms/index.ts`
- `components/dashboard/index.ts`

### Change Log

| Date       | Description                           |
|------------|---------------------------------------|
| 2026-01-28 | Story creee et implementation lancee |
