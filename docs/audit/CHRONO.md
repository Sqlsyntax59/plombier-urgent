# CHRONO.md — Timeline Git Plombier Urgent

> Date : 2026-02-15 | HEAD : `5d33985` | Branche : `master`

---

## 1. Etat du repo

| Propriete | Valeur |
|-----------|--------|
| Branche | `master` (trunk-based, lineaire) |
| Remote | `origin` — `https://github.com/Sqlsyntax59/plombier-urgent.git` |
| Tracking | `origin/master` — a jour |
| WIP | 1 fichier (`supabase/.temp/cli-latest`) — sans impact |

---

## 2. Tags (jalons)

| Tag | Description |
|-----|-------------|
| `mvp-0` | Premier MVP |
| `ui-v3` | Version 3 de l'UI |
| `v0.1.0-mvp` | Release MVP semver |

---

## 3. Timeline commits (01/02 — 15/02)

### Semaine 10-15 fevrier (5 commits)

| Commit | Date | Description | Impact |
|--------|------|-------------|--------|
| `5d33985` | 07/02 | feat(inscription): indicateur force mot de passe + autocomplete | UX |
| `b1db251` | 07/02 | fix: signOut avant signUp (session croisee) | Bug auth |
| `af9556d` | 07/02 | fix: 404 page artisan publique (colonnes manquantes) | Bug prod |
| `7294c6a` | 07/02 | fix: adminClient pour page publique artisan | Bug RLS |
| `598789a` | 07/02 | feat(profil): afficher SIRET, assurance, verification | Feature |

### Semaine 4-9 fevrier (8 commits)

| Commit | Date | Description | LOC | Impact |
|--------|------|-------------|-----|--------|
| `f4e5bd7` | 06/02 | chore: .gitignore artifacts | - | Cleanup |
| `dcd8590` | 06/02 | fix(n8n): httpRequest au lieu de fetch | - | Bug n8n |
| `a79b346` | 06/02 | fix: RPC find_available_artisans type mismatch | - | Bug DB |
| `2524671` | 06/02 | fix: colonne client_name inexistante | - | Bug DB |
| `6f9b9d5` | 05/02 | fix: cron retry schedule (Hobby plan) | - | Bug cron |
| `dd3ac1b` | 05/02 | **feat(p2): auto-consommation, grace period, crons** | +799 | P2 complet |
| `9035b2d` | 05/02 | fix: simplify accept routes + docs | - | Refactor |
| `27b4a2c` | 05/02 | **feat(epic-10): geocodage, scoring, badge, multi-artisans** | +1093 | Epic 10 complet |

### Semaine 1-3 fevrier (13 commits)

| Commit | Date | Description | LOC | Impact |
|--------|------|-------------|-----|--------|
| `e832063` | 05/02 | fix: send-whatsapp public routes | - | Bug middleware |
| `6aae207` | 05/02 | fix: createAdminClient for lead creation | - | Bug RLS |
| `59516b6` | 04/02 | fix: race condition accept_lead (FOR UPDATE) | +693 | Security |
| `b3a4cc9` | 04/02 | docs: audit + Epic 10 specs | +933 | Docs |
| `4f95b27` | 04/02 | feat(api): route accept-simple WhatsApp | - | Feature |
| `cc54e6d` | 04/02 | fix(notification): flatten WhatsApp data | - | Bug n8n |
| `e2ed4db` | 04/02 | fix: cascade_order column name | - | Bug DB |
| `451b91c` | 04/02 | fix: admin client n8n API routes | - | Bug RLS |
| `3766cb2` | 04/02 | fix: n8n routes public middleware | - | Bug middleware |
| `883bdb5` | 03/02 | **test: Vitest 169 tests, 52% coverage** | +4836 | Tests |
| `94c0748` | 03/02 | docs: audit results | +933 | Docs |
| `bb34d17` | 03/02 | feat(credits): historique achats + factures PDF | +739 | Feature |
| `37659c4` | 03/02 | chore: cleanup + scripts audit prod | - | Cleanup |

### Semaine 28/01-02/02 (14 commits)

| Commit | Date | Description | LOC | Impact |
|--------|------|-------------|-----|--------|
| `3fd3270` | 02/02 | **fix(security): audit sprint 2 — RLS, CSP, guards** | +955 | Security |
| `68a9dbd` | 01/02 | feat: landing dark premium redesign | +464 | UI V4 |
| `05b72a8` | 01/02 | fix(sirene): endpoint INSEE | - | Bug API |
| `144c338` | 01/02 | **feat(artisan): SIRET verification & insurance** | +1906 | Story 2.1 |
| `11f84fb`+ | 01/02 | docs + workflows WhatsApp n8n | - | Docs/n8n |

---

## 4. Gros changements (top 8 par LOC)

| Commit | LOC ajoutees | Sujet |
|--------|-------------|-------|
| `883bdb5` | +4836 | Tests Vitest complets (16 fichiers) |
| `144c338` | +1906 | Verification SIRET + assurance (16 fichiers) |
| `27b4a2c` | +1093 | Epic 10 complet (20 fichiers) |
| `3fd3270` | +955 | Audit securite sprint 2 (10 fichiers) |
| `94c0748` | +933 | Donnees audit prod |
| `dd3ac1b` | +799 | P2 stabilisation (9 fichiers) |
| `bb34d17` | +739 | Credits historique + factures PDF |
| `59516b6` | +693 | Race condition + cascade WhatsApp |

---

## 5. Synthese

- **Repo propre** — 1 seul fichier temporaire non commite
- **Rythme soutenu** — ~40 commits en 15 jours
- **Trunk-based** — pas de branches paralleles, tout sur master
- **Dernier commit** — 07/02 (8 jours de pause avant cet audit)
- **Pas de WIP fonctionnel** — tout est commite et deploye
