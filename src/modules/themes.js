/**
 * Module Themes - Gestion des thèmes visuels
 *
 * Gère les thèmes déverrouillables et leur application
 */

const Themes = {
  // ═══════════════════════════════════════════════════════════════
  // CONSTANTES
  // ═══════════════════════════════════════════════════════════════

  THEMES: {
    ocean: {
      id: 'ocean',
      icon: '🌊',
      unlocked: true, // Toujours disponible
      unlockCondition: null
    },
    forest: {
      id: 'forest',
      icon: '🌲',
      unlocked: true, // Débloqué par défaut
      unlockCondition: null
    },
    sunset: {
      id: 'sunset',
      icon: '🌅',
      unlocked: false,
      unlockCondition: { type: 'streak', value: 7 },
    },
    midnight: {
      id: 'midnight',
      icon: '🌙',
      unlocked: false,
      unlockCondition: { type: 'cards', value: 100 },
    },
    sakura: {
      id: 'sakura',
      icon: '🌸',
      unlocked: false,
      unlockCondition: { type: 'accuracy', value: 90, minCards: 50 },
    },
    arctic: {
      id: 'arctic',
      icon: '❄️',
      unlocked: false,
      unlockCondition: { type: 'green_cards', value: 50 },
    },
    neon: {
      id: 'neon',
      icon: '💜',
      unlocked: false,
      unlockCondition: { type: 'challenge_wins', value: 5 },
    },
    gold: {
      id: 'gold',
      icon: '🏆',
      unlocked: false,
      unlockCondition: { type: 'level', value: 20 },
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // FONCTIONS PUBLIQUES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Retourne tous les themes avec leur statut de deblocage
   *
   * @param {Object} player - Le joueur
   * @returns {Array} - Liste des themes avec statut
   */
  getAllThemes(player) {
    return Object.values(this.THEMES).map(theme => ({
      ...theme,
      isUnlocked: this.isThemeUnlocked(theme.id, player)
    }));
  },

  /**
   * Verifie si un theme est debloque pour un joueur
   *
   * @param {string} themeId - ID du theme
   * @param {Object} player - Le joueur
   * @returns {boolean} - true si debloque
   */
  isThemeUnlocked(themeId, player) {
    const theme = this.THEMES[themeId];
    if (!theme) return false;

    // Theme par defaut toujours disponible
    if (theme.unlocked) return true;

    // Verifier dans les themes debloques du joueur
    if (player.unlockedThemes && player.unlockedThemes.includes(themeId)) {
      return true;
    }

    // Verifier la condition de deblocage
    return this._checkUnlockCondition(theme.unlockCondition, player);
  },

  /**
   * Applique un theme a l'interface
   *
   * @param {string} themeId - ID du theme
   */
  applyTheme(themeId) {
    const theme = this.THEMES[themeId];
    if (!theme) {
      themeId = 'ocean'; // Theme par defaut
    }

    document.documentElement.setAttribute('data-theme', themeId);
  },

  /**
   * Recupere le theme actuel du joueur
   *
   * @param {Object} player - Le joueur
   * @returns {string} - ID du theme
   */
  getCurrentTheme(player) {
    return player.settings?.theme || 'ocean';
  },

  /**
   * Change le theme du joueur
   *
   * @param {Object} player - Le joueur
   * @param {string} themeId - ID du nouveau theme
   * @returns {Object} - Joueur mis a jour
   */
  setTheme(player, themeId) {
    if (!this.isThemeUnlocked(themeId, player)) {
      return player; // Theme non debloque
    }

    const updated = {
      ...player,
      settings: {
        ...(player.settings || {}),
        theme: themeId
      }
    };

    this.applyTheme(themeId);
    return updated;
  },

  // ═══════════════════════════════════════════════════════════════
  // FONCTIONS PRIVÉES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Verifie une condition de deblocage
   *
   * @private
   * @param {Object} condition - Condition a verifier
   * @param {Object} player - Le joueur
   * @returns {boolean} - true si condition remplie
   */
  _checkUnlockCondition(condition, player) {
    if (!condition) return false;

    const stats = player.stats || {};

    switch (condition.type) {
      case 'level':
        const level = typeof XP !== 'undefined' ? XP.calculateLevel(stats.totalXP || 0) : 1;
        return level >= condition.value;

      case 'streak':
        return (stats.longestStreak || 0) >= condition.value;

      case 'cards':
        return (stats.totalCardsPlayed || 0) >= condition.value;

      case 'accuracy':
        // Necessite un historique de precision
        if ((stats.totalCardsPlayed || 0) < (condition.minCards || 0)) return false;
        const accuracy = stats.totalCardsPlayed > 0
          ? ((stats.totalCorrectAnswers || 0) / stats.totalCardsPlayed) * 100
          : 0;
        return accuracy >= condition.value;

      case 'green_cards':
        return (stats.totalGreenCards || 0) >= condition.value;

      case 'challenge_wins':
        return (stats.challengeWins || 0) >= condition.value;

      default:
        return false;
    }
  }
};

// Libellés (name, description, unlockText) : clés i18n theme.<id>.name|description|unlock,
// résolues à chaque lecture pour suivre la langue du joueur sans rechargement.
Object.values(Themes.THEMES).forEach((theme) => {
  const label = (field, suffix) => Object.defineProperty(theme, field, {
    get() { return typeof t === 'function' ? t(`theme.${theme.id}.${suffix}`) : theme.id; },
    enumerable: true,
    configurable: true
  });
  label('name', 'name');
  label('description', 'description');
  if (theme.unlockCondition) label('unlockText', 'unlock');
});

// Export pour tests Node.js
if (typeof module !== 'undefined') {
  module.exports = Themes;
}
