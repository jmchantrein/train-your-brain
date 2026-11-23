# Architecture Serveur - Monorepo

> **État** : plan, non réalisé.

> **Statut** : PROPOSITION - À valider avant implémentation
> **Inspiré de** : [cascii-core](https://github.com/casparwylie/cascii-core) / [cascii-server](https://github.com/casparwylie/cascii-server)

---

## Pourquoi un Monorepo ?

### Avantages pour le développement LLM

| Aspect | Monorepo | Multi-repo |
|--------|----------|------------|
| **Contexte LLM** | Voit tout le projet | Doit switcher entre repos |
| **Types partagés** | Une seule source de vérité | Risque de drift |
| **Refactoring** | Impact visible partout | Sync manuelle |
| **Documentation** | CLAUDE.md unifié | Instructions fragmentées |
| **Tests E2E** | Client + serveur ensemble | Complexe à orchestrer |

### Décision

**Monorepo** avec séparation claire des responsabilités.

---

## Structure Proposée

```
train-your-brain/
│
├── CLAUDE.md                 # Instructions LLM (unifié)
├── README.md                 # Documentation utilisateur
├── package.json              # Workspaces npm
│
├── core/                     # Application offline (actuel src/)
│   ├── modules/              # Logique métier
│   ├── ui/                   # Interface utilisateur
│   ├── styles/               # CSS
│   └── index.html            # Entry point (généré)
│
├── server/                   # DeckHub API (nouveau)
│   ├── src/
│   │   ├── api/              # Routes REST
│   │   │   ├── decks.js      # GET /decks, GET /decks/:id
│   │   │   ├── submit.js     # POST /decks (soumission)
│   │   │   └── health.js     # GET /health
│   │   ├── services/
│   │   │   ├── storage.js    # Accès base de données
│   │   │   ├── moderation.js # File de modération
│   │   │   └── validation.js # Validation des decks
│   │   ├── middleware/
│   │   │   ├── cors.js
│   │   │   ├── rateLimit.js
│   │   │   └── auth.js       # Optionnel (pour submit)
│   │   └── index.js          # Entry point serveur
│   ├── tests/
│   ├── package.json
│   └── Dockerfile
│
├── shared/                   # Code partagé (extraction)
│   ├── types.js              # Types communs (Card, Deck, Player)
│   ├── deck-validator.js     # Validation des decks
│   ├── yaml.js               # Parser/sérialiseur YAML
│   └── package.json
│
├── docs/                     # Documentation
│   ├── deckhub/              # Specs DeckHub (existant)
│   └── ...
│
├── roadmap/                  # Plans futurs (ce dossier)
│
├── decks/                    # Decks inclus (existant)
├── tests/                    # Tests core (existant)
└── scripts/                  # Build scripts (existant)
```

---

## API DeckHub

### Endpoints MVP

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| `GET` | `/api/decks` | Liste des decks publics | Non |
| `GET` | `/api/decks/:id` | Détail d'un deck | Non |
| `GET` | `/api/decks/:id/download` | Télécharger YAML | Non |
| `POST` | `/api/decks/submit` | Soumettre un deck | Email |
| `GET` | `/api/categories` | Liste des catégories | Non |
| `GET` | `/api/health` | Statut du serveur | Non |

### Exemple de Réponse

```json
// GET /api/decks
{
  "decks": [
    {
      "id": "maths-additions-100",
      "name": "Additions jusqu'à 100",
      "author": "community",
      "category": "maths/arithmetique",
      "cardCount": 50,
      "downloads": 1234,
      "rating": 4.5,
      "createdAt": "2025-01-15",
      "tags": ["maths", "primaire", "additions"]
    }
  ],
  "total": 150,
  "page": 1,
  "perPage": 20
}
```

---

## Flux de Données

```
┌─────────────────────────────────────────────────────────────────┐
│                         FLUX DECKHUB                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   PULL (lecture)                    PUSH (écriture)             │
│   ─────────────                     ─────────────               │
│                                                                 │
│   ┌─────────┐                       ┌─────────┐                │
│   │  App    │                       │  App    │                │
│   │ (core)  │                       │ (core)  │                │
│   └────┬────┘                       └────┬────┘                │
│        │                                 │                      │
│        │ GET /api/decks                  │ POST /api/submit    │
│        ▼                                 ▼                      │
│   ┌─────────────┐                   ┌─────────────┐            │
│   │   Server    │                   │   Server    │            │
│   │  (server/)  │                   │  (server/)  │            │
│   └──────┬──────┘                   └──────┬──────┘            │
│          │                                 │                    │
│          ▼                                 ▼                    │
│   ┌─────────────┐                   ┌─────────────┐            │
│   │  Database   │                   │ Moderation  │            │
│   │  (decks)    │                   │   Queue     │            │
│   └─────────────┘                   └──────┬──────┘            │
│                                            │                    │
│                                            ▼                    │
│                                     ┌─────────────┐            │
│                                     │  Review     │            │
│                                     │  (humain)   │            │
│                                     └─────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Intégration dans Core

### Nouveau Module : `deckhub.js`

```javascript
const DeckHub = {
  BASE_URL: 'https://api.trainyourbrain.app', // ou configurable

  // Mode offline-first
  isOnline() {
    return navigator.onLine && this.BASE_URL;
  },

  // Récupérer la liste des decks
  async fetchDecks(options = {}) {
    if (!this.isOnline()) return { decks: [], offline: true };

    const params = new URLSearchParams(options);
    const response = await fetch(`${this.BASE_URL}/api/decks?${params}`);
    return response.json();
  },

  // Télécharger un deck
  async downloadDeck(deckId) {
    const response = await fetch(`${this.BASE_URL}/api/decks/${deckId}/download`);
    const yaml = await response.text();
    return YAML.parse(yaml);
  },

  // Soumettre un deck
  async submitDeck(deck, email) {
    const response = await fetch(`${this.BASE_URL}/api/decks/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deck, email })
    });
    return response.json();
  }
};
```

### UI : Nouvelle Page "DeckHub"

```
┌─────────────────────────────────────────────────────────────┐
│  🌐 DeckHub - Decks Communautaires                    [X]   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Rechercher...]                    [Catégorie ▼]           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📚 Additions jusqu'à 100                            │   │
│  │ ★★★★☆ (4.5) • 50 cartes • 1.2k téléchargements     │   │
│  │ [Télécharger]                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🌍 Vocabulaire Anglais B2                           │   │
│  │ ★★★★★ (4.9) • 200 cartes • 3.4k téléchargements    │   │
│  │ [Télécharger]                                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [< Précédent]                              [Suivant >]     │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [📤 Soumettre un deck]                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Migration

### Étapes

1. **Restructurer** : Déplacer `src/` vers `core/`
2. **Extraire** : Créer `shared/` avec les modules communs
3. **Initialiser** : Créer `server/` avec structure de base
4. **Configurer** : npm workspaces pour gérer les dépendances
5. **Adapter** : Mettre à jour les scripts de build

### package.json (racine)

```json
{
  "name": "train-your-brain",
  "private": true,
  "workspaces": [
    "core",
    "server",
    "shared"
  ],
  "scripts": {
    "dev": "npm run dev --workspace=core",
    "dev:server": "npm run dev --workspace=server",
    "build": "npm run build --workspace=core",
    "test": "npm run test --workspaces",
    "test:core": "npm run test --workspace=core",
    "test:server": "npm run test --workspace=server"
  }
}
```

---

## Voir Aussi

- [QUESTIONS.md](QUESTIONS.md) - Décisions techniques à prendre
- [../docs/deckhub/README.md](../docs/deckhub/README.md) - Spécification DeckHub
