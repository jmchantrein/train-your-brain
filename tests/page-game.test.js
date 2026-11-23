/**
 * Tests pour Pages.game
 * Page principale de jeu avec système Leitner
 */

describe('Pages.game', () => {

  // ═══════════════════════════════════════════════════════════════
  // SETUP & HELPERS
  // ═══════════════════════════════════════════════════════════════

  let mockState;
  let mockSession;
  let mockPlayer;
  let mockDeck;

  beforeEach(() => {
    // Reset state
    mockPlayer = createTestPlayer({
      stats: {
        totalXP: 100,
        totalCardsPlayed: 10,
        totalSessions: 2,
        currentStreak: 3,
        longestStreak: 5,
        longestGreenStreak: 4,
        totalGreenCards: 5,
        xpHistory: []
      }
    });

    mockDeck = createTestDeck({
      id: 'test_deck',
      cards: [
        createTestCard({ id: 'card1', question: 'Q1', answer: 'A1', box: 'never_played' }),
        createTestCard({ id: 'card2', question: 'Q2', answer: 'A2', box: 'purple' }),
        createTestCard({ id: 'card3', question: 'Q3', answer: 'A3', box: 'orange' })
      ]
    });

    mockSession = {
      deckId: 'test_deck',
      startedAt: new Date().toISOString(),
      endedAt: null,
      cards: [...mockDeck.cards],
      currentIndex: 0,
      cardStartTime: Date.now(),
      isShowingFeedback: false,
      lastResult: null,
      results: [],
      stats: {
        cardsPlayed: 0,
        correctAnswers: 0,
        currentGreenStreak: 0,
        maxGreenStreak: 0,
        totalXpEarned: 0
      }
    };

    mockState = {
      player: mockPlayer,
      decks: [mockDeck],
      currentSession: mockSession
    };
  });

  // ═══════════════════════════════════════════════════════════════
  // _getPileCounts() - Compter les cartes dans chaque pile
  // ═══════════════════════════════════════════════════════════════

  describe('_getPileCounts', () => {
    it('should return zero counts for empty session', () => {
      const session = createTestSession();
      const counts = Pages.game._getPileCounts(session);

      expect(counts.purple).toBe(0);
      expect(counts.orange).toBe(0);
      expect(counts.green).toBe(0);
    });

    it('should count cards correctly', () => {
      const session = createTestSession({
        results: [
          { newBox: 'purple' },
          { newBox: 'purple' },
          { newBox: 'orange' },
          { newBox: 'green' }
        ]
      });

      const counts = Pages.game._getPileCounts(session);

      expect(counts.purple).toBe(2);
      expect(counts.orange).toBe(1);
      expect(counts.green).toBe(1);
    });

    it('should ignore invalid box values', () => {
      const session = createTestSession({
        results: [
          { newBox: 'purple' },
          { newBox: 'invalid' },
          { newBox: 'green' }
        ]
      });

      const counts = Pages.game._getPileCounts(session);

      expect(counts.purple).toBe(1);
      expect(counts.orange).toBe(0);
      expect(counts.green).toBe(1);
    });

    it('should handle all cards in same pile', () => {
      const session = createTestSession({
        results: [
          { newBox: 'green' },
          { newBox: 'green' },
          { newBox: 'green' }
        ]
      });

      const counts = Pages.game._getPileCounts(session);

      expect(counts.purple).toBe(0);
      expect(counts.orange).toBe(0);
      expect(counts.green).toBe(3);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _renderPileStack() - Rendu visuel d'un tas de cartes
  // ═══════════════════════════════════════════════════════════════

  describe('_renderPileStack', () => {
    it('should render correct number of visible cards (max 5)', () => {
      const html = Pages.game._renderPileStack(3, 'purple');
      const matches = html.match(/game__pile-card--purple/g);
      expect(matches).toHaveLength(3);
    });

    it('should cap at 5 visible cards', () => {
      const html = Pages.game._renderPileStack(10, 'green');
      const matches = html.match(/game__pile-card--green/g);
      expect(matches).toHaveLength(5);
    });

    it('should render no cards when count is 0', () => {
      const html = Pages.game._renderPileStack(0, 'orange');
      expect(html).toBe('');
    });

    it('should apply different colors', () => {
      const purpleHtml = Pages.game._renderPileStack(1, 'purple');
      expect(purpleHtml).toContain('game__pile-card--purple');

      const orangeHtml = Pages.game._renderPileStack(1, 'orange');
      expect(orangeHtml).toContain('game__pile-card--orange');

      const greenHtml = Pages.game._renderPileStack(1, 'green');
      expect(greenHtml).toContain('game__pile-card--green');
    });

    it('should apply rotation transforms', () => {
      const html = Pages.game._renderPileStack(3, 'blue');
      expect(html).toContain('rotate(');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _renderInputByType() - Rendu des inputs selon le type
  // ═══════════════════════════════════════════════════════════════

  // Extrait de Pages.game vers GameCardTypeRenderer.renderByType()
  describe('GameCardTypeRenderer.renderByType', () => {
    it('should render text input for text type', () => {
      const card = createTestCard({ type: 'text' });
      const html = GameCardTypeRenderer.renderByType(card);

      expect(html).toContain('type="text"');
      expect(html).toContain('id="answer-input"');
    });

    it('should render number input for numeric type', () => {
      const card = createTestCard({ type: 'numeric' });
      const html = GameCardTypeRenderer.renderByType(card);

      expect(html).toContain('type="number"');
      expect(html).toContain('id="answer-input"');
    });

    it('should render MCQ options', () => {
      const card = createTestCard({
        type: 'mcq',
        single: true, // radio uniquement si single === true (défaut : checkbox)
        choices: [
          { id: 'a', text: 'Choice A' },
          { id: 'b', text: 'Choice B' }
        ]
      });
      const html = GameCardTypeRenderer.renderByType(card);

      expect(html).toContain('type="radio"');
      expect(html).toContain('Choice A');
      expect(html).toContain('Choice B');
    });

    it('should render true/false options', () => {
      const card = createTestCard({ type: 'truefalse' });
      const html = GameCardTypeRenderer.renderByType(card);

      expect(html).toContain('value="true"');
      expect(html).toContain('value="false"');
    });

    it('should render cloze inputs', () => {
      const card = createTestCard({
        type: 'cloze',
        question: 'The {{blank_0}} is blue.',
        blanks: [{ type: 'text', answer: 'sky' }]
      });
      const html = GameCardTypeRenderer.renderByType(card);

      expect(html).toContain('game-card__cloze');
    });

    it('should render matching pairs', () => {
      const card = createTestCard({
        type: 'matching',
        pairs: [
          { id: 'p1', premise: 'Dog', response: 'Animal' },
          { id: 'p2', premise: 'Red', response: 'Color' }
        ]
      });
      const html = GameCardTypeRenderer.renderByType(card);

      expect(html).toContain('game-card__matching');
      expect(html).toContain('Dog');
      expect(html).toContain('Red');
    });

    it('should default to text input for unknown type', () => {
      const card = createTestCard({ type: 'unknown' });
      const html = GameCardTypeRenderer.renderByType(card);

      expect(html).toContain('type="text"');
    });

    it('should render MCQ with checkboxes by default and when single=false', () => {
      const defaultCard = createTestCard({ type: 'mcq', choices: [{ id: 'a', text: 'A' }] });
      expect(GameCardTypeRenderer.renderByType(defaultCard)).toContain('type="checkbox"');

      const card = createTestCard({
        type: 'mcq',
        single: false,
        choices: [
          { id: 'a', text: 'Option A' },
          { id: 'b', text: 'Option B' }
        ]
      });
      const html = GameCardTypeRenderer.renderByType(card);

      expect(html).toContain('type="checkbox"');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _renderCardFront() - Rendu de la face avant de la carte
  // ═══════════════════════════════════════════════════════════════

  describe('_renderCardFront', () => {
    it('should render question text', () => {
      const card = createTestCard({ question: 'What is 2+2?' });
      const html = Pages.game._renderCardFront(card);

      expect(html).toContain('What is 2+2?');
    });

    it('should escape HTML in question', () => {
      const card = createTestCard({ question: '<script>alert("xss")</script>' });
      const html = Pages.game._renderCardFront(card);

      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should render image when imageUrl is present', () => {
      const card = createTestCard({
        question: 'What is this?',
        imageUrl: 'data:image/png;base64,abc123'
      });
      const html = Pages.game._renderCardFront(card);

      expect(html).toContain('<img');
      expect(html).toContain('data:image/png;base64,abc123');
    });

    it('should render audio when audioUrl is present', () => {
      const card = createTestCard({
        question: 'Listen and answer',
        audioUrl: 'data:audio/mp3;base64,xyz789'
      });
      const html = Pages.game._renderCardFront(card);

      expect(html).toContain('<audio');
      expect(html).toContain('data:audio/mp3;base64,xyz789');
    });

    it('should include submit button', () => {
      const card = createTestCard({ question: 'Q1' });
      const html = Pages.game._renderCardFront(card);

      expect(html).toContain('id="submit-btn"');
      expect(html).toContain('game__card-submit');
    });

    it('should render appropriate input for card type', () => {
      const textCard = createTestCard({ type: 'text' });
      const textHtml = Pages.game._renderCardFront(textCard);
      expect(textHtml).toContain('type="text"');

      const mcqCard = createTestCard({
        type: 'mcq',
        single: true,
        choices: [{ id: 'a', text: 'A' }]
      });
      const mcqHtml = Pages.game._renderCardFront(mcqCard);
      expect(mcqHtml).toContain('type="radio"');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _renderCardBack() - Rendu de la face arrière (feedback)
  // ═══════════════════════════════════════════════════════════════

  describe('_renderCardBack', () => {
    it('should return empty string when no result', () => {
      const card = createTestCard();
      const html = Pages.game._renderCardBack(card, null);

      expect(html).toBe('');
    });

    it('should render purple feedback for purple box', () => {
      const card = createTestCard({ answer: 'correct answer' });
      const result = { newBox: 'purple', isCorrect: false, xpEarned: 1 };
      const html = Pages.game._renderCardBack(card, result);

      expect(html).toContain('purple');
      expect(html).toContain('💜');
    });

    it('should render orange feedback for orange box', () => {
      const card = createTestCard({ answer: 'correct answer' });
      const result = { newBox: 'orange', isCorrect: true, xpEarned: 2 };
      const html = Pages.game._renderCardBack(card, result);

      expect(html).toContain('orange');
      expect(html).toContain('🧡');
    });

    it('should render green feedback for green box', () => {
      const card = createTestCard({ answer: 'correct answer' });
      const result = { newBox: 'green', isCorrect: true, xpEarned: 3 };
      const html = Pages.game._renderCardBack(card, result);

      expect(html).toContain('green');
      expect(html).toContain('💚');
    });

    it('should display correct answer', () => {
      const card = createTestCard({ answer: '42' });
      const result = { newBox: 'green', isCorrect: true, xpEarned: 3 };
      const html = Pages.game._renderCardBack(card, result);

      expect(html).toContain('42');
    });

    it('should display XP earned', () => {
      const card = createTestCard();
      const result = { newBox: 'green', isCorrect: true, xpEarned: 5 };
      const html = Pages.game._renderCardBack(card, result);

      expect(html).toContain('+5 XP');
    });

    it('should include next button', () => {
      const card = createTestCard();
      const result = { newBox: 'green', isCorrect: true, xpEarned: 3 };
      const html = Pages.game._renderCardBack(card, result);

      expect(html).toContain('id="next-btn"');
    });

    it('should render card feedback when available and incorrect', () => {
      const card = createTestCard({
        answer: '42',
        feedback: 'Think about the ultimate question!'
      });
      const result = { newBox: 'purple', isCorrect: false, xpEarned: 1 };
      const html = Pages.game._renderCardBack(card, result);

      expect(html).toContain('Think about the ultimate question!');
    });

    it('should render differentiated feedback when available', () => {
      const card = createTestCard({
        answer: '42',
        feedback: {
          correct: 'Great job!',
          incorrect: 'Try again!'
        }
      });

      const wrongResult = { newBox: 'purple', isCorrect: false, xpEarned: 1 };
      const wrongHtml = Pages.game._renderCardBack(card, wrongResult);
      expect(wrongHtml).toContain('Try again!');

      const rightResult = { newBox: 'green', isCorrect: true, xpEarned: 3 };
      const rightHtml = Pages.game._renderCardBack(card, rightResult);
      expect(rightHtml).toContain('Great job!');
    });

    it('should escape HTML in answer', () => {
      const card = createTestCard({ answer: '<script>xss</script>' });
      const result = { newBox: 'green', isCorrect: true, xpEarned: 3 };
      const html = Pages.game._renderCardBack(card, result);

      expect(html).not.toContain('<script>xss</script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _updateCard() - Met à jour une carte après réponse
  // ═══════════════════════════════════════════════════════════════

  // Extrait de Pages.game vers GameSessionTracker.updateCard()
  describe('GameSessionTracker.updateCard', () => {
    it('should update card box', () => {
      const card = createTestCard({ box: 'never_played' });
      const result = { isCorrect: true, newBox: 'green', responseTimeMs: 2000 };

      const updated = GameSessionTracker.updateCard(card, result);

      expect(updated.box).toBe('green');
    });

    it('should increment timesPlayed', () => {
      const card = createTestCard({ timesPlayed: 5 });
      const result = { isCorrect: true, newBox: 'green', responseTimeMs: 2000 };

      const updated = GameSessionTracker.updateCard(card, result);

      expect(updated.timesPlayed).toBe(6);
    });

    it('should increment timesCorrect when correct', () => {
      const card = createTestCard({ timesCorrect: 3 });
      const result = { isCorrect: true, newBox: 'green', responseTimeMs: 2000 };

      const updated = GameSessionTracker.updateCard(card, result);

      expect(updated.timesCorrect).toBe(4);
    });

    it('should not increment timesCorrect when incorrect', () => {
      const card = createTestCard({ timesCorrect: 3 });
      const result = { isCorrect: false, newBox: 'purple', responseTimeMs: 2000 };

      const updated = GameSessionTracker.updateCard(card, result);

      expect(updated.timesCorrect).toBe(3);
    });

    it('should update bestResponseTimeMs', () => {
      const card = createTestCard({ bestResponseTimeMs: 5000 });
      const result = { isCorrect: true, newBox: 'green', responseTimeMs: 3000 };

      const updated = GameSessionTracker.updateCard(card, result);

      expect(updated.bestResponseTimeMs).toBe(3000);
    });

    it('should keep bestResponseTimeMs if current is slower', () => {
      const card = createTestCard({ bestResponseTimeMs: 2000 });
      const result = { isCorrect: true, newBox: 'green', responseTimeMs: 5000 };

      const updated = GameSessionTracker.updateCard(card, result);

      expect(updated.bestResponseTimeMs).toBe(2000);
    });

    it('should update lastResponseTimeMs', () => {
      const card = createTestCard({ lastResponseTimeMs: 1000 });
      const result = { isCorrect: true, newBox: 'green', responseTimeMs: 2500 };

      const updated = GameSessionTracker.updateCard(card, result);

      expect(updated.lastResponseTimeMs).toBe(2500);
    });

    it('should set restUntil for green cards', () => {
      const card = createTestCard({ box: 'never_played', latencyThreshold: null });
      const result = { isCorrect: true, newBox: 'green', responseTimeMs: 2000 };

      const updated = GameSessionTracker.updateCard(card, result);

      expect(updated.restUntil).not.toBeNull();
      expect(updated.restDays).toBeGreaterThan(0);
    });

    it('should not set restUntil for non-green cards', () => {
      const card = createTestCard({ box: 'purple' });
      const result = { isCorrect: false, newBox: 'purple', responseTimeMs: 2000 };

      const updated = GameSessionTracker.updateCard(card, result);

      expect(updated.restUntil).toBeNull();
    });

    it('should not mutate original card', () => {
      const card = createTestCard({ box: 'purple', timesPlayed: 5 });
      const originalBox = card.box;
      const originalTimesPlayed = card.timesPlayed;

      const result = { isCorrect: true, newBox: 'green', responseTimeMs: 2000 };
      GameSessionTracker.updateCard(card, result);

      expect(card.box).toBe(originalBox);
      expect(card.timesPlayed).toBe(originalTimesPlayed);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _updateDailyStreak() - Met à jour le streak quotidien
  // ═══════════════════════════════════════════════════════════════

  // Extrait de Pages.game vers GameSessionTracker.updateDailyStreak()
  describe('GameSessionTracker.updateDailyStreak', () => {
    it('should initialize streak to 1 for first play', () => {
      const player = createTestPlayer({
        stats: { lastPlayedAt: null, currentStreak: 0 }
      });

      GameSessionTracker.updateDailyStreak(player);

      expect(player.stats.currentStreak).toBe(1);
    });

    it('should not change streak if played today', () => {
      const today = new Date().toISOString();
      const player = createTestPlayer({
        stats: { lastPlayedAt: today, currentStreak: 5 }
      });

      GameSessionTracker.updateDailyStreak(player);

      expect(player.stats.currentStreak).toBe(5);
    });

    it('should increment streak if played yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const player = createTestPlayer({
        stats: {
          lastPlayedAt: yesterday.toISOString(),
          currentStreak: 3
        }
      });

      GameSessionTracker.updateDailyStreak(player);

      expect(player.stats.currentStreak).toBe(4);
    });

    it('should reset streak to 1 if gap > 1 day', () => {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const player = createTestPlayer({
        stats: {
          lastPlayedAt: threeDaysAgo.toISOString(),
          currentStreak: 10
        }
      });

      GameSessionTracker.updateDailyStreak(player);

      expect(player.stats.currentStreak).toBe(1);
    });

    it('should update longestStreak when current exceeds it', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const player = createTestPlayer({
        stats: {
          lastPlayedAt: yesterday.toISOString(),
          currentStreak: 9,
          longestStreak: 9
        }
      });

      GameSessionTracker.updateDailyStreak(player);

      expect(player.stats.currentStreak).toBe(10);
      expect(player.stats.longestStreak).toBe(10);
    });

    it('should not update longestStreak when current is lower', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const player = createTestPlayer({
        stats: {
          lastPlayedAt: yesterday.toISOString(),
          currentStreak: 5,
          longestStreak: 15
        }
      });

      GameSessionTracker.updateDailyStreak(player);

      expect(player.stats.longestStreak).toBe(15);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _trackSecretStats() - Tracker des stats pour badges secrets
  // ═══════════════════════════════════════════════════════════════

  // Extrait de Pages.game vers GameSecretStats.track()
  describe('GameSecretStats.track', () => {
    it('should track evening sessions (6pm to 9pm), not night sessions', () => {
      const player = createTestPlayer();
      const session = createTestSession();

      const originalDate = Date;
      global.Date = class extends originalDate {
        getHours() { return 19; }
        getMinutes() { return 30; }
        getDay() { return 3; } // Wednesday
      };

      GameSecretStats.track(player, session);

      expect(player.stats.nightSessions).toBe(1);

      // Playing at 2am earns nothing (no encouragement to play at night)
      const sleeper = createTestPlayer();
      global.Date = class extends originalDate {
        getHours() { return 2; }
        getMinutes() { return 30; }
        getDay() { return 3; }
      };
      GameSecretStats.track(sleeper, createTestSession());
      expect(sleeper.stats.nightSessions || 0).toBe(0);

      global.Date = originalDate;
    });

    it('should track early sessions (6am to 8am)', () => {
      const player = createTestPlayer();
      const session = createTestSession();

      const originalDate = Date;
      global.Date = class extends originalDate {
        getHours() { return 6; }
        getMinutes() { return 0; }
        getDay() { return 3; }
      };

      GameSecretStats.track(player, session);

      expect(player.stats.earlySessions).toBe(1);

      global.Date = originalDate;
    });

    it('should track golden hour (12:34)', () => {
      const player = createTestPlayer();
      const session = createTestSession();

      const originalDate = Date;
      global.Date = class extends originalDate {
        getHours() { return 12; }
        getMinutes() { return 34; }
        getDay() { return 3; }
      };

      GameSecretStats.track(player, session);

      expect(player.stats.goldenHourPlayed).toBe(true);

      global.Date = originalDate;
    });

    it('should track perfect sessions (100% accuracy, min 10 cards)', () => {
      const player = createTestPlayer();
      const session = createTestSession({
        stats: {
          cardsPlayed: 15,
          correctAnswers: 15
        }
      });

      const originalDate = Date;
      global.Date = class extends originalDate {
        getHours() { return 14; }
        getMinutes() { return 0; }
        getDay() { return 3; }
      };

      GameSecretStats.track(player, session);

      expect(player.stats.perfectSessions).toBe(1);

      global.Date = originalDate;
    });

    it('should not track perfect session if < 10 cards', () => {
      const player = createTestPlayer();
      const session = createTestSession({
        stats: {
          cardsPlayed: 5,
          correctAnswers: 5
        }
      });

      const originalDate = Date;
      global.Date = class extends originalDate {
        getHours() { return 14; }
        getMinutes() { return 0; }
        getDay() { return 3; }
      };

      GameSecretStats.track(player, session);

      expect(player.stats.perfectSessions).toBeUndefined();

      global.Date = originalDate;
    });

    it('should track longest session', () => {
      const player = createTestPlayer({
        stats: { longestSession: 20 }
      });
      const session = createTestSession({
        stats: { cardsPlayed: 30 }
      });

      const originalDate = Date;
      global.Date = class extends originalDate {
        getHours() { return 14; }
        getMinutes() { return 0; }
        getDay() { return 3; }
      };

      GameSecretStats.track(player, session);

      expect(player.stats.longestSession).toBe(30);

      global.Date = originalDate;
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _getWeekNumber() - Calcul du numéro de semaine ISO
  // ═══════════════════════════════════════════════════════════════

  // Extrait de Pages.game vers GameSecretStats._getWeekNumber()
  describe('GameSecretStats._getWeekNumber', () => {
    it('should calculate ISO week number correctly', () => {
      // January 1, 2025 is a Wednesday, week 1
      const date1 = new Date('2025-01-01');
      const week1 = GameSecretStats._getWeekNumber(date1);
      expect(week1).toBe(1);

      // January 8, 2025 is week 2
      const date2 = new Date('2025-01-08');
      const week2 = GameSecretStats._getWeekNumber(date2);
      expect(week2).toBe(2);
    });

    it('should handle year boundaries correctly', () => {
      // December 31, 2024 might be in week 1 of 2025
      const date = new Date('2024-12-31');
      const weekNum = GameSecretStats._getWeekNumber(date);
      expect(weekNum).toBeGreaterThan(0);
      expect(weekNum).toBeLessThanOrEqual(53);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // render() - Rendu de la page complète
  // ═══════════════════════════════════════════════════════════════

  describe('render', () => {
    it('should render loading state when no session', () => {
      const state = { currentSession: null };
      const html = Pages.game.render(state);

      expect(html).toContain('game__loading');
    });

    it('should render game page when session exists', () => {
      const html = Pages.game.render(mockState);

      expect(html).toContain('page--game');
      expect(html).toContain('game__table');
    });

    it('should render progress bar', () => {
      const html = Pages.game.render(mockState);

      expect(html).toContain('game__progress-bar');
      expect(html).toContain('game__progress-fill');
    });

    it('should show current card index', () => {
      mockSession.currentIndex = 2;
      const html = Pages.game.render(mockState);

      expect(html).toContain('3'); // currentIndex + 1
      expect(html).toContain(mockSession.cards.length.toString());
    });

    it('should render three destination piles', () => {
      const html = Pages.game.render(mockState);

      expect(html).toContain('game__pile--purple');
      expect(html).toContain('game__pile--orange');
      expect(html).toContain('game__pile--green');
    });

    it('should render draw pile', () => {
      const html = Pages.game.render(mockState);

      expect(html).toContain('game__draw-pile');
    });

    it('should show streak when >= 2', () => {
      mockSession.stats.currentGreenStreak = 3;
      const html = Pages.game.render(mockState);

      expect(html).toContain('game__streak');
      expect(html).toContain('🔥');
      expect(html).toContain('3');
    });

    it('should not show streak when < 2', () => {
      mockSession.stats.currentGreenStreak = 1;
      const html = Pages.game.render(mockState);

      expect(html).not.toContain('game__streak');
    });

    it('should render card front when not showing feedback', () => {
      mockSession.isShowingFeedback = false;
      const html = Pages.game.render(mockState);

      expect(html).toContain('game__flipcard');
      expect(html).not.toContain('game__flipcard--flipped');
    });

    it('should render card back when showing feedback', () => {
      mockSession.isShowingFeedback = true;
      mockSession.lastResult = {
        isCorrect: true,
        newBox: 'green',
        xpEarned: 3
      };
      const html = Pages.game.render(mockState);

      expect(html).toContain('game__flipcard--flipped');
    });

    it('should show session stats in sidebar', () => {
      mockSession.stats.correctAnswers = 5;
      mockSession.stats.totalXpEarned = 15;
      const html = Pages.game.render(mockState);

      // Les stats de session sont dans la sidebar (plus de footer) : valeur + icône
      expect(html).toContain('<span class="game__sidebar-stat-value">5</span>'); // correctAnswers
      expect(html).toContain('<span class="game__sidebar-stat-value">15</span>'); // totalXpEarned
    });

    it('should calculate progress percent correctly', () => {
      mockSession.currentIndex = 1;
      mockSession.cards = [1, 2, 3, 4]; // 4 cards
      mockSession.isShowingFeedback = false;

      const html = Pages.game.render(mockState);

      // Progress: (1 + 0) / 4 * 100 = 25%
      expect(html).toContain('width: 25%');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Integration: Scenario tests
  // ═══════════════════════════════════════════════════════════════

  describe('Integration Scenarios', () => {
    it('should handle complete card flow: never_played -> green', () => {
      const card = createTestCard({
        box: 'never_played',
        latencyThreshold: null,
        timesPlayed: 0,
        timesCorrect: 0
      });

      const result = {
        isCorrect: true,
        newBox: 'green',
        responseTimeMs: 2000
      };

      const updated = GameSessionTracker.updateCard(card, result);

      expect(updated.box).toBe('green');
      expect(updated.timesPlayed).toBe(1);
      expect(updated.timesCorrect).toBe(1);
      expect(updated.latencyThreshold).toBeGreaterThan(0);
      expect(updated.restUntil).not.toBeNull();
    });

    it('should handle incorrect answer flow: orange -> purple', () => {
      const card = createTestCard({
        box: 'orange',
        latencyThreshold: 3,
        timesPlayed: 5,
        timesCorrect: 4
      });

      const result = {
        isCorrect: false,
        newBox: 'purple',
        responseTimeMs: 2000
      };

      const updated = GameSessionTracker.updateCard(card, result);

      expect(updated.box).toBe('purple');
      expect(updated.timesPlayed).toBe(6);
      expect(updated.timesCorrect).toBe(4); // Not incremented
      expect(updated.latencyThreshold).toBe(3); // Preserved
      expect(updated.restUntil).toBeNull(); // Not green
    });

    it('should track multiple stats after session end', () => {
      const player = createTestPlayer({
        stats: {
          totalXP: 100,
          totalSessions: 5,
          currentStreak: 0,
          longestStreak: 3,
          lastPlayedAt: null
        }
      });

      // Simulate yesterday's play
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      player.stats.lastPlayedAt = yesterday.toISOString();
      player.stats.currentStreak = 5;

      GameSessionTracker.updateDailyStreak(player);

      expect(player.stats.currentStreak).toBe(6);
      expect(player.stats.longestStreak).toBe(6);
    });

    it('should correctly count pile distributions', () => {
      const session = createTestSession({
        results: [
          { newBox: 'green' },
          { newBox: 'green' },
          { newBox: 'orange' },
          { newBox: 'purple' },
          { newBox: 'green' }
        ]
      });

      const counts = Pages.game._getPileCounts(session);

      expect(counts.green).toBe(3);
      expect(counts.orange).toBe(1);
      expect(counts.purple).toBe(1);
    });
  });
});
