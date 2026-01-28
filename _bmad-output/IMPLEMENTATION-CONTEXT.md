---
status: FROZEN
frozenAt: '2026-01-28'
readinessStatus: READY
project: SaaS Artisans Urgents
stack: Next.js 15 + Supabase + LemonSqueezy + WhatsApp Cloud API
epics: 9
stories: 51
frs: 49
nfrs: 31
---

# Implementation Context - SaaS Artisans Urgents

> **Ce fichier est le point de vérité unique pour l'implémentation.**
> Ne pas modifier sans validation explicite.

## Quick Reference

| Élément | Valeur |
|---------|--------|
| Starter | `npx create-next-app@latest -e with-supabase` |
| Auth | Supabase Auth (magic link / password) |
| Paiement | LemonSqueezy (webhooks) |
| Notifications | WhatsApp Cloud API → SMS → Email (fallback) |
| Storage | Firebase Storage (photos) |
| Automation | n8n (cascade, J+3) |

## Artefacts Gelés

| Document | Chemin | Status |
|----------|--------|--------|
| PRD | `planning-artifacts/prd.md` | ✅ Frozen |
| Architecture | `planning-artifacts/architecture.md` | ✅ Frozen |
| Epics & Stories | `planning-artifacts/epics.md` | ✅ Frozen |
| Readiness Report | `planning-artifacts/implementation-readiness-report.md` | ✅ Frozen |

## Epic Sequence (Implémentation)

| # | Epic | Stories | FRs |
|---|------|---------|-----|
| 1 | Setup Projet & Fondations | 4 | infra |
| 2 | Inscription & Profil Artisan | 6 | FR33-38 |
| 3 | Soumission Demande Client | 6 | FR1-6 |
| 4 | Notification & Attribution Leads | 11 | FR11-21 |
| 5 | Dashboard Artisan | 5 | FR22-26 |
| 6 | Paiement & Crédits | 6 | FR27-32 |
| 7 | Suivi Client | 4 | FR7-10 |
| 8 | Dashboard Admin | 7 | FR39-45 |
| 9 | Multi-Tenant & Verticales | 4 | FR46-49 |

## Tables DB (Schéma Core)

```
verticals (id, name, slug, pricing_grid)
profiles (id, user_id, vertical_id, name, city, phone, whatsapp, google_url, status)
leads (id, vertical_id, type, description, photo_url, phone, status, artisan_id)
credits (id, profile_id, balance, last_purchase)
transactions (id, profile_id, pack_size, amount, lemon_tx_id)
lead_events (id, lead_id, event_type, artisan_id, timestamp)
```

## Rôles RBAC

| Rôle | Permissions |
|------|-------------|
| client (anon) | Soumettre demande |
| artisan | Dashboard, accepter leads, profil |
| admin | Tout voir, modérer, créditer |

## Critères de Performance (NFRs Clés)

| NFR | Cible |
|-----|-------|
| NFR-P1 | Notification < 10s |
| NFR-P2 | Landing < 3s (mobile 4G) |
| NFR-P3 | Dashboard < 2s |
| NFR-R1 | Uptime ≥ 99% |
| NFR-R2 | Fallback WhatsApp → SMS → Email |

## Commandes Sprint

```bash
# Sprint Planning
/bmad-bmm-sprint-planning

# Créer Story prête
/bmad-bmm-create-story

# Implémenter Story
/bmad-bmm-dev-story

# Code Review
/bmad-bmm-code-review
```

## Règles d'Implémentation

1. **Ne pas modifier** les artefacts gelés sans validation
2. **Créer Story** via `/bmad-bmm-create-story` avant chaque implémentation
3. **Valider** chaque story avec `/verify` avant commit
4. **Respecter** les NFRs de performance
5. **Tester** chaque FR avec son critère d'acceptation

---

*Context frozen: 2026-01-28 | Readiness: READY*
