/**
 * Générateur de puissances et racines
 *
 * Génère des decks pour le calcul mental :
 * - Carrés (1² à 15²)
 * - Cubes (1³ à 10³)
 * - Puissances de 2 (2⁰ à 2¹⁰)
 * - Racines carrées parfaites
 *
 * Niveau: CM2 à 4ème
 */

const BaseGenerator = require('../base-generator.cjs');

class PowersGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'powers',
      name: 'Puissances et racines',
      tags: ['math', 'puissances', 'racines', 'calcul-mental'],
      version: '1.0.0',
      description: 'Carrés, cubes, puissances de 2 et racines carrées'
    });

    // Ressources pédagogiques communes
    this.commonResources = [
      this.createSummary(
        'Qu\'est-ce qu\'une puissance ?',
        `Une **puissance** indique combien de fois un nombre est multiplié par lui-même.

**Notation** : aⁿ = a × a × ... × a (n fois)

Exemples :
- 3² = 3 × 3 = 9 (carré de 3)
- 2³ = 2 × 2 × 2 = 8 (cube de 2)
- 10⁴ = 10 × 10 × 10 × 10 = 10000

Les puissances sont essentielles en :
- Sciences (notation scientifique)
- Informatique (puissances de 2)
- Géométrie (aires et volumes)`,
        true
      ),
      this.createWikipediaLink('Puissance', 'Puissance_(mathématiques)'),
      this.createGlossary({
        'Puissance': 'Multiplication répétée d\'un nombre',
        'Base': 'Le nombre qui est multiplié',
        'Exposant': 'Le nombre de fois qu\'on multiplie',
        'Carré': 'Puissance 2 (n²)',
        'Cube': 'Puissance 3 (n³)',
        'Racine carrée': 'Opération inverse du carré (√)'
      })
    ];
  }

  /**
   * Génère les cartes pour les carrés (1² à 20²)
   */
  generateSquares() {
    const cards = [];

    for (let n = 1; n <= 20; n++) {
      const result = n * n;
      cards.push({
        id: `pow_square_${n}`,
        question: `${n}² = ?`,
        answer: String(result),
        feedback: `${n}² = ${n} × ${n} = ${result}`
      });
    }

    return cards;
  }

  /**
   * Génère les cartes pour les cubes (1³ à 10³)
   */
  generateCubes() {
    const cards = [];

    for (let n = 1; n <= 10; n++) {
      const result = n * n * n;
      cards.push({
        id: `pow_cube_${n}`,
        question: `${n}³ = ?`,
        answer: String(result),
        feedback: `${n}³ = ${n} × ${n} × ${n} = ${result}`
      });
    }

    return cards;
  }

  /**
   * Génère les cartes pour les puissances de 2 (2⁰ à 2¹²)
   */
  generatePowersOf2() {
    const cards = [];

    for (let exp = 0; exp <= 12; exp++) {
      const result = Math.pow(2, exp);
      cards.push({
        id: `pow_2_${exp}`,
        question: `2^${exp} = ?`,
        answer: String(result),
        feedback: `2^${exp} = ${result}`
      });
    }

    return cards;
  }

  /**
   * Génère les cartes pour les puissances de 10 (10⁰ à 10⁶)
   */
  generatePowersOf10() {
    const cards = [];

    for (let exp = 0; exp <= 6; exp++) {
      const result = Math.pow(10, exp);
      cards.push({
        id: `pow_10_${exp}`,
        question: `10^${exp} = ?`,
        answer: String(result),
        feedback: `10^${exp} = ${result} (${exp} zéro${exp > 1 ? 's' : ''} après le 1)`
      });
    }

    return cards;
  }

  /**
   * Génère les cartes pour les racines carrées parfaites
   */
  generateSquareRoots() {
    const cards = [];

    for (let n = 1; n <= 20; n++) {
      const square = n * n;
      cards.push({
        id: `pow_sqrt_${square}`,
        question: `√${square} = ?`,
        answer: String(n),
        feedback: `√${square} = ${n} car ${n}² = ${square}`
      });
    }

    return cards;
  }

  /**
   * Génère un SVG "Vue d'ensemble" des carrés
   */
  generateSquaresOverviewSvg() {
    const rowHeight = 22;
    const cols = 2;
    const colWidth = 100;
    const rows = 10;
    const padding = 10;
    const width = cols * colWidth + padding * 2;
    const height = rows * rowHeight + 30;

    let content = `<rect x="0" y="0" width="${width}" height="${height}" fill="#1e293b" rx="8"/>`;
    content += `<text x="${width/2}" y="18" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#8b5cf6" font-weight="bold">Carrés parfaits</text>`;

    for (let i = 0; i < 20; i++) {
      const col = Math.floor(i / 10);
      const row = i % 10;
      const n = i + 1;
      const x = padding + col * colWidth;
      const y = 30 + row * rowHeight + 14;
      content += `<text x="${x}" y="${y}" font-family="monospace" font-size="12" fill="#f8fafc">${String(n).padStart(2, ' ')}² = ${String(n * n).padStart(3, ' ')}</text>`;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${content}</svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  /**
   * Deck des carrés
   */
  buildSquaresDeck() {
    const deckResources = [
      ...this.commonResources,
      this.createReferenceImage('Carrés parfaits', this.generateSquaresOverviewSvg(), false),
      this.createObjectives([
        'Mémoriser les carrés de 1 à 20',
        'Reconnaître les carrés parfaits',
        'Calculer mentalement'
      ]),
      this.createTip(
        'Astuces pour les carrés',
        `Quelques carrés à retenir :
- Les carrés jusqu'à 12 sont les plus courants
- 11² = 121, 12² = 144, 13² = 169
- 14² = 196, 15² = 225
- Les carrés finissent par 0, 1, 4, 5, 6 ou 9 (jamais 2, 3, 7, 8)`
      )
    ];

    return {
      name: 'Carrés parfaits (1² à 20²)',
      description: 'Les carrés des nombres de 1 à 20',
      tags: ['math', 'puissances', 'carres', 'cm2'],
      category: ['sciences', 'maths', 'arithmetique', 'puissances'],
      settings: { sequential: false, bidirectional: false },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'squares' }
        }
      },
      resources: deckResources,
      cards: this.generateSquares()
    };
  }

  /**
   * Deck des cubes
   */
  buildCubesDeck() {
    const deckResources = [
      ...this.commonResources,
      this.createObjectives([
        'Mémoriser les cubes de 1 à 10',
        'Comprendre le lien avec les volumes',
        'Calculer mentalement'
      ]),
      this.createTip(
        'Cubes à retenir',
        `Les cubes les plus courants :
- 1³ = 1
- 2³ = 8
- 3³ = 27
- 4³ = 64
- 5³ = 125
- 10³ = 1000`
      )
    ];

    return {
      name: 'Cubes (1³ à 10³)',
      description: 'Les cubes des nombres de 1 à 10',
      tags: ['math', 'puissances', 'cubes', 'cinquieme'],
      category: ['sciences', 'maths', 'arithmetique', 'puissances'],
      settings: { sequential: false, bidirectional: false },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'cubes' }
        }
      },
      resources: deckResources,
      cards: this.generateCubes()
    };
  }

  /**
   * Deck des puissances de 2
   */
  buildPowersOf2Deck() {
    const deckResources = [
      ...this.commonResources,
      this.createObjectives([
        'Mémoriser les puissances de 2 de 2⁰ à 2¹²',
        'Comprendre leur importance en informatique',
        'Convertir rapidement'
      ]),
      this.createTip(
        'Puissances de 2 en informatique',
        `Les puissances de 2 sont fondamentales :
- 2⁸ = 256 (un octet)
- 2¹⁰ = 1024 ≈ 1 kilo
- 2²⁰ ≈ 1 méga
- 2³⁰ ≈ 1 giga

Astuce : chaque puissance double la précédente !`
      )
    ];

    return {
      id: 'maths-puissances-de-2-jusqu-a-2-12',
      name: 'Maths - Puissances de 2 (2^0 à 2^12)',
      description: 'Les puissances de 2 de 2⁰ à 2¹²',
      tags: ['math', 'puissances', 'informatique', 'quatrieme'],
      category: ['sciences', 'maths', 'arithmetique', 'puissances'],
      settings: { sequential: false, bidirectional: false },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'powers-of-2' }
        }
      },
      resources: deckResources,
      cards: this.generatePowersOf2()
    };
  }

  /**
   * Deck des puissances de 10
   */
  buildPowersOf10Deck() {
    const deckResources = [
      ...this.commonResources,
      this.createObjectives([
        'Mémoriser les puissances de 10',
        'Comprendre la notation scientifique',
        'Manipuler les ordres de grandeur'
      ]),
      this.createTip(
        'Puissances de 10',
        `Règle simple : 10ⁿ = 1 suivi de n zéros

- 10⁰ = 1
- 10¹ = 10
- 10² = 100
- 10³ = 1000 (mille)
- 10⁶ = 1 000 000 (million)
- 10⁹ = milliard`
      )
    ];

    return {
      name: 'Puissances de 10',
      description: 'Les puissances de 10 de 10⁰ à 10⁶',
      tags: ['math', 'puissances', 'notation-scientifique', 'quatrieme'],
      category: ['sciences', 'maths', 'arithmetique', 'puissances'],
      settings: { sequential: false, bidirectional: false },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'powers-of-10' }
        }
      },
      resources: deckResources,
      cards: this.generatePowersOf10()
    };
  }

  /**
   * Deck des racines carrées
   */
  buildSquareRootsDeck() {
    const deckResources = [
      ...this.commonResources,
      this.createReferenceImage('Carrés parfaits', this.generateSquaresOverviewSvg(), false),
      this.createObjectives([
        'Reconnaître les carrés parfaits',
        'Trouver leur racine carrée',
        'Faire le lien carré ↔ racine'
      ]),
      this.createTip(
        'Racines carrées',
        `La racine carrée est l'opération inverse du carré :
√n = x signifie que x² = n

Exemples :
- √9 = 3 car 3² = 9
- √144 = 12 car 12² = 144
- √400 = 20 car 20² = 400`
      )
    ];

    return {
      name: 'Racines carrées parfaites',
      description: 'Racines carrées des carrés parfaits de 1 à 400',
      tags: ['math', 'racines', 'carres', 'quatrieme', 'troisieme'],
      category: ['sciences', 'maths', 'arithmetique', 'puissances'],
      settings: { sequential: false, bidirectional: false },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'square-roots' }
        }
      },
      resources: deckResources,
      cards: this.generateSquareRoots()
    };
  }

  /**
   * Override: Génère plusieurs decks
   */
  buildDecks(options = {}) {
    return [
      this.buildSquaresDeck(),
      this.buildCubesDeck(),
      this.buildPowersOf2Deck(),
      this.buildPowersOf10Deck(),
      this.buildSquareRootsDeck()
    ];
  }

  /**
   * Génère toutes les cartes
   */
  generate(options = {}) {
    return [
      ...this.generateSquares(),
      ...this.generateCubes(),
      ...this.generatePowersOf2(),
      ...this.generatePowersOf10(),
      ...this.generateSquareRoots()
    ];
  }
}

module.exports = PowersGenerator;
