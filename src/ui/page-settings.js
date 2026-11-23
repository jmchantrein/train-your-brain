/**
 * Page Settings - Paramètres de l'application
 *
 * Dépendances: Pages (pages-base.js), Components, State, Storage, Router, i18n, Themes, Tutorial
 */

// ═══════════════════════════════════════════════════════════════
// SETTINGS - Paramètres
// ═══════════════════════════════════════════════════════════════

Pages.settings = {
  render(state) {
    const { player } = state;
    const _t = PageUtils.getTranslator();
    const languagePref = this._getLanguagePreference(player);

    if (!player) {
      return `<div class="page page--settings">${_t('app.loading')}</div>`;
    }

    return `
      <div class="page page--settings">
        <main class="page__content" id="main-content" role="main">
          <h1 class="settings__title">⚙️ ${_t('settings.title')}</h1>

          <section class="settings__section">
            <h2 class="settings__section-title">🌐 ${_t('settings.language')}</h2>
            <div class="settings__language-select" role="radiogroup" aria-label="${_t('settings.language')}">
              ${typeof i18n !== 'undefined' ? this._getLanguageOptions().map(loc => `
                <label class="settings__language-option ${languagePref === loc.code ? 'settings__language-option--active' : ''}">
                  <input type="radio" name="language" value="${loc.code}" ${languagePref === loc.code ? 'checked' : ''}>
                  <span class="settings__language-flag">${loc.flag}</span>
                  <span class="settings__language-label">${escapeHtml(loc.label)}</span>
                </label>
              `).join('') : ''}
            </div>
            ${this._renderGrammaticalForm(player)}
          </section>

          <section class="settings__section">
            <h2 class="settings__section-title">🔊 ${_t('settings.audio')}</h2>
            <label class="settings__option">
              <input type="checkbox" id="sound-toggle" ${player.settings.soundEnabled ? 'checked' : ''}>
              <span>${_t('settings.soundEnabled')}</span>
            </label>
          </section>

          <section class="settings__section">
            <h2 class="settings__section-title">🎨 ${_t('settings.themes')}</h2>
            <p class="settings__description">${_t('settings.themesDesc')}</p>
            <div class="settings__themes-grid">
              ${this._renderThemes(player)}
            </div>
          </section>

          <section class="settings__section">
            <h2 class="settings__section-title">♿ ${_t('settings.accessibility')}</h2>
            <div class="settings__a11y-options">
              <label class="settings__a11y-option">
                <input type="checkbox" id="dyslexia-toggle" ${player.settings.dyslexiaMode ? 'checked' : ''}>
                <div class="settings__a11y-label">
                  <div class="settings__a11y-title">${_t('settings.dyslexia')}</div>
                  <div class="settings__a11y-desc">${_t('settings.dyslexiaDesc')}</div>
                </div>
              </label>

              <label class="settings__a11y-option">
                <input type="checkbox" id="high-contrast-toggle" ${player.settings.highContrast ? 'checked' : ''}>
                <div class="settings__a11y-label">
                  <div class="settings__a11y-title">${_t('settings.highContrast')}</div>
                  <div class="settings__a11y-desc">${_t('settings.highContrastDesc')}</div>
                </div>
              </label>

              <label class="settings__a11y-option">
                <input type="checkbox" id="large-spacing-toggle" ${player.settings.largeSpacing ? 'checked' : ''}>
                <div class="settings__a11y-label">
                  <div class="settings__a11y-title">${_t('settings.largeSpacing')}</div>
                  <div class="settings__a11y-desc">${_t('settings.largeSpacingDesc')}</div>
                </div>
              </label>

              <div class="settings__a11y-option" style="cursor: default;">
                <div class="settings__a11y-label">
                  <div class="settings__a11y-title" id="colorblind-title">${_t('settings.colorblind')}</div>
                  <div class="settings__a11y-desc">${_t('settings.colorblindDesc')}</div>
                </div>
                <select id="colorblind-select" class="settings__colorblind-select" aria-labelledby="colorblind-title">
                  <option value="" ${!player.settings.colorblindMode ? 'selected' : ''}>${_t('settings.colorblindOff')}</option>
                  <option value="protanopia" ${player.settings.colorblindMode === 'protanopia' ? 'selected' : ''}>${_t('settings.protanopia')}</option>
                  <option value="deuteranopia" ${player.settings.colorblindMode === 'deuteranopia' ? 'selected' : ''}>${_t('settings.deuteranopia')}</option>
                  <option value="tritanopia" ${player.settings.colorblindMode === 'tritanopia' ? 'selected' : ''}>${_t('settings.tritanopia')}</option>
                </select>
              </div>
            </div>
          </section>

          <section class="settings__section">
            <h2 class="settings__section-title">❓ ${_t('settings.help')}</h2>
            <button class="btn btn--secondary settings__tutorial">
              🎓 ${_t('settings.replayTutorial')}
            </button>
            <p class="settings__help-text">${_t('settings.replayTutorialDesc')}</p>
          </section>

          <section class="settings__section">
            <h2 class="settings__section-title">💾 ${_t('settings.data')}</h2>
            <button class="btn btn--secondary settings__export">${_t('common.export')}</button>
            <button class="btn btn--danger settings__reset">${_t('settings.reset')}</button>
          </section>

          <section class="settings__section">
            <h2 class="settings__section-title">🔧 ${_t('settings.advanced')}</h2>
            <div class="settings__a11y-options">
              <label class="settings__a11y-option">
                <input type="checkbox" id="allow-builtin-deletion" ${player.settings.allowBuiltinDeckDeletion ? 'checked' : ''}>
                <div class="settings__a11y-label">
                  <div class="settings__a11y-title">${_t('settings.allowBuiltinDeletion')}</div>
                  <div class="settings__a11y-desc">${_t('settings.allowBuiltinDeletionDesc')}</div>
                </div>
              </label>
            </div>
          </section>

          <section class="settings__section settings__section--about">
            <h2 class="settings__section-title">ℹ️ ${_t('settings.about')}</h2>
            <button class="settings__about-toggle" aria-expanded="false">
              <span class="settings__about-toggle-icon">🧠</span>
              <span class="settings__about-toggle-text">${_t('settings.aboutTitle')}</span>
              <span class="settings__about-toggle-arrow">▼</span>
            </button>
            <div class="settings__about-content" style="display: none;">
              <div class="settings__about-grid">
                <div class="settings__about-item">
                  <span class="settings__about-icon">📚</span>
                  <h3>${_t('settings.aboutLeitner')}</h3>
                  <p>${_t('settings.aboutLeitnerDesc')}</p>
                </div>
                <div class="settings__about-item">
                  <span class="settings__about-icon">🤖</span>
                  <h3>${_t('settings.aboutAI')}</h3>
                  <p>${_t('settings.aboutAIDesc')}</p>
                </div>
                <div class="settings__about-item">
                  <span class="settings__about-icon">🤝</span>
                  <h3>${_t('settings.aboutShare')}</h3>
                  <p>${_t('settings.aboutShareDesc')}</p>
                </div>
                <div class="settings__about-item">
                  <span class="settings__about-icon">📴</span>
                  <h3>${_t('settings.aboutOffline')}</h3>
                  <p>${_t('settings.aboutOfflineDesc')}</p>
                </div>
                <div class="settings__about-item">
                  <span class="settings__about-icon">💻</span>
                  <h3>${_t('settings.aboutOpenSource')}</h3>
                  <p>${_t('settings.aboutOpenSourceDesc')}</p>
                </div>
                <div class="settings__about-item">
                  <span class="settings__about-icon">💡</span>
                  <h3>${_t('settings.aboutContribute')}</h3>
                  <p>${_t('settings.aboutContributeDesc')}</p>
                </div>
              </div>
              <div class="settings__about-footer">
                <span class="settings__about-version">
                  ${_t('settings.version')} 1.0.0
                  <span class="settings__version-badge settings__version-badge--alpha">ALPHA</span>
                </span>
                <div class="settings__about-links">
                  <a href="https://github.com/jmchantrein/train-your-brain" target="_blank" rel="noopener noreferrer" class="settings__about-github">
                    GitHub →
                  </a>
                  <a href="https://github.com/jmchantrein/train-your-brain/issues" target="_blank" rel="noopener noreferrer" class="settings__about-contact">
                    ${_t('settings.contact')} →
                  </a>
                </div>
              </div>
            </div>
          </section>
        </main>

        ${PageUtils.renderFooter(player, 'settings')}
      </div>
    `;
  },

  /** Choix de langue du joueur : 'fr', 'en' ou 'auto' (langue du navigateur, valeur par défaut). */
  _getLanguagePreference(player) {
    const pref = player && player.settings ? player.settings.language : undefined;
    return typeof i18n !== 'undefined' && i18n.SUPPORTED_LOCALES.includes(pref) ? pref : 'auto';
  },

  /**
   * Choix de la forme grammaticale des textes français (féminin, masculin, point médian).
   * Visible seulement en français : l'anglais n'accorde pas. Chaque choix montre un exemple
   * de rendu, calculé avec le même mécanisme que les textes (i18n.resolveVariant).
   * @private
   */
  _renderGrammaticalForm(player) {
    if (typeof i18n === 'undefined' || i18n.getLocale() !== 'fr') return '';
    const _t = PageUtils.getTranslator();
    const current = i18n.resolveGrammaticalForm(player.settings ? player.settings.grammaticalForm : undefined);
    const sample = i18n._translations.fr['badge.mastery_10.name'];
    const options = [
      { form: 'feminine', label: _t('settings.formFeminine') },
      { form: 'masculine', label: _t('settings.formMasculine') },
      { form: 'inclusive', label: _t('settings.formInclusive') }
    ];
    return `
            <div class="settings__form" role="radiogroup" aria-labelledby="grammatical-form-title">
              <h3 class="settings__form-title" id="grammatical-form-title">${_t('settings.grammaticalForm')}</h3>
              <p class="settings__description">${_t('settings.grammaticalFormDesc')}</p>
              <div class="settings__form-select">
                ${options.map(o => `
                  <label class="settings__form-option ${current === o.form ? 'settings__form-option--active' : ''}">
                    <input type="radio" name="grammatical-form" value="${o.form}" ${current === o.form ? 'checked' : ''}>
                    <span class="settings__form-label">${escapeHtml(o.label)}</span>
                    <span class="settings__form-example">${escapeHtml(_t('settings.formExample', { example: i18n.resolveVariant(sample, o.form) }))}</span>
                  </label>
                `).join('')}
              </div>
            </div>`;
  },

  _getLanguageOptions() {
    const _t = PageUtils.getTranslator();
    return [{ code: 'auto', label: _t('settings.languageAuto'), flag: '🌐' }, ...i18n.getAvailableLocales()];
  },

  /**
   * Ré-affiche la page après un changement de réglage. App._showPage ne lie le pied de page
   * (menu du joueur) qu'après le premier mount : il faut le relier ici, sinon il reste inerte.
   * @private
   */
  _remount(container) {
    this.mount(container, State.getAll());
    PageUtils.bindFooter(container);
  },

  mount(container, state) {
    container.innerHTML = this.render(state);

    const player = state.player;

    // Changement de langue
    container.querySelectorAll('input[name="language"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const value = e.target.value;
        if (typeof i18n === 'undefined' || !(value === 'auto' || i18n.SUPPORTED_LOCALES.includes(value))) return;
        // Persister le choix dans le profil ('auto' = langue du navigateur)
        player.settings.language = value;
        Storage.savePlayer(player);
        // Aussi par identifiant : la langue doit suivre le profil lors d'un changement de joueur
        if (player.id) Storage.savePlayerById(player);
        // State.set notifie l'abonné de l'app, qui applique la langue (player.settings.language)
        State.set('player', player);
        // Re-rendre la page dans la nouvelle langue
        this._remount(container);
      });
    });

    // Forme grammaticale (féminin, masculin, point médian) : propre au joueur, appliquée tout de suite
    container.querySelectorAll('input[name="grammatical-form"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const value = e.target.value;
        if (typeof i18n === 'undefined' || !i18n.GRAMMATICAL_FORMS.includes(value)) return;
        player.settings.grammaticalForm = value;
        Storage.savePlayer(player);
        // Aussi par identifiant : le choix doit suivre le profil lors d'un changement de joueur
        if (player.id) Storage.savePlayerById(player);
        // State.set notifie l'abonné de l'app, qui applique la forme (player.settings.grammaticalForm)
        State.set('player', player);
        // Re-rendre la page : les textes s'accordent selon la nouvelle forme
        this._remount(container);
      });
    });

    // Toggle son
    const soundToggle = container.querySelector('#sound-toggle');
    soundToggle.addEventListener('change', (e) => {
      player.settings.soundEnabled = e.target.checked;
      Storage.savePlayer(player);
      State.set('player', player);
    });

    // Accessibilité - Mode dyslexie
    const dyslexiaToggle = container.querySelector('#dyslexia-toggle');
    if (dyslexiaToggle) {
      dyslexiaToggle.addEventListener('change', (e) => {
        player.settings.dyslexiaMode = e.target.checked;
        document.documentElement.setAttribute('data-dyslexia', e.target.checked);
        Storage.savePlayer(player);
        State.set('player', player);
      });
    }

    // Accessibilité - Contraste élevé
    const highContrastToggle = container.querySelector('#high-contrast-toggle');
    if (highContrastToggle) {
      highContrastToggle.addEventListener('change', (e) => {
        player.settings.highContrast = e.target.checked;
        document.documentElement.setAttribute('data-high-contrast', e.target.checked);
        Storage.savePlayer(player);
        State.set('player', player);
      });
    }

    // Accessibilité - Espacement large
    const largeSpacingToggle = container.querySelector('#large-spacing-toggle');
    if (largeSpacingToggle) {
      largeSpacingToggle.addEventListener('change', (e) => {
        player.settings.largeSpacing = e.target.checked;
        document.documentElement.setAttribute('data-large-spacing', e.target.checked);
        Storage.savePlayer(player);
        State.set('player', player);
      });
    }

    // Accessibilité - Mode daltonien
    const colorblindSelect = container.querySelector('#colorblind-select');
    if (colorblindSelect) {
      colorblindSelect.addEventListener('change', (e) => {
        player.settings.colorblindMode = e.target.value || null;
        document.documentElement.setAttribute('data-colorblind', e.target.value || '');
        Storage.savePlayer(player);
        State.set('player', player);
      });
    }

    // Avancé - Suppression decks builtin
    const allowBuiltinDeletionToggle = container.querySelector('#allow-builtin-deletion');
    if (allowBuiltinDeletionToggle) {
      allowBuiltinDeletionToggle.addEventListener('change', (e) => {
        player.settings.allowBuiltinDeckDeletion = e.target.checked;
        Storage.savePlayer(player);
        State.set('player', player);
      });
    }

    // Theme selection
    container.querySelectorAll('.settings__theme-card:not([disabled])').forEach(card => {
      card.addEventListener('click', () => {
        const themeId = card.dataset.theme;
        if (typeof Themes !== 'undefined') {
          const updatedPlayer = Themes.setTheme(player, themeId);
          Storage.savePlayer(updatedPlayer);
          State.set('player', updatedPlayer);
          this._remount(container); // Re-render to show selection
        }
      });
    });

    // Revoir le tutoriel (force=true pour ignorer les conditions d'affichage)
    container.querySelector('.settings__tutorial')?.addEventListener('click', () => {
      if (typeof Tutorial !== 'undefined') {
        Tutorial.start(null, true);
      }
    });

    // Export
    const exportButton = container.querySelector('.settings__export');
    exportButton.addEventListener('click', () => {
      const data = Storage.exportAll();
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `train-your-brain-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Reset - Uniquement les données du joueur courant
    const resetButton = container.querySelector('.settings__reset');
    resetButton.addEventListener('click', () => {
      const _t = PageUtils.getTranslator();
      const playerName = player.name || _t('settings.thisPlayer');
      const confirmMessage = `${_t('settings.resetConfirm')}\n\n${_t('settings.resetPlayerNote', { name: playerName })}`;
      if (confirm(confirmMessage)) {
        Storage.clearCurrentPlayerData();
        State.reset();
        location.reload();
      }
    });

    // About toggle
    const aboutToggle = container.querySelector('.settings__about-toggle');
    const aboutContent = container.querySelector('.settings__about-content');
    if (aboutToggle && aboutContent) {
      aboutToggle.addEventListener('click', () => {
        const isExpanded = aboutToggle.getAttribute('aria-expanded') === 'true';
        aboutToggle.setAttribute('aria-expanded', !isExpanded);
        aboutContent.style.display = isExpanded ? 'none' : 'block';
        aboutToggle.querySelector('.settings__about-toggle-arrow').textContent = isExpanded ? '▼' : '▲';
      });
    }
  },

  _renderThemes(player) {
    if (typeof Themes === 'undefined') {
      return `<p>${PageUtils.getTranslator()('settings.themesUnavailable')}</p>`;
    }

    const themes = Themes.getAllThemes(player);
    const currentTheme = Themes.getCurrentTheme(player);

    // Couleurs de prévisualisation - toujours en mode sombre (signature distinctive du thème)
    const themeColors = {
      ocean:    { bg: '#0a0f1a', card: '#1f2937', accent: '#3b82f6' },
      forest:   { bg: '#0d1a0f', card: '#1a3020', accent: '#34d399' },
      sunset:   { bg: '#1a0f0a', card: '#3d241a', accent: '#fb923c' },
      midnight: { bg: '#0f0a1a', card: '#2a1f3d', accent: '#a78bfa' },
      sakura:   { bg: '#1a0f15', card: '#3d242d', accent: '#f472b6' },
      arctic:   { bg: '#0a1520', card: '#1a3040', accent: '#22d3ee' },
      neon:     { bg: '#0a0a0f', card: '#1a1a25', accent: '#e879f9' },
      gold:     { bg: '#1a150a', card: '#3d321a', accent: '#f59e0b' }
    };

    return themes.map(theme => {
      const isSelected = theme.id === currentTheme;
      const isLocked = !theme.isUnlocked;
      const colors = themeColors[theme.id] || themeColors.ocean;

      return `
        <button class="settings__theme-card ${isSelected ? 'settings__theme-card--selected' : ''} ${isLocked ? 'settings__theme-card--locked' : ''}"
                data-theme="${theme.id}"
                ${isLocked ? 'disabled' : ''}>
          <div class="settings__theme-preview" style="background: ${colors.bg};">
            <div class="settings__theme-preview-card" style="background: ${colors.card}; border-color: ${colors.accent};">
              <div class="settings__theme-preview-accent" style="background: ${colors.accent};"></div>
            </div>
          </div>
          <span class="settings__theme-icon">${theme.icon}</span>
          <span class="settings__theme-name">${escapeHtml(theme.name)}</span>
          ${isLocked ? `<span class="settings__theme-lock">🔒</span>` : ''}
          ${isLocked && theme.unlockText ? `<span class="settings__theme-unlock">${escapeHtml(theme.unlockText)}</span>` : ''}
          ${isSelected ? `<span class="settings__theme-check">✓</span>` : ''}
        </button>
      `;
    }).join('');
  }
};
