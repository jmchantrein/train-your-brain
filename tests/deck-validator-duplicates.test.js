/**
 * Tests pour la détection de doublons dans DeckValidator
 *
 * Couvre :
 * - Doublons exacts (question + réponse identiques)
 * - Similarité Jaccard (questions similaires)
 * - Similarité Levenshtein (textes courts)
 * - Comparaison de réponses
 * - Performance avec gros decks
 */

describe('DeckValidator - Duplicate Detection', () => {

  // ═══════════════════════════════════════════════════════════════
  // DOUBLONS EXACTS
  // ═══════════════════════════════════════════════════════════════

  describe('Exact Duplicates', () => {

    it('should detect exact duplicate (same question and answer)', () => {
      const cards = [
        { id: 'card1', question: 'Quelle est la capitale de la France ?', answer: 'Paris' },
        { id: 'card2', question: 'Quelle est la capitale de la France ?', answer: 'Paris' }
      ];

      const duplicates = DeckValidator.findDuplicates(cards);

      expect(duplicates.length).toBe(1);
      expect(duplicates[0].type).toBe('exact');
      expect(duplicates[0].similarity).toBe(100);
      expect(duplicates[0].severity).toBe(DeckValidator.SEVERITY.ERROR);
    });

    it('should detect exact duplicate ignoring case and accents', () => {
      const cards = [
        { id: 'card1', question: 'Quelle est la capitale de la France ?', answer: 'Paris' },
        { id: 'card2', question: 'QUELLE EST LA CAPITALE DE LA FRANCE ?', answer: 'paris' }
      ];

      const duplicates = DeckValidator.findDuplicates(cards);

      expect(duplicates.length).toBe(1);
      expect(duplicates[0].type).toBe('exact');
    });

    it('should NOT detect exact duplicate if answers differ', () => {
      const cards = [
        { id: 'card1', question: 'Quelle est la capitale de la France ?', answer: 'Paris' },
        { id: 'card2', question: 'Quelle est la capitale de la France ?', answer: 'Lyon' }
      ];

      const duplicates = DeckValidator.findDuplicates(cards);

      expect(duplicates.length).toBe(1);
      expect(duplicates[0].type).not.toBe('exact');
    });

    it('should detect exact duplicate ignoring whitespace and punctuation', () => {
      const cards = [
        { id: 'card1', question: '  Paris ?  ', answer: '  Ville  ' },
        { id: 'card2', question: 'Paris?', answer: 'Ville' }
      ];

      const duplicates = DeckValidator.findDuplicates(cards);

      expect(duplicates.length).toBe(1);
      expect(duplicates[0].type).toBe('exact');
    });

    it('should NOT treat empty cards as duplicates', () => {
      const cards = [
        { id: 'card1', question: '', answer: '' },
        { id: 'card2', question: '', answer: '' }
      ];

      const duplicates = DeckValidator.findDuplicates(cards);

      expect(duplicates.length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SIMILARITÉ JACCARD
  // ═══════════════════════════════════════════════════════════════

  describe('Jaccard Similarity', () => {

    it('should detect highly similar questions', () => {
      const cards = [
        // Jaccard sur les mots de plus de 2 lettres : 8 mots communs / 10 au total = 0.8
        // (le seuil par défaut). Avec une seule question courte, un mot différent
        // fait tomber la similarité sous 0.8.
        { id: 'card1', question: 'Quelle est la capitale administrative officielle actuelle principale de la France métropolitaine ?', answer: 'Paris' },
        { id: 'card2', question: 'Quelle est la capitale administrative officielle actuelle principale de la France continentale ?', answer: 'Paris' }
      ];

      const duplicates = DeckValidator.findDuplicates(cards);

      expect(duplicates.length).toBe(1);
      expect(duplicates[0].similarity).toBeGreaterThanOrEqual(80);
    });

    it('should NOT detect duplicates for different questions', () => {
      const cards = [
        { id: 'card1', question: 'Quelle est la capitale de la France ?', answer: 'Paris' },
        { id: 'card2', question: 'Combien font 2 + 2 ?', answer: '4' }
      ];

      const duplicates = DeckValidator.findDuplicates(cards);

      expect(duplicates.length).toBe(0);
    });

    it('should respect custom similarity threshold', () => {
      const cards = [
        { id: 'card1', question: 'La capitale de la France est Paris', answer: 'vrai' },
        { id: 'card2', question: 'La capitale française est Paris', answer: 'vrai' }
      ];

      const lowThreshold = DeckValidator.findDuplicates(cards, { questionThreshold: 0.5 });
      const highThreshold = DeckValidator.findDuplicates(cards, { questionThreshold: 0.9 });

      expect(lowThreshold.length).toBeGreaterThanOrEqual(1);
      expect(highThreshold.length).toBe(0);
    });

    it('should detect multiple duplicate pairs', () => {
      const cards = [
        { id: 'card1', question: 'Capitale de France ?', answer: 'Paris' },
        { id: 'card2', question: 'Capitale de France ?', answer: 'Paris' },
        { id: 'card3', question: 'Capitale de Allemagne ?', answer: 'Berlin' },
        { id: 'card4', question: 'Capitale de Allemagne ?', answer: 'Berlin' }
      ];

      const duplicates = DeckValidator.findDuplicates(cards);

      expect(duplicates.length).toBe(2);
    });

    it('should filter out short words (<=2 chars)', () => {
      const cards = [
        { id: 'card1', question: 'Le la de du ?', answer: 'a' },
        { id: 'card2', question: 'Un le et ou ?', answer: 'b' }
      ];

      const duplicates = DeckValidator.findDuplicates(cards, { questionThreshold: 0.5 });

      expect(duplicates.length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // SIMILARITÉ DES RÉPONSES
  // ═══════════════════════════════════════════════════════════════

  describe('Answer Similarity', () => {

    it('should detect similar questions with same answer', () => {
      const cards = [
        { id: 'card1', question: 'Capitale de la France ?', answer: 'Paris' },
        { id: 'card2', question: 'Capitale de France ?', answer: 'Paris' }
      ];

      const duplicates = DeckValidator.findDuplicates(cards);

      expect(duplicates.length).toBe(1);
      expect(duplicates[0].answerSimilarity).toBe(100);
      expect(duplicates[0].type).toBe('full');
    });

    it('should detect similar questions with different answers', () => {
      const cards = [
        { id: 'card1', question: 'Capitale de la France ?', answer: 'Paris' },
        { id: 'card2', question: 'Capitale de France ?', answer: 'Londres' }
      ];

      const duplicates = DeckValidator.findDuplicates(cards);

      expect(duplicates.length).toBe(1);
      expect(duplicates[0].answerSimilarity).toBeLessThan(90);
      expect(duplicates[0].type).toBe('question');
    });

    it('should compare numeric answers exactly', () => {
      const cards = [
        { id: 'card1', type: 'numeric', question: '2 + 2 ?', answer: '4' },
        { id: 'card2', type: 'numeric', question: '2 + 2 =', answer: '4' }
      ];

      const duplicates = DeckValidator.findDuplicates(cards);

      expect(duplicates.length).toBe(1);
      expect(duplicates[0].answerSimilarity).toBe(100);
    });

    it('should compare MCQ answers by ID', () => {
      const cards = [
        {
          id: 'card1',
          type: 'mcq',
          question: 'Capitale de France ?',
          answer: 'A',
          choices: [
            { id: 'A', text: 'Paris' },
            { id: 'B', text: 'Lyon' }
          ]
        },
        {
          id: 'card2',
          type: 'mcq',
          question: 'Capitale France ?',
          answer: 'A',
          choices: [
            { id: 'A', text: 'Paris' },
            { id: 'B', text: 'Marseille' }
          ]
        }
      ];

      const duplicates = DeckValidator.findDuplicates(cards);

      expect(duplicates.length).toBe(1);
      expect(duplicates[0].answerSimilarity).toBe(100);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // LEVENSHTEIN
  // ═══════════════════════════════════════════════════════════════

  describe('Levenshtein Distance', () => {

    it('should use Levenshtein for short texts when enabled', () => {
      const cards = [
        { id: 'card1', question: 'Paris', answer: 'Capitale' },
        { id: 'card2', question: 'Pari', answer: 'Capitale' }
      ];

      const duplicates = DeckValidator.findDuplicates(cards, {
        questionThreshold: 0.7,
        useLevenshtein: true
      });

      expect(duplicates.length).toBe(1);
      expect(duplicates[0].details.method).toBe('levenshtein');
    });

    it('should calculate correct Levenshtein distance', () => {
      // chat -> chien : 2 substitutions (a->i, t->e) + 1 insertion (n) = 3
      expect(TextUtils.levenshteinDistance('chat', 'chien')).toBe(3);
      expect(TextUtils.levenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(TextUtils.levenshteinDistance('abc', 'abc')).toBe(0);
    });

    it('should normalize Levenshtein distance to similarity (0-1)', () => {
      const sim1 = DeckValidator._levenshteinSimilarity('Paris', 'Paris');
      const sim2 = DeckValidator._levenshteinSimilarity('Paris', 'Pari');
      const sim3 = DeckValidator._levenshteinSimilarity('abc', 'xyz');

      expect(sim1).toBe(1);
      expect(sim2).toBeGreaterThanOrEqual(0.8);
      expect(sim3).toBe(0);
    });

    it('should handle empty strings in Levenshtein', () => {
      expect(TextUtils.levenshteinDistance('', '')).toBe(0);
      expect(TextUtils.levenshteinDistance('abc', '')).toBe(3);
      expect(TextUtils.levenshteinDistance('', 'xyz')).toBe(3);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // CAS LIMITES
  // ═══════════════════════════════════════════════════════════════

  describe('Edge Cases', () => {

    it('should handle single card', () => {
      const cards = [
        { id: 'card1', question: 'Test', answer: 'Test' }
      ];

      const duplicates = DeckValidator.findDuplicates(cards);

      expect(duplicates.length).toBe(0);
    });

    it('should handle empty array', () => {
      const cards = [];
      const duplicates = DeckValidator.findDuplicates(cards);

      expect(duplicates.length).toBe(0);
    });

    it('should handle very long questions', () => {
      const longText = 'La France, en forme longue la République française, est un pays dont la métropole se situe en Europe de l\'Ouest et dont le territoire ultramarin s\'étend dans les océans Indien, Atlantique, Pacifique et en Amérique du Sud. Le pays a des frontières terrestres avec la Belgique, le Luxembourg, l\'Allemagne, la Suisse, l\'Italie, l\'Espagne et les deux principautés de Monaco et d\'Andorre.';

      const cards = [
        { id: 'card1', question: longText, answer: 'Paris' },
        { id: 'card2', question: longText.replace('métropole', 'partie principale'), answer: 'Paris' }
      ];

      const duplicates = DeckValidator.findDuplicates(cards);

      expect(duplicates.length).toBe(1);
      expect(duplicates[0].similarity).toBeGreaterThanOrEqual(90);
    });

    it('should maintain backwards compatibility with number threshold', () => {
      const cards = [
        { id: 'card1', question: 'Test similaire ici', answer: 'A' },
        { id: 'card2', question: 'Test similaire là', answer: 'B' }
      ];

      // Old API: passing number directly
      const duplicates = DeckValidator.findDuplicates(cards, 0.6);

      expect(duplicates).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // PERFORMANCE
  // ═══════════════════════════════════════════════════════════════

  describe('Performance', () => {

    it('should handle 100 cards efficiently', () => {
      const cards = [];
      for (let i = 0; i < 100; i++) {
        cards.push({
          id: `card${i}`,
          question: `Question numéro ${i} sur un sujet différent`,
          answer: `Réponse ${i}`
        });
      }

      const startTime = performance.now();
      const duplicates = DeckValidator.findDuplicates(cards);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(1000);
    });

    it('should handle 500 cards in reasonable time', () => {
      const cards = [];
      for (let i = 0; i < 500; i++) {
        cards.push({
          id: `card${i}`,
          question: `Question unique numéro ${i} sur un thème varié et différent`,
          answer: `Réponse complète ${i}`
        });
      }

      const startTime = performance.now();
      const duplicates = DeckValidator.findDuplicates(cards);
      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(5000);
    });

    it('should normalize each card once, not once per pair', () => {
      // Assertion indépendante de la charge machine : le nombre de normalisations doit
      // croître avec le nombre de cartes (O(n)), pas avec le nombre de paires (O(n²)).
      const countNormalizations = (n) => {
        const cards = [];
        for (let i = 0; i < n; i++) {
          cards.push({
            id: `card${i}`,
            question: `Question unique numéro ${i} sur un thème varié et différent`,
            answer: `Réponse complète ${i}`
          });
        }
        const original = DeckValidator._normalizeText;
        let calls = 0;
        DeckValidator._normalizeText = function (text) {
          calls++;
          return original.call(this, text);
        };
        try {
          DeckValidator.findDuplicates(cards);
        } finally {
          DeckValidator._normalizeText = original;
        }
        return calls;
      };

      const calls = countNormalizations(200); // 19 900 paires
      // 2 normalisations de base par carte + 2 profils Jaccard (question, réponse) au plus
      expect(calls).toBeLessThanOrEqual(200 * 4);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // INTÉGRATION
  // ═══════════════════════════════════════════════════════════════

  describe('Integration with validateDeck()', () => {

    it('should include duplicates in validation report', () => {
      const deck = {
        id: 'test-deck',
        name: 'Test Deck',
        cards: [
          { id: 'card1', question: 'Capitale France ?', answer: 'Paris' },
          { id: 'card2', question: 'Capitale France ?', answer: 'Paris' },
          { id: 'card3', question: 'Combien font 2 + 2 ?', answer: '4' }
        ]
      };

      const report = DeckValidator.validateDeck(deck);

      expect(report.duplicates).toBeDefined();
      expect(report.duplicates.length).toBe(1);
      expect(report.duplicates[0].type).toBe('exact');
    });

    it('should provide detailed messages in report', () => {
      const deck = {
        id: 'test-deck',
        name: 'Test Deck',
        cards: [
          { id: 'card1', question: 'Quelle est la capitale administrative officielle actuelle principale de la France métropolitaine ?', answer: 'Paris' },
          { id: 'card2', question: 'Quelle est la capitale administrative officielle actuelle principale de la France continentale ?', answer: 'Lyon' }
        ]
      };

      const report = DeckValidator.validateDeck(deck);

      expect(report.duplicates.length).toBe(1);
      expect(report.duplicates[0].message).toBeDefined();
      expect(report.duplicates[0].message).toContain('similaires');
      expect(report.duplicates[0].answerSimilarity).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // MESSAGES
  // ═══════════════════════════════════════════════════════════════

  describe('Duplicate Messages', () => {

    it('should generate correct message for exact duplicates', () => {
      const cards = [
        { id: 'card1', question: 'Test', answer: 'Answer' },
        { id: 'card2', question: 'Test', answer: 'Answer' }
      ];

      const duplicates = DeckValidator.findDuplicates(cards);

      expect(duplicates[0].message).toContain('exact');
    });

    it('should generate correct message for similar questions with same answer', () => {
      const message = DeckValidator._getDuplicateMessage(0.96, 0.95, true);

      expect(message).toContain('quasi-identiques');
    });

    it('should generate correct message for similar questions with different answers', () => {
      const message = DeckValidator._getDuplicateMessage(0.96, 0.5, false);

      expect(message).toContain('quasi-identiques');
      expect(message).toContain('différentes');
    });

    it('should generate correct message for questions with same answer', () => {
      const message = DeckValidator._getDuplicateMessage(0.85, 0.95, true);

      expect(message).toContain('même réponse');
    });
  });
});
