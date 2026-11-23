# Journal des changements

Toutes les modifications notables de ce projet sont décrites ici, en français, de la plus récente à la plus ancienne. Le format s'inspire de [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/) et le projet suit le [versionnement sémantique](https://semver.org/lang/fr/). Le projet est en version alpha (`1.0.0-alpha`) et n'a pas encore publié de version numérotée : les entrées sont donc datées.

## [2026-11-23] - Copies de secours branchées, retrait de code mort

### Projet et mode défi

- **Renommage** : l'application s'appelle « Train Your Brain » (dépôt `jmchantrein/train-your-brain`) ; elle fonctionne toujours entièrement hors ligne.
- **Quatre modes de défi** : Parcours, Sans erreur, Contre la montre (seul mode chronométré, jamais présélectionné ni proposé avec le mode dyslexie ou l'espacement large) et Jusqu'au bout (toutes les cartes à réviser, à partir de 20). Les anciens liens et scores restent lus. Règles : `docs/GAMIFICATION.md`.
- **Pastilles d'âge retirées** : les pastilles d'âge et le filtre par âge disparaissent de la table des decks ; le contact passe par les issues GitHub.

### Decks

- **Licence** : les decks sont sous licence CC BY-SA 4.0 (`decks/LICENSE`, `metadata.license` dans chaque deck).
- **Niveaux scolaires** : audit deck par deck (niveaux corrigés sur 63 decks, retirés sur 13 qui n'en ont pas) ; les decks générés portent leurs tags de taxonomie dans `category` (`BaseGenerator.finalizeDeck`), si bien que le filtre « Niveaux » de l'exploration retrouve les decks de maths.

### Corrections

- **Export** : l'export YAML et JSON d'un deck n'efface plus `metadata.license` ni `metadata.source` (l'attribution CC BY-SA est conservée) ; l'import YAML relit ce bloc.
- **Taxonomie** : `pythagore` n'a plus `trigonometrie` pour parent.

### Données des joueurs

- **Récupération automatique.** Quand une donnée enregistrée est illisible (absente, abîmée, tronquée, structure refusée), l'application relit la copie de secours écrite avant le dernier enregistrement, la remet en place et affiche « Tes données ont été restaurées depuis la dernière sauvegarde ». Cela concerne le profil du joueur, la liste des joueurs, la progression des decks (simple et multilingue), les decks personnalisés et leur index. Une donnée saine n'est jamais remplacée ; une copie illisible est ignorée. Une liste des joueurs abîmée sans copie est reconstruite depuis les profils au lieu d'être renvoyée vide (un ajout ultérieur l'aurait écrasée). La copie a un enregistrement de retard : une récupération peut perdre le dernier.
- **Stockage presque plein.** Un message unique par session prévient le joueur (exporter ses données, supprimer des decks personnalisés volumineux). Un second message, une fois par session, signale un stockage plein.
- La liste des joueurs a désormais, elle aussi, une copie de secours. Les suppressions volontaires (joueur, deck, progression) retirent la copie : une donnée supprimée ne ressuscite pas.

### Code retiré

- `ComponentCard` (`components/card.js`), `Effects.toast`, `Charts.getXPProgression`, `Leitner._shuffleArray`, 37 méthodes ou constantes de modules appelées seulement par leurs tests (liste dans `docs/CODE_ANALYSIS.md`), les tests correspondants (dont `card-component.test.js` et `compression-json.test.js`) et cinq clés de traduction inutilisées. `PromptLearner` est conservé : le générateur de prompts l'appelle.

## [2026-11-22] - Revue du projet et préparation à la publication

Cette entrée regroupe la revue complète du projet (code, decks, documentation) et les travaux qui préparent l'ouverture du dépôt au public.

### Sécurité et vie privée

- **Sauvegardes piégées.** Un fichier de sauvegarde ou de progression modifié pouvait faire exécuter du code dans l'application, à chaque affichage et après rechargement. Les données importées sont maintenant ramenées à leurs types documentés à l'import et au chargement, une sauvegarde inutilisable est rejetée sans rien écrire, et les affichages concernés échappent leur contenu.
- **Contenu des decks.** Le contenu des decks est échappé dans toutes les pages et tous les composants, guillemets compris.
- **Aucun accès réseau caché.** Un média distant référencé par un deck (image, son) n'est plus jamais chargé automatiquement : l'application affiche un lien avec un avertissement. Cela empêche l'auteur d'un deck de savoir quand une carte est jouée.
- **Politique de sécurité du contenu (CSP)** intégrée à la page générée : les connexions sont limitées à Lingua Libre, Wikimedia et Wikidata, utilisés à la demande dans les créateurs de decks de dictée et multilingues.
- **Police du mode dyslexie** : OpenDyslexic est maintenant embarquée dans le fichier. Elle était chargée depuis un service tiers et n'avait donc aucun effet sans connexion.
- **Lingua Libre** : une licence inconnue n'est plus enregistrée comme « CC0 » ; l'auteur, la licence et la source de chaque enregistrement sont conservés, affichés et exportés.
- **Export Moodle XML** : une séquence `]]>` dans une carte ne peut plus injecter d'éléments dans le fichier exporté.
- **Licences.** Ajout du fichier `LICENSE` (texte de la GNU AGPL v3) et de `THIRD-PARTY-NOTICES.md` (js-yaml, KaTeX et ses polices, LZ-String, OpenDyslexic). Le fichier `index.html` généré commence par un commentaire qui liste les composants embarqués et leurs licences, y compris en version minifiée.

### Gamification

Plusieurs mécanismes étaient affichés sans avoir d'effet. Ils ont été vérifiés et corrigés. Aucun badge déjà obtenu n'est retiré.

- **Prime de série** : elle est créditée une fois, quand la série de bonnes réponses atteint un palier (elle était affichée sans être ajoutée à l'XP).
- **Série de jours** : elle restait bloquée à zéro. Elle compte désormais les jours de révision consécutifs, et un jour sans carte à réviser ne la casse pas.
- **Jours et semaines** : ils suivent l'heure locale, avec la semaine qui commence le lundi, et non plus l'heure UTC.
- **Niveaux** : la montée de niveau est détectée à chaque gain d'XP et célébrée une seule fois.
- **Badges** : les badges gagnés pendant une séance figurent dans le bilan et sont annoncés ensemble ; plusieurs badges attribués à tort ou impossibles à obtenir sont corrigés ; les badges de matière comptent les cartes distinctes maîtrisées. Le multiplicateur de combo, affiché sans effet, est retiré.
- **Défis quotidiens** : ils sont enregistrés par profil et conservés au rechargement. Ils sont limités aux cartes réellement à réviser ce jour-là (au plus 10 cartes), se cumulent sur la journée et ne dépendent plus du niveau. Un jour sans carte à réviser n'a pas de défi à manquer.
- **Quêtes hebdomadaires** : elles se mesurent depuis le lundi de la semaine et non plus sur les totaux depuis le début. Leur XP est créditée une seule fois.
- **Poids des missions** : défis et quêtes rapportent environ 9 % de l'XP au lieu de 30 % : la révision reste la première source de points.
- **Bilan de séance** : il indique les cartes passées en boîte verte, les cartes à revoir et la prochaine date de révision utile. Les confettis n'apparaissent qu'à partir de 80 % de bonnes réponses.
- **Badges** : 43 au total. Le badge du soir (« Chouette du Soir ») se gagne désormais entre 18 h et 21 h, au lieu de la nuit ; les personnes qui l'avaient le gardent. Trois badges récompensent la mémoire durable (cartes qui n'ont plus besoin d'être revues avant 7 ou 14 jours).
- **Données** : « Réinitialiser mes données » réinitialise vraiment (le profil revenait au rechargement) ; supprimer définitivement un deck supprime aussi sa progression pour tous les profils.

Barèmes détaillés : [docs/GAMIFICATION.md](docs/GAMIFICATION.md).

### Decks

- **Capitales** : noms français pour les 194 capitales, le nom anglais ou local restant accepté, avec les bonnes prépositions (« de la », « du », « des », « d' »). Corrections après une vérification sourcée : Eswatini (Mbabane), Soudan du Sud (Djouba), Israël et Pays-Bas (Tel Aviv et La Haye ne sont plus acceptées comme capitales), Kazakhstan (anciens noms retirés), Guinée équatoriale (Ciudad de la Paz), et des explications plus justes pour d'autres pays.
- **Équations, fractions, pourcentages** : sept decks qui n'étaient qu'un échantillon de ce que leur générateur peut produire sont maintenant complets, avec 20 cartes au plus par séance. Dix cartes en double sont retirées.
- **Reproductibilité** : les générateurs de decks produisent le même résultat à chaque exécution. Les identifiants des cartes sont conservés : la progression des joueurs n'est pas perdue.
- **Contenu** : questions identiques rendues distinctes (kana, verbes, préfixes SI), règle d'arrondi énoncée dans la question, accords corrigés en formation de l'oreille.
- **Tableau périodique** : l'image est maintenant générée localement, au lieu d'être chargée depuis Wikimedia.
- Le build contient 132 decks : 2 écrits à la main et 130 produits par des générateurs, dont 109 ont une copie figée dans `decks/procedural/`.

### Réponses et révision

- **Tirets et apostrophes** : « Porto Novo » est accepté pour « Porto-Novo » (186 cartes de texte concernées dans les decks fournis).
- **Lettres accentuées et écritures non latines** : la comparaison des réponses conserve les lettres de toutes les écritures et ne retire les accents que sur l'alphabet latin ; le signe moins, la barre de fraction et les altérations musicales gardent leur sens ; `2,5` et `2.5` sont équivalents.
- **Réponses alternatives** : le champ `alternatives` d'une carte est accepté comme bonne réponse dans le jeu et l'examen.
- **Mode examen** : il plantait à chaque réponse ; il fonctionne.
- **Validation des decks** : meilleure détection des doublons (insensible aux espaces et à la ponctuation, mots très courts ignorés, grands nombres avec séparateurs), comptage des syllabes en français réécrit, noms propres Unicode pris en charge.

### Accessibilité

- Les noms de badges ne débordent plus de leur carte.
- La répartition des boîtes, les barres de progression et les vies des défis ont un équivalent textuel pour les lecteurs d'écran.
- Les badges verrouillés gardent une description lisible.
- Les annonces au clavier et les liens d'évitement suivent la langue de l'interface ; les messages temporaires restent affichés au moins 6 secondes.
- Fuites d'écouteurs d'événements et autres défauts d'accessibilité de l'interface corrigés.

### Internationalisation

- **Langue par profil** : chaque profil choisit sa langue (français, anglais ou automatique) ; le choix est appliqué au chargement et au changement de profil (c'était un réglage global qui ignorait le profil).
- **Dictionnaires complets** : plus de 400 textes en français et en anglais ; les parcours principaux (profil, accueil, jeu, bilan, paramètres, examen) n'ont plus de texte français écrit en dur, étiquettes d'accessibilité comprises. Un test vérifie que les deux dictionnaires correspondent.
- Les noms des badges, des défis et des thèmes, ainsi que le tutoriel, étaient encore en français uniquement (traduits depuis : voir « Mode défi, forme grammaticale et interface tutoyée »).

### Import, export et données

- L'import d'un fichier YAML depuis la page « Créer & Gérer » échouait ; il fonctionne.
- L'import de progression YAML et la déconnexion n'enregistraient pas la progression des decks ; corrigé.
- L'export YAML et JSON conserve tous les champs d'une carte (alternatives, indices, explications, textes à trous, médias, points, réglages du deck) ; l'import les relit. Les textes ambigus (nombres, booléens) sont cités pour un aller-retour fidèle.
- Les graphiques et statistiques regroupent l'XP par jour local.
- Stockage : `importAll` valide avant d'écrire et écrit la progression chez le profil importé ; corbeille avec retour arrière en cas d'échec ; supprimer un profil nettoie aussi sa progression multilingue et ses copies de secours ; erreur de quota de Firefox reconnue ; progression des decks séparée par profil.
- Éditeur de decks : il n'affiche plus le deck précédemment ouvert quand on le quitte sans enregistrer ; une carte sans question ou sans réponse ne peut plus être enregistrée ; un deck de dictée vide n'est plus proposé à l'enregistrement.
- Le menu du profil ne se bloque plus après un changement de thème ou de langue ; l'entrée « Profil » ne pointe plus vers une page inexistante.

### Outillage et CI

- **Intégration continue** (GitHub Actions) : `.github/workflows/ci.yml` lance, à chaque push et pull request, les tests unitaires et le build minifié, les tests e2e Chromium et le build du site ; `.github/workflows/pages.yml` déploie le site sur GitHub Pages à chaque push sur `main`.
- **Site** : `npm run build:site` produit `_site/` (page d'accueil de `site/`, application dans `app/`, documentation du code dans `api/`). La documentation JSDoc n'est plus conservée dans le dépôt : elle est générée à la demande.
- **Mode développement** : `npm run dev` construit dans `.dev/`, sert l'application sur http://localhost:3000/ et reconstruit quand `src/`, `decks/` ou `build.manifest.json` changent. L'ancien gabarit vide, qui ne chargeait aucun module, est supprimé.
- **Build** : l'option `--output <chemin>` écrit le fichier ailleurs qu'à la racine ; `SOURCE_DATE_EPOCH` fixe l'horodatage pour un build reproductible ; le build échoue (code 1) si une entrée du manifeste, une bibliothèque, la minification ou une génération de deck échoue ; decks et médias sont lus dans l'ordre alphabétique ; à identifiant égal, un deck YAML l'emporte sur un deck généré.
- **Tests** : plus de 2 000 tests unitaires (contre 385 avant la revue), tous les fichiers `tests/*.test.js` étant exécutés par `npm test` ; filtre `TEST_FILTER=<sous-chaîne>`. La suite e2e Playwright est réécrite : elle vise les vraies routes, n'ignore aucun test et bloque le réseau externe. `E2E_APP=<chemin>` vise un autre build ; `node tests/e2e/lint-specs.cjs` repère les specs qui peuvent passer sans rien vérifier.
- **Versions** : `.nvmrc` fixe la version de Node (24) ; `@playwright/test` est figé en 1.63.0.
- **Dépôt** : ajout de `CONTRIBUTING.md` réécrit, `SECURITY.md`, `CODE_OF_CONDUCT.md`, des gabarits de tickets et de pull request, et des champs `repository`, `homepage`, `bugs` dans `package.json`.
- Le build vérifie qu'un composant embarqué est bien listé dans les mentions de licences.

### Documentation

- `CLAUDE.md` réduit et aligné sur le dépôt ; versions alignées sur `package.json` ; commandes corrigées dans `README.md`, `CONTRIBUTING.md`, `tests/INDEX.md` et `docs/*.md`.
- `README.md` réorganisé pour les personnes qui découvrent le projet, avec une description exacte de la vie privée et des accès réseau.

### Retraits

- **Outils de visualisation interactifs** (retirés le 2025-12-19) : leur documentation est supprimée.
- Scripts et fichiers obsolètes : anciens scripts de migration et de correction, ancien script de tests d'hallucination, ancien générateur de decks de maths (remplacé par les générateurs de `scripts/generators/`), rapport de session des tests e2e et analyse de code des visualisations.

### Mode défi, forme grammaticale et interface tutoyée

- **Mode défi intégré.** Il existait dans le code sans qu'aucun écran y mène. Un défi est maintenant une autre façon de faire ses révisions : une séance normale avec un objectif, sur les mêmes cartes à réviser, avec la même progression et le même repos. Il est accessible depuis la page des défis et depuis l'action « Défi » de la ligne d'un deck (decks standard seulement).
- **Deux modes** au lieu de quatre : « Parcours » (un taux de réussite à atteindre) et « Sans erreur » (une série de bonnes réponses). Plus de vies, plus de mode « endurance ». Le chronomètre est facultatif, décoché par défaut, et n'est pas proposé avec le mode dyslexie ou l'espacement large.
- **Récompense** : 3 XP de bonus pour un défi réussi, une fois par jour au plus (un défi rapportait auparavant de 130 à 630 XP). Sans carte à réviser, l'entraînement libre porte sur des cartes au repos et ne change ni les boîtes, ni le repos, ni l'XP. Règles complètes : `docs/GAMIFICATION.md`, « Mode défi ».
- **La quête hebdomadaire « défis »** devient atteignable : deux défis réussis sur deux jours différents.
- **Forme grammaticale au choix** : les textes français qui désignent la personne qui joue sont au féminin par défaut ; un réglage par profil, dans les paramètres (visible en français), permet de choisir le masculin ou la forme à point médian. Une formulation sans accord reste préférée ; 20 textes portent des variantes. Les accords en nombre « (s) » sont remplacés par des paires singulier / pluriel.
- **Interface française au tutoiement**, partout. Badges, thèmes, tutoriel et les pages restantes sont traduits (dictionnaire français : de 385 à 1 089 clés). Restent en français quand l'interface est en anglais : le contenu des decks, les libellés des tags, le formulaire du générateur de consignes et les messages du validateur de decks.
- Les chiffres du tutoriel sont lus dans le code ; des formulations jugeantes sont adoucies ; « Presque ! » ne s'affiche que pour une réponse proche.
- Tests : 2 314 tests unitaires (58 fichiers) et 199 tests e2e (9 fichiers).

### Problèmes connus

- `tests/runner.html` (tests dans le navigateur) ne charge que 27 fichiers de test ; `npm test` les exécute tous.

## [2025-12] - Fonctions développées avant la revue

Entrées reconstituées d'après l'historique du dépôt (décembre 2025).

### Ajouts

- **Copies de secours** automatiques du `localStorage` avant les sauvegardes importantes (`createBackup()`, `restoreFromBackup()`, `hasBackup()`, `listBackups()`).
- **Minification** du JavaScript et du CSS : commande `npm run build:prod`, build réduit d'environ 38 % (885 Ko vers 545 Ko).
- **Validation des données** au chargement (profil, statistiques, progression, réglages), avec correction automatique des valeurs invalides.
- **Gestion du quota** du `localStorage` : vérification avant chaque sauvegarde, avertissement à 80 % et seuil critique à 95 %.
- **Index des tags** pré-calculés pour des recherches rapides.
- **Internationalisation** français et anglais, **générateur de prompts** pour créer des decks avec une IA, **éditeur de deck** avec édition des cartes, **filtres par catégorie** dans l'exploration, possibilité de **masquer des decks**.

### Modifications

- Le module `similarity.js` est fusionné dans `validator.js` (environ 220 lignes en moins), avec `getAccuracyPercentage()`, `getDifferences()`, `checkAnswerWithDetails()` et une normalisation prenant en charge les accents et les ligatures (œ, æ).
- Toutes les sauvegardes passent par `_saveWithBackup()`.

### Corrections

- Alignement des catégories de deck sur la taxonomie.
- Format des QCM dans le générateur de prompts.

## [1.0.0-dev] - 2025-11-29

Date du premier commit du dépôt.

### Ajouts

- Application de cartes mémoire fonctionnelle, avec les quatre boîtes de la méthode de Leitner (à jouer, violette, orange, verte).
- Gamification : XP, niveaux, badges, défis quotidiens.
- Fonctionnement hors-ligne complet, en `file://`, dans un seul fichier `index.html`.
- Éditeur de decks YAML, import et export des données.
- Médias (images, sons) intégrés aux decks.
- Thèmes clair et sombre, interface adaptée aux écrans de toutes tailles.

### Technique

- JavaScript ES2022 sans framework, variables CSS, `localStorage` pour la persistance, build Node.js qui concatène les modules.

---

## Guide des versions

- **Majeure** (1.0.0) : changements incompatibles avec les versions précédentes.
- **Mineure** (0.1.0) : nouvelles fonctionnalités compatibles.
- **Correctif** (0.0.1) : corrections de bugs compatibles.

## Liens

- [Dépôt](https://github.com/jmchantrein/train-your-brain)
- [Documentation](./docs/)
- [Guide de contribution](./CONTRIBUTING.md)
