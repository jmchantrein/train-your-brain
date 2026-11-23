/**
 * Générateur d'hiragana et katakana japonais
 *
 * Génère des decks pour :
 * - Hiragana de base (46 caractères)
 * - Hiragana avec dakuten/handakuten
 * - Katakana de base (46 caractères)
 * - Katakana avec dakuten/handakuten
 *
 * Niveau: autodidacte, débutant japonais
 */

const BaseGenerator = require('../base-generator.cjs');

class JapaneseKanaGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'japanese-kana',
      name: 'Hiragana et Katakana',
      tags: ['langues', 'japonais', 'alphabet', 'kana'],
      version: '1.0.0',
      description: 'Syllabaires japonais hiragana et katakana'
    });

    // Hiragana de base (gojūon)
    this.hiraganaBase = [
      // Voyelles
      { kana: 'あ', romaji: 'a' },
      { kana: 'い', romaji: 'i' },
      { kana: 'う', romaji: 'u' },
      { kana: 'え', romaji: 'e' },
      { kana: 'お', romaji: 'o' },
      // K
      { kana: 'か', romaji: 'ka' },
      { kana: 'き', romaji: 'ki' },
      { kana: 'く', romaji: 'ku' },
      { kana: 'け', romaji: 'ke' },
      { kana: 'こ', romaji: 'ko' },
      // S
      { kana: 'さ', romaji: 'sa' },
      { kana: 'し', romaji: 'shi' },
      { kana: 'す', romaji: 'su' },
      { kana: 'せ', romaji: 'se' },
      { kana: 'そ', romaji: 'so' },
      // T
      { kana: 'た', romaji: 'ta' },
      { kana: 'ち', romaji: 'chi' },
      { kana: 'つ', romaji: 'tsu' },
      { kana: 'て', romaji: 'te' },
      { kana: 'と', romaji: 'to' },
      // N
      { kana: 'な', romaji: 'na' },
      { kana: 'に', romaji: 'ni' },
      { kana: 'ぬ', romaji: 'nu' },
      { kana: 'ね', romaji: 'ne' },
      { kana: 'の', romaji: 'no' },
      // H
      { kana: 'は', romaji: 'ha' },
      { kana: 'ひ', romaji: 'hi' },
      { kana: 'ふ', romaji: 'fu' },
      { kana: 'へ', romaji: 'he' },
      { kana: 'ほ', romaji: 'ho' },
      // M
      { kana: 'ま', romaji: 'ma' },
      { kana: 'み', romaji: 'mi' },
      { kana: 'む', romaji: 'mu' },
      { kana: 'め', romaji: 'me' },
      { kana: 'も', romaji: 'mo' },
      // Y
      { kana: 'や', romaji: 'ya' },
      { kana: 'ゆ', romaji: 'yu' },
      { kana: 'よ', romaji: 'yo' },
      // R
      { kana: 'ら', romaji: 'ra' },
      { kana: 'り', romaji: 'ri' },
      { kana: 'る', romaji: 'ru' },
      { kana: 'れ', romaji: 're' },
      { kana: 'ろ', romaji: 'ro' },
      // W
      { kana: 'わ', romaji: 'wa' },
      { kana: 'を', romaji: 'wo' },
      // N
      { kana: 'ん', romaji: 'n' }
    ];

    // Hiragana avec dakuten (゛) et handakuten (゜)
    this.hiraganaDakuten = [
      // G (ga-gyo)
      { kana: 'が', romaji: 'ga' },
      { kana: 'ぎ', romaji: 'gi' },
      { kana: 'ぐ', romaji: 'gu' },
      { kana: 'げ', romaji: 'ge' },
      { kana: 'ご', romaji: 'go' },
      // Z (za-zyo)
      { kana: 'ざ', romaji: 'za' },
      { kana: 'じ', romaji: 'ji', row: 'ligne Z (ざ, ぜ, ぞ)' },
      { kana: 'ず', romaji: 'zu', row: 'ligne Z (ざ, ぜ, ぞ)' },
      { kana: 'ぜ', romaji: 'ze' },
      { kana: 'ぞ', romaji: 'zo' },
      // D (da-do)
      { kana: 'だ', romaji: 'da' },
      { kana: 'ぢ', romaji: 'ji', row: 'ligne D (だ, で, ど)' },
      { kana: 'づ', romaji: 'zu', row: 'ligne D (だ, で, ど)' },
      { kana: 'で', romaji: 'de' },
      { kana: 'ど', romaji: 'do' },
      // B (ba-bo)
      { kana: 'ば', romaji: 'ba' },
      { kana: 'び', romaji: 'bi' },
      { kana: 'ぶ', romaji: 'bu' },
      { kana: 'べ', romaji: 'be' },
      { kana: 'ぼ', romaji: 'bo' },
      // P (pa-po) - handakuten
      { kana: 'ぱ', romaji: 'pa' },
      { kana: 'ぴ', romaji: 'pi' },
      { kana: 'ぷ', romaji: 'pu' },
      { kana: 'ぺ', romaji: 'pe' },
      { kana: 'ぽ', romaji: 'po' }
    ];

    // Katakana de base
    this.katakanaBase = [
      // Voyelles
      { kana: 'ア', romaji: 'a' },
      { kana: 'イ', romaji: 'i' },
      { kana: 'ウ', romaji: 'u' },
      { kana: 'エ', romaji: 'e' },
      { kana: 'オ', romaji: 'o' },
      // K
      { kana: 'カ', romaji: 'ka' },
      { kana: 'キ', romaji: 'ki' },
      { kana: 'ク', romaji: 'ku' },
      { kana: 'ケ', romaji: 'ke' },
      { kana: 'コ', romaji: 'ko' },
      // S
      { kana: 'サ', romaji: 'sa' },
      { kana: 'シ', romaji: 'shi' },
      { kana: 'ス', romaji: 'su' },
      { kana: 'セ', romaji: 'se' },
      { kana: 'ソ', romaji: 'so' },
      // T
      { kana: 'タ', romaji: 'ta' },
      { kana: 'チ', romaji: 'chi' },
      { kana: 'ツ', romaji: 'tsu' },
      { kana: 'テ', romaji: 'te' },
      { kana: 'ト', romaji: 'to' },
      // N
      { kana: 'ナ', romaji: 'na' },
      { kana: 'ニ', romaji: 'ni' },
      { kana: 'ヌ', romaji: 'nu' },
      { kana: 'ネ', romaji: 'ne' },
      { kana: 'ノ', romaji: 'no' },
      // H
      { kana: 'ハ', romaji: 'ha' },
      { kana: 'ヒ', romaji: 'hi' },
      { kana: 'フ', romaji: 'fu' },
      { kana: 'ヘ', romaji: 'he' },
      { kana: 'ホ', romaji: 'ho' },
      // M
      { kana: 'マ', romaji: 'ma' },
      { kana: 'ミ', romaji: 'mi' },
      { kana: 'ム', romaji: 'mu' },
      { kana: 'メ', romaji: 'me' },
      { kana: 'モ', romaji: 'mo' },
      // Y
      { kana: 'ヤ', romaji: 'ya' },
      { kana: 'ユ', romaji: 'yu' },
      { kana: 'ヨ', romaji: 'yo' },
      // R
      { kana: 'ラ', romaji: 'ra' },
      { kana: 'リ', romaji: 'ri' },
      { kana: 'ル', romaji: 'ru' },
      { kana: 'レ', romaji: 're' },
      { kana: 'ロ', romaji: 'ro' },
      // W
      { kana: 'ワ', romaji: 'wa' },
      { kana: 'ヲ', romaji: 'wo' },
      // N
      { kana: 'ン', romaji: 'n' }
    ];

    // Katakana avec dakuten
    this.katakanaDakuten = [
      // G
      { kana: 'ガ', romaji: 'ga' },
      { kana: 'ギ', romaji: 'gi' },
      { kana: 'グ', romaji: 'gu' },
      { kana: 'ゲ', romaji: 'ge' },
      { kana: 'ゴ', romaji: 'go' },
      // Z
      { kana: 'ザ', romaji: 'za' },
      { kana: 'ジ', romaji: 'ji', row: 'ligne Z (ザ, ゼ, ゾ)' },
      { kana: 'ズ', romaji: 'zu', row: 'ligne Z (ザ, ゼ, ゾ)' },
      { kana: 'ゼ', romaji: 'ze' },
      { kana: 'ゾ', romaji: 'zo' },
      // D
      { kana: 'ダ', romaji: 'da' },
      { kana: 'ヂ', romaji: 'ji', row: 'ligne D (ダ, デ, ド)' },
      { kana: 'ヅ', romaji: 'zu', row: 'ligne D (ダ, デ, ド)' },
      { kana: 'デ', romaji: 'de' },
      { kana: 'ド', romaji: 'do' },
      // B
      { kana: 'バ', romaji: 'ba' },
      { kana: 'ビ', romaji: 'bi' },
      { kana: 'ブ', romaji: 'bu' },
      { kana: 'ベ', romaji: 'be' },
      { kana: 'ボ', romaji: 'bo' },
      // P
      { kana: 'パ', romaji: 'pa' },
      { kana: 'ピ', romaji: 'pi' },
      { kana: 'プ', romaji: 'pu' },
      { kana: 'ペ', romaji: 'pe' },
      { kana: 'ポ', romaji: 'po' }
    ];
  }

  /**
   * Génère les cartes pour un ensemble de kana
   * @param {Object[]} kanaList - Liste de kana
   * @param {string} type - Type (hiragana/katakana)
   * @returns {Object[]} Cartes
   */
  generateKanaCards(kanaList, type) {
    const cards = [];
    const prefix = type === 'hiragana' ? 'hira' : 'kata';

    for (const { kana, romaji, row } of kanaList) {
      // Utiliser le code Unicode du kana pour garantir l'unicité
      const kanaCode = kana.charCodeAt(0).toString(16);

      // Kana → Romaji
      cards.push({
        id: `${prefix}_${kanaCode}_to_romaji`,
        question: `Comment se lit "${kana}" ?`,
        answer: romaji,
        feedback: `${kana} se lit "${romaji}"`
      });

      // Romaji → Kana
      // « ji » (じ/ぢ) et « zu » (ず/づ) se prononcent pareil : la question précise la ligne du kana
      cards.push({
        id: `${prefix}_${kanaCode}_from_romaji`,
        question: row ? `Écrivez "${romaji}" en ${type}, ${row} :` : `Écrivez "${romaji}" en ${type} :`,
        answer: kana,
        feedback: row ? `"${romaji}" s'écrit ${kana} en ${type} (${row})` : `"${romaji}" s'écrit ${kana} en ${type}`
      });
    }

    return cards;
  }

  /**
   * Génère le deck hiragana de base
   */
  buildHiraganaBaseDeck() {
    return {
      name: 'Hiragana - Base (46 caractères)',
      description: 'Les 46 hiragana de base du syllabaire japonais',
      tags: ['langues', 'japonais', 'hiragana', 'ja-hiragana', 'alphabet', 'autodidacte'],
      settings: {
        sequential: true, // Ordre traditionnel recommandé pour l'apprentissage
        bidirectional: false
      },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'hiragana-base' }
        }
      },
      cards: this.generateKanaCards(this.hiraganaBase, 'hiragana')
    };
  }

  /**
   * Génère le deck hiragana avec dakuten
   */
  buildHiraganaDakutenDeck() {
    return {
      name: 'Hiragana - Dakuten (25 caractères)',
      description: 'Hiragana avec dakuten (゛) et handakuten (゜)',
      tags: ['langues', 'japonais', 'hiragana', 'ja-hiragana', 'alphabet', 'autodidacte'],
      settings: {
        sequential: true,
        bidirectional: false
      },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'hiragana-dakuten' }
        }
      },
      cards: this.generateKanaCards(this.hiraganaDakuten, 'hiragana')
    };
  }

  /**
   * Génère le deck katakana de base
   */
  buildKatakanaBaseDeck() {
    return {
      name: 'Katakana - Base (46 caractères)',
      description: 'Les 46 katakana de base du syllabaire japonais',
      tags: ['langues', 'japonais', 'katakana', 'ja-katakana', 'alphabet', 'autodidacte'],
      settings: {
        sequential: true,
        bidirectional: false
      },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'katakana-base' }
        }
      },
      cards: this.generateKanaCards(this.katakanaBase, 'katakana')
    };
  }

  /**
   * Génère le deck katakana avec dakuten
   */
  buildKatakanaDakutenDeck() {
    return {
      name: 'Katakana - Dakuten (25 caractères)',
      description: 'Katakana avec dakuten (゛) et handakuten (゜)',
      tags: ['langues', 'japonais', 'katakana', 'ja-katakana', 'alphabet', 'autodidacte'],
      settings: {
        sequential: true,
        bidirectional: false
      },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'katakana-dakuten' }
        }
      },
      cards: this.generateKanaCards(this.katakanaDakuten, 'katakana')
    };
  }

  /**
   * Override: Génère plusieurs decks
   */
  buildDecks(options = {}) {
    return [
      this.buildHiraganaBaseDeck(),
      this.buildHiraganaDakutenDeck(),
      this.buildKatakanaBaseDeck(),
      this.buildKatakanaDakutenDeck()
    ];
  }

  /**
   * Génère toutes les cartes
   */
  generate(options = {}) {
    return [
      ...this.generateKanaCards(this.hiraganaBase, 'hiragana'),
      ...this.generateKanaCards(this.hiraganaDakuten, 'hiragana'),
      ...this.generateKanaCards(this.katakanaBase, 'katakana'),
      ...this.generateKanaCards(this.katakanaDakuten, 'katakana')
    ];
  }
}

module.exports = JapaneseKanaGenerator;
