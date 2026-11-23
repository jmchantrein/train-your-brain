/**
 * Tests pour le module A11y (Accessibilite)
 */

// ═══════════════════════════════════════════════════════════════
// TESTS STRUCTURE DU MODULE
// ═══════════════════════════════════════════════════════════════

describe('A11y - Structure du module', () => {
  it('should have A11y object defined', () => {
    expect(typeof A11y).toBe('object');
  });

  it('should have init method', () => {
    expect(typeof A11y.init).toBe('function');
  });

  it('should have announce method', () => {
    expect(typeof A11y.announce).toBe('function');
  });

  it('should have enableSwipe method', () => {
    expect(typeof A11y.enableSwipe).toBe('function');
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS PROPRIETES INTERNES
// ═══════════════════════════════════════════════════════════════

describe('A11y - Internal properties', () => {
  it('should have _liveRegion property', () => {
    expect(A11y.hasOwnProperty('_liveRegion')).toBe(true);
  });

  it('should have _toastElement property', () => {
    expect(A11y.hasOwnProperty('_toastElement')).toBe(true);
  });

  it('should have _swipeCallbacks Map', () => {
    expect(A11y._swipeCallbacks instanceof Map).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS METHODES PRIVEES
// ═══════════════════════════════════════════════════════════════

describe('A11y - Private methods', () => {
  it('should have _createSkipLinks method', () => {
    expect(typeof A11y._createSkipLinks).toBe('function');
  });

  it('should have _createLiveRegion method', () => {
    expect(typeof A11y._createLiveRegion).toBe('function');
  });

  it('should have _createToast method', () => {
    expect(typeof A11y._createToast).toBe('function');
  });

  it('should have _setupKeyboardShortcuts method', () => {
    expect(typeof A11y._setupKeyboardShortcuts).toBe('function');
  });

  it('should have _showToast method', () => {
    expect(typeof A11y._showToast).toBe('function');
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS init()
// ═══════════════════════════════════════════════════════════════

describe('A11y - init()', () => {
  beforeEach(() => {
    // Clean up any existing elements
    const skipLinks = document.querySelector('.skip-links');
    if (skipLinks) skipLinks.remove();

    const liveRegion = document.getElementById('a11y-announcer');
    if (liveRegion) liveRegion.remove();

    const toast = document.querySelector('.announce-toast');
    if (toast) toast.remove();

    // Reset internal state
    A11y._liveRegion = null;
    A11y._toastElement = null;
  });

  it('should not throw when called', () => {
    expect(() => A11y.init()).not.toThrow();
  });

  it('should create skip links', () => {
    A11y.init();
    const skipLinks = document.querySelector('.skip-links');
    expect(skipLinks).not.toBeNull();
  });

  it('should create skip link to main content', () => {
    A11y.init();
    const mainLink = document.querySelector('.skip-link[href="#main-content"]');
    expect(mainLink).not.toBeNull();
  });

  it('should create skip link to navigation', () => {
    A11y.init();
    const navLink = document.querySelector('.skip-link[href="#main-nav"]');
    expect(navLink).not.toBeNull();
  });

  it('should create live region', () => {
    A11y.init();
    const liveRegion = document.getElementById('a11y-announcer');
    expect(liveRegion).not.toBeNull();
  });

  it('should set aria-live on live region', () => {
    A11y.init();
    const liveRegion = document.getElementById('a11y-announcer');
    expect(liveRegion.getAttribute('aria-live')).toBe('polite');
  });

  it('should set aria-atomic on live region', () => {
    A11y.init();
    const liveRegion = document.getElementById('a11y-announcer');
    expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
  });

  it('should set role on live region', () => {
    A11y.init();
    const liveRegion = document.getElementById('a11y-announcer');
    expect(liveRegion.getAttribute('role')).toBe('status');
  });

  it('should create toast element', () => {
    A11y.init();
    const toast = document.querySelector('.announce-toast');
    expect(toast).not.toBeNull();
  });

  it('should set role alert on toast', () => {
    A11y.init();
    const toast = document.querySelector('.announce-toast');
    expect(toast.getAttribute('role')).toBe('alert');
  });

  it('should not duplicate skip links on multiple calls', () => {
    A11y.init();
    A11y.init();
    const skipLinks = document.querySelectorAll('.skip-links');
    expect(skipLinks.length).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS announce()
// ═══════════════════════════════════════════════════════════════

describe('A11y - announce()', () => {
  beforeEach(() => {
    // Nettoyer le DOM laissé par les tests précédents (sinon querySelector
    // renvoie un ancien toast, pas celui créé par init() ci-dessous)
    document.querySelectorAll('.announce-toast, #a11y-announcer, .skip-links').forEach(el => el.remove());
    // Reset and init
    A11y._liveRegion = null;
    A11y._toastElement = null;
    A11y.init();
  });

  it('should update live region text', (done) => {
    A11y.announce('Test announcement');

    // Wait for the async update
    setTimeout(() => {
      const liveRegion = document.getElementById('a11y-announcer');
      expect(liveRegion.textContent).toBe('Test announcement');
      done();
    }, 100);
  });

  it('should not show toast by default', () => {
    A11y.announce('Silent message');
    const toast = document.querySelector('.announce-toast');
    expect(toast.classList.contains('announce-toast--visible')).toBe(false);
  });

  it('should show toast when visual option is true', (done) => {
    A11y.announce('Visual message', { visual: true });

    setTimeout(() => {
      const toast = document.querySelector('.announce-toast');
      expect(toast.classList.contains('announce-toast--visible')).toBe(true);
      done();
    }, 50);
  });

  it('should set toast text when visual', () => {
    A11y.announce('Toast text', { visual: true });
    const toast = document.querySelector('.announce-toast');
    expect(toast.textContent).toBe('Toast text');
  });

  it('should apply type class to toast', () => {
    A11y.announce('Success!', { visual: true, type: 'success' });
    const toast = document.querySelector('.announce-toast');
    expect(toast.classList.contains('announce-toast--success')).toBe(true);
  });

  it('should apply error type class', () => {
    A11y.announce('Error!', { visual: true, type: 'error' });
    const toast = document.querySelector('.announce-toast');
    expect(toast.classList.contains('announce-toast--error')).toBe(true);
  });

  it('should keep the toast visible until the minimum duration, then hide it', () => {
    // Minuteurs remplacés : on capture le masquage planifié au lieu d'attendre 6 s réelles
    // (la durée transmise à setTimeout est vérifiée dans ui-a11y-fixes.test.js)
    const realSetTimeout = window.setTimeout;
    const scheduled = [];
    window.setTimeout = (fn, ms) => { scheduled.push({ fn, ms }); return scheduled.length; };
    try {
      A11y.announce('Quick message', { visual: true, duration: 100 });
    } finally {
      window.setTimeout = realSetTimeout;
    }
    const toast = document.querySelector('.announce-toast');
    const hide = scheduled.find(entry => entry.ms === A11y.MIN_TOAST_MS);

    // Une durée demandée de 100 ms est portée au minimum : le message est encore affiché
    expect(hide).toBeTruthy();
    expect(toast.classList.contains('announce-toast--visible')).toBe(true);

    // Le minuteur de masquage arrivé à échéance : le message disparaît
    hide.fn();
    expect(toast.classList.contains('announce-toast--visible')).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS enableSwipe()
// ═══════════════════════════════════════════════════════════════

describe('A11y - Swipe support', () => {
  let swipeElement;

  beforeEach(() => {
    swipeElement = document.createElement('div');
    swipeElement.id = 'swipe-test';
    document.body.appendChild(swipeElement);
  });

  afterEach(() => {
    A11y._swipeCallbacks.delete(swipeElement.id);
    swipeElement.classList.remove('swipe-container');
    if (swipeElement && swipeElement.parentNode) {
      swipeElement.parentNode.removeChild(swipeElement);
    }
  });

  it('should add swipe-container class when enabled', () => {
    A11y.enableSwipe(swipeElement, {});
    expect(swipeElement.classList.contains('swipe-container')).toBe(true);
  });

  it('should store callbacks in Map', () => {
    A11y.enableSwipe(swipeElement, { onSwipeLeft: () => {} });
    expect(A11y._swipeCallbacks.has('swipe-test')).toBe(true);
  });
});
