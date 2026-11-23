/**
 * Générateur des unités SI
 *
 * Génère des decks pour :
 * - Unités de base du SI (7 unités)
 * - Préfixes SI (kilo, méga, milli, micro, etc.)
 * - Unités dérivées courantes
 * - Conversions d'unités
 *
 * Niveau: collège (4e-3e) et lycée
 */

const BaseGenerator = require('../base-generator.cjs');

// Accords français : genre et élision (voyelle ou h muet)
const FEMININE_UNITS = new Set(['seconde', 'mole', 'candela']);
const VOWEL_START = /^[aeiouyhâàéèêëîïôöûùœ]/i;
const ASPIRATED_H = new Set(['hertz']);

function startsWithVowelSound(word) {
  return VOWEL_START.test(word) && !ASPIRATED_H.has(word.toLowerCase());
}

/** Article défini + nom : "le mètre", "la seconde", "l'ampère" */
function withDefinite(unit) {
  if (startsWithVowelSound(unit)) return `l'${unit}`;
  return `${FEMININE_UNITS.has(unit) ? 'la' : 'le'} ${unit}`;
}

/** "du mètre", "de la seconde", "de l'ampère" */
function withPartitive(unit) {
  if (startsWithVowelSound(unit)) return `de l'${unit}`;
  return `${FEMININE_UNITS.has(unit) ? 'de la' : 'du'} ${unit}`;
}

/** "de longueur", "d'énergie" */
function deQuantity(quantity) {
  const q = quantity.toLowerCase();
  return `${startsWithVowelSound(q) ? "d'" : 'de '}${q}`;
}

class SIUnitsGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'si-units',
      name: 'Unités SI',
      tags: ['sciences', 'sciences-physiques', 'physique', 'unites', 'SI'],
      version: '1.0.0',
      description: 'Système international d\'unités'
    });

    // Les 7 unités de base du SI
    this.baseUnits = [
      { quantity: 'Longueur', unit: 'mètre', symbol: 'm' },
      { quantity: 'Masse', unit: 'kilogramme', symbol: 'kg' },
      { quantity: 'Temps', unit: 'seconde', symbol: 's' },
      { quantity: 'Courant électrique', unit: 'ampère', symbol: 'A' },
      { quantity: 'Température', unit: 'kelvin', symbol: 'K' },
      { quantity: 'Quantité de matière', unit: 'mole', symbol: 'mol' },
      { quantity: 'Intensité lumineuse', unit: 'candela', symbol: 'cd' }
    ];

    // Préfixes SI
    this.prefixes = [
      { prefix: 'téra', symbol: 'T', power: 12 },
      { prefix: 'giga', symbol: 'G', power: 9 },
      { prefix: 'méga', symbol: 'M', power: 6 },
      { prefix: 'kilo', symbol: 'k', power: 3 },
      { prefix: 'hecto', symbol: 'h', power: 2 },
      { prefix: 'déca', symbol: 'da', power: 1 },
      { prefix: 'déci', symbol: 'd', power: -1 },
      { prefix: 'centi', symbol: 'c', power: -2 },
      { prefix: 'milli', symbol: 'm', power: -3 },
      { prefix: 'micro', symbol: 'μ', power: -6 },
      { prefix: 'nano', symbol: 'n', power: -9 },
      { prefix: 'pico', symbol: 'p', power: -12 }
    ];

    // Unités dérivées courantes
    this.derivedUnits = [
      { quantity: 'Force', unit: 'newton', symbol: 'N', base: 'kg·m/s²' },
      { quantity: 'Énergie', unit: 'joule', symbol: 'J', base: 'kg·m²/s²' },
      { quantity: 'Puissance', unit: 'watt', symbol: 'W', base: 'J/s' },
      { quantity: 'Pression', unit: 'pascal', symbol: 'Pa', base: 'N/m²' },
      { quantity: 'Fréquence', unit: 'hertz', symbol: 'Hz', base: 's⁻¹' },
      { quantity: 'Charge électrique', unit: 'coulomb', symbol: 'C', base: 'A·s' },
      { quantity: 'Tension électrique', unit: 'volt', symbol: 'V', base: 'W/A' },
      { quantity: 'Résistance', unit: 'ohm', symbol: 'Ω', base: 'V/A' },
      { quantity: 'Capacité', unit: 'farad', symbol: 'F', base: 'C/V' }
    ];
  }

  /**
   * Génère les cartes des unités de base
   */
  generateBaseUnitsCards() {
    const cards = [];

    for (const { quantity, unit, symbol } of this.baseUnits) {
      // Grandeur → Unité
      cards.push({
        id: `si_base_${symbol}_qty_to_unit`,
        question: `Quelle est l'unité SI ${deQuantity(quantity)} ?`,
        answer: unit,
        alternatives: [symbol],
        feedback: `L'unité SI ${deQuantity(quantity)} est ${withDefinite(unit)} (${symbol}).`
      });

      // Unité → Symbole
      cards.push({
        id: `si_base_${symbol}_unit_to_sym`,
        question: `Quel est le symbole ${withPartitive(unit)} ?`,
        answer: symbol,
        feedback: `Le symbole ${withPartitive(unit)} est ${symbol}.`
      });

      // Symbole → Grandeur
      cards.push({
        id: `si_base_${symbol}_sym_to_qty`,
        question: `Le ${symbol} est l'unité de quelle grandeur ?`,
        answer: quantity,
        feedback: `Le ${symbol} (${unit}) mesure ${quantity.toLowerCase()}.`
      });
    }

    return cards;
  }

  /**
   * Génère les cartes des préfixes SI
   */
  generatePrefixCards() {
    const cards = [];

    // « M » (méga) et « m » (milli) ne diffèrent que par la casse : on la précise dans l'énoncé
    const caseHint = sym => {
      const clash = this.prefixes.some(p => p.symbol !== sym && p.symbol.toLowerCase() === sym.toLowerCase());
      if (!clash) return '';
      return sym === sym.toUpperCase() ? ' (majuscule)' : ' (minuscule)';
    };

    for (const { prefix, symbol, power } of this.prefixes) {
      const powerNotation = power >= 0 ? `10^${power}` : `10^(${power})`;
      const valueStr = Math.pow(10, power).toExponential();

      // Préfixe → Puissance
      cards.push({
        id: `si_prefix_${symbol}_to_power`,
        question: `Le préfixe "${prefix}" correspond à 10 puissance combien ?`,
        answer: String(power),
        feedback: `${prefix} (${symbol}) = 10^${power}`
      });

      // Symbole → Préfixe
      cards.push({
        id: `si_prefix_${symbol}_sym_to_name`,
        question: `Quel préfixe correspond au symbole "${symbol}"${caseHint(symbol)} ?`,
        answer: prefix,
        feedback: `${symbol} = ${prefix} = 10^${power}`
      });

      // Préfixe → Symbole
      cards.push({
        id: `si_prefix_${symbol}_name_to_sym`,
        question: `Quel est le symbole du préfixe "${prefix}"${caseHint(symbol) ? ' (respecter la casse)' : ''} ?`,
        answer: symbol,
        feedback: `${prefix} → ${symbol} = 10^${power}`
      });
    }

    return cards;
  }

  /**
   * Génère les cartes des unités dérivées
   */
  generateDerivedUnitsCards() {
    const cards = [];

    for (const { quantity, unit, symbol, base } of this.derivedUnits) {
      // Grandeur → Unité
      cards.push({
        id: `si_derived_${symbol}_qty_to_unit`,
        question: `Quelle est l'unité ${deQuantity(quantity)} ?`,
        answer: unit,
        alternatives: [symbol],
        feedback: `L'unité ${deQuantity(quantity)} est ${withDefinite(unit)} (${symbol} = ${base}).`
      });

      // Unité → Symbole
      cards.push({
        id: `si_derived_${symbol}_unit_to_sym`,
        question: `Quel est le symbole ${withPartitive(unit)} ?`,
        answer: symbol,
        feedback: `${unit} → ${symbol}`
      });

      // Symbole → Unité
      cards.push({
        id: `si_derived_${symbol}_sym_to_unit`,
        question: `${symbol} est le symbole de quelle unité ?`,
        answer: unit,
        feedback: `${symbol} = ${unit} (${quantity.toLowerCase()})`
      });
    }

    return cards;
  }

  /**
   * Génère le deck des unités de base
   */
  buildBaseUnitsDeck() {
    return {
      name: 'Unités SI - Unités de base',
      description: 'Les 7 unités de base du Système International',
      tags: ['sciences', 'sciences-physiques', 'physique', 'unites', 'SI', 'quatrieme'],
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
          parameters: { type: 'base-units' }
        }
      },
      cards: this.generateBaseUnitsCards()
    };
  }

  /**
   * Génère le deck des préfixes SI
   */
  buildPrefixesDeck() {
    return {
      name: 'Unités SI - Préfixes',
      description: 'Préfixes multiplicateurs du SI (kilo, méga, milli, etc.)',
      tags: ['sciences', 'sciences-physiques', 'physique', 'unites', 'SI', 'cinquieme'],
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
          parameters: { type: 'prefixes' }
        }
      },
      cards: this.generatePrefixCards()
    };
  }

  /**
   * Génère le deck des unités dérivées
   */
  buildDerivedUnitsDeck() {
    return {
      name: 'Unités SI - Unités dérivées',
      description: 'Unités dérivées courantes (newton, joule, watt, etc.)',
      tags: ['sciences', 'sciences-physiques', 'physique', 'unites', 'SI', 'seconde'],
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
          parameters: { type: 'derived-units' }
        }
      },
      cards: this.generateDerivedUnitsCards()
    };
  }

  /**
   * Override: Génère plusieurs decks
   */
  buildDecks(options = {}) {
    return [
      this.buildBaseUnitsDeck(),
      this.buildPrefixesDeck(),
      this.buildDerivedUnitsDeck()
    ];
  }

  /**
   * Génère toutes les cartes
   */
  generate(options = {}) {
    return [
      ...this.generateBaseUnitsCards(),
      ...this.generatePrefixCards(),
      ...this.generateDerivedUnitsCards()
    ];
  }
}

module.exports = SIUnitsGenerator;
