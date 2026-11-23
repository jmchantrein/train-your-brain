/**
 * Module Leitner - Algorithme de répétition espacée
 *
 * Implémente le système Leitner avec 4 boîtes et repos adaptatif.
 *
 * @module Leitner
 */

const Leitner = {
  // ═══════════════════════════════════════════════════════════════
  // CONSTANTES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Les 4 boîtes du système Leitner
   */
  BOXES: ['never_played', 'purple', 'orange', 'green'],

  /**
   * Priorité de pioche (0 = priorité max)
   */
  BOX_PRIORITY: {
    never_played: 0,
    purple: 1,
    orange: 2,
    green: 3
  },

  /**
   * Nombre de jours de repos initial pour une carte verte
   */
  DEFAULT_REST_DAYS: 3,

  /**
   * Coefficient minimum pour le calcul du repos
   */
  MIN_COEFFICIENT: 1.2,

  /**
   * Coefficient maximum pour le calcul du repos
   */
  MAX_COEFFICIENT: 2.0,

  // ═══════════════════════════════════════════════════════════════
  // FONCTIONS PRINCIPALES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Détermine la prochaine boîte d'une carte après une réponse
   *
   * @param {string} currentBox - Boîte actuelle ('never_played'|'purple'|'orange'|'green')
   * @param {boolean} isCorrect - La réponse était-elle correcte ?
   * @param {number} responseTimeMs - Temps de réponse en millisecondes
   * @param {number} thresholdMs - Seuil de latence en millisecondes
   * @returns {string} - Nouvelle boîte
   *
   * Règles :
   * - Incorrect → 'purple'
   * - Correct + never_played → 'green' (toujours vert la première fois)
   * - Correct + rapide (≤ seuil) → 'green'
   * - Correct + lent (> seuil) → 'orange'
   */
  getNextBox(currentBox, isCorrect, responseTimeMs, thresholdMs) {
    // Validation
    if (!this.BOXES.includes(currentBox)) {
      throw new Error(`Invalid box: ${currentBox}`);
    }
    if (typeof isCorrect !== 'boolean') {
      throw new Error('isCorrect must be boolean');
    }
    if (responseTimeMs < 0 || thresholdMs < 0) {
      throw new Error('Times must be positive');
    }

    // Réponse incorrecte → toujours purple
    if (!isCorrect) {
      return 'purple';
    }

    // Première fois (never_played) → toujours green
    if (currentBox === 'never_played') {
      return 'green';
    }

    // Réponse rapide (≤ seuil) → green
    if (responseTimeMs <= thresholdMs) {
      return 'green';
    }

    // Réponse lente (> seuil) → orange
    return 'orange';
  },

  /**
   * Met à jour le seuil de latence d'une carte
   *
   * @param {Object} card - La carte avec card.box et card.latencyThreshold
   * @param {boolean} isCorrect - Réponse correcte ?
   * @param {number} responseTimeMs - Temps de réponse en millisecondes
   * @returns {number} - Nouveau seuil en secondes
   *
   * Règles :
   * - never_played : ceil(responseTimeMs / 1000)
   * - Incorrect : seuil conservé
   * - Correct + lent (responseTime > threshold) : seuil + 1
   * - Correct + rapide (responseTime ≤ threshold) : ceil(responseTimeMs / 1000)
   */
  updateLatencyThreshold(card, isCorrect, responseTimeMs) {
    // Première fois (never_played) : définit le seuil initial
    if (card.box === 'never_played') {
      return Math.ceil(responseTimeMs / 1000);
    }

    // Réponse incorrecte : conserve le seuil
    if (!isCorrect) {
      return card.latencyThreshold;
    }

    const thresholdMs = card.latencyThreshold * 1000;

    // Réponse lente (> seuil) : incrémente le seuil
    if (responseTimeMs > thresholdMs) {
      return card.latencyThreshold + 1;
    }

    // Réponse rapide (≤ seuil) : recalcule basé sur le temps réel
    return Math.ceil(responseTimeMs / 1000);
  },

  /**
   * Calcule le nombre de jours de repos pour une carte verte
   *
   * @param {number} responseTimeMs - Temps de réponse en millisecondes
   * @param {number} thresholdMs - Seuil de latence en millisecondes
   * @param {number} previousRestDays - Jours de repos précédent (0 si premier passage en vert)
   * @returns {number} - Nombre de jours de repos
   *
   * Formule :
   * - coefficient = min(max(thresholdMs / responseTimeMs, 1.2), 2.0)
   * - Si premier passage (previousRestDays = 0) : 3 × coefficient
   * - Sinon : previousRestDays × coefficient
   * - Arrondi au plus proche
   */
  calculateRestDays(responseTimeMs, thresholdMs, previousRestDays) {
    // Validation
    if (responseTimeMs < 0 || thresholdMs < 0) {
      throw new Error('Times must be positive');
    }
    if (previousRestDays < 0) {
      throw new Error('previousRestDays must be non-negative');
    }

    // Calcul du coefficient basé sur la rapidité de réponse
    const coefficient = this._calculateCoefficient(responseTimeMs, thresholdMs);

    // Premier passage en vert : 3 jours × coefficient
    if (previousRestDays === 0) {
      return Math.round(this.DEFAULT_REST_DAYS * coefficient);
    }

    // Passages suivants : progression multiplicative
    return Math.round(previousRestDays * coefficient);
  },

  /**
   * Vérifie si une carte peut être jouée aujourd'hui
   *
   * @param {Object} card - La carte avec card.box et card.restUntil
   * @param {string} today - Date ISO (YYYY-MM-DD)
   * @returns {boolean} - True si la carte peut être jouée
   *
   * Règles :
   * - never_played, purple, orange : toujours jouable
   * - green : jouable si today >= card.restUntil
   */
  isCardPlayable(card, today) {
    // Validation
    if (!this.BOXES.includes(card.box)) {
      throw new Error(`Invalid box: ${card.box}`);
    }

    // never_played, purple, orange : toujours jouables
    if (card.box !== 'green') {
      return true;
    }

    // green : vérifier le repos
    if (!card.restUntil) {
      return true; // Pas de date de repos définie
    }

    return today >= card.restUntil;
  },

  /**
   * Rafraîchit les cartes d'un deck : remet les cartes vertes expirées dans la pioche
   *
   * @param {Object} deck - Le deck avec deck.cards
   * @param {string} today - Date ISO (YYYY-MM-DD)
   * @returns {Object} - Deck avec cartes rafraîchies
   *
   * Règles :
   * - Carte verte avec restUntil <= today → retourne dans 'never_played'
   * - Préserve latencyThreshold, restDays, timesPlayed, timesCorrect
   * - Réinitialise restUntil à null
   */
  refreshCards(deck, today) {
    if (!today) {
      throw new Error('today is required');
    }

    const refreshedCards = deck.cards.map(card => {
      // Seules les cartes vertes avec repos expiré sont concernées
      if (card.box !== 'green' || !card.restUntil) {
        return card;
      }

      // Vérifier si le repos est terminé
      if (today >= card.restUntil) {
        return {
          ...card,
          box: 'never_played',
          restUntil: null
          // Préserve: latencyThreshold, restDays, timesPlayed, timesCorrect
        };
      }

      return card;
    });

    return {
      ...deck,
      cards: refreshedCards
    };
  },

  /**
   * Sélectionne les cartes pour une session de jeu
   *
   * @param {Object} deck - Le deck avec deck.cards
   * @param {Object} options - Options de sélection
   * @param {string} options.today - Date ISO (YYYY-MM-DD) (OBLIGATOIRE)
   * @param {number} [options.maxCards=20] - Nombre max de cartes
   * @param {string[]} [options.boxes] - Filtrer par boîtes (défaut: toutes)
   * @param {boolean} [options.ignoreRest=false] - Ignorer le repos des vertes
   * @param {boolean} [options.sequential=false] - Pas de mélange
   * @param {boolean} [options.skipRefresh=false] - Ne pas rafraîchir les cartes (usage interne)
   * @returns {Card[]} - Cartes sélectionnées dans l'ordre de jeu
   *
   * Note : Appelle automatiquement refreshCards() pour remettre les cartes
   * vertes expirées dans la pioche avant la sélection.
   *
   * Ordre de priorité :
   * 1. never_played (incluant les cartes vertes revenues après repos)
   * 2. purple
   * 3. orange
   * 4. green (en repos)
   */
  getCardsForSession(deck, options = {}) {
    // Options par défaut
    const {
      today,
      maxCards = 20,
      boxes = null,
      ignoreRest = false,
      sequential = false,
      skipRefresh = false
    } = options;

    // Validation
    if (!today) {
      throw new Error('today is required');
    }

    // 0. Rafraîchir le deck (cartes vertes expirées → pioche)
    const workingDeck = skipRefresh ? deck : this.refreshCards(deck, today);

    // 1. Filtrer les cartes jouables
    let playableCards = workingDeck.cards.filter(card => {
      // Filtrer par boîte si spécifié
      if (boxes && !boxes.includes(card.box)) {
        return false;
      }

      // Vérifier jouabilité (repos)
      if (ignoreRest) {
        return true; // Toutes les cartes sont jouables
      }

      return this.isCardPlayable(card, today);
    });

    // 2. Trier par priorité de boîte
    playableCards.sort((a, b) => {
      const priorityA = this.BOX_PRIORITY[a.box];
      const priorityB = this.BOX_PRIORITY[b.box];
      return priorityA - priorityB;
    });

    // 3. Grouper par boîte et mélanger chaque groupe (sauf si sequential)
    if (!sequential) {
      const cardsByBox = {};

      // Grouper
      playableCards.forEach(card => {
        if (!cardsByBox[card.box]) {
          cardsByBox[card.box] = [];
        }
        cardsByBox[card.box].push(card);
      });

      // Mélanger chaque groupe
      Object.keys(cardsByBox).forEach(box => {
        cardsByBox[box] = TextUtils.shuffleArray(cardsByBox[box]);
      });

      // Recombiner dans l'ordre de priorité
      playableCards = [];
      this.BOXES.forEach(box => {
        if (cardsByBox[box]) {
          playableCards.push(...cardsByBox[box]);
        }
      });
    }

    // 4. Limiter au nombre max de cartes
    return playableCards.slice(0, maxCards);
  },

  // ═══════════════════════════════════════════════════════════════
  // MÉTHODES PRIVÉES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Calcule le coefficient de repos basé sur la rapidité de réponse
   *
   * @private
   * @param {number} responseTimeMs - Temps de réponse en ms
   * @param {number} thresholdMs - Seuil de latence en ms
   * @returns {number} - Coefficient entre MIN_COEFFICIENT et MAX_COEFFICIENT
   *
   * @example
   * // Réponse 2x plus rapide que le seuil → coef max
   * _calculateCoefficient(500, 1000) // → 2.0
   *
   * @example
   * // Réponse au seuil → coef min
   * _calculateCoefficient(1000, 1000) // → 1.2
   */
  _calculateCoefficient(responseTimeMs, thresholdMs) {
    const ratio = thresholdMs / responseTimeMs;
    return Math.min(Math.max(ratio, this.MIN_COEFFICIENT), this.MAX_COEFFICIENT);
  }
};

// Export pour Node.js (tests) et navigateur
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Leitner;
}
