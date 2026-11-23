/**
 * Tests des missions (passe 2 de la gamification) : défis quotidiens, quêtes hebdomadaires,
 * bilan de séance, badges horaires et paliers intermédiaires.
 *
 * Couvre B11 (persistance et isolation par joueur), B12 (quêtes : progression de la semaine
 * par différence, XP crédité une fois), B14/B16 (défis réalisables et proportionnés),
 * proposition 10 (bilan centré sur l'apprentissage) et proposition 9 (badges horaires,
 * paliers intermédiaires).
 *
 * L'horloge est simulée par une sous-classe de Date construite en heure locale : les tests
 * sont donc indépendants de la variable TZ du processus.
 */

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

const MS = {
  RealDate: Date,
  origBadgeMultiple: Effects.badgePopup.showMultiple,
  origBadgeOne: Effects.badgePopup.show,
  origLevelShow: Effects.levelUp.show,
  origNavigate: Router.navigate,

  /** Horloge simulée : lundi 2026-01-05 10:00 (heure locale) par défaut */
  installClock(y = 2026, m = 1, d = 5, h = 10) {
    const R = MS.RealDate;
    const clock = { now: new R(y, m - 1, d, h, 0, 0).getTime() };
    global.Date = class SimDate extends R {
      constructor(...a) {
        if (a.length === 0) super(clock.now);
        else super(...a);
      }
      static now() { return clock.now; }
    };
    clock.advanceDays = (n) => {
      const x = new R(clock.now);
      x.setDate(x.getDate() + n);
      clock.now = x.getTime();
    };
    clock.restore = () => { global.Date = R; };
    return clock;
  },

  /** Deck dont les `reviewed` premières cartes ont déjà été jouées (boîte violette = due) */
  makeDeck(id, total, reviewed = 0, extra = {}) {
    return {
      id,
      name: 'Deck ' + id,
      tags: ['maths'],
      settings: {},
      ...extra,
      cards: Array.from({ length: total }, (_, i) => ({
        id: id + '_c' + i, question: 'Q' + i, answer: 'A' + i, type: 'text',
        box: i < reviewed ? 'purple' : 'never_played', latencyThreshold: i < reviewed ? 3 : null,
        restUntil: null, restDays: 0, timesPlayed: i < reviewed ? 1 : 0, timesCorrect: 0
      }))
    };
  },

  makePlayer(id = 'p_ms', stats = {}) {
    return {
      id, name: 'P ' + id, createdAt: '2026-01-01T00:00:00.000Z', badges: [], settings: {},
      stats: {
        totalXP: 0, totalCardsPlayed: 0, totalSessions: 0, currentStreak: 0, longestStreak: 0,
        longestGreenStreak: 0, totalGreenCards: 0, lastPlayedAt: null, fastestCorrectAnswer: null,
        uniqueDecksPlayed: 0, playedDeckIds: [], cardsBySubject: {}, xpHistory: [],
        ...stats
      }
    };
  },

  /** Joue `outcomes.length` cartes jouables du deck (une réponse par entrée), carte par carte */
  playSession(env, outcomes, rt = 2000, deckIndex = 0, endIt = true) {
    const deck = env.decks[deckIndex];
    const cards = deck.cards.filter(c => c.box !== 'green').slice(0, outcomes.length).map(c => ({ ...c }));
    const session = {
      deckId: deck.id, type: 'standard', cards, currentIndex: 0, isShowingFeedback: false,
      cardStartTime: Date.now(), startedAt: new Date().toISOString(), endedAt: null, results: [],
      stats: { cardsPlayed: 0, correctAnswers: 0, currentGreenStreak: 0, maxGreenStreak: 0, totalXpEarned: 0 }
    };
    const state = { player: env.player, decks: env.decks, currentSession: session };
    Router.navigate = () => {};
    try {
      for (let i = 0; i < outcomes.length; i++) {
        if (!endIt && i === outcomes.length - 1) {
          // dernière carte : ne pas terminer la séance (la fin est déclenchée par currentIndex)
          session.cards.push({ id: 'sentinel', box: 'never_played' });
        }
        const card = session.cards[session.currentIndex];
        const ok = outcomes[i];
        const newBox = Leitner.getNextBox(card.box || 'never_played', ok, rt, (card.latencyThreshold || 3) * 1000);
        GameAnswerValidator._updateSessionStats(session, ok, newBox, rt, XP.calculateXpForCard(newBox), card);
        GameSessionManager.nextCard(state);
      }
    } finally {
      Router.navigate = MS.origNavigate;
    }
    return session;
  },

  sumXp(player, source) {
    return player.stats.xpHistory.filter(h => h.source === source).reduce((s, h) => s + h.amount, 0);
  }
};

describe('Gamification - missions (passe 2)', () => {
  let clock = null;

  beforeEach(() => {
    global.Date = MS.RealDate;
    Effects.badgePopup.showMultiple = () => {};
    Effects.badgePopup.show = () => {};
    Effects.levelUp.show = () => {};
    localStorage.clear();
    State.reset();
    clock = null;
  });

  afterEach(() => {
    if (clock) clock.restore();
    global.Date = MS.RealDate;
    Effects.badgePopup.showMultiple = MS.origBadgeMultiple;
    Effects.badgePopup.show = MS.origBadgeOne;
    Effects.levelUp.show = MS.origLevelShow;
    Router.navigate = MS.origNavigate;
  });

  // ═══════════════════════════════════════════════════════════════
  // Cartes à réviser (base de tous les objectifs)
  // ═══════════════════════════════════════════════════════════════

  describe('countDueCards / getReviewOutlook', () => {
    it('ne compte que les cartes déjà jouées dans les decks commencés', () => {
      const decks = [MS.makeDeck('a', 30, 8), MS.makeDeck('b', 40, 0)];
      expect(Challenges.countDueCards(decks, '2026-01-05')).toBe(8);
    });

    it('ne compte pas une carte verte encore au repos, mais compte celle dont le repos est fini', () => {
      const deck = MS.makeDeck('a', 10, 10);
      deck.cards[0] = { ...deck.cards[0], box: 'green', restUntil: '2026-01-09', restDays: 4 };
      deck.cards[1] = { ...deck.cards[1], box: 'green', restUntil: '2026-01-05', restDays: 3 };
      expect(Challenges.countDueCards([deck], '2026-01-05')).toBe(9);
    });

    it('est borné par maxCards du deck (une séance ne peut pas en proposer davantage)', () => {
      const deck = MS.makeDeck('a', 50, 50, { settings: { maxCards: 12 } });
      expect(Challenges.countDueCards([deck], '2026-01-05')).toBe(12);
    });

    it('ignore les decks multilingues et les données invalides sans lever d\'erreur', () => {
      const decks = [{ id: 'm', type: 'multilingual', words: [] }, null, { id: 'x' }, MS.makeDeck('a', 5, 3)];
      expect(Challenges.countDueCards(decks, '2026-01-05')).toBe(3);
      expect(Challenges.countDueCards(undefined, '2026-01-05')).toBe(0);
    });

    it('getReviewOutlook : rien de dû, prochaine révision = fin du repos le plus proche', () => {
      const deck = MS.makeDeck('a', 3, 3);
      deck.cards.forEach((c, i) => { deck.cards[i] = { ...c, box: 'green', restUntil: ['2026-01-09', '2026-01-07', '2026-01-20'][i], restDays: 5 }; });
      expect(Challenges.getReviewOutlook([deck], '2026-01-05')).toEqual({ dueNow: 0, nextDay: '2026-01-07' });
    });

    it('getReviewOutlook : des cartes sont dues -> dueNow > 0', () => {
      expect(Challenges.getReviewOutlook([MS.makeDeck('a', 10, 4)], '2026-01-05').dueNow).toBe(4);
    });

    it('getReviewOutlook : aucun deck commencé -> rien, pas de date', () => {
      expect(Challenges.getReviewOutlook([MS.makeDeck('a', 10, 0)], '2026-01-05')).toEqual({ dueNow: 0, nextDay: null });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // B14, B16 - défis quotidiens réalisables et proportionnés
  // ═══════════════════════════════════════════════════════════════

  describe('défis quotidiens (B14, B16)', () => {
    it('DAILY_TYPES : réviser les cartes du jour remplace l\'objectif de volume', () => {
      expect(Challenges.DAILY_TYPES).toEqual(['review_due', 'accuracy', 'green_streak']);
    });

    it('génère 3 défis dont les cibles sont bornées par le nombre de cartes à réviser (10 cartes au plus)', () => {
      const list = Challenges.generateDaily(MS.makePlayer('a'), '2026-01-05', { dueCount: 18 });
      expect(list.map(c => c.type)).toEqual(['review_due', 'accuracy', 'green_streak']);
      expect(list[0].target).toBe(10);
      expect(list[1].target.minCards).toBe(10);
      expect(list[1].target.accuracy).toBe(70);
      expect(list[2].target).toBe(3);
    });

    it('avec peu de cartes, chaque cible reste atteignable', () => {
      const list = Challenges.generateDaily(MS.makePlayer('a'), '2026-01-05', { dueCount: 2 });
      expect(list[0].target).toBe(2);
      expect(list[1].target.minCards).toBe(2);
      expect(list[2].target).toBe(2);
    });

    it('les cibles ne dépendent pas du niveau du joueur', () => {
      const low = Challenges.generateDaily(MS.makePlayer('a', { totalXP: 0 }), '2026-01-05', { dueCount: 15 });
      const high = Challenges.generateDaily(MS.makePlayer('b', { totalXP: 250000 }), '2026-01-05', { dueCount: 15 });
      expect(JSON.stringify(high.map(c => c.target))).toBe(JSON.stringify(low.map(c => c.target)));
    });

    it('un jour sans carte à réviser : aucun défi (rien à rater)', () => {
      expect(Challenges.generateDaily(MS.makePlayer('a'), '2026-01-05', { dueCount: 0 })).toEqual([]);
    });

    it('un retard ne gonfle pas l\'objectif : jamais plus de 10 cartes à réviser dans le défi', () => {
      const list = Challenges.generateDaily(MS.makePlayer('a'), '2026-01-05', { dueCount: 80 });
      expect(list[0].target).toBe(10);
      const player = MS.makePlayer('b');
      Challenges.refreshMissions(player, { decks: [MS.makeDeck('d', 150, 80)], today: '2026-01-05' });
      expect(player.missions.daily.dueAtStart).toBe(80);
      expect(player.missions.daily.challenges[0].target).toBe(10);
    });

    it('règle d\'XP : le total des défis du jour vaut au plus 25 % de l\'XP de carte des cartes visées (2 XP/carte), 5 XP au maximum', () => {
      [1, 2, 3, 5, 8, 12, 18, 30, 60, 100, 400].forEach(due => {
        const list = Challenges.generateDaily(MS.makePlayer('a'), '2026-01-05', { dueCount: due });
        const total = list.reduce((s, c) => s + c.xpReward, 0);
        const targeted = Math.min(due, 10);
        expect(total).toBeLessThanOrEqual(5);
        expect(total).toBeLessThanOrEqual(Math.max(3, Math.ceil(0.25 * 2 * targeted)));
        list.forEach(c => expect(c.xpReward).toBeGreaterThanOrEqual(1));
      });
    });

    it('pour une journée ordinaire (18 cartes) les défis rapportent moins du quart de l\'XP de la séance', () => {
      const list = Challenges.generateDaily(MS.makePlayer('a'), '2026-01-05', { dueCount: 18 });
      const total = list.reduce((s, c) => s + c.xpReward, 0);
      const sessionXp = 18 * 2; // 2 XP de carte en moyenne, sans bonus
      expect(total).toBeLessThan(sessionXp * 0.25 + 1);
      expect(total).toBe(5);
    });

    it('createdAt = jour, expiresAt = lendemain, progression nulle', () => {
      const list = Challenges.generateDaily(MS.makePlayer('a'), '2026-01-05', { dueCount: 9 });
      list.forEach(c => {
        expect(c.createdAt).toBe('2026-01-05');
        expect(c.expiresAt).toBe('2026-01-06');
        expect(c.progress).toBe(0);
        expect(c.completed).toBe(false);
      });
    });

    it('describe() produit un texte traduit pour chaque type (fr et en)', () => {
      const list = Challenges.generateDaily(MS.makePlayer('a'), '2026-01-05', { dueCount: 9 });
      const fr = (k, p) => i18n._translations.fr[k].replace(/\{(\w+)\}/g, (_, n) => p[n]);
      const en = (k, p) => i18n._translations.en[k].replace(/\{(\w+)\}/g, (_, n) => p[n]);
      list.forEach(c => {
        expect(Challenges.describe(c, fr)).toMatch(/\d/);
        expect(Challenges.describe(c, en)).toMatch(/\d/);
        expect(Challenges.describe(c, fr)).not.toBe(Challenges.describe(c, en));
      });
    });
  });

  describe('refreshMissions et suivi sur la journée entière', () => {
    it('crée les missions du jour avec la charge du jour mesurée sur les decks commencés', () => {
      const player = MS.makePlayer('a');
      const changed = Challenges.refreshMissions(player, { decks: [MS.makeDeck('d', 30, 12)], today: '2026-01-05' });
      expect(changed).toBe(true);
      expect(player.missions.daily.day).toBe('2026-01-05');
      expect(player.missions.daily.dueAtStart).toBe(12);
      expect(player.missions.daily.challenges[0].target).toBe(10); // plafonné
      expect(player.missions.weekly.weekStart).toBe('2026-01-05');
      expect(player.missions.weekly.quests).toHaveLength(5);
    });

    it('un second appel le même jour ne change rien (la cible du jour est figée)', () => {
      const player = MS.makePlayer('a');
      Challenges.refreshMissions(player, { decks: [MS.makeDeck('d', 30, 12)], today: '2026-01-05' });
      const before = JSON.stringify(player.missions);
      const changed = Challenges.refreshMissions(player, { decks: [MS.makeDeck('d', 30, 3)], today: '2026-01-05' });
      expect(changed).toBe(false);
      expect(JSON.stringify(player.missions)).toBe(before);
    });

    it('le lendemain, les défis sont régénérés mais les quêtes de la semaine sont conservées', () => {
      const player = MS.makePlayer('a');
      Challenges.refreshMissions(player, { decks: [MS.makeDeck('d', 30, 12)], today: '2026-01-05' });
      const weekly = JSON.stringify(player.missions.weekly);
      Challenges.refreshMissions(player, { decks: [MS.makeDeck('d', 30, 7)], today: '2026-01-06' });
      expect(player.missions.daily.day).toBe('2026-01-06');
      expect(player.missions.daily.dueAtStart).toBe(7);
      expect(JSON.stringify(player.missions.weekly)).toBe(weekly);
    });

    it('un jour sans carte à réviser : liste vide, charge 0 (l\'interface le dit simplement)', () => {
      const player = MS.makePlayer('a');
      Challenges.refreshMissions(player, { decks: [MS.makeDeck('d', 30, 0)], today: '2026-01-05' });
      expect(player.missions.daily.dueAtStart).toBe(0);
      expect(player.missions.daily.challenges).toHaveLength(0);
    });

    it('review_due compte des cartes distinctes : rejouer la même carte n\'avance pas', () => {
      const player = MS.makePlayer('a');
      Challenges.refreshMissions(player, { decks: [MS.makeDeck('d', 30, 5)], today: '2026-01-05' });
      for (let i = 0; i < 4; i++) {
        Challenges.recordCard(player, { deckId: 'd', cardId: 'd_c0', isCorrect: false, maxGreenStreak: 0 }, '2026-01-05');
      }
      expect(player.missions.daily.challenges[0].progress).toBe(1);
      expect(player.missions.daily.challenges[0].completed).toBe(false);
    });

    it('review_due est borné par sa cible et se termine une seule fois', () => {
      const player = MS.makePlayer('a');
      Challenges.refreshMissions(player, { decks: [MS.makeDeck('d', 30, 5)], today: '2026-01-05' });
      let done = [];
      for (let i = 0; i < 9; i++) {
        done = done.concat(Challenges.recordCard(player, { deckId: 'd', cardId: 'd_c' + i, isCorrect: true, maxGreenStreak: 0 }, '2026-01-05'));
      }
      expect(done.filter(c => c.type === 'review_due')).toHaveLength(1);
      expect(player.missions.daily.challenges[0].progress).toBe(5);
    });

    it('accuracy se cumule entre les séances de la journée', () => {
      const player = MS.makePlayer('a');
      Challenges.refreshMissions(player, { decks: [MS.makeDeck('d', 40, 20)], today: '2026-01-05' });
      const acc = () => player.missions.daily.challenges[1];
      // première séance : 6 cartes, 5 justes -> pas encore 10 cartes jouées
      for (let i = 0; i < 6; i++) Challenges.recordCard(player, { deckId: 'd', cardId: 'd_c' + i, isCorrect: i !== 0, maxGreenStreak: 0 }, '2026-01-05');
      expect(acc().completed).toBe(false);
      expect(acc().progress).toBe(0);
      // seconde séance : 4 cartes justes -> 9/10 = 90 %
      let done = [];
      for (let i = 6; i < 10; i++) done = done.concat(Challenges.recordCard(player, { deckId: 'd', cardId: 'd_c' + i, isCorrect: true, maxGreenStreak: 0 }, '2026-01-05'));
      expect(done.map(c => c.type)).toContain('accuracy');
      expect(acc().completed).toBe(true);
    });

    it('accuracy n\'est pas validée sous le seuil de réussite', () => {
      const player = MS.makePlayer('a');
      Challenges.refreshMissions(player, { decks: [MS.makeDeck('d', 40, 20)], today: '2026-01-05' });
      for (let i = 0; i < 10; i++) Challenges.recordCard(player, { deckId: 'd', cardId: 'd_c' + i, isCorrect: i < 6, maxGreenStreak: 0 }, '2026-01-05');
      expect(player.missions.daily.challenges[1].completed).toBe(false);
      expect(player.missions.daily.challenges[1].progress).toBe(60);
    });

    it('green_streak suit la meilleure série de la journée et ne décroît pas', () => {
      const player = MS.makePlayer('a');
      Challenges.refreshMissions(player, { decks: [MS.makeDeck('d', 40, 20)], today: '2026-01-05' });
      Challenges.recordCard(player, { deckId: 'd', cardId: 'd_c0', isCorrect: true, maxGreenStreak: 2 }, '2026-01-05');
      Challenges.recordCard(player, { deckId: 'd', cardId: 'd_c1', isCorrect: false, maxGreenStreak: 1 }, '2026-01-05');
      expect(player.missions.daily.challenges[2].progress).toBe(2);
      const done = Challenges.recordCard(player, { deckId: 'd', cardId: 'd_c2', isCorrect: true, maxGreenStreak: 3 }, '2026-01-05');
      expect(done.map(c => c.type)).toEqual(['green_streak']);
    });

    it('une carte jouée un autre jour que celui des missions est ignorée', () => {
      const player = MS.makePlayer('a');
      Challenges.refreshMissions(player, { decks: [MS.makeDeck('d', 40, 20)], today: '2026-01-05' });
      const done = Challenges.recordCard(player, { deckId: 'd', cardId: 'x', isCorrect: true, maxGreenStreak: 5 }, '2026-01-06');
      expect(done).toEqual([]);
      expect(player.missions.daily.cardsPlayed).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // B12 - quêtes hebdomadaires
  // ═══════════════════════════════════════════════════════════════

  describe('quêtes hebdomadaires (B12)', () => {
    it('un joueur ancien (120 cartes vertes, 7 victoires, 6 decks) ne démarre pas avec des quêtes terminées', () => {
      const player = MS.makePlayer('old', { totalGreenCards: 120, challengeWins: 7, uniqueDecksPlayed: 6, greenPromotions: 300, totalXP: 9000 });
      Challenges.refreshMissions(player, { decks: [MS.makeDeck('d', 150, 60)], today: '2026-01-05' });
      const done = Challenges.updateWeekly(player, '2026-01-05');
      expect(done).toEqual([]);
      player.missions.weekly.quests.forEach(q => {
        expect(q.completed).toBe(false);
        expect(q.progress).toBe(0);
      });
    });

    it('instantané du lundi : greenPromotions et challengeWins', () => {
      const player = MS.makePlayer('a', { greenPromotions: 40, challengeWins: 2 });
      Challenges.refreshMissions(player, { decks: [MS.makeDeck('d', 30, 10)], today: '2026-01-07' });
      expect(player.missions.weekly.weekStart).toBe('2026-01-05');
      expect(player.missions.weekly.baseline).toEqual({ greenPromotions: 40, challengeWins: 2 });
    });

    it('weekly_mastery = cartes passées en vert depuis l\'instantané', () => {
      const player = MS.makePlayer('a', { greenPromotions: 40 });
      Challenges.refreshMissions(player, { decks: [MS.makeDeck('d', 30, 10)], today: '2026-01-05' });
      player.stats.greenPromotions = 47;
      Challenges.updateWeekly(player, '2026-01-05');
      const q = player.missions.weekly.quests.find(x => x.type === 'weekly_mastery');
      expect(q.progress).toBe(7);
      expect(q.completed).toBe(false);
    });

    it('weekly_challenges = victoires depuis l\'instantané', () => {
      const player = MS.makePlayer('a', { challengeWins: 5 });
      Challenges.refreshMissions(player, { decks: [MS.makeDeck('d', 30, 10)], today: '2026-01-05' });
      player.stats.challengeWins = 6;
      Challenges.updateWeekly(player, '2026-01-05');
      expect(player.missions.weekly.quests.find(x => x.type === 'weekly_challenges').progress).toBe(1);
    });

    it('weekly_xp ne compte que l\'XP de révision (séances) de la semaine, pas celle des badges ni des quêtes', () => {
      const player = MS.makePlayer('a');
      player.stats.xpHistory = [
        { date: '2026-01-04', amount: 500, source: 'session' }, // semaine précédente
        { date: '2026-01-05', amount: 30, source: 'session' },
        { date: '2026-01-06', amount: 20, source: 'session' },
        { date: '2026-01-06', amount: 75, source: 'badge' },
        { date: '2026-01-06', amount: 9, source: 'quest' }
      ];
      Challenges.refreshMissions(player, { decks: [MS.makeDeck('d', 30, 10)], today: '2026-01-07' });
      Challenges.updateWeekly(player, '2026-01-07');
      expect(player.missions.weekly.quests.find(x => x.type === 'weekly_xp').progress).toBe(50);
    });

    it('la cible weekly_xp suit l\'XP de révision des semaines passées, pas le niveau', () => {
      const regular = MS.makePlayer('a', { totalXP: 250000 });
      expect(Challenges.weeklyXpTarget(regular, '2026-01-05')).toBe(100); // pas d'historique : cible modeste fixe
      const hist = [];
      // 4 semaines précédentes à 400 XP de révision chacune
      ['2025-12-08', '2025-12-15', '2025-12-22', '2025-12-29'].forEach(d => hist.push({ date: d, amount: 400, source: 'session' }));
      const p2 = MS.makePlayer('b', { totalXP: 0, xpHistory: hist });
      expect(Challenges.weeklyXpTarget(p2, '2026-01-05')).toBe(240); // 60 % de la moyenne
      const p3 = MS.makePlayer('c', { totalXP: 250000, xpHistory: hist });
      expect(Challenges.weeklyXpTarget(p3, '2026-01-05')).toBe(240);
    });

    it('la cible weekly_xp est plafonnée et plancher (pas de croissance sans fin)', () => {
      const big = MS.makePlayer('a', { xpHistory: [{ date: '2025-12-29', amount: 100000, source: 'session' }] });
      expect(Challenges.weeklyXpTarget(big, '2026-01-05')).toBe(600);
      const tiny = MS.makePlayer('b', { xpHistory: [{ date: '2025-12-29', amount: 10, source: 'session' }] });
      expect(Challenges.weeklyXpTarget(tiny, '2026-01-05')).toBe(50);
    });

    it('les cibles sont bornées par ce que le joueur peut faire (cartes et decks commencés)', () => {
      const player = MS.makePlayer('a');
      Challenges.refreshMissions(player, { decks: [MS.makeDeck('d', 6, 6)], today: '2026-01-05' });
      const q = (t) => player.missions.weekly.quests.find(x => x.type === t);
      expect(q('weekly_mastery').target).toBe(6);
      expect(q('weekly_decks').target).toBe(1);
      expect(q('weekly_streak').target).toBe(3);
    });

    it('récompense modeste : chaque quête rapporte 3 à 10 XP, 50 XP par semaine au plus', () => {
      const player = MS.makePlayer('a', { xpHistory: [{ date: '2025-12-29', amount: 5000, source: 'session' }] });
      Challenges.refreshMissions(player, { decks: [MS.makeDeck('d', 80, 40), MS.makeDeck('e', 80, 40), MS.makeDeck('f', 80, 40)], today: '2026-01-05' });
      const total = player.missions.weekly.quests.reduce((s, q) => s + q.xpReward, 0);
      expect(total).toBeLessThanOrEqual(50);
      player.missions.weekly.quests.forEach(q => {
        expect(q.xpReward).toBeGreaterThanOrEqual(3);
        expect(q.xpReward).toBeLessThanOrEqual(10);
      });
    });

    it('la nouvelle semaine (lundi local) régénère les quêtes avec un nouvel instantané', () => {
      const player = MS.makePlayer('a', { greenPromotions: 10 });
      Challenges.refreshMissions(player, { decks: [MS.makeDeck('d', 30, 10)], today: '2026-01-11' }); // dimanche
      expect(player.missions.weekly.weekStart).toBe('2026-01-05');
      player.stats.greenPromotions = 25;
      Challenges.refreshMissions(player, { decks: [MS.makeDeck('d', 30, 10)], today: '2026-01-12' }); // lundi
      expect(player.missions.weekly.weekStart).toBe('2026-01-12');
      expect(player.missions.weekly.baseline.greenPromotions).toBe(25);
      expect(player.missions.weekly.quests.every(q => q.progress === 0)).toBe(true);
    });

    it('updateWeekly renvoie chaque quête terminée une seule fois', () => {
      const player = MS.makePlayer('a', { greenPromotions: 0 });
      Challenges.refreshMissions(player, { decks: [MS.makeDeck('d', 60, 30)], today: '2026-01-05' });
      player.stats.greenPromotions = 99;
      const first = Challenges.updateWeekly(player, '2026-01-05');
      expect(first.map(q => q.type)).toContain('weekly_mastery');
      expect(Challenges.updateWeekly(player, '2026-01-05')).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Intégration : séance complète via les vrais modules
  // ═══════════════════════════════════════════════════════════════

  describe('séance complète', () => {
    it('terminer les cartes du jour valide le défi et crédite son XP une seule fois', () => {
      clock = MS.installClock();
      const env = { player: MS.makePlayer('a', { fastestCorrectAnswer: 5000 }), decks: [MS.makeDeck('d', 8, 8)] };
      const session = MS.playSession(env, Array(8).fill(true));
      const p = env.player;
      const daily = p.missions.daily;
      expect(daily.dueAtStart).toBe(8);
      expect(daily.challenges[0].completed).toBe(true);
      expect(session.completedChallenges.map(c => c.type)).toContain('review_due');
      const challengeXp = MS.sumXp(p, 'challenge');
      expect(challengeXp).toBe(daily.challenges.filter(c => c.completed).reduce((s, c) => s + c.xpReward, 0));
      // pas de double crédit si la même carte est enregistrée à nouveau
      const before = p.stats.totalXP;
      Challenges.recordCard(p, { deckId: 'd', cardId: 'd_c0', isCorrect: true, maxGreenStreak: 5 }, TextUtils.getToday());
      expect(p.stats.totalXP).toBe(before);
    });

    it('l\'XP des défis du jour reste nettement inférieure à celle de la séance', () => {
      clock = MS.installClock();
      const env = { player: MS.makePlayer('a', { fastestCorrectAnswer: 5000 }), decks: [MS.makeDeck('d', 20, 20)] };
      const session = MS.playSession(env, Array(20).fill(true));
      const challengeXp = MS.sumXp(env.player, 'challenge');
      expect(challengeXp).toBeGreaterThan(0);
      expect(challengeXp).toBeLessThan(session.stats.totalXpEarned * 0.25 + 1);
    });

    it('les missions sont enregistrées avec le joueur à chaque carte (rechargement)', () => {
      clock = MS.installClock();
      const env = { player: MS.makePlayer('a', { fastestCorrectAnswer: 5000 }), decks: [MS.makeDeck('d', 10, 10)] };
      MS.playSession(env, [true, true, true]);
      const loaded = Storage.loadPlayerById('a');
      expect(loaded.missions.daily.day).toBe(TextUtils.getToday());
      expect(loaded.missions.daily.cardsPlayed).toBe(3);
      expect(loaded.missions.daily.challenges[0].progress).toBe(3);
    });

    it('une séance abandonnée à mi-parcours compte quand même les cartes jouées', () => {
      clock = MS.installClock();
      const env = { player: MS.makePlayer('a', { fastestCorrectAnswer: 5000 }), decks: [MS.makeDeck('d', 10, 10)] };
      MS.playSession(env, [true, false, true, true], 2000, 0, false);
      expect(env.player.missions.daily.cardsPlayed).toBe(4);
    });

    it('le défi est suivi sur la journée : deux séances de 5 cartes terminent les 10 cartes du jour', () => {
      clock = MS.installClock();
      const env = { player: MS.makePlayer('a', { fastestCorrectAnswer: 5000 }), decks: [MS.makeDeck('d', 10, 10)] };
      MS.playSession(env, Array(5).fill(true));
      expect(env.player.missions.daily.challenges[0].completed).toBe(false);
      const s2 = MS.playSession(env, Array(5).fill(true));
      expect(env.player.missions.daily.challenges[0].completed).toBe(true);
      expect(s2.completedChallenges.map(c => c.type)).toContain('review_due');
    });

    it('greenPromotions compte chaque passage en boîte verte', () => {
      clock = MS.installClock();
      const env = { player: MS.makePlayer('a', { fastestCorrectAnswer: 5000 }), decks: [MS.makeDeck('d', 6, 6)] };
      MS.playSession(env, [true, true, false, true, false, true]);
      expect(env.player.stats.greenPromotions).toBe(4);
    });

    it('une quête terminée en séance est créditée une fois, inscrite dans xpHistory et annoncée', () => {
      clock = MS.installClock();
      const env = { player: MS.makePlayer('a', { fastestCorrectAnswer: 5000 }), decks: [MS.makeDeck('d', 12, 12)] };
      // la quête de maîtrise (cible 10) est atteinte en passant 12 cartes en vert
      const session = MS.playSession(env, Array(12).fill(true));
      const p = env.player;
      const q = p.missions.weekly.quests.find(x => x.type === 'weekly_mastery');
      expect(q.completed).toBe(true);
      expect(session.completedQuests.map(x => x.type)).toContain('weekly_mastery');
      expect(MS.sumXp(p, 'quest')).toBe(p.missions.weekly.quests.filter(x => x.completed).reduce((s, x) => s + x.xpReward, 0));
      // XP total cohérent : tout ce qui est crédité est dans l'historique
      expect(p.stats.xpHistory.reduce((s, h) => s + h.amount, 0)).toBe(p.stats.totalXP);
      // une nouvelle séance ne recrédite pas la quête
      const xpQuestBefore = MS.sumXp(p, 'quest');
      GameSessionManager._finishMissions(p, { stats: { cardsPlayed: 0 } });
      expect(MS.sumXp(p, 'quest')).toBe(xpQuestBefore);
    });

    it('un jour sans carte à réviser : aucun défi, la séance sur de nouvelles cartes n\'en crée pas', () => {
      clock = MS.installClock();
      const env = { player: MS.makePlayer('a', { fastestCorrectAnswer: 5000 }), decks: [MS.makeDeck('d', 10, 0)] };
      MS.playSession(env, [true, true, true]);
      expect(env.player.missions.daily.challenges).toHaveLength(0);
      expect(MS.sumXp(env.player, 'challenge')).toBe(0);
    });

    it('weekRestCards et longTermCards : une carte est comptée une seule fois à chaque seuil (7 puis 14 jours)', () => {
      clock = MS.installClock();
      const deck = MS.makeDeck('d', 2, 2);
      deck.cards[0] = { ...deck.cards[0], box: 'never_played', restDays: 12, restUntil: null, latencyThreshold: 3 };
      deck.cards[1] = { ...deck.cards[1], box: 'never_played', restDays: 20, restUntil: null, latencyThreshold: 3 };
      const env = { player: MS.makePlayer('a', { fastestCorrectAnswer: 5000 }), decks: [deck] };
      MS.playSession(env, [true, true], 1000);
      expect(deck.cards[0].restDays).toBeGreaterThanOrEqual(14);
      expect(env.player.stats.longTermCards).toBe(1);
      expect(env.player.stats.weekRestCards || 0).toBe(0); // déjà au-dessus de 7 jours avant la séance : rien
    });

    it('weekRestCards : une carte passant de 5 à 7 jours et plus de repos est comptée', () => {
      clock = MS.installClock();
      const deck = MS.makeDeck('d', 1, 1);
      deck.cards[0] = { ...deck.cards[0], box: 'never_played', restDays: 5, restUntil: null, latencyThreshold: 3 };
      const env = { player: MS.makePlayer('a', { fastestCorrectAnswer: 5000 }), decks: [deck] };
      MS.playSession(env, [true], 1000);
      expect(deck.cards[0].restDays).toBeGreaterThanOrEqual(6);
      expect(env.player.stats.weekRestCards || 0).toBe(deck.cards[0].restDays >= 7 ? 1 : 0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // B11 - persistance et isolation par joueur
  // ═══════════════════════════════════════════════════════════════

  describe('persistance et isolation (B11)', () => {
    function withMissions(id, due, stats) {
      const p = MS.makePlayer(id, stats);
      Challenges.refreshMissions(p, { decks: [MS.makeDeck('d', 40, due)], today: '2026-01-05' });
      return p;
    }

    it('aller-retour enregistrement -> rechargement : défis et quêtes conservés', () => {
      const p = withMissions('a', 14, { greenPromotions: 3 });
      p.missions.daily.challenges[0].progress = 5;
      p.missions.daily.cardKeys = ['d/d_c0', 'd/d_c1'];
      p.missions.weekly.quests[1].progress = 4;
      p.missions.weekly.daysPlayed = ['2026-01-05'];
      Storage.savePlayerById(p);
      const loaded = Storage.loadPlayerById('a');
      expect(loaded.missions).toEqual(p.missions);
    });

    it('aller-retour export -> import', () => {
      const p = withMissions('a', 14, { greenPromotions: 3 });
      p.missions.daily.challenges[1].progress = 80;
      Storage.savePlayer(p);
      const exported = JSON.parse(JSON.stringify(Storage.exportAll()));
      expect(exported.player.missions.daily.day).toBe('2026-01-05');
      localStorage.clear();
      Storage.importAll(exported);
      const loaded = Storage.loadPlayer();
      expect(loaded.missions).toEqual(p.missions);
    });

    it('deux joueurs ont chacun leurs missions (le joueur B n\'hérite pas de celles de A)', () => {
      const a = withMissions('a', 18, { totalXP: 90000 });
      const b = withMissions('b', 4);
      Storage.savePlayerById(a);
      Storage.savePlayerById(b);
      const la = Storage.loadPlayerById('a');
      const lb = Storage.loadPlayerById('b');
      expect(la.missions.daily.challenges[0].target).toBe(10);
      expect(lb.missions.daily.challenges[0].target).toBe(4);
      la.missions.daily.challenges[0].progress = 9;
      expect(lb.missions.daily.challenges[0].progress).toBe(0);
    });

    it('le miroir State (barre de navigation) suit le joueur courant', () => {
      const a = withMissions('a', 18);
      a.missions.daily.challenges[0].completed = true;
      const b = withMissions('b', 4);
      clock = MS.installClock();
      // State.reset() (beforeEach) a vidé les abonnements : l'application les pose au chargement
      Challenges.bindState();
      State.set('player', a);
      expect(State.get('dailyChallenges').filter(c => c.completed)).toHaveLength(1);
      State.set('player', b);
      expect(State.get('dailyChallenges').filter(c => c.completed)).toHaveLength(0);
      expect(State.get('dailyChallenges')[0].target).toBe(4);
    });

    it('le miroir State est vide si les missions datent d\'un autre jour', () => {
      const a = withMissions('a', 18);
      a.missions.daily.challenges[0].completed = true;
      Challenges.syncState(a, '2026-01-06');
      expect(State.get('dailyChallenges')).toEqual([]);
    });

    it('sanitizePlayer assainit les missions importées (types, texte, types inconnus)', () => {
      const raw = MS.makePlayer('h');
      raw.missions = {
        daily: {
          day: '2026-01-05', dueAtStart: '12', cardsPlayed: 'abc', correct: -4,
          cardKeys: ['d/a', 7, '<img src=x onerror=1>'],
          challenges: [
            { id: 'x<script>', type: 'review_due', target: '12', progress: '3', completed: 'yes', xpReward: 6, createdAt: '2026-01-05', expiresAt: '2026-01-06', description: '<b>hack</b>' },
            { id: 'y', type: 'launch_missiles', target: 5, progress: 0 },
            { id: 'z', type: 'accuracy', target: { accuracy: 70, minCards: '10' }, progress: 50, completed: true, completedAt: '2026-01-05T10:00:00.000Z', xpReward: 2, createdAt: '2026-01-05', expiresAt: '2026-01-06' }
          ]
        },
        weekly: { weekStart: 'pas une date', quests: [] },
        extra: { __proto__: { polluted: true } }
      };
      const clean = Storage.sanitizePlayer(raw);
      const d = clean.missions.daily;
      expect(d.day).toBe('2026-01-05');
      expect(d.dueAtStart).toBe(12);
      expect(d.cardsPlayed).toBe(0);
      expect(d.correct).toBe(0);
      expect(d.cardKeys).toHaveLength(2);
      expect(d.challenges).toHaveLength(2);
      expect(d.challenges[0].target).toBe(12);
      expect(d.challenges[0].progress).toBe(3);
      expect(d.challenges[0].completed).toBe(false);
      expect(d.challenges[0].description).toBeUndefined();
      expect(d.challenges[1].target).toEqual({ accuracy: 70, minCards: 10 });
      expect(d.challenges[1].completed).toBe(true);
      // semaine illisible : abandonnée, régénérée à la prochaine ouverture
      expect(clean.missions.weekly).toBeUndefined();
      expect(({}).polluted).toBeUndefined();
    });

    it('sanitizePlayer ne crée pas de missions pour un joueur qui n\'en a pas', () => {
      expect(Storage.sanitizePlayer(MS.makePlayer('n')).missions).toBeUndefined();
    });

    it('les nouveaux compteurs sont déclarés dans le registre des stats', () => {
      expect(Storage.PLAYER_STATS_FIELDS).toContain('greenPromotions');
      expect(Storage.PLAYER_STATS_FIELDS).toContain('longTermCards');
      expect(Storage.PLAYER_STATS_FIELDS).toContain('weekRestCards');
      const out = Storage.sanitizePlayerStats({ greenPromotions: 12, longTermCards: 3 });
      expect(out.greenPromotions).toBe(12);
      expect(out.longTermCards).toBe(3);
    });

    it('les listes de types de Storage et de Challenges concordent', () => {
      expect(Storage._DAILY_TYPES).toEqual(Challenges.DAILY_TYPES);
      expect(Storage._WEEKLY_TYPES).toEqual(Challenges.WEEKLY_TYPES);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Proposition 10 - bilan de séance
  // ═══════════════════════════════════════════════════════════════

  describe('bilan de séance', () => {
    function summaryState(results, decks, extra = {}) {
      const stats = {
        cardsPlayed: results.length,
        correctAnswers: results.filter(r => r.isCorrect).length,
        totalXpEarned: 12, maxGreenStreak: 0, currentGreenStreak: 0
      };
      return {
        decks,
        currentSession: { deckId: decks[0].id, results, stats, newBadges: [], completedChallenges: [], completedQuests: [], ...extra }
      };
    }
    const res = (id, ok, box) => ({ cardId: id, isCorrect: ok, newBox: box, previousBox: 'purple', xpEarned: 1, bonusXp: 0 });

    beforeEach(() => {
      clock = MS.installClock();
      Router.navigate = () => {};
    });

    it('_shouldCelebrate : confettis seulement à partir de 80 % de bonnes réponses', () => {
      expect(Pages.sessionSummary._shouldCelebrate({ cardsPlayed: 10, correctAnswers: 8 })).toBe(true);
      expect(Pages.sessionSummary._shouldCelebrate({ cardsPlayed: 10, correctAnswers: 10 })).toBe(true);
      expect(Pages.sessionSummary._shouldCelebrate({ cardsPlayed: 10, correctAnswers: 7 })).toBe(false);
      expect(Pages.sessionSummary._shouldCelebrate({ cardsPlayed: 0, correctAnswers: 0 })).toBe(false);
    });

    it('_getLearning : cartes passées en vert et cartes à revoir (dernier résultat de chaque carte)', () => {
      const l = Pages.sessionSummary._getLearning([
        res('a', false, 'purple'), res('a', true, 'green'), // a : revue puis réussie
        res('b', true, 'green'),
        res('c', false, 'purple'),
        res('d', true, 'orange')
      ]);
      expect(l).toEqual({ toGreen: 2, toReview: 2 });
    });

    it('affiche ce que la séance a changé pour la mémoire', () => {
      const deck = MS.makeDeck('d', 6, 6);
      deck.cards[0] = { ...deck.cards[0], box: 'green', restUntil: '2026-01-12', restDays: 7 };
      deck.cards[1] = { ...deck.cards[1], box: 'green', restUntil: '2026-01-08', restDays: 3 };
      const state = summaryState([res('d_c0', true, 'green'), res('d_c1', true, 'green'), res('d_c2', false, 'purple')], [deck]);
      const html = Pages.sessionSummary.render(state);
      expect(html).toContain(t('summary.toGreen', { count: 2 }));
      expect(html).toContain(t('summary.toReview', { count: 1 }));
    });

    it('plus rien à réviser demain : message clair, pas d\'incitation à rejouer', () => {
      const deck = MS.makeDeck('d', 3, 3);
      deck.cards = deck.cards.map(c => ({ ...c, box: 'green', restUntil: '2026-01-06', restDays: 1 }));
      const state = summaryState([res('d_c0', true, 'green'), res('d_c1', true, 'green'), res('d_c2', true, 'green')], [deck]);
      const html = Pages.sessionSummary.render(state);
      expect(html).toContain(t('summary.nothingBeforeTomorrow'));
      expect(html).not.toContain('session-summary__replay');
    });

    it('prochaine révision plus lointaine : la date est indiquée', () => {
      const deck = MS.makeDeck('d', 3, 3);
      deck.cards = deck.cards.map(c => ({ ...c, box: 'green', restUntil: '2026-01-09', restDays: 4 }));
      const state = summaryState([res('d_c0', true, 'green'), res('d_c1', true, 'green'), res('d_c2', true, 'green')], [deck]);
      const html = Pages.sessionSummary.render(state);
      expect(html).toContain(escapeHtml(Pages.sessionSummary._formatDay('2026-01-09')));
      expect(html).not.toContain(t('summary.nothingBeforeTomorrow'));
    });

    it('il reste des cartes dues : pas de message « rien à réviser »', () => {
      const deck = MS.makeDeck('d', 6, 6);
      const state = summaryState([res('d_c0', false, 'purple')], [deck]);
      const html = Pages.sessionSummary.render(state);
      expect(html).not.toContain(t('summary.nothingBeforeTomorrow'));
      expect(html).not.toContain(t('summary.nothingToday'));
    });

    it('liste les défis et quêtes terminés avec leur XP, texte échappé', () => {
      const deck = MS.makeDeck('d', 3, 3);
      const state = summaryState([res('d_c0', true, 'green')], [deck], {
        completedChallenges: [{ id: 'c1', type: 'review_due', target: 3, xpReward: 6 }],
        completedQuests: [{ id: 'q1', type: 'weekly_mastery', target: 10, xpReward: 15 }]
      });
      const html = Pages.sessionSummary.render(state);
      expect(html).toContain('+6 XP');
      expect(html).toContain('+15 XP');
      expect(html).toContain(escapeHtml(Challenges.describe({ type: 'weekly_mastery', target: 10 })));
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Page des défis
  // ═══════════════════════════════════════════════════════════════

  describe('page des défis', () => {
    it('un jour sans carte à réviser, l\'interface le dit simplement', () => {
      clock = MS.installClock();
      const player = MS.makePlayer('a');
      const html = Pages.challenges.render({ player, decks: [MS.makeDeck('d', 10, 0)] });
      expect(html).toContain(escapeHtml(t('missions.restDay')));
      expect(html).not.toContain('challenge__progress-bar');
    });

    it('affiche les défis du jour et conserve l\'état d\'un rechargement', () => {
      clock = MS.installClock();
      const player = MS.makePlayer('a');
      Pages.challenges._activeTab = 'daily';
      Pages.challenges.render({ player, decks: [MS.makeDeck('d', 20, 9)] });
      player.missions.daily.challenges[0].progress = 4;
      Storage.savePlayerById(player);
      const reloaded = Storage.loadPlayerById('a');
      const html = Pages.challenges.render({ player: reloaded, decks: [MS.makeDeck('d', 20, 9)] });
      expect(html).toContain('4/9');
      expect(html).toContain(escapeHtml(t('missions.daily.review_due', { count: 9 })));
    });

    it('un jour de mission sans carte ne fait pas apparaître de défi à rater dans le miroir', () => {
      clock = MS.installClock();
      const player = MS.makePlayer('a');
      Pages.challenges.render({ player, decks: [MS.makeDeck('d', 10, 0)] });
      expect(State.get('dailyChallenges')).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Proposition 9 - badges horaires et paliers intermédiaires
  // ═══════════════════════════════════════════════════════════════

  describe('badges horaires et paliers', () => {
    function at(hour, minute = 0) {
      return new MS.RealDate(2026, 0, 5, hour, minute, 0);
    }

    it('jouer la nuit (minuit à 5 h) ne rapporte plus rien', () => {
      const p = MS.makePlayer('a');
      [0, 1, 2, 3, 4, 22, 23].forEach(h => GameSecretStats._trackTimeBased(p, at(h)));
      expect(p.stats.nightSessions || 0).toBe(0);
      expect(Badges.checkUnlocked(p).map(b => b.id)).not.toContain('night_owl');
    });

    it('night_owl se gagne désormais en soirée raisonnable (18 h à 21 h)', () => {
      const p = MS.makePlayer('a');
      GameSecretStats._trackTimeBased(p, at(19));
      expect(p.stats.nightSessions).toBe(1);
      expect(Badges.checkUnlocked(p).map(b => b.id)).toContain('night_owl');
    });

    it('night_owl n\'est jamais retiré à qui l\'a déjà', () => {
      const p = MS.makePlayer('a');
      p.badges = ['night_owl'];
      p.stats.nightSessions = 3;
      expect(p.badges).toContain('night_owl');
      expect(Badges.checkUnlocked(p).map(b => b.id)).not.toContain('night_owl');
    });

    it('la description de night_owl ne cite plus minuit et existe en fr et en', () => {
      const b = Badges.get('night_owl');
      expect(b.description).not.toContain('minuit');
      expect(b.description).not.toContain('nuit');
      expect(b.hint).not.toContain('nuit');
      ['badge.night_owl.name', 'badge.night_owl.description', 'badge.night_owl.hint'].forEach(k => {
        expect(typeof i18n._translations.fr[k]).toBe('string');
        expect(typeof i18n._translations.en[k]).toBe('string');
      });
    });

    it('early_bird : plage 6 h - 8 h (plus de réveil avant 6 h)', () => {
      const p = MS.makePlayer('a');
      [5, 5.5].forEach(h => GameSecretStats._trackTimeBased(p, at(Math.floor(h), h % 1 ? 30 : 0)));
      expect(p.stats.earlySessions || 0).toBe(0);
      GameSecretStats._trackTimeBased(p, at(6, 30));
      GameSecretStats._trackTimeBased(p, at(7, 59));
      expect(p.stats.earlySessions).toBe(2);
      GameSecretStats._trackTimeBased(p, at(8, 0));
      expect(p.stats.earlySessions).toBe(2);
    });

    it('le badge horaire golden_hour reste à 12:34 (pas de plage nocturne)', () => {
      const p = MS.makePlayer('a');
      GameSecretStats.trackCardTime(p, at(12, 34));
      expect(p.stats.goldenHourPlayed).toBe(true);
    });

    it('retention_20 : 20 cartes dont le repos atteint 7 jours', () => {
      expect(Badges.get('retention_20').condition(MS.makePlayer('a', { weekRestCards: 19 }))).toBe(false);
      expect(Badges.get('retention_20').condition(MS.makePlayer('a', { weekRestCards: 20 }))).toBe(true);
      expect(Badges.get('retention_20').condition(MS.makePlayer('a', {}))).toBe(false);
    });

    it('durable_75 et durable_200 : cartes dont le repos atteint 14 jours', () => {
      [['durable_75', 75], ['durable_200', 200]].forEach(([id, n]) => {
        expect(Badges.get(id).condition(MS.makePlayer('a', { longTermCards: n - 1 }))).toBe(false);
        expect(Badges.get(id).condition(MS.makePlayer('a', { longTermCards: n }))).toBe(true);
        expect(Badges.get(id).category).toBe('mastery');
      });
    });

    it('au plus trois badges ajoutés, aucun fondé sur le volume (cartes ou séances jouées)', () => {
      const added = ['retention_20', 'durable_75', 'durable_200'];
      added.forEach(id => {
        const src = String(Badges.get(id).condition);
        expect(src).not.toContain('totalCardsPlayed');
        expect(src).not.toContain('totalSessions');
      });
      expect(Badges.ALL).toHaveLength(43);
    });

    it('les nouveaux badges ont un nom et une description traduits (fr et en)', () => {
      ['retention_20', 'durable_75', 'durable_200'].forEach(id => {
        ['name', 'description'].forEach(f => {
          expect(typeof i18n._translations.fr['badge.' + id + '.' + f]).toBe('string');
          expect(typeof i18n._translations.en['badge.' + id + '.' + f]).toBe('string');
        });
        expect(Badges.get(id).name.length).toBeGreaterThan(0);
        expect(Badges.get(id).name).not.toBe('badge.' + id + '.name');
      });
    });
  });
});
