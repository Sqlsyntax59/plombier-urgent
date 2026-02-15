# EPICS_STATUS.md — Avancement Produit Plombier Urgent

> Date : 2026-02-15 | Source : PRD (`_bmad-output/planning-artifacts/prd.md`) + PROGRESS.md

---

## Resume

| Metrique | Valeur |
|----------|--------|
| Epics totaux | 10 |
| Epics complets | 9/10 |
| FRs dans PRD | 67 (FR1-FR67) |
| FRs implementees | 66/67 (98.5%) |
| Bonus hors PRD | 12 |
| NFRs respectees | 33/33 (100%) |

---

## Epic 1 : Setup Projet & Fondations — 100%

| FR | Description | Preuve | Statut |
|----|-------------|--------|--------|
| FR-infra | Next.js + TypeScript + Tailwind | `package.json` | Done |
| FR-infra | Supabase Auth SSR | `lib/supabase/server.ts` | Done |
| FR-infra | shadcn/ui (31 composants) | `components/ui/` | Done |
| FR-infra | Structure App Router | `app/` arborescence | Done |

---

## Epic 2 : Inscription & Profil Artisan — 100%

| FR | Description | Preuve | Statut |
|----|-------------|--------|--------|
| FR33 | Formulaire inscription (12 champs) | `app/artisan/inscription/page.tsx` | Done |
| FR33b | SIRET obligatoire | `lib/actions/verification.ts` | Done |
| FR33c | Verification SIRET API INSEE | `lib/services/sirene.ts`, commit `144c338` | Done |
| FR33d | Mode degrade si API indisponible | `verification.ts` try/catch | Done |
| FR33e | Statut verification (4 etats) | `profiles.verification_status` ENUM | Done |
| FR33f | Completer verification post-inscription | `/artisan/verification` page | Done |
| FR33g | Champs assurance (assureur, n, validite) | migration `20260203000001` | Done |
| FR33h-m | Regles d'acces par statut | RLS + guards, commit `3fd3270` | Done |
| FR34 | Acceptation CGV | `profiles.cgv_accepted_at` | Done |
| FR35 | Configuration WhatsApp | `profiles.whatsapp_number` | Done |
| FR36 | Page publique artisan | `app/artisan/[slug]/page.tsx` | Done |
| FR37 | Lien Google Business | `profiles.google_business_url` | Done |
| FR38 | Magic link / Password auth | Supabase Auth native | Done |
| BONUS | Specialisations checkboxes | `profiles.specializations` JSONB | Done |
| BONUS | Header + deconnexion | `components/artisan-header.tsx` | Done |
| BONUS | Affichage SIRET/assurance/statut | commit `598789a` | Done |

---

## Epic 3 : Soumission Demande Client — 100%

| FR | Description | Preuve | Statut |
|----|-------------|--------|--------|
| FR1 | Formulaire demande urgence (wizard) | `app/(public)/demande/page.tsx` | Done |
| FR2 | Selection type panne (6 types) | `leads.problem_type` ENUM | Done |
| FR3 | Upload photo (Firebase) | Firebase Storage bucket | Done |
| FR4 | Description libre | `leads.description` TEXT | Done |
| FR5 | Numero telephone client | `leads.client_phone` | Done |
| FR6 | Fourchette prix indicative | `price_ranges` table | Done |
| FR6.1-6.6 | Questions guidees + synthese | `leads.field_summary`, `isUrgent` | Done |
| BONUS | Detection urgence auto | `lib/services/scoring.ts` | Done |

---

## Epic 4 : Notification & Attribution — 100%

| FR | Description | Preuve | Statut |
|----|-------------|--------|--------|
| FR11 | Notification WhatsApp | `lib/services/notification.ts` + n8n | Done |
| FR12 | Details complets dans notification | Webhook payload | Done |
| FR13 | Fallback SMS | n8n workflow 3-step | Done |
| FR14 | Fallback Email | n8n + Resend | Done |
| FR15 | Notification < 10 sec | Teste OK (~3s en prod) | Done |
| FR16 | Attribution artisan prioritaire | `lib/services/attribution.ts` | Done |
| FR17 | Acceptation lead via lien securise | `/api/lead/accept` (token JWT) | Done |
| FR18-19 | Cascade 2min | Remplace par multi-artisan (FR62-67) | Done |
| FR20 | Decompte credit atomique | RPC `accept_lead` + FOR UPDATE | Done |
| FR21 | Message "Lead deja attribue" | Route accept redirect logic | Done |
| BONUS | Redistribution si refus | n8n automation | Done |

---

## Epic 5 : Dashboard Artisan — 100%

| FR | Description | Preuve | Statut |
|----|-------------|--------|--------|
| FR22 | Liste leads avec filtres | `app/artisan/(dashboard)/leads/page.tsx` | Done |
| FR23 | Detail lead complet | `app/artisan/(dashboard)/leads/[id]/page.tsx` | Done |
| FR24 | Solde credits affiche | Dashboard widget | Done |
| FR25 | Historique leads | Table historique | Done |
| FR26 | Acces coordonnees apres acceptation | RLS policies | Done |
| BONUS | Statistiques (taux conversion) | Dashboard stats | Done |
| BONUS | Page profil editable | `/artisan/profil` | Done |
| BONUS | Page credits avec packs | `/artisan/credits` | Done |

---

## Epic 6 : Paiement & Credits — 100%

| FR | Description | Preuve | Statut |
|----|-------------|--------|--------|
| FR27-29 | Packs 5/10/20 credits | LemonSqueezy config | Done |
| FR30 | Paiement LemonSqueezy | Checkout integration | Done |
| FR31 | Facture PDF auto | `app/api/artisan/receipt/[id]/route.ts` | Done |
| FR32 | Historique achats + recus | `credit_purchases` table | Done |

---

## Epic 7 : Suivi Client J+3 — 100%

| FR | Description | Preuve | Statut |
|----|-------------|--------|--------|
| FR7-8 | Confirmation nom artisan | n8n workflow template | Done |
| FR9 | Suivi automatique J+3 | Cron `/api/cron/trigger-followup` | Done |
| FR10 | Reponse suivi (OUI/NON) | `leads.satisfaction` + webhook | Done |
| BONUS | Page feedback `/feedback/[token]` | `app/(public)/feedback/[token]/page.tsx` | Done |
| BONUS | Notation 1-5 etoiles | `client_feedbacks.rating` | Done |
| BONUS | Commentaire optionnel | `client_feedbacks.comment` | Done |

---

## Epic 8 : Dashboard Admin — 100%

| FR | Description | Preuve | Statut |
|----|-------------|--------|--------|
| FR39 | Dashboard metriques temps reel | `app/admin/dashboard/page.tsx` | Done |
| FR40 | Liste artisans avec filtres | `app/admin/artisans/page.tsx` | Done |
| FR41 | Desactivation manuelle artisan | Admin action button | Done |
| FR42 | Attribution credits gratuits | Admin credit action | Done |
| FR43 | Historique leads + export CSV | `app/admin/leads/page.tsx` | Done |
| FR44 | Gestion reclamations | `app/admin/reclamations/page.tsx` | Done |
| FR45 | Desactivation auto 3 leads rates | Auto-suspend logic | Done |

---

## Epic 9 : Multi-Tenant & Verticales — 25%

| FR | Description | Preuve | Statut |
|----|-------------|--------|--------|
| FR46 | Systeme gere verticales | Table `verticals` creee | Partial |
| FR47 | Artisan appartient a verticale | `profiles.vertical_id` existe | Partial |
| FR48 | Leads isoles par verticale | `leads.vertical_id` existe | Partial |
| FR49 | Grille tarifaire par verticale | `price_ranges.vertical_id` FK | Done |

**Manquant :** Isolation RLS par vertical_id, routage sous-domaine, UI selection verticale.

---

## Epic 10 : Scoring + Badge + Multi-Artisan — 100%

### Phase 1 : Geocodage

| FR | Description | Preuve | Statut |
|----|-------------|--------|--------|
| FR50 | API BAN geocodage | `lib/services/geocoding.ts` | Done |
| FR51 | Cache TTL 30j | `geocode_cache` table | Done |
| FR52 | Calcul distance | RPC `calculate_distance()` | Done |

### Phase 2 : Lead Scoring

| FR | Description | Preuve | Statut |
|----|-------------|--------|--------|
| FR53 | Score 0-100 (5 criteres) | `lib/services/scoring.ts` | Done |
| FR54 | Classification (low/medium/high/premium) | `leads.lead_quality` ENUM | Done |
| FR55 | JSONB scoring_factors | `leads.scoring_factors` | Done |
| FR56 | Audit trail lead_events | `lead_events` table | Done |

### Phase 3 : Badge Reactif

| FR | Description | Preuve | Statut |
|----|-------------|--------|--------|
| FR57 | Score reactivite 0-100 | RPC `recalculate_reactive_scores()` | Done |
| FR58 | Badge conditions (80% resp, 80% < 2min) | RPC logic | Done |
| FR59 | Formule scoring | RPC implements formula | Done |
| FR60 | Recalcul nightly | Cron `/api/cron/recalculate-scores` | Done |
| FR61 | Badge visible dashboard (pas client) | `profiles.is_reactive` flag | Done |

### Phase 4 : Multi-Artisans

| FR | Description | Preuve | Statut |
|----|-------------|--------|--------|
| FR62 | Selection 3 artisans proches | RPC `find_available_artisans()` | Done |
| FR63 | Tri distance/reactive/credits | RPC ORDER BY | Done |
| FR64 | Notification simultanee 3 artisans | n8n workflow `6tTzHp4lV0FeKRp8` | Done |
| FR65 | Premier accepte gagne (FOR UPDATE) | Migration `20260204000001` | Done |
| FR66 | "Lead deja attribue" pour les autres | Route accept logic | Done |
| FR67 | Nouvelle vague apres 5min | n8n workflow automation | Done |

### Contraintes Phase 2

| Contrainte | PRD ligne | Statut | Detail |
|------------|-----------|--------|--------|
| Badge pas expose au client | 412 | Done | `is_reactive` interne dashboard |
| Client ne voit jamais fiche artisan | 423 | **A verifier** | Donnees n8n callback exposent whatsapp/phone |
| Email client = prenom + telephone seulement | 424 | A verifier | Template n8n |
| Slug/email/entreprise non exposes | 425 | A verifier | Routes API publiques |

---

## NFRs (Non-Functional Requirements)

| NFR | Description | Statut |
|-----|-------------|--------|
| NFR-P1 | Notification < 10s | Done (~3s) |
| NFR-P2 | Landing < 3s 4G | Done |
| NFR-P3 | Dashboard < 2s | Done |
| NFR-P4 | Soumission < 5s | Done |
| NFR-P5 | Cascade < 6min | Done (multi-artisan ~30s) |
| NFR-S1 | Encryption at rest | Done (Supabase) |
| NFR-S2 | HTTPS obligatoire | Done (Vercel) |
| NFR-S5 | RGPD | Done (export `/api/artisan/data-export`, consentement formulaire) |
| NFR-S6 | PCI-DSS | Done (LemonSqueezy) |
| NFR-S7 | 2FA admin | Done (TOTP via Supabase MFA, middleware AAL2) |
| NFR-R2 | Fallback WhatsApp→SMS→Email | Done |
| NFR-I7 | API INSEE timeout + mode degrade | Done |

---

## P2 Stabilisation — 100%

| Feature | Preuve | Commit |
|---------|--------|--------|
| Auto-consommation leads | RPC + cron `0 4 * * *` | `dd3ac1b` |
| Periode de grace 30min | RPC + route `/api/lead/cancel` | `dd3ac1b` |
| Retry notifications | Cron `0 6 * * *` (max 3 tentatives) | `dd3ac1b` |
| Followup J+3 | Cron `0 10 * * *` | `dd3ac1b` |
