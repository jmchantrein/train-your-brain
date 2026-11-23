/**
 * Licences et auteurs des enregistrements Lingua Libre / Wikimedia Commons (audit de publication C3)
 *
 * Chaque locuteur choisit sa licence : on ne présume jamais CC0. La licence et l'auteur renvoyés par
 * l'API sont conservés, affichés et exportés avec le deck ; une licence inconnue reste « inconnue ».
 * La structure de réponse simulée est celle que lit déjà LinguaLibre._getCommonsFileUrl
 * (action=query&prop=imageinfo&iiprop=url|extmetadata) : non confirmée contre le service réel.
 */

describe('LinguaLibre - licences et auteurs des enregistrements (C3)', () => {
  const realFetch = globalThis.fetch;
  afterEach(() => { globalThis.fetch = realFetch; });

  function commonsResponse(extmetadata) {
    return {
      ok: true,
      json: async () => ({
        query: { pages: { '1': { imageinfo: [{ url: 'https://upload.wikimedia.org/x/LL-Q150-Spk-chat.ogg', descriptionurl: 'https://commons.wikimedia.org/wiki/File:LL-Q150-Spk-chat.ogg', extmetadata }] } } }
      })
    };
  }

  describe('cleanAttribution', () => {
    it('should reduce the HTML Artist field of Commons to plain text', () => {
      const html = '<a href="//commons.wikimedia.org/wiki/User:Foo" title="User:Foo">Foo &amp; Bar</a>';
      expect(LinguaLibre.cleanAttribution(html)).toBe('Foo & Bar');
    });

    it('should never keep markup', () => {
      const text = LinguaLibre.cleanAttribution('<script>window.__xss=1</script><b>Ana</b>');
      expect(text).not.toContain('<');
    });

    it('should return null for empty, missing or placeholder values', () => {
      expect(LinguaLibre.cleanAttribution('')).toBeNull();
      expect(LinguaLibre.cleanAttribution(undefined)).toBeNull();
      expect(LinguaLibre.cleanAttribution('   ')).toBeNull();
    });
  });

  describe('_getCommonsFileUrl', () => {
    it('should keep the license and the author returned by the API', async () => {
      globalThis.fetch = async () => commonsResponse({
        LicenseShortName: { value: 'CC BY-SA 4.0' },
        Artist: { value: '<a href="//x" title="User:Spk">Spk</a>' }
      });
      const info = await LinguaLibre._getCommonsFileUrl('File:LL-Q150-Spk-chat.ogg');
      expect(info.license).toBe('CC BY-SA 4.0');
      expect(info.artist).toBe('Spk');
      expect(info.url).toContain('upload.wikimedia.org');
    });

    it('should report an unknown license as unknown, never as CC0', async () => {
      globalThis.fetch = async () => commonsResponse({});
      const info = await LinguaLibre._getCommonsFileUrl('File:x.ogg');
      expect(info.license).toBe(LinguaLibre.UNKNOWN_LICENSE);
      expect(info.license).not.toBe('CC0');
      expect(info.artist).toBeNull();
    });
  });

  describe('audioAttribution', () => {
    it('should keep license and author of the recording', () => {
      const a = LinguaLibre.audioAttribution({ license: 'CC BY 4.0', artist: 'Jeanne', sourceUrl: 'https://commons.wikimedia.org/wiki/File:a.ogg' });
      expect(a.license).toBe('CC BY 4.0');
      expect(a.artist).toBe('Jeanne');
      expect(a.sourceUrl).toBe('https://commons.wikimedia.org/wiki/File:a.ogg');
    });

    it('should record a missing license as unknown, not CC0', () => {
      for (const info of [{}, { license: '' }, { license: null }, { license: '  ' }]) {
        expect(LinguaLibre.audioAttribution(info).license).toBe(LinguaLibre.UNKNOWN_LICENSE);
      }
    });

    it('should not keep a non-http(s) source URL', () => {
      expect(LinguaLibre.audioAttribution({ sourceUrl: 'javascript:alert(1)' }).sourceUrl).toBeUndefined();
    });

    it('should describe an attribution as a short line for display', () => {
      expect(LinguaLibre.describeAttribution({ license: 'CC BY 4.0', artist: 'Jeanne' })).toBe('Jeanne - CC BY 4.0');
      expect(LinguaLibre.describeAttribution({ license: 'Unknown' })).toContain('inconnue');
      expect(LinguaLibre.describeAttribution(null)).toBe('');
    });
  });

  describe('decks generated', () => {
    const origFind = LinguaLibre.findAudio;
    const origDownload = LinguaLibre.downloadAsBase64;
    const origWords = LinguaLibre.getWordsFromList;
    const origTrans = LinguaLibre.getTranslations;
    afterEach(() => {
      LinguaLibre.findAudio = origFind;
      LinguaLibre.downloadAsBase64 = origDownload;
      LinguaLibre.getWordsFromList = origWords;
      LinguaLibre.getTranslations = origTrans;
    });

    it('should store license and author in a dictation card, and unknown when absent', async () => {
      const answers = [
        { url: 'u1', license: 'CC BY 4.0', artist: 'Ana' },
        { url: 'u2' }
      ];
      let i = 0;
      LinguaLibre.findAudio = async () => answers[i++];
      LinguaLibre.downloadAsBase64 = async () => ({ data: 'AAAA', format: 'ogg' });
      const { deck } = await LinguaLibre.generateDictationDeck(['chat', 'chien'], 'fr', { name: 'd' });
      expect(deck.cards[0].media.license).toBe('CC BY 4.0');
      expect(deck.cards[0].media.artist).toBe('Ana');
      expect(deck.cards[1].media.license).toBe(LinguaLibre.UNKNOWN_LICENSE);
    });

    it('should store license and author of a vocabulary audio, and unknown when absent', async () => {
      LinguaLibre.getWordsFromList = async () => ({ words: [{ word: 'chat', transcription: 'chat' }], stats: { totalCandidates: 1 } });
      LinguaLibre.getTranslations = async () => ({ fr: 'chat', en: 'cat' });
      LinguaLibre.findAudio = async (text, lang) => (lang === 'fr' ? { url: 'u', license: 'CC BY-SA 4.0', artist: 'Ana' } : { url: 'u2' });
      LinguaLibre.downloadAsBase64 = async () => ({ data: 'AAAA', format: 'ogg' });
      const { deck } = await LinguaLibre.generateMultilingualDeck('List:Fra/Animaux', ['fr', 'en'], {});
      const t = deck.words[0].translations;
      expect(t.fr.audio.license).toBe('CC BY-SA 4.0');
      expect(t.fr.audio.artist).toBe('Ana');
      expect(t.en.audio.license).toBe(LinguaLibre.UNKNOWN_LICENSE);
    });

    it('should list the attribution of every recording of a deck', () => {
      const lines = LinguaLibre.listAttributions({
        type: 'multilingual',
        words: [{ id: 'chat', translations: { fr: { text: 'chat', audio: { license: 'CC BY 4.0', artist: 'Ana' } }, en: { text: 'cat' } } }]
      });
      expect(lines.length).toBe(1);
      expect(lines[0]).toEqual({ word: 'chat', lang: 'fr', license: 'CC BY 4.0', artist: 'Ana', sourceUrl: undefined });
      const dict = LinguaLibre.listAttributions({ cards: [{ answer: 'chien', media: { type: 'audio', license: 'CC0', artist: 'Bo' } }, { answer: 'x' }] });
      expect(dict.length).toBe(1);
      expect(dict[0].word).toBe('chien');
    });
  });

  describe('Export avec le deck', () => {
    const multi = {
      id: 'v', name: 'v', type: 'multilingual', languages: ['fr'],
      words: [{ id: 'chat', translations: { fr: { text: 'chat', audio: { format: 'ogg', data: 'AAAA', license: 'CC BY 4.0', artist: 'Ana "A" <b>' } } } }]
    };

    it('should export the license and the author in the multilingual JSON', () => {
      const json = JSON.parse(Exporter.toJSON(multi));
      const t = json.words[0].translations.fr;
      expect(t.audioLicense).toBe('CC BY 4.0');
      expect(t.audioArtist).toBe('Ana "A" <b>');
    });

    it('should export the license and the author in the multilingual YAML', () => {
      const yaml = Exporter.toYAML(multi);
      expect(yaml).toContain('audioLicense: "CC BY 4.0"');
      expect(yaml).toContain('audioArtist: "Ana \\"A\\" <b>"');
    });

    it('should export unknown license rather than omitting it', () => {
      const deck = { ...multi, words: [{ id: 'c', translations: { fr: { text: 'c', audio: { format: 'ogg', data: 'AAAA' } } } }] };
      const json = JSON.parse(Exporter.toJSON(deck));
      expect(json.words[0].translations.fr.audioLicense).toBe(LinguaLibre.UNKNOWN_LICENSE);
    });

    it('should export the license and the author of a dictation card', () => {
      const deck = { id: 'd', name: 'd', cards: [{ id: 'c', question: 'q', answer: 'a', type: 'text', media: { type: 'audio', format: 'ogg', data: 'AAAA', license: 'CC0', artist: 'Bo' } }] };
      const json = JSON.parse(Exporter.toJSON(deck));
      expect(json.cards[0].mediaLicense).toBe('CC0');
      expect(json.cards[0].mediaArtist).toBe('Bo');
      const yaml = Exporter.toYAML(deck);
      expect(yaml).toContain('mediaLicense: "CC0"');
      expect(yaml).toContain('mediaArtist: "Bo"');
    });
  });

  describe('Texte de l\'interface', () => {
    const EXPECTED = 'enregistrements sous licence libre, auteur et licence indiqués pour chaque mot';

    it('should not announce CC0 in the dictation form', () => {
      if (typeof PromptGeneratorDictation === 'undefined') return;
      const html = PromptGeneratorDictation.renderForm({ deckName: '', lang: 'fr' }, { fr: 'Français' });
      expect(html).toContain(EXPECTED);
      expect(html).not.toContain('(CC0)');
    });

    it('should not announce CC0 in the multilingual form', () => {
      if (typeof PromptGeneratorMultilingual === 'undefined') return;
      const html = PromptGeneratorMultilingual.renderForm({ deckName: '', sourceLang: 'fr', targetLangs: [] });
      expect(html).toContain(EXPECTED);
      expect(html).not.toContain('(CC0)');
    });
  });

  describe('Affichage dans les aperçus de résultat', () => {
    it('should show author and license of each recording in the dictation result', () => {
      if (typeof PromptGeneratorDictation === 'undefined') return;
      const deck = { name: 'd', cards: [{ answer: 'chat', media: { type: 'audio', license: 'CC BY 4.0', artist: 'Ana <b>x</b>' } }] };
      const html = PromptGeneratorDictation.renderResult(deck, []);
      expect(html).toContain('CC BY 4.0');
      expect(html).toContain('Ana');
      expect(html).not.toContain('<b>x</b>');
    });

    it('should show author and license of each recording in the multilingual result', () => {
      if (typeof PromptGeneratorMultilingual === 'undefined') return;
      const deck = { name: 'v', languages: ['fr'], words: [{ id: 'c', translations: { fr: { text: 'chat', audio: { license: 'CC BY-SA 4.0', artist: 'Ana' } } } }] };
      const html = PromptGeneratorMultilingual.renderResult(deck, []);
      expect(html).toContain('CC BY-SA 4.0');
      expect(html).toContain('Ana');
    });
  });
});
