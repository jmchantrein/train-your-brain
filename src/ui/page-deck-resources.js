/**
 * Page Deck Resources - Ressources pédagogiques d'un deck
 *
 * Affiche les ressources complémentaires associées à un deck :
 * - Images de référence (vue d'ensemble)
 * - Résumés explicatifs
 * - Liens Wikipedia
 * - Astuces et mnémotechniques
 * - Glossaires
 * - Objectifs d'apprentissage
 *
 * Dépendances: Pages (pages-base.js), Components, Router, PageUtils
 */

// ═══════════════════════════════════════════════════════════════
// DECK RESOURCES - Ressources pédagogiques
// ═══════════════════════════════════════════════════════════════

Pages.deckResources = {
  /**
   * Configuration des types de ressources
   */
  RESOURCE_CONFIG: {
    image: { get label() { return i18n.t('resources.type.image'); }, defaultIcon: '📊', order: 1 },
    summary: { get label() { return i18n.t('resources.type.summary'); }, defaultIcon: '📝', order: 2 },
    objective: { get label() { return i18n.t('resources.type.objective'); }, defaultIcon: '🎯', order: 3 },
    tip: { get label() { return i18n.t('resources.type.tip'); }, defaultIcon: '💡', order: 4 },
    glossary: { get label() { return i18n.t('resources.type.glossary'); }, defaultIcon: '📚', order: 5 },
    interactive: { get label() { return i18n.t('resources.type.interactive'); }, defaultIcon: '🎮', order: 6 },
    link: { get label() { return i18n.t('resources.type.link'); }, defaultIcon: '🔗', order: 7 },
    video: { get label() { return i18n.t('resources.type.video'); }, defaultIcon: '🎬', order: 8 }
  },

  /**
   * Types de composants interactifs disponibles
   */
  INTERACTIVE_COMPONENTS: {
    'wave-visualizer': {
      render: (resource, id) => {
        if (typeof WaveVisualizer !== 'undefined') {
          return WaveVisualizer.render(id, resource.options || {});
        }
        return '<div class="resources__interactive-error">Composant non disponible</div>';
      },
      mount: (container, resource) => {
        if (typeof WaveVisualizer !== 'undefined') {
          return WaveVisualizer.mount(container, resource.options || {});
        }
        return null;
      }
    },
    'beats-visualizer': {
      render: (resource, id) => {
        if (typeof WaveVisualizer !== 'undefined') {
          const options = { ...resource.options, dualMode: true, showBeats: true };
          return WaveVisualizer.render(id, options);
        }
        return '<div class="resources__interactive-error">Composant non disponible</div>';
      },
      mount: (container, resource) => {
        if (typeof WaveVisualizer !== 'undefined') {
          const options = { ...resource.options, dualMode: true, showBeats: true };
          return WaveVisualizer.mount(container, options);
        }
        return null;
      }
    },
    'staff-visualizer': {
      render: (resource, id) => {
        if (typeof StaffVisualizer !== 'undefined') {
          return StaffVisualizer.render(id, resource.options || {});
        }
        return '<div class="resources__interactive-error">Composant non disponible</div>';
      },
      mount: (container, resource) => {
        if (typeof StaffVisualizer !== 'undefined') {
          return StaffVisualizer.mount(container, resource.options || {});
        }
        return null;
      }
    },
    'harmonics-visualizer': {
      render: (resource, id) => {
        if (typeof HarmonicsVisualizer !== 'undefined') {
          return HarmonicsVisualizer.render(id, resource.options || {});
        }
        return '<div class="resources__interactive-error">Composant non disponible</div>';
      },
      mount: (container, resource) => {
        if (typeof HarmonicsVisualizer !== 'undefined') {
          return HarmonicsVisualizer.mount(container, resource.options || {});
        }
        return null;
      }
    }
  },

  /**
   * Rend le contenu Markdown simplifié en HTML
   * @param {string} markdown - Contenu Markdown
   * @returns {string} HTML
   */
  renderMarkdown(markdown) {
    if (!markdown) return '';

    // Le contenu vient du deck (non fiable) : on échappe tout le HTML AVANT d'appliquer le Markdown
    return escapeHtml(markdown)
      // Titres
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      // Gras et italique
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Listes
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
      // Liens
      // (schémas http(s)/mailto uniquement : pas de javascript: ni data:)
      .replace(/\[(.+?)\]\((.+?)\)/g, (match, label, url) => {
        return /^(https?:\/\/|mailto:)/i.test(url.trim())
          ? `<a href="${url.trim()}" target="_blank" rel="noopener noreferrer">${label}</a>`
          : label;
      })
      // Paragraphes
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(.+)$/gm, (match) => {
        if (match.startsWith('<')) return match;
        return match;
      });
  },

  /**
   * Rend l'avertissement IA
   * @returns {string} HTML de l'avertissement
   */
  renderAiWarning() {
    return `
      <div class="resources__ai-warning">
        <span class="resources__ai-warning-icon">🤖</span>
        <div class="resources__ai-warning-content">
          <strong>${i18n.t('resources.aiTitle')}</strong>
          <p>${i18n.t('resources.aiNote')}</p>
        </div>
      </div>
    `;
  },

  /**
   * Rend une ressource de type image
   * @param {Object} resource - La ressource
   * @returns {string} HTML
   */
  renderImageResource(resource) {
    const aiWarning = resource.aiGenerated ? this.renderAiWarning() : '';
    const kind = CardMedia.classify(resource.image);

    // Image distante : jamais chargée automatiquement, lien explicite à la place (voir CardMedia)
    if (kind !== 'embedded') {
      return `
      <div class="resources__item resources__item--image">
        <h3 class="resources__item-title">
          <span class="resources__item-icon">${escapeHtml(resource.icon || '📊')}</span>
          ${escapeHtml(resource.title)}
        </h3>
        ${aiWarning}
        ${CardMedia.image(resource.image, { alt: resource.title })}
      </div>
    `;
    }

    return `
      <div class="resources__item resources__item--image">
        <h3 class="resources__item-title">
          <span class="resources__item-icon">${escapeHtml(resource.icon || '📊')}</span>
          ${escapeHtml(resource.title)}
        </h3>
        ${aiWarning}
        <div class="resources__image-container" data-loading="true">
          <div class="resources__image-loading">
            <span class="resources__image-loading-spinner">⏳</span>
            <span>${i18n.t('resources.imageLoading')}</span>
          </div>
          <div class="resources__image-error" style="display: none;">
            <span class="resources__image-error-icon">⚠️</span>
            <span class="resources__image-error-text">${i18n.t('resources.imageUnavailable')}</span>
          </div>
          <img
            src="${escapeHtml(CardMedia.embeddedSrc(resource.image))}"
            alt="${escapeHtml(resource.title)}"
            class="resources__image"
            loading="lazy"
          />
          <button class="resources__image-zoom" title="${i18n.t('resources.enlarge')}" aria-label="${i18n.t('resources.enlarge')}">🔍</button>
        </div>
      </div>
    `;
  },


  /**
   * Rend une ressource de type lien
   * @param {Object} resource - La ressource
   * @returns {string} HTML
   */
  renderLinkResource(resource) {
    // Adapter les URLs Wikipedia à la langue de l'application
    const url = this._adaptWikipediaUrl(resource.url);

    return `
      <a href="${escapeHtml(/^https?:\/\//i.test(String(url || '').trim()) ? url : '#')}"
         class="resources__link"
         target="_blank"
         rel="noopener noreferrer">
        <span class="resources__link-icon">${escapeHtml(resource.icon || '🔗')}</span>
        <span class="resources__link-title">${escapeHtml(resource.title)}</span>
        <span class="resources__link-arrow">→</span>
      </a>
    `;
  },

  /**
   * Adapte l'URL Wikipedia à la langue de l'application
   * @private
   * @param {string} url - URL originale
   * @returns {string} URL adaptée
   */
  _adaptWikipediaUrl(url) {
    if (!url) return url;

    // Détecter si c'est une URL Wikipedia
    const wikiMatch = url.match(/^https?:\/\/(\w{2})\.wikipedia\.org\/wiki\/(.+)$/);
    if (!wikiMatch) return url;

    // Obtenir la langue actuelle de l'application
    const currentLang = typeof i18n !== 'undefined' ? i18n.getLocale() : 'fr';
    const targetLang = currentLang === 'en' ? 'en' : 'fr';

    // Reconstruire l'URL avec la bonne langue
    const articleSlug = wikiMatch[2];
    return `https://${targetLang}.wikipedia.org/wiki/${articleSlug}`;
  },

  /**
   * Rend une ressource avec contenu Markdown
   * @param {Object} resource - La ressource
   * @returns {string} HTML
   */
  renderContentResource(resource) {
    const aiWarning = resource.aiGenerated ? this.renderAiWarning() : '';

    return `
      <div class="resources__item resources__item--${escapeHtml(resource.type)}">
        <h3 class="resources__item-title">
          <span class="resources__item-icon">${escapeHtml(resource.icon || this.RESOURCE_CONFIG[resource.type]?.defaultIcon || '📄')}</span>
          ${escapeHtml(resource.title)}
        </h3>
        ${aiWarning}
        <div class="resources__item-content">
          ${this.renderMarkdown(resource.content)}
        </div>
      </div>
    `;
  },

  /**
   * Rend une ressource interactive
   * @param {Object} resource - La ressource
   * @param {number} index - Index pour générer un ID unique
   * @returns {string} HTML
   */
  renderInteractiveResource(resource, index = 0) {
    const componentType = resource.component || 'wave-visualizer';
    const component = this.INTERACTIVE_COMPONENTS[componentType];

    if (!component) {
      return `
        <div class="resources__item resources__item--interactive">
          <h3 class="resources__item-title">
            <span class="resources__item-icon">${escapeHtml(resource.icon || '🎮')}</span>
            ${escapeHtml(resource.title || i18n.t('resources.interactiveTool'))}
          </h3>
          <div class="resources__interactive-error">
            ${i18n.t('resources.unknownComponent', { name: escapeHtml(componentType) })}
          </div>
        </div>
      `;
    }

    const uniqueId = `interactive-${componentType}-${index}-${Date.now()}`;

    return `
      <div class="resources__item resources__item--interactive" data-component="${escapeHtml(componentType)}" data-component-id="${uniqueId}">
        ${component.render(resource, uniqueId)}
      </div>
    `;
  },

  /**
   * Rend une ressource selon son type
   * @param {Object} resource - La ressource à rendre
   * @param {number} index - Index pour les composants interactifs
   * @returns {string} HTML
   */
  renderResource(resource, index = 0) {
    switch (resource.type) {
      case 'image':
        return this.renderImageResource(resource);
      case 'link':
        return this.renderLinkResource(resource);
      case 'interactive':
        return this.renderInteractiveResource(resource, index);
      case 'summary':
      case 'tip':
      case 'glossary':
      case 'objective':
      default:
        return this.renderContentResource(resource);
    }
  },

  /**
   * Groupe les ressources par type
   * @param {Array} resources - Liste des ressources
   * @returns {Object} Ressources groupées par type
   */
  groupResourcesByType(resources) {
    const grouped = {};

    resources.forEach(resource => {
      const type = resource.type || 'other';
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(resource);
    });

    return grouped;
  },

  /**
   * Rendu principal de la page
   * @param {Object} state - État de l'application
   * @param {string} deckId - ID du deck
   * @returns {string} HTML de la page
   */
  render(state, deckId) {
    const deck = state.decks?.find(d => d.id === deckId);

    if (!deck) {
      return `<div class="page page--deck-resources"><div class="resources__error">${i18n.t('deckReview.notFound')}</div></div>`;
    }

    const resources = deck.resources || [];

    if (resources.length === 0) {
      return `
        <div class="page page--deck-resources">
          <header class="resources__header">
            <button class="resources__back" aria-label="${i18n.t('common.back')}">←</button>
            <h1 class="resources__title">${escapeHtml(deck.name)}</h1>
          </header>
          <main class="page__content" id="main-content" role="main">
            <div class="resources__empty">
              <span class="resources__empty-icon">📚</span>
              <p>${i18n.t('resources.none')}</p>
            </div>
          </main>
        </div>
      `;
    }

    // Grouper les ressources par type
    const grouped = this.groupResourcesByType(resources);

    // Ordre d'affichage des types
    const typeOrder = ['image', 'summary', 'objective', 'tip', 'interactive', 'glossary', 'link', 'video'];

    // Index global pour les composants interactifs
    let interactiveIndex = 0;

    // Générer le HTML des sections
    const sectionsHtml = typeOrder
      .filter(type => grouped[type] && grouped[type].length > 0)
      .map(type => {
        const typeResources = grouped[type];
        const config = this.RESOURCE_CONFIG[type] || { label: type, defaultIcon: '📄' };

        if (type === 'link') {
          // Les liens sont rendus comme une liste
          return `
            <section class="resources__section resources__section--links">
              <h2 class="resources__section-title">
                <span class="resources__section-icon">${config.defaultIcon}</span>
                ${config.label}
              </h2>
              <div class="resources__links-list">
                ${typeResources.map((r, i) => this.renderResource(r, i)).join('')}
              </div>
            </section>
          `;
        }

        if (type === 'interactive') {
          // Section interactive avec header
          return `
            <section class="resources__section resources__section--interactive">
              <h2 class="resources__section-title">
                <span class="resources__section-icon">${config.defaultIcon}</span>
                ${config.label}
              </h2>
              ${typeResources.map((r, i) => this.renderResource(r, interactiveIndex++)).join('')}
            </section>
          `;
        }

        return `
          <section class="resources__section">
            ${typeResources.map((r, i) => this.renderResource(r, i)).join('')}
          </section>
        `;
      })
      .join('');

    return `
      <div class="page page--deck-resources">
        <header class="resources__header">
          <button class="resources__back" aria-label="${i18n.t('common.back')}">←</button>
          <div class="resources__header-content">
            <h1 class="resources__title">${escapeHtml(deck.name)}</h1>
            <span class="resources__subtitle">📚 ${i18n.t('resources.title')}</span>
          </div>
        </header>

        <main class="page__content" id="main-content" role="main">
          ${sectionsHtml}

          <div class="resources__actions">
            <button class="btn btn--primary resources__play-btn">
              ▶ ${i18n.t('resources.startReview')}
            </button>
          </div>
        </main>
      </div>
    `;
  },

  /**
   * Monte la page avec les événements
   * @param {HTMLElement} container - Conteneur
   * @param {Object} state - État
   * @param {Array} params - Paramètres de route
   */
  mount(container, state, params) {
    const deckId = params[0];
    container.innerHTML = this.render(state, deckId);

    const deck = state.decks?.find(d => d.id === deckId);

    // Bouton retour
    const backButton = container.querySelector('.resources__back');
    if (backButton) {
      backButton.addEventListener('click', () => {
        history.back();
      });
    }

    // Bouton réviser
    const playButton = container.querySelector('.resources__play-btn');
    if (playButton && deck) {
      playButton.addEventListener('click', () => {
        const isMultilingual = deck.type === 'multilingual' && Array.isArray(deck.words);
        if (isMultilingual) {
          Router.navigate(`/multilingual-config/${deckId}`);
        } else {
          Router.navigate(`/game/${deckId}`);
        }
      });
    }

    // Gestion du zoom sur les images
    this._setupImageZoom(container);

    // Montage des composants interactifs
    this._mountedComponents = this._setupInteractiveComponents(container, deck);
  },

  /**
   * Monte les composants interactifs
   * @private
   * @param {HTMLElement} container - Conteneur
   * @param {Object} deck - Le deck
   * @returns {Array} Liste des contrôleurs de composants
   */
  _setupInteractiveComponents(container, deck) {
    const mountedComponents = [];
    const interactiveItems = container.querySelectorAll('.resources__item--interactive[data-component]');

    interactiveItems.forEach((item, index) => {
      const componentType = item.dataset.component;
      const component = this.INTERACTIVE_COMPONENTS[componentType];

      if (component && component.mount) {
        // Trouver la ressource correspondante
        const resource = deck?.resources?.filter(r => r.type === 'interactive')[index] || {};

        const controller = component.mount(item, resource);
        if (controller) {
          mountedComponents.push(controller);
        }
      }
    });

    return mountedComponents;
  },

  /**
   * Démonte la page (appelé avant navigation)
   */
  unmount() {
    // Arrêter tous les composants interactifs
    if (this._mountedComponents) {
      this._mountedComponents.forEach(component => {
        if (component && component.destroy) {
          component.destroy();
        }
      });
      this._mountedComponents = [];
    }
  },

  /**
   * Configure le zoom des images et gère le chargement/erreur
   * @private
   */
  _setupImageZoom(container) {
    const zoomButtons = container.querySelectorAll('.resources__image-zoom');

    zoomButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const imageContainer = e.target.closest('.resources__image-container');
        const img = imageContainer?.querySelector('.resources__image');

        if (img && img.complete && img.naturalHeight !== 0) {
          this._openImageModal(img.src, img.alt);
        }
      });
    });

    // Gestion du chargement des images
    const images = container.querySelectorAll('.resources__image');
    images.forEach(img => {
      const imageContainer = img.closest('.resources__image-container');
      const loadingEl = imageContainer?.querySelector('.resources__image-loading');
      const errorEl = imageContainer?.querySelector('.resources__image-error');
      const zoomBtn = imageContainer?.querySelector('.resources__image-zoom');

      // Gestionnaire de succès de chargement
      const handleLoad = () => {
        if (imageContainer) imageContainer.removeAttribute('data-loading');
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'none';
        img.style.display = 'block';
        img.style.cursor = 'zoom-in';
        if (zoomBtn) zoomBtn.style.display = 'block';
      };

      // Gestionnaire d'erreur de chargement
      const handleError = () => {
        if (imageContainer) {
          imageContainer.removeAttribute('data-loading');
          imageContainer.setAttribute('data-error', 'true');
        }
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) errorEl.style.display = 'flex';
        img.style.display = 'none';
        if (zoomBtn) zoomBtn.style.display = 'none';
      };

      // Si l'image est déjà chargée (cache)
      if (img.complete) {
        if (img.naturalHeight === 0) {
          handleError();
        } else {
          handleLoad();
        }
      } else {
        // Sinon attendre les événements
        img.addEventListener('load', handleLoad);
        img.addEventListener('error', handleError);
      }

      // Clic pour zoom (seulement si image chargée)
      img.addEventListener('click', () => {
        if (img.complete && img.naturalHeight !== 0) {
          this._openImageModal(img.src, img.alt);
        }
      });
    });
  },

  /**
   * Ouvre une modal avec l'image en plein écran
   * @private
   */
  _openImageModal(src, alt) {
    // Créer la modal
    const modal = document.createElement('div');
    modal.className = 'resources__modal';
    modal.innerHTML = `
      <div class="resources__modal-backdrop"></div>
      <div class="resources__modal-content">
        <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" class="resources__modal-image" />
        <button class="resources__modal-close" aria-label="${i18n.t('common.close')}">✕</button>
      </div>
    `;

    document.body.appendChild(modal);

    // Animation d'entrée
    requestAnimationFrame(() => {
      modal.classList.add('resources__modal--visible');
    });

    // Fermeture
    const close = () => {
      document.removeEventListener('keydown', handleEscape);
      modal.classList.remove('resources__modal--visible');
      setTimeout(() => modal.remove(), 300);
    };

    modal.querySelector('.resources__modal-backdrop').addEventListener('click', close);
    modal.querySelector('.resources__modal-close').addEventListener('click', close);

    // Fermeture avec Escape
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        close();
      }
    };
    document.addEventListener('keydown', handleEscape);
  }
};

// Export pour tests Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Pages.deckResources;
}
