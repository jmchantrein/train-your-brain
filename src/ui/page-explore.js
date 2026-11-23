/**
 * Page Explore - Liste de tous les decks avec filtres
 *
 * Dépendances: Pages (pages-base.js), PageUtils, Components, State, Storage, Tags
 */

// ═══════════════════════════════════════════════════════════════
// EXPLORE - Liste de tous les decks
// ═══════════════════════════════════════════════════════════════

Pages.explore = {
  // État local du filtre
  _searchQuery: '',
  _selectedCategory: null,

  /**
   * Filtre les decks selon la recherche et la catégorie
   */
  _filterDecks(decks, searchQuery, selectedCategory) {
    let filtered = decks;

    // Filtre par recherche textuelle
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(deck => {
        const nameMatch = deck.name && deck.name.toLowerCase().includes(query);
        const descMatch = deck.description && deck.description.toLowerCase().includes(query);
        return nameMatch || descMatch;
      });
    }

    // Filtre par catégorie
    if (selectedCategory && typeof Tags !== 'undefined') {
      const descendants = Tags.getDescendants(selectedCategory);
      const validCategories = [selectedCategory, ...descendants];

      filtered = filtered.filter(deck => {
        if (!deck.category || !Array.isArray(deck.category)) return false;
        return deck.category.some(cat => validCategories.includes(cat));
      });
    }

    return filtered;
  },

  render(state, searchQuery = '', selectedCategory = null) {
    const { player, decks = [] } = state;
    const today = PageUtils.getToday();
    const _t = PageUtils.getTranslator();
    const { customDeckIds, visibleDecks: allVisibleDecks, hiddenDecks } = PageUtils.getProcessedDecks(decks);
    const hiddenDeckIds = typeof Storage !== 'undefined' ? Storage.getHiddenDecks() : [];
    const allowBuiltinDeletion = player?.settings?.allowBuiltinDeckDeletion || false;

    // Appliquer les filtres de recherche
    const visibleDecks = this._filterDecks(allVisibleDecks, searchQuery, selectedCategory);

    return `
      <div class="page page--explore">
        <main class="page__content" id="main-content" role="main">
          <h1 class="explore__title">📚 ${_t('explore.title')}</h1>

          <!-- Filtre de catégories (utilise tagSelector en mode filter) -->
          <div class="explore__filter-container">
            ${Components.tagSelector.render({
              mode: 'filter',
              selectedTags: selectedCategory ? [selectedCategory] : [],
              decks: allVisibleDecks,
              searchQuery
            })}
          </div>

          <!-- Résultats -->
          ${visibleDecks.length === 0 ? `
            <div class="explore__no-results">
              <p>${_t('explore.noResults')}</p>
            </div>
          ` : `
            <div class="explore__decks" id="explore-decks">
              ${DeckTable.render(visibleDecks, { today, customDeckIds, hiddenDeckIds, allowBuiltinDeletion })}
            </div>
          `}

          ${hiddenDecks.length > 0 ? `
            <section class="explore__hidden-section">
              <button class="explore__hidden-toggle" aria-expanded="false">
                <span>👁️ ${_t('explore.hiddenDecks')} (${hiddenDecks.length})</span>
                <span class="explore__hidden-arrow">▼</span>
              </button>
              <div class="explore__hidden-decks" id="hidden-decks" style="display: none;">
                ${DeckTable.render(hiddenDecks, { today, customDeckIds, hiddenDeckIds, allowBuiltinDeletion })}
              </div>
            </section>
          ` : ''}
        </main>

        ${PageUtils.renderFooter(player, 'explore')}
      </div>
    `;
  },

  mount(container, state) {
    // Rendu initial avec les filtres actuels
    container.innerHTML = this.render(state, this._searchQuery, this._selectedCategory);

    // Helper pour re-render avec tri et filtrage par source
    const rebindTable = (tableContainer, decks) => {
      if (!tableContainer) return;
      const { customDeckIds } = PageUtils.getProcessedDecks(state.decks || []);
      const hiddenDeckIds = typeof Storage !== 'undefined' ? Storage.getHiddenDecks() : [];
      const allowBuiltinDeletion = state.player?.settings?.allowBuiltinDeckDeletion || false;
      const today = PageUtils.getToday();
      tableContainer.innerHTML = DeckTable.render(decks, { today, customDeckIds, hiddenDeckIds, allowBuiltinDeletion });
      DeckTable.bind(tableContainer, {
        onSort: () => rebindTable(tableContainer, decks),
        onSourceFilter: () => rebindTable(tableContainer, decks)
      });
    };

    // Monter le composant de filtre (tagSelector en mode filter)
    const filterContainer = container.querySelector('.explore__filter-container');
    if (filterContainer && typeof Components.tagSelector !== 'undefined') {
      const allVisibleDecks = (state.decks || []).filter(d => !Storage.getHiddenDecks().includes(d.id));

      Components.tagSelector.mount(filterContainer, {
        mode: 'filter',
        selectedTags: this._selectedCategory ? [this._selectedCategory] : [],
        decks: allVisibleDecks,
        searchQuery: this._searchQuery
      }, {
        onSearchChange: (query) => {
          this._searchQuery = query;
          this._updateDecksList(container, state);
        },
        onCategoryChange: (categoryId) => {
          this._selectedCategory = categoryId;
          // Re-render complet pour mettre à jour le filtre et les decks
          this.mount(container, State.getAll());
        }
      });
    }

    // Toggle section decks masqués
    const hiddenToggle = container.querySelector('.explore__hidden-toggle');
    const hiddenDecksEl = container.querySelector('.explore__hidden-decks');
    if (hiddenToggle && hiddenDecksEl) {
      hiddenToggle.addEventListener('click', () => {
        const isExpanded = hiddenToggle.getAttribute('aria-expanded') === 'true';
        hiddenToggle.setAttribute('aria-expanded', !isExpanded);
        hiddenDecksEl.style.display = isExpanded ? 'none' : 'block';
        hiddenToggle.querySelector('.explore__hidden-arrow').textContent = isExpanded ? '▼' : '▲';
      });
    }

    // Bind DeckTable events avec callback de tri
    const { customDeckIds, visibleDecks: allVisibleDecks, hiddenDecks } = PageUtils.getProcessedDecks(state.decks || []);
    const visibleDecks = this._filterDecks(allVisibleDecks, this._searchQuery, this._selectedCategory);

    const exploreDecksEl = container.querySelector('#explore-decks');
    if (exploreDecksEl) {
      DeckTable.bind(exploreDecksEl, {
        onSort: () => rebindTable(exploreDecksEl, visibleDecks),
        onSourceFilter: () => rebindTable(exploreDecksEl, visibleDecks)
      });
    }

    const hiddenDecksEl2 = container.querySelector('#hidden-decks');
    if (hiddenDecksEl2) {
      DeckTable.bind(hiddenDecksEl2, {
        onSort: () => rebindTable(hiddenDecksEl2, hiddenDecks),
        onSourceFilter: () => rebindTable(hiddenDecksEl2, hiddenDecks)
      });
    }
  },

  /**
   * Met à jour uniquement la liste des decks (pour la recherche en temps réel)
   */
  _updateDecksList(container, state) {
    const decksContainer = container.querySelector('.explore__decks');
    const noResultsContainer = container.querySelector('.explore__no-results');
    const _t = PageUtils.getTranslator();

    if (!decksContainer && !noResultsContainer) return;

    const { customDeckIds, visibleDecks: allVisibleDecks } = PageUtils.getProcessedDecks(state.decks || []);
    const hiddenDeckIds = typeof Storage !== 'undefined' ? Storage.getHiddenDecks() : [];
    const allowBuiltinDeletion = state.player?.settings?.allowBuiltinDeckDeletion || false;
    const visibleDecks = this._filterDecks(allVisibleDecks, this._searchQuery, this._selectedCategory);

    const today = PageUtils.getToday();

    // Trouver ou créer le conteneur approprié
    const mainContent = container.querySelector('.page__content');
    const filterContainer = container.querySelector('.explore__filter-container');

    // Supprimer l'ancien conteneur
    if (decksContainer) decksContainer.remove();
    if (noResultsContainer) noResultsContainer.remove();

    // Créer le nouveau contenu
    const newContent = document.createElement('div');
    if (visibleDecks.length === 0) {
      newContent.className = 'explore__no-results';
      newContent.innerHTML = `<p>${_t('explore.noResults')}</p>`;
    } else {
      newContent.className = 'explore__decks';
      newContent.id = 'explore-decks';
      newContent.innerHTML = DeckTable.render(visibleDecks, { today, customDeckIds, hiddenDeckIds, allowBuiltinDeletion });
    }

    // Insérer après le filtre
    if (filterContainer && filterContainer.nextSibling) {
      filterContainer.parentNode.insertBefore(newContent, filterContainer.nextSibling);
    } else if (mainContent) {
      mainContent.appendChild(newContent);
    }

    // Rebinder les événements DeckTable avec callback de tri et filtrage
    if (visibleDecks.length > 0) {
      const rebindTable = (tableContainer, decks) => {
        if (!tableContainer) return;
        tableContainer.innerHTML = DeckTable.render(decks, { today, customDeckIds, hiddenDeckIds, allowBuiltinDeletion });
        DeckTable.bind(tableContainer, {
          onSort: () => rebindTable(tableContainer, decks),
          onSourceFilter: () => rebindTable(tableContainer, decks)
        });
      };
      DeckTable.bind(newContent, {
        onSort: () => rebindTable(newContent, visibleDecks),
        onSourceFilter: () => rebindTable(newContent, visibleDecks)
      });
    }
  }
};
