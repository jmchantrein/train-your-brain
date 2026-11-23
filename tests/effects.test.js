/**
 * Tests pour le module Effects (confettis, XP flottant, streak)
 *
 * @requires ../src/ui/effects.js
 */

describe('Effects - Module Structure', () => {
  it('should have Effects object defined', () => {
    expect(Effects).toBeDefined();
  });

  it('should have confetti submodule', () => {
    expect(Effects.confetti).toBeDefined();
  });

  it('should have floatingXP submodule', () => {
    expect(Effects.floatingXP).toBeDefined();
  });

  it('should have streak submodule', () => {
    expect(Effects.streak).toBeDefined();
  });
});

describe('Effects.confetti - Configuration', () => {
  it('should have config object', () => {
    expect(Effects.confetti.config).toBeDefined();
  });

  it('should have particleCount in config', () => {
    expect(Effects.confetti.config.particleCount).toBeDefined();
    expect(typeof Effects.confetti.config.particleCount).toBe('number');
    expect(Effects.confetti.config.particleCount).toBeGreaterThan(0);
  });

  it('should have gravity in config', () => {
    expect(Effects.confetti.config.gravity).toBeDefined();
    expect(typeof Effects.confetti.config.gravity).toBe('number');
  });

  it('should have friction in config', () => {
    expect(Effects.confetti.config.friction).toBeDefined();
    expect(Effects.confetti.config.friction).toBeGreaterThan(0);
    expect(Effects.confetti.config.friction).toBeLessThanOrEqual(1);
  });

  it('should have colors array with multiple colors', () => {
    expect(Array.isArray(Effects.confetti.config.colors)).toBe(true);
    expect(Effects.confetti.config.colors.length).toBeGreaterThanOrEqual(5);
  });

  it('should have valid hex colors', () => {
    const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
    Effects.confetti.config.colors.forEach(color => {
      expect(hexColorRegex.test(color)).toBe(true);
    });
  });

  it('should have shapes array', () => {
    expect(Array.isArray(Effects.confetti.config.shapes)).toBe(true);
    expect(Effects.confetti.config.shapes.length).toBeGreaterThan(0);
  });

  it('should include expected shapes', () => {
    expect(Effects.confetti.config.shapes).toContain('square');
    expect(Effects.confetti.config.shapes).toContain('circle');
    expect(Effects.confetti.config.shapes).toContain('triangle');
  });

  it('should have spread value', () => {
    expect(Effects.confetti.config.spread).toBeDefined();
    expect(typeof Effects.confetti.config.spread).toBe('number');
  });

  it('should have startVelocity', () => {
    expect(Effects.confetti.config.startVelocity).toBeDefined();
    expect(Effects.confetti.config.startVelocity).toBeGreaterThan(0);
  });

  it('should have decay value between 0 and 1', () => {
    expect(Effects.confetti.config.decay).toBeDefined();
    expect(Effects.confetti.config.decay).toBeGreaterThan(0);
    expect(Effects.confetti.config.decay).toBeLessThanOrEqual(1);
  });

  it('should have scalar value', () => {
    expect(Effects.confetti.config.scalar).toBeDefined();
    expect(typeof Effects.confetti.config.scalar).toBe('number');
  });
});

describe('Effects.confetti - State', () => {
  beforeEach(() => {
    // Reset confetti state
    Effects.confetti.stop();
    if (Effects.confetti.canvas) {
      Effects.confetti.destroy();
    }
  });

  afterEach(() => {
    Effects.confetti.destroy();
  });

  it('should have initial canvas as null', () => {
    expect(Effects.confetti.canvas).toBeNull();
  });

  it('should have initial ctx as null', () => {
    expect(Effects.confetti.ctx).toBeNull();
  });

  it('should have empty particles array initially', () => {
    expect(Array.isArray(Effects.confetti.particles)).toBe(true);
    expect(Effects.confetti.particles.length).toBe(0);
  });

  it('should have isRunning as false initially', () => {
    expect(Effects.confetti.isRunning).toBe(false);
  });
});

describe('Effects.confetti - Methods', () => {
  beforeEach(() => {
    Effects.confetti.stop();
    if (Effects.confetti.canvas) {
      Effects.confetti.destroy();
    }
  });

  afterEach(() => {
    Effects.confetti.destroy();
  });

  it('should have launch method', () => {
    expect(typeof Effects.confetti.launch).toBe('function');
  });

  it('should have burst method', () => {
    expect(typeof Effects.confetti.burst).toBe('function');
  });

  it('should have celebrateVictory method', () => {
    expect(typeof Effects.confetti.celebrateVictory).toBe('function');
  });

  it('should have stop method', () => {
    expect(typeof Effects.confetti.stop).toBe('function');
  });

  it('should have destroy method', () => {
    expect(typeof Effects.confetti.destroy).toBe('function');
  });

  it('launch() should create canvas element', () => {
    Effects.confetti.launch();
    expect(Effects.confetti.canvas).toBeDefined();
    expect(Effects.confetti.canvas).not.toBeNull();
  });

  it('launch() should set isRunning to true', () => {
    Effects.confetti.launch();
    expect(Effects.confetti.isRunning).toBe(true);
  });

  it('launch() should add particles', () => {
    Effects.confetti.launch({ particleCount: 10 });
    expect(Effects.confetti.particles.length).toBeGreaterThan(0);
  });

  it('launch() should accept custom options', () => {
    Effects.confetti.launch({ particleCount: 5 });
    // Should have at least some particles (may accumulate if called multiple times)
    expect(Effects.confetti.particles.length).toBeGreaterThanOrEqual(5);
  });

  it('stop() should set isRunning to false', () => {
    Effects.confetti.launch();
    Effects.confetti.stop();
    expect(Effects.confetti.isRunning).toBe(false);
  });

  it('stop() should clear particles array', () => {
    Effects.confetti.launch({ particleCount: 50 });
    Effects.confetti.stop();
    expect(Effects.confetti.particles.length).toBe(0);
  });

  it('destroy() should remove canvas', () => {
    Effects.confetti.launch();
    const canvas = Effects.confetti.canvas;
    expect(document.body.contains(canvas)).toBe(true);

    Effects.confetti.destroy();
    expect(Effects.confetti.canvas).toBeNull();
  });

  it('destroy() should also stop animation', () => {
    Effects.confetti.launch();
    Effects.confetti.destroy();
    expect(Effects.confetti.isRunning).toBe(false);
  });

  it('burst() should launch with specific origin', () => {
    Effects.confetti.burst(0.2, 0.8, { particleCount: 10 });
    expect(Effects.confetti.isRunning).toBe(true);
    expect(Effects.confetti.particles.length).toBeGreaterThan(0);
  });

  it('celebrateVictory() should launch confetti', () => {
    Effects.confetti.celebrateVictory();
    expect(Effects.confetti.isRunning).toBe(true);
  });
});

describe('Effects.confetti - Canvas Creation', () => {
  beforeEach(() => {
    Effects.confetti.destroy();
  });

  afterEach(() => {
    Effects.confetti.destroy();
  });

  it('should create canvas with correct ID', () => {
    Effects.confetti.launch();
    expect(Effects.confetti.canvas.id).toBe('confetti-canvas');
  });

  it('should create canvas with fixed positioning', () => {
    Effects.confetti.launch();
    expect(Effects.confetti.canvas.style.position).toBe('fixed');
  });

  it('should create canvas with pointer-events none', () => {
    Effects.confetti.launch();
    expect(Effects.confetti.canvas.style.pointerEvents).toBe('none');
  });

  it('should create canvas with high z-index', () => {
    Effects.confetti.launch();
    expect(parseInt(Effects.confetti.canvas.style.zIndex)).toBeGreaterThan(9999);
  });

  it('should set canvas dimensions to window size', () => {
    Effects.confetti.launch();
    expect(Effects.confetti.canvas.width).toBe(window.innerWidth);
    expect(Effects.confetti.canvas.height).toBe(window.innerHeight);
  });

  it('should create 2D context', () => {
    Effects.confetti.launch();
    expect(Effects.confetti.ctx).toBeDefined();
    expect(Effects.confetti.ctx).not.toBeNull();
  });
});

describe('Effects.floatingXP - Structure', () => {
  it('should have show method', () => {
    expect(typeof Effects.floatingXP.show).toBe('function');
  });

  it('should have showMultiple method', () => {
    expect(typeof Effects.floatingXP.showMultiple).toBe('function');
  });

  it('should have container property', () => {
    expect(Effects.floatingXP.hasOwnProperty('container')).toBe(true);
  });
});

describe('Effects.floatingXP - show()', () => {
  afterEach(() => {
    // Cleanup container
    if (Effects.floatingXP.container) {
      Effects.floatingXP.container.remove();
      Effects.floatingXP.container = null;
    }
    // Remove any floating XP elements
    document.querySelectorAll('.floating-xp').forEach(el => el.remove());
  });

  it('should create container if not exists', () => {
    Effects.floatingXP.container = null;
    Effects.floatingXP.show(10);
    expect(Effects.floatingXP.container).not.toBeNull();
  });

  it('should create container with correct ID', () => {
    Effects.floatingXP.container = null;
    Effects.floatingXP.show(10);
    expect(Effects.floatingXP.container.id).toBe('floating-xp-container');
  });

  it('should create floating XP element', () => {
    Effects.floatingXP.show(25);
    const xpEl = Effects.floatingXP.container.querySelector('.floating-xp');
    expect(xpEl).not.toBeNull();
  });

  it('should display correct XP amount', () => {
    Effects.floatingXP.show(42);
    const xpEl = Effects.floatingXP.container.querySelector('.floating-xp');
    expect(xpEl.textContent).toContain('+42');
  });

  it('should include XP icon', () => {
    Effects.floatingXP.show(10);
    const icon = Effects.floatingXP.container.querySelector('.floating-xp__icon');
    expect(icon).not.toBeNull();
  });

  it('should position at custom x,y when provided', () => {
    Effects.floatingXP.show(10, { x: 100, y: 200 });
    const xpEl = Effects.floatingXP.container.querySelector('.floating-xp');
    expect(xpEl.style.left).toBe('100px');
    expect(xpEl.style.top).toBe('200px');
  });

  it('should set default position when no coordinates given', () => {
    Effects.floatingXP.show(10);
    const xpEl = Effects.floatingXP.container.querySelector('.floating-xp');
    expect(xpEl.style.left).toBeTruthy();
    expect(xpEl.style.top).toBeTruthy();
  });

  it('should apply custom color when provided', () => {
    Effects.floatingXP.show(10, { color: '#ff0000' });
    const xpEl = Effects.floatingXP.container.querySelector('.floating-xp');
    expect(xpEl.style.getPropertyValue('--floating-xp-color')).toBe('#ff0000');
  });

  it('container should have fixed positioning', () => {
    Effects.floatingXP.container = null;
    Effects.floatingXP.show(10);
    expect(Effects.floatingXP.container.style.position).toBe('fixed');
  });

  it('container should have pointer-events none', () => {
    Effects.floatingXP.container = null;
    Effects.floatingXP.show(10);
    expect(Effects.floatingXP.container.style.pointerEvents).toBe('none');
  });
});

describe('Effects.floatingXP - showMultiple()', () => {
  afterEach(() => {
    if (Effects.floatingXP.container) {
      Effects.floatingXP.container.remove();
      Effects.floatingXP.container = null;
    }
  });

  it('should accept array of gains', () => {
    const gains = [
      { amount: 10, delay: 0 },
      { amount: 20, delay: 100 }
    ];

    // Should not throw
    expect(() => Effects.floatingXP.showMultiple(gains)).not.toThrow();
  });

  it('should show first XP without delay (next tick)', (done) => {
    // showMultiple() planifie chaque gain via setTimeout(..., delay), même pour delay = 0 :
    // l'XP n'est donc visible qu'au tick suivant, pas de façon synchrone.
    // Repartir d'un conteneur vide (sinon querySelector retrouve un XP d'un test précédent)
    if (Effects.floatingXP.container) Effects.floatingXP.container.remove();
    Effects.floatingXP.container = null;

    const gains = [{ amount: 15, delay: 0 }];
    Effects.floatingXP.showMultiple(gains);

    setTimeout(() => {
      try {
        // Le test précédent a des timers en attente (gains +10/+20) qui peuvent aussi
        // ajouter des éléments : on cherche celui du gain +15.
        const xpEl = [...Effects.floatingXP.container.querySelectorAll('.floating-xp')]
          .find(el => el.textContent.includes('+15'));
        expect(xpEl).toBeDefined();
        done();
      } catch (e) {
        done(e);
      }
    }, 20);
  });
});

describe('Effects.streak - Structure', () => {
  it('should have show method', () => {
    expect(typeof Effects.streak.show).toBe('function');
  });
});

describe('Effects.streak - show()', () => {
  afterEach(() => {
    // Cleanup any streak fire elements
    document.querySelectorAll('.streak-fire').forEach(el => el.remove());
  });

  it('should create streak-fire element', () => {
    Effects.streak.show(3, null);
    const fireEl = document.querySelector('.streak-fire');
    expect(fireEl).not.toBeNull();
  });

  it('should show single fire for count < 6', () => {
    Effects.streak.show(3, null);
    const fireEl = document.querySelector('.streak-fire');
    // Should contain exactly one fire emoji (not repeated)
    expect(fireEl.innerHTML.split('🔥').length).toBeLessThanOrEqual(2);
  });

  it('should show double fire for count >= 6', () => {
    Effects.streak.show(6, null);
    const fireEl = document.querySelector('.streak-fire');
    expect(fireEl.innerHTML).toContain('🔥🔥');
  });

  it('should position near element when provided', () => {
    const mockElement = document.createElement('div');
    mockElement.style.position = 'fixed';
    mockElement.style.left = '100px';
    mockElement.style.top = '100px';
    mockElement.style.width = '50px';
    mockElement.style.height = '50px';
    document.body.appendChild(mockElement);

    Effects.streak.show(5, mockElement);

    const fireEl = document.querySelector('.streak-fire');
    expect(fireEl.style.left).toBeTruthy();
    expect(fireEl.style.top).toBeTruthy();

    mockElement.remove();
  });

  it('should have fixed positioning', () => {
    Effects.streak.show(4, null);
    const fireEl = document.querySelector('.streak-fire');
    // Le positionnement fixed vient de la feuille de style injectée par effects.js
    // (règle .streak-fire), pas d'un style inline.
    expect(window.getComputedStyle(fireEl).position).toBe('fixed');
  });
});

describe('Effects - Edge Cases', () => {
  afterEach(() => {
    Effects.confetti.destroy();
    if (Effects.floatingXP.container) {
      Effects.floatingXP.container.remove();
      Effects.floatingXP.container = null;
    }
  });

  it('should handle multiple rapid launches', () => {
    expect(() => {
      Effects.confetti.launch();
      Effects.confetti.launch();
      Effects.confetti.launch();
    }).not.toThrow();
  });

  it('should handle stop when not running', () => {
    Effects.confetti.isRunning = false;
    expect(() => Effects.confetti.stop()).not.toThrow();
  });

  it('should handle destroy when not created', () => {
    Effects.confetti.canvas = null;
    expect(() => Effects.confetti.destroy()).not.toThrow();
  });

  it('should handle showing XP with 0 amount', () => {
    expect(() => Effects.floatingXP.show(0)).not.toThrow();
    const xpEl = Effects.floatingXP.container.querySelector('.floating-xp');
    expect(xpEl.textContent).toContain('+0');
  });

  it('should handle showing XP with large amount', () => {
    expect(() => Effects.floatingXP.show(99999)).not.toThrow();
    const xpEl = Effects.floatingXP.container.querySelector('.floating-xp');
    expect(xpEl.textContent).toContain('+99999');
  });

  it('should handle streak with count = 0', () => {
    expect(() => Effects.streak.show(0, null)).not.toThrow();
  });
});
