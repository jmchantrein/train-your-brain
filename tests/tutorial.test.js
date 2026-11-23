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

// ═══════════════════════════════════════════════════════════════
// Fenêtre réelle : transitions entre cartes, clavier, focus, annonces
// ═══════════════════════════════════════════════════════════════

describe('Tutorial - Fenêtre et transitions', () => {
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const q = (sel) => Tutorial.overlay.querySelector(sel);
  const key = (k, opts = {}) => {
    const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...opts });
    (document.activeElement || document.body).dispatchEvent(e);
    return e;
  };
  let announced;
  let originalAnnounce;

  beforeEach(() => {
    // Fermer proprement un tutoriel resté ouvert et retirer les fenêtres orphelines
    if (Tutorial.isOpen) Tutorial.close(false);
    document.querySelectorAll('.tutorial-overlay').forEach(el => el.remove());
    Tutorial.isOpen = false;
    Tutorial.overlay = null;
    announced = [];
    originalAnnounce = A11y.announce;
    A11y.announce = (msg) => { announced.push(msg); };
    Tutorial.start(null, true);
  });

  afterEach(() => {
    if (Tutorial.isOpen) Tutorial.close(false);
    document.querySelectorAll('.tutorial-overlay').forEach(el => el.remove());
    A11y.announce = originalAnnounce;
  });

  it('garde la même fenêtre et les mêmes boutons d\'une carte à l\'autre', () => {
    const modal = q('.tutorial-modal');
    const next = q('[data-action="next"]');
    const prev = q('[data-action="prev"]');
    Tutorial.next();
    Tutorial.next();
    Tutorial.prev();
    expect(q('.tutorial-modal') === modal).toBe(true);
    expect(q('[data-action="next"]') === next).toBe(true);
    expect(q('[data-action="prev"]') === prev).toBe(true);
    expect(document.querySelectorAll('.tutorial-modal').length).toBe(1);
  });

  it('rend une carte par étape, seule la carte courante est exposée', () => {
    const panels = Tutorial.overlay.querySelectorAll('[data-step-panel]');
    expect(panels.length).toBe(Tutorial.steps.length);
    Tutorial.goToStep(2);
    panels.forEach((panel, i) => {
      const active = i === 2;
      expect(panel.classList.contains('tutorial-modal__step--active')).toBe(active);
      expect(panel.hasAttribute('inert')).toBe(!active);
      expect(panel.getAttribute('aria-hidden')).toBe(active ? null : 'true');
    });
  });

  it('nomme la fenêtre par le titre de la carte courante', () => {
    Tutorial.goToStep(3);
    const labelId = Tutorial.overlay.getAttribute('aria-labelledby');
    const title = document.getElementById(labelId);
    expect(title).toBeTruthy();
    expect(title.textContent.trim()).toBe(Tutorial.steps[3].title);
  });

  it('garde la place du bouton Précédent sur la première carte', () => {
    const prev = q('[data-action="prev"]');
    expect(prev).toBeTruthy();
    expect(prev.disabled).toBe(true);
    expect(prev.getAttribute('aria-hidden')).toBe('true');
    Tutorial.next();
    expect(prev.disabled).toBe(false);
    expect(prev.hasAttribute('aria-hidden')).toBe(false);
  });

  it('change le libellé des boutons sur la dernière carte', () => {
    expect(q('[data-action="next"]').textContent.trim()).toBe('Suivant →');
    expect(q('[data-action="skip"]').textContent.trim()).toBe('Passer');
    Tutorial.goToStep(Tutorial.steps.length - 1);
    expect(q('[data-action="next"]').textContent.trim()).toBe('Commencer !');
    expect(q('[data-action="skip"]').textContent.trim()).toBe('Fermer');
    Tutorial.prev();
    expect(q('[data-action="next"]').textContent.trim()).toBe('Suivant →');
  });

  it('met à jour l\'indicateur de progression', () => {
    Tutorial.goToStep(2);
    const dots = Tutorial.overlay.querySelectorAll('[data-step]');
    dots.forEach((dot, i) => {
      expect(dot.getAttribute('aria-current')).toBe(i === 2 ? 'step' : null);
      expect(dot.classList.contains('tutorial-modal__dot--completed')).toBe(i < 2);
    });
    expect(q('.tutorial-modal__step-counter').textContent.trim()).toBe(`3 / ${Tutorial.steps.length}`);
    dots[5].click();
    expect(Tutorial.currentStep).toBe(5);
  });

  it('avance d\'une carte par clic, même avec des clics rapides', () => {
    const next = q('[data-action="next"]');
    next.click();
    next.click();
    next.click();
    expect(Tutorial.currentStep).toBe(3);
    q('[data-action="prev"]').click();
    expect(Tutorial.currentStep).toBe(2);
  });

  it('navigue aux flèches sans fermer à la dernière carte', () => {
    key('ArrowRight');
    expect(Tutorial.currentStep).toBe(1);
    key('ArrowLeft');
    expect(Tutorial.currentStep).toBe(0);
    Tutorial.goToStep(Tutorial.steps.length - 1);
    key('ArrowRight');
    expect(Tutorial.isOpen).toBe(true);
    expect(Tutorial.currentStep).toBe(Tutorial.steps.length - 1);
  });

  it('laisse Entrée activer le bouton qui a le focus', () => {
    Tutorial.goToStep(2);
    q('[data-action="prev"]').focus();
    key('Enter');
    // Le gestionnaire global ne doit pas avancer : c'est le bouton Précédent qui a le focus
    expect(Tutorial.currentStep).toBe(2);
  });

  it('ferme avec Échap sans marquer le tutoriel comme terminé', () => {
    let completedArg = null;
    Tutorial.onCompleteCallback = (c) => { completedArg = c; };
    key('Escape');
    expect(Tutorial.isOpen).toBe(false);
    expect(completedArg).toBe(false);
  });

  it('termine le tutoriel par le bouton de la dernière carte', () => {
    let completedArg = null;
    Tutorial.onCompleteCallback = (c) => { completedArg = c; };
    Tutorial.goToStep(Tutorial.steps.length - 1);
    q('[data-action="next"]').click();
    expect(Tutorial.isOpen).toBe(false);
    expect(completedArg).toBe(true);
  });

  it('place le focus sur Suivant à l\'ouverture et le garde en avançant', () => {
    const next = q('[data-action="next"]');
    expect(document.activeElement === next).toBe(true);
    next.click();
    expect(document.activeElement === next).toBe(true);
  });

  it('remet le focus sur Suivant quand Précédent disparaît', () => {
    Tutorial.goToStep(1);
    q('[data-action="prev"]').focus();
    q('[data-action="prev"]').click();
    expect(Tutorial.currentStep).toBe(0);
    expect(document.activeElement === q('[data-action="next"]')).toBe(true);
  });

  it('garde le focus dans la fenêtre (Tab et Maj+Tab)', () => {
    const close = q('[data-action="close"]');
    const next = q('[data-action="next"]');
    next.focus();
    const e1 = key('Tab');
    expect(e1.defaultPrevented).toBe(true);
    expect(document.activeElement === close).toBe(true);
    const e2 = key('Tab', { shiftKey: true });
    expect(e2.defaultPrevented).toBe(true);
    expect(document.activeElement === next).toBe(true);
  });

  it('rend le focus à l\'élément qui l\'avait avant l\'ouverture', () => {
    Tutorial.close(false);
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    Tutorial.start(null, true);
    expect(document.activeElement === opener).toBe(false);
    Tutorial.close(false);
    expect(document.activeElement === opener).toBe(true);
    opener.remove();
  });

  it('ne supprime pas une fenêtre rouverte pendant l\'animation de fermeture', async () => {
    Tutorial.close(false);
    Tutorial.start(null, true);
    const reopened = Tutorial.overlay;
    await wait(400);
    expect(reopened.isConnected).toBe(true);
    expect(Tutorial.isOpen).toBe(true);
  });

  it('annonce chaque carte une seule fois, même après des clics rapides', async () => {
    expect(announced.length).toBe(1); // ouverture
    const next = q('[data-action="next"]');
    next.click();
    next.click();
    next.click();
    await wait(450);
    expect(announced.length).toBe(2);
    expect(announced[1]).toContain(`4 sur ${Tutorial.steps.length}`);
    expect(announced[1]).toContain(Tutorial.steps[3].title);
  });

  it('n\'annonce rien après la fermeture', async () => {
    q('[data-action="next"]').click();
    Tutorial.close(false);
    await wait(450);
    expect(announced.length).toBe(1);
  });
});
