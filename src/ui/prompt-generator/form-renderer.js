/**
 * Prompt Generator - Form Renderer
 *
 * Gère le rendu du formulaire multi-étapes pour la génération de prompts :
 * - Rendu des sections par étape (sujet, audience, cartes, format...)
 * - Rendu des différents types de champs (text, number, select, multiselect...)
 * - Validation des étapes avant passage à la suivante
 * - Sauvegarde des données du formulaire
 *
 * @module PromptGeneratorFormRenderer
 * @requires escapeHtml (components.js)
 * @requires PromptGenerator
 */

const PromptGeneratorFormRenderer = {
  /**
   * Rend le formulaire multi-étapes
   * @param {Object} formData - Données du formulaire
   * @param {number} currentStep - Étape courante
   * @param {number} totalSteps - Nombre total d'étapes
   * @returns {string} HTML
   */
  renderForm(formData, currentStep, totalSteps) {
    const sections = PromptGenerator.FORM_SECTIONS;
    const fields = PromptGenerator.FORM_FIELDS;

    const sectionOrder = Object.entries(sections)
      .sort((a, b) => a[1].order - b[1].order);

    return `
      <div class="prompt-gen__form">
        <div class="prompt-gen__progress">
          <div class="prompt-gen__progress-bar">
            <div class="prompt-gen__progress-fill" style="width: ${(currentStep / totalSteps) * 100}%"></div>
          </div>
          <span class="prompt-gen__progress-text">${i18n.t('promptGen.step', { current: currentStep, total: totalSteps })}</span>
        </div>

        ${this._renderCurrentStep(sectionOrder, fields, formData, currentStep)}

        <div class="prompt-gen__actions">
          ${currentStep > 1 ? `
            <button class="btn btn--secondary prompt-gen__prev">${i18n.t('tutorial.prev')}</button>
          ` : ''}
          ${currentStep < totalSteps ? `
            <button class="btn btn--primary prompt-gen__next">${i18n.t('tutorial.next')}</button>
          ` : `
            <button class="btn btn--primary prompt-gen__generate">🚀 ${i18n.t('promptGen.generate')}</button>
          `}
        </div>
      </div>
    `;
  },

  /**
   * Rend l'étape courante du formulaire
   *
   * Filtre les sections selon l'étape et rend les champs correspondants.
   *
   * @private
   * @param {Array<Array<(string|Object)>>} sectionOrder - Paires [clé, section] triées par ordre
   * @param {Object} fields - Définition de tous les champs
   * @param {Object} formData - Données actuelles du formulaire
   * @param {number} currentStep - Numéro de l'étape courante (1-3)
   * @returns {string} HTML des sections de l'étape
   */
  _renderCurrentStep(sectionOrder, fields, formData, currentStep) {
    const stepSections = {
      1: ['subject', 'audience'],
      2: ['cards', 'pedagogy'],
      3: ['format', 'special']
    };

    const currentSections = stepSections[currentStep] || [];

    return sectionOrder
      .filter(([key]) => currentSections.includes(key))
      .map(([sectionKey, section]) => {
        const sectionFields = Object.entries(fields)
          .filter(([, field]) => field.section === sectionKey);

        return `
          <section class="prompt-gen__section">
            <h2 class="prompt-gen__section-title">${section.icon} ${section.title}</h2>
            <div class="prompt-gen__fields">
              ${sectionFields.map(([fieldKey, field]) => this._renderField(fieldKey, field, formData)).join('')}
            </div>
          </section>
        `;
      }).join('');
  },

  /**
   * Rend un champ de formulaire selon son type
   *
   * Supporte : text, number, textarea, select, multiselect, checkbox, tags.
   *
   * @private
   * @param {string} key - Clé du champ dans formData
   * @param {Object} field - Définition du champ (type, label, options, required...)
   * @param {Object} formData - Données pour pré-remplir le champ
   * @returns {string} HTML du champ
   */
  _renderField(key, field, formData) {
    const value = formData[key];

    switch (field.type) {
      case 'text':
        return `
          <div class="prompt-gen__field">
            <label class="prompt-gen__label" for="${field.id}">
              ${field.label}${field.required ? ' *' : ''}
            </label>
            <input type="text" id="${field.id}" class="prompt-gen__input"
              placeholder="${field.placeholder || ''}"
              value="${escapeHtml(value || '')}"
              ${field.required ? 'required' : ''}>
            ${field.help ? `<span class="prompt-gen__help">${field.help}</span>` : ''}
          </div>
        `;

      case 'number':
        return `
          <div class="prompt-gen__field">
            <label class="prompt-gen__label" for="${field.id}">
              ${field.label}${field.required ? ' *' : ''}
            </label>
            <input type="number" id="${field.id}" class="prompt-gen__input prompt-gen__input--number"
              min="${field.min || ''}" max="${field.max || ''}"
              value="${escapeHtml(value || field.value || '')}"
              ${field.required ? 'required' : ''}>
            ${field.help ? `<span class="prompt-gen__help">${field.help}</span>` : ''}
          </div>
        `;

      case 'textarea':
        return `
          <div class="prompt-gen__field">
            <label class="prompt-gen__label" for="${field.id}">
              ${field.label}${field.required ? ' *' : ''}
            </label>
            <textarea id="${field.id}" class="prompt-gen__textarea"
              placeholder="${field.placeholder || ''}"
              rows="4"
              ${field.required ? 'required' : ''}>${escapeHtml(value || '')}</textarea>
            ${field.help ? `<span class="prompt-gen__help">${field.help}</span>` : ''}
          </div>
        `;

      case 'select':
        return `
          <div class="prompt-gen__field">
            <label class="prompt-gen__label" for="${field.id}">
              ${field.label}${field.required ? ' *' : ''}
            </label>
            <select id="${field.id}" class="prompt-gen__select" ${field.required ? 'required' : ''}>
              ${field.options.map(opt => `
                <option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>
                  ${opt.label}
                </option>
              `).join('')}
            </select>
            ${field.help ? `<span class="prompt-gen__help">${field.help}</span>` : ''}
          </div>
        `;

      case 'multiselect':
        return `
          <div class="prompt-gen__field">
            <label class="prompt-gen__label">
              ${field.label}${field.required ? ' *' : ''}
            </label>
            <div class="prompt-gen__multiselect">
              ${field.options.map(opt => `
                <label class="prompt-gen__checkbox-card ${(value || []).includes(opt.value) ? 'prompt-gen__checkbox-card--selected' : ''}">
                  <input type="checkbox" value="${opt.value}"
                    ${(value || []).includes(opt.value) ? 'checked' : ''}
                    data-multiselect="${field.id}">
                  <span class="prompt-gen__checkbox-label">${opt.label}</span>
                  ${opt.description ? `<span class="prompt-gen__checkbox-desc">${opt.description}</span>` : ''}
                </label>
              `).join('')}
            </div>
            ${field.help ? `<span class="prompt-gen__help">${field.help}</span>` : ''}
          </div>
        `;

      case 'checkbox':
        return `
          <div class="prompt-gen__field prompt-gen__field--inline">
            <label class="prompt-gen__checkbox-inline">
              <input type="checkbox" id="${field.id}" ${value ? 'checked' : ''}>
              <span class="prompt-gen__checkbox-text">${field.label}</span>
            </label>
            ${field.help ? `<span class="prompt-gen__help">${field.help}</span>` : ''}
          </div>
        `;

      case 'tags':
        return `
          <div class="prompt-gen__field">
            <label class="prompt-gen__label">
              ${field.label}${field.required ? ' *' : ''}
            </label>
            <div class="prompt-gen__tag-selector" id="${field.id}-container" data-field="${field.id}"></div>
            ${field.help ? `<span class="prompt-gen__help">${field.help}</span>` : ''}
          </div>
        `;

      default:
        return '';
    }
  },

  /**
   * Rend le résultat avec le prompt généré
   * @param {string} generatedPrompt - Prompt généré
   * @returns {string} HTML
   */
  renderResult(generatedPrompt) {
    return `
      <div class="prompt-gen__result">
        <div class="prompt-gen__result-header">
          <h2>✅ ${i18n.t('promptGen.generated')}</h2>
          <p>${i18n.t('promptGen.generatedDesc')}</p>
        </div>

        <div class="prompt-gen__result-actions">
          <button class="btn btn--primary prompt-gen__copy">📋 ${i18n.t('promptGen.copy')}</button>
          <button class="btn btn--secondary prompt-gen__reset">🔄 ${i18n.t('promptGen.newPrompt')}</button>
        </div>

        <div class="prompt-gen__result-preview">
          <textarea class="prompt-gen__code prompt-gen__code--editable" id="prompt-output" spellcheck="false">${escapeHtml(generatedPrompt)}</textarea>
        </div>

        <div class="prompt-gen__next-step">
          <h3>📝 ${i18n.t('promptGen.nextStep')}</h3>
          <p>${i18n.t('promptGen.nextStepDesc')}</p>
          <button class="btn btn--primary prompt-gen__open-editor">✏️ ${i18n.t('promptGen.openEditor')}</button>
        </div>

        <div class="prompt-gen__tips">
          <h3>💡 ${i18n.t('promptGen.tipsTitle')}</h3>
          <ul>
            <li>${i18n.t('promptGen.tipModel')}</li>
            <li>${i18n.t('promptGen.tipCheck')}</li>
            <li>${i18n.t('promptGen.tipMedia')}</li>
            <li>${i18n.t('promptGen.tipImages')}</li>
            <li>${i18n.t('promptGen.tipQuestions')}</li>
            <li>${i18n.t('promptGen.tipShort')}</li>
            <li>${i18n.t('promptGen.tipAlternatives')}</li>
            <li>${i18n.t('promptGen.tipFeedback')}</li>
          </ul>
        </div>
      </div>
    `;
  },

  /**
   * Sauvegarde les données de l'étape courante
   * @param {HTMLElement} container - Container DOM
   * @param {Object} formData - Données du formulaire à mettre à jour
   */
  saveCurrentStepData(container, formData) {
    const fields = PromptGenerator.FORM_FIELDS;

    Object.entries(fields).forEach(([key, field]) => {
      const element = container.querySelector(`#${field.id}`);
      if (!element) return;

      switch (field.type) {
        case 'text':
        case 'textarea':
          formData[key] = element.value;
          break;
        case 'number':
          formData[key] = parseInt(element.value, 10) || field.value;
          break;
        case 'select':
          formData[key] = element.value;
          break;
        case 'checkbox':
          formData[key] = element.checked;
          break;
        // multiselect est géré en temps réel
      }
    });
  },

  /**
   * Valide l'étape courante
   * @param {HTMLElement} container - Container DOM
   * @param {Object} formData - Données du formulaire
   * @param {number} currentStep - Étape courante
   * @returns {boolean} true si valide
   */
  validateCurrentStep(container, formData, currentStep) {
    const stepSections = {
      1: ['subject', 'audience'],
      2: ['cards', 'pedagogy'],
      3: ['format', 'special']
    };
    const currentSections = stepSections[currentStep] || [];
    const fields = PromptGenerator.FORM_FIELDS;
    const errors = [];

    Object.entries(fields).forEach(([key, field]) => {
      if (!currentSections.includes(field.section)) return;
      if (!field.required) return;

      const element = container.querySelector(`#${field.id}`);
      let value;

      if (field.type === 'multiselect') {
        value = formData[key];
        if (!value || value.length === 0) {
          errors.push(i18n.t('promptGen.fieldRequired', { label: field.label }));
        }
      } else if (element) {
        value = element.value?.trim();
        if (!value) {
          errors.push(i18n.t('promptGen.fieldRequired', { label: field.label }));
        }
      }
    });

    if (errors.length > 0) {
      alert(i18n.t('promptGen.requiredFields') + '\n' + errors.join('\n'));
      return false;
    }

    return true;
  }
};

// Export pour Node.js (tests) et navigateur
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PromptGeneratorFormRenderer;
}
