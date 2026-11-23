/**
 * Module DeckValidator - Validation algorithmique des decks générés par LLM
 *
 * Ce module fournit une validation complète et non-bloquante des decks,
 * avec scoring de qualité et génération de prompts de correction.
 *
 * Basé sur la recherche : docs/VALIDATION_RESEARCH.md
 *
 * Fonctionnalités :
 * - Validation structurelle (YAML, schéma, types)
 * - Détection de doublons (similarité Jaccard)
 * - Qualité MCQ (item-writing flaws)
 * - Métriques de lisibilité (Flesch-Kincaid)
 * - Classification Bloom
 * - Signaux de risque factuel
 * - Scoring composite
 * - Génération de prompts de correction
 */

const DeckValidator = {
  // ═══════════════════════════════════════════════════════════════
  // CONSTANTES ET CONFIGURATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Types de cartes valides
   */
  VALID_CARD_TYPES: ['text', 'numeric', 'mcq', 'truefalse', 'boolean', 'cloze', 'matching', 'audio-choice', 'staff-note'],

  /**
   * Sévérité des issues
   */
  SEVERITY: {
    ERROR: 'error',      // Bloquant - le deck ne fonctionnera pas correctement
    WARNING: 'warning',  // Important - qualité affectée
    INFO: 'info'         // Suggestion - amélioration possible
  },

  /**
   * Patterns de risque factuel
   */
  FACTUAL_RISK_PATTERNS: [
    // Dates historiques
    {
      pattern: /\b(en|année|le)\s+\d{3,4}\b/i,
      risk: 0.3,
      category: 'DATE',
      message: 'Date historique - à vérifier'
    },
    // Dates complètes
    {
      pattern: /\b\d{1,2}\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+\d{4}\b/i,
      risk: 0.4,
      category: 'DATE',
      message: 'Date précise - à vérifier'
    },
    // Statistiques et mesures
    {
      pattern: /\d+\s*(km|m|cm|mm|kg|g|mg|%|millions?|milliards?|habitants?|personnes?)/i,
      risk: 0.4,
      category: 'STATISTIC',
      message: 'Statistique/mesure - à vérifier'
    },
    // Superlatifs vérifiables
    {
      pattern: /\b(premier|première|plus grand|plus petit|plus haut|plus long|record|le plus|la plus|meilleur|pire)\b/i,
      risk: 0.5,
      category: 'SUPERLATIVE',
      message: 'Superlatif factuel - à vérifier'
    },
    // Attributions
    {
      pattern: /\b(inventé|découvert|créé|fondé|écrit|composé)\s+(par|en)\b/i,
      risk: 0.4,
      category: 'ATTRIBUTION',
      message: 'Attribution historique - à vérifier'
    },
    // Citations
    {
      pattern: /"[^"]{15,}"/,
      risk: 0.6,
      category: 'QUOTE',
      message: 'Citation - exactitude à vérifier'
    },
    // Faits politiques/géographiques
    {
      pattern: /\b(capitale|président|roi|reine|premier ministre|chancelier)\s+(de|du|des|d')\b/i,
      risk: 0.3,
      category: 'POLITICAL',
      message: 'Fait politique/géographique - peut changer'
    },
    // Pourcentages précis
    {
      pattern: /\d+([.,]\d+)?%/,
      risk: 0.3,
      category: 'PERCENTAGE',
      message: 'Pourcentage précis - à vérifier'
    },
    // Termes absolus
    {
      pattern: /\b(toujours|jamais|tous les|aucun|every|never|always|none)\b/i,
      risk: 0.2,
      category: 'ABSOLUTE',
      message: 'Terme absolu - généralement inexact'
    }
  ],

  /**
   * Patterns de détection d'hallucinations potentielles
   * Plus spécifiques que FACTUAL_RISK_PATTERNS, focalisés sur les contenus générés par LLM
   */
  HALLUCINATION_PATTERNS: [
    // Dates précises sans source (année seule)
    {
      pattern: /\b\d{4}\b/,
      risk: 0.4,
      severity: 'warning',
      category: 'DATE',
      message: 'Date précise - vérifiez la source',
      excludeIfSource: true
    },
    // Dates complètes
    {
      pattern: /\b\d{1,2}\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{4}\b/i,
      risk: 0.5,
      severity: 'warning',
      category: 'DATE',
      message: 'Date complète - vérifiez l\'exactitude',
      excludeIfSource: true
    },
    // Pourcentages précis avec décimales
    {
      pattern: /\d+[.,]\d+\s*%/,
      risk: 0.5,
      severity: 'warning',
      category: 'PERCENTAGE',
      message: 'Pourcentage précis - peut être inventé',
      excludeIfSource: true
    },
    // Grands nombres précis
    {
      pattern: /(?<!\d)(?:\d{4,}|\d{1,3}(?:[   ]\d{3})+)\s*(millions?|milliards?|thousands?|km|m\b|habitants?|personnes?|people)\b/i,
      risk: 0.4,
      severity: 'warning',
      category: 'STATISTIC',
      message: 'Statistique précise - vérifiez',
      excludeIfSource: true
    },
    // Citations longues (>15 caractères entre guillemets)
    {
      pattern: /"[^"]{15,}"/,
      risk: 0.6,
      severity: 'warning',
      category: 'QUOTE',
      message: 'Citation longue - vérifiez l\'exactitude',
      excludeIfSource: false
    },
    // Affirmations absolues (toujours, jamais, tous, aucun)
    {
      pattern: /\b(toujours|jamais|tous les|aucun|tous|every|never|always|all|none|no)\b/i,
      risk: 0.2,
      severity: 'info',
      category: 'ABSOLUTE',
      message: 'Affirmation absolue - rarement vraie',
      excludeIfSource: false
    },
    // Noms propres multiples (potentiellement obscurs)
    {
      pattern: /(?<!\p{L})\p{Lu}\p{Ll}+\s+\p{Lu}\p{Ll}+/gu,
      risk: 0.3,
      severity: 'warning',
      category: 'PROPER_NOUN',
      message: 'Nom propre - vérifiez l\'orthographe',
      excludeIfSource: true,
      multiMatch: true
    },
    // Superlatifs absolus
    {
      pattern: /\b(premier|première|seul|seule|unique|only|first|last|dernier|dernière)\b/i,
      risk: 0.3,
      severity: 'info',
      category: 'SUPERLATIVE',
      message: 'Superlatif - peut être contestable',
      excludeIfSource: false
    }
  ],

  /**
   * Noms propres communs à ne pas signaler
   * (villes, pays, personnages historiques très connus)
   */
  COMMON_PROPER_NOUNS: new Set([
    'Paris', 'France', 'London', 'Berlin', 'Rome', 'Madrid', 'Napoléon',
    'Einstein', 'Newton', 'Mozart', 'Shakespeare', 'Leonardo', 'Vinci',
    'Victor Hugo', 'Jean Jacques', 'Marie Curie', 'Louis XIV',
    'Alexandre', 'Jules César', 'Cléopâtre', 'Socrate', 'Platon',
    'New York', 'Washington', 'Tokyo', 'Beijing', 'Moscow',
    'Europe', 'Asia', 'Africa', 'America', 'Oceania'
  ]),

  /**
   * Patterns de classification Bloom
   */
  BLOOM_PATTERNS: {
    remember: {
      patterns: [
        /\b(qu'est-ce que?|quel est|quelle est|quels sont|quelles sont|définir?|nommer?|lister?|citer?|énumérer?)\b/i,
        /\b(qui a|qui est|quand|où|combien)\b/i,
        /\b(what is|who is|when|where|how many|define|list|name)\b/i,
        // Impératif 2e pers. pluriel (\b ASCII ne gère pas les initiales accentuées)
        /(?<![\p{L}\p{N}])(définissez|nommez|listez|citez|énumérez)(?![\p{L}\p{N}])/iu
      ],
      level: 1,
      label: 'Mémorisation',
      labelEn: 'Remember'
    },
    understand: {
      patterns: [
        /\b(expliquer?|décrire?|résumer?|pourquoi|comment fonctionne)\b/i,
        /\b(signifie?|exemple de|illustrer?|interpréter?)\b/i,
        /\b(explain|describe|summarize|why|how does|interpret)\b/i,
        // Impératif 2e pers. pluriel (\b ASCII ne gère pas les initiales accentuées)
        /(?<![\p{L}\p{N}])(expliquez|décrivez|résumez|illustrez|interprétez)(?![\p{L}\p{N}])/iu
      ],
      level: 2,
      label: 'Compréhension',
      labelEn: 'Understand'
    },
    apply: {
      patterns: [
        /\b(calculer?|résoudre?|utiliser?|appliquer?|démontrer?)\b/i,
        /\b(combien font|quel résultat|exécuter?)\b/i,
        /\b(calculate|solve|use|apply|demonstrate|compute)\b/i,
        // Impératif 2e pers. pluriel (\b ASCII ne gère pas les initiales accentuées)
        /(?<![\p{L}\p{N}])(calculez|résolvez|utilisez|appliquez|démontrez|exécutez)(?![\p{L}\p{N}])/iu
      ],
      level: 3,
      label: 'Application',
      labelEn: 'Apply'
    },
    analyze: {
      patterns: [
        /\b(comparer?|distinguer?|analyser?|différence entre|relation entre)\b/i,
        /\b(pourquoi.*différent|classer?|catégoriser?|organiser?)\b/i,
        /\b(compare|contrast|analyze|differentiate|classify|categorize)\b/i,
        // Impératif 2e pers. pluriel (\b ASCII ne gère pas les initiales accentuées)
        /(?<![\p{L}\p{N}])(comparez|distinguez|analysez|classez|catégorisez|organisez)(?![\p{L}\p{N}])/iu
      ],
      level: 4,
      label: 'Analyse',
      labelEn: 'Analyze'
    },
    evaluate: {
      patterns: [
        /\b(juger?|évaluer?|critiquer?|meilleur|pire|justifier?)\b/i,
        /\b(avantages?|inconvénients?|pour ou contre|argumenter?)\b/i,
        /\b(evaluate|judge|critique|justify|argue|assess)\b/i,
        // Impératif 2e pers. pluriel (\b ASCII ne gère pas les initiales accentuées)
        /(?<![\p{L}\p{N}])(jugez|évaluez|critiquez|justifiez|argumentez)(?![\p{L}\p{N}])/iu
      ],
      level: 5,
      label: 'Évaluation',
      labelEn: 'Evaluate'
    },
    create: {
      patterns: [
        /\b(créer?|concevoir?|proposer?|inventer?|construire?)\b/i,
        /\b(imaginer?|planifier?|composer?|formuler?)\b/i,
        /\b(create|design|propose|invent|construct|formulate)\b/i,
        // Impératif 2e pers. pluriel (\b ASCII ne gère pas les initiales accentuées)
        /(?<![\p{L}\p{N}])(créez|concevez|proposez|inventez|construisez|imaginez|planifiez|composez|formulez)(?![\p{L}\p{N}])/iu
      ],
      level: 6,
      label: 'Création',
      labelEn: 'Create'
    }
  },

  /**
   * Défauts d'écriture de QCM (Item-Writing Flaws)
   */
  MCQ_FLAWS: {
    LONGEST_CORRECT: {
      name: 'Bonne réponse plus longue',
      severity: 'warning',
      message: 'La bonne réponse est significativement plus longue que les autres'
    },
    ABSOLUTE_TERMS: {
      name: 'Termes absolus dans distracteurs',
      severity: 'info',
      message: 'Un distracteur contient un terme absolu (toujours, jamais, tous, aucun)'
    },
    WORD_REPETITION: {
      name: 'Répétition de mots',
      severity: 'warning',
      message: 'Des mots de la question sont répétés dans la bonne réponse'
    },
    GRAMMATICAL_CUE: {
      name: 'Indice grammatical',
      severity: 'warning',
      message: 'La structure grammaticale révèle la bonne réponse'
    },
    IMPLAUSIBLE_DISTRACTOR: {
      name: 'Distracteur implausible',
      severity: 'warning',
      message: 'Un distracteur est manifestement absurde ou hors sujet'
    },
    TOO_FEW_OPTIONS: {
      name: 'Trop peu d\'options',
      severity: 'info',
      message: 'Seulement 2 options - 3 ou 4 recommandées'
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // VALIDATION STRUCTURELLE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Valide la structure d'un deck complet
   *
   * @param {Object} deck - Le deck à valider
   * @returns {Object} - { valid, issues }
   */
  validateStructure(deck) {
    const issues = [];

    // Vérification deck
    if (!deck) {
      issues.push(this._createIssue('DECK_MISSING', 'Deck manquant ou invalide', this.SEVERITY.ERROR));
      return { valid: false, issues };
    }

    // ID ou nom requis
    if (!deck.id && !deck.name) {
      issues.push(this._createIssue('DECK_ID_MISSING', 'Le deck doit avoir un ID ou un nom', this.SEVERITY.ERROR));
    }

    // Cartes présentes
    if (!deck.cards || !Array.isArray(deck.cards)) {
      issues.push(this._createIssue('CARDS_MISSING', 'Le deck doit contenir un tableau de cartes', this.SEVERITY.ERROR));
      return { valid: issues.filter(i => i.severity === this.SEVERITY.ERROR).length === 0, issues };
    }

    if (deck.cards.length === 0) {
      issues.push(this._createIssue('CARDS_EMPTY', 'Le deck ne contient aucune carte', this.SEVERITY.ERROR));
    }

    // Vérification des IDs uniques
    const ids = deck.cards.map(c => c.id).filter(Boolean);
    const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (duplicateIds.length > 0) {
      issues.push(this._createIssue(
        'DUPLICATE_IDS',
        `IDs dupliqués: ${[...new Set(duplicateIds)].join(', ')}`,
        this.SEVERITY.ERROR
      ));
    }

    // Validation de chaque carte
    deck.cards.forEach((card, index) => {
      const cardIssues = this._validateCardStructure(card, index);
      issues.push(...cardIssues);
    });

    return {
      valid: issues.filter(i => i.severity === this.SEVERITY.ERROR).length === 0,
      issues
    };
  },

  /**
   * Valide la structure d'une carte individuelle
   */
  _validateCardStructure(card, index) {
    const issues = [];
    const cardRef = card.id || `carte #${index + 1}`;

    // Champs obligatoires
    if (!card.id) {
      issues.push(this._createIssue('CARD_ID_MISSING', `ID manquant`, this.SEVERITY.ERROR, cardRef));
    }

    if (!card.question || String(card.question).trim() === '') {
      issues.push(this._createIssue('QUESTION_MISSING', `Question manquante`, this.SEVERITY.ERROR, cardRef));
    }

    if (card.answer === undefined || card.answer === null || String(card.answer).trim() === '') {
      issues.push(this._createIssue('ANSWER_MISSING', `Réponse manquante`, this.SEVERITY.ERROR, cardRef));
    }

    // Type valide
    if (card.type && !this.VALID_CARD_TYPES.includes(card.type)) {
      issues.push(this._createIssue(
        'INVALID_TYPE',
        `Type "${card.type}" invalide. Valides: ${this.VALID_CARD_TYPES.join(', ')}`,
        this.SEVERITY.ERROR,
        cardRef
      ));
    }

    // Validation spécifique par type
    const type = card.type || 'text';

    switch (type) {
      case 'mcq':
        issues.push(...this._validateMcqStructure(card, cardRef));
        break;
      case 'audio-choice':
        issues.push(...this._validateAudioChoiceStructure(card, cardRef));
        break;
      case 'staff-note':
        issues.push(...this._validateStaffNoteStructure(card, cardRef));
        break;
      case 'truefalse':
      case 'boolean':
        issues.push(...this._validateBooleanStructure(card, cardRef));
        break;
      case 'numeric':
        issues.push(...this._validateNumericStructure(card, cardRef));
        break;
    }

    // Warning: type "text" explicite
    if (card.type === 'text') {
      issues.push(this._createIssue(
        'EXPLICIT_TEXT_TYPE',
        `Type "text" explicite inutile (c'est le défaut)`,
        this.SEVERITY.INFO,
        cardRef
      ));
    }

    return issues;
  },

  /**
   * Valide la structure d'une carte MCQ
   */
  _validateMcqStructure(card, cardRef) {
    const issues = [];

    // Options/choices présentes
    const options = card.choices || card.options;
    if (!options || !Array.isArray(options)) {
      issues.push(this._createIssue('MCQ_OPTIONS_MISSING', `QCM sans options/choices`, this.SEVERITY.ERROR, cardRef));
      return issues;
    }

    if (options.length < 2) {
      issues.push(this._createIssue('MCQ_TOO_FEW_OPTIONS', `QCM avec moins de 2 options`, this.SEVERITY.ERROR, cardRef));
      return issues;
    }

    // Chaque option doit avoir un ID
    options.forEach((opt, i) => {
      if (!opt.id) {
        issues.push(this._createIssue('MCQ_OPTION_NO_ID', `Option #${i + 1} sans ID`, this.SEVERITY.ERROR, cardRef));
      }
      if (!opt.text || String(opt.text).trim() === '') {
        issues.push(this._createIssue('MCQ_OPTION_NO_TEXT', `Option ${opt.id || '#' + (i + 1)} sans texte`, this.SEVERITY.ERROR, cardRef));
      }
    });

    // IDs d'options uniques
    const optionIds = options.map(o => o.id).filter(Boolean);
    const dupOptIds = optionIds.filter((id, i) => optionIds.indexOf(id) !== i);
    if (dupOptIds.length > 0) {
      issues.push(this._createIssue('MCQ_DUPLICATE_OPTION_IDS', `IDs d'options dupliqués: ${dupOptIds.join(', ')}`, this.SEVERITY.ERROR, cardRef));
    }

    // Answer doit être un ID valide
    const answer = String(card.answer || '');
    const answerIds = answer.split(',').map(s => s.trim());
    const invalidIds = answerIds.filter(id => !optionIds.includes(id));

    if (invalidIds.length > 0) {
      // Vérifier si c'est le texte d'une option
      const optionTexts = options.map(o => String(o.text || '').toLowerCase());
      if (optionTexts.includes(answer.toLowerCase())) {
        issues.push(this._createIssue(
          'MCQ_ANSWER_IS_TEXT',
          `answer doit être l'ID (ex: "A"), pas le texte "${answer}"`,
          this.SEVERITY.ERROR,
          cardRef
        ));
      } else {
        issues.push(this._createIssue(
          'MCQ_INVALID_ANSWER',
          `answer "${answer}" ne correspond pas aux IDs: ${optionIds.join(', ')}`,
          this.SEVERITY.ERROR,
          cardRef
        ));
      }
    }

    return issues;
  },

  /**
   * Valide la structure d'une carte Audio-Choice (ear training)
   */
  _validateAudioChoiceStructure(card, cardRef) {
    const issues = [];

    // Validation des choices (similaire à MCQ)
    const options = card.choices || card.options;
    if (!options || !Array.isArray(options)) {
      issues.push(this._createIssue('AUDIO_CHOICE_OPTIONS_MISSING', `Audio-choice sans choices`, this.SEVERITY.ERROR, cardRef));
      return issues;
    }

    if (options.length < 2) {
      issues.push(this._createIssue('AUDIO_CHOICE_TOO_FEW_OPTIONS', `Audio-choice avec moins de 2 options`, this.SEVERITY.ERROR, cardRef));
      return issues;
    }

    // Chaque option doit avoir un ID et un texte
    options.forEach((opt, i) => {
      if (!opt.id) {
        issues.push(this._createIssue('AUDIO_CHOICE_OPTION_NO_ID', `Option #${i + 1} sans ID`, this.SEVERITY.ERROR, cardRef));
      }
      if (!opt.text || String(opt.text).trim() === '') {
        issues.push(this._createIssue('AUDIO_CHOICE_OPTION_NO_TEXT', `Option ${opt.id || '#' + (i + 1)} sans texte`, this.SEVERITY.ERROR, cardRef));
      }
    });

    // Validation du champ audio
    if (!card.audio) {
      issues.push(this._createIssue('AUDIO_MISSING', `Champ "audio" manquant pour audio-choice`, this.SEVERITY.ERROR, cardRef));
    } else {
      const audio = card.audio;
      const validAudioTypes = ['note', 'interval', 'chord'];
      if (audio.type && !validAudioTypes.includes(audio.type)) {
        issues.push(this._createIssue('AUDIO_INVALID_TYPE', `Type audio "${audio.type}" invalide. Valides: ${validAudioTypes.join(', ')}`, this.SEVERITY.WARNING, cardRef));
      }

      // Pour note: vérifier que note est présent
      if (audio.type === 'note' && !audio.note) {
        issues.push(this._createIssue('AUDIO_NOTE_MISSING', `Type "note" sans champ "note"`, this.SEVERITY.ERROR, cardRef));
      }

      // Pour interval/chord: vérifier que notes est présent
      if ((audio.type === 'interval' || audio.type === 'chord') && (!audio.notes || !Array.isArray(audio.notes) || audio.notes.length < 2)) {
        issues.push(this._createIssue('AUDIO_NOTES_MISSING', `Type "${audio.type}" nécessite un tableau "notes" avec au moins 2 éléments`, this.SEVERITY.ERROR, cardRef));
      }
    }

    // Answer doit être un ID valide
    const optionIds = options.map(o => o.id).filter(Boolean);
    const answer = String(card.answer || '');
    if (answer && !optionIds.includes(answer)) {
      issues.push(this._createIssue(
        'AUDIO_CHOICE_INVALID_ANSWER',
        `answer "${answer}" ne correspond pas aux IDs: ${optionIds.join(', ')}`,
        this.SEVERITY.ERROR,
        cardRef
      ));
    }

    return issues;
  },

  /**
   * Valide la structure d'une carte Staff-Note (lecture de portée)
   */
  _validateStaffNoteStructure(card, cardRef) {
    const issues = [];

    // Validation des choices (similaire à MCQ)
    const options = card.choices || card.options;
    if (!options || !Array.isArray(options)) {
      issues.push(this._createIssue('STAFF_NOTE_OPTIONS_MISSING', `Staff-note sans choices`, this.SEVERITY.ERROR, cardRef));
      return issues;
    }

    if (options.length < 2) {
      issues.push(this._createIssue('STAFF_NOTE_TOO_FEW_OPTIONS', `Staff-note avec moins de 2 options`, this.SEVERITY.ERROR, cardRef));
      return issues;
    }

    // Chaque option doit avoir un ID et un texte
    options.forEach((opt, i) => {
      if (!opt.id) {
        issues.push(this._createIssue('STAFF_NOTE_OPTION_NO_ID', `Option #${i + 1} sans ID`, this.SEVERITY.ERROR, cardRef));
      }
      if (!opt.text || String(opt.text).trim() === '') {
        issues.push(this._createIssue('STAFF_NOTE_OPTION_NO_TEXT', `Option ${opt.id || '#' + (i + 1)} sans texte`, this.SEVERITY.ERROR, cardRef));
      }
    });

    // Validation du champ staff
    if (!card.staff) {
      issues.push(this._createIssue('STAFF_MISSING', `Champ "staff" manquant pour staff-note`, this.SEVERITY.ERROR, cardRef));
    } else {
      const staff = card.staff;
      const validClefs = ['treble', 'bass', 'alto', 'tenor'];

      if (!staff.note) {
        issues.push(this._createIssue('STAFF_NOTE_MISSING', `Champ "staff.note" manquant`, this.SEVERITY.ERROR, cardRef));
      } else {
        // Valider le format de la note (ex: C4, G#5, Bb3)
        const notePattern = /^[A-G][#b]?\d$/;
        if (!notePattern.test(staff.note)) {
          issues.push(this._createIssue('STAFF_NOTE_INVALID_FORMAT', `Format de note invalide: "${staff.note}". Attendu: C4, G#5, etc.`, this.SEVERITY.ERROR, cardRef));
        }
      }

      if (staff.clef && !validClefs.includes(staff.clef)) {
        issues.push(this._createIssue('STAFF_INVALID_CLEF', `Clé "${staff.clef}" invalide. Valides: ${validClefs.join(', ')}`, this.SEVERITY.WARNING, cardRef));
      }
    }

    // Answer doit être un ID valide
    const optionIds = options.map(o => o.id).filter(Boolean);
    const answer = String(card.answer || '');
    if (answer && !optionIds.includes(answer)) {
      issues.push(this._createIssue(
        'STAFF_NOTE_INVALID_ANSWER',
        `answer "${answer}" ne correspond pas aux IDs: ${optionIds.join(', ')}`,
        this.SEVERITY.ERROR,
        cardRef
      ));
    }

    return issues;
  },

  /**
   * Valide la structure d'une carte Vrai/Faux
   */
  _validateBooleanStructure(card, cardRef) {
    const issues = [];
    const answer = card.answer;

    // Answer doit être un booléen ou "true"/"false"
    const validAnswers = [true, false, 'true', 'false', 'vrai', 'faux'];
    if (!validAnswers.includes(answer) && answer !== true && answer !== false) {
      issues.push(this._createIssue(
        'BOOLEAN_INVALID_ANSWER',
        `answer doit être true/false, pas "${answer}"`,
        this.SEVERITY.ERROR,
        cardRef
      ));
    }

    return issues;
  },

  /**
   * Valide la structure d'une carte numérique
   */
  _validateNumericStructure(card, cardRef) {
    const issues = [];
    const answer = card.answer;

    // Answer doit être un nombre
    if (typeof answer === 'string') {
      const parsed = parseFloat(answer.replace(',', '.'));
      if (isNaN(parsed)) {
        issues.push(this._createIssue(
          'NUMERIC_INVALID_ANSWER',
          `answer "${answer}" n'est pas un nombre valide`,
          this.SEVERITY.ERROR,
          cardRef
        ));
      }
    } else if (typeof answer !== 'number') {
      issues.push(this._createIssue(
        'NUMERIC_INVALID_ANSWER',
        `answer doit être un nombre, pas ${typeof answer}`,
        this.SEVERITY.ERROR,
        cardRef
      ));
    }

    return issues;
  },

  // ═══════════════════════════════════════════════════════════════
  // DÉTECTION DE DOUBLONS (Similarité Jaccard + Levenshtein)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Trouve les cartes en doublon ou très similaires
   *
   * Détecte :
   * 1. Doublons exacts (question + réponse identiques)
   * 2. Questions similaires (Jaccard similarity)
   * 3. Réponses similaires entre cartes similaires
   *
   * @param {Object[]} cards - Tableau de cartes
   * @param {Object} options - Options de détection
   * @param {number} options.questionThreshold - Seuil de similarité questions (0-1, défaut 0.8)
   * @param {number} options.answerThreshold - Seuil de similarité réponses (0-1, défaut 0.9)
   * @param {boolean} options.useLevenshtein - Utiliser Levenshtein pour textes courts (défaut false)
   * @returns {Object[]} - Liste des doublons trouvés
   */
  findDuplicates(cards, options = {}) {
    const {
      questionThreshold = 0.8,
      answerThreshold = 0.9,
      useLevenshtein = false
    } = typeof options === 'number' ? { questionThreshold: options } : options;

    const duplicates = [];
    const exactDuplicates = new Set(); // Pour éviter les doublons de doublons

    // Tout ce qui ne dépend que d'une carte est calculé une seule fois ici
    // (O(n) normalisations) et réutilisé dans la boucle des paires (O(n²)).
    const n = cards.length;
    const normQ = new Array(n);
    const normA = new Array(n);
    for (let k = 0; k < n; k++) {
      normQ[k] = this._normalizeText(cards[k].question);
      normA[k] = this._normalizeText(cards[k].answer);
    }
    const qWords = new Array(n); // calculés à la demande (cartes jamais comparées en Jaccard exclues)
    const aWords = new Array(n);
    const getQ = (k) => qWords[k] || (qWords[k] = this._wordProfile(cards[k].question || ''));
    const getA = (k) => aWords[k] || (aWords[k] = this._wordProfile(String(cards[k].answer || '')));

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const card1 = cards[i];
        const card2 = cards[j];

        // 1. Détection doublon exact (question + réponse identiques)
        if (normQ[i] === normQ[j] && normQ[i] !== '' && normA[i] === normA[j] && normA[i] !== '') {
          exactDuplicates.add(`${i}-${j}`);
          duplicates.push({
            card1: card1.id || `#${i + 1}`,
            card2: card2.id || `#${j + 1}`,
            similarity: 100,
            type: 'exact',
            severity: this.SEVERITY.ERROR,
            message: 'Doublon exact (question ET réponse identiques)',
            details: {
              questionMatch: true,
              answerMatch: true
            }
          });
          continue; // Pas besoin de vérifier la similarité
        }

        // 2. Similarité des questions
        const questionSimilarity = useLevenshtein && this._shouldUseLevenshtein(card1.question, card2.question)
          ? this._levenshteinSimilarity(card1.question || '', card2.question || '')
          : this._profileJaccard(getQ(i), getQ(j));

        if (questionSimilarity >= questionThreshold) {
          // 3. Si questions similaires, vérifier aussi les réponses
          let answerSimilarity;
          if (card1.type === 'numeric' || card1.type === 'boolean' ||
              card2.type === 'numeric' || card2.type === 'boolean' ||
              (card1.type === 'mcq' && card2.type === 'mcq') ||
              (useLevenshtein && this._shouldUseLevenshtein(String(card1.answer || ''), String(card2.answer || '')))) {
            // Cas rares : on garde la méthode d'origine (comparaison stricte / Levenshtein)
            answerSimilarity = this._calculateAnswerSimilarity(card1, card2, useLevenshtein);
          } else {
            answerSimilarity = this._profileJaccard(getA(i), getA(j));
          }

          const severity = questionSimilarity > 0.95 ? this.SEVERITY.ERROR : this.SEVERITY.WARNING;
          const similarAnswers = answerSimilarity >= answerThreshold;

          duplicates.push({
            card1: card1.id || `#${i + 1}`,
            card2: card2.id || `#${j + 1}`,
            similarity: Math.round(questionSimilarity * 100),
            answerSimilarity: Math.round(answerSimilarity * 100),
            type: similarAnswers ? 'full' : 'question',
            severity,
            message: this._getDuplicateMessage(questionSimilarity, answerSimilarity, similarAnswers),
            details: {
              questionMatch: questionSimilarity > 0.95,
              answerMatch: similarAnswers,
              method: useLevenshtein ? 'levenshtein' : 'jaccard'
            }
          });
        }
      }
    }

    return duplicates;
  },

  /**
   * Normalisation Unicode pour les comparaisons (casse, accents latins, espaces, ponctuation).
   * Délègue à TextUtils.normalizeText (source unique de la logique).
   * @private
   */
  _normalizeText(text) {
    // TextUtils est chargé avant ce module (build.manifest.json, loader Node)
    return TextUtils.normalizeText(String(text ?? ''));
  },

  /**
   * Calcule la similarité des réponses entre deux cartes
   */
  _calculateAnswerSimilarity(card1, card2, useLevenshtein = false) {
    const answer1 = String(card1.answer || '');
    const answer2 = String(card2.answer || '');

    // Pour les types numériques ou booléens, comparaison stricte
    if (card1.type === 'numeric' || card1.type === 'boolean' ||
        card2.type === 'numeric' || card2.type === 'boolean') {
      return answer1.toLowerCase().trim() === answer2.toLowerCase().trim() ? 1 : 0;
    }

    // Pour MCQ, comparer les IDs
    if (card1.type === 'mcq' && card2.type === 'mcq') {
      return answer1.toLowerCase().trim() === answer2.toLowerCase().trim() ? 1 : 0;
    }

    // Pour texte, utiliser Jaccard ou Levenshtein
    if (useLevenshtein && this._shouldUseLevenshtein(answer1, answer2)) {
      return this._levenshteinSimilarity(answer1, answer2);
    }

    return this._jaccardSimilarity(answer1, answer2);
  },

  /**
   * Détermine si Levenshtein est plus approprié que Jaccard
   * (pour textes courts ou très similaires)
   */
  _shouldUseLevenshtein(str1, str2) {
    const totalLength = (str1 || '').length + (str2 || '').length;
    return totalLength < 50; // Levenshtein meilleur pour textes courts
  },

  /**
   * Génère un message descriptif pour un doublon
   */
  _getDuplicateMessage(questionSim, answerSim, similarAnswers) {
    if (questionSim > 0.95 && similarAnswers) {
      return 'Questions ET réponses quasi-identiques';
    }
    if (questionSim > 0.95) {
      return 'Questions quasi-identiques (réponses différentes)';
    }
    if (similarAnswers) {
      return 'Questions similaires avec même réponse';
    }
    return 'Questions très similaires';
  },

  /**
   * Calcule la similarité Jaccard entre deux textes
   * Utilise des ensembles de mots (insensible à l'ordre)
   *
   * @param {string} str1 - Premier texte
   * @param {string} str2 - Deuxième texte
   * @returns {number} - Similarité entre 0 et 1
   */
  _jaccardSimilarity(str1, str2) {
    return this._profileJaccard(this._wordProfile(str1), this._wordProfile(str2));
  },

  /**
   * Profil Jaccard d'un texte (calculable une fois par carte) :
   * texte normalisé (apostrophes et traits d'union entre lettres séparent les mots)
   * et ensemble de ses mots significatifs.
   * @private
   */
  _wordProfile(str) {
    const norm = this._normalizeText(
      String(str || '').replace(/['\u2019]/g, ' ').replace(/(\p{L})[-\u2010\u2011](?=\p{L})/gu, '$1 ')
    );
    // Mots courts (<= 2 caractères) ignorés, sauf ceux contenant un chiffre (« 7 », « 12 »)
    const words = new Set();
    for (const w of norm.split(/\s+/)) {
      if (w.length > 2 || /\p{N}/u.test(w)) words.add(w);
    }
    return { norm, words };
  },

  /**
   * Similarité Jaccard entre deux profils issus de _wordProfile.
   * @private
   */
  _profileJaccard(p1, p2) {
    const words1 = p1.words;
    const words2 = p2.words;

    // Aucun mot significatif des deux côtés : on ne peut pas conclure à une similarité.
    // Seule l'égalité de textes normalisés non vides vaut 1 ; deux textes vides valent 0.
    if (words1.size === 0 && words2.size === 0) {
      return p1.norm !== '' && p1.norm === p2.norm ? 1 : 0;
    }
    if (words1.size === 0 || words2.size === 0) return 0;

    const [small, large] = words1.size <= words2.size ? [words1, words2] : [words2, words1];
    let common = 0;
    for (const w of small) if (large.has(w)) common++;

    return common / (words1.size + words2.size - common);
  },

  /**
   * Calcule la distance de Levenshtein normalisée entre deux textes
   * Meilleur pour les textes courts et les fautes de frappe
   *
   * @param {string} str1 - Premier texte
   * @param {string} str2 - Deuxième texte
   * @returns {number} - Similarité entre 0 et 1 (1 = identique)
   */
  _levenshteinSimilarity(str1, str2) {
    const normalize = (s) => s.toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    const s1 = normalize(str1);
    const s2 = normalize(str2);

    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    const distance = TextUtils.levenshteinDistance(s1, s2);
    const maxLength = Math.max(s1.length, s2.length);

    return 1 - (distance / maxLength);
  },

  // ═══════════════════════════════════════════════════════════════
  // QUALITÉ MCQ (Item-Writing Flaws)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Analyse la qualité d'une carte MCQ
   *
   * @param {Object} card - La carte MCQ à analyser
   * @returns {Object[]} - Liste des défauts détectés
   */
  analyzeMcqQuality(card) {
    if (card.type !== 'mcq') return [];

    const flaws = [];
    const options = card.choices || card.options || [];
    const answer = String(card.answer || '');
    const correctOption = options.find(o => o.id === answer);

    if (!correctOption) return flaws;

    // 1. Bonne réponse plus longue
    const avgLength = options.reduce((sum, o) => sum + (o.text || '').length, 0) / options.length;
    if ((correctOption.text || '').length > avgLength * 1.5) {
      flaws.push({
        ...this.MCQ_FLAWS.LONGEST_CORRECT,
        suggestion: 'Équilibrez la longueur des options'
      });
    }

    // 2. Termes absolus dans distracteurs
    const absolutePattern = /\b(toujours|jamais|tous|aucun|never|always|all|none)\b/i;
    options.forEach(opt => {
      if (opt.id !== answer && absolutePattern.test(opt.text || '')) {
        flaws.push({
          ...this.MCQ_FLAWS.ABSOLUTE_TERMS,
          detail: `Option ${opt.id}: "${opt.text}"`,
          suggestion: 'Les termes absolus sont souvent faux - distracteur trop facile'
        });
      }
    });

    // 3. Répétition de mots question → réponse correcte
    const questionWords = this._extractKeywords(card.question || '');
    const correctWords = this._extractKeywords(correctOption.text || '');
    const overlap = questionWords.filter(w => correctWords.includes(w));
    if (overlap.length >= 2) {
      flaws.push({
        ...this.MCQ_FLAWS.WORD_REPETITION,
        detail: `Mots répétés: ${overlap.join(', ')}`,
        suggestion: 'Reformulez pour éviter les indices verbaux'
      });
    }

    // 4. Trop peu d'options
    if (options.length === 2) {
      flaws.push({
        ...this.MCQ_FLAWS.TOO_FEW_OPTIONS,
        suggestion: 'Ajoutez 1-2 distracteurs plausibles'
      });
    }

    // 5. Options dupliquées (texte identique)
    const optTexts = options.map(o => (o.text || '').toLowerCase().trim());
    const dupTexts = optTexts.filter((t, i) => optTexts.indexOf(t) !== i);
    if (dupTexts.length > 0) {
      flaws.push({
        name: 'Options dupliquées',
        severity: this.SEVERITY.ERROR,
        message: `Options avec texte identique: "${dupTexts[0]}"`,
        suggestion: 'Chaque option doit être unique'
      });
    }

    return flaws;
  },

  /**
   * Extrait les mots-clés significatifs d'un texte
   */
  _extractKeywords(text) {
    const stopWords = new Set([
      'le', 'la', 'les', 'un', 'une', 'des', 'de', 'du', 'au', 'aux',
      'et', 'ou', 'mais', 'donc', 'car', 'ni', 'que', 'qui', 'quoi',
      'est', 'sont', 'a', 'ont', 'être', 'avoir', 'fait', 'faire',
      'ce', 'cette', 'ces', 'son', 'sa', 'ses', 'leur', 'leurs',
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'pour', 'dans', 'sur', 'avec', 'par', 'en'
    ]);

    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
  },

  // ═══════════════════════════════════════════════════════════════
  // RÉPONSE DANS LA QUESTION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Vérifie si la réponse apparaît dans la question
   *
   * @param {Object} card - La carte à vérifier
   * @returns {Object|null} - Issue si problème détecté
   */
  checkAnswerInQuestion(card) {
    const question = (card.question || '').toLowerCase();
    const answer = String(card.answer || '').toLowerCase();
    const cardRef = card.id || 'carte';

    // Ignorer les réponses très courtes (1-2 caractères)
    if (answer.length <= 2) return null;

    // Cas 1: Réponse exacte dans la question
    if (answer.length > 3 && question.includes(answer)) {
      return this._createIssue(
        'ANSWER_IN_QUESTION',
        `La réponse "${card.answer}" apparaît dans la question`,
        this.SEVERITY.WARNING,
        cardRef
      );
    }

    // Cas 2: Pour MCQ, texte de la bonne réponse dans la question
    if (card.type === 'mcq') {
      const options = card.choices || card.options || [];
      const correctOption = options.find(o => o.id === card.answer);
      if (correctOption) {
        const correctText = (correctOption.text || '').toLowerCase();
        if (correctText.length > 3 && question.includes(correctText)) {
          return this._createIssue(
            'MCQ_ANSWER_TEXT_IN_QUESTION',
            `Le texte de la bonne réponse apparaît dans la question`,
            this.SEVERITY.ERROR,
            cardRef
          );
        }
      }
    }

    return null;
  },

  // ═══════════════════════════════════════════════════════════════
  // MÉTRIQUES DE LISIBILITÉ
  // ═══════════════════════════════════════════════════════════════

  _countSentences(text) {
    // Compte les phrases (terminées par . ! ?)
    const matches = text.match(/[.!?]+/g);
    return matches ? matches.length : 1;
  },

  _countWords(text) {
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    return words.length;
  },

  _countSyllables(text) {
    // Approximation pour le français/anglais
    const words = text.toLowerCase().split(/\s+/);
    let total = 0;

    for (const word of words) {
      total += this._countWordSyllables(word);
    }

    return total;
  },

  _countWordSyllables(word) {
    // Nettoyage (lettres uniquement ; l'apostrophe disparaît : « aujourd'hui » → aujourdhui)
    let w = String(word || '').toLowerCase().replace(/[^a-zàâäçéèêëïîôöùûüÿœæ]/g, '');
    if (w.length <= 2) return 1;

    // « qu » / « gu » devant e, i, y : le u est muet (mathématiques, guitare)
    w = w.replace(/([qg])u(?=[eiyéèê])/g, '$1');

    // e muet final (table → tabl, grande → grand, tables → tabl), si une voyelle subsiste
    const stripped = w.replace(/es?$/, '');
    if (/[aeiouyàâäéèêëïîôöùûüÿœæ]/.test(stripped)) w = stripped;

    // Noyaux vocaliques : é è ê ë ï ö ü comptent chacun (hiatus), les autres voyelles
    // consécutives (oi, eau, ou, ui...) forment une seule syllabe
    const nuclei = w.match(/[éèêëïöü]|[aeiouyàâäîôùûÿœæ]+/g);
    return Math.max(1, nuclei ? nuclei.length : 1);
  },

  /**
   * Mapping niveau scolaire → plage de scores Flesch
   */
  READABILITY_LEVELS: {
    very_easy: { min: 90, max: 100, grade: 'CP-CE1', description: 'Très facile' },
    easy: { min: 80, max: 89, grade: 'CE2-CM1', description: 'Facile' },
    fairly_easy: { min: 70, max: 79, grade: 'CM2-6ème', description: 'Assez facile' },
    standard: { min: 60, max: 69, grade: 'Collège', description: 'Standard' },
    fairly_difficult: { min: 50, max: 59, grade: 'Lycée', description: 'Assez difficile' },
    difficult: { min: 30, max: 49, grade: 'Supérieur', description: 'Difficile' },
    very_difficult: { min: 0, max: 29, grade: 'Expert', description: 'Très difficile' }
  },

  /**
   * Calcule le score Flesch Reading Ease avec la formule française adaptée
   *
   * Formule française : FRE = 207 - (1.015 × ASL) - (73.6 × ASW)
   * - ASL = Average Sentence Length (mots par phrase)
   * - ASW = Average Syllables per Word (syllabes par mot)
   *
   * @param {string} text - Le texte à analyser
   * @returns {number} - Score entre 0 et 100 (100 = très facile, 0 = très difficile)
   */
  calculateFleschScore(text) {
    if (!text || text.trim().length === 0) {
      return 100;
    }

    const sentences = this._countSentences(text);
    const words = this._countWords(text);
    const syllables = this._countSyllables(text);

    if (words === 0 || sentences === 0) {
      return 100; // Texte trop court = considéré facile
    }

    const ASL = words / sentences;  // Average Sentence Length
    const ASW = syllables / words;  // Average Syllables per Word

    // Formule française adaptée
    const fre = 207 - (1.015 * ASL) - (73.6 * ASW);

    // Normaliser entre 0 et 100
    return Math.max(0, Math.min(100, Math.round(fre)));
  },

  /**
   * Interprète un score Flesch en niveau de lisibilité
   *
   * @param {number} score - Score Flesch (0-100)
   * @returns {Object} - { level, grade, description, min, max }
   */
  getReadabilityLevel(score) {
    for (const [level, config] of Object.entries(this.READABILITY_LEVELS)) {
      if (score >= config.min && score <= config.max) {
        return {
          level,
          grade: config.grade,
          description: config.description,
          min: config.min,
          max: config.max
        };
      }
    }

    // Fallback (ne devrait jamais arriver)
    return {
      level: 'standard',
      ...this.READABILITY_LEVELS.standard
    };
  },

  /**
   * Analyse la lisibilité de toutes les cartes d'un deck
   *
   * @param {Object} deck - Le deck à analyser
   * @returns {Object} - { cards, average, distribution }
   */
  analyzeReadability(deck) {
    if (!deck || !deck.cards || deck.cards.length === 0) {
      return {
        cards: [],
        average: { score: 100, level: 'very_easy', grade: 'CP-CE1', description: 'Très facile' },
        distribution: {}
      };
    }

    const cardAnalyses = [];
    let totalScore = 0;
    const distribution = {};

    for (const card of deck.cards) {
      // Combiner question + réponse pour l'analyse
      const text = `${card.question || ''} ${card.answer || ''}`.trim();
      const score = this.calculateFleschScore(text);
      const level = this.getReadabilityLevel(score);

      cardAnalyses.push({
        cardId: card.id,
        score,
        level: level.level,
        grade: level.grade,
        description: level.description
      });

      totalScore += score;

      // Distribution
      distribution[level.level] = (distribution[level.level] || 0) + 1;
    }

    const averageScore = Math.round(totalScore / deck.cards.length);
    const averageLevel = this.getReadabilityLevel(averageScore);

    return {
      cards: cardAnalyses,
      average: {
        score: averageScore,
        level: averageLevel.level,
        grade: averageLevel.grade,
        description: averageLevel.description
      },
      distribution
    };
  },

  /**
   * Vérifie la correspondance entre le niveau cible du deck et le vocabulaire utilisé
   *
   * @param {Object} deck - Le deck à vérifier
   * @returns {Object} - { isMatch, warnings, cards, analysis }
   */
  checkLevelMatch(deck) {
    const result = {
      isMatch: true,
      warnings: [],
      cards: [],
      analysis: null
    };

    // Analyser la lisibilité
    const analysis = this.analyzeReadability(deck);
    result.analysis = analysis;

    // Déterminer le niveau cible
    const targetLevel = deck.targetLevel || this._difficultyToLevel(deck.difficulty);
    if (!targetLevel) {
      return result; // Pas de niveau cible défini
    }

    // Obtenir la plage de scores attendue
    const expectedRange = this._getLevelScoreRange(targetLevel);
    if (!expectedRange) {
      return result; // Niveau inconnu
    }

    // Vérifier chaque carte
    for (const cardAnalysis of analysis.cards) {
      const isMatch = cardAnalysis.score >= expectedRange.min && cardAnalysis.score <= expectedRange.max;

      result.cards.push({
        cardId: cardAnalysis.cardId,
        isMatch,
        actualScore: cardAnalysis.score,
        actualLevel: cardAnalysis.grade,
        expectedLevel: expectedRange.grade,
        expectedRange: { min: expectedRange.min, max: expectedRange.max }
      });

      if (!isMatch) {
        result.isMatch = false;

        const direction = cardAnalysis.score < expectedRange.min ? 'trop complexe' : 'trop simple';

        result.warnings.push(this._createIssue(
          'READABILITY_MISMATCH',
          `Vocabulaire ${direction} pour le niveau "${targetLevel}" (score: ${cardAnalysis.score}, attendu: ${expectedRange.min}-${expectedRange.max})`,
          this.SEVERITY.WARNING,
          cardAnalysis.cardId
        ));
      }
    }

    // Warning global si moyenne décalée
    if (analysis.average.score < expectedRange.min - 10 || analysis.average.score > expectedRange.max + 10) {
      const direction = analysis.average.score < expectedRange.min ? 'trop complexe' : 'trop simple';
      result.warnings.push(this._createIssue(
        'DECK_READABILITY_MISMATCH',
        `Le vocabulaire du deck est globalement ${direction} pour le niveau "${targetLevel}" (moyenne: ${analysis.average.score}, attendu: ${expectedRange.min}-${expectedRange.max})`,
        this.SEVERITY.WARNING
      ));
    }

    return result;
  },

  /**
   * Obtient la plage de scores Flesch attendue pour un niveau scolaire
   *
   * @param {string} level - Niveau scolaire (primaire, collège, lycée, supérieur)
   * @returns {Object|null} - { min, max, grade } ou null
   */
  _getLevelScoreRange(level) {
    const normalized = level.toLowerCase().trim();

    const mapping = {
      'primaire': { min: 80, max: 100, grade: 'Primaire' },
      'cp': { min: 90, max: 100, grade: 'CP-CE1' },
      'ce1': { min: 90, max: 100, grade: 'CP-CE1' },
      'ce2': { min: 80, max: 89, grade: 'CE2-CM1' },
      'cm1': { min: 80, max: 89, grade: 'CE2-CM1' },
      'cm2': { min: 70, max: 79, grade: 'CM2-6ème' },
      'collège': { min: 60, max: 79, grade: 'Collège' },
      '6ème': { min: 70, max: 79, grade: 'CM2-6ème' },
      '5ème': { min: 60, max: 69, grade: 'Collège' },
      '4ème': { min: 60, max: 69, grade: 'Collège' },
      '3ème': { min: 60, max: 69, grade: 'Collège' },
      'lycée': { min: 50, max: 69, grade: 'Lycée' },
      'seconde': { min: 50, max: 69, grade: 'Lycée' },
      'première': { min: 50, max: 59, grade: 'Lycée' },
      'terminale': { min: 50, max: 59, grade: 'Lycée' },
      'supérieur': { min: 30, max: 59, grade: 'Supérieur' },
      'université': { min: 30, max: 59, grade: 'Supérieur' },
      'expert': { min: 0, max: 29, grade: 'Expert' }
    };

    return mapping[normalized] || null;
  },

  /**
   * Convertit un niveau de difficulté (1-5) en nom de niveau
   *
   * @param {number} difficulty - Niveau de difficulté
   * @returns {string|null} - Nom du niveau ou null
   */
  _difficultyToLevel(difficulty) {
    const mapping = {
      1: 'primaire',
      2: 'primaire',
      3: 'collège',
      4: 'lycée',
      5: 'supérieur'
    };

    return mapping[difficulty] || null;
  },

  // ═══════════════════════════════════════════════════════════════
  // CLASSIFICATION BLOOM
  // ═══════════════════════════════════════════════════════════════

  /**
   * Classifie une question selon la taxonomie de Bloom
   *
   * @param {string} question - La question à classifier
   * @returns {Object} - { level, label, category }
   */
  classifyBloomLevel(question) {
    if (!question) {
      return { level: 1, label: 'Mémorisation', category: 'remember' };
    }

    // Parcourir du plus haut au plus bas niveau
    const categories = ['create', 'evaluate', 'analyze', 'apply', 'understand', 'remember'];

    for (const category of categories) {
      const config = this.BLOOM_PATTERNS[category];
      for (const pattern of config.patterns) {
        if (pattern.test(question)) {
          return {
            level: config.level,
            label: config.label,
            labelEn: config.labelEn,
            category
          };
        }
      }
    }

    // Par défaut: mémorisation
    return { level: 1, label: 'Mémorisation', labelEn: 'Remember', category: 'remember' };
  },

  /**
   * Analyse la distribution Bloom d'un deck
   *
   * @param {Object[]} cards - Tableau de cartes
   * @returns {Object} - Distribution par niveau
   */
  analyzeBloomDistribution(cards) {
    const distribution = {
      remember: 0,
      understand: 0,
      apply: 0,
      analyze: 0,
      evaluate: 0,
      create: 0
    };

    for (const card of cards) {
      const bloom = this.classifyBloomLevel(card.question);
      distribution[bloom.category]++;
    }

    const total = cards.length || 1;
    const percentages = {};
    for (const [key, count] of Object.entries(distribution)) {
      percentages[key] = Math.round((count / total) * 100);
    }

    // Analyse qualitative
    const lowerOrder = distribution.remember + distribution.understand;
    const higherOrder = distribution.analyze + distribution.evaluate + distribution.create;

    let assessment;
    if (lowerOrder > total * 0.8) {
      assessment = 'Principalement mémorisation - considérez ajouter des questions d\'analyse';
    } else if (higherOrder > total * 0.5) {
      assessment = 'Bonne variété cognitive avec accent sur la réflexion';
    } else {
      assessment = 'Distribution équilibrée';
    }

    return {
      counts: distribution,
      percentages,
      assessment
    };
  },

  // ═══════════════════════════════════════════════════════════════
  // RISQUE FACTUEL
  // ═══════════════════════════════════════════════════════════════

  /**
   * Évalue le risque factuel d'une carte
   *
   * @param {Object} card - La carte à évaluer
   * @returns {Object} - { score, level, flags, needsVerification }
   */
  assessFactualRisk(card) {
    let totalRisk = 0;
    const flags = [];
    const text = `${card.question || ''} ${card.answer || ''}`;

    for (const { pattern, risk, category, message } of this.FACTUAL_RISK_PATTERNS) {
      if (pattern.test(text)) {
        totalRisk += risk;
        flags.push({ category, message, risk });
      }
    }

    // Normaliser entre 0 et 1
    const normalizedRisk = Math.min(totalRisk, 1);

    let level;
    if (normalizedRisk >= 0.6) level = 'HIGH';
    else if (normalizedRisk >= 0.3) level = 'MEDIUM';
    else level = 'LOW';

    return {
      score: Math.round(normalizedRisk * 100) / 100,
      level,
      flags,
      needsVerification: normalizedRisk >= 0.3
    };
  },

  // ═══════════════════════════════════════════════════════════════
  // DÉTECTION D'HALLUCINATIONS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Détecte les hallucinations potentielles dans une carte
   *
   * Analyse le contenu pour identifier :
   * - Dates précises sans source
   * - Chiffres précis (pourcentages, statistiques)
   * - Citations directes
   * - Affirmations absolues
   * - Noms propres peu connus
   *
   * @param {Object} card - La carte à analyser
   * @returns {Object} - { risk: 0-1, warnings: [] }
   */
  detectHallucinations(card) {
    const warnings = [];
    let totalRisk = 0;

    // Texte à analyser (question + réponse + feedback)
    const text = `${card.question || ''} ${card.answer || ''} ${card.feedback || ''}`;

    // Vérifier si la carte a une source explicite
    const hasSource = card.source || card.sourceUrl || (card.tags && card.tags.includes('verified'));

    // Si texte vide, pas de risque
    if (!text.trim()) {
      return { risk: 0, warnings: [] };
    }

    // Appliquer chaque pattern d'hallucination
    for (const patternConfig of this.HALLUCINATION_PATTERNS) {
      const { pattern, risk, severity, category, message, excludeIfSource, multiMatch } = patternConfig;

      // Si la carte a une source et le pattern doit être exclu dans ce cas
      if (hasSource && excludeIfSource) {
        continue;
      }

      // Vérifier les matches
      if (multiMatch) {
        // Pattern avec flag 'g' - peut avoir plusieurs matches
        const matches = text.match(pattern);
        if (matches && matches.length > 0) {
          // Filtrer les noms propres communs
          if (category === 'PROPER_NOUN') {
            const uncommonMatches = matches.filter(match =>
              !this.COMMON_PROPER_NOUNS.has(match.trim())
            );

            if (uncommonMatches.length > 0) {
              warnings.push({
                category,
                severity,
                message: `${message} (${uncommonMatches.length} détecté${uncommonMatches.length > 1 ? 's' : ''})`,
                matches: uncommonMatches.slice(0, 3), // Limite à 3 exemples
                risk
              });
              totalRisk += risk * Math.min(uncommonMatches.length / 2, 1);
            }
          } else {
            warnings.push({
              category,
              severity,
              message: `${message} (${matches.length} occurrence${matches.length > 1 ? 's' : ''})`,
              risk
            });
            totalRisk += risk;
          }
        }
      } else {
        // Pattern normal - un seul match
        if (pattern.test(text)) {
          warnings.push({
            category,
            severity,
            message,
            risk
          });
          totalRisk += risk;
        }
      }
    }

    // Normaliser le risque entre 0 et 1
    const normalizedRisk = Math.min(totalRisk, 1);

    return {
      risk: Math.round(normalizedRisk * 100) / 100,
      warnings
    };
  },

  /**
   * Génère un rapport d'hallucinations pour un deck complet
   *
   * @param {Object} deck - Le deck à analyser
   * @returns {Object} - Rapport détaillé
   */
  getHallucinationReport(deck) {
    if (!deck || !deck.cards || deck.cards.length === 0) {
      return {
        totalCards: 0,
        cardsWithWarnings: 0,
        averageRisk: 0,
        highRiskCards: [],
        warningsByCategory: {},
        recommendations: []
      };
    }

    const cardResults = [];
    let totalRisk = 0;
    const warningsByCategory = {};

    // Analyser chaque carte
    for (const card of deck.cards) {
      const result = this.detectHallucinations(card);
      cardResults.push({
        cardId: card.id,
        risk: result.risk,
        warnings: result.warnings
      });

      totalRisk += result.risk;

      // Comptabiliser par catégorie
      for (const warning of result.warnings) {
        warningsByCategory[warning.category] = (warningsByCategory[warning.category] || 0) + 1;
      }
    }

    // Statistiques globales
    const cardsWithWarnings = cardResults.filter(r => r.warnings.length > 0).length;
    const averageRisk = deck.cards.length > 0 ? totalRisk / deck.cards.length : 0;
    const highRiskCards = cardResults.filter(r => r.risk >= 0.5);

    // Générer des recommandations
    const recommendations = [];

    if (warningsByCategory.DATE) {
      recommendations.push({
        type: 'DATE',
        message: `${warningsByCategory.DATE} carte${warningsByCategory.DATE > 1 ? 's' : ''} avec des dates précises`,
        suggestion: 'Vérifiez les dates dans des sources fiables (Wikipédia, encyclopédies)'
      });
    }

    if (warningsByCategory.PERCENTAGE || warningsByCategory.STATISTIC) {
      const count = (warningsByCategory.PERCENTAGE || 0) + (warningsByCategory.STATISTIC || 0);
      recommendations.push({
        type: 'STATISTICS',
        message: `${count} carte${count > 1 ? 's' : ''} avec des chiffres précis`,
        suggestion: 'Vérifiez les statistiques avec des sources officielles'
      });
    }

    if (warningsByCategory.QUOTE) {
      recommendations.push({
        type: 'QUOTE',
        message: `${warningsByCategory.QUOTE} citation${warningsByCategory.QUOTE > 1 ? 's' : ''}`,
        suggestion: 'Vérifiez l\'exactitude des citations (fautes fréquentes des LLM)'
      });
    }

    if (warningsByCategory.PROPER_NOUN) {
      recommendations.push({
        type: 'PROPER_NOUN',
        message: `${warningsByCategory.PROPER_NOUN} nom${warningsByCategory.PROPER_NOUN > 1 ? 's' : ''} propre${warningsByCategory.PROPER_NOUN > 1 ? 's' : ''}`,
        suggestion: 'Vérifiez l\'orthographe des noms propres peu connus'
      });
    }

    if (warningsByCategory.ABSOLUTE) {
      recommendations.push({
        type: 'ABSOLUTE',
        message: `${warningsByCategory.ABSOLUTE} affirmation${warningsByCategory.ABSOLUTE > 1 ? 's' : ''} absolue${warningsByCategory.ABSOLUTE > 1 ? 's' : ''}`,
        suggestion: 'Les termes absolus (toujours, jamais) sont souvent inexacts - ajoutez des nuances'
      });
    }

    // Recommandation globale
    if (averageRisk > 0.5) {
      recommendations.unshift({
        type: 'GLOBAL',
        message: 'Risque d\'hallucination élevé pour ce deck',
        suggestion: 'Recommandation : Vérifiez manuellement toutes les cartes avant l\'import'
      });
    } else if (averageRisk > 0.3) {
      recommendations.unshift({
        type: 'GLOBAL',
        message: 'Risque d\'hallucination modéré',
        suggestion: 'Vérifiez au moins les cartes à haut risque'
      });
    }

    return {
      totalCards: deck.cards.length,
      cardsWithWarnings,
      averageRisk: Math.round(averageRisk * 100) / 100,
      highRiskCards,
      warningsByCategory,
      recommendations,
      cardResults
    };
  },

  // ═══════════════════════════════════════════════════════════════
  // SCORING COMPOSITE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Calcule un score de qualité composite pour une carte
   *
   * @param {Object} card - La carte à scorer
   * @param {Object} context - Contexte (autres cartes pour doublons)
   * @returns {Object} - { score, grade, breakdown, issues, warnings }
   */
  calculateCardScore(card, context = {}) {
    const breakdown = {};
    const issues = [];
    const warnings = [];
    const infos = [];

    // 1. Structure (30%)
    const structureIssues = this._validateCardStructure(card, 0);
    const structureErrors = structureIssues.filter(i => i.severity === this.SEVERITY.ERROR);
    breakdown.structure = structureErrors.length === 0 ? 1 : 0;
    issues.push(...structureErrors);
    warnings.push(...structureIssues.filter(i => i.severity === this.SEVERITY.WARNING));
    infos.push(...structureIssues.filter(i => i.severity === this.SEVERITY.INFO));

    // 2. Longueur réponse (15%)
    const answerWords = String(card.answer || '').trim().split(/\s+/).length;
    if (answerWords <= 3) breakdown.answerLength = 1;
    else if (answerWords <= 5) breakdown.answerLength = 0.7;
    else {
      breakdown.answerLength = 0.3;
      warnings.push(this._createIssue('ANSWER_TOO_LONG', `Réponse longue (${answerWords} mots)`, this.SEVERITY.WARNING, card.id));
    }

    // 3. Alternatives (10% - texte uniquement)
    const isTextType = !card.type || card.type === 'text';
    if (isTextType) {
      const hasAlts = card.alternatives && Array.isArray(card.alternatives) && card.alternatives.length > 0;
      breakdown.alternatives = hasAlts ? 1 : 0;
      if (!hasAlts) {
        infos.push(this._createIssue('NO_ALTERNATIVES', 'Pas d\'alternatives (synonymes)', this.SEVERITY.INFO, card.id));
      }
    } else {
      breakdown.alternatives = 1; // N/A pour autres types
    }

    // 4. Feedback (10%)
    const hasFeedback = card.feedback && String(card.feedback).trim().length > 10;
    breakdown.feedback = hasFeedback ? 1 : 0;

    // 5. MCQ Quality (15% - MCQ uniquement)
    if (card.type === 'mcq') {
      const mcqFlaws = this.analyzeMcqQuality(card);
      const mcqErrors = mcqFlaws.filter(f => f.severity === this.SEVERITY.ERROR);
      const mcqWarnings = mcqFlaws.filter(f => f.severity === this.SEVERITY.WARNING);
      breakdown.mcqQuality = mcqErrors.length === 0 ? (mcqWarnings.length === 0 ? 1 : 0.7) : 0;
      warnings.push(...mcqFlaws.map(f => this._createIssue('MCQ_FLAW', f.message, f.severity, card.id)));
    } else {
      breakdown.mcqQuality = 1;
    }

    // 6. Réponse dans question (10%)
    const answerInQ = this.checkAnswerInQuestion(card);
    breakdown.noAnswerInQuestion = answerInQ ? 0 : 1;
    if (answerInQ) {
      if (answerInQ.severity === this.SEVERITY.ERROR) issues.push(answerInQ);
      else warnings.push(answerInQ);
    }

    // 7. Risque factuel (10%)
    const factualRisk = this.assessFactualRisk(card);
    if (factualRisk.level === 'LOW') breakdown.factualRisk = 1;
    else if (factualRisk.level === 'MEDIUM') breakdown.factualRisk = 0.6;
    else breakdown.factualRisk = 0.3;

    if (factualRisk.needsVerification) {
      infos.push(this._createIssue(
        'FACTUAL_RISK',
        `Contenu à vérifier: ${factualRisk.flags.map(f => f.message).join(', ')}`,
        this.SEVERITY.INFO,
        card.id
      ));
    }

    // 8. Détection d'hallucinations (ajouté aux infos/warnings)
    const hallucinationDetection = this.detectHallucinations(card);
    const hallucinationRisk = hallucinationDetection.risk;

    // Ajouter les warnings d'hallucination aux résultats
    for (const warning of hallucinationDetection.warnings) {
      if (warning.severity === 'warning') {
        warnings.push(this._createIssue(
          `HALLUCINATION_${warning.category}`,
          warning.message,
          this.SEVERITY.WARNING,
          card.id
        ));
      } else if (warning.severity === 'info') {
        infos.push(this._createIssue(
          `HALLUCINATION_${warning.category}`,
          warning.message,
          this.SEVERITY.INFO,
          card.id
        ));
      }
    }

    // Calcul score pondéré (incluant le risque d'hallucination)
    const weights = {
      structure: 0.30,
      answerLength: 0.15,
      alternatives: 0.10,
      feedback: 0.10,
      mcqQuality: 0.15,
      noAnswerInQuestion: 0.10,
      factualRisk: 0.10
    };

    let score = 0;
    for (const [key, weight] of Object.entries(weights)) {
      score += (breakdown[key] || 0) * weight;
    }

    const finalScore = Math.round(score * 100);

    // Grade
    let grade;
    if (finalScore >= 80) grade = 'A';
    else if (finalScore >= 65) grade = 'B';
    else if (finalScore >= 50) grade = 'C';
    else grade = 'D';

    return {
      score: finalScore,
      grade,
      breakdown,
      issues,
      warnings,
      infos,
      factualRisk: factualRisk.level,
      hallucinationRisk,
      hallucinationWarnings: hallucinationDetection.warnings,
      isValid: issues.length === 0
    };
  },

  // ═══════════════════════════════════════════════════════════════
  // VALIDATION COMPLÈTE DU DECK
  // ═══════════════════════════════════════════════════════════════

  /**
   * Valide un deck complet et retourne un rapport détaillé
   *
   * @param {Object} deck - Le deck à valider
   * @returns {Object} - Rapport complet
   */
  validateDeck(deck) {
    const report = {
      isValid: true,
      canImport: true,  // Même avec warnings, on peut importer
      averageScore: 0,
      grade: 'A',
      deckIssues: [],
      stats: {
        totalCards: 0,
        validCards: 0,
        cardsWithWarnings: 0,
        cardsWithErrors: 0,
        highRiskCards: 0
      },
      duplicates: [],
      bloomDistribution: null,
      readability: null,
      cardResults: []
    };

    // 1. Validation structurelle du deck
    const structureResult = this.validateStructure(deck);
    report.deckIssues = structureResult.issues.filter(i => !i.cardId);

    if (!deck || !deck.cards) {
      report.isValid = false;
      report.canImport = false;
      return report;
    }

    report.stats.totalCards = deck.cards.length;

    // 2. Détection des doublons
    report.duplicates = this.findDuplicates(deck.cards);

    // 3. Validation de chaque carte
    let totalScore = 0;
    for (const card of deck.cards) {
      const cardResult = this.calculateCardScore(card, { otherCards: deck.cards });
      report.cardResults.push({
        cardId: card.id,
        ...cardResult
      });

      totalScore += cardResult.score;
      if (cardResult.isValid) report.stats.validCards++;
      if (cardResult.warnings.length > 0) report.stats.cardsWithWarnings++;
      if (cardResult.issues.length > 0) report.stats.cardsWithErrors++;
      if (cardResult.factualRisk === 'HIGH') report.stats.highRiskCards++;
    }

    // 4. Score moyen
    report.averageScore = deck.cards.length > 0
      ? Math.round(totalScore / deck.cards.length)
      : 0;

    // Grade global
    if (report.averageScore >= 80) report.grade = 'A';
    else if (report.averageScore >= 65) report.grade = 'B';
    else if (report.averageScore >= 50) report.grade = 'C';
    else report.grade = 'D';

    // 5. Distribution Bloom
    report.bloomDistribution = this.analyzeBloomDistribution(deck.cards);

    // 6. Analyse de lisibilité (Flesch-Kincaid par carte)
    report.readability = this.analyzeReadability(deck);

    // 7. Vérification correspondance niveau/vocabulaire
    if (deck.targetLevel || deck.difficulty) {
      const levelMatch = this.checkLevelMatch(deck);
      if (!levelMatch.isMatch && levelMatch.warnings.length > 0) {
        // Ajouter les warnings de lisibilité au rapport
        report.deckIssues.push(...levelMatch.warnings.filter(w => w.code === 'DECK_READABILITY_MISMATCH'));

        // Ajouter warnings par carte
        levelMatch.warnings
          .filter(w => w.code === 'READABILITY_MISMATCH')
          .forEach(warning => {
            const cardResult = report.cardResults.find(cr => cr.cardId === warning.cardId);
            if (cardResult) {
              cardResult.warnings.push(warning);
            }
          });
      }
    }

    // 8. Rapport d'hallucinations
    report.hallucinationReport = this.getHallucinationReport(deck);

    // 9. Déterminer validité globale
    report.isValid = report.stats.cardsWithErrors === 0 && report.deckIssues.filter(i => i.severity === this.SEVERITY.ERROR).length === 0;
    report.canImport = report.deckIssues.filter(i => i.severity === this.SEVERITY.ERROR).length === 0;

    return report;
  },

  // ═══════════════════════════════════════════════════════════════
  // GÉNÉRATION DE PROMPT DE CORRECTION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Génère un prompt pour corriger les problèmes détectés
   *
   * @param {Object} deck - Le deck original
   * @param {Object} report - Le rapport de validation
   * @returns {string} - Prompt de correction
   */
  generateCorrectionPrompt(deck, report) {
    const cardsWithIssues = report.cardResults.filter(
      r => r.issues.length > 0 || r.warnings.length > 0
    );

    if (cardsWithIssues.length === 0 && report.duplicates.length === 0) {
      return '✅ Aucune correction nécessaire - le deck est de bonne qualité !';
    }

    let prompt = `## Corrections requises pour le deck "${deck.name || deck.id}"

La validation a détecté des problèmes. Corrige UNIQUEMENT les éléments listés ci-dessous.

---

`;

    // Problèmes de niveau deck
    if (report.deckIssues.length > 0) {
      prompt += `### Problèmes généraux du deck

`;
      for (const issue of report.deckIssues) {
        prompt += `- [${issue.severity.toUpperCase()}] ${issue.message}\n`;
      }
      prompt += '\n';
    }

    // Doublons
    if (report.duplicates.length > 0) {
      prompt += `### Doublons détectés

`;
      for (const dup of report.duplicates) {
        prompt += `- Cartes "${dup.card1}" et "${dup.card2}" : ${dup.similarity}% similaires\n`;
        prompt += `  → Action : Fusionner ou reformuler pour différencier\n`;
      }
      prompt += '\n';
    }

    // Problèmes par carte
    if (cardsWithIssues.length > 0) {
      prompt += `### Cartes à corriger

`;
      for (const cardResult of cardsWithIssues) {
        const card = deck.cards.find(c => c.id === cardResult.cardId);
        if (!card) continue;

        prompt += `**Carte "${cardResult.cardId}"** (score: ${cardResult.score}%)
- Question : "${card.question}"
- Réponse : "${card.answer}"
`;

        if (cardResult.issues.length > 0) {
          prompt += `- ❌ ERREURS :\n`;
          for (const issue of cardResult.issues) {
            prompt += `  • ${issue.message}\n`;
          }
        }

        if (cardResult.warnings.length > 0) {
          prompt += `- ⚠️ AVERTISSEMENTS :\n`;
          for (const warning of cardResult.warnings) {
            prompt += `  • ${warning.message}\n`;
          }
        }

        prompt += '\n';
      }
    }

    // Instructions de correction
    prompt += `---

### Instructions de correction

1. **Corrige chaque problème mentionné** sans modifier les cartes valides
2. **Garde le format YAML** identique
3. **Pour les QCM** : answer doit être l'ID de l'option (ex: "B"), pas le texte
4. **Pour les réponses texte** : ajoute des alternatives (synonymes, abréviations)
5. **Vérification factuelles** : confirme les dates, chiffres et noms propres

### Format de réponse

Renvoie UNIQUEMENT les cartes corrigées au format YAML :

\`\`\`yaml
cards:
  - id: "card_corrigée_1"
    question: "..."
    answer: "..."
    # etc.
\`\`\`
`;

    return prompt;
  },

  // ═══════════════════════════════════════════════════════════════
  // UTILITAIRES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Crée un objet issue standardisé
   */
  _createIssue(code, message, severity, cardId = null) {
    return {
      code,
      message,
      severity,
      cardId
    };
  },

  /**
   * Génère des suggestions d'amélioration pour une carte
   */
  getSuggestions(card) {
    const suggestions = [];
    const result = this.calculateCardScore(card);

    if (result.breakdown.alternatives < 1 && (!card.type || card.type === 'text')) {
      suggestions.push({
        type: 'alternatives',
        message: 'Ajoutez des alternatives',
        example: `alternatives:\n  - "${card.answer}"\n  - "variante"\n  - "abréviation"`
      });
    }

    if (result.breakdown.feedback < 1) {
      suggestions.push({
        type: 'feedback',
        message: 'Ajoutez un feedback pédagogique',
        example: 'feedback: "Explication de la réponse..."'
      });
    }

    if (result.breakdown.answerLength < 0.7) {
      suggestions.push({
        type: 'answerLength',
        message: 'Raccourcissez la réponse (1-3 mots idéal)',
        example: null
      });
    }

    const bloom = this.classifyBloomLevel(card.question);
    if (bloom.level === 1) {
      suggestions.push({
        type: 'cognitive',
        message: 'Question de mémorisation pure - variez avec des questions de compréhension',
        example: 'Reformulez avec "Pourquoi...", "Comment...", "Expliquez..."'
      });
    }

    return suggestions;
  }
};

// Export pour tests Node.js
if (typeof module !== 'undefined') {
  module.exports = DeckValidator;
}
