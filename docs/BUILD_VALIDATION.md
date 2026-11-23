# Validation des Decks au Build

## Vue d'ensemble

Le script de build (`scripts/build.js`) intègre une validation automatique des decks YAML pour détecter les erreurs et problèmes de qualité avant l'intégration dans l'application.

## Fonctionnalités

### Validation structurelle
- Vérification des champs obligatoires (`id`, `name`, `cards`)
- Validation des types de cartes supportés
- Détection des IDs dupliqués
- Validation spécifique par type (MCQ, boolean, numeric, etc.)

### Détection de doublons
- Similarité entre questions (algorithme Jaccard)
- Détection des cartes identiques ou très similaires
- Rapport des duplications avec pourcentage de similarité
- Chaque carte est normalisée et découpée en mots une seule fois, puis les paires sont comparées : 500 cartes en environ 25 ms (une normalisation par paire coûtait plus de 3 s). Le résultat est identique à l'ancienne version. Test : `tests/deck-validator-duplicates.test.js` (nombre d'appels, sans mesure de durée). Détail : `docs/DUPLICATE_DETECTION.md`.

### Qualité MCQ
- Vérification de la structure des options
- Détection des défauts d'écriture (item-writing flaws)
- Validation des réponses contre les options

### Score de qualité
- Chaque deck reçoit un score de 0 à 100%
- Grade attribué (A, B, C, D)
- Breakdown détaillé par critères

## Options de ligne de commande

### Build normal (avec validation)
```bash
node scripts/build.js
```
- Valide tous les decks avant le build
- Affiche les erreurs et warnings
- Continue le build malgré les erreurs de validation (utiliser `--strict` pour les rendre bloquantes)
- Termine avec le code 1 si un deck YAML ne peut pas être lu (erreur de parsing)

### Validation uniquement
```bash
node scripts/build.js --validate
```
- Valide les decks sans générer le fichier HTML
- Utile pour vérifier la qualité des decks rapidement
- Affiche un rapport détaillé

### Mode strict
```bash
node scripts/build.js --strict
```
- Échoue si des warnings ou erreurs sont détectés
- Recommandé pour CI/CD
- Garantit la qualité maximale des decks

### Build minifié
```bash
node scripts/build.js --minify
```
- Minifie le JS (terser) et le CSS (clean-css) ; `npm run build:prod` enchaîne ce build puis `npm run docs`
- L'en-tête de licences de `index.html` est conservé (écrit hors du JS et du CSS minifiés)

### Fichier de sortie
```bash
node scripts/build.js --output tmp/app.html
```
- `--output <chemin>` (ou `-o`, ou `--output=<chemin>`) écrit le build ailleurs qu'à la racine ; le dossier est créé si besoin
- Les tests e2e peuvent cibler ce fichier : `E2E_APP=tmp/app.html npm run test:e2e`

### Build rapide (sans validation)
```bash
node scripts/build.js --skip-validation
```
- Ignore la validation des decks
- Plus rapide mais ne détecte pas les erreurs
- À utiliser uniquement si tu es sûr de tes decks

### Aide
```bash
node scripts/build.js --help
```
- Affiche toutes les options disponibles
- Exemples d'utilisation

## Format de sortie

Exemples de rendu (noms et scores indicatifs).

### Deck valide
```
✓ additions-100.yaml (55 cartes, score 90%)
```

### Deck avec warnings
```
⚠ table-5.yaml (11 cartes, score 85%)
  - 55 doublon(s) détecté(s)
  - 2 carte(s) avec warnings
```

### Deck avec erreurs
```
✗ mon-deck.yaml (21 cartes, score 77%)
  - 6 carte(s) avec warnings
  - 7 carte(s) avec erreurs
  - ✗ mcq_planete: Option #1 sans ID
  - ✗ mcq_planete: answer "Jupiter" ne correspond pas aux IDs
```

### Résumé final
```
Résumé: 16 valide(s), 1 warning(s), 1 erreur(s)
```

## Types d'erreurs détectées

### Erreurs structurelles (bloquantes)
- Champs requis manquants
- Types de cartes invalides
- IDs dupliqués
- Format answer incorrect

### Warnings (non-bloquants)
- Cartes sans hint
- Réponses sans alternatives
- Détection de doublons
- MCQ avec peu d'options

### Informations
- Risques factuels (dates, statistiques)
- Potentielles hallucinations (pour les decks générés par LLM)
- Niveau de lisibilité

## Échecs du build (code de sortie 1)

Le build s'arrête avec le code 1 (message `❌ Erreur de build`) dans les cas suivants :

- `build.manifest.json` introuvable
- une entrée de `modules.order` ou `ui.order` dont le fichier n'existe pas dans `src/modules/` ou `src/ui/`
- un vendor (`node_modules/js-yaml`, `node_modules/katex`) ou le CSS vendor de KaTeX manquant (lancer `npm install`)
- un échec de minification JS ou CSS avec `--minify` (le build ne livre plus de code non minifié en silence)
- un échec de la génération procédurale (`scripts/generators/`)
- `THIRD-PARTY-NOTICES.md` introuvable, sans section pour un composant tiers embarqué, ou qui ne cite pas sa version installée (voir « Garde-fous du build »)
- un gestionnaire d'événement en ligne dynamique (`onclick="${...}"`) dans le JS assemblé : la CSP ne peut pas le couvrir
- en mode `--strict` : un deck avec erreurs ou warnings, ou une erreur de parsing

Un deck YAML illisible hors `--strict` est signalé (`✗ Erreur: ...`), exclu du build, et fait terminer le script avec le code 1.

## Build reproductible

- Les dossiers `decks/` et `media/` sont parcourus dans l'ordre alphabétique : même entrée, même ordre de decks dans `index.html`.
- La variable d'environnement `SOURCE_DATE_EPOCH` (secondes depuis l'époque Unix) fixe l'horodatage inscrit dans `index.html` :

```bash
SOURCE_DATE_EPOCH=1700000000 node scripts/build.js
```

## Sources de decks et priorité

Le build assemble deux sources :

1. Les fichiers `.yaml` / `.yml` trouvés récursivement dans `decks/` (dont `decks/procedural/`).
2. Les decks produits par les générateurs de `scripts/generators/` (chaque deck passe par `BaseGenerator.finalizeDeck`, qui complète `category` avec les `tags` de la taxonomie : l'explorateur ne filtre que sur `category`).

Les decks sont dédupliqués par ID : quand un YAML et un deck généré portent le même ID, **le YAML l'emporte** et le deck généré est ignoré (signalé dans la sortie : `[procedural (ignoré)]`). Les YAML de `decks/procedural/` priment donc sur les générateurs.

### Copies figées de `decks/procedural/`

Les 109 fichiers de `decks/procedural/` (`metadata.source.type: procedural`) sont des copies figées de la sortie des générateurs. Le build ne les régénère pas : il lit le YAML, qui prime. Pour modifier un de ces decks, changer le générateur puis régénérer la copie :

```bash
node scripts/generators/index.cjs --all --output=decks/procedural
```

Les identifiants de cartes et de decks ne changent pas à la régénération : la progression des joueurs en dépend. Les fichiers se nomment `<générateur>-<nom du deck>.yaml`.

### Générateurs déterministes

- Deux générations produisent des decks identiques. Les générateurs n'utilisent jamais `Math.random()` : `BaseGenerator.createRng(seed)` fournit un générateur pseudo-aléatoire à graine (xmur3 + mulberry32), `this.rng(label)` en crée un dont la graine est l'identifiant du générateur plus une étiquette, et le mélange est un Fisher-Yates qui en dépend.
- `generatedAt` (date de génération) respecte `SOURCE_DATE_EPOCH`.
- Les decks produits sont complets (équations, fractions, pourcentages : plus d'échantillons aléatoires).

## Intégration DeckValidator

Le script utilise le module `src/modules/deck-validator.js` (chargé par `scripts/deck-validator-loader.cjs`, `TextUtils` avant `DeckValidator`) qui fournit notamment :
- `validateDeck()` - Validation complète d'un deck
- `validateStructure()` - Validation structurelle uniquement
- `findDuplicates()` - Détection de doublons
- `analyzeMcqQuality()` - Analyse qualité MCQ
- `calculateCardScore()` - Score de qualité par carte

## Workflow recommandé

### Développement
```bash
# Valider en continu pendant le développement
node scripts/build.js --validate

# Builder avec validation
node scripts/build.js
```

### CI/CD
```bash
# Build strict pour garantir la qualité
node scripts/build.js --strict --minify
```

### Build rapide local
```bash
# Pour tests rapides sans validation
node scripts/build.js --skip-validation
```

## Garde-fous du build

- **Notices tierces** : `THIRD_PARTY` (`scripts/build.js`) liste les composants embarqués (js-yaml, KaTeX et ses polices, polices OpenDyslexic, LZ-String). Le build vérifie que `THIRD-PARTY-NOTICES.md` a une section par composant et cite la version installée de chaque paquet. Tout composant tiers embarqué s'ajoute à cette liste.
- **En-tête de licences** : commentaire HTML en tête de `index.html` (licence AGPL-3.0, composants tiers, versions, copyrights). La séquence `--` y est interdite.
- **Content-Security-Policy** : calculée par le build, avec l'empreinte du script unique ; gestionnaires en ligne statiques tolérés par empreinte, dynamiques refusés. Détail et liste des hôtes autorisés : `docs/ARCHITECTURE.md`, section Sécurité.
- **Polices** : KaTeX et OpenDyslexic sont embarquées en woff2 ; les formats de repli sont supprimés.

## Build du site

`npm run build:site` (`scripts/build-site.js`) produit `_site/` : sources de `site/`, `app/index.html` (application minifiée), `api/` (JSDoc), `.nojekyll`. Options : `--src`, `--out`, `--jsdoc-config` ; variables `SITE_SRC`, `SITE_OUT`, `SITE_URL`. La JSDoc est **bloquante** : un code de sortie non nul de JSDoc (type invalide dans un commentaire, par exemple `champ?: type` ou `type[]` sur un objet littéral) fait échouer le build du site avec le code 1. La CI exécute cette commande à chaque push (`.github/workflows/ci.yml`).

## Fichiers techniques

### `scripts/deck-validator-loader.cjs`
Wrapper CommonJS pour charger le DeckValidator dans le contexte ES6 du script de build.
Les modules de `src/` sont des scripts navigateur : dans ce package (`"type": "module"`), `require()` les traiterait comme des modules ES sans export. Le loader les évalue avec un faux `module` et fournit `TextUtils` à `DeckValidator`.

## Exemples de corrections

### Erreur : MCQ sans IDs d'options
**Avant :**
```yaml
- id: mcq_test
  type: mcq
  question: "Question ?"
  options:
    - "Option A"
    - "Option B"
  answer: "Option A"
```

**Après :**
```yaml
- id: mcq_test
  type: mcq
  question: "Question ?"
  options:
    - id: "A"
      text: "Option A"
    - id: "B"
      text: "Option B"
  answer: "A"  # ID, pas le texte
```

### Erreur : Boolean avec string au lieu de boolean
**Avant :**
```yaml
- id: tf_test
  type: truefalse
  question: "Vrai ou faux ?"
  answer: "Vrai"
```

**Après :**
```yaml
- id: tf_test
  type: truefalse
  question: "Vrai ou faux ?"
  answer: true
```

## Conclusion

La validation au build permet de :
- ✅ Détecter les erreurs tôt dans le processus
- ✅ Garantir la qualité des decks
- ✅ Faciliter la maintenance
- ✅ Éviter les bugs en production
- ✅ Améliorer la qualité pédagogique

Pour toute question ou suggestion, consulter :
- `CLAUDE.md` - Guide principal
- `src/modules/types.js` - Structures de données (typedefs JSDoc)
- `src/modules/deck-validator.js` - Code de validation
- `docs/DUPLICATE_DETECTION.md`, `docs/FLESCH_KINCAID.md`, `docs/HALLUCINATION_DETECTION.md` - Détail des contrôles
