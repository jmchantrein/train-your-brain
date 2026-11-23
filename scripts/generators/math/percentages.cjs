/**
 * Générateur de pourcentages
 *
 * Génère des decks pour le calcul mental :
 * - Pourcentages simples (10%, 25%, 50%, etc.)
 * - Calcul de X% de N
 * - Conversions fractions ↔ pourcentages
 *
 * Niveau: CM1 à 5ème
 */

const BaseGenerator = require('../base-generator.cjs');

class PercentagesGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'percentages',
      name: 'Pourcentages',
      tags: ['math', 'pourcentages', 'calcul-mental'],
      version: '1.0.0',
      description: 'Calculs de pourcentages et conversions'
    });

    // Pourcentages courants à connaître
    this.commonPercentages = [10, 20, 25, 50, 75, 100, 5, 15, 30, 33, 40, 60, 70, 80, 90];

    // Ressources pédagogiques communes
    this.commonResources = [
      this.createSummary(
        'Qu\'est-ce qu\'un pourcentage ?',
        `Un **pourcentage** exprime une proportion sur 100.

**25%** signifie "25 pour 100" ou "25 centièmes" ou encore ¼.

Les pourcentages sont partout :
- Soldes et réductions (-20%)
- TVA et taxes (+20%)
- Statistiques et sondages
- Notes et résultats

Formule : X% de N = (X × N) / 100`,
        true
      ),
      this.createWikipediaLink('Pourcentage', 'Pourcentage'),
      this.createGlossary({
        'Pourcentage': 'Proportion exprimée sur 100',
        'Pour cent': 'Division par 100 (le symbole %)',
        'Taux': 'Pourcentage utilisé pour calculs',
        'Remise': 'Réduction en pourcentage',
        'Augmentation': 'Ajout d\'un pourcentage'
      })
    ];

    // Équivalences fractions/pourcentages
    this.fractionEquivalences = [
      { fraction: '1/2', percent: 50 },
      { fraction: '1/4', percent: 25 },
      { fraction: '3/4', percent: 75 },
      { fraction: '1/5', percent: 20 },
      { fraction: '2/5', percent: 40 },
      { fraction: '3/5', percent: 60 },
      { fraction: '4/5', percent: 80 },
      { fraction: '1/10', percent: 10 },
      { fraction: '1/3', percent: 33 },
      { fraction: '2/3', percent: 67 },
      { fraction: '1/8', percent: 12.5 },
      { fraction: '3/8', percent: 37.5 },
      { fraction: '5/8', percent: 62.5 },
      { fraction: '7/8', percent: 87.5 }
    ];
  }

  /**
   * Génère les cartes pour les pourcentages simples de 100
   */
  generateSimplePercentages() {
    const cards = [];
    const percentages = [10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100, 5, 15, 33];

    for (const p of percentages) {
      cards.push({
        id: `pct_of100_${p}`,
        question: `${p}% de 100 = ?`,
        answer: String(p),
        feedback: `${p}% de 100 = ${p}`
      });
    }

    return cards;
  }

  /**
   * Génère les cartes pour X% de N (valeurs rondes)
   */
  generatePercentagesOfNumbers() {
    const cards = [];
    const bases = [100, 200, 50, 80, 40, 60, 120, 150, 500, 1000];
    const percentages = [10, 20, 25, 50, 75, 100];

    for (const base of bases) {
      // X% de 100 est déjà couvert par generateSimplePercentages (question identique)
      if (base === 100) continue;
      for (const p of percentages) {
        const result = (p * base) / 100;
        if (Number.isInteger(result)) {
          cards.push({
            id: `pct_${p}_of_${base}`,
            question: `${p}% de ${base} = ?`,
            answer: String(result),
            feedback: `${p}% de ${base} = ${result}`
          });
        }
      }
    }

    return cards;
  }

  /**
   * Génère les cartes de conversions fractions ↔ pourcentages
   */
  generateFractionConversions() {
    const cards = [];

    for (const eq of this.fractionEquivalences) {
      // Fraction → pourcentage
      // Règle d'arrondi unique : valeur ARRONDIE à l'unité (au plus proche), signalée dans la question
      const [fn, fd] = eq.fraction.split('/').map(Number);
      const exact = Math.abs((fn / fd) * 100 - eq.percent) < 1e-9;
      cards.push({
        id: `pct_frac_to_pct_${eq.fraction.replace('/', '_')}`,
        question: exact ? `${eq.fraction} = ?%` : `${eq.fraction} = ?% (arrondi à l'unité)`,
        answer: String(eq.percent),
        feedback: exact ? `${eq.fraction} = ${eq.percent}%` : `${eq.fraction} ≈ ${eq.percent}% (arrondi à l'unité)`
      });

      // Pourcentage → fraction (seulement pour les fractions simples)
      if ([50, 25, 75, 20, 10].includes(eq.percent)) {
        cards.push({
          id: `pct_pct_to_frac_${eq.percent}`,
          question: `${eq.percent}% = quelle fraction ?`,
          answer: eq.fraction,
          alternatives: [eq.fraction.replace('/', ' sur ')],
          feedback: `${eq.percent}% = ${eq.fraction}`
        });
      }
    }

    return cards;
  }

  /**
   * Génère les cartes pour les calculs mentaux rapides
   */
  generateMentalCalculations() {
    const cards = [];

    // 10% (diviser par 10)
    for (const n of [50, 80, 120, 200, 350, 450, 600, 900, 1500]) {
      cards.push({
        id: `pct_mental_10_${n}`,
        question: `10% de ${n} = ?`,
        answer: String(n / 10),
        feedback: `10% = diviser par 10 → ${n / 10}`
      });
    }

    // 50% (diviser par 2)
    for (const n of [20, 50, 80, 120, 200, 300, 500, 800]) {
      cards.push({
        id: `pct_mental_50_${n}`,
        question: `50% de ${n} = ?`,
        answer: String(n / 2),
        feedback: `50% = la moitié → ${n / 2}`
      });
    }

    // 25% (diviser par 4)
    for (const n of [40, 80, 100, 200, 400, 800, 1000]) {
      cards.push({
        id: `pct_mental_25_${n}`,
        question: `25% de ${n} = ?`,
        answer: String(n / 4),
        feedback: `25% = le quart → ${n / 4}`
      });
    }

    return cards;
  }

  /**
   * Deck pourcentages simples
   */
  buildSimplePercentagesDeck() {
    const allCards = [...this.generateSimplePercentages(), ...this.generatePercentagesOfNumbers()];

    const deckResources = [
      ...this.commonResources,
      this.createObjectives([
        'Calculer X% de N mentalement',
        'Connaître les pourcentages courants',
        'Appliquer les techniques de calcul rapide'
      ]),
      this.createTip(
        'Astuces de calcul',
        `Techniques pour calculer rapidement :

• 10% = diviser par 10
• 50% = diviser par 2 (la moitié)
• 25% = diviser par 4 (le quart)
• 1% = diviser par 100

Combinez : 15% = 10% + 5% (moitié de 10%)`
      )
    ];

    return {
      name: 'Pourcentages (calculs)',
      description: 'Calculer X% de N',
      tags: ['math', 'pourcentages', 'calcul-mental', 'cm2', 'sixieme'],
      category: ['sciences', 'maths', 'arithmetique', 'pourcentages'],
      settings: { sequential: false, bidirectional: false, maxCards: 20 },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'simple-percentages' }
        }
      },
      resources: deckResources,
      cards: allCards
    };
  }

  /**
   * Deck conversions fractions/pourcentages
   */
  buildFractionConversionsDeck() {
    const deckResources = [
      ...this.commonResources,
      this.createObjectives([
        'Convertir fractions en pourcentages',
        'Convertir pourcentages en fractions',
        'Mémoriser les équivalences courantes'
      ]),
      this.createTip(
        'Équivalences à retenir',
        `Les plus courantes :
• 1/2 = 50%
• 1/4 = 25% et 3/4 = 75%
• 1/5 = 20%
• 1/10 = 10%
• 1/3 ≈ 33% et 2/3 ≈ 67%`
      )
    ];

    return {
      name: 'Fractions et pourcentages',
      description: 'Conversions fractions ↔ pourcentages',
      tags: ['math', 'pourcentages', 'fractions', 'cm2', 'sixieme'],
      category: ['sciences', 'maths', 'arithmetique', 'pourcentages'],
      settings: { sequential: false, bidirectional: false },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'fraction-conversions' }
        }
      },
      resources: deckResources,
      cards: this.generateFractionConversions()
    };
  }

  /**
   * Deck calcul mental avancé
   */
  buildMentalCalculationsDeck() {
    const deckResources = [
      ...this.commonResources,
      this.createObjectives([
        'Calculer 10%, 25%, 50% instantanément',
        'Appliquer les techniques de division',
        'Combiner les pourcentages'
      ]),
      this.createTip(
        'Calcul mental des pourcentages',
        `La clé : ramener à 10% ou 50%

• 10% = ÷10 (enlever un 0 ou décaler la virgule)
• 5% = la moitié de 10%
• 20% = 2 × 10%
• 25% = ÷4 = 50% ÷ 2
• 15% = 10% + 5%
• 30% = 3 × 10%`
      )
    ];

    return {
      name: 'Calcul mental des pourcentages',
      description: 'Techniques de calcul mental rapide',
      tags: ['math', 'pourcentages', 'calcul-mental', 'cm2', 'sixieme'],
      category: ['sciences', 'maths', 'arithmetique', 'pourcentages'],
      settings: { sequential: false, bidirectional: false },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'mental-calculations' }
        }
      },
      resources: deckResources,
      cards: this.generateMentalCalculations()
    };
  }

  /**
   * Override: Génère plusieurs decks
   */
  buildDecks(options = {}) {
    return [
      this.buildSimplePercentagesDeck(),
      this.buildFractionConversionsDeck(),
      this.buildMentalCalculationsDeck()
    ];
  }

  /**
   * Génère toutes les cartes
   */
  generate(options = {}) {
    return [
      ...this.generateSimplePercentages(),
      ...this.generatePercentagesOfNumbers(),
      ...this.generateFractionConversions(),
      ...this.generateMentalCalculations()
    ];
  }
}

module.exports = PercentagesGenerator;
