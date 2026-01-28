# Story 1.2: Configuration Supabase et Schéma Initial

Status: ready-for-dev

## Story

As a **développeur**,
I want **configurer Supabase et créer le schéma de base de données initial**,
so that **les tables essentielles pour l'authentification et les verticales sont disponibles**.

## Acceptance Criteria

1. **AC1 - Variables d'environnement configurées**
   - **Given** le projet Next.js initialisé (Story 1.1)
   - **When** je configure `.env.local` avec les credentials Supabase
   - **Then** les variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont définies
   - **And** la connexion Supabase fonctionne en local

2. **AC2 - Table `verticals` créée**
   - **Given** Supabase CLI configuré
   - **When** je crée la migration pour la table `verticals`
   - **Then** la table contient les colonnes : `id`, `name`, `slug`, `price_grid`, `created_at`
   - **And** une entrée "plomberie" est insérée comme seed

3. **AC3 - Table `profiles` créée**
   - **Given** la table `verticals` existe
   - **When** je crée la migration pour la table `profiles`
   - **Then** la table étend `auth.users` avec : `id`, `vertical_id`, `role`, `first_name`, `city`, `phone`, `whatsapp_phone`, `is_active`, `created_at`
   - **And** la clé étrangère vers `verticals` est configurée

4. **AC4 - Politiques RLS activées**
   - **Given** les tables `verticals` et `profiles` existent
   - **When** j'active RLS et crée les policies
   - **Then** RLS est activé sur les deux tables
   - **And** les artisans ne peuvent voir que leur propre profil
   - **And** les admins peuvent voir tous les profils de leur verticale

5. **AC5 - Types TypeScript générés**
   - **Given** le schéma DB créé
   - **When** j'exécute `supabase gen types typescript`
   - **Then** le fichier `types/database.types.ts` est généré
   - **And** les types sont importables dans le code

## Tasks / Subtasks

- [ ] Task 1: Configuration Supabase locale (AC: 1)
  - [ ] 1.1: Créer un projet Supabase sur supabase.com
  - [ ] 1.2: Copier `.env.example` vers `.env.local`
  - [ ] 1.3: Renseigner `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] 1.4: Tester la connexion avec `npm run dev`

- [ ] Task 2: Initialiser Supabase CLI (AC: 2, 3)
  - [ ] 2.1: Installer Supabase CLI (`npm install supabase --save-dev`)
  - [ ] 2.2: Initialiser le projet (`npx supabase init`)
  - [ ] 2.3: Lier au projet distant (`npx supabase link --project-ref <ref>`)

- [ ] Task 3: Créer migration `verticals` (AC: 2)
  - [ ] 3.1: Créer fichier migration `supabase/migrations/001_create_verticals.sql`
  - [ ] 3.2: Définir la table avec colonnes requises
  - [ ] 3.3: Créer index sur `slug`
  - [ ] 3.4: Insérer seed "plomberie"

- [ ] Task 4: Créer migration `profiles` (AC: 3)
  - [ ] 4.1: Créer fichier migration `supabase/migrations/002_create_profiles.sql`
  - [ ] 4.2: Définir la table avec FK vers `auth.users` et `verticals`
  - [ ] 4.3: Créer index sur `vertical_id`
  - [ ] 4.4: Créer trigger pour auto-création profil à l'inscription

- [ ] Task 5: Configurer RLS (AC: 4)
  - [ ] 5.1: Activer RLS sur `verticals` (lecture publique)
  - [ ] 5.2: Activer RLS sur `profiles` (artisan voit son profil, admin voit sa verticale)
  - [ ] 5.3: Tester les policies avec différents rôles

- [ ] Task 6: Générer types TypeScript (AC: 5)
  - [ ] 6.1: Exécuter `npx supabase gen types typescript --local > types/database.types.ts`
  - [ ] 6.2: Vérifier que les types sont corrects
  - [ ] 6.3: Mettre à jour `tsconfig.json` si nécessaire pour le path alias

- [ ] Task 7: Appliquer migrations (AC: 2, 3, 4)
  - [ ] 7.1: Exécuter `npx supabase db push` pour appliquer en local
  - [ ] 7.2: Vérifier les tables dans Supabase Dashboard
  - [ ] 7.3: Tester une requête simple depuis l'app

## Dev Notes

### Architecture Requirements

**Database Naming Conventions (depuis architecture.md):**

| Élément | Convention | Exemple |
|---------|------------|---------|
| Tables | snake_case, pluriel | `verticals`, `profiles`, `leads` |
| Colonnes | snake_case | `created_at`, `vertical_id`, `phone_number` |
| Foreign keys | `{table_singulier}_id` | `vertical_id`, `artisan_id` |
| Index | `idx_{table}_{columns}` | `idx_profiles_vertical_id` |

**Multi-tenant Isolation:**

- Toutes les tables métier doivent avoir une colonne `vertical_id`
- RLS policies filtrent par `vertical_id` pour isolation
- Les artisans appartiennent à une seule verticale

**Schéma Table `verticals`:**

```sql
CREATE TABLE verticals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price_grid JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_verticals_slug ON verticals(slug);

-- Seed plomberie
INSERT INTO verticals (name, slug, price_grid) VALUES (
  'Plomberie',
  'plomberie',
  '{
    "fuite": {"min": 90, "max": 150},
    "wc_bouche": {"min": 80, "max": 120},
    "ballon": {"min": 150, "max": 300},
    "canalisation": {"min": 100, "max": 180},
    "robinet": {"min": 60, "max": 100},
    "autre": {"min": 80, "max": 250}
  }'
);
```

**Schéma Table `profiles`:**

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  vertical_id UUID REFERENCES verticals(id),
  role TEXT NOT NULL DEFAULT 'artisan' CHECK (role IN ('artisan', 'admin', 'super_admin')),
  first_name TEXT,
  city TEXT,
  phone TEXT,
  whatsapp_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  credits INTEGER DEFAULT 0,
  google_place_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_vertical_id ON profiles(vertical_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- Trigger pour auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

**RLS Policies:**

```sql
-- Verticals: lecture publique
ALTER TABLE verticals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verticals are viewable by everyone"
  ON verticals FOR SELECT
  USING (true);

-- Profiles: artisan voit son profil, admin voit sa verticale
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view profiles in their vertical"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
      AND p.vertical_id = profiles.vertical_id
    )
  );
```

### Technical Constraints

1. **Supabase Free Tier:** 500MB database, 50MB file storage, 50K monthly active users
2. **RLS Performance:** Indexes sur les colonnes filtrées (vertical_id, role)
3. **Auth Integration:** `profiles.id` DOIT référencer `auth.users.id`

### Previous Story Intelligence (1.1)

- Projet créé avec Next.js 16.1.5 (Turbopack)
- Fichiers Supabase SSR déjà présents : `lib/supabase/client.ts`, `server.ts`, `proxy.ts`
- Variables d'environnement template dans `.env.example`
- Package manager : npm

### Project Structure Notes

Fichiers à créer/modifier :

```text
plombier-urgent/
├── .env.local                          # À créer (copie de .env.example)
├── supabase/
│   ├── config.toml                     # Généré par supabase init
│   └── migrations/
│       ├── 001_create_verticals.sql    # À créer
│       └── 002_create_profiles.sql     # À créer
└── types/
    └── database.types.ts               # Généré par supabase gen types
```

### References

- [Source: architecture.md#Data-Architecture] - Supabase PostgreSQL avec RLS
- [Source: architecture.md#Naming-Patterns] - Conventions de nommage DB
- [Source: architecture.md#Data-Boundaries] - Isolation RLS par vertical_id
- [Source: epics.md#Story-1.2] - Critères d'acceptation originaux
- [Source: prd.md#Multi-Tenant-et-Verticales] - FR46-49 isolation verticales

### Testing Requirements

**Validation manuelle pour cette story:**

1. La connexion Supabase fonctionne (`npm run dev` sans erreur)
2. Les tables apparaissent dans Supabase Dashboard
3. Les types TypeScript sont générés sans erreur
4. Une requête `SELECT * FROM verticals` retourne l'entrée "plomberie"

**Tests RLS à vérifier:**

1. User non authentifié peut lire `verticals`
2. User authentifié ne peut lire que son propre profil
3. Admin peut lire tous les profils de sa verticale

### Latest Tech Information

**Supabase CLI (janvier 2026):**

- Version recommandée : `supabase@latest`
- Commandes clés : `init`, `link`, `db push`, `gen types`
- Support local dev avec Docker (optionnel pour MVP)

**Supabase RLS Best Practices:**

- Toujours activer RLS sur tables contenant données utilisateur
- Utiliser `auth.uid()` pour filtrer par utilisateur connecté
- Indexes sur colonnes utilisées dans policies

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Aucun (story de configuration)

### Completion Notes List

- [ ] Projet Supabase créé le {{date}}
- [ ] Tables créées : verticals, profiles
- [ ] RLS policies configurées
- [ ] Types TypeScript générés

### File List

Files à créer :

- `.env.local` - Variables d'environnement Supabase
- `supabase/config.toml` - Configuration Supabase CLI
- `supabase/migrations/001_create_verticals.sql` - Migration table verticals
- `supabase/migrations/002_create_profiles.sql` - Migration table profiles
- `types/database.types.ts` - Types auto-générés

### Change Log

| Date       | Description                           |
|------------|---------------------------------------|
| 2026-01-28 | Story créée par create-story workflow |
