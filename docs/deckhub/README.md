# DeckHub - Spécification

> **Statut** : ⚠️ NON IMPLÉMENTÉ - Documentation de référence pour implémentation future
> **Dernière mise à jour** : 2025-12-12

---

## Vue d'ensemble

DeckHub est un système de partage de decks communautaire, inspiré de Docker Hub. Il permet aux utilisateurs de :
- **Pull** : Télécharger des decks publics sans compte
- **Push** : Soumettre des decks avec vérification email
- **Découvrir** : Explorer les decks par catégorie/tags

## Contraintes fondamentales

| Contrainte | Impact |
|------------|--------|
| **Offline-first** | L'app DOIT fonctionner 100% hors ligne |
| **Budget 0€** | Utilisation de services gratuits (GitHub, Cloudflare) |
| **Modération** | File d'attente avec validation humaine/LLM |
| **Licence CC0** | Tous les decks partagés sont dans le domaine public |

> **Pourquoi CC0 pour les decks ?** La connaissance appartient à tout le monde. Pas d'attribution requise, liberté totale d'utilisation. Voir [roadmap/README.md](../../roadmap/README.md#licence-des-decks-partagés) pour plus de détails.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DECKHUB ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌──────────────┐         ┌───────────────────┐                   │
│   │   App TYB    │         │  Cloudflare Worker│                   │
│   │  (offline)   │────────▶│   (API Gateway)   │                   │
│   └──────────────┘         └─────────┬─────────┘                   │
│          │                           │                              │
│          │ PULL                      │ PUSH                         │
│          │ (direct)                  │                              │
│          ▼                           ▼                              │
│   ┌──────────────┐         ┌───────────────────┐                   │
│   │   GitHub     │         │   Moderation      │                   │
│   │  Raw Files   │◀────────│   Queue (PR)      │                   │
│   │  (public)    │         │                   │                   │
│   └──────────────┘         └───────────────────┘                   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Flux PULL (lecture anonyme)

```
App → fetch(raw.githubusercontent.com/deckhub/decks/math/fractions.yaml) → Deck local
```

- Accès direct aux fichiers GitHub (pas de serveur intermédiaire)
- Cache local pour usage offline
- Fonctionne même si le Worker est down

### Flux PUSH (écriture avec email)

```
1. App → Worker : { deck, email, locale }
2. Worker → Email : lien de vérification (SendGrid free tier)
3. User clique le lien → Token validé
4. Worker → GitHub API : crée une PR avec le deck
5. PR entre dans la file de modération
6. Modérateur approuve → merge → deck public
```

### Versioning des decks

- Seul l'auteur original (même email) peut proposer une update
- **Exception** : Les PRs de mise à jour peuvent être validées par n'importe qui (contenu CC0)
- Git conserve l'historique complet
- L'utilisateur choisit de mettre à jour ou non

---

## Structure du repository GitHub

```
deckhub-community/
├── index.json                    # Catalogue complet des decks
├── taxonomy.yaml                 # Taxonomie avec i18n
├── LICENSE                       # CC0 (domaine public)
│
├── decks/
│   ├── mathematics/
│   │   ├── arithmetic/
│   │   │   ├── additions-1-10.yaml
│   │   │   └── fractions-basics.yaml
│   │   └── algebra/
│   │       └── equations-first-degree.yaml
│   ├── languages/
│   │   ├── english/
│   │   │   └── basic-vocabulary.yaml
│   │   └── french/
│   │       └── conjugation-present.yaml
│   └── sciences/
│       └── physics/
│           └── newton-laws.yaml
│
└── .github/
    ├── PULL_REQUEST_TEMPLATE.md
    └── workflows/
        ├── validate-deck.yml     # CI validation format
        └── auto-label.yml        # Auto-labeling PRs
```

---

## Format d'un deck DeckHub

```yaml
# Métadonnées obligatoires
id: fractions-basics
name: Les fractions - Bases
description: Apprendre les fractions de base
author_email: jean@example.com    # Pour contact et updates (optionnel)
version: 1.0.0
license: CC0                      # Domaine public

# Taxonomie (tags système en anglais)
tags:
  - mathematics/arithmetic
  - difficulty:beginner
  - level:primary

# Internationalisation du contenu
languages:
  - fr    # Langue principale du deck
  - en    # Traductions disponibles (optionnel)

# Configuration
settings:
  bidirectional: false
  sequential: false

# Cartes avec i18n optionnel
cards:
  - id: frac-001
    question: "Quel est le résultat de 1/2 + 1/2 ?"
    answer: "1"
    # Traductions optionnelles
    translations:
      en:
        question: "What is 1/2 + 1/2?"
        answer: "1"

  - id: frac-002
    question: "Simplifier 2/4"
    answer: "1/2"
```

---

## Sécurité "App-only"

```javascript
// Dans le Cloudflare Worker
const validateRequest = (request) => {
  // 1. Vérifier l'origine
  const origin = request.headers.get('Origin');
  const allowed = ['file://', 'http://localhost', 'https://tyb.app'];

  // 2. Vérifier la signature de l'app
  const signature = request.headers.get('X-TYB-Signature');
  const expectedHash = 'sha256-...'; // Hash du build

  // 3. Rate limiting par IP (Cloudflare built-in)

  // 4. Captcha invisible (hCaptcha) pour submissions

  return isValid;
};
```

**Note** : Cette protection n'est pas parfaite (reverse-engineering possible) mais bloque 99% des abus automatisés.

---

## Modération

### Phase 1 : Modérateur unique
- Review manuelle des PRs GitHub
- Critères : format valide, contenu approprié, pas de spam

### Phase 2 (future) : Communauté
- Trusted reviewers avec permissions limitées
- Système de votes/flags

### Phase 3 (future) : LLM
- Pré-screening automatique
- Détection de contenu inapproprié
- Validation du format

---

## Coûts estimés

| Service | Free tier | Usage prévu |
|---------|-----------|-------------|
| GitHub (storage) | Illimité (public) | ✅ |
| Cloudflare Workers | 100k req/jour | ✅ |
| SendGrid | 100 emails/jour | ✅ |
| **Total** | **0€** | |

---

## API Endpoints (Worker)

```
POST /api/submit
  Body: { deck: DeckYAML, email: string, locale: string }
  Response: { status: 'verification_sent' | 'error', message: string }

GET /api/verify/:token
  Response: { status: 'submitted' | 'error', pr_url?: string }

GET /api/index
  Response: { decks: DeckMetadata[], updated_at: string }

GET /api/taxonomy
  Response: { taxonomy: TaxonomyNode[], version: string }
```

---

## Intégration dans l'app

```javascript
// src/modules/deckhub.js (futur)
const DeckHub = {
  BASE_URL: 'https://raw.githubusercontent.com/tyb-deckhub/community/main',
  API_URL: 'https://deckhub.tyb.workers.dev',

  // Cache local
  _cache: {
    index: null,
    decks: {}
  },

  async pull(deckId) {
    // 1. Vérifier le cache
    const cached = Storage.getCachedDeck(deckId);
    if (cached && !navigator.onLine) return cached;

    // 2. Télécharger si online
    try {
      const url = `${this.BASE_URL}/decks/${deckId}.yaml`;
      const response = await fetch(url);
      const yaml = await response.text();
      const deck = YAML.parse(yaml);

      // 3. Cacher pour usage offline
      Storage.cacheDeck(deckId, deck);
      return deck;
    } catch (e) {
      return cached || null;
    }
  },

  async push(deck, email) {
    if (!navigator.onLine) {
      // Queue pour sync ultérieure
      Storage.queueForSync({ deck, email, timestamp: Date.now() });
      return { status: 'queued_offline' };
    }

    const response = await fetch(`${this.API_URL}/api/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-TYB-Signature': APP_SIGNATURE
      },
      body: JSON.stringify({ deck: YAML.stringify(deck), email })
    });

    return response.json();
  },

  async browse(filters = {}) {
    // Retourne la liste des decks avec filtres
  }
};
```

---

## Fichiers liés

- [TAXONOMY.md](./TAXONOMY.md) - Taxonomie avec internationalisation
- [API.md](./API.md) - Spécification API détaillée (à créer)
- [MODERATION.md](./MODERATION.md) - Guide de modération (à créer)

---

**Note** : Cette documentation sert de référence pour une implémentation future. L'application fonctionne actuellement de manière 100% offline sans DeckHub.
