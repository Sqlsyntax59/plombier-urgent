---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments: ['brainstorming-session-2026-01-27.md']
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 0
classification:
  projectType: 'SaaS B2B'
  domain: 'Marketplace Services'
  complexity: 'medium'
  projectContext: 'greenfield'
  channels: ['WhatsApp', 'SMS', 'Email']
---

# Product Requirements Document - SaaS Artisans Urgents

**Author:** Graous
**Date:** 2026-01-27

## Executive Summary

**Vision :** Plateforme SaaS de mise en relation instantanée entre particuliers en urgence et artisans locaux disponibles.

**Différenciateur :** Temps de réponse < 5 minutes garanti via notifications WhatsApp temps réel et algorithme de cascade intelligent.

**Cible :**

- B2C : Particuliers avec urgence domestique (fuite, panne, etc.)
- B2B : Artisans indépendants cherchant des clients qualifiés sans effort marketing

**Modèle :** Pay-per-lead (25-35€/lead, packs avec réductions)

**Stack MVP :** Supabase + LemonSqueezy + WhatsApp Cloud API + n8n + Firebase Storage

---

## Success Criteria

### User Success (Particulier B2C)

| Métrique | Cible |
|----------|-------|
| Taux de réponse artisan < 5 min | ≥ 80% |
| Taux de mise en contact réelle | ≥ 90% |
| Satisfaction client J+1 | ≥ 70% |
| Net Promoter Score (NPS) | ≥ 40 |

### User Success (Artisan B2B)

| Métrique | Cible |
|----------|-------|
| Conversion lead → intervention | ≥ 33% (objectif LT: 50%) |
| Revenus générés / pack 5 leads | ≥ 300€ |
| Taux de rechargement crédits | ≥ 40% |
| Rétention 60 jours | ≥ 70% |

### Business Success

| Métrique | Cible |
|----------|-------|
| MRR à 2 mois | ≥ 1 000€ |
| Leads vendus/mois | ≥ 50 |
| Artisans payants actifs | ≥ 10 |
| CAC | ≤ 20€ |
| Churn artisans | ≤ 25% |

### Technical Success

| Métrique | Cible |
|----------|-------|
| Uptime plateforme | ≥ 99% |
| Temps notification artisan | < 10 sec |
| Délivrabilité messages | ≥ 95% |

---

## Product Scope

### MVP - Minimum Viable Product

- Landing page + formulaire demande (avec photo facultative)
- Fourchettes de prix indicatives par type de panne (affichage dynamique)
- Notification multi-canal (WhatsApp + SMS + Email fallback)
- Algorithme attribution (priorité + cascade 2min)
- Packs crédits via LemonSqueezy
- Mini dashboard artisan (voir ses leads, accepter/refuser)
- Page publique artisan basique (prénom, ville, badge réactivité, lien fiche Google)
- Suivi automatique J+3

### Growth Features (Post-MVP)

- Chatbot WhatsApp conversationnel
- Badge "Artisan Vérifié" (après 10 interventions 5★)
- Photo obligatoire (upgrade de facultative)
- Page artisan évoluée (avec avis clients)
- Scraping/API notes Google automatique + affichage avis sur fiche
- Stats artisans (dashboard externe)

### Vision (Future)

- Partenariats assureurs (B2B2C)
- Mode "artisan dispo" (flux inversé)
- Pricing géographique (Zone A/B)
- App mobile artisan dédiée
- Expansion multi-verticales
- Marketplace pro / affiliation

---

## User Journeys

### Parcours 1 : Marie - Particulière en urgence (Happy Path B2C)

**Persona :** Marie, 42 ans, mère de famille à Angers. Découvre une fuite sous l'évier un vendredi soir à 19h30.

**Obstacle :** Les plombiers connus ne répondent plus. Les annuaires sont des listes infinies sans indication de disponibilité.

**Parcours :**

1. Google "plombier urgence Angers" → trouve `plombier.urgent.fr`
2. Sélectionne "Fuite sous évier" → voit "💰 Estimation : 90-150€"
3. Ajoute photo + téléphone
4. Reçoit SMS "Demande reçue, artisan notifié"
5. 3 min plus tard → appel de Lucas
6. Reçoit WhatsApp : "Lucas va vous contacter. Intervention généralement 100-180€"
7. Lucas arrive en 45min, répare (facture dans la fourchette attendue)
8. J+3 → "Intervention OK ?" → OUI

**Émotion :** Panique → Soulagement → Confiance → Recommandation

---

### Parcours 2 : Lucas - Artisan plombier (Happy Path B2B)

**Persona :** Lucas, 35 ans, plombier indépendant depuis 8 ans. Bon artisan mais pas digital. Dépend du bouche-à-oreille.

**Obstacle :** Plateformes complexes, devis chronophages, clients fantômes.

**Parcours :**

1. Démarché → s'inscrit → achète pack 5 leads (90€)
2. WhatsApp : "🔴 URGENCE - Fuite cuisine - Marie - 3km - Photo jointe"
3. Clique "J'accepte" en 30 secondes
4. Appelle Marie, obtient les détails
5. Intervention sur place, facture 180€
6. Dashboard : lead converti, crédits restants visibles

**Émotion :** Curiosité → Satisfaction → Fidélisation

---

### Parcours 3 : Stéphane - Artisan qui rate le lead (Edge Case Cascade)

**Persona :** Stéphane, plombier périphérie, connecté mais peu réactif.

**Parcours :**

1. Reçoit WhatsApp "Fuite cuisine à 2,5 km" mais lit trop tard
2. Timer 2 min expire → lead redirigé vers 2 autres artisans
3. Clique "J'accepte" → écran : "Lead déjà attribué à un autre pro"
4. Dashboard : alerte "Vous avez raté 2 leads cette semaine"
5. Active le mode "dispo prioritaire" pour les prochains jours

**Émotion :** Frustration → Compréhension → Volonté d'amélioration

**Objectif UX :** FOMO sans punition → renforce réactivité future

---

### Parcours 4 : Émilie - Cliente insatisfaite (Edge Case Support)

**Persona :** Émilie, utilisatrice à Nantes. L'artisan contacté annule et disparaît.

**Parcours :**

1. Fait sa demande → reçoit confirmation
2. Artisan contacte mais annule sans reprogrammer
3. Reste sans solution
4. J+3 → "Intervention OK ?" → répond "NON"
5. Support la contacte → propose 1 lead gratuit si souhaité
6. Score NPS bas → tag "client fragile" dans la base

**Émotion :** Déception → Reconnaissance (suivi pro)

**Objectif UX :** Rattraper les points de friction → éviter avis négatifs

---

### Parcours 5 : Samir - Nouvel artisan onboarding

**Persona :** Samir, nouveau plombier inscrit suite à un démarchage.

**Parcours :**

1. Clique email "Recevez vos premiers clients ce soir"
2. Remplit 5 champs + CGV + WhatsApp
3. Paie 90€ → pack 5 leads
4. Reçoit lead test (faux client) → simulateur interne
5. Mini guide WhatsApp "3 choses pour convertir vos leads"
6. Accès replay webinaire "Maximiser vos retours"

**Émotion :** Confiance → Engagement → Premiers succès

**Objectif UX :** Onboarding fluide et rassurant → zéro friction tech

---

### Parcours 6 : Admin - Gestion quotidienne

**Scénario :** Surveillance métriques, gestion artisans inactifs, réclamations.

**Parcours :**

1. Dashboard → leads du jour, taux réponse, artisans actifs
2. Alerte → artisan avec 3 leads non-répondus → désactivation temporaire
3. Réclamation → client mécontent → investigation, crédit offert si justifié

---

### Grille Tarifaire Indicative (Plomberie MVP)

| Type de panne | Fourchette indicative |
|---------------|----------------------|
| Fuite sous évier | 90€ - 150€ |
| WC bouché | 80€ - 120€ |
| Ballon d'eau chaude HS | 150€ - 300€ |
| Canalisation bouchée | 100€ - 180€ |
| Robinet défectueux | 60€ - 100€ |
| Autre | 80€ - 250€ (générique) |

---

### Journey Requirements Summary

| Parcours | Capabilities révélées |
|----------|----------------------|
| Marie (B2C) | Landing page, formulaire, fourchettes prix, notifications, suivi J+3 |
| Lucas (B2B) | Dashboard artisan, acceptation lead, historique |
| Stéphane (cascade) | Timer 2min, redistribution, alertes réactivité |
| Émilie (insatisfaite) | Suivi NPS, workflow support, crédit compensation |
| Samir (onboarding) | Inscription, paiement, lead test, guide WhatsApp |
| Admin | Dashboard admin, alertes, modération |

---

## SaaS B2B Specific Requirements

### Architecture Multi-Tenant

| Aspect | Décision |
|--------|----------|
| Modèle | Multi-tenant logique par métier (sous-domaines) |
| Base de données | Partagée avec filtrage par `vertical_id` |
| Isolation | Données artisans/leads isolées par verticale |
| Scalabilité | Ajout de verticales = nouvelle config, pas de code |

### Modèle de Permissions (RBAC)

| Rôle | Permissions |
|------|-------------|
| Client (anonyme) | Soumettre demande, voir confirmation |
| Artisan | Dashboard leads, accepter/refuser, historique, profil |
| Admin | Tout voir, modérer artisans, gérer réclamations, stats |
| Support (futur) | Voir tickets, créditer, contacter clients |

### Modèle de Monétisation

| Aspect | Décision |
|--------|----------|
| Type | Pay-per-lead (pas d'abonnement) |
| Packs crédits | 5 leads (-10%), 10 leads (-15%), 20 leads (-20%) |
| Prix unitaire | Variable par métier (20-35€ plomberie) |
| Facturation | LemonSqueezy (auto-factures, TVA EU) |

### Stack Intégrations

| Outil | Rôle | Phase |
|-------|------|-------|
| WhatsApp Cloud API | Notifications artisans + suivi J+3 | MVP |
| LemonSqueezy | Paiement + factures | MVP |
| Supabase | BDD + Auth artisans | MVP |
| Firebase Storage | Hébergement photos | MVP |
| n8n / Make | Automation (lead → notif, J+3) | MVP |
| Google Places API | Notes + avis artisans | Growth |
| CRM (Crisp/Intercom) | Support client/artisan | Growth |
| Lead scoring AI | Priorisation intelligente | Vision |

### Lead Scoring (Growth)

| Critère Client | Score |
|----------------|-------|
| Heure soir/weekend (urgence) | +20 pts |
| Photo ajoutée | +10 pts |
| Description > 30 mots | +15 pts |
| Ville centre dense | +10 pts |
| Récidiviste (même tel/email) | -50 pts |

### Alertes Intelligentes Artisan (Growth)

| Alerte | Action |
|--------|--------|
| 3 leads ratés d'affilée | Désactivation temporaire |
| 100% taux réponse | Badge "Réactif" + bonus visibilité |
| Lead non accepté > 4 min | Envoi exceptionnel à 4e artisan |
| Artisan inactif 7 jours | Notification "Vous nous manquez" |

### Automatisation IA (Vision)

- Résumé automatique du besoin client (GPT via n8n)
- Reformulation des demandes mal écrites
- Score valeur chantier estimée (fuite = petit ticket, chaudière = gros)

### Considérations Techniques

| Aspect | Exigence |
|--------|----------|
| Auth artisans | Magic link ou mot de passe simple |
| Auth clients | Pas de compte requis (formulaire anonyme) |
| Temps réel | Notifications < 10 sec |
| Fallback | WhatsApp → SMS → Email |
| Stockage images | Max 5MB/photo, compression auto |

---

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**Approche choisie :** Problem-Solving MVP

**Justification :** La valeur se prouve dès qu'un client en urgence reçoit un appel d'artisan en moins de 5 minutes. Pas besoin de features avancées pour valider l'hypothèse centrale.

**Ressources MVP :**

- 1 développeur full-stack
- Stack no-code/low-code (Supabase, n8n, LemonSqueezy)
- Budget : ~500€/mois (infra + APIs)

### MVP Feature Set (Phase 1)

**Parcours utilisateur supportés :**

| Parcours | Couverture |
|----------|------------|
| Marie (B2C happy path) | 100% |
| Lucas (B2B happy path) | 100% |
| Stéphane (cascade) | 100% |
| Samir (onboarding) | 80% (sans lead test simulé) |
| Admin | 60% (dashboard basique) |

**Capabilities Must-Have :**

| Feature | Priorité |
|---------|----------|
| Landing page responsive | P0 |
| Formulaire demande (photo facultative) | P0 |
| Notification WhatsApp artisan | P0 |
| Bouton acceptation lead | P0 |
| Attribution cascade 2 min | P0 |
| Dashboard artisan minimal | P0 |
| Paiement LemonSqueezy (packs) | P0 |
| Suivi J+3 automatique | P0 |
| Fourchettes prix indicatives | P1 |
| Page artisan basique | P1 |

### Post-MVP Features

**Phase 2 - Growth (Mois 2-3) :**

- Lead scoring (urgence, photo, description)
- Alertes intelligentes artisans (3 ratés = pause)
- Badge "Artisan Réactif"
- Notes Google affichées (API scraping)
- Photo obligatoire
- Dashboard stats enrichi

**Phase 3 - Expansion (Mois 4+) :**

- Multi-verticales (électricien, serrurier, vitrier)
- Chatbot WhatsApp conversationnel
- Partenariats B2B2C (assureurs, syndics)
- Pricing géographique (zone A/B)
- Mode "artisan dispo" (flux inversé)
- App mobile artisan dédiée

### Risk Mitigation Strategy

**Risques Techniques :**

| Risque | Mitigation |
|--------|------------|
| WhatsApp downtime | Fallback SMS → Email préconfiguré |
| Latence > 10s | Tests charge pré-launch, monitoring n8n |
| Photos lourdes | Compression auto, limite 5MB |

**Risques Marché :**

| Risque | Mitigation |
|--------|------------|
| Adoption artisans faible | 2-3 leads offerts à l'inscription |
| Acquisition clients | SEO local + Google Ads urgence |
| Leads fantômes | Lead scoring + blacklist récidivistes |

**Risques Ressources :**

| Risque | Mitigation |
|--------|------------|
| Dev solo débordé | MVP ultra-lean, no-code prioritaire |
| Budget limité | SEO > Ads, croissance organique |

---

## Functional Requirements

### Soumission de Demande (Client)

- **FR1:** Client peut soumettre une demande d'urgence via formulaire web
- **FR2:** Client peut sélectionner le type de panne dans une liste prédéfinie
- **FR3:** Client peut ajouter une photo facultative à sa demande
- **FR4:** Client peut renseigner sa description libre du problème
- **FR5:** Client peut fournir son numéro de téléphone
- **FR6:** Client peut voir une fourchette de prix indicative selon le type de panne sélectionné

### Confirmation et Suivi (Client)

- **FR7:** Client reçoit une confirmation immédiate de sa demande (SMS)
- **FR8:** Client reçoit le nom de l'artisan qui va le contacter (WhatsApp)
- **FR9:** Client reçoit un message de suivi automatique à J+3
- **FR10:** Client peut répondre au suivi J+3 (OUI/NON intervention réussie)

### Notification Artisan

- **FR11:** Artisan reçoit une notification de nouveau lead via WhatsApp
- **FR12:** Artisan voit dans la notification : type de panne, distance, description, photo si fournie
- **FR13:** Artisan reçoit un SMS de fallback si WhatsApp échoue
- **FR14:** Artisan reçoit un email de fallback si SMS échoue
- **FR15:** Artisan reçoit la notification dans un délai < 10 secondes après soumission

### Attribution et Cascade Lead

- **FR16:** Système attribue le lead à l'artisan prioritaire disponible dans la zone
- **FR17:** Artisan peut accepter le lead via bouton dans la notification
- **FR18:** Système redistribue le lead après 2 minutes sans acceptation
- **FR19:** Système notifie jusqu'à 3 artisans en cascade (puis 4e si > 4 min)
- **FR20:** Système décompte 1 crédit au moment de l'acceptation du lead
- **FR21:** Artisan voit "Lead déjà attribué" s'il répond trop tard

### Dashboard Artisan

- **FR22:** Artisan peut consulter la liste de ses leads (acceptés, en attente, perdus)
- **FR23:** Artisan peut voir le détail d'un lead (contact client, description, photo)
- **FR24:** Artisan peut voir son solde de crédits restants
- **FR25:** Artisan peut voir son historique de leads avec statuts
- **FR26:** Artisan peut accéder au numéro du client après acceptation

### Paiement et Crédits

- **FR27:** Artisan peut acheter un pack de 5 crédits (avec réduction 10%)
- **FR28:** Artisan peut acheter un pack de 10 crédits (avec réduction 15%)
- **FR29:** Artisan peut acheter un pack de 20 crédits (avec réduction 20%)
- **FR30:** Artisan peut payer par carte via LemonSqueezy
- **FR31:** Artisan reçoit une facture automatique après achat
- **FR32:** Artisan peut consulter son historique d'achats

### Profil et Inscription Artisan

- **FR33:** Artisan peut s'inscrire avec ses informations de base (nom, ville, métier, téléphone)
- **FR34:** Artisan peut accepter les CGV lors de l'inscription
- **FR35:** Artisan peut configurer son numéro WhatsApp pour les notifications
- **FR36:** Artisan dispose d'une page publique (prénom, ville, badge réactivité)
- **FR37:** Artisan peut voir le lien vers sa fiche Google sur sa page publique
- **FR38:** Artisan peut se connecter via magic link ou mot de passe

### Administration

- **FR39:** Admin peut consulter le dashboard avec métriques du jour (leads, taux réponse, artisans actifs)
- **FR40:** Admin peut voir la liste des artisans avec leur statut (actif/inactif)
- **FR41:** Admin peut désactiver temporairement un artisan manuellement
- **FR42:** Système désactive automatiquement un artisan après 3 leads ratés consécutifs
- **FR43:** Admin peut gérer les réclamations clients
- **FR44:** Admin peut créditer des leads gratuits à un artisan ou client
- **FR45:** Admin peut consulter l'historique des leads avec filtres

### Multi-Tenant et Verticales

- **FR46:** Système gère plusieurs verticales métiers (plombier.urgent.fr, etc.)
- **FR47:** Artisan appartient à une verticale métier spécifique
- **FR48:** Leads sont isolés par verticale métier
- **FR49:** Chaque verticale dispose de sa propre grille tarifaire indicative

---

## Non-Functional Requirements

### Performance

| NFR | Spécification |
|-----|---------------|
| NFR-P1 | Notification artisan envoyée < 10 secondes après soumission demande |
| NFR-P2 | Landing page charge < 3 secondes (mobile 4G) |
| NFR-P3 | Dashboard artisan charge < 2 secondes |
| NFR-P4 | Soumission formulaire traitée < 5 secondes |
| NFR-P5 | Attribution cascade complète en < 6 minutes (3 artisans × 2 min) |

### Security

| NFR | Spécification |
|-----|---------------|
| NFR-S1 | Données personnelles chiffrées au repos (Supabase encryption) |
| NFR-S2 | Communications HTTPS obligatoires (TLS 1.2+) |
| NFR-S3 | Numéros téléphone masqués dans les logs |
| NFR-S4 | Authentification artisan sécurisée (magic link expiration 15 min) |
| NFR-S5 | Conformité RGPD : consentement, droit à l'oubli, export données |
| NFR-S6 | Paiements délégués à LemonSqueezy (PCI-DSS compliant) |
| NFR-S7 | Accès admin protégé par 2FA |

### Reliability

| NFR | Spécification |
|-----|---------------|
| NFR-R1 | Uptime plateforme ≥ 99% (hors maintenance planifiée) |
| NFR-R2 | Fallback notifications : WhatsApp → SMS → Email (automatique) |
| NFR-R3 | Délivrabilité messages ≥ 95% |
| NFR-R4 | Récupération données en cas d'erreur (retry automatique × 3) |
| NFR-R5 | Backup base de données quotidien (rétention 30 jours) |

### Integration

| NFR | Spécification |
|-----|---------------|
| NFR-I1 | WhatsApp Cloud API : envoi template messages validés |
| NFR-I2 | LemonSqueezy : webhooks paiement avec vérification signature |
| NFR-I3 | Firebase Storage : upload photos max 5MB, compression auto |
| NFR-I4 | n8n : workflows avec monitoring erreurs et alertes |
| NFR-I5 | SMS gateway : support opérateurs FR (SFR, Orange, Bouygues, Free) |
| NFR-I6 | APIs externes : timeout 10s, circuit breaker après 3 échecs |

### Scalability

| NFR | Spécification |
|-----|---------------|
| NFR-SC1 | MVP : 100 leads/jour, 50 artisans actifs simultanés |
| NFR-SC2 | Growth : 500 leads/jour sans dégradation performance |
| NFR-SC3 | Architecture stateless (scalabilité horizontale possible) |
| NFR-SC4 | Base de données indexée pour requêtes fréquentes (leads par zone, artisan) |

### Accessibility

| NFR | Spécification |
|-----|---------------|
| NFR-A1 | Formulaire client responsive (mobile-first) |
| NFR-A2 | Contraste texte WCAG AA (ratio 4.5:1 minimum) |
| NFR-A3 | Navigation clavier fonctionnelle sur formulaire |
| NFR-A4 | Labels explicites sur tous les champs de formulaire |
