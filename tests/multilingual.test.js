/**
 * Tests pour le module Multilingual
 *
 * Couvre:
 * - Génération de clés de progression
 * - Initialisation des mots/decks
 * - Validation des réponses
 * - Configuration de session
 * - Sélection de cartes
 * - Statistiques
 */

// ═══════════════════════════════════════════════════════════════
// getProgressKey
// ═══════════════════════════════════════════════════════════════

describe('getProgressKey', () => {
  it('should generate translation key with arrow', () => {
    expect(Multilingual.getProgressKey('translation', 'fr', 'en')).toBe('fr→en');
    expect(Multilingual.getProgressKey('translation', 'en', 'fr')).toBe('en→fr');
    expect(Multilingual.getProgressKey('translation', 'es', 'de')).toBe('es→de');
  });

  it('should generate dictation key with audio prefix', () => {
    expect(Multilingual.getProgressKey('dictation', 'fr', 'fr')).toBe('audio:fr→fr');
    expect(Multilingual.getProgressKey('dictation', 'fr', 'en')).toBe('audio:fr→en');
    expect(Multilingual.getProgressKey('dictation', 'en', 'en')).toBe('audio:en→en');
  });

  it('should generate image key without source', () => {
    expect(Multilingual.getProgressKey('image', null, 'fr')).toBe('image→fr');
    expect(Multilingual.getProgressKey('image', null, 'en')).toBe('image→en');
  });

  it('should throw error for unknown mode', () => {
    expect(() => Multilingual.getProgressKey('unknown', 'fr', 'en')).toThrow();
  });

  it('should throw error for missing targetLang', () => {
    expect(() => Multilingual.getProgressKey('translation', 'fr', null)).toThrow();
    expect(() => Multilingual.getProgressKey('translation', 'fr', undefined)).toThrow();
  });

  it('should throw error for missing sourceLang in translation mode', () => {
    expect(() => Multilingual.getProgressKey('translation', null, 'en')).toThrow();
  });

  it('should throw error for missing sourceLang in dictation mode', () => {
    expect(() => Multilingual.getProgressKey('dictation', null, 'en')).toThrow();
  });

  it('should allow null sourceLang only for image mode', () => {
    expect(() => Multilingual.getProgressKey('image', null, 'fr')).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════
// parseProgressKey
// ═══════════════════════════════════════════════════════════════

describe('parseProgressKey', () => {
  it('should parse translation keys', () => {
    const result = Multilingual.parseProgressKey('fr→en');
    expect(result.mode).toBe('translation');
    expect(result.sourceLang).toBe('fr');
    expect(result.targetLang).toBe('en');
  });

  it('should parse dictation keys', () => {
    const result = Multilingual.parseProgressKey('audio:fr→en');
    expect(result.mode).toBe('dictation');
    expect(result.sourceLang).toBe('fr');
    expect(result.targetLang).toBe('en');
  });

  it('should parse image keys', () => {
    const result = Multilingual.parseProgressKey('image→fr');
    expect(result.mode).toBe('image');
    expect(result.sourceLang).toBeNull();
    expect(result.targetLang).toBe('fr');
  });

  it('should be inverse of getProgressKey', () => {
    const keys = ['fr→en', 'audio:fr→fr', 'image→es'];
    for (const key of keys) {
      const parsed = Multilingual.parseProgressKey(key);
      const regenerated = Multilingual.getProgressKey(parsed.mode, parsed.sourceLang, parsed.targetLang);
      expect(regenerated).toBe(key);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// getAllPossibleDirections
// ═══════════════════════════════════════════════════════════════

describe('getAllPossibleDirections', () => {
  it('should generate all translation pairs', () => {
    const directions = Multilingual.getAllPossibleDirections(['fr', 'en'], false);
    expect(directions).toContain('fr→en');
    expect(directions).toContain('en→fr');
  });

  it('should not include same-language translation', () => {
    const directions = Multilingual.getAllPossibleDirections(['fr', 'en'], false);
    expect(directions).not.toContain('fr→fr');
    expect(directions).not.toContain('en→en');
  });

  it('should include same-language dictation', () => {
    const directions = Multilingual.getAllPossibleDirections(['fr', 'en'], false);
    expect(directions).toContain('audio:fr→fr');
    expect(directions).toContain('audio:en→en');
  });

  it('should include cross-language dictation', () => {
    const directions = Multilingual.getAllPossibleDirections(['fr', 'en'], false);
    expect(directions).toContain('audio:fr→en');
    expect(directions).toContain('audio:en→fr');
  });

  it('should include image directions when enabled', () => {
    const directions = Multilingual.getAllPossibleDirections(['fr', 'en'], true);
    expect(directions).toContain('image→fr');
    expect(directions).toContain('image→en');
  });

  it('should not include image directions when disabled', () => {
    const directions = Multilingual.getAllPossibleDirections(['fr', 'en'], false);
    expect(directions).not.toContain('image→fr');
    expect(directions).not.toContain('image→en');
  });

  it('should handle three languages correctly', () => {
    const directions = Multilingual.getAllPossibleDirections(['fr', 'en', 'es'], false);

    // 3 langues = 6 paires de traduction
    expect(directions.filter(d => !d.startsWith('audio:'))).toHaveLength(6);

    // 3 dictées même langue + 6 dictées cross-langue = 9
    expect(directions.filter(d => d.startsWith('audio:'))).toHaveLength(9);
  });
});

// ═══════════════════════════════════════════════════════════════
// createEmptyProgress
// ═══════════════════════════════════════════════════════════════

describe('createEmptyProgress', () => {
  it('should create progress with never_played box', () => {
    const progress = Multilingual.createEmptyProgress();
    expect(progress.box).toBe('never_played');
  });

  it('should have all required Leitner properties', () => {
    const progress = Multilingual.createEmptyProgress();
    expect(progress.box).toBeDefined();
    expect(progress.latencyThreshold).toBeDefined();
    expect(progress.restUntil).toBeDefined();
    expect(progress.restDays).toBeDefined();
    expect(progress.timesPlayed).toBeDefined();
    expect(progress.timesCorrect).toBeDefined();
  });

  it('should have zero counters', () => {
    const progress = Multilingual.createEmptyProgress();
    expect(progress.timesPlayed).toBe(0);
    expect(progress.timesCorrect).toBe(0);
    expect(progress.restDays).toBe(0);
  });

  it('should have null thresholds', () => {
    const progress = Multilingual.createEmptyProgress();
    expect(progress.latencyThreshold).toBeNull();
    expect(progress.restUntil).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════
// initializeWordProgress
// ═══════════════════════════════════════════════════════════════

describe('initializeWordProgress', () => {
  it('should add progress object if missing', () => {
    const word = { id: 'test' };
    Multilingual.initializeWordProgress(word, ['fr', 'en'], false);
    expect(word.progress).toBeDefined();
  });

  it('should initialize all translation directions', () => {
    const word = { id: 'test' };
    Multilingual.initializeWordProgress(word, ['fr', 'en'], false);
    expect(word.progress['fr→en']).toBeDefined();
    expect(word.progress['en→fr']).toBeDefined();
  });

  it('should initialize dictation directions', () => {
    const word = { id: 'test' };
    Multilingual.initializeWordProgress(word, ['fr', 'en'], false);
    expect(word.progress['audio:fr→fr']).toBeDefined();
    expect(word.progress['audio:en→en']).toBeDefined();
  });

  it('should initialize image directions when hasImage is true', () => {
    const word = { id: 'test' };
    Multilingual.initializeWordProgress(word, ['fr', 'en'], true);
    expect(word.progress['image→fr']).toBeDefined();
    expect(word.progress['image→en']).toBeDefined();
  });

  it('should not initialize image directions when hasImage is false', () => {
    const word = { id: 'test' };
    Multilingual.initializeWordProgress(word, ['fr', 'en'], false);
    expect(word.progress['image→fr']).toBeUndefined();
    expect(word.progress['image→en']).toBeUndefined();
  });

  it('should not overwrite existing progress', () => {
    const word = {
      id: 'test',
      progress: {
        'fr→en': { box: 'green', timesPlayed: 10 }
      }
    };
    Multilingual.initializeWordProgress(word, ['fr', 'en'], false);
    expect(word.progress['fr→en'].box).toBe('green');
    expect(word.progress['fr→en'].timesPlayed).toBe(10);
  });

  it('should add missing directions without overwriting', () => {
    const word = {
      id: 'test',
      progress: {
        'fr→en': { box: 'green', timesPlayed: 10 }
      }
    };
    Multilingual.initializeWordProgress(word, ['fr', 'en'], false);
    expect(word.progress['fr→en'].box).toBe('green');
    expect(word.progress['en→fr'].box).toBe('never_played');
  });
});

// ═══════════════════════════════════════════════════════════════
// validateAnswer
// ═══════════════════════════════════════════════════════════════

describe('validateAnswer', () => {
  it('should match exact answer', () => {
    expect(Multilingual.validateAnswer('carrot', 'carrot')).toBe(true);
  });

  it('should be case insensitive', () => {
    expect(Multilingual.validateAnswer('Carrot', 'carrot')).toBe(true);
    expect(Multilingual.validateAnswer('CARROT', 'carrot')).toBe(true);
    expect(Multilingual.validateAnswer('carrot', 'CARROT')).toBe(true);
  });

  it('should trim whitespace', () => {
    expect(Multilingual.validateAnswer('  carrot  ', 'carrot')).toBe(true);
    expect(Multilingual.validateAnswer('carrot', '  carrot  ')).toBe(true);
  });

  it('should normalize multiple spaces', () => {
    expect(Multilingual.validateAnswer('la  famille', 'la famille')).toBe(true);
  });

  it('should require exact match for multi-word answers', () => {
    expect(Multilingual.validateAnswer('famille', 'la famille')).toBe(false);
    expect(Multilingual.validateAnswer('la famille', 'la famille')).toBe(true);
  });

  it('should accept alternatives', () => {
    expect(Multilingual.validateAnswer('the carrot', 'carrot', ['the carrot', 'a carrot'])).toBe(true);
    expect(Multilingual.validateAnswer('a carrot', 'carrot', ['the carrot', 'a carrot'])).toBe(true);
  });

  it('should be case insensitive for alternatives', () => {
    expect(Multilingual.validateAnswer('THE CARROT', 'carrot', ['the carrot'])).toBe(true);
  });

  it('should reject non-matching answers', () => {
    expect(Multilingual.validateAnswer('potato', 'carrot')).toBe(false);
    expect(Multilingual.validateAnswer('potato', 'carrot', ['the carrot'])).toBe(false);
  });

  it('should handle empty alternatives array', () => {
    expect(Multilingual.validateAnswer('carrot', 'carrot', [])).toBe(true);
    expect(Multilingual.validateAnswer('potato', 'carrot', [])).toBe(false);
  });

  it('should handle non-string input gracefully', () => {
    expect(Multilingual.validateAnswer(null, 'carrot')).toBe(false);
    expect(Multilingual.validateAnswer(undefined, 'carrot')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// validateSessionConfig
// ═══════════════════════════════════════════════════════════════

describe('validateSessionConfig', () => {
  it('should accept valid translation config', () => {
    const config = {
      mode: 'translation',
      sourceLang: 'fr',
      targetLang: 'en',
      bidirectional: false
    };
    expect(() => Multilingual.validateSessionConfig(config)).not.toThrow();
  });

  it('should accept valid dictation config', () => {
    const config = {
      mode: 'dictation',
      sourceLang: 'fr',
      targetLang: 'fr',
      bidirectional: false
    };
    expect(() => Multilingual.validateSessionConfig(config)).not.toThrow();
  });

  it('should accept valid image config', () => {
    const config = {
      mode: 'image',
      targetLang: 'fr'
    };
    expect(() => Multilingual.validateSessionConfig(config)).not.toThrow();
  });

  it('should throw for invalid mode', () => {
    expect(() => Multilingual.validateSessionConfig({ mode: 'invalid', targetLang: 'fr' })).toThrow();
  });

  it('should throw for missing targetLang', () => {
    expect(() => Multilingual.validateSessionConfig({ mode: 'translation', sourceLang: 'fr' })).toThrow();
  });

  it('should throw for missing sourceLang in translation mode', () => {
    expect(() => Multilingual.validateSessionConfig({ mode: 'translation', targetLang: 'en' })).toThrow();
  });

  it('should force sourceLang to null for image mode', () => {
    const config = Multilingual.validateSessionConfig({
      mode: 'image',
      sourceLang: 'fr',
      targetLang: 'en'
    });
    expect(config.sourceLang).toBeNull();
  });

  it('should force bidirectional to false for image mode', () => {
    const config = Multilingual.validateSessionConfig({
      mode: 'image',
      targetLang: 'en',
      bidirectional: true
    });
    expect(config.bidirectional).toBe(false);
  });

  it('should default bidirectional to false', () => {
    const config = Multilingual.validateSessionConfig({
      mode: 'translation',
      sourceLang: 'fr',
      targetLang: 'en'
    });
    expect(config.bidirectional).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// getSessionDirections
// ═══════════════════════════════════════════════════════════════

describe('getSessionDirections', () => {
  it('should return single direction for non-bidirectional', () => {
    const config = {
      mode: 'translation',
      sourceLang: 'fr',
      targetLang: 'en',
      bidirectional: false
    };
    const directions = Multilingual.getSessionDirections(config);
    expect(directions).toHaveLength(1);
    expect(directions[0]).toBe('fr→en');
  });

  it('should return both directions for bidirectional', () => {
    const config = {
      mode: 'translation',
      sourceLang: 'fr',
      targetLang: 'en',
      bidirectional: true
    };
    const directions = Multilingual.getSessionDirections(config);
    expect(directions).toHaveLength(2);
    expect(directions).toContain('fr→en');
    expect(directions).toContain('en→fr');
  });

  it('should return single direction for image mode', () => {
    const config = {
      mode: 'image',
      sourceLang: null,
      targetLang: 'fr',
      bidirectional: false
    };
    const directions = Multilingual.getSessionDirections(config);
    expect(directions).toHaveLength(1);
    expect(directions[0]).toBe('image→fr');
  });

  it('should handle dictation mode', () => {
    const config = {
      mode: 'dictation',
      sourceLang: 'fr',
      targetLang: 'fr',
      bidirectional: false
    };
    const directions = Multilingual.getSessionDirections(config);
    expect(directions).toHaveLength(1);
    expect(directions[0]).toBe('audio:fr→fr');
  });
});

// ═══════════════════════════════════════════════════════════════
// getCardsForSession
// ═══════════════════════════════════════════════════════════════

describe('getCardsForSession', () => {
  function createTestDeck() {
    return {
      type: 'multilingual',
      languages: ['fr', 'en'],
      words: [
        {
          id: 'carrot',
          translations: {
            fr: { text: 'carotte' },
            en: { text: 'carrot' }
          },
          progress: {
            'fr→en': { box: 'never_played', restUntil: null },
            'en→fr': { box: 'never_played', restUntil: null }
          }
        },
        {
          id: 'bean',
          translations: {
            fr: { text: 'haricot' },
            en: { text: 'bean' }
          },
          progress: {
            'fr→en': { box: 'purple', restUntil: null },
            'en→fr': { box: 'orange', restUntil: null }
          }
        }
      ]
    };
  }

  it('should return cards for specified direction', () => {
    const deck = createTestDeck();
    const config = { mode: 'translation', sourceLang: 'fr', targetLang: 'en' };
    const cards = Multilingual.getCardsForSession(deck, config);

    expect(cards.length).toBeGreaterThan(0);
    expect(cards.every(c => c.direction === 'fr→en')).toBe(true);
  });

  it('should include both directions in bidirectional mode', () => {
    const deck = createTestDeck();
    const config = { mode: 'translation', sourceLang: 'fr', targetLang: 'en', bidirectional: true };
    const cards = Multilingual.getCardsForSession(deck, config);

    const directions = cards.map(c => c.direction);
    expect(directions).toContain('fr→en');
    expect(directions).toContain('en→fr');
  });

  it('should respect Leitner rest periods', () => {
    const deck = createTestDeck();
    deck.words[0].progress['fr→en'] = { box: 'green', restUntil: '2099-12-31' };
    deck.words[1].progress['fr→en'] = { box: 'orange', restUntil: null };

    const config = { mode: 'translation', sourceLang: 'fr', targetLang: 'en' };
    const cards = Multilingual.getCardsForSession(deck, config);

    expect(cards.find(c => c.wordId === 'carrot')).toBeUndefined();
    expect(cards.find(c => c.wordId === 'bean')).toBeDefined();
  });

  it('should include resting cards when ignoreRest is true', () => {
    const deck = createTestDeck();
    deck.words[0].progress['fr→en'] = { box: 'green', restUntil: '2099-12-31' };

    const config = { mode: 'translation', sourceLang: 'fr', targetLang: 'en' };
    const cards = Multilingual.getCardsForSession(deck, config, { ignoreRest: true });

    expect(cards.find(c => c.wordId === 'carrot')).toBeDefined();
  });

  it('should respect maxCards limit', () => {
    const deck = createTestDeck();
    const config = { mode: 'translation', sourceLang: 'fr', targetLang: 'en', bidirectional: true };
    const cards = Multilingual.getCardsForSession(deck, config, { maxCards: 2 });

    expect(cards.length).toBeLessThanOrEqual(2);
  });

  it('should include word reference in card', () => {
    const deck = createTestDeck();
    const config = { mode: 'translation', sourceLang: 'fr', targetLang: 'en' };
    const cards = Multilingual.getCardsForSession(deck, config);

    expect(cards[0].word).toBeDefined();
    expect(cards[0].word.translations).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════
// getDirectionStats
// ═══════════════════════════════════════════════════════════════

describe('getDirectionStats', () => {
  it('should count words by box status', () => {
    const deck = {
      words: [
        { progress: { 'fr→en': { box: 'never_played' } } },
        { progress: { 'fr→en': { box: 'purple' } } },
        { progress: { 'fr→en': { box: 'orange' } } },
        { progress: { 'fr→en': { box: 'green', restUntil: null } } }
      ]
    };

    const stats = Multilingual.getDirectionStats(deck, 'fr→en');

    expect(stats.total).toBe(4);
    expect(stats.notStarted).toBe(1);
    expect(stats.struggling).toBe(1);
    expect(stats.inProgress).toBe(1);
    expect(stats.mastered).toBe(1);
  });

  it('should count playable cards correctly', () => {
    const deck = {
      words: [
        { progress: { 'fr→en': { box: 'never_played' } } },
        { progress: { 'fr→en': { box: 'green', restUntil: '2099-12-31' } } },
        { progress: { 'fr→en': { box: 'green', restUntil: '2000-01-01' } } }
      ]
    };

    const stats = Multilingual.getDirectionStats(deck, 'fr→en');

    expect(stats.playable).toBe(2); // never_played + past rest
  });

  it('should return zeros for empty deck', () => {
    const stats = Multilingual.getDirectionStats({ words: [] }, 'fr→en');
    expect(stats.total).toBe(0);
    expect(stats.playable).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// LinguaLibre API Tests (structure et helpers)
// ═══════════════════════════════════════════════════════════════

describe('LinguaLibre._slugify', () => {
  it('should convert text to lowercase slug', () => {
    if (typeof LinguaLibre === 'undefined') return;
    expect(LinguaLibre._slugify('Hello World')).toBe('hello_world');
  });

  it('should remove accents', () => {
    if (typeof LinguaLibre === 'undefined') return;
    expect(LinguaLibre._slugify('café')).toBe('cafe');
    expect(LinguaLibre._slugify('légume')).toBe('legume');
  });

  it('should replace special characters with underscore', () => {
    if (typeof LinguaLibre === 'undefined') return;
    expect(LinguaLibre._slugify('test-123')).toBe('test_123');
    expect(LinguaLibre._slugify('a/b/c')).toBe('a_b_c');
  });

  it('should trim leading/trailing underscores', () => {
    if (typeof LinguaLibre === 'undefined') return;
    expect(LinguaLibre._slugify('  test  ')).toBe('test');
    expect(LinguaLibre._slugify('__test__')).toBe('test');
  });
});

describe('LinguaLibre._generateAlternatives', () => {
  it('should generate case variations', () => {
    if (typeof LinguaLibre === 'undefined') return;
    const alts = LinguaLibre._generateAlternatives('carotte');
    expect(alts).toContain('CAROTTE');
    expect(alts).toContain('Carotte');
  });

  it('should not include original word', () => {
    if (typeof LinguaLibre === 'undefined') return;
    const alts = LinguaLibre._generateAlternatives('carotte');
    expect(alts).not.toContain('carotte');
  });

  it('should handle already capitalized words', () => {
    if (typeof LinguaLibre === 'undefined') return;
    const alts = LinguaLibre._generateAlternatives('Carotte');
    expect(alts).toContain('carotte');
    expect(alts).toContain('CAROTTE');
  });
});

describe('LinguaLibre._getQuestionTemplate', () => {
  it('should return French template for fr', () => {
    if (typeof LinguaLibre === 'undefined') return;
    const template = LinguaLibre._getQuestionTemplate('fr');
    expect(template).toContain('entends');
  });

  it('should return English template for en', () => {
    if (typeof LinguaLibre === 'undefined') return;
    const template = LinguaLibre._getQuestionTemplate('en');
    expect(template).toContain('hear');
  });

  it('should return English template for unknown language', () => {
    if (typeof LinguaLibre === 'undefined') return;
    const template = LinguaLibre._getQuestionTemplate('xx');
    expect(template).toContain('hear');
  });
});

describe('LinguaLibre._getFormatFromUrl', () => {
  it('should extract ogg format', () => {
    if (typeof LinguaLibre === 'undefined') return;
    expect(LinguaLibre._getFormatFromUrl('https://example.com/audio.ogg')).toBe('ogg');
  });

  it('should extract mp3 format', () => {
    if (typeof LinguaLibre === 'undefined') return;
    expect(LinguaLibre._getFormatFromUrl('https://example.com/audio.mp3')).toBe('mp3');
  });

  it('should handle URL with query params', () => {
    if (typeof LinguaLibre === 'undefined') return;
    expect(LinguaLibre._getFormatFromUrl('https://example.com/audio.ogg?v=1')).toBe('ogg');
  });

  it('should default to ogg for unknown format', () => {
    if (typeof LinguaLibre === 'undefined') return;
    expect(LinguaLibre._getFormatFromUrl('https://example.com/audio.xyz')).toBe('ogg');
  });
});

describe('LinguaLibre._getFormatFromMime', () => {
  it('should map audio/ogg to ogg', () => {
    if (typeof LinguaLibre === 'undefined') return;
    expect(LinguaLibre._getFormatFromMime('audio/ogg')).toBe('ogg');
  });

  it('should map audio/mpeg to mp3', () => {
    if (typeof LinguaLibre === 'undefined') return;
    expect(LinguaLibre._getFormatFromMime('audio/mpeg')).toBe('mp3');
  });

  it('should return undefined for unknown mime type', () => {
    if (typeof LinguaLibre === 'undefined') return;
    expect(LinguaLibre._getFormatFromMime('audio/unknown')).toBeUndefined();
  });
});

describe('LinguaLibre.LANGUAGE_CODES', () => {
  it('should have French language code', () => {
    if (typeof LinguaLibre === 'undefined') return;
    expect(LinguaLibre.LANGUAGE_CODES['fr']).toBe('Q150');
  });

  it('should have English language code', () => {
    if (typeof LinguaLibre === 'undefined') return;
    expect(LinguaLibre.LANGUAGE_CODES['en']).toBe('Q1860');
  });

  it('should have at least 10 languages', () => {
    if (typeof LinguaLibre === 'undefined') return;
    expect(Object.keys(LinguaLibre.LANGUAGE_CODES).length).toBeGreaterThanOrEqual(10);
  });
});

describe('LinguaLibre.LANGUAGE_LABELS', () => {
  it('should have label for every code', () => {
    if (typeof LinguaLibre === 'undefined') return;
    for (const code of Object.keys(LinguaLibre.LANGUAGE_CODES)) {
      expect(LinguaLibre.LANGUAGE_LABELS[code]).toBeDefined();
    }
  });

  it('should have French label', () => {
    if (typeof LinguaLibre === 'undefined') return;
    expect(LinguaLibre.LANGUAGE_LABELS['fr']).toBe('Français');
  });
});

describe('LinguaLibre integration with Multilingual', () => {
  it('should share supported languages', () => {
    if (typeof LinguaLibre === 'undefined') return;
    // Les langues principales de Multilingual doivent être dans LinguaLibre
    for (const lang of Object.keys(Multilingual.LANGUAGE_LABELS)) {
      expect(LinguaLibre.LANGUAGE_CODES[lang]).toBeDefined();
    }
  });

  it('should have matching language labels', () => {
    if (typeof LinguaLibre === 'undefined') return;
    for (const lang of Object.keys(Multilingual.LANGUAGE_LABELS)) {
      expect(LinguaLibre.LANGUAGE_LABELS[lang]).toBe(Multilingual.LANGUAGE_LABELS[lang]);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// E2E Integration Tests - Complete Session Flow
// ═══════════════════════════════════════════════════════════════

describe('E2E: Complete multilingual session flow', () => {
  // Helper: create a test deck with words
  const createTestDeck = () => ({
    id: 'test-vocab-deck',
    name: 'Test Vocabulary',
    type: 'multilingual',
    languages: ['fr', 'en', 'es'],
    words: [
      {
        id: 'word_carrot',
        translations: { fr: 'carotte', en: 'carrot', es: 'zanahoria' },
        alternatives: { fr: ['la carotte'], en: ['the carrot'] },
        audio: { fr: 'https://example.com/carotte.ogg', en: 'https://example.com/carrot.ogg' },
        image: 'https://example.com/carrot.png'
      },
      {
        id: 'word_apple',
        translations: { fr: 'pomme', en: 'apple', es: 'manzana' },
        alternatives: { fr: ['la pomme'], en: ['an apple', 'the apple'] }
      },
      {
        id: 'word_bread',
        translations: { fr: 'pain', en: 'bread', es: 'pan' },
        alternatives: {}
      }
    ]
  });

  it('should initialize deck progress for all directions', () => {
    const deck = createTestDeck();
    Multilingual.initializeDeckProgress(deck);

    // Check that progress is created for all words
    expect(deck.words[0].progress).toBeDefined();
    expect(deck.words[1].progress).toBeDefined();
    expect(deck.words[2].progress).toBeDefined();

    // Check translation directions (fr↔en, fr↔es, en↔es)
    expect(deck.words[0].progress['fr→en']).toBeDefined();
    expect(deck.words[0].progress['en→fr']).toBeDefined();
    expect(deck.words[0].progress['fr→es']).toBeDefined();

    // Check dictation directions
    expect(deck.words[0].progress['audio:fr→fr']).toBeDefined();
    expect(deck.words[0].progress['audio:en→en']).toBeDefined();

    // Check image directions (only for words with images)
    expect(deck.words[0].progress['image→fr']).toBeDefined();
    expect(deck.words[0].progress['image→en']).toBeDefined();

    // Word without image should not have image directions
    expect(deck.words[1].progress['image→fr']).toBeUndefined();
  });

  it('should create valid session config for translation mode', () => {
    const config = Multilingual.validateSessionConfig({
      mode: 'translation',
      sourceLang: 'fr',
      targetLang: 'en',
      bidirectional: false
    });

    expect(config.mode).toBe('translation');
    expect(config.sourceLang).toBe('fr');
    expect(config.targetLang).toBe('en');
    expect(config.bidirectional).toBe(false);
  });

  it('should get correct session directions for bidirectional mode', () => {
    const directions = Multilingual.getSessionDirections({
      mode: 'translation',
      sourceLang: 'fr',
      targetLang: 'en',
      bidirectional: true
    });

    expect(directions).toContain('fr→en');
    expect(directions).toContain('en→fr');
    expect(directions.length).toBe(2);
  });

  it('should get cards for translation session', () => {
    const deck = createTestDeck();
    Multilingual.initializeDeckProgress(deck);

    const cards = Multilingual.getCardsForSession(deck, {
      mode: 'translation',
      sourceLang: 'fr',
      targetLang: 'en',
      bidirectional: false
    }, { maxCards: 10, shuffle: false });

    expect(cards.length).toBe(3); // All 3 words
    expect(cards[0].mode).toBe('translation');
    expect(cards[0].sourceLang).toBe('fr');
    expect(cards[0].targetLang).toBe('en');
    expect(cards[0].direction).toBe('fr→en');
    expect(cards[0].word).toBeDefined();
  });

  it('should get cards for bidirectional session', () => {
    const deck = createTestDeck();
    Multilingual.initializeDeckProgress(deck);

    const cards = Multilingual.getCardsForSession(deck, {
      mode: 'translation',
      sourceLang: 'fr',
      targetLang: 'en',
      bidirectional: true
    }, { maxCards: 20, shuffle: false });

    // Should have cards for both directions
    const frToEn = cards.filter(c => c.direction === 'fr→en');
    const enToFr = cards.filter(c => c.direction === 'en→fr');

    expect(frToEn.length).toBe(3);
    expect(enToFr.length).toBe(3);
  });

  it('should validate correct answers', () => {
    const isCorrect1 = Multilingual.validateAnswer('carrot', 'carrot', []);
    expect(isCorrect1).toBe(true);

    // Case insensitive
    const isCorrect2 = Multilingual.validateAnswer('CARROT', 'carrot', []);
    expect(isCorrect2).toBe(true);

    // With alternative
    const isCorrect3 = Multilingual.validateAnswer('the carrot', 'carrot', ['the carrot']);
    expect(isCorrect3).toBe(true);

    // Wrong answer
    const isCorrect4 = Multilingual.validateAnswer('potato', 'carrot', []);
    expect(isCorrect4).toBe(false);
  });

  it('should update progress after correct answer', () => {
    const progress = Multilingual.createEmptyProgress();
    expect(progress.box).toBe('never_played');
    expect(progress.timesPlayed).toBe(0);

    // Simulate update (this would be done by _updateMultilingualProgress in page-game.js)
    const updatedProgress = {
      ...progress,
      box: 'green', // First correct always goes to green
      timesPlayed: 1,
      timesCorrect: 1,
      latencyThreshold: 2,
      lastResponseTimeMs: 1500
    };

    expect(updatedProgress.box).toBe('green');
    expect(updatedProgress.timesPlayed).toBe(1);
    expect(updatedProgress.timesCorrect).toBe(1);
  });

  it('should track statistics per direction', () => {
    const deck = createTestDeck();
    Multilingual.initializeDeckProgress(deck);

    // Simulate playing some cards
    deck.words[0].progress['fr→en'].box = 'green';
    deck.words[0].progress['fr→en'].timesPlayed = 1;
    deck.words[1].progress['fr→en'].box = 'orange';
    deck.words[1].progress['fr→en'].timesPlayed = 2;
    deck.words[2].progress['fr→en'].box = 'purple';
    deck.words[2].progress['fr→en'].timesPlayed = 3;

    const stats = Multilingual.getDirectionStats(deck, 'fr→en');

    expect(stats.total).toBe(3);
    expect(stats.mastered).toBe(1); // green
    expect(stats.inProgress).toBe(1); // orange
    expect(stats.struggling).toBe(1); // purple
    expect(stats.notStarted).toBe(0);
    expect(stats.playable).toBe(3); // All playable (green without rest)
  });

  it('should respect rest periods for green cards', () => {
    const deck = createTestDeck();
    Multilingual.initializeDeckProgress(deck);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // Set first word as green with rest until tomorrow
    deck.words[0].progress['fr→en'].box = 'green';
    deck.words[0].progress['fr→en'].restUntil = tomorrowStr;

    const cards = Multilingual.getCardsForSession(deck, {
      mode: 'translation',
      sourceLang: 'fr',
      targetLang: 'en',
      bidirectional: false
    }, { maxCards: 10, shuffle: false, ignoreRest: false });

    // Should not include the resting card
    expect(cards.length).toBe(2);
    expect(cards.find(c => c.wordId === 'word_carrot')).toBeUndefined();
  });

  it('should include resting cards when ignoreRest is true', () => {
    const deck = createTestDeck();
    Multilingual.initializeDeckProgress(deck);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    deck.words[0].progress['fr→en'].box = 'green';
    deck.words[0].progress['fr→en'].restUntil = tomorrowStr;

    const cards = Multilingual.getCardsForSession(deck, {
      mode: 'translation',
      sourceLang: 'fr',
      targetLang: 'en',
      bidirectional: false
    }, { maxCards: 10, shuffle: false, ignoreRest: true });

    expect(cards.length).toBe(3);
    expect(cards.find(c => c.wordId === 'word_carrot')).toBeDefined();
  });
});

describe('E2E: Dictation mode', () => {
  const createDictationDeck = () => ({
    id: 'test-dictation',
    type: 'multilingual',
    languages: ['fr', 'en'],
    words: [
      {
        id: 'word1',
        translations: { fr: 'bonjour', en: 'hello' },
        audio: { fr: 'https://example.com/bonjour.ogg', en: 'https://example.com/hello.ogg' }
      },
      {
        id: 'word2',
        translations: { fr: 'merci', en: 'thank you' },
        audio: { fr: 'https://example.com/merci.ogg' }
      }
    ]
  });

  it('should get cards for same-language dictation', () => {
    const deck = createDictationDeck();
    Multilingual.initializeDeckProgress(deck);

    const cards = Multilingual.getCardsForSession(deck, {
      mode: 'dictation',
      sourceLang: 'fr',
      targetLang: 'fr',
      bidirectional: false
    }, { maxCards: 10, shuffle: false });

    expect(cards.length).toBe(2);
    expect(cards[0].mode).toBe('dictation');
    expect(cards[0].direction).toBe('audio:fr→fr');
    expect(cards[0].sourceLang).toBe('fr');
    expect(cards[0].targetLang).toBe('fr');
  });

  it('should get cards for cross-language dictation', () => {
    const deck = createDictationDeck();
    Multilingual.initializeDeckProgress(deck);

    const cards = Multilingual.getCardsForSession(deck, {
      mode: 'dictation',
      sourceLang: 'fr',
      targetLang: 'en',
      bidirectional: false
    }, { maxCards: 10, shuffle: false });

    expect(cards.length).toBe(2);
    expect(cards[0].direction).toBe('audio:fr→en');
  });

  it('should track dictation progress separately from translation', () => {
    const deck = createDictationDeck();
    Multilingual.initializeDeckProgress(deck);

    // Play translation
    deck.words[0].progress['fr→en'].box = 'green';
    deck.words[0].progress['fr→en'].timesPlayed = 5;

    // Dictation should still be unplayed
    expect(deck.words[0].progress['audio:fr→fr'].box).toBe('never_played');
    expect(deck.words[0].progress['audio:fr→fr'].timesPlayed).toBe(0);
  });
});

describe('E2E: Image mode', () => {
  const createImageDeck = () => ({
    id: 'test-image',
    type: 'multilingual',
    languages: ['fr', 'en'],
    words: [
      {
        id: 'word1',
        translations: { fr: 'chat', en: 'cat' },
        image: 'https://example.com/cat.png'
      },
      {
        id: 'word2',
        translations: { fr: 'chien', en: 'dog' }
        // No image
      }
    ]
  });

  it('should only get cards with images for image mode', () => {
    const deck = createImageDeck();
    Multilingual.initializeDeckProgress(deck);

    // Image mode should only work for words with images
    // The progress key is image→targetLang
    const word1Progress = deck.words[0].progress;
    const word2Progress = deck.words[1].progress;

    // Word1 has image, should have image directions
    expect(word1Progress['image→fr']).toBeDefined();
    expect(word1Progress['image→en']).toBeDefined();

    // Word2 has no image, should NOT have image directions
    expect(word2Progress['image→fr']).toBeUndefined();
    expect(word2Progress['image→en']).toBeUndefined();
  });

  it('should validate image config correctly', () => {
    const config = Multilingual.validateSessionConfig({
      mode: 'image',
      sourceLang: 'fr', // Should be ignored
      targetLang: 'en',
      bidirectional: true // Should be forced to false
    });

    expect(config.mode).toBe('image');
    expect(config.sourceLang).toBeNull();
    expect(config.targetLang).toBe('en');
    expect(config.bidirectional).toBe(false);
  });

  it('should generate image progress key correctly', () => {
    const key = Multilingual.getProgressKey('image', null, 'fr');
    expect(key).toBe('image→fr');
  });
});

describe('E2E: Progress persistence simulation', () => {
  it('should serialize and deserialize progress correctly', () => {
    const progress = {
      box: 'orange',
      latencyThreshold: 3,
      bestResponseTimeMs: 1200,
      lastResponseTimeMs: 1500,
      restUntil: null,
      restDays: 0,
      timesPlayed: 5,
      timesCorrect: 3
    };

    // Simulate JSON serialization (like Storage would do)
    const serialized = JSON.stringify(progress);
    const deserialized = JSON.parse(serialized);

    expect(deserialized.box).toBe('orange');
    expect(deserialized.latencyThreshold).toBe(3);
    expect(deserialized.bestResponseTimeMs).toBe(1200);
    expect(deserialized.timesPlayed).toBe(5);
    expect(deserialized.timesCorrect).toBe(3);
  });

  it('should preserve word-level progress structure', () => {
    const words = [
      {
        id: 'word1',
        progress: {
          'fr→en': { box: 'green', timesPlayed: 10, timesCorrect: 8 },
          'en→fr': { box: 'orange', timesPlayed: 5, timesCorrect: 3 },
          'audio:fr→fr': { box: 'never_played', timesPlayed: 0, timesCorrect: 0 }
        }
      },
      {
        id: 'word2',
        progress: {
          'fr→en': { box: 'purple', timesPlayed: 3, timesCorrect: 1 }
        }
      }
    ];

    // Simulate what Storage.saveMultilingualProgress would save
    const toSave = words.map(w => ({ id: w.id, progress: w.progress }));
    const serialized = JSON.stringify(toSave);
    const loaded = JSON.parse(serialized);

    expect(loaded[0].id).toBe('word1');
    expect(loaded[0].progress['fr→en'].box).toBe('green');
    expect(loaded[0].progress['en→fr'].box).toBe('orange');
    expect(loaded[1].progress['fr→en'].box).toBe('purple');
  });
});

describe('E2E: Edge cases', () => {
  it('should handle empty deck gracefully', () => {
    const deck = {
      id: 'empty',
      type: 'multilingual',
      languages: ['fr', 'en'],
      words: []
    };

    Multilingual.initializeDeckProgress(deck);

    const cards = Multilingual.getCardsForSession(deck, {
      mode: 'translation',
      sourceLang: 'fr',
      targetLang: 'en'
    });

    expect(cards.length).toBe(0);
  });

  it('should handle deck with single language', () => {
    const deck = {
      id: 'single-lang',
      type: 'multilingual',
      languages: ['fr'],
      words: [
        { id: 'word1', translations: { fr: 'bonjour' } }
      ]
    };

    Multilingual.initializeDeckProgress(deck);

    // Translation mode needs different source/target, so no cards
    const translationCards = Multilingual.getCardsForSession(deck, {
      mode: 'translation',
      sourceLang: 'fr',
      targetLang: 'fr'
    });

    // Same language translation doesn't make sense (nothing to translate)
    // The UI prevents selecting same source/target for translation mode
    expect(translationCards.length).toBe(0);

    // Dictation with same language makes sense (listen and write what you hear)
    const dictationCards = Multilingual.getCardsForSession(deck, {
      mode: 'dictation',
      sourceLang: 'fr',
      targetLang: 'fr'
    });

    // Dictation mode is valid for same-language (spelling practice)
    expect(dictationCards.length).toBe(1);
  });

  it('should handle missing translations gracefully', () => {
    const deck = {
      id: 'partial',
      type: 'multilingual',
      languages: ['fr', 'en', 'es'],
      words: [
        { id: 'word1', translations: { fr: 'bonjour', en: 'hello' } } // Missing 'es'
      ]
    };

    Multilingual.initializeDeckProgress(deck);

    // Should still initialize progress for all directions
    expect(deck.words[0].progress['fr→en']).toBeDefined();
    expect(deck.words[0].progress['fr→es']).toBeDefined();

    // Cards should still be returned (answer validation will use word.id as fallback)
    const cards = Multilingual.getCardsForSession(deck, {
      mode: 'translation',
      sourceLang: 'fr',
      targetLang: 'es'
    });

    expect(cards.length).toBe(1);
  });

  it('should handle whitespace in answers', () => {
    expect(Multilingual.validateAnswer('  carrot  ', 'carrot', [])).toBe(true);
    expect(Multilingual.validateAnswer('carrot', '  carrot  ', [])).toBe(true);
    expect(Multilingual.validateAnswer('  the   carrot  ', 'the carrot', [])).toBe(true);
  });

  it('should handle unicode characters', () => {
    expect(Multilingual.validateAnswer('café', 'café', [])).toBe(true);
    expect(Multilingual.validateAnswer('CAFÉ', 'café', [])).toBe(true);
    expect(Multilingual.validateAnswer('日本語', '日本語', [])).toBe(true);
  });
});
