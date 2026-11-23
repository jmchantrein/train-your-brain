/**
 * Générateur de notes et intervalles musicaux
 *
 * Génère des decks pour :
 * - Notes sur la portée (clé de sol et clé de fa)
 * - Noms de notes (français, anglais, allemand)
 * - Intervalles musicaux
 * - Armures (dièses et bémols)
 *
 * Niveau: autodidacte, débutant musique
 */

const BaseGenerator = require('../base-generator.cjs');

class NotesIntervalsGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'notes-intervals',
      name: 'Notes et intervalles',
      tags: ['musique', 'solfege', 'notes', 'intervalles'],
      version: '1.0.0',
      description: 'Théorie musicale de base'
    });

    // Notes de musique dans différents systèmes
    this.notesSystems = {
      french: ['do', 'ré', 'mi', 'fa', 'sol', 'la', 'si'],
      english: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
      german: ['C', 'D', 'E', 'F', 'G', 'A', 'H']
    };

    // Intervalles musicaux
    this.intervals = [
      { semitones: 0, name: 'unisson', quality: 'juste' },
      { semitones: 1, name: 'seconde mineure', quality: 'mineur' },
      { semitones: 2, name: 'seconde majeure', quality: 'majeur' },
      { semitones: 3, name: 'tierce mineure', quality: 'mineur' },
      { semitones: 4, name: 'tierce majeure', quality: 'majeur' },
      { semitones: 5, name: 'quarte juste', quality: 'juste' },
      { semitones: 6, name: 'triton', quality: 'augmenté' },
      { semitones: 7, name: 'quinte juste', quality: 'juste' },
      { semitones: 8, name: 'sixte mineure', quality: 'mineur' },
      { semitones: 9, name: 'sixte majeure', quality: 'majeur' },
      { semitones: 10, name: 'septième mineure', quality: 'mineur' },
      { semitones: 11, name: 'septième majeure', quality: 'majeur' },
      { semitones: 12, name: 'octave', quality: 'juste' }
    ];

    // Armures (ordre des dièses et bémols)
    this.sharpOrder = ['fa', 'do', 'sol', 'ré', 'la', 'mi', 'si'];
    this.flatOrder = ['si', 'mi', 'la', 'ré', 'sol', 'do', 'fa'];

    // Tonalités majeures
    this.majorKeys = [
      { sharps: 0, flats: 0, key: 'Do majeur', enKey: 'C major' },
      { sharps: 1, flats: 0, key: 'Sol majeur', enKey: 'G major' },
      { sharps: 2, flats: 0, key: 'Ré majeur', enKey: 'D major' },
      { sharps: 3, flats: 0, key: 'La majeur', enKey: 'A major' },
      { sharps: 4, flats: 0, key: 'Mi majeur', enKey: 'E major' },
      { sharps: 5, flats: 0, key: 'Si majeur', enKey: 'B major' },
      { sharps: 6, flats: 0, key: 'Fa# majeur', enKey: 'F# major' },
      { sharps: 0, flats: 1, key: 'Fa majeur', enKey: 'F major' },
      { sharps: 0, flats: 2, key: 'Si♭ majeur', enKey: 'Bb major' },
      { sharps: 0, flats: 3, key: 'Mi♭ majeur', enKey: 'Eb major' },
      { sharps: 0, flats: 4, key: 'La♭ majeur', enKey: 'Ab major' },
      { sharps: 0, flats: 5, key: 'Ré♭ majeur', enKey: 'Db major' },
      { sharps: 0, flats: 6, key: 'Sol♭ majeur', enKey: 'Gb major' }
    ];
  }

  /**
   * Génère les cartes pour les correspondances de notes
   * @returns {Object[]} Cartes
   */
  generateNoteCorrespondenceCards() {
    const cards = [];
    const french = this.notesSystems.french;
    const english = this.notesSystems.english;

    for (let i = 0; i < 7; i++) {
      // Français → Anglais
      cards.push({
        id: `note_fr_to_en_${i}`,
        question: `"${french[i]}" en notation anglaise ?`,
        answer: english[i],
        feedback: `${french[i]} = ${english[i]}`
      });

      // Anglais → Français
      cards.push({
        id: `note_en_to_fr_${i}`,
        question: `"${english[i]}" en notation française ?`,
        answer: french[i],
        feedback: `${english[i]} = ${french[i]}`
      });
    }

    return cards;
  }

  /**
   * Génère les cartes pour l'ordre des notes
   * @returns {Object[]} Cartes
   */
  generateNoteOrderCards() {
    const cards = [];
    const notes = this.notesSystems.french;

    for (let i = 0; i < 7; i++) {
      const next = notes[(i + 1) % 7];
      const prev = notes[(i + 6) % 7];

      // Note suivante
      cards.push({
        id: `note_next_${i}`,
        question: `Quelle note vient après ${notes[i]} ?`,
        answer: next,
        feedback: `${notes[i]} → ${next}`
      });

      // Note précédente
      cards.push({
        id: `note_prev_${i}`,
        question: `Quelle note vient avant ${notes[i]} ?`,
        answer: prev,
        feedback: `${prev} → ${notes[i]}`
      });
    }

    return cards;
  }

  /**
   * Génère les cartes pour les intervalles
   * @returns {Object[]} Cartes
   */
  generateIntervalCards() {
    const cards = [];

    const semitonLabel = n => `${n} demi-ton${n > 1 ? 's' : ''}`;
    const MASCULINE_INTERVALS = new Set(['unisson', 'triton']);

    for (const interval of this.intervals) {
      const article = MASCULINE_INTERVALS.has(interval.name) ? 'un' : 'une';
      const st = semitonLabel(interval.semitones);
      // Demi-tons → Nom
      cards.push({
        id: `interval_st_${interval.semitones}_to_name`,
        question: `Quel intervalle fait ${st} ?`,
        answer: interval.name,
        feedback: `${st} = ${interval.name}`
      });

      // Nom → Demi-tons
      cards.push({
        id: `interval_name_${interval.semitones}_to_st`,
        question: `Combien de demi-tons dans ${article} ${interval.name} ?`,
        answer: String(interval.semitones),
        feedback: `${interval.name} = ${st}`
      });
    }

    return cards;
  }

  /**
   * Génère les cartes pour l'ordre des altérations
   * @returns {Object[]} Cartes
   */
  generateKeySignatureCards() {
    const cards = [];

    // Ordre des dièses
    cards.push({
      id: 'key_sharp_order',
      question: 'Dans quel ordre apparaissent les dièses à l\'armure ?',
      answer: this.sharpOrder.join(', '),
      alternatives: [
        this.sharpOrder.join(' '),
        'fa do sol ré la mi si'
      ],
      feedback: 'Ordre des dièses : Fa Do Sol Ré La Mi Si'
    });

    // Ordre des bémols
    cards.push({
      id: 'key_flat_order',
      question: 'Dans quel ordre apparaissent les bémols à l\'armure ?',
      answer: this.flatOrder.join(', '),
      alternatives: [
        this.flatOrder.join(' '),
        'si mi la ré sol do fa'
      ],
      feedback: 'Ordre des bémols : Si Mi La Ré Sol Do Fa (inverse des dièses)'
    });

    // Tonalités
    for (const key of this.majorKeys) {
      if (key.sharps > 0) {
        cards.push({
          id: `key_sharps_${key.sharps}`,
          question: `Quelle tonalité majeure a ${key.sharps} dièse(s) ?`,
          answer: key.key,
          alternatives: [key.enKey],
          feedback: `${key.sharps} dièse(s) = ${key.key} (${key.enKey})`
        });
      } else if (key.flats > 0) {
        cards.push({
          id: `key_flats_${key.flats}`,
          question: `Quelle tonalité majeure a ${key.flats} bémol(s) ?`,
          answer: key.key,
          alternatives: [key.enKey],
          feedback: `${key.flats} bémol(s) = ${key.key} (${key.enKey})`
        });
      }
    }

    return cards;
  }

  /**
   * Génère le deck des notes
   */
  buildNotesDeck() {
    return {
      name: 'Musique - Notes',
      description: 'Noms des notes en français et anglais',
      tags: ['musique', 'solfege', 'notes', 'autodidacte'],
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
          parameters: { type: 'notes' }
        }
      },
      cards: [
        ...this.generateNoteCorrespondenceCards(),
        ...this.generateNoteOrderCards()
      ]
    };
  }

  /**
   * Génère le deck des intervalles
   */
  buildIntervalsDeck() {
    return {
      name: 'Musique - Intervalles',
      description: 'Intervalles musicaux et demi-tons',
      tags: ['musique', 'solfege', 'intervalles', 'autodidacte'],
      settings: {
        sequential: true, // Ordre croissant
        bidirectional: false
      },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'intervals' }
        }
      },
      cards: this.generateIntervalCards()
    };
  }

  /**
   * Génère le deck des armures
   */
  buildKeySignaturesDeck() {
    return {
      name: 'Musique - Armures',
      description: 'Armures et tonalités majeures',
      tags: ['musique', 'solfege', 'armures', 'tonalites', 'autodidacte'],
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
          parameters: { type: 'key-signatures' }
        }
      },
      cards: this.generateKeySignatureCards()
    };
  }

  /**
   * Override: Génère plusieurs decks
   */
  buildDecks(options = {}) {
    return [
      this.buildNotesDeck(),
      this.buildIntervalsDeck(),
      this.buildKeySignaturesDeck()
    ];
  }

  /**
   * Génère toutes les cartes
   */
  generate(options = {}) {
    return [
      ...this.generateNoteCorrespondenceCards(),
      ...this.generateNoteOrderCards(),
      ...this.generateIntervalCards(),
      ...this.generateKeySignatureCards()
    ];
  }
}

module.exports = NotesIntervalsGenerator;
