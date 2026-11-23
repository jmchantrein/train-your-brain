/**
 * Module ErrorHandler
 * Gestion centralisée des erreurs avec messages user-friendly
 *
 * Capture les erreurs, affiche des messages clairs et propose
 * des actions de récupération quand c'est possible.
 */

const ErrorHandler = {
  // Configuration
  config: {
    showToastDuration: 5000,    // Durée d'affichage des toasts (ms)
    enableLogging: true,         // Activer les logs console
    enableGlobalHandlers: true,  // Activer les handlers globaux
    maxLogHistory: 50,           // Nombre max d'erreurs à garder en mémoire
    devModePopup: true           // Afficher popup copiable en mode dev
  },

  /**
   * Détecte si l'application tourne en mode développement
   * @returns {boolean} True si mode dev
   */
  isDevMode() {
    if (typeof window === 'undefined') return false;
    const url = window.location.href;
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    return (
      protocol === 'file:' ||
      url.includes('dev.html') ||
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.')
    );
  },

  // Historique des erreurs
  _errorHistory: [],

  // Callbacks pour notifications d'erreurs
  _errorCallbacks: [],

  // Types d'erreurs avec messages user-friendly
  ERROR_TYPES: {
    STORAGE_QUOTA: {
      type: 'storage_quota',
      title: 'Espace de stockage insuffisant',
      message: 'L\'application ne peut plus sauvegarder vos données car l\'espace de stockage est plein.',
      userActions: [
        'Supprimez des decks personnalisés que vous n\'utilisez plus',
        'Exportez vos données et réinitialisez l\'application',
        'Libérez de l\'espace dans votre navigateur'
      ],
      severity: 'critical'
    },
    STORAGE_CORRUPTED: {
      type: 'storage_corrupted',
      title: 'Données corrompues',
      message: 'Certaines données sauvegardées semblent corrompues.',
      userActions: [
        'Rechargez la page pour réessayer',
        'Si le problème persiste, importez une sauvegarde récente',
        'En dernier recours, réinitialisez vos données'
      ],
      severity: 'warning'
    },
    STORAGE_ACCESS: {
      type: 'storage_access',
      title: 'Accès au stockage impossible',
      message: 'L\'application ne peut pas accéder au stockage local. Vos données ne seront pas sauvegardées.',
      userActions: [
        'Vérifiez que votre navigateur autorise le stockage local',
        'Désactivez le mode navigation privée',
        'Vérifiez les paramètres de sécurité de votre navigateur'
      ],
      severity: 'critical'
    },
    PAGE_MOUNT: {
      type: 'page_mount',
      title: 'Erreur de chargement',
      message: 'La page n\'a pas pu se charger correctement.',
      userActions: [
        'Rechargez la page',
        'Retournez à l\'accueil',
        'Si le problème persiste, signalez le bug'
      ],
      severity: 'error'
    },
    GENERIC: {
      type: 'generic',
      title: 'Une erreur s\'est produite',
      message: 'Une erreur inattendue s\'est produite.',
      userActions: [
        'Rechargez la page',
        'Si le problème persiste, contactez le support'
      ],
      severity: 'error'
    }
  },

  /**
   * Initialise le gestionnaire d'erreurs global
   * @param {Object} options - Options de configuration
   */
  init(options = {}) {
    // Appliquer la configuration
    this.config = { ...this.config, ...options };

    // Installer les handlers globaux si activé
    if (this.config.enableGlobalHandlers) {
      this._installGlobalHandlers();
    }

    // Debug log supprimé - utiliser config.enableLogging pour les erreurs seulement
  },

  /**
   * Installe les handlers d'erreurs globaux
   * @private
   */
  _installGlobalHandlers() {
    // Erreurs JavaScript non catchées
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        source: 'window.onerror',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
      // Ne pas empêcher le comportement par défaut
      return false;
    });

    // Promesses rejetées non catchées
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        { source: 'unhandledrejection' }
      );
    });
  },

  /**
   * Gère une erreur de manière centralisée
   * @param {Error|string} error - L'erreur à gérer
   * @param {Object} context - Contexte additionnel
   * @returns {Object} Informations sur l'erreur traitée
   */
  handleError(error, context = {}) {
    // Normaliser l'erreur
    const errorObj = error instanceof Error ? error : new Error(String(error));

    // Identifier le type d'erreur
    const errorType = this._identifyErrorType(errorObj, context);

    // Créer l'objet d'erreur enrichi
    const enrichedError = {
      timestamp: new Date().toISOString(),
      error: errorObj,
      message: errorObj.message,
      stack: errorObj.stack,
      type: errorType,
      context,
      userMessage: this.ERROR_TYPES[errorType]
    };

    // Logger l'erreur
    this._logError(enrichedError);

    // Ajouter à l'historique
    this._addToHistory(enrichedError);

    // Notifier les callbacks
    this._notifyCallbacks(enrichedError);

    // Afficher un message à l'utilisateur
    this._showUserMessage(enrichedError);

    return enrichedError;
  },

  /**
   * Identifie le type d'erreur
   * @private
   * @param {Error} error - L'erreur
   * @param {Object} context - Contexte
   * @returns {string} Type d'erreur
   */
  _identifyErrorType(error, context) {
    const message = error.message || '';
    const name = error.name || '';

    // Erreurs localStorage
    if (message.includes('QuotaExceededError') || name === 'QuotaExceededError') {
      return 'STORAGE_QUOTA';
    }

    if (message.includes('localStorage') || message.includes('storage')) {
      if (message.includes('corrupt') || message.includes('parse')) {
        return 'STORAGE_CORRUPTED';
      }
      return 'STORAGE_ACCESS';
    }

    // Erreurs de montage de page
    if (context.source === 'page_mount') {
      return 'PAGE_MOUNT';
    }

    // Erreur générique par défaut
    return 'GENERIC';
  },

  /**
   * Log l'erreur dans la console
   * @private
   * @param {Object} enrichedError - Erreur enrichie
   */
  _logError(enrichedError) {
    if (!this.config.enableLogging) return;

    const severity = enrichedError.userMessage.severity;
    const logMethod = severity === 'critical' ? 'error' : severity === 'warning' ? 'warn' : 'error';

    console.group(`[ErrorHandler] ${enrichedError.userMessage.title}`);
    console[logMethod]('Message:', enrichedError.message);
    console[logMethod]('Type:', enrichedError.type);
    console[logMethod]('Severity:', severity);
    if (enrichedError.stack) {
      console[logMethod]('Stack:', enrichedError.stack);
    }
    if (Object.keys(enrichedError.context).length > 0) {
      console[logMethod]('Context:', enrichedError.context);
    }
    console.groupEnd();
  },

  /**
   * Ajoute l'erreur à l'historique
   * @private
   * @param {Object} enrichedError - Erreur enrichie
   */
  _addToHistory(enrichedError) {
    this._errorHistory.unshift(enrichedError);

    // Limiter la taille de l'historique
    if (this._errorHistory.length > this.config.maxLogHistory) {
      this._errorHistory = this._errorHistory.slice(0, this.config.maxLogHistory);
    }
  },

  /**
   * Notifie les callbacks enregistrés
   * @private
   * @param {Object} enrichedError - Erreur enrichie
   */
  _notifyCallbacks(enrichedError) {
    this._errorCallbacks.forEach(callback => {
      try {
        callback(enrichedError);
      } catch (e) {
        console.error('[ErrorHandler] Error in callback:', e);
      }
    });
  },

  /**
   * Affiche un message à l'utilisateur
   * @private
   * @param {Object} enrichedError - Erreur enrichie
   */
  _showUserMessage(enrichedError) {
    const { title, message, userActions, severity } = enrichedError.userMessage;

    // En mode dev, afficher une popup détaillée et copiable
    if (this.isDevMode() && this.config.devModePopup) {
      this.showDevErrorPopup(enrichedError);
      return;
    }

    // Pour les erreurs critiques, afficher un modal
    if (severity === 'critical') {
      this.showErrorModal(title, message, userActions);
    } else {
      // Pour les autres, afficher un toast
      this.showErrorToast(title, message, severity);
    }
  },

  /**
   * Affiche un toast d'erreur
   * @param {string} title - Titre du toast
   * @param {string} message - Message
   * @param {string} severity - Sévérité (error, warning)
   */
  showErrorToast(title, message, severity = 'error') {
    const toastId = `error-toast-${Date.now()}`;
    const severityClass = severity === 'warning' ? 'warning' : 'error';

    const toastHtml = `
      <div class="error-toast error-toast--${severityClass}" id="${toastId}">
        <div class="error-toast__icon">
          ${severity === 'warning' ? '⚠️' : '❌'}
        </div>
        <div class="error-toast__content">
          <div class="error-toast__title">${TextUtils.escapeHtml(title)}</div>
          <div class="error-toast__message">${TextUtils.escapeHtml(message)}</div>
        </div>
        <button class="error-toast__close" data-error-action="close-toast" data-target="${toastId}" aria-label="Fermer">
          ×
        </button>
      </div>
    `;

    // Insérer le toast dans le DOM
    let container = document.getElementById('error-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'error-toast-container';
      container.className = 'error-toast-container';
      document.body.appendChild(container);
    }

    container.insertAdjacentHTML('beforeend', toastHtml);
    this._bindActions(document.getElementById(toastId));

    // Auto-fermeture après délai
    setTimeout(() => {
      this.closeToast(toastId);
    }, this.config.showToastDuration);
  },

  /**
   * Ferme un toast
   * @param {string} toastId - ID du toast à fermer
   */
  closeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
      toast.classList.add('error-toast--closing');
      setTimeout(() => toast.remove(), 300);
    }
  },

  /**
   * Affiche un modal d'erreur
   * @param {string} title - Titre du modal
   * @param {string} message - Message
   * @param {string[]} actions - Actions suggérées
   */
  showErrorModal(title, message, actions = []) {
    const modalId = `error-modal-${Date.now()}`;

    const actionsHtml = actions.length > 0 ? `
      <div class="error-modal__actions">
        <h4>Actions suggérées :</h4>
        <ul>
          ${actions.map(action => `<li>${TextUtils.escapeHtml(action)}</li>`).join('')}
        </ul>
      </div>
    ` : '';

    const modalHtml = `
      <div class="error-modal-overlay" id="${modalId}">
        <div class="error-modal">
          <div class="error-modal__header">
            <div class="error-modal__icon">❌</div>
            <h3 class="error-modal__title">${TextUtils.escapeHtml(title)}</h3>
          </div>
          <div class="error-modal__body">
            <p class="error-modal__message">${TextUtils.escapeHtml(message)}</p>
            ${actionsHtml}
          </div>
          <div class="error-modal__footer">
            <button class="btn btn--primary" data-error-action="close-modal" data-target="${modalId}">
              Fermer
            </button>
            <button class="btn btn--secondary" data-error-action="reload">
              Recharger la page
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    this._bindActions(document.getElementById(modalId));

    // Empêcher le scroll du body
    document.body.style.overflow = 'hidden';
  },

  /**
   * Ferme un modal
   * @param {string} modalId - ID du modal à fermer
   */
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.remove();
      document.body.style.overflow = '';
    }
  },

  /**
   * Affiche une popup d'erreur détaillée en mode dev avec contenu copiable
   * @param {Object} enrichedError - Erreur enrichie
   */
  showDevErrorPopup(enrichedError) {
    const modalId = `dev-error-popup-${Date.now()}`;

    // Formater le contenu copiable
    const copyableContent = this._formatErrorForCopy(enrichedError);

    const modalHtml = `
      <div class="error-modal-overlay dev-error-popup" id="${modalId}">
        <div class="error-modal error-modal--dev">
          <div class="error-modal__header error-modal__header--dev">
            <div class="error-modal__icon">🐛</div>
            <h3 class="error-modal__title">Erreur (Mode Dev)</h3>
            <span class="dev-error-popup__badge">${TextUtils.escapeHtml(enrichedError.type)}</span>
          </div>
          <div class="error-modal__body">
            <div class="dev-error-popup__message">
              <strong>${TextUtils.escapeHtml(enrichedError.userMessage.title)}</strong>
              <p>${TextUtils.escapeHtml(enrichedError.message)}</p>
            </div>
            <div class="dev-error-popup__copy-section">
              <label for="dev-error-content">Contenu copiable :</label>
              <textarea
                id="dev-error-content"
                class="dev-error-popup__textarea"
                readonly
                rows="12"
              >${TextUtils.escapeHtml(copyableContent)}</textarea>
              <button
                class="btn btn--secondary dev-error-popup__copy-btn"
                data-error-action="copy" data-target="dev-error-content"
              >
                📋 Copier
              </button>
            </div>
          </div>
          <div class="error-modal__footer">
            <button class="btn btn--primary" data-error-action="close-modal" data-target="${modalId}">
              Fermer
            </button>
            <button class="btn btn--secondary" data-error-action="reload">
              Recharger
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    this._bindActions(document.getElementById(modalId));
    document.body.style.overflow = 'hidden';

    // Focus sur le textarea pour faciliter la copie
    setTimeout(() => {
      const textarea = document.getElementById('dev-error-content');
      if (textarea) textarea.select();
    }, 100);
  },

  /**
   * Formate une erreur pour copier/coller
   * @private
   * @param {Object} enrichedError - Erreur enrichie
   * @returns {string} Texte formaté
   */
  _formatErrorForCopy(enrichedError) {
    const lines = [
      `=== ERREUR ===`,
      `Type: ${enrichedError.type}`,
      `Message: ${enrichedError.message}`,
      `Timestamp: ${enrichedError.timestamp}`,
      ``,
      `=== CONTEXTE ===`,
      JSON.stringify(enrichedError.context, null, 2),
      ``,
      `=== STACK TRACE ===`,
      enrichedError.stack || '(pas de stack trace)',
      ``,
      `=== INFO NAVIGATEUR ===`,
      `URL: ${window.location.href}`,
      `UserAgent: ${navigator.userAgent}`
    ];
    return lines.join('\n');
  },

  /**
   * Copie le contenu d'un textarea dans le presse-papier
   * @param {string} textareaId - ID du textarea
   */
  copyDevError(textareaId) {
    const textarea = document.getElementById(textareaId);
    if (!textarea) return;

    textarea.select();
    textarea.setSelectionRange(0, 99999); // Pour mobile

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textarea.value).then(() => {
          this._showCopyFeedback(textarea, true);
        }).catch(() => {
          // Fallback
          document.execCommand('copy');
          this._showCopyFeedback(textarea, true);
        });
      } else {
        document.execCommand('copy');
        this._showCopyFeedback(textarea, true);
      }
    } catch (e) {
      this._showCopyFeedback(textarea, false);
    }
  },

  /**
   * Affiche un feedback après copie
   * @private
   */
  _showCopyFeedback(textarea, success) {
    const btn = textarea.parentElement.querySelector('.dev-error-popup__copy-btn');
    if (btn) {
      const originalText = btn.textContent;
      btn.textContent = success ? '✅ Copié !' : '❌ Échec';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 2000);
    }
  },

  /**
   * Wrapper sécurisé pour exécuter une fonction avec gestion d'erreur
   * @param {Function} fn - Fonction à exécuter
   * @param {Object} context - Contexte pour les erreurs
   * @returns {*} Résultat de la fonction ou null en cas d'erreur
   */
  safe(fn, context = {}) {
    try {
      return fn();
    } catch (error) {
      this.handleError(error, context);
      return null;
    }
  },

  /**
   * Wrapper pour le montage de pages avec gestion d'erreurs
   * @param {string} pageName - Nom de la page
   * @param {Function} mountFn - Fonction de montage
   * @param {HTMLElement} container - Container DOM
   * @param {Object} state - État de l'application
   * @param {Array} params - Paramètres de la page
   * @returns {boolean} True si le montage a réussi
   */
  safeMountPage(pageName, mountFn, container, state, params = []) {
    try {
      mountFn(container, state, params);
      return true;
    } catch (error) {
      // Gérer l'erreur
      this.handleError(error, {
        source: 'page_mount',
        pageName,
        params
      });

      // Afficher une page d'erreur de fallback
      this._renderErrorPage(container, pageName, error);
      return false;
    }
  },

  /**
   * Affiche une page d'erreur de fallback
   * @private
   * @param {HTMLElement} container - Container DOM
   * @param {string} pageName - Nom de la page qui a échoué
   * @param {Error} error - L'erreur
   */
  _renderErrorPage(container, pageName, error) {
    container.innerHTML = `
      <div class="error-page">
        <div class="error-page__icon">😞</div>
        <h1 class="error-page__title">Erreur de chargement</h1>
        <p class="error-page__message">
          La page "${TextUtils.escapeHtml(pageName)}" n'a pas pu se charger correctement.
        </p>
        ${this.config.enableLogging ? `
          <details class="error-page__details">
            <summary>Détails techniques</summary>
            <pre>${TextUtils.escapeHtml(error.stack || error.message)}</pre>
          </details>
        ` : ''}
        <div class="error-page__actions">
          <button class="btn btn--primary" data-error-action="home">
            Retour à l'accueil
          </button>
          <button class="btn btn--secondary" data-error-action="reload">
            Recharger la page
          </button>
        </div>
      </div>
    `;
    this._bindActions(container);
  },

  /**
   * Relie les boutons [data-error-action] d'un fragment généré (la CSP de index.html interdit les
   * gestionnaires en ligne onclick="...").
   * @private
   * @param {Element|null} root - Élément contenant les boutons
   */
  _bindActions(root) {
    if (!root) return;
    root.querySelectorAll('[data-error-action]').forEach(button => {
      button.addEventListener('click', () => {
        const target = button.dataset.target;
        switch (button.dataset.errorAction) {
          case 'close-toast': this.closeToast(target); break;
          case 'close-modal': this.closeModal(target); break;
          case 'copy': this.copyDevError(target); break;
          case 'reload': location.reload(); break;
          case 'home': Router.navigate('/home'); break;
        }
      });
    });
  },

  /**
   * Teste si localStorage est accessible
   * @returns {boolean} True si accessible
   */
  testLocalStorageAccess() {
    try {
      const testKey = '__tyb_storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }
};

// Export pour tests et navigateur
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ErrorHandler };
}
