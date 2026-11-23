/**
 * Générateur de l'alphabet grec
 *
 * Génère des decks pour :
 * - Lettres grecques (24 lettres)
 * - Majuscules et minuscules
 * - Usage en mathématiques et sciences
 *
 * Niveau: seconde (pour les sciences)
 */

const BaseGenerator = require('../base-generator.cjs');

class GreekAlphabetGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'greek-alphabet',
      name: 'Alphabet grec',
      tags: ['langues', 'grec', 'alphabet', 'sciences'],
      version: '1.0.0',
      description: 'Les 24 lettres de l\'alphabet grec'
    });

    // Alphabet grec complet
    this.letters = [
      { upper: 'Α', lower: 'α', name: 'alpha', nameEn: 'alpha', usage: 'angles, coefficients' },
      { upper: 'Β', lower: 'β', name: 'bêta', nameEn: 'beta', usage: 'angles, coefficients' },
      { upper: 'Γ', lower: 'γ', name: 'gamma', nameEn: 'gamma', usage: 'angles, facteur de Lorentz' },
      { upper: 'Δ', lower: 'δ', name: 'delta', nameEn: 'delta', usage: 'variation, différence' },
      { upper: 'Ε', lower: 'ε', name: 'epsilon', nameEn: 'epsilon', usage: 'petites quantités, permittivité' },
      { upper: 'Ζ', lower: 'ζ', name: 'zêta', nameEn: 'zeta', usage: 'fonction zêta de Riemann' },
      { upper: 'Η', lower: 'η', name: 'êta', nameEn: 'eta', usage: 'rendement, viscosité' },
      { upper: 'Θ', lower: 'θ', name: 'thêta', nameEn: 'theta', usage: 'angles' },
      { upper: 'Ι', lower: 'ι', name: 'iota', nameEn: 'iota', usage: 'petite quantité' },
      { upper: 'Κ', lower: 'κ', name: 'kappa', nameEn: 'kappa', usage: 'constante' },
      { upper: 'Λ', lower: 'λ', name: 'lambda', nameEn: 'lambda', usage: 'longueur d\'onde, fonction anonyme' },
      { upper: 'Μ', lower: 'μ', name: 'mu', nameEn: 'mu', usage: 'coefficient de frottement, micro-' },
      { upper: 'Ν', lower: 'ν', name: 'nu', nameEn: 'nu', usage: 'fréquence' },
      { upper: 'Ξ', lower: 'ξ', name: 'xi', nameEn: 'xi', usage: 'variable' },
      { upper: 'Ο', lower: 'ο', name: 'omicron', nameEn: 'omicron', usage: 'notation asymptotique' },
      { upper: 'Π', lower: 'π', name: 'pi', nameEn: 'pi', usage: 'nombre pi (3.14159...)' },
      { upper: 'Ρ', lower: 'ρ', name: 'rhô', nameEn: 'rho', usage: 'densité, résistivité' },
      { upper: 'Σ', lower: 'σ', name: 'sigma', nameEn: 'sigma', usage: 'somme, écart-type' },
      { upper: 'Τ', lower: 'τ', name: 'tau', nameEn: 'tau', usage: 'temps, contrainte' },
      { upper: 'Υ', lower: 'υ', name: 'upsilon', nameEn: 'upsilon', usage: 'vitesse' },
      { upper: 'Φ', lower: 'φ', name: 'phi', nameEn: 'phi', usage: 'flux, nombre d\'or' },
      { upper: 'Χ', lower: 'χ', name: 'khi', nameEn: 'chi', usage: 'test du khi-deux' },
      { upper: 'Ψ', lower: 'ψ', name: 'psi', nameEn: 'psi', usage: 'fonction d\'onde' },
      { upper: 'Ω', lower: 'ω', name: 'oméga', nameEn: 'omega', usage: 'ohm (Ω), vitesse angulaire (ω)' }
    ];
  }

  /**
   * Génère les cartes pour les lettres
   * @returns {Object[]} Cartes
   */
  generateLetterCards() {
    const cards = [];

    for (const letter of this.letters) {
      // Nom → Lettre minuscule
      cards.push({
        id: `greek_${letter.nameEn}_name_to_lower`,
        question: `Quelle est la lettre grecque "${letter.name}" (minuscule) ?`,
        answer: letter.lower,
        feedback: `${letter.name} : ${letter.upper} (majuscule), ${letter.lower} (minuscule)`
      });

      // Lettre minuscule → Nom
      cards.push({
        id: `greek_${letter.nameEn}_lower_to_name`,
        question: `Comment s'appelle la lettre "${letter.lower}" ?`,
        answer: letter.name,
        alternatives: [letter.nameEn],
        feedback: `${letter.lower} est la lettre ${letter.name} (${letter.nameEn})`
      });

      // Nom → Lettre majuscule
      cards.push({
        id: `greek_${letter.nameEn}_name_to_upper`,
        question: `Quelle est la lettre grecque "${letter.name}" (majuscule) ?`,
        answer: letter.upper,
        feedback: `${letter.name} : ${letter.upper} (majuscule), ${letter.lower} (minuscule)`
      });

      // Minuscule ↔ Majuscule
      cards.push({
        id: `greek_${letter.nameEn}_lower_to_upper`,
        question: `Majuscule de ${letter.lower} ?`,
        answer: letter.upper,
        feedback: `${letter.lower} → ${letter.upper} (${letter.name})`
      });
    }

    return cards;
  }

  /**
   * Génère les cartes pour les usages en sciences
   * @returns {Object[]} Cartes
   */
  generateUsageCards() {
    const cards = [];

    // Lettres les plus utilisées en sciences
    const scienceLetters = this.letters.filter(l =>
      ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'theta', 'lambda', 'mu', 'pi', 'sigma', 'phi', 'omega'].includes(l.nameEn)
    );

    for (const letter of scienceLetters) {
      cards.push({
        id: `greek_usage_${letter.nameEn}`,
        question: `La lettre ${letter.lower} (${letter.name}) est utilisée pour représenter quoi ?`,
        answer: letter.usage,
        feedback: `${letter.lower} (${letter.name}) : ${letter.usage}`
      });
    }

    return cards;
  }

  /**
   * Génère le deck des lettres
   */
  buildLettersDeck() {
    return {
      name: 'Alphabet grec - Lettres',
      description: 'Les 24 lettres de l\'alphabet grec',
      tags: ['langues', 'grec', 'alphabet', 'grc-alphabet'],
      settings: {
        sequential: true, // Ordre alphabétique
        bidirectional: false
      },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'letters' }
        }
      },
      cards: this.generateLetterCards()
    };
  }

  /**
   * Génère le deck des usages scientifiques
   */
  buildScienceUsageDeck() {
    return {
      name: 'Alphabet grec - Usage scientifique',
      description: 'Usage des lettres grecques en mathématiques et physique',
      tags: ['langues', 'grec', 'alphabet', 'grc-alphabet', 'sciences', 'maths'],
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
          parameters: { type: 'science-usage' }
        }
      },
      cards: this.generateUsageCards()
    };
  }

  /**
   * Override: Génère plusieurs decks
   */
  buildDecks(options = {}) {
    return [
      this.buildLettersDeck(),
      this.buildScienceUsageDeck()
    ];
  }

  /**
   * Génère toutes les cartes
   */
  generate(options = {}) {
    return [
      ...this.generateLetterCards(),
      ...this.generateUsageCards()
    ];
  }
}

module.exports = GreekAlphabetGenerator;
