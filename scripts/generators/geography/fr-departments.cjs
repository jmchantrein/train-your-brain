/**
 * Générateur des départements français
 *
 * Génère des decks pour :
 * - Numéro → Nom du département
 * - Nom → Numéro
 * - Département → Préfecture
 * - Préfecture → Département
 * - Département → Région
 *
 * Niveau: CM1-CM2 (France métropolitaine), collège (complet)
 */

const path = require('path');
const BaseGenerator = require('../base-generator.cjs');

class FrDepartmentsGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'fr-departments',
      name: 'Départements français',
      tags: ['geographie', 'france', 'departements', 'culture-generale'],
      version: '1.0.0',
      description: 'Départements français avec préfectures et régions'
    });

    // Charger les données
    this.departments = require('../data/fr-departments.json');
  }

  /**
   * Génère les cartes numéro ↔ nom
   * @param {Object[]} depts - Liste des départements
   * @returns {Object[]} Cartes
   */
  generateNumberNameCards(depts) {
    const cards = [];

    for (const dept of depts) {
      // Numéro → Nom
      cards.push({
        id: `dept_${dept.code}_num_to_name`,
        question: `Département n°${dept.code} ?`,
        answer: dept.name,
        feedback: `Le département ${dept.code} est ${dept.name} (préfecture: ${dept.prefecture}).`
      });

      // Nom → Numéro
      cards.push({
        id: `dept_${dept.code}_name_to_num`,
        question: `Numéro du département ${dept.name} ?`,
        answer: dept.code,
        feedback: `${dept.name} est le département n°${dept.code}.`
      });
    }

    return cards;
  }

  /**
   * Génère les cartes département ↔ préfecture
   * @param {Object[]} depts - Liste des départements
   * @returns {Object[]} Cartes
   */
  generatePrefectureCards(depts) {
    const cards = [];

    for (const dept of depts) {
      // Département → Préfecture
      cards.push({
        id: `dept_${dept.code}_to_pref`,
        question: `Préfecture de ${dept.name} ?`,
        answer: dept.prefecture,
        feedback: `${dept.prefecture} est la préfecture de ${dept.name} (${dept.code}).`
      });

      // Préfecture → Département
      cards.push({
        id: `dept_${dept.code}_from_pref`,
        question: `${dept.prefecture} est la préfecture de quel département ?`,
        answer: dept.name,
        alternatives: [dept.code],
        feedback: `${dept.prefecture} est la préfecture de ${dept.name} (${dept.code}).`
      });
    }

    return cards;
  }

  /**
   * Génère les cartes département → région
   * @param {Object[]} depts - Liste des départements
   * @returns {Object[]} Cartes
   */
  generateRegionCards(depts) {
    const cards = [];

    for (const dept of depts) {
      cards.push({
        id: `dept_${dept.code}_to_region`,
        question: `Dans quelle région se trouve ${dept.name} ?`,
        answer: dept.region,
        feedback: `${dept.name} (${dept.code}) est dans la région ${dept.region}.`
      });
    }

    return cards;
  }

  /**
   * Sépare les départements métropolitains et d'outre-mer
   */
  splitDepartments() {
    const metropolitan = this.departments.filter(d => !d.code.startsWith('97'));
    const overseas = this.departments.filter(d => d.code.startsWith('97'));
    return { metropolitan, overseas };
  }

  /**
   * Génère le deck numéros ↔ noms (métropole)
   */
  buildNumbersMetroDeck() {
    const { metropolitan } = this.splitDepartments();

    return {
      name: 'Départements - Numéros (Métropole)',
      description: 'Numéros et noms des départements métropolitains (96)',
      tags: ['geographie', 'france', 'departements', 'culture-generale'],
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
          parameters: { type: 'numbers-metro' }
        }
      },
      cards: this.generateNumberNameCards(metropolitan)
    };
  }

  /**
   * Génère le deck préfectures (métropole)
   */
  buildPrefecturesMetroDeck() {
    const { metropolitan } = this.splitDepartments();

    return {
      name: 'Départements - Préfectures (Métropole)',
      description: 'Préfectures des départements métropolitains',
      tags: ['geographie', 'france', 'departements', 'prefectures', 'culture-generale'],
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
          parameters: { type: 'prefectures-metro' }
        }
      },
      cards: this.generatePrefectureCards(metropolitan)
    };
  }

  /**
   * Génère le deck régions
   */
  buildRegionsDeck() {
    return {
      name: 'Départements - Régions',
      description: 'Associer chaque département à sa région',
      tags: ['geographie', 'france', 'departements', 'regions', 'culture-generale', 'cinquieme'],
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
          parameters: { type: 'regions' }
        }
      },
      cards: this.generateRegionCards(this.departments)
    };
  }

  /**
   * Génère le deck outre-mer
   */
  buildOverseasDeck() {
    const { overseas } = this.splitDepartments();

    const cards = [
      ...this.generateNumberNameCards(overseas),
      ...this.generatePrefectureCards(overseas)
    ];

    return {
      name: 'Départements d\'Outre-Mer (DROM)',
      description: 'Départements et régions d\'outre-mer',
      tags: ['geographie', 'france', 'departements', 'outre-mer', 'culture-generale', 'cinquieme'],
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
          parameters: { type: 'overseas' }
        }
      },
      cards
    };
  }

  /**
   * Override: Génère plusieurs decks
   */
  buildDecks(options = {}) {
    return [
      this.buildNumbersMetroDeck(),
      this.buildPrefecturesMetroDeck(),
      this.buildRegionsDeck(),
      this.buildOverseasDeck()
    ];
  }

  /**
   * Génère toutes les cartes
   */
  generate(options = {}) {
    return [
      ...this.generateNumberNameCards(this.departments),
      ...this.generatePrefectureCards(this.departments),
      ...this.generateRegionCards(this.departments)
    ];
  }
}

module.exports = FrDepartmentsGenerator;
