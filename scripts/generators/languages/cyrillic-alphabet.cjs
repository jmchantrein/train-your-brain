/**
 * Générateur de l'alphabet cyrillique russe
 *
 * Génère des decks pour :
 * - Lettres cyrilliques (33 lettres)
 * - Majuscules et minuscules
 * - Prononciation
 *
 * Niveau: autodidacte, débutant russe
 */

const BaseGenerator = require('../base-generator.cjs');

class CyrillicAlphabetGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'cyrillic-alphabet',
      name: 'Alphabet cyrillique (russe)',
      tags: ['langues', 'russe', 'alphabet', 'cyrillique'],
      version: '1.0.0',
      description: 'Les 33 lettres de l\'alphabet russe'
    });

    // Alphabet russe complet
    this.letters = [
      { upper: 'А', lower: 'а', name: 'a', sound: 'a', similar: 'A latin' },
      { upper: 'Б', lower: 'б', name: 'bé', sound: 'b', similar: '' },
      { upper: 'В', lower: 'в', name: 'vé', sound: 'v', similar: 'B inversé' },
      { upper: 'Г', lower: 'г', name: 'gué', sound: 'g', similar: '' },
      { upper: 'Д', lower: 'д', name: 'dé', sound: 'd', similar: '' },
      { upper: 'Е', lower: 'е', name: 'ié', sound: 'ye/e', similar: 'E latin' },
      { upper: 'Ё', lower: 'ё', name: 'io', sound: 'yo', similar: '' },
      { upper: 'Ж', lower: 'ж', name: 'jé', sound: 'j (jeu)', similar: '' },
      { upper: 'З', lower: 'з', name: 'zé', sound: 'z', similar: '3 inversé' },
      { upper: 'И', lower: 'и', name: 'i', sound: 'i', similar: 'N inversé' },
      { upper: 'Й', lower: 'й', name: 'i bref', sound: 'y', similar: '' },
      { upper: 'К', lower: 'к', name: 'ka', sound: 'k', similar: 'K latin' },
      { upper: 'Л', lower: 'л', name: 'él', sound: 'l', similar: '' },
      { upper: 'М', lower: 'м', name: 'ém', sound: 'm', similar: 'M latin' },
      { upper: 'Н', lower: 'н', name: 'én', sound: 'n', similar: 'H latin' },
      { upper: 'О', lower: 'о', name: 'o', sound: 'o', similar: 'O latin' },
      { upper: 'П', lower: 'п', name: 'pé', sound: 'p', similar: 'Pi grec' },
      { upper: 'Р', lower: 'р', name: 'ér', sound: 'r', similar: 'P latin' },
      { upper: 'С', lower: 'с', name: 'és', sound: 's', similar: 'C latin' },
      { upper: 'Т', lower: 'т', name: 'té', sound: 't', similar: 'T latin' },
      { upper: 'У', lower: 'у', name: 'ou', sound: 'ou', similar: 'Y latin' },
      { upper: 'Ф', lower: 'ф', name: 'éf', sound: 'f', similar: 'Phi grec' },
      { upper: 'Х', lower: 'х', name: 'kha', sound: 'kh (jota)', similar: 'X latin' },
      { upper: 'Ц', lower: 'ц', name: 'tsé', sound: 'ts', similar: '' },
      { upper: 'Ч', lower: 'ч', name: 'tché', sound: 'tch', similar: '' },
      { upper: 'Ш', lower: 'ш', name: 'cha', sound: 'ch', similar: '' },
      { upper: 'Щ', lower: 'щ', name: 'chtcha', sound: 'chtch', similar: '' },
      { upper: 'Ъ', lower: 'ъ', name: 'signe dur', sound: '(pause)', similar: '' },
      { upper: 'Ы', lower: 'ы', name: 'y', sound: 'y dur', similar: '' },
      { upper: 'Ь', lower: 'ь', name: 'signe mou', sound: '(mouillure)', similar: '' },
      { upper: 'Э', lower: 'э', name: 'é', sound: 'é', similar: 'E inversé' },
      { upper: 'Ю', lower: 'ю', name: 'iou', sound: 'you', similar: '' },
      { upper: 'Я', lower: 'я', name: 'ia', sound: 'ya', similar: 'R inversé' }
    ];

    // Lettres similaires au latin (faux amis)
    this.falseAmis = [
      { cyrillic: 'В', latin: 'B', realSound: 'v', trap: 'ressemble à B mais se lit V' },
      { cyrillic: 'Н', latin: 'H', realSound: 'n', trap: 'ressemble à H mais se lit N' },
      { cyrillic: 'Р', latin: 'P', realSound: 'r', trap: 'ressemble à P mais se lit R' },
      { cyrillic: 'С', latin: 'C', realSound: 's', trap: 'ressemble à C mais se lit S' },
      { cyrillic: 'У', latin: 'Y', realSound: 'ou', trap: 'ressemble à Y mais se lit OU' },
      { cyrillic: 'Х', latin: 'X', realSound: 'kh', trap: 'ressemble à X mais se lit KH' }
    ];
  }

  /**
   * Génère les cartes pour les lettres
   * @returns {Object[]} Cartes
   */
  generateLetterCards() {
    const cards = [];

    for (let i = 0; i < this.letters.length; i++) {
      const letter = this.letters[i];

      // Lettre → Prononciation
      cards.push({
        id: `cyrillic_${i}_to_sound`,
        question: `Comment se prononce "${letter.lower}" en russe ?`,
        answer: letter.sound,
        feedback: `${letter.lower} (${letter.upper}) : ${letter.name} - se prononce "${letter.sound}"${letter.similar ? ` (ressemble à ${letter.similar})` : ''}`
      });

      // Nom → Lettre
      cards.push({
        id: `cyrillic_${i}_name_to_letter`,
        question: `Quelle lettre russe s'appelle "${letter.name}" ?`,
        answer: letter.lower,
        alternatives: [letter.upper],
        feedback: `${letter.name} : ${letter.lower} (${letter.upper})`
      });

      // Majuscule ↔ Minuscule
      cards.push({
        id: `cyrillic_${i}_case`,
        question: `Majuscule de ${letter.lower} ?`,
        answer: letter.upper,
        feedback: `${letter.lower} → ${letter.upper}`
      });
    }

    return cards;
  }

  /**
   * Génère les cartes pour les faux amis
   * @returns {Object[]} Cartes
   */
  generateFalseAmisCards() {
    const cards = [];

    for (const fa of this.falseAmis) {
      cards.push({
        id: `cyrillic_faux_ami_${fa.cyrillic}`,
        question: `La lettre russe "${fa.cyrillic}" ressemble à "${fa.latin}" latin. Comment se prononce-t-elle vraiment ?`,
        answer: fa.realSound,
        feedback: `${fa.trap}`
      });
    }

    return cards;
  }

  /**
   * Génère le deck principal
   */
  buildMainDeck() {
    return {
      name: 'Alphabet cyrillique russe',
      description: 'Les 33 lettres de l\'alphabet russe',
      tags: ['langues', 'russe', 'alphabet', 'cyrillique', 'ru-alphabet', 'autodidacte'],
      settings: {
        sequential: true, // Ordre alphabétique russe
        bidirectional: false
      },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'main' }
        }
      },
      cards: this.generateLetterCards()
    };
  }

  /**
   * Génère le deck des faux amis
   */
  buildFalseAmisDeck() {
    return {
      name: 'Cyrillique - Faux amis',
      description: 'Lettres cyrilliques ressemblant au latin',
      tags: ['langues', 'russe', 'alphabet', 'cyrillique', 'ru-alphabet', 'autodidacte'],
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
          parameters: { type: 'false-amis' }
        }
      },
      cards: this.generateFalseAmisCards()
    };
  }

  /**
   * Override: Génère plusieurs decks
   */
  buildDecks(options = {}) {
    return [
      this.buildMainDeck(),
      this.buildFalseAmisDeck()
    ];
  }

  /**
   * Génère toutes les cartes
   */
  generate(options = {}) {
    return [
      ...this.generateLetterCards(),
      ...this.generateFalseAmisCards()
    ];
  }
}

module.exports = CyrillicAlphabetGenerator;
