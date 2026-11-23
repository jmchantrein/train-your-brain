/**
 * Answer Validator - Validation des réponses et mise à jour de session
 *
 * Gère la validation des réponses pour :
 * - Cartes standard (via Validator)
 * - Cartes multilingues (via Multilingual)
 *
 * Met à jour la session avec le résultat, XP et streak.
 *
 * Dépendances: State, Validator, Multilingual, Leitner, XP
 */

const GameAnswerValidator = {
  /**
   * Valide une réponse et met à jour la session
   * @param {Object} state - État global
   * @param {string} userAnswer - Réponse de l'utilisateur
   */
  validate(state, userAnswer) {
    const session = state.currentSession;
    const card = session.cards[session.currentIndex];
    const startTime = session.cardStartTime;
    const responseTimeMs = Date.now() - startTime;

    // Récupérer le deck pour ses paramètres
    const deck = state.decks.find(d => d.id === session.deckId);

    // Vérifier si c'est une carte multilingue
    const isMultilingual = card.word && card.direction;
    let isCorrect;
    let progress;

    if (isMultilingual) {
      const result = this._validateMultilingual(card, userAnswer);
      isCorrect = result.isCorrect;
      progress = result.progress;
    } else {
      const result = this._validateStandard(card, userAnswer, deck);
      isCorrect = result.isCorrect;
      progress = result.progress;
    }

    // Calculer la nouvelle boîte
    const currentBox = progress.box || 'never_played';
    const thresholdMs = (progress.latencyThreshold || 3) * 1000;
    const newBox = Leitner.getNextBox(currentBox, isCorrect, responseTimeMs, thresholdMs);

    // Entraînement libre (défi sur des cartes au repos) : rien n'est enregistré, donc aucun XP
    const isPractice = !!(session.challenge && session.challenge.practice);

    // Calculer XP
    const xpEarned = isPractice ? 0 : XP.calculateXpForCard(newBox);

    // Mettre à jour la session
    this._updateSessionStats(session, isCorrect, newBox, responseTimeMs, xpEarned, card);

    // Réponse saisie : sert à n'afficher « Presque ! » que si elle est proche de la bonne
    if (session.lastResult && typeof userAnswer === 'string') {
      session.lastResult.userAnswer = userAnswer;
    }

    State.set('currentSession', session);
  },

  /**
   * Vérifie une réponse sans toucher à la session (modes examen et défi)
   * @param {Object} card - Carte standard
   * @param {string} userAnswer - Réponse utilisateur
   * @param {Object} [deck] - Deck contenant la carte (pour ses settings)
   * @returns {boolean}
   */
  checkAnswer(card, userAnswer, deck) {
    return this._validateStandard(card, userAnswer, deck).isCorrect === true;
  },

  /**
   * Valide une carte multilingue
   * @param {Object} card - Carte multilingue
   * @param {string} userAnswer - Réponse utilisateur
   * @returns {{ isCorrect: boolean, progress: Object }}
   */
  _validateMultilingual(card, userAnswer) {
    const { word, targetLang } = card;
    const translation = word.translations?.[targetLang];
    const expectedAnswer = translation?.text || translation || word.id;
    const alternatives = translation?.alternatives || word.alternatives?.[targetLang] || [];

    // Utiliser le validateur multilingue
    const isCorrect = typeof Multilingual !== 'undefined'
      ? Multilingual.validateAnswer(userAnswer, expectedAnswer, alternatives)
      : userAnswer.toLowerCase().trim() === String(expectedAnswer).toLowerCase().trim();

    return {
      isCorrect,
      progress: card.progress
    };
  },

  /**
   * Valide une carte standard
   * @param {Object} card - Carte standard
   * @param {string} userAnswer - Réponse utilisateur
   * @param {Object} deck - Deck contenant la carte
   * @returns {{ isCorrect: boolean, progress: Object }}
   */
  _validateStandard(card, userAnswer, deck) {
    // Construire les options pour la validation
    const validationOptions = {};

    // Réponses acceptées : la réponse principale, plus acceptedAnswers et alternatives
    const extraAnswers = [...(card.acceptedAnswers || []), ...(card.alternatives || [])];
    if (extraAnswers.length > 0) {
      const isScalarAnswer = typeof card.answer === 'string' || typeof card.answer === 'number';
      validationOptions.acceptedAnswers = (isScalarAnswer ? [card.answer, ...extraAnswers] : extraAnswers)
        .map(String);
    }
    if (card.tolerance !== undefined) {
      validationOptions.tolerance = card.tolerance;
    }
    if (card.choices) {
      validationOptions.choices = card.choices;
    }
    if (card.pairs) {
      validationOptions.pairs = card.pairs;
    }

    // Pour les cartes cloze, utiliser blanks ou _generatedBlanks (format simple)
    if (card.type === 'cloze') {
      if (card.blanks && card.blanks.length > 0) {
        validationOptions.blanks = card.blanks;
      } else if (card._generatedBlanks && card._generatedBlanks.length > 0) {
        // Format simple : utiliser les blanks générés par le renderer
        // Enrichir avec les alternatives de la carte si disponibles
        validationOptions.blanks = card._generatedBlanks.map((blank, index) => ({
          ...blank,
          // Pour le premier blank, ajouter les alternatives de la carte
          alternatives: index === 0 ? (card.alternatives || []) : []
        }));
      }
    } else if (card.blanks) {
      validationOptions.blanks = card.blanks;
    }

    // Appliquer les paramètres de similarité du deck
    if (deck?.settings?.similarityMatching && (card.type === 'text' || !card.type)) {
      validationOptions.similarityThreshold = deck.settings.similarityThreshold || 0.8;
    } else if (card.type === 'text' || !card.type) {
      validationOptions.similarityThreshold = 1;
    }

    // Valider la réponse
    let validationResult = Validator.validateAnswer(
      userAnswer,
      card.answer,
      card.type || 'text',
      validationOptions
    );

    // Pour les questions cloze, extraire le booléen isCorrect
    const isCorrect = typeof validationResult === 'object' && validationResult.isCorrect !== undefined
      ? validationResult.isCorrect
      : validationResult;

    return {
      isCorrect,
      progress: card
    };
  },

  /**
   * Met à jour les statistiques de session
   * @param {Object} session - Session courante
   * @param {boolean} isCorrect - Réponse correcte
   * @param {string} newBox - Nouvelle boîte
   * @param {number} responseTimeMs - Temps de réponse
   * @param {number} xpEarned - XP gagnés
   * @param {Object} card - Carte jouée
   */
  _updateSessionStats(session, isCorrect, newBox, responseTimeMs, xpEarned, card) {
    session.isShowingFeedback = true;
    session.lastResult = { isCorrect, newBox, responseTimeMs, xpEarned };
    session.stats.cardsPlayed++;

    if (isCorrect) {
      session.stats.correctAnswers++;
    }

    session.stats.totalXpEarned += xpEarned;

    // Bonus de série : versé une seule fois, quand la série atteint exactement un palier
    // (il est crédité au joueur par GameSessionManager._updatePlayerStats)
    let bonusXp = 0;

    // Entraînement libre : ni série verte, ni bonus, ni célébration de palier
    const isPractice = !!(session.challenge && session.challenge.practice);

    // Mettre à jour le streak vert
    if (isPractice) {
      session.stats.currentGreenStreak = 0;
      session.lastMilestoneReached = null;
    } else if (newBox === 'green') {
      session.stats.currentGreenStreak++;
      const currentStreak = session.stats.currentGreenStreak;

      session.stats.maxGreenStreak = Math.max(
        session.stats.maxGreenStreak,
        currentStreak
      );

      // Palier de série atteint (paliers = XP.STREAK_BONUSES, source unique)
      bonusXp = XP.getStreakMilestoneBonus(currentStreak);
      session.stats.totalXpEarned += bonusXp;
      const milestoneReached = bonusXp > 0 ? currentStreak : null;

      if (milestoneReached) {
        // Jouer le son de milestone
        if (typeof Audio !== 'undefined' && Audio.playStreakMilestone) {
          Audio.playStreakMilestone(milestoneReached);
        }
        // Afficher la célébration visuelle
        if (typeof Effects !== 'undefined' && Effects.streak && Effects.streak.celebrateMilestone) {
          Effects.streak.celebrateMilestone(milestoneReached);
        }
        // Stocker le milestone atteint pour référence
        session.lastMilestoneReached = milestoneReached;
      }
    } else {
      session.stats.currentGreenStreak = 0;
      session.lastMilestoneReached = null;
    }

    session.lastResult.bonusXp = bonusXp;

    // Enregistrer le résultat
    session.results.push({
      cardId: card.id,
      isCorrect,
      responseTimeMs,
      previousBox: card.box,
      newBox,
      xpEarned,
      bonusXp
    });
  }
};

// Export pour Node.js (tests) et navigateur
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameAnswerValidator;
}
