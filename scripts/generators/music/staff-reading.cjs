/**
 * Staff Reading Generator
 *
 * Génère des decks pour l'apprentissage de la lecture de notes sur portée :
 * - Clé de sol (débutant et complet)
 * - Clé de fa (débutant et complet)
 * - Clé d'ut (alto et tenor)
 * - Lecture mixte (changements de clé)
 *
 * Utilise le type de carte "staff-note" avec un SVG de portée.
 */

const BaseGenerator = require('../base-generator.cjs');

class StaffReadingGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'staff-reading',
      name: 'Lecture de notes sur portée',
      tags: ['musique', 'solfege', 'lecture'],
      version: '1.0.0',
      description: 'Apprendre à lire les notes sur une portée musicale'
    });

    // Notes naturelles par octave
    this.NOTE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

    // Noms français des notes
    this.NOTE_NAMES_FR = {
      'C': 'do', 'D': 'ré', 'E': 'mi', 'F': 'fa',
      'G': 'sol', 'A': 'la', 'B': 'si'
    };

    // Configurations des decks par clé
    this.CLEF_CONFIGS = {
      treble_beginner: {
        name: 'Clé de sol - Débutant',
        clef: 'treble',
        notes: this._generateNotes(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5']),
        level: 'debutant',
        description: 'Notes de do4 à sol5 en clé de sol'
      },
      treble_complete: {
        name: 'Clé de sol - Complet',
        clef: 'treble',
        notes: this._generateNotes(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6']),
        level: 'intermediaire',
        description: 'Notes de do4 à do6 en clé de sol, avec lignes supplémentaires'
      },
      bass_beginner: {
        name: 'Clé de fa - Débutant',
        clef: 'bass',
        notes: this._generateNotes(['E2', 'F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3']),
        level: 'debutant',
        description: 'Notes de mi2 à si3 en clé de fa'
      },
      bass_complete: {
        name: 'Clé de fa - Complet',
        clef: 'bass',
        notes: this._generateNotes(['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4']),
        level: 'intermediaire',
        description: 'Notes de do2 à do4 en clé de fa, avec lignes supplémentaires'
      },
      alto: {
        name: 'Clé d\'ut 3 (alto)',
        clef: 'alto',
        notes: this._generateNotes(['C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']),
        level: 'avance',
        description: 'Clé d\'ut 3e ligne, utilisée pour l\'alto'
      },
      tenor: {
        name: 'Clé d\'ut 4 (ténor)',
        clef: 'tenor',
        notes: this._generateNotes(['A2', 'B2', 'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4']),
        level: 'avance',
        description: 'Clé d\'ut 4e ligne, utilisée pour le violoncelle et le basson'
      }
    };

    // Ressources pédagogiques communes
    this.commonResources = [
      {
        type: 'component',
        component: 'staff-visualizer',
        title: 'Explorateur de portée',
        options: { showControls: true },
        icon: '🎼',
        order: 0
      },
      {
        type: 'summary',
        title: 'Pourquoi plusieurs clés ?',
        content: `Les différentes clés permettent de noter la musique sur une portée de 5 lignes sans trop de lignes supplémentaires :

- **Clé de sol** 𝄞 : Pour les instruments aigus (violon, flûte, main droite piano)
- **Clé de fa** 𝄢 : Pour les instruments graves (contrebasse, main gauche piano)
- **Clé d'ut** 𝄡 : Position variable, utilisée pour l'alto (3e ligne) et parfois violoncelle (4e ligne)

La clé détermine quelle note se trouve sur quelle ligne de la portée.`,
        aiGenerated: true,
        icon: '❓',
        order: 1
      },
      {
        type: 'tip',
        title: 'Mnémotechniques - Clé de sol',
        content: `**Lignes** (de bas en haut) : mi, sol, si, ré, fa
→ "**M**i **S**ol **S**i **R**é **F**a" = "Mon Stylo Sert Rarement Facilement"

**Interlignes** (de bas en haut) : fa, la, do, mi
→ "**F**a **L**a **D**o **M**i" = "Face La Do Mi"`,
        icon: '💡',
        order: 2
      },
      {
        type: 'tip',
        title: 'Mnémotechniques - Clé de fa',
        content: `**Lignes** (de bas en haut) : sol, si, ré, fa, la
→ "**S**ol **S**i **R**é **F**a **L**a" = "Sol Si Ré Fa La"

**Interlignes** (de bas en haut) : la, do, mi, sol
→ "**L**a **D**o **M**i **S**ol" = "La Do Mi Sol"`,
        icon: '💡',
        order: 3
      }
    ];
  }

  /**
   * Génère une liste de notes à partir d'un tableau de noms
   * @param {string[]} noteNames - Ex: ['C4', 'D4', 'E4']
   * @returns {string[]} Notes filtrées
   */
  _generateNotes(noteNames) {
    return noteNames.filter(Boolean);
  }

  /**
   * Obtient le nom français complet d'une note
   * @param {string} note - Ex: 'C4'
   * @returns {string} Ex: 'do4'
   */
  _getNoteName(note) {
    const match = note.match(/^([A-G])([#b]?)(\d)$/);
    if (!match) return note;

    const [, noteName, accidental, octave] = match;
    let frName = this.NOTE_NAMES_FR[noteName] || noteName;

    if (accidental === '#') frName += '#';
    if (accidental === 'b') frName += '♭';

    return frName + octave;
  }

  /**
   * Génère les choix pour une note donnée
   * @param {string} correctNote - Note correcte
   * @param {string[]} allNotes - Toutes les notes possibles
   * @returns {Object[]} Choix avec id et text
   */
  _generateChoices(correctNote, allNotes) {
    const choices = [];
    const usedNotes = new Set([correctNote]);

    // Ajouter la bonne réponse
    choices.push({
      id: correctNote,
      text: this._getNoteName(correctNote)
    });

    // Ajouter des distracteurs (notes proches)
    const correctIndex = allNotes.indexOf(correctNote);
    const distractors = [];

    // Essayer les notes adjacentes d'abord
    [-1, 1, -2, 2, -3, 3].forEach(offset => {
      const idx = correctIndex + offset;
      if (idx >= 0 && idx < allNotes.length && !usedNotes.has(allNotes[idx])) {
        distractors.push(allNotes[idx]);
        usedNotes.add(allNotes[idx]);
      }
    });

    // Prendre les 3 premiers distracteurs
    distractors.slice(0, 3).forEach(note => {
      choices.push({
        id: note,
        text: this._getNoteName(note)
      });
    });

    // Si pas assez, ajouter des notes aléatoires (graine fixe)
    const extraRng = this.rng(`extra-notes:${choices.map(c => c.id).join(',')}`);
    while (choices.length < 4 && choices.length < allNotes.length) {
      const randomNote = allNotes[Math.floor(extraRng() * allNotes.length)];
      if (!usedNotes.has(randomNote)) {
        choices.push({
          id: randomNote,
          text: this._getNoteName(randomNote)
        });
        usedNotes.add(randomNote);
      }
    }

    return choices;
  }

  /**
   * Génère les cartes pour une configuration de clé
   * @param {Object} config - Configuration du deck
   * @returns {Object[]} Cartes générées
   */
  _generateCardsForClef(config) {
    const cards = [];
    const { clef, notes } = config;

    notes.forEach((note, index) => {
      const noteName = this._getNoteName(note);
      const choices = this._generateChoices(note, notes);

      cards.push({
        id: `staff_${clef}_${note.toLowerCase()}`,
        question: `Quelle est cette note ?`,
        answer: note,
        type: 'staff-note',
        staff: {
          note: note,
          clef: clef
        },
        choices: choices,
        feedback: `C'est un ${noteName}. En clé de ${this._getClefName(clef)}, cette position correspond à ${noteName}.`
      });
    });

    return cards;
  }

  /**
   * Obtient le nom français de la clé
   * @param {string} clef - treble, bass, alto, tenor
   * @returns {string} Nom français
   */
  _getClefName(clef) {
    const names = {
      treble: 'sol',
      bass: 'fa',
      alto: 'ut 3',
      tenor: 'ut 4'
    };
    return names[clef] || clef;
  }

  /**
   * Génère les cartes - méthode requise par BaseGenerator
   */
  generate(options = {}) {
    const deckType = options.deckType || 'treble_beginner';
    const config = this.CLEF_CONFIGS[deckType];

    if (!config) {
      throw new Error(`Unknown deck type: ${deckType}`);
    }

    return this._generateCardsForClef(config);
  }

  /**
   * Génère plusieurs decks (un par configuration de clé)
   */
  buildDecks(options = {}) {
    const decks = [];

    // Générer tous les decks de clé
    for (const [deckType, config] of Object.entries(this.CLEF_CONFIGS)) {
      const cards = this._generateCardsForClef(config);

      const deck = {
        name: `Lecture de portée - ${config.name}`,
        description: config.description,
        tags: [...this.tags, config.level],
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
            parameters: { deckType }
          }
        },
        cards: this._formatCards(cards),
        resources: this.commonResources
      };

      decks.push(deck);
    }

    return decks;
  }
}

module.exports = StaffReadingGenerator;
