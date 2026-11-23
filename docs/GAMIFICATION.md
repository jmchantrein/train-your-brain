# Gamification - Documentation Complète

> **Modules** : `src/modules/xp.js`, `src/modules/badges.js`, `src/modules/challenges.js`, `src/modules/text-utils.js` (jour local)
> **Orchestration en jeu** : `src/ui/game/session-manager.js`, `answer-validator.js`, `session-tracker.js`, `secret-stats.js`
> **Pages** : `src/ui/page-challenges.js` (missions et entrée du mode défi), `src/ui/page-challenge.js` (choix, défi en cours, fin de défi), `src/ui/page-session-summary.js` (bilan de séance)
> **Version** : 1.2.0 (passe 1 : intégrité de l'XP, de la série quotidienne, des badges et des annonces ; passe 2 : missions persistées par joueur, calibrage, bilan de séance, badges horaires et de mémoire durable)

---

## Vue d'Ensemble

Le système de gamification motive les joueurs à travers :
- **XP et Niveaux** : Progression continue
- **Badges** : 43 accomplissements à débloquer (12 secrets)
- **Série quotidienne** : régularité, comptée en jours de révision
- **Défis Quotidiens** : 3 petits objectifs par jour, bornés par les cartes à réviser ; aucun défi un jour sans carte à réviser
- **Quêtes Hebdomadaires** : 5 objectifs sur la semaine, mesurés depuis le lundi
- **Bilan de séance** : ce que la séance a changé pour la mémoire, prochaine révision utile
- **Mode défi** : une autre façon de faire ses révisions (Parcours, Sans erreur, Contre la montre, Jusqu'au bout), bonus de 3 XP au plus par jour, entraînement libre quand il n'y a rien à réviser

### Principes

- On récompense la **maîtrise et la régularité**, pas le volume ni la précipitation (d'où l'absence de multiplicateur de combo).
- Aucune mécanique de pression ou de perte (le public inclut des enfants) : pas de série « perdue » punie, pas de compte à rebours de série, aucun badge retiré.
- Le **repos des cartes vertes est voulu** : une journée sans carte à réviser n'est jamais une faute.
- Les badges secrets ne révèlent jamais leur condition exacte dans l'interface (nom `???` et indice vague).
- **Le jour est le jour calendaire local** de l'appareil (voir « Jour calendaire »), jamais UTC.

---

## Système XP

### XP par Carte

| Résultat | XP |
|----------|-----|
| Carte → `purple` | +1 |
| Carte → `orange` | +2 |
| Carte → `green` | +3 |

### Bonus de Série de Cartes Vertes

Le bonus est versé **une seule fois, au moment exact où la série atteint un palier** (`XP.getStreakMilestoneBonus(série)` : valeur du palier si la série vaut exactement ce palier, sinon 0). Il est **réellement crédité** à `player.stats.totalXP` avec l'XP de la carte (un seul crédit), compté dans l'XP de séance et dans `xpHistory`. Les cartes suivantes d'une série déjà au-dessus du palier ne rapportent que leur XP de carte. La série est celle de la séance en cours (cartes passées en boîte verte consécutivement) et repart à 0 à la première carte non verte.

| Série atteinte | Bonus XP |
|----------------|----------|
| 3 | +5 |
| 6 | +15 |
| 9 | +30 |
| 12 | +50 |
| 18 | +75 |
| 25 | +110 |
| 35 | +160 |
| 50 | +230 |
| 75 | +350 |
| 100 | +500 |

Exemple : 12 cartes vertes d'affilée = 12 × 3 XP de carte + 5 + 15 + 30 + 50 de bonus = 136 XP, pas davantage. La table est `XP.STREAK_BONUSES`, source unique (les célébrations de palier, `Effects.streak`, et la détection dans `GameAnswerValidator._updateSessionStats` la lisent). `XP.calculateStreakBonus(série)` rend le bonus du palier courant (pour toute série ≥ palier) : il n'est plus utilisé pour verser de l'XP.

### Pas de multiplicateur de combo

Un multiplicateur d'XP sur les bonnes réponses consécutives (jusqu'à ×6) a été **écarté et supprimé** (`XP.calculateXpWithCombo`, `getComboMultiplier`, `COMBO_MULTIPLIERS`, affichage « xN » en jeu) : il aurait récompensé l'enchaînement rapide, donc la précipitation et le volume, à l'opposé de l'esprit de l'application. L'XP d'une carte est strictement 1, 2 ou 3 selon la boîte.

### Niveaux Visuels de la Série

Définis une seule fois (`XP.STREAK_TIERS`, `XP.getStreakTier`) et utilisés par l'entête de jeu (`page-game.js`) et par les célébrations de palier (`Effects.streak.celebrateMilestone`) :

| Série | Niveau | Classe CSS de l'entête de jeu | Célébration |
|-------|--------|-------------------------------|-------------|
| 3-5 | `active` | `game__streak` | 🔥 |
| 6-11 | `hot` | `+ game__streak--hot` | 🔥🔥 |
| 12-24 | `epic` | `+ game__streak--fire` | 🔥🔥🔥🔥 (+ confettis) |
| 25-49 | `legendary` | `+ game__streak--legendary` | ⭐⭐ |
| 50+ | `mythic` | `+ game__streak--legendary` | 💎 / 👑 |

L'entête de série n'apparaît qu'à partir de 3 cartes vertes d'affilée (premier palier de bonus).

### Crédit de l'XP et montée de niveau

Tout gain d'XP de gamification passe par `XP.grant(player, montant)` (via `GameSessionManager.grantXp`), qui renvoie `{ previousLevel, newLevel, leveledUp }` :

| Source | Quand | `xpHistory` (source) |
|--------|-------|----------------------|
| XP de carte + bonus de série | à chaque carte (`nextCard`) | une entrée `session` par séance, à la fin |
| Badge | dès qu'il est obtenu | `badge` |
| Défi quotidien terminé | fin de séance | `challenge` |
| Bonus du mode défi (3 XP, une fois par jour) | fin du défi réussi (`endSession`) | `challenge` |

La montée de niveau est détectée à **chaque gain réel** ; une seule célébration (`Effects.levelUp`, au niveau le plus haut atteint) est déclenchée à la fin de la carte ou de la séance (`GameSessionManager.flushLevelUp`), même si plusieurs gains ont franchi un niveau. Invariant : pour un joueur neuf, `totalXP = somme(xpHistory)`.

---

## Système de Niveaux

### Formule

```javascript
niveau = floor(sqrt(XP / 100)) + 1
```

### Table de Progression

| Niveau | XP Requis | XP pour Niveau Suivant |
|--------|-----------|------------------------|
| 1 | 0 | 100 |
| 2 | 100 | 300 |
| 3 | 400 | 500 |
| 5 | 1,600 | 900 |
| 10 | 8,100 | 1,900 |
| 25 | 57,600 | 4,900 |
| 50 | 240,100 | 9,900 |

### Fonctions

```javascript
// Niveau actuel
XP.calculateLevel(totalXP)

// XP requis pour un niveau
XP.xpForLevel(level)

// Progression vers le prochain niveau (0-1)
XP.xpProgress(totalXP)
```

---

## Système de Badges

### Catégories

| Catégorie | Description | Icône |
|-----------|-------------|-------|
| `achievement` | Accomplissements généraux | 🏆 |
| `mastery` | Cartes maîtrisées | 📚 |
| `level` | Progression de niveau | ⬆️ |
| `streak` | Régularité (jours) | 🔥 |
| `performance` | En session | ⚡ |
| `subject` | Par matière | 📐 |
| `secret` | Badges cachés | ❓ |

### Raretés

Répartition réelle des 43 badges (`Badges.getByRarity`) :

| Rareté | Couleur | Badges | Proportion |
|--------|---------|--------|------------|
| `common` | Gris | 11 | 25,6 % |
| `rare` | Bleu | 11 | 25,6 % |
| `epic` | Violet | 15 | 34,9 % |
| `legendary` | Or | 6 | 14,0 % |

### Règles générales

- Un badge obtenu n'est **jamais retiré**, quelle que soit l'évolution des conditions ou des données du joueur.
- **Une seule fonction d'attribution** : `GameSessionManager.awardBadges(player, session, context)`. Elle est appelée après chaque carte (`context.sessionEnded = false`), en fin de séance (`sessionEnded = true`) et après un défi (`session = null`). Pour chaque badge obtenu : ajout à `player.badges`, crédit de l'XP (avec détection de niveau), entrée `xpHistory`, ajout à `session.newBadges` (le résumé de séance liste donc **tous** les badges de la séance), annonce. Elle répète le contrôle tant que l'XP d'un badge en débloque un autre (badges de niveau) et renvoie la liste des badges attribués par l'appel.
- **Annonces groupées** : les badges obtenus par un même appel sont annoncés par une seule popup (`Effects.badgePopup.showMultiple` : un badge = popup individuelle, plusieurs = une popup « N nouveaux badges ! » listant les noms). Pas de rafale de popups successives.
- `Badges.checkUnlocked(player, session, context)` reste une fonction pure (ne modifie rien). `context.sessionEnded === false` signale une séance en cours : les badges qui exigent une séance terminée (`perfect_session`) ne sont pas évalués.
- Textes des badges (noms, descriptions, indices) : en français dans `badges.js`, **sauf** quatre badges de la passe 2 dont le nom et la description (et l'indice pour `night_owl`) sont des accesseurs sur des clés i18n `badge.<id>.name|description|hint` (français et anglais, `src/modules/i18n.js`) : `retention_20`, `durable_75`, `durable_200`, `night_owl`. `early_bird` n'a que sa description en i18n (`badge.early_bird.description`). Les autres textes restent à traduire (anomalie B18 de l'audit).

### Liste des Badges

#### Achievement (5 badges)

| ID | Nom | Condition | Rareté | XP |
|----|-----|-----------|--------|-----|
| `first_card` | Premier Pas | 1 carte jouée | common | 10 |
| `first_session` | C'est Parti ! | 1 session terminée | common | 15 |
| `explorer` | Explorateur·ice | 5 decks différents | rare | 30 |
| `veteran` | Vétéran·e | 50 sessions | epic | 75 |
| `centurion` | Centurion·ne | 1000 cartes jouées | epic | 100 |

#### Mastery (7 badges)

Condition des quatre premiers : `player.stats.totalGreenCards` (nombre de cartes **actuellement** en boîte verte dans tous les decks ; ce stock baisse quand des cartes sortent du repos).

| ID | Nom | Condition | Rareté | XP |
|----|-----|-----------|--------|-----|
| `mastery_10` | Apprenti·e | 10 cartes vertes | common | 20 |
| `mastery_50` | Étudiant·e | 50 cartes vertes | rare | 50 |
| `mastery_100` | Érudit·e | 100 cartes vertes | epic | 100 |
| `mastery_500` | Maître·sse | 500 cartes vertes | legendary | 250 |
| `retention_20` | Mémoire d'une semaine | 20 cartes dont le repos a atteint 7 jours (`stats.weekRestCards`) | rare | 40 |
| `durable_75` | Mémoire durable | 75 cartes dont le repos a atteint 14 jours (`stats.longTermCards`) | epic | 75 |
| `durable_200` | Mémoire d'éléphant | 200 cartes dont le repos a atteint 14 jours | epic | 100 |

**Mémoire durable (passe 2).** Ces trois badges récompensent la **rétention** (une carte que l'algorithme ne propose plus qu'après 7, puis 14 jours), pas le volume joué ni le temps passé. Les compteurs `weekRestCards` et `longTermCards` s'incrémentent **au franchissement** du seuil (`GameSessionManager._trackLongTerm`, seuils `Badges.WEEK_REST_DAYS` = 7 et `Badges.LONG_TERM_REST_DAYS` = 14) : rejouer une carte déjà au-dessus du seuil n'ajoute rien, et les compteurs ne baissent jamais. Ils partent de zéro pour les joueurs existants. Justification par simulation (60 jours à 20 cartes/jour, 180 jours, 60 jours à 10 cartes/jour à 60 %) : le premier niveau tombe vers le jour 17 (20 cartes/jour) ou 35 (10 cartes/jour), dans un trou sans déblocage ; `durable_75` vers le jour 94 et `durable_200` vers le jour 159, dans les deux plus longs trous de la simulation de 180 jours (voir « Calibrage »).

#### Level (4 badges)

| ID | Nom | Condition | Rareté | XP |
|----|-----|-----------|--------|-----|
| `level_5` | Niveau 5 | Atteindre niveau 5 | common | 25 |
| `level_10` | Niveau 10 | Atteindre niveau 10 | rare | 50 |
| `level_25` | Niveau 25 | Atteindre niveau 25 | epic | 100 |
| `level_50` | Niveau 50 | Atteindre niveau 50 | legendary | 200 |

#### Streak (4 badges)

Condition : `player.stats.currentStreak` (série en **jours de révision**, voir « Série quotidienne »).

| ID | Nom | Condition | Rareté | XP |
|----|-----|-----------|--------|-----|
| `streak_3` | Régulier·ère | série de 3 jours de révision | common | 20 |
| `streak_7` | Assidu·e | série de 7 jours | rare | 50 |
| `streak_30` | Dévoué·e | série de 30 jours | epic | 150 |
| `streak_100` | Légende | série de 100 jours | legendary | 500 |

#### Performance (5 badges)

| ID | Nom | Condition | Rareté | XP |
|----|-----|-----------|--------|-----|
| `perfect_session` | Parfait ! | 100 % de bonnes réponses sur une séance **terminée** d'au moins 10 cartes | rare | 40 |
| `green_streak_5` | En Feu | 5 vertes consécutives en séance | common | 15 |
| `green_streak_10` | Inarrêtable | 10 vertes consécutives | rare | 35 |
| `green_streak_20` | Machine | 20 vertes consécutives | epic | 75 |
| `speed_demon` | Speed Demon | une **bonne** réponse en moins de 1 seconde | rare | 30 |

`speed_demon` lit `stats.fastestCorrectAnswer` : tant qu'aucune bonne réponse n'a été mesurée la valeur est `null` ou `Infinity` et le badge n'est pas obtenu (la condition exige un nombre).

#### Subject (6 badges)

Condition : nombre de **cartes distinctes maîtrisées** (passées au moins une fois en boîte verte) dans la matière, mémorisées dans `player.stats.masteredBySubject[matière]` (identifiants `deckId/cardId`, plafonnés à `Badges.MASTERED_CAP` = 100 par matière). Rejouer une carte ou la rater ne fait pas avancer le badge. Les joueurs existants repartent de zéro pour ce décompte (l'ancien `cardsBySubject` comptait les cartes jouées et n'est plus lu) ; les badges déjà obtenus sont conservés.

| ID | Nom | Condition | Rareté | XP |
|----|-----|-----------|--------|-----|
| `math_beginner` | Matheux·euse Débutant·e | 10 cartes de maths maîtrisées | common | 20 |
| `math_expert` | Matheux·euse Expert·e | 100 cartes de maths maîtrisées | epic | 100 |
| `french_beginner` | Linguiste Débutant·e | 10 cartes de français maîtrisées | common | 20 |
| `french_expert` | Linguiste Expert·e | 100 cartes de français maîtrisées | epic | 100 |
| `history_beginner` | Historien·ne en Herbe | 10 cartes d'histoire maîtrisées | common | 20 |
| `science_beginner` | Scientifique Débutant·e | 10 cartes de sciences maîtrisées | common | 20 |

La matière d'un deck est déduite de ses `tags` (à défaut `category`) par `Badges.getSubjectsForDeck`, après normalisation (minuscules, sans accents) et avec alias : `maths` = maths, math, mathématiques ; `francais` = français, french ; `histoire` = histoire, history ; `sciences` = sciences, science. Un deck de maths qui porte aussi le tag générique « sciences » ne compte **pas** pour les sciences.

#### Secret (12 badges cachés)

Dans l'interface : nom `???`, icône ❓ et indice (jamais la condition). La colonne Condition ci-dessous est réservée à la documentation.

| ID | Nom | Condition (non affichée) | Indice affiché | Rareté | XP |
|----|-----|--------------------------|----------------|--------|-----|
| `night_owl` | Chouette du Soir | séance terminée entre 18 h et 21 h (heure locale) | Quand le jour baisse... | common | 20 |
| `early_bird` | Lève-Tôt | séance terminée entre 6 h et 8 h (heure locale) | L'avenir appartient à ceux qui se lèvent tôt... | rare | 50 |
| `comeback_kid` | Retour en Force | revenir après au moins 30 jours calendaires d'absence | Mieux vaut tard que jamais... | epic | 100 |
| `perfectionist` | Perfectionniste | 10 séances parfaites (100 %, ≥ 10 cartes) | La perfection est un chemin, pas une destination... | epic | 150 |
| `speed_runner` | Speed Runner | 50 bonnes réponses en moins de 2 s | La vitesse est une vertu... | epic | 100 |
| `marathon` | Marathonien·ne | 100 cartes dans une séance | L'endurance est la clé... | legendary | 200 |
| `collector` | Collectionneur·euse | 20 decks différents | La diversité enrichit l'esprit... | epic | 100 |
| `redemption` | Rédemption | maîtriser une carte après 10 erreurs | La persévérance paie toujours... | rare | 75 |
| `challenger` | Challengeur·euse | gagner un défi en mode Expert | Les expert·e·s ne reculent devant rien... | epic | 100 |
| `untouchable` | Intouchable | gagner un défi Sans faute sans aucune erreur (`stats.wrongAnswers === 0`) | La perfection sous pression... | legendary | 200 |
| `weekend_warrior` | Guerrier·ère du Weekend | samedi et dimanche joués pendant 4 semaines ISO consécutives (passage d'année géré) | Le weekend est fait pour apprendre... | rare | 75 |
| `golden_hour` | L'Heure Dorée | donner une réponse à 12:34 (heure locale) | Un instant de la journée a quelque chose de très ordonné... | legendary | 150 |

Détails :
- **Badges horaires et bien-être (passe 2).** L'ancienne condition de `night_owl` (jouer entre minuit et 5 h) encourageait des enfants à jouer la nuit. L'identifiant est conservé, la plage devient **18 h - 21 h** (nom, description et indice changent, rareté `common`, 20 XP) ; jouer la nuit ne rapporte plus rien. Les joueurs qui avaient déjà `night_owl` le **gardent** (rien n'est retiré, et aucun XP n'est repris). `early_bird` passe de 5 h - 7 h à **6 h - 8 h** (plus de réveil avant 6 h). Les compteurs `nightSessions` / `earlySessions` gardent leurs valeurs passées. `golden_hour` (12:34) est un instant de la journée : aucun changement. Autres badges qui touchent au temps passé : `marathon` (100 cartes dans une séance) est un badge de volume, à reconsidérer lors d'une passe dédiée.
- `comeback_kid` : la dernière activité d'avant la séance est mémorisée sur la séance (`session.previousPlayedAt`, car `lastPlayedAt` est réécrit à chaque carte) ; `stats.longestAbsence` est calculé en jours calendaires locaux à la fin de séance. Pour un joueur d'avant ce correctif, `lastPlayedAt` fournit la date.
- `weekend_warrior` : `stats.weekendWeeks` est indexé par semaine ISO qualifiée de l'année (`"2026-W01"`) ; les anciennes clés numériques (`"3"`) sont converties à la volée (semaine ≤ semaine courante = année courante, sinon année précédente), sans perte de données.
- `golden_hour` est évalué à chaque carte (plus besoin de terminer la séance pendant cette minute).

### API Badges

```javascript
// Obtenir un badge
Badges.get('first_card')

// Filtrer par catégorie / rareté
Badges.getByCategory('achievement')
Badges.getByRarity('legendary')

// Badges cachés : filtrer sur le champ hidden
Badges.ALL.filter(b => b.hidden)

// Vérifier (sans rien modifier) les nouveaux badges débloqués
// context.sessionEnded === false : séance en cours (perfect_session non évalué)
Badges.checkUnlocked(player, session, { sessionEnded: true })

// Attribuer (XP, historique, résumé, annonce) : SEULE fonction d'attribution
GameSessionManager.awardBadges(player, session, { sessionEnded: false })

// Matières
Badges.getSubjectsForDeck(deck)      // ['maths']
Badges.countMastered(player, 'maths') // cartes distinctes maîtrisées

// Recalculer tous les badges (sans session ; informatif, ne retire rien)
Badges.recalculateAll(player)

// Statistiques
Badges.getStats(player)
```

---

## Série Quotidienne

La série (`stats.currentStreak`, record `stats.longestStreak`) compte des **jours de révision** : un jour compte dès qu'une carte est jouée ce jour-là (jour calendaire local). Elle est mise à jour à chaque carte (`GameSessionTracker.updateDailyStreak`, appelé par `nextCard` avant la réécriture de `lastPlayedAt`), donc une séance abandonnée compte aussi et `streak_3/7/30/100` se débloquent dès la première carte du jour concerné.

| Situation | Effet |
|-----------|-------|
| Première carte de la vie du joueur | série = 1 |
| Déjà compté aujourd'hui | aucun changement |
| Dernier jour de révision = hier | série + 1 |
| Écart d'au moins 2 jours, **mais** aucun jour intermédiaire n'avait de carte à réviser | série + 1 (la série continue) |
| Écart d'au moins 2 jours avec au moins un jour intermédiaire où des cartes étaient à réviser | série = 1 (aucun message de perte) |
| Horloge de l'appareil reculée | aucun changement |

**Jour sans carte à réviser** : à chaque carte, le jeu recalcule `stats.nextReviewDay`, le premier jour (après aujourd'hui) où il y aura des cartes à réviser dans les decks **déjà commencés** (au moins une carte jouée) : une carte non verte est due dès demain ; une carte verte est due à la fin de son repos (`restUntil`). Au retour du joueur, si `nextReviewDay >= aujourd'hui`, aucun jour manqué n'avait de travail et la série continue ; sinon elle repart à 1. Les decks jamais commencés ne comptent pas. Fonctions : `GameSessionTracker.computeNextReviewDay(decks, today)`, `updateDailyStreak(player, decks)` (sans `decks`, `nextReviewDay` n'est pas recalculé).

Joueurs existants : sans `lastStreakDay` (dernier jour compté), la date vient de `lastPlayedAt` ; un joueur dont la série était restée à 0 repart à 1 (et continue ensuite normalement). Aucune migration destructive. `stats.currentStreak` n'est pas remis à 0 par l'absence tant que le joueur ne rejoue pas (la valeur affichée dans les statistiques peut donc dater du dernier jour joué).

## Jour Calendaire

Source unique : `TextUtils` (`src/modules/text-utils.js`). Le jour est celui du **fuseau local** de l'appareil (minuit local change de jour), jamais UTC :

| Fonction | Rôle |
|----------|------|
| `TextUtils.getToday()` (= `PageUtils.getToday()`) | jour local `YYYY-MM-DD` |
| `TextUtils.getLocalDateString(date)` | jour local d'une date |
| `TextUtils.addDays(jour, n)` | arithmétique calendaire pure (sans fuseau ni heure d'été) |
| `TextUtils.daysBetween(a, b)` | nombre de jours calendaires |
| `TextUtils.getWeekStart(date)` | lundi de la semaine locale |

Utilisée par : la série quotidienne, les badges secrets, `xpHistory`, le repos Leitner (`restUntil` est calculé avec le même jour que la comparaison `today >= restUntil` de `Leitner.isCardPlayable`), et les dates des défis (`Challenges._getTomorrow`, `_getWeekInfo`, semaine du lundi au dimanche). Les `restUntil` déjà enregistrés (calculés autrefois en UTC) restent valides : l'écart est au plus d'un jour une fois.

---

## Missions (défis quotidiens et quêtes hebdomadaires)

### Stockage : par joueur, enregistré, exporté

Les missions vivent dans **`player.missions`** (objet du joueur) : elles sont enregistrées avec lui (`Storage.savePlayer` / `savePlayerById`, donc conservées au rechargement), exportées et importées avec lui (`exportAll` / `importAll`) et **propres à chaque joueur** (le joueur B ne voit jamais celles du joueur A). `Storage.sanitizeMissions` ramène l'entrée non fiable à ses types au chargement et à l'import (types de défis reconnus, nombres bornés, identifiants nettoyés ; un volet illisible est abandonné et régénéré). Forme (`types.js` : `Missions`) :

```javascript
player.missions = {
  daily:  { day, dueAtStart, cardsPlayed, correct, cardKeys, challenges },        // jour local
  weekly: { weekStart, baseline: { greenPromotions, challengeWins }, decksPlayed, daysPlayed, quests }
};
```

`State.dailyChallenges` et `State.weeklyQuests` ne sont qu'un **miroir** du joueur courant, lu par la barre de navigation (`components.js`) : `Challenges.syncState` le recopie, et `Challenges.bindState` (appelé au chargement du module) l'abonne au changement de joueur. Le miroir est vide si les missions datent d'un autre jour ou d'une autre semaine. La barre de navigation affiche toujours « x/3 » et « x/5 » (valeurs fixes de `components.js`) : un jour sans défi, elle affiche 0/3.

Les missions sont créées à la **première carte du jour** (avant la mise à jour de cette carte : `GameSessionManager.refreshMissions` dans `nextCard`) ou à l'ouverture de la page Missions, puis figées pour la journée. Aucune migration : un joueur existant reçoit simplement ses premières missions à sa prochaine séance.

### Défis quotidiens

**Cartes à réviser.** `Challenges.countDueCards(decks, jour)` compte les cartes **déjà jouées** (`timesPlayed > 0`) et **jouables aujourd'hui** (non vertes, ou vertes dont le repos est terminé) dans les decks que le joueur a commencés, par deck au plus `settings.maxCards` (défaut 100 ; 50 en multilingue, où l'on compte les directions de mots). Les cartes jamais jouées ne comptent pas (les découvrir est facultatif) ; une carte verte au repos ne compte jamais. Cette charge est mesurée une fois par jour (`daily.dueAtStart`).

| Type | Description | Cible |
|------|-------------|-------|
| `review_due` | Réviser N cartes aujourd'hui | min(cartes à réviser, **10**) cartes **distinctes** jouées dans la journée (rejouer la même carte n'avance pas) |
| `accuracy` | Réussir 70 % de bonnes réponses sur la journée | à partir de min(10, cible précédente) cartes jouées dans la journée, **cumul de toutes les séances du jour** |
| `green_streak` | Enchaîner N cartes vertes d'affilée | min(3, cible `review_due`) ; meilleure série en séance de la journée, qui ne décroît pas |

Règles :
- Les objectifs se calculent sur la **journée entière** (cumul des séances ; une séance abandonnée compte aussi, car le suivi se fait carte par carte dans `nextCard` via `Challenges.recordCard`) et **ne dépendent plus du niveau**.
- Ils sont **bornés par ce que le joueur peut réellement jouer ce jour-là** (jamais plus de cartes que les cartes à réviser) et par un plafond de **10 cartes** (`DAILY_REVIEW_CAP`) : un retard ne gonfle pas l'objectif.
- **Un jour où le joueur n'a aucune carte à réviser, il n'y a aucun défi** (liste vide) : rien à rater. La page Missions le dit simplement (« Rien à réviser aujourd'hui : pas de défi du jour. Reviens quand des cartes seront à revoir. ») et n'affiche aucun message de perte.
- Chaque défi est récompensé **une seule fois** (`completed` ; XP via `GameSessionManager.grantXp`, entrée `xpHistory` source `challenge`) et annoncé dans le bilan de séance (`session.completedChallenges`).
- Renouvellement à minuit **local** (changement de `daily.day`).

**Règle d'XP retenue.** Le total des défis d'une journée vaut **au plus 25 % de l'XP de carte des cartes visées** (2 XP par carte en moyenne), **soit 5 XP au maximum par jour**, avec un plancher de 3 XP (1 XP par défi). `Challenges.dailyXpPool(cartes)` = min(5, max(3, round(cartes × 2 × 0,25))), réparti : `accuracy` et `green_streak` reçoivent chacun max(1, floor(pool / 4)), `review_due` le reste. Exemple : 10 cartes -> 5 XP de défis (3 + 1 + 1) contre environ 25 à 30 XP de cartes. Ce petit plus ne dépend ni du niveau ni du volume : la révision reste la première source d'XP.

### API Défis

```javascript
Challenges.countDueCards(decks, today)             // cartes à réviser aujourd'hui
Challenges.getReviewOutlook(decks, today)          // { dueNow, nextDay } (bilan de séance)
Challenges.dailyXpPool(targetCards)                // XP total des défis du jour
Challenges.generateDaily(player, today, { dueCount })  // 3 défis, ou []
Challenges.refreshMissions(player, { decks, today })   // crée les missions du jour / de la semaine
Challenges.recordCard(player, { deckId, cardId, isCorrect, maxGreenStreak }, today)  // -> défis terminés
Challenges.describe(item, t)                       // texte traduit (clés missions.daily.* / missions.weekly.*)
Challenges.syncState(player) / Challenges.bindState()  // miroir State pour la barre de navigation
```

---

## Quêtes Hebdomadaires

La semaine est la semaine **locale** du lundi au dimanche (`TextUtils.getWeekStart`). Au premier accès de la semaine, la quête reçoit un **instantané** (`weekly.baseline` : `stats.greenPromotions` et `stats.challengeWins`). La progression de la semaine se mesure **par différence avec cet instantané** (ou sur les jours et decks joués cette semaine) : un joueur ancien ne démarre jamais avec des quêtes déjà terminées (anomalie B12).

| Type | Description | Cible | Progression |
|------|-------------|-------|-------------|
| `weekly_xp` | Gagner X XP en révisant | 60 % de la moyenne hebdomadaire de l'XP de séances des 4 semaines précédentes jouées, arrondie à 5, entre 50 et 600 ; **100** sans historique | somme `xpHistory` source `session` de la semaine (ni badges, ni quêtes) |
| `weekly_mastery` | Faire passer X cartes en boîte verte | min(10, cartes des decks commencés) | `greenPromotions` - instantané (compteur cumulé de passages en vert, jamais décrémenté) |
| `weekly_streak` | Réviser X jours | 3 | jours distincts joués dans la semaine |
| `weekly_challenges` | Réussir X défis (un par jour au plus) | 2 | `challengeWins` - instantané (défis de révision réussis, voir « Mode défi ») |
| `weekly_decks` | Réviser dans X decks | min(3, decks commencés), 2 sans deck commencé | decks distincts joués dans la semaine |

- La cible `weekly_xp` suit l'XP réaliste d'une semaine de révision régulière du joueur, **pas son niveau** ; elle est plafonnée à 600 et ne peut pas croître sans fin (60 % : une semaine ordinaire la dépasse).
- **XP des quêtes** : chaque quête rapporte 3 % de la cible `weekly_xp`, entre 3 et 10 XP (50 XP par semaine au plus). Elle est créditée **une seule fois** à la fin de la quête, via `GameSessionManager.grantXp` (niveau et `xpHistory` source `quest` gérés), puis annoncée dans le bilan de séance (`session.completedQuests`). L'évaluation a lieu en fin de séance (`_finishMissions`, l'XP de séance étant alors dans `xpHistory`) et à l'ouverture de la page Missions.
- `weekly_challenges` est atteignable : deux défis de révision réussis sur deux jours différents (le bonus et la victoire ne comptent qu'une fois par jour ; l'entraînement libre ne compte pas). Les quêtes déjà créées pour la semaine en cours gardent leur cible d'origine.

```javascript
Challenges.weeklyXpTarget(player, weekStart)       // cible weekly_xp
Challenges.createWeeklyRecord(player, weekStart, decks)  // instantané + 5 quêtes
Challenges.updateWeekly(player, today)             // -> quêtes nouvellement terminées
```

### Calibrage (simulation)

Simulation de l'audit (`tmp/gami/sim2.cjs`, vrais modules, 1 séance par jour, 80 % de réussite ; 180 jours : paquet de 400 cartes ; 10 cartes/jour : 60 % de réussite), avant / après la passe 2 :

| Scénario | Part de l'XP venant des défis et quêtes | Défis quotidiens réussis par jour | Quêtes hebdo terminées | Jours avec déblocage (badge ou niveau) | Plus longue période sans déblocage |
|---|---|---|---|---|---|
| 60 j, 20 cartes/j, 80 % | 30,5 % -> **8,9 %** | 1,2 -> 2,9 | 19 (dont 3 sur 5 d'emblée, XP jamais crédité) -> 34 (XP crédité) | 17 -> 15 | 9 j -> 9 j |
| 180 j, 20 cartes/j, 80 % | 31,2 % -> **9,5 %** | 0,96 -> 2,9 | 55 -> 103 | 21 -> 21 | 25 j -> 23 j |
| 60 j, 10 cartes/j, 60 % | 28,7 % -> **12,9 %** | 0,48 -> 1,95 | 17 -> 34 | 13 -> 13 | 12 j -> 10 j |

Lecture : les défis et quêtes pèsent désormais environ un neuvième de l'XP au lieu d'un tiers (sur 60 jours : 603 XP de missions contre 5 175 XP de cartes ; avant : 2 718 XP de défis contre 5 175 de cartes, et 0 XP de quêtes). Les défis sont réussis plus souvent parce qu'ils sont réalisables, non parce qu'ils rapportent plus. Le nombre de jours avec déblocage recule légèrement sur 60 jours à 20 cartes/jour (17 -> 15) : retirer l'XP excédentaire des défis retarde mécaniquement les passages de niveau ; les badges de mémoire durable comblent le reste (sans eux, le plus long trou de la simulation de 180 jours passerait à 29 jours). Le plus long trou de 180 jours (jours 125 à 147) n'est comblé qu'en partie : au plus trois badges étaient autorisés, et les niveaux supérieurs (formule de niveau inchangée) restent espacés.

---

## Mode défi

Un défi est **une autre façon de faire ses révisions**, pas une activité à côté. Point d'entrée : la page Défis (choix d'un deck) et l'action « Défi » (🎯) de la ligne d'un deck ; les deux mènent à `#/challenge-setup/:deck` (choix du mode et du niveau). Rien sur l'accueil. Decks standard seulement (pas multilingues).

**Quatre modes** (`Challenges.CHALLENGE_MODES`), tous dans le même cadre : mêmes cartes à réviser, même progression, même bonus. Ce qui les distingue est l'objectif et le rythme, jamais la récompense.

| Mode (id) | Nom FR / EN | Cartes jouées | Objectif | Chronomètre |
|---|---|---|---|---|
| `steady` | Parcours / Steady run | N (5 / 8 / 12 / 15) | un pourcentage de bonnes réponses sur les N cartes (60 / 70 / 80 / 90 %) | non |
| `perfect` | Sans erreur / Clean run | N (5 / 8 / 12 / 15), toutes jouées | une série de bonnes réponses d'affilée (4 / 6 / 10 / 15) ; on voit la plus longue série | non |
| `speed` | Contre la montre / Against the clock | N (5 / 8 / 12 / 15) | le nombre de bonnes réponses qu'exige Parcours au même niveau, avant la fin du temps (3 / 6 / 10 / 14) | oui, un budget pour tout le défi |
| `endurance` | Jusqu'au bout / All the way | toutes les cartes à réviser du deck (au moins 20) | garder le même pourcentage de réussite (60 / 70 / 80 / 90 %) sur la première moitié comme sur la seconde | non |

- **Parcours** : l'objectif se juge à la fin, toutes les cartes répondues.
- **Sans erreur** : plus de vies ; les erreurs ne coûtent rien d'autre que la série en cours. Réussi dès que la série visée est atteinte.
- **Contre la montre** : un seul budget de temps (N x 30 / 20 / 15 / 10 s), décompté **pendant les questions seulement** (pas pendant le retour sur une carte). La cible vaut `Math.ceil(N x pourcentage de Parcours)`, calculée depuis les constantes de Parcours : Contre la montre est « Parcours avec une limite de temps », jamais plus facile que Parcours (sinon le mode le plus pressant serait le chemin le plus facile vers le bonus, et il est masqué avec le mode dyslexie ou l'espacement large). Réussi dès que cette cible est atteinte, même si le temps s'arrête avant la dernière carte. À zéro, le défi s'arrête doucement : les cartes non atteintes sont retirées de la séance (elles restent à réviser, rien n'est compté faux) ; les cartes répondues sont enregistrées comme en séance. Ce n'est jamais un mode par défaut ni une case à cocher.
- **Jusqu'au bout** (`endurance`) : le nom « Endurance » évoque « le plus longtemps possible », donc le volume ; la règle est l'inverse. Le défi est la séance normale **complète** : toutes les cartes que `Leitner.getCardsForSession` propose (bornées par `deck.settings.maxCards`), ni une de plus. Aucune carte au repos, aucun avantage pour celui qui joue plus. Pour réussir, il faut finir toutes les cartes et garder le niveau visé sur chacune des deux moitiés (la fatigue ne doit pas faire tomber la seconde moitié). Le mode n'est proposé que si le deck a `ENDURANCE_MIN_DUE` (20) cartes à réviser ou plus, soit nettement plus qu'un Parcours (15 au plus) ; en dessous, il n'apparaît pas. Les quatre niveaux ne changent que le pourcentage visé, jamais le nombre de cartes. Quitter en route garde les cartes déjà validées, sans réussite.
- Niveaux (`easy` Léger, `medium` Moyen, `hard` Soutenu, `expert` Expert) : 5 / 8 / 12 / 15 cartes pour Parcours, Sans erreur et Contre la montre. Un niveau n'est proposé que si le deck a au moins autant de cartes à réviser (jamais de défi raccourci).
- **Accessibilité** : la pression du temps n'est jamais le chemin par défaut. « Contre la montre » n'est pas proposé (ni sur l'écran de choix, ni par un lien : `createChallengeSession` renvoie null) quand le mode dyslexie ou l'espacement large est actif (`Challenges.timerAllowed`), et n'est jamais présélectionné : le mode coché à l'ouverture est toujours Parcours. Aucun autre mode n'a de chronomètre. Aucun mode n'est limité en temps par carte.
- **Anciens liens et scores.** `streak` mène à Sans erreur ; `speed` et `endurance` mènent à leurs modes ; un ancien lien Parcours avec `/timed` mène à Contre la montre. Aucune donnée de joueur n'est supprimée : `speed_*` et `endurance_*` sont relus tels quels, `steady_*_timed` (écrit par l'intégration précédente) est relu par Contre la montre, `streak_*` et `perfect_*_timed` par Sans erreur.

**Déroulé et progression.** Les cartes sont celles de `Leitner.getCardsForSession` (les N premières ; toutes pour Jusqu'au bout). Le défi est une séance normale (`session.challenge`) : `GameAnswerValidator.validate`, `GameSessionManager.nextCard` et `endSession` mettent à jour boîte, seuil, repos, XP de carte et bonus de série, série quotidienne, missions, badges exactement comme en séance. Seul l'écran (`Pages.challengeGame` hérite de `Pages.game`) et la page de fin (`Pages.challengeResults`, bilan de séance inclus) diffèrent. Quitter garde les cartes déjà validées.

**Récompense propre au défi.** Défi réussi (objectif du mode atteint, voir le tableau) : **+3 XP de bonus au plus une fois par jour** (`CHALLENGE_BONUS_XP`, `stats.lastChallengeDay`), jamais un multiple de l'XP de carte ; le bonus compte une victoire (`stats.challengeWins`, quête `weekly_challenges`). Score affiché = (baseScore + speedBonus + streakBonus) × multiplicateur de niveau (1 / 1,5 / 2 / 3) ; **aucun XP n'en dérive**. Meilleurs scores : `player.challengeScores`, par joueur et par mode/niveau (`steady_easy`, `speed_hard`, `endurance_medium`, ...), simple affichage, jamais de classement entre joueurs. Le bonus est le même (3 XP, une fois par jour, tous modes confondus) quel que soit le mode.

**Sans réussite.** Pas de « défaite » ni de vies : « Pas cette fois », ce que le défi a fait pour la mémoire, invitation à réessayer plus tard. Aucune pénalité.

**Rien à réviser.** Si le deck n'a aucune carte à réviser, la page propose l'**entraînement libre** : jusqu'à 10 cartes au repos, annoncé comme tel ; il ne change ni boîte, ni repos, ni série, ni missions, ni badges, et ne rapporte aucun XP (`session.challenge.practice`, branche de `nextCard`). Avec 1 à 4 cartes à réviser : message vers la séance normale (le repos n'est jamais contourné).

**Badges liés** : `challenger` (réussir un défi Expert, tout mode) et `untouchable` (Sans erreur, 10 cartes ou plus, aucune erreur : niveaux Soutenu et Expert) ne changent pas de condition de lecture ; seules les données écrites changent. Aucun badge acquis n'est retiré.

```javascript
Challenges.resolveMode(id, flag)              // { modeId, practice } (anciens ids inclus) ou null
Challenges.availableTiers(dueCount, modeId)   // niveaux proposés
Challenges.availableModes(dueCount, player)   // modes proposés (Contre la montre : si permis ; Jusqu'au bout : au moins 20 cartes)
Challenges.createChallengeSession({ modeId, difficulty, practice }, deck, today, player) // séance + session.challenge, ou null
Challenges.evaluateChallenge(session)         // { answered, correct, accuracy, bestRun, score, success, complete, timedOut, halves }
Challenges.applyOutcome(player, session, today) // { counted, bonusXp, isNewRecord } (score, victoire, badges liés)
Challenges.timerAllowed(player)               // false si dyslexie ou espacement large
```

---

## Bilan de séance

`src/ui/page-session-summary.js`. Centré sur l'apprentissage, sans nouveau graphique :

- chiffres de la séance (cartes, précision, XP) ;
- **ce que la séance a changé pour la mémoire** : « En boîte verte : N » et « À revoir : N », calculés sur l'état final de chaque carte jouée (`session.results`, une carte revue puis réussie compte comme passée en vert, une seule fois) ;
- **prochaine révision utile** (`Challenges.getReviewOutlook`, tous decks commencés) : s'il ne reste plus aucune carte à revoir aujourd'hui, un message clair et rassurant (« Rien à réviser avant demain, bien joué ! », ou « Rien à réviser avant le jeudi 26 novembre, bien joué ! », ou « Rien à réviser aujourd'hui, bien joué ! ») au lieu d'une incitation à rejouer ;
- badges, défis et quêtes terminés pendant la séance, avec leur XP ;
- le bouton « Rejouer (N) » n'apparaît que s'il reste des cartes jouables dans le deck (jamais pour des cartes au repos) ;
- **confettis réservés à une séance réussie** : 80 % de bonnes réponses ou plus (`Pages.sessionSummary._shouldCelebrate`). Aucun confetti sinon.

---

## Intégration dans le Jeu

### Flux d'une Session (code réel)

```javascript
// 1. Réponse : GameAnswerValidator.validate -> _updateSessionStats(session, ...)
//    - xpEarned = XP.calculateXpForCard(newBox)            (1, 2 ou 3)
//    - si boîte verte : session.stats.currentGreenStreak++
//      bonusXp = XP.getStreakMilestoneBonus(série)         (palier exact seulement)
//    - session.lastResult = { isCorrect, newBox, responseTimeMs, xpEarned, bonusXp }
//    - session.stats.totalXpEarned += xpEarned + bonusXp

// 2. Clic « Continuer » : GameSessionManager.nextCard(state)
//    0. refreshMissions : missions du jour / de la semaine créées (avant la mise à jour de la carte)
//    a. mise à jour de la carte et du deck, sauvegarde de la progression ;
//       _trackLongTerm (weekRestCards, longTermCards)
//    b. _trackSubjectProgress : carte verte -> masteredBySubject
//    c. GameSessionTracker.updateDailyStreak(player, decks)   (jour de révision, nextReviewDay)
//    d. _updatePlayerStats : grantXp(xpEarned + bonusXp), cartes jouées, greenPromotions, lastPlayedAt,
//       golden hour, fastestCorrectAnswer, session.previousPlayedAt (1re carte)
//    d bis. _recordMissions : carte enregistrée dans les défis de la journée, XP des défis terminés
//    e. awardBadges(player, session, { sessionEnded: false })
//    f. sauvegarde du joueur, flushLevelUp() (célébration de niveau, une fois)

// 3. Dernière carte : GameSessionManager.endSession(state)
//    totalSessions++, GameSecretStats.track (heure, séance parfaite, week-end, absence),
//    decks uniques, xpHistory (source 'session'), _finishChallenge (défi : score, bonus du jour,
//    victoire ; entraînement libre : endPractice, rien d'enregistré), _finishMissions (quêtes hebdomadaires :
//    XP crédité une fois, session.completedQuests),
//    awardBadges(player, session, { sessionEnded: true }), sauvegarde, flushLevelUp(),
//    session.newBadges / completedChallenges / completedQuests -> page de résumé (/challenge-results si défi)
```

---

**Dernière mise à jour** : 2026-11-23 (mode défi : quatre modes)
