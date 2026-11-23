/**
 * Page PromptGenerator - Générateur de prompts LLM pour créer des decks
 *
 * Dépendances: escapeHtml (components.js), Components
 * Modules: State, Router, Storage, PromptGenerator, DeckValidator, PromptLearner, Tags
 * Sub-modules: PromptGeneratorDictation, PromptGeneratorMultilingual,
 *              PromptGeneratorFormRenderer, PromptGeneratorYamlRenderer, PromptGeneratorYamlLogic
 */

Pages.promptGenerator = {
  // État du formulaire
  _formData: null,
  _generatedPrompt: null,
  _currentStep: 1,
  _totalSteps: 3,

  // État de l'éditeur YAML
  _yamlContent: '',
  _yamlError: null,
  _parsedDeck: null,
  _validationReport: null,
  _showYamlEditor: false,
  _editorMode: 'code',
  _editingCardIndex: null,
  _iterationHistory: [],

  // État du mode dictée
  _dictationMode: false,
  _dictationLang: 'fr',
  _dictationWords: '',
  _dictationDeckName: '',
  _dictationProgress: null,
  _dictationErrors: [],
  _dictationGeneratedDeck: null,

  // État du mode multilingue
  _multilingualMode: false,
  _multilingualSourceLang: 'fr',
  _multilingualTargetLangs: ['en'],
  _multilingualWords: '',
  _multilingualDeckName: '',
  _multilingualProgress: null,
  _multilingualErrors: [],
  _multilingualGeneratedDeck: null,

  render(state) {
    const { player } = state;

    if (!this._formData) {
      this._formData = PromptGenerator.getDefaultFormData();
    }

    return `
      <div class="page page--prompt-generator">
        <main class="page__content" id="main-content" role="main">
          ${this._dictationMode ? this._renderDictationMode() :
            this._multilingualMode ? this._renderMultilingualMode() : `
            <h1 class="prompt-gen__title">🤖 ${i18n.t('promptGenerator.title')}</h1>
            <p class="prompt-gen__subtitle">${i18n.t('promptGen.subtitle')}</p>

            ${this._showYamlEditor
              ? PromptGeneratorYamlRenderer.renderEditor(this._getEditorContext())
              : (this._generatedPrompt
                  ? PromptGeneratorFormRenderer.renderResult(this._generatedPrompt)
                  : PromptGeneratorFormRenderer.renderForm(this._formData, this._currentStep, this._totalSteps))}
          `}
        </main>

        ${PageUtils.renderFooter(player, 'settings')}
      </div>
    `;
  },

  /**
   * Rend le mode dictée
   */
  _renderDictationMode() {
    return PromptGeneratorDictation.render({
      progress: this._dictationProgress,
      errors: this._dictationErrors,
      generatedDeck: this._dictationGeneratedDeck,
      words: this._dictationWords,
      lang: this._dictationLang,
      deckName: this._dictationDeckName
    });
  },

  /**
   * Retourne le contexte pour l'éditeur YAML
   */
  _getEditorContext() {
    return {
      editorMode: this._editorMode,
      yamlContent: this._yamlContent,
      yamlError: this._yamlError,
      parsedDeck: this._parsedDeck,
      validationReport: this._validationReport,
      editingCardIndex: this._editingCardIndex,
      iterationHistory: this._iterationHistory
    };
  },

  /**
   * Rend le mode multilingue
   */
  _renderMultilingualMode() {
    return PromptGeneratorMultilingual.render({
      progress: this._multilingualProgress,
      errors: this._multilingualErrors,
      generatedDeck: this._multilingualGeneratedDeck,
      words: this._multilingualWords,
      sourceLang: this._multilingualSourceLang,
      targetLangs: this._multilingualTargetLangs,
      deckName: this._multilingualDeckName
    });
  },

  /**
   * Reset le mode dictée
   */
  resetDictation() {
    this._dictationMode = false;
    this._dictationWords = '';
    this._dictationDeckName = '';
    this._dictationProgress = null;
    this._dictationErrors = [];
    this._dictationGeneratedDeck = null;
  },

  /**
   * Reset le mode multilingue
   */
  resetMultilingual() {
    this._multilingualMode = false;
    this._multilingualSourceLang = 'fr';
    this._multilingualTargetLangs = ['en'];
    this._multilingualWords = '';
    this._multilingualDeckName = '';
    this._multilingualProgress = null;
    this._multilingualErrors = [];
    this._multilingualGeneratedDeck = null;
  },

  mount(container, state) {
    container.innerHTML = this.render(state);
    this._bindEvents(container, state);
  },

  _bindEvents(container, state) {
    const remount = () => this.mount(container, state);

    // ═══════════════════════════════════════════════════════════════
    // MODE DICTÉE (accessible via le bouton dédié du Deck Hub)
    // ═══════════════════════════════════════════════════════════════

    if (this._dictationMode) {
      this._bindDictationEvents(container, remount);
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // MODE MULTILINGUE (accessible via le bouton dédié du Deck Hub)
    // ═══════════════════════════════════════════════════════════════

    if (this._multilingualMode) {
      this._bindMultilingualEvents(container, remount);
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // FORMULAIRE
    // ═══════════════════════════════════════════════════════════════

    this._bindFormEvents(container, state, remount);

    // ═══════════════════════════════════════════════════════════════
    // RÉSULTAT
    // ═══════════════════════════════════════════════════════════════

    this._bindResultEvents(container, remount);

    // ═══════════════════════════════════════════════════════════════
    // ÉDITEUR YAML
    // ═══════════════════════════════════════════════════════════════

    this._bindYamlEditorEvents(container, state, remount);

    // ═══════════════════════════════════════════════════════════════
    // MULTISELECT & TAG SELECTOR
    // ═══════════════════════════════════════════════════════════════

    this._bindMultiselectEvents(container);
    this._bindTagSelectorEvents(container);
  },

  /**
   * Lie les événements du mode dictée
   */
  _bindDictationEvents(container, remount) {
    // Retour
    container.querySelectorAll('.dictation__back').forEach(btn => {
      btn.addEventListener('click', () => {
        this.resetDictation();
        remount();
      });
    });

    // Champs
    container.querySelector('#dictation-name')?.addEventListener('input', (e) => {
      this._dictationDeckName = e.target.value;
    });

    container.querySelector('#dictation-lang')?.addEventListener('change', (e) => {
      this._dictationLang = e.target.value;
    });

    container.querySelector('#dictation-words')?.addEventListener('input', (e) => {
      this._dictationWords = e.target.value;
      const hint = container.querySelector('.dictation__hint');
      if (hint) {
        const count = e.target.value.split('\n').filter(w => w.trim()).length;
        hint.textContent = i18n.tn('common.wordsCount', count);
      }
      const generateBtn = container.querySelector('.dictation__generate');
      if (generateBtn) {
        generateBtn.disabled = !e.target.value.trim();
      }
    });

    // Génération
    container.querySelector('.dictation__generate')?.addEventListener('click', () => {
      this._dictationProgress = { current: 0, total: 0, word: '', status: 'searching' };
      this._dictationErrors = [];
      remount();

      PromptGeneratorDictation.generate(
        { words: this._dictationWords, lang: this._dictationLang, deckName: this._dictationDeckName },
        (progress) => {
          this._dictationProgress = progress;
          const progressEl = container.querySelector('.dictation--progress');
          if (progressEl) {
            progressEl.outerHTML = PromptGeneratorDictation.renderProgress(progress, this._dictationErrors);
          }
        },
        (deck, errors) => {
          this._dictationGeneratedDeck = deck;
          this._dictationErrors = errors || [];
          this._dictationProgress = null;
          remount();
        }
      );
    });

    // Sauvegarde
    container.querySelector('.dictation__save')?.addEventListener('click', () => {
      PromptGeneratorDictation.save(this._dictationGeneratedDeck);
      this.resetDictation();
      Router.navigate('/explore');
    });

    // Export YAML
    container.querySelector('.dictation__export-yaml')?.addEventListener('click', () => {
      PromptGeneratorDictation.exportYaml(this._dictationGeneratedDeck);
    });
  },

  /**
   * Lie les événements du mode multilingue
   */
  _bindMultilingualEvents(container, remount) {
    // Créer le contexte pour le module
    const pageContext = {
      multilingualDeckName: this._multilingualDeckName,
      multilingualSourceLang: this._multilingualSourceLang,
      multilingualTargetLangs: this._multilingualTargetLangs,
      multilingualWords: this._multilingualWords,
      multilingualProgress: this._multilingualProgress,
      multilingualErrors: this._multilingualErrors,
      multilingualGeneratedDeck: this._multilingualGeneratedDeck,
      resetMultilingual: () => this.resetMultilingual()
    };

    // Synchroniser les modifications du contexte avec l'état local
    Object.defineProperty(pageContext, 'multilingualDeckName', {
      get: () => this._multilingualDeckName,
      set: (v) => { this._multilingualDeckName = v; }
    });
    Object.defineProperty(pageContext, 'multilingualSourceLang', {
      get: () => this._multilingualSourceLang,
      set: (v) => { this._multilingualSourceLang = v; }
    });
    Object.defineProperty(pageContext, 'multilingualTargetLangs', {
      get: () => this._multilingualTargetLangs,
      set: (v) => { this._multilingualTargetLangs = v; }
    });
    Object.defineProperty(pageContext, 'multilingualWords', {
      get: () => this._multilingualWords,
      set: (v) => { this._multilingualWords = v; }
    });
    Object.defineProperty(pageContext, 'multilingualProgress', {
      get: () => this._multilingualProgress,
      set: (v) => { this._multilingualProgress = v; }
    });
    Object.defineProperty(pageContext, 'multilingualErrors', {
      get: () => this._multilingualErrors,
      set: (v) => { this._multilingualErrors = v; }
    });
    Object.defineProperty(pageContext, 'multilingualGeneratedDeck', {
      get: () => this._multilingualGeneratedDeck,
      set: (v) => { this._multilingualGeneratedDeck = v; }
    });

    // Déléguer au module
    PromptGeneratorMultilingual.bindEvents(container, pageContext, remount);
  },

  /**
   * Lie les événements du formulaire
   */
  _bindFormEvents(container, state, remount) {
    container.querySelector('.prompt-gen__prev')?.addEventListener('click', () => {
      PromptGeneratorFormRenderer.saveCurrentStepData(container, this._formData);
      this._currentStep--;
      remount();
    });

    container.querySelector('.prompt-gen__next')?.addEventListener('click', () => {
      if (PromptGeneratorFormRenderer.validateCurrentStep(container, this._formData, this._currentStep)) {
        PromptGeneratorFormRenderer.saveCurrentStepData(container, this._formData);
        this._currentStep++;
        remount();
      }
    });

    container.querySelector('.prompt-gen__generate')?.addEventListener('click', () => {
      if (PromptGeneratorFormRenderer.validateCurrentStep(container, this._formData, this._currentStep)) {
        PromptGeneratorFormRenderer.saveCurrentStepData(container, this._formData);
        const validation = PromptGenerator.validateFormData(this._formData);
        if (validation.valid) {
          if (typeof PromptLearner !== 'undefined') {
            PromptLearner.startSession(this._formData);
            this._iterationHistory = [];
          }

          let prompt = PromptGenerator.generatePrompt(this._formData);
          if (typeof PromptLearner !== 'undefined') {
            const enhancement = PromptLearner.generatePromptEnhancement(this._formData.domain);
            if (enhancement) prompt += '\n' + enhancement;
          }

          this._generatedPrompt = prompt;
          remount();
        } else {
          alert(i18n.t('promptGen.formErrors') + '\n' + validation.errors.join('\n'));
        }
      }
    });
  },

  /**
   * Lie les événements du résultat
   */
  _bindResultEvents(container, remount) {
    container.querySelector('.prompt-gen__copy')?.addEventListener('click', () => {
      const promptTextarea = container.querySelector('#prompt-output');
      const promptText = promptTextarea ? promptTextarea.value : this._generatedPrompt;
      navigator.clipboard.writeText(promptText).then(() => {
        const btn = container.querySelector('.prompt-gen__copy');
        btn.textContent = '✅ ' + i18n.t('common.copied');
        setTimeout(() => btn.textContent = '📋 ' + i18n.t('promptGen.copy'), 2000);
      });
    });

    container.querySelector('.prompt-gen__reset')?.addEventListener('click', () => {
      this._formData = PromptGenerator.getDefaultFormData();
      this._generatedPrompt = null;
      this._currentStep = 1;
      remount();
    });

    container.querySelector('.prompt-gen__open-editor')?.addEventListener('click', () => {
      this._showYamlEditor = true;
      remount();
    });
  },

  /**
   * Lie les événements de l'éditeur YAML
   */
  _bindYamlEditorEvents(container, state, remount) {
    // Navigation
    container.querySelector('.yaml-editor__back')?.addEventListener('click', () => {
      this._showYamlEditor = false;
      remount();
    });

    // Toolbar
    container.querySelector('.yaml-editor__paste')?.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        const textarea = container.querySelector('.yaml-editor__textarea');
        if (textarea) {
          textarea.value = text;
          this._yamlContent = text;
        }
      } catch (err) {
        alert(i18n.t('promptGen.clipboardError'));
      }
    });

    container.querySelector('.yaml-editor__clear')?.addEventListener('click', () => {
      this._yamlContent = '';
      this._yamlError = null;
      this._parsedDeck = null;
      remount();
    });

    container.querySelector('.yaml-editor__format')?.addEventListener('click', () => {
      const textarea = container.querySelector('.yaml-editor__textarea');
      if (textarea && textarea.value.trim()) {
        try {
          const parsed = YAML.parse(textarea.value);
          if (parsed) {
            textarea.value = YAML.stringify(parsed);
            this._yamlContent = textarea.value;
          }
        } catch (e) { /* ignore */ }
      }
    });

    // Validation et import
    container.querySelector('.yaml-editor__validate')?.addEventListener('click', () => {
      const textarea = container.querySelector('.yaml-editor__textarea');
      if (textarea) {
        this._yamlContent = textarea.value;
        const result = PromptGeneratorYamlLogic.validateYaml(this._yamlContent, this._iterationHistory);
        this._parsedDeck = result.parsedDeck;
        this._yamlError = result.yamlError;
        this._validationReport = result.validationReport;
        remount();
      }
    });

    container.querySelector('.yaml-editor__import')?.addEventListener('click', () => {
      if (this._parsedDeck) {
        if (PromptGeneratorYamlLogic.importDeck(this._parsedDeck, state)) {
          this._resetEditor();
          Router.navigate('/home');
        }
      }
    });

    container.querySelector('.yaml-editor__generate-correction')?.addEventListener('click', () => {
      if (this._parsedDeck && this._validationReport) {
        const correctionPrompt = PromptGeneratorYamlLogic.generateCorrectionPrompt(this._parsedDeck, this._validationReport);
        navigator.clipboard.writeText(correctionPrompt).then(() => {
          const btn = container.querySelector('.yaml-editor__generate-correction');
          if (btn) {
            const originalText = btn.textContent;
            btn.textContent = '✅ ' + i18n.t('common.copied');
            setTimeout(() => btn.textContent = originalText, 2000);
          }
          alert(i18n.t('promptGen.correctionCopied'));
        }).catch(() => {
          alert(i18n.t('promptGen.correctionTitle') + '\n\n' + correctionPrompt);
        });
      }
    });

    container.querySelector('.yaml-editor__textarea')?.addEventListener('input', (e) => {
      this._yamlContent = e.target.value;
    });

    // Toggle mode
    container.querySelectorAll('.editor-mode-toggle__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        if (mode !== this._editorMode) {
          if (mode === 'visual' && this._editorMode === 'code') {
            const textarea = container.querySelector('.yaml-editor__textarea');
            if (textarea) {
              this._yamlContent = textarea.value;
              const result = PromptGeneratorYamlLogic.validateYaml(this._yamlContent, this._iterationHistory);
              this._parsedDeck = result.parsedDeck;
              this._yamlError = result.yamlError;
              this._validationReport = result.validationReport;
            }
          }
          if (mode === 'code' && this._editorMode === 'visual' && this._parsedDeck) {
            PromptGeneratorYamlLogic.syncVisualToParsedDeck(container, this._parsedDeck);
            this._yamlContent = YAML.stringify(this._parsedDeck);
          }
          this._editorMode = mode;
          remount();
        }
      });
    });

    container.querySelector('.yaml-editor__switch-to-code')?.addEventListener('click', () => {
      this._editorMode = 'code';
      remount();
    });

    // Mode visuel - métadonnées
    this._bindVisualMetadataEvents(container, remount);

    // Mode visuel - cartes
    this._bindVisualCardEvents(container, remount);

    // Modal édition carte
    this._bindCardModalEvents(container, remount);
  },

  /**
   * Lie les événements des métadonnées en mode visuel
   */
  _bindVisualMetadataEvents(container, remount) {
    container.querySelector('#visual-deck-name')?.addEventListener('input', (e) => {
      if (this._parsedDeck) this._parsedDeck.name = e.target.value;
    });

    container.querySelector('#visual-deck-desc')?.addEventListener('input', (e) => {
      if (this._parsedDeck) this._parsedDeck.description = e.target.value;
    });

    container.querySelector('#visual-deck-difficulty')?.addEventListener('change', (e) => {
      if (this._parsedDeck) {
        const val = e.target.value;
        this._parsedDeck.difficulty = val ? parseInt(val, 10) : null;
      }
    });

    container.querySelector('#visual-deck-similarity')?.addEventListener('change', (e) => {
      if (this._parsedDeck) {
        this._parsedDeck.settings = this._parsedDeck.settings || {};
        this._parsedDeck.settings.similarityMatching = e.target.checked;
      }
    });

    // Tag selector
    const visualTagSelector = container.querySelector('#visual-deck-tags-selector');
    if (visualTagSelector && typeof Components !== 'undefined' && Components.tagSelector && this._parsedDeck) {
      Components.tagSelector.mount(visualTagSelector, {
        selectedTags: this._parsedDeck.tags || (typeof Tags !== 'undefined' ? Tags.fromCategory(this._parsedDeck.category) : []),
        mode: 'edit'
      }, {
        onChange: (newTags) => {
          if (this._parsedDeck) this._parsedDeck.tags = newTags;
        }
      });
    }
  },

  /**
   * Lie les événements des cartes en mode visuel
   */
  _bindVisualCardEvents(container, remount) {
    container.querySelector('.yaml-editor__add-card')?.addEventListener('click', () => {
      this._editingCardIndex = -1;
      remount();
    });

    container.querySelectorAll('.yaml-editor__edit-card').forEach(btn => {
      btn.addEventListener('click', () => {
        this._editingCardIndex = parseInt(btn.dataset.index, 10);
        remount();
      });
    });

    container.querySelectorAll('.yaml-editor__delete-card').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index, 10);
        if (confirm(i18n.t('promptGen.deleteCardConfirm'))) {
          this._parsedDeck.cards.splice(index, 1);
          remount();
        }
      });
    });

    container.querySelectorAll('.yaml-editor__move-card-up').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index, 10);
        if (index > 0) {
          const cards = this._parsedDeck.cards;
          [cards[index - 1], cards[index]] = [cards[index], cards[index - 1]];
          remount();
        }
      });
    });

    container.querySelectorAll('.yaml-editor__move-card-down').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index, 10);
        if (index < this._parsedDeck.cards.length - 1) {
          const cards = this._parsedDeck.cards;
          [cards[index], cards[index + 1]] = [cards[index + 1], cards[index]];
          remount();
        }
      });
    });
  },

  /**
   * Lie les événements de la modal d'édition de carte
   */
  _bindCardModalEvents(container, remount) {
    const closeModal = () => {
      this._editingCardIndex = null;
      remount();
    };

    container.querySelector('.yaml-editor__modal-close')?.addEventListener('click', closeModal);
    container.querySelector('.yaml-editor__modal-cancel')?.addEventListener('click', closeModal);
    container.querySelector('.yaml-editor__modal-overlay')?.addEventListener('click', (e) => {
      if (e.target.classList.contains('yaml-editor__modal-overlay')) closeModal();
    });

    container.querySelector('.yaml-editor__modal-save')?.addEventListener('click', () => {
      const result = PromptGeneratorYamlLogic.saveCardFromModal(container, this._parsedDeck, this._editingCardIndex);
      if (result.success) {
        this._validationReport = result.validationReport;
        this._editingCardIndex = null;
        remount();
      }
    });
  },

  /**
   * Lie les événements multiselect
   */
  _bindMultiselectEvents(container) {
    container.querySelectorAll('[data-multiselect]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const fieldId = checkbox.dataset.multiselect;
        const allCheckboxes = container.querySelectorAll(`[data-multiselect="${fieldId}"]`);
        const selected = Array.from(allCheckboxes).filter(cb => cb.checked).map(cb => cb.value);
        this._formData[fieldId] = selected;

        allCheckboxes.forEach(cb => {
          cb.closest('.prompt-gen__checkbox-card').classList.toggle('prompt-gen__checkbox-card--selected', cb.checked);
        });
      });
    });
  },

  /**
   * Lie les événements tag selector
   */
  _bindTagSelectorEvents(container) {
    container.querySelectorAll('.prompt-gen__tag-selector').forEach(selectorContainer => {
      const fieldId = selectorContainer.dataset.field;
      if (fieldId && typeof Components !== 'undefined' && Components.tagSelector) {
        Components.tagSelector.mount(selectorContainer, {
          selectedTags: this._formData[fieldId] || [],
          mode: 'edit'
        }, {
          onChange: (newTags) => {
            this._formData[fieldId] = newTags;
          }
        });
      }
    });
  },

  /**
   * Reset l'éditeur YAML
   */
  _resetEditor() {
    this._yamlContent = '';
    this._yamlError = null;
    this._parsedDeck = null;
    this._showYamlEditor = false;
    this._generatedPrompt = null;
    this._formData = PromptGenerator.getDefaultFormData();
    this._currentStep = 1;
    this._iterationHistory = [];
  }
};
