/**
 * A11y - Module d'accessibilité
 *
 * Gère les fonctionnalités d'accessibilité :
 * - Skip links pour navigation clavier
 * - Live regions pour annonces screen reader
 * - Gestion du focus
 * - Gestes swipe sur mobile
 */

const A11y = {
  _liveRegion: null,
  _toastElement: null,
  _toastTimeout: null,
  _swipeStartX: 0,
  _swipeStartY: 0,
  _swipeCallbacks: new Map(),

  /**
   * Initialise les éléments d'accessibilité
   */
  init() {
    this._createSkipLinks();
    this._createLiveRegion();
    this._createToast();
    this._setupKeyboardShortcuts();
  },

  /**
   * Crée les skip links pour navigation clavier
   */
  _createSkipLinks() {
    // Ne pas dupliquer si déjà présents
    if (document.querySelector('.skip-links')) return;

    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links';
    // Utiliser i18n si disponible, sinon fallback FR
    const skipToContent = this._tr('a11y.skipToContent', 'Aller au contenu principal');
    const skipToNav = this._tr('a11y.skipToNav', 'Aller à la navigation');
    skipLinks.innerHTML = `
      <a href="#main-content" class="skip-link">${skipToContent}</a>
      <a href="#main-nav" class="skip-link">${skipToNav}</a>
    `;

    document.body.insertBefore(skipLinks, document.body.firstChild);
  },

  /**
   * Crée la live region pour les annonces
   */
  _createLiveRegion() {
    if (this._liveRegion) return;

    this._liveRegion = document.createElement('div');
    this._liveRegion.className = 'live-region';
    this._liveRegion.setAttribute('aria-live', 'polite');
    this._liveRegion.setAttribute('aria-atomic', 'true');
    this._liveRegion.setAttribute('role', 'status');
    this._liveRegion.id = 'a11y-announcer';

    document.body.appendChild(this._liveRegion);
  },

  /** Durée minimale d'affichage d'un message éphémère (WCAG 2.2.1 : le temps de lire) */
  MIN_TOAST_MS: 6000,

  /**
   * Traduit une clé (langue de l'interface), avec repli français si i18n n'est pas chargé
   * @private
   */
  _tr(key, fallback) {
    if (typeof i18n !== 'undefined' && typeof i18n.t === 'function') {
      const text = i18n.t(key);
      if (text && text !== key) return text;
    }
    return fallback;
  },

  /**
   * Crée le toast pour annonces visuelles
   */
  _createToast() {
    if (this._toastElement) return;

    this._toastElement = document.createElement('div');
    this._toastElement.className = 'announce-toast';
    this._toastElement.setAttribute('role', 'alert');
    this._toastElement.setAttribute('aria-live', 'assertive');

    document.body.appendChild(this._toastElement);
  },

  /**
   * Annonce un message pour les lecteurs d'écran
   * @param {string} message - Message à annoncer
   * @param {Object} options - Options
   * @param {boolean} options.visual - Afficher aussi visuellement
   * @param {string} options.type - Type: 'info', 'success', 'error'
   * @param {number} options.duration - Durée d'affichage en ms (au moins MIN_TOAST_MS, soit 6 s)
   */
  announce(message, options = {}) {
    const { visual = false, type = 'info', duration = this.MIN_TOAST_MS } = options;

    // Annonce pour screen readers
    if (this._liveRegion) {
      // Vider puis remplir pour forcer l'annonce
      this._liveRegion.textContent = '';
      setTimeout(() => {
        this._liveRegion.textContent = message;
      }, 50);
    }

    // Annonce visuelle si demandée
    if (visual && this._toastElement) {
      this._showToast(message, type, Math.max(duration, this.MIN_TOAST_MS));
    }
  },

  /**
   * Affiche le toast visuel
   */
  _showToast(message, type, duration) {
    if (this._toastTimeout) {
      clearTimeout(this._toastTimeout);
    }

    this._toastElement.textContent = message;
    this._toastElement.className = `announce-toast announce-toast--${type}`;

    // Forcer le reflow
    void this._toastElement.offsetWidth;

    this._toastElement.classList.add('announce-toast--visible');

    this._toastTimeout = setTimeout(() => {
      this._toastElement.classList.remove('announce-toast--visible');
    }, duration);
  },

  /**
   * Configure les raccourcis clavier globaux
   */
  _setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Alt + H = Accueil
      if (e.altKey && e.key === 'h') {
        e.preventDefault();
        if (typeof Router !== 'undefined') {
          Router.navigate('/home');
          this.announce(this._tr('a11y.navHome', 'Navigation vers accueil'));
        }
      }

      // Alt + S = Paramètres
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        if (typeof Router !== 'undefined') {
          Router.navigate('/settings');
          this.announce(this._tr('a11y.navSettings', 'Navigation vers paramètres'));
        }
      }

      // Escape = Fermer modals ou retour
      if (e.key === 'Escape') {
        const modal = document.querySelector('.modal--active, [role="dialog"][open]');
        if (modal) {
          e.preventDefault();
          modal.close?.() || modal.classList.remove('modal--active');
          this.announce(this._tr('a11y.dialogClosed', 'Fenêtre fermée'));
        }
      }
    });
  },

  /**
   * Active le support des gestes swipe sur un élément
   * @param {Element} element - Élément à rendre swipeable
   * @param {Object} callbacks - Callbacks pour les directions
   */
  enableSwipe(element, callbacks = {}) {
    const { onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50 } = callbacks;

    const id = element.id || `swipe-${Date.now()}`;
    element.id = id;

    const handleTouchStart = (e) => {
      this._swipeStartX = e.touches[0].clientX;
      this._swipeStartY = e.touches[0].clientY;
      element.classList.add('swipe-card--swiping');
    };

    const handleTouchMove = (e) => {
      if (!this._swipeStartX) return;

      const diffX = e.touches[0].clientX - this._swipeStartX;
      const diffY = e.touches[0].clientY - this._swipeStartY;

      // Feedback visuel pendant le swipe
      if (Math.abs(diffX) > Math.abs(diffY)) {
        element.style.transform = `translateX(${diffX * 0.5}px)`;
      }
    };

    const handleTouchEnd = (e) => {
      element.classList.remove('swipe-card--swiping');
      element.style.transform = '';

      const diffX = e.changedTouches[0].clientX - this._swipeStartX;
      const diffY = e.changedTouches[0].clientY - this._swipeStartY;

      // Détecter la direction principale
      if (Math.abs(diffX) > Math.abs(diffY)) {
        // Horizontal
        if (diffX > threshold && onSwipeRight) {
          onSwipeRight();
        } else if (diffX < -threshold && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        // Vertical
        if (diffY > threshold && onSwipeDown) {
          onSwipeDown();
        } else if (diffY < -threshold && onSwipeUp) {
          onSwipeUp();
        }
      }

      this._swipeStartX = 0;
      this._swipeStartY = 0;
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd);

    // Stocker pour cleanup
    this._swipeCallbacks.set(id, { handleTouchStart, handleTouchMove, handleTouchEnd });

    element.classList.add('swipe-container');
  },

  // ═══════════════════════════════════════════════════════════════
  // NAVIGATION FLÉCHÉE (ROVING TABINDEX)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Active la navigation par flèches dans un conteneur
   * Utilise le pattern roving tabindex pour l'accessibilité
   *
   * @param {Element} container - Conteneur avec les éléments navigables
   * @param {Object} options - Options de configuration
   * @param {string} options.itemSelector - Sélecteur des éléments navigables
   * @param {string} options.direction - 'horizontal', 'vertical', ou 'both'
   * @param {boolean} options.loop - Boucler au début/fin (défaut: true)
   * @param {boolean} options.activateOnFocus - Activer l'élément au focus (défaut: false)
   * @param {Function} options.onNavigate - Callback appelé lors de la navigation
   */
  enableArrowNav(container, options = {}) {
    const {
      itemSelector = '[role="menuitem"], .nav-item, a, button',
      direction = 'horizontal',
      loop = true,
      activateOnFocus = false,
      onNavigate = null
    } = options;

    const getItems = () => Array.from(container.querySelectorAll(itemSelector))
      .filter(el => !el.disabled && el.offsetParent !== null);

    const getCurrentIndex = (items) => {
      const focused = document.activeElement;
      return items.indexOf(focused);
    };

    const focusItem = (items, index) => {
      if (index < 0 || index >= items.length) return;

      // Roving tabindex: -1 sur tous sauf l'élément actif
      items.forEach((item, i) => {
        item.setAttribute('tabindex', i === index ? '0' : '-1');
      });

      items[index].focus();

      if (activateOnFocus && items[index].click) {
        items[index].click();
      }

      if (onNavigate) {
        onNavigate(items[index], index);
      }

      // Annonce pour screen readers
      const label = items[index].getAttribute('aria-label') ||
                    items[index].textContent?.trim() ||
                    `Élément ${index + 1}`;
      this.announce(label);
    };

    const handleKeyDown = (e) => {
      const items = getItems();
      if (items.length === 0) return;

      let currentIndex = getCurrentIndex(items);
      if (currentIndex === -1) currentIndex = 0;

      let newIndex = currentIndex;
      let handled = false;

      // Navigation horizontale
      if (direction === 'horizontal' || direction === 'both') {
        if (e.key === 'ArrowRight') {
          newIndex = loop
            ? (currentIndex + 1) % items.length
            : Math.min(currentIndex + 1, items.length - 1);
          handled = true;
        } else if (e.key === 'ArrowLeft') {
          newIndex = loop
            ? (currentIndex - 1 + items.length) % items.length
            : Math.max(currentIndex - 1, 0);
          handled = true;
        }
      }

      // Navigation verticale
      if (direction === 'vertical' || direction === 'both') {
        if (e.key === 'ArrowDown') {
          newIndex = loop
            ? (currentIndex + 1) % items.length
            : Math.min(currentIndex + 1, items.length - 1);
          handled = true;
        } else if (e.key === 'ArrowUp') {
          newIndex = loop
            ? (currentIndex - 1 + items.length) % items.length
            : Math.max(currentIndex - 1, 0);
          handled = true;
        }
      }

      // Home et End
      if (e.key === 'Home') {
        newIndex = 0;
        handled = true;
      } else if (e.key === 'End') {
        newIndex = items.length - 1;
        handled = true;
      }

      if (handled) {
        e.preventDefault();
        focusItem(items, newIndex);
      }
    };

    // Initialiser le tabindex sur le premier élément
    const items = getItems();
    if (items.length > 0) {
      items.forEach((item, i) => {
        item.setAttribute('tabindex', i === 0 ? '0' : '-1');
      });
    }

    container.addEventListener('keydown', handleKeyDown);

    // Retourner une fonction de cleanup
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  },

  /**
   * Active la navigation fléchée sur la navbar
   */
  setupNavbarArrowNav() {
    const navbar = document.querySelector('.navbar, [role="navigation"]');
    if (!navbar) return;

    return this.enableArrowNav(navbar, {
      itemSelector: '.navbar__item, [role="menuitem"]',
      direction: 'horizontal',
      loop: true,
      onNavigate: (item) => {
        // Highlight visuel optionnel
        item.classList.add('nav-focused');
        setTimeout(() => item.classList.remove('nav-focused'), 200);
      }
    });
  },

  /**
   * Active la navigation fléchée sur un menu dropdown
   * @param {Element} menu - Élément menu
   */
  setupMenuArrowNav(menu) {
    if (!menu) return;

    return this.enableArrowNav(menu, {
      itemSelector: '[role="menuitem"], .menu-item, button, a',
      direction: 'vertical',
      loop: true
    });
  }
};

// Export pour tests et navigateur
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { A11y };
}
