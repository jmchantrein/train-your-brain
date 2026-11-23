/**
 * Tests pour le module Compression
 *
 * Tests de compression/décompression :
 * - Compression de base
 * - Décompression de base
 * - Cycle compression/décompression
 * - Détection des données compressées
 * - Gestion d'erreurs
 * - Statistiques de compression
 * - Compression de JSON (aller-retour par compress / decompress)
 */

// Import du module
const Compression = require('../src/modules/compression.js');

// Aller-retour d'un objet JSON par l'API de chaîne (compress / decompress)
const compressObj = (obj) => Compression.compress(JSON.stringify(obj));
const decompressObj = (data) => JSON.parse(Compression.decompress(data));

describe('Compression - Basic Operations', () => {
  it('should compress a string', () => {
    const original = 'Hello World! This is a test string that should be compressed.';
    const compressed = Compression.compress(original);

    expect(compressed).toBeDefined();
    expect(typeof compressed).toBe('string');
    expect(compressed).not.toBe(original);
    expect(Compression.isCompressed(compressed)).toBe(true);
  });

  it('should decompress a compressed string', () => {
    const original = 'Hello World! This is a test string.';
    const compressed = Compression.compress(original);
    const decompressed = Compression.decompress(compressed);

    expect(decompressed).toBe(original);
  });

  it('should handle empty string', () => {
    const compressed = Compression.compress('');
    const decompressed = Compression.decompress(compressed);

    expect(decompressed).toBe('');
  });

  it('should handle null input', () => {
    const compressed = Compression.compress(null);
    expect(compressed).toBeNull();

    const decompressed = Compression.decompress(null);
    expect(decompressed).toBeNull();
  });

  it('should handle undefined input', () => {
    const compressed = Compression.compress(undefined);
    expect(compressed).toBeUndefined();

    const decompressed = Compression.decompress(undefined);
    expect(decompressed).toBeUndefined();
  });

  it('should handle non-string input gracefully', () => {
    const compressed = Compression.compress(123);
    expect(compressed).toBe(123);

    const decompressed = Compression.decompress(456);
    expect(decompressed).toBe(456);
  });
});

describe('Compression - Marker Detection', () => {
  it('should detect compressed data', () => {
    const original = 'Test data';
    const compressed = Compression.compress(original);

    expect(Compression.isCompressed(compressed)).toBe(true);
  });

  it('should not detect uncompressed data as compressed', () => {
    const original = 'Test data';

    expect(Compression.isCompressed(original)).toBe(false);
  });

  it('should handle data without marker', () => {
    const uncompressed = 'Regular data without compression';
    const result = Compression.decompress(uncompressed);

    // Should return as-is when not compressed
    expect(result).toBe(uncompressed);
  });

  it('should add version marker to compressed data', () => {
    const original = 'Test';
    const compressed = Compression.compress(original);

    expect(compressed).toContain('__COMPRESSED__');
    expect(compressed).toContain(':v1:');
  });
});

describe('Compression - Complete Cycle', () => {
  it('should preserve data through compress/decompress cycle', () => {
    const original = 'The quick brown fox jumps over the lazy dog. '.repeat(10);
    const compressed = Compression.compress(original);
    const decompressed = Compression.decompress(compressed);

    expect(decompressed).toBe(original);
  });

  it('should handle Unicode characters', () => {
    const original = 'Héllo Wörld! 你好世界 🌍🚀';
    const compressed = Compression.compress(original);
    const decompressed = Compression.decompress(compressed);

    expect(decompressed).toBe(original);
  });

  it('should handle special characters', () => {
    const original = 'Special chars: !@#$%^&*()_+-={}[]|\\:";\'<>?,./';
    const compressed = Compression.compress(original);
    const decompressed = Compression.decompress(compressed);

    expect(decompressed).toBe(original);
  });

  it('should handle newlines and tabs', () => {
    const original = 'Line 1\nLine 2\n\tIndented line\n\n\nMultiple newlines';
    const compressed = Compression.compress(original);
    const decompressed = Compression.decompress(compressed);

    expect(decompressed).toBe(original);
  });

  it('should handle long strings', () => {
    const original = 'Lorem ipsum dolor sit amet, '.repeat(1000);
    const compressed = Compression.compress(original);
    const decompressed = Compression.decompress(compressed);

    expect(decompressed).toBe(original);
  });
});

describe('Compression - JSON Operations', () => {
  it('should compress and decompress JSON objects', () => {
    const original = {
      id: 'player_123',
      name: 'Test Player',
      stats: {
        totalXP: 1500,
        totalCardsPlayed: 250
      },
      badges: ['first_card', 'streak_7', 'level_5'],
      settings: {
        soundEnabled: true,
        theme: 'dark'
      }
    };

    const compressed = compressObj(original);
    const decompressed = decompressObj(compressed);

    expect(decompressed).toEqual(original);
  });

  it('should handle nested arrays in JSON', () => {
    const original = {
      decks: [
        { id: 'deck1', cards: [1, 2, 3] },
        { id: 'deck2', cards: [4, 5, 6] }
      ]
    };

    const compressed = compressObj(original);
    const decompressed = decompressObj(compressed);

    expect(decompressed).toEqual(original);
  });

  it('should handle null values in JSON', () => {
    const original = {
      name: 'Test',
      value: null,
      optional: undefined // undefined will be removed by JSON.stringify
    };

    const compressed = compressObj(original);
    const decompressed = decompressObj(compressed);

    expect(decompressed.name).toBe('Test');
    expect(decompressed.value).toBeNull();
  });

});

describe('Compression - Statistics', () => {
  it('should calculate compression statistics', () => {
    const original = 'Hello World! '.repeat(100);
    const compressed = Compression.compress(original);
    const stats = Compression.getCompressionStats(original, compressed);

    expect(stats).toBeDefined();
    expect(stats.originalSize).toBeGreaterThan(0);
    expect(stats.compressedSize).toBeGreaterThan(0);
    expect(stats.compressedSize).toBeLessThan(stats.originalSize);
    expect(stats.savedBytes).toBeGreaterThan(0);
    expect(stats.savedPercent).toBeGreaterThan(0);
    expect(stats.ratio).toBeLessThan(1);
  });

  it('should show good compression for repetitive data', () => {
    const original = 'AAAAAAAAAA'.repeat(100); // Highly repetitive
    const compressed = Compression.compress(original);
    const stats = Compression.getCompressionStats(original, compressed);

    // Repetitive data should compress very well
    expect(stats.savedPercent).toBeGreaterThan(50);
  });

  it('should show less compression for random data', () => {
    // Generate pseudo-random string
    const original = Array.from({ length: 1000 }, (_, i) =>
      String.fromCharCode(65 + (i * 7) % 26)
    ).join('');

    const compressed = Compression.compress(original);
    const stats = Compression.getCompressionStats(original, compressed);

    // Still should save some space
    expect(stats.savedPercent).toBeGreaterThan(0);
  });

  it('should handle null inputs in stats calculation', () => {
    const stats = Compression.getCompressionStats(null, 'test');
    expect(stats).toBeNull();

    const stats2 = Compression.getCompressionStats('test', null);
    expect(stats2).toBeNull();
  });
});

describe('Compression - Error Handling', () => {
  it('should handle corrupted compressed data gracefully', () => {
    const corrupted = '__COMPRESSED__:v1:corrupted_data_here';
    const result = Compression.decompress(corrupted);

    // LZ-String n'a pas de checksum : une charge corrompue se décode en texte
    // arbitraire au lieu d'échouer. Le contrat réel est de ne pas lever
    // d'exception ; Storage rejette ensuite le résultat via JSON.parse.
    expect(typeof result).toBe('string');
  });

  it('should handle unsupported compression version', () => {
    const unsupported = '__COMPRESSED__:v999:some_data';
    const result = Compression.decompress(unsupported);

    // Should fallback to returning original
    expect(result).toBe(unsupported);
  });

  it('should handle malformed marker', () => {
    const malformed = '__COMPRESSED__invalid';
    const result = Compression.decompress(malformed);

    // Should return as-is when marker is malformed
    expect(result).toBe(malformed);
  });

});

describe('Compression - Real World Scenarios', () => {
  it('should compress player data effectively', () => {
    const playerData = {
      id: 'player_12345',
      name: 'Jean Dupont',
      createdAt: '2025-01-15T10:00:00Z',
      stats: {
        totalXP: 15000,
        totalCardsPlayed: 2500,
        totalSessions: 150,
        currentStreak: 12,
        longestStreak: 25,
        longestGreenStreak: 18,
        lastPlayedAt: '2025-12-05T14:30:00Z'
      },
      badges: [
        'first_card', 'streak_3', 'streak_7', 'streak_14',
        'level_5', 'level_10', 'math_beginner', 'math_intermediate'
      ],
      settings: {
        soundEnabled: true,
        theme: 'dark',
        language: 'fr'
      }
    };

    const originalJSON = JSON.stringify(playerData);
    const compressed = compressObj(playerData);
    const decompressed = decompressObj(compressed);

    expect(decompressed).toEqual(playerData);

    const stats = Compression.getCompressionStats(originalJSON, compressed);
    expect(stats.savedPercent).toBeGreaterThan(0);
  });

  it('should compress deck progress data effectively', () => {
    const deckProgress = Array.from({ length: 50 }, (_, i) => ({
      id: `card_${i}`,
      box: i % 4 === 0 ? 'green' : i % 3 === 0 ? 'orange' : 'purple',
      latencyThreshold: 3 + (i % 5),
      bestResponseTimeMs: 1000 + (i * 100),
      lastResponseTimeMs: 1500 + (i * 150),
      restUntil: i % 4 === 0 ? '2025-12-10' : null,
      timesPlayed: 5 + i,
      timesCorrect: 3 + (i % 4)
    }));

    const originalJSON = JSON.stringify(deckProgress);
    const compressed = Compression.compress(originalJSON);
    const decompressed = Compression.decompress(compressed);

    expect(JSON.parse(decompressed)).toEqual(deckProgress);

    const stats = Compression.getCompressionStats(originalJSON, compressed);
    // Deck progress has many repeated keys, should compress well
    expect(stats.savedPercent).toBeGreaterThan(30);
  });

  it('should handle multiple compression cycles', () => {
    const original = { test: 'data', value: 123 };

    // First cycle
    const compressed1 = compressObj(original);
    const decompressed1 = decompressObj(compressed1);
    expect(decompressed1).toEqual(original);

    // Second cycle (should not double-compress)
    const compressed2 = compressObj(decompressed1);
    const decompressed2 = decompressObj(compressed2);
    expect(decompressed2).toEqual(original);
  });
});

describe('Compression - Performance Characteristics', () => {
  it('should compress small data', () => {
    const small = 'Test';
    const compressed = Compression.compress(small);
    const decompressed = Compression.decompress(compressed);

    expect(decompressed).toBe(small);
  });

  it('should compress medium data', () => {
    const medium = 'Test data '.repeat(100);
    const compressed = Compression.compress(medium);
    const decompressed = Compression.decompress(compressed);

    expect(decompressed).toBe(medium);
  });

  it('should compress large data', () => {
    const large = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(500);
    const compressed = Compression.compress(large);
    const decompressed = Compression.decompress(compressed);

    expect(decompressed).toBe(large);
  });

  it('should save significant space on JSON with repeated keys', () => {
    const data = Array.from({ length: 100 }, (_, i) => ({
      veryLongKeyNameThatRepeats: i,
      anotherLongKeyNameThatAlsoRepeats: i * 2,
      yetAnotherVeryLongKeyName: i * 3
    }));

    const originalJSON = JSON.stringify(data);
    const compressed = Compression.compress(originalJSON);
    const stats = Compression.getCompressionStats(originalJSON, compressed);

    // Should save significant space due to repeated long keys
    expect(stats.savedPercent).toBeGreaterThan(40);
  });
});
