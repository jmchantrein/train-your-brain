# Train Your Brain

[![CI](https://github.com/jmchantrein/train-your-brain/actions/workflows/ci.yml/badge.svg)](https://github.com/jmchantrein/train-your-brain/actions/workflows/ci.yml)
[![Licence : AGPL-3.0-or-later](https://img.shields.io/badge/licence-AGPL--3.0--or--later-blue.svg)](LICENSE)

Train Your Brain est une application de révision par cartes mémoire (flashcards). Elle utilise la méthode de Leitner, une révision espacée : les cartes bien connues reviennent moins souvent, les autres plus souvent. Elle tient dans un seul fichier HTML, s'ouvre par double-clic, fonctionne hors-ligne et n'a besoin d'aucun compte ni d'aucun serveur.

> **Version alpha.** L'application est en cours de développement : certaines fonctions peuvent être incomplètes. Tes retours sont les bienvenus.

## Sommaire

- [Utiliser l'application](#utiliser-lapplication)
- [Fonctionnalités](#fonctionnalités)
- [Vie privée et accès réseau](#vie-privée-et-accès-réseau)
- [Créer et partager des decks](#créer-et-partager-des-decks)
- [Développement](#développement)
- [Licence et composants tiers](#licence-et-composants-tiers)
- [État du projet](#état-du-projet)
- [Contribuer et nous joindre](#contribuer-et-nous-joindre)

Un « deck » est un paquet de cartes sur un sujet (par exemple « Capitales d'Europe »).

## Utiliser l'application

### En ligne

Le site est publié par GitHub Pages à l'adresse [https://jmchantrein.github.io/train-your-brain/](https://jmchantrein.github.io/train-your-brain/). Il sera disponible une fois GitHub Pages activé sur le dépôt. Il propose l'application, des captures d'écran et la documentation du code.

### Télécharger le fichier

1. Télécharge `index.html` : depuis le bouton « Télécharger » du site, ou depuis la racine du dépôt.
2. Double-clique dessus pour l'ouvrir dans ton navigateur.
3. Crée un profil et choisis un deck.

Le fichier est autonome : une fois téléchargé, il fonctionne sans connexion.

### Construire soi-même

Il faut [Node.js](https://nodejs.org/) (la version utilisée par le projet est dans `.nvmrc`).

```bash
git clone https://github.com/jmchantrein/train-your-brain.git
cd train-your-brain
npm install
npm run build        # génère index.html à la racine ; ouvre-le dans le navigateur
```

Les tests automatiques sont lancés avec Chromium. Les autres navigateurs récents devraient fonctionner, mais ne sont pas testés automatiquement.

## Fonctionnalités

### Révision

| Fonction | Description |
|----------|-------------|
| Méthode de Leitner | Quatre boîtes (à jouer, violette, orange, verte). Une réponse fausse renvoie la carte en violet ; une bonne réponse rapide la fait passer en vert. Une carte verte se repose, puis revient dans « à jouer ». |
| Seuil de rapidité | Le temps de réponse qui compte comme « rapide » est propre à chaque carte. |
| Mode examen | Les questions d'un deck sont notées, avec un score final. |
| Plusieurs profils | Chaque profil a sa progression, ses badges et ses réglages sur le même navigateur. |
| Decks multilingues | Vocabulaire avec traduction et dictée audio. |

La méthode est décrite dans [docs/LEITNER_SYSTEM.md](docs/LEITNER_SYSTEM.md).

### Motivation

| Fonction | Description |
|----------|-------------|
| Points d'expérience (XP) | De 1 à 3 XP par carte réussie selon la boîte, plus des bonus de série de bonnes réponses. |
| Niveaux | Le niveau augmente avec l'XP total. |
| Badges | 43 badges à débloquer (progression, maîtrise, séries, badges secrets). |
| Défis quotidiens | Trois petits objectifs par jour, limités au nombre de cartes à réviser : un jour sans carte à réviser n'a pas de défi à manquer. |
| Mode défi | Une autre façon de faire ses révisions : mêmes cartes à réviser et même progression qu'une séance normale, avec un objectif (« Parcours » : un taux de réussite ; « Sans erreur » : une série de bonnes réponses). Chronomètre facultatif, décoché par défaut. Un défi réussi rapporte 3 XP de bonus, une fois par jour au plus. Accessible depuis la page des défis et depuis la ligne d'un deck. |
| Quêtes hebdomadaires | Des objectifs mesurés sur la semaine, du lundi au dimanche. |
| Série de jours | Le nombre de jours de révision consécutifs. Un jour sans carte à réviser ne la casse pas. |

Barèmes complets : [docs/GAMIFICATION.md](docs/GAMIFICATION.md).

### Types de cartes

Texte (avec réponses alternatives et tolérance aux fautes de frappe), réponse numérique, choix multiple (QCM), vrai ou faux, texte à trous, associations.

### Decks fournis

Le build contient 132 decks : 2 écrits à la main (maths) et 130 produits par des générateurs déterministes (`scripts/generators/` : tables de calcul, fractions, capitales du monde en français, départements, alphabets, notation musicale, tableau périodique, etc.).

### Créer et importer

- Éditeur de decks intégré, fusion de decks, ressources rattachées à un deck.
- Générateur de consignes (prompts) pour demander un deck à un assistant d'IA.
- Import de fichiers YAML, JSON ou Moodle XML. Export en YAML, JSON ou Moodle XML.
- Sauvegarde et restauration d'un profil complet.
- Formules mathématiques avec KaTeX.

### Accessibilité

Mode dyslexie (police OpenDyslexic embarquée), contraste élevé, espacement large, modes pour le daltonisme, thèmes clair et sombre, annonces pour les lecteurs d'écran.

### Langues

L'interface existe en français et en anglais, au choix de chaque profil. L'interface française te tutoie et, par défaut, accorde les textes au féminin ; dans les paramètres (visibles quand l'interface est en français), un réglage permet de choisir le masculin ou la forme à point médian. Badges, thèmes et tutoriel sont traduits. Restent en français quand l'interface est en anglais : le contenu des decks, les libellés des tags, le formulaire du générateur de consignes et les messages du validateur de decks.

## Vie privée et accès réseau

Réviser ne demande aucune connexion. Voici ce que fait l'application, exactement.

**Tes données restent dans ton navigateur.** Profils, progression et réglages sont enregistrés dans le `localStorage` du navigateur que tu utilises. Aucun serveur ne les reçoit. Pour les déplacer ou les conserver, exporte une sauvegarde depuis l'application.

**Aucune requête réseau** n'est envoyée au démarrage, pendant le jeu, pendant un examen, ni à l'import ou à l'export de decks et de sauvegardes.

**Les seuls accès réseau** sont ceux que tu déclenches dans les créateurs de decks de dictée et multilingues. Ils interrogent Lingua Libre, Wikimedia Commons et Wikidata, et leur envoient le mot cherché et sa langue.

**Un média distant n'est jamais chargé automatiquement.** Si un deck référence une image ou un son hébergé sur internet, l'application n'affiche qu'un lien, avec un avertissement : la personne qui a écrit le deck ne peut donc pas savoir quand une carte est jouée. Seuls les médias contenus dans le deck sont affichés.

**Une politique de sécurité du contenu (CSP)** est intégrée à la page générée. Elle limite les connexions aux hôtes de Lingua Libre, Wikimedia et Wikidata cités ci-dessus.

**La version en ligne** est servie par GitHub Pages : charger la page est une requête vers GitHub, qui applique sa propre politique. Le fichier téléchargé n'a pas cette dépendance.

Les decks et sauvegardes importés sont traités comme non fiables : leur contenu est échappé avant affichage et les données d'une sauvegarde sont contrôlées à l'import. Pour signaler une faille, voir [SECURITY.md](SECURITY.md).

## Créer et partager des decks

Un deck est un fichier YAML. Trois façons d'en obtenir un :

1. **À la main**, avec l'éditeur de l'application (page « Créer & Gérer »).
2. **Avec un assistant d'IA** : le générateur de consignes prépare un texte à coller dans l'assistant de ton choix. Tu importes ensuite le YAML obtenu. Relis toujours le contenu : une IA peut se tromper.
3. **Par import** d'un fichier YAML, JSON ou Moodle XML.

Pour proposer un deck au projet, voir la partie « Sans écrire de code » de [CONTRIBUTING.md](CONTRIBUTING.md). Pour vérifier un deck avant de le proposer :

```bash
node scripts/build.js --validate
```

L'application ne lit pas directement les decks Anki. Si tu pars d'un deck partagé par quelqu'un d'autre, vérifie que sa licence autorise la réutilisation avant de le proposer ici.

## Développement

| Commande | Effet |
|----------|-------|
| `npm run build` | Génère `index.html` à la racine. |
| `node scripts/build.js --minify --output <chemin>` | Build minifié écrit ailleurs qu'à la racine. |
| `node scripts/build.js --validate` | Valide les decks sans construire. |
| `npm run build:site` | Construit le site dans `_site/` : page d'accueil (`site/`), application (`app/`) et documentation du code JSDoc (`api/`). |
| `npm run dev` | Construit dans `.dev/`, sert sur http://localhost:3000/ et reconstruit quand `src/`, `decks/` ou le manifeste changent. Recharge la page à la main. |
| `npm test` | Tests unitaires : plus de 2 000 tests (Node.js et jsdom), comptés dans [tests/INDEX.md](tests/INDEX.md). `TEST_FILTER=storage npm test` n'exécute que les fichiers dont le nom contient `storage`. |
| `npm run test:e2e` | Tests de bout en bout (Playwright, Chromium) sur `index.html` ouvert en `file://`. `E2E_APP=<chemin>` vise un autre build. |
| `node tests/e2e/lint-specs.cjs` | Contrôle statique des specs e2e (routes inexistantes, tests ignorés, etc.). |
| `npm run docs` | Génère la documentation JSDoc. |

Le premier lancement des tests e2e demande `npx playwright install chromium`.

**Intégration continue.** `.github/workflows/ci.yml` s'exécute à chaque push et à chaque pull request : tests unitaires et build minifié, tests e2e Chromium, build du site. `.github/workflows/pages.yml` déploie le site à chaque push sur `main`.

**Organisation du code.**

```
src/modules/    logique métier (Leitner, XP, stockage, validation, import/export)
src/ui/         pages et composants de l'interface
src/styles/     feuille de style unique
decks/          decks YAML (decks/procedural/ : copies figées des générateurs)
scripts/        build, serveur de développement, générateurs de decks
site/           page d'accueil du site
tests/          tests unitaires (*.test.js) et e2e (tests/e2e/)
docs/           documentation détaillée
```

Documentation : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (architecture), [docs/SPECIFICATIONS.md](docs/SPECIFICATIONS.md) (cahier des charges), [docs/TESTING_STRATEGY.md](docs/TESTING_STRATEGY.md) (tests), [docs/BUILD_VALIDATION.md](docs/BUILD_VALIDATION.md) (build et validation des decks). [CLAUDE.md](CLAUDE.md) est le fichier d'instructions des assistants d'IA qui travaillent sur le dépôt : ce n'est pas un guide pour les humains, voir [CONTRIBUTING.md](CONTRIBUTING.md).

## Licence et composants tiers

Copyright (C) 2025-2026 Jean-Mathieu Chantrein.

Le projet a deux licences :

- le code est publié sous licence [GNU Affero General Public License, version 3 ou ultérieure](LICENSE) (identifiant SPDX : `AGPL-3.0-or-later`) : tu peux l'utiliser, l'étudier, le modifier et le redistribuer, aux conditions de cette licence ;
- le contenu des decks (`decks/`) est publié sous licence [Creative Commons Attribution - Partage dans les mêmes conditions 4.0](decks/LICENSE) (`CC BY-SA 4.0`, champ `metadata.license: CC-BY-SA-4.0`).

L'application embarque js-yaml, KaTeX et ses polices, LZ-String et la police OpenDyslexic, sous leurs propres licences (MIT et SIL OFL). Les mentions complètes sont dans [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) et en tête du fichier `index.html` généré.

## État du projet

La version actuelle est `1.0.0-alpha` (voir `package.json`). Le projet est développé avec une IA (Claude) sous supervision humaine : le code, les tests et la documentation sont produits par l'IA, puis relus et pilotés par une personne. Cela peut laisser des erreurs, dans le code comme dans les decks : signale celles que tu trouves.

L'historique des changements est dans [CHANGELOG.md](CHANGELOG.md). Des idées pour la suite sont consignées dans [roadmap/](roadmap/) ; ce sont des pistes, pas des engagements.

## Contribuer et nous joindre

Toutes les contributions sont bienvenues, avec ou sans code : decks, corrections de texte, signalement d'erreurs, retours d'usage. Lis [CONTRIBUTING.md](CONTRIBUTING.md) et le [code de conduite](CODE_OF_CONDUCT.md).

- Signaler un problème ou proposer une idée : [ouvrir un ticket](https://github.com/jmchantrein/train-your-brain/issues).
- Faille de sécurité : voir [SECURITY.md](SECURITY.md).
