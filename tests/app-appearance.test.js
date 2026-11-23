/**
 * Apparence par joueur : App._applyPlayerAppearance
 *
 * Le thème et les préférences d'accessibilité (player.settings) suivent le joueur courant
 * à chaque changement de State.player. Module requis par le runner : src/ui/app.js.
 */

describe('App._applyPlayerAppearance', () => {
  const root = () => document.documentElement;
  const ATTRS = ['data-theme', 'data-dyslexia', 'data-high-contrast', 'data-large-spacing', 'data-colorblind'];
  const reset = () => ATTRS.forEach(a => root().removeAttribute(a));

  it('applique le thème du joueur', () => {
    reset();
    App._applyPlayerAppearance({ settings: { theme: 'forest' } });
    expect(root().getAttribute('data-theme')).toBe('forest');
  });

  it('applique le thème par défaut sans réglage', () => {
    reset();
    App._applyPlayerAppearance({});
    expect(root().getAttribute('data-theme')).toBe('ocean');
  });

  it("applique les préférences d'accessibilité du joueur", () => {
    reset();
    App._applyPlayerAppearance({ settings: { dyslexiaMode: true, highContrast: true, largeSpacing: true, colorblindMode: 'protanopia' } });
    expect(root().getAttribute('data-dyslexia')).toBe('true');
    expect(root().getAttribute('data-high-contrast')).toBe('true');
    expect(root().getAttribute('data-large-spacing')).toBe('true');
    expect(root().getAttribute('data-colorblind')).toBe('protanopia');
  });

  it("retire les préférences du joueur précédent au changement de joueur", () => {
    reset();
    App._applyPlayerAppearance({ settings: { theme: 'forest', dyslexiaMode: true, colorblindMode: 'tritanopia' } });
    App._applyPlayerAppearance({ settings: { theme: 'ocean' } });
    expect(root().getAttribute('data-theme')).toBe('ocean');
    expect(root().getAttribute('data-dyslexia')).toBe('false');
    expect(root().getAttribute('data-colorblind')).toBe('');
  });

  it("ne change rien sans joueur (écran de profil)", () => {
    reset();
    App._applyPlayerAppearance({ settings: { theme: 'forest' } });
    App._applyPlayerAppearance(null);
    expect(root().getAttribute('data-theme')).toBe('forest');
  });
});
