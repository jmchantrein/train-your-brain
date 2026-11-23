/**
 * Page Challenges - Défis quotidiens et quêtes hebdomadaires
 *
 * Les missions sont celles du joueur courant (player.missions) : elles survivent au
 * rechargement et ne sont pas partagées entre joueurs. Un jour sans carte à réviser n'a
 * aucun défi : la page le dit simplement.
 *
 * Elle est aussi l'un des deux points d'entrée du mode défi (l'autre est l'action « Défi » d'un
 * deck) : le choix d'un deck mène à `#/challenge-setup/:deck` (page-challenge.js). Rien n'y
 * pousse à jouer : les decks sont simplement listés avec leur nombre de cartes à réviser.
 *
 * Dépendances: Pages (pages-base.js), Components, State, Challenges, GameSessionManager, Storage
 */

// ═══════════════════════════════════════════════════════════════
// CHALLENGES - Défis quotidiens et quêtes hebdomadaires
// ═══════════════════════════════════════════════════════════════

Pages.challenges = {
  _activeTab: 'daily', // 'daily' or 'weekly'

  _ICONS: { review_due: '🃏', accuracy: '🎯', green_streak: '💚' },
  _QUEST_ICONS: { weekly_xp: '⚡', weekly_mastery: '📗', weekly_streak: '🔥', weekly_challenges: '🏆', weekly_decks: '🗃️' },

  /**
   * Prépare les missions du joueur (jour et semaine courants), enregistre si elles ont changé
   * @private
   * @param {Player} player - Joueur courant
   * @param {Deck[]} decks - Decks du joueur
   */
  _prepare(player, decks) {
    let changed = GameSessionManager.refreshMissions(player, decks || []);
    // Une quête peut avoir été terminée hors séance (ex. défi gagné) : crédit unique de son XP
    if (GameSessionManager._finishMissions(player, null).length > 0) {
      changed = true;
      GameSessionManager.flushLevelUp();
    }
    if (changed) {
      Storage.savePlayer(player);
      Storage.savePlayerById(player);
    }
  },

  /**
   * Point d'entrée du mode défi : decks commencés (standard) avec leur nombre de cartes à réviser,
   * et meilleurs scores personnels s'il y en a
   * @private
   */
  _renderEntry(player, decks, _t) {
    const today = PageUtils.getToday();
    const processed = PageUtils.getProcessedDecks(decks || []).visibleDecks;
    const started = processed
      .filter(d => d.type !== 'multilingual' && Array.isArray(d.cards) && d.cards.some(c => c.timesPlayed > 0))
      .map(d => ({ deck: d, due: Challenges.dueChallengeCards(d, today).length }))
      .sort((a, b) => b.due - a.due || String(a.deck.name).localeCompare(String(b.deck.name)));

    const records = [];
    Object.keys(Challenges.CHALLENGE_MODES).forEach(modeId => {
      Object.keys(Challenges.DIFFICULTY_LEVELS).forEach(difficulty => {
        const score = Challenges.getBestScore(player, modeId, difficulty);
        if (score > 0) {
          records.push(_t('challenge.entry.recordLine', {
            mode: _t('challenge.mode.' + modeId),
            level: _t('challenge.diff.' + difficulty),
            score
          }));
        }
      });
    });

    const body = started.length === 0 ? `
        <p class="chalentry__empty">${escapeHtml(_t('challenge.entry.empty'))}</p>
        <a href="#/explore" class="btn btn--secondary chalentry__explore">${escapeHtml(_t('challenge.entry.explore'))}</a>
      ` : `
        <label class="chalentry__label" for="chal-deck">${escapeHtml(_t('challenge.entry.deckLabel'))}</label>
        <div class="chalentry__row">
          <select id="chal-deck" class="chalentry__select">
            ${started.map(({ deck, due }) => `<option value="${escapeHtml(deck.id)}">${escapeHtml(_t('challenge.entry.deckOption', { name: deck.name, count: due }))}</option>`).join('')}
          </select>
          <button type="button" class="btn btn--primary chalentry__choose">${escapeHtml(_t('challenge.entry.choose'))}</button>
        </div>
      `;

    return `
      <section class="chalentry" aria-labelledby="chalentry-title">
        <h2 class="chalentry__title" id="chalentry-title">🎯 ${escapeHtml(_t('challenge.entry.title'))}</h2>
        <p class="chalentry__intro">${escapeHtml(_t('challenge.entry.intro'))}</p>
        ${body}
        ${records.length === 0 ? '' : `
          <details class="chalentry__records">
            <summary>${escapeHtml(_t('challenge.entry.recordsTitle'))}</summary>
            <ul>${records.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>
          </details>`}
      </section>`;
  },

  render(state) {
    const { player, decks } = state;
    const _t = PageUtils.getTranslator();

    if (!player) {
      return `<div class="page page--challenges">${_t('missions.loading')}</div>`;
    }

    this._prepare(player, decks);
    const challenges = player.missions.daily.challenges;
    const quests = player.missions.weekly.quests;

    const dailyCompletedCount = challenges.filter(c => c.completed).length;
    const dailyTotalXP = challenges.reduce((sum, c) => sum + (c.completed ? c.xpReward : 0), 0);

    const weeklyCompletedCount = quests.filter(q => q.completed).length;
    const weeklyTotalXP = quests.reduce((sum, q) => sum + (q.completed ? q.xpReward : 0), 0);

    return `
      <div class="page page--challenges">
        <main class="page__content" id="main-content" role="main">
          <h1 class="challenges__title">🎯 ${_t('missions.title')}</h1>

          ${this._renderEntry(player, decks, _t)}

          <div class="challenges__tabs">
            <button class="challenges__tab ${this._activeTab === 'daily' ? 'challenges__tab--active' : ''}" data-tab="daily">
              📅 ${_t('missions.tabDaily')}
              <span class="challenges__tab-badge">${dailyCompletedCount}/${challenges.length}</span>
            </button>
            <button class="challenges__tab ${this._activeTab === 'weekly' ? 'challenges__tab--active' : ''}" data-tab="weekly">
              📆 ${_t('missions.tabWeekly')}
              <span class="challenges__tab-badge">${weeklyCompletedCount}/${quests.length}</span>
            </button>
          </div>

          ${this._activeTab === 'daily' ? `
            <div class="challenges__section">
              ${challenges.length === 0 ? `
                <div class="challenges__rest">
                  <span class="challenges__rest-icon">🌿</span>
                  <p class="challenges__rest-text">${escapeHtml(_t('missions.restDay'))}</p>
                </div>
              ` : `
                <div class="challenges__summary">
                  <span class="challenges__completed">${escapeHtml(_t('missions.completedCount', { done: dailyCompletedCount, total: challenges.length }))}</span>
                  ${dailyTotalXP > 0 ? `<span class="challenges__xp-earned">${escapeHtml(_t('missions.xpEarned', { xp: dailyTotalXP }))}</span>` : ''}
                </div>

                <div class="challenges__list">
                  ${challenges.map(challenge => this._renderChallenge(challenge, _t, player.missions.daily.cardsPlayed)).join('')}
                </div>
              `}

              <div class="challenges__hint">
                <p>💡 ${escapeHtml(_t('missions.dailyHint'))}</p>
              </div>
            </div>
          ` : `
            <div class="challenges__section">
              <div class="challenges__summary">
                <span class="challenges__completed">${escapeHtml(_t('missions.completedCount', { done: weeklyCompletedCount, total: quests.length }))}</span>
                ${weeklyTotalXP > 0 ? `<span class="challenges__xp-earned">${escapeHtml(_t('missions.xpEarned', { xp: weeklyTotalXP }))}</span>` : ''}
              </div>

              <div class="challenges__list challenges__list--weekly">
                ${quests.map(quest => this._renderQuest(quest, _t)).join('')}
              </div>

              <div class="challenges__hint">
                <p>🗓️ ${escapeHtml(_t('missions.weeklyHint'))}</p>
              </div>
            </div>
          `}
        </main>

        ${PageUtils.renderFooter(player, 'challenges')}
      </div>
    `;
  },

  _renderChallenge(challenge, _t, cardsPlayed = 0) {
    const progressPercent = this._getProgressPercent(challenge);
    const progressText = this._getProgressText(challenge, _t, cardsPlayed);

    return `
      <div class="challenge ${challenge.completed ? 'challenge--completed' : ''}">
        <div class="challenge__icon">${this._ICONS[challenge.type] || '🎯'}</div>
        <div class="challenge__content">
          <div class="challenge__description">${escapeHtml(Challenges.describe(challenge, _t))}</div>
          <div class="challenge__progress-bar">
            <div class="challenge__progress-fill" style="width: ${progressPercent}%"></div>
          </div>
          <div class="challenge__progress-text">${escapeHtml(progressText)}</div>
        </div>
        <div class="challenge__reward">
          ${challenge.completed ? '✅' : `+${Number(challenge.xpReward)} XP`}
        </div>
      </div>
    `;
  },

  _renderQuest(quest, _t) {
    const progressPercent = quest.target > 0 ? Math.min((quest.progress / quest.target) * 100, 100) : 0;
    const progressText = quest.completed
      ? _t('missions.done')
      : `${Number(quest.progress)}/${Number(quest.target)}`;

    return `
      <div class="challenge challenge--weekly ${quest.completed ? 'challenge--completed' : ''}">
        <div class="challenge__icon">${this._QUEST_ICONS[quest.type] || '🎯'}</div>
        <div class="challenge__content">
          <div class="challenge__description">${escapeHtml(Challenges.describe(quest, _t))}</div>
          <div class="challenge__progress-bar challenge__progress-bar--weekly">
            <div class="challenge__progress-fill" style="width: ${progressPercent}%"></div>
          </div>
          <div class="challenge__progress-text">${escapeHtml(progressText)}</div>
        </div>
        <div class="challenge__reward challenge__reward--weekly">
          ${quest.completed ? '✅' : `+${Number(quest.xpReward)} XP`}
        </div>
      </div>
    `;
  },

  _getProgressPercent(challenge) {
    if (challenge.completed) return 100;

    switch (challenge.type) {
      case 'review_due':
      case 'green_streak':
        return Math.min((challenge.progress / challenge.target) * 100, 100);
      case 'accuracy':
        return challenge.progress > 0 ? Math.min((challenge.progress / challenge.target.accuracy) * 100, 100) : 0;
      default:
        return 0;
    }
  },

  _getProgressText(challenge, _t, cardsPlayed = 0) {
    if (challenge.completed) return _t('missions.done');

    switch (challenge.type) {
      case 'review_due':
        return _t('missions.progress.review_due', { progress: challenge.progress, target: challenge.target });
      case 'green_streak':
        return _t('missions.progress.green_streak', { progress: challenge.progress, target: challenge.target });
      case 'accuracy':
        if (challenge.progress > 0) {
          return _t('missions.progress.accuracy', { progress: challenge.progress, target: challenge.target.accuracy });
        }
        return _t('missions.progress.accuracyWait', { played: Math.min(cardsPlayed, challenge.target.minCards), minCards: challenge.target.minCards });
      default:
        return '';
    }
  },

  mount(container, state) {
    container.innerHTML = this.render(state);

    // Entrée du mode défi : choix d'un deck, puis du mode sur la page suivante
    container.querySelector('.chalentry__choose')?.addEventListener('click', () => {
      const select = container.querySelector('#chal-deck');
      if (select && select.value) Router.navigate(`/challenge-setup/${select.value}`);
    });

    // Tab switching
    container.querySelectorAll('.challenges__tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this._activeTab = tab.dataset.tab;
        container.innerHTML = this.render(state);
        this.mount(container, state);
      });
    });
  }
};
