# Stratégie de Tests - Documentation

> **Dossier** : `tests/`
> **Runner principal** : `tests/node-runner.cjs` (`npm test`)
> **Dernière mise à jour** : 2026-11-22

---

## Vue d'Ensemble

Train Your Brain utilise une approche **TDD (Test-Driven Development)** avec un framework de tests maison (`describe` / `it` / `expect`, voir `tests/test-utils.js`).

### Principes

1. **TDD obligatoire** : écrire le test avant le code
2. **Un runner Node.js** : `tests/node-runner.cjs` charge les modules de `src/` dans une fenêtre **jsdom** (`window === globalThis`) et exécute tous les `tests/*.test.js`
3. **Isolation** : chaque fichier de test s'exécute avec des globals et un `localStorage` en mémoire remis à zéro ; chaque test est indépendant
4. **Couverture** : viser > 90% sur le code métier

---

## Structure des Tests

```
tests/
├── node-runner.cjs      # Runner Node.js (npm test)
├── runner.html          # Runner navigateur à liste de scripts propre (npm run test:browser)
├── test-utils.js        # Framework de test (runner navigateur)
├── INDEX.md             # Index des tests (fichiers, nombre de tests)
├── *.test.js            # 57 fichiers de tests unitaires et d'intégration
└── e2e/                 # Playwright : 9 *.spec.cjs, helpers.cjs, app-path.cjs, lint-specs.cjs, playwright.config.cjs
```

Le nom d'un fichier de test suit celui du module (`leitner.test.js`, `storage.test.js`). Plusieurs fichiers peuvent viser un même module (`deck-validator*.test.js`, `storage-*.test.js`). La liste complète avec le nombre de tests par fichier est dans [`tests/INDEX.md`](../tests/INDEX.md).

**Total** : 2 433 tests unitaires dans 57 fichiers, plus 208 tests e2e dans 9 fichiers.

### Découverte des fichiers

`node-runner.cjs` exécute **tous** les `tests/*.test.js`, triés par nom, sans liste à tenir à jour. Un fichier de test ajouté dans `tests/` est exécuté automatiquement. Les modules et fichiers UI testés sont chargés par une liste en dur dans `node-runner.cjs` (tableau `modules`) : un nouveau module de `src/` testé s'y déclare.

Le runner navigateur `tests/runner.html` garde sa propre liste de balises `<script>` : 27 des 57 fichiers de test, et une liste de modules partielle (il ne charge ni `text-utils.js`, ni `tags-taxonomy.js`, ni `prompt-learner.js`, ni `types.js`). Il n'est pas maintenu à jour ; la référence est `npm test`.

---

## Framework de Test

### API Principale

```javascript
// Définir une suite de tests
describe('NomModule', () => {
    // Test individuel
    it('should do something', () => {
        // Assertions
        expect(result).toBe(expected);
    });

    // Test avec setup/teardown
    beforeEach(() => { /* setup */ });
    afterEach(() => { /* cleanup */ });
});
```

### Assertions Disponibles

| Méthode | Description |
|---------|-------------|
| `expect(a).toBe(b)` | Égalité stricte (`===`) |
| `expect(a).toEqual(b)` | Égalité profonde (objets) |
| `expect(a).toBeTruthy()` | Valeur truthy |
| `expect(a).toBeFalsy()` | Valeur falsy |
| `expect(a).toBeNull()` | Strictement `null` |
| `expect(a).toBeUndefined()` | Strictement `undefined` |
| `expect(a).toBeDefined()` | Non `undefined` |
| `expect(a).toContain(x)` | Tableau contient `x` |
| `expect(a).toHaveLength(n)` | Longueur = `n` |
| `expect(a).toBeGreaterThan(b)` | `a > b` |
| `expect(a).toBeLessThan(b)` | `a < b` |
| `expect(a).toBeGreaterThanOrEqual(b)` | `a >= b` |
| `expect(a).toBeLessThanOrEqual(b)` | `a <= b` |
| `expect(a).toBeCloseTo(b, p)` | Proche à `p` décimales |
| `expect(a).toMatch(regex)` | Correspond à regex (Node.js) |
| `expect(fn).toThrow()` | Lance une exception |
| `expect(fn).toThrow(msg)` | Lance avec message optionnel |
| `expect(a).toHaveProperty(chemin)` | L'objet possède la propriété |
| `expect(a).toBeInstanceOf(C)` | `a instanceof C` |

### Négation

```javascript
expect(a).not.toBe(b);
expect(arr).not.toContain(x);
```

### Helpers de Test

Les helpers suivants sont disponibles dans `node-runner.cjs` (et `test-utils.js` pour le runner navigateur) :

```javascript
// Créer un joueur de test
const player = createTestPlayer({
  stats: { totalXP: 500 }
});

// Créer une carte de test
const card = createTestCard({
  question: 'Custom question?',
  answer: 'Custom answer',
  box: 'purple'
});

// Créer un deck de test
const deck = createTestDeck({
  settings: { bidirectional: true }
});

// Créer une session de test
const session = createTestSession({
  stats: { cardsPlayed: 10 }
});
```

---

## Lancer les Tests

### Runner Node.js (principal)

```bash
npm test                          # = node tests/node-runner.cjs
TEST_FILTER=storage npm test      # fichiers dont le nom contient "storage"
```

- Sortie dans le terminal, code de sortie 1 si au moins un test échoue (utilisable en CI).
- `TEST_FILTER=<sous-chaîne>` restreint l'exécution aux fichiers dont le nom contient la sous-chaîne (`storage` sélectionne `storage.test.js`, `storage-integrity.test.js` et `storage-multiplayer.test.js`). Pour un fichier précis, passer son nom complet (`TEST_FILTER=xp.test.js`).
- Les tests asynchrones sont supportés : un test qui retourne une promesse est attendu.
- Les APIs absentes de jsdom sont simulées par le runner : `AudioContext`, `fetch` (réponse vide), `FileReader`, contexte 2D de `<canvas>` (no-op).
- `audio.test.js` vérifie des propriétés sur un faux contexte audio qui consigne l'automation (attaque depuis 0, retour à 0 avant `stop()`, plafond de crête).

### Runner navigateur (non maintenu)

```bash
npm run test:browser              # = node scripts/dev-server.js --test
# → serveur sur http://localhost:3000, page tests/runner.html
```

`runner.html` ne charge qu'une partie des fichiers de test et des modules (voir "Découverte des fichiers"). Le serveur sert le dépôt tel quel (modules de `src/`, pas de build). Que cette page s'exécute encore sans erreur n'est pas vérifié.

### Tests end-to-end (Playwright)

```bash
node scripts/build.js             # les tests ciblent index.html à la racine
npm run test:e2e                  # = playwright test -c tests/e2e/playwright.config.cjs
E2E_APP=tmp/app.html npm run test:e2e   # contre un autre build (chemin relatif au dossier courant)
npm run test:e2e:lint             # contrôle statique des specs
```

- **Périmètre** : 208 tests, Chromium seul, dans 9 fichiers `tests/e2e/*.spec.cjs` : navigation, jeu, éditeur de deck, import/export, gamification, missions, mode défi, dictée, paramètres. L'interface est testée en français (`locale: 'fr-FR'`, joueurs de test en `language: 'fr'`).
- **Cible** : `tests/e2e/app-path.cjs` résout le fichier ouvert en `file://` : `index.html` à la racine, ou `E2E_APP`. Playwright est une devDependency (version épinglée dans `package.json`) ; le navigateur se télécharge par `npx playwright install chromium`. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` désigne un Chrome système.
- **Réseau bloqué** : `blockExternalNetwork(page)` (`helpers.cjs`) interrompt toute requête `http(s)` / `ws(s)` et renvoie la liste des requêtes tentées ; `dictation.spec.cjs` vérifie qu'elle reste vide.
- **Horloge fixée** : `missions.spec.cjs` et `challenge-mode.spec.cjs` installent `page.clock` à une date précise (jour local) pour les défis et quêtes ; `game.spec.cjs` pilote l'horloge pour le chronométrage des réponses.
- **`lint-specs.cjs`** : repère les specs qui peuvent passer sans rien vérifier : route absente de `Router.register` (`src/ui/app.js`), assertion dans un `if (await ….isVisible())`, `.or(...)`, `waitForTimeout`, `test.skip` / `test.fixme`. Une ligne contenant `lint-ignore` est ignorée. Code de sortie 1 au premier problème.

### Ce que vérifie la CI

`.github/workflows/ci.yml` (push et pull request) : `npm test` ; `node scripts/build.js --minify` ; `lint-specs.cjs` ; `playwright test --project=chromium` sur le build minifié ; `npm run build:site`. `pages.yml` (push sur `main`) rejoue `npm test` avant de construire et déployer le site.

---

## Écrire des Tests

### Structure d'un Fichier de Test

```javascript
/**
 * Tests pour le module XYZ
 */

describe('XYZ', () => {
    // ═══════════════════════════════════════════
    // SETUP / TEARDOWN
    // ═══════════════════════════════════════════

    let testData;

    beforeEach(() => {
        // Préparer les données de test
        testData = { /* ... */ };
    });

    afterEach(() => {
        // Nettoyer (localStorage, etc.)
        localStorage.clear();
    });

    // ═══════════════════════════════════════════
    // TESTS - Fonctionnalité A
    // ═══════════════════════════════════════════

    describe('fonctionnalitéA', () => {
        it('should handle normal case', () => {
            const result = XYZ.fonctionnalitéA(input);
            expect(result).toBe(expected);
        });

        it('should handle edge case', () => {
            const result = XYZ.fonctionnalitéA(edgeInput);
            expect(result).toBe(edgeExpected);
        });

        it('should throw on invalid input', () => {
            expect(() => XYZ.fonctionnalitéA(null)).toThrow();
        });
    });

    // ═══════════════════════════════════════════
    // TESTS - Fonctionnalité B
    // ═══════════════════════════════════════════

    describe('fonctionnalitéB', () => {
        // ...
    });
});
```

### Exemple : Test du Module Leitner

```javascript
describe('Leitner', () => {
    describe('getNextBox', () => {
        it('should return purple on incorrect answer', () => {
            const result = Leitner.getNextBox('orange', false, 1000, 2000);
            expect(result).toBe('purple');
        });

        it('should return green on first correct answer', () => {
            const result = Leitner.getNextBox('never_played', true, 1000, 2000);
            expect(result).toBe('green');
        });

        it('should return green when response is fast', () => {
            const result = Leitner.getNextBox('purple', true, 1000, 2000);
            expect(result).toBe('green');
        });

        it('should return orange when response is slow', () => {
            const result = Leitner.getNextBox('purple', true, 3000, 2000);
            expect(result).toBe('orange');
        });

        it('should throw on invalid box', () => {
            expect(() => Leitner.getNextBox('invalid', true, 1000, 2000))
                .toThrow('Invalid box');
        });
    });

    describe('calculateRestDays', () => {
        it('should return 3-6 days on first green', () => {
            const result = Leitner.calculateRestDays(1000, 2000, 0);
            expect(result).toBeGreaterThan(2);
            expect(result).toBeLessThan(7);
        });

        it('should multiply previous rest days', () => {
            const result = Leitner.calculateRestDays(1000, 2000, 3);
            expect(result).toBeGreaterThan(3);
        });
    });
});
```

---

## Patterns de Test

### 1. Tester les Cas Limites

```javascript
describe('edge cases', () => {
    it('should handle zero', () => {
        expect(XP.calculateLevel(0)).toBe(1);
    });

    it('should handle negative numbers', () => {
        expect(XP.calculateLevel(-100)).toBe(1);
    });

    it('should handle very large numbers', () => {
        expect(XP.calculateLevel(1000000)).toBeGreaterThan(100);
    });

    it('should handle null/undefined', () => {
        expect(() => Leitner.getNextBox(null, true, 1000, 2000)).toThrow();
    });
});
```

### 2. Tester les Objets Complexes

```javascript
describe('complex objects', () => {
    it('should return correct structure', () => {
        const result = Challenges.generateDaily(player);

        expect(result).toHaveLength(3);
        expect(result[0]).toHaveProperty('type');
        expect(result[0].completed).toBe(false);
    });
});
```

### 3. Tester les Fonctions Asynchrones

```javascript
describe('async operations', () => {
    it('should resolve a promise-returning test', async () => {
        // Le runner attend la promesse retournée par le test
        const result = await Promise.resolve(42);
        expect(result).toBe(42);
    });
});
```

### 4. Mock du localStorage

```javascript
describe('Storage', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('should persist data', () => {
        Storage.savePlayer(player);
        // localStorage est un mock en mémoire fourni par le runner
        expect(Storage.loadPlayer().id).toBe(player.id);
    });
});
```

---

## Couverture Actuelle

Le détail par fichier (nombre de tests, module visé) est dans [`tests/INDEX.md`](../tests/INDEX.md) ; il est la seule table à maintenir avec les chiffres.

### Modules de `src/modules/` (27)

Les 27 modules ont chacun au moins un fichier de test (`<module>.test.js`). Correspondances non évidentes :

| Module | Fichiers de test |
|--------|------------------|
| `validator.js` | `validator.test.js`, `answer-check.test.js` (via `GameAnswerValidator`) |
| `text-utils.js` | `text-utils.test.js`, `text-normalization-unicode.test.js` (normalisation, `escapeHtml`, jour local) |
| `deck-validator.js` | `deck-validator.test.js`, `deck-validator-duplicates.test.js`, `deck-validator-hallucinations.test.js`, `deck-validator-readability.test.js` |
| `storage.js` | `storage.test.js`, `storage-integrity.test.js`, `storage-multiplayer.test.js`, `storage-recovery.test.js`, `storage-reset.test.js`, `storage-sanitize.test.js` |
| `compression.js` | `compression.test.js`, `compression-json.test.js` |
| `yaml.js` | `yaml.test.js`, `yaml-export-roundtrip.test.js` |
| `exporter.js` | `exporter.test.js`, `exporter-roundtrip-fields.test.js`, `exporter-xml-safety.test.js` |
| `badges.js`, `challenges.js`, `xp.js` | `badges.test.js`, `challenges.test.js`, `xp.test.js`, `gamification-integrity.test.js`, `gamification-missions.test.js`, `gamification-challenge-mode.test.js` (mode défi) |
| `i18n.js` | `i18n.test.js`, `i18n-language.test.js` (langue par joueur, parité des clés), `i18n-grammatical-form.test.js` (forme grammaticale, pluriels, conventions du dictionnaire français) |
| `lingua-libre.js` | `lingua-libre.test.js`, `lingua-libre-licenses.test.js` |
| `error-handler.js` | `error-handler.test.js`, `error-handler-csp.test.js` |
| `tags.js`, `tags-taxonomy.js` | `tags.test.js`, `tags-taxonomy.test.js` |
| `types.js` | `types.test.js` |

### UI testée

| Fichier | Fichier de test |
|---------|-----------------|
| `page-game.js` | `page-game.test.js` |
| `game/session-manager.js` | `session-manager.test.js` |
| `game/answer-validator.js`, `page-exam.js` | `answer-check.test.js` |
| `page-challenge.js`, `page-challenges.js` | `gamification-challenge-mode.test.js`, `tests/e2e/challenge-mode.spec.cjs` |
| `effects.js` | `effects.test.js` |
| `tutorial.js` | `tutorial.test.js` |
| `components/card-media.js` (`CardMedia`) | `card-media.test.js` |
| `app.js` (`_applyPlayerAppearance`) | `app-appearance.test.js` |
| `charts.js` (jour local) | `charts-local-day.test.js` |
| `page-deck-hub.js` (import YAML) | `deck-hub-import.test.js` |
| accessibilité de l'interface | `ui-a11y-fixes.test.js` |
| échappement HTML des pages et composants | `ui-xss.test.js` |

### UI non testée unitairement

`page-deck-editor.js`, `page-prompt-generator.js` (sauf `prompt-generator/multilingual-creator.js`), `page-home.js`, `page-stats.js`, `page-settings.js` et les autres pages : couvertes par les tests e2e Playwright ou par des tests ciblés listés ci-dessus.

---

## Bonnes Pratiques

### DO ✅

```javascript
// Noms de tests descriptifs
it('should return green when answer is correct and fast', () => {});

// Un seul concept par test
it('should increment XP', () => {
    expect(newXP).toBe(oldXP + 3);
});

// Données de test explicites
const player = {
    stats: { totalXP: 500, totalCardsPlayed: 100 }
};

// Tester les erreurs
expect(() => invalidCall()).toThrow();
```

### DON'T ❌

```javascript
// Noms vagues
it('should work', () => {});

// Plusieurs concepts
it('should increment XP and update level and check badges', () => {});

// Données magiques
expect(result).toBe(42); // D'où vient 42 ?

// Ignorer les erreurs
// Pas de test pour les cas d'erreur
```

---

## Cycle TDD

```
1. 🔴 RED    - Écrire un test qui échoue
2. 🟢 GREEN - Écrire le code minimal pour passer
3. 🔵 REFACTOR - Améliorer sans casser les tests
4. 🔁 REPEAT - Recommencer
```

### Exemple Pratique

```javascript
// 1. RED - Test d'abord
// (fonction fictive, pour illustrer le cycle)
describe('getBonus', () => {
    it('should return 0 for streak < 3', () => {
        expect(Streak.getBonus(2)).toBe(0);  // FAIL - fonction n'existe pas
    });
});

// 2. GREEN - Code minimal
const Streak = {
    getBonus(streak) {
        return 0;  // PASS
    }
};

// 3. Ajouter plus de tests
it('should return 5 for streak >= 3', () => {
    expect(Streak.getBonus(3)).toBe(5);  // FAIL
});

// 4. Implémenter
getBonus(streak) {
    return streak >= 3 ? 5 : 0;  // PASS
}

// 5. Refactorer si nécessaire
// 6. Continuer...
```

---

## Debugging

### Dans le Runner

```javascript
// Ajouter des logs
it('should calculate correctly', () => {
    const result = someFunction(input);
    console.log('Input:', input);
    console.log('Result:', result);
    expect(result).toBe(expected);
});
```

### Cibler un Fichier

`it.only` et `it.skip` ne sont pas implémentés par le runner. Pour n'exécuter qu'un fichier :

```bash
TEST_FILTER=leitner npm test
```

---

## Intégration Continue

### Scripts npm

Source : `package.json` (`test`, `test:browser`, `test:e2e`, `test:e2e:lint`). Description de la CI : "Ce que vérifie la CI".

### Checklist Avant Commit

- [ ] Tous les tests passent (`npm test` ; `npm run test:e2e` si l'interface change)
- [ ] Nouveaux tests pour nouveau code
- [ ] Console.log de debug supprimés

---

**Dernière mise à jour** : 2026-11-22
