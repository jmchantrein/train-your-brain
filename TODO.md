# TODO

## À faire

### À décider ou à activer par le propriétaire

- [ ] Rendre public le dépôt `train-your-brain` (Settings > General > Danger Zone) une fois la CI verte sur son premier commit
- [ ] GitHub Pages : Settings > Pages > Source « GitHub Actions » (le site se déploie depuis `main`)
- [ ] Signalement privé de vulnérabilité : Settings > Code security (`SECURITY.md` y renvoie)
- [ ] Modération : activer « Reported content » (Settings > Moderation) pour recevoir les signalements du code de conduite
- [ ] Niveaux scolaires de 18 decks laissés tels quels faute de source sûre (équations, multiplication de fractions, carrés, cubes, puissances de 2, unités SI, alcalino-terreux, régions et DROM, chiffres romains) : `tmp/levels-audit.md`
- [ ] Mode défi « Jusqu'au bout » : sur un deck neuf il propose jusqu'à 100 cartes (plafond de la séance normale) ; plafond propre à ce mode à décider

### Défauts connus, non traités

- [ ] Code sans appelant restant : six méthodes de `PromptLearner` (`exportLearning`, `importLearning`, `getQualityTrend`, `resetDomain`, `compareIterations`, `getCurrentSession`), `Audio.setVolume`, `Badges.getByRarity`, historique d'erreurs d'`ErrorHandler` sans lecteur (`docs/CODE_ANALYSIS.md`)
- [ ] Sauvegarde de secours : la copie a un enregistrement de retard, une récupération perd au plus le dernier enregistrement
- [ ] En interface anglaise, restent en français : taxonomie de tags (`tags-taxonomy.js`), formulaire du générateur de consignes (`prompt-generator.js`), messages du validateur de decks
- [ ] `tests/runner.html` (runner navigateur) ne charge que 27 des 58 fichiers de tests : l'aligner ou le supprimer
- [ ] Faux doublons restants du validateur de decks (kana, cyrillique, grec, conversions) : filtre des mots de 2 caractères ou moins
- [ ] Palier mort de la progression : jusqu'à 23 jours sans déblocage sur 180 jours (formule de niveau inchangée)
- [ ] Mode clair et mode focus globaux au navigateur, pas par joueur ; à 390 px le panneau des badges peut recouvrir le bouton de lancement d'un défi juste après un déblocage
- [ ] Montées de version majeures : katex 0.19 (corrige 1 vulnérabilité basse), js-yaml 5, jsdom 31
- [ ] Captures du site à échelle réduite (1024×640) : les dégradés de l'application rendent les PNG haute densité trop lourds
- [ ] Non testé : Firefox et Safari (seul Chromium l'est), lecteur d'écran réel, services Lingua Libre / Wikimedia (pas d'accès réseau pendant les travaux), HTTPS réel de GitHub Pages

## Fait

### Revue 2026-11

- [x] 2026-11-22 État des lieux : 385 tests verts sur 7 fichiers (sur 36), build OK après `npm ci`, 8 vulnérabilités npm (devDependencies)
- [x] 2026-11-22 Récupération de la branche non fusionnée `claude/thorough-analysis-I70eq` (20 commits, déc. 2025)
- [x] 2026-11-22 data-storage : dépendances (reste 1 vulnérabilité basse), `npm test`, build qui échoue sur erreur, bugs de `storage`/`exporter`/`yaml`/`compression`, scripts morts
- [x] 2026-11-22 deck-verifier : audit des 111 decks (`tmp/deck-audit.md`)
- [x] 2026-11-22 data-storage : 5 défauts des générateurs de decks
- [x] 2026-11-22 core-engine : normalisation Unicode des réponses (282 cartes acceptaient une réponse vide)
- [x] 2026-11-22 qa-tester : tous les fichiers de tests exécutés par le runner Node
- [x] 2026-11-22 core-engine : 6 défauts de `deck-validator.js` (doublons signalés : 45 635 → 8 418)
- [x] 2026-11-22 code-analyzer : `docs/CODE_ANALYSIS.md` (code mort, duplications)
- [x] 2026-11-22 ui-renderer : XSS sur contenu de deck importé, fuites de listeners, accessibilité
- [x] 2026-11-22 Modes examen et défi (appel à `Validator.check` inexistant), enregistrement des decks multilingues, champ `alternatives` accepté
- [x] 2026-11-22 doc-keeper : documentation resynchronisée (`CLAUDE.md` 42 Ko → 27 Ko, docs, CHANGELOG)
- [x] 2026-11-22 ui-renderer : 9 021 lignes de CSS des visualisations retirées (96 captures identiques au pixel près)
- [x] 2026-11-22 qa-tester : specs e2e réalignées (95 réussis, 0 échec, 24 ignorés)
- [x] 2026-11-22 SVG de deck sans `xmlns` ou sans taille de nouveau affichés
- [x] 2026-11-22 Build final minifié depuis un checkout propre : 132 decks, 3,92 Mo ; 1 839 tests unitaires verts
- [x] 2026-11-22 Suppression des 14 decks non suivis créés par accident dans `decks/maths/` (accord de l'utilisateur)

### Phase 2 (2026-11) : gamification, publication, améliorations

- [x] 2026-11-22 i18n : langue par joueur (fr, en, automatique), dictionnaires à parité (410 clés), parcours principaux sans texte en dur
- [x] 2026-11-22 data-storage : workflows GitHub Actions (`ci.yml`, `pages.yml`), `npm run build:site`, `npm run dev` réel, option `--output`, suppression de `dev.html` et de `scripts/generate-math-decks.cjs`
- [x] 2026-11-22 ui-renderer : page d'accueil du site (`site/`)
- [x] 2026-11-22 `docs/api/` retiré du dépôt (généré, construit dans le site)
- [x] 2026-11-22 gamification : audit (`tmp/gamification-audit.md`, 18 défauts confirmés par exécution)
- [x] 2026-11-22 Audit de publication (`tmp/publication-audit.md`) : aucun secret ; 3 points bloquants
- [x] 2026-11-22 CI : `@playwright/test` épinglé en 1.63.0 (Ubuntu 26.04)
- [x] 2026-11-22 data-storage : capitales en français, générateurs déterministes, 109 decks régénérés sans perte de progression
- [x] 2026-11-22 core-engine : détecteur de doublons 140 fois plus rapide (500 cartes : 3 s → 25 ms), résultat identique
- [x] 2026-11-22 gamification : intégrité de l'XP, série quotidienne, badges défectueux, annonces, jour local
- [x] 2026-11-22 deck-verifier puis data-storage : 16 corrections de capitales après audit sourcé
- [x] 2026-11-22 core-engine : trait d'union et apostrophe équivalents à une espace dans les réponses (186 cartes)
- [x] 2026-11-22 data-storage : XSS stockée par import de sauvegarde, données du joueur typées, `LICENSE`, `THIRD-PARTY-NOTICES.md`, en-tête de licences du build
- [x] 2026-11-22 qa-tester : suite e2e réécrite (routes réelles, aucune spec creuse, `lint-specs.cjs`), 6 bugs applicatifs révélés puis corrigés
- [x] 2026-11-22 data-storage : médias distants non chargés, Content-Security-Policy, licences des enregistrements, police du mode dyslexie embarquée, export complet des cartes
- [x] 2026-11-22 gamification : défis quotidiens bornés par les cartes dues, quêtes hebdomadaires payées, missions par joueur, bilan de séance, badges de mémoire durable
- [x] 2026-11-22 data-storage : réinitialisation effective, profil cohérent entre ses deux clés, suppression de deck pour tous les joueurs
- [x] 2026-11-22 ui-renderer : bugs d'interface révélés par les e2e, noms de badges illisibles, accessibilité
- [x] 2026-11-22 core-engine et ui-renderer : code mort retiré (modules, interface, 2 825 lignes de CSS), utilitaires fusionnés dans `TextUtils`
- [x] 2026-11-22 doc-keeper : README public, CONTRIBUTING, SECURITY, CODE_OF_CONDUCT, gabarits, CLAUDE.md et docs resynchronisés
- [x] 2026-11-22 ui-renderer : site réaligné, captures refaites, adresses absolues
- [x] 2026-11-23 gamification : mode défi réellement intégré (une séance normale avec un objectif, 2 modes, bonus borné)
- [x] 2026-11-23 i18n : féminin par défaut avec réglage masculin / point médian, tutoiement partout, badges, thèmes et tutoriel traduits
- [x] 2026-11-23 Licence `AGPL-3.0-or-later` ; `index.html` régénéré (4,64 Mo, 132 decks) ; 2 314 tests unitaires et 199 tests e2e verts sur le fichier livré

### Phase 3 (2026-11) : décisions du propriétaire

- [x] 2026-11-23 Décisions prises : dépôt neuf sans historique, contact par les issues GitHub, copyright Jean-Mathieu Chantrein, decks sous CC BY-SA 4.0, quatre modes de défi, reformulations de badges gardées, pastilles d'âge retirées, Malabo refusée, cartes de capitales évidentes retirées, clause de contribution gardée, signalements par les outils de GitHub, nom « Train Your Brain », `index.html` gardé commité, `viz-auditor` supprimé
- [x] 2026-11-23 data-storage : decks sous CC BY-SA 4.0, Malabo refusée, neuf cartes `cap_*_from_cap` retirées
- [x] 2026-11-23 deck-verifier puis data-storage : audit des niveaux scolaires deck par deck (63 corrigés, 13 retirés), filtre « Niveaux » opérant sur les decks de maths
- [x] 2026-11-23 doc-keeper : renommage en « Train Your Brain », copyright, contact, code de conduite, clause de contribution étendue aux decks, `viz-auditor` supprimé
- [x] 2026-11-23 gamification : quatre modes de défi (Parcours, Sans erreur, Contre la montre, Jusqu'au bout), cibles de Contre la montre alignées sur Parcours
- [x] 2026-11-23 core-engine : repli sur les sauvegardes de secours à la lecture, messages de quota, retrait de `ComponentCard` et d'une quarantaine de méthodes appelées seulement par les tests (`PromptLearner` gardé : le générateur de consignes l'appelle)
- [x] 2026-11-23 ui-renderer : pastilles d'âge et filtre par âge retirés, contact par les issues GitHub, bouton « modifier » accessible sous 768 px
- [x] 2026-11-23 data-storage : l'export d'un deck conserve licence et source, `pythagore` sorti de la trigonométrie
- [x] 2026-11-23 doc-keeper : seconde passe de renommage, documentation et compteurs resynchronisés (2 274 tests unitaires, 206 tests e2e)
- [x] 2026-11-23 `index.html` et captures du site régénérés ; pull request vers `main` ouverte (jmchantrein/offline-train-your-brain#12)
- [x] 2026-11-23 Publication : commit initial unique poussé dans le dépôt neuf `jmchantrein/train-your-brain` (sans l'ancien historique)
