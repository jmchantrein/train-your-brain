/**
 * Module i18n - Internationalisation
 *
 * Gère les traductions et le changement de langue.
 * Langues supportées : Français (par défaut), Anglais
 */

const i18n = {
  // Langue courante
  _locale: 'fr',

  // Écouteurs de changement de langue
  _listeners: [],

  // Étiquettes BCP 47 pour les formats de dates et de nombres
  _FORMAT_LOCALES: { fr: 'fr-FR', en: 'en-US' },

  // Langues supportées
  SUPPORTED_LOCALES: ['fr', 'en'],

  // Forme grammaticale des textes français qui désignent la personne qui joue :
  // féminin (défaut), masculin, ou forme à point médian. Réglage du joueur
  // (player.settings.grammaticalForm). L'anglais n'accorde pas : il ignore ce réglage.
  GRAMMATICAL_FORMS: ['feminine', 'masculine', 'inclusive'],
  DEFAULT_GRAMMATICAL_FORM: 'feminine',

  // Clé de variante d'une valeur de dictionnaire { f, m, x } pour chaque forme
  _FORM_VARIANT: { feminine: 'f', masculine: 'm', inclusive: 'x' },

  // Forme grammaticale courante
  _grammaticalForm: 'feminine',

  // Traductions
  _translations: {
    // ═══════════════════════════════════════════════════════════════
    // FRANÇAIS (par défaut)
    // ═══════════════════════════════════════════════════════════════
    fr: {
      // Général
      'app.name': 'Train Your Brain',
      'app.loading': 'Chargement...',
      'common.save': 'Sauvegarder',
      'common.cancel': 'Annuler',
      'common.delete': 'Supprimer',
      'common.edit': 'Modifier',
      'common.close': 'Fermer',
      'common.back': 'Retour',
      'common.next': 'Suivant',
      'common.import': 'Importer',
      'common.export': 'Exporter',
      'common.or': 'ou',

      // Decks masqués
      'explore.hiddenDecks': 'Decks masqués',

      // Navigation
      'nav.home': 'Accueil',
      'nav.explore': 'Explorer',
      'nav.create': 'Créer',
      'nav.stats': 'Stats',
      'nav.settings': 'Paramètres',

      // Page Outils
      'tools.title': 'Outils Interactifs',

      // Accessibilité (skip links)
      'a11y.skipToContent': 'Aller au contenu principal',
      'a11y.skipToNav': 'Aller à la navigation',

      // Page Splash
      'splash.title': 'Train Your Brain',
      'splash.subtitle': 'Apprends efficacement avec la répétition espacée',
      'splash.start': 'Commencer',
      'splash.newPlayer': 'Nouveau profil',
      'splash.yourName': 'Quel nom veux-tu utiliser ?',
      'splash.enterName': 'Un prénom ou un pseudo suffit',
      'splash.chooseProfile': 'Choisir un profil',
      'splash.level': 'Niveau',
      'splash.importSave': 'Importer une sauvegarde',
      'splash.nameRequired': 'Saisis un nom pour continuer',

      // Page Home
      'home.decksToReview': 'Decks à réviser',
      'home.noCardsToday': 'Aucune carte à réviser aujourd\'hui !',
      'home.viewAllDecks': 'Voir tous les decks',
      'home.decksResting': 'Decks au repos',

      // Page Explore
      'explore.title': 'Explorer',
      'explore.search': 'Rechercher un deck...',
      'explore.filterBy': 'Filtré par',
      'explore.noResults': 'Aucun deck trouvé',

      // Page Deck Hub
      'deckHub.title': 'Créer & Gérer',
      'deckHub.subtitle': 'Crée, importe et gère tes decks de cartes',
      'deckHub.createManual': 'Créer manuellement',
      'deckHub.createManualDesc': 'Crée un deck carte par carte avec l\'éditeur visuel',
      'deckHub.generateAI': 'Générer avec l\'IA',
      'deckHub.generateAIDesc': 'Crée une consigne prête à coller dans un assistant IA comme ChatGPT ou Claude',
      'deckHub.pasteYAML': 'Coller du YAML',
      'deckHub.pasteYAMLDesc': 'Importe un deck en collant du contenu YAML',
      'deckHub.importFile': 'Importer un fichier',
      'deckHub.importFileDesc': 'JSON, YAML ou Moodle XML',
      'deckHub.dictation': 'Dictée audio',
      'deckHub.dictationDesc': 'Crée un deck de dictée avec audio depuis Lingua Libre',
      'deckHub.multilingual': 'Vocabulaire multilingue',
      'deckHub.multilingualDesc': 'Crée un deck de vocabulaire thématique en plusieurs langues',
      'deckHub.deckHubCloud': 'DeckHub',
      'deckHub.deckHubCloudDesc': 'Parcours, télécharge et partage des decks avec la communauté',
      'deckHub.comingSoon': 'Bientôt',
      'deckHub.mergeDeck': 'Fusionner des decks',
      'deckHub.mergeDeckDesc': 'Combine plusieurs decks existants en un seul nouveau deck',

      // Page Fusion de decks
      'merger.title': 'Fusionner des decks',
      'merger.subtitle': 'Sélectionne les decks à fusionner, puis configure le nouveau deck',
      'merger.selectDecks': 'Sélectionner les decks',
      'merger.noDecksSelected': 'Aucun deck sélectionné',
      'merger.configuration': 'Configuration du nouveau deck',
      'merger.newDeckName': 'Nom du nouveau deck',
      'merger.newDeckNamePlaceholder': 'Ex: Mon deck fusionné',
      'merger.newDeckDescription': 'Description',
      'merger.newDeckDescriptionPlaceholder': 'Description du deck fusionné...',
      'merger.options': 'Options',
      'merger.removeDuplicates': 'Supprimer les doublons',
      'merger.removeDuplicatesDesc': 'Supprime les cartes avec la même question',
      'merger.shuffleCards': 'Mélanger les cartes',
      'merger.shuffleCardsDesc': 'Mélange aléatoirement l\'ordre des cartes',
      'merger.keepProgress': 'Conserver la progression',
      'merger.keepProgressDesc': 'Garde les statistiques des cartes (boîte, seuil de latence...)',
      'merger.preview': 'Aperçu',
      'merger.totalCards': 'Total : {count} cartes',
      'merger.merge': 'Fusionner',
      'merger.cancel': 'Annuler',
      'merger.success': 'Deck "{name}" créé avec succès !',
      'merger.error': 'Erreur lors de la fusion',
      'merger.minDecks': 'Sélectionne au moins 2 decks',

      // Éditeur de deck
      'editor.title': 'Éditeur de deck',

      // Types de cartes
      'cardType.text': 'Texte',
      'cardType.numeric': 'Numérique',
      'cardType.mcq': 'Choix multiple (QCM)',
      'cardType.truefalse': 'Vrai/Faux',
      'cardType.cloze': 'Texte à trous',
      'cardType.matching': 'Association',

      // Page Game
      'game.title': 'Session de révision',
      'game.quitConfirm': 'Veux-tu vraiment quitter cette session ?',
      'game.validate': 'Valider',
      'game.iDontKnow': 'Je ne sais pas',
      'game.continue': 'Continuer',
      'game.correct': 'Correct !',
      'game.incorrect': 'Incorrect',
      'game.yourAnswer': 'Ta réponse',
      'game.sessionComplete': 'Session terminée !',
      'game.accuracy': 'Précision',
      'game.backHome': 'Retour à l\'accueil',
      'game.levelUp': 'Niveau Supérieur !',
      'game.badgeUnlocked': 'Badge débloqué !',
      'game.badgesUnlockedMany': '{count} nouveaux badges !',
      'validation.emptyInput': 'Saisis une réponse',
      'game.enterNumber': 'Écris un nombre...',
      'game.yourResponse': 'Ta réponse...',
      'game.true': 'Vrai',
      'game.false': 'Faux',
      'game.choose': 'Choisir',
      'game.match': 'Associer',
      'game.answer': 'Bonne réponse :',
      'game.pile.heart': 'Coeur',
      'game.pile.club': 'Trèfle',
      'game.pile.spade': 'Pique',
      'game.pile.draw': 'Pioche',
      'game.feedback.purpleTitle': 'Pas de souci !',
      'game.feedback.purpleSubtitle': 'On apprend de ses erreurs. La carte reviendra bientôt pour réessayer.',
      'game.feedback.orangeTitle': 'Bien joué !',
      'game.feedback.orangeSubtitle': 'Bonne réponse ! Tu progresses.',
      'game.feedback.greenTitle': 'Excellent !',
      'game.feedback.greenSubtitle': 'Réponse juste et rapide : carte maîtrisée !',
      'game.feedback.correct': 'Bonne réponse',
      'game.feedback.incorrect': 'Réponse incorrecte.',
      'game.feedback.correctAnswer': 'Bonne réponse :',
      'game.loading': 'Chargement...',

      // Glossaire Leitner (tooltips)
      'game.leitner.purple.title': 'Boîte Violette - À revoir',
      'game.leitner.purple.tooltip': 'Cartes mal maîtrisées. Elles reviendront souvent pour t\'aider à les mémoriser.',
      'game.leitner.orange.title': 'Boîte Orange - En cours',
      'game.leitner.orange.tooltip': 'Cartes en progression. Une réponse plus rapide les fera avancer.',
      'game.leitner.green.title': 'Boîte Verte - Maîtrisées',
      'game.leitner.green.tooltip': 'Cartes maîtrisées ! Elles reviendront après une période de repos.',

      // Mode multilingue
      'game.multilingual.writeWord': 'Écris le mot correspondant',
      'game.multilingual.listen': 'Écouter',
      'game.multilingual.playAudio': 'Jouer l\'audio',
      'game.multilingual.writeHeard': 'Écris ce que tu entends',
      'game.multilingual.translateHeard': 'Traduis ce que tu entends en',
      'game.multilingual.yourAnswer': 'Ta réponse...',

      // Audio Choice (ear training)
      'game.audioChoice.listenNote': 'Écouter la note',
      'game.audioChoice.listenInterval': 'Écouter l\'intervalle',
      'game.audioChoice.listenChord': 'Écouter l\'accord',
      'game.audioChoice.hint': 'Clique pour rejouer le son',

      // Page Stats
      'stats.title': 'Statistiques',
      'stats.level': 'Niveau',
      'stats.cardsPlayed': 'Cartes jouées',
      'stats.sessions': 'Sessions',
      'stats.badges': 'Badges',
      'stats.progression': 'Progression',
      'stats.currentStreak': 'Série actuelle',
      'stats.record': 'Record',
      'stats.mastery': 'Maîtrise',
      'stats.greenCards': 'Cartes vertes (maîtrisées)',

      // Page Settings
      'settings.title': 'Paramètres',
      'settings.language': 'Langue',
      'settings.data': 'Données',
      'settings.reset': 'Réinitialiser',
      'settings.resetConfirm': 'Veux-tu vraiment réinitialiser toutes tes données ?',
      'settings.about': 'À propos',
      'settings.version': 'Version',
      'settings.aboutTitle': 'Pourquoi Train Your Brain ?',
      'settings.aboutLeitner': 'Apprendre intelligemment',
      'settings.aboutLeitnerDesc': 'Basé sur le système Leitner de répétition espacée : les cartes difficiles reviennent souvent, les cartes maîtrisées plus rarement.',
      'settings.aboutAI': 'L\'IA au service de ton cerveau',
      'settings.aboutAIDesc': 'Plutôt que de laisser l\'IA penser à notre place, utilisons-la pour créer du contenu pédagogique de qualité et entraîner notre propre intelligence.',
      'settings.aboutShare': 'Partager la connaissance',
      'settings.aboutShareDesc': 'Crée, partage et découvre des decks. La connaissance n\'a de valeur que si elle est transmise.',
      'settings.aboutOffline': '100% hors-ligne',
      'settings.aboutOfflineDesc': 'Tes données restent sur ton appareil. Pas de compte, pas de suivi, pas de distraction. Juste toi et ton apprentissage.',
      'settings.aboutOpenSource': 'Open Source',
      'settings.aboutOpenSourceDesc': 'Code source ouvert et transparent. Contribue, améliore, adapte à tes besoins.',
      'settings.aboutContribute': 'Proposer une fonctionnalité',
      'settings.aboutContributeDesc': 'Tu as une idée ? Propose-la sur GitHub (pull request ou signalement). Ce projet est fait pour toi !',
      'settings.contact': 'Signaler un problème',

      // Boîtes Leitner
      'box.neverPlayed': 'Non jouée',
      'box.purple': 'Violette',
      'box.orange': 'Orange',
      'box.green': 'Verte',

      // Page Examen
      'exam.title': 'Examen',

      // Page Résumé de session
      'sessionSummary.title': 'Résumé de session',

      // Page Badges
      'badges.title': 'Badges',

      // Page Défis
      'challenges.title': 'Défis',
      'challenges.modeDefi': 'Mode Défi',
      'challenge.quitConfirm': 'Quitter le défi ? Les cartes déjà validées sont enregistrées.',
      'challenge.practiceRight': 'Réponse juste. En entraînement libre, rien n\'est enregistré.',
      'challenge.practiceWrong': 'Pas de souci : en entraînement libre, rien n\'est enregistré.',
      'challenge.title': 'Défi',
      'challenge.barLabel': 'Défi en cours',
      'challenge.mode.steady': 'Parcours',
      'challenge.mode.perfect': 'Sans erreur',
      'challenge.mode.speed': 'Contre la montre',
      'challenge.mode.endurance': 'Jusqu\'au bout',
      'challenge.modeDesc.steady': 'Réponds à quelques cartes à réviser et vise un pourcentage de bonnes réponses. Pas de chronomètre.',
      'challenge.modeDesc.perfect': 'Vise une série de bonnes réponses d\'affilée : tu vois jusqu\'où tu vas. Pas de chronomètre.',
      'challenge.modeDesc.speed': 'Un seul temps pour tout le défi, compté pendant les questions. Réussis assez de bonnes réponses avant qu\'il soit écoulé.',
      'challenge.modeDesc.endurance': 'Toutes les cartes à réviser du deck, en une fois. Garde ton niveau de réussite jusqu\'à la dernière carte.',
      'challenge.diff.easy': 'Léger',
      'challenge.diff.medium': 'Moyen',
      'challenge.diff.hard': 'Soutenu',
      'challenge.diff.expert': 'Expert',
      'challenge.goal.steady': 'Objectif : {percent} % de bonnes réponses',
      'challenge.goal.perfect': 'Objectif : {run} bonnes réponses d\'affilée',
      'challenge.goal.speed': 'Objectif : {correct} bonnes réponses avant la fin du temps',
      'challenge.goal.endurance': 'Objectif : {percent} % de bonnes réponses sur chaque moitié, jusqu\'à la dernière carte',
      'challenge.levelLine.steady': '{count} cartes, {percent} % de bonnes réponses',
      'challenge.levelLine.perfect': '{count} cartes, série de {run}',
      'challenge.levelLine.speed': '{count} cartes, {correct} bonnes réponses en {time}',
      'challenge.levelLine.endurance': 'Les {count} cartes à réviser, {percent} % sur chaque moitié',
      'challenge.progress.steady': 'Justes : {correct} sur {answered}',
      'challenge.progress.perfect': 'Meilleure série : {run}',
      'challenge.cardsCount': '{count} cartes',
      'challenge.timerLabel': 'Temps restant',
      'challenge.practiceBanner': 'Entraînement libre : tes cartes ne changent pas.',
      'challenge.quitPracticeConfirm': 'Quitter l\'entraînement libre ?',
      'challenge.deckAction': 'Défi',
      'challenge.entry.title': 'Lancer un défi',
      'challenge.entry.intro': 'Une autre façon de faire tes révisions : mêmes cartes, mêmes règles, un objectif en plus.',
      'challenge.entry.deckLabel': 'Deck',
      'challenge.entry.deckOption': '{name} ({count} à réviser)',
      'challenge.entry.choose': 'Choisir un défi',
      'challenge.entry.empty': 'Commence un deck pour pouvoir lancer un défi.',
      'challenge.entry.explore': 'Explorer les decks',
      'challenge.entry.recordsTitle': 'Tes meilleurs scores',
      'challenge.entry.recordLine': '{mode}, {level} : {score}',
      'challengeSetup.title': 'Choisir un défi',
      'challengeSetup.intro': 'Un défi est une autre façon de faire tes révisions : tes cartes avancent comme d\'habitude.',
      'challengeSetup.dueCount': 'Cartes à réviser : {count}',
      'challengeSetup.modeLegend': 'Mode',
      'challengeSetup.levelLegend': 'Niveau',
      'challengeSetup.levelNeeds': 'Il faut {count} cartes à réviser',
      'challengeSetup.speedHelp': 'Le temps ne tourne que pendant les questions. Quand il arrive à zéro, le défi s\'arrête sans rien compter comme faux : les cartes non atteintes restent à revoir.',
      'challengeSetup.enduranceHelp': 'Rien de plus que ta séance normale : les mêmes cartes, rien au repos. Tu peux t\'arrêter quand tu veux, les cartes validées sont gardées.',
      'challengeSetup.record': 'Ton record : {score}',
      'challengeSetup.start': 'Lancer le défi',
      'challengeSetup.bonusNote': 'Un défi réussi rapporte {xp} XP de bonus, une fois par jour. L\'XP vient surtout des cartes.',
      'challengeSetup.few': 'Il y a peu de cartes à réviser dans ce deck (cartes à réviser : {count}). Un défi en demande au moins {min} : joue-les en séance normale.',
      'challengeSetup.playNormal': 'Réviser en séance normale',
      'challengeSetup.nothing': 'Rien à réviser dans ce deck pour le moment : tes cartes se reposent.',
      'challengeSetup.practiceTitle': 'Entraînement libre',
      'challengeSetup.practiceNote': 'Revois des cartes au repos pour le plaisir. Rien n\'est enregistré : ni boîte, ni repos, ni XP.',
      'challengeSetup.practiceCount': 'Cartes au repos : {count}',
      'challengeSetup.practiceStart': 'Commencer l\'entraînement',
      'challengeSetup.back': 'Retour aux défis',
      'challengeResults.success': 'Défi réussi !',
      'challengeResults.wellDone': 'Bien joué !',
      'challengeResults.again': 'Pas cette fois',
      'challengeResults.againHint': 'Ce que tu as appris compte : tes cartes ont avancé. Tu pourras réessayer plus tard.',
      'challengeResults.timeUp': 'Le temps est écoulé. Les cartes non atteintes restent à revoir.',
      'challengeResults.practiceTitle': 'Entraînement terminé',
      'challengeResults.practiceCount': '{correct} bonnes réponses sur {answered}',
      'challengeResults.practiceNote': 'Rien n\'a changé pour tes cartes : boîtes, repos et XP sont intacts.',
      'challengeResults.statCorrect': 'Justes',
      'challengeResults.halves': 'Première moitié : {first} sur {firstTotal}, seconde moitié : {second} sur {secondTotal}',
      'challengeResults.statBestRun': 'Meilleure série',
      'challengeResults.statScore': 'Score',
      'challengeResults.record': 'Nouveau record personnel !',
      'challengeResults.bestScore': 'Ton record : {score}',
      'challengeResults.bonus': '+{xp} XP de bonus',
      'challengeResults.bonusDone': 'Le bonus du jour est déjà pris : un seul par jour.',
      'challengeResults.another': 'Choisir un autre défi',
      'challengeResults.back': 'Retour aux défis',

      // Page Générateur de prompts
      'promptGenerator.title': 'Générateur de Deck IA',

      // Pages multilingues
      'multilingual.config': 'Configuration multilingue',
      'multilingual.creator': 'Création multilingue',

      // Message "reviens demain"
      'home.comeBackTomorrow': 'Toutes tes cartes sont au repos !',
      'home.comeBackIn': 'Prochaine révision dans',
      'home.days': 'jours',
      'home.day': 'jour',
      'home.hours': 'heures',
      'home.hour': 'heure',

      // ─── Ajouts : parcours principaux (profil, jeu, résumé, paramètres, examen, défi, navigation) ───
      'game.question': 'Question',
      'common.quit': 'Quitter',
      'common.error': 'Erreur',
      'common.seeResults': 'Voir les résultats',
      'common.importError': 'Erreur lors de l\'import : {message}',
      'common.invalidFile': 'Format de fichier invalide',
      'app.pageLoadError': 'La page n\'a pas pu se charger.',
      'game.streakLabel': 'Série : {count} cartes vertes consécutives',
      'game.cardImageAlt': 'Illustration de la carte',
      'media.remoteWarning': 'Média distant non chargé automatiquement : l\'ouvrir contacte « {host} » et lui indique ton adresse IP.',
      'media.openRemoteImage': 'Ouvrir l\'image distante',
      'media.openRemoteAudio': 'Ouvrir le son distant',
      'media.remoteImagePlaceholder': 'Image distante non chargée',
      'deckEditor.notFound': 'Ce deck n\'existe pas ou n\'est plus disponible.',
      'deckEditor.cardIncomplete': 'La carte {n} est incomplète : une question et une réponse sont obligatoires.',
      'dictation.noCardTitle': 'Aucune carte générée',
      'dictation.noCardMessage': 'Aucun enregistrement n\'a été trouvé pour ces mots : il n\'y a donc rien à sauvegarder. Vérifie l\'orthographe ou essaie d\'autres mots.',
      'multilingual.shareHintOn': 'Seuls les enregistrements sous licence libre seront inclus. L\'auteur et la licence sont indiqués pour chaque mot : conserve ces mentions si tu partages ce deck (la licence CC BY, par exemple, exige de citer l\'auteur).',
      'stats.boxDistribution': 'Répartition par boîte :',
      'deckTable.progressLabel': '{progress} % maîtrisé',
      'a11y.navHome': 'Navigation vers l\'accueil',
      'a11y.navSettings': 'Navigation vers les paramètres',
      'a11y.dialogClosed': 'Fenêtre fermée',
      'game.imageToIdentifyAlt': 'Image à identifier',
      'game.noCardsDirection': 'Aucune carte à jouer dans ce sens. Toutes les cartes sont au repos.',
      'game.feedback.purple2Title': 'Presque !',
      'game.feedback.purple2Subtitle': 'Chaque erreur est une occasion d\'apprendre. Continue !',
      'game.feedback.purple3Title': 'Pas grave !',
      'game.feedback.purple3Subtitle': 'C\'est ainsi que l\'on progresse. Courage !',
      'game.feedback.purple4Title': 'On continue !',
      'game.feedback.purple4Subtitle': 'L\'important est de continuer. La carte reviendra bientôt.',
      'game.rightAnswerLabel': 'Bonne réponse :',
      'game.blankLabel': 'Réponse {n}',
      'home.waitingSuggestion': 'En attendant, explore de nouveaux decks ou consulte tes statistiques !',
      'splash.importInvalid': 'Fichier invalide : aucun profil trouvé',
      'splash.importSuccess': 'Profil "{name}" importé avec succès !',
      'summary.cards': 'Cartes',
      'summary.newBadges': 'Nouveaux badges !',
      'summary.challengesCompleted': 'Défis complétés !',
      'summary.learningTitle': 'Ce que cette séance a changé',
      'summary.toGreen': 'En boîte verte : {count}',
      'summary.toReview': 'À revoir : {count}',
      'summary.nothingBeforeTomorrow': 'Rien à réviser avant demain, bien joué !',
      'summary.nothingBeforeDate': 'Rien à réviser avant le {date}, bien joué !',
      'summary.nothingToday': 'Rien à réviser aujourd\'hui, bien joué !',
      'summary.questsCompleted': 'Quêtes de la semaine terminées !',
      'missions.title': 'Missions',
      'missions.loading': 'Chargement...',
      'missions.tabDaily': 'Quotidiens',
      'missions.tabWeekly': 'Hebdomadaires',
      'missions.completedCount': '{done}/{total} complétés',
      'missions.xpEarned': '+{xp} XP gagnés',
      'missions.done': 'Complété !',
      'missions.dailyHint': 'Les défis se renouvellent chaque jour à minuit',
      'missions.weeklyHint': 'Les quêtes se renouvellent chaque lundi',
      'missions.restDay': 'Rien à réviser aujourd\'hui : pas de défi du jour. Reviens quand des cartes seront à revoir.',
      'missions.progress.review_due': '{progress}/{target} cartes',
      'missions.progress.accuracy': '{progress}% / {target}%',
      'missions.progress.accuracyWait': '{played}/{minCards} cartes jouées',
      'missions.progress.green_streak': '{progress}/{target} cartes vertes d\'affilée',
      'missions.daily.review_due': 'Réviser {count} cartes aujourd\'hui',
      'missions.daily.review_due_one': 'Réviser une carte aujourd\'hui',
      'missions.daily.accuracy': 'Réussir {percent}% de bonnes réponses sur la journée (dès {count} cartes)',
      'missions.daily.accuracy_one': 'Réussir {percent}% de bonnes réponses sur la journée (dès {count} carte)',
      'missions.daily.green_streak': 'Enchaîner {count} cartes vertes d\'affilée',
      'missions.daily.green_streak_one': 'Faire passer une carte en vert',
      'missions.weekly.weekly_xp': 'Gagner {count} XP en révisant cette semaine',
      'missions.weekly.weekly_mastery': 'Faire passer {count} cartes en boîte verte',
      'missions.weekly.weekly_mastery_one': 'Faire passer une carte en boîte verte',
      'missions.weekly.weekly_streak': 'Réviser {count} jours cette semaine',
      'missions.weekly.weekly_challenges': 'Réussir {count} défis cette semaine (un par jour au plus)',
      'missions.weekly.weekly_decks': 'Réviser dans {count} decks différents',
      'missions.weekly.weekly_decks_one': 'Réviser dans un deck',
      'summary.replay': 'Rejouer ({count})',
      'settings.languageAuto': 'Automatique (langue du navigateur)',
      'settings.audio': 'Audio',
      'settings.soundEnabled': 'Sons activés',
      'settings.themes': 'Thèmes',
      'settings.themesDesc': 'Personnalise l\'apparence de l\'application. Débloque de nouveaux thèmes en progressant !',
      'settings.themesUnavailable': 'Thèmes non disponibles',
      'settings.accessibility': 'Accessibilité',
      'settings.dyslexia': 'Mode dyslexie',
      'settings.dyslexiaDesc': 'Police adaptée à la dyslexie et espacement plus large',
      'settings.highContrast': 'Contraste élevé',
      'settings.highContrastDesc': 'Augmente le contraste des textes et bordures',
      'settings.largeSpacing': 'Espacement large',
      'settings.largeSpacingDesc': 'Augmente la taille du texte et les espacements',
      'settings.colorblind': 'Mode daltonien',
      'settings.colorblindDesc': 'Adapte les couleurs selon le type de daltonisme',
      'settings.colorblindOff': 'Désactivé',
      'settings.protanopia': 'Rouge difficile à voir (protanopie)',
      'settings.deuteranopia': 'Vert difficile à voir (deutéranopie)',
      'settings.tritanopia': 'Bleu difficile à voir (tritanopie)',
      'settings.help': 'Aide',
      'settings.replayTutorial': 'Revoir le tutoriel',
      'settings.replayTutorialDesc': 'Revois les bases du système Leitner et de l\'application.',
      'settings.advanced': 'Avancé',
      'settings.allowBuiltinDeletion': 'Supprimer les decks intégrés',
      'settings.allowBuiltinDeletionDesc': 'Permet de masquer/supprimer les decks fournis par défaut',
      'settings.thisPlayer': 'ce profil',
      'settings.resetPlayerNote': 'Cela supprimera uniquement les données de "{name}", pas celles des autres profils.',
      'exam.nextQuestion': 'Question suivante',
      'exam.imageAlt': 'Illustration de la question',
      'exam.yourAnswer': 'Ta réponse :',
      'exam.correctAnswer': 'Bonne réponse :',
      'exam.resultsTitle': 'Résultats de l\'examen',
      'exam.excellent': 'Excellent !',
      'exam.good': 'Bien !',
      'exam.average': 'Un bon début',
      'exam.poor': 'Encore un peu d\'entraînement',
      'exam.statCorrect': 'Correctes',
      'exam.statWrong': 'Incorrectes',
      'exam.statTime': 'Temps',
      'exam.retry': 'Réessayer',
      'exam.quitConfirm': 'Quitter l\'examen ? Ta progression sera perdue.',
      'nav.main': 'Navigation principale',
      'nav.challenges': 'Défis',
      'nav.dailyChallenges': 'Défis quotidiens',
      'nav.weeklyChallenges': 'Défis hebdomadaires',
      'nav.alphaNotice': 'Version alpha : l\'application est en cours de développement. Certaines fonctions peuvent être incomplètes. Tes retours sont les bienvenus !',
      'nav.pinToggle': 'Épingler ou masquer la barre de navigation',
      'player.unsaved': 'Modifications non sauvegardées',
      'player.levelTitle': 'Niveau {level} : {current}/{needed} XP (points d\'expérience) pour le niveau {next}',
      'game.congratulations': 'Félicitations !',
      'player.levelShort': 'Niv. {level}',
      'player.xpTitle': '{current} XP sur {needed} nécessaires pour le niveau {next}',
      'player.xpProgress': 'Progression vers niveau {next}',
      'player.saveProgress': 'Sauvegarder ma progression',
      'player.importProgress': 'Importer une sauvegarde',
      'player.profile': 'Profil',
      'player.logout': 'Changer de profil',
      'player.defaultName': 'Profil sans nom',
      'player.unknownName': 'Inconnu',
      'player.exportUnavailable': 'Export non disponible',
      'player.nothingToSave': 'Aucune progression à sauvegarder',
      'player.saved': 'Progression sauvegardée !',
      'player.imported': 'Progression importée avec succès !',
      'storage.quotaWarning': 'Ton espace de stockage est presque plein. Exporte tes données et supprime des decks personnalisés volumineux pour libérer de la place.',
      'storage.quotaError': 'Ton espace de stockage est plein : tes dernières modifications ne sont peut-être pas enregistrées. Exporte tes données et supprime des decks personnalisés volumineux.',
      'storage.recovered': 'Tes données ont été restaurées depuis la dernière sauvegarde.',
      'player.importConfirm': 'Importer la progression de "{name}" ?\n\nCette action remplacera ta progression actuelle.',
      'player.logoutConfirm': 'Changer de profil ?\n\n"{name}" est enregistré automatiquement.\n\nTu reviendras à l\'écran de démarrage.',
      'badge.unlockedOn': 'Débloqué le {date}',
      'badge.locked': 'Non débloqué',
      'badge.secret': 'Badge secret',
      'toolbar.darkMode': 'Mode sombre',
      'toolbar.lightMode': 'Mode clair',
      'toolbar.enableDark': 'Activer le mode sombre',
      'toolbar.enableLight': 'Activer le mode clair',
      'toolbar.exitFocus': 'Quitter le mode focus',
      'toolbar.focusTitle': 'Mode focus (plein écran)',
      'toolbar.enableFocus': 'Activer le mode focus',
      'sidebar.title': 'Badges',
      'sidebar.pin': 'Épingler',
      'sidebar.unpin': 'Désépingler',
      'sidebar.pinSidebar': 'Épingler le panneau latéral',
      'sidebar.unpinSidebar': 'Désépingler le panneau latéral',
      'sidebar.close': 'Fermer le panneau latéral',
      'sidebar.count': '{earned} / {total} débloqués',
      'sidebar.empty': 'Aucun badge débloqué',
      'sidebar.seeAll': 'Voir tous les badges',
      'sidebar.cat.achievement': 'Accomplissements',
      'sidebar.cat.mastery': 'Maîtrise',
      'sidebar.cat.streak': 'Séries',
      'sidebar.cat.performance': 'Performance',
      'sidebar.cat.level': 'Niveau',
      'sidebar.cat.subject': 'Matières',
      'sidebar.cat.other': 'Autres',

      // Pluriels : une clé au singulier (One) et une au pluriel (Many), choisies par i18n.tn()
      'merger.selectedCountOne': '{count} deck sélectionné',
      'merger.selectedCountMany': '{count} decks sélectionnés',
      'merger.duplicatesOne': 'doublon détecté',
      'merger.duplicatesMany': 'doublons détectés',
      'exam.pointsInfoOne': 'Cette question vaut {points} point',
      'exam.pointsInfoMany': 'Cette question vaut {points} points',
      'exam.pointsDeltaOne': '{points} point',
      'exam.pointsDeltaMany': '{points} points',

      // Badges : nom, description et indice (badge.<id>.name|description|hint) ; noms à variantes de forme grammaticale
      'badge.first_card.name': 'Premier Pas',
      'badge.first_card.description': 'Jouer sa première carte',
      'badge.first_session.name': 'C\'est Parti !',
      'badge.first_session.description': 'Terminer sa première session',
      'badge.explorer.name': { f: 'Exploratrice', m: 'Explorateur', x: 'Explorateur·ice' },
      'badge.explorer.description': 'Jouer 5 decks différents',
      'badge.veteran.name': { f: 'Vétérane', m: 'Vétéran', x: 'Vétéran·e' },
      'badge.veteran.description': 'Terminer 50 sessions',
      'badge.centurion.name': { f: 'Centurionne', m: 'Centurion', x: 'Centurion·ne' },
      'badge.centurion.description': 'Jouer 1000 cartes',
      'badge.mastery_10.name': { f: 'Apprentie', m: 'Apprenti', x: 'Apprenti·e' },
      'badge.mastery_10.description': 'Maîtriser 10 cartes (boîte verte)',
      'badge.mastery_50.name': { f: 'Étudiante', m: 'Étudiant', x: 'Étudiant·e' },
      'badge.mastery_50.description': 'Maîtriser 50 cartes',
      'badge.mastery_100.name': { f: 'Érudite', m: 'Érudit', x: 'Érudit·e' },
      'badge.mastery_100.description': 'Maîtriser 100 cartes',
      'badge.mastery_500.name': { f: 'Maîtresse', m: 'Maître', x: 'Maître·sse' },
      'badge.mastery_500.description': 'Maîtriser 500 cartes',
      'badge.level_5.name': 'Niveau 5',
      'badge.level_5.description': 'Atteindre le niveau 5',
      'badge.level_10.name': 'Niveau 10',
      'badge.level_10.description': 'Atteindre le niveau 10',
      'badge.level_25.name': 'Niveau 25',
      'badge.level_25.description': 'Atteindre le niveau 25',
      'badge.level_50.name': 'Niveau 50',
      'badge.level_50.description': 'Atteindre le niveau 50',
      'badge.streak_3.name': { f: 'Régulière', m: 'Régulier', x: 'Régulier·ère' },
      'badge.streak_3.description': '3 jours de jeu consécutifs',
      'badge.streak_7.name': { f: 'Assidue', m: 'Assidu', x: 'Assidu·e' },
      'badge.streak_7.description': '7 jours de jeu consécutifs',
      'badge.streak_30.name': { f: 'Dévouée', m: 'Dévoué', x: 'Dévoué·e' },
      'badge.streak_30.description': '30 jours de jeu consécutifs',
      'badge.streak_100.name': 'Légende',
      'badge.streak_100.description': '100 jours de jeu consécutifs',
      'badge.perfect_session.name': 'Session parfaite !',
      'badge.perfect_session.description': '100 % de bonnes réponses en session (au moins 10 cartes)',
      'badge.green_streak_5.name': 'En Feu',
      'badge.green_streak_5.description': '5 cartes vertes consécutives en session',
      'badge.green_streak_10.name': 'Inarrêtable',
      'badge.green_streak_10.description': '10 cartes vertes consécutives en session',
      'badge.green_streak_20.name': 'Machine',
      'badge.green_streak_20.description': '20 cartes vertes consécutives en session',
      'badge.speed_demon.name': 'Speed Demon',
      'badge.speed_demon.description': 'Répondre correctement en moins de 1 seconde',
      'badge.math_beginner.name': { f: 'Matheuse Débutante', m: 'Matheux Débutant', x: 'Matheux·euse Débutant·e' },
      'badge.math_beginner.description': 'Maîtriser 10 cartes de maths',
      'badge.math_expert.name': { f: 'Matheuse Experte', m: 'Matheux Expert', x: 'Matheux·euse Expert·e' },
      'badge.math_expert.description': 'Maîtriser 100 cartes de maths',
      'badge.french_beginner.name': { f: 'Linguiste Débutante', m: 'Linguiste Débutant', x: 'Linguiste Débutant·e' },
      'badge.french_beginner.description': 'Maîtriser 10 cartes de français',
      'badge.french_expert.name': { f: 'Linguiste Experte', m: 'Linguiste Expert', x: 'Linguiste Expert·e' },
      'badge.french_expert.description': 'Maîtriser 100 cartes de français',
      'badge.history_beginner.name': { f: 'Historienne en Herbe', m: 'Historien en Herbe', x: 'Historien·ne en Herbe' },
      'badge.history_beginner.description': 'Maîtriser 10 cartes d\'histoire',
      'badge.science_beginner.name': { f: 'Scientifique Débutante', m: 'Scientifique Débutant', x: 'Scientifique Débutant·e' },
      'badge.science_beginner.description': 'Maîtriser 10 cartes de sciences',
      'badge.early_bird.name': 'Lève-Tôt',
      'badge.early_bird.hint': 'Le calme du petit matin...',
      'badge.comeback_kid.name': 'Bon retour !',
      'badge.comeback_kid.description': 'Reprendre après une pause d\'au moins 30 jours',
      'badge.comeback_kid.hint': 'Une pause n\'empêche pas de reprendre...',
      'badge.perfectionist.name': 'Perfectionniste',
      'badge.perfectionist.description': 'Terminer 10 sessions parfaites (100 %)',
      'badge.perfectionist.hint': 'La perfection est un chemin, pas une destination...',
      'badge.speed_runner.name': 'Speed Runner',
      'badge.speed_runner.description': 'Répondre correctement à 50 cartes en moins de 2 secondes chacune',
      'badge.speed_runner.hint': 'La vitesse est une vertu...',
      'badge.marathon.name': { f: 'Marathonienne', m: 'Marathonien', x: 'Marathonien·ne' },
      'badge.marathon.description': 'Jouer 100 cartes en une seule session',
      'badge.marathon.hint': 'L\'endurance est la clé...',
      'badge.collector.name': { f: 'Collectionneuse', m: 'Collectionneur', x: 'Collectionneur·euse' },
      'badge.collector.description': 'Jouer 20 decks différents',
      'badge.collector.hint': 'La diversité enrichit l\'esprit...',
      'badge.redemption.name': 'Rédemption',
      'badge.redemption.description': 'Maîtriser une carte après 10 erreurs dessus',
      'badge.redemption.hint': 'La persévérance finit souvent par payer...',
      'badge.challenger.name': { f: 'Challengeuse', m: 'Challengeur', x: 'Challengeur·euse' },
      'badge.challenger.description': 'Réussir un défi de niveau Expert',
      'badge.challenger.hint': 'Certains défis demandent de la préparation...',
      'badge.untouchable.name': 'Intouchable',
      'badge.untouchable.description': 'Réussir un défi Sans erreur de 10 cartes ou plus, sans aucune erreur',
      'badge.untouchable.hint': 'La perfection, carte après carte...',
      'badge.weekend_warrior.name': { f: 'Guerrière du Weekend', m: 'Guerrier du Weekend', x: 'Guerrier·ère du Weekend' },
      'badge.weekend_warrior.description': 'Jouer chaque samedi et dimanche pendant 4 semaines',
      'badge.weekend_warrior.hint': 'Le week-end aussi, on peut apprendre...',
      'badge.golden_hour.name': 'L\'Heure Dorée',
      'badge.golden_hour.description': 'Jouer exactement à 12:34',
      'badge.golden_hour.hint': 'Un instant de la journée a quelque chose de très ordonné...',

      // Thèmes : nom, description et condition de déblocage (theme.<id>.name|description|unlock)
      'theme.ocean.name': 'Océan',
      'theme.ocean.description': 'Thème par défaut : bleu profond',
      'theme.forest.name': 'Forêt',
      'theme.forest.description': 'Tons verts apaisants',
      'theme.sunset.name': 'Coucher de soleil',
      'theme.sunset.description': 'Tons oranges chaleureux',
      'theme.sunset.unlock': 'Jouer 7 jours de suite',
      'theme.midnight.name': 'Minuit',
      'theme.midnight.description': 'Violet profond',
      'theme.midnight.unlock': 'Jouer 100 cartes',
      'theme.sakura.name': 'Sakura',
      'theme.sakura.description': 'Rose clair, inspiré des cerisiers en fleurs',
      'theme.sakura.unlock': 'Réussir 90 % des réponses sur 50 cartes',
      'theme.arctic.name': 'Arctique',
      'theme.arctic.description': 'Bleu glacé',
      'theme.arctic.unlock': 'Maîtriser 50 cartes (boîte verte)',
      'theme.neon.name': 'Néon',
      'theme.neon.description': 'Couleurs vives et lumineuses',
      'theme.neon.unlock': 'Réussir 5 défis',
      'theme.gold.name': 'Or',
      'theme.gold.description': 'Thème doré',
      'theme.gold.unlock': 'Atteindre le niveau 20',

      // Tutoriel de premier lancement
      'tutorial.welcome.title': 'Bienvenue dans Train Your Brain !',
      'tutorial.welcome.content': 'Apprends efficacement avec le <strong>système Leitner</strong>, une méthode de répétition espacée étudiée en sciences de l\'apprentissage.',
      'tutorial.leitner.title': 'Le système Leitner',
      'tutorial.leitner.content': 'Chaque <strong>deck</strong> (paquet de cartes) contient des questions. Tes cartes évoluent dans <strong>4 boîtes</strong> selon tes réponses. Plus tu maîtrises une carte, plus elle avance !',
      'tutorial.boxes.title': 'Les 4 boîtes',
      'tutorial.boxes.new': '🆕 <strong>Nouvelles</strong> : jamais jouées',
      'tutorial.boxes.purple': '💜 <strong>Violette</strong> : à revoir souvent',
      'tutorial.boxes.orange': '🧡 <strong>Orange</strong> : en cours d\'apprentissage',
      'tutorial.boxes.green': '💚 <strong>Verte</strong> : maîtrisées, elles reviennent après quelques jours de repos',
      'tutorial.gameplay.title': 'Comment jouer',
      'tutorial.gameplay.content': 'Réponds correctement aux questions. Une réponse <strong>rapide</strong> fait avancer la carte plus vite, mais seule la justesse compte pour apprendre.',
      'tutorial.xp.title': 'XP (points d\'expérience) et niveaux',
      'tutorial.xp.purple': '💜 Réponse incorrecte → <strong>+1 XP</strong>',
      'tutorial.xp.orange': '🧡 Réponse correcte mais lente → <strong>+2 XP</strong>',
      'tutorial.xp.green': '💚 Réponse correcte et rapide → <strong>+3 XP</strong>',
      'tutorial.xp.bonus': '🔥 Bonus de série de cartes vertes → <strong>de +{min} à +{max} XP</strong>',
      'tutorial.badges.title': 'Badges et défis',
      'tutorial.badges.content': 'Débloque <strong>{count} badges</strong> et relève les <strong>défis quotidiens</strong> (jusqu\'à {daily} par jour) pour gagner des XP bonus !',
      'tutorial.navigation.title': 'Navigation',
      'tutorial.navigation.home': '🏠 <strong>Accueil</strong> : tes decks à réviser',
      'tutorial.navigation.explore': '🔍 <strong>Explorer</strong> : découvrir tous les decks',
      'tutorial.navigation.create': '➕ <strong>Créer</strong> : importer ou créer des decks',
      'tutorial.navigation.stats': '📊 <strong>Stats</strong> : ta progression',
      'tutorial.navigation.settings': '⚙️ <strong>Paramètres</strong> : personnalisation',
      'tutorial.ready.title': 'On commence !',
      'tutorial.ready.content': 'Tu sais l\'essentiel. <strong>Bonne révision !</strong>',
      'tutorial.skip': 'Passer',
      'tutorial.close': 'Fermer',
      'tutorial.closeLabel': 'Fermer le tutoriel',
      'tutorial.stepLabel': 'Étape {n}',
      'tutorial.prev': '← Précédent',
      'tutorial.prevLabel': 'Étape précédente',
      'tutorial.next': 'Suivant →',
      'tutorial.start': 'Commencer !',
      'tutorial.started': 'Tutoriel démarré. Étape 1 sur {total}',
      'tutorial.levelUp': 'Niveau ↑',
      'tutorial.explanation.title': 'Comment fonctionne le système Leitner ?',
      'tutorial.explanation.newName': 'Nouvelles',
      'tutorial.explanation.newDesc': 'Cartes jamais jouées',
      'tutorial.explanation.purpleName': 'Violette',
      'tutorial.explanation.purpleDesc': 'À revoir souvent',
      'tutorial.explanation.orangeName': 'Orange',
      'tutorial.explanation.orangeDesc': 'En cours d\'apprentissage',
      'tutorial.explanation.greenName': 'Verte',
      'tutorial.explanation.greenDesc': 'Maîtrisées : elles reviennent après quelques jours de repos',
      'tutorial.explanation.compactNew': 'Nouvelles',
      'tutorial.explanation.compactPurple': 'À revoir',
      'tutorial.explanation.compactOrange': 'En cours',
      'tutorial.explanation.compactGreen': 'Maîtrisées',
      'tutorial.explanation.ruleFast': '<strong>Bonne réponse rapide</strong> → avance vers le vert',
      'tutorial.explanation.ruleSlow': '<strong>Bonne réponse lente</strong> → reste en orange',
      'tutorial.explanation.ruleWrong': '<strong>Réponse incorrecte</strong> → retourne en violet',

      // Textes communs aux pages
      'common.cardsCountOne': '{count} carte',
      'common.cardsCountMany': '{count} cartes',
      'common.wordsCountOne': '{count} mot',
      'common.wordsCountMany': '{count} mots',
      'common.validate': 'Valider',
      'common.add': 'Ajouter',
      'common.deckName': 'Nom du deck',
      'common.optional': 'optionnel',
      'common.copied': 'Copié !',

      // Tableau des decks : tranches d'âge, sources, colonnes
      'deckTable.source.procedural': 'Procédural',
      'deckTable.source.proceduralDesc': 'Généré automatiquement',
      'deckTable.source.ai': 'IA',
      'deckTable.source.aiDesc': 'Généré par intelligence artificielle',
      'deckTable.source.human': 'Humain',
      'deckTable.source.humanDesc': 'Créé par une personne',
      'deckTable.col.deck': 'Deck',
      'deckTable.col.source': 'Source',
      'deckTable.col.cards': 'Cartes',
      'deckTable.col.progress': 'Progression',
      'deckTable.col.available': 'Dispo',
      'deckTable.col.actions': 'Actions',

      // Textes de src/ui/app.js

      // Textes de src/ui/deck-editor/card-binder.js
      'editor.imageTooLarge': 'L\'image est trop volumineuse (500 Ko au maximum).',

      // Textes de src/ui/deck-editor/card-renderer.js
      'cardEditor.hasMedia': 'Contient un média',
      'cardEditor.cardNumber': 'Carte n° {n}',
      'cardEditor.collapse': 'Réduire',
      'cardEditor.type': 'Type',
      'cardEditor.cardType': 'Type de carte',
      'cardEditor.questionPlaceholder': 'Écris la question...',
      'cardEditor.answerPlaceholder': 'Écris la réponse...',
      'cardEditor.alternatives': 'Réponses alternatives (séparées par des virgules)',
      'cardEditor.feedback': 'Explication après la réponse',
      'cardEditor.feedbackPlaceholder': 'Explication affichée après la réponse...',
      'cardEditor.hint': 'Indice (aide avant la réponse)',
      'cardEditor.hintLabel': 'Indice',
      'cardEditor.hintPlaceholder': 'Un indice pour aider...',
      'cardEditor.media': 'Média (image ou audio)',
      'cardEditor.choices': 'Choix de réponse',
      'cardEditor.choicesHintEmpty': 'Ajoute les différents choix, puis coche les bonnes réponses.',
      'cardEditor.addChoice': 'Ajouter un choix',
      'cardEditor.choicesHint': 'Coche les bonnes réponses.',
      'cardEditor.correctChoice': 'Bonne réponse : choix {id}',
      'cardEditor.choiceText': 'Texte du choix {id}',
      'cardEditor.choicePlaceholder': 'Texte du choix...',
      'cardEditor.newCard': 'Nouvelle carte',
      'cardEditor.editCard': 'Modifier la carte n° {n}',
      'cardEditor.saveCard': 'Enregistrer',

      // Textes des cartes de jeu

      // Textes de src/ui/charts.js
      'chart.noData': 'Aucune donnée',
      'chart.donutLabel': 'Graphique en anneau',
      'chart.cards': 'cartes',
      'chart.barLabel': 'Graphique en barres',
      'chart.selectMetric': 'Sélectionne une métrique',
      'chart.insufficientData': 'Données insuffisantes',
      'chart.evolutionLabel': 'Graphique d\'évolution',
      'chart.cardsCountOne': '{count} carte',
      'chart.cardsCountMany': '{count} cartes',
      'chart.heatmapLabel': 'Calendrier d\'activité',
      'chart.less': 'Moins',
      'chart.more': 'Plus',
      'chart.box.new': 'Nouvelles',
      'chart.box.purple': 'Violettes',
      'chart.box.orange': 'Oranges',
      'chart.box.green': 'Vertes',
      'chart.xpCumulative': 'XP cumulé',
      'chart.xpPerDay': 'XP/jour',
      'chart.cardsPerDay': 'Cartes/jour',
      'chart.periodDays': '{n} j',
      'chart.periodMonthsOne': '{count} mois',
      'chart.periodMonthsMany': '{count} mois',
      'chart.periodYear': '1 an',

      // Textes de src/ui/components.js

      // Textes de src/ui/components/deck-table.js
      'deckTable.shown': '{visible}/{total} decks affichés',
      'deckTable.selectAll': 'Tout sélectionner',
      'deckTable.filterSource': 'Filtrer par source :',
      'deckTable.selectionOff': 'Quitter le mode sélection',
      'deckTable.selectionOn': 'Mode sélection par lot',
      'deckTable.selectionActive': 'Sélection activée',
      'deckTable.select': 'Sélectionner',
      'deckTable.selectedOne': '{count} sélectionné',
      'deckTable.selectedMany': '{count} sélectionnés',
      'deckTable.hideSelected': 'Masquer les decks sélectionnés',
      'deckTable.hide': 'Masquer',
      'deckTable.showSelected': 'Afficher les decks sélectionnés',
      'deckTable.show': 'Afficher',
      'deckTable.exportSelected': 'Exporter les decks sélectionnés',
      'deckTable.resetProgress': 'Réinitialiser la progression',
      'deckTable.deleteSelected': 'Supprimer les decks sélectionnés',
      'deckTable.cancelSelection': 'Annuler la sélection',
      'deckTable.sortBy': 'Trier par {label}',
      'deckTable.hasAudio': 'Contient des questions audio',
      'deckTable.examMode': 'Mode examen',
      'deckTable.reviewCards': 'Consulter les cartes',

      // Textes de src/ui/components/deck-table.js
      'deckTable.deleteConfirm': 'Supprimer le deck « {name} » ?\n\nCette action est irréversible.',
      'deckTable.noneSelected': 'Aucun deck sélectionné.',
      'deckTable.hideConfirmOne': 'Masquer {count} deck ?',
      'deckTable.hideConfirmMany': 'Masquer {count} decks ?',
      'deckTable.showConfirmOne': 'Afficher {count} deck ?',
      'deckTable.showConfirmMany': 'Afficher {count} decks ?',
      'deckTable.resetConfirmOne': 'Réinitialiser la progression de {count} deck ?\n\nToutes les cartes reviendront à « jamais jouée ».',
      'deckTable.resetConfirmMany': 'Réinitialiser la progression de {count} decks ?\n\nToutes les cartes reviendront à « jamais jouée ».',
      'deckTable.resetDoneOne': 'Progression réinitialisée pour {count} deck.',
      'deckTable.resetDoneMany': 'Progression réinitialisée pour {count} decks.',
      'deckTable.deleteManyConfirmOne': 'Supprimer {count} deck ?\n\nDeck concerné :\n- {names}\n\nCette action est irréversible.',
      'deckTable.deleteManyConfirmMany': 'Supprimer {count} decks ?\n\nDecks concernés :\n- {names}\n\nCette action est irréversible.',
      'deckTable.exporterMissing': 'Le module d\'export n\'est pas disponible.',
      'deckTable.exportBatch': 'Export de {count} decks en cours...\nLes fichiers seront téléchargés un par un.',

      // Textes de src/ui/prompt-generator/dictation-mode.js
      'dictation.title': 'Générateur de dictée',
      'dictation.description': 'Crée un deck de dictée avec la prononciation audio de <a href="https://lingualibre.org" target="_blank" rel="noopener">Lingua Libre</a> (enregistrements sous licence libre, auteur et licence indiqués pour chaque mot).',
      'dictation.namePlaceholder': 'Ex. : Dictée CE1, mots invariables',
      'gen.wordList': 'Liste des mots (un par ligne)',
      'dictation.wordsPlaceholder': 'bonjour\nmaison\nécole\nfamille\ntoujours\nbeaucoup\n...',
      'dictation.needsInternet': 'Une connexion internet est nécessaire pour télécharger les sons. Le deck généré fonctionnera ensuite hors ligne.',
      'dictation.generate': 'Générer le deck avec audio',
      'gen.status.downloading': 'Téléchargement...',
      'gen.status.ok': 'OK',
      'gen.status.notFound': 'Non trouvé',
      'gen.progress': '{current} / {total} mots',
      'gen.currentWord': 'Mot en cours :',
      'dictation.notFoundOne': '{count} mot non trouvé',
      'dictation.notFoundMany': '{count} mots non trouvés',
      'gen.attributionsOne': 'Auteur et licence de l\'enregistrement',
      'gen.attributionsMany': 'Auteur et licence des {count} enregistrements',
      'gen.attributionsHint': 'Ces mentions sont conservées dans le deck et dans ses exports. Certaines licences exigent de citer l\'auteur quand tu partages le deck.',
      'dictation.newDictation': 'Nouvelle dictée',
      'dictation.deckGenerated': 'Deck généré !',
      'dictation.cardsWithAudio': 'cartes avec audio',
      'dictation.wordsNotFound': 'mots non trouvés',
      'gen.seeErrorsOne': 'Voir l\'erreur',
      'gen.seeErrorsMany': 'Voir les {count} erreurs',
      'gen.deckPreview': 'Aperçu du deck : {name}',
      'gen.exportYaml': 'Exporter en YAML',
      'gen.needOneWord': 'Saisis au moins un mot.',

      // Textes de src/ui/effects.js

      // Textes de src/ui/prompt-generator/form-renderer.js
      'promptGen.step': 'Étape {current}/{total}',
      'promptGen.generate': 'Générer la consigne',
      'promptGen.generated': 'Consigne générée',
      'promptGen.generatedDesc': 'Copie cette consigne et colle-la dans ton assistant IA préféré (ChatGPT, Claude, etc.).',
      'promptGen.newPrompt': 'Nouvelle consigne',
      'promptGen.nextStep': 'Étape suivante',
      'promptGen.nextStepDesc': 'Une fois le YAML généré par l\'IA, colle-le dans l\'éditeur pour le vérifier et l\'importer.',
      'promptGen.openEditor': 'Ouvrir l\'éditeur YAML',
      'promptGen.tipsTitle': 'Conseils d\'utilisation',
      'promptGen.tipModel': '<strong>🤖 Assistant IA récent :</strong> utilise un assistant IA récent pour de meilleurs résultats.',
      'promptGen.tipCheck': '<strong>✅ Vérification :</strong> vérifie toujours le deck généré avant de l\'importer.',
      'promptGen.tipMedia': '<strong>📴 Médias hors ligne :</strong> l\'IA ne peut pas intégrer d\'images. Elle peut suggérer des médias (mediaSuggestion) que tu ajouteras toi-même. Intègre les images directement plutôt que des URL : l\'application fonctionne hors ligne.',
      'promptGen.tipImages': '<strong>🖼️ Images libres de droits :</strong> utilise des images libres de droits (Unsplash, Pixabay, Wikimedia Commons).',
      'promptGen.tipQuestions': '<strong>❓ Questions claires :</strong> une question, une seule réponse possible. Évite les ambiguïtés.',
      'promptGen.tipShort': '<strong>📝 Réponses courtes :</strong> préfère des réponses concises et faciles à taper.',
      'promptGen.tipAlternatives': '<strong>🔤 Alternatives :</strong> pense aux réponses alternatives (synonymes, abréviations).',
      'promptGen.tipFeedback': '<strong>💬 Explication :</strong> une explication après la réponse renforce l\'apprentissage.',
      'promptGen.requiredFields': 'Remplis les champs obligatoires :',
      'promptGen.fieldRequired': '{label} est requis',

      // Textes de src/ui/prompt-generator/multilingual-creator.js
      'pgMulti.title': 'Générateur multilingue',
      'pgMulti.description': 'Crée un deck de vocabulaire avec des traductions automatiques via <a href="https://www.wikidata.org" target="_blank" rel="noopener">Wikidata</a> et l\'audio de <a href="https://lingualibre.org" target="_blank" rel="noopener">Lingua Libre</a> (enregistrements sous licence libre, auteur et licence indiqués pour chaque mot).',
      'pgMulti.namePlaceholder': 'Ex. : Fruits et légumes FR/EN/ES',
      'pgMulti.sourceLang': 'Langue des mots saisis',
      'pgMulti.targetLangs': 'Langues de traduction (choisis-en au moins une)',
      'pgMulti.langsSelectedOne': '{count} langue sélectionnée',
      'pgMulti.langsSelectedMany': '{count} langues sélectionnées',
      'pgMulti.wordsPlaceholder': 'pomme\ncarotte\nfraise\ntomate\norange\n...',
      'pgMulti.needsInternet': 'Une connexion internet est nécessaire pour récupérer les traductions et l\'audio. Le deck généré fonctionnera ensuite hors ligne.',
      'pgMulti.generate': 'Générer les traductions et l\'audio',
      'pgMulti.translating': 'Traduction...',
      'pgMulti.fetchingAudio': 'Récupération de l\'audio...',
      'pgMulti.complete': 'Terminé',
      'pgMulti.audio': 'Audio...',
      'pgMulti.partial': 'Partiel',
      'pgMulti.problemsOne': '{count} problème rencontré',
      'pgMulti.problemsMany': '{count} problèmes rencontrés',
      'pgMulti.newDeck': 'Nouveau deck',
      'pgMulti.deckGenerated': 'Deck multilingue généré !',
      'pgMulti.statWords': 'mots',
      'pgMulti.statLangs': 'langues',
      'pgMulti.statComplete': 'traductions complètes',
      'pgMulti.statAudio': 'avec audio',
      'pgMulti.problemsClickOne': '{count} problème (clique pour le voir)',
      'pgMulti.problemsClickMany': '{count} problèmes (clique pour les voir)',
      'pgMulti.moduleMissing': 'Le module Lingua Libre n\'est pas disponible.',
      'pgMulti.noWords': 'Aucun mot fourni',
      'pgMulti.saveFailed': 'Impossible d\'enregistrer le deck « {name} » (espace de stockage insuffisant ?).',
      'pgMulti.saved': 'Deck « {name} » sauvegardé avec {words} mots en {langs} langues !',

      // Textes de src/ui/page-badges.js
      'badges.secretsCount': '{unlocked} / {total} secrets',
      'badges.cat.secret': 'Secrets',

      // Textes de src/ui/page-deck-editor.js
      'editor.editDeck': 'Modifier le deck',
      'editor.createDeck': 'Créer un deck',
      'editor.swapViews': 'Échanger les vues',
      'editor.swap': 'Échanger',
      'editor.saveDeck': 'Sauvegarder le deck',
      'editor.codePanel': 'Code YAML',
      'editor.format': 'Formater',
      'editor.paste': 'Coller',
      'editor.yamlPlaceholder': 'id: mon-deck\nname: Mon deck\ndescription: Description du deck\ntags:\n  - maths\ncards:\n  - question: Quelle est la capitale de la France ?\n    answer: Paris\n    type: text',
      'editor.visualPanel': 'Édition manuelle',
      'editor.cardShort': 'Carte',
      'editor.tipsTitle': 'Conseils pour créer de bonnes cartes',
      'editor.tipOffline': '<strong>📴 Médias hors ligne :</strong> intègre les images directement (bouton 📷) plutôt que des URL. L\'application fonctionne hors ligne : les liens externes ne seront pas accessibles.',
      'editor.tipFree': '<strong>🖼️ Images libres de droits :</strong> utilise des images libres de droits (Unsplash, Pixabay, Wikimedia Commons) ou tes propres créations.',
      'editor.tipSize': '<strong>📏 Taille des images :</strong> les images sont limitées à 500 Ko. Redimensionne-les si besoin.',
      'editor.tipAlternatives': '<strong>🔤 Alternatives :</strong> ajoute des réponses alternatives acceptées (synonymes, abréviations, variantes d\'orthographe).',
      'editor.tipFeedback': '<strong>💬 Explication :</strong> explique la bonne réponse pour renforcer l\'apprentissage.',
      'editor.tipHints': '<strong>💡 Indices :</strong> propose un indice qui guide sans donner la réponse.',
      'editor.tipTags': '<strong>🏷️ Tags :</strong> classe bien tes decks pour les retrouver facilement.',
      'editor.info': 'Informations',
      'editor.descriptionPlaceholder': 'Description...',
      'editor.image': 'Image',
      'editor.preview': 'Aperçu',
      'editor.changeImage': 'Changer l\'image',
      'editor.addImage': 'Ajouter une image',
      'editor.tags': 'Tags',
      'editor.sequentialDesc': 'Les cartes seront jouées dans l\'ordre défini plutôt qu\'au hasard',
      'editor.sequential': 'Mode séquentiel',
      'editor.similarityDesc': 'Accepte les réponses approchantes (fautes de frappe, accents manquants...)',
      'editor.similarity': 'Réponses approchantes',
      'editor.noCards': 'Aucune carte',
      'editor.noCardsHint': 'Clique sur « + Ajouter une carte » ci-dessous',
      'editor.addCard': 'Ajouter une carte',
      'editor.leaveConfirm': 'Quitter sans sauvegarder ?',
      'editor.questionAnswerRequired': 'Une question et une réponse sont obligatoires.',
      'editor.nothingToSave': 'Aucun deck à sauvegarder.',
      'editor.nameRequired': 'Le nom du deck est obligatoire.',
      'editor.cardRequired': 'Ajoute au moins une carte.',
      'editor.savedOne': 'Deck « {name} » sauvegardé avec {count} carte !',
      'editor.savedMany': 'Deck « {name} » sauvegardé avec {count} cartes !',

      // Textes de src/ui/page-deck-hub.js
      'deckHub.importedCardsOne': 'Deck « {name} » importé avec succès !\n{count} carte ajoutée.',
      'deckHub.importedCardsMany': 'Deck « {name} » importé avec succès !\n{count} cartes ajoutées.',
      'deckHub.importErrorJson': 'Erreur d\'import JSON : {message}',
      'deckHub.importErrorMoodleXml': 'Erreur Moodle XML : {message}',
      'deckHub.deckNamePrompt': 'Nom du deck :',
      'deckHub.importErrorMoodle': 'Erreur d\'import Moodle : {message}',
      'deckHub.trash': 'Corbeille',
      'deckHub.trashCountOne': '{count} deck supprimé',
      'deckHub.trashCountMany': '{count} decks supprimés',
      'deckHub.deletedOn': 'Supprimé le {date}',
      'deckHub.restore': 'Restaurer',
      'deckHub.deleteForever': 'Supprimer définitivement',
      'deckHub.emptyTrash': 'Vider la corbeille',
      'deckHub.restored': 'Deck restauré avec succès !',
      'deckHub.restoreError': 'La restauration du deck a échoué.',
      'deckHub.deleteForeverConfirm': 'Supprimer définitivement ce deck ? Cette action est irréversible.',
      'deckHub.deleteError': 'La suppression a échoué.',
      'deckHub.emptyTrashConfirmOne': 'Vider la corbeille ? {count} deck sera supprimé définitivement.',
      'deckHub.emptyTrashConfirmMany': 'Vider la corbeille ? {count} decks seront supprimés définitivement.',
      'deckHub.trashEmptiedOne': 'Corbeille vidée. {count} deck supprimé.',
      'deckHub.trashEmptiedMany': 'Corbeille vidée. {count} decks supprimés.',
      'deckHub.emptyTrashError': 'Le vidage de la corbeille a échoué.',

      // Textes de src/ui/page-deck-merger.js
      'merger.selectDeck': 'Sélectionner {name}',
      'merger.builtin': 'Fourni',
      'merger.defaultName': 'Deck fusionné',

      // Textes de src/ui/page-deck-resources.js
      'resources.type.image': 'Vue d\'ensemble',
      'resources.type.summary': 'Résumé',
      'resources.type.objective': 'Objectifs',
      'resources.type.tip': 'Astuces',
      'resources.type.glossary': 'Vocabulaire',
      'resources.type.interactive': 'Outils interactifs',
      'resources.type.link': 'Pour aller plus loin',
      'resources.type.video': 'Vidéos',
      'resources.aiTitle': 'Contenu généré par IA',
      'resources.aiNote': 'Ce résumé a été généré automatiquement. Il peut contenir des imprécisions ou des erreurs. Vérifie les informations importantes grâce aux liens Wikipédia fournis.',
      'resources.imageLoading': 'Chargement de l\'image...',
      'resources.imageUnavailable': 'Image non disponible',
      'resources.enlarge': 'Agrandir',
      'resources.interactiveTool': 'Outil interactif',
      'resources.unknownComponent': 'Composant « {name} » non reconnu.',
      'deckReview.notFound': 'Deck introuvable',
      'resources.none': 'Aucune ressource pédagogique disponible pour ce deck.',
      'resources.title': 'Ressources pédagogiques',
      'resources.startReview': 'Commencer la révision',

      // Textes de src/ui/page-deck-review.js
      'deckReview.backToExplore': 'Retour à l\'exploration',
      'deckReview.cardsToReviewOne': '{count} carte à réviser',
      'deckReview.cardsToReviewMany': '{count} cartes à réviser',
      'deckReview.play': 'Jouer',
      'deckReview.answer': 'Réponse',
      'deckReview.acceptedAnswers': 'Réponses acceptées',
      'deckReview.explanation': 'Explication',
      'deckReview.illustration': 'Illustration',
      'deckReview.audioAvailable': 'Audio disponible',
      'deckReview.boxNever': 'Jamais jouée',
      'deckReview.boxPurple': 'À revoir',
      'deckReview.boxOrange': 'En cours',
      'deckReview.boxGreen': 'Maîtrisée',
      'deckReview.noWords': 'Aucun mot dans ce deck',

      // Textes de src/ui/page-multilingual-config.js
      'mlc.mode': 'Mode de jeu',
      'mlc.modeTranslation': 'Traduction',
      'mlc.modeDictation': 'Dictée',
      'mlc.modeImage': 'Image',
      'mlc.languages': 'Langues',
      'mlc.listenIn': 'Écouter en',
      'mlc.from': 'Depuis',
      'mlc.writeIn': 'Écrire en',
      'mlc.to': 'Vers',
      'mlc.bidirectional': 'Mode bidirectionnel',
      'mlc.bidirectionalDesc': 'Le sens change au hasard à chaque carte',
      'mlc.answerLanguage': 'Langue de réponse',
      'mlc.imageNoBidirectional': 'Le mode image n\'a pas de mode bidirectionnel.',
      'mlc.progress': 'Progression',
      'mlc.start': 'Commencer ({cards})',
      'mlc.noImageWords': 'Aucun mot avec image dans ce deck',
      'mlc.chooseDirection': 'Choisis un sens',
      'mlc.total': 'Total',
      'mlc.mastered': 'Maîtrisés',
      'mlc.new': 'Nouveaux',
      'mlc.available': 'Disponibles',

      // Textes de src/ui/page-multilingual-creator.js
      'mlcCreator.intro': 'Explore les thématiques Lingua Libre ou importe tes propres decks multilingues.',
      'mlcCreator.explore': 'Explorer les thématiques Lingua Libre',
      'mlcCreator.exploreDesc': 'Parcours les listes de vocabulaire disponibles sur Lingua Libre :',
      'mlcCreator.sourceLang': 'Langue source :',
      'mlcCreator.load': 'Charger les thématiques',
      'mlcCreator.importTitle': 'Importer un deck',
      'mlcCreator.importDesc': 'Importe un fichier YAML au format multilingue :',
      'mlcCreator.importFile': 'Importer un fichier YAML',
      'mlcCreator.format': 'Format du fichier YAML',
      'mlcCreator.available': 'Decks multilingues disponibles ({count})',
      'mlcCreator.loadingLists': 'Chargement des thématiques...',
      'mlcCreator.fileNote': '<strong>Note :</strong> l\'accès aux services externes peut être bloqué quand l\'application est ouverte depuis un fichier (file://). Pour utiliser cette fonction, ouvre l\'application via un serveur web local.',
      'mlcCreator.clickLoad': 'Clique sur « Charger les thématiques » pour voir les listes disponibles.',
      'mlcCreator.noLists': 'Aucune thématique trouvée pour cette langue.',
      'mlcCreator.preview': 'Prévisualiser les mots',
      'mlcCreator.previewOf': 'Prévisualiser les mots de {name}',
      'mlcCreator.listsFoundOne': '{count} thématique trouvée',
      'mlcCreator.listsFoundMany': '{count} thématiques trouvées',
      'mlcCreator.init': 'Initialisation...',
      'mlcCreator.generating': 'Génération en cours...',
      'mlcCreator.downloading': 'Téléchargement des traductions et des fichiers audio...',
      'mlcCreator.estimation': 'Estimation :',
      'mlcCreator.estimationExact': '{words} mots × {langs} langues ≈ <strong>{size} Mo</strong>',
      'mlcCreator.noSpace': '<strong>Espace insuffisant !</strong> Estimation : {size} Mo, disponible : {available} Mo.<br>Réduis le nombre de langues ou supprime d\'anciens decks.',
      'mlcCreator.closeSpace': 'Ce deck utilisera une grande partie du stockage disponible ({size} Mo / {available} Mo).',
      'mlcCreator.estimationRange': '{langs} langues × 10 à 100 mots ≈ <strong>{min} à {max} Mo</strong>',
      'mlcCreator.estimationHint': '(👁️ Prévisualise les mots pour une estimation précise)',
      'mlcCreator.mayBeLarge': 'Avec {langs} langues, ce deck pourrait être volumineux. Prévisualise les mots pour vérifier.',
      'mlcCreator.otherList': 'Choisir une autre thématique',
      'mlcCreator.targetLangs': 'Langues cibles (traductions) :',
      'mlcCreator.storage': 'Stockage : <strong>{used} Mo</strong> / {total} Mo utilisés ({percent} %)',
      'mlcCreator.shareMode': 'Mode partage',
      'mlcCreator.shareHintOff': 'Usage personnel : tous les audios disponibles seront inclus (CC0, CC BY, CC BY-SA...).',
      'mlcCreator.generate': 'Générer le deck multilingue',
      'mlcCreator.noListsOnline': 'Aucune thématique trouvée. Vérifie ta connexion internet.',
      'mlcCreator.loadError': 'Erreur de chargement : {message}',
      'mlcCreator.noConnection': 'Connexion impossible',
      'mlcCreator.fetchingList': 'Récupération de la liste...',
      'mlcCreator.finishing': 'Finalisation...',
      'mlcCreator.saveFailed': 'Impossible de sauvegarder le deck. Le stockage est peut-être plein. Essaie de supprimer d\'anciens decks ou de réduire le nombre de langues ou de mots.',
      'mlcCreator.created': 'Deck « {name} » créé avec succès !\n{words} mots en {langs} langues.',
      'mlcCreator.generationError': 'Erreur de génération : {message}',
      'mlcCreator.notMultilingual': 'Le fichier doit être un deck multilingue (type: multilingual avec une liste words).',
      'mlcCreator.imported': 'Deck « {name} » importé avec succès !\n{words} mots en {langs} langues.',
      'mlcCreator.loadingWords': 'Chargement des mots...',
      'mlcCreator.noWords': 'Aucun mot trouvé dans cette liste.',

      // Textes de src/ui/page-prompt-generator.js
      'promptGen.subtitle': 'Crée une consigne (prompt) pour générer des cartes avec un assistant IA',
      'promptGen.formErrors': 'Erreurs dans le formulaire :',
      'promptGen.copy': 'Copier la consigne',
      'promptGen.clipboardError': 'Impossible de lire le presse-papiers. Utilise Ctrl+V.',
      'promptGen.correctionCopied': 'Consigne de correction copiée dans le presse-papiers !',
      'promptGen.correctionTitle': 'Consigne de correction :',
      'promptGen.deleteCardConfirm': 'Supprimer cette carte ?',

      // Textes de src/ui/page-stats.js
      'stats.performance': '📊 Performance',
      'stats.accuracy': 'Précision',
      'stats.avgTime': 'Temps moyen',
      'stats.comparison': 'Comparaison',
      'stats.today': 'Aujourd\'hui',
      'stats.prevDay': 'hier',
      'stats.thisWeek': 'Cette semaine',
      'stats.prevWeek': 'la semaine dernière',
      'stats.thisMonth': 'Ce mois',
      'stats.prevMonth': 'le mois dernier',
      'stats.evolution': 'Évolution',
      'stats.charts': 'Graphiques',
      'stats.cardDistribution': 'Répartition des cartes',
      'stats.perDeck': 'Par deck',
      'stats.clickForCards': 'Clique pour voir les cartes',
      'stats.noCardsInDeck': 'Aucune carte dans ce deck',
      'stats.box': 'Boîte',
      'stats.timesPlayed': 'Jouée',
      'stats.restInitial': 'Repos initial : {days} j',
      'stats.restDays': '{days} j',
      'stats.restOver': 'Repos terminé (il durait {days} j)',
      'stats.ready': 'Prête',
      'stats.versus': 'vs {label} : {xp} XP, {cards} cartes',

      // Textes de src/ui/page-utils.js

      // Textes de src/ui/deck-editor/sync-controller.js
      'editor.yamlNeedsCards': 'Le deck doit contenir une liste « cards ».',
      'editor.yamlValidCardsOne': '{count} carte valide',
      'editor.yamlValidCardsMany': '{count} cartes valides',
      'editor.yamlValid': 'YAML valide',

      // Textes de src/ui/components/tag-selector.js
      'tagSelector.remove': 'Retirer le tag {label}',
      'tagSelector.none': 'Aucun tag sélectionné',
      'tagSelector.noResult': 'Aucun résultat',

      // Textes de src/ui/prompt-generator/yaml-editor-logic.js
      'yamlEditor.replaceConfirm': 'Un deck avec l\'identifiant « {id} » existe déjà. Veux-tu le remplacer ?',
      'yamlEditor.importedOne': 'Deck « {name} » importé avec succès ! ({count} carte)',
      'yamlEditor.importedMany': 'Deck « {name} » importé avec succès ! ({count} cartes)',

      // Textes de src/ui/prompt-generator/yaml-editor-logic.js
      'yamlLogic.empty': 'Le contenu YAML est vide.',
      'yamlLogic.invalid': 'L\'analyse du YAML a donné un résultat invalide.',
      'yamlLogic.needIdOrName': 'Le deck doit avoir un « id » ou un « name ».',
      'yamlLogic.foundKeys': '(clés trouvées : {keys})',
      'yamlLogic.noKeys': '(aucune clé trouvée)',
      'yamlLogic.needCards': 'Le deck doit contenir une liste « cards ».',
      'yamlLogic.needOneCard': 'Le deck doit contenir au moins une carte.',
      'yamlLogic.parseError': 'Erreur d\'analyse du YAML : {message}',
      'yamlLogic.validatorMissing': 'Le module de validation des decks n\'est pas disponible.',
      'yamlLogic.missingField': 'Carte {n} : champ « {field} » manquant',

      // Textes de src/ui/prompt-generator/yaml-editor-renderer.js
      'yamlEditor.title': 'Éditeur de deck',
      'yamlEditor.subtitle': 'Importe et modifie le deck généré par l\'IA',
      'yamlEditor.backToPrompt': 'Retour à la consigne',
      'yamlEditor.validate': 'Valider le YAML',
      'yamlEditor.import': 'Importer le deck',
      'yamlEditor.pasteFromClipboard': 'Coller depuis le presse-papiers',
      'yamlEditor.clear': 'Effacer',
      'yamlEditor.placeholder': 'Colle ici le YAML généré par l\'IA...\n\nExemple de format attendu :\nid: mon-deck\nname: Mon deck\ndescription: Description du deck\ncategory:\n  - categorie1\n  - categorie2\ndifficulty: 1\ncards:\n  - id: card_1\n    question: Question 1 ?\n    answer: Réponse 1\n    type: text\n  - id: card_2\n    question: Question 2 ?\n    answer: Réponse 2\n    type: text',
      'yamlEditor.previewHint': 'L\'aperçu du deck apparaîtra ici une fois le YAML validé.',
      'yamlEditor.noDeck': 'Aucun deck chargé',
      'yamlEditor.noDeckHint': 'Passe en mode code pour coller ton YAML, puis valide-le pour le modifier avec les formulaires.',
      'yamlEditor.switchToCode': 'Passer en mode code',
      'yamlEditor.deckInfo': 'Informations du deck',
      'yamlEditor.descriptionPlaceholder': 'Description du deck...',
      'yamlEditor.difficulty': 'Difficulté',
      'yamlEditor.unspecified': 'Non précisée',
      'yamlEditor.diff1': 'Facile',
      'yamlEditor.diff2': 'Moyen',
      'yamlEditor.diff3': 'Difficile',
      'yamlEditor.diff4': 'Expert',
      'yamlEditor.noCards': 'Aucune carte. Clique sur « Ajouter » pour créer une carte.',
      'yamlEditor.errorsToFix': 'Erreurs à corriger',
      'yamlEditor.warnings': 'Avertissements',
      'yamlEditor.excellent': 'Excellente qualité',
      'yamlEditor.qualityScore': 'Score de qualité',
      'yamlEditor.moveUp': 'Monter',
      'yamlEditor.moveDown': 'Descendre',
      'yamlEditor.suggestions': 'Suggestions d\'amélioration :',
      'yamlEditor.textDefault': 'Texte (par défaut)',
      'yamlEditor.textDefaultHelp': 'Pas besoin d\'indiquer « Texte » : c\'est le type par défaut.',
      'yamlEditor.answerHint': '(1 à 3 mots recommandés)',
      'yamlEditor.expectedAnswer': 'Réponse attendue',
      'yamlEditor.alternatives': 'Alternatives',
      'yamlEditor.alternativesHint': '(synonymes, abréviations : une par ligne)',
      'yamlEditor.alternativesPlaceholder': 'Écris les réponses alternatives acceptées, une par ligne...&#10;Ex. : ONU&#10;Nations unies&#10;UN',
      'yamlEditor.alternativesHelp': 'Important pour les cartes texte : synonymes, abréviations, variantes d\'orthographe',
      'yamlEditor.hintPlaceholder': 'Un indice pour aider sans donner la réponse...',
      'yamlEditor.feedbackPlaceholder': 'Explication affichée après la réponse pour renforcer l\'apprentissage...',
      'yamlEditor.feedbackHelp': 'Explique le « pourquoi », pas seulement la réponse',
      'yamlEditor.unnamed': 'Sans nom',
      'yamlEditor.noDescription': 'Aucune description',
      'yamlEditor.difficultyLevel': 'Difficulté {level}',
      'yamlEditor.cardsPreview': 'Aperçu des cartes ({shown} sur {total})',
      'yamlEditor.qShort': 'Q :',
      'yamlEditor.aShort': 'R :',
      'yamlEditor.moreCards': '... et {count} autres cartes',
      'yamlEditor.history': 'Historique des corrections ({count} itérations)',
      'yamlEditor.improvement': 'Amélioration de {points} points',
      'yamlEditor.regression': 'Baisse de {points} points',
      'yamlEditor.report': 'Rapport de qualité',
      'yamlEditor.averageScore': 'Score moyen ({grade})',
      'yamlEditor.correctionHint': 'Générer une consigne pour corriger les problèmes',
      'yamlEditor.correctionPrompt': 'Consigne de correction',
      'yamlEditor.validCards': 'Cartes valides',
      'yamlEditor.errors': 'Erreurs',
      'yamlEditor.toCheck': 'À vérifier',
      'yamlEditor.deckProblems': 'Problèmes du deck :',
      'yamlEditor.duplicates': 'Doublons détectés :',
      'yamlEditor.similar': '{percent} % de similarité',
      'yamlEditor.bloom': 'Répartition cognitive (Bloom) :',
      'yamlEditor.readability': 'Lisibilité :',
      'yamlEditor.grade': 'Niveau {grade}',




      'gen.more': '+{count} autres...',

      'mlcCreator.noWordsInList': 'Aucun mot trouvé dans cette thématique',

      'gen.moreWords': '+{count} autres mots...',
      'pgMulti.noneProcessed': 'Aucun mot n\'a pu être traité',


      // Réglage de la forme grammaticale (visible en français seulement)
      'settings.grammaticalForm': 'Accord des textes',
      'settings.grammaticalFormDesc': 'Choisis comment les textes parlent de toi.',
      'settings.formFeminine': 'Féminin (par défaut)',
      'settings.formMasculine': 'Masculin',
      'settings.formInclusive': 'Point médian',
      'settings.formExample': 'Exemple : {example}',


      'cardEditor.changeMedia': 'Changer',
      'cardEditor.addMedia': 'Ajouter un média',


      'gen.status.searching': 'Recherche...',


      'badge.retention_20.name': 'Mémoire d\'une semaine',
      'badge.retention_20.description': '20 cartes dont le repos atteint 7 jours',
      'badge.durable_75.name': 'Mémoire durable',
      'badge.durable_75.description': '75 cartes dont le repos atteint 14 jours',
      'badge.durable_200.name': 'Mémoire d\'éléphant',
      'badge.durable_200.description': '200 cartes dont le repos atteint 14 jours',
      'badge.night_owl.name': 'Chouette du Soir',
      'badge.night_owl.description': 'Jouer en soirée, entre 18h et 21h',
      'badge.night_owl.hint': 'Quand le jour baisse...',
      'badge.early_bird.description': 'Jouer entre 6h et 8h du matin'
    },

    // ═══════════════════════════════════════════════════════════════
    // ANGLAIS
    // ═══════════════════════════════════════════════════════════════
    en: {
      // General
      'app.name': 'Train Your Brain',
      'app.loading': 'Loading...',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.close': 'Close',
      'common.back': 'Back',
      'common.next': 'Next',
      'common.import': 'Import',
      'common.export': 'Export',
      'common.or': 'or',

      // Hidden decks
      'explore.hiddenDecks': 'Hidden decks',

      // Navigation
      'nav.home': 'Home',
      'nav.explore': 'Explore',
      'nav.create': 'Create',
      'nav.stats': 'Stats',
      'nav.settings': 'Settings',

      // Tools Page
      'tools.title': 'Interactive Tools',

      // Accessibility (skip links)
      'a11y.skipToContent': 'Skip to main content',
      'a11y.skipToNav': 'Skip to navigation',

      // Splash Page
      'splash.title': 'Train Your Brain',
      'splash.subtitle': 'Learn effectively with spaced repetition',
      'splash.start': 'Start',
      'splash.newPlayer': 'New profile',
      'splash.yourName': 'What name would you like to use?',
      'splash.enterName': 'A first name or nickname is enough',
      'splash.chooseProfile': 'Choose a profile',
      'splash.level': 'Level',
      'splash.importSave': 'Import a save',
      'splash.nameRequired': 'Please enter a name',

      // Home Page
      'home.decksToReview': 'Decks to review',
      'home.noCardsToday': 'No cards to review today!',
      'home.viewAllDecks': 'View all decks',
      'home.decksResting': 'Resting decks',

      // Explore Page
      'explore.title': 'Explore',
      'explore.search': 'Search a deck...',
      'explore.filterBy': 'Filtered by',
      'explore.noResults': 'No decks found',

      // Deck Hub Page
      'deckHub.title': 'Create & Manage',
      'deckHub.subtitle': 'Create, import and manage your flashcard decks',
      'deckHub.createManual': 'Create manually',
      'deckHub.createManualDesc': 'Create a deck card by card with the visual editor',
      'deckHub.generateAI': 'Generate with AI',
      'deckHub.generateAIDesc': 'Create a ready-to-paste prompt for an AI assistant such as ChatGPT or Claude',
      'deckHub.pasteYAML': 'Paste YAML',
      'deckHub.pasteYAMLDesc': 'Import a deck by pasting YAML content',
      'deckHub.importFile': 'Import a file',
      'deckHub.importFileDesc': 'JSON, YAML or Moodle XML',
      'deckHub.dictation': 'Audio dictation',
      'deckHub.dictationDesc': 'Create a dictation deck with audio from Lingua Libre',
      'deckHub.multilingual': 'Multilingual vocabulary',
      'deckHub.multilingualDesc': 'Create a thematic vocabulary deck in multiple languages',
      'deckHub.deckHubCloud': 'DeckHub',
      'deckHub.deckHubCloudDesc': 'Browse, download and share decks with the community',
      'deckHub.comingSoon': 'Coming soon',
      'deckHub.mergeDeck': 'Merge decks',
      'deckHub.mergeDeckDesc': 'Combine multiple existing decks into a single new deck',

      // Deck Merger Page
      'merger.title': 'Merge decks',
      'merger.subtitle': 'Select decks to merge then configure the new deck',
      'merger.selectDecks': 'Select decks',
      'merger.noDecksSelected': 'No decks selected',
      'merger.configuration': 'New deck configuration',
      'merger.newDeckName': 'New deck name',
      'merger.newDeckNamePlaceholder': 'E.g.: My merged deck',
      'merger.newDeckDescription': 'Description',
      'merger.newDeckDescriptionPlaceholder': 'Merged deck description...',
      'merger.options': 'Options',
      'merger.removeDuplicates': 'Remove duplicates',
      'merger.removeDuplicatesDesc': 'Removes cards with the same question',
      'merger.shuffleCards': 'Shuffle cards',
      'merger.shuffleCardsDesc': 'Randomly shuffle the order of cards',
      'merger.keepProgress': 'Keep progress',
      'merger.keepProgressDesc': 'Keep card statistics (box, latency threshold...)',
      'merger.preview': 'Preview',
      'merger.totalCards': 'Total: {count} cards',
      'merger.merge': 'Merge',
      'merger.cancel': 'Cancel',
      'merger.success': 'Deck "{name}" created successfully!',
      'merger.error': 'Error during merge',
      'merger.minDecks': 'Select at least 2 decks',

      // Deck Editor
      'editor.title': 'Deck Editor',

      // Card Types
      'cardType.text': 'Text',
      'cardType.numeric': 'Numeric',
      'cardType.mcq': 'Multiple choice',
      'cardType.truefalse': 'True/False',
      'cardType.cloze': 'Fill in the blank',
      'cardType.matching': 'Matching',

      // Game Page
      'game.title': 'Study session',
      'game.quitConfirm': 'Do you really want to quit this session?',
      'game.validate': 'Submit',
      'game.iDontKnow': 'I don\'t know',
      'game.continue': 'Continue',
      'game.correct': 'Correct!',
      'game.incorrect': 'Incorrect',
      'game.yourAnswer': 'Your answer',
      'game.sessionComplete': 'Session complete!',
      'game.accuracy': 'Accuracy',
      'game.backHome': 'Back to home',
      'game.levelUp': 'Level Up!',
      'game.badgeUnlocked': 'Badge unlocked!',
      'game.badgesUnlockedMany': '{count} new badges!',
      'validation.emptyInput': 'Please enter an answer',
      'game.enterNumber': 'Enter a number...',
      'game.yourResponse': 'Your answer...',
      'game.true': 'True',
      'game.false': 'False',
      'game.choose': 'Choose',
      'game.match': 'Match',
      'game.answer': 'Correct answer:',
      'game.pile.heart': 'Heart',
      'game.pile.club': 'Club',
      'game.pile.spade': 'Spade',
      'game.pile.draw': 'Draw',
      'game.feedback.purpleTitle': 'No worries!',
      'game.feedback.purpleSubtitle': 'We learn from mistakes. The card will come back soon so you can try again.',
      'game.feedback.orangeTitle': 'Well done!',
      'game.feedback.orangeSubtitle': 'Good answer! You are making progress.',
      'game.feedback.greenTitle': 'Excellent!',
      'game.feedback.greenSubtitle': 'A correct, quick answer: card mastered!',
      'game.feedback.correct': 'Correct answer',
      'game.feedback.incorrect': 'Incorrect answer.',
      'game.feedback.correctAnswer': 'Correct answer:',
      'game.loading': 'Loading...',

      // Multilingual mode
      'game.multilingual.writeWord': 'Write the corresponding word',
      'game.multilingual.listen': 'Listen',
      'game.multilingual.playAudio': 'Play audio',
      'game.multilingual.writeHeard': 'Write what you hear',
      'game.multilingual.translateHeard': 'Translate what you hear to',
      'game.multilingual.yourAnswer': 'Your answer...',

      // Audio Choice (ear training)
      'game.audioChoice.listenNote': 'Listen to the note',
      'game.audioChoice.listenInterval': 'Listen to the interval',
      'game.audioChoice.listenChord': 'Listen to the chord',
      'game.audioChoice.hint': 'Click to replay the sound',

      // Stats Page
      'stats.title': 'Statistics',
      'stats.level': 'Level',
      'stats.cardsPlayed': 'Cards played',
      'stats.sessions': 'Sessions',
      'stats.badges': 'Badges',
      'stats.progression': 'Progress',
      'stats.currentStreak': 'Current streak',
      'stats.record': 'Record',
      'stats.mastery': 'Mastery',
      'stats.greenCards': 'Green cards (mastered)',

      // Settings Page
      'settings.title': 'Settings',
      'settings.language': 'Language',
      'settings.data': 'Data',
      'settings.reset': 'Reset',
      'settings.resetConfirm': 'Do you really want to reset all your data?',
      'settings.about': 'About',
      'settings.version': 'Version',
      'settings.aboutTitle': 'Why Train Your Brain?',
      'settings.aboutLeitner': 'Learn smarter',
      'settings.aboutLeitnerDesc': 'Based on the Leitner spaced-repetition system: hard cards come back often, mastered cards less often.',
      'settings.aboutAI': 'AI serving your brain',
      'settings.aboutAIDesc': 'Instead of letting AI think for us, let\'s use it to create quality educational content and train our own intelligence.',
      'settings.aboutShare': 'Share knowledge',
      'settings.aboutShareDesc': 'Create, share and discover decks. Knowledge only has value when it\'s shared.',
      'settings.aboutOffline': '100% offline',
      'settings.aboutOfflineDesc': 'Your data stays on your device. No account, no tracking, no distractions. Just you and your learning.',
      'settings.aboutOpenSource': 'Open Source',
      'settings.aboutOpenSourceDesc': 'Open and transparent source code. Contribute, improve, adapt to your needs.',
      'settings.aboutContribute': 'Suggest a feature',
      'settings.aboutContributeDesc': 'Have an idea? Submit it on GitHub (pull request or issue). This project is made for you!',
      'settings.contact': 'Report an issue',

      // Leitner Boxes
      'box.neverPlayed': 'Never played',
      'box.purple': 'Purple',
      'box.orange': 'Orange',
      'box.green': 'Green',

      // Exam Page
      'exam.title': 'Exam',

      // Session Summary Page
      'sessionSummary.title': 'Session Summary',

      // Badges Page
      'badges.title': 'Badges',

      // Challenges Page
      'challenges.title': 'Challenges',
      'challenges.modeDefi': 'Challenge Mode',
      'challenge.quitConfirm': 'Quit the challenge? Cards you have already confirmed are saved.',
      'challenge.practiceRight': 'Correct. In free practice, nothing is saved.',
      'challenge.practiceWrong': 'No worries: in free practice, nothing is saved.',
      'challenge.title': 'Challenge',
      'challenge.barLabel': 'Challenge in progress',
      'challenge.mode.steady': 'Steady run',
      'challenge.mode.perfect': 'Clean run',
      'challenge.mode.speed': 'Against the clock',
      'challenge.mode.endurance': 'All the way',
      'challenge.modeDesc.steady': 'Answer a few cards that are due and aim for a share of correct answers. No timer.',
      'challenge.modeDesc.perfect': 'Aim for a run of correct answers in a row: see how far you get. No timer.',
      'challenge.modeDesc.speed': 'One time budget for the whole challenge, counted during questions only. Get enough correct answers before it runs out.',
      'challenge.modeDesc.endurance': 'Every card to review in the deck, in one go. Keep your success level up to the last card.',
      'challenge.diff.easy': 'Light',
      'challenge.diff.medium': 'Medium',
      'challenge.diff.hard': 'Focused',
      'challenge.diff.expert': 'Expert',
      'challenge.goal.steady': 'Goal: {percent}% correct answers',
      'challenge.goal.perfect': 'Goal: {run} correct answers in a row',
      'challenge.goal.speed': 'Goal: {correct} correct answers before time runs out',
      'challenge.goal.endurance': 'Goal: {percent}% correct answers on each half, to the last card',
      'challenge.levelLine.steady': '{count} cards, {percent}% correct answers',
      'challenge.levelLine.perfect': '{count} cards, a run of {run}',
      'challenge.levelLine.speed': '{count} cards, {correct} correct answers in {time}',
      'challenge.levelLine.endurance': 'All {count} cards to review, {percent}% on each half',
      'challenge.progress.steady': 'Correct: {correct} of {answered}',
      'challenge.progress.perfect': 'Best run: {run}',
      'challenge.cardsCount': '{count} cards',
      'challenge.timerLabel': 'Time left',
      'challenge.practiceBanner': 'Free practice: your cards do not change.',
      'challenge.quitPracticeConfirm': 'Quit free practice?',
      'challenge.deckAction': 'Challenge',
      'challenge.entry.title': 'Start a challenge',
      'challenge.entry.intro': 'Another way to do your reviews: same cards, same rules, one more goal.',
      'challenge.entry.deckLabel': 'Deck',
      'challenge.entry.deckOption': '{name} ({count} to review)',
      'challenge.entry.choose': 'Choose a challenge',
      'challenge.entry.empty': 'Start a deck to be able to take a challenge.',
      'challenge.entry.explore': 'Explore decks',
      'challenge.entry.recordsTitle': 'Your best scores',
      'challenge.entry.recordLine': '{mode}, {level}: {score}',
      'challengeSetup.title': 'Choose a challenge',
      'challengeSetup.intro': 'A challenge is another way to do your reviews: your cards progress as usual.',
      'challengeSetup.dueCount': 'Cards to review: {count}',
      'challengeSetup.modeLegend': 'Mode',
      'challengeSetup.levelLegend': 'Level',
      'challengeSetup.levelNeeds': 'Needs {count} cards to review',
      'challengeSetup.speedHelp': 'The time only runs during questions. When it reaches zero the challenge simply stops and nothing is counted as wrong: cards you did not reach are still to review.',
      'challengeSetup.enduranceHelp': 'Nothing more than your normal session: the same cards, none that are resting. You can stop whenever you like; confirmed cards are kept.',
      'challengeSetup.record': 'Your record: {score}',
      'challengeSetup.start': 'Start the challenge',
      'challengeSetup.bonusNote': 'A completed challenge gives {xp} bonus XP, once a day. Most XP comes from the cards.',
      'challengeSetup.few': 'There are few cards to review in this deck (cards to review: {count}). A challenge needs at least {min}: play them in a normal session.',
      'challengeSetup.playNormal': 'Review in a normal session',
      'challengeSetup.nothing': 'Nothing to review in this deck right now: your cards are resting.',
      'challengeSetup.practiceTitle': 'Free practice',
      'challengeSetup.practiceNote': 'Go over resting cards just for fun. Nothing is saved: no box, no rest, no XP.',
      'challengeSetup.practiceCount': 'Resting cards: {count}',
      'challengeSetup.practiceStart': 'Start practicing',
      'challengeSetup.back': 'Back to challenges',
      'challengeResults.success': 'Challenge complete!',
      'challengeResults.wellDone': 'Well done!',
      'challengeResults.again': 'Not this time',
      'challengeResults.againHint': 'What you learned counts: your cards moved on. You can try again later.',
      'challengeResults.timeUp': 'Time is up. Cards you did not reach are still to review.',
      'challengeResults.practiceTitle': 'Practice done',
      'challengeResults.practiceCount': '{correct} correct answers out of {answered}',
      'challengeResults.practiceNote': 'Nothing changed for your cards: boxes, rest and XP are untouched.',
      'challengeResults.statCorrect': 'Correct',
      'challengeResults.halves': 'First half: {first} of {firstTotal}, second half: {second} of {secondTotal}',
      'challengeResults.statBestRun': 'Best run',
      'challengeResults.statScore': 'Score',
      'challengeResults.record': 'New personal record!',
      'challengeResults.bestScore': 'Your record: {score}',
      'challengeResults.bonus': '+{xp} bonus XP',
      'challengeResults.bonusDone': 'Today\'s bonus is already taken: one per day.',
      'challengeResults.another': 'Choose another challenge',
      'challengeResults.back': 'Back to challenges',

      // Prompt Generator Page
      'promptGenerator.title': 'AI Deck Generator',

      // Multilingual Pages
      'multilingual.config': 'Multilingual Configuration',
      'multilingual.creator': 'Multilingual creation',

      // "Come back tomorrow" message
      'home.comeBackTomorrow': 'All your cards are resting!',
      'home.comeBackIn': 'Next review in',
      'home.days': 'days',
      'home.day': 'day',
      'home.hours': 'hours',
      'home.hour': 'hour',

      // ─── Additions: main flows (profile, game, summary, settings, exam, challenge, navigation) ───
      'game.question': 'Question',
      'common.quit': 'Quit',
      'common.error': 'Error',
      'common.seeResults': 'See results',
      'common.importError': 'Import error: {message}',
      'common.invalidFile': 'Invalid file format',
      'app.pageLoadError': 'The page could not be loaded.',
      'game.streakLabel': 'Streak: {count} green cards in a row',
      'game.cardImageAlt': 'Card illustration',
      'media.remoteWarning': 'Remote media not loaded automatically: opening it contacts "{host}" and tells it your IP address.',
      'media.openRemoteImage': 'Open the remote image',
      'media.openRemoteAudio': 'Open the remote sound',
      'media.remoteImagePlaceholder': 'Remote image not loaded',
      'deckEditor.notFound': 'This deck does not exist or is no longer available.',
      'deckEditor.cardIncomplete': 'Card {n} is incomplete: a question and an answer are required.',
      'dictation.noCardTitle': 'No card generated',
      'dictation.noCardMessage': 'No recording was found for these words, so there is nothing to save. Check the spelling or try other words.',
      'multilingual.shareHintOn': 'Only freely licensed recordings will be included. The author and licence are listed for each word: keep these credits if you share this deck (the CC BY licence, for example, requires crediting the author).',
      'stats.boxDistribution': 'Cards per box:',
      'deckTable.progressLabel': '{progress}% mastered',
      'a11y.navHome': 'Navigating to home',
      'a11y.navSettings': 'Navigating to settings',
      'a11y.dialogClosed': 'Dialog closed',
      'game.imageToIdentifyAlt': 'Image to identify',
      'game.noCardsDirection': 'No cards to play in this direction. All cards are resting.',
      'game.feedback.purple2Title': 'Almost!',
      'game.feedback.purple2Subtitle': 'Every mistake is a chance to learn. Keep going!',
      'game.feedback.purple3Title': 'No worries!',
      'game.feedback.purple3Subtitle': 'That\'s how progress is made. Keep going!',
      'game.feedback.purple4Title': 'Let\'s keep going!',
      'game.feedback.purple4Subtitle': 'What matters is to keep going. This card will come back soon.',
      'game.rightAnswerLabel': 'Correct answer:',
      'game.blankLabel': 'Answer {n}',
      'game.leitner.purple.title': 'Purple box - To review',
      'game.leitner.purple.tooltip': 'Cards you haven\'t mastered yet. They will come back often to help you remember them.',
      'game.leitner.orange.title': 'Orange box - In progress',
      'game.leitner.orange.tooltip': 'Cards you are getting the hang of. A faster answer will move them forward.',
      'game.leitner.green.title': 'Green box - Mastered',
      'game.leitner.green.tooltip': 'Mastered cards! They will come back after a rest period.',
      'home.waitingSuggestion': 'In the meantime, explore new decks or check your statistics!',
      'splash.importInvalid': 'Invalid file: no profile found',
      'splash.importSuccess': 'Profile "{name}" imported successfully!',
      'summary.cards': 'Cards',
      'summary.newBadges': 'New badges!',
      'summary.challengesCompleted': 'Challenges completed!',
      'summary.learningTitle': 'What this session changed',
      'summary.toGreen': 'Moved to the green box: {count}',
      'summary.toReview': 'To review: {count}',
      'summary.nothingBeforeTomorrow': 'Nothing to review before tomorrow, well done!',
      'summary.nothingBeforeDate': 'Nothing to review before {date}, well done!',
      'summary.nothingToday': 'Nothing to review today, well done!',
      'summary.questsCompleted': 'Weekly quests completed!',
      'missions.title': 'Missions',
      'missions.loading': 'Loading...',
      'missions.tabDaily': 'Daily',
      'missions.tabWeekly': 'Weekly',
      'missions.completedCount': '{done}/{total} completed',
      'missions.xpEarned': '+{xp} XP earned',
      'missions.done': 'Done!',
      'missions.dailyHint': 'Challenges renew every day at midnight',
      'missions.weeklyHint': 'Quests renew every Monday',
      'missions.restDay': 'Nothing to review today, so no challenge today. Come back when cards are due.',
      'missions.progress.review_due': '{progress}/{target} cards',
      'missions.progress.accuracy': '{progress}% / {target}%',
      'missions.progress.accuracyWait': '{played}/{minCards} cards played',
      'missions.progress.green_streak': '{progress}/{target} green cards in a row',
      'missions.daily.review_due': 'Review {count} cards today',
      'missions.daily.review_due_one': 'Review one card today',
      'missions.daily.accuracy': 'Get {percent}% correct answers over the day (from {count} cards)',
      'missions.daily.accuracy_one': 'Get {percent}% correct answers over the day (from {count} card)',
      'missions.daily.green_streak': 'Chain {count} green cards in a row',
      'missions.daily.green_streak_one': 'Move a card to green',
      'missions.weekly.weekly_xp': 'Earn {count} XP by reviewing this week',
      'missions.weekly.weekly_mastery': 'Move {count} cards to the green box',
      'missions.weekly.weekly_mastery_one': 'Move a card to the green box',
      'missions.weekly.weekly_streak': 'Review on {count} days this week',
      'missions.weekly.weekly_challenges': 'Complete {count} challenges this week (one a day at most)',
      'missions.weekly.weekly_decks': 'Review in {count} different decks',
      'missions.weekly.weekly_decks_one': 'Review in a deck',
      'summary.replay': 'Play again ({count})',
      'settings.languageAuto': 'Automatic (browser language)',
      'settings.audio': 'Audio',
      'settings.soundEnabled': 'Sound enabled',
      'settings.themes': 'Themes',
      'settings.themesDesc': 'Customize the look of the app. Unlock new themes as you progress!',
      'settings.themesUnavailable': 'Themes unavailable',
      'settings.accessibility': 'Accessibility',
      'settings.dyslexia': 'Dyslexia mode',
      'settings.dyslexiaDesc': 'Dyslexia-friendly font and wider spacing',
      'settings.highContrast': 'High contrast',
      'settings.highContrastDesc': 'Increases the contrast of text and borders',
      'settings.largeSpacing': 'Large spacing',
      'settings.largeSpacingDesc': 'Increases text size and spacing',
      'settings.colorblind': 'Color blind mode',
      'settings.colorblindDesc': 'Adapts the colors to the type of color blindness',
      'settings.colorblindOff': 'Off',
      'settings.protanopia': 'Red hard to see (protanopia)',
      'settings.deuteranopia': 'Green hard to see (deuteranopia)',
      'settings.tritanopia': 'Blue hard to see (tritanopia)',
      'settings.help': 'Help',
      'settings.replayTutorial': 'Replay the tutorial',
      'settings.replayTutorialDesc': 'Go over the basics of the Leitner system and the app again.',
      'settings.advanced': 'Advanced',
      'settings.allowBuiltinDeletion': 'Delete built-in decks',
      'settings.allowBuiltinDeletionDesc': 'Lets you hide or delete the decks that come with the app',
      'settings.thisPlayer': 'this profile',
      'settings.resetPlayerNote': 'This will only delete the data of "{name}", not that of other profiles.',
      'exam.nextQuestion': 'Next question',
      'exam.imageAlt': 'Question illustration',
      'exam.yourAnswer': 'Your answer:',
      'exam.correctAnswer': 'Correct answer:',
      'exam.resultsTitle': 'Exam results',
      'exam.excellent': 'Excellent!',
      'exam.good': 'Good!',
      'exam.average': 'A good start',
      'exam.poor': 'A little more practice will help',
      'exam.statCorrect': 'Correct',
      'exam.statWrong': 'Incorrect',
      'exam.statTime': 'Time',
      'exam.retry': 'Try again',
      'exam.quitConfirm': 'Quit the exam? Your progress will be lost.',
      'nav.main': 'Main navigation',
      'nav.challenges': 'Challenges',
      'nav.dailyChallenges': 'Daily challenges',
      'nav.weeklyChallenges': 'Weekly challenges',
      'nav.alphaNotice': 'Alpha version: the app is still being developed. Some features may be incomplete. Your feedback is welcome!',
      'nav.pinToggle': 'Pin or hide the navigation bar',
      'player.unsaved': 'Unsaved changes',
      'player.levelTitle': 'Level {level}: {current}/{needed} XP (experience points) to reach level {next}',
      'game.congratulations': 'Congratulations!',
      'player.levelShort': 'Lvl {level}',
      'player.xpTitle': '{current} of {needed} XP needed for level {next}',
      'player.xpProgress': 'Progress to level {next}',
      'player.saveProgress': 'Save my progress',
      'player.importProgress': 'Import a backup',
      'player.profile': 'Profile',
      'player.logout': 'Switch profile',
      'player.defaultName': 'Unnamed profile',
      'player.unknownName': 'Unknown',
      'player.exportUnavailable': 'Export unavailable',
      'player.nothingToSave': 'No progress to save',
      'player.saved': 'Progress saved!',
      'player.imported': 'Progress imported successfully!',
      'storage.quotaWarning': 'Your storage space is almost full. Export your data and delete large custom decks to free up space.',
      'storage.quotaError': 'Your storage space is full: your latest changes may not be saved. Export your data and delete large custom decks.',
      'storage.recovered': 'Your data was restored from the last backup.',
      'player.importConfirm': 'Import the progress of "{name}"?\n\nThis will replace your current progress.',
      'player.logoutConfirm': 'Switch profile?\n\n"{name}" is saved automatically.\n\nYou will return to the start screen.',
      'badge.unlockedOn': 'Unlocked on {date}',
      'badge.locked': 'Not unlocked',
      'badge.secret': 'Secret badge',
      'toolbar.darkMode': 'Dark mode',
      'toolbar.lightMode': 'Light mode',
      'toolbar.enableDark': 'Switch to dark mode',
      'toolbar.enableLight': 'Switch to light mode',
      'toolbar.exitFocus': 'Exit focus mode',
      'toolbar.focusTitle': 'Focus mode (full screen)',
      'toolbar.enableFocus': 'Enable focus mode',
      'sidebar.title': 'Badges',
      'sidebar.pin': 'Pin',
      'sidebar.unpin': 'Unpin',
      'sidebar.pinSidebar': 'Pin the sidebar',
      'sidebar.unpinSidebar': 'Unpin the sidebar',
      'sidebar.close': 'Close the sidebar',
      'sidebar.count': '{earned} / {total} unlocked',
      'sidebar.empty': 'No badges unlocked',
      'sidebar.seeAll': 'See all badges',
      'sidebar.cat.achievement': 'Achievements',
      'sidebar.cat.mastery': 'Mastery',
      'sidebar.cat.streak': 'Streaks',
      'sidebar.cat.performance': 'Performance',
      'sidebar.cat.level': 'Level',
      'sidebar.cat.subject': 'Subjects',
      'sidebar.cat.other': 'Other',

      // Pluriels : une clé au singulier (One) et une au pluriel (Many), choisies par i18n.tn()
      'merger.selectedCountOne': '{count} deck selected',
      'merger.selectedCountMany': '{count} decks selected',
      'merger.duplicatesOne': 'duplicate found',
      'merger.duplicatesMany': 'duplicates found',
      'exam.pointsInfoOne': 'This question is worth {points} point',
      'exam.pointsInfoMany': 'This question is worth {points} points',
      'exam.pointsDeltaOne': '{points} point',
      'exam.pointsDeltaMany': '{points} points',

      // Badges : nom, description et indice (badge.<id>.name|description|hint) ; noms à variantes de forme grammaticale
      'badge.first_card.name': 'First Step',
      'badge.first_card.description': 'Play your first card',
      'badge.first_session.name': 'Let\'s Go!',
      'badge.first_session.description': 'Finish your first session',
      'badge.explorer.name': 'Explorer',
      'badge.explorer.description': 'Play 5 different decks',
      'badge.veteran.name': 'Veteran',
      'badge.veteran.description': 'Finish 50 sessions',
      'badge.centurion.name': 'Centurion',
      'badge.centurion.description': 'Play 1,000 cards',
      'badge.mastery_10.name': 'Apprentice',
      'badge.mastery_10.description': 'Master 10 cards (green box)',
      'badge.mastery_50.name': 'Student',
      'badge.mastery_50.description': 'Master 50 cards',
      'badge.mastery_100.name': 'Scholar',
      'badge.mastery_100.description': 'Master 100 cards',
      'badge.mastery_500.name': 'Master',
      'badge.mastery_500.description': 'Master 500 cards',
      'badge.level_5.name': 'Level 5',
      'badge.level_5.description': 'Reach level 5',
      'badge.level_10.name': 'Level 10',
      'badge.level_10.description': 'Reach level 10',
      'badge.level_25.name': 'Level 25',
      'badge.level_25.description': 'Reach level 25',
      'badge.level_50.name': 'Level 50',
      'badge.level_50.description': 'Reach level 50',
      'badge.streak_3.name': 'Regular',
      'badge.streak_3.description': '3 days of play in a row',
      'badge.streak_7.name': 'Dedicated',
      'badge.streak_7.description': '7 days of play in a row',
      'badge.streak_30.name': 'Devoted',
      'badge.streak_30.description': '30 days of play in a row',
      'badge.streak_100.name': 'Legend',
      'badge.streak_100.description': '100 days of play in a row',
      'badge.perfect_session.name': 'Perfect!',
      'badge.perfect_session.description': '100% correct answers in a session (at least 10 cards)',
      'badge.green_streak_5.name': 'On Fire',
      'badge.green_streak_5.description': '5 green cards in a row in a session',
      'badge.green_streak_10.name': 'Unstoppable',
      'badge.green_streak_10.description': '10 green cards in a row in a session',
      'badge.green_streak_20.name': 'Machine',
      'badge.green_streak_20.description': '20 green cards in a row in a session',
      'badge.speed_demon.name': 'Speed Demon',
      'badge.speed_demon.description': 'Answer correctly in under 1 second',
      'badge.math_beginner.name': 'Maths Beginner',
      'badge.math_beginner.description': 'Master 10 maths cards',
      'badge.math_expert.name': 'Maths Expert',
      'badge.math_expert.description': 'Master 100 maths cards',
      'badge.french_beginner.name': 'Linguist Beginner',
      'badge.french_beginner.description': 'Master 10 French cards',
      'badge.french_expert.name': 'Linguist Expert',
      'badge.french_expert.description': 'Master 100 French cards',
      'badge.history_beginner.name': 'Budding Historian',
      'badge.history_beginner.description': 'Master 10 history cards',
      'badge.science_beginner.name': 'Science Beginner',
      'badge.science_beginner.description': 'Master 10 science cards',
      'badge.early_bird.name': 'Early Bird',
      'badge.early_bird.hint': 'The quiet of early morning...',
      'badge.comeback_kid.name': 'Welcome back!',
      'badge.comeback_kid.description': 'Come back after a break of at least 30 days',
      'badge.comeback_kid.hint': 'A break does not stop you from coming back...',
      'badge.perfectionist.name': 'Perfectionist',
      'badge.perfectionist.description': 'Finish 10 perfect sessions (100%)',
      'badge.perfectionist.hint': 'Perfection is a journey, not a destination...',
      'badge.speed_runner.name': 'Speed Runner',
      'badge.speed_runner.description': 'Answer 50 cards correctly in under 2 seconds each',
      'badge.speed_runner.hint': 'Speed is a virtue...',
      'badge.marathon.name': 'Marathoner',
      'badge.marathon.description': 'Play 100 cards in a single session',
      'badge.marathon.hint': 'Endurance is the key...',
      'badge.collector.name': 'Collector',
      'badge.collector.description': 'Play 20 different decks',
      'badge.collector.hint': 'Variety enriches the mind...',
      'badge.redemption.name': 'Redemption',
      'badge.redemption.description': 'Master a card after getting it wrong 10 times',
      'badge.redemption.hint': 'Perseverance often pays off...',
      'badge.challenger.name': 'Challenger',
      'badge.challenger.description': 'Complete a challenge at Expert level',
      'badge.challenger.hint': 'Some challenges take preparation...',
      'badge.untouchable.name': 'Untouchable',
      'badge.untouchable.description': 'Complete a Clean run challenge of 10 cards or more with no mistake',
      'badge.untouchable.hint': 'Perfection, one card after another...',
      'badge.weekend_warrior.name': 'Weekend Warrior',
      'badge.weekend_warrior.description': 'Play every Saturday and Sunday for 4 weeks',
      'badge.weekend_warrior.hint': 'Weekends are for learning too...',
      'badge.golden_hour.name': 'The Golden Hour',
      'badge.golden_hour.description': 'Play at exactly 12:34',
      'badge.golden_hour.hint': 'One moment of the day looks very orderly...',

      // Thèmes : nom, description et condition de déblocage (theme.<id>.name|description|unlock)
      'theme.ocean.name': 'Ocean',
      'theme.ocean.description': 'Default theme: deep blue',
      'theme.forest.name': 'Forest',
      'theme.forest.description': 'Soothing green tones',
      'theme.sunset.name': 'Sunset',
      'theme.sunset.description': 'Warm orange tones',
      'theme.sunset.unlock': 'Play 7 days in a row',
      'theme.midnight.name': 'Midnight',
      'theme.midnight.description': 'Deep purple',
      'theme.midnight.unlock': 'Play 100 cards',
      'theme.sakura.name': 'Sakura',
      'theme.sakura.description': 'Light pink inspired by cherry blossoms',
      'theme.sakura.unlock': 'Get 90% of answers right over 50 cards',
      'theme.arctic.name': 'Arctic',
      'theme.arctic.description': 'Icy blue',
      'theme.arctic.unlock': 'Master 50 cards (green box)',
      'theme.neon.name': 'Neon',
      'theme.neon.description': 'Bright, glowing colors',
      'theme.neon.unlock': 'Complete 5 challenges',
      'theme.gold.name': 'Gold',
      'theme.gold.description': 'Golden theme',
      'theme.gold.unlock': 'Reach level 20',

      // Tutoriel de premier lancement
      'tutorial.welcome.title': 'Welcome to Train Your Brain!',
      'tutorial.welcome.content': 'Learn effectively with the <strong>Leitner system</strong>, a spaced-repetition method studied in learning science.',
      'tutorial.leitner.title': 'The Leitner system',
      'tutorial.leitner.content': 'Each <strong>deck</strong> (a pack of cards) holds questions. Your cards move through <strong>4 boxes</strong> depending on your answers. The better you know a card, the further it moves!',
      'tutorial.boxes.title': 'The 4 boxes',
      'tutorial.boxes.new': '🆕 <strong>New</strong>: never played',
      'tutorial.boxes.purple': '💜 <strong>Purple</strong>: to review often',
      'tutorial.boxes.orange': '🧡 <strong>Orange</strong>: being learned',
      'tutorial.boxes.green': '💚 <strong>Green</strong>: mastered, they come back after a few days of rest',
      'tutorial.gameplay.title': 'How to play',
      'tutorial.gameplay.content': 'Answer the questions correctly. A <strong>quick</strong> answer moves the card forward faster, but only being right matters for learning.',
      'tutorial.xp.title': 'XP (experience points) and levels',
      'tutorial.xp.purple': '💜 Incorrect answer → <strong>+1 XP</strong>',
      'tutorial.xp.orange': '🧡 Correct but slow answer → <strong>+2 XP</strong>',
      'tutorial.xp.green': '💚 Correct and quick answer → <strong>+3 XP</strong>',
      'tutorial.xp.bonus': '🔥 Green-card streak bonus → <strong>from +{min} to +{max} XP</strong>',
      'tutorial.badges.title': 'Badges and challenges',
      'tutorial.badges.content': 'Unlock <strong>{count} badges</strong> and take on the <strong>daily challenges</strong> (up to {daily} per day) to earn bonus XP!',
      'tutorial.navigation.title': 'Navigation',
      'tutorial.navigation.home': '🏠 <strong>Home</strong>: your decks to review',
      'tutorial.navigation.explore': '🔍 <strong>Explore</strong>: discover all the decks',
      'tutorial.navigation.create': '➕ <strong>Create</strong>: import or create decks',
      'tutorial.navigation.stats': '📊 <strong>Stats</strong>: your progress',
      'tutorial.navigation.settings': '⚙️ <strong>Settings</strong>: customization',
      'tutorial.ready.title': 'Let\'s begin!',
      'tutorial.ready.content': 'You know the essentials. <strong>Happy studying!</strong>',
      'tutorial.skip': 'Skip',
      'tutorial.close': 'Close',
      'tutorial.closeLabel': 'Close the tutorial',
      'tutorial.stepLabel': 'Step {n}',
      'tutorial.prev': '← Previous',
      'tutorial.prevLabel': 'Previous step',
      'tutorial.next': 'Next →',
      'tutorial.start': 'Get started!',
      'tutorial.started': 'Tutorial started. Step 1 of {total}',
      'tutorial.levelUp': 'Level ↑',
      'tutorial.explanation.title': 'How does the Leitner system work?',
      'tutorial.explanation.newName': 'New',
      'tutorial.explanation.newDesc': 'Cards never played',
      'tutorial.explanation.purpleName': 'Purple',
      'tutorial.explanation.purpleDesc': 'To review often',
      'tutorial.explanation.orangeName': 'Orange',
      'tutorial.explanation.orangeDesc': 'Being learned',
      'tutorial.explanation.greenName': 'Green',
      'tutorial.explanation.greenDesc': 'Mastered: they come back after a few days of rest',
      'tutorial.explanation.compactNew': 'New',
      'tutorial.explanation.compactPurple': 'To review',
      'tutorial.explanation.compactOrange': 'In progress',
      'tutorial.explanation.compactGreen': 'Mastered',
      'tutorial.explanation.ruleFast': '<strong>Correct, quick answer</strong> → moves toward green',
      'tutorial.explanation.ruleSlow': '<strong>Correct, slow answer</strong> → stays in orange',
      'tutorial.explanation.ruleWrong': '<strong>Incorrect answer</strong> → goes back to purple',

      // Textes communs aux pages
      'common.cardsCountOne': '{count} card',
      'common.cardsCountMany': '{count} cards',
      'common.wordsCountOne': '{count} word',
      'common.wordsCountMany': '{count} words',
      'common.validate': 'Validate',
      'common.add': 'Add',
      'common.deckName': 'Deck name',
      'common.optional': 'optional',
      'common.copied': 'Copied!',

      // Tableau des decks : tranches d'âge, sources, colonnes
      'deckTable.source.procedural': 'Procedural',
      'deckTable.source.proceduralDesc': 'Generated automatically',
      'deckTable.source.ai': 'AI',
      'deckTable.source.aiDesc': 'Generated by artificial intelligence',
      'deckTable.source.human': 'Human',
      'deckTable.source.humanDesc': 'Created by a person',
      'deckTable.col.deck': 'Deck',
      'deckTable.col.source': 'Source',
      'deckTable.col.cards': 'Cards',
      'deckTable.col.progress': 'Progress',
      'deckTable.col.available': 'Available',
      'deckTable.col.actions': 'Actions',

      // Textes de src/ui/app.js

      // Textes de src/ui/deck-editor/card-binder.js
      'editor.imageTooLarge': 'The image is too large (500 KB maximum).',

      // Textes de src/ui/deck-editor/card-renderer.js
      'cardEditor.hasMedia': 'Contains media',
      'cardEditor.cardNumber': 'Card #{n}',
      'cardEditor.collapse': 'Collapse',
      'cardEditor.type': 'Type',
      'cardEditor.cardType': 'Card type',
      'cardEditor.questionPlaceholder': 'Write the question...',
      'cardEditor.answerPlaceholder': 'Write the answer...',
      'cardEditor.alternatives': 'Alternative answers (separated by commas)',
      'cardEditor.feedback': 'Explanation shown after the answer',
      'cardEditor.feedbackPlaceholder': 'Explanation shown after the answer...',
      'cardEditor.hint': 'Hint (help before answering)',
      'cardEditor.hintLabel': 'Hint',
      'cardEditor.hintPlaceholder': 'A hint to help...',
      'cardEditor.media': 'Media (image or audio)',
      'cardEditor.choices': 'Answer choices',
      'cardEditor.choicesHintEmpty': 'Add the different choices, then tick the correct answers.',
      'cardEditor.addChoice': 'Add a choice',
      'cardEditor.choicesHint': 'Tick the correct answers.',
      'cardEditor.correctChoice': 'Correct answer: choice {id}',
      'cardEditor.choiceText': 'Text of choice {id}',
      'cardEditor.choicePlaceholder': 'Choice text...',
      'cardEditor.newCard': 'New card',
      'cardEditor.editCard': 'Edit card #{n}',
      'cardEditor.saveCard': 'Save',

      // Textes des cartes de jeu

      // Textes de src/ui/charts.js
      'chart.noData': 'No data',
      'chart.donutLabel': 'Donut chart',
      'chart.cards': 'cards',
      'chart.barLabel': 'Bar chart',
      'chart.selectMetric': 'Select a metric',
      'chart.insufficientData': 'Not enough data',
      'chart.evolutionLabel': 'Progress chart',
      'chart.cardsCountOne': '{count} card',
      'chart.cardsCountMany': '{count} cards',
      'chart.heatmapLabel': 'Activity calendar',
      'chart.less': 'Less',
      'chart.more': 'More',
      'chart.box.new': 'New',
      'chart.box.purple': 'Purple',
      'chart.box.orange': 'Orange',
      'chart.box.green': 'Green',
      'chart.xpCumulative': 'Cumulative XP',
      'chart.xpPerDay': 'XP/day',
      'chart.cardsPerDay': 'Cards/day',
      'chart.periodDays': '{n} d',
      'chart.periodMonthsOne': '{count} month',
      'chart.periodMonthsMany': '{count} months',
      'chart.periodYear': '1 year',

      // Textes de src/ui/components.js

      // Textes de src/ui/components/deck-table.js
      'deckTable.shown': '{visible}/{total} decks shown',
      'deckTable.selectAll': 'Select all',
      'deckTable.filterSource': 'Filter by source:',
      'deckTable.selectionOff': 'Leave selection mode',
      'deckTable.selectionOn': 'Batch selection mode',
      'deckTable.selectionActive': 'Selection on',
      'deckTable.select': 'Select',
      'deckTable.selectedOne': '{count} selected',
      'deckTable.selectedMany': '{count} selected',
      'deckTable.hideSelected': 'Hide the selected decks',
      'deckTable.hide': 'Hide',
      'deckTable.showSelected': 'Show the selected decks',
      'deckTable.show': 'Show',
      'deckTable.exportSelected': 'Export the selected decks',
      'deckTable.resetProgress': 'Reset progress',
      'deckTable.deleteSelected': 'Delete the selected decks',
      'deckTable.cancelSelection': 'Cancel the selection',
      'deckTable.sortBy': 'Sort by {label}',
      'deckTable.hasAudio': 'Contains audio questions',
      'deckTable.examMode': 'Exam mode',
      'deckTable.reviewCards': 'Browse the cards',

      // Textes de src/ui/components/deck-table.js
      'deckTable.deleteConfirm': 'Delete the deck "{name}"?\n\nThis cannot be undone.',
      'deckTable.noneSelected': 'No deck selected.',
      'deckTable.hideConfirmOne': 'Hide {count} deck?',
      'deckTable.hideConfirmMany': 'Hide {count} decks?',
      'deckTable.showConfirmOne': 'Show {count} deck?',
      'deckTable.showConfirmMany': 'Show {count} decks?',
      'deckTable.resetConfirmOne': 'Reset the progress of {count} deck?\n\nAll cards will go back to "never played".',
      'deckTable.resetConfirmMany': 'Reset the progress of {count} decks?\n\nAll cards will go back to "never played".',
      'deckTable.resetDoneOne': 'Progress reset for {count} deck.',
      'deckTable.resetDoneMany': 'Progress reset for {count} decks.',
      'deckTable.deleteManyConfirmOne': 'Delete {count} deck?\n\nDeck concerned:\n- {names}\n\nThis cannot be undone.',
      'deckTable.deleteManyConfirmMany': 'Delete {count} decks?\n\nDecks concerned:\n- {names}\n\nThis cannot be undone.',
      'deckTable.exporterMissing': 'The export module is not available.',
      'deckTable.exportBatch': 'Exporting {count} decks...\nThe files will be downloaded one by one.',

      // Textes de src/ui/prompt-generator/dictation-mode.js
      'dictation.title': 'Dictation generator',
      'dictation.description': 'Create a dictation deck with audio pronunciation from <a href="https://lingualibre.org" target="_blank" rel="noopener">Lingua Libre</a> (freely licensed recordings, author and licence shown for each word).',
      'dictation.namePlaceholder': 'E.g.: CE1 dictation, invariable words',
      'gen.wordList': 'Word list (one per line)',
      'dictation.wordsPlaceholder': 'hello\nhouse\nschool\nfamily\nalways\na lot\n...',
      'dictation.needsInternet': 'An internet connection is needed to download the sounds. The generated deck will then work offline.',
      'dictation.generate': 'Generate the deck with audio',
      'gen.status.downloading': 'Downloading...',
      'gen.status.ok': 'OK',
      'gen.status.notFound': 'Not found',
      'gen.progress': '{current} / {total} words',
      'gen.currentWord': 'Current word:',
      'dictation.notFoundOne': '{count} word not found',
      'dictation.notFoundMany': '{count} words not found',
      'gen.attributionsOne': 'Author and licence of the recording',
      'gen.attributionsMany': 'Author and licence of the {count} recordings',
      'gen.attributionsHint': 'These credits are kept in the deck and in its exports. Some licences require crediting the author when you share the deck.',
      'dictation.newDictation': 'New dictation',
      'dictation.deckGenerated': 'Deck generated!',
      'dictation.cardsWithAudio': 'cards with audio',
      'dictation.wordsNotFound': 'words not found',
      'gen.seeErrorsOne': 'See the error',
      'gen.seeErrorsMany': 'See the {count} errors',
      'gen.deckPreview': 'Deck preview: {name}',
      'gen.exportYaml': 'Export as YAML',
      'gen.needOneWord': 'Enter at least one word.',

      // Textes de src/ui/effects.js

      // Textes de src/ui/prompt-generator/form-renderer.js
      'promptGen.step': 'Step {current}/{total}',
      'promptGen.generate': 'Generate the prompt',
      'promptGen.generated': 'Prompt generated',
      'promptGen.generatedDesc': 'Copy this prompt and paste it into your favorite AI assistant (ChatGPT, Claude, etc.).',
      'promptGen.newPrompt': 'New prompt',
      'promptGen.nextStep': 'Next step',
      'promptGen.nextStepDesc': 'Once the AI has generated the YAML, paste it into the editor to check and import it.',
      'promptGen.openEditor': 'Open the YAML editor',
      'promptGen.tipsTitle': 'Usage tips',
      'promptGen.tipModel': '<strong>🤖 Recent AI assistant:</strong> use a recent AI assistant for better results.',
      'promptGen.tipCheck': '<strong>✅ Check:</strong> always check the generated deck before importing it.',
      'promptGen.tipMedia': '<strong>📴 Offline media:</strong> the AI cannot embed images. It can suggest media (mediaSuggestion) that you add yourself. Embed images directly rather than using URLs: the app works offline.',
      'promptGen.tipImages': '<strong>🖼️ Free-to-use images:</strong> use royalty-free images (Unsplash, Pixabay, Wikimedia Commons).',
      'promptGen.tipQuestions': '<strong>❓ Clear questions:</strong> one question, one possible answer. Avoid ambiguity.',
      'promptGen.tipShort': '<strong>📝 Short answers:</strong> prefer concise answers that are easy to type.',
      'promptGen.tipAlternatives': '<strong>🔤 Alternatives:</strong> think of alternative answers (synonyms, abbreviations).',
      'promptGen.tipFeedback': '<strong>💬 Explanation:</strong> an explanation after the answer strengthens learning.',
      'promptGen.requiredFields': 'Fill in the required fields:',
      'promptGen.fieldRequired': '{label} is required',

      // Textes de src/ui/prompt-generator/multilingual-creator.js
      'pgMulti.title': 'Multilingual generator',
      'pgMulti.description': 'Create a vocabulary deck with automatic translations from <a href="https://www.wikidata.org" target="_blank" rel="noopener">Wikidata</a> and audio from <a href="https://lingualibre.org" target="_blank" rel="noopener">Lingua Libre</a> (freely licensed recordings, author and licence shown for each word).',
      'pgMulti.namePlaceholder': 'E.g.: Fruits and vegetables FR/EN/ES',
      'pgMulti.sourceLang': 'Language of the words you enter',
      'pgMulti.targetLangs': 'Translation languages (choose at least one)',
      'pgMulti.langsSelectedOne': '{count} language selected',
      'pgMulti.langsSelectedMany': '{count} languages selected',
      'pgMulti.wordsPlaceholder': 'apple\ncarrot\nstrawberry\ntomato\norange\n...',
      'pgMulti.needsInternet': 'An internet connection is needed to fetch translations and audio. The generated deck will then work offline.',
      'pgMulti.generate': 'Generate translations and audio',
      'pgMulti.translating': 'Translating...',
      'pgMulti.fetchingAudio': 'Fetching audio...',
      'pgMulti.complete': 'Done',
      'pgMulti.audio': 'Audio...',
      'pgMulti.partial': 'Partial',
      'pgMulti.problemsOne': '{count} problem encountered',
      'pgMulti.problemsMany': '{count} problems encountered',
      'pgMulti.newDeck': 'New deck',
      'pgMulti.deckGenerated': 'Multilingual deck generated!',
      'pgMulti.statWords': 'words',
      'pgMulti.statLangs': 'languages',
      'pgMulti.statComplete': 'complete translations',
      'pgMulti.statAudio': 'with audio',
      'pgMulti.problemsClickOne': '{count} problem (click to see it)',
      'pgMulti.problemsClickMany': '{count} problems (click to see them)',
      'pgMulti.moduleMissing': 'The Lingua Libre module is not available.',
      'pgMulti.noWords': 'No word provided',
      'pgMulti.saveFailed': 'Could not save the deck "{name}" (not enough storage?).',
      'pgMulti.saved': 'Deck "{name}" saved with {words} words in {langs} languages!',

      // Textes de src/ui/page-badges.js
      'badges.secretsCount': '{unlocked} / {total} secrets',
      'badges.cat.secret': 'Secrets',

      // Textes de src/ui/page-deck-editor.js
      'editor.editDeck': 'Edit deck',
      'editor.createDeck': 'Create a deck',
      'editor.swapViews': 'Swap the views',
      'editor.swap': 'Swap',
      'editor.saveDeck': 'Save the deck',
      'editor.codePanel': 'YAML code',
      'editor.format': 'Format',
      'editor.paste': 'Paste',
      'editor.yamlPlaceholder': 'id: my-deck\nname: My deck\ndescription: Deck description\ntags:\n  - maths\ncards:\n  - question: What is the capital of France?\n    answer: Paris\n    type: text',
      'editor.visualPanel': 'Manual editing',
      'editor.cardShort': 'Card',
      'editor.tipsTitle': 'Tips for making good cards',
      'editor.tipOffline': '<strong>📴 Offline media:</strong> embed images directly (📷 button) rather than using URLs. The app works offline, so external links will not be reachable.',
      'editor.tipFree': '<strong>🖼️ Free-to-use images:</strong> use royalty-free images (Unsplash, Pixabay, Wikimedia Commons) or your own creations.',
      'editor.tipSize': '<strong>📏 Image size:</strong> images are limited to 500 KB. Resize them if needed.',
      'editor.tipAlternatives': '<strong>🔤 Alternatives:</strong> add accepted alternative answers (synonyms, abbreviations, spelling variants).',
      'editor.tipFeedback': '<strong>💬 Explanation:</strong> explain the correct answer to strengthen learning.',
      'editor.tipHints': '<strong>💡 Hints:</strong> offer a hint that guides without giving the answer away.',
      'editor.tipTags': '<strong>🏷️ Tags:</strong> categorize your decks well so you can find them easily.',
      'editor.info': 'Information',
      'editor.descriptionPlaceholder': 'Description...',
      'editor.image': 'Image',
      'editor.preview': 'Preview',
      'editor.changeImage': 'Change the image',
      'editor.addImage': 'Add an image',
      'editor.tags': 'Tags',
      'editor.sequentialDesc': 'Cards will be played in the defined order rather than at random',
      'editor.sequential': 'Sequential mode',
      'editor.similarityDesc': 'Accepts approximate answers (typos, missing accents...)',
      'editor.similarity': 'Approximate answers',
      'editor.noCards': 'No cards',
      'editor.noCardsHint': 'Click "+ Add a card" below',
      'editor.addCard': 'Add a card',
      'editor.leaveConfirm': 'Leave without saving?',
      'editor.questionAnswerRequired': 'A question and an answer are required.',
      'editor.nothingToSave': 'No deck to save.',
      'editor.nameRequired': 'The deck name is required.',
      'editor.cardRequired': 'Add at least one card.',
      'editor.savedOne': 'Deck "{name}" saved with {count} card!',
      'editor.savedMany': 'Deck "{name}" saved with {count} cards!',

      // Textes de src/ui/page-deck-hub.js
      'deckHub.importedCardsOne': 'Deck "{name}" imported successfully!\n{count} card added.',
      'deckHub.importedCardsMany': 'Deck "{name}" imported successfully!\n{count} cards added.',
      'deckHub.importErrorJson': 'JSON import error: {message}',
      'deckHub.importErrorMoodleXml': 'Moodle XML error: {message}',
      'deckHub.deckNamePrompt': 'Deck name:',
      'deckHub.importErrorMoodle': 'Moodle import error: {message}',
      'deckHub.trash': 'Trash',
      'deckHub.trashCountOne': '{count} deck deleted',
      'deckHub.trashCountMany': '{count} decks deleted',
      'deckHub.deletedOn': 'Deleted on {date}',
      'deckHub.restore': 'Restore',
      'deckHub.deleteForever': 'Delete permanently',
      'deckHub.emptyTrash': 'Empty the trash',
      'deckHub.restored': 'Deck restored successfully!',
      'deckHub.restoreError': 'The deck could not be restored.',
      'deckHub.deleteForeverConfirm': 'Permanently delete this deck? This cannot be undone.',
      'deckHub.deleteError': 'The deletion failed.',
      'deckHub.emptyTrashConfirmOne': 'Empty the trash? {count} deck will be permanently deleted.',
      'deckHub.emptyTrashConfirmMany': 'Empty the trash? {count} decks will be permanently deleted.',
      'deckHub.trashEmptiedOne': 'Trash emptied. {count} deck deleted.',
      'deckHub.trashEmptiedMany': 'Trash emptied. {count} decks deleted.',
      'deckHub.emptyTrashError': 'The trash could not be emptied.',

      // Textes de src/ui/page-deck-merger.js
      'merger.selectDeck': 'Select {name}',
      'merger.builtin': 'Built-in',
      'merger.defaultName': 'Merged deck',

      // Textes de src/ui/page-deck-resources.js
      'resources.type.image': 'Overview',
      'resources.type.summary': 'Summary',
      'resources.type.objective': 'Objectives',
      'resources.type.tip': 'Tips',
      'resources.type.glossary': 'Vocabulary',
      'resources.type.interactive': 'Interactive tools',
      'resources.type.link': 'Going further',
      'resources.type.video': 'Videos',
      'resources.aiTitle': 'AI-generated content',
      'resources.aiNote': 'This summary was generated automatically. It may contain inaccuracies or errors. Check important information using the Wikipedia links provided.',
      'resources.imageLoading': 'Loading the image...',
      'resources.imageUnavailable': 'Image not available',
      'resources.enlarge': 'Enlarge',
      'resources.interactiveTool': 'Interactive tool',
      'resources.unknownComponent': 'Component "{name}" not recognized.',
      'deckReview.notFound': 'Deck not found',
      'resources.none': 'No educational resources available for this deck.',
      'resources.title': 'Educational resources',
      'resources.startReview': 'Start reviewing',

      // Textes de src/ui/page-deck-review.js
      'deckReview.backToExplore': 'Back to Explore',
      'deckReview.cardsToReviewOne': '{count} card to review',
      'deckReview.cardsToReviewMany': '{count} cards to review',
      'deckReview.play': 'Play',
      'deckReview.answer': 'Answer',
      'deckReview.acceptedAnswers': 'Accepted answers',
      'deckReview.explanation': 'Explanation',
      'deckReview.illustration': 'Illustration',
      'deckReview.audioAvailable': 'Audio available',
      'deckReview.boxNever': 'Never played',
      'deckReview.boxPurple': 'To review',
      'deckReview.boxOrange': 'In progress',
      'deckReview.boxGreen': 'Mastered',
      'deckReview.noWords': 'No words in this deck',

      // Textes de src/ui/page-multilingual-config.js
      'mlc.mode': 'Game mode',
      'mlc.modeTranslation': 'Translation',
      'mlc.modeDictation': 'Dictation',
      'mlc.modeImage': 'Image',
      'mlc.languages': 'Languages',
      'mlc.listenIn': 'Listen in',
      'mlc.from': 'From',
      'mlc.writeIn': 'Write in',
      'mlc.to': 'To',
      'mlc.bidirectional': 'Two-way mode',
      'mlc.bidirectionalDesc': 'The direction changes at random on each card',
      'mlc.answerLanguage': 'Answer language',
      'mlc.imageNoBidirectional': 'Image mode has no two-way option.',
      'mlc.progress': 'Progress',
      'mlc.start': 'Start ({cards})',
      'mlc.noImageWords': 'No word with an image in this deck',
      'mlc.chooseDirection': 'Choose a direction',
      'mlc.total': 'Total',
      'mlc.mastered': 'Mastered',
      'mlc.new': 'New',
      'mlc.available': 'Available',

      // Textes de src/ui/page-multilingual-creator.js
      'mlcCreator.intro': 'Explore the Lingua Libre themes or import your own multilingual decks.',
      'mlcCreator.explore': 'Explore the Lingua Libre themes',
      'mlcCreator.exploreDesc': 'Browse the vocabulary lists available on Lingua Libre:',
      'mlcCreator.sourceLang': 'Source language:',
      'mlcCreator.load': 'Load the themes',
      'mlcCreator.importTitle': 'Import a deck',
      'mlcCreator.importDesc': 'Import a YAML file in the multilingual format:',
      'mlcCreator.importFile': 'Import a YAML file',
      'mlcCreator.format': 'YAML file format',
      'mlcCreator.available': 'Available multilingual decks ({count})',
      'mlcCreator.loadingLists': 'Loading the themes...',
      'mlcCreator.fileNote': '<strong>Note:</strong> access to external services may be blocked when the app is opened from a file (file://). To use this feature, open the app through a local web server.',
      'mlcCreator.clickLoad': 'Click "Load the themes" to see the available lists.',
      'mlcCreator.noLists': 'No theme found for this language.',
      'mlcCreator.preview': 'Preview the words',
      'mlcCreator.previewOf': 'Preview the words of {name}',
      'mlcCreator.listsFoundOne': '{count} theme found',
      'mlcCreator.listsFoundMany': '{count} themes found',
      'mlcCreator.init': 'Starting...',
      'mlcCreator.generating': 'Generating...',
      'mlcCreator.downloading': 'Downloading translations and audio files...',
      'mlcCreator.estimation': 'Estimate:',
      'mlcCreator.estimationExact': '{words} words × {langs} languages ≈ <strong>{size} MB</strong>',
      'mlcCreator.noSpace': '<strong>Not enough space!</strong> Estimate: {size} MB, available: {available} MB.<br>Reduce the number of languages or delete old decks.',
      'mlcCreator.closeSpace': 'This deck will use a large part of the available storage ({size} MB / {available} MB).',
      'mlcCreator.estimationRange': '{langs} languages × 10 to 100 words ≈ <strong>{min} to {max} MB</strong>',
      'mlcCreator.estimationHint': '(👁️ Preview the words for a precise estimate)',
      'mlcCreator.mayBeLarge': 'With {langs} languages, this deck could be large. Preview the words to check.',
      'mlcCreator.otherList': 'Choose another theme',
      'mlcCreator.targetLangs': 'Target languages (translations):',
      'mlcCreator.storage': 'Storage: <strong>{used} MB</strong> / {total} MB used ({percent}%)',
      'mlcCreator.shareMode': 'Sharing mode',
      'mlcCreator.shareHintOff': 'Personal use: all available audio will be included (CC0, CC BY, CC BY-SA...).',
      'mlcCreator.generate': 'Generate the multilingual deck',
      'mlcCreator.noListsOnline': 'No theme found. Check your internet connection.',
      'mlcCreator.loadError': 'Loading error: {message}',
      'mlcCreator.noConnection': 'Cannot connect',
      'mlcCreator.fetchingList': 'Fetching the list...',
      'mlcCreator.finishing': 'Finishing...',
      'mlcCreator.saveFailed': 'Could not save the deck. Storage may be full. Try deleting old decks or reducing the number of languages or words.',
      'mlcCreator.created': 'Deck "{name}" created successfully!\n{words} words in {langs} languages.',
      'mlcCreator.generationError': 'Generation error: {message}',
      'mlcCreator.notMultilingual': 'The file must be a multilingual deck (type: multilingual with a words list).',
      'mlcCreator.imported': 'Deck "{name}" imported successfully!\n{words} words in {langs} languages.',
      'mlcCreator.loadingWords': 'Loading the words...',
      'mlcCreator.noWords': 'No word found in this list.',

      // Textes de src/ui/page-prompt-generator.js
      'promptGen.subtitle': 'Create a prompt to generate flashcards with an AI assistant',
      'promptGen.formErrors': 'Errors in the form:',
      'promptGen.copy': 'Copy the prompt',
      'promptGen.clipboardError': 'Could not read the clipboard. Use Ctrl+V.',
      'promptGen.correctionCopied': 'Correction prompt copied to the clipboard!',
      'promptGen.correctionTitle': 'Correction prompt:',
      'promptGen.deleteCardConfirm': 'Delete this card?',

      // Textes de src/ui/page-stats.js
      'stats.performance': '📊 Performance',
      'stats.accuracy': 'Accuracy',
      'stats.avgTime': 'Average time',
      'stats.comparison': 'Comparison',
      'stats.today': 'Today',
      'stats.prevDay': 'yesterday',
      'stats.thisWeek': 'This week',
      'stats.prevWeek': 'last week',
      'stats.thisMonth': 'This month',
      'stats.prevMonth': 'last month',
      'stats.evolution': 'Progress',
      'stats.charts': 'Charts',
      'stats.cardDistribution': 'Card breakdown',
      'stats.perDeck': 'By deck',
      'stats.clickForCards': 'Click to see the cards',
      'stats.noCardsInDeck': 'No cards in this deck',
      'stats.box': 'Box',
      'stats.timesPlayed': 'Played',
      'stats.restInitial': 'Initial rest: {days} d',
      'stats.restDays': '{days} d',
      'stats.restOver': 'Rest over (it lasted {days} d)',
      'stats.ready': 'Ready',
      'stats.versus': 'vs {label}: {xp} XP, {cards} cards',

      // Textes de src/ui/page-utils.js

      // Textes de src/ui/deck-editor/sync-controller.js
      'editor.yamlNeedsCards': 'The deck must contain a "cards" list.',
      'editor.yamlValidCardsOne': '{count} valid card',
      'editor.yamlValidCardsMany': '{count} valid cards',
      'editor.yamlValid': 'Valid YAML',

      // Textes de src/ui/components/tag-selector.js
      'tagSelector.remove': 'Remove the tag {label}',
      'tagSelector.none': 'No tag selected',
      'tagSelector.noResult': 'No result',

      // Textes de src/ui/prompt-generator/yaml-editor-logic.js
      'yamlEditor.replaceConfirm': 'A deck with the ID "{id}" already exists. Do you want to replace it?',
      'yamlEditor.importedOne': 'Deck "{name}" imported successfully! ({count} card)',
      'yamlEditor.importedMany': 'Deck "{name}" imported successfully! ({count} cards)',

      // Textes de src/ui/prompt-generator/yaml-editor-logic.js
      'yamlLogic.empty': 'The YAML content is empty.',
      'yamlLogic.invalid': 'Parsing the YAML gave an invalid result.',
      'yamlLogic.needIdOrName': 'The deck must have an "id" or a "name".',
      'yamlLogic.foundKeys': '(keys found: {keys})',
      'yamlLogic.noKeys': '(no keys found)',
      'yamlLogic.needCards': 'The deck must contain a "cards" list.',
      'yamlLogic.needOneCard': 'The deck must contain at least one card.',
      'yamlLogic.parseError': 'YAML parsing error: {message}',
      'yamlLogic.validatorMissing': 'The deck validation module is not available.',
      'yamlLogic.missingField': 'Card {n}: field "{field}" missing',

      // Textes de src/ui/prompt-generator/yaml-editor-renderer.js
      'yamlEditor.title': 'Deck editor',
      'yamlEditor.subtitle': 'Import and edit the deck generated by the AI',
      'yamlEditor.backToPrompt': 'Back to the prompt',
      'yamlEditor.validate': 'Validate the YAML',
      'yamlEditor.import': 'Import the deck',
      'yamlEditor.pasteFromClipboard': 'Paste from the clipboard',
      'yamlEditor.clear': 'Clear',
      'yamlEditor.placeholder': 'Paste the YAML generated by the AI here...\n\nExpected format example:\nid: my-deck\nname: My deck\ndescription: Deck description\ncategory:\n  - category1\n  - category2\ndifficulty: 1\ncards:\n  - id: card_1\n    question: Question 1?\n    answer: Answer 1\n    type: text\n  - id: card_2\n    question: Question 2?\n    answer: Answer 2\n    type: text',
      'yamlEditor.previewHint': 'The deck preview will appear here once the YAML is validated.',
      'yamlEditor.noDeck': 'No deck loaded',
      'yamlEditor.noDeckHint': 'Switch to code mode to paste your YAML, then validate it to edit it with the forms.',
      'yamlEditor.switchToCode': 'Switch to code mode',
      'yamlEditor.deckInfo': 'Deck information',
      'yamlEditor.descriptionPlaceholder': 'Deck description...',
      'yamlEditor.difficulty': 'Difficulty',
      'yamlEditor.unspecified': 'Not specified',
      'yamlEditor.diff1': 'Easy',
      'yamlEditor.diff2': 'Medium',
      'yamlEditor.diff3': 'Hard',
      'yamlEditor.diff4': 'Expert',
      'yamlEditor.noCards': 'No cards. Click "Add" to create a card.',
      'yamlEditor.errorsToFix': 'Errors to fix',
      'yamlEditor.warnings': 'Warnings',
      'yamlEditor.excellent': 'Excellent quality',
      'yamlEditor.qualityScore': 'Quality score',
      'yamlEditor.moveUp': 'Move up',
      'yamlEditor.moveDown': 'Move down',
      'yamlEditor.suggestions': 'Suggestions for improvement:',
      'yamlEditor.textDefault': 'Text (default)',
      'yamlEditor.textDefaultHelp': 'No need to specify "Text": it is the default type.',
      'yamlEditor.answerHint': '(1 to 3 words recommended)',
      'yamlEditor.expectedAnswer': 'Expected answer',
      'yamlEditor.alternatives': 'Alternatives',
      'yamlEditor.alternativesHint': '(synonyms, abbreviations: one per line)',
      'yamlEditor.alternativesPlaceholder': 'Write the accepted alternative answers, one per line...&#10;E.g.: UN&#10;United Nations&#10;U.N.',
      'yamlEditor.alternativesHelp': 'Important for text cards: synonyms, abbreviations, spelling variants',
      'yamlEditor.hintPlaceholder': 'A hint that helps without giving the answer away...',
      'yamlEditor.feedbackPlaceholder': 'Explanation shown after the answer to strengthen learning...',
      'yamlEditor.feedbackHelp': 'Explain the "why", not just the answer',
      'yamlEditor.unnamed': 'Unnamed',
      'yamlEditor.noDescription': 'No description',
      'yamlEditor.difficultyLevel': 'Difficulty {level}',
      'yamlEditor.cardsPreview': 'Card preview ({shown} of {total})',
      'yamlEditor.qShort': 'Q:',
      'yamlEditor.aShort': 'A:',
      'yamlEditor.moreCards': '... and {count} more cards',
      'yamlEditor.history': 'Correction history ({count} iterations)',
      'yamlEditor.improvement': 'Improvement of {points} points',
      'yamlEditor.regression': 'Drop of {points} points',
      'yamlEditor.report': 'Quality report',
      'yamlEditor.averageScore': 'Average score ({grade})',
      'yamlEditor.correctionHint': 'Generate a prompt to fix the problems',
      'yamlEditor.correctionPrompt': 'Correction prompt',
      'yamlEditor.validCards': 'Valid cards',
      'yamlEditor.errors': 'Errors',
      'yamlEditor.toCheck': 'To check',
      'yamlEditor.deckProblems': 'Deck problems:',
      'yamlEditor.duplicates': 'Duplicates found:',
      'yamlEditor.similar': '{percent}% similar',
      'yamlEditor.bloom': 'Cognitive breakdown (Bloom):',
      'yamlEditor.readability': 'Readability:',
      'yamlEditor.grade': 'Grade {grade}',




      'gen.more': '+{count} more...',

      'mlcCreator.noWordsInList': 'No word found in this theme',

      'gen.moreWords': '+{count} more words...',
      'pgMulti.noneProcessed': 'No word could be processed',


      // Réglage de la forme grammaticale (visible en français seulement)
      'settings.grammaticalForm': 'Grammatical agreement',
      'settings.grammaticalFormDesc': 'Choose how the texts refer to you.',
      'settings.formFeminine': 'Feminine (default)',
      'settings.formMasculine': 'Masculine',
      'settings.formInclusive': 'Middle dot',
      'settings.formExample': 'Example: {example}',


      'cardEditor.changeMedia': 'Change',
      'cardEditor.addMedia': 'Add media',


      'gen.status.searching': 'Searching...',


      'badge.retention_20.name': 'One-week memory',
      'badge.retention_20.description': '20 cards resting for 7 days or more',
      'badge.durable_75.name': 'Lasting memory',
      'badge.durable_75.description': '75 cards resting for 14 days or more',
      'badge.durable_200.name': 'Elephant memory',
      'badge.durable_200.description': '200 cards resting for 14 days or more',
      'badge.night_owl.name': 'Evening Owl',
      'badge.night_owl.description': 'Play in the evening, between 6pm and 9pm',
      'badge.night_owl.hint': 'When the day winds down...',
      'badge.early_bird.description': 'Play between 6am and 8am'
    }
  },

  /**
   * Initialise le module i18n
   * Charge la dernière langue mémorisée (écran de profil, avant qu'un joueur soit chargé)
   * ou détecte la langue du navigateur. La langue du joueur est ensuite appliquée
   * par applyPlayerLanguage().
   */
  init() {
    let savedLocale = null;
    try {
      savedLocale = typeof localStorage !== 'undefined' ? localStorage.getItem('tyb_locale') : null;
    } catch (e) { /* localStorage inaccessible */ }

    this._locale = savedLocale && this.SUPPORTED_LOCALES.includes(savedLocale)
      ? savedLocale
      : this.detectBrowserLocale();

    this._applyDocumentLang();
    return this._locale;
  },

  /**
   * Détecte la langue du navigateur parmi les langues prises en charge
   * (navigator.language puis navigator.languages), français par défaut.
   *
   * @returns {string} - Code de langue pris en charge
   */
  detectBrowserLocale() {
    if (typeof navigator === 'undefined') return 'fr';
    const candidates = [navigator.language, navigator.userLanguage, ...(navigator.languages || [])];
    for (const candidate of candidates) {
      const base = String(candidate || '').toLowerCase().split(/[-_]/)[0];
      if (this.SUPPORTED_LOCALES.includes(base)) return base;
    }
    return 'fr';
  },

  /**
   * Résout une préférence de langue ('fr', 'en', 'auto', absente ou invalide)
   * en une langue prise en charge.
   *
   * @param {string|null|undefined} preference
   * @returns {string}
   */
  resolveLocale(preference) {
    return this.SUPPORTED_LOCALES.includes(preference) ? preference : this.detectBrowserLocale();
  },

  /**
   * Applique la langue choisie par un joueur (player.settings.language).
   * Sans choix explicite ('auto' ou absent), la langue du navigateur s'applique.
   *
   * @param {Object|null} player
   * @returns {string} - Langue appliquée
   */
  applyPlayerLanguage(player) {
    const preference = player && player.settings ? player.settings.language : undefined;
    const locale = this.resolveLocale(preference);
    const explicit = this.SUPPORTED_LOCALES.includes(preference);

    // Forme grammaticale du joueur (féminin sans choix ni joueur) : appliquée avant la langue,
    // pour qu'un seul rendu suive un changement des deux
    const previousForm = this._grammaticalForm;
    this._grammaticalForm = this.resolveGrammaticalForm(
      player && player.settings ? player.settings.grammaticalForm : undefined
    );

    this._setLocaleInternal(locale, previousForm !== this._grammaticalForm);

    // Mémoire pour l'écran de profil (sans joueur chargé) : inchangée si aucun joueur
    try {
      if (player && typeof localStorage !== 'undefined') {
        if (explicit) localStorage.setItem('tyb_locale', locale);
        else localStorage.removeItem('tyb_locale');
      }
    } catch (e) { /* ignoré */ }

    return locale;
  },

  /**
   * Obtient la langue courante
   *
   * @returns {string} - Code de la langue (fr, en)
   */
  getLocale() {
    return this._locale;
  },

  /**
   * Change la langue
   *
   * @param {string} locale - Code de la langue (fr, en)
   * @returns {boolean} - true si le changement a réussi
   */
  setLocale(locale) {
    if (!this.SUPPORTED_LOCALES.includes(locale)) {
      console.warn(`[i18n] Unsupported locale: ${locale}`);
      return false;
    }

    this._setLocaleInternal(locale);

    // Sauvegarder dans localStorage
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('tyb_locale', locale);
      }
    } catch (e) { /* ignoré */ }

    return true;
  },

  /**
   * @private Change la langue active, met à jour <html lang> et notifie les écouteurs
   * (aussi quand seule la forme grammaticale a changé : formChanged).
   */
  _setLocaleInternal(locale, formChanged = false) {
    const changed = this._locale !== locale;
    this._locale = locale;
    this._applyDocumentLang();
    if (changed || formChanged) this._notify(locale);
  },

  /** @private Notifie les écouteurs de changement de langue ou de forme. */
  _notify(locale) {
    this._listeners.slice().forEach(cb => {
      try { cb(locale); } catch (e) { console.error('[i18n] listener error:', e); }
    });
  },

  /**
   * Résout une forme grammaticale ('feminine', 'masculine', 'inclusive', absente ou invalide)
   * en une forme prise en charge : féminin par défaut.
   *
   * @param {*} form
   * @returns {string}
   */
  resolveGrammaticalForm(form) {
    return this.GRAMMATICAL_FORMS.includes(form) ? form : this.DEFAULT_GRAMMATICAL_FORM;
  },

  /**
   * Obtient la forme grammaticale courante
   *
   * @returns {string} - 'feminine', 'masculine' ou 'inclusive'
   */
  getGrammaticalForm() {
    return this._grammaticalForm;
  },

  /**
   * Change la forme grammaticale (sans l'enregistrer : l'enregistrement est celui du joueur,
   * player.settings.grammaticalForm). Notifie les écouteurs si elle change.
   *
   * @param {string} form - 'feminine', 'masculine' ou 'inclusive'
   * @returns {boolean} - true si la forme est connue
   */
  setGrammaticalForm(form) {
    if (!this.GRAMMATICAL_FORMS.includes(form)) {
      console.warn(`[i18n] Unsupported grammatical form: ${form}`);
      return false;
    }
    const changed = this._grammaticalForm !== form;
    this._grammaticalForm = form;
    if (changed) this._notify(this._locale);
    return true;
  },

  /** @private */
  _applyDocumentLang() {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.setAttribute('lang', this._locale);
    }
  },

  /**
   * S'abonne aux changements de langue.
   *
   * @param {Function} callback - Appelée avec le nouveau code de langue
   * @returns {Function} - Fonction de désabonnement
   */
  onLocaleChange(callback) {
    this._listeners.push(callback);
    return () => {
      this._listeners = this._listeners.filter(cb => cb !== callback);
    };
  },

  /**
   * Étiquette BCP 47 utilisée pour les formats de dates et de nombres.
   *
   * @returns {string}
   */
  getFormatLocale() {
    return this._FORMAT_LOCALES[this._locale] || this._FORMAT_LOCALES.fr;
  },

  /**
   * Formate une date selon la langue active.
   *
   * @param {Date|string|number} date
   * @param {Object} [options] - Options Intl.DateTimeFormat
   * @returns {string}
   */
  formatDate(date, options) {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(this.getFormatLocale(), options);
  },

  /**
   * Formate un nombre selon la langue active.
   *
   * @param {number} value
   * @param {Object} [options] - Options Intl.NumberFormat
   * @returns {string}
   */
  formatNumber(value, options) {
    return Number(value).toLocaleString(this.getFormatLocale(), options);
  },

  /**
   * Obtient une traduction
   *
   * @param {string} key - Clé de traduction (ex: 'nav.home')
   * @param {Object} [params] - Paramètres de remplacement (ex: { name: 'Jean' })
   * @returns {string} - Texte traduit ou clé si non trouvée
   */
  t(key, params = {}) {
    const translations = this._translations[this._locale] || this._translations.fr;
    let text = translations[key];

    // Fallback vers français si la clé n'existe pas
    if (text === undefined) {
      text = this._translations.fr[key];
    }

    // Si toujours pas trouvé, retourner la clé
    if (text === undefined) {
      console.warn(`[i18n] Missing translation: ${key}`);
      return key;
    }

    // Valeur à variantes { f, m, x } : choisir selon la forme grammaticale active
    text = this.resolveVariant(text, this._grammaticalForm);

    // Remplacer les paramètres (fonction de remplacement : pas d'interprétation de $&, $1...)
    Object.keys(params).forEach(param => {
      text = text.replace(new RegExp(`\\{${param}\\}`, 'g'), () => String(params[param]));
    });

    return text;
  },

  /**
   * Choisit le texte d'une valeur de dictionnaire.
   * Une valeur est soit une chaîne, soit un objet de variantes { f, m, x }
   * (féminin, masculin, point médian). Une variante absente retombe sur `f`.
   * C'est l'unique endroit où une variante est choisie.
   *
   * @param {(string|TranslationVariants)} value - Valeur de dictionnaire
   * @param {string} [form] - Forme grammaticale (défaut : la forme active)
   * @returns {string}
   */
  resolveVariant(value, form = this._grammaticalForm) {
    if (value === null || typeof value !== 'object') return value;
    const variant = this._FORM_VARIANT[form] || this._FORM_VARIANT[this.DEFAULT_GRAMMATICAL_FORM];
    return value[variant] !== undefined ? value[variant] : value.f;
  },

  /**
   * Nom d'une langue dans la langue de l'interface (Intl.DisplayNames), initiale en capitale.
   * Repli : `fallback` s'il est fourni, sinon le code de langue.
   *
   * @param {string} code - Code de langue (ex: 'en')
   * @param {string} [fallback] - Texte si le nom est introuvable
   * @returns {string}
   */
  languageName(code, fallback) {
    try {
      const name = new Intl.DisplayNames([this._locale], { type: 'language' }).of(code);
      if (name && name !== code) return name.charAt(0).toLocaleUpperCase(this._locale) + name.slice(1);
    } catch (e) { /* Intl.DisplayNames indisponible */ }
    return fallback !== undefined ? String(fallback) : String(code);
  },

  /**
   * Traduction avec accord en nombre : choisit la clé `<baseKey>One` (singulier) ou
   * `<baseKey>Many` (pluriel) selon `count`, et passe `count` en paramètre.
   * Français : singulier pour 0 et 1 (valeur absolue inférieure à 2) ; anglais : seulement pour 1.
   *
   * @param {string} baseKey - Début de clé (ex: 'merger.selectedCount')
   * @param {number} count - Nombre
   * @param {Object} [params] - Autres paramètres de remplacement
   * @returns {string}
   */
  tn(baseKey, count, params = {}) {
    const abs = Math.abs(Number(count));
    const singular = this._locale === 'fr' ? abs < 2 : abs === 1;
    return this.t(baseKey + (singular ? 'One' : 'Many'), { count, ...params });
  },

  /**
   * Alias pour t() - fonction globale de traduction
   */
  translate(key, params) {
    return this.t(key, params);
  },

  /**
   * Obtient toutes les langues supportées avec leurs labels
   *
   * @returns {Array} - Liste des langues { code, label, flag }
   */
  getAvailableLocales() {
    return [
      { code: 'fr', label: 'Français', flag: '🇫🇷' },
      { code: 'en', label: 'English', flag: '🇬🇧' }
    ];
  }
};

// Fonction globale de traduction (raccourci)
function t(key, params) {
  return i18n.t(key, params);
}

// Export pour tests Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { i18n, t };
}
