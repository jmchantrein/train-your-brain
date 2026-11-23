/**
 * Tests pour le module LaTeX (KaTeX wrapper)
 */

describe('LaTeX', () => {

  // ═══════════════════════════════════════════════════════════════
  // hasLatex()
  // ═══════════════════════════════════════════════════════════════

  describe('hasLatex()', () => {

    it('devrait détecter les expressions inline $...$', () => {
      expect(LaTeX.hasLatex('La formule $x^2$ est simple')).toBe(true);
    });

    it('devrait détecter les expressions block $$...$$', () => {
      expect(LaTeX.hasLatex('Voici une équation: $$E = mc^2$$')).toBe(true);
    });

    it('devrait retourner false pour du texte sans LaTeX', () => {
      expect(LaTeX.hasLatex('Texte simple sans formule')).toBe(false);
    });

    it('devrait retourner false pour null/undefined', () => {
      expect(LaTeX.hasLatex(null)).toBe(false);
      expect(LaTeX.hasLatex(undefined)).toBe(false);
    });

    it('devrait retourner false pour une chaîne vide', () => {
      expect(LaTeX.hasLatex('')).toBe(false);
    });

  });

  // ═══════════════════════════════════════════════════════════════
  // toHtml() - Mode inline
  // ═══════════════════════════════════════════════════════════════

  describe('toHtml() - inline', () => {

    it('devrait convertir une expression simple', () => {
      const html = LaTeX.toHtml('x^2');

      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(0);
    });

    it('devrait retourner une chaîne vide pour une entrée vide', () => {
      expect(LaTeX.toHtml('')).toBe('');
      expect(LaTeX.toHtml(null)).toBe('');
    });

    it('devrait gérer les fractions', () => {
      const html = LaTeX.toHtml('\\frac{1}{2}');
      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(0);
    });

    it('devrait gérer les exposants et indices', () => {
      const html = LaTeX.toHtml('x^2 + y_1');
      expect(html).toBeDefined();
    });

    it('devrait gérer les symboles grecs', () => {
      const html = LaTeX.toHtml('\\alpha + \\beta');
      expect(html).toBeDefined();
    });

    it('devrait gérer les racines carrées', () => {
      const html = LaTeX.toHtml('\\sqrt{16}');
      expect(html).toBeDefined();
    });

  });

  // ═══════════════════════════════════════════════════════════════
  // toHtml() - Mode display
  // ═══════════════════════════════════════════════════════════════

  describe('toHtml() - display mode', () => {

    it('devrait supporter le mode display', () => {
      const html = LaTeX.toHtml('\\sum_{i=1}^{n} i', { displayMode: true });
      expect(html).toBeDefined();
    });

    it('devrait gérer les intégrales en display mode', () => {
      const html = LaTeX.toHtml('\\int_0^1 x \\, dx', { displayMode: true });
      expect(html).toBeDefined();
    });

  });

  // ═══════════════════════════════════════════════════════════════
  // render() - Détection et conversion automatique
  // ═══════════════════════════════════════════════════════════════

  describe('render()', () => {

    it('devrait convertir les expressions inline $...$', () => {
      const html = LaTeX.render('La formule $x^2$ est simple');

      expect(html).toContain('La formule');
      expect(html).toContain('est simple');
      expect(html).not.toContain('$x^2$'); // Le $ devrait être remplacé
    });

    it('devrait convertir les expressions block $$...$$', () => {
      const html = LaTeX.render('Équation: $$E = mc^2$$');

      expect(html).toContain('Équation:');
      expect(html).not.toContain('$$'); // Les $$ devraient être remplacés
    });

    it('devrait laisser le texte sans LaTeX inchangé', () => {
      const text = 'Texte simple sans formule';
      const html = LaTeX.render(text);

      expect(html).toBe(text);
    });

    it('devrait gérer plusieurs expressions', () => {
      const html = LaTeX.render('$a$ plus $b$ égale $c$');

      expect(html).not.toContain('$a$');
      expect(html).not.toContain('$b$');
      expect(html).not.toContain('$c$');
    });

    it('devrait retourner une chaîne vide pour null', () => {
      expect(LaTeX.render(null)).toBe('');
    });

    it('devrait retourner la valeur originale pour un non-string', () => {
      expect(LaTeX.render(42)).toBe(42);
    });

  });

  // ═══════════════════════════════════════════════════════════════
  // isAvailable()
  // ═══════════════════════════════════════════════════════════════

  describe('isAvailable()', () => {

    it('devrait retourner un booléen', () => {
      const result = LaTeX.isAvailable();
      expect(typeof result).toBe('boolean');
    });

    it('devrait retourner true si KaTeX est chargé', () => {
      if (typeof katex !== 'undefined') {
        expect(LaTeX.isAvailable()).toBe(true);
      }
    });

  });

  // ═══════════════════════════════════════════════════════════════
  // Gestion des erreurs
  // ═══════════════════════════════════════════════════════════════

  describe('gestion des erreurs', () => {

    it('devrait gérer gracieusement les expressions invalides', () => {
      // Cette expression est invalide en LaTeX pur
      const html = LaTeX.toHtml('\\invalid_command');

      // Ne devrait pas lancer d'erreur
      expect(html).toBeDefined();
    });

    it('devrait gérer les accolades non fermées', () => {
      // Expression avec accolade non fermée
      const html = LaTeX.toHtml('\\frac{1}{2');

      // Ne devrait pas lancer d'erreur (mode throwOnError: false)
      expect(html).toBeDefined();
    });

  });

  // ═══════════════════════════════════════════════════════════════
  // Macros personnalisées
  // ═══════════════════════════════════════════════════════════════

  describe('macros', () => {

    it('devrait supporter la macro \\R pour les réels', () => {
      const html = LaTeX.toHtml('\\R');
      expect(html).toBeDefined();
    });

    it('devrait supporter la macro \\N pour les naturels', () => {
      const html = LaTeX.toHtml('\\N');
      expect(html).toBeDefined();
    });

    it('devrait supporter la macro \\Z pour les entiers', () => {
      const html = LaTeX.toHtml('\\Z');
      expect(html).toBeDefined();
    });

  });

});
