/**
 * Module Tutorial - Tour guidé et explication Leitner
 *
 * Fournit un onboarding interactif pour les nouveaux utilisateurs
 * et une explication visuelle du système Leitner.
 */

const Tutorial = {
  // ═══════════════════════════════════════════════════════════════
  // CONFIGURATION DES ÉTAPES
  // ═══════════════════════════════════════════════════════════════

  // Textes : clés i18n tutorial.<id>.title|content, résolues à l'affichage (langue et forme du joueur)
  steps: [
    {
      id: 'welcome',
      get title() { return i18n.t('tutorial.welcome.title'); },
      get content() { return i18n.t('tutorial.welcome.content'); },
      emoji: '🧠',
      illustration: 'welcome'
    },
    {
      id: 'leitner',
      get title() { return i18n.t('tutorial.leitner.title'); },
      get content() { return i18n.t('tutorial.leitner.content'); },
      emoji: '📦',
      illustration: 'leitner'
    },
    {
      id: 'boxes',
      get title() { return i18n.t('tutorial.boxes.title'); },
      get content() {
        return `
        <div class="tutorial__boxes-explanation">
          <div class="tutorial__box tutorial__box--new">${i18n.t('tutorial.boxes.new')}</div>
          <div class="tutorial__box tutorial__box--purple">${i18n.t('tutorial.boxes.purple')}</div>
          <div class="tutorial__box tutorial__box--orange">${i18n.t('tutorial.boxes.orange')}</div>
          <div class="tutorial__box tutorial__box--green">${i18n.t('tutorial.boxes.green')}</div>
        </div>
      `;
      },
      emoji: '🎯',
      illustration: 'boxes'
    },
    {
      id: 'gameplay',
      get title() { return i18n.t('tutorial.gameplay.title'); },
      get content() { return i18n.t('tutorial.gameplay.content'); },
      emoji: '⚡',
      illustration: 'gameplay'
    },
    {
      id: 'xp',
      get title() { return i18n.t('tutorial.xp.title'); },
      get content() {
        // Bornes du bonus de série lues dans le barème réel (XP.STREAK_BONUSES)
        const bonuses = (typeof XP !== 'undefined' ? XP.STREAK_BONUSES : []).map(b => b.xp);
        const bonus = { min: bonuses.length ? Math.min(...bonuses) : 0, max: bonuses.length ? Math.max(...bonuses) : 0 };
        return `
        <div class="tutorial__xp-info">
          <div class="tutorial__xp-row">${i18n.t('tutorial.xp.purple')}</div>
          <div class="tutorial__xp-row">${i18n.t('tutorial.xp.orange')}</div>
          <div class="tutorial__xp-row">${i18n.t('tutorial.xp.green')}</div>
          <div class="tutorial__xp-row">${i18n.t('tutorial.xp.bonus', bonus)}</div>
        </div>
      `;
      },
      emoji: '⭐',
      illustration: 'xp'
    },
    {
      id: 'badges',
      get title() { return i18n.t('tutorial.badges.title'); },
      get content() {
        // Nombres lus dans le code (BADGES, Challenges.DAILY_TYPES) : ils ne dérivent pas du texte
        const count = typeof BADGES !== 'undefined' ? BADGES.length : 0;
        const daily = typeof Challenges !== 'undefined' && Challenges.DAILY_TYPES ? Challenges.DAILY_TYPES.length : 3;
        return i18n.t('tutorial.badges.content', { count, daily });
      },
      emoji: '🏆',
      illustration: 'badges'
    },
    {
      id: 'navigation',
      get title() { return i18n.t('tutorial.navigation.title'); },
      get content() {
        return `
        <div class="tutorial__nav-info">
          <div class="tutorial__nav-item">${i18n.t('tutorial.navigation.home')}</div>
          <div class="tutorial__nav-item">${i18n.t('tutorial.navigation.explore')}</div>
          <div class="tutorial__nav-item">${i18n.t('tutorial.navigation.create')}</div>
          <div class="tutorial__nav-item">${i18n.t('tutorial.navigation.stats')}</div>
          <div class="tutorial__nav-item">${i18n.t('tutorial.navigation.settings')}</div>
        </div>
      `;
      },
      emoji: '🧭',
      illustration: 'navigation'
    },
    {
      id: 'ready',
      get title() { return i18n.t('tutorial.ready.title'); },
      get content() { return i18n.t('tutorial.ready.content'); },
      emoji: '🚀',
      illustration: 'ready'
    }
  ],

  // État interne
  currentStep: 0,
  overlay: null,
  isOpen: false,
  onCompleteCallback: null,

  // ═══════════════════════════════════════════════════════════════
  // API PUBLIQUE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Vérifie si le tutoriel doit être affiché (nouveau joueur)
   * @param {Object} player - Joueur actuel
   * @returns {boolean}
   */
  shouldShow(player) {
    if (!player) return false;
    // Ne pas afficher si déjà complété
    if (player.settings?.tutorialCompleted === true) return false;
    // Ne pas afficher si le joueur a déjà joué des cartes
    if (player.stats?.totalCardsPlayed > 0) return false;
    // Ne pas afficher si une session de jeu est active
    if (typeof State !== 'undefined') {
      const currentSession = State.get('currentSession');
      if (currentSession) return false;
    }
    return true;
  },

  /**
   * Lance le tutoriel
   * @param {Function} [onComplete] - Callback à la fin
   * @param {boolean} [force=false] - Force le démarrage même si shouldShow retourne false
   */
  start(onComplete = null, force = false) {
    if (this.isOpen) return;

    // Vérifier une dernière fois si on doit afficher (sauf si forcé depuis settings)
    if (!force && typeof State !== 'undefined') {
      const player = State.get('player');
      if (!this.shouldShow(player)) return;
    }

    this.currentStep = 0;
    this.onCompleteCallback = onComplete;
    this.isOpen = true;
    this._createOverlay();
    this._renderStep();

    // Annoncer pour les lecteurs d'écran
    if (typeof A11y !== 'undefined') {
      A11y.announce(i18n.t('tutorial.started', { total: this.steps.length }));
    }
  },

  /**
   * Passe à l'étape suivante
   */
  next() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this._renderStep();
    } else {
      this.close(true);
    }
  },

  /**
   * Revient à l'étape précédente
   */
  prev() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this._renderStep();
    }
  },

  /**
   * Ferme le tutoriel
   * @param {boolean} completed - Si le tutoriel est terminé
   */
  close(completed = false) {
    if (!this.isOpen) return;

    this.isOpen = false;

    // Nettoyer l'écouteur de clavier (TOUJOURS, pas seulement quand completed)
    if (this._handleKeydown) {
      document.removeEventListener('keydown', this._handleKeydown);
      this._handleKeydown = null;
    }

    // Animation de sortie
    if (this.overlay) {
      this.overlay.classList.add('tutorial-overlay--closing');
      setTimeout(() => {
        if (this.overlay) {
          this.overlay.remove();
          this.overlay = null;
        }
      }, 300);
    }

    // Marquer comme complété si terminé
    if (completed) {
      this._markCompleted();
    }

    // Callback
    if (this.onCompleteCallback) {
      this.onCompleteCallback(completed);
      this.onCompleteCallback = null;
    }
  },

  /**
   * Saute directement à une étape
   * @param {number} stepIndex - Index de l'étape
   */
  goToStep(stepIndex) {
    if (stepIndex >= 0 && stepIndex < this.steps.length) {
      this.currentStep = stepIndex;
      this._renderStep();
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // MÉTHODES PRIVÉES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Crée l'overlay du tutoriel
   * @private
   */
  _createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'tutorial-overlay';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-labelledby', 'tutorial-title');

    // Gérer la fermeture via Escape
    this._handleKeydown = (e) => {
      if (e.key === 'Escape') {
        this.close(false);
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        this.next();
      } else if (e.key === 'ArrowLeft') {
        this.prev();
      }
    };
    document.addEventListener('keydown', this._handleKeydown);

    document.body.appendChild(this.overlay);
  },

  /**
   * Rend l'étape courante
   * @private
   */
  _renderStep() {
    const step = this.steps[this.currentStep];
    const isFirst = this.currentStep === 0;
    const isLast = this.currentStep === this.steps.length - 1;
    const _t = PageUtils.getTranslator();

    const illustrationHtml = this._renderIllustration(step.illustration);

    this.overlay.innerHTML = `
      <div class="tutorial-modal">
        <button class="tutorial-modal__close" aria-label="${escapeHtml(_t('tutorial.closeLabel'))}" data-action="close">
          <span aria-hidden="true">×</span>
        </button>

        <div class="tutorial-modal__header">
          <div class="tutorial-modal__emoji">${step.emoji}</div>
          <h2 class="tutorial-modal__title" id="tutorial-title">${step.title}</h2>
        </div>

        <div class="tutorial-modal__illustration">
          ${illustrationHtml}
        </div>

        <div class="tutorial-modal__content">
          ${step.content}
        </div>

        <div class="tutorial-modal__progress">
          ${this.steps.map((_, i) => `
            <button
              class="tutorial-modal__dot ${i === this.currentStep ? 'tutorial-modal__dot--active' : ''} ${i < this.currentStep ? 'tutorial-modal__dot--completed' : ''}"
              data-step="${i}"
              aria-label="${escapeHtml(_t('tutorial.stepLabel', { n: i + 1 }))}"
              ${i === this.currentStep ? 'aria-current="step"' : ''}
            ></button>
          `).join('')}
        </div>

        <div class="tutorial-modal__footer">
          <button class="tutorial-modal__btn tutorial-modal__btn--secondary" data-action="skip">
            ${isLast ? _t('tutorial.close') : _t('tutorial.skip')}
          </button>

          <div class="tutorial-modal__nav">
            ${!isFirst ? `
              <button class="tutorial-modal__btn tutorial-modal__btn--nav" data-action="prev" aria-label="${escapeHtml(_t('tutorial.prevLabel'))}">
                ${_t('tutorial.prev')}
              </button>
            ` : ''}

            <button class="tutorial-modal__btn tutorial-modal__btn--primary" data-action="next">
              ${isLast ? _t('tutorial.start') : _t('tutorial.next')}
            </button>
          </div>
        </div>

        <div class="tutorial-modal__step-counter">
          ${this.currentStep + 1} / ${this.steps.length}
        </div>
      </div>
    `;

    this._bindEvents();

    // Focus le premier bouton focusable
    const firstButton = this.overlay.querySelector('.tutorial-modal__btn--primary');
    if (firstButton) {
      setTimeout(() => firstButton.focus(), 100);
    }
  },

  /**
   * Rend l'illustration pour une étape
   * @private
   */
  _renderIllustration(type) {
    switch (type) {
      case 'welcome':
        return `
          <div class="tutorial-illust tutorial-illust--welcome">
            <div class="tutorial-illust__brain">🧠</div>
            <div class="tutorial-illust__sparkles">✨</div>
          </div>
        `;

      case 'leitner':
      case 'boxes':
        return `
          <div class="tutorial-illust tutorial-illust--leitner">
            <div class="tutorial-illust__flow">
              <div class="tutorial-illust__box tutorial-illust__box--new">🆕</div>
              <div class="tutorial-illust__arrow">→</div>
              <div class="tutorial-illust__box tutorial-illust__box--purple">💜</div>
              <div class="tutorial-illust__arrow">→</div>
              <div class="tutorial-illust__box tutorial-illust__box--orange">🧡</div>
              <div class="tutorial-illust__arrow">→</div>
              <div class="tutorial-illust__box tutorial-illust__box--green">💚</div>
            </div>
          </div>
        `;

      case 'gameplay':
        return `
          <div class="tutorial-illust tutorial-illust--gameplay">
            <div class="tutorial-illust__card">
              <div class="tutorial-illust__question">2 + 2 = ?</div>
              <div class="tutorial-illust__timer">⏱️</div>
            </div>
          </div>
        `;

      case 'xp':
        return `
          <div class="tutorial-illust tutorial-illust--xp">
            <div class="tutorial-illust__xp-badge">
              <span class="tutorial-illust__xp-icon">⭐</span>
              <span class="tutorial-illust__xp-value">+XP</span>
            </div>
            <div class="tutorial-illust__level">${i18n.t('tutorial.levelUp')}</div>
          </div>
        `;

      case 'badges':
        return `
          <div class="tutorial-illust tutorial-illust--badges">
            <div class="tutorial-illust__badge">🏅</div>
            <div class="tutorial-illust__badge">🎖️</div>
            <div class="tutorial-illust__badge">🏆</div>
          </div>
        `;

      case 'navigation':
        return `
          <div class="tutorial-illust tutorial-illust--nav">
            <div class="tutorial-illust__navbar">
              <span>🏠</span>
              <span>🔍</span>
              <span class="tutorial-illust__nav-create">➕</span>
              <span>📊</span>
              <span>⚙️</span>
            </div>
          </div>
        `;

      case 'ready':
        return `
          <div class="tutorial-illust tutorial-illust--ready">
            <div class="tutorial-illust__rocket">🚀</div>
            <div class="tutorial-illust__stars">⭐ ⭐ ⭐</div>
          </div>
        `;

      default:
        return '';
    }
  },

  /**
   * Attache les événements
   * @private
   */
  _bindEvents() {
    // Boutons d'action
    this.overlay.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        switch (action) {
          case 'next':
            this.next();
            break;
          case 'prev':
            this.prev();
            break;
          case 'skip':
          case 'close':
            this.close(this.currentStep === this.steps.length - 1);
            break;
        }
      });
    });

    // Points de progression (navigation directe)
    this.overlay.querySelectorAll('[data-step]').forEach(dot => {
      dot.addEventListener('click', (e) => {
        const stepIndex = parseInt(e.currentTarget.dataset.step);
        this.goToStep(stepIndex);
      });
    });

    // Clic sur l'overlay pour fermer (sauf sur la modal)
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        // On ne ferme pas au clic sur l'overlay pour éviter les fermetures accidentelles
        // this.close(false);
      }
    });
  },

  /**
   * Marque le tutoriel comme complété
   * @private
   */
  _markCompleted() {
    const player = State.get('player');
    if (player) {
      if (!player.settings) {
        player.settings = {};
      }
      player.settings.tutorialCompleted = true;
      State.set('player', player);
      Storage.savePlayer(player);
    }
    // Note: Le nettoyage de l'écouteur clavier est fait dans close()
  }
};

// ═══════════════════════════════════════════════════════════════
// COMPOSANT LEITNER EXPLANATION (standalone)
// ═══════════════════════════════════════════════════════════════

const LeitnerExplanation = {
  /**
   * Rend l'explication visuelle du système Leitner
   * @param {Object} [options] - Options { compact: boolean }
   * @returns {string} HTML
   */
  render(options = {}) {
    const { compact = false } = options;

    if (compact) {
      return `
        <div class="leitner-explanation leitner-explanation--compact">
          <div class="leitner-explanation__flow">
            <span class="leitner-explanation__box leitner-explanation__box--new" title="${escapeHtml(i18n.t('tutorial.explanation.compactNew'))}">🆕</span>
            <span class="leitner-explanation__arrow">→</span>
            <span class="leitner-explanation__box leitner-explanation__box--purple" title="${escapeHtml(i18n.t('tutorial.explanation.compactPurple'))}">💜</span>
            <span class="leitner-explanation__arrow">→</span>
            <span class="leitner-explanation__box leitner-explanation__box--orange" title="${escapeHtml(i18n.t('tutorial.explanation.compactOrange'))}">🧡</span>
            <span class="leitner-explanation__arrow">→</span>
            <span class="leitner-explanation__box leitner-explanation__box--green" title="${escapeHtml(i18n.t('tutorial.explanation.compactGreen'))}">💚</span>
          </div>
        </div>
      `;
    }

    return `
      <div class="leitner-explanation">
        <h3 class="leitner-explanation__title">📦 ${i18n.t('tutorial.explanation.title')}</h3>

        <div class="leitner-explanation__diagram">
          <div class="leitner-explanation__boxes">
            <div class="leitner-explanation__box-card leitner-explanation__box-card--new">
              <div class="leitner-explanation__box-icon">🆕</div>
              <div class="leitner-explanation__box-name">${i18n.t('tutorial.explanation.newName')}</div>
              <div class="leitner-explanation__box-desc">${i18n.t('tutorial.explanation.newDesc')}</div>
            </div>

            <div class="leitner-explanation__arrow-large">→</div>

            <div class="leitner-explanation__box-card leitner-explanation__box-card--purple">
              <div class="leitner-explanation__box-icon">💜</div>
              <div class="leitner-explanation__box-name">${i18n.t('tutorial.explanation.purpleName')}</div>
              <div class="leitner-explanation__box-desc">${i18n.t('tutorial.explanation.purpleDesc')}</div>
            </div>

            <div class="leitner-explanation__arrow-large">→</div>

            <div class="leitner-explanation__box-card leitner-explanation__box-card--orange">
              <div class="leitner-explanation__box-icon">🧡</div>
              <div class="leitner-explanation__box-name">${i18n.t('tutorial.explanation.orangeName')}</div>
              <div class="leitner-explanation__box-desc">${i18n.t('tutorial.explanation.orangeDesc')}</div>
            </div>

            <div class="leitner-explanation__arrow-large">→</div>

            <div class="leitner-explanation__box-card leitner-explanation__box-card--green">
              <div class="leitner-explanation__box-icon">💚</div>
              <div class="leitner-explanation__box-name">${i18n.t('tutorial.explanation.greenName')}</div>
              <div class="leitner-explanation__box-desc">${i18n.t('tutorial.explanation.greenDesc')}</div>
            </div>
          </div>
        </div>

        <div class="leitner-explanation__rules">
          <div class="leitner-explanation__rule">
            <span class="leitner-explanation__rule-icon">✅</span>
            <span class="leitner-explanation__rule-text">${i18n.t('tutorial.explanation.ruleFast')}</span>
          </div>
          <div class="leitner-explanation__rule">
            <span class="leitner-explanation__rule-icon">⏱️</span>
            <span class="leitner-explanation__rule-text">${i18n.t('tutorial.explanation.ruleSlow')}</span>
          </div>
          <div class="leitner-explanation__rule">
            <span class="leitner-explanation__rule-icon">❌</span>
            <span class="leitner-explanation__rule-text">${i18n.t('tutorial.explanation.ruleWrong')}</span>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Monte le composant dans un conteneur
   * @param {HTMLElement} container
   * @param {Object} [options]
   */
  mount(container, options = {}) {
    container.innerHTML = this.render(options);
  }
};

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Tutorial, LeitnerExplanation };
}
