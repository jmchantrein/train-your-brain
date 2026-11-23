/**
 * Tests pour le module Storage
 *
 * Tests de persistence avec localStorage :
 * - Player : save/load/delete
 * - Deck progress : save/load/delete/loadAll
 * - Settings : save/load
 * - Export/Import : cycle complet
 * - Utilitaires : clear, getStorageSize
 * - Gestion d'erreurs : JSON invalide, localStorage plein
 */

// Import du module
const Storage = require('../src/modules/storage.js');

describe('Storage - Player', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save and load player', () => {
    const player = {
      id: 'player_123',
      name: 'Test Player',
      createdAt: '2025-01-20T10:00:00Z',
      stats: {
        totalXP: 100,
        totalCardsPlayed: 10
      },
      badges: ['first_card'],
      settings: {
        soundEnabled: true,
        theme: 'dark'
      }
    };

    const saved = Storage.savePlayer(player);
    expect(saved).toBe(true);

    // loadPlayer() passe par validatePlayer() qui complète les champs manquants
    // avec les valeurs par défaut du schéma : on vérifie les champs sauvegardés.
    const loaded = Storage.loadPlayer();
    expect(loaded.id).toBe(player.id);
    expect(loaded.name).toBe(player.name);
    expect(loaded.createdAt).toBe(player.createdAt);
    expect(loaded.stats.totalXP).toBe(100);
    expect(loaded.stats.totalCardsPlayed).toBe(10);
    expect(loaded.badges).toEqual(['first_card']);
    expect(loaded.settings.theme).toBe('dark');
  });

  it('should return null when no player data exists', () => {
    const loaded = Storage.loadPlayer();
    expect(loaded).toBeNull();
  });

  it('should return null on corrupted JSON', () => {
    localStorage.setItem('tyb_player', '{invalid json}');

    const loaded = Storage.loadPlayer();
    expect(loaded).toBeNull();
  });

  it('should return false when localStorage is full', () => {
    // Simuler un localStorage plein en utilisant un très grand objet
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function() {
      const error = new Error('QuotaExceededError');
      error.name = 'QuotaExceededError';
      throw error;
    };

    const player = { id: 'test', name: 'Test' };
    const saved = Storage.savePlayer(player);

    // Restaurer
    localStorage.setItem = originalSetItem;

    expect(saved).toBe(false);
  });
});

describe('Storage - Deck Progress', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save only progression fields', () => {
    const cards = [
      {
        id: 'card_1',
        question: 'What is 1+1?',
        answer: '2',
        type: 'numeric',
        box: 'green',
        latencyThreshold: 3,
        bestResponseTimeMs: 1200,
        lastResponseTimeMs: 1800,
        restUntil: '2025-01-25',
        timesPlayed: 5,
        timesCorrect: 4
      },
      {
        id: 'card_2',
        question: 'What is 2+2?',
        answer: '4',
        type: 'numeric',
        box: 'orange',
        latencyThreshold: 4,
        bestResponseTimeMs: 2000,
        lastResponseTimeMs: 2500,
        restUntil: null,
        timesPlayed: 3,
        timesCorrect: 2
      }
    ];

    const saved = Storage.saveDeckProgress('test-deck', cards);
    expect(saved).toBe(true);

    const loaded = Storage.loadDeckProgress('test-deck');
    expect(loaded).toHaveLength(2);

    // Vérifier que seuls les champs de progression sont sauvegardés
    expect(loaded[0].id).toBe('card_1');
    expect(loaded[0].box).toBe('green');
    expect(loaded[0].latencyThreshold).toBe(3);
    expect(loaded[0].bestResponseTimeMs).toBe(1200);
    expect(loaded[0].lastResponseTimeMs).toBe(1800);
    expect(loaded[0].restUntil).toBe('2025-01-25');
    expect(loaded[0].timesPlayed).toBe(5);
    expect(loaded[0].timesCorrect).toBe(4);

    // Vérifier que question/answer ne sont PAS sauvegardés
    expect(loaded[0].question).toBeUndefined();
    expect(loaded[0].answer).toBeUndefined();
    expect(loaded[0].type).toBeUndefined();
  });

  it('should return null when no progress exists', () => {
    const loaded = Storage.loadDeckProgress('nonexistent-deck');
    expect(loaded).toBeNull();
  });

  it('should delete deck progress', () => {
    const cards = [
      {
        id: 'card_1',
        box: 'green',
        latencyThreshold: 3,
        bestResponseTimeMs: 1200,
        lastResponseTimeMs: 1800,
        restUntil: null,
        timesPlayed: 5,
        timesCorrect: 4
      }
    ];

    Storage.saveDeckProgress('test-deck', cards);
    Storage.deleteDeckProgress('test-deck');

    const loaded = Storage.loadDeckProgress('test-deck');
    expect(loaded).toBeNull();
  });

  it('should load all deck progress', () => {
    const cards1 = [
      {
        id: 'card_1',
        box: 'green',
        latencyThreshold: 3,
        bestResponseTimeMs: 1200,
        lastResponseTimeMs: 1800,
        restUntil: null,
        timesPlayed: 5,
        timesCorrect: 4
      }
    ];

    const cards2 = [
      {
        id: 'card_2',
        box: 'orange',
        latencyThreshold: 4,
        bestResponseTimeMs: 2000,
        lastResponseTimeMs: 2500,
        restUntil: null,
        timesPlayed: 3,
        timesCorrect: 2
      }
    ];

    Storage.saveDeckProgress('deck-1', cards1);
    Storage.saveDeckProgress('deck-2', cards2);

    const allProgress = Storage.loadAllProgress();

    expect(Object.keys(allProgress)).toHaveLength(2);
    expect(allProgress['deck-1']).toBeDefined();
    expect(allProgress['deck-2']).toBeDefined();
    expect(allProgress['deck-1'][0].id).toBe('card_1');
    expect(allProgress['deck-2'][0].id).toBe('card_2');
  });

  it('should return empty object when no progress exists', () => {
    const allProgress = Storage.loadAllProgress();
    expect(allProgress).toEqual({});
  });

  it('should return false when saving fails', () => {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function() {
      throw new Error('Storage error');
    };

    const cards = [{ id: 'card_1', box: 'green' }];
    const saved = Storage.saveDeckProgress('test-deck', cards);

    localStorage.setItem = originalSetItem;

    expect(saved).toBe(false);
  });
});

describe('Storage - Settings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save and load settings', () => {
    const settings = {
      soundEnabled: true,
      theme: 'dark',
      language: 'fr'
    };

    const saved = Storage.saveSettings(settings);
    expect(saved).toBe(true);

    const loaded = Storage.loadSettings();
    expect(loaded).toEqual(settings);
  });

  it('should return null when no settings exist', () => {
    const loaded = Storage.loadSettings();
    expect(loaded).toBeNull();
  });
});

describe('Storage - Export/Import', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should export all data', () => {
    const player = { id: 'player_1', name: 'Test' };
    const settings = { theme: 'dark' };
    const cards = [{ id: 'card_1', box: 'green', latencyThreshold: 3, bestResponseTimeMs: 1200, lastResponseTimeMs: 1800, restUntil: null, timesPlayed: 5, timesCorrect: 4 }];

    Storage.savePlayer(player);
    Storage.saveSettings(settings);
    Storage.saveDeckProgress('deck-1', cards);

    const exported = Storage.exportAll();

    expect(exported.version).toBe('1.0.0');
    expect(exported.exportedAt).toBeDefined();
    // exportAll() exporte le joueur validé (champs par défaut ajoutés)
    expect(exported.player.id).toBe(player.id);
    expect(exported.player.name).toBe(player.name);
    expect(exported.settings).toEqual(settings);
    expect(exported.progress['deck-1']).toBeDefined();
  });

  it('should import all data', () => {
    const data = {
      version: '1.0.0',
      exportedAt: '2025-01-20T10:00:00Z',
      player: { id: 'player_1', name: 'Imported' },
      settings: { theme: 'light' },
      progress: {
        'deck-1': [{ id: 'card_1', box: 'green', latencyThreshold: 3, bestResponseTimeMs: 1200, lastResponseTimeMs: 1800, restUntil: null, timesPlayed: 5, timesCorrect: 4 }]
      }
    };

    const result = Storage.importAll(data);
    expect(result).toBe(true);

    const player = Storage.loadPlayer();
    const settings = Storage.loadSettings();
    const progress = Storage.loadDeckProgress('deck-1');

    expect(player.name).toBe('Imported');
    expect(settings.theme).toBe('light');
    expect(progress[0].id).toBe('card_1');
  });

  it('should complete export/import cycle', () => {
    const player = { id: 'player_1', name: 'Original' };
    const settings = { theme: 'dark' };

    Storage.savePlayer(player);
    Storage.saveSettings(settings);

    const exported = Storage.exportAll();

    Storage.clear();

    expect(Storage.loadPlayer()).toBeNull();

    Storage.importAll(exported);

    const importedPlayer = Storage.loadPlayer();
    const importedSettings = Storage.loadSettings();

    expect(importedPlayer.name).toBe('Original');
    expect(importedSettings.theme).toBe('dark');
  });

  it('should throw error on invalid import data', () => {
    expect(() => {
      Storage.importAll(null);
    }).toThrow('Invalid import data');

    expect(() => {
      Storage.importAll({});
    }).toThrow('Invalid import data');

    expect(() => {
      Storage.importAll({ version: null });
    }).toThrow('Invalid import data');
  });

  it('should handle import with missing fields', () => {
    const data = {
      version: '1.0.0',
      exportedAt: '2025-01-20T10:00:00Z',
      player: null,
      settings: null,
      progress: null
    };

    const result = Storage.importAll(data);
    expect(result).toBe(true);

    // Rien ne devrait être sauvegardé
    expect(Storage.loadPlayer()).toBeNull();
    expect(Storage.loadSettings()).toBeNull();
  });
});

describe('Storage - Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should clear only tyb_* keys', () => {
    // Ajouter des données tyb_*
    Storage.savePlayer({ id: 'player_1' });
    Storage.saveSettings({ theme: 'dark' });
    Storage.saveDeckProgress('deck-1', [{ id: 'card_1', box: 'green', latencyThreshold: 3, bestResponseTimeMs: 1200, lastResponseTimeMs: 1800, restUntil: null, timesPlayed: 5, timesCorrect: 4 }]);

    // Ajouter une clé non-tyb
    localStorage.setItem('other_app_data', 'should not be deleted');

    Storage.clear();

    // Vérifier que tyb_* sont supprimées
    expect(Storage.loadPlayer()).toBeNull();
    expect(Storage.loadSettings()).toBeNull();
    expect(Storage.loadDeckProgress('deck-1')).toBeNull();

    // Vérifier que other_app_data existe toujours
    expect(localStorage.getItem('other_app_data')).toBe('should not be deleted');
  });

  it('should calculate storage size', () => {
    const player = { id: 'player_1', name: 'Test' };
    Storage.savePlayer(player);

    const size = Storage.getStorageSize();

    // Taille devrait être > 0
    expect(size).toBeGreaterThan(0);

    // Taille devrait correspondre approximativement au JSON
    const expectedSize = JSON.stringify(player).length * 2; // UTF-16
    expect(size).toBeGreaterThanOrEqual(expectedSize);
  });

  it('should return 0 size when no data exists', () => {
    const size = Storage.getStorageSize();
    expect(size).toBe(0);
  });

  it('should not count non-tyb keys in size', () => {
    localStorage.setItem('other_app_data', 'this should not be counted');

    const size = Storage.getStorageSize();
    expect(size).toBe(0);
  });
});

describe('Storage - Error Handling', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should handle corrupted deck progress JSON', () => {
    localStorage.setItem('tyb_deck_test', '{invalid json}');

    const progress = Storage.loadDeckProgress('test');
    expect(progress).toBeNull();
  });

  it('should handle corrupted settings JSON', () => {
    localStorage.setItem('tyb_settings', '{invalid json}');

    const settings = Storage.loadSettings();
    expect(settings).toBeNull();
  });

  it('should handle localStorage.getItem errors in loadAllProgress', () => {
    // Sauvegarder un deck valide
    Storage.saveDeckProgress('valid-deck', [{ id: 'card_1', box: 'green', latencyThreshold: 3, bestResponseTimeMs: 1200, lastResponseTimeMs: 1800, restUntil: null, timesPlayed: 5, timesCorrect: 4 }]);

    // Corrompre un autre deck
    localStorage.setItem('tyb_deck_corrupted', '{invalid}');

    // loadAllProgress devrait gérer l'erreur et retourner les decks valides
    const allProgress = Storage.loadAllProgress();

    // Le deck valide devrait être chargé
    expect(allProgress['valid-deck']).toBeDefined();

    // Le deck corrompu devrait retourner null
    expect(allProgress['corrupted']).toBeNull();
  });
});

describe('Storage - Quota Management', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset callbacks
    Storage._quotaWarningCallbacks = [];
    Storage._quotaErrorCallbacks = [];
  });

  describe('getStorageUsage', () => {
    it('should return correct usage structure', () => {
      const usage = Storage.getStorageUsage();

      expect(usage).toHaveProperty('used');
      expect(usage).toHaveProperty('total');
      expect(usage).toHaveProperty('percentage');
      expect(usage).toHaveProperty('usedMB');
      expect(usage).toHaveProperty('totalMB');
    });

    it('should return 0 usage when localStorage is empty', () => {
      const usage = Storage.getStorageUsage();

      expect(usage.used).toBe(0);
      expect(usage.percentage).toBe(0);
    });

    it('should calculate usage correctly', () => {
      const testData = 'test data';
      localStorage.setItem('test_key', testData);

      const usage = Storage.getStorageUsage();

      // UTF-16: chaque caractère = 2 bytes
      const expectedBytes = ('test_key'.length + testData.length) * 2;
      expect(usage.used).toBe(expectedBytes);
    });

    it('should count all localStorage items', () => {
      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');

      const usage = Storage.getStorageUsage();

      const expected = (('key1'.length + 'value1'.length) + ('key2'.length + 'value2'.length)) * 2;
      expect(usage.used).toBe(expected);
    });
  });

  describe('checkQuota', () => {
    it('should allow save when quota is available', () => {
      const result = Storage.checkQuota(100);

      expect(result.canSave).toBe(true);
      expect(result.usage).toBeDefined();
    });

    it('should deny save when quota would be exceeded', () => {
      const hugeSize = Storage.QUOTA.MAX_SIZE + 1000;
      const result = Storage.checkQuota(hugeSize);

      expect(result.canSave).toBe(false);
      expect(result.reason).toBe('quota_exceeded');
      expect(result.message).toContain('Espace de stockage insuffisant');
    });

    it('should trigger warning callback at warning threshold', () => {
      let warningCalled = false;
      let warningLevel = null;

      Storage.onQuotaWarning((level, usage) => {
        warningCalled = true;
        warningLevel = level;
      });

      // Simuler 80% d'utilisation
      const threshold80 = Math.floor(Storage.QUOTA.MAX_SIZE * 0.81);
      const result = Storage.checkQuota(threshold80);

      expect(result.canSave).toBe(true);
      expect(result.reason).toBe('warning_threshold');
      expect(warningCalled).toBe(true);
      expect(warningLevel).toBe('warning');
    });

    it('should trigger critical warning at critical threshold', () => {
      let warningLevel = null;

      Storage.onQuotaWarning((level) => {
        warningLevel = level;
      });

      // Simuler 95% d'utilisation
      const threshold95 = Math.floor(Storage.QUOTA.MAX_SIZE * 0.96);
      const result = Storage.checkQuota(threshold95);

      expect(result.canSave).toBe(true);
      expect(result.reason).toBe('critical_threshold');
      expect(warningLevel).toBe('critical');
    });
  });

  describe('_saveWithQuotaCheck', () => {
    it('should save successfully when quota allows', () => {
      const result = Storage._saveWithQuotaCheck('test_key', 'test_value');

      expect(result.success).toBe(true);
      expect(localStorage.getItem('test_key')).toBe('test_value');
    });

    it('should fail when quota exceeded', () => {
      let errorCalled = false;

      Storage.onQuotaError(() => {
        errorCalled = true;
      });

      // Simuler en vérifiant avec une énorme taille
      const originalCheckQuota = Storage.checkQuota.bind(Storage);
      Storage.checkQuota = () => ({
        canSave: false,
        reason: 'quota_exceeded',
        message: 'Test quota exceeded'
      });

      const result = Storage._saveWithQuotaCheck('test_key', 'test_value');

      Storage.checkQuota = originalCheckQuota;

      expect(result.success).toBe(false);
      expect(result.error).toContain('Test quota exceeded');
      expect(errorCalled).toBe(true);
    });

    it('should handle actual QuotaExceededError from localStorage', () => {
      let errorCalled = false;

      Storage.onQuotaError(() => {
        errorCalled = true;
      });

      const originalSetItem = localStorage.setItem;
      localStorage.setItem = function() {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      };

      const result = Storage._saveWithQuotaCheck('test_key', 'test_value');

      localStorage.setItem = originalSetItem;

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quota localStorage dépassé');
      expect(errorCalled).toBe(true);
    });

    it('should account for existing data when checking quota', () => {
      // D'abord sauvegarder quelque chose
      localStorage.setItem('test_key', 'old_value');

      // La mise à jour devrait considérer la différence de taille
      const result = Storage._saveWithQuotaCheck('test_key', 'new_value');

      expect(result.success).toBe(true);
      expect(localStorage.getItem('test_key')).toBe('new_value');
    });
  });

  describe('Callback registration', () => {
    // Espion minimal (le framework maison n'a pas de jest.fn)
    const spy = () => {
      const fn = (...args) => { fn.calls.push(args); };
      fn.calls = [];
      return fn;
    };
    const calledWith = (fn, ...args) =>
      fn.calls.some(c => JSON.stringify(c) === JSON.stringify(args));

    it('should register warning callbacks', () => {
      const callback = spy();
      Storage.onQuotaWarning(callback);

      expect(Storage._quotaWarningCallbacks).toContain(callback);
    });

    it('should register error callbacks', () => {
      const callback = spy();
      Storage.onQuotaError(callback);

      expect(Storage._quotaErrorCallbacks).toContain(callback);
    });

    it('should call multiple warning callbacks', () => {
      const callback1 = spy();
      const callback2 = spy();

      Storage.onQuotaWarning(callback1);
      Storage.onQuotaWarning(callback2);

      Storage._notifyQuotaWarning('warning', { used: 1000 });

      expect(calledWith(callback1, 'warning', { used: 1000 })).toBe(true);
      expect(calledWith(callback2, 'warning', { used: 1000 })).toBe(true);
    });

    it('should handle callback errors gracefully', () => {
      const failingCallback = () => {
        throw new Error('Callback error');
      };
      const successCallback = spy();

      Storage.onQuotaWarning(failingCallback);
      Storage.onQuotaWarning(successCallback);

      // Should not throw
      expect(() => {
        Storage._notifyQuotaWarning('warning', { used: 1000 });
      }).not.toThrow();

      // Second callback should still be called
      expect(successCallback.calls.length).toBeGreaterThan(0);
    });
  });

  describe('QUOTA configuration', () => {
    // Sauvegarder les valeurs originales
    const originalMaxSize = 50 * 1024 * 1024;
    const originalWarning = 0.8;
    const originalCritical = 0.95;

    afterEach(() => {
      // Restaurer les valeurs par défaut après chaque test
      Storage.QUOTA.MAX_SIZE = originalMaxSize;
      Storage.QUOTA.WARNING_THRESHOLD = originalWarning;
      Storage.QUOTA.CRITICAL_THRESHOLD = originalCritical;
    });

    it('should have correct default values', () => {
      expect(Storage.QUOTA.MAX_SIZE).toBe(50 * 1024 * 1024); // 50MB
      expect(Storage.QUOTA.WARNING_THRESHOLD).toBe(0.8);
      expect(Storage.QUOTA.CRITICAL_THRESHOLD).toBe(0.95);
    });

    it('should allow configuring maxSize', () => {
      Storage.configure({ maxSize: 10 * 1024 * 1024 }); // 10MB

      expect(Storage.QUOTA.MAX_SIZE).toBe(10 * 1024 * 1024);
    });

    it('should allow configuring thresholds', () => {
      Storage.configure({
        warningThreshold: 0.7,
        criticalThreshold: 0.9
      });

      expect(Storage.QUOTA.WARNING_THRESHOLD).toBe(0.7);
      expect(Storage.QUOTA.CRITICAL_THRESHOLD).toBe(0.9);
    });

    it('should ignore invalid maxSize values', () => {
      const original = Storage.QUOTA.MAX_SIZE;

      Storage.configure({ maxSize: -100 });
      expect(Storage.QUOTA.MAX_SIZE).toBe(original);

      Storage.configure({ maxSize: 'invalid' });
      expect(Storage.QUOTA.MAX_SIZE).toBe(original);

      Storage.configure({ maxSize: 0 });
      expect(Storage.QUOTA.MAX_SIZE).toBe(original);
    });

    it('should ignore invalid threshold values', () => {
      Storage.configure({
        warningThreshold: 1.5,  // > 1
        criticalThreshold: -0.5 // < 0
      });

      expect(Storage.QUOTA.WARNING_THRESHOLD).toBe(0.8);
      expect(Storage.QUOTA.CRITICAL_THRESHOLD).toBe(0.95);
    });
  });
});

describe('Storage - Hidden Decks', () => {
  beforeEach(() => {
    localStorage.clear();
    Storage._quotaWarningCallbacks = [];
    Storage._quotaErrorCallbacks = [];
  });

  it('should hide a deck', () => {
    const result = Storage.hideDeck('deck-1');

    expect(result).toBe(true);
    expect(Storage.isDeckHidden('deck-1')).toBe(true);
  });

  it('should unhide a deck', () => {
    Storage.hideDeck('deck-1');
    const result = Storage.unhideDeck('deck-1');

    expect(result).toBe(true);
    expect(Storage.isDeckHidden('deck-1')).toBe(false);
  });

  it('should toggle deck visibility', () => {
    expect(Storage.isDeckHidden('deck-1')).toBe(false);

    Storage.toggleDeckHidden('deck-1');
    expect(Storage.isDeckHidden('deck-1')).toBe(true);

    Storage.toggleDeckHidden('deck-1');
    expect(Storage.isDeckHidden('deck-1')).toBe(false);
  });

  it('should not duplicate hidden deck IDs', () => {
    Storage.hideDeck('deck-1');
    Storage.hideDeck('deck-1');

    const hiddenDecks = Storage.getHiddenDecks();
    expect(hiddenDecks.filter(id => id === 'deck-1')).toHaveLength(1);
  });
});

describe('Storage - Schema Validation', () => {
  beforeEach(() => {
    localStorage.clear();
    Storage._quotaWarningCallbacks = [];
    Storage._quotaErrorCallbacks = [];
  });

  describe('validatePlayer', () => {
    it('should validate and sanitize a player object', () => {
      const player = {
        id: 'player_1',
        name: 'Test',
        createdAt: '2025-01-01'
        // Missing stats, badges, settings
      };

      const validated = Storage.validatePlayer(player);

      expect(validated.id).toBe('player_1');
      expect(validated.stats).toBeDefined();
      expect(validated.stats.totalXP).toBe(0);
      expect(validated.badges).toEqual([]);
      expect(validated.settings).toBeDefined();
    });

    it('should return null for null input', () => {
      expect(Storage.validatePlayer(null)).toBeNull();
    });

    it('should preserve existing stats', () => {
      const player = {
        id: 'player_1',
        name: 'Test',
        createdAt: '2025-01-01',
        stats: { totalXP: 500, totalCardsPlayed: 50 }
      };

      const validated = Storage.validatePlayer(player);

      expect(validated.stats.totalXP).toBe(500);
      expect(validated.stats.totalCardsPlayed).toBe(50);
    });
  });

  describe('sanitizeCardProgress', () => {
    it('should validate card progress', () => {
      const progress = {
        id: 'card_1',
        box: 'green',
        latencyThreshold: 3
      };

      const validated = Storage.sanitizeCardProgress(progress);

      expect(validated.id).toBe('card_1');
      expect(validated.box).toBe('green');
      expect(validated.timesPlayed).toBe(0);
      expect(validated.timesCorrect).toBe(0);
    });

    it('should correct invalid box value', () => {
      const progress = {
        id: 'card_1',
        box: 'invalid'
      };

      const validated = Storage.sanitizeCardProgress(progress);

      expect(validated.box).toBe('never_played');
    });

    it('should return null for null input', () => {
      expect(Storage.sanitizeCardProgress(null)).toBeNull();
    });
  });

  describe('Integration - loadPlayer with validation', () => {
    it('should validate data on load', () => {
      // Save data directly to localStorage (bypassing validation)
      const rawData = {
        id: 'player_1',
        name: 'Test',
        createdAt: '2025-01-01'
        // Missing stats, badges, settings
      };
      localStorage.setItem('tyb_player', JSON.stringify(rawData));

      const loaded = Storage.loadPlayer();

      expect(loaded.stats).toBeDefined();
      expect(loaded.stats.totalXP).toBe(0);
      expect(loaded.badges).toEqual([]);
    });
  });
});

describe('Storage - Backup System', () => {
  beforeEach(() => {
    localStorage.clear();
    Storage._quotaWarningCallbacks = [];
    Storage._quotaErrorCallbacks = [];
  });

  describe('createBackup', () => {
    it('should create a backup of existing data', () => {
      // Setup: save some data first
      localStorage.setItem('test_key', 'original_data');

      const result = Storage.createBackup('test_key');

      expect(result.success).toBe(true);
      expect(result.backupKey).toBe('tyb_backup_test_key');

      // Verify backup exists
      const backupData = localStorage.getItem('tyb_backup_test_key');
      expect(backupData).toBeTruthy();

      const parsed = JSON.parse(backupData);
      expect(parsed.data).toBe('original_data');
      expect(parsed.timestamp).toBeDefined();
    });

    it('should return null backupKey when no data exists', () => {
      const result = Storage.createBackup('nonexistent_key');

      expect(result.success).toBe(true);
      expect(result.backupKey).toBeNull();
    });
  });

  describe('restoreFromBackup', () => {
    it('should restore data from backup', () => {
      // Setup: create backup data
      const backupData = JSON.stringify({
        timestamp: '2025-01-01T00:00:00Z',
        data: 'backup_data'
      });
      localStorage.setItem('tyb_backup_test_key', backupData);

      const result = Storage.restoreFromBackup('test_key');

      expect(result.success).toBe(true);
      expect(result.restored).toBe(true);

      // Verify data was restored
      expect(localStorage.getItem('test_key')).toBe('backup_data');
    });

    it('should return error when no backup exists', () => {
      const result = Storage.restoreFromBackup('nonexistent_key');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No backup found');
    });
  });

  describe('_saveWithBackup', () => {
    it('should create backup before saving', () => {
      localStorage.setItem('test_key', 'original_data');

      const result = Storage._saveWithBackup('test_key', 'new_data');

      expect(result.success).toBe(true);
      expect(result.backupCreated).toBe(true);

      // Verify new data was saved
      expect(localStorage.getItem('test_key')).toBe('new_data');

      // Verify backup was created
      const backupData = JSON.parse(localStorage.getItem('tyb_backup_test_key'));
      expect(backupData.data).toBe('original_data');
    });

    it('should skip backup when no existing data', () => {
      const result = Storage._saveWithBackup('new_key', 'new_data');

      expect(result.success).toBe(true);
      expect(result.backupCreated).toBe(false);

      expect(localStorage.getItem('tyb_backup_new_key')).toBeNull();
    });

    it('should skip backup when createBackupFirst is false', () => {
      localStorage.setItem('test_key', 'original_data');

      const result = Storage._saveWithBackup('test_key', 'new_data', false);

      expect(result.success).toBe(true);
      expect(result.backupCreated).toBe(false);

      expect(localStorage.getItem('tyb_backup_test_key')).toBeNull();
    });
  });

  describe('Integration - savePlayer with backup', () => {
    it('should create backup when saving player', () => {
      // First save
      const player1 = {
        id: 'player_1',
        name: 'Original',
        createdAt: '2025-01-01'
      };
      Storage.savePlayer(player1);

      // Second save (should create backup)
      const player2 = {
        id: 'player_1',
        name: 'Updated',
        createdAt: '2025-01-01'
      };
      Storage.savePlayer(player2);

      // Verify backup contains original data
      expect(localStorage.getItem('tyb_backup_tyb_player')).toBeTruthy();

      // Restore and verify original name
      Storage.restoreFromBackup('tyb_player');
      const restored = Storage.loadPlayer();
      expect(restored.name).toBe('Original');
    });
  });

  describe('Integration - saveDeckProgress with backup', () => {
    it('should create backup when saving deck progress', () => {
      // First save
      const progress1 = [{ id: 'card_1', box: 'purple', timesPlayed: 1, timesCorrect: 0 }];
      Storage.saveDeckProgress('deck_1', progress1);

      // Second save (should create backup)
      const progress2 = [{ id: 'card_1', box: 'green', timesPlayed: 2, timesCorrect: 1 }];
      Storage.saveDeckProgress('deck_1', progress2);

      // Verify backup exists
      expect(localStorage.getItem('tyb_backup_tyb_deck_deck_1')).toBeTruthy();

      // Restore and verify original progress
      Storage.restoreFromBackup('tyb_deck_deck_1');
      const restored = Storage.loadDeckProgress('deck_1');
      expect(restored[0].box).toBe('purple');
      expect(restored[0].timesPlayed).toBe(1);
    });
  });
});
