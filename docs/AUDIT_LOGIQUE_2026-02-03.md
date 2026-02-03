# Audit Logique & Sécurité - Plombier Urgent

**Date** : 2026-02-03
**Auditeur** : Claude (Opus 4.5)
**Scope** : Flow leads, paiements/crédits, sécurité/auth

---

## Résumé Exécutif

| Catégorie | Critiques | Hauts | Moyens |
|-----------|-----------|-------|--------|
| Flow Leads | 6 | 6 | 6 |
| Paiements/Crédits | 5 | 5 | 2 |
| Sécurité/Auth | 4 | 4 | 6 |
| **TOTAL** | **15** | **15** | **14** |

**Verdict : Le projet n'est PAS prêt pour la production.**

---

## PROBLÈMES CRITIQUES (à corriger AVANT lancement)

### 1. RPC `credit_artisan_simple` N'EXISTE PAS

**Fichier** : `app/api/webhooks/lemonsqueezy/route.ts:150`

```typescript
const { error } = await supabase.rpc("credit_artisan_simple", {...});
// Cette fonction RPC n'existe dans AUCUNE migration !
```

**Impact** : Quand un artisan achète des crédits :
- Le paiement est prélevé ✓
- Le webhook retourne "success" ✓
- **Les crédits ne sont JAMAIS ajoutés** ✗
- L'artisan a payé pour rien

---

### 2. Race Condition sur l'acceptation de lead

**Fichier** : `app/api/leads/accept/route.ts:267-270`

```typescript
// Deux artisans cliquent en même temps
await supabase.from("profiles")
  .update({ credits: artisan.credits - 1 })  // Pas atomique !
  .eq("id", assignment.artisan_id);
```

**Scénario** :
1. Artisan A lit credits = 5
2. Artisan B lit credits = 5
3. Artisan A écrit credits = 4
4. Artisan B écrit credits = 4
5. **Résultat** : 1 crédit déduit au lieu de 2

---

### 3. Endpoint sans authentification

**Fichier** : `app/api/lead/accept-simple/route.ts`

```typescript
export async function GET(request: NextRequest) {
  const assignmentId = request.nextUrl.searchParams.get("assignmentId");
  const artisanId = request.nextUrl.searchParams.get("artisanId");
  // AUCUNE VÉRIFICATION D'AUTH !
  const result = await acceptLead(assignmentId, artisanId);
}
```

**Impact** : N'importe qui peut accepter n'importe quel lead pour n'importe quel artisan en devinant les IDs.

---

### 4. Pas de RLS sur la table `leads`

**Fichier** : `supabase/migrations/20260128000006_create_leads.sql`

La table `leads` n'a **AUCUNE politique RLS**. Tout utilisateur authentifié peut :
- Lire TOUS les numéros de téléphone clients
- Voir TOUS les leads (même ceux d'autres artisans)

---

### 5. Routes admin/artisan non protégées côté serveur

**Fichiers** :
- `app/admin/layout.tsx` → `"use client"`
- `app/artisan/(dashboard)/layout.tsx` → `"use client"`

Les layouts sont des composants client. Un utilisateur non authentifié peut :
- Accéder à `/admin/dashboard`
- Voir la structure de l'interface admin
- L'auth check se fait APRÈS le rendu

---

### 6. Les leads orphelins ne sont jamais récupérés

**Fichier** : `lib/actions/lead.ts:62-100`

```typescript
const { data: lead } = await supabase.from("leads").insert({...});
// Lead créé ✓

triggerLeadWorkflow({...}).catch((err) => {
  console.error("Erreur:", err);
  // Erreur ignorée silencieusement !
});

return { success: true };  // Retourne success même si n8n a échoué
```

**Impact** : Le client pense que sa demande est envoyée, mais aucun artisan n'est notifié.

---

## PROBLÈMES HAUTS (à corriger rapidement)

### 7. Crédits peuvent devenir négatifs

Pas de contrainte `CHECK (credits >= 0)` en base. Avec les race conditions, un artisan peut avoir -2 crédits.

---

### 8. Limite de cascade incohérente

- `redistribute/route.ts` → limite à 3
- `attribution.ts` → limite à 4

Comportement imprévisible selon le chemin de code.

---

### 9. Pas de log de transaction sur les crédits webhook

Le webhook LemonSqueezy n'écrit jamais dans `credit_transactions`. Impossible d'auditer les achats.

---

### 10. Webhook sans vérification de signature

```typescript
export async function POST(request: NextRequest) {
  const body = await request.json();
  // Pas de vérification HMAC !
```

N'importe qui peut forger un webhook pour s'attribuer des crédits.

---

### 11. JWT_SECRET par défaut

```typescript
const JWT_SECRET = process.env.JWT_SECRET || "default-secret-change-me";
```

Si la variable n'est pas définie, les tokens peuvent être forgés.

---

### 12. Pas de 2FA admin

Aucune protection MFA pour les comptes admin (requis par NFR-S7 du PRD).

---

## PROBLÈMES MOYENS

| # | Problème | Impact |
|---|----------|--------|
| 13 | Optimistic locking qui continue en cas d'échec | Leads gratuits |
| 14 | Token JWT dans l'URL (loggable) | Fuite de tokens |
| 15 | Pas de rate limiting | Brute force possible |
| 16 | Status "unassigned" terminal | Leads perdus à jamais |
| 17 | Expiration token (5min) vs assignment (2min) | Messages d'erreur confus |
| 18 | SIRET non bloquant | Faux artisans possibles |

---

## Plan de correction prioritaire

### Sprint 1 : Bloqueurs critiques (2-3 jours)

| # | Tâche | Fichier | Effort |
|---|-------|---------|--------|
| 1 | Créer RPC `credit_artisan_simple` atomique | migrations/ | 1h |
| 2 | Utiliser RPC `accept_lead` existante partout | api/leads/accept | 2h |
| 3 | Supprimer `/api/lead/accept-simple` | api/lead/ | 5min |
| 4 | Ajouter RLS sur table `leads` | migrations/ | 1h |
| 5 | Protéger routes admin/artisan côté serveur | middleware.ts | 2h |
| 6 | Gérer erreur n8n dans createLead | lib/actions/lead.ts | 1h |

### Sprint 2 : Problèmes hauts (2 jours)

| # | Tâche | Effort |
|---|-------|--------|
| 7 | Ajouter CHECK constraint credits >= 0 | 30min |
| 8 | Unifier limite cascade à 3 | 30min |
| 9 | Logger transactions webhook dans credit_transactions | 1h |
| 10 | Implémenter vérification signature LemonSqueezy | 2h |
| 11 | Forcer JWT_SECRET (erreur si absent) | 15min |
| 12 | Ajouter 2FA admin (TOTP) | 4h |

---

## Comparaison PRD vs Réalité

| Requirement PRD | Status Code | Problème |
|-----------------|-------------|----------|
| NFR-S7 : 2FA admin | Non implémenté | Pas de MFA |
| NFR-S3 : Téléphones masqués logs | Partiel | Pas de RLS sur leads |
| NFR-I2 : Webhook signature | Non implémenté | Pas de vérification |
| FR20 : Décompte crédit atomique | Cassé | Race condition |
| NFR-R4 : Retry automatique | Non implémenté | Fire-and-forget |

---

## Détails techniques complets

### Flow Leads - 18 problèmes identifiés

#### Race Condition: Dual Lead Acceptance (CRITICAL)
**File**: `app/api/leads/accept/route.ts` (POST method, lines 267-270)

Quand deux artisans cliquent sur "accepter" en même temps sur le même assignment, les deux requêtes lisent la même valeur de crédits, passent les vérifications, et exécutent la mise à jour. Résultat : un seul crédit déduit au lieu de deux, et potentiellement le même lead marqué comme accepté deux fois.

#### Race Condition: GET Endpoint's Weak Optimistic Locking (CRITICAL)
**File**: `app/api/leads/accept/route.ts` (GET method, lines 130-134)

L'optimistic locking est implémenté mais échoue silencieusement :
```typescript
const { error: updateCreditsError } = await supabase
  .from("profiles")
  .update({ credits: artisan.credits - 1 })
  .eq("id", assignment.artisan_id)
  .eq("credits", artisan.credits);

if (updateCreditsError) {
  console.error("Erreur update credits:", updateCreditsError);
  // On continue quand même!
}
```

Si l'optimistic locking échoue, l'erreur est loggée mais l'exécution continue. Le lead est déjà marqué comme accepté à ce stade.

#### Orphaned Leads: Lead Created But Workflow Never Triggered
**File**: `lib/actions/lead.ts` (lines 62-100)

Le workflow n8n est appelé en fire-and-forget. Si l'appel échoue, la fonction retourne quand même `success: true`. Le client pense que sa demande est traitée, mais aucun artisan n'est notifié.

#### Lead Acceptance Not Atomic (MEDIUM)
**File**: `app/api/leads/accept/route.ts` (POST method, lines 257-278)

Plusieurs mises à jour non transactionnelles :
1. Update lead_assignments.status = "accepted"
2. Update leads.status = "assigned"
3. Update profiles.credits -= 1
4. Update autres assignments status = "expired"

Si l'étape 3 échoue, le lead est marqué comme assigné mais les crédits ne sont pas déduits.

#### Cascade Limit Inconsistency (MEDIUM)
- `redistribute/route.ts` limite à 3
- `attribution.ts` limite à 4

#### Assignment Expiration Race Condition (MEDIUM)
**File**: `app/api/leads/accept/route.ts` (GET method, lines 65-78)

Entre la vérification d'expiration et la mise à jour, une autre requête pourrait accepter l'assignment.

---

### Paiements/Crédits - 12 problèmes identifiés

#### Non-existent RPC Function (CRITICAL)
**File**: `app/api/webhooks/lemonsqueezy/route.ts:150`

Le webhook appelle `credit_artisan_simple()` qui n'existe dans aucune migration. Le fallback utilise `increment_credits()` qui n'existe pas non plus. Le second fallback fait un check-then-act avec race condition.

#### Payment Success but Credit Addition Failure (CRITICAL)
**File**: `app/api/webhooks/lemonsqueezy/route.ts:181-187`

Le webhook retourne `{ received: true, status: "completed", credits_added: credits }` **que l'ajout de crédits ait réussi ou non**.

#### Refund Handler Race Condition (CRITICAL)
**File**: `app/api/webhooks/lemonsqueezy/route.ts:222-233`

Le remboursement utilise un read-then-update non atomique. Entre la lecture et l'écriture, les crédits peuvent changer.

#### No Transaction Audit Log on Webhook (HIGH)
Le webhook ne crée jamais d'entrées dans `credit_transactions`. Impossible d'auditer les ajouts de crédits.

#### Webhook Idempotency Race Condition (HIGH)
**File**: `app/api/webhooks/lemonsqueezy/route.ts:89-99`

Deux webhooks identiques peuvent passer le check d'idempotence et tous deux INSERT.

---

### Sécurité/Auth - 14 problèmes identifiés

#### Unprotected Lead Acceptance Endpoint (CRITICAL)
**File**: `app/api/lead/accept-simple/route.ts`

Zero authentification. N'importe qui peut accepter des leads pour n'importe quel artisan.

#### No RLS on leads Table (CRITICAL)
**File**: `supabase/migrations/20260128000006_create_leads.sql`

Tous les utilisateurs authentifiés peuvent lire tous les leads, incluant les numéros de téléphone des clients.

#### No Server-Side Route Protection (CRITICAL)
Les layouts admin et artisan sont des composants client. La protection se fait après le rendu.

#### No Webhook Signature Verification (HIGH)
**File**: `app/api/webhooks/lemonsqueezy/route.ts`

Pas de vérification HMAC. N'importe qui peut forger des webhooks.

#### Default JWT_SECRET (MEDIUM)
**File**: `lib/actions/assignment.ts`

Si `JWT_SECRET` n'est pas défini, utilise "default-secret-change-me".

#### No 2FA for Admin (HIGH)
Aucune implémentation de MFA trouvée dans le codebase. Requis par NFR-S7 du PRD.

#### Admin Credit Without Audit Trail (HIGH)
**File**: `lib/actions/admin-dashboard.ts:332-378`

Pas de log de quel admin a crédité quel artisan.

---

## Fichiers critiques à corriger

```
app/api/webhooks/lemonsqueezy/route.ts    # RPC manquante, pas de signature
app/api/leads/accept/route.ts             # Race conditions
app/api/lead/accept-simple/route.ts       # À SUPPRIMER
lib/actions/lead.ts                       # Leads orphelins
supabase/migrations/                      # RLS manquant sur leads
middleware.ts                             # Protection routes
lib/actions/assignment.ts                 # JWT_SECRET default
```

---

## Checklist de correction

### Sprint 1 - Critiques
- [ ] Créer migration pour RPC `credit_artisan_simple`
- [ ] Supprimer `/api/lead/accept-simple`
- [ ] Utiliser RPC `accept_lead` dans tous les endpoints
- [ ] Ajouter RLS sur table `leads`
- [ ] Créer middleware de protection routes
- [ ] Gérer erreur n8n dans createLead (ne pas retourner success si échec)

### Sprint 2 - Hauts
- [ ] Ajouter CHECK constraint `credits >= 0`
- [ ] Unifier limite cascade à 3
- [ ] Logger transactions dans webhook LemonSqueezy
- [ ] Implémenter vérification signature HMAC
- [ ] Forcer JWT_SECRET (throw si absent)
- [ ] Implémenter 2FA admin

### Sprint 3 - Moyens
- [ ] Ajouter rate limiting
- [ ] Implémenter retry pour workflows n8n
- [ ] Ajouter job pour retry leads "unassigned"
- [ ] Aligner expiration token/assignment

---

*Audit généré le 2026-02-03*
