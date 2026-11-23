/**
 * Prompt Generator - Multilingual Creator Mode
 *
 * Gère le mode création de vocabulaire multilingue :
 * - Rendu du formulaire de saisie (nom, langues, mots)
 * - Progression de génération avec traductions et audio
 * - Résultat avec aperçu et options d'export
 *
 * @module PromptGeneratorMultilingual
 * @requires escapeHtml (components.js)
 * @requires LinguaLibre
 * @requires Multilingual
 * @requires Storage
 * @requires State
 * @requires Router
 * @requires YAML
 */

/**
 * Contexte multilingue
 * @typedef {Object} MultilingualContext
 * @property {string} deckName - Nom du deck
 * @property {string} sourceLang - Langue source des mots
 * @property {string[]} targetLangs - Langues cibles pour traduction
 * @property {string} words - Liste des mots (un par ligne)
 * @property {Object|null} progress - État de progression
 * @property {Object|null} generatedDeck - Deck multilingue généré
 * @property {string[]} errors - Erreurs de génération
 */

const PromptGeneratorMultilingual = {
  /**
   * Langues disponibles pour la génération
   */
  AVAILABLE_LANGUAGES: {
    fr: { label: 'Français', flag: '🇫🇷' },
    en: { label: 'English', flag: '🇬🇧' },
    es: { label: 'Español', flag: '🇪🇸' },
    de: { label: 'Deutsch', flag: '🇩🇪' },
    it: { label: 'Italiano', flag: '🇮🇹' },
    pt: { label: 'Português', flag: '🇵🇹' },
    nl: { label: 'Nederlands', flag: '🇳🇱' }
  },

  /**
   * Rend le mode multilingue (formulaire, progression ou résultat)
   * @param {MultilingualContext} context - Contexte avec l'état
   * @returns {string} HTML
   */
  render(context) {
    // Si génération en cours
    if (context.progress) {
      return this.renderProgress(context.progress, context.errors);
    }

    // Si deck généré
    if (context.generatedDeck) {
      return this.renderResult(context.generatedDeck, context.errors);
    }

    // Formulaire
    return this.renderForm(context);
  },

  /**
   * Rend le formulaire de saisie multilingue
   * @param {MultilingualContext} context - Contexte
   * @returns {string} HTML du formulaire
   */
  renderForm(context) {
    const languages = this.AVAILABLE_LANGUAGES;

    return `
      <div class="multilingual-creator">
        <div class="multilingual-creator__header">
          <button class="btn btn--ghost multilingual-creator__back">← ${i18n.t('common.back')}</button>
          <h1 class="multilingual-creator__title">🌍 ${i18n.t('pgMulti.title')}</h1>
        </div>

        <p class="multilingual-creator__description">
          ${i18n.t('pgMulti.description')}
        </p>

        <div class="multilingual-creator__form">
          <div class="multilingual-creator__field">
            <label class="multilingual-creator__label" for="multilingual-name">${i18n.t('common.deckName')}</label>
            <input
              type="text"
              id="multilingual-name"
              class="multilingual-creator__input"
              placeholder="${i18n.t('pgMulti.namePlaceholder')}"
              value="${escapeHtml(context.deckName || '')}"
            >
          </div>

          <div class="multilingual-creator__field">
            <label class="multilingual-creator__label" for="multilingual-source-lang">
              ${i18n.t('pgMulti.sourceLang')}
            </label>
            <select id="multilingual-source-lang" class="multilingual-creator__select">
              ${Object.entries(languages).map(([code, { label, flag }]) => `
                <option value="${code}" ${context.sourceLang === code ? 'selected' : ''}>
                  ${flag} ${label}
                </option>
              `).join('')}
            </select>
          </div>

          <div class="multilingual-creator__field">
            <label class="multilingual-creator__label">
              ${i18n.t('pgMulti.targetLangs')}
            </label>
            <div class="multilingual-creator__lang-grid">
              ${Object.entries(languages).map(([code, { label, flag }]) => `
                <label class="multilingual-creator__lang-option ${context.targetLangs?.includes(code) ? 'multilingual-creator__lang-option--selected' : ''}">
                  <input
                    type="checkbox"
                    class="multilingual-creator__lang-checkbox"
                    data-lang="${code}"
                    ${context.targetLangs?.includes(code) ? 'checked' : ''}
                    ${context.sourceLang === code ? 'disabled' : ''}
                  >
                  <span class="multilingual-creator__lang-flag">${flag}</span>
                  <span class="multilingual-creator__lang-label">${label}</span>
                </label>
              `).join('')}
            </div>
            <span class="multilingual-creator__hint multilingual-creator__hint--langs">
              ${i18n.tn('pgMulti.langsSelected', context.targetLangs?.length || 0)}
            </span>
          </div>

          <div class="multilingual-creator__field">
            <label class="multilingual-creator__label" for="multilingual-words">
              ${i18n.t('gen.wordList')}
            </label>
            <textarea
              id="multilingual-words"
              class="multilingual-creator__textarea"
              rows="10"
              placeholder="${escapeHtml(i18n.t('pgMulti.wordsPlaceholder'))}"
            >${escapeHtml(context.words || '')}</textarea>
            <span class="multilingual-creator__hint multilingual-creator__hint--words">
              ${i18n.tn('common.wordsCount', context.words ? context.words.split('\n').filter(w => w.trim()).length : 0)}
            </span>
          </div>

          <div class="multilingual-creator__warning">
            <span class="multilingual-creator__warning-icon">⚠️</span>
            <span class="multilingual-creator__warning-text">
              ${i18n.t('pgMulti.needsInternet')}
            </span>
          </div>

          <div class="multilingual-creator__actions">
            <button class="btn btn--primary multilingual-creator__generate"
                    ${!this._canGenerate(context) ? 'disabled' : ''}>
              🌐 ${i18n.t('pgMulti.generate')}
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Vérifie si la génération est possible
   * @param {MultilingualContext} context
   * @returns {boolean}
   */
  _canGenerate(context) {
    const hasWords = context.words && context.words.trim().length > 0;
    const hasTargetLangs = context.targetLangs && context.targetLangs.length > 0;
    return hasWords && hasTargetLangs;
  },

  /**
   * Rend la progression de génération
   * @param {Object} progress - État de progression
   * @param {string[]} errors - Erreurs
   * @returns {string} HTML
   */
  renderProgress(progress, errors) {
    const { phase, current, total, word, status } = progress;
    const percent = total > 0 ? Math.round((current / total) * 100) : 0;

    const phaseLabels = {
      'init': '🔄 ' + i18n.t('mlcCreator.init'),
      'translating': '🌐 ' + i18n.t('pgMulti.translating'),
      'fetching_audio': '🔊 ' + i18n.t('pgMulti.fetchingAudio'),
      'complete': '✅ ' + i18n.t('pgMulti.complete')
    };

    const statusLabels = {
      'translating': '🌐 ' + i18n.t('pgMulti.translating'),
      'fetching_audio': '🔊 ' + i18n.t('pgMulti.audio'),
      'success': '✅ ' + i18n.t('gen.status.ok'),
      'partial': '⚠️ ' + i18n.t('pgMulti.partial'),
      'error': '❌ ' + i18n.t('common.error')
    };

    return `
      <div class="multilingual-creator multilingual-creator--progress">
        <h1 class="multilingual-creator__title">🌍 ${i18n.t('mlcCreator.generating')}</h1>
        <p class="multilingual-creator__phase">${phaseLabels[phase] || phase}</p>

        <div class="multilingual-creator__progress-container">
          <div class="multilingual-creator__progress-bar">
            <div class="multilingual-creator__progress-fill" style="width: ${percent}%"></div>
          </div>
          <div class="multilingual-creator__progress-text">${i18n.t('gen.progress', { current, total })}</div>
        </div>

        ${word ? `
          <div class="multilingual-creator__current-word">
            <span class="multilingual-creator__current-word-label">${i18n.t('gen.currentWord')}</span>
            <span class="multilingual-creator__current-word-value">${escapeHtml(word)}</span>
            <span class="multilingual-creator__current-word-status">${statusLabels[status] || status}</span>
          </div>
        ` : ''}

        ${errors.length > 0 ? `
          <div class="multilingual-creator__errors-preview">
            <span class="multilingual-creator__errors-count">${i18n.tn('pgMulti.problems', errors.length)}</span>
          </div>
        ` : ''}
      </div>
    `;
  },

  /**
   * Rend le résultat de génération
   * @param {Object} deck - Deck multilingue généré
   * @param {string[]} errors - Erreurs
   * @returns {string} HTML
   */
  /**
   * Auteur et licence de chaque enregistrement du deck (à conserver lors d'un partage du deck)
   * @private
   * @param {Object} deck
   * @returns {string} HTML ('' s'il n'y a aucun enregistrement)
   */
  _renderAttributions(deck) {
    const entries = LinguaLibre.listAttributions(deck);
    if (entries.length === 0) return '';
    return `
        <details class="multilingual-creator__attributions" open>
          <summary>🔊 ${i18n.tn('gen.attributions', entries.length)}</summary>
          <p class="multilingual-creator__attributions-hint">${i18n.t('gen.attributionsHint')}</p>
          <ul class="multilingual-creator__attributions-list">
            ${entries.map(e => `<li>${escapeHtml(e.word)} (${escapeHtml(e.lang || '')}) : ${escapeHtml(LinguaLibre.describeAttribution(e))}</li>`).join('')}
          </ul>
        </details>`;
  },

  renderResult(deck, errors) {
    const languages = deck.languages || [];
    const wordsWithAllTranslations = (deck.words || []).filter(w =>
      languages.every(lang => w.translations?.[lang]?.text)
    ).length;
    const wordsWithAudio = (deck.words || []).filter(w =>
      Object.values(w.translations || {}).some(t => t.audio)
    ).length;

    return `
      <div class="multilingual-creator multilingual-creator--result">
        <div class="multilingual-creator__header">
          <button class="btn btn--ghost multilingual-creator__back">← ${i18n.t('pgMulti.newDeck')}</button>
          <h1 class="multilingual-creator__title">✅ ${i18n.t('pgMulti.deckGenerated')}</h1>
        </div>

        <div class="multilingual-creator__result-summary">
          <div class="multilingual-creator__result-stat">
            <span class="multilingual-creator__result-stat-value">${deck.words?.length || 0}</span>
            <span class="multilingual-creator__result-stat-label">${i18n.t('pgMulti.statWords')}</span>
          </div>
          <div class="multilingual-creator__result-stat">
            <span class="multilingual-creator__result-stat-value">${languages.length}</span>
            <span class="multilingual-creator__result-stat-label">${i18n.t('pgMulti.statLangs')}</span>
          </div>
          <div class="multilingual-creator__result-stat multilingual-creator__result-stat--success">
            <span class="multilingual-creator__result-stat-value">${wordsWithAllTranslations}</span>
            <span class="multilingual-creator__result-stat-label">${i18n.t('pgMulti.statComplete')}</span>
          </div>
          <div class="multilingual-creator__result-stat multilingual-creator__result-stat--audio">
            <span class="multilingual-creator__result-stat-value">${wordsWithAudio}</span>
            <span class="multilingual-creator__result-stat-label">${i18n.t('pgMulti.statAudio')}</span>
          </div>
        </div>

        <div class="multilingual-creator__languages">
          ${languages.map(lang => {
            const info = this.AVAILABLE_LANGUAGES[lang] || { flag: '🌐', label: lang };
            return `<span class="multilingual-creator__lang-badge">${escapeHtml(info.flag)} ${escapeHtml(info.label)}</span>`;
          }).join('')}
        </div>

        ${errors.length > 0 ? `
          <details class="multilingual-creator__errors-details">
            <summary>⚠️ ${i18n.tn('pgMulti.problemsClick', errors.length)}</summary>
            <ul class="multilingual-creator__errors-list">
              ${errors.map(err => `<li>${escapeHtml(err)}</li>`).join('')}
            </ul>
          </details>
        ` : ''}

        <div class="multilingual-creator__result-preview">
          <h3>${i18n.t('gen.deckPreview', { name: escapeHtml(deck.name) })}</h3>
          <div class="multilingual-creator__words-preview">
            ${(deck.words || []).slice(0, 5).map(word => `
              <div class="multilingual-creator__word-preview">
                <div class="multilingual-creator__word-translations">
                  ${languages.map(lang => {
                    const t = word.translations?.[lang];
                    const info = this.AVAILABLE_LANGUAGES[lang] || { flag: '🌐' };
                    const hasAudio = t?.audio;
                    return `
                      <span class="multilingual-creator__word-translation ${!t?.text ? 'multilingual-creator__word-translation--missing' : ''}">
                        ${escapeHtml(info.flag)} ${escapeHtml(t?.text || '?')}
                        ${hasAudio ? '<span class="multilingual-creator__audio-indicator">🔊</span>' : ''}
                      </span>
                    `;
                  }).join('')}
                </div>
              </div>
            `).join('')}
            ${(deck.words?.length || 0) > 5 ? `
              <div class="multilingual-creator__word-more">${i18n.t('gen.moreWords', { count: deck.words.length - 5 })}</div>
            ` : ''}
          </div>
        </div>

        ${this._renderAttributions(deck)}

        <div class="multilingual-creator__actions">
          <button class="btn btn--primary multilingual-creator__save">
            💾 ${i18n.t('editor.saveDeck')}
          </button>
          <button class="btn btn--secondary multilingual-creator__export-yaml">
            📄 ${i18n.t('gen.exportYaml')}
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Génère un deck multilingue avec traductions et audio
   * @async
   * @param {MultilingualContext} context - Contexte
   * @param {Function} onProgress - Callback de progression
   * @param {Function} onComplete - Callback de fin
   */
  async generate(context, onProgress, onComplete) {
    if (typeof LinguaLibre === 'undefined') {
      alert(i18n.t('pgMulti.moduleMissing'));
      onComplete(null, [i18n.t('pgMulti.moduleMissing')]);
      return;
    }

    const words = context.words
      .split('\n')
      .map(w => w.trim())
      .filter(w => w.length > 0);

    if (words.length === 0) {
      alert(i18n.t('gen.needOneWord'));
      onComplete(null, [i18n.t('pgMulti.noWords')]);
      return;
    }

    const allLanguages = [context.sourceLang, ...context.targetLangs.filter(l => l !== context.sourceLang)];
    const errors = [];
    const multiWords = [];
    const total = words.length;

    onProgress({ phase: 'init', current: 0, total, word: '', status: 'init' });

    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      onProgress({
        phase: 'translating',
        current: i + 1,
        total,
        word,
        status: 'translating'
      });

      try {
        // Récupérer les traductions via Wikidata
        const translations = await LinguaLibre.getTranslations(
          word,
          context.sourceLang,
          context.targetLangs
        );

        // Structure du mot multilingue
        const multiWord = {
          id: TextUtils.slugify(word),
          translations: {}
        };

        // Pour chaque langue, récupérer l'audio si disponible
        for (const lang of allLanguages) {
          const text = translations[lang] || (lang === context.sourceLang ? word : null);

          if (!text) {
            continue;
          }

          multiWord.translations[lang] = {
            text: text,
            alternatives: [],
            audio: null
          };

          // Tenter de récupérer l'audio
          onProgress({
            phase: 'fetching_audio',
            current: i + 1,
            total,
            word: `${word} (${lang})`,
            status: 'fetching_audio'
          });

          try {
            const audioInfo = await LinguaLibre.findAudio(text, lang);
            if (audioInfo) {
              const audioData = await LinguaLibre.downloadAsBase64(audioInfo.url);
              multiWord.translations[lang].audio = {
                format: audioData.format,
                data: audioData.data,
                ...LinguaLibre.audioAttribution(audioInfo)
              };
            }
          } catch (audioErr) {
            // Audio non trouvé, pas critique
          }
        }

        // Vérifier qu'on a au moins 2 langues
        const langCount = Object.keys(multiWord.translations).length;
        if (langCount >= 2) {
          multiWords.push(multiWord);
        } else if (langCount === 1) {
          errors.push(`"${word}" : traduction trouvée dans 1 seule langue`);
        } else {
          errors.push(`"${word}" : aucune traduction trouvée`);
        }

        // Petit délai pour ne pas surcharger les APIs
        await this._sleep(150);

      } catch (err) {
        errors.push(`"${word}" : ${err.message}`);
      }
    }

    if (multiWords.length === 0) {
      onComplete(null, errors.length > 0 ? errors : [i18n.t('pgMulti.noneProcessed')]);
      return;
    }

    // Construire le deck multilingue
    const deck = {
      id: 'multilingual-' + Date.now(),
      name: context.deckName || `Vocabulaire ${this.AVAILABLE_LANGUAGES[context.sourceLang]?.label || context.sourceLang}`,
      type: 'multilingual',
      description: `Deck multilingue généré automatiquement (${multiWords.length} mots)`,
      languages: allLanguages.filter(lang =>
        multiWords.some(w => w.translations[lang]?.text)
      ),
      words: multiWords,
      category: ['langues', 'vocabulaire'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onComplete(deck, errors);
  },

  /**
   * Sauvegarde le deck multilingue
   * @param {Object} deck - Deck à sauvegarder
   */
  save(deck) {
    if (!deck) return;

    // Sauvegarder dans custom decks
    if (!Storage.saveCustomDeck(deck)) {
      alert(i18n.t('pgMulti.saveFailed', { name: deck.name }));
      return;
    }

    // Mettre à jour l'état
    const allDecks = State.get('decks') || [];
    allDecks.push(deck);
    State.set('decks', allDecks);

    alert(i18n.t('pgMulti.saved', { name: deck.name, words: deck.words.length, langs: deck.languages.length }));
  },

  /**
   * Exporte le deck en YAML
   * @param {Object} deck - Deck à exporter
   */
  exportYaml(deck) {
    if (!deck || typeof YAML === 'undefined') return;

    const yaml = YAML.stringify(deck);
    const blob = new Blob([yaml], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${deck.id}.yaml`;
    a.click();

    URL.revokeObjectURL(url);
  },

  /**
   * Pause asynchrone
   * @param {number} ms - Millisecondes
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Lie les événements du mode multilingue
   * @param {HTMLElement} container - Container DOM
   * @param {Object} pageContext - Contexte de la page
   * @param {Function} remount - Fonction de remontage
   */
  bindEvents(container, pageContext, remount) {
    // Bouton retour
    container.querySelectorAll('.multilingual-creator__back').forEach(btn => {
      btn.addEventListener('click', () => {
        pageContext.resetMultilingual();
        remount();
      });
    });

    // Champs du formulaire
    container.querySelector('#multilingual-name')?.addEventListener('input', (e) => {
      pageContext.multilingualDeckName = e.target.value;
    });

    container.querySelector('#multilingual-source-lang')?.addEventListener('change', (e) => {
      pageContext.multilingualSourceLang = e.target.value;
      // Désactiver cette langue dans les cibles et la retirer si sélectionnée
      pageContext.multilingualTargetLangs = (pageContext.multilingualTargetLangs || [])
        .filter(l => l !== e.target.value);
      remount();
    });

    // Checkboxes des langues cibles
    container.querySelectorAll('.multilingual-creator__lang-checkbox').forEach(cb => {
      cb.addEventListener('change', () => {
        const lang = cb.dataset.lang;
        let targets = pageContext.multilingualTargetLangs || [];

        if (cb.checked) {
          if (!targets.includes(lang)) {
            targets.push(lang);
          }
        } else {
          targets = targets.filter(l => l !== lang);
        }

        pageContext.multilingualTargetLangs = targets;

        // Mettre à jour l'UI
        const hint = container.querySelector('.multilingual-creator__hint--langs');
        if (hint) {
          hint.textContent = i18n.tn('pgMulti.langsSelected', targets.length);
        }

        // Toggle class selected
        cb.closest('.multilingual-creator__lang-option')?.classList.toggle(
          'multilingual-creator__lang-option--selected',
          cb.checked
        );

        // Activer/désactiver le bouton générer
        const generateBtn = container.querySelector('.multilingual-creator__generate');
        if (generateBtn) {
          const hasWords = pageContext.multilingualWords?.trim().length > 0;
          generateBtn.disabled = !(hasWords && targets.length > 0);
        }
      });
    });

    // Textarea des mots
    container.querySelector('#multilingual-words')?.addEventListener('input', (e) => {
      pageContext.multilingualWords = e.target.value;

      // Mettre à jour le compteur
      const hint = container.querySelector('.multilingual-creator__hint--words');
      if (hint) {
        const count = e.target.value.split('\n').filter(w => w.trim()).length;
        hint.textContent = count + ' mot' + (count > 1 ? 's' : '');
      }

      // Activer/désactiver le bouton
      const generateBtn = container.querySelector('.multilingual-creator__generate');
      if (generateBtn) {
        const hasWords = e.target.value.trim().length > 0;
        const hasTargets = (pageContext.multilingualTargetLangs || []).length > 0;
        generateBtn.disabled = !(hasWords && hasTargets);
      }
    });

    // Génération
    container.querySelector('.multilingual-creator__generate')?.addEventListener('click', () => {
      const context = {
        words: pageContext.multilingualWords,
        sourceLang: pageContext.multilingualSourceLang,
        targetLangs: pageContext.multilingualTargetLangs,
        deckName: pageContext.multilingualDeckName
      };

      pageContext.multilingualProgress = { phase: 'init', current: 0, total: 0, word: '', status: 'init' };
      pageContext.multilingualErrors = [];
      remount();

      this.generate(
        context,
        (progress) => {
          pageContext.multilingualProgress = progress;
          const progressEl = container.querySelector('.multilingual-creator--progress');
          if (progressEl) {
            progressEl.outerHTML = this.renderProgress(progress, pageContext.multilingualErrors);
          }
        },
        (deck, errors) => {
          pageContext.multilingualGeneratedDeck = deck;
          pageContext.multilingualErrors = errors || [];
          pageContext.multilingualProgress = null;
          remount();
        }
      );
    });

    // Sauvegarde
    container.querySelector('.multilingual-creator__save')?.addEventListener('click', () => {
      this.save(pageContext.multilingualGeneratedDeck);
      pageContext.resetMultilingual();
      Router.navigate('/multilingual-config/' + pageContext.multilingualGeneratedDeck.id);
    });

    // Export YAML
    container.querySelector('.multilingual-creator__export-yaml')?.addEventListener('click', () => {
      this.exportYaml(pageContext.multilingualGeneratedDeck);
    });
  }
};

// Export pour Node.js (tests) et navigateur
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PromptGeneratorMultilingual;
}
