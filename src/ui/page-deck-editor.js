/**
 * Page DeckEditor - Éditeur unifié split-view (Code/Visuel)
 *
 * Modules extraits :
 * - DeckEditorCardRenderer : rendu des éditeurs de cartes
 * - DeckEditorCardBinder : binding des événements d'édition
 * - DeckEditorSyncController : synchronisation YAML/Visual
 *
 * Dépendances: escapeHtml (components.js)
 * Modules: State, Router, Storage, Tags, Components, YAML
 */

// ═══════════════════════════════════════════════════════════════
// DECK EDITOR - Éditeur unifié split-view (Code/Visuel)
// ═══════════════════════════════════════════════════════════════

Pages.deckEditor = {
  _deck: null,
  _yamlContent: '',
  _yamlError: null,
  _swapped: false,
  _leftPanelWidth: 50,
  _editingCardIndex: null,
  _expandedCardIndex: null,
  _lastEditSource: null,

  _editingId: null,

  /**
   * Prépare l'éditeur à chaque ENTRÉE sur la route (pas à chaque ré-affichage interne) : un état
   * conservé d'une visite à l'autre ferait réapparaître le deck précédent, et l'enregistrement
   * l'écraserait. Le brouillon d'une visite précédente est abandonné ; la sortie par le bouton
   * « retour » demande déjà confirmation.
   * @param {Array} params - Paramètres de la route (params[0] = identifiant du deck à modifier)
   * @returns {boolean} false si le deck demandé n'existe pas
   * @private
   */
  _enter(params = []) {
    const deckId = params[0] || null;
    this._reset();
    this._editingId = deckId;

    if (deckId) {
      const found = Storage.loadCustomDecks().find(d => d.id === deckId);
      if (!found) {
        this._editingId = null;
        return false;
      }
      this._deck = found;
    } else {
      this._deck = {
        id: 'custom_' + Date.now(),
        name: '',
        description: '',
        tags: [],
        settings: { bidirectional: false, sequential: false, similarityMatching: false, similarityThreshold: 0.8 },
        cards: []
      };
    }
    DeckEditorSyncController.initMediaCache(this._deck);
    this._yamlContent = DeckEditorSyncController.deckToYaml(this._deck);
    return true;
  },

  render(state) {
    const isEditing = !!this._editingId;
    if (!this._deck) this._enter([]);

    const leftView = this._swapped ? 'visual' : 'code';
    const rightView = this._swapped ? 'code' : 'visual';

    return `
      <div class="split-editor">
        <header class="split-editor__header">
          <div class="split-editor__header-left">
            <button class="split-editor__back" title="${i18n.t('common.back')}" aria-label="${i18n.t('common.back')}">←</button>
            <h1 class="split-editor__title">${isEditing ? i18n.t('editor.editDeck') : i18n.t('editor.createDeck')}</h1>
          </div>
          <div class="split-editor__header-actions">
            <button class="split-editor__swap-btn" title="${i18n.t('editor.swapViews')}">⇄ ${i18n.t('editor.swap')}</button>
            <button class="btn btn--primary split-editor__save">💾 ${i18n.t('editor.saveDeck')}</button>
          </div>
        </header>

        <div class="split-editor__container">
          <div class="split-editor__panel split-editor__panel--left" style="flex: ${this._leftPanelWidth}">
            ${leftView === 'code' ? this._renderCodePanel() : this._renderVisualPanel()}
          </div>
          <div class="split-editor__divider" id="split-divider"></div>
          <div class="split-editor__panel split-editor__panel--right" style="flex: ${100 - this._leftPanelWidth}">
            ${rightView === 'code' ? this._renderCodePanel() : this._renderVisualPanel()}
          </div>
        </div>

        ${this._editingCardIndex !== null ? DeckEditorCardRenderer.renderCardEditModal(this._editingCardIndex, this._deck) : ''}
      </div>
    `;
  },

  _renderCodePanel() {
    const statusClass = this._yamlError ? 'split-editor__code-status--error' : (this._deck ? 'split-editor__code-status--valid' : '');
    const statusText = this._yamlError || (this._deck?.cards?.length ? `✓ ${i18n.tn('editor.yamlValidCards', this._deck.cards.length)}` : `✓ ${i18n.t('editor.yamlValid')}`);

    return `
      <div class="split-editor__panel-header">
        <span class="split-editor__panel-title">💻 ${i18n.t('editor.codePanel')}</span>
        <div class="split-editor__panel-actions">
          <button class="split-editor__panel-btn split-editor__format-btn" title="${i18n.t('editor.format')}">${i18n.t('editor.format')}</button>
          <button class="split-editor__panel-btn split-editor__paste-btn" title="${i18n.t('editor.paste')}">${i18n.t('editor.paste')}</button>
        </div>
      </div>
      <div class="split-editor__code">
        <textarea class="split-editor__textarea" id="yaml-editor" placeholder="${escapeHtml(i18n.t('editor.yamlPlaceholder'))}">${escapeHtml(this._yamlContent)}</textarea>
        <div class="split-editor__code-status ${statusClass}" role="status" aria-live="polite">${escapeHtml(statusText)}</div>
      </div>
    `;
  },

  _renderVisualPanel() {
    const deck = this._deck || { name: '', description: '', tags: [], cards: [], settings: {} };

    return `
      <div class="split-editor__panel-header">
        <span class="split-editor__panel-title">📝 ${i18n.t('editor.visualPanel')}</span>
        <div class="split-editor__panel-actions">
          <button class="btn btn--small btn--primary split-editor__add-card-btn">+ ${i18n.t('editor.cardShort')}</button>
        </div>
      </div>
      <div class="split-editor__panel-content">
        <div class="split-editor__visual">
          ${this._renderTipsSection()}
          ${this._renderMetadataSection(deck)}
          ${this._renderCardsSection(deck)}
        </div>
      </div>
    `;
  },

  _renderTipsSection() {
    return `
      <details class="split-editor__tips">
        <summary class="split-editor__tips-toggle">💡 ${i18n.t('editor.tipsTitle')}</summary>
        <div class="split-editor__tips-content">
          <ul>
            <li>${i18n.t('editor.tipOffline')}</li>
            <li>${i18n.t('editor.tipFree')}</li>
            <li>${i18n.t('editor.tipSize')}</li>
            <li>${i18n.t('promptGen.tipQuestions')}</li>
            <li>${i18n.t('promptGen.tipShort')}</li>
            <li>${i18n.t('editor.tipAlternatives')}</li>
            <li>${i18n.t('editor.tipFeedback')}</li>
            <li>${i18n.t('editor.tipHints')}</li>
            <li>${i18n.t('editor.tipTags')}</li>
          </ul>
        </div>
      </details>
    `;
  },

  _renderMetadataSection(deck) {
    return `
      <section class="split-editor__visual-section">
        <h3>📚 ${i18n.t('editor.info')}</h3>
        <div class="split-editor__visual-field">
          <label for="visual-name">${i18n.t('common.deckName')} *</label>
          <input type="text" id="visual-name" class="split-editor__visual-input"
                 value="${escapeHtml(deck.name || '')}" placeholder="${i18n.t('common.deckName')}">
        </div>
        <div class="split-editor__visual-field">
          <label for="visual-desc">${i18n.t('merger.newDeckDescription')}</label>
          <textarea id="visual-desc" class="split-editor__visual-textarea"
                    placeholder="${i18n.t('editor.descriptionPlaceholder')}">${escapeHtml(deck.description || '')}</textarea>
        </div>
        <div class="split-editor__visual-field">
          <label for="visual-image">${i18n.t('editor.image')} (${i18n.t('common.optional')})</label>
          <div class="split-editor__image-field">
            ${deck.image ? `
              <div class="split-editor__image-preview">
                ${CardMedia.image(deck.image, { alt: i18n.t('editor.preview'), link: false })}
                <button type="button" class="split-editor__image-remove" title="${i18n.t('common.delete')}" aria-label="${i18n.t('common.delete')}">✕</button>
              </div>
            ` : ''}
            <input type="file" id="visual-image" accept="image/*" class="split-editor__image-input">
            <label for="visual-image" class="split-editor__image-label">
              📷 ${deck.image ? i18n.t('editor.changeImage') : i18n.t('editor.addImage')}
            </label>
          </div>
        </div>
        <div class="split-editor__visual-field">
          <label>${i18n.t('editor.tags')}</label>
          <div id="visual-tags-selector"></div>
        </div>
        <div class="split-editor__visual-row">
          <div class="split-editor__visual-field">
            <label title="${i18n.t('editor.sequentialDesc')}">
              <input type="checkbox" id="visual-sequential" ${deck.settings?.sequential ? 'checked' : ''}>
              ${i18n.t('editor.sequential')}
              <span class="split-editor__tooltip-icon" title="${i18n.t('editor.sequentialDesc')}" aria-label="${i18n.t('editor.sequentialDesc')}">ⓘ</span>
            </label>
          </div>
          <div class="split-editor__visual-field">
            <label title="${i18n.t('editor.similarityDesc')}">
              <input type="checkbox" id="visual-similarity" ${deck.settings?.similarityMatching ? 'checked' : ''}>
              ${i18n.t('editor.similarity')}
              <span class="split-editor__tooltip-icon" title="${i18n.t('editor.similarityDesc')}" aria-label="${i18n.t('editor.similarityDesc')}">ⓘ</span>
            </label>
          </div>
        </div>
      </section>
    `;
  },

  _renderCardsSection(deck) {
    return `
      <section class="split-editor__visual-section">
        <div class="split-editor__cards-header">
          <h3>🃏 ${i18n.t('summary.cards')}</h3>
          <span class="split-editor__cards-count">${i18n.tn('common.cardsCount', deck.cards?.length || 0)}</span>
        </div>
        ${!deck.cards || deck.cards.length === 0 ? `
          <div class="split-editor__empty">
            <p>${i18n.t('editor.noCards')}</p>
            <p>${i18n.t('editor.noCardsHint')}</p>
          </div>
        ` : `
          <div class="split-editor__cards-list">
            ${deck.cards.map((card, i) => DeckEditorCardRenderer.renderInlineCard(card, i, this._expandedCardIndex)).join('')}
          </div>
        `}
        <div class="split-editor__add-card-bottom">
          <button class="btn btn--primary split-editor__add-card-btn">+ ${i18n.t('editor.addCard')}</button>
        </div>
        <div class="split-editor__save-bottom">
          <button class="btn btn--primary split-editor__save">💾 ${i18n.t('editor.saveDeck')}</button>
        </div>
      </section>
    `;
  },

  mount(container, state, params) {
    // params n'est fourni que par le routeur ; les ré-affichages internes appellent mount(container, state)
    if (params !== undefined && !this._enter(params)) {
      alert(PageUtils.getTranslator()('deckEditor.notFound'));
      this._reset();
      Router.navigate('/deck-hub');
      return;
    }
    container.innerHTML = this.render(state);
    this._bindEvents(container, state);

    if (this._expandedCardIndex !== null) {
      requestAnimationFrame(() => {
        const expandedCard = container.querySelector('.split-editor__card-item--expanded');
        if (expandedCard) {
          expandedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  },

  _bindEvents(container, state) {
    // Back button
    container.querySelector('.split-editor__back')?.addEventListener('click', () => {
      if (this._deck?.cards?.length > 0 || this._deck?.name) {
        if (!confirm(i18n.t('editor.leaveConfirm'))) return;
      }
      this._reset();
      history.back();
    });

    // Save buttons (header + bottom)
    container.querySelectorAll('.split-editor__save').forEach(btn => {
      btn.addEventListener('click', () => {
        this._saveDeck(state);
      });
    });

    // Swap views button
    container.querySelector('.split-editor__swap-btn')?.addEventListener('click', () => {
      this._swapped = !this._swapped;
      this.mount(container, state);
    });

    // Divider resize
    this._setupDividerResize(container, state);

    // YAML textarea input
    container.querySelector('#yaml-editor')?.addEventListener('input', (e) => {
      this._yamlContent = e.target.value;
      this._lastEditSource = 'yaml';
      DeckEditorSyncController.debounceSyncFromYaml(() => this._syncFromYaml(container, state));
    });

    // Format button
    container.querySelector('.split-editor__format-btn')?.addEventListener('click', () => {
      if (this._deck) {
        this._yamlContent = DeckEditorSyncController.deckToYaml(this._deck);
        const textarea = container.querySelector('#yaml-editor');
        if (textarea) textarea.value = this._yamlContent;
      }
    });

    // Paste button
    container.querySelector('.split-editor__paste-btn')?.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        this._yamlContent = text;
        const textarea = container.querySelector('#yaml-editor');
        if (textarea) textarea.value = text;
        this._syncFromYaml(container, state);
      } catch (e) {
        alert(i18n.t('promptGen.clipboardError'));
      }
    });

    // Visual inputs
    this._bindVisualInputs(container, state);

    // Add card button
    container.querySelectorAll('.split-editor__add-card-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!this._deck.cards) this._deck.cards = [];
        const newCard = { id: `card_${Date.now()}`, question: '', answer: '', type: 'text' };
        this._deck.cards.push(newCard);
        this._expandedCardIndex = this._deck.cards.length - 1;
        this._syncToYaml(container);
        this.mount(container, state);
      });
    });

    // Expand card buttons
    container.querySelectorAll('.split-editor__expand-card').forEach(btn => {
      btn.addEventListener('click', () => {
        this._expandedCardIndex = parseInt(btn.dataset.index, 10);
        this.mount(container, state);
      });
    });

    // Collapse card buttons
    container.querySelectorAll('.split-editor__collapse-card').forEach(btn => {
      btn.addEventListener('click', () => {
        this._expandedCardIndex = null;
        this.mount(container, state);
      });
    });

    // Delete card buttons
    container.querySelectorAll('.split-editor__delete-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index, 10);
        if (confirm(i18n.t('promptGen.deleteCardConfirm'))) {
          this._deck.cards.splice(index, 1);
          if (this._expandedCardIndex === index) {
            this._expandedCardIndex = null;
          } else if (this._expandedCardIndex > index) {
            this._expandedCardIndex--;
          }
          this._syncToYaml(container);
          this.mount(container, state);
        }
      });
    });

    // Inline card editing - delegate to module
    DeckEditorCardBinder.bindAll(container, {
      deck: this._deck,
      onSync: () => {
        this._lastEditSource = 'visual';
        this._syncToYaml(container);
      },
      onSyncDebounced: () => {
        this._lastEditSource = 'visual';
        DeckEditorSyncController.debounceSyncToYaml(() => this._syncToYaml(container));
      },
      onRemount: () => this.mount(container, state)
    });

    // Modal events
    this._bindModalEvents(container, state);

    // Mount TagSelector
    const tagContainer = container.querySelector('#visual-tags-selector');
    if (tagContainer && typeof Components !== 'undefined' && Components.tagSelector) {
      Components.tagSelector.mount(tagContainer, {
        selectedTags: this._deck?.tags || [],
        mode: 'edit'
      }, {
        onChange: (newTags) => {
          if (this._deck) {
            this._deck.tags = newTags;
            this._syncToYaml(container);
          }
        }
      });
    }
  },

  _bindVisualInputs(container, state) {
    const nameInput = container.querySelector('#visual-name');
    const descInput = container.querySelector('#visual-desc');
    const seqInput = container.querySelector('#visual-sequential');
    const simInput = container.querySelector('#visual-similarity');

    nameInput?.addEventListener('input', (e) => {
      if (this._deck) {
        this._deck.name = e.target.value;
        this._lastEditSource = 'visual';
        DeckEditorSyncController.debounceSyncToYaml(() => this._syncToYaml(container));
      }
    });

    descInput?.addEventListener('input', (e) => {
      if (this._deck) {
        this._deck.description = e.target.value;
        this._lastEditSource = 'visual';
        DeckEditorSyncController.debounceSyncToYaml(() => this._syncToYaml(container));
      }
    });

    seqInput?.addEventListener('change', (e) => {
      if (this._deck) {
        this._deck.settings = this._deck.settings || {};
        this._deck.settings.sequential = e.target.checked;
        this._syncToYaml(container);
      }
    });

    simInput?.addEventListener('change', (e) => {
      if (this._deck) {
        this._deck.settings = this._deck.settings || {};
        this._deck.settings.similarityMatching = e.target.checked;
        this._syncToYaml(container);
      }
    });

    // Image du deck
    const imageInput = container.querySelector('#visual-image');
    const imageRemove = container.querySelector('.split-editor__image-remove');

    imageInput?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file || !this._deck) return;

      if (file.size > 500 * 1024) {
        alert(i18n.t('editor.imageTooLarge'));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this._deck.image = reader.result;
        this._lastEditSource = 'visual';
        this._syncToYaml(container);
        this.mount(container, state);
      };
      reader.readAsDataURL(file);
    });

    imageRemove?.addEventListener('click', () => {
      if (this._deck) {
        delete this._deck.image;
        this._lastEditSource = 'visual';
        this._syncToYaml(container);
        this.mount(container, state);
      }
    });
  },

  _bindModalEvents(container, state) {
    container.querySelector('.split-editor__modal-close')?.addEventListener('click', () => {
      this._editingCardIndex = null;
      this.mount(container, state);
    });

    container.querySelector('.split-editor__modal-cancel')?.addEventListener('click', () => {
      this._editingCardIndex = null;
      this.mount(container, state);
    });

    container.querySelector('#card-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'card-modal') {
        this._editingCardIndex = null;
        this.mount(container, state);
      }
    });

    container.querySelector('.split-editor__modal-save')?.addEventListener('click', () => {
      const question = container.querySelector('#modal-question')?.value?.trim();
      const answer = container.querySelector('#modal-answer')?.value?.trim();
      const type = container.querySelector('#modal-type')?.value || 'text';
      const feedback = container.querySelector('#modal-feedback')?.value?.trim();

      if (!question || !answer) {
        alert(i18n.t('editor.questionAnswerRequired'));
        return;
      }

      const card = {
        id: this._editingCardIndex === -1 ? `card_${Date.now()}` : this._deck.cards[this._editingCardIndex]?.id || `card_${Date.now()}`,
        question,
        answer,
        type,
        ...(feedback ? { feedback } : {})
      };

      if (this._editingCardIndex === -1) {
        this._deck.cards.push(card);
      } else {
        this._deck.cards[this._editingCardIndex] = card;
      }

      this._syncToYaml(container);
      this._editingCardIndex = null;
      this.mount(container, state);
    });
  },

  _setupDividerResize(container, state) {
    // mount() peut être rappelé : retirer les listeners document de l'appel précédent
    if (this._removeDividerListeners) {
      this._removeDividerListeners();
      this._removeDividerListeners = null;
    }

    const divider = container.querySelector('#split-divider');
    const editorContainer = container.querySelector('.split-editor__container');
    if (!divider || !editorContainer) return;

    let isDragging = false;
    let startX = 0;
    let startWidth = 0;

    divider.addEventListener('mousedown', (e) => {
      isDragging = true;
      startX = e.clientX;
      startWidth = this._leftPanelWidth;
      divider.classList.add('split-editor__divider--dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      e.preventDefault();
    });

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const containerRect = editorContainer.getBoundingClientRect();
      const deltaX = e.clientX - startX;
      const deltaPercent = (deltaX / containerRect.width) * 100;
      this._leftPanelWidth = Math.max(20, Math.min(80, startWidth + deltaPercent));

      const leftPanel = container.querySelector('.split-editor__panel--left');
      const rightPanel = container.querySelector('.split-editor__panel--right');
      if (leftPanel) leftPanel.style.flex = this._leftPanelWidth;
      if (rightPanel) rightPanel.style.flex = 100 - this._leftPanelWidth;
    };

    const onMouseUp = () => {
      if (isDragging) {
        isDragging = false;
        divider.classList.remove('split-editor__divider--dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    this._removeDividerListeners = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  },

  _syncFromYaml(container, state) {
    const result = DeckEditorSyncController.parseYamlToDeck(this._yamlContent, this._deck);
    this._yamlError = result.error;

    if (result.deck) {
      this._deck = result.deck;
      if (this._lastEditSource === 'yaml') {
        this._updateVisualPanel(container, state);
      }
    }

    DeckEditorSyncController.updateCodeStatus(container, this._yamlError, this._deck?.cards?.length || 0);
  },

  _syncToYaml(container) {
    if (!this._deck) return;
    this._yamlContent = DeckEditorSyncController.deckToYaml(this._deck);
    DeckEditorSyncController.updateYamlTextarea(container, this._yamlContent, this._lastEditSource);
    DeckEditorSyncController.updateCodeStatus(container, null, this._deck?.cards?.length || 0);
  },

  _updateVisualPanel(container, state) {
    const leftPanel = container.querySelector('.split-editor__panel--left');
    const rightPanel = container.querySelector('.split-editor__panel--right');
    const visualPanel = this._swapped ? leftPanel : rightPanel;

    if (visualPanel) {
      visualPanel.innerHTML = this._renderVisualPanel();
      this._bindVisualInputs(container, state);

      // Rebind card actions
      visualPanel.querySelectorAll('.split-editor__expand-card').forEach(btn => {
        btn.addEventListener('click', () => {
          this._expandedCardIndex = parseInt(btn.dataset.index, 10);
          this.mount(container, state);
        });
      });

      visualPanel.querySelectorAll('.split-editor__delete-card').forEach(btn => {
        btn.addEventListener('click', () => {
          const index = parseInt(btn.dataset.index, 10);
          if (confirm(i18n.t('promptGen.deleteCardConfirm'))) {
            this._deck.cards.splice(index, 1);
            this._syncToYaml(container);
            this.mount(container, state);
          }
        });
      });

      visualPanel.querySelectorAll('.split-editor__add-card-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!this._deck.cards) this._deck.cards = [];
          const newCard = { id: `card_${Date.now()}`, question: '', answer: '', type: 'text' };
          this._deck.cards.push(newCard);
          this._expandedCardIndex = this._deck.cards.length - 1;
          this._syncToYaml(container);
          this.mount(container, state);
        });
      });

      // Remount TagSelector
      const tagContainer = visualPanel.querySelector('#visual-tags-selector');
      if (tagContainer && typeof Components !== 'undefined' && Components.tagSelector) {
        Components.tagSelector.mount(tagContainer, {
          selectedTags: this._deck?.tags || [],
          mode: 'edit'
        }, {
          onChange: (newTags) => {
            if (this._deck) {
              this._deck.tags = newTags;
              this._syncToYaml(container);
            }
          }
        });
      }
    }
  },

  _saveDeck(state) {
    if (!this._deck) {
      alert(i18n.t('editor.nothingToSave'));
      return;
    }

    if (!this._deck.name?.trim()) {
      alert(i18n.t('editor.nameRequired'));
      return;
    }

    if (!this._deck.cards || this._deck.cards.length === 0) {
      alert(i18n.t('editor.cardRequired'));
      return;
    }

    // Chaque carte doit avoir une question et une réponse : sinon elle serait injouable
    const incomplete = this._deck.cards.findIndex(card =>
      !String(card?.question ?? '').trim() || !String(card?.answer ?? '').trim());
    if (incomplete !== -1) {
      alert(PageUtils.getTranslator()('deckEditor.cardIncomplete', { n: incomplete + 1 }));
      return;
    }

    this._deck.cards = this._deck.cards.map(card => ({
      ...card,
      box: card.box || 'never_played',
      latencyThreshold: card.latencyThreshold || null,
      bestResponseTimeMs: card.bestResponseTimeMs || null,
      lastResponseTimeMs: card.lastResponseTimeMs || null,
      restUntil: card.restUntil || null,
      timesPlayed: card.timesPlayed || 0,
      timesCorrect: card.timesCorrect || 0
    }));

    Storage.saveCustomDeck(this._deck);

    const decks = App._loadDecks();
    State.set('decks', decks);

    alert(i18n.tn('editor.saved', this._deck.cards.length, { name: this._deck.name }));

    this._reset();
    Router.navigate('/deck-hub');
  },

  _reset() {
    this._deck = null;
    this._yamlContent = '';
    this._yamlError = null;
    this._swapped = false;
    this._editingCardIndex = null;
    this._expandedCardIndex = null;
    this._lastEditSource = null;
    this._editingId = null;
    DeckEditorSyncController.reset();
  }
};
