/**
 * Tests de la langue du joueur (i18n)
 *
 * Règles : choix du joueur (player.settings.language = 'fr' | 'en') ;
 * 'auto' ou absence de choix -> langue du navigateur ; langue non prise en charge -> français.
 */

function setBrowserLanguages(language, languages) {
  Object.defineProperty(navigator, 'language', { value: language, configurable: true });
  Object.defineProperty(navigator, 'languages', { value: languages || [language], configurable: true });
}

function restoreBrowser() {
  setBrowserLanguages('fr-FR', ['fr-FR', 'fr']);
}

function makePlayer(language) {
  const settings = { soundEnabled: true, theme: 'dark' };
  if (language !== undefined) settings.language = language;
  return { id: 'p_lang', name: 'Lang', settings, stats: {} };
}

describe('i18n - detectBrowserLocale()', () => {
  afterEach(() => restoreBrowser());

  it('returns en for an English browser', () => {
    setBrowserLanguages('en-US');
    expect(i18n.detectBrowserLocale()).toBe('en');
  });

  it('returns fr for a French browser', () => {
    setBrowserLanguages('fr-CA');
    expect(i18n.detectBrowserLocale()).toBe('fr');
  });

  it('falls back to fr for an unsupported language', () => {
    setBrowserLanguages('de-DE');
    expect(i18n.detectBrowserLocale()).toBe('fr');
  });

  it('uses the first supported language of navigator.languages', () => {
    setBrowserLanguages('de-DE', ['de-DE', 'en-GB']);
    expect(i18n.detectBrowserLocale()).toBe('en');
  });
});

describe('i18n - resolveLocale()', () => {
  afterEach(() => restoreBrowser());

  it('keeps an explicit supported choice', () => {
    setBrowserLanguages('en-US');
    expect(i18n.resolveLocale('fr')).toBe('fr');
    setBrowserLanguages('fr-FR');
    expect(i18n.resolveLocale('en')).toBe('en');
  });

  it('uses the browser language for auto / undefined / null', () => {
    setBrowserLanguages('en-US');
    expect(i18n.resolveLocale('auto')).toBe('en');
    expect(i18n.resolveLocale(undefined)).toBe('en');
    expect(i18n.resolveLocale(null)).toBe('en');
  });

  it('uses the browser language when the choice is unsupported', () => {
    setBrowserLanguages('en-US');
    expect(i18n.resolveLocale('xx')).toBe('en');
  });

  it('falls back to fr when nothing is supported', () => {
    setBrowserLanguages('ja-JP');
    expect(i18n.resolveLocale('auto')).toBe('fr');
  });
});

describe('i18n - applyPlayerLanguage()', () => {
  beforeEach(() => {
    localStorage.removeItem('tyb_locale');
    i18n._locale = 'fr';
    document.documentElement.removeAttribute('lang');
  });
  afterEach(() => { restoreBrowser(); i18n._locale = 'fr'; localStorage.removeItem('tyb_locale'); });

  it('applies the player choice over the browser language', () => {
    setBrowserLanguages('en-US');
    expect(i18n.applyPlayerLanguage(makePlayer('fr'))).toBe('fr');
    expect(i18n.getLocale()).toBe('fr');
    expect(t('nav.home')).toBe('Accueil');
  });

  it('applies an English choice in a French browser', () => {
    setBrowserLanguages('fr-FR');
    i18n.applyPlayerLanguage(makePlayer('en'));
    expect(i18n.getLocale()).toBe('en');
    expect(t('nav.home')).toBe('Home');
  });

  it('uses the browser language when the player has no choice', () => {
    setBrowserLanguages('en-US');
    i18n.applyPlayerLanguage(makePlayer(undefined));
    expect(i18n.getLocale()).toBe('en');
  });

  it('uses the browser language for auto', () => {
    setBrowserLanguages('en-GB');
    i18n.applyPlayerLanguage(makePlayer('auto'));
    expect(i18n.getLocale()).toBe('en');
  });

  it('falls back to fr for an unsupported browser with no choice', () => {
    setBrowserLanguages('es-ES');
    i18n.applyPlayerLanguage(makePlayer(undefined));
    expect(i18n.getLocale()).toBe('fr');
  });

  it('handles a missing player like no choice', () => {
    setBrowserLanguages('en-US');
    expect(i18n.applyPlayerLanguage(null)).toBe('en');
  });

  it('follows the player when switching from one player to another', () => {
    setBrowserLanguages('fr-FR');
    i18n.applyPlayerLanguage(makePlayer('en'));
    expect(i18n.getLocale()).toBe('en');
    i18n.applyPlayerLanguage(makePlayer('auto'));
    expect(i18n.getLocale()).toBe('fr');
  });

  it('does not leave a stale stored locale for an auto player', () => {
    setBrowserLanguages('en-US');
    localStorage.setItem('tyb_locale', 'fr');
    i18n.applyPlayerLanguage(makePlayer('auto'));
    expect(localStorage.getItem('tyb_locale')).toBeNull();
  });

  it('remembers an explicit choice for the profile screen', () => {
    i18n.applyPlayerLanguage(makePlayer('en'));
    expect(localStorage.getItem('tyb_locale')).toBe('en');
  });
});

describe('i18n - document language and listeners', () => {
  afterEach(() => { restoreBrowser(); i18n._locale = 'fr'; localStorage.removeItem('tyb_locale'); });

  it('setLocale updates document.documentElement.lang', () => {
    i18n.setLocale('en');
    expect(document.documentElement.lang).toBe('en');
    i18n.setLocale('fr');
    expect(document.documentElement.lang).toBe('fr');
  });

  it('applyPlayerLanguage updates document.documentElement.lang', () => {
    i18n.applyPlayerLanguage(makePlayer('en'));
    expect(document.documentElement.lang).toBe('en');
  });

  it('init updates document.documentElement.lang', () => {
    setBrowserLanguages('en-US');
    localStorage.removeItem('tyb_locale');
    i18n.init();
    expect(document.documentElement.lang).toBe('en');
  });

  it('notifies listeners only when the locale actually changes', () => {
    i18n._locale = 'fr';
    let calls = 0;
    const off = i18n.onLocaleChange(() => { calls++; });
    i18n.setLocale('fr');
    expect(calls).toBe(0);
    i18n.setLocale('en');
    expect(calls).toBe(1);
    off();
    i18n.setLocale('fr');
    expect(calls).toBe(1);
  });

  it('formatDate uses the active locale', () => {
    const d = new Date(2025, 0, 31, 12);
    i18n.setLocale('fr');
    expect(i18n.formatDate(d)).toContain('31/01/2025');
    i18n.setLocale('en');
    expect(i18n.formatDate(d)).toContain('1/31/2025');
  });

  it('formatNumber uses the active locale', () => {
    i18n.setLocale('en');
    expect(i18n.formatNumber(1234.5)).toBe('1,234.5');
    i18n.setLocale('fr');
    expect(i18n.formatNumber(1234.5).replace(/\s/g, ' ')).toBe('1 234,5');
  });

  it('t() does not interpret $ patterns in parameters', () => {
    i18n._translations.fr['__test.param'] = 'Salut {name}';
    expect(i18n.t('__test.param', { name: '$&$1' })).toBe('Salut $&$1');
    delete i18n._translations.fr['__test.param'];
  });
});

describe('i18n - key parity and usage', () => {
  // Le runner exécute les tests dans une fenêtre jsdom sans accès au système de fichiers :
  // on parcourt le code source des fonctions des objets d'interface chargés
  // (Function.prototype.toString), ce qui couvre les gabarits HTML et les alert/confirm/announce.
  const UI_ROOTS = ['Pages', 'Components', 'PageUtils', 'App', 'FloatingToolbar', 'BadgesSidebar',
    'Tutorial', 'Effects', 'Charts', 'ComponentDeckCard', 'ComponentTagSelector',
    'DeckTable', 'DeckEditorCardBinder', 'DeckEditorCardRenderer', 'DeckEditorSyncController',
    'GameAnswerExtractor', 'GameAnswerValidator', 'GameCardTypeRenderer', 'GameSecretStats',
    'GameSessionManager', 'GameSessionTracker', 'LeitnerExplanation', 'PromptGeneratorDictation',
    'PromptGeneratorFormRenderer', 'PromptGeneratorMultilingual', 'PromptGeneratorYamlLogic',
    'PromptGeneratorYamlRenderer'];

  // Le runner Node exécute les tests dans une fenêtre jsdom sans require() ni accès disque.
  // Le parcours complet de src/**/*.js passe par le process Node (atteint via le constructeur de
  // Function de console, objet créé hors de la fenêtre). Sans Node (runner navigateur) : repli sur
  // le code source des fonctions des objets d'interface chargés.
  function getNodeModules() {
    try {
      const nodeProcess = console.log.constructor('return process')();
      const nodeRequire = nodeProcess.mainModule.require.bind(nodeProcess.mainModule);
      return { fs: nodeRequire('fs'), path: nodeRequire('path'), root: nodeProcess.cwd() };
    } catch (e) {
      return null;
    }
  }

  function collectFileSources() {
    const node = getNodeModules();
    if (!node) return null;
    const srcDir = node.path.join(node.root, 'src');
    if (!node.fs.existsSync(srcDir)) return null;
    const out = [];
    const walkDir = (dir) => {
      for (const entry of node.fs.readdirSync(dir, { withFileTypes: true })) {
        const full = node.path.join(dir, entry.name);
        if (entry.isDirectory()) walkDir(full);
        else if (entry.name.endsWith('.js') && entry.name !== 'i18n.js') {
          out.push({ label: node.path.relative(srcDir, full), source: node.fs.readFileSync(full, 'utf8') });
        }
      }
    };
    walkDir(srcDir);
    return out;
  }

  function allSources() {
    return collectFileSources() || collectSources();
  }

  function collectSources() {
    const seen = new Set();
    const out = [];
    const visit = (value, label, depth) => {
      if (value === null || depth > 4) return;
      if (typeof value === 'function') {
        if (!seen.has(value)) { seen.add(value); out.push({ label, source: Function.prototype.toString.call(value) }); }
        return;
      }
      if (typeof value !== 'object' || seen.has(value)) return;
      seen.add(value);
      for (const key of Object.keys(value)) {
        const desc = Object.getOwnPropertyDescriptor(value, key);
        if (desc && 'value' in desc) visit(desc.value, label + '.' + key, depth + 1);
      }
    };
    for (const name of UI_ROOTS) {
      let root;
      try { root = (0, eval)('typeof ' + name + " !== 'undefined' ? " + name + ' : undefined'); } catch (e) { root = undefined; }
      if (root !== undefined) visit(root, name, 0);
    }
    return out;
  }

  it('every French key exists in English', () => {
    const missing = Object.keys(i18n._translations.fr).filter(k => !(k in i18n._translations.en));
    expect(missing).toEqual([]);
  });

  it('every English key exists in French', () => {
    const missing = Object.keys(i18n._translations.en).filter(k => !(k in i18n._translations.fr));
    expect(missing).toEqual([]);
  });

  it('no translation is empty', () => {
    const empty = [];
    for (const loc of i18n.SUPPORTED_LOCALES) {
      for (const [k, v] of Object.entries(i18n._translations[loc])) {
        // Une valeur est une chaîne ou un objet de variantes { f, m, x }
        const texts = (v !== null && typeof v === 'object') ? Object.values(v) : [v];
        if (texts.some(x => typeof x !== 'string' || x.trim() === '')) empty.push(loc + ':' + k);
      }
    }
    expect(empty).toEqual([]);
  });

  it('placeholders {x} are the same in both languages', () => {
    const bad = [];
    const ph = s => (s.match(/\{[a-zA-Z]+\}/g) || []).sort().join(',');
    for (const k of Object.keys(i18n._translations.fr)) {
      const en = i18n._translations.en[k];
      if (en !== undefined && ph(i18n.resolveVariant(i18n._translations.fr[k], 'feminine')) !== ph(i18n.resolveVariant(en, 'feminine'))) bad.push(k);
    }
    expect(bad).toEqual([]);
  });

  it('every plural pair has both a One and a Many key, in both languages', () => {
    const bad = [];
    for (const loc of i18n.SUPPORTED_LOCALES) {
      const keys = Object.keys(i18n._translations[loc]);
      for (const k of keys) {
        if (k.endsWith('One') && !keys.includes(k.slice(0, -3) + 'Many')) bad.push(loc + ':' + k);
        if (k.endsWith('Many') && k !== 'game.badgesUnlockedMany' && !keys.includes(k.slice(0, -4) + 'One')) bad.push(loc + ':' + k);
      }
    }
    expect(bad).toEqual([]);
  });

  it('the scan of loaded UI code finds translation calls', () => {
    const re = /(?:\b_t|\bt)\(\s*(['"`])([A-Za-z0-9_.-]+)\1/g;
    let count = 0;
    for (const { source } of allSources()) { let m; while ((m = re.exec(source))) count++; }
    expect(count).toBeGreaterThan(100);
  });

  it('every literal key used with _t() / t() / i18n.t() in the UI exists in both dictionaries', () => {
    const re = /(?:\b_t|\bt|\bi18n\.t|\bI18n\.t|\bi18n\.translate)\(\s*(['"`])([A-Za-z0-9_.-]+)\1/g;
    const unknown = [];
    for (const { label, source } of allSources()) {
      let m;
      while ((m = re.exec(source))) {
        if (m[2].endsWith('.')) continue; // préfixe d'une clé construite dynamiquement ('prefix.' + variable)
        if (!(m[2] in i18n._translations.fr) || !(m[2] in i18n._translations.en)) unknown.push(label + ': ' + m[2]);
      }
    }
    expect(unknown).toEqual([]);
  });
});
