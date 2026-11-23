# CLAUDE.md - Train Your Brain

> **Version** : 1.0.0-alpha (`package.json`)
> **Type** : Application HTML/CSS/JS single-file
> **Cible** : Navigateurs modernes, fonctionne en `file://`
> **Langue de conversation** : 🇫🇷 Français
> **Dernière mise à jour** : 2026-11-23

---

## ⚠️ Règles Critiques pour les Instances LLM

```
┌─────────────────────────────────────────────────────────────────┐
│  LIRE CETTE SECTION EN PREMIER - RÈGLES NON NÉGOCIABLES        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. DOCUMENTATION SYNCHRONISÉE                                  │
│     - Toute modification de code → mise à jour docs             │
│     - CLAUDE.md, docs/*.md doivent refléter l'état réel        │
│     - Pas de "je ferai la doc plus tard"                       │
│                                                                 │
│  2. FICHIERS TEMPORAIRES                                        │
│     - Utiliser tmp/ pour tout fichier de travail               │
│     - JAMAIS créer de fichiers .md temporaires à la racine     │
│     - tmp/ est dans .gitignore                                 │
│                                                                 │
│  3. UTILISER LES SUBAGENTS                                      │
│     - Voir .claude/agents/ pour les définitions                │
│     - Déléguer les tâches spécialisées aux agents appropriés   │
│     - Signaler à l'humain quels agents sont utilisés           │
│                                                                 │
│  4. AVANT CHAQUE COMMIT                                         │
│     - Vérifier que la doc est à jour                           │
│     - Exécuter les tests : node tests/node-runner.cjs          │
│     - Vérifier le build : node scripts/build.js                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 🧠 Règle 0 : Honnêteté et Collaboration

```
⚠️ RÈGLE LA PLUS IMPORTANTE - AVANT TOUTES LES AUTRES

✅ Tu as le DROIT de :
   - Ne pas savoir quelque chose
   - Dire "je ne suis pas sûr"
   - Poser des questions à l'humain à tout moment
   - Proposer des alternatives si une implémentation est risquée
   - Suggérer de meilleures solutions que celles demandées

❌ Tu ne dois JAMAIS :
   - Inventer des informations
   - Faire semblant de savoir
   - Implémenter du code dont tu n'es pas sûr sans prévenir
   - Continuer si tu sens que la stabilité de l'app est menacée

📢 COMMUNICATION :
   - Si tu penses qu'une solution est plus pertinente → EXPLIQUE pourquoi
   - Si l'implémentation demandée présente un risque → PROPOSE une alternative
   - Si tu manques d'informations → DEMANDE avant de deviner

⚡ EXCEPTION : Si l'humain dit "travaille en autonomie", tu peux décider seul
   mais la responsabilité des problèmes incombe alors à l'humain.
```

### 📚 Règle 1 : Bonnes Pratiques et Veille Technologique

```
⚠️ TOUJOURS VÉRIFIER LES BONNES PRATIQUES ACTUELLES

1. RECHERCHES WEB OBLIGATOIRES :
   - Chercher les bonnes pratiques de l'ANNÉE EN COURS (2025+)
   - Vérifier les versions compatibles avec le codebase existant
   - S'assurer que l'architecture suit les standards actuels

2. CONFORMITÉ :
   - Aucune règle de ce fichier ne peut contredire les bonnes pratiques
   - Si contradiction détectée → Signaler et proposer une correction
   - Le codebase doit rester à jour des dernières versions stables

3. SOURCES À CONSULTER RÉGULIÈREMENT :
   - Claude Code Best Practices (anthropic.com)
   - Documentation officielle des outils utilisés
   - Standards web actuels (MDN, etc.)
```

### 📝 Règle 2 : DDD - Documentation Driven Development

```
⚠️ LA DOCUMENTATION AVANT LE CODE

Ordre OBLIGATOIRE pour toute nouvelle feature :
1. 📄 Rédiger la DOCUMENTATION (specs, types, comportement attendu)
2. 🧪 Écrire les TESTS (qui échouent)
3. 💻 Écrire le CODE minimal
4. ✅ Vérifier (tests passent)
5. 🔄 Refactorer si nécessaire
6. 📄 Mettre à jour la doc si le comportement a changé

Cela garantit :
- Une réflexion AVANT l'implémentation
- Une documentation toujours à jour
- Un code aligné avec les spécifications
```

### 🧪 Règle 3 : TDD - Test Driven Development

```
⚠️ AUCUN CODE SANS TEST

Cycle obligatoire :
1. ✍️  Écrire le test (qui échoue)
2. 💻 Écrire le code minimal pour faire passer le test
3. ✅ Vérifier (test passe)
4. 🔄 Refactorer
5. ✅ Re-vérifier (tests passent toujours)

Commandes :
- Tests Node.js : node tests/node-runner.cjs
- Tests navigateur : `npm run test:browser` ouvre tests/runner.html (liste de scripts propre, 27 des 57 fichiers, non maintenu)
```

### ✅ Règle 4 : Toujours Utiliser une Todo List

```
⚠️ TRAVAILLER AVEC UNE LISTE DE TÂCHES ÉDITABLES

- Créer une todo list au début de chaque tâche complexe
- L'humain peut modifier cette liste à tout moment
- Mettre à jour les statuts en temps réel
- Ne jamais "oublier" une tâche commencée

Format recommandé :
- [ ] Tâche à faire
- [x] Tâche terminée
- [~] Tâche en cours
- [!] Tâche bloquée (expliquer pourquoi)
```

### 🔄 Règle 5 : Workflows de Communication

```
┌─────────────────────────────────────────────────────────────────┐
│                    WORKFLOWS DE TRAVAIL                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🤖 IA → 🤖 IA (Subagents)                                      │
│  ─────────────────────────                                      │
│  - Utiliser .claude/agents/ pour déléguer                       │
│  - Instructions explicites et complètes                         │
│  - Contexte isolé par agent                                     │
│  - Paralléliser si tâches indépendantes                         │
│                                                                 │
│  🤖 IA → 👤 Humain                                               │
│  ──────────────────                                             │
│  - Résumés clairs et concis                                     │
│  - Proposer des alternatives si pertinent                       │
│  - Signaler les risques et incertitudes                         │
│  - Demander validation avant actions irréversibles              │
│                                                                 │
│  👤 Humain → 🤖 IA                                               │
│  ──────────────────                                             │
│  - L'humain peut interrompre à tout moment                      │
│  - L'humain peut modifier les tâches en cours                   │
│  - L'humain peut demander des explications                      │
│  - Respecter les contraintes explicites de l'humain             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 📁 Règle 6 : Organisation des Fichiers

```
FICHIERS TEMPORAIRES :
- tmp/               → Tous les fichiers de travail (gitignored)
- JAMAIS de .md temporaires à la racine

DOCUMENTATION :
- CLAUDE.md          → Point d'entrée LLM (ce fichier)
- docs/*.md          → Documentation détaillée
- .claude/agents/    → Définitions des subagents

CODE :
- src/modules/       → Logique métier
- src/ui/            → Interface utilisateur
- tests/             → Tests unitaires et d'intégration
```

### ✔️ Règle 7 : Checklist Avant Commit

```
Avant CHAQUE commit, vérifier :

- [ ] Tests passent : node tests/node-runner.cjs
- [ ] Build réussit : node scripts/build.js
- [ ] Documentation à jour (CLAUDE.md, docs/*.md)
- [ ] Pas de fichiers temporaires oubliés
- [ ] Code testé en file:// si modif UI
```

### 🤖 Règle 8 : Gestion Autonome des Agents

```
⚠️ DÉLÉGATION ET CRÉATION D'AGENTS

1. UTILISATION AUTONOME :
   - Tu PEUX déléguer aux agents sans demander permission
   - Utiliser l'agent approprié selon le domaine (voir tableau ci-dessous)
   - Paralléliser si les tâches sont indépendantes

2. TRANSPARENCE OBLIGATOIRE :
   - TOUJOURS signaler à l'humain quels agents tu utilises/as utilisés
   - Format : "🤖 Agent(s) utilisé(s) : [liste]"
   - Résumer brièvement ce que chaque agent a fait

3. CRÉATION DE NOUVEAUX AGENTS :
   - Tu PEUX créer un nouvel agent si aucun existant ne convient
   - Créer dans .claude/agents/ avec le format YAML frontmatter
   - Documenter immédiatement dans CLAUDE.md (section Agents)
   - Informer l'humain de la création

4. RÈGLE FONDAMENTALE - HIÉRARCHIE :
   ┌────────────────────────────────────────────────────────┐
   │  Les agents NE PEUVENT PAS contrevenir aux règles     │
   │  principales (Règles 0-8 de ce fichier)               │
   │                                                        │
   │  En cas de conflit : Règles CLAUDE.md > Instructions agent │
   └────────────────────────────────────────────────────────┘

AGENTS DISPONIBLES :
┌─────────────────────┬────────────────────────────────────────────┐
│ Agent               │ Utiliser pour...                           │
├─────────────────────┼────────────────────────────────────────────┤
│ core-engine         │ Leitner, XP, validation, logique métier    │
│ ui-renderer         │ Composants, pages, CSS, accessibilité      │
│ gamification        │ Badges, défis, quêtes, récompenses         │
│ data-storage        │ Storage, build, YAML, import/export        │
│ qa-tester           │ Tests, qualité, audit, debugging           │
│ doc-keeper          │ Documentation, DRY markdown, cohérence     │
│ i18n                │ Traductions app, docs EN/FR, multilingue   │
│ code-analyzer       │ Call graph, code mort, duplications        │
│ deck-verifier       │ Audit decks, exactitude, cohérence titre   │
│ inclusivity-reviewer│ Langage inclusif, accessibilité, WCAG      │
└─────────────────────┴────────────────────────────────────────────┘
```

---

## Vue d'Ensemble

**Train Your Brain** est une application de révision par flashcards utilisant le système Leitner (répétition espacée). Elle fonctionne **entièrement hors-ligne** dans un navigateur, sans serveur web. Le cahier des charges complet est dans `docs/SPECIFICATIONS.md`.

| Aspect | Choix |
|--------|-------|
| **Framework** | Aucun (Vanilla JS ES2022+) |
| **Build** | Script Node.js (`scripts/build.js`) → `index.html` unique |
| **Storage** | localStorage (compression LZ-String, voir `docs/COMPRESSION.md`) |
| **Routing** | Hash router (`#/page`) |
| **Tests** | Framework maison, exécuté dans une fenêtre jsdom par `tests/node-runner.cjs` |
| **Distribution** | Un seul fichier `index.html` |

### Contrainte Fondamentale

```
⚠️ TOUT DOIT FONCTIONNER EN file://

- Pas de fetch() vers fichiers locaux
- Pas de modules ES externes (import/export)
- Pas de Service Worker
- Tout est INLINE dans le HTML final (modules concaténés par le build)
```

Les fichiers de `src/` sont des scripts classiques qui déclarent des objets globaux (`const Leitner = {...}`). Ils se chargent dans l'ordre de `build.manifest.json` ; un module A qui dépend de B vient après B (exemple : `tags-taxonomy.js` avant `tags.js`).

---

## Structure du Projet

> Détail module par module : `docs/ARCHITECTURE.md`. Ordre de chargement : `build.manifest.json` (source de vérité).

```
train-your-brain/
├── index.html               # GÉNÉRÉ par scripts/build.js (tout inline)
├── build.manifest.json      # Ordre de chargement + vendors (js-yaml, katex)
├── CLAUDE.md / README.md / CONTRIBUTING.md / SECURITY.md / CODE_OF_CONDUCT.md
├── CHANGELOG.md / TODO.md / LICENSE / THIRD-PARTY-NOTICES.md / .nvmrc
│
├── .claude/agents/          # 10 définitions de subagents
├── .github/                 # workflows ci.yml et pages.yml, gabarits d'issues et de PR
├── docs/                    # Documentation détaillée (voir "Ressources")
├── roadmap/                 # Plans futurs (DeckHub), non réalisés
├── examples/                # Démos de détection de doublons
├── site/                    # Sources du site GitHub Pages (page d'accueil, 404, assets)
├── tmp/                     # Fichiers temporaires (gitignored)
│
├── src/
│   ├── modules/             # Logique métier : 27 modules (voir ci-dessous)
│   ├── ui/                  # Interface : 43 fichiers listés dans le manifest
│   └── styles/main.css      # CSS unique
│
├── decks/                   # Decks YAML (decks/maths/, decks/procedural/)
├── tests/                   # 57 fichiers *.test.js + runners + e2e/
└── scripts/                 # build.js, build-site.js, dev-server.js, site-screenshots.cjs,
                             # generators/, outils de décks (download-*, generate-tts-audio)
```

### src/modules/ (27 modules)

`types.js` (JSDoc, source de vérité des types), `i18n.js`, `compression.js`, `error-handler.js`, `a11y.js`, `text-utils.js`, `state.js`, `storage.js`, `leitner.js`, `xp.js`, `validator.js`, `router.js`, `badges.js`, `challenges.js`, `tags-taxonomy.js`, `tags.js`, `themes.js`, `audio.js`, `latex.js`, `yaml.js`, `moodle.js`, `exporter.js`, `lingua-libre.js`, `multilingual.js`, `prompt-generator.js`, `deck-validator.js`, `prompt-learner.js`.

Chaque module exporte un objet global avec des méthodes (privées préfixées `_`) et un export CommonJS conditionnel pour les tests :

```javascript
const Leitner = {
  BOXES: ['never_played', 'purple', 'orange', 'green'],
  getNextBox(currentBox, isCorrect, responseTimeMs, thresholdMs) { /* ... */ },
  _calculateCoefficient(responseTimeMs, thresholdMs) { /* ... */ }
};
if (typeof module !== 'undefined') module.exports = Leitner;
```

### src/ui/ (43 fichiers)

| Zone | Fichiers |
|------|----------|
| Base | `components.js` (dont `escapeHtml`, qui délègue à `TextUtils`), `pages-base.js` (objet `Pages`), `page-utils.js`, `app.js` (bootstrap, en dernier) |
| Composants | `components/card-media.js`, `deck-table.js`, `tag-selector.js` |
| Services UI | `effects.js`, `tutorial.js`, `charts.js` |
| Jeu | `page-game.js` + `game/*.js` (6 fichiers) |
| Éditeur de deck | `page-deck-editor.js` + `deck-editor/*.js` (3 fichiers) |
| Générateur de prompts | `page-prompt-generator.js` + `prompt-generator/*.js` (5 fichiers) |
| Pages | `page-splash`, `home`, `explore`, `stats`, `settings`, `exam`, `challenge`, `challenges`, `badges`, `session-summary`, `deck-resources`, `deck-review`, `deck-hub`, `deck-merger`, `multilingual-config`, `multilingual-creator` |

Chaque `page-*.js` ajoute une propriété à l'objet `Pages` (`Pages.game = { render, mount }`). Il n'existe plus d'outils de visualisation interactifs : ils ont été retirés par le commit `1c85f61` (2025-12-19).

### Flux de Données

```
Action utilisateur → State.set() → abonnés notifiés → rendu de la page
                          └──→ Storage.save*()
```

---

## Commandes

| Commande | Effet |
|----------|-------|
| `node scripts/build.js` (ou `npm run build`) | Génère `index.html` à la racine |
| `node scripts/build.js --output tmp/app.html` | Construit ailleurs (`--output` ou `-o`) ; à préférer pour un essai |
| `node scripts/build.js --minify` | Build minifié |
| `node scripts/build.js --validate` / `--strict` / `--skip-validation` | Validation des decks seule / bloquante / désactivée |
| `npm run build:prod` | Build minifié, puis JSDoc dans `docs/api/` (ignoré par git) |
| `npm run build:site` | Construit `_site/` (page d'accueil `site/`, application minifiée dans `app/`, JSDoc dans `api/`) ; échoue si JSDoc échoue |
| `npm run dev` | Construit dans `.dev/`, sert `http://localhost:3000`, reconstruit quand `src/`, `decks/` ou le manifest changent (rechargement du navigateur à la main) |
| `npm test` (= `node tests/node-runner.cjs`) | Tous les `tests/*.test.js` (2 433 tests, 57 fichiers) |
| `TEST_FILTER=storage npm test` | Fichiers dont le nom contient la sous-chaîne |
| `npm run test:e2e` | Playwright, Chromium seul (208 tests, 9 specs), contre `index.html` en `file://` : construire d'abord |
| `E2E_APP=tmp/app.html npm run test:e2e` | Même suite contre un autre build (chemin relatif au dossier courant) |
| `npm run test:e2e:lint` | Contrôle statique des specs e2e (`tests/e2e/lint-specs.cjs`) |
| `npm run test:browser` | `scripts/dev-server.js --test` : sert le dépôt, page `tests/runner.html` (voir Règle 3) |
| `npm run docs` | JSDoc → `docs/api/` |

La CI (`.github/workflows/ci.yml`, à chaque push et pull request) lance les tests unitaires, un build minifié, le contrôle des specs e2e, les tests e2e et `npm run build:site`. `pages.yml` déploie le site depuis `main` si les tests passent. Node : version de `.nvmrc`.

Le comportement du build (échecs, ordre déterministe, `SOURCE_DATE_EPOCH`, priorité des decks, notices tierces, CSP) est décrit dans `docs/BUILD_VALIDATION.md`. Les tests sont décrits dans `docs/TESTING_STRATEGY.md`.

---

## Règles de Développement

### Conventions de Code

- JavaScript : fonctions pures quand c'est possible, nommage explicite, JSDoc sur les méthodes publiques, types dans `src/modules/types.js`.
- CSS : variables CSS (`--color-*`), nommage BEM simplifié (`.card__question`, `.card--correct`).
- Rendu déclaratif : chaque page expose `render(state)` qui retourne du HTML et `mount(container, state)` qui branche les événements après insertion dans le DOM.
- Après toute modification d'état persistant : `State.set(...)` puis `Storage.save*(...)`.

### Les 4 Boîtes Leitner

> Algorithme complet : `docs/LEITNER_SYSTEM.md`

| Boîte | Jouable |
|-------|---------|
| `never_played` | Toujours |
| `purple` | Toujours |
| `orange` | Toujours |
| `green` | Après repos ; elle retourne alors dans `never_played` |

Ordre de pioche : `never_played` → `purple` → `orange`. Transitions (`Leitner.getNextBox`) : réponse fausse → `purple` ; première réussite → `green` ; réussite rapide (temps ≤ seuil) → `green` ; réussite lente → `orange`. Le seuil de latence est propre à chaque carte.

### Gamification

> Barèmes, badges et défis : `docs/GAMIFICATION.md`

- XP par carte : purple +1, orange +2, green +3 ; bonus de série de cartes vertes (`XP.STREAK_BONUSES`).
- Niveau : `Math.floor(Math.sqrt(totalXP / 100)) + 1` (`XP.calculateLevel`).
- Missions propres au joueur (`player.missions`) : défis quotidiens `review_due`, `accuracy`, `green_streak` et quêtes hebdomadaires (`challenges.js`). Le mode défi est une séance de révision normale avec un objectif (`session.challenge`, pas de seconde logique de progression), en quatre modes (`Challenges.CHALLENGE_MODES` : `steady` Parcours, `perfect` Sans erreur, `speed` Contre la montre, `endurance` Jusqu'au bout) ; seul `speed` a un chronomètre, jamais présélectionné ni proposé avec le mode dyslexie ou l'espacement large ; accès par la page des défis et l'action « Défi » d'une ligne de deck (spécification : `docs/GAMIFICATION.md`, « Mode défi »).

### Normalisation et Validation des Réponses

> Détail : `docs/SPECIFICATIONS.md` (section 2.5)

- `TextUtils.normalizeText` (`src/modules/text-utils.js`) est l'unique normalisation (trait d'union et apostrophe entre deux lettres valent une espace) ; `Validator.normalizeText` et `DeckValidator` y délèguent. Ne pas la réimplémenter.
- Le champ `alternatives` d'une carte est une bonne réponse. `GameAnswerValidator.checkAnswer` (`src/ui/game/answer-validator.js`) est le point d'entrée partagé par le jeu, l'examen et le défi.

### Settings de Deck

Les settings du deck surchargent les valeurs par défaut de l'application. Priorité : `deck.settings.*`, puis `player.settings.*`, puis valeur par défaut.

```javascript
const cards = Leitner.getCardsForSession(deck, {
  today,
  maxCards: deck.settings?.maxCards ?? 100,
  sequential: deck.settings?.sequential ?? false
});
```

Settings disponibles : `sequential`, `bidirectional`, `maxCards`, `similarityMatching`, `similarityThreshold` (0.0-1.0, défaut 0.8). Définition : `DeckSettings` dans `types.js`.

---

## Modèles de Données

> **Source de vérité : `src/modules/types.js`** (typedefs JSDoc : `Player`, `PlayerStats`, `Deck`, `Card`, `GameSession`, `BadgeDefinition`, `DailyChallenge`, `Tag`, etc.). Les IDE offrent l'autocomplétion à partir de ces définitions.

---

## Pièges à Éviter

### 1. Échappement HTML

Tout contenu venant d'un deck, d'un import ou de l'utilisateur est échappé avant insertion dans `innerHTML`, y compris dans les attributs. `TextUtils.escapeHtml` (`src/modules/text-utils.js`) est l'implémentation unique (`& < > " '`, sans DOM) ; l'`escapeHtml` de `src/ui/components.js` y délègue. Ne pas en réécrire une. Test de référence : `tests/ui-xss.test.js`.

```javascript
container.innerHTML = `<div title="${escapeHtml(card.hint)}">${escapeHtml(card.question)}</div>`;
```

### 2. Contraintes `file://` et réseau

Aucun `fetch()` vers un fichier local, aucun `import`/`export` ES : les données sont embarquées par le build (`DECKS`, `MEDIA`) et les modules sont concaténés. Aucune ressource distante n'est chargée automatiquement : les médias de carte passent par `CardMedia` (`src/ui/components/card-media.js`), qui n'affiche que `data:` et `blob:` et remplace une URL `http(s)` par un lien explicite.

### 3. Content-Security-Policy du build

Le build écrit une CSP dans `index.html` (empreinte du script unique, aucun `unsafe-inline` pour les scripts). Pas de script ni de gestionnaire en ligne (`onclick="…"`) dans le code généré : utiliser `addEventListener`. Un gestionnaire en ligne dynamique (`${...}`) fait échouer le build. Détail : `docs/ARCHITECTURE.md`.

### 4. Stats de Session vs Stats Globales

Les défis quotidiens se calculent sur `session.stats.*`, pas sur `player.stats.*` (cumul global).

### 5. Persistance et Champs du Joueur

- `State.set('player', p)` ne sauvegarde pas : appeler aussi `Storage.savePlayer(p)`.
- Tout champ écrit sur `player.stats` est déclaré dans `Storage.PLAYER_STATS_TYPES` (et dans `PlayerStats` de `types.js`) ; sinon l'assainissement le supprime au chargement (`tests/storage-sanitize.test.js` le vérifie). Les données importées sont non fiables.

### 6. Settings Hardcodés

Lire `deck.settings?.x ?? défaut` au lieu de figer une valeur (voir "Settings de Deck").

### 7. Ordre de Chargement et Manifest

Une erreur `X is not defined` signale un ordre de chargement incorrect dans `build.manifest.json`. Le build échoue (code 1) si le manifest cite un fichier absent ; après suppression ou renommage d'un fichier, mettre à jour le manifest et la liste `modules` de `tests/node-runner.cjs`.

### 8. Progression par Joueur

La progression des decks est stockée par joueur (`tyb_pdeck_{playerId}_{deckId}`, multilingue `tyb_pml_{playerId}_{deckId}`). `Storage.saveDeckProgress(deckId, cards, forPlayerId)` accepte un joueur explicite (utilisé par `importAll`). Les données legacy globales (`tyb_deck_*`) ne sont plus migrées vers un joueur. Détail : `docs/ARCHITECTURE.md`.

### 9. Identifiants Stables

Les identifiants de cartes et de decks ne changent pas : la progression des joueurs en dépend. Corriger un contenu sans renommer son `id`.

### 10. Textes Visibles et Langue

Tout texte visible passe par `_t()` (`PageUtils.getTranslator()`), avec la clé en français et en anglais dans `i18n.js` (un test vérifie la parité). La langue est un réglage du joueur (`player.settings.language` : `fr`, `en` ou automatique).
Le français s'adresse au joueur en le tutoyant. Préférer une formulation sans accord ; sinon une valeur à variantes `{ f, m, x }` (féminin par défaut, selon `player.settings.grammaticalForm`, résolue par `i18n.resolveVariant`). Les pluriels passent par `i18n.tn` (clés `<clé>One` / `<clé>Many`), jamais « (s) ».

### 11. Jour Local

Le jour du joueur est local : `TextUtils.getToday()` / `getLocalDateString()`, jamais `toISOString().split('T')[0]` (UTC).

### 12. Types JSDoc

Les types de `types.js` restent en syntaxe JSDoc valide (pas de `champ?: type` ni de `type[]` sur un objet littéral) : sinon `npm run build:site` échoue.

### 13. Générateurs de Decks

Les générateurs (`scripts/generators/`) sont déterministes : PRNG à graine `BaseGenerator.createRng`, jamais `Math.random()`. À identifiant égal, le YAML de `decks/` l'emporte sur le deck généré (voir `docs/BUILD_VALIDATION.md`). `BaseGenerator.finalizeDeck` (appelé par `buildDeck` et `buildDecks`) complète `category` avec les `tags` présents dans la taxonomie (matière, thème, niveau scolaire) : l'explorateur ne filtre que sur `category`. Un niveau scolaire est un identifiant de `tags-taxonomy.js`, pas un âge.

### 14. Sauvegardes de Secours

`Storage` copie la valeur précédente dans `tyb_backup_{clé}` avant chaque écriture (profil, liste des joueurs, progression, decks personnalisés) et, à la lecture, retombe sur cette copie seulement si la valeur courante est inutilisable. Toute suppression volontaire retire aussi la copie (`_removeWithBackup`), sinon la donnée ressusciterait. Détail : `docs/ARCHITECTURE.md`, « Copies de secours et récupération ».

### 15. Tests avec Attentes Obsolètes

Un test qui échoue est soit un bug du code, soit un test périmé : investiguer avant de modifier l'un ou l'autre.

### 16. Commits Partagés entre Agents

Un `git commit` sans liste de fichiers emporte tout ce qui est indexé, y compris les `git rm` d'un autre agent : contrôler `git diff --cached --name-only` avant de valider.

### 17. Sons : Passer par l'Enveloppe Commune

Toute voix de `src/modules/audio.js` passe par `Audio._scheduleEnvelope` (attaque d'au moins 12 ms, retour à 0, `stop()` après le relâchement) et se connecte à `Audio._output()` (bus, compresseur doux, volume du joueur). Ne pas programmer de rampes à la main : un `stop()` avant la fin du relâchement fait un clic, un temps négatif lève un `RangeError`. Pas d'onde carrée ni en dents de scie sans filtre.

### 18. Animations CSS : Courbe Seule dans `animation`

Écrire la courbe avec `var(--ease-bounce)` (fonction de temps seule). `--transition-*` contient une durée : placé après une durée dans `animation`, il devient un délai (c'était la cause du saut du tutoriel), et deux délais rendent la déclaration invalide.

---

## Utilisation des Subagents

> Définitions : `.claude/agents/*.md` (YAML frontmatter + instructions). Règle d'usage : Règle 8.

### Quand Déléguer

| Modification | Agent |
|--------------|-------|
| `src/modules/leitner.js`, `xp.js`, `validator.js`, `text-utils.js` | core-engine |
| `src/modules/badges.js`, `challenges.js` | gamification |
| `src/ui/**/*.js`, `src/styles/` | ui-renderer |
| `src/modules/storage.js`, `yaml.js`, `scripts/` (build, site) | data-storage |
| `tests/*.test.js`, `tests/e2e/` | qa-tester |
| `CLAUDE.md`, `docs/*.md`, `README.md` | doc-keeper |
| `src/modules/i18n.js`, traductions | i18n |
| Dépendances, code mort, refactoring | code-analyzer |
| Contenu des decks (`decks/`, générateurs) | deck-verifier |
| Langage inclusif, accessibilité | inclusivity-reviewer |

`.github/` et `site/` n'ont pas d'agent dédié.

Bonnes pratiques : paralléliser les agents sur des tâches indépendantes, donner des instructions explicites (chaque agent a son propre contexte), pas d'imbrication d'agents.

---

## Workflow Git

### Branches

- `main` : branche stable ; chaque push y déploie le site (`pages.yml`).
- Le travail se fait sur des branches de tâche (les sessions d'assistants utilisent `claude/<nom>`). Il n'existe pas de branche `dev`.

### Commits

Format : `type: description courte`

Types :
- `feat` : Nouvelle fonctionnalité
- `fix` : Correction de bug
- `refactor` : Refactoring
- `test` : Ajout/modification de tests
- `docs` : Documentation
- `build` : Scripts de build

---

## Checklist Avant Commit

- [ ] Tests écrits et passent (`node tests/node-runner.cjs`)
- [ ] Code sans erreurs console
- [ ] Build réussit (`node scripts/build.js`)
- [ ] `index.html` testé en file://
- [ ] **Documentation synchronisée** (voir section suivante)

---

## Maintenance de la Documentation

```
⚠️ TOUTE MODIFICATION DE CODE = MISE À JOUR DE LA DOC
Pas d'exception. Pas de "plus tard".
```

| Changement | Mettre à jour |
|------------|---------------|
| Nouveau module ou page UI | "Structure du Projet" ci-dessus + `docs/ARCHITECTURE.md` + `build.manifest.json` |
| Changement d'algorithme | Section concernée + `docs/LEITNER_SYSTEM.md` / `docs/GAMIFICATION.md` |
| Feature ajoutée/supprimée | `docs/SPECIFICATIONS.md` |
| Approche de test | `docs/TESTING_STRATEGY.md`, `tests/INDEX.md` |
| Build, validation de decks | `docs/BUILD_VALIDATION.md` |
| Changement notable | `CHANGELOG.md` |
| Nouveau piège identifié | "Pièges à Éviter" |

**Fichiers temporaires** : tout dans `tmp/` (gitignored), jamais de `.md` temporaire à la racine.

**Signes de dérive** : un fichier cité n'existe plus ; un compteur (tests, modules, fichiers UI) ne correspond plus au dépôt ; une feature décrite a été retirée ; la liste des fichiers ≠ `build.manifest.json`.

### Sources de Vérité

| Aspect | Source |
|--------|--------|
| Types et structures | `src/modules/types.js` |
| Ordre de chargement, vendors | `build.manifest.json` |
| Version | `package.json` |
| Scripts et commandes | `package.json` |
| Compteurs de tests | `tests/INDEX.md` |
| Agents | `.claude/agents/*.md` |
| Formules métier | Code source |

---

## Ressources

### Documentation (`docs/`)
- `ARCHITECTURE.md` : architecture, modules, stockage, build
- `SPECIFICATIONS.md` : cahier des charges
- `LEITNER_SYSTEM.md`, `GAMIFICATION.md` : algorithmes et barèmes
- `TESTING_STRATEGY.md` (et `tests/INDEX.md`) : tests
- `IMPLEMENTATION_GUIDE.md` : guide d'implémentation (historique, non maintenu)
- `COMPRESSION.md`, `ERROR_HANDLING.md` : compression localStorage, gestion d'erreurs
- `VALIDATION_RESEARCH.md` : validation des réponses
- `DUPLICATE_DETECTION.md`, `FLESCH_KINCAID.md`, `HALLUCINATION_DETECTION.md`, `BUILD_VALIDATION.md` : validateur de decks et build
- `MULTILINGUAL_VOCABULARY.md`, `PROMPT_LEARNER_V2.md` : multilingue, prompts IA
- `DECK_GENERATION_IMPROVEMENT_PLAN.md`, `FEATURES_COMPARISON.md`, `ROADMAP.md`, `deckhub/` : plans et comparaisons, non maintenus
- `CODE_ANALYSIS.md` : code mort et duplications restants
- JSDoc : généré par `npm run docs` dans `docs/api/` (ignoré par git, absent d'un clone neuf) ; publié avec le site (`api/`)

### Ressources Externes
- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Subagents Documentation](https://code.claude.com/docs/en/sub-agents)
