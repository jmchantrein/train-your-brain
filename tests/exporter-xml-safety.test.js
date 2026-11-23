/**
 * Export Moodle XML : contenu hostile (audit de publication C8)
 *
 * Une séquence "]]>" dans un contenu de carte fermait la section CDATA et laissait le reste
 * s'interpréter comme du XML. Le contenu doit toujours rester du texte une fois le XML relu.
 */

describe('Exporter.toMoodleXML - contenu hostile', () => {
  const INJECT = ']]><injected attr="1"/><![CDATA[';
  const TAGGED = 'avant' + INJECT + 'après';

  function parse(xml) {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const error = doc.querySelector('parsererror');
    return { doc, error };
  }

  const deck = () => ({
    id: 'd1',
    name: 'Deck ' + INJECT,
    description: '',
    cards: [
      { id: 'c1', type: 'mcq', question: TAGGED, answer: 'a', choices: [{ id: 'a', text: TAGGED }, { id: 'b', text: 'b' }], feedbackCorrect: TAGGED, feedbackIncorrect: TAGGED },
      { id: 'c2', type: 'truefalse', question: TAGGED, answer: 'true' },
      { id: 'c3', type: 'numeric', question: TAGGED, answer: '3' + INJECT, tolerance: '1' + INJECT, points: INJECT, penalty: INJECT },
      { id: 'c4', type: 'text', question: TAGGED, answer: 'x', alternatives: [TAGGED] },
      { id: 'c5', type: 'matching', question: TAGGED, pairs: [{ id: 'p', premise: TAGGED, response: TAGGED }] },
      { id: 'c6', type: 'cloze', question: TAGGED + ' {{blank_0}}', blanks: [{ type: 'text', correctAnswer: TAGGED }] }
    ]
  });

  it('should produce well-formed XML', () => {
    const { error } = parse(Exporter.toMoodleXML(deck()));
    expect(error).toBeNull();
  });

  it('should not let a card content create elements', () => {
    const { doc } = parse(Exporter.toMoodleXML(deck()));
    expect(doc.getElementsByTagName('injected').length).toBe(0);
  });

  it('should keep the original content as text (round trip through the XML parser)', () => {
    const { doc } = parse(Exporter.toMoodleXML(deck()));
    const texts = Array.from(doc.getElementsByTagName('text')).map(t => t.textContent);
    expect(texts.includes(TAGGED)).toBe(true);
    // 6 questiontext + 1 choix + 2 feedbacks + premise : tous relus à l'identique
    expect(texts.filter(t => t === TAGGED).length).toBeGreaterThan(8);
  });

  it('should split every CDATA end marker', () => {
    const xml = Exporter.toMoodleXML(deck());
    expect(xml).toContain(']]]]><![CDATA[>');
    expect(xml).not.toContain('avant]]><injected');
  });

  it('should keep a plain content unchanged inside a single CDATA', () => {
    const xml = Exporter.toMoodleXML({ id: 'd', name: 'D', cards: [{ id: 'c', type: 'text', question: 'Q <b>gras</b>', answer: 'A' }] });
    expect(xml).toContain('<text><![CDATA[Q <b>gras</b>]]></text>');
  });

  it('should not write markup from numeric fields (points, penalty, tolerance)', () => {
    const xml = Exporter.toMoodleXML(deck());
    expect(xml).not.toContain('<defaultgrade>]]>');
    expect(xml).not.toContain('<tolerance>1]]>');
  });
});
