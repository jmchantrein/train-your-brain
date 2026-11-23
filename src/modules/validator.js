/**
 * Validator Module
 * Gère la validation des réponses utilisateur
 *
 * Utilise TextUtils pour la normalisation de texte (DRY)
 */

const Validator = {
  /**
   * Normalise un texte pour comparaison
   * Délègue à TextUtils.normalizeText (source unique de la logique, DRY).
   * TextUtils est chargé avant Validator (build.manifest.json et node-runner).
   *
   * @param {string} text - Texte à normaliser
   * @returns {string} - Texte normalisé
   */
  normalizeText(text) {
    return TextUtils.normalizeText(text);
  },

  /**
   * Calcule la distance Damerau-Levenshtein entre deux chaînes
   * Gère les transpositions (>80% des fautes de frappe)
   *
   * @param {string} str1 - Première chaîne
   * @param {string} str2 - Seconde chaîne
   * @returns {number} - Distance (0 = identique)
   */
  damerauLevenshtein(str1, str2) {
    return TextUtils.levenshteinDistance(str1, str2, { transpositions: true });
  },

  /**
   * Calcule la similarité entre deux chaînes (0-1)
   *
   * @param {string} str1 - Première chaîne
   * @param {string} str2 - Seconde chaîne
   * @returns {number} - 1 = identique, 0 = totalement différent
   *
   * Formule : 1 - (distance / max(len1, len2))
   */
  similarity(str1, str2) {
    // Cas spécial : deux chaînes vides sont identiques
    if (str1.length === 0 && str2.length === 0) {
      return 1;
    }

    const maxLength = Math.max(str1.length, str2.length);

    // Cas spécial : une chaîne vide et une non-vide
    if (maxLength === 0) {
      return 1;
    }

    const distance = this.damerauLevenshtein(str1, str2);
    return 1 - (distance / maxLength);
  },

  /**
   * Valide une réponse utilisateur
   *
   * @param {string} userAnswer - Réponse de l'utilisateur
   * @param {string} correctAnswer - Réponse attendue
   * @param {string} type - Type de validation ('numeric'|'exact_text'|'fuzzy_text'|'mcq'|'truefalse'|'matching'|'cloze')
   * @param {Object} options - Options additionnelles
   * @param {number} options.tolerance - Tolérance numérique (défaut: 0)
   * @param {number} options.similarityThreshold - Seuil similarité 0-1 (défaut: 0.8)
   * @param {string[]} options.choices - Choix possibles pour MCQ
   * @param {string[]} options.acceptedAnswers - Réponses alternatives acceptées
   * @param {boolean} options.caseSensitive - Sensible à la casse
   * @param {Object[]} options.blanks - Trous pour cloze
   * @param {Object[]} options.pairs - Paires pour matching
   * @returns {boolean|Object} - true/false ou objet avec détails pour cloze
   */
  validateAnswer(userAnswer, correctAnswer, type, options = {}) {
    // Validation des paramètres
    if (typeof userAnswer !== 'string' && typeof userAnswer !== 'object') {
      userAnswer = String(userAnswer ?? '');
    }
    if (typeof correctAnswer !== 'string' && typeof correctAnswer !== 'object') {
      correctAnswer = String(correctAnswer ?? '');
    }

    // Traiter selon le type
    switch (type) {
      case 'numeric':
        return this._validateNumeric(userAnswer, correctAnswer, options);

      case 'exact_text':
        return this._validateExactText(userAnswer, correctAnswer, options);

      case 'text':
      case 'fuzzy_text':
        return this._validateFuzzyText(userAnswer, correctAnswer, options);

      case 'mcq':
      case 'audio-choice':
      case 'staff-note':
        return this._validateMCQ(userAnswer, correctAnswer, options);

      case 'truefalse':
        return this._validateTrueFalse(userAnswer, correctAnswer);

      case 'matching':
        return this._validateMatching(userAnswer, correctAnswer, options);

      case 'cloze':
        return this._validateCloze(userAnswer, correctAnswer, options);

      default:
        // Par défaut, essayer une validation texte avec acceptedAnswers
        return this._validateFuzzyText(userAnswer, correctAnswer, options);
    }
  },

  /**
   * Validation numérique
   * @private
   */
  _validateNumeric(userAnswer, correctAnswer, options) {
    const tolerance = options.tolerance ?? 0;

    // Convertir en nombres
    const userNum = parseFloat(userAnswer);
    const correctNum = parseFloat(correctAnswer);

    // Vérifier que la conversion a réussi
    if (isNaN(userNum)) {
      return false;
    }
    if (isNaN(correctNum)) {
      return false;
    }

    // Vérifier la tolérance
    return Math.abs(userNum - correctNum) <= tolerance;
  },

  /**
   * Forme « soudée » d'un texte déjà normalisé (sans espaces) : « porto novo » et
   * « portonovo » s'écrivent pareil, donc « Porto-Novo », « Porto Novo » et
   * « PortoNovo » sont équivalents en comparaison stricte.
   * @private
   */
  _compact(normalized) {
    return normalized.replace(/ /g, '');
  },

  /**
   * Validation texte exact (après normalisation)
   * @private
   */
  _validateExactText(userAnswer, correctAnswer, options = {}) {
    const caseSensitive = options.caseSensitive || false;
    const acceptedAnswers = options.acceptedAnswers || [correctAnswer];

    let normalizedUser = caseSensitive ? userAnswer.trim() : this.normalizeText(userAnswer);

    // Vérifier contre toutes les réponses acceptées
    for (const accepted of acceptedAnswers) {
      const normalizedAccepted = caseSensitive ? accepted.trim() : this.normalizeText(accepted);
      if (normalizedUser === normalizedAccepted) {
        return true;
      }
      // Hors mode sensible à la casse : on ignore aussi les espaces (forme soudée)
      if (!caseSensitive && normalizedUser !== '' && this._compact(normalizedUser) === this._compact(normalizedAccepted)) {
        return true;
      }
    }

    return false;
  },

  /**
   * Validation texte approximatif (distance Damerau-Levenshtein)
   * @private
   */
  _validateFuzzyText(userAnswer, correctAnswer, options = {}) {
    const similarityThreshold = options.similarityThreshold ?? 0.8;
    const acceptedAnswers = options.acceptedAnswers || [correctAnswer];

    // Normaliser la réponse utilisateur
    const normalizedUser = this.normalizeText(userAnswer);

    // Vérifier contre toutes les réponses acceptées
    for (const accepted of acceptedAnswers) {
      const normalizedAccepted = this.normalizeText(accepted);
      const sim = this.similarity(normalizedUser, normalizedAccepted);

      if (sim >= similarityThreshold) {
        return true;
      }
      // Forme soudée équivalente (espaces ignorés) : toujours acceptée
      if (normalizedUser !== '' && this._compact(normalizedUser) === this._compact(normalizedAccepted)) {
        return true;
      }
    }

    return false;
  },

  /**
   * Validation choix multiple (supporte réponses multiples)
   * @private
   */
  _validateMCQ(userAnswer, correctAnswer, options = {}) {
    // Normaliser les réponses (peuvent être "A,B" ou ["A", "B"])
    const userAnswers = Array.isArray(userAnswer)
      ? userAnswer.map(a => a.toUpperCase().trim())
      : String(userAnswer).toUpperCase().split(',').map(a => a.trim()).filter(Boolean);

    const correctAnswers = Array.isArray(correctAnswer)
      ? correctAnswer.map(a => a.toUpperCase().trim())
      : String(correctAnswer).toUpperCase().split(',').map(a => a.trim()).filter(Boolean);

    // Vérifier que les ensembles sont identiques
    if (userAnswers.length !== correctAnswers.length) {
      return false;
    }

    const userSet = new Set(userAnswers);
    const correctSet = new Set(correctAnswers);

    for (const answer of correctSet) {
      if (!userSet.has(answer)) {
        return false;
      }
    }

    return true;
  },

  /**
   * Validation Vrai/Faux
   * @private
   */
  _validateTrueFalse(userAnswer, correctAnswer) {
    const normalizedUser = String(userAnswer).toLowerCase().trim();
    const normalizedCorrect = String(correctAnswer).toLowerCase().trim();

    // Accepter différentes formes
    const trueValues = ['true', 'vrai', 'v', '1', 'yes', 'oui', 'o'];
    const falseValues = ['false', 'faux', 'f', '0', 'no', 'non', 'n'];

    const userIsTrue = trueValues.includes(normalizedUser);
    const userIsFalse = falseValues.includes(normalizedUser);
    const correctIsTrue = trueValues.includes(normalizedCorrect);

    if (userIsTrue) {
      return correctIsTrue;
    }
    if (userIsFalse) {
      return !correctIsTrue;
    }

    return false;
  },

  /**
   * Validation appariement (matching)
   * Format réponse: "0:reponse0|1:reponse1|2:reponse2"
   * @private
   */
  _validateMatching(userAnswer, correctAnswer, options = {}) {
    const pairs = options.pairs || [];

    // Parser les réponses utilisateur
    const userPairs = {};
    String(userAnswer).split('|').forEach(pair => {
      const [id, response] = pair.split(':');
      if (id !== undefined && response !== undefined) {
        userPairs[id.trim()] = response.trim();
      }
    });

    // Vérifier chaque paire (utiliser l'index comme id si pas d'id explicite)
    let correctCount = 0;
    for (let i = 0; i < pairs.length; i++) {
      const pair = pairs[i];
      const pairId = pair.id !== undefined ? String(pair.id) : String(i);
      const userResponse = userPairs[pairId];
      if (userResponse && this.normalizeText(userResponse) === this.normalizeText(pair.response)) {
        correctCount++;
      }
    }

    // Tout doit être correct
    return correctCount === pairs.length;
  },

  /**
   * Validation question à trous (cloze)
   * @private
   */
  _validateCloze(userAnswers, correctAnswer, options = {}) {
    const blanks = options.blanks || [];

    // userAnswers peut être un objet { blank_0: "réponse", blank_1: "réponse" }
    // ou un tableau ["réponse1", "réponse2"]
    let answers = userAnswers;
    if (typeof userAnswers === 'string') {
      answers = userAnswers.split('|');
    }
    if (!Array.isArray(answers) && typeof answers === 'object') {
      answers = blanks.map((_, i) => answers[`blank_${i}`] || answers[i] || '');
    }

    let correctCount = 0;
    const results = [];

    blanks.forEach((blank, index) => {
      const userAnswer = answers[index] || '';
      let isCorrect = false;

      switch (blank.type) {
        case 'mcq':
          isCorrect = this._validateMCQ(userAnswer, blank.correctAnswer, {});
          break;

        case 'numeric':
          isCorrect = this._validateNumeric(userAnswer, blank.correctAnswer, {
            tolerance: blank.tolerance || 0
          });
          break;

        case 'text':
        default:
          // Combiner correctAnswer avec acceptedAnswers et alternatives
          const accepted = blank.acceptedAnswers || blank.alternatives || [];
          isCorrect = this._validateFuzzyText(userAnswer, blank.correctAnswer, {
            // Toujours inclure la réponse correcte + les alternatives
            acceptedAnswers: [blank.correctAnswer, ...accepted],
            similarityThreshold: blank.caseSensitive ? 1 : 0.8
          });
          break;
      }

      if (isCorrect) {
        correctCount++;
      }

      results.push({
        blankId: index,
        userAnswer,
        correctAnswer: blank.correctAnswer,
        isCorrect
      });
    });

    // Retourner un objet détaillé pour les questions cloze
    return {
      isCorrect: correctCount === blanks.length,
      correctCount,
      totalBlanks: blanks.length,
      results
    };
  },

  // ═══════════════════════════════════════════
  // FEEDBACK HELPERS (ex-Similarity module)
  // ═══════════════════════════════════════════

};

// Export pour tests Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Validator;
}
