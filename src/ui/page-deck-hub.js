/**
 * Page Deck Hub - Centre de création et gestion des decks
 *
 * Dépendances: Pages (pages-base.js), Components, Router, Storage, Moodle, App
 */

// ═══════════════════════════════════════════════════════════════
// DECK HUB - Centre de création et gestion des decks
// ═══════════════════════════════════════════════════════════════

Pages.deckHub = {
  render(state) {
    const { player } = state;
    const _t = PageUtils.getTranslator();

    return `
      <div class="page page--deck-hub">
        <main class="page__content" id="main-content" role="main">
          <h1 class="deck-hub__title">➕ ${_t('deckHub.title')}</h1>
          <p class="deck-hub__subtitle">${_t('deckHub.subtitle')}</p>

          <!-- Actions principales -->
          <section class="deck-hub__actions">
            <div class="deck-hub__action-card deck-hub__action-card--primary" data-action="create" role="button" tabindex="0">
              <div class="deck-hub__action-icon">✏️</div>
              <div class="deck-hub__action-content">
                <h3>${_t('deckHub.createManual')}</h3>
                <p>${_t('deckHub.createManualDesc')}</p>
              </div>
              <span class="deck-hub__action-arrow">→</span>
            </div>

            <div class="deck-hub__action-card deck-hub__action-card--ai" data-action="ai" role="button" tabindex="0">
              <div class="deck-hub__action-icon">🤖</div>
              <div class="deck-hub__action-content">
                <h3>${_t('deckHub.generateAI')}</h3>
                <p>${_t('deckHub.generateAIDesc')}</p>
              </div>
              <span class="deck-hub__action-arrow">→</span>
            </div>

            <div class="deck-hub__action-card deck-hub__action-card--dictation" data-action="dictation" role="button" tabindex="0">
              <div class="deck-hub__action-icon">🎧</div>
              <div class="deck-hub__action-content">
                <h3>${_t('deckHub.dictation')}</h3>
                <p>${_t('deckHub.dictationDesc')}</p>
              </div>
              <span class="deck-hub__action-arrow">→</span>
            </div>

            <div class="deck-hub__action-card deck-hub__action-card--multilingual" data-action="multilingual" role="button" tabindex="0">
              <div class="deck-hub__action-icon">🌍</div>
              <div class="deck-hub__action-content">
                <h3>${_t('deckHub.multilingual')}</h3>
                <p>${_t('deckHub.multilingualDesc')}</p>
              </div>
              <span class="deck-hub__action-arrow">→</span>
            </div>

            <div class="deck-hub__action-card deck-hub__action-card--merge" data-action="merge" role="button" tabindex="0">
              <div class="deck-hub__action-icon">🔀</div>
              <div class="deck-hub__action-content">
                <h3>${_t('deckHub.mergeDeck')}</h3>
                <p>${_t('deckHub.mergeDeckDesc')}</p>
              </div>
              <span class="deck-hub__action-arrow">→</span>
            </div>

            <div class="deck-hub__action-card" data-action="paste" role="button" tabindex="0">
              <div class="deck-hub__action-icon">📋</div>
              <div class="deck-hub__action-content">
                <h3>${_t('deckHub.pasteYAML')}</h3>
                <p>${_t('deckHub.pasteYAMLDesc')}</p>
              </div>
              <span class="deck-hub__action-arrow">→</span>
            </div>

            <div class="deck-hub__action-card" data-action="file" role="button" tabindex="0">
              <div class="deck-hub__action-icon">📁</div>
              <div class="deck-hub__action-content">
                <h3>${_t('deckHub.importFile')}</h3>
                <p>${_t('deckHub.importFileDesc')}</p>
              </div>
              <span class="deck-hub__action-arrow">→</span>
            </div>

            <div class="deck-hub__action-card deck-hub__action-card--coming-soon" data-action="cloud">
              <div class="deck-hub__action-icon">☁️</div>
              <div class="deck-hub__action-content">
                <h3>${_t('deckHub.deckHubCloud')} <span class="deck-hub__soon-badge deck-hub__soon-badge--soon">${_t('deckHub.comingSoon')}</span></h3>
                <p>${_t('deckHub.deckHubCloudDesc')}</p>
              </div>
              <span class="deck-hub__action-arrow">→</span>
            </div>
          </section>

          <!-- Section Corbeille -->
          ${this._renderTrashSection()}

          <!-- Input file caché -->
          <input type="file" id="hub-file-import" accept=".xml,.yaml,.yml,.json" style="display: none;">
        </main>

        ${PageUtils.renderFooter(player, 'deck-hub')}
      </div>
    `;
  },

  mount(container, state) {
    container.innerHTML = this.render(state);
    this._bindEvents(container, state);
    this._bindTrashEvents(container, state);
  },

  _bindEvents(container, state) {
    // Créer manuellement
    container.querySelector('[data-action="create"]')?.addEventListener('click', () => {
      Router.navigate('/deck-editor');
    });

    // Générer avec l'IA
    container.querySelector('[data-action="ai"]')?.addEventListener('click', () => {
      Pages.promptGenerator._showYamlEditor = false;
      Pages.promptGenerator._generatedPrompt = null;
      Router.navigate('/prompt-generator');
    });

    // Mode Dictée
    container.querySelector('[data-action="dictation"]')?.addEventListener('click', () => {
      Pages.promptGenerator._dictationMode = true;
      Pages.promptGenerator._showYamlEditor = false;
      Router.navigate('/prompt-generator');
    });

    // Mode Vocabulaire Multilingue
    container.querySelector('[data-action="multilingual"]')?.addEventListener('click', () => {
      Router.navigate('/multilingual-creator');
    });

    // Fusionner des decks
    container.querySelector('[data-action="merge"]')?.addEventListener('click', () => {
      Router.navigate('/deck-merger');
    });

    // Coller du YAML
    container.querySelector('[data-action="paste"]')?.addEventListener('click', () => {
      Pages.promptGenerator._showYamlEditor = true;
      Pages.promptGenerator._editorMode = 'code';
      Pages.promptGenerator._generatedPrompt = null;
      Router.navigate('/prompt-generator');
    });

    // Clavier : les cartes d'action sont des role="button" -> Entrée / Espace déclenchent le clic
    container.querySelectorAll('.deck-hub__action-card[role="button"]').forEach(card => {
      card.addEventListener('keydown', (e) => {
        if (e.target === card && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          card.click();
        }
      });
    });

    // Importer un fichier
    const fileInput = container.querySelector('#hub-file-import');
    container.querySelector('[data-action="file"]')?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target.result;
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith('.xml')) {
          // Import Moodle XML
          this._importMoodleXML(content, file.name, container, state);
        } else if (fileName.endsWith('.json')) {
          // Import JSON direct
          this._importJSON(content, file.name, container, state);
        } else {
          // Import YAML direct
          Pages.promptGenerator._yamlContent = content;
          Pages.promptGenerator._showYamlEditor = true;
          Pages.promptGenerator._editorMode = 'code';
          Pages.promptGenerator._generatedPrompt = null;
          // Même appel que le bouton « Valider » de la page (page-prompt-generator.js)
          const result = PromptGeneratorYamlLogic.validateYaml(content, Pages.promptGenerator._iterationHistory);
          Pages.promptGenerator._parsedDeck = result.parsedDeck;
          Pages.promptGenerator._yamlError = result.yamlError;
          Pages.promptGenerator._validationReport = result.validationReport;
          Router.navigate('/prompt-generator');
        }
      };
      reader.readAsText(file);
    });

  },

  _importJSON(content, fileName, container, state) {
    try {
      const data = JSON.parse(content);

      // Vérifier si c'est un deck valide
      let deck;
      if (data.cards && Array.isArray(data.cards)) {
        // Format deck direct
        deck = data;
      } else if (data.deck && data.deck.cards) {
        // Format avec wrapper
        deck = data.deck;
      } else {
        throw new Error('Format JSON invalide : aucun deck trouvé');
      }

      // Valider les cartes
      if (!deck.cards.length) {
        throw new Error('Le deck ne contient aucune carte');
      }

      // S'assurer que chaque carte a les champs requis
      deck.cards = deck.cards.map((card, idx) => ({
        id: card.id || `card_${Date.now()}_${idx}`,
        question: card.question || '',
        answer: card.answer || '',
        type: card.type || 'text',
        box: 'never_played',
        latencyThreshold: null,
        timesPlayed: 0,
        timesCorrect: 0,
        ...card
      }));

      // Générer un ID unique si nécessaire
      if (!deck.id) {
        deck.id = 'custom_' + Date.now();
      }

      // Nom par défaut
      if (!deck.name) {
        deck.name = fileName.replace(/\.json$/i, '');
      }

      // Sauvegarder
      Storage.saveCustomDeck(deck);

      // Recharger les decks
      const decks = App._loadDecks();
      State.set('decks', decks);

      alert(i18n.tn('deckHub.importedCards', deck.cards.length, { name: deck.name }));

      // Recharger la page
      this.mount(container, State.getAll());

    } catch (err) {
      console.error('[JSON Import] Error:', err);
      alert(i18n.t('deckHub.importErrorJson', { message: err.message }));
    }
  },

  _importMoodleXML(content, fileName, container, state) {
    try {
      // Valider le fichier
      const validation = Moodle.validate(content);
      if (!validation.valid) {
        alert(i18n.t('deckHub.importErrorMoodleXml', { message: validation.error }));
        return;
      }

      // Demander le nom du deck
      const deckName = prompt(i18n.t('deckHub.deckNamePrompt'), fileName.replace(/\.xml$/i, ''));
      if (!deckName) return;

      // Parser le deck
      const deck = Moodle.parseXML(content, deckName);

      // Sauvegarder
      Storage.saveCustomDeck(deck);

      // Recharger les decks
      const decks = App._loadDecks();
      State.set('decks', decks);

      alert(i18n.tn('deckHub.importedCards', deck.cards.length, { name: deckName }));

      // Recharger la page
      this.mount(container, State.getAll());

    } catch (err) {
      console.error('[Moodle Import] Error:', err);
      alert(i18n.t('deckHub.importErrorMoodle', { message: err.message }));
    }
  },

  /**
   * Rend la section de la corbeille
   * @private
   */
  _renderTrashSection() {
    const trashDecks = Storage.loadTrashDecks();
    const trashCount = trashDecks.length;
    const _t = PageUtils.getTranslator();

    if (trashCount === 0) {
      return '';
    }

    return `
      <section class="deck-hub__trash">
        <div class="deck-hub__trash-header" data-action="toggle-trash">
          <div class="deck-hub__trash-icon">🗑️</div>
          <div class="deck-hub__trash-info">
            <h3>${i18n.t('deckHub.trash')}</h3>
            <p>${i18n.tn('deckHub.trashCount', trashCount)}</p>
          </div>
          <span class="deck-hub__trash-toggle">▼</span>
        </div>

        <div class="deck-hub__trash-content" id="trash-content" style="display: none;">
          <div class="deck-hub__trash-list">
            ${trashDecks.map(deck => `
              <div class="deck-hub__trash-item" data-deck-id="${escapeHtml(deck.id)}">
                <div class="deck-hub__trash-item-info">
                  <span class="deck-hub__trash-item-name">${escapeHtml(deck.name)}</span>
                  <span class="deck-hub__trash-item-date">${i18n.t('deckHub.deletedOn', { date: (typeof i18n !== 'undefined' ? i18n.formatDate(deck.deletedAt) : new Date(deck.deletedAt).toLocaleDateString()) })}</span>
                </div>
                <div class="deck-hub__trash-item-actions">
                  <button class="btn btn--sm btn--ghost" data-action="restore" data-deck-id="${escapeHtml(deck.id)}" title="${i18n.t('deckHub.restore')}">
                    ↩️ ${i18n.t('deckHub.restore')}
                  </button>
                  <button class="btn btn--sm btn--ghost btn--danger" data-action="delete-permanent" data-deck-id="${escapeHtml(deck.id)}" title="${i18n.t('deckHub.deleteForever')}" aria-label="${i18n.t('deckHub.deleteForever')}">
                    ❌
                  </button>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="deck-hub__trash-footer">
            <button class="btn btn--sm btn--danger" data-action="empty-trash">
              🗑️ ${i18n.t('deckHub.emptyTrash')}
            </button>
          </div>
        </div>
      </section>
    `;
  },

  /**
   * Gère les événements de la corbeille
   * @private
   */
  _bindTrashEvents(container, state) {
    // Toggle corbeille
    container.querySelector('[data-action="toggle-trash"]')?.addEventListener('click', () => {
      const content = container.querySelector('#trash-content');
      const toggle = container.querySelector('.deck-hub__trash-toggle');
      if (content) {
        const isHidden = content.style.display === 'none';
        content.style.display = isHidden ? 'block' : 'none';
        if (toggle) toggle.textContent = isHidden ? '▲' : '▼';
      }
    });

    // Restaurer un deck
    container.querySelectorAll('[data-action="restore"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const deckId = btn.dataset.deckId;
        if (Storage.restoreFromTrash(deckId)) {
          // Recharger les decks
          const decks = App._loadDecks();
          State.set('decks', decks);
          alert(i18n.t('deckHub.restored'));
          this.mount(container, State.getAll());
        } else {
          alert(i18n.t('deckHub.restoreError'));
        }
      });
    });

    // Supprimer définitivement
    container.querySelectorAll('[data-action="delete-permanent"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const deckId = btn.dataset.deckId;
        if (confirm(i18n.t('deckHub.deleteForeverConfirm'))) {
          if (Storage.permanentlyDeleteDeck(deckId)) {
            this.mount(container, State.getAll());
          } else {
            alert(i18n.t('deckHub.deleteError'));
          }
        }
      });
    });

    // Vider la corbeille
    container.querySelector('[data-action="empty-trash"]')?.addEventListener('click', () => {
      const trashCount = Storage.getTrashCount();
      if (confirm(i18n.tn('deckHub.emptyTrashConfirm', trashCount))) {
        const result = Storage.emptyTrash();
        if (result.success) {
          alert(i18n.tn('deckHub.trashEmptied', result.count));
          this.mount(container, State.getAll());
        } else {
          alert(i18n.t('deckHub.emptyTrashError'));
        }
      }
    });
  }
};
