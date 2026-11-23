/**
 * Module Multilingual - Gestion des decks de vocabulaire multilingues
 *
 * Gère la structure de données et les helpers pour les decks thématiques
 * avec support multi-langues, multi-modes et progression Leitner par direction.
 */

const Multilingual = {
  // ═══════════════════════════════════════════════════════════════
  // CONSTANTES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Modes de jeu disponibles
   */
  MODES: {
    TRANSLATION: 'translation',
    DICTATION: 'dictation',
    IMAGE: 'image'
  },

  /**
   * Labels des langues
   */
  LANGUAGE_LABELS: {
    fr: 'Français',
    en: 'English',
    es: 'Español',
    de: 'Deutsch',
    it: 'Italiano',
    pt: 'Português',
    nl: 'Nederlands'
  },

  /**
   * Drapeaux des langues
   */
  LANGUAGE_FLAGS: {
    fr: '🇫🇷',
    en: '🇬🇧',
    es: '🇪🇸',
    de: '🇩🇪',
    it: '🇮🇹',
    pt: '🇵🇹',
    nl: '🇳🇱'
  },

  // ═══════════════════════════════════════════════════════════════
  // GÉNÉRATION DE CLÉS DE PROGRESSION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Génère la clé de progression Leitner pour une combinaison mode/langues
   *
   * @param {string} mode - Mode de jeu (translation, dictation, image)
   * @param {string|null} sourceLang - Langue source (null pour image)
   * @param {string} targetLang - Langue cible
   * @returns {string} Clé de progression (ex: "fr→en", "audio:fr→en", "image→fr")
   *
   * @example
   * getProgressKey('translation', 'fr', 'en') // → "fr→en"
   * getProgressKey('dictation', 'fr', 'fr')   // → "audio:fr→fr"
   * getProgressKey('dictation', 'fr', 'en')   // → "audio:fr→en"
   * getProgressKey('image', null, 'fr')       // → "image→fr"
   */
  getProgressKey(mode, sourceLang, targetLang) {
    if (!targetLang) {
      throw new Error('targetLang is required');
    }

    switch (mode) {
      case this.MODES.TRANSLATION:
        if (!sourceLang) {
          throw new Error('sourceLang is required for translation mode');
        }
        return `${sourceLang}→${targetLang}`;

      case this.MODES.DICTATION:
        if (!sourceLang) {
          throw new Error('sourceLang is required for dictation mode');
        }
        return `audio:${sourceLang}→${targetLang}`;

      case this.MODES.IMAGE:
        // Image n'a pas de langue source
        return `image→${targetLang}`;

      default:
        throw new Error(`Unknown mode: ${mode}`);
    }
  },

  /**
   * Parse une clé de progression pour extraire le mode et les langues
   *
   * @param {string} key - Clé de progression
   * @returns {{mode: string, sourceLang: string|null, targetLang: string}}
   */
  parseProgressKey(key) {
    if (key.startsWith('audio:')) {
      const [source, target] = key.substring(6).split('→');
      return { mode: this.MODES.DICTATION, sourceLang: source, targetLang: target };
    }

    if (key.startsWith('image→')) {
      return { mode: this.MODES.IMAGE, sourceLang: null, targetLang: key.substring(6) };
    }

    // Translation mode
    const [source, target] = key.split('→');
    return { mode: this.MODES.TRANSLATION, sourceLang: source, targetLang: target };
  },

  // ═══════════════════════════════════════════════════════════════
  // GÉNÉRATION DES DIRECTIONS POSSIBLES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Génère toutes les directions possibles pour un set de langues
   *
   * @param {string[]} languages - Langues disponibles
   * @param {boolean} includeImage - Inclure les directions image
   * @returns {string[]} Liste des clés de progression possibles
   */
  getAllPossibleDirections(languages, includeImage = true) {
    const directions = [];

    // Traduction: toutes les paires de langues
    for (const source of languages) {
      for (const target of languages) {
        if (source !== target) {
          directions.push(this.getProgressKey(this.MODES.TRANSLATION, source, target));
        }
      }
    }

    // Dictée: même langue (écouter et écrire dans la même langue)
    for (const lang of languages) {
      directions.push(this.getProgressKey(this.MODES.DICTATION, lang, lang));
    }

    // Dictée cross-langue: écouter dans une langue, écrire dans une autre
    for (const source of languages) {
      for (const target of languages) {
        if (source !== target) {
          directions.push(this.getProgressKey(this.MODES.DICTATION, source, target));
        }
      }
    }

    // Image: une par langue cible
    if (includeImage) {
      for (const lang of languages) {
        directions.push(this.getProgressKey(this.MODES.IMAGE, null, lang));
      }
    }

    return directions;
  },

  // ═══════════════════════════════════════════════════════════════
  // INITIALISATION DE LA PROGRESSION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Crée un objet de progression Leitner vide
   *
   * @returns {Object} Progression initiale
   */
  createEmptyProgress() {
    return {
      box: 'never_played',
      latencyThreshold: null,
      bestResponseTimeMs: null,
      lastResponseTimeMs: null,
      restUntil: null,
      restDays: 0,
      timesPlayed: 0,
      timesCorrect: 0
    };
  },

  /**
   * Initialise la progression pour un mot avec toutes les directions possibles
   *
   * @param {Object} word - Le mot à initialiser
   * @param {string[]} languages - Langues disponibles dans le deck
   * @param {boolean} hasImage - Le mot a-t-il une image ?
   * @returns {Object} Le mot avec progress initialisé
   */
  initializeWordProgress(word, languages, hasImage = false) {
    if (!word.progress) {
      word.progress = {};
    }

    const directions = this.getAllPossibleDirections(languages, hasImage);

    for (const direction of directions) {
      if (!word.progress[direction]) {
        word.progress[direction] = this.createEmptyProgress();
      }
    }

    return word;
  },

  /**
   * Initialise tous les mots d'un deck
   *
   * @param {Object} deck - Le deck multilingue
   * @returns {Object} Le deck avec tous les mots initialisés
   */
  initializeDeckProgress(deck) {
    if (deck.type !== 'multilingual') {
      console.warn('initializeDeckProgress called on non-multilingual deck');
      return deck;
    }

    const languages = deck.languages || [];

    for (const word of deck.words || []) {
      const hasImage = !!word.image;
      this.initializeWordProgress(word, languages, hasImage);
    }

    return deck;
  },

  // ═══════════════════════════════════════════════════════════════
  // VALIDATION DES RÉPONSES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Normalise une chaîne pour comparaison
   *
   * @param {string} str - Chaîne à normaliser
   * @returns {string} Chaîne normalisée (minuscules, trim, espaces normalisés)
   */
  normalizeForComparison(str) {
    if (typeof str !== 'string') return '';
    return str
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');  // Normaliser les espaces multiples
  },

  /**
   * Valide une réponse utilisateur contre la réponse attendue
   *
   * @param {string} userAnswer - Réponse de l'utilisateur
   * @param {string} expectedAnswer - Réponse attendue (transcription P5)
   * @param {string[]} alternatives - Alternatives acceptées
   * @returns {boolean} true si la réponse est correcte
   *
   * @example
   * validateAnswer('Carrot', 'carrot', []) // → true (insensible casse)
   * validateAnswer('the carrot', 'carrot', ['the carrot']) // → true
   * validateAnswer('famille', 'la famille', []) // → false
   */
  validateAnswer(userAnswer, expectedAnswer, alternatives = []) {
    const normalizedUser = this.normalizeForComparison(userAnswer);
    const normalizedExpected = this.normalizeForComparison(expectedAnswer);

    // Correspondance exacte (insensible à la casse)
    if (normalizedUser === normalizedExpected) {
      return true;
    }

    // Vérifier les alternatives
    for (const alt of alternatives) {
      if (normalizedUser === this.normalizeForComparison(alt)) {
        return true;
      }
    }

    return false;
  },

  // ═══════════════════════════════════════════════════════════════
  // CONFIGURATION DE SESSION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Valide et normalise une configuration de session
   *
   * @param {Object} config - Configuration brute
   * @returns {Object} Configuration validée
   */
  validateSessionConfig(config) {
    const validated = { ...config };

    // Mode requis
    if (!validated.mode || !Object.values(this.MODES).includes(validated.mode)) {
      throw new Error(`Invalid mode: ${validated.mode}`);
    }

    // targetLang toujours requis
    if (!validated.targetLang) {
      throw new Error('targetLang is required');
    }

    // Mode image: pas de sourceLang ni bidirectionnel
    if (validated.mode === this.MODES.IMAGE) {
      validated.sourceLang = null;
      validated.bidirectional = false;
    } else {
      // Autres modes: sourceLang requis
      if (!validated.sourceLang) {
        throw new Error('sourceLang is required for this mode');
      }
    }

    // Bidirectionnel par défaut à false
    if (typeof validated.bidirectional !== 'boolean') {
      validated.bidirectional = false;
    }

    return validated;
  },

  /**
   * Génère les directions à jouer pour une session
   *
   * @param {Object} config - Configuration de session validée
   * @returns {string[]} Clés de progression à jouer
   */
  getSessionDirections(config) {
    const { mode, sourceLang, targetLang, bidirectional } = config;

    if (mode === this.MODES.IMAGE) {
      return [this.getProgressKey(mode, null, targetLang)];
    }

    if (bidirectional && sourceLang !== targetLang) {
      return [
        this.getProgressKey(mode, sourceLang, targetLang),
        this.getProgressKey(mode, targetLang, sourceLang)
      ];
    }

    return [this.getProgressKey(mode, sourceLang, targetLang)];
  },

  // ═══════════════════════════════════════════════════════════════
  // SÉLECTION DE CARTES POUR SESSION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Sélectionne les cartes jouables pour une session
   *
   * @param {Object} deck - Le deck multilingue
   * @param {Object} config - Configuration de session
   * @param {Object} options - Options (maxCards, shuffle, ignoreRest)
   * @returns {Array} Liste de cartes à jouer avec leur direction
   */
  getCardsForSession(deck, config, options = {}) {
    const {
      maxCards = 20,
      shuffle = true,
      ignoreRest = false
    } = options;

    const validatedConfig = this.validateSessionConfig(config);
    const directions = this.getSessionDirections(validatedConfig);
    const now = new Date().toISOString();
    const cards = [];

    // Pour chaque mot, vérifier chaque direction
    for (const word of deck.words || []) {
      for (const direction of directions) {
        const progress = word.progress?.[direction];

        if (!progress) continue;

        // Vérifier si la carte est jouable (Leitner)
        const isPlayable = this._isDirectionPlayable(progress, now, ignoreRest);

        if (isPlayable) {
          // Parser la direction pour obtenir source/target
          const parsed = this.parseProgressKey(direction);

          cards.push({
            wordId: word.id,
            word: word,
            direction: direction,
            mode: parsed.mode,
            sourceLang: parsed.sourceLang,
            targetLang: parsed.targetLang,
            progress: progress
          });
        }
      }
    }

    // Trier par priorité Leitner (never_played > purple > orange > green)
    const boxPriority = { never_played: 0, purple: 1, orange: 2, green: 3 };
    cards.sort((a, b) => {
      return (boxPriority[a.progress.box] || 0) - (boxPriority[b.progress.box] || 0);
    });

    // Shuffle si demandé
    const ordered = shuffle ? TextUtils.shuffleArray(cards) : cards;

    // Limiter le nombre
    return ordered.slice(0, maxCards);
  },

  /**
   * Vérifie si une direction est jouable
   * @private
   */
  _isDirectionPlayable(progress, now, ignoreRest) {
    if (!progress) return false;

    const box = progress.box;

    // never_played, purple, orange: toujours jouables
    if (box === 'never_played' || box === 'purple' || box === 'orange') {
      return true;
    }

    // green: vérifier le repos
    if (box === 'green') {
      if (ignoreRest) return true;
      if (!progress.restUntil) return true;
      return progress.restUntil <= now;
    }

    return false;
  },

  // ═══════════════════════════════════════════════════════════════
  // STATISTIQUES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Calcule les statistiques de progression pour une direction donnée
   *
   * @param {Object} deck - Le deck multilingue
   * @param {string} direction - Clé de direction (ex: "fr→en")
   * @returns {Object} Statistiques {total, mastered, inProgress, notStarted, playable}
   */
  getDirectionStats(deck, direction) {
    const now = new Date().toISOString();
    const stats = {
      total: 0,
      mastered: 0,      // green et en repos
      inProgress: 0,    // orange
      struggling: 0,    // purple
      notStarted: 0,    // never_played
      playable: 0       // jouables maintenant
    };

    for (const word of deck.words || []) {
      const progress = word.progress?.[direction];
      if (!progress) continue;

      stats.total++;

      switch (progress.box) {
        case 'never_played':
          stats.notStarted++;
          stats.playable++;
          break;
        case 'purple':
          stats.struggling++;
          stats.playable++;
          break;
        case 'orange':
          stats.inProgress++;
          stats.playable++;
          break;
        case 'green':
          stats.mastered++;
          if (!progress.restUntil || progress.restUntil <= now) {
            stats.playable++;
          }
          break;
      }
    }

    return stats;
  },

};

// Export pour tests Node.js
if (typeof module !== 'undefined') {
  module.exports = Multilingual;
}
