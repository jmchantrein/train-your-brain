/**
 * Component TagSelector - Sélecteur de tags avec menu hiérarchique
 *
 * Supporte deux modes :
 * - 'edit' (multi-select) : sélection multiple avec gestion des ancêtres
 * - 'filter' (single-select) : sélection unique avec comptage decks
 *
 * @module ComponentsTagSelector
 * @requires escapeHtml (components.js)
 * @requires PageUtils (page-utils.js)
 * @requires Tags (modules/tags.js)
 */

/**
 * Composant TagSelector - Sélecteur de tags
 * @type {Object}
 */
const ComponentTagSelector = {
  /**
   * État interne du composant
   */
  _searchQuery: '',
  _openMenu: null,
  _deckCounts: null,

  /**
   * Groupes à masquer dans le menu
   */
  HIDDEN_GROUPS: ['Types', 'Divers'],

  /**
   * Compte les decks par catégorie (pour mode filter)
   * Ne compte que les tags les plus spécifiques (feuilles) pour éviter le double comptage
   * quand les decks stockent la hiérarchie complète (maths, arithmetique, multiplications)
   */
  _countDecksByCategory(decks) {
    const counts = {};
    decks.forEach(deck => {
      if (deck.category && Array.isArray(deck.category)) {
        // Trouver les tags les plus spécifiques (feuilles) parmi les catégories du deck
        // Un tag est "feuille" s'il n'est ancêtre d'aucun autre tag dans la liste
        const leafCategories = deck.category.filter(cat => {
          // Vérifier si ce tag est ancêtre d'un autre tag dans la liste
          return !deck.category.some(otherCat => {
            if (otherCat === cat) return false;
            if (typeof Tags === 'undefined') return false;
            const ancestors = Tags.getAncestors(otherCat);
            return ancestors.includes(cat);
          });
        });

        // Ne compter que les tags feuilles
        leafCategories.forEach(cat => {
          counts[cat] = (counts[cat] || 0) + 1;
        });
      }
    });
    return counts;
  },

  /**
   * Compte récursivement les decks pour un nœud et ses descendants
   */
  _countDecksInNode(nodeId, deckCounts) {
    let total = deckCounts[nodeId] || 0;
    if (typeof Tags !== 'undefined') {
      const descendants = Tags.getDescendants(nodeId);
      descendants.forEach(descId => {
        total += deckCounts[descId] || 0;
      });
    }
    return total;
  },

  /**
   * Rend le sélecteur de tags avec barre de menu classique
   * @param {Object} props - Propriétés
   * @param {Array} [props.selectedTags] - Tags sélectionnés
   * @param {string} [props.mode='edit'] - Mode 'edit' (multi) ou 'filter' (single)
   * @param {Array} [props.decks] - Decks pour comptage (mode filter)
   * @param {string} [props.searchQuery] - Query de recherche (mode filter)
   * @param {string} [props.searchPlaceholder] - Placeholder de recherche
   */
  render(props = {}) {
    const {
      selectedTags = [],
      mode = 'edit',
      decks = [],
      searchQuery = '',
      searchPlaceholder
    } = props;
    const _t = PageUtils.getTranslator();

    if (typeof Tags === 'undefined') {
      return '<div class="tag-selector">Module Tags non disponible</div>';
    }

    // En mode filter, calculer les comptages de decks
    if (mode === 'filter') {
      this._deckCounts = this._countDecksByCategory(decks);
    }

    const groupedTree = Tags.buildGroupedTree();
    const placeholder = searchPlaceholder || (mode === 'filter' ? _t('explore.search') : 'Rechercher un tag...');
    const selectedCategory = mode === 'filter' && selectedTags.length > 0 ? selectedTags[0] : null;

    return `
      <div class="tag-selector tag-selector--menubar" data-mode="${mode}">
        <!-- Barre de recherche -->
        <div class="tag-selector__search-wrapper">
          <label for="tag-search" class="sr-only">${escapeHtml(placeholder)}</label>
          <input type="text" id="tag-search" class="tag-selector__search" placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(mode === 'filter' ? searchQuery : this._searchQuery)}">
          ${mode === 'filter' ? '<span class="tag-selector__search-icon">🔍</span>' : '<div class="tag-selector__search-dropdown"></div>'}
        </div>

        <!-- Filtre actif (mode filter) -->
        ${mode === 'filter' && selectedCategory ? `
          <div class="tag-selector__active-filter">
            <span class="tag-selector__active-label">${_t('explore.filterBy')}:</span>
            <span class="tag-selector__active-tag">
              ${Tags.getById(selectedCategory)?.icon || '🏷️'}
              ${escapeHtml(Tags.getById(selectedCategory)?.label || selectedCategory)}
              <button type="button" class="tag-selector__clear-filter" title="${_t('common.close')}">×</button>
            </span>
          </div>
        ` : ''}

        <!-- Tags sélectionnés (mode edit) -->
        ${mode === 'edit' ? `
          <div class="tag-selector__selected">
            ${selectedTags.length > 0 ? `
              <div class="tag-selector__selected-list">
                ${selectedTags.map(tagId => {
                  const tag = Tags.getById(tagId);
                  const isLeaf = Tags.getChildren(tagId).length === 0;
                  const isAutoSelected = selectedTags.some(t => t !== tagId && Tags.getAncestors(t).includes(tagId));
                  return `
                    <span class="tag-selector__tag ${isAutoSelected ? 'tag-selector__tag--inherited' : ''} ${isLeaf ? 'tag-selector__tag--leaf' : ''}">
                      <span class="tag-selector__tag-icon">${tag?.icon || '🏷️'}</span>
                      <span class="tag-selector__tag-label">${escapeHtml(tag?.label || tagId)}</span>
                      ${!isAutoSelected ? `<button type="button" class="tag-selector__tag-remove" data-tag-id="${escapeHtml(tagId)}" aria-label="${i18n.t('tagSelector.remove', { label: escapeHtml(tag?.label || tagId) })}">×</button>` : ''}
                    </span>
                  `;
                }).join('')}
              </div>
            ` : `<span class="tag-selector__empty">${i18n.t('tagSelector.none')}</span>`}
          </div>
        ` : ''}

        <!-- Barre de menu classique -->
        <nav class="tag-selector__menubar">
          ${Object.entries(groupedTree)
            .filter(([group]) => !this.HIDDEN_GROUPS.includes(group))
            .map(([group, nodes]) => {
            // En mode filter, afficher le total de decks par groupe
            const groupTotal = mode === 'filter'
              ? nodes.reduce((sum, node) => sum + this._countDecksInNode(node.id, this._deckCounts), 0)
              : null;

            return `
              <div class="tag-selector__menubar-item" data-group="${escapeHtml(group)}">
                <span class="tag-selector__menubar-label" role="button" tabindex="0" aria-haspopup="true">
                  ${escapeHtml(group)}
                  ${groupTotal !== null ? `<span class="tag-selector__menubar-count">${groupTotal}</span>` : ''}
                </span>
                <div class="tag-selector__dropdown">
                  ${nodes.map(node => this._renderMenuItem(node, selectedTags, mode)).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </nav>
      </div>
    `;
  },

  /**
   * Rend un élément de menu (récursif)
   */
  _renderMenuItem(node, selectedTags, mode = 'edit') {
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedTags.includes(node.id);
    const isAutoSelected = mode === 'edit' && selectedTags.some(t => t !== node.id && Tags.getAncestors(t).includes(node.id));
    const isLeaf = !hasChildren;

    // En mode filter, compter les decks ; sinon compter les descendants
    let countLabel = '';
    let isEmpty = false;
    if (mode === 'filter') {
      const deckCount = this._countDecksInNode(node.id, this._deckCounts);
      // Toujours afficher les feuilles même avec 0 decks
      // Pour les nœuds avec enfants, masquer si la branche entière est vide
      if (!isLeaf && deckCount === 0) {
        return ''; // Branche entièrement vide
      }
      isEmpty = isLeaf && deckCount === 0;
      countLabel = `${deckCount}`;
    } else if (hasChildren) {
      const counts = Tags.countDescendants(node.id);
      countLabel = `${counts.nodes > 0 ? counts.nodes + '📁' : ''}${counts.leaves > 0 ? counts.leaves + '🏷️' : ''}`;
    }

    return `
      <div class="tag-selector__menu-item ${hasChildren ? 'has-submenu' : ''} ${isLeaf ? 'is-leaf' : ''} ${isEmpty ? 'is-empty' : ''} ${isSelected || isAutoSelected ? 'is-selected' : ''}"
           data-tag-id="${escapeHtml(node.id)}" role="button" tabindex="0">
        <span class="tag-selector__menu-item-icon">${node.icon || '🏷️'}</span>
        <span class="tag-selector__menu-item-label">${escapeHtml(node.label)}</span>
        ${mode === 'filter' ? `<span class="tag-selector__menu-item-count">${countLabel}</span>` : ''}
        ${hasChildren && mode !== 'filter' ? `<span class="tag-selector__menu-item-count">${countLabel}</span>` : ''}
        ${hasChildren ? `<span class="tag-selector__menu-item-arrow">▶</span>` : ''}
        ${hasChildren ? `
          <div class="tag-selector__submenu">
            ${node.children.map(child => this._renderMenuItem(child, selectedTags, mode)).join('')}
          </div>
        ` : ''}
      </div>
    `;
  },

  /**
   * Monte le sélecteur et attache les événements
   * @param {HTMLElement} container
   * @param {Object} props
   * @param {Object} callbacks - { onChange, onSearchChange (filter mode), onCategoryChange (filter mode) }
   */
  mount(container, props, callbacks = {}) {
    container.innerHTML = this.render(props);

    const { selectedTags = [], mode = 'edit' } = props;
    let currentTags = [...selectedTags];

    /**
     * Ferme tous les menus
     */
    const closeAllMenus = () => {
      container.querySelectorAll('.tag-selector__menubar-item.is-open').forEach(item => {
        item.classList.remove('is-open');
      });
      this._openMenu = null;
    };

    // ─── Mode Filter : comportement single-select ───
    if (mode === 'filter') {
      // Recherche : trigger callback
      const searchInput = container.querySelector('.tag-selector__search');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          if (callbacks.onSearchChange) {
            callbacks.onSearchChange(e.target.value);
          }
        });
      }

      // Clear filter button
      const clearBtn = container.querySelector('.tag-selector__clear-filter');
      if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (callbacks.onCategoryChange) {
            callbacks.onCategoryChange(null);
          }
        });
      }

      // Items de menu : single-select toggle
      container.querySelectorAll('.tag-selector__menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const tagId = item.dataset.tagId;
          // Toggle : si déjà sélectionné, désélectionner
          const newCategory = currentTags.includes(tagId) ? null : tagId;
          if (callbacks.onCategoryChange) {
            callbacks.onCategoryChange(newCategory);
          }
          closeAllMenus();
        });
      });
    }

    // ─── Mode Edit : comportement multi-select avec ancêtres ───
    else {
      /**
       * Met à jour les tags en ajoutant automatiquement les ancêtres
       */
      const updateTags = (newTags, addAncestors = true) => {
        if (addAncestors) {
          const allTags = new Set();
          newTags.forEach(tagId => {
            allTags.add(tagId);
            Tags.getAncestors(tagId).forEach(ancestorId => allTags.add(ancestorId));
          });
          currentTags = Array.from(allTags);
        } else {
          currentTags = newTags;
        }

        if (callbacks.onChange) {
          callbacks.onChange(currentTags);
        }
        container.innerHTML = this.render({ ...props, selectedTags: currentTags });
        this.mount(container, { ...props, selectedTags: currentTags }, callbacks);
      };

      /**
       * Retire un tag et ses descendants
       */
      const removeTag = (tagId) => {
        const descendants = Tags.getDescendants(tagId);
        const toRemove = new Set([tagId, ...descendants]);
        let remaining = currentTags.filter(t => !toRemove.has(t));

        const finalTags = new Set();
        remaining.forEach(t => {
          finalTags.add(t);
          Tags.getAncestors(t).forEach(a => finalTags.add(a));
        });

        updateTags(Array.from(finalTags), false);
      };

      // Items de menu : clic pour sélectionner
      container.querySelectorAll('.tag-selector__menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const tagId = item.dataset.tagId;

          if (currentTags.includes(tagId)) {
            removeTag(tagId);
          } else {
            updateTags([...currentTags, tagId]);
          }
          closeAllMenus();
        });
      });

      // Tags à retirer
      container.querySelectorAll('.tag-selector__tag-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          removeTag(btn.dataset.tagId);
        });
      });

      // Recherche de tags (mode edit)
      const searchInput = container.querySelector('.tag-selector__search');
      const searchDropdown = container.querySelector('.tag-selector__search-dropdown');

      if (searchInput && searchDropdown) {
        searchInput.addEventListener('input', (e) => {
          this._searchQuery = e.target.value;
          const results = Tags.search(this._searchQuery);

          if (this._searchQuery.length >= 2 && results.length > 0) {
            searchDropdown.innerHTML = results.map(tag => {
              const isChecked = currentTags.includes(tag.id);
              const ancestors = Tags.getAncestors(tag.id);
              const path = [...ancestors.reverse().map(id => Tags.getById(id)?.label || id), tag.label].join(' › ');
              return `
                <div class="tag-selector__search-result ${isChecked ? 'is-selected' : ''}" data-tag-id="${escapeHtml(tag.id)}">
                  <span class="tag-selector__search-result-icon">${tag.icon || '🏷️'}</span>
                  <div class="tag-selector__search-result-info">
                    <span class="tag-selector__search-result-label">${escapeHtml(tag.label)}</span>
                    <span class="tag-selector__search-result-path">${escapeHtml(path)}</span>
                  </div>
                </div>
              `;
            }).join('');
            searchDropdown.classList.add('is-visible');

            searchDropdown.querySelectorAll('.tag-selector__search-result').forEach(result => {
              result.addEventListener('click', (e) => {
                e.stopPropagation();
                const tagId = result.dataset.tagId;
                if (currentTags.includes(tagId)) {
                  removeTag(tagId);
                } else {
                  updateTags([...currentTags, tagId]);
                }
                this._searchQuery = '';
                searchInput.value = '';
                searchDropdown.classList.remove('is-visible');
              });
            });
          } else if (this._searchQuery.length >= 2) {
            searchDropdown.innerHTML = `<div class="tag-selector__search-empty">${i18n.t('tagSelector.noResult')}</div>`;
            searchDropdown.classList.add('is-visible');
          } else {
            searchDropdown.classList.remove('is-visible');
          }
        });

        searchInput.addEventListener('blur', () => {
          setTimeout(() => searchDropdown.classList.remove('is-visible'), 200);
        });
      }
    }

    // ─── Commun aux deux modes : gestion du menu bar ───

    // Clavier : labels de menu et items sont des role="button" -> Entrée / Espace déclenchent le clic
    container.querySelectorAll('.tag-selector__menubar-label, .tag-selector__menu-item').forEach(el => {
      el.addEventListener('keydown', (e) => {
        if (e.target === el && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          el.click();
        }
      });
    });

    // Barre de menu : clic pour ouvrir
    container.querySelectorAll('.tag-selector__menubar-item').forEach(menuItem => {
      const label = menuItem.querySelector('.tag-selector__menubar-label');

      label.addEventListener('click', (e) => {
        e.stopPropagation();
        const group = menuItem.dataset.group;

        if (this._openMenu === group) {
          closeAllMenus();
        } else {
          closeAllMenus();
          menuItem.classList.add('is-open');
          this._openMenu = group;
        }
      });

      // Hover pour changer de menu si un menu est déjà ouvert
      menuItem.addEventListener('mouseenter', () => {
        if (this._openMenu && this._openMenu !== menuItem.dataset.group) {
          closeAllMenus();
          menuItem.classList.add('is-open');
          this._openMenu = menuItem.dataset.group;
        }
      });
    });

    // Fermer au clic extérieur
    // (mount() est rappelé à chaque changement de tags : ne garder qu'un listener global par conteneur)
    if (container._outsideClickHandler) {
      document.removeEventListener('click', container._outsideClickHandler);
    }
    container._outsideClickHandler = (e) => {
      if (container.isConnected === false) {
        document.removeEventListener('click', container._outsideClickHandler);
        return;
      }
      if (!container.contains(e.target)) {
        closeAllMenus();
      }
    };
    document.addEventListener('click', container._outsideClickHandler);
  }
};

// Assigner au namespace Components pour compatibilité
if (typeof Components !== 'undefined') {
  Components.tagSelector = ComponentTagSelector;
}

// Export pour tests Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ComponentTagSelector;
}
