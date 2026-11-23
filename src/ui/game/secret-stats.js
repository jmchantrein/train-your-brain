/**
 * Secret Stats Tracker - Suivi des statistiques pour badges secrets
 *
 * Gère le tracking de :
 * - Chouette du soir (night_owl) : sessions entre 18h et 21h
 * - Lève-tôt (early_bird) : sessions entre 6h et 8h
 * - Golden Hour : réponse donnée à 12:34 (voir trackCardTime)
 * - Perfect Session : 100% avec 10+ cartes
 * - Weekend Warrior : weekends consécutifs complets
 * - Comeback Kid : retour après longue absence
 *
 * Dépendances: TextUtils (jour calendaire local)
 */

const GameSecretStats = {
  /**
   * Enregistre les statistiques secrètes après une session
   * @param {Object} player - Joueur
   * @param {Object} session - Session terminée
   */
  track(player, session) {
    const now = new Date();

    this._trackTimeBased(player, now);
    this._trackSessionPerformance(player, session);
    this._trackWeekend(player, now);
    this._trackAbsence(player, now, session && session.previousPlayedAt);
  },

  /**
   * Track l'heure d'une réponse (appelé à chaque carte) : Golden Hour à 12:34
   * @param {Object} player - Joueur
   * @param {Date} [now] - Date de la réponse (défaut : maintenant)
   */
  trackCardTime(player, now = new Date()) {
    if (now.getHours() === 12 && now.getMinutes() === 34) {
      player.stats.goldenHourPlayed = true;
    }
  },

  /**
   * Track les stats basées sur l'heure
   * @param {Object} player - Joueur
   * @param {Date} now - Date actuelle
   */
  _trackTimeBased(player, now) {
    const hour = now.getHours();
    const minutes = now.getMinutes();

    // Chouette du soir (night_owl) : jouer entre 18h et 21h. Plus de plage nocturne : la
    // gamification ne doit pas encourager les enfants à jouer la nuit.
    if (hour >= 18 && hour < 21) {
      player.stats.nightSessions = (player.stats.nightSessions || 0) + 1;
    }

    // Lève-tôt (early_bird) : jouer entre 6h et 8h (plus de réveil avant 6h)
    if (hour >= 6 && hour < 8) {
      player.stats.earlySessions = (player.stats.earlySessions || 0) + 1;
    }

    // Golden Hour: played exactly at 12:34
    if (hour === 12 && minutes === 34) {
      player.stats.goldenHourPlayed = true;
    }
  },

  /**
   * Track les performances de session
   * @param {Object} player - Joueur
   * @param {Object} session - Session
   */
  _trackSessionPerformance(player, session) {
    // Perfect session: 100% accuracy with min 10 cards
    if (session.stats.cardsPlayed >= 10 &&
        session.stats.correctAnswers === session.stats.cardsPlayed) {
      player.stats.perfectSessions = (player.stats.perfectSessions || 0) + 1;
    }

    // Longest session (max cards in one session)
    if (session.stats.cardsPlayed > (player.stats.longestSession || 0)) {
      player.stats.longestSession = session.stats.cardsPlayed;
    }
  },

  /**
   * Track les weekends pour Weekend Warrior
   * @param {Object} player - Joueur
   * @param {Date} now - Date actuelle
   */
  _trackWeekend(player, now) {
    const dayOfWeek = now.getDay();

    // Vérifier si c'est le weekend (0 = dimanche, 6 = samedi)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      return;
    }

    if (!player.stats.weekendWeeks) {
      player.stats.weekendWeeks = {};
    }
    this._migrateWeekendKeys(player, now);

    const weekKey = this._getWeekKey(now);

    if (!player.stats.weekendWeeks[weekKey]) {
      player.stats.weekendWeeks[weekKey] = { sat: false, sun: false };
    }

    if (dayOfWeek === 6) {
      player.stats.weekendWeeks[weekKey].sat = true;
    }
    if (dayOfWeek === 0) {
      player.stats.weekendWeeks[weekKey].sun = true;
    }

    // Compter les weekends complets consécutifs
    this._updateWeekendStreak(player);
  },

  /**
   * Track l'absence pour Comeback Kid
   *
   * `previousPlayedAt` est la date de dernière activité AVANT la session (mémorisée par
   * GameSessionManager sur la session) : stats.lastPlayedAt est déjà réécrit par les cartes
   * de la session en cours. L'absence est un nombre de jours calendaires locaux.
   *
   * @param {Object} player - Joueur
   * @param {Date} now - Date actuelle
   * @param {string|null} [previousPlayedAt] - ISO de la dernière activité avant la session
   */
  _trackAbsence(player, now, previousPlayedAt) {
    if (!previousPlayedAt) return;

    const previous = new Date(previousPlayedAt);
    if (isNaN(previous.getTime())) return;

    const daysSince = TextUtils.daysBetween(
      TextUtils.getLocalDateString(previous),
      TextUtils.getLocalDateString(now)
    );
    if (daysSince > (player.stats.longestAbsence || 0)) {
      player.stats.longestAbsence = daysSince;
    }
  },

  /**
   * Calcule l'année et le numéro de semaine ISO
   * @param {Date} date - Date
   * @returns {{ year: number, week: number }} Année ISO et semaine (1-53)
   */
  _getIsoWeek(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return {
      year: d.getUTCFullYear(),
      week: Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
    };
  },

  /**
   * Calcule le numéro de semaine ISO
   * @param {Date} date - Date
   * @returns {number} Numéro de semaine
   */
  _getWeekNumber(date) {
    return this._getIsoWeek(date).week;
  },

  /**
   * Clé de semaine qualifiée par l'année ISO ("2026-W01") : évite que les semaines
   * 52, 53, 1, 2 d'un passage d'année paraissent non consécutives
   * @param {Date} date - Date
   * @returns {string} Clé "YYYY-Www"
   */
  _getWeekKey(date) {
    const { year, week } = this._getIsoWeek(date);
    return `${year}-W${String(week).padStart(2, '0')}`;
  },

  /**
   * Rang absolu d'une semaine (deux semaines consécutives ont des rangs consécutifs)
   * @param {string} key - Clé "YYYY-Www"
   * @returns {number} Rang
   */
  _weekKeyToOrdinal(key) {
    const [yearStr, weekStr] = key.split('-W');
    const jan4 = new Date(Date.UTC(Number(yearStr), 0, 4));
    const jan4Day = jan4.getUTCDay() || 7;
    const mondayOfWeek1 = Date.UTC(Number(yearStr), 0, 4 - (jan4Day - 1));
    const mondayMs = mondayOfWeek1 + (Number(weekStr) - 1) * 7 * 86400000;
    return Math.round((mondayMs / 86400000 - 4) / 7); // le 1er janvier 1970 était un jeudi
  },

  /**
   * Convertit les anciennes clés numériques (semaine ISO sans année) en clés qualifiées
   * Les semaines postérieures à la semaine courante sont attribuées à l'année précédente.
   * Aucune donnée n'est perdue (fusion des drapeaux si la clé existe déjà).
   * @param {Object} player - Joueur
   * @param {Date} now - Date actuelle
   */
  _migrateWeekendKeys(player, now) {
    const weeks = player.stats.weekendWeeks;
    const current = this._getIsoWeek(now);

    Object.keys(weeks).forEach(key => {
      if (!/^\d+$/.test(key)) return;
      const week = Number(key);
      const year = week <= current.week ? current.year : current.year - 1;
      const newKey = `${year}-W${String(week).padStart(2, '0')}`;
      const legacy = weeks[key];
      const existing = weeks[newKey] || { sat: false, sun: false };
      weeks[newKey] = { sat: existing.sat || !!legacy.sat, sun: existing.sun || !!legacy.sun };
      delete weeks[key];
    });
  },

  /**
   * Met à jour le streak de weekends consécutifs
   * @param {Object} player - Joueur
   */
  _updateWeekendStreak(player) {
    if (!player.stats.weekendWeeks) return;

    const weeks = Object.keys(player.stats.weekendWeeks)
      .filter(key => /^\d{4}-W\d{2}$/.test(key))
      .map(key => ({ key, ordinal: this._weekKeyToOrdinal(key) }))
      .sort((a, b) => b.ordinal - a.ordinal); // Plus récent d'abord

    let consecutiveWeeks = 0;

    for (let i = 0; i < weeks.length; i++) {
      const week = player.stats.weekendWeeks[weeks[i].key];

      if (week.sat && week.sun) {
        consecutiveWeeks++;

        // Vérifier si la semaine précédente est consécutive
        if (i < weeks.length - 1 && weeks[i].ordinal - weeks[i + 1].ordinal !== 1) {
          break;
        }
      } else {
        break;
      }
    }

    player.stats.weekendStreakWeeks = consecutiveWeeks;
  }
};

// Export pour Node.js (tests) et navigateur
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameSecretStats;
}
