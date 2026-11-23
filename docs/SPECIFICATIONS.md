# Cahier des Charges Fonctionnel

## 1. Présentation

**Train Your Brain** est une application de révision par flashcards utilisant le système Leitner (répétition espacée). Elle permet d'apprendre efficacement en adaptant la fréquence de révision à la maîtrise de chaque carte.

### Public Cible

- Étudiants (primaire, collège, lycée, supérieur)
- Autodidactes
- Toute personne souhaitant mémoriser des informations

### Objectifs

1. Faciliter la mémorisation à long terme
2. Adapter automatiquement le rythme de révision
3. Motiver via la gamification
4. Fonctionner sans connexion internet

---

## 2. Fonctionnalités

### 2.1 Gestion des Joueurs

#### Création de Profil

- Saisie du nom (obligatoire)
- Génération automatique d'un ID unique
- Initialisation des statistiques à zéro

#### Persistance

- Sauvegarde automatique dans localStorage
- Chargement au démarrage de l'application
- Export/Import du profil complet ; un import est assaini avant écriture (types, bornes) et ne remplace jamais la progression d'un autre joueur (`docs/ARCHITECTURE.md`, section Stockage)

#### Langue et apparence par joueur

- Langue de l'interface : réglage du joueur (`player.settings.language` : `fr`, `en` ou automatique). En automatique, ou sans choix, la langue du navigateur s'applique parmi les langues prises en charge ; à défaut, le français.
- Thème et options d'accessibilité (dont la police pour dyslexie) suivent le joueur courant et s'appliquent au changement de profil.
- Forme grammaticale (français seulement) : réglage du joueur `player.settings.grammaticalForm`, `feminine` par défaut, `masculine` ou `inclusive` (point médian). Il se règle dans les paramètres (visible quand l'interface est en français) et s'applique tout de suite. L'interface française tutoie le joueur ; l'anglais ignore ce réglage. Mécanisme : `docs/ARCHITECTURE.md`, « Internationalisation ».
- Missions (défis quotidiens, quêtes hebdomadaires) : propres au joueur, conservées dans son profil et exportées avec lui.

### 2.2 Gestion des Decks

#### 2.2.1 Decks Prédéfinis

- Decks embarqués dans l'application
- Organisés par catégorie (maths, langues, sciences, etc.)
- Non modifiables par l'utilisateur

#### 2.2.2 Création de Decks Custom

- Éditeur split-view (Code YAML / Aperçu visuel)
- Synchronisation temps réel YAML ↔ JSON
- Validation en temps réel avec feedback
- Templates pour différents types de cartes
- Support LaTeX dans questions/réponses

#### 2.2.3 Système de Tags Hiérarchiques

- Taxonomie multi-niveaux (Domaines, Niveaux, Compétences, Thèmes, Formats)
- Relations multi-parents possibles
- Suggestions intelligentes basées sur sélections
- Filtrage avancé des decks par combinaison de tags

#### 2.2.4 Support LaTeX / Formules

- Rendu KaTeX inline (`$...$`) et display (`$$...$$`)
- Support dans questions, réponses et feedbacks
- Prévisualisation temps réel dans l'éditeur

#### 2.2.5 Validation et Qualité

- Validation structure YAML/JSON automatique
- Calcul lisibilité Flesch-Kincaid
- Détection de problèmes pédagogiques
- Suggestions d'amélioration

#### 2.2.6 Import/Export Multi-formats

- **Import** : YAML, JSON
- **Export** : YAML, JSON, Moodle XML
- L'export YAML et JSON conserve tous les champs de contenu d'une carte (dont `alternatives`, `hint`, `acceptedAnswers`, `choices`, `blanks`, `feedbackCorrect`, `feedbackIncorrect`, `tags`) et tous les réglages du deck (`tests/exporter-roundtrip-fields.test.js`). La progression (boîte, repos, seuil) ne fait pas partie de l'export d'un deck.
- L'export YAML et JSON d'un deck, classique ou multilingue, conserve l'objet `metadata` tel quel (`license`, `source` avec tous ses champs, `originalUrl`), car la licence CC BY-SA exige l'attribution et la mention de licence ; un deck sans `metadata` n'écrit aucun bloc. L'import YAML (`YAML.parseDeck`) relit ce bloc.
- L'export Moodle XML garde le contenu hostile inerte (séquence `]]>` neutralisée).

#### 2.2.6 bis Médias de deck

- Les médias embarqués (`data:`, `blob:`) s'affichent.
- Un média distant (`http(s)`) n'est jamais chargé automatiquement : la carte affiche un lien explicite que l'utilisateur ouvre s'il le souhaite (nouvel onglet, sans Referer). Une source d'un autre type (`javascript:`, chemin relatif) n'est pas rendue.
- Implémentation : `CardMedia` (`src/ui/components/card-media.js`).

#### 2.2.7 Progression

- Sauvegarde de la progression par deck
- Indépendante du deck source
- Fusion au chargement (deck + progression)

### 2.3 Session de Jeu

#### Démarrage

1. Sélection d'un deck
2. Affichage des statistiques du deck
3. Options de session (ignorer repos, filtrer par boîte)
4. Bouton "Commencer"

#### Déroulement

1. Affichage de la question
2. Zone de saisie de la réponse
3. Validation (bouton ou touche Entrée)
4. Affichage du feedback (correct/incorrect)
5. Transition vers la carte suivante
6. Répéter jusqu'à fin des cartes

#### Fin de Session

- Résumé des résultats
- XP gagnés
- Badges débloqués
- Défis progressés/complétés
- Option "Rejouer" ou "Retour"

### 2.4 Système Leitner

> **📖 Documentation complète** : `docs/LEITNER_SYSTEM.md`

4 boîtes (`never_played` → `purple` → `orange` → `green`) avec transitions selon la réponse (correcte/incorrecte) et la rapidité. Repos adaptatif pour les cartes vertes (3 à 48+ jours selon performance).

### 2.5 Validation des Réponses

#### Types

| Type | Description | Exemple |
|------|-------------|---------|
| `numeric` | Nombre | 42, 3.14 |
| `exact_text` | Texte exact | "Paris" |
| `fuzzy_text` | Texte approximatif | "Pariss" → "Paris" |
| `mcq` | Choix multiple (une réponse) | A, B, C, D |
| `multiple_response` | Choix multiple (plusieurs réponses) | A, C, D |
| `true_false` | Vrai/Faux | Vrai, Faux |
| `fill_in_the_blank` | Texte à trous | "La capitale est ___" |
| `matching` | Associations | A→1, B→2, C→3 |
| `ordering` | Ordre correct | 1, 3, 2, 4 → 1, 2, 3, 4 |

#### Normalisation

Source unique : `TextUtils.normalizeText` (`src/modules/text-utils.js`). `Validator.normalizeText` et `DeckValidator` y délèguent.

- Conversion en minuscules
- Ligatures `œ` → `oe`, `æ` → `ae`
- Trait d'union et apostrophe (droite ou typographique) entre deux lettres ou chiffres valent une espace : `Porto-Novo` = `porto novo`, `l'eau` = `l eau`
- Suppression des accents **uniquement sur les lettres latines** (`é` → `e`, `ñ` → `n`) ; les lettres des autres écritures sont conservées telles quelles (`й` reste distinct de `и`, `ё` de `е`, le japonais et le cyrillique sont comparables)
- Conservation des symboles porteurs de sens : signe moins (`-3`, `−3`), barre de fraction (`1/2`), altérations musicales `♭ ♮ ♯`, `+ ^ % °` et les symboles mathématiques
- Séparateur décimal normalisé : `2,5` et `2.5` sont équivalents
- Suppression de la ponctuation restante, réduction des espaces multiples, trim

En comparaison stricte (hors mode sensible à la casse), les espaces sont en plus ignorés : `Porto-Novo`, `Porto Novo` et `PortoNovo` sont équivalents (`Validator._compact`). La comparaison approximative accepte aussi cette forme soudée.

#### Réponses acceptées

- La réponse principale (`answer`) est toujours acceptée.
- Le champ `alternatives` d'une carte est une bonne réponse, au même titre que `acceptedAnswers` et que la réponse principale.
- `GameAnswerValidator.checkAnswer(card, userAnswer, deck)` (`src/ui/game/answer-validator.js`) est le point d'entrée partagé par le jeu, le mode examen et le mode défi.

#### Validation Avancée (Fuzzy)

- Algorithme Damerau-Levenshtein (`Validator.damerauLevenshtein`) : distance d'édition avec transpositions
- Seuil configurable par deck (`similarityThreshold`, défaut 0.8, actif si `similarityMatching` est vrai)

### 2.6 Gamification

> **📖 Documentation complète** : `docs/GAMIFICATION.md`

- **XP** : +1/+2/+3 par carte (purple/orange/green) + bonus streak
- **Niveaux** : `floor(sqrt(XP / 100)) + 1`
- **Badges** : 43 badges (7 catégories dont les badges secrets, 4 raretés)
- **Missions** : 3 défis quotidiens (`review_due`, `accuracy`, `green_streak`) + 5 quêtes hebdomadaires
- **Mode défi** : une autre façon de faire ses révisions, avec un objectif, en quatre modes (Parcours, Sans erreur, Contre la montre, Jusqu'au bout ; seul Contre la montre est chronométré) ; bonus de 3 XP au plus une fois par jour. Accessible depuis la page des défis et depuis la ligne d'un deck. Règles : `docs/GAMIFICATION.md`, « Mode défi »

### 2.7 Statistiques

#### Globales (Joueur)

- XP total et niveau
- Cartes jouées totales
- Sessions totales
- Streak actuel (jours)
- Meilleur streak
- Badges débloqués

#### Par Deck

- Cartes par boîte (never_played, purple, orange, green)
- Pourcentage de maîtrise
- Dernière session
- Prochaines cartes disponibles

#### Par Carte

- Boîte actuelle
- Seuil de latence
- Meilleur temps
- Dernier temps
- Date prochaine révision

#### Graphiques Disponibles

| Type | Usage | Données |
|------|-------|---------|
| Donut | Répartition par boîte | % cartes par couleur |
| Bar | Progression temporelle | XP/sessions par jour |
| Line | Évolution niveau | Courbe XP cumulative |
| Heatmap | Activité calendrier | Jours joués sur 12 mois |

### 2.8 Interface Utilisateur

#### Pages

| Page | Route | Description |
|------|-------|-------------|
| Accueil | `#/` | Splash/Login |
| Home | `#/home` | Hub principal |
| Jeu | `#/game/:id` | Session de jeu normale |
| Deck | `#/deck/:id` | Redirige vers `#/game/:id` (`#/explore` sans identifiant) |
| Ressources | `#/deck-resources/:id` | Ressources pédagogiques d'un deck |
| Révision | `#/deck-review/:id` | Consultation des cartes Q/R d'un deck |
| Fusion | `#/deck-merger` | Fusion de plusieurs decks |
| Explorer | `#/explore` | Tous les decks |
| Stats | `#/stats` | Statistiques avec graphiques |
| Badges | `#/badges` | Collection de badges |
| Défis | `#/challenges` | Défis quotidiens/hebdo |
| Paramètres | `#/settings` | Options utilisateur |
| Éditeur | `#/deck-editor/:id?` | Création/édition de deck (split-view) |
| Générateur IA | `#/prompt-generator` | Génération de decks par IA |
| Config Multilingue | `#/multilingual-config/:id` | Configuration deck multilingue |
| Créateur Multilingue | `#/multilingual-creator` | Création deck multilingue |
| Examen | `#/exam/:id` | Mode examen avec notation |
| Résultats examen | `#/exam-results` | Résultat du mode examen |
| Choix du défi | `#/challenge-setup/:deck` | Choix du mode (quatre) et du niveau ; accès par la page des défis et l'action « Défi » d'un deck |
| Mode défi | `#/challenge/:mode/:niveau/:deck[/timed]` | Séance de révision avec un objectif (`:mode` : `steady`, `perfect`, `speed`, `endurance` ; `/timed` est un ancien indicateur qui mène à Contre la montre) |
| Résultats défi | `#/challenge-results` | Résultat du mode défi |
| Résumé | `#/session-summary` | Résumé détaillé post-session |
| Hub Decks | `#/deck-hub` | Hub centralisé gestion decks |

#### Responsive

- Mobile first
- Tablette : layout adapté
- Desktop : largeur max 800px

### 2.9 Accessibilité

- Contraste minimum 4.5:1
- Navigation clavier complète
- Labels ARIA sur les éléments interactifs
- Focus visible

### 2.10 Sons

- Son différent par résultat (vert, orange, violet)
- Son de level up
- Son de badge débloqué
- Toggle global on/off

### 2.11 Thèmes Visuels

- 8 thèmes déverrouillables (`themes.js` : ocean, forest, sunset, midnight, sakura, arctic, neon, gold), en plus du mode clair/sombre
- Thèmes liés à la progression (niveau, badges)
- Prévisualisation avant sélection
- Sauvegarde dans les préférences utilisateur

### 2.12 Support Multilingue

#### Decks Multilingues

- Support de 7 langues de contenu (fr, en, es, de, it, pt, nl) ; l'interface existe en fr et en (badges, thèmes et tutoriel compris). Le contenu des decks, la taxonomie de tags, le formulaire du générateur de consignes et les messages du validateur de decks restent en français quand l'interface est en anglais
- Decks thématiques multi-langues
- Progression Leitner bidirectionnelle (FR→EN / EN→FR)

#### Modes de Jeu

| Mode | Description |
|------|-------------|
| Traduction | Question dans langue A, réponse en langue B |
| Dictée | Audio natif, réponse écrite |
| Image | Image + audio, réponse écrite |

#### Audio Natif

- Intégration API Lingua Libre (Wikimedia)
- Prononciation par locuteurs natifs
- Cache local pour mode offline

### 2.13 Génération de Decks par IA

#### Générateur de Prompts

- Templates par domaine (maths, histoire, géo, sciences, langues)
- Règles anti-hallucination intégrées
- Support génération SVG pour illustrations
- Mode "source fournie" (copier-coller de contenu)

#### Apprentissage Adaptatif

- Feedback sur la qualité des prompts générés
- Amélioration itérative des templates
- Suggestions contextuelles

---

## 3. Données

### 3.1 Format Deck (YAML source)

```yaml
id: unique-id
name: Nom du Deck
description: Description du deck
category:
  - categorie1
  - categorie2
difficulty: 1  # 1-5
language: fr

settings:
  bidirectional: false
  sequential: false

cards:
  - id: card1
    question: "Question ?"
    answer: "Réponse"
    type: exact_text
    hint: "Indice optionnel"
    media: "chemin/image.png"  # Optionnel
```

### 3.2 Format Player

```javascript
{
  id: "player_xxx",
  name: "Nom",
  createdAt: "ISO date",
  stats: {
    totalXP: 0,
    totalCardsPlayed: 0,
    totalSessions: 0,
    currentStreak: 0,
    longestStreak: 0,
    longestGreenStreak: 0,
    totalGreenCards: 0,
    lastPlayedAt: null,
    xpHistory: []
  },
  badges: [],
  settings: {
    soundEnabled: true,
    theme: "dark",
    language: "auto"   // "fr", "en" ou "auto"
  },
  missions: { /* défis quotidiens, quêtes hebdomadaires */ }
}
```

### 3.3 Format Progression Carte

```javascript
{
  id: "card_id",
  box: "never_played",
  latencyThreshold: null,
  bestResponseTimeMs: null,
  lastResponseTimeMs: null,
  restUntil: null,
  timesPlayed: 0,
  timesCorrect: 0
}
```

---

## 4. Parcours Utilisateur

### 4.1 Premier Lancement

```
1. Ouverture de l'app
2. Écran de bienvenue
3. Saisie du nom
4. Redirection vers Home
5. Affichage des decks disponibles
6. Sélection d'un deck
7. Première session
```

### 4.2 Session Quotidienne

```
1. Ouverture de l'app
2. Vérification du streak
3. Génération/chargement défis
4. Affichage Home avec stats
5. Sélection d'un deck à réviser
6. Session de jeu
7. Fin : XP, badges, défis mis à jour
```

### 4.3 Retour Après Absence

```
1. Ouverture de l'app
2. Streak potentiellement cassé
3. Cartes vertes au repos disponibles
4. Nouveaux défis générés
```

---

## 5. Règles Métier

### 5.1 Calcul du Streak (jours)

- Même jour : pas de changement
- Jour suivant : streak + 1
- Plus d'un jour : streak = 1

### 5.2 Algorithme Leitner

> Voir `docs/LEITNER_SYSTEM.md` : repos adaptatif, seuil de latence, ordre de pioche

### 5.3 Génération des Défis

> Voir `docs/GAMIFICATION.md` : formules par niveau et type de défi

---

## 6. Contraintes Non-Fonctionnelles

### 6.1 Performance

- Temps de chargement < 2 secondes
- Réponse aux actions < 100ms
- Taille du fichier < 5 MB (sans médias)

### 6.2 Compatibilité

- Navigateurs modernes (2 dernières versions)
- Mode file:// obligatoire
- Pas de dépendance externe

### 6.3 Maintenabilité

- Code modulaire et documenté
- Tests unitaires et e2e (`docs/TESTING_STRATEGY.md`)
- CLAUDE.md à jour

---

## 7. Évolutions Futures (Hors Scope v1)

- Synchronisation cloud
- Mode multijoueur

> **Note** : Les features suivantes ont été implémentées et sont documentées ci-dessus :
> - ~~Import de decks YAML~~ → Section 2.2.6
> - ~~Création de decks custom~~ → Section 2.2.2
> - ~~Statistiques avec graphiques~~ → Section 2.7
> - ~~Thèmes personnalisables~~ → Section 2.11

---

**Version** : 1.1.0
**Dernière mise à jour** : 2026-11-22
