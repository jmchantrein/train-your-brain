/**
 * Types JSDoc centralisés pour Train Your Brain
 *
 * Ce fichier définit tous les types utilisés dans l'application.
 * Il sert de référence pour la documentation et l'autocomplétion IDE.
 *
 * @fileoverview Définitions de types JSDoc
 * @module types
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES CARTE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Type de carte supporté
 * @typedef {'text'|'numeric'|'mcq'|'truefalse'|'cloze'|'matching'} CardType
 */

/**
 * Boîte Leitner
 * @typedef {'never_played'|'purple'|'orange'|'green'} LeitnerBox
 */

/**
 * Option de QCM
 * @typedef {Object} MCQOption
 * @property {string} id - Identifiant unique de l'option
 * @property {string} text - Texte de l'option
 * @property {boolean} [correct] - Si l'option est correcte (pour QCM multi-réponses)
 */

/**
 * Paire d'association (matching)
 * @typedef {Object} MatchingPair
 * @property {string} left - Élément de gauche
 * @property {string} right - Élément de droite correspondant
 */

/**
 * Média attaché à une carte
 * @typedef {Object} CardMedia
 * @property {string} type - Type de média ('image'|'audio'|'video')
 * @property {string} data - Données base64 ou URL
 * @property {string} [alt] - Texte alternatif (images)
 * @property {string} [caption] - Légende
 */

/**
 * Carte de flashcard
 * @typedef {Object} Card
 * @property {string} id - Identifiant unique de la carte
 * @property {string} question - Question ou prompt
 * @property {string|number|boolean} answer - Réponse attendue
 * @property {CardType} [type='text'] - Type de carte
 * @property {string[]} [alternatives] - Réponses alternatives acceptées
 * @property {string} [hint] - Indice optionnel
 * @property {string} [feedback] - Explication pédagogique
 * @property {MCQOption[]} [options] - Options pour QCM
 * @property {MatchingPair[]} [pairs] - Paires pour matching
 * @property {CardMedia} [media] - Média attaché
 * @property {string} [mediaSuggestion] - Suggestion de média (non intégré)
 *
 * @property {LeitnerBox} [box='never_played'] - Boîte Leitner actuelle
 * @property {number|null} [latencyThreshold] - Seuil de latence en secondes
 * @property {number|null} [bestResponseTimeMs] - Meilleur temps de réponse
 * @property {number|null} [lastResponseTimeMs] - Dernier temps de réponse
 * @property {Array<{time: number, date: string, correct: boolean}>} [responseTimeHistory] - Historique des temps (max 20)
 * @property {string|null} [restUntil] - Date ISO jusqu'à laquelle la carte est au repos
 * @property {number} [timesPlayed=0] - Nombre de fois jouée
 * @property {number} [timesCorrect=0] - Nombre de réponses correctes
 * @property {number} [restDays=0] - Jours de repos (cartes vertes)
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES DECK
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Paramètres d'un deck
 * @typedef {Object} DeckSettings
 * @property {boolean} [sequential=false] - Cartes dans l'ordre (vs mélangées)
 * @property {boolean} [bidirectional=false] - Question/réponse inversées aléatoirement
 * @property {number} [maxCards] - Nombre max de cartes par session
 * @property {boolean} [similarityMatching=false] - Accepte fautes de frappe
 * @property {number} [similarityThreshold=0.8] - Seuil de similarité (0.0-1.0)
 */

/**
 * Type de ressource pédagogique
 * @typedef {'image'|'summary'|'link'|'tip'|'glossary'|'objective'|'video'} DeckResourceType
 */

/**
 * Ressource pédagogique attachée à un deck
 * Fournit du contexte et du matériel complémentaire pour l'apprentissage.
 *
 * @typedef {Object} DeckResource
 * @property {DeckResourceType} type - Type de ressource
 * @property {string} title - Titre affiché
 * @property {string} [content] - Contenu texte (Markdown supporté)
 * @property {string} [url] - URL externe (pour liens)
 * @property {string} [image] - Image (base64 data URI ou URL)
 * @property {string} [icon] - Emoji icône
 * @property {number} [order=0] - Ordre d'affichage
 * @property {boolean} [aiGenerated=false] - Si généré par IA (affiche avertissement)
 */

/**
 * Type de source d'un deck
 * @typedef {'human'|'ai'|'procedural'|'imported'|'user'} DeckSourceType
 */

/**
 * Informations sur la source d'un deck
 * @typedef {Object} DeckSource
 * @property {DeckSourceType} type - Type de source
 * @property {string} [generator] - Générateur utilisé (pour procedural)
 * @property {string} [model] - Modèle IA utilisé (pour ai)
 * @property {string} [version] - Version du générateur/modèle
 * @property {string} [generatedAt] - Date de génération ISO
 * @property {string} [author] - Auteur (pour human)
 * @property {string} [importedFrom] - Source d'import (pour imported)
 * @property {Object} [parameters] - Paramètres de génération
 */

/**
 * Métadonnées d'un deck
 * @typedef {Object} DeckMetadata
 * @property {DeckSource} [source] - Informations sur la source du deck
 * @property {string} [license] - Licence du contenu
 * @property {string} [originalUrl] - URL source originale
 */

/**
 * Deck de flashcards
 * @typedef {Object} Deck
 * @property {string} id - Identifiant unique du deck
 * @property {string} name - Nom affiché
 * @property {string} [description] - Description du deck
 * @property {string|string[]} [category] - Catégorie(s) (legacy)
 * @property {string[]} [tags] - Tags du deck
 * @property {number} [difficulty] - Difficulté (1-4)
 * @property {Card[]} cards - Liste des cartes
 * @property {DeckSettings} [settings] - Paramètres du deck
 * @property {DeckResource[]} [resources] - Ressources pédagogiques compagnon
 * @property {DeckMetadata} [metadata] - Métadonnées du deck (source, licence, etc.)
 * @property {boolean} [isCustom] - Si c'est un deck utilisateur
 * @property {string} [createdAt] - Date de création ISO
 * @property {string} [updatedAt] - Date de modification ISO
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES JOUEUR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Historique d'XP
 * @typedef {Object} XPHistoryEntry
 * @property {string} date - Date ISO
 * @property {number} amount - Montant d'XP
 * @property {string} source - Source ('session'|'badge'|'challenge'|'quest')
 * @property {string} [details] - Détails supplémentaires
 */

/**
 * Statistiques du joueur
 * @typedef {Object} PlayerStats
 * @property {number} totalXP - XP total accumulé
 * @property {number} totalCardsPlayed - Nombre total de cartes jouées
 * @property {number} totalSessions - Nombre de sessions
 * @property {number} currentStreak - Série actuelle, en jours de révision (un jour sans carte à réviser ne la casse pas)
 * @property {number} longestStreak - Record de série
 * @property {number} longestGreenStreak - Record de série verte en session
 * @property {string} [lastPlayedAt] - Dernière carte jouée (ISO, réécrit à chaque carte)
 * @property {string} [lastStreakDay] - Dernier jour de révision compté dans la série (YYYY-MM-DD, jour local)
 * @property {string|null} [nextReviewDay] - Premier jour (après le dernier jour de révision) où des cartes seront à réviser dans les decks commencés (YYYY-MM-DD)
 * @property {number} [longestAbsence] - Plus longue absence, en jours calendaires
 * @property {number|null} [fastestCorrectAnswer] - Réponse correcte la plus rapide (ms) ; null/Infinity tant que rien n'est mesuré
 * @property {Object<string, string[]>} [masteredBySubject] - Cartes distinctes passées en boîte verte par matière (maths, francais, histoire, sciences), plafonné à Badges.MASTERED_CAP
 * @property {Object<string, {sat: boolean, sun: boolean}>} [weekendWeeks] - Week-ends joués par semaine ISO ("2026-W01")
 * @property {XPHistoryEntry[]} [xpHistory] - Historique des gains d'XP
 * @property {number} [greenPromotions] - Cartes passées en boîte verte depuis toujours (cumul, jamais décrémenté ; base de la quête de maîtrise)
 * @property {number} [weekRestCards] - Cartes dont le repos a atteint 7 jours (une fois par carte et par franchissement ; badge retention_20)
 * @property {number} [longTermCards] - Cartes dont le repos a atteint 14 jours (badges durable_75 et durable_200)
 * @property {number} [challengeWins] - Défis de révision réussis, au plus un par jour (bonus de 3 XP ; base de la quête weekly_challenges)
 * @property {string} [lastChallengeDay] - Dernier jour (YYYY-MM-DD, jour local) où un défi réussi a donné son bonus
 */

/**
 * Stats secrètes pour badges cachés
 * @typedef {Object} SecretStats
 * @property {number} [nightOwlSessions] - Sessions en soirée (18h-21h)
 * @property {number} [earlyBirdSessions] - Sessions entre 6h et 8h
 * @property {number} [goldenHourSessions] - Sessions 5h-6h
 * @property {number} [perfectSessions] - Sessions 100% sans erreur
 * @property {number} [weekendSessions] - Sessions le week-end
 * @property {string} [lastAbsenceStart] - Début dernière absence
 * @property {number} [comebackCount] - Nombre de retours après absence
 */

/**
 * Paramètres utilisateur
 * @typedef {Object} PlayerSettings
 * @property {string} [theme='dark'] - Thème ('dark'|'light'|'system')
 * @property {boolean} [soundEnabled=true] - Sons activés
 * @property {boolean} [vibrationEnabled=true] - Vibrations activées
 * @property {boolean} [showHints=true] - Afficher les indices
 * @property {string} [locale='fr'] - Langue de l'interface
 * @property {string} [language='auto'] - Langue choisie par le joueur ('fr'|'en'|'auto' : langue du navigateur)
 * @property {string} [grammaticalForm='feminine'] - Forme des textes français qui désignent la personne qui joue ('feminine'|'masculine'|'inclusive' : point médian) ; sans effet en anglais
 */

/**
 * Variantes grammaticales d'une valeur du dictionnaire i18n (textes français qui désignent la personne qui joue).
 * Une variante absente retombe sur `f`.
 * @typedef {Object} TranslationVariants
 * @property {string} f - Féminin (défaut)
 * @property {string} [m] - Masculin
 * @property {string} [x] - Forme à point médian
 */

/**
 * Profil joueur
 * @typedef {Object} Player
 * @property {string} id - Identifiant unique
 * @property {string} name - Nom/pseudo du joueur
 * @property {string} createdAt - Date de création ISO
 * @property {PlayerStats} stats - Statistiques
 * @property {SecretStats} [secretStats] - Stats pour badges secrets
 * @property {string[]} badges - IDs des badges obtenus
 * @property {PlayerSettings} settings - Paramètres
 * @property {Missions} [missions] - Défis quotidiens et quêtes hebdomadaires du joueur (enregistrés, exportés et importés avec lui)
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES SESSION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Résultat d'une carte jouée
 * @typedef {Object} CardResult
 * @property {string} cardId - ID de la carte
 * @property {boolean} isCorrect - Si la réponse était correcte
 * @property {number} responseTimeMs - Temps de réponse en millisecondes
 * @property {LeitnerBox} previousBox - Boîte avant la réponse
 * @property {LeitnerBox} newBox - Boîte après la réponse
 * @property {number} xpEarned - XP gagné pour cette carte
 * @property {number} [bonusXp] - Bonus de série de cartes vertes versé avec cette carte (palier exact)
 * @property {string} [userAnswer] - Réponse donnée par l'utilisateur
 */

/**
 * Statistiques de session
 * @typedef {Object} SessionStats
 * @property {number} cardsPlayed - Nombre de cartes jouées
 * @property {number} correctAnswers - Nombre de bonnes réponses
 * @property {number} currentGreenStreak - Série verte actuelle
 * @property {number} maxGreenStreak - Meilleure série verte de la session
 * @property {number} totalXpEarned - XP total gagné dans la session
 * @property {number} [averageResponseTimeMs] - Temps moyen de réponse
 */

/**
 * Session de jeu
 * @typedef {Object} GameSession
 * @property {string} deckId - ID du deck joué
 * @property {string} startedAt - Début de session (ISO)
 * @property {string} [endedAt] - Fin de session (ISO)
 * @property {CardResult[]} results - Résultats par carte
 * @property {SessionStats} stats - Statistiques agrégées
 * @property {BadgeDefinition[]} [newBadges] - Badges obtenus pendant la séance (carte par carte et fin de séance)
 * @property {string|null} [previousPlayedAt] - Dernière activité du joueur avant la séance (ISO)
 * @property {Array<{id: string, type: string, target: (number|Object), xpReward: number}>} [completedChallenges] - Défis quotidiens terminés pendant la séance
 * @property {Array<{id: string, type: string, target: number, xpReward: number}>} [completedQuests] - Quêtes hebdomadaires terminées pendant la séance
 * @property {ChallengeInfo} [challenge] - Présent si la séance est un défi (mode défi : une autre façon de réviser)
 * @property {Object} [challengeOutcome] - Résultat du défi à sa fin (Challenges.evaluateChallenge + bonus et record)
 */

/**
 * Description d'un défi, portée par `session.challenge`
 * @typedef {Object} ChallengeInfo
 * @property {string} modeId - 'steady' (Parcours), 'perfect' (Sans erreur), 'speed' (Contre la montre) ou 'endurance' (Jusqu'au bout)
 * @property {string|null} difficulty - 'easy'|'medium'|'hard'|'expert' (null en entraînement libre)
 * @property {boolean} practice - Entraînement libre : cartes au repos, rien n'est enregistré
 * @property {boolean} timed - Chronomètre actif (Contre la montre seulement)
 * @property {number} plannedCards - Nombre de cartes prévues (Jusqu'au bout : toutes les cartes à réviser)
 * @property {Object|null} target - Objectif : `{ accuracy }` (Parcours), `{ run }` (Sans erreur), `{ correct }` (Contre la montre) ou `{ accuracy, halves: true }` (Jusqu'au bout, tenu sur chaque moitié)
 * @property {number} multiplier - Multiplicateur du score affiché (jamais de l'XP)
 * @property {number|null} timeBudgetMs - Budget de temps de tout le défi (ms), null sans chronomètre
 * @property {boolean} timedOut - Le chronomètre est arrivé à zéro
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES BADGES ET DÉFIS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Catégorie de badge
 * @typedef {'subject'|'level'|'performance'|'streak'|'mastery'|'achievement'|'secret'} BadgeCategory
 */

/**
 * Rareté de badge
 * @typedef {'common'|'uncommon'|'rare'|'epic'|'legendary'} BadgeRarity
 */

/**
 * Définition d'un badge
 * @typedef {Object} BadgeDefinition
 * @property {string} id - Identifiant unique
 * @property {string} name - Nom affiché
 * @property {string} description - Description
 * @property {string} icon - Emoji ou icône
 * @property {BadgeCategory} category - Catégorie
 * @property {BadgeRarity} rarity - Rareté
 * @property {number} xpReward - XP accordé à l'obtention
 * @property {boolean} [secret=false] - Badge caché
 * @property {function(Player, GameSession, {sessionEnded: (boolean|undefined)}): boolean} condition - Condition d'obtention (3e argument : `sessionEnded: false` pendant une séance)
 */

/**
 * Type de défi quotidien
 * @typedef {'review_due'|'accuracy'|'green_streak'} ChallengeType
 */

/**
 * Type de quête hebdomadaire
 * @typedef {'weekly_xp'|'weekly_mastery'|'weekly_streak'|'weekly_challenges'|'weekly_decks'} QuestType
 */

/**
 * Défi quotidien (réviser des cartes, précision sur la journée, série verte). Le texte affiché
 * est calculé par `Challenges.describe` (clés i18n `missions.daily.*`).
 * @typedef {Object} DailyChallenge
 * @property {string} id - Identifiant unique
 * @property {ChallengeType} type - Type de défi
 * @property {number|{accuracy: number, minCards: number}} target - Objectif (`accuracy` : pourcentage visé et cartes minimales de la journée)
 * @property {number} xpReward - XP à gagner (crédité une seule fois)
 * @property {string} createdAt - Jour du défi (YYYY-MM-DD, jour local)
 * @property {string} expiresAt - Lendemain (YYYY-MM-DD)
 * @property {number} progress - Progression actuelle (cartes distinctes, pourcentage, ou série)
 * @property {boolean} completed - Si complété
 * @property {string|null} completedAt - Date de complétion (ISO)
 */

/**
 * Quête hebdomadaire (même forme qu'un défi quotidien ; `target` toujours numérique)
 * @typedef {Object} WeeklyQuest
 * @property {string} id - Identifiant unique
 * @property {QuestType} type - Type de quête
 * @property {number} target - Objectif
 * @property {number} xpReward - XP à gagner (crédité une seule fois)
 * @property {string} createdAt - Lundi de la semaine (YYYY-MM-DD, jour local)
 * @property {string} expiresAt - Dimanche de la semaine (YYYY-MM-DD)
 * @property {number} progress - Progression de la semaine
 * @property {boolean} completed - Si complétée
 * @property {string|null} completedAt - Date de complétion (ISO)
 */

/**
 * Missions d'un joueur (`player.missions`)
 * @typedef {Object} Missions
 * @property {Object} [daily] - Défis du jour
 * @property {string} daily.day - Jour (YYYY-MM-DD, jour local)
 * @property {number} daily.dueAtStart - Cartes à réviser mesurées à la première carte du jour (0 : aucun défi)
 * @property {number} daily.cardsPlayed - Cartes jouées dans la journée (toutes séances)
 * @property {number} daily.correct - Bonnes réponses de la journée
 * @property {string[]} daily.cardKeys - Cartes distinctes jouées ("deckId/cardId")
 * @property {DailyChallenge[]} daily.challenges - Défis du jour (3, ou aucun)
 * @property {Object} [weekly] - Quêtes de la semaine
 * @property {string} weekly.weekStart - Lundi (YYYY-MM-DD, jour local)
 * @property {{greenPromotions: number, challengeWins: number}} weekly.baseline - Instantané pris au début de la semaine
 * @property {string[]} weekly.decksPlayed - Decks joués cette semaine
 * @property {string[]} weekly.daysPlayed - Jours joués cette semaine
 * @property {WeeklyQuest[]} weekly.quests - Les 5 quêtes
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES TAGS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Équivalents internationaux d'un tag niveau scolaire
 * @typedef {Object} TagEquivalents
 * @property {string} [en] - Équivalent anglais (US)
 * @property {string} [uk] - Équivalent britannique
 * @property {string} [de] - Équivalent allemand
 * @property {string} [es] - Équivalent espagnol
 */

/**
 * Tag de taxonomie
 * @typedef {Object} Tag
 * @property {string} id - Identifiant unique (slug)
 * @property {string} label - Libellé affiché
 * @property {string} icon - Emoji
 * @property {string} group - Groupe pour l'affichage
 * @property {string[]} parents - IDs des tags parents (multi-parents supporté)
 * @property {TagEquivalents} [equivalents] - Équivalents internationaux
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Résultat de validation d'une réponse
 * @typedef {Object} ValidationResult
 * @property {boolean} isCorrect - Si la réponse est correcte
 * @property {string} [normalizedAnswer] - Réponse normalisée
 * @property {string} [expectedAnswer] - Réponse attendue
 * @property {number} [similarity] - Score de similarité (0-1)
 * @property {string} [matchType] - Type de correspondance ('exact'|'alternative'|'similar')
 */

/**
 * Rapport de validation d'un deck
 * @typedef {Object} DeckValidationReport
 * @property {boolean} isValid - Si le deck est valide
 * @property {number} averageScore - Score moyen des cartes (0-100)
 * @property {string} grade - Note (A, B, C, D, F)
 * @property {Object} stats - Statistiques
 * @property {number} stats.totalCards - Nombre total de cartes
 * @property {number} stats.validCards - Cartes valides
 * @property {number} stats.cardsWithWarnings - Cartes avec avertissements
 * @property {number} stats.cardsWithErrors - Cartes avec erreurs
 * @property {number} stats.highRiskCards - Cartes à vérifier
 * @property {string[]} deckIssues - Problèmes du deck
 * @property {Object[]} duplicates - Doublons détectés
 * @property {Object[]} cardResults - Résultats par carte
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES ÉTAT APPLICATION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * État global de l'application
 * @typedef {Object} AppState
 * @property {Player|null} player - Joueur courant
 * @property {Deck[]} decks - Liste des decks disponibles
 * @property {Deck|null} currentDeck - Deck en cours de jeu
 * @property {Card|null} currentCard - Carte en cours
 * @property {GameSession|null} session - Session de jeu active
 * @property {DailyChallenge[]} dailyChallenges - Défis du jour
 * @property {string} currentRoute - Route actuelle
 */

/**
 * Options pour getCardsForSession
 * @typedef {Object} SessionOptions
 * @property {string} today - Date du jour (YYYY-MM-DD)
 * @property {number} [maxCards=100] - Nombre max de cartes
 * @property {boolean} [sequential=false] - Cartes dans l'ordre
 * @property {boolean} [includeGreen=true] - Inclure les cartes vertes en repos terminé
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES EXPORT/IMPORT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Format d'export supporté
 * @typedef {'yaml'|'json'|'csv'|'anki'|'moodle'} ExportFormat
 */

/**
 * Options d'export
 * @typedef {Object} ExportOptions
 * @property {ExportFormat} format - Format de sortie
 * @property {boolean} [includeProgress=false] - Inclure la progression
 * @property {boolean} [includeMedia=true] - Inclure les médias base64
 */

// Ce fichier ne contient que des définitions de types JSDoc.
// Il n'exporte rien car les types sont globaux via JSDoc.
