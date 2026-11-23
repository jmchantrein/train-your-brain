/**
 * Export -> import : aucun champ de contenu d'une carte ni aucun réglage de deck ne se perd.
 *
 * Champs de Card et de DeckSettings de src/modules/types.js, plus les champs que les types de carte
 * et l'export JSON utilisent déjà (choices, blanks, tolerance, acceptedAnswers, points, penalty,
 * feedbackCorrect, feedbackIncorrect, tags, xpOverride, imageUrl, audioUrl). La progression (boîte,
 * repos, seuil...) ne fait pas partie de l'export d'un deck.
 */

if (typeof YAML === 'undefined') global.YAML = require('../src/modules/yaml.js');
if (typeof Exporter === 'undefined') global.Exporter = require('../src/modules/exporter.js');

describe('Export -> import : champs de carte', () => {
  const CARD_FIELDS = {
    alternatives: ['paris', 'Paname', '007', 'yes'],
    hint: 'Ville "Lumière" : # 1',
    feedback: 'La Seine la traverse\nsur deux lignes',
    feedbackCorrect: 'Bravo',
    feedbackIncorrect: 'Raté : réessaie',
    options: [{ id: 'a', text: 'Oui', correct: true }, { id: 'b', text: 'Non' }],
    choices: [{ id: 'a', text: 'Lyon', correct: false }, { id: 'b', text: 'Paris', correct: true }],
    pairs: [{ left: 'France', right: 'Paris' }, { premise: 'Spain', response: 'Madrid' }],
    blanks: [{ id: 'b1', correctAnswer: 'x', acceptedAnswers: ['x', 'X'] }],
    media: 'data:image/png;base64,iVBORw0KGgo=',
    mediaSuggestion: 'Carte de France',
    tolerance: 0.5,
    acceptedAnswers: ['Paris'],
    points: 3,
    penalty: 0.25,
    tags: ['geo', 'europe'],
    xpOverride: 5,
    imageUrl: 'data:image/png;base64,AAAA',
    audioUrl: 'data:audio/ogg;base64,AAAA'
  };

  function deckWith(extra) {
    return { id: 'd1', name: 'Deck', description: 'D', category: ['t'], difficulty: 2, settings: {},
      cards: [{ id: 'c1', question: 'Q ?', answer: 'A', type: 'text', ...extra }] };
  }
  const viaYAML = (deck) => YAML.parseDeck(Exporter.toYAML(deck));
  const viaJSON = (deck) => { const d = JSON.parse(Exporter.toJSON(deck)); return d; };

  Object.entries(CARD_FIELDS).forEach(([field, value]) => {
    it(`should keep ${field} through YAML export and import`, () => {
      expect(viaYAML(deckWith({ [field]: value })).cards[0][field]).toEqual(value);
    });
    it(`should keep ${field} through JSON export`, () => {
      expect(viaJSON(deckWith({ [field]: value })).cards[0][field]).toEqual(value);
    });
  });

  it('should keep an object media (image or audio) through YAML and JSON', () => {
    const media = { type: 'audio', format: 'ogg', data: 'T2dnUw==', license: 'CC BY 4.0', artist: 'Ana' };
    expect(viaYAML(deckWith({ media })).cards[0].media).toEqual(media);
    expect(viaJSON(deckWith({ media })).cards[0].media).toEqual(media);
  });

  it('should keep every field together on one card, in both formats', () => {
    const deck = deckWith(CARD_FIELDS);
    for (const imported of [viaYAML(deck), viaJSON(deck)]) {
      for (const [field, value] of Object.entries(CARD_FIELDS)) {
        expect(imported.cards[0][field]).toEqual(value);
      }
    }
  });

  it('should keep a falsy points, penalty and tolerance of 0', () => {
    const imported = viaYAML(deckWith({ points: 0, penalty: 0, tolerance: 0 })).cards[0];
    expect(imported.points).toBe(0);
    expect(imported.penalty).toBe(0);
    expect(imported.tolerance).toBe(0);
  });

  it('should keep a single accepted answer', () => {
    expect(viaYAML(deckWith({ acceptedAnswers: ['Paris'] })).cards[0].acceptedAnswers).toEqual(['Paris']);
  });

  it('should still export no progression field of a card', () => {
    const progress = { box: 'green', latencyThreshold: 3, bestResponseTimeMs: 900, lastResponseTimeMs: 1200,
      restUntil: '2030-01-01', restDays: 4, timesPlayed: 9, timesCorrect: 8, responseTimeHistory: [{ time: 1, date: 'x', correct: true }] };
    const yaml = Exporter.toYAML(deckWith(progress));
    const json = Exporter.toJSON(deckWith(progress));
    for (const key of Object.keys(progress)) {
      expect(yaml).not.toContain(`${key}:`);
      expect(json).not.toContain(`"${key}"`);
    }
    const imported = viaYAML(deckWith(progress)).cards[0];
    expect(imported.box).toBe('never_played');
    expect(imported.timesPlayed).toBe(0);
  });

  it('should not write a field the card does not have', () => {
    const yaml = Exporter.toYAML(deckWith({}));
    for (const field of Object.keys(CARD_FIELDS)) expect(yaml).not.toContain(`${field}:`);
  });
});

describe('Export -> import : réglages de deck', () => {
  const SETTINGS = {
    sequential: true,
    bidirectional: true,
    maxCards: 25,
    similarityMatching: true,
    similarityThreshold: 0.65
  };
  const deck = (settings) => ({ id: 'd', name: 'D', description: 'x', category: ['t'], difficulty: 1, settings,
    cards: [{ id: 'c', question: 'Q', answer: 'A' }] });

  Object.entries(SETTINGS).forEach(([key, value]) => {
    it(`should keep settings.${key} through YAML and JSON`, () => {
      expect(YAML.parseDeck(Exporter.toYAML(deck({ [key]: value }))).settings[key]).toBe(value);
      expect(JSON.parse(Exporter.toJSON(deck({ [key]: value }))).settings[key]).toBe(value);
    });
  });

  it('should keep all settings together', () => {
    const sorted = (o) => JSON.stringify(Object.keys(o).sort().map(k => [k, o[k]]));
    expect(sorted(YAML.parseDeck(Exporter.toYAML(deck(SETTINGS))).settings)).toBe(sorted(SETTINGS));
    expect(sorted(JSON.parse(Exporter.toJSON(deck(SETTINGS))).settings)).toBe(sorted(SETTINGS));
  });

  it('should keep the deck tags', () => {
    const d = { ...deck({}), tags: ['maths', 'cm1'] };
    expect(YAML.parseDeck(Exporter.toYAML(d)).tags).toEqual(['maths', 'cm1']);
    expect(JSON.parse(Exporter.toJSON(d)).tags).toEqual(['maths', 'cm1']);
  });
});
