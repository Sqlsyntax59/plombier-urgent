# Story 1.3: Installation shadcn/ui et Composants de Base

Status: ready-for-dev

## Story

As a **développeur**,
I want **installer shadcn/ui et configurer les composants de base**,
so that **j'ai une bibliothèque de composants UI cohérente et stylée**.

## Acceptance Criteria

1. **AC1 - shadcn/ui initialisé**
   - **Given** le projet avec Tailwind CSS configuré (Story 1.1)
   - **When** j'exécute `npx shadcn@latest init`
   - **Then** le fichier `components.json` est créé à la racine
   - **And** les dépendances nécessaires sont installées
   - **And** `tailwind.config.ts` est mis à jour avec les CSS variables

2. **AC2 - Composants essentiels installés**
   - **Given** shadcn/ui initialisé
   - **When** j'installe les composants : Button, Input, Card, Form, Label, Textarea
   - **Then** les fichiers sont créés dans `components/ui/`
   - **And** chaque composant est importable

3. **AC3 - Thème personnalisé appliqué**
   - **Given** les composants shadcn/ui installés
   - **When** je configure la palette dans `globals.css`
   - **Then** Primary = Bleu confiance (`#2563eb`)
   - **And** Success = Vert validation (`#16a34a`)
   - **And** Destructive = Orange alerte (`#ea580c`)
   - **And** Background = Gris clair (`#f8fafc`)

4. **AC4 - Composants s'affichent correctement**
   - **Given** les composants et le thème configurés
   - **When** je crée une page de test avec les composants
   - **Then** tous les composants s'affichent avec le bon style
   - **And** les variants (primary, secondary, outline) fonctionnent
   - **And** les états (hover, focus, disabled) sont visuellement distincts

## Tasks / Subtasks

- [ ] Task 1: Initialiser shadcn/ui (AC: 1)
  - [ ] 1.1: Exécuter `npx shadcn@latest init`
  - [ ] 1.2: Choisir les options : TypeScript, style "New York", RSC activé
  - [ ] 1.3: Vérifier la création de `components.json`
  - [ ] 1.4: Vérifier les modifications de `tailwind.config.ts`

- [ ] Task 2: Installer les composants essentiels (AC: 2)
  - [ ] 2.1: `npx shadcn@latest add button`
  - [ ] 2.2: `npx shadcn@latest add input`
  - [ ] 2.3: `npx shadcn@latest add card`
  - [ ] 2.4: `npx shadcn@latest add form`
  - [ ] 2.5: `npx shadcn@latest add label`
  - [ ] 2.6: `npx shadcn@latest add textarea`
  - [ ] 2.7: `npx shadcn@latest add select` (pour type de panne)

- [ ] Task 3: Configurer la palette de couleurs (AC: 3)
  - [ ] 3.1: Modifier les CSS variables dans `app/globals.css`
  - [ ] 3.2: Définir `--primary` avec HSL de #2563eb (bleu)
  - [ ] 3.3: Définir `--success` / `--destructive` avec orange #ea580c
  - [ ] 3.4: Définir `--background` avec #f8fafc (gris clair)
  - [ ] 3.5: Ajouter police Inter si configurée (UX design)

- [ ] Task 4: Créer page de test composants (AC: 4)
  - [ ] 4.1: Créer `app/(public)/test-ui/page.tsx` (temporaire)
  - [ ] 4.2: Afficher chaque composant avec tous les variants
  - [ ] 4.3: Vérifier rendu visuel et états
  - [ ] 4.4: Supprimer la page test après validation

## Dev Notes

### Architecture Requirements

**Stack UI (depuis architecture.md):**
- Framework : shadcn/ui + Tailwind CSS
- Style : "New York" (recommandé pour esthétique moderne)
- Support RSC : Activé (App Router)

**Palette de couleurs (depuis architecture.md#UI-Design-Directive):**

| Couleur | Usage | Hex | HSL (pour CSS vars) |
|---------|-------|-----|---------------------|
| Primary | CTA, liens actifs | #2563eb | 217 91% 60% |
| Success | Validation, confirmations | #16a34a | 142 76% 36% |
| Warning/Destructive | Alertes, erreurs | #ea580c | 21 90% 48% |
| Background | Fond général | #f8fafc | 210 40% 98% |
| Foreground | Texte principal | #0f172a | 222 47% 11% |

**Composants essentiels pour MVP:**

| Composant | Usage principal |
|-----------|-----------------|
| Button | CTA, actions |
| Input | Formulaires texte |
| Textarea | Description problème |
| Card | Leads, stats |
| Form | Validation React Hook Form + Zod |
| Label | Accessibilité formulaires |
| Select | Type de panne |

### Technical Constraints

1. **shadcn/ui CLI :** Utiliser `npx shadcn@latest` (pas `npx shadcn-ui`)
2. **Tailwind CSS :** Déjà configuré par le starter Supabase
3. **CSS Variables :** shadcn/ui utilise HSL, convertir les hex
4. **React Hook Form :** Le composant Form est wrapper pour RHF + Zod

### Previous Story Intelligence (1.2)

- **Projet initialisé** avec Next.js 15 + Tailwind CSS + Supabase
- **Package manager** : npm
- **Turbopack** : Activé en dev
- **Structure existante** :
  ```
  plombier-urgent/
  ├── app/
  │   ├── globals.css       # À modifier pour palette
  │   └── layout.tsx
  ├── components/           # Existe déjà (peut être vide)
  └── tailwind.config.ts    # Sera modifié par shadcn init
  ```

### UX Design Notes (ux_design.md)

**Style général :**
- Radius : `rounded-2xl` pour esthétique douce
- Padding : Minimum `p-4`, souvent `p-6` pour confort
- Police : Sans serif moderne (Inter recommandée)
- Animations : Subtiles (framer-motion - optionnel)

**Ton visuel :**
- Minimalisme affirmé, pas de distractions
- Différenciation pages publiques (accueillant) vs dashboards (professionnel)

### Project Structure Notes

Fichiers créés/modifiés par cette story :

```text
plombier-urgent/
├── components.json              # Créé par shadcn init
├── app/
│   └── globals.css              # Modifié pour CSS variables
├── tailwind.config.ts           # Modifié par shadcn init
├── lib/
│   └── utils.ts                 # Créé par shadcn init (cn helper)
└── components/
    └── ui/
        ├── button.tsx           # Créé
        ├── input.tsx            # Créé
        ├── textarea.tsx         # Créé
        ├── card.tsx             # Créé
        ├── form.tsx             # Créé
        ├── label.tsx            # Créé
        └── select.tsx           # Créé
```

### References

- [Source: architecture.md#Frontend-Architecture] - shadcn/ui + Tailwind
- [Source: architecture.md#UI-Design-Directive] - Palette couleurs
- [Source: epics.md#Story-1.3] - Critères d'acceptation originaux
- [Source: ux_design.md] - Guidelines visuelles

### Testing Requirements

**Validation manuelle :**

1. `npm run dev` démarre sans erreur
2. Page test affiche tous les composants
3. Couleur Primary = bleu (#2563eb) sur les Button variant="default"
4. Tous les variants de Button fonctionnent (default, secondary, outline, ghost, destructive)
5. Les états hover/focus/disabled sont visuellement distincts

**Checklist visuelle :**

- [ ] Button default = fond bleu, texte blanc
- [ ] Button secondary = fond gris, texte sombre
- [ ] Button outline = bordure, fond transparent
- [ ] Button destructive = fond orange/rouge
- [ ] Input avec focus = outline bleu
- [ ] Card avec padding et radius corrects

### Latest Tech Information

**shadcn/ui CLI (janvier 2026):**

```bash
# Initialisation
npx shadcn@latest init

# Options recommandées pour ce projet:
# - TypeScript: yes
# - Style: New York
# - Base color: Slate
# - CSS variables: yes
# - React Server Components: yes
# - Import alias: @/components

# Ajout composants
npx shadcn@latest add button input card form label textarea select
```

**CSS Variables shadcn/ui :**

Les couleurs sont en HSL sans fonction `hsl()` :

```css
:root {
  --primary: 217 91% 60%;           /* #2563eb bleu */
  --primary-foreground: 210 40% 98%;
  /* ... */
}
```

**dépendances installées par Form :**
- react-hook-form
- @hookform/resolvers (pour Zod)

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

- Aucun (story de configuration)

### Completion Notes List

- [ ] shadcn/ui initialisé le {{date}}
- [ ] Composants installés : button, input, card, form, label, textarea, select
- [ ] Palette personnalisée appliquée
- [ ] Page test validée puis supprimée

### File List

Files créés :
- `components.json` - Configuration shadcn/ui
- `lib/utils.ts` - Helper cn() pour classes conditionnelles
- `components/ui/button.tsx`
- `components/ui/input.tsx`
- `components/ui/textarea.tsx`
- `components/ui/card.tsx`
- `components/ui/form.tsx`
- `components/ui/label.tsx`
- `components/ui/select.tsx`

Files modifiés :
- `app/globals.css` - CSS variables palette
- `tailwind.config.ts` - Configuration shadcn

### Change Log

| Date       | Description                           |
|------------|---------------------------------------|
| 2026-01-28 | Story créée par create-story workflow |
