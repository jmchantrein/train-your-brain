# Détection de Doublons et Similarité - DeckValidator

## Vue d'Ensemble

Le module `DeckValidator` intègre un système avancé de détection de doublons et de similarité pour identifier les cartes identiques ou trop proches dans un deck.

### Fonctionnalités

- ✅ **Doublons exacts** : Détecte les cartes avec question ET réponse identiques
- ✅ **Similarité Jaccard** : Compare les ensembles de mots (idéal pour textes longs)
- ✅ **Distance Levenshtein** : Compare les caractères (idéal pour textes courts)
- ✅ **Comparaison réponses** : Analyse la similarité des réponses entre cartes similaires
- ✅ **Types spécialisés** : Gestion des types numeric, MCQ, boolean
- ✅ **Seuils configurables** : Ajustez la sensibilité de détection
- ✅ **Performance optimisée** : Traite 1000+ cartes rapidement

---

## Utilisation Basique

### Détection Simple

```javascript
const cards = [
  { id: 'card1', question: 'Capitale de France ?', answer: 'Paris' },
  { id: 'card2', question: 'Capitale de France ?', answer: 'Paris' },
  { id: 'card3', question: 'Capitale d\'Allemagne ?', answer: 'Berlin' }
];

const duplicates = DeckValidator.findDuplicates(cards);

console.log(duplicates);
// [
//   {
//     card1: 'card1',
//     card2: 'card2',
//     similarity: 100,
//     answerSimilarity: 100,
//     type: 'exact',
//     severity: 'error',
//     message: 'Doublon exact (question ET réponse identiques)',
//     details: {
//       questionMatch: true,
//       answerMatch: true,
//       method: 'jaccard'
//     }
//   }
// ]
```

### Avec Options

```javascript
const duplicates = DeckValidator.findDuplicates(cards, {
  questionThreshold: 0.8,    // Seuil pour questions (0-1)
  answerThreshold: 0.9,      // Seuil pour réponses (0-1)
  useLevenshtein: true       // Utiliser Levenshtein pour textes courts
});
```

### Validation Complète

```javascript
const deck = {
  id: 'my-deck',
  name: 'Mon Deck',
  cards: [/* ... */]
};

const report = DeckValidator.validateDeck(deck);

console.log(report.duplicates);
console.log(`Score: ${report.averageScore}%`);
console.log(`Cartes avec erreurs: ${report.stats.cardsWithErrors}`);
```

---

## Types de Doublons Détectés

### 1. Doublons Exacts (type: 'exact')

Question ET réponse identiques après normalisation par `TextUtils.normalizeText` : insensible à la casse, aux accents des lettres latines, aux espaces multiples et à la ponctuation. Une question ou une réponse vide après normalisation n'est jamais un doublon exact.

```javascript
// Ces deux cartes sont des doublons EXACTS
{ question: 'Quelle est la capitale de la France ?', answer: 'Paris' }
{ question: 'QUELLE  EST LA CAPITALE DE LA FRANCE', answer: 'paris !' }
```

**Caractéristiques :**
- Similarité : 100%
- Sévérité : `ERROR`
- Message : "Doublon exact (question ET réponse identiques)"

### 2. Questions + Réponses Similaires (type: 'full')

Questions quasi-identiques avec même réponse.

```javascript
// Ces cartes sont TRÈS similaires (similarité des questions : 80%)
{ question: 'Quelle est la capitale de la France ?', answer: 'Paris' }
{ question: 'Quelle est la capitale actuelle de la France ?', answer: 'Paris' }
```

**Caractéristiques :**
- Similarité question : ≥ 80%
- Similarité réponse : ≥ 90%
- Sévérité : `WARNING` ou `ERROR` (selon similarité)
- Message : "Questions ET réponses quasi-identiques" (similarité des questions > 95%) ou "Questions similaires avec même réponse"

### 3. Questions Similaires (type: 'question')

Questions similaires mais réponses différentes.

```javascript
// Questions similaires (80%), MAIS réponses différentes (33%)
{ question: 'Quelle est la population de la France ?', answer: '68 millions' }
{ question: 'Quelle est la population actuelle de la France ?', answer: '67 millions' }
```

**Caractéristiques :**
- Similarité question : ≥ 80%
- Similarité réponse : < 90%
- Sévérité : `WARNING`
- Message : "Questions très similaires"

---

## Algorithmes de Similarité

### Jaccard Similarity (par défaut)

Basé sur les **ensembles de mots** (insensible à l'ordre).

```javascript
const similarity = DeckValidator._jaccardSimilarity(
  'Quelle est la capitale de la France ?',
  'Quelle est la capitale française ?'
);
// 0.6 : {quelle, est, capitale, france} ∩ {quelle, est, capitale, francaise} = 3 mots sur 5
```

**Normalisation** : chaque texte passe par `TextUtils.normalizeText` (casse, accents latins, ponctuation). Les apostrophes et les traits d'union entre deux lettres séparent les mots (`l'eau` → `l`, `eau` ; `est-ce` → `est`, `ce`).

**Mots retenus** : les mots de 2 caractères ou moins sont ignorés (« la », « de », « le »), sauf ceux qui contiennent un chiffre (« 7 », « 12 ») : `7 + 5` et `7 + 6` restent distincts.

**Cas sans mot retenu** : si aucun des deux textes ne contient de mot retenu, la similarité vaut 1 seulement quand les textes normalisés sont identiques et non vides, sinon 0. Deux textes sans mot retenu (par exemple `?` et `!`, ou `Où ?` et `Qui ?`) ne sont donc plus des doublons.

**Avantages :**
- Rapide
- Robuste pour textes longs
- Insensible à l'ordre des mots

**Inconvénients :**
- Moins précis pour textes courts
- Ignore les fautes de frappe

**Quand l'utiliser :**
- Textes longs (> 50 caractères)
- Recherche de formulations similaires

### Levenshtein Distance (optionnel)

Basé sur le **nombre d'opérations** pour transformer un texte en un autre.

```javascript
const similarity = DeckValidator._levenshteinSimilarity('Paris', 'Pari');
// 80% (1 caractère de différence sur 5)
```

**Avantages :**
- Précis pour textes courts
- Détecte les fautes de frappe
- Sensible à l'ordre

**Inconvénients :**
- Normalisation propre (minuscules et accents seulement) : n'utilise pas `TextUtils.normalizeText`
- Plus lent (O(n²))
- Moins pertinent pour textes longs

**Quand l'utiliser :**
- Textes courts (< 50 caractères)
- Détection de fautes de frappe
- Réponses courtes (mots simples)

**Activation :**
```javascript
DeckValidator.findDuplicates(cards, { useLevenshtein: true });
```

Le système choisit automatiquement l'algorithme approprié selon la longueur du texte.

---

## Options de Configuration

### questionThreshold

Seuil de similarité pour les questions (0 = aucune similarité, 1 = identique).

```javascript
// Strict : seulement quasi-identiques
DeckValidator.findDuplicates(cards, { questionThreshold: 0.95 });

// Standard (défaut)
DeckValidator.findDuplicates(cards, { questionThreshold: 0.8 });

// Permissif : détecter beaucoup de variations
DeckValidator.findDuplicates(cards, { questionThreshold: 0.6 });
```

**Recommandations :**
- `0.95-1.0` : Très strict (quasi-identiques uniquement)
- `0.8-0.9` : Standard (similitudes évidentes)
- `0.6-0.7` : Permissif (variations importantes)

### answerThreshold

Seuil de similarité pour les réponses.

```javascript
DeckValidator.findDuplicates(cards, {
  questionThreshold: 0.8,
  answerThreshold: 0.9  // Réponses doivent être très proches
});
```

**Recommandations :**
- `0.9-1.0` : Recommandé (éviter faux positifs)
- `0.8-0.9` : Si réponses peuvent varier légèrement
- `< 0.8` : Déconseillé (trop de faux positifs)

### useLevenshtein

Active l'algorithme Levenshtein pour textes courts.

```javascript
DeckValidator.findDuplicates(cards, { useLevenshtein: true });
```

Le système active automatiquement Levenshtein si :
- Total longueur question1 + question2 < 50 caractères
- OU total longueur réponse1 + réponse2 < 50 caractères

---

## Structure de Retour

### Format d'un Doublon

```javascript
{
  card1: 'card_id_1',           // ID première carte
  card2: 'card_id_2',           // ID deuxième carte
  similarity: 95,               // Similarité questions (0-100)
  answerSimilarity: 100,        // Similarité réponses (0-100)
  type: 'exact',                // 'exact' | 'full' | 'question'
  severity: 'error',            // 'error' | 'warning' | 'info'
  message: 'Doublon exact...', // Message descriptif
  details: {
    questionMatch: true,        // Questions quasi-identiques ?
    answerMatch: true,          // Réponses quasi-identiques ?
    method: 'jaccard'           // 'jaccard' | 'levenshtein'
  }
}
```

### Types de Similarité

| Type | Description | Similarité Q | Similarité R |
|------|-------------|--------------|--------------|
| `exact` | Question + réponse identiques | 100% | 100% |
| `full` | Questions + réponses similaires | ≥80% | ≥90% |
| `question` | Questions similaires, réponses différentes | ≥80% | <90% |

### Niveaux de Sévérité

| Sévérité | Quand | Action |
|----------|-------|--------|
| `error` | Doublon exact ou similarité >95% | Bloquer ou corriger immédiatement |
| `warning` | Similarité 80-95% | Vérifier et potentiellement corriger |
| `info` | Similarité 60-80% | Informer, pas forcément un problème |

---

## Gestion des Types Spéciaux

### Cartes Numériques

Comparaison exacte (insensible aux espaces).

```javascript
const cards = [
  { type: 'numeric', question: '2 + 2', answer: '4' },
  { type: 'numeric', question: '2+2', answer: ' 4 ' }
];

const duplicates = DeckValidator.findDuplicates(cards);
// answerSimilarity: 100% (réponses identiques)
```

### Cartes MCQ

Comparaison par ID d'option (pas par texte).

```javascript
const cards = [
  {
    type: 'mcq',
    question: 'Capitale France ?',
    answer: 'A',  // Comparé par ID
    choices: [
      { id: 'A', text: 'Paris' },
      { id: 'B', text: 'Lyon' }
    ]
  },
  {
    type: 'mcq',
    question: 'Capitale de France ?',
    answer: 'A',  // Même ID = réponse identique
    choices: [
      { id: 'A', text: 'Paris' },
      { id: 'B', text: 'Marseille' }
    ]
  }
];

const duplicates = DeckValidator.findDuplicates(cards);
// answerSimilarity: 100% (même ID 'A')
```

### Cartes Boolean

Comparaison stricte (true/false, vrai/faux).

```javascript
const cards = [
  { type: 'boolean', question: 'Paris est en France', answer: 'true' },
  { type: 'boolean', question: 'Paris est en France ?', answer: 'vrai' }
];

const duplicates = DeckValidator.findDuplicates(cards);
// answerSimilarity: 100% (true = vrai)
```

---

## Cas d'Usage

### 1. Contrôle Qualité Avant Import

```javascript
function validateBeforeImport(deck) {
  const report = DeckValidator.validateDeck(deck);

  if (report.duplicates.length > 0) {
    console.warn(`⚠️ ${report.duplicates.length} doublons détectés :`);
    report.duplicates.forEach(dup => {
      console.warn(`  - ${dup.message} (${dup.card1} ↔ ${dup.card2})`);
    });

    // Bloquer si doublons exacts
    const exactDuplicates = report.duplicates.filter(d => d.type === 'exact');
    if (exactDuplicates.length > 0) {
      throw new Error('Import bloqué : doublons exacts détectés');
    }
  }

  return report;
}
```

### 2. Nettoyage Automatique

```javascript
function removeDuplicates(deck) {
  const duplicates = DeckValidator.findDuplicates(deck.cards);
  const toRemove = new Set();

  duplicates
    .filter(d => d.type === 'exact')
    .forEach(dup => {
      // Garder la première, supprimer la deuxième
      toRemove.add(dup.card2);
    });

  deck.cards = deck.cards.filter(card => !toRemove.has(card.id));
  return deck;
}
```

### 3. Suggestion de Fusion

```javascript
function suggestMerges(deck) {
  const duplicates = DeckValidator.findDuplicates(deck.cards, {
    questionThreshold: 0.85
  });

  const suggestions = duplicates.map(dup => {
    const card1 = deck.cards.find(c => c.id === dup.card1);
    const card2 = deck.cards.find(c => c.id === dup.card2);

    return {
      type: 'merge',
      cards: [card1, card2],
      similarity: dup.similarity,
      suggestion: `Fusionner "${card1.question}" et "${card2.question}"`
    };
  });

  return suggestions;
}
```

### 4. Rapport de Qualité

```javascript
function generateQualityReport(deck) {
  const report = DeckValidator.validateDeck(deck);

  return {
    score: report.averageScore,
    totalCards: report.stats.totalCards,
    issues: {
      duplicates: report.duplicates.length,
      exactDuplicates: report.duplicates.filter(d => d.type === 'exact').length,
      similarCards: report.duplicates.filter(d => d.type !== 'exact').length
    },
    recommendations: generateRecommendations(report)
  };
}

function generateRecommendations(report) {
  const recs = [];

  if (report.duplicates.length > 0) {
    recs.push(`Supprimer ou fusionner ${report.duplicates.length} doublons`);
  }

  const exactDups = report.duplicates.filter(d => d.type === 'exact');
  if (exactDups.length > 0) {
    recs.push(`⚠️ ${exactDups.length} doublons exacts à supprimer immédiatement`);
  }

  return recs;
}
```

---

## Performance

### Complexité

- **Temps** : O(n²) comparaisons de paires, mais chaque carte n'est normalisée et découpée en mots qu'une seule fois (O(n) de prétraitement)
- **Espace** : O(n) pour les formes normalisées

### Mesures

`DeckValidator.findDuplicates` sur des cartes `exact_text` synthétiques (mesure du 2026-11-22, Node.js, une exécution ; l'ordre de grandeur compte, pas le chiffre) :

| Cartes | Temps |
|--------|-------|
| 100 | ~11 ms |
| 500 | ~35 ms |
| 1000 | ~100 ms |

Avant l'optimisation (normalisation des deux textes à chaque paire), 500 cartes demandaient environ 3 s. Le test `tests/deck-validator-duplicates.test.js` vérifie le nombre d'appels de normalisation, pas la durée.

### Optimisations Implémentées

1. **Early exit** : Arrêt dès qu'un doublon exact est trouvé
2. **Algorithme adaptatif** : Levenshtein seulement pour textes courts
3. **Normalisation unique** : chaque carte est normalisée et découpée en mots une fois, avant la boucle de comparaison
4. **Espace optimisé** : Levenshtein en O(min(m,n)) au lieu de O(m×n)

### Recommandations

- **Jusqu'à 1000 cartes** : exécution en moins d'une demi-seconde
- **Au-delà** : le coût des paires reste quadratique ; envisager un traitement asynchrone

---

## Limitations

### 1. Synonymes Non Détectés

Le système ne détecte PAS les synonymes :

```javascript
// Ces cartes NE seront PAS détectées comme similaires
{ question: 'Quelle est la capitale de France ?', answer: 'Paris' }
{ question: 'Quelle est la ville principale de France ?', answer: 'Paris' }
```

**Solution** : Utiliser un seuil bas (`0.6-0.7`) mais augmente les faux positifs.

### 2. Reformulations Complexes

Reformulations importantes non détectées :

```javascript
// Pas détectées car structure différente
{ question: 'Paris est la capitale de quel pays ?', answer: 'France' }
{ question: 'Quel pays a pour capitale Paris ?', answer: 'France' }
```

### 3. Langues Différentes

Pas de détection multi-lingue :

```javascript
// Pas détectées
{ question: 'What is the capital of France?', answer: 'Paris' }
{ question: 'Quelle est la capitale de la France ?', answer: 'Paris' }
```

### 4. Contexte Sémantique

Pas d'analyse sémantique :

```javascript
// Détectées comme similaires MAIS sont distinctes
{ question: 'Capitale de France en 1789 ?', answer: 'Paris' }
{ question: 'Capitale de France en 2025 ?', answer: 'Paris' }
```

---

## FAQ

### Comment choisir le bon seuil ?

- **Strict (0.9-1.0)** : Deck professionnel, qualité maximale
- **Standard (0.8-0.9)** : Usage général, bon équilibre
- **Permissif (0.6-0.8)** : Analyse exploratoire, détecter variations

### Faut-il utiliser Levenshtein ?

Oui si :
- Beaucoup de réponses courtes (1-3 mots)
- Détection de fautes de frappe importante
- Deck de vocabulaire ou termes techniques

Non si :
- Questions/réponses longues
- Performance critique (>500 cartes)
- Variations de formulation importantes

### Les doublons bloquent-ils l'import ?

Non par défaut. Le système :
- **Détecte** et **rapporte** les doublons
- **Attribue** une sévérité (error/warning/info)
- Laisse l'application **décider** de bloquer ou non

Pour bloquer :

```javascript
const report = DeckValidator.validateDeck(deck);
if (report.duplicates.some(d => d.severity === 'error')) {
  throw new Error('Doublons critiques détectés');
}
```

### Comment gérer les faux positifs ?

1. **Augmenter le seuil** : `questionThreshold: 0.9`
2. **Vérifier les réponses** : Utiliser `answerThreshold` élevé
3. **Filtrer par type** : Ignorer `type: 'question'` si acceptable
4. **Validation manuelle** : Présenter à l'utilisateur pour confirmation

---

## Exemples Complets

Voir : `/examples/duplicate-detection-demo.js`

Tests : `/tests/deck-validator-duplicates.test.js`

---

## Changelog

### 2026-11-22

- 🔧 La similarité Jaccard et la détection des doublons exacts passent par `TextUtils.normalizeText` (Unicode ; ponctuation ignorée dans les doublons exacts)
- 🔧 Mots de 2 caractères ou moins ignorés, sauf s'ils contiennent un chiffre
- 🔧 Deux textes sans mot retenu ne sont plus des doublons (sauf textes normalisés identiques et non vides)
- 🔧 Apostrophes et traits d'union séparent les mots

### v1.0.0 (2025-12-05)

- ✨ Détection doublons exacts (question + réponse)
- ✨ Similarité Jaccard pour questions
- ✨ Comparaison réponses entre cartes similaires
- ✨ Distance Levenshtein pour textes courts
- ✨ Gestion types spéciaux (numeric, MCQ, boolean)
- ✨ Seuils configurables
- ✨ Intégration dans validateDeck()
- ✨ 38 tests unitaires
- 📈 Performance (version initiale) : 1000 cartes en ~4s ; voir « Mesures » pour l'état actuel

---

## Support

Pour signaler un bug ou demander une fonctionnalité, créez une issue dans le dépôt.
