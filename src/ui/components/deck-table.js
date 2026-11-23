/**
 * Composant tableau compact pour afficher les decks
 * - Desktop: Vue tableau (Alt 3)
 * - Mobile: Mini-cards (Alt 4)
 * - Tri sur colonnes cliquables
 * - Mode sélection par lot
 *
 * @module ComponentsDeckTable
 */

const DeckTable = {
  // État de tri actuel
  _sortState: {
    column: null,    // 'name', 'cards', 'progress', 'available'
    direction: 'asc' // 'asc' ou 'desc'
  },

  // État du mode sélection par lot
  _selectionMode: false,
  _selectedDecks: new Set(),

  // État des filtres de source actifs (tous activés par défaut)
  _sourceFilters: {
    procedural: true,  // Généré procéduralement
    ai: true,          // Généré par IA
    human: true        // Créé par un humain
  },

  // Configuration des sources
  SOURCE_CONFIG: {
    procedural: { icon: '⚙️', get label() { return i18n.t('deckTable.source.procedural'); }, get desc() { return i18n.t('deckTable.source.proceduralDesc'); } },
    ai: { icon: '🤖', get label() { return i18n.t('deckTable.source.ai'); }, get desc() { return i18n.t('deckTable.source.aiDesc'); } },
    human: { icon: '👤', get label() { return i18n.t('deckTable.source.human'); }, get desc() { return i18n.t('deckTable.source.humanDesc'); } }
  },

  // Colonnes triables avec leurs configurations
  SORTABLE_COLUMNS: {
    name: { get label() { return i18n.t('deckTable.col.deck'); }, getValue: (deck, stats) => deck.name.toLowerCase() },
    source: { get label() { return i18n.t('deckTable.col.source'); }, getValue: (deck, stats) => DeckTable._getSourceType(deck) },
    cards: { get label() { return i18n.t('deckTable.col.cards'); }, getValue: (deck, stats) => stats.total },
    progress: { get label() { return i18n.t('deckTable.col.progress'); }, getValue: (deck, stats) => stats.progress },
    available: { get label() { return i18n.t('deckTable.col.available'); }, getValue: (deck, stats) => stats.playableCount },
    actions: { get label() { return i18n.t('deckTable.col.actions'); }, getValue: (deck, stats, options) => DeckTable._countActions(deck, options) }
  },

  /**
   * Génère le HTML du tableau de decks
   * @param {Array<Deck>} decks - Liste des decks
   * @param {Object} options - Options de rendu
   * @param {string} options.today - Date du jour (YYYY-MM-DD)
   * @param {Array<string>} [options.customDeckIds] - IDs des decks personnalisés
   * @param {Function} [options.onPlay] - Callback au clic sur jouer
   * @param {Array<string>} [options.hiddenDeckIds] - IDs des decks masqués
   * @param {boolean} [options.allowBuiltinDeletion] - Autoriser la suppression des decks builtin
   * @param {boolean} [options.showFilters] - Afficher les filtres de source (défaut: true)
   * @returns {string} HTML du tableau
   */
  render(decks, options = {}) {
    const { today, customDeckIds = [], hiddenDeckIds = [], allowBuiltinDeletion = false, showFilters = true } = options;
    const _t = typeof PageUtils !== 'undefined' ? PageUtils.getTranslator() : (k) => k;

    if (!decks || decks.length === 0) {
      return `<p class="deck-table__empty">${_t('home.noCardsToday')} 🎉</p>`;
    }

    // Pré-calculer les stats pour le tri
    const decksWithStats = decks.map(deck => {
      const stats = typeof PageUtils !== 'undefined'
        ? PageUtils.getDeckStats(deck, today)
        : this._getFallbackStats(deck);
      const progress = stats.total > 0
        ? Math.round(((stats.counts.green + stats.counts.orange) / stats.total) * 100)
        : 0;
      return { deck, stats: { ...stats, progress } };
    });

    // Filtrer par source
    const filteredDecks = this._filterBySource(decksWithStats);

    // Trier si un tri est actif
    const sortedDecks = this._sortDecks(filteredDecks);

    // IDs des decks visibles pour le "select all"
    const visibleDeckIds = sortedDecks.map(({ deck }) => deck.id);

    const rows = sortedDecks.map(({ deck, stats }) => this._renderRow(deck, {
      today,
      isCustom: customDeckIds.includes(deck.id),
      isHidden: hiddenDeckIds.includes(deck.id),
      allowBuiltinDeletion,
      _t,
      precomputedStats: stats
    })).join('');

    // Compteur de decks visibles vs total
    const visibleCount = sortedDecks.length;
    const totalCount = decksWithStats.length;
    const filterInfo = visibleCount < totalCount
      ? `<span class="deck-table__filter-info">${i18n.t('deckTable.shown', { visible: visibleCount, total: totalCount })}</span>`
      : '';

    // Checkbox "select all" dans le header si en mode sélection
    const selectAllHeader = this._selectionMode
      ? `<div class="deck-table__th deck-table__th--select" role="columnheader">
           <label class="deck-table__select-all-label">
             <input type="checkbox"
                    class="deck-table__select-all"
                    data-visible-ids="${escapeHtml(visibleDeckIds.join(","))}"
                    ${this._areAllSelected(visibleDeckIds) ? 'checked' : ''}>
             <span class="sr-only">${i18n.t('deckTable.selectAll')}</span>
           </label>
         </div>`
      : '';

    return `
      <div class="deck-table__filters">
        ${showFilters ? this._renderSourceFilters() : ''}
        ${this._renderSelectionToggle()}
      </div>
      ${filterInfo}
      ${this._renderBatchActionBar()}
      <div class="deck-table ${this._selectionMode ? 'deck-table--selection-mode' : ''}" role="table" aria-label="${_t('home.decksToReview')}">
        <div class="deck-table__header" role="row">
          ${selectAllHeader}
          ${this._renderSortableHeader('name', i18n.t('deckTable.col.deck'))}
          ${this._renderSortableHeader('source', i18n.t('deckTable.col.source'))}
          ${this._renderSortableHeader('cards', i18n.t('deckTable.col.cards'))}
          ${this._renderSortableHeader('progress', i18n.t('deckTable.col.progress'))}
          ${this._renderSortableHeader('available', i18n.t('deckTable.col.available'))}
          ${this._renderSortableHeader('actions', i18n.t('deckTable.col.actions'))}
        </div>
        <div class="deck-table__body" role="rowgroup">
          ${rows}
        </div>
      </div>
    `;
  },

  /**
   * Vérifie si tous les decks visibles sont sélectionnés
   * @private
   * @param {Array<string>} visibleDeckIds
   * @returns {boolean}
   */
  _areAllSelected(visibleDeckIds) {
    if (visibleDeckIds.length === 0) return false;
    return visibleDeckIds.every(id => this._selectedDecks.has(id));
  },

  /**
   * Génère les checkboxes de filtre par source
   * @private
   */
  _renderSourceFilters() {
    const filters = Object.entries(this.SOURCE_CONFIG).map(([source, config]) => {
      const isChecked = this._sourceFilters[source] ? 'checked' : '';
      return `
        <label class="deck-table__source-filter" title="${config.desc}">
          <input type="checkbox"
                 class="deck-table__source-checkbox"
                 data-source="${source}"
                 ${isChecked}>
          <span class="deck-table__source-badge">${config.icon} ${config.label}</span>
        </label>
      `;
    }).join('');

    return `
      <div class="deck-table__source-filters">
        <span class="deck-table__source-label">${i18n.t('deckTable.filterSource')}</span>
        ${filters}
      </div>
    `;
  },

  /**
   * Filtre les decks selon les filtres de source actifs
   * @private
   */
  _filterBySource(decksWithStats) {
    // Si tous les filtres sont actifs, pas besoin de filtrer
    const allActive = Object.values(this._sourceFilters).every(v => v);
    if (allActive) return decksWithStats;

    return decksWithStats.filter(({ deck }) => {
      const sourceType = this._getSourceType(deck);
      return this._sourceFilters[sourceType];
    });
  },

  /**
   * Active/désactive un filtre de source
   * @param {string} source - Type de source à toggle
   */
  toggleSourceFilter(source) {
    if (this._sourceFilters.hasOwnProperty(source)) {
      this._sourceFilters[source] = !this._sourceFilters[source];
    }
  },

  /**
   * Définit l'état d'un filtre de source
   * @param {string} source - Type de source
   * @param {boolean} active - État actif/inactif
   */
  setSourceFilter(source, active) {
    if (this._sourceFilters.hasOwnProperty(source)) {
      this._sourceFilters[source] = active;
    }
  },

  /**
   * Réinitialise tous les filtres de source (tous actifs)
   */
  resetSourceFilters() {
    Object.keys(this._sourceFilters).forEach(source => {
      this._sourceFilters[source] = true;
    });
  },

  // ═══════════════════════════════════════════════════════════════
  // SÉLECTION PAR LOT
  // ═══════════════════════════════════════════════════════════════

  /**
   * Active/désactive le mode sélection
   */
  toggleSelectionMode() {
    this._selectionMode = !this._selectionMode;
    if (!this._selectionMode) {
      this._selectedDecks.clear();
    }
  },

  /**
   * Définit le mode sélection
   * @param {boolean} active
   */
  setSelectionMode(active) {
    this._selectionMode = active;
    if (!active) {
      this._selectedDecks.clear();
    }
  },

  /**
   * Sélectionne/désélectionne un deck
   * @param {string} deckId
   */
  toggleDeckSelection(deckId) {
    if (this._selectedDecks.has(deckId)) {
      this._selectedDecks.delete(deckId);
    } else {
      this._selectedDecks.add(deckId);
    }
  },

  /**
   * Sélectionne tous les decks visibles
   * @param {Array<string>} deckIds - IDs des decks visibles
   */
  selectAll(deckIds) {
    deckIds.forEach(id => this._selectedDecks.add(id));
  },

  /**
   * Désélectionne tous les decks
   */
  deselectAll() {
    this._selectedDecks.clear();
  },

  /**
   * Retourne les IDs des decks sélectionnés
   * @returns {Array<string>}
   */
  getSelectedDecks() {
    return Array.from(this._selectedDecks);
  },

  /**
   * Vérifie si un deck est sélectionné
   * @param {string} deckId
   * @returns {boolean}
   */
  isDeckSelected(deckId) {
    return this._selectedDecks.has(deckId);
  },

  /**
   * Retourne le nombre de decks sélectionnés
   * @returns {number}
   */
  getSelectionCount() {
    return this._selectedDecks.size;
  },

  /**
   * Génère le bouton de mode sélection
   * @private
   */
  _renderSelectionToggle() {
    const isActive = this._selectionMode;
    const selectedCount = this._selectedDecks.size;

    return `
      <div class="deck-table__selection-controls">
        <button class="deck-table__selection-toggle ${isActive ? 'deck-table__selection-toggle--active' : ''}"
                data-action="toggle-selection-mode"
                title="${isActive ? i18n.t('deckTable.selectionOff') : i18n.t('deckTable.selectionOn')}">
          ${isActive ? '✓ ' + i18n.t('deckTable.selectionActive') : '☐ ' + i18n.t('deckTable.select')}
        </button>
        ${isActive && selectedCount > 0 ? `<span class="deck-table__selection-count">${i18n.tn('deckTable.selected', selectedCount)}</span>` : ''}
      </div>
    `;
  },

  /**
   * Génère la barre d'actions par lot
   * @private
   * @param {Object} options
   */
  _renderBatchActionBar(options = {}) {
    const selectedCount = this._selectedDecks.size;
    if (!this._selectionMode || selectedCount === 0) {
      return '';
    }

    return `
      <div class="deck-table__batch-actions">
        <div class="deck-table__batch-info">
          <span class="deck-table__batch-count">${i18n.tn('merger.selectedCount', selectedCount)}</span>
        </div>
        <div class="deck-table__batch-buttons">
          <button class="deck-table__batch-btn deck-table__batch-btn--hide"
                  data-batch-action="hide"
                  title="${i18n.t('deckTable.hideSelected')}">
            🙈 ${i18n.t('deckTable.hide')}
          </button>
          <button class="deck-table__batch-btn deck-table__batch-btn--unhide"
                  data-batch-action="unhide"
                  title="${i18n.t('deckTable.showSelected')}">
            🙉 ${i18n.t('deckTable.show')}
          </button>
          <button class="deck-table__batch-btn deck-table__batch-btn--export"
                  data-batch-action="export"
                  title="${i18n.t('deckTable.exportSelected')}">
            📥 ${i18n.t('common.export')}
          </button>
          <button class="deck-table__batch-btn deck-table__batch-btn--reset"
                  data-batch-action="reset"
                  title="${i18n.t('deckTable.resetProgress')}">
            🔄 ${i18n.t('deckTable.resetProgress')}
          </button>
          <button class="deck-table__batch-btn deck-table__batch-btn--delete"
                  data-batch-action="delete"
                  title="${i18n.t('deckTable.deleteSelected')}">
            🗑️ ${i18n.t('common.delete')}
          </button>
          <button class="deck-table__batch-btn deck-table__batch-btn--cancel"
                  data-batch-action="cancel"
                  title="${i18n.t('deckTable.cancelSelection')}">
            ✖ ${i18n.t('common.cancel')}
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Génère un en-tête de colonne triable
   * @private
   */
  _renderSortableHeader(column, label) {
    const isActive = this._sortState.column === column;
    const direction = isActive ? this._sortState.direction : null;
    const nextDirection = isActive && direction === 'asc' ? 'desc' : 'asc';

    const sortIcon = isActive
      ? (direction === 'asc' ? '▲' : '▼')
      : '⇅';

    const ariaSort = isActive
      ? (direction === 'asc' ? 'ascending' : 'descending')
      : 'none';

    return `
      <button class="deck-table__th deck-table__th--${column} deck-table__th--sortable ${isActive ? 'deck-table__th--active' : ''}"
              role="columnheader"
              aria-sort="${ariaSort}"
              data-sort-column="${column}"
              data-sort-direction="${nextDirection}"
              title="${i18n.t('deckTable.sortBy', { label })}">
        <span class="deck-table__th-label">${label}</span>
        <span class="deck-table__th-sort-icon">${sortIcon}</span>
      </button>
    `;
  },

  /**
   * Trie les decks selon l'état actuel
   * @private
   */
  _sortDecks(decksWithStats) {
    if (!this._sortState.column) {
      return decksWithStats;
    }

    const { column, direction } = this._sortState;
    const config = this.SORTABLE_COLUMNS[column];
    if (!config) return decksWithStats;

    const sorted = [...decksWithStats].sort((a, b) => {
      const valueA = config.getValue(a.deck, a.stats);
      const valueB = config.getValue(b.deck, b.stats);

      let comparison = 0;
      if (typeof valueA === 'string') {
        comparison = valueA.localeCompare(valueB);
      } else {
        comparison = valueA - valueB;
      }

      return direction === 'desc' ? -comparison : comparison;
    });

    return sorted;
  },

  /**
   * Définit le tri actuel
   * @param {string} column - Colonne à trier
   * @param {string} direction - Direction ('asc' ou 'desc')
   */
  setSort(column, direction) {
    this._sortState.column = column;
    this._sortState.direction = direction;
  },

  /**
   * Réinitialise le tri
   */
  resetSort() {
    this._sortState.column = null;
    this._sortState.direction = 'asc';
  },

  /**
   * Génère une ligne du tableau
   * @private
   */
  _renderRow(deck, options) {
    const { today, isCustom, isHidden, allowBuiltinDeletion, _t, precomputedStats } = options;

    // Utiliser les stats pré-calculées si disponibles (pour le tri)
    const stats = precomputedStats || (typeof PageUtils !== 'undefined'
      ? PageUtils.getDeckStats(deck, today)
      : this._getFallbackStats(deck));

    const { total, counts, playableCount, restInfo } = stats;
    const isResting = playableCount === 0 && restInfo !== null;
    const progress = stats.progress !== undefined
      ? stats.progress
      : (total > 0 ? Math.round(((counts.green + counts.orange) / total) * 100) : 0);

    // Icône du deck basée sur la catégorie
    const icon = this._getDeckIcon(deck);

    // Barre de progression
    const progressBar = this._renderProgressBar(progress, isResting, restInfo);

    // Classes de ligne
    const rowClasses = [
      'deck-table__row',
      isResting ? 'deck-table__row--resting' : '',
      playableCount === 0 && !isResting ? 'deck-table__row--empty' : ''
    ].filter(Boolean).join(' ');

    const _escapeHtml = typeof escapeHtml === 'function' ? escapeHtml : (t) => t;

    // Source du deck
    const sourceInfo = this._renderSource(deck);

    // Indicateurs spéciaux
    const hasAudio = this._hasAudioMedia(deck);
    const audioIndicator = hasAudio
      ? `<span class="deck-table__audio-indicator" title="${i18n.t('deckTable.hasAudio')}" aria-label="${i18n.t('deckTable.hasAudio')}">🔊</span>`
      : '';

    // Checkbox de sélection si en mode sélection
    const isSelected = this._selectedDecks.has(deck.id);
    const selectionCell = this._selectionMode
      ? `<div class="deck-table__td deck-table__td--select" role="cell">
           <label class="deck-table__row-select-label">
             <input type="checkbox"
                    class="deck-table__row-checkbox"
                    data-deck-id="${_escapeHtml(deck.id)}"
                    ${isSelected ? 'checked' : ''}>
             <span class="sr-only">${i18n.t('merger.selectDeck', { name: _escapeHtml(deck.name) })}</span>
           </label>
         </div>`
      : '';

    // Classes additionnelles pour la sélection
    const selectionClasses = isSelected ? ' deck-table__row--selected' : '';

    return `
      <div class="${rowClasses}${selectionClasses}" role="row" data-deck-id="${_escapeHtml(deck.id)}">
        ${selectionCell}
        <div class="deck-table__td deck-table__td--name" role="cell">
          <span class="deck-table__icon">${icon}</span>
          <span class="deck-table__name">${_escapeHtml(deck.name)}</span>
          ${audioIndicator}
        </div>
        <div class="deck-table__td deck-table__td--source" role="cell">
          ${sourceInfo}
        </div>
        <div class="deck-table__td deck-table__td--cards" role="cell">
          <span class="deck-table__total">${total}</span>
        </div>
        <div class="deck-table__td deck-table__td--progress" role="cell">
          ${progressBar}
        </div>
        <div class="deck-table__td deck-table__td--available" role="cell">
          ${isResting
            ? `<span class="deck-table__resting">😴 ${restInfo.days}j</span>`
            : `<span class="deck-table__playable">${playableCount}</span>`
          }
        </div>
        <div class="deck-table__td deck-table__td--actions" role="cell">
          ${this._renderActions(deck, { isCustom, isHidden, allowDelete: isCustom || allowBuiltinDeletion, playableCount, isResting, _t })}
        </div>
      </div>
    `;
  },

  /**
   * Génère la barre de progression
   * @private
   */
  _renderProgressBar(progress, isResting, restInfo) {
    const barClass = isResting ? 'deck-table__progress--resting' : '';
    const segments = Math.round(progress / 10);
    const filled = '█'.repeat(segments);
    const empty = '░'.repeat(10 - segments);

    const _t = typeof PageUtils !== 'undefined' ? PageUtils.getTranslator() : (k) => k;
    const progressLabel = _t('deckTable.progressLabel', { progress });

    // Les caractères █░ sont décoratifs (masqués aux lecteurs d'écran) ; le pourcentage est l'équivalent texte
    return `
      <div class="deck-table__progress ${barClass}" title="${escapeHtml(progressLabel)}">
        <span class="deck-table__progress-bar" aria-hidden="true">${filled}${empty}</span>
        <span class="deck-table__progress-pct"><span class="sr-only">${escapeHtml(progressLabel)} </span><span aria-hidden="true">${progress}%</span></span>
      </div>
    `;
  },

  /**
   * Vérifie si un deck contient des médias audio dans ses cartes
   * @private
   * @param {Object} deck - Le deck à vérifier
   * @returns {boolean} - true si le deck a des cartes avec audio
   */
  _hasAudioMedia(deck) {
    const cards = deck.cards || [];
    return cards.some(card => {
      if (!card.media) return false;
      // Vérifier le type ou le format du média
      if (card.media.type === 'audio') return true;
      if (card.media.format && card.media.format.startsWith('audio/')) return true;
      // Vérifier aussi les ressources audio dans la question
      if (card.questionAudio || card.answerAudio) return true;
      return false;
    });
  },

  /**
   * Génère les boutons d'action
   * @private
   */
  _renderActions(deck, options) {
    const { isCustom, isHidden, allowDelete, playableCount, isResting, _t } = options;
    const _escapeHtml = typeof escapeHtml === 'function' ? escapeHtml : (t) => t;
    const hasResources = deck.resources && deck.resources.length > 0;

    // Actions fixes en colonnes
    // Ordre: [Resources] [Play] [Challenge] [Exam] [Review] [Hide/Show] [Export] [Delete]
    // RESSOURCES EN PREMIER !
    const resourcesBtn = hasResources
      ? `<button class="deck-table__btn deck-table__btn--resources"
                data-deck-id="${_escapeHtml(deck.id)}"
                title="${i18n.t('resources.title')}" aria-label="${i18n.t('resources.title')}">📚</button>`
      : `<span class="deck-table__btn deck-table__btn--placeholder" aria-hidden="true">·</span>`;

    const playBtn = playableCount > 0
      ? `<button class="deck-table__btn deck-table__btn--play"
                data-deck-id="${_escapeHtml(deck.id)}"
                title="${i18n.t('deckReview.play')}" aria-label="${i18n.t('deckReview.play')}">▶️</button>`
      : `<span class="deck-table__btn deck-table__btn--placeholder" aria-hidden="true">·</span>`;

    // Défi : une autre façon de réviser (decks standard seulement) ; mène au choix du mode
    const challengeBtn = deck.type !== 'multilingual'
      ? `<button class="deck-table__btn deck-table__btn--challenge"
                data-deck-id="${_escapeHtml(deck.id)}"
                title="${_escapeHtml(_t('challenge.deckAction'))}" aria-label="${_escapeHtml(_t('challenge.deckAction'))}">🎯</button>`
      : `<span class="deck-table__btn deck-table__btn--placeholder" aria-hidden="true">·</span>`;

    const examBtn = `<button class="deck-table__btn deck-table__btn--exam"
              data-deck-id="${_escapeHtml(deck.id)}"
              title="${i18n.t('deckTable.examMode')}" aria-label="${i18n.t('deckTable.examMode')}">📝</button>`;

    const reviewBtn = `<button class="deck-table__btn deck-table__btn--review"
              data-deck-id="${_escapeHtml(deck.id)}"
              title="${i18n.t('deckTable.reviewCards')}" aria-label="${i18n.t('deckTable.reviewCards')}">👁️</button>`;

    const hideBtn = isHidden
      ? `<button class="deck-table__btn deck-table__btn--show"
                data-deck-id="${_escapeHtml(deck.id)}"
                title="${i18n.t('deckTable.show')}" aria-label="${i18n.t('deckTable.show')}">🙉</button>`
      : `<button class="deck-table__btn deck-table__btn--hide"
                data-deck-id="${_escapeHtml(deck.id)}"
                title="${i18n.t('deckTable.hide')}" aria-label="${i18n.t('deckTable.hide')}">🙈</button>`;

    const exportBtn = `<button class="deck-table__btn deck-table__btn--export"
              data-deck-id="${_escapeHtml(deck.id)}"
              data-format="yaml"
              title="${_t('common.export')}" aria-label="${_t('common.export')}">📥</button>`;

    // Modifier : decks personnalisés uniquement (les decks intégrés ne s'éditent pas)
    const editBtn = isCustom
      ? `<button class="deck-table__btn deck-table__btn--edit"
                data-deck-id="${_escapeHtml(deck.id)}"
                title="${_t('common.edit')}" aria-label="${_t('common.edit')}">✏️</button>`
      : '';

    const deleteBtn = allowDelete
      ? `<button class="deck-table__btn deck-table__btn--delete"
                data-deck-id="${_escapeHtml(deck.id)}"
                title="${_t('common.delete')}" aria-label="${_t('common.delete')}">🗑️</button>`
      : `<span class="deck-table__btn deck-table__btn--placeholder" aria-hidden="true">·</span>`;

    // Ressources EN PREMIER
    return `${resourcesBtn}${playBtn}${challengeBtn}${examBtn}${reviewBtn}${hideBtn}${exportBtn}${editBtn}${deleteBtn}`;
  },

  /**
   * Détermine l'icône du deck
   * @private
   */
  _getDeckIcon(deck) {
    // Basé sur la catégorie ou les tags
    const categories = Array.isArray(deck.category) ? deck.category : (deck.category ? [deck.category] : []);
    const iconMap = {
      'maths': '📘',
      'sciences': '🔬',
      'histoire': '📜',
      'geographie': '🌍',
      'langues': '🗣️',
      'anglais': '🇬🇧',
      'français': '🇫🇷',
      'informatique': '💻',
      'musique': '🎵',
      'art': '🎨',
      'sport': '⚽',
      'default': '📚'
    };

    // Chercher dans toutes les catégories
    for (const cat of categories) {
      if (typeof cat !== 'string') continue;
      const lowerCat = cat.toLowerCase();
      for (const [key, icon] of Object.entries(iconMap)) {
        if (key !== 'default' && lowerCat.includes(key)) return icon;
      }
    }
    return iconMap.default;
  },

  /**
   * Détermine le type de source d'un deck
   * @private
   * @returns {string} 'procedural', 'ai' ou 'human'
   */
  _getSourceType(deck) {
    const sourceType = deck.metadata?.source?.type;
    if (sourceType === 'procedural') return 'procedural';
    if (sourceType === 'ai-generated' || sourceType === 'ai') return 'ai';
    // Tout le reste (human, user, custom, ou pas de source) = humain
    return 'human';
  },

  /**
   * Rend l'indicateur de source
   * @private
   */
  _renderSource(deck) {
    const sourceType = this._getSourceType(deck);
    const config = this.SOURCE_CONFIG[sourceType] || this.SOURCE_CONFIG.human;
    return `<span class="deck-table__source source--${sourceType}" title="${config.label}">${config.icon}</span>`;
  },

  /**
   * Compte le nombre d'actions disponibles pour un deck
   * @private
   */
  _countActions(deck, options = {}) {
    let count = 2; // Exam et Review sont toujours là
    if (deck.type !== 'multilingual') count++; // Challenge
    if (options.playableCount > 0) count++; // Play
    if (deck.resources && deck.resources.length > 0) count++; // Resources
    count++; // Hide/Show
    count++; // Export
    if (options.isCustom) count++; // Edit
    if (options.isCustom || options.allowBuiltinDeletion) count++; // Delete
    return count;
  },

  /**
   * Stats de fallback si PageUtils n'est pas disponible
   * @private
   */
  _getFallbackStats(deck) {
    // Support pour les decks multilingues
    if (deck.type === 'multilingual' && Array.isArray(deck.words)) {
      const words = deck.words;
      const total = words.length;
      return {
        total,
        counts: { never_played: total, purple: 0, orange: 0, green: 0 },
        playableCount: total,
        restInfo: null,
        isMultilingual: true
      };
    }

    const cards = deck.cards || [];
    const counts = { never_played: 0, purple: 0, orange: 0, green: 0 };
    cards.forEach(c => {
      const box = c.box || 'never_played';
      if (counts[box] !== undefined) counts[box]++;
    });
    return {
      total: cards.length,
      counts,
      playableCount: counts.never_played + counts.purple + counts.orange,
      restInfo: null
    };
  },

  /**
   * Bindage des événements après insertion DOM
   * @param {HTMLElement} container - Conteneur du tableau
   * @param {Object} handlers - Gestionnaires d'événements
   * @param {Function} [handlers.onSort] - Callback quand un tri est demandé (column, direction)
   * @param {Function} [handlers.onToggleHidden] - Callback quand on masque/affiche un deck
   * @param {Function} [handlers.onDelete] - Callback quand on supprime un deck
   * @param {Function} [handlers.onSourceFilter] - Callback quand un filtre source change (source, active)
   * @param {Function} [handlers.onSelectionChange] - Callback quand la sélection change
   * @param {Function} [handlers.onBatchAction] - Callback pour les actions par lot (action, deckIds)
   */
  bind(container, handlers = {}) {
    const { onPlay, onEdit, onExport, onSort, onToggleHidden, onDelete, onSourceFilter, onSelectionChange, onBatchAction } = handlers;

    // Helper pour re-render après changement de sélection
    const triggerRerender = () => {
      if (onSelectionChange) {
        onSelectionChange(this.getSelectedDecks());
      } else if (onSort) {
        // Fallback: utiliser onSort pour forcer le re-render
        onSort(this._sortState.column, this._sortState.direction);
      }
    };

    // Toggle mode sélection
    container.querySelector('[data-action="toggle-selection-mode"]')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleSelectionMode();
      triggerRerender();
    });

    // Select all checkbox
    container.querySelector('.deck-table__select-all')?.addEventListener('change', (e) => {
      const visibleIds = e.target.dataset.visibleIds.split(',').filter(id => id);
      if (e.target.checked) {
        this.selectAll(visibleIds);
      } else {
        // Désélectionner seulement les visibles
        visibleIds.forEach(id => this._selectedDecks.delete(id));
      }
      triggerRerender();
    });

    // Row checkboxes
    container.querySelectorAll('.deck-table__row-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        e.stopPropagation(); // Éviter le clic sur la ligne
        const deckId = checkbox.dataset.deckId;
        this.toggleDeckSelection(deckId);
        triggerRerender();
      });
    });

    // Batch action buttons
    container.querySelectorAll('[data-batch-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const action = btn.dataset.batchAction;
        const selectedIds = this.getSelectedDecks();

        if (action === 'cancel') {
          this.setSelectionMode(false);
          triggerRerender();
          return;
        }

        if (onBatchAction) {
          onBatchAction(action, selectedIds);
        } else {
          this._defaultBatchAction(action, selectedIds, triggerRerender);
        }
      });
    });

    // Checkboxes de filtre source
    container.querySelectorAll('.deck-table__source-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const source = checkbox.dataset.source;
        const isActive = checkbox.checked;

        // Mettre à jour l'état interne
        this.setSourceFilter(source, isActive);

        // Appeler le callback pour re-render
        if (onSourceFilter) {
          onSourceFilter(source, isActive);
        }
      });
    });

    // En-têtes de tri
    container.querySelectorAll('.deck-table__th--sortable').forEach(th => {
      th.addEventListener('click', (e) => {
        e.preventDefault();
        const column = th.dataset.sortColumn;
        const direction = th.dataset.sortDirection;

        // Mettre à jour l'état de tri
        this.setSort(column, direction);

        // Appeler le callback pour re-render
        if (onSort) {
          onSort(column, direction);
        }
      });
    });

    // Boutons Jouer - directement vers la session de jeu
    container.querySelectorAll('.deck-table__btn--play').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const deckId = btn.dataset.deckId;
        if (onPlay) onPlay(deckId);
        else if (typeof Router !== 'undefined') Router.navigate(`/game/${deckId}`);
      });
    });

    // Boutons Défi (choix du mode pour ce deck)
    container.querySelectorAll('.deck-table__btn--challenge').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof Router !== 'undefined') Router.navigate(`/challenge-setup/${btn.dataset.deckId}`);
      });
    });

    // Boutons Examen
    container.querySelectorAll('.deck-table__btn--exam').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const deckId = btn.dataset.deckId;
        if (typeof Router !== 'undefined') Router.navigate(`/exam/${deckId}`);
      });
    });

    // Boutons Révision (consulter les cartes Q/R)
    container.querySelectorAll('.deck-table__btn--review').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const deckId = btn.dataset.deckId;
        if (typeof Router !== 'undefined') Router.navigate(`/deck-review/${deckId}`);
      });
    });

    // Boutons Ressources
    container.querySelectorAll('.deck-table__btn--resources').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const deckId = btn.dataset.deckId;
        if (typeof Router !== 'undefined') Router.navigate(`/deck-resources/${deckId}`);
      });
    });

    // Boutons Éditer
    container.querySelectorAll('.deck-table__btn--edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const deckId = btn.dataset.deckId;
        if (onEdit) onEdit(deckId);
        else if (typeof Router !== 'undefined') Router.navigate(`/deck-editor/${deckId}`);
      });
    });

    // Boutons Export
    container.querySelectorAll('.deck-table__btn--export').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const deckId = btn.dataset.deckId;
        const format = btn.dataset.format || 'yaml';
        if (onExport) onExport(deckId, format);
        else this._defaultExport(deckId, format);
      });
    });

    // Boutons Masquer/Afficher
    container.querySelectorAll('.deck-table__btn--hide, .deck-table__btn--show').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const deckId = btn.dataset.deckId;
        if (onToggleHidden) {
          onToggleHidden(deckId);
        } else {
          this._defaultToggleHidden(deckId);
        }
      });
    });

    // Boutons Supprimer
    container.querySelectorAll('.deck-table__btn--delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const deckId = btn.dataset.deckId;
        if (onDelete) {
          onDelete(deckId);
        } else {
          this._defaultDelete(deckId);
        }
      });
    });

    // Clic sur ligne = aller au deck
    container.querySelectorAll('.deck-table__row').forEach(row => {
      row.addEventListener('click', () => {
        const deckId = row.dataset.deckId;
        if (typeof Router !== 'undefined') Router.navigate(`/deck/${deckId}`);
      });
    });
  },

  /**
   * Export par défaut
   * @private
   */
  _defaultExport(deckId, format) {
    if (typeof Exporter !== 'undefined' && typeof State !== 'undefined') {
      const decks = State.get('decks') || [];
      const deck = decks.find(d => d.id === deckId);
      if (deck) {
        const result = Exporter.exportDeck(deck, format);
        if (result.success) {
          Exporter.downloadFile(result.content, result.filename, result.mimeType);
        }
      }
    }
  },

  /**
   * Toggle hidden par défaut
   * @private
   */
  _defaultToggleHidden(deckId) {
    if (typeof Storage !== 'undefined') {
      // Utiliser toggleDeckHidden pour simplifier (ou hideDeck/unhideDeck)
      if (typeof Storage.toggleDeckHidden === 'function') {
        Storage.toggleDeckHidden(deckId);
      } else {
        const hiddenDecks = Storage.getHiddenDecks();
        if (hiddenDecks.includes(deckId)) {
          Storage.unhideDeck(deckId);
        } else {
          Storage.hideDeck(deckId);
        }
      }

      // Forcer le re-rendu de la page
      // Router.navigate vers la même page ne déclenche pas hashchange
      // donc on force un rechargement via l'App ou en naviguant temporairement ailleurs
      if (typeof Router !== 'undefined' && typeof Router._handleRoute === 'function') {
        // Appeler directement _handleRoute pour forcer le re-rendu
        Router._handleRoute();
      } else if (typeof Router !== 'undefined') {
        // Fallback: recharger la page
        window.location.reload();
      }
    }
  },

  /**
   * Suppression par défaut
   * @private
   */
  _defaultDelete(deckId) {
    if (typeof Storage !== 'undefined' && typeof State !== 'undefined') {
      const decks = State.get('decks') || [];
      const deck = decks.find(d => d.id === deckId);

      if (!deck) return;

      if (!confirm(i18n.t('deckTable.deleteConfirm', { name: deck.name }))) {
        return;
      }

      // Supprimer le deck (fonctionne pour custom et builtin si permis)
      if (typeof Storage.deleteCustomDeck === 'function') {
        Storage.deleteCustomDeck(deckId);
      }

      // Mettre à jour l'état global
      if (typeof App !== 'undefined' && typeof App._loadDecks === 'function') {
        const allDecks = App._loadDecks();
        State.set('decks', allDecks);
      } else {
        // Fallback: retirer du state directement
        const updatedDecks = decks.filter(d => d.id !== deckId);
        State.set('decks', updatedDecks);
      }

      // Forcer le re-rendu de la page
      if (typeof Router !== 'undefined' && typeof Router._handleRoute === 'function') {
        Router._handleRoute();
      } else if (typeof Router !== 'undefined') {
        window.location.reload();
      }
    }
  },

  /**
   * Actions par lot par défaut
   * @private
   * @param {string} action - Type d'action (hide, unhide, export, reset, delete)
   * @param {Array<string>} deckIds - IDs des decks sélectionnés
   * @param {Function} triggerRerender - Callback pour re-render
   */
  _defaultBatchAction(action, deckIds, triggerRerender) {
    if (!deckIds || deckIds.length === 0) {
      alert(i18n.t('deckTable.noneSelected'));
      return;
    }

    const count = deckIds.length;
    const decks = typeof State !== 'undefined' ? State.get('decks') || [] : [];

    switch (action) {
      case 'hide':
        if (confirm(i18n.tn('deckTable.hideConfirm', count))) {
          deckIds.forEach(id => {
            if (typeof Storage !== 'undefined' && typeof Storage.hideDeck === 'function') {
              Storage.hideDeck(id);
            }
          });
          this.setSelectionMode(false);
          this._forcePageReload();
        }
        break;

      case 'unhide':
        if (confirm(i18n.tn('deckTable.showConfirm', count))) {
          deckIds.forEach(id => {
            if (typeof Storage !== 'undefined' && typeof Storage.unhideDeck === 'function') {
              Storage.unhideDeck(id);
            }
          });
          this.setSelectionMode(false);
          this._forcePageReload();
        }
        break;

      case 'export':
        this._batchExport(deckIds, decks);
        break;

      case 'reset':
        if (confirm(i18n.tn('deckTable.resetConfirm', count))) {
          deckIds.forEach(id => {
            if (typeof Storage !== 'undefined') {
              Storage.deleteDeckProgress(id);
              Storage.deleteMultilingualProgress(id);
            }
          });
          // Recharger les decks avec progression réinitialisée
          if (typeof App !== 'undefined' && typeof App._loadDecks === 'function') {
            const allDecks = App._loadDecks();
            State.set('decks', allDecks);
          }
          this.setSelectionMode(false);
          alert(i18n.tn('deckTable.resetDone', count));
          this._forcePageReload();
        }
        break;

      case 'delete':
        const deckNames = deckIds.map(id => {
          const deck = decks.find(d => d.id === id);
          return deck ? deck.name : id;
        }).join('\n- ');

        if (confirm(i18n.tn('deckTable.deleteManyConfirm', count, { names: deckNames }))) {
          deckIds.forEach(id => {
            if (typeof Storage !== 'undefined' && typeof Storage.deleteCustomDeck === 'function') {
              Storage.deleteCustomDeck(id);
            }
          });
          // Recharger les decks
          if (typeof App !== 'undefined' && typeof App._loadDecks === 'function') {
            const allDecks = App._loadDecks();
            State.set('decks', allDecks);
          }
          this.setSelectionMode(false);
          alert(i18n.tn('deckHub.trashCount', count) + '.');
          this._forcePageReload();
        }
        break;

      default:
        console.warn('[DeckTable] Unknown batch action:', action);
    }
  },

  /**
   * Export par lot (ZIP ou fichiers multiples)
   * @private
   */
  _batchExport(deckIds, decks) {
    if (typeof Exporter === 'undefined') {
      alert(i18n.t('deckTable.exporterMissing'));
      return;
    }

    const selectedDecks = deckIds
      .map(id => decks.find(d => d.id === id))
      .filter(Boolean);

    if (selectedDecks.length === 0) {
      alert(i18n.t('explore.noResults'));
      return;
    }

    // Pour l'instant, exporter chaque deck séparément
    // Une amélioration future pourrait créer un ZIP
    if (selectedDecks.length === 1) {
      const result = Exporter.exportDeck(selectedDecks[0], 'yaml');
      if (result.success) {
        Exporter.downloadFile(result.content, result.filename, result.mimeType);
      }
    } else {
      // Export multiple - télécharger un par un avec petit délai
      let delay = 0;
      selectedDecks.forEach((deck, index) => {
        setTimeout(() => {
          const result = Exporter.exportDeck(deck, 'yaml');
          if (result.success) {
            Exporter.downloadFile(result.content, result.filename, result.mimeType);
          }
        }, delay);
        delay += 500; // 500ms entre chaque téléchargement
      });

      alert(i18n.t('deckTable.exportBatch', { count: selectedDecks.length }));
    }

    this.setSelectionMode(false);
  },

  /**
   * Force le rechargement de la page actuelle
   * @private
   */
  _forcePageReload() {
    if (typeof Router !== 'undefined' && typeof Router._handleRoute === 'function') {
      Router._handleRoute();
    } else {
      window.location.reload();
    }
  }
};

// Export pour tests Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DeckTable;
}
