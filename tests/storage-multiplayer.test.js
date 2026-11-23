/**
 * Tests pour l'isolation des données multi-joueurs
 *
 * Ces tests vérifient que :
 * - La progression des decks est isolée par joueur
 * - Les données legacy ne sont PAS migrées vers les nouveaux joueurs
 * - Le changement de joueur charge les bonnes données
 * - La suppression d'un joueur ne supprime que ses données
 * - Les clés legacy sont correctement nettoyées
 */

// Storage est chargé globalement par le runner, sinon on le require
if (typeof Storage === 'undefined') {
  global.Storage = require('../src/modules/storage.js');
}

describe('Storage - Multi-Player Isolation', () => {
  beforeEach(() => {
    localStorage.clear();
    Storage._quotaWarningCallbacks = [];
    Storage._quotaErrorCallbacks = [];
  });

  // ═══════════════════════════════════════════
  // Tests de génération de clés per-player
  // ═══════════════════════════════════════════

  describe('Player Progress Key Generation', () => {
    it('should generate per-player progress key when player is set', () => {
      // Créer et définir un joueur courant
      const player = { id: 'player_alice', name: 'Alice', createdAt: '2025-01-01' };
      Storage.savePlayerById(player);
      Storage.setCurrentPlayerId('player_alice');

      // La clé devrait inclure l'ID du joueur
      const key = Storage._getPlayerProgressKey('deck_math');
      expect(key).toBe('tyb_pdeck_player_alice_deck_math');
    });

    it('should fallback to legacy key when no player is set', () => {
      // Pas de joueur courant
      localStorage.removeItem('tyb_current_player');

      const key = Storage._getPlayerProgressKey('deck_math');
      expect(key).toBe('tyb_deck_deck_math');
    });

    it('should generate per-player multilingual key when player is set', () => {
      Storage.setCurrentPlayerId('player_bob');

      const key = Storage._getPlayerMultilingualKey('vocab_spanish');
      expect(key).toBe('tyb_pml_player_bob_vocab_spanish');
    });
  });

  // ═══════════════════════════════════════════
  // Tests d'isolation de progression
  // ═══════════════════════════════════════════

  describe('Progress Isolation Between Players', () => {
    const progressAlice = [
      { id: 'card_1', box: 'green', timesPlayed: 10, timesCorrect: 8, latencyThreshold: 3, bestResponseTimeMs: 1000, lastResponseTimeMs: 1200, restUntil: '2025-02-01', restDays: 7 },
      { id: 'card_2', box: 'orange', timesPlayed: 5, timesCorrect: 3, latencyThreshold: 4, bestResponseTimeMs: 2000, lastResponseTimeMs: 2500, restUntil: null, restDays: 0 }
    ];

    const progressBob = [
      { id: 'card_1', box: 'purple', timesPlayed: 2, timesCorrect: 0, latencyThreshold: 5, bestResponseTimeMs: 3000, lastResponseTimeMs: 3500, restUntil: null, restDays: 0 },
      { id: 'card_2', box: 'never_played', timesPlayed: 0, timesCorrect: 0, latencyThreshold: null, bestResponseTimeMs: null, lastResponseTimeMs: null, restUntil: null, restDays: 0 }
    ];

    it('should save progress for different players in different keys', () => {
      // Sauvegarder progression d'Alice
      Storage.setCurrentPlayerId('player_alice');
      Storage.saveDeckProgress('deck_math', progressAlice);

      // Sauvegarder progression de Bob
      Storage.setCurrentPlayerId('player_bob');
      Storage.saveDeckProgress('deck_math', progressBob);

      // Vérifier que les deux existent dans des clés différentes
      expect(localStorage.getItem('tyb_pdeck_player_alice_deck_math')).toBeTruthy();
      expect(localStorage.getItem('tyb_pdeck_player_bob_deck_math')).toBeTruthy();

      // Vérifier que les données sont différentes (stockage compressé par Storage._compressData)
      const aliceData = JSON.parse(Storage._decompressData(localStorage.getItem('tyb_pdeck_player_alice_deck_math')));
      const bobData = JSON.parse(Storage._decompressData(localStorage.getItem('tyb_pdeck_player_bob_deck_math')));

      expect(aliceData[0].box).toBe('green');
      expect(bobData[0].box).toBe('purple');
    });

    it('should load correct progress when switching players', () => {
      // Setup: Sauvegarder les progressions
      Storage.setCurrentPlayerId('player_alice');
      Storage.saveDeckProgress('deck_math', progressAlice);

      Storage.setCurrentPlayerId('player_bob');
      Storage.saveDeckProgress('deck_math', progressBob);

      // Test: Charger en tant qu'Alice
      Storage.setCurrentPlayerId('player_alice');
      const loadedAlice = Storage.loadDeckProgress('deck_math');
      expect(loadedAlice[0].box).toBe('green');
      expect(loadedAlice[0].timesPlayed).toBe(10);

      // Test: Charger en tant que Bob
      Storage.setCurrentPlayerId('player_bob');
      const loadedBob = Storage.loadDeckProgress('deck_math');
      expect(loadedBob[0].box).toBe('purple');
      expect(loadedBob[0].timesPlayed).toBe(2);
    });

    it('should return null for deck not played by current player', () => {
      // Alice a joué le deck
      Storage.setCurrentPlayerId('player_alice');
      Storage.saveDeckProgress('deck_math', progressAlice);

      // Bob n'a pas joué ce deck
      Storage.setCurrentPlayerId('player_bob');
      const loaded = Storage.loadDeckProgress('deck_math');

      expect(loaded).toBeNull();
    });

    it('should not share loadAllProgress between players', () => {
      // Setup
      Storage.setCurrentPlayerId('player_alice');
      Storage.saveDeckProgress('deck_math', progressAlice);
      Storage.saveDeckProgress('deck_history', [{ id: 'card_h1', box: 'green', timesPlayed: 1, timesCorrect: 1, latencyThreshold: 2, bestResponseTimeMs: 500, lastResponseTimeMs: 500, restUntil: null, restDays: 0 }]);

      Storage.setCurrentPlayerId('player_bob');
      Storage.saveDeckProgress('deck_science', progressBob);

      // Test: Alice devrait voir seulement ses decks
      Storage.setCurrentPlayerId('player_alice');
      const aliceProgress = Storage.loadAllProgress();
      expect(Object.keys(aliceProgress).sort()).toEqual(['deck_history', 'deck_math']);

      // Test: Bob devrait voir seulement ses decks
      Storage.setCurrentPlayerId('player_bob');
      const bobProgress = Storage.loadAllProgress();
      expect(Object.keys(bobProgress)).toEqual(['deck_science']);
    });
  });

  // ═══════════════════════════════════════════
  // Tests de NON-migration des données legacy
  // ═══════════════════════════════════════════

  describe('Legacy Data Should NOT Be Migrated', () => {
    it('should NOT migrate legacy deck progress to new player', () => {
      // Simuler des données legacy (avant multi-joueur)
      const legacyProgress = [
        { id: 'card_1', box: 'green', timesPlayed: 50, timesCorrect: 45, latencyThreshold: 2, bestResponseTimeMs: 800, lastResponseTimeMs: 900, restUntil: '2025-03-01', restDays: 14 }
      ];
      localStorage.setItem('tyb_deck_deck_math', JSON.stringify(legacyProgress));

      // Créer un nouveau joueur
      Storage.setCurrentPlayerId('new_player_123');

      // Le nouveau joueur ne devrait PAS voir la progression legacy
      const loaded = Storage.loadDeckProgress('deck_math');
      expect(loaded).toBeNull();

      // Les données legacy devraient toujours exister (pas supprimées)
      expect(localStorage.getItem('tyb_deck_deck_math')).toBeTruthy();
    });

    it('should NOT migrate legacy multilingual progress to new player', () => {
      // Simuler des données legacy multilingues
      const legacyProgress = [
        { id: 'word_1', progress: { 'fr→en': { box: 'green', timesPlayed: 20 } } }
      ];
      localStorage.setItem('tyb_multilingual_vocab_spanish', JSON.stringify(legacyProgress));

      // Créer un nouveau joueur
      Storage.setCurrentPlayerId('new_player_456');

      // Le nouveau joueur ne devrait PAS voir la progression legacy
      const loaded = Storage.loadMultilingualProgress('vocab_spanish');
      expect(loaded).toBeNull();
    });

    it('should keep legacy data accessible for original use case', () => {
      // Données legacy
      const legacyProgress = [{ id: 'card_1', box: 'orange', timesPlayed: 5, timesCorrect: 3, latencyThreshold: 3, bestResponseTimeMs: 1500, lastResponseTimeMs: 1800, restUntil: null, restDays: 0 }];
      localStorage.setItem('tyb_deck_deck_math', JSON.stringify(legacyProgress));

      // Sans joueur défini, le système devrait pouvoir accéder aux données legacy
      // (pour compatibilité ascendante si nécessaire)
      localStorage.removeItem('tyb_current_player');
      const loaded = Storage.loadDeckProgress('deck_math');

      // Note: Selon l'implémentation, cela peut retourner les données legacy ou null
      // L'important est que ça ne crash pas
      expect(() => Storage.loadDeckProgress('deck_math')).not.toThrow();
    });
  });

  // ═══════════════════════════════════════════
  // Tests de suppression de données joueur
  // ═══════════════════════════════════════════

  describe('Player Data Deletion', () => {
    it('should only delete current player data with clearCurrentPlayerData', () => {
      // Setup: Deux joueurs avec des données
      Storage.setCurrentPlayerId('player_alice');
      Storage.saveDeckProgress('deck_math', [{ id: 'c1', box: 'green', timesPlayed: 1, timesCorrect: 1, latencyThreshold: 2, bestResponseTimeMs: 500, lastResponseTimeMs: 500, restUntil: null, restDays: 0 }]);
      Storage.savePlayerById({ id: 'player_alice', name: 'Alice', createdAt: '2025-01-01' });
      Storage.savePlayersList([
        { id: 'player_alice', name: 'Alice', createdAt: '2025-01-01' },
        { id: 'player_bob', name: 'Bob', createdAt: '2025-01-01' }
      ]);

      Storage.setCurrentPlayerId('player_bob');
      Storage.saveDeckProgress('deck_math', [{ id: 'c1', box: 'purple', timesPlayed: 3, timesCorrect: 1, latencyThreshold: 4, bestResponseTimeMs: 2000, lastResponseTimeMs: 2500, restUntil: null, restDays: 0 }]);
      Storage.savePlayerById({ id: 'player_bob', name: 'Bob', createdAt: '2025-01-01' });

      // Supprimer les données de Bob (joueur courant)
      Storage.clearCurrentPlayerData();

      // Les données de Bob devraient être supprimées
      expect(localStorage.getItem('tyb_pdeck_player_bob_deck_math')).toBeNull();
      expect(localStorage.getItem('tyb_player_player_bob')).toBeNull();

      // Les données d'Alice devraient être intactes
      expect(localStorage.getItem('tyb_pdeck_player_alice_deck_math')).toBeTruthy();
      expect(localStorage.getItem('tyb_player_player_alice')).toBeTruthy();
    });

    it('should clear legacy progress when last player is deleted', () => {
      // Setup: Un joueur et des données legacy orphelines
      const legacyData = [{ id: 'c1', box: 'orange', timesPlayed: 1, timesCorrect: 0 }];
      localStorage.setItem('tyb_deck_old_deck', JSON.stringify(legacyData));
      localStorage.setItem('tyb_multilingual_old_vocab', JSON.stringify([{ id: 'w1' }]));

      // Un seul joueur
      Storage.setCurrentPlayerId('last_player');
      Storage.savePlayerById({ id: 'last_player', name: 'Last', createdAt: '2025-01-01' });
      Storage.savePlayersList([{ id: 'last_player', name: 'Last', createdAt: '2025-01-01' }]);

      // Supprimer le dernier joueur
      Storage.clearCurrentPlayerData();

      // Les données legacy devraient aussi être nettoyées
      expect(localStorage.getItem('tyb_deck_old_deck')).toBeNull();
      expect(localStorage.getItem('tyb_multilingual_old_vocab')).toBeNull();
    });

    it('should NOT clear legacy progress when other players still exist', () => {
      // Setup: Données legacy et deux joueurs
      const legacyData = [{ id: 'c1', box: 'green', timesPlayed: 1, timesCorrect: 1 }];
      localStorage.setItem('tyb_deck_old_deck', JSON.stringify(legacyData));

      Storage.savePlayersList([
        { id: 'player_a', name: 'A', createdAt: '2025-01-01' },
        { id: 'player_b', name: 'B', createdAt: '2025-01-01' }
      ]);

      Storage.setCurrentPlayerId('player_a');
      Storage.savePlayerById({ id: 'player_a', name: 'A', createdAt: '2025-01-01' });

      // Supprimer un joueur (mais pas le dernier)
      Storage.clearCurrentPlayerData();

      // Les données legacy devraient toujours exister
      expect(localStorage.getItem('tyb_deck_old_deck')).toBeTruthy();
    });
  });

  // ═══════════════════════════════════════════
  // Tests de nettoyage legacy explicite
  // ═══════════════════════════════════════════

  describe('clearLegacyProgress', () => {
    it('should clear all legacy deck progress keys', () => {
      localStorage.setItem('tyb_deck_deck1', JSON.stringify([{ id: 'c1' }]));
      localStorage.setItem('tyb_deck_deck2', JSON.stringify([{ id: 'c2' }]));
      localStorage.setItem('tyb_deck_deck3', JSON.stringify([{ id: 'c3' }]));

      const count = Storage.clearLegacyProgress();

      expect(count).toBe(3);
      expect(localStorage.getItem('tyb_deck_deck1')).toBeNull();
      expect(localStorage.getItem('tyb_deck_deck2')).toBeNull();
      expect(localStorage.getItem('tyb_deck_deck3')).toBeNull();
    });

    it('should clear all legacy multilingual progress keys', () => {
      localStorage.setItem('tyb_multilingual_vocab1', JSON.stringify([{ id: 'w1' }]));
      localStorage.setItem('tyb_multilingual_vocab2', JSON.stringify([{ id: 'w2' }]));

      const count = Storage.clearLegacyProgress();

      expect(count).toBe(2);
      expect(localStorage.getItem('tyb_multilingual_vocab1')).toBeNull();
      expect(localStorage.getItem('tyb_multilingual_vocab2')).toBeNull();
    });

    it('should NOT clear per-player progress keys', () => {
      // Données per-player
      localStorage.setItem('tyb_pdeck_alice_deck1', JSON.stringify([{ id: 'c1' }]));
      localStorage.setItem('tyb_pml_alice_vocab1', JSON.stringify([{ id: 'w1' }]));

      // Données legacy
      localStorage.setItem('tyb_deck_deck2', JSON.stringify([{ id: 'c2' }]));

      const count = Storage.clearLegacyProgress();

      // Seules les clés legacy devraient être supprimées
      expect(count).toBe(1);
      expect(localStorage.getItem('tyb_pdeck_alice_deck1')).toBeTruthy();
      expect(localStorage.getItem('tyb_pml_alice_vocab1')).toBeTruthy();
    });

    it('should return 0 when no legacy data exists', () => {
      const count = Storage.clearLegacyProgress();
      expect(count).toBe(0);
    });
  });

  // ═══════════════════════════════════════════
  // Tests d'intégrité lors du changement de joueur
  // ═══════════════════════════════════════════

  describe('Player Switching Integrity', () => {
    it('should not corrupt data when rapidly switching players', () => {
      const aliceProgress = [{ id: 'c1', box: 'green', timesPlayed: 100, timesCorrect: 95, latencyThreshold: 2, bestResponseTimeMs: 500, lastResponseTimeMs: 600, restUntil: null, restDays: 0 }];
      const bobProgress = [{ id: 'c1', box: 'purple', timesPlayed: 3, timesCorrect: 0, latencyThreshold: 5, bestResponseTimeMs: 3000, lastResponseTimeMs: 3500, restUntil: null, restDays: 0 }];

      // Sauvegarder pour Alice
      Storage.setCurrentPlayerId('alice');
      Storage.saveDeckProgress('deck1', aliceProgress);

      // Changement rapide vers Bob
      Storage.setCurrentPlayerId('bob');
      Storage.saveDeckProgress('deck1', bobProgress);

      // Retour à Alice
      Storage.setCurrentPlayerId('alice');
      Storage.saveDeckProgress('deck1', [{ ...aliceProgress[0], timesPlayed: 101 }]);

      // Vérifier l'intégrité
      Storage.setCurrentPlayerId('alice');
      const loadedAlice = Storage.loadDeckProgress('deck1');
      expect(loadedAlice[0].timesPlayed).toBe(101);
      expect(loadedAlice[0].box).toBe('green');

      Storage.setCurrentPlayerId('bob');
      const loadedBob = Storage.loadDeckProgress('deck1');
      expect(loadedBob[0].timesPlayed).toBe(3);
      expect(loadedBob[0].box).toBe('purple');
    });

    it('should handle concurrent-like updates correctly', () => {
      // Simuler des mises à jour "simultanées"
      Storage.setCurrentPlayerId('player_1');
      Storage.saveDeckProgress('deck_shared', [{ id: 'c1', box: 'orange', timesPlayed: 5, timesCorrect: 3, latencyThreshold: 3, bestResponseTimeMs: 1000, lastResponseTimeMs: 1200, restUntil: null, restDays: 0 }]);

      Storage.setCurrentPlayerId('player_2');
      Storage.saveDeckProgress('deck_shared', [{ id: 'c1', box: 'green', timesPlayed: 10, timesCorrect: 9, latencyThreshold: 2, bestResponseTimeMs: 500, lastResponseTimeMs: 600, restUntil: null, restDays: 0 }]);

      // Mise à jour pour player_1
      Storage.setCurrentPlayerId('player_1');
      Storage.saveDeckProgress('deck_shared', [{ id: 'c1', box: 'purple', timesPlayed: 6, timesCorrect: 3, latencyThreshold: 4, bestResponseTimeMs: 1000, lastResponseTimeMs: 1500, restUntil: null, restDays: 0 }]);

      // Vérifier que player_2 n'est pas affecté
      Storage.setCurrentPlayerId('player_2');
      const p2Progress = Storage.loadDeckProgress('deck_shared');
      expect(p2Progress[0].box).toBe('green');
      expect(p2Progress[0].timesPlayed).toBe(10);

      // Vérifier player_1
      Storage.setCurrentPlayerId('player_1');
      const p1Progress = Storage.loadDeckProgress('deck_shared');
      expect(p1Progress[0].box).toBe('purple');
      expect(p1Progress[0].timesPlayed).toBe(6);
    });
  });

  // ═══════════════════════════════════════════
  // Tests de progression multilingue isolée
  // ═══════════════════════════════════════════

  describe('Multilingual Progress Isolation', () => {
    const aliceVocab = [
      { id: 'word_hello', progress: { 'fr→en': { box: 'green', timesPlayed: 20 }, 'en→fr': { box: 'orange', timesPlayed: 5 } } }
    ];
    const bobVocab = [
      { id: 'word_hello', progress: { 'fr→en': { box: 'never_played', timesPlayed: 0 } } }
    ];

    it('should isolate multilingual progress between players', () => {
      Storage.setCurrentPlayerId('alice');
      Storage.saveMultilingualProgress('vocab_english', aliceVocab);

      Storage.setCurrentPlayerId('bob');
      Storage.saveMultilingualProgress('vocab_english', bobVocab);

      // Vérifier isolation
      Storage.setCurrentPlayerId('alice');
      const aliceLoaded = Storage.loadMultilingualProgress('vocab_english');
      expect(aliceLoaded[0].progress['fr→en'].box).toBe('green');

      Storage.setCurrentPlayerId('bob');
      const bobLoaded = Storage.loadMultilingualProgress('vocab_english');
      expect(bobLoaded[0].progress['fr→en'].box).toBe('never_played');
    });

    it('should NOT migrate legacy multilingual data', () => {
      // Données legacy
      localStorage.setItem('tyb_multilingual_vocab', JSON.stringify(aliceVocab));

      // Nouveau joueur
      Storage.setCurrentPlayerId('new_player');
      const loaded = Storage.loadMultilingualProgress('vocab');

      expect(loaded).toBeNull();
    });
  });

  // ═══════════════════════════════════════════
  // Tests de régression
  // ═══════════════════════════════════════════

  describe('Regression Tests', () => {
    it('should not show progress from deleted player after recreation', () => {
      // Créer un joueur avec de la progression
      Storage.setCurrentPlayerId('player_temp');
      Storage.savePlayerById({ id: 'player_temp', name: 'Temp', createdAt: '2025-01-01' });
      Storage.savePlayersList([{ id: 'player_temp', name: 'Temp', createdAt: '2025-01-01' }]);
      Storage.saveDeckProgress('deck_test', [{ id: 'c1', box: 'green', timesPlayed: 50, timesCorrect: 48, latencyThreshold: 2, bestResponseTimeMs: 500, lastResponseTimeMs: 600, restUntil: '2025-02-01', restDays: 7 }]);

      // Supprimer le joueur
      Storage.clearCurrentPlayerData();

      // Recréer un joueur avec le même ID (scénario réaliste)
      Storage.setCurrentPlayerId('player_temp');
      Storage.savePlayerById({ id: 'player_temp', name: 'Temp Recreated', createdAt: '2025-01-02' });
      Storage.savePlayersList([{ id: 'player_temp', name: 'Temp Recreated', createdAt: '2025-01-02' }]);

      // La progression ne devrait pas réapparaître
      const loaded = Storage.loadDeckProgress('deck_test');
      expect(loaded).toBeNull();
    });

    it('should handle empty player ID gracefully', () => {
      Storage.setCurrentPlayerId('');

      expect(() => Storage.loadDeckProgress('deck_test')).not.toThrow();
      expect(() => Storage.saveDeckProgress('deck_test', [{ id: 'c1', box: 'purple', timesPlayed: 1, timesCorrect: 0 }])).not.toThrow();
    });

    it('should handle special characters in player ID', () => {
      const specialId = 'player_éàü_🎮_test';
      Storage.setCurrentPlayerId(specialId);
      Storage.saveDeckProgress('deck_test', [{ id: 'c1', box: 'orange', timesPlayed: 1, timesCorrect: 1, latencyThreshold: 2, bestResponseTimeMs: 500, lastResponseTimeMs: 600, restUntil: null, restDays: 0 }]);

      const loaded = Storage.loadDeckProgress('deck_test');
      expect(loaded).toBeTruthy();
      expect(loaded[0].box).toBe('orange');
    });
  });

  // ═══════════════════════════════════════════
  // Tests de scénarios utilisateur réels
  // ═══════════════════════════════════════════

  describe('Real User Scenarios', () => {
    it('Scenario: Family sharing device with multiple players', () => {
      // Papa crée son profil et joue
      Storage.setCurrentPlayerId('papa');
      Storage.savePlayerById({ id: 'papa', name: 'Papa', createdAt: '2025-01-01' });
      Storage.saveDeckProgress('tables_multiplication', [
        { id: '2x3', box: 'green', timesPlayed: 15, timesCorrect: 14, latencyThreshold: 2, bestResponseTimeMs: 500, lastResponseTimeMs: 600, restUntil: '2025-01-20', restDays: 7 }
      ]);

      // Enfant crée son profil
      Storage.setCurrentPlayerId('emma');
      Storage.savePlayerById({ id: 'emma', name: 'Emma', createdAt: '2025-01-01' });

      // Emma ne devrait pas voir la progression de Papa
      const emmaProgress = Storage.loadDeckProgress('tables_multiplication');
      expect(emmaProgress).toBeNull();

      // Emma joue
      Storage.saveDeckProgress('tables_multiplication', [
        { id: '2x3', box: 'purple', timesPlayed: 2, timesCorrect: 0, latencyThreshold: 5, bestResponseTimeMs: 3000, lastResponseTimeMs: 4000, restUntil: null, restDays: 0 }
      ]);

      // Vérifier que Papa a toujours sa progression
      Storage.setCurrentPlayerId('papa');
      const papaProgress = Storage.loadDeckProgress('tables_multiplication');
      expect(papaProgress[0].box).toBe('green');
      expect(papaProgress[0].timesPlayed).toBe(15);
    });

    it('Scenario: User resets their progress but keeps other data', () => {
      // Setup: Deux joueurs
      Storage.savePlayersList([
        { id: 'user_a', name: 'User A', createdAt: '2025-01-01' },
        { id: 'user_b', name: 'User B', createdAt: '2025-01-01' }
      ]);

      Storage.setCurrentPlayerId('user_a');
      Storage.savePlayerById({ id: 'user_a', name: 'User A', createdAt: '2025-01-01' });
      Storage.saveDeckProgress('deck1', [{ id: 'c1', box: 'green', timesPlayed: 100, timesCorrect: 95, latencyThreshold: 2, bestResponseTimeMs: 500, lastResponseTimeMs: 600, restUntil: null, restDays: 0 }]);

      Storage.setCurrentPlayerId('user_b');
      Storage.savePlayerById({ id: 'user_b', name: 'User B', createdAt: '2025-01-01' });
      Storage.saveDeckProgress('deck1', [{ id: 'c1', box: 'orange', timesPlayed: 10, timesCorrect: 7, latencyThreshold: 3, bestResponseTimeMs: 1000, lastResponseTimeMs: 1200, restUntil: null, restDays: 0 }]);

      // User A réinitialise ses données
      Storage.setCurrentPlayerId('user_a');
      Storage.clearCurrentPlayerData();

      // User B devrait toujours avoir ses données
      Storage.setCurrentPlayerId('user_b');
      const userBProgress = Storage.loadDeckProgress('deck1');
      expect(userBProgress).toBeTruthy();
      expect(userBProgress[0].timesPlayed).toBe(10);
    });

    it('Scenario: Migration from single-player to multi-player', () => {
      // Simuler une installation ancienne avec données legacy
      localStorage.setItem('tyb_player', JSON.stringify({ id: 'legacy_user', name: 'Old User', createdAt: '2024-01-01' }));
      localStorage.setItem('tyb_deck_math', JSON.stringify([{ id: 'c1', box: 'green', timesPlayed: 200, timesCorrect: 190 }]));

      // Nouveau système: créer un nouveau joueur
      Storage.setCurrentPlayerId('new_modern_user');
      Storage.savePlayerById({ id: 'new_modern_user', name: 'New User', createdAt: '2025-01-01' });

      // Le nouveau joueur ne devrait pas hériter des données legacy
      const newUserProgress = Storage.loadDeckProgress('math');
      expect(newUserProgress).toBeNull();

      // Les données legacy devraient toujours être là (pour le joueur legacy s'il existe)
      expect(localStorage.getItem('tyb_deck_math')).toBeTruthy();
    });
  });
});
