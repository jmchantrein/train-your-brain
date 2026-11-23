/**
 * Page Home - Hub principal
 *
 * Dépendances: Pages (pages-base.js), PageUtils, Components, State, Router, Storage, Tutorial
 */

// ═══════════════════════════════════════════════════════════════
// HOME - Hub principal
// ═══════════════════════════════════════════════════════════════

Pages.home = {
  render(state) {
    const { player, decks = [] } = state;
    const today = PageUtils.getToday();
    const _t = PageUtils.getTranslator();
    const { customDeckIds, visibleDecks } = PageUtils.getProcessedDecks(decks);
    const hiddenDeckIds = typeof Storage !== 'undefined' ? Storage.getHiddenDecks() : [];
    const allowBuiltinDeletion = player?.settings?.allowBuiltinDeckDeletion || false;

    // Filtrer les decks à réviser (déjà joués ET avec des cartes jouables)
    const playableDecks = visibleDecks.filter(deck => {
      const stats = PageUtils.getDeckStats(deck, today);
      const hasBeenPlayed = stats.counts.never_played < stats.total;
      return hasBeenPlayed && stats.playableCount > 0;
    }).slice(0, 5);

    // Filtrer les decks au repos (déjà joués, pas de cartes jouables, en repos)
    const restingDecks = visibleDecks.filter(deck => {
      const stats = PageUtils.getDeckStats(deck, today);
      const hasBeenPlayed = stats.counts.never_played < stats.total;
      return hasBeenPlayed && stats.playableCount === 0 && stats.restInfo !== null;
    }).slice(0, 5);

    // Calculer le prochain temps de révision si tous les decks sont au repos
    const nextReviewInfo = this._getNextReviewInfo(visibleDecks, today);
    const showComeBackMessage = playableDecks.length === 0 && restingDecks.length > 0;

    return `
      <div class="page page--home">
        <h1 class="sr-only">${_t('nav.home')}</h1>
        <main class="page__content" id="main-content" role="main">
          ${showComeBackMessage ? this._renderComeBackMessage(nextReviewInfo, _t) : ''}

          <section class="home__section">
            <h2 class="home__section-title">📚 ${_t('home.decksToReview')}</h2>
            <div class="home__decks" id="playable-decks">
              ${DeckTable.render(playableDecks, { today, customDeckIds, hiddenDeckIds, allowBuiltinDeletion })}
            </div>
            ${visibleDecks.length > 5 ? `
              <a href="#/explore" class="home__view-all">${_t('home.viewAllDecks')} →</a>
            ` : ''}
          </section>

          ${restingDecks.length > 0 ? `
            <section class="home__section home__section--resting">
              <h2 class="home__section-title">😴 ${_t('home.decksResting')}</h2>
              <div class="home__decks home__decks--resting" id="resting-decks">
                ${DeckTable.render(restingDecks, { today, customDeckIds, hiddenDeckIds, allowBuiltinDeletion })}
              </div>
            </section>
          ` : ''}
        </main>

        ${PageUtils.renderFooter(player, 'home')}
      </div>
    `;
  },

  mount(container, state) {
    container.innerHTML = this.render(state);

    // Helper pour re-render une section de table après tri ou filtrage
    const rebindTable = (tableContainer, decks, options) => {
      if (!tableContainer) return;
      const today = PageUtils.getToday();
      const { customDeckIds } = PageUtils.getProcessedDecks(state.decks || []);
      const hiddenDeckIds = typeof Storage !== 'undefined' ? Storage.getHiddenDecks() : [];
      const allowBuiltinDeletion = state.player?.settings?.allowBuiltinDeckDeletion || false;
      tableContainer.innerHTML = DeckTable.render(decks, { today, customDeckIds, hiddenDeckIds, allowBuiltinDeletion, ...options });
      DeckTable.bind(tableContainer, {
        onSort: () => rebindTable(tableContainer, decks, options),
        onSourceFilter: () => rebindTable(tableContainer, decks, options)
      });
    };

    // Alias pour compatibilité
    const rebindTableWithSort = rebindTable;

    // Bind DeckTable events avec callback de tri et filtrage par source
    const playableContainer = container.querySelector('#playable-decks');
    if (playableContainer) {
      const { visibleDecks } = PageUtils.getProcessedDecks(state.decks || []);
      const today = PageUtils.getToday();
      const playableDecks = visibleDecks.filter(deck => {
        const stats = PageUtils.getDeckStats(deck, today);
        const hasBeenPlayed = stats.counts.never_played < stats.total;
        return hasBeenPlayed && stats.playableCount > 0;
      }).slice(0, 5);
      DeckTable.bind(playableContainer, {
        onSort: () => rebindTable(playableContainer, playableDecks),
        onSourceFilter: () => rebindTable(playableContainer, playableDecks)
      });
    }

    const restingContainer = container.querySelector('#resting-decks');
    if (restingContainer) {
      const { visibleDecks } = PageUtils.getProcessedDecks(state.decks || []);
      const today = PageUtils.getToday();
      const restingDecks = visibleDecks.filter(deck => {
        const stats = PageUtils.getDeckStats(deck, today);
        const hasBeenPlayed = stats.counts.never_played < stats.total;
        return hasBeenPlayed && stats.playableCount === 0 && stats.restInfo !== null;
      }).slice(0, 5);
      DeckTable.bind(restingContainer, {
        onSort: () => rebindTable(restingContainer, restingDecks),
        onSourceFilter: () => rebindTable(restingContainer, restingDecks)
      });
    }

    // Déclencher le tutoriel pour les nouveaux utilisateurs
    if (typeof Tutorial !== 'undefined' && Tutorial.shouldShow(state.player)) {
      setTimeout(() => {
        Tutorial.start();
      }, 500);
    }
  },

  /**
   * Calcule la date de la prochaine révision disponible
   * @private
   */
  _getNextReviewInfo(decks, today) {
    let nearestDate = null;
    let nearestDay = null; // jour de repos tel qu'enregistré (AAAA-MM-JJ), sans conversion de fuseau

    for (const deck of decks) {
      const cards = deck.cards || [];
      for (const card of cards) {
        if (card.box === 'green' && card.restUntil) {
          const restDate = new Date(card.restUntil);
          const todayDate = new Date(today);

          if (restDate > todayDate) {
            if (!nearestDate || restDate < nearestDate) {
              nearestDate = restDate;
              nearestDay = String(card.restUntil).slice(0, 10);
            }
          }
        }
      }
    }

    if (!nearestDate) return null;

    const todayDate = new Date(today);
    const diffTime = nearestDate - todayDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

    return {
      date: nearestDay,
      days: diffDays,
      hours: diffHours
    };
  },

  /**
   * Rend le message "Reviens demain"
   * @private
   */
  _renderComeBackMessage(nextReviewInfo, _t) {
    let timeText = '';

    if (nextReviewInfo) {
      if (nextReviewInfo.days <= 1) {
        timeText = `${nextReviewInfo.hours} ${nextReviewInfo.hours > 1 ? _t('home.hours') : _t('home.hour')}`;
      } else {
        timeText = `${nextReviewInfo.days} ${nextReviewInfo.days > 1 ? _t('home.days') : _t('home.day')}`;
      }
    }

    return `
      <section class="home__section home__section--comeback">
        <div class="home__comeback-card">
          <span class="home__comeback-icon" aria-hidden="true">🌙</span>
          <h2 class="home__comeback-title">${_t('home.comeBackTomorrow')}</h2>
          ${timeText ? `
            <p class="home__comeback-info">
              ${_t('home.comeBackIn')} <strong>${timeText}</strong>
            </p>
          ` : ''}
          <p class="home__comeback-suggestion">
            ${_t('home.waitingSuggestion')}
          </p>
          <div class="home__comeback-actions">
            <a href="#/explore" class="btn btn--secondary">📚 ${_t('nav.explore')}</a>
            <a href="#/stats" class="btn btn--secondary">📊 ${_t('nav.stats')}</a>
          </div>
        </div>
      </section>
    `;
  }
};
