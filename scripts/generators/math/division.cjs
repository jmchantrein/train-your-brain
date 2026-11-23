/**
 * Générateur de tables de division
 *
 * Génère des decks pour le calcul mental :
 * - Tables de division 1-10
 * - Divisions exactes
 *
 * Niveau: CE1 à CM2
 */

const BaseGenerator = require('../base-generator.cjs');

class DivisionGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'division',
      name: 'Tables de division',
      tags: ['math', 'division', 'calcul-mental', 'arithmetique'],
      version: '1.0.0',
      description: 'Tables de division et divisions exactes'
    });

    // Niveaux scolaires des tables de division : réciproque des tables de
    // multiplication, introduite au CE2 et posée au CM1 (même plage pour toutes les tables)
    this.levels = ['ce2', 'cm1'];

    // Ressources pédagogiques communes
    this.commonResources = [
      this.createSummary(
        'Qu\'est-ce que la division ?',
        `La **division** est l'opération inverse de la multiplication. Elle permet de partager une quantité en parts égales ou de savoir combien de fois un nombre est contenu dans un autre.

Par exemple : **12 ÷ 4 = 3** signifie que 12 partagé en 4 parts égales donne 3 par part.

Les tables de division sont essentielles pour :
- Le calcul mental rapide
- Les fractions et pourcentages
- La résolution de problèmes`,
        true
      ),
      this.createWikipediaLink('Division', 'Division'),
      this.createGlossary({
        'Division': 'Opération qui partage un nombre en parts égales',
        'Dividende': 'Le nombre que l\'on divise',
        'Diviseur': 'Le nombre par lequel on divise',
        'Quotient': 'Résultat d\'une division',
        'Reste': 'Ce qui reste quand la division n\'est pas exacte'
      })
    ];

    // Astuces par table
    this.tableTips = {
      1: 'Tout nombre divisé par 1 reste inchangé.',
      2: 'Diviser par 2, c\'est trouver la moitié. Un nombre est divisible par 2 s\'il est pair.',
      5: 'Diviser par 5 : un nombre est divisible par 5 s\'il se termine par 0 ou 5.',
      9: 'Un nombre est divisible par 9 si la somme de ses chiffres est divisible par 9.',
      10: 'Diviser par 10 revient à enlever un 0 (ou déplacer la virgule).'
    };
  }

  /**
   * Génère un SVG représentant une division (partage en groupes)
   * @param {number} total - Nombre total
   * @param {number} groups - Nombre de groupes
   * @returns {Object|null} Objet media ou null si trop grand
   */
  generateDivisionSvg(total, groups) {
    if (total > 30 || groups === 0 || total === 0 || groups > 10) {
      return null;
    }

    const perGroup = total / groups;
    if (!Number.isInteger(perGroup)) return null;

    const dotRadius = 4;
    const dotSpacing = 12;
    const groupSpacing = 8;
    const padding = 10;

    // Disposition : groupes côte à côte, chaque groupe en colonne
    const width = groups * (dotSpacing + groupSpacing) + padding * 2;
    const height = perGroup * dotSpacing + padding * 2;

    // Couleurs pour les groupes
    const colors = ['#8b5cf6', '#f97316', '#22c55e', '#3b82f6', '#ec4899',
                    '#14b8a6', '#f59e0b', '#6366f1', '#84cc16', '#ef4444'];

    let circles = '';
    for (let g = 0; g < groups; g++) {
      const color = colors[g % colors.length];
      for (let i = 0; i < perGroup; i++) {
        const cx = padding + g * (dotSpacing + groupSpacing);
        const cy = padding + i * dotSpacing;
        circles += `<circle cx="${cx}" cy="${cy}" r="${dotRadius}" fill="${color}"/>`;
      }
    }

    return {
      type: 'image',
      format: 'svg',
      data: `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${circles}</svg>`
    };
  }

  /**
   * Génère les cartes pour une table de division
   * @param {number} divisor - Le diviseur (1-10)
   * @returns {Object[]} Cartes de la table
   */
  generateTable(divisor) {
    const cards = [];

    for (let quotient = 0; quotient <= 10; quotient++) {
      const dividend = divisor * quotient;
      const card = {
        id: `div_${dividend}_by_${divisor}`,
        question: `${dividend} ÷ ${divisor} = ?`,
        answer: String(quotient)
      };

      // Ajouter représentation visuelle SVG si possible
      if (quotient > 0 && dividend <= 30) {
        const media = this.generateDivisionSvg(dividend, divisor);
        if (media) {
          card.media = media;
        }
      }

      cards.push(card);
    }

    return cards;
  }

  /**
   * Génère un SVG "Vue d'ensemble" de la table de division
   * @param {number} divisor - Le diviseur
   * @returns {string} SVG encodé en data URI
   */
  generateTableOverviewSvg(divisor) {
    const rowHeight = 24;
    const width = 200;
    const height = 11 * rowHeight + 20;
    const padding = 10;

    let rows = '';
    for (let quotient = 0; quotient <= 10; quotient++) {
      const y = padding + quotient * rowHeight + 16;
      const dividend = divisor * quotient;
      rows += `<text x="${padding}" y="${y}" font-family="monospace" font-size="14" fill="#f8fafc">${String(dividend).padStart(3, ' ')} ÷ ${divisor} = ${String(quotient).padStart(2, ' ')}</text>`;
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
      <rect x="0" y="0" width="${width}" height="${height}" fill="#1e293b" rx="8"/>
      <text x="${width/2}" y="${padding + 2}" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#f97316" font-weight="bold">Diviser par ${divisor}</text>
      <line x1="${padding}" y1="${padding + 8}" x2="${width - padding}" y2="${padding + 8}" stroke="#334155" stroke-width="1"/>
      ${rows}
    </svg>`;

    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  /**
   * Génère un deck pour une table spécifique
   */
  buildTableDeck(divisor) {
    const deckResources = [...this.commonResources];

    // Image de référence (vue d'ensemble de la table)
    deckResources.push(this.createReferenceImage(
      `Diviser par ${divisor}`,
      this.generateTableOverviewSvg(divisor),
      false
    ));

    deckResources.push(this.createObjectives([
      `Mémoriser la table de division par ${divisor}`,
      'Répondre en moins de 3 secondes',
      'Faire le lien avec la table de multiplication correspondante'
    ]));

    if (this.tableTips[divisor]) {
      deckResources.push(this.createTip(
        `Astuce pour diviser par ${divisor}`,
        this.tableTips[divisor]
      ));
    }

    deckResources.push(this.createTip(
      'Lien avec la multiplication',
      `Division et multiplication sont inverses !

Si ${divisor} × 4 = ${divisor * 4}, alors ${divisor * 4} ÷ ${divisor} = 4

Connaître les tables de multiplication aide beaucoup pour les divisions.`
    ));

    return {
      name: `Table de division par ${divisor}`,
      description: `Divisions par ${divisor} (0 ÷ ${divisor} à ${divisor * 10} ÷ ${divisor})`,
      tags: ['math', 'division', 'calcul-mental', ...this.levels],
      category: ['sciences', 'maths', 'arithmetique', 'operations-base', 'divisions'],
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
          parameters: { divisor }
        }
      },
      resources: deckResources,
      cards: this.generateTable(divisor)
    };
  }

  /**
   * Génère un SVG de table carrée pour les divisions
   * Affiche: ligne=diviseur, colonne=quotient, cellule=dividende
   * Pour lire: dividende ÷ diviseur = quotient
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
    svg += `<text x="${width/2}" y="${padding + 12}" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#f97316" font-weight="bold">Table de division</text>`;

    // En-têtes colonnes = quotients (résultats: 1-10)
    const colHeaderY = padding + titleHeight + colHeaderHeight/2 + 4;
    svg += `<text x="${padding + rowHeaderWidth/2}" y="${colHeaderY}" text-anchor="middle" font-family="monospace" font-size="10" fill="#94a3b8" font-weight="bold">÷</text>`;
    for (let q = 1; q <= 10; q++) {
      const x = padding + rowHeaderWidth + (q-1) * cellSize + cellSize/2;
      svg += `<text x="${x}" y="${colHeaderY}" text-anchor="middle" font-family="monospace" font-size="10" fill="#22c55e" font-weight="bold">=${q}</text>`;
    }

    // Grille de données
    // Lignes = diviseurs, Colonnes = quotients, Cellules = dividendes
    const gridStartY = padding + titleHeight + colHeaderHeight;
    for (let divisor = 1; divisor <= 10; divisor++) {
      const y = gridStartY + (divisor-1) * cellSize + cellSize/2 + 4;
      // En-tête ligne = diviseur (à gauche)
      svg += `<text x="${padding + rowHeaderWidth/2}" y="${y}" text-anchor="middle" font-family="monospace" font-size="10" fill="#f97316" font-weight="bold">÷${divisor}</text>`;

      // Cellules = dividendes (ce qu'on divise pour obtenir le quotient)
      for (let quotient = 1; quotient <= 10; quotient++) {
        const x = padding + rowHeaderWidth + (quotient-1) * cellSize + cellSize/2;
        const dividend = divisor * quotient;
        svg += `<text x="${x}" y="${y}" text-anchor="middle" font-family="monospace" font-size="9" fill="#f8fafc">${dividend}</text>`;
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

    // Générer toutes les divisions exactes a ÷ b où a = quotient × b et quotient,b ∈ [1,10]
    for (let quotient = 1; quotient <= 10; quotient++) {
      for (let divisor = 1; divisor <= 10; divisor++) {
        const dividend = quotient * divisor;
        const card = {
          id: `div_complete_${dividend}_${divisor}`,
          question: `${dividend} ÷ ${divisor} = ?`,
          answer: String(quotient)
        };
        // SVG pour visualisation
        if (dividend <= 30) {
          const media = this.generateDivisionSvg(dividend, divisor);
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
        'Table de division',
        this.generateSquareTableSvg(),
        false
      ),
      this.createObjectives([
        'Maîtriser toutes les divisions exactes de 1 à 10',
        'Répondre en moins de 3 secondes',
        'Faire le lien avec les multiplications (opération inverse)'
      ]),
      this.createTip(
        'Relation avec la multiplication',
        `La division est l'inverse de la multiplication :

Si 7 × 8 = 56, alors 56 ÷ 8 = 7 et 56 ÷ 7 = 8

Connaître les tables de multiplication est indispensable !`
      )
    ];

    return {
      name: 'Tables de division (complètes)',
      description: 'Toutes les divisions exactes de 1 à 10 (100 cartes mélangées)',
      tags: ['math', 'division', 'calcul-mental', 'ce2', 'cm1', 'revision'],
      category: ['sciences', 'maths', 'arithmetique', 'operations-base', 'divisions'],
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

    // Générer les tables 1 à 10
    for (let divisor = 1; divisor <= 10; divisor++) {
      decks.push(this.buildTableDeck(divisor));
    }

    // Ajouter le deck complet
    decks.push(this.buildCompleteTableDeck());

    return decks;
  }

  /**
   * Génère toutes les cartes
   */
  generate(options = {}) {
    const cards = [];
    for (let divisor = 1; divisor <= 10; divisor++) {
      cards.push(...this.generateTable(divisor));
    }
    return cards;
  }
}

module.exports = DivisionGenerator;
