/**
 * App - Initialisation de l'application
 *
 * Ce fichier doit être chargé EN DERNIER après tous les autres
 * fichiers UI (pages-base.js, page-*.js, pages.js)
 *
 * Dépendances: Pages, Components
 * Modules: State, Router, Storage, Leitner, Themes, Tags, Challenges
 */

// ═══════════════════════════════════════════════════════════════
// APP - Initialisation de l'application
// ═══════════════════════════════════════════════════════════════

const App = {
  /**
   * Applique le thème et les préférences d'accessibilité d'un joueur sur <html>.
   * Les réglages absents sont remis à 'false' / '' : changer de joueur ne laisse pas
   * les réglages du précédent. Sans joueur, ne change rien.
   *
   * @param {Object|null} player
   */
  _applyPlayerAppearance(player) {
    if (!player) return;
    const root = document.documentElement;
    if (typeof Themes !== 'undefined') {
      Themes.applyTheme(Themes.getCurrentTheme(player));
    }
    const settings = player.settings || {};
    // Même valeurs que la page des réglages : 'true' / 'false' ; le CSS ne cible que "true".
    const flag = (attr, on) => root.setAttribute(attr, on ? 'true' : 'false');
    flag('data-dyslexia', settings.dyslexiaMode);
    flag('data-high-contrast', settings.highContrast);
    flag('data-large-spacing', settings.largeSpacing);
    // Daltonisme : nom du filtre, ou chaîne vide (aucun filtre)
    root.setAttribute('data-colorblind', settings.colorblindMode || '');
  },

  init() {
    // 0. Initialiser le gestionnaire d'erreurs
    if (typeof ErrorHandler !== 'undefined') {
      ErrorHandler.init({
        enableLogging: true,
        enableGlobalHandlers: true
      });

      // Vérifier l'accès localStorage au démarrage
      if (!ErrorHandler.testLocalStorageAccess()) {
        ErrorHandler.handleError(
          new Error('localStorage is not accessible'),
          { source: 'app_init' }
        );
      }
    }

    // 0.1. Initialiser i18n (dernière langue mémorisée ou langue du navigateur ; la langue du joueur est appliquée à l'étape 1.1)
    if (typeof i18n !== 'undefined') {
      i18n.init();
    }

    // 0.2. Initialiser le module d'accessibilité
    if (typeof A11y !== 'undefined') {
      A11y.init();
    }

    // 1. Charger les données avec gestion d'erreurs
    const player = this._safeLoadPlayer();
    const decks = this._safeLoadDecks();

    // 1.1 Langue : choix du joueur (player.settings.language), sinon langue du navigateur.
    // Réappliquée à chaque changement de joueur (sélection, création, import, réglages).
    if (typeof i18n !== 'undefined') {
      if (player) i18n.applyPlayerLanguage(player);
      State.subscribe('player', (newPlayer) => {
        if (newPlayer) i18n.applyPlayerLanguage(newPlayer);
      });
    }

    // 1.5 Thème et accessibilité : réglages du joueur (player.settings), appliqués au démarrage
    // puis à chaque changement de joueur (sélection, création, import, réglages).
    // Sans joueur chargé (écran de profil), l'apparence en cours est conservée.
    this._applyPlayerAppearance(player);
    State.subscribe('player', (newPlayer) => this._applyPlayerAppearance(newPlayer));

    // 2. Initialiser le state
    State.set('player', player);
    State.set('decks', decks);
    State.set('currentSession', null);

    // 3. Configurer les routes
    Router.register('/', () => this._showPage('splash'));
    Router.register('/home', () => this._showPage('home'));
    Router.register('/game', (params) => this._startGame(params));
    Router.register('/session-summary', () => this._showPage('sessionSummary'));
    // /deck/:id redirige vers /game/:id (plus d'interface intermédiaire)
    // Utilise replace pour ne pas polluer l'historique (évite le bug de la flèche retour)
    Router.register('/deck', (params) => {
      const deckId = params[0];
      if (deckId) {
        Router.replace(`/game/${deckId}`);
      } else {
        Router.replace('/explore');
      }
    });
    Router.register('/deck-resources', (params) => this._showPage('deckResources', params));
    Router.register('/deck-review', (params) => this._showPage('deckReview', params));
    Router.register('/explore', () => this._showPage('explore'));
    Router.register('/stats', () => this._showPage('stats'));
    Router.register('/badges', () => this._showPage('badges'));
    Router.register('/challenges', () => this._showPage('challenges'));
    Router.register('/settings', () => this._showPage('settings'));
    Router.register('/deck-hub', () => this._showPage('deckHub'));
    Router.register('/deck-merger', () => this._showPage('deckMerger'));
    Router.register('/deck-editor', (params) => this._showPage('deckEditor', params));
    Router.register('/exam', (params) => this._startExam(params));
    Router.register('/exam-results', () => this._showPage('examResults'));
    Router.register('/challenge-setup', (params) => this._showPage('challengeSetup', params));
    Router.register('/challenge', (params) => this._startChallenge(params));
    Router.register('/challenge-results', () => this._showPage('challengeResults'));
    Router.register('/prompt-generator', () => this._showPage('promptGenerator'));
    Router.register('/multilingual-config', (params) => this._showPage('multilingualConfig', params));
    Router.register('/multilingual-creator', () => this._showPage('multilingualCreator'));

    // 4. Démarrer le routeur
    Router.init();

    // 4.5. Initialiser la barre d'outils flottante
    FloatingToolbar.init();

    // 4.6. Initialiser la sidebar des badges
    BadgesSidebar.init();

    // 5. Si pas de joueur et pas déjà sur splash, rediriger
    if (!player && window.location.hash && window.location.hash !== '#/') {
      Router.navigate('/');
    }
  },

  _showPage(pageName, params = []) {
    const container = document.getElementById('app');
    if (!container) {
      console.error('Container #app not found');
      if (typeof ErrorHandler !== 'undefined') {
        ErrorHandler.handleError(
          new Error('Container #app not found in DOM'),
          { source: 'page_mount', pageName }
        );
      }
      return;
    }

    const state = State.getAll();

    // Vérifier si le joueur est connecté (sauf pour splash)
    if (pageName !== 'splash' && !state.player) {
      Router.navigate('/');
      return;
    }

    const page = Pages[pageName];
    if (!page) {
      console.error(`Page ${pageName} not found`);
      if (typeof ErrorHandler !== 'undefined') {
        ErrorHandler.handleError(
          new Error(`Page "${pageName}" not found in Pages object`),
          { source: 'page_mount', pageName, availablePages: Object.keys(Pages) }
        );
      }
      return;
    }

    // Utiliser safeMountPage pour gérer les erreurs de montage
    if (typeof ErrorHandler !== 'undefined') {
      ErrorHandler.safeMountPage(pageName, page.mount.bind(page), container, state, params);
    } else {
      // Fallback si ErrorHandler n'est pas disponible
      try {
        page.mount(container, state, params);
      } catch (error) {
        console.error(`Error mounting page ${pageName}:`, error);
        container.innerHTML = `
          <div style="padding: 2rem; text-align: center;">
            <h1>${PageUtils.getTranslator()('common.error')}</h1>
            <p>${PageUtils.getTranslator()('app.pageLoadError')}</p>
            <button type="button" class="app-error__home">${PageUtils.getTranslator()('game.backHome')}</button>
          </div>
        `;
        const homeBtn = container.querySelector('.app-error__home');
        if (homeBtn) homeBtn.addEventListener('click', () => Router.navigate('/home'));
      }
    }

    // Bind footer events (playerBar menu) after page mount
    if (typeof PageUtils !== 'undefined' && PageUtils.bindFooter) {
      PageUtils.bindFooter(container);
    }

    this._focusPageHeading(container);
  },

  /**
   * Accessibilité : après un changement de page, place le focus sur le titre (h1)
   * pour que le lecteur d'écran annonce la nouvelle page et que la tabulation reparte du haut.
   * Ne fait rien si la page a déjà placé le focus (champ de saisie, bouton) ou si le tutoriel est ouvert.
   * @private
   */
  _focusPageHeading(container) {
    const active = document.activeElement;
    if (active && active !== document.body && container.contains(active)) return;
    if (document.querySelector('.tutorial-overlay')) return;

    const heading = container.querySelector('h1');
    if (!heading) return;
    heading.setAttribute('tabindex', '-1');
    heading.focus({ preventScroll: true });
  },

  _startGame(params) {
    const deckId = params[0];
    if (!deckId) {
      Router.navigate('/home');
      return;
    }

    const state = State.getAll();
    const deck = state.decks?.find(d => d.id === deckId);

    if (!deck) {
      Router.navigate('/home');
      return;
    }

    // Vérifier si c'est un deck multilingue
    if (deck.type === 'multilingual') {
      return this._startMultilingualGame(deck, state);
    }

    // Récupérer les cartes pour la session (toutes les cartes jouables)
    const today = PageUtils.getToday();
    const cards = Leitner.getCardsForSession(deck, {
      today,
      maxCards: deck.settings?.maxCards ?? 100,  // Use deck settings, default to 100
      ignoreRest: false,
      sequential: deck.settings?.sequential ?? false  // Use deck settings, default to false
    });

    if (cards.length === 0) {
      Router.navigate('/home');
      return;
    }

    // Créer la session
    const session = {
      deckId: deck.id,
      cards,
      currentIndex: 0,
      isShowingFeedback: false,
      cardStartTime: Date.now(),
      startedAt: new Date().toISOString(),
      endedAt: null,
      results: [],
      stats: {
        cardsPlayed: 0,
        correctAnswers: 0,
        currentGreenStreak: 0,
        maxGreenStreak: 0,
        totalXpEarned: 0
      }
    };

    State.set('currentSession', session);
    this._showPage('game');
  },

  /**
   * Démarre une session de jeu multilingue
   * @private
   */
  _startMultilingualGame(deck, state) {
    // Vérifier si une configuration existe
    const config = state.multilingualConfig;

    if (!config || config.deckId !== deck.id) {
      // Pas de configuration, rediriger vers la page de config
      Router.navigate(`/multilingual-config/${deck.id}`);
      return;
    }

    // Initialiser la progression si nécessaire
    if (typeof Multilingual !== 'undefined') {
      Multilingual.initializeDeckProgress(deck);
    }

    // Récupérer les cartes pour la session multilingue
    const cards = Multilingual.getCardsForSession(deck, config, {
      maxCards: deck.settings?.maxCards ?? 50,
      shuffle: !(deck.settings?.sequential ?? false),  // Use deck settings, default to shuffle
      ignoreRest: false
    });

    if (cards.length === 0) {
      alert(PageUtils.getTranslator()('game.noCardsDirection'));
      Router.navigate('/home');
      return;
    }

    // Créer la session multilingue
    const session = {
      type: 'multilingual',
      deckId: deck.id,
      config: { ...config },
      cards,
      currentIndex: 0,
      isShowingFeedback: false,
      cardStartTime: Date.now(),
      startedAt: new Date().toISOString(),
      endedAt: null,
      results: [],
      stats: {
        cardsPlayed: 0,
        correctAnswers: 0,
        currentGreenStreak: 0,
        maxGreenStreak: 0,
        totalXpEarned: 0
      }
    };

    // Effacer la config après utilisation
    State.set('multilingualConfig', null);
    State.set('currentSession', session);
    this._showPage('game');
  },

  _startExam(params) {
    const deckId = params[0];
    if (!deckId) {
      Router.navigate('/home');
      return;
    }

    const state = State.getAll();
    const deck = state.decks?.find(d => d.id === deckId);

    if (!deck || !deck.cards || deck.cards.length === 0) {
      Router.navigate('/home');
      return;
    }

    // Mélanger les cartes pour l'examen (Fisher-Yates)
    const cards = TextUtils.shuffleArray(deck.cards);

    // Calculer le score maximum possible
    // Number() : card.points peut être une chaîne (deck importé) -> sinon concaténation de chaînes
    const maxScore = cards.reduce((sum, card) => sum + (Number(card.points) || 1), 0);

    // Créer la session d'examen
    const examSession = {
      type: 'exam',
      deckId: deck.id,
      deckName: deck.name,
      cards,
      currentIndex: 0,
      isShowingFeedback: false,
      cardStartTime: Date.now(),
      startedAt: new Date().toISOString(),
      endedAt: null,
      results: [],
      maxScore,
      currentScore: 0,
      stats: {
        cardsAnswered: 0,
        correctAnswers: 0,
        wrongAnswers: 0
      }
    };

    State.set('currentExam', examSession);
    this._showPage('exam');
  },

  /**
   * Démarre un défi : `#/challenge/<mode>/<niveau>/<deck>[/timed]` (l'indicateur `timed` est ancien : il
   * mène un lien Parcours à Contre la montre)
   *
   * Un défi est une séance normale (cartes de Leitner.getCardsForSession, même progression) décrite
   * par `session.challenge` ; `practice` en guise de mode lance l'entraînement libre. L'ancien mode
   * `streak` mène à Sans erreur. Si le défi n'est pas possible (pas assez de cartes à réviser,
   * Jusqu'au bout sous 20 cartes, Contre la montre avec le mode dyslexie ou l'espacement large),
   * retour au choix du défi.
   * @private
   */
  _startChallenge(params) {
    const [rawMode, difficulty, deckId, flag] = params;
    const resolved = Challenges.resolveMode(rawMode, flag);

    if (!resolved || !deckId) {
      Router.navigate('/challenges');
      return;
    }

    const state = State.getAll();
    const deck = state.decks?.find(d => d.id === deckId);
    if (!deck) {
      Router.navigate('/challenges');
      return;
    }

    const session = Challenges.createChallengeSession({
      modeId: resolved.modeId,
      difficulty: difficulty || 'easy',
      practice: resolved.practice
    }, deck, PageUtils.getToday(), state.player);

    if (!session) {
      Router.navigate(`/challenge-setup/${deckId}`);
      return;
    }

    State.set('currentSession', session);
    this._showPage('challengeGame');
  },

  /**
   * Normalise un deck (migration category ↔ tags, settings par défaut)
   */
  _normalizeDeck(deck) {
    const normalized = { ...deck };

    // Migration category → tags
    if (deck.category && !deck.tags) {
      normalized.tags = typeof Tags !== 'undefined'
        ? Tags.fromCategory(deck.category)
        : (Array.isArray(deck.category) ? deck.category : [deck.category]);
    }
    if (!normalized.tags) {
      normalized.tags = [];
    }

    // Migration tags → category (pour decks procéduraux)
    if (deck.tags && !deck.category) {
      normalized.category = Array.isArray(deck.tags) ? deck.tags : [deck.tags];
    }
    if (!normalized.category) {
      normalized.category = [];
    }

    // difficulty optionnel (peut être null/undefined)
    if (normalized.difficulty !== undefined && normalized.difficulty !== null) {
      normalized.difficulty = Math.max(1, Math.min(5, parseInt(normalized.difficulty) || 1));
    }

    // Settings par défaut
    normalized.settings = {
      bidirectional: false,
      sequential: false,
      similarityMatching: false,
      similarityThreshold: 0.8, // 80% de similarité minimum
      ...deck.settings
    };

    return normalized;
  },

  _loadDecks() {
    // Charger les decks depuis DECKS global
    let allDecks = [];
    if (typeof DECKS !== 'undefined') {
      allDecks = [...DECKS];
    } else {
      console.warn('DECKS not defined, using empty array');
    }

    // Charger les decks importés (Moodle)
    const customDecks = Storage.loadCustomDecks();
    allDecks = [...allDecks, ...customDecks];

    // Normaliser tous les decks
    allDecks = allDecks.map(deck => this._normalizeDeck(deck));

    // Charger la progression des decks standards
    const progress = Storage.loadAllProgress();

    // Merge decks avec progression
    return allDecks.map(deck => {
      // Gestion spéciale pour les decks multilingues
      if (deck.type === 'multilingual' && Array.isArray(deck.words)) {
        return this._loadMultilingualDeck(deck);
      }

      // Decks standards avec cards
      if (!Array.isArray(deck.cards)) {
        console.warn(`Deck ${deck.id} has no cards array, skipping`);
        return { ...deck, cards: [] };
      }

      const savedProgress = progress[deck.id];

      if (!savedProgress) {
        return {
          ...deck,
          cards: deck.cards.map(card => ({
            ...card,
            box: 'never_played',
            latencyThreshold: null,
            bestResponseTimeMs: null,
            lastResponseTimeMs: null,
            restUntil: null,
            restDays: 0,
            timesPlayed: 0,
            timesCorrect: 0
          }))
        };
      }

      const progressMap = new Map(savedProgress.map(p => [p.id, p]));

      return {
        ...deck,
        cards: deck.cards.map(card => {
          const cardProgress = progressMap.get(card.id);
          return cardProgress ? { ...card, ...cardProgress } : {
            ...card,
            box: 'never_played',
            latencyThreshold: null,
            bestResponseTimeMs: null,
            lastResponseTimeMs: null,
            restUntil: null,
            restDays: 0,
            timesPlayed: 0,
            timesCorrect: 0
          };
        })
      };
    });
  },

  /**
   * Charge un deck multilingue avec sa progression
   * @private
   * @param {Object} deck - Deck multilingue
   * @returns {Object} Deck avec progression chargée
   */
  _loadMultilingualDeck(deck) {
    // Initialiser la structure de progression pour toutes les directions
    if (typeof Multilingual !== 'undefined') {
      Multilingual.initializeDeckProgress(deck);
    }

    // Charger la progression sauvegardée
    const savedProgress = Storage.loadMultilingualProgress(deck.id);

    if (savedProgress && Array.isArray(savedProgress)) {
      // Merger la progression sauvegardée avec les mots
      const progressMap = new Map(savedProgress.map(p => [p.id, p.progress || {}]));

      deck.words = deck.words.map(word => {
        const wordProgress = progressMap.get(word.id);
        if (wordProgress) {
          // Merger les progressions par direction
          word.progress = { ...word.progress, ...wordProgress };
        }
        return word;
      });
    }

    return deck;
  },

  /**
   * Charge le joueur avec gestion d'erreurs
   * @private
   * @returns {Object|null} Joueur ou null en cas d'erreur
   */
  _safeLoadPlayer() {
    if (typeof ErrorHandler !== 'undefined') {
      return ErrorHandler.safe(() => {
        return Storage.loadPlayer();
      }, { source: 'load_player' });
    } else {
      try {
        return Storage.loadPlayer();
      } catch (error) {
        console.error('Error loading player:', error);
        return null;
      }
    }
  },

  /**
   * Charge les decks avec gestion d'erreurs
   * @private
   * @returns {Array} Liste des decks (vide en cas d'erreur)
   */
  _safeLoadDecks() {
    if (typeof ErrorHandler !== 'undefined') {
      const result = ErrorHandler.safe(() => {
        return this._loadDecks();
      }, { source: 'load_decks' });
      return result || [];
    } else {
      try {
        return this._loadDecks();
      } catch (error) {
        console.error('Error loading decks:', error);
        return [];
      }
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// FLOATING TOOLBAR - Barre d'outils flottante (thème, focus)
// ═══════════════════════════════════════════════════════════════

const FloatingToolbar = {
  _isLightMode: false,
  _isFocusMode: false,
  _isNavbarPinned: true, // Navbar épinglée par défaut en mode focus
  _navbarHideTimeout: null, // Timer pour auto-hide
  _isNavbarVisible: false, // État de visibilité (quand désépinglée)
  _NAVBAR_HIDE_DELAY: 1500, // Délai avant masquage (1.5s)

  init() {
    // Charger les préférences depuis localStorage
    this._isLightMode = localStorage.getItem('tyb_light_mode') === 'true';
    this._isFocusMode = localStorage.getItem('tyb_focus_mode') === 'true';
    this._isNavbarPinned = localStorage.getItem('tyb_navbar_pinned') !== 'false'; // true par défaut

    // Appliquer l'état initial
    if (this._isLightMode) {
      document.documentElement.classList.add('light-mode');
    }
    if (this._isFocusMode) {
      document.documentElement.classList.add('focus-mode');
      if (this._isNavbarPinned) {
        document.documentElement.classList.add('navbar-pinned');
      }
    }

    // Créer et insérer la toolbar
    this._render();

    // Retraduire la toolbar quand la langue change
    if (typeof i18n !== 'undefined') {
      i18n.onLocaleChange(() => this._render());
    }

    // Écouter les changements de plein écran
    document.addEventListener('fullscreenchange', () => this._updateFocusButton());

    // Bind hover events pour navbar auto-hide (une seule fois)
    this._bindNavbarHoverEvents();
  },

  _render() {
    // Supprimer si existe déjà
    const existing = document.querySelector('.floating-toolbar');
    if (existing) existing.remove();

    const _t = PageUtils.getTranslator();
    const toolbar = document.createElement('div');
    toolbar.className = 'floating-toolbar';
    toolbar.innerHTML = `
      <button class="floating-toolbar__btn ${this._isLightMode ? 'floating-toolbar__btn--active' : ''}"
              id="toggle-theme"
              title="${this._isLightMode ? _t('toolbar.darkMode') : _t('toolbar.lightMode')}"
              aria-label="${this._isLightMode ? _t('toolbar.enableDark') : _t('toolbar.enableLight')}">
        ${this._isLightMode ? '🌙' : '☀️'}
      </button>
      <button class="floating-toolbar__btn ${this._isFocusMode ? 'floating-toolbar__btn--active' : ''}"
              id="toggle-focus"
              title="${this._isFocusMode ? _t('toolbar.exitFocus') : _t('toolbar.focusTitle')}"
              aria-label="${this._isFocusMode ? _t('toolbar.exitFocus') : _t('toolbar.enableFocus')}">
        ${this._isFocusMode ? '⛶' : '⛶'}
      </button>
    `;

    document.body.appendChild(toolbar);

    // Bind events
    toolbar.querySelector('#toggle-theme').addEventListener('click', () => this.toggleTheme());
    toolbar.querySelector('#toggle-focus').addEventListener('click', () => this.toggleFocus());

    // Bind navbar pin button (dans la navbar, pas dans la toolbar)
    this._bindNavbarPinButton();
  },

  /**
   * Attache l'événement au bouton pin de la navbar via délégation
   * Utilise la délégation d'événements pour gérer les re-renders
   */
  _bindNavbarPinButton() {
    // Utiliser la délégation d'événements (une seule fois)
    if (!this._navbarPinBound) {
      this._navbarPinBound = true;
      document.addEventListener('click', (e) => {
        const pinBtn = e.target.closest('#navbar-pin-toggle');
        if (pinBtn) {
          this.toggleNavbarPin();
        }
      });
    }
  },

  /**
   * Attache les événements de hover pour l'auto-hide de la navbar
   * Utilise la délégation d'événements (une seule fois)
   */
  _bindNavbarHoverEvents() {
    if (this._navbarHoverBound) return;
    this._navbarHoverBound = true;

    // Zone de détection en haut de l'écran (80px de hauteur)
    const HOVER_ZONE_HEIGHT = 80;

    // Détecter quand la souris est dans la zone du haut ou sur la navbar
    document.addEventListener('mousemove', (e) => {
      if (!this._isFocusMode || this._isNavbarPinned) return;

      const navbar = document.querySelector('.navbar');
      const isInNavbar = navbar && navbar.contains(e.target);
      const isInTopZone = e.clientY <= HOVER_ZONE_HEIGHT;

      if (isInNavbar || isInTopZone) {
        this._showNavbar();
      }
    });

    // Quand la souris quitte la navbar, démarrer le timer
    document.addEventListener('mouseleave', (e) => {
      if (!this._isFocusMode || this._isNavbarPinned) return;

      const navbar = document.querySelector('.navbar');
      if (navbar && e.target === navbar) {
        this._startNavbarHideTimer();
      }
    }, true);

    // Alternative : utiliser mouseout sur le document pour détecter la sortie de zone
    document.addEventListener('mouseout', (e) => {
      if (!this._isFocusMode || this._isNavbarPinned) return;

      const navbar = document.querySelector('.navbar');
      if (!navbar) return;

      // Vérifier si on quitte la navbar ou la zone du haut
      const relatedTarget = e.relatedTarget;
      const isLeavingNavbar = navbar.contains(e.target) && !navbar.contains(relatedTarget);
      const isInTopZone = e.clientY <= HOVER_ZONE_HEIGHT;

      if (isLeavingNavbar && !isInTopZone) {
        this._startNavbarHideTimer();
      }
    });
  },

  /**
   * Affiche la navbar (annule tout timer de masquage)
   */
  _showNavbar() {
    if (this._navbarHideTimeout) {
      clearTimeout(this._navbarHideTimeout);
      this._navbarHideTimeout = null;
    }
    if (!this._isNavbarVisible) {
      this._isNavbarVisible = true;
      document.documentElement.classList.add('navbar-visible');
    }
  },

  /**
   * Démarre le timer pour masquer la navbar après le délai
   */
  _startNavbarHideTimer() {
    if (this._navbarHideTimeout) {
      clearTimeout(this._navbarHideTimeout);
    }
    this._navbarHideTimeout = setTimeout(() => {
      this._hideNavbar();
    }, this._NAVBAR_HIDE_DELAY);
  },

  /**
   * Masque la navbar
   */
  _hideNavbar() {
    this._isNavbarVisible = false;
    this._navbarHideTimeout = null;
    document.documentElement.classList.remove('navbar-visible');
  },

  toggleTheme() {
    this._isLightMode = !this._isLightMode;
    document.documentElement.classList.toggle('light-mode', this._isLightMode);
    localStorage.setItem('tyb_light_mode', this._isLightMode);
    this._render();
  },

  toggleFocus() {
    this._isFocusMode = !this._isFocusMode;
    document.documentElement.classList.toggle('focus-mode', this._isFocusMode);
    localStorage.setItem('tyb_focus_mode', this._isFocusMode);

    // Gérer la classe navbar-pinned
    if (this._isFocusMode && this._isNavbarPinned) {
      document.documentElement.classList.add('navbar-pinned');
    } else {
      document.documentElement.classList.remove('navbar-pinned');
    }

    // Toggle fullscreen
    if (this._isFocusMode) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }

    this._render();
  },

  toggleNavbarPin() {
    this._isNavbarPinned = !this._isNavbarPinned;
    document.documentElement.classList.toggle('navbar-pinned', this._isNavbarPinned);
    localStorage.setItem('tyb_navbar_pinned', this._isNavbarPinned);

    // Gérer la visibilité de la navbar après désépinglage
    if (!this._isNavbarPinned) {
      // Après désépinglage, garder visible puis démarrer le timer
      this._showNavbar();
      this._startNavbarHideTimer();
    } else {
      // Si épinglée, annuler tout timer et cacher l'état visible
      if (this._navbarHideTimeout) {
        clearTimeout(this._navbarHideTimeout);
        this._navbarHideTimeout = null;
      }
      this._isNavbarVisible = false;
      document.documentElement.classList.remove('navbar-visible');
    }

    this._render();
  },

  _updateFocusButton() {
    // Synchroniser l'état avec le mode plein écran réel
    const isFullscreen = !!document.fullscreenElement;
    if (isFullscreen !== this._isFocusMode) {
      this._isFocusMode = isFullscreen;
      document.documentElement.classList.toggle('focus-mode', this._isFocusMode);
      localStorage.setItem('tyb_focus_mode', this._isFocusMode);
      this._render();
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// BADGES SIDEBAR - Barre latérale des badges obtenus
// ═══════════════════════════════════════════════════════════════

const BadgesSidebar = {
  _isPinned: false,
  _isVisible: false,
  _hideTimeout: null,
  _HIDE_DELAY: 1500,
  _HOVER_ZONE_WIDTH: 30, // Pixels de la zone de détection à gauche

  init() {
    // Charger les préférences depuis localStorage
    this._isPinned = localStorage.getItem('tyb_badges_sidebar_pinned') === 'true';

    // Appliquer la classe body si épinglé au démarrage
    if (this._isPinned) {
      document.body.classList.add('badges-sidebar-pinned-active');
    }

    // S'abonner aux changements du player pour mettre à jour les badges
    State.subscribe('player', () => this._render());

    // Créer et insérer la sidebar
    this._render();

    // Bind hover events pour auto-show
    this._bindHoverEvents();
  },

  _render() {
    // Supprimer si existe déjà
    const existing = document.querySelector('.badges-sidebar');
    if (existing) existing.remove();

    // Ne pas afficher si pas de player
    const player = State.get('player');
    if (!player) return;

    const unlockedBadges = player.badges || [];
    const allBadges = typeof BADGES !== 'undefined' ? BADGES : [];

    // Filtrer les badges débloqués
    const earnedBadges = allBadges.filter(b => unlockedBadges.includes(b.id));

    // Grouper par catégorie
    const byCategory = {};
    earnedBadges.forEach(badge => {
      const cat = badge.category || 'other';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(badge);
    });

    // Catégories avec leurs labels
    const _t = PageUtils.getTranslator();
    const categoryLabels = {
      achievement: _t('sidebar.cat.achievement'),
      mastery: _t('sidebar.cat.mastery'),
      streak: _t('sidebar.cat.streak'),
      performance: _t('sidebar.cat.performance'),
      level: _t('sidebar.cat.level'),
      subject: _t('sidebar.cat.subject'),
      other: _t('sidebar.cat.other')
    };

    const sidebar = document.createElement('div');
    sidebar.className = `badges-sidebar ${this._isPinned ? 'badges-sidebar--pinned' : ''} ${this._isVisible ? 'badges-sidebar--visible' : ''}`;
    sidebar.innerHTML = `
      <div class="badges-sidebar__header">
        <h3 class="badges-sidebar__title">🏆 ${_t('sidebar.title')}</h3>
        <div class="badges-sidebar__controls">
          <button class="badges-sidebar__pin-btn ${this._isPinned ? 'badges-sidebar__pin-btn--active' : ''}"
                  id="badges-sidebar-pin"
                  title="${this._isPinned ? _t('sidebar.unpin') : _t('sidebar.pin')}"
                  aria-label="${this._isPinned ? _t('sidebar.unpinSidebar') : _t('sidebar.pinSidebar')}">
            📌
          </button>
          <button class="badges-sidebar__close-btn"
                  id="badges-sidebar-close"
                  title="${_t('common.close')}"
                  aria-label="${_t('sidebar.close')}">
            ✕
          </button>
        </div>
      </div>
      <div class="badges-sidebar__count">
        ${_t('sidebar.count', { earned: earnedBadges.length, total: allBadges.length })}
      </div>
      <div class="badges-sidebar__content">
        ${Object.keys(byCategory).length === 0 ? `
          <p class="badges-sidebar__empty">${_t('sidebar.empty')}</p>
        ` : Object.entries(byCategory).map(([cat, badges]) => `
          <div class="badges-sidebar__category">
            <h4 class="badges-sidebar__category-title">${categoryLabels[cat] || cat}</h4>
            <div class="badges-sidebar__badges">
              ${badges.map(badge => `
                <div class="badges-sidebar__badge badges-sidebar__badge--${badge.rarity || 'common'}"
                     title="${escapeHtml(badge.name)}: ${escapeHtml(badge.description)}">
                  <span class="badges-sidebar__badge-icon">${badge.icon}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
      <div class="badges-sidebar__footer">
        <a href="#/badges" class="badges-sidebar__link">${_t('sidebar.seeAll')}</a>
      </div>
    `;

    document.body.appendChild(sidebar);

    // Bind events
    sidebar.querySelector('#badges-sidebar-pin').addEventListener('click', () => this.togglePin());
    sidebar.querySelector('#badges-sidebar-close').addEventListener('click', () => this.hide());

    // Empêcher la fermeture quand on survole la sidebar
    sidebar.addEventListener('mouseenter', () => this._cancelHideTimer());
    sidebar.addEventListener('mouseleave', () => {
      if (!this._isPinned) {
        this._startHideTimer();
      }
    });
  },

  _bindHoverEvents() {
    if (this._hoverBound) return;
    this._hoverBound = true;

    // Détecter quand la souris est dans la zone gauche
    document.addEventListener('mousemove', (e) => {
      if (this._isPinned) return;

      const sidebar = document.querySelector('.badges-sidebar');
      const isInSidebar = sidebar && sidebar.contains(e.target);
      const isInLeftZone = e.clientX <= this._HOVER_ZONE_WIDTH;

      if (isInSidebar || isInLeftZone) {
        this.show();
      }
    });
  },

  show() {
    if (this._hideTimeout) {
      clearTimeout(this._hideTimeout);
      this._hideTimeout = null;
    }
    if (!this._isVisible) {
      this._isVisible = true;
      const sidebar = document.querySelector('.badges-sidebar');
      if (sidebar) {
        sidebar.classList.add('badges-sidebar--visible');
      }
    }
  },

  hide() {
    this._isVisible = false;
    const sidebar = document.querySelector('.badges-sidebar');
    if (sidebar) {
      sidebar.classList.remove('badges-sidebar--visible');
    }
  },

  _startHideTimer() {
    if (this._hideTimeout) {
      clearTimeout(this._hideTimeout);
    }
    this._hideTimeout = setTimeout(() => {
      this.hide();
    }, this._HIDE_DELAY);
  },

  _cancelHideTimer() {
    if (this._hideTimeout) {
      clearTimeout(this._hideTimeout);
      this._hideTimeout = null;
    }
  },

  togglePin() {
    this._isPinned = !this._isPinned;
    localStorage.setItem('tyb_badges_sidebar_pinned', this._isPinned);

    const sidebar = document.querySelector('.badges-sidebar');
    const pinBtn = document.querySelector('#badges-sidebar-pin');

    if (sidebar) {
      sidebar.classList.toggle('badges-sidebar--pinned', this._isPinned);
    }

    // Toggle body class for browsers without :has() support
    document.body.classList.toggle('badges-sidebar-pinned-active', this._isPinned);

    if (pinBtn) {
      pinBtn.classList.toggle('badges-sidebar__pin-btn--active', this._isPinned);
      pinBtn.title = this._isPinned ? i18n.t('sidebar.unpin') : i18n.t('sidebar.pin');
      pinBtn.setAttribute('aria-label', this._isPinned ? i18n.t('sidebar.unpinSidebar') : i18n.t('sidebar.pinSidebar'));
    }

    // Si on désépingle, démarrer le timer pour cacher
    if (!this._isPinned) {
      this._startHideTimer();
    }
  }
};

// Export pour tests et navigateur
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { App };
}
