/**
 * Médias de carte : aucune ressource distante provenant d'un deck n'est chargée automatiquement
 * (audit de publication C1). Seules les sources embarquées (data:, blob:) sont rendues ; une source
 * http(s) est remplacée par un lien explicite ouvert au choix de l'utilisateur.
 */

describe('Médias de carte - aucune ressource distante automatique', () => {
  const REMOTE_IMG = 'https://tracker.example/pixel.png?deck=abc';
  const REMOTE_AUDIO = 'http://tracker.example/son.mp3';

  function toDom(html) {
    const root = document.createElement('div');
    root.innerHTML = html;
    return root;
  }

  /** Vrai si un élément qui déclenche une requête réseau porte une source non embarquée */
  function loadsNonEmbedded(root) {
    return Array.from(root.querySelectorAll('img, audio, video, source, iframe, embed, object, link'))
      .some(el => {
        const src = el.getAttribute('src') || el.getAttribute('data') || el.getAttribute('href') || '';
        return src !== '' && !/^(data|blob):/i.test(src);
      });
  }

  describe('CardMedia (source unique)', () => {
    it('should classify embedded, remote and blocked sources', () => {
      expect(CardMedia.classify('data:image/png;base64,AAAA')).toBe('embedded');
      expect(CardMedia.classify('blob:null/1234')).toBe('embedded');
      expect(CardMedia.classify('https://a.example/x.png')).toBe('remote');
      expect(CardMedia.classify('HTTP://a.example/x.png')).toBe('remote');
      expect(CardMedia.classify('//a.example/x.png')).toBe('remote');
      expect(CardMedia.classify('javascript:alert(1)')).toBe('blocked');
      expect(CardMedia.classify('images/local.png')).toBe('blocked');
      expect(CardMedia.classify('')).toBe('blocked');
      expect(CardMedia.classify(null)).toBe('blocked');
    });

    it('should render an embedded image as <img>', () => {
      const root = toDom(CardMedia.image('data:image/png;base64,AAAA', { alt: 'x' }));
      expect(root.querySelector('img').getAttribute('src')).toBe('data:image/png;base64,AAAA');
    });

    it('should replace a remote image by an explicit link, without any <img>', () => {
      const root = toDom(CardMedia.image(REMOTE_IMG, { alt: 'x' }));
      expect(root.querySelector('img')).toBeNull();
      const a = root.querySelector('a');
      expect(a.getAttribute('href')).toBe(REMOTE_IMG);
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel')).toContain('noopener');
      expect(a.getAttribute('rel')).toContain('noreferrer');
      expect(root.textContent).toContain('tracker.example');
      expect(loadsNonEmbedded(root)).toBe(false);
    });

    it('should replace a remote audio by an explicit link, without any <audio>', () => {
      const root = toDom(CardMedia.audio(REMOTE_AUDIO, {}));
      expect(root.querySelector('audio')).toBeNull();
      expect(root.querySelector('a').getAttribute('href')).toBe(REMOTE_AUDIO);
    });

    it('should render nothing loadable for javascript: and relative sources, and no link', () => {
      for (const src of ['javascript:window.__xss=1', 'images/local.png', 'file:///etc/passwd']) {
        const root = toDom(CardMedia.image(src, { alt: 'x' }));
        expect(root.querySelector('img')).toBeNull();
        expect(root.querySelector('a')).toBeNull();
      }
    });

    it('should not turn a hostile URL into markup', () => {
      const root = toDom(CardMedia.image('https://x.example/"><img src=x onerror=window.__xss=1>', { alt: 'x' }));
      expect(root.querySelector('img')).toBeNull();
      expect(root.querySelector('[onerror]')).toBeNull();
    });

    it('should render a passive placeholder (no link, no request) when link is false', () => {
      const root = toDom(CardMedia.image(REMOTE_IMG, { alt: 'x', link: false }));
      expect(root.querySelector('a')).toBeNull();
      expect(loadsNonEmbedded(root)).toBe(false);
      expect(root.textContent.length).toBeGreaterThan(0);
    });

    it('should have its messages in French and English', () => {
      for (const lang of ['fr', 'en']) {
        for (const key of ['media.remoteWarning', 'media.openRemoteImage', 'media.openRemoteAudio', 'media.remoteImagePlaceholder']) {
          const text = i18n._translations[lang][key];
          expect(typeof text).toBe('string');
          expect(text.length).toBeGreaterThan(0);
        }
        expect(i18n._translations[lang]['media.remoteWarning']).toContain('{host}');
      }
    });
  });

  describe('Pages.game', () => {
    it('should not load a remote media.data image or audio', () => {
      const html = Pages.game._renderCardMedia({
        media: { type: 'image', data: REMOTE_IMG },
        audioUrl: REMOTE_AUDIO
      });
      expect(loadsNonEmbedded(toDom(html))).toBe(false);
      expect(html).toContain(REMOTE_IMG);
    });

    it('should not load a remote legacy imageUrl', () => {
      const root = toDom(Pages.game._renderCardMedia({ imageUrl: REMOTE_IMG }));
      expect(loadsNonEmbedded(root)).toBe(false);
      expect(root.querySelector('a')).toBeTruthy();
    });

    it('should still render embedded media', () => {
      const root = toDom(Pages.game._renderCardMedia({
        media: { type: 'image', data: 'AAAA', format: 'png' },
        audioUrl: 'data:audio/mp3;base64,AAAA'
      }));
      expect(root.querySelector('img').getAttribute('src')).toBe('data:image/png;base64,AAAA');
      expect(root.querySelector('audio').getAttribute('src')).toBe('data:audio/mp3;base64,AAAA');
    });

    it('should not load a remote multilingual image or audio', () => {
      const word = {
        id: 'w', image: REMOTE_IMG,
        translations: { fr: { text: 'chat', audio: REMOTE_AUDIO }, en: { text: 'cat' } }
      };
      for (const mode of ['image', 'dictation', 'translation']) {
        const html = Pages.game._renderMultilingualCardFront({ word, mode, sourceLang: 'fr', targetLang: 'en' });
        expect(loadsNonEmbedded(toDom(html))).toBe(false);
      }
    });
  });

  describe('Autres pages qui rendent un média', () => {
    it('should not load remote media in the exam', () => {
      if (typeof Pages === 'undefined' || !Pages.exam) return;
      const html = Pages.exam._renderQuestion({ id: 'c', question: 'q', answer: 'a', type: 'text', imageUrl: REMOTE_IMG, audioUrl: REMOTE_AUDIO });
      expect(loadsNonEmbedded(toDom(html))).toBe(false);
    });

    it('should not load remote media in challenge mode', () => {
      if (typeof Pages === 'undefined' || !Pages.challenge) return;
      const html = Pages.challenge._renderQuestion({ id: 'c', question: 'q', answer: 'a', type: 'text', imageUrl: REMOTE_IMG }, {});
      expect(loadsNonEmbedded(toDom(html))).toBe(false);
    });

    it('should not load a remote image resource, and keep the explicit link', () => {
      if (typeof Pages === 'undefined' || !Pages.deckResources) return;
      const html = Pages.deckResources.renderImageResource({ type: 'image', title: 't', image: REMOTE_IMG });
      const root = toDom(html);
      expect(loadsNonEmbedded(root)).toBe(false);
      expect(root.querySelector('a').getAttribute('href')).toBe(REMOTE_IMG);
    });
  });
});
