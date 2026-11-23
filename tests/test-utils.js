/**
 * Mini Framework de Test pour Train Your Brain
 *
 * Framework léger sans dépendances pour tests dans le navigateur
 */

// ═══════════════════════════════════════════════════════════════
// TEST RUNNER
// ═══════════════════════════════════════════════════════════════

const TestRunner = {
  suites: [],
  currentSuite: null,
  results: { passed: 0, failed: 0, total: 0 },

  // Enregistrer une suite de tests
  describe(name, fn) {
    const suite = {
      name: name,
      tests: [],
      beforeEach: null,
      afterEach: null
    };

    this.currentSuite = suite;
    this.suites.push(suite);

    fn();

    this.currentSuite = null;
  },

  // Hook avant chaque test
  beforeEach(fn) {
    if (this.currentSuite) {
      this.currentSuite.beforeEach = fn;
    }
  },

  // Hook après chaque test
  afterEach(fn) {
    if (this.currentSuite) {
      this.currentSuite.afterEach = fn;
    }
  },

  // Enregistrer un test
  it(name, fn) {
    if (this.currentSuite) {
      this.currentSuite.tests.push({ name: name, fn: fn });
    }
  },

  // Alias pour it
  test(name, fn) {
    this.it(name, fn);
  },

  // Exécuter tous les tests
  async run() {
    const resultsDiv = document.getElementById('results');
    const summaryDiv = document.getElementById('summary');

    resultsDiv.innerHTML = '';
    this.results = { passed: 0, failed: 0, total: 0 };

    for (const suite of this.suites) {
      const suiteDiv = document.createElement('div');
      suiteDiv.className = 'suite';

      const titleDiv = document.createElement('div');
      titleDiv.className = 'suite__title';
      titleDiv.textContent = `📦 ${suite.name}`;
      suiteDiv.appendChild(titleDiv);

      for (const test of suite.tests) {
        this.results.total++;

        const testDiv = document.createElement('div');
        testDiv.className = 'test';

        try {
          // Before each
          if (suite.beforeEach) {
            await suite.beforeEach();
          }

          // Run test (style `(done) => {...}` supporté : on attend done())
          if (test.fn.length > 0) {
            await new Promise((resolve, reject) => {
              const timer = setTimeout(() => reject(new Error('Timeout 2s : done() jamais appelé')), 2000);
              test.fn((err) => { clearTimeout(timer); err ? reject(err) : resolve(); });
            });
          } else {
            await test.fn();
          }

          // After each
          if (suite.afterEach) {
            await suite.afterEach();
          }

          // Success
          this.results.passed++;
          testDiv.classList.add('test--pass');
          testDiv.innerHTML = `
            <span class="test__status test__status--pass">✓</span>
            <span class="test__name">${test.name}</span>
          `;

        } catch (error) {
          // Failure
          this.results.failed++;
          testDiv.classList.add('test--fail');
          testDiv.innerHTML = `
            <span class="test__status test__status--fail">✗</span>
            <span class="test__name">${test.name}</span>
            <div class="test__error">${error.message}</div>
          `;
        }

        suiteDiv.appendChild(testDiv);
      }

      resultsDiv.appendChild(suiteDiv);
    }

    // Afficher le résumé
    const allPassed = this.results.failed === 0;
    summaryDiv.innerHTML = `
      <div class="summary">
        <div class="summary__stats">
          <div class="summary__stat">
            <div class="summary__value summary__value--pass">${this.results.passed}</div>
            <div class="summary__label">Passed</div>
          </div>
          <div class="summary__stat">
            <div class="summary__value summary__value--fail">${this.results.failed}</div>
            <div class="summary__label">Failed</div>
          </div>
          <div class="summary__stat">
            <div class="summary__value summary__value--total">${this.results.total}</div>
            <div class="summary__label">Total</div>
          </div>
        </div>
        <div class="summary__status summary__status--${allPassed ? 'pass' : 'fail'}">
          ${allPassed ? '✓ ALL TESTS PASSED' : '✗ SOME TESTS FAILED'}
        </div>
      </div>
    `;
  }
};

// ═══════════════════════════════════════════════════════════════
// ASSERTIONS
// ═══════════════════════════════════════════════════════════════

function expect(actual) {
  return {
    // Égalité stricte
    toBe(expected) {
      if (actual !== expected) {
        throw new Error(
          `Expected: ${JSON.stringify(expected)}\n` +
          `Received: ${JSON.stringify(actual)}`
        );
      }
    },

    // Égalité profonde
    toEqual(expected) {
      const actualStr = JSON.stringify(actual);
      const expectedStr = JSON.stringify(expected);
      if (actualStr !== expectedStr) {
        throw new Error(
          `Expected: ${expectedStr}\n` +
          `Received: ${actualStr}`
        );
      }
    },

    // Null
    toBeNull() {
      if (actual !== null) {
        throw new Error(
          `Expected: null\n` +
          `Received: ${JSON.stringify(actual)}`
        );
      }
    },

    // Défini
    toBeDefined() {
      if (actual === undefined) {
        throw new Error('Expected value to be defined, but got undefined');
      }
    },

    // Non défini
    toBeUndefined() {
      if (actual !== undefined) {
        throw new Error(
          `Expected: undefined\n` +
          `Received: ${JSON.stringify(actual)}`
        );
      }
    },

    // Truthy
    toBeTruthy() {
      if (!actual) {
        throw new Error(
          `Expected truthy value\n` +
          `Received: ${JSON.stringify(actual)}`
        );
      }
    },

    // Falsy
    toBeFalsy() {
      if (actual) {
        throw new Error(
          `Expected falsy value\n` +
          `Received: ${JSON.stringify(actual)}`
        );
      }
    },

    // Plus grand que
    toBeGreaterThan(expected) {
      if (!(actual > expected)) {
        throw new Error(
          `Expected ${actual} to be greater than ${expected}`
        );
      }
    },

    // Plus petit que
    toBeLessThan(expected) {
      if (!(actual < expected)) {
        throw new Error(
          `Expected ${actual} to be less than ${expected}`
        );
      }
    },

    // Plus grand ou égal
    toBeGreaterThanOrEqual(expected) {
      if (!(actual >= expected)) {
        throw new Error(
          `Expected ${actual} to be greater than or equal to ${expected}`
        );
      }
    },

    // Plus petit ou égal
    toBeLessThanOrEqual(expected) {
      if (!(actual <= expected)) {
        throw new Error(
          `Expected ${actual} to be less than or equal to ${expected}`
        );
      }
    },

    // Contient (array ou string)
    toContain(item) {
      if (Array.isArray(actual)) {
        if (!actual.includes(item)) {
          throw new Error(
            `Expected array to contain ${JSON.stringify(item)}\n` +
            `Array: ${JSON.stringify(actual)}`
          );
        }
      } else if (typeof actual === 'string') {
        if (!actual.includes(item)) {
          throw new Error(
            `Expected string to contain "${item}"\n` +
            `String: "${actual}"`
          );
        }
      } else {
        throw new Error('toContain() requires an array or string');
      }
    },

    // Longueur
    toHaveLength(expected) {
      if (actual.length !== expected) {
        throw new Error(
          `Expected length: ${expected}\n` +
          `Received length: ${actual.length}`
        );
      }
    },

    // Propriété (chemin pointé accepté), valeur optionnelle
    toHaveProperty(path, value) {
      const parts = String(path).split('.');
      let cur = actual;
      for (const part of parts) {
        if (cur === null || cur === undefined || !(part in Object(cur))) {
          throw new Error(`Expected object to have property "${path}"`);
        }
        cur = cur[part];
      }
      if (arguments.length > 1 && JSON.stringify(cur) !== JSON.stringify(value)) {
        throw new Error(`Expected property "${path}" to be ${JSON.stringify(value)}, got ${JSON.stringify(cur)}`);
      }
    },

    // Lance une erreur
    toThrow(expectedMessage) {
      if (typeof actual !== 'function') {
        throw new Error('toThrow() requires a function');
      }

      let threw = false;
      let thrownError = null;

      try {
        actual();
      } catch (e) {
        threw = true;
        thrownError = e;
      }

      if (!threw) {
        throw new Error('Expected function to throw an error');
      }

      if (expectedMessage && !thrownError.message.includes(expectedMessage)) {
        throw new Error(
          `Expected error message to contain: "${expectedMessage}"\n` +
          `Received: "${thrownError.message}"`
        );
      }
    },

    // Proche de (pour les nombres flottants)
    toBeCloseTo(expected, precision = 2) {
      const diff = Math.abs(actual - expected);
      const epsilon = Math.pow(10, -precision) / 2;
      if (diff > epsilon) {
        throw new Error(
          `Expected ${actual} to be close to ${expected} (precision: ${precision})`
        );
      }
    },

    // Négation
    not: {
      toBe(expected) {
        if (actual === expected) {
          throw new Error(
            `Expected value not to be ${JSON.stringify(expected)}`
          );
        }
      },

      toEqual(expected) {
        const actualStr = JSON.stringify(actual);
        const expectedStr = JSON.stringify(expected);
        if (actualStr === expectedStr) {
          throw new Error(
            `Expected value not to equal ${expectedStr}`
          );
        }
      },

      toBeNull() {
        if (actual === null) {
          throw new Error('Expected value not to be null');
        }
      },

      toContain(item) {
        if (Array.isArray(actual) && actual.includes(item)) {
          throw new Error(
            `Expected array not to contain ${JSON.stringify(item)}`
          );
        }
        if (typeof actual === 'string' && actual.includes(item)) {
          throw new Error(
            `Expected string not to contain "${item}"`
          );
        }
      },

      toThrow() {
        if (typeof actual !== 'function') {
          throw new Error('toThrow() requires a function');
        }

        let threw = false;
        try {
          actual();
        } catch (e) {
          threw = true;
        }

        if (threw) {
          throw new Error('Expected function not to throw an error');
        }
      }
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Créer un joueur de test
 */
function createTestPlayer(overrides = {}) {
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
}

/**
 * Créer une carte de test
 */
function createTestCard(overrides = {}) {
  return {
    id: 'test_card_' + Date.now(),
    question: 'Test question?',
    answer: 'Test answer',
    type: 'exact_text',
    box: 'never_played',
    latencyThreshold: null,
    bestResponseTimeMs: null,
    lastResponseTimeMs: null,
    restUntil: null,
    timesPlayed: 0,
    timesCorrect: 0,
    ...overrides
  };
}

/**
 * Créer un deck de test
 */
function createTestDeck(overrides = {}) {
  return {
    id: 'test_deck_' + Date.now(),
    name: 'Test Deck',
    description: 'A test deck',
    category: ['test'],
    difficulty: 1,
    language: 'fr',
    settings: {
      bidirectional: false,
      sequential: false,
      ...overrides.settings
    },
    cards: overrides.cards || [createTestCard()]
  };
}

/**
 * Créer une session de test
 */
function createTestSession(overrides = {}) {
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
}

// ═══════════════════════════════════════════════════════════════
// ALIASES GLOBAUX
// ═══════════════════════════════════════════════════════════════

const describe = TestRunner.describe.bind(TestRunner);
const it = TestRunner.it.bind(TestRunner);
const test = TestRunner.test.bind(TestRunner);
const beforeEach = TestRunner.beforeEach.bind(TestRunner);
const afterEach = TestRunner.afterEach.bind(TestRunner);
