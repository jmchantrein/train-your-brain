/**
 * Tests d'aller-retour YAML (revue 2026-11)
 *
 * Un deck exporté en YAML puis ré-importé doit retrouver exactement ses textes.
 * - Exporter.toYAML : nom/description/id/catégories non échappés (erreur de parsing,
 *   injection de clés YAML via un retour à la ligne)
 * - YAML.stringifyDeck : textes ambigus (nombres, booléens, indicateurs YAML)
 *   relus avec un autre type ou une autre valeur
 */

if (typeof YAML === 'undefined') {
  global.YAML = require('../src/modules/yaml.js');
}
if (typeof Exporter === 'undefined') {
  global.Exporter = require('../src/modules/exporter.js');
}

// Textes qui changent de sens ou cassent le parsing s'ils sont écrits sans guillemets
const TRICKY_TEXTS = [
  'True', 'FALSE', 'Null', '~', 'yes',
  '0.50', '1.0', '007', '1e3', '12', '-5', '.5', '0x1F',
  '- item', '[a]', '{a}', '*x', '&x', '!x', '|', '>x', "'q'", '%x', '@x', '`x',
  'a: b', 'a #b', ' x', 'x ', 'a\tb'
];

describe('YAML.stringifyDeck - aller-retour des textes', () => {
  TRICKY_TEXTS.forEach(text => {
    it(`should round-trip ${JSON.stringify(text)} in question and answer`, () => {
      const yaml = YAML.stringifyDeck({ id: 'd', name: 'N', cards: [{ question: text, answer: text }] });
      const deck = YAML.parseDeck(yaml);
      expect(deck.cards[0].question).toBe(text);
      expect(deck.cards[0].answer).toBe(text);
    });
  });
});

describe('YAML.stringifyDeck - réponse numérique zéro', () => {
  it('should not turn a numeric 0 answer into an empty string', () => {
    const yaml = YAML.stringifyDeck({ id: 'd', name: 'N', cards: [{ question: 'Q', answer: 0 }] });
    expect(YAML.parseDeck(yaml).cards[0].answer).toBe('0');
  });
});

describe('Exporter.toYAML - en-tête et cartes ré-importables', () => {
  function roundTrip(deck) {
    return YAML.parseDeck(Exporter.toYAML(deck));
  }

  it('should round-trip a name containing " : " (typographie française)', () => {
    const deck = roundTrip({ id: 'd1', name: 'Géographie : capitales', description: 'D', cards: [{ id: 'c1', question: 'Q', answer: 'A' }] });
    expect(deck.name).toBe('Géographie : capitales');
  });

  it('should round-trip name and description with # and quotes', () => {
    const deck = roundTrip({ id: 'd1', name: 'Top #1 "best"', description: 'a: b # c', cards: [{ id: 'c1', question: 'Q', answer: 'A' }] });
    expect(deck.name).toBe('Top #1 "best"');
    expect(deck.description).toBe('a: b # c');
  });

  it('should not allow a newline in the name to inject YAML keys', () => {
    const deck = roundTrip({ id: 'd1', name: 'Nom\ndifficulty: 5', cards: [{ id: 'c1', question: 'Q', answer: 'A' }] });
    expect(deck.name).toBe('Nom\ndifficulty: 5');
    expect(deck.difficulty).toBe(1);
  });

  it('should round-trip categories and ids with special characters', () => {
    const deck = roundTrip({ id: 'd1', name: 'N', category: ['a: b', '#tag'], cards: [{ id: 'c: 1', question: 'Q', answer: 'A' }] });
    expect(deck.category).toEqual(['a: b', '#tag']);
    expect(deck.cards[0].id).toBe('c: 1');
  });

  it('should keep a plain name readable round-trip', () => {
    const deck = roundTrip({ id: 'd1', name: 'Capitales', description: '', cards: [{ id: 'c1', question: 'Q', answer: 'A' }] });
    expect(deck.name).toBe('Capitales');
  });
});
