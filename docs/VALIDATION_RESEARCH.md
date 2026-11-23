# Recherche : Validation Algorithmique des Decks Générés par LLM

> **État** : document de recherche, non maintenu. L'API proposée en section 10 (`DeckValidator.generateReport`, etc.) n'existe pas telle quelle. Le validateur réel : `src/modules/deck-validator.js` et `docs/BUILD_VALIDATION.md`.

> **Date** : 2025-12-05
> **Objectif** : Identifier les méthodes de validation réalisables offline pour améliorer la qualité des flashcards générées par IA

---

## Sommaire

1. [Contexte et Contraintes](#1-contexte-et-contraintes)
2. [Validation Structurelle (100% fiable)](#2-validation-structurelle-100-fiable)
3. [Métriques de Qualité Textuelle](#3-métriques-de-qualité-textuelle)
4. [Qualité des QCM](#4-qualité-des-qcm)
5. [Détection de Similarité et Doublons](#5-détection-de-similarité-et-doublons)
6. [Signaux de Risque Factuel](#6-signaux-de-risque-factuel)
7. [Classification Cognitive (Bloom)](#7-classification-cognitive-bloom)
8. [Scoring de Confiance et UX](#8-scoring-de-confiance-et-ux)
9. [Boucle de Correction LLM](#9-boucle-de-correction-llm)
10. [Recommandations d'Implémentation](#10-recommandations-dimplémentation)

---

## 1. Contexte et Contraintes

### Environnement
- **Offline obligatoire** : Pas d'API externe, tout en JavaScript navigateur
- **Pas de LLM local** : Validation purement algorithmique
- **Non-bloquant** : L'utilisateur peut forcer l'import malgré les avertissements

### Objectifs
1. Détecter les erreurs structurelles (bloquantes)
2. Mesurer la qualité rédactionnelle (score)
3. Signaler les contenus à vérifier (aide humaine)
4. Générer des prompts de correction (boucle LLM externe)

---

## 2. Validation Structurelle (100% fiable)

Ces validations sont **déterministes** et détectent des erreurs réelles.

### 2.1 Syntaxe YAML
```javascript
// Parser YAML → exceptions si invalide
try {
  YAML.parse(content);
} catch (e) {
  return { error: 'YAML_SYNTAX', message: e.message, line: e.line };
}
```

### 2.2 Schéma de Données

| Champ | Règle | Sévérité |
|-------|-------|----------|
| `id` | Présent, non vide, unique | ERROR |
| `question` | Présent, non vide | ERROR |
| `answer` | Présent, non vide | ERROR |
| `type` | ∈ `[text, numeric, mcq, truefalse]` | ERROR |
| `options` (si mcq) | Array, ≥2 éléments | ERROR |
| `options[].id` | Présent, unique dans la carte | ERROR |
| `options[].text` | Présent, non vide | ERROR |
| `answer` (si mcq) | = un des `options[].id` | ERROR |
| `answer` (si truefalse) | ∈ `[true, false]` | ERROR |
| `answer` (si numeric) | Nombre valide | ERROR |

### 2.3 Cohérence Interne

| Vérification | Description | Sévérité |
|--------------|-------------|----------|
| IDs uniques | Pas de doublons d'ID dans le deck | ERROR |
| Options MCQ uniques | Pas de textes d'options identiques | WARNING |
| Réponse MCQ valide | `answer` correspond à un ID existant | ERROR |

**Source** : [Docimological Quality Analysis of LLM-Generated MCQs](https://link.springer.com/article/10.1007/s42979-024-02963-6)

---

## 3. Métriques de Qualité Textuelle

### 3.1 Lisibilité (Readability)

Les formules de lisibilité évaluent la complexité d'un texte. Implémentables en JS pur.

#### Flesch-Kincaid Grade Level
```javascript
// Grade scolaire US requis pour comprendre le texte
function fleschKincaidGrade(text) {
  const sentences = countSentences(text);
  const words = countWords(text);
  const syllables = countSyllables(text);

  const ASL = words / sentences;  // Average Sentence Length
  const ASW = syllables / words;  // Average Syllables per Word

  return 0.39 * ASL + 11.8 * ASW - 15.59;
}
```

#### Interprétation
| Grade | Niveau | Recommandation |
|-------|--------|----------------|
| 1-6 | Primaire | ✅ Idéal pour enfants |
| 7-9 | Collège | ✅ Accessible |
| 10-12 | Lycée | ⚠️ Vérifier si adapté |
| 13+ | Universitaire | ⚠️ Potentiellement complexe |

**Source** : [Flesch-Kincaid Readability Tests - Wikipedia](https://en.wikipedia.org/wiki/Flesch%E2%80%93Kincaid_readability_tests)

### 3.2 Longueur et Structure

| Métrique | Calcul | Seuils |
|----------|--------|--------|
| Longueur question | Nombre de caractères | < 20: WARNING, > 500: WARNING |
| Longueur réponse | Nombre de caractères | < 1: ERROR, > 200: INFO |
| Mots par phrase | Moyenne | > 25: WARNING (complexité) |
| Ponctuation question | Se termine par `?` | Non: INFO |

### 3.3 Détection de Problèmes Rédactionnels

```javascript
const REDACTION_PATTERNS = [
  { pattern: /\s{2,}/g, issue: 'Espaces multiples', severity: 'INFO' },
  { pattern: /^\s+|\s+$/g, issue: 'Espaces en début/fin', severity: 'INFO' },
  { pattern: /[.]{2,}/g, issue: 'Points de suspension mal formés', severity: 'INFO' },
  { pattern: /^[a-z]/g, issue: 'Commence par minuscule', severity: 'INFO' },
];
```

---

## 4. Qualité des QCM

La recherche sur les QCM identifie des critères de qualité mesurables algorithmiquement.

### 4.1 Métriques de Qualité des Distracteurs

| Critère | Description | Détection Algo |
|---------|-------------|----------------|
| Nombre minimum | ≥ 3 options recommandées | ✅ Facile |
| Longueur homogène | Options de longueur similaire | ✅ Écart-type longueurs |
| Pas de "tous/aucun" | Éviter "Toutes les réponses" | ✅ Pattern matching |
| Grammaticalement cohérent | Même forme grammaticale | ⚠️ Difficile |

### 4.2 Défauts Détectables (Item-Writing Flaws)

```javascript
const MCQ_FLAWS = [
  {
    name: 'LONGEST_CORRECT',
    detect: (card) => {
      const correct = card.options.find(o => o.id === card.answer);
      const avgLength = average(card.options.map(o => o.text.length));
      return correct.text.length > avgLength * 1.5;
    },
    message: 'La bonne réponse est significativement plus longue',
    severity: 'WARNING'
  },
  {
    name: 'ABSOLUTE_TERMS',
    detect: (card) => {
      const absolutes = /\b(toujours|jamais|tous|aucun|never|always|all|none)\b/i;
      return card.options.some(o => o.id !== card.answer && absolutes.test(o.text));
    },
    message: 'Distracteur avec terme absolu (souvent faux)',
    severity: 'INFO'
  },
  {
    name: 'WORD_REPETITION',
    detect: (card) => {
      const stemWords = extractKeywords(card.question);
      const correct = card.options.find(o => o.id === card.answer);
      const correctWords = extractKeywords(correct.text);
      const overlap = intersection(stemWords, correctWords);
      return overlap.length > 2;
    },
    message: 'Mots de la question répétés dans la bonne réponse',
    severity: 'WARNING'
  }
];
```

**Sources** :
- [NBME Item-Writing Guide](https://www.nbme.org/sites/default/files/2021-02/NBME_Item%20Writing%20Guide_R_6.pdf)
- [Item-Writing Flaws Impact Study](https://pmc.ncbi.nlm.nih.gov/articles/PMC5041405/)

### 4.3 Réponse dans la Question

Un défaut classique : la réponse apparaît textuellement dans la question.

```javascript
function answerInQuestion(card) {
  const answer = card.answer.toString().toLowerCase();
  const question = card.question.toLowerCase();

  // Réponse exacte dans la question
  if (question.includes(answer) && answer.length > 3) {
    return { severity: 'WARNING', message: 'La réponse apparaît dans la question' };
  }

  // Pour MCQ : texte de la bonne réponse dans la question
  if (card.type === 'mcq') {
    const correctOption = card.options.find(o => o.id === card.answer);
    if (question.includes(correctOption.text.toLowerCase())) {
      return { severity: 'ERROR', message: 'Le texte de la bonne réponse est dans la question' };
    }
  }

  return null;
}
```

---

## 5. Détection de Similarité et Doublons

### 5.1 Algorithmes de Similarité

| Algorithme | Usage | Complexité | Implémentation JS |
|------------|-------|------------|-------------------|
| **Levenshtein** | Distance d'édition | O(n×m) | ✅ Simple |
| **Jaro-Winkler** | Similarité préfixe | O(n×m) | ✅ Recommandé |
| **Jaccard** | Ensembles de mots | O(n+m) | ✅ Très rapide |
| **Cosine** | Vecteurs TF-IDF | O(n) | ⚠️ Plus complexe |

**État d'implémentation (2026-11)** : `DeckValidator._jaccardSimilarity` normalise via `TextUtils.normalizeText`, sépare les mots sur les apostrophes et traits d'union, ignore les mots de 2 caractères ou moins (sauf s'ils contiennent un chiffre) et retourne 0 quand aucun mot n'est retenu des deux côtés (hors textes normalisés identiques non vides). Comportement détaillé : `docs/DUPLICATE_DETECTION.md`.

### 5.2 Implémentation Recommandée

```javascript
// Jaccard Similarity - Simple et efficace
function jaccardSimilarity(str1, str2) {
  const set1 = new Set(str1.toLowerCase().split(/\s+/));
  const set2 = new Set(str2.toLowerCase().split(/\s+/));

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

// Détection de doublons
function findDuplicates(cards, threshold = 0.8) {
  const duplicates = [];

  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const similarity = jaccardSimilarity(cards[i].question, cards[j].question);
      if (similarity >= threshold) {
        duplicates.push({
          cards: [cards[i].id, cards[j].id],
          similarity: Math.round(similarity * 100),
          severity: similarity > 0.95 ? 'ERROR' : 'WARNING'
        });
      }
    }
  }

  return duplicates;
}
```

**Source** : [Guide to String Similarity Algorithms](https://www.analyticsvidhya.com/blog/2021/02/a-simple-guide-to-metrics-for-calculating-string-similarity/)

### 5.3 Seuils Recommandés

| Similarité | Interprétation | Action |
|------------|----------------|--------|
| > 95% | Doublon quasi-certain | ERROR |
| 80-95% | Probablement doublon | WARNING |
| 60-80% | Questions similaires | INFO |
| < 60% | Suffisamment différent | OK |

---

## 6. Signaux de Risque Factuel

### 6.1 Limitation Fondamentale

> **Important** : Ces heuristiques ne **vérifient pas** les faits. Elles **signalent** du contenu qui **pourrait** nécessiter une vérification humaine.

### 6.2 Patterns de Contenu à Risque

```javascript
const FACTUAL_RISK_PATTERNS = [
  // Dates historiques
  {
    pattern: /\b(en|année|le)\s+\d{3,4}\b/i,
    risk: 0.3,
    category: 'DATE',
    message: 'Date historique - à vérifier',
    example: 'La Révolution française a commencé en 1789'
  },

  // Statistiques et mesures
  {
    pattern: /\d+\s*(km|m|kg|g|%|millions?|milliards?|habitants)/i,
    risk: 0.4,
    category: 'STATISTIC',
    message: 'Statistique/mesure - à vérifier',
    example: 'La France compte 67 millions d\'habitants'
  },

  // Superlatifs vérifiables
  {
    pattern: /\b(premier|première|plus grand|plus petit|record|le plus|la plus)\b/i,
    risk: 0.5,
    category: 'SUPERLATIVE',
    message: 'Superlatif factuel - à vérifier',
    example: 'L\'Everest est la plus haute montagne'
  },

  // Attributions
  {
    pattern: /\b(inventé|découvert|créé|fondé)\s+(par|en)\b/i,
    risk: 0.4,
    category: 'ATTRIBUTION',
    message: 'Attribution historique - à vérifier',
    example: 'L\'ampoule a été inventée par Edison'
  },

  // Citations
  {
    pattern: /"[^"]{10,}"/,
    risk: 0.6,
    category: 'QUOTE',
    message: 'Citation - exactitude à vérifier',
    example: '"Je pense donc je suis" - Descartes'
  },

  // Faits politiques/géographiques
  {
    pattern: /\b(capitale|président|roi|reine|premier ministre)\s+(de|du|des)\b/i,
    risk: 0.3,
    category: 'POLITICAL',
    message: 'Fait politique/géographique - peut changer',
    example: 'Paris est la capitale de la France'
  }
];
```

### 6.3 Calcul du Score de Risque

```javascript
function assessFactualRisk(card) {
  let totalRisk = 0;
  const flags = [];

  const textToCheck = `${card.question} ${card.answer}`;

  for (const pattern of FACTUAL_RISK_PATTERNS) {
    if (pattern.pattern.test(textToCheck)) {
      totalRisk += pattern.risk;
      flags.push({
        category: pattern.category,
        message: pattern.message
      });
    }
  }

  // Normaliser entre 0 et 1
  const normalizedRisk = Math.min(totalRisk, 1);

  return {
    score: normalizedRisk,
    level: normalizedRisk > 0.6 ? 'HIGH' : normalizedRisk > 0.3 ? 'MEDIUM' : 'LOW',
    flags,
    needsVerification: normalizedRisk > 0.3
  };
}
```

### 6.4 Présentation à l'Utilisateur

Le risque doit être présenté comme une **aide à la décision**, pas un verdict :

```
⚠️ Cette carte contient des éléments factuels à vérifier :
   • Date historique détectée
   • Statistique numérique

   💡 Conseil : Vérifiez ces informations avant d'utiliser ce deck
```

**Sources** :
- [Semantic Entropy for Hallucination Detection - Nature](https://www.nature.com/articles/s41586-024-07421-0)
- [LLM Hallucination Survey - GitHub](https://github.com/HillZhang1999/llm-hallucination-survey)

---

## 7. Classification Cognitive (Bloom)

### 7.1 Taxonomie de Bloom Révisée

| Niveau | Verbes Clés | Complexité |
|--------|-------------|------------|
| 1. Mémoriser | définir, lister, nommer, réciter | Basse |
| 2. Comprendre | expliquer, résumer, paraphraser | Basse |
| 3. Appliquer | utiliser, calculer, résoudre | Moyenne |
| 4. Analyser | comparer, distinguer, organiser | Moyenne |
| 5. Évaluer | juger, critiquer, justifier | Haute |
| 6. Créer | concevoir, inventer, planifier | Haute |

### 7.2 Détection du Niveau Cognitif

```javascript
const BLOOM_PATTERNS = {
  remember: {
    patterns: [
      /\b(qu'est-ce que?|quel est|quelle est|définir?|nommer?|lister?)\b/i,
      /\b(qui a|quand|où)\b/i
    ],
    level: 1,
    label: 'Mémorisation'
  },
  understand: {
    patterns: [
      /\b(expliquer?|décrire?|résumer?|pourquoi)\b/i,
      /\b(signifie?|exemple de)\b/i
    ],
    level: 2,
    label: 'Compréhension'
  },
  apply: {
    patterns: [
      /\b(calculer?|résoudre?|utiliser?|appliquer?)\b/i,
      /\b(combien|quel résultat)\b/i
    ],
    level: 3,
    label: 'Application'
  },
  analyze: {
    patterns: [
      /\b(comparer?|distinguer?|analyser?|différence entre)\b/i,
      /\b(pourquoi.*différent|relation entre)\b/i
    ],
    level: 4,
    label: 'Analyse'
  },
  evaluate: {
    patterns: [
      /\b(juger?|évaluer?|critiquer?|meilleur|pire)\b/i,
      /\b(avantages?|inconvénients?|pour ou contre)\b/i
    ],
    level: 5,
    label: 'Évaluation'
  },
  create: {
    patterns: [
      /\b(créer?|concevoir?|proposer?|inventer?)\b/i,
      /\b(imaginer?|planifier?)\b/i
    ],
    level: 6,
    label: 'Création'
  }
};

function classifyBloomLevel(question) {
  for (const [key, config] of Object.entries(BLOOM_PATTERNS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(question)) {
        return {
          level: config.level,
          label: config.label,
          category: key
        };
      }
    }
  }
  // Par défaut : mémorisation
  return { level: 1, label: 'Mémorisation', category: 'remember' };
}
```

**État d'implémentation (2026-11)** : `DeckValidator.classifyBloomLevel` applique des motifs anglais et français. Les motifs français couvrent l'infinitif et l'impératif 2e personne du pluriel (`définissez`, `expliquez`, `calculez`, `comparez`, `justifiez`, `créez`...), avec des bornes de mot Unicode (`(?<![\p{L}\p{N}])`) car `\b` est ASCII et ne gère pas les initiales accentuées (`évaluez`, `énumérez`).

### 7.3 Utilité pour le Deck

- **Distribution cognitive** : Un bon deck devrait avoir des questions de différents niveaux
- **Indication de difficulté** : Niveau Bloom corrèle avec difficulté
- **Aide à l'équilibrage** : Signaler si toutes les questions sont au même niveau

**Source** : [Bloom's Taxonomy Question Classification - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7081997/)

---

## 8. Scoring de Confiance et UX

### 8.1 Recherche sur les Indicateurs de Confiance

La recherche montre que les utilisateurs font de meilleures décisions quand ils voient des indicateurs de confiance explicites.

> "Un système qui dit 'je suis sûr à 85%' est plus fiable qu'un qui affirme simplement une réponse."

**Source** : [Impact of Confidence Ratings on User Trust in LLMs](https://dl.acm.org/doi/10.1145/3708319.3734178)

### 8.2 Score de Qualité Composite

```javascript
function calculateQualityScore(card, deckContext) {
  const weights = {
    structure: 0.30,      // Validité structurelle
    readability: 0.15,    // Lisibilité adaptée
    mcqQuality: 0.20,     // Qualité QCM (si applicable)
    uniqueness: 0.15,     // Pas de doublon
    factualRisk: 0.10,    // Risque faible
    cognitive: 0.10       // Niveau cognitif approprié
  };

  const scores = {
    structure: validateStructure(card).valid ? 1 : 0,
    readability: calculateReadabilityScore(card, deckContext.targetAge),
    mcqQuality: card.type === 'mcq' ? assessMcqQuality(card) : 1,
    uniqueness: 1 - getMaxSimilarity(card, deckContext.otherCards),
    factualRisk: 1 - assessFactualRisk(card).score,
    cognitive: assessCognitiveAppropriate(card, deckContext.targetLevel)
  };

  let totalScore = 0;
  for (const [key, weight] of Object.entries(weights)) {
    totalScore += scores[key] * weight;
  }

  return {
    score: Math.round(totalScore * 100),
    breakdown: scores,
    grade: totalScore > 0.8 ? 'A' : totalScore > 0.6 ? 'B' : totalScore > 0.4 ? 'C' : 'D'
  };
}
```

### 8.3 Présentation Visuelle

| Score | Couleur | Badge | Signification |
|-------|---------|-------|---------------|
| 80-100% | 🟢 Vert | ✓ | Haute confiance |
| 60-79% | 🟡 Jaune | ⚠ | Vérification conseillée |
| 40-59% | 🟠 Orange | ⚠ | Corrections probables |
| 0-39% | 🔴 Rouge | ✗ | Problèmes détectés |

### 8.4 Bonnes Pratiques UX

1. **Non-bloquant** : L'utilisateur peut toujours forcer l'import
2. **Explicite** : Montrer CE qui a été vérifié, pas juste un score
3. **Actionnable** : Chaque avertissement suggère une action
4. **Progressif** : D'abord erreurs, puis warnings, puis suggestions

**Source** : [Psychology of Trust in AI - Smashing Magazine](https://www.smashingmagazine.com/2025/09/psychology-trust-ai-guide-measuring-designing-user-confidence/)

---

## 9. Boucle de Correction LLM

### 9.1 Architecture Proposée

```
┌─────────────────────────────────────────────────────────────┐
│                    BOUCLE DE CORRECTION                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [YAML importé] ──▶ [Validation Algo] ──▶ [Issues ?]       │
│                                              │              │
│                          ┌───────────────────┴──────┐       │
│                          │                          │       │
│                          ▼                          ▼       │
│                   [Afficher rapport]       [Générer prompt] │
│                          │                          │       │
│                          ▼                          ▼       │
│              [Bouton: Importer       [Bouton: Copier        │
│               quand même]             prompt correction]    │
│                                                │            │
│                                                ▼            │
│                                    [User → LLM externe]     │
│                                                │            │
│                                                ▼            │
│                                    [Nouveau YAML corrigé]   │
│                                                │            │
│                         ◀──────────────────────┘            │
│                         │                                   │
│                  [Ré-importer] → [Nouvelle validation]      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Génération du Prompt de Correction

```javascript
function generateCorrectionPrompt(deck, validationReport) {
  const issues = validationReport.issues;

  let prompt = `## Corrections requises pour le deck "${deck.name}"

Tu as généré ce deck de flashcards, mais la validation a détecté des problèmes.
Corrige UNIQUEMENT les problèmes listés ci-dessous, sans modifier le reste.

### Problèmes détectés :

`;

  // Grouper par carte
  const issuesByCard = groupBy(issues, 'cardId');

  for (const [cardId, cardIssues] of Object.entries(issuesByCard)) {
    const card = deck.cards.find(c => c.id === cardId);
    prompt += `\n**Carte "${cardId}"** :\n`;
    prompt += `- Question actuelle : "${card.question}"\n`;
    prompt += `- Réponse actuelle : "${card.answer}"\n`;
    prompt += `- Problèmes :\n`;

    for (const issue of cardIssues) {
      prompt += `  • [${issue.severity}] ${issue.message}\n`;
      if (issue.suggestion) {
        prompt += `    → Suggestion : ${issue.suggestion}\n`;
      }
    }
  }

  prompt += `
### Instructions :
1. Corrige chaque problème mentionné
2. Garde le même format YAML
3. Ne modifie pas les cartes sans problème
4. Assure-toi que les corrections sont factuellement exactes

### Format de réponse :
Renvoie uniquement les cartes corrigées au format YAML, que je pourrai copier-coller.
`;

  return prompt;
}
```

### 9.3 Types de Corrections Supportées

| Type | Correction Automatique | Correction LLM |
|------|------------------------|----------------|
| Syntaxe YAML | ❌ Non | ✅ Oui |
| MCQ format | ❌ Non (ambigu) | ✅ Oui |
| Doublons | ❌ Non (choix) | ✅ Oui (fusion) |
| Lisibilité | ❌ Non | ✅ Oui (reformulation) |
| Risque factuel | ❌ Non | ⚠️ Limité (vérification) |

---

## 10. Recommandations d'Implémentation

### 10.1 Priorisation

| Phase | Fonctionnalité | Effort | Impact |
|-------|----------------|--------|--------|
| 1 | Validation structurelle | Faible | Élevé |
| 1 | Détection doublons (Jaccard) | Faible | Moyen |
| 2 | Qualité MCQ (défauts) | Moyen | Élevé |
| 2 | Réponse dans question | Faible | Moyen |
| 3 | Score composite + UI | Moyen | Élevé |
| 3 | Génération prompt correction | Moyen | Élevé |
| 4 | Lisibilité Flesch-Kincaid | Moyen | Moyen |
| 4 | Classification Bloom | Moyen | Faible |
| 5 | Patterns risque factuel | Faible | Faible* |

*Impact faible car ne vérifie pas réellement les faits

### 10.2 Structure du Code

```javascript
const DeckValidator = {
  // Phase 1 : Structure
  validateStructure(deck) { /* ... */ },
  findDuplicates(cards, threshold) { /* ... */ },

  // Phase 2 : Qualité QCM
  validateMcqQuality(card) { /* ... */ },
  checkAnswerInQuestion(card) { /* ... */ },

  // Phase 3 : Scoring
  calculateQualityScore(card, context) { /* ... */ },
  generateReport(deck) { /* ... */ },

  // Phase 4 : Métriques avancées
  calculateReadability(text) { /* ... */ },
  classifyBloomLevel(question) { /* ... */ },

  // Phase 5 : Signaux
  assessFactualRisk(card) { /* ... */ },

  // Correction
  generateCorrectionPrompt(deck, report) { /* ... */ }
};
```

### 10.3 UX Non-Bloquante

```javascript
// L'import n'est JAMAIS bloqué automatiquement
function handleImport(yaml) {
  const deck = parseYaml(yaml);
  const report = DeckValidator.generateReport(deck);

  if (report.hasErrors) {
    showValidationModal({
      report,
      actions: [
        { label: 'Corriger', action: () => showEditor(report.issues) },
        { label: 'Générer prompt correction', action: () => copyPrompt(report) },
        { label: 'Importer quand même', action: () => forceImport(deck), variant: 'warning' }
      ]
    });
  } else if (report.hasWarnings) {
    showValidationBanner({
      message: `${report.warnings.length} avertissement(s) détecté(s)`,
      action: { label: 'Voir détails', action: () => showReport(report) }
    });
    proceedWithImport(deck);
  } else {
    proceedWithImport(deck);
  }
}
```

---

## Sources

### Qualité des Contenus Éducatifs
- [Analysis of LLMs for Educational Question Classification](https://www.sciencedirect.com/science/article/pii/S2666920X24001012)
- [Docimological Quality Analysis of LLM-Generated MCQs](https://link.springer.com/article/10.1007/s42979-024-02963-6)
- [Automatic Question Generation Review - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC9886210/)

### Détection d'Hallucinations
- [Detecting Hallucinations via Semantic Entropy - Nature](https://www.nature.com/articles/s41586-024-07421-0)
- [LLM Hallucination Survey - GitHub](https://github.com/HillZhang1999/llm-hallucination-survey)
- [Uncertainty Quantification for Hallucination Detection](https://arxiv.org/html/2510.12040)

### Qualité des QCM
- [NBME Item-Writing Guide](https://www.nbme.org/sites/default/files/2021-02/NBME_Item%20Writing%20Guide_R_6.pdf)
- [Item-Writing Flaws Impact - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC5041405/)
- [Distractor Quality Evaluation - Springer](https://link.springer.com/chapter/10.1007/978-3-319-19773-9_38)

### Similarité Textuelle
- [Guide to String Similarity Algorithms](https://www.analyticsvidhya.com/blog/2021/02/a-simple-guide-to-metrics-for-calculating-string-similarity/)
- [Fuzzy Matching for Duplicate Detection](https://medium.com/@ralucanicoara/tackling-fuzzy-duplicates-in-text-data-15475877cae9)

### Lisibilité et Taxonomie
- [Flesch-Kincaid Readability Tests - Wikipedia](https://en.wikipedia.org/wiki/Flesch%E2%80%93Kincaid_readability_tests)
- [Bloom's Taxonomy Question Classification - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7081997/)

### UX et Confiance
- [Impact of Confidence Ratings on User Trust - ACM](https://dl.acm.org/doi/10.1145/3708319.3734178)
- [Psychology of Trust in AI - Smashing Magazine](https://www.smashingmagazine.com/2025/09/psychology-trust-ai-guide-measuring-designing-user-confidence/)
- [Confidence Indicators Patterns](https://www.aiverse.design/patterns/output-confidence)

---

**Conclusion** : La validation algorithmique offline peut apporter une valeur significative en détectant les erreurs structurelles, les problèmes de qualité MCQ, et les doublons. Les heuristiques de risque factuel sont utiles comme **aide à la vérification humaine**, pas comme vérification réelle. La boucle de correction LLM permet de tirer parti d'un LLM externe pour corriger les problèmes détectés.
