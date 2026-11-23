/**
 * Tests pour le module Validator
 * Validation des réponses utilisateur
 */

describe('Validator Module', () => {

  // ═══════════════════════════════════════════════════════════════
  // normalizeText() - Normalise le texte
  // ═══════════════════════════════════════════════════════════════

  describe('normalizeText', () => {
    it('should convert to lowercase', () => {
      expect(Validator.normalizeText('HELLO')).toBe('hello');
      expect(Validator.normalizeText('HeLLo WoRLd')).toBe('hello world');
    });

    it('should remove French accents', () => {
      expect(Validator.normalizeText('été')).toBe('ete');
      expect(Validator.normalizeText('français')).toBe('francais');
      expect(Validator.normalizeText('élève')).toBe('eleve');
      expect(Validator.normalizeText('âme')).toBe('ame');
      expect(Validator.normalizeText('château')).toBe('chateau');
      expect(Validator.normalizeText('forêt')).toBe('foret');
      expect(Validator.normalizeText('naïf')).toBe('naif');
      expect(Validator.normalizeText('Noël')).toBe('noel');
      expect(Validator.normalizeText('œuvre')).toBe('oeuvre');
      expect(Validator.normalizeText('cœur')).toBe('coeur');
    });

    it('should remove punctuation', () => {
      expect(Validator.normalizeText('hello!')).toBe('hello');
      expect(Validator.normalizeText('hello, world')).toBe('hello world');
      expect(Validator.normalizeText("l'été")).toBe('l ete');
      expect(Validator.normalizeText('test: value;')).toBe('test value');
      expect(Validator.normalizeText('a-b-c')).toBe('a b c');
      expect(Validator.normalizeText('test.com')).toBe('testcom');
    });

    it('should trim whitespace', () => {
      expect(Validator.normalizeText('  hello  ')).toBe('hello');
      expect(Validator.normalizeText('\n\thello\n\t')).toBe('hello');
      expect(Validator.normalizeText('  multiple   spaces  ')).toBe('multiple spaces');
    });

    it('should handle combined transformations', () => {
      expect(Validator.normalizeText('  CAFÉ !  ')).toBe('cafe');
      expect(Validator.normalizeText("L'Été, c'est génial!")).toBe('l ete c est genial');
      expect(Validator.normalizeText('  Château-Fort  ')).toBe('chateau fort');
    });

    it('should handle empty string', () => {
      expect(Validator.normalizeText('')).toBe('');
      expect(Validator.normalizeText('   ')).toBe('');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // damerauLevenshtein() - Distance d'édition
  // ═══════════════════════════════════════════════════════════════

  describe('damerauLevenshtein', () => {
    it('should return 0 for identical strings', () => {
      expect(Validator.damerauLevenshtein('hello', 'hello')).toBe(0);
      expect(Validator.damerauLevenshtein('', '')).toBe(0);
      expect(Validator.damerauLevenshtein('test', 'test')).toBe(0);
    });

    it('should return correct distance for substitution', () => {
      expect(Validator.damerauLevenshtein('cat', 'bat')).toBe(1);
      expect(Validator.damerauLevenshtein('hello', 'hallo')).toBe(1);
    });

    it('should return correct distance for insertion', () => {
      expect(Validator.damerauLevenshtein('cat', 'cats')).toBe(1);
      expect(Validator.damerauLevenshtein('hel', 'hello')).toBe(2);
    });

    it('should return correct distance for deletion', () => {
      expect(Validator.damerauLevenshtein('cats', 'cat')).toBe(1);
      expect(Validator.damerauLevenshtein('hello', 'hel')).toBe(2);
    });

    it('should return correct distance for transposition', () => {
      expect(Validator.damerauLevenshtein('ab', 'ba')).toBe(1);
      expect(Validator.damerauLevenshtein('hello', 'hlelo')).toBe(1);
      expect(Validator.damerauLevenshtein('test', 'tset')).toBe(1);
    });

    it('should handle multiple edits', () => {
      expect(Validator.damerauLevenshtein('kitten', 'sitting')).toBe(3);
      expect(Validator.damerauLevenshtein('saturday', 'sunday')).toBe(3);
    });

    it('should handle empty strings', () => {
      expect(Validator.damerauLevenshtein('', 'hello')).toBe(5);
      expect(Validator.damerauLevenshtein('hello', '')).toBe(5);
    });

    it('should be case sensitive', () => {
      expect(Validator.damerauLevenshtein('Hello', 'hello')).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // similarity() - Similarité entre 0 et 1
  // ═══════════════════════════════════════════════════════════════

  describe('similarity', () => {
    it('should return 1 for identical strings', () => {
      expect(Validator.similarity('hello', 'hello')).toBe(1);
      expect(Validator.similarity('test', 'test')).toBe(1);
    });

    it('should return 0 for completely different strings of same length', () => {
      // 'abc' vs 'xyz' : distance = 3, max length = 3 → 1 - (3/3) = 0
      expect(Validator.similarity('abc', 'xyz')).toBe(0);
    });

    it('should return value between 0 and 1 for partially similar strings', () => {
      // 'cat' vs 'bat' : distance = 1, max length = 3 → 1 - (1/3) ≈ 0.667
      const sim = Validator.similarity('cat', 'bat');
      expect(sim).toBeCloseTo(0.667, 2);

      // 'hello' vs 'hallo' : distance = 1, max length = 5 → 1 - (1/5) = 0.8
      expect(Validator.similarity('hello', 'hallo')).toBe(0.8);
    });

    it('should handle empty strings', () => {
      expect(Validator.similarity('', '')).toBe(1);
      expect(Validator.similarity('hello', '')).toBe(0);
      expect(Validator.similarity('', 'hello')).toBe(0);
    });

    it('should use max length for denominator', () => {
      // 'cat' vs 'cats' : distance = 1, max length = 4 → 1 - (1/4) = 0.75
      expect(Validator.similarity('cat', 'cats')).toBe(0.75);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // validateAnswer() - Validation principale
  // ═══════════════════════════════════════════════════════════════

  describe('validateAnswer - numeric', () => {
    it('should accept exact numeric match', () => {
      expect(Validator.validateAnswer('42', '42', 'numeric')).toBe(true);
      expect(Validator.validateAnswer('3.14', '3.14', 'numeric')).toBe(true);
      expect(Validator.validateAnswer('-5', '-5', 'numeric')).toBe(true);
    });

    it('should accept numeric match with tolerance', () => {
      expect(Validator.validateAnswer('42', '42.5', 'numeric', { tolerance: 1 })).toBe(true);
      expect(Validator.validateAnswer('42.5', '42', 'numeric', { tolerance: 1 })).toBe(true);
      expect(Validator.validateAnswer('99', '100', 'numeric', { tolerance: 2 })).toBe(true);
    });

    it('should reject numeric answers outside tolerance', () => {
      expect(Validator.validateAnswer('40', '42', 'numeric', { tolerance: 1 })).toBe(false);
      expect(Validator.validateAnswer('45', '42', 'numeric', { tolerance: 2 })).toBe(false);
    });

    it('should reject non-numeric user answers', () => {
      expect(Validator.validateAnswer('abc', '42', 'numeric')).toBe(false);
      expect(Validator.validateAnswer('', '42', 'numeric')).toBe(false);
      expect(Validator.validateAnswer('  ', '42', 'numeric')).toBe(false);
    });

    it('should use tolerance 0 by default', () => {
      expect(Validator.validateAnswer('42', '42', 'numeric')).toBe(true);
      expect(Validator.validateAnswer('42.1', '42', 'numeric')).toBe(false);
    });

    it('should handle decimal numbers', () => {
      expect(Validator.validateAnswer('3.14', '3.14', 'numeric')).toBe(true);
      expect(Validator.validateAnswer('3.14', '3.15', 'numeric', { tolerance: 0.02 })).toBe(true);
    });
  });

  describe('validateAnswer - exact_text', () => {
    it('should accept exact normalized match', () => {
      expect(Validator.validateAnswer('hello', 'hello', 'exact_text')).toBe(true);
      expect(Validator.validateAnswer('HELLO', 'hello', 'exact_text')).toBe(true);
      expect(Validator.validateAnswer('  hello  ', 'hello', 'exact_text')).toBe(true);
    });

    it('should accept match with accent differences', () => {
      expect(Validator.validateAnswer('café', 'cafe', 'exact_text')).toBe(true);
      expect(Validator.validateAnswer('ete', 'été', 'exact_text')).toBe(true);
    });

    it('should accept match with punctuation differences', () => {
      expect(Validator.validateAnswer('hello!', 'hello', 'exact_text')).toBe(true);
      expect(Validator.validateAnswer("l'été", 'lete', 'exact_text')).toBe(true);
    });

    it('should reject different normalized texts', () => {
      expect(Validator.validateAnswer('hello', 'world', 'exact_text')).toBe(false);
      expect(Validator.validateAnswer('cat', 'dog', 'exact_text')).toBe(false);
    });

    it('should reject partial matches', () => {
      expect(Validator.validateAnswer('hel', 'hello', 'exact_text')).toBe(false);
      expect(Validator.validateAnswer('hello world', 'hello', 'exact_text')).toBe(false);
    });
  });

  describe('validateAnswer - fuzzy_text', () => {
    it('should accept exact match', () => {
      expect(Validator.validateAnswer('hello', 'hello', 'fuzzy_text')).toBe(true);
    });

    it('should accept minor typos within threshold', () => {
      // 'helo' vs 'hello' : distance = 1, max length = 5 → similarity = 0.8
      expect(Validator.validateAnswer('helo', 'hello', 'fuzzy_text', { similarityThreshold: 0.8 })).toBe(true);

      // 'hlelo' (transposition) vs 'hello' : distance = 1, similarity = 0.8
      expect(Validator.validateAnswer('hlelo', 'hello', 'fuzzy_text', { similarityThreshold: 0.8 })).toBe(true);
    });

    it('should reject typos above threshold', () => {
      // 'helo' vs 'hello' : similarity = 0.8, threshold = 0.9 → reject
      expect(Validator.validateAnswer('helo', 'hello', 'fuzzy_text', { similarityThreshold: 0.9 })).toBe(false);

      // Completely different
      expect(Validator.validateAnswer('cat', 'dog', 'fuzzy_text')).toBe(false);
    });

    it('should use default threshold of 0.8', () => {
      // 'helo' vs 'hello' : similarity = 0.8 → accept
      expect(Validator.validateAnswer('helo', 'hello', 'fuzzy_text')).toBe(true);

      // 'hlo' vs 'hello' : distance = 2, similarity = 0.6 → reject
      expect(Validator.validateAnswer('hlo', 'hello', 'fuzzy_text')).toBe(false);
    });

    it('should normalize before comparing', () => {
      expect(Validator.validateAnswer('HELLO', 'hello', 'fuzzy_text')).toBe(true);
      expect(Validator.validateAnswer('café!', 'cafe', 'fuzzy_text')).toBe(true);
    });
  });

  describe('validateAnswer - mcq', () => {
    // Note: MCQ validation utilise des IDs lettre (A, B, C), pas des indices numériques

    it('should accept correct ID (A, B, C)', () => {
      expect(Validator.validateAnswer('A', 'A', 'mcq')).toBe(true);
      expect(Validator.validateAnswer('B', 'B', 'mcq')).toBe(true);
      expect(Validator.validateAnswer('a', 'A', 'mcq')).toBe(true); // case insensitive
    });

    it('should accept multiple correct answers', () => {
      expect(Validator.validateAnswer('A,B', 'A,B', 'mcq')).toBe(true);
      expect(Validator.validateAnswer('B,A', 'A,B', 'mcq')).toBe(true); // order doesn't matter
    });

    it('should reject incorrect ID', () => {
      expect(Validator.validateAnswer('B', 'A', 'mcq')).toBe(false);
      expect(Validator.validateAnswer('A,B', 'A', 'mcq')).toBe(false); // wrong count
    });

    it('should reject incorrect text', () => {
      expect(Validator.validateAnswer('Option C', 'Option A', 'mcq', { choices: ['Option A', 'Option B'] })).toBe(false);
      expect(Validator.validateAnswer('Wrong', 'Option A', 'mcq', { choices: ['Option A', 'Option B'] })).toBe(false);
    });

    it('should handle missing choices array', () => {
      // Without choices array, should fall back to exact text match
      expect(Validator.validateAnswer('Option A', 'Option A', 'mcq')).toBe(true);
      expect(Validator.validateAnswer('0', 'Option A', 'mcq')).toBe(false);
    });
  });

  describe('validateAnswer - edge cases', () => {
    it('should handle empty strings', () => {
      expect(Validator.validateAnswer('', '', 'exact_text')).toBe(true);
      expect(Validator.validateAnswer('', 'hello', 'exact_text')).toBe(false);
    });

    it('should handle undefined options', () => {
      expect(Validator.validateAnswer('42', '42', 'numeric')).toBe(true);
      expect(Validator.validateAnswer('hello', 'hello', 'exact_text')).toBe(true);
    });

    it('should fallback to fuzzy text for unknown type', () => {
      // Unknown types fall back to fuzzy text validation
      expect(Validator.validateAnswer('test', 'test', 'unknown_type')).toBe(true);
      expect(Validator.validateAnswer('hello', 'hello', 'custom_type')).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FEEDBACK HELPERS (ex-Similarity module)
});
