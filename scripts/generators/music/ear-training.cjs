/**
 * Générateur d'entraînement de l'oreille musicale (ear training)
 *
 * Génère des decks audio-choice pour :
 * - Reconnaissance de notes individuelles
 * - Reconnaissance d'intervalles
 * - Reconnaissance d'accords
 *
 * Utilise le type de carte 'audio-choice' avec Web Audio API
 *
 * Niveau: autodidacte, débutant musique, intermédiaire musique
 */

const BaseGenerator = require('../base-generator.cjs');

class EarTrainingGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'ear-training',
      name: 'Entraînement auditif',
      tags: ['musique', 'ear-training', 'oreille', 'audio'],
      version: '1.0.0',
      description: 'Entraînement de l\'oreille musicale'
    });

    // Notes naturelles (gamme de Do majeur)
    this.naturalNotes = [
      { note: 'C4', nameFr: 'do', nameEn: 'C' },
      { note: 'D4', nameFr: 'ré', nameEn: 'D' },
      { note: 'E4', nameFr: 'mi', nameEn: 'E' },
      { note: 'F4', nameFr: 'fa', nameEn: 'F' },
      { note: 'G4', nameFr: 'sol', nameEn: 'G' },
      { note: 'A4', nameFr: 'la', nameEn: 'A' },
      { note: 'B4', nameFr: 'si', nameEn: 'B' }
    ];

    // Notes chromatiques (12 notes)
    this.chromaticNotes = [
      { note: 'C4', nameFr: 'do', nameEn: 'C' },
      { note: 'C#4', nameFr: 'do#', nameEn: 'C#', altNameFr: 'réb', altNameEn: 'Db' },
      { note: 'D4', nameFr: 'ré', nameEn: 'D' },
      { note: 'D#4', nameFr: 'ré#', nameEn: 'D#', altNameFr: 'mib', altNameEn: 'Eb' },
      { note: 'E4', nameFr: 'mi', nameEn: 'E' },
      { note: 'F4', nameFr: 'fa', nameEn: 'F' },
      { note: 'F#4', nameFr: 'fa#', nameEn: 'F#', altNameFr: 'solb', altNameEn: 'Gb' },
      { note: 'G4', nameFr: 'sol', nameEn: 'G' },
      { note: 'G#4', nameFr: 'sol#', nameEn: 'G#', altNameFr: 'lab', altNameEn: 'Ab' },
      { note: 'A4', nameFr: 'la', nameEn: 'A' },
      { note: 'A#4', nameFr: 'la#', nameEn: 'A#', altNameFr: 'sib', altNameEn: 'Bb' },
      { note: 'B4', nameFr: 'si', nameEn: 'B' }
    ];

    // Intervalles musicaux
    this.intervals = [
      { semitones: 1, nameFr: 'seconde mineure', nameEn: 'minor 2nd' },
      { semitones: 2, nameFr: 'seconde majeure', nameEn: 'major 2nd' },
      { semitones: 3, nameFr: 'tierce mineure', nameEn: 'minor 3rd' },
      { semitones: 4, nameFr: 'tierce majeure', nameEn: 'major 3rd' },
      { semitones: 5, nameFr: 'quarte juste', nameEn: 'perfect 4th' },
      { semitones: 6, nameFr: 'triton', nameEn: 'tritone' },
      { semitones: 7, nameFr: 'quinte juste', nameEn: 'perfect 5th' },
      { semitones: 8, nameFr: 'sixte mineure', nameEn: 'minor 6th' },
      { semitones: 9, nameFr: 'sixte majeure', nameEn: 'major 6th' },
      { semitones: 10, nameFr: 'septième mineure', nameEn: 'minor 7th' },
      { semitones: 11, nameFr: 'septième majeure', nameEn: 'major 7th' },
      { semitones: 12, nameFr: 'octave', nameEn: 'octave' }
    ];

    // Types d'accords
    this.chordTypes = [
      { type: 'major', nameFr: 'majeur', nameEn: 'major', intervals: [0, 4, 7] },
      { type: 'minor', nameFr: 'mineur', nameEn: 'minor', intervals: [0, 3, 7] },
      { type: 'diminished', nameFr: 'diminué', nameEn: 'diminished', intervals: [0, 3, 6] },
      { type: 'augmented', nameFr: 'augmenté', nameEn: 'augmented', intervals: [0, 4, 8] }
    ];

    // Ressources pédagogiques communes
    this.commonResources = [
      {
        type: 'summary',
        title: 'Comment entraîner son oreille',
        content: `L'entraînement de l'oreille musicale (ear training) développe votre capacité à identifier les sons.

**Conseils :**
- Commencez par les notes naturelles (do, ré, mi, fa, sol, la, si)
- Écoutez plusieurs fois avant de répondre
- Chantez mentalement les notes pour mieux les mémoriser
- Pratiquez régulièrement (10-15 min/jour)
- La note La4 (440 Hz) est la référence d'accordage`,
        icon: '🎧',
        aiGenerated: false,
        order: 0
      },
      {
        type: 'interactive',
        component: 'wave-visualizer',
        title: 'Visualiseur de fréquences',
        options: {
          defaultFreq: 440,
          showBeats: true
        },
        icon: '📊',
        order: 1
      }
    ];
  }

  /**
   * Calcule la note résultante après un intervalle
   * @param {string} baseNote - Note de base (ex: 'C4')
   * @param {number} semitones - Nombre de demi-tons
   * @returns {string} Nouvelle note
   */
  _getNoteAtInterval(baseNote, semitones) {
    const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const match = baseNote.match(/^([A-G]#?)(\d)$/);
    if (!match) return baseNote;

    const [, noteName, octaveStr] = match;
    let octave = parseInt(octaveStr, 10);
    let noteIndex = noteOrder.indexOf(noteName);

    noteIndex += semitones;
    while (noteIndex >= 12) {
      noteIndex -= 12;
      octave++;
    }
    while (noteIndex < 0) {
      noteIndex += 12;
      octave--;
    }

    return `${noteOrder[noteIndex]}${octave}`;
  }

  /**
   * Génère les cartes pour les notes naturelles (débutant)
   * @returns {Object[]} Cartes audio-choice
   */
  generateNaturalNotesCards() {
    const cards = [];

    for (const noteData of this.naturalNotes) {
      // Générer les choix (toutes les notes naturelles)
      const choices = this.naturalNotes.map((n, idx) => ({
        id: String.fromCharCode(65 + idx), // A, B, C, ...
        text: n.nameFr,
        correct: n.note === noteData.note
      }));

      cards.push({
        id: `ear_note_natural_${noteData.nameEn}`,
        question: 'Quelle est cette note ?',
        type: 'audio-choice',
        audio: {
          type: 'note',
          note: noteData.note,
          timbre: 'piano',
          duration: 1.5
        },
        choices,
        answer: choices.find(c => c.correct).id,
        feedback: `C'était un ${noteData.nameFr} (${noteData.nameEn}4)`
      });
    }

    return cards;
  }

  /**
   * Génère les cartes pour les notes chromatiques (intermédiaire)
   * @returns {Object[]} Cartes audio-choice
   */
  generateChromaticNotesCards() {
    const cards = [];

    for (const noteData of this.chromaticNotes) {
      // Générer les choix (toutes les notes chromatiques)
      const choices = this.chromaticNotes.map((n, idx) => ({
        id: String.fromCharCode(65 + idx), // A, B, C, ...
        text: n.nameFr,
        correct: n.note === noteData.note
      }));

      cards.push({
        id: `ear_note_chromatic_${noteData.nameEn.replace('#', 'sharp')}`,
        question: 'Quelle est cette note ?',
        type: 'audio-choice',
        audio: {
          type: 'note',
          note: noteData.note,
          timbre: 'piano',
          duration: 1.5
        },
        choices,
        answer: choices.find(c => c.correct).id,
        feedback: noteData.altNameFr
          ? `C'était un ${noteData.nameFr} (ou ${noteData.altNameFr})`
          : `C'était un ${noteData.nameFr}`
      });
    }

    return cards;
  }

  /**
   * Génère les cartes pour les intervalles (intermédiaire)
   * @returns {Object[]} Cartes audio-choice
   */
  generateIntervalCards() {
    const cards = [];
    const baseNote = 'C4';

    for (const interval of this.intervals) {
      const secondNote = this._getNoteAtInterval(baseNote, interval.semitones);

      // Générer les choix (tous les intervalles)
      const choices = this.intervals.map((int, idx) => ({
        id: String.fromCharCode(65 + idx),
        text: int.nameFr,
        correct: int.semitones === interval.semitones
      }));

      cards.push({
        id: `ear_interval_${interval.semitones}`,
        question: 'Quel est cet intervalle ?',
        type: 'audio-choice',
        audio: {
          type: 'interval',
          notes: [baseNote, secondNote],
          timbre: 'piano',
          duration: 1.0
        },
        choices,
        answer: choices.find(c => c.correct).id,
        feedback: `C'était ${interval.nameFr === 'triton' ? 'un' : 'une'} ${interval.nameFr} (${interval.semitones} demi-ton${interval.semitones > 1 ? 's' : ''})`
      });
    }

    return cards;
  }

  /**
   * Génère les cartes pour les accords (avancé)
   * @returns {Object[]} Cartes audio-choice
   */
  generateChordCards() {
    const cards = [];
    const baseNote = 'C4';

    for (const chord of this.chordTypes) {
      // Calculer les notes de l'accord
      const chordNotes = chord.intervals.map(semitones =>
        this._getNoteAtInterval(baseNote, semitones)
      );

      // Générer les choix (tous les types d'accords)
      const choices = this.chordTypes.map((c, idx) => ({
        id: String.fromCharCode(65 + idx),
        text: `Accord ${c.nameFr}`,
        correct: c.type === chord.type
      }));

      cards.push({
        id: `ear_chord_${chord.type}`,
        question: 'Quel type d\'accord entendez-vous ?',
        type: 'audio-choice',
        audio: {
          type: 'chord',
          notes: chordNotes,
          timbre: 'piano',
          duration: 2.0
        },
        choices,
        answer: choices.find(c => c.correct).id,
        feedback: `C'était un accord ${chord.nameFr}`
      });
    }

    return cards;
  }

  /**
   * Génère le deck des notes naturelles (débutant)
   */
  buildNaturalNotesDeck() {
    return {
      name: 'Entraînement auditif - Notes naturelles',
      description: 'Reconnaître les 7 notes de la gamme de Do majeur',
      tags: ['musique', 'ear-training', 'entrainement-auditif', 'notes', 'debutant'],
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
          parameters: { type: 'natural-notes' }
        }
      },
      resources: [
        ...this.commonResources
      ],
      cards: this.generateNaturalNotesCards()
    };
  }

  /**
   * Génère le deck des notes chromatiques (intermédiaire)
   */
  buildChromaticNotesDeck() {
    return {
      name: 'Entraînement auditif - Notes chromatiques',
      description: 'Reconnaître les 12 notes de la gamme chromatique',
      tags: ['musique', 'ear-training', 'entrainement-auditif', 'notes', 'chromatique', 'intermediaire'],
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
          parameters: { type: 'chromatic-notes' }
        }
      },
      resources: [
        ...this.commonResources,
        {
          type: 'summary',
          title: 'La gamme chromatique',
          content: `La gamme chromatique contient les 12 notes :
do, do#/réb, ré, ré#/mib, mi, fa, fa#/solb, sol, sol#/lab, la, la#/sib, si

Chaque note est séparée d'un **demi-ton**.

**Enharmonie** : do# et réb sont la même note avec des noms différents.`,
          icon: '🎹',
          aiGenerated: false,
          order: 2
        }
      ],
      cards: this.generateChromaticNotesCards()
    };
  }

  /**
   * Génère le deck des intervalles (intermédiaire)
   */
  buildIntervalsDeck() {
    return {
      name: 'Entraînement auditif - Intervalles',
      description: 'Reconnaître les intervalles musicaux à l\'oreille',
      tags: ['musique', 'ear-training', 'entrainement-auditif', 'intervalles', 'intermediaire'],
      settings: {
        sequential: true, // Du plus petit au plus grand
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
      resources: [
        ...this.commonResources,
        {
          type: 'summary',
          title: 'Références pour les intervalles',
          content: `Mémorisez les intervalles avec des chansons connues :
- **Seconde mineure** : thème des Dents de la mer (montant)
- **Seconde majeure** : Au clair de la lune (montant)
- **Tierce mineure** : Greensleeves (descendant)
- **Tierce majeure** : Oh When the Saints (montant)
- **Quarte juste** : La Marseillaise (montant)
- **Quinte juste** : Star Wars (montant)
- **Sixte majeure** : My Bonnie (montant)
- **Octave** : Somewhere Over the Rainbow (montant)`,
          icon: '🎵',
          aiGenerated: false,
          order: 2
        }
      ],
      cards: this.generateIntervalCards()
    };
  }

  /**
   * Génère le deck des accords (avancé)
   */
  buildChordsDeck() {
    return {
      name: 'Entraînement auditif - Accords',
      description: 'Reconnaître les types d\'accords (majeur, mineur, etc.)',
      tags: ['musique', 'ear-training', 'entrainement-auditif', 'accords', 'avance'],
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
          parameters: { type: 'chords' }
        }
      },
      resources: [
        ...this.commonResources,
        {
          type: 'summary',
          title: 'Structure des accords',
          content: `Les accords de trois notes (triades) :
- **Majeur** : fondamentale + tierce majeure + quinte juste (0-4-7 demi-tons)
  - Caractère : joyeux, brillant
- **Mineur** : fondamentale + tierce mineure + quinte juste (0-3-7 demi-tons)
  - Caractère : triste, mélancolique
- **Diminué** : fondamentale + tierce mineure + quinte diminuée (0-3-6 demi-tons)
  - Caractère : instable, tendu
- **Augmenté** : fondamentale + tierce majeure + quinte augmentée (0-4-8 demi-tons)
  - Caractère : mystérieux, suspens`,
          icon: '🎹',
          aiGenerated: false,
          order: 2
        }
      ],
      cards: this.generateChordCards()
    };
  }

  /**
   * Override: Génère plusieurs decks
   */
  buildDecks(options = {}) {
    return [
      this.buildNaturalNotesDeck(),
      this.buildChromaticNotesDeck(),
      this.buildIntervalsDeck(),
      this.buildChordsDeck()
    ];
  }

  /**
   * Génère toutes les cartes (pour build unique)
   */
  generate(options = {}) {
    return [
      ...this.generateNaturalNotesCards(),
      ...this.generateChromaticNotesCards(),
      ...this.generateIntervalCards(),
      ...this.generateChordCards()
    ];
  }
}

module.exports = EarTrainingGenerator;
