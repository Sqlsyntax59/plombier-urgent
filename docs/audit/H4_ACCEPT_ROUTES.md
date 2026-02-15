# H4 — Fusion des routes accept

## Contexte

3 routes d'acceptation coexistaient, dont 2 non securisees. Ce chantier les fusionne
en 1 route canonique avec redirects pour retrocompatibilite.

## Inventaire avant fix

| Route | Methode | Auth | Statut |
|---|---|---|---|
| `/api/lead/accept` | GET/POST | JWT token (GET) / Session (POST) | Partiel — GET `?assignmentId` sans auth |
| `/api/leads/accept` | GET/POST | Aucune | Redirect 307 (deja fait) |
| `/api/lead/accept-simple` | GET | Aucune | Redirect 307 (deja fait) |
| `/api/n8n/generate-accept-url` | POST | Bearer N8N_CALLBACK_SECRET | OK |

### Appelants

- **WhatsApp/SMS/Email** : `generateAcceptUrl()` → `/api/lead/accept?token=JWT` (securise)
- **n8n callback** : `find_artisans_multi` → genere `accept_url` avec JWT token
- **Dashboard artisan** : lien GET `/api/lead/accept?assignmentId=...` (session navigateur)

## Vulnerabilites trouvees

### CRITICAL: GET /api/lead/accept?assignmentId sans auth

**Fichier:** `app/api/lead/accept/route.ts:46-78`

Le GET avec `assignmentId` utilisait `createAdminClient()` pour recuperer l'artisan_id
puis appelait `acceptLead()` sans verifier que l'appelant etait bien cet artisan.

**Impact:** N'importe qui connaissant un UUID d'assignmentId pouvait accepter un lead
et consommer les credits d'un autre artisan.

**Fix:** Ajout verification session : `createClient()` → `getUser()` → `user.id === assignment.artisan_id`

### HIGH: POST /api/lead/cancel sans auth

**Fichier:** `app/api/lead/cancel/route.ts:11-43`

Acceptait `{assignmentId, artisanId}` sans verifier la session.

**Fix:** Ajout `createClient()` → `getUser()` → `user.id !== artisanId` → 403

### HIGH: PII artisan expose dans reponse send-whatsapp

**Fichier:** `app/api/notifications/send-whatsapp/route.ts:121-128`

La reponse JSON contenait `artisan.name` et `artisan.phone`.

**Fix:** Supprime — retourne seulement `{success, messageId}`

## Architecture finale

```
/api/lead/accept (CANONIQUE)
  GET ?token=JWT     → verifyAcceptToken → acceptLead → redirect
  GET ?assignmentId  → session auth → acceptLead → redirect
  POST {token}       → verifyAcceptToken → acceptLead → JSON
  POST {assignmentId, artisanId} → session auth (user.id===artisanId) → JSON

/api/leads/accept (DEPRECATED — redirect 307 + warning log)
/api/lead/accept-simple (DEPRECATED — redirect 307 + warning log)
```

### Matrice d'auth

| Methode | Parametre | Auth requise | Qui l'utilise |
|---|---|---|---|
| GET | `?token=JWT` | Token JWT (5 min TTL) | Liens WhatsApp/SMS/Email |
| GET | `?assignmentId` | Session Supabase + ownership | Dashboard artisan |
| POST | `{token}` | Token JWT | API calls |
| POST | `{assignmentId, artisanId}` | Session + `user.id === artisanId` | Dashboard artisan |

## Fichiers modifies

| Fichier | Modification |
|---|---|
| `app/api/lead/accept/route.ts` | GET method 2: ajout auth session + ownership check |
| `app/api/leads/accept/route.ts` | Ajout `console.warn` deprecation |
| `app/api/lead/accept-simple/route.ts` | Ajout `console.warn` deprecation |
| `app/api/notifications/send-whatsapp/route.ts` | Suppression PII reponse + console.log payload |
| `app/api/lead/cancel/route.ts` | Ajout auth session + ownership check |

## Checklist deploiement

### Vercel
- [ ] Deployer le commit (push master → auto-deploy)
- [ ] Verifier logs Vercel : pas d'erreur sur `/api/lead/accept`
- [ ] Tester lien WhatsApp en prod (token JWT → acceptation)
- [ ] Tester dashboard artisan (bouton accepter → session auth)

### n8n
- [x] Workflow email (`Yzq5kIplZTuqSeTl`) : deja mis a jour (C3)
- [x] Workflow multi-artisan (`6tTzHp4lV0FeKRp8`) : deja mis a jour (C3)
- Aucun changement n8n supplementaire pour H4 (les URLs ne changent pas)

### Monitoring post-deploiement
- [ ] Surveiller logs `[DEPRECATED]` pour mesurer usage routes legacy
- [ ] Apres 30 jours sans hit : supprimer routes legacy
- [ ] Verifier qu'aucun 403 inattendu sur `/api/lead/accept`

## Tests

- Build Next.js : OK
- Vitest : 148/190 passed (42 echecs pre-existants — mock `createAdminClient`)
- Aucune regression introduite
