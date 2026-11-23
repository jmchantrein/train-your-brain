/**
 * Deck Editor Card Binder - Binding des événements d'édition de cartes
 *
 * Gère les événements pour :
 * - Changement de type de carte
 * - Édition des champs (question, réponse, feedback, hint, alternatives)
 * - Gestion des médias (upload, suppression)
 * - Édition des choix QCM
 *
 * @module DeckEditorCardBinder
 */

/**
 * Contexte de binding pour les événements
 * @typedef {Object} CardBinderContext
 * @property {Deck} deck - Deck en cours d'édition
 * @property {Function} onSync - Callback de synchronisation immédiate
 * @property {Function} onSyncDebounced - Callback de synchronisation différée
 * @property {Function} onRemount - Callback de re-rendu complet
 */

const DeckEditorCardBinder = {
  /**
   * Bind tous les événements d'édition inline des cartes
   *
   * Attache les event listeners pour toutes les interactions
   * possibles sur les cartes dans l'éditeur.
   *
   * @param {HTMLElement} container - Container DOM de l'éditeur
   * @param {CardBinderContext} context - Contexte avec callbacks
   * @returns {void}
   */
  bindAll(container, context) {
    this._bindTypeChange(container, context);
    this._bindQuestionInput(container, context);
    this._bindAnswerInput(container, context);
    this._bindAlternativesInput(container, context);
    this._bindFeedbackInput(container, context);
    this._bindHintInput(container, context);
    this._bindMediaUpload(container, context);
    this._bindMediaRemove(container, context);
    this._bindMcqEvents(container, context);
  },

  /**
   * Bind le changement de type de carte (text, numeric, mcq, etc.)
   *
   * @private
   * @param {HTMLElement} container - Container DOM
   * @param {CardBinderContext} context - Contexte
   * @returns {void}
   */
  _bindTypeChange(container, context) {
    container.querySelectorAll('.split-editor__card-type').forEach(select => {
      select.addEventListener('change', (e) => {
        const index = parseInt(select.dataset.index, 10);
        if (!context.deck?.cards?.[index]) return;

        const newType = e.target.value;
        const oldType = context.deck.cards[index].type;
        context.deck.cards[index].type = newType;

        // Si changement vers/depuis QCM, forcer re-render
        if (newType === 'mcq' || oldType === 'mcq') {
          if (newType === 'mcq' && !context.deck.cards[index].choices) {
            context.deck.cards[index].choices = [
              { id: 'A', text: '' },
              { id: 'B', text: '' }
            ];
          }
          context.onSync();
          context.onRemount();
        } else {
          context.onSyncDebounced();
        }
      });
    });
  },

  /**
   * Bind l'édition des questions (textarea)
   *
   * @private
   * @param {HTMLElement} container - Container DOM
   * @param {CardBinderContext} context - Contexte
   * @returns {void}
   */
  _bindQuestionInput(container, context) {
    container.querySelectorAll('.split-editor__card-question').forEach(textarea => {
      textarea.addEventListener('input', (e) => {
        const index = parseInt(textarea.dataset.index, 10);
        if (context.deck?.cards?.[index]) {
          context.deck.cards[index].question = e.target.value;
          context.onSyncDebounced();
        }
      });
    });
  },

  /**
   * Bind l'édition des réponses (input text)
   *
   * @private
   * @param {HTMLElement} container - Container DOM
   * @param {CardBinderContext} context - Contexte
   * @returns {void}
   */
  _bindAnswerInput(container, context) {
    container.querySelectorAll('.split-editor__card-answer').forEach(input => {
      input.addEventListener('input', (e) => {
        const index = parseInt(input.dataset.index, 10);
        if (context.deck?.cards?.[index]) {
          context.deck.cards[index].answer = e.target.value;
          context.onSyncDebounced();
        }
      });
    });
  },

  /**
   * Bind l'édition des alternatives (réponses acceptables)
   *
   * Parse une liste séparée par virgules et la convertit en tableau.
   * Supprime la propriété alternatives si le champ est vide.
   *
   * @private
   * @param {HTMLElement} container - Container DOM
   * @param {CardBinderContext} context - Contexte
   * @returns {void}
   */
  _bindAlternativesInput(container, context) {
    container.querySelectorAll('.split-editor__card-alternatives').forEach(input => {
      input.addEventListener('input', (e) => {
        const index = parseInt(input.dataset.index, 10);
        if (!context.deck?.cards?.[index]) return;

        const value = e.target.value.trim();
        if (value) {
          context.deck.cards[index].alternatives = value.split(',').map(s => s.trim()).filter(Boolean);
        } else {
          delete context.deck.cards[index].alternatives;
        }
        context.onSyncDebounced();
      });
    });
  },

  /**
   * Bind l'édition des feedbacks (explications pédagogiques)
   *
   * Supprime la propriété feedback si le champ est vide.
   *
   * @private
   * @param {HTMLElement} container - Container DOM
   * @param {CardBinderContext} context - Contexte
   * @returns {void}
   */
  _bindFeedbackInput(container, context) {
    container.querySelectorAll('.split-editor__card-feedback').forEach(textarea => {
      textarea.addEventListener('input', (e) => {
        const index = parseInt(textarea.dataset.index, 10);
        if (!context.deck?.cards?.[index]) return;

        const value = e.target.value.trim();
        if (value) {
          context.deck.cards[index].feedback = value;
        } else {
          delete context.deck.cards[index].feedback;
        }
        context.onSyncDebounced();
      });
    });
  },

  /**
   * Bind l'édition des hints (indices)
   *
   * Supprime la propriété hint si le champ est vide.
   *
   * @private
   * @param {HTMLElement} container - Container DOM
   * @param {CardBinderContext} context - Contexte
   * @returns {void}
   */
  _bindHintInput(container, context) {
    container.querySelectorAll('.split-editor__card-hint').forEach(input => {
      input.addEventListener('input', (e) => {
        const index = parseInt(input.dataset.index, 10);
        if (!context.deck?.cards?.[index]) return;

        const value = e.target.value.trim();
        if (value) {
          context.deck.cards[index].hint = value;
        } else {
          delete context.deck.cards[index].hint;
        }
        context.onSyncDebounced();
      });
    });
  },

  /**
   * Bind l'upload de média (images)
   *
   * Vérifie la taille du fichier (max 500KB) et convertit
   * l'image en base64 pour stockage dans la carte.
   * Déclenche un re-render complet après l'upload.
   *
   * @private
   * @param {HTMLElement} container - Container DOM
   * @param {CardBinderContext} context - Contexte
   * @returns {void}
   */
  _bindMediaUpload(container, context) {
    container.querySelectorAll('.split-editor__card-media-input').forEach(input => {
      input.addEventListener('change', async (e) => {
        const index = parseInt(input.dataset.index, 10);
        const file = e.target.files?.[0];
        if (!file || !context.deck?.cards?.[index]) return;

        // Vérifier la taille (max 500KB)
        if (file.size > 500 * 1024) {
          alert(i18n.t('editor.imageTooLarge'));
          return;
        }

        // Convertir en base64
        const reader = new FileReader();
        reader.onload = () => {
          context.deck.cards[index].media = reader.result;
          context.onSync();
          context.onRemount();
        };
        reader.readAsDataURL(file);
      });
    });
  },

  /**
   * Bind la suppression de média
   *
   * Supprime la propriété media de la carte et
   * déclenche un re-render complet.
   *
   * @private
   * @param {HTMLElement} container - Container DOM
   * @param {CardBinderContext} context - Contexte
   * @returns {void}
   */
  _bindMediaRemove(container, context) {
    container.querySelectorAll('.split-editor__card-media-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index, 10);
        if (context.deck?.cards?.[index]) {
          delete context.deck.cards[index].media;
          context.onSync();
          context.onRemount();
        }
      });
    });
  },

  /**
   * Bind tous les événements QCM (Questions à Choix Multiples)
   *
   * Délègue aux méthodes spécialisées pour chaque type d'interaction :
   * - Édition du texte des choix
   * - Toggle des bonnes réponses
   * - Ajout/suppression de choix
   *
   * @private
   * @param {HTMLElement} container - Container DOM
   * @param {CardBinderContext} context - Contexte
   * @returns {void}
   */
  _bindMcqEvents(container, context) {
    this._bindMcqTextInput(container, context);
    this._bindMcqCorrectToggle(container, context);
    this._bindMcqAdd(container, context);
    this._bindMcqRemove(container, context);
  },

  /**
   * Bind l'édition du texte des choix QCM
   *
   * Crée automatiquement le tableau choices s'il n'existe pas.
   * Crée le choix s'il n'existe pas encore dans le tableau.
   *
   * @private
   * @param {HTMLElement} container - Container DOM
   * @param {CardBinderContext} context - Contexte
   * @returns {void}
   */
  _bindMcqTextInput(container, context) {
    container.querySelectorAll('.split-editor__mcq-text').forEach(input => {
      input.addEventListener('input', (e) => {
        const index = parseInt(input.dataset.index, 10);
        const choiceId = input.dataset.choice;
        if (!context.deck?.cards?.[index]) return;

        if (!context.deck.cards[index].choices) {
          context.deck.cards[index].choices = [];
        }

        let choice = context.deck.cards[index].choices.find(c => c.id === choiceId);
        if (!choice) {
          choice = { id: choiceId, text: '' };
          context.deck.cards[index].choices.push(choice);
        }
        choice.text = e.target.value;
        context.onSyncDebounced();
      });
    });
  },

  /**
   * Bind le toggle des bonnes réponses QCM
   *
   * La réponse de la carte contient les IDs des choix corrects
   * séparés par des virgules (ex: "A,C" pour QCM multi-réponses).
   *
   * @private
   * @param {HTMLElement} container - Container DOM
   * @param {CardBinderContext} context - Contexte
   * @returns {void}
   */
  _bindMcqCorrectToggle(container, context) {
    container.querySelectorAll('.split-editor__mcq-correct').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const index = parseInt(checkbox.dataset.index, 10);
        const choiceId = checkbox.dataset.choice;
        if (!context.deck?.cards?.[index]) return;

        const currentAnswer = context.deck.cards[index].answer || '';
        let correctIds = currentAnswer.split(',').map(s => s.trim()).filter(Boolean);

        if (e.target.checked) {
          if (!correctIds.includes(choiceId)) {
            correctIds.push(choiceId);
          }
        } else {
          correctIds = correctIds.filter(id => id !== choiceId);
        }

        context.deck.cards[index].answer = correctIds.join(',');
        context.onSyncDebounced();
      });
    });
  },

  /**
   * Bind l'ajout de choix QCM
   *
   * Ajoute un nouveau choix avec le prochain ID disponible (A-Z).
   * Déclenche un re-render complet après l'ajout.
   * Limite implicite de 26 choix (A-Z).
   *
   * @private
   * @param {HTMLElement} container - Container DOM
   * @param {CardBinderContext} context - Contexte
   * @returns {void}
   */
  _bindMcqAdd(container, context) {
    container.querySelectorAll('.split-editor__mcq-add').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index, 10);
        if (!context.deck?.cards?.[index]) return;

        const choiceIds = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (!context.deck.cards[index].choices) {
          context.deck.cards[index].choices = [];
        }

        const existingIds = context.deck.cards[index].choices.map(c => c.id);
        let nextId = null;
        for (const id of choiceIds) {
          if (!existingIds.includes(id)) {
            nextId = id;
            break;
          }
        }

        if (nextId) {
          context.deck.cards[index].choices.push({ id: nextId, text: '' });
          context.onSync();
          context.onRemount();
        }
      });
    });
  },

  /**
   * Bind la suppression de choix QCM
   *
   * Supprime le choix du tableau choices et le retire également
   * de la liste des réponses correctes si nécessaire.
   * Déclenche un re-render complet après la suppression.
   *
   * @private
   * @param {HTMLElement} container - Container DOM
   * @param {CardBinderContext} context - Contexte
   * @returns {void}
   */
  _bindMcqRemove(container, context) {
    container.querySelectorAll('.split-editor__mcq-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.index, 10);
        const choiceId = btn.dataset.choice;
        if (!context.deck?.cards?.[index]?.choices) return;

        // Supprimer le choix
        context.deck.cards[index].choices = context.deck.cards[index].choices.filter(c => c.id !== choiceId);

        // Retirer des réponses correctes
        const currentAnswer = context.deck.cards[index].answer || '';
        const correctIds = currentAnswer.split(',').filter(id => id !== choiceId);
        context.deck.cards[index].answer = correctIds.join(',');

        context.onSync();
        context.onRemount();
      });
    });
  }
};

// Export pour Node.js (tests) et navigateur
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DeckEditorCardBinder;
}
