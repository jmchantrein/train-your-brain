/**
 * Tests pour le module Themes (Gestion des themes visuels)
 */

// ═══════════════════════════════════════════════════════════════
// TESTS STRUCTURE DU MODULE
// ═══════════════════════════════════════════════════════════════

describe('Themes - Structure du module', () => {
  it('should have Themes object defined', () => {
    expect(typeof Themes).toBe('object');
  });

  it('should have THEMES constant object', () => {
    expect(typeof Themes.THEMES).toBe('object');
  });

  it('should have getAllThemes method', () => {
    expect(typeof Themes.getAllThemes).toBe('function');
  });

  it('should have isThemeUnlocked method', () => {
    expect(typeof Themes.isThemeUnlocked).toBe('function');
  });

  it('should have applyTheme method', () => {
    expect(typeof Themes.applyTheme).toBe('function');
  });

  it('should have getCurrentTheme method', () => {
    expect(typeof Themes.getCurrentTheme).toBe('function');
  });

  it('should have setTheme method', () => {
    expect(typeof Themes.setTheme).toBe('function');
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS THEMES DISPONIBLES
// ═══════════════════════════════════════════════════════════════

describe('Themes - Available themes', () => {
  it('should have ocean theme', () => {
    expect(Themes.THEMES.ocean).toBeDefined();
  });

  it('should have forest theme', () => {
    expect(Themes.THEMES.forest).toBeDefined();
  });

  it('should have sunset theme', () => {
    expect(Themes.THEMES.sunset).toBeDefined();
  });

  it('should have midnight theme', () => {
    expect(Themes.THEMES.midnight).toBeDefined();
  });

  it('should have sakura theme', () => {
    expect(Themes.THEMES.sakura).toBeDefined();
  });

  it('should have arctic theme', () => {
    expect(Themes.THEMES.arctic).toBeDefined();
  });

  it('should have neon theme', () => {
    expect(Themes.THEMES.neon).toBeDefined();
  });

  it('should have gold theme', () => {
    expect(Themes.THEMES.gold).toBeDefined();
  });

  it('should have at least 8 themes', () => {
    const themeCount = Object.keys(Themes.THEMES).length;
    expect(themeCount).toBeGreaterThanOrEqual(8);
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS STRUCTURE DES THEMES
// ═══════════════════════════════════════════════════════════════

describe('Themes - Theme structure', () => {
  it('each theme should have id', () => {
    Object.values(Themes.THEMES).forEach(theme => {
      expect(theme.id).toBeDefined();
    });
  });

  it('each theme should have name', () => {
    Object.values(Themes.THEMES).forEach(theme => {
      expect(theme.name).toBeDefined();
    });
  });

  it('each theme should have description', () => {
    Object.values(Themes.THEMES).forEach(theme => {
      expect(theme.description).toBeDefined();
    });
  });

  it('each theme should have icon', () => {
    Object.values(Themes.THEMES).forEach(theme => {
      expect(theme.icon).toBeDefined();
    });
  });

  it('each theme should have unlocked property', () => {
    Object.values(Themes.THEMES).forEach(theme => {
      expect(typeof theme.unlocked).toBe('boolean');
    });
  });

  it('ocean theme should be unlocked by default', () => {
    expect(Themes.THEMES.ocean.unlocked).toBe(true);
  });

  it('forest theme should be unlocked by default', () => {
    expect(Themes.THEMES.forest.unlocked).toBe(true);
  });

  it('locked themes should have unlockCondition', () => {
    Object.values(Themes.THEMES).forEach(theme => {
      if (!theme.unlocked) {
        expect(theme.unlockCondition).toBeDefined();
      }
    });
  });

  it('locked themes should have unlockText', () => {
    Object.values(Themes.THEMES).forEach(theme => {
      if (!theme.unlocked) {
        expect(theme.unlockText).toBeDefined();
      }
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS CONDITIONS DE DEBLOCAGE
// ═══════════════════════════════════════════════════════════════

describe('Themes - Unlock conditions', () => {
  it('sunset should require streak', () => {
    expect(Themes.THEMES.sunset.unlockCondition.type).toBe('streak');
    expect(Themes.THEMES.sunset.unlockCondition.value).toBe(7);
  });

  it('midnight should require cards played', () => {
    expect(Themes.THEMES.midnight.unlockCondition.type).toBe('cards');
    expect(Themes.THEMES.midnight.unlockCondition.value).toBe(100);
  });

  it('sakura should require accuracy', () => {
    expect(Themes.THEMES.sakura.unlockCondition.type).toBe('accuracy');
    expect(Themes.THEMES.sakura.unlockCondition.value).toBe(90);
  });

  it('arctic should require green cards', () => {
    expect(Themes.THEMES.arctic.unlockCondition.type).toBe('green_cards');
    expect(Themes.THEMES.arctic.unlockCondition.value).toBe(50);
  });

  it('neon should require challenge wins', () => {
    expect(Themes.THEMES.neon.unlockCondition.type).toBe('challenge_wins');
    expect(Themes.THEMES.neon.unlockCondition.value).toBe(5);
  });

  it('gold should require level', () => {
    expect(Themes.THEMES.gold.unlockCondition.type).toBe('level');
    expect(Themes.THEMES.gold.unlockCondition.value).toBe(20);
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS isThemeUnlocked()
// ═══════════════════════════════════════════════════════════════

describe('Themes - isThemeUnlocked()', () => {
  const basicPlayer = {
    stats: {
      totalXP: 0,
      totalCardsPlayed: 0,
      longestStreak: 0,
      totalGreenCards: 0,
      challengeWins: 0
    },
    unlockedThemes: []
  };

  it('should return true for ocean (default theme)', () => {
    expect(Themes.isThemeUnlocked('ocean', basicPlayer)).toBe(true);
  });

  it('should return true for forest (default theme)', () => {
    expect(Themes.isThemeUnlocked('forest', basicPlayer)).toBe(true);
  });

  it('should return false for non-existent theme', () => {
    expect(Themes.isThemeUnlocked('nonexistent', basicPlayer)).toBe(false);
  });

  it('should return false for locked theme with no progress', () => {
    expect(Themes.isThemeUnlocked('sunset', basicPlayer)).toBe(false);
    expect(Themes.isThemeUnlocked('midnight', basicPlayer)).toBe(false);
    expect(Themes.isThemeUnlocked('gold', basicPlayer)).toBe(false);
  });

  it('should return true for theme in unlockedThemes array', () => {
    const playerWithTheme = {
      ...basicPlayer,
      unlockedThemes: ['sunset']
    };
    expect(Themes.isThemeUnlocked('sunset', playerWithTheme)).toBe(true);
  });

  it('should unlock sunset with 7 day streak', () => {
    const playerWithStreak = {
      stats: { longestStreak: 7 },
      unlockedThemes: []
    };
    expect(Themes.isThemeUnlocked('sunset', playerWithStreak)).toBe(true);
  });

  it('should not unlock sunset with 6 day streak', () => {
    const playerWithStreak = {
      stats: { longestStreak: 6 },
      unlockedThemes: []
    };
    expect(Themes.isThemeUnlocked('sunset', playerWithStreak)).toBe(false);
  });

  it('should unlock midnight with 100 cards played', () => {
    const playerWithCards = {
      stats: { totalCardsPlayed: 100 },
      unlockedThemes: []
    };
    expect(Themes.isThemeUnlocked('midnight', playerWithCards)).toBe(true);
  });

  it('should unlock arctic with 50 green cards', () => {
    const playerWithGreen = {
      stats: { totalGreenCards: 50 },
      unlockedThemes: []
    };
    expect(Themes.isThemeUnlocked('arctic', playerWithGreen)).toBe(true);
  });

  it('should unlock neon with 5 challenge wins', () => {
    const playerWithChallenges = {
      stats: { challengeWins: 5 },
      unlockedThemes: []
    };
    expect(Themes.isThemeUnlocked('neon', playerWithChallenges)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS _checkUnlockCondition() pour accuracy
// ═══════════════════════════════════════════════════════════════

describe('Themes - Accuracy unlock condition', () => {
  it('should not unlock sakura with not enough cards', () => {
    const player = {
      stats: {
        totalCardsPlayed: 30,
        totalCorrectAnswers: 30
      },
      unlockedThemes: []
    };
    // Sakura requires minCards: 50
    expect(Themes.isThemeUnlocked('sakura', player)).toBe(false);
  });

  it('should unlock sakura with 90% accuracy on 50+ cards', () => {
    const player = {
      stats: {
        totalCardsPlayed: 100,
        totalCorrectAnswers: 90
      },
      unlockedThemes: []
    };
    expect(Themes.isThemeUnlocked('sakura', player)).toBe(true);
  });

  it('should not unlock sakura with 89% accuracy', () => {
    const player = {
      stats: {
        totalCardsPlayed: 100,
        totalCorrectAnswers: 89
      },
      unlockedThemes: []
    };
    expect(Themes.isThemeUnlocked('sakura', player)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS getAllThemes()
// ═══════════════════════════════════════════════════════════════

describe('Themes - getAllThemes()', () => {
  const player = {
    stats: { longestStreak: 7 },
    unlockedThemes: []
  };

  it('should return array of themes', () => {
    const themes = Themes.getAllThemes(player);
    expect(Array.isArray(themes)).toBe(true);
  });

  it('should return all themes', () => {
    const themes = Themes.getAllThemes(player);
    expect(themes.length).toBe(Object.keys(Themes.THEMES).length);
  });

  it('should include isUnlocked property', () => {
    const themes = Themes.getAllThemes(player);
    themes.forEach(theme => {
      expect(typeof theme.isUnlocked).toBe('boolean');
    });
  });

  it('should mark ocean as unlocked', () => {
    const themes = Themes.getAllThemes(player);
    const ocean = themes.find(t => t.id === 'ocean');
    expect(ocean.isUnlocked).toBe(true);
  });

  it('should mark sunset as unlocked for player with 7 day streak', () => {
    const themes = Themes.getAllThemes(player);
    const sunset = themes.find(t => t.id === 'sunset');
    expect(sunset.isUnlocked).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS checkUnlockedThemes()
// ═══════════════════════════════════════════════════════════════
// TESTS applyTheme()
// ═══════════════════════════════════════════════════════════════

describe('Themes - applyTheme()', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
  });

  it('should set data-theme attribute on document', () => {
    Themes.applyTheme('forest');
    expect(document.documentElement.getAttribute('data-theme')).toBe('forest');
  });

  it('should apply ocean theme', () => {
    Themes.applyTheme('ocean');
    expect(document.documentElement.getAttribute('data-theme')).toBe('ocean');
  });

  it('should default to ocean for invalid theme', () => {
    Themes.applyTheme('nonexistent');
    expect(document.documentElement.getAttribute('data-theme')).toBe('ocean');
  });

  it('should change theme when called multiple times', () => {
    Themes.applyTheme('ocean');
    Themes.applyTheme('forest');
    expect(document.documentElement.getAttribute('data-theme')).toBe('forest');
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS getCurrentTheme()
// ═══════════════════════════════════════════════════════════════

describe('Themes - getCurrentTheme()', () => {
  it('should return ocean by default', () => {
    const player = { settings: {} };
    expect(Themes.getCurrentTheme(player)).toBe('ocean');
  });

  it('should return player theme setting', () => {
    const player = { settings: { theme: 'forest' } };
    expect(Themes.getCurrentTheme(player)).toBe('forest');
  });

  it('should handle missing settings', () => {
    const player = {};
    expect(Themes.getCurrentTheme(player)).toBe('ocean');
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS setTheme()
// ═══════════════════════════════════════════════════════════════

describe('Themes - setTheme()', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
  });

  it('should update player settings', () => {
    const player = {
      settings: { theme: 'ocean' },
      unlockedThemes: ['forest']
    };
    const updated = Themes.setTheme(player, 'forest');
    expect(updated.settings.theme).toBe('forest');
  });

  it('should apply theme to document', () => {
    const player = {
      settings: {},
      unlockedThemes: ['forest']
    };
    Themes.setTheme(player, 'forest');
    expect(document.documentElement.getAttribute('data-theme')).toBe('forest');
  });

  it('should not change theme if not unlocked', () => {
    const player = {
      stats: {},
      settings: { theme: 'ocean' },
      unlockedThemes: []
    };
    const updated = Themes.setTheme(player, 'gold');
    expect(updated.settings.theme).toBe('ocean');
  });

  it('should allow setting default themes without unlock', () => {
    const player = {
      settings: { theme: 'forest' },
      unlockedThemes: []
    };
    const updated = Themes.setTheme(player, 'ocean');
    expect(updated.settings.theme).toBe('ocean');
  });

  it('should return same player object if theme not unlocked', () => {
    const player = {
      stats: {},
      settings: { theme: 'ocean' },
      unlockedThemes: []
    };
    const updated = Themes.setTheme(player, 'gold');
    expect(updated).toBe(player);
  });
});
