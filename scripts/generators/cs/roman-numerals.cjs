/**
 * Générateur de chiffres romains
 *
 * Génère des decks pour :
 * - Conversion arabe → romain (1-100, puis 1-1000)
 * - Conversion romain → arabe
 * - Symboles de base (I, V, X, L, C, D, M)
 *
 * Niveau: CE2-CM1 (1-100), collège (1-1000)
 */

const BaseGenerator = require('../base-generator.cjs');

class RomanNumeralsGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'roman-numerals',
      name: 'Chiffres romains',
      tags: ['sciences', 'maths', 'arithmetique', 'chiffres-romains', 'numeration'],
      version: '1.0.0',
      description: 'Conversion entre chiffres arabes et romains'
    });

    // Valeurs de base pour la conversion
    this.romanValues = [
      { value: 1000, symbol: 'M' },
      { value: 900, symbol: 'CM' },
      { value: 500, symbol: 'D' },
      { value: 400, symbol: 'CD' },
      { value: 100, symbol: 'C' },
      { value: 90, symbol: 'XC' },
      { value: 50, symbol: 'L' },
      { value: 40, symbol: 'XL' },
      { value: 10, symbol: 'X' },
      { value: 9, symbol: 'IX' },
      { value: 5, symbol: 'V' },
      { value: 4, symbol: 'IV' },
      { value: 1, symbol: 'I' }
    ];
  }

  /**
   * Convertit un nombre en chiffres romains
   * @param {number} num - Nombre à convertir
   * @returns {string} Représentation romaine
   */
  toRoman(num) {
    let result = '';
    let remaining = num;

    for (const { value, symbol } of this.romanValues) {
      while (remaining >= value) {
        result += symbol;
        remaining -= value;
      }
    }

    return result;
  }

  /**
   * Génère les cartes des symboles de base
   * @returns {Object[]} Cartes
   */
  generateBaseSymbolsCards() {
    const baseSymbols = [
      { symbol: 'I', value: 1 },
      { symbol: 'V', value: 5 },
      { symbol: 'X', value: 10 },
      { symbol: 'L', value: 50 },
      { symbol: 'C', value: 100 },
      { symbol: 'D', value: 500 },
      { symbol: 'M', value: 1000 }
    ];

    const cards = [];

    for (const { symbol, value } of baseSymbols) {
      // Symbole → Valeur
      cards.push({
        id: `roman_sym_${symbol}_to_val`,
        question: `Quelle est la valeur du symbole romain ${symbol} ?`,
        answer: String(value),
        feedback: `${symbol} = ${value}`
      });

      // Valeur → Symbole
      cards.push({
        id: `roman_val_${value}_to_sym`,
        question: `Quel symbole romain représente ${value} ?`,
        answer: symbol,
        feedback: `${value} = ${symbol}`
      });
    }

    return cards;
  }

  /**
   * Génère les cartes de conversion pour une plage
   * @param {number} start - Début de la plage
   * @param {number} end - Fin de la plage
   * @param {number} step - Pas (1 par défaut)
   * @returns {Object[]} Cartes
   */
  generateConversionCards(start, end, step = 1) {
    const cards = [];

    for (let n = start; n <= end; n += step) {
      const roman = this.toRoman(n);

      // Arabe → Romain
      cards.push({
        id: `roman_${n}_to_roman`,
        question: `${n} en chiffres romains ?`,
        answer: roman,
        feedback: `${n} = ${roman}`
      });

      // Romain → Arabe
      cards.push({
        id: `roman_${n}_from_roman`,
        question: `${roman} en chiffres arabes ?`,
        answer: String(n),
        feedback: `${roman} = ${n}`
      });
    }

    return cards;
  }

  /**
   * Génère le deck des symboles de base
   */
  buildSymbolsDeck() {
    return {
      name: 'Chiffres romains - Symboles',
      description: 'Les 7 symboles de base (I, V, X, L, C, D, M)',
      tags: ['sciences', 'maths', 'arithmetique', 'chiffres-romains', 'numeration', 'ce2'],
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
          parameters: { type: 'symbols' }
        }
      },
      cards: this.generateBaseSymbolsCards()
    };
  }

  /**
   * Génère le deck 1-20
   */
  buildBasicsDeck() {
    return {
      name: 'Chiffres romains - 1 à 20',
      description: 'Conversion arabe ↔ romain pour 1 à 20',
      tags: ['sciences', 'maths', 'arithmetique', 'chiffres-romains', 'numeration', 'cm1'],
      settings: {
        sequential: false,
        bidirectional: false
      },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'basics' }
        }
      },
      cards: this.generateConversionCards(1, 20)
    };
  }

  /**
   * Génère le deck 1-100 (nombres clés)
   */
  buildIntermediateDeck() {
    // Nombres représentatifs pour 1-100
    const numbers = [
      ...Array.from({ length: 20 }, (_, i) => i + 1), // 1-20
      25, 30, 35, 40, 45, 50, // Dizaines et demi-dizaines
      55, 60, 65, 70, 75, 80, 85, 90, 95, 100
    ];

    const cards = [];
    for (const n of numbers) {
      const roman = this.toRoman(n);
      cards.push({
        id: `roman_int_${n}_to_roman`,
        question: `${n} en chiffres romains ?`,
        answer: roman
      });
      cards.push({
        id: `roman_int_${n}_from_roman`,
        question: `${roman} en chiffres arabes ?`,
        answer: String(n)
      });
    }

    return {
      name: 'Chiffres romains - 1 à 100',
      description: 'Nombres clés de 1 à 100 en chiffres romains',
      tags: ['sciences', 'maths', 'arithmetique', 'chiffres-romains', 'numeration', 'cm2'],
      settings: {
        sequential: false,
        bidirectional: false
      },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'intermediate' }
        }
      },
      cards
    };
  }

  /**
   * Génère le deck des siècles et dates
   */
  buildCenturiesDeck() {
    const centuries = [];
    for (let c = 1; c <= 21; c++) {
      centuries.push({
        century: c,
        roman: this.toRoman(c),
        ordinal: c === 1 ? '1er' : `${c}e`
      });
    }

    const cards = [];

    for (const { century, roman, ordinal } of centuries) {
      // Siècle → Romain
      cards.push({
        id: `roman_century_${century}_to_roman`,
        question: `${ordinal} siècle en chiffres romains ?`,
        answer: roman,
        feedback: `Le ${ordinal} siècle s'écrit ${roman}.`
      });

      // Romain → Siècle
      cards.push({
        id: `roman_century_${century}_from_roman`,
        question: `Siècle ${roman} en nombre ?`,
        answer: String(century),
        alternatives: [ordinal],
        feedback: `${roman} = ${ordinal} siècle.`
      });
    }

    // Quelques dates historiques importantes
    const dates = [
      { year: 1789, event: 'Révolution française' },
      { year: 1945, event: 'Fin WWII' },
      { year: 2000, event: 'An 2000' },
      { year: 1515, event: 'Bataille de Marignan' },
      { year: 1492, event: 'Découverte Amérique' }
    ];

    for (const { year, event } of dates) {
      const roman = this.toRoman(year);
      cards.push({
        id: `roman_date_${year}`,
        question: `${year} en chiffres romains ?`,
        answer: roman,
        feedback: `${year} (${event}) = ${roman}`
      });
    }

    return {
      name: 'Chiffres romains - Siècles et dates',
      description: 'Siècles (I à XXI) et dates historiques',
      tags: ['sciences', 'maths', 'arithmetique', 'chiffres-romains', 'histoire', 'sixieme'],
      settings: {
        sequential: false,
        bidirectional: false
      },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'centuries' }
        }
      },
      cards
    };
  }

  /**
   * Override: Génère plusieurs decks
   */
  buildDecks(options = {}) {
    return [
      this.buildSymbolsDeck(),
      this.buildBasicsDeck(),
      this.buildIntermediateDeck(),
      this.buildCenturiesDeck()
    ];
  }

  /**
   * Génère toutes les cartes
   */
  generate(options = {}) {
    return [
      ...this.generateBaseSymbolsCards(),
      ...this.generateConversionCards(1, 100)
    ];
  }
}

module.exports = RomanNumeralsGenerator;
