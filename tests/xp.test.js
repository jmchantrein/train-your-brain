/**
 * Tests pour le module XP
 * Calculs d'expérience, niveaux et progression
 */

describe('XP Module', () => {

  // ═══════════════════════════════════════════════════════════════
  // calculateXpForCard() - Calcule l'XP gagné pour une carte
  // ═══════════════════════════════════════════════════════════════

  describe('calculateXpForCard', () => {
    it('should return 1 XP for purple box', () => {
      expect(XP.calculateXpForCard('purple')).toBe(1);
    });

    it('should return 2 XP for orange box', () => {
      expect(XP.calculateXpForCard('orange')).toBe(2);
    });

    it('should return 3 XP for green box', () => {
      expect(XP.calculateXpForCard('green')).toBe(3);
    });

    it('should return 0 XP for invalid box', () => {
      expect(XP.calculateXpForCard('never_played')).toBe(0);
      expect(XP.calculateXpForCard('invalid')).toBe(0);
      expect(XP.calculateXpForCard('')).toBe(0);
      expect(XP.calculateXpForCard(null)).toBe(0);
      expect(XP.calculateXpForCard(undefined)).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // calculateStreakBonus() - Calcule le bonus XP pour un streak
  // ═══════════════════════════════════════════════════════════════

  describe('calculateStreakBonus', () => {
    it('should return 0 XP for streak less than 3', () => {
      expect(XP.calculateStreakBonus(0)).toBe(0);
      expect(XP.calculateStreakBonus(1)).toBe(0);
      expect(XP.calculateStreakBonus(2)).toBe(0);
    });

    it('should return 5 XP for streak of 3', () => {
      expect(XP.calculateStreakBonus(3)).toBe(5);
    });

    it('should return 5 XP for streak between 3 and 5', () => {
      expect(XP.calculateStreakBonus(4)).toBe(5);
      expect(XP.calculateStreakBonus(5)).toBe(5);
    });

    it('should return 15 XP for streak of 6', () => {
      expect(XP.calculateStreakBonus(6)).toBe(15);
    });

    it('should return 15 XP for streak between 6 and 8', () => {
      expect(XP.calculateStreakBonus(7)).toBe(15);
      expect(XP.calculateStreakBonus(8)).toBe(15);
    });

    it('should return 30 XP for streak of 9', () => {
      expect(XP.calculateStreakBonus(9)).toBe(30);
    });

    it('should return 30 XP for streak between 9 and 11', () => {
      expect(XP.calculateStreakBonus(10)).toBe(30);
      expect(XP.calculateStreakBonus(11)).toBe(30);
    });

    it('should return progressive XP for streak of 12 or more (logarithmic)', () => {
      expect(XP.calculateStreakBonus(12)).toBe(50);
      expect(XP.calculateStreakBonus(13)).toBe(50); // Same until 18
      expect(XP.calculateStreakBonus(18)).toBe(75);
      expect(XP.calculateStreakBonus(25)).toBe(110);
      expect(XP.calculateStreakBonus(35)).toBe(160);
      expect(XP.calculateStreakBonus(50)).toBe(230);
      expect(XP.calculateStreakBonus(75)).toBe(350);
      expect(XP.calculateStreakBonus(100)).toBe(500);
      expect(XP.calculateStreakBonus(150)).toBe(500); // Max at 100
    });

    it('should return 0 XP for negative streak', () => {
      expect(XP.calculateStreakBonus(-1)).toBe(0);
      expect(XP.calculateStreakBonus(-10)).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // calculateLevel() - Calcule le niveau à partir de l'XP total
  // ═══════════════════════════════════════════════════════════════

  describe('calculateLevel', () => {
    it('should return 1 for 0 XP', () => {
      expect(XP.calculateLevel(0)).toBe(1);
    });

    it('should return 1 for XP less than 100', () => {
      expect(XP.calculateLevel(50)).toBe(1);
      expect(XP.calculateLevel(99)).toBe(1);
    });

    it('should return 2 for 100 XP', () => {
      expect(XP.calculateLevel(100)).toBe(2);
    });

    it('should return 2 for XP between 100 and 399', () => {
      expect(XP.calculateLevel(150)).toBe(2);
      expect(XP.calculateLevel(399)).toBe(2);
    });

    it('should return 3 for 400 XP', () => {
      expect(XP.calculateLevel(400)).toBe(3);
    });

    it('should return 3 for XP between 400 and 899', () => {
      expect(XP.calculateLevel(500)).toBe(3);
      expect(XP.calculateLevel(899)).toBe(3);
    });

    it('should return 11 for 10000 XP', () => {
      expect(XP.calculateLevel(10000)).toBe(11);
    });

    it('should handle very large XP values', () => {
      expect(XP.calculateLevel(100000)).toBe(32);
      expect(XP.calculateLevel(1000000)).toBe(101);
    });

    it('should return 1 for negative XP', () => {
      expect(XP.calculateLevel(-100)).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // xpForLevel() - Calcule l'XP nécessaire pour atteindre un niveau
  // ═══════════════════════════════════════════════════════════════

  describe('xpForLevel', () => {
    it('should return 0 for level 1', () => {
      expect(XP.xpForLevel(1)).toBe(0);
    });

    it('should return 100 for level 2', () => {
      expect(XP.xpForLevel(2)).toBe(100);
    });

    it('should return 400 for level 3', () => {
      expect(XP.xpForLevel(3)).toBe(400);
    });

    it('should return 900 for level 4', () => {
      expect(XP.xpForLevel(4)).toBe(900);
    });

    it('should return 1600 for level 5', () => {
      expect(XP.xpForLevel(5)).toBe(1600);
    });

    it('should return 10000 for level 11', () => {
      expect(XP.xpForLevel(11)).toBe(10000);
    });

    it('should handle large levels', () => {
      expect(XP.xpForLevel(50)).toBe(240100);
      expect(XP.xpForLevel(100)).toBe(980100);
    });

    it('should return 0 for level 0 or negative', () => {
      expect(XP.xpForLevel(0)).toBe(0);
      expect(XP.xpForLevel(-1)).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // xpProgress() - Calcule la progression vers le prochain niveau
  // ═══════════════════════════════════════════════════════════════

  describe('xpProgress', () => {
    it('should return 0 for 0 XP (start of level 1)', () => {
      expect(XP.xpProgress(0)).toBe(0);
    });

    it('should return 0.5 for 50 XP (midway through level 1)', () => {
      expect(XP.xpProgress(50)).toBe(0.5);
    });

    // Note: 100 XP = exactement niveau 2, donc progress = 0 (début du niveau)
    // Le test "should return 1.0 for 100 XP" était incorrect et a été supprimé

    it('should return 0 for 100 XP (start of level 2)', () => {
      // Au niveau 2, on a 100 XP, il faut 400 XP pour atteindre le niveau 3
      // Progression = (100 - 100) / (400 - 100) = 0 / 300 = 0
      const level = XP.calculateLevel(100); // 2
      const currentLevelXP = XP.xpForLevel(level); // 100
      const nextLevelXP = XP.xpForLevel(level + 1); // 400
      const expectedProgress = (100 - currentLevelXP) / (nextLevelXP - currentLevelXP);
      expect(XP.xpProgress(100)).toBe(expectedProgress);
    });

    it('should return correct progress for 250 XP (middle of level 2)', () => {
      // Level 2: 100-399 XP, next level at 400
      // Progress = (250 - 100) / (400 - 100) = 150 / 300 = 0.5
      expect(XP.xpProgress(250)).toBe(0.5);
    });

    it('should return correct progress for 400 XP (reaching level 3)', () => {
      // At 400 XP, we reach level 3
      const level = XP.calculateLevel(400); // 3
      const currentLevelXP = XP.xpForLevel(level); // 400
      const nextLevelXP = XP.xpForLevel(level + 1); // 900
      const expectedProgress = (400 - currentLevelXP) / (nextLevelXP - currentLevelXP);
      expect(XP.xpProgress(400)).toBe(expectedProgress);
    });

    it('should return values between 0 and 1', () => {
      const testValues = [0, 50, 99, 100, 250, 399, 400, 650, 899, 1000, 5000, 10000];

      testValues.forEach(xp => {
        const progress = XP.xpProgress(xp);
        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(1);
      });
    });

    it('should increase monotonically within a level', () => {
      // Dans un même niveau, plus d'XP = plus de progression
      const progress1 = XP.xpProgress(100); // Start of level 2
      const progress2 = XP.xpProgress(200); // Middle of level 2
      const progress3 = XP.xpProgress(300); // Near end of level 2

      expect(progress2).toBeGreaterThan(progress1);
      expect(progress3).toBeGreaterThan(progress2);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Constants validation
  // ═══════════════════════════════════════════════════════════════

  describe('Constants', () => {
    it('should have CARD_XP constant', () => {
      expect(XP.CARD_XP).toEqual({
        purple: 1,
        orange: 2,
        green: 3
      });
    });

    it('should have STREAK_BONUSES constant with logarithmic progression', () => {
      expect(XP.STREAK_BONUSES).toEqual([
        { streak: 3, xp: 5 },
        { streak: 6, xp: 15 },
        { streak: 9, xp: 30 },
        { streak: 12, xp: 50 },
        { streak: 18, xp: 75 },
        { streak: 25, xp: 110 },
        { streak: 35, xp: 160 },
        { streak: 50, xp: 230 },
        { streak: 75, xp: 350 },
        { streak: 100, xp: 500 }
      ]);
    });
  });
});
