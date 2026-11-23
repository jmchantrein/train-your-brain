/**
 * Tests d'intégrité des données de Storage (revue 2026-11)
 *
 * Couvre des défauts de perte / fuite de données :
 * - importAll : progression écrite chez le mauvais joueur, import partiel non validé
 * - moveToTrash : deck perdu si la 2e écriture échoue
 * - migration vers stockage individuel : deck perdu si une écriture échoue
 * - erreur de quota Firefox non reconnue
 * - suppression d'un joueur : progression multilingue et backups orphelins,
 *   collision de préfixes entre joueurs
 */

if (typeof Storage === 'undefined') {
  global.Storage = require('../src/modules/storage.js');
}

// Remplace temporairement localStorage.setItem ; `shouldFail(key)` décide de l'échec.
function withFailingSetItem(shouldFail, errorName, fn) {
  const original = localStorage.setItem;
  localStorage.setItem = function(key, value) {
    if (shouldFail(key)) {
      const error = new Error(errorName);
      error.name = errorName;
      throw error;
    }
    return original.call(localStorage, key, value);
  };
  try {
    return fn();
  } finally {
    localStorage.setItem = original;
  }
}

describe('Storage - importAll isolation et validation', () => {
  beforeEach(() => {
    localStorage.clear();
    Storage._quotaWarningCallbacks = [];
    Storage._quotaErrorCallbacks = [];
  });

  const progress = [{ id: 'c1', box: 'green', latencyThreshold: 3, bestResponseTimeMs: 1000, lastResponseTimeMs: 1000, restUntil: null, timesPlayed: 2, timesCorrect: 2 }];

  it('should not overwrite the current player progress when importing another player', () => {
    // Joueur B courant, avec sa propre progression
    Storage.setCurrentPlayerId('player_B');
    Storage.saveDeckProgress('deck-1', [{ id: 'c1', box: 'purple', timesPlayed: 1, timesCorrect: 0 }]);

    Storage.importAll({
      version: '1.0.0',
      player: { id: 'player_A', name: 'A', createdAt: '2025-01-01T00:00:00Z' },
      progress: { 'deck-1': progress }
    });

    // La progression de B est intacte
    expect(Storage.loadDeckProgress('deck-1')[0].box).toBe('purple');

    // La progression importée appartient à A
    Storage.setCurrentPlayerId('player_A');
    const loadedA = Storage.loadDeckProgress('deck-1');
    expect(loadedA).not.toBeNull();
    expect(loadedA[0].box).toBe('green');
  });

  it('should not write anything when the payload is invalid (all or nothing)', () => {
    const bad = {
      version: '1.0.0',
      player: { id: 'player_A', name: 'A', createdAt: '2025-01-01T00:00:00Z' },
      settings: { theme: 'light' },
      progress: { 'deck-1': 'not-an-array' }
    };

    expect(() => Storage.importAll(bad)).toThrow('Invalid import data');

    expect(Storage.loadPlayer()).toBeNull();
    expect(Storage.loadSettings()).toBeNull();
  });

  it('should reject malformed player, settings and progress entries', () => {
    expect(() => Storage.importAll({ version: '1.0.0', player: 'alice' })).toThrow('Invalid import data');
    expect(() => Storage.importAll({ version: '1.0.0', settings: [1, 2] })).toThrow('Invalid import data');
    expect(() => Storage.importAll({ version: '1.0.0', progress: [] })).toThrow('Invalid import data');
    expect(() => Storage.importAll({ version: '1.0.0', progress: { d: [null] } })).toThrow('Invalid import data');
  });

  it('should throw when a write fails instead of reporting success', () => {
    const data = { version: '1.0.0', settings: { theme: 'light' } };
    withFailingSetItem(() => true, 'QuotaExceededError', () => {
      expect(() => Storage.importAll(data)).toThrow('Import failed');
    });
  });
});

describe('Storage - corbeille cohérente', () => {
  beforeEach(() => {
    localStorage.clear();
    Storage._quotaWarningCallbacks = [];
    Storage._quotaErrorCallbacks = [];
  });

  it('should not lose the deck when the trash index cannot be written', () => {
    Storage.saveCustomDeck({ id: 'd1', name: 'Deck 1', cards: [{ id: 'c1', question: 'Q', answer: 'A' }] });

    const result = withFailingSetItem(key => key === Storage.KEYS.TRASH_DECKS, 'QuotaExceededError', () => {
      return Storage.moveToTrash('d1');
    });

    expect(result).toBe(false);
    // Le deck doit rester visible : soit toujours actif, soit dans la corbeille
    const active = Storage._loadCustomDecksIndex().some(m => m.id === 'd1');
    const trashed = Storage._loadTrashIndex().some(m => m.id === 'd1');
    expect(active || trashed).toBe(true);
  });

  it('should keep the deck active when the active index cannot be written', () => {
    Storage.saveCustomDeck({ id: 'd1', name: 'Deck 1', cards: [{ id: 'c1', question: 'Q', answer: 'A' }] });

    const result = withFailingSetItem(key => key === Storage.KEYS.CUSTOM_DECKS, 'QuotaExceededError', () => {
      return Storage.moveToTrash('d1');
    });

    expect(result).toBe(false);
    expect(Storage._loadCustomDecksIndex().some(m => m.id === 'd1')).toBe(true);
    // Pas de doublon fantôme dans la corbeille
    expect(Storage._loadTrashIndex().some(m => m.id === 'd1')).toBe(false);
  });
});

describe('Storage - migration vers stockage individuel', () => {
  beforeEach(() => {
    localStorage.clear();
    Storage._quotaWarningCallbacks = [];
    Storage._quotaErrorCallbacks = [];
  });

  it('should not drop a legacy deck whose individual write fails', () => {
    const legacy = [
      { id: 'd1', name: 'Deck 1', cards: [{ id: 'c1', question: 'Q1', answer: 'A1' }] },
      { id: 'd2', name: 'Deck 2', cards: [{ id: 'c2', question: 'Q2', answer: 'A2' }] }
    ];
    localStorage.setItem(Storage.KEYS.CUSTOM_DECKS, JSON.stringify(legacy));

    withFailingSetItem(key => key === Storage.KEYS.CUSTOM_DECK_PREFIX + 'd2', 'QuotaExceededError', () => {
      Storage._loadCustomDecksIndex();
    });

    // Les données de d2 ne doivent exister nulle part -> elles doivent encore être dans l'ancien format
    const stored = localStorage.getItem(Storage.KEYS.CUSTOM_DECKS);
    const individual = localStorage.getItem(Storage.KEYS.CUSTOM_DECK_PREFIX + 'd2');
    expect(stored.includes('Q2') || individual !== null).toBe(true);
  });
});

describe('Storage - erreur de quota Firefox', () => {
  beforeEach(() => {
    localStorage.clear();
    Storage._quotaWarningCallbacks = [];
    Storage._quotaErrorCallbacks = [];
  });

  it('should report NS_ERROR_DOM_QUOTA_REACHED as a quota error instead of throwing', () => {
    let notified = false;
    Storage.onQuotaError(() => { notified = true; });

    const result = withFailingSetItem(() => true, 'NS_ERROR_DOM_QUOTA_REACHED', () => {
      return Storage._saveWithQuotaCheck('tyb_test', '{}');
    });

    expect(result.success).toBe(false);
    expect(notified).toBe(true);
  });
});

describe('Storage - suppression des données d\'un joueur', () => {
  beforeEach(() => {
    localStorage.clear();
    Storage._quotaWarningCallbacks = [];
    Storage._quotaErrorCallbacks = [];
  });

  function seedPlayer(id) {
    Storage.savePlayerById({ id, name: id, createdAt: '2025-01-01T00:00:00Z' });
    Storage.setCurrentPlayerId(id);
    // Deux écritures : la 2e crée le backup de la 1re
    Storage.saveDeckProgress('deck-1', [{ id: 'c1', box: 'green', timesPlayed: 1, timesCorrect: 1 }]);
    Storage.saveDeckProgress('deck-1', [{ id: 'c1', box: 'orange', timesPlayed: 2, timesCorrect: 1 }]);
    Storage.saveMultilingualProgress('vocab', [{ id: 'w1', progress: { fr: { box: 'green' } } }]);
    Storage.savePlayerById({ id, name: id + ' v2', createdAt: '2025-01-01T00:00:00Z' });
  }

  function keysContaining(id) {
    const found = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(id)) found.push(key);
    }
    return found;
  }

  it('clearCurrentPlayerData should delete backups of that player', () => {
    seedPlayer('player_A');
    Storage.clearCurrentPlayerData();

    expect(keysContaining('player_A')).toEqual([]);
  });

  it('clearCurrentPlayerData should not touch a player whose id starts with the same prefix', () => {
    seedPlayer('player_1');
    seedPlayer('player_10');
    Storage.setCurrentPlayerId('player_1');

    Storage.clearCurrentPlayerData();

    expect(Storage.loadPlayerById('player_10')).not.toBeNull();
    Storage.setCurrentPlayerId('player_10');
    expect(Storage.loadDeckProgress('deck-1')).not.toBeNull();
    expect(Storage.loadMultilingualProgress('vocab')).not.toBeNull();
  });
});
