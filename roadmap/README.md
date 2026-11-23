# Roadmap - Train Your Brain

> **État** : plan, non réalisé.

> **Statut** : Document vivant - Idées et plans pour les évolutions futures
> **Dernière mise à jour** : 2025-12-12

---

## Vision

**Train Your Brain** évolue d'une application 100% offline vers une plateforme hybride :
- **Mode Offline** : Toujours fonctionnel, toujours gratuit, toujours sans compte
- **Mode Connecté** : Optionnel, pour le partage communautaire (DeckHub)

```
┌─────────────────────────────────────────────────────────────┐
│                    TRAIN YOUR BRAIN                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────────┐    ┌─────────────────────┐       │
│   │   MODE OFFLINE      │    │   MODE CONNECTÉ     │       │
│   │   (toujours dispo)  │    │   (optionnel)       │       │
│   ├─────────────────────┤    ├─────────────────────┤       │
│   │ • Un fichier HTML   │    │ • DeckHub (partage) │       │
│   │ • localStorage      │    │ • Sync multi-device │       │
│   │ • Decks locaux      │    │ • Backup cloud      │       │
│   │ • 100% gratuit      │    │ • Stats globales    │       │
│   └─────────────────────┘    └─────────────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Renommage du Projet

### Décision

| Aspect | Actuel | Futur |
|--------|--------|-------|
| **Nom** | ancien nom (avec « Offline ») | `train-your-brain` (fait) |
| **Repo** | ancien dépôt | `jmchantrein/train-your-brain` (fait) |
| **URL** | - | `trainyourbrain.app` (à réserver) |

### Justification

- "Offline" dans le nom suggère une limitation, pas une feature
- L'app reste 100% utilisable offline (c'est le mode par défaut)
- Le serveur DeckHub est une extension optionnelle

### Migration

1. Renommer le repo GitHub
2. Mettre à jour les références dans le code
3. Rediriger l'ancien nom vers le nouveau

---

## Priorités

### P0 - Court terme (stabilisation)
- [x] Refactoring DRY/KISS documentation
- [x] Système Leitner : retour pioche après repos
- [ ] Tests E2E navigateur
- [ ] Audit accessibilité (a11y)

### P1 - Moyen terme (DeckHub MVP)
- [ ] Architecture monorepo avec `server/`
- [ ] API REST basique (list, get, submit)
- [ ] Modération manuelle des soumissions
- [ ] Intégration dans l'app (bouton "Parcourir DeckHub")

### P2 - Long terme (communauté)
- [ ] Comptes utilisateurs (optionnel)
- [ ] Notes et commentaires sur les decks
- [ ] Statistiques d'utilisation anonymisées
- [ ] Sync multi-devices (avec compte)

### P3 - Idées à explorer
- [ ] Internationalisation (i18n) - repo + application
- [ ] Decks générés procéduralement (calcul mental, équations...)

---

## Idées à Explorer

### Internationalisation (i18n)

**Deux axes complémentaires :**

#### 1. Documentation du dépôt

| Langue | Statut | Priorité |
|--------|--------|----------|
| Français | ✅ Complète | Langue principale |
| Anglais | 🔲 À faire | P1 - Élargir l'audience |

- Conserver le français comme langue principale
- Ajouter des traductions anglaises progressivement
- Commencer par : README.md, CLAUDE.md, docs principales
- Format envisagé : `README.md` (FR) + `README.en.md` (EN) ou structure `docs/en/`

#### 2. Interface de l'application

L'infrastructure `i18n.js` existe déjà. À compléter :

- [ ] Audit des chaînes non traduites
- [ ] Fichiers de traduction complets (FR, EN)
- [ ] Sélecteur de langue dans les paramètres
- [ ] Détection automatique de la langue du navigateur

---

### Decks Générés Procéduralement

**Concept** : Un mode pour les contenus qui peuvent être calculés à la volée par l'application, évitant de stocker des milliers de cartes.

#### Cas d'usage - Mathématiques

| Type | Exemple | Paramètres |
|------|---------|------------|
| Calcul mental | `7 × 8 = ?` | Tables 1-12, difficulté |
| Équations | `2x + 5 = 13, x = ?` | Degré, coefficients max |
| Puissances | `2^5 = ?` | Base max, exposant max |
| Aires/volumes | `Aire d'un cercle r=3 ?` | Formes, précision |
| Conversions | `150 cm = ? m` | Unités, systèmes |

#### Cas d'usage - Autres disciplines

| Discipline | Exemples |
|------------|----------|
| **Langues** | Conjugaisons générées, pronoms, déclinaisons |
| **Chimie** | Masse molaire, équilibrage équations |
| **Physique** | Conversions d'unités, formules |
| **Musique** | Intervalles, accords, transpositions |
| **Géographie** | Capitales (via liste), drapeaux |

#### Architecture envisagée

```
┌─────────────────────────────────────────────────────────────┐
│                    DECK GENERATOR                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────────┐       ┌─────────────────────────┐    │
│   │   Générateur    │       │   Deck "virtuel"        │    │
│   │   (ex: calcul)  │──────▶│   (cartes à la volée)   │    │
│   └─────────────────┘       └───────────┬─────────────┘    │
│                                         │                   │
│   Paramètres :                          │ Même interface    │
│   - type: multiplication                │ que decks normaux │
│   - range: 1-12                         │                   │
│   - difficulty: easy                    ▼                   │
│                              ┌─────────────────────────┐    │
│                              │   Système Leitner       │    │
│                              │   (progression sauvée)  │    │
│                              └─────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Questions ouvertes

- **Intégration** : Decks générés = même liste que decks YAML ? Onglet séparé ?
- **Progression** : Comment sauvegarder la progression sur des milliers de combinaisons ?
- **Paramétrage** : Interface de configuration pour chaque générateur ?
- **Seed** : Permettre de partager une "configuration" de deck généré ?

#### Lien avec le mode multilingue

Similaire au mode multilingue où les cartes sont "virtuelles" (question en langue A, réponse en langue B), les decks générés créent des cartes dynamiquement selon des règles.

> **À définir** : Ces deux modes pourraient partager une architecture commune de "deck virtuel".

---

## Documents Détaillés

| Document | Description |
|----------|-------------|
| [ARCHITECTURE_SERVER.md](ARCHITECTURE_SERVER.md) | Architecture monorepo avec serveur |
| [QUESTIONS.md](QUESTIONS.md) | Décisions techniques à prendre |
| [../docs/deckhub/README.md](../docs/deckhub/README.md) | Spécification DeckHub existante |
| [../docs/deckhub/TAXONOMY.md](../docs/deckhub/TAXONOMY.md) | Taxonomie des decks |

---

## Licence des Decks Partagés

**Tous les decks partagés sur DeckHub sont sous licence CC0 (Domaine Public).**

### Philosophie

> *"La connaissance appartient à tout le monde et doit le rester."*

Nous avons choisi **CC0** plutôt qu'une licence avec attribution car :

1. **Liberté totale** : Utiliser, modifier, redistribuer sans aucune contrainte
2. **Pas d'attribution requise** : La connaissance n'a pas besoin de signature
3. **Simplicité** : Aucune obligation légale à respecter

### Ce que cela implique

| Action | Autorisé ? |
|--------|------------|
| Utiliser pour apprendre | ✅ |
| Modifier les cartes | ✅ |
| Redistribuer | ✅ |
| Usage commercial | ✅ |
| Ne pas citer l'auteur | ✅ |

### Distinction Code vs Contenu

| Composant | Licence | Pourquoi |
|-----------|---------|----------|
| **Code source** | AGPL-3.0 | Protection du logiciel libre |
| **Decks (contenu)** | CC0 | La connaissance est libre |

### Ce que cela implique pour les contributeurs

En soumettant un deck sur DeckHub, vous acceptez :
- De placer votre contenu dans le **domaine public** (CC0)
- Que d'autres puissent l'utiliser **sans restriction**
- De **renoncer à l'attribution** (même si elle reste appréciée)

> **Note** : Si vous n'êtes pas l'auteur original du contenu, assurez-vous d'avoir le droit de le placer dans le domaine public.

---

## Contribuer aux Idées

Les idées sont bienvenues ! Vous pouvez :
1. Ouvrir une Issue sur GitHub avec le label `roadmap`
2. Proposer une PR modifiant ce fichier
3. Discuter dans les Discussions GitHub
