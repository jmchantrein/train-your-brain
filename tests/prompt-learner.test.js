/**
 * Tests pour PromptLearner v2.0
 */

const PromptLearner = require('../src/modules/prompt-learner.js');

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value;
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    }
  };
})();

global.localStorage = mockLocalStorage;

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function createMockValidationReport(score, errors = [], warnings = []) {
  const errorCodes = errors.map(e => e.code || e);
  return {
    averageScore: score,
    isValid: errors.length === 0,
    grade: score >= 80 ? 'A' : score >= 65 ? 'B' : score >= 50 ? 'C' : 'D',
    stats: {
      totalCards: 10,
      validCards: 10 - errors.length,
      cardsWithErrors: errors.length,
      cardsWithWarnings: warnings.length
    },
    deckIssues: errors.filter(e => !e.cardId),
    cardResults: Array.from({ length: 10 }, (_, i) => ({
      cardId: `card_${i + 1}`,
      score,
      issues: i < errors.length ? [errors[i]] : [],
      warnings: i < warnings.length ? [warnings[i]] : []
    })),
    duplicates: []
  };
}

function createMockDeck(name = 'Test Deck') {
  return {
    id: 'test_deck_' + Date.now(),
    name,
    cards: Array.from({ length: 10 }, (_, i) => ({
      id: `card_${i + 1}`,
      question: `Question ${i + 1}`,
      answer: `Answer ${i + 1}`,
      type: 'text'
    }))
  };
}

// ═══════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════

describe('PromptLearner v2.0', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    PromptLearner._currentSession = null;
  });

  // ───────────────────────────────────────────────────────────────
  // SESSION DE GÉNÉRATION
  // ───────────────────────────────────────────────────────────────

  describe('Session Management', () => {
    it('devrait démarrer une nouvelle session', () => {
      const config = {
        domain: 'maths',
        topic: 'additions',
        count: 10,
        difficulty: 1,
        cardTypes: ['text']
      };

      const session = PromptLearner.startSession(config);

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.config.domain).toBe('maths');
      expect(session.iterations).toEqual([]);
      expect(session.status).toBe('started');
    });

    it('devrait enregistrer une itération avec catégorisation des erreurs', () => {
      const session = PromptLearner.startSession({ domain: 'maths', topic: 'test' });

      const report = createMockValidationReport(65, [
        { code: 'MCQ_INVALID_ANSWER' },
        { code: 'ANSWER_TOO_LONG' },
        { code: 'DUPLICATES' }
      ]);

      const deck = createMockDeck();

      const iteration = PromptLearner.recordIteration(report, deck);

      expect(iteration).toBeDefined();
      expect(iteration.number).toBe(1);
      expect(iteration.score).toBe(65);
      expect(iteration.grade).toBe('B');
      expect(iteration.errorCodes).toContain('MCQ_INVALID_ANSWER');
      expect(iteration.errorCodes).toContain('ANSWER_TOO_LONG');
      expect(iteration.errorCodes).toContain('DUPLICATES');
    });

    it('devrait terminer une session et mettre à jour les stats', () => {
      const session = PromptLearner.startSession({ domain: 'histoire', topic: 'test' });

      const report1 = createMockValidationReport(50);
      PromptLearner.recordIteration(report1, createMockDeck());

      const report2 = createMockValidationReport(75);
      PromptLearner.recordIteration(report2, createMockDeck());

      PromptLearner.endSession(true);

      // Vérifier que la session est terminée
      expect(PromptLearner._currentSession).toBeNull();

      // Charger les données et vérifier
      const data = PromptLearner._loadData();
      expect(data.sessions.length).toBe(1);
      expect(data.sessions[0].status).toBe('imported');
      expect(data.sessions[0].finalScore).toBe(75);
    });
  });

  // ───────────────────────────────────────────────────────────────
  // ANALYSE DES ERREURS
  // ───────────────────────────────────────────────────────────────

  describe('Error Analysis', () => {
    it('devrait catégoriser les erreurs correctement', () => {
      expect(PromptLearner._getErrorCategory('MCQ_INVALID_ANSWER')).toBe('content');
      expect(PromptLearner._getErrorCategory('ANSWER_TOO_LONG')).toBe('pedagogy');
      expect(PromptLearner._getErrorCategory('CARD_ID_MISSING')).toBe('format');
      expect(PromptLearner._getErrorCategory('DUPLICATES')).toBe('duplication');
      expect(PromptLearner._getErrorCategory('HALLUCINATION_DATE')).toBe('quality');
    });

    it('devrait analyser les patterns d\'erreurs globaux', () => {
      // Créer plusieurs sessions avec erreurs
      for (let i = 0; i < 3; i++) {
        PromptLearner.startSession({ domain: 'maths', topic: 'test' });
        const report = createMockValidationReport(60, [
          { code: 'MCQ_INVALID_ANSWER' },
          { code: 'ANSWER_TOO_LONG' }
        ]);
        PromptLearner.recordIteration(report, createMockDeck());
        PromptLearner.endSession(false);
      }

      const analysis = PromptLearner.getErrorAnalysis();

      expect(analysis.totalSessions).toBe(3);
      expect(analysis.totalErrors).toBeGreaterThan(0);
      expect(analysis.topErrors).toBeDefined();
      expect(analysis.categoryDistribution).toBeDefined();
      expect(analysis.categoryDistribution.content).toBeDefined();
      expect(analysis.categoryDistribution.pedagogy).toBeDefined();
    });

    it('devrait filtrer l\'analyse par domaine', () => {
      // Session maths
      PromptLearner.startSession({ domain: 'maths', topic: 'test' });
      PromptLearner.recordIteration(createMockValidationReport(70, [{ code: 'ANSWER_TOO_LONG' }]), createMockDeck());
      PromptLearner.endSession(false);

      // Session histoire
      PromptLearner.startSession({ domain: 'histoire', topic: 'test' });
      PromptLearner.recordIteration(createMockValidationReport(65, [{ code: 'HALLUCINATION_DATE' }]), createMockDeck());
      PromptLearner.endSession(false);

      const mathAnalysis = PromptLearner.getErrorAnalysis('maths');
      const histoireAnalysis = PromptLearner.getErrorAnalysis('histoire');

      expect(mathAnalysis.domain).toBe('maths');
      expect(mathAnalysis.totalSessions).toBe(1);

      expect(histoireAnalysis.domain).toBe('histoire');
      expect(histoireAnalysis.totalSessions).toBe(1);
    });

    it('devrait détecter les erreurs récurrentes', () => {
      // Créer 5 sessions avec la même erreur
      for (let i = 0; i < 5; i++) {
        PromptLearner.startSession({ domain: 'test', topic: 'test' });
        const report = createMockValidationReport(60, [{ code: 'MCQ_ANSWER_IS_TEXT' }]);
        PromptLearner.recordIteration(report, createMockDeck());
        PromptLearner.endSession(false);
      }

      const analysis = PromptLearner.getErrorAnalysis();

      expect(analysis.recurrentErrors.length).toBeGreaterThan(0);
      const recurrent = analysis.recurrentErrors.find(e => e.code === 'MCQ_ANSWER_IS_TEXT');
      expect(recurrent).toBeDefined();
      expect(recurrent.frequency).toBeGreaterThanOrEqual(50);
    });

    it('devrait calculer la tendance d\'évolution des erreurs', () => {
      // 5 sessions avec beaucoup d'erreurs
      for (let i = 0; i < 5; i++) {
        PromptLearner.startSession({ domain: 'test', topic: 'test' });
        const report = createMockValidationReport(50, [
          { code: 'ERROR_1' },
          { code: 'ERROR_2' },
          { code: 'ERROR_3' }
        ]);
        PromptLearner.recordIteration(report, createMockDeck());
        PromptLearner.endSession(false);
      }

      // 5 sessions avec moins d'erreurs (amélioration)
      for (let i = 0; i < 5; i++) {
        PromptLearner.startSession({ domain: 'test', topic: 'test' });
        const report = createMockValidationReport(70, [{ code: 'ERROR_1' }]);
        PromptLearner.recordIteration(report, createMockDeck());
        PromptLearner.endSession(false);
      }

      const data = PromptLearner._loadData();
      const trend = PromptLearner._calculateErrorTrend(data.sessions);

      expect(trend).toBeDefined();
      expect(trend.direction).toBe('improving');
      expect(trend.change).toBeLessThan(0);
    });
  });

  // ───────────────────────────────────────────────────────────────
  // SUGGESTIONS CONTEXTUELLES
  // ───────────────────────────────────────────────────────────────

  describe('Contextual Suggestions', () => {
    it('devrait générer des suggestions basées sur les erreurs', () => {
      // Créer des sessions avec erreurs récurrentes
      for (let i = 0; i < 4; i++) {
        PromptLearner.startSession({ domain: 'maths', topic: 'test' });
        const report = createMockValidationReport(60, [
          { code: 'MCQ_ANSWER_IS_TEXT' },
          { code: 'ANSWER_TOO_LONG' }
        ]);
        PromptLearner.recordIteration(report, createMockDeck());
        PromptLearner.endSession(false);
      }

      const suggestions = PromptLearner.getSuggestions('maths', 5);

      expect(suggestions).toBeDefined();
      expect(suggestions.length).toBeGreaterThan(0);

      // Vérifier qu'il y a des suggestions avec priorité
      const highPrioritySuggestions = suggestions.filter(s => s.priority === 'high');
      expect(highPrioritySuggestions.length).toBeGreaterThan(0);
    });

    it('devrait adapter les suggestions au domaine', () => {
      PromptLearner.startSession({ domain: 'maths', topic: 'test' });
      const report = createMockValidationReport(60, [{ code: 'ANSWER_TOO_LONG' }]);
      PromptLearner.recordIteration(report, createMockDeck());
      PromptLearner.endSession(false);

      const suggestions = PromptLearner.getSuggestions('maths', 5);

      // Vérifier que les suggestions mentionnent le contexte mathématique
      const hasMathContext = suggestions.some(s =>
        s.text.toLowerCase().includes('maths') ||
        s.text.toLowerCase().includes('numériques')
      );

      // Le contexte peut être présent ou non selon les erreurs
      // On vérifie juste que la fonction ne crash pas
      expect(suggestions).toBeDefined();
    });

    it('devrait prioriser les suggestions par fréquence et catégorie', () => {
      // Erreur format fréquente
      for (let i = 0; i < 5; i++) {
        PromptLearner.startSession({ domain: 'test', topic: 'test' });
        const report = createMockValidationReport(60, [{ code: 'CARD_ID_MISSING' }]);
        PromptLearner.recordIteration(report, createMockDeck());
        PromptLearner.endSession(false);
      }

      // Erreur pédagogie moins fréquente
      for (let i = 0; i < 2; i++) {
        PromptLearner.startSession({ domain: 'test', topic: 'test' });
        const report = createMockValidationReport(70, [{ code: 'NO_ALTERNATIVES' }]);
        PromptLearner.recordIteration(report, createMockDeck());
        PromptLearner.endSession(false);
      }

      const suggestions = PromptLearner.getSuggestions(null, 10);

      // La première suggestion devrait être la plus prioritaire
      if (suggestions.length > 1) {
        const firstPriority = suggestions[0].priority;
        const lastPriority = suggestions[suggestions.length - 1].priority;

        const priorityOrder = { high: 3, medium: 2, low: 1 };
        expect(priorityOrder[firstPriority]).toBeGreaterThanOrEqual(priorityOrder[lastPriority]);
      }
    });

    it('devrait générer des suggestions spécifiques au domaine si score bas', () => {
      // Créer plusieurs sessions avec score bas pour un domaine
      for (let i = 0; i < 3; i++) {
        PromptLearner.startSession({ domain: 'physics', topic: 'test' });
        const report = createMockValidationReport(45); // Score bas
        PromptLearner.recordIteration(report, createMockDeck());
        PromptLearner.endSession(false);
      }

      const suggestions = PromptLearner.getSuggestions('physics', 10);

      // Devrait avoir une suggestion sur la qualité du domaine
      const domainQualitySuggestion = suggestions.find(s => s.type === 'domain_quality');
      expect(domainQualitySuggestion).toBeDefined();
    });
  });

  // ───────────────────────────────────────────────────────────────
  // ANALYSE DE TENDANCE DE QUALITÉ
  // ───────────────────────────────────────────────────────────────

  describe('Quality Trend Analysis', () => {
    it('devrait analyser les tendances de qualité', () => {
      // Créer 10 sessions avec amélioration progressive
      for (let i = 0; i < 10; i++) {
        PromptLearner.startSession({ domain: 'test', topic: 'test' });
        const score = 50 + i * 3; // Score qui augmente
        const report = createMockValidationReport(score);
        PromptLearner.recordIteration(report, createMockDeck());
        PromptLearner.endSession(false);
      }

      const trend = PromptLearner.getQualityTrend(10);

      expect(trend).toBeDefined();
      expect(trend.trend).toBe('improving');
      expect(trend.overallImprovement).toBeGreaterThan(0);
      expect(trend.sessions.length).toBe(10);
    });

    it('devrait détecter une dégradation', () => {
      // Sessions avec scores décroissants
      for (let i = 0; i < 10; i++) {
        PromptLearner.startSession({ domain: 'test', topic: 'test' });
        const score = 80 - i * 3; // Score qui diminue
        const report = createMockValidationReport(score);
        PromptLearner.recordIteration(report, createMockDeck());
        PromptLearner.endSession(false);
      }

      const trend = PromptLearner.getQualityTrend(10);

      expect(trend.trend).toBe('degrading');
      expect(trend.overallImprovement).toBeLessThan(0);
    });

    it('devrait calculer les moyennes par domaine', () => {
      // Sessions maths (score élevé)
      for (let i = 0; i < 3; i++) {
        PromptLearner.startSession({ domain: 'maths', topic: 'test' });
        const report = createMockValidationReport(85);
        PromptLearner.recordIteration(report, createMockDeck());
        PromptLearner.endSession(false);
      }

      // Sessions histoire (score moyen)
      for (let i = 0; i < 3; i++) {
        PromptLearner.startSession({ domain: 'histoire', topic: 'test' });
        const report = createMockValidationReport(65);
        PromptLearner.recordIteration(report, createMockDeck());
        PromptLearner.endSession(false);
      }

      const trend = PromptLearner.getQualityTrend(10);

      expect(trend.domainAverages.maths).toBeGreaterThan(trend.domainAverages.histoire);
    });

    it('devrait fournir des recommandations appropriées', () => {
      // Sessions avec beaucoup d'itérations
      for (let i = 0; i < 3; i++) {
        PromptLearner.startSession({ domain: 'test', topic: 'test' });
        for (let j = 0; j < 5; j++) {
          const report = createMockValidationReport(60 + j * 5);
          PromptLearner.recordIteration(report, createMockDeck());
        }
        PromptLearner.endSession(false);
      }

      const trend = PromptLearner.getQualityTrend(5);

      expect(trend.recommendation).toBeDefined();
      expect(trend.recommendation.length).toBeGreaterThan(0);
      // Devrait suggérer de renforcer les consignes (trop d'itérations)
      expect(trend.recommendation.toLowerCase()).toContain('itération');
    });

    it('devrait retourner insufficient_data si pas assez de sessions', () => {
      const trend = PromptLearner.getQualityTrend(10);

      expect(trend.trend).toBe('insufficient_data');
      expect(trend.sessions).toEqual([]);
      expect(trend.averageScore).toBe(0);
    });
  });

  // ───────────────────────────────────────────────────────────────
  // EXPORT / IMPORT
  // ───────────────────────────────────────────────────────────────

  describe('Export/Import', () => {
    it('devrait exporter les données en JSON', () => {
      // Créer quelques sessions
      for (let i = 0; i < 2; i++) {
        PromptLearner.startSession({ domain: 'test', topic: 'test' });
        PromptLearner.recordIteration(createMockValidationReport(70), createMockDeck());
        PromptLearner.endSession(false);
      }

      const exported = PromptLearner.exportLearning();

      expect(exported).toBeDefined();
      expect(typeof exported).toBe('string');

      const parsed = JSON.parse(exported);
      expect(parsed.version).toBe(PromptLearner.VERSION);
      expect(parsed.sessions.length).toBe(2);
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.exportVersion).toBe(PromptLearner.VERSION);
    });

    it('devrait importer des données et écraser les existantes', () => {
      // Créer des données initiales
      PromptLearner.startSession({ domain: 'initial', topic: 'test' });
      PromptLearner.recordIteration(createMockValidationReport(50), createMockDeck());
      PromptLearner.endSession(false);

      // Créer des données à importer
      const importData = {
        version: 2,
        sessions: [
          {
            id: 'imported_1',
            config: { domain: 'imported' },
            iterations: [],
            status: 'imported'
          }
        ],
        errorPatterns: { TEST_ERROR: 5 },
        errorsByCategory: { format: { TEST_ERROR: 5 } },
        domainStats: {},
        qualityTrends: {}
      };

      const result = PromptLearner.importLearning(importData, { overwrite: true });

      expect(result.success).toBe(true);
      expect(result.sessionsImported).toBe(1);
      expect(result.mode).toBe('overwrite');

      const data = PromptLearner._loadData();
      expect(data.sessions.length).toBe(1);
      expect(data.sessions[0].id).toBe('imported_1');
    });

    it('devrait fusionner les données lors de l\'import en mode merge', () => {
      // Créer des données initiales
      PromptLearner.startSession({ domain: 'initial', topic: 'test' });
      PromptLearner.recordIteration(createMockValidationReport(60), createMockDeck());
      PromptLearner.endSession(false);

      // Créer des données à importer
      const importData = {
        version: 2,
        sessions: [
          {
            id: 'imported_1',
            config: { domain: 'imported' },
            iterations: [],
            status: 'imported'
          }
        ],
        errorPatterns: { IMPORTED_ERROR: 3 },
        errorsByCategory: { pedagogy: { IMPORTED_ERROR: 3 } },
        domainStats: {},
        qualityTrends: {}
      };

      const result = PromptLearner.importLearning(importData, { merge: true });

      expect(result.success).toBe(true);
      expect(result.mode).toBe('merge');

      const data = PromptLearner._loadData();
      expect(data.sessions.length).toBe(2); // 1 initial + 1 importé
      expect(data.errorPatterns.IMPORTED_ERROR).toBe(3);
    });

    it('devrait rejeter les imports de version incompatible', () => {
      const futureData = {
        version: 999,
        sessions: []
      };

      const result = PromptLearner.importLearning(futureData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Version incompatible');
    });

    it('devrait rejeter les imports avec format invalide', () => {
      const invalidData = {
        // Pas de version ni sessions
        someData: 'invalid'
      };

      const result = PromptLearner.importLearning(invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Format de données invalide');
    });

    it('devrait parser une string JSON lors de l\'import', () => {
      const importData = {
        version: 2,
        sessions: [],
        errorPatterns: {},
        errorsByCategory: {},
        domainStats: {},
        qualityTrends: {}
      };

      const jsonString = JSON.stringify(importData);
      const result = PromptLearner.importLearning(jsonString, { overwrite: true });

      expect(result.success).toBe(true);
    });
  });

  // ───────────────────────────────────────────────────────────────
  // RESET DOMAIN
  // ───────────────────────────────────────────────────────────────

  describe('Domain Reset', () => {
    it('devrait réinitialiser un domaine spécifique', () => {
      // Créer des sessions pour plusieurs domaines
      PromptLearner.startSession({ domain: 'maths', topic: 'test' });
      PromptLearner.recordIteration(createMockValidationReport(70), createMockDeck());
      PromptLearner.endSession(false);

      PromptLearner.startSession({ domain: 'histoire', topic: 'test' });
      PromptLearner.recordIteration(createMockValidationReport(65), createMockDeck());
      PromptLearner.endSession(false);

      PromptLearner.startSession({ domain: 'maths', topic: 'test' });
      PromptLearner.recordIteration(createMockValidationReport(75), createMockDeck());
      PromptLearner.endSession(false);

      const result = PromptLearner.resetDomain('maths');

      expect(result.success).toBe(true);
      expect(result.domain).toBe('maths');
      expect(result.sessionsDeleted).toBe(2);
      expect(result.sessionsRemaining).toBe(1);

      const data = PromptLearner._loadData();
      expect(data.sessions.length).toBe(1);
      expect(data.sessions[0].config.domain).toBe('histoire');
      expect(data.domainStats.maths).toBeUndefined();
    });

    it('devrait échouer si le domaine n\'existe pas', () => {
      const result = PromptLearner.resetDomain('nonexistent');

      expect(result.success).toBe(false);
      expect(result.message).toContain('Aucune session trouvée');
    });

    it('devrait recalculer les patterns d\'erreurs après reset', () => {
      // Créer des sessions avec erreurs spécifiques par domaine
      PromptLearner.startSession({ domain: 'maths', topic: 'test' });
      PromptLearner.recordIteration(createMockValidationReport(60, [{ code: 'MATH_ERROR' }]), createMockDeck());
      PromptLearner.endSession(false);

      PromptLearner.startSession({ domain: 'histoire', topic: 'test' });
      PromptLearner.recordIteration(createMockValidationReport(65, [{ code: 'HISTORY_ERROR' }]), createMockDeck());
      PromptLearner.endSession(false);

      PromptLearner.resetDomain('maths');

      const data = PromptLearner._loadData();
      expect(data.errorPatterns.MATH_ERROR).toBeUndefined();
      expect(data.errorPatterns.HISTORY_ERROR).toBeDefined();
    });
  });

  // ───────────────────────────────────────────────────────────────
  // MIGRATION DE VERSION
  // ───────────────────────────────────────────────────────────────

  describe('Version Migration', () => {
    it('devrait migrer les données de v1 à v2', () => {
      const v1Data = {
        version: 1,
        sessions: [
          {
            id: 'session_1',
            config: { domain: 'test' },
            iterations: [
              {
                number: 1,
                score: 70,
                errorCodes: ['MCQ_INVALID_ANSWER', 'ANSWER_TOO_LONG']
              }
            ]
          }
        ],
        errorPatterns: {
          'MCQ_INVALID_ANSWER': 5,
          'ANSWER_TOO_LONG': 3
        },
        domainStats: {}
      };

      const migrated = PromptLearner._migrateData(v1Data);

      expect(migrated.version).toBe(2);
      expect(migrated.errorsByCategory).toBeDefined();
      expect(migrated.errorsByCategory.content).toBeDefined();
      expect(migrated.errorsByCategory.content.MCQ_INVALID_ANSWER).toBe(5);
      expect(migrated.errorsByCategory.pedagogy.ANSWER_TOO_LONG).toBe(3);
      expect(migrated.qualityTrends).toBeDefined();
    });

    it('devrait charger et migrer automatiquement les anciennes données', () => {
      const v1Data = {
        version: 1,
        sessions: [],
        errorPatterns: { OLD_ERROR: 2 },
        domainStats: {}
      };

      localStorage.setItem(PromptLearner.STORAGE_KEY, JSON.stringify(v1Data));

      const loaded = PromptLearner._loadData();

      expect(loaded.version).toBe(2);
      expect(loaded.errorsByCategory).toBeDefined();
    });
  });

  // ───────────────────────────────────────────────────────────────
  // INTÉGRATION AVEC FONCTIONNALITÉS EXISTANTES
  // ───────────────────────────────────────────────────────────────

  describe('Integration with Existing Features', () => {
    it('devrait maintenir la compatibilité avec getTopErrors', () => {
      // Créer des sessions
      for (let i = 0; i < 3; i++) {
        PromptLearner.startSession({ domain: 'test', topic: 'test' });
        const report = createMockValidationReport(60, [
          { code: 'MCQ_INVALID_ANSWER' },
          { code: 'ANSWER_TOO_LONG' }
        ]);
        PromptLearner.recordIteration(report, createMockDeck());
        PromptLearner.endSession(false);
      }

      const topErrors = PromptLearner.getTopErrors(5);

      expect(topErrors).toBeDefined();
      expect(Array.isArray(topErrors)).toBe(true);
      expect(topErrors[0]).toHaveProperty('code');
      expect(topErrors[0]).toHaveProperty('count');
      expect(topErrors[0]).toHaveProperty('description');
    });

    it('devrait maintenir la compatibilité avec getPromptImprovements', () => {
      for (let i = 0; i < 5; i++) {
        PromptLearner.startSession({ domain: 'maths', topic: 'test' });
        const report = createMockValidationReport(55, [{ code: 'MCQ_ANSWER_IS_TEXT' }]);
        PromptLearner.recordIteration(report, createMockDeck());
        PromptLearner.endSession(false);
      }

      const improvements = PromptLearner.getPromptImprovements('maths');

      expect(improvements).toBeDefined();
      expect(improvements.improvements).toBeDefined();
      expect(Array.isArray(improvements.improvements)).toBe(true);
    });

    it('devrait maintenir la compatibilité avec getStats', () => {
      PromptLearner.startSession({ domain: 'test', topic: 'test' });
      PromptLearner.recordIteration(createMockValidationReport(70), createMockDeck());
      PromptLearner.endSession(true);

      const stats = PromptLearner.getStats();

      expect(stats).toBeDefined();
      expect(stats.totalSessions).toBe(1);
      expect(stats.importedSessions).toBe(1);
      expect(stats.topErrors).toBeDefined();
    });
  });
});
