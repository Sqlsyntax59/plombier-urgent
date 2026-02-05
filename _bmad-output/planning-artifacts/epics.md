---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
status: 'complete'
completedAt: '2026-01-27'
totalEpics: 10
totalStories: 55
updatedAt: '2026-02-06'
frCoverage: '100%'
inputDocuments: ['prd.md', 'architecture.md', 'ux_design.md']
workflowType: 'epics-and-stories'
project_name: 'SaaS Artisans Urgents'
user_name: 'Graous'
date: '2026-01-27'
---

# SaaS Artisans Urgents - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for SaaS Artisans Urgents, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**Soumission de Demande (Client)**
- FR1: Client peut soumettre une demande d'urgence via formulaire web
- FR2: Client peut sélectionner le type de panne dans une liste prédéfinie
- FR3: Client peut ajouter une photo facultative à sa demande
- FR4: Client peut renseigner sa description libre du problème
- FR5: Client peut fournir son numéro de téléphone
- FR6: Client peut voir une fourchette de prix indicative selon le type de panne sélectionné

**Confirmation et Suivi (Client)**
- FR7: Client reçoit une confirmation immédiate de sa demande (SMS)
- FR8: Client reçoit le nom de l'artisan qui va le contacter (WhatsApp)
- FR9: Client reçoit un message de suivi automatique à J+3
- FR10: Client peut répondre au suivi J+3 (OUI/NON intervention réussie)

**Notification Artisan**
- FR11: Artisan reçoit une notification de nouveau lead via WhatsApp
- FR12: Artisan voit dans la notification : type de panne, distance, description, photo si fournie
- FR13: Artisan reçoit un SMS de fallback si WhatsApp échoue
- FR14: Artisan reçoit un email de fallback si SMS échoue
- FR15: Artisan reçoit la notification dans un délai < 10 secondes après soumission

**Attribution et Cascade Lead**
- FR16: Système attribue le lead à l'artisan prioritaire disponible dans la zone
- FR17: Artisan peut accepter le lead via bouton dans la notification
- FR18: Système redistribue le lead après 2 minutes sans acceptation
- FR19: Système notifie jusqu'à 3 artisans en cascade (puis 4e si > 4 min)
- FR20: Système décompte 1 crédit au moment de l'acceptation du lead
- FR21: Artisan voit "Lead déjà attribué" s'il répond trop tard

**Dashboard Artisan**
- FR22: Artisan peut consulter la liste de ses leads (acceptés, en attente, perdus)
- FR23: Artisan peut voir le détail d'un lead (contact client, description, photo)
- FR24: Artisan peut voir son solde de crédits restants
- FR25: Artisan peut voir son historique de leads avec statuts
- FR26: Artisan peut accéder au numéro du client après acceptation

**Paiement et Crédits**
- FR27: Artisan peut acheter un pack de 5 crédits (avec réduction 10%)
- FR28: Artisan peut acheter un pack de 10 crédits (avec réduction 15%)
- FR29: Artisan peut acheter un pack de 20 crédits (avec réduction 20%)
- FR30: Artisan peut payer par carte via LemonSqueezy
- FR31: Artisan reçoit une facture automatique après achat
- FR32: Artisan peut consulter son historique d'achats

**Profil et Inscription Artisan**
- FR33: Artisan peut s'inscrire avec ses informations de base (nom, ville, métier, téléphone)
- FR34: Artisan peut accepter les CGV lors de l'inscription
- FR35: Artisan peut configurer son numéro WhatsApp pour les notifications
- FR36: Artisan dispose d'une page publique (prénom, ville, badge réactivité)
- FR37: Artisan peut voir le lien vers sa fiche Google sur sa page publique
- FR38: Artisan peut se connecter via magic link ou mot de passe

**Administration**
- FR39: Admin peut consulter le dashboard avec métriques du jour (leads, taux réponse, artisans actifs)
- FR40: Admin peut voir la liste des artisans avec leur statut (actif/inactif)
- FR41: Admin peut désactiver temporairement un artisan manuellement
- FR42: Système désactive automatiquement un artisan après 3 leads ratés consécutifs
- FR43: Admin peut gérer les réclamations clients
- FR44: Admin peut créditer des leads gratuits à un artisan ou client
- FR45: Admin peut consulter l'historique des leads avec filtres

**Multi-Tenant et Verticales**
- FR46: Système gère plusieurs verticales métiers (plombier.urgent.fr, etc.)
- FR47: Artisan appartient à une verticale métier spécifique
- FR48: Leads sont isolés par verticale métier
- FR49: Chaque verticale dispose de sa propre grille tarifaire indicative

### Non-Functional Requirements

**Performance**
- NFR-P1: Notification artisan envoyée < 10 secondes après soumission demande
- NFR-P2: Landing page charge < 3 secondes (mobile 4G)
- NFR-P3: Dashboard artisan charge < 2 secondes
- NFR-P4: Soumission formulaire traitée < 5 secondes
- NFR-P5: Attribution cascade complète en < 6 minutes (3 artisans × 2 min)

**Security**
- NFR-S1: Données personnelles chiffrées au repos (Supabase encryption)
- NFR-S2: Communications HTTPS obligatoires (TLS 1.2+)
- NFR-S3: Numéros téléphone masqués dans les logs
- NFR-S4: Authentification artisan sécurisée (magic link expiration 15 min)
- NFR-S5: Conformité RGPD : consentement, droit à l'oubli, export données
- NFR-S6: Paiements délégués à LemonSqueezy (PCI-DSS compliant)
- NFR-S7: Accès admin protégé par 2FA

**Reliability**
- NFR-R1: Uptime plateforme ≥ 99% (hors maintenance planifiée)
- NFR-R2: Fallback notifications : WhatsApp → SMS → Email (automatique)
- NFR-R3: Délivrabilité messages ≥ 95%
- NFR-R4: Récupération données en cas d'erreur (retry automatique × 3)
- NFR-R5: Backup base de données quotidien (rétention 30 jours)

**Integration**
- NFR-I1: WhatsApp Cloud API : envoi template messages validés
- NFR-I2: LemonSqueezy : webhooks paiement avec vérification signature
- NFR-I3: Firebase Storage : upload photos max 5MB, compression auto
- NFR-I4: n8n : workflows avec monitoring erreurs et alertes
- NFR-I5: SMS gateway : support opérateurs FR (SFR, Orange, Bouygues, Free)
- NFR-I6: APIs externes : timeout 10s, circuit breaker après 3 échecs

**Scalability**
- NFR-SC1: MVP : 100 leads/jour, 50 artisans actifs simultanés
- NFR-SC2: Growth : 500 leads/jour sans dégradation performance
- NFR-SC3: Architecture stateless (scalabilité horizontale possible)
- NFR-SC4: Base de données indexée pour requêtes fréquentes (leads par zone, artisan)

**Accessibility**
- NFR-A1: Formulaire client responsive (mobile-first)
- NFR-A2: Contraste texte WCAG AA (ratio 4.5:1 minimum)
- NFR-A3: Navigation clavier fonctionnelle sur formulaire
- NFR-A4: Labels explicites sur tous les champs de formulaire

### Additional Requirements

**Starter Template (Architecture)**
- Utiliser Vercel Supabase Starter : `npx create-next-app@latest -e with-supabase`
- Stack : Next.js 15 App Router + TypeScript + Tailwind CSS + shadcn/ui
- Auth SSR cookies-based via Supabase Auth

**Integrations à configurer**
- LemonSqueezy : webhooks paiement avec signature verification
- WhatsApp Cloud API : via n8n pour notifications
- Firebase Storage : upload photos avec compression auto
- n8n workflows : cascade leads, suivi J+3, alertes artisans

**Patterns techniques (Architecture)**
- Validation : Zod (schémas partagés client/serveur)
- Forms : React Hook Form + Zod resolver
- API pattern : Next.js Server Actions avec format `{ data, error }`
- Database : Supabase PostgreSQL avec RLS activé
- Multi-tenant : isolation par `vertical_id`

**UI Design (Architecture)**
- Outil : Gemini AI + MCP pour génération composants
- Style : élégant, épuré, rassurant
- Différenciation : pages publiques (accueillant) vs dashboards (professionnel)

**UX Design Guidelines (ux_design.md)**

*Philosophie :*
- "Zero friction UX" : Moins de clics, moins d'attente, plus d'action
- "Emergency-first" : Le besoin d'urgence guide chaque écran
- "Design pour l'invisible" : Le design ne doit jamais ralentir ou distraire

*Stack UI :*
- TailwindCSS + shadcn/ui + Gemini + MCP
- Radius : `rounded-2xl` pour esthétique douce
- Padding : Minimum `p-4`, souvent `p-6` pour confort

*Landing Page (Client B2C) :*
- CTA unique : formulaire d'urgence visible au 1er scroll
- Fond clair, icônes simples, typographie rassurante
- Illustration ou photo de "situation problème"

*Formulaire de Demande :*
- Étape 1 : Description (texte + photo optionnelle)
- Étape 2 : Coordonnées (tel obligatoire, email facultatif)
- Étape 3 : Fourchette de prix estimée
- Bouton : "Contacter un artisan maintenant"

*Dashboard Artisan :*
- Vue mobile-first
- Composant principal : Liste de leads avec état (nouveau, accepté, réalisé)
- Action unique par lead : "J'accepte"
- Stats visibles : Leads restants, taux réponse

*Page Publique Artisan :*
- Prénom, ville, rayon d'action
- Badge "Réactif" si répond < 2min en moyenne
- Avis Google (via Google Places API)
- Bouton : "Contacter cet artisan"

*Ton & Rendu Visuel :*
- Minimalisme affirmé, pas de distractions
- Police : Sans serif moderne (Inter)
- Palette : Tons bleus/verts rassurants + rouge alerte modéré
- Animations : Subtiles (framer-motion)

*Métriques UX à mesurer :*
- Temps moyen entre soumission et contact
- Taux d'abandon du formulaire
- Taux de réponse artisan sous 2 minutes

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 3 | Client soumet demande urgence |
| FR2 | Epic 3 | Client sélectionne type panne |
| FR3 | Epic 3 | Client ajoute photo |
| FR4 | Epic 3 | Client renseigne description |
| FR5 | Epic 3 | Client fournit téléphone |
| FR6 | Epic 3 | Client voit fourchette prix |
| FR7 | Epic 7 | Client reçoit confirmation SMS |
| FR8 | Epic 7 | Client reçoit nom artisan WhatsApp |
| FR9 | Epic 7 | Client reçoit suivi J+3 |
| FR10 | Epic 7 | Client répond au suivi |
| FR11 | Epic 4 | Artisan reçoit notification WhatsApp |
| FR12 | Epic 4 | Artisan voit détails dans notification |
| FR13 | Epic 4 | Artisan reçoit SMS fallback |
| FR14 | Epic 4 | Artisan reçoit email fallback |
| FR15 | Epic 4 | Notification < 10 secondes |
| FR16 | Epic 4 | Attribution artisan prioritaire |
| FR17 | Epic 4 | Artisan accepte lead |
| FR18 | Epic 4 | Redistribution après 2 min |
| FR19 | Epic 4 | Cascade jusqu'à 3 artisans |
| FR20 | Epic 4 | Décompte crédit à l'acceptation |
| FR21 | Epic 4 | Message "Lead déjà attribué" |
| FR22 | Epic 5 | Artisan consulte liste leads |
| FR23 | Epic 5 | Artisan voit détail lead |
| FR24 | Epic 5 | Artisan voit solde crédits |
| FR25 | Epic 5 | Artisan voit historique leads |
| FR26 | Epic 5 | Artisan accède numéro client |
| FR27 | Epic 6 | Artisan achète pack 5 crédits |
| FR28 | Epic 6 | Artisan achète pack 10 crédits |
| FR29 | Epic 6 | Artisan achète pack 20 crédits |
| FR30 | Epic 6 | Artisan paie via LemonSqueezy |
| FR31 | Epic 6 | Artisan reçoit facture |
| FR32 | Epic 6 | Artisan consulte historique achats |
| FR33 | Epic 2 | Artisan s'inscrit |
| FR34 | Epic 2 | Artisan accepte CGV |
| FR35 | Epic 2 | Artisan configure WhatsApp |
| FR36 | Epic 2 | Artisan a page publique |
| FR37 | Epic 2 | Artisan voit lien Google |
| FR38 | Epic 2 | Artisan se connecte |
| FR39 | Epic 8 | Admin consulte dashboard |
| FR40 | Epic 8 | Admin voit liste artisans |
| FR41 | Epic 8 | Admin désactive artisan |
| FR42 | Epic 8 | Désactivation auto 3 leads ratés |
| FR43 | Epic 8 | Admin gère réclamations |
| FR44 | Epic 8 | Admin crédite leads gratuits |
| FR45 | Epic 8 | Admin consulte historique leads |
| FR46 | Epic 9 | Système gère verticales |
| FR47 | Epic 9 | Artisan appartient à verticale |
| FR48 | Epic 9 | Leads isolés par verticale |
| FR49 | Epic 9 | Grille tarifaire par verticale |
| FR50 | Epic 10 | Géocodage code postal → lat/lng (API BAN) |
| FR51 | Epic 10 | Cache géocodage (TTL 30j) |
| FR52 | Epic 10 | Calcul distance artisan-client |
| FR53 | Epic 10 | Score lead 0-100 (critères multiples) |
| FR54 | Epic 10 | Classification qualité lead (low/medium/high/premium) |
| FR55 | Epic 10 | Scoring factors en JSONB |
| FR56 | Epic 10 | Audit trail lead_events |
| FR57 | Epic 10 | Score réactivité artisan 0-100 |
| FR58 | Epic 10 | Badge "Réactif" (conditions seuils) |
| FR59 | Epic 10 | Formule score réactivité |
| FR60 | Epic 10 | Recalcul nightly cron |
| FR61 | Epic 10 | Badge visible dashboard artisan |
| FR62 | Epic 10 | Sélection 3 artisans proches |
| FR63 | Epic 10 | Tri distance/reactive_score/crédits |
| FR64 | Epic 10 | Notification simultanée 3 artisans |
| FR65 | Epic 10 | Premier accepte gagne (lock) |
| FR66 | Epic 10 | "Lead déjà attribué" autres |
| FR67 | Epic 10 | Nouvelle vague après 5min |

## Epic List

### Epic 1: Setup Projet & Fondations

Initialiser le projet avec le starter template Vercel Supabase et configurer l'infrastructure de base : schéma de base de données, authentification Supabase, composants shadcn/ui, et structure de fichiers.

**FRs couverts:** Infrastructure (prérequis pour tous les epics)

---

### Epic 2: Inscription & Profil Artisan

L'artisan peut s'inscrire sur la plateforme, se connecter via magic link ou mot de passe, configurer son profil et disposer d'une page publique visible par les clients.

**FRs couverts:** FR33, FR34, FR35, FR36, FR37, FR38

---

### Epic 3: Soumission de Demande Client

Le client en situation d'urgence peut soumettre une demande complète via le formulaire web, incluant le type de panne, une description, une photo optionnelle, et voir une estimation de prix.

**FRs couverts:** FR1, FR2, FR3, FR4, FR5, FR6

---

### Epic 4: Notification & Attribution des Leads

Le système notifie les artisans des nouveaux leads via WhatsApp (avec fallback SMS/Email), gère l'attribution au premier artisan prioritaire, et redistribue automatiquement via cascade après 2 minutes d'inactivité.

**FRs couverts:** FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21

---

### Epic 5: Dashboard Artisan

L'artisan peut consulter et gérer ses leads depuis son tableau de bord : voir la liste des leads, accéder aux détails et coordonnées client, suivre son solde de crédits et son historique.

**FRs couverts:** FR22, FR23, FR24, FR25, FR26

---

### Epic 6: Paiement & Crédits

L'artisan peut acheter des packs de crédits (5, 10, ou 20 leads) via LemonSqueezy, recevoir ses factures automatiquement, et consulter son historique d'achats.

**FRs couverts:** FR27, FR28, FR29, FR30, FR31, FR32

---

### Epic 7: Suivi Client

Le client reçoit une confirmation immédiate de sa demande, est informé de l'artisan qui va le contacter, et reçoit un message de suivi automatique à J+3 pour confirmer le bon déroulement de l'intervention.

**FRs couverts:** FR7, FR8, FR9, FR10

---

### Epic 8: Dashboard Admin

L'administrateur peut superviser l'ensemble de la plateforme : consulter les métriques, gérer les artisans (activation/désactivation), traiter les réclamations clients, et attribuer des crédits gratuits.

**FRs couverts:** FR39, FR40, FR41, FR42, FR43, FR44, FR45

---

### Epic 9: Multi-Tenant & Verticales

Le système gère plusieurs verticales métiers (plombier.urgent.fr, electricien.urgent.fr, etc.) avec isolation des données par vertical_id et grilles tarifaires spécifiques.

**FRs couverts:** FR46, FR47, FR48, FR49

---

## Epic 1: Setup Projet & Fondations

Initialiser le projet avec le starter template Vercel Supabase et configurer l'infrastructure de base.

### Story 1.1: Initialisation du Projet Next.js

**As a** développeur,
**I want** initialiser le projet avec le starter Vercel Supabase,
**So that** j'ai une base de code fonctionnelle avec l'authentification configurée.

**Acceptance Criteria:**

**Given** un environnement de développement configuré
**When** j'exécute `npx create-next-app@latest -e with-supabase`
**Then** le projet Next.js 15 est créé avec App Router
**And** Tailwind CSS et TypeScript sont configurés
**And** le projet compile sans erreur

---

### Story 1.2: Configuration Supabase et Schéma Initial

**As a** développeur,
**I want** configurer Supabase et créer le schéma de base de données initial,
**So that** les tables essentielles pour l'authentification et les verticales sont disponibles.

**Acceptance Criteria:**

**Given** le projet Next.js initialisé
**When** je configure les variables d'environnement Supabase et crée les migrations
**Then** les tables `verticals` et `profiles` sont créées
**And** les politiques RLS de base sont activées
**And** la connexion Supabase fonctionne en local

---

### Story 1.3: Installation shadcn/ui et Composants de Base

**As a** développeur,
**I want** installer shadcn/ui et configurer les composants de base,
**So that** j'ai une bibliothèque de composants UI cohérente et stylée.

**Acceptance Criteria:**

**Given** le projet avec Tailwind configuré
**When** j'installe shadcn/ui et les composants essentiels (Button, Input, Card, Form)
**Then** les composants sont disponibles dans `/components/ui/`
**And** le thème respecte la palette définie (bleu confiance, vert validation)
**And** les composants s'affichent correctement

---

### Story 1.4: Structure de Fichiers et Layout de Base

**As a** développeur,
**I want** créer la structure de fichiers et les layouts de base,
**So that** l'architecture du projet est organisée selon les conventions définies.

**Acceptance Criteria:**

**Given** le projet initialisé avec shadcn/ui
**When** je crée les dossiers et layouts pour les zones (public), (artisan), (admin)
**Then** les route groups sont créés avec leurs layouts respectifs
**And** les dossiers `/lib`, `/types`, `/components/forms`, `/components/dashboard` existent
**And** la navigation de base fonctionne entre les zones

---

## Epic 2: Inscription & Profil Artisan

L'artisan peut s'inscrire, se connecter et gérer son profil public.

### Story 2.1: Formulaire d'Inscription Artisan

**As a** artisan,
**I want** m'inscrire sur la plateforme avec mes informations de base,
**So that** je puisse recevoir des leads et développer mon activité.

**Acceptance Criteria:**

**Given** un visiteur sur la page d'inscription artisan
**When** il remplit le formulaire (nom, prénom, ville, métier, téléphone, email)
**Then** les données sont validées avec Zod
**And** la table `artisans` est créée avec les champs nécessaires
**And** un compte Supabase Auth est créé
**And** l'artisan est redirigé vers la configuration WhatsApp

---

### Story 2.2: Acceptation des CGV

**As a** artisan,
**I want** accepter les Conditions Générales de Vente lors de l'inscription,
**So that** mon engagement contractuel soit enregistré.

**Acceptance Criteria:**

**Given** un artisan sur le formulaire d'inscription
**When** il coche la case CGV et soumet le formulaire
**Then** la date d'acceptation est enregistrée dans `artisans.cgv_accepted_at`
**And** l'inscription ne peut pas être complétée sans cette acceptation
**And** un lien vers les CGV complètes est accessible

---

### Story 2.3: Configuration WhatsApp Artisan

**As a** artisan,
**I want** configurer mon numéro WhatsApp pour les notifications,
**So that** je reçoive les alertes de nouveaux leads instantanément.

**Acceptance Criteria:**

**Given** un artisan inscrit
**When** il renseigne son numéro WhatsApp
**Then** le numéro est validé (format français 06/07)
**And** le champ `artisans.whatsapp_number` est enregistré
**And** un message de test peut être envoyé pour vérification

---

### Story 2.4: Authentification Artisan (Magic Link / Password)

**As a** artisan,
**I want** me connecter via magic link ou mot de passe,
**So that** j'accède à mon dashboard de manière sécurisée.

**Acceptance Criteria:**

**Given** un artisan avec un compte existant
**When** il demande un magic link ou saisit son mot de passe
**Then** un email avec lien de connexion est envoyé (magic link)
**Or** le mot de passe est vérifié et la session créée
**And** le magic link expire après 15 minutes
**And** l'artisan est redirigé vers son dashboard après connexion

---

### Story 2.5: Page Publique Artisan

**As a** client,
**I want** voir la page publique d'un artisan,
**So that** je puisse évaluer sa fiabilité avant qu'il m'appelle.

**Acceptance Criteria:**

**Given** une URL `/artisan/[slug]`
**When** un visiteur accède à cette page
**Then** il voit le prénom, la ville et le rayon d'action de l'artisan
**And** le badge "Réactif" s'affiche si le taux de réponse < 2min
**And** un lien vers la fiche Google de l'artisan est affiché (si configuré)
**And** la page respecte le design UX (minimaliste, rassurant)

---

### Story 2.6: Gestion du Profil Artisan

**As a** artisan connecté,
**I want** modifier mes informations de profil,
**So that** mes données restent à jour.

**Acceptance Criteria:**

**Given** un artisan connecté sur son dashboard
**When** il accède à la page profil et modifie ses informations
**Then** il peut mettre à jour : ville, rayon d'action, téléphone, WhatsApp
**And** il peut ajouter son lien Google Business
**And** les modifications sont sauvegardées en base
**And** la page publique est mise à jour automatiquement

---

## Epic 3: Soumission de Demande Client

Le client peut soumettre une demande d'urgence complète.

### Story 3.1: Landing Page avec CTA Urgence

**As a** client en situation d'urgence,
**I want** voir immédiatement comment demander de l'aide,
**So that** je puisse agir rapidement sans perdre de temps.

**Acceptance Criteria:**

**Given** un visiteur sur la landing page
**When** la page se charge
**Then** le formulaire d'urgence est visible au premier scroll
**And** le CTA "Contacter un artisan maintenant" est proéminent
**And** la page charge en < 3 secondes (mobile 4G)
**And** le design est rassurant (fond clair, typographie claire)

---

### Story 3.2: Sélection du Type de Panne

**As a** client,
**I want** sélectionner le type de panne dans une liste,
**So that** l'artisan comprenne rapidement mon besoin.

**Acceptance Criteria:**

**Given** un client sur le formulaire de demande
**When** il sélectionne un type de panne
**Then** il voit les options : Fuite, WC bouché, Ballon d'eau chaude, Canalisation, Robinet, Autre
**And** la table `leads` est créée avec le champ `problem_type`
**And** la sélection est obligatoire pour continuer
**And** l'interface est mobile-first avec gros boutons tactiles

---

### Story 3.3: Description et Photo Optionnelle

**As a** client,
**I want** décrire mon problème et ajouter une photo,
**So that** l'artisan puisse évaluer la situation avant de venir.

**Acceptance Criteria:**

**Given** un client ayant sélectionné un type de panne
**When** il remplit la description et/ou ajoute une photo
**Then** la description est validée (10-500 caractères)
**And** la photo est uploadée sur Firebase Storage (max 5MB, compression auto)
**And** l'URL de la photo est stockée dans `leads.photo_url`
**And** la photo est optionnelle, la description obligatoire

---

### Story 3.4: Saisie des Coordonnées Client

**As a** client,
**I want** fournir mon numéro de téléphone,
**So that** l'artisan puisse me contacter rapidement.

**Acceptance Criteria:**

**Given** un client ayant rempli la description
**When** il saisit son numéro de téléphone
**Then** le numéro est validé (format français 06/07)
**And** le champ email est optionnel
**And** les données sont stockées dans `leads` (phone, email)
**And** le numéro est masqué dans les logs (NFR-S3)

---

### Story 3.5: Affichage Fourchette de Prix Indicative

**As a** client,
**I want** voir une estimation de prix selon mon type de panne,
**So that** je sache à quoi m'attendre financièrement.

**Acceptance Criteria:**

**Given** un client ayant sélectionné un type de panne
**When** il avance dans le formulaire
**Then** il voit la fourchette de prix correspondante (ex: "Fuite : 90-150€")
**And** les prix sont stockés dans la table `price_ranges` par type et verticale
**And** un disclaimer "prix indicatif" est affiché
**And** le prix s'affiche dynamiquement selon la sélection

---

### Story 3.6: Soumission et Création du Lead

**As a** client,
**I want** soumettre ma demande d'urgence,
**So that** un artisan soit contacté immédiatement.

**Acceptance Criteria:**

**Given** un client ayant rempli tous les champs obligatoires
**When** il clique sur "Contacter un artisan maintenant"
**Then** le lead est créé dans la table `leads` avec statut "pending"
**And** le traitement prend < 5 secondes
**And** le client voit un écran de confirmation
**And** le lead est prêt pour le système de notification (Epic 4)

---

## Epic 4: Notification & Attribution des Leads

Le système notifie les artisans et gère l'attribution avec cascade automatique.

### Story 4.1: Configuration n8n et Workflow de Base

**As a** développeur,
**I want** configurer n8n pour orchestrer les notifications,
**So that** les workflows automatisés puissent être déclenchés.

**Acceptance Criteria:**

**Given** un nouveau lead créé dans Supabase
**When** le webhook n8n est appelé
**Then** n8n reçoit les données du lead (type, description, photo_url, localisation)
**And** le workflow de notification est déclenché
**And** les erreurs sont loguées avec alertes

---

### Story 4.2: Algorithme d'Attribution Prioritaire

**As a** système,
**I want** attribuer le lead à l'artisan prioritaire disponible,
**So that** le client soit contacté par le meilleur artisan de la zone.

**Acceptance Criteria:**

**Given** un nouveau lead avec une localisation
**When** le système cherche un artisan
**Then** il sélectionne l'artisan actif le plus proche avec crédits > 0
**And** la priorité tient compte : distance < rayon d'action, crédits disponibles, statut actif
**And** la table `lead_assignments` est créée pour tracer les attributions
**And** l'artisan sélectionné est enregistré avec `status = 'pending'`

---

### Story 4.3: Notification WhatsApp Artisan

**As a** artisan,
**I want** recevoir une notification WhatsApp pour un nouveau lead,
**So that** je puisse réagir rapidement.

**Acceptance Criteria:**

**Given** un lead attribué à un artisan
**When** le workflow n8n envoie la notification
**Then** l'artisan reçoit un WhatsApp avec : type de panne, distance, description, photo (si fournie)
**And** un bouton/lien "J'accepte" est inclus
**And** la notification est envoyée en < 10 secondes après soumission
**And** le template WhatsApp est pré-validé par Meta

---

### Story 4.4: Fallback SMS si WhatsApp Échoue

**As a** artisan,
**I want** recevoir un SMS si WhatsApp n'est pas délivré,
**So that** je ne rate pas de lead même sans connexion data.

**Acceptance Criteria:**

**Given** un échec d'envoi WhatsApp (timeout ou erreur)
**When** n8n détecte l'échec
**Then** un SMS est envoyé automatiquement avec les infos essentielles
**And** le SMS contient un lien court vers l'acceptation
**And** le fallback est déclenché en < 30 secondes après l'échec WhatsApp

---

### Story 4.5: Fallback Email si SMS Échoue

**As a** artisan,
**I want** recevoir un email si SMS et WhatsApp échouent,
**So that** j'aie une dernière chance de voir le lead.

**Acceptance Criteria:**

**Given** un échec d'envoi SMS
**When** n8n détecte l'échec
**Then** un email est envoyé avec toutes les informations du lead
**And** l'email contient un bouton "Accepter ce lead"
**And** le statut de notification est tracé dans `lead_assignments.notification_channel`

---

### Story 4.6: Acceptation du Lead par l'Artisan

**As a** artisan,
**I want** accepter un lead via le lien reçu,
**So that** je puisse contacter le client.

**Acceptance Criteria:**

**Given** un artisan ayant reçu une notification
**When** il clique sur "J'accepte"
**Then** le lead passe en statut "accepted" dans `lead_assignments`
**And** le lead global passe en statut "assigned" dans `leads`
**And** l'artisan voit les coordonnées complètes du client
**And** un crédit est décompté de son solde

---

### Story 4.7: Timer 2 Minutes et Redistribution

**As a** système,
**I want** redistribuer le lead si l'artisan ne répond pas en 2 minutes,
**So that** le client ne reste pas sans réponse.

**Acceptance Criteria:**

**Given** un lead attribué à un artisan
**When** 2 minutes s'écoulent sans acceptation
**Then** le lead est redistribué au prochain artisan disponible
**And** l'ancien assignment passe en statut "expired"
**And** le nouveau workflow de notification démarre
**And** le timer est géré par n8n (delay node)

---

### Story 4.8: Cascade jusqu'à 3 Artisans

**As a** système,
**I want** notifier jusqu'à 3 artisans en cascade,
**So that** le lead ait maximum de chances d'être pris.

**Acceptance Criteria:**

**Given** un lead non accepté après 2 redistributions
**When** le 3ème artisan est notifié
**Then** la cascade s'arrête après le 3ème artisan
**And** si > 4 min total, un 4ème artisan peut être notifié exceptionnellement
**And** le compteur de cascade est tracé dans `leads.cascade_count`
**And** si aucun artisan n'accepte, le lead passe en "unassigned"

---

### Story 4.9: Décompte de Crédit à l'Acceptation

**As a** système,
**I want** décompter un crédit uniquement à l'acceptation,
**So that** l'artisan ne paie que les leads qu'il prend.

**Acceptance Criteria:**

**Given** un artisan qui accepte un lead
**When** l'acceptation est confirmée
**Then** 1 crédit est déduit de `artisans.credits`
**And** une transaction est enregistrée dans `credit_transactions`
**And** si crédits = 0, l'artisan ne reçoit plus de notifications
**And** le décompte est atomique (pas de double déduction)

---

### Story 4.10: Message "Lead Déjà Attribué"

**As a** artisan,
**I want** voir un message clair si je clique trop tard,
**So that** je comprenne pourquoi je n'ai pas le lead.

**Acceptance Criteria:**

**Given** un artisan qui clique sur "J'accepte" après expiration
**When** le système vérifie le statut
**Then** il affiche "Ce lead a déjà été attribué à un autre artisan"
**And** aucun crédit n'est décompté
**And** l'artisan est redirigé vers son dashboard
**And** une suggestion "Activez les notifications pour réagir plus vite" s'affiche

---

## Epic 5: Dashboard Artisan

L'artisan peut consulter et gérer ses leads depuis son tableau de bord.

### Story 5.1: Liste des Leads Artisan

**As a** artisan connecté,
**I want** voir la liste de tous mes leads,
**So that** je puisse suivre mon activité.

**Acceptance Criteria:**

**Given** un artisan connecté sur son dashboard
**When** il accède à la page leads
**Then** il voit ses leads avec statuts : nouveau, accepté, réalisé, perdu
**And** la liste est triée par date (plus récent en premier)
**And** l'interface est mobile-first avec cards cliquables

---

### Story 5.2: Détail d'un Lead

**As a** artisan,
**I want** voir le détail complet d'un lead accepté,
**So that** je puisse préparer mon intervention.

**Acceptance Criteria:**

**Given** un artisan ayant accepté un lead
**When** il clique sur le lead
**Then** il voit : type de panne, description, photo, adresse/zone
**And** les coordonnées client sont visibles (téléphone)
**And** un bouton "Appeler" lance l'appel direct (mobile)

---

### Story 5.3: Affichage Solde de Crédits

**As a** artisan,
**I want** voir mon solde de crédits en permanence,
**So that** je sache quand recharger.

**Acceptance Criteria:**

**Given** un artisan sur son dashboard
**When** la page se charge
**Then** le solde de crédits est affiché en évidence
**And** une alerte s'affiche si crédits ≤ 2
**And** un lien "Acheter des crédits" est accessible

---

### Story 5.4: Historique des Leads

**As a** artisan,
**I want** consulter l'historique de tous mes leads,
**So that** je puisse analyser ma performance.

**Acceptance Criteria:**

**Given** un artisan sur son dashboard
**When** il accède à l'historique
**Then** il voit tous les leads avec leur statut final
**And** il peut filtrer par période et statut
**And** les stats de conversion sont affichées (acceptés/total)

---

### Story 5.5: Accès Coordonnées Client

**As a** artisan,
**I want** accéder au numéro du client uniquement après acceptation,
**So that** la confidentialité soit respectée.

**Acceptance Criteria:**

**Given** un lead non accepté
**When** l'artisan consulte le lead
**Then** le numéro est masqué (06 ** ** **)
**And** après acceptation, le numéro complet est visible
**And** le RLS Supabase garantit cette restriction

---

## Epic 6: Paiement & Crédits

L'artisan peut acheter des packs de crédits via LemonSqueezy.

### Story 6.1: Page Achat de Crédits

**As a** artisan,
**I want** voir les packs de crédits disponibles,
**So that** je puisse choisir celui qui me convient.

**Acceptance Criteria:**

**Given** un artisan connecté
**When** il accède à la page crédits
**Then** il voit les 3 packs : 5 leads (-10%), 10 leads (-15%), 20 leads (-20%)
**And** les prix sont affichés clairement avec les économies
**And** le design met en avant le pack recommandé (10 leads)

---

### Story 6.2: Intégration LemonSqueezy Checkout

**As a** artisan,
**I want** payer par carte via LemonSqueezy,
**So that** mon achat soit sécurisé.

**Acceptance Criteria:**

**Given** un artisan qui sélectionne un pack
**When** il clique sur "Acheter"
**Then** il est redirigé vers le checkout LemonSqueezy
**And** les produits sont créés dans LemonSqueezy (3 packs)
**And** le paiement PCI-DSS est géré par LemonSqueezy

---

### Story 6.3: Webhook LemonSqueezy et Crédit des Leads

**As a** système,
**I want** créditer automatiquement les leads après paiement,
**So that** l'artisan puisse utiliser ses crédits immédiatement.

**Acceptance Criteria:**

**Given** un paiement réussi sur LemonSqueezy
**When** le webhook `order_created` est reçu
**Then** la signature du webhook est vérifiée
**And** les crédits sont ajoutés à `artisans.credits`
**And** une transaction est enregistrée dans `credit_transactions`
**And** l'artisan reçoit un email de confirmation

---

### Story 6.4: Facture Automatique

**As a** artisan,
**I want** recevoir une facture après chaque achat,
**So that** je puisse la déduire de mes charges.

**Acceptance Criteria:**

**Given** un paiement réussi
**When** LemonSqueezy traite la commande
**Then** une facture PDF est générée automatiquement
**And** la facture est envoyée par email
**And** la facture est accessible dans le dashboard LemonSqueezy

---

### Story 6.5: Historique des Achats

**As a** artisan,
**I want** consulter mon historique d'achats,
**So that** je puisse suivre mes dépenses.

**Acceptance Criteria:**

**Given** un artisan sur son dashboard
**When** il accède à l'historique achats
**Then** il voit toutes ses transactions (date, montant, crédits)
**And** il peut télécharger les factures
**And** le total dépensé est affiché

---

## Epic 7: Suivi Client

Le client reçoit les confirmations et le suivi J+3.

### Story 7.1: Confirmation SMS au Client

**As a** client,
**I want** recevoir un SMS de confirmation après ma demande,
**So that** je sache que ma demande est prise en compte.

**Acceptance Criteria:**

**Given** un client qui soumet une demande
**When** le lead est créé
**Then** un SMS est envoyé "Votre demande a été reçue, un artisan va vous contacter"
**And** le SMS est envoyé via n8n < 30 secondes
**And** le numéro expéditeur est identifiable

---

### Story 7.2: Notification WhatsApp avec Nom Artisan

**As a** client,
**I want** recevoir le nom de l'artisan qui va me contacter,
**So that** je puisse l'identifier quand il m'appelle.

**Acceptance Criteria:**

**Given** un lead accepté par un artisan
**When** l'acceptation est confirmée
**Then** le client reçoit un WhatsApp "Lucas va vous contacter sous peu"
**And** le message inclut le prénom et la note Google si disponible
**And** un lien vers la page publique de l'artisan est inclus

---

### Story 7.3: Suivi Automatique J+3

**As a** client,
**I want** recevoir un message de suivi 3 jours après ma demande,
**So that** je puisse confirmer le bon déroulement.

**Acceptance Criteria:**

**Given** un lead accepté
**When** 3 jours se sont écoulés
**Then** n8n déclenche un workflow de suivi
**And** le client reçoit un WhatsApp "Votre intervention s'est bien passée ?"
**And** deux boutons de réponse : "OUI" / "NON"

---

### Story 7.4: Traitement Réponse Suivi J+3

**As a** système,
**I want** enregistrer la réponse du client au suivi,
**So that** je puisse mesurer la satisfaction.

**Acceptance Criteria:**

**Given** un client qui répond au suivi J+3
**When** il clique sur OUI ou NON
**Then** la réponse est enregistrée dans `leads.satisfaction`
**And** si NON, une alerte est créée pour le support
**And** les stats NPS sont calculables depuis ces données

---

## Epic 8: Dashboard Admin

L'administrateur peut superviser la plateforme.

### Story 8.1: Dashboard Métriques Admin

**As a** admin,
**I want** voir les métriques clés de la plateforme,
**So that** je puisse piloter l'activité.

**Acceptance Criteria:**

**Given** un admin connecté (2FA requis)
**When** il accède au dashboard
**Then** il voit : leads du jour, taux réponse, artisans actifs, revenus
**And** les métriques sont mises à jour en temps réel
**And** des graphiques montrent l'évolution sur 7/30 jours

---

### Story 8.2: Liste et Gestion des Artisans

**As a** admin,
**I want** voir la liste des artisans avec leur statut,
**So that** je puisse modérer la plateforme.

**Acceptance Criteria:**

**Given** un admin sur le dashboard
**When** il accède à la liste artisans
**Then** il voit : nom, ville, statut, crédits, taux réponse, leads ratés
**And** il peut filtrer par statut (actif/inactif/suspendu)
**And** il peut rechercher par nom ou ville

---

### Story 8.3: Désactivation Manuelle Artisan

**As a** admin,
**I want** désactiver temporairement un artisan,
**So that** je puisse gérer les cas problématiques.

**Acceptance Criteria:**

**Given** un admin sur la fiche d'un artisan
**When** il clique sur "Désactiver"
**Then** l'artisan passe en statut "inactive"
**And** il ne reçoit plus de notifications de leads
**And** une raison peut être saisie (optionnel)
**And** l'artisan peut être réactivé ultérieurement

---

### Story 8.4: Désactivation Automatique 3 Leads Ratés

**As a** système,
**I want** désactiver automatiquement un artisan après 3 leads ratés consécutifs,
**So that** les leads ne soient pas gaspillés.

**Acceptance Criteria:**

**Given** un artisan avec 3 leads expirés consécutifs
**When** le 3ème lead expire
**Then** l'artisan passe en statut "auto_suspended"
**And** il reçoit une notification "Compte suspendu - 3 leads non répondus"
**And** il peut demander la réactivation via le dashboard
**And** le compteur se remet à 0 après un lead accepté

---

### Story 8.5: Gestion des Réclamations

**As a** admin,
**I want** gérer les réclamations clients,
**So that** je puisse résoudre les litiges.

**Acceptance Criteria:**

**Given** un client mécontent (réponse NON au suivi J+3)
**When** l'admin consulte les réclamations
**Then** il voit la liste des leads avec satisfaction = "NON"
**And** il peut voir le détail : client, artisan, historique
**And** il peut ajouter des notes internes
**And** il peut marquer comme "résolu"

---

### Story 8.6: Attribution Crédits Gratuits

**As a** admin,
**I want** créditer des leads gratuits à un artisan ou client,
**So that** je puisse compenser les problèmes.

**Acceptance Criteria:**

**Given** un admin sur une réclamation ou fiche artisan
**When** il clique sur "Créditer leads gratuits"
**Then** il peut saisir le nombre de crédits à offrir
**And** les crédits sont ajoutés immédiatement
**And** une transaction "gift" est enregistrée
**And** une notification est envoyée au bénéficiaire

---

### Story 8.7: Historique des Leads avec Filtres

**As a** admin,
**I want** consulter l'historique complet des leads,
**So that** je puisse investiguer des cas précis.

**Acceptance Criteria:**

**Given** un admin sur le dashboard
**When** il accède à l'historique leads
**Then** il voit tous les leads avec : date, client, artisan, statut, satisfaction
**And** il peut filtrer par : date, statut, artisan, verticale
**And** il peut exporter en CSV

---

## Epic 9: Multi-Tenant & Verticales

Le système gère plusieurs verticales métiers.

### Story 9.1: Table et Configuration des Verticales

**As a** système,
**I want** gérer plusieurs verticales métiers,
**So that** la plateforme puisse s'étendre à d'autres métiers.

**Acceptance Criteria:**

**Given** la table `verticals` existante
**When** une nouvelle verticale est ajoutée
**Then** elle contient : slug, nom, domaine, config spécifique
**And** le routage par sous-domaine est géré (plombier.urgent.fr)
**And** la verticale "plombier" est créée par défaut

---

### Story 9.2: Association Artisan-Verticale

**As a** artisan,
**I want** appartenir à une verticale métier,
**So that** je reçoive uniquement les leads de mon métier.

**Acceptance Criteria:**

**Given** un artisan qui s'inscrit
**When** il choisit son métier
**Then** il est associé à la verticale correspondante
**And** le champ `artisans.vertical_id` est renseigné
**And** les politiques RLS filtrent par vertical_id

---

### Story 9.3: Isolation des Leads par Verticale

**As a** système,
**I want** isoler les leads par verticale,
**So that** les données soient cloisonnées.

**Acceptance Criteria:**

**Given** un lead créé sur plombier.urgent.fr
**When** le lead est enregistré
**Then** il est associé à la verticale "plombier"
**And** les artisans d'autres verticales ne le voient pas
**And** les RLS garantissent l'isolation en base

---

### Story 9.4: Grille Tarifaire par Verticale

**As a** admin,
**I want** définir des prix indicatifs par verticale,
**So that** chaque métier ait ses propres tarifs.

**Acceptance Criteria:**

**Given** la table `price_ranges`
**When** un admin configure les prix
**Then** chaque type de panne a une fourchette min/max par verticale
**And** les prix s'affichent automatiquement dans le formulaire client
**And** les prix des crédits peuvent aussi varier par verticale (futur)

---

## Epic 10: Lead Scoring + Badge Réactif + Géolocalisation (Phase 2)

Système intelligent de scoring des leads, badge de réactivité artisan, géocodage des adresses, et attribution multi-artisans simultanée remplaçant la cascade séquentielle.

**FRs couverts:** FR50, FR51, FR52, FR53, FR54, FR55, FR56, FR57, FR58, FR59, FR60, FR61, FR62, FR63, FR64, FR65, FR66, FR67

---

### Story 10.1: Géocodage API BAN

**As a** système,
**I want** convertir les codes postaux clients en coordonnées géographiques,
**So that** je puisse calculer les distances artisan-client.

**Acceptance Criteria:**

**Given** un lead avec un code postal ou une adresse
**When** le lead est créé
**Then** le système appelle l'API BAN (adresse.data.gouv.fr) pour obtenir lat/lng
**And** les résultats sont stockés dans `leads.latitude` et `leads.longitude`
**And** un cache `geocode_cache` avec TTL 30 jours évite les appels redondants
**And** la distance artisan-client est calculable via `calculate_distance()`
**And** si l'API BAN est indisponible, le lead est créé sans coordonnées

**FRs:** FR50, FR51, FR52

---

### Story 10.2: Lead Scoring

**As a** système,
**I want** calculer un score de qualité pour chaque lead,
**So that** les artisans reçoivent les leads les plus qualifiés en priorité.

**Acceptance Criteria:**

**Given** un nouveau lead soumis
**When** le lead est créé
**Then** le système calcule un score 0-100 basé sur :
- +25 pts si urgence haute (fuite active, inondation)
- +15 pts si photo jointe
- +10 pts si adresse géocodée avec succès
- +5 pts si description > 100 caractères
- -30 pts si description < 20 caractères
- +30 pts base (plancher)
**And** le lead est classé en qualité : low (0-39), medium (40-69), high (70-89), premium (90-100)
**And** les facteurs de scoring sont enregistrés dans `scoring_factors` (JSONB)
**And** les événements sont tracés dans la table `lead_events`

**FRs:** FR53, FR54, FR55, FR56

---

### Story 10.3: Badge Artisan Réactif

**As a** artisan,
**I want** obtenir un badge "Réactif" si je réponds rapidement aux leads,
**So that** je sois priorisé dans l'attribution des leads.

**Acceptance Criteria:**

**Given** un artisan avec un historique d'au moins 20 offres sur 30 jours
**When** le système recalcule les scores (cron nightly)
**Then** le score réactivité est calculé : 100 × (responded/offers) × (fast/responded)
**And** le badge "Réactif" est attribué si :
- Taux de réponse ≥ 80%
- Taux de réponses rapides (< 2 min) ≥ 80%
**And** les colonnes `is_reactive` et `reactive_score` sont mises à jour sur `profiles`
**And** le badge est visible sur le dashboard artisan (pas exposé au client)
**And** le `response_ms` est tracé sur chaque `lead_assignment`

**FRs:** FR57, FR58, FR59, FR60, FR61

---

### Story 10.4: Attribution Multi-Artisans Simultanée

**As a** système,
**I want** notifier 3 artisans simultanément au lieu d'une cascade séquentielle,
**So that** le temps de réponse soit réduit et le lead soit attribué plus vite.

**Acceptance Criteria:**

**Given** un nouveau lead avec coordonnées géographiques
**When** le système cherche des artisans
**Then** il sélectionne les 3 artisans les plus proches avec coordonnées valides
**And** le tri est : distance ASC, puis reactive_score DESC, puis crédits DESC
**And** les 3 artisans reçoivent la notification simultanément (pas de cascade)
**And** le premier artisan qui accepte gagne le lead (lock transactionnel `FOR UPDATE`)
**And** les autres artisans reçoivent "Lead déjà attribué" s'ils cliquent après
**And** si aucun artisan n'accepte après 5 min, le système sélectionne 3 nouveaux artisans
**And** le workflow n8n est adapté pour l'envoi parallèle

**FRs:** FR62, FR63, FR64, FR65, FR66, FR67
