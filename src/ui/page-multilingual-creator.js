/**
 * Page Multilingual Creator - Création de decks multilingues
 *
 * Dépendances: Pages (pages-base.js), Components, Router, Storage, App, LinguaLibre
 */

// ═══════════════════════════════════════════════════════════════
// MULTILINGUAL CREATOR - Création de decks multilingues
// ═══════════════════════════════════════════════════════════════

Pages.multilingualCreator = {
  // État de navigation des thématiques
  _selectedLang: 'fr',
  _thematicLists: null,
  _loadingLists: false,
  _loadError: null,
  _selectedList: null,
  _targetLangs: ['en'],
  _generating: false,
  _generationProgress: null,
  _shareMode: false, // Si true, filtre les licences non-permissives (pour partage)
  _previewListId: null, // ID de la liste en prévisualisation (dropdown)
  _previewWords: null, // Mots prévisualisés
  _loadingPreview: false, // En cours de chargement de la prévisualisation

  render(state) {
    const { player, decks } = state;
    const _t = PageUtils.getTranslator();

    // Filtrer les decks multilingues existants
    const multilingualDecks = (decks || []).filter(d => d.type === 'multilingual');

    return `
      <div class="page page--multilingual-creator">
        <header class="page__header">
          <button class="page__back" aria-label="${i18n.t('common.back')}">←</button>
          <h1 class="page__title">🌍 ${i18n.t('deckHub.multilingual')}</h1>
        </header>

        <main class="page__content" id="main-content" role="main">
          <p class="page__intro">
            ${i18n.t('mlcCreator.intro')}
          </p>

          <!-- Section Explorer les thématiques -->
          <section class="multilingual-creator__section">
            <h2>🔍 ${i18n.t('mlcCreator.explore')}</h2>
            <p>${i18n.t('mlcCreator.exploreDesc')}</p>

            <div class="multilingual-creator__explorer">
              <!-- Sélection de langue source -->
              <div class="multilingual-creator__lang-select">
                <label for="source-lang">${i18n.t('mlcCreator.sourceLang')}</label>
                <select id="source-lang" class="multilingual-creator__select">
                  <option value="fr" ${this._selectedLang === 'fr' ? 'selected' : ''}>🇫🇷 ${i18n.languageName('fr')}</option>
                  <option value="en" ${this._selectedLang === 'en' ? 'selected' : ''}>🇬🇧 ${i18n.languageName('en')}</option>
                  <option value="es" ${this._selectedLang === 'es' ? 'selected' : ''}>🇪🇸 ${i18n.languageName('es')}</option>
                  <option value="de" ${this._selectedLang === 'de' ? 'selected' : ''}>🇩🇪 ${i18n.languageName('de')}</option>
                  <option value="it" ${this._selectedLang === 'it' ? 'selected' : ''}>🇮🇹 ${i18n.languageName('it')}</option>
                  <option value="pt" ${this._selectedLang === 'pt' ? 'selected' : ''}>🇵🇹 ${i18n.languageName('pt')}</option>
                </select>
                <button class="btn btn--secondary multilingual-creator__load-btn" ${this._loadingLists ? 'disabled' : ''}>
                  ${this._loadingLists ? `⏳ ${i18n.t('app.loading')}` : `📂 ${i18n.t('mlcCreator.load')}`}
                </button>
              </div>

              <!-- Liste des thématiques -->
              ${this._renderThematicLists()}
            </div>
          </section>

          <!-- Section Import -->
          <section class="multilingual-creator__section">
            <h2>📥 ${i18n.t('mlcCreator.importTitle')}</h2>
            <p>${i18n.t('mlcCreator.importDesc')}</p>

            <div class="multilingual-creator__actions">
              <button class="btn btn--secondary multilingual-creator__import-btn">
                📁 ${i18n.t('mlcCreator.importFile')}
              </button>
              <input type="file" id="multilingual-file-import" accept=".yaml,.yml" style="display: none;">
            </div>

            <details class="multilingual-creator__format">
              <summary>📋 ${i18n.t('mlcCreator.format')}</summary>
              <pre class="multilingual-creator__code">
id: mon-vocabulaire
name: Mon vocabulaire
type: multilingual
languages: ['fr', 'en', 'es']
category: ['vocabulaire']

words:
  - id: pomme
    translations:
      fr: pomme
      en: apple
      es: manzana
    alternatives:
      en: [an apple]
    # audio: { fr: url, en: url }
    # image: url
              </pre>
            </details>
          </section>

          ${multilingualDecks.length > 0 ? `
            <section class="multilingual-creator__section">
              <h2>📚 ${i18n.t('mlcCreator.available', { count: multilingualDecks.length })}</h2>
              <div class="multilingual-creator__decks">
                ${multilingualDecks.map(deck => `
                  <div class="multilingual-creator__deck" data-deck-id="${escapeHtml(deck.id)}">
                    <div class="multilingual-creator__deck-info">
                      <h3>${escapeHtml(deck.name)}</h3>
                      <p>${i18n.tn('common.wordsCount', deck.words?.length || 0)} • ${escapeHtml((deck.languages || []).join(', '))}</p>
                    </div>
                    <div class="multilingual-creator__deck-actions">
                      <button class="btn btn--secondary multilingual-creator__play-btn" data-deck-id="${escapeHtml(deck.id)}">
                        ▶️ ${i18n.t('deckReview.play')}
                      </button>
                      <button class="btn btn--danger multilingual-creator__delete-btn" data-deck-id="${escapeHtml(deck.id)}" title="${i18n.t('common.delete')}" aria-label="${i18n.t('common.delete')}">
                        🗑️
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </section>
          ` : ''}
        </main>

        ${PageUtils.renderFooter(player, 'deck-hub')}
      </div>
    `;
  },

  _renderThematicLists() {
    if (this._loadingLists) {
      return `
        <div class="multilingual-creator__loading">
          <div class="spinner"></div>
          <p>${i18n.t('mlcCreator.loadingLists')}</p>
        </div>
      `;
    }

    if (this._loadError) {
      const isFileProtocol = window.location.protocol === 'file:';
      return `
        <div class="multilingual-creator__error">
          <p>⚠️ ${escapeHtml(this._loadError)}</p>
          ${isFileProtocol ? `
            <p class="multilingual-creator__error-hint">
              ${i18n.t('mlcCreator.fileNote')}
            </p>
          ` : ''}
        </div>
      `;
    }

    if (!this._thematicLists) {
      return `
        <div class="multilingual-creator__empty-lists">
          <p>${i18n.t('mlcCreator.clickLoad')}</p>
        </div>
      `;
    }

    if (this._thematicLists.length === 0) {
      return `
        <div class="multilingual-creator__empty-lists">
          <p>${i18n.t('mlcCreator.noLists')}</p>
        </div>
      `;
    }

    // Si une liste est sélectionnée, afficher le formulaire de génération
    if (this._selectedList) {
      return this._renderGenerationForm();
    }

    // Sinon afficher la grille des thématiques
    return `
      <div class="multilingual-creator__lists-grid">
        ${this._thematicLists.map(list => `
          <div class="multilingual-creator__list-item-wrapper">
            <div class="multilingual-creator__list-item-row">
              <button class="multilingual-creator__list-item" data-list-id="${escapeHtml(list.id)}">
                <span class="multilingual-creator__list-name">${escapeHtml(list.name)}</span>
              </button>
              <button class="multilingual-creator__preview-eye ${this._previewListId === list.id ? 'multilingual-creator__preview-eye--active' : ''}"
                      data-list-id="${escapeHtml(list.id)}"
                      title="${i18n.t('mlcCreator.preview')}"
                      aria-label="${i18n.t('mlcCreator.previewOf', { name: escapeHtml(list.name) })}">
                👁️
              </button>
            </div>
            ${this._previewListId === list.id ? this._renderPreviewDropdown() : ''}
          </div>
        `).join('')}
      </div>
      <p class="multilingual-creator__lists-count">${i18n.tn('mlcCreator.listsFound', this._thematicLists.length)}</p>
    `;
  },

  _renderGenerationForm() {
    const availableLangs = ['fr', 'en', 'es', 'de', 'it', 'pt', 'nl'].filter(l => l !== this._selectedLang);
    const langLabels = {
      fr: '🇫🇷 ' + i18n.languageName('fr'), en: '🇬🇧 ' + i18n.languageName('en'), es: '🇪🇸 ' + i18n.languageName('es'),
      de: '🇩🇪 ' + i18n.languageName('de'), it: '🇮🇹 ' + i18n.languageName('it'), pt: '🇵🇹 ' + i18n.languageName('pt'), nl: '🇳🇱 ' + i18n.languageName('nl')
    };

    if (this._generating) {
      const progress = this._generationProgress || { text: i18n.t('mlcCreator.init'), percent: 0 };
      return `
        <div class="multilingual-creator__generating">
          <h3>📥 ${i18n.t('mlcCreator.generating')}</h3>
          <p class="multilingual-creator__progress-text">${escapeHtml(progress.text)}</p>
          <div class="progress-bar">
            <div class="progress-bar__fill" style="width: ${progress.percent}%"></div>
          </div>
          <p class="multilingual-creator__progress-percent">${progress.percent}%</p>
          <p class="multilingual-creator__progress-hint">
            ⏳ ${i18n.t('mlcCreator.downloading')}
          </p>
        </div>
      `;
    }

    // Calculer l'estimation et l'état du stockage
    const storageInfo = this._getStorageInfo();
    const languageCount = 1 + this._targetLangs.length; // source + cibles

    // Utiliser le nombre de mots prévisualisés si disponible pour cette liste
    const wordCount = (this._previewListId === this._selectedList.id && this._previewWords)
      ? this._previewWords.length
      : null;

    // Estimation de taille
    let estimationHtml = '';
    let warningHtml = '';

    if (wordCount !== null) {
      // Estimation précise avec le nombre de mots connu
      const estimation = this._estimateDeckSize(wordCount, languageCount);
      const wouldExceed = estimation.estimatedBytes > storageInfo.available;
      const wouldBeClose = estimation.estimatedBytes > storageInfo.available * 0.7;

      estimationHtml = `
        <div class="multilingual-creator__estimation">
          <span class="multilingual-creator__estimation-label">📊 ${i18n.t('mlcCreator.estimation')}</span>
          <span class="multilingual-creator__estimation-value">${i18n.t('mlcCreator.estimationExact', { words: wordCount, langs: languageCount, size: estimation.estimatedMB })}</span>
        </div>
      `;

      if (wouldExceed) {
        warningHtml = `
          <div class="multilingual-creator__warning multilingual-creator__warning--error">
            ⚠️ ${i18n.t('mlcCreator.noSpace', { size: estimation.estimatedMB, available: storageInfo.availableMB })}
          </div>
        `;
      } else if (wouldBeClose) {
        warningHtml = `
          <div class="multilingual-creator__warning multilingual-creator__warning--caution">
            ⚡ ${i18n.t('mlcCreator.closeSpace', { size: estimation.estimatedMB, available: storageInfo.availableMB })}
          </div>
        `;
      }
    } else {
      // Estimation approximative (sans nombre de mots)
      const minEstimate = this._estimateDeckSize(10, languageCount);
      const maxEstimate = this._estimateDeckSize(100, languageCount);

      estimationHtml = `
        <div class="multilingual-creator__estimation multilingual-creator__estimation--range">
          <span class="multilingual-creator__estimation-label">📊 ${i18n.t('mlcCreator.estimation')}</span>
          <span class="multilingual-creator__estimation-value">${i18n.t('mlcCreator.estimationRange', { langs: languageCount, min: minEstimate.estimatedMB, max: maxEstimate.estimatedMB })}</span>
          <span class="multilingual-creator__estimation-hint">${i18n.t('mlcCreator.estimationHint')}</span>
        </div>
      `;

      // Avertissement si même le min pourrait poser problème
      if (minEstimate.estimatedBytes > storageInfo.available * 0.5) {
        warningHtml = `
          <div class="multilingual-creator__warning multilingual-creator__warning--caution">
            ⚡ ${i18n.t('mlcCreator.mayBeLarge', { langs: languageCount })}
          </div>
        `;
      }
    }

    return `
      <div class="multilingual-creator__generation-form">
        <div class="multilingual-creator__selected-list">
          <h3>📋 ${escapeHtml(this._selectedList.name)}</h3>
          <button class="btn btn--text multilingual-creator__back-to-lists">← ${i18n.t('mlcCreator.otherList')}</button>
        </div>

        <div class="multilingual-creator__target-langs">
          <label>${i18n.t('mlcCreator.targetLangs')}</label>
          <div class="multilingual-creator__lang-checkboxes">
            ${availableLangs.map(lang => `
              <label class="multilingual-creator__lang-checkbox">
                <input type="checkbox" value="${lang}" ${this._targetLangs.includes(lang) ? 'checked' : ''}>
                ${langLabels[lang]}
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Storage et Estimation -->
        <div class="multilingual-creator__storage-info">
          <div class="multilingual-creator__storage-bar">
            <div class="multilingual-creator__storage-label">
              💾 ${i18n.t('mlcCreator.storage', { used: storageInfo.usedMB, total: storageInfo.totalMB, percent: storageInfo.percentage })}
            </div>
            <div class="progress-bar progress-bar--storage">
              <div class="progress-bar__fill ${storageInfo.percentage > 80 ? 'progress-bar__fill--warning' : ''} ${storageInfo.percentage > 95 ? 'progress-bar__fill--critical' : ''}"
                   style="width: ${Math.min(storageInfo.percentage, 100)}%"></div>
            </div>
          </div>
          ${estimationHtml}
          ${warningHtml}
        </div>

        <div class="multilingual-creator__license-option">
          <label class="multilingual-creator__share-checkbox">
            <input type="checkbox" id="share-mode-checkbox" ${this._shareMode ? 'checked' : ''}>
            <span>🔗 ${i18n.t('mlcCreator.shareMode')}</span>
          </label>
          <p class="multilingual-creator__share-hint">
            ${this._shareMode
              ? `✅ ${escapeHtml(PageUtils.getTranslator()('multilingual.shareHintOn'))}`
              : `ℹ️ ${i18n.t('mlcCreator.shareHintOff')}`}
          </p>
        </div>

        <div class="multilingual-creator__generate-actions">
          <button class="btn btn--primary multilingual-creator__generate-btn" ${this._targetLangs.length === 0 ? 'disabled' : ''}>
            🚀 ${i18n.t('mlcCreator.generate')}
          </button>
        </div>
      </div>
    `;
  },

  mount(container, state) {
    container.innerHTML = this.render(state);
    this._bindEvents(container, state);
  },

  _bindEvents(container, state) {
    const remount = () => this.mount(container, state);

    // Retour
    container.querySelector('.page__back')?.addEventListener('click', () => {
      this._reset();
      history.back();
    });

    // Sélection langue source
    container.querySelector('#source-lang')?.addEventListener('change', (e) => {
      this._selectedLang = e.target.value;
      this._thematicLists = null;
      this._selectedList = null;
      remount();
    });

    // Charger les thématiques
    container.querySelector('.multilingual-creator__load-btn')?.addEventListener('click', async () => {
      this._loadingLists = true;
      this._loadError = null;
      remount();

      try {
        this._thematicLists = await LinguaLibre.getThematicLists(this._selectedLang);

        if (!this._thematicLists || this._thematicLists.length === 0) {
          this._loadError = i18n.t('mlcCreator.noListsOnline');
        }
      } catch (err) {
        console.error('[Multilingual] Error loading lists:', err);
        this._loadError = i18n.t('mlcCreator.loadError', { message: err.message || i18n.t('mlcCreator.noConnection') });
        this._thematicLists = [];
      }

      this._loadingLists = false;
      remount();
    });

    // Sélection d'une thématique
    container.querySelectorAll('.multilingual-creator__list-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const listId = btn.dataset.listId;
        this._selectedList = this._thematicLists.find(l => l.id === listId);
        remount();
      });
    });

    // Retour à la liste des thématiques
    container.querySelector('.multilingual-creator__back-to-lists')?.addEventListener('click', () => {
      this._selectedList = null;
      this._previewListId = null;
      this._previewWords = null;
      this._loadingPreview = false;
      remount();
    });

    // Boutons œil pour prévisualiser les mots d'une thématique
    container.querySelectorAll('.multilingual-creator__preview-eye').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Empêcher la sélection de la thématique
        const listId = btn.dataset.listId;
        this._loadPreviewWords(listId, remount);
      });
    });

    // Bouton fermer la prévisualisation
    container.querySelector('.multilingual-creator__preview-close')?.addEventListener('click', () => {
      this._previewListId = null;
      this._previewWords = null;
      this._loadingPreview = false;
      remount();
    });

    // Checkboxes langues cibles
    container.querySelectorAll('.multilingual-creator__lang-checkbox input').forEach(cb => {
      cb.addEventListener('change', () => {
        const checked = Array.from(container.querySelectorAll('.multilingual-creator__lang-checkbox input:checked'))
          .map(c => c.value);
        this._targetLangs = checked;
        remount();
      });
    });

    // Checkbox mode partage (licences permissives uniquement)
    container.querySelector('#share-mode-checkbox')?.addEventListener('change', (e) => {
      this._shareMode = e.target.checked;
      remount();
    });

    // Générer le deck
    container.querySelector('.multilingual-creator__generate-btn')?.addEventListener('click', async () => {
      await this._generateDeck(container, state, remount);
    });

    // Import file
    const fileInput = container.querySelector('#multilingual-file-import');
    container.querySelector('.multilingual-creator__import-btn')?.addEventListener('click', () => {
      fileInput?.click();
    });

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        this._importYAML(event.target.result, file.name, container, state);
      };
      reader.readAsText(file);
    });

    // Play buttons
    container.querySelectorAll('.multilingual-creator__play-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const deckId = btn.dataset.deckId;
        Router.navigate(`/multilingual-config/${deckId}`);
      });
    });

    // Delete buttons
    container.querySelectorAll('.multilingual-creator__delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const deckId = btn.dataset.deckId;
        const deck = state.decks.find(d => d.id === deckId);
        if (deck && confirm(i18n.t('deckTable.deleteConfirm', { name: deck.name }))) {
          Storage.deleteCustomDeck(deckId);
          const allDecks = App._loadDecks();
          State.set('decks', allDecks);
          this.mount(container, State.getAll());
        }
      });
    });
  },

  async _generateDeck(container, state, remount) {
    this._generating = true;
    this._generationProgress = { text: i18n.t('mlcCreator.fetchingList'), percent: 0 };
    remount();

    try {
      const languages = [this._selectedLang, ...this._targetLangs];

      // Utiliser la fonction de génération de LinguaLibre
      // Si mode partage activé, filtrer les licences non-permissives
      const result = await LinguaLibre.generateMultilingualDeck(
        this._selectedList.id,
        languages,
        {
          deckName: this._selectedList.name,
          permissiveOnly: this._shareMode
        },
        (progress) => {
          // Formater le progress pour affichage
          if (progress.phase === 'fetching_list') {
            this._generationProgress = { text: i18n.t('mlcCreator.fetchingList'), percent: 5 };
          } else if (progress.phase === 'processing_word') {
            const percent = Math.round(5 + (progress.progress * 90));
            this._generationProgress = {
              text: `Téléchargement ${progress.current}/${progress.total} : ${progress.word}`,
              percent
            };
          } else if (progress.phase === 'complete') {
            this._generationProgress = { text: i18n.t('mlcCreator.finishing'), percent: 100 };
          }
          remount();
        }
      );

      // generateMultilingualDeck retourne { deck, errors }
      const { deck, errors } = result;

      if (errors && errors.length > 0) {
        console.warn('[Multilingual] Generation warnings:', errors);
      }

      if (!deck || !deck.words || deck.words.length === 0) {
        // Utiliser le message d'erreur spécifique de l'API si disponible
        const errorMsg = (errors && errors.length > 0)
          ? errors[0]
          : i18n.t('mlcCreator.noWordsInList');
        throw new Error(errorMsg);
      }

      // Sauvegarder le deck (saveCustomDeck gère l'ajout/mise à jour)
      const saveSuccess = Storage.saveCustomDeck(deck);

      if (!saveSuccess) {
        throw new Error(i18n.t('mlcCreator.saveFailed'));
      }

      // Recharger les decks
      const allDecks = App._loadDecks();
      State.set('decks', allDecks);

      alert(i18n.t('mlcCreator.created', { name: deck.name, words: deck.words.length, langs: languages.length }));

      // Reset et recharger
      this._selectedList = null;
      this._generating = false;
      this._generationProgress = null;
      this.mount(container, State.getAll());

    } catch (err) {
      console.error('[Multilingual] Generation error:', err);
      alert(i18n.t('mlcCreator.generationError', { message: err.message }));
      this._generating = false;
      this._generationProgress = null;
      remount();
    }
  },

  _importYAML(content, fileName, container, state) {
    try {
      if (typeof YAML === 'undefined') {
        throw new Error('YAML parser not available');
      }

      const deck = YAML.parse(content);

      // Valider le format multilingue
      if (deck.type !== 'multilingual' || !Array.isArray(deck.words)) {
        throw new Error(i18n.t('mlcCreator.notMultilingual'));
      }

      if (!deck.id) {
        deck.id = 'multilingual-' + Date.now();
      }

      // Sauvegarder (saveCustomDeck gère l'ajout/mise à jour)
      Storage.saveCustomDeck(deck);

      // Recharger les decks
      const allDecks = App._loadDecks();
      State.set('decks', allDecks);

      alert(i18n.t('mlcCreator.imported', { name: deck.name, words: deck.words.length, langs: (deck.languages || []).length }));

      // Recharger la page
      this.mount(container, State.getAll());

    } catch (err) {
      console.error('[Multilingual Import] Error:', err);
      alert(i18n.t('common.importError', { message: err.message }));
    }
  },

  _renderPreviewDropdown() {
    if (this._loadingPreview) {
      return `
        <div class="multilingual-creator__preview-dropdown">
          <div class="multilingual-creator__preview-loading">
            <div class="spinner spinner--small"></div>
            <span>${i18n.t('mlcCreator.loadingWords')}</span>
          </div>
        </div>
      `;
    }

    if (!this._previewWords || this._previewWords.length === 0) {
      return `
        <div class="multilingual-creator__preview-dropdown">
          <p class="multilingual-creator__preview-empty-msg">⚠️ ${i18n.t('mlcCreator.noWords')}</p>
        </div>
      `;
    }

    // Afficher tous les mots dans un dropdown scrollable
    return `
      <div class="multilingual-creator__preview-dropdown">
        <div class="multilingual-creator__preview-header">
          <span class="multilingual-creator__preview-count">
            ${i18n.tn('common.wordsCount', this._previewWords.length)}
          </span>
          <button class="btn btn--text multilingual-creator__preview-close" title="${i18n.t('common.close')}" aria-label="${i18n.t('common.close')}">✕</button>
        </div>
        <div class="multilingual-creator__preview-words-scroll">
          ${this._previewWords.map(word => `
            <span class="multilingual-creator__preview-word">${escapeHtml(word)}</span>
          `).join('')}
        </div>
      </div>
    `;
  },

  async _loadPreviewWords(listId, remount) {
    // Si on clique sur le même œil, fermer le dropdown
    if (this._previewListId === listId && this._previewWords !== null) {
      this._previewListId = null;
      this._previewWords = null;
      this._loadingPreview = false;
      remount();
      return;
    }

    this._previewListId = listId;
    this._loadingPreview = true;
    this._previewWords = null;
    remount();

    try {
      const result = await LinguaLibre.getWordsFromList(listId);
      // result est un tableau d'objets { word, transcription }
      this._previewWords = (result || []).map(item =>
        typeof item === 'string' ? item : item.word
      );
    } catch (err) {
      console.error('[Multilingual] Error loading preview:', err);
      this._previewWords = [];
    }

    this._loadingPreview = false;
    remount();
  },

  _reset() {
    this._selectedLang = 'fr';
    this._thematicLists = null;
    this._loadingLists = false;
    this._loadError = null;
    this._selectedList = null;
    this._targetLangs = ['en'];
    this._generating = false;
    this._generationProgress = null;
    this._shareMode = false;
    this._previewListId = null;
    this._previewWords = null;
    this._loadingPreview = false;
  },

  /**
   * Estime la taille d'un deck multilingue en bytes
   * @param {number} wordCount - Nombre de mots dans la thématique
   * @param {number} languageCount - Nombre de langues (source + cibles)
   * @returns {{ estimatedBytes: number, estimatedMB: string, breakdown: Object }}
   */
  _estimateDeckSize(wordCount, languageCount) {
    // Constantes d'estimation basées sur des mesures réelles
    const AUDIO_BASE64_AVG = 25 * 1024;  // ~25 KB par fichier audio (base64 .ogg)
    const METADATA_PER_WORD = 200;        // ~200 bytes par mot (id, translations, etc.)
    const DECK_OVERHEAD = 2000;           // ~2 KB pour métadonnées deck

    // Estimation par mot : audio pour chaque langue + métadonnées
    const audioPerWord = AUDIO_BASE64_AVG * languageCount;
    const metadataPerWord = METADATA_PER_WORD * languageCount;
    const totalPerWord = audioPerWord + metadataPerWord;

    // Total brut (avant compression)
    const rawSize = (wordCount * totalPerWord) + DECK_OVERHEAD;

    // Avec compression LZ-String (~50% de réduction sur base64)
    // Mais base64 audio est déjà assez incompressible, donc ~70% du raw
    const compressedSize = Math.round(rawSize * 0.7);

    return {
      estimatedBytes: compressedSize,
      estimatedMB: (compressedSize / (1024 * 1024)).toFixed(2),
      breakdown: {
        wordCount,
        languageCount,
        audioPerWord: Math.round(audioPerWord / 1024) + ' KB',
        rawSizeMB: (rawSize / (1024 * 1024)).toFixed(2),
        compressionRatio: '~70%'
      }
    };
  },

  /**
   * Récupère l'état actuel du localStorage avec formatage
   * @returns {{ used: number, available: number, usedMB: string, availableMB: string, percentage: number }}
   */
  _getStorageInfo() {
    if (typeof Storage === 'undefined') {
      return { used: 0, available: 50 * 1024 * 1024, usedMB: '0', availableMB: '50', percentage: 0 };
    }
    const usage = Storage.getStorageUsage();
    return {
      used: usage.used,
      available: usage.total - usage.used,
      usedMB: usage.usedMB,
      availableMB: ((usage.total - usage.used) / (1024 * 1024)).toFixed(2),
      totalMB: usage.totalMB,
      percentage: Math.round(usage.percentage * 100)
    };
  }
};
