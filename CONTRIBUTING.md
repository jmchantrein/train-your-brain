# Contribuer à Train Your Brain

Merci de ton intérêt pour ce projet. Que tu corriges une faute dans une carte, proposes un deck ou modifies le code, ton aide compte, et une première contribution n'a pas besoin d'être parfaite : nous relisons ensemble.

Un « deck » est un paquet de cartes sur un sujet. La méthode « Leitner » est une révision espacée : les cartes bien connues reviennent moins souvent.

## Sommaire

- [Avant de commencer](#avant-de-commencer)
- [Contribuer sans écrire de code](#contribuer-sans-écrire-de-code)
- [Proposer ou corriger un deck](#proposer-ou-corriger-un-deck)
- [Contribuer au code](#contribuer-au-code)
- [Ce que vérifie la CI](#ce-que-vérifie-la-ci)
- [À propos de CLAUDE.md](#à-propos-de-claudemd)
- [Questions](#questions)

## Avant de commencer

- Le projet suit un [code de conduite](CODE_OF_CONDUCT.md). L'application est utilisée à l'école et ses decks sont lus par des enfants : cela guide aussi les règles de contenu plus bas.
- Le français et l'anglais sont acceptés dans les tickets et les pull requests.
- Pour une faille de sécurité, n'ouvre pas de ticket public : suis [SECURITY.md](SECURITY.md).
- Le projet a deux licences : le code est publié sous [GNU AGPL version 3 ou ultérieure](LICENSE) (`AGPL-3.0-or-later`), le contenu des decks sous [Creative Commons Attribution - Partage dans les mêmes conditions 4.0](decks/LICENSE) (`CC BY-SA 4.0`). En proposant une contribution, tu acceptes qu'elle soit publiée sous la licence du projet : l'AGPL pour du code, la CC BY-SA 4.0 pour un deck ou des cartes.
- Une question ou une idée sans certitude ? Ouvre un ticket pour en parler avant de travailler : cela évite de refaire un travail.

## Contribuer sans écrire de code

Plusieurs contributions utiles ne demandent aucun code.

- **Signaler un problème.** Utilise le gabarit « Signaler un bug » des [tickets](https://github.com/jmchantrein/train-your-brain/issues/new/choose). Indique ce que tu as fait, ce que tu attendais, ce qui s'est passé, ton navigateur et ton système.
- **Corriger une erreur dans un deck.** Une capitale fausse, une faute d'orthographe, une réponse acceptée à tort : utilise le gabarit « Proposer ou corriger un deck », avec une source si possible.
- **Proposer un deck.** Voir la section suivante.
- **Relire les textes.** Fautes, phrases difficiles à comprendre, termes peu clairs dans l'interface, le site ou la documentation.
- **Traduire.** L'interface existe en français et en anglais. Les noms des badges, des défis et des thèmes, ainsi que le tutoriel, ne sont pas encore traduits : une proposition de traduction est utile, même partielle.
- **Tester avec des outils d'accessibilité.** Lecteur d'écran, navigation au clavier, zoom, mode dyslexie : décris ce qui gêne.
- **Partager un retour d'usage.** Ce qui est clair, ce qui ne l'est pas, ce qui manque.

## Proposer ou corriger un deck

### Format

Un deck est un fichier YAML placé dans `decks/` (par exemple `decks/procedural/capitals-capitales-europe.yaml`). Le build lit tous les fichiers `.yaml` de ce dossier et de ses sous-dossiers. Exemple minimal :

```yaml
id: "exemple-capitales-europe"
name: "Capitales d'Europe (exemple)"
description: "Quelques capitales européennes."
tags: [geographie, capitales]
difficulty: 1
metadata:
  source:
    type: human
    author: "Ton nom ou ton pseudonyme"
  license: "CC-BY-SA-4.0"
settings:
  similarityMatching: true
cards:
  - id: "cap-001"
    question: "Quelle est la capitale de la France ?"
    answer: "Paris"
    feedback: "Paris est la capitale de la France."

  - id: "cap-002"
    question: "La capitale de l'Italie est {{Rome}}."
    type: cloze
    answer: "Rome"

  - id: "cap-003"
    question: "Madrid est la capitale de l'Espagne."
    type: truefalse
    answer: true
```

Points à connaître :

- Chaque carte a un `id` unique dans le deck ; ne change pas l'`id` d'une carte existante, car la progression des personnes qui jouent s'y rattache.
- `answer` est la bonne réponse ; `alternatives` liste d'autres réponses acceptées.
- Types de cartes : texte (par défaut), `numeric`, `mcq` (choix multiple), `truefalse`, `cloze` (texte à trous avec `{{mot}}`) et `matching` (associations). Pour un exemple de chaque type, ouvre un deck existant dans `decks/`.
- Les types de données sont définis dans `src/modules/types.js` (typedefs `Deck` et `Card`).
- Les majuscules et les accents sont ignorés lors de la comparaison des réponses, et un tiret ou une apostrophe entre deux lettres équivaut à une espace : inutile de lister ces variantes comme alternatives.

### Vérifier avant de proposer

```bash
npm install
node scripts/build.js --validate
```

La commande lit tous les decks, signale les erreurs de structure (identifiants en double, champs manquants, réponse absente des choix) et les avertissements de qualité (cartes trop proches, formulations ambiguës), puis s'arrête sans construire l'application. Tu peux aussi importer ton fichier dans l'application (« Créer & Gérer », puis « Importer un fichier ») et le jouer. `node scripts/build.js --strict` construit l'application en échouant au moindre avertissement.

### Règles de contenu

Ces règles existent parce que des enfants lisent les decks. Elles ne visent pas à te décourager : en cas de doute, pose la question dans ta proposition.

- **Adapté à l'âge.** Pas de contenu violent, sexuel, haineux ou publicitaire. Indique le niveau visé dans la description (par exemple « cycle 3 »).
- **Exact et sourcé.** Cite tes sources dans la description ou dans ta proposition. Un fait précis (date, chiffre, citation) doit pouvoir être vérifié. Si un point est débattu, évite-le ou formule-le avec prudence.
- **Neutre.** Pas de prise de position politique ou religieuse présentée comme un fait.
- **Aucune donnée personnelle.** Ni nom de vraies personnes privées, ni adresses, ni photos de personnes.
- **Des retours bienveillants.** Le champ `feedback` explique la réponse ; il ne juge pas l'élève.
- **Relu par un humain.** Si tu as utilisé un assistant d'IA pour rédiger le deck, relis chaque carte : une IA peut inventer des faits. Dis-le dans ta proposition.
- **Un sujet, un deck.** Des decks courts et ciblés se relisent plus vite.

### Origine et licence des contenus

- Ne propose que des contenus que tu as le droit de partager : tes propres textes, des faits que tu reformules, ou des contenus sous licence libre. Les faits ne sont pas protégés, mais la façon de les présenter l'est.
- Ne copie pas un deck publié ailleurs (par exemple un deck Anki partagé en ligne) sans l'accord de la personne qui l'a écrit ou une licence qui le permet.
- Indique l'origine et la licence dans `metadata` : `source` (type, auteur) et `license`. Si tu reprends des textes ou des médias, ajoute `originalUrl`.
- Un média (image, son) doit lui aussi avoir une licence compatible, et la personne qui l'a créé doit être citée si la licence l'exige. Les médias distants ne sont jamais chargés automatiquement : intègre-les dans le deck.
- Les decks du dépôt sont publiés sous licence CC BY-SA 4.0 (voir `decks/LICENSE`), distincte de celle du code (AGPL-3.0-or-later). Un deck que tu proposes doit donc pouvoir être publié sous cette licence : indique `license: "CC-BY-SA-4.0"` dans `metadata`. Si ton contenu vient d'une source sous une autre licence, mentionne-la dans `source` ou `originalUrl` ; une licence incompatible avec la CC BY-SA 4.0 ne peut pas être acceptée.

### Corriger un deck produit par un générateur

Sur les 132 decks du build, 130 sont produits par des générateurs déterministes (`scripts/generators/`) et 109 ont une copie figée dans `decks/procedural/`. Ne corrige pas la copie seule : la prochaine génération l'écraserait. Corrige le générateur (ou ses données dans `scripts/generators/data/`), puis régénère :

```bash
node scripts/generators/index.cjs --list                       # liste des générateurs
node scripts/generators/index.cjs --gen=capitals --output=decks/procedural
```

Garde les `id` des cartes existantes : une carte dont l'identifiant disparaît fait perdre sa progression aux personnes qui jouent. Décris la correction dans ta pull request, avec la source du fait corrigé.

## Contribuer au code

### Installation

Il faut [Node.js](https://nodejs.org/) (version dans `.nvmrc`) et Git.

```bash
git clone https://github.com/jmchantrein/train-your-brain.git
cd train-your-brain
npm install
npm run dev
```

`npm run dev` construit l'application dans `.dev/`, la sert sur http://localhost:3000/ et la reconstruit quand `src/`, `decks/` ou `build.manifest.json` changent. Recharge la page à la main après une modification.

Pour obtenir le fichier final : `npm run build` génère `index.html` à la racine. Pour construire ailleurs, `node scripts/build.js --minify --output <chemin>`.

### Où modifier quoi

```
src/modules/        logique métier (Leitner, XP, stockage, validation, import/export)
src/ui/             pages et composants ; chaque page-*.js ajoute une page à l'objet Pages
src/styles/main.css feuille de style unique
build.manifest.json ordre de chargement des fichiers : à mettre à jour si tu ajoutes ou supprimes un fichier
decks/              decks YAML
tests/              tests unitaires (*.test.js) et de bout en bout (tests/e2e/)
docs/               documentation
```

Une contrainte du projet : l'application doit fonctionner ouverte en `file://`. Il n'y a donc ni `fetch()` vers des fichiers locaux, ni `import`/`export` ES, ni Service Worker, et tout est assemblé dans un seul fichier par le build. Les fichiers de `src/` sont des scripts classiques qui déclarent des objets globaux.

Détails de l'architecture : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

### Conventions de code

- JavaScript sans framework (ES2022), fonctions pures quand c'est possible, noms explicites, JSDoc sur les méthodes publiques. Les types sont dans `src/modules/types.js`.
- Tout contenu venant d'un deck, d'un import ou d'une personne utilisatrice est échappé avant d'être inséré dans `innerHTML`, avec `escapeHtml()` de `src/ui/components.js` (elle échappe aussi les guillemets). Le test `tests/ui-xss.test.js` en donne des exemples.
- Après une modification d'état persistant : `State.set(...)` puis `Storage.save*(...)`.
- Les textes de l'interface passent par `src/modules/i18n.js`, avec une clé dans le dictionnaire français et dans le dictionnaire anglais (un test vérifie qu'elles correspondent).
- CSS : variables `--color-*`, nommage BEM simplifié (`.card__question`, `.card--correct`).

### Tests

```bash
npm test                          # tests unitaires : Node.js et jsdom
TEST_FILTER=storage npm test      # seulement les fichiers dont le nom contient « storage »
npm run test:e2e                  # tests de bout en bout, Playwright, Chromium
node tests/e2e/lint-specs.cjs     # contrôle statique des specs e2e
```

- Lance `npx playwright install chromium` avant le premier `npm run test:e2e`. Les tests e2e ouvrent `index.html` en `file://` : lance d'abord `npm run build`. `E2E_APP=<chemin>` vise un autre fichier construit.
- Un nouveau fichier `tests/*.test.js` est pris en compte sans enregistrement.
- Nous recommandons d'écrire le test en même temps que le code, ou avant : une correction accompagnée d'un test est plus simple à relire. Le framework de test est maison (`describe`, `it`, `expect`) ; la liste des assertions est dans [tests/INDEX.md](tests/INDEX.md).
- Si un test échoue après ton changement, regarde d'abord si c'est le code ou le test qui est périmé.

Stratégie complète : [docs/TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md).

### Messages de commit

Le projet utilise le format `type: description courte`, en français ou en anglais :

| Type | Usage |
|------|-------|
| `feat` | nouvelle fonctionnalité |
| `fix` | correction de bug |
| `refactor` | réorganisation sans changement de comportement |
| `perf` | performance |
| `test` | tests |
| `docs` | documentation |
| `build` | scripts de build |
| `ci` | intégration continue |
| `chore` | tâches diverses |

Exemples : `fix: hyphens and apostrophes are equivalent to a space in answers`, `docs: update TODO.md`. Un corps de message facultatif explique le pourquoi.

### Ouvrir une pull request

1. Fork le dépôt et crée une branche (`feature/ma-fonctionnalite` ou `fix/mon-correctif`).
2. Fais tes changements et vérifie en local : `npm test`, `npm run build`, et `npm run test:e2e` si tu touches à l'interface.
3. Mets à jour la documentation concernée (`docs/`, `README.md`) et, pour un changement visible, `CHANGELOG.md`.
4. Ouvre la pull request vers `main` ; le gabarit te guide.

Les relectures regardent : le comportement correct, les tests, la compatibilité avec `file://`, la clarté, la documentation. Elles peuvent demander des changements : c'est normal et ce n'est pas un jugement sur toi.

Si tu utilises un assistant d'IA pour contribuer, relis et teste son travail avant de l'envoyer, et signale-le dans la pull request.

## Ce que vérifie la CI

La CI (GitHub Actions) s'exécute à chaque push et à chaque pull request, avec la version de Node de `.nvmrc` (`.github/workflows/ci.yml`) :

1. **Tests unitaires et build** : `npm ci`, `npm test`, puis `node scripts/build.js --minify`.
2. **Tests e2e (Chromium)** : build minifié, contrôle des specs (`node tests/e2e/lint-specs.cjs`), puis Playwright.
3. **Build du site** : `npm run build:site` (page d'accueil, application, documentation du code).

Nous attendons une CI verte avant de fusionner. Si l'échec te semble étranger à ton changement, dis-le dans la pull request. En cas de test e2e en échec, le rapport Playwright est joint à l'exécution.

À chaque push sur `main`, `.github/workflows/pages.yml` rejoue les tests unitaires, construit le site et le déploie sur GitHub Pages.

## À propos de CLAUDE.md

Le fichier [CLAUDE.md](CLAUDE.md) est le fichier d'instructions des assistants d'IA (Claude Code) qui travaillent sur ce dépôt : règles de travail, rappels de conventions, pièges connus. Ce n'est pas un guide pour les personnes qui contribuent, et ses règles (listes de tâches, délégation à des agents, etc.) ne s'imposent pas à toi. Pour contribuer, ce document et [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) suffisent.

## Questions

Ouvre un [ticket](https://github.com/jmchantrein/train-your-brain/issues) : toutes les questions sont les bienvenues.

Merci de contribuer.
