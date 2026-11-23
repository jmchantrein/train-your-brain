# Architecture Technique

## Vue d'Ensemble

Train Your Brain est une application single-page en HTML/CSS/JavaScript vanilla, conçue pour fonctionner en mode `file://` sans serveur web.

```
┌─────────────────────────────────────────────────────────────────┐
│                        NAVIGATEUR                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                    index.html                           │  │
│   │  ┌─────────────────────────────────────────────────┐   │  │
│   │  │                    <style>                      │   │  │
│   │  │                    CSS inline                   │   │  │
│   │  └─────────────────────────────────────────────────┘   │  │
│   │                                                         │  │
│   │  ┌─────────────────────────────────────────────────┐   │  │
│   │  │                   <script>                      │   │  │
│   │  │                                                 │   │  │
│   │  │   DECKS = [...]        // Données embarquées   │   │  │
│   │  │   MEDIA = {...}        // Base64 inline        │   │  │
│   │  │                                                 │   │  │
│   │  │   ┌─────────────────────────────────────────┐  │   │  │
│   │  │   │              MODULES                    │  │   │  │
│   │  │   │  State | Router | Storage | Leitner    │  │   │  │
│   │  │   │  XP | Badges | Challenges | Validator  │  │   │  │
│   │  │   │  YAML | Tags | Audio                   │  │   │  │
│   │  │   └─────────────────────────────────────────┘  │   │  │
│   │  │                                                 │   │  │
│   │  │   ┌─────────────────────────────────────────┐  │   │  │
│   │  │   │                 UI                      │  │   │  │
│   │  │   │  Components | PageUtils | Pages        │  │   │  │
│   │  │   │  (Game | DeckEditor | PromptGenerator) │  │   │  │
│   │  │   └─────────────────────────────────────────┘  │   │  │
│   │  │                                                 │   │  │
│   │  │   App.init()           // Point d'entrée       │   │  │
│   │  └─────────────────────────────────────────────────┘   │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │                    localStorage                         │  │
│   │  tyb_player_* | tyb_pdeck_* | tyb_settings | ...       │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Contraintes Techniques

### Mode file://

L'application doit fonctionner en ouvrant directement le fichier HTML :

| Contrainte | Impact | Solution |
|------------|--------|----------|
| Pas de fetch() | Impossible de charger fichiers | Tout embarquer |
| Pas d'ES modules | import/export bloqué | Concaténer les scripts |
| Pas de Service Worker | Pas de cache avancé | localStorage |
| CORS strict | Pas de ressources externes | Base64 inline |

### Navigateurs Cibles

- Chrome 90+
- Firefox 90+
- Edge 90+
- Safari 15+

### Fonctionnalités ES2022+

- Nullish coalescing (`??`)
- Optional chaining (`?.`)
- Private class fields (`#field`)
- Top-level await (en module uniquement)
- Array.at()

---

## Modules

### Dépendances entre Modules

```
                    ┌─────────────┐
                    │    App      │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
   ┌─────────┐       ┌─────────┐       ┌─────────┐
   │  State  │◄──────│  Router │       │   UI    │
   └────┬────┘       └─────────┘       └────┬────┘
        │                                    │
        │    ┌───────────────────────────────┘
        │    │
        ▼    ▼
   ┌─────────────────────────────────────────────┐
   │              Logique Métier                 │
   │  Leitner | XP | Badges | Challenges         │
   │  Validator | Audio                          │
   └─────────────────────────────────────────────┘
        │
        ▼
   ┌─────────┐
   │ Storage │
   └─────────┘
```

### Responsabilités

#### Modules Métier (src/modules/)

| Module | Responsabilité |
|--------|----------------|
| `types.js` | Définitions JSDoc (source de vérité des types) |
| `i18n.js` | Internationalisation (FR/EN) ; langue et forme grammaticale par joueur (`player.settings.language`, `player.settings.grammaticalForm` ; voir « Internationalisation ») |
| `compression.js` | Compression localStorage (LZ-String) |
| `error-handler.js` | Gestion d'erreurs centralisée |
| `a11y.js` | Accessibilité (ARIA, navigation clavier) |
| `text-utils.js` | Utilitaires texte, implémentation unique : `normalizeText`, `escapeHtml`, `shuffleArray`, `levenshteinDistance`, `slugify`, jour local (`getToday`, `getLocalDateString`) |
| `state.js` | État global réactif avec subscriptions |
| `storage.js` | Persistence localStorage : progression par joueur, assainissement typé, backups, corbeille, import/export (voir "Stockage") |
| `leitner.js` | Algorithme de répétition espacée |
| `xp.js` | Calculs XP et niveaux |
| `validator.js` | Validation des réponses utilisateur (`normalizeText` délègue à `TextUtils`) |
| `router.js` | Navigation par hash (#/page) |
| `badges.js` | Système de badges (43 badges) |
| `challenges.js` | Missions du joueur (défis quotidiens, quêtes hebdomadaires) et mode défi |
| `tags-taxonomy.js` | Taxonomie hiérarchique des tags |
| `tags.js` | Système de tags/filtrage |
| `themes.js` | Thèmes visuels (dark/light) |
| `audio.js` | Sons Web Audio API. Chaîne de sortie : voix → `_bus` → compresseur doux (`DynamicsCompressor`) → `_masterGain` (volume du joueur) → sortie ; sans compresseur disponible, le bus se branche sur le gain maître. Enveloppe commune `ENVELOPE` appliquée par `_scheduleEnvelope` (départ et retour à 0, oscillateur arrêté après le relâchement). |
| `latex.js` | Rendu LaTeX (KaTeX) |
| `yaml.js` | Parser/sérialiseur YAML ; `YAML.parseDeck` restitue le bloc `metadata` du deck |
| `moodle.js` | Import/export format Moodle XML |
| `exporter.js` | Export decks (YAML, JSON, Moodle) ; `Exporter._metadataToYAML` sérialise `deck.metadata` (licence et source conservées, aucun bloc sans métadonnées) |
| `lingua-libre.js` | Audio Lingua Libre (API Wikimedia) |
| `multilingual.js` | Decks multilingues (plusieurs langues) |
| `prompt-generator.js` | Génération prompts LLM pour création decks |
| `deck-validator.js` | Validation decks, doublons, anti-hallucination, Flesch-Kincaid (normalisation via `TextUtils`) ; chargé aussi par le build (`scripts/deck-validator-loader.cjs`) |
| `prompt-learner.js` | Apprentissage de prompts IA |

#### Interface Utilisateur (src/ui/)

| Module | Responsabilité |
|--------|----------------|
| `components.js` | Composants de base (header, navbar, etc.) et helper `escapeHtml` (délègue à `TextUtils.escapeHtml`) |
| `components/card-media.js` | `CardMedia` : rendu des médias de carte, sans requête réseau automatique |
| `components/deck-table.js` | Table de decks (extraction) |
| `components/tag-selector.js` | Sélecteur de tags (extraction) |
| `pages-base.js` | Déclaration objet `Pages` vide |
| `page-utils.js` | Utilitaires partagés entre pages |
| `effects.js` | Effets visuels (confettis, particles) |
| `tutorial.js` | Système de tutoriels interactifs. Le tutoriel construit sa fenêtre une fois par ouverture (`_buildShell`) : les cartes sont empilées dans une cellule de grille (hauteur de la plus haute) et `_renderStep` ne change que des classes et des attributs, sans remplacer de nœud. Focus piégé dans la fenêtre et rendu à l'élément d'origine à la fermeture ; une annonce par carte (`tutorial.stepAnnounce`). |
| `charts.js` | Graphiques statistiques (canvas) |
| **Page Game (modulaire)** | |
| `game/card-type-renderer.js` | Rendu carte selon type (text, qcm, etc.) |
| `game/answer-extractor.js` | Extraction réponse utilisateur |
| `game/answer-validator.js` | Validation et feedback |
| `game/session-tracker.js` | Suivi session (stats temps réel) |
| `game/secret-stats.js` | Stats cachées pour achievements |
| `game/session-manager.js` | Orchestration de session |
| `page-game.js` | Page de jeu (assembly) |
| **Éditeur Deck (modulaire)** | |
| `deck-editor/card-renderer.js` | Rendu carte en mode édition |
| `deck-editor/card-binder.js` | Binding événements carte |
| `deck-editor/sync-controller.js` | Sync YAML ↔ JSON en temps réel |
| `page-deck-editor.js` | Page éditeur split-view (assembly) |
| **Générateur Prompts (modulaire)** | |
| `prompt-generator/dictation-mode.js` | Mode dictée vocale |
| `prompt-generator/multilingual-creator.js` | Création de decks multilingues depuis le générateur |
| `prompt-generator/form-renderer.js` | Rendu formulaire génération |
| `prompt-generator/yaml-editor-renderer.js` | Rendu éditeur YAML |
| `prompt-generator/yaml-editor-logic.js` | Logique éditeur YAML |
| `page-prompt-generator.js` | Page générateur (assembly) |
| **Autres Pages** | |
| `page-splash.js` | Écran de démarrage |
| `page-home.js` | Page d'accueil |
| `page-explore.js` | Exploration et recherche de decks |
| `page-stats.js` | Statistiques joueur |
| `page-settings.js` | Paramètres utilisateur |
| `page-multilingual-config.js` | Configuration deck multilingue |
| `page-multilingual-creator.js` | Créateur deck multilingue |
| `page-exam.js` | Mode examen (évaluation) |
| `page-challenge.js` | Mode défi : choix du mode (`Pages.challengeSetup`), écran de jeu (`Pages.challengeGame`, hérite de `Pages.game`), page de fin (`Pages.challengeResults`) |
| `page-session-summary.js` | Résumé détaillé de session |
| `page-deck-resources.js` | Ressources pédagogiques d'un deck |
| `page-deck-review.js` | Consultation des cartes Q/R d'un deck |
| `page-badges.js` | Collection de badges |
| `page-challenges.js` | Missions (défis quotidiens, quêtes) et point d'entrée du mode défi |
| `page-deck-hub.js` | Hub de gestion decks |
| `page-deck-merger.js` | Fusion de plusieurs decks |
| `app.js` | Bootstrap et initialisation (EN DERNIER) |

---

## Flux de Données

### Unidirectionnel

```
User Action → State.set() → Notify Subscribers → UI Update
                  │
                  └──→ Storage.save()
```

### Exemple : Réponse à une Carte

```
1. L'utilisateur valide sa réponse
   │
2. GameAnswerValidator.checkAnswer(card, userAnswer, deck)   (utilise Validator)
   │
3. Leitner.getNextBox(card.box, isCorrect, time, threshold)
   │
4. XP.calculateXpForCard(newBox) (+ bonus de série)
   │
5. « Continuer » : GameSessionManager.nextCard(state)
   │    ├─ Storage.saveDeckProgress(deckId, cards)
   │    ├─ XP crédité au joueur, stats du joueur mises à jour
   │    ├─ Challenges.recordCard(player, ...)   (missions du jour)
   │    ├─ GameSessionManager.awardBadges(player, session, ...)
   │    └─ Storage.savePlayer(player) puis State.set('player', player)
   │
6. Dernière carte : GameSessionManager.endSession(state)
        └─ Challenges.updateWeekly(...) (quêtes), badges de fin de séance
```

Le détail de l'ordre des opérations est dans `docs/GAMIFICATION.md`.

### Mode défi

Un défi est une séance de révision normale avec un objectif : `Challenges.createChallengeSession` construit une séance ordinaire et y ajoute `session.challenge`. Les réponses, la progression des cartes, le repos, l'XP et les badges passent par le même code que le jeu (`GameAnswerValidator`, `GameSessionManager`) : il n'existe pas de seconde implémentation de la progression. Seuls l'écran et la page de fin diffèrent. Routes (`src/ui/app.js`) : `#/challenge-setup/:deck`, `#/challenge/:mode/:niveau/:deck[/timed]`, `#/challenge-results`. Accès par la page des défis et par l'action « Défi » d'une ligne de deck. Règles, récompense et API : `docs/GAMIFICATION.md`, section « Mode défi ».

---

## Structure du Code

### Ordre de Chargement

> **Source de vérité** : `build.manifest.json`

L'ordre de chargement est critique car les modules dépendent les uns des autres.

**Structure** :
- `modules.order` : 27 modules métier (`types.js` → `prompt-learner.js`)
- `ui.order` : 43 fichiers UI (`components.js` → `app.js`)
- `vendor` : js-yaml et KaTeX, inclus avant les modules

**Règle importante** : Si un module A dépend de B, B doit être chargé AVANT A.
Exemple : `tags-taxonomy.js` AVANT `tags.js`.

**Principe clé** : Chaque fichier `page-*.js` ajoute une propriété à l'objet `Pages` déclaré dans `pages-base.js` :

```javascript
// pages-base.js
const Pages = {};

// page-game.js
Pages.game = { render(state) { ... }, mount(container, state) { ... } };

// page-deck-editor.js
Pages.deckEditor = { render(state) { ... }, mount(container, state) { ... } };

// etc.
```

**Architecture modulaire** : Les pages complexes sont refactorées en sous-modules :

- `page-game.js` utilise `game/*.js` (6 modules)
- `page-deck-editor.js` utilise `deck-editor/*.js` (3 modules)
- `page-prompt-generator.js` utilise `prompt-generator/*.js` (5 modules)
- `components.js` délègue à `components/*.js` (4 modules)

---

## Patterns de Code

### Module Pattern

Chaque module est un objet avec des méthodes :

```javascript
const ModuleName = {
  // Constantes
  CONSTANT: 'value',

  // Méthodes publiques
  publicMethod() {
    return this._privateMethod();
  },

  // Méthodes privées (convention _)
  _privateMethod() {
    return 'internal';
  }
};
```

### State Réactif

```javascript
// Subscription
const unsubscribe = State.subscribe('player', (player) => {
  updatePlayerUI(player);
});

// Mise à jour (déclenche les callbacks)
State.set('player', newPlayer);

// Cleanup
unsubscribe();
```

### Rendu Déclaratif

```javascript
// Render = fonction pure qui retourne du HTML
function render(data) {
  return `<div>${escapeHtml(data.value)}</div>`;
}

// Mount = attache les événements
function mount(container, data, callbacks) {
  container.innerHTML = render(data);
  container.querySelector('button')
    .addEventListener('click', callbacks.onClick);
}
```

---

## Internationalisation

- **Dictionnaires** : `i18n.js` contient un dictionnaire français et un dictionnaire anglais de 1 089 clés chacun ; un test vérifie la parité. Une clé absente d'une langue retombe sur le français.
- **Langue par joueur** : `player.settings.language` (`fr`, `en`, automatique).
- **Forme grammaticale par joueur** : `player.settings.grammaticalForm` (`feminine` par défaut, `masculine`, `inclusive` pour le point médian), validé par `Storage.sanitizeSettings` (toute autre valeur redevient `feminine`). Une valeur de dictionnaire est soit une chaîne, soit des variantes `{ f, m, x }` (`TranslationVariants` dans `types.js`) ; `i18n.t` choisit la variante par `i18n.resolveVariant`, seul endroit où elle est choisie. Une formulation sans accord reste préférée : peu de clés portent des variantes. Le sélecteur de la page des paramètres n'apparaît qu'en français (l'anglais ignore le réglage).
- **Pluriels** : `i18n.tn(base, n, params)` choisit `<base>One` ou `<base>Many` (français : singulier pour 0 et 1 ; anglais : pour 1 seulement) et passe `count` en paramètre.
- **Application** : `i18n.applyPlayerLanguage(player)` applique langue et forme au démarrage et à chaque changement de `player` dans `State` (sélection, création, import, réglages, `src/ui/app.js`) ; les écouteurs de `i18n` sont notifiés quand l'une des deux change, et la page se redessine.
- **Reste en français quand l'interface est en anglais** : le contenu des decks, les libellés de la taxonomie de tags (`tags-taxonomy.js`), le formulaire du générateur de consignes (`prompt-generator.js`) et les messages du validateur de decks.

---

## Performance

### Optimisations

1. **Rendu ciblé** : Mettre à jour uniquement les éléments modifiés
2. **Debounce** : Limiter les sauvegardes localStorage
3. **Lazy loading** : Charger les pages à la demande

### Taille du Bundle

L'`index.html` généré contient le JS applicatif, les vendors (js-yaml, KaTeX), le CSS, les polices embarquées (KaTeX et OpenDyslexic, en woff2) et tous les decks. Mesures du 2026-11-22 : environ 6,7 Mo en build normal, 4,8 Mo avec `--minify`.

---

## Sécurité

### Échappement HTML

Tout contenu de deck, d'import ou saisi par l'utilisateur est échappé avant insertion dans `innerHTML`, y compris dans les attributs. `TextUtils.escapeHtml` (`src/modules/text-utils.js`) est l'implémentation unique : elle échappe `&`, `<`, `>`, `"` et `'` sans passer par le DOM. L'`escapeHtml` de `src/ui/components.js`, `ErrorHandler` et `LaTeX` y délèguent. Tests : `tests/ui-xss.test.js`, `tests/exporter-xml-safety.test.js`.

```javascript
container.innerHTML = `<div title="${escapeHtml(hint)}">${escapeHtml(userInput)}</div>`;
```

### Médias de deck

Un deck n'a pas le droit de déclencher une requête réseau à l'affichage d'une carte. `CardMedia` (`src/ui/components/card-media.js`) classe chaque source : `data:` et `blob:` sont rendues ; une URL `http(s)` devient un lien explicite (nouvel onglet, sans Referer) ; toute autre source n'est pas rendue. Tous les écrans qui affichent un média de deck passent par `CardMedia`. Test : `tests/card-media.test.js`.

### Content-Security-Policy

Le build écrit la politique dans une balise `<meta http-equiv="Content-Security-Policy">` (`buildContentSecurityPolicy` dans `scripts/build.js`) : le fichier est ouvert en `file://` ou servi par GitHub Pages, sans en-tête HTTP.

- `default-src 'none'`.
- `script-src` : l'empreinte SHA-256 du script unique, calculée sur le texte exact placé dans la page. Aucun `unsafe-inline` : un script injecté dans le DOM ne s'exécute pas.
- Gestionnaires en ligne (`onclick="..."`) : tolérés uniquement s'ils sont statiques (empreinte ajoutée avec `unsafe-hashes`) ; un gestionnaire dynamique (`${...}`) fait échouer le build. Le code de `src/` n'en contient plus : utiliser `addEventListener` (voir `tests/error-handler-csp.test.js`).
- `style-src 'unsafe-inline'` (feuille unique et attributs `style` générés) ; `img-src`, `media-src` : `data:` `blob:` ; `font-src data:`.
- `connect-src` : `data:`, `blob:` et les services que l'utilisateur déclenche depuis les créateurs de decks (`src/modules/lingua-libre.js`) : `lingualibre.org`, `commons.wikimedia.org`, `upload.wikimedia.org`, `query.wikidata.org`, `www.wikidata.org`.
- `object-src 'none'`, `base-uri 'none'`, `form-action 'none'`.

### Données importées

Une sauvegarde JSON, un fichier de progression ou un deck importé est une entrée non fiable. Le stockage ramène chaque champ à son type attendu (voir "Stockage") avant écriture et au chargement ; les clés `__proto__`, `constructor` et `prototype` ne sont jamais copiées. L'export Moodle XML protège les sections CDATA (`]]>` dans un contenu de carte).

---

## Stockage

> Module : `src/modules/storage.js`. Tests : `storage*.test.js`. Compression : `docs/COMPRESSION.md`.

| Clé localStorage | Contenu |
|------------------|---------|
| `tyb_players_list`, `tyb_current_player` | Liste des joueurs, joueur courant |
| `tyb_player_{playerId}` | Profil du joueur (dont `missions` : défis quotidiens et quêtes hebdomadaires) ; **clé qui fait foi** |
| `tyb_player` | Clé historique, recopiée à chaque sauvegarde du joueur courant (relue au démarrage) |
| `tyb_psync_{playerId}` | Marqueur : la clé par joueur est à jour (voir ci-dessous) |
| `tyb_pdeck_{playerId}_{deckId}` | Progression d'un deck pour un joueur |
| `tyb_pml_{playerId}_{deckId}` | Progression multilingue pour un joueur |
| `tyb_custom_decks`, `tyb_cdeck_{deckId}` | Index et contenu des decks importés |
| `tyb_trash_decks` | Corbeille de decks |
| `tyb_audio_{deckId}_{wordId}_{lang}` | Audios séparés |
| `tyb_settings`, `tyb_hidden_decks` | Réglages, decks masqués |
| `tyb_backup_{clé}` | Copie de secours : valeur précédente de la clé, écrite avant chaque enregistrement (voir « Copies de secours et récupération ») |
| `tyb_locale` | Dernière langue choisie explicitement (écran de profil, sans joueur chargé) |
| `tyb_prompt_learner`, `tyb_focus_mode`, `tyb_light_mode`, `tyb_navbar_pinned`, `tyb_badges_sidebar_pinned` | Préférences d'interface et données de `PromptLearner` |

- **Lecture du joueur** (`Storage.loadPlayer`) : la clé par joueur du joueur courant fait foi. La clé historique `tyb_player` n'est lue que s'il n'existe pas de clé par joueur. Cas des anciennes données sans marqueur `tyb_psync_{id}` où les deux clés existent et diffèrent : la clé historique l'emporte une seule fois (elle est recopiée dans la clé par joueur et le marqueur est posé), puis la clé par joueur fait foi.
- **Assainissement typé** : `Storage.sanitizePlayer` (appelé par `validatePlayer`) ramène le joueur à ses types (`types.js`) à chaque chargement et à l'import : compteurs, dates, jours, tableaux bornés, `settings`, `secretStats`, `challengeScores`, `missions` (`sanitizeMissions`). Même traitement pour la progression de carte (`sanitizeCardProgress` : seuls les champs de progression sont gardés), au chargement et à l'import ; pour les réglages (`sanitizeSettings`), à l'import et dans les préférences du joueur ; pour les métadonnées d'un deck importé (`sanitizeDeckMeta`), à sa lecture.
- **Champs de `player.stats`** : `Storage.PLAYER_STATS_TYPES` est le registre des champs autorisés. Un champ écrit par le code et absent du registre est supprimé au chargement ; `tests/storage-sanitize.test.js` parcourt `src/` pour le vérifier.
- **Isolation par joueur** : la progression se lit et s'écrit pour le joueur courant. Les clés legacy globales (`tyb_deck_*`, `tyb_multilingual_*`) ne sont plus migrées vers un joueur ; `clearLegacyProgress()` les supprime.
- **Suppression d'un joueur** (`clearCurrentPlayerData`) : supprime le profil, le marqueur, la progression des decks, la progression multilingue et les backups de ce joueur (`_getPlayerKeys`) ; la clé historique est supprimée si elle contient ce joueur. Le préfixe se termine par `_` : supprimer `player_1` ne touche pas `player_10`. `clearCurrentPlayerData` retire le joueur de la liste ; s'il était le dernier, les données legacy orphelines sont aussi supprimées.
- **Copies de secours et récupération** : `_saveWithBackup` copie la valeur courante dans `tyb_backup_{clé}` (`{ timestamp, data }`, valeur brute) avant chaque écriture du profil (`tyb_player`, `tyb_player_{id}`), de la liste des joueurs, de la progression d'un deck (simple ou multilingue), d'un deck personnalisé et de l'index des decks personnalisés. À la lecture, `Storage._readWithRecovery` retombe sur cette copie seulement si la valeur courante est inutilisable : clé absente, JSON illisible ou tronqué, décompression en échec, structure rejetée par l'assainissement (`validatePlayer`, `sanitizeCardProgress`, index sans aucune entrée valide). La copie, une fois validée par le même assainissement, est réécrite comme valeur courante (`restoreFromBackup`) et `onRecovery` est notifié. Une valeur saine n'est jamais remplacée ; une copie illisible est ignorée sans erreur et sans écriture. La copie a une sauvegarde de retard : une récupération perd au plus le dernier enregistrement. Une liste des joueurs corrompue sans copie est reconstruite depuis les profils `tyb_player_{id}` (jamais renvoyée vide, ce qui ferait écraser la liste par un ajout). La clé historique `tyb_player` ne se récupère que si la copie désigne le joueur courant. Les suppressions volontaires retirent aussi la copie (`_removeWithBackup`, suppression d'un joueur, d'un deck, des progressions) : une donnée supprimée ne ressuscite pas.
- **Messages au joueur** (abonnés par défaut, installés par `Storage._installDefaultNotifiers`, par `A11y.announce` avec toast, textes `storage.quotaWarning`, `storage.quotaError` et `storage.recovered`) : stockage presque plein (`onQuotaWarning`) et plein (`onQuotaError`), une fois par session et par type, et « Tes données ont été restaurées depuis la dernière sauvegarde » après une récupération (un seul message par chargement, différé après l'application de la langue du joueur).
- **Suppression d'un deck** : la progression du deck est supprimée pour tous les joueurs connus (`_deleteDeckProgressForAllPlayers`).
- **Réinitialisation complète** (`Storage.clear`) : supprime toutes les clés `tyb_*` de tous les joueurs.
- **`importAll(data)`** : assainit tout (`player`, `progress`, `settings`) avant la première écriture ; une donnée invalide lève une erreur sans rien écrire. La progression est écrite pour le joueur importé (`data.player.id`) et non pour le joueur courant ; sans joueur courant, le joueur importé le devient. Un échec d'écriture (quota) lève une erreur listant les éléments en échec.
- **Corbeille** : `moveToTrash(deckId)` écrit d'abord la corbeille puis l'index actif ; `restoreFromTrash(deckId)` écrit d'abord l'index actif puis la corbeille. Si la seconde écriture échoue, la première est annulée (`_restoreRawValue`) : un deck n'est jamais perdu à la fois de l'index actif et de la corbeille.
- **Migrations** vers le stockage individuel (decks, corbeille) : si un deck échoue, l'ancien format est conservé et la migration est retentée au chargement suivant.
- **Quota** : l'erreur de quota est reconnue sous Chrome/Safari (`QuotaExceededError`, code 22) et Firefox (`NS_ERROR_DOM_QUOTA_REACHED`, code 1014).

---

## Tests

Runner principal : `npm test` (= `node tests/node-runner.cjs`), qui exécute tous les `tests/*.test.js` dans une fenêtre jsdom (2 433 tests, 57 fichiers). Filtre : `TEST_FILTER=<sous-chaîne>`. Runner navigateur (`npm run test:browser`, `tests/runner.html`) et e2e Playwright (`npm run test:e2e`, 208 tests) : voir `docs/TESTING_STRATEGY.md` et `tests/INDEX.md`.

---

## Build Process

> Options, validation des decks et codes de sortie : `docs/BUILD_VALIDATION.md`.

```
┌─────────────────────────────────────────────────────────────┐
│                     BUILD PROCESS                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   decks/**/*.yaml ───┐                                      │
│   scripts/generators ┤                                      │
│   media/**/* ────────┼──► scripts/build.js ──► index.html  │
│   src/**/*.js ───────┤        (ordre : build.manifest.json) │
│   node_modules vendor┤        (--output : autre fichier)    │
│   src/styles/*.css ──┘                                      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   1. Lire le manifest, valider puis convertir les YAML      │
│   2. Générer les decks procéduraux (scripts/generators/)    │
│   3. Fusionner par ID (le YAML prime sur le généré)         │
│   4. Encoder les médias → Base64 (dossier media/ optionnel) │
│   5. Concaténer vendors + modules + UI (JS)                 │
│   6. Inliner CSS et polices (KaTeX, OpenDyslexic, woff2)    │
│   7. Calculer la CSP, assembler le HTML (en-tête de licences)│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

- **Échec franc** : le build s'arrête avec le code 1 sur une entrée du manifest dont le fichier est absent, un vendor ou un CSS vendor manquant, une minification JS/CSS en échec, une génération procédurale en échec, un manifest introuvable, un `THIRD-PARTY-NOTICES.md` qui ne cite pas un composant tiers ou un gestionnaire en ligne dynamique. Un deck YAML non lisible fait terminer le build avec le code 1.
- **Sortie** : `index.html` à la racine par défaut ; `--output <chemin>` (ou `-o`) écrit ailleurs.
- **Déterminisme** : les dossiers `decks/` et `media/` sont lus dans l'ordre alphabétique. `SOURCE_DATE_EPOCH` (secondes) fixe l'horodatage inscrit dans `index.html` et la date de génération des decks procéduraux.
- **Priorité des decks** : à ID identique, le deck YAML (`decks/`, y compris `decks/procedural/`) l'emporte sur le deck produit par `scripts/generators/` ; le doublon est signalé dans la sortie du build.
- **Convention `category` / `tags` des decks générés** : `BaseGenerator.finalizeDeck` (`scripts/generators/base-generator.cjs`, appelé par `buildDeck` et `buildDecks`) complète `category` avec les `tags` présents dans la taxonomie (matière, thème, niveau scolaire) ; la page d'exploration ne filtre que sur `category`.
- **Licences** : `index.html` commence par un commentaire (AGPL-3.0 de l'application, composants tiers avec version, copyright et licence). Il est conservé avec `--minify`. Les textes complets sont dans `THIRD-PARTY-NOTICES.md`, que le build contrôle.
- **Polices** : KaTeX et OpenDyslexic (`@fontsource/opendyslexic`) sont embarquées en woff2 dans la feuille de style ; les formats de repli sont retirés.
- **CSP** : voir "Sécurité".

### Site GitHub Pages

`npm run build:site` (`scripts/build-site.js`) produit `_site/` (ignoré par git) : le contenu de `site/` (jetons `{{VERSION}}` et `{{SITE_URL}}` remplacés dans les `.html`), `app/index.html` (l'application minifiée), `api/` (JSDoc générée à la volée) et `.nojekyll`. Le build du site échoue si JSDoc échoue : les types de `types.js` restent en syntaxe JSDoc valide. `SITE_URL` fixe l'adresse publique (le workflow Pages y met celle de `actions/configure-pages`). `node scripts/site-screenshots.cjs <build.html>` régénère les captures de `site/assets/`.

### CI

`.github/workflows/ci.yml` (push et pull request) : tests unitaires, build minifié, contrôle statique des specs e2e, tests e2e Chromium, build du site. `.github/workflows/pages.yml` (push sur `main`) : tests unitaires, build du site, déploiement.

---

## Versioning

### Semantic Versioning

`MAJOR.MINOR.PATCH`

- **MAJOR** : Changements incompatibles (migration données)
- **MINOR** : Nouvelles fonctionnalités
- **PATCH** : Corrections de bugs

### Migration des Données

Les imports passent par `Storage._migrateData(data)`, point d'entrée prévu pour les transformations de version. Il ne transforme rien aujourd'hui (le format d'export est en version `1.0.0`). Les migrations de stockage existantes (decks et corbeille vers le stockage individuel, clé historique du joueur) sont décrites dans "Stockage".

---

**Dernière mise à jour** : 2026-11-22
