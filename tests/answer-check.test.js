/**
 * Tests de la vérification de réponse partagée par le jeu, l'examen et le défi
 *
 * - GameAnswerValidator.checkAnswer : point d'entrée unique (sans effet sur la session)
 * - le champ `alternatives` des cartes est accepté comme bonne réponse
 * - Pages.exam / Pages.challengeGame valident une réponse sans lever d'exception
 * - PromptGeneratorMultilingual.save enregistre réellement le deck
 */

describe('GameAnswerValidator.checkAnswer', () => {
  it('should return a boolean for a text card', () => {
    const card = { id: 'c1', question: 'Capitale de la France ?', answer: 'Paris' };
    expect(GameAnswerValidator.checkAnswer(card, 'paris')).toBe(true);
    expect(GameAnswerValidator.checkAnswer(card, 'Lyon')).toBe(false);
  });

  it('should accept card.alternatives', () => {
    const card = { id: 'c2', question: '2 en binaire ?', answer: '10', alternatives: ['0b10', '00000010'] };
    expect(GameAnswerValidator.checkAnswer(card, '10')).toBe(true);
    expect(GameAnswerValidator.checkAnswer(card, '0b10')).toBe(true);
    expect(GameAnswerValidator.checkAnswer(card, '00000010')).toBe(true);
    expect(GameAnswerValidator.checkAnswer(card, '11')).toBe(false);
  });

  it('should still accept the main answer when acceptedAnswers is set', () => {
    const card = { id: 'c3', question: 'Frapper ?', answer: 'hit', acceptedAnswers: ['strike'] };
    expect(GameAnswerValidator.checkAnswer(card, 'hit')).toBe(true);
    expect(GameAnswerValidator.checkAnswer(card, 'strike')).toBe(true);
    expect(GameAnswerValidator.checkAnswer(card, 'kick')).toBe(false);
  });

  it('should honour deck similarity settings', () => {
    const card = { id: 'c4', question: 'Capitale ?', answer: 'Ouagadougou' };
    const deck = { settings: { similarityMatching: true, similarityThreshold: 0.8 } };
    expect(GameAnswerValidator.checkAnswer(card, 'Ouagadougu', deck)).toBe(true);
    expect(GameAnswerValidator.checkAnswer(card, 'Ouagadougu')).toBe(false);
  });

  it('should validate numeric cards with tolerance', () => {
    const card = { id: 'c5', type: 'numeric', question: '√2 ?', answer: '1.41', tolerance: 0.01 };
    expect(GameAnswerValidator.checkAnswer(card, '1.414')).toBe(true);
    expect(GameAnswerValidator.checkAnswer(card, '1.5')).toBe(false);
  });
});

describe('Pages.exam - validation de réponse', () => {
  it('should record a correct answer without throwing', () => {
    const container = document.createElement('div');
    container.innerHTML = '<input id="exam-answer" value="Paris">';
    State.set('decks', []);
    State.set('currentExam', {
      deckId: 'd1',
      cards: [{ id: 'c1', question: 'Capitale de la France ?', answer: 'Paris', points: 2 }],
      currentIndex: 0,
      results: [],
      currentScore: 0,
      stats: { cardsAnswered: 0, correctAnswers: 0, wrongAnswers: 0 },
      isShowingFeedback: false
    });

    const originalMount = Pages.exam.mount;
    Pages.exam.mount = () => {};
    try {
      Pages.exam._submitAnswer(container);
    } finally {
      Pages.exam.mount = originalMount;
    }

    const exam = State.get('currentExam');
    expect(exam.results.length).toBe(1);
    expect(exam.results[0].isCorrect).toBe(true);
    expect(exam.currentScore).toBe(2);
  });
});

describe('Pages.challengeGame - validation de réponse', () => {
  it('should validate answers through the same path as a normal session', () => {
    // Un défi est une séance normale avec un objectif : la page hérite de Pages.game
    // et ne redéfinit pas la validation des réponses.
    expect(Object.getPrototypeOf(Pages.challengeGame)).toBe(Pages.game);
    const own = Object.keys(Pages.challengeGame)
      .filter(key => typeof Pages.challengeGame[key] === 'function')
      .map(key => String(Pages.challengeGame[key]))
      .join('\n');
    expect(own.includes('Validator.check(')).toBe(false);
    expect(own.includes('Validator.validateAnswer(')).toBe(false);
  });
});

describe('PromptGeneratorMultilingual.save', () => {
  it('should persist the multilingual deck', () => {
    const deck = {
      id: 'ml-test-deck',
      name: 'Animaux',
      type: 'multilingual',
      languages: ['fr', 'en'],
      words: [{ id: 'chat', translations: { fr: { text: 'chat' }, en: { text: 'cat' } } }]
    };
    State.set('decks', []);

    PromptGeneratorMultilingual.save(deck);

    const saved = Storage.loadCustomDecks() || [];
    expect(saved.some(d => d.id === 'ml-test-deck')).toBe(true);
    expect(State.get('decks').some(d => d.id === 'ml-test-deck')).toBe(true);
  });
});

describe('LaTeX.toHtml - erreur KaTeX', () => {
  it('should escape quotes and tags in the error span (attribute context)', () => {
    const hadKatex = typeof katex !== 'undefined';
    const saved = hadKatex ? katex : undefined;
    const original = console.warn;
    const stub = { renderToString() { throw new Error('bad "x" \'y\' <z>'); } };
    globalThis.katex = stub;
    if (typeof window !== 'undefined') window.katex = stub;
    console.warn = () => {};
    try {
      const out = LaTeX.toHtml('a"b\'c<d>');
      const root = document.createElement('div');
      root.innerHTML = out;
      const span = root.querySelector('.katex-error');
      expect(span.getAttribute('title')).toBe('bad "x" \'y\' <z>');
      expect(span.textContent).toBe('a"b\'c<d>');
      expect(root.querySelectorAll('*').length).toBe(1);
    } finally {
      console.warn = original;
      if (hadKatex) { globalThis.katex = saved; if (typeof window !== 'undefined') window.katex = saved; }
      else { delete globalThis.katex; if (typeof window !== 'undefined') delete window.katex; }
    }
  });
});

describe('YAML._createMediaPlaceholder', () => {
  it('should ignore non-string media instead of throwing', () => {
    expect(YAML._createMediaPlaceholder({ type: 'image', data: 'x' })).toBe(null);
  });
});

describe('Pages.game._renderCardMedia - SVG de deck', () => {
  const srcOf = (svg) => {
    const root = document.createElement('div');
    root.innerHTML = Pages.game._renderCardMedia({ media: { type: 'image', format: 'svg', data: svg } });
    const img = root.querySelector('.game__card-image--svg img');
    return decodeURIComponent(img.getAttribute('src').split(',').slice(1).join(','));
  };

  it('should add the SVG namespace when missing (sinon <img> affiche une image cassée)', () => {
    const svg = srcOf('<svg viewBox="0 0 100 50"><circle cx="5" cy="5" r="4"/></svg>');
    expect(svg.includes('xmlns="http://www.w3.org/2000/svg"')).toBe(true);
  });

  it('should give an intrinsic size from the viewBox when width/height are missing', () => {
    const svg = srcOf('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><circle cx="5" cy="5" r="4"/></svg>');
    expect(/<svg[^>]*\swidth="100"/.test(svg)).toBe(true);
    expect(/<svg[^>]*\sheight="50"/.test(svg)).toBe(true);
  });

  it('should leave a complete SVG unchanged', () => {
    const original = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20" viewBox="0 0 100 50"><rect width="10" height="10"/></svg>';
    expect(srcOf(original)).toBe(original);
  });
});
