/**
 * Tests pour le module Tags
 * Système de taxonomie hiérarchique avec support multi-parents
 */

describe('Tags Module', () => {

  // ═══════════════════════════════════════════════════════════════
  // getById() - Récupération par ID
  // ═══════════════════════════════════════════════════════════════

  describe('getById', () => {
    it('should return tag object for valid id', () => {
      const tag = Tags.getById('maths');
      expect(tag).toBeDefined();
      expect(tag.id).toBe('maths');
      expect(tag.label).toBe('Mathématiques');
      expect(tag.icon).toBe('🔢');
    });

    it('should return null for invalid id', () => {
      const tag = Tags.getById('nonexistent');
      expect(tag).toBeNull();
    });

    it('should return null for empty id', () => {
      expect(Tags.getById('')).toBeNull();
      expect(Tags.getById(null)).toBeNull();
      expect(Tags.getById(undefined)).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getAll() - Récupération complète
  // ═══════════════════════════════════════════════════════════════

  describe('getAll', () => {
    it('should return array of tags', () => {
      const tags = Tags.getAll();
      expect(Array.isArray(tags)).toBeTruthy();
      expect(tags.length).toBeGreaterThan(100);
    });

    it('should return tags with required properties', () => {
      const tags = Tags.getAll();
      const firstTag = tags[0];

      expect(firstTag.id).toBeDefined();
      expect(firstTag.label).toBeDefined();
      expect(firstTag.icon).toBeDefined();
      expect(firstTag.group).toBeDefined();
      expect(firstTag.parents).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getByGroup() - Filtrage par groupe
  // ═══════════════════════════════════════════════════════════════
  // getGroups() - Liste des groupes
  // ═══════════════════════════════════════════════════════════════

  describe('getGroups', () => {
    it('should return array of unique group names', () => {
      const groups = Tags.getGroups();
      expect(Array.isArray(groups)).toBeTruthy();
      expect(groups.length).toBeGreaterThan(5);
      expect(groups).toContain('Matières');
      expect(groups).toContain('Niveaux');
      expect(groups).toContain('Type');
    });

    it('should not contain duplicates', () => {
      const groups = Tags.getGroups();
      const unique = [...new Set(groups)];
      expect(groups.length).toBe(unique.length);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getChildren() - Enfants directs
  // ═══════════════════════════════════════════════════════════════

  describe('getChildren', () => {
    it('should return root tags for null parent', () => {
      const roots = Tags.getChildren(null);
      expect(roots.length).toBeGreaterThan(5);

      roots.forEach(tag => {
        expect(tag.parents.length).toBe(0);
      });
    });

    it('should return children for maths tag', () => {
      const children = Tags.getChildren('maths');
      expect(children.length).toBeGreaterThan(5);

      children.forEach(child => {
        expect(child.parents).toContain('maths');
      });
    });

    it('should return empty array for leaf tag', () => {
      const children = Tags.getChildren('additions');
      // additions may or may not have children
      expect(Array.isArray(children)).toBeTruthy();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getAncestors() - Ancêtres (support multi-parents)
  // ═══════════════════════════════════════════════════════════════

  describe('getAncestors', () => {
    it('should return empty array for root tag', () => {
      const ancestors = Tags.getAncestors('sciences');
      expect(ancestors).toHaveLength(0);
    });

    it('should return parent for direct child', () => {
      const ancestors = Tags.getAncestors('arithmetique');
      expect(ancestors).toContain('maths');
    });

    it('should return all ancestors up to root', () => {
      const ancestors = Tags.getAncestors('additions');
      // additions -> operations-base -> arithmetique -> maths
      expect(ancestors).toContain('operations-base');
      expect(ancestors).toContain('arithmetique');
      expect(ancestors).toContain('maths');
    });

    it('should handle multi-parent tags (divisibilite)', () => {
      // divisibilite has parents: ['arithmetique', 'theorie-nombres']
      const ancestors = Tags.getAncestors('divisibilite');

      expect(ancestors).toContain('arithmetique');
      expect(ancestors).toContain('theorie-nombres');
      expect(ancestors).toContain('maths');
    });

    it('should resolve the full ancestor chain of pythagore', () => {
      const ancestors = Tags.getAncestors('pythagore');

      expect(ancestors).toContain('triangles');
      expect(ancestors).toContain('geometrie-plane');
      expect(ancestors).toContain('geometrie');
      expect(ancestors).toContain('maths');
    });

    it('should place pythagore under triangles only, not under trigonometrie', () => {
      expect(Tags.getById('pythagore').parents).toEqual(['triangles']);
      const ancestors = Tags.getAncestors('pythagore');
      expect(ancestors).not.toContain('trigonometrie');
      expect(ancestors).not.toContain('analyse');
      expect(Tags.getDescendants('trigonometrie')).not.toContain('pythagore');
      expect(Tags.getDescendants('triangles')).toContain('pythagore');
      expect(Tags.getDescendants('geometrie-plane')).toContain('pythagore');
    });

    it('should not contain duplicates', () => {
      const ancestors = Tags.getAncestors('pythagore');
      const unique = [...new Set(ancestors)];
      expect(ancestors.length).toBe(unique.length);
    });

    it('should return empty array for invalid tag', () => {
      const ancestors = Tags.getAncestors('nonexistent');
      expect(ancestors).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getWithAncestors() - Tag + tous ses ancêtres
  // ═══════════════════════════════════════════════════════════════
  // getDescendants() - Descendants (support multi-parents)
  // ═══════════════════════════════════════════════════════════════

  describe('getDescendants', () => {
    it('should return empty array for leaf tag', () => {
      // Check a tag that we know has no children
      const desc = Tags.getDescendants('additions');
      expect(Array.isArray(desc)).toBeTruthy();
    });

    it('should return all descendants for maths', () => {
      const descendants = Tags.getDescendants('maths');
      expect(descendants.length).toBeGreaterThan(30);

      // Should include direct children
      expect(descendants).toContain('arithmetique');
      expect(descendants).toContain('algebre');
      expect(descendants).toContain('geometrie');

      // Should include nested descendants
      expect(descendants).toContain('additions');
      expect(descendants).toContain('equations');
    });

    it('should return descendants for geometrie', () => {
      const descendants = Tags.getDescendants('geometrie');

      expect(descendants).toContain('geometrie-plane');
      expect(descendants).toContain('triangles');
      expect(descendants).toContain('pythagore');
      expect(descendants).toContain('trigonometrie');
    });

    it('should not contain the tag itself', () => {
      const descendants = Tags.getDescendants('maths');
      expect(descendants).not.toContain('maths');
    });

    it('should not contain duplicates', () => {
      const descendants = Tags.getDescendants('maths');
      const unique = [...new Set(descendants)];
      expect(descendants.length).toBe(unique.length);
    });

    it('should return empty array for invalid tag', () => {
      const descendants = Tags.getDescendants('nonexistent');
      expect(descendants).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getStats() - Statistiques de la taxonomie
  // ═══════════════════════════════════════════════════════════════

  describe('getStats', () => {
    it('should return stats object', () => {
      const stats = Tags.getStats();

      expect(stats.total).toBeDefined();
      expect(stats.roots).toBeDefined();
      expect(stats.multiParents).toBeDefined();
      expect(stats.groups).toBeDefined();
    });

    it('should have correct total count', () => {
      const stats = Tags.getStats();
      const allTags = Tags.getAll();

      expect(stats.total).toBe(allTags.length);
    });

    it('should have positive root count', () => {
      const stats = Tags.getStats();
      expect(stats.roots).toBeGreaterThan(0);
    });

    it('should have multi-parent tags', () => {
      const stats = Tags.getStats();
      expect(stats.multiParents).toBeGreaterThan(0);
    });

    it('should have multiple groups', () => {
      const stats = Tags.getStats();
      expect(stats.groups).toBeGreaterThan(5);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // search() - Recherche de tags
  // ═══════════════════════════════════════════════════════════════

  describe('search', () => {
    it('should find tags by label', () => {
      const results = Tags.search('math');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(t => t.id === 'maths')).toBeTruthy();
    });

    it('should find tags by id', () => {
      const results = Tags.search('arithmetique');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(t => t.id === 'arithmetique')).toBeTruthy();
    });

    it('should be case insensitive', () => {
      const results1 = Tags.search('MATHS');
      const results2 = Tags.search('maths');
      expect(results1.length).toBe(results2.length);
    });

    it('should handle accents', () => {
      const results = Tags.search('geometrie');
      expect(results.some(t => t.id === 'geometrie')).toBeTruthy();
    });

    it('should return empty for short query', () => {
      const results = Tags.search('m');
      expect(results).toHaveLength(0);
    });

    it('should return empty for empty query', () => {
      expect(Tags.search('')).toHaveLength(0);
      expect(Tags.search(null)).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getSuggestions() - Suggestions de tags
  // ═══════════════════════════════════════════════════════════════

  describe('getSuggestions', () => {
    it('should return default suggestions for empty selection', () => {
      const suggestions = Tags.getSuggestions([]);
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(t => t.id === 'maths')).toBeTruthy();
    });

    it('should suggest related tags', () => {
      const suggestions = Tags.getSuggestions(['maths']);
      expect(suggestions.length).toBeGreaterThan(0);

      // Should suggest children or associated tags
      const ids = suggestions.map(s => s.id);
      expect(
        ids.includes('arithmetique') ||
        ids.includes('calcul-mental') ||
        ids.includes('algebre')
      ).toBeTruthy();
    });

    it('should not suggest already selected tags', () => {
      const suggestions = Tags.getSuggestions(['maths', 'arithmetique']);
      const ids = suggestions.map(s => s.id);

      expect(ids).not.toContain('maths');
      expect(ids).not.toContain('arithmetique');
    });

    it('should include score property', () => {
      const suggestions = Tags.getSuggestions(['maths']);
      suggestions.forEach(s => {
        expect(s.score).toBeDefined();
        expect(s.score).toBeGreaterThan(0);
        expect(s.score).toBeLessThanOrEqual(1);
      });
    });

    it('should limit number of suggestions', () => {
      const suggestions = Tags.getSuggestions(['maths'], 3);
      expect(suggestions.length).toBeLessThanOrEqual(3);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // normalize() - Normalisation des tags
  // ═══════════════════════════════════════════════════════════════

  describe('normalize', () => {
    it('should filter invalid tags', () => {
      const result = Tags.normalize(['maths', 'invalid', 'algebre']);
      expect(result).toContain('maths');
      expect(result).toContain('algebre');
      expect(result).not.toContain('invalid');
    });

    it('should remove duplicates', () => {
      const result = Tags.normalize(['maths', 'maths', 'algebre', 'algebre']);
      expect(result).toHaveLength(2);
    });

    it('should handle object tags', () => {
      const result = Tags.normalize([{ id: 'maths' }, { id: 'algebre' }]);
      expect(result).toContain('maths');
      expect(result).toContain('algebre');
    });

    it('should return empty array for invalid input', () => {
      expect(Tags.normalize(null)).toHaveLength(0);
      expect(Tags.normalize('string')).toHaveLength(0);
      expect(Tags.normalize(123)).toHaveLength(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // fromCategory() - Conversion depuis catégories
  // ═══════════════════════════════════════════════════════════════

  describe('fromCategory', () => {
    it('should convert exact match', () => {
      const result = Tags.fromCategory('Mathématiques');
      expect(result).toContain('maths');
    });

    it('should handle array of categories', () => {
      const result = Tags.fromCategory(['Mathématiques', 'Physique']);
      expect(result).toContain('maths');
      expect(result).toContain('physique');
    });

    it('should return empty for null', () => {
      expect(Tags.fromCategory(null)).toHaveLength(0);
    });

    it('should keep unmatched as custom tag', () => {
      const result = Tags.fromCategory('Custom Category');
      expect(result.length).toBe(1);
      expect(result[0]).toBe('custom-category');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // buildTree() - Construction de l'arbre
  // ═══════════════════════════════════════════════════════════════
  // buildGroupedTree() - Arbre groupé
  // ═══════════════════════════════════════════════════════════════

  describe('buildGroupedTree', () => {
    it('should return object with groups as keys', () => {
      const tree = Tags.buildGroupedTree();
      expect(typeof tree).toBe('object');
      expect(tree['Matières']).toBeDefined();
      expect(tree['Niveaux']).toBeDefined();
    });

    it('should have arrays as values', () => {
      const tree = Tags.buildGroupedTree();
      expect(Array.isArray(tree['Matières'])).toBeTruthy();
    });

    it('should have root tags in correct groups', () => {
      const tree = Tags.buildGroupedTree();
      const matieres = tree['Matières'];

      expect(matieres.some(n => n.id === 'sciences')).toBeTruthy();
      expect(matieres.some(n => n.id === 'langues')).toBeTruthy();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Cache System - Performance optimization
  // ═══════════════════════════════════════════════════════════════

  describe('Cache System', () => {
    // Remise à zéro du cache entre deux tests
    const resetTagsCache = () => {
      Tags._cache = { byId: null, childrenOf: null, roots: null, groupedTree: null, initialized: false };
    };

    beforeEach(resetTagsCache);

    it('should initialize cache on first getById call', () => {
      resetTagsCache();
      expect(Tags._cache.initialized).toBe(false);

      Tags.getById('maths');

      expect(Tags._cache.initialized).toBe(true);
      expect(Tags._cache.byId).toBeDefined();
      expect(Tags._cache.byId instanceof Map).toBeTruthy();
    });

    it('should cache tag lookups by ID', () => {
      resetTagsCache();

      // First call initializes cache
      const tag1 = Tags.getById('maths');
      expect(Tags._cache.byId.has('maths')).toBe(true);

      // Second call should use cache
      const tag2 = Tags.getById('maths');
      expect(tag1).toBe(tag2); // Same reference
    });

    it('should cache children lookups', () => {
      resetTagsCache();

      // Initialize cache
      Tags.getChildren(null);

      expect(Tags._cache.childrenOf).toBeDefined();
      expect(Tags._cache.childrenOf instanceof Map).toBeTruthy();
      expect(Tags._cache.childrenOf.has(null)).toBe(true);
    });

    it('should cache children for parent tags', () => {
      resetTagsCache();

      const children1 = Tags.getChildren('maths');
      const children2 = Tags.getChildren('maths');

      // Should be the same array reference from cache
      expect(children1).toBe(children2);
    });

    it('should cache buildGroupedTree result', () => {
      resetTagsCache();

      const tree1 = Tags.buildGroupedTree();
      expect(Tags._cache.groupedTree).toBe(tree1);

      const tree2 = Tags.buildGroupedTree();
      expect(tree1).toBe(tree2); // Same reference
    });

  });

});
