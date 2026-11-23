/**
 * Tests pour le module YAML (wrapper js-yaml)
 */

describe('YAML', () => {

  // ═══════════════════════════════════════════════════════════════
  // parse()
  // ═══════════════════════════════════════════════════════════════

  describe('parse()', () => {

    it('devrait parser un objet simple', () => {
      const yaml = 'name: Test\nvalue: 42';
      const result = YAML.parse(yaml);

      expect(result.name).toBe('Test');
      expect(result.value).toBe(42);
    });

    it('devrait parser un tableau', () => {
      const yaml = '- item1\n- item2\n- item3';
      const result = YAML.parse(yaml);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(result[0]).toBe('item1');
    });

    it('devrait parser des objets imbriqués', () => {
      const yaml = `
person:
  name: Jean
  age: 30
  address:
    city: Paris
`;
      const result = YAML.parse(yaml);

      expect(result.person.name).toBe('Jean');
      expect(result.person.age).toBe(30);
      expect(result.person.address.city).toBe('Paris');
    });

    it('devrait parser les booléens correctement', () => {
      const yaml = 'enabled: true\ndisabled: false';
      const result = YAML.parse(yaml);

      expect(result.enabled).toBe(true);
      expect(result.disabled).toBe(false);
    });

    it('devrait parser les valeurs null', () => {
      const yaml = 'value: null\nempty: ~';
      const result = YAML.parse(yaml);

      expect(result.value).toBeNull();
      expect(result.empty).toBeNull();
    });

    it('devrait lancer une erreur pour YAML invalide', () => {
      expect(() => YAML.parse('invalid: yaml: content: here')).toThrow();
    });

    it('devrait lancer une erreur pour une entrée vide', () => {
      expect(() => YAML.parse('')).toThrow();
      expect(() => YAML.parse(null)).toThrow();
    });

    it('devrait parser les block scalars (|)', () => {
      const yaml = `
description: |
  Ligne 1
  Ligne 2
  Ligne 3
`;
      const result = YAML.parse(yaml);
      expect(result.description).toContain('Ligne 1');
      expect(result.description).toContain('Ligne 2');
    });

  });

  // ═══════════════════════════════════════════════════════════════
  // stringify()
  // ═══════════════════════════════════════════════════════════════

  describe('stringify()', () => {

    it('devrait sérialiser un objet simple', () => {
      const obj = { name: 'Test', value: 42 };
      const yaml = YAML.stringify(obj);

      expect(yaml).toContain('name: Test');
      expect(yaml).toContain('value: 42');
    });

    it('devrait sérialiser un tableau', () => {
      const arr = ['a', 'b', 'c'];
      const yaml = YAML.stringify(arr);

      expect(yaml).toContain('- a');
      expect(yaml).toContain('- b');
      expect(yaml).toContain('- c');
    });

    it('devrait sérialiser les booléens', () => {
      const obj = { yes: true, no: false };
      const yaml = YAML.stringify(obj);

      expect(yaml).toContain('true');
      expect(yaml).toContain('false');
    });

  });

  // ═══════════════════════════════════════════════════════════════
  // parseDeck()
  // ═══════════════════════════════════════════════════════════════

  describe('parseDeck()', () => {

    it('devrait parser un deck valide', () => {
      const yaml = `
id: test-deck
name: Test Deck
cards:
  - id: card1
    question: "Question 1"
    answer: "Réponse 1"
  - id: card2
    question: "Question 2"
    answer: "42"
    type: numeric
`;
      const deck = YAML.parseDeck(yaml);

      expect(deck.id).toBe('test-deck');
      expect(deck.name).toBe('Test Deck');
      expect(deck.cards.length).toBe(2);
      expect(deck.cards[0].question).toBe('Question 1');
      expect(deck.cards[1].type).toBe('numeric');
    });

    it('devrait convertir answer: false en string "false"', () => {
      const yaml = `
id: tf-deck
name: Vrai/Faux
cards:
  - id: tf1
    question: "La terre est plate"
    answer: false
    type: truefalse
  - id: tf2
    question: "L'eau bout à 100°C"
    answer: true
    type: truefalse
`;
      const deck = YAML.parseDeck(yaml);

      expect(deck.cards[0].answer).toBe('false');
      expect(deck.cards[1].answer).toBe('true');
    });

    it('devrait convertir answer: 0 en string "0"', () => {
      const yaml = `
id: numeric-deck
name: Calculs
cards:
  - id: n1
    question: "5 - 5 = ?"
    answer: 0
    type: numeric
`;
      const deck = YAML.parseDeck(yaml);

      expect(deck.cards[0].answer).toBe('0');
    });

    it('devrait initialiser les champs de progression', () => {
      const yaml = `
id: test
name: Test
cards:
  - id: c1
    question: "Q"
    answer: "A"
`;
      const deck = YAML.parseDeck(yaml);
      const card = deck.cards[0];

      expect(card.box).toBe('never_played');
      expect(card.timesPlayed).toBe(0);
      expect(card.timesCorrect).toBe(0);
      expect(card.latencyThreshold).toBeNull();
    });

    it('devrait lancer une erreur pour YAML invalide', () => {
      // parseDeck() propage l'erreur de parse() (il ne retourne pas null)
      expect(() => YAML.parseDeck('invalid: yaml: here')).toThrow();
    });

  });

  // ═══════════════════════════════════════════════════════════════
  // stringifyDeck()
  // ═══════════════════════════════════════════════════════════════

  describe('stringifyDeck()', () => {

    it('devrait sérialiser un deck en YAML lisible', () => {
      const deck = {
        id: 'test-deck',
        name: 'Test Deck',
        description: 'Description du deck',
        category: ['test'],
        difficulty: 1,
        cards: [
          { id: 'c1', question: 'Q1', answer: 'A1' },
          { id: 'c2', question: 'Q2', answer: 'A2' }
        ]
      };

      const yaml = YAML.stringifyDeck(deck);

      expect(yaml).toContain('id: test-deck');
      expect(yaml).toContain('name: Test Deck');
      expect(yaml).toContain('cards:');
      expect(yaml).toContain('question: Q1');
    });

  });

  // ═══════════════════════════════════════════════════════════════
  // Disponibilité de js-yaml (YAML.isAvailable() n'existe plus)
  // ═══════════════════════════════════════════════════════════════

  describe('js-yaml availability', () => {

    it('devrait avoir js-yaml chargé (global jsyaml) et utilisable par YAML.parse', () => {
      expect(typeof jsyaml).toBe('object');
      expect(YAML.parse('a: 1').a).toBe(1);
    });

  });

});

describe('YAML.parseDeck - metadata (licence et source)', () => {
  it('should keep metadata.license and metadata.source of an imported deck', () => {
    const yaml = 'name: X\ncards:\n  - id: c\n    question: Q\n    answer: A\nmetadata:\n  license: CC-BY-SA-4.0\n  source:\n    type: ai\n    model: claude\n';
    expect(YAML.parseDeck(yaml).metadata).toEqual({ license: 'CC-BY-SA-4.0', source: { type: 'ai', model: 'claude' } });
  });

  it('should leave metadata undefined when absent or not an object', () => {
    expect(YAML.parseDeck('name: X\ncards: []\n').metadata).toBeUndefined();
    expect(YAML.parseDeck('name: X\ncards: []\nmetadata: oops\n').metadata).toBeUndefined();
  });
});
