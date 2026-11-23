/**
 * Tests pour le module Badges
 *
 * @requires ../src/modules/badges.js
 * @requires ../src/modules/xp.js
 */

describe('Badges - Module', () => {
  describe('Structure des badges', () => {
    it('should have ALL property with array of badges', () => {
      expect(Badges.ALL).toBeDefined();
      expect(Array.isArray(Badges.ALL)).toBe(true);
      expect(Badges.ALL.length).toBeGreaterThan(0);
    });

    it('should have at least 20 badges', () => {
      expect(Badges.ALL.length).toBeGreaterThanOrEqual(20);
    });

    it('should have valid badge structure', () => {
      const badge = Badges.ALL[0];
      expect(badge.id).toBeDefined();
      expect(badge.name).toBeDefined();
      expect(badge.description).toBeDefined();
      expect(badge.icon).toBeDefined();
      expect(badge.category).toBeDefined();
      expect(badge.rarity).toBeDefined();
      expect(badge.xpReward).toBeDefined();
      expect(typeof badge.condition).toBe('function');
    });

    it('should have all required categories', () => {
      const categories = [...new Set(Badges.ALL.map(b => b.category))];
      expect(categories).toContain('achievement');
      expect(categories).toContain('mastery');
      expect(categories).toContain('level');
      expect(categories).toContain('performance');
      expect(categories).toContain('streak');
      expect(categories).toContain('subject');
    });

    it('should have all required rarities', () => {
      const rarities = [...new Set(Badges.ALL.map(b => b.rarity))];
      expect(rarities).toContain('common');
      expect(rarities).toContain('rare');
      expect(rarities).toContain('epic');
      expect(rarities).toContain('legendary');
    });
  });

  describe('get()', () => {
    it('should return badge by id', () => {
      const badge = Badges.get('first_card');
      expect(badge).toBeDefined();
      expect(badge.id).toBe('first_card');
    });

    it('should return undefined for invalid id', () => {
      const badge = Badges.get('invalid_badge_id');
      expect(badge).toBeUndefined();
    });
  });

  describe('getByCategory()', () => {
    it('should return all achievement badges', () => {
      const badges = Badges.getByCategory('achievement');
      expect(Array.isArray(badges)).toBe(true);
      expect(badges.length).toBeGreaterThan(0);
      badges.forEach(badge => {
        expect(badge.category).toBe('achievement');
      });
    });

    it('should return all mastery badges', () => {
      const badges = Badges.getByCategory('mastery');
      expect(badges.length).toBeGreaterThan(0);
      badges.forEach(badge => {
        expect(badge.category).toBe('mastery');
      });
    });

    it('should return empty array for invalid category', () => {
      const badges = Badges.getByCategory('invalid_category');
      expect(badges).toEqual([]);
    });
  });

  describe('getByRarity()', () => {
    it('should return all common badges', () => {
      const badges = Badges.getByRarity('common');
      expect(Array.isArray(badges)).toBe(true);
      expect(badges.length).toBeGreaterThan(0);
      badges.forEach(badge => {
        expect(badge.rarity).toBe('common');
      });
    });

    it('should return all legendary badges', () => {
      const badges = Badges.getByRarity('legendary');
      expect(badges.length).toBeGreaterThan(0);
      badges.forEach(badge => {
        expect(badge.rarity).toBe('legendary');
      });
    });

    it('should return empty array for invalid rarity', () => {
      const badges = Badges.getByRarity('invalid_rarity');
      expect(badges).toEqual([]);
    });
  });

  describe('checkUnlocked() - Achievement badges', () => {
    it('should unlock first_card badge', () => {
      const player = createTestPlayer({
        stats: { totalCardsPlayed: 1 }
      });
      const unlocked = Badges.checkUnlocked(player);

      const unlockedIds = unlocked.map(b => b.id);
      expect(unlockedIds).toContain('first_card');
    });

    it('should unlock first_session badge', () => {
      const player = createTestPlayer({
        stats: { totalSessions: 1 }
      });
      const unlocked = Badges.checkUnlocked(player);

      const unlockedIds = unlocked.map(b => b.id);
      expect(unlockedIds).toContain('first_session');
    });

    it('should unlock explorer badge', () => {
      const player = createTestPlayer({
        stats: { uniqueDecksPlayed: 5 }
      });
      const unlocked = Badges.checkUnlocked(player);

      const unlockedIds = unlocked.map(b => b.id);
      expect(unlockedIds).toContain('explorer');
    });

    it('should not unlock already unlocked badges', () => {
      const player = createTestPlayer({
        stats: { totalCardsPlayed: 1 },
        badges: ['first_card']
      });
      const unlocked = Badges.checkUnlocked(player);

      const unlockedIds = unlocked.map(b => b.id);
      expect(unlockedIds).not.toContain('first_card');
    });
  });

  describe('checkUnlocked() - Mastery badges', () => {
    it('should unlock mastery_10 badge', () => {
      const player = createTestPlayer({
        stats: { totalGreenCards: 10 }
      });
      const unlocked = Badges.checkUnlocked(player);

      const unlockedIds = unlocked.map(b => b.id);
      expect(unlockedIds).toContain('mastery_10');
    });

    it('should unlock mastery_50 badge', () => {
      const player = createTestPlayer({
        stats: { totalGreenCards: 50 }
      });
      const unlocked = Badges.checkUnlocked(player);

      const unlockedIds = unlocked.map(b => b.id);
      expect(unlockedIds).toContain('mastery_50');
    });

    it('should unlock mastery_100 badge', () => {
      const player = createTestPlayer({
        stats: { totalGreenCards: 100 }
      });
      const unlocked = Badges.checkUnlocked(player);

      const unlockedIds = unlocked.map(b => b.id);
      expect(unlockedIds).toContain('mastery_100');
    });

    it('should unlock mastery_500 badge', () => {
      const player = createTestPlayer({
        stats: { totalGreenCards: 500 }
      });
      const unlocked = Badges.checkUnlocked(player);

      const unlockedIds = unlocked.map(b => b.id);
      expect(unlockedIds).toContain('mastery_500');
    });
  });

  describe('checkUnlocked() - Level badges', () => {
    it('should unlock level_5 badge', () => {
      // Level 5 requires totalXP >= 1600 (XP.xpForLevel(5) = 1600)
      const player = createTestPlayer({
        stats: { totalXP: 1600 }
      });
      const unlocked = Badges.checkUnlocked(player);

      const unlockedIds = unlocked.map(b => b.id);
      expect(unlockedIds).toContain('level_5');
    });

    it('should unlock level_10 badge', () => {
      // Level 10 requires totalXP >= 8100
      const player = createTestPlayer({
        stats: { totalXP: 8100 }
      });
      const unlocked = Badges.checkUnlocked(player);

      const unlockedIds = unlocked.map(b => b.id);
      expect(unlockedIds).toContain('level_10');
    });

    it('should unlock level_25 badge', () => {
      // Level 25 requires totalXP >= 57600
      const player = createTestPlayer({
        stats: { totalXP: 57600 }
      });
      const unlocked = Badges.checkUnlocked(player);

      const unlockedIds = unlocked.map(b => b.id);
      expect(unlockedIds).toContain('level_25');
    });

    it('should unlock level_50 badge', () => {
      // Level 50 requires totalXP >= 240100
      const player = createTestPlayer({
        stats: { totalXP: 240100 }
      });
      const unlocked = Badges.checkUnlocked(player);

      const unlockedIds = unlocked.map(b => b.id);
      expect(unlockedIds).toContain('level_50');
    });
  });

  describe('checkUnlocked() - Streak badges', () => {
    it('should unlock streak_3 badge', () => {
      const player = createTestPlayer({
        stats: { currentStreak: 3 }
      });
      const unlocked = Badges.checkUnlocked(player);

      const unlockedIds = unlocked.map(b => b.id);
      expect(unlockedIds).toContain('streak_3');
    });

    it('should unlock streak_7 badge', () => {
      const player = createTestPlayer({
        stats: { currentStreak: 7 }
      });
      const unlocked = Badges.checkUnlocked(player);

      const unlockedIds = unlocked.map(b => b.id);
      expect(unlockedIds).toContain('streak_7');
    });

    it('should unlock streak_30 badge', () => {
      const player = createTestPlayer({
        stats: { currentStreak: 30 }
      });
      const unlocked = Badges.checkUnlocked(player);

      const unlockedIds = unlocked.map(b => b.id);
      expect(unlockedIds).toContain('streak_30');
    });

    it('should unlock streak_100 badge', () => {
      const player = createTestPlayer({
        stats: { currentStreak: 100 }
      });
      const unlocked = Badges.checkUnlocked(player);

      const unlockedIds = unlocked.map(b => b.id);
      expect(unlockedIds).toContain('streak_100');
    });
  });

  describe('checkUnlocked() - Performance badges (with session)', () => {
    it('should unlock perfect_session badge', () => {
      const player = createTestPlayer();
      const session = createTestSession({
        stats: {
          cardsPlayed: 10,
          correctAnswers: 10
        }
      });
      const unlocked = Badges.checkUnlocked(player, session);

      const unlockedIds = unlocked.map(b => b.id);
      expect(unlockedIds).toContain('perfect_session');
    });

    it('should not unlock perfect_session with less than 10 cards', () => {
      const player = createTestPlayer();
      const session = createTestSession({
        stats: {
          cardsPlayed: 9,
          correctAnswers: 9
        }
      });
      const unlocked = Badges.checkUnlocked(player, session);

      const unlockedIds = unlocked.map(b => b.id);
      expect(unlockedIds).not.toContain('perfect_session');
    });

    it('should unlock green_streak_5 badge', () => {
      const player = createTestPlayer();
      const session = createTestSession({
        stats: { maxGreenStreak: 5 }
      });
      const unlocked = Badges.checkUnlocked(player, session);

      const unlockedIds = unlocked.map(b => b.id);
      expect(unlockedIds).toContain('green_streak_5');
    });

    it('should unlock green_streak_10 badge', () => {
      const player = createTestPlayer();
      const session = createTestSession({
        stats: { maxGreenStreak: 10 }
      });
      const unlocked = Badges.checkUnlocked(player, session);

      const unlockedIds = unlocked.map(b => b.id);
      expect(unlockedIds).toContain('green_streak_10');
    });

    it('should unlock green_streak_20 badge', () => {
      const player = createTestPlayer();
      const session = createTestSession({
        stats: { maxGreenStreak: 20 }
      });
      const unlocked = Badges.checkUnlocked(player, session);

      const unlockedIds = unlocked.map(b => b.id);
      expect(unlockedIds).toContain('green_streak_20');
    });

    it('should unlock speed_demon badge', () => {
      const player = createTestPlayer({
        stats: { fastestCorrectAnswer: 999 }
      });
      const unlocked = Badges.checkUnlocked(player);

      const unlockedIds = unlocked.map(b => b.id);
      expect(unlockedIds).toContain('speed_demon');
    });
  });

  describe('checkUnlocked() - Subject badges', () => {
    it('should unlock math_beginner badge', () => {
      const player = createTestPlayer({
        stats: {
          masteredBySubject: { maths: Array.from({ length: 10 }, (_, i) => 'd/c' + i) }
        }
      });
      const unlocked = Badges.checkUnlocked(player);

      const unlockedIds = unlocked.map(b => b.id);
      expect(unlockedIds).toContain('math_beginner');
    });

    it('should unlock math_expert badge', () => {
      const player = createTestPlayer({
        stats: {
          masteredBySubject: { maths: Array.from({ length: 100 }, (_, i) => 'd/c' + i) }
        }
      });
      const unlocked = Badges.checkUnlocked(player);

      const unlockedIds = unlocked.map(b => b.id);
      expect(unlockedIds).toContain('math_expert');
    });

    it('should not count cards merely played (legacy cardsBySubject)', () => {
      const player = createTestPlayer({
        stats: {
          cardsBySubject: { maths: 500 }
        }
      });
      const unlocked = Badges.checkUnlocked(player);
      expect(unlocked.map(b => b.id)).not.toContain('math_beginner');
    });

    it('should handle missing masteredBySubject', () => {
      const player = createTestPlayer({
        stats: {
          masteredBySubject: undefined
        }
      });
      const unlocked = Badges.checkUnlocked(player);

      const unlockedIds = unlocked.map(b => b.id);
      expect(unlockedIds).not.toContain('math_beginner');
    });
  });

  describe('recalculateAll()', () => {
    it('should return all unlocked badge IDs', () => {
      const player = createTestPlayer({
        stats: {
          totalCardsPlayed: 100,
          totalSessions: 5,
          totalGreenCards: 50,
          totalXP: 1600,
          currentStreak: 7
        }
      });

      const unlocked = Badges.recalculateAll(player);

      expect(Array.isArray(unlocked)).toBe(true);
      expect(unlocked).toContain('first_card');
      expect(unlocked).toContain('first_session');
      expect(unlocked).toContain('mastery_10');
      expect(unlocked).toContain('mastery_50');
      expect(unlocked).toContain('level_5');
      expect(unlocked).toContain('streak_3');
      expect(unlocked).toContain('streak_7');
    });

    it('should not include session-based badges', () => {
      const player = createTestPlayer({
        stats: {
          totalCardsPlayed: 1
        }
      });

      const unlocked = Badges.recalculateAll(player);

      // Session-based badges should not be included (session = null)
      expect(unlocked).not.toContain('perfect_session');
      expect(unlocked).not.toContain('green_streak_5');
    });

    it('should return empty array for new player', () => {
      const player = createTestPlayer();
      const unlocked = Badges.recalculateAll(player);

      expect(Array.isArray(unlocked)).toBe(true);
      expect(unlocked).toEqual([]);
    });
  });

  describe('getStats()', () => {
    it('should return correct total and unlocked count', () => {
      const player = createTestPlayer({
        badges: ['first_card', 'first_session']
      });

      const stats = Badges.getStats(player);

      expect(stats.total).toBe(Badges.ALL.length);
      expect(stats.unlocked).toBe(2);
    });

    it('should return stats by category', () => {
      const player = createTestPlayer({
        badges: ['first_card', 'first_session', 'explorer']
      });

      const stats = Badges.getStats(player);

      expect(stats.byCategory).toBeDefined();
      expect(stats.byCategory.achievement).toBeDefined();
      expect(stats.byCategory.achievement.total).toBeGreaterThan(0);
      expect(stats.byCategory.achievement.unlocked).toBe(3);
    });

    it('should return stats by rarity', () => {
      const player = createTestPlayer({
        badges: ['first_card', 'first_session']
      });

      const stats = Badges.getStats(player);

      expect(stats.byRarity).toBeDefined();
      expect(stats.byRarity.common).toBeDefined();
      expect(stats.byRarity.common.total).toBeGreaterThan(0);
      expect(stats.byRarity.common.unlocked).toBeGreaterThan(0);
    });

    it('should handle empty badges array', () => {
      const player = createTestPlayer({
        badges: []
      });

      const stats = Badges.getStats(player);

      expect(stats.total).toBe(Badges.ALL.length);
      expect(stats.unlocked).toBe(0);

      // All categories should have 0 unlocked
      Object.values(stats.byCategory).forEach(category => {
        expect(category.unlocked).toBe(0);
      });

      Object.values(stats.byRarity).forEach(rarity => {
        expect(rarity.unlocked).toBe(0);
      });
    });
  });

  describe('Badge conditions - Edge cases', () => {
    it('should handle negative values gracefully', () => {
      const player = createTestPlayer({
        stats: {
          totalCardsPlayed: -1,
          currentStreak: -1
        }
      });

      const unlocked = Badges.checkUnlocked(player);
      expect(Array.isArray(unlocked)).toBe(true);
    });

    it('should handle very large values', () => {
      const player = createTestPlayer({
        stats: {
          totalCardsPlayed: 999999,
          totalGreenCards: 999999,
          currentStreak: 999999,
          totalXP: 999999999
        }
      });

      const unlocked = Badges.checkUnlocked(player);
      expect(Array.isArray(unlocked)).toBe(true);
      expect(unlocked.length).toBeGreaterThan(0);
    });
  });
});
