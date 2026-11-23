# Tests - Train Your Brain

## Exécution Rapide

```bash
# Tous les tests (Node.js + jsdom) : 2 274 tests, 57 fichiers
npm test                        # = node tests/node-runner.cjs

# Un ou plusieurs fichiers : sous-chaîne du nom de fichier
TEST_FILTER=storage npm test

# End-to-end (Playwright, Chromium, 206 tests, contre index.html : lancer d'abord node scripts/build.js)
npm run test:e2e
E2E_APP=tmp/app.html npm run test:e2e   # contre un autre build
npm run test:e2e:lint                   # contrôle statique des specs

# Runner navigateur (non maintenu : 27 fichiers sur 57, liste de modules partielle)
npm run test:browser            # → http://localhost:3000/tests/runner.html
```

`node-runner.cjs` découvre tous les `tests/*.test.js` et les exécute dans une fenêtre jsdom. Stratégie complète (e2e, CI) : [docs/TESTING_STRATEGY.md](../docs/TESTING_STRATEGY.md).

---

## Structure des Tests

```
tests/
├── node-runner.cjs          # Runner Node.js (npm test)
├── runner.html              # Runner navigateur (liste de scripts propre)
├── test-utils.js            # Framework de test (runner navigateur)
├── *.test.js                # 57 fichiers (table ci-dessous)
└── e2e/                     # Playwright : 9 *.spec.cjs, helpers.cjs, app-path.cjs,
                             # lint-specs.cjs, playwright.config.cjs
```

---

## Fichiers de Test

Nombre de tests au 2026-11-23.

| Fichier | Cible | Tests |
|---------|-------|-------|
| `a11y.test.js` | `a11y.js` accessibilité | 32 |
| `answer-check.test.js` | `GameAnswerValidator.checkAnswer`, examen, défi, `alternatives` | 13 |
| `app-appearance.test.js` | `App._applyPlayerAppearance` : thème et accessibilité par joueur | 5 |
| `audio.test.js` | `audio.js` sons Web Audio | 104 |
| `badges.test.js` | `badges.js` | 48 |
| `card-media.test.js` | `CardMedia` : aucune ressource distante automatique | 15 |
| `challenges.test.js` | `challenges.js` : défis quotidiens, quêtes, mode défi | 22 |
| `charts-local-day.test.js` | `charts.js` : jour local | 5 |
| `compression.test.js` | `compression.js` (LZ-String) | 32 |
| `deck-hub-import.test.js` | `page-deck-hub.js` : import d'un fichier YAML | 4 |
| `deck-validator-duplicates.test.js` | `deck-validator.js` détection de doublons | 31 |
| `deck-validator-hallucinations.test.js` | `deck-validator.js` anti-hallucination | 34 |
| `deck-validator-readability.test.js` | `deck-validator.js` Flesch-Kincaid | 38 |
| `deck-validator.test.js` | `deck-validator.js` structure et score | 49 |
| `effects.test.js` | `ui/effects.js` | 68 |
| `error-handler-csp.test.js` | `ErrorHandler` : aucun gestionnaire en ligne (CSP) | 4 |
| `error-handler.test.js` | `error-handler.js` | 34 |
| `exporter-roundtrip-fields.test.js` | `Exporter` : aucun champ de carte perdu à l'aller-retour | 51 |
| `exporter-xml-safety.test.js` | `Exporter.toMoodleXML` : contenu hostile (CDATA) | 6 |
| `exporter.test.js` | `exporter.js` | 67 |
| `gamification-challenge-mode.test.js` | mode défi : séance normale avec objectif, modes, bonus de 3 XP par jour, entraînement libre, chronomètre | 92 |
| `gamification-integrity.test.js` | XP, série quotidienne, badges, annonces | 75 |
| `gamification-missions.test.js` | missions (défis, quêtes), bilan de séance, badges horaires | 77 |
| `i18n-grammatical-form.test.js` | forme grammaticale au choix (`resolveVariant`, `tn`, réglage par joueur, assainissement), conventions du dictionnaire français | 46 |
| `i18n-language.test.js` | langue par joueur, parité des clés fr/en | 31 |
| `i18n.test.js` | `i18n.js` | 48 |
| `latex.test.js` | `latex.js` | 26 |
| `leitner.test.js` | `leitner.js` | 40 |
| `lingua-libre-licenses.test.js` | `lingua-libre.js` : licences et auteurs des enregistrements | 20 |
| `lingua-libre.test.js` | `lingua-libre.js` | 51 |
| `moodle.test.js` | `moodle.js` | 42 |
| `multilingual.test.js` | `multilingual.js` | 109 |
| `page-game.test.js` | `page-game.js` (intégration) | 73 |
| `prompt-generator.test.js` | `prompt-generator.js` | 16 |
| `prompt-learner.test.js` | `prompt-learner.js` | 31 |
| `router.test.js` | `router.js` | 26 |
| `session-manager.test.js` | `game/session-manager.js` | 29 |
| `state.test.js` | `state.js` | 30 |
| `storage-integrity.test.js` | `storage.js` : `importAll`, corbeille, migration, quota | 10 |
| `storage-multiplayer.test.js` | `storage.js` isolation par joueur | 27 |
| `storage-recovery.test.js` | `storage.js` : récupération depuis les copies de secours (valeur absente, JSON illisible ou tronqué, décompression en échec, structure rejetée), suppressions volontaires, messages au joueur | 135 |
| `storage-reset.test.js` | `storage.js` : réinitialisation et suppression sans donnée orpheline | 15 |
| `storage-sanitize.test.js` | `storage.js` : assainissement typé (import et chargement) | 33 |
| `storage.test.js` | `storage.js` | 65 |
| `tags-taxonomy.test.js` | `tags-taxonomy.js` | 25 |
| `tags.test.js` | `tags.js` | 56 |
| `text-normalization-unicode.test.js` | `TextUtils.normalizeText` Unicode | 55 |
| `text-utils.test.js` | `text-utils.js` | 30 |
| `themes.test.js` | `themes.js` | 61 |
| `tutorial.test.js` | `ui/tutorial.js` | 51 |
| `types.test.js` | `types.js` (syntaxe JSDoc) | 15 |
| `ui-a11y-fixes.test.js` | accessibilité de l'interface (annonces, messages éphémères) | 5 |
| `ui-xss.test.js` | échappement HTML (pages et composants) | 29 |
| `validator.test.js` | `validator.js` | 43 |
| `xp.test.js` | `xp.js` | 39 |
| `yaml-export-roundtrip.test.js` | `Exporter.toYAML`, `YAML.stringifyDeck` (aller-retour) | 36 |
| `yaml.test.js` | `yaml.js` | 20 |
| **Total** | **57 fichiers** | **2 274** |

### Tests e2e (`tests/e2e/`)

| Fichier | Tests |
|---------|-------|
| `challenge-mode.spec.cjs` | 31 |
| `deck-editor.spec.cjs` | 24 |
| `dictation.spec.cjs` | 15 |
| `game.spec.cjs` | 28 |
| `gamification.spec.cjs` | 19 |
| `import-export.spec.cjs` | 16 |
| `missions.spec.cjs` | 17 |
| `navigation.spec.cjs` | 28 |
| `settings.spec.cjs` | 28 |
| **Total** | **206** |

---

## Ajouter un Test

### 1. Structure d'un test

```javascript
describe('NomModule', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  it('should do something', () => {
    const result = Module.method(input);
    expect(result).toBe(expected);
  });
});
```

### 2. Assertions disponibles

```javascript
expect(value).toBe(expected);           // Égalité stricte
expect(value).toEqual(expected);        // Égalité profonde
expect(value).toBeDefined();
expect(value).toBeUndefined();
expect(value).toBeNull();
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toContain(item);
expect(value).toHaveLength(n);
expect(value).toHaveProperty(chemin);
expect(value).toBeInstanceOf(Classe);
expect(value).toBeGreaterThan(n);       // et toBeGreaterThanOrEqual
expect(value).toBeLessThan(n);          // et toBeLessThanOrEqual
expect(value).toBeCloseTo(n, precision);
expect(value).toMatch(regex);
expect(fn).toThrow();
expect(value).not.toBe(x);              // négation
```

### 3. Enregistrer le test

Créer `tests/<nom>.test.js` : le runner Node l'exécute automatiquement (aucune liste à modifier). Si le test cible un module de `src/` ou un fichier UI qui n'est pas encore chargé par le runner, l'ajouter au tableau `modules` de `node-runner.cjs`.

Le runner navigateur `runner.html` garde une liste de balises `<script>` ; il n'est pas maintenu.

---

## Conventions

- **Nommage** : `module-name.test.js`
- **Style** : `describe` / `it` (Jasmine-like), tests asynchrones acceptés (promesse retournée)
- **Données** : fixtures inline ou `beforeEach`
- **Isolation** : chaque test indépendant ; `localStorage` en mémoire remis à zéro entre fichiers

---

## Ressources

- [CLAUDE.md](../CLAUDE.md) - Règles de développement
- [docs/TESTING_STRATEGY.md](../docs/TESTING_STRATEGY.md) - Stratégie TDD

---

**Dernière mise à jour** : 2026-11-22
