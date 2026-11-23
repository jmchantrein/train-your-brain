/**
 * Tests pour le module TextUtils
 */

const { describe, it, expect, beforeEach, run } = TestRunner;

// Charger le module
const TextUtils = require('../src/modules/text-utils.js');

describe('TextUtils', () => {
  describe('normalizeText', () => {
    it('should convert to lowercase', () => {
      expect(TextUtils.normalizeText('HELLO WORLD')).toBe('hello world');
    });

    it('should remove accents', () => {
      expect(TextUtils.normalizeText('café élève')).toBe('cafe eleve');
      expect(TextUtils.normalizeText('naïve')).toBe('naive');
    });

    it('should handle ligatures', () => {
      expect(TextUtils.normalizeText('cœur')).toBe('coeur');
      expect(TextUtils.normalizeText('Æneid')).toBe('aeneid');
    });

    it('should remove punctuation', () => {
      expect(TextUtils.normalizeText('hello, world!')).toBe('hello world');
      expect(TextUtils.normalizeText("it's a test.")).toBe('it s a test');
    });

    it('should normalize whitespace', () => {
      expect(TextUtils.normalizeText('  hello   world  ')).toBe('hello world');
    });

    it('should handle empty or non-string input', () => {
      expect(TextUtils.normalizeText('')).toBe('');
      expect(TextUtils.normalizeText(null)).toBe('');
      expect(TextUtils.normalizeText(undefined)).toBe('');
      expect(TextUtils.normalizeText(123)).toBe('');
    });

    it('should handle complex French text', () => {
      expect(TextUtils.normalizeText('L\'éléphant français')).toBe('l elephant francais');
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      const result = TextUtils.escapeHtml('<script>alert("XSS")</script>');
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;');
    });

    it('should handle empty or non-string input', () => {
      expect(TextUtils.escapeHtml('')).toBe('');
      expect(TextUtils.escapeHtml(null)).toBe('');
      expect(TextUtils.escapeHtml(undefined)).toBe('');
    });

    it('should escape & < > " and \' (safe in text and attribute contexts)', () => {
      expect(TextUtils.escapeHtml('a & b < c > d " e \' f'))
        .toBe('a &amp; b &lt; c &gt; d &quot; e &#39; f');
    });

    it('should not double-escape the entities it produces in one pass', () => {
      expect(TextUtils.escapeHtml('&lt;')).toBe('&amp;lt;');
    });

    it('should neutralise an attribute-breaking payload', () => {
      const out = TextUtils.escapeHtml('" onmouseover="alert(1)');
      expect(out).not.toContain('"');
      expect(`<div title="${out}">`).toBe('<div title="&quot; onmouseover=&quot;alert(1)">');
    });

    it('should stringify numbers and booleans instead of dropping them', () => {
      expect(TextUtils.escapeHtml(42)).toBe('42');
      expect(TextUtils.escapeHtml(false)).toBe('false');
    });

    it('should not depend on the DOM', () => {
      const original = document.createElement;
      document.createElement = () => { throw new Error('DOM must not be used'); };
      try {
        expect(TextUtils.escapeHtml('<b>"x"</b>')).toBe('&lt;b&gt;&quot;x&quot;&lt;/b&gt;');
      } finally {
        document.createElement = original;
      }
    });
  });

  describe('shuffleArray', () => {
    it('should return a new array with the same elements and leave the input untouched', () => {
      const input = [1, 2, 3, 4, 5, 6];
      const out = TextUtils.shuffleArray(input);
      expect(out).not.toBe(input);
      expect(input).toEqual([1, 2, 3, 4, 5, 6]);
      expect([...out].sort()).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should handle empty and single-element arrays', () => {
      expect(TextUtils.shuffleArray([])).toEqual([]);
      expect(TextUtils.shuffleArray(['a'])).toEqual(['a']);
    });

    it('should be a Fisher-Yates shuffle driven by the injected random source', () => {
      expect(TextUtils.shuffleArray(['a', 'b', 'c', 'd'], () => 0)).toEqual(['b', 'c', 'd', 'a']);
      expect(TextUtils.shuffleArray(['a', 'b', 'c', 'd'], () => 0.999999)).toEqual(['a', 'b', 'c', 'd']);
    });

    it('should reach every permutation of 3 elements', () => {
      const seen = new Set();
      for (let i = 0; i < 500; i++) seen.add(TextUtils.shuffleArray([1, 2, 3]).join(''));
      expect(seen.size).toBe(6);
    });
  });

  describe('slugify', () => {
    it('should create URL-friendly slug', () => {
      expect(TextUtils.slugify('Hello World')).toBe('hello-world');
    });

    it('should handle accents and special chars', () => {
      expect(TextUtils.slugify('Café & Thé')).toBe('cafe-the');
    });

    it('should handle multiple spaces', () => {
      expect(TextUtils.slugify('Hello   World')).toBe('hello-world');
    });

    it('should turn every run of non-alphanumeric ASCII characters into one separator (frozen corpus)', () => {
      const cases = {
        'C++ & Co': 'c-co', 'a_b': 'a-b', '1.5 km': '1-5-km', "l'eau": 'l-eau',
        'test@123': 'test-123', '---x---': 'x', 'ÀÉÎÕÜ': 'aeiou', 'Ça va ?': 'ca-va',
        'x/y': 'x-y', 'a--b': 'a-b', 'straße': 'stra-e', 'œuvre': 'uvre', '  ': ''
      };
      for (const [input, expected] of Object.entries(cases)) {
        expect(TextUtils.slugify(input)).toBe(expected);
      }
    });

    it('should drop non-Latin scripts in the default ASCII mode', () => {
      expect(TextUtils.slugify('Привет мир')).toBe('');
      expect(TextUtils.slugify('日本語 テスト')).toBe('');
    });

    it('should return an empty string for non-string input', () => {
      expect(TextUtils.slugify(null)).toBe('');
      expect(TextUtils.slugify(undefined)).toBe('');
    });

    it('should support a custom separator', () => {
      expect(TextUtils.slugify('Hello World', { separator: '_' })).toBe('hello_world');
      expect(TextUtils.slugify('a--b', { separator: '_' })).toBe('a_b');
    });

    it('should keep letters and digits of every script with unicode: true (frozen corpus)', () => {
      const opts = { separator: '_', unicode: true };
      const cases = {
        'Привет мир': 'привет_мир', '日本語 テスト': '日本語_テスト', 'straße': 'strasse', 'ß': 'ss',
        'œuvre': 'œuvre', 'Zoë  ': 'zoe', 'Élève du Collège !': 'eleve_du_college', 'a_b': 'a_b',
        '1.5 km': '1_5_km', 'test@123': 'test_123', '': ''
      };
      for (const [input, expected] of Object.entries(cases)) {
        expect(TextUtils.slugify(input, opts)).toBe(expected);
      }
    });
  });

  describe('levenshteinDistance', () => {
    it('should compute the classic edit distance', () => {
      expect(TextUtils.levenshteinDistance('kitten', 'sitting')).toBe(3);
      expect(TextUtils.levenshteinDistance('abc', 'abc')).toBe(0);
      expect(TextUtils.levenshteinDistance('', 'abc')).toBe(3);
      expect(TextUtils.levenshteinDistance('abc', '')).toBe(3);
      expect(TextUtils.levenshteinDistance('', '')).toBe(0);
    });

    it('should be symmetric', () => {
      expect(TextUtils.levenshteinDistance('flaw', 'lawn')).toBe(TextUtils.levenshteinDistance('lawn', 'flaw'));
    });

    it('should count a transposition as 2 edits by default and 1 with transpositions: true', () => {
      expect(TextUtils.levenshteinDistance('ab', 'ba')).toBe(2);
      expect(TextUtils.levenshteinDistance('ab', 'ba', { transpositions: true })).toBe(1);
      expect(TextUtils.levenshteinDistance('bonjuor', 'bonjour', { transpositions: true })).toBe(1);
    });

    it('should keep the optimal-string-alignment behaviour (no edit across a transposition)', () => {
      expect(TextUtils.levenshteinDistance('ca', 'abc', { transpositions: true })).toBe(3);
    });
  });
});

// Auto-run si exécuté directement
if (typeof window !== 'undefined') {
  run();
}
