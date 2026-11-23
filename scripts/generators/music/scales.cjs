/**
 * Scales and Modes Generator
 *
 * Génère des decks pour l'apprentissage des gammes et modes :
 * - Gammes majeures et mineures
 * - Modes grecs (ionien, dorien, phrygien, lydien, mixolydien, éolien, locrien)
 * - Gammes pentatoniques et blues
 * - Gammes exotiques du monde
 *
 * Utilise le type MCQ avec feedback détaillé sur les intervalles.
 */

const BaseGenerator = require('../base-generator.cjs');

class ScalesGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'scales',
      name: 'Gammes et modes',
      tags: ['musique', 'theorie-musicale', 'gammes'],
      version: '1.0.0',
      description: 'Apprendre les gammes majeures, mineures, modes et gammes du monde'
    });

    // Intervalles (en demi-tons)
    this.INTERVALS = {
      T: 2,  // Ton
      D: 1,  // Demi-ton
      TS: 3  // Ton et demi (1.5 tons)
    };

    // Gammes principales
    this.MAJOR_SCALE = {
      id: 'major',
      name: 'Gamme majeure',
      intervals: [2, 2, 1, 2, 2, 2, 1], // T-T-D-T-T-T-D
      pattern: 'T-T-D-T-T-T-D',
      character: 'Joyeuse, brillante, stable',
      examples: ['Do majeur (aucune altération)', 'Sol majeur (1 dièse)', 'Fa majeur (1 bémol)'],
      usage: 'Musique classique, pop, variété'
    };

    this.MINOR_SCALES = [
      {
        id: 'natural_minor',
        name: 'Gamme mineure naturelle',
        intervals: [2, 1, 2, 2, 1, 2, 2], // T-D-T-T-D-T-T
        pattern: 'T-D-T-T-D-T-T',
        character: 'Triste, mélancolique',
        examples: ['La mineur naturel (aucune altération)', 'Mi mineur (1 dièse)', 'Ré mineur (1 bémol)'],
        usage: 'Musique classique, folk, rock'
      },
      {
        id: 'harmonic_minor',
        name: 'Gamme mineure harmonique',
        intervals: [2, 1, 2, 2, 1, 3, 1], // T-D-T-T-D-1.5T-D
        pattern: 'T-D-T-T-D-1½T-D',
        character: 'Orientale, dramatique (seconde augmentée)',
        examples: ['La mineur harmonique (sol#)', 'Mi mineur harmonique (ré#)'],
        usage: 'Musique classique (cadences), flamenco, métal'
      },
      {
        id: 'melodic_minor',
        name: 'Gamme mineure mélodique',
        intervals: [2, 1, 2, 2, 2, 2, 1], // T-D-T-T-T-T-D (montante)
        pattern: 'T-D-T-T-T-T-D (↑)',
        character: 'Élégante, jazz',
        examples: ['Montée différente de la descente', 'Utilisée différemment en jazz'],
        usage: 'Jazz, musique classique (montée), improvisation'
      }
    ];

    // Modes grecs (construits sur les degrés de la gamme majeure)
    this.GREEK_MODES = [
      {
        id: 'ionian',
        name: 'Ionien',
        degree: 1,
        intervals: [2, 2, 1, 2, 2, 2, 1],
        pattern: 'T-T-D-T-T-T-D',
        character: 'Joyeux, stable (= majeur)',
        examples: ['Do ionien = Do majeur'],
        usage: 'Pop, classique, variété',
        color: 'Lumineux'
      },
      {
        id: 'dorian',
        name: 'Dorien',
        degree: 2,
        intervals: [2, 1, 2, 2, 2, 1, 2],
        pattern: 'T-D-T-T-T-D-T',
        character: 'Mineur doux, jazzy',
        examples: ['Ré dorien (notes de Do majeur)', 'Scarborough Fair'],
        usage: 'Jazz, funk, folk celtique',
        color: 'Mélancolique mais lumineux'
      },
      {
        id: 'phrygian',
        name: 'Phrygien',
        degree: 3,
        intervals: [1, 2, 2, 2, 1, 2, 2],
        pattern: 'D-T-T-T-D-T-T',
        character: 'Sombre, espagnol, oriental',
        examples: ['Mi phrygien (notes de Do majeur)', 'Flamenco'],
        usage: 'Flamenco, métal, musique orientale',
        color: 'Mystérieux, tendu'
      },
      {
        id: 'lydian',
        name: 'Lydien',
        degree: 4,
        intervals: [2, 2, 2, 1, 2, 2, 1],
        pattern: 'T-T-T-D-T-T-D',
        character: 'Rêveur, féérique, flottant',
        examples: ['Fa lydien (notes de Do majeur)', 'Thème des Simpsons'],
        usage: 'Film, jazz, musique impressionniste',
        color: 'Brillant, éthéré'
      },
      {
        id: 'mixolydian',
        name: 'Mixolydien',
        degree: 5,
        intervals: [2, 2, 1, 2, 2, 1, 2],
        pattern: 'T-T-D-T-T-D-T',
        character: 'Rock, bluesy, dominant',
        examples: ['Sol mixolydien (notes de Do majeur)', 'Sweet Home Alabama'],
        usage: 'Rock, blues, musique celtique',
        color: 'Énergique, terrestre'
      },
      {
        id: 'aeolian',
        name: 'Éolien',
        degree: 6,
        intervals: [2, 1, 2, 2, 1, 2, 2],
        pattern: 'T-D-T-T-D-T-T',
        character: 'Triste, mélancolique (= mineur naturel)',
        examples: ['La éolien = La mineur naturel'],
        usage: 'Pop, rock, folk, classique',
        color: 'Sombre, nostalgique'
      },
      {
        id: 'locrian',
        name: 'Locrien',
        degree: 7,
        intervals: [1, 2, 2, 1, 2, 2, 2],
        pattern: 'D-T-T-D-T-T-T',
        character: 'Instable, dissonant (quinte diminuée)',
        examples: ['Si locrien (notes de Do majeur)', 'Rarement utilisé seul'],
        usage: 'Métal, jazz (accords diminués)',
        color: 'Tendu, angoissant'
      }
    ];

    // Gammes pentatoniques
    this.PENTATONIC_SCALES = [
      {
        id: 'major_pentatonic',
        name: 'Pentatonique majeure',
        intervals: [2, 2, 3, 2, 3], // 5 notes
        pattern: 'T-T-1½T-T-1½T',
        notes: 'Do-Ré-Mi-Sol-La',
        character: 'Joyeuse, universelle, folk',
        usage: 'Musique chinoise, folk, rock, gospel'
      },
      {
        id: 'minor_pentatonic',
        name: 'Pentatonique mineure',
        intervals: [3, 2, 2, 3, 2], // 5 notes
        pattern: '1½T-T-T-1½T-T',
        notes: 'La-Do-Ré-Mi-Sol',
        character: 'Blues, rock, introspective',
        usage: 'Blues, rock, jazz, musique asiatique'
      }
    ];

    // Gamme blues
    this.BLUES_SCALE = {
      id: 'blues',
      name: 'Gamme blues',
      intervals: [3, 2, 1, 1, 3, 2], // 6 notes
      pattern: '1½T-T-D-D-1½T-T',
      notes: 'La-Do-Ré-Ré#-Mi-Sol',
      character: 'Soul, groove, expressif (blue note)',
      usage: 'Blues, jazz, rock, R&B',
      blueNote: 'Ré# (quarte augmentée / quinte diminuée)'
    };

    // Gammes exotiques
    this.EXOTIC_SCALES = [
      {
        id: 'arabic',
        name: 'Gamme arabe (Hijaz)',
        intervals: [1, 3, 1, 2, 1, 3, 1],
        pattern: 'D-1½T-D-T-D-1½T-D',
        origin: 'Moyen-Orient',
        character: 'Mystérieuse, orientale',
        usage: 'Musique arabe, flamenco, musique de film'
      },
      {
        id: 'japanese',
        name: 'Gamme japonaise (Hirajoshi)',
        intervals: [2, 1, 4, 1, 4], // 5 notes
        pattern: 'T-D-2T-D-2T',
        origin: 'Japon',
        character: 'Zen, mélancolique, contemplatif',
        usage: 'Musique traditionnelle japonaise, ambient'
      },
      {
        id: 'hungarian_minor',
        name: 'Gamme hongroise mineure',
        intervals: [2, 1, 3, 1, 1, 3, 1],
        pattern: 'T-D-1½T-D-D-1½T-D',
        origin: 'Europe de l\'Est',
        character: 'Dramatique, tzigane',
        usage: 'Musique tzigane, classique romantique'
      },
      {
        id: 'whole_tone',
        name: 'Gamme par tons',
        intervals: [2, 2, 2, 2, 2, 2], // 6 notes
        pattern: 'T-T-T-T-T-T',
        origin: 'Impressionnisme français',
        character: 'Flottante, onirique, sans direction',
        usage: 'Debussy, musique de film, ambient'
      },
      {
        id: 'chromatic',
        name: 'Gamme chromatique',
        intervals: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // 12 notes
        pattern: 'D-D-D-D-D-D-D-D-D-D-D-D',
        origin: 'Universelle',
        character: 'Toutes les notes, tension maximale',
        usage: 'Passages virtuoses, jazz, musique contemporaine'
      }
    ];

    // Ressources pédagogiques communes
    this.commonResources = [
      {
        type: 'summary',
        title: 'Qu\'est-ce qu\'une gamme ?',
        content: `Une **gamme** est une succession de notes organisée selon des intervalles précis.

**Vocabulaire clé**
- **Ton (T)** : 2 demi-tons (do→ré)
- **Demi-ton (D)** : Plus petit intervalle (mi→fa)
- **Tonique** : 1ère note, donne son nom à la gamme

**Types principaux**
- **Majeure** : T-T-D-T-T-T-D (joyeuse)
- **Mineure** : T-D-T-T-D-T-T (triste)
- **Pentatonique** : 5 notes (universelle)
- **Modes** : 7 couleurs différentes sur les mêmes notes`,
        aiGenerated: true,
        icon: '🎹',
        order: 0
      },
      {
        type: 'tip',
        title: 'Mémoriser les modes',
        content: `Les 7 modes grecs se construisent sur les 7 notes de Do majeur :

1. **I**onien = Do (majeur)
2. **D**orien = Ré (mineur doux)
3. **P**hrygien = Mi (espagnol)
4. **L**ydien = Fa (rêveur)
5. **M**ixolydien = Sol (rock)
6. **É**olien = La (mineur)
7. **L**ocrien = Si (instable)

Mnémotechnique : **I**l **D**ort **P**aisiblement **L**e **M**ardi **É**t **L**undi`,
        icon: '💡',
        order: 1
      }
    ];
  }

  /**
   * Génère des choix avec IDs alphabétiques
   */
  _getChoicesWithId(correct, allOptions) {
    const letters = ['A', 'B', 'C', 'D'];
    const options = [correct];
    const others = allOptions.filter(o => o !== correct);

    const shuffled = this.shuffle(others, `distractors:${correct}`).slice(0, 3);
    options.push(...shuffled);

    const shuffledOptions = this.shuffle(options, `options:${correct}`);
    const correctIndex = shuffledOptions.indexOf(correct);

    const choices = shuffledOptions.map((opt, i) => ({
      id: letters[i],
      text: opt
    }));

    return {
      choices,
      correctId: letters[correctIndex]
    };
  }

  /**
   * Génère les cartes pour les gammes majeures et mineures
   */
  _generateBasicScaleCards() {
    const cards = [];
    const allScales = [this.MAJOR_SCALE, ...this.MINOR_SCALES];

    // Gamme majeure
    let majorChoices = this._getChoicesWithId(this.MAJOR_SCALE.pattern, allScales.map(s => s.pattern));
    cards.push({
      id: 'scale_major_pattern',
      question: 'Quelle est la structure de la gamme majeure ?',
      answer: majorChoices.correctId,
      type: 'mcq',
        single: true,
      choices: majorChoices.choices,
      feedback: `La gamme majeure : ${this.MAJOR_SCALE.pattern}\nCaractère : ${this.MAJOR_SCALE.character}`
    });

    let majorCharChoices = this._getChoicesWithId(this.MAJOR_SCALE.character, allScales.map(s => s.character));
    cards.push({
      id: 'scale_major_char',
      question: 'Quel est le caractère de la gamme majeure ?',
      answer: majorCharChoices.correctId,
      type: 'mcq',
        single: true,
      choices: majorCharChoices.choices,
      feedback: `La gamme majeure est ${this.MAJOR_SCALE.character}.`
    });

    // Gammes mineures
    this.MINOR_SCALES.forEach(scale => {
      let patternChoices = this._getChoicesWithId(scale.pattern, allScales.map(s => s.pattern));
      cards.push({
        id: `scale_${scale.id}_pattern`,
        question: `Quelle est la structure de la ${scale.name.toLowerCase()} ?`,
        answer: patternChoices.correctId,
        type: 'mcq',
        single: true,
        choices: patternChoices.choices,
        feedback: `${scale.name} : ${scale.pattern}\nCaractère : ${scale.character}`
      });

      let charChoices = this._getChoicesWithId(scale.character, this.MINOR_SCALES.map(s => s.character));
      cards.push({
        id: `scale_${scale.id}_char`,
        question: `Quel est le caractère de la ${scale.name.toLowerCase()} ?`,
        answer: charChoices.correctId,
        type: 'mcq',
        single: true,
        choices: charChoices.choices,
        feedback: `La ${scale.name} est ${scale.character}.`
      });
    });

    return cards;
  }

  /**
   * Génère les cartes pour les modes grecs
   */
  _generateModeCards() {
    const cards = [];

    this.GREEK_MODES.forEach(mode => {
      // Quel degré ?
      let degreeChoices = this._getChoicesWithId(
        `${mode.degree}e degré`,
        this.GREEK_MODES.map(m => `${m.degree}e degré`)
      );
      cards.push({
        id: `mode_${mode.id}_degree`,
        question: `Le mode ${mode.name} se construit sur quel degré de la gamme majeure ?`,
        answer: degreeChoices.correctId,
        type: 'mcq',
        single: true,
        choices: degreeChoices.choices,
        feedback: `${mode.name} = ${mode.degree}e degré\nCaractère : ${mode.character}`
      });

      // Quel caractère ?
      let charChoices = this._getChoicesWithId(mode.color, this.GREEK_MODES.map(m => m.color));
      cards.push({
        id: `mode_${mode.id}_color`,
        question: `Comment décrit-on la couleur du mode ${mode.name} ?`,
        answer: charChoices.correctId,
        type: 'mcq',
        single: true,
        choices: charChoices.choices,
        feedback: `${mode.name} : ${mode.color}\nUsage : ${mode.usage}`
      });

      // Quel usage ?
      let usageChoices = this._getChoicesWithId(mode.usage, this.GREEK_MODES.map(m => m.usage));
      cards.push({
        id: `mode_${mode.id}_usage`,
        question: `Dans quel contexte utilise-t-on principalement le mode ${mode.name} ?`,
        answer: usageChoices.correctId,
        type: 'mcq',
        single: true,
        choices: usageChoices.choices,
        feedback: `${mode.name} est utilisé en : ${mode.usage}`
      });
    });

    // Identifier le mode par son caractère
    this.GREEK_MODES.forEach(mode => {
      let modeChoices = this._getChoicesWithId(mode.name, this.GREEK_MODES.map(m => m.name));
      cards.push({
        id: `mode_${mode.id}_identify`,
        question: `Quel mode est décrit comme "${mode.character}" ?`,
        answer: modeChoices.correctId,
        type: 'mcq',
        single: true,
        choices: modeChoices.choices,
        feedback: `C'est le mode ${mode.name} (${mode.degree}e degré).`
      });
    });

    return cards;
  }

  /**
   * Génère les cartes pour les gammes pentatoniques et blues
   */
  _generatePentatonicBluesCards() {
    const cards = [];
    const allPenta = [...this.PENTATONIC_SCALES, this.BLUES_SCALE];

    this.PENTATONIC_SCALES.forEach(scale => {
      let patternChoices = this._getChoicesWithId(scale.pattern, allPenta.map(s => s.pattern));
      cards.push({
        id: `penta_${scale.id}_pattern`,
        question: `Quelle est la structure de la ${scale.name.toLowerCase()} ?`,
        answer: patternChoices.correctId,
        type: 'mcq',
        single: true,
        choices: patternChoices.choices,
        feedback: `${scale.name} : ${scale.pattern}\nNotes : ${scale.notes}`
      });

      let charChoices = this._getChoicesWithId(scale.character, allPenta.map(s => s.character));
      cards.push({
        id: `penta_${scale.id}_char`,
        question: `Quel est le caractère de la ${scale.name.toLowerCase()} ?`,
        answer: charChoices.correctId,
        type: 'mcq',
        single: true,
        choices: charChoices.choices,
        feedback: `${scale.name} : ${scale.character}\nUsage : ${scale.usage}`
      });
    });

    // Gamme blues
    let bluesPatternChoices = this._getChoicesWithId(this.BLUES_SCALE.pattern, allPenta.map(s => s.pattern));
    cards.push({
      id: 'blues_pattern',
      question: 'Quelle est la structure de la gamme blues ?',
      answer: bluesPatternChoices.correctId,
      type: 'mcq',
        single: true,
      choices: bluesPatternChoices.choices,
      feedback: `Gamme blues : ${this.BLUES_SCALE.pattern}\nBlue note : ${this.BLUES_SCALE.blueNote}`
    });

    let bluesNotesChoices = this._getChoicesWithId(this.BLUES_SCALE.notes, allPenta.map(s => s.notes));
    cards.push({
      id: 'blues_notes',
      question: 'Quelles sont les notes de la gamme blues en La ?',
      answer: bluesNotesChoices.correctId,
      type: 'mcq',
        single: true,
      choices: bluesNotesChoices.choices,
      feedback: `Gamme blues de La : ${this.BLUES_SCALE.notes}\nLa blue note (${this.BLUES_SCALE.blueNote}) donne le son caractéristique.`
    });

    return cards;
  }

  /**
   * Génère les cartes pour les gammes exotiques
   */
  _generateExoticScaleCards() {
    const cards = [];

    this.EXOTIC_SCALES.forEach(scale => {
      // Origine
      let originChoices = this._getChoicesWithId(scale.origin, this.EXOTIC_SCALES.map(s => s.origin));
      cards.push({
        id: `exotic_${scale.id}_origin`,
        question: `D'où vient la ${scale.name.toLowerCase()} ?`,
        answer: originChoices.correctId,
        type: 'mcq',
        single: true,
        choices: originChoices.choices,
        feedback: `${scale.name} : origine ${scale.origin}\nCaractère : ${scale.character}`
      });

      // Caractère
      let charChoices = this._getChoicesWithId(scale.character, this.EXOTIC_SCALES.map(s => s.character));
      cards.push({
        id: `exotic_${scale.id}_char`,
        question: `Quel est le caractère de la ${scale.name.toLowerCase()} ?`,
        answer: charChoices.correctId,
        type: 'mcq',
        single: true,
        choices: charChoices.choices,
        feedback: `${scale.name} : ${scale.character}\nUsage : ${scale.usage}`
      });

      // Identifier par l'origine
      let nameChoices = this._getChoicesWithId(scale.name, this.EXOTIC_SCALES.map(s => s.name));
      cards.push({
        id: `exotic_${scale.id}_identify`,
        question: `Quelle gamme est originaire de ${scale.origin.includes('Moyen') ? 'la région du ' : ''}${scale.origin} ?`,
        answer: nameChoices.correctId,
        type: 'mcq',
        single: true,
        choices: nameChoices.choices,
        feedback: `${scale.name} vient de ${scale.origin}.`
      });
    });

    return cards;
  }

  /**
   * Génère les cartes - méthode requise par BaseGenerator
   */
  generate(options = {}) {
    const deckType = options.deckType || 'basic';

    switch (deckType) {
      case 'basic':
        return this._generateBasicScaleCards();
      case 'modes':
        return this._generateModeCards();
      case 'pentatonic_blues':
        return this._generatePentatonicBluesCards();
      case 'exotic':
        return this._generateExoticScaleCards();
      default:
        return this._generateBasicScaleCards();
    }
  }

  /**
   * Génère plusieurs decks
   */
  buildDecks(options = {}) {
    const decks = [];

    // Deck 1: Gammes majeures et mineures
    decks.push({
      name: 'Gammes - Majeures et mineures',
      description: 'Comprendre les gammes majeures et les 3 types de gammes mineures',
      tags: [...this.tags, 'debutant'],
      settings: { sequential: false, bidirectional: false },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { deckType: 'basic' }
        }
      },
      cards: this._formatCards(this._generateBasicScaleCards()),
      resources: this.commonResources
    });

    // Deck 2: Modes grecs
    decks.push({
      name: 'Gammes - Modes grecs',
      description: 'Les 7 modes : ionien, dorien, phrygien, lydien, mixolydien, éolien, locrien',
      tags: [...this.tags, 'intermediaire', 'modes'],
      settings: { sequential: false, bidirectional: false },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { deckType: 'modes' }
        }
      },
      cards: this._formatCards(this._generateModeCards()),
      resources: [
        ...this.commonResources,
        {
          type: 'summary',
          title: 'Les 7 modes grecs',
          content: `Les modes sont 7 façons de jouer les mêmes notes en partant d'un degré différent.

En partant des notes de Do majeur :
| Mode | Départ | Caractère |
|------|--------|-----------|
| Ionien | Do | Majeur classique |
| Dorien | Ré | Mineur jazzy |
| Phrygien | Mi | Espagnol, sombre |
| Lydien | Fa | Rêveur, #4 |
| Mixolydien | Sol | Rock, b7 |
| Éolien | La | Mineur naturel |
| Locrien | Si | Instable, b5 |`,
          aiGenerated: true,
          icon: '🎭',
          order: 2
        }
      ]
    });

    // Deck 3: Pentatoniques et blues
    decks.push({
      name: 'Gammes - Pentatoniques et blues',
      description: 'Les gammes à 5 et 6 notes : pentatoniques majeures/mineures et blues',
      tags: [...this.tags, 'intermediaire', 'blues', 'rock'],
      settings: { sequential: false, bidirectional: false },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { deckType: 'pentatonic_blues' }
        }
      },
      cards: this._formatCards(this._generatePentatonicBluesCards()),
      resources: [
        ...this.commonResources,
        {
          type: 'summary',
          title: 'La blue note',
          content: `La **blue note** est la note caractéristique du blues.

C'est la quarte augmentée (ou quinte diminuée) ajoutée à la pentatonique mineure :

**Pentatonique mineure** : La - Do - Ré - Mi - Sol
**Gamme blues** : La - Do - Ré - **Ré#** - Mi - Sol

Cette note crée une tension délicieuse qui donne au blues son expressivité unique.`,
          aiGenerated: true,
          icon: '🎷',
          order: 2
        }
      ]
    });

    // Deck 4: Gammes exotiques
    decks.push({
      name: 'Gammes - Exotiques du monde',
      description: 'Gammes arabe, japonaise, hongroise, par tons et chromatique',
      tags: [...this.tags, 'avance', 'culture', 'musiques-monde'],
      settings: { sequential: false, bidirectional: false },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { deckType: 'exotic' }
        }
      },
      cards: this._formatCards(this._generateExoticScaleCards()),
      resources: [
        ...this.commonResources,
        {
          type: 'summary',
          title: 'Gammes et cultures',
          content: `Chaque culture a développé ses propres gammes, reflétant sa sensibilité musicale.

**Moyen-Orient** : Gamme arabe (Hijaz) - intervalles 1½ ton caractéristiques
**Japon** : Hirajoshi - ambiance zen, contemplative
**Europe de l'Est** : Hongroise - dramatique, tzigane
**Occident moderne** : Par tons (Debussy) - flottante, sans résolution

Ces gammes enrichissent le vocabulaire musical et permettent d'évoquer différentes atmosphères.`,
          aiGenerated: true,
          icon: '🌍',
          order: 2
        }
      ]
    });

    return decks;
  }
}

module.exports = ScalesGenerator;
