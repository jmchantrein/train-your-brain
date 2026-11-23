/**
 * Tests pour TagsTaxonomy
 *
 * Ce module contient les données de taxonomie.
 * Les tests vérifient l'intégrité et la cohérence des données.
 */

describe('TagsTaxonomy', () => {
  // ═══════════════════════════════════════════════════════════════
  // STRUCTURE DE BASE
  // ═══════════════════════════════════════════════════════════════

  describe('TAXONOMY data structure', () => {
    it('should be an array', () => {
      expect(Array.isArray(TAXONOMY)).toBe(true);
    });

    it('should have at least 100 tags', () => {
      expect(TAXONOMY.length).toBeGreaterThan(100);
    });

    it('should have unique IDs', () => {
      const ids = TAXONOMY.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // STRUCTURE DES TAGS
  // ═══════════════════════════════════════════════════════════════

  describe('Tag structure', () => {
    it('each tag should have required fields', () => {
      TAXONOMY.forEach(tag => {
        expect(tag.id).toBeDefined();
        expect(typeof tag.id).toBe('string');
        expect(tag.id.length).toBeGreaterThan(0);

        expect(tag.label).toBeDefined();
        expect(typeof tag.label).toBe('string');

        expect(tag.icon).toBeDefined();
        expect(typeof tag.icon).toBe('string');

        expect(tag.group).toBeDefined();
        expect(typeof tag.group).toBe('string');

        expect(tag.parents).toBeDefined();
        expect(Array.isArray(tag.parents)).toBe(true);
      });
    });

    it('parent references should be valid tag IDs', () => {
      const allIds = new Set(TAXONOMY.map(t => t.id));

      TAXONOMY.forEach(tag => {
        tag.parents.forEach(parentId => {
          expect(allIds.has(parentId)).toBe(true);
        });
      });
    });

    it('should have no circular references (self-parent)', () => {
      TAXONOMY.forEach(tag => {
        expect(tag.parents.includes(tag.id)).toBe(false);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // CATÉGORIES RACINES
  // ═══════════════════════════════════════════════════════════════

  describe('Root categories', () => {
    it('should have root tags with empty parents', () => {
      const roots = TAXONOMY.filter(t => t.parents.length === 0);
      expect(roots.length).toBeGreaterThan(0);
    });

    it('should include main subject roots', () => {
      const ids = TAXONOMY.map(t => t.id);
      expect(ids).toContain('sciences');
      expect(ids).toContain('langues');
      expect(ids).toContain('arts');
    });

    it('should include level roots', () => {
      const ids = TAXONOMY.map(t => t.id);
      expect(ids).toContain('primaire');
      expect(ids).toContain('college');
      expect(ids).toContain('lycee');
      expect(ids).toContain('superieur');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // MATHÉMATIQUES
  // ═══════════════════════════════════════════════════════════════

  describe('Mathematics taxonomy', () => {
    it('should have maths as child of sciences', () => {
      const maths = TAXONOMY.find(t => t.id === 'maths');
      expect(maths).toBeDefined();
      expect(maths.parents).toContain('sciences');
    });

    it('should have arithmetic operations', () => {
      const ids = TAXONOMY.map(t => t.id);
      expect(ids).toContain('additions');
      expect(ids).toContain('soustractions');
      expect(ids).toContain('multiplications');
      expect(ids).toContain('divisions');
    });

    it('should have geometry subtopics', () => {
      const ids = TAXONOMY.map(t => t.id);
      expect(ids).toContain('triangles');
      expect(ids).toContain('cercles');
      expect(ids).toContain('pythagore');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // LANGUES
  // ═══════════════════════════════════════════════════════════════

  describe('Languages taxonomy', () => {
    it('should have language categories', () => {
      const ids = TAXONOMY.map(t => t.id);
      expect(ids).toContain('francais');
      expect(ids).toContain('anglais');
    });

    it('should have grammar and vocabulary', () => {
      const ids = TAXONOMY.map(t => t.id);
      // Les tags génériques 'grammaire'/'vocabulaire' ont été remplacés par des tags par langue
      expect(ids).toContain('fr-grammaire');
      expect(ids).toContain('fr-vocabulaire');
      expect(ids).toContain('en-grammar');
      expect(ids).toContain('en-vocabulary');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // NIVEAUX SCOLAIRES
  // ═══════════════════════════════════════════════════════════════

  describe('School levels', () => {
    it('should have French grade levels', () => {
      const ids = TAXONOMY.map(t => t.id);
      expect(ids).toContain('cp');
      expect(ids).toContain('ce1');
      expect(ids).toContain('ce2');
      expect(ids).toContain('cm1');
      expect(ids).toContain('cm2');
      expect(ids).toContain('sixieme');
      expect(ids).toContain('terminale');
    });

    it('should have equivalents for international levels', () => {
      const cp = TAXONOMY.find(t => t.id === 'cp');
      expect(cp).toBeDefined();
      expect(cp.equivalents).toBeDefined();
      expect(cp.equivalents.en).toBeDefined();
      expect(cp.equivalents.uk).toBeDefined();
    });

    it('primaire children should reference primaire as parent', () => {
      const primaryLevels = ['cp', 'ce1', 'ce2', 'cm1', 'cm2'];
      primaryLevels.forEach(level => {
        const tag = TAXONOMY.find(t => t.id === level);
        expect(tag).toBeDefined();
        expect(tag.parents).toContain('primaire');
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GROUPES
  // ═══════════════════════════════════════════════════════════════

  describe('Groups', () => {
    it('should have tags in various groups', () => {
      const groups = new Set(TAXONOMY.map(t => t.group));

      expect(groups.has('Matières')).toBe(true);
      expect(groups.has('Niveaux')).toBe(true);
      expect(groups.has('Mathématiques')).toBe(true);
    });

    it('all tags should have a group', () => {
      TAXONOMY.forEach(tag => {
        expect(tag.group).toBeTruthy();
        expect(tag.group.length).toBeGreaterThan(0);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // MULTI-PARENTS
  // ═══════════════════════════════════════════════════════════════

  describe('Multi-parent support', () => {
    it('some tags should have multiple parents', () => {
      const multiParentTags = TAXONOMY.filter(t => t.parents.length > 1);
      expect(multiParentTags.length).toBeGreaterThan(0);
    });

    it('vecteurs should be child of both algebre-lineaire and geometrie', () => {
      const vecteurs = TAXONOMY.find(t => t.id === 'vecteurs');
      expect(vecteurs).toBeDefined();
      expect(vecteurs.parents).toContain('algebre-lineaire');
      expect(vecteurs.parents).toContain('geometrie');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // ICONS
  // ═══════════════════════════════════════════════════════════════

  describe('Icons', () => {
    it('all tags should have icons', () => {
      TAXONOMY.forEach(tag => {
        expect(tag.icon).toBeDefined();
        expect(tag.icon.length).toBeGreaterThan(0);
      });
    });

    it('icons should be emoji or symbols', () => {
      // Une icône = 1 symbole (graphème). Les emoji composés (séquences ZWJ,
      // ex. 👨‍💻) dépassent 4 unités UTF-16 mais restent un seul graphème.
      const segmenter = new Intl.Segmenter();
      TAXONOMY.forEach(tag => {
        expect([...segmenter.segment(tag.icon)].length).toBeLessThanOrEqual(2);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // HIERARCHY DEPTH
  // ═══════════════════════════════════════════════════════════════

  describe('Hierarchy', () => {
    function getDepth(tagId, visited = new Set()) {
      if (visited.has(tagId)) return 0; // Prevent infinite loop
      visited.add(tagId);

      const tag = TAXONOMY.find(t => t.id === tagId);
      if (!tag || tag.parents.length === 0) return 0;

      const parentDepths = tag.parents.map(p => getDepth(p, visited));
      return 1 + Math.max(...parentDepths);
    }

    it('should have tags at various depths', () => {
      const depths = TAXONOMY.map(t => getDepth(t.id));
      const maxDepth = Math.max(...depths);

      expect(maxDepth).toBeGreaterThanOrEqual(3); // At least 4 levels deep
    });

    it('operations-base should be at depth 3', () => {
      // sciences -> maths -> arithmetique -> operations-base
      const depth = getDepth('operations-base');
      expect(depth).toBe(3);
    });
  });
});
