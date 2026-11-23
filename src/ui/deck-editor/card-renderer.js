/**
 * Deck Editor Card Renderer - Rendu des éditeurs de cartes
 *
 * Gère le rendu de :
 * - Éditeur de carte inline (collapsed/expanded)
 * - Éditeur de choix QCM
 * - Modal d'édition de carte
 *
 * @module DeckEditorCardRenderer
 * @requires escapeHtml (components.js)
 */

const DeckEditorCardRenderer = {
  /**
   * Rend un éditeur de carte inline (expandable)
   * @param {Card} card - Carte à rendre
   * @param {number} index - Index de la carte
   * @param {number|null} expandedIndex - Index de la carte actuellement étendue
   * @returns {string} HTML
   */
  renderInlineCard(card, index, expandedIndex) {
    const isExpanded = expandedIndex === index;
    const typeIcons = { text: '📝', numeric: '🔢', mcq: '☑️', truefalse: '✓✗', cloze: '📋', matching: '🔗' };
    const typeIcon = typeIcons[card.type] || '📝';

    if (!isExpanded) {
      return this._renderCollapsedCard(card, index, typeIcon);
    }
    return this._renderExpandedCard(card, index);
  },

  /**
   * Rend une carte en mode collapsed (réduit)
   *
   * Affiche un aperçu compact avec question/réponse tronquées,
   * icône de type et boutons d'action (modifier, supprimer).
   *
   * @private
   * @param {Card} card - Carte à rendre
   * @param {number} index - Index de la carte dans le deck
   * @param {string} typeIcon - Emoji représentant le type de carte
   * @returns {string} HTML de la carte collapsed
   */
  _renderCollapsedCard(card, index, typeIcon) {
    return `
      <div class="split-editor__card-item" data-index="${index}">
        <span class="split-editor__card-num">${index + 1}</span>
        <span class="split-editor__card-type-icon" title="${escapeHtml(card.type || 'text')}">${typeIcon}</span>
        <div class="split-editor__card-preview">
          <div class="split-editor__card-q">${escapeHtml(String(card.question || '').substring(0, 50))}${String(card.question || '').length > 50 ? '...' : ''}</div>
          <div class="split-editor__card-a">${escapeHtml(String(card.answer || '').substring(0, 40))}${String(card.answer || '').length > 40 ? '...' : ''}</div>
        </div>
        ${card.media ? `<span class="split-editor__card-media-badge" title="${i18n.t('cardEditor.hasMedia')}" aria-label="${i18n.t('cardEditor.hasMedia')}">🖼️</span>` : ''}
        <div class="split-editor__card-actions">
          <button class="split-editor__card-btn split-editor__expand-card" data-index="${index}" title="${i18n.t('common.edit')}" aria-label="${i18n.t('common.edit')}">✏️</button>
          <button class="split-editor__card-btn split-editor__card-btn--danger split-editor__delete-card" data-index="${index}" title="${i18n.t('common.delete')}" aria-label="${i18n.t('common.delete')}">🗑️</button>
        </div>
      </div>
    `;
  },

  /**
   * Rend une carte en mode expanded (édition inline)
   *
   * Affiche tous les champs éditables : type, question, réponse,
   * alternatives, feedback, hint, média.
   *
   * @private
   * @param {Card} card - Carte à rendre
   * @param {number} index - Index de la carte dans le deck
   * @returns {string} HTML de la carte expanded
   */
  _renderExpandedCard(card, index) {
    return `
      <div class="split-editor__card-item split-editor__card-item--expanded" data-index="${index}">
        <div class="split-editor__card-expanded-header">
          <span class="split-editor__card-num">${index + 1}</span>
          <span class="split-editor__card-expanded-title">${i18n.t('cardEditor.cardNumber', { n: index + 1 })}</span>
          <button class="split-editor__card-btn split-editor__collapse-card" data-index="${index}" title="${i18n.t('cardEditor.collapse')}" aria-label="${i18n.t('cardEditor.collapse')}">▲</button>
        </div>

        <div class="split-editor__card-expanded-body">
          ${this._renderTypeSelector(card, index)}
          ${this._renderQuestionField(card, index)}
          ${card.type === 'mcq' ? this.renderMcqChoices(card, index) : this._renderAnswerFields(card, index)}
          ${this._renderFeedbackField(card, index)}
          ${this._renderHintField(card, index)}
          ${this._renderMediaField(card, index)}
        </div>

        <div class="split-editor__card-expanded-footer">
          <button class="btn btn--small btn--danger split-editor__delete-card" data-index="${index}">🗑️ ${i18n.t('common.delete')}</button>
          <button class="btn btn--small btn--primary split-editor__collapse-card" data-index="${index}">✓ ${i18n.t('common.validate')}</button>
        </div>
      </div>
    `;
  },

  /**
   * Rend le sélecteur de type de carte
   *
   * @private
   * @param {Card} card - Carte (pour valeur actuelle)
   * @param {number} index - Index de la carte
   * @returns {string} HTML du sélecteur
   */
  _renderTypeSelector(card, index) {
    return `
      <div class="split-editor__inline-field">
        <label>${i18n.t('cardEditor.type')}</label>
        <select class="split-editor__visual-select split-editor__card-type" data-index="${index}" aria-label="${i18n.t('cardEditor.cardType')}">
          <option value="text" ${card.type === 'text' || !card.type ? 'selected' : ''}>📝 ${i18n.t('cardType.text')}</option>
          <option value="numeric" ${card.type === 'numeric' ? 'selected' : ''}>🔢 ${i18n.t('cardType.numeric')}</option>
          <option value="mcq" ${card.type === 'mcq' ? 'selected' : ''}>☑️ ${i18n.t('cardType.mcq')}</option>
          <option value="truefalse" ${card.type === 'truefalse' ? 'selected' : ''}>✓✗ ${i18n.t('cardType.truefalse')}</option>
          <option value="cloze" ${card.type === 'cloze' ? 'selected' : ''}>📋 ${i18n.t('cardType.cloze')}</option>
          <option value="matching" ${card.type === 'matching' ? 'selected' : ''}>🔗 ${i18n.t('cardType.matching')}</option>
        </select>
      </div>
    `;
  },

  /**
   * Rend le champ de question (textarea)
   *
   * @private
   * @param {Card} card - Carte (pour valeur actuelle)
   * @param {number} index - Index de la carte
   * @returns {string} HTML du champ question
   */
  _renderQuestionField(card, index) {
    return `
      <div class="split-editor__inline-field">
        <label>${i18n.t('game.question')} *</label>
        <textarea class="split-editor__visual-textarea split-editor__card-question" data-index="${index}" rows="2" aria-label="${i18n.t('game.question')}" placeholder="${i18n.t('cardEditor.questionPlaceholder')}">${escapeHtml(card.question || '')}</textarea>
      </div>
    `;
  },

  /**
   * Rend les champs réponse et alternatives
   *
   * Pour les cartes non-QCM : input réponse + input alternatives.
   *
   * @private
   * @param {Card} card - Carte (pour valeurs actuelles)
   * @param {number} index - Index de la carte
   * @returns {string} HTML des champs réponse
   */
  _renderAnswerFields(card, index) {
    return `
      <div class="split-editor__inline-field">
        <label>${i18n.t('deckReview.answer')} *</label>
        <input type="text" class="split-editor__visual-input split-editor__card-answer" data-index="${index}" value="${escapeHtml(String(card.answer || ''))}" aria-label="${i18n.t('deckReview.answer')}" placeholder="${i18n.t('cardEditor.answerPlaceholder')}">
      </div>
      <div class="split-editor__inline-field">
        <label>${i18n.t('cardEditor.alternatives')}</label>
        <input type="text" class="split-editor__visual-input split-editor__card-alternatives" data-index="${index}" value="${escapeHtml(Array.isArray(card.alternatives) ? card.alternatives.join(', ') : '')}" aria-label="${i18n.t('deckReview.acceptedAnswers')}" placeholder="alt1, alt2, alt3...">
      </div>
    `;
  },

  /**
   * Rend le champ feedback pédagogique
   *
   * @private
   * @param {Card} card - Carte (pour valeur actuelle)
   * @param {number} index - Index de la carte
   * @returns {string} HTML du champ feedback
   */
  _renderFeedbackField(card, index) {
    return `
      <div class="split-editor__inline-field">
        <label>${i18n.t('cardEditor.feedback')}</label>
        <textarea class="split-editor__visual-textarea split-editor__card-feedback" data-index="${index}" rows="2" aria-label="${i18n.t('cardEditor.feedback')}" placeholder="${i18n.t('cardEditor.feedbackPlaceholder')}">${escapeHtml(card.feedback || '')}</textarea>
      </div>
    `;
  },

  /**
   * Rend le champ indice (hint)
   *
   * @private
   * @param {Card} card - Carte (pour valeur actuelle)
   * @param {number} index - Index de la carte
   * @returns {string} HTML du champ hint
   */
  _renderHintField(card, index) {
    return `
      <div class="split-editor__inline-field">
        <label>${i18n.t('cardEditor.hint')}</label>
        <input type="text" class="split-editor__visual-input split-editor__card-hint" data-index="${index}" value="${escapeHtml(card.hint || '')}" aria-label="${i18n.t('cardEditor.hintLabel')}" placeholder="${i18n.t('cardEditor.hintPlaceholder')}">
      </div>
    `;
  },

  /**
   * Rend le champ média (image/audio)
   *
   * Affiche l'aperçu si média existant (image ou audio),
   * avec bouton de suppression et input file caché.
   *
   * @private
   * @param {Card} card - Carte (pour média actuel)
   * @param {number} index - Index de la carte
   * @returns {string} HTML du champ média
   */
  _renderMediaField(card, index) {
    return `
      <div class="split-editor__inline-field">
        <label>${i18n.t('cardEditor.media')}</label>
        <div class="split-editor__card-media-field">
          ${typeof card.media === 'string' && card.media ? `
            <div class="split-editor__card-media-preview">
              ${card.media.startsWith('data:audio') ? `
                ${CardMedia.audio(card.media, { attrs: 'class="split-editor__card-audio-preview"' })}
              ` : `
                ${CardMedia.image(card.media, { alt: i18n.t('editor.preview'), link: false })}
              `}
              <button type="button" class="split-editor__card-media-remove" data-index="${index}" title="${i18n.t('common.delete')}" aria-label="${i18n.t('common.delete')}">✕</button>
            </div>
          ` : ''}
          <input type="file" id="card-media-${index}" accept="image/*,audio/*" class="split-editor__card-media-input" data-index="${index}" style="display:none;">
          <label for="card-media-${index}" class="btn btn--small">
            🖼️ ${card.media ? i18n.t('cardEditor.changeMedia') : i18n.t('cardEditor.addMedia')}
          </label>
        </div>
      </div>
    `;
  },

  /**
   * Rend l'éditeur de choix pour les QCM
   * @param {Card} card - Carte QCM
   * @param {number} index - Index de la carte
   * @returns {string} HTML
   */
  renderMcqChoices(card, index) {
    const choices = card.choices || [];
    const correctAnswer = card.answer || '';
    const choiceIds = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // Si pas de choix, créer des choix par défaut
    if (choices.length === 0) {
      return `
        <div class="split-editor__inline-field split-editor__mcq-editor" data-index="${index}">
          <label>${i18n.t('cardEditor.choices')} *</label>
          <div class="split-editor__mcq-hint">
            <p>${i18n.t('cardEditor.choicesHintEmpty')}</p>
          </div>
          <div class="split-editor__mcq-choices">
            ${this._renderMcqChoice(index, 'A', '', false)}
            ${this._renderMcqChoice(index, 'B', '', false)}
          </div>
          <button type="button" class="btn btn--small split-editor__mcq-add" data-index="${index}">+ ${i18n.t('cardEditor.addChoice')}</button>
        </div>
      `;
    }

    const correctAnswers = correctAnswer.split(',').map(s => s.trim());

    return `
      <div class="split-editor__inline-field split-editor__mcq-editor" data-index="${index}">
        <label>${i18n.t('cardEditor.choices')} *</label>
        <div class="split-editor__mcq-hint">
          <p>${i18n.t('cardEditor.choicesHint')}</p>
        </div>
        <div class="split-editor__mcq-choices">
          ${choices.map((choice, i) => {
            const choiceId = choice.id || choiceIds[i];
            const isCorrect = correctAnswers.includes(choiceId);
            return this._renderMcqChoice(index, choiceId, choice.text || '', isCorrect);
          }).join('')}
        </div>
        <button type="button" class="btn btn--small split-editor__mcq-add" data-index="${index}">+ ${i18n.t('cardEditor.addChoice')}</button>
      </div>
    `;
  },

  /**
   * Rend un choix individuel de QCM
   *
   * @private
   * @param {number} index - Index de la carte parente
   * @param {string} choiceId - Identifiant du choix (A, B, C...)
   * @param {string} text - Texte du choix
   * @param {boolean} isCorrect - Si ce choix est une bonne réponse
   * @returns {string} HTML du choix
   */
  _renderMcqChoice(index, choiceId, text, isCorrect) {
    return `
      <div class="split-editor__mcq-choice" data-choice-index="${escapeHtml(choiceId)}">
        <input type="checkbox" class="split-editor__mcq-correct" data-index="${index}" data-choice="${escapeHtml(choiceId)}" aria-label="${i18n.t('cardEditor.correctChoice', { id: escapeHtml(choiceId) })}" ${isCorrect ? 'checked' : ''}>
        <span class="split-editor__mcq-id">${escapeHtml(choiceId)}</span>
        <input type="text" class="split-editor__visual-input split-editor__mcq-text" data-index="${index}" data-choice="${escapeHtml(choiceId)}" value="${escapeHtml(text)}" aria-label="${i18n.t('cardEditor.choiceText', { id: escapeHtml(choiceId) })}" placeholder="${i18n.t('cardEditor.choicePlaceholder')}">
        <button type="button" class="split-editor__mcq-remove" data-index="${index}" data-choice="${escapeHtml(choiceId)}" title="${i18n.t('common.delete')}" aria-label="${i18n.t('common.delete')}">✕</button>
      </div>
    `;
  },

  /**
   * Rend la modal d'édition de carte
   * @param {number} editingCardIndex - Index de la carte en édition (-1 pour nouvelle)
   * @param {Deck} deck - Deck contenant les cartes
   * @returns {string} HTML
   */
  renderCardEditModal(editingCardIndex, deck) {
    const isNew = editingCardIndex === -1;
    const card = isNew ? { question: '', answer: '', type: 'text' } : (deck?.cards?.[editingCardIndex] || {});

    return `
      <div class="editor__card-form-overlay" id="card-modal" style="display: flex;">
        <div class="editor__card-form">
          <div class="editor__card-form-header">
            <h3>${isNew ? i18n.t('cardEditor.newCard') : i18n.t('cardEditor.editCard', { n: editingCardIndex + 1 })}</h3>
            <button class="btn btn--icon split-editor__modal-close" aria-label="${i18n.t('common.close')}" title="${i18n.t('common.close')}">×</button>
          </div>
          <div class="editor__card-form-body">
            <div class="split-editor__visual-field">
              <label for="modal-type">${i18n.t('cardEditor.type')}</label>
              <select id="modal-type" class="split-editor__visual-select">
                <option value="text" ${card.type === 'text' || !card.type ? 'selected' : ''}>📝 ${i18n.t('cardType.text')}</option>
                <option value="numeric" ${card.type === 'numeric' ? 'selected' : ''}>🔢 ${i18n.t('cardType.numeric')}</option>
                <option value="mcq" ${card.type === 'mcq' ? 'selected' : ''}>☑️ ${i18n.t('cardType.mcq')}</option>
                <option value="truefalse" ${card.type === 'truefalse' ? 'selected' : ''}>✓✗ ${i18n.t('cardType.truefalse')}</option>
                <option value="cloze" ${card.type === 'cloze' ? 'selected' : ''}>📋 ${i18n.t('cardType.cloze')}</option>
                <option value="matching" ${card.type === 'matching' ? 'selected' : ''}>🔗 ${i18n.t('cardType.matching')}</option>
              </select>
            </div>
            <div class="split-editor__visual-field">
              <label for="modal-question">${i18n.t('game.question')} *</label>
              <textarea id="modal-question" class="split-editor__visual-textarea" rows="3">${escapeHtml(card.question || '')}</textarea>
            </div>
            <div class="split-editor__visual-field">
              <label for="modal-answer">${i18n.t('deckReview.answer')} *</label>
              <input type="text" id="modal-answer" class="split-editor__visual-input" value="${escapeHtml(String(card.answer || ''))}">
            </div>
            <div class="split-editor__visual-field">
              <label for="modal-feedback">${i18n.t('cardEditor.feedback')} (${i18n.t('common.optional')})</label>
              <textarea id="modal-feedback" class="split-editor__visual-textarea" rows="2" placeholder="${i18n.t('cardEditor.feedbackPlaceholder')}">${escapeHtml(card.feedback || '')}</textarea>
            </div>
            <div class="editor__card-form-footer" style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem;">
              <button class="btn btn--secondary split-editor__modal-cancel">${i18n.t('common.cancel')}</button>
              <button class="btn btn--primary split-editor__modal-save">${i18n.t('cardEditor.saveCard')}</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};

// Export pour Node.js (tests) et navigateur
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DeckEditorCardRenderer;
}
