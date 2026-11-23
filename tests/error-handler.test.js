/**
 * Tests pour le module ErrorHandler
 * Gestion centralisée des erreurs
 */

describe('ErrorHandler Module', () => {

  beforeEach(() => {
    // Réinitialiser l'état
    ErrorHandler._errorHistory = [];
    ErrorHandler._errorCallbacks = [];
    ErrorHandler.config = {
      showToastDuration: 5000,
      enableLogging: false, // Désactiver les logs pendant les tests
      enableGlobalHandlers: false, // Pas de handlers globaux pendant les tests
      maxLogHistory: 50
    };

    // Nettoyer les toasts et modaux existants
    const toastContainer = document.getElementById('error-toast-container');
    if (toastContainer) toastContainer.remove();

    document.querySelectorAll('.error-modal-overlay').forEach(el => el.remove());
  });

  // ═══════════════════════════════════════════════════════════════
  // Configuration et initialisation
  // ═══════════════════════════════════════════════════════════════

  describe('init', () => {
    it('should initialize with default config', () => {
      ErrorHandler.init();
      expect(ErrorHandler.config.showToastDuration).toBe(5000);
      expect(ErrorHandler.config.enableLogging).toBe(false);
    });

    it('should merge custom config', () => {
      ErrorHandler.init({ showToastDuration: 3000, enableLogging: true });
      expect(ErrorHandler.config.showToastDuration).toBe(3000);
      expect(ErrorHandler.config.enableLogging).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Identification des types d'erreurs
  // ═══════════════════════════════════════════════════════════════

  describe('_identifyErrorType', () => {
    it('should identify storage quota error', () => {
      const error = new Error('QuotaExceededError');
      const type = ErrorHandler._identifyErrorType(error, {});
      expect(type).toBe('STORAGE_QUOTA');
    });

    it('should identify storage quota error by name', () => {
      const error = new Error('Storage full');
      error.name = 'QuotaExceededError';
      const type = ErrorHandler._identifyErrorType(error, {});
      expect(type).toBe('STORAGE_QUOTA');
    });

    it('should identify storage corrupted error', () => {
      const error = new Error('localStorage parse error');
      const type = ErrorHandler._identifyErrorType(error, {});
      expect(type).toBe('STORAGE_CORRUPTED');
    });

    it('should identify storage access error', () => {
      const error = new Error('localStorage is not available');
      const type = ErrorHandler._identifyErrorType(error, {});
      expect(type).toBe('STORAGE_ACCESS');
    });

    it('should identify page mount error', () => {
      const error = new Error('Cannot read property of undefined');
      const type = ErrorHandler._identifyErrorType(error, { source: 'page_mount' });
      expect(type).toBe('PAGE_MOUNT');
    });

    it('should default to generic error', () => {
      const error = new Error('Random error');
      const type = ErrorHandler._identifyErrorType(error, {});
      expect(type).toBe('GENERIC');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Gestion des erreurs
  // ═══════════════════════════════════════════════════════════════

  describe('handleError', () => {
    it('should handle Error objects', () => {
      const error = new Error('Test error');
      const result = ErrorHandler.handleError(error);

      expect(result).toBeDefined();
      expect(result.message).toBe('Test error');
      expect(result.type).toBe('GENERIC');
      expect(result.timestamp).toBeDefined();
    });

    it('should handle string errors', () => {
      const result = ErrorHandler.handleError('String error');

      expect(result).toBeDefined();
      expect(result.message).toBe('String error');
    });

    it('should add error to history', () => {
      ErrorHandler.handleError(new Error('Test 1'));
      ErrorHandler.handleError(new Error('Test 2'));

      expect(ErrorHandler._errorHistory.length).toBe(2);
      expect(ErrorHandler._errorHistory[0].message).toBe('Test 2'); // Le plus récent en premier
      expect(ErrorHandler._errorHistory[1].message).toBe('Test 1');
    });

    it('should limit history size', () => {
      ErrorHandler.config.maxLogHistory = 3;

      for (let i = 0; i < 5; i++) {
        ErrorHandler.handleError(new Error(`Error ${i}`));
      }

      expect(ErrorHandler._errorHistory.length).toBe(3);
      expect(ErrorHandler._errorHistory[0].message).toBe('Error 4');
    });

    it('should include context in enriched error', () => {
      const context = { source: 'test', userId: 123 };
      const result = ErrorHandler.handleError(new Error('Test'), context);

      expect(result.context).toEqual(context);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Callbacks
  // ═══════════════════════════════════════════════════════════════
  // Wrappers sécurisés
  // ═══════════════════════════════════════════════════════════════

  describe('safe', () => {
    it('should execute function and return result', () => {
      const result = ErrorHandler.safe(() => 42);
      expect(result).toBe(42);
    });

    it('should catch error and return null', () => {
      const result = ErrorHandler.safe(() => {
        throw new Error('Test error');
      });

      expect(result).toBeNull();
      expect(ErrorHandler._errorHistory.length).toBe(1);
    });

    it('should pass context to error handler', () => {
      ErrorHandler.safe(() => {
        throw new Error('Test');
      }, { source: 'test' });

      expect(ErrorHandler._errorHistory[0].context.source).toBe('test');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // safeMountPage
  // ═══════════════════════════════════════════════════════════════

  describe('safeMountPage', () => {
    let container;

    beforeEach(() => {
      container = document.createElement('div');
      container.id = 'test-container';
      document.body.appendChild(container);
    });

    afterEach(() => {
      container.remove();
    });

    it('should execute mount function successfully', () => {
      let mounted = false;
      const mountFn = () => { mounted = true; };

      const result = ErrorHandler.safeMountPage('testPage', mountFn, container, {});

      expect(result).toBe(true);
      expect(mounted).toBe(true);
    });

    it('should catch mount error and return false', () => {
      const mountFn = () => {
        throw new Error('Mount failed');
      };

      const result = ErrorHandler.safeMountPage('testPage', mountFn, container, {});

      expect(result).toBe(false);
      expect(ErrorHandler._errorHistory.length).toBe(1);
    });

    it('should render error page on failure', () => {
      const mountFn = () => {
        throw new Error('Mount failed');
      };

      ErrorHandler.safeMountPage('testPage', mountFn, container, {});

      expect(container.querySelector('.error-page')).toBeDefined();
      expect(container.innerHTML).toContain('Erreur de chargement');
    });

    it('should include page name in error context', () => {
      const mountFn = () => {
        throw new Error('Mount failed');
      };

      ErrorHandler.safeMountPage('myCustomPage', mountFn, container, {}, ['param1']);

      const error = ErrorHandler._errorHistory[0];
      expect(error.context.pageName).toBe('myCustomPage');
      expect(error.context.params).toEqual(['param1']);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Toast et Modal UI
  // ═══════════════════════════════════════════════════════════════

  describe('showErrorToast', () => {
    it('should create toast container if not exists', () => {
      ErrorHandler.showErrorToast('Test', 'Message');

      const container = document.getElementById('error-toast-container');
      expect(container).toBeDefined();
      expect(container.className).toBe('error-toast-container');
    });

    it('should add toast to DOM', () => {
      ErrorHandler.showErrorToast('Test Title', 'Test Message');

      const toast = document.querySelector('.error-toast');
      expect(toast).toBeDefined();
      expect(toast.innerHTML).toContain('Test Title');
      expect(toast.innerHTML).toContain('Test Message');
    });

    it('should create error toast with correct class', () => {
      ErrorHandler.showErrorToast('Error', 'Message', 'error');

      const toast = document.querySelector('.error-toast--error');
      expect(toast).toBeDefined();
    });

    it('should create warning toast with correct class', () => {
      ErrorHandler.showErrorToast('Warning', 'Message', 'warning');

      const toast = document.querySelector('.error-toast--warning');
      expect(toast).toBeDefined();
    });

    it('should escape HTML in toast content', () => {
      ErrorHandler.showErrorToast('<script>alert("xss")</script>', 'Message');

      const toast = document.querySelector('.error-toast');
      expect(toast.innerHTML).not.toContain('<script>');
      expect(toast.innerHTML).toContain('&lt;script&gt;');
    });
  });

  describe('closeToast', () => {
    it('should remove toast from DOM', (done) => {
      ErrorHandler.showErrorToast('Test', 'Message');
      const toast = document.querySelector('.error-toast');
      const toastId = toast.id;

      ErrorHandler.closeToast(toastId);

      // Attendre l'animation
      setTimeout(() => {
        expect(document.getElementById(toastId)).toBeNull();
        done();
      }, 400);
    });
  });

  describe('showErrorModal', () => {
    it('should add modal to DOM', () => {
      ErrorHandler.showErrorModal('Test Title', 'Test Message', ['Action 1', 'Action 2']);

      const modal = document.querySelector('.error-modal');
      expect(modal).toBeDefined();
      expect(modal.innerHTML).toContain('Test Title');
      expect(modal.innerHTML).toContain('Test Message');
    });

    it('should render action list', () => {
      ErrorHandler.showErrorModal('Title', 'Message', ['Action 1', 'Action 2']);

      const modal = document.querySelector('.error-modal');
      expect(modal.innerHTML).toContain('Action 1');
      expect(modal.innerHTML).toContain('Action 2');
    });

    it('should prevent body scroll', () => {
      ErrorHandler.showErrorModal('Title', 'Message');

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should escape HTML in modal content', () => {
      ErrorHandler.showErrorModal('<script>alert("xss")</script>', 'Message');

      const modal = document.querySelector('.error-modal');
      expect(modal.innerHTML).not.toContain('<script>');
      expect(modal.innerHTML).toContain('&lt;script&gt;');
    });
  });

  describe('closeModal', () => {
    it('should remove modal from DOM', () => {
      ErrorHandler.showErrorModal('Test', 'Message');
      const modal = document.querySelector('.error-modal-overlay');
      const modalId = modal.id;

      ErrorHandler.closeModal(modalId);

      expect(document.getElementById(modalId)).toBeNull();
    });

    it('should restore body scroll', () => {
      ErrorHandler.showErrorModal('Test', 'Message');
      document.body.style.overflow = 'hidden';

      const modalId = document.querySelector('.error-modal-overlay').id;
      ErrorHandler.closeModal(modalId);

      expect(document.body.style.overflow).toBe('');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Historique
  // ═══════════════════════════════════════════════════════════════
  // Utilitaires localStorage
  // ═══════════════════════════════════════════════════════════════

  describe('testLocalStorageAccess', () => {
    it('should return true when localStorage is accessible', () => {
      const result = ErrorHandler.testLocalStorageAccess();
      expect(result).toBe(true);
    });

    // Note: On ne peut pas facilement tester le cas où localStorage n'est pas accessible
    // dans un environnement de test normal
  });

  // ═══════════════════════════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════════════════════════

  describe('échappement HTML des messages', () => {
    it('should escape tags and quotes in the toast (delegates to TextUtils.escapeHtml)', () => {
      ErrorHandler.showErrorToast('<b>T</b>', '<script>alert("xss")</script>');
      const toast = document.querySelector('.error-toast');
      expect(toast.querySelector('script')).toBeNull();
      expect(toast.querySelector('.error-toast__title').textContent).toBe('<b>T</b>');
      expect(toast.querySelector('.error-toast__message').textContent).toBe('<script>alert("xss")</script>');
      expect(toast.innerHTML).toContain('&lt;script&gt;');
    });
  });
});
