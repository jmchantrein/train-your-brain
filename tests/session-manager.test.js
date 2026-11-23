/**
 * Tests pour le module GameSessionManager
 *
 * Tests de l'orchestration de session de jeu :
 * - _updatePlayerStats() : mise à jour stats joueur
 * - _trackSubjectProgress() : cartes maîtrisées distinctes par matière
 * - _trackUniqueDecks() : tracking decks uniques
 *
 * @requires ../src/ui/game/session-manager.js
 * @requires ../src/ui/game/session-tracker.js
 */

// ═══════════════════════════════════════════════════════════════
// Helpers de test
// ═══════════════════════════════════════════════════════════════

function createSessionTestPlayer(overrides = {}) {
  return {
    id: 'player_session_test',
    name: 'Test Player',
    badges: [],
    stats: {
      totalXP: 100,
      totalCardsPlayed: 10,
      totalSessions: 5,
      totalGreenCards: 3,
      currentStreak: 1,
      longestGreenStreak: 5,
      cardsBySubject: {},
      playedDeckIds: [],
      uniqueDecksPlayed: 0,
      xpHistory: [],
      lastPlayedAt: null,
      fastestCorrectAnswer: Infinity,
      fastAnswers: 0,
      redemptionCards: 0,
      ...overrides.stats
    },
    ...overrides
  };
}

function createSessionTestResult(overrides = {}) {
  return {
    isCorrect: true,
    newBox: 'green',
    xpEarned: 3,
    responseTimeMs: 1500,
    ...overrides
  };
}

function createSessionTestSession(overrides = {}) {
  return {
    deckId: 'deck_test',
    type: 'standard',
    cards: [
      { id: 'card_1', question: 'Q1', answer: 'A1', box: 'never_played' },
      { id: 'card_2', question: 'Q2', answer: 'A2', box: 'purple' },
      { id: 'card_3', question: 'Q3', answer: 'A3', box: 'orange' }
    ],
    currentIndex: 0,
    isShowingFeedback: true,
    cardStartTime: Date.now(),
    lastResult: createSessionTestResult(),
    stats: {
      cardsPlayed: 1,
      correctAnswers: 1,
      totalXpEarned: 3,
      maxGreenStreak: 1,
      currentGreenStreak: 1
    },
    ...overrides
  };
}

function createSessionTestDeck(overrides = {}) {
  return {
    id: 'deck_test',
    name: 'Test Deck',
    tags: ['test', 'math'],
    cards: [
      { id: 'card_1', question: 'Q1', answer: 'A1', box: 'never_played' },
      { id: 'card_2', question: 'Q2', answer: 'A2', box: 'purple' },
      { id: 'card_3', question: 'Q3', answer: 'A3', box: 'orange' }
    ],
    ...overrides
  };
}

// ═══════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════

describe('GameSessionManager', () => {

  // ═══════════════════════════════════════════════════════════════
  // Module existence
  // ═══════════════════════════════════════════════════════════════

  describe('Module', () => {
    it('should be defined', () => {
      expect(typeof GameSessionManager).toBe('object');
    });

    it('should have nextCard method', () => {
      expect(typeof GameSessionManager.nextCard).toBe('function');
    });

    it('should have endSession method', () => {
      expect(typeof GameSessionManager.endSession).toBe('function');
    });

    it('should have private helper methods', () => {
      expect(typeof GameSessionManager._updatePlayerStats).toBe('function');
      expect(typeof GameSessionManager._trackSubjectProgress).toBe('function');
      expect(typeof GameSessionManager._trackUniqueDecks).toBe('function');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _updatePlayerStats() - Stats du joueur
  // ═══════════════════════════════════════════════════════════════

  describe('_updatePlayerStats', () => {
    it('should add XP from result to player', () => {
      const player = createSessionTestPlayer();
      const result = createSessionTestResult({ xpEarned: 5 });
      const session = createSessionTestSession({ stats: { maxGreenStreak: 0 } });
      const initialXP = player.stats.totalXP;

      GameSessionManager._updatePlayerStats(player, result, session);

      expect(player.stats.totalXP).toBe(initialXP + 5);
    });

    it('should increment totalCardsPlayed', () => {
      const player = createSessionTestPlayer();
      const result = createSessionTestResult();
      const session = createSessionTestSession({ stats: { maxGreenStreak: 0 } });
      const initialCount = player.stats.totalCardsPlayed;

      GameSessionManager._updatePlayerStats(player, result, session);

      expect(player.stats.totalCardsPlayed).toBe(initialCount + 1);
    });

    it('should update lastPlayedAt timestamp', () => {
      const player = createSessionTestPlayer();
      const result = createSessionTestResult();
      const session = createSessionTestSession({ stats: { maxGreenStreak: 0 } });

      GameSessionManager._updatePlayerStats(player, result, session);

      expect(player.stats.lastPlayedAt).toBeDefined();
      expect(player.stats.lastPlayedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should track fastest correct answer', () => {
      const player = createSessionTestPlayer({ stats: { fastestCorrectAnswer: 2000 } });
      const result = createSessionTestResult({ isCorrect: true, responseTimeMs: 500 });
      const session = createSessionTestSession({ stats: { maxGreenStreak: 0 } });

      GameSessionManager._updatePlayerStats(player, result, session);

      expect(player.stats.fastestCorrectAnswer).toBe(500);
    });

    it('should not update fastest if slower', () => {
      const player = createSessionTestPlayer({ stats: { fastestCorrectAnswer: 300 } });
      const result = createSessionTestResult({ isCorrect: true, responseTimeMs: 500 });
      const session = createSessionTestSession({ stats: { maxGreenStreak: 0 } });

      GameSessionManager._updatePlayerStats(player, result, session);

      expect(player.stats.fastestCorrectAnswer).toBe(300);
    });

    it('should not track fastest for incorrect answers', () => {
      const player = createSessionTestPlayer({ stats: { fastestCorrectAnswer: 2000 } });
      const result = createSessionTestResult({ isCorrect: false, responseTimeMs: 100 });
      const session = createSessionTestSession({ stats: { maxGreenStreak: 0 } });

      GameSessionManager._updatePlayerStats(player, result, session);

      expect(player.stats.fastestCorrectAnswer).toBe(2000);
    });

    it('should track fast answers under 2 seconds', () => {
      const player = createSessionTestPlayer({ stats: { fastAnswers: 5 } });
      const result = createSessionTestResult({ isCorrect: true, responseTimeMs: 1500 });
      const session = createSessionTestSession({ stats: { maxGreenStreak: 0 } });

      GameSessionManager._updatePlayerStats(player, result, session);

      expect(player.stats.fastAnswers).toBe(6);
    });

    it('should not track fast answers over 2 seconds', () => {
      const player = createSessionTestPlayer({ stats: { fastAnswers: 5 } });
      const result = createSessionTestResult({ isCorrect: true, responseTimeMs: 2500 });
      const session = createSessionTestSession({ stats: { maxGreenStreak: 0 } });

      GameSessionManager._updatePlayerStats(player, result, session);

      expect(player.stats.fastAnswers).toBe(5);
    });

    it('should update longestGreenStreak from session', () => {
      const player = createSessionTestPlayer({ stats: { longestGreenStreak: 3 } });
      const result = createSessionTestResult();
      const session = createSessionTestSession({ stats: { maxGreenStreak: 10 } });

      GameSessionManager._updatePlayerStats(player, result, session);

      expect(player.stats.longestGreenStreak).toBe(10);
    });

    it('should not decrease longestGreenStreak', () => {
      const player = createSessionTestPlayer({ stats: { longestGreenStreak: 15 } });
      const result = createSessionTestResult();
      const session = createSessionTestSession({ stats: { maxGreenStreak: 5 } });

      GameSessionManager._updatePlayerStats(player, result, session);

      expect(player.stats.longestGreenStreak).toBe(15);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _trackSubjectProgress() - Tracking par matière
  // ═══════════════════════════════════════════════════════════════

  describe('_trackSubjectProgress', () => {
    const green = { newBox: 'green' };

    it('should track mastered (green) cards by subject from deck tags', () => {
      const player = createSessionTestPlayer();
      const deck = createSessionTestDeck({ tags: ['math', 'algebra'] });

      GameSessionManager._trackSubjectProgress(player, deck, deck.cards[0], green);

      expect(player.stats.masteredBySubject.maths).toEqual(['deck_test/card_1']);
    });

    it('should count each distinct card once', () => {
      const player = createSessionTestPlayer();
      const deck = createSessionTestDeck({ tags: ['math'] });

      GameSessionManager._trackSubjectProgress(player, deck, deck.cards[0], green);
      GameSessionManager._trackSubjectProgress(player, deck, deck.cards[0], green);
      GameSessionManager._trackSubjectProgress(player, deck, deck.cards[1], green);

      expect(player.stats.masteredBySubject.maths.length).toBe(2);
    });

    it('should ignore cards that did not reach the green box', () => {
      const player = createSessionTestPlayer();
      const deck = createSessionTestDeck({ tags: ['math'] });

      GameSessionManager._trackSubjectProgress(player, deck, deck.cards[0], { newBox: 'orange' });

      expect(player.stats.masteredBySubject).toBeUndefined();
    });

    it('should initialize masteredBySubject if missing', () => {
      const player = createSessionTestPlayer();
      delete player.stats.masteredBySubject;
      const deck = createSessionTestDeck({ tags: ['science'] });

      GameSessionManager._trackSubjectProgress(player, deck, deck.cards[0], green);

      expect(player.stats.masteredBySubject.sciences.length).toBe(1);
    });

    it('should handle deck without tags', () => {
      const player = createSessionTestPlayer();
      const deck = createSessionTestDeck({ tags: null });

      expect(() => GameSessionManager._trackSubjectProgress(player, deck, deck.cards[0], green)).not.toThrow();
    });

    it('should handle empty tags array', () => {
      const player = createSessionTestPlayer();
      const deck = createSessionTestDeck({ tags: [] });

      expect(() => GameSessionManager._trackSubjectProgress(player, deck, deck.cards[0], green)).not.toThrow();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _trackUniqueDecks() - Tracking decks uniques
  // ═══════════════════════════════════════════════════════════════

  describe('_trackUniqueDecks', () => {
    it('should add new deck to playedDeckIds', () => {
      const player = createSessionTestPlayer({ stats: { playedDeckIds: [] } });
      const deck = createSessionTestDeck({ id: 'deck_new' });

      GameSessionManager._trackUniqueDecks(player, deck);

      expect(player.stats.playedDeckIds).toContain('deck_new');
    });

    it('should increment uniqueDecksPlayed for new deck', () => {
      const player = createSessionTestPlayer({ stats: { playedDeckIds: [], uniqueDecksPlayed: 0 } });
      const deck = createSessionTestDeck({ id: 'deck_new' });

      GameSessionManager._trackUniqueDecks(player, deck);

      expect(player.stats.uniqueDecksPlayed).toBe(1);
    });

    it('should not duplicate existing deck in list', () => {
      const player = createSessionTestPlayer({
        stats: { playedDeckIds: ['deck_existing'], uniqueDecksPlayed: 1 }
      });
      const deck = createSessionTestDeck({ id: 'deck_existing' });

      GameSessionManager._trackUniqueDecks(player, deck);

      expect(player.stats.playedDeckIds.length).toBe(1);
      expect(player.stats.uniqueDecksPlayed).toBe(1);
    });

    it('should initialize playedDeckIds if missing', () => {
      const player = createSessionTestPlayer();
      delete player.stats.playedDeckIds;
      const deck = createSessionTestDeck({ id: 'deck_first' });

      GameSessionManager._trackUniqueDecks(player, deck);

      expect(player.stats.playedDeckIds).toBeDefined();
      expect(player.stats.playedDeckIds).toContain('deck_first');
    });

    it('should handle null deck gracefully', () => {
      const player = createSessionTestPlayer({ stats: { playedDeckIds: ['existing'] } });

      expect(() => GameSessionManager._trackUniqueDecks(player, null)).not.toThrow();
      expect(player.stats.playedDeckIds.length).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _addXpHistory() - Historique XP
  // ═══════════════════════════════════════════════════════════════

  describe('_addXpHistory', () => {
    it('should add XP entry to history', () => {
      const player = createSessionTestPlayer({ stats: { xpHistory: [] } });
      const session = createSessionTestSession({ stats: { totalXpEarned: 50 } });
      const deck = createSessionTestDeck({ name: 'Test Deck' });

      GameSessionManager._addXpHistory(player, session, deck);

      expect(player.stats.xpHistory.length).toBe(1);
      expect(player.stats.xpHistory[0].amount).toBe(50);
      expect(player.stats.xpHistory[0].source).toBe('session');
      expect(player.stats.xpHistory[0].details).toBe('Test Deck');
    });

    it('should not add entry if no XP earned', () => {
      const player = createSessionTestPlayer({ stats: { xpHistory: [] } });
      const session = createSessionTestSession({ stats: { totalXpEarned: 0 } });
      const deck = createSessionTestDeck();

      GameSessionManager._addXpHistory(player, session, deck);

      expect(player.stats.xpHistory.length).toBe(0);
    });

    it('should include date in XP entry', () => {
      const player = createSessionTestPlayer({ stats: { xpHistory: [] } });
      const session = createSessionTestSession({ stats: { totalXpEarned: 25 } });
      const deck = createSessionTestDeck();

      GameSessionManager._addXpHistory(player, session, deck);

      expect(player.stats.xpHistory[0].date).toBeDefined();
    });

    it('should handle null deck', () => {
      const player = createSessionTestPlayer({ stats: { xpHistory: [] } });
      const session = createSessionTestSession({ stats: { totalXpEarned: 10 } });

      GameSessionManager._addXpHistory(player, session, null);

      expect(player.stats.xpHistory[0].details).toBe('Session');
    });
  });
});
