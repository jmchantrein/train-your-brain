/**
 * Session Manager - Orchestration de la progression de session
 *
 * Gère :
 * - Passage à la carte suivante (nextCard)
 * - Fin de session (endSession)
 * - Missions : défis quotidiens et quêtes hebdomadaires (refreshMissions, _recordMissions,
 *   _finishMissions), enregistrées avec le joueur (player.missions)
 * - Coordination avec les autres modules (tracker, badges, challenges)
 *
 * @module GameSessionManager
 * @requires State
 * @requires Router
 * @requires Storage
 * @requires Badges
 * @requires Challenges
 * @requires GameSessionTracker
 * @requires GameSecretStats
 * @requires XP
 * @requires TextUtils
 */

const GameSessionManager = {
  /**
   * Niveau le plus haut atteint depuis la dernière célébration (null si aucun).
   * Les gains d'XP l'alimentent (grantXp), flushLevelUp le célèbre une seule fois.
   * @private
   */
  _pendingLevelUp: null,

  /**
   * Crédite de l'XP au joueur et note la montée de niveau éventuelle
   *
   * Point d'entrée unique des gains d'XP de gamification (carte, bonus de série, badge,
   * défi) : le niveau est comparé avant/après chaque gain réel.
   *
   * @param {Player} player - Joueur courant
   * @param {number} amount - XP gagné
   * @returns {{ previousLevel: number, newLevel: number, leveledUp: boolean }}
   */
  grantXp(player, amount) {
    const gain = XP.grant(player, amount);
    if (gain.leveledUp) {
      this._pendingLevelUp = Math.max(this._pendingLevelUp || 0, gain.newLevel);
    }
    return gain;
  },

  /**
   * Célèbre la montée de niveau notée par grantXp (une seule célébration, au niveau le
   * plus haut atteint, même si plusieurs gains ont franchi un niveau)
   * @returns {number|null} Niveau célébré, ou null
   */
  flushLevelUp() {
    const level = this._pendingLevelUp;
    this._pendingLevelUp = null;
    if (level && typeof Effects !== 'undefined' && Effects.levelUp) {
      Effects.levelUp.show(level);
    }
    return level;
  },

  /**
   * Inscrit un gain d'XP dans l'historique du joueur
   *
   * @private
   * @param {Player} player - Joueur courant
   * @param {number} amount - XP gagné
   * @param {string} source - 'session' | 'badge' | 'challenge'
   * @param {string} details - Libellé
   */
  _recordXp(player, amount, source, details) {
    if (!Array.isArray(player.stats.xpHistory)) {
      player.stats.xpHistory = [];
    }
    player.stats.xpHistory.push({ date: TextUtils.getToday(), amount, source, details });
  },

  /**
   * S'assure que les missions du joueur sont celles d'aujourd'hui et de cette semaine
   *
   * La charge du jour (cartes à réviser) est mesurée à la première carte du jour, avant
   * que celle-ci ne soit mise à jour, puis figée. Met aussi à jour le miroir de l'état.
   *
   * @param {Player} player - Joueur courant
   * @param {Deck[]} decks - Decks du joueur
   * @returns {boolean} true si les missions ont été (re)créées
   */
  refreshMissions(player, decks) {
    const changed = Challenges.refreshMissions(player, { decks, today: TextUtils.getToday() });
    Challenges.syncState(player);
    return changed;
  },

  /**
   * Passe à la carte suivante après validation d'une réponse
   *
   * Effectue dans l'ordre :
   * 0. Prépare les missions du jour et de la semaine (avant toute mise à jour de carte)
   * 1. Met à jour la carte dans le deck (standard ou multilingue)
   * 2. Track la progression par matière (cartes maîtrisées)
   * 3. Met à jour la série quotidienne (jour de révision)
   * 4. Met à jour les stats du joueur et crédite l'XP (carte + bonus de série)
   * 4 bis. Enregistre la carte dans les défis de la journée (XP des défis terminés)
   * 5. Attribue les badges débloqués (awardBadges) et célèbre le niveau gagné
   * 6. Sauvegarde le joueur
   * 7. Passe à la carte suivante ou termine la session
   *
   * @param {AppState} state - État global de l'application
   * @returns {void}
   */
  nextCard(state) {
    const session = state.currentSession;

    // Entraînement libre (défi sur des cartes au repos) : aucune progression n'est enregistrée
    if (session.challenge && session.challenge.practice) {
      return this._nextPracticeCard(state);
    }

    const card = session.cards[session.currentIndex];
    const result = session.lastResult;
    const player = state.player;

    // Vérifier si c'est une session multilingue
    const isMultilingual = session.type === 'multilingual';

    // Missions du jour et de la semaine : la charge du jour se mesure avant la mise à jour de la carte
    this.refreshMissions(player, state.decks);

    // Mettre à jour dans le deck
    const deck = state.decks.find(d => d.id === session.deckId);

    if (deck) {
      if (isMultilingual) {
        this._updateMultilingualDeck(deck, card, result, player);
      } else {
        this._updateStandardDeck(deck, card, result, player, state);
      }

      // Tracker les cartes maîtrisées par matière (pour badges subject)
      this._trackSubjectProgress(player, deck, card, result);
    }

    // Série quotidienne : avant que _updatePlayerStats n'écrase lastPlayedAt
    GameSessionTracker.updateDailyStreak(player, state.decks);

    // Mettre à jour les stats du joueur (et créditer l'XP)
    this._updatePlayerStats(player, result, session);

    // Défis de la journée (cumul de toutes les séances) : XP des défis terminés par cette carte
    this._recordMissions(player, session, card, result, session.deckId);

    // Attribuer les badges débloqués (séance en cours : pas de badge de fin de séance)
    this.awardBadges(player, session, { sessionEnded: false });

    // Sauvegarder le joueur (legacy + multi-player)
    Storage.savePlayer(player);
    Storage.savePlayerById(player);
    State.set('player', player);

    // Célébrer la montée de niveau éventuelle (une seule fois)
    this.flushLevelUp();

    // Passer à la carte suivante
    session.currentIndex++;
    session.isShowingFeedback = false;
    session.cardStartTime = Date.now();

    // Fin de session ?
    if (session.currentIndex >= session.cards.length) {
      this.endSession(state);
    } else {
      State.set('currentSession', session);
    }
  },

  /**
   * Met à jour un deck multilingue après réponse
   *
   * @private
   * @param {Deck} deck - Deck multilingue à mettre à jour
   * @param {Card} card - Carte jouée (avec wordId et direction)
   * @param {CardResult} result - Résultat de la réponse
   * @param {Player} [player] - Joueur courant (compteur de mémoire durable)
   * @returns {void}
   */
  _updateMultilingualDeck(deck, card, result, player) {
    const { wordId, direction } = card;
    const wordIndex = deck.words?.findIndex(w => w.id === wordId);

    if (wordIndex !== -1 && deck.words[wordIndex].progress) {
      const previousRestDays = (deck.words[wordIndex].progress[direction] || {}).restDays || 0;
      const updatedProgress = GameSessionTracker.updateMultilingualProgress(
        deck.words[wordIndex].progress[direction],
        result
      );
      this._trackLongTerm(player, result, previousRestDays, updatedProgress.restDays);
      deck.words[wordIndex].progress[direction] = updatedProgress;

      // Mettre aussi à jour dans la carte de session
      card.progress = updatedProgress;
    }

    // Sauvegarder la progression multilingue
    Storage.saveMultilingualProgress(deck.id, deck.words);
  },

  /**
   * Met à jour un deck standard après réponse
   *
   * Met à jour la carte, sauvegarde la progression,
   * compte les cartes vertes et track les redemptions.
   *
   * @private
   * @param {Deck} deck - Deck standard à mettre à jour
   * @param {Card} card - Carte jouée
   * @param {CardResult} result - Résultat de la réponse
   * @param {Player} player - Joueur courant
   * @param {AppState} state - État global
   * @returns {void}
   */
  _updateStandardDeck(deck, card, result, player, state) {
    // Mettre à jour la carte
    const updatedCard = GameSessionTracker.updateCard(card, result);

    const cardIndex = deck.cards.findIndex(c => c.id === card.id);
    if (cardIndex !== -1) {
      deck.cards[cardIndex] = updatedCard;
    }

    // Mémoire durable : carte dont le repos atteint 7 puis 14 jours pour la première fois
    this._trackLongTerm(player, result, card.restDays || 0, updatedCard.restDays);

    // Sauvegarder immédiatement la progression du deck
    Storage.saveDeckProgress(deck.id, deck.cards);

    // Compter les cartes vertes dans TOUS les decks standard
    let totalGreenCards = 0;
    state.decks.forEach(d => {
      totalGreenCards += (d.cards || []).filter(c => c.box === 'green').length;
    });
    player.stats.totalGreenCards = totalGreenCards;

    // Track redemption (mastering a card after 10+ errors) for secret badge
    if (result.newBox === 'green') {
      const errors = (updatedCard.timesPlayed || 0) - (updatedCard.timesCorrect || 0);
      if (errors >= 10) {
        player.stats.redemptionCards = (player.stats.redemptionCards || 0) + 1;
      }
    }
  },

  /**
   * Compte les cartes dont le repos vient d'atteindre 7 jours (`weekRestCards`) puis 14 jours
   * (`longTermCards`) : badges de mémoire durable. Une carte ne compte qu'au franchissement
   * d'un seuil : la rejouer ensuite n'ajoute rien, et le compteur mesure la rétention, pas le
   * volume joué.
   *
   * @private
   * @param {Player|undefined} player - Joueur courant
   * @param {CardResult} result - Résultat de la carte
   * @param {number} previousRestDays - Repos avant la réponse (jours)
   * @param {number} newRestDays - Repos après la réponse (jours)
   * @returns {void}
   */
  _trackLongTerm(player, result, previousRestDays, newRestDays) {
    if (!player || !result || result.newBox !== 'green') return;
    [[Badges.WEEK_REST_DAYS, 'weekRestCards'], [Badges.LONG_TERM_REST_DAYS, 'longTermCards']].forEach(([threshold, field]) => {
      if (previousRestDays < threshold && newRestDays >= threshold) {
        player.stats[field] = (player.stats[field] || 0) + 1;
      }
    });
  },

  /**
   * Track les cartes maîtrisées par matière pour les badges de matière
   *
   * Mémorise l'identifiant de chaque carte DISTINCTE passée en boîte verte (au plus
   * Badges.MASTERED_CAP par matière) : rejouer une carte, ou la rater, ne fait pas avancer
   * le badge. Les matières viennent de Badges.getSubjectsForDeck.
   *
   * @private
   * @param {Player} player - Joueur courant
   * @param {Deck} deck - Deck joué (avec tags ou category)
   * @param {Card} card - Carte jouée
   * @param {CardResult} result - Résultat de la carte
   * @returns {void}
   */
  _trackSubjectProgress(player, deck, card, result) {
    if (!deck || !card || !result || result.newBox !== 'green') return;

    const subjects = Badges.getSubjectsForDeck(deck);
    if (subjects.length === 0) return;

    const cardKey = `${deck.id}/${card.wordId || card.id}${card.direction ? ':' + card.direction : ''}`;
    if (!player.stats.masteredBySubject) {
      player.stats.masteredBySubject = {};
    }
    subjects.forEach(subject => {
      if (!Array.isArray(player.stats.masteredBySubject[subject])) {
        player.stats.masteredBySubject[subject] = [];
      }
      const list = player.stats.masteredBySubject[subject];
      if (list.length < Badges.MASTERED_CAP && !list.includes(cardKey)) {
        list.push(cardKey);
      }
    });
  },

  /**
   * Met à jour les stats du joueur après une carte
   *
   * Crédite l'XP de la carte ET le bonus de série éventuel (un seul crédit), incrémente
   * les cartes jouées et track les réponses rapides. Mémorise sur la session la dernière
   * activité d'avant la séance (previousPlayedAt) avant de réécrire lastPlayedAt.
   *
   * @private
   * @param {Player} player - Joueur courant
   * @param {CardResult} result - Résultat de la carte
   * @param {GameSession} session - Session en cours
   * @returns {void}
   */
  _updatePlayerStats(player, result, session) {
    const stats = player.stats;

    if (session && !('previousPlayedAt' in session)) {
      session.previousPlayedAt = stats.lastPlayedAt || null;
    }

    this.grantXp(player, (result.xpEarned || 0) + (result.bonusXp || 0));
    stats.totalCardsPlayed++;
    // Cartes passées en boîte verte (cumul, jamais décrémenté : base des quêtes de maîtrise)
    if (result.newBox === 'green') {
      stats.greenPromotions = (stats.greenPromotions || 0) + 1;
    }
    const now = new Date();
    stats.lastPlayedAt = now.toISOString();

    // Golden Hour : une réponse à 12:34
    if (typeof GameSecretStats !== 'undefined') {
      GameSecretStats.trackCardTime(player, now);
    }

    // Tracker la réponse correcte la plus rapide (pour badge speed_demon).
    // fastestCorrectAnswer peut valoir null (anciens joueurs) tant que rien n'est mesuré.
    if (result.isCorrect) {
      if (typeof stats.fastestCorrectAnswer !== 'number' || result.responseTimeMs < stats.fastestCorrectAnswer) {
        stats.fastestCorrectAnswer = result.responseTimeMs;
      }
      // Track fast answers (<2s) for speed_runner badge
      if (result.responseTimeMs < 2000) {
        stats.fastAnswers = (stats.fastAnswers || 0) + 1;
      }
    }

    // Mettre à jour le streak vert du joueur
    if (session.stats.maxGreenStreak > stats.longestGreenStreak) {
      stats.longestGreenStreak = session.stats.maxGreenStreak;
    }
  },

  /**
   * Attribue les badges débloqués : fonction d'attribution UNIQUE (carte, fin de séance, défi)
   *
   * Pour chaque nouveau badge : ajout à player.badges, crédit de l'XP (avec détection de
   * niveau), entrée dans xpHistory. Répète le contrôle tant que l'XP d'un badge en débloque
   * un autre (badge de niveau). Les badges obtenus sont ajoutés à session.newBadges (résumé
   * de fin de séance) et annoncés ensemble, en une seule popup.
   *
   * @param {Player} player - Joueur courant
   * @param {GameSession|null} session - Session en cours (null hors séance, ex. mode défi)
   * @param {Object} [context] - `{ sessionEnded: false }` pendant la séance
   * @returns {BadgeDefinition[]} Badges attribués par cet appel
   */
  awardBadges(player, session, context = {}) {
    const awarded = [];
    if (!Array.isArray(player.badges)) {
      player.badges = [];
    }

    let found;
    do {
      found = Badges.checkUnlocked(player, session, context);
      found.forEach(badge => {
        if (player.badges.includes(badge.id)) return;
        player.badges.push(badge.id);
        this.grantXp(player, badge.xpReward);
        this._recordXp(player, badge.xpReward, 'badge', badge.name);
        awarded.push(badge);
      });
    } while (found.length > 0);

    if (awarded.length > 0) {
      if (session) {
        session.newBadges = (session.newBadges || []).concat(awarded);
      }
      if (typeof Effects !== 'undefined' && Effects.badgePopup) {
        Effects.badgePopup.showMultiple(awarded);
      }
    }
    return awarded;
  },

  /**
   * Termine la session de jeu et navigue vers le résumé
   *
   * Effectue dans l'ordre :
   * 1. Incrémente le compteur de sessions
   * 2. Track les stats secrètes (badges cachés, absence)
   * 3. Track les decks uniques joués
   * 4. Ajoute l'XP de session à l'historique
   * 5. Met à jour les quêtes hebdomadaires (XP des quêtes terminées)
   * 6. Attribue les badges de fin de session (awardBadges) et célèbre le niveau gagné
   * 7. Sauvegarde et navigue vers /session-summary
   *
   * La série quotidienne est mise à jour carte par carte (nextCard), pas ici.
   *
   * @param {AppState} state - État global de l'application
   * @returns {void}
   */
  endSession(state) {
    const session = state.currentSession;
    const deck = state.decks.find(d => d.id === session.deckId);
    const player = state.player;

    session.endedAt = new Date().toISOString();

    // Incrémenter le compteur de sessions
    player.stats.totalSessions++;

    // Tracking pour badges secrets
    GameSecretStats.track(player, session);

    // Tracker les decks uniques joués (pour badge explorer)
    this._trackUniqueDecks(player, deck);

    // Ajouter à l'historique XP (XP des cartes + bonus de série, déjà crédités carte par carte)
    this._addXpHistory(player, session, deck);

    // Défi : score, bonus du jour (3 XP au plus), victoire (avant les quêtes : weekly_challenges)
    this._finishChallenge(player, session);

    // Quêtes de la semaine (les défis du jour sont suivis carte par carte)
    this._finishMissions(player, session);

    // Attribuer les badges de fin de session (séance terminée)
    this.awardBadges(player, session, { sessionEnded: true });

    // Sauvegarder le joueur (legacy + multi-player)
    Storage.savePlayer(player);
    Storage.savePlayerById(player);
    State.set('player', player);

    // Célébrer la montée de niveau éventuelle (une seule fois)
    this.flushLevelUp();

    // Afficher le résumé (session.newBadges contient tous les badges de la séance)
    session.newBadges = session.newBadges || [];
    session.completedChallenges = session.completedChallenges || [];
    session.completedQuests = session.completedQuests || [];
    State.set('currentSession', session);
    State.set('showSessionSummary', true);

    // Naviguer vers le résumé (page de fin de défi pour un défi : elle intègre le résumé)
    Router.navigate(session.challenge ? '/challenge-results' : '/session-summary');
  },

  /**
   * Fin d'un défi : évalue l'objectif, applique la récompense bornée (Challenges.applyOutcome) et
   * crédite le bonus du jour. Le résultat est mémorisé sur la séance (`challengeOutcome`).
   *
   * @private
   * @param {Player} player - Joueur courant
   * @param {GameSession} session - Séance terminée
   * @returns {Object|null} Résultat du défi, ou null si la séance n'est pas un défi
   */
  _finishChallenge(player, session) {
    if (!session.challenge) return null;
    const evaluation = Challenges.evaluateChallenge(session);
    const applied = Challenges.applyOutcome(player, session, TextUtils.getToday());
    if (applied.bonusXp > 0) {
      this.grantXp(player, applied.bonusXp);
      this._recordXp(player, applied.bonusXp, 'challenge', session.challenge.modeId);
    }
    session.challengeOutcome = { ...evaluation, ...applied };
    return session.challengeOutcome;
  },

  /**
   * Carte suivante d'un entraînement libre : seule la séance avance (ni carte, ni joueur, ni
   * missions ne sont modifiés). À la dernière carte, la séance se termine par `endPractice`.
   *
   * @private
   * @param {AppState} state - État global
   * @returns {void}
   */
  _nextPracticeCard(state) {
    const session = state.currentSession;
    session.currentIndex++;
    session.isShowingFeedback = false;
    session.cardStartTime = Date.now();
    if (session.currentIndex >= session.cards.length) {
      this.endPractice(state);
    } else {
      State.set('currentSession', session);
    }
  },

  /**
   * Termine un entraînement libre : aucune statistique du joueur n'est touchée (ni séance, ni
   * XP, ni série, ni badge) ; la page de fin dit simplement ce qui a été revu.
   *
   * @param {AppState} state - État global
   * @returns {void}
   */
  endPractice(state) {
    const session = state.currentSession;
    session.endedAt = new Date().toISOString();
    session.challengeOutcome = Challenges.evaluateChallenge(session);
    State.set('currentSession', session);
    Router.navigate('/challenge-results');
  },

  /**
   * Arrête un défi avant sa dernière carte (fin du chronomètre) sans rien compter comme faux
   *
   * Les cartes non atteintes sont retirées de la séance : elles restent à réviser. S'il y a déjà
   * des réponses, la séance se termine normalement (`endSession`) ; sinon, ou en entraînement
   * libre, seule la page de fin est affichée et le joueur n'est pas modifié.
   *
   * @param {AppState} state - État global
   * @param {string} [reason] - 'time' : le chronomètre est arrivé à zéro
   * @returns {void}
   */
  stopChallenge(state, reason = 'time') {
    const session = state.currentSession;
    if (!session || !session.challenge) return;
    if (reason === 'time') session.challenge.timedOut = true;
    session.cards = session.cards.slice(0, session.currentIndex);
    if (session.challenge.practice) {
      this.endPractice(state);
    } else if (session.results.length > 0) {
      this.endSession(state);
    } else {
      session.endedAt = new Date().toISOString();
      session.challengeOutcome = { ...Challenges.evaluateChallenge(session), counted: false, bonusXp: 0, isNewRecord: false, previousBest: 0 };
      State.set('currentSession', session);
      Router.navigate('/challenge-results');
    }
  },

  /**
   * Track les decks uniques joués pour le badge explorer
   *
   * @private
   * @param {Player} player - Joueur courant
   * @param {Deck|null} deck - Deck joué
   * @returns {void}
   */
  _trackUniqueDecks(player, deck) {
    if (!player.stats.playedDeckIds) {
      player.stats.playedDeckIds = [];
    }
    if (deck && !player.stats.playedDeckIds.includes(deck.id)) {
      player.stats.playedDeckIds.push(deck.id);
      player.stats.uniqueDecksPlayed = player.stats.playedDeckIds.length;
    }
  },

  /**
   * Ajoute l'XP de session à l'historique du joueur
   *
   * @private
   * @param {Player} player - Joueur courant
   * @param {GameSession} session - Session terminée
   * @param {Deck|null} deck - Deck joué
   * @returns {void}
   */
  _addXpHistory(player, session, deck) {
    if (session.stats.totalXpEarned > 0) {
      this._recordXp(player, session.stats.totalXpEarned, 'session', deck ? deck.name : 'Session');
    }
  },

  /**
   * Enregistre une carte dans les défis de la journée et crédite l'XP des défis terminés
   *
   * Les défis se suivent sur la journée entière : chaque carte compte, même si la séance est
   * abandonnée. Un défi n'est récompensé qu'une fois (Challenges.recordCard ne renvoie que
   * les nouveaux défis terminés). Les défis terminés sont ajoutés à `session.completedChallenges`
   * (bilan de séance).
   *
   * @private
   * @param {Player} player - Joueur courant
   * @param {GameSession} session - Session en cours
   * @param {Card} card - Carte jouée
   * @param {CardResult} result - Résultat de la carte
   * @param {string} deckId - Deck joué
   * @returns {Object[]} Défis nouvellement terminés
   */
  _recordMissions(player, session, card, result, deckId) {
    const completed = Challenges.recordCard(player, {
      deckId,
      cardId: card.wordId ? `${card.wordId}:${card.direction}` : card.id,
      isCorrect: !!result.isCorrect,
      maxGreenStreak: session.stats.maxGreenStreak
    }, TextUtils.getToday());

    completed.forEach(challenge => {
      this.grantXp(player, challenge.xpReward);
      this._recordXp(player, challenge.xpReward, 'challenge', challenge.type);
      session.completedChallenges = (session.completedChallenges || []).concat([{
        id: challenge.id, type: challenge.type, target: challenge.target, xpReward: challenge.xpReward
      }]);
    });
    return completed;
  },

  /**
   * Met à jour les quêtes hebdomadaires et crédite l'XP des quêtes terminées (une seule fois)
   *
   * Appelé en fin de séance (l'XP de séance est alors dans l'historique) et à l'ouverture de
   * la page des missions. Les quêtes terminées sont annoncées dans `session.completedQuests`.
   *
   * @param {Player} player - Joueur courant
   * @param {GameSession|null} session - Séance à annoncer (null hors séance)
   * @returns {Object[]} Quêtes nouvellement terminées
   */
  _finishMissions(player, session) {
    const completed = Challenges.updateWeekly(player, TextUtils.getToday());
    completed.forEach(quest => {
      this.grantXp(player, quest.xpReward);
      this._recordXp(player, quest.xpReward, 'quest', quest.type);
      if (session) {
        session.completedQuests = (session.completedQuests || []).concat([{
          id: quest.id, type: quest.type, target: quest.target, xpReward: quest.xpReward
        }]);
      }
    });
    return completed;
  }
};

// Export pour Node.js (tests) et navigateur
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameSessionManager;
}
