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
  /** Élément qui avait le focus avant l'ouverture (rendu à la fermeture) */
  _returnFocus: null,
  /** Minuteur de l'annonce de la carte courante (une seule annonce après des clics rapides) */
  _announceTimer: null,
  /** Délai avant l'annonce d'une carte (ms) */
  ANNOUNCE_DELAY_MS: 300,
  /** Durée de l'animation de fermeture (ms), alignée sur .tutorial-overlay--closing */
  CLOSE_DURATION_MS: 300,

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
    this._returnFocus = document.activeElement;
    this._createOverlay();
    this._renderStep();

    // Focus sur « Suivant » (le bouton existe déjà : pas de délai)
    const nextButton = this.overlay.querySelector('[data-action="next"]');
    if (nextButton) nextButton.focus({ preventScroll: true });

    // Annoncer pour les lecteurs d'écran (une annonce pour la première carte)
    if (typeof A11y !== 'undefined') {
      A11y.announce(i18n.t('tutorial.started', { total: this.steps.length }));
    }
  },

  /**
   * Passe à l'étape suivante (ferme le tutoriel, terminé, depuis la dernière)
   */
  next() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this._renderStep({ announce: true });
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
      this._renderStep({ announce: true });
    }
  },

  /**
   * Ferme le tutoriel
   * @param {boolean} completed - Si le tutoriel est terminé
   */
  close(completed = false) {
    if (!this.isOpen) return;

    this.isOpen = false;
    clearTimeout(this._announceTimer);
    this._announceTimer = null;

    // Nettoyer l'écouteur de clavier (TOUJOURS, pas seulement quand completed)
    if (this._handleKeydown) {
      document.removeEventListener('keydown', this._handleKeydown);
      this._handleKeydown = null;
    }

    // Animation de sortie : la fenêtre fermée est retirée elle-même, jamais une fenêtre rouverte entre-temps
    const overlay = this.overlay;
    this.overlay = null;
    if (overlay) {
      overlay.classList.add('tutorial-overlay--closing');
      setTimeout(() => overlay.remove(), this.CLOSE_DURATION_MS);
    }

    // Rendre le focus à l'élément qui l'avait avant l'ouverture
    const returnFocus = this._returnFocus;
    this._returnFocus = null;
    if (returnFocus && returnFocus !== document.body && returnFocus.isConnected && typeof returnFocus.focus === 'function') {
      returnFocus.focus({ preventScroll: true });
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
      const changed = stepIndex !== this.currentStep;
      this.currentStep = stepIndex;
      this._renderStep({ announce: changed });
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // MÉTHODES PRIVÉES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Crée l'overlay du tutoriel et sa fenêtre (une seule fois par ouverture)
   * @private
   */
  _createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'tutorial-overlay';
    this.overlay.setAttribute('role', 'dialog');
    this.overlay.setAttribute('aria-modal', 'true');
    this.overlay.setAttribute('aria-labelledby', 'tutorial-title-0');

    // Échap ferme, les flèches changent de carte, Tab reste dans la fenêtre.
    // Entrée n'est pas interceptée : elle active le bouton qui a le focus (Suivant à l'ouverture).
    this._handleKeydown = (e) => {
      if (!this.isOpen || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        this.close(false);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        // Les flèches parcourent les cartes ; seul le bouton de la dernière carte termine le tutoriel
        if (this.currentStep < this.steps.length - 1) this.next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this.prev();
      } else if (e.key === 'Tab') {
        this._trapFocus(e);
      }
    };
    document.addEventListener('keydown', this._handleKeydown);

    this._buildShell();
    document.body.appendChild(this.overlay);
  },

  /**
   * Construit la fenêtre : toutes les cartes sont empilées dans la même cellule de grille,
   * la fenêtre prend donc la hauteur de la plus haute et ne change pas de taille d'une carte à l'autre.
   * Les étapes suivantes ne font que changer des classes et des attributs (aucun nœud remplacé).
   * @private
   */
  _buildShell() {
    const _t = PageUtils.getTranslator();
    const total = this.steps.length;

    this.overlay.innerHTML = `
      <div class="tutorial-modal">
        <button type="button" class="tutorial-modal__close" aria-label="${escapeHtml(_t('tutorial.closeLabel'))}" data-action="close">
          <span aria-hidden="true">×</span>
        </button>

        <div class="tutorial-modal__body">
          <div class="tutorial-modal__steps">
            ${this.steps.map((step, i) => `
              <section class="tutorial-modal__step" data-step-panel="${i}">
                <div class="tutorial-modal__header">
                  <div class="tutorial-modal__emoji" aria-hidden="true">${step.emoji}</div>
                  <h2 class="tutorial-modal__title" id="tutorial-title-${i}">${step.title}</h2>
                </div>
                <div class="tutorial-modal__illustration" aria-hidden="true">
                  ${this._renderIllustration(step.illustration)}
                </div>
                <div class="tutorial-modal__content">
                  ${step.content}
                </div>
              </section>
            `).join('')}
          </div>
        </div>

        <div class="tutorial-modal__progress">
          ${this.steps.map((_, i) => `
            <button type="button" class="tutorial-modal__dot" data-step="${i}"
              aria-label="${escapeHtml(_t('tutorial.stepLabel', { n: i + 1 }))}"></button>
          `).join('')}
        </div>

        <div class="tutorial-modal__footer">
          <button type="button" class="tutorial-modal__btn tutorial-modal__btn--secondary" data-action="skip"></button>

          <div class="tutorial-modal__nav">
            <button type="button" class="tutorial-modal__btn tutorial-modal__btn--nav" data-action="prev" aria-label="${escapeHtml(_t('tutorial.prevLabel'))}">
              ${escapeHtml(_t('tutorial.prev'))}
            </button>
            <button type="button" class="tutorial-modal__btn tutorial-modal__btn--primary" data-action="next"></button>
          </div>
        </div>

        <div class="tutorial-modal__step-counter" aria-hidden="true">1 / ${total}</div>
      </div>
    `;

    this._bindEvents();
  },

  /**
   * Affiche l'étape courante dans la fenêtre existante (classes, attributs, libellés)
   * @param {{announce?: boolean}} [options] - announce : annoncer la carte aux lecteurs d'écran
   * @private
   */
  _renderStep(options = {}) {
    if (!this.overlay) return;
    if (!this.overlay.querySelector('.tutorial-modal')) this._buildShell();

    const _t = PageUtils.getTranslator();
    const index = this.currentStep;
    const total = this.steps.length;
    const isFirst = index === 0;
    const isLast = index === total - 1;
    const overlay = this.overlay;

    overlay.querySelectorAll('[data-step-panel]').forEach((panel) => {
      const active = Number(panel.dataset.stepPanel) === index;
      panel.classList.toggle('tutorial-modal__step--active', active);
      panel.toggleAttribute('inert', !active);
      if (active) panel.removeAttribute('aria-hidden');
      else panel.setAttribute('aria-hidden', 'true');
    });
    overlay.setAttribute('aria-labelledby', `tutorial-title-${index}`);

    // Nouvelle carte : le texte repart du haut
    const body = overlay.querySelector('.tutorial-modal__body');
    if (body) body.scrollTop = 0;

    overlay.querySelectorAll('[data-step]').forEach((dot) => {
      const i = Number(dot.dataset.step);
      dot.classList.toggle('tutorial-modal__dot--active', i === index);
      dot.classList.toggle('tutorial-modal__dot--completed', i < index);
      if (i === index) dot.setAttribute('aria-current', 'step');
      else dot.removeAttribute('aria-current');
    });

    const prev = overlay.querySelector('[data-action="prev"]');
    const next = overlay.querySelector('[data-action="next"]');
    const skip = overlay.querySelector('[data-action="skip"]');

    if (prev) {
      // Sur la première carte, le bouton garde sa place (invisible) : Suivant ne bouge pas
      const prevHadFocus = document.activeElement === prev;
      prev.disabled = isFirst;
      prev.classList.toggle('tutorial-modal__btn--placeholder', isFirst);
      if (isFirst) prev.setAttribute('aria-hidden', 'true');
      else prev.removeAttribute('aria-hidden');
      if (isFirst && prevHadFocus && next) next.focus({ preventScroll: true });
    }
    if (next) next.textContent = isLast ? _t('tutorial.start') : _t('tutorial.next');
    if (skip) skip.textContent = isLast ? _t('tutorial.close') : _t('tutorial.skip');

    const counter = overlay.querySelector('.tutorial-modal__step-counter');
    if (counter) counter.textContent = `${index + 1} / ${total}`;

    if (options.announce) this._scheduleAnnounce();
  },

  /**
   * Annonce la carte courante après un court délai : des clics rapides ne produisent qu'une annonce
   * @private
   */
  _scheduleAnnounce() {
    clearTimeout(this._announceTimer);
    this._announceTimer = setTimeout(() => {
      this._announceTimer = null;
      if (!this.isOpen || typeof A11y === 'undefined') return;
      const step = this.steps[this.currentStep];
      // Le titre peut contenir du balisage de traduction : on n'en garde que le texte
      const holder = document.createElement('div');
      holder.innerHTML = step.title;
      A11y.announce(i18n.t('tutorial.stepAnnounce', {
        n: this.currentStep + 1,
        total: this.steps.length,
        title: holder.textContent.trim()
      }));
    }, this.ANNOUNCE_DELAY_MS);
  },

  /**
   * Garde le focus dans la fenêtre (Tab sur le dernier bouton revient au premier, et inversement)
   * @param {KeyboardEvent} e
   * @private
   */
  _trapFocus(e) {
    if (!this.overlay) return;
    const focusables = [...this.overlay.querySelectorAll('button')]
      .filter(el => !el.disabled && !el.closest('[inert]') && el.getAttribute('aria-hidden') !== 'true');
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    const inside = this.overlay.contains(active);
    if (e.shiftKey && (active === first || !inside)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !inside)) {
      e.preventDefault();
      first.focus();
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

    // Le clic sur le fond ne ferme pas la fenêtre (évite les fermetures accidentelles)
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
