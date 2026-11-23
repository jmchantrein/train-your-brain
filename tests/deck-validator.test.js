/**
 * Tests pour DeckValidator
 */

describe('DeckValidator', () => {
  // ═══════════════════════════════════════════════════════════════
  // VALIDATION STRUCTURELLE
  // ═══════════════════════════════════════════════════════════════

  describe('validateStructure', () => {
    it('should return valid for a correct deck', () => {
      const deck = {
        id: 'test-deck',
        name: 'Test Deck',
        cards: [
          { id: 'card1', question: 'What is 2+2?', answer: '4' },
          { id: 'card2', question: 'What is 3+3?', answer: '6' }
        ]
      };

      const result = DeckValidator.validateStructure(deck);
      expect(result.valid).toBe(true);
      expect(result.issues.filter(i => i.severity === 'error')).toHaveLength(0);
    });

    it('should detect missing deck', () => {
      const result = DeckValidator.validateStructure(null);
      expect(result.valid).toBe(false);
      expect(result.issues.some(i => i.code === 'DECK_MISSING')).toBe(true);
    });

    it('should detect missing cards array', () => {
      const deck = { id: 'test' };
      const result = DeckValidator.validateStructure(deck);
      expect(result.valid).toBe(false);
      expect(result.issues.some(i => i.code === 'CARDS_MISSING')).toBe(true);
    });

    it('should detect empty cards array', () => {
      const deck = { id: 'test', cards: [] };
      const result = DeckValidator.validateStructure(deck);
      expect(result.valid).toBe(false);
      expect(result.issues.some(i => i.code === 'CARDS_EMPTY')).toBe(true);
    });

    it('should detect duplicate card IDs', () => {
      const deck = {
        id: 'test',
        cards: [
          { id: 'card1', question: 'Q1', answer: 'A1' },
          { id: 'card1', question: 'Q2', answer: 'A2' }
        ]
      };

      const result = DeckValidator.validateStructure(deck);
      expect(result.issues.some(i => i.code === 'DUPLICATE_IDS')).toBe(true);
    });

    it('should detect missing question', () => {
      const deck = {
        id: 'test',
        cards: [{ id: 'card1', answer: 'A1' }]
      };

      const result = DeckValidator.validateStructure(deck);
      expect(result.issues.some(i => i.code === 'QUESTION_MISSING')).toBe(true);
    });

    it('should detect missing answer', () => {
      const deck = {
        id: 'test',
        cards: [{ id: 'card1', question: 'Q1' }]
      };

      const result = DeckValidator.validateStructure(deck);
      expect(result.issues.some(i => i.code === 'ANSWER_MISSING')).toBe(true);
    });

    it('should detect invalid card type', () => {
      const deck = {
        id: 'test',
        cards: [{ id: 'card1', question: 'Q1', answer: 'A1', type: 'invalid_type' }]
      };

      const result = DeckValidator.validateStructure(deck);
      expect(result.issues.some(i => i.code === 'INVALID_TYPE')).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // VALIDATION MCQ
  // ═══════════════════════════════════════════════════════════════

  describe('MCQ validation', () => {
    it('should validate correct MCQ structure', () => {
      const deck = {
        id: 'test',
        cards: [{
          id: 'mcq1',
          type: 'mcq',
          question: 'What color is the sky?',
          answer: 'B',
          choices: [
            { id: 'A', text: 'Red' },
            { id: 'B', text: 'Blue' },
            { id: 'C', text: 'Green' }
          ]
        }]
      };

      const result = DeckValidator.validateStructure(deck);
      expect(result.valid).toBe(true);
    });

    it('should detect MCQ without options', () => {
      const deck = {
        id: 'test',
        cards: [{
          id: 'mcq1',
          type: 'mcq',
          question: 'What color?',
          answer: 'B'
        }]
      };

      const result = DeckValidator.validateStructure(deck);
      expect(result.issues.some(i => i.code === 'MCQ_OPTIONS_MISSING')).toBe(true);
    });

    it('should detect MCQ with invalid answer ID', () => {
      const deck = {
        id: 'test',
        cards: [{
          id: 'mcq1',
          type: 'mcq',
          question: 'What color?',
          answer: 'D',
          choices: [
            { id: 'A', text: 'Red' },
            { id: 'B', text: 'Blue' }
          ]
        }]
      };

      const result = DeckValidator.validateStructure(deck);
      expect(result.issues.some(i => i.code === 'MCQ_INVALID_ANSWER')).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // DÉTECTION DE DOUBLONS
  // ═══════════════════════════════════════════════════════════════

  describe('findDuplicates', () => {
    it('should detect exact duplicates', () => {
      const cards = [
        { id: 'card1', question: 'What is 2+2?', answer: '4' },
        { id: 'card2', question: 'What is 2+2?', answer: '4' }
      ];

      const duplicates = DeckValidator.findDuplicates(cards);
      expect(duplicates.length).toBeGreaterThan(0);
      expect(duplicates[0].type).toBe('exact');
    });

    it('should detect similar questions', () => {
      const cards = [
        { id: 'card1', question: 'What is the capital of France?', answer: 'Paris' },
        { id: 'card2', question: 'What is the capital city of France?', answer: 'Paris' }
      ];

      const duplicates = DeckValidator.findDuplicates(cards, { questionThreshold: 0.7 });
      expect(duplicates.length).toBeGreaterThan(0);
    });

    it('should return empty array for unique cards', () => {
      const cards = [
        { id: 'card1', question: 'What is 2+2?', answer: '4' },
        { id: 'card2', question: 'What color is the sky?', answer: 'Blue' }
      ];

      const duplicates = DeckValidator.findDuplicates(cards);
      expect(duplicates).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SIMILARITÉ
  // ═══════════════════════════════════════════════════════════════

  describe('similarity calculations', () => {
    it('should calculate Jaccard similarity correctly', () => {
      const sim1 = DeckValidator._jaccardSimilarity('hello world', 'hello world');
      expect(sim1).toBe(1);

      const sim2 = DeckValidator._jaccardSimilarity('hello world', 'goodbye world');
      expect(sim2).toBeGreaterThan(0);
      expect(sim2).toBeLessThan(1);

      const sim3 = DeckValidator._jaccardSimilarity('abc', 'xyz');
      expect(sim3).toBe(0);
    });

    it('should calculate Levenshtein similarity correctly', () => {
      const sim1 = DeckValidator._levenshteinSimilarity('hello', 'hello');
      expect(sim1).toBe(1);

      const sim2 = DeckValidator._levenshteinSimilarity('hello', 'hallo');
      expect(sim2).toBeGreaterThan(0.7);

      const sim3 = DeckValidator._levenshteinSimilarity('abc', 'xyz');
      expect(sim3).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // QUALITÉ MCQ
  // ═══════════════════════════════════════════════════════════════

  describe('analyzeMcqQuality', () => {
    it('should detect longest correct answer', () => {
      const card = {
        type: 'mcq',
        question: 'Question?',
        answer: 'B',
        choices: [
          { id: 'A', text: 'Short' },
          { id: 'B', text: 'This is a very long answer that is much longer than the others' },
          { id: 'C', text: 'Medium' }
        ]
      };

      const flaws = DeckValidator.analyzeMcqQuality(card);
      expect(flaws.some(f => f.name === 'Bonne réponse plus longue')).toBe(true);
    });

    it('should detect too few options', () => {
      const card = {
        type: 'mcq',
        question: 'Question?',
        answer: 'A',
        choices: [
          { id: 'A', text: 'Yes' },
          { id: 'B', text: 'No' }
        ]
      };

      const flaws = DeckValidator.analyzeMcqQuality(card);
      expect(flaws.some(f => f.name === "Trop peu d'options")).toBe(true);
    });

    it('should return empty for non-MCQ cards', () => {
      const card = { type: 'text', question: 'Q', answer: 'A' };
      const flaws = DeckValidator.analyzeMcqQuality(card);
      expect(flaws).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // RÉPONSE DANS LA QUESTION
  // ═══════════════════════════════════════════════════════════════

  describe('checkAnswerInQuestion', () => {
    it('should detect answer appearing in question', () => {
      const card = {
        id: 'card1',
        question: 'What is the capital of France, is it Paris?',
        answer: 'Paris'
      };

      const issue = DeckValidator.checkAnswerInQuestion(card);
      expect(issue).not.toBeNull();
      expect(issue.code).toBe('ANSWER_IN_QUESTION');
    });

    it('should not flag short answers', () => {
      const card = {
        id: 'card1',
        question: 'Is 2+2 equal to 4?',
        answer: '4'
      };

      const issue = DeckValidator.checkAnswerInQuestion(card);
      expect(issue).toBeNull();
    });

    it('should return null when answer not in question', () => {
      const card = {
        id: 'card1',
        question: 'What is the capital of France?',
        answer: 'Paris'
      };

      const issue = DeckValidator.checkAnswerInQuestion(card);
      expect(issue).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // LISIBILITÉ (FLESCH-KINCAID)
  describe('calculateFleschScore', () => {
    it('should return score between 0 and 100', () => {
      const score = DeckValidator.calculateFleschScore('Bonjour le monde.');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('getReadabilityLevel', () => {
    it('should return correct level for various scores', () => {
      expect(DeckValidator.getReadabilityLevel(95).level).toBe('very_easy');
      expect(DeckValidator.getReadabilityLevel(75).level).toBe('fairly_easy');
      expect(DeckValidator.getReadabilityLevel(40).level).toBe('difficult');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // CLASSIFICATION BLOOM
  // ═══════════════════════════════════════════════════════════════

  describe('classifyBloomLevel', () => {
    it('should classify remember questions', () => {
      const result = DeckValidator.classifyBloomLevel("Qu'est-ce que la photosynthèse?");
      expect(result.category).toBe('remember');
      expect(result.level).toBe(1);
    });

    it('should classify understand questions', () => {
      const result = DeckValidator.classifyBloomLevel('Expliquez comment fonctionne un moteur.');
      expect(result.category).toBe('understand');
      expect(result.level).toBe(2);
    });

    it('should classify apply questions', () => {
      const result = DeckValidator.classifyBloomLevel('Calculez la surface de ce rectangle.');
      expect(result.category).toBe('apply');
      expect(result.level).toBe(3);
    });

    it('should classify analyze questions', () => {
      const result = DeckValidator.classifyBloomLevel('Comparez les deux systèmes politiques.');
      expect(result.category).toBe('analyze');
      expect(result.level).toBe(4);
    });

    it('should default to remember for unclear questions', () => {
      const result = DeckValidator.classifyBloomLevel('Paris');
      expect(result.category).toBe('remember');
    });
  });

  describe('analyzeBloomDistribution', () => {
    it('should calculate distribution correctly', () => {
      const cards = [
        { question: "Qu'est-ce que X?" },
        { question: "Qu'est-ce que Y?" },
        { question: 'Expliquez Z.' }
      ];

      const result = DeckValidator.analyzeBloomDistribution(cards);
      expect(result.counts.remember).toBe(2);
      expect(result.counts.understand).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // RISQUE FACTUEL
  // ═══════════════════════════════════════════════════════════════

  describe('assessFactualRisk', () => {
    it('should detect date risk', () => {
      const card = { question: 'En quelle année fut construit le château?', answer: 'En 1453' };
      const result = DeckValidator.assessFactualRisk(card);
      expect(result.flags.some(f => f.category === 'DATE')).toBe(true);
    });

    it('should detect statistic risk', () => {
      const card = { question: 'Population?', answer: '67 millions habitants' };
      const result = DeckValidator.assessFactualRisk(card);
      expect(result.flags.some(f => f.category === 'STATISTIC')).toBe(true);
    });

    it('should return low risk for simple facts', () => {
      const card = { question: 'What color is grass?', answer: 'Green' };
      const result = DeckValidator.assessFactualRisk(card);
      expect(result.level).toBe('LOW');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // DÉTECTION D'HALLUCINATIONS
  // ═══════════════════════════════════════════════════════════════

  describe('detectHallucinations', () => {
    it('should detect precise dates', () => {
      const card = { question: 'Question', answer: 'Cela s\'est passé le 15 mars 1987' };
      const result = DeckValidator.detectHallucinations(card);
      expect(result.warnings.some(w => w.category === 'DATE')).toBe(true);
    });

    it('should detect precise percentages', () => {
      const card = { question: 'Question', answer: 'Le taux est de 47.3%' };
      const result = DeckValidator.detectHallucinations(card);
      expect(result.warnings.some(w => w.category === 'PERCENTAGE')).toBe(true);
    });

    it('should detect absolute terms', () => {
      const card = { question: 'Question', answer: 'Cela arrive toujours' };
      const result = DeckValidator.detectHallucinations(card);
      expect(result.warnings.some(w => w.category === 'ABSOLUTE')).toBe(true);
    });

    it('should return low risk for simple answers', () => {
      const card = { question: 'What is the color of the sky?', answer: 'Blue' };
      const result = DeckValidator.detectHallucinations(card);
      expect(result.risk).toBeLessThan(0.5);
    });
  });

  describe('getHallucinationReport', () => {
    it('should generate report for deck', () => {
      const deck = {
        cards: [
          { id: 'c1', question: 'Q1', answer: 'A1' },
          { id: 'c2', question: 'Q2', answer: 'En 1945, le 15 mai exactement' }
        ]
      };

      const report = DeckValidator.getHallucinationReport(deck);
      expect(report.totalCards).toBe(2);
      expect(report.cardsWithWarnings).toBeGreaterThan(0);
    });

    it('should handle empty deck', () => {
      const report = DeckValidator.getHallucinationReport({ cards: [] });
      expect(report.totalCards).toBe(0);
      expect(report.averageRisk).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SCORING COMPOSITE
  // ═══════════════════════════════════════════════════════════════

  describe('calculateCardScore', () => {
    it('should score a valid card', () => {
      const card = {
        id: 'card1',
        question: 'What is the capital of France?',
        answer: 'Paris',
        feedback: 'Paris is the largest city in France.'
      };

      const result = DeckValidator.calculateCardScore(card);
      expect(result.score).toBeGreaterThan(0);
      expect(result.grade).toMatch(/[ABCD]/);
      expect(result.isValid).toBe(true);
    });

    it('should penalize missing fields', () => {
      const card = { id: 'card1', question: '', answer: '' };
      const result = DeckValidator.calculateCardScore(card);
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should penalize long answers', () => {
      const card = {
        id: 'card1',
        question: 'Question?',
        answer: 'This is a very long answer with many words that should be penalized because it is too verbose'
      };

      const result = DeckValidator.calculateCardScore(card);
      expect(result.warnings.some(w => w.code === 'ANSWER_TOO_LONG')).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // VALIDATION COMPLÈTE DU DECK
  // ═══════════════════════════════════════════════════════════════

  describe('validateDeck', () => {
    it('should validate a complete deck', () => {
      const deck = {
        id: 'test-deck',
        name: 'Test Deck',
        cards: [
          { id: 'card1', question: 'What is 2+2?', answer: '4' },
          { id: 'card2', question: 'What is 3+3?', answer: '6' }
        ]
      };

      const report = DeckValidator.validateDeck(deck);
      expect(report.stats.totalCards).toBe(2);
      expect(report.canImport).toBe(true);
      expect(report.bloomDistribution).not.toBeNull();
      expect(report.readability).not.toBeNull();
    });

    it('should detect issues in invalid deck', () => {
      const deck = {
        id: 'test-deck',
        cards: [
          { id: 'card1', question: '', answer: '' },
          { id: 'card1', question: 'Duplicate ID', answer: 'A' }
        ]
      };

      const report = DeckValidator.validateDeck(deck);
      expect(report.isValid).toBe(false);
      expect(report.stats.cardsWithErrors).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GÉNÉRATION DE PROMPT
  // ═══════════════════════════════════════════════════════════════

  describe('generateCorrectionPrompt', () => {
    it('should generate prompt for deck with issues', () => {
      const deck = {
        id: 'test',
        name: 'Test Deck',
        cards: [{ id: 'card1', question: '', answer: '' }]
      };
      const report = DeckValidator.validateDeck(deck);
      const prompt = DeckValidator.generateCorrectionPrompt(deck, report);

      expect(prompt).toContain('Corrections requises');
      expect(prompt).toContain('Test Deck');
    });

    it('should return success message for valid deck', () => {
      const deck = {
        id: 'test',
        cards: [{ id: 'card1', question: 'Q?', answer: 'A' }]
      };
      const report = DeckValidator.validateDeck(deck);
      // Manually clear issues to simulate perfect deck
      report.cardResults[0].issues = [];
      report.cardResults[0].warnings = [];
      report.duplicates = [];

      const prompt = DeckValidator.generateCorrectionPrompt(deck, report);
      expect(prompt).toContain('Aucune correction nécessaire');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SUGGESTIONS
  // ═══════════════════════════════════════════════════════════════

  describe('getSuggestions', () => {
    it('should suggest alternatives for text cards', () => {
      const card = { id: 'c1', question: 'Q?', answer: 'A' };
      const suggestions = DeckValidator.getSuggestions(card);
      expect(suggestions.some(s => s.type === 'alternatives')).toBe(true);
    });

    it('should suggest feedback when missing', () => {
      const card = { id: 'c1', question: 'Q?', answer: 'A' };
      const suggestions = DeckValidator.getSuggestions(card);
      expect(suggestions.some(s => s.type === 'feedback')).toBe(true);
    });

    it('should not suggest alternatives for MCQ', () => {
      const card = {
        id: 'c1',
        type: 'mcq',
        question: 'Q?',
        answer: 'A',
        choices: [
          { id: 'A', text: 'Option A' },
          { id: 'B', text: 'Option B' }
        ]
      };
      const suggestions = DeckValidator.getSuggestions(card);
      expect(suggestions.some(s => s.type === 'alternatives')).toBe(false);
    });
  });
});
