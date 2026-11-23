/**
 * Page Multilingual Config - Configuration de session pour decks multilingues
 *
 * Permet de sélectionner:
 * - Mode de jeu (Traduction, Dictée, Image)
 * - Langues source et cible
 * - Mode bidirectionnel
 *
 * Dépendances: escapeHtml (components.js)
 * Modules: State, Router, Storage, Multilingual
 */

// ═══════════════════════════════════════════════════════════════
// MULTILINGUAL CONFIG - Configuration de session multilingue
// ═══════════════════════════════════════════════════════════════

Pages.multilingualConfig = {
  // État local de la configuration
  _config: {
    mode: 'translation',
    sourceLang: null,
    targetLang: null,
    bidirectional: false
  },

  // Deck en cours de configuration
  _currentDeck: null,

  render(state, params) {
    const deck = this._currentDeck;
    const _t = PageUtils.getTranslator();

    if (!deck) {
      return `
        <div class="page page--multilingual-config">
          <div class="mlc__loading">${i18n.t('app.loading')}</div>
        </div>
      `;
    }

    const { mode, sourceLang, targetLang, bidirectional } = this._config;
    const languages = deck.languages || [];

    // Auto-sélectionner les premières langues si pas encore fait
    if (!sourceLang && languages.length > 0) {
      this._config.sourceLang = languages[0];
    }
    if (!targetLang && languages.length > 1) {
      this._config.targetLang = languages[1];
    } else if (!targetLang && languages.length === 1) {
      this._config.targetLang = languages[0];
    }

    const stats = this._getDirectionStats(deck);

    return `
      <div class="page page--multilingual-config">
        <header class="mlc__header">
          <button class="mlc__back" aria-label="${i18n.t('common.back')}">
            <span class="mlc__back-icon">←</span>
          </button>
          <h1 class="mlc__title">${escapeHtml(deck.name)}</h1>
        </header>

        <main class="mlc__content">
          <!-- Info deck -->
          <div class="mlc__deck-info">
            <div class="mlc__languages">
              ${languages.map(lang => `
                <span class="mlc__lang-badge">
                  ${Multilingual.LANGUAGE_FLAGS[lang] || ''} ${escapeHtml(Multilingual.LANGUAGE_LABELS[lang] || lang)}
                </span>
              `).join('')}
            </div>
            <div class="mlc__word-count">${i18n.tn('common.wordsCount', deck.words?.length || 0)}</div>
          </div>

          <!-- Sélection du mode -->
          <section class="mlc__section">
            <h2 class="mlc__section-title">${i18n.t('mlc.mode')}</h2>
            <div class="mlc__modes">
              ${this._renderModeButton('translation', '📝', i18n.t('mlc.modeTranslation'), mode)}
              ${this._renderModeButton('dictation', '🔊', i18n.t('mlc.modeDictation'), mode)}
              ${this._renderModeButton('image', '🖼️', i18n.t('mlc.modeImage'), mode, !this._hasImages(deck))}
            </div>
          </section>

          <!-- Sélection des langues -->
          ${mode !== 'image' ? `
            <section class="mlc__section">
              <h2 class="mlc__section-title">${i18n.t('mlc.languages')}</h2>
              <div class="mlc__lang-selectors">
                <div class="mlc__lang-selector">
                  <label for="source-lang">
                    ${mode === 'dictation' ? i18n.t('mlc.listenIn') : i18n.t('mlc.from')}
                  </label>
                  <select id="source-lang" class="mlc__select">
                    ${languages.map(lang => `
                      <option value="${escapeHtml(lang)}" ${lang === this._config.sourceLang ? 'selected' : ''}>
                        ${Multilingual.LANGUAGE_FLAGS[lang] || ''} ${escapeHtml(Multilingual.LANGUAGE_LABELS[lang] || lang)}
                      </option>
                    `).join('')}
                  </select>
                </div>

                <div class="mlc__arrow">→</div>

                <div class="mlc__lang-selector">
                  <label for="target-lang">
                    ${mode === 'dictation' ? i18n.t('mlc.writeIn') : i18n.t('mlc.to')}
                  </label>
                  <select id="target-lang" class="mlc__select">
                    ${languages.map(lang => `
                      <option value="${escapeHtml(lang)}" ${lang === this._config.targetLang ? 'selected' : ''}>
                        ${Multilingual.LANGUAGE_FLAGS[lang] || ''} ${escapeHtml(Multilingual.LANGUAGE_LABELS[lang] || lang)}
                      </option>
                    `).join('')}
                  </select>
                </div>
              </div>

              <!-- Mode bidirectionnel -->
              <div class="mlc__bidi-option ${this._config.sourceLang === this._config.targetLang ? 'mlc__bidi-option--disabled' : ''}">
                <label class="mlc__checkbox-label">
                  <input type="checkbox" id="bidirectional"
                         ${bidirectional ? 'checked' : ''}
                         ${this._config.sourceLang === this._config.targetLang ? 'disabled' : ''}>
                  <span class="mlc__checkbox-text">
                    🔄 ${i18n.t('mlc.bidirectional')}
                    <small>${i18n.t('mlc.bidirectionalDesc')}</small>
                  </span>
                </label>
              </div>
            </section>
          ` : `
            <section class="mlc__section">
              <h2 class="mlc__section-title">${i18n.t('mlc.answerLanguage')}</h2>
              <div class="mlc__lang-selectors mlc__lang-selectors--single">
                <div class="mlc__lang-selector">
                  <label for="target-lang">${i18n.t('mlc.writeIn')}</label>
                  <select id="target-lang" class="mlc__select">
                    ${languages.map(lang => `
                      <option value="${escapeHtml(lang)}" ${lang === this._config.targetLang ? 'selected' : ''}>
                        ${Multilingual.LANGUAGE_FLAGS[lang] || ''} ${escapeHtml(Multilingual.LANGUAGE_LABELS[lang] || lang)}
                      </option>
                    `).join('')}
                  </select>
                </div>
              </div>
              <p class="mlc__hint">${i18n.t('mlc.imageNoBidirectional')}</p>
            </section>
          `}

          <!-- Statistiques de progression -->
          <section class="mlc__section">
            <h2 class="mlc__section-title">${i18n.t('mlc.progress')}</h2>
            <div class="mlc__stats">
              ${this._renderProgressStats(stats)}
            </div>
          </section>
        </main>

        <footer class="mlc__footer">
          <button class="btn btn--primary mlc__start" ${stats.playable === 0 ? 'disabled' : ''}>
            ${stats.playable > 0
              ? `▶ ${i18n.t('mlc.start', { cards: i18n.tn('common.cardsCount', stats.playable) })}`
              : `😴 ${i18n.t('home.comeBackTomorrow')}`}
          </button>
        </footer>
      </div>
    `;
  },

  _renderModeButton(modeId, icon, label, currentMode, disabled = false) {
    const isActive = currentMode === modeId;
    return `
      <button class="mlc__mode-btn ${isActive ? 'mlc__mode-btn--active' : ''}"
              data-mode="${modeId}"
              ${disabled ? `disabled title="${i18n.t('mlc.noImageWords')}"` : ''}>
        <span class="mlc__mode-icon">${icon}</span>
        <span class="mlc__mode-label">${label}</span>
      </button>
    `;
  },

  _renderProgressStats(stats) {
    if (!stats) return `<p>${i18n.t('mlc.chooseDirection')}</p>`;

    const progressPercent = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;

    return `
      <div class="mlc__progress-bar">
        <div class="mlc__progress-fill" style="width: ${progressPercent}%"></div>
      </div>
      <div class="mlc__stats-grid">
        <div class="mlc__stat">
          <span class="mlc__stat-value">${stats.total}</span>
          <span class="mlc__stat-label">${i18n.t('mlc.total')}</span>
        </div>
        <div class="mlc__stat mlc__stat--green">
          <span class="mlc__stat-value">${stats.mastered}</span>
          <span class="mlc__stat-label">${i18n.t('mlc.mastered')}</span>
        </div>
        <div class="mlc__stat mlc__stat--orange">
          <span class="mlc__stat-value">${stats.inProgress}</span>
          <span class="mlc__stat-label">${i18n.t('deckReview.boxOrange')}</span>
        </div>
        <div class="mlc__stat mlc__stat--purple">
          <span class="mlc__stat-value">${stats.struggling}</span>
          <span class="mlc__stat-label">${i18n.t('deckReview.boxPurple')}</span>
        </div>
        <div class="mlc__stat mlc__stat--new">
          <span class="mlc__stat-value">${stats.notStarted}</span>
          <span class="mlc__stat-label">${i18n.t('mlc.new')}</span>
        </div>
        <div class="mlc__stat mlc__stat--playable">
          <span class="mlc__stat-value">${stats.playable}</span>
          <span class="mlc__stat-label">${i18n.t('mlc.available')}</span>
        </div>
      </div>
    `;
  },

  _hasImages(deck) {
    return (deck.words || []).some(word => word.image);
  },

  _getDirectionStats(deck) {
    if (!deck || typeof Multilingual === 'undefined') {
      return { total: 0, mastered: 0, inProgress: 0, struggling: 0, notStarted: 0, playable: 0 };
    }

    const { mode, sourceLang, targetLang, bidirectional } = this._config;

    // Calculer les directions concernées
    let directions = [];
    if (mode === 'image') {
      directions = [Multilingual.getProgressKey('image', null, targetLang)];
    } else if (bidirectional && sourceLang !== targetLang) {
      directions = [
        Multilingual.getProgressKey(mode, sourceLang, targetLang),
        Multilingual.getProgressKey(mode, targetLang, sourceLang)
      ];
    } else {
      directions = [Multilingual.getProgressKey(mode, sourceLang, targetLang)];
    }

    // Agréger les stats de toutes les directions
    const aggregated = {
      total: 0,
      mastered: 0,
      inProgress: 0,
      struggling: 0,
      notStarted: 0,
      playable: 0
    };

    for (const direction of directions) {
      const stats = Multilingual.getDirectionStats(deck, direction);
      aggregated.total += stats.total;
      aggregated.mastered += stats.mastered;
      aggregated.inProgress += stats.inProgress;
      aggregated.struggling += stats.struggling;
      aggregated.notStarted += stats.notStarted;
      aggregated.playable += stats.playable;
    }

    return aggregated;
  },

  mount(container, state, params) {
    const deckId = params && params[0];

    if (!deckId) {
      Router.navigate('/home');
      return;
    }

    // Trouver le deck
    const deck = state.decks?.find(d => d.id === deckId);
    if (!deck || deck.type !== 'multilingual') {
      Router.navigate('/home');
      return;
    }

    this._currentDeck = deck;

    // Initialiser la progression si nécessaire
    if (typeof Multilingual !== 'undefined') {
      Multilingual.initializeDeckProgress(deck);
    }

    // Réinitialiser la config avec les langues du deck
    const languages = deck.languages || [];
    this._config = {
      mode: 'translation',
      sourceLang: languages[0] || 'fr',
      targetLang: languages[1] || languages[0] || 'en',
      bidirectional: false
    };

    container.innerHTML = this.render(state, params);
    this._bindEvents(container);
  },

  _bindEvents(container) {
    // Retour
    const backBtn = container.querySelector('.mlc__back');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        Router.navigate('/home');
      });
    }

    // Mode selection
    container.querySelectorAll('.mlc__mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        this._config.mode = btn.dataset.mode;

        // Reset bidirectional for image mode
        if (this._config.mode === 'image') {
          this._config.bidirectional = false;
        }

        this._refresh(container);
      });
    });

    // Language selectors
    const sourceSelect = container.querySelector('#source-lang');
    const targetSelect = container.querySelector('#target-lang');

    if (sourceSelect) {
      sourceSelect.addEventListener('change', (e) => {
        this._config.sourceLang = e.target.value;

        // Disable bidirectional if same language
        if (this._config.sourceLang === this._config.targetLang) {
          this._config.bidirectional = false;
        }

        this._refresh(container);
      });
    }

    if (targetSelect) {
      targetSelect.addEventListener('change', (e) => {
        this._config.targetLang = e.target.value;

        // Disable bidirectional if same language
        if (this._config.sourceLang === this._config.targetLang) {
          this._config.bidirectional = false;
        }

        this._refresh(container);
      });
    }

    // Bidirectional toggle
    const bidiCheckbox = container.querySelector('#bidirectional');
    if (bidiCheckbox) {
      bidiCheckbox.addEventListener('change', (e) => {
        this._config.bidirectional = e.target.checked;
        this._refresh(container);
      });
    }

    // Start button
    const startBtn = container.querySelector('.mlc__start');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        if (startBtn.disabled) return;
        this._startSession();
      });
    }
  },

  _refresh(container) {
    container.innerHTML = this.render(State.getAll());
    this._bindEvents(container);
  },

  _startSession() {
    const deck = this._currentDeck;
    if (!deck) return;

    const { mode, sourceLang, targetLang, bidirectional } = this._config;

    // Stocker la configuration de session dans State
    State.set('multilingualConfig', {
      deckId: deck.id,
      mode,
      sourceLang,
      targetLang,
      bidirectional
    });

    // Naviguer vers le jeu
    Router.navigate(`/game/${deck.id}`);
  }
};

// Export pour tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Pages };
}
