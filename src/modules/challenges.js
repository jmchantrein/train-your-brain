/**
 * Module Challenges - Missions (défis quotidiens, quêtes hebdomadaires) et mode défi
 *
 * Gère la génération et le suivi des missions du joueur (rangées dans `player.missions`,
 * propres à chaque joueur) ainsi que le mode défi avec niveaux de difficulté.
 *
 * Esprit : les missions récompensent la régularité et la maîtrise, jamais le volume. Les
 * objectifs sont bornés par ce que Leitner propose réellement ce jour-là ; un jour sans
 * carte à réviser n'a aucun défi ; l'XP des missions reste petite devant celle de la révision.
 */

const Challenges = {
  // ═══════════════════════════════════════════════════════════════
  // CONSTANTES
  // ═══════════════════════════════════════════════════════════════

  DAILY_TYPES: ['review_due', 'accuracy', 'green_streak'],
  WEEKLY_TYPES: ['weekly_xp', 'weekly_mastery', 'weekly_streak', 'weekly_challenges', 'weekly_decks'],

  // Défis quotidiens : précision visée sur la journée, séance de cartes minimale, série verte
  DAILY_ACCURACY: 70,
  DAILY_ACCURACY_MIN_CARDS: 10,
  DAILY_STREAK_TARGET: 3,
  // Objectif « réviser des cartes aujourd'hui » : jamais plus de 10 cartes (une courte séance
  // régulière), même si davantage de cartes sont dues : pas de culpabilité devant un retard.
  DAILY_REVIEW_CAP: 10,
  // XP des défis : au plus 25 % de l'XP de carte des cartes visées (2 XP/carte), soit 5 XP
  // par jour au maximum
  AVG_CARD_XP: 2,
  DAILY_XP_RATIO: 0.25,
  get DAILY_XP_MAX() { return this.DAILY_REVIEW_CAP * this.AVG_CARD_XP * this.DAILY_XP_RATIO; },

  // Quêtes hebdomadaires
  WEEKLY_MASTERY_TARGET: 10,
  WEEKLY_DAYS_TARGET: 3,
  WEEKLY_CHALLENGES_TARGET: 2,
  WEEKLY_DECKS_TARGET: 3,
  WEEKLY_XP_DEFAULT: 100,
  WEEKLY_XP_MIN: 50,
  WEEKLY_XP_MAX: 600,
  WEEKLY_XP_RATIO: 0.6,
  WEEKLY_XP_HISTORY_WEEKS: 4,
  // Récompense de chaque quête : 3 % de la cible d'XP, entre 3 et 10 XP (50 XP/semaine au plus)
  WEEKLY_REWARD_RATIO: 0.03,
  WEEKLY_REWARD_MIN: 3,
  WEEKLY_REWARD_MAX: 10,

  // ═══════════════════════════════════════════════════════════════
  // MODE DÉFI : constantes (docs/GAMIFICATION.md, section « Mode défi »)
  // ═══════════════════════════════════════════════════════════════

  // Bonus d'un défi réussi : 3 XP au plus une fois par jour (même ordre que les défis quotidiens),
  // jamais un multiple de l'XP de carte
  CHALLENGE_BONUS_XP: 3,
  // Entraînement libre (rien à réviser) : au plus 10 cartes au repos
  PRACTICE_CARDS: 10,
  // « Sans erreur » compte pour le badge `untouchable` à partir de ce nombre de cartes
  PERFECT_BADGE_MIN_CARDS: 10,

  // Niveaux : taille du défi (cartes), multiplicateur du SCORE affiché (aucun XP n'en dérive) et
  // budget de temps par carte de Contre la montre. Noms : clés `challenge.diff.<id>`.
  DIFFICULTY_LEVELS: {
    easy: { icon: '🌱', color: 'green', multiplier: 1.0, secondsPerCard: 30 },
    medium: { icon: '🔥', color: 'orange', multiplier: 1.5, secondsPerCard: 20 },
    hard: { icon: '💪', color: 'purple', multiplier: 2.0, secondsPerCard: 15 },
    expert: { icon: '⚡', color: 'red', multiplier: 3.0, secondsPerCard: 10 }
  },

  // « Jusqu'au bout » (endurance) : proposé seulement à partir de ce nombre de cartes à réviser,
  // soit nettement plus que le plus grand Parcours (15)
  ENDURANCE_MIN_DUE: 20,

  // Quatre modes, un seul cadre (mêmes cartes, même progression, même bonus). Noms et
  // descriptions : clés `challenge.mode.<id>` et `challenge.modeDesc.<id>`.
  // Parcours (steady) : répondre à N cartes avec un pourcentage de bonnes réponses visé.
  // Sans erreur (perfect) : viser une série de bonnes réponses d'affilée ; aucune vie, on joue
  // toutes les cartes et on voit jusqu'où on est allé.
  // Contre la montre (speed) : un budget de temps pour tout le défi, décompté pendant les questions
  // seulement ; objectif : le nombre de bonnes réponses qu'exige Parcours au même niveau, avant la fin du temps.
  // Jusqu'au bout (endurance) : TOUTES les cartes à réviser (jamais une de plus, aucune au repos) ;
  // objectif : garder le pourcentage visé sur la première moitié comme sur la seconde. Le niveau ne
  // règle que ce pourcentage, pas un nombre de cartes.
  CHALLENGE_MODES: {
    steady: {
      id: 'steady',
      icon: '🧭',
      rules: {
        easy: { cardsCount: 5, minAccuracy: 60 },
        medium: { cardsCount: 8, minAccuracy: 70 },
        hard: { cardsCount: 12, minAccuracy: 80 },
        expert: { cardsCount: 15, minAccuracy: 90 }
      }
    },
    perfect: {
      id: 'perfect',
      icon: '🎯',
      rules: {
        easy: { cardsCount: 5, targetRun: 4 },
        medium: { cardsCount: 8, targetRun: 6 },
        hard: { cardsCount: 12, targetRun: 10 },
        expert: { cardsCount: 15, targetRun: 15 }
      }
    },
    speed: {
      id: 'speed',
      icon: '⏱️',
      rules: {
        // `targetCorrect` est calculé depuis Parcours juste après ce littéral (une seule source)
        easy: { cardsCount: 5 },
        medium: { cardsCount: 8 },
        hard: { cardsCount: 12 },
        expert: { cardsCount: 15 }
      }
    },
    endurance: {
      id: 'endurance',
      icon: '🏔️',
      rules: {
        easy: { minAccuracy: 60 },
        medium: { minAccuracy: 70 },
        hard: { minAccuracy: 80 },
        expert: { minAccuracy: 90 }
      }
    }
  },

  // Anciens identifiants de mode (liens) : `streak` mène à Sans erreur
  LEGACY_MODES: { streak: 'perfect' },

  // Anciennes clés de meilleurs score relues par chaque mode (jamais supprimées) : `steady_*_timed`
  // vient de l'intégration précédente (Parcours chronométré), `streak_*` de l'ancienne série.
  LEGACY_SCORE_KEYS: {
    steady: [],
    perfect: ['streak_{d}', 'perfect_{d}_timed'],
    speed: ['steady_{d}_timed'],
    endurance: []
  },

  // ═══════════════════════════════════════════════════════════════
  // MISSIONS - Défis quotidiens et quêtes hebdomadaires
  //
  // Les missions sont rangées dans `player.missions` (donc enregistrées, exportées et
  // importées avec le joueur, isolées d'un joueur à l'autre) :
  //   player.missions = {
  //     daily:  { day, dueAtStart, cardsPlayed, correct, cardKeys, challenges },
  //     weekly: { weekStart, baseline, decksPlayed, daysPlayed, quests }
  //   }
  // `State.dailyChallenges` / `State.weeklyQuests` ne sont qu'un miroir (barre de navigation).
  // ═══════════════════════════════════════════════════════════════

  /**
   * Nombre de cartes à réviser aujourd'hui dans les decks que le joueur a commencés
   *
   * Une carte est « à réviser » si elle a déjà été jouée et qu'elle est jouable aujourd'hui
   * (non verte, ou verte dont le repos est terminé). Les cartes jamais jouées ne comptent
   * pas : les découvrir est facultatif. Par deck, le total est borné par `settings.maxCards`
   * (une séance ne peut pas en proposer davantage). Les decks multilingues comptent leurs
   * directions de mots.
   *
   * @param {Array} decks - Decks du joueur
   * @param {string} [today] - Jour local (YYYY-MM-DD)
   * @returns {number} Nombre de cartes à réviser
   */
  countDueCards(decks, today = null) {
    today = today || TextUtils.getToday();
    let total = 0;
    for (const deck of Array.isArray(decks) ? decks : []) {
      const due = this._reviewedPlayable(deck, today);
      if (due === 0) continue;
      const cap = deck.settings && Number.isFinite(deck.settings.maxCards) && deck.settings.maxCards > 0
        ? deck.settings.maxCards
        : (deck.type === 'multilingual' ? 50 : 100);
      total += Math.min(due, cap);
    }
    return total;
  },

  /**
   * Perspective de révision : cartes à revoir maintenant et prochaine date utile
   *
   * @param {Array} decks - Decks du joueur
   * @param {string} [today] - Jour local (YYYY-MM-DD)
   * @returns {{ dueNow: number, nextDay: (string|null) }} `dueNow` : cartes déjà jouées
   *   jouables aujourd'hui ; `nextDay` : premier jour (après aujourd'hui) où une carte verte
   *   sort de son repos, null s'il n'y en a pas
   */
  getReviewOutlook(decks, today = null) {
    today = today || TextUtils.getToday();
    let dueNow = 0;
    let nextDay = null;
    for (const deck of Array.isArray(decks) ? decks : []) {
      for (const entry of this._progressEntries(deck)) {
        if (!(entry.timesPlayed > 0)) continue;
        if (this._isPlayable(entry, today)) {
          dueNow++;
        } else if (entry.restUntil && entry.restUntil > today && (nextDay === null || entry.restUntil < nextDay)) {
          nextDay = entry.restUntil;
        }
      }
    }
    return { dueNow, nextDay };
  },

  /**
   * XP total que peuvent rapporter les défis d'une journée
   *
   * Règle : au plus 25 % de l'XP de carte des cartes visées (2 XP par carte en moyenne),
   * soit 5 XP par jour au maximum, avec un plancher de 3 XP (1 XP par défi). Les défis
   * restent un petit plus : la révision reste la première source d'XP.
   *
   * @param {number} targetCards - Cartes visées aujourd'hui (objectif « réviser », plafonné)
   * @returns {number} XP total des défis du jour (0 s'il n'y a rien à réviser)
   */
  dailyXpPool(targetCards) {
    if (!(targetCards >= 1)) return 0;
    const share = Math.round(targetCards * this.AVG_CARD_XP * this.DAILY_XP_RATIO);
    return Math.min(this.DAILY_XP_MAX, Math.max(3, share));
  },

  /**
   * Génère les défis quotidiens
   *
   * Les objectifs se calculent sur la journée entière et sont bornés par le nombre de
   * cartes à réviser (et par DAILY_REVIEW_CAP) : ils ne dépendent pas du niveau. Sans carte
   * à réviser, il n'y a aucun défi (rien à rater).
   *
   * @param {Object} player - Le joueur (non utilisé : les objectifs ne dépendent pas du niveau)
   * @param {string} [today] - Jour local (YYYY-MM-DD)
   * @param {{ dueCount: number }} [context] - Cartes à réviser aujourd'hui (countDueCards)
   * @returns {Array} - 3 défis (réviser les cartes du jour, précision, série verte) ou []
   *
   * @example
   * Challenges.generateDaily(player, '2026-01-05', { dueCount: 18 });
   * // review_due 18, accuracy { accuracy: 70, minCards: 10 }, green_streak 3 (review_due 10 au plus)
   */
  generateDaily(player, today = null, context = {}) {
    today = today || TextUtils.getToday();
    const available = Math.floor(Number(context && context.dueCount) || 0);
    if (available < 1) return [];
    const due = Math.min(available, this.DAILY_REVIEW_CAP);

    const tomorrow = this._getTomorrow(today);
    const pool = this.dailyXpPool(due);
    const small = Math.max(1, Math.floor(pool / 4));
    const make = (suffix, type, target, xpReward) => ({
      id: `challenge_${today}_${suffix}`,
      type,
      target,
      xpReward,
      createdAt: today,
      expiresAt: tomorrow,
      progress: 0,
      completed: false,
      completedAt: null
    });

    return [
      make('review', 'review_due', due, pool - 2 * small),
      make('accuracy', 'accuracy', {
        accuracy: this.DAILY_ACCURACY,
        minCards: Math.min(this.DAILY_ACCURACY_MIN_CARDS, due)
      }, small),
      make('streak', 'green_streak', Math.min(this.DAILY_STREAK_TARGET, due), small)
    ];
  },

  /**
   * Crée l'enregistrement des missions quotidiennes d'un jour
   *
   * @param {Object} player - Le joueur
   * @param {string} today - Jour local (YYYY-MM-DD)
   * @param {number} dueCount - Cartes à réviser ce jour-là
   * @returns {Object} `{ day, dueAtStart, cardsPlayed, correct, cardKeys, challenges }`
   */
  createDailyRecord(player, today, dueCount) {
    return {
      day: today,
      dueAtStart: dueCount,
      cardsPlayed: 0,
      correct: 0,
      cardKeys: [],
      challenges: this.generateDaily(player, today, { dueCount })
    };
  },

  /**
   * Génère les quêtes hebdomadaires (instantané du début de semaine compris)
   *
   * @param {Object} player - Le joueur
   * @param {string} weekStart - Lundi de la semaine (YYYY-MM-DD, jour local)
   * @param {Array} [decks] - Decks du joueur (bornent les cibles)
   * @returns {Object} `{ weekStart, baseline, decksPlayed, daysPlayed, quests }`
   */
  createWeeklyRecord(player, weekStart, decks = null) {
    const stats = (player && player.stats) || {};
    const weekEnd = TextUtils.addDays(weekStart, 6);
    const xpTarget = this.weeklyXpTarget(player, weekStart);
    const reward = Math.min(this.WEEKLY_REWARD_MAX, Math.max(this.WEEKLY_REWARD_MIN, Math.round(xpTarget * this.WEEKLY_REWARD_RATIO)));

    // Les cibles ne dépassent jamais ce que le joueur peut faire (cartes et decks commencés)
    let stock = null;
    let startedDecks = 0;
    for (const deck of Array.isArray(decks) ? decks : []) {
      const entries = this._progressEntries(deck);
      if (entries.some(e => e.timesPlayed > 0)) {
        startedDecks++;
        stock = (stock || 0) + entries.length;
      }
    }
    const masteryTarget = stock === null ? this.WEEKLY_MASTERY_TARGET : Math.max(1, Math.min(this.WEEKLY_MASTERY_TARGET, stock));
    const decksTarget = startedDecks === 0 ? 2 : Math.max(1, Math.min(this.WEEKLY_DECKS_TARGET, startedDecks));

    const make = (suffix, type, target) => ({
      id: `weekly_${weekStart}_${suffix}`,
      type,
      target,
      xpReward: reward,
      createdAt: weekStart,
      expiresAt: weekEnd,
      progress: 0,
      completed: false,
      completedAt: null
    });

    return {
      weekStart,
      baseline: {
        greenPromotions: stats.greenPromotions || 0,
        challengeWins: stats.challengeWins || 0
      },
      decksPlayed: [],
      daysPlayed: [],
      quests: [
        make('xp', 'weekly_xp', xpTarget),
        make('mastery', 'weekly_mastery', masteryTarget),
        make('streak', 'weekly_streak', this.WEEKLY_DAYS_TARGET),
        make('challenges', 'weekly_challenges', this.WEEKLY_CHALLENGES_TARGET),
        make('decks', 'weekly_decks', decksTarget)
      ]
    };
  },

  /**
   * Cible de la quête « XP de la semaine » : suit l'XP de révision réaliste du joueur
   *
   * 60 % de la moyenne hebdomadaire de l'XP de séances des 4 semaines précédentes (semaines
   * jouées seulement), arrondie à 5, entre 50 et 600 ; 100 sans historique. Elle ne dépend
   * pas du niveau et ne peut pas croître sans fin.
   *
   * @param {Object} player - Le joueur
   * @param {string} weekStart - Lundi de la semaine (YYYY-MM-DD)
   * @returns {number} XP visé
   */
  weeklyXpTarget(player, weekStart) {
    const history = (player && player.stats && Array.isArray(player.stats.xpHistory)) ? player.stats.xpHistory : [];
    const from = TextUtils.addDays(weekStart, -7 * this.WEEKLY_XP_HISTORY_WEEKS);
    const weeks = {};
    for (const entry of history) {
      if (!entry || entry.source !== 'session' || typeof entry.date !== 'string') continue;
      const day = entry.date.slice(0, 10);
      if (day < from || day >= weekStart || !(entry.amount > 0)) continue;
      const key = this._weekStartOf(day);
      weeks[key] = (weeks[key] || 0) + entry.amount;
    }
    const totals = Object.values(weeks);
    if (totals.length === 0) return this.WEEKLY_XP_DEFAULT;

    const average = totals.reduce((a, b) => a + b, 0) / totals.length;
    const target = Math.round((average * this.WEEKLY_XP_RATIO) / 5) * 5;
    return Math.min(this.WEEKLY_XP_MAX, Math.max(this.WEEKLY_XP_MIN, target));
  },

  /**
   * S'assure que les missions du joueur sont celles d'aujourd'hui et de cette semaine
   *
   * Régénère les défis si le jour a changé (la charge du jour est mesurée à ce moment-là,
   * puis figée) et les quêtes si la semaine a changé (lundi local). Rien ne change si les
   * missions sont déjà à jour.
   *
   * @param {Object} player - Le joueur (muté : `player.missions`)
   * @param {{ decks: Array, today: (string|undefined) }} [context] - Decks et jour local
   * @returns {boolean} true si les missions ont été (re)créées : le joueur est à enregistrer
   */
  refreshMissions(player, context = {}) {
    const today = (context && context.today) || TextUtils.getToday();
    const decks = context ? context.decks : null;
    if (!player.missions || typeof player.missions !== 'object') {
      player.missions = {};
    }
    const missions = player.missions;
    let changed = false;

    if (!missions.daily || missions.daily.day !== today) {
      missions.daily = this.createDailyRecord(player, today, this.countDueCards(decks, today));
      changed = true;
    }

    const weekStart = this._weekStartOf(today);
    if (!missions.weekly || missions.weekly.weekStart !== weekStart) {
      missions.weekly = this.createWeeklyRecord(player, weekStart, decks);
      changed = true;
    }
    return changed;
  },

  /**
   * Enregistre une carte jouée dans les missions de la journée et de la semaine
   *
   * Appelé à chaque carte : une séance abandonnée compte aussi. Les défis se suivent sur la
   * journée entière (cumul de toutes les séances). Ne renvoie que les défis terminés par
   * cette carte (chacun une seule fois) ; l'XP est créditée par l'appelant.
   *
   * @param {Object} player - Le joueur (muté)
   * @param {{ deckId: string, cardId: string, isCorrect: boolean, maxGreenStreak: number }} entry
   * @param {string} [today] - Jour local (YYYY-MM-DD)
   * @returns {Array} Défis quotidiens nouvellement terminés (copies)
   */
  recordCard(player, entry, today = null) {
    today = today || TextUtils.getToday();
    const missions = player && player.missions;
    if (!missions) return [];

    const weekly = missions.weekly;
    if (weekly && weekly.weekStart === this._weekStartOf(today)) {
      if (!weekly.daysPlayed.includes(today)) weekly.daysPlayed.push(today);
      if (entry.deckId && !weekly.decksPlayed.includes(entry.deckId) && weekly.decksPlayed.length < 100) {
        weekly.decksPlayed.push(entry.deckId);
      }
    }

    const daily = missions.daily;
    if (!daily || daily.day !== today) return [];

    daily.cardsPlayed++;
    if (entry.isCorrect) daily.correct++;
    const key = `${entry.deckId}/${entry.cardId}`;
    if (!daily.cardKeys.includes(key) && daily.cardKeys.length < 500) daily.cardKeys.push(key);

    const completed = [];
    for (const challenge of daily.challenges) {
      if (challenge.completed) continue;

      switch (challenge.type) {
        case 'review_due':
          challenge.progress = Math.min(daily.cardKeys.length, challenge.target);
          break;
        case 'accuracy':
          if (daily.cardsPlayed >= challenge.target.minCards) {
            challenge.progress = Math.floor((daily.correct / daily.cardsPlayed) * 100);
          }
          break;
        case 'green_streak':
          challenge.progress = Math.max(challenge.progress, Math.min(entry.maxGreenStreak || 0, challenge.target));
          break;
      }

      if (this._isDailyCompleted(challenge)) {
        challenge.completed = true;
        challenge.completedAt = new Date().toISOString();
        completed.push({ ...challenge });
      }
    }
    return completed;
  },

  /**
   * Met à jour la progression des quêtes de la semaine
   *
   * La progression de la semaine se mesure par différence avec l'instantané pris au début de
   * la semaine (cartes passées en vert, défis gagnés) ou sur les jours et decks joués cette
   * semaine ; l'XP compte l'XP de séances. Chaque quête n'est renvoyée qu'une fois, quand
   * elle se termine ; l'XP est créditée par l'appelant.
   *
   * @param {Object} player - Le joueur (muté)
   * @param {string} [today] - Jour local (YYYY-MM-DD)
   * @returns {Array} Quêtes nouvellement terminées (copies)
   */
  updateWeekly(player, today = null) {
    today = today || TextUtils.getToday();
    const weekly = player && player.missions && player.missions.weekly;
    if (!weekly || weekly.weekStart !== this._weekStartOf(today)) return [];

    const stats = player.stats || {};
    const base = weekly.baseline || {};
    const weekEnd = TextUtils.addDays(weekly.weekStart, 6);
    const completed = [];

    for (const quest of weekly.quests) {
      if (quest.completed) continue;

      switch (quest.type) {
        case 'weekly_xp':
          quest.progress = (Array.isArray(stats.xpHistory) ? stats.xpHistory : [])
            .filter(e => e && e.source === 'session' && typeof e.date === 'string'
              && e.date.slice(0, 10) >= weekly.weekStart && e.date.slice(0, 10) <= weekEnd)
            .reduce((sum, e) => sum + e.amount, 0);
          break;
        case 'weekly_mastery':
          quest.progress = Math.max(0, (stats.greenPromotions || 0) - (base.greenPromotions || 0));
          break;
        case 'weekly_streak':
          quest.progress = weekly.daysPlayed.length;
          break;
        case 'weekly_challenges':
          quest.progress = Math.max(0, (stats.challengeWins || 0) - (base.challengeWins || 0));
          break;
        case 'weekly_decks':
          quest.progress = weekly.decksPlayed.length;
          break;
      }

      if (quest.progress >= quest.target) {
        quest.completed = true;
        quest.completedAt = new Date().toISOString();
        completed.push({ ...quest });
      }
    }
    return completed;
  },

  /**
   * Texte d'un défi ou d'une quête, dans la langue courante
   *
   * @param {Object} item - Défi quotidien ou quête hebdomadaire (`type`, `target`)
   * @param {Function} [translate] - Fonction de traduction (défaut : `t`)
   * @returns {string} Texte (non échappé)
   */
  describe(item, translate = null) {
    const tr = translate || (typeof t === 'function' ? t : (k) => k);
    const isDaily = this.DAILY_TYPES.includes(item.type);
    const prefix = isDaily ? 'missions.daily.' : 'missions.weekly.';
    const params = item.type === 'accuracy'
      ? { percent: item.target.accuracy, count: item.target.minCards }
      : { count: item.target };
    const count = params.count;
    return tr(prefix + item.type + (count === 1 ? '_one' : ''), params);
  },

  /**
   * Recopie les missions du joueur dans l'état (miroir lu par la barre de navigation)
   *
   * Seules les missions du jour et de la semaine en cours sont exposées : celles d'un autre
   * jour ne comptent pas. Le miroir est propre au joueur courant.
   *
   * @param {Object|null} player - Joueur courant
   * @param {string} [today] - Jour local (YYYY-MM-DD)
   */
  syncState(player, today = null) {
    if (typeof State === 'undefined') return;
    today = today || TextUtils.getToday();
    const missions = player && player.missions;
    const daily = missions && missions.daily && missions.daily.day === today
      ? missions.daily.challenges : this._NONE;
    const weekly = missions && missions.weekly && missions.weekly.weekStart === this._weekStartOf(today)
      ? missions.weekly.quests : this._NONE;
    if (State.get('dailyChallenges') !== daily) State.set('dailyChallenges', daily);
    if (State.get('weeklyQuests') !== weekly) State.set('weeklyQuests', weekly);
  },

  /** Abonnement au joueur courant (référence stable : un seul abonnement même si rappelé) */
  _onPlayerChange: (player) => Challenges.syncState(player),

  /**
   * Abonne le miroir des missions au joueur courant (appelé au chargement du module)
   */
  bindState() {
    if (typeof State !== 'undefined' && typeof State.subscribe === 'function') {
      State.subscribe('player', this._onPlayerChange);
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // MODE DÉFI - une autre façon de faire ses révisions
  //
  // Un défi est une séance normale (mêmes cartes que Leitner.getCardsForSession, même chemin de
  // progression : GameAnswerValidator, GameSessionManager) décrite par `session.challenge`.
  // Ce module ne fait que créer la séance, évaluer l'objectif, calculer le score affiché et
  // appliquer la récompense bornée ; il ne touche jamais aux boîtes ni au repos des cartes.
  // ═══════════════════════════════════════════════════════════════

  /**
   * Mode et variante demandés par un identifiant (route, ancien lien)
   *
   * `practice` désigne l'entraînement libre ; l'ancien `streak` mène à Sans erreur ; un ancien lien
   * Parcours avec l'indicateur `timed` (chronomètre facultatif) mène à Contre la montre.
   *
   * @param {string} id - Identifiant de mode
   * @param {string} [flag] - Indicateur de route (`timed`, ancien)
   * @returns {{ modeId: string, practice: boolean }|null} null si inconnu
   */
  resolveMode(id, flag = null) {
    if (typeof id !== 'string') return null;
    if (id === 'practice') return { modeId: 'steady', practice: true };
    if (Object.hasOwn(this.CHALLENGE_MODES, id)) {
      return { modeId: id === 'steady' && flag === 'timed' ? 'speed' : id, practice: false };
    }
    if (Object.hasOwn(this.LEGACY_MODES, id)) return { modeId: this.LEGACY_MODES[id], practice: false };
    return null;
  },

  /**
   * Niveaux proposés pour un nombre de cartes à réviser : un niveau n'est offert que si le deck
   * a au moins autant de cartes (jamais de défi raccourci)
   *
   * Jusqu'au bout n'a pas de taille par niveau : ses quatre niveaux sont offerts à partir de
   * `ENDURANCE_MIN_DUE` cartes à réviser, jamais en dessous.
   *
   * @param {number} dueCount - Cartes à réviser dans le deck
   * @param {string} [modeId] - Mode (défaut : Parcours ; Sans erreur et Contre la montre ont les mêmes tailles)
   * @returns {string[]} Identifiants de niveau, du plus léger au plus soutenu
   */
  availableTiers(dueCount, modeId = 'steady') {
    const levels = Object.keys(this.DIFFICULTY_LEVELS);
    if (modeId === 'endurance') return dueCount >= this.ENDURANCE_MIN_DUE ? levels : [];
    const rules = (this.CHALLENGE_MODES[modeId] || this.CHALLENGE_MODES.steady).rules;
    return levels.filter(d => rules[d].cardsCount <= dueCount);
  },

  /**
   * Modes proposés pour un deck et un joueur
   *
   * Contre la montre n'est proposé que si le chronomètre est permis au joueur ; Jusqu'au bout
   * seulement à partir de `ENDURANCE_MIN_DUE` cartes à réviser.
   *
   * @param {number} dueCount - Cartes à réviser dans le deck
   * @param {Object|null} player - Joueur (préférences d'accessibilité)
   * @returns {string[]} Identifiants de mode, dans l'ordre d'affichage
   */
  availableModes(dueCount, player = null) {
    return Object.keys(this.CHALLENGE_MODES).filter(id => {
      if (id === 'speed' && !this.timerAllowed(player)) return false;
      return this.availableTiers(dueCount, id).length > 0;
    });
  },

  /**
   * Contre la montre est-il proposé à ce joueur ? Jamais avec le mode dyslexie ou l'espacement large.
   * @param {Object|null} player - Joueur
   * @returns {boolean}
   */
  timerAllowed(player) {
    const settings = (player && player.settings) || {};
    return !(settings.dyslexiaMode || settings.largeSpacing);
  },

  /** Un deck peut-il servir à un défi ? (standard seulement, comme la séance normale) @private */
  _isChallengeDeck(deck) {
    return !!deck && deck.type !== 'multilingual' && Array.isArray(deck.cards);
  },

  /**
   * Cartes à réviser d'un deck : exactement celles que la séance normale proposerait
   *
   * @param {Object} deck - Deck standard
   * @param {string} [today] - Jour local (YYYY-MM-DD)
   * @returns {Object[]} Cartes (jamais une carte verte au repos)
   */
  dueChallengeCards(deck, today = null) {
    if (!this._isChallengeDeck(deck)) return [];
    return Leitner.getCardsForSession(deck, {
      today: today || TextUtils.getToday(),
      maxCards: deck.settings?.maxCards ?? 100,
      ignoreRest: false,
      sequential: deck.settings?.sequential ?? false
    });
  },

  /**
   * Cartes au repos d'un deck (entraînement libre)
   * @param {Object} deck - Deck standard
   * @param {string} [today] - Jour local (YYYY-MM-DD)
   * @returns {Object[]}
   */
  restingCards(deck, today = null) {
    if (!this._isChallengeDeck(deck)) return [];
    today = today || TextUtils.getToday();
    return deck.cards.filter(card => !Leitner.isCardPlayable(card, today));
  },

  /**
   * Crée la séance d'un défi (séance normale + `session.challenge`)
   *
   * Défi de révision : les N premières cartes de `Leitner.getCardsForSession`, N selon le niveau ;
   * null s'il y en a moins (jamais de défi raccourci). Jusqu'au bout : toutes ces cartes, à partir
   * de `ENDURANCE_MIN_DUE`. Contre la montre : refusé (null) si le chronomètre n'est pas permis au
   * joueur. Entraînement libre (`practice`) : jusqu'à 10 cartes au repos, uniquement quand le deck
   * n'a AUCUNE carte à réviser (le repos n'est jamais court-circuité).
   *
   * @param {{ modeId: string, difficulty: string, practice: boolean }} options
   * @param {Object} deck - Deck standard
   * @param {string} [today] - Jour local (YYYY-MM-DD)
   * @param {Object} [player] - Joueur (préférences d'accessibilité)
   * @returns {Object|null} Séance, ou null si le défi n'est pas possible
   */
  createChallengeSession(options, deck, today = null, player = null) {
    const { modeId, difficulty, practice = false } = options || {};
    if (typeof modeId !== 'string' || !Object.hasOwn(this.CHALLENGE_MODES, modeId)) return null;
    if (!this._isChallengeDeck(deck)) return null;
    today = today || TextUtils.getToday();
    const mode = this.CHALLENGE_MODES[modeId];

    let cards;
    let rules = null;
    let level = this.DIFFICULTY_LEVELS.easy;
    if (practice) {
      if (this.dueChallengeCards(deck, today).length > 0) return null;
      const resting = this.restingCards(deck, today);
      if (resting.length === 0) return null;
      // Réglage du deck : ordre séquentiel respecté, sinon mélangé
      cards = (deck.settings?.sequential ? resting : TextUtils.shuffleArray(resting)).slice(0, this.PRACTICE_CARDS);
    } else {
      if (typeof difficulty !== 'string' || !Object.hasOwn(this.DIFFICULTY_LEVELS, difficulty)) return null;
      level = this.DIFFICULTY_LEVELS[difficulty];
      rules = mode.rules[difficulty];
      if (modeId === 'speed' && !this.timerAllowed(player)) return null;
      const due = this.dueChallengeCards(deck, today);
      if (modeId === 'endurance') {
        if (due.length < this.ENDURANCE_MIN_DUE) return null;
        cards = due;
      } else {
        if (due.length < rules.cardsCount) return null;
        cards = due.slice(0, rules.cardsCount);
      }
    }

    const isTimed = !practice && modeId === 'speed';
    let target = null;
    if (!practice) {
      if (modeId === 'perfect') target = { run: rules.targetRun };
      else if (modeId === 'speed') target = { correct: rules.targetCorrect };
      else if (modeId === 'endurance') target = { accuracy: rules.minAccuracy, halves: true };
      else target = { accuracy: rules.minAccuracy };
    }

    return {
      deckId: deck.id,
      cards,
      currentIndex: 0,
      isShowingFeedback: false,
      cardStartTime: Date.now(),
      startedAt: new Date().toISOString(),
      endedAt: null,
      results: [],
      stats: {
        cardsPlayed: 0,
        correctAnswers: 0,
        currentGreenStreak: 0,
        maxGreenStreak: 0,
        totalXpEarned: 0
      },
      challenge: {
        modeId,
        difficulty: practice ? null : difficulty,
        practice,
        timed: isTimed,
        plannedCards: cards.length,
        target,
        multiplier: practice ? 1 : level.multiplier,
        timeBudgetMs: isTimed ? rules.cardsCount * level.secondsPerCard * 1000 : null,
        timedOut: false
      }
    };
  },

  /**
   * Temps restant d'un défi chronométré (ms), ou null sans chronomètre
   *
   * Un seul budget pour tout le défi, qui ne s'écoule que pendant les questions : temps de
   * réponse des cartes déjà répondues + temps écoulé sur la carte affichée (hors retour).
   *
   * @param {Object} session - Séance de défi
   * @param {number} [now] - Instant courant (ms)
   * @returns {number|null}
   */
  remainingMs(session, now = Date.now()) {
    const challenge = session && session.challenge;
    if (!challenge || !challenge.timeBudgetMs) return null;
    const used = (session.results || []).reduce((sum, r) => sum + (r.responseTimeMs || 0), 0);
    const running = session.isShowingFeedback ? 0 : Math.max(0, now - session.cardStartTime);
    return challenge.timeBudgetMs - used - running;
  },

  /**
   * Évalue un défi à partir des résultats de la séance
   *
   * Parcours : réussi si toutes les cartes sont répondues avec le pourcentage de bonnes réponses
   * du niveau. Sans erreur : réussi si la plus longue série de bonnes réponses atteint la série
   * visée. Contre la montre : réussi dès que le nombre de bonnes réponses visé est atteint (même si
   * le temps s'arrête avant la dernière carte). Jusqu'au bout : toutes les cartes répondues et le
   * pourcentage visé tenu sur chacune des deux moitiés (la seconde prend la carte en trop).
   * Les cartes non atteintes (fin du chronomètre) ne comptent pas comme fausses. Le score est un
   * AFFICHAGE : somme par carte de floor((100 + bonus de vitesse + 10 x série) x multiplicateur).
   *
   * @param {Object} session - Séance de défi
   * @returns {{ answered: number, correct: number, wrong: number, accuracy: number, bestRun: number,
   *   score: number, complete: boolean, timedOut: boolean, success: boolean, practice: boolean,
   *   halves: Array<{answered: number, correct: number}>|null }}
   */
  evaluateChallenge(session) {
    const challenge = session.challenge;
    const results = Array.isArray(session.results) ? session.results : [];
    let run = 0;
    let bestRun = 0;
    let correct = 0;
    let score = 0;
    for (const r of results) {
      if (r.isCorrect) {
        correct++;
        run++;
        bestRun = Math.max(bestRun, run);
        const speedBonus = Math.max(0, Math.floor((5000 - (r.responseTimeMs || 0)) / 100));
        score += Math.floor((100 + speedBonus + run * 10) * challenge.multiplier);
      } else {
        run = 0;
      }
    }
    const answered = results.length;
    const complete = answered >= challenge.plannedCards;
    let success = false;
    let halves = null;
    if (!challenge.practice && challenge.target) {
      const target = challenge.target;
      if (challenge.modeId === 'endurance') {
        const cut = Math.floor(challenge.plannedCards / 2);
        halves = [results.slice(0, cut), results.slice(cut)].map(part => ({
          answered: part.length, correct: part.filter(r => r.isCorrect).length
        }));
        success = complete && halves.every(h => h.answered > 0 && h.correct * 100 >= target.accuracy * h.answered);
      } else if (challenge.modeId === 'perfect') {
        success = bestRun >= target.run;
      } else if (challenge.modeId === 'speed') {
        success = correct >= target.correct;
      } else {
        success = complete && answered > 0 && correct * 100 >= target.accuracy * answered;
      }
    }
    return {
      answered,
      correct,
      wrong: answered - correct,
      accuracy: answered > 0 ? Math.round((correct / answered) * 100) : 0,
      bestRun,
      score,
      complete,
      timedOut: !!challenge.timedOut,
      success,
      practice: !!challenge.practice,
      halves
    };
  },

  /**
   * Clé du meilleur score d'un mode et d'un niveau
   * @returns {string} Ex. `steady_easy`, `speed_hard`, `endurance_medium`
   */
  scoreKey(modeId, difficulty) {
    return `${modeId}_${difficulty}`;
  },

  /**
   * Meilleur score personnel d'un mode et d'un niveau
   *
   * Relit les anciennes clés (`LEGACY_SCORE_KEYS`) : `speed_*`, `endurance_*` et `perfect_*` sont les
   * clés de leurs modes ; `steady_*_timed` (Parcours chronométré) vaut pour Contre la montre ;
   * `streak_*` et `perfect_*_timed` pour Sans erreur. Les scores ne sont jamais supprimés.
   *
   * @param {Object} player - Joueur
   * @param {string} modeId - Mode
   * @param {string} difficulty - Niveau
   * @returns {number} 0 si aucun score
   */
  getBestScore(player, modeId, difficulty) {
    const scores = this.getBestScores(player);
    const keys = [this.scoreKey(modeId, difficulty)]
      .concat((this.LEGACY_SCORE_KEYS[modeId] || []).map(k => k.replace('{d}', difficulty)));
    return Math.max(0, ...keys.map(k => Number(scores[k]) || 0));
  },

  /**
   * Meilleurs scores d'un joueur pour les défis (par joueur, jamais de classement)
   * @param {Object} player - Le joueur
   * @returns {Object} - Meilleurs scores par clé de mode et de niveau
   */
  getBestScores(player) {
    return (player && player.challengeScores) || {};
  },

  /**
   * Applique la fin d'un défi au joueur : meilleur score, victoire, compteurs de badges, bonus
   *
   * Bonus de 3 XP au plus une fois par jour (`stats.lastChallengeDay`), seulement pour un défi de
   * révision réussi ; la victoire du jour alimente la quête `weekly_challenges`. Les compteurs des
   * badges `challenger` (niveau Expert) et `untouchable` (Sans erreur d'au moins 10 cartes, aucune
   * erreur) ne dépendent pas du bonus du jour. L'entraînement libre et un défi sans réponse ne
   * changent rien. Le crédit d'XP et l'historique sont faits par l'appelant (`bonusXp`).
   *
   * @param {Object} player - Joueur (muté)
   * @param {Object} session - Séance de défi terminée
   * @param {string} [today] - Jour local (YYYY-MM-DD)
   * @returns {{ counted: boolean, bonusXp: number, isNewRecord: boolean, previousBest: number }}
   */
  applyOutcome(player, session, today = null) {
    const challenge = session.challenge;
    const outcome = { counted: false, bonusXp: 0, isNewRecord: false, previousBest: 0 };
    const evaluation = this.evaluateChallenge(session);
    if (challenge.practice || evaluation.answered === 0) return outcome;
    today = today || TextUtils.getToday();

    const key = this.scoreKey(challenge.modeId, challenge.difficulty);
    outcome.previousBest = this.getBestScore(player, challenge.modeId, challenge.difficulty);
    if (!player.challengeScores) player.challengeScores = {};
    if (evaluation.score > (player.challengeScores[key] || 0)) player.challengeScores[key] = evaluation.score;
    outcome.isNewRecord = outcome.previousBest > 0 && evaluation.score > outcome.previousBest;

    if (!evaluation.success) return outcome;
    const stats = player.stats;
    if (challenge.difficulty === 'expert') {
      stats.expertChallengeWins = (stats.expertChallengeWins || 0) + 1;
    }
    if (challenge.modeId === 'perfect' && evaluation.wrong === 0 && evaluation.answered >= this.PERFECT_BADGE_MIN_CARDS) {
      stats.perfectChallengeComplete = true;
    }
    if (stats.lastChallengeDay !== today) {
      stats.lastChallengeDay = today;
      stats.challengeWins = (stats.challengeWins || 0) + 1;
      outcome.counted = true;
      outcome.bonusXp = this.CHALLENGE_BONUS_XP;
    }
    return outcome;
  },

  // ═══════════════════════════════════════════════════════════════
  // FONCTIONS PRIVÉES
  // ═══════════════════════════════════════════════════════════════

  /** Liste vide partagée (miroir de l'état : évite des notifications inutiles) @private */
  _NONE: [],

  /**
   * Vérifie si un défi quotidien est complété
   *
   * @private
   * @param {Object} challenge - Le défi à vérifier
   * @returns {boolean} - true si complété
   */
  _isDailyCompleted(challenge) {
    switch (challenge.type) {
      case 'review_due':
      case 'green_streak':
        return challenge.progress >= challenge.target;
      case 'accuracy':
        return challenge.progress >= challenge.target.accuracy;
      default:
        return false;
    }
  },

  /**
   * Calcule la date de demain à partir d'une date donnée
   *
   * @private
   * @param {string} today - Date du jour (format YYYY-MM-DD)
   * @returns {string} - Date de demain (format YYYY-MM-DD)
   */
  _getTomorrow(today) {
    return TextUtils.addDays(today, 1);
  },

  /**
   * Lundi (jour local) de la semaine contenant un jour
   *
   * @private
   * @param {string} day - Jour local (YYYY-MM-DD)
   * @returns {string} Lundi de la semaine (YYYY-MM-DD)
   */
  _weekStartOf(day) {
    const [y, m, d] = day.split('-').map(Number);
    return TextUtils.getWeekStart(new Date(y, m - 1, d));
  },

  /**
   * Une carte (ou direction de mot) est-elle jouable ce jour-là ?
   * @private
   */
  _isPlayable(entry, today) {
    try {
      return Leitner.isCardPlayable(entry, today);
    } catch (e) {
      return false; // boîte illisible : ne compte pas
    }
  },

  /**
   * Progressions d'un deck : cartes (standard) ou directions de mots (multilingue)
   * @private
   * @param {Object} deck - Deck
   * @returns {Array<Object>} Entrées `{ box, restUntil, timesPlayed }`
   */
  _progressEntries(deck) {
    if (!deck || typeof deck !== 'object') return [];
    if (deck.type !== 'multilingual' && Array.isArray(deck.cards)) {
      return deck.cards.filter(c => c && typeof c === 'object');
    }
    if (Array.isArray(deck.words)) {
      const entries = [];
      deck.words.forEach(word => {
        Object.values((word && word.progress) || {}).forEach(p => {
          if (p && typeof p === 'object') entries.push(p);
        });
      });
      return entries;
    }
    return [];
  },

  /**
   * Nombre d'entrées déjà jouées et jouables aujourd'hui dans un deck
   * @private
   */
  _reviewedPlayable(deck, today) {
    return this._progressEntries(deck).filter(e => e.timesPlayed > 0 && this._isPlayable(e, today)).length;
  },

  /**
   * Obtient les informations de la semaine courante
   *
   * @private
   * @returns {Object} - { weekNumber, startDate, endDate }
   */
  _getWeekInfo() {
    const now = new Date();
    // Semaine locale commençant le lundi (fonction unique : TextUtils)
    const startDate = TextUtils.getWeekStart(now);

    return {
      weekNumber: Math.ceil((now - new Date(now.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000)),
      startDate,
      endDate: TextUtils.addDays(startDate, 6)
    };
  },

};

// Contre la montre = Parcours avec une limite de temps : à niveau égal, il exige le nombre de bonnes
// réponses de Parcours, Math.ceil(N x pourcentage / 100) (3 / 6 / 10 / 14), jamais moins.
Object.keys(Challenges.CHALLENGE_MODES.speed.rules).forEach(level => {
  const steady = Challenges.CHALLENGE_MODES.steady.rules[level];
  const speed = Challenges.CHALLENGE_MODES.speed.rules[level];
  speed.cardsCount = steady.cardsCount;
  speed.targetCorrect = Math.ceil(steady.cardsCount * steady.minAccuracy / 100);
});

// Le miroir des missions (barre de navigation) suit le joueur courant
Challenges.bindState();

// Export pour tests Node.js
if (typeof module !== 'undefined') {
  module.exports = Challenges;
}
