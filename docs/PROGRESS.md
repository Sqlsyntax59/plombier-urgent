# Suivi d'Avancement - SaaS Artisans Urgents

> Derniere mise a jour : 2026-01-31

## Statut Global

| Epic | Nom | Statut | Progression |
|------|-----|--------|-------------|
| 1 | Setup Projet & Fondations | ✅ Complete | 100% |
| 2 | Inscription & Profil Artisan | ✅ Complete | 100% |
| 3 | Soumission Demande Client | ✅ Complete | 100% |
| 4 | Notification & Attribution Leads | ✅ Complete | 100% |
| 5 | Dashboard Artisan | ✅ Complete | 100% |
| 6 | Paiement & Credits | 🔄 En cours | 60% |
| 7 | Suivi Client | 🔄 En cours | 50% |
| 8 | Dashboard Admin | ⏳ A faire | 20% |
| 9 | Multi-Tenant & Verticales | ⏳ A faire | 10% |

## Fonctionnalites Implementees (FRs)

### Epic 1: Setup Projet
- [x] FR-infra: Next.js 15 + TypeScript + Tailwind
- [x] FR-infra: Supabase Auth configure
- [x] FR-infra: shadcn/ui installe
- [x] FR-infra: Structure fichiers App Router

### Epic 2: Inscription & Profil Artisan
- [x] FR33: Formulaire inscription artisan
- [x] FR34: Acceptation CGV (+ page /cgv creee)
- [x] FR35: Configuration WhatsApp
- [x] FR36: Page publique artisan /artisan/[slug]
- [x] FR37: ~~Lien Google Business~~ (retire pour eviter bypass)
- [x] FR38: Connexion magic link / mot de passe
- [x] **BONUS**: Specialisations par metier (checkboxes)
- [x] **BONUS**: Header avec email + deconnexion
- [x] **BONUS**: UI V3 - Gradient mesh premium + contraste ameliore

### Epic 3: Soumission Demande Client
- [x] FR1: Formulaire demande urgence
- [x] FR2: Selection type de panne
- [x] FR3: Upload photo (Firebase Storage)
- [x] FR4: Description libre
- [x] FR5: Numero telephone client
- [x] FR6: Fourchette prix indicative
- [x] **BONUS**: Questions guidees (field_summary)

### Epic 4: Notification & Attribution
- [x] FR11: Notification Telegram (WhatsApp prevu)
- [x] FR12: Details dans notification
- [x] FR16: Attribution artisan prioritaire
- [x] FR17: Acceptation lead via lien
- [x] FR18-19: Cascade 2 min (n8n)
- [x] FR20: Decompte credit
- [x] FR21: Message "Lead deja attribue"
- [ ] FR13-14: Fallback SMS/Email

### Epic 5: Dashboard Artisan
- [x] FR22: Liste leads avec filtres
- [x] FR23: Detail lead
- [x] FR24: Solde credits affiche
- [x] FR25: Historique leads
- [x] FR26: Acces coordonnees apres acceptation
- [x] **BONUS**: Taux de conversion affiche

### Epic 6: Paiement & Credits
- [x] FR27-29: Page packs credits (UI)
- [ ] FR30: Integration LemonSqueezy checkout
- [ ] FR31: Facture automatique
- [ ] FR32: Historique achats

### Epic 7: Suivi Client
- [x] FR8: Nom artisan dans confirmation
- [ ] FR7: Confirmation SMS client
- [ ] FR9: Suivi J+3 automatique
- [ ] FR10: Reponse OUI/NON suivi

### Epic 8: Dashboard Admin
- [x] FR39: Page admin basique
- [ ] FR40-45: Gestion complete artisans/leads

### Epic 9: Multi-Tenant
- [x] FR47: Table verticals creee
- [ ] FR46, FR48-49: Isolation complete par verticale

---

## Commits Recents

| Date | Commit | Description |
|------|--------|-------------|
| 31/01 | `e02e24c` | **UI V3**: Gradient mesh premium (slate→blue→purple→white) |
| 31/01 | `ddc1c74` | UI: Hover effects + icon contrast renforce |
| 31/01 | `06d9692` | UI: Backgrounds + card contrast ameliore |
| 30/01 | `1d0ef95` | Header artisan avec email + logout |
| 30/01 | `73ace12` | Page CGV + specialisations artisan |

---

## Base de Donnees

### Tables Creees
- `verticals` - Verticales metiers
- `profiles` - Profils artisans (extends auth.users)
- `leads` - Demandes clients
- `lead_assignments` - Attributions leads
- `credit_transactions` - Historique credits
- `price_ranges` - Fourchettes prix

### Colonnes Ajoutees Recemment
- `profiles.specializations` (text[]) - 30/01
- `profiles.field_summary` (text) - 29/01
- `leads.field_summary` (text) - 29/01

### RLS Policies
- ✅ Users can view/update own profile
- ✅ Users can insert own profile
- ❌ ~~Admins can view profiles~~ (supprimee - causait recursion)

---

## Integrations

| Service | Statut | Notes |
|---------|--------|-------|
| Supabase | ✅ Actif | Auth + DB + RLS |
| Vercel | ✅ Actif | Deploiement auto |
| Telegram | ✅ Actif | Via n8n |
| n8n | ✅ Actif | Workflows notifications |
| WhatsApp | ⏳ Prevu | Remplace Telegram en prod |
| LemonSqueezy | ⏳ Prevu | Paiement credits |
| Firebase | ⏳ Prevu | Storage photos |

---

## UI/Design

### Version Actuelle: UI V3 (tag: `ui-v3`)

**Gradient Background (toutes pages):**
```
bg-gradient-to-br from-slate-100 via-blue-50 via-purple-50/30 to-white
```

**Design Tokens:**
- Cards: `bg-white/90 backdrop-blur-sm border-slate-200/80 shadow-lg shadow-slate-900/[0.08]`
- Icons: Couleurs `-700` pour contraste (ex: `text-blue-700`, `text-amber-700`)
- Hover: `hover:shadow-xl hover:scale-[1.02] hover:border-blue-200 transition-all`

**Pages Redesignees:**
- [x] Landing (`/`)
- [x] Demande (`/demande`)
- [x] Login artisan (`/artisan/login`)
- [x] Inscription (`/artisan/inscription`)
- [x] Dashboard layout (`/artisan/(dashboard)/*`)
- [x] Credits (`/artisan/credits`)
- [x] Leads (`/artisan/leads`)
- [x] Profil (`/artisan/profil`)

---

## Prochaines Etapes

1. **Geolocalisation artisans** - API Adresse gouv.fr
   - Geocoder ville -> lat/lng a l'inscription
   - Calculer distance pour matching leads

2. **Integration LemonSqueezy**
   - Creer produits (packs 5/10/20)
   - Webhook order_created
   - Credit automatique

3. **Fallback notifications**
   - SMS via Twilio/OVH si Telegram echoue
   - Email via Resend

4. **Dashboard Admin complet**
   - Liste artisans avec moderation
   - Historique leads avec filtres
   - Attribution credits gratuits

---

## Comptes Test

| Email | Role | Notes |
|-------|------|-------|
| graous@gmail.com | artisan | Compte principal |
| maleocokesix@gmail.com | artisan | Test 30/01 |

---

*Document mis a jour le 31/01/2026*
