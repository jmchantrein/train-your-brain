# Politique de sécurité

Merci de signaler les failles de sécurité de façon responsable. Ce document explique quoi signaler, comment, et ce qui est hors du périmètre.

## Versions concernées

Le projet est en version alpha (`1.0.0-alpha`, voir `package.json`). Seule la dernière version est suivie : la branche `main` du dépôt, le site publié à partir d'elle et le dernier fichier `index.html`. Il n'y a pas de versions plus anciennes maintenues. Les corrections sont publiées sur `main`.

## Modèle de menace

- **Application locale.** L'application est un fichier HTML exécuté dans le navigateur de la personne qui l'utilise. Il n'y a pas de serveur à nous, pas de compte, pas de base de données distante. Les données (profils, progression, réglages) sont dans le `localStorage` du navigateur.
- **Contenus importés non fiables.** Un deck (YAML, JSON, Moodle XML) ou une sauvegarde reçus d'une autre personne peuvent être hostiles : une personne qui enseigne importe un deck trouvé en ligne, ou des élèves échangent une sauvegarde. Le contenu importé est échappé avant affichage, les données d'une sauvegarde sont ramenées à leurs types à l'import et au chargement, et les médias distants ne sont jamais chargés automatiquement. Une faille dans ces protections est une faille de sécurité pour ce projet.
- **Politique de sécurité du contenu (CSP).** La page générée contient une CSP qui n'autorise que le script de l'application (identifié par son empreinte) et limite les connexions aux hôtes de Lingua Libre, Wikimedia Commons et Wikidata, utilisés à la demande dans les créateurs de decks de dictée et multilingues.
- **Accès réseau.** L'application n'émet aucune requête au démarrage, en jeu, en examen, à l'import ni à l'export. Les seules requêtes sont celles de ces créateurs de decks.
- **Ce que vise la menace.** L'exécution de code dans la page (XSS) par un deck ou une sauvegarde piégés, la fuite de données du profil vers un tiers, un média qui révèle l'activité de la personne, ou la corruption de données par un import malveillant.

## Signaler une vulnérabilité

**Ne publie pas la faille dans un ticket ou une discussion publics.**

Utilise le signalement privé de vulnérabilité de GitHub : sur la page du dépôt, onglet **Security**, puis **Report a vulnerability** (« Signaler une vulnérabilité »). Le signalement n'est visible que par toi et par les responsables du projet.

Si ce bouton n'est pas disponible, ouvre un ticket public qui dit seulement qu'une faille est à signaler en privé, sans détail, et nous organiserons un échange.

Pour nous aider, indique si possible :

- la version ou le commit concerné, et le navigateur utilisé ;
- les étapes pour reproduire la faille, avec le deck ou la sauvegarde qui la déclenche (en pièce jointe privée) ;
- l'effet constaté et ce que cela permettrait à une personne malveillante ;
- une piste de correction, si tu en as une.

Nous lisons les signalements dès que possible, te tenons au courant de l'avancement, et te créditons dans le journal des changements si tu le souhaites. Nous ne pouvons pas promettre de délai précis.

## Hors périmètre

Les cas suivants ne sont pas des failles de sécurité de l'application. Tu peux néanmoins les signaler comme des tickets ordinaires.

- Une personne qui a déjà accès à l'appareil ou au navigateur (lecture du `localStorage`, modification des fichiers, console du navigateur). Le `localStorage` n'est pas chiffré ; l'application ne protège pas contre cet accès.
- Une personne qui colle elle-même du code dans la console du navigateur ou modifie son propre fichier `index.html`.
- La perte de données due à l'effacement des données du navigateur, à un navigateur en navigation privée ou à une saturation du stockage. Exporte des sauvegardes régulières.
- Les failles des services interrogés à la demande (Lingua Libre, Wikimedia Commons, Wikidata), du navigateur ou de GitHub Pages. Signale-les aux éditeurs concernés.
- Les erreurs de contenu dans un deck (fait inexact, faute). Ce sont des erreurs à corriger, pas des failles : voir [CONTRIBUTING.md](CONTRIBUTING.md).
- Les vulnérabilités des dépendances de développement (outils de build et de test) qui n'atteignent pas le fichier distribué. Les bibliothèques embarquées dans l'application (js-yaml, KaTeX, LZ-String) sont, elles, dans le périmètre si leur faille est exploitable dans l'application.
- Les rapports automatiques sans démonstration d'un effet réel dans l'application.
