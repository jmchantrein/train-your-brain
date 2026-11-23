/**
 * Tests pour le module Challenges
 * Défis quotidiens (cumul sur la journée, bornés par les cartes à réviser), quêtes
 * hebdomadaires et constantes du mode défi. Les scénarios de persistance, de séance complète et
 * de calibrage sont dans gamification-missions.test.js ; le mode défi intégré (séance, bonus,
 * entraînement libre, écrans) est dans gamification-challenge-mode.test.js.
 */

describe('Challenges Module', () => {
  const TODAY = '2026-01-05';

  function reviewedDeck(id, total, reviewed) {
    return {
      id, name: id, settings: {},
      cards: Array.from({ length: total }, (_, i) => ({
        id: id + i, box: i < reviewed ? 'purple' : 'never_played', restUntil: null, restDays: 0,
        timesPlayed: i < reviewed ? 1 : 0, timesCorrect: 0, latencyThreshold: null
      }))
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // generateDaily() - Génère les défis quotidiens
  // ═══════════════════════════════════════════════════════════════

  describe('generateDaily', () => {
    it('should generate 3 challenges when there are cards to review', () => {
      const challenges = Challenges.generateDaily(createTestPlayer(), TODAY, { dueCount: 12 });
      expect(challenges).toHaveLength(3);
      expect(challenges.map(c => c.type)).toEqual(['review_due', 'accuracy', 'green_streak']);
    });

    it('should generate nothing without cards to review', () => {
      expect(Challenges.generateDaily(createTestPlayer(), TODAY, { dueCount: 0 })).toEqual([]);
      expect(Challenges.generateDaily(createTestPlayer(), TODAY)).toEqual([]);
    });

    it('should target the cards due today, never more', () => {
      const [review] = Challenges.generateDaily(createTestPlayer(), TODAY, { dueCount: 7 });
      expect(review.target).toBe(7);
    });

    it('should use a 70% accuracy over at most 10 cards', () => {
      const [, accuracy] = Challenges.generateDaily(createTestPlayer(), TODAY, { dueCount: 40 });
      expect(accuracy.target).toEqual({ accuracy: 70, minCards: 10 });
    });

    it('should use a fixed green streak of 3 (bounded by the cards due)', () => {
      expect(Challenges.generateDaily(createTestPlayer(), TODAY, { dueCount: 40 })[2].target).toBe(3);
      expect(Challenges.generateDaily(createTestPlayer(), TODAY, { dueCount: 2 })[2].target).toBe(2);
    });

    it('should not depend on the player level', () => {
      const a = Challenges.generateDaily(createTestPlayer({ stats: { totalXP: 0 } }), TODAY, { dueCount: 20 });
      const b = Challenges.generateDaily(createTestPlayer({ stats: { totalXP: 99999 } }), TODAY, { dueCount: 20 });
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    });

    it('should start with zero progress, createdAt today and expiresAt tomorrow', () => {
      Challenges.generateDaily(createTestPlayer(), TODAY, { dueCount: 12 }).forEach(c => {
        expect(c.progress).toBe(0);
        expect(c.completed).toBe(false);
        expect(c.createdAt).toBe(TODAY);
        expect(c.expiresAt).toBe('2026-01-06');
      });
    });

    it('should keep the total reward small (3 to 5 XP)', () => {
      expect(Challenges.dailyXpPool(0)).toBe(0);
      expect(Challenges.dailyXpPool(1)).toBe(3);
      expect(Challenges.dailyXpPool(8)).toBe(4);
      expect(Challenges.dailyXpPool(1000)).toBe(5);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // countDueCards / recordCard
  // ═══════════════════════════════════════════════════════════════

  describe('countDueCards', () => {
    it('should count only already played, playable cards', () => {
      const deck = reviewedDeck('d', 20, 6);
      deck.cards[0] = { ...deck.cards[0], box: 'green', restUntil: '2026-01-08', restDays: 3 };
      expect(Challenges.countDueCards([deck], TODAY)).toBe(5);
    });
  });

  describe('recordCard', () => {
    function setup(due) {
      const player = createTestPlayer();
      Challenges.refreshMissions(player, { decks: [reviewedDeck('d', 40, due)], today: TODAY });
      return player;
    }

    it('should accumulate over the whole day', () => {
      const player = setup(12);
      Challenges.recordCard(player, { deckId: 'd', cardId: 'a', isCorrect: true, maxGreenStreak: 1 }, TODAY);
      Challenges.recordCard(player, { deckId: 'd', cardId: 'b', isCorrect: false, maxGreenStreak: 0 }, TODAY);
      expect(player.missions.daily.cardsPlayed).toBe(2);
      expect(player.missions.daily.correct).toBe(1);
      expect(player.missions.daily.challenges[0].progress).toBe(2);
    });

    it('should complete a challenge only once', () => {
      const player = setup(3);
      let completed = 0;
      for (let i = 0; i < 6; i++) {
        completed += Challenges.recordCard(player, { deckId: 'd', cardId: 'c' + i, isCorrect: true, maxGreenStreak: 3 }, TODAY)
          .filter(c => c.type === 'green_streak').length;
      }
      expect(completed).toBe(1);
    });

    it('should return copies so that the session snapshot is stable', () => {
      const player = setup(2);
      const done = Challenges.recordCard(player, { deckId: 'd', cardId: 'a', isCorrect: true, maxGreenStreak: 2 }, TODAY)
        .concat(Challenges.recordCard(player, { deckId: 'd', cardId: 'b', isCorrect: true, maxGreenStreak: 2 }, TODAY));
      expect(done.length).toBeGreaterThan(0);
      done.forEach(c => expect(c.completed).toBe(true));
    });

    it('should do nothing for a player without missions', () => {
      expect(Challenges.recordCard(createTestPlayer(), { deckId: 'd', cardId: 'a', isCorrect: true, maxGreenStreak: 1 }, TODAY)).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Quêtes hebdomadaires
  // ═══════════════════════════════════════════════════════════════

  describe('weekly quests', () => {
    it('should generate the 5 quests of the week with matching ids', () => {
      const record = Challenges.createWeeklyRecord(createTestPlayer(), '2026-01-05', [reviewedDeck('d', 30, 10)]);
      expect(record.quests.map(q => q.type)).toEqual(Challenges.WEEKLY_TYPES);
      expect(record.quests[0].id).toBe('weekly_2026-01-05_xp');
      expect(record.quests.every(q => q.expiresAt === '2026-01-11')).toBe(true);
    });

    it('should describe every quest in French and in English', () => {
      const record = Challenges.createWeeklyRecord(createTestPlayer(), '2026-01-05', [reviewedDeck('d', 30, 10)]);
      record.quests.forEach(q => {
        expect(Challenges.describe(q)).not.toBe('missions.weekly.' + q.type);
        const en = Challenges.describe(q, (k, p) => i18n._translations.en[k].replace(/\{(\w+)\}/g, (_, n) => p[n]));
        expect(en.length).toBeGreaterThan(5);
      });
    });

    it('should use the singular form for a target of 1', () => {
      expect(Challenges.describe({ type: 'weekly_mastery', target: 1 })).toBe(i18n._translations.fr['missions.weekly.weekly_mastery_one']);
      expect(Challenges.describe({ type: 'review_due', target: 1 })).toBe(i18n._translations.fr['missions.daily.review_due_one']);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Constants validation
  // ═══════════════════════════════════════════════════════════════

  describe('Constants', () => {
    it('should have DAILY_TYPES constant', () => {
      expect(Challenges.DAILY_TYPES).toEqual(['review_due', 'accuracy', 'green_streak']);
    });

    it('should have WEEKLY_TYPES constant', () => {
      expect(Challenges.WEEKLY_TYPES).toEqual(['weekly_xp', 'weekly_mastery', 'weekly_streak', 'weekly_challenges', 'weekly_decks']);
    });

    it('should have the four challenge modes and the four levels', () => {
      expect(Object.keys(Challenges.CHALLENGE_MODES)).toEqual(['steady', 'perfect', 'speed', 'endurance']);
      expect(Object.keys(Challenges.DIFFICULTY_LEVELS)).toEqual(['easy', 'medium', 'hard', 'expert']);
    });

    it('should bound the challenge reward: 3 XP, the order of the daily challenges (at most 5 XP)', () => {
      expect(Challenges.CHALLENGE_BONUS_XP).toBe(3);
      expect(Challenges.CHALLENGE_BONUS_XP).toBeLessThanOrEqual(Challenges.DAILY_XP_MAX);
    });

    it('should make the weekly challenges quest reachable: 2 wins', () => {
      expect(Challenges.WEEKLY_CHALLENGES_TARGET).toBe(2);
    });

    it('should describe the weekly challenges quest as completing challenges in both languages', () => {
      const quest = { type: 'weekly_challenges', target: 2 };
      expect(Challenges.describe(quest)).toMatch(/Réussir 2 défis/);
      const en = Challenges.describe(quest, (k, p) => i18n._translations.en[k].replace(/\{(\w+)\}/g, (_, n) => p[n]));
      expect(en).toMatch(/Complete 2 challenges/);
    });
  });
});
