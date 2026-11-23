/**
 * Harmonics and Acoustics Generator
 *
 * Génère des decks pour comprendre l'acoustique musicale :
 * - Série harmonique (fondamentale + harmoniques)
 * - Consonance et dissonance
 * - Battements (2 fréquences proches)
 * - Timbres (pourquoi piano ≠ violon)
 *
 * Utilise le type MCQ avec ressource interactive harmonics-visualizer.
 */

const BaseGenerator = require('../base-generator.cjs');

class HarmonicsGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'harmonics',
      name: 'Harmoniques et acoustique',
      tags: ['musique', 'acoustique', 'physique'],
      version: '1.0.0',
      description: 'Comprendre la physique du son : harmoniques, timbres, consonance'
    });

    // Série harmonique (ratios de fréquence par rapport à la fondamentale)
    this.HARMONICS = [
      { rank: 1, ratio: 1, name: 'Fondamentale', note: 'Do', interval: 'Unisson' },
      { rank: 2, ratio: 2, name: 'Harmonique 2', note: 'Do', interval: 'Octave' },
      { rank: 3, ratio: 3, name: 'Harmonique 3', note: 'Sol', interval: 'Quinte + octave' },
      { rank: 4, ratio: 4, name: 'Harmonique 4', note: 'Do', interval: 'Double octave' },
      { rank: 5, ratio: 5, name: 'Harmonique 5', note: 'Mi', interval: 'Tierce majeure + 2 oct.' },
      { rank: 6, ratio: 6, name: 'Harmonique 6', note: 'Sol', interval: 'Quinte + 2 octaves' },
      { rank: 7, ratio: 7, name: 'Harmonique 7', note: 'Sib (≈)', interval: 'Septième mineure (≈)' },
      { rank: 8, ratio: 8, name: 'Harmonique 8', note: 'Do', interval: 'Triple octave' }
    ];

    // Intervalles et leur consonance
    this.INTERVALS_CONSONANCE = [
      { name: 'Unisson', ratio: '1:1', cents: 0, consonance: 'Parfaite', character: 'Fusion totale' },
      { name: 'Octave', ratio: '2:1', cents: 1200, consonance: 'Parfaite', character: 'Fusion, même note' },
      { name: 'Quinte juste', ratio: '3:2', cents: 702, consonance: 'Parfaite', character: 'Stable, ouvert' },
      { name: 'Quarte juste', ratio: '4:3', cents: 498, consonance: 'Parfaite', character: 'Stable mais tendu' },
      { name: 'Tierce majeure', ratio: '5:4', cents: 386, consonance: 'Imparfaite', character: 'Joyeux, lumineux' },
      { name: 'Tierce mineure', ratio: '6:5', cents: 316, consonance: 'Imparfaite', character: 'Triste, doux' },
      { name: 'Sixte majeure', ratio: '5:3', cents: 884, consonance: 'Imparfaite', character: 'Ouvert, aspirant' },
      { name: 'Sixte mineure', ratio: '8:5', cents: 814, consonance: 'Imparfaite', character: 'Mélancolique' },
      { name: 'Seconde majeure', ratio: '9:8', cents: 204, consonance: 'Dissonante', character: 'Frottement, tension' },
      { name: 'Seconde mineure', ratio: '16:15', cents: 112, consonance: 'Dissonante', character: 'Très tendu, grinçant' },
      { name: 'Septième majeure', ratio: '15:8', cents: 1088, consonance: 'Dissonante', character: 'Aspiration, jazz' },
      { name: 'Triton', ratio: '45:32', cents: 590, consonance: 'Dissonante', character: 'Diabolus in musica' }
    ];

    // Timbres et leur composition harmonique
    this.TIMBRES = [
      {
        id: 'sine',
        name: 'Onde sinusoïdale',
        description: 'Son pur, une seule fréquence',
        harmonics: 'Fondamentale uniquement',
        character: 'Doux, fade, électronique',
        examples: 'Diapason, synthétiseur'
      },
      {
        id: 'flute',
        name: 'Flûte',
        description: 'Peu d\'harmoniques, son doux',
        harmonics: 'Fondamentale + H2, H3 faibles',
        character: 'Aérien, pur',
        examples: 'Flûte traversière, flûte à bec'
      },
      {
        id: 'clarinet',
        name: 'Clarinette',
        description: 'Harmoniques impairs dominants',
        harmonics: 'H1, H3, H5, H7 (pas de H2, H4)',
        character: 'Creux, boisé',
        examples: 'Clarinette, orgue (jeux)'
      },
      {
        id: 'violin',
        name: 'Violon',
        description: 'Riche en harmoniques',
        harmonics: 'Tous les harmoniques présents',
        character: 'Chaud, expressif',
        examples: 'Violon, alto, violoncelle'
      },
      {
        id: 'trumpet',
        name: 'Trompette',
        description: 'Harmoniques élevés forts',
        harmonics: 'H1-H8+ avec aigus marqués',
        character: 'Brillant, cuivré',
        examples: 'Trompette, trombone'
      },
      {
        id: 'piano',
        name: 'Piano',
        description: 'Harmoniques avec inharmonicité',
        harmonics: 'Tous + légère inharmonicité',
        character: 'Riche, percussif',
        examples: 'Piano acoustique'
      }
    ];

    // Concepts de battements
    this.BEATS_CONCEPTS = [
      {
        id: 'definition',
        question: 'Que sont les "battements" en acoustique ?',
        answer: 'Variations de volume quand deux fréquences proches sont jouées ensemble',
        feedback: 'Quand deux sons de fréquences proches sont joués, leur interférence crée des variations périodiques de volume appelées "battements".'
      },
      {
        id: 'frequency',
        question: 'Comment calcule-t-on la fréquence des battements ?',
        answer: 'Différence entre les deux fréquences (|f1 - f2|)',
        feedback: 'Si on joue 440 Hz et 442 Hz, on entend 2 battements par seconde.'
      },
      {
        id: 'tuning',
        question: 'Comment les battements aident-ils à s\'accorder ?',
        answer: 'Quand les battements disparaissent, les deux notes sont à l\'unisson',
        feedback: 'Les accordeurs utilisent les battements : plus ils ralentissent, plus on approche de la note juste.'
      }
    ];

    // Ressources pédagogiques
    this.commonResources = [
      {
        type: 'component',
        component: 'harmonics-visualizer',
        title: 'Visualiseur d\'harmoniques',
        options: { showControls: true },
        icon: '📊',
        order: 0
      },
      {
        type: 'summary',
        title: 'Qu\'est-ce qu\'un harmonique ?',
        content: `Quand une corde vibre, elle produit plusieurs fréquences simultanément :

**Fondamentale (H1)** : La fréquence de base (ex: 440 Hz pour La4)

**Harmoniques** : Multiples entiers de la fondamentale
- H2 = 2 × 440 = 880 Hz (octave)
- H3 = 3 × 440 = 1320 Hz (quinte + octave)
- H4 = 4 × 440 = 1760 Hz (double octave)
- etc.

Le **timbre** d'un instrument dépend de l'intensité relative de chaque harmonique.`,
        aiGenerated: true,
        icon: '🎵',
        order: 1
      },
      {
        type: 'summary',
        title: 'Pourquoi La = 440 Hz ?',
        content: `Le **La 440 Hz** est la référence internationale depuis 1939.

**Histoire**
- Avant : chaque région avait sa référence (de 380 à 480 Hz !)
- 1859 : France adopte 435 Hz
- 1939 : Conférence de Londres fixe 440 Hz
- 1955 : ISO confirme ce standard

**En pratique**
- Orchestres baroques : souvent 415 Hz (-1 demi-ton)
- Orchestres modernes : parfois 442-443 Hz (plus brillant)

Le choix est arbitraire mais la standardisation permet aux musiciens de jouer ensemble.`,
        aiGenerated: true,
        icon: '🔊',
        order: 2
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
   * Génère les cartes sur la série harmonique
   */
  _generateHarmonicsCards() {
    const cards = [];

    // Questions sur chaque harmonique
    this.HARMONICS.forEach(h => {
      // Quel intervalle ?
      let intervalChoices = this._getChoicesWithId(h.interval, this.HARMONICS.map(x => x.interval));
      cards.push({
        id: `harmonic_${h.rank}_interval`,
        question: `L'harmonique ${h.rank} forme quel intervalle avec la fondamentale ?`,
        answer: intervalChoices.correctId,
        type: 'mcq',
        single: true,
        choices: intervalChoices.choices,
        feedback: `Harmonique ${h.rank} = ${h.ratio}× la fondamentale = ${h.interval}`
      });

      // Quel ratio ?
      let ratioChoices = this._getChoicesWithId(String(h.ratio), this.HARMONICS.map(x => String(x.ratio)));
      cards.push({
        id: `harmonic_${h.rank}_ratio`,
        question: `L'harmonique ${h.rank} a quelle fréquence par rapport à la fondamentale ?`,
        answer: ratioChoices.correctId,
        type: 'mcq',
        single: true,
        choices: ratioChoices.choices,
        feedback: `Harmonique ${h.rank} = ${h.ratio} × fondamentale\nNote : ${h.note} (${h.interval})`
      });
    });

    // Question générale sur la série
    let defChoices = this._getChoicesWithId(
      'Des multiples entiers de la fondamentale',
      [
        'Des multiples entiers de la fondamentale',
        'Des divisions de la fondamentale',
        'Des fréquences aléatoires',
        'Des fréquences par demi-tons'
      ]
    );
    cards.push({
      id: 'harmonic_series_def',
      question: 'Les harmoniques sont...',
      answer: defChoices.correctId,
      type: 'mcq',
        single: true,
      choices: defChoices.choices,
      feedback: 'La série harmonique : f, 2f, 3f, 4f, 5f... Ce sont les multiples entiers de la fondamentale.'
    });

    return cards;
  }

  /**
   * Génère les cartes sur la consonance/dissonance
   */
  _generateConsonanceCards() {
    const cards = [];

    // Consonance de chaque intervalle
    this.INTERVALS_CONSONANCE.forEach(interval => {
      let consChoices = this._getChoicesWithId(interval.consonance, ['Parfaite', 'Imparfaite', 'Dissonante']);
      cards.push({
        id: `consonance_${interval.name.toLowerCase().replace(/\s+/g, '_')}`,
        question: `La ${interval.name.toLowerCase()} est de consonance :`,
        answer: consChoices.correctId,
        type: 'mcq',
        single: true,
        choices: consChoices.choices,
        feedback: `${interval.name} (${interval.ratio}) : consonance ${interval.consonance}\nCaractère : ${interval.character}`
      });
    });

    // Questions sur le ratio et la consonance
    let ratioChoices = this._getChoicesWithId(
      'Plus le ratio est simple, plus c\'est consonant',
      [
        'Plus le ratio est simple, plus c\'est consonant',
        'Plus le ratio est complexe, plus c\'est consonant',
        'Le ratio n\'influence pas la consonance',
        'Seuls les nombres premiers donnent des consonances'
      ]
    );
    cards.push({
      id: 'consonance_ratio_rule',
      question: 'Quelle règle lie ratio et consonance ?',
      answer: ratioChoices.correctId,
      type: 'mcq',
        single: true,
      choices: ratioChoices.choices,
      feedback: 'Octave (2:1), Quinte (3:2) = consonances parfaites. Triton (45:32) = dissonance.'
    });

    return cards;
  }

  /**
   * Génère les cartes sur les timbres
   */
  _generateTimbreCards() {
    const cards = [];

    this.TIMBRES.forEach(timbre => {
      // Caractère du timbre
      let charChoices = this._getChoicesWithId(timbre.character, this.TIMBRES.map(t => t.character));
      cards.push({
        id: `timbre_${timbre.id}_char`,
        question: `Comment décrit-on le timbre de la ${timbre.name.toLowerCase()} ?`,
        answer: charChoices.correctId,
        type: 'mcq',
        single: true,
        choices: charChoices.choices,
        feedback: `${timbre.name} : ${timbre.character}\nHarmoniques : ${timbre.harmonics}`
      });

      // Harmoniques caractéristiques
      let harmChoices = this._getChoicesWithId(timbre.harmonics, this.TIMBRES.map(t => t.harmonics));
      cards.push({
        id: `timbre_${timbre.id}_harm`,
        question: `Quels harmoniques caractérisent le timbre de la ${timbre.name.toLowerCase()} ?`,
        answer: harmChoices.correctId,
        type: 'mcq',
        single: true,
        choices: harmChoices.choices,
        feedback: `${timbre.name} : ${timbre.harmonics}\n${timbre.description}`
      });
    });

    // Question générale
    let defChoices = this._getChoicesWithId(
      'La proportion des différents harmoniques',
      [
        'La proportion des différents harmoniques',
        'La fréquence de la fondamentale',
        'La durée du son',
        'Le volume du son'
      ]
    );
    cards.push({
      id: 'timbre_definition',
      question: 'Qu\'est-ce qui détermine le timbre d\'un instrument ?',
      answer: defChoices.correctId,
      type: 'mcq',
        single: true,
      choices: defChoices.choices,
      feedback: 'Le timbre dépend de l\'intensité relative de chaque harmonique. Un violon et une flûte jouant la même note ont des harmoniques différents.'
    });

    return cards;
  }

  /**
   * Génère les cartes sur les battements
   */
  _generateBeatsCards() {
    const cards = [];

    this.BEATS_CONCEPTS.forEach(concept => {
      let answerChoices = this._getChoicesWithId(
        concept.answer,
        this.BEATS_CONCEPTS.map(c => c.answer)
      );
      cards.push({
        id: `beats_${concept.id}`,
        question: concept.question,
        answer: answerChoices.correctId,
        type: 'mcq',
        single: true,
        choices: answerChoices.choices,
        feedback: concept.feedback
      });
    });

    // Questions supplémentaires
    let exampleChoices = this._getChoicesWithId(
      '3 battements/seconde',
      ['3 battements/seconde', '883 battements/seconde', '443 battements/seconde', '0 battement']
    );
    cards.push({
      id: 'beats_example',
      question: 'Si on joue 440 Hz et 443 Hz ensemble, combien de battements entend-on ?',
      answer: exampleChoices.correctId,
      type: 'mcq',
        single: true,
      choices: exampleChoices.choices,
      feedback: 'Battements = |443 - 440| = 3 Hz = 3 battements par seconde'
    });

    return cards;
  }

  /**
   * Génère les cartes - méthode requise par BaseGenerator
   */
  generate(options = {}) {
    const deckType = options.deckType || 'harmonics';

    switch (deckType) {
      case 'harmonics':
        return this._generateHarmonicsCards();
      case 'consonance':
        return this._generateConsonanceCards();
      case 'timbre':
        return this._generateTimbreCards();
      case 'beats':
        return this._generateBeatsCards();
      default:
        return this._generateHarmonicsCards();
    }
  }

  /**
   * Génère plusieurs decks
   */
  buildDecks(options = {}) {
    const decks = [];

    // Deck 1: Série harmonique
    decks.push({
      name: 'Acoustique - Série harmonique',
      description: 'Comprendre la série harmonique et les intervalles naturels',
      tags: [...this.tags, 'intermediaire'],
      settings: { sequential: false, bidirectional: false },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { deckType: 'harmonics' }
        }
      },
      cards: this._formatCards(this._generateHarmonicsCards()),
      resources: this.commonResources
    });

    // Deck 2: Consonance/Dissonance
    decks.push({
      name: 'Acoustique - Consonance et dissonance',
      description: 'Comprendre pourquoi certains intervalles sonnent bien ensemble',
      tags: [...this.tags, 'intermediaire'],
      settings: { sequential: false, bidirectional: false },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { deckType: 'consonance' }
        }
      },
      cards: this._formatCards(this._generateConsonanceCards()),
      resources: [
        ...this.commonResources,
        {
          type: 'summary',
          title: 'Consonance et dissonance',
          content: `La **consonance** est liée à la simplicité du ratio de fréquences.

**Consonances parfaites** (très stables)
- Unisson (1:1)
- Octave (2:1)
- Quinte (3:2)
- Quarte (4:3)

**Consonances imparfaites** (agréables mais moins stables)
- Tierces (5:4, 6:5)
- Sixtes (5:3, 8:5)

**Dissonances** (tension, besoin de résolution)
- Secondes, Septièmes, Triton

La dissonance n'est pas "mauvaise" - c'est la tension qui crée le mouvement en musique !`,
          aiGenerated: true,
          icon: '🎶',
          order: 3
        }
      ]
    });

    // Deck 3: Timbres
    decks.push({
      name: 'Acoustique - Timbres et instruments',
      description: 'Comprendre ce qui fait la différence entre un piano et un violon',
      tags: [...this.tags, 'intermediaire'],
      settings: { sequential: false, bidirectional: false },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { deckType: 'timbre' }
        }
      },
      cards: this._formatCards(this._generateTimbreCards()),
      resources: [
        ...this.commonResources,
        {
          type: 'summary',
          title: 'Le timbre expliqué',
          content: `Pourquoi un piano et une flûte jouant la même note sonnent différemment ?

**Le timbre = cocktail d'harmoniques**

- **Flûte** : Presque que la fondamentale → Son pur
- **Clarinette** : Harmoniques impairs (1, 3, 5) → Son creux
- **Violon** : Tous les harmoniques → Son riche
- **Trompette** : Harmoniques aigus forts → Son brillant

Chaque instrument a sa "signature spectrale" unique, comme une empreinte digitale sonore.`,
          aiGenerated: true,
          icon: '🎻',
          order: 3
        }
      ]
    });

    // Deck 4: Battements
    decks.push({
      name: 'Acoustique - Battements',
      description: 'Comprendre les battements et leur utilisation pour l\'accordage',
      tags: [...this.tags, 'debutant'],
      settings: { sequential: false, bidirectional: false },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { deckType: 'beats' }
        }
      },
      cards: this._formatCards(this._generateBeatsCards()),
      resources: [
        this.commonResources[0], // Visualiseur
        {
          type: 'summary',
          title: 'Les battements acoustiques',
          content: `Quand deux fréquences proches sont jouées ensemble, leur interférence crée des **battements**.

**Formule**
Fréquence des battements = |f₁ - f₂|

**Exemple**
- 440 Hz + 442 Hz = 2 battements/seconde
- 440 Hz + 440 Hz = 0 battement (unisson parfait)

**Application : accordage**
1. Jouer la note de référence et l'instrument
2. Écouter les battements
3. Ajuster jusqu'à ce que les battements disparaissent

Plus les battements sont lents, plus vous approchez de la justesse !`,
          aiGenerated: true,
          icon: '🔧',
          order: 1
        }
      ]
    });

    return decks;
  }
}

module.exports = HarmonicsGenerator;
