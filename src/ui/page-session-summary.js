/**
 * Page Session Summary - Bilan de séance
 *
 * Centré sur l'apprentissage : ce que la séance a changé pour la mémoire (cartes passées en
 * boîte verte, cartes à revoir) et la prochaine révision utile. Quand il n'y a plus rien à
 * réviser aujourd'hui, le bilan le dit plutôt que d'inciter à rejouer. Les confettis sont
 * réservés à une séance réussie (80 % de bonnes réponses ou plus).
 *
 * Dépendances: Pages (pages-base.js), State, Router, Leitner, Challenges, Effects
 */

// ═══════════════════════════════════════════════════════════════
// SESSION SUMMARY - Bilan de séance
// ═══════════════════════════════════════════════════════════════

Pages.sessionSummary = {
  /** Part de bonnes réponses à partir de laquelle la séance est fêtée (confettis) */
  CELEBRATE_ACCURACY: 0.8,

  /**
   * La séance mérite-t-elle des confettis ? (80 % de bonnes réponses ou plus)
   * @param {{ cardsPlayed: number, correctAnswers: number }} stats - Statistiques de séance
   * @returns {boolean}
   */
  _shouldCelebrate(stats) {
    return !!stats && stats.cardsPlayed > 0 &&
      stats.correctAnswers / stats.cardsPlayed >= this.CELEBRATE_ACCURACY;
  },

  /**
   * Ce que la séance a changé pour la mémoire : l'état final de chaque carte jouée
   * (une carte revue puis réussie compte comme passée en vert, une seule fois)
   * @param {Array} results - Résultats de la séance (`cardId`, `newBox`)
   * @returns {{ toGreen: number, toReview: number }}
   */
  _getLearning(results) {
    const last = new Map();
    (Array.isArray(results) ? results : []).forEach(r => last.set(r.cardId, r.newBox));
    let toGreen = 0;
    last.forEach(box => { if (box === 'green') toGreen++; });
    return { toGreen, toReview: last.size - toGreen };
  },

  /**
   * Jour affiché en toutes lettres, dans la langue courante (ex. « vendredi 9 janvier »)
   * @param {string} day - Jour local (YYYY-MM-DD)
   * @returns {string}
   */
  _formatDay(day) {
    const [y, m, d] = day.split('-').map(Number);
    const locale = typeof i18n !== 'undefined' && i18n.getLocale ? i18n.getLocale() : 'fr';
    return new Date(y, m - 1, d).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  },

  render(state) {
    const { currentSession, decks } = state;
    const _t = PageUtils.getTranslator();

    if (!currentSession) {
      Router.navigate('/home');
      return '';
    }

    const { stats, newBadges = [], completedChallenges = [], completedQuests = [] } = currentSession;
    const accuracy = stats.cardsPlayed > 0
      ? Math.round((stats.correctAnswers / stats.cardsPlayed) * 100)
      : 0;

    // Cartes encore jouables dans ce deck (bouton « Rejouer »)
    const deck = decks?.find(d => d.id === currentSession.deckId);
    const today = PageUtils.getToday();
    const playableCards = deck ? (deck.cards || []).filter(card => Leitner.isCardPlayable(card, today)) : [];
    const canReplay = playableCards.length > 0;

    // Mémoire : ce que la séance a changé, et ce qui reste à réviser (tous decks confondus)
    const learning = this._getLearning(currentSession.results);
    const outlook = Challenges.getReviewOutlook(decks, today);
    let nothingMessage = null;
    if (outlook.dueNow === 0) {
      if (!outlook.nextDay) {
        nothingMessage = _t('summary.nothingToday');
      } else if (outlook.nextDay === TextUtils.addDays(today, 1)) {
        nothingMessage = _t('summary.nothingBeforeTomorrow');
      } else {
        nothingMessage = _t('summary.nothingBeforeDate', { date: this._formatDay(outlook.nextDay) });
      }
    }

    return `
      <div class="page page--session-summary">
        <div class="session-summary" role="main">
          <h1 class="session-summary__title">🎉 ${_t('game.sessionComplete')}</h1>

          <div class="session-summary__stats">
            <div class="session-summary__stat">
              <div class="session-summary__stat-value">${stats.cardsPlayed}</div>
              <div class="session-summary__stat-label">${_t('summary.cards')}</div>
            </div>
            <div class="session-summary__stat">
              <div class="session-summary__stat-value">${accuracy}%</div>
              <div class="session-summary__stat-label">${_t('game.accuracy')}</div>
            </div>
            <div class="session-summary__stat">
              <div class="session-summary__stat-value">${stats.totalXpEarned}</div>
              <div class="session-summary__stat-label">XP</div>
            </div>
          </div>

          ${learning.toGreen + learning.toReview > 0 || nothingMessage ? `
            <div class="session-summary__learning">
              <h3 class="session-summary__learning-title">🧠 ${escapeHtml(_t('summary.learningTitle'))}</h3>
              ${learning.toGreen > 0 ? `
                <div class="session-summary__learning-item session-summary__learning-item--green">${escapeHtml(_t('summary.toGreen', { count: learning.toGreen }))}</div>
              ` : ''}
              ${learning.toReview > 0 ? `
                <div class="session-summary__learning-item">${escapeHtml(_t('summary.toReview', { count: learning.toReview }))}</div>
              ` : ''}
              ${nothingMessage ? `
                <div class="session-summary__complete">
                  <span class="session-summary__complete-icon">✨</span>
                  <span class="session-summary__complete-text">${escapeHtml(nothingMessage)}</span>
                </div>
              ` : ''}
            </div>
          ` : ''}

          ${newBadges.length > 0 ? `
            <div class="session-summary__badges">
              <h3 class="session-summary__badges-title">🏆 ${_t('summary.newBadges')}</h3>
              ${newBadges.map(badge => `
                <div class="session-summary__badge">
                  <span class="session-summary__badge-icon">${badge.icon}</span>
                  <span class="session-summary__badge-name">${escapeHtml(badge.name)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${completedChallenges.length > 0 ? `
            <div class="session-summary__challenges">
              <h3 class="session-summary__challenges-title">🎯 ${_t('summary.challengesCompleted')}</h3>
              ${completedChallenges.map(challenge => `
                <div class="session-summary__challenge">
                  <span class="session-summary__challenge-text">${escapeHtml(Challenges.describe(challenge, _t))}</span>
                  <span class="session-summary__challenge-xp">+${Number(challenge.xpReward)} XP</span>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${completedQuests.length > 0 ? `
            <div class="session-summary__challenges">
              <h3 class="session-summary__challenges-title">📆 ${_t('summary.questsCompleted')}</h3>
              ${completedQuests.map(quest => `
                <div class="session-summary__challenge">
                  <span class="session-summary__challenge-text">${escapeHtml(Challenges.describe(quest, _t))}</span>
                  <span class="session-summary__challenge-xp">+${Number(quest.xpReward)} XP</span>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="session-summary__actions">
            <button class="btn btn--secondary session-summary__home">${_t('common.back')}</button>
            ${canReplay ? `
              <button class="btn btn--primary session-summary__replay">${_t('summary.replay', { count: playableCards.length })}</button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },

  mount(container, state) {
    container.innerHTML = this.render(state);

    // Confettis réservés à une séance réussie (80 % de bonnes réponses ou plus)
    if (typeof Effects !== 'undefined' && Effects.confetti && state.currentSession &&
        this._shouldCelebrate(state.currentSession.stats)) {
      // Petit délai pour laisser la page se charger
      setTimeout(() => {
        Effects.confetti.celebrateVictory();
      }, 300);
    }

    const homeButton = container.querySelector('.session-summary__home');
    const replayButton = container.querySelector('.session-summary__replay');

    if (homeButton) {
      homeButton.addEventListener('click', () => {
        State.set('currentSession', null);
        State.set('showSessionSummary', false);
        Router.navigate('/home');
      });
    }

    if (replayButton) {
      replayButton.addEventListener('click', () => {
        const deckId = state.currentSession.deckId;
        State.set('currentSession', null);
        State.set('showSessionSummary', false);
        Router.navigate(`/game/${deckId}`);
      });
    }
  }
};
