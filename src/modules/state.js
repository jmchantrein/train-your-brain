/**
 * State Module
 * State management réactif avec pattern Observer
 */

const State = {
  // Données de l'état
  _data: {},

  // Subscribers : Map<key, Set<callback>>
  _subscribers: new Map(),

  // État "dirty" : indique si des modifications non sauvegardées existent
  _dirty: false,

  // Clés qui rendent l'état "dirty" quand modifiées
  _dirtyKeys: ['player', 'decks'],

  /**
   * Récupère une valeur de l'état
   *
   * @param {string} key - Clé de la valeur
   * @returns {*} - Valeur associée à la clé (undefined si inexistante)
   */
  get(key) {
    return this._data[key];
  },

  /**
   * Définit une valeur dans l'état et notifie les subscribers
   *
   * @param {string} key - Clé de la valeur
   * @param {*} value - Nouvelle valeur
   * @returns {*} - La valeur définie
   */
  set(key, value) {
    const oldValue = this._data[key];
    this._data[key] = value;

    // Marquer comme dirty si clé sensible
    if (this._dirtyKeys.includes(key)) {
      this._dirty = true;
      // Notifier les subscribers du changement dirty
      this._notify('_dirty', true, false);
    }

    // Notifier les subscribers
    this._notify(key, value, oldValue);

    return value;
  },

  /**
   * Merge partiel d'un objet dans l'état
   * Fusionne les propriétés fournies avec l'objet existant
   *
   * @param {string} key - Clé de l'objet
   * @param {Object} updates - Propriétés à fusionner
   * @returns {Object} - L'objet mis à jour
   */
  update(key, updates) {
    const current = this._data[key] || {};
    return this.set(key, { ...current, ...updates });
  },

  /**
   * S'abonne aux changements d'une clé
   *
   * @param {string} key - Clé à observer
   * @param {Function} callback - Fonction appelée lors des changements (newValue, oldValue)
   * @returns {Function} - Fonction de désabonnement
   */
  subscribe(key, callback) {
    // Créer le Set de callbacks si nécessaire
    if (!this._subscribers.has(key)) {
      this._subscribers.set(key, new Set());
    }

    // Ajouter le callback
    this._subscribers.get(key).add(callback);

    // Retourner fonction de désabonnement
    return () => {
      const subscribers = this._subscribers.get(key);
      if (subscribers) {
        subscribers.delete(callback);
      }
    };
  },

  /**
   * Notifie tous les subscribers d'une clé
   * Gère les erreurs des callbacks de manière isolée
   *
   * @private
   * @param {string} key - Clé modifiée
   * @param {*} value - Nouvelle valeur
   * @param {*} oldValue - Ancienne valeur
   */
  _notify(key, value, oldValue) {
    const subscribers = this._subscribers.get(key);

    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(value, oldValue);
        } catch (error) {
          // Isoler les erreurs : un subscriber qui échoue ne doit pas
          // bloquer les autres subscribers
          console.error('[State] Subscriber error:', error);
        }
      });
    }
  },

  /**
   * Récupère une copie de toutes les données
   * Utile pour le debug
   *
   * @returns {Object} - Copie shallow de l'état
   */
  getAll() {
    return { ...this._data };
  },

  /**
   * Vérifie si l'état contient des modifications non sauvegardées
   *
   * @returns {boolean} - true si dirty
   */
  isDirty() {
    return this._dirty;
  },

  /**
   * Marque l'état comme propre (après une sauvegarde)
   */
  clearDirty() {
    const wasDirty = this._dirty;
    this._dirty = false;
    if (wasDirty) {
      this._notify('_dirty', false, true);
    }
  },

  /**
   * Réinitialise complètement l'état
   * Efface les données et les subscribers
   */
  reset() {
    this._data = {};
    this._dirty = false;
    this._subscribers.clear();
  }
};

// Export pour tests Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = State;
}
