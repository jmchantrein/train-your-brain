/**
 * Module Storage
 * Gestion de la persistence avec localStorage
 *
 * Fournit une API pour sauvegarder/charger :
 * - Données du joueur
 * - Progression des decks
 * - Paramètres
 * - Export/Import complet
 */

const Storage = {
  // Clés localStorage
  KEYS: {
    PLAYERS_LIST: 'tyb_players_list',
    CURRENT_PLAYER: 'tyb_current_player',
    PLAYER: 'tyb_player',           // Legacy (backward compat)
    PLAYER_PREFIX: 'tyb_player_',   // Multi-player: tyb_player_{id}
    DECKS_PREFIX: 'tyb_deck_',      // Legacy (global)
    PLAYER_DECKS_PREFIX: 'tyb_pdeck_', // Per-player: tyb_pdeck_{playerId}_{deckId}
    CUSTOM_DECKS: 'tyb_custom_decks', // Index des decks importés (métadonnées légères)
    CUSTOM_DECK_PREFIX: 'tyb_cdeck_', // Stockage individuel: tyb_cdeck_{deckId}
    AUDIO_PREFIX: 'tyb_audio_',       // Audios séparés: tyb_audio_{deckId}_{wordId}_{lang}
    TRASH_DECKS: 'tyb_trash_decks',   // Corbeille de decks (soft delete)
    SETTINGS: 'tyb_settings',
    HIDDEN_DECKS: 'tyb_hidden_decks', // Decks masqués
    PLAYER_SYNC_PREFIX: 'tyb_psync_', // Marqueur: clé par joueur à jour (tyb_psync_{id})
    BACKUP_PREFIX: 'tyb_backup_'    // Backups: tyb_backup_{key}
  },

  // Configuration quota (modifiable via configure())
  QUOTA: {
    MAX_SIZE: 50 * 1024 * 1024,    // 50 MB par défaut
    WARNING_THRESHOLD: 0.8,         // Avertir à 80% d'utilisation
    CRITICAL_THRESHOLD: 0.95        // Critique à 95%
  },

  // Configuration compression
  COMPRESSION: {
    enabled: true,                   // Activer la compression par défaut
    minSizeForCompression: 100      // Taille minimale (bytes) pour compresser
  },

  /**
   * Configure les paramètres du module Storage
   * @param {Object} options - Options de configuration
   * @param {number} [options.maxSize] - Taille max en bytes (défaut: 50MB)
   * @param {number} [options.warningThreshold] - Seuil d'avertissement 0-1 (défaut: 0.8)
   * @param {number} [options.criticalThreshold] - Seuil critique 0-1 (défaut: 0.95)
   * @param {boolean} [options.compressionEnabled] - Activer la compression (défaut: true)
   * @param {number} [options.minSizeForCompression] - Taille min pour compression en bytes (défaut: 100)
   */
  configure(options = {}) {
    if (typeof options.maxSize === 'number' && options.maxSize > 0) {
      this.QUOTA.MAX_SIZE = options.maxSize;
    }
    if (typeof options.warningThreshold === 'number' && options.warningThreshold > 0 && options.warningThreshold < 1) {
      this.QUOTA.WARNING_THRESHOLD = options.warningThreshold;
    }
    if (typeof options.criticalThreshold === 'number' && options.criticalThreshold > 0 && options.criticalThreshold <= 1) {
      this.QUOTA.CRITICAL_THRESHOLD = options.criticalThreshold;
    }
    if (typeof options.compressionEnabled === 'boolean') {
      this.COMPRESSION.enabled = options.compressionEnabled;
    }
    if (typeof options.minSizeForCompression === 'number' && options.minSizeForCompression >= 0) {
      this.COMPRESSION.minSizeForCompression = options.minSizeForCompression;
    }
  },

  // Callbacks pour notifications quota
  _quotaWarningCallbacks: [],
  _quotaErrorCallbacks: [],

  // Callbacks pour les récupérations depuis une copie de secours
  _recoveryCallbacks: [],

  // ═══════════════════════════════════════════
  // COMPRESSION HELPERS
  // ═══════════════════════════════════════════

  /**
   * Compresse des données JSON si la compression est activée
   * @private
   * @param {string} jsonData - Données JSON stringifiées
   * @returns {string} Données compressées ou originales
   */
  _compressData(jsonData) {
    // Vérifier si la compression est activée
    if (!this.COMPRESSION.enabled) {
      return jsonData;
    }

    // Ne pas compresser si les données sont trop petites
    if (jsonData.length * 2 < this.COMPRESSION.minSizeForCompression) {
      return jsonData;
    }

    // Vérifier si le module Compression est disponible
    if (typeof Compression === 'undefined' || !Compression.compress) {
      console.warn('[Storage] Compression module not available, storing uncompressed');
      return jsonData;
    }

    try {
      return Compression.compress(jsonData);
    } catch (e) {
      console.error('[Storage] Compression error:', e);
      // En cas d'erreur, retourner les données non compressées
      return jsonData;
    }
  },

  /**
   * Décompresse des données (migration transparente des anciennes données)
   * @private
   * @param {string} data - Données potentiellement compressées
   * @returns {string} Données décompressées
   */
  _decompressData(data) {
    if (!data) {
      return data;
    }

    // Vérifier si le module Compression est disponible
    if (typeof Compression === 'undefined' || !Compression.decompress) {
      // Si le module n'est pas disponible, retourner tel quel
      return data;
    }

    try {
      // La fonction decompress gère automatiquement les données non compressées
      return Compression.decompress(data);
    } catch (e) {
      console.error('[Storage] Decompression error:', e);
      // En cas d'erreur, retourner les données brutes
      return data;
    }
  },

  // ═══════════════════════════════════════════
  // QUOTA MANAGEMENT
  // ═══════════════════════════════════════════

  /**
   * Estime l'utilisation actuelle du localStorage
   * @returns {{ used: number, total: number, percentage: number }}
   */
  getStorageUsage() {
    let used = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          // Chaque caractère = 2 bytes en UTF-16
          used += (key.length + (localStorage.getItem(key) || '').length) * 2;
        }
      }
    } catch (e) {
      console.error('[Storage] getStorageUsage error:', e);
    }
    return {
      used,
      total: this.QUOTA.MAX_SIZE,
      percentage: used / this.QUOTA.MAX_SIZE,
      usedMB: (used / (1024 * 1024)).toFixed(2),
      totalMB: (this.QUOTA.MAX_SIZE / (1024 * 1024)).toFixed(2)
    };
  },

  /**
   * Vérifie si on peut sauvegarder des données de la taille spécifiée
   * @param {number} dataSize - Taille des données à sauvegarder (en bytes)
   * @returns {{ canSave: boolean, reason: (string|undefined), usage: Object }}
   */
  checkQuota(dataSize) {
    const usage = this.getStorageUsage();
    const newUsage = (usage.used + dataSize) / this.QUOTA.MAX_SIZE;

    // Vérifier si on dépasse le quota
    if (newUsage >= 1) {
      return {
        canSave: false,
        reason: 'quota_exceeded',
        message: `Espace de stockage insuffisant. Utilisé: ${usage.usedMB}MB / ${usage.totalMB}MB`,
        usage
      };
    }

    // Notifier si on atteint le seuil critique
    if (newUsage >= this.QUOTA.CRITICAL_THRESHOLD) {
      this._notifyQuotaWarning('critical', usage);
      return {
        canSave: true,
        reason: 'critical_threshold',
        message: `Attention: Stockage presque plein (${Math.round(newUsage * 100)}%)`,
        usage
      };
    }

    // Notifier si on atteint le seuil d'avertissement
    if (newUsage >= this.QUOTA.WARNING_THRESHOLD) {
      this._notifyQuotaWarning('warning', usage);
      return {
        canSave: true,
        reason: 'warning_threshold',
        message: `Stockage utilisé à ${Math.round(newUsage * 100)}%`,
        usage
      };
    }

    return { canSave: true, usage };
  },

  /**
   * Tente de sauvegarder avec vérification du quota
   * @param {string} key - Clé localStorage
   * @param {string} data - Données JSON stringifiées
   * @returns {{ success: boolean, error: (string|undefined) }}
   */
  _saveWithQuotaCheck(key, data) {
    // Calculer la taille (clé + données en UTF-16)
    const dataSize = (key.length + data.length) * 2;

    // Soustraire la taille de l'ancien élément si existant
    const existingData = localStorage.getItem(key);
    const existingSize = existingData ? (key.length + existingData.length) * 2 : 0;
    const netSize = dataSize - existingSize;

    const quotaCheck = this.checkQuota(netSize);

    if (!quotaCheck.canSave) {
      this._notifyQuotaError(quotaCheck);
      return { success: false, error: quotaCheck.message };
    }

    try {
      localStorage.setItem(key, data);
      return { success: true };
    } catch (e) {
      // Erreur réelle de quota (plus précise que notre estimation)
      // 22 / QuotaExceededError : standard ; 1014 / NS_ERROR_DOM_QUOTA_REACHED : Firefox
      if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014) {
        const errorResult = {
          success: false,
          error: 'Quota localStorage dépassé. Libérez de l\'espace.',
          originalError: e
        };
        this._notifyQuotaError(errorResult);
        return errorResult;
      }
      throw e;
    }
  },

  /**
   * Enregistre un callback pour les avertissements de quota
   * @param {Function} callback - Fonction(level, usage)
   */
  onQuotaWarning(callback) {
    this._quotaWarningCallbacks.push(callback);
  },

  /**
   * Enregistre un callback pour les erreurs de quota
   * @param {Function} callback - Fonction(error)
   */
  onQuotaError(callback) {
    this._quotaErrorCallbacks.push(callback);
  },

  /**
   * Notifie les callbacks d'avertissement
   * @private
   */
  _notifyQuotaWarning(level, usage) {
    this._quotaWarningCallbacks.forEach(cb => {
      try {
        cb(level, usage);
      } catch (e) {
        console.error('[Storage] Quota warning callback error:', e);
      }
    });
  },

  /**
   * Notifie les callbacks d'erreur
   * @private
   */
  _notifyQuotaError(error) {
    this._quotaErrorCallbacks.forEach(cb => {
      try {
        cb(error);
      } catch (e) {
        console.error('[Storage] Quota error callback error:', e);
      }
    });
  },

  // ═══════════════════════════════════════════
  // BACKUP SYSTEM
  // ═══════════════════════════════════════════

  /**
   * Crée un backup d'une clé localStorage avant une opération critique
   * @param {string} key - Clé à sauvegarder
   * @returns {{ success: boolean, backupKey: (string|undefined) }}
   */
  createBackup(key) {
    try {
      const existingData = localStorage.getItem(key);
      if (!existingData) {
        // Rien à sauvegarder
        return { success: true, backupKey: null };
      }

      const backupKey = this.KEYS.BACKUP_PREFIX + key;
      const backupData = JSON.stringify({
        timestamp: new Date().toISOString(),
        data: existingData
      });

      // Sauvegarder directement (bypass quota check pour backup)
      localStorage.setItem(backupKey, backupData);

      return { success: true, backupKey };
    } catch (e) {
      console.error('[Storage] createBackup error:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Restaure les données depuis un backup
   * @param {string} key - Clé originale à restaurer
   * @returns {{ success: boolean, restored: (boolean|undefined) }}
   */
  restoreFromBackup(key) {
    try {
      const backupKey = this.KEYS.BACKUP_PREFIX + key;
      const backupData = localStorage.getItem(backupKey);

      if (!backupData) {
        return { success: false, error: 'No backup found' };
      }

      const { data, timestamp } = JSON.parse(backupData);
      if (!data) {
        return { success: false, error: 'Invalid backup data' };
      }

      // Restaurer les données
      localStorage.setItem(key, data);
      console.warn(`[Storage] Restored ${key} from backup (${timestamp})`);

      return { success: true, restored: true, timestamp };
    } catch (e) {
      console.error('[Storage] restoreFromBackup error:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Sauvegarde avec backup automatique pour opérations critiques
   * @param {string} key - Clé localStorage
   * @param {string} data - Données JSON stringifiées
   * @param {boolean} createBackupFirst - Créer un backup avant
   * @returns {{ success: boolean, error: (string|undefined), backupCreated: (boolean|undefined) }}
   */
  _saveWithBackup(key, data, createBackupFirst = true) {
    let backupCreated = false;

    // Créer le backup si demandé
    if (createBackupFirst) {
      const backupResult = this.createBackup(key);
      backupCreated = backupResult.success && backupResult.backupKey !== null;
    }

    // Effectuer la sauvegarde avec vérification quota
    const saveResult = this._saveWithQuotaCheck(key, data);

    if (saveResult.success) {
      // Sauvegarde réussie : supprimer le backup (optionnel, on peut le garder)
      // Pour l'instant on le garde jusqu'au prochain save réussi
      return { success: true, backupCreated };
    } else {
      // Échec : le backup est conservé pour récupération
      console.warn(`[Storage] Save failed for ${key}, backup available`);
      return {
        success: false,
        error: saveResult.error,
        backupCreated,
        backupAvailable: backupCreated
      };
    }
  },

  // ═══════════════════════════════════════════
  // RÉCUPÉRATION DEPUIS LES COPIES DE SECOURS
  // ═══════════════════════════════════════════

  /**
   * Enregistre un callback appelé quand une donnée a été restaurée depuis sa copie de secours
   * @param {Function} callback - Fonction(key)
   */
  onRecovery(callback) {
    this._recoveryCallbacks.push(callback);
  },

  /**
   * Notifie les abonnés d'une restauration
   * @private
   * @param {string} key - Clé restaurée
   */
  _notifyRecovery(key) {
    this._recoveryCallbacks.forEach(cb => {
      try {
        cb(key);
      } catch (e) {
        console.error('[Storage] Recovery callback error:', e);
      }
    });
  },

  /**
   * Lit une valeur persistée ; si elle est inutilisable (absente, JSON illisible,
   * décompression en échec, structure rejetée), retombe sur sa copie de secours
   * `tyb_backup_{clé}`, la réécrit comme valeur courante et le signale (onRecovery).
   * Une valeur courante exploitable n'est JAMAIS remplacée. Une copie de secours
   * illisible ou rejetée est ignorée sans erreur et sans rien écrire.
   * @private
   * @param {string} key - Clé localStorage
   * @param {function(string, boolean): *} parse - Reçoit la valeur brute (et true pour une copie
   *   de secours) ; retourne la valeur exploitable, ou null / lève si elle ne l'est pas
   * @param {function(*): boolean} [acceptRecovered] - Filtre supplémentaire, appliqué seulement
   *   à une valeur issue de la copie de secours
   * @returns {{ value: *, recovered: boolean, raw: (string|null) }} value vaut null si rien d'exploitable
   */
  _readWithRecovery(key, parse, acceptRecovered) {
    let raw = null;
    try {
      raw = localStorage.getItem(key);
    } catch (e) {
      return { value: null, recovered: false, raw: null };
    }

    if (raw !== null && raw !== '') {
      try {
        const value = parse(raw, false);
        if (value !== null && value !== undefined) {
          return { value, recovered: false, raw };
        }
      } catch (e) {
        console.warn('[Storage] Unreadable value for', key, '- trying backup:', e.message);
      }
    }

    // Valeur courante inutilisable : tenter la copie de secours
    try {
      const backupRaw = localStorage.getItem(this.KEYS.BACKUP_PREFIX + key);
      if (!backupRaw) return { value: null, recovered: false, raw };
      const backup = JSON.parse(backupRaw);
      if (!backup || typeof backup.data !== 'string' || backup.data === '') {
        return { value: null, recovered: false, raw };
      }
      const value = parse(backup.data, true);
      if (value === null || value === undefined) return { value: null, recovered: false, raw };
      if (acceptRecovered && !acceptRecovered(value)) return { value: null, recovered: false, raw };

      const restored = this.restoreFromBackup(key);
      if (restored.success) {
        this._notifyRecovery(key);
      }
      return { value, recovered: restored.success, raw: backup.data };
    } catch (e) {
      // Copie de secours illisible : ignorée
      return { value: null, recovered: false, raw };
    }
  },

  /**
   * Supprime une clé et sa copie de secours (suppression volontaire : la copie ne doit pas
   * ressusciter la donnée au prochain chargement)
   * @private
   * @param {string} key - Clé localStorage
   */
  _removeWithBackup(key) {
    localStorage.removeItem(key);
    localStorage.removeItem(this.KEYS.BACKUP_PREFIX + key);
  },

  // ═══════════════════════════════════════════
  // MESSAGES AU JOUEUR (abonné par défaut)
  // ═══════════════════════════════════════════

  // Messages déjà affichés pendant cette session (quota : un par niveau, pas un par écriture)
  _userNotices: { quotaWarning: false, quotaError: false, recoveryPending: false },

  /**
   * Exécute `fn` après la fin du démarrage synchrone (la langue du joueur est alors appliquée).
   * Remplaçable dans les tests.
   * @private
   * @param {Function} fn
   */
  _defer(fn) {
    if (typeof setTimeout === 'function') setTimeout(fn, 0);
    else fn();
  },

  /**
   * Remet à zéro les messages déjà affichés (tests)
   * @private
   */
  _resetUserNotices() {
    this._userNotices = { quotaWarning: false, quotaError: false, recoveryPending: false };
  },

  /**
   * Affiche un message au joueur par le mécanisme d'annonce de l'application
   * (A11y.announce : région live + toast visuel). Sans effet si A11y ou i18n sont absents.
   * @private
   * @param {string} textKey - Clé i18n
   * @param {string} type - 'info' | 'error'
   * @param {number} [duration] - Durée d'affichage en ms
   */
  _showUserNotice(textKey, type, duration) {
    if (typeof A11y === 'undefined' || typeof A11y.announce !== 'function') return;
    if (typeof i18n === 'undefined' || typeof i18n.t !== 'function') return;
    try {
      A11y.announce(i18n.t(textKey), { visual: true, type, duration });
    } catch (e) {
      console.error('[Storage] user notice error:', e);
    }
  },

  /**
   * Abonné par défaut de onQuotaWarning (reçoit le niveau, une chaîne) et de onQuotaError
   * (reçoit l'erreur, un objet). Un message par session et par type : le joueur n'est pas
   * prévenu à chaque écriture.
   * @private
   * @param {(string|Object)} arg
   */
  _defaultQuotaHandler(arg) {
    const isWarning = typeof arg === 'string';
    const flag = isWarning ? 'quotaWarning' : 'quotaError';
    if (this._userNotices[flag]) return;
    this._userNotices[flag] = true;
    this._showUserNotice(isWarning ? 'storage.quotaWarning' : 'storage.quotaError', isWarning ? 'info' : 'error', 12000);
  },

  /**
   * Abonné par défaut de onRecovery : un seul message discret, même si plusieurs clés
   * sont restaurées au même chargement
   * @private
   */
  _defaultRecoveryHandler() {
    if (this._userNotices.recoveryPending) return;
    this._userNotices.recoveryPending = true;
    this._defer(() => {
      this._userNotices.recoveryPending = false;
      this._showUserNotice('storage.recovered', 'info');
    });
  },

  /**
   * Abonne les gestionnaires par défaut (idempotent : un seul abonné par événement)
   * @private
   */
  _installDefaultNotifiers() {
    if (!this._defaultHandlers) {
      this._defaultHandlers = {
        quota: (arg) => this._defaultQuotaHandler(arg),
        recovery: () => this._defaultRecoveryHandler()
      };
    }
    const h = this._defaultHandlers;
    if (!this._quotaWarningCallbacks.includes(h.quota)) this.onQuotaWarning(h.quota);
    if (!this._quotaErrorCallbacks.includes(h.quota)) this.onQuotaError(h.quota);
    if (!this._recoveryCallbacks.includes(h.recovery)) this.onRecovery(h.recovery);
  },

  // ═══════════════════════════════════════════
  // SCHEMA VALIDATION
  // ═══════════════════════════════════════════

  /**
   * Schémas de validation pour les données
   */
  SCHEMAS: {
    player: {
      required: ['id', 'name', 'createdAt'],
      types: {
        id: 'string',
        name: 'string',
        createdAt: 'string',
        stats: 'object',
        badges: 'array',
        settings: 'object'
      }
    },
    playerStats: {
      required: ['totalXP'],
      types: {
        totalXP: 'number',
        totalCardsPlayed: 'number',
        totalSessions: 'number',
        currentStreak: 'number',
        longestStreak: 'number',
        longestGreenStreak: 'number',
        lastPlayedAt: ['string', 'null']
      },
      defaults: {
        totalXP: 0,
        totalCardsPlayed: 0,
        totalSessions: 0,
        currentStreak: 0,
        longestStreak: 0,
        longestGreenStreak: 0
      }
    },
    deckProgress: {
      required: ['id', 'box'],
      types: {
        id: 'string',
        box: 'string',
        latencyThreshold: ['number', 'null'],
        bestResponseTimeMs: ['number', 'null'],
        lastResponseTimeMs: ['number', 'null'],
        restUntil: ['string', 'null'],
        timesPlayed: 'number',
        timesCorrect: 'number'
      },
      enums: {
        box: ['never_played', 'purple', 'orange', 'green']
      }
    },
    settings: {
      required: [],
      types: {
        soundEnabled: 'boolean',
        theme: 'string',
        language: 'string'
      }
    }
  },

  // ───────────────────────────────────────────
  // SANITISATION (types.js = source de vérité)
  // Les données importées (JSON, YAML) ou déjà présentes en localStorage sont une entrée
  // non fiable : chaque champ est ramené à son type attendu avant d'être utilisé ou affiché.
  // ───────────────────────────────────────────

  /** Clés qui ne doivent jamais être copiées d'un objet non fiable (pollution de prototype) */
  _UNSAFE_KEYS: ['__proto__', 'constructor', 'prototype'],

  /** Compteurs du joueur (nombres finis >= 0) ; les sept premiers existent toujours (défaut 0) */
  _STATS_REQUIRED_COUNTERS: ['totalXP', 'totalCardsPlayed', 'totalSessions', 'currentStreak',
    'longestStreak', 'longestGreenStreak', 'totalGreenCards'],
  _STATS_OPTIONAL_COUNTERS: ['uniqueDecksPlayed', 'fastAnswers', 'nightSessions', 'earlySessions',
    'perfectSessions', 'longestSession', 'longestAbsence', 'weekendStreakWeeks', 'redemptionCards',
    'challengeWins', 'expertChallengeWins', 'greenPromotions', 'weekRestCards', 'longTermCards'],
  /** Plafond des identifiants de cartes par matière (Badges.MASTERED_CAP) */
  _MASTERED_CAP: 100,
  _STATS_BOOLEANS: ['goldenHourPlayed', 'perfectChallengeComplete'],
  _SECRET_STATS_COUNTERS: ['nightOwlSessions', 'earlyBirdSessions', 'goldenHourSessions',
    'perfectSessions', 'weekendSessions', 'comebackCount'],
  /**
   * Registre des champs de player.stats et de leur type (source : types.js PlayerStats).
   * Tout champ écrit par le code doit y figurer, sinon la sanitisation l'effacerait au chargement
   * (test de non-régression : tests/storage-sanitize.test.js, qui parcourt src/).
   */
  PLAYER_STATS_TYPES: {
    totalXP: 'counter', totalCardsPlayed: 'counter', totalSessions: 'counter', currentStreak: 'counter',
    longestStreak: 'counter', longestGreenStreak: 'counter', totalGreenCards: 'counter',
    uniqueDecksPlayed: 'counter', fastAnswers: 'counter', nightSessions: 'counter', earlySessions: 'counter',
    perfectSessions: 'counter', longestSession: 'counter', longestAbsence: 'counter', weekendStreakWeeks: 'counter',
    redemptionCards: 'counter', challengeWins: 'counter', expertChallengeWins: 'counter',
    greenPromotions: 'counter', weekRestCards: 'counter', longTermCards: 'counter',
    goldenHourPlayed: 'boolean', perfectChallengeComplete: 'boolean',
    lastPlayedAt: 'date', lastStreakDay: 'day', nextReviewDay: 'day', lastChallengeDay: 'day',
    fastestCorrectAnswer: 'number', playedDeckIds: 'array', xpHistory: 'array',
    cardsBySubject: 'object', weekendWeeks: 'object', masteredBySubject: 'object'
  },
  /** Noms des champs enregistrés de player.stats */
  get PLAYER_STATS_FIELDS() { return Object.keys(this.PLAYER_STATS_TYPES); },
  // Formes grammaticales valides du réglage player.settings.grammaticalForm (voir i18n.GRAMMATICAL_FORMS)
  _GRAMMATICAL_FORMS: ['feminine', 'masculine', 'inclusive'],

  _BADGE_ID_PATTERN: /^[A-Za-z0-9_.:-]{1,64}$/,

  /** Jour local strict AAAA-MM-JJ ; sinon `fallback`. @private */
  _toDayString(value, fallback = null) {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))) return value;
    return fallback;
  },

  /** @private */
  _isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  },

  /**
   * Nombre fini (un nombre, ou une chaîne purement numérique) ; sinon `fallback`.
   * @private
   * @param {*} value - Valeur non fiable
   * @param {number|null} fallback - Valeur de repli
   * @param {{ min: (number|undefined), max: (number|undefined) }} [bounds] - Bornes (la valeur est ramenée dans l'intervalle)
   * @returns {number|null}
   */
  _toFiniteNumber(value, fallback, bounds = {}) {
    let n = null;
    if (typeof value === 'number') n = value;
    else if (typeof value === 'string' && value.trim() !== '' && value.length <= 32) n = Number(value);
    if (n === null || !Number.isFinite(n)) return fallback;
    const min = bounds.min ?? -Number.MAX_SAFE_INTEGER;
    const max = bounds.max ?? Number.MAX_SAFE_INTEGER;
    return Math.min(max, Math.max(min, n));
  },

  /** Entier >= 0 (compteur) ; sinon `fallback`. @private */
  _toCounter(value, fallback = 0) {
    return this._toFiniteNumber(value, fallback, { min: 0 });
  },

  /**
   * Date ISO 8601 (AAAA-MM-JJ, avec heure facultative) ; sinon `fallback`.
   * Date.parse seul est trop permissif (il accepte du texte quelconque contenant un nombre).
   * @private
   */
  _toDateString(value, fallback = null) {
    if (typeof value === 'string' && value.length <= 40 &&
        /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(value) &&
        !Number.isNaN(Date.parse(value))) {
      return value;
    }
    return fallback;
  },

  /** Chaîne (les nombres sont convertis) bornée en longueur ; sinon `fallback`. @private */
  _toSafeString(value, maxLength = 200, fallback = '') {
    if (typeof value === 'number' && Number.isFinite(value)) value = String(value);
    if (typeof value !== 'string') return fallback;
    return value.slice(0, maxLength);
  },

  /** Tableau de chaînes (les autres entrées sont écartées). @private */
  _toStringArray(value, maxItems = 1000, maxLength = 200) {
    if (!Array.isArray(value)) return [];
    return value.filter(v => typeof v === 'string').slice(0, maxItems).map(v => v.slice(0, maxLength));
  },

  /**
   * Objet { clé: nombre fini } (les autres entrées sont écartées)
   * @private
   */
  _toNumberMap(value) {
    const out = {};
    if (!this._isPlainObject(value)) return out;
    for (const [key, v] of Object.entries(value)) {
      if (this._UNSAFE_KEYS.includes(key)) continue;
      const n = this._toFiniteNumber(v, null);
      if (n !== null) out[key] = n;
    }
    return out;
  },

  /**
   * Ramène les statistiques d'un joueur à leurs types (types.js : PlayerStats)
   * @param {Object} rawStats - Statistiques non fiables
   * @returns {Object} Statistiques saines (nouvel objet)
   */
  sanitizePlayerStats(rawStats) {
    const src = this._isPlainObject(rawStats) ? rawStats : {};
    const out = {};

    for (const field of this._STATS_REQUIRED_COUNTERS) {
      out[field] = this._toCounter(src[field], 0);
    }
    for (const field of this._STATS_OPTIONAL_COUNTERS) {
      if (src[field] !== undefined && src[field] !== null) out[field] = this._toCounter(src[field], 0);
    }
    for (const field of this._STATS_BOOLEANS) {
      if (src[field] !== undefined && src[field] !== null) out[field] = src[field] === true;
    }

    out.lastPlayedAt = this._toDateString(src.lastPlayedAt, null);
    // null = jamais répondu correctement (Infinity est sérialisé en null par JSON)
    out.fastestCorrectAnswer = this._toFiniteNumber(src.fastestCorrectAnswer, null, { min: 0 });
    out.playedDeckIds = this._toStringArray(src.playedDeckIds);
    // Jours de la série (jour local) : absents tant que le joueur n'a pas de série
    const lastStreakDay = this._toDayString(src.lastStreakDay, null);
    if (lastStreakDay !== null) out.lastStreakDay = lastStreakDay;
    if (src.nextReviewDay !== undefined) out.nextReviewDay = this._toDayString(src.nextReviewDay, null);
    // Dernier jour où un défi réussi a donné son bonus (une fois par jour)
    const lastChallengeDay = this._toDayString(src.lastChallengeDay, null);
    if (lastChallengeDay !== null) out.lastChallengeDay = lastChallengeDay;
    if (this._isPlainObject(src.masteredBySubject)) {
      out.masteredBySubject = {};
      for (const [subject, ids] of Object.entries(src.masteredBySubject)) {
        if (this._UNSAFE_KEYS.includes(subject) || !/^[a-z_]{1,40}$/.test(subject) || !Array.isArray(ids)) continue;
        out.masteredBySubject[subject] = this._toStringArray(ids, this._MASTERED_CAP, 300);
      }
    }
    out.cardsBySubject = this._toNumberMap(src.cardsBySubject);

    out.xpHistory = (Array.isArray(src.xpHistory) ? src.xpHistory : [])
      .filter(entry => this._isPlainObject(entry))
      .map(entry => {
        const date = this._toDateString(entry.date, null);
        const amount = this._toFiniteNumber(entry.amount, null);
        if (date === null || amount === null) return null;
        const clean = { date, amount, source: this._toSafeString(entry.source, 40) };
        if (entry.details !== undefined && entry.details !== null) clean.details = this._toSafeString(entry.details, 200);
        const cardsPlayed = this._toCounter(entry.cardsPlayed, null);
        if (cardsPlayed !== null) clean.cardsPlayed = cardsPlayed;
        return clean;
      })
      .filter(Boolean);

    if (this._isPlainObject(src.weekendWeeks)) {
      out.weekendWeeks = {};
      for (const [week, flags] of Object.entries(src.weekendWeeks)) {
        if (this._UNSAFE_KEYS.includes(week) || !this._isPlainObject(flags)) continue;
        out.weekendWeeks[week] = { sat: flags.sat === true, sun: flags.sun === true };
      }
    }

    // Statistiques inconnues (versions futures) : conservées uniquement si primitives sûres
    const known = new Set([...Object.keys(out), 'lastPlayedAt']);
    for (const [key, v] of Object.entries(src)) {
      if (known.has(key) || this._UNSAFE_KEYS.includes(key)) continue;
      if (typeof v === 'boolean') out[key] = v;
      else if (typeof v === 'number' && Number.isFinite(v)) out[key] = v;
    }

    return out;
  },

  /** Types de défis quotidiens et de quêtes hebdomadaires reconnus (= Challenges.DAILY_TYPES / WEEKLY_TYPES) */
  _DAILY_TYPES: ['review_due', 'accuracy', 'green_streak'],
  _WEEKLY_TYPES: ['weekly_xp', 'weekly_mastery', 'weekly_streak', 'weekly_challenges', 'weekly_decks'],
  /** Plafonds de taille des missions (cartes jouées dans la journée, decks et jours de la semaine) */
  _MISSION_KEYS_CAP: 500,

  /**
   * Ramène une mission (défi quotidien ou quête hebdomadaire) à ses types
   * @private
   * @param {*} raw - Mission non fiable
   * @param {string[]} allowedTypes - Types reconnus
   * @returns {Object|null} Mission saine, ou null si inexploitable (type ou identifiant illisible)
   */
  _sanitizeMission(raw, allowedTypes) {
    if (!this._isPlainObject(raw) || !allowedTypes.includes(raw.type)) return null;
    // L'identifiant n'est jamais affiché : on ne garde que ses caractères sûrs
    const id = this._toSafeString(raw.id, 80, '').replace(/[^A-Za-z0-9_.:-]/g, '') || raw.type;

    let target;
    if (raw.type === 'accuracy') {
      if (!this._isPlainObject(raw.target)) return null;
      target = {
        accuracy: this._toFiniteNumber(raw.target.accuracy, 70, { min: 1, max: 100 }),
        minCards: Math.floor(this._toFiniteNumber(raw.target.minCards, 1, { min: 1, max: 100000 }))
      };
    } else {
      target = this._toFiniteNumber(raw.target, null, { min: 1, max: 1000000 });
      if (target === null) return null;
      target = Math.floor(target);
    }

    return {
      id,
      type: raw.type,
      target,
      xpReward: Math.floor(this._toCounter(raw.xpReward, 0)),
      createdAt: this._toDayString(raw.createdAt, null),
      expiresAt: this._toDayString(raw.expiresAt, null),
      progress: this._toCounter(raw.progress, 0),
      completed: raw.completed === true,
      completedAt: this._toDateString(raw.completedAt, null)
    };
  },

  /**
   * Ramène les missions d'un joueur (défis quotidiens, quêtes hebdomadaires) à leurs types
   *
   * Un volet illisible (jour ou semaine invalide) est abandonné : il est régénéré à la
   * prochaine ouverture, sans toucher au reste du joueur.
   *
   * @param {*} rawMissions - Missions non fiables (player.missions)
   * @returns {Object|null} `{ daily?, weekly? }`, ou null si aucun volet exploitable
   */
  sanitizeMissions(rawMissions) {
    if (!this._isPlainObject(rawMissions)) return null;
    const out = {};

    const d = rawMissions.daily;
    const day = this._isPlainObject(d) ? this._toDayString(d.day, null) : null;
    if (day !== null) {
      out.daily = {
        day,
        dueAtStart: Math.floor(this._toCounter(d.dueAtStart, 0)),
        cardsPlayed: Math.floor(this._toCounter(d.cardsPlayed, 0)),
        correct: Math.floor(this._toCounter(d.correct, 0)),
        // identifiants internes (jamais affichés) : bornés en nombre et en longueur
        cardKeys: this._toStringArray(d.cardKeys, this._MISSION_KEYS_CAP, 300),
        challenges: (Array.isArray(d.challenges) ? d.challenges : []).slice(0, 10)
          .map(c => this._sanitizeMission(c, this._DAILY_TYPES)).filter(Boolean)
      };
    }

    const w = rawMissions.weekly;
    const weekStart = this._isPlainObject(w) ? this._toDayString(w.weekStart, null) : null;
    if (weekStart !== null) {
      const baseline = this._isPlainObject(w.baseline) ? w.baseline : {};
      out.weekly = {
        weekStart,
        baseline: {
          greenPromotions: this._toCounter(baseline.greenPromotions, 0),
          challengeWins: this._toCounter(baseline.challengeWins, 0)
        },
        decksPlayed: this._toStringArray(w.decksPlayed, 100, 200),
        daysPlayed: this._toStringArray(w.daysPlayed, 7, 10).filter(k => this._toDayString(k, null) !== null),
        quests: (Array.isArray(w.quests) ? w.quests : []).slice(0, 10)
          .map(q => this._sanitizeMission(q, this._WEEKLY_TYPES)).filter(Boolean)
      };
    }

    return out.daily || out.weekly ? out : null;
  },

  /**
   * Ramène un objet de paramètres à des valeurs primitives (booléens, nombres finis, chaînes courtes)
   * @param {Object} rawSettings - Paramètres non fiables
   * @returns {Object} Paramètres sains (nouvel objet)
   */
  sanitizeSettings(rawSettings) {
    const out = {};
    if (!this._isPlainObject(rawSettings)) return out;
    for (const [key, v] of Object.entries(rawSettings)) {
      if (this._UNSAFE_KEYS.includes(key) || key.length > 64) continue;
      if (typeof v === 'boolean') out[key] = v;
      else if (typeof v === 'number' && Number.isFinite(v)) out[key] = v;
      else if (typeof v === 'string') out[key] = v.slice(0, 200);
    }
    // Forme grammaticale des textes français : valeur inconnue -> féminin (défaut)
    if ('grammaticalForm' in out && !this._GRAMMATICAL_FORMS.includes(out.grammaticalForm)) {
      out.grammaticalForm = 'feminine';
    }
    return out;
  },

  /**
   * Ramène un joueur à la forme décrite par types.js (Player) : champs numériques finis, chaînes,
   * tableaux, booléens, dates valides. Ne modifie pas l'entrée.
   * @param {*} rawPlayer - Joueur non fiable (import JSON/YAML, localStorage)
   * @returns {Object|null} Joueur sain, ou null si la structure est inexploitable
   *   (pas un objet, identifiant absent ou illisible)
   */
  sanitizePlayer(rawPlayer) {
    if (!this._isPlainObject(rawPlayer)) return null;

    const id = this._toSafeString(rawPlayer.id, 128, '');
    if (id === '') return null;

    const player = {
      id,
      name: this._toSafeString(rawPlayer.name, 100, 'Player'),
      createdAt: this._toDateString(rawPlayer.createdAt, new Date().toISOString()),
      stats: this.sanitizePlayerStats(rawPlayer.stats),
      badges: this._toStringArray(rawPlayer.badges, 500, 64).filter(b => this._BADGE_ID_PATTERN.test(b)),
      settings: this.sanitizeSettings(rawPlayer.settings)
    };

    if (this._isPlainObject(rawPlayer.secretStats)) {
      const secret = {};
      for (const field of this._SECRET_STATS_COUNTERS) {
        if (rawPlayer.secretStats[field] !== undefined && rawPlayer.secretStats[field] !== null) {
          secret[field] = this._toCounter(rawPlayer.secretStats[field], 0);
        }
      }
      const absence = this._toDateString(rawPlayer.secretStats.lastAbsenceStart, null);
      if (absence !== null) secret.lastAbsenceStart = absence;
      player.secretStats = secret;
    }

    if (this._isPlainObject(rawPlayer.challengeScores)) {
      player.challengeScores = this._toNumberMap(rawPlayer.challengeScores);
    }

    // Missions (défis quotidiens, quêtes hebdomadaires) : propres au joueur, exportées avec lui
    const missions = this.sanitizeMissions(rawPlayer.missions);
    if (missions !== null) {
      player.missions = missions;
    }

    return player;
  },

  /**
   * Valide et corrige un objet Player (chargement depuis localStorage)
   * @param {Object} player - Données du joueur
   * @returns {Object|null} Joueur validé et corrigé, null si inexploitable
   */
  validatePlayer(player) {
    if (!player) return null;
    const sanitized = this.sanitizePlayer(player);
    if (!sanitized) {
      console.warn('[Storage] Joueur inexploitable ignoré');
    }
    return sanitized;
  },

  /**
   * Ramène la progression d'une carte à ses types (types.js : Card, champs Leitner).
   * Seuls les champs de progression sont conservés : une progression importée ne peut pas
   * écraser le contenu (question, réponse...) de la carte.
   * @param {*} raw - Progression non fiable
   * @returns {Object|null} Progression saine, ou null si l'entrée n'a pas d'identifiant
   */
  sanitizeCardProgress(raw) {
    if (!this._isPlainObject(raw)) return null;
    const id = this._toSafeString(raw.id, 200, '');
    if (id === '') return null;

    // Un temps négatif n'a pas de sens : valeur absente (null) plutôt que bornée à 0
    const timeOrNull = (v) => {
      const n = this._toFiniteNumber(v, null);
      return n !== null && n >= 0 ? n : null;
    };

    const progress = {
      id,
      box: this.SCHEMAS.deckProgress.enums.box.includes(raw.box) ? raw.box : 'never_played',
      latencyThreshold: timeOrNull(raw.latencyThreshold),
      bestResponseTimeMs: timeOrNull(raw.bestResponseTimeMs),
      lastResponseTimeMs: timeOrNull(raw.lastResponseTimeMs),
      restUntil: this._toDateString(raw.restUntil, null),
      restDays: Math.floor(this._toCounter(raw.restDays, 0)),
      timesPlayed: Math.floor(this._toCounter(raw.timesPlayed, 0)),
      timesCorrect: Math.floor(this._toCounter(raw.timesCorrect, 0))
    };

    if (Array.isArray(raw.responseTimeHistory)) {
      progress.responseTimeHistory = raw.responseTimeHistory
        .filter(entry => this._isPlainObject(entry))
        .map(entry => {
          const time = timeOrNull(entry.time);
          const date = this._toDateString(entry.date, null);
          if (time === null || date === null) return null;
          return { time, date, correct: entry.correct === true };
        })
        .filter(Boolean)
        .slice(-50);
    }

    return progress;
  },

  /**
   * Ramène une entrée de l'index des joueurs ou des decks à ses types
   * @private
   */
  _sanitizePlayerListEntry(raw) {
    if (!this._isPlainObject(raw)) return null;
    const id = this._toSafeString(raw.id, 128, '');
    if (id === '') return null;
    return {
      id,
      name: this._toSafeString(raw.name, 100, 'Player'),
      createdAt: this._toDateString(raw.createdAt, new Date().toISOString()),
      totalXP: this._toCounter(raw.totalXP, 0)
    };
  },

  /**
   * Ramène une entrée de l'index des decks importés à ses types
   * @private
   */
  _sanitizeDeckIndexEntry(raw) {
    if (!this._isPlainObject(raw)) return null;
    const id = this._toSafeString(raw.id, 200, '');
    if (id === '') return null;
    // Les anciens index contenaient des decks complets (migration ensuite) : on garde le contenu
    if (raw.words || raw.cards) return raw;
    const meta = { ...raw, id };
    meta.name = this._toSafeString(raw.name, 200, '');
    meta.wordCount = Math.floor(this._toCounter(raw.wordCount, 0));
    meta.createdAt = this._toDateString(raw.createdAt, new Date().toISOString());
    meta.hasExternalAudio = raw.hasExternalAudio === true;
    for (const key of this._UNSAFE_KEYS) delete meta[key];
    if (typeof raw.type !== 'string') delete meta.type;
    return meta;
  },

  /**
   * Ramène les métadonnées de premier niveau d'un deck importé à leurs types (types.js : Deck,
   * DeckSettings). Le contenu des cartes est laissé tel quel : il est échappé au rendu.
   * @param {Object} deck - Deck non fiable
   * @returns {Object} Deck dont les métadonnées sont saines
   */
  sanitizeDeckMeta(deck) {
    if (!this._isPlainObject(deck)) return deck;
    const out = { ...deck };

    if ('difficulty' in out) {
      const d = this._toFiniteNumber(out.difficulty, null, { min: 1, max: 4 });
      if (d === null) delete out.difficulty; else out.difficulty = d;
    }
    for (const field of ['name', 'description']) {
      if (field in out && typeof out[field] !== 'string') {
        out[field] = this._toSafeString(out[field], 2000, '');
      }
    }
    if ('tags' in out) out.tags = this._toStringArray(out.tags, 100, 100);
    if (Array.isArray(out.category)) out.category = this._toStringArray(out.category, 20, 100);
    for (const field of ['createdAt', 'updatedAt']) {
      if (field in out) {
        const d = this._toDateString(out[field], null);
        if (d === null) delete out[field]; else out[field] = d;
      }
    }

    if ('settings' in out) {
      const s = this._isPlainObject(out.settings) ? out.settings : {};
      const settings = {};
      for (const flag of ['sequential', 'bidirectional', 'similarityMatching']) {
        if (flag in s) settings[flag] = s[flag] === true;
      }
      const maxCards = this._toFiniteNumber(s.maxCards, null, { min: 1 });
      if (maxCards !== null) settings.maxCards = Math.floor(maxCards);
      const threshold = this._toFiniteNumber(s.similarityThreshold, null, { min: 0, max: 1 });
      if (threshold !== null) settings.similarityThreshold = threshold;
      // Réglages inconnus : primitives seulement
      Object.assign(settings, Object.fromEntries(
        Object.entries(this.sanitizeSettings(s)).filter(([k]) => !(k in settings) &&
          !['sequential', 'bidirectional', 'similarityMatching', 'maxCards', 'similarityThreshold'].includes(k))
      ));
      out.settings = settings;
    }

    return out;
  },

  // ═══════════════════════════════════════════
  // PLAYER
  // ═══════════════════════════════════════════

  /**
   * Sauvegarde les données du joueur (avec backup automatique).
   * Écrit la clé historique `tyb_player` (relue par App.init) ET, quand le joueur
   * a un identifiant, la clé par joueur `tyb_player_{id}` (+ liste des joueurs),
   * pour que les deux ne divergent pas. Un échec sur l'une des deux est remonté.
   * @param {Object} player - Objet Player complet
   * @returns {boolean} true si succès, false si erreur
   */
  savePlayer(player) {
    try {
      const jsonData = JSON.stringify(player);
      const compressedData = this._compressData(jsonData);
      const result = this._saveWithBackup(this.KEYS.PLAYER, compressedData);
      if (!result.success) {
        console.error('[Storage] savePlayer error:', result.error);
      }
      let ok = result.success;
      if (player && player.id) {
        ok = this.savePlayerById(player) && ok;
      }
      return ok;
    } catch (e) {
      console.error('[Storage] savePlayer error:', e);
      return false;
    }
  },

  /**
   * Lit et valide la clé historique `tyb_player`
   * @private
   * @param {string|null} [expectedId] - Joueur courant (filtre la récupération depuis la copie de secours)
   * @returns {Object|null}
   */
  _readLegacyPlayer(expectedId = null) {
    try {
      // La copie de secours de la clé historique peut contenir le profil précédent d'un autre
      // joueur (la clé suit le dernier joueur enregistré) : avec un joueur courant, elle n'est
      // acceptée que si elle le désigne.
      return this._readWithRecovery(
        this.KEYS.PLAYER,
        (raw) => this.validatePlayer(JSON.parse(this._decompressData(raw))),
        expectedId ? (p) => p.id === expectedId : undefined
      ).value;
    } catch (e) {
      console.error('[Storage] loadPlayer error:', e);
      return null;
    }
  },

  /**
   * Lit et valide la clé par joueur `tyb_player_{id}` (sans repli legacy)
   * @private
   * @param {string} playerId
   * @returns {Object|null}
   */
  _readPlayerKey(playerId) {
    try {
      return this._readWithRecovery(
        this.KEYS.PLAYER_PREFIX + playerId,
        (raw) => this.validatePlayer(JSON.parse(this._decompressData(raw)))
      ).value;
    } catch (e) {
      console.error('[Storage] loadPlayerById error:', e);
      return null;
    }
  },

  /**
   * Charge le joueur courant.
   * Règle : la clé par joueur `tyb_player_{id}` du joueur courant fait foi. La clé
   * historique n'est lue que s'il n'y a pas de clé par joueur (migration des anciennes
   * données). Cas particulier, anciennes données sans marqueur `tyb_psync_{id}` où les deux
   * clés existent et diffèrent : aucun horodatage fiable n'existe, mais tous les anciens
   * écrans écrivaient la clé historique, donc elle l'emporte UNE fois et recopie
   * dans la clé par joueur ; le marqueur est ensuite posé et la clé par joueur fait foi.
   * @returns {Object|null} Objet Player ou null si absent/erreur
   */
  loadPlayer() {
    const currentId = this.getCurrentPlayerId();
    const legacy = this._readLegacyPlayer(currentId);
    if (!currentId) return legacy;

    const perPlayer = this._readPlayerKey(currentId);
    if (!perPlayer) return legacy;
    if (!legacy || legacy.id !== currentId) return perPlayer;

    if (!localStorage.getItem(this.KEYS.PLAYER_SYNC_PREFIX + currentId)
        && JSON.stringify(legacy) !== JSON.stringify(perPlayer)) {
      this.savePlayerById(legacy); // pose aussi le marqueur
      return legacy;
    }
    return perPlayer;
  },

  // ═══════════════════════════════════════════
  // MULTI-PLAYER MANAGEMENT
  // ═══════════════════════════════════════════

  /**
   * Récupère la liste de tous les joueurs
   * @returns {Array} Liste d'objets {id, name, createdAt, totalXP}
   */
  getPlayersList() {
    try {
      const read = this._readWithRecovery(this.KEYS.PLAYERS_LIST, (raw) => {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return null;
        // Entrées ramenées à leurs types : totalXP est affiché sur l'écran de sélection de profil
        const list = parsed.map(entry => this._sanitizePlayerListEntry(entry)).filter(Boolean);
        // Une liste dont aucune entrée n'est exploitable est une liste abîmée, pas une liste vide
        return parsed.length > 0 && list.length === 0 ? null : list;
      });
      if (read.value) return read.value;
      if (read.raw !== null && read.raw !== '') {
        // Valeur présente mais inutilisable, sans copie de secours : la reconstruire depuis les
        // profils plutôt que de renvoyer [] (un ajout ultérieur écraserait alors la liste)
        const rebuilt = this._rebuildPlayersList();
        if (rebuilt.length > 0) {
          if (this.savePlayersList(rebuilt)) this._notifyRecovery(this.KEYS.PLAYERS_LIST);
          return rebuilt;
        }
        return [];
      }
      // Migration: si un joueur legacy existe, l'ajouter à la liste
      const legacyPlayer = this.loadPlayer();
      if (legacyPlayer) {
        const list = [{
          id: legacyPlayer.id,
          name: legacyPlayer.name,
          createdAt: legacyPlayer.createdAt,
          totalXP: this._toCounter(legacyPlayer.stats?.totalXP, 0)
        }];
        this.savePlayersList(list);
        return list;
      }
      return [];
    } catch (e) {
      console.error('[Storage] getPlayersList error:', e);
      return [];
    }
  },

  /**
   * Reconstruit la liste des joueurs depuis les profils stockés (`tyb_player_{id}`)
   * @private
   * @returns {Array} Entrées {id, name, createdAt, totalXP}
   */
  _rebuildPlayersList() {
    const list = [];
    try {
      const prefix = this.KEYS.PLAYER_PREFIX;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key || !key.startsWith(prefix)) continue;
        const player = this._readPlayerKey(key.slice(prefix.length));
        if (player && !list.some(e => e.id === player.id)) {
          list.push({
            id: player.id,
            name: player.name,
            createdAt: player.createdAt,
            totalXP: this._toCounter(player.stats?.totalXP, 0)
          });
        }
      }
    } catch (e) {
      console.error('[Storage] _rebuildPlayersList error:', e);
    }
    return list;
  },

  /**
   * Sauvegarde la liste des joueurs (avec copie de secours)
   * @param {Array} list - Liste des joueurs
   */
  savePlayersList(list) {
    try {
      const data = JSON.stringify(list);
      const result = this._saveWithBackup(this.KEYS.PLAYERS_LIST, data);
      if (!result.success) {
        console.error('[Storage] savePlayersList quota error:', result.error);
      }
      return result.success;
    } catch (e) {
      console.error('[Storage] savePlayersList error:', e);
      return false;
    }
  },

  /**
   * Ajoute un joueur à la liste
   * @param {Object} player - Joueur à ajouter
   */
  addPlayerToList(player) {
    const list = this.getPlayersList();
    // Vérifier si le joueur n'existe pas déjà
    if (!list.find(p => p.id === player.id)) {
      list.push({
        id: player.id,
        name: player.name,
        createdAt: player.createdAt,
        totalXP: this._toCounter(player.stats?.totalXP, 0)
      });
      this.savePlayersList(list);
    }
  },

  /**
   * Met à jour les infos d'un joueur dans la liste
   * @param {Object} player - Joueur à mettre à jour
   */
  updatePlayerInList(player) {
    const list = this.getPlayersList();
    const index = list.findIndex(p => p.id === player.id);
    if (index !== -1) {
      list[index] = {
        id: player.id,
        name: player.name,
        createdAt: player.createdAt,
        totalXP: this._toCounter(player.stats?.totalXP, 0)
      };
      this.savePlayersList(list);
    }
  },

  /**
   * Supprime la clé historique `tyb_player` (et sa sauvegarde) si elle contient
   * le joueur indiqué, ou si elle est illisible ; sans effet si elle contient
   * un autre joueur. `force` la supprime sans condition.
   * @private
   * @param {string} playerId - ID du joueur supprimé
   * @param {boolean} [force=false] - Supprimer quel que soit son contenu
   */
  _removeLegacyMirror(playerId, force = false) {
    const legacy = this.loadPlayer();
    if (!force && legacy && legacy.id !== playerId) return;
    localStorage.removeItem(this.KEYS.PLAYER);
    localStorage.removeItem(this.KEYS.BACKUP_PREFIX + this.KEYS.PLAYER);
  },

  /**
   * Supprime la progression d'un deck pour TOUS les joueurs connus
   * (liste des joueurs, joueur courant, profils stockés) et les clés legacy.
   * @private
   * @param {string} deckId - ID du deck
   */
  _deleteDeckProgressForAllPlayers(deckId) {
    const ids = new Set(this.getPlayersList().map(p => p.id));
    const current = this.getCurrentPlayerId();
    if (current) ids.add(current);
    const profilePrefix = this.KEYS.PLAYER_PREFIX;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(profilePrefix)) ids.add(key.slice(profilePrefix.length));
    }
    const keys = [
      this.KEYS.DECKS_PREFIX + deckId,
      'tyb_multilingual_' + deckId
    ];
    ids.forEach(id => {
      keys.push(this.KEYS.PLAYER_DECKS_PREFIX + id + '_' + deckId, 'tyb_pml_' + id + '_' + deckId);
    });
    keys.forEach(key => {
      localStorage.removeItem(key);
      localStorage.removeItem(this.KEYS.BACKUP_PREFIX + key);
    });
  },

  /**
   * Sauvegarde l'ID du joueur courant
   * @param {string} playerId - ID du joueur
   * @returns {boolean} true si succès
   */
  setCurrentPlayerId(playerId) {
    try {
      const result = this._saveWithQuotaCheck(this.KEYS.CURRENT_PLAYER, playerId);
      if (!result.success) {
        console.error('[Storage] setCurrentPlayerId quota error:', result.error);
      }
      return result.success;
    } catch (e) {
      console.error('[Storage] setCurrentPlayerId error:', e);
      return false;
    }
  },

  /**
   * Récupère l'ID du joueur courant
   * @returns {string|null} ID du joueur ou null
   */
  getCurrentPlayerId() {
    return localStorage.getItem(this.KEYS.CURRENT_PLAYER);
  },

  /**
   * Charge un joueur spécifique par ID
   * @param {string} playerId - ID du joueur
   * @returns {Object|null} Joueur ou null
   */
  loadPlayerById(playerId) {
    const player = this._readPlayerKey(playerId);
    if (player) return player;
    // Sinon, vérifier si c'est le joueur legacy (migration des anciennes données)
    const legacyPlayer = this._readLegacyPlayer(playerId);
    return legacyPlayer && legacyPlayer.id === playerId ? legacyPlayer : null;
  },

  /**
   * Sauvegarde un joueur avec son ID spécifique (avec backup automatique)
   * @param {Object} player - Joueur à sauvegarder
   */
  savePlayerById(player) {
    try {
      const key = this.KEYS.PLAYER_PREFIX + player.id;
      const data = JSON.stringify(player);
      const result = this._saveWithBackup(key, data);
      if (!result.success) {
        console.error('[Storage] savePlayerById error:', result.error);
        return false;
      }
      // Mettre à jour aussi la liste
      this.updatePlayerInList(player);
      try { localStorage.setItem(this.KEYS.PLAYER_SYNC_PREFIX + player.id, '1'); } catch (e) { /* marqueur facultatif */ }
      return true;
    } catch (e) {
      console.error('[Storage] savePlayerById error:', e);
      return false;
    }
  },

  /**
   * Liste toutes les clés localStorage appartenant à un joueur : profil,
   * progression des decks, progression multilingue et leurs backups.
   * Le préfixe se termine par "_" pour ne pas capturer un joueur dont l'ID
   * commence par celui-ci (player_1 / player_10).
   * @private
   * @param {string} playerId - ID du joueur
   * @returns {string[]} Clés à supprimer
   */
  _getPlayerKeys(playerId) {
    const playerKey = this.KEYS.PLAYER_PREFIX + playerId;
    const prefixes = [
      this.KEYS.PLAYER_DECKS_PREFIX + playerId + '_',
      'tyb_pml_' + playerId + '_'
    ];
    const exactKeys = [playerKey, this.KEYS.BACKUP_PREFIX + playerKey, this.KEYS.PLAYER_SYNC_PREFIX + playerId];
    prefixes.push(...prefixes.map(p => this.KEYS.BACKUP_PREFIX + p));

    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (exactKeys.includes(key) || prefixes.some(p => key.startsWith(p)))) {
        keys.push(key);
      }
    }
    return keys;
  },

  // ═══════════════════════════════════════════
  // DECKS PROGRESS (PER-PLAYER)
  // ═══════════════════════════════════════════

  /**
   * Génère la clé de stockage pour la progression d'un deck pour le joueur courant
   * @private
   * @param {string} deckId - ID du deck
   * @param {string|null} [forPlayerId] - Joueur concerné (défaut : joueur courant)
   * @returns {string} Clé de stockage
   */
  _getPlayerProgressKey(deckId, forPlayerId = null) {
    const playerId = forPlayerId || this.getCurrentPlayerId();
    if (playerId) {
      return this.KEYS.PLAYER_DECKS_PREFIX + playerId + '_' + deckId;
    }
    // Fallback pour compatibilité si pas de joueur (ne devrait pas arriver)
    return this.KEYS.DECKS_PREFIX + deckId;
  },

  /**
   * Sauvegarde la progression d'un deck pour le joueur courant (avec backup automatique)
   * Ne sauvegarde que les champs de progression (pas question/answer)
   * @param {string} deckId - ID du deck
   * @param {Array} cards - Cartes avec progression
   * @param {string|null} [forPlayerId] - Joueur propriétaire (défaut : joueur courant)
   * @returns {boolean} true si succès, false si erreur
   */
  saveDeckProgress(deckId, cards, forPlayerId = null) {
    try {
      const key = this._getPlayerProgressKey(deckId, forPlayerId);
      // Sauvegarder seulement les données de progression
      const progress = cards.map(card => ({
        id: card.id,
        box: card.box,
        latencyThreshold: card.latencyThreshold,
        bestResponseTimeMs: card.bestResponseTimeMs,
        lastResponseTimeMs: card.lastResponseTimeMs,
        responseTimeHistory: card.responseTimeHistory,
        restUntil: card.restUntil,
        restDays: card.restDays,
        timesPlayed: card.timesPlayed,
        timesCorrect: card.timesCorrect
      }));
      const jsonData = JSON.stringify(progress);
      const compressedData = this._compressData(jsonData);
      const result = this._saveWithBackup(key, compressedData);
      if (!result.success) {
        console.error('[Storage] saveDeckProgress error:', result.error);
      }
      return result.success;
    } catch (e) {
      console.error('[Storage] saveDeckProgress error:', e);
      return false;
    }
  },

  /**
   * Charge la progression d'un deck pour le joueur courant
   * @param {string} deckId - ID du deck
   * @returns {Array|null} Tableau de progression ou null
   */
  loadDeckProgress(deckId) {
    try {
      const key = this._getPlayerProgressKey(deckId);

      // NE PAS migrer les données legacy - elles appartiennent à un ancien joueur
      // La migration automatique causait le partage involontaire de progression
      // entre joueurs différents

      // Valeur absente ou inutilisable : copie de secours (voir _readWithRecovery)
      return this._readWithRecovery(key, (raw) => {
        // Décompresser (migration transparente)
        const progress = JSON.parse(this._decompressData(raw));
        if (!Array.isArray(progress)) return null;
        // Valider chaque entrée de progression
        const cleaned = progress.map(p => this.sanitizeCardProgress(p)).filter(Boolean);
        return progress.length > 0 && cleaned.length === 0 ? null : cleaned;
      }).value;
    } catch (e) {
      console.error('[Storage] loadDeckProgress error:', e);
      return null;
    }
  },

  /**
   * Supprime la progression d'un deck pour le joueur courant
   * @param {string} deckId - ID du deck
   */
  deleteDeckProgress(deckId) {
    this._removeWithBackup(this._getPlayerProgressKey(deckId));
  },

  // ═══════════════════════════════════════════
  // PROGRESSION MULTILINGUE (PER-PLAYER)
  // ═══════════════════════════════════════════

  /**
   * Génère la clé de stockage pour la progression multilingue du joueur courant
   * @private
   * @param {string} deckId - ID du deck
   * @returns {string} Clé de stockage
   */
  _getPlayerMultilingualKey(deckId) {
    const playerId = this.getCurrentPlayerId();
    if (playerId) {
      return 'tyb_pml_' + playerId + '_' + deckId;
    }
    // Fallback pour compatibilité
    return 'tyb_multilingual_' + deckId;
  },

  /**
   * Sauvegarde la progression d'un deck multilingue pour le joueur courant
   * Stocke la progression par mot et par direction
   * @param {string} deckId - ID du deck
   * @param {Array} words - Mots avec progression
   * @returns {boolean} true si succès, false si erreur
   */
  saveMultilingualProgress(deckId, words) {
    try {
      const key = this._getPlayerMultilingualKey(deckId);
      // Sauvegarder seulement les données de progression
      const progress = (words || []).map(word => ({
        id: word.id,
        progress: word.progress || {}
      }));
      const jsonData = JSON.stringify(progress);
      const compressedData = this._compressData(jsonData);
      const result = this._saveWithBackup(key, compressedData);
      if (!result.success) {
        console.error('[Storage] saveMultilingualProgress error:', result.error);
      }
      return result.success;
    } catch (e) {
      console.error('[Storage] saveMultilingualProgress error:', e);
      return false;
    }
  },

  /**
   * Charge la progression d'un deck multilingue pour le joueur courant
   * @param {string} deckId - ID du deck
   * @returns {Array|null} Tableau de progression ou null
   */
  loadMultilingualProgress(deckId) {
    try {
      const key = this._getPlayerMultilingualKey(deckId);

      // NE PAS migrer les données legacy - elles appartiennent à un ancien joueur
      // La migration automatique causait le partage involontaire de progression
      // entre joueurs différents

      // Valeur absente ou inutilisable : copie de secours (voir _readWithRecovery)
      return this._readWithRecovery(key, (raw) => {
        const parsed = JSON.parse(this._decompressData(raw));
        if (!Array.isArray(parsed)) return null;
        const words = this._sanitizeMultilingualProgress(parsed);
        return parsed.length > 0 && words.length === 0 ? null : words;
      }).value;
    } catch (e) {
      console.error('[Storage] loadMultilingualProgress error:', e);
      return null;
    }
  },

  /**
   * Ramène une progression multilingue lue à ses types
   * @private
   * @param {Array} parsed - Tableau lu (non fiable)
   * @returns {Array} Entrées {id, progress}
   */
  _sanitizeMultilingualProgress(parsed) {
    // Chaque direction (ex. "fr→en") est ramenée aux champs Leitner ; le reste est écarté
    return parsed
      .filter(entry => this._isPlainObject(entry) && this._toSafeString(entry.id, 200, '') !== '')
      .map(entry => {
        const directions = {};
        if (this._isPlainObject(entry.progress)) {
          for (const [direction, value] of Object.entries(entry.progress)) {
            if (this._UNSAFE_KEYS.includes(direction)) continue;
            const clean = this.sanitizeCardProgress({ ...(this._isPlainObject(value) ? value : null), id: 'x' });
            if (!clean || !this._isPlainObject(value)) continue;
            delete clean.id;
            directions[direction] = clean;
          }
        }
        return { id: this._toSafeString(entry.id, 200, ''), progress: directions };
      });
  },

  /**
   * Supprime la progression d'un deck multilingue pour le joueur courant
   * @param {string} deckId - ID du deck
   */
  deleteMultilingualProgress(deckId) {
    this._removeWithBackup(this._getPlayerMultilingualKey(deckId));
  },

  /**
   * Charge toutes les progressions de decks pour le joueur courant
   * @returns {Object} Objet { deckId: progress[] }
   */
  loadAllProgress() {
    const progress = {};
    const playerId = this.getCurrentPlayerId();

    try {
      // Chercher les clés de progression per-player
      const prefix = playerId
        ? this.KEYS.PLAYER_DECKS_PREFIX + playerId + '_'
        : this.KEYS.DECKS_PREFIX;

      const backupPrefix = this.KEYS.BACKUP_PREFIX + prefix;
      const backupOnly = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith(prefix)) {
          const deckId = key.slice(prefix.length);
          progress[deckId] = this.loadDeckProgress(deckId);
        } else if (key.startsWith(backupPrefix)) {
          backupOnly.push(key.slice(backupPrefix.length));
        }
      }
      // Progression absente dont la copie de secours existe : restaurée (les suppressions
      // volontaires retirent aussi la copie, voir _removeWithBackup)
      backupOnly.forEach((deckId) => {
        if (deckId in progress) return;
        const restored = this.loadDeckProgress(deckId);
        if (restored) progress[deckId] = restored;
      });
    } catch (e) {
      console.error('[Storage] loadAllProgress error:', e);
    }
    return progress;
  },

  // ═══════════════════════════════════════════
  // CUSTOM DECKS (Moodle imports)
  // ═══════════════════════════════════════════

  /**
   * Extrait les métadonnées légères d'un deck (pour l'index)
   * @private
   * @param {Object} deck - Deck complet
   * @returns {Object} Métadonnées légères
   */
  _extractDeckMeta(deck) {
    return {
      id: deck.id,
      name: deck.name,
      type: deck.type,
      languages: deck.languages,
      category: deck.category,
      wordCount: deck.words?.length || deck.cards?.length || 0,
      createdAt: deck.createdAt || new Date().toISOString(),
      hasExternalAudio: deck.hasExternalAudio || false
    };
  },

  /**
   * Extrait les audios d'un deck et les sauvegarde séparément
   * Retourne une copie du deck sans les audios inline (traitement mot par mot)
   * @private
   * @param {Object} deck - Deck avec audios inline
   * @returns {{ deckWithoutAudio: Object, audioCount: number, success: boolean }}
   */
  _extractAndSaveAudios(deck) {
    let audioCount = 0;
    let success = true;

    // Créer une copie shallow du deck (sans words pour l'instant)
    const deckCopy = { ...deck };
    delete deckCopy.words;
    delete deckCopy.cards;

    // Pour les decks multilingues avec words - traiter mot par mot
    if (deck.words && Array.isArray(deck.words)) {
      deckCopy.words = [];

      for (const word of deck.words) {
        // Copier le mot sans translations d'abord
        const wordCopy = { ...word };

        if (word.translations && typeof word.translations === 'object') {
          wordCopy.translations = {};

          for (const [lang, translation] of Object.entries(word.translations)) {
            if (translation && translation.audio && translation.audio !== '__EXTERNAL__') {
              // Sauvegarder l'audio séparément
              const audioKey = `${this.KEYS.AUDIO_PREFIX}${deck.id}_${word.id}_${lang}`;
              try {
                // Stringify l'audio (objet) avant compression car _compressData attend une string
                const audioJson = JSON.stringify(translation.audio);
                const compressedAudio = this._compressData(audioJson);
                const result = this._saveWithQuotaCheck(audioKey, compressedAudio);
                if (!result.success) {
                  console.error('[Storage] Failed to save audio:', audioKey, result.error);
                  success = false;
                  // Garder l'audio original si échec
                  wordCopy.translations[lang] = { ...translation };
                } else {
                  audioCount++;
                  // Remplacer l'audio par un marqueur
                  wordCopy.translations[lang] = { ...translation, audio: '__EXTERNAL__' };
                }
              } catch (e) {
                console.error('[Storage] Error saving audio:', audioKey, e);
                success = false;
                wordCopy.translations[lang] = { ...translation };
              }
            } else {
              // Pas d'audio ou déjà externe
              wordCopy.translations[lang] = translation ? { ...translation } : translation;
            }
          }
        }

        deckCopy.words.push(wordCopy);
      }
    }

    // Pour les decks classiques avec cards
    if (deck.cards && Array.isArray(deck.cards)) {
      deckCopy.cards = deck.cards.map(card => ({ ...card }));
    }

    // Marquer le deck comme ayant des audios externes
    if (audioCount > 0) {
      deckCopy.hasExternalAudio = true;
    }

    return { deckWithoutAudio: deckCopy, audioCount, success };
  },

  /**
   * Charge les audios externes et les réattache au deck
   * @private
   * @param {Object} deck - Deck avec marqueurs __EXTERNAL__
   * @returns {Object} Deck avec audios réattachés
   */
  _loadAndAttachAudios(deck) {
    if (!deck.hasExternalAudio) {
      return deck;
    }

    // Créer une copie pour ne pas modifier en cache
    const deckCopy = { ...deck };
    if (deckCopy.words) {
      deckCopy.words = deckCopy.words.map(word => {
        if (!word.translations) return word;

        const wordCopy = { ...word, translations: { ...word.translations } };
        for (const [lang, translation] of Object.entries(wordCopy.translations)) {
          if (translation && translation.audio === '__EXTERNAL__') {
            const audioKey = `${this.KEYS.AUDIO_PREFIX}${deck.id}_${word.id}_${lang}`;
            try {
              const compressedAudio = localStorage.getItem(audioKey);
              if (compressedAudio) {
                const audioJson = this._decompressData(compressedAudio);

                // Détecter les données corrompues (bug fix: audio stocké comme "[object Object]")
                if (audioJson === '[object Object]') {
                  console.warn('[Storage] Corrupted audio data detected for', audioKey,
                    '- audio needs to be re-downloaded');
                  wordCopy.translations[lang] = { ...translation, audio: null };
                } else {
                  // Parse le JSON car _extractAndSaveAudios stringify les objets audio
                  const audio = typeof audioJson === 'string' ? JSON.parse(audioJson) : audioJson;
                  wordCopy.translations[lang] = { ...translation, audio };
                }
              } else {
                // Audio manquant, mettre null
                wordCopy.translations[lang] = { ...translation, audio: null };
              }
            } catch (e) {
              console.error('[Storage] Error loading audio:', audioKey, e);
              wordCopy.translations[lang] = { ...translation, audio: null };
            }
          }
        }
        return wordCopy;
      });
    }

    return deckCopy;
  },

  /**
   * Supprime tous les audios associés à un deck
   * @private
   * @param {string} deckId - ID du deck
   * @returns {number} Nombre d'audios supprimés
   */
  _deleteAudiosForDeck(deckId) {
    const prefix = `${this.KEYS.AUDIO_PREFIX}${deckId}_`;
    const keysToDelete = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => localStorage.removeItem(key));
    return keysToDelete.length;
  },

  /**
   * Sauvegarde un deck importé (Moodle ou autre) - stockage individuel
   * Les audios sont stockés séparément pour éviter les limites JSON.stringify
   * @param {Object} deck - Deck complet à sauvegarder
   * @returns {boolean} true si succès
   */
  saveCustomDeck(deck) {
    try {
      const deckKey = this.KEYS.CUSTOM_DECK_PREFIX + deck.id;

      // 1. Extraire et sauvegarder les audios séparément (si deck multilingue)
      let deckToSave = deck;
      let audioCount = 0;

      if (deck.words && deck.words.some(w => w.translations)) {
        const extraction = this._extractAndSaveAudios(deck);
        if (!extraction.success) {
          console.error('[Storage] saveCustomDeck: failed to extract audios');
          // Continuer quand même - certains audios ont peut-être été sauvés
        }
        deckToSave = extraction.deckWithoutAudio;
        audioCount = extraction.audioCount;
        console.log(`[Storage] Extracted ${audioCount} audios to separate storage`);
      }

      // 2. Sauvegarder le deck (maintenant sans les audios inline volumineux)
      const deckJson = JSON.stringify(deckToSave);
      const compressedDeck = this._compressData(deckJson);

      const deckResult = this._saveWithBackup(deckKey, compressedDeck);
      if (!deckResult.success) {
        console.error('[Storage] saveCustomDeck: failed to save deck data:', deckResult.error);
        // Rollback: supprimer les audios déjà sauvegardés
        if (audioCount > 0) {
          this._deleteAudiosForDeck(deck.id);
        }
        return false;
      }

      // 3. Mettre à jour l'index des métadonnées
      const index = this._loadCustomDecksIndex();
      const meta = this._extractDeckMeta(deckToSave);

      const existingIndex = index.findIndex(m => m.id === deck.id);
      if (existingIndex !== -1) {
        index[existingIndex] = meta;
      } else {
        index.push(meta);
      }

      const indexJson = JSON.stringify(index);
      const compressedIndex = this._compressData(indexJson);
      const indexResult = this._saveWithBackup(this.KEYS.CUSTOM_DECKS, compressedIndex);

      if (!indexResult.success) {
        console.error('[Storage] saveCustomDeck: failed to save index:', indexResult.error);
        // Rollback: supprimer le deck et les audios sauvegardés
        localStorage.removeItem(deckKey);
        if (audioCount > 0) {
          this._deleteAudiosForDeck(deck.id);
        }
        return false;
      }

      return true;
    } catch (e) {
      console.error('[Storage] saveCustomDeck error:', e);
      return false;
    }
  },

  /**
   * Charge l'index des decks custom (métadonnées légères)
   * @private
   * @returns {Array} Liste des métadonnées de decks
   */
  _loadCustomDecksIndex() {
    try {
      // Valeur absente ou inutilisable : copie de secours (voir _readWithRecovery)
      const read = this._readWithRecovery(this.KEYS.CUSTOM_DECKS, (raw, isBackup) => {
        const parsed = JSON.parse(this._decompressData(raw));
        if (!Array.isArray(parsed)) return null;

        // Vérifier si c'est l'ancien format (decks complets) ou le nouveau (index)
        if (parsed.length > 0) {
          const firstItem = parsed[0];
          // Ancien format: contient 'words' ou 'cards' (deck complet)
          if (firstItem && (firstItem.words || firstItem.cards)) {
            // Une copie de secours à l'ancien format n'est pas restaurée telle quelle
            // (elle écraserait l'index migré) ; la valeur courante, elle, est migrée
            return isBackup ? null : this._migrateToIndividualStorage(parsed);
          }
        }

        const index = parsed.map(entry => this._sanitizeDeckIndexEntry(entry)).filter(Boolean);
        return parsed.length > 0 && index.length === 0 ? null : index;
      });
      return read.value || [];
    } catch (e) {
      console.error('[Storage] _loadCustomDecksIndex error:', e);
      return [];
    }
  },

  /**
   * Migre les decks de l'ancien format (tout-en-un) vers le stockage individuel
   * @private
   * @param {Array} oldDecks - Decks dans l'ancien format
   * @returns {Array} Index des métadonnées
   */
  _migrateToIndividualStorage(oldDecks) {
    console.log('[Storage] Migrating', oldDecks.length, 'decks to individual storage...');
    const index = [];
    let failures = 0;

    for (const deck of oldDecks) {
      try {
        // Sauvegarder chaque deck individuellement
        const deckKey = this.KEYS.CUSTOM_DECK_PREFIX + deck.id;
        const deckJson = JSON.stringify(deck);
        const compressedDeck = this._compressData(deckJson);
        localStorage.setItem(deckKey, compressedDeck);

        // Ajouter à l'index
        index.push(this._extractDeckMeta(deck));
      } catch (e) {
        console.error('[Storage] Migration failed for deck:', deck.id, e);
        failures++;
      }
    }

    // Si un deck n'a pas pu être migré, ne pas écraser l'ancien format :
    // il contient encore ce deck en entier (nouvelle tentative au prochain chargement)
    if (failures > 0) {
      console.error('[Storage] Migration incomplete, legacy data kept');
      return index;
    }

    // Sauvegarder le nouvel index
    try {
      const indexJson = JSON.stringify(index);
      const compressedIndex = this._compressData(indexJson);
      localStorage.setItem(this.KEYS.CUSTOM_DECKS, compressedIndex);
      console.log('[Storage] Migration complete:', index.length, 'decks migrated');
    } catch (e) {
      console.error('[Storage] Failed to save migrated index:', e);
    }

    return index;
  },

  /**
   * Charge un deck custom individuel par son ID
   * Réattache automatiquement les audios stockés séparément
   * @param {string} deckId - ID du deck
   * @returns {Object|null} Deck complet ou null
   */
  loadCustomDeck(deckId) {
    try {
      const deckKey = this.KEYS.CUSTOM_DECK_PREFIX + deckId;
      // Valeur absente ou inutilisable : copie de secours (voir _readWithRecovery)
      const deck = this._readWithRecovery(deckKey, (raw) => {
        const parsedDeck = JSON.parse(this._decompressData(raw));
        // Un deck a toujours un identifiant : sans lui, la structure est rejetée
        if (!this._isPlainObject(parsedDeck) || typeof parsedDeck.id !== 'string' || parsedDeck.id === '') return null;
        return this.sanitizeDeckMeta(parsedDeck);
      }).value;
      if (!deck) return null;

      // Réattacher les audios externes si nécessaire
      if (deck.hasExternalAudio) {
        return this._loadAndAttachAudios(deck);
      }

      return deck;
    } catch (e) {
      console.error('[Storage] loadCustomDeck error:', deckId, e);
      return null;
    }
  },

  /**
   * Charge tous les decks importés
   * @returns {Array} Liste des decks importés (complets)
   */
  loadCustomDecks() {
    try {
      const index = this._loadCustomDecksIndex();
      const decks = [];

      for (const meta of index) {
        const deck = this.loadCustomDeck(meta.id);
        if (deck) {
          decks.push(deck);
        } else {
          console.warn('[Storage] loadCustomDecks: deck not found:', meta.id);
        }
      }

      return decks;
    } catch (e) {
      console.error('[Storage] loadCustomDecks error:', e);
      return [];
    }
  },

  /**
   * Supprime un deck importé (déplacé vers la corbeille - soft delete)
   * @param {string} deckId - ID du deck à supprimer
   * @returns {boolean} true si succès
   */
  deleteCustomDeck(deckId) {
    // Utiliser le soft delete par défaut
    return this.moveToTrash(deckId);
  },

  // ═══════════════════════════════════════════
  // CORBEILLE (SOFT DELETE)
  // ═══════════════════════════════════════════

  /**
   * Déplace un deck vers la corbeille (soft delete)
   * Avec stockage individuel, on déplace juste la référence
   * @param {string} deckId - ID du deck à déplacer
   * @returns {boolean} true si succès
   */
  moveToTrash(deckId) {
    try {
      // Charger le deck depuis le stockage individuel
      const deck = this.loadCustomDeck(deckId);
      if (!deck) {
        console.warn('[Storage] moveToTrash: deck not found', deckId);
        return false;
      }

      // Ajouter métadonnées de suppression (juste les métadonnées pour la corbeille)
      const trashedMeta = {
        ...this._extractDeckMeta(deck),
        deletedAt: new Date().toISOString(),
        originalId: deck.id
      };

      // Retirer de l'index des decks actifs
      const index = this._loadCustomDecksIndex();
      const filteredIndex = index.filter(m => m.id !== deckId);

      // Ajouter à la corbeille (index seulement, le deck reste stocké individuellement)
      const trashIndex = this._loadTrashIndex();
      trashIndex.push(trashedMeta);

      // Sauvegarder les deux index
      const indexJson = JSON.stringify(filteredIndex);
      const trashJson = JSON.stringify(trashIndex);

      // Corbeille d'abord : si la 2e écriture échoue, le deck reste au moins dans la corbeille
      // (jamais "ni actif ni dans la corbeille")
      const previousTrash = localStorage.getItem(this.KEYS.TRASH_DECKS);
      const trashResult = this._saveWithQuotaCheck(this.KEYS.TRASH_DECKS, this._compressData(trashJson));
      if (!trashResult.success) {
        console.error('[Storage] moveToTrash quota error');
        return false;
      }

      const indexResult = this._saveWithQuotaCheck(this.KEYS.CUSTOM_DECKS, this._compressData(indexJson));
      if (!indexResult.success) {
        console.error('[Storage] moveToTrash quota error');
        this._restoreRawValue(this.KEYS.TRASH_DECKS, previousTrash);
        return false;
      }

      return true;
    } catch (e) {
      console.error('[Storage] moveToTrash error:', e);
      return false;
    }
  },

  /**
   * Remet une valeur brute précédente (rollback d'une écriture en 2 temps)
   * @private
   * @param {string} key - Clé localStorage
   * @param {string|null} previous - Ancienne valeur brute (null = clé absente)
   */
  _restoreRawValue(key, previous) {
    try {
      if (previous === null || previous === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, previous);
      }
    } catch (e) {
      console.error('[Storage] rollback failed for', key, e);
    }
  },

  /**
   * Charge l'index de la corbeille (métadonnées légères)
   * @private
   * @returns {Array} Liste des métadonnées de decks dans la corbeille
   */
  _loadTrashIndex() {
    try {
      const data = localStorage.getItem(this.KEYS.TRASH_DECKS);
      if (!data) return [];

      const decompressedData = this._decompressData(data);
      const parsed = JSON.parse(decompressedData);

      // Vérifier si c'est l'ancien format (decks complets) ou le nouveau (index)
      if (Array.isArray(parsed) && parsed.length > 0) {
        const firstItem = parsed[0];
        // Ancien format: contient 'words' ou 'cards' (deck complet)
        if (firstItem && (firstItem.words || firstItem.cards)) {
          // Migration: convertir en index + stockage individuel
          return this._migrateTrashToIndividualStorage(parsed);
        }
      }

      return parsed;
    } catch (e) {
      console.error('[Storage] _loadTrashIndex error:', e);
      return [];
    }
  },

  /**
   * Migre la corbeille vers le stockage individuel
   * @private
   */
  _migrateTrashToIndividualStorage(oldDecks) {
    console.log('[Storage] Migrating trash to individual storage...');
    const index = [];
    let failures = 0;

    for (const deck of oldDecks) {
      try {
        // Sauvegarder chaque deck individuellement
        const deckKey = this.KEYS.CUSTOM_DECK_PREFIX + deck.id;
        const deckJson = JSON.stringify(deck);
        const compressedDeck = this._compressData(deckJson);
        localStorage.setItem(deckKey, compressedDeck);

        // Ajouter à l'index avec les métadonnées de suppression
        index.push({
          ...this._extractDeckMeta(deck),
          deletedAt: deck.deletedAt,
          originalId: deck.originalId || deck.id
        });
      } catch (e) {
        console.error('[Storage] Trash migration failed for deck:', deck.id, e);
        failures++;
      }
    }

    // Ne pas écraser l'ancien format si un deck n'a pas pu être migré
    if (failures > 0) {
      console.error('[Storage] Trash migration incomplete, legacy data kept');
      return index;
    }

    // Sauvegarder le nouvel index
    try {
      const indexJson = JSON.stringify(index);
      const compressedIndex = this._compressData(indexJson);
      localStorage.setItem(this.KEYS.TRASH_DECKS, compressedIndex);
    } catch (e) {
      console.error('[Storage] Failed to save migrated trash index:', e);
    }

    return index;
  },

  /**
   * Charge les decks dans la corbeille (complets)
   * @returns {Array} Liste des decks dans la corbeille
   */
  loadTrashDecks() {
    try {
      const trashIndex = this._loadTrashIndex();
      const decks = [];

      for (const meta of trashIndex) {
        const deck = this.loadCustomDeck(meta.id);
        if (deck) {
          // Ajouter les métadonnées de suppression
          deck.deletedAt = meta.deletedAt;
          deck.originalId = meta.originalId;
          decks.push(deck);
        }
      }

      return decks;
    } catch (e) {
      console.error('[Storage] loadTrashDecks error:', e);
      return [];
    }
  },

  /**
   * Restaure un deck depuis la corbeille
   * @param {string} deckId - ID du deck à restaurer
   * @returns {boolean} true si succès
   */
  restoreFromTrash(deckId) {
    try {
      const trashIndex = this._loadTrashIndex();
      const metaIndex = trashIndex.findIndex(m => m.id === deckId);

      if (metaIndex === -1) {
        console.warn('[Storage] restoreFromTrash: deck not found', deckId);
        return false;
      }

      // Récupérer les métadonnées
      const meta = trashIndex[metaIndex];

      // Retirer de la corbeille
      trashIndex.splice(metaIndex, 1);

      // Ajouter à l'index des decks actifs (sans les métadonnées de suppression)
      const activeIndex = this._loadCustomDecksIndex();
      const cleanMeta = { ...meta };
      delete cleanMeta.deletedAt;
      delete cleanMeta.originalId;
      activeIndex.push(cleanMeta);

      // Sauvegarder les deux index
      const activeJson = JSON.stringify(activeIndex);
      const trashJson = JSON.stringify(trashIndex);

      // Index actif d'abord : si la 2e écriture échoue, le deck reste visible (jamais perdu)
      const previousActive = localStorage.getItem(this.KEYS.CUSTOM_DECKS);
      const activeResult = this._saveWithQuotaCheck(this.KEYS.CUSTOM_DECKS, this._compressData(activeJson));
      if (!activeResult.success) {
        console.error('[Storage] restoreFromTrash quota error');
        return false;
      }

      const trashResult = this._saveWithQuotaCheck(this.KEYS.TRASH_DECKS, this._compressData(trashJson));
      if (!trashResult.success) {
        console.error('[Storage] restoreFromTrash quota error');
        this._restoreRawValue(this.KEYS.CUSTOM_DECKS, previousActive);
        return false;
      }

      return true;
    } catch (e) {
      console.error('[Storage] restoreFromTrash error:', e);
      return false;
    }
  },

  /**
   * Supprime définitivement un deck de la corbeille
   * @param {string} deckId - ID du deck à supprimer
   * @returns {boolean} true si succès
   */
  permanentlyDeleteDeck(deckId) {
    try {
      // Retirer de l'index de la corbeille
      const trashIndex = this._loadTrashIndex().filter(m => m.id !== deckId);
      const trashJson = JSON.stringify(trashIndex);
      const result = this._saveWithQuotaCheck(this.KEYS.TRASH_DECKS, this._compressData(trashJson));

      if (!result.success) {
        console.error('[Storage] permanentlyDeleteDeck quota error:', result.error);
        return false;
      }

      // Supprimer le deck stocké individuellement
      this._removeWithBackup(this.KEYS.CUSTOM_DECK_PREFIX + deckId);

      // Supprimer les audios associés
      this._deleteAudiosForDeck(deckId);

      // Supprimer aussi la progression
      this._deleteDeckProgressForAllPlayers(deckId);

      return true;
    } catch (e) {
      console.error('[Storage] permanentlyDeleteDeck error:', e);
      return false;
    }
  },

  /**
   * Vide entièrement la corbeille
   * @returns {{ success: boolean, count: number }} Résultat avec nombre de decks supprimés
   */
  emptyTrash() {
    try {
      const trashIndex = this._loadTrashIndex();
      const count = trashIndex.length;

      // Supprimer chaque deck stocké individuellement
      trashIndex.forEach(meta => {
        this._removeWithBackup(this.KEYS.CUSTOM_DECK_PREFIX + meta.id);
        // Supprimer les audios associés
        this._deleteAudiosForDeck(meta.id);
        this._deleteDeckProgressForAllPlayers(meta.id);
      });

      // Vider l'index de la corbeille
      localStorage.removeItem(this.KEYS.TRASH_DECKS);

      return { success: true, count };
    } catch (e) {
      console.error('[Storage] emptyTrash error:', e);
      return { success: false, count: 0 };
    }
  },

  /**
   * Compte le nombre de decks dans la corbeille
   * @returns {number} Nombre de decks dans la corbeille
   */
  getTrashCount() {
    return this._loadTrashIndex().length;
  },

  // ═══════════════════════════════════════════
  // SETTINGS
  // ═══════════════════════════════════════════

  /**
   * Sauvegarde les paramètres
   * @param {Object} settings - Objet Settings
   * @returns {boolean} true si succès, false si erreur
   */
  saveSettings(settings) {
    try {
      const data = JSON.stringify(settings);
      const result = this._saveWithQuotaCheck(this.KEYS.SETTINGS, data);
      if (!result.success) {
        console.error('[Storage] saveSettings quota error:', result.error);
      }
      return result.success;
    } catch (e) {
      console.error('[Storage] saveSettings error:', e);
      return false;
    }
  },

  /**
   * Charge les paramètres
   * @returns {Object|null} Objet Settings ou null
   */
  loadSettings() {
    try {
      const data = localStorage.getItem(this.KEYS.SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('[Storage] loadSettings error:', e);
      return null;
    }
  },

  // ═══════════════════════════════════════════
  // HIDDEN DECKS (masquer des decks de révision)
  // ═══════════════════════════════════════════

  /**
   * Masque un deck pour le joueur courant
   * @param {string} deckId - ID du deck à masquer
   * @returns {boolean} true si succès
   */
  hideDeck(deckId) {
    try {
      const hiddenDecks = this.getHiddenDecks();
      if (!hiddenDecks.includes(deckId)) {
        hiddenDecks.push(deckId);
        const data = JSON.stringify(hiddenDecks);
        const result = this._saveWithQuotaCheck(this.KEYS.HIDDEN_DECKS, data);
        if (!result.success) {
          console.error('[Storage] hideDeck quota error:', result.error);
          return false;
        }
      }
      return true;
    } catch (e) {
      console.error('[Storage] hideDeck error:', e);
      return false;
    }
  },

  /**
   * Affiche un deck précédemment masqué
   * @param {string} deckId - ID du deck à afficher
   * @returns {boolean} true si succès
   */
  unhideDeck(deckId) {
    try {
      const hiddenDecks = this.getHiddenDecks().filter(id => id !== deckId);
      const data = JSON.stringify(hiddenDecks);
      const result = this._saveWithQuotaCheck(this.KEYS.HIDDEN_DECKS, data);
      if (!result.success) {
        console.error('[Storage] unhideDeck quota error:', result.error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('[Storage] unhideDeck error:', e);
      return false;
    }
  },

  /**
   * Récupère la liste des decks masqués
   * @returns {Array} Liste des IDs de decks masqués
   */
  getHiddenDecks() {
    try {
      const data = localStorage.getItem(this.KEYS.HIDDEN_DECKS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('[Storage] getHiddenDecks error:', e);
      return [];
    }
  },

  /**
   * Vérifie si un deck est masqué
   * @param {string} deckId - ID du deck
   * @returns {boolean} true si masqué
   */
  isDeckHidden(deckId) {
    return this.getHiddenDecks().includes(deckId);
  },

  /**
   * Bascule l'état masqué d'un deck
   * @param {string} deckId - ID du deck
   * @returns {boolean} Nouvel état (true si masqué)
   */
  toggleDeckHidden(deckId) {
    if (this.isDeckHidden(deckId)) {
      this.unhideDeck(deckId);
      return false;
    } else {
      this.hideDeck(deckId);
      return true;
    }
  },

  // ═══════════════════════════════════════════
  // EXPORT / IMPORT
  // ═══════════════════════════════════════════

  /**
   * Exporte toutes les données
   * @returns {Object} Données exportées avec version, date, player, progress, settings
   */
  exportAll() {
    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      player: this.loadPlayer(),
      progress: this.loadAllProgress(),
      settings: this.loadSettings()
    };
  },

  /**
   * Importe toutes les données
   * @param {Object} data - Données à importer
   *   La progression est écrite pour `data.player.id` (pas pour le joueur courant) ;
   *   sans joueur courant, le joueur importé le devient.
   *   Joueur, paramètres et progression sont assainis (types de types.js) avant écriture.
   * @returns {boolean} true si succès
   * @throws {Error} Si données invalides ou structure inexploitable (rien n'est écrit)
   *   ou si une écriture échoue (quota)
   */
  importAll(data) {
    if (!data || !data.version) {
      throw new Error('Invalid import data');
    }

    // Valider et migrer si nécessaire
    const migrated = this._migrateData(data);

    // Valider ET assainir TOUT avant d'écrire quoi que ce soit (pas d'import partiel).
    // Les champs sont ramenés à leurs types : une sauvegarde hostile ne doit pas pouvoir
    // injecter de HTML dans les champs numériques affichés par l'interface.
    const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
    const rawPlayer = migrated.player;
    const rawSettings = migrated.settings;
    const rawProgress = migrated.progress;

    let player = null;
    if (rawPlayer) {
      player = this.sanitizePlayer(rawPlayer);
      if (!player) {
        throw new Error('Invalid import data: player');
      }
    }

    let settings = null;
    if (rawSettings) {
      if (!isPlainObject(rawSettings)) {
        throw new Error('Invalid import data: settings');
      }
      settings = this.sanitizeSettings(rawSettings);
    }

    let progress = null;
    if (rawProgress) {
      if (!isPlainObject(rawProgress)) {
        throw new Error('Invalid import data: progress');
      }
      progress = {};
      for (const [deckId, cards] of Object.entries(rawProgress)) {
        if (this._UNSAFE_KEYS.includes(deckId)) continue;
        if (!cards) continue;
        if (!Array.isArray(cards) || !cards.every(isPlainObject)) {
          throw new Error(`Invalid import data: progress of deck "${deckId}"`);
        }
        const clean = cards.map(card => this.sanitizeCardProgress(card));
        if (clean.some(card => card === null)) {
          throw new Error(`Invalid import data: progress of deck "${deckId}"`);
        }
        progress[deckId] = clean;
      }
    }

    const failed = [];

    if (player && !this.savePlayer(player)) {
      failed.push('player');
    }

    if (progress) {
      // La progression appartient au joueur importé, pas au joueur courant
      // (sinon elle écraserait celle d'un autre joueur)
      const ownerId = player?.id || null;
      if (ownerId && !this.getCurrentPlayerId()) {
        this.setCurrentPlayerId(ownerId);
      }
      Object.entries(progress).forEach(([deckId, cards]) => {
        if (cards && !this.saveDeckProgress(deckId, cards, ownerId)) {
          failed.push(`progress:${deckId}`);
        }
      });
    }

    if (settings && !this.saveSettings(settings)) {
      failed.push('settings');
    }

    if (failed.length > 0) {
      throw new Error(`Import failed (stockage): ${failed.join(', ')}`);
    }

    return true;
  },

  // ═══════════════════════════════════════════
  // UTILITAIRES
  // ═══════════════════════════════════════════

  /**
   * Supprime toutes les données de l'application (clés tyb_*)
   * ATTENTION: Supprime les données de TOUS les joueurs
   */
  clear() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('tyb_')) {
        keys.push(key);
      }
    }
    keys.forEach(key => localStorage.removeItem(key));
  },

  /**
   * Supprime uniquement les données du joueur courant
   * Préserve les données des autres joueurs et les decks partagés
   */
  clearCurrentPlayerData() {
    const playerId = this.getCurrentPlayerId();
    if (!playerId) {
      console.warn('[Storage] No current player to clear');
      return;
    }

    // Profil, progression (decks + multilingue) et backups du joueur courant
    const keysToDelete = this._getPlayerKeys(playerId);

    // Supprimer les clés du joueur
    keysToDelete.forEach(key => localStorage.removeItem(key));

    // Retirer le joueur de la liste des joueurs
    const playersList = this.getPlayersList();
    const updatedList = playersList.filter(p => p.id !== playerId);
    this.savePlayersList(updatedList);
    // La copie de secours de la liste citerait encore le joueur supprimé
    localStorage.removeItem(this.KEYS.BACKUP_PREFIX + this.KEYS.PLAYERS_LIST);

    // Clé historique tyb_player (miroir du joueur courant relu par App.init) :
    // supprimée si elle contient ce joueur, ou si plus aucun joueur n'existe
    this._removeLegacyMirror(playerId, updatedList.length === 0);

    // Si c'était le dernier joueur, nettoyer aussi les données legacy orphelines
    if (updatedList.length === 0) {
      this.clearLegacyProgress();
    }

    // Supprimer le joueur courant
    localStorage.removeItem(this.KEYS.CURRENT_PLAYER);

    console.log(`[Storage] Cleared data for player ${playerId} (${keysToDelete.length} keys deleted)`);
  },

  /**
   * Supprime les données de progression legacy (non per-player)
   * Utile pour nettoyer les anciennes données orphelines
   * @returns {number} Nombre de clés supprimées
   */
  clearLegacyProgress() {
    const legacyPrefixes = [
      this.KEYS.DECKS_PREFIX,     // tyb_deck_
      'tyb_multilingual_',         // tyb_multilingual_
    ];

    const keysToDelete = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      for (const prefix of legacyPrefixes) {
        if (key.startsWith(prefix)) {
          keysToDelete.push(key);
          break;
        }
      }
    }

    keysToDelete.forEach(key => this._removeWithBackup(key));
    if (keysToDelete.length > 0) {
      console.log(`[Storage] Cleared ${keysToDelete.length} legacy progress keys`);
    }
    return keysToDelete.length;
  },

  /**
   * Calcule la taille totale du stockage
   * @returns {number} Taille en bytes (UTF-16, donc × 2)
   */
  getStorageSize() {
    let total = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('tyb_')) {
          const value = localStorage.getItem(key);
          if (value) {
            total += value.length * 2; // UTF-16 = 2 bytes par char
          }
        }
      }
    } catch (e) {
      console.error('[Storage] getStorageSize error:', e);
    }
    return total;
  },

  /**
   * Migre les données vers la version actuelle
   * @private
   * @param {Object} data - Données à migrer
   * @returns {Object} Données migrées
   */
  _migrateData(data) {
    // Pour l'instant, pas de migration nécessaire
    // Les futures versions peuvent ajouter des transformations ici
    return data;
  }
};

// Messages au joueur : quota presque plein / dépassé, données restaurées
Storage._installDefaultNotifiers();

// Export pour Node.js (tests)
if (typeof module !== 'undefined') {
  module.exports = Storage;
}
