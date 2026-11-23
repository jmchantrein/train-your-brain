/**
 * Tests XSS / échappement de l'interface
 *
 * Tout contenu de deck (titre, question, réponse, ids, médias...) est une entrée non fiable
 * (import YAML / JSON / Moodle). On vérifie qu'une fois le HTML rendu inséré dans le DOM,
 * aucun élément ni attribut injecté n'apparaît.
 *
 * Modules requis par le runner : components.js, game/card-type-renderer.js,
 * effects.js, page-game.js. Les blocs "Pages.deckResources" et "Pages.exam" ne s'exécutent que si
 * ces pages sont chargées par le runner (src/ui/page-deck-resources.js, src/ui/page-exam.js).
 */

describe('UI XSS - échappement', () => {
  const PAYLOAD_TAG = '<img src=x onerror=window.__xss=1>';
  const PAYLOAD_ATTR = 'x" onmouseover="window.__xss=1" data-x="';

  /** Insère du HTML rendu dans un conteneur réel (jsdom) pour inspecter le DOM résultant */
  function toDom(html) {
    const root = document.createElement('div');
    root.innerHTML = html;
    return root;
  }

  /** Vrai si le DOM contient un élément/attribut dangereux injecté */
  function hasInjection(root) {
    if (root.querySelector('img[src="x"], script, [onerror], [onmouseover], [onfocus], [onload], [onclick]')) return true;
    return false;
  }

  describe('escapeHtml', () => {
    it('should escape angle brackets and ampersands', () => {
      expect(escapeHtml('<b>&</b>')).toBe('&lt;b&gt;&amp;&lt;/b&gt;');
    });

    it('should escape double and single quotes (contexte attribut)', () => {
      const out = escapeHtml('a"b\'c');
      expect(out).not.toContain('"');
      expect(out).not.toContain("'");
      expect(out).toContain('&quot;');
      expect(out).toContain('&#39;');
    });

    it('should not allow breaking out of a double-quoted attribute', () => {
      const root = toDom(`<input value="${escapeHtml(PAYLOAD_ATTR)}">`);
      expect(hasInjection(root)).toBe(false);
      expect(root.querySelector('input').value).toBe(PAYLOAD_ATTR);
    });

    it('should not allow breaking out of a single-quoted attribute', () => {
      const root = toDom(`<button data-audio='${escapeHtml("x' onclick='window.__xss=1")}'></button>`);
      expect(hasInjection(root)).toBe(false);
    });

    it('should return an empty string for null and undefined', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });
  });

  describe('renderWithLatex', () => {
    it('should escape plain text', () => {
      expect(hasInjection(toDom(renderWithLatex(PAYLOAD_TAG)))).toBe(false);
    });

    it('should escape text around a closed formula', () => {
      expect(hasInjection(toDom(renderWithLatex(`${PAYLOAD_TAG} $x^2$ ${PAYLOAD_TAG}`)))).toBe(false);
    });

    it('should escape everything after an unclosed dollar sign', () => {
      const root = toDom(renderWithLatex(`Prix $ ${PAYLOAD_TAG}`));
      expect(hasInjection(root)).toBe(false);
      expect(root.textContent).toContain(PAYLOAD_TAG);
    });

    it('should not interpret HTML inside a formula', () => {
      expect(hasInjection(toDom(renderWithLatex(`$${PAYLOAD_TAG}$`)))).toBe(false);
    });
  });

  describe('GameCardTypeRenderer', () => {
    it('should escape matching pair ids (explicit and index based)', () => {
      const card = { id: 'c', question: 'q', type: 'matching', pairs: [{ id: PAYLOAD_ATTR, term: PAYLOAD_TAG, response: PAYLOAD_TAG }] };
      expect(hasInjection(toDom(GameCardTypeRenderer.renderMatching(card)))).toBe(false);
    });

    it('should escape MCQ choices', () => {
      const card = { id: 'c', question: 'q', type: 'mcq', choices: [{ id: PAYLOAD_ATTR, text: PAYLOAD_TAG }] };
      expect(hasInjection(toDom(GameCardTypeRenderer.renderMCQ(card)))).toBe(false);
    });

    it('should escape the cloze question with an unclosed dollar sign', () => {
      const card = { id: 'c', question: `Prix $ ${PAYLOAD_TAG} {{blank_0}}`, type: 'cloze', blanks: [{ type: 'text', correctAnswer: 'x' }] };
      expect(hasInjection(toDom(GameCardTypeRenderer.renderCloze(card)))).toBe(false);
    });

    it('should give the text answer input an accessible name', () => {
      const html = GameCardTypeRenderer.renderText({ id: 'c', question: 'q', type: 'text' });
      expect(html).toContain('aria-label=');
    });
  });

  describe('Pages.game._renderCardMedia', () => {
    const svgPayload = '<svg xmlns="http://www.w3.org/2000/svg" onload="window.__xss=1"><script>window.__xss=1</script><circle r="5"/></svg>';

    it('should never inline an SVG provided by a deck', () => {
      const root = toDom(Pages.game._renderCardMedia({ media: { type: 'image', format: 'svg', data: svgPayload } }));
      expect(root.querySelector('svg')).toBeNull();
      expect(hasInjection(root)).toBe(false);
      const img = root.querySelector('img');
      expect(img).toBeTruthy();
      expect(img.getAttribute('src').startsWith('data:image/svg+xml')).toBe(true);
    });

    it('should escape image and audio sources', () => {
      const image = toDom(Pages.game._renderCardMedia({ media: { type: 'image', data: `http://x/${PAYLOAD_ATTR}` } }));
      const audio = toDom(Pages.game._renderCardMedia({ media: { type: 'audio', data: `data:audio/mp3;base64,${PAYLOAD_ATTR}` } }));
      expect(hasInjection(image)).toBe(false);
      expect(hasInjection(audio)).toBe(false);
    });

    it('should escape legacy imageUrl and audioUrl', () => {
      const root = toDom(Pages.game._renderCardMedia({ imageUrl: PAYLOAD_ATTR, audioUrl: PAYLOAD_ATTR }));
      expect(hasInjection(root)).toBe(false);
    });
  });

  describe('Effects', () => {
    it('should escape badge name and description in the unlock popup', () => {
      Effects.badgePopup.show({ name: PAYLOAD_TAG, description: PAYLOAD_TAG, icon: '🏆' });
      const popup = document.querySelector('.badge-popup');
      expect(popup).toBeTruthy();
      expect(hasInjection(popup)).toBe(false);
      expect(popup.textContent).toContain(PAYLOAD_TAG);
      popup.remove();
    });
  });

  describe('Pages.deckResources (si chargé par le runner)', () => {
    const loaded = typeof Pages !== 'undefined' && Pages.deckResources;

    it('should escape HTML in markdown content', () => {
      if (!loaded) return;
      const html = Pages.deckResources.renderMarkdown(`# Titre ${PAYLOAD_TAG}\n**gras** ${PAYLOAD_TAG}\n<script>window.__xss=1</script>`);
      expect(hasInjection(toDom(html))).toBe(false);
      expect(toDom(html).querySelector('strong')).toBeTruthy();
    });

    it('should only keep http(s) and mailto links in markdown', () => {
      if (!loaded) return;
      const html = Pages.deckResources.renderMarkdown('[a](javascript:window.__xss=1) [b](https://example.org) [c](data:text/html,x)');
      const links = Array.from(toDom(html).querySelectorAll('a')).map(a => a.getAttribute('href'));
      expect(links).toEqual(['https://example.org']);
    });

    it('should neutralise javascript: URLs in link resources', () => {
      if (!loaded) return;
      const root = toDom(Pages.deckResources.renderLinkResource({ type: 'link', title: 't', url: 'javascript:window.__xss=1' }));
      expect(root.querySelector('a').getAttribute('href')).toBe('#');
    });
  });

  describe('Pages.exam (si chargé par le runner)', () => {
    it('should render string points as numbers, not markup', () => {
      if (typeof Pages === 'undefined' || !Pages.exam) return;
      const html = Pages.exam._renderQuestion({ id: 'c', question: 'q', answer: 'a', type: 'text', points: PAYLOAD_TAG });
      expect(hasInjection(toDom(html))).toBe(false);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Audit de publication B1 : stats du joueur importées (JSON / YAML)
  // ─────────────────────────────────────────────────────────────────────────
  describe('Statistiques du joueur importées (B1)', () => {
    const NUMERIC_STATS = ['totalXP', 'totalCardsPlayed', 'totalSessions', 'currentStreak', 'longestStreak', 'longestGreenStreak', 'totalGreenCards'];

    function hostilePlayer() {
      const stats = {};
      NUMERIC_STATS.forEach(f => { stats[f] = PAYLOAD_TAG; });
      return { id: 'evil', name: 'Eve', createdAt: '2025-01-01T00:00:00Z', stats, badges: [], settings: {} };
    }

    it('should not inject markup from player stats in the player bar (défense en profondeur)', () => {
      // Données qui contournent Storage (état mémoire) : le rendu doit échapper lui-même
      const html = Components.playerBar.render({ player: hostilePlayer() });
      const root = toDom(html);
      expect(hasInjection(root)).toBe(false);
      expect(html).not.toContain('<img src=x');
    });

    it('should not inject markup after the hostile player went through Storage.sanitizePlayer', () => {
      const html = Components.playerBar.render({ player: Storage.sanitizePlayer(hostilePlayer()) });
      expect(html).not.toContain('onerror');
      expect(hasInjection(toDom(html))).toBe(false);
    });

    it('should sanitize the imported YAML progress before merging it into the current player', () => {
      const current = Storage.sanitizePlayer({ id: 'me', name: 'Moi', createdAt: '2025-01-01', stats: { totalXP: 10, totalSessions: 3 }, badges: ['a'] });
      const merged = Components.playerBar._mergeImportedPlayer(current, hostilePlayer());
      NUMERIC_STATS.forEach(f => { expect(typeof merged.stats[f]).toBe('number'); });
      expect(merged.stats.totalXP).toBe(0);
      expect(merged.id).toBe('me');
      expect(JSON.stringify(merged)).not.toContain('onerror');
    });

    it('should keep the current stats a progress file does not mention', () => {
      const current = Storage.sanitizePlayer({ id: 'me', name: 'Moi', createdAt: '2025-01-01', stats: { totalXP: 10, totalSessions: 3 }, badges: ['a'] });
      const merged = Components.playerBar._mergeImportedPlayer(current, { name: 'Nouveau', stats: { totalXP: 99 } });
      expect(merged.name).toBe('Nouveau');
      expect(merged.stats.totalXP).toBe(99);
      expect(merged.stats.totalSessions).toBe(3);
      expect(merged.badges).toEqual(['a']);
    });

    it('should reject an imported progress file without an exploitable player', () => {
      const current = Storage.sanitizePlayer({ id: 'me', name: 'Moi', createdAt: '2025-01-01' });
      expect(() => Components.playerBar._mergeImportedPlayer(current, 'texte')).toThrow();
    });

    it('should sanitize imported card progress and never overwrite card content', () => {
      const deck = { id: 'd', cards: [{ id: 'c1', question: 'Q', answer: 'A', box: 'never_played' }] };
      Components.playerBar._applyImportedProgress([deck], [
        { id: 'd', cards: [{ id: 'c1', box: PAYLOAD_TAG, timesPlayed: PAYLOAD_TAG, question: PAYLOAD_TAG }] }
      ]);
      expect(deck.cards[0].question).toBe('Q');
      expect(deck.cards[0].box).toBe('never_played');
      expect(deck.cards[0].timesPlayed).toBe(0);
    });

    it('should not inject markup from the players list (splash screen)', () => {
      expect(typeof Pages.splash).toBe('object');
      localStorage.clear();
      localStorage.setItem(Storage.KEYS.PLAYERS_LIST, JSON.stringify([{ id: 'evil', name: 'Eve', createdAt: '2025-01-01', totalXP: PAYLOAD_TAG }]));
      expect(hasInjection(toDom(Pages.splash.render()))).toBe(false);
      localStorage.clear();
    });

    it('should not inject markup from player stats on the stats page', () => {
      expect(typeof Pages.stats).toBe('object');
      const html = Pages.stats.render({ player: hostilePlayer(), decks: [] });
      expect(html).not.toContain('<img src=x');
    });
  });
});
