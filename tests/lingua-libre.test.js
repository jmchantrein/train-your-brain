/**
 * Tests pour le module LinguaLibre
 *
 * Test des fonctions utilitaires et de la génération de decks
 * Note: Les fonctions async avec fetch ne sont pas testées ici
 */

describe('LinguaLibre', () => {
  // ═══════════════════════════════════════════════════════════════
  // CONSTANTES
  // ═══════════════════════════════════════════════════════════════

  describe('Constants', () => {
    it('should have LANGUAGE_CODES for supported languages', () => {
      expect(LinguaLibre.LANGUAGE_CODES).toBeDefined();
      expect(LinguaLibre.LANGUAGE_CODES.fr).toBe('Q150');
      expect(LinguaLibre.LANGUAGE_CODES.en).toBe('Q1860');
      expect(LinguaLibre.LANGUAGE_CODES.es).toBe('Q1321');
    });

    it('should have LANGUAGE_LABELS for UI display', () => {
      expect(LinguaLibre.LANGUAGE_LABELS).toBeDefined();
      expect(LinguaLibre.LANGUAGE_LABELS.fr).toBe('Français');
      expect(LinguaLibre.LANGUAGE_LABELS.en).toBe('English');
      expect(LinguaLibre.LANGUAGE_LABELS.de).toBe('Deutsch');
    });

    it('should have consistent language codes between CODES and LABELS', () => {
      const codeKeys = Object.keys(LinguaLibre.LANGUAGE_CODES);
      const labelKeys = Object.keys(LinguaLibre.LANGUAGE_LABELS);

      // All code keys should have labels
      for (const key of codeKeys) {
        expect(labelKeys).toContain(key);
      }
    });

    it('should have SPARQL_ENDPOINT defined', () => {
      expect(LinguaLibre.SPARQL_ENDPOINT).toBeDefined();
      expect(LinguaLibre.SPARQL_ENDPOINT).toContain('wikidata.org');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _getFormatFromMime - Détection format depuis MIME
  // ═══════════════════════════════════════════════════════════════

  describe('_getFormatFromMime', () => {
    it('should detect ogg format', () => {
      expect(LinguaLibre._getFormatFromMime('audio/ogg')).toBe('ogg');
    });

    it('should detect mp3 format', () => {
      expect(LinguaLibre._getFormatFromMime('audio/mpeg')).toBe('mp3');
      expect(LinguaLibre._getFormatFromMime('audio/mp3')).toBe('mp3');
    });

    it('should detect wav format', () => {
      expect(LinguaLibre._getFormatFromMime('audio/wav')).toBe('wav');
    });

    it('should detect webm format', () => {
      expect(LinguaLibre._getFormatFromMime('audio/webm')).toBe('webm');
    });

    it('should return undefined for unknown mime types', () => {
      expect(LinguaLibre._getFormatFromMime('audio/unknown')).toBeUndefined();
      expect(LinguaLibre._getFormatFromMime('video/mp4')).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _getFormatFromUrl - Détection format depuis URL
  // ═══════════════════════════════════════════════════════════════

  describe('_getFormatFromUrl', () => {
    it('should detect ogg from URL', () => {
      expect(LinguaLibre._getFormatFromUrl('https://example.com/audio.ogg')).toBe('ogg');
    });

    it('should detect mp3 from URL', () => {
      expect(LinguaLibre._getFormatFromUrl('https://example.com/sound.mp3')).toBe('mp3');
    });

    it('should detect wav from URL', () => {
      expect(LinguaLibre._getFormatFromUrl('https://example.com/file.wav')).toBe('wav');
    });

    it('should detect webm from URL', () => {
      expect(LinguaLibre._getFormatFromUrl('https://example.com/audio.webm')).toBe('webm');
    });

    it('should handle URLs with query parameters', () => {
      expect(LinguaLibre._getFormatFromUrl('https://example.com/file.mp3?v=123')).toBe('mp3');
    });

    it('should default to ogg for unknown extensions', () => {
      expect(LinguaLibre._getFormatFromUrl('https://example.com/file.xyz')).toBe('ogg');
      expect(LinguaLibre._getFormatFromUrl('https://example.com/file')).toBe('ogg');
    });

    it('should handle case insensitivity', () => {
      expect(LinguaLibre._getFormatFromUrl('https://example.com/FILE.MP3')).toBe('mp3');
      expect(LinguaLibre._getFormatFromUrl('https://example.com/Sound.OGG')).toBe('ogg');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _generateAlternatives - Génération d'alternatives
  // ═══════════════════════════════════════════════════════════════

  describe('_generateAlternatives', () => {
    it('should generate lowercase alternative', () => {
      const alts = LinguaLibre._generateAlternatives('Hello');
      expect(alts).toContain('hello');
    });

    it('should generate uppercase alternative', () => {
      const alts = LinguaLibre._generateAlternatives('hello');
      expect(alts).toContain('HELLO');
    });

    it('should generate title case alternative', () => {
      const alts = LinguaLibre._generateAlternatives('hello');
      expect(alts).toContain('Hello');
    });

    it('should not include the original word', () => {
      const alts = LinguaLibre._generateAlternatives('hello');
      expect(alts).not.toContain('hello');
    });

    it('should return an array', () => {
      const alts = LinguaLibre._generateAlternatives('Test');
      expect(Array.isArray(alts)).toBe(true);
    });

    it('should handle already uppercase words', () => {
      const alts = LinguaLibre._generateAlternatives('HELLO');
      expect(alts).toContain('hello');
      expect(alts).toContain('Hello');
      expect(alts).not.toContain('HELLO');
    });

    it('should handle single character', () => {
      const alts = LinguaLibre._generateAlternatives('a');
      expect(alts).toContain('A');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _slugify - Conversion en slug
  // ═══════════════════════════════════════════════════════════════

  describe('_slugify', () => {
    it('should convert to lowercase', () => {
      expect(LinguaLibre._slugify('HELLO')).toBe('hello');
    });

    it('should replace spaces with underscores', () => {
      expect(LinguaLibre._slugify('hello world')).toBe('hello_world');
    });

    it('should remove accents', () => {
      expect(LinguaLibre._slugify('café')).toBe('cafe');
      expect(LinguaLibre._slugify('résumé')).toBe('resume');
      expect(LinguaLibre._slugify('naïve')).toBe('naive');
    });

    it('should remove special characters', () => {
      expect(LinguaLibre._slugify('hello!')).toBe('hello');
      expect(LinguaLibre._slugify('test@123')).toBe('test_123');
    });

    it('should handle multiple consecutive special chars', () => {
      expect(LinguaLibre._slugify('hello   world!!!')).toBe('hello_world');
    });

    it('should trim leading/trailing underscores', () => {
      expect(LinguaLibre._slugify('  hello  ')).toBe('hello');
      expect(LinguaLibre._slugify('---hello---')).toBe('hello');
    });

    it('should handle French words with diacritics', () => {
      expect(LinguaLibre._slugify('éléphant')).toBe('elephant');
      expect(LinguaLibre._slugify('français')).toBe('francais');
      expect(LinguaLibre._slugify('garçon')).toBe('garcon');
    });

    it('should handle German umlauts', () => {
      expect(LinguaLibre._slugify('München')).toBe('munchen');
      expect(LinguaLibre._slugify('Größe')).toBe('grosse');
    });

    it('should keep non-Latin words distinct', () => {
      expect(LinguaLibre._slugify('кот')).toBe('кот');
      expect(LinguaLibre._slugify('ねこ')).not.toBe(LinguaLibre._slugify('いぬ'));
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _getQuestionTemplate - Templates de questions
  // ═══════════════════════════════════════════════════════════════

  describe('_getQuestionTemplate', () => {
    it('should return French template for fr', () => {
      const template = LinguaLibre._getQuestionTemplate('fr');
      expect(template).toContain('Écris');
    });

    it('should return English template for en', () => {
      const template = LinguaLibre._getQuestionTemplate('en');
      expect(template).toContain('Write');
    });

    it('should return Spanish template for es', () => {
      const template = LinguaLibre._getQuestionTemplate('es');
      expect(template).toContain('Escribe');
    });

    it('should return German template for de', () => {
      const template = LinguaLibre._getQuestionTemplate('de');
      expect(template).toContain('Schreibe');
    });

    it('should return Italian template for it', () => {
      const template = LinguaLibre._getQuestionTemplate('it');
      expect(template).toContain('Scrivi');
    });

    it('should return Portuguese template for pt', () => {
      const template = LinguaLibre._getQuestionTemplate('pt');
      expect(template).toContain('Escreva');
    });

    it('should default to English for unknown language', () => {
      const template = LinguaLibre._getQuestionTemplate('xyz');
      expect(template).toContain('Write');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _sleep - Utilitaire de pause
  // ═══════════════════════════════════════════════════════════════

  describe('_sleep', () => {
    it('should return a promise', () => {
      const result = LinguaLibre._sleep(0);
      expect(result instanceof Promise).toBe(true);
    });

    it('should resolve after specified time', async () => {
      // Pas de mesure d'horloge (flaky sur CI) : on vérifie que le délai demandé est
      // transmis tel quel à setTimeout et que la promesse ne se résout que quand le
      // minuteur se déclenche.
      const realSetTimeout = globalThis.setTimeout;
      const scheduled = [];
      globalThis.setTimeout = (fn, ms) => { scheduled.push({ fn, ms }); return 0; };
      let promise;
      try {
        promise = LinguaLibre._sleep(50);
      } finally {
        globalThis.setTimeout = realSetTimeout;
      }

      let resolved = false;
      promise.then(() => { resolved = true; });
      await Promise.resolve();

      expect(scheduled.length).toBe(1);
      expect(scheduled[0].ms).toBe(50);
      expect(resolved).toBe(false);

      scheduled[0].fn();
      await promise;
      expect(resolved).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // deckToYaml - Conversion deck vers YAML
  // ═══════════════════════════════════════════════════════════════

  describe('deckToYaml', () => {
    it('should include deck metadata', () => {
      const deck = {
        id: 'test-deck',
        name: 'Test Deck',
        description: 'A test deck',
        category: ['test', 'dictee'],
        difficulty: 2,
        settings: {
          bidirectional: false,
          sequential: true
        },
        cards: []
      };

      const yaml = LinguaLibre.deckToYaml(deck);

      // deckToYaml() délègue à YAML.stringify() quand il est chargé (formatage non
      // garanti) : on vérifie le contenu par re-parsing, pas le texte brut.
      const parsed = jsyaml.load(yaml);
      expect(parsed.id).toBe('test-deck');
      expect(parsed.name).toBe('Test Deck');
      expect(parsed.description).toBe('A test deck');
      expect(parsed.difficulty).toBe(2);
    });

    it('should include categories as list', () => {
      const deck = {
        id: 'test',
        name: 'Test',
        description: 'Desc',
        category: ['cat1', 'cat2'],
        difficulty: 1,
        settings: { bidirectional: false, sequential: false },
        cards: []
      };

      const yaml = LinguaLibre.deckToYaml(deck);

      expect(jsyaml.load(yaml).category).toEqual(['cat1', 'cat2']);
    });

    it('should include cards', () => {
      const deck = {
        id: 'test',
        name: 'Test',
        description: 'Desc',
        category: ['test'],
        difficulty: 1,
        settings: { bidirectional: false, sequential: false },
        cards: [{
          id: 'card1',
          question: 'What?',
          answer: 'Answer',
          hint: '5 letters'
        }]
      };

      const yaml = LinguaLibre.deckToYaml(deck);

      const card = jsyaml.load(yaml).cards[0];
      expect(card.id).toBe('card1');
      expect(card.question).toBe('What?');
      expect(card.answer).toBe('Answer');
      expect(card.hint).toBe('5 letters');
    });

    it('should include alternatives when present', () => {
      const deck = {
        id: 'test',
        name: 'Test',
        description: 'Desc',
        category: ['test'],
        difficulty: 1,
        settings: { bidirectional: false, sequential: false },
        cards: [{
          id: 'card1',
          question: 'What?',
          answer: 'hello',
          alternatives: ['Hello', 'HELLO']
        }]
      };

      const yaml = LinguaLibre.deckToYaml(deck);

      expect(jsyaml.load(yaml).cards[0].alternatives).toEqual(['Hello', 'HELLO']);
    });

    it('should include media when present', () => {
      const deck = {
        id: 'test',
        name: 'Test',
        description: 'Desc',
        category: ['test'],
        difficulty: 1,
        settings: { bidirectional: false, sequential: false },
        cards: [{
          id: 'card1',
          question: 'Listen',
          answer: 'word',
          media: {
            type: 'audio',
            format: 'mp3',
            data: 'base64encodeddata'
          }
        }]
      };

      const yaml = LinguaLibre.deckToYaml(deck);

      const media = jsyaml.load(yaml).cards[0].media;
      expect(media.type).toBe('audio');
      expect(media.format).toBe('mp3');
      expect(media.data.trim()).toBe('base64encodeddata');
    });

    it('should include settings', () => {
      const deck = {
        id: 'test',
        name: 'Test',
        description: 'Desc',
        category: ['test'],
        difficulty: 1,
        settings: {
          bidirectional: true,
          sequential: true
        },
        cards: []
      };

      const yaml = LinguaLibre.deckToYaml(deck);

      expect(yaml).toContain('settings:');
      expect(yaml).toContain('bidirectional: true');
      expect(yaml).toContain('sequential: true');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // findAudio - Validation des paramètres
  // ═══════════════════════════════════════════════════════════════

  describe('findAudio', () => {
    it('should throw for unsupported language', async () => {
      let error = null;
      try {
        await LinguaLibre.findAudio('test', 'xyz');
      } catch (e) {
        error = e;
      }
      expect(error).not.toBeNull();
      expect(error.message).toContain('non supportée');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Language coverage
  // ═══════════════════════════════════════════════════════════════

  describe('Language coverage', () => {
    it('should support major European languages', () => {
      const expectedLangs = ['fr', 'en', 'es', 'de', 'it', 'pt', 'nl'];
      for (const lang of expectedLangs) {
        expect(LinguaLibre.LANGUAGE_CODES[lang]).toBeDefined();
        expect(LinguaLibre.LANGUAGE_LABELS[lang]).toBeDefined();
      }
    });

    it('should support Asian languages', () => {
      const asianLangs = ['zh', 'ja', 'ko'];
      for (const lang of asianLangs) {
        expect(LinguaLibre.LANGUAGE_CODES[lang]).toBeDefined();
      }
    });

    it('should support regional languages', () => {
      const regionalLangs = ['ca', 'oc', 'br', 'eu'];
      for (const lang of regionalLangs) {
        expect(LinguaLibre.LANGUAGE_CODES[lang]).toBeDefined();
      }
    });
  });
});
