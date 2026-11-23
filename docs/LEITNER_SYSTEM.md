# Algorithme Leitner - Documentation Complète

> **Module** : `src/modules/leitner.js`
> **Version** : 1.0.0

---

## Vue d'Ensemble

Le système Leitner est un algorithme de **répétition espacée** qui optimise l'apprentissage en adaptant la fréquence de révision selon la maîtrise de chaque carte.

### Principe

Les cartes progressent à travers 4 boîtes selon les performances du joueur :
- Les cartes bien maîtrisées sont revues moins souvent
- Les cartes difficiles sont revues plus fréquemment
- Le repos adaptatif permet une mémorisation à long terme

---

## Les 4 Boîtes

| Boîte | Nom | Couleur | Description | Jouable |
|-------|-----|---------|-------------|---------|
| `never_played` | Pioche | Gris | Carte jamais jouée | Toujours |
| `purple` | Violet | 💜 | Mal maîtrisée | Toujours |
| `orange` | Orange | 🟠 | En cours d'apprentissage | Toujours |
| `green` | Vert | 🟢 | Maîtrisée | Après repos |

### Ordre de Priorité (Pioche)

```
never_played (0) → purple (1) → orange (2) → green (3)
```

Les cartes sont jouées par ordre de priorité. Les `never_played` sont toujours jouées en premier.

---

## Règles de Transition

### Fonction `getNextBox()`

```javascript
getNextBox(currentBox, isCorrect, responseTimeMs, thresholdMs)
```

| Condition | Résultat |
|-----------|----------|
| Réponse **incorrecte** | → `purple` |
| Correct + `never_played` | → `green` |
| Correct + rapide (≤ seuil) | → `green` |
| Correct + lent (> seuil) | → `orange` |

### Diagramme de Transition

```
    ┌──────────────────────────────────────────────────────────────┐
    │                                                              │
    │  ┌─────────────────┐                                         │
    │  │   never_played  │◄────────────────────────────────────┐   │
    │  └────────┬────────┘                                     │   │
    │           │ correct                                      │   │
    │           ▼                                              │   │
    │  ┌──────────────────┐      après repos                   │   │
    │  │      green       │─────────────────────────────────────   │
    │  │  (repos 3-48j+)  │                                        │
    │  └────────┬─────────┘                                        │
    │           │                                                  │
    │    ┌──────┴──────┐                                           │
    │    │             │                                           │
    │ correct      correct                                         │
    │ +rapide      +lent                                           │
    │    │             │                                           │
    │    ▼             ▼                                           │
    │ ┌──────┐    ┌──────────┐                                     │
    │ │green │◄───│  orange  │                                     │
    │ └──┬───┘    └────┬─────┘                                     │
    │    │             │                                           │
    │    │  incorrect  │ incorrect                                 │
    │    │      │      │                                           │
    │    │      ▼      │                                           │
    │    │  ┌──────┐   │                                           │
    │    └─►│purple│◄──┘                                           │
    │       └──┬───┘                                               │
    │          │ correct                                           │
    │          ▼                                                   │
    │    (selon temps)                                             │
    └──────────────────────────────────────────────────────────────┘
```

**Cycle complet** : `never_played` → `green` (repos) → `never_played` → ...

---

## Seuil de Latence Dynamique

Chaque carte possède son propre `latencyThreshold` (en secondes) qui s'adapte aux performances du joueur.

### Fonction `updateLatencyThreshold()`

```javascript
updateLatencyThreshold(card, isCorrect, responseTimeMs)
```

| Situation | Nouveau Seuil |
|-----------|---------------|
| Premier jeu (`never_played`) | `ceil(responseTime / 1000)` |
| Réponse incorrecte | Seuil conservé |
| Correct + lent (> seuil) | `seuil + 1` seconde |
| Correct + rapide (≤ seuil) | `ceil(responseTime / 1000)` |

### Exemple de Progression

```
Carte: "1 + 1 = ?"

Jeu 1 (never_played): répond en 2.3s → seuil = 3s
Jeu 2 (green): répond en 4.5s (> 3s) → seuil = 4s, → orange
Jeu 3 (orange): répond en 2.1s (< 4s) → seuil = 3s, → green
Jeu 4 (green): répond en 1.2s (< 3s) → seuil = 2s, → green (repos prolongé)
```

---

## Repos Adaptatif (Cartes Vertes)

Les cartes en boîte verte ont une période de repos. **Après le repos, elles retournent dans la pioche (`never_played`)** pour être rejouées comme si c'était la première fois.

> **Important** : Le seuil de latence (`latencyThreshold`) et les statistiques sont préservés lors du retour dans la pioche.

### Fonction `calculateRestDays()`

```javascript
calculateRestDays(responseTimeMs, thresholdMs, previousRestDays)
```

### Formule

```
coefficient = min(max(seuil / temps, 1.2), 2.0)

Si premier passage en vert (previousRestDays = 0):
    repos = 3 × coefficient

Sinon:
    repos = previousRestDays × coefficient
```

### Coefficient de Repos

| Rapidité | Coefficient | Description |
|----------|-------------|-------------|
| Très rapide (2× plus vite) | 2.0 | Maximum, repos doublé |
| Rapide (1.5× plus vite) | 1.5 | Repos × 1.5 |
| Au seuil | 1.2 | Minimum, repos × 1.2 |
| Plus lent que seuil | 1.2 | Minimum appliqué |

### Exemples de Progression

**Joueur très rapide (coefficient 2.0) :**
```
3 → 6 → 12 → 24 → 48 → 96 jours
```

**Joueur modéré (coefficient 1.5) :**
```
3 → 5 → 8 → 12 → 18 → 27 jours
```

**Joueur au seuil (coefficient 1.2) :**
```
3 → 4 → 5 → 6 → 7 → 8 jours
```

---

## Sélection des Cartes pour Session

### Fonction `getCardsForSession()`

```javascript
getCardsForSession(deck, {
    today,           // Date ISO (OBLIGATOIRE)
    maxCards: 20,    // Nombre max de cartes
    boxes: null,     // Filtrer par boîtes ['purple', 'orange']
    ignoreRest: false, // Ignorer le repos des vertes
    sequential: false  // Pas de mélange
})
```

### Algorithme

1. **Filtrer** les cartes jouables (repos terminé ou `ignoreRest`)
2. **Trier** par priorité de boîte
3. **Mélanger** chaque groupe (sauf si `sequential`)
4. **Limiter** au nombre max de cartes

### Exemple

```javascript
// Deck avec 50 cartes
const cards = Leitner.getCardsForSession(deck, {
    today: '2025-01-20',
    maxCards: 20
});

// Résultat possible:
// - 5 cartes never_played
// - 3 cartes purple
// - 7 cartes orange
// - 5 cartes green (repos terminé)
```

---

## Vérification de Jouabilité

### Fonction `isCardPlayable()`

```javascript
isCardPlayable(card, today)
```

| Boîte | Condition |
|-------|-----------|
| `never_played` | Toujours `true` |
| `purple` | Toujours `true` |
| `orange` | Toujours `true` |
| `green` | `true` si `today >= card.restUntil` |

---

## Structure de Données Carte

```javascript
{
    id: "add_1_1",
    question: "1 + 1",
    answer: "2",
    type: "numeric",

    // Progression Leitner
    box: "never_played",       // Boîte actuelle
    latencyThreshold: null,    // Seuil en secondes
    bestResponseTimeMs: null,  // Meilleur temps
    lastResponseTimeMs: null,  // Dernier temps
    restUntil: null,           // Date de fin de repos (ISO)
    restDays: 0,               // Jours de repos actuels
    timesPlayed: 0,            // Nombre de fois jouée
    timesCorrect: 0            // Nombre de réponses correctes
}
```

---

## Constantes du Module

```javascript
Leitner.BOXES = ['never_played', 'purple', 'orange', 'green'];
Leitner.BOX_PRIORITY = { never_played: 0, purple: 1, orange: 2, green: 3 };
Leitner.DEFAULT_REST_DAYS = 3;
Leitner.MIN_COEFFICIENT = 1.2;
Leitner.MAX_COEFFICIENT = 2.0;
```

---

## Cas d'Usage Typique

```javascript
// 1. Sélectionner les cartes pour une session
const cards = Leitner.getCardsForSession(deck, {
    today: '2025-01-20',
    maxCards: 20
});

// 2. Pour chaque carte jouée
function processAnswer(card, isCorrect, responseTimeMs) {
    const thresholdMs = (card.latencyThreshold || 5) * 1000;

    // Calculer la nouvelle boîte
    const newBox = Leitner.getNextBox(
        card.box,
        isCorrect,
        responseTimeMs,
        thresholdMs
    );

    // Mettre à jour le seuil
    const newThreshold = Leitner.updateLatencyThreshold(
        card,
        isCorrect,
        responseTimeMs
    );

    // Calculer le repos si carte passe en vert
    let restUntil = null;
    if (newBox === 'green') {
        const restDays = Leitner.calculateRestDays(
            responseTimeMs,
            thresholdMs,
            card.restDays || 0
        );
        restUntil = addDays(today, restDays);
    }

    // Mettre à jour la carte
    return {
        ...card,
        box: newBox,
        latencyThreshold: newThreshold,
        restUntil,
        lastResponseTimeMs: responseTimeMs
    };
}
```

---

## Tests

Les tests du module Leitner sont dans `tests/leitner.test.js`.

```bash
# Lancer les tests
npm test
```

Couverture :
- `getNextBox()` : 100%
- `updateLatencyThreshold()` : 100%
- `calculateRestDays()` : 100%
- `isCardPlayable()` : 100%
- `getCardsForSession()` : 100%

---

**Dernière mise à jour** : 2025-12-12
