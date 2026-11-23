/**
 * Générateur de calculs sur les fractions
 *
 * Génère des decks pour :
 * - Fractions simples (équivalences)
 * - Additions de fractions (même dénominateur)
 * - Soustractions de fractions
 * - Multiplications de fractions
 * - Divisions de fractions
 *
 * Niveau: CM1 à 3ème
 */

const BaseGenerator = require('../base-generator.cjs');

class FractionsGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'fractions',
      name: 'Calculs sur les fractions',
      tags: ['math', 'fractions', 'calcul-mental', 'arithmetique'],
      version: '1.0.0',
      description: 'Opérations sur les fractions'
    });

    // Ressources pédagogiques communes
    this.commonResources = [
      this.createSummary(
        'Qu\'est-ce qu\'une fraction ?',
        `Une **fraction** représente une partie d'un tout. Elle s'écrit sous la forme a/b où :
- **a** est le numérateur (nombre de parts prises)
- **b** est le dénominateur (nombre total de parts)

Par exemple : **3/4** signifie 3 parts sur 4 au total.

Les fractions sont utilisées pour :
- Exprimer des proportions
- Représenter des divisions
- Calculer des pourcentages`,
        true
      ),
      this.createWikipediaLink('Fraction', 'Fraction_(mathématiques)'),
      this.createGlossary({
        'Fraction': 'Nombre qui représente une partie d\'un tout (a/b)',
        'Numérateur': 'Nombre au-dessus de la barre de fraction',
        'Dénominateur': 'Nombre en-dessous de la barre de fraction',
        'Fraction irréductible': 'Fraction simplifiée au maximum',
        'Fractions équivalentes': 'Fractions représentant le même nombre (1/2 = 2/4)',
        'PGCD': 'Plus Grand Commun Diviseur (pour simplifier)'
      })
    ];
  }

  /**
   * Génère un SVG représentant une fraction (camembert)
   * @param {number} numerator - Numérateur
   * @param {number} denominator - Dénominateur
   * @returns {Object|null} Objet media ou null
   */
  generateFractionSvg(numerator, denominator) {
    if (denominator > 12 || denominator < 1 || numerator > denominator) {
      return null;
    }

    const size = 60;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 5;

    let svg = '';

    // Dessiner les parts
    for (let i = 0; i < denominator; i++) {
      const startAngle = (i / denominator) * 2 * Math.PI - Math.PI / 2;
      const endAngle = ((i + 1) / denominator) * 2 * Math.PI - Math.PI / 2;

      const x1 = cx + radius * Math.cos(startAngle);
      const y1 = cy + radius * Math.sin(startAngle);
      const x2 = cx + radius * Math.cos(endAngle);
      const y2 = cy + radius * Math.sin(endAngle);

      const largeArc = (endAngle - startAngle > Math.PI) ? 1 : 0;
      const isFilled = i < numerator;

      const pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      svg += `<path d="${pathD}" fill="${isFilled ? '#8b5cf6' : '#e2e8f0'}" stroke="#64748b" stroke-width="1"/>`;
    }

    return {
      type: 'image',
      format: 'svg',
      data: `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`
    };
  }

  /**
   * Simplifie une fraction
   */
  simplify(num, den) {
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const divisor = gcd(Math.abs(num), Math.abs(den));
    return { num: num / divisor, den: den / divisor };
  }

  /**
   * Formate une fraction en texte
   */
  formatFraction(num, den) {
    if (den === 1) return String(num);
    if (num === 0) return '0';
    return `${num}/${den}`;
  }

  // ═══════════════════════════════════════════════════════════════
  // ÉQUIVALENCES DE FRACTIONS
  // ═══════════════════════════════════════════════════════════════

  generateEquivalences() {
    const cards = [];
    const baseFractions = [
      [1, 2], [1, 3], [2, 3], [1, 4], [3, 4],
      [1, 5], [2, 5], [3, 5], [4, 5],
      [1, 6], [5, 6]
    ];

    baseFractions.forEach(([num, den]) => {
      // Générer 2-3 équivalences par fraction
      for (let mult = 2; mult <= 4; mult++) {
        const newNum = num * mult;
        const newDen = den * mult;
        if (newDen <= 12) {
          const card = {
            id: `frac_equiv_${newNum}_${newDen}`,
            question: `Simplifier ${newNum}/${newDen}`,
            answer: this.formatFraction(num, den),
            feedback: `${newNum}/${newDen} = ${num}/${den} (÷ ${mult})`
          };
          const media = this.generateFractionSvg(num, den);
          if (media) card.media = media;
          cards.push(card);
        }
      }
    });

    return cards;
  }

  buildEquivalencesDeck() {
    const deckResources = [
      ...this.commonResources,
      this.createSummary(
        'Fractions équivalentes',
        `Deux fractions sont **équivalentes** si elles représentent le même nombre.

Pour simplifier une fraction, on divise le numérateur et le dénominateur par leur PGCD.

Par exemple : 4/8 = 2/4 = 1/2 (toutes représentent la moitié)`,
        true
      ),
      this.createObjectives([
        'Reconnaître les fractions équivalentes',
        'Simplifier une fraction',
        'Trouver le PGCD pour simplifier'
      ])
    ];

    return {
      name: 'Fractions équivalentes',
      description: 'Simplifier des fractions',
      tags: ['math', 'fractions', 'calcul-mental', 'cm2', 'sixieme'],
      category: ['sciences', 'maths', 'arithmetique', 'fractions'],
      settings: { sequential: false, bidirectional: false },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'equivalences' }
        }
      },
      resources: deckResources,
      cards: this.generateEquivalences()
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // ADDITIONS DE FRACTIONS (MÊME DÉNOMINATEUR)
  // ═══════════════════════════════════════════════════════════════

  generateAdditionsSameDenom() {
    const cards = [];
    const denoms = [2, 3, 4, 5, 6, 8, 10];

    denoms.forEach(den => {
      for (let a = 1; a < den; a++) {
        for (let b = 1; b < den && a + b <= den; b++) {
          const resultNum = a + b;
          const simplified = this.simplify(resultNum, den);

          cards.push({
            id: `frac_add_${a}_${den}_${b}_${den}`,
            question: `${a}/${den} + ${b}/${den} = ?`,
            answer: this.formatFraction(simplified.num, simplified.den),
            alternatives: [
              this.formatFraction(simplified.num, simplified.den),
              this.formatFraction(resultNum, den)
            ],
            feedback: `${a}/${den} + ${b}/${den} = ${resultNum}/${den}${simplified.den !== den ? ` = ${simplified.num}/${simplified.den}` : ''}`
          });
        }
      }
    });

    // Toutes les cartes, dans l'ordre croissant (dénominateur, puis a, puis b)
    return cards;
  }

  buildAdditionsDeck() {
    const deckResources = [
      ...this.commonResources,
      this.createSummary(
        'Addition de fractions',
        `Pour additionner des fractions de **même dénominateur**, on additionne les numérateurs et on garde le même dénominateur.

Exemple : 2/5 + 1/5 = 3/5

⚠️ On n'additionne JAMAIS les dénominateurs !`,
        true
      ),
      this.createObjectives([
        'Additionner des fractions de même dénominateur',
        'Simplifier le résultat si possible',
        'Ne pas confondre avec l\'addition des dénominateurs'
      ]),
      this.createTip(
        'Méthode',
        `Pour a/d + b/d :
1. Vérifier que les dénominateurs sont égaux
2. Additionner les numérateurs : (a + b)
3. Garder le même dénominateur : d
4. Simplifier si possible`
      )
    ];

    return {
      name: 'Addition de fractions',
      description: 'Additionner des fractions de même dénominateur',
      tags: ['math', 'fractions', 'calcul-mental', 'cm2', 'sixieme'],
      category: ['sciences', 'maths', 'arithmetique', 'fractions'],
      settings: { sequential: false, bidirectional: false, maxCards: 20 },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'additions' }
        }
      },
      resources: deckResources,
      cards: this.generateAdditionsSameDenom()
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // MULTIPLICATIONS DE FRACTIONS
  // ═══════════════════════════════════════════════════════════════

  generateMultiplications() {
    const cards = [];
    const fractions = [
      [1, 2], [1, 3], [2, 3], [1, 4], [3, 4],
      [1, 5], [2, 5], [1, 6]
    ];

    for (let i = 0; i < fractions.length; i++) {
      for (let j = i; j < fractions.length; j++) {
        const [a1, b1] = fractions[i];
        const [a2, b2] = fractions[j];

        const resultNum = a1 * a2;
        const resultDen = b1 * b2;
        const simplified = this.simplify(resultNum, resultDen);

        if (resultDen <= 36) {
          cards.push({
            id: `frac_mult_${a1}_${b1}_${a2}_${b2}`,
            question: `${a1}/${b1} × ${a2}/${b2} = ?`,
            answer: this.formatFraction(simplified.num, simplified.den),
            alternatives: [
              this.formatFraction(simplified.num, simplified.den),
              this.formatFraction(resultNum, resultDen)
            ],
            feedback: `${a1}/${b1} × ${a2}/${b2} = ${resultNum}/${resultDen}${simplified.den !== resultDen ? ` = ${simplified.num}/${simplified.den}` : ''}`
          });
        }
      }
    }

    return cards;
  }

  buildMultiplicationsDeck() {
    const deckResources = [
      ...this.commonResources,
      this.createSummary(
        'Multiplication de fractions',
        `Pour multiplier des fractions, on multiplie les numérateurs entre eux et les dénominateurs entre eux.

Exemple : 2/3 × 3/4 = 6/12 = 1/2

C'est plus simple que l'addition !`,
        true
      ),
      this.createObjectives([
        'Multiplier numérateurs et dénominateurs',
        'Simplifier le résultat',
        'Reconnaître les simplifications avant de calculer'
      ]),
      this.createTip(
        'Astuce : simplifier avant',
        `On peut simplifier AVANT de multiplier :

2/3 × 3/4 → On simplifie le 3 du numérateur avec le 3 du dénominateur
= 2/1 × 1/4 = 2/4 = 1/2`
      )
    ];

    return {
      name: 'Multiplication de fractions',
      description: 'Multiplier des fractions simples',
      tags: ['math', 'fractions', 'calcul-mental', 'sixieme'],
      category: ['sciences', 'maths', 'arithmetique', 'fractions'],
      settings: { sequential: false, bidirectional: false },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'multiplications' }
        }
      },
      resources: deckResources,
      cards: this.generateMultiplications()
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // CONVERSIONS FRACTIONS ↔ DÉCIMAUX
  // ═══════════════════════════════════════════════════════════════

  generateConversions() {
    const cards = [];
    const conversions = [
      [[1, 2], '0.5'], [[1, 4], '0.25'], [[3, 4], '0.75'],
      [[1, 5], '0.2'], [[2, 5], '0.4'], [[3, 5], '0.6'], [[4, 5], '0.8'],
      [[1, 10], '0.1'], [[3, 10], '0.3'], [[7, 10], '0.7'], [[9, 10], '0.9'],
      [[1, 8], '0.125'], [[3, 8], '0.375'], [[5, 8], '0.625'], [[7, 8], '0.875'],
      [[1, 3], '0.333...'], [[2, 3], '0.666...']
    ];

    // Règle d'arrondi unique : un décimal périodique est ARRONDI (au plus proche, jamais tronqué)
    // au millième, et la question l'indique. 1/3 → 0.333 ; 2/3 → 0.667.
    conversions.forEach(([[num, den], decimal]) => {
      const periodic = decimal.includes('...');
      const rounded = periodic ? (num / den).toFixed(3) : decimal;
      // Fraction → Décimal
      cards.push({
        id: `frac_to_dec_${num}_${den}`,
        question: periodic ? `${num}/${den} = ? (décimal, arrondi au millième)` : `${num}/${den} = ? (décimal)`,
        answer: rounded,
        alternatives: periodic ? [decimal] : [],
        feedback: periodic
          ? `${num}/${den} = ${num} ÷ ${den} = ${decimal} ≈ ${rounded} (arrondi au millième)`
          : `${num}/${den} = ${num} ÷ ${den} = ${decimal}`
      });

      // Décimal → Fraction (seulement si pas périodique)
      if (!decimal.includes('...')) {
        cards.push({
          id: `dec_to_frac_${decimal.replace('.', '_')}`,
          question: `${decimal} = ? (fraction)`,
          answer: `${num}/${den}`,
          feedback: `${decimal} = ${num}/${den}`
        });
      }
    });

    return cards;
  }

  buildConversionsDeck() {
    const deckResources = [
      ...this.commonResources,
      this.createSummary(
        'Fractions et décimaux',
        `Toute fraction peut s'écrire en nombre décimal (en divisant).

Fractions courantes à connaître :
- 1/2 = 0.5
- 1/4 = 0.25, 3/4 = 0.75
- 1/5 = 0.2, 2/5 = 0.4, ...
- 1/10 = 0.1, etc.`,
        true
      ),
      this.createObjectives([
        'Convertir les fractions usuelles en décimaux',
        'Convertir les décimaux en fractions',
        'Connaître par cœur les conversions courantes'
      ])
    ];

    return {
      name: 'Fractions et décimaux',
      description: 'Convertir entre fractions et nombres décimaux',
      tags: ['math', 'fractions', 'decimaux', 'calcul-mental', 'cm1', 'cm2'],
      category: ['sciences', 'maths', 'arithmetique', 'fractions', 'decimaux'],
      settings: { sequential: false, bidirectional: false },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'conversions' }
        }
      },
      resources: deckResources,
      cards: this.generateConversions()
    };
  }

  /**
   * Override: Génère plusieurs decks
   */
  buildDecks(options = {}) {
    return [
      this.buildEquivalencesDeck(),
      this.buildAdditionsDeck(),
      this.buildMultiplicationsDeck(),
      this.buildConversionsDeck()
    ];
  }

  /**
   * Génère toutes les cartes
   */
  generate(options = {}) {
    return [
      ...this.generateEquivalences(),
      ...this.generateAdditionsSameDenom(),
      ...this.generateMultiplications(),
      ...this.generateConversions()
    ];
  }
}

module.exports = FractionsGenerator;
