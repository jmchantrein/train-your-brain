/**
 * Générateur d'équations du premier degré
 *
 * Génère des decks pour le calcul mental :
 * - Équations simples (x + a = b)
 * - Équations avec coefficient (ax = b)
 * - Équations complètes (ax + b = c)
 *
 * Niveau: CM1 à 6ème
 */

const BaseGenerator = require('../base-generator.cjs');

class EquationsGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'equations',
      name: 'Équations du premier degré',
      tags: ['math', 'equations', 'algebre', 'calcul-mental'],
      version: '1.0.0',
      description: 'Équations simples du premier degré'
    });

    // Ressources pédagogiques communes
    this.commonResources = [
      this.createSummary(
        'Qu\'est-ce qu\'une équation ?',
        `Une **équation** est une égalité contenant une inconnue (souvent notée x) qu'il faut trouver.

Par exemple : **x + 5 = 12** → On cherche quel nombre additionné à 5 donne 12.

La réponse est x = 7 car 7 + 5 = 12.

Les équations sont la base de l'algèbre et permettent de :
- Résoudre des problèmes mathématiques
- Modéliser des situations réelles
- Comprendre les relations entre les nombres`,
        true
      ),
      this.createWikipediaLink('Équation', 'Équation'),
      this.createGlossary({
        'Équation': 'Égalité contenant une inconnue',
        'Inconnue': 'La valeur que l\'on cherche (x)',
        'Solution': 'La valeur qui rend l\'équation vraie',
        'Membre': 'Chaque côté de l\'égalité (gauche/droit)'
      })
    ];
  }

  /**
   * Génère les cartes pour les équations de type x + a = b
   * @returns {Object[]} Cartes
   */
  generateAdditionEquations() {
    const cards = [];

    // x + a = b avec a et b de 1 à 20
    for (let x = 1; x <= 10; x++) {
      for (let a = 1; a <= 10; a++) {
        const b = x + a;
        cards.push({
          id: `eq_add_${x}_${a}`,
          question: `x + ${a} = ${b}`,
          answer: String(x),
          feedback: `x = ${b} - ${a} = ${x}`
        });
      }
    }

    return cards;
  }

  /**
   * Génère les cartes pour les équations de type x - a = b
   * @returns {Object[]} Cartes
   */
  generateSubtractionEquations() {
    const cards = [];

    // x - a = b avec résultats positifs
    for (let x = 2; x <= 20; x++) {
      for (let a = 1; a < x && a <= 10; a++) {
        const b = x - a;
        cards.push({
          id: `eq_sub_${x}_${a}`,
          question: `x - ${a} = ${b}`,
          answer: String(x),
          feedback: `x = ${b} + ${a} = ${x}`
        });
      }
    }

    return cards;
  }

  /**
   * Génère les cartes pour les équations de type ax = b
   * @returns {Object[]} Cartes
   */
  generateMultiplicationEquations() {
    const cards = [];

    // ax = b avec a de 2 à 10 et x de 1 à 10
    for (let a = 2; a <= 10; a++) {
      for (let x = 1; x <= 10; x++) {
        const b = a * x;
        cards.push({
          id: `eq_mult_${a}_${x}`,
          question: `${a}x = ${b}`,
          answer: String(x),
          feedback: `x = ${b} ÷ ${a} = ${x}`
        });
      }
    }

    return cards;
  }

  /**
   * Génère les cartes pour les équations de type ax + b = c
   * @returns {Object[]} Cartes
   */
  generateCompleteEquations() {
    const cards = [];

    // ax + b = c avec a de 2 à 5, x de 1 à 5, b de 1 à 10
    for (let a = 2; a <= 5; a++) {
      for (let x = 1; x <= 5; x++) {
        for (let b = 1; b <= 5; b++) {
          const c = a * x + b;
          cards.push({
            id: `eq_complete_${a}_${x}_${b}`,
            question: `${a}x + ${b} = ${c}`,
            answer: String(x),
            feedback: `${a}x = ${c} - ${b} = ${a * x}, donc x = ${x}`
          });
        }
      }
    }

    return cards;
  }

  /**
   * Deck équations additives (x + a = b)
   */
  buildAdditionEquationsDeck() {
    const cards = this.generateAdditionEquations();

    const deckResources = [
      ...this.commonResources,
      this.createObjectives([
        'Résoudre des équations de type x + a = b',
        'Comprendre l\'opération inverse (soustraction)',
        'Répondre en moins de 5 secondes'
      ]),
      this.createTip(
        'Méthode de résolution',
        `Pour résoudre x + a = b :

1. Isoler x en soustrayant a des deux côtés
2. x = b - a

Exemple : x + 5 = 12 → x = 12 - 5 = 7`
      )
    ];

    return {
      name: 'Équations additives (x + a = b)',
      description: 'Trouver x dans les équations de type x + a = b',
      tags: ['math', 'equations', 'addition', 'cm1'],
      category: ['sciences', 'maths', 'algebre', 'equations', 'equations-premier-degre'],
      settings: {
        maxCards: 20,
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
          parameters: { type: 'addition-equations' }
        }
      },
      resources: deckResources,
      cards
    };
  }

  /**
   * Deck équations soustractives (x - a = b)
   */
  buildSubtractionEquationsDeck() {
    const cards = this.generateSubtractionEquations();

    const deckResources = [
      ...this.commonResources,
      this.createObjectives([
        'Résoudre des équations de type x - a = b',
        'Comprendre l\'opération inverse (addition)',
        'Répondre en moins de 5 secondes'
      ]),
      this.createTip(
        'Méthode de résolution',
        `Pour résoudre x - a = b :

1. Isoler x en ajoutant a des deux côtés
2. x = b + a

Exemple : x - 3 = 8 → x = 8 + 3 = 11`
      )
    ];

    return {
      name: 'Équations soustractives (x - a = b)',
      description: 'Trouver x dans les équations de type x - a = b',
      tags: ['math', 'equations', 'soustraction', 'cm1'],
      category: ['sciences', 'maths', 'algebre', 'equations', 'equations-premier-degre'],
      settings: {
        maxCards: 20,
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
          parameters: { type: 'subtraction-equations' }
        }
      },
      resources: deckResources,
      cards
    };
  }

  /**
   * Deck équations multiplicatives (ax = b)
   */
  buildMultiplicationEquationsDeck() {
    const cards = this.generateMultiplicationEquations();

    const deckResources = [
      ...this.commonResources,
      this.createObjectives([
        'Résoudre des équations de type ax = b',
        'Utiliser les tables de multiplication/division',
        'Répondre en moins de 5 secondes'
      ]),
      this.createTip(
        'Méthode de résolution',
        `Pour résoudre ax = b :

1. Isoler x en divisant par a des deux côtés
2. x = b ÷ a

Exemple : 5x = 35 → x = 35 ÷ 5 = 7`
      )
    ];

    return {
      name: 'Équations multiplicatives (ax = b)',
      description: 'Trouver x dans les équations de type ax = b',
      tags: ['math', 'equations', 'multiplication', 'cm2'],
      category: ['sciences', 'maths', 'algebre', 'equations', 'equations-premier-degre'],
      settings: {
        maxCards: 20,
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
          parameters: { type: 'multiplication-equations' }
        }
      },
      resources: deckResources,
      cards
    };
  }

  /**
   * Deck équations complètes (ax + b = c)
   */
  buildCompleteEquationsDeck() {
    const cards = this.generateCompleteEquations();

    const deckResources = [
      ...this.commonResources,
      this.createObjectives([
        'Résoudre des équations de type ax + b = c',
        'Combiner les opérations inverses',
        'Structurer sa démarche de résolution'
      ]),
      this.createTip(
        'Méthode de résolution',
        `Pour résoudre ax + b = c :

1. D'abord soustraire b des deux côtés : ax = c - b
2. Puis diviser par a : x = (c - b) ÷ a

Exemple : 3x + 4 = 19
→ 3x = 19 - 4 = 15
→ x = 15 ÷ 3 = 5`
      )
    ];

    return {
      name: 'Équations complètes (ax + b = c)',
      description: 'Trouver x dans les équations de type ax + b = c',
      tags: ['math', 'equations', 'algebre', 'sixieme'],
      category: ['sciences', 'maths', 'algebre', 'equations', 'equations-premier-degre'],
      settings: {
        maxCards: 20,
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
          parameters: { type: 'complete-equations' }
        }
      },
      resources: deckResources,
      cards
    };
  }

  /**
   * Override: Génère plusieurs decks
   */
  buildDecks(options = {}) {
    return [
      this.buildAdditionEquationsDeck(),
      this.buildSubtractionEquationsDeck(),
      this.buildMultiplicationEquationsDeck(),
      this.buildCompleteEquationsDeck()
    ];
  }

  /**
   * Génère toutes les cartes
   */
  generate(options = {}) {
    return [
      ...this.generateAdditionEquations(),
      ...this.generateSubtractionEquations(),
      ...this.generateMultiplicationEquations(),
      ...this.generateCompleteEquations()
    ];
  }
}

module.exports = EquationsGenerator;
