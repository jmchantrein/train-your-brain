/**
 * Module Badges - Système de badges et accomplissements
 *
 * Gère tous les badges du jeu avec leurs conditions de débloquage
 */

// ═══════════════════════════════════════════════════════════════
// DÉFINITION DES BADGES
// ═══════════════════════════════════════════════════════════════

/**
 * Texte traduit d'un badge : clé i18n badge.<id>.name|description|hint, résolue à chaque lecture
 * (le changement de langue ou de forme grammaticale s'applique sans rechargement).
 * Sans module i18n (chargement isolé), repli sur la clé.
 * @param {string} key - Clé i18n (badge.<id>.name|description|hint)
 * @returns {string}
 */
function _badgeText(key) {
  return typeof t === 'function' ? t(key) : key;
}

const BADGES = [
  // ═══════════════════════════════════════════
  // ACHIEVEMENT - Accomplissements généraux
  // ═══════════════════════════════════════════
  {
    id: 'first_card',
    icon: '🎯',
    category: 'achievement',
    rarity: 'common',
    xpReward: 10,
    condition: (p) => p.stats.totalCardsPlayed >= 1
  },
  {
    id: 'first_session',
    icon: '🚀',
    category: 'achievement',
    rarity: 'common',
    xpReward: 15,
    condition: (p) => p.stats.totalSessions >= 1
  },
  {
    id: 'explorer',
    icon: '🧭',
    category: 'achievement',
    rarity: 'rare',
    xpReward: 30,
    condition: (p) => p.stats.uniqueDecksPlayed >= 5
  },
  {
    id: 'veteran',
    icon: '🎖️',
    category: 'achievement',
    rarity: 'epic',
    xpReward: 75,
    condition: (p) => p.stats.totalSessions >= 50
  },
  {
    id: 'centurion',
    icon: '💯',
    category: 'achievement',
    rarity: 'epic',
    xpReward: 100,
    condition: (p) => p.stats.totalCardsPlayed >= 1000
  },

  // ═══════════════════════════════════════════
  // MASTERY - Cartes maîtrisées
  // ═══════════════════════════════════════════
  {
    id: 'mastery_10',
    icon: '📗',
    category: 'mastery',
    rarity: 'common',
    xpReward: 20,
    condition: (p) => p.stats.totalGreenCards >= 10
  },
  {
    id: 'mastery_50',
    icon: '🐘',
    category: 'mastery',
    rarity: 'rare',
    xpReward: 50,
    condition: (p) => p.stats.totalGreenCards >= 50
  },
  {
    id: 'mastery_100',
    icon: '🎓',
    category: 'mastery',
    rarity: 'epic',
    xpReward: 100,
    condition: (p) => p.stats.totalGreenCards >= 100
  },
  {
    id: 'retention_20',
    icon: '🧠',
    category: 'mastery',
    rarity: 'rare',
    xpReward: 40,
    // Maîtrise durable : compte les cartes dont l'intervalle de révision a atteint 7 jours
    // (récompense la rétention, pas le volume joué)
    condition: (p) => (p.stats.weekRestCards || 0) >= 20
  },
  {
    id: 'durable_75',
    icon: '🧠',
    category: 'mastery',
    rarity: 'epic',
    xpReward: 75,
    condition: (p) => (p.stats.longTermCards || 0) >= 75
  },
  {
    id: 'durable_200',
    icon: '🐘',
    category: 'mastery',
    rarity: 'epic',
    xpReward: 100,
    condition: (p) => (p.stats.longTermCards || 0) >= 200
  },
  {
    id: 'mastery_500',
    icon: '👑',
    category: 'mastery',
    rarity: 'legendary',
    xpReward: 250,
    condition: (p) => p.stats.totalGreenCards >= 500
  },

  // ═══════════════════════════════════════════
  // LEVEL - Progression de niveau
  // ═══════════════════════════════════════════
  {
    id: 'level_5',
    icon: '⭐',
    category: 'level',
    rarity: 'common',
    xpReward: 25,
    condition: (p) => XP.calculateLevel(p.stats.totalXP) >= 5
  },
  {
    id: 'level_10',
    icon: '🌟',
    category: 'level',
    rarity: 'rare',
    xpReward: 50,
    condition: (p) => XP.calculateLevel(p.stats.totalXP) >= 10
  },
  {
    id: 'level_25',
    icon: '💫',
    category: 'level',
    rarity: 'epic',
    xpReward: 100,
    condition: (p) => XP.calculateLevel(p.stats.totalXP) >= 25
  },
  {
    id: 'level_50',
    icon: '✨',
    category: 'level',
    rarity: 'legendary',
    xpReward: 200,
    condition: (p) => XP.calculateLevel(p.stats.totalXP) >= 50
  },

  // ═══════════════════════════════════════════
  // STREAK - Régularité
  // ═══════════════════════════════════════════
  {
    id: 'streak_3',
    icon: '🔥',
    category: 'streak',
    rarity: 'common',
    xpReward: 20,
    condition: (p) => p.stats.currentStreak >= 3
  },
  {
    id: 'streak_7',
    icon: '🔥🔥',
    category: 'streak',
    rarity: 'rare',
    xpReward: 50,
    condition: (p) => p.stats.currentStreak >= 7
  },
  {
    id: 'streak_30',
    icon: '🔥🔥🔥',
    category: 'streak',
    rarity: 'epic',
    xpReward: 150,
    condition: (p) => p.stats.currentStreak >= 30
  },
  {
    id: 'streak_100',
    icon: '🏆',
    category: 'streak',
    rarity: 'legendary',
    xpReward: 500,
    condition: (p) => p.stats.currentStreak >= 100
  },

  // ═══════════════════════════════════════════
  // PERFORMANCE - En session
  // ═══════════════════════════════════════════
  {
    id: 'perfect_session',
    icon: '💯',
    category: 'performance',
    rarity: 'rare',
    xpReward: 40,
    // Évalué uniquement sur une séance terminée (ctx.sessionEnded !== false) : en cours de
    // séance, 10 bonnes réponses ne garantissent pas que la séance finira à 100 %.
    condition: (p, s, ctx) => !!s && !(ctx && ctx.sessionEnded === false) &&
                              s.stats.cardsPlayed >= 10 &&
                              s.stats.correctAnswers === s.stats.cardsPlayed
  },
  {
    id: 'green_streak_5',
    icon: '💚',
    category: 'performance',
    rarity: 'common',
    xpReward: 15,
    condition: (p, s) => s && s.stats.maxGreenStreak >= 5
  },
  {
    id: 'green_streak_10',
    icon: '💚💚',
    category: 'performance',
    rarity: 'rare',
    xpReward: 35,
    condition: (p, s) => s && s.stats.maxGreenStreak >= 10
  },
  {
    id: 'green_streak_20',
    icon: '🤖',
    category: 'performance',
    rarity: 'epic',
    xpReward: 75,
    condition: (p, s) => s && s.stats.maxGreenStreak >= 20
  },
  {
    id: 'speed_demon',
    icon: '⚡',
    category: 'performance',
    rarity: 'rare',
    xpReward: 30,
    // fastestCorrectAnswer vaut null/Infinity tant qu'aucune bonne réponse n'a été mesurée
    condition: (p) => typeof p.stats.fastestCorrectAnswer === 'number' && p.stats.fastestCorrectAnswer < 1000
  },

  // ═══════════════════════════════════════════
  // SUBJECT - Par matière
  // ═══════════════════════════════════════════
  {
    id: 'math_beginner',
    icon: '🔢',
    category: 'subject',
    rarity: 'common',
    xpReward: 20,
    condition: (p) => Badges.countMastered(p, 'maths') >= 10
  },
  {
    id: 'math_expert',
    icon: '🧮',
    category: 'subject',
    rarity: 'epic',
    xpReward: 100,
    condition: (p) => Badges.countMastered(p, 'maths') >= 100
  },
  {
    id: 'french_beginner',
    icon: '📝',
    category: 'subject',
    rarity: 'common',
    xpReward: 20,
    condition: (p) => Badges.countMastered(p, 'francais') >= 10
  },
  {
    id: 'french_expert',
    icon: '📖',
    category: 'subject',
    rarity: 'epic',
    xpReward: 100,
    condition: (p) => Badges.countMastered(p, 'francais') >= 100
  },
  {
    id: 'history_beginner',
    icon: '📜',
    category: 'subject',
    rarity: 'common',
    xpReward: 20,
    condition: (p) => Badges.countMastered(p, 'histoire') >= 10
  },
  {
    id: 'science_beginner',
    icon: '🔬',
    category: 'subject',
    rarity: 'common',
    xpReward: 20,
    condition: (p) => Badges.countMastered(p, 'sciences') >= 10
  },

  // ═══════════════════════════════════════════
  // SECRET - Badges cachés (hidden: true)
  // ═══════════════════════════════════════════
  {
    id: 'night_owl',
    // Plage de soirée raisonnable (18h-21h) : ne pousse pas les enfants à jouer la nuit.
    // L'identifiant est conservé : qui avait déjà le badge le garde.
    icon: '🦉',
    category: 'secret',
    rarity: 'common',
    xpReward: 20,
    hidden: true,
    condition: (p) => p.stats.nightSessions >= 1
  },
  {
    id: 'early_bird',
    icon: '🐦',
    category: 'secret',
    rarity: 'rare',
    xpReward: 50,
    hidden: true,
    condition: (p) => p.stats.earlySessions >= 1
  },
  {
    id: 'comeback_kid',
    icon: '🔄',
    category: 'secret',
    rarity: 'epic',
    xpReward: 100,
    hidden: true,
    condition: (p) => p.stats.longestAbsence >= 30
  },
  {
    id: 'perfectionist',
    icon: '💎',
    category: 'secret',
    rarity: 'epic',
    xpReward: 150,
    hidden: true,
    condition: (p) => (p.stats.perfectSessions || 0) >= 10
  },
  {
    id: 'speed_runner',
    icon: '🏎️',
    category: 'secret',
    rarity: 'epic',
    xpReward: 100,
    hidden: true,
    condition: (p) => (p.stats.fastAnswers || 0) >= 50
  },
  {
    id: 'marathon',
    icon: '🏃',
    category: 'secret',
    rarity: 'legendary',
    xpReward: 200,
    hidden: true,
    condition: (p) => (p.stats.longestSession || 0) >= 100
  },
  {
    id: 'collector',
    icon: '🗃️',
    category: 'secret',
    rarity: 'epic',
    xpReward: 100,
    hidden: true,
    condition: (p) => (p.stats.uniqueDecksPlayed || 0) >= 20
  },
  {
    id: 'redemption',
    icon: '🔱',
    category: 'secret',
    rarity: 'rare',
    xpReward: 75,
    hidden: true,
    condition: (p) => (p.stats.redemptionCards || 0) >= 1
  },
  {
    id: 'challenger',
    icon: '🎪',
    category: 'secret',
    rarity: 'epic',
    xpReward: 100,
    hidden: true,
    condition: (p) => (p.stats.expertChallengeWins || 0) >= 1
  },
  {
    id: 'untouchable',
    icon: '🛡️',
    category: 'secret',
    rarity: 'legendary',
    xpReward: 200,
    hidden: true,
    condition: (p) => p.stats.perfectChallengeComplete === true
  },
  {
    id: 'weekend_warrior',
    icon: '⚔️',
    category: 'secret',
    rarity: 'rare',
    xpReward: 75,
    hidden: true,
    condition: (p) => (p.stats.weekendStreakWeeks || 0) >= 4
  },
  {
    id: 'golden_hour',
    icon: '🌅',
    category: 'secret',
    rarity: 'legendary',
    xpReward: 150,
    hidden: true,
    condition: (p) => p.stats.goldenHourPlayed === true
  }
];

// Libellés : définis ici en getters sur les clés i18n, pour tous les badges qui n'ont pas
// de libellé littéral (un badge ajouté avec un `name` écrit en dur est laissé tel quel).
BADGES.forEach((badge) => {
  const label = (field) => {
    if (Object.prototype.hasOwnProperty.call(badge, field)) return;
    Object.defineProperty(badge, field, {
      get() { return _badgeText(`badge.${badge.id}.${field}`); },
      enumerable: true,
      configurable: true
    });
  };
  label('name');
  label('description');
  if (badge.hidden) label('hint');
});


// ═══════════════════════════════════════════════════════════════
// API DU MODULE BADGES
// ═══════════════════════════════════════════════════════════════

const Badges = {
  /**
   * Liste complète des badges
   */
  ALL: BADGES,

  /**
   * Matières des badges de matière et leurs alias de tags (après normalisation :
   * minuscules, sans accents). Source unique pour le suivi et les conditions.
   */
  SUBJECTS: {
    maths: ['maths', 'math', 'mathematiques', 'mathematique', 'mathematics'],
    francais: ['francais', 'french'],
    histoire: ['histoire', 'history'],
    sciences: ['sciences', 'science']
  },

  /**
   * Repos (en jours) à partir duquel une carte compte comme « mémoire d'une semaine »
   * (badge retention_20, compteur `weekRestCards`)
   */
  WEEK_REST_DAYS: 7,

  /**
   * Repos (en jours) à partir duquel une carte compte comme « mémoire durable »
   * (badges durable_75 et durable_200, compteur `longTermCards`)
   */
  LONG_TERM_REST_DAYS: 14,

  /**
   * Nombre maximal de cartes mémorisées par matière (le plus grand seuil de badge de
   * matière est 100) : borne la taille des données du joueur.
   */
  MASTERED_CAP: 100,

  /**
   * Matières (clés de SUBJECTS) auxquelles appartient un deck
   *
   * Lit `tags` puis `category`. Un deck de maths ne compte pas pour les sciences, même s'il
   * porte aussi le tag « sciences » (parent générique) : la matière la plus précise l'emporte.
   *
   * @param {Object} deck - Deck (tags ou category)
   * @returns {string[]} Clés de matières, ex. ['maths']
   */
  getSubjectsForDeck(deck) {
    const raw = (deck && (deck.tags || deck.category)) || [];
    const tags = (Array.isArray(raw) ? raw : [raw])
      .filter(t => typeof t === 'string')
      .map(t => TextUtils.normalizeText(t));
    const subjects = Object.keys(this.SUBJECTS).filter(subject =>
      this.SUBJECTS[subject].some(alias => tags.includes(alias))
    );
    return subjects.includes('maths') ? subjects.filter(s => s !== 'sciences') : subjects;
  },

  /**
   * Nombre de cartes distinctes maîtrisées (passées en boîte verte) dans une matière
   *
   * @param {Object} player - Joueur
   * @param {string} subject - Clé de matière (maths, francais, histoire, sciences)
   * @returns {number} Nombre de cartes distinctes
   */
  countMastered(player, subject) {
    const list = player && player.stats && player.stats.masteredBySubject
      && player.stats.masteredBySubject[subject];
    return Array.isArray(list) ? list.length : 0;
  },

  /**
   * Obtenir un badge par son ID
   *
   * @param {string} id - ID du badge
   * @returns {Object|undefined} - Badge ou undefined si non trouvé
   *
   * @example
   * Badges.get('first_card') // → { id: 'first_card', name: 'Premier Pas', ... }
   * Badges.get('invalid') // → undefined
   */
  get(id) {
    return BADGES.find(b => b.id === id);
  },

  /**
   * Filtrer les badges par catégorie
   *
   * @param {string} category - Catégorie ('achievement'|'mastery'|'level'|'performance'|'streak'|'subject')
   * @returns {Array} - Liste des badges de cette catégorie
   *
   * @example
   * Badges.getByCategory('achievement') // → [{ id: 'first_card', ... }, ...]
   */
  getByCategory(category) {
    return BADGES.filter(b => b.category === category);
  },

  /**
   * Filtrer les badges par rareté
   *
   * @param {string} rarity - Rareté ('common'|'rare'|'epic'|'legendary')
   * @returns {Array} - Liste des badges de cette rareté
   *
   * @example
   * Badges.getByRarity('legendary') // → [{ id: 'mastery_500', ... }, ...]
   */
  getByRarity(rarity) {
    return BADGES.filter(b => b.rarity === rarity);
  },

  /**
   * Vérifier les badges nouvellement débloqués
   *
   * @param {Object} player - Objet joueur
   * @param {Object} [session=null] - Session en cours (optionnel, pour badges performance)
   * @param {Object} [context={}] - Contexte : `sessionEnded: false` pendant une séance
   *   (les badges qui exigent une séance terminée, comme perfect_session, ne sont alors
   *   pas évalués)
   * @returns {Array} - Liste des nouveaux badges débloqués
   *
   * Note : Ne retourne QUE les badges pas encore dans player.badges
   *
   * @example
   * const player = { badges: [], stats: { totalCardsPlayed: 1 } };
   * Badges.checkUnlocked(player) // → [{ id: 'first_card', ... }]
   *
   * const session = { stats: { maxGreenStreak: 5 } };
   * Badges.checkUnlocked(player, session) // → [{ id: 'green_streak_5', ... }]
   */
  checkUnlocked(player, session = null, context = {}) {
    const newBadges = [];

    for (const badge of BADGES) {
      // Déjà débloqué ?
      if (player.badges.includes(badge.id)) continue;

      // Condition remplie ?
      try {
        if (badge.condition(player, session, context)) {
          newBadges.push(badge);
        }
      } catch (error) {
        // Si une condition échoue, on l'ignore silencieusement
        // (ex: si une propriété est manquante dans player.stats)
        continue;
      }
    }

    return newBadges;
  },

  /**
   * Recalculer tous les badges débloqués
   *
   * @param {Object} player - Objet joueur
   * @returns {Array} - Liste des IDs de tous les badges débloqués
   *
   * Note : Utile au chargement pour synchroniser player.badges avec les stats
   * N'utilise PAS la session (session = null)
   *
   * @example
   * const player = { stats: { totalCardsPlayed: 100, totalSessions: 5 } };
   * Badges.recalculateAll(player) // → ['first_card', 'first_session', ...]
   */
  recalculateAll(player) {
    const unlocked = [];

    for (const badge of BADGES) {
      try {
        // Pas de session pour le recalcul complet
        if (badge.condition(player, null)) {
          unlocked.push(badge.id);
        }
      } catch (error) {
        // Ignorer les erreurs (propriétés manquantes, etc.)
        continue;
      }
    }

    return unlocked;
  },

  /**
   * Obtenir les statistiques des badges du joueur
   *
   * @param {Object} player - Objet joueur
   * @returns {Object} - Statistiques { total, unlocked, byCategory, byRarity }
   *
   * @example
   * const stats = Badges.getStats(player);
   * // {
   * //   total: 29,
   * //   unlocked: 5,
   * //   byCategory: {
   * //     achievement: { total: 5, unlocked: 2 },
   * //     mastery: { total: 4, unlocked: 1 },
   * //     ...
   * //   },
   * //   byRarity: {
   * //     common: { total: 12, unlocked: 3 },
   * //     rare: { total: 8, unlocked: 1 },
   * //     ...
   * //   }
   * // }
   */
  getStats(player) {
    const total = BADGES.length;
    const unlocked = player.badges.length;
    const byCategory = {};
    const byRarity = {};
    let hiddenTotal = 0;
    let hiddenUnlocked = 0;

    for (const badge of BADGES) {
      // Compteur badges cachés
      if (badge.hidden) {
        hiddenTotal++;
        if (player.badges.includes(badge.id)) {
          hiddenUnlocked++;
        }
      }

      // Par catégorie
      if (!byCategory[badge.category]) {
        byCategory[badge.category] = { total: 0, unlocked: 0 };
      }
      byCategory[badge.category].total++;
      if (player.badges.includes(badge.id)) {
        byCategory[badge.category].unlocked++;
      }

      // Par rareté
      if (!byRarity[badge.rarity]) {
        byRarity[badge.rarity] = { total: 0, unlocked: 0 };
      }
      byRarity[badge.rarity].total++;
      if (player.badges.includes(badge.id)) {
        byRarity[badge.rarity].unlocked++;
      }
    }

    return {
      total,
      unlocked,
      byCategory,
      byRarity,
      hidden: {
        total: hiddenTotal,
        unlocked: hiddenUnlocked
      }
    };
  }
};

// Export pour tests Node.js
if (typeof module !== 'undefined') {
  module.exports = Badges;
}
