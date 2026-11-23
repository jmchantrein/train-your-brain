# Plan d'Amélioration de la Génération Automatique de Decks

> **État** : plan, non réalisé, non maintenu. Ses propositions ne décrivent pas l'application actuelle. L'état réel des générateurs, de la validation et du build : `docs/BUILD_VALIDATION.md`.

> **Document de recherche et propositions**
> **Objectif** : Concevoir le meilleur mécanisme possible pour générer des decks pédagogiquement excellents, factuellement irréprochables, avec médias pertinents.

---

## Table des matières

1. [Analyse de l'existant](#1-analyse-de-lexistant)
2. [Problèmes identifiés](#2-problèmes-identifiés)
3. [Recherche : Bonnes pratiques pédagogiques](#3-recherche-bonnes-pratiques-pédagogiques)
4. [Propositions d'amélioration](#4-propositions-damélioration)
5. [Architecture proposée](#5-architecture-proposée)
6. [Plan d'implémentation](#6-plan-dimplémentation)

---

## 1. Analyse de l'existant

### 1.1 Points forts actuels

Le module `prompt-generator.js` (~900 lignes) inclut déjà :

| Aspect | État | Détails |
|--------|------|---------|
| Structure du prompt | ✅ Bon | 6 sections : sujet, audience, cartes, pédagogie, format, vérification |
| Niveaux éducatifs | ✅ Complet | Maternelle → Doctorat avec équivalents internationaux |
| Types de questions | ✅ Complet | 6 types : text, numeric, mcq, truefalse, cloze, matching |
| Checklist de vérification | ✅ Bon | 5 points : factuel, pédagogique, technique, QCM, cohérence |
| Bonnes pratiques | ⚠️ Basique | Réponses courtes, alternatives, feedback |
| Médias | ⚠️ Partiel | Suggère `mediaSuggestion` mais pas de génération |

### 1.2 Ce qui manque

```
❌ Pas d'exemples concrets de BONNES vs MAUVAISES cartes
❌ Pas de validation factuelle intégrée (sources, références)
❌ Pas de génération de médias (SVG, schémas)
❌ Pas de templates par type de contenu
❌ Pas de guidance sur la densité d'information optimale
❌ Pas de mécanisme anti-hallucination
```

---

## 2. Problèmes identifiés

### 2.1 Risque d'invention de faits (Hallucinations LLM)

**Problème critique** : Les LLM peuvent inventer des informations qui semblent plausibles mais sont fausses.

**Manifestations** :
- Dates historiques approximatives ou inventées
- Noms de personnes/lieux incorrects
- Formules scientifiques erronées
- Citations inventées

**Impact** : Un deck avec des erreurs factuelles est contre-productif - l'apprenant mémorise des informations fausses.

### 2.2 Questions non pertinentes

**Problème** : Certaines questions générées sont :
- Trop triviales (n'apportent rien)
- Trop complexes (plusieurs concepts mélangés)
- Hors sujet (tangentielles au thème)
- Redondantes (reformulations inutiles)

### 2.3 Médias inappropriés ou absents

**Problème actuel** : Le système ne génère pas de médias, il suggère seulement où en ajouter.

**Opportunités manquées** :
- Schémas SVG pour les mathématiques/sciences
- Diagrammes pour les processus
- Cartes géographiques simplifiées
- Illustrations de concepts abstraits

### 2.4 Format de réponse inadapté

**Problème** : Réponses trop longues ou mal formatées :
- "La capitale de la France est Paris" au lieu de "Paris"
- Chiffres avec unités variables ("2 kg" vs "2kg" vs "2 kilogrammes")
- Absence d'alternatives pour les synonymes

---

## 3. Recherche : Bonnes pratiques pédagogiques

### 3.1 Principes validés par la recherche (2024)

Sources : [Third Space Learning](https://thirdspacelearning.com/blog/spaced-repetition/), [Frontiers in Medicine 2025](https://www.frontiersin.org/journals/medicine/articles/10.3389/fmed.2025.1601614/full), [BMC Medical Education 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11186069/)

#### Active Recall (Rappel actif)

> "Active recall is the process of retrieving information from long-term memory in the absence of any cues."

**Implication pour les cartes** :
- La question doit forcer la réflexion, pas la reconnaissance
- Éviter les questions fermées trop simples (oui/non sans réflexion)
- Préférer "Quelle est..." à "Est-ce que..."

#### Spacing Effect (Effet d'espacement)

Intervalles optimaux validés : **1 jour → 3 jours → 7 jours → 14 jours**

**Implication** : Le système Leitner implémenté est conforme à la recherche.

#### Chunking (Découpage)

> "Focus on quality over quantity by using small, manageable chunks of information."

**Implication** :
- UNE information par carte
- Pas de questions multi-parties
- Réponses de 1-3 mots maximum

#### Interleaving (Entrelacement)

> "Swapping the order of flashcards in each session is advisable to avoid developing memory patterns based on sequence."

**Implication** : L'option `sequential: false` est la bonne valeur par défaut.

### 3.2 Étude comparative : AI + Curation manuelle

[Brainscape Research](https://www.brainscape.com/) conclut :

> "The best flashcard creation technique is using a combination of AI and manual curation. While AI can help make large quantities of flashcards quickly, it is important to rigorously check, edit, prune, append, and rearrange the content."

**Implication** : Notre approche (génération + édition) est correcte, mais nous devons :
1. Faciliter la curation post-génération
2. Signaler les cartes à vérifier
3. Suggérer des améliorations automatiques

### 3.3 Taxonomie de Bloom pour les objectifs

| Niveau | Verbes | Type de carte adapté |
|--------|--------|---------------------|
| Mémoriser | Définir, lister, nommer | Texte simple, QCM |
| Comprendre | Expliquer, résumer | Texte avec feedback |
| Appliquer | Calculer, utiliser | Numérique, cloze |
| Analyser | Comparer, différencier | QCM complexe |
| Évaluer | Juger, critiquer | Vrai/Faux avec justification |
| Créer | Concevoir, produire | Hors scope flashcards |

---

## 4. Propositions d'amélioration

### 4.1 Anti-hallucination : Système de validation factuelle

#### Proposition A : Contrainte de sourcing

```yaml
# Dans le prompt, exiger pour chaque carte :
verification:
  source: "Manuel Hachette 6ème, p.42"  # ou "Consensus scientifique"
  confidence: "verified"  # verified | needs_check | uncertain
```

**Avantages** :
- Force le LLM à s'appuyer sur des sources
- Permet à l'utilisateur de vérifier
- Identifie les cartes à risque

**Inconvénients** :
- Alourdit le format
- LLM peut inventer des sources

#### Proposition B : Questions factuelles uniquement sur demande

Catégoriser les types de contenu :

| Type | Risque hallucination | Stratégie |
|------|---------------------|-----------|
| **Définitions** | Faible | Acceptable |
| **Dates/chiffres** | Élevé | Exiger source OU éviter |
| **Noms propres** | Moyen | Vérification croisée |
| **Formules/calculs** | Faible (vérifiable) | Acceptable |
| **Citations** | Très élevé | Éviter sauf source fournie |

#### Proposition C : Mode "Source fournie"

Nouveau champ dans le formulaire :

```javascript
sourceDocument: {
  id: 'sourceDocument',
  label: 'Document source (copier-coller le contenu)',
  type: 'textarea',
  help: 'Le LLM créera des cartes UNIQUEMENT à partir de ce texte'
}
```

**Avantage majeur** : Élimine les hallucinations car le LLM ne fait qu'extraire.

### 4.2 Pertinence des questions : Templates par domaine

#### Templates spécialisés

```javascript
const DOMAIN_TEMPLATES = {
  'maths': {
    questionPatterns: [
      "Calculer : {expression}",
      "Simplifier : {expression}",
      "Résoudre : {equation}",
      "Quelle est la formule de {concept} ?"
    ],
    avoidPatterns: [
      "Qui a inventé {concept} ?",  // Risque hallucination
      "En quelle année {event} ?"   // Risque hallucination
    ],
    mediaOpportunities: [
      "Graphiques de fonctions",
      "Figures géométriques",
      "Diagrammes d'ensembles"
    ]
  },
  'histoire': {
    questionPatterns: [
      "Quelle est la cause principale de {event} ?",
      "Quelles sont les conséquences de {event} ?",
      "Qui était {person} ?"
    ],
    requiredFields: ['source'],  // Dates = source obligatoire
    avoidPatterns: [
      "Citez une phrase de {person}"  // Risque invention
    ]
  },
  'langues': {
    questionPatterns: [
      "Traduire : {word}",
      "Conjuguer {verb} au {tense}",
      "Quel est le pluriel de {noun} ?"
    ],
    mediaOpportunities: [
      "Illustrations pour vocabulaire concret"
    ]
  }
};
```

### 4.3 Génération de médias pertinents

#### Proposition : Génération SVG inline

Pour certains domaines, générer des SVG directement :

```yaml
# Exemple pour une carte de géométrie
- id: "geo_triangle"
  question: "Quelle est l'aire d'un triangle de base 6 et hauteur 4 ?"
  answer: 12
  type: numeric
  media:
    type: "image"
    format: "svg"
    data: |
      <svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
        <polygon points="10,70 90,70 50,10" fill="none" stroke="#8b5cf6" stroke-width="2"/>
        <text x="50" y="80" text-anchor="middle" font-size="10">b = 6</text>
        <line x1="50" y1="10" x2="50" y2="70" stroke="#22c55e" stroke-dasharray="4"/>
        <text x="55" y="40" font-size="10">h = 4</text>
      </svg>
```

#### Règles de génération de médias

| Domaine | Quand générer | Quand éviter |
|---------|--------------|--------------|
| Maths/Géométrie | Figures, graphiques | Portraits, photos |
| Sciences | Schémas, diagrammes | Photos réalistes |
| Géographie | Cartes simplifiées | Photos satellite |
| Langues | Illustrations objets | Scènes complexes |
| Histoire | Frises chronologiques | Photos/peintures |

#### Prompt pour génération SVG

```markdown
## Médias SVG (quand pertinent)

Pour les cartes où un schéma SIMPLE améliorerait la compréhension,
générer un SVG inline avec ces contraintes :
- Viewbox : 100x100 ou 200x100 (paysage)
- Couleurs : utiliser les variables du thème (#8b5cf6 violet, #22c55e vert, #f97316 orange)
- Style : minimaliste, lignes simples, pas de texte complexe
- Taille : < 2KB par SVG

Types de SVG appropriés :
- Figures géométriques avec annotations
- Graphiques simples (axes, courbes)
- Diagrammes de flux (max 5 éléments)
- Schémas scientifiques basiques (atomes, circuits simples)

NE PAS générer de SVG pour :
- Portraits ou représentations humaines
- Paysages ou scènes complexes
- Tout ce qui nécessiterait une photo
```

### 4.4 Format de réponse optimal

#### Règles strictes pour les réponses

```markdown
## Format des réponses (CRITIQUE)

### Règle 1 : Longueur maximale
- Réponse principale : 1-3 mots MAXIMUM
- Exception : formules mathématiques courtes

### Règle 2 : Pas d'article/préposition
❌ "La capitale est Paris" → ✅ "Paris"
❌ "Il s'agit de l'oxygène" → ✅ "oxygène" ou "O₂"

### Règle 3 : Format numérique strict
- Nombres sans unité dans `answer`
- Unité précisée dans la question
- Ex: "Combien font 2+2 ?" → answer: 4 (pas "4 unités")

### Règle 4 : Alternatives OBLIGATOIRES
Pour TOUTE réponse texte, prévoir :
- Avec/sans majuscule
- Avec/sans accent
- Abréviations courantes
- Synonymes principaux

Exemple :
answer: "Organisation des Nations Unies"
alternatives:
  - "ONU"
  - "Nations Unies"
  - "UN"
  - "United Nations"
```

### 4.5 Exemples de cartes BONNES vs MAUVAISES

#### À inclure dans le prompt

```markdown
## Exemples de cartes

### ✅ BONNE carte (texte)
```yaml
- id: "hist_001"
  question: "Quel événement marque le début de la Révolution française ?"
  answer: "Prise de la Bastille"
  alternatives:
    - "prise de la Bastille"
    - "14 juillet 1789"
    - "Bastille"
  hint: "Un bâtiment symbole de l'absolutisme royal"
  feedback: "Le 14 juillet 1789, la prise de la Bastille symbolise la révolte du peuple contre la monarchie absolue."
```

### ❌ MAUVAISE carte (texte)
```yaml
# Problèmes : réponse trop longue, pas d'alternatives, question vague
- id: "hist_001"
  type: "text"  # Inutile, c'est le défaut
  question: "Parlez de la Révolution française"
  answer: "La Révolution française est un événement majeur qui a commencé en 1789 avec la prise de la Bastille"
```

### ✅ BONNE carte (numérique)
```yaml
- id: "math_001"
  question: "Calculer : 7 × 8"
  type: "numeric"
  answer: 56
  feedback: "7 × 8 = 56. Astuce : 7×8 = 56 (5, 6, 7, 8 se suivent)"
```

### ❌ MAUVAISE carte (numérique)
```yaml
# Problèmes : type non spécifié, réponse avec texte
- id: "math_001"
  question: "7 fois 8 égale combien ?"
  answer: "56 unités"
```

### ✅ BONNE carte (QCM)
```yaml
- id: "bio_001"
  question: "Quel organe produit l'insuline ?"
  type: "mcq"
  choices:
    - id: A
      text: "Foie"
    - id: B
      text: "Pancréas"
    - id: C
      text: "Rein"
    - id: D
      text: "Rate"
  answer: "B"
  feedback: "Le pancréas contient les îlots de Langerhans qui sécrètent l'insuline."
```

### ❌ MAUVAISE carte (QCM)
```yaml
# Problèmes : distracteurs évidents, answer mal formaté
- id: "bio_001"
  question: "L'insuline est produite par :"
  type: "mcq"
  choices:
    - id: A
      text: "La pizza"  # Absurde
    - id: B
      text: "Le pancréas"
    - id: C
      text: "La voiture"  # Absurde
  answer: "Le pancréas"  # Devrait être "B"
```
```

---

## 5. Architecture proposée

### 5.1 Pipeline de génération en 3 phases

```
┌─────────────────────────────────────────────────────────────┐
│                    PHASE 1 : PRÉPARATION                    │
├─────────────────────────────────────────────────────────────┤
│  1. Sélection du template de domaine                        │
│  2. Détection des risques d'hallucination                   │
│  3. Identification des opportunités médias                  │
│  4. Génération du prompt optimisé                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    PHASE 2 : GÉNÉRATION                     │
├─────────────────────────────────────────────────────────────┤
│  1. Appel LLM avec prompt structuré                         │
│  2. Parsing du résultat YAML/JSON                           │
│  3. Validation syntaxique                                   │
│  4. Génération SVG si applicable                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    PHASE 3 : VALIDATION                     │
├─────────────────────────────────────────────────────────────┤
│  1. Vérification longueur réponses                          │
│  2. Vérification présence alternatives                      │
│  3. Scoring qualité pédagogique                             │
│  4. Marquage des cartes à risque                            │
│  5. Suggestions d'amélioration                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Système de scoring des cartes

```javascript
const QUALITY_CRITERIA = {
  // Critères obligatoires (0 ou 1)
  hasValidFormat: { weight: 1, required: true },
  hasShortAnswer: { weight: 1, required: true },  // ≤ 3 mots

  // Critères de qualité (0 à 1)
  hasAlternatives: { weight: 0.8 },      // Pour type text
  hasFeedback: { weight: 0.6 },
  hasHint: { weight: 0.4 },
  hasMedia: { weight: 0.5 },             // Quand pertinent
  noHallucinationRisk: { weight: 1.0 },  // Évalué par heuristiques

  // Score final
  // requiredScore = 2/2 obligatoire
  // qualityScore = somme pondérée / somme poids
  // finalScore = qualityScore si requiredScore == 100%
};
```

### 5.3 Détection de risque d'hallucination

```javascript
const HALLUCINATION_PATTERNS = [
  // Dates spécifiques sans source
  /\b(en|le|année)\s+\d{3,4}\b/i,

  // Citations directes
  /"[^"]{20,}"/,

  // Noms propres peu connus
  // (comparer avec liste de noms connus)

  // Statistiques précises
  /\d+([.,]\d+)?%/,
  /\d+\s*(millions?|milliards?)/i,

  // Affirmations absolues
  /toujours|jamais|tous les|aucun/i,
];

function assessHallucinationRisk(card) {
  let risk = 0;
  const text = `${card.question} ${card.answer}`;

  HALLUCINATION_PATTERNS.forEach(pattern => {
    if (pattern.test(text)) risk += 0.2;
  });

  return Math.min(risk, 1); // 0 = safe, 1 = high risk
}
```

---

## 6. Plan d'implémentation

### Phase 1 : Améliorations du prompt (Priorité haute) ✅ COMPLÉTÉE

- [x] **1.1** Ajouter section "Exemples BONS vs MAUVAIS" dans le prompt (`CARD_EXAMPLES`)
- [x] **1.2** Renforcer les règles de format de réponse (`responseFormat` dans templates)
- [x] **1.3** Ajouter contraintes anti-hallucination (`HALLUCINATION_PATTERNS`, `avoidPatterns`)
- [x] **1.4** Créer templates par domaine (maths, langues, histoire, sciences, géographie)
- [x] **1.5** Implémenter Chain-of-Verification (CoVe) - vérification en 3 étapes (2024-12-14)

### Phase 2 : Génération de médias SVG (Priorité moyenne) ✅ COMPLÉTÉE

- [x] **2.1** Identifier les domaines éligibles aux SVG (`svgOpportunities` dans templates)
- [x] **2.2** Ajouter instructions SVG au prompt (`_generateSvgSection`)
- [x] **2.3** Valider le rendu SVG dans l'application (support `media.format: svg`)
- [ ] **2.4** Créer bibliothèque de SVG templates (optionnel)

### Phase 3 : Validation post-génération (Priorité haute) - PARTIELLE

- [x] **3.1** Vérification dans le prompt (règles strictes, CoVe)
- [x] **3.2** Vérification présence alternatives dans prompt
- [ ] **3.3** Implémenter scoring qualité côté client
- [ ] **3.4** Ajouter marqueurs visuels pour cartes à risque

### Phase 4 : Mode "Source fournie" (Priorité moyenne) ✅ COMPLÉTÉE

- [x] **4.1** Ajouter champ document source au formulaire (`sourceDocument`)
- [x] **4.2** Adapter le prompt pour extraction pure (`_generateSourceDocumentSection`)
- [x] **4.3** Instructions pour utiliser UNIQUEMENT le contenu source

### Phase 5 : Amélioration UX éditeur (Priorité basse) - EN COURS

- [ ] **5.1** Suggestions automatiques d'alternatives
- [ ] **5.2** Auto-complétion basée sur la taxonomie
- [ ] **5.3** Prévisualisation du rendu en temps réel

### Phase 6 : Support des formats de cartes (Ajouté 2024-12-14)

- [x] **6.1** Support format cloze Anki-style `{{mot}}` dans le renderer
- [x] **6.2** Validation des cartes cloze avec format simple
- [x] **6.3** Support des alternatives dans les blanks cloze

---

## Annexes

### A. Ressources de recherche

- [Third Space Learning - Spaced Repetition](https://thirdspacelearning.com/blog/spaced-repetition/)
- [Frontiers in Medicine 2025 - Spaced Repetition Study](https://www.frontiersin.org/journals/medicine/articles/10.3389/fmed.2025.1601614/full)
- [BMC Medical Education 2024](https://pmc.ncbi.nlm.nih.gov/articles/PMC11186069/)
- [Brainscape Research](https://www.brainscape.com/)
- [Meta Research - Chain-of-Verification 2024](https://arxiv.org/abs/2309.11495) - Réduction hallucinations ~23%
- [NotebookLM - Source-grounded generation](https://notebooklm.google/) - Approche anti-hallucination

### B. Métriques de succès

| Métrique | Objectif | Mesure |
|----------|----------|--------|
| Taux de cartes valides | > 95% | Cartes passant la validation |
| Longueur moyenne réponse | ≤ 3 mots | Moyenne post-génération |
| Couverture alternatives | > 80% | % cartes texte avec alternatives |
| Risque hallucination | < 10% | % cartes marquées "à vérifier" |
| Satisfaction utilisateur | > 4/5 | Feedback après utilisation |

### C. Prochaines étapes recommandées

1. ~~**Immédiat** : Améliorer le prompt avec exemples et règles strictes~~ ✅
2. **Court terme** : Implémenter scoring qualité côté client
3. ~~**Moyen terme** : Ajouter la génération SVG pour maths/sciences~~ ✅
4. ~~**Long terme** : Mode "source fournie" anti-hallucination~~ ✅

---

*Document créé le 2024-12-04*
*Dernière mise à jour : 2024-12-14 (Chain-of-Verification, support cloze Anki-style)*
