#!/usr/bin/env node
/**
 * Test Runner Node.js pour Train Your Brain
 *
 * Exécute les tests unitaires des modules
 * Usage: node tests/node-runner.cjs
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Couleurs pour la console
const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  dim: '\x1b[2m'
};

// Stats
const stats = { total: 0, passed: 0, failed: 0, errors: [] };

// ═══════════════════════════════════════════════════════════════
// MOCK DU DOM ET APIs BROWSER
// ═══════════════════════════════════════════════════════════════

const storage = {};
class MockStorage {
  getItem(k) { return Object.prototype.hasOwnProperty.call(storage, k) ? storage[k] : null; }
  setItem(k, v) { storage[k] = String(v); }
  removeItem(k) { delete storage[k]; }
  clear() { Object.keys(storage).forEach(k => delete storage[k]); }
  get length() { return Object.keys(storage).length; }
  key(i) { return Object.keys(storage)[i] ?? null; }
}
// Proxy : comme le vrai Storage, les clés stockées sont des propriétés propres énumérables
// (for...in / hasOwnProperty / Object.keys) et les méthodes restent sur le prototype.
const mockLocalStorage = new Proxy(new MockStorage(), {
  get(t, p, r) {
    if (typeof p === 'string' && !(p in t) && Object.prototype.hasOwnProperty.call(storage, p)) return storage[p];
    return Reflect.get(t, p, t);
  },
  set(t, p, v) {
    if (typeof p !== 'string' || p in t) { t[p] = v; return true; } // ex. localStorage.setItem = fn (simulation quota)
    storage[p] = String(v); return true;
  },
  has: (t, p) => p in t || Object.prototype.hasOwnProperty.call(storage, p),
  deleteProperty(t, p) { if (Object.prototype.hasOwnProperty.call(t, p)) delete t[p]; delete storage[p]; return true; },
  ownKeys: () => Object.keys(storage),
  getOwnPropertyDescriptor(t, p) {
    if (Object.prototype.hasOwnProperty.call(storage, p)) return { value: storage[p], enumerable: true, configurable: true, writable: true };
    return undefined;
  }
});

// jsdom fournit un vrai DOM (document, window, Event, HTMLElement...).
// Le contexte d'exécution des modules/tests EST la fenêtre jsdom (window === globalThis).
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!doctype html><html><head></head><body></body></html>', {
  url: 'http://localhost/',
  runScripts: 'outside-only',
  pretendToBeVisual: true
});
const context = dom.window;
const vmContext = dom.getInternalVMContext();

// localStorage en mémoire : les tests remplacent setItem/getItem pour simuler
// des quotas (impossible sur le Storage natif de jsdom).
// Réassignable (prompt-learner.test.js fait `global.localStorage = <son mock>`), mais restauré avant
// chaque fichier de test (voir resetGlobals) pour ne pas polluer les fichiers suivants.
function resetGlobals() {
  mockLocalStorage.clear();
  Object.defineProperty(context, 'localStorage', { value: mockLocalStorage, configurable: true, writable: true });
}
resetGlobals();
Object.defineProperty(context.navigator, 'language', { value: 'fr-FR', configurable: true });
Object.defineProperty(context.navigator, 'languages', { value: ['fr-FR', 'fr'], configurable: true });

// Tests d'analyse statique : liste des sources de src/ (le contexte de test n'a pas accès à fs)
context.listSourceFiles = function() {
  const out = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.js')) out.push({ path: path.relative(path.resolve(__dirname, '..'), full), content: fs.readFileSync(full, 'utf-8') });
    }
  };
  walk(path.resolve(__dirname, '..', 'src'));
  return out;
};

// Limite env Node (C) : APIs navigateur absentes de jsdom
class MockAudioContext {
  constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; this.sampleRate = 44100; }
  createOscillator() { return { connect() {}, disconnect() {}, start() {}, stop() {}, frequency: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, type: 'sine' }; }
  createGain() { return { connect() {}, disconnect() {}, gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} } }; }
  resume() { return Promise.resolve(); }
  close() { return Promise.resolve(); }
}
// jsdom n'implémente pas <canvas> sans le paquet natif `canvas` : getContext('2d') renvoie null.
// Stub 2D no-op (toute méthode appelée est acceptée, les propriétés sont libres).
const stub2d = (canvas) => new Proxy({ canvas }, {
  get: (t, p) => (p in t ? t[p] : (...a) => (p === 'measureText' ? { width: 0 } : undefined)),
  set: (t, p, v) => { t[p] = v; return true; }
});
context.HTMLCanvasElement.prototype.getContext = function (type) {
  return type === '2d' ? (this.__ctx2d || (this.__ctx2d = stub2d(this))) : null;
};

Object.assign(context, {
  AudioContext: MockAudioContext,
  webkitAudioContext: MockAudioContext,
  alert: () => {},
  confirm: () => true,
  // Mock fetch for LinguaLibre (returns empty for tests)
  fetch: async () => ({ ok: false, json: async () => ({}) }),
  FileReader: class {
    readAsDataURL() { this.onloadend?.({ target: { result: 'data:audio/ogg;base64,' } }); }
  },
  global: context,
  // Test framework - will be populated
  tests: [],
  currentDescribe: '',
  currentFile: '',
  beforeEachFn: null,
  afterEachFn: null
});

// Framework de test
context.describe = function(name, fn) {
  const prev = context.currentDescribe;
  const prevBeforeEach = context.beforeEachFn;
  const prevAfterEach = context.afterEachFn;
  context.currentDescribe = name;
  // Hériter du beforeEach parent au lieu de le reset
  // context.beforeEachFn reste inchangé pour permettre l'héritage
  try { fn(); } catch (e) { console.error(`${c.red}Erreur describe "${name}": ${e.message}${c.reset}`); }
  context.currentDescribe = prev;
  context.beforeEachFn = prevBeforeEach;
  context.afterEachFn = prevAfterEach;
};

context.it = function(name, fn) {
  // Capture le beforeEach courant pour l'exécuter avec ce test
  context.tests.push({
    file: context.currentFile,
    describe: context.currentDescribe,
    name,
    fn,
    beforeEach: context.beforeEachFn,
    afterEach: context.afterEachFn
  });
};

context.test = context.it;
context.TestRunner = { describe: (...a) => context.describe(...a), it: (...a) => context.it(...a), beforeEach: (f) => context.beforeEach(f), afterEach: (f) => context.afterEach(f), expect: (...a) => context.expect(...a), run: () => {} };

// Les hooks s'enchaînent comme en Jest : beforeEach parent puis enfant, afterEach enfant puis parent.
context.beforeEach = function(fn) {
  const parent = context.beforeEachFn;
  context.beforeEachFn = parent ? () => { parent(); return fn(); } : fn;
};

context.afterEach = function(fn) {
  const parent = context.afterEachFn;
  context.afterEachFn = parent ? () => { fn(); return parent(); } : fn;
};

context.expect = function(actual) {
  const matchers = {
    toBe: (expected) => {
      if (actual !== expected) throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    },
    toEqual: (expected) => {
      if (JSON.stringify(actual) !== JSON.stringify(expected))
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    },
    toBeDefined: () => { if (actual === undefined) throw new Error(`Expected defined`); },
    toBeUndefined: () => { if (actual !== undefined) throw new Error(`Expected undefined`); },
    toBeNull: () => { if (actual !== null) throw new Error(`Expected null`); },
    toBeTruthy: () => { if (!actual) throw new Error(`Expected truthy`); },
    toBeFalsy: () => { if (actual) throw new Error(`Expected falsy`); },
    toBeGreaterThan: (e) => { if (!(actual > e)) throw new Error(`Expected ${actual} > ${e}`); },
    toBeLessThan: (e) => { if (!(actual < e)) throw new Error(`Expected ${actual} < ${e}`); },
    toBeGreaterThanOrEqual: (e) => { if (!(actual >= e)) throw new Error(`Expected ${actual} >= ${e}`); },
    toBeLessThanOrEqual: (e) => { if (!(actual <= e)) throw new Error(`Expected ${actual} <= ${e}`); },
    toContain: (e) => {
      if (typeof actual === 'string' && !actual.includes(e)) throw new Error(`"${actual}" should contain "${e}"`);
      if (Array.isArray(actual) && !actual.includes(e)) throw new Error(`Array should contain ${e}`);
    },
    toHaveLength: (e) => { if (actual.length !== e) throw new Error(`Expected length ${e}, got ${actual.length}`); },
    toHaveProperty: (propPath, ...rest) => {
      let cur = actual;
      for (const part of String(propPath).split('.')) {
        if (cur === null || cur === undefined || !(part in Object(cur))) throw new Error(`Expected object to have property "${propPath}"`);
        cur = cur[part];
      }
      if (rest.length && JSON.stringify(cur) !== JSON.stringify(rest[0]))
        throw new Error(`Expected property "${propPath}" to be ${JSON.stringify(rest[0])}, got ${JSON.stringify(cur)}`);
    },
    toThrow: (expectedMsg) => {
      let threw = false;
      let thrownError = null;
      try { actual(); } catch (e) { threw = true; thrownError = e; }
      if (!threw) throw new Error('Expected function to throw');
      if (expectedMsg && thrownError && !thrownError.message.includes(expectedMsg)) {
        throw new Error(`Expected error to contain "${expectedMsg}", got "${thrownError.message}"`);
      }
    },
    toMatch: (regex) => {
      if (!regex.test(String(actual))) throw new Error(`"${actual}" should match ${regex}`);
    },
    toBeInstanceOf: (cls) => {
      if (!(actual instanceof cls)) throw new Error(`Expected instance of ${cls.name}`);
    },
    toBeCloseTo: (expected, precision = 2) => {
      const diff = Math.abs(actual - expected);
      const epsilon = Math.pow(10, -precision) / 2;
      if (diff > epsilon) throw new Error(`Expected ${actual} to be close to ${expected}`);
    }
  };

  matchers.not = {
    toBe: (e) => { if (actual === e) throw new Error(`Expected not ${JSON.stringify(e)}`); },
    toEqual: (e) => { if (JSON.stringify(actual) === JSON.stringify(e)) throw new Error(`Expected not equal`); },
    toContain: (e) => {
      if (typeof actual === 'string' && actual.includes(e)) throw new Error(`Should not contain "${e}"`);
      if (Array.isArray(actual) && actual.includes(e)) throw new Error(`Array should not contain ${e}`);
    },
    toBeNull: () => { if (actual === null) throw new Error('Expected not null'); },
    toBeDefined: () => { if (actual !== undefined) throw new Error('Expected undefined'); },
    toBeTruthy: () => { if (actual) throw new Error('Expected falsy'); },
    toBeFalsy: () => { if (!actual) throw new Error('Expected truthy'); },
    toThrow: () => {
      let threw = false;
      try { actual(); } catch { threw = true; }
      if (threw) throw new Error('Expected not to throw');
    }
  };

  return matchers;
};

// Helper functions
context.createTestPlayer = function(overrides = {}) {
  return {
    id: 'test_player_' + Date.now(),
    name: 'Test Player',
    createdAt: new Date().toISOString(),
    stats: {
      totalXP: 0,
      totalCardsPlayed: 0,
      totalSessions: 0,
      currentStreak: 0,
      longestStreak: 0,
      longestGreenStreak: 0,
      totalGreenCards: 0,
      uniqueDecksPlayed: 0,
      fastestCorrectAnswer: Infinity,
      lastPlayedAt: null,
      cardsBySubject: {},
      xpHistory: [],
      ...overrides.stats
    },
    badges: overrides.badges || [],
    settings: {
      soundEnabled: true,
      theme: 'dark',
      language: 'fr',
      ...overrides.settings
    }
  };
};

context.createTestCard = function(overrides = {}) {
  return {
    id: 'test_card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    question: 'Test question?',
    answer: 'Test answer',
    type: 'exact_text',
    box: 'never_played',
    latencyThreshold: null,
    bestResponseTimeMs: null,
    lastResponseTimeMs: null,
    restUntil: null,
    restDays: 0,
    timesPlayed: 0,
    timesCorrect: 0,
    ...overrides
  };
};

context.createTestDeck = function(overrides = {}) {
  return {
    id: 'test_deck_' + Date.now(),
    name: 'Test Deck',
    description: 'A test deck',
    category: ['test'],
    tags: ['test'],
    difficulty: 1,
    language: 'fr',
    settings: {
      bidirectional: false,
      sequential: false,
      ...overrides.settings
    },
    cards: overrides.cards || [context.createTestCard()]
  };
};

context.createTestSession = function(overrides = {}) {
  // Les overrides de premier niveau (results, startedAt, ...) sont pris en compte,
  // `stats` est fusionné avec les valeurs par défaut.
  return {
    deckId: 'test_deck',
    startedAt: new Date().toISOString(),
    endedAt: null,
    results: [],
    ...overrides,
    stats: {
      cardsPlayed: 0,
      correctAnswers: 0,
      currentGreenStreak: 0,
      maxGreenStreak: 0,
      totalXpEarned: 0,
      averageResponseTimeMs: 0,
      ...overrides.stats
    }
  };
};


// ═══════════════════════════════════════════════════════════════
// CHARGEMENT DES MODULES
// ═══════════════════════════════════════════════════════════════

function loadModule(filePath) {
  const fullPath = path.resolve(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`${c.yellow}⚠ Fichier non trouvé: ${filePath}${c.reset}`);
    return false;
  }

  let code = fs.readFileSync(fullPath, 'utf-8');

  // Supprimer les exports ESM/CommonJS pour exécution directe
  code = code
    .replace(/export\s+\{[^}]*\};?/g, '')
    .replace(/export\s+default\s+/g, '')
    // Pattern: if (typeof module !== 'undefined') { module.exports = X; }
    .replace(/if\s*\(\s*typeof\s+module\s*!==?\s*['"]undefined['"]\s*\)\s*\{\s*module\.exports\s*=\s*\{?[^}]*\}?\s*;?\s*\}/g, '')
    // Pattern: if (typeof module !== 'undefined') module.exports = X;
    .replace(/if\s*\(\s*typeof\s+module\s*!==?\s*['"]undefined['"]\s*\)\s*module\.exports\s*=[^;]+;/g, '')
    // Pattern: if (typeof module !== 'undefined' && module.exports) module.exports = X;
    .replace(/if\s*\(\s*typeof\s+module\s*!==?\s*['"]undefined['"]\s*&&\s*module\.exports\s*\)\s*\{?\s*module\.exports\s*=[^;]+;?\s*\}?/g, '')
    // Fallback: module.exports = X;
    .replace(/^\s*module\.exports\s*=[^;]+;\s*$/gm, '');

  try {
    const script = new vm.Script(code, { filename: filePath });
    script.runInContext(vmContext);
    return true;
  } catch (e) {
    console.log(`${c.red}✗ Erreur ${path.basename(filePath)}: ${e.message}${c.reset}`);
    if (e.stack) {
      const lines = e.stack.split('\n').slice(0, 3);
      lines.forEach(l => console.log(`  ${c.dim}${l}${c.reset}`));
    }
    return false;
  }
}

// Mapping chemin de module -> global déjà chargé (les tests font `const X = require(...)`)
const REQUIRE_GLOBALS = {
  'compression': 'Compression',
  'storage': 'Storage',
  'text-utils': 'TextUtils',
  'prompt-learner': 'PromptLearner',
  'deck-validator': 'DeckValidator'
};

function testRequire(id) {
  const name = REQUIRE_GLOBALS[path.basename(id, '.js')];
  if (!name) throw new Error(`require("${id}") non supporté par le runner`);
  return vm.runInContext(`typeof ${name} === 'undefined' ? undefined : ${name}`, vmContext);
}

// Charge un fichier de test dans sa propre portée (évite les collisions de
// `const Storage = require(...)` avec les modules globaux).
function loadTestFile(filePath) {
  const fullPath = path.resolve(__dirname, '..', filePath);
  const code = fs.readFileSync(fullPath, 'utf-8');
  try {
    context.currentFile = path.basename(filePath);
    const fn = new vm.Script('(function(require){' + code + '\n})', { filename: filePath }).runInContext(vmContext);
    fn(testRequire);
    return true;
  } catch (e) {
    console.log(`${c.red}✗ Erreur chargement ${path.basename(filePath)}: ${e.message}${c.reset}`);
    stats.failed++; stats.total++;
    stats.errors.push({ test: `LOAD ${filePath}`, error: e.message });
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════
// EXÉCUTION DES TESTS
// ═══════════════════════════════════════════════════════════════

let currentTestReject = null;
context.addEventListener('error', (e) => { if (currentTestReject) currentTestReject(e.error || new Error(e.message)); });

async function runTests() {
  let lastDescribe = '';

  for (const test of context.tests) {
    if (test.describe !== lastDescribe) {
      lastDescribe = test.describe;
      console.log(`\n${c.blue}${test.describe}${c.reset}`);
    }

    stats.total++;
    try {
      // Exécuter beforeEach si défini
      if (test.beforeEach) {
        test.beforeEach();
      }

      // Exécuter le test. Style `it('...', (done) => {...})` supporté : on attend done()
      // (une erreur levée dans un callback asynchrone est capturée via l'événement 'error' de window).
      if (test.fn.length > 0) {
        await new Promise((resolve, reject) => {
          const timer = setTimeout(() => { currentTestReject = null; reject(new Error('Timeout 2s : done() jamais appelé')); }, 2000);
          currentTestReject = (err) => { clearTimeout(timer); currentTestReject = null; reject(err); };
          test.fn((err) => { clearTimeout(timer); currentTestReject = null; err ? reject(err) : resolve(); });
        });
      } else {
        const result = test.fn();
        if (result && typeof result.then === 'function') await result;
      }

      // Exécuter afterEach si défini
      if (test.afterEach) {
        test.afterEach();
      }

      stats.passed++;
      console.log(`  ${c.green}✓${c.reset} ${c.dim}${test.name}${c.reset}`);
    } catch (e) {
      stats.failed++;
      stats.errors.push({ file: test.file, test: `${test.describe} > ${test.name}`, error: e.message });
      console.log(`  ${c.red}✗ ${test.name}${c.reset}`);
      console.log(`    ${c.dim}${e.message}${c.reset}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log(`${c.blue}╔═══════════════════════════════════════════╗${c.reset}`);
  console.log(`${c.blue}║   Train Your Brain - Tests Unitaires      ║${c.reset}`);
  console.log(`${c.blue}╚═══════════════════════════════════════════╝${c.reset}\n`);

  // Bibliothèques tierces (js-yaml, katex), comme dans build.manifest.json "vendor"
  for (const v of ['node_modules/js-yaml/dist/js-yaml.min.js', 'node_modules/katex/dist/katex.min.js']) {
    try {
      new vm.Script(fs.readFileSync(path.resolve(__dirname, '..', v), 'utf-8'), { filename: v }).runInContext(vmContext);
    } catch (e) {
      console.log(`${c.red}✗ Vendor ${v}: ${e.message}${c.reset}`);
    }
  }

  // Modules à charger : ordre de build.manifest.json (modules puis ui).
  // Sous-ensemble UI nécessaire aux tests (pages-base avant page-utils, etc.).
  const modules = [
    'src/modules/types.js',
    'src/modules/i18n.js',
    'src/modules/compression.js',
    'src/modules/error-handler.js',
    'src/modules/a11y.js',
    'src/modules/text-utils.js',
    'src/modules/state.js',
    'src/modules/storage.js',
    'src/modules/leitner.js',
    'src/modules/xp.js',
    'src/modules/validator.js',
    'src/modules/router.js',
    'src/modules/badges.js',
    'src/modules/challenges.js',
    'src/modules/tags-taxonomy.js',
    'src/modules/tags.js',
    'src/modules/themes.js',
    'src/modules/audio.js',
    'src/modules/latex.js',
    'src/modules/yaml.js',
    'src/modules/moodle.js',
    'src/modules/exporter.js',
    'src/modules/lingua-libre.js',
    'src/modules/multilingual.js',
    'src/modules/prompt-generator.js',
    'src/modules/deck-validator.js',
    'src/modules/prompt-learner.js',
    'src/ui/components.js',
    'src/ui/components/card-media.js',
    'src/ui/components/deck-table.js',
    'src/ui/pages-base.js',
    'src/ui/page-utils.js',
    'src/ui/effects.js',
    'src/ui/tutorial.js',
    'src/ui/charts.js',
    'src/ui/page-splash.js',
    'src/ui/page-stats.js',
    'src/ui/game/card-type-renderer.js',
    'src/ui/game/answer-extractor.js',
    'src/ui/game/answer-validator.js',
    'src/ui/game/session-tracker.js',
    'src/ui/game/secret-stats.js',
    'src/ui/game/session-manager.js',
    'src/ui/page-game.js',
    'src/ui/prompt-generator/multilingual-creator.js',
    'src/ui/prompt-generator/yaml-editor-renderer.js',
    'src/ui/prompt-generator/yaml-editor-logic.js',
    'src/ui/page-prompt-generator.js',
    'src/ui/page-deck-hub.js',
    'src/ui/page-exam.js',
    'src/ui/page-challenge.js',
    'src/ui/page-challenges.js',
    'src/ui/page-session-summary.js',
    'src/ui/page-deck-resources.js',
    'src/ui/app.js'
  ];

  console.log(`${c.dim}Chargement des modules...${c.reset}`);
  for (const mod of modules) {
    const name = path.basename(mod, '.js');
    if (loadModule(mod)) {
      console.log(`  ${c.green}✓${c.reset} ${name}`);
    }
  }

  // Tests à exécuter : tous les tests/*.test.js, sauf exclusions explicites
  const EXCLUDED_TESTS = {};
  const testFiles = fs.readdirSync(__dirname)
    .filter(f => f.endsWith('.test.js') && !(f in EXCLUDED_TESTS))
    // Debug : TEST_FILTER=storage node tests/node-runner.cjs (sous-chaîne du nom de fichier)
    .filter(f => !process.env.TEST_FILTER || f.includes(process.env.TEST_FILTER))
    .sort()
    .map(f => 'tests/' + f);

  // Chaque fichier est chargé puis exécuté immédiatement, avec des globals remis à zéro.
  console.log(`\n${c.blue}Exécution...${c.reset}`);
  for (const tf of testFiles) {
    resetGlobals();
    context.tests.length = 0;
    context.beforeEachFn = null;
    context.afterEachFn = null;
    console.log(`\n${c.dim}→ ${path.basename(tf)}${c.reset}`);
    loadTestFile(tf);
    await runTests();
  }

  // Résumé
  console.log(`\n${c.blue}═════════════════════════════════════════════${c.reset}`);
  console.log(`${c.green}✓ ${stats.passed} passés${c.reset}  ${stats.failed > 0 ? `${c.red}✗ ${stats.failed} échoués${c.reset}` : ''}`);
  console.log(`${c.dim}Total: ${stats.total} tests${c.reset}\n`);

  // Afficher les erreurs groupées
  if (stats.failed > 0 && true) {
    console.log(`${c.red}Échecs:${c.reset}`);
    stats.errors.forEach(e => {
      console.log(`  ${c.dim}• [${e.file || '?'}] ${e.test}${c.reset}`);
      console.log(`    ${c.red}${String(e.error).split('\n')[0].slice(0, 200)}${c.reset}`);
    });
  }

  process.exit(stats.failed > 0 ? 1 : 0);
}

main().catch(e => {
  console.error(`${c.red}Erreur:${c.reset}`, e);
  process.exit(1);
});
