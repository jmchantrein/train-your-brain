/**
 * Module Charts - Graphiques SVG pour statistiques
 *
 * Fournit des graphiques SVG légers et accessibles :
 * - DonutChart : Distribution des cartes par boîte
 * - BarChart : Activité hebdomadaire
 * - LineChart : Progression XP
 * - HeatmapChart : Calendrier d'activité
 */

const Charts = {
  // ═══════════════════════════════════════════════════════════════
  // COULEURS PAR DÉFAUT
  // ═══════════════════════════════════════════════════════════════

  colors: {
    purple: '#8b5cf6',
    orange: '#f97316',
    green: '#22c55e',
    blue: '#3b82f6',
    gray: '#6b7280',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    bg: '#1f2937',
    border: '#374151'
  },

  // ═══════════════════════════════════════════════════════════════
  // DONUT CHART - Distribution
  // ═══════════════════════════════════════════════════════════════

  /**
   * Génère un graphique en donut
   * @param {Array} data - [{ value, label, color }]
   * @param {Object} options - { size, thickness, showLegend, showLabels }
   * @returns {string} SVG HTML
   */
  donut(data, options = {}) {
    const {
      size = 200,
      thickness = 30,
      showLegend = true,
      showTotal = true,
      title = ''
    } = options;

    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) {
      return this._emptyChart(size, i18n.t('chart.noData'));
    }

    const center = size / 2;
    const radius = (size - thickness) / 2 - 10;
    const innerRadius = radius - thickness;

    let currentAngle = -90; // Commencer en haut
    const segments = [];

    data.forEach((d, i) => {
      if (d.value === 0) return;

      const percentage = d.value / total;
      const angle = percentage * 360;

      const startAngle = currentAngle * (Math.PI / 180);
      const endAngle = (currentAngle + angle) * (Math.PI / 180);

      const largeArcFlag = angle > 180 ? 1 : 0;

      const x1 = center + radius * Math.cos(startAngle);
      const y1 = center + radius * Math.sin(startAngle);
      const x2 = center + radius * Math.cos(endAngle);
      const y2 = center + radius * Math.sin(endAngle);

      const x3 = center + innerRadius * Math.cos(endAngle);
      const y3 = center + innerRadius * Math.sin(endAngle);
      const x4 = center + innerRadius * Math.cos(startAngle);
      const y4 = center + innerRadius * Math.sin(startAngle);

      const path = `
        M ${x1} ${y1}
        A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
        L ${x3} ${y3}
        A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}
        Z
      `;

      segments.push(`
        <path
          d="${path}"
          fill="${d.color}"
          class="chart-donut__segment"
          data-value="${d.value}"
          data-label="${d.label}"
        >
          <title>${d.label}: ${d.value} (${Math.round(percentage * 100)}%)</title>
        </path>
      `);

      currentAngle += angle;
    });

    const legendHtml = showLegend ? this._donutLegend(data, total) : '';

    return `
      <div class="chart chart--donut">
        ${title ? `<h3 class="chart__title">${title}</h3>` : ''}
        <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="${i18n.t('chart.donutLabel')}">
          ${segments.join('')}
          ${showTotal ? `
            <text x="${center}" y="${center - 8}" text-anchor="middle" fill="${this.colors.text}" font-size="24" font-weight="bold">
              ${total}
            </text>
            <text x="${center}" y="${center + 16}" text-anchor="middle" fill="${this.colors.textMuted}" font-size="12">
              ${i18n.t('chart.cards')}
            </text>
          ` : ''}
        </svg>
        ${legendHtml}
      </div>
    `;
  },

  _donutLegend(data, total) {
    return `
      <div class="chart__legend">
        ${data.map(d => `
          <div class="chart__legend-item">
            <span class="chart__legend-color" style="background: ${d.color}"></span>
            <span class="chart__legend-label">${d.label}</span>
            <span class="chart__legend-value">${d.value}</span>
          </div>
        `).join('')}
      </div>
    `;
  },

  // ═══════════════════════════════════════════════════════════════
  // BAR CHART - Activité
  // ═══════════════════════════════════════════════════════════════

  /**
   * Génère un graphique en barres
   * @param {Array} data - [{ value, label, color? }]
   * @param {Object} options - { width, height, barWidth, gap, showValues }
   * @returns {string} SVG HTML
   */
  bar(data, options = {}) {
    const {
      width = 300,
      height = 150,
      barWidth = 30,
      gap = 8,
      showValues = true,
      showLabels = true,
      color = this.colors.purple,
      title = ''
    } = options;

    if (!data || data.length === 0) {
      return this._emptyChart(width, i18n.t('chart.noData'), height);
    }

    const maxValue = Math.max(...data.map(d => d.value), 1);
    const chartHeight = height - 40; // Espace pour labels
    const chartWidth = data.length * (barWidth + gap);
    const startX = (width - chartWidth) / 2 + gap / 2;

    const bars = data.map((d, i) => {
      const barHeight = (d.value / maxValue) * chartHeight;
      const x = startX + i * (barWidth + gap);
      const y = height - 30 - barHeight;
      const barColor = d.color || color;

      return `
        <g class="chart-bar__group">
          <rect
            x="${x}"
            y="${y}"
            width="${barWidth}"
            height="${barHeight}"
            fill="${barColor}"
            rx="4"
            class="chart-bar__bar"
          >
            <title>${d.label}: ${d.value}</title>
          </rect>
          ${showValues && d.value > 0 ? `
            <text
              x="${x + barWidth / 2}"
              y="${y - 5}"
              text-anchor="middle"
              fill="${this.colors.text}"
              font-size="11"
              font-weight="600"
            >${d.value}</text>
          ` : ''}
          ${showLabels ? `
            <text
              x="${x + barWidth / 2}"
              y="${height - 8}"
              text-anchor="middle"
              fill="${this.colors.textMuted}"
              font-size="10"
            >${d.label}</text>
          ` : ''}
        </g>
      `;
    });

    return `
      <div class="chart chart--bar">
        ${title ? `<h3 class="chart__title">${title}</h3>` : ''}
        <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${i18n.t('chart.barLabel')}">
          ${bars.join('')}
        </svg>
      </div>
    `;
  },

  // ═══════════════════════════════════════════════════════════════
  // MULTI-LINE CHART - Évolution multi-métriques
  // ═══════════════════════════════════════════════════════════════

  /**
   * Génère un graphique multi-courbes avec légende interactive
   * @param {Object} series - { seriesId: { data: [{value, label}], color, name, visible } }
   * @param {Object} options - { width, height, showLegend, showDots }
   * @returns {string} SVG HTML
   */
  multiLine(series, options = {}) {
    const {
      width = 400,
      height = 200,
      showLegend = true,
      showDots = false,
      showGrid = true
    } = options;

    const visibleSeries = Object.entries(series).filter(([_, s]) => s.visible !== false);

    // Légende (toujours affichée pour permettre de réactiver les séries)
    const legendHtml = showLegend ? `
      <div class="chart__multiline-legend" id="multiline-legend">
        ${Object.entries(series).map(([id, s]) => `
          <label class="chart__legend-toggle ${s.visible === false ? 'chart__legend-toggle--hidden' : ''}">
            <input type="checkbox" data-series="${id}" ${s.visible !== false ? 'checked' : ''} />
            <span class="chart__legend-color" style="background: ${s.color}"></span>
            <span class="chart__legend-name">${s.name}</span>
          </label>
        `).join('')}
      </div>
    ` : '';

    // Si aucune série visible, afficher un message mais garder la légende
    if (visibleSeries.length === 0) {
      return `
        <div class="chart chart--multiline">
          ${this._emptyChart(width, i18n.t('chart.selectMetric'), height)}
          ${legendHtml}
        </div>
      `;
    }

    // Vérifier qu'il y a des données
    const hasData = visibleSeries.some(([_, s]) => s.data && s.data.length >= 2);
    if (!hasData) {
      return `
        <div class="chart chart--multiline">
          ${this._emptyChart(width, i18n.t('chart.insufficientData'), height)}
          ${legendHtml}
        </div>
      `;
    }

    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Trouver le max global pour l'échelle
    let globalMax = 1;
    let dataLength = 0;
    visibleSeries.forEach(([_, s]) => {
      if (s.data && s.data.length > 0) {
        const max = Math.max(...s.data.map(d => d.value));
        if (max > globalMax) globalMax = max;
        if (s.data.length > dataLength) dataLength = s.data.length;
      }
    });

    // Labels X (du premier series avec données)
    const firstSeriesWithData = visibleSeries.find(([_, s]) => s.data && s.data.length > 0);
    const xLabels = firstSeriesWithData ? firstSeriesWithData[1].data : [];

    // Grille
    const gridLines = [];
    if (showGrid) {
      const gridCount = 4;
      for (let i = 0; i <= gridCount; i++) {
        const y = padding.top + (i / gridCount) * chartHeight;
        const value = Math.round(globalMax - (i / gridCount) * globalMax);
        gridLines.push(`
          <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"
                stroke="${this.colors.border}" stroke-dasharray="4,4" />
          <text x="${padding.left - 8}" y="${y + 4}" text-anchor="end"
                fill="${this.colors.textMuted}" font-size="10">${value}</text>
        `);
      }
    }

    // Générer les courbes
    const paths = [];
    const dots = [];

    visibleSeries.forEach(([id, s]) => {
      if (!s.data || s.data.length < 2) return;

      const points = s.data.map((d, i) => {
        const x = padding.left + (i / (s.data.length - 1)) * chartWidth;
        const y = padding.top + chartHeight - (d.value / globalMax) * chartHeight;
        return { x, y, value: d.value, label: d.label };
      });

      const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

      paths.push(`
        <path d="${linePath}" fill="none" stroke="${s.color}" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round" class="chart-multiline__path"
              data-series="${id}" />
      `);

      if (showDots) {
        points.forEach(p => {
          dots.push(`
            <circle cx="${p.x}" cy="${p.y}" r="3" fill="${s.color}" class="chart-multiline__dot">
              <title>${s.name}: ${p.value}</title>
            </circle>
          `);
        });
      }
    });

    return `
      <div class="chart chart--multiline">
        <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"
             role="img" aria-label="${i18n.t('chart.evolutionLabel')}" id="multiline-svg">
          ${gridLines.join('')}
          ${paths.join('')}
          ${dots.join('')}
          <!-- Labels X (afficher quelques dates) -->
          ${xLabels.length > 0 && xLabels.length <= 10 ? xLabels.map((d, i) => {
            const x = padding.left + (i / (xLabels.length - 1)) * chartWidth;
            return `<text x="${x}" y="${height - 8}" text-anchor="middle"
                          fill="${this.colors.textMuted}" font-size="9">${d.label}</text>`;
          }).join('') : ''}
        </svg>
        ${legendHtml}
      </div>
    `;
  },

  // ═══════════════════════════════════════════════════════════════
  // HEATMAP - Calendrier d'activité
  // ═══════════════════════════════════════════════════════════════

  /**
   * Génère un calendrier d'activité (style GitHub)
   * @param {Object} data - { 'YYYY-MM-DD': count }
   * @param {Object} options - { weeks, cellSize, colors }
   * @returns {string} SVG HTML
   */
  heatmap(data, options = {}) {
    const {
      weeks = 12,
      cellSize = 12,
      gap = 3,
      title = ''
    } = options;

    const colors = [
      this.colors.bg,
      '#2a4a3c',  // Vert très léger
      '#3d6b4f',  // Vert léger
      '#4d8c63',  // Vert moyen
      this.colors.green  // Vert vif
    ];

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (weeks * 7));

    // Ajuster au début de la semaine (lundi)
    const dayOfWeek = startDate.getDay();
    const adjustedStart = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(startDate.getDate() - adjustedStart);

    const width = (weeks + 1) * (cellSize + gap) + 30;
    const height = 7 * (cellSize + gap) + 30;

    const cells = [];
    const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

    // Trouver le max pour la normalisation
    const maxCount = Math.max(...Object.values(data), 1);

    let currentDate = new Date(startDate);
    let weekIndex = 0;

    while (currentDate <= today) {
      const dayIndex = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1;
      const dateStr = TextUtils.getLocalDateString(currentDate);
      const count = data[dateStr] || 0;

      // Déterminer la couleur
      let colorIndex = 0;
      if (count > 0) {
        colorIndex = Math.min(Math.ceil((count / maxCount) * 4), 4);
      }

      const x = 30 + weekIndex * (cellSize + gap);
      const y = dayIndex * (cellSize + gap);

      cells.push(`
        <rect
          x="${x}"
          y="${y}"
          width="${cellSize}"
          height="${cellSize}"
          fill="${colors[colorIndex]}"
          rx="2"
          class="chart-heatmap__cell"
        >
          <title>${dateStr} : ${i18n.tn('chart.cardsCount', count)}</title>
        </rect>
      `);

      // Passer au jour suivant
      currentDate.setDate(currentDate.getDate() + 1);

      // Nouvelle semaine ?
      if (currentDate.getDay() === 1 || currentDate.getDay() === 0 && dayIndex === 6) {
        weekIndex++;
      }
    }

    // Labels des jours
    const dayLabelsSvg = dayLabels.map((label, i) => {
      if (i % 2 === 0) { // Afficher un jour sur deux
        return `
          <text
            x="20"
            y="${i * (cellSize + gap) + cellSize - 2}"
            text-anchor="end"
            fill="${this.colors.textMuted}"
            font-size="10"
          >${label}</text>
        `;
      }
      return '';
    }).join('');

    return `
      <div class="chart chart--heatmap">
        ${title ? `<h3 class="chart__title">${title}</h3>` : ''}
        <svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${i18n.t('chart.heatmapLabel')}">
          ${dayLabelsSvg}
          ${cells.join('')}
        </svg>
        <div class="chart__heatmap-legend">
          <span>${i18n.t('chart.less')}</span>
          ${colors.map(c => `<span class="chart__heatmap-legend-cell" style="background: ${c}"></span>`).join('')}
          <span>${i18n.t('chart.more')}</span>
        </div>
      </div>
    `;
  },

  // ═══════════════════════════════════════════════════════════════
  // UTILITAIRES
  // ═══════════════════════════════════════════════════════════════

  _emptyChart(width, message = i18n.t('chart.noData'), height = null) {
    const h = height || width;
    return `
      <div class="chart chart--empty">
        <svg viewBox="0 0 ${width} ${h}" width="${width}" height="${h}">
          <text
            x="${width / 2}"
            y="${h / 2}"
            text-anchor="middle"
            fill="${this.colors.textMuted}"
            font-size="14"
          >${message}</text>
        </svg>
      </div>
    `;
  },

  /**
   * Génère les données de distribution des cartes
   * @param {Array} decks - Liste des decks
   * @returns {Array} Données pour donut chart
   */
  getCardDistribution(decks) {
    const distribution = {
      never_played: 0,
      purple: 0,
      orange: 0,
      green: 0
    };

    (decks || []).forEach(deck => {
      if (deck.cards) {
        deck.cards.forEach(card => {
          const box = card.box || 'never_played';
          if (distribution.hasOwnProperty(box)) {
            distribution[box]++;
          }
        });
      }
    });

    return [
      { value: distribution.never_played, label: i18n.t('chart.box.new'), color: this.colors.gray },
      { value: distribution.purple, label: i18n.t('chart.box.purple'), color: this.colors.purple },
      { value: distribution.orange, label: i18n.t('chart.box.orange'), color: this.colors.orange },
      { value: distribution.green, label: i18n.t('chart.box.green'), color: this.colors.green }
    ];
  },

  /**
   * Génère les données d'activité des 7 derniers jours
   * @param {Object} player - Joueur
   * @returns {Array} Données pour bar chart
   */
  getWeeklyActivity(player) {
        const today = new Date();
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = TextUtils.getLocalDateString(date);

      // Compter les cartes jouées ce jour-là
      let count = 0;
      if (player.stats?.xpHistory) {
        player.stats.xpHistory.forEach(entry => {
          if (entry.date === dateStr && entry.source === 'session') {
            count += entry.cardsPlayed || 1;
          }
        });
      }

      data.push({
        value: count,
        label: i18n.formatDate(date, { weekday: 'short' }),
        date: dateStr
      });
    }

    return data;
  },

  /**
   * Génère les données du heatmap d'activité
   * @param {Object} player - Joueur
   * @returns {Object} { 'YYYY-MM-DD': count }
   */
  getActivityHeatmap(player) {
    const data = {};

    if (player.stats?.xpHistory) {
      player.stats.xpHistory.forEach(entry => {
        if (entry.source === 'session') {
          if (!data[entry.date]) {
            data[entry.date] = 0;
          }
          data[entry.date] += entry.cardsPlayed || 1;
        }
      });
    }

    return data;
  },

  /**
   * Génère les données d'évolution multi-métriques pour le graphique
   * @param {Object} player - Joueur
   * @param {number} days - Nombre de jours
   * @returns {Object} Series pour multiLine chart
   */
  getEvolutionData(player, days = 30) {
    const today = new Date();
    const dates = [];

    // Générer la liste des dates
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push({
        date: TextUtils.getLocalDateString(date),
        label: `${date.getDate()}/${date.getMonth() + 1}`
      });
    }

    // Agréger les données par date depuis xpHistory
    const dataByDate = {};
    dates.forEach(d => {
      dataByDate[d.date] = { xp: 0, cards: 0, sessions: 0 };
    });

    if (player.stats?.xpHistory) {
      player.stats.xpHistory.forEach(entry => {
        if (dataByDate[entry.date]) {
          dataByDate[entry.date].xp += entry.amount || 0;
          if (entry.source === 'session') {
            dataByDate[entry.date].cards += entry.cardsPlayed || 1;
            dataByDate[entry.date].sessions++;
          }
        }
      });
    }

    // Construire les séries
    let cumulativeXP = 0;
    const xpData = [];
    const xpDailyData = [];
    const cardsData = [];

    dates.forEach(d => {
      const dayData = dataByDate[d.date];
      cumulativeXP += dayData.xp;

      xpData.push({ value: cumulativeXP, label: d.label, date: d.date });
      xpDailyData.push({ value: dayData.xp, label: d.label, date: d.date });
      cardsData.push({ value: dayData.cards, label: d.label, date: d.date });
    });

    // Si pas d'historique, utiliser le total actuel pour le dernier point XP cumulé
    if (xpData.every(d => d.value === 0) && player.stats?.totalXP) {
      xpData[xpData.length - 1].value = player.stats.totalXP;
    }

    return {
      xpCumulative: {
        data: xpData,
        color: this.colors.purple,
        name: i18n.t('chart.xpCumulative'),
        visible: true
      },
      xpDaily: {
        data: xpDailyData,
        color: this.colors.blue,
        name: i18n.t('chart.xpPerDay'),
        visible: false
      },
      cards: {
        data: cardsData,
        color: this.colors.green,
        name: i18n.t('chart.cardsPerDay'),
        visible: false
      }
    };
  },

  // ═══════════════════════════════════════════════════════════════
  // CALCULS STATISTIQUES AVANCÉS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Calcule les stats pour une période donnée
   * @param {Object} player - Joueur
   * @param {string} startDate - Date de début (ISO)
   * @param {string} endDate - Date de fin (ISO)
   * @returns {Object} { xp, cardsPlayed, sessions }
   */
  getStatsForPeriod(player, startDate, endDate) {
    const stats = { xp: 0, cardsPlayed: 0, sessions: 0 };

    if (!player.stats?.xpHistory) return stats;

    player.stats.xpHistory.forEach(entry => {
      if (entry.date >= startDate && entry.date <= endDate) {
        stats.xp += entry.amount || 0;
        if (entry.source === 'session') {
          stats.cardsPlayed += entry.cardsPlayed || 1;
          stats.sessions++;
        }
      }
    });

    return stats;
  },

  /**
   * Calcule les stats comparatives (aujourd'hui vs hier, cette semaine vs semaine dernière, etc.)
   * @param {Object} player - Joueur
   * @returns {Object} Statistiques comparatives avec diff
   */
  getComparativeStats(player) {
    const today = new Date();
    const todayStr = TextUtils.getLocalDateString(today);

    // Helper pour obtenir les dates de début/fin de période
    const getPeriodDates = (daysAgo, periodLength) => {
      const end = new Date(today);
      end.setDate(end.getDate() - daysAgo);
      const start = new Date(end);
      start.setDate(start.getDate() - periodLength + 1);
      return {
        start: TextUtils.getLocalDateString(start),
        end: TextUtils.getLocalDateString(end)
      };
    };

    // Aujourd'hui vs Hier
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = TextUtils.getLocalDateString(yesterday);

    const todayStats = this.getStatsForPeriod(player, todayStr, todayStr);
    const yesterdayStats = this.getStatsForPeriod(player, yesterdayStr, yesterdayStr);

    // Cette semaine vs semaine dernière (7 jours)
    const thisWeek = getPeriodDates(0, 7);
    const lastWeek = getPeriodDates(7, 7);
    const thisWeekStats = this.getStatsForPeriod(player, thisWeek.start, thisWeek.end);
    const lastWeekStats = this.getStatsForPeriod(player, lastWeek.start, lastWeek.end);

    // Ce mois vs mois dernier (30 jours)
    const thisMonth = getPeriodDates(0, 30);
    const lastMonth = getPeriodDates(30, 30);
    const thisMonthStats = this.getStatsForPeriod(player, thisMonth.start, thisMonth.end);
    const lastMonthStats = this.getStatsForPeriod(player, lastMonth.start, lastMonth.end);

    // Helper pour calculer le diff en pourcentage
    const calcDiff = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      daily: {
        current: todayStats,
        previous: yesterdayStats,
        diff: {
          xp: calcDiff(todayStats.xp, yesterdayStats.xp),
          cards: calcDiff(todayStats.cardsPlayed, yesterdayStats.cardsPlayed)
        }
      },
      weekly: {
        current: thisWeekStats,
        previous: lastWeekStats,
        diff: {
          xp: calcDiff(thisWeekStats.xp, lastWeekStats.xp),
          cards: calcDiff(thisWeekStats.cardsPlayed, lastWeekStats.cardsPlayed)
        }
      },
      monthly: {
        current: thisMonthStats,
        previous: lastMonthStats,
        diff: {
          xp: calcDiff(thisMonthStats.xp, lastMonthStats.xp),
          cards: calcDiff(thisMonthStats.cardsPlayed, lastMonthStats.cardsPlayed)
        }
      }
    };
  },

  /**
   * Calcule les moyennes globales
   * @param {Object} player - Joueur
   * @param {Array} decks - Liste des decks
   * @returns {Object} Moyennes (cards/jour, XP/jour, temps réponse, précision)
   */
  getGlobalAverages(player, decks) {
    // Nombre de jours depuis la création du compte
    const createdAt = player.createdAt ? new Date(player.createdAt) : new Date();
    const daysSinceCreation = Math.max(1, Math.ceil((Date.now() - createdAt) / (1000 * 60 * 60 * 24)));

    // Moyennes basées sur l'historique
    const cardsPerDay = player.stats?.totalCardsPlayed
      ? Math.round((player.stats.totalCardsPlayed / daysSinceCreation) * 10) / 10
      : 0;

    const xpPerDay = player.stats?.totalXP
      ? Math.round((player.stats.totalXP / daysSinceCreation) * 10) / 10
      : 0;

    // Calcul du temps de réponse moyen et de la précision depuis les cartes
    let totalResponseTime = 0;
    let totalTimesPlayed = 0;
    let totalTimesCorrect = 0;
    let cardsWithResponseTime = 0;

    (decks || []).forEach(deck => {
      (deck.cards || []).forEach(card => {
        if (card.timesPlayed > 0) {
          totalTimesPlayed += card.timesPlayed;
          totalTimesCorrect += card.timesCorrect || 0;
        }
        if (card.lastResponseTimeMs) {
          totalResponseTime += card.lastResponseTimeMs;
          cardsWithResponseTime++;
        }
      });
    });

    const avgResponseTimeMs = cardsWithResponseTime > 0
      ? Math.round(totalResponseTime / cardsWithResponseTime)
      : 0;

    const accuracy = totalTimesPlayed > 0
      ? Math.round((totalTimesCorrect / totalTimesPlayed) * 100)
      : 0;

    return {
      cardsPerDay,
      xpPerDay,
      avgResponseTimeMs,
      avgResponseTimeSec: Math.round(avgResponseTimeMs / 100) / 10, // Arrondi à 0.1s
      accuracy,
      totalTimesPlayed,
      totalTimesCorrect,
      daysSinceCreation
    };
  },

  /**
   * Calcule les stats détaillées d'un deck
   * @param {Object} deck - Deck à analyser
   * @returns {Object} Stats du deck
   */
  getDeckDetailedStats(deck) {
    const cards = deck.cards || [];
    const distribution = { never_played: 0, purple: 0, orange: 0, green: 0 };

    let totalResponseTime = 0;
    let totalTimesPlayed = 0;
    let totalTimesCorrect = 0;
    let cardsWithResponseTime = 0;
    let bestResponseTime = Infinity;
    let worstResponseTime = 0;

    cards.forEach(card => {
      const box = card.box || 'never_played';
      if (distribution.hasOwnProperty(box)) {
        distribution[box]++;
      }

      if (card.timesPlayed > 0) {
        totalTimesPlayed += card.timesPlayed;
        totalTimesCorrect += card.timesCorrect || 0;
      }

      if (card.lastResponseTimeMs) {
        totalResponseTime += card.lastResponseTimeMs;
        cardsWithResponseTime++;

        if (card.bestResponseTimeMs) {
          bestResponseTime = Math.min(bestResponseTime, card.bestResponseTimeMs);
        }
        worstResponseTime = Math.max(worstResponseTime, card.lastResponseTimeMs);
      }
    });

    const avgResponseTimeMs = cardsWithResponseTime > 0
      ? Math.round(totalResponseTime / cardsWithResponseTime)
      : 0;

    const accuracy = totalTimesPlayed > 0
      ? Math.round((totalTimesCorrect / totalTimesPlayed) * 100)
      : 0;

    const progress = cards.length > 0
      ? Math.round((distribution.green / cards.length) * 100)
      : 0;

    return {
      totalCards: cards.length,
      distribution,
      accuracy,
      avgResponseTimeMs,
      avgResponseTimeSec: Math.round(avgResponseTimeMs / 100) / 10,
      bestResponseTimeMs: bestResponseTime === Infinity ? 0 : bestResponseTime,
      worstResponseTimeMs: worstResponseTime,
      totalTimesPlayed,
      totalTimesCorrect,
      progress,
      cardsPlayed: cards.length - distribution.never_played
    };
  },

  /**
   * Options de période communes (réutilisable)
   */
  PERIOD_OPTIONS: {
    xp: [
      { days: 7, get label() { return i18n.t('chart.periodDays', { n: 7 }); } },
      { days: 14, get label() { return i18n.t('chart.periodDays', { n: 14 }); } },
      { days: 30, get label() { return i18n.t('chart.periodDays', { n: 30 }); } },
      { days: 90, get label() { return i18n.t('chart.periodDays', { n: 90 }); } }
    ],
    calendar: [
      { weeks: 4, get label() { return i18n.tn('chart.periodMonths', 1); } },
      { weeks: 8, get label() { return i18n.tn('chart.periodMonths', 2); } },
      { weeks: 12, get label() { return i18n.tn('chart.periodMonths', 3); } },
      { weeks: 26, get label() { return i18n.tn('chart.periodMonths', 6); } },
      { weeks: 52, get label() { return i18n.t('chart.periodYear'); } }
    ]
  }
};

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Charts };
}
