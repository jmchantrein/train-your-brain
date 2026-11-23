/**
 * Prompt Generator - YAML Editor Renderer
 *
 * Gère le rendu de l'éditeur YAML pour le générateur de prompts :
 * - Mode code (textarea YAML brut)
 * - Mode visuel (formulaires interactifs)
 * - Aperçu du deck avec validation
 * - Rapport de qualité détaillé
 * - Modal d'édition de carte individuelle
 *
 * @module PromptGeneratorYamlRenderer
 * @requires escapeHtml (components.js)
 * @requires DeckValidator
 * @requires PromptGenerator
 */

/**
 * Contexte de l'éditeur YAML
 * @typedef {Object} YamlEditorContext
 * @property {string} editorMode - Mode actuel ('code'|'visual')
 * @property {string} yamlContent - Contenu YAML brut
 * @property {string|null} yamlError - Message d'erreur de parsing
 * @property {Deck|null} parsedDeck - Deck parsé depuis le YAML
 * @property {number|null} editingCardIndex - Index de la carte en édition (-1 pour nouvelle)
 * @property {DeckValidationReport|null} validationReport - Rapport de validation
 * @property {Object[]} iterationHistory - Historique des corrections
 */

const PromptGeneratorYamlRenderer = {
  /**
   * Rend l'éditeur YAML complet
   * @param {YamlEditorContext} context - Contexte avec état de l'éditeur
   * @returns {string} HTML
   */
  renderEditor(context) {
    return `
      <div class="yaml-editor">
        <div class="yaml-editor__header">
          <h2>✏️ ${i18n.t('yamlEditor.title')}</h2>
          <p>${i18n.t('yamlEditor.subtitle')}</p>
        </div>

        <!-- Toggle Mode -->
        <div class="editor-mode-toggle">
          <button class="editor-mode-toggle__btn ${context.editorMode === 'code' ? 'active' : ''}" data-mode="code">
            <span class="editor-mode-toggle__icon">💻</span>
            <span class="editor-mode-toggle__label">${i18n.t('editor.codePanel')}</span>
          </button>
          <button class="editor-mode-toggle__btn ${context.editorMode === 'visual' ? 'active' : ''}" data-mode="visual">
            <span class="editor-mode-toggle__icon">📝</span>
            <span class="editor-mode-toggle__label">${i18n.t('editor.visualPanel')}</span>
          </button>
        </div>

        ${context.editorMode === 'code' ? this.renderCodeMode(context) : this.renderVisualMode(context)}

        <div class="yaml-editor__actions">
          <button class="btn btn--secondary yaml-editor__back">← ${i18n.t('yamlEditor.backToPrompt')}</button>
          ${context.editorMode === 'code' ? `
            <button class="btn btn--primary yaml-editor__validate">✓ ${i18n.t('yamlEditor.validate')}</button>
          ` : ''}
          ${context.parsedDeck ? `
            <button class="btn btn--success yaml-editor__import">📥 ${i18n.t('yamlEditor.import')}</button>
          ` : ''}
        </div>
      </div>
    `;
  },

  /**
   * Rend le mode code (textarea YAML)
   *
   * Affiche le textarea avec toolbar (coller, effacer, formater)
   * et la section aperçu avec erreurs ou preview du deck.
   *
   * @param {YamlEditorContext} context - Contexte de l'éditeur
   * @returns {string} HTML du mode code
   */
  renderCodeMode(context) {
    return `
      <div class="yaml-editor__main">
        <div class="yaml-editor__input-section">
          <div class="yaml-editor__toolbar">
            <button class="btn btn--small yaml-editor__paste" title="${i18n.t('yamlEditor.pasteFromClipboard')}">📋 ${i18n.t('editor.paste')}</button>
            <button class="btn btn--small yaml-editor__clear" title="${i18n.t('yamlEditor.clear')}">🗑️ ${i18n.t('yamlEditor.clear')}</button>
            <button class="btn btn--small yaml-editor__format" title="${i18n.t('editor.format')}">🔧 ${i18n.t('editor.format')}</button>
          </div>
          <textarea
            class="yaml-editor__textarea"
            placeholder="${escapeHtml(i18n.t('yamlEditor.placeholder'))}"
            spellcheck="false"
          >${escapeHtml(context.yamlContent)}</textarea>
        </div>

        <div class="yaml-editor__preview-section">
          <h3>👁️ ${i18n.t('editor.preview')}</h3>
          ${context.yamlError ? `
            <div class="yaml-editor__error">
              <span class="yaml-editor__error-icon">❌</span>
              <span class="yaml-editor__error-text">${escapeHtml(context.yamlError)}</span>
            </div>
          ` : ''}
          ${context.parsedDeck ? this.renderDeckPreview(context) : `
            <div class="yaml-editor__placeholder">
              <p>${i18n.t('yamlEditor.previewHint')}</p>
            </div>
          `}
        </div>
      </div>
    `;
  },

  /**
   * Rend le mode visuel (formulaires interactifs)
   *
   * Affiche les métadonnées du deck et la liste des cartes
   * avec leurs indicateurs de validation.
   * Affiche un message si aucun deck n'est chargé.
   *
   * @param {YamlEditorContext} context - Contexte de l'éditeur
   * @returns {string} HTML du mode visuel
   */
  renderVisualMode(context) {
    if (!context.parsedDeck) {
      return `
        <div class="yaml-editor__visual-empty">
          <div class="yaml-editor__visual-empty-icon">📋</div>
          <h3>${i18n.t('yamlEditor.noDeck')}</h3>
          <p>${i18n.t('yamlEditor.noDeckHint')}</p>
          <button class="btn btn--primary yaml-editor__switch-to-code">💻 ${i18n.t('yamlEditor.switchToCode')}</button>
        </div>
      `;
    }

    const deck = context.parsedDeck;

    return `
      <div class="yaml-editor__visual">
        <!-- Métadonnées du deck -->
        <section class="yaml-editor__visual-section">
          <h3>📚 ${i18n.t('yamlEditor.deckInfo')}</h3>
          <div class="yaml-editor__visual-form">
            <div class="yaml-editor__visual-field">
              <label for="visual-deck-name">${i18n.t('common.deckName')} *</label>
              <input type="text" id="visual-deck-name" class="yaml-editor__visual-input"
                     value="${escapeHtml(deck.name || '')}" placeholder="${i18n.t('common.deckName')}">
            </div>
            <div class="yaml-editor__visual-field">
              <label for="visual-deck-desc">${i18n.t('merger.newDeckDescription')}</label>
              <textarea id="visual-deck-desc" class="yaml-editor__visual-textarea"
                        placeholder="${i18n.t('yamlEditor.descriptionPlaceholder')}">${escapeHtml(deck.description || '')}</textarea>
            </div>
            <div class="yaml-editor__visual-field">
              <label>${i18n.t('editor.tags')}</label>
              <div id="visual-deck-tags-selector"></div>
            </div>
            <div class="yaml-editor__visual-field-row">
              <div class="yaml-editor__visual-field">
                <label for="visual-deck-difficulty">${i18n.t('yamlEditor.difficulty')} (${i18n.t('common.optional')})</label>
                <select id="visual-deck-difficulty" class="yaml-editor__visual-select">
                  <option value="" ${!deck.difficulty ? 'selected' : ''}>${i18n.t('yamlEditor.unspecified')}</option>
                  <option value="1" ${deck.difficulty === 1 ? 'selected' : ''}>1 - ${i18n.t('yamlEditor.diff1')}</option>
                  <option value="2" ${deck.difficulty === 2 ? 'selected' : ''}>2 - ${i18n.t('yamlEditor.diff2')}</option>
                  <option value="3" ${deck.difficulty === 3 ? 'selected' : ''}>3 - ${i18n.t('yamlEditor.diff3')}</option>
                  <option value="4" ${deck.difficulty === 4 ? 'selected' : ''}>4 - ${i18n.t('yamlEditor.diff4')}</option>
                </select>
              </div>
              <div class="yaml-editor__visual-field">
                <label class="yaml-editor__checkbox-inline">
                  <input type="checkbox" id="visual-deck-similarity" ${deck.settings?.similarityMatching ? 'checked' : ''}>
                  <span>${i18n.t('editor.similarity')}</span>
                </label>
              </div>
            </div>
          </div>
        </section>

        <!-- Liste des cartes -->
        <section class="yaml-editor__visual-section">
          <div class="yaml-editor__visual-section-header">
            <h3>🃏 ${i18n.t('summary.cards')} (${deck.cards?.length || 0})</h3>
            <button class="btn btn--primary btn--small yaml-editor__add-card">+ ${i18n.t('common.add')}</button>
          </div>

          <div class="yaml-editor__visual-cards">
            ${!deck.cards || deck.cards.length === 0 ? `
              <div class="yaml-editor__visual-empty-cards">
                <p>${i18n.t('yamlEditor.noCards')}</p>
              </div>
            ` : deck.cards.map((card, index) => this.renderVisualCardItem(card, index, context)).join('')}
          </div>
        </section>

        <!-- Modal d'édition de carte -->
        ${context.editingCardIndex !== null ? this.renderCardEditModal(context) : ''}
      </div>
    `;
  },

  /**
   * Rend un item de carte dans la liste visuelle
   *
   * Affiche la carte avec son numéro, type, aperçu de question/réponse,
   * indicateurs de validation (erreurs, warnings, score),
   * et boutons d'action (éditer, déplacer, supprimer).
   *
   * @param {Card} card - Carte à rendre
   * @param {number} index - Index de la carte dans le deck
   * @param {YamlEditorContext} context - Contexte pour accéder au rapport de validation
   * @returns {string} HTML de l'item de carte
   */
  renderVisualCardItem(card, index, context) {
    const typeIcons = {
      text: '📝',
      numeric: '🔢',
      mcq: '☑️',
      truefalse: '✓✗',
      matching: '🔗',
      cloze: '📋'
    };
    const icon = typeIcons[card.type] || '📝';

    const cardValidation = context.validationReport?.cardResults?.[index];
    const hasIssues = cardValidation?.issues?.length > 0;
    const hasWarnings = cardValidation?.warnings?.length > 0;
    const score = cardValidation?.score ?? null;
    const hallucinationRisk = cardValidation?.hallucinationRisk ?? 0;

    let statusClass = '';
    let statusBadge = '';
    if (cardValidation) {
      if (hasIssues) {
        statusClass = 'yaml-editor__visual-card--error';
        statusBadge = `<span class="yaml-editor__card-badge yaml-editor__card-badge--error" title="${i18n.t('yamlEditor.errorsToFix')}" aria-label="${i18n.t('yamlEditor.errorsToFix')}">❌</span>`;
      } else if (hasWarnings || hallucinationRisk >= 0.3) {
        statusClass = 'yaml-editor__visual-card--warning';
        statusBadge = `<span class="yaml-editor__card-badge yaml-editor__card-badge--warning" title="${i18n.t('yamlEditor.warnings')}" aria-label="${i18n.t('yamlEditor.warnings')}">⚠️</span>`;
      } else if (score >= 80) {
        statusClass = 'yaml-editor__visual-card--success';
        statusBadge = `<span class="yaml-editor__card-badge yaml-editor__card-badge--success" title="${i18n.t('yamlEditor.excellent')}" aria-label="${i18n.t('yamlEditor.excellent')}">✅</span>`;
      }
    }

    let validationTooltip = '';
    if (cardValidation) {
      const tips = [];
      if (hasIssues) {
        tips.push(...cardValidation.issues.map(i => `❌ ${typeof i === 'string' ? i : i.message || ''}`));
      }
      if (hasWarnings) {
        tips.push(...cardValidation.warnings.map(w => `⚠️ ${typeof w === 'string' ? w : w.message || ''}`));
      }
      if (tips.length > 0) {
        validationTooltip = `title="${escapeHtml(tips.join('\n'))}"`;
      }
    }

    const totalCards = context.parsedDeck?.cards?.length || 1;

    return `
      <div class="yaml-editor__visual-card ${statusClass}" data-index="${index}" ${validationTooltip}>
        <div class="yaml-editor__visual-card-header">
          <span class="yaml-editor__visual-card-num">${index + 1}</span>
          <span class="yaml-editor__visual-card-type">${icon}</span>
          ${statusBadge}
          ${score !== null ? `<span class="yaml-editor__card-score" title="${i18n.t('yamlEditor.qualityScore')}">${score}%</span>` : ''}
        </div>
        <div class="yaml-editor__visual-card-content">
          <div class="yaml-editor__visual-card-q">${escapeHtml(String(card.question || '').substring(0, 100))}${String(card.question || '').length > 100 ? '...' : ''}</div>
          <div class="yaml-editor__visual-card-a">${escapeHtml(String(card.answer || '').substring(0, 60))}${String(card.answer || '').length > 60 ? '...' : ''}</div>
        </div>
        <div class="yaml-editor__visual-card-actions">
          <button class="btn btn--small yaml-editor__edit-card" data-index="${index}" title="${i18n.t('common.edit')}" aria-label="${i18n.t('common.edit')}">✏️</button>
          <button class="btn btn--small yaml-editor__move-card-up" data-index="${index}" title="${i18n.t('yamlEditor.moveUp')}" aria-label="${i18n.t('yamlEditor.moveUp')}" ${index === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn btn--small yaml-editor__move-card-down" data-index="${index}" title="${i18n.t('yamlEditor.moveDown')}" aria-label="${i18n.t('yamlEditor.moveDown')}" ${index === totalCards - 1 ? 'disabled' : ''}>↓</button>
          <button class="btn btn--small btn--danger yaml-editor__delete-card" data-index="${index}" title="${i18n.t('common.delete')}" aria-label="${i18n.t('common.delete')}">🗑️</button>
        </div>
      </div>
    `;
  },

  /**
   * Rend la modal d'édition de carte
   *
   * Affiche tous les champs éditables : type, question, réponse,
   * alternatives, indice, feedback. Inclut les suggestions
   * d'amélioration générées par le validateur.
   *
   * @param {YamlEditorContext} context - Contexte avec editingCardIndex et parsedDeck
   * @returns {string} HTML de la modal
   */
  renderCardEditModal(context) {
    const isNew = context.editingCardIndex === -1;
    const card = isNew ? { question: '', answer: '', type: 'text' } : context.parsedDeck.cards[context.editingCardIndex];
    const cardType = card.type || 'text';
    const isTextType = !cardType || cardType === 'text';

    let suggestions = [];
    let validation = null;
    if (!isNew) {
      if (typeof DeckValidator !== 'undefined') {
        suggestions = DeckValidator.getSuggestions(card);
        validation = DeckValidator.calculateCardScore(card);
      } else if (typeof PromptGenerator !== 'undefined' && PromptGenerator.getSuggestions) {
        suggestions = PromptGenerator.getSuggestions(card);
        validation = PromptGenerator.validateCard(card);
      }
    }

    return `
      <div class="yaml-editor__modal-overlay">
        <div class="yaml-editor__modal yaml-editor__modal--large">
          <div class="yaml-editor__modal-header">
            <h3>${isNew ? i18n.t('cardEditor.newCard') : i18n.t('cardEditor.editCard', { n: context.editingCardIndex + 1 })}</h3>
            ${validation ? `<span class="yaml-editor__modal-score ${validation.score >= 80 ? 'yaml-editor__modal-score--success' : validation.score >= 60 ? 'yaml-editor__modal-score--warning' : 'yaml-editor__modal-score--error'}">${validation.score}%</span>` : ''}
            <button class="btn btn--icon yaml-editor__modal-close" aria-label="${i18n.t('common.close')}">×</button>
          </div>

          ${suggestions.length > 0 ? `
            <div class="yaml-editor__modal-suggestions">
              <strong>💡 ${i18n.t('yamlEditor.suggestions')}</strong>
              <ul>
                ${suggestions.map(s => `<li>${escapeHtml(typeof s === 'string' ? s : s.message)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <div class="yaml-editor__modal-body">
            <div class="yaml-editor__visual-field">
              <label for="modal-card-type">${i18n.t('cardEditor.cardType')}</label>
              <select id="modal-card-type" class="yaml-editor__visual-select">
                <option value="" ${!card.type ? 'selected' : ''}>📝 ${i18n.t('yamlEditor.textDefault')}</option>
                <option value="numeric" ${card.type === 'numeric' ? 'selected' : ''}>🔢 ${i18n.t('cardType.numeric')}</option>
                <option value="mcq" ${card.type === 'mcq' ? 'selected' : ''}>☑️ ${i18n.t('cardType.mcq')}</option>
                <option value="truefalse" ${card.type === 'truefalse' ? 'selected' : ''}>✓✗ ${i18n.t('cardType.truefalse')}</option>
                <option value="cloze" ${card.type === 'cloze' ? 'selected' : ''}>📋 ${i18n.t('cardType.cloze')}</option>
                <option value="matching" ${card.type === 'matching' ? 'selected' : ''}>🔗 ${i18n.t('cardType.matching')}</option>
              </select>
              <span class="prompt-gen__help">💡 ${i18n.t('yamlEditor.textDefaultHelp')}</span>
            </div>

            <div class="yaml-editor__visual-field">
              <label for="modal-card-question">${i18n.t('game.question')} *</label>
              <textarea id="modal-card-question" class="yaml-editor__visual-textarea" rows="3"
                        placeholder="${i18n.t('cardEditor.questionPlaceholder')}">${escapeHtml(card.question || '')}</textarea>
            </div>

            <div class="yaml-editor__visual-field">
              <label for="modal-card-answer">${i18n.t('deckReview.answer')} * <span class="yaml-editor__field-hint">${i18n.t('yamlEditor.answerHint')}</span></label>
              <input type="text" id="modal-card-answer" class="yaml-editor__visual-input"
                     value="${escapeHtml(String(card.answer || ''))}" placeholder="${i18n.t('yamlEditor.expectedAnswer')}">
            </div>

            ${isTextType ? `
              <div class="yaml-editor__visual-field">
                <label for="modal-card-alternatives">
                  ${i18n.t('yamlEditor.alternatives')} <span class="yaml-editor__field-hint">${i18n.t('yamlEditor.alternativesHint')}</span>
                </label>
                <textarea id="modal-card-alternatives" class="yaml-editor__visual-textarea" rows="3"
                          placeholder="${i18n.t('yamlEditor.alternativesPlaceholder')}">${escapeHtml((card.alternatives || []).join('\n'))}</textarea>
                <span class="prompt-gen__help">💡 ${i18n.t('yamlEditor.alternativesHelp')}</span>
              </div>
            ` : ''}

            <div class="yaml-editor__visual-field">
              <label for="modal-card-hint">${i18n.t('cardEditor.hintLabel')} (${i18n.t('common.optional')})</label>
              <input type="text" id="modal-card-hint" class="yaml-editor__visual-input"
                     value="${escapeHtml(card.hint || '')}" placeholder="${i18n.t('yamlEditor.hintPlaceholder')}">
            </div>

            <div class="yaml-editor__visual-field">
              <label for="modal-card-feedback">${i18n.t('cardEditor.feedback')} (${i18n.t('common.optional')})</label>
              <textarea id="modal-card-feedback" class="yaml-editor__visual-textarea" rows="3"
                        placeholder="${i18n.t('yamlEditor.feedbackPlaceholder')}">${escapeHtml(card.feedback || '')}</textarea>
              <span class="prompt-gen__help">💡 ${i18n.t('yamlEditor.feedbackHelp')}</span>
            </div>
          </div>

          <div class="yaml-editor__modal-footer">
            <button class="btn btn--secondary yaml-editor__modal-cancel">${i18n.t('common.cancel')}</button>
            <button class="btn btn--primary yaml-editor__modal-save">💾 ${i18n.t('cardEditor.saveCard')}</button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Rend l'aperçu du deck avec métadonnées et cartes
   *
   * Affiche le nom, description, tags, difficulté,
   * le rapport de validation si disponible,
   * et un aperçu des 5 premières cartes.
   *
   * @param {YamlEditorContext} context - Contexte avec parsedDeck et validationReport
   * @returns {string} HTML de l'aperçu
   */
  renderDeckPreview(context) {
    const deck = context.parsedDeck;
    const cardCount = deck.cards?.length || 0;
    const previewCards = (deck.cards || []).slice(0, 5);
    const report = context.validationReport;

    return `
      <div class="yaml-editor__deck-preview">
        <div class="yaml-editor__deck-info">
          <h4>${escapeHtml(deck.name || i18n.t('yamlEditor.unnamed'))}</h4>
          <p class="yaml-editor__deck-desc">${escapeHtml(deck.description || i18n.t('yamlEditor.noDescription'))}</p>
          <div class="yaml-editor__deck-meta">
            <span class="yaml-editor__deck-tag">📚 ${i18n.tn('common.cardsCount', cardCount)}</span>
            ${deck.category ? `<span class="yaml-editor__deck-tag">🏷️ ${escapeHtml(Array.isArray(deck.category) ? deck.category.join(', ') : deck.category)}</span>` : ''}
            ${deck.difficulty ? `<span class="yaml-editor__deck-tag">⭐ ${i18n.t('yamlEditor.difficultyLevel', { level: escapeHtml(deck.difficulty) })}</span>` : ''}
          </div>
        </div>

        ${report ? this.renderValidationReport(report, context.iterationHistory) : ''}

        <div class="yaml-editor__cards-preview">
          <h5>${i18n.t('yamlEditor.cardsPreview', { shown: Math.min(5, cardCount), total: cardCount })}</h5>
          <div class="yaml-editor__cards-list">
            ${previewCards.map((card, i) => {
              const cardResult = report?.cardResults?.[i];
              const statusIcon = cardResult?.issues?.length > 0 ? '❌' :
                                 cardResult?.warnings?.length > 0 ? '⚠️' :
                                 cardResult?.score >= 80 ? '✅' : '';
              return `
              <div class="yaml-editor__card-item ${cardResult?.issues?.length > 0 ? 'yaml-editor__card-item--error' : cardResult?.warnings?.length > 0 ? 'yaml-editor__card-item--warning' : ''}">
                <span class="yaml-editor__card-num">${i + 1} ${statusIcon}</span>
                <div class="yaml-editor__card-content">
                  <div class="yaml-editor__card-q">${i18n.t('yamlEditor.qShort')} ${escapeHtml(String(card.question || ''))}</div>
                  <div class="yaml-editor__card-a">${i18n.t('yamlEditor.aShort')} ${escapeHtml(String(card.answer || ''))}</div>
                </div>
              </div>
              `;
            }).join('')}
            ${cardCount > 5 ? `<p class="yaml-editor__more">${i18n.t('yamlEditor.moreCards', { count: cardCount - 5 })}</p>` : ''}
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Rend l'historique des itérations de correction
   *
   * Affiche une timeline des scores successifs avec
   * les deltas d'amélioration/régression entre chaque itération.
   *
   * @param {Object[]} iterationHistory - Historique des itérations
   * @param {number} iterationHistory[].number - Numéro de l'itération
   * @param {number} iterationHistory[].score - Score de cette itération
   * @param {boolean} iterationHistory[].isValid - Si le deck était valide
   * @returns {string} HTML de l'historique (vide si < 2 itérations)
   */
  renderIterationHistory(iterationHistory) {
    if (!iterationHistory || iterationHistory.length <= 1) {
      return '';
    }

    const first = iterationHistory[0];
    const last = iterationHistory[iterationHistory.length - 1];
    const improvement = last.score - first.score;
    const improvementClass = improvement > 0 ? 'success' : improvement < 0 ? 'error' : '';

    return `
      <div class="yaml-editor__iteration-history">
        <h6>📈 ${i18n.t('yamlEditor.history', { count: iterationHistory.length })}</h6>
        <div class="yaml-editor__iteration-timeline">
          ${iterationHistory.map((iter, i) => {
            const prev = i > 0 ? iterationHistory[i - 1] : null;
            const delta = prev ? iter.score - prev.score : 0;
            const deltaText = delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : '';
            const deltaClass = delta > 0 ? 'success' : delta < 0 ? 'error' : '';

            return `
              <div class="yaml-editor__iteration-item ${iter.isValid ? '' : 'yaml-editor__iteration-item--invalid'}">
                <span class="yaml-editor__iteration-num">#${iter.number}</span>
                <span class="yaml-editor__iteration-score">${iter.score}%</span>
                ${deltaText ? `<span class="yaml-editor__iteration-delta yaml-editor__iteration-delta--${deltaClass}">${deltaText}</span>` : ''}
              </div>
            `;
          }).join('<span class="yaml-editor__iteration-arrow">→</span>')}
        </div>
        ${improvement !== 0 ? `
          <div class="yaml-editor__iteration-summary yaml-editor__iteration-summary--${improvementClass}">
            ${improvement > 0 ? '🎉' : '📉'} ${i18n.t(improvement > 0 ? 'yamlEditor.improvement' : 'yamlEditor.regression', { points: Math.abs(improvement) })}
            (${first.score}% → ${last.score}%)
          </div>
        ` : ''}
      </div>
    `;
  },

  /**
   * Rend le rapport de validation complet
   *
   * Affiche le score moyen, les statistiques (cartes valides,
   * warnings, erreurs, à vérifier), les problèmes du deck,
   * les doublons, la distribution cognitive Bloom,
   * et la lisibilité.
   *
   * @param {DeckValidationReport} report - Rapport de validation
   * @param {Object[]} iterationHistory - Historique pour afficher la progression
   * @returns {string} HTML du rapport
   */
  renderValidationReport(report, iterationHistory) {
    const { stats, averageScore, deckIssues, duplicates, bloomDistribution, readability, grade } = report;

    const scoreColor = averageScore >= 80 ? 'success' : averageScore >= 60 ? 'warning' : 'error';
    const scoreEmoji = averageScore >= 80 ? '🎉' : averageScore >= 60 ? '👍' : '⚠️';

    const formatIssue = (issue) => {
      if (typeof issue === 'string') return issue;
      return issue.message || JSON.stringify(issue);
    };

    const hasProblems = (deckIssues?.length > 0) ||
                        (duplicates?.length > 0) ||
                        (stats?.cardsWithErrors > 0) ||
                        (stats?.cardsWithWarnings > 0);

    return `
      <div class="yaml-editor__validation-report">
        <h5>📊 ${i18n.t('yamlEditor.report')}</h5>

        <div class="yaml-editor__validation-header">
          <div class="yaml-editor__validation-score yaml-editor__validation-score--${scoreColor}">
            <span class="yaml-editor__validation-score-value">${averageScore}%</span>
            <span class="yaml-editor__validation-score-label">${scoreEmoji} ${i18n.t('yamlEditor.averageScore', { grade: grade || '?' })}</span>
          </div>

          ${hasProblems ? `
            <button class="btn btn--small btn--secondary yaml-editor__generate-correction" title="${i18n.t('yamlEditor.correctionHint')}">
              🔧 ${i18n.t('yamlEditor.correctionPrompt')}
            </button>
          ` : ''}
        </div>

        ${this.renderIterationHistory(iterationHistory)}

        <div class="yaml-editor__validation-stats">
          <div class="yaml-editor__validation-stat">
            <span class="yaml-editor__validation-stat-value">${stats.validCards}/${stats.totalCards}</span>
            <span class="yaml-editor__validation-stat-label">✅ ${i18n.t('yamlEditor.validCards')}</span>
          </div>
          <div class="yaml-editor__validation-stat ${stats.cardsWithWarnings > 0 ? 'yaml-editor__validation-stat--warning' : ''}">
            <span class="yaml-editor__validation-stat-value">${stats.cardsWithWarnings}</span>
            <span class="yaml-editor__validation-stat-label">⚠️ ${i18n.t('yamlEditor.warnings')}</span>
          </div>
          <div class="yaml-editor__validation-stat ${stats.cardsWithErrors > 0 ? 'yaml-editor__validation-stat--error' : ''}">
            <span class="yaml-editor__validation-stat-value">${stats.cardsWithErrors}</span>
            <span class="yaml-editor__validation-stat-label">❌ ${i18n.t('yamlEditor.errors')}</span>
          </div>
          <div class="yaml-editor__validation-stat ${stats.highRiskCards > 0 ? 'yaml-editor__validation-stat--warning' : ''}">
            <span class="yaml-editor__validation-stat-value">${stats.highRiskCards}</span>
            <span class="yaml-editor__validation-stat-label">🔍 ${i18n.t('yamlEditor.toCheck')}</span>
          </div>
        </div>

        ${deckIssues && deckIssues.length > 0 ? `
          <div class="yaml-editor__validation-issues">
            <strong>${i18n.t('yamlEditor.deckProblems')}</strong>
            <ul>
              ${deckIssues.map(issue => `<li>❌ ${escapeHtml(formatIssue(issue))}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${duplicates && duplicates.length > 0 ? `
          <div class="yaml-editor__validation-duplicates">
            <strong>🔄 ${i18n.t('yamlEditor.duplicates')}</strong>
            <ul>
              ${duplicates.map(dup => `
                <li class="${dup.severity === 'error' ? 'yaml-editor__duplicate--error' : 'yaml-editor__duplicate--warning'}">
                  "${escapeHtml(dup.card1)}" ↔ "${escapeHtml(dup.card2)}" (${i18n.t('yamlEditor.similar', { percent: dup.similarity })})
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}

        ${bloomDistribution ? `
          <div class="yaml-editor__validation-bloom">
            <strong>🧠 ${i18n.t('yamlEditor.bloom')}</strong>
            <div class="yaml-editor__bloom-bars">
              ${Object.entries(bloomDistribution.percentages || {}).map(([level, pct]) => `
                <div class="yaml-editor__bloom-bar" title="${level}: ${pct}%">
                  <span class="yaml-editor__bloom-label">${level.charAt(0).toUpperCase()}</span>
                  <div class="yaml-editor__bloom-fill" style="width: ${pct}%"></div>
                  <span class="yaml-editor__bloom-pct">${pct}%</span>
                </div>
              `).join('')}
            </div>
            <span class="yaml-editor__bloom-assessment">${escapeHtml(bloomDistribution.assessment || '')}</span>
          </div>
        ` : ''}

        ${readability ? `
          <div class="yaml-editor__validation-readability">
            <strong>📖 ${i18n.t('yamlEditor.readability')}</strong>
            <span class="yaml-editor__readability-grade">
              ${i18n.t('yamlEditor.grade', { grade: readability.fleschKincaidGrade || '?' })} - ${escapeHtml(readability.interpretation || '')}
            </span>
          </div>
        ` : ''}
      </div>
    `;
  }
};

// Export pour Node.js (tests) et navigateur
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PromptGeneratorYamlRenderer;
}
