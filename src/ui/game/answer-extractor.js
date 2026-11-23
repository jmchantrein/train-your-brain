/**
 * Answer Extractor - Extraction des réponses depuis le DOM
 *
 * Extrait les réponses utilisateur selon le type de carte :
 * - text/numeric : valeur de l'input
 * - mcq : IDs des choix sélectionnés
 * - truefalse : "true" ou "false"
 * - cloze : valeurs séparées par |
 * - matching : paires id:valeur séparées par |
 * - audio-choice : ID du choix sélectionné (similaire à mcq)
 *
 * Dépendances: aucune (module pur)
 */

const GameAnswerExtractor = {
  /**
   * Extrait la réponse selon le type de carte
   * @param {HTMLElement} container - Container DOM
   * @param {Object} card - Carte courante
   * @returns {string} Réponse extraite (vide si invalide)
   */
  extractByType(container, card) {
    const type = card.type || 'text';

    switch (type) {
      case 'mcq':
        return this.extractMCQ(container);

      case 'truefalse':
        return this.extractTrueFalse(container);

      case 'cloze':
        return this.extractCloze(container);

      case 'matching':
        return this.extractMatching(container);

      case 'audio-choice':
        return this.extractAudioChoice(container);

      case 'staff-note':
        return this.extractStaffNote(container);

      case 'numeric':
      case 'text':
      default:
        return this.extractText(container);
    }
  },

  /**
   * Extrait une réponse texte simple
   * @param {HTMLElement} container - Container DOM
   * @returns {string} Valeur de l'input
   */
  extractText(container) {
    const input = container.querySelector('#answer-input');
    return input ? input.value.trim() : '';
  },

  /**
   * Extrait les réponses QCM (une ou plusieurs)
   * @param {HTMLElement} container - Container DOM
   * @returns {string} IDs séparés par virgule
   */
  extractMCQ(container) {
    const checked = container.querySelectorAll('.game-card__choice-input:checked');
    return Array.from(checked).map(input => input.value).join(',');
  },

  /**
   * Extrait la réponse vrai/faux
   * @param {HTMLElement} container - Container DOM
   * @returns {string} "true", "false" ou ""
   */
  extractTrueFalse(container) {
    const checked = container.querySelector('.game-card__tf-input:checked');
    return checked ? checked.value : '';
  },

  /**
   * Extrait les réponses des trous (cloze)
   * @param {HTMLElement} container - Container DOM
   * @returns {string} Valeurs séparées par | (vide si aucun trou rempli)
   */
  extractCloze(container) {
    const inputs = container.querySelectorAll('.game-card__cloze-input, .game-card__cloze-select');
    const values = Array.from(inputs).map(input => input.value.trim());

    // Vérifier qu'au moins un trou est rempli
    if (values.every(v => !v)) return '';

    return values.join('|');
  },

  /**
   * Extrait les appariements (matching)
   * @param {HTMLElement} container - Container DOM
   * @returns {string} Paires "id:valeur" séparées par | (vide si incomplet)
   */
  extractMatching(container) {
    const selects = container.querySelectorAll('.game-card__match-select');
    const pairs = [];
    let allFilled = true;

    selects.forEach(select => {
      const pairId = select.dataset.pairId;
      const value = select.value.trim();
      if (!value) allFilled = false;
      pairs.push(`${pairId}:${value}`);
    });

    if (!allFilled) return '';

    return pairs.join('|');
  },

  /**
   * Extrait la réponse audio-choice (similaire à MCQ avec radio uniquement)
   * @param {HTMLElement} container - Container DOM
   * @returns {string} ID du choix sélectionné
   */
  extractAudioChoice(container) {
    const checked = container.querySelector('input[name="audio-choice-answer"]:checked');
    return checked ? checked.value : '';
  },

  /**
   * Extrait la réponse staff-note (similaire à MCQ avec radio uniquement)
   * @param {HTMLElement} container - Container DOM
   * @returns {string} ID du choix sélectionné
   */
  extractStaffNote(container) {
    const checked = container.querySelector('input[name="staff-note-answer"]:checked');
    return checked ? checked.value : '';
  }
};

// Export pour Node.js (tests) et navigateur
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameAnswerExtractor;
}
