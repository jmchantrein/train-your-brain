/**
 * Prompt Generator - YAML Editor Logic
 *
 * Gère la logique métier de l'éditeur YAML :
 * - Validation et parsing YAML avec nettoyage des blocs markdown
 * - Import de deck dans le storage
 * - Synchronisation des champs visuels vers le deck
 * - Édition de cartes via modal
 * - Génération de prompts de correction
 *
 * @module PromptGeneratorYamlLogic
 * @requires YAML
 * @requires Storage
 * @requires State
 * @requires Router
 * @requires App
 * @requires DeckValidator
 * @requires PromptGenerator
 * @requires PromptLearner
 */

const PromptGeneratorYamlLogic = {
  /**
   * Valide et parse le contenu YAML
   *
   * Nettoie les blocs de code markdown, génère les IDs manquants,
   * valide la structure et la qualité du deck.
   *
   * @param {string} yamlContent - Contenu YAML brut (peut contenir des blocs markdown)
   * @param {Object[]} iterationHistory - Historique des itérations (modifié in-place)
   * @returns {{parsedDeck: Deck|null, yamlError: string|null, validationReport: DeckValidationReport|null}}
   */
  validateYaml(yamlContent, iterationHistory) {
    let yamlError = null;
    let parsedDeck = null;
    let validationReport = null;

    if (!yamlContent.trim()) {
      return { parsedDeck: null, yamlError: i18n.t('yamlLogic.empty'), validationReport: null };
    }

    // Nettoyer le contenu des blocs de code markdown
    let cleanContent = yamlContent.trim();

    const codeBlockRegex = /```(?:yaml|json|yml)?\s*\n([\s\S]*?)\n```/;
    const match = cleanContent.match(codeBlockRegex);
    if (match) {
      cleanContent = match[1];
    } else {
      cleanContent = cleanContent
        .replace(/^```(?:yaml|json|yml)?\s*\n?/, '')
        .replace(/\n?```\s*$/, '');
    }

    // Chercher le début du YAML si nécessaire
    if (!cleanContent.match(/^(id|name|description|category|settings|cards|tags):/m)) {
      const yamlStartMatch = cleanContent.match(/^(id|name|description|category|settings|cards|tags):/m);
      if (yamlStartMatch && yamlStartMatch.index !== undefined) {
        cleanContent = cleanContent.substring(yamlStartMatch.index);
      }
    }

    try {
      const parsed = YAML.parse(cleanContent);
      const foundKeys = parsed ? Object.keys(parsed) : [];
      const errors = [];

      if (!parsed || typeof parsed !== 'object') {
        errors.push(i18n.t('yamlLogic.invalid'));
      } else if (!parsed.id && !parsed.name) {
        errors.push(i18n.t('yamlLogic.needIdOrName') +
          (foundKeys.length > 0 ? ' ' + i18n.t('yamlLogic.foundKeys', { keys: foundKeys.join(', ') }) : ' ' + i18n.t('yamlLogic.noKeys')));
      }

      if (!parsed.cards || !Array.isArray(parsed.cards)) {
        errors.push(i18n.t('yamlLogic.needCards') +
          (foundKeys.length > 0 ? ' ' + i18n.t('yamlLogic.foundKeys', { keys: foundKeys.join(', ') }) : ''));
      } else if (parsed.cards.length === 0) {
        errors.push(i18n.t('yamlLogic.needOneCard'));
      } else {
        parsed.cards.forEach((card, index) => {
          if (!card.question) {
            errors.push(i18n.t('yamlLogic.missingField', { n: index + 1, field: 'question' }));
          }
          if (card.answer === undefined || card.answer === null) {
            errors.push(i18n.t('yamlLogic.missingField', { n: index + 1, field: 'answer' }));
          }
        });
      }

      if (errors.length > 0) {
        return { parsedDeck: null, yamlError: errors.join('\n'), validationReport: null };
      }

      // Générer les IDs manquants
      if (!parsed.id) {
        parsed.id = 'deck_' + Date.now();
      }

      parsed.cards.forEach((card, index) => {
        if (!card.id) {
          card.id = `${parsed.id}_card_${index + 1}`;
        }
      });

      parsedDeck = parsed;

      // Validation qualité
      if (typeof DeckValidator !== 'undefined' && DeckValidator.validateDeck) {
        validationReport = DeckValidator.validateDeck(parsed);
      } else if (typeof PromptGenerator !== 'undefined' && PromptGenerator.validateDeck) {
        validationReport = PromptGenerator.validateDeck(parsed);
      }

      // Enregistrer l'itération
      if (typeof PromptLearner !== 'undefined' && validationReport && iterationHistory) {
        const iteration = PromptLearner.recordIteration(validationReport, parsed);
        iterationHistory.push(iteration);
      }

      return { parsedDeck, yamlError: null, validationReport };

    } catch (e) {
      return { parsedDeck: null, yamlError: i18n.t('yamlLogic.parseError', { message: e.message }), validationReport: null };
    }
  },

  /**
   * Importe un deck parsé dans le storage
   *
   * Initialise la progression des cartes (box: never_played),
   * gère les conflits d'ID, termine la session d'apprentissage,
   * et rafraîchit l'état global.
   *
   * @param {Deck} parsedDeck - Deck parsé et validé
   * @param {AppState} state - État global de l'application
   * @returns {boolean} true si l'import a réussi, false si annulé
   */
  importDeck(parsedDeck, state) {
    if (!parsedDeck) return false;

    const deck = {
      ...parsedDeck,
      cards: parsedDeck.cards.map(card => ({
        ...card,
        box: 'never_played',
        latencyThreshold: null,
        bestResponseTimeMs: null,
        lastResponseTimeMs: null,
        restUntil: null,
        timesPlayed: 0,
        timesCorrect: 0
      }))
    };

    const existingDecks = Storage.loadCustomDecks() || [];
    const existingDeck = existingDecks.find(d => d.id === deck.id);

    if (existingDeck) {
      if (!confirm(i18n.t('yamlEditor.replaceConfirm', { id: deck.id }))) {
        return false;
      }
    }

    Storage.saveCustomDeck(deck);

    // Terminer la session d'apprentissage
    if (typeof PromptLearner !== 'undefined') {
      PromptLearner.endSession(true);
    }

    // Rafraîchir les decks
    const allDecks = App._loadDecks();
    State.set('decks', allDecks);

    alert(i18n.tn('yamlEditor.imported', deck.cards.length, { name: deck.name || deck.id }));
    return true;
  },

  /**
   * Synchronise les champs visuels vers le deck parsé
   *
   * Lit les valeurs des champs DOM et met à jour
   * le deck correspondant (nom, description, difficulté, settings).
   *
   * @param {HTMLElement} container - Container DOM avec les champs
   * @param {Deck} parsedDeck - Deck à mettre à jour (modifié in-place)
   * @returns {void}
   */
  syncVisualToParsedDeck(container, parsedDeck) {
    if (!parsedDeck) return;

    const name = container.querySelector('#visual-deck-name')?.value;
    const desc = container.querySelector('#visual-deck-desc')?.value;
    const difficulty = container.querySelector('#visual-deck-difficulty')?.value;
    const similarity = container.querySelector('#visual-deck-similarity')?.checked;

    if (name !== undefined) parsedDeck.name = name;
    if (desc !== undefined) parsedDeck.description = desc;
    if (difficulty !== undefined && difficulty !== '') {
      parsedDeck.difficulty = parseInt(difficulty, 10);
    } else {
      delete parsedDeck.difficulty;
    }

    if (similarity !== undefined) {
      parsedDeck.settings = parsedDeck.settings || {};
      parsedDeck.settings.similarityMatching = similarity;
    }
  },

  /**
   * Sauvegarde une carte depuis la modal d'édition
   *
   * Lit les champs de la modal, valide les données obligatoires,
   * crée ou met à jour la carte, puis revalide le deck complet.
   *
   * @param {HTMLElement} container - Container DOM avec la modal
   * @param {Deck} parsedDeck - Deck à mettre à jour (modifié in-place)
   * @param {number} editingCardIndex - Index de la carte (-1 pour nouvelle carte)
   * @returns {{success: boolean, validationReport: DeckValidationReport|null}}
   */
  saveCardFromModal(container, parsedDeck, editingCardIndex) {
    const question = container.querySelector('#modal-card-question')?.value?.trim();
    const answer = container.querySelector('#modal-card-answer')?.value?.trim();
    const typeValue = container.querySelector('#modal-card-type')?.value;
    const hint = container.querySelector('#modal-card-hint')?.value?.trim();
    const feedback = container.querySelector('#modal-card-feedback')?.value?.trim();
    const alternativesRaw = container.querySelector('#modal-card-alternatives')?.value?.trim();

    if (!question || !answer) {
      alert(i18n.t('editor.questionAnswerRequired'));
      return { success: false, validationReport: null };
    }

    const alternatives = alternativesRaw
      ? alternativesRaw.split('\n').map(a => a.trim()).filter(a => a.length > 0)
      : [];

    const card = {
      id: editingCardIndex === -1 ? `card_${Date.now()}` : parsedDeck.cards[editingCardIndex].id,
      question,
      answer,
      ...(typeValue ? { type: typeValue } : {}),
      ...(alternatives.length > 0 ? { alternatives } : {}),
      ...(hint ? { hint } : {}),
      ...(feedback ? { feedback } : {})
    };

    if (editingCardIndex === -1) {
      parsedDeck.cards.push(card);
    } else {
      parsedDeck.cards[editingCardIndex] = card;
    }

    // Revalider le deck
    let validationReport = null;
    if (typeof DeckValidator !== 'undefined' && DeckValidator.validateDeck) {
      validationReport = DeckValidator.validateDeck(parsedDeck);
    } else if (typeof PromptGenerator !== 'undefined' && PromptGenerator.validateDeck) {
      validationReport = PromptGenerator.validateDeck(parsedDeck);
    }

    return { success: true, validationReport };
  },

  /**
   * Génère un prompt de correction pour les problèmes détectés
   *
   * Utilise DeckValidator pour générer un prompt destiné à un LLM
   * pour corriger automatiquement les problèmes du deck.
   *
   * @param {Deck} parsedDeck - Deck avec problèmes à corriger
   * @param {DeckValidationReport} validationReport - Rapport détaillant les problèmes
   * @returns {string} Prompt de correction formaté, ou message d'erreur
   */
  generateCorrectionPrompt(parsedDeck, validationReport) {
    if (typeof DeckValidator !== 'undefined' && DeckValidator.generateCorrectionPrompt) {
      return DeckValidator.generateCorrectionPrompt(parsedDeck, validationReport);
    }
    return '❌ ' + i18n.t('yamlLogic.validatorMissing');
  }
};

// Export pour Node.js (tests) et navigateur
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PromptGeneratorYamlLogic;
}
