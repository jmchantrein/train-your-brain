/**
 * Générateur de verbes irréguliers anglais
 *
 * Génère plusieurs decks par niveau de fréquence :
 * - Niveau 1 : verbes les plus fréquents (30 verbes)
 * - Niveau 2 : verbes fréquents (30 verbes)
 * - Niveau 3 : verbes moins fréquents (70+ verbes)
 *
 * Types de questions:
 * - Base → Prétérit
 * - Base → Participe passé
 * - Prétérit → Base
 * - Traduction FR → EN (base form)
 */

const path = require('path');
const BaseGenerator = require('../base-generator.cjs');

class IrregularEnGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'irregular-en',
      name: 'Verbes irréguliers anglais',
      tags: ['langues', 'anglais', 'verbes', 'grammaire'],
      version: '1.0.0',
      description: 'Verbes irréguliers anglais avec prétérit et participe passé'
    });

    // Charger les données
    this.verbs = require('../data/verbs-en-irregular.json');

    // Configuration par niveau de fréquence
    this.frequencyConfig = {
      1: { name: 'Verbes essentiels' },
      2: { name: 'Verbes courants' },
      3: { name: 'Verbes avancés' }
    };
  }

  /**
   * Génère les cartes pour un verbe
   * @param {Object} verb - Données du verbe
   * @returns {Object[]} Cartes pour ce verbe
   */
  generateVerbCards(verb) {
    const cards = [];
    const verbId = verb.base.replace(/\s+/g, '_');

    // Base → Prétérit
    cards.push({
      id: `irreg_${verbId}_to_past`,
      question: `Quel est le prétérit de "${verb.base}" ?`,
      answer: verb.past,
      feedback: `${verb.base} → ${verb.past} → ${verb.pp} (${verb.fr})`
    });

    // Base → Participe passé
    cards.push({
      id: `irreg_${verbId}_to_pp`,
      question: `Quel est le participe passé de "${verb.base}" ?`,
      answer: verb.pp,
      feedback: `${verb.base} → ${verb.past} → ${verb.pp} (${verb.fr})`
    });

    // Prétérit → Base
    cards.push({
      id: `irreg_${verbId}_from_past`,
      question: `"${verb.past}" est le prétérit de quel verbe ?`,
      answer: verb.base,
      feedback: `${verb.base} → ${verb.past} → ${verb.pp} (${verb.fr})`
    });

    // Français → Anglais (base)
    // Plusieurs verbes peuvent avoir la même traduction (frapper = hit / strike) :
    // la question précise alors le sens, et chaque verbe accepte aussi son synonyme.
    const synonyms = this.verbs.filter(v => v !== verb && v.fr === verb.fr);
    const frLabel = synonyms.length > 0 && verb.frHint ? `${verb.fr} (${verb.frHint})` : verb.fr;
    cards.push({
      id: `irreg_${verbId}_fr_to_en`,
      question: `Comment dit-on "${frLabel}" en anglais ? (infinitif)`,
      answer: verb.base,
      alternatives: [`to ${verb.base}`, ...synonyms.flatMap(v => [v.base, `to ${v.base}`])],
      feedback: `${frLabel} = ${verb.base} (${verb.past}, ${verb.pp})`
    });

    return cards;
  }

  /**
   * Génère un deck pour un niveau de fréquence
   * @param {number} frequency - Niveau de fréquence (1, 2, ou 3)
   * @returns {Object} Deck complet
   */
  buildFrequencyDeck(frequency) {
    const config = this.frequencyConfig[frequency];
    const frequencyVerbs = this.verbs.filter(v => v.frequency === frequency);

    const cards = [];
    for (const verb of frequencyVerbs) {
      cards.push(...this.generateVerbCards(verb));
    }

    return {
      name: `Verbes irréguliers anglais - ${config.name}`,
      description: `${frequencyVerbs.length} verbes irréguliers anglais (niveau ${frequency})`,
      tags: ['langues', 'anglais', 'verbes', 'grammaire', 'en-grammar', 'en-conjugation'],
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
          parameters: { frequency }
        }
      },
      cards
    };
  }

  /**
   * Override: Génère un deck par niveau de fréquence
   */
  buildDecks(options = {}) {
    const decks = [];

    // Un deck par niveau de fréquence
    for (let freq = 1; freq <= 3; freq++) {
      decks.push(this.buildFrequencyDeck(freq));
    }

    return decks;
  }

  /**
   * Génère toutes les cartes
   */
  generate(options = {}) {
    const cards = [];
    for (const verb of this.verbs) {
      cards.push(...this.generateVerbCards(verb));
    }
    return cards;
  }
}

module.exports = IrregularEnGenerator;
