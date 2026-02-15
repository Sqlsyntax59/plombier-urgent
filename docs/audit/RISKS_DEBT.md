# RISKS_DEBT.md — Risques, Bugs & Dettes Techniques

> Date : 2026-02-15 | Commit HEAD : `5d33985`

---

## Resume

| Severite | Nombre |
|----------|--------|
| CRITICAL | 5 |
| HIGH | 8 |
| MEDIUM | 6 |
| LOW | 1 |
| **Total** | **20** |

---

## CRITICAL (5)

### C1 — JWT_SECRET fallback en dur

| Champ | Valeur |
|-------|--------|
| Severite | CRITICAL |
| Effort | S (< 2h) |
| Fichier | `lib/actions/assignment.ts:12-14` |

**Code constate :**
```typescript
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default-secret-change-me"
);
```

**Risque :** Si `JWT_SECRET` n'est pas defini dans les env vars Vercel, la valeur `"default-secret-change-me"` est utilisee. N'importe qui peut alors forger des tokens JWT valides pour `generateAcceptToken()` et accepter des leads sans etre l'artisan prevu.

**Verification requise :** Confirmer que `JWT_SECRET` est bien configure dans le dashboard Vercel (Settings > Environment Variables).

**Fix :** Supprimer le fallback, lever une erreur si la variable est absente.

---

### C2 — POST /api/lead/accept sans verification auth

| Champ | Valeur |
|-------|--------|
| Severite | CRITICAL |
| Effort | S (< 2h) |
| Fichier | `app/api/lead/accept/route.ts:77-87` |

**Code constate :**
```typescript
// Methode 2: Via IDs directs (pour dashboard authentifie)
if (assignmentId && artisanId) {
  // TODO: Verifier que l'utilisateur authentifie est bien l'artisan
  // Pour l'instant, cette methode n'est pas utilisee
  const result = await acceptLead(assignmentId, artisanId);
  return NextResponse.json(result, {
    status: result.success ? 200 : 400,
  });
}
```

**Risque :** Le endpoint est accessible. Un utilisateur authentifie peut accepter le lead d'un autre artisan en envoyant `assignmentId` + `artisanId` arbitraires. Le commentaire "pas utilisee" ne constitue pas une protection.

**Fix :** Ajouter `const { user } = await supabase.auth.getUser()` + verifier `user.id === artisanId`.

---

### C3 — Anti court-circuit : donnees artisan exposees via n8n

| Champ | Valeur |
|-------|--------|
| Severite | CRITICAL |
| Effort | M (2-8h) |
| Fichier | `app/api/n8n/callback/route.ts:135-145` |
| PRD | Ligne 423 : "Client ne voit jamais la fiche artisan" |

**Code constate :**
```typescript
artisanResults.push({
  artisan_id: a.artisan_id,
  artisan_name: a.artisan_name,
  whatsapp_phone: a.whatsapp_phone,
  phone: a.phone,
  distance_km: a.distance_km,
  assignment_id: assignData.id,
  accept_url: acceptUrl,
});
```

**Risque :** n8n recoit toutes les donnees artisan (nom, telephone, WhatsApp) et les transmet potentiellement au client via les templates de notification. Le client pourrait contacter l'artisan directement sans passer par la plateforme (court-circuit).

**A verifier :** Audit des templates n8n et des emails envoyes au client pour confirmer quelles donnees transitent.

---

### C4 — Race condition sur les credits

| Champ | Valeur |
|-------|--------|
| Severite | CRITICAL |
| Effort | M (2-8h) |
| Fichier | RPCs `credit_artisan`, `credit_artisan_simple` dans migrations |

**Risque :** La RPC `accept_lead()` utilise `FOR UPDATE` sur `lead_assignments` (migration `20260204000001`), mais les RPCs de credit ne verrouillent pas `profiles.credits` avec `SELECT ... FOR UPDATE`.

**Scenario :** Deux leads acceptes quasi-simultanement par le meme artisan → double deduction de credit ou deduction manquee.

**Fix :** Ajouter `FOR UPDATE` sur le SELECT de `profiles` dans les RPCs de credit.

---

### C5 — 2FA Admin non implemente (NFR-S7)

| Champ | Valeur |
|-------|--------|
| Severite | CRITICAL |
| Effort | L (> 8h) |
| PRD | NFR-S7 : "2FA sur admin dashboard" |

**Constat :** Aucune 2FA implementee. L'admin se connecte via email/password classique.

**Risque :** Si le mot de passe admin est compromis, l'attaquant accede a tous les artisans, leads, donnees clients, et peut attribuer des credits.

**Fix :** Supabase MFA (TOTP) ou solution externe (Clerk, Auth0).

---

## HIGH (8)

### H1 — LemonSqueezy webhook race condition

| Champ | Valeur |
|-------|--------|
| Severite | HIGH |
| Effort | M |
| Fichier | `app/api/webhooks/lemonsqueezy/route.ts:89-99` |

Le check d'idempotence est un `SELECT` suivi d'un `INSERT` — pas atomique. Deux webhooks identiques en parallele passent le check, dupliquent les credits.

**Fix :** `UNIQUE` constraint sur `credit_purchases.lemonsqueezy_order_id` + `INSERT ... ON CONFLICT DO NOTHING`.

---

### H2 — n8n single point of failure

| Champ | Valeur |
|-------|--------|
| Severite | HIGH |
| Effort | L |
| Fichier | `lib/n8n/trigger.ts` |

Si n8n est down, aucune notification n'est envoyee. Le retry cron (`0 6 * * *`) ne rattrape qu'une fois par jour (plan Hobby).

**Risque :** Leads crees sans notification pendant des heures.

---

### H3 — Tests casses (mocks incorrects)

| Champ | Valeur |
|-------|--------|
| Severite | HIGH |
| Effort | M |
| Fichiers | `__tests__/lib/actions/lead.test.ts`, `__tests__/lib/services/notification.test.ts` |

- `lead.test.ts` mock `createClient` mais le code reel (`lead.ts`) utilise `createAdminClient`
- `notification.test.ts` utilise `.raw()` qui n'existe pas dans le mock builder

**Consequence :** Ces tests passent mais ne testent pas le vrai code.

---

### H4 — 3 routes accept dupliquees

| Champ | Valeur |
|-------|--------|
| Severite | HIGH |
| Effort | M |
| Fichiers | `app/api/lead/accept/`, `app/api/leads/accept/`, `app/api/lead/accept-simple/` |

Triple la surface d'attaque pour la meme fonctionnalite. Maintenance difficile.

**Fix :** Consolider en 1 route unique avec token JWT.

---

### H5 — CSP trop permissive

| Champ | Valeur |
|-------|--------|
| Severite | HIGH |
| Effort | M |
| Fichier | `next.config.ts:18-32` |

`script-src 'self' 'unsafe-inline' 'unsafe-eval'` — n'offre quasiment aucune protection contre XSS.

**Fix :** Nonces ou hashes pour les scripts inline.

---

### H6 — RGPD : droit a l'oubli non implemente

| Champ | Valeur |
|-------|--------|
| Severite | HIGH |
| Effort | M |

Pas de route DELETE pour supprimer les donnees client. Pas de hard-delete artisan. Pas d'export automatise.

---

### H7 — Consentement donnees clients manquant

| Champ | Valeur |
|-------|--------|
| Severite | HIGH |
| Effort | S |
| Fichier | `app/(public)/demande/page.tsx` |

Formulaire de demande client sans case "J'accepte le traitement de mes donnees". Non-conforme RGPD.

**Fix :** Ajouter checkbox consentement + lien politique de confidentialite.

---

### H8 — 46x console.log en production

| Champ | Valeur |
|-------|--------|
| Severite | HIGH |
| Effort | S |
| Fichiers | `app/api/**/*.ts` (46 occurrences) |

Les logs exposent potentiellement des donnees sensibles (artisan IDs, order numbers, erreurs SQL).

**Fix :** Structured logging (Pino) ou supprimer les logs sensibles.

---

## MEDIUM (6)

### M1 — Profil public artisan expose lat/lng/radius

| Champ | Valeur |
|-------|--------|
| Severite | MEDIUM |
| Effort | M |
| Fichier | `app/artisan/[slug]/page.tsx` |

La requete Supabase pour le profil public pourrait retourner `latitude`, `longitude`, `intervention_radius_km`. A verifier que le `select()` exclut ces champs.

---

### M2 — Firebase Storage regles non documentees

| Champ | Valeur |
|-------|--------|
| Severite | MEDIUM |
| Effort | M |

Photos clients uploadees dans Firebase Storage. Aucune documentation des regles de securite dans le repo. Les photos sont-elles en lecture publique ?

---

### M3 — Limites API INSEE/BAN non gerees

| Champ | Valeur |
|-------|--------|
| Severite | MEDIUM |
| Effort | S |
| Fichiers | `lib/services/sirene.ts`, `lib/services/geocoding.ts` |

Aucun retry ni backoff en cas de 429 (throttling). API BAN : pas de limite documentee mais pas de protection non plus.

---

### M4 — Tracabilite logs manquante

| Champ | Valeur |
|-------|--------|
| Severite | MEDIUM |
| Effort | M |

Les `console.log` ne sont pas persistes. Pas de centralized logging (Datadog, Vercel Log Drains). Pas d'audit trail en cas de litige.

---

### M5 — Gestion d'erreur exposant details internes

| Champ | Valeur |
|-------|--------|
| Severite | MEDIUM |
| Effort | S |
| Fichier | `app/api/n8n/callback/route.ts:253` |

Messages d'erreur bruts (potentiellement SQL, stack traces) retournes dans les reponses API.

---

### M6 — Architecture dupliquee n8n callback vs leads/assign

| Champ | Valeur |
|-------|--------|
| Severite | MEDIUM |
| Effort | M |
| Fichiers | `app/api/n8n/callback/route.ts`, `app/api/leads/assign/route.ts` |

Deux routes pour la meme logique d'attribution.

---

## LOW (1)

### L1 — Composants legacy tutorial/

| Champ | Valeur |
|-------|--------|
| Severite | LOW |
| Effort | S |
| Dossier | `components/tutorial/` |

Composants herites du starter Supabase, jamais utilises. Code mort a nettoyer.

---

## Matrice priorite / effort

```
         │ S (< 2h)       │ M (2-8h)       │ L (> 8h)
─────────┼─────────────────┼────────────────┼──────────────
CRITICAL │ C1 JWT_SECRET   │ C3 Anti-CC     │ C5 2FA Admin
         │ C2 Auth accept  │ C4 Race credit │
─────────┼─────────────────┼────────────────┼──────────────
HIGH     │ H7 Consentement │ H1 LemonSqueezy│ H2 n8n SPOF
         │ H8 Console.log  │ H3 Tests       │
         │                 │ H4 Routes dup  │
         │                 │ H5 CSP         │
         │                 │ H6 RGPD        │
─────────┼─────────────────┼────────────────┼──────────────
MEDIUM   │ M3 API limits   │ M1 Profil pub  │
         │ M5 Error msgs   │ M2 Firebase    │
         │                 │ M4 Logging     │
         │                 │ M6 Dupli n8n   │
─────────┼─────────────────┼────────────────┼──────────────
LOW      │ L1 Tutorial     │                │
```

**Quick wins (CRITICAL + S)** : C1 et C2 fixables en < 2h chacun.
