/**
 * Deck Editor Sync Controller - Synchronisation YAML ↔ Visual
 *
 * Gère :
 * - Synchronisation bidirectionnelle YAML/Visual
 * - Debouncing des syncs
 * - Mise à jour partielle des panneaux
 * - Gestion du cache média (préservation des base64)
 *
 * @module DeckEditorSyncController
 * @requires YAML
 */

const DeckEditorSyncController = {
  /**
   * Timeout pour le debouncing des synchronisations
   * @private
   * @type {number|null}
   */
  _syncTimeout: null,

  /**
   * Cache des médias base64 par ID de carte
   * Permet de préserver les médias lors des conversions YAML
   * @private
   * @type {Map<string, string>}
   */
  _mediaCache: new Map(),

  /**
   * Initialise le cache média depuis un deck
   *
   * Parcourt les cartes et met en cache les médias base64
   * pour pouvoir les restaurer après parsing YAML.
   *
   * @param {Deck} deck - Deck source pour l'initialisation
   * @returns {void}
   */
  initMediaCache(deck) {
    this._mediaCache.clear();
    if (deck?.cards) {
      deck.cards.forEach(card => {
        if (typeof card.media === 'string' && card.media.startsWith('data:')) {
          this._mediaCache.set(card.id, card.media);
        }
      });
    }
  },

  /**
   * Récupère le cache média complet
   *
   * @returns {Map<string, string>} Map cardId → base64 data
   */
  getMediaCache() {
    return this._mediaCache;
  },

  /**
   * Met en cache les médias base64 des cartes
   *
   * Appelé avant la sérialisation YAML pour préserver
   * les données binaires qui seront remplacées par des placeholders.
   *
   * @param {Deck} deck - Deck dont les médias seront cachés
   * @returns {void}
   */
  cacheMedia(deck) {
    if (!deck?.cards) return;
    deck.cards.forEach(card => {
      if (typeof card.media === 'string' && card.media.startsWith('data:')) {
        this._mediaCache.set(card.id, card.media);
      }
    });
  },

  /**
   * Restaure les médias depuis le cache après parsing YAML
   *
   * Remplace les placeholders par les données base64 originales
   * et met à jour le cache avec tout nouveau média.
   *
   * @param {Deck} deck - Deck dont les médias seront restaurés
   * @returns {void}
   */
  restoreMedia(deck) {
    if (!deck?.cards) return;
    deck.cards.forEach(card => {
      if (card.media && YAML.isMediaPlaceholder(card.media)) {
        const cachedMedia = this._mediaCache.get(card.id);
        if (cachedMedia) {
          card.media = cachedMedia;
        } else {
          delete card.media;
        }
      } else if (typeof card.media === 'string' && card.media.startsWith('data:')) {
        this._mediaCache.set(card.id, card.media);
      }
    });
  },

  /**
   * Synchronise le YAML vers le deck avec debouncing
   *
   * Annule tout sync précédent en attente avant de planifier
   * le nouveau sync après le délai spécifié.
   *
   * @param {Function} syncFn - Fonction de synchronisation à appeler
   * @param {number} [delay=300] - Délai en ms avant exécution
   * @returns {void}
   */
  debounceSyncFromYaml(syncFn, delay = 300) {
    clearTimeout(this._syncTimeout);
    this._syncTimeout = setTimeout(syncFn, delay);
  },

  /**
   * Synchronise le deck vers le YAML avec debouncing
   *
   * Annule tout sync précédent en attente avant de planifier
   * le nouveau sync après le délai spécifié.
   *
   * @param {Function} syncFn - Fonction de synchronisation à appeler
   * @param {number} [delay=300] - Délai en ms avant exécution
   * @returns {void}
   */
  debounceSyncToYaml(syncFn, delay = 300) {
    clearTimeout(this._syncTimeout);
    this._syncTimeout = setTimeout(syncFn, delay);
  },

  /**
   * Parse le YAML et construit un objet deck
   *
   * Génère les IDs manquants, préserve les settings du deck actuel,
   * et restaure les médias depuis le cache.
   *
   * @param {string} yamlContent - Contenu YAML brut
   * @param {Deck|null} currentDeck - Deck actuel pour préserver ID et settings
   * @returns {{deck: Deck|null, error: string|null}} Résultat du parsing
   */
  parseYamlToDeck(yamlContent, currentDeck) {
    if (!yamlContent.trim()) {
      return {
        deck: {
          id: currentDeck?.id || 'custom_' + Date.now(),
          name: '',
          description: '',
          tags: [],
          settings: {},
          cards: []
        },
        error: null
      };
    }

    try {
      const parsed = YAML.parse(yamlContent);

      if (!parsed.cards || !Array.isArray(parsed.cards)) {
        return { deck: null, error: i18n.t('editor.yamlNeedsCards') };
      }

      // Generate IDs if missing
      if (!parsed.id) parsed.id = currentDeck?.id || 'custom_' + Date.now();
      parsed.cards.forEach((card, i) => {
        if (!card.id) card.id = `${parsed.id}_card_${i + 1}`;
        if (!card.type) card.type = 'text';
      });

      // Preserve existing settings
      parsed.settings = { ...currentDeck?.settings, ...parsed.settings };
      parsed.tags = parsed.tags || currentDeck?.tags || [];

      // Restaurer les médias
      this.restoreMedia(parsed);

      return { deck: parsed, error: null };
    } catch (e) {
      return { deck: null, error: `Erreur: ${e.message}` };
    }
  },

  /**
   * Sérialise un deck en YAML
   *
   * Met en cache les médias base64 avant sérialisation
   * (ils seront remplacés par des placeholders dans le YAML).
   *
   * @param {Deck} deck - Deck à sérialiser
   * @returns {string} Contenu YAML formaté
   */
  deckToYaml(deck) {
    if (!deck) return '';
    this.cacheMedia(deck);
    return YAML.stringifyDeck(deck, { hideMedia: true });
  },

  /**
   * Met à jour le textarea YAML dans le DOM
   *
   * Ne met pas à jour si la dernière édition venait du YAML
   * (évite les boucles et la perte de position du curseur).
   *
   * @param {HTMLElement} container - Container DOM de l'éditeur
   * @param {string} yamlContent - Nouveau contenu YAML
   * @param {string} lastEditSource - Source de la dernière édition ('yaml'|'visual')
   * @returns {void}
   */
  updateYamlTextarea(container, yamlContent, lastEditSource) {
    const textarea = container.querySelector('#yaml-editor');
    if (textarea && lastEditSource !== 'yaml') {
      textarea.value = yamlContent;
    }
  },

  /**
   * Met à jour l'indicateur de statut du code YAML
   *
   * Affiche l'erreur de parsing ou le nombre de cartes valides.
   *
   * @param {HTMLElement} container - Container DOM de l'éditeur
   * @param {string|null} error - Message d'erreur ou null si valide
   * @param {number} cardCount - Nombre de cartes dans le deck
   * @returns {void}
   */
  updateCodeStatus(container, error, cardCount) {
    const status = container.querySelector('.split-editor__code-status');
    if (!status) return;

    if (error) {
      status.className = 'split-editor__code-status split-editor__code-status--error';
      status.textContent = error;
    } else {
      status.className = 'split-editor__code-status split-editor__code-status--valid';
      status.textContent = cardCount > 0 ? `✓ ${i18n.tn('editor.yamlValidCards', cardCount)}` : `✓ ${i18n.t('editor.yamlValid')}`;
    }
  },

  /**
   * Nettoie les timeouts de synchronisation
   *
   * Appelé lors du démontage du composant pour éviter
   * les appels à des éléments DOM supprimés.
   *
   * @returns {void}
   */
  cleanup() {
    clearTimeout(this._syncTimeout);
    this._syncTimeout = null;
  },

  /**
   * Réinitialise complètement le contrôleur
   *
   * Nettoie les timeouts et vide le cache média.
   * Appelé lors de la fermeture de l'éditeur.
   *
   * @returns {void}
   */
  reset() {
    this.cleanup();
    this._mediaCache.clear();
  }
};

// Export pour Node.js (tests) et navigateur
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DeckEditorSyncController;
}
