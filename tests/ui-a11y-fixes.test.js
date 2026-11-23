/**
 * Correctifs d'accessibilité de l'interface : annonces traduites, durée des messages éphémères,
 * équivalents textuels (répartition des boîtes), noms de badges lisibles.
 */

describe('A11y - annonces traduites', () => {
  afterEach(() => i18n.setLocale('fr'));

  it('should announce keyboard navigation in the interface language', () => {
    i18n.setLocale('fr');
    expect(A11y._tr('a11y.navHome', 'x')).toBe("Navigation vers l'accueil");
    i18n.setLocale('en');
    expect(A11y._tr('a11y.navHome', 'x')).toBe('Navigating to home');
    expect(A11y._tr('a11y.navSettings', 'x')).toBe('Navigating to settings');
    expect(A11y._tr('a11y.dialogClosed', 'x')).toBe('Dialog closed');
  });

  it('should fall back to the given text for an unknown key', () => {
    expect(A11y._tr('a11y.doesNotExist', 'repli')).toBe('repli');
  });
});

describe('A11y - durée des messages éphémères', () => {
  let realSetTimeout;
  let delays;

  beforeEach(() => {
    A11y.init();
    delays = [];
    realSetTimeout = window.setTimeout;
    window.setTimeout = (fn, ms) => { delays.push(ms); return realSetTimeout(fn, 0); };
  });

  afterEach(() => { window.setTimeout = realSetTimeout; });

  it('should keep a visual message at least 6 seconds by default', () => {
    expect(A11y.MIN_TOAST_MS).toBeGreaterThanOrEqual(6000);
    A11y._createToast();
    A11y.announce('Message', { visual: true });
    expect(delays).toContain(A11y.MIN_TOAST_MS);
  });

  it('should not honour a shorter requested duration', () => {
    A11y._createToast();
    A11y.announce('Message', { visual: true, duration: 1000 });
    expect(delays).not.toContain(1000);
    expect(Math.max(...delays)).toBeGreaterThanOrEqual(6000);
  });
});

describe('Stats - répartition des boîtes en texte', () => {
  afterEach(() => i18n.setLocale('fr'));

  function render() {
    const html = Pages.stats._renderDeckStats({
      deck: { id: 'd1', name: 'Deck' },
      stats: { progress: 50, accuracy: 80, avgResponseTimeSec: 2, cardsPlayed: 5, totalCards: 10,
        distribution: { green: 3, orange: 2, purple: 1, never_played: 4 } }
    });
    const root = document.createElement('div');
    root.innerHTML = html;
    return root;
  }

  it('should give the distribution bar a text equivalent with the counts', () => {
    const bar = render().querySelector('.stats__deck-distribution');
    expect(bar.getAttribute('role')).toBe('img');
    const label = bar.getAttribute('aria-label');
    expect(label).toContain('3');
    expect(label).toContain('4');
    expect(label).toContain('Verte');
    expect(label).toContain('Non jouée');
  });
});
