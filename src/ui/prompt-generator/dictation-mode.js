/**
 * Prompt Generator - Dictation Mode
 *
 * Gère le mode dictée pour générer des decks avec audio Lingua Libre :
 * - Rendu du formulaire de saisie (nom, langue, mots)
 * - Progression de génération avec barre de progression
 * - Résultat avec aperçu et options d'export
 *
 * @module PromptGeneratorDictation
 * @requires escapeHtml (components.js)
 * @requires LinguaLibre
 * @requires Storage
 * @requires State
 * @requires Router
 * @requires YAML
 */

/**
 * Contexte de dictée
 * @typedef {Object} DictationContext
 * @property {string} deckName - Nom du deck
 * @property {string} lang - Code langue (fr, en, etc.)
 * @property {string} words - Liste des mots (un par ligne)
 * @property {Object|null} progress - État de progression
 * @property {number} progress.current - Mot courant
 * @property {number} progress.total - Total des mots
 * @property {string} progress.word - Mot en cours
 * @property {string} progress.status - Statut (searching, downloading, success, not_found, error)
 * @property {Deck|null} generatedDeck - Deck généré
 * @property {string[]} errors - Erreurs de génération
 */

const PromptGeneratorDictation = {
  /**
   * Rend le mode dictée (formulaire, progression ou résultat)
   * @param {DictationContext} context - Contexte avec l'état de dictée
   * @returns {string} HTML
   */
  render(context) {
    const languages = typeof LinguaLibre !== 'undefined' ? LinguaLibre.LANGUAGE_LABELS : { fr: 'Français', en: 'English' };

    // Si génération en cours
    if (context.progress) {
      return this.renderProgress(context.progress, context.errors);
    }

    // Si deck généré
    if (context.generatedDeck) {
      return this.renderResult(context.generatedDeck, context.errors);
    }

    // Formulaire
    return this.renderForm(context, languages);
  },

  /**
   * Rend le formulaire de saisie de dictée
   *
   * Affiche les champs : nom du deck, langue, et textarea pour les mots.
   * Inclut un warning sur la nécessité d'une connexion internet.
   *
   * @param {DictationContext} context - Contexte de dictée
   * @param {Object.<string, string>} languages - Map code langue → label
   * @returns {string} HTML du formulaire
   */
  renderForm(context, languages) {
    return `
      <div class="dictation">
        <div class="dictation__header">
          <button class="btn btn--ghost dictation__back">← ${i18n.t('common.back')}</button>
          <h1 class="dictation__title">🎧 ${i18n.t('dictation.title')}</h1>
        </div>

        <p class="dictation__description">
          ${i18n.t('dictation.description')}
        </p>

        <div class="dictation__form">
          <div class="dictation__field">
            <label class="dictation__label" for="dictation-name">${i18n.t('common.deckName')}</label>
            <input
              type="text"
              id="dictation-name"
              class="dictation__input"
              placeholder="${i18n.t('dictation.namePlaceholder')}"
              value="${escapeHtml(context.deckName)}"
            >
          </div>

          <div class="dictation__field">
            <label class="dictation__label" for="dictation-lang">${i18n.t('settings.language')}</label>
            <select id="dictation-lang" class="dictation__select">
              ${Object.entries(languages).map(([code, label]) => `
                <option value="${code}" ${context.lang === code ? 'selected' : ''}>${label}</option>
              `).join('')}
            </select>
          </div>

          <div class="dictation__field">
            <label class="dictation__label" for="dictation-words">
              ${i18n.t('gen.wordList')}
            </label>
            <textarea
              id="dictation-words"
              class="dictation__textarea"
              rows="10"
              placeholder="${escapeHtml(i18n.t('dictation.wordsPlaceholder'))}"
            >${escapeHtml(context.words)}</textarea>
            <span class="dictation__hint">
              ${i18n.tn('common.wordsCount', context.words ? context.words.split('\n').filter(w => w.trim()).length : 0)}
            </span>
          </div>

          <div class="dictation__warning">
            <span class="dictation__warning-icon">⚠️</span>
            <span class="dictation__warning-text">
              ${i18n.t('dictation.needsInternet')}
            </span>
          </div>

          <div class="dictation__actions">
            <button class="btn btn--primary dictation__generate" ${!context.words.trim() ? 'disabled' : ''}>
              🔊 ${i18n.t('dictation.generate')}
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Rend la progression de génération
   *
   * Affiche une barre de progression, le mot en cours,
   * son statut, et le nombre d'erreurs éventuelles.
   *
   * @param {Object} progress - État de progression
   * @param {number} progress.current - Index du mot courant
   * @param {number} progress.total - Nombre total de mots
   * @param {string} progress.word - Mot en cours de traitement
   * @param {string} progress.status - Statut du mot
   * @param {string[]} errors - Liste des mots non trouvés
   * @returns {string} HTML de la progression
   */
  renderProgress(progress, errors) {
    const { current, total, word, status } = progress;
    const percent = total > 0 ? Math.round((current / total) * 100) : 0;

    const statusLabels = {
      'searching': '🔍 ' + i18n.t('gen.status.searching'),
      'downloading': '📥 ' + i18n.t('gen.status.downloading'),
      'success': '✅ ' + i18n.t('gen.status.ok'),
      'not_found': '❌ ' + i18n.t('gen.status.notFound'),
      'error': '⚠️ ' + i18n.t('common.error')
    };

    return `
      <div class="dictation dictation--progress">
        <h1 class="dictation__title">🎧 ${i18n.t('mlcCreator.generating')}</h1>

        <div class="dictation__progress-container">
          <div class="dictation__progress-bar">
            <div class="dictation__progress-fill" style="width: ${percent}%"></div>
          </div>
          <div class="dictation__progress-text">${i18n.t('gen.progress', { current, total })}</div>
        </div>

        <div class="dictation__current-word">
          <span class="dictation__current-word-label">${i18n.t('gen.currentWord')}</span>
          <span class="dictation__current-word-value">${escapeHtml(word)}</span>
          <span class="dictation__current-word-status">${statusLabels[status] || status}</span>
        </div>

        ${errors.length > 0 ? `
          <div class="dictation__errors-preview">
            <span class="dictation__errors-count">${i18n.tn('dictation.notFound', errors.length)}</span>
          </div>
        ` : ''}
      </div>
    `;
  },

  /**
   * Rend le résultat de génération
   *
   * Affiche un résumé (nombre de cartes, erreurs),
   * un aperçu des premières cartes, et les actions
   * (sauvegarder, exporter YAML).
   *
   * @param {Deck} deck - Deck généré avec les cartes audio
   * @param {string[]} errors - Liste des mots non trouvés
   * @returns {string} HTML du résultat
   */
  _renderAttributions(deck) {
    const entries = LinguaLibre.listAttributions(deck);
    if (entries.length === 0) return '';
    return `
        <details class="dictation__attributions" open>
          <summary>🔊 ${i18n.tn('gen.attributions', entries.length)}</summary>
          <p class="dictation__attributions-hint">${i18n.t('gen.attributionsHint')}</p>
          <ul class="dictation__attributions-list">
            ${entries.map(e => `<li>${escapeHtml(e.word)} : ${escapeHtml(LinguaLibre.describeAttribution(e))}</li>`).join('')}
          </ul>
        </details>`;
  },

  renderResult(deck, errors) {
    // Aucune carte : un deck vide est inutilisable, on n'en propose ni l'enregistrement ni l'export
    const hasCards = deck.cards.length > 0;
    const _t = PageUtils.getTranslator();
    return `
      <div class="dictation dictation--result">
        <div class="dictation__header">
          <button class="btn btn--ghost dictation__back">← ${i18n.t('dictation.newDictation')}</button>
          <h1 class="dictation__title">${hasCards ? '✅ ' + escapeHtml(i18n.t('dictation.deckGenerated')) : escapeHtml(_t('dictation.noCardTitle'))}</h1>
        </div>

        <div class="dictation__result-summary">
          <div class="dictation__result-stat">
            <span class="dictation__result-stat-value">${deck.cards.length}</span>
            <span class="dictation__result-stat-label">${i18n.t('dictation.cardsWithAudio')}</span>
          </div>
          ${errors.length > 0 ? `
            <div class="dictation__result-stat dictation__result-stat--error">
              <span class="dictation__result-stat-value">${errors.length}</span>
              <span class="dictation__result-stat-label">${i18n.t('dictation.wordsNotFound')}</span>
            </div>
          ` : ''}
        </div>

        ${errors.length > 0 ? `
          <details class="dictation__errors-details">
            <summary>${i18n.tn('gen.seeErrors', errors.length)}</summary>
            <ul class="dictation__errors-list">
              ${errors.map(err => `<li>${escapeHtml(err)}</li>`).join('')}
            </ul>
          </details>
        ` : ''}

        ${hasCards ? '' : `<p class="dictation__empty-notice" role="alert">${escapeHtml(_t('dictation.noCardMessage'))}</p>`}

        ${hasCards ? `<div class="dictation__result-preview">
          <h3>${i18n.t('gen.deckPreview', { name: escapeHtml(deck.name) })}</h3>
          <div class="dictation__cards-preview">
            ${deck.cards.slice(0, 3).map(card => `
              <div class="dictation__card-preview">
                <span class="dictation__card-word">${escapeHtml(card.answer)}</span>
                ${card.media ? '<span class="dictation__card-audio">🔊</span>' : ''}
                ${card.media && card.media.license ? `<span class="dictation__card-attribution">${escapeHtml(LinguaLibre.describeAttribution(card.media))}</span>` : ''}
              </div>
            `).join('')}
            ${deck.cards.length > 3 ? `<div class="dictation__card-more">${i18n.t('gen.more', { count: deck.cards.length - 3 })}</div>` : ''}
          </div>
        </div>` : ''}

        ${hasCards ? this._renderAttributions(deck) : ''}

        ${hasCards ? `<div class="dictation__actions">
          <button class="btn btn--primary dictation__save">
            💾 ${i18n.t('editor.saveDeck')}
          </button>
          <button class="btn btn--secondary dictation__export-yaml">
            📄 ${i18n.t('gen.exportYaml')}
          </button>
        </div>` : ''}
      </div>
    `;
  },

  /**
   * Génère un deck de dictée avec audio Lingua Libre
   *
   * Télécharge les fichiers audio depuis Lingua Libre
   * pour chaque mot de la liste et construit un deck.
   *
   * @async
   * @param {DictationContext} context - Contexte de dictée
   * @param {Function} onProgress - Callback appelé pour chaque mot (progress object)
   * @param {Function} onComplete - Callback appelé à la fin (deck, errors)
   * @returns {Promise<void>}
   */
  async generate(context, onProgress, onComplete) {
    if (typeof LinguaLibre === 'undefined') {
      alert(i18n.t('pgMulti.moduleMissing'));
      return;
    }

    const words = context.words
      .split('\n')
      .map(w => w.trim())
      .filter(w => w.length > 0);

    if (words.length === 0) {
      alert(i18n.t('gen.needOneWord'));
      return;
    }

    try {
      const result = await LinguaLibre.generateDictationDeck(
        words,
        context.lang,
        {
          name: context.deckName || `Dictée ${LinguaLibre.LANGUAGE_LABELS[context.lang] || context.lang}`,
          category: ['langues', 'dictee', context.lang]
        },
        (word, index, total, status) => {
          onProgress({ current: index + 1, total, word, status });
        }
      );

      onComplete(result.deck, result.errors);

    } catch (error) {
      console.error('Erreur génération dictée:', error);
      alert(i18n.t('mlcCreator.generationError', { message: error.message }));
      onComplete(null, [error.message]);
    }
  },

  /**
   * Sauvegarde un deck de dictée dans le storage
   *
   * Ajoute le deck aux decks personnalisés et à l'état global.
   *
   * @param {Deck} deck - Deck généré à sauvegarder
   * @returns {void}
   */
  save(deck) {
    if (!deck || !Array.isArray(deck.cards) || deck.cards.length === 0) return;

    Storage.saveCustomDeck(deck);

    const allDecks = State.get('decks') || [];
    allDecks.push(deck);
    State.set('decks', allDecks);

    alert(i18n.tn('editor.saved', deck.cards.length, { name: deck.name }));
  },

  /**
   * Exporte un deck en fichier YAML téléchargeable
   *
   * Génère un blob YAML et déclenche le téléchargement.
   *
   * @param {Deck} deck - Deck à exporter
   * @returns {void}
   */
  exportYaml(deck) {
    if (!deck || typeof LinguaLibre === 'undefined') return;

    const yaml = LinguaLibre.deckToYaml(deck);
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.id}.yaml`;
    a.click();

    URL.revokeObjectURL(url);
  },

  /**
   * Lie les événements du mode dictée
   *
   * Attache les listeners pour tous les éléments interactifs :
   * bouton retour, champs de saisie, génération, sauvegarde, export.
   *
   * @param {HTMLElement} container - Container DOM
   * @param {Object} pageContext - Contexte de la page avec état et méthodes
   * @param {Function} remount - Fonction de remontage pour rafraîchir l'UI
   * @returns {void}
   */
  bindEvents(container, pageContext, remount) {
    // Bouton retour
    container.querySelectorAll('.dictation__back').forEach(btn => {
      btn.addEventListener('click', () => {
        pageContext.resetDictation();
        remount();
      });
    });

    // Mise à jour des champs
    container.querySelector('#dictation-name')?.addEventListener('input', (e) => {
      pageContext.dictationDeckName = e.target.value;
    });

    container.querySelector('#dictation-lang')?.addEventListener('change', (e) => {
      pageContext.dictationLang = e.target.value;
    });

    container.querySelector('#dictation-words')?.addEventListener('input', (e) => {
      pageContext.dictationWords = e.target.value;
      // Mettre à jour le compteur
      const hint = container.querySelector('.dictation__hint');
      if (hint) {
        const count = e.target.value.split('\n').filter(w => w.trim()).length;
        hint.textContent = count + ' mot' + (count > 1 ? 's' : '');
      }
      // Activer/désactiver le bouton
      const generateBtn = container.querySelector('.dictation__generate');
      if (generateBtn) {
        generateBtn.disabled = !e.target.value.trim();
      }
    });

    // Génération
    container.querySelector('.dictation__generate')?.addEventListener('click', () => {
      const context = {
        words: pageContext.dictationWords,
        lang: pageContext.dictationLang,
        deckName: pageContext.dictationDeckName
      };

      pageContext.dictationProgress = { current: 0, total: 0, word: '', status: 'searching' };
      pageContext.dictationErrors = [];
      remount();

      this.generate(
        context,
        (progress) => {
          pageContext.dictationProgress = progress;
          const progressEl = container.querySelector('.dictation--progress');
          if (progressEl) {
            progressEl.outerHTML = this.renderProgress(progress, pageContext.dictationErrors);
          }
        },
        (deck, errors) => {
          pageContext.dictationGeneratedDeck = deck;
          pageContext.dictationErrors = errors || [];
          pageContext.dictationProgress = null;
          remount();
        }
      );
    });

    // Sauvegarde
    container.querySelector('.dictation__save')?.addEventListener('click', () => {
      this.save(pageContext.dictationGeneratedDeck);
      pageContext.resetDictation();
      Router.navigate('/explore');
    });

    // Export YAML
    container.querySelector('.dictation__export-yaml')?.addEventListener('click', () => {
      this.exportYaml(pageContext.dictationGeneratedDeck);
    });
  }
};

// Export pour Node.js (tests) et navigateur
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PromptGeneratorDictation;
}
