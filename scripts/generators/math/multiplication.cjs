/**
 * Générateur de tables de multiplication
 *
 * Génère 11 decks : table-0 à table-10
 * Chaque deck contient 11 cartes (0×N à 10×N)
 *
 * Niveau: cp (cours préparatoire) - cm2
 * Progression recommandée:
 * - CP: Tables 0, 1, 2, 5, 10
 * - CE1: Tables 3, 4
 * - CE2: Tables 6, 7, 8, 9
 */

const BaseGenerator = require('../base-generator.cjs');

class MultiplicationGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'multiplication',
      name: 'Tables de multiplication',
      tags: ['math', 'multiplication', 'calcul-mental', 'arithmetique'],
      version: '1.0.0',
      description: 'Tables de multiplication de 0 à 10'
    });

    // Niveaux scolaires par table : tables 0 à 5 et 10 au CE1 puis consolidées au CE2 ;
    // tables 6 à 9 au CE2 puis consolidées au CM1 (le CP n'étudie que doubles et moitiés)
    this.tablesByLevel = {
      'ce1,ce2': [0, 1, 2, 3, 4, 5, 10],
      'ce2,cm1': [6, 7, 8, 9]
    };

    // Ressources pédagogiques communes à toutes les tables
    this.commonResources = [
      this.createSummary(
        'Qu\'est-ce que la multiplication ?',
        `La **multiplication** est une opération arithmétique qui permet de calculer rapidement une somme de nombres identiques.

Par exemple : **3 × 4 = 12** signifie 3 + 3 + 3 + 3 = 12

Les tables de multiplication sont essentielles pour :
- Le calcul mental rapide
- La résolution de problèmes mathématiques
- Les divisions, fractions et pourcentages`,
        true
      ),
      this.createWikipediaLink('Table de multiplication', 'Table_de_multiplication'),
      this.createGlossary({
        'Multiplication': 'Opération qui donne le produit de deux nombres',
        'Facteur': 'Nombre que l\'on multiplie (ex: dans 3 × 4, les facteurs sont 3 et 4)',
        'Produit': 'Résultat d\'une multiplication',
        'Commutativité': 'Propriété : l\'ordre des facteurs ne change pas le produit (3 × 4 = 4 × 3)'
      })
    ];

    // Astuces par table
    this.tableTips = {
      0: 'Tout nombre multiplié par 0 donne 0. C\'est la propriété absorbante de 0.',
      1: 'Tout nombre multiplié par 1 reste inchangé. C\'est l\'élément neutre de la multiplication.',
      2: 'Multiplier par 2, c\'est doubler le nombre. Compter de 2 en 2 aide à mémoriser.',
      5: 'Les résultats se terminent toujours par 0 ou 5. Compter de 5 en 5 sur les doigts.',
      9: 'Astuce des doigts : levez 10 doigts, baissez le n-ième doigt. Les doigts à gauche = dizaines, à droite = unités.',
      10: 'Multiplier par 10 ajoute un 0 à la fin du nombre.'
    };
  }

  /**
   * Détermine le niveau scolaire d'une table
   * @param {number} table - Numéro de la table
   * @returns {string[]} Niveaux scolaires (tags de taxonomie)
   */
  getLevelsForTable(table) {
    for (const [levels, tables] of Object.entries(this.tablesByLevel)) {
      if (tables.includes(table)) {
        return levels.split(',');
      }
    }
    return ['ce1', 'ce2']; // Default
  }

  /**
   * Génère un SVG représentant une multiplication sous forme de grille de points
   * @param {number} rows - Nombre de lignes (premier facteur)
   * @param {number} cols - Nombre de colonnes (second facteur)
   * @returns {Object|null} Objet media ou null si trop grand
   */
  generateMultiplicationSvg(rows, cols) {
    // Ne pas générer de SVG si un des facteurs est 0 ou si le résultat est trop grand
    if (rows === 0 || cols === 0 || rows * cols > 50) {
      return null;
    }

    const dotRadius = 4;
    const dotSpacing = 14;
    const padding = 10;

    const width = cols * dotSpacing + padding * 2 - (dotSpacing - dotRadius * 2);
    const height = rows * dotSpacing + padding * 2 - (dotSpacing - dotRadius * 2);

    let circles = '';
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = padding + c * dotSpacing;
        const cy = padding + r * dotSpacing;
        circles += `<circle cx="${cx}" cy="${cy}" r="${dotRadius}" fill="#8b5cf6"/>`;
      }
    }

    return {
      type: 'image',
      format: 'svg',
      data: `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${circles}</svg>`
    };
  }

  /**
   * Génère les cartes pour une table spécifique
   * @param {number} table - Numéro de la table (0-10)
   * @returns {Object[]} Cartes de la table
   */
  generateTable(table) {
    const cards = [];

    for (let i = 0; i <= 10; i++) {
      const result = table * i;
      const card = {
        id: `mult_${table}_x_${i}`,
        question: `${table} × ${i} = ?`,
        answer: String(result),
        alternatives: this.generateAlternatives(result)
      };

      // Ajouter représentation visuelle SVG si possible
      const media = this.generateMultiplicationSvg(table, i);
      if (media) {
        card.media = media;
      }

      cards.push(card);
    }

    return cards;
  }

  /**
   * Génère des réponses alternatives acceptables
   * @param {number} result - Résultat correct
   * @returns {string[]} Alternatives
   */
  generateAlternatives(result) {
    const alts = [String(result)];

    // Ajouter la forme avec espaces (ex: "100" pourrait être écrit "1 00" par erreur)
    // Pas pertinent pour les petits nombres

    return alts;
  }

  /**
   * Génère un SVG "Vue d'ensemble" de la table complète
   * @param {number} table - Numéro de la table
   * @returns {string} SVG encodé en data URI
   */
  generateTableOverviewSvg(table) {
    const rowHeight = 24;
    const width = 180;
    const height = 11 * rowHeight + 20;
    const padding = 10;

    let rows = '';
    for (let i = 0; i <= 10; i++) {
      const y = padding + i * rowHeight + 16;
      const result = table * i;
      rows += `<text x="${padding}" y="${y}" font-family="monospace" font-size="14" fill="#f8fafc">${table} × ${String(i).padStart(2, ' ')} = ${String(result).padStart(3, ' ')}</text>`;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect x="0" y="0" width="${width}" height="${height}" fill="#1e293b" rx="8"/>
      <text x="${width/2}" y="${padding + 2}" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#8b5cf6" font-weight="bold">Table de ${table}</text>
      <line x1="${padding}" y1="${padding + 8}" x2="${width - padding}" y2="${padding + 8}" stroke="#334155" stroke-width="1"/>
      ${rows}
    </svg>`;

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  /**
   * Génère un deck pour une table spécifique
   * @param {number} table - Numéro de la table
   * @returns {Object} Deck complet
   */
  buildTableDeck(table) {
    const levels = this.getLevelsForTable(table);

    // Ressources spécifiques à cette table
    const deckResources = [...this.commonResources];

    // Image de référence (vue d'ensemble de la table)
    deckResources.push(this.createReferenceImage(
      `Table de ${table}`,
      this.generateTableOverviewSvg(table),
      false
    ));

    // Objectifs d'apprentissage
    deckResources.push(this.createObjectives([
      `Mémoriser la table de ${table}`,
      'Répondre en moins de 3 secondes',
      'Reconnaître les résultats de la table'
    ]));

    // Ajouter une astuce si disponible pour cette table
    if (this.tableTips[table]) {
      deckResources.push(this.createTip(
        `Astuce pour la table de ${table}`,
        this.tableTips[table]
      ));
    }

    return {
      name: `Table de multiplication de ${table}`,
      description: `Table de multiplication par ${table} (${table} × 0 à ${table} × 10)`,
      tags: ['math', 'multiplication', 'calcul-mental', ...levels],
      category: ['sciences', 'maths', 'arithmetique', 'operations-base', 'multiplications'],
      settings: {
        sequential: false, // Mélange aléatoire recommandé
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
      cards: this.generateTable(table)
    };
  }

  /**
   * Génère un SVG de table carrée (Pythagore) pour les multiplications
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
    svg += `<text x="${width/2}" y="${padding + 12}" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#8b5cf6" font-weight="bold">Table de Pythagore</text>`;

    // En-têtes colonnes (au-dessus de la grille, après le titre)
    const colHeaderY = padding + titleHeight + colHeaderHeight/2 + 4;
    svg += `<text x="${padding + rowHeaderWidth/2}" y="${colHeaderY}" text-anchor="middle" font-family="monospace" font-size="10" fill="#94a3b8" font-weight="bold">×</text>`;
    for (let c = 0; c <= 10; c++) {
      const x = padding + rowHeaderWidth + c * cellSize + cellSize/2;
      svg += `<text x="${x}" y="${colHeaderY}" text-anchor="middle" font-family="monospace" font-size="10" fill="#f97316" font-weight="bold">${c}</text>`;
    }

    // Grille de données (en-têtes lignes + cellules)
    const gridStartY = padding + titleHeight + colHeaderHeight;
    for (let r = 0; r <= 10; r++) {
      const y = gridStartY + r * cellSize + cellSize/2 + 4;
      // En-tête ligne (à gauche)
      svg += `<text x="${padding + rowHeaderWidth/2}" y="${y}" text-anchor="middle" font-family="monospace" font-size="10" fill="#f97316" font-weight="bold">${r}</text>`;

      // Cellules
      for (let c = 0; c <= 10; c++) {
        const x = padding + rowHeaderWidth + c * cellSize + cellSize/2;
        const result = r * c;
        // Colorer différemment les carrés parfaits
        const isSquare = r === c;
        const color = isSquare ? '#22c55e' : '#f8fafc';
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
   * Génère le deck complet (toutes les tables, 121 cartes)
   */
  buildCompleteTableDeck() {
    const allCards = [];

    // Générer toutes les combinaisons 1-10 × 1-10 (sans les 0)
    for (let a = 1; a <= 10; a++) {
      for (let b = 1; b <= 10; b++) {
        const result = a * b;
        const card = {
          id: `mult_complete_${a}x${b}`,
          question: `${a} × ${b} = ?`,
          answer: String(result)
        };
        // SVG seulement pour petites multiplications
        if (result <= 50) {
          const media = this.generateMultiplicationSvg(a, b);
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
        'Table de Pythagore',
        this.generateSquareTableSvg(),
        false
      ),
      this.createObjectives([
        'Maîtriser toutes les tables de 1 à 10',
        'Répondre en moins de 3 secondes',
        'Reconnaître les carrés parfaits (1, 4, 9, 16, ...)'
      ]),
      this.createTip(
        'Commutativité',
        `La multiplication est commutative : 3 × 7 = 7 × 3 = 21

En connaissant cette propriété, il suffit d'apprendre la moitié des combinaisons !`
      )
    ];

    return {
      name: 'Tables de multiplication (complètes)',
      description: 'Toutes les tables de 1 à 10 (100 cartes mélangées)',
      tags: ['math', 'multiplication', 'calcul-mental', 'ce2', 'cm1', 'revision'],
      category: ['sciences', 'maths', 'arithmetique', 'operations-base', 'multiplications'],
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
   * Override: Génère plusieurs decks (un par table + table complète)
   */
  buildDecks(options = {}) {
    const decks = [];

    // Générer les 11 tables (0 à 10)
    for (let table = 0; table <= 10; table++) {
      decks.push(this.buildTableDeck(table));
    }

    // Ajouter le deck complet
    decks.push(this.buildCompleteTableDeck());

    return decks;
  }

  /**
   * Génère toutes les cartes (utilisé si buildDeck() est appelé directement)
   */
  generate(options = {}) {
    const cards = [];
    for (let table = 0; table <= 10; table++) {
      cards.push(...this.generateTable(table));
    }
    return cards;
  }
}

module.exports = MultiplicationGenerator;
