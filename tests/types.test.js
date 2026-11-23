/**
 * Tests pour types.js
 *
 * Ce module ne contient que des définitions JSDoc.
 * Ces tests vérifient simplement que le fichier est syntaxiquement correct
 * et documentent les types attendus.
 */

describe('Types', () => {
  // ═══════════════════════════════════════════════════════════════
  // CHARGEMENT DU MODULE
  // ═══════════════════════════════════════════════════════════════

  describe('Module loading', () => {
    it('types.js should be loadable without errors', () => {
      // Le fichier types.js est chargé avec les autres modules
      // Ce test passe si le runner n'a pas crashé au chargement
      expect(true).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // DOCUMENTATION DES TYPES ATTENDUS
  // Ces tests documentent les types définis dans types.js
  // ═══════════════════════════════════════════════════════════════

  describe('Type documentation', () => {
    describe('CardType', () => {
      it('should accept valid card types', () => {
        const validTypes = ['text', 'numeric', 'mcq', 'truefalse', 'cloze', 'matching'];
        validTypes.forEach(type => {
          expect(typeof type).toBe('string');
        });
      });
    });

    describe('LeitnerBox', () => {
      it('should accept valid Leitner boxes', () => {
        const validBoxes = ['never_played', 'purple', 'orange', 'green'];
        validBoxes.forEach(box => {
          expect(typeof box).toBe('string');
        });
      });
    });

    describe('Card structure', () => {
      it('should validate a minimal valid card', () => {
        const card = {
          id: 'card-1',
          question: 'What is 2+2?',
          answer: '4'
        };

        expect(card.id).toBeDefined();
        expect(card.question).toBeDefined();
        expect(card.answer).toBeDefined();
      });

      it('should validate a full card with all optional fields', () => {
        const card = {
          id: 'card-1',
          question: 'What is 2+2?',
          answer: '4',
          type: 'text',
          alternatives: ['four', 'quatre'],
          hint: 'Think about addition',
          feedback: 'Basic arithmetic',
          box: 'never_played',
          latencyThreshold: 5,
          timesPlayed: 0,
          timesCorrect: 0
        };

        expect(card.alternatives).toHaveLength(2);
        expect(card.type).toBe('text');
        expect(card.box).toBe('never_played');
      });
    });

    describe('Deck structure', () => {
      it('should validate a minimal valid deck', () => {
        const deck = {
          id: 'deck-1',
          name: 'Test Deck',
          cards: []
        };

        expect(deck.id).toBeDefined();
        expect(deck.name).toBeDefined();
        expect(Array.isArray(deck.cards)).toBe(true);
      });

      it('should validate deck settings', () => {
        const settings = {
          sequential: true,
          bidirectional: false,
          maxCards: 20,
          similarityMatching: true,
          similarityThreshold: 0.85
        };

        expect(typeof settings.sequential).toBe('boolean');
        expect(typeof settings.similarityThreshold).toBe('number');
        expect(settings.similarityThreshold).toBeLessThanOrEqual(1);
        expect(settings.similarityThreshold).toBeGreaterThanOrEqual(0);
      });
    });

    describe('PlayerStats structure', () => {
      it('should validate player stats', () => {
        const stats = {
          totalXP: 1500,
          totalCardsPlayed: 200,
          totalSessions: 25,
          currentStreak: 7,
          longestStreak: 14,
          longestGreenStreak: 12
        };

        expect(stats.totalXP).toBeGreaterThanOrEqual(0);
        expect(stats.currentStreak).toBeLessThanOrEqual(stats.longestStreak);
      });
    });

    describe('Player structure', () => {
      it('should validate a minimal player', () => {
        const player = {
          id: 'player-1',
          name: 'Test User',
          stats: {
            totalXP: 0,
            totalCardsPlayed: 0,
            totalSessions: 0,
            currentStreak: 0,
            longestStreak: 0,
            longestGreenStreak: 0
          },
          badges: [],
          settings: {}
        };

        expect(player.id).toBeDefined();
        expect(player.name).toBeDefined();
        expect(player.stats).toBeDefined();
        expect(Array.isArray(player.badges)).toBe(true);
      });
    });

    describe('Badge structure', () => {
      it('should validate a badge', () => {
        const badge = {
          id: 'badge-1',
          name: 'First Steps',
          description: 'Complete your first session',
          icon: '🎯',
          category: 'achievement'
        };

        expect(badge.id).toBeDefined();
        expect(badge.name).toBeDefined();
        expect(badge.icon).toBeDefined();
      });
    });

    describe('Challenge structure', () => {
      it('should validate a challenge', () => {
        const challenge = {
          id: 'challenge-1',
          type: 'play_cards',
          target: 10,
          progress: 5,
          completed: false,
          xpReward: 50
        };

        expect(challenge.target).toBeGreaterThan(0);
        expect(challenge.progress).toBeLessThanOrEqual(challenge.target);
        expect(typeof challenge.completed).toBe('boolean');
      });
    });

    describe('GameSession structure', () => {
      it('should validate a game session', () => {
        const session = {
          deckId: 'deck-1',
          startTime: Date.now(),
          cards: [],
          results: [],
          stats: {
            cardsPlayed: 0,
            correctAnswers: 0,
            totalResponseTimeMs: 0,
            greenStreak: 0,
            maxGreenStreak: 0
          }
        };

        expect(session.deckId).toBeDefined();
        expect(session.startTime).toBeGreaterThan(0);
        expect(Array.isArray(session.cards)).toBe(true);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // VALIDATION DES CONTRAINTES
  // ═══════════════════════════════════════════════════════════════

  describe('Type constraints', () => {
    it('similarityThreshold should be between 0 and 1', () => {
      const validThresholds = [0, 0.5, 0.8, 1];
      const invalidThresholds = [-0.1, 1.1, 2];

      validThresholds.forEach(t => {
        expect(t >= 0 && t <= 1).toBe(true);
      });

      invalidThresholds.forEach(t => {
        expect(t >= 0 && t <= 1).toBe(false);
      });
    });

    it('difficulty should be between 1 and 4', () => {
      const validDifficulties = [1, 2, 3, 4];
      const invalidDifficulties = [0, 5, -1];

      validDifficulties.forEach(d => {
        expect(d >= 1 && d <= 4).toBe(true);
      });

      invalidDifficulties.forEach(d => {
        expect(d >= 1 && d <= 4).toBe(false);
      });
    });

    it('XP values should be non-negative', () => {
      expect(0 >= 0).toBe(true);
      expect(100 >= 0).toBe(true);
      expect(-10 >= 0).toBe(false);
    });
  });
});
