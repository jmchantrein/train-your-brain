/**
 * Module LaTeX - Rendu des formules mathématiques avec KaTeX
 *
 * Utilise la bibliothèque KaTeX pour un rendu de qualité professionnelle.
 * Syntaxe supportée : $...$ pour inline, $$...$$ pour display mode
 *
 * Note: KaTeX est chargé globalement comme 'katex' par le build
 */

const LaTeX = {
  /**
   * Convertit une expression LaTeX en HTML avec KaTeX
   * @param {string} latex - Expression LaTeX
   * @param {Object} options - Options KaTeX
   * @param {boolean} options.displayMode - Mode display (centré, plus grand)
   * @returns {string} - HTML rendu
   */
  toHtml(latex, options = {}) {
    if (!latex) return '';

    // Utiliser KaTeX si disponible
    if (typeof katex !== 'undefined') {
      try {
        return katex.renderToString(latex, {
          throwOnError: false,
          displayMode: options.displayMode || false,
          output: 'html', // ou 'mathml' pour accessibilité
          trust: false,   // Sécurité: pas de commandes dangereuses
          strict: false,  // Tolérant aux erreurs mineures
          macros: {
            // Macros courantes
            '\\R': '\\mathbb{R}',
            '\\N': '\\mathbb{N}',
            '\\Z': '\\mathbb{Z}',
            '\\Q': '\\mathbb{Q}',
            '\\C': '\\mathbb{C}'
          }
        });
      } catch (e) {
        // En cas d'erreur, retourner l'expression brute dans une span d'erreur
        console.warn('KaTeX error:', e.message);
        return `<span class="katex-error" title="${TextUtils.escapeHtml(e.message)}">${TextUtils.escapeHtml(latex)}</span>`;
      }
    }

    // Fallback: si KaTeX n'est pas disponible, utiliser le rendu basique
    return this._basicRender(latex);
  },

  /**
   * Détecte et convertit les expressions LaTeX dans un texte
   * Supporte $...$ pour inline et $$...$$ pour display mode
   * @param {string} text - Texte contenant du LaTeX
   * @returns {string} - HTML avec LaTeX rendu
   */
  render(text) {
    if (!text || typeof text !== 'string') return text || '';

    // Vérifier s'il y a du LaTeX
    if (!text.includes('$')) return text;

    // Remplacer les blocks $$...$$ (display mode)
    text = text.replace(/\$\$([^$]+)\$\$/g, (_, latex) => {
      return this.toHtml(latex.trim(), { displayMode: true });
    });

    // Remplacer les inline $...$ (mais pas les $$ déjà traités)
    text = text.replace(/\$([^$]+)\$/g, (_, latex) => {
      return this.toHtml(latex.trim(), { displayMode: false });
    });

    return text;
  },

  /**
   * Vérifie si un texte contient du LaTeX
   * @param {string} text - Texte à vérifier
   * @returns {boolean}
   */
  hasLatex(text) {
    return typeof text === 'string' && text.includes('$');
  },

  /**
   * Vérifie si KaTeX est disponible
   * @returns {boolean}
   */
  isAvailable() {
    return typeof katex !== 'undefined';
  },

  // ═══════════════════════════════════════════════════════════════
  // FALLBACK: Rendu basique si KaTeX n'est pas disponible
  // ═══════════════════════════════════════════════════════════════

  // Symboles grecs (fallback)
  _GREEK: {
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ',
    '\\epsilon': 'ε', '\\zeta': 'ζ', '\\eta': 'η', '\\theta': 'θ',
    '\\iota': 'ι', '\\kappa': 'κ', '\\lambda': 'λ', '\\mu': 'μ',
    '\\nu': 'ν', '\\xi': 'ξ', '\\pi': 'π', '\\rho': 'ρ',
    '\\sigma': 'σ', '\\tau': 'τ', '\\upsilon': 'υ', '\\phi': 'φ',
    '\\chi': 'χ', '\\psi': 'ψ', '\\omega': 'ω',
    '\\Alpha': 'Α', '\\Beta': 'Β', '\\Gamma': 'Γ', '\\Delta': 'Δ',
    '\\Epsilon': 'Ε', '\\Zeta': 'Ζ', '\\Eta': 'Η', '\\Theta': 'Θ',
    '\\Iota': 'Ι', '\\Kappa': 'Κ', '\\Lambda': 'Λ', '\\Mu': 'Μ',
    '\\Nu': 'Ν', '\\Xi': 'Ξ', '\\Pi': 'Π', '\\Rho': 'Ρ',
    '\\Sigma': 'Σ', '\\Tau': 'Τ', '\\Upsilon': 'Υ', '\\Phi': 'Φ',
    '\\Chi': 'Χ', '\\Psi': 'Ψ', '\\Omega': 'Ω'
  },

  // Opérateurs et symboles (fallback)
  _SYMBOLS: {
    '\\times': '×', '\\div': '÷', '\\pm': '±', '\\mp': '∓',
    '\\cdot': '·', '\\ast': '∗', '\\star': '★',
    '\\leq': '≤', '\\geq': '≥', '\\neq': '≠', '\\approx': '≈',
    '\\equiv': '≡', '\\sim': '∼', '\\propto': '∝',
    '\\infty': '∞', '\\partial': '∂', '\\nabla': '∇',
    '\\forall': '∀', '\\exists': '∃', '\\nexists': '∄',
    '\\in': '∈', '\\notin': '∉', '\\subset': '⊂', '\\supset': '⊃',
    '\\subseteq': '⊆', '\\supseteq': '⊇',
    '\\cup': '∪', '\\cap': '∩', '\\emptyset': '∅',
    '\\land': '∧', '\\lor': '∨', '\\neg': '¬',
    '\\Rightarrow': '⇒', '\\Leftarrow': '⇐', '\\Leftrightarrow': '⇔',
    '\\rightarrow': '→', '\\leftarrow': '←', '\\leftrightarrow': '↔',
    '\\sum': '∑', '\\prod': '∏', '\\int': '∫',
    '\\oint': '∮', '\\iint': '∬', '\\iiint': '∭',
    '\\angle': '∠', '\\perp': '⊥', '\\parallel': '∥',
    '\\triangle': '△', '\\square': '□', '\\circ': '∘',
    '\\degree': '°', '\\prime': '′', '\\dprime': '″',
    '\\ldots': '…', '\\cdots': '⋯', '\\vdots': '⋮', '\\ddots': '⋱',
    '\\ ': ' ', '\\quad': '  ', '\\qquad': '    ',
    '\\%': '%', '\\$': '$', '\\&': '&',
    '\\{': '{', '\\}': '}', '\\[': '[', '\\]': ']',
    '\\lfloor': '⌊', '\\rfloor': '⌋', '\\lceil': '⌈', '\\rceil': '⌉'
  },

  /**
   * Rendu basique (fallback si KaTeX non disponible)
   * @private
   */
  _basicRender(latex) {
    let html = latex;

    // Remplacer les fractions \frac{a}{b}
    html = html.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, (_, num, den) => {
      return `<span class="latex-frac"><span class="latex-num">${this._basicRender(num)}</span><span class="latex-den">${this._basicRender(den)}</span></span>`;
    });

    // Remplacer les racines carrées \sqrt{x} ou \sqrt[n]{x}
    html = html.replace(/\\sqrt\[([^\]]*)\]\{([^}]*)\}/g, (_, n, content) => {
      return `<span class="latex-root"><sup>${this._basicRender(n)}</sup>√<span class="latex-sqrt-content">${this._basicRender(content)}</span></span>`;
    });
    html = html.replace(/\\sqrt\{([^}]*)\}/g, (_, content) => {
      return `<span class="latex-sqrt">√<span class="latex-sqrt-content">${this._basicRender(content)}</span></span>`;
    });

    // Exposants x^{2} ou x^2
    html = html.replace(/\^{([^}]*)}/g, '<sup>$1</sup>');
    html = html.replace(/\^(\d|[a-zA-Z])/g, '<sup>$1</sup>');

    // Indices x_{i} ou x_i
    html = html.replace(/_{([^}]*)}/g, '<sub>$1</sub>');
    html = html.replace(/_(\d|[a-zA-Z])/g, '<sub>$1</sub>');

    // Texte en gras \textbf{} ou \mathbf{}
    html = html.replace(/\\(textbf|mathbf)\{([^}]*)\}/g, '<strong>$2</strong>');

    // Texte en italique \textit{} ou \mathit{}
    html = html.replace(/\\(textit|mathit)\{([^}]*)\}/g, '<em>$2</em>');

    // Texte normal dans les maths \text{}
    html = html.replace(/\\text\{([^}]*)\}/g, '<span class="latex-text">$1</span>');

    // Remplacer les symboles grecs
    for (const [tex, unicode] of Object.entries(this._GREEK)) {
      html = html.split(tex).join(unicode);
    }

    // Remplacer les symboles
    for (const [tex, unicode] of Object.entries(this._SYMBOLS)) {
      html = html.split(tex).join(unicode);
    }

    return html;
  }
};

// Export pour tests Node.js
if (typeof module !== 'undefined') {
  module.exports = LaTeX;
}
