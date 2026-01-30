# Règle : Automatisation n8n - Règles du Jeu v2.0

## Principe

Claude Code agit comme **expert en automatisation n8n** avec accès complet au dashboard, aux projets et aux fonctionnalités administrateur. L'objectif est de créer, corriger et améliorer des workflows n8n **sans erreur et de haute qualité** en utilisant systématiquement les MCP et Skills disponibles.

---

## Ressources Disponibles

### MCP Servers

| MCP | Nom Config | Usage | Priorité |
|-----|------------|-------|----------|
| **n8n-mcp** | `n8n-mcp` | API native n8n (CRUD workflows, credentials, executions) | ★★★★★ |
| **n8n-docs** | `n8n-docs` | Documentation 1,084 nodes + 2,709 templates | ★★★★★ |
| **Chrome DevTools** | `chrome-devtools` | Interaction visuelle UI n8n | ★★★☆☆ |
| **Context7** | `context7` | Documentation bibliothèques tierces | ★★★☆☆ |

### Skills n8n (7 skills)

| Skill | Commande | Quand l'utiliser |
|-------|----------|------------------|
| **n8n-mcp-tools-expert** | `/n8n-mcp-tools-expert` | Guide expert pour utiliser les outils MCP n8n efficacement |
| **n8n-workflow-patterns** | `/n8n-workflow-patterns` | 5 patterns architecturaux éprouvés (webhook, schedule, branch, queue, AI) |
| **n8n-node-configuration** | `/n8n-node-configuration` | Configuration des nodes basée sur les opérations |
| **n8n-expression-syntax** | `/n8n-expression-syntax` | Syntaxe expressions `{{ $json.field }}`, `{{ $node["name"].json }}` |
| **n8n-validation-expert** | `/n8n-validation-expert` | Débugger erreurs de validation et structures |
| **n8n-code-javascript** | `/n8n-code-javascript` | Écrire du JS dans Code nodes (`$input`, `$json`, `DateTime`) |
| **n8n-code-python** | `/n8n-code-python` | Écrire du Python dans Code nodes (limitations connues) |

---

## Workflow de Création (Obligatoire)

### Étape 1 : Analyse du Besoin
```
AVANT de coder, toujours :
1. Identifier le trigger (webhook, schedule, event, manual)
2. Identifier les actions (API calls, transformations, notifications)
3. Identifier les credentials nécessaires
4. Définir les conditions et branches
```

### Étape 2 : Sélection du Pattern
```
UTILISER Skill(n8n-workflow-patterns) pour choisir :
- Pattern Webhook Processing
- Pattern Scheduled Batch
- Pattern Conditional Routing
- Pattern Async Queue
- Pattern AI Agent
```

### Étape 3 : Recherche Documentation
```
POUR chaque node inconnu :
1. MCP n8n-docs → search_nodes("<node_name>")
2. MCP n8n-docs → get_node_info("<node_type>", detail_level="full")
3. Skill(n8n-node-configuration) si config complexe
```

### Étape 4 : Génération du Workflow
```
1. Créer structure JSON avec nodes et connections
2. Skill(n8n-expression-syntax) pour les expressions
3. Skill(n8n-code-javascript) si Code node nécessaire
```

### Étape 5 : Validation
```
AVANT import :
1. Skill(n8n-validation-expert) pour vérifier structure
2. Vérifier credentials référencés existent
3. Vérifier expressions syntaxiquement correctes
```

### Étape 6 : Déploiement
```
1. MCP n8n-mcp → create_workflow(json)
2. Configurer credentials dans UI n8n
3. Test manuel
4. Activer
```

---

## Accès n8n

### Dashboard
- **URL** : `https://vmi3051008.contaboserver.net`
- **Accès** : Administrateur complet
- **Scope** : Workflows, credentials, executions, settings

### Credentials Configurés

| Service | Type | Nom dans n8n |
|---------|------|--------------|
| Telegram | Telegram API | `Telegram account` |
| Resend | Header Auth | `Header Auth account` |

---

## Standards de Qualité

### Nommage Obligatoire

| Élément | Convention | Exemple |
|---------|------------|---------|
| Workflow | `[Projet] Action - Trigger` | `[PlombierUrgent] Lead Created - Telegram` |
| Node | `Verbe + Objet` | `Send Telegram`, `Get Leads`, `Filter Active` |
| Credential | `Service account` | `Telegram account`, `Resend API` |

### Structure JSON Obligatoire

```json
{
  "name": "[Projet] Nom descriptif",
  "nodes": [
    {
      "id": "unique-id",
      "name": "Node Name",
      "type": "n8n-nodes-base.nodeType",
      "typeVersion": 1,
      "position": [x, y],
      "parameters": {}
    }
  ],
  "connections": {
    "Node Name": {
      "main": [[{"node": "Next Node", "type": "main", "index": 0}]]
    }
  },
  "active": false,
  "settings": {
    "executionOrder": "v1",
    "timezone": "Europe/Paris"
  }
}
```

### Checklist Validation (Avant Import)

- [ ] Tous les nodes ont un `id` unique
- [ ] Tous les nodes ont un `name` descriptif
- [ ] Tous les `typeVersion` sont corrects pour la version n8n
- [ ] Les `connections` référencent des nodes existants
- [ ] Les expressions utilisent la syntaxe `={{ }}` (pas `{{ }}` seul)
- [ ] Les credentials sont référencés par nom, pas par valeur
- [ ] Error handling présent pour workflows critiques

---

## Patterns de Workflows

### Pattern 1 : Webhook → Action → Response
```
[Webhook] → [Process Data] → [Action] → [Respond to Webhook]
```
**Usage** : APIs, notifications entrantes
**Skill** : `n8n-workflow-patterns` → Webhook Processing

### Pattern 2 : Schedule → Fetch → Loop → Action
```
[Schedule Trigger] → [HTTP Request] → [Split Out] → [Action per Item]
```
**Usage** : Batch processing, syncs quotidiens
**Skill** : `n8n-workflow-patterns` → Scheduled Batch

### Pattern 3 : Trigger → Branch → Multi-Actions
```
[Trigger] → [IF Condition] → [Action A]
                          → [Action B]
```
**Usage** : Routing conditionnel
**Skill** : `n8n-workflow-patterns` → Conditional Routing

### Pattern 4 : Webhook → Queue → Async Process
```
[Webhook] → [Respond OK] → [Wait] → [Process] → [Notify]
```
**Usage** : Long running tasks
**Skill** : `n8n-workflow-patterns` → Async Queue

### Pattern 5 : AI Agent Workflow
```
[Trigger] → [AI Agent] → [Tool Calls] → [Response]
```
**Usage** : Chatbots, assistants intelligents
**Skill** : `n8n-workflow-patterns` → AI Agent

---

## Expressions n8n - Référence Rapide

### Accès aux données
```javascript
// Item courant
{{ $json.fieldName }}
{{ $json["field-with-dash"] }}
{{ $json.nested.field }}

// Node précédent spécifique
{{ $node["Node Name"].json.field }}

// Tous les items
{{ $items() }}

// Input brut
{{ $input.first().json.field }}
```

### Fonctions utiles
```javascript
// Date/Time (Luxon)
{{ DateTime.now().toISO() }}
{{ DateTime.fromISO($json.date).toFormat("dd/MM/yyyy") }}

// Conditions
{{ $json.status === "active" ? "Oui" : "Non" }}

// String
{{ $json.name.toUpperCase() }}
{{ $json.email.includes("@") }}
```

**Skill** : `n8n-expression-syntax` pour syntaxe avancée

---

## Code Nodes - Bonnes Pratiques

### JavaScript
```javascript
// Accès aux données
const items = $input.all();
const firstItem = $input.first();
const jsonData = $json;

// Retourner des données
return items.map(item => ({
  json: {
    ...item.json,
    processed: true,
    timestamp: DateTime.now().toISO()
  }
}));

// HTTP avec helpers
const response = await $helpers.request({
  url: 'https://api.example.com/data',
  method: 'GET'
});
```

**Skill** : `n8n-code-javascript` pour patterns avancés

### Python
```python
# Accès aux données
items = _input.all()
first_item = _input.first()

# Retourner des données
return [{"json": {"processed": True}}]
```

**Skill** : `n8n-code-python` pour limitations connues

---

## Intégration MCP + Skills - Stratégie

### Pour Créer un Nouveau Workflow

```
1. Skill(n8n-workflow-patterns) → Choisir pattern
2. MCP(n8n-docs) → search_nodes() pour chaque action
3. MCP(n8n-docs) → get_node_info() pour config détaillée
4. Skill(n8n-expression-syntax) → Expressions correctes
5. Skill(n8n-validation-expert) → Valider avant import
6. MCP(n8n-mcp) → create_workflow() OU export JSON
```

### Pour Débugger un Workflow

```
1. MCP(chrome-devtools) → Voir logs d'exécution
2. Skill(n8n-validation-expert) → Analyser erreur
3. Skill(n8n-expression-syntax) → Corriger expressions
4. MCP(n8n-docs) → Vérifier config node
```

### Pour Améliorer un Workflow

```
1. MCP(n8n-docs) → search_templates() pour inspirations
2. Skill(n8n-workflow-patterns) → Optimiser architecture
3. Skill(n8n-code-javascript) → Refactorer Code nodes
```

---

## Projets Associés

### Plombier Urgent
- **Workflows** : Lead Created, Lead Accepted, Followup J+3
- **Credentials** : Telegram, Resend (Header Auth)
- **App URL** : Variable (localhost ou tunnel)
- **Stockage** : `plombier-urgent/n8n-workflows/`

### Template Projet
Pour tout nouveau projet :
1. Créer dossier `<projet>/n8n-workflows/`
2. Documenter credentials nécessaires
3. Exporter JSON de chaque workflow
4. Git commit avec message descriptif

---

## Métriques et Monitoring

### KPIs à Surveiller
- Taux de succès executions > 95%
- Temps moyen d'exécution < 30s
- Nombre d'erreurs par workflow < 5%

### Alertes Recommandées
- Échec workflow critique → Telegram admin
- Rate limit API → Pause automatique
- Credential expiré → Notification

---

## Commandes Rapides

| Action | Commande |
|--------|----------|
| Chercher un node | `MCP n8n-docs: search_nodes("telegram")` |
| Info node détaillée | `MCP n8n-docs: get_node_info("n8n-nodes-base.telegram", "full")` |
| Templates similaires | `MCP n8n-docs: search_templates("webhook notification")` |
| Valider workflow | `Skill(n8n-validation-expert)` |
| Pattern architecture | `Skill(n8n-workflow-patterns)` |

---

## Règles Strictes

### TOUJOURS
- ✅ Utiliser MCP n8n-docs pour vérifier config des nodes
- ✅ Utiliser Skills pour syntaxe expressions et code
- ✅ Valider avec n8n-validation-expert avant import
- ✅ Nommer workflows et nodes de manière descriptive
- ✅ Inclure error handling pour workflows critiques
- ✅ Stocker JSON dans `<projet>/n8n-workflows/`

### JAMAIS
- ❌ Credentials en dur dans le JSON
- ❌ Deviner la config d'un node sans vérifier
- ❌ Ignorer les erreurs de validation
- ❌ Créer un workflow sans choisir un pattern d'abord
- ❌ Utiliser des expressions sans vérifier la syntaxe

---

**Version** : 2.0.0
**Dernière mise à jour** : 2026-01-30
**Ressources** : 2 MCP + 7 Skills + Chrome DevTools
**Projet de référence** : Plombier Urgent
