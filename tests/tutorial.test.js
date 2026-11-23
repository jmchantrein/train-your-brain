/**
 * Tests pour le module Tutorial et LeitnerExplanation
 *
 * @requires ../src/ui/tutorial.js
 */

describe('Tutorial - Module', () => {
  describe('Structure des étapes', () => {
    it('should have steps array defined', () => {
      expect(Tutorial.steps).toBeDefined();
      expect(Array.isArray(Tutorial.steps)).toBe(true);
    });

    it('should have at least 5 steps', () => {
      expect(Tutorial.steps.length).toBeGreaterThanOrEqual(5);
    });

    it('should have valid step structure', () => {
      Tutorial.steps.forEach((step, index) => {
        expect(step.id).toBeDefined();
        expect(step.title).toBeDefined();
        expect(step.content).toBeDefined();
        expect(step.emoji).toBeDefined();
        expect(step.illustration).toBeDefined();
      });
    });

    it('should have unique step IDs', () => {
      const ids = Tutorial.steps.map(s => s.id);
      const uniqueIds = [...new Set(ids)];
      expect(uniqueIds.length).toBe(ids.length);
    });

    it('should start with welcome step', () => {
      expect(Tutorial.steps[0].id).toBe('welcome');
    });

    it('should end with ready step', () => {
      expect(Tutorial.steps[Tutorial.steps.length - 1].id).toBe('ready');
    });

    it('should have expected steps in correct order', () => {
      const expectedSteps = ['welcome', 'leitner', 'boxes', 'gameplay', 'xp', 'badges', 'navigation', 'ready'];
      const actualSteps = Tutorial.steps.map(s => s.id);
      expect(actualSteps).toEqual(expectedSteps);
    });
  });

  describe('shouldShow()', () => {
    it('should return false for null player', () => {
      expect(Tutorial.shouldShow(null)).toBe(false);
    });

    it('should return false for undefined player', () => {
      expect(Tutorial.shouldShow(undefined)).toBe(false);
    });

    it('should return true for new player without settings', () => {
      const player = { id: 'test_1', name: 'Test' };
      expect(Tutorial.shouldShow(player)).toBe(true);
    });

    it('should return true for player with empty settings', () => {
      const player = { id: 'test_2', name: 'Test', settings: {} };
      expect(Tutorial.shouldShow(player)).toBe(true);
    });

    it('should return true for player with tutorialCompleted = false', () => {
      const player = { id: 'test_3', name: 'Test', settings: { tutorialCompleted: false } };
      expect(Tutorial.shouldShow(player)).toBe(true);
    });

    it('should return false for player with tutorialCompleted = true', () => {
      const player = { id: 'test_4', name: 'Test', settings: { tutorialCompleted: true } };
      expect(Tutorial.shouldShow(player)).toBe(false);
    });
  });

  describe('State management', () => {
    beforeEach(() => {
      // Reset Tutorial state
      Tutorial.currentStep = 0;
      Tutorial.isOpen = false;
      Tutorial.overlay = null;
      Tutorial.onCompleteCallback = null;
    });

    it('should have initial state correctly set', () => {
      expect(Tutorial.currentStep).toBe(0);
      expect(Tutorial.isOpen).toBe(false);
      expect(Tutorial.overlay).toBeNull();
    });

    it('should track currentStep within bounds', () => {
      Tutorial.currentStep = 0;
      expect(Tutorial.currentStep).toBe(0);

      Tutorial.currentStep = Tutorial.steps.length - 1;
      expect(Tutorial.currentStep).toBe(Tutorial.steps.length - 1);
    });
  });

  describe('goToStep()', () => {
    beforeEach(() => {
      Tutorial.currentStep = 0;
      Tutorial.isOpen = true;
      // Mock overlay to prevent DOM errors
      Tutorial.overlay = document.createElement('div');
      Tutorial._bindEvents = () => {}; // Mock binding
    });

    afterEach(() => {
      Tutorial.isOpen = false;
      Tutorial.overlay = null;
    });

    it('should go to valid step index', () => {
      Tutorial.goToStep(3);
      expect(Tutorial.currentStep).toBe(3);
    });

    it('should go to first step with index 0', () => {
      Tutorial.currentStep = 5;
      Tutorial.goToStep(0);
      expect(Tutorial.currentStep).toBe(0);
    });

    it('should go to last step with last index', () => {
      const lastIndex = Tutorial.steps.length - 1;
      Tutorial.goToStep(lastIndex);
      expect(Tutorial.currentStep).toBe(lastIndex);
    });

    it('should not change step for negative index', () => {
      Tutorial.currentStep = 3;
      Tutorial.goToStep(-1);
      expect(Tutorial.currentStep).toBe(3);
    });

    it('should not change step for index >= steps.length', () => {
      Tutorial.currentStep = 3;
      Tutorial.goToStep(Tutorial.steps.length);
      expect(Tutorial.currentStep).toBe(3);
    });

    it('should not change step for very large index', () => {
      Tutorial.currentStep = 2;
      Tutorial.goToStep(999);
      expect(Tutorial.currentStep).toBe(2);
    });
  });

  describe('Navigation logic', () => {
    beforeEach(() => {
      Tutorial.currentStep = 0;
      Tutorial.isOpen = true;
      Tutorial.overlay = document.createElement('div');
      Tutorial._bindEvents = () => {};
    });

    afterEach(() => {
      Tutorial.isOpen = false;
      Tutorial.overlay = null;
    });

    it('next() should increment currentStep', () => {
      Tutorial.currentStep = 0;
      Tutorial.next();
      expect(Tutorial.currentStep).toBe(1);
    });

    it('next() should not exceed last step', () => {
      Tutorial.currentStep = Tutorial.steps.length - 1;
      // Mock close to prevent side effects
      const originalClose = Tutorial.close;
      let closeCalled = false;
      Tutorial.close = () => { closeCalled = true; };

      Tutorial.next();

      // Should call close when at last step
      expect(closeCalled).toBe(true);
      Tutorial.close = originalClose;
    });

    it('prev() should decrement currentStep', () => {
      Tutorial.currentStep = 3;
      Tutorial.prev();
      expect(Tutorial.currentStep).toBe(2);
    });

    it('prev() should not go below 0', () => {
      Tutorial.currentStep = 0;
      Tutorial.prev();
      expect(Tutorial.currentStep).toBe(0);
    });

    it('should navigate through all steps', () => {
      Tutorial.currentStep = 0;

      // Go forward through all steps
      for (let i = 0; i < Tutorial.steps.length - 1; i++) {
        Tutorial.next();
      }

      expect(Tutorial.currentStep).toBe(Tutorial.steps.length - 1);
    });
  });

  describe('_renderIllustration()', () => {
    it('should return HTML for welcome illustration', () => {
      const html = Tutorial._renderIllustration('welcome');
      expect(html).toContain('tutorial-illust--welcome');
      expect(html).toContain('tutorial-illust__brain');
    });

    it('should return HTML for leitner illustration', () => {
      const html = Tutorial._renderIllustration('leitner');
      expect(html).toContain('tutorial-illust--leitner');
      expect(html).toContain('tutorial-illust__flow');
    });

    it('should return HTML for boxes illustration', () => {
      const html = Tutorial._renderIllustration('boxes');
      expect(html).toContain('tutorial-illust--leitner');
    });

    it('should return HTML for gameplay illustration', () => {
      const html = Tutorial._renderIllustration('gameplay');
      expect(html).toContain('tutorial-illust--gameplay');
      expect(html).toContain('tutorial-illust__card');
    });

    it('should return HTML for xp illustration', () => {
      const html = Tutorial._renderIllustration('xp');
      expect(html).toContain('tutorial-illust--xp');
      expect(html).toContain('tutorial-illust__xp-badge');
    });

    it('should return HTML for badges illustration', () => {
      const html = Tutorial._renderIllustration('badges');
      expect(html).toContain('tutorial-illust--badges');
    });

    it('should return HTML for navigation illustration', () => {
      const html = Tutorial._renderIllustration('navigation');
      expect(html).toContain('tutorial-illust--nav');
      expect(html).toContain('tutorial-illust__navbar');
    });

    it('should return HTML for ready illustration', () => {
      const html = Tutorial._renderIllustration('ready');
      expect(html).toContain('tutorial-illust--ready');
      expect(html).toContain('tutorial-illust__rocket');
    });

    it('should return empty string for unknown illustration', () => {
      const html = Tutorial._renderIllustration('unknown');
      expect(html).toBe('');
    });

    it('should return empty string for null', () => {
      const html = Tutorial._renderIllustration(null);
      expect(html).toBe('');
    });
  });
});

describe('LeitnerExplanation - Component', () => {
  describe('render()', () => {
    it('should return HTML string', () => {
      const html = LeitnerExplanation.render();
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
    });

    it('should include leitner-explanation class', () => {
      const html = LeitnerExplanation.render();
      expect(html).toContain('leitner-explanation');
    });

    it('should include all 4 boxes', () => {
      const html = LeitnerExplanation.render();
      expect(html).toContain('box-card--new');
      expect(html).toContain('box-card--purple');
      expect(html).toContain('box-card--orange');
      expect(html).toContain('box-card--green');
    });

    it('should include box descriptions', () => {
      const html = LeitnerExplanation.render();
      expect(html).toContain('Nouvelles');
      expect(html).toContain('Violette');
      expect(html).toContain('Orange');
      expect(html).toContain('Verte');
    });

    it('should include rules section', () => {
      const html = LeitnerExplanation.render();
      expect(html).toContain('leitner-explanation__rules');
      expect(html).toContain('Bonne réponse rapide');
      expect(html).toContain('Bonne réponse lente');
      expect(html).toContain('Réponse incorrecte');
    });

    it('should include title', () => {
      const html = LeitnerExplanation.render();
      expect(html).toContain('leitner-explanation__title');
      expect(html).toContain('Comment fonctionne le système Leitner');
    });
  });

  describe('render() with compact option', () => {
    it('should return compact HTML when compact = true', () => {
      const html = LeitnerExplanation.render({ compact: true });
      expect(html).toContain('leitner-explanation--compact');
    });

    it('should not include full description in compact mode', () => {
      const html = LeitnerExplanation.render({ compact: true });
      expect(html).not.toContain('leitner-explanation__rules');
      expect(html).not.toContain('leitner-explanation__title');
    });

    it('should include all box emojis in compact mode', () => {
      const html = LeitnerExplanation.render({ compact: true });
      expect(html).toContain('box--new');
      expect(html).toContain('box--purple');
      expect(html).toContain('box--orange');
      expect(html).toContain('box--green');
    });

    it('should have title attributes in compact mode', () => {
      const html = LeitnerExplanation.render({ compact: true });
      expect(html).toContain('title="Nouvelles"');
      expect(html).toContain('title="Maîtrisées"');
    });
  });

  describe('render() with default options', () => {
    it('should default to non-compact mode', () => {
      const html = LeitnerExplanation.render();
      expect(html).not.toContain('leitner-explanation--compact');
    });

    it('should handle empty options object', () => {
      const html = LeitnerExplanation.render({});
      expect(html).not.toContain('leitner-explanation--compact');
    });
  });

  describe('mount()', () => {
    it('should populate container with rendered HTML', () => {
      const container = document.createElement('div');
      LeitnerExplanation.mount(container);

      expect(container.innerHTML).toContain('leitner-explanation');
    });

    it('should apply compact option when passed', () => {
      const container = document.createElement('div');
      LeitnerExplanation.mount(container, { compact: true });

      expect(container.innerHTML).toContain('leitner-explanation--compact');
    });

    it('should replace existing content', () => {
      const container = document.createElement('div');
      container.innerHTML = '<p>Old content</p>';

      LeitnerExplanation.mount(container);

      expect(container.innerHTML).not.toContain('Old content');
      expect(container.innerHTML).toContain('leitner-explanation');
    });
  });
});
