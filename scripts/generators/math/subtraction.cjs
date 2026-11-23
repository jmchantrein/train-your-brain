/**
 * Générateur de tables de soustraction
 *
 * Génère des decks pour le calcul mental :
 * - Tables de soustraction 1-10
 * - Soustractions à trous
 *
 * Niveau: CP à CE2
 */

const BaseGenerator = require('../base-generator.cjs');

class SubtractionGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'subtraction',
      name: 'Tables de soustraction',
      tags: ['math', 'soustraction', 'calcul-mental', 'arithmetique'],
      version: '1.0.0',
      description: 'Tables de soustraction et soustractions à trous'
    });

    // Ressources pédagogiques communes
    this.commonResources = [
      this.createSummary(
        'Qu\'est-ce que la soustraction ?',
        `La **soustraction** est l'opération inverse de l'addition. Elle permet de calculer une différence entre deux nombres.

Par exemple : **8 - 3 = 5** signifie que si on a 8 objets et qu'on en retire 3, il en reste 5.

Les tables de soustraction sont essentielles pour :
- Le calcul mental rapide
- La résolution de problèmes du quotidien
- La préparation aux équations`,
        true
      ),
      this.createWikipediaLink('Soustraction', 'Soustraction'),
      this.createGlossary({
        'Soustraction': 'Opération qui calcule la différence entre deux nombres',
        'Diminuende': 'Le nombre duquel on soustrait (premier terme)',
        'Diminuteur': 'Le nombre que l\'on soustrait (second terme)',
        'Différence': 'Résultat d\'une soustraction',
        'Retenue': 'Report lors d\'une soustraction posée'
      })
    ];
  }

  /**
   * Génère un SVG représentant une soustraction
   * @param {number} total - Nombre initial
   * @param {number} removed - Nombre retiré
   * @returns {Object|null} Objet media ou null si trop grand
   */
  generateSubtractionSvg(total, removed) {
    if (total > 20 || total === 0 || removed === 0 || removed >= total) {
      return null;
    }

    const dotRadius = 5;
    const dotSpacing = 14;
    const padding = 10;
    const cols = 5;
    const rows = Math.ceil(total / cols);

    const width = Math.min(total, cols) * dotSpacing + padding * 2;
    const height = rows * dotSpacing + padding * 2;

    let circles = '';
    for (let i = 0; i < total; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const cx = padding + col * dotSpacing;
      const cy = padding + row * dotSpacing;
      // Les points retirés sont barrés (gris avec une croix)
      const isRemoved = i >= (total - removed);
      if (isRemoved) {
        circles += `<circle cx="${cx}" cy="${cy}" r="${dotRadius}" fill="none" stroke="#ef4444" stroke-width="2"/>`;
        circles += `<line x1="${cx - 3}" y1="${cy - 3}" x2="${cx + 3}" y2="${cy + 3}" stroke="#ef4444" stroke-width="2"/>`;
        circles += `<line x1="${cx + 3}" y1="${cy - 3}" x2="${cx - 3}" y2="${cy + 3}" stroke="#ef4444" stroke-width="2"/>`;
      } else {
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
   * Génère les cartes pour une table de soustraction
   * @param {number} subtrahend - Le nombre à soustraire (1-10)
   * @returns {Object[]} Cartes
   */
  generateTableCards(subtrahend) {
    const cards = [];

    // Table de soustraction de N: on soustrait N de nombres croissants
    // N - N = 0, (N+1) - N = 1, (N+2) - N = 2, ... (N+10) - N = 10
    for (let result = 0; result <= 10; result++) {
      const minuend = subtrahend + result;
      const card = {
        id: `sub_${minuend}_minus_${subtrahend}`,
        question: `${minuend} - ${subtrahend} = ?`,
        answer: String(result)
      };

      const media = this.generateSubtractionSvg(minuend, subtrahend);
      if (media) {
        card.media = media;
      }

      cards.push(card);
    }

    return cards;
  }

  /**
   * Génère les cartes pour les soustractions à trous (compléments)
   * @returns {Object[]} Cartes
   */
  generateHoleSubtractions() {
    const cards = [];

    // 10 - ? = X (pour X de 0 à 10)
    for (let result = 0; result <= 10; result++) {
      const subtrahend = 10 - result;
      cards.push({
        id: `sub_hole_10_${result}`,
        question: `10 - ? = ${result}`,
        answer: String(subtrahend),
        feedback: `10 - ${subtrahend} = ${result}`
      });
    }

    return cards;
  }

  /**
   * Génère un SVG "Vue d'ensemble" de la table de soustraction
   * @param {number} subtrahend - Le nombre à soustraire
   * @returns {string} SVG encodé en data URI
   */
  generateTableOverviewSvg(subtrahend) {
    const rowHeight = 24;
    const width = 180;
    const height = 11 * rowHeight + 20;
    const padding = 10;

    let rows = '';
    for (let result = 0; result <= 10; result++) {
      const y = padding + result * rowHeight + 16;
      const minuend = subtrahend + result;
      rows += `<text x="${padding}" y="${y}" font-family="monospace" font-size="14" fill="#f8fafc">${String(minuend).padStart(2, ' ')} - ${subtrahend} = ${String(result).padStart(2, ' ')}</text>`;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect x="0" y="0" width="${width}" height="${height}" fill="#1e293b" rx="8"/>
      <text x="${width/2}" y="${padding + 2}" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#ef4444" font-weight="bold">Soustraire ${subtrahend}</text>
      <line x1="${padding}" y1="${padding + 8}" x2="${width - padding}" y2="${padding + 8}" stroke="#334155" stroke-width="1"/>
      ${rows}
    </svg>`;

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  /**
   * Génère un deck pour une table spécifique
   */
  buildTableDeck(table) {
    // Tables de soustraction du CP au CE1 (pas de coupure par table)
    const levels = ['cp', 'ce1'];

    const deckResources = [...this.commonResources];

    // Image de référence (vue d'ensemble de la table)
    deckResources.push(this.createReferenceImage(
      `Table de ${table}`,
      this.generateTableOverviewSvg(table),
      false
    ));

    deckResources.push(this.createObjectives([
      `Maîtriser la soustraction de ${table}`,
      'Répondre rapidement sans calculer sur ses doigts',
      'Faire le lien avec les tables d\'addition'
    ]));

    deckResources.push(this.createTip(
      'Lien avec l\'addition',
      `La soustraction est l'inverse de l'addition !

Si 5 + ${table} = ${5 + table}, alors ${5 + table} - ${table} = 5

Connaître ses tables d'addition aide à réussir les soustractions.`
    ));

    return {
      name: `Table de soustraction de ${table}`,
      description: `Soustraire ${table} (${table} - ${table} à ${table + 10} - ${table})`,
      tags: ['math', 'soustraction', 'calcul-mental', ...levels],
      category: ['sciences', 'maths', 'arithmetique', 'operations-base', 'soustractions'],
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
   * Génère le deck des soustractions à trous
   */
  buildHoleSubtractionsDeck() {
    const deckResources = [
      this.createSummary(
        'Les soustractions à trous',
        `Les **soustractions à trous** demandent de trouver le nombre manquant.

Par exemple : **10 - ? = 7** → Il faut trouver 3

C'est un excellent exercice pour :
- Renforcer la compréhension de la soustraction
- Préparer la résolution d'équations
- Développer le raisonnement inverse`,
        true
      ),
      this.createObjectives([
        'Trouver rapidement le nombre manquant',
        'Comprendre la relation entre les termes',
        'Préparer les équations du type a - x = b'
      ])
    ];

    return {
      name: 'Soustractions à trous',
      description: 'Trouver le nombre manquant (10 - ? = X)',
      tags: ['math', 'soustraction', 'calcul-mental', 'cp'],
      category: ['sciences', 'maths', 'arithmetique', 'operations-base', 'soustractions'],
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
          parameters: { type: 'hole-subtractions' }
        }
      },
      resources: deckResources,
      cards: this.generateHoleSubtractions()
    };
  }

  /**
   * Génère un SVG de table carrée pour les soustractions
   * Affiche: ligne=résultat, colonne=soustracteur, cellule=minuend
   * Pour lire: minuend - soustracteur = résultat
   * @returns {string} SVG encodé en data URI
   */
  generateSquareTableSvg() {
    const cellSize = 28;
    const rowHeaderWidth = 24;  // Largeur colonne en-têtes lignes (à gauche)
    const colHeaderHeight = 20; // Hauteur ligne en-têtes colonnes (au-dessus)
    const titleHeight = 22;     // Espace pour le titre
    const padding = 5;
    const tableSize = 10; // 1-10

    const width = rowHeaderWidth + tableSize * cellSize + padding * 2;
    const height = titleHeight + colHeaderHeight + tableSize * cellSize + padding * 2;

    let svg = `<rect x="0" y="0" width="${width}" height="${height}" fill="#1e293b" rx="8"/>`;

    // Titre (tout en haut)
    svg += `<text x="${width/2}" y="${padding + 12}" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#ef4444" font-weight="bold">Table de soustraction</text>`;

    // En-têtes colonnes = soustracteurs (ce qu'on enlève: -1, -2, ..., -10)
    const colHeaderY = padding + titleHeight + colHeaderHeight/2 + 4;
    svg += `<text x="${padding + rowHeaderWidth/2}" y="${colHeaderY}" text-anchor="middle" font-family="monospace" font-size="10" fill="#94a3b8" font-weight="bold">−</text>`;
    for (let sub = 1; sub <= 10; sub++) {
      const x = padding + rowHeaderWidth + (sub-1) * cellSize + cellSize/2;
      svg += `<text x="${x}" y="${colHeaderY}" text-anchor="middle" font-family="monospace" font-size="10" fill="#ef4444" font-weight="bold">-${sub}</text>`;
    }

    // Grille de données
    // Lignes = résultats (0-9), Colonnes = soustracteurs, Cellules = minuends
    const gridStartY = padding + titleHeight + colHeaderHeight;
    for (let result = 0; result <= 9; result++) {
      const y = gridStartY + result * cellSize + cellSize/2 + 4;
      // En-tête ligne = résultat (à gauche)
      svg += `<text x="${padding + rowHeaderWidth/2}" y="${y}" text-anchor="middle" font-family="monospace" font-size="10" fill="#22c55e" font-weight="bold">=${result}</text>`;

      // Cellules = minuends (le nombre de départ)
      for (let sub = 1; sub <= 10; sub++) {
        const x = padding + rowHeaderWidth + (sub-1) * cellSize + cellSize/2;
        const minuend = result + sub; // minuend - sub = result
        svg += `<text x="${x}" y="${y}" text-anchor="middle" font-family="monospace" font-size="9" fill="#f8fafc">${minuend}</text>`;
      }
    }

    // Lignes de grille
    for (let i = 0; i <= tableSize; i++) {
      const x = padding + rowHeaderWidth + i * cellSize;
      const y = gridStartY + i * cellSize;
      svg += `<line x1="${padding + rowHeaderWidth}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#334155" stroke-width="0.5"/>`;
      svg += `<line x1="${x}" y1="${gridStartY}" x2="${x}" y2="${height - padding}" stroke="#334155" stroke-width="0.5"/>`;
    }

    const svgFull = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${svg}</svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svgFull).toString('base64')}`;
  }

  /**
   * Génère le deck complet (100 cartes mélangées)
   */
  buildCompleteTableDeck() {
    const allCards = [];

    // Générer toutes les combinaisons a - b où a,b ∈ [1,10] et a >= b
    for (let a = 1; a <= 20; a++) {
      for (let b = 1; b <= 10; b++) {
        if (a >= b && a <= b + 10) {
          const result = a - b;
          const card = {
            id: `sub_complete_${a}-${b}`,
            question: `${a} - ${b} = ?`,
            answer: String(result)
          };
          // SVG pour visualisation
          if (a <= 20) {
            const media = this.generateSubtractionSvg(a, b);
            if (media) card.media = media;
          }
          allCards.push(card);
        }
      }
    }

    // Mélanger les cartes (Fisher-Yates à graine fixe)
    allCards.splice(0, allCards.length, ...this.shuffle(allCards, 'cards'));

    const deckResources = [
      ...this.commonResources,
      this.createReferenceImage(
        'Table de soustraction',
        this.generateSquareTableSvg(),
        false
      ),
      this.createObjectives([
        'Maîtriser toutes les soustractions de 1 à 10',
        'Répondre en moins de 2 secondes',
        'Faire le lien avec les additions (opération inverse)'
      ]),
      this.createTip(
        'Relation avec l\'addition',
        `La soustraction est l'inverse de l'addition :

Si 7 + 3 = 10, alors 10 - 3 = 7 et 10 - 7 = 3

Connaître les tables d'addition aide beaucoup !`
      )
    ];

    return {
      name: 'Tables de soustraction (complètes)',
      description: `Toutes les soustractions de 1 à 10 (${allCards.length} cartes mélangées)`,
      tags: ['math', 'soustraction', 'calcul-mental', 'cp', 'ce1', 'revision'],
      category: ['sciences', 'maths', 'arithmetique', 'operations-base', 'soustractions'],
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

    // Soustractions à trous
    decks.push(this.buildHoleSubtractionsDeck());

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
    cards.push(...this.generateHoleSubtractions());
    return cards;
  }
}

module.exports = SubtractionGenerator;
