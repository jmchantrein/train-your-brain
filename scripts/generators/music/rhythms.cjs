/**
 * Rhythms Generator
 *
 * Génère des decks pour l'apprentissage des rythmes :
 * - Figures de notes (ronde, blanche, noire, croche, etc.)
 * - Mesures simples et composées
 * - Rythmes du monde avec origines culturelles
 *
 * Les cartes utilisent le type MCQ avec images et feedback.
 */

const BaseGenerator = require('../base-generator.cjs');

class RhythmsGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'rhythms',
      name: 'Rythmes et figures de notes',
      tags: ['musique', 'rythme', 'solfege'],
      version: '1.0.0',
      description: 'Apprendre les figures de notes, mesures et rythmes du monde'
    });

    // Figures de notes avec leurs valeurs
    this.NOTE_VALUES = [
      {
        id: 'whole',
        name: 'Ronde',
        symbol: '𝅝',
        beats: 4,
        description: 'La ronde vaut 4 temps (ou une mesure entière en 4/4).',
        rest: '𝄻',
        restName: 'Pause'
      },
      {
        id: 'half',
        name: 'Blanche',
        symbol: '𝅗𝅥',
        beats: 2,
        description: 'La blanche vaut 2 temps (moitié d\'une ronde).',
        rest: '𝄼',
        restName: 'Demi-pause'
      },
      {
        id: 'quarter',
        name: 'Noire',
        symbol: '♩',
        beats: 1,
        description: 'La noire vaut 1 temps (le battement de base).',
        rest: '𝄽',
        restName: 'Soupir'
      },
      {
        id: 'eighth',
        name: 'Croche',
        symbol: '♪',
        beats: 0.5,
        description: 'La croche vaut un demi-temps (2 par temps).',
        rest: '𝄾',
        restName: 'Demi-soupir'
      },
      {
        id: 'sixteenth',
        name: 'Double-croche',
        symbol: '𝅘𝅥𝅯',
        beats: 0.25,
        description: 'La double-croche vaut un quart de temps (4 par temps).',
        rest: '𝄿',
        restName: 'Quart de soupir'
      },
      {
        id: 'dotted_half',
        name: 'Blanche pointée',
        symbol: '𝅗𝅥.',
        beats: 3,
        description: 'Le point ajoute la moitié de la valeur (2 + 1 = 3 temps).',
        rest: '𝄼.',
        restName: 'Demi-pause pointée'
      },
      {
        id: 'dotted_quarter',
        name: 'Noire pointée',
        symbol: '♩.',
        beats: 1.5,
        description: 'Le point ajoute la moitié de la valeur (1 + 0.5 = 1.5 temps).',
        rest: '𝄽.',
        restName: 'Soupir pointé'
      }
    ];

    // Mesures (signatures rythmiques)
    this.TIME_SIGNATURES = [
      {
        id: 'simple_2_4',
        signature: '2/4',
        name: 'Deux-quatre',
        type: 'simple',
        beatsPerMeasure: 2,
        beatUnit: 4,
        character: 'Marche, polka',
        description: '2 temps par mesure, la noire vaut 1 temps. Souvent utilisé pour les marches.'
      },
      {
        id: 'simple_3_4',
        signature: '3/4',
        name: 'Trois-quatre',
        type: 'simple',
        beatsPerMeasure: 3,
        beatUnit: 4,
        character: 'Valse, menuet',
        description: '3 temps par mesure. C\'est la mesure de la valse.'
      },
      {
        id: 'simple_4_4',
        signature: '4/4',
        name: 'Quatre-quatre',
        type: 'simple',
        beatsPerMeasure: 4,
        beatUnit: 4,
        character: 'Pop, rock, classique',
        description: '4 temps par mesure. La mesure la plus courante en musique occidentale. Aussi notée C.'
      },
      {
        id: 'compound_6_8',
        signature: '6/8',
        name: 'Six-huit',
        type: 'compound',
        beatsPerMeasure: 2,
        beatUnit: 8,
        character: 'Berceuse, marche lente',
        description: '2 temps composés (chaque temps = 3 croches). Donne un balancement ternaire.'
      },
      {
        id: 'compound_9_8',
        signature: '9/8',
        name: 'Neuf-huit',
        type: 'compound',
        beatsPerMeasure: 3,
        beatUnit: 8,
        character: 'Rare, utilisé en musique classique',
        description: '3 temps composés (chaque temps = 3 croches).'
      },
      {
        id: 'compound_12_8',
        signature: '12/8',
        name: 'Douze-huit',
        type: 'compound',
        beatsPerMeasure: 4,
        beatUnit: 8,
        character: 'Blues, ballades',
        description: '4 temps composés (chaque temps = 3 croches). Très utilisé en blues et gospel.'
      }
    ];

    // Rythmes du monde avec origines
    this.WORLD_RHYTHMS = [
      {
        id: 'samba',
        name: 'Samba',
        origin: 'Brésil',
        region: 'Amérique du Sud',
        tempo: '100-130',
        signature: '2/4',
        pattern: '● ○ ● ● ○ ● ○ ●',
        description: 'Né à Rio de Janeiro au début du 20e siècle, fusion de rythmes africains et brésiliens.',
        instruments: ['Surdo', 'Tamborim', 'Agogô', 'Cuíca'],
        characteristics: 'Syncopé, festif, dansant'
      },
      {
        id: 'bossa_nova',
        name: 'Bossa Nova',
        origin: 'Brésil',
        region: 'Amérique du Sud',
        tempo: '120-140',
        signature: '4/4',
        pattern: '● ○ ○ ● ○ ○ ● ○',
        description: 'Né à la fin des années 1950 à Rio, fusion de samba et jazz cool.',
        instruments: ['Guitare', 'Contrebasse', 'Batterie légère'],
        characteristics: 'Doux, intime, syncopé subtilement'
      },
      {
        id: 'tango',
        name: 'Tango',
        origin: 'Argentine',
        region: 'Amérique du Sud',
        tempo: '60-66',
        signature: '4/4',
        pattern: '● ○ ○ ● ● ○ ○ ●',
        description: 'Né dans les quartiers populaires de Buenos Aires fin 19e siècle.',
        instruments: ['Bandonéon', 'Violon', 'Piano', 'Contrebasse'],
        characteristics: 'Passionné, dramatique, avec pauses expressives'
      },
      {
        id: 'rumba',
        name: 'Rumba',
        origin: 'Cuba',
        region: 'Caraïbes',
        tempo: '80-100',
        signature: '4/4',
        pattern: '● ○ ○ ● ○ ● ○ ●',
        description: 'Originaire de Cuba, issue des traditions afro-cubaines du 19e siècle.',
        instruments: ['Congas', 'Claves', 'Timbales', 'Bongos'],
        characteristics: 'Envoûtant, sensuel, basé sur le clave'
      },
      {
        id: 'reggae',
        name: 'Reggae',
        origin: 'Jamaïque',
        region: 'Caraïbes',
        tempo: '60-90',
        signature: '4/4',
        pattern: '○ ● ○ ● ○ ● ○ ●',
        description: 'Né en Jamaïque dans les années 1960, dérivé du ska et du rocksteady.',
        instruments: ['Guitare', 'Basse', 'Batterie', 'Orgue'],
        characteristics: 'Offbeat marqué, détendu, rebondi (one drop)'
      },
      {
        id: 'swing',
        name: 'Swing',
        origin: 'États-Unis',
        region: 'Amérique du Nord',
        tempo: '120-180',
        signature: '4/4',
        pattern: '● ○●● ○●● ○',
        description: 'Apparu dans les années 1930-40 aux USA, période des big bands.',
        instruments: ['Big band', 'Contrebasse', 'Batterie', 'Piano'],
        characteristics: 'Ternaire (shuffle), énergique, dansant'
      },
      {
        id: 'waltz',
        name: 'Valse',
        origin: 'Autriche/Allemagne',
        region: 'Europe',
        tempo: '84-120',
        signature: '3/4',
        pattern: '● ○ ○',
        description: 'Originaire de Vienne au 18e siècle, danse tournoyante.',
        instruments: ['Orchestre', 'Accordéon', 'Piano'],
        characteristics: 'Ternaire, élégant, premier temps accentué'
      },
      {
        id: 'tarantella',
        name: 'Tarentelle',
        origin: 'Italie',
        region: 'Europe',
        tempo: '150-180',
        signature: '6/8',
        pattern: '● ● ● ● ● ●',
        description: 'Danse italienne du sud, on croyait qu\'elle guérissait des morsures de tarentule.',
        instruments: ['Tambourin', 'Mandoline', 'Accordéon'],
        characteristics: 'Rapide, tourbillonnant, endiablé'
      },
      {
        id: 'flamenco',
        name: 'Flamenco',
        origin: 'Espagne',
        region: 'Europe',
        tempo: '60-120',
        signature: '12/8',
        pattern: '● ○ ○ ● ○ ○ ● ○ ● ○ ● ○',
        description: 'Art andalou mêlant chant, danse et guitare, influences gitanes et mauresques.',
        instruments: ['Guitare flamenca', 'Cajón', 'Palmas'],
        characteristics: 'Complexe (compás), passionné, virtuose'
      },
      {
        id: 'polka',
        name: 'Polka',
        origin: 'Bohême (Tchéquie)',
        region: 'Europe centrale',
        tempo: '104-120',
        signature: '2/4',
        pattern: '● ● ○ ●',
        description: 'Danse populaire née en Bohême au 19e siècle, répandue dans toute l\'Europe.',
        instruments: ['Accordéon', 'Clarinette', 'Tuba', 'Batterie'],
        characteristics: 'Vif, sautillant, joyeux'
      },
      {
        id: 'afrobeat',
        name: 'Afrobeat',
        origin: 'Nigeria',
        region: 'Afrique',
        tempo: '100-130',
        signature: '4/4',
        pattern: '● ○ ● ○ ● ○ ● ●',
        description: 'Créé par Fela Kuti dans les années 1960-70, fusion de highlife, funk et jazz.',
        instruments: ['Batterie', 'Congas', 'Guitare', 'Cuivres'],
        characteristics: 'Polyrythmique, groove, engagé politiquement'
      },
      {
        id: 'gnawa',
        name: 'Gnawa',
        origin: 'Maroc',
        region: 'Afrique du Nord',
        tempo: '80-120',
        signature: '4/4',
        pattern: '● ○ ● ○ ● ● ○ ●',
        description: 'Musique spirituelle d\'origine subsaharienne pratiquée au Maroc.',
        instruments: ['Guembri', 'Qraqeb', 'Tbel'],
        characteristics: 'Hypnotique, spirituel, répétitif'
      }
    ];

    // Ressources pédagogiques communes
    this.commonResources = [
      {
        type: 'summary',
        title: 'Les bases du rythme',
        content: `Le rythme est l'organisation du temps en musique. Il repose sur :

- **Le tempo** : La vitesse (en BPM - battements par minute)
- **La mesure** : Comment les temps sont groupés (ex: 4/4 = 4 temps)
- **Les figures de notes** : La durée de chaque son

**Binaire vs Ternaire**
- **Binaire** : Chaque temps se divise en 2 (rock, pop)
- **Ternaire** : Chaque temps se divise en 3 (swing, valse)`,
        aiGenerated: true,
        icon: '🥁',
        order: 0
      },
      {
        type: 'tip',
        title: 'Compter les temps',
        content: `Pour compter les rythmes binaires en 4/4 :
- Noires : **1 - 2 - 3 - 4**
- Croches : **1 et 2 et 3 et 4 et**
- Double-croches : **1 e et a 2 e et a 3 e et a 4 e et a**

Pour le ternaire (swing/6-8) :
- **1-la-li 2-la-li** (ou 1-trip-let)`,
        icon: '💡',
        order: 1
      }
    ];
  }

  /**
   * Génère les cartes pour les figures de notes
   */
  _generateNoteValueCards() {
    const cards = [];

    // Questions sur les symboles
    this.NOTE_VALUES.forEach(note => {
      // Identifier la figure
      const nameChoices = this._getChoicesWithId(note.name, this.NOTE_VALUES.map(n => n.name));
      cards.push({
        id: `note_value_${note.id}`,
        question: `Quelle est cette figure de note : ${note.symbol} ?`,
        answer: nameChoices.correctId,
        type: 'mcq',
        single: true,
        choices: nameChoices.choices,
        feedback: note.description
      });

      // Quelle est la durée
      const beatsOptions = [...new Set([note.beats, note.beats * 2, note.beats / 2, note.beats + 1])]
        .filter(b => b > 0)
        .slice(0, 4)
        .map(b => `${b} temps`);
      const beatsChoices = this._getChoicesWithId(`${note.beats} temps`, beatsOptions);
      cards.push({
        id: `note_beats_${note.id}`,
        question: `Combien de temps vaut une ${note.name.toLowerCase()} (${note.symbol}) ?`,
        answer: beatsChoices.correctId,
        type: 'mcq',
        single: true,
        choices: beatsChoices.choices,
        feedback: note.description
      });

      // Silence correspondant
      const restChoices = this._getChoicesWithId(note.restName, this.NOTE_VALUES.map(n => n.restName));
      cards.push({
        id: `note_rest_${note.id}`,
        question: `Quel silence correspond à la ${note.name.toLowerCase()} (${note.symbol}) ?`,
        answer: restChoices.correctId,
        type: 'mcq',
        single: true,
        choices: restChoices.choices,
        feedback: `Le ${note.restName} (${note.rest}) a la même durée que la ${note.name} : ${note.beats} temps.`
      });
    });

    return cards;
  }

  /**
   * Génère les cartes pour les mesures
   */
  _generateTimeSignatureCards() {
    const cards = [];

    this.TIME_SIGNATURES.forEach(ts => {
      // Identifier la mesure
      const beatsChoices = this._getChoicesWithId(
        `${ts.beatsPerMeasure} temps`,
        ['2 temps', '3 temps', '4 temps', '6 temps']
      );
      cards.push({
        id: `time_sig_${ts.id}`,
        question: `La mesure ${ts.signature} a combien de temps par mesure ?`,
        answer: beatsChoices.correctId,
        type: 'mcq',
        single: true,
        choices: beatsChoices.choices,
        feedback: ts.description
      });

      // Type de mesure
      const typeText = ts.type === 'simple' ? 'Simple (binaire)' : 'Composée (ternaire)';
      const typeChoices = this._getChoicesWithId(typeText, ['Simple (binaire)', 'Composée (ternaire)']);
      cards.push({
        id: `time_type_${ts.id}`,
        question: `La mesure ${ts.signature} est de type :`,
        answer: typeChoices.correctId,
        type: 'mcq',
        single: true,
        choices: typeChoices.choices,
        feedback: ts.description
      });

      // Caractère
      const charChoices = this._getChoicesWithId(ts.character, this.TIME_SIGNATURES.map(t => t.character));
      cards.push({
        id: `time_char_${ts.id}`,
        question: `La mesure ${ts.signature} est typiquement utilisée pour :`,
        answer: charChoices.correctId,
        type: 'mcq',
        single: true,
        choices: charChoices.choices,
        feedback: ts.description
      });
    });

    return cards;
  }

  /**
   * Génère les cartes pour les rythmes du monde
   */
  _generateWorldRhythmsCards() {
    const cards = [];

    this.WORLD_RHYTHMS.forEach(rhythm => {
      // Origine du rythme
      const originChoices = this._getChoicesWithId(rhythm.origin, [...new Set(this.WORLD_RHYTHMS.map(r => r.origin))]);
      cards.push({
        id: `rhythm_origin_${rhythm.id}`,
        question: `D'où vient le ${rhythm.name} ?`,
        answer: originChoices.correctId,
        type: 'mcq',
        single: true,
        choices: originChoices.choices,
        feedback: `${rhythm.description}\n\nCaractéristiques : ${rhythm.characteristics}`
      });

      // Mesure typique
      const sigChoices = this._getChoicesWithId(rhythm.signature, [...new Set(this.WORLD_RHYTHMS.map(r => r.signature))]);
      cards.push({
        id: `rhythm_time_${rhythm.id}`,
        question: `Quelle est la mesure typique du ${rhythm.name} ?`,
        answer: sigChoices.correctId,
        type: 'mcq',
        single: true,
        choices: sigChoices.choices,
        feedback: `Le ${rhythm.name} est généralement en ${rhythm.signature}, tempo ${rhythm.tempo} BPM.`
      });

      // Identifier le rythme par sa caractéristique
      const nameChoices = this._getChoicesWithId(rhythm.name, this.WORLD_RHYTHMS.map(r => r.name));
      cards.push({
        id: `rhythm_char_${rhythm.id}`,
        question: `Quel rythme est décrit comme "${rhythm.characteristics}" ?`,
        answer: nameChoices.correctId,
        type: 'mcq',
        single: true,
        choices: nameChoices.choices,
        feedback: `${rhythm.description}\n\nOriginaire de : ${rhythm.origin}`
      });

      // Instruments typiques
      const instChoices = this._getInstrumentChoicesWithId(rhythm.instruments);
      cards.push({
        id: `rhythm_inst_${rhythm.id}`,
        question: `Quels instruments sont typiques du ${rhythm.name} ?`,
        answer: instChoices.correctId,
        type: 'mcq',
        single: true,
        choices: instChoices.choices,
        feedback: `Le ${rhythm.name} (${rhythm.origin}) utilise traditionnellement : ${rhythm.instruments.join(', ')}.`
      });
    });

    return cards;
  }

  /**
   * Génère des choix avec la bonne réponse et des distracteurs
   * Retourne { choices, correctId }
   */
  _getChoicesWithId(correct, allOptions) {
    const letters = ['A', 'B', 'C', 'D'];
    const options = [correct];
    const others = allOptions.filter(o => o !== correct);

    // Mélanger et prendre 3 distracteurs
    const shuffled = this.shuffle(others, `distractors:${correct}`).slice(0, 3);
    options.push(...shuffled);

    // Mélanger toutes les options pour que la bonne réponse ne soit pas toujours A
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
   * Génère des choix d'instruments
   * Retourne { choices, correctId }
   */
  _getInstrumentChoicesWithId(correctInstruments) {
    const allInstruments = [...new Set(this.WORLD_RHYTHMS.flatMap(r => r.instruments))];
    const correct = correctInstruments.join(', ');
    const letters = ['A', 'B', 'C', 'D'];

    const options = [correct];

    // Générer de faux ensembles d'instruments
    const fakeRng = this.rng(`fake-instruments:${correct}`);
    while (options.length < 4) {
      const fakeInstruments = this.shuffle(allInstruments, fakeRng)
        .slice(0, correctInstruments.length);
      const fake = fakeInstruments.join(', ');
      if (fake !== correct && !options.includes(fake)) {
        options.push(fake);
      }
    }

    // Mélanger
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
   * Génère les cartes - méthode requise par BaseGenerator
   */
  generate(options = {}) {
    const deckType = options.deckType || 'note_values';

    switch (deckType) {
      case 'note_values':
        return this._generateNoteValueCards();
      case 'time_signatures':
        return this._generateTimeSignatureCards();
      case 'world_rhythms':
        return this._generateWorldRhythmsCards();
      default:
        return this._generateNoteValueCards();
    }
  }

  /**
   * Génère plusieurs decks
   */
  buildDecks(options = {}) {
    const decks = [];

    // Deck 1: Figures de notes
    decks.push({
      name: 'Rythmes - Figures de notes',
      description: 'Apprendre les rondes, blanches, noires, croches et leurs silences',
      tags: [...this.tags, 'debutant'],
      settings: { sequential: false, bidirectional: false },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { deckType: 'note_values' }
        }
      },
      cards: this._formatCards(this._generateNoteValueCards()),
      resources: this.commonResources
    });

    // Deck 2: Mesures
    decks.push({
      name: 'Rythmes - Mesures et signatures',
      description: 'Comprendre les mesures simples (2/4, 3/4, 4/4) et composées (6/8, 9/8, 12/8)',
      tags: [...this.tags, 'intermediaire'],
      settings: { sequential: false, bidirectional: false },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { deckType: 'time_signatures' }
        }
      },
      cards: this._formatCards(this._generateTimeSignatureCards()),
      resources: this.commonResources
    });

    // Deck 3: Rythmes du monde
    decks.push({
      name: 'Rythmes du monde',
      description: 'Découvrir les rythmes traditionnels : samba, tango, reggae, flamenco, valse...',
      tags: [...this.tags, 'culture', 'musiques-monde', 'intermediaire'],
      settings: { sequential: false, bidirectional: false },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { deckType: 'world_rhythms' }
        }
      },
      cards: this._formatCards(this._generateWorldRhythmsCards()),
      resources: [
        ...this.commonResources,
        {
          type: 'summary',
          title: 'Les rythmes du monde',
          content: `Chaque culture a développé ses propres rythmes, reflétant son histoire et sa sensibilité.

**Amérique du Sud** : Samba, Bossa Nova, Tango
→ Influence africaine + européenne

**Caraïbes** : Rumba, Reggae
→ Racines africaines, créativité insulaire

**Europe** : Valse, Polka, Tarentelle, Flamenco
→ Danses de cour et populaires

**Afrique** : Afrobeat, Gnawa
→ Polyrythmie, spiritualité

**États-Unis** : Swing
→ Fusion européenne + africaine = Jazz`,
          aiGenerated: true,
          icon: '🌍',
          order: 2
        }
      ]
    });

    return decks;
  }
}

module.exports = RhythmsGenerator;
