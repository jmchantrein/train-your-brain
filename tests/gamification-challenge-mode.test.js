/**
 * Tests du mode défi intégré (docs/GAMIFICATION.md, section « Mode défi »)
 *
 * Un défi est une autre façon de faire ses révisions : mêmes cartes que la séance normale
 * (Leitner.getCardsForSession), même chemin de progression (GameAnswerValidator,
 * GameSessionManager), bonus borné (3 XP au plus une fois par jour, tous modes confondus), aucune
 * mécanique de perte, quatre modes (Parcours, Sans erreur, Contre la montre, Jusqu'au bout),
 * entraînement libre quand il n'y a rien à réviser (rien d'enregistré).
 */

const CM = {
  today: null,
  origNavigate: Router.navigate,
  origBadgeMultiple: Effects.badgePopup.showMultiple,
  origBadgeOne: Effects.badgePopup.show,
  origLevelShow: Effects.levelUp.show,
  navigations: [],

  makeCard(deckId, i, extra = {}) {
    return {
      id: `${deckId}_c${i}`, question: `Q${i}`, answer: `A${i}`, type: 'text',
      box: 'never_played', latencyThreshold: null, restUntil: null, restDays: 0,
      timesPlayed: 0, timesCorrect: 0, bestResponseTimeMs: null, lastResponseTimeMs: null,
      ...extra
    };
  },

  /** Deck séquentiel : `due` cartes violettes (à réviser), `resting` cartes vertes au repos, `fresh` jamais jouées */
  makeDeck(id, { due = 0, resting = 0, fresh = 0, extra = {} } = {}) {
    const cards = [];
    let i = 0;
    for (let k = 0; k < due; k++) cards.push(CM.makeCard(id, i++, { box: 'purple', timesPlayed: 1, latencyThreshold: 3 }));
    for (let k = 0; k < resting; k++) {
      cards.push(CM.makeCard(id, i++, {
        box: 'green', timesPlayed: 2, timesCorrect: 2, latencyThreshold: 3, restDays: 3,
        restUntil: TextUtils.addDays(CM.today, 3)
      }));
    }
    for (let k = 0; k < fresh; k++) cards.push(CM.makeCard(id, i++));
    return { id, name: `Deck ${id}`, tags: ['maths'], settings: { sequential: true }, ...extra, cards };
  },

  makePlayer(settings = {}, stats = {}) {
    return {
      id: 'p_cm', name: 'CM', badges: [], settings,
      stats: {
        totalXP: 0, totalCardsPlayed: 0, totalSessions: 0, currentStreak: 0, longestStreak: 0,
        longestGreenStreak: 0, totalGreenCards: 0, lastPlayedAt: null, fastestCorrectAnswer: Infinity,
        uniqueDecksPlayed: 0, playedDeckIds: [], cardsBySubject: {}, xpHistory: [], ...stats
      }
    };
  },

  /** Séance normale (même création que App._startGame) */
  normalSession(deck) {
    const cards = Leitner.getCardsForSession(deck, { today: CM.today, maxCards: 100, sequential: true });
    return {
      deckId: deck.id, cards, currentIndex: 0, isShowingFeedback: false, cardStartTime: Date.now(),
      startedAt: new Date().toISOString(), endedAt: null, results: [],
      stats: { cardsPlayed: 0, correctAnswers: 0, currentGreenStreak: 0, maxGreenStreak: 0, totalXpEarned: 0 }
    };
  },

  challengeSession(options, deck, player) {
    return Challenges.createChallengeSession(options, deck, CM.today, player || CM.makePlayer());
  },

  /** Joue la séance : une réponse par entrée, par le vrai chemin (validate puis nextCard) */
  play(session, player, decks, outcomes, responseMs = 2000) {
    const state = { player, decks, currentSession: session };
    State.set('decks', decks);
    for (let i = 0; i < outcomes.length && session.currentIndex < session.cards.length; i++) {
      const card = session.cards[session.currentIndex];
      session.cardStartTime = Date.now() - responseMs;
      GameAnswerValidator.validate(state, outcomes[i] ? card.answer : 'zzz-faux');
      GameSessionManager.nextCard(state);
    }
    return session;
  },

  /** Texte français d'une clé, tel qu'il apparaît dans le HTML (échappé) */
  fr(key, params = {}) {
    let text = i18n._translations.fr[key];
    Object.keys(params).forEach(k => { text = text.replace(`{${k}}`, params[k]); });
    return escapeHtml(text);
  },

  /** Chaque propriété de `subset` est égale dans `actual` */
  expectMatch(actual, subset) {
    Object.keys(subset).forEach(key => expect(actual[key]).toEqual(subset[key]));
  },

  snapshotCards(deck) {
    return JSON.stringify(deck.cards.map(c => [c.id, c.box, c.restUntil, c.restDays, c.timesPlayed, c.timesCorrect, c.latencyThreshold]));
  }
};

describe('Mode défi intégré', () => {
  beforeEach(() => {
    CM.today = TextUtils.getToday();
    CM.navigations = [];
    Router.navigate = (path) => { CM.navigations.push(path); };
    Effects.badgePopup.showMultiple = () => {};
    Effects.badgePopup.show = () => {};
    Effects.levelUp.show = () => {};
  });

  afterEach(() => {
    Router.navigate = CM.origNavigate;
    Effects.badgePopup.showMultiple = CM.origBadgeMultiple;
    Effects.badgePopup.show = CM.origBadgeOne;
    Effects.levelUp.show = CM.origLevelShow;
  });

  // ═══════════════════════════════════════════════════════════════
  // Modes et niveaux
  // ═══════════════════════════════════════════════════════════════

  describe('Modes retenus', () => {
    it('has four modes: steady (Parcours), perfect (Sans erreur), speed (Contre la montre), endurance (Jusqu\'au bout)', () => {
      expect(Object.keys(Challenges.CHALLENGE_MODES)).toEqual(['steady', 'perfect', 'speed', 'endurance']);
    });

    it('has no lives, no per-card timeout and no time bonus in any rule', () => {
      const json = JSON.stringify(Challenges.CHALLENGE_MODES);
      expect(json).not.toContain('lives');
      expect(json).not.toContain('Lives');
      expect(json).not.toContain('timeBonus');
      expect(json).not.toContain('timePerCard');
    });

    it('sizes the four levels 5 / 8 / 12 / 15 cards for steady, perfect and speed', () => {
      ['steady', 'perfect', 'speed'].forEach(mode => {
        const sizes = ['easy', 'medium', 'hard', 'expert'].map(d => Challenges.CHALLENGE_MODES[mode].rules[d].cardsCount);
        expect(sizes).toEqual([5, 8, 12, 15]);
      });
    });

    it('asks for an accuracy in steady, a run in perfect, a number of correct answers in speed, never more than the cards', () => {
      const steady = Challenges.CHALLENGE_MODES.steady.rules;
      expect(['easy', 'medium', 'hard', 'expert'].map(d => steady[d].minAccuracy)).toEqual([60, 70, 80, 90]);
      const perfect = Challenges.CHALLENGE_MODES.perfect.rules;
      const speed = Challenges.CHALLENGE_MODES.speed.rules;
      ['easy', 'medium', 'hard', 'expert'].forEach(d => {
        expect(perfect[d].targetRun).toBeLessThanOrEqual(perfect[d].cardsCount);
        expect(speed[d].targetCorrect).toBeLessThan(speed[d].cardsCount);
      });
      expect(perfect.expert.targetRun).toBe(perfect.expert.cardsCount);
      expect(['easy', 'medium', 'hard', 'expert'].map(d => speed[d].targetCorrect)).toEqual([3, 6, 10, 14]);
      // Contre la montre = Parcours avec une limite de temps : jamais plus facile que Parcours
      ['easy', 'medium', 'hard', 'expert'].forEach(d => {
        expect(speed[d].targetCorrect).toBe(Math.ceil(steady[d].cardsCount * steady[d].minAccuracy / 100));
        expect(speed[d].cardsCount).toBe(steady[d].cardsCount);
      });
    });

    it('endurance has no card count of its own: only an accuracy to hold, same as the steady ladder', () => {
      const rules = Challenges.CHALLENGE_MODES.endurance.rules;
      expect(['easy', 'medium', 'hard', 'expert'].map(d => rules[d].minAccuracy)).toEqual([60, 70, 80, 90]);
      expect(JSON.stringify(rules)).not.toContain('cardsCount');
      expect(Challenges.ENDURANCE_MIN_DUE).toBe(20);
      expect(Challenges.ENDURANCE_MIN_DUE).toBeGreaterThan(Challenges.CHALLENGE_MODES.steady.rules.expert.cardsCount);
    });

    it('resolves mode ids, the old streak link goes to Sans erreur, a timed steady link to Contre la montre', () => {
      expect(Challenges.resolveMode('steady')).toEqual({ modeId: 'steady', practice: false });
      expect(Challenges.resolveMode('perfect')).toEqual({ modeId: 'perfect', practice: false });
      expect(Challenges.resolveMode('speed')).toEqual({ modeId: 'speed', practice: false });
      expect(Challenges.resolveMode('endurance')).toEqual({ modeId: 'endurance', practice: false });
      expect(Challenges.resolveMode('practice')).toEqual({ modeId: 'steady', practice: true });
      expect(Challenges.resolveMode('streak')).toEqual({ modeId: 'perfect', practice: false });
      expect(Challenges.resolveMode('steady', 'timed')).toEqual({ modeId: 'speed', practice: false });
      expect(Challenges.resolveMode('perfect', 'timed')).toEqual({ modeId: 'perfect', practice: false });
      expect(Challenges.resolveMode('inconnu')).toBeNull();
      expect(Challenges.resolveMode(undefined)).toBeNull();
    });

    it('offers a level only when the deck has at least as many cards to review', () => {
      expect(Challenges.availableTiers(0)).toEqual([]);
      expect(Challenges.availableTiers(4)).toEqual([]);
      expect(Challenges.availableTiers(5)).toEqual(['easy']);
      expect(Challenges.availableTiers(11)).toEqual(['easy', 'medium']);
      expect(Challenges.availableTiers(15)).toEqual(['easy', 'medium', 'hard', 'expert']);
      expect(Challenges.availableTiers(11, 'speed')).toEqual(['easy', 'medium']);
    });

    it('endurance offers its four levels only from 20 cards to review, never below', () => {
      expect(Challenges.availableTiers(15, 'endurance')).toEqual([]);
      expect(Challenges.availableTiers(19, 'endurance')).toEqual([]);
      expect(Challenges.availableTiers(20, 'endurance')).toEqual(['easy', 'medium', 'hard', 'expert']);
    });

    it('lists the modes a deck and a player can take: Contre la montre needs the timer allowed, Jusqu\'au bout 20 cards', () => {
      const p = CM.makePlayer();
      expect(Challenges.availableModes(0, p)).toEqual([]);
      expect(Challenges.availableModes(9, p)).toEqual(['steady', 'perfect', 'speed']);
      expect(Challenges.availableModes(20, p)).toEqual(['steady', 'perfect', 'speed', 'endurance']);
      expect(Challenges.availableModes(20, CM.makePlayer({ dyslexiaMode: true }))).toEqual(['steady', 'perfect', 'endurance']);
      expect(Challenges.availableModes(9, CM.makePlayer({ largeSpacing: true }))).toEqual(['steady', 'perfect']);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Chronomètre et accessibilité
  // ═══════════════════════════════════════════════════════════════

  describe('Contre la montre : chronomètre et accessibilité', () => {
    const speed = (difficulty, deck, player) => CM.challengeSession({ modeId: 'speed', difficulty }, deck, player);

    it('is not allowed with dyslexia mode or large spacing, allowed otherwise', () => {
      expect(Challenges.timerAllowed(CM.makePlayer({}))).toBe(true);
      expect(Challenges.timerAllowed(CM.makePlayer({ dyslexiaMode: true }))).toBe(false);
      expect(Challenges.timerAllowed(CM.makePlayer({ largeSpacing: true }))).toBe(false);
      expect(Challenges.timerAllowed(null)).toBe(true);
    });

    it('is not created for a player with dyslexia mode or large spacing: no timed challenge at all', () => {
      const deck = CM.makeDeck('d', { due: 9 });
      expect(speed('easy', deck, CM.makePlayer({ dyslexiaMode: true }))).toBeNull();
      expect(speed('easy', deck, CM.makePlayer({ largeSpacing: true }))).toBeNull();
      expect(speed('easy', deck, CM.makePlayer())).not.toBeNull();
    });

    it('only Contre la montre has a clock: the other modes never get a budget', () => {
      const deck = CM.makeDeck('d', { due: 25 });
      ['steady', 'perfect', 'endurance'].forEach(modeId => {
        const s = CM.challengeSession({ modeId, difficulty: 'easy', timed: true }, deck);
        expect(s.challenge.timed).toBe(false);
        expect(s.challenge.timeBudgetMs).toBeNull();
        expect(Challenges.remainingMs(s, Date.now())).toBeNull();
      });
    });

    it('gives one budget for the whole challenge: cards x seconds per card of the level', () => {
      const deck = CM.makeDeck('d', { due: 20 });
      const budget = (difficulty) => speed(difficulty, deck).challenge.timeBudgetMs;
      expect(budget('easy')).toBe(5 * 30000);
      expect(budget('medium')).toBe(8 * 20000);
      expect(budget('hard')).toBe(12 * 15000);
      expect(budget('expert')).toBe(15 * 10000);
      expect(speed('easy', deck).challenge.timed).toBe(true);
    });

    it('counts down over the whole challenge: it does not restart at each card', () => {
      const s = speed('easy', CM.makeDeck('d', { due: 6 }));
      const t0 = 1000000;
      s.cardStartTime = t0;
      expect(Challenges.remainingMs(s, t0 + 10000)).toBe(150000 - 10000);
      // première carte répondue en 12 s, deuxième carte affichée depuis 5 s
      s.results.push({ cardId: 'a', isCorrect: true, responseTimeMs: 12000 });
      s.isShowingFeedback = true;
      expect(Challenges.remainingMs(s, t0 + 30000)).toBe(150000 - 12000);
      s.isShowingFeedback = false;
      s.cardStartTime = t0 + 20000;
      expect(Challenges.remainingMs(s, t0 + 25000)).toBe(150000 - 12000 - 5000);
    });

    it('does not tick during the feedback of a card', () => {
      const s = speed('easy', CM.makeDeck('d', { due: 6 }));
      s.results.push({ cardId: 'a', isCorrect: false, responseTimeMs: 4000 });
      s.isShowingFeedback = true;
      expect(Challenges.remainingMs(s, Date.now() + 99999)).toBe(150000 - 4000);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Création : les cartes sont celles de la séance normale
  // ═══════════════════════════════════════════════════════════════

  describe('createChallengeSession', () => {
    it('takes the first cards that Leitner.getCardsForSession proposes (never_played, purple, orange)', () => {
      const deck = CM.makeDeck('d', { due: 4, fresh: 4 });
      deck.cards.push(CM.makeCard('d', 99, { box: 'orange', timesPlayed: 2 }));
      const expected = Leitner.getCardsForSession(deck, { today: CM.today, maxCards: 100, sequential: true }).slice(0, 5).map(c => c.id);
      const s = CM.challengeSession({ modeId: 'steady', difficulty: 'easy' }, deck);
      expect(s.cards.map(c => c.id)).toEqual(expected);
      expect(s.cards).toHaveLength(5);
    });

    it('never proposes a green card that is resting', () => {
      const deck = CM.makeDeck('d', { due: 6, resting: 10 });
      const s = CM.challengeSession({ modeId: 'steady', difficulty: 'easy' }, deck);
      expect(s.cards.every(c => c.box !== 'green')).toBe(true);
    });

    it('is a normal session with a challenge description', () => {
      const s = CM.challengeSession({ modeId: 'perfect', difficulty: 'medium' }, CM.makeDeck('d', { due: 10 }));
      expect(s.deckId).toBe('d');
      expect(s.currentIndex).toBe(0);
      expect(s.results).toEqual([]);
      expect(s.stats).toEqual({ cardsPlayed: 0, correctAnswers: 0, currentGreenStreak: 0, maxGreenStreak: 0, totalXpEarned: 0 });
      expect(s.challenge.modeId).toBe('perfect');
      expect(s.challenge.difficulty).toBe('medium');
      expect(s.challenge.practice).toBe(false);
      expect(s.challenge.plannedCards).toBe(8);
      expect(s.challenge.target).toEqual({ run: 6 });
      expect(s.challenge.multiplier).toBe(1.5);
    });

    it('returns null when the deck has fewer cards to review than the level needs (never a shortened challenge)', () => {
      expect(CM.challengeSession({ modeId: 'steady', difficulty: 'medium' }, CM.makeDeck('d', { due: 6 }))).toBeNull();
      expect(CM.challengeSession({ modeId: 'steady', difficulty: 'easy' }, CM.makeDeck('d', { due: 4 }))).toBeNull();
    });

    it('returns null for an unknown mode, an unknown level, a multilingual deck or no deck', () => {
      const deck = CM.makeDeck('d', { due: 20 });
      expect(CM.challengeSession({ modeId: 'inconnu', difficulty: 'easy' }, deck)).toBeNull();
      expect(CM.challengeSession({ modeId: 'steady', difficulty: 'impossible' }, deck)).toBeNull();
      expect(CM.challengeSession({ modeId: 'steady', difficulty: 'easy' }, { ...deck, type: 'multilingual' })).toBeNull();
      expect(CM.challengeSession({ modeId: 'steady', difficulty: 'easy' }, null)).toBeNull();
    });

    it('endurance takes ALL the cards to review, in the order of the normal session, and nothing else', () => {
      const deck = CM.makeDeck('d', { due: 22, resting: 6, fresh: 3 });
      const expected = Leitner.getCardsForSession(deck, { today: CM.today, maxCards: 100, sequential: true }).map(c => c.id);
      const s = CM.challengeSession({ modeId: 'endurance', difficulty: 'medium' }, deck);
      expect(s.cards.map(c => c.id)).toEqual(expected);
      expect(s.challenge.plannedCards).toBe(expected.length);
      expect(s.cards.some(c => c.box === 'green')).toBe(false); // jamais une carte au repos
      expect(s.challenge.target).toEqual({ accuracy: 70, halves: true });
      expect(s.challenge.multiplier).toBe(1.5);
    });

    it('endurance respects the deck cap maxCards: no more cards than a normal session', () => {
      const deck = CM.makeDeck('d', { due: 40, extra: { settings: { sequential: true, maxCards: 25 } } });
      const s = CM.challengeSession({ modeId: 'endurance', difficulty: 'easy' }, deck);
      expect(s.cards).toHaveLength(25);
      const small = CM.makeDeck('d2', { due: 40, extra: { settings: { sequential: true, maxCards: 12 } } });
      expect(CM.challengeSession({ modeId: 'endurance', difficulty: 'easy' }, small)).toBeNull(); // sous le seuil : pas proposé
    });

    it('endurance is refused below 20 cards to review (a Steady run covers that)', () => {
      expect(CM.challengeSession({ modeId: 'endurance', difficulty: 'easy' }, CM.makeDeck('d', { due: 19, resting: 30 }))).toBeNull();
      expect(CM.challengeSession({ modeId: 'endurance', difficulty: 'easy' }, CM.makeDeck('d', { due: 20 }))).not.toBeNull();
    });

    it('speed asks for a number of correct answers within the budget', () => {
      const s = CM.challengeSession({ modeId: 'speed', difficulty: 'hard' }, CM.makeDeck('d', { due: 14 }));
      expect(s.challenge.plannedCards).toBe(12);
      expect(s.challenge.target).toEqual({ correct: 10 });
      expect(s.challenge.timed).toBe(true);
    });

    it('lists the cards to review of a deck for the setup page', () => {
      const deck = CM.makeDeck('d', { due: 3, resting: 4, fresh: 2 });
      expect(Challenges.dueChallengeCards(deck, CM.today)).toHaveLength(5);
      expect(Challenges.restingCards(deck, CM.today)).toHaveLength(4);
    });
  });

  describe('Entraînement libre (rien à réviser)', () => {
    it('is possible only when no card is to review, on resting cards', () => {
      const deck = CM.makeDeck('d', { resting: 12 });
      const s = CM.challengeSession({ modeId: 'steady', practice: true }, deck);
      expect(s.challenge.practice).toBe(true);
      expect(s.cards).toHaveLength(10);
      expect(s.cards.every(c => c.box === 'green')).toBe(true);
    });

    it('takes all resting cards when there are fewer than 10', () => {
      const s = CM.challengeSession({ modeId: 'steady', practice: true }, CM.makeDeck('d', { resting: 3 }));
      expect(s.cards).toHaveLength(3);
    });

    it('is refused while something is to review: the rest of a card is never short-circuited', () => {
      expect(CM.challengeSession({ modeId: 'steady', practice: true }, CM.makeDeck('d', { due: 1, resting: 8 }))).toBeNull();
      expect(CM.challengeSession({ modeId: 'steady', practice: true }, CM.makeDeck('d', { fresh: 2, resting: 8 }))).toBeNull();
    });

    it('is refused when there is no card to practice at all', () => {
      expect(CM.challengeSession({ modeId: 'steady', practice: true }, CM.makeDeck('d', {}))).toBeNull();
    });

    it('changes nothing: boxes, rest, counters, XP, streak, missions, badges', () => {
      const deck = CM.makeDeck('d', { resting: 6 });
      const player = CM.makePlayer({}, { totalXP: 50, lastStreakDay: '2000-01-01' });
      const before = CM.snapshotCards(deck);
      const statsBefore = JSON.stringify(player.stats);
      const s = CM.challengeSession({ modeId: 'steady', practice: true }, deck, player);
      CM.play(s, player, [deck], [true, false, true, true, true, true]);
      expect(CM.snapshotCards(deck)).toBe(before);
      expect(JSON.stringify(player.stats)).toBe(statsBefore);
      expect(player.badges).toEqual([]);
      expect(player.missions).toBeUndefined();
      expect(s.stats.totalXpEarned).toBe(0);
      expect(CM.navigations).toEqual(['/challenge-results']);
      expect(s.challengeOutcome.practice).toBe(true);
      expect(s.challengeOutcome.answered).toBe(6);
      expect(s.challengeOutcome.correct).toBe(5);
    });

    it('does not display any XP or streak bonus on a practice card', () => {
      const deck = CM.makeDeck('d', { resting: 4 });
      const player = CM.makePlayer();
      const s = CM.challengeSession({ modeId: 'steady', practice: true }, deck, player);
      State.set('decks', [deck]);
      const state = { player, decks: [deck], currentSession: s };
      for (let i = 0; i < 3; i++) {
        GameAnswerValidator.validate(state, s.cards[s.currentIndex].answer);
        expect(s.lastResult.xpEarned).toBe(0);
        expect(s.lastResult.bonusXp).toBe(0);
        GameSessionManager.nextCard(state);
      }
      expect(s.stats.totalXpEarned).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Même progression qu'en séance normale
  // ═══════════════════════════════════════════════════════════════

  describe('Progression identique à la séance normale', () => {
    function scenario(kind, outcomes) {
      const deck = CM.makeDeck('d', { due: 8, fresh: 3 });
      const player = CM.makePlayer({}, { fastestCorrectAnswer: 5000 });
      const session = kind === 'normal'
        ? CM.normalSession(deck)
        : CM.challengeSession({ modeId: 'steady', difficulty: 'medium' }, deck, player);
      if (kind === 'normal') session.cards = session.cards.slice(0, 8);
      CM.play(session, player, [deck], outcomes);
      return { deck, player, session };
    }

    const outcomes = [true, true, false, true, true, true, false, true];

    it('gives the same boxes, thresholds, rests and counters per card at equal answers', () => {
      const a = scenario('normal', outcomes);
      const b = scenario('challenge', outcomes);
      expect(CM.snapshotCards(b.deck)).toBe(CM.snapshotCards(a.deck));
    });

    it('gives the same card XP, streak bonus, daily streak, missions and counters', () => {
      const a = scenario('normal', outcomes);
      const b = scenario('challenge', outcomes);
      const sessionXp = (p) => p.stats.xpHistory.filter(h => h.source === 'session').reduce((s, h) => s + h.amount, 0);
      expect(sessionXp(b.player)).toBe(sessionXp(a.player));
      expect(b.session.stats.totalXpEarned).toBe(a.session.stats.totalXpEarned);
      expect(b.player.stats.totalCardsPlayed).toBe(a.player.stats.totalCardsPlayed);
      expect(b.player.stats.greenPromotions).toBe(a.player.stats.greenPromotions);
      expect(b.player.stats.currentStreak).toBe(a.player.stats.currentStreak);
      expect(b.player.stats.totalSessions).toBe(a.player.stats.totalSessions);
      expect(b.player.missions.daily.cardsPlayed).toBe(a.player.missions.daily.cardsPlayed);
      expect(b.player.missions.daily.correct).toBe(a.player.missions.daily.correct);
    });

    it('every mode gives the same boxes, rests and card XP as the normal session at equal answers, and one bonus at most', () => {
      const answers = (n) => Array.from({ length: n }, (_, i) => i % 4 !== 3); // 75 % de bonnes réponses
      const run = (modeId) => {
        const deck = CM.makeDeck('d', { due: 24, fresh: 2 });
        const player = CM.makePlayer({}, { fastestCorrectAnswer: 5000 });
        const session = modeId === 'normal'
          ? CM.normalSession(deck)
          : CM.challengeSession({ modeId, difficulty: 'easy' }, deck, player);
        const planned = session.cards.length;
        const n = modeId === 'endurance' ? planned : 5;
        if (modeId === 'normal') session.cards = session.cards.slice(0, n);
        CM.play(session, player, [deck], answers(n));
        return { deck, player, session, n };
      };
      const sessionXp = (p) => p.stats.xpHistory.filter(h => h.source === 'session').reduce((t, h) => t + h.amount, 0);
      // Horloge figée : les temps de réponse (donc les seuils de latence) sont exactement ceux voulus
      const realNow = Date.now;
      Date.now = () => 1.78e12;
      try {
      ['steady', 'perfect', 'speed', 'endurance'].forEach(modeId => {
        CM.navigations.length = 0;
        const c = run(modeId);
        // la séance normale de même longueur (24 cartes pour l'endurance, 5 sinon)
        const ref = (() => {
          const deck = CM.makeDeck('d', { due: 24, fresh: 2 });
          const player = CM.makePlayer({}, { fastestCorrectAnswer: 5000 });
          const session = CM.normalSession(deck);
          session.cards = session.cards.slice(0, c.n);
          CM.play(session, player, [deck], answers(c.n));
          return { deck, player };
        })();
        expect(CM.snapshotCards(c.deck)).toBe(CM.snapshotCards(ref.deck));
        expect(sessionXp(c.player)).toBe(sessionXp(ref.player));
        const bonus = c.player.stats.xpHistory.filter(h => h.source === 'challenge' && h.details === modeId).reduce((t, h) => t + h.amount, 0);
        expect(bonus).toBeLessThanOrEqual(Challenges.CHALLENGE_BONUS_XP);
        expect(c.player.stats.totalXP - ref.player.stats.totalXP).toBe(bonus);
      });
      } finally {
        Date.now = realNow;
      }
    });

    it('ends on the challenge results page, not on the session summary', () => {
      const b = scenario('challenge', outcomes);
      expect(CM.navigations).toEqual(['/challenge-results']);
      expect(b.session.endedAt).not.toBeNull();
    });

    it('does not add any XP to the card XP other than the bounded bonus', () => {
      const a = scenario('normal', Array(8).fill(true));
      const b = scenario('challenge', Array(8).fill(true));
      expect(b.session.challengeOutcome.success).toBe(true);
      const challengeEntries = b.player.stats.xpHistory.filter(h => h.source === 'challenge' && h.details === 'steady');
      expect(challengeEntries).toHaveLength(1);
      expect(challengeEntries[0].amount).toBe(Challenges.CHALLENGE_BONUS_XP);
      expect(Challenges.CHALLENGE_BONUS_XP).toBe(3);
      expect(b.player.stats.totalXP - a.player.stats.totalXP).toBe(3);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Évaluation, score, récompense
  // ═══════════════════════════════════════════════════════════════

  describe('evaluateChallenge', () => {
    function done(modeId, difficulty, outcomes, rt = 2000, extra = {}) {
      const s = CM.challengeSession({ modeId, difficulty }, CM.makeDeck('d', { due: 20 }));
      outcomes.forEach((ok, i) => s.results.push({ cardId: 'c' + i, isCorrect: ok, responseTimeMs: rt }));
      Object.assign(s.challenge, extra);
      return s;
    }

    it('steady: success needs every card answered and the accuracy of the level', () => {
      expect(Challenges.evaluateChallenge(done('steady', 'easy', [true, true, true, false, false])).success).toBe(true); // 60 %
      expect(Challenges.evaluateChallenge(done('steady', 'easy', [true, true, false, false, false])).success).toBe(false);
      expect(Challenges.evaluateChallenge(done('steady', 'easy', [true, true, true, true])).success).toBe(false); // incomplète
    });

    it('perfect: success is a run of the target length, errors elsewhere do not matter', () => {
      const out = [true, false, true, true, true, true, false, true];
      const e = Challenges.evaluateChallenge(done('perfect', 'medium', out));
      expect(e.bestRun).toBe(4);
      expect(e.success).toBe(false);
      const ok = Challenges.evaluateChallenge(done('perfect', 'medium', [true, true, true, true, true, true, false, false]));
      expect(ok.bestRun).toBe(6);
      expect(ok.success).toBe(true);
    });

    it('speed: success is the number of correct answers, even if the time stops before the last card', () => {
      const e = Challenges.evaluateChallenge(done('speed', 'easy', [true, false, true, true], 2000, { timedOut: true }));
      expect(e.correct).toBe(3);
      expect(e.success).toBe(true);
      expect(e.wrong).toBe(1); // les cartes non atteintes ne comptent pas
      const no = Challenges.evaluateChallenge(done('speed', 'easy', [true, true, false, false, false]));
      expect(no.success).toBe(false);
    });

    it('endurance: every card answered and the accuracy held on BOTH halves', () => {
      const deck = CM.makeDeck('d', { due: 20 });
      const mk = (outcomes, difficulty = 'medium') => {
        const s = CM.challengeSession({ modeId: 'endurance', difficulty }, deck);
        outcomes.forEach((ok, i) => s.results.push({ cardId: 'c' + i, isCorrect: ok, responseTimeMs: 2000 }));
        return s;
      };
      const firstHalf = Array(10).fill(true);
      // 70 % requis sur chaque moitié (7 sur 10)
      const steadyBoth = [...[1, 1, 1, 1, 1, 1, 1, 0, 0, 0].map(Boolean), ...[1, 1, 1, 1, 1, 1, 1, 0, 0, 0].map(Boolean)];
      expect(Challenges.evaluateChallenge(mk(steadyBoth)).success).toBe(true);
      // bonne première moitié, seconde en baisse : la moyenne est bonne (80 %) mais le niveau n'est pas tenu
      const tiring = [...firstHalf, ...[1, 1, 1, 1, 1, 0, 0, 0, 0, 0].map(Boolean)];
      const e = Challenges.evaluateChallenge(mk(tiring));
      expect(e.accuracy).toBe(75);
      expect(e.success).toBe(false);
      expect(e.halves).toEqual([{ answered: 10, correct: 10 }, { answered: 10, correct: 5 }]);
      // incomplet : jamais une réussite
      expect(Challenges.evaluateChallenge(mk(firstHalf)).success).toBe(false);
    });

    it('endurance with an odd number of cards: the second half takes the extra card', () => {
      const s = CM.challengeSession({ modeId: 'endurance', difficulty: 'easy' }, CM.makeDeck('d', { due: 21 }));
      s.cards.forEach((c, i) => s.results.push({ cardId: c.id, isCorrect: true, responseTimeMs: 2000 }));
      expect(Challenges.evaluateChallenge(s).halves).toEqual([{ answered: 10, correct: 10 }, { answered: 11, correct: 11 }]);
    });

    it('reports answered, correct, wrong, accuracy and whether it was completed', () => {
      const e = Challenges.evaluateChallenge(done('steady', 'easy', [true, false, true, true, true]));
      CM.expectMatch(e, { answered: 5, correct: 4, wrong: 1, accuracy: 80, complete: true, timedOut: false });
    });

    it('a time-out ends gently: unanswered cards are neither wrong nor counted, steady is not a success', () => {
      const e = Challenges.evaluateChallenge(done('steady', 'easy', [true, true, true], 2000, { timedOut: true }));
      expect(e.timedOut).toBe(true);
      expect(e.complete).toBe(false);
      expect(e.wrong).toBe(0);
      expect(e.success).toBe(false);
    });

    it('score = floor((100 + speed bonus + 10 x run) x multiplier) per correct card, nothing for a wrong one', () => {
      // easy x1.0, 2 s : speed bonus 30 ; runs 1, 2 -> 140 + 150 ; wrong -> 0 ; run restarts at 1 -> 140
      const e = Challenges.evaluateChallenge(done('steady', 'easy', [true, true, false, true], 2000));
      expect(e.score).toBe(140 + 150 + 0 + 140);
      // expert x3
      const x = Challenges.evaluateChallenge(done('steady', 'expert', [true], 2000));
      expect(x.score).toBe(Math.floor((100 + 30 + 10) * 3));
    });

    it('never gives a negative speed bonus for a slow answer', () => {
      const e = Challenges.evaluateChallenge(done('steady', 'easy', [true], 60000));
      expect(e.score).toBe(110);
    });
  });

  describe('applyOutcome (récompense et records)', () => {
    function finished(modeId, difficulty, outcomes, deckDue = 20) {
      const s = CM.challengeSession({ modeId, difficulty }, CM.makeDeck('d', { due: deckDue }));
      outcomes.forEach((ok, i) => s.results.push({ cardId: 'c' + i, isCorrect: ok, responseTimeMs: 2000 }));
      return s;
    }

    it('a success gives the 3 XP bonus, one win, once per day', () => {
      const player = CM.makePlayer();
      const first = Challenges.applyOutcome(player, finished('steady', 'easy', Array(5).fill(true)), CM.today);
      CM.expectMatch(first, { counted: true, bonusXp: 3 });
      expect(player.stats.challengeWins).toBe(1);
      expect(player.stats.lastChallengeDay).toBe(CM.today);
      const second = Challenges.applyOutcome(player, finished('steady', 'easy', Array(5).fill(true)), CM.today);
      CM.expectMatch(second, { counted: false, bonusXp: 0 });
      expect(player.stats.challengeWins).toBe(1);
      const nextDay = Challenges.applyOutcome(player, finished('steady', 'easy', Array(5).fill(true)), TextUtils.addDays(CM.today, 1));
      expect(nextDay.bonusXp).toBe(3);
      expect(player.stats.challengeWins).toBe(2);
    });

    it('no success: no bonus, no win, no penalty (nothing is taken away)', () => {
      const player = CM.makePlayer({}, { challengeWins: 4, totalXP: 100 });
      const r = Challenges.applyOutcome(player, finished('steady', 'easy', Array(5).fill(false)), CM.today);
      CM.expectMatch(r, { counted: false, bonusXp: 0 });
      expect(player.stats.challengeWins).toBe(4);
      expect(player.stats.totalXP).toBe(100);
      expect(player.stats.lastChallengeDay).toBeUndefined();
    });

    it('counts an expert success for the challenger badge even if today already had a win', () => {
      const player = CM.makePlayer();
      Challenges.applyOutcome(player, finished('steady', 'easy', Array(5).fill(true)), CM.today);
      const r = Challenges.applyOutcome(player, finished('steady', 'expert', Array(15).fill(true)), CM.today);
      expect(r.bonusXp).toBe(0);
      expect(player.stats.expertChallengeWins).toBe(1);
    });

    it('untouchable: a perfect run with no error on 10 cards or more (hard or expert), never on a small level', () => {
      const small = CM.makePlayer();
      Challenges.applyOutcome(small, finished('perfect', 'easy', Array(5).fill(true)), CM.today);
      expect(small.stats.perfectChallengeComplete).toBeFalsy();
      const medium = CM.makePlayer();
      Challenges.applyOutcome(medium, finished('perfect', 'medium', Array(8).fill(true)), CM.today);
      expect(medium.stats.perfectChallengeComplete).toBeFalsy();
      const hard = CM.makePlayer();
      Challenges.applyOutcome(hard, finished('perfect', 'hard', Array(12).fill(true)), CM.today);
      expect(hard.stats.perfectChallengeComplete).toBe(true);
      const withError = CM.makePlayer();
      Challenges.applyOutcome(withError, finished('perfect', 'hard', [true, false, ...Array(10).fill(true)]), CM.today);
      expect(withError.stats.perfectChallengeComplete).toBeFalsy();
      const steady = CM.makePlayer();
      Challenges.applyOutcome(steady, finished('steady', 'hard', Array(12).fill(true)), CM.today);
      expect(steady.stats.perfectChallengeComplete).toBeFalsy();
    });

    it('never un-sets a badge condition already earned', () => {
      const player = CM.makePlayer({}, { perfectChallengeComplete: true, expertChallengeWins: 2 });
      Challenges.applyOutcome(player, finished('steady', 'easy', Array(5).fill(false)), CM.today);
      expect(player.stats.perfectChallengeComplete).toBe(true);
      expect(player.stats.expertChallengeWins).toBe(2);
    });

    it('keeps personal best scores per player, per mode and level, with a record flag', () => {
      const player = CM.makePlayer();
      const s1 = finished('steady', 'easy', [true, true, true, true, true]);
      const r1 = Challenges.applyOutcome(player, s1, CM.today);
      expect(player.challengeScores.steady_easy).toBe(Challenges.evaluateChallenge(s1).score);
      expect(r1.isNewRecord).toBe(false); // premier score : rien à battre
      const s2 = finished('steady', 'easy', [true, true, true, false, false]);
      const r2 = Challenges.applyOutcome(player, s2, CM.today);
      expect(r2.isNewRecord).toBe(false);
      expect(player.challengeScores.steady_easy).toBe(Challenges.evaluateChallenge(s1).score);
      const s3 = finished('steady', 'easy', [true, true, true, true, true]);
      s3.results.forEach(r => { r.responseTimeMs = 100; });
      const r3 = Challenges.applyOutcome(player, s3, CM.today);
      expect(r3.isNewRecord).toBe(true);
      expect(r3.previousBest).toBe(Challenges.evaluateChallenge(s1).score);
      expect(Object.keys(player.challengeScores)).toEqual(['steady_easy']);
    });

    it('reads legacy scores without deleting any: speed_*, endurance_*, steady_*_timed, streak_*, perfect_*', () => {
      const player = CM.makePlayer();
      player.challengeScores = {
        speed_easy: 900, streak_hard: 1200, perfect_medium: 700, endurance_easy: 500,
        steady_medium_timed: 640, perfect_easy_timed: 410
      };
      expect(Challenges.getBestScore(player, 'speed', 'easy')).toBe(900);
      expect(Challenges.getBestScore(player, 'speed', 'medium')).toBe(640); // écrit par l'intégration précédente
      expect(Challenges.getBestScore(player, 'steady', 'easy')).toBe(0);
      expect(Challenges.getBestScore(player, 'steady', 'medium')).toBe(0);
      expect(Challenges.getBestScore(player, 'perfect', 'hard')).toBe(1200);
      expect(Challenges.getBestScore(player, 'perfect', 'medium')).toBe(700);
      expect(Challenges.getBestScore(player, 'perfect', 'easy')).toBe(410);
      expect(Challenges.getBestScore(player, 'endurance', 'easy')).toBe(500);
      expect(Challenges.scoreKey('speed', 'easy')).toBe('speed_easy');
      expect(Challenges.scoreKey('perfect', 'hard')).toBe('perfect_hard');
      // les anciens scores restent dans les données
      Challenges.applyOutcome(player, finished('steady', 'easy', Array(5).fill(true)), CM.today);
      expect(player.challengeScores.speed_easy).toBe(900);
      expect(player.challengeScores.endurance_easy).toBe(500);
      expect(player.challengeScores.steady_medium_timed).toBe(640);
    });

    it('a record is kept per mode: a speed score never overwrites a steady one', () => {
      const player = CM.makePlayer();
      Challenges.applyOutcome(player, finished('steady', 'easy', Array(5).fill(true)), CM.today);
      const speed = finished('speed', 'easy', Array(5).fill(true));
      Challenges.applyOutcome(player, speed, CM.today);
      expect(Object.keys(player.challengeScores).sort()).toEqual(['speed_easy', 'steady_easy']);
    });

    it('a success of any mode gives the same bonus: 3 XP, once a day, all modes together', () => {
      const player = CM.makePlayer();
      const deck20 = 25;
      const r1 = Challenges.applyOutcome(player, finished('speed', 'easy', Array(5).fill(true), deck20), CM.today);
      expect(r1.bonusXp).toBe(3);
      ['steady', 'perfect'].forEach(m => {
        expect(Challenges.applyOutcome(player, finished(m, 'easy', Array(5).fill(true), deck20), CM.today).bonusXp).toBe(0);
      });
      const endurance = CM.challengeSession({ modeId: 'endurance', difficulty: 'easy' }, CM.makeDeck('d', { due: deck20 }));
      endurance.cards.forEach(c => endurance.results.push({ cardId: c.id, isCorrect: true, responseTimeMs: 2000 }));
      expect(Challenges.applyOutcome(player, endurance, CM.today).bonusXp).toBe(0);
      expect(player.stats.challengeWins).toBe(1);
      // le lendemain : un seul bonus encore, quel que soit le mode
      const next = TextUtils.addDays(CM.today, 1);
      expect(Challenges.applyOutcome(player, endurance, next).bonusXp).toBe(3);
    });

    it('records nothing for an entraînement libre and for a challenge without any answer', () => {
      const player = CM.makePlayer();
      const practice = CM.challengeSession({ modeId: 'steady', practice: true }, CM.makeDeck('d', { resting: 4 }));
      practice.results.push({ cardId: 'a', isCorrect: true, responseTimeMs: 1000 });
      CM.expectMatch(Challenges.applyOutcome(player, practice, CM.today), { counted: false, bonusXp: 0 });
      const empty = finished('steady', 'easy', []);
      Challenges.applyOutcome(player, empty, CM.today);
      expect(player.challengeScores).toBeUndefined();
      expect(player.stats.challengeWins).toBeUndefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Fin de défi par la séance
  // ═══════════════════════════════════════════════════════════════

  describe('Fin de défi (GameSessionManager)', () => {
    it('credits the bonus once, in xpHistory, and levels the win counter used by the weekly quest', () => {
      const deck = CM.makeDeck('d', { due: 8 });
      const player = CM.makePlayer();
      const s = CM.challengeSession({ modeId: 'steady', difficulty: 'medium' }, deck, player);
      CM.play(s, player, [deck], Array(8).fill(true));
      expect(player.stats.challengeWins).toBe(1);
      CM.expectMatch(s.challengeOutcome, { success: true, counted: true, bonusXp: 3 });
      expect(player.stats.xpHistory.filter(h => h.source === 'challenge' && h.details === 'steady')).toHaveLength(1);
      const sumHistory = player.stats.xpHistory.reduce((a, h) => a + h.amount, 0);
      expect(player.stats.totalXP).toBe(sumHistory);
    });

    it('a second successful challenge the same day gives no second bonus', () => {
      const deck = CM.makeDeck('d', { due: 20 });
      const player = CM.makePlayer();
      for (let i = 0; i < 2; i++) {
        const s = CM.challengeSession({ modeId: 'steady', difficulty: 'easy' }, deck, player);
        CM.play(s, player, [deck], Array(5).fill(true));
      }
      expect(player.stats.xpHistory.filter(h => h.source === 'challenge' && h.details === 'steady')).toHaveLength(1);
      expect(player.stats.challengeWins).toBe(1);
    });

    it('stops gently on time-up: answered cards are kept, the others stay to review', () => {
      const deck = CM.makeDeck('d', { due: 8 });
      const player = CM.makePlayer();
      const s = CM.challengeSession({ modeId: 'speed', difficulty: 'medium' }, deck, player);
      const state = { player, decks: [deck], currentSession: s };
      CM.play(s, player, [deck], [true, true, true]);
      expect(s.currentIndex).toBe(3);
      GameSessionManager.stopChallenge(state, 'time');
      expect(s.challenge.timedOut).toBe(true);
      expect(s.cards).toHaveLength(3);
      expect(s.endedAt).not.toBeNull();
      expect(CM.navigations).toEqual(['/challenge-results']);
      CM.expectMatch(s.challengeOutcome, { answered: 3, wrong: 0, success: false, timedOut: true }); // 6 sur 8 requis
      expect(player.stats.challengeWins).toBeUndefined();
      // les cartes non atteintes n'ont pas bougé
      expect(deck.cards.slice(3).every(c => c.box === 'purple' && c.timesPlayed === 1)).toBe(true);
    });

    it('Contre la montre: the target reached before the time stops is a success, with the one bonus', () => {
      const deck = CM.makeDeck('d', { due: 8 });
      const player = CM.makePlayer();
      const s = CM.challengeSession({ modeId: 'speed', difficulty: 'easy' }, deck, player);
      const state = { player, decks: [deck], currentSession: s };
      CM.play(s, player, [deck], [true, true, true, false]);
      GameSessionManager.stopChallenge(state, 'time');
      CM.expectMatch(s.challengeOutcome, { answered: 4, wrong: 1, success: true, timedOut: true, bonusXp: 3 });
      expect(player.stats.challengeWins).toBe(1);
      expect(deck.cards.slice(4).every(c => c.box === 'purple' && c.timesPlayed === 1)).toBe(true);
    });

    it('time-up before any answer ends the challenge without touching the player', () => {
      const deck = CM.makeDeck('d', { due: 6 });
      const player = CM.makePlayer();
      const before = JSON.stringify(player.stats);
      const s = CM.challengeSession({ modeId: 'speed', difficulty: 'easy' }, deck, player);
      GameSessionManager.stopChallenge({ player, decks: [deck], currentSession: s }, 'time');
      expect(JSON.stringify(player.stats)).toBe(before);
      expect(CM.navigations).toEqual(['/challenge-results']);
      expect(s.challengeOutcome.answered).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Quête hebdomadaire weekly_challenges
  // ═══════════════════════════════════════════════════════════════

  describe('Quête weekly_challenges', () => {
    it('targets 2 successful challenges, reachable with the new model', () => {
      expect(Challenges.WEEKLY_CHALLENGES_TARGET).toBe(2);
      const record = Challenges.createWeeklyRecord(CM.makePlayer(), '2026-01-05', []);
      expect(record.quests.find(q => q.type === 'weekly_challenges').target).toBe(2);
    });

    it('completes after two successful challenges on two different days of the week', () => {
      const player = CM.makePlayer();
      Challenges.refreshMissions(player, { decks: [], today: '2026-01-05' });
      const win = (day) => {
        const s = CM.challengeSession({ modeId: 'steady', difficulty: 'easy' }, CM.makeDeck('d', { due: 6 }));
        for (let i = 0; i < 5; i++) s.results.push({ cardId: 'c' + i, isCorrect: true, responseTimeMs: 2000 });
        return Challenges.applyOutcome(player, s, day);
      };
      win('2026-01-05');
      win('2026-01-05'); // même jour : ne compte pas
      expect(Challenges.updateWeekly(player, '2026-01-05').find(q => q.type === 'weekly_challenges')).toBeUndefined();
      win('2026-01-06');
      const done = Challenges.updateWeekly(player, '2026-01-06');
      expect(done.map(q => q.type)).toContain('weekly_challenges');
    });

    it('says "Réussir" (not "Gagner") in both languages', () => {
      expect(i18n._translations.fr['missions.weekly.weekly_challenges']).toMatch(/Réussir/);
      expect(i18n._translations.en['missions.weekly.weekly_challenges']).toMatch(/Complete/);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Vocabulaire : aucune perte, aucune humiliation
  // ═══════════════════════════════════════════════════════════════

  describe('Vocabulaire', () => {
    const keys = () => Object.keys(i18n._translations.fr).filter(k => k.startsWith('challenge.') || k.startsWith('challengeSetup.') || k.startsWith('challengeResults.'));

    it('has the same challenge.* keys in French and in English', () => {
      const fr = Object.keys(i18n._translations.fr).filter(k => /^challenge(Setup|Results)?\./.test(k)).sort();
      const en = Object.keys(i18n._translations.en).filter(k => /^challenge(Setup|Results)?\./.test(k)).sort();
      expect(en).toEqual(fr);
      expect(fr.length).toBeGreaterThan(20);
    });

    it('has no defeat, miss, lives or broken heart in any challenge text', () => {
      const forbidden = /défaite|defeat|raté|missed|perdu|lost|💔|vie[s]? restante|lives|game over|éliminé/i;
      ['fr', 'en'].forEach(lang => {
        keys().forEach(k => {
          const value = i18n._translations[lang][k];
          const text = typeof value === 'string' ? value : JSON.stringify(value);
          expect(forbidden.test(text) ? `${lang}:${k}` : null).toBeNull();
        });
      });
    });

    it('has dropped the old loss keys', () => {
      ['challenge.defeat', 'challenge.victory', 'challenge.missed', 'challenge.livesRemaining'].forEach(k => {
        expect(i18n._translations.fr[k]).toBeUndefined();
        expect(i18n._translations.en[k]).toBeUndefined();
      });
    });

    it('addresses the player with "tu" and avoids gendered agreement in French', () => {
      keys().forEach(k => {
        const value = i18n._translations.fr[k];
        const text = typeof value === 'string' ? value : JSON.stringify(value);
        expect(/\bvous\b|\bvotre\b|\bvos\b|\b\w+ez\b(?=\s)/i.test(text) && /vous|votre|vos/i.test(text) ? k : null).toBeNull();
        expect(/·|\(e\)|\(s\)/.test(text) ? k : null).toBeNull();
        expect(/\b(prêt|prête|sûr|sûre|content|contente)\b/i.test(text) ? k : null).toBeNull();
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Stockage : le nouveau champ est déclaré
  // ═══════════════════════════════════════════════════════════════

  describe('Stockage', () => {
    it('declares lastChallengeDay as a day and keeps it through sanitization', () => {
      expect(Storage.PLAYER_STATS_TYPES.lastChallengeDay).toBe('day');
      expect(Storage.sanitizePlayerStats({ lastChallengeDay: '2026-01-05' }).lastChallengeDay).toBe('2026-01-05');
      expect(Storage.sanitizePlayerStats({ lastChallengeDay: '<img onerror=x>' }).lastChallengeDay).toBeUndefined();
    });

    it('keeps the challenge scores of an existing player', () => {
      const p = Storage.sanitizePlayer({ id: 'a', name: 'A', stats: {}, badges: [], settings: {}, challengeScores: { speed_easy: 420, perfect_hard: 800 } });
      expect(p.challengeScores).toEqual({ speed_easy: 420, perfect_hard: 800 });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Écrans
  // ═══════════════════════════════════════════════════════════════

  describe('Pages.challengeGame', () => {
    function stateFor(session, player) {
      return { player: player || CM.makePlayer(), decks: [CM.makeDeck('d', { due: 20 })], currentSession: session };
    }

    it('extends the game page: same card rendering, a challenge bar added', () => {
      const s = CM.challengeSession({ modeId: 'perfect', difficulty: 'easy' }, CM.makeDeck('d', { due: 6 }));
      const html = Pages.challengeGame.render(stateFor(s));
      expect(html).toContain('page--game');
      expect(html).toContain('id="submit-btn"');
      expect(html).toContain('chalbar');
      expect(html).toContain('chalbar__goal');
    });

    it('shows the best run and the target in Sans erreur, never lives or hearts', () => {
      const s = CM.challengeSession({ modeId: 'perfect', difficulty: 'easy' }, CM.makeDeck('d', { due: 6 }));
      s.results.push({ cardId: 'a', isCorrect: true, responseTimeMs: 1000 }, { cardId: 'b', isCorrect: true, responseTimeMs: 1000 }, { cardId: 'c', isCorrect: false, responseTimeMs: 1000 });
      s.currentIndex = 3;
      const html = Pages.challengeGame.render(stateFor(s));
      expect(html).not.toContain('❤');
      expect(html).not.toContain('🖤');
      expect(html).not.toContain('lives');
      expect(html).toMatch(/chalbar__run[^>]*>[^<]*2/); // meilleure série : 2
      expect(html).toContain(CM.fr('challenge.goal.perfect', { run: 4 }));
    });

    it('shows a timer only in Contre la montre', () => {
      const deck = CM.makeDeck('d', { due: 25 });
      ['steady', 'perfect', 'endurance'].forEach(modeId => {
        const plain = Pages.challengeGame.render(stateFor(CM.challengeSession({ modeId, difficulty: 'easy' }, deck)));
        expect(plain).not.toContain('chalbar__timer');
      });
      const timed = Pages.challengeGame.render(stateFor(CM.challengeSession({ modeId: 'speed', difficulty: 'easy' }, deck)));
      expect(timed).toContain('chalbar__timer');
      expect(timed).toContain('2:30');
      expect(timed).toContain(CM.fr('challenge.goal.speed', { correct: 3 }));
    });

    it('shows the goal of Jusqu\'au bout: the level to hold on each half, no clock', () => {
      const s = CM.challengeSession({ modeId: 'endurance', difficulty: 'medium' }, CM.makeDeck('d', { due: 24 }));
      const html = Pages.challengeGame.render(stateFor(s));
      expect(html).toContain(CM.fr('challenge.goal.endurance', { percent: 70 }));
      expect(html).toContain(CM.fr('challenge.mode.endurance'));
      expect(html).not.toContain('chalbar__timer');
    });

    it('announces the entraînement libre and hides the piles', () => {
      const s = CM.challengeSession({ modeId: 'steady', practice: true }, CM.makeDeck('d', { resting: 4 }));
      const html = Pages.challengeGame.render(stateFor(s));
      expect(html).toContain('chalbar__practice');
      expect(html).toContain('chal--practice');
    });

    it('hides the destination pile and the XP on the back of a practice card', () => {
      const deck = CM.makeDeck('d', { resting: 4 });
      const player = CM.makePlayer();
      const s = CM.challengeSession({ modeId: 'steady', practice: true }, deck, player);
      State.set('decks', [deck]);
      GameAnswerValidator.validate({ player, decks: [deck], currentSession: s }, s.cards[0].answer);
      const html = Pages.challengeGame.render(stateFor(s, player));
      expect(html).not.toContain('game__card-destination');
      expect(html).not.toContain('game__card-xp');
      // le texte habituel (« carte maîtrisée ») est remplacé : rien n'est enregistré
      expect(html).toContain(CM.fr('challenge.practiceRight'));
    });

    it('escapes the deck name', () => {
      const deck = CM.makeDeck('d', { due: 6, extra: { name: '<img src=x onerror=alert(1)>' } });
      const s = CM.challengeSession({ modeId: 'steady', difficulty: 'easy' }, deck);
      const html = Pages.challengeGame.render(stateFor(s));
      expect(html).not.toContain('<img src=x');
    });
  });

  describe('Pages.challengeResults', () => {
    function finish(options, outcomes, deckOpts = { due: 20 }) {
      const deck = CM.makeDeck('d', deckOpts);
      const player = CM.makePlayer();
      const s = CM.challengeSession(options, deck, player);
      CM.play(s, player, [deck], outcomes);
      return { deck, player, session: s, state: { player, decks: [deck], currentSession: s } };
    }

    it('says "Défi réussi" on a success, with the bonus and the score as a display', () => {
      const { state } = finish({ modeId: 'steady', difficulty: 'easy' }, Array(5).fill(true));
      const html = Pages.challengeResults.render(state);
      expect(html).toContain('chalresult--success');
      expect(html).toContain(CM.fr('challengeResults.success'));
      expect(html).toContain('+3 XP');
      expect(html).toContain('chalresult__score');
    });

    it('says what was learned and invites to retry later when not successful, without a loss word', () => {
      const { state } = finish({ modeId: 'steady', difficulty: 'easy' }, [true, false, false, false, false]);
      const html = Pages.challengeResults.render(state);
      expect(html).toContain('chalresult--again');
      expect(html).toContain(CM.fr('challengeResults.again'));
      expect(html).toContain('chalresult__retry-hint');
      expect(/défaite|raté|perdu|💔/i.test(html)).toBe(false);
      expect(html).not.toContain('chalresult__bonus');
    });

    it('says the time is up in a gentle way', () => {
      const { state, session } = finish({ modeId: 'speed', difficulty: 'easy' }, [true, true]);
      GameSessionManager.stopChallenge(state, 'time');
      const html = Pages.challengeResults.render(state);
      expect(html).toContain('chalresult__timeup');
      expect(session.challengeOutcome.timedOut).toBe(true);
    });

    it('for the entraînement libre: nothing was recorded, no score, no XP', () => {
      const { state } = finish({ modeId: 'steady', practice: true }, [true, true, false, true, true], { resting: 5 });
      const html = Pages.challengeResults.render(state);
      expect(html).toContain('chalresult--practice');
      expect(html).toContain(CM.fr('challengeResults.practiceNote'));
      expect(html).not.toContain('chalresult__score');
      expect(/\+\d+ XP/.test(html)).toBe(false);
    });

    it('only redirects when there is no challenge to show', () => {
      const html = Pages.challengeResults.render({ player: CM.makePlayer(), decks: [], currentSession: null });
      expect(html).toBe('');
      expect(CM.navigations).toEqual(['/challenges']);
    });
  });

  describe('Pages.challengeSetup', () => {
    const base = (decks, player) => ({ player: player || CM.makePlayer(), decks });

    it('offers three modes up to 19 cards to review, the levels the deck allows, and starts on Parcours', () => {
      const html = Pages.challengeSetup.render(base([CM.makeDeck('d', { due: 9 })]), ['d']);
      ['steady', 'perfect', 'speed'].forEach(m => expect(html).toContain(`value="${m}"`));
      expect(html).not.toContain('value="endurance"');
      expect(html).toMatch(/value="steady"[^>]*checked/);
      expect(/value="speed"[^>]*checked/.test(html)).toBe(false);
      expect(html).toMatch(/value="easy"(?![^>]*disabled)/);
      expect(html).toMatch(/value="medium"(?![^>]*disabled)/);
      expect(html).toMatch(/value="hard"[^>]*disabled/);
      expect(html).toMatch(/value="expert"[^>]*disabled/);
      expect(html).not.toContain('chal-timer'); // plus de case à cocher
    });

    it('offers Jusqu\'au bout only with 20 cards to review or more, never preselected', () => {
      const html = Pages.challengeSetup.render(base([CM.makeDeck('d', { due: 20 })]), ['d']);
      expect(html).toContain('value="endurance"');
      expect(/value="endurance"[^>]*checked/.test(html)).toBe(false);
      expect(Pages.challengeSetup.render(base([CM.makeDeck('d', { due: 19 })]), ['d'])).not.toContain('value="endurance"');
    });

    it('does not offer Contre la montre to a player with dyslexia mode or large spacing', () => {
      ['dyslexiaMode', 'largeSpacing'].forEach(setting => {
        const html = Pages.challengeSetup.render(base([CM.makeDeck('d', { due: 20 })], CM.makePlayer({ [setting]: true })), ['d']);
        expect(html).not.toContain('value="speed"');
        expect(html).not.toContain('chalbar__timer');
        expect(html).toContain('value="steady"');
        expect(html).toContain('value="perfect"');
        expect(html).toContain('value="endurance"');
      });
    });

    it('gives each mode a distinct description and says what the level means for it', () => {
      const html = Pages.challengeSetup.render(base([CM.makeDeck('d', { due: 20 })]), ['d']);
      ['steady', 'perfect', 'speed', 'endurance'].forEach(m => {
        expect(html).toContain(CM.fr('challenge.modeDesc.' + m));
      });
    });

    it('with nothing to review: proposes the entraînement libre, clearly announced, and no challenge', () => {
      const html = Pages.challengeSetup.render(base([CM.makeDeck('d', { resting: 6 })]), ['d']);
      expect(html).toContain('chalsetup__practice');
      expect(html).toContain(CM.fr('challengeSetup.practiceNote'));
      expect(html).not.toContain('value="perfect"');
    });

    it('with 1 to 4 cards to review: points to the normal session, no challenge, no practice', () => {
      const html = Pages.challengeSetup.render(base([CM.makeDeck('d', { due: 3, resting: 6 })]), ['d']);
      expect(html).toContain('chalsetup__few');
      expect(html).not.toContain('chalsetup__practice');
      expect(html).not.toContain('value="perfect"');
    });

    it('redirects an unknown or multilingual deck to the challenges page', () => {
      expect(Pages.challengeSetup.render(base([]), ['absent'])).toBe('');
      expect(CM.navigations).toEqual(['/challenges']);
    });

    it('shows the personal record of the player, nobody else\'s', () => {
      const player = CM.makePlayer();
      player.challengeScores = { steady_easy: 777 };
      const html = Pages.challengeSetup.render(base([CM.makeDeck('d', { due: 9 })], player), ['d']);
      expect(html).toContain('777');
      const old = CM.makePlayer();
      old.challengeScores = { streak_easy: 555 };
      expect(Pages.challengeSetup.render(base([CM.makeDeck('d', { due: 9 })], old), ['d'])).not.toContain('555'); // Parcours est en tête
    });
  });

  describe('Pages.challenges: point d\'entrée', () => {
    it('lists started decks with their number of cards to review and a button to choose a challenge', () => {
      const player = CM.makePlayer();
      const decks = [CM.makeDeck('a', { due: 7 }), CM.makeDeck('b', { fresh: 5 })];
      const html = Pages.challenges.render({ player, decks });
      expect(html).toContain('chalentry');
      expect(html).toContain('id="chal-deck"');
      expect(html).toContain('Deck a');
      expect(html).not.toContain('Deck b'); // jamais commencé
    });

    it('says to start a deck first when no deck was started, without pushing', () => {
      const html = Pages.challenges.render({ player: CM.makePlayer(), decks: [CM.makeDeck('b', { fresh: 5 })] });
      expect(html).toContain('chalentry__empty');
    });
  });

  describe('Deck table', () => {
    it('adds a challenge action to standard decks only', () => {
      const std = DeckTable._renderActions(CM.makeDeck('d', { due: 3 }), { isCustom: false, isHidden: false, allowDelete: false, playableCount: 3, isResting: false, _t: (k) => k });
      expect(std).toContain('deck-table__btn--challenge');
      const multi = DeckTable._renderActions({ ...CM.makeDeck('d', {}), type: 'multilingual' }, { isCustom: false, isHidden: false, allowDelete: false, playableCount: 3, isResting: false, _t: (k) => k });
      expect(multi).not.toContain('deck-table__btn--challenge');
    });
  });
});
