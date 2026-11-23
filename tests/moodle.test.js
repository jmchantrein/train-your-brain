/**
 * Tests pour le module Moodle
 *
 * Test de l'import de fichiers XML Moodle
 */

describe('Moodle', () => {
  // ═══════════════════════════════════════════════════════════════
  // _getText - Extraction de texte
  // ═══════════════════════════════════════════════════════════════

  describe('_getText', () => {
    it('should extract text from a simple element', () => {
      const xml = '<root><name><text>Hello World</text></name></root>';
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      const result = Moodle._getText(doc, 'name > text');
      expect(result).toBe('Hello World');
    });

    it('should return null for missing element', () => {
      const xml = '<root><name><text>Hello</text></name></root>';
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      const result = Moodle._getText(doc, 'missing > text');
      expect(result).toBeNull();
    });

    it('should trim whitespace', () => {
      const xml = '<root><name><text>  Trimmed  </text></name></root>';
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      const result = Moodle._getText(doc, 'name > text');
      expect(result).toBe('Trimmed');
    });

    it('should convert br tags to newlines', () => {
      // Format réel Moodle : HTML dans une section CDATA (sinon <br/> est un élément XML
      // et textContent l'ignore)
      const xml = '<root><text><![CDATA[Line1<br/>Line2<br />Line3]]></text></root>';
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      const result = Moodle._getText(doc, 'text');
      expect(result).toContain('\n');
    });

    it('should decode HTML entities', () => {
      // Entités HTML dans un CDATA (&nbsp; n'est pas une entité XML valide hors CDATA)
      const xml = '<root><text><![CDATA[&lt;tag&gt; &amp; &nbsp;]]></text></root>';
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      const result = Moodle._getText(doc, 'text');
      expect(result).toBe('<tag> &');
    });

    it('should strip HTML tags', () => {
      const xml = '<root><text><b>Bold</b> and <i>italic</i></text></root>';
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      const result = Moodle._getText(doc, 'text');
      expect(result).toBe('Bold and italic');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // validate - Validation XML Moodle
  // ═══════════════════════════════════════════════════════════════

  describe('validate', () => {
    it('should accept valid Moodle XML', () => {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
        <quiz>
          <question type="shortanswer">
            <name><text>Q1</text></name>
            <questiontext><text>What is 2+2?</text></questiontext>
            <answer fraction="100"><text>4</text></answer>
          </question>
        </quiz>`;

      const result = Moodle.validate(xml);
      expect(result.valid).toBe(true);
      expect(result.questionCount).toBe(1);
      expect(result.types).toContain('shortanswer');
    });

    it('should reject invalid XML', () => {
      const xml = '<quiz><question type="shortanswer">not closed';
      const result = Moodle.validate(xml);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('XML invalide');
    });

    it('should reject XML without quiz tag', () => {
      const xml = '<questions><question type="shortanswer"></question></questions>';
      const result = Moodle.validate(xml);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Balise <quiz> non trouvée');
    });

    it('should reject XML with no questions', () => {
      const xml = '<quiz></quiz>';
      const result = Moodle.validate(xml);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Aucune question trouvée');
    });

    it('should ignore category questions in count', () => {
      const xml = `<quiz>
        <question type="category">
          <category><text>Test Category</text></category>
        </question>
        <question type="shortanswer">
          <name><text>Q1</text></name>
          <questiontext><text>Test?</text></questiontext>
          <answer fraction="100"><text>Yes</text></answer>
        </question>
      </quiz>`;

      const result = Moodle.validate(xml);
      expect(result.valid).toBe(true);
      expect(result.questionCount).toBe(1);
    });

    it('should detect multiple question types', () => {
      const xml = `<quiz>
        <question type="shortanswer">
          <name><text>Q1</text></name>
          <questiontext><text>Test?</text></questiontext>
          <answer fraction="100"><text>Yes</text></answer>
        </question>
        <question type="truefalse">
          <name><text>Q2</text></name>
          <questiontext><text>True or false?</text></questiontext>
          <answer fraction="100"><text>true</text></answer>
        </question>
      </quiz>`;

      const result = Moodle.validate(xml);
      expect(result.valid).toBe(true);
      expect(result.types).toContain('shortanswer');
      expect(result.types).toContain('truefalse');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // parseXML - Parsing complet
  // ═══════════════════════════════════════════════════════════════

  describe('parseXML', () => {
    it('should create a deck with correct metadata', () => {
      const xml = `<quiz>
        <question type="shortanswer">
          <name><text>Q1</text></name>
          <questiontext><text>What is 2+2?</text></questiontext>
          <answer fraction="100"><text>4</text></answer>
        </question>
      </quiz>`;

      const deck = Moodle.parseXML(xml, 'Test Deck');

      expect(deck.name).toBe('Test Deck');
      expect(deck.id).toContain('moodle_');
      expect(deck.category).toContain('import');
      expect(deck.category).toContain('moodle');
      expect(deck.cards).toHaveLength(1);
    });

    it('should initialize Leitner properties on cards', () => {
      const xml = `<quiz>
        <question type="shortanswer">
          <name><text>Q1</text></name>
          <questiontext><text>Test?</text></questiontext>
          <answer fraction="100"><text>Yes</text></answer>
        </question>
      </quiz>`;

      const deck = Moodle.parseXML(xml);
      const card = deck.cards[0];

      expect(card.box).toBe('never_played');
      expect(card.latencyThreshold).toBeNull();
      expect(card.timesPlayed).toBe(0);
      expect(card.timesCorrect).toBe(0);
    });

    it('should throw on invalid XML', () => {
      const xml = '<invalid>not closed';
      expect(() => Moodle.parseXML(xml)).toThrow('Erreur de parsing XML');
    });

    it('should skip category questions', () => {
      const xml = `<quiz>
        <question type="category">
          <category><text>Category</text></category>
        </question>
        <question type="shortanswer">
          <name><text>Q1</text></name>
          <questiontext><text>Test?</text></questiontext>
          <answer fraction="100"><text>Yes</text></answer>
        </question>
      </quiz>`;

      const deck = Moodle.parseXML(xml);
      expect(deck.cards).toHaveLength(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _parseShortAnswer - Réponses courtes
  // ═══════════════════════════════════════════════════════════════

  describe('_parseShortAnswer', () => {
    it('should parse a simple short answer question', () => {
      const xml = `<quiz>
        <question type="shortanswer">
          <name><text>Capital</text></name>
          <questiontext><text>Quelle est la capitale de la France ?</text></questiontext>
          <answer fraction="100"><text>Paris</text></answer>
        </question>
      </quiz>`;

      const deck = Moodle.parseXML(xml);
      const card = deck.cards[0];

      expect(card.type).toBe('text');
      expect(card.question).toBe('Quelle est la capitale de la France ?');
      expect(card.answer).toBe('Paris');
    });

    it('should collect multiple accepted answers', () => {
      const xml = `<quiz>
        <question type="shortanswer">
          <name><text>Color</text></name>
          <questiontext><text>What color is the sky?</text></questiontext>
          <answer fraction="100"><text>Blue</text></answer>
          <answer fraction="50"><text>Azure</text></answer>
        </question>
      </quiz>`;

      const deck = Moodle.parseXML(xml);
      const card = deck.cards[0];

      expect(card.answer).toBe('Blue');
      expect(card.acceptedAnswers).toContain('Blue');
      expect(card.acceptedAnswers).toContain('Azure');
    });

    it('should ignore answers with 0 fraction', () => {
      const xml = `<quiz>
        <question type="shortanswer">
          <name><text>Test</text></name>
          <questiontext><text>What?</text></questiontext>
          <answer fraction="100"><text>Correct</text></answer>
          <answer fraction="0"><text>Wrong</text></answer>
        </question>
      </quiz>`;

      const deck = Moodle.parseXML(xml);
      const card = deck.cards[0];

      expect(card.acceptedAnswers).toContain('Correct');
      expect(card.acceptedAnswers).not.toContain('Wrong');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _parseTrueFalse - Questions Vrai/Faux
  // ═══════════════════════════════════════════════════════════════

  describe('_parseTrueFalse', () => {
    it('should parse a true/false question with true answer', () => {
      const xml = `<quiz>
        <question type="truefalse">
          <name><text>TF1</text></name>
          <questiontext><text>The Earth is round.</text></questiontext>
          <answer fraction="100"><text>true</text></answer>
          <answer fraction="0"><text>false</text></answer>
        </question>
      </quiz>`;

      const deck = Moodle.parseXML(xml);
      const card = deck.cards[0];

      expect(card.type).toBe('truefalse');
      expect(card.answer).toBe('true');
      expect(card.choices).toHaveLength(2);
    });

    it('should parse a true/false question with false answer', () => {
      const xml = `<quiz>
        <question type="truefalse">
          <name><text>TF2</text></name>
          <questiontext><text>The sky is green.</text></questiontext>
          <answer fraction="0"><text>true</text></answer>
          <answer fraction="100"><text>false</text></answer>
        </question>
      </quiz>`;

      const deck = Moodle.parseXML(xml);
      const card = deck.cards[0];

      expect(card.answer).toBe('false');
    });

    it('should handle French vrai/faux', () => {
      const xml = `<quiz>
        <question type="truefalse">
          <name><text>VF1</text></name>
          <questiontext><text>Paris est en France.</text></questiontext>
          <answer fraction="100"><text>vrai</text></answer>
          <answer fraction="0"><text>faux</text></answer>
        </question>
      </quiz>`;

      const deck = Moodle.parseXML(xml);
      const card = deck.cards[0];

      expect(card.answer).toBe('true');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _parseMultichoice - QCM
  // ═══════════════════════════════════════════════════════════════

  describe('_parseMultichoice', () => {
    it('should parse a single choice MCQ', () => {
      const xml = `<quiz>
        <question type="multichoice">
          <name><text>MCQ1</text></name>
          <questiontext><text>What is 2+2?</text></questiontext>
          <single>true</single>
          <answer fraction="100"><text>4</text></answer>
          <answer fraction="0"><text>3</text></answer>
          <answer fraction="0"><text>5</text></answer>
        </question>
      </quiz>`;

      const deck = Moodle.parseXML(xml);
      const card = deck.cards[0];

      expect(card.type).toBe('mcq');
      expect(card.choices).toHaveLength(3);
      expect(card.choices[0].id).toBe('A');
      expect(card.choices[0].text).toBe('4');
      expect(card.answer).toBe('A');
      expect(card.single).toBe(true);
    });

    it('should parse a multiple choice MCQ', () => {
      const xml = `<quiz>
        <question type="multichoice">
          <name><text>MCQ2</text></name>
          <questiontext><text>Which are prime?</text></questiontext>
          <single>false</single>
          <answer fraction="50"><text>2</text></answer>
          <answer fraction="50"><text>3</text></answer>
          <answer fraction="0"><text>4</text></answer>
        </question>
      </quiz>`;

      const deck = Moodle.parseXML(xml);
      const card = deck.cards[0];

      expect(card.single).toBe(false);
      expect(card.answer).toBe('A,B');
      expect(card.correctAnswers).toHaveLength(2);
    });

    it('should assign letter IDs to choices', () => {
      const xml = `<quiz>
        <question type="multichoice">
          <name><text>MCQ3</text></name>
          <questiontext><text>Test?</text></questiontext>
          <answer fraction="0"><text>A</text></answer>
          <answer fraction="0"><text>B</text></answer>
          <answer fraction="0"><text>C</text></answer>
          <answer fraction="100"><text>D</text></answer>
        </question>
      </quiz>`;

      const deck = Moodle.parseXML(xml);
      const card = deck.cards[0];

      expect(card.choices[0].id).toBe('A');
      expect(card.choices[1].id).toBe('B');
      expect(card.choices[2].id).toBe('C');
      expect(card.choices[3].id).toBe('D');
      expect(card.answer).toBe('D');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _parseNumerical - Questions numériques
  // ═══════════════════════════════════════════════════════════════

  describe('_parseNumerical', () => {
    it('should parse a numerical question', () => {
      const xml = `<quiz>
        <question type="numerical">
          <name><text>Num1</text></name>
          <questiontext><text>What is pi (2 decimals)?</text></questiontext>
          <answer fraction="100">
            <text>3.14</text>
            <tolerance>0.01</tolerance>
          </answer>
        </question>
      </quiz>`;

      const deck = Moodle.parseXML(xml);
      const card = deck.cards[0];

      expect(card.type).toBe('numeric');
      expect(card.answer).toBe('3.14');
      expect(card.tolerance).toBe(0.01);
    });

    it('should default tolerance to 0', () => {
      const xml = `<quiz>
        <question type="numerical">
          <name><text>Num2</text></name>
          <questiontext><text>What is 5+5?</text></questiontext>
          <answer fraction="100"><text>10</text></answer>
        </question>
      </quiz>`;

      const deck = Moodle.parseXML(xml);
      const card = deck.cards[0];

      expect(card.tolerance).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _parseMatching - Appariement
  // ═══════════════════════════════════════════════════════════════

  describe('_parseMatching', () => {
    it('should parse a matching question', () => {
      const xml = `<quiz>
        <question type="matching">
          <name><text>Match1</text></name>
          <questiontext><text>Match countries to capitals</text></questiontext>
          <subquestion>
            <text>France</text>
            <answer><text>Paris</text></answer>
          </subquestion>
          <subquestion>
            <text>Spain</text>
            <answer><text>Madrid</text></answer>
          </subquestion>
        </question>
      </quiz>`;

      const deck = Moodle.parseXML(xml);
      const card = deck.cards[0];

      expect(card.type).toBe('matching');
      expect(card.pairs).toHaveLength(2);
      expect(card.pairs[0].premise).toBe('France');
      expect(card.pairs[0].response).toBe('Paris');
      expect(card.pairs[1].premise).toBe('Spain');
      expect(card.pairs[1].response).toBe('Madrid');
    });

    it('should handle match type alias', () => {
      const xml = `<quiz>
        <question type="match">
          <name><text>Match2</text></name>
          <questiontext><text>Match</text></questiontext>
          <subquestion>
            <text>A</text>
            <answer><text>1</text></answer>
          </subquestion>
        </question>
      </quiz>`;

      const deck = Moodle.parseXML(xml);
      expect(deck.cards[0].type).toBe('matching');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _parseCloze - Questions à trous
  // ═══════════════════════════════════════════════════════════════

  describe('_parseCloze', () => {
    it('should parse a simple cloze question', () => {
      const xml = `<quiz>
        <question type="cloze">
          <name><text>Cloze1</text></name>
          <questiontext><text>The capital of France is {1:SHORTANSWER:=Paris}.</text></questiontext>
        </question>
      </quiz>`;

      const deck = Moodle.parseXML(xml);
      const card = deck.cards[0];

      expect(card.type).toBe('cloze');
      expect(card.blanks).toHaveLength(1);
      expect(card.blanks[0].correctAnswer).toBe('Paris');
      expect(card.blanks[0].type).toBe('text');
    });

    it('should parse multiple blanks', () => {
      const xml = `<quiz>
        <question type="cloze">
          <name><text>Cloze2</text></name>
          <questiontext><text>{1:SHORTANSWER:=Hello} {2:SHORTANSWER:=World}!</text></questiontext>
        </question>
      </quiz>`;

      const deck = Moodle.parseXML(xml);
      const card = deck.cards[0];

      expect(card.blanks).toHaveLength(2);
      expect(card.blanks[0].correctAnswer).toBe('Hello');
      expect(card.blanks[1].correctAnswer).toBe('World');
    });

    it('should parse multichoice cloze', () => {
      const xml = `<quiz>
        <question type="cloze">
          <name><text>Cloze3</text></name>
          <questiontext><text>Paris is in {1:MULTICHOICE:=France~Germany~Spain}.</text></questiontext>
        </question>
      </quiz>`;

      const deck = Moodle.parseXML(xml);
      const card = deck.cards[0];

      expect(card.blanks[0].type).toBe('mcq');
      expect(card.blanks[0].choices).toHaveLength(3);
      expect(card.blanks[0].correctAnswer).toBe('France');
    });

    it('should parse numerical cloze', () => {
      const xml = `<quiz>
        <question type="cloze">
          <name><text>Cloze4</text></name>
          <questiontext><text>2+2 = {1:NUMERICAL:=4}.</text></questiontext>
        </question>
      </quiz>`;

      const deck = Moodle.parseXML(xml);
      const card = deck.cards[0];

      expect(card.blanks[0].type).toBe('numeric');
      expect(card.blanks[0].correctAnswer).toBe('4');
    });

    it('should handle multianswer type alias', () => {
      const xml = `<quiz>
        <question type="multianswer">
          <name><text>MA1</text></name>
          <questiontext><text>{1:SHORTANSWER:=test}</text></questiontext>
        </question>
      </quiz>`;

      const deck = Moodle.parseXML(xml);
      expect(deck.cards[0].type).toBe('cloze');
    });

    it('should replace blanks with placeholders in question text', () => {
      const xml = `<quiz>
        <question type="cloze">
          <name><text>Cloze5</text></name>
          <questiontext><text>The {1:SHORTANSWER:=cat} sat on the {2:SHORTANSWER:=mat}.</text></questiontext>
        </question>
      </quiz>`;

      const deck = Moodle.parseXML(xml);
      const card = deck.cards[0];

      expect(card.question).toContain('{{blank_0}}');
      expect(card.question).toContain('{{blank_1}}');
      expect(card.question).not.toContain('SHORTANSWER');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _parseClozeBlank - Parsing des trous individuels
  // ═══════════════════════════════════════════════════════════════

  describe('_parseClozeBlank', () => {
    it('should parse correct answer with = prefix', () => {
      const blank = Moodle._parseClozeBlank('SHORTANSWER', '=correct~wrong', 0);
      expect(blank.correctAnswer).toBe('correct');
    });

    it('should parse partial answers with percentage', () => {
      const blank = Moodle._parseClozeBlank('SHORTANSWER', '=best~%50%partial~wrong', 0);
      expect(blank.correctAnswer).toBe('best');
      expect(blank.acceptedAnswers).toContain('best');
      expect(blank.acceptedAnswers).toContain('partial');
      expect(blank.acceptedAnswers).not.toContain('wrong');
    });

    it('should detect case sensitive types', () => {
      const blankSA = Moodle._parseClozeBlank('SAC', '=Test', 0);
      expect(blankSA.caseSensitive).toBe(true);

      const blankMW = Moodle._parseClozeBlank('MWC', '=Test', 0);
      expect(blankMW.caseSensitive).toBe(true);
    });

    it('should detect multichoice types', () => {
      const blankMC = Moodle._parseClozeBlank('MULTICHOICE', '=A~B~C', 0);
      expect(blankMC.type).toBe('mcq');
      expect(blankMC.choices).toHaveLength(3);
    });

    it('should detect numerical type', () => {
      const blank = Moodle._parseClozeBlank('NUMERICAL', '=42', 0);
      expect(blank.type).toBe('numeric');
    });

    it('should handle feedback after #', () => {
      const blank = Moodle._parseClozeBlank('MULTICHOICE', '=correct#Good!~wrong#Try again', 0);
      expect(blank.choices[0].feedback).toBe('Good!');
      expect(blank.choices[1].feedback).toBe('Try again');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Unsupported question types
  // ═══════════════════════════════════════════════════════════════

  describe('unsupported question types', () => {
    it('should skip unsupported question types gracefully', () => {
      const xml = `<quiz>
        <question type="essay">
          <name><text>Essay1</text></name>
          <questiontext><text>Write an essay.</text></questiontext>
        </question>
        <question type="shortanswer">
          <name><text>SA1</text></name>
          <questiontext><text>Test?</text></questiontext>
          <answer fraction="100"><text>Yes</text></answer>
        </question>
      </quiz>`;

      const deck = Moodle.parseXML(xml);
      expect(deck.cards).toHaveLength(1);
      expect(deck.cards[0].name).toBe('SA1');
    });
  });
});
