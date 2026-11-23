/**
 * Page Stats - Statistiques du joueur
 *
 * Dépendances: Pages (pages-base.js), Components, XP, Badges, Charts
 */

// ═══════════════════════════════════════════════════════════════
// STATS - Statistiques du joueur
// ═══════════════════════════════════════════════════════════════

Pages.stats = {
  // État local des périodes et séries sélectionnées
  _calendarWeeks: 12,
  _evolutionDays: 30,
  _evolutionSeries: {
    xpCumulative: true,
    xpDaily: false,
    cards: false
  },

  render(state) {
    const { player, decks } = state;
    const _t = PageUtils.getTranslator();

    if (!player) {
      return `<div class="page page--stats">${_t('app.loading')}</div>`;
    }

    const level = XP.calculateLevel(player.stats.totalXP);
    const badgeStats = Badges.getStats(player);

    // Préparer les données pour les graphiques
    const hasCharts = typeof Charts !== 'undefined';
    const cardDistribution = hasCharts ? Charts.getCardDistribution(decks) : [];
    const weeklyActivity = hasCharts ? Charts.getWeeklyActivity(player) : [];
    const activityHeatmap = hasCharts ? Charts.getActivityHeatmap(player) : {};

    // Statistiques avancées
    const comparativeStats = hasCharts ? Charts.getComparativeStats(player) : null;
    const averages = hasCharts ? Charts.getGlobalAverages(player, decks) : null;

    // Données d'évolution multi-métriques
    const evolutionData = hasCharts ? this._getEvolutionWithVisibility(player) : null;

    // Stats par deck (top 5 les plus joués)
    const deckStats = this._getDeckStatsTop(decks, 5);

    return `
      <div class="page page--stats">
        <main class="page__content" id="main-content" role="main">
          <h1 class="stats__title">📊 ${_t('stats.title')}</h1>

          <!-- Section: Progression globale -->
          <section class="stats__section">
            <h2 class="stats__section-title">${_t('stats.progression')}</h2>
            <div class="stats__grid stats__grid--4">
              <div class="stats__stat">
                <div class="stats__stat-value">${level}</div>
                <div class="stats__stat-label">${_t('stats.level')}</div>
              </div>
              <div class="stats__stat">
                <div class="stats__stat-value">${escapeHtml(player.stats.totalXP)}</div>
                <div class="stats__stat-label">XP</div>
              </div>
              <div class="stats__stat">
                <div class="stats__stat-value">${escapeHtml(player.stats.totalCardsPlayed)}</div>
                <div class="stats__stat-label">${_t('stats.cardsPlayed')}</div>
              </div>
              <div class="stats__stat">
                <div class="stats__stat-value">${escapeHtml(player.stats.totalSessions)}</div>
                <div class="stats__stat-label">${_t('stats.sessions')}</div>
              </div>
            </div>
          </section>

          ${hasCharts && averages ? `
          <!-- Section: Performance -->
          <section class="stats__section">
            <h2 class="stats__section-title">${i18n.t('stats.performance')}</h2>
            <div class="stats__grid stats__grid--6">
              <div class="stats__stat">
                <div class="stats__stat-value">${averages.accuracy}%</div>
                <div class="stats__stat-label">${i18n.t('stats.accuracy')}</div>
              </div>
              <div class="stats__stat">
                <div class="stats__stat-value">${averages.avgResponseTimeSec}s</div>
                <div class="stats__stat-label">${i18n.t('stats.avgTime')}</div>
              </div>
              <div class="stats__stat">
                <div class="stats__stat-value">${averages.cardsPerDay}</div>
                <div class="stats__stat-label">${i18n.t('chart.cardsPerDay')}</div>
              </div>
              <div class="stats__stat">
                <div class="stats__stat-value">${averages.xpPerDay}</div>
                <div class="stats__stat-label">${i18n.t('chart.xpPerDay')}</div>
              </div>
              <div class="stats__stat">
                <div class="stats__stat-value">🔥 ${escapeHtml(player.stats.currentStreak)}</div>
                <div class="stats__stat-label">${_t('stats.currentStreak')}</div>
              </div>
              <div class="stats__stat">
                <div class="stats__stat-value">🏆 ${escapeHtml(player.stats.longestStreak)}</div>
                <div class="stats__stat-label">${_t('stats.record')}</div>
              </div>
            </div>
          </section>
          ` : ''}

          ${hasCharts && comparativeStats ? `
          <!-- Section: Comparaison périodes -->
          <section class="stats__section">
            <h2 class="stats__section-title">📈 ${i18n.t('stats.comparison')}</h2>
            <div class="stats__comparison-grid">
              ${this._renderComparison(i18n.t('stats.today'), comparativeStats.daily, i18n.t('stats.prevDay'))}
              ${this._renderComparison(i18n.t('stats.thisWeek'), comparativeStats.weekly, i18n.t('stats.prevWeek'))}
              ${this._renderComparison(i18n.t('stats.thisMonth'), comparativeStats.monthly, i18n.t('stats.prevMonth'))}
            </div>
          </section>
          ` : ''}

          ${hasCharts && evolutionData ? `
          <!-- Section: Graphique d'évolution multi-métriques -->
          <section class="stats__section">
            <h2 class="stats__section-title">📉 ${i18n.t('stats.evolution')}</h2>
            <div class="stats__chart-card stats__chart-card--full">
              <div class="stats__chart-header">
                <div class="stats__period-selector" id="evolution-period-selector">
                  ${Charts.PERIOD_OPTIONS.xp.map(opt => `
                    <button class="stats__period-btn ${opt.days === this._evolutionDays ? 'stats__period-btn--active' : ''}"
                            data-days="${opt.days}">
                      ${opt.label}
                    </button>
                  `).join('')}
                </div>
              </div>
              <div id="evolution-chart">
                ${Charts.multiLine(evolutionData, {
                  width: 500,
                  height: 200,
                  showLegend: true,
                  showDots: false
                })}
              </div>
            </div>
          </section>
          ` : ''}

          ${hasCharts ? `
          <section class="stats__section stats__section--charts">
            <h2 class="stats__section-title">📊 ${i18n.t('stats.charts')}</h2>

            <div class="stats__charts-grid">
              <!-- Distribution des cartes -->
              <div class="stats__chart-card">
                <h3 class="stats__chart-title">${i18n.t('stats.cardDistribution')}</h3>
                ${Charts.donut(cardDistribution, {
                  size: 180,
                  thickness: 25,
                  showTotal: true,
                  showLegend: true
                })}
              </div>

              <!-- Activité de la semaine -->
              <div class="stats__chart-card">
                <h3 class="stats__chart-title">${i18n.t('stats.thisWeek')}</h3>
                ${Charts.bar(weeklyActivity, {
                  width: 280,
                  height: 140,
                  barWidth: 28,
                  gap: 8,
                  color: Charts.colors.purple
                })}
              </div>

              <!-- Calendrier d'activité avec sélecteur -->
              <div class="stats__chart-card stats__chart-card--wide">
                <div class="stats__chart-header">
                  <h3 class="stats__chart-title">${i18n.t('chart.heatmapLabel')}</h3>
                  <div class="stats__period-selector" id="calendar-period-selector">
                    ${Charts.PERIOD_OPTIONS.calendar.map(opt => `
                      <button class="stats__period-btn ${opt.weeks === this._calendarWeeks ? 'stats__period-btn--active' : ''}"
                              data-weeks="${opt.weeks}">
                        ${opt.label}
                      </button>
                    `).join('')}
                  </div>
                </div>
                <div id="activity-heatmap">
                  ${Charts.heatmap(activityHeatmap, {
                    weeks: this._calendarWeeks,
                    cellSize: this._calendarWeeks > 26 ? 8 : 12,
                    gap: this._calendarWeeks > 26 ? 2 : 3
                  })}
                </div>
              </div>
            </div>
          </section>
          ` : ''}

          ${deckStats.length > 0 ? `
          <!-- Section: Stats par deck -->
          <section class="stats__section">
            <h2 class="stats__section-title">📚 ${i18n.t('stats.perDeck')}</h2>
            <div class="stats__deck-list">
              ${deckStats.map(ds => this._renderDeckStats(ds)).join('')}
            </div>
          </section>
          ` : ''}

          <section class="stats__section">
            <h2 class="stats__section-title">${_t('stats.mastery')}</h2>
            <div class="stats__grid">
              <div class="stats__stat">
                <div class="stats__stat-value">${escapeHtml(player.stats.totalGreenCards || 0)}</div>
                <div class="stats__stat-label">${_t('stats.greenCards')}</div>
              </div>
              <div class="stats__stat">
                <div class="stats__stat-value">${badgeStats.unlocked} / ${badgeStats.total}</div>
                <div class="stats__stat-label">${_t('stats.badges')}</div>
              </div>
            </div>
          </section>
        </main>

        ${PageUtils.renderFooter(player, 'stats')}
      </div>
    `;
  },

  /**
   * Récupère les données d'évolution avec la visibilité des séries
   * @private
   */
  _getEvolutionWithVisibility(player) {
    const data = Charts.getEvolutionData(player, this._evolutionDays);
    // Appliquer la visibilité sauvegardée
    Object.keys(this._evolutionSeries).forEach(key => {
      if (data[key]) {
        data[key].visible = this._evolutionSeries[key];
      }
    });
    return data;
  },

  /**
   * Récupère les stats des top N decks les plus joués
   * @private
   */
  _getDeckStatsTop(decks, limit = 5) {
    if (!decks || !Array.isArray(decks)) return [];

    const hasCharts = typeof Charts !== 'undefined';
    if (!hasCharts) return [];

    return decks
      .map(deck => ({
        deck,
        stats: Charts.getDeckDetailedStats(deck)
      }))
      .filter(ds => ds.stats.totalTimesPlayed > 0)
      .sort((a, b) => b.stats.totalTimesPlayed - a.stats.totalTimesPlayed)
      .slice(0, limit);
  },

  /**
   * Rend les stats d'un deck (cliquable pour voir les stats par carte)
   * @private
   */
  _renderDeckStats(deckStats) {
    const { deck, stats } = deckStats;
    const _t = PageUtils.getTranslator();
    const dist = stats.distribution || {};
    // Équivalent textuel de la barre de répartition (la couleur ne doit pas être seule porteuse du sens)
    const distributionText = `${_t('stats.boxDistribution')} ` + [
      ['box.green', dist.green], ['box.orange', dist.orange], ['box.purple', dist.purple], ['box.neverPlayed', dist.never_played]
    ].map(([key, n]) => `${_t(key)} ${Number(n) || 0}`).join(', ');
    const progressColor = stats.progress >= 80 ? 'green' : stats.progress >= 40 ? 'orange' : 'purple';

    return `
      <div class="stats__deck-card stats__deck-card--clickable" data-deck-id="${escapeHtml(deck.id)}" role="button" tabindex="0">
        <div class="stats__deck-header">
          <span class="stats__deck-name">${escapeHtml(deck.name)}</span>
          <span class="stats__deck-progress stats__deck-progress--${progressColor}">${stats.progress}%</span>
        </div>
        <div class="stats__deck-metrics">
          <span title="${i18n.t('stats.accuracy')}">${stats.accuracy}% ✓</span>
          <span title="${i18n.t('stats.avgTime')}">${stats.avgResponseTimeSec}s ⏱</span>
          <span title="${i18n.t('stats.cardsPlayed')}">${stats.cardsPlayed}/${stats.totalCards} 🃏</span>
        </div>
        <div class="stats__deck-distribution" role="img" aria-label="${escapeHtml(distributionText)}" title="${escapeHtml(distributionText)}">
          <span class="stats__box stats__box--green" style="flex: ${stats.distribution.green || 0.1}"></span>
          <span class="stats__box stats__box--orange" style="flex: ${stats.distribution.orange || 0.1}"></span>
          <span class="stats__box stats__box--purple" style="flex: ${stats.distribution.purple || 0.1}"></span>
          <span class="stats__box stats__box--gray" style="flex: ${stats.distribution.never_played || 0.1}"></span>
        </div>
        <div class="stats__deck-hint" aria-hidden="true">${escapeHtml(distributionText)}</div>
        <div class="stats__deck-hint">${i18n.t('stats.clickForCards')}</div>
      </div>
    `;
  },

  /**
   * Rend le panneau de stats par carte pour un deck
   * @private
   */
  _renderCardStatsPanel(deck) {
    const cards = deck.cards || [];
    const _t = PageUtils.getTranslator();

    // Trier les cartes par performance (les plus difficiles en premier)
    const sortedCards = [...cards].sort((a, b) => {
      // Priorité: cartes jouées avec le moins bon ratio
      const aPlayed = a.timesPlayed || 0;
      const bPlayed = b.timesPlayed || 0;
      if (aPlayed === 0 && bPlayed === 0) return 0;
      if (aPlayed === 0) return 1;
      if (bPlayed === 0) return -1;

      const aRatio = (a.timesCorrect || 0) / aPlayed;
      const bRatio = (b.timesCorrect || 0) / bPlayed;
      return aRatio - bRatio; // Les plus difficiles en premier
    });

    return `
      <div class="stats__card-panel" id="card-stats-panel">
        <div class="stats__card-panel-header">
          <h3 class="stats__card-panel-title">📋 ${escapeHtml(deck.name)}</h3>
          <button class="stats__card-panel-close" aria-label="${i18n.t('common.close')}">&times;</button>
        </div>
        <div class="stats__card-panel-content">
          ${sortedCards.length === 0 ? `
            <p class="stats__card-panel-empty">${i18n.t('stats.noCardsInDeck')}</p>
          ` : `
            <table class="stats__card-table">
              <thead>
                <tr>
                  <th>${i18n.t('game.question')}</th>
                  <th>${i18n.t('stats.box')}</th>
                  <th>${i18n.t('stats.accuracy')}</th>
                  <th>${i18n.t('exam.statTime')}</th>
                  <th>${i18n.t('stats.evolution')}</th>
                  <th>${i18n.t('stats.timesPlayed')}</th>
                </tr>
              </thead>
              <tbody>
                ${sortedCards.map(card => this._renderCardRow(card)).join('')}
              </tbody>
            </table>
          `}
        </div>
      </div>
      <div class="stats__card-panel-overlay" id="card-stats-overlay"></div>
    `;
  },

  /**
   * Rend une ligne de tableau pour une carte
   * @private
   */
  _renderCardRow(card) {
    const box = card.box || 'never_played';
    // Valeurs numériques issues du deck (import) : forcées en nombre avant affichage
    const timesPlayed = Number(card.timesPlayed) || 0;
    const timesCorrect = Number(card.timesCorrect) || 0;
    const accuracy = timesPlayed > 0 ? Math.round((timesCorrect / timesPlayed) * 100) : '-';
    const avgTime = card.lastResponseTimeMs ? (card.lastResponseTimeMs / 1000).toFixed(1) + 's' : '-';

    // Tronquer la question si trop longue (mais garder le LaTeX intact pour le title)
    const fullQuestion = card.question || '';
    const truncatedQuestion = fullQuestion.length > 50
      ? fullQuestion.substring(0, 47) + '...'
      : fullQuestion;

    // Rendre avec LaTeX si disponible
    const questionHtml = typeof renderWithLatex !== 'undefined'
      ? renderWithLatex(truncatedQuestion)
      : escapeHtml(truncatedQuestion);

    // Title avec LaTeX rendu aussi
    const titleHtml = typeof renderWithLatex !== 'undefined'
      ? renderWithLatex(fullQuestion)
      : escapeHtml(fullQuestion);

    const boxEmoji = {
      'never_played': '⬜',
      'purple': '💜',
      'orange': '🟠',
      'green': '💚'
    };

    const accuracyClass = accuracy === '-' ? '' :
      accuracy >= 80 ? 'stats__card-accuracy--good' :
      accuracy >= 50 ? 'stats__card-accuracy--medium' : 'stats__card-accuracy--bad';

    // Sparkline d'évolution du temps de réponse
    const sparkline = this._renderSparkline(card.responseTimeHistory);

    // Informations de repos pour les cartes vertes
    let restInfo = '';
    if (box === 'green' && card.restUntil) {
      const today = TextUtils.getToday();
      const restUntilDate = new Date(card.restUntil);
      const todayDate = new Date(today);
      const daysRemaining = Math.ceil((restUntilDate - todayDate) / (1000 * 60 * 60 * 24));
      const initialRestDays = Number(card.restDays) || 0;

      if (daysRemaining > 0) {
        restInfo = `<span class="stats__card-rest" title="${i18n.t('stats.restInitial', { days: initialRestDays })}">🛌 ${i18n.t('stats.restDays', { days: initialRestDays })} → ${i18n.t('stats.restDays', { days: daysRemaining })}</span>`;
      } else {
        restInfo = `<span class="stats__card-rest stats__card-rest--ready" title="${i18n.t('stats.restOver', { days: initialRestDays })}">✅ ${i18n.t('stats.ready')}</span>`;
      }
    }

    return `
      <tr class="stats__card-row stats__card-row--${escapeHtml(box)}">
        <td class="stats__card-question" data-full-question="${escapeHtml(fullQuestion)}">${questionHtml}</td>
        <td class="stats__card-box">${boxEmoji[box] || '⬜'} ${restInfo}</td>
        <td class="stats__card-accuracy ${accuracyClass}">${accuracy}${accuracy !== '-' ? '%' : ''}</td>
        <td class="stats__card-time">${avgTime}</td>
        <td class="stats__card-sparkline">${sparkline}</td>
        <td class="stats__card-played">${timesPlayed}×</td>
      </tr>
    `;
  },

  /**
   * Génère un mini sparkline SVG pour l'évolution du temps de réponse
   * @private
   */
  _renderSparkline(history) {
    if (!history || history.length < 2) {
      return '<span class="stats__sparkline-empty">—</span>';
    }

    const width = 60;
    const height = 20;
    const padding = 2;

    // Extraire les temps et déterminer min/max
    const times = history.map(h => h.time);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const range = maxTime - minTime || 1;

    // Générer les points
    const points = history.map((h, i) => {
      const x = padding + (i / (history.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((h.time - minTime) / range) * (height - 2 * padding);
      return { x, y, correct: h.correct };
    });

    // Créer la ligne
    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

    // Couleur basée sur la tendance (amélioration = vert, dégradation = rouge)
    const firstAvg = times.slice(0, Math.ceil(times.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(times.length / 2);
    const lastAvg = times.slice(Math.floor(times.length / 2)).reduce((a, b) => a + b, 0) / Math.floor(times.length / 2 + 0.5);
    const improving = lastAvg <= firstAvg;
    const lineColor = improving ? 'var(--color-green)' : 'var(--color-orange)';

    // Points colorés selon correct/incorrect
    const dots = points.map(p =>
      `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="2" fill="${p.correct ? 'var(--color-green)' : 'var(--color-red, #ef4444)'}" />`
    ).join('');

    return `
      <svg class="stats__sparkline" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <path d="${linePath}" fill="none" stroke="${lineColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
        ${dots}
      </svg>
    `;
  },

  /**
   * Rend une carte de comparaison de période
   * @private
   */
  _renderComparison(title, data, prevLabel) {
    const renderDiff = (diff) => {
      if (diff === 0) return '<span class="stats__diff stats__diff--neutral">—</span>';
      const arrow = diff > 0 ? '▲' : '▼';
      const cls = diff > 0 ? 'stats__diff--up' : 'stats__diff--down';
      return `<span class="stats__diff ${cls}">${arrow} ${Math.abs(diff)}%</span>`;
    };

    return `
      <div class="stats__comparison-card">
        <h4 class="stats__comparison-title">${title}</h4>
        <div class="stats__comparison-row">
          <span class="stats__comparison-label">XP</span>
          <span class="stats__comparison-value">${data.current.xp}</span>
          ${renderDiff(data.diff.xp)}
        </div>
        <div class="stats__comparison-row">
          <span class="stats__comparison-label">${i18n.t('summary.cards')}</span>
          <span class="stats__comparison-value">${data.current.cardsPlayed}</span>
          ${renderDiff(data.diff.cards)}
        </div>
        <div class="stats__comparison-prev">${i18n.t('stats.versus', { label: prevLabel, xp: data.previous.xp, cards: data.previous.cardsPlayed })}</div>
      </div>
    `;
  },

  mount(container, state) {
    container.innerHTML = this.render(state);

    // Bind evolution period selector
    this._bindPeriodSelector(container, '#evolution-period-selector', 'days', (days) => {
      this._evolutionDays = days;
      this._updateEvolutionChart(container, state);
    });

    // Bind evolution legend toggles
    this._bindEvolutionLegend(container, state);

    // Bind calendar period selector
    this._bindPeriodSelector(container, '#calendar-period-selector', 'weeks', (weeks) => {
      this._calendarWeeks = weeks;
      this._updateHeatmap(container, state);
    });

    // Bind deck card clicks for per-card stats
    this._bindDeckCardClicks(container, state);
  },

  /**
   * Bind générique pour les sélecteurs de période (DRY)
   * @private
   */
  _bindPeriodSelector(container, selector, dataAttr, callback) {
    const selectorEl = container.querySelector(selector);
    if (!selectorEl) return;

    selectorEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.stats__period-btn');
      if (!btn) return;

      const value = parseInt(btn.dataset[dataAttr], 10);

      // Update active button
      selectorEl.querySelectorAll('.stats__period-btn').forEach(b => {
        b.classList.toggle('stats__period-btn--active', parseInt(b.dataset[dataAttr], 10) === value);
      });

      callback(value);
    });
  },

  /**
   * Bind la légende interactive du graphique d'évolution
   * @private
   */
  _bindEvolutionLegend(container, state) {
    const legend = container.querySelector('#multiline-legend');
    if (!legend) return;

    legend.addEventListener('change', (e) => {
      const checkbox = e.target;
      if (!checkbox.dataset.series) return;

      const seriesId = checkbox.dataset.series;
      this._evolutionSeries[seriesId] = checkbox.checked;

      // Re-render le graphique
      this._updateEvolutionChart(container, state);
    });
  },

  /**
   * Met à jour le graphique d'évolution
   * @private
   */
  _updateEvolutionChart(container, state) {
    const chartContainer = container.querySelector('#evolution-chart');
    if (!chartContainer || typeof Charts === 'undefined') return;

    const evolutionData = this._getEvolutionWithVisibility(state.player);
    chartContainer.innerHTML = Charts.multiLine(evolutionData, {
      width: 500,
      height: 200,
      showLegend: true,
      showDots: false
    });

    // Re-bind legend après re-render
    this._bindEvolutionLegend(container, state);
  },

  /**
   * Met à jour le calendrier d'activité
   * @private
   */
  _updateHeatmap(container, state) {
    const heatmapContainer = container.querySelector('#activity-heatmap');
    if (!heatmapContainer || typeof Charts === 'undefined') return;

    const activityHeatmap = Charts.getActivityHeatmap(state.player);
    heatmapContainer.innerHTML = Charts.heatmap(activityHeatmap, {
      weeks: this._calendarWeeks,
      cellSize: this._calendarWeeks > 26 ? 8 : 12,
      gap: this._calendarWeeks > 26 ? 2 : 3
    });
  },

  /**
   * Bind les clics sur les cartes de deck pour afficher les stats par carte
   * @private
   */
  _bindDeckCardClicks(container, state) {
    const deckList = container.querySelector('.stats__deck-list');
    if (!deckList) return;

    deckList.addEventListener('click', (e) => {
      const deckCard = e.target.closest('.stats__deck-card--clickable');
      if (!deckCard) return;

      const deckId = deckCard.dataset.deckId;
      const deck = (state.decks || []).find(d => d.id === deckId);
      if (deck) {
        this._showCardStatsPanel(container, deck);
      }
    });

    // Support clavier
    deckList.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const deckCard = e.target.closest('.stats__deck-card--clickable');
        if (!deckCard) return;

        e.preventDefault();
        const deckId = deckCard.dataset.deckId;
        const deck = (state.decks || []).find(d => d.id === deckId);
        if (deck) {
          this._showCardStatsPanel(container, deck);
        }
      }
    });
  },

  /**
   * Affiche le panneau de stats par carte
   * @private
   */
  _showCardStatsPanel(container, deck) {
    // Supprimer tout panel existant
    this._hideCardStatsPanel(container);

    // Créer et insérer le panel
    const panelHtml = this._renderCardStatsPanel(deck);
    const panelContainer = document.createElement('div');
    panelContainer.id = 'card-stats-container';
    panelContainer.innerHTML = panelHtml;
    container.appendChild(panelContainer);

    // Animer l'apparition
    requestAnimationFrame(() => {
      const panel = container.querySelector('#card-stats-panel');
      const overlay = container.querySelector('#card-stats-overlay');
      if (panel) panel.classList.add('stats__card-panel--visible');
      if (overlay) overlay.classList.add('stats__card-panel-overlay--visible');
    });

    // Bind fermeture
    const closeBtn = container.querySelector('.stats__card-panel-close');
    const overlay = container.querySelector('#card-stats-overlay');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this._hideCardStatsPanel(container));
    }
    if (overlay) {
      overlay.addEventListener('click', () => this._hideCardStatsPanel(container));
    }

    // Fermer avec Escape (listener retiré dans _hideCardStatsPanel, quel que soit le mode de fermeture)
    this._statsEscapeHandler = (e) => {
      if (e.key === 'Escape') {
        this._hideCardStatsPanel(container);
      }
    };
    document.addEventListener('keydown', this._statsEscapeHandler);
  },

  /**
   * Cache le panneau de stats par carte
   * @private
   */
  _hideCardStatsPanel(container) {
    if (this._statsEscapeHandler) {
      document.removeEventListener('keydown', this._statsEscapeHandler);
      this._statsEscapeHandler = null;
    }
    const panelContainer = container.querySelector('#card-stats-container');
    if (panelContainer) {
      const panel = panelContainer.querySelector('#card-stats-panel');
      const overlay = panelContainer.querySelector('#card-stats-overlay');

      if (panel) panel.classList.remove('stats__card-panel--visible');
      if (overlay) overlay.classList.remove('stats__card-panel-overlay--visible');

      // Supprimer après animation
      setTimeout(() => panelContainer.remove(), 200);
    }
  }
};
