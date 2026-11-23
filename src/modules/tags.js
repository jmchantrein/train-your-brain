/**
 * Module Tags - Gestion des tags prédéfinis et suggestions
 *
 * Fournit une liste de tags hiérarchiques avec associations
 * pour suggérer des tags pertinents basés sur les sélections.
 *
 * Supporte les relations multi-parents via le champ `parents[]`.
 *
 * Dépendance: tags-taxonomy.js (doit être chargé avant)
 */

// ═══════════════════════════════════════════════════════════════════════════
// MODULE TAGS
// ═══════════════════════════════════════════════════════════════════════════

const Tags = {
  /**
   * Accès direct à la taxonomie complète
   */
  PREDEFINED: TAXONOMY,

  /**
   * Cache des index pré-calculés pour performance
   * @private
   */
  _cache: {
    byId: null,           // Map<id, tag>
    childrenOf: null,     // Map<parentId, tag[]>
    roots: null,          // tag[] (parents.length === 0)
    groupedTree: null,    // Pre-built grouped tree
    initialized: false
  },

  /**
   * Initialise les caches pour des recherches rapides
   * Appelé automatiquement au premier accès
   * @private
   */
  _init() {
    if (this._cache.initialized) return;

    // Index par ID
    this._cache.byId = new Map();
    TAXONOMY.forEach(tag => {
      this._cache.byId.set(tag.id, tag);
    });

    // Index des enfants par parent
    this._cache.childrenOf = new Map();
    this._cache.childrenOf.set(null, []); // Racines

    TAXONOMY.forEach(tag => {
      if (!tag.parents || tag.parents.length === 0) {
        this._cache.childrenOf.get(null).push(tag);
      } else {
        tag.parents.forEach(parentId => {
          if (!this._cache.childrenOf.has(parentId)) {
            this._cache.childrenOf.set(parentId, []);
          }
          this._cache.childrenOf.get(parentId).push(tag);
        });
      }
    });

    // Stocker les racines séparément
    this._cache.roots = this._cache.childrenOf.get(null);

    this._cache.initialized = true;
  },

  /**
   * Associations de tags (pour suggestions)
   */
  ASSOCIATIONS: {
    'maths': ['calcul-mental', 'primaire', 'college', 'entrainement-type'],
    'arithmetique': ['calcul-mental', 'additions', 'soustractions', 'multiplications', 'divisions'],
    'additions': ['soustractions', 'calcul-mental', 'primaire'],
    'multiplications': ['divisions', 'calcul-mental', 'primaire'],
    'francais': ['fr-orthographe', 'fr-grammaire', 'fr-conjugaison', 'fr-vocabulaire'],
    'fr-orthographe': ['fr-grammaire', 'primaire', 'college'],
    'fr-conjugaison': ['fr-grammaire', 'francais'],
    'langues': ['memorisation-type'],
    'anglais': ['en-vocabulary', 'en-grammar', 'college', 'lycee'],
    'sciences': ['physique', 'chimie', 'biologie', 'college', 'lycee'],
    'histoire': ['geographie', 'memorisation-type'],
    'geographie': ['histoire', 'cartographie'],
    'primaire': ['maths', 'francais', 'entrainement-type'],
    'college': ['maths', 'francais', 'sciences', 'histoire', 'langues'],
    'lycee': ['sciences', 'philosophie', 'langues', 'examen'],
    'revision': ['examen', 'memorisation-type', 'entrainement-type'],
    'examen': ['revision', 'entrainement-type'],
    'informatique': ['algorithmique', 'programmation', 'python', 'javascript'],
    'programmation': ['python', 'javascript', 'java', 'algorithmique'],
  },

  // ═══════════════════════════════════════════════════════════════
  // MÉTHODES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Récupère tous les tags prédéfinis
   */
  getAll() {
    return this.PREDEFINED;
  },

  /**
   * Récupère un tag par son ID (utilise le cache)
   * @param {string} id - ID du tag
   * @returns {Object|null} Tag ou null si non trouvé
   */
  getById(id) {
    this._init();
    return this._cache.byId.get(id) || null;
  },

  /**
   * Récupère tous les groupes uniques
   */
  getGroups() {
    const groups = [...new Set(this.PREDEFINED.map(t => t.group))];
    return groups;
  },

  /**
   * Suggère des tags basés sur les tags déjà sélectionnés
   */
  getSuggestions(selectedTags, maxSuggestions = 5) {
    if (!selectedTags || selectedTags.length === 0) {
      return this.PREDEFINED
        .filter(t => ['maths', 'francais', 'anglais', 'primaire', 'college'].includes(t.id))
        .map(t => ({ ...t, score: 0.5 }));
    }

    const scores = {};

    selectedTags.forEach(tagId => {
      const associations = this.ASSOCIATIONS[tagId] || [];
      associations.forEach((assocId, index) => {
        const score = 1 - (index * 0.15);
        if (!scores[assocId]) scores[assocId] = 0;
        scores[assocId] += score;
      });

      // Ajouter les enfants du tag sélectionné (support multi-parents)
      const children = this.PREDEFINED.filter(t =>
        t.parents && t.parents.includes(tagId)
      );
      children.forEach(child => {
        if (!scores[child.id]) scores[child.id] = 0;
        scores[child.id] += 0.8;
      });

      // Ajouter les parents du tag sélectionné
      const tag = this.getById(tagId);
      if (tag && tag.parents) {
        tag.parents.forEach(parentId => {
          if (!scores[parentId]) scores[parentId] = 0;
          scores[parentId] += 0.6;
        });
      }
    });

    const suggestions = Object.entries(scores)
      .filter(([id]) => !selectedTags.includes(id))
      .map(([id, score]) => {
        const tag = this.getById(id);
        return tag ? { ...tag, score: Math.min(score, 1) } : null;
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSuggestions);

    return suggestions;
  },

  /**
   * Récupère tous les ancêtres d'un tag (support multi-parents)
   * @param {string} tagId - ID du tag
   * @returns {Array<string>} IDs des ancêtres uniques
   */
  getAncestors(tagId) {
    const ancestors = new Set();
    const visited = new Set();

    const traverse = (id) => {
      if (visited.has(id)) return;
      visited.add(id);

      const tag = this.getById(id);
      if (tag && tag.parents) {
        tag.parents.forEach(parentId => {
          ancestors.add(parentId);
          traverse(parentId);
        });
      }
    };

    traverse(tagId);
    return [...ancestors];
  },

  /**
   * Récupère tous les descendants d'un tag (support multi-parents)
   */
  getDescendants(tagId) {
    const descendants = new Set();

    const traverse = (id) => {
      const children = this.PREDEFINED.filter(t =>
        t.parents && t.parents.includes(id)
      );
      children.forEach(child => {
        if (!descendants.has(child.id)) {
          descendants.add(child.id);
          traverse(child.id);
        }
      });
    };

    traverse(tagId);
    return [...descendants];
  },

  /**
   * Récupère les enfants directs d'un tag (utilise le cache)
   * @param {string|null} tagId - ID du tag parent (null pour les racines)
   * @returns {Array} Liste des enfants directs
   */
  getChildren(tagId) {
    this._init();
    return this._cache.childrenOf.get(tagId) || [];
  },

  /**
   * Compte les nœuds (branches) et feuilles dans la descendance d'un tag
   * @param {string} tagId - ID du tag
   * @returns {{ nodes: number, leaves: number }} Comptage
   */
  countDescendants(tagId) {
    let nodes = 0;
    let leaves = 0;

    const traverse = (id) => {
      const children = this.getChildren(id);
      if (children.length === 0) {
        leaves++;
      } else {
        nodes++;
        children.forEach(child => traverse(child.id));
      }
    };

    const directChildren = this.getChildren(tagId);
    directChildren.forEach(child => traverse(child.id));

    return { nodes, leaves };
  },

  /**
   * Construit l'arbre des tags groupés par catégorie principale (avec cache)
   * @returns {Object} Arbre groupé { groupe: [tags] }
   */
  buildGroupedTree() {
    this._init();

    // Retourner le cache si disponible
    if (this._cache.groupedTree) {
      return this._cache.groupedTree;
    }

    const tree = {};
    const roots = this.getChildren(null);

    roots.forEach(root => {
      const group = root.group || 'Autres';
      if (!tree[group]) tree[group] = [];

      const buildNode = (tag) => {
        const children = this.getChildren(tag.id);
        return {
          ...tag,
          children: children.map(child => buildNode(child))
        };
      };

      tree[group].push(buildNode(root));
    });

    this._cache.groupedTree = tree;
    return this._cache.groupedTree;
  },

  /**
   * Recherche des tags par texte avec support de la similarité
   * @param {string} query - Texte de recherche
   * @param {Object} options - Options de recherche
   * @param {number} options.maxResults - Nombre max de résultats (défaut: 20)
   * @param {number} options.minSimilarity - Seuil de similarité 0-1 (défaut: 0.4)
   * @param {boolean} options.includeEquivalents - Chercher dans les équivalents (défaut: true)
   * @returns {Array} Tags correspondants triés par pertinence
   */
  search(query, options = {}) {
    if (!query || query.length < 2) return [];

    const {
      maxResults = 20,
      minSimilarity = 0.4,
      includeEquivalents = true
    } = options;

    const normalizedQuery = TextUtils.normalizeText(query);
    const results = [];

    this.PREDEFINED.forEach(tag => {
      const normalizedLabel = TextUtils.normalizeText(tag.label);
      const normalizedId = TextUtils.normalizeText(tag.id.replace(/-/g, ' '));
      const normalizedGroup = TextUtils.normalizeText(tag.group || '');

      let score = 0;
      let matchType = null;

      // 1. Correspondance exacte (score max)
      if (normalizedLabel === normalizedQuery || normalizedId === normalizedQuery) {
        score = 1.0;
        matchType = 'exact';
      }
      // 2. Le label/id commence par la requête
      else if (normalizedLabel.startsWith(normalizedQuery) || normalizedId.startsWith(normalizedQuery)) {
        score = 0.9;
        matchType = 'prefix';
      }
      // 3. Contient la requête (substring)
      else if (normalizedLabel.includes(normalizedQuery) || normalizedId.includes(normalizedQuery)) {
        score = 0.8;
        matchType = 'contains';
      }
      // 4. Le groupe contient la requête
      else if (normalizedGroup.includes(normalizedQuery)) {
        score = 0.6;
        matchType = 'group';
      }
      // 5. Similarité par mots (Jaccard)
      else {
        const similarity = this._calculateSimilarity(normalizedQuery, normalizedLabel);
        if (similarity >= minSimilarity) {
          score = similarity * 0.7; // Pondéré car moins précis
          matchType = 'similar';
        }
      }

      // 6. Chercher dans les équivalents internationaux
      if (score === 0 && includeEquivalents && tag.equivalents) {
        for (const [locale, equivalent] of Object.entries(tag.equivalents)) {
          const normalizedEquiv = TextUtils.normalizeText(equivalent);
          if (normalizedEquiv.includes(normalizedQuery)) {
            score = 0.7;
            matchType = 'equivalent';
            break;
          }
          const similarity = this._calculateSimilarity(normalizedQuery, normalizedEquiv);
          if (similarity >= minSimilarity) {
            score = similarity * 0.5;
            matchType = 'equivalent-similar';
            break;
          }
        }
      }

      if (score > 0) {
        results.push({
          ...tag,
          _score: score,
          _matchType: matchType
        });
      }
    });

    // Trier par score décroissant, puis par label
    results.sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score;
      return a.label.localeCompare(b.label, 'fr');
    });

    return results.slice(0, maxResults);
  },

  /**
   * Calcule la similarité entre deux textes (combinaison Jaccard + Levenshtein)
   * @private
   */
  _calculateSimilarity(query, target) {
    if (!query || !target) return 0;

    // Similarité Jaccard sur les mots
    const queryWords = new Set(query.split(/\s+/).filter(w => w.length > 1));
    const targetWords = new Set(target.split(/\s+/).filter(w => w.length > 1));

    if (queryWords.size === 0 || targetWords.size === 0) {
      // Fallback sur Levenshtein pour les mots courts
      return this._levenshteinSimilarity(query, target);
    }

    const intersection = new Set([...queryWords].filter(w => targetWords.has(w)));
    const union = new Set([...queryWords, ...targetWords]);
    const jaccard = intersection.size / union.size;

    // Bonus si un mot de la requête est préfixe d'un mot cible
    let prefixBonus = 0;
    for (const qWord of queryWords) {
      for (const tWord of targetWords) {
        if (tWord.startsWith(qWord) || qWord.startsWith(tWord)) {
          prefixBonus = 0.2;
          break;
        }
        // Bonus Levenshtein pour mots proches
        const levSim = this._levenshteinSimilarity(qWord, tWord);
        if (levSim > 0.7) {
          prefixBonus = Math.max(prefixBonus, levSim * 0.15);
        }
      }
    }

    return Math.min(1, jaccard + prefixBonus);
  },

  /**
   * Calcule la similarité Levenshtein normalisée
   * @private
   */
  _levenshteinSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 1;

    const maxLen = Math.max(str1.length, str2.length);

    if (maxLen === 0) return 1;

    const distance = TextUtils.levenshteinDistance(str1, str2);
    return 1 - (distance / maxLen);
  },

  /**
   * Normalise un tableau de tags
   */
  normalize(tags) {
    if (!Array.isArray(tags)) return [];

    const validIds = new Set(this.PREDEFINED.map(t => t.id));
    const normalized = [];

    tags.forEach(tag => {
      const id = typeof tag === 'string' ? tag : tag.id;
      if (id && validIds.has(id) && !normalized.includes(id)) {
        normalized.push(id);
      }
    });

    return normalized;
  },

  /**
   * Convertit les anciennes catégories en tags avec recherche par similarité
   * @param {string|string[]} category - Catégorie(s) à convertir
   * @param {Object} options - Options
   * @param {number} options.minSimilarity - Seuil de similarité (défaut: 0.6)
   * @returns {string[]} Liste d'IDs de tags
   */
  fromCategory(category, options = {}) {
    if (!category) return [];

    const { minSimilarity = 0.6 } = options;
    const categories = Array.isArray(category) ? category : [category];
    const tags = [];

    categories.forEach(cat => {
      if (!cat || typeof cat !== 'string') return;

      const normalizedCat = TextUtils.normalizeText(cat);
      const normalizedId = cat.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '-');

      // 1. Correspondance exacte par ID
      let match = this.PREDEFINED.find(t => t.id === normalizedId);

      // 2. Correspondance exacte par label normalisé
      if (!match) {
        match = this.PREDEFINED.find(t =>
          TextUtils.normalizeText(t.label) === normalizedCat
        );
      }

      // 3. Correspondance par préfixe
      if (!match) {
        match = this.PREDEFINED.find(t =>
          TextUtils.normalizeText(t.label).startsWith(normalizedCat) ||
          t.id.startsWith(normalizedId)
        );
      }

      // 4. Recherche dans les équivalents
      if (!match) {
        match = this.PREDEFINED.find(t => {
          if (!t.equivalents) return false;
          return Object.values(t.equivalents).some(equiv =>
            TextUtils.normalizeText(equiv) === normalizedCat ||
            TextUtils.normalizeText(equiv).includes(normalizedCat)
          );
        });
      }

      // 5. Recherche par similarité
      if (!match) {
        let bestScore = 0;
        let bestMatch = null;

        this.PREDEFINED.forEach(t => {
          const labelSim = this._calculateSimilarity(normalizedCat, TextUtils.normalizeText(t.label));
          const idSim = this._levenshteinSimilarity(normalizedId, t.id);
          const maxSim = Math.max(labelSim, idSim);

          if (maxSim > bestScore && maxSim >= minSimilarity) {
            bestScore = maxSim;
            bestMatch = t;
          }
        });

        match = bestMatch;
      }

      if (match) {
        if (!tags.includes(match.id)) {
          tags.push(match.id);
        }
      } else {
        // Aucune correspondance trouvée, garder la catégorie normalisée
        if (!tags.includes(normalizedId)) {
          tags.push(normalizedId);
        }
      }
    });

    return tags;
  },

  /**
   * Statistiques de la taxonomie
   */
  getStats() {
    const total = this.PREDEFINED.length;
    const roots = this.PREDEFINED.filter(t => !t.parents || t.parents.length === 0).length;
    const multiParents = this.PREDEFINED.filter(t => t.parents && t.parents.length > 1).length;
    const groups = this.getGroups().length;

    return { total, roots, multiParents, groups };
  }
};

// Export pour tests Node.js
if (typeof module !== 'undefined') module.exports = Tags;
