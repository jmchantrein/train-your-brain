/**
 * Générateur du tableau périodique
 *
 * Génère plusieurs decks :
 * - Éléments 1-20 (niveau seconde)
 * - Éléments 21-36 (niveau terminale)
 * - Tous les éléments
 * - Par catégorie (métaux alcalins, halogènes, etc.)
 *
 * Types de questions:
 * - Symbole → Nom
 * - Nom → Symbole
 * - Numéro atomique → Élément
 */

const path = require('path');
const BaseGenerator = require('../base-generator.cjs');

class PeriodicTableGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'periodic-table',
      name: 'Tableau périodique',
      tags: ['sciences', 'sciences-physiques', 'chimie', 'tableau-periodique', 'elements'],
      version: '1.0.0',
      description: 'Éléments du tableau périodique'
    });

    // Charger les données
    this.elements = require('../data/elements.json');

    // Configuration par groupe d'éléments
    this.groupConfig = {
      'basic': { start: 1, end: 20, level: 'seconde', name: 'Éléments 1-20' },
      'extended': { start: 21, end: 36, level: null, name: 'Éléments 21-36' },
      'all': { start: 1, end: 118, level: 'licence', name: 'Tous les éléments' }
    };

    // Ressources pédagogiques communes à tous les decks
    this.commonResources = [
      // Illustration générée localement (SVG en data URI) : aucune requête réseau
      this.createReferenceImage(
        'Tableau périodique des éléments',
        this.generatePeriodicTableSvg(),
        false
      ),
      this.createSummary(
        'Qu\'est-ce que le tableau périodique ?',
        `Le **tableau périodique des éléments** est un arrangement systématique des éléments chimiques, classés par **numéro atomique croissant** (nombre de protons).

Les éléments sont organisés en :
- **Lignes (périodes)** : éléments avec le même nombre de couches électroniques
- **Colonnes (groupes)** : éléments aux propriétés chimiques similaires

Créé par **Dmitri Mendeleïev** en 1869, il a permis de prédire l'existence d'éléments inconnus à l'époque.`,
        true
      ),
      this.createWikipediaLink('Tableau périodique des éléments', 'Tableau_périodique_des_éléments'),
      this.createGlossary({
        'Numéro atomique (Z)': 'Nombre de protons dans le noyau d\'un atome',
        'Symbole chimique': 'Abréviation d\'une ou deux lettres (ex: H, He, Na)',
        'Période': 'Ligne horizontale du tableau (même nombre de couches)',
        'Groupe': 'Colonne verticale du tableau (propriétés similaires)',
        'Électronégativité': 'Capacité d\'un atome à attirer les électrons'
      })
    ];
  }

  /**
   * Génère le tableau périodique (18 colonnes + séries f) en SVG, hors-ligne
   * @returns {string} SVG encodé en data URI
   */
  generatePeriodicTableSvg() {
    const cell = 30;
    const left = 8;
    const top = 28;
    const colors = {
      'nonmetal': '#a7d8a0',
      'noble-gas': '#c4b5f4',
      'alkali-metal': '#f4a6a0',
      'alkaline-earth': '#f7c98b',
      'metalloid': '#b9d9d4',
      'halogen': '#f1e38a',
      'post-transition': '#b8c4d6',
      'transition': '#9ec5e8',
      'lanthanide': '#e8b4d6',
      'actinide': '#d9a0c0',
      'unknown': '#d4d4d4'
    };
    const width = left * 2 + cell * 18;
    const height = top + cell * 9.5 + 8;
    let body = `<rect width="${width}" height="${height}" fill="#ffffff"/>`;
    body += `<text x="${width / 2}" y="18" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="#1e293b">Tableau périodique des éléments</text>`;

    const drawCell = (col, row, fill, symbol, number) => {
      const x = left + col * cell;
      const y = top + row * cell;
      body += `<rect x="${x}" y="${y}" width="${cell - 1}" height="${cell - 1}" fill="${fill}" stroke="#475569" stroke-width="0.5"/>`;
      body += `<text x="${x + (cell - 1) / 2}" y="${y + 18}" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="bold" fill="#0f172a">${symbol}</text>`;
      if (number) {
        body += `<text x="${x + 2}" y="${y + 9}" font-family="sans-serif" font-size="6" fill="#334155">${number}</text>`;
      }
    };

    for (const el of this.elements) {
      const color = colors[el.category] || colors.unknown;
      if (el.category === 'lanthanide') {
        drawCell(el.number - 57 + 2, 8.0 - 0.5, color, el.symbol, el.number);
      } else if (el.category === 'actinide') {
        drawCell(el.number - 89 + 2, 9.0 - 0.5, color, el.symbol, el.number);
      } else {
        drawCell(el.group - 1, el.period - 1, color, el.symbol, el.number);
      }
    }
    // Repères des séries f dans le bloc principal
    drawCell(2, 5, colors.lanthanide, '57-71', '');
    drawCell(2, 6, colors.actinide, '89-103', '');

    return this.createSvg(body, width, height);
  }

  /**
   * Génère les cartes pour un élément
   * @param {Object} element - Données de l'élément
   * @returns {Object[]} Cartes pour cet élément
   */
  generateElementCards(element) {
    const cards = [];

    // Symbole → Nom (français)
    cards.push({
      id: `elem_${element.number}_sym_to_name`,
      question: `Quel est le nom de l'élément ${element.symbol} ?`,
      answer: element.name.fr,
      alternatives: [element.name.en],
      feedback: `${element.symbol} est le symbole de ${element.name.fr} (n°${element.number}).`
    });

    // Nom → Symbole
    cards.push({
      id: `elem_${element.number}_name_to_sym`,
      question: `Quel est le symbole chimique de ${element.name.fr} ?`,
      answer: element.symbol,
      feedback: `Le symbole de ${element.name.fr} est ${element.symbol}.`
    });

    // Numéro atomique → Élément (seulement pour les 36 premiers)
    if (element.number <= 36) {
      cards.push({
        id: `elem_${element.number}_num_to_name`,
        question: `Quel élément a le numéro atomique ${element.number} ?`,
        answer: element.name.fr,
        alternatives: [element.symbol, element.name.en],
        feedback: `L'élément n°${element.number} est ${element.name.fr} (${element.symbol}).`
      });
    }

    return cards;
  }

  /**
   * Génère un deck pour un groupe d'éléments
   * @param {string} groupId - Identifiant du groupe (basic, extended, all)
   * @returns {Object} Deck complet
   */
  buildGroupDeck(groupId) {
    const config = this.groupConfig[groupId];
    const groupElements = this.elements.filter(
      e => e.number >= config.start && e.number <= config.end
    );

    const cards = [];
    for (const element of groupElements) {
      cards.push(...this.generateElementCards(element));
    }

    // Objectifs spécifiques au niveau
    const levelObjectives = {
      'basic': [
        'Mémoriser les symboles des 20 premiers éléments',
        'Associer numéro atomique et nom d\'élément',
        'Identifier les éléments les plus courants (H, O, C, N, etc.)'
      ],
      'extended': [
        'Connaître les éléments 21-36 (métaux de transition)',
        'Reconnaître les symboles moins courants',
        'Compléter sa connaissance jusqu\'à 36 éléments'
      ],
      'all': [
        'Maîtriser l\'ensemble du tableau périodique',
        'Reconnaître tous les symboles chimiques',
        'Identifier les lanthanides et actinides'
      ]
    };

    // Ressources spécifiques au deck
    const deckResources = [
      ...this.commonResources,
      this.createObjectives(levelObjectives[groupId] || levelObjectives['basic'])
    ];

    // Astuce mnémotechnique pour le niveau basic
    if (groupId === 'basic') {
      deckResources.push(this.createTip(
        'Astuce mnémotechnique',
        `Pour retenir les 20 premiers éléments dans l'ordre :

**H**ector **He**site. **Li**ttle **Be**rnard **B**oat **C**an **N**ot **O**ffer **F**ree **Ne**cklaces.
**Na**ughty **Mg**gie **Al**ways **Si**ngs **P**opular **S**ongs **Cl**early, **Ar**tistically, **K**ingly, **Ca**refully.

(H, He, Li, Be, B, C, N, O, F, Ne, Na, Mg, Al, Si, P, S, Cl, Ar, K, Ca)`
      ));
    }

    return {
      name: `Tableau périodique - ${config.name}`,
      description: `Éléments chimiques ${config.start} à ${config.end} (${groupElements.length} éléments)`,
      // Éléments 21-36 : hors programme explicite, donc aucun niveau scolaire
      tags: ['sciences', 'sciences-physiques', 'chimie', 'tableau-periodique', 'elements', ...(config.level ? [config.level] : [])],
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
          parameters: { group: groupId }
        }
      },
      resources: deckResources,
      cards
    };
  }

  /**
   * Génère un deck par catégorie d'éléments
   * @param {string} category - Catégorie d'éléments
   * @returns {Object} Deck complet
   */
  buildCategoryDeck(category) {
    const categoryElements = this.elements.filter(e => e.category === category);

    if (categoryElements.length === 0) {
      return null;
    }

    // Noms de catégories en français
    const categoryNamesFr = {
      'alkali-metal': 'Métaux alcalins',
      'alkaline-earth': 'Métaux alcalino-terreux',
      'transition': 'Métaux de transition',
      'post-transition': 'Métaux pauvres',
      'metalloid': 'Métalloïdes',
      'nonmetal': 'Non-métaux',
      'halogen': 'Halogènes',
      'noble-gas': 'Gaz nobles',
      'lanthanide': 'Lanthanides',
      'actinide': 'Actinides',
      'unknown': 'Propriétés inconnues'
    };

    // Descriptions détaillées par catégorie (générées par IA)
    const categoryDescriptions = {
      'alkali-metal': `Les **métaux alcalins** forment le groupe 1 du tableau périodique (colonne de gauche).

Propriétés caractéristiques :
- Très réactifs (réagissent violemment avec l'eau)
- Un seul électron de valence (facile à perdre)
- Mous et peuvent être coupés au couteau
- Stockés dans l'huile pour éviter l'oxydation

Éléments : Li, Na, K, Rb, Cs, Fr`,

      'alkaline-earth': `Les **métaux alcalino-terreux** forment le groupe 2 du tableau périodique.

Propriétés caractéristiques :
- Deux électrons de valence
- Moins réactifs que les alcalins
- Forment des oxydes "terreux"
- Le calcium et le magnésium sont essentiels à la vie

Éléments : Be, Mg, Ca, Sr, Ba, Ra`,

      'halogen': `Les **halogènes** forment le groupe 17 (avant-dernière colonne).

Propriétés caractéristiques :
- Sept électrons de valence (cherchent à en gagner un)
- Très réactifs, surtout le fluor
- Forment des sels avec les métaux (halogen = "formeur de sel")
- Existent à l'état diatomique (F₂, Cl₂, Br₂, I₂)

Éléments : F, Cl, Br, I, At, Ts`,

      'noble-gas': `Les **gaz nobles** (ou gaz rares) forment le groupe 18 (dernière colonne).

Propriétés caractéristiques :
- Couche électronique externe complète
- Très stables et peu réactifs
- Existent sous forme monoatomique
- Utilisés pour l'éclairage (néons), soudage, plongée

Éléments : He, Ne, Ar, Kr, Xe, Rn, Og`
    };

    // Articles Wikipedia par catégorie
    const categoryWikipedia = {
      'alkali-metal': 'Métal_alcalin',
      'alkaline-earth': 'Métal_alcalino-terreux',
      'halogen': 'Halogène',
      'noble-gas': 'Gaz_noble'
    };

    const cards = [];
    for (const element of categoryElements) {
      cards.push(...this.generateElementCards(element));
    }

    // Ressources spécifiques à la catégorie
    const deckResources = [
      ...this.commonResources
    ];

    // Ajouter la description si disponible
    if (categoryDescriptions[category]) {
      deckResources.push(this.createSummary(
        `À propos des ${categoryNamesFr[category]}`,
        categoryDescriptions[category],
        true
      ));
    }

    // Ajouter le lien Wikipedia spécifique
    if (categoryWikipedia[category]) {
      deckResources.push(this.createWikipediaLink(
        categoryNamesFr[category],
        categoryWikipedia[category]
      ));
    }

    // Objectifs
    deckResources.push(this.createObjectives([
      `Identifier les ${categoryElements.length} ${categoryNamesFr[category]}`,
      'Mémoriser leurs symboles chimiques',
      'Comprendre leurs propriétés communes'
    ]));

    return {
      name: `Tableau périodique - ${categoryNamesFr[category] || category}`,
      description: `${categoryNamesFr[category] || category} (${categoryElements.length} éléments)`,
      // Familles chimiques (alcalins, halogènes, gaz nobles) : seconde ; alcalino-terreux : niveau à arbitrer, inchangé
      tags: ['sciences', 'sciences-physiques', 'chimie', 'tableau-periodique', 'elements', category === 'alkaline-earth' ? 'terminale' : 'seconde'],
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
          parameters: { category }
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
    const decks = [];

    // Decks par niveau
    decks.push(this.buildGroupDeck('basic'));
    decks.push(this.buildGroupDeck('extended'));

    // Decks par catégorie (les plus importantes)
    const importantCategories = [
      'alkali-metal',
      'alkaline-earth',
      'halogen',
      'noble-gas'
    ];

    for (const category of importantCategories) {
      const deck = this.buildCategoryDeck(category);
      if (deck && deck.cards.length > 0) {
        decks.push(deck);
      }
    }

    return decks;
  }

  /**
   * Génère toutes les cartes
   */
  generate(options = {}) {
    const cards = [];
    for (const element of this.elements) {
      cards.push(...this.generateElementCards(element));
    }
    return cards;
  }
}

module.exports = PeriodicTableGenerator;
