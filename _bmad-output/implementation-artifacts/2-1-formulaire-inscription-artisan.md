# Story 2.1: Formulaire d'Inscription Artisan

Status: in-progress

## Story

As a **artisan**,
I want **m'inscrire sur la plateforme avec mes informations de base**,
so that **je puisse recevoir des leads et developper mon activite**.

## Acceptance Criteria

1. **AC1 - Page inscription accessible**
   - **Given** un visiteur non connecte
   - **When** il accede a `/artisan/inscription`
   - **Then** le formulaire d'inscription s'affiche
   - **And** les champs requis sont : nom, prenom, ville, metier, telephone, email, mot de passe

2. **AC2 - Validation des donnees avec Zod**
   - **Given** un formulaire rempli
   - **When** l'utilisateur soumet le formulaire
   - **Then** les donnees sont validees cote client ET serveur avec Zod
   - **And** les erreurs de validation sont affichees clairement

3. **AC3 - Creation compte Supabase Auth**
   - **Given** des donnees valides soumises
   - **When** le Server Action traite l'inscription
   - **Then** un compte Supabase Auth est cree avec email/password
   - **And** le profil est mis a jour avec les infos supplementaires

4. **AC4 - Redirection post-inscription**
   - **Given** un compte cree avec succes
   - **When** l'inscription est terminee
   - **Then** l'artisan est redirige vers `/artisan/whatsapp` (Story 2.3)
   - **And** un message de confirmation s'affiche

## Tasks / Subtasks

- [ ] Task 1: Migration DB - champs manquants (AC: 3)
  - [ ] 1.1: Ajouter `last_name` a profiles
  - [ ] 1.2: Ajouter `trade` (metier) a profiles
  - [ ] 1.3: Deployer migration sur Supabase

- [ ] Task 2: Schema Zod inscription (AC: 2)
  - [ ] 2.1: Creer `lib/validations/artisan.ts`
  - [ ] 2.2: Definir schema avec email, password, nom, prenom, ville, metier, telephone

- [ ] Task 3: Page inscription (AC: 1)
  - [ ] 3.1: Creer `app/artisan/inscription/page.tsx`
  - [ ] 3.2: Formulaire avec React Hook Form + Zod
  - [ ] 3.3: Composants shadcn/ui (Input, Button, Select, Form)

- [ ] Task 4: Server Action inscription (AC: 3, 4)
  - [ ] 4.1: Creer `lib/actions/auth.ts`
  - [ ] 4.2: Action `signUpArtisan` - creation compte + profil
  - [ ] 4.3: Gestion erreurs (email existe, etc.)
  - [ ] 4.4: Redirection vers whatsapp config

## Dev Notes

### Architecture Requirements

**Table profiles existante (Story 1.2):**
```sql
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  vertical_id UUID,
  role TEXT DEFAULT 'artisan',
  first_name TEXT,
  city TEXT,
  phone TEXT,
  whatsapp_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  credits INTEGER DEFAULT 0,
  ...
)
```

**Champs a ajouter:**
- `last_name TEXT` - Nom de famille
- `trade TEXT` - Metier (plombier, electricien, etc.)

### Technical Constraints

1. **Supabase Auth** : signUp avec email/password
2. **Trigger existant** : `handle_new_user` cree auto le profil vide
3. **Update profil** : Apres signup, update avec les infos supplementaires
4. **Validation** : Zod schema partage client/serveur

### Metiers disponibles (MVP - vertical plombier)

```typescript
const TRADES = [
  { value: 'plombier', label: 'Plombier' },
  { value: 'plombier-chauffagiste', label: 'Plombier-Chauffagiste' },
] as const;
```

### References

- [Source: architecture.md#Authentication] - Supabase Auth
- [Source: epics.md#Story-2.1] - Criteres d'acceptation
- [Source: Story 1.2] - Table profiles existante

## Dev Agent Record

### File List

Files crees :
- `supabase/migrations/20260128000003_add_artisan_fields.sql`
- `lib/validations/artisan.ts`
- `app/artisan/inscription/page.tsx`
- `lib/actions/auth.ts`

Files modifies :
- `types/index.ts` - Types Artisan

### Change Log

| Date       | Description                           |
|------------|---------------------------------------|
| 2026-01-28 | Story creee - Epic 2 demarre         |
