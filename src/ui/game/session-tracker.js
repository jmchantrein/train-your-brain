/**
 * Session Tracker - Mise à jour des progressions carte/joueur
 *
 * Gère les mises à jour de :
 * - Progression des cartes (box, latencyThreshold, restUntil, etc.)
 * - Progression multilingue (par direction)
 * - Streak quotidien du joueur
 *
 * Dépendances: Leitner, TextUtils
 */

const GameSessionTracker = {
  /**
   * Met à jour une carte standard après réponse
   * @param {Object} card - Carte à mettre à jour
   * @param {Object} result - Résultat { isCorrect, newBox, responseTimeMs }
   * @returns {Object} Carte mise à jour
   */
  updateCard(card, result) {
    const { isCorrect, newBox, responseTimeMs } = result;
    const todayStr = TextUtils.getToday();

    // Mettre à jour le seuil de latence
    const newThreshold = Leitner.updateLatencyThreshold(card, isCorrect, responseTimeMs);

    // Tracker la date de dernière erreur si carte devient violette
    let lastIncorrectDate = card.lastIncorrectDate || null;
    if (newBox === 'purple') {
      lastIncorrectDate = todayStr;
    }

    // Calculer le repos si carte verte
    let restUntil = null;
    let restDays = card.restDays || 0;
    if (newBox === 'green') {
      const thresholdMs = newThreshold * 1000;
      const previousRestDays = card.restDays || 0;

      // Règle spéciale: si la carte était violette aujourd'hui, repos = 1 jour seulement
      const wasPurpleToday = lastIncorrectDate === todayStr;
      if (wasPurpleToday) {
        restDays = 1; // Reproposer dès demain
      } else {
        restDays = Leitner.calculateRestDays(responseTimeMs, thresholdMs, previousRestDays);
      }

      restUntil = TextUtils.addDays(todayStr, restDays);
    }

    // Mettre à jour l'historique des temps de réponse (max 20 entrées)
    const historyEntry = { time: responseTimeMs, date: todayStr, correct: isCorrect };
    const responseTimeHistory = [...(card.responseTimeHistory || []), historyEntry].slice(-20);

    // Retourner la carte mise à jour
    return {
      ...card,
      box: newBox,
      latencyThreshold: newThreshold,
      bestResponseTimeMs: Math.min(card.bestResponseTimeMs || Infinity, responseTimeMs),
      lastResponseTimeMs: responseTimeMs,
      responseTimeHistory,
      restUntil,
      restDays,
      lastIncorrectDate,
      timesPlayed: (card.timesPlayed || 0) + 1,
      timesCorrect: (card.timesCorrect || 0) + (isCorrect ? 1 : 0)
    };
  },

  /**
   * Met à jour la progression pour une direction multilingue
   * @param {Object} progress - Progression actuelle (peut être null)
   * @param {Object} result - Résultat { isCorrect, newBox, responseTimeMs }
   * @returns {Object} Progression mise à jour
   */
  updateMultilingualProgress(progress, result) {
    const { isCorrect, newBox, responseTimeMs } = result;
    const todayStr = TextUtils.getToday();

    // Créer un objet progression si nécessaire
    if (!progress) {
      progress = {
        box: 'never_played',
        latencyThreshold: null,
        bestResponseTimeMs: null,
        lastResponseTimeMs: null,
        restUntil: null,
        restDays: 0,
        timesPlayed: 0,
        timesCorrect: 0,
        lastIncorrectDate: null
      };
    }

    // Mettre à jour le seuil de latence
    const newThreshold = Leitner.updateLatencyThreshold(progress, isCorrect, responseTimeMs);

    // Tracker la date de dernière erreur si devient violet
    let lastIncorrectDate = progress.lastIncorrectDate || null;
    if (newBox === 'purple') {
      lastIncorrectDate = todayStr;
    }

    // Calculer le repos si passage en vert
    let restUntil = null;
    let restDays = progress.restDays || 0;

    if (newBox === 'green') {
      const thresholdMs = newThreshold * 1000;
      const previousRestDays = progress.restDays || 0;

      // Règle spéciale: si était violet aujourd'hui, repos = 1 jour seulement
      const wasPurpleToday = lastIncorrectDate === todayStr;
      if (wasPurpleToday) {
        restDays = 1; // Reproposer dès demain
      } else {
        restDays = Leitner.calculateRestDays(responseTimeMs, thresholdMs, previousRestDays);
      }

      restUntil = TextUtils.addDays(todayStr, restDays);
    }

    return {
      box: newBox,
      latencyThreshold: newThreshold,
      bestResponseTimeMs: Math.min(progress.bestResponseTimeMs || Infinity, responseTimeMs),
      lastResponseTimeMs: responseTimeMs,
      restUntil,
      restDays,
      lastIncorrectDate,
      timesPlayed: (progress.timesPlayed || 0) + 1,
      timesCorrect: (progress.timesCorrect || 0) + (isCorrect ? 1 : 0)
    };
  },

  /**
   * Met à jour la série quotidienne du joueur (jours de révision, jour calendaire local)
   *
   * La série compte des JOURS DE RÉVISION : un jour compte dès qu'une carte est jouée.
   * Un jour où le joueur n'avait aucune carte à réviser (aucune carte jouable dans les
   * decks qu'il a déjà commencés) ne casse pas la série : `stats.nextReviewDay` mémorise
   * le premier jour où il y avait de nouveau quelque chose à réviser. Si le joueur revient
   * ce jour-là (ou avant), la série continue ; s'il revient après, elle repart à 1.
   *
   * À appeler AVANT l'écrasement de `stats.lastPlayedAt` par la carte en cours : pour un
   * joueur dont les données datent de l'ancien code (pas de `lastStreakDay`), le dernier
   * jour joué est déduit de `lastPlayedAt`.
   *
   * @param {Object} player - Joueur à mettre à jour
   * @param {Array} [decks] - Decks du joueur ; s'ils sont fournis, `stats.nextReviewDay`
   *   est recalculé (jour le plus proche où une carte sera à réviser)
   */
  updateDailyStreak(player, decks) {
    const stats = player.stats;
    const today = TextUtils.getToday();
    const last = stats.lastStreakDay
      || (stats.lastPlayedAt ? TextUtils.getLocalDateString(new Date(stats.lastPlayedAt)) : null);

    if (last === today) {
      // Déjà compté aujourd'hui. Répare un joueur de l'ancien code (série restée à 0).
      if (!stats.currentStreak) {
        stats.currentStreak = 1;
      }
      stats.lastStreakDay = today;
    } else if (!last) {
      // Premier jour de jeu
      stats.currentStreak = 1;
      stats.lastStreakDay = today;
    } else if (last < today) {
      const missedNothing = TextUtils.daysBetween(last, today) === 1
        || (!!stats.nextReviewDay && stats.nextReviewDay >= today);
      stats.currentStreak = missedNothing ? (stats.currentStreak || 0) + 1 : 1;
      stats.lastStreakDay = today;
    }
    // last > today : horloge de l'appareil reculée, on ne touche à rien

    // Mettre à jour le record
    stats.longestStreak = Math.max(stats.longestStreak || 0, stats.currentStreak || 0);

    if (decks) {
      stats.nextReviewDay = this.computeNextReviewDay(decks, today);
    }
  },

  /**
   * Premier jour (après aujourd'hui) où le joueur aura des cartes à réviser
   *
   * Ne considère que les decks déjà commencés (au moins une carte jouée). Une carte non
   * verte est jouable en permanence (donc due dès demain) ; une carte verte est due à la
   * fin de son repos (`restUntil`).
   *
   * @param {Array} decks - Decks du joueur (standard : `cards`, multilingue : `words`)
   * @param {string} today - Jour local (YYYY-MM-DD)
   * @returns {string|null} - Jour (YYYY-MM-DD) ou null si aucun deck commencé
   */
  computeNextReviewDay(decks, today) {
    const tomorrow = TextUtils.addDays(today, 1);
    let next = null;

    for (const deck of decks || []) {
      const entries = this._getProgressEntries(deck);
      if (!entries.some(e => (e.timesPlayed || 0) > 0)) continue; // deck non commencé

      for (const entry of entries) {
        let due = tomorrow;
        if (entry.box === 'green' && entry.restUntil && entry.restUntil > tomorrow) {
          due = entry.restUntil;
        }
        if (next === null || due < next) next = due;
        if (next === tomorrow) return next; // on ne peut pas faire plus tôt
      }
    }
    return next;
  },

  /**
   * Progressions de cartes d'un deck (standard) ou de directions de mots (multilingue)
   * @private
   * @param {Object} deck - Deck
   * @returns {Array<Object>} Objets de progression ({ box, restUntil, timesPlayed })
   */
  _getProgressEntries(deck) {
    if (deck.type !== 'multilingual' && Array.isArray(deck.cards)) return deck.cards;
    if (Array.isArray(deck.words)) {
      const entries = [];
      deck.words.forEach(word => {
        Object.values(word.progress || {}).forEach(p => {
          entries.push(p || { box: 'never_played' });
        });
      });
      return entries;
    }
    return [];
  }
};

// Export pour Node.js (tests) et navigateur
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameSessionTracker;
}
