/**
 * Router Module
 * Hash router pour navigation SPA
 */

const Router = {
  // Routes enregistrées : { path: handler }
  routes: {},

  // Route actuelle : { path, params }
  currentRoute: null,

  // Référence à la fonction handleRoute (pour removeEventListener)
  _boundHandleRoute: null,

  // Titres des pages pour document.title (clés i18n)
  _pageTitles: {
    '/': 'splash.title',
    '/home': 'nav.home',
    '/explore': 'nav.explore',
    '/deck': 'explore.title',
    '/game': 'game.title',
    '/exam': 'exam.title',
    '/challenge': 'challenges.modeDefi',
    '/session-summary': 'sessionSummary.title',
    '/stats': 'nav.stats',
    '/badges': 'badges.title',
    '/challenges': 'challenges.title',
    '/settings': 'nav.settings',
    '/deck-hub': 'deckHub.title',
    '/deck-editor': 'editor.title',
    '/prompt-generator': 'promptGenerator.title',
    '/multilingual-config': 'multilingual.config',
    '/multilingual-creator': 'multilingual.creator',
    '/tools': 'tools.title'
  },

  /**
   * Enregistre une route avec son handler
   *
   * @param {string} path - Chemin de la route (ex: '/home', '/game')
   * @param {Function} handler - Fonction appelée lors de la navigation (reçoit params)
   */
  register(path, handler) {
    this.routes[path] = handler;
  },

  /**
   * Navigue vers une route (modifie le hash, ajoute une entrée dans l'historique)
   *
   * @param {string} path - Chemin complet (ex: '/game/deck-123')
   */
  navigate(path) {
    window.location.hash = '#' + path;
  },

  /**
   * Remplace la route actuelle (modifie le hash sans ajouter d'entrée dans l'historique)
   * Utile pour les redirections qui ne doivent pas polluer l'historique
   *
   * @param {string} path - Chemin complet (ex: '/game/deck-123')
   */
  replace(path) {
    window.history.replaceState(null, '', '#' + path);
    this._handleRoute();
  },

  /**
   * Initialise le router
   * - Écoute les changements de hash
   * - Gère la route initiale
   */
  init() {
    // Créer une référence liée pour pouvoir la retirer plus tard
    this._boundHandleRoute = this._handleRoute.bind(this);

    // Écouter les changements de hash
    window.addEventListener('hashchange', this._boundHandleRoute);

    // Gérer la route initiale
    this._handleRoute();
  },

  /**
   * Arrête le router (pour les tests)
   * Retire l'écouteur d'événements
   */
  destroy() {
    if (this._boundHandleRoute) {
      window.removeEventListener('hashchange', this._boundHandleRoute);
      this._boundHandleRoute = null;
    }
  },

  /**
   * Parse un hash en extrayant le path et les params
   *
   * @private
   * @param {string} hash - Hash à parser (ex: '#/game/deck-123')
   * @returns {{ path: string, params: string[] }} - Path et paramètres
   *
   * @example
   * _parseHash('#/home') → { path: '/home', params: [] }
   * _parseHash('#/game/deck-123') → { path: '/game', params: ['deck-123'] }
   * _parseHash('#/deck/math/additions') → { path: '/deck', params: ['math', 'additions'] }
   */
  _parseHash(hash) {
    // Retirer le # et découper en segments
    const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;

    // Si vide ou juste '/', retourner / (splash)
    if (!cleanHash || cleanHash === '/' || cleanHash === '') {
      return { path: '/', params: [] };
    }

    // Découper en segments et filtrer les vides
    const segments = cleanHash.split('/').filter(segment => segment !== '');

    // Si aucun segment, retourner / (splash)
    if (segments.length === 0) {
      return { path: '/', params: [] };
    }

    // Premier segment = path, reste = params
    const path = '/' + segments[0];
    const params = segments.slice(1);

    return { path, params };
  },

  /**
   * Met à jour document.title en fonction de la route
   *
   * @private
   * @param {string} path - Chemin de la route
   */
  _updateDocumentTitle(path) {
    const appName = 'Train Your Brain';
    const titleKey = this._pageTitles[path];

    if (titleKey && typeof i18n !== 'undefined') {
      const pageTitle = i18n.t(titleKey);
      document.title = pageTitle !== titleKey ? `${pageTitle} - ${appName}` : appName;
    } else {
      document.title = appName;
    }
  },

  /**
   * Gère la route actuelle
   * - Parse le hash
   * - Appelle le handler correspondant
   * - Redirige vers /home si route inconnue
   *
   * @private
   */
  _handleRoute() {
    // Parser le hash actuel
    const { path, params } = this._parseHash(window.location.hash);

    // Vérifier si la route existe
    const handler = this.routes[path];

    if (handler) {
      // Route trouvée : mettre à jour currentRoute et appeler le handler
      this.currentRoute = { path, params };
      this._updateDocumentTitle(path);
      handler(params);
    } else {
      // Route inconnue : rediriger vers / (splash)
      this.navigate('/');
    }
  }
};

// Export pour tests Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Router;
}
