# PromptLearner v2.0 - Documentation

## Vue d'ensemble

Le module **PromptLearner** est un système d'apprentissage intelligent qui analyse les decks générés par LLM pour améliorer progressivement la qualité des prompts. La version 2.0 apporte des améliorations majeures en termes d'analyse, de suggestions et de partage des connaissances.

## Nouvelles fonctionnalités v2.0

### 1. Catégorisation avancée des erreurs

Les erreurs sont maintenant classées en 5 catégories :

| Catégorie | Description | Exemples |
|-----------|-------------|----------|
| `format` | Erreurs de structure YAML, IDs manquants | `CARD_ID_MISSING`, `QUESTION_MISSING` |
| `content` | Erreurs de contenu (réponse manquante, QCM mal formé) | `MCQ_INVALID_ANSWER`, `BOOLEAN_INVALID_ANSWER` |
| `pedagogy` | Problèmes pédagogiques | `ANSWER_TOO_LONG`, `NO_ALTERNATIVES` |
| `quality` | Qualité (lisibilité, hallucinations, risque factuel) | `HALLUCINATION_DATE`, `READABILITY_MISMATCH` |
| `duplication` | Doublons | `DUPLICATES` |

### 2. Analyse détaillée des patterns d'erreurs

```javascript
const analysis = PromptLearner.getErrorAnalysis('maths');

console.log(analysis);
// {
//   domain: 'maths',
//   totalSessions: 12,
//   totalErrors: 45,
//   uniqueErrorTypes: 8,
//   topErrors: [
//     {
//       code: 'MCQ_ANSWER_IS_TEXT',
//       count: 15,
//       category: 'content',
//       description: 'Réponse QCM est le texte au lieu de l\'ID',
//       percentage: 125  // 15 erreurs sur 12 sessions
//     },
//     // ...
//   ],
//   recurrentErrors: [
//     {
//       code: 'ANSWER_TOO_LONG',
//       count: 8,
//       frequency: 67,  // Présent dans 67% des sessions
//       category: 'pedagogy',
//       description: 'Réponse trop longue'
//     }
//   ],
//   categoryDistribution: {
//     content: {
//       total: 20,
//       percentage: 44,
//       topErrors: [...]
//     },
//     pedagogy: { ... },
//     quality: { ... }
//   },
//   trend: {
//     direction: 'improving',  // 'improving' | 'stable' | 'degrading'
//     change: -15,  // -15% d'erreurs
//     recentAvg: 2.8,
//     previousAvg: 3.3
//   }
// }
```

### 3. Suggestions contextuelles intelligentes

```javascript
const suggestions = PromptLearner.getSuggestions('maths', 5);

console.log(suggestions);
// [
//   {
//     type: 'prompt_addition',
//     text: '⚠️ IMPORTANT pour les QCM : `answer` doit être l\'ID...',
//     example: 'answer: "B"  # Correct\nanswer: "Paris"  # INCORRECT',
//     category: 'content',
//     priority: 'high',  // 'high' | 'medium' | 'low'
//     frequency: 125,
//     errorCode: 'MCQ_ANSWER_IS_TEXT'
//   },
//   // ... suggestions triées par priorité et fréquence
// ]
```

**Adaptation au domaine** : Les suggestions sont automatiquement adaptées au contexte :
- **Maths** : Réponses numériques précises
- **Histoire** : Vérification des dates et noms propres
- **Géographie** : Orthographe des lieux, alternatives
- **Langues** : Synonymes et variantes
- **Sciences** : Nomenclature technique

### 4. Analyse de tendance de qualité

```javascript
const trend = PromptLearner.getQualityTrend(10);  // 10 dernières sessions

console.log(trend);
// {
//   trend: 'improving',  // 'improving' | 'stable' | 'degrading' | 'insufficient_data'
//   sessions: [
//     {
//       sessionId: 'session_123',
//       date: '2025-12-05T10:00:00Z',
//       domain: 'maths',
//       score: 72,
//       iterations: 2,
//       improved: true,
//       improvement: 12  // +12 points entre première et dernière itération
//     },
//     // ...
//   ],
//   averageScore: 68,
//   averageIterations: 2.3,
//   improvementRate: 80,  // 80% des sessions se sont améliorées
//   overallImprovement: 15,  // +15 points entre début et fin de période
//   domainAverages: {
//     maths: 72,
//     histoire: 65,
//     géographie: 70
//   },
//   recommendation: 'Bonne progression ! Continuez à affiner les prompts.'
// }
```

**Recommandations générées** :
- Dégradation détectée → Revoir les consignes de base
- Score moyen faible → Ajouter plus de contraintes et exemples
- Trop d'itérations → Renforcer les consignes initiales
- Progression positive → Continuer dans cette voie

### 5. Export / Import de l'apprentissage

#### Export

```javascript
const jsonData = PromptLearner.exportLearning();

// Télécharger le fichier
const blob = new Blob([jsonData], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `prompt-learning-${new Date().toISOString()}.json`;
a.click();
```

#### Import (Écraser)

```javascript
const result = PromptLearner.importLearning(jsonData, { overwrite: true });

console.log(result);
// {
//   success: true,
//   sessionsImported: 45,
//   mode: 'overwrite',
//   message: '45 sessions importées avec succès'
// }
```

#### Import (Fusionner)

```javascript
const result = PromptLearner.importLearning(jsonData, { merge: true });

console.log(result);
// {
//   success: true,
//   sessionsImported: 20,
//   mode: 'merge',
//   message: '20 sessions fusionnées avec succès'
// }
```

**Cas d'usage** :
- **Partage entre utilisateurs** : Partager l'expérience accumulée
- **Sauvegarde** : Backup régulier des données d'apprentissage
- **Transfert** : Migrer les données entre navigateurs/machines
- **Collaboration** : Fusionner les apprentissages de plusieurs utilisateurs

### 6. Reset sélectif par domaine

```javascript
const result = PromptLearner.resetDomain('maths');

console.log(result);
// {
//   success: true,
//   domain: 'maths',
//   sessionsDeleted: 12,
//   sessionsRemaining: 33,
//   message: 'Domaine "maths" réinitialisé (12 sessions supprimées)'
// }
```

**Quand utiliser** :
- Changement majeur dans la stratégie de prompt pour un domaine
- Nettoyage des données d'apprentissage obsolètes
- Réinitialisation après tests

## API Complète

### Session Management

```javascript
// Démarrer une session
const session = PromptLearner.startSession({
  domain: 'maths',
  topic: 'additions',
  count: 10,
  difficulty: 1,
  cardTypes: ['text', 'numeric']
});

// Enregistrer une itération (après validation)
const iteration = PromptLearner.recordIteration(validationReport, deck);

// Terminer la session
PromptLearner.endSession(imported: true);  // true si deck importé

// Obtenir la session en cours
const currentSession = PromptLearner.getCurrentSession();
```

### Analyse des erreurs

```javascript
// Analyse globale ou par domaine
const analysis = PromptLearner.getErrorAnalysis(domain?);

// Top erreurs (compatibilité v1)
const topErrors = PromptLearner.getTopErrors(limit = 10);

// Comparaison d'itérations
const diff = PromptLearner.compareIterations(iteration1, iteration2);
```

### Suggestions

```javascript
// Suggestions contextuelles
const suggestions = PromptLearner.getSuggestions(domain?, limit = 5);

// Améliorations de prompt (v1 - toujours compatible)
const improvements = PromptLearner.getPromptImprovements(domain?);

// Générer section d'amélioration pour le prompt
const enhancement = PromptLearner.generatePromptEnhancement(domain?);
```

### Tendances

```javascript
// Analyse de tendance de qualité
const trend = PromptLearner.getQualityTrend(sessionCount = 10);
```

### Données

```javascript
// Export
const jsonData = PromptLearner.exportLearning();

// Import
const result = PromptLearner.importLearning(jsonData, {
  merge: false,      // Fusionner avec existant (défaut: false)
  overwrite: true    // Écraser existant (défaut: true)
});

// Reset domaine
const result = PromptLearner.resetDomain(domain);

// Reset complet
PromptLearner.reset();

// Statistiques globales (v1 - compatibilité)
const stats = PromptLearner.getStats();
```

## Intégration avec DeckValidator

Le PromptLearner v2 est pleinement intégré avec le module DeckValidator pour :

1. **Détection d'hallucinations** : Les warnings d'hallucination sont catégorisés comme erreurs `quality`
2. **Analyse de lisibilité** : Les problèmes de lisibilité sont trackés
3. **Risque factuel** : Les contenus à vérifier sont identifiés

```javascript
// Le rapport DeckValidator est automatiquement analysé
const report = DeckValidator.validateDeck(deck);
PromptLearner.recordIteration(report, deck);

// Les erreurs de qualité sont maintenant détectées :
// - HALLUCINATION_DATE
// - HALLUCINATION_PERCENTAGE
// - HALLUCINATION_STATISTIC
// - HALLUCINATION_QUOTE
// - HALLUCINATION_PROPER_NOUN
// - HALLUCINATION_ABSOLUTE
// - READABILITY_MISMATCH
```

## Migration depuis v1

Les données de la version 1 sont **automatiquement migrées** vers la version 2 lors du premier chargement.

**Changements** :
- Ajout du champ `errorsByCategory`
- Ajout du champ `qualityTrends`
- Mise à jour de `version: 2`

**Compatibilité** :
- ✅ Toutes les méthodes v1 sont maintenues
- ✅ La structure de données v1 est compatible
- ✅ Pas de perte de données

## Exemples d'utilisation

### Workflow complet de génération

```javascript
// 1. Démarrer la session
PromptLearner.startSession({
  domain: 'histoire',
  topic: 'Révolution française',
  count: 20,
  difficulty: 3
});

// 2. Générer le prompt avec amélioration
const basePrompt = PromptGenerator.generatePrompt(formData);
const enhancement = PromptLearner.generatePromptEnhancement('histoire');
const finalPrompt = basePrompt + '\n' + enhancement;

// → Copier finalPrompt dans ChatGPT/Claude

// 3. Valider le YAML généré
const deck = YAML.parse(yamlFromLLM);
const report = DeckValidator.validateDeck(deck);

// 4. Enregistrer l'itération
PromptLearner.recordIteration(report, deck);

// 5. Si des erreurs, générer prompt de correction
if (!report.isValid) {
  const correctionPrompt = DeckValidator.generateCorrectionPrompt(deck, report);
  // → Corriger avec LLM
  // → Répéter étapes 3-5
}

// 6. Terminer la session
if (imported) {
  PromptLearner.endSession(true);
}
```

### Analyse périodique de la qualité

```javascript
// Dashboard de qualité
function generateQualityDashboard() {
  const trend = PromptLearner.getQualityTrend(20);
  const allDomainsAnalysis = PromptLearner.getErrorAnalysis();

  console.log(`📊 Tendance générale : ${trend.trend}`);
  console.log(`📈 Score moyen : ${trend.averageScore}%`);
  console.log(`📉 Évolution : ${trend.overallImprovement > 0 ? '+' : ''}${trend.overallImprovement} points`);

  console.log('\n🎯 Par domaine :');
  for (const [domain, avg] of Object.entries(trend.domainAverages)) {
    console.log(`  - ${domain} : ${avg}%`);
  }

  console.log('\n⚠️ Erreurs les plus fréquentes :');
  for (const error of allDomainsAnalysis.topErrors.slice(0, 5)) {
    console.log(`  - ${error.description} (${error.count}×, ${error.percentage}%)`);
  }

  console.log(`\n💡 Recommandation : ${trend.recommendation}`);
}
```

### Export automatique hebdomadaire

```javascript
// Sauvegarder automatiquement chaque semaine
function autoBackup() {
  const jsonData = PromptLearner.exportLearning();
  const parsed = JSON.parse(jsonData);

  if (parsed.sessions.length > 0) {
    const blob = new Blob([jsonData], { type: 'application/json' });
    const filename = `learning-backup-${new Date().toISOString().slice(0, 10)}.json`;

    // Sauvegarder via download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    console.log(`✅ Backup créé : ${parsed.sessions.length} sessions sauvegardées`);
  }
}

// Exécuter chaque semaine
setInterval(autoBackup, 7 * 24 * 60 * 60 * 1000);
```

## Performance

### Optimisations v2

- **Calculs cachés** : Les tendances sont calculées à la demande
- **Indexation** : Les erreurs sont indexées par catégorie
- **Limite de stockage** : Max 50 sessions gardées (configurable)
- **Migration lazy** : Migration v1→v2 uniquement si nécessaire

### Limites

- **localStorage** : ~5-10MB max selon navigateur
- **Sessions** : Max 50 conservées (auto-nettoyage)
- **Export** : Pas de limite (fichier JSON)

## Considérations de sécurité

1. **Données sensibles** : Ne pas inclure d'informations personnelles dans les decks
2. **Partage** : Vérifier le contenu avant de partager un export
3. **Import** : Valider la source avant d'importer des données

## Support et migration

### Version actuelle
- **v2.0** : Toutes les nouvelles fonctionnalités
- **Compatibilité** : v1 entièrement supportée

### Roadmap future
- v2.1 : Intégration ML pour prédiction de qualité
- v2.2 : Suggestions de prompt générées automatiquement
- v3.0 : Synchronisation cloud optionnelle

## Troubleshooting

### Erreur "Version incompatible"

**Cause** : Import de données d'une version future

**Solution** : Mettre à jour le module vers la version requise

### Erreur "localStorage quota exceeded"

**Cause** : Trop de données stockées

**Solutions** :
1. Exporter les données
2. Réinitialiser un domaine peu utilisé : `PromptLearner.resetDomain('old-domain')`
3. Reset complet : `PromptLearner.reset()`

### Perte de données après migration

**Cause** : Impossible (migration non destructive)

**Vérification** :
```javascript
const data = PromptLearner._loadData();
console.log('Version:', data.version);
console.log('Sessions:', data.sessions.length);
```

## Ressources

- **Code source** : `/src/modules/prompt-learner.js`
- **Tests** : `/tests/prompt-learner.test.js`
- **Intégration UI** : `/src/ui/page-prompt-generator.js`
- **DeckValidator** : `/src/modules/deck-validator.js`

---

**Version** : 2.0
**Dernière mise à jour** : 2025-12-12
**Auteur** : Claude Code Agent
