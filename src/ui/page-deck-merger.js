/**
 * Page Deck Merger - Fusion de plusieurs decks en un seul
 *
 * Dépendances: Pages (pages-base.js), Components, Router, Storage, State, App
 */

// ═══════════════════════════════════════════════════════════════
// DECK MERGER - Fusion de decks
// ═══════════════════════════════════════════════════════════════

Pages.deckMerger = {
  // État local de la page
  _selectedDeckIds: new Set(),
  _newDeckName: '',
  _newDeckDescription: '',
  _removeDuplicates: true,
  _shuffleCards: false,
  _keepProgress: false,

  render(state) {
    const { decks, player } = state;
    const _t = PageUtils.getTranslator();

    // Filtrer les decks disponibles (exclure les decks vides)
    const availableDecks = decks.filter(d => d.cards && d.cards.length > 0);

    return `
      <div class="page page--deck-merger">
        <main class="page__content" id="main-content" role="main">
          <h1 class="deck-merger__title">🔀 ${_t('merger.title')}</h1>
          <p class="deck-merger__subtitle">${_t('merger.subtitle')}</p>

          <div class="deck-merger__layout">
            <!-- Colonne gauche : Sélection des decks -->
            <section class="deck-merger__selection">
              <h2>${_t('merger.selectDecks')}</h2>
              <div class="deck-merger__count" id="selected-count">
                ${this._selectedDeckIds.size === 0
                  ? _t('merger.noDecksSelected')
                  : i18n.tn('merger.selectedCount', this._selectedDeckIds.size)}
              </div>

              <div class="deck-merger__deck-list">
                ${availableDecks.map(deck => this._renderDeckItem(deck)).join('')}
              </div>
            </section>

            <!-- Colonne droite : Configuration -->
            <section class="deck-merger__config">
              <h2>${_t('merger.configuration')}</h2>

              <div class="deck-merger__form">
                <div class="form-group">
                  <label for="new-deck-name">${_t('merger.newDeckName')}</label>
                  <input
                    type="text"
                    id="new-deck-name"
                    class="input"
                    placeholder="${_t('merger.newDeckNamePlaceholder')}"
                    value="${escapeHtml(this._newDeckName)}"
                  >
                </div>

                <div class="form-group">
                  <label for="new-deck-description">${_t('merger.newDeckDescription')}</label>
                  <textarea
                    id="new-deck-description"
                    class="input"
                    rows="3"
                    placeholder="${_t('merger.newDeckDescriptionPlaceholder')}"
                  >${escapeHtml(this._newDeckDescription)}</textarea>
                </div>

                <div class="deck-merger__options">
                  <h3>${_t('merger.options')}</h3>

                  <label class="deck-merger__option">
                    <input type="checkbox" id="opt-remove-duplicates" ${this._removeDuplicates ? 'checked' : ''}>
                    <div class="deck-merger__option-content">
                      <span class="deck-merger__option-label">${_t('merger.removeDuplicates')}</span>
                      <span class="deck-merger__option-desc">${_t('merger.removeDuplicatesDesc')}</span>
                    </div>
                  </label>

                  <label class="deck-merger__option">
                    <input type="checkbox" id="opt-shuffle" ${this._shuffleCards ? 'checked' : ''}>
                    <div class="deck-merger__option-content">
                      <span class="deck-merger__option-label">${_t('merger.shuffleCards')}</span>
                      <span class="deck-merger__option-desc">${_t('merger.shuffleCardsDesc')}</span>
                    </div>
                  </label>

                  <label class="deck-merger__option">
                    <input type="checkbox" id="opt-keep-progress" ${this._keepProgress ? 'checked' : ''}>
                    <div class="deck-merger__option-content">
                      <span class="deck-merger__option-label">${_t('merger.keepProgress')}</span>
                      <span class="deck-merger__option-desc">${_t('merger.keepProgressDesc')}</span>
                    </div>
                  </label>
                </div>

                <!-- Aperçu -->
                <div class="deck-merger__preview" id="merge-preview">
                  <h3>${_t('merger.preview')}</h3>
                  ${this._renderPreview(decks)}
                </div>

                <!-- Actions -->
                <div class="deck-merger__actions">
                  <button class="btn btn--ghost" data-action="cancel">
                    ${_t('merger.cancel')}
                  </button>
                  <button class="btn btn--primary" data-action="merge" ${this._selectedDeckIds.size < 2 ? 'disabled' : ''}>
                    ${_t('merger.merge')}
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>

        ${PageUtils.renderFooter(player, 'deck-merger')}
      </div>
    `;
  },

  _renderDeckItem(deck) {
    const isSelected = this._selectedDeckIds.has(deck.id);
    const cardCount = deck.cards?.length || 0;
    const isBuiltin = deck.id && !deck.id.startsWith('custom_');

    return `
      <div class="deck-merger__deck-item ${isSelected ? 'deck-merger__deck-item--selected' : ''}"
           data-deck-id="${escapeHtml(deck.id)}">
        <div class="deck-merger__deck-checkbox">
          <input type="checkbox" ${isSelected ? 'checked' : ''} aria-label="${i18n.t('merger.selectDeck', { name: escapeHtml(deck.name) })}">
        </div>
        <div class="deck-merger__deck-info">
          <span class="deck-merger__deck-name">${escapeHtml(deck.name)}</span>
          <span class="deck-merger__deck-meta">
            ${i18n.tn('common.cardsCount', cardCount)}
            ${isBuiltin ? `<span class="deck-merger__builtin-badge">${i18n.t('merger.builtin')}</span>` : ''}
          </span>
        </div>
      </div>
    `;
  },

  _renderPreview(decks) {
    const _t = PageUtils.getTranslator();

    if (this._selectedDeckIds.size === 0) {
      return `<p class="deck-merger__preview-empty">${_t('merger.noDecksSelected')}</p>`;
    }

    const selectedDecks = decks.filter(d => this._selectedDeckIds.has(d.id));
    let totalCards = 0;
    let duplicates = 0;

    // Calculer le total et les doublons
    const questionSet = new Set();
    selectedDecks.forEach(deck => {
      (deck.cards || []).forEach(card => {
        const questionKey = (card.question || '').trim().toLowerCase();
        if (questionSet.has(questionKey)) {
          duplicates++;
        } else {
          questionSet.add(questionKey);
        }
        totalCards++;
      });
    });

    const finalCount = this._removeDuplicates ? (totalCards - duplicates) : totalCards;

    return `
      <div class="deck-merger__preview-stats">
        <div class="deck-merger__preview-stat">
          <span class="deck-merger__preview-stat-value">${finalCount}</span>
          <span class="deck-merger__preview-stat-label">${_t('merger.totalCards').replace('{count}', '')}</span>
        </div>
        ${duplicates > 0 ? `
          <div class="deck-merger__preview-stat deck-merger__preview-stat--warning">
            <span class="deck-merger__preview-stat-value">${duplicates}</span>
            <span class="deck-merger__preview-stat-label">${i18n.tn('merger.duplicates', duplicates)}</span>
          </div>
        ` : ''}
      </div>
      <div class="deck-merger__preview-decks">
        ${selectedDecks.map(d => `
          <span class="deck-merger__preview-deck-tag">${escapeHtml(d.name)}</span>
        `).join('')}
      </div>
    `;
  },

  mount(container, state) {
    container.innerHTML = this.render(state);
    this._bindEvents(container, state);
  },

  _bindEvents(container, state) {
    const _t = PageUtils.getTranslator();
    const { decks } = state;

    // Sélection des decks
    container.querySelectorAll('.deck-merger__deck-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const deckId = item.dataset.deckId;
        const checkbox = item.querySelector('input[type="checkbox"]');

        if (this._selectedDeckIds.has(deckId)) {
          this._selectedDeckIds.delete(deckId);
          item.classList.remove('deck-merger__deck-item--selected');
          checkbox.checked = false;
        } else {
          this._selectedDeckIds.add(deckId);
          item.classList.add('deck-merger__deck-item--selected');
          checkbox.checked = true;
        }

        this._updateUI(container, decks);
      });
    });

    // Champs du formulaire
    container.querySelector('#new-deck-name')?.addEventListener('input', (e) => {
      this._newDeckName = e.target.value;
    });

    container.querySelector('#new-deck-description')?.addEventListener('input', (e) => {
      this._newDeckDescription = e.target.value;
    });

    // Options
    container.querySelector('#opt-remove-duplicates')?.addEventListener('change', (e) => {
      this._removeDuplicates = e.target.checked;
      this._updatePreview(container, decks);
    });

    container.querySelector('#opt-shuffle')?.addEventListener('change', (e) => {
      this._shuffleCards = e.target.checked;
    });

    container.querySelector('#opt-keep-progress')?.addEventListener('change', (e) => {
      this._keepProgress = e.target.checked;
    });

    // Actions
    container.querySelector('[data-action="cancel"]')?.addEventListener('click', () => {
      this._resetState();
      Router.navigate('/deck-hub');
    });

    container.querySelector('[data-action="merge"]')?.addEventListener('click', () => {
      this._performMerge(container, state);
    });
  },

  _updateUI(container, decks) {
    const _t = PageUtils.getTranslator();

    // Mettre à jour le compteur
    const countEl = container.querySelector('#selected-count');
    if (countEl) {
      countEl.textContent = this._selectedDeckIds.size === 0
        ? _t('merger.noDecksSelected')
        : i18n.tn('merger.selectedCount', this._selectedDeckIds.size);
    }

    // Mettre à jour le bouton
    const mergeBtn = container.querySelector('[data-action="merge"]');
    if (mergeBtn) {
      mergeBtn.disabled = this._selectedDeckIds.size < 2;
    }

    // Mettre à jour l'aperçu
    this._updatePreview(container, decks);
  },

  _updatePreview(container, decks) {
    const previewEl = container.querySelector('#merge-preview');
    if (previewEl) {
      const _t = PageUtils.getTranslator();
      previewEl.innerHTML = `
        <h3>${_t('merger.preview')}</h3>
        ${this._renderPreview(decks)}
      `;
    }
  },

  _performMerge(container, state) {
    const _t = PageUtils.getTranslator();
    const { decks } = state;

    // Validation
    if (this._selectedDeckIds.size < 2) {
      alert(_t('merger.minDecks'));
      return;
    }

    const deckName = this._newDeckName.trim() || i18n.t('merger.defaultName');

    // Collecter les cartes
    const selectedDecks = decks.filter(d => this._selectedDeckIds.has(d.id));
    let allCards = [];
    const questionSet = new Set();

    selectedDecks.forEach(deck => {
      (deck.cards || []).forEach(card => {
        const questionKey = (card.question || '').trim().toLowerCase();

        // Filtrer les doublons si l'option est activée
        if (this._removeDuplicates && questionSet.has(questionKey)) {
          return;
        }
        questionSet.add(questionKey);

        // Créer une copie de la carte
        const newCard = {
          ...card,
          id: `merged_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };

        // Réinitialiser la progression si demandé
        if (!this._keepProgress) {
          newCard.box = 'never_played';
          newCard.latencyThreshold = null;
          newCard.timesPlayed = 0;
          newCard.timesCorrect = 0;
          newCard.restUntil = null;
        }

        allCards.push(newCard);
      });
    });

    // Mélanger si demandé
    if (this._shuffleCards) {
      allCards = TextUtils.shuffleArray(allCards);
    }

    // Créer le nouveau deck
    const newDeck = {
      id: 'custom_' + Date.now(),
      name: deckName,
      description: this._newDeckDescription.trim() || `Fusion de ${selectedDecks.map(d => d.name).join(', ')}`,
      cards: allCards,
      category: ['custom'],
      createdAt: new Date().toISOString(),
      mergedFrom: selectedDecks.map(d => ({ id: d.id, name: d.name }))
    };

    // Sauvegarder
    try {
      Storage.saveCustomDeck(newDeck);

      // Recharger les decks
      const updatedDecks = App._loadDecks();
      State.set('decks', updatedDecks);

      alert(_t('merger.success').replace('{name}', deckName));

      // Réinitialiser l'état et naviguer
      this._resetState();
      Router.navigate('/explore');
    } catch (err) {
      console.error('[Deck Merger] Error:', err);
      alert(_t('merger.error'));
    }
  },

  _resetState() {
    this._selectedDeckIds.clear();
    this._newDeckName = '';
    this._newDeckDescription = '';
    this._removeDuplicates = true;
    this._shuffleCards = false;
    this._keepProgress = false;
  }
};
