/**
 * Tests de normalisation de texte : support Unicode (non-ASCII)
 *
 * Bug corrigé : `.replace(/[^\w\s]/g, '')` supprimait toute lettre non latine
 * (grec, cyrillique, kana, kanji...) car \w est ASCII-only en JavaScript, et
 * confondait aussi '-12'/'12', '3/4'/'34', 'Sol♭ majeur'/'Sol majeur'.
 *
 * Modules testés : TextUtils.normalizeText,
 * Validator.normalizeText (délégation DRY) et Validator.validateAnswer.
 */

describe('Normalisation Unicode', () => {

  const norm = (s) => TextUtils.normalizeText(s);

  // ═══════════════════════════════════════════════════════════════
  // Écritures non latines : les lettres doivent rester distinctes
  // ═══════════════════════════════════════════════════════════════

  describe('lettres non latines', () => {
    it('should keep Greek letters distinct', () => {
      expect(norm('α')).not.toBe('');
      expect(norm('α')).not.toBe(norm('β'));
      expect(norm('Ω')).toBe('ω');
      expect(norm('π')).not.toBe(norm('ρ'));
    });

    it('should keep Cyrillic letters distinct', () => {
      expect(norm('ж')).not.toBe('');
      expect(norm('ж')).not.toBe(norm('д'));
      expect(norm('Б')).toBe('б');
    });

    it('should keep hiragana and katakana distinct', () => {
      expect(norm('あ')).not.toBe('');
      expect(norm('あ')).not.toBe(norm('い'));
      expect(norm('ア')).not.toBe(norm('イ'));
    });

    it('should keep kanji distinct', () => {
      expect(norm('日')).not.toBe('');
      expect(norm('日')).not.toBe(norm('月'));
      expect(norm('日本語')).toBe('日本語');
    });

    it('should keep Cyrillic words intact', () => {
      expect(norm('Привет, мир!')).toBe('привет мир');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Diacritiques : ignorés pour le latin, conservés ailleurs
  // ═══════════════════════════════════════════════════════════════

  describe('diacritiques non latins conservés', () => {
    it('should keep й distinct from и (breve is part of the letter)', () => {
      expect(norm('й')).not.toBe(norm('и'));
      expect(norm('Й')).toBe('й'.normalize('NFC'));
    });

    it('should keep ё distinct from е', () => {
      expect(norm('ё')).not.toBe(norm('е'));
    });

    it('should keep kana dakuten distinct (が vs か, ぎ vs き, ば vs ぱ vs は)', () => {
      expect(norm('が')).not.toBe(norm('か'));
      expect(norm('ぎ')).not.toBe(norm('き'));
      expect(norm('ガ')).not.toBe(norm('カ'));
      expect(norm('ば')).not.toBe(norm('は'));
      expect(norm('ぱ')).not.toBe(norm('は'));
      expect(norm('ば')).not.toBe(norm('ぱ'));
    });

    it('should give the same result for NFC and NFD input', () => {
      expect(norm('が')).toBe(norm('が'));
      expect(norm('й')).toBe(norm('й'));
    });

    it('should preserve accents-insensitivity for Latin (regression)', () => {
      expect(norm('Élève')).toBe('eleve');
      expect(norm('Élève')).toBe(norm('eleve'));
      expect(norm('naïf')).toBe('naif');
      expect(norm('Noël')).toBe('noel');
      expect(norm('Ça')).toBe('ca');
      expect(norm('Ñandú')).toBe('nandu');
    });

    it('should preserve ligatures (regression)', () => {
      expect(norm('cœur')).toBe('coeur');
      expect(norm('Œuvre')).toBe('oeuvre');
      expect(norm('æther')).toBe('aether');
    });

    it('should accept NFD-typed Latin accents (e + U+0301)', () => {
      expect(norm('été')).toBe('ete');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Symboles porteurs de sens
  // ═══════════════════════════════════════════════════════════════

  describe('signe moins', () => {
    it('should distinguish -12 from 12', () => {
      expect(norm('-12')).toBe('-12');
      expect(norm('-12')).not.toBe(norm('12'));
    });

    it('should treat U+2212 and en dash as minus before a number', () => {
      expect(norm('−12')).toBe('-12');
      expect(norm('–12')).toBe('-12');
    });

    it('should keep minus after a space or an equal sign', () => {
      expect(norm('x = -3')).not.toBe(norm('x = 3'));
      expect(norm('x=-3')).not.toBe(norm('x=3'));
    });

    it('should treat hyphens inside words as word separators', () => {
      expect(norm('a-b-c')).toBe('a b c');
      expect(norm('peut-être')).toBe('peut etre');
    });
  });

  describe('barre de fraction', () => {
    it('should distinguish 3/4 from 34', () => {
      expect(norm('3/4')).toBe('3/4');
      expect(norm('3/4')).not.toBe(norm('34'));
    });

    it('should accept fraction slash U+2044 and division slash U+2215', () => {
      expect(norm('3⁄4')).toBe('3/4');
      expect(norm('3∕4')).toBe('3/4');
    });

    it('should chain fractions', () => {
      expect(norm('1/2/3')).toBe('1/2/3');
    });

    it('should still drop a slash between words', () => {
      expect(norm('et/ou')).toBe('etou');
    });
  });

  describe('séparateur décimal', () => {
    it('should distinguish 2.5 from 25', () => {
      expect(norm('2.5')).not.toBe(norm('25'));
      expect(norm('2,5')).not.toBe(norm('25'));
    });

    it('should treat decimal point and comma as equivalent', () => {
      expect(norm('2,5')).toBe(norm('2.5'));
      expect(norm('0,75')).toBe('0.75');
    });

    it('should not touch trailing sentence punctuation after a number', () => {
      expect(norm('Il y en a 12.')).toBe('il y en a 12');
      expect(norm('12,')).toBe('12');
    });
  });

  describe('altérations musicales et symboles', () => {
    it('should keep flat sign as distinctive', () => {
      expect(norm('Sol♭ majeur')).toBe('sol♭ majeur');
      expect(norm('Sol♭ majeur')).not.toBe(norm('Sol majeur'));
    });

    it('should keep sharp and natural signs as distinctive', () => {
      expect(norm('Fa♯')).not.toBe(norm('Fa'));
      expect(norm('Fa♯')).not.toBe(norm('Fa♭'));
      expect(norm('Fa# majeur')).not.toBe(norm('Fa majeur'));
      expect(norm('Si♮')).not.toBe(norm('Si'));
    });

    it('should keep + so that m+n differs from mn', () => {
      expect(norm('m+n')).not.toBe(norm('mn'));
    });

    it('should keep percent and degree signs', () => {
      expect(norm('50%')).not.toBe(norm('50'));
      expect(norm('90°')).not.toBe(norm('90'));
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Trait d'union et apostrophe entre deux lettres/chiffres = espace
  // ═══════════════════════════════════════════════════════════════

  describe('trait d\'union et apostrophe comme séparateurs', () => {
    it('should make hyphen, space and multiple spaces equivalent', () => {
      expect(norm('Porto-Novo')).toBe('porto novo');
      expect(norm('Porto Novo')).toBe(norm('Porto-Novo'));
      expect(norm('porto  novo')).toBe(norm('Porto-Novo'));
      expect(norm('Seine Saint Denis')).toBe(norm('Seine-Saint-Denis'));
      expect(norm('États Unis')).toBe(norm('États-Unis'));
      expect(norm('arc en ciel')).toBe(norm('arc-en-ciel'));
    });

    it('should treat straight and typographic apostrophes as spaces', () => {
      expect(norm("l'eau")).toBe(norm('l eau'));
      expect(norm('l’eau')).toBe(norm('l eau'));
      expect(norm("N'Djamena")).toBe(norm('N Djamena'));
      expect(norm("Port-d'Espagne")).toBe(norm("Port d'Espagne"));
      expect(norm("Port-d'Espagne")).toBe(norm('Port d Espagne'));
    });

    it('should handle other hyphen-like characters between letters', () => {
      expect(norm('Porto‑Novo')).toBe('porto novo');
      expect(norm('Porto–Novo')).toBe('porto novo');
    });

    it('should work between digits', () => {
      expect(norm('2-3')).toBe('2 3');
    });

    it('should keep the minus before a number, even after a hyphenated word', () => {
      expect(norm('-12')).toBe('-12');
      expect(norm('x = -3')).toBe('x = -3');
      expect(norm('peut-être -12')).toBe('peut etre -12');
    });

    it('should keep fraction, decimal and musical signs', () => {
      expect(norm('3/4')).toBe('3/4');
      expect(norm('2,5')).toBe('2.5');
      expect(norm('Sol♭ majeur')).toBe('sol♭ majeur');
    });

    it('should drop leading/trailing hyphens and apostrophes (not between letters)', () => {
      expect(norm("-abc-")).toBe('abc');
      expect(norm("'abc'")).toBe('abc');
    });

    it('should work with non-Latin letters', () => {
      expect(norm('до-свидания')).toBe('до свидания');
    });
  });

  describe('validation de bout en bout (trait d\'union, apostrophe)', () => {
    const exact = (u, a) => Validator.validateAnswer(u, a, 'text', { similarityThreshold: 1 });
    const game = (u, a) => GameAnswerValidator.checkAnswer(
      { type: 'text', question: 'q', answer: a }, u, { settings: { similarityThreshold: 1 } });

    it('should accept hyphenated, spaced and soldered writings (exact)', () => {
      ['Porto-Novo', 'Porto Novo', 'porto  novo', 'PortoNovo', 'portonovo'].forEach(u => {
        expect(exact(u, 'Porto-Novo')).toBe(true);
      });
      expect(exact('Port d\'Espagne', 'Port-d\'Espagne')).toBe(true);
      expect(exact('N Djamena', 'N\'Djamena')).toBe(true);
      expect(exact('N’Djamena', 'N\'Djamena')).toBe(true);
      expect(exact('arcenciel', 'arc-en-ciel')).toBe(true);
      expect(exact('aujourdhui', 'aujourd\'hui')).toBe(true);
      expect(exact('Aujourd hui', 'aujourd\'hui')).toBe(true);
    });

    it('should also work when the expected answer has spaces and the user types hyphens', () => {
      expect(exact('Porto-Novo', 'Porto Novo')).toBe(true);
    });

    it('should still reject different answers', () => {
      expect(exact('Porto', 'Porto-Novo')).toBe(false);
      expect(exact('Novo', 'Porto-Novo')).toBe(false);
      expect(exact('Port Novo', 'Porto-Novo')).toBe(false);
      expect(exact('', 'Porto-Novo')).toBe(false);
      expect(exact('12', '-12')).toBe(false);
      expect(exact('34', '3/4')).toBe(false);
      expect(exact('Sol majeur', 'Sol♭ majeur')).toBe(false);
    });

    it('should go through GameAnswerValidator.checkAnswer', () => {
      expect(game('Porto Novo', 'Porto-Novo')).toBe(true);
      expect(game('Port d\'Espagne', 'Port-d\'Espagne')).toBe(true);
      expect(game('N Djamena', 'N\'Djamena')).toBe(true);
      expect(game('Seine Saint Denis', 'Seine-Saint-Denis')).toBe(true);
      expect(game('PortoNovo', 'Porto-Novo')).toBe(true);
      expect(game('Porto', 'Porto-Novo')).toBe(false);
    });

    it('should apply to alternatives', () => {
      const card = { type: 'text', question: 'q', answer: 'x', alternatives: ['Porto-Novo'] };
      expect(GameAnswerValidator.checkAnswer(card, 'Porto Novo', { settings: { similarityThreshold: 1 } })).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Non-régression du comportement voulu
  // ═══════════════════════════════════════════════════════════════

  describe('comportement existant conservé', () => {
    it('should ignore case', () => {
      expect(norm('PARIS')).toBe('paris');
      expect(norm('ПРИВЕТ')).toBe(norm('привет'));
    });

    it('should ignore sentence punctuation', () => {
      expect(norm('Paris.')).toBe('paris');
      expect(norm('Paris.')).toBe(norm('paris'));
      expect(norm('Bonjour !')).toBe('bonjour');
      expect(norm('« Paris »')).toBe('paris');
      expect(norm('Paris…')).toBe('paris');
    });

    it('should collapse multiple spaces and trim', () => {
      expect(norm('  la   tour \t Eiffel \n')).toBe('la tour eiffel');
    });

    it('should keep l\'eau comparable', () => {
      expect(norm("l'eau")).toBe('l eau');
      expect(norm("L'eau")).toBe(norm('l’eau'));
      expect(norm("l'eau")).toBe(norm('l eau'));
    });

    it('should keep digits and underscore', () => {
      expect(norm('Test_123')).toBe('test_123');
    });

    it('should return empty string for non-strings', () => {
      expect(norm(null)).toBe('');
      expect(norm(undefined)).toBe('');
      expect(norm(42)).toBe('');
    });

    it('should return empty string for pure punctuation', () => {
      expect(norm('!?...')).toBe('');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // slugify reste ASCII
  // ═══════════════════════════════════════════════════════════════

  describe('slugify (regression)', () => {
    it('should still produce ASCII slugs', () => {
      expect(TextUtils.slugify('Élève du Collège !')).toBe('eleve-du-college');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Validator : délégation et effets sur la validation
  // ═══════════════════════════════════════════════════════════════

  describe('Validator.normalizeText', () => {
    it('should give exactly the same result as TextUtils.normalizeText', () => {
      const samples = ['α', 'ж', 'あ', '日本', '-12', '3/4', 'Sol♭ majeur', 'Élève', 'Paris.', "l'eau", 'が', 'Й'];
      samples.forEach(s => {
        expect(Validator.normalizeText(s)).toBe(TextUtils.normalizeText(s));
      });
    });
  });

  describe('Validator.validateAnswer (text, exact)', () => {
    const ok = (user, answer) => Validator.validateAnswer(user, answer, 'text', { similarityThreshold: 1 });

    it('should reject a different Greek letter or an empty answer', () => {
      expect(ok('α', 'α')).toBe(true);
      expect(ok('β', 'α')).toBe(false);
      expect(ok('', 'α')).toBe(false);
    });

    it('should reject a different Cyrillic letter or an empty answer', () => {
      expect(ok('д', 'ж')).toBe(false);
      expect(ok('', 'ж')).toBe(false);
      expect(ok('и', 'й')).toBe(false);
    });

    it('should reject a different kana or an empty answer', () => {
      expect(ok('い', 'あ')).toBe(false);
      expect(ok('', 'あ')).toBe(false);
      expect(ok('か', 'が')).toBe(false);
      expect(ok('が', 'が')).toBe(true);
    });

    it('should reject missing minus, fraction bar, decimal point and flat sign', () => {
      expect(ok('12', '-12')).toBe(false);
      expect(ok('34', '3/4')).toBe(false);
      expect(ok('25', '2.5')).toBe(false);
      expect(ok('Sol majeur', 'Sol♭ majeur')).toBe(false);
      expect(ok('Sol♭ majeur', 'Sol♭ majeur')).toBe(true);
    });

    it('should still accept typical French variations', () => {
      expect(ok('paris', 'Paris.')).toBe(true);
      expect(ok('  eleve ', 'Élève')).toBe(true);
    });
  });

  describe('Validator.validateAnswer (fuzzy) does not turn distinct symbols into typos', () => {
    it('should not accept a lone different letter at default threshold', () => {
      expect(Validator.validateAnswer('β', 'α', 'text')).toBe(false);
      expect(Validator.validateAnswer('', 'あ', 'text')).toBe(false);
    });
  });
});
