/**
 * Tests pour le module Router
 * Hash router pour navigation SPA
 */

describe('Router Module', () => {

  beforeEach(() => {
    // Réinitialiser le hash et les routes avant chaque test
    window.location.hash = '';
    Router.routes = {};
    Router.currentRoute = null;
    Router.destroy();
  });

  afterEach(() => {
    // Nettoyer après chaque test
    Router.destroy();
  });

  // ═══════════════════════════════════════════════════════════════
  // register() - Enregistrement des routes
  // ═══════════════════════════════════════════════════════════════

  describe('register', () => {
    it('should register a route with a handler', () => {
      const handler = () => {};
      Router.register('/home', handler);

      expect(Router.routes['/home']).toBe(handler);
    });

    it('should register multiple routes', () => {
      const handler1 = () => {};
      const handler2 = () => {};
      const handler3 = () => {};

      Router.register('/home', handler1);
      Router.register('/game', handler2);
      Router.register('/stats', handler3);

      expect(Router.routes['/home']).toBe(handler1);
      expect(Router.routes['/game']).toBe(handler2);
      expect(Router.routes['/stats']).toBe(handler3);
    });

    it('should overwrite existing route handler', () => {
      const handler1 = () => {};
      const handler2 = () => {};

      Router.register('/home', handler1);
      Router.register('/home', handler2);

      expect(Router.routes['/home']).toBe(handler2);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // navigate() - Navigation
  // ═══════════════════════════════════════════════════════════════

  describe('navigate', () => {
    it('should change window.location.hash', () => {
      Router.navigate('/home');
      expect(window.location.hash).toBe('#/home');
    });

    it('should handle paths with parameters', () => {
      Router.navigate('/game/deck-123');
      expect(window.location.hash).toBe('#/game/deck-123');
    });

    it('should handle paths with multiple parameters', () => {
      Router.navigate('/deck/math/additions');
      expect(window.location.hash).toBe('#/deck/math/additions');
    });

    it('should handle root path', () => {
      Router.navigate('/');
      expect(window.location.hash).toBe('#/');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _parseHash() - Parsing du hash
  // ═══════════════════════════════════════════════════════════════

  describe('_parseHash', () => {
    it('should parse simple hash without params', () => {
      const result = Router._parseHash('#/home');
      expect(result.path).toBe('/home');
      expect(result.params).toEqual([]);
    });

    it('should parse hash with single param', () => {
      const result = Router._parseHash('#/game/deck-123');
      expect(result.path).toBe('/game');
      expect(result.params).toEqual(['deck-123']);
    });

    it('should parse hash with multiple params', () => {
      const result = Router._parseHash('#/deck/math/additions');
      expect(result.path).toBe('/deck');
      expect(result.params).toEqual(['math', 'additions']);
    });

    it('should handle hash without leading slash', () => {
      const result = Router._parseHash('#home');
      expect(result.path).toBe('/home');
      expect(result.params).toEqual([]);
    });

    it('should handle empty hash', () => {
      const result = Router._parseHash('');
      // Route par défaut = '/' (splash), plus '/home'
      expect(result.path).toBe('/');
      expect(result.params).toEqual([]);
    });

    it('should handle hash with only #', () => {
      const result = Router._parseHash('#');
      // Route par défaut = '/' (splash), plus '/home'
      expect(result.path).toBe('/');
      expect(result.params).toEqual([]);
    });

    it('should handle hash with only #/', () => {
      const result = Router._parseHash('#/');
      // Route par défaut = '/' (splash), plus '/home'
      expect(result.path).toBe('/');
      expect(result.params).toEqual([]);
    });

    it('should filter out empty segments', () => {
      const result = Router._parseHash('#/game//deck-123/');
      expect(result.path).toBe('/game');
      expect(result.params).toEqual(['deck-123']);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _handleRoute() - Gestion des routes
  // ═══════════════════════════════════════════════════════════════

  describe('_handleRoute', () => {
    it('should call registered handler with params', () => {
      let receivedParams = null;

      Router.register('/game', (params) => {
        receivedParams = params;
      });

      window.location.hash = '#/game/deck-123';
      Router._handleRoute();

      expect(receivedParams).toEqual(['deck-123']);
    });

    it('should call handler with empty array if no params', () => {
      let receivedParams = null;

      Router.register('/home', (params) => {
        receivedParams = params;
      });

      window.location.hash = '#/home';
      Router._handleRoute();

      expect(receivedParams).toEqual([]);
    });

    it('should call handler with multiple params', () => {
      let receivedParams = null;

      Router.register('/deck', (params) => {
        receivedParams = params;
      });

      window.location.hash = '#/deck/math/additions';
      Router._handleRoute();

      expect(receivedParams).toEqual(['math', 'additions']);
    });

    it('should redirect to / (splash) for unknown route', () => {
      Router.register('/home', () => {});

      window.location.hash = '#/unknown/route';
      Router._handleRoute();

      expect(window.location.hash).toBe('#/');
    });

    it('should update currentRoute', () => {
      Router.register('/game', () => {});

      window.location.hash = '#/game/deck-123';
      Router._handleRoute();

      expect(Router.currentRoute).toEqual({
        path: '/game',
        params: ['deck-123']
      });
    });

    it('should handle empty hash by defaulting to / (splash)', () => {
      let called = false;

      Router.register('/', () => {
        called = true;
      });

      window.location.hash = '';
      Router._handleRoute();

      expect(called).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getCurrentParams() - Récupération des paramètres actuels
  // ═══════════════════════════════════════════════════════════════
  // init() et destroy() - Cycle de vie
  // ═══════════════════════════════════════════════════════════════

  describe('init and destroy', () => {
    it('should handle route on init', () => {
      let called = false;

      Router.register('/home', () => {
        called = true;
      });

      window.location.hash = '#/home';
      Router.init();

      expect(called).toBe(true);
    });

    it('should respond to hashchange events after init', (done) => {
      let callCount = 0;

      Router.register('/home', () => { callCount++; });
      Router.register('/game', () => { callCount++; });

      Router.init();

      // Attendre que le hashchange se propage
      window.location.hash = '#/game';

      setTimeout(() => {
        expect(callCount).toBeGreaterThan(0);
        done();
      }, 50);
    });

    it('should not respond to hashchange after destroy', (done) => {
      let callCount = 0;

      Router.register('/game', () => { callCount++; });

      Router.init();
      Router.destroy();

      window.location.hash = '#/game';

      setTimeout(() => {
        expect(callCount).toBe(0);
        done();
      }, 50);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Integration Tests - Scénarios réalistes
  // ═══════════════════════════════════════════════════════════════

  describe('integration scenarios', () => {
    it('should handle complete navigation flow', () => {
      const visitedPages = [];

      Router.register('/home', () => visitedPages.push('home'));
      Router.register('/game', (params) => visitedPages.push('game:' + params[0]));
      Router.register('/stats', () => visitedPages.push('stats'));

      Router.init();

      Router.navigate('/game/deck-123');
      Router._handleRoute();

      Router.navigate('/stats');
      Router._handleRoute();

      Router.navigate('/home');
      Router._handleRoute();

      expect(visitedPages).toContain('game:deck-123');
      expect(visitedPages).toContain('stats');
      expect(visitedPages).toContain('home');
    });

    it('should maintain route state correctly', () => {
      Router.register('/deck', () => {});
      Router.register('/home', () => {}); // une route inconnue redirige vers '/'

      Router.navigate('/deck/math/additions');
      Router._handleRoute();

      expect(Router.currentRoute.path).toBe('/deck');
      expect(Router.currentRoute.params).toEqual(['math', 'additions']);

      Router.navigate('/home');
      Router._handleRoute();

      expect(Router.currentRoute.path).toBe('/home');
      expect(Router.currentRoute.params).toEqual([]);
    });
  });
});
