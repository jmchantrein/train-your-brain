/**
 * Générateur de tables d'addition
 *
 * Génère des decks pour le calcul mental :
 * - Tables d'addition 1-10
 * - Compléments à 10
 * - Compléments à 100
 *
 * Niveau: CP à CE2
 */

const BaseGenerator = require('../base-generator.cjs');

class AdditionGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'addition',
      name: 'Tables d\'addition',
      tags: ['math', 'addition', 'calcul-mental', 'arithmetique'],
      version: '1.0.0',
      description: 'Tables d\'addition et compléments'
    });

    // Ressources pédagogiques communes à toutes les tables d'addition
    this.commonResources = [
      this.createSummary(
        'Qu\'est-ce que l\'addition ?',
        `L'**addition** est l'opération mathématique la plus fondamentale. Elle permet de combiner deux nombres pour obtenir leur somme.

Par exemple : **5 + 3 = 8** signifie que si on a 5 objets et qu'on en ajoute 3, on en a 8 au total.

Les tables d'addition sont la base pour :
- Le calcul mental rapide
- La compréhension de la soustraction (opération inverse)
- L'apprentissage des tables de multiplication`,
        true
      ),
      this.createWikipediaLink('Addition', 'Addition'),
      this.createGlossary({
        'Addition': 'Opération qui réunit deux nombres en un seul (leur somme)',
        'Termes': 'Les nombres que l\'on additionne',
        'Somme': 'Résultat d\'une addition',
        'Commutativité': 'L\'ordre des termes ne change pas la somme (3 + 5 = 5 + 3)'
      })
    ];
  }

  /**
   * Génère un SVG représentant une addition sous forme de deux groupes de points
   * @param {number} a - Premier nombre
   * @param {number} b - Second nombre
   * @returns {Object|null} Objet media ou null si trop grand
   */
  generateAdditionSvg(a, b) {
    // Ne pas générer de SVG si la somme est trop grande
    if (a + b > 20 || a === 0 || b === 0) {
      return null;
    }

    const dotRadius = 5;
    const dotSpacing = 14;
    const padding = 10;
    const operatorGap = 12; // Espace de chaque côté de l'opérateur

    // Disposer les points en rangées de 5 max pour chaque groupe
    const cols = 5;
    const rowsA = Math.ceil(a / cols);
    const rowsB = Math.ceil(b / cols);
    const maxRows = Math.max(rowsA, rowsB);

    // Nombre de colonnes effectives dans chaque groupe (première ligne)
    const colsA = Math.min(a, cols);
    const colsB = Math.min(b, cols);

    // Largeur réelle de chaque groupe (centre à centre des cercles)
    // Pour n cercles: (n-1) * spacing
    const groupACenterSpan = (colsA - 1) * dotSpacing;
    const groupBCenterSpan = (colsB - 1) * dotSpacing;

    // Positions X
    const groupAStartX = padding + dotRadius; // Centre du premier cercle A
    const groupARightEdge = groupAStartX + groupACenterSpan + dotRadius; // Bord droit du dernier cercle A
    const operatorX = groupARightEdge + operatorGap; // Centre de l'opérateur
    const groupBLeftEdge = operatorX + operatorGap; // Bord gauche du premier cercle B
    const groupBStartX = groupBLeftEdge + dotRadius; // Centre du premier cercle B

    const width = groupBStartX + groupBCenterSpan + dotRadius + padding;
    const height = maxRows * dotSpacing + padding * 2;

    let circles = '';

    // Groupe A (couleur violette)
    for (let i = 0; i < a; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const cx = groupAStartX + col * dotSpacing;
      const cy = padding + row * dotSpacing;
      circles += `<circle cx="${cx}" cy="${cy}" r="${dotRadius}" fill="#8b5cf6"/>`;
    }

    // Opérateur (+) - centré entre les deux groupes
    const separatorY = height / 2;
    circles += `<text x="${operatorX}" y="${separatorY}" text-anchor="middle" dominant-baseline="central" fill="#64748b" font-size="16" font-weight="bold">+</text>`;

    // Groupe B (couleur orange)
    for (let i = 0; i < b; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const cx = groupBStartX + col * dotSpacing;
      const cy = padding + row * dotSpacing;
      circles += `<circle cx="${cx}" cy="${cy}" r="${dotRadius}" fill="#f97316"/>`;
    }

    return {
      type: 'image',
      format: 'svg',
      data: `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${circles}</svg>`
    };
  }

  /**
   * Génère les cartes pour une table d'addition
   * @param {number} table - Numéro de la table (1-10)
   * @returns {Object[]} Cartes
   */
  generateTableCards(table) {
    const cards = [];

    for (let i = 1; i <= 10; i++) {
      const result = table + i;
      const card = {
        id: `add_${table}_plus_${i}`,
        question: `${table} + ${i} = ?`,
        answer: String(result)
      };

      // Ajouter représentation visuelle SVG si possible
      const media = this.generateAdditionSvg(table, i);
      if (media) {
        card.media = media;
      }

      cards.push(card);
    }

    return cards;
  }

  /**
   * Génère un SVG pour les compléments à 10 (barre de 10 avec points pleins/vides)
   * @param {number} filled - Nombre de points pleins
   * @returns {Object} Objet media
   */
  generateComplement10Svg(filled) {
    const dotRadius = 6;
    const dotSpacing = 18;
    const padding = 10;
    const width = 10 * dotSpacing + padding * 2 - (dotSpacing - dotRadius * 2);
    const height = padding * 2 + dotRadius * 2;

    let circles = '';
    for (let i = 0; i < 10; i++) {
      const cx = padding + i * dotSpacing;
      const cy = padding + dotRadius;
      const isFilled = i < filled;
      circles += `<circle cx="${cx}" cy="${cy}" r="${dotRadius}" fill="${isFilled ? '#8b5cf6' : 'none'}" stroke="${isFilled ? '#8b5cf6' : '#64748b'}" stroke-width="2"/>`;
    }

    return {
      type: 'image',
      format: 'svg',
      data: `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${circles}</svg>`
    };
  }

  /**
   * Génère les cartes pour les compléments à 10
   * @returns {Object[]} Cartes
   */
  generateComplementsTo10() {
    const cards = [];

    for (let i = 0; i <= 10; i++) {
      const complement = 10 - i;
      cards.push({
        id: `add_comp10_${i}`,
        question: `${i} + ? = 10`,
        answer: String(complement),
        feedback: `${i} + ${complement} = 10`,
        media: this.generateComplement10Svg(i)
      });
    }

    return cards;
  }

  /**
   * Génère les cartes pour les compléments à 100 (dizaines)
   * @returns {Object[]} Cartes
   */
  generateComplementsTo100() {
    const cards = [];

    for (let i = 0; i <= 100; i += 10) {
      const complement = 100 - i;
      cards.push({
        id: `add_comp100_${i}`,
        question: `${i} + ? = 100`,
        answer: String(complement),
        feedback: `${i} + ${complement} = 100`
      });
    }

    return cards;
  }

  /**
   * Génère les cartes pour les compléments à 1000 (centaines)
   * @returns {Object[]} Cartes
   */
  generateComplementsTo1000() {
    const cards = [];

    for (let i = 0; i <= 1000; i += 100) {
      const complement = 1000 - i;
      cards.push({
        id: `add_comp1000_${i}`,
        question: `${i} + ? = 1000`,
        answer: String(complement),
        feedback: `${i} + ${complement} = 1000`
      });
    }

    return cards;
  }

  /**
   * Génère un SVG "Vue d'ensemble" de la table d'addition
   * @param {number} table - Numéro de la table
   * @returns {string} SVG encodé en data URI
   */
  generateTableOverviewSvg(table) {
    const rowHeight = 24;
    const width = 180;
    const height = 10 * rowHeight + 20;
    const padding = 10;

    let rows = '';
    for (let i = 1; i <= 10; i++) {
      const y = padding + (i - 1) * rowHeight + 16;
      const result = table + i;
      rows += `<text x="${padding}" y="${y}" font-family="monospace" font-size="14" fill="#f8fafc">${table} + ${String(i).padStart(2, ' ')} = ${String(result).padStart(2, ' ')}</text>`;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect x="0" y="0" width="${width}" height="${height}" fill="#1e293b" rx="8"/>
      <text x="${width/2}" y="${padding + 2}" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#22c55e" font-weight="bold">Table de ${table}</text>
      <line x1="${padding}" y1="${padding + 8}" x2="${width - padding}" y2="${padding + 8}" stroke="#334155" stroke-width="1"/>
      ${rows}
    </svg>`;

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  /**
   * Génère un deck pour une table spécifique
   */
  buildTableDeck(table) {
    // Tables d'addition mémorisées du CP au CE1 (pas de coupure par table)
    const levels = ['cp', 'ce1'];

    // Ressources spécifiques
    const deckResources = [...this.commonResources];

    // Image de référence (vue d'ensemble de la table)
    deckResources.push(this.createReferenceImage(
      `Table de ${table}`,
      this.generateTableOverviewSvg(table),
      false
    ));

    deckResources.push(this.createObjectives([
      `Mémoriser les additions de ${table} + 1 à ${table} + 10`,
      'Répondre rapidement sans compter sur ses doigts',
      'Reconnaître les résultats automatiquement'
    ]));

    return {
      name: `Table d'addition de ${table}`,
      description: `Addition par ${table} (${table} + 1 à ${table} + 10)`,
      tags: ['math', 'addition', 'calcul-mental', ...levels],
      category: ['sciences', 'maths', 'arithmetique', 'operations-base', 'additions'],
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
          parameters: { table }
        }
      },
      resources: deckResources,
      cards: this.generateTableCards(table)
    };
  }

  /**
   * Génère le deck des compléments à 10
   */
  buildComplementsTo10Deck() {
    const deckResources = [
      this.createSummary(
        'Les compléments à 10',
        `Les **compléments à 10** sont les paires de nombres dont la somme fait 10.

Connaître ces compléments par cœur est essentiel pour :
- Le calcul mental rapide
- Les additions à plusieurs chiffres (passage de dizaine)
- Les soustractions

Les paires à retenir : 0+10, 1+9, 2+8, 3+7, 4+6, 5+5`,
        true
      ),
      this.createObjectives([
        'Connaître par cœur tous les compléments à 10',
        'Répondre instantanément sans calculer',
        'Utiliser ces connaissances pour le calcul mental'
      ]),
      this.createTip(
        'Astuce mnémotechnique',
        `Visualisez vos deux mains : chaque complément correspond à lever certains doigts sur une main et les autres sur l'autre main.

Par exemple : 3 + 7 = 10 → 3 doigts sur une main, 7 sur l'autre`
      )
    ];

    return {
      name: 'Compléments à 10',
      description: 'Trouver le nombre qui complète à 10',
      tags: ['math', 'addition', 'calcul-mental', 'cp'],
      category: ['sciences', 'maths', 'arithmetique', 'operations-base', 'additions'],
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
          parameters: { type: 'complements-10' }
        }
      },
      resources: deckResources,
      cards: this.generateComplementsTo10()
    };
  }

  /**
   * Génère le deck des compléments à 100
   */
  buildComplementsTo100Deck() {
    const deckResources = [
      this.createSummary(
        'Les compléments à 100',
        `Les **compléments à 100** (par dizaines) sont les paires de nombres dont la somme fait 100.

Ce deck se concentre sur les dizaines : 10+90, 20+80, 30+70, etc.

Cette compétence est utile pour :
- Calculer rapidement la monnaie à rendre
- Les additions et soustractions à 3 chiffres
- Les pourcentages (ex: 30% et 70% font 100%)`,
        true
      ),
      this.createObjectives([
        'Connaître par cœur les compléments à 100 (dizaines)',
        'Faire le lien avec les compléments à 10 (même logique)',
        'Appliquer au calcul mental quotidien'
      ]),
      this.createTip(
        'Lien avec les compléments à 10',
        `Les compléments à 100 suivent la même logique que les compléments à 10 !

30 + 70 = 100 → car 3 + 7 = 10
40 + 60 = 100 → car 4 + 6 = 10

Il suffit d'ajouter un 0 à droite.`
      )
    ];

    return {
      name: 'Compléments à 100',
      description: 'Trouver le nombre qui complète à 100 (dizaines)',
      tags: ['math', 'addition', 'calcul-mental', 'ce1'],
      category: ['sciences', 'maths', 'arithmetique', 'operations-base', 'additions'],
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
          parameters: { type: 'complements-100' }
        }
      },
      resources: deckResources,
      cards: this.generateComplementsTo100()
    };
  }

  /**
   * Génère le deck des compléments à 1000
   */
  buildComplementsTo1000Deck() {
    const deckResources = [
      this.createSummary(
        'Les compléments à 1000',
        `Les **compléments à 1000** (par centaines) sont les paires de nombres dont la somme fait 1000.

Ce deck se concentre sur les centaines : 100+900, 200+800, 300+700, etc.

Cette compétence est utile pour :
- Manipuler les grands nombres facilement
- Les additions et soustractions à 4 chiffres
- Le calcul mental avec des montants en euros`,
        true
      ),
      this.createObjectives([
        'Connaître par cœur les compléments à 1000 (centaines)',
        'Faire le lien avec les compléments à 10 et 100',
        'Appliquer au calcul mental quotidien'
      ]),
      this.createTip(
        'Lien avec les compléments à 10',
        `Les compléments à 1000 suivent la même logique que les compléments à 10 !

300 + 700 = 1000 → car 3 + 7 = 10
400 + 600 = 1000 → car 4 + 6 = 10

Il suffit d'ajouter deux 0 à droite.`
      )
    ];

    return {
      name: 'Compléments à 1000',
      description: 'Trouver le nombre qui complète à 1000 (centaines)',
      tags: ['math', 'addition', 'calcul-mental', 'ce2'],
      category: ['sciences', 'maths', 'arithmetique', 'operations-base', 'additions'],
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
          parameters: { type: 'complements-1000' }
        }
      },
      resources: deckResources,
      cards: this.generateComplementsTo1000()
    };
  }

  /**
   * Génère un SVG de table carrée pour les additions
   * @returns {string} SVG encodé en data URI
   */
  generateSquareTableSvg() {
    const cellSize = 28;
    const rowHeaderWidth = 24;  // Largeur colonne en-têtes lignes (à gauche)
    const colHeaderHeight = 20; // Hauteur ligne en-têtes colonnes (au-dessus)
    const titleHeight = 22;     // Espace pour le titre
    const padding = 5;
    const tableSize = 11; // 0-10

    const width = rowHeaderWidth + tableSize * cellSize + padding * 2;
    const height = titleHeight + colHeaderHeight + tableSize * cellSize + padding * 2;

    let svg = `<rect x="0" y="0" width="${width}" height="${height}" fill="#1e293b" rx="8"/>`;

    // Titre (tout en haut)
    svg += `<text x="${width/2}" y="${padding + 12}" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#22c55e" font-weight="bold">Table d'addition</text>`;

    // En-têtes colonnes (au-dessus de la grille, après le titre)
    const colHeaderY = padding + titleHeight + colHeaderHeight/2 + 4;
    svg += `<text x="${padding + rowHeaderWidth/2}" y="${colHeaderY}" text-anchor="middle" font-family="monospace" font-size="10" fill="#94a3b8" font-weight="bold">+</text>`;
    for (let c = 0; c <= 10; c++) {
      const x = padding + rowHeaderWidth + c * cellSize + cellSize/2;
      svg += `<text x="${x}" y="${colHeaderY}" text-anchor="middle" font-family="monospace" font-size="10" fill="#22c55e" font-weight="bold">${c}</text>`;
    }

    // Grille de données (en-têtes lignes + cellules)
    const gridStartY = padding + titleHeight + colHeaderHeight;
    for (let r = 0; r <= 10; r++) {
      const y = gridStartY + r * cellSize + cellSize/2 + 4;
      // En-tête ligne (à gauche)
      svg += `<text x="${padding + rowHeaderWidth/2}" y="${y}" text-anchor="middle" font-family="monospace" font-size="10" fill="#22c55e" font-weight="bold">${r}</text>`;

      // Cellules
      for (let c = 0; c <= 10; c++) {
        const x = padding + rowHeaderWidth + c * cellSize + cellSize/2;
        const result = r + c;
        // Colorer différemment les doubles (a+a)
        const isDouble = r === c;
        const color = isDouble ? '#f97316' : '#f8fafc';
        svg += `<text x="${x}" y="${y}" text-anchor="middle" font-family="monospace" font-size="9" fill="${color}">${result}</text>`;
      }
    }

    // Lignes de grille (seulement pour la zone données, pas les en-têtes)
    for (let i = 0; i <= 11; i++) {
      const x = padding + rowHeaderWidth + i * cellSize;
      const y = gridStartY + i * cellSize;
      svg += `<line x1="${padding + rowHeaderWidth}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#334155" stroke-width="0.5"/>`;
      svg += `<line x1="${x}" y1="${gridStartY}" x2="${x}" y2="${height - padding}" stroke="#334155" stroke-width="0.5"/>`;
    }

    const svgFull = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${svg}</svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svgFull).toString('base64')}`;
  }

  /**
   * Génère le deck complet (toutes les tables, 100 cartes)
   */
  buildCompleteTableDeck() {
    const allCards = [];

    // Générer toutes les combinaisons 1-10 + 1-10 (sans les 0)
    for (let a = 1; a <= 10; a++) {
      for (let b = 1; b <= 10; b++) {
        const result = a + b;
        const card = {
          id: `add_complete_${a}+${b}`,
          question: `${a} + ${b} = ?`,
          answer: String(result)
        };
        // SVG pour visualisation
        if (result <= 20) {
          const media = this.generateAdditionSvg(a, b);
          if (media) card.media = media;
        }
        allCards.push(card);
      }
    }

    // Mélanger les cartes (Fisher-Yates à graine fixe)
    allCards.splice(0, allCards.length, ...this.shuffle(allCards, 'cards'));

    const deckResources = [
      ...this.commonResources,
      this.createReferenceImage(
        'Table d\'addition',
        this.generateSquareTableSvg(),
        false
      ),
      this.createObjectives([
        'Maîtriser toutes les additions de 1 à 10',
        'Répondre en moins de 2 secondes',
        'Reconnaître les doubles (2+2, 3+3, ...)'
      ]),
      this.createTip(
        'Commutativité',
        `L'addition est commutative : 3 + 7 = 7 + 3 = 10

En connaissant cette propriété, il suffit d'apprendre la moitié des combinaisons !`
      )
    ];

    return {
      name: 'Tables d\'addition (complètes)',
      description: 'Toutes les tables de 1 à 10 (100 cartes mélangées)',
      tags: ['math', 'addition', 'calcul-mental', 'cp', 'ce1', 'revision'],
      category: ['sciences', 'maths', 'arithmetique', 'operations-base', 'additions'],
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
          parameters: { type: 'complete-table' }
        }
      },
      resources: deckResources,
      cards: allCards
    };
  }

  /**
   * Override: Génère plusieurs decks
   */
  buildDecks(options = {}) {
    const decks = [];

    // Tables 1 à 10
    for (let table = 1; table <= 10; table++) {
      decks.push(this.buildTableDeck(table));
    }

    // Compléments
    decks.push(this.buildComplementsTo10Deck());
    decks.push(this.buildComplementsTo100Deck());
    decks.push(this.buildComplementsTo1000Deck());

    // Table complète
    decks.push(this.buildCompleteTableDeck());

    return decks;
  }

  /**
   * Génère toutes les cartes
   */
  generate(options = {}) {
    const cards = [];
    for (let table = 1; table <= 10; table++) {
      cards.push(...this.generateTableCards(table));
    }
    cards.push(...this.generateComplementsTo10());
    cards.push(...this.generateComplementsTo100());
    cards.push(...this.generateComplementsTo1000());
    return cards;
  }
}

module.exports = AdditionGenerator;
