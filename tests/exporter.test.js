/**
 * Tests pour le module Exporter (Export de decks)
 */

// ═══════════════════════════════════════════════════════════════
// TESTS STRUCTURE DU MODULE
// ═══════════════════════════════════════════════════════════════

describe('Exporter - Structure du module', () => {
  it('should have Exporter object defined', () => {
    expect(typeof Exporter).toBe('object');
  });

  it('should have toJSON method', () => {
    expect(typeof Exporter.toJSON).toBe('function');
  });

  it('should have toMoodleXML method', () => {
    expect(typeof Exporter.toMoodleXML).toBe('function');
  });

  it('should have toYAML method', () => {
    expect(typeof Exporter.toYAML).toBe('function');
  });

  it('should have download method', () => {
    expect(typeof Exporter.download).toBe('function');
  });

  it('should have downloadJSON method', () => {
    expect(typeof Exporter.downloadJSON).toBe('function');
  });

  it('should have downloadMoodleXML method', () => {
    expect(typeof Exporter.downloadMoodleXML).toBe('function');
  });

  it('should have downloadYAML method', () => {
    expect(typeof Exporter.downloadYAML).toBe('function');
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS toJSON()
// ═══════════════════════════════════════════════════════════════

describe('Exporter - toJSON()', () => {
  const testDeck = {
    id: 'test-deck',
    name: 'Test Deck',
    description: 'A test deck for export',
    category: ['test', 'export'],
    difficulty: 2,
    language: 'fr',
    settings: {
      bidirectional: false,
      sequential: true
    },
    cards: [
      {
        id: 'card1',
        question: 'What is 2+2?',
        answer: '4',
        type: 'numeric',
        box: 'green',
        timesPlayed: 5,
        timesCorrect: 4
      },
      {
        id: 'card2',
        question: 'Capital of France?',
        answer: 'Paris',
        type: 'text',
        acceptedAnswers: ['Paris', 'paris']
      }
    ]
  };

  it('should return valid JSON string', () => {
    const json = Exporter.toJSON(testDeck);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('should include deck id', () => {
    const json = Exporter.toJSON(testDeck);
    const parsed = JSON.parse(json);
    expect(parsed.id).toBe('test-deck');
  });

  it('should include deck name', () => {
    const json = Exporter.toJSON(testDeck);
    const parsed = JSON.parse(json);
    expect(parsed.name).toBe('Test Deck');
  });

  it('should include deck description', () => {
    const json = Exporter.toJSON(testDeck);
    const parsed = JSON.parse(json);
    expect(parsed.description).toBe('A test deck for export');
  });

  it('should include category array', () => {
    const json = Exporter.toJSON(testDeck);
    const parsed = JSON.parse(json);
    expect(parsed.category).toEqual(['test', 'export']);
  });

  it('should include settings', () => {
    const json = Exporter.toJSON(testDeck);
    const parsed = JSON.parse(json);
    expect(parsed.settings.sequential).toBe(true);
  });

  it('should include exportedAt timestamp', () => {
    const json = Exporter.toJSON(testDeck);
    const parsed = JSON.parse(json);
    expect(parsed.exportedAt).toBeDefined();
  });

  it('should include all cards', () => {
    const json = Exporter.toJSON(testDeck);
    const parsed = JSON.parse(json);
    expect(parsed.cards.length).toBe(2);
  });

  it('should include card question and answer', () => {
    const json = Exporter.toJSON(testDeck);
    const parsed = JSON.parse(json);
    expect(parsed.cards[0].question).toBe('What is 2+2?');
    expect(parsed.cards[0].answer).toBe('4');
  });

  it('should include card type', () => {
    const json = Exporter.toJSON(testDeck);
    const parsed = JSON.parse(json);
    expect(parsed.cards[0].type).toBe('numeric');
  });

  it('should NOT include progress by default', () => {
    const json = Exporter.toJSON(testDeck, false);
    const parsed = JSON.parse(json);
    expect(parsed.cards[0].box).toBeUndefined();
    expect(parsed.cards[0].timesPlayed).toBeUndefined();
  });

  it('should include progress when includeProgress is true', () => {
    const json = Exporter.toJSON(testDeck, true);
    const parsed = JSON.parse(json);
    expect(parsed.cards[0].box).toBe('green');
    expect(parsed.cards[0].timesPlayed).toBe(5);
    expect(parsed.cards[0].timesCorrect).toBe(4);
  });

  it('should include acceptedAnswers when present', () => {
    const json = Exporter.toJSON(testDeck);
    const parsed = JSON.parse(json);
    expect(parsed.cards[1].acceptedAnswers).toEqual(['Paris', 'paris']);
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS toJSON() avec types speciaux
// ═══════════════════════════════════════════════════════════════

describe('Exporter - toJSON() with special card types', () => {
  it('should export MCQ choices', () => {
    const deck = {
      id: 'mcq-deck',
      name: 'MCQ Deck',
      cards: [{
        id: 'mcq1',
        question: 'Which is a fruit?',
        answer: 'a',
        type: 'mcq',
        choices: [
          { id: 'a', text: 'Apple' },
          { id: 'b', text: 'Carrot' }
        ]
      }]
    };

    const json = Exporter.toJSON(deck);
    const parsed = JSON.parse(json);
    expect(parsed.cards[0].choices).toHaveLength(2);
    expect(parsed.cards[0].choices[0].text).toBe('Apple');
  });

  it('should export matching pairs', () => {
    const deck = {
      id: 'match-deck',
      name: 'Matching Deck',
      cards: [{
        id: 'match1',
        question: 'Match countries to capitals',
        answer: '',
        type: 'matching',
        pairs: [
          { premise: 'France', response: 'Paris' },
          { premise: 'Spain', response: 'Madrid' }
        ]
      }]
    };

    const json = Exporter.toJSON(deck);
    const parsed = JSON.parse(json);
    expect(parsed.cards[0].pairs).toHaveLength(2);
  });

  it('should export tolerance for numeric cards', () => {
    const deck = {
      id: 'num-deck',
      name: 'Numeric Deck',
      cards: [{
        id: 'num1',
        question: 'What is pi?',
        answer: '3.14',
        type: 'numeric',
        tolerance: 0.01
      }]
    };

    const json = Exporter.toJSON(deck);
    const parsed = JSON.parse(json);
    expect(parsed.cards[0].tolerance).toBe(0.01);
  });

  it('should export feedback when present', () => {
    const deck = {
      id: 'fb-deck',
      name: 'Feedback Deck',
      cards: [{
        id: 'fb1',
        question: 'Test?',
        answer: 'Yes',
        type: 'text',
        feedbackCorrect: 'Great job!',
        feedbackIncorrect: 'Try again!'
      }]
    };

    const json = Exporter.toJSON(deck);
    const parsed = JSON.parse(json);
    expect(parsed.cards[0].feedbackCorrect).toBe('Great job!');
    expect(parsed.cards[0].feedbackIncorrect).toBe('Try again!');
  });

  it('should export tags when present', () => {
    const deck = {
      id: 'tag-deck',
      name: 'Tagged Deck',
      cards: [{
        id: 'tag1',
        question: 'Test?',
        answer: 'Yes',
        type: 'text',
        tags: ['math', 'easy']
      }]
    };

    const json = Exporter.toJSON(deck);
    const parsed = JSON.parse(json);
    expect(parsed.cards[0].tags).toEqual(['math', 'easy']);
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS toYAML()
// ═══════════════════════════════════════════════════════════════

describe('Exporter - toYAML()', () => {
  const testDeck = {
    id: 'yaml-test',
    name: 'YAML Test Deck',
    description: 'Testing YAML export',
    category: ['test'],
    difficulty: 1,
    language: 'fr',
    settings: {
      bidirectional: false,
      sequential: false
    },
    cards: [
      {
        id: 'card1',
        question: 'Simple question?',
        answer: 'Simple answer',
        type: 'text'
      }
    ]
  };

  it('should return a string', () => {
    const yaml = Exporter.toYAML(testDeck);
    expect(typeof yaml).toBe('string');
  });

  it('should include deck name in header comment', () => {
    const yaml = Exporter.toYAML(testDeck);
    expect(yaml).toContain('# Deck: YAML Test Deck');
  });

  it('should include Train Your Brain header', () => {
    const yaml = Exporter.toYAML(testDeck);
    expect(yaml).toContain('# Train Your Brain\n');
    expect(yaml).not.toContain('Offline');
  });

  it('should include id field', () => {
    const yaml = Exporter.toYAML(testDeck);
    expect(yaml).toContain('id: yaml-test');
  });

  it('should include name field', () => {
    const yaml = Exporter.toYAML(testDeck);
    expect(yaml).toContain('name: YAML Test Deck');
  });

  it('should include category list', () => {
    const yaml = Exporter.toYAML(testDeck);
    expect(yaml).toContain('category:');
    expect(yaml).toContain('  - test');
  });

  it('should include settings', () => {
    const yaml = Exporter.toYAML(testDeck);
    expect(yaml).toContain('settings:');
    expect(yaml).toContain('bidirectional: false');
    expect(yaml).toContain('sequential: false');
  });

  it('should include cards section', () => {
    const yaml = Exporter.toYAML(testDeck);
    expect(yaml).toContain('cards:');
  });

  it('should include card question', () => {
    const yaml = Exporter.toYAML(testDeck);
    expect(yaml).toContain('question: "Simple question?"');
  });

  it('should include card answer', () => {
    const yaml = Exporter.toYAML(testDeck);
    expect(yaml).toContain('answer: "Simple answer"');
  });

  it('should escape special characters in strings', () => {
    const deckWithQuotes = {
      ...testDeck,
      cards: [{
        id: 'q1',
        question: 'What is "quotation"?',
        answer: 'A "quote"',
        type: 'text'
      }]
    };

    const yaml = Exporter.toYAML(deckWithQuotes);
    expect(yaml).toContain('\\"');
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS toMoodleXML()
// ═══════════════════════════════════════════════════════════════

describe('Exporter - toMoodleXML()', () => {
  const testDeck = {
    id: 'moodle-test',
    name: 'Moodle Test',
    cards: [
      {
        id: 'sa1',
        question: 'What is the capital of France?',
        answer: 'Paris',
        type: 'text'
      }
    ]
  };

  it('should return valid XML string', () => {
    const xml = Exporter.toMoodleXML(testDeck);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
  });

  it('should include quiz root element', () => {
    const xml = Exporter.toMoodleXML(testDeck);
    expect(xml).toContain('<quiz>');
    expect(xml).toContain('</quiz>');
  });

  it('should include category question', () => {
    const xml = Exporter.toMoodleXML(testDeck);
    expect(xml).toContain('type="category"');
    expect(xml).toContain('Moodle Test');
  });

  it('should export text card as shortanswer', () => {
    const xml = Exporter.toMoodleXML(testDeck);
    expect(xml).toContain('type="shortanswer"');
  });

  it('should include question text', () => {
    const xml = Exporter.toMoodleXML(testDeck);
    expect(xml).toContain('What is the capital of France?');
  });

  it('should include answer', () => {
    const xml = Exporter.toMoodleXML(testDeck);
    expect(xml).toContain('Paris');
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS toMoodleXML() avec differents types
// ═══════════════════════════════════════════════════════════════

describe('Exporter - toMoodleXML() card types', () => {
  it('should export MCQ correctly', () => {
    const deck = {
      id: 'mcq-moodle',
      name: 'MCQ Moodle',
      cards: [{
        id: 'mcq1',
        question: 'Select fruit',
        answer: 'a',
        type: 'mcq',
        choices: [
          { id: 'a', text: 'Apple' },
          { id: 'b', text: 'Carrot' }
        ]
      }]
    };

    const xml = Exporter.toMoodleXML(deck);
    expect(xml).toContain('type="multichoice"');
    expect(xml).toContain('Apple');
    expect(xml).toContain('Carrot');
  });

  it('should export true/false correctly', () => {
    const deck = {
      id: 'tf-moodle',
      name: 'TF Moodle',
      cards: [{
        id: 'tf1',
        question: 'The sky is blue',
        answer: 'true',
        type: 'truefalse'
      }]
    };

    const xml = Exporter.toMoodleXML(deck);
    expect(xml).toContain('type="truefalse"');
  });

  it('should export numeric correctly', () => {
    const deck = {
      id: 'num-moodle',
      name: 'Numeric Moodle',
      cards: [{
        id: 'num1',
        question: 'What is 2+2?',
        answer: '4',
        type: 'numeric',
        tolerance: 0
      }]
    };

    const xml = Exporter.toMoodleXML(deck);
    expect(xml).toContain('type="numerical"');
    expect(xml).toContain('<tolerance>');
  });

  it('should export matching correctly', () => {
    const deck = {
      id: 'match-moodle',
      name: 'Matching Moodle',
      cards: [{
        id: 'match1',
        question: 'Match items',
        answer: '',
        type: 'matching',
        pairs: [
          { premise: 'A', response: '1' },
          { premise: 'B', response: '2' }
        ]
      }]
    };

    const xml = Exporter.toMoodleXML(deck);
    expect(xml).toContain('type="matching"');
    expect(xml).toContain('subquestion');
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS XML ESCAPING
// ═══════════════════════════════════════════════════════════════

describe('Exporter - XML escaping', () => {
  it('should escape ampersand', () => {
    const escaped = Exporter._escapeXML('Tom & Jerry');
    expect(escaped).toBe('Tom &amp; Jerry');
  });

  it('should escape less than', () => {
    const escaped = Exporter._escapeXML('a < b');
    expect(escaped).toBe('a &lt; b');
  });

  it('should escape greater than', () => {
    const escaped = Exporter._escapeXML('a > b');
    expect(escaped).toBe('a &gt; b');
  });

  it('should escape double quotes', () => {
    const escaped = Exporter._escapeXML('Say "hello"');
    expect(escaped).toBe('Say &quot;hello&quot;');
  });

  it('should escape single quotes', () => {
    const escaped = Exporter._escapeXML("It's");
    expect(escaped).toBe('It&#39;s');
  });

  it('should handle null/undefined', () => {
    expect(Exporter._escapeXML(null)).toBe('');
    expect(Exporter._escapeXML(undefined)).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS YAML ESCAPING
// ═══════════════════════════════════════════════════════════════

describe('Exporter - YAML escaping', () => {
  it('should escape backslash', () => {
    const escaped = Exporter._escapeYAMLString('path\\to\\file');
    expect(escaped).toBe('path\\\\to\\\\file');
  });

  it('should escape double quotes', () => {
    const escaped = Exporter._escapeYAMLString('Say "hello"');
    expect(escaped).toBe('Say \\"hello\\"');
  });

  it('should escape newlines', () => {
    const escaped = Exporter._escapeYAMLString('Line1\nLine2');
    expect(escaped).toBe('Line1\\nLine2');
  });

  it('should handle null/undefined', () => {
    expect(Exporter._escapeYAMLString(null)).toBe('');
    expect(Exporter._escapeYAMLString(undefined)).toBe('');
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS EDGE CASES
// ═══════════════════════════════════════════════════════════════

describe('Exporter - Edge cases', () => {
  it('should handle deck with no cards', () => {
    const deck = {
      id: 'empty',
      name: 'Empty Deck',
      cards: []
    };

    const json = Exporter.toJSON(deck);
    const parsed = JSON.parse(json);
    expect(parsed.cards).toHaveLength(0);
  });

  it('should handle deck with minimal data', () => {
    const deck = {
      id: 'minimal',
      name: 'Minimal',
      cards: [{ id: 'c1', question: 'Q', answer: 'A' }]
    };

    expect(() => Exporter.toJSON(deck)).not.toThrow();
    expect(() => Exporter.toYAML(deck)).not.toThrow();
    expect(() => Exporter.toMoodleXML(deck)).not.toThrow();
  });

  it('should handle special unicode characters', () => {
    const deck = {
      id: 'unicode',
      name: 'Unicode Test',
      cards: [{
        id: 'u1',
        question: 'Comment dit-on cafe en japonais?',
        answer: 'kohi',
        type: 'text'
      }]
    };

    const json = Exporter.toJSON(deck);
    expect(json).toContain('cafe');
  });

  it('should handle very long text', () => {
    const longText = 'A'.repeat(10000);
    const deck = {
      id: 'long',
      name: 'Long Text',
      cards: [{
        id: 'l1',
        question: longText,
        answer: 'Short',
        type: 'text'
      }]
    };

    const json = Exporter.toJSON(deck);
    const parsed = JSON.parse(json);
    expect(parsed.cards[0].question.length).toBe(10000);
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS LICENCE ET SOURCE DU DECK (metadata) : CC BY-SA exige attribution et mention de licence
// ═══════════════════════════════════════════════════════════════

describe('Exporter - Licence et source du deck (metadata), aller-retour', () => {
  const metadata = {
    license: 'CC-BY-SA-4.0',
    originalUrl: 'https://example.org/deck?a=1&b=2',
    source: {
      type: 'human',
      author: 'Ana "A." Martin : # 1',
      importedFrom: 'https://example.org/deck',
      generator: 'capitals',
      version: '1.0.0',
      generatedAt: '2026-11-22',
      model: 'claude',
      parameters: { region: 'Europe', count: 3 }
    }
  };
  const makeDeck = (extra) => ({
    id: 'meta-deck', name: 'Deck métadonnées', description: 'x', category: ['test'], difficulty: 1, settings: {},
    cards: [{ id: 'c1', question: 'Q', answer: 'A' }], ...extra
  });

  it('should keep metadata.license and the whole metadata.source through YAML export then import', () => {
    const imported = YAML.parseDeck(Exporter.toYAML(makeDeck({ metadata })));
    expect(imported.metadata.license).toBe('CC-BY-SA-4.0');
    expect(imported.metadata.source).toEqual(metadata.source);
    expect(imported.metadata.originalUrl).toBe(metadata.originalUrl);
  });

  it('should keep metadata.license and the whole metadata.source through JSON export then import', () => {
    const imported = JSON.parse(Exporter.toJSON(makeDeck({ metadata })));
    expect(imported.metadata.license).toBe('CC-BY-SA-4.0');
    expect(imported.metadata.source).toEqual(metadata.source);
    expect(imported.metadata.originalUrl).toBe(metadata.originalUrl);
  });

  it('should keep only a license when there is no source', () => {
    const deck = makeDeck({ metadata: { license: 'CC0-1.0' } });
    expect(YAML.parseDeck(Exporter.toYAML(deck)).metadata).toEqual({ license: 'CC0-1.0' });
    expect(JSON.parse(Exporter.toJSON(deck)).metadata).toEqual({ license: 'CC0-1.0' });
  });

  it('should write no metadata block for a deck without metadata', () => {
    const deck = makeDeck({});
    expect(Exporter.toYAML(deck)).not.toContain('metadata');
    expect(JSON.parse(Exporter.toJSON(deck)).metadata).toBeUndefined();
    expect(YAML.parseDeck(Exporter.toYAML(deck)).metadata).toBeUndefined();
    expect(Exporter.toYAML(makeDeck({ metadata: {} }))).not.toContain('metadata');
  });

  it('should keep metadata in the exported YAML text for a shipped-style deck', () => {
    const yaml = Exporter.toYAML(makeDeck({ metadata: { license: 'CC-BY-SA-4.0', source: { type: 'ai', model: 'claude' } } }));
    expect(yaml).toContain('license');
    expect(yaml).toContain('CC-BY-SA-4.0');
    expect(yaml).toContain('claude');
  });
});

describe('Exporter - Licence et source d\'un deck multilingue', () => {
  const deck = {
    id: 'ml', name: 'ML', type: 'multilingual', description: 'd', languages: ['fr', 'en'], difficulty: 1, settings: {},
    metadata: { license: 'CC-BY-SA-4.0', source: { type: 'human', author: 'Ana' } },
    words: [{ id: 'w1', translations: { fr: { text: 'chat' }, en: { text: 'cat' } } }]
  };

  it('should keep metadata in the multilingual JSON and YAML exports', () => {
    expect(JSON.parse(Exporter.toJSON(deck)).metadata).toEqual(deck.metadata);
    expect(YAML.parse(Exporter.toYAML(deck)).metadata).toEqual(deck.metadata);
  });
});
