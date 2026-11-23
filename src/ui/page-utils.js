/**
 * PageUtils - Utilitaires partagés entre les pages
 *
 * Ce fichier contient les fonctions communes utilisées par plusieurs pages.
 * Doit être chargé APRÈS pages-base.js et AVANT les fichiers page-*.js
 *
 * Dépendances: Storage, State, Router, App, Leitner
 */

const PageUtils = {
  // ═══════════════════════════════════════════════════════════════
  // COMMON UTILITIES (DRY)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Retourne une fonction de traduction avec fallback
   * @returns {Function} Fonction de traduction
   */
  getTranslator() {
    return typeof t !== 'undefined' ? t : (k) => k;
  },

  /**
   * Récupère les IDs des decks personnalisés et masqués, et filtre les decks visibles
   * @param {Array} decks - Liste des decks
   * @returns {Object} { customDeckIds, hiddenDeckIds, visibleDecks, hiddenDecks }
   */
  getProcessedDecks(decks = []) {
    const customDeckIds = Storage.loadCustomDecks().map(d => d.id);
    const hiddenDeckIds = Storage.getHiddenDecks();
    const visibleDecks = decks.filter(d => !hiddenDeckIds.includes(d.id));
    const hiddenDecks = decks.filter(d => hiddenDeckIds.includes(d.id));
    return { customDeckIds, hiddenDeckIds, visibleDecks, hiddenDecks };
  },

  /**
   * Rend le footer standard avec playerBar et navbar
   * @param {Object} player - Données du joueur
   * @param {string} activeRoute - Route active pour la navbar
   * @returns {string} HTML du footer
   */
  renderFooter(player, activeRoute) {
    return `
      <footer class="page__footer" role="navigation" aria-label="${i18n.t('nav.main')}">
        <div class="page__footer-inner">
          ${Components.navbar.render({ activeRoute })}
          ${Components.playerBar.render({ player })}
        </div>
      </footer>
    `;
  },

  /**
   * Bind les événements du footer (playerBar menu)
   * À appeler après le mount de chaque page
   * @param {HTMLElement} container - Conteneur de la page
   */
  bindFooter(container) {
    if (typeof Components !== 'undefined' && Components.playerBar && Components.playerBar.bind) {
      Components.playerBar.bind(container);
    }

    // Active la navigation fléchée sur la navbar
    if (typeof A11y !== 'undefined' && A11y.setupNavbarArrowNav) {
      A11y.setupNavbarArrowNav();
    }

    // Active la navigation fléchée sur le menu du player bar
    const playerMenu = container.querySelector('.player-bar__menu');
    if (playerMenu && typeof A11y !== 'undefined' && A11y.setupMenuArrowNav) {
      A11y.setupMenuArrowNav(playerMenu);
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // DATE UTILITIES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Retourne la date du jour au format YYYY-MM-DD
   * Délègue à TextUtils.getToday() pour conformité DRY
   * @returns {string}
   */
  getToday() {
    return TextUtils.getToday();
  },

  /**
   * Calcule le nombre de jours entre deux dates
   * @param {string} dateFrom - Date de départ (YYYY-MM-DD)
   * @param {string} dateTo - Date de fin (YYYY-MM-DD)
   * @returns {number}
   */
  daysBetween(dateFrom, dateTo) {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    return Math.ceil((to - from) / (1000 * 60 * 60 * 24));
  },

  // ═══════════════════════════════════════════════════════════════
  // DECK UTILITIES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Calcule les statistiques d'un deck
   * @param {Object} deck - Le deck à analyser
   * @param {string} [today] - Date du jour (YYYY-MM-DD)
   * @returns {Object} Statistiques du deck
   */
  getDeckStats(deck, today = null) {
    today = today || this.getToday();

    // Support pour les decks multilingues (words au lieu de cards)
    if (deck.type === 'multilingual' && Array.isArray(deck.words)) {
      return this._getMultilingualDeckStats(deck, today);
    }

    const cards = deck.cards || [];
    const total = cards.length;

    const counts = {
      never_played: 0,
      purple: 0,
      orange: 0,
      green: 0
    };

    cards.forEach(card => {
      const box = card.box || 'never_played';
      if (counts.hasOwnProperty(box)) {
        counts[box]++;
      }
    });

    const playableCards = cards.filter(card => Leitner.isCardPlayable(card, today));
    const isMastered = counts.green === total && playableCards.length === 0;

    // Calculer les infos de repos pour les decks verts
    let restInfo = null;
    if (playableCards.length === 0 && counts.green > 0) {
      const greenCards = cards.filter(c => c.box === 'green' && c.restUntil);
      if (greenCards.length > 0) {
        const earliestRest = greenCards.map(c => c.restUntil).sort()[0];
        if (earliestRest > today) {
          restInfo = {
            date: earliestRest,
            days: this.daysBetween(today, earliestRest)
          };
        }
      }
    }

    return {
      total,
      counts,
      playableCount: playableCards.length,
      playableCards,
      isMastered,
      restInfo
    };
  },

  /**
   * Calcule les statistiques d'un deck multilingue
   * @private
   * @param {Object} deck - Le deck multilingue à analyser
   * @param {string} today - Date du jour (YYYY-MM-DD)
   * @returns {Object} Statistiques du deck
   */
  _getMultilingualDeckStats(deck, today) {
    const words = deck.words || [];

    // Compter le nombre total de "cartes" (mots × directions)
    // Chaque mot peut avoir plusieurs directions d'apprentissage
    let total = 0;
    const counts = { never_played: 0, purple: 0, orange: 0, green: 0 };
    let playableCount = 0;

    words.forEach(word => {
      const progress = word.progress || {};
      // Compter chaque direction comme une "carte"
      Object.keys(progress).forEach(direction => {
        total++;
        const dirProgress = progress[direction] || {};
        const box = dirProgress.box || 'never_played';
        if (counts.hasOwnProperty(box)) {
          counts[box]++;
        }
        // Une direction est jouable si elle n'est pas en repos
        if (box !== 'green' || !dirProgress.restUntil || dirProgress.restUntil <= today) {
          playableCount++;
        }
      });
    });

    // Si aucune progression n'existe encore, compter les mots comme base
    if (total === 0 && words.length > 0) {
      total = words.length;
      counts.never_played = words.length;
      playableCount = words.length;
    }

    const isMastered = counts.green === total && playableCount === 0;

    return {
      total,
      counts,
      playableCount,
      playableCards: [], // Non utilisé pour multilingue
      isMastered,
      restInfo: null,
      isMultilingual: true
    };
  }
};

// Export pour tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PageUtils };
}
