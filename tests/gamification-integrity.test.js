/**
 * Tests d'intégrité de la gamification (passe 1 : XP, série quotidienne, badges, annonces)
 *
 * Couvre les anomalies B1 à B15 de l'audit tmp/gamification-audit.md :
 * - B1  bonus de série versé une fois par palier et crédité au joueur
 * - B2  série quotidienne (jours de révision, jour sans carte due)
 * - B3  absence (comeback_kid)
 * - B4  annonces : une seule fonction d'attribution, résumé complet, popups groupées
 * - B5  montée de niveau détectée à chaque gain d'XP, célébrée une fois
 * - B6-B9 badges défectueux (speed_demon, perfect_session, untouchable, matières)
 * - B10 mode défi : bonus crédité une seule fois, badges et niveau contrôlés
 * - B13 jour calendaire local
 * - B15 garde sur un mode de défi inconnu
 *
 * Les fuseaux horaires sont simulés par une sous-classe de Date (getters "locaux" calculés
 * depuis un décalage), ce qui rend les tests indépendants de la variable TZ du processus.
 * Le runner entier a aussi été exécuté avec TZ=Europe/Paris et TZ=America/New_York.
 */

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

const GI = {
  RealDate: Date,
  // Originaux capturés au chargement du fichier : le runner n'exécute pas afterEach après
  // un test en échec, on restaure donc aussi dans beforeEach pour ne rien laisser fuir.
  origBadgeMultiple: Effects.badgePopup.showMultiple,
  origBadgeOne: Effects.badgePopup.show,
  origLevelShow: Effects.levelUp.show,

  /**
   * Installe une horloge simulée avec un fuseau fixe (décalage en minutes par rapport à UTC,
   * positif à l'est : Paris hiver = +60, New York hiver = -300).
   * @returns {{ clock: {now:number}, restore: Function }}
   */
  installClock(utcMs, offsetMin = 0) {
    const RealDate = GI.RealDate;
    const clock = { now: utcMs, offsetMin };
    const shifted = (d) => new RealDate(d.getTime() + clock.offsetMin * 60000);
    global.Date = class SimDate extends RealDate {
      constructor(...a) {
        if (a.length === 0) super(clock.now);
        else super(...a);
      }
      static now() { return clock.now; }
      getFullYear() { return shifted(this).getUTCFullYear(); }
      getMonth() { return shifted(this).getUTCMonth(); }
      getDate() { return shifted(this).getUTCDate(); }
      getDay() { return shifted(this).getUTCDay(); }
      getHours() { return shifted(this).getUTCHours(); }
      getMinutes() { return shifted(this).getUTCMinutes(); }
    };
    return { clock, restore() { global.Date = RealDate; } };
  },

  makeDeck(id, count, tags = ['maths']) {
    return {
      id,
      name: `Deck ${id}`,
      tags,
      settings: {},
      cards: Array.from({ length: count }, (_, i) => ({
        id: `${id}_c${i}`, question: `Q${i}`, answer: `A${i}`, type: 'text',
        box: 'never_played', latencyThreshold: null, restUntil: null, restDays: 0,
        timesPlayed: 0, timesCorrect: 0
      }))
    };
  },

  makePlayer(stats = {}) {
    return {
      id: 'p_gi', name: 'GI', badges: [],
      stats: {
        totalXP: 0, totalCardsPlayed: 0, totalSessions: 0, currentStreak: 0, longestStreak: 0,
        longestGreenStreak: 0, totalGreenCards: 0, lastPlayedAt: null, fastestCorrectAnswer: Infinity,
        uniqueDecksPlayed: 0, playedDeckIds: [], cardsBySubject: {}, xpHistory: [],
        ...stats
      }
    };
  },

  /**
   * Joue une séance complète (une réponse par entrée) via les vrais modules, carte par carte.
   * @param {Object} env - { player, decks }
   * @param {boolean[]} outcomes - réussite de chaque carte
   * @param {number} [rt] - temps de réponse en ms
   * @returns {Object} la session (terminée)
   */
  playSession(env, outcomes, rt = 2000, deckIndex = 0) {
    const deck = env.decks[deckIndex];
    const cards = deck.cards.filter(c => c.box !== 'green').slice(0, outcomes.length).map(c => ({ ...c }));
    const session = {
      deckId: deck.id, type: 'standard', cards, currentIndex: 0, isShowingFeedback: false,
      cardStartTime: Date.now(), startedAt: new Date().toISOString(), endedAt: null, results: [],
      stats: { cardsPlayed: 0, correctAnswers: 0, currentGreenStreak: 0, maxGreenStreak: 0, totalXpEarned: 0 }
    };
    const state = { player: env.player, decks: env.decks, currentSession: session };
    const origNavigate = Router.navigate;
    Router.navigate = () => {};
    try {
      for (let i = 0; i < outcomes.length; i++) {
        const card = session.cards[session.currentIndex];
        const ok = outcomes[i];
        const newBox = Leitner.getNextBox(card.box || 'never_played', ok, rt, (card.latencyThreshold || 3) * 1000);
        GameAnswerValidator._updateSessionStats(session, ok, newBox, rt, XP.calculateXpForCard(newBox), card);
        GameSessionManager.nextCard(state);
      }
    } finally {
      Router.navigate = origNavigate;
    }
    return session;
  },

  sumHistory(player) {
    return player.stats.xpHistory.reduce((s, h) => s + h.amount, 0);
  },

  spyEffects() {
    const spy = { badgeCalls: [], levelCalls: [] };
    Effects.badgePopup.showMultiple = (list) => { spy.badgeCalls.push(list.map(b => b.id)); };
    Effects.badgePopup.show = (b) => { spy.badgeCalls.push([b.id]); };
    Effects.levelUp.show = (lvl) => { spy.levelCalls.push(lvl); };
    spy.restore = () => {
      Effects.badgePopup.showMultiple = GI.origBadgeMultiple;
      Effects.badgePopup.show = GI.origBadgeOne;
      Effects.levelUp.show = GI.origLevelShow;
    };
    return spy;
  }
};

describe('Gamification - intégrité (passe 1)', () => {
  let sim = null;
  let spy = null;

  beforeEach(() => {
    global.Date = GI.RealDate;
    Effects.badgePopup.showMultiple = GI.origBadgeMultiple;
    Effects.badgePopup.show = GI.origBadgeOne;
    Effects.levelUp.show = GI.origLevelShow;
    State.reset();
    sim = null;
    spy = GI.spyEffects();
  });

  afterEach(() => {
    if (sim) sim.restore();
    if (spy) spy.restore();
    global.Date = GI.RealDate;
  });

  // ═══════════════════════════════════════════════════════════════
  // B1 - Bonus de série de cartes vertes
  // ═══════════════════════════════════════════════════════════════

  describe('B1 - bonus de série vert', () => {
    it('XP.getStreakMilestoneBonus ne rend le bonus qu\'au palier exact', () => {
      expect(XP.getStreakMilestoneBonus(2)).toBe(0);
      expect(XP.getStreakMilestoneBonus(3)).toBe(5);
      expect(XP.getStreakMilestoneBonus(4)).toBe(0);
      expect(XP.getStreakMilestoneBonus(12)).toBe(50);
      expect(XP.getStreakMilestoneBonus(13)).toBe(0);
      expect(XP.getStreakMilestoneBonus(100)).toBe(500);
      expect(XP.getStreakMilestoneBonus(101)).toBe(0);
    });

    it('12 vertes d\'affilée : bonus 5+15+30+50 versé une seule fois par palier', () => {
      const env = { player: GI.makePlayer({ fastestCorrectAnswer: 5000 }), decks: [GI.makeDeck('d1', 40)] };
      const session = GI.playSession(env, Array(12).fill(true));
      expect(session.stats.totalXpEarned).toBe(36 + 100);
    });

    it('au-dessus du palier la carte suivante ne rapporte que son XP de carte', () => {
      const env = { player: GI.makePlayer({ fastestCorrectAnswer: 5000 }), decks: [GI.makeDeck('d1', 40)] };
      const session = GI.playSession(env, Array(13).fill(true));
      expect(session.stats.totalXpEarned).toBe(39 + 100);
    });

    it('le bonus est réellement crédité : totalXP = cartes + bonus + badges, et xpHistory le reflète', () => {
      const env = { player: GI.makePlayer({ fastestCorrectAnswer: 5000 }), decks: [GI.makeDeck('d1', 40)] };
      const session = GI.playSession(env, Array(12).fill(true));
      const p = env.player;
      const otherXp = p.stats.xpHistory.filter(h => h.source !== 'session').reduce((s, h) => s + h.amount, 0);
      expect(p.stats.totalXP).toBe(session.stats.totalXpEarned + otherXp);
      expect(GI.sumHistory(p)).toBe(p.stats.totalXP);
    });

    it('le résultat de la carte expose le bonus (lastResult.bonusXp) au palier', () => {
      const session = createTestSession();
      session.stats.currentGreenStreak = 2;
      GameAnswerValidator._updateSessionStats(session, true, 'green', 1000, 3, { id: 'x', box: 'never_played' });
      expect(session.lastResult.bonusXp).toBe(5);
      expect(session.stats.totalXpEarned).toBe(8);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Combo retiré, paliers visuels alignés
  // ═══════════════════════════════════════════════════════════════

  describe('Combo retiré et paliers visuels', () => {
    it('le multiplicateur de combo n\'existe plus', () => {
      expect(XP.calculateXpWithCombo).toBeUndefined();
      expect(XP.getComboMultiplier).toBeUndefined();
      expect(XP.COMBO_MULTIPLIERS).toBeUndefined();
    });

    it('XP.getStreakTier : 3 actif, 6 chaud, 12 épique, 25 légendaire, 50 mythique', () => {
      expect(XP.getStreakTier(2)).toBe('none');
      expect(XP.getStreakTier(3)).toBe('active');
      expect(XP.getStreakTier(5)).toBe('active');
      expect(XP.getStreakTier(6)).toBe('hot');
      expect(XP.getStreakTier(11)).toBe('hot');
      expect(XP.getStreakTier(12)).toBe('epic');
      expect(XP.getStreakTier(25)).toBe('legendary');
      expect(XP.getStreakTier(49)).toBe('legendary');
      expect(XP.getStreakTier(50)).toBe('mythic');
    });

    function renderWithStreak(streak) {
      const deck = GI.makeDeck('dz', 3);
      return Pages.game.render({
        player: GI.makePlayer(), decks: [deck],
        currentSession: {
          deckId: 'dz', cards: deck.cards, currentIndex: 0, isShowingFeedback: false, lastResult: null,
          results: [], stats: { cardsPlayed: 0, correctAnswers: 0, currentGreenStreak: streak, maxGreenStreak: streak, totalXpEarned: 0 }
        }
      });
    }

    it('le jeu n\'affiche plus de multiplicateur "xN"', () => {
      expect(renderWithStreak(6)).not.toContain('combo-multiplier');
    });

    it('l\'entête de série utilise les mêmes paliers que le bonus', () => {
      expect(renderWithStreak(2)).not.toContain('game__streak ');
      expect(renderWithStreak(3)).toContain('game__streak-count');
      expect(renderWithStreak(5)).not.toContain('game__streak--hot');
      expect(renderWithStreak(6)).toContain('game__streak--hot');
      expect(renderWithStreak(11)).not.toContain('game__streak--fire');
      expect(renderWithStreak(12)).toContain('game__streak--fire');
      expect(renderWithStreak(24)).not.toContain('game__streak--legendary');
      expect(renderWithStreak(25)).toContain('game__streak--legendary');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // B13 - jour calendaire local
  // ═══════════════════════════════════════════════════════════════

  describe('B13 - jour calendaire local', () => {
    it('Paris : 00:30 locale (23:30 UTC la veille) est déjà le jour suivant', () => {
      sim = GI.installClock(GI.RealDate.UTC(2026, 0, 4, 23, 30), 60);
      expect(TextUtils.getToday()).toBe('2026-01-05');
      expect(PageUtils.getToday()).toBe('2026-01-05');
    });

    it('New York : 22:00 locale (03:00 UTC le lendemain) est encore la veille', () => {
      sim = GI.installClock(GI.RealDate.UTC(2026, 0, 5, 3, 0), -300);
      expect(TextUtils.getToday()).toBe('2026-01-04');
    });

    it('getLocalDateString accepte une date explicite', () => {
      sim = GI.installClock(GI.RealDate.UTC(2026, 5, 1, 12, 0), 120);
      expect(TextUtils.getLocalDateString(new Date(GI.RealDate.UTC(2026, 0, 4, 23, 30)))).toBe('2026-01-05');
    });

    it('addDays : arithmétique calendaire pure (mois, année, bissextile)', () => {
      expect(TextUtils.addDays('2026-01-31', 1)).toBe('2026-02-01');
      expect(TextUtils.addDays('2026-12-31', 1)).toBe('2027-01-01');
      expect(TextUtils.addDays('2028-02-28', 1)).toBe('2028-02-29');
      expect(TextUtils.addDays('2026-03-28', 2)).toBe('2026-03-30');
      expect(TextUtils.addDays('2026-01-05', -5)).toBe('2025-12-31');
    });

    it('daysBetween : nombre de jours calendaires', () => {
      expect(TextUtils.daysBetween('2026-01-05', '2026-01-05')).toBe(0);
      expect(TextUtils.daysBetween('2026-01-05', '2026-01-08')).toBe(3);
      expect(TextUtils.daysBetween('2025-12-30', '2026-01-02')).toBe(3);
    });

    it('getWeekStart : la semaine commence le lundi (heure locale)', () => {
      sim = GI.installClock(GI.RealDate.UTC(2026, 0, 4, 23, 30), 60); // lundi 5 janvier 00:30 à Paris
      expect(TextUtils.getWeekStart()).toBe('2026-01-05');
      sim.restore();
      sim = GI.installClock(GI.RealDate.UTC(2026, 0, 12, 4, 0), -300); // dimanche 11 janvier 23:00 à New York
      expect(TextUtils.getWeekStart()).toBe('2026-01-05');
    });

    it('Challenges._getWeekInfo utilise la fonction unique (Paris, lundi 00:30)', () => {
      sim = GI.installClock(GI.RealDate.UTC(2026, 0, 4, 23, 30), 60);
      const info = Challenges._getWeekInfo();
      expect(info.startDate).toBe('2026-01-05');
      expect(info.endDate).toBe('2026-01-11');
    });

    it('Challenges._getWeekInfo utilise la fonction unique (New York, dimanche 23:00)', () => {
      sim = GI.installClock(GI.RealDate.UTC(2026, 0, 12, 4, 0), -300);
      const info = Challenges._getWeekInfo();
      expect(info.startDate).toBe('2026-01-05');
      expect(info.endDate).toBe('2026-01-11');
    });

    it('Challenges._getTomorrow reste une simple addition de calendrier', () => {
      expect(Challenges._getTomorrow('2026-01-31')).toBe('2026-02-01');
    });

    it('repos Leitner : restUntil est calculé en jour local, cohérent avec getToday()', () => {
      sim = GI.installClock(GI.RealDate.UTC(2026, 0, 4, 23, 30), 60); // 5 janvier local
      const card = { id: 'c', box: 'never_played', timesPlayed: 0, timesCorrect: 0, restDays: 0, latencyThreshold: null };
      const updated = GameSessionTracker.updateCard(card, { isCorrect: true, newBox: 'green', responseTimeMs: 1000 });
      expect(updated.restUntil).toBe(TextUtils.addDays('2026-01-05', updated.restDays));
    });

    it('repos Leitner : une carte au repos jusqu\'au 6 est jouable le 6 local, même si UTC dit encore le 5', () => {
      sim = GI.installClock(GI.RealDate.UTC(2026, 0, 5, 23, 30), 60); // 6 janvier 00:30 local
      const card = { box: 'green', restUntil: '2026-01-06' };
      expect(Leitner.isCardPlayable(card, PageUtils.getToday())).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // B2 - série quotidienne
  // ═══════════════════════════════════════════════════════════════

  describe('B2 - série quotidienne', () => {
    it('4 jours consécutifs de révision : série = 4 et badge streak_3 obtenu', () => {
      sim = GI.installClock(GI.RealDate.UTC(2026, 0, 5, 10, 0));
      const env = { player: GI.makePlayer({ fastestCorrectAnswer: 5000 }), decks: [GI.makeDeck('d1', 40)] };
      for (let d = 0; d < 4; d++) {
        sim.clock.now = GI.RealDate.UTC(2026, 0, 5 + d, 10, 0);
        GI.playSession(env, [true, true]);
      }
      expect(env.player.stats.currentStreak).toBe(4);
      expect(env.player.stats.longestStreak).toBe(4);
      expect(env.player.badges).toContain('streak_3');
    });

    it('plusieurs séances le même jour ne comptent qu\'une fois', () => {
      sim = GI.installClock(GI.RealDate.UTC(2026, 0, 5, 10, 0));
      const env = { player: GI.makePlayer({ fastestCorrectAnswer: 5000 }), decks: [GI.makeDeck('d1', 40)] };
      GI.playSession(env, [true, true]);
      sim.clock.now += 3600000;
      GI.playSession(env, [true, true]);
      expect(env.player.stats.currentStreak).toBe(1);
    });

    it('un jour manqué alors que des cartes étaient à réviser remet la série à 1', () => {
      sim = GI.installClock(GI.RealDate.UTC(2026, 0, 5, 10, 0));
      const env = { player: GI.makePlayer({ fastestCorrectAnswer: 5000 }), decks: [GI.makeDeck('d1', 40)] };
      GI.playSession(env, [true, true]);
      sim.clock.now = GI.RealDate.UTC(2026, 0, 6, 10, 0);
      GI.playSession(env, [true, true]);
      sim.clock.now = GI.RealDate.UTC(2026, 0, 9, 10, 0);
      GI.playSession(env, [true, true]);
      expect(env.player.stats.currentStreak).toBe(1);
      expect(env.player.stats.longestStreak).toBe(2);
    });

    it('un jour sans aucune carte à réviser (decks commencés au repos) ne casse pas la série', () => {
      sim = GI.installClock(GI.RealDate.UTC(2026, 0, 5, 10, 0));
      // un seul deck, 2 cartes : les deux passent vertes et se reposent plusieurs jours
      const env = { player: GI.makePlayer({ fastestCorrectAnswer: 5000 }), decks: [GI.makeDeck('d1', 2)] };
      GI.playSession(env, [true, true]);
      const due = env.player.stats.nextReviewDay;
      expect(due > '2026-01-06').toBe(true); // rien à réviser le 6
      // le joueur revient le jour où les cartes redeviennent jouables
      const [y, m, d] = due.split('-').map(Number);
      sim.clock.now = GI.RealDate.UTC(y, m - 1, d, 10, 0);
      // Leitner remet les cartes au repos terminé dans la pioche
      env.decks[0].cards.forEach(c => { c.box = 'never_played'; c.restUntil = null; });
      GI.playSession(env, [true]);
      expect(env.player.stats.currentStreak).toBe(2);
    });

    it('si le joueur revient après le premier jour dû, la série repart à 1', () => {
      sim = GI.installClock(GI.RealDate.UTC(2026, 0, 5, 10, 0));
      const env = { player: GI.makePlayer({ fastestCorrectAnswer: 5000 }), decks: [GI.makeDeck('d1', 2)] };
      GI.playSession(env, [true, true]);
      const due = env.player.stats.nextReviewDay;
      const [y, m, d] = due.split('-').map(Number);
      sim.clock.now = GI.RealDate.UTC(y, m - 1, d + 2, 10, 0);
      env.decks[0].cards.forEach(c => { c.box = 'never_played'; c.restUntil = null; });
      GI.playSession(env, [true]);
      expect(env.player.stats.currentStreak).toBe(1);
    });

    it('computeNextReviewDay : jour dû le plus proche parmi les decks commencés, null si aucun', () => {
      const started = GI.makeDeck('a', 2);
      started.cards[0].box = 'green'; started.cards[0].restUntil = '2026-01-12'; started.cards[0].timesPlayed = 1;
      started.cards[1].box = 'green'; started.cards[1].restUntil = '2026-01-09'; started.cards[1].timesPlayed = 1;
      const untouched = GI.makeDeck('b', 5); // jamais commencé : ignoré
      expect(GameSessionTracker.computeNextReviewDay([started, untouched], '2026-01-05')).toBe('2026-01-09');
      expect(GameSessionTracker.computeNextReviewDay([untouched], '2026-01-05')).toBe(null);
    });

    it('computeNextReviewDay : une carte non verte dans un deck commencé est due dès demain', () => {
      const deck = GI.makeDeck('a', 2);
      deck.cards[0].box = 'green'; deck.cards[0].restUntil = '2026-02-01'; deck.cards[0].timesPlayed = 1;
      deck.cards[1].box = 'purple'; deck.cards[1].timesPlayed = 1;
      expect(GameSessionTracker.computeNextReviewDay([deck], '2026-01-05')).toBe('2026-01-06');
    });

    it('joueur existant (série à 0, lastPlayedAt hier, pas de lastStreakDay) : repart à 1 puis continue', () => {
      sim = GI.installClock(GI.RealDate.UTC(2026, 0, 6, 10, 0));
      const player = GI.makePlayer({ lastPlayedAt: '2026-01-05T09:00:00.000Z', currentStreak: 0, fastestCorrectAnswer: null });
      delete player.stats.xpHistory;
      const env = { player, decks: [GI.makeDeck('d1', 10)] };
      GI.playSession(env, [true, true]);
      expect(player.stats.currentStreak).toBe(1);
      sim.clock.now = GI.RealDate.UTC(2026, 0, 7, 10, 0);
      GI.playSession(env, [true]);
      expect(player.stats.currentStreak).toBe(2);
    });

    it('joueur existant ayant déjà joué aujourd\'hui avec l\'ancien code (série 0) : passe à 1', () => {
      sim = GI.installClock(GI.RealDate.UTC(2026, 0, 6, 10, 0));
      const player = GI.makePlayer({ lastPlayedAt: '2026-01-06T08:00:00.000Z', currentStreak: 0 });
      GameSessionTracker.updateDailyStreak(player);
      expect(player.stats.currentStreak).toBe(1);
      expect(player.stats.lastStreakDay).toBe('2026-01-06');
    });

    it('la série suit le jour local (Paris, 00:30 compte pour le nouveau jour)', () => {
      sim = GI.installClock(GI.RealDate.UTC(2026, 0, 5, 20, 0), 60); // 5 janvier 21:00 local
      const env = { player: GI.makePlayer({ fastestCorrectAnswer: 5000 }), decks: [GI.makeDeck('d1', 20)] };
      GI.playSession(env, [true]);
      sim.clock.now = GI.RealDate.UTC(2026, 0, 5, 23, 30); // 6 janvier 00:30 local : jour suivant
      GI.playSession(env, [true]);
      expect(env.player.stats.currentStreak).toBe(2);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // B3 - absence / comeback_kid
  // ═══════════════════════════════════════════════════════════════

  describe('B3 - absence et comeback_kid', () => {
    it('46 jours d\'absence : longestAbsence calculé et badge obtenu', () => {
      sim = GI.installClock(GI.RealDate.UTC(2026, 0, 5, 10, 0));
      const env = { player: GI.makePlayer({ fastestCorrectAnswer: 5000 }), decks: [GI.makeDeck('d1', 40)] };
      GI.playSession(env, [true, true]);
      sim.clock.now = GI.RealDate.UTC(2026, 1, 20, 10, 0);
      GI.playSession(env, [true, true]);
      expect(env.player.stats.longestAbsence).toBe(46);
      expect(env.player.badges).toContain('comeback_kid');
    });

    it('joueur existant (lastPlayedAt ancien, pas de lastStreakDay) : l\'absence est mesurée', () => {
      sim = GI.installClock(GI.RealDate.UTC(2026, 1, 20, 10, 0));
      const env = { player: GI.makePlayer({ lastPlayedAt: '2026-01-05T10:00:00.000Z', fastestCorrectAnswer: 5000 }), decks: [GI.makeDeck('d1', 40)] };
      GI.playSession(env, [true, true]);
      expect(env.player.stats.longestAbsence).toBe(46);
    });

    it('une absence courte ne donne pas le badge', () => {
      sim = GI.installClock(GI.RealDate.UTC(2026, 0, 5, 10, 0));
      const env = { player: GI.makePlayer({ fastestCorrectAnswer: 5000 }), decks: [GI.makeDeck('d1', 40)] };
      GI.playSession(env, [true, true]);
      sim.clock.now = GI.RealDate.UTC(2026, 0, 12, 10, 0);
      GI.playSession(env, [true, true]);
      expect(env.player.stats.longestAbsence).toBe(7);
      expect(env.player.badges).not.toContain('comeback_kid');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // B5 - montée de niveau
  // ═══════════════════════════════════════════════════════════════

  describe('B5 - montée de niveau', () => {
    it('XP.grant renvoie le niveau avant/après', () => {
      const p = GI.makePlayer({ totalXP: 95 });
      const r = XP.grant(p, 10);
      expect(p.stats.totalXP).toBe(105);
      expect(r.previousLevel).toBe(1);
      expect(r.newLevel).toBe(2);
      expect(r.leveledUp).toBe(true);
      expect(XP.grant(p, 0).leveledUp).toBe(false);
      expect(XP.grant(p, -5).leveledUp).toBe(false);
      expect(p.stats.totalXP).toBe(105);
    });

    it('niveau franchi par l\'XP des cartes : célébré une seule fois, pas de doublon en fin de session', () => {
      const env = { player: GI.makePlayer({ totalXP: 95, fastestCorrectAnswer: 5000 }), decks: [GI.makeDeck('d1', 10)] };
      GI.playSession(env, [true, true, true, true]); // se termine : endSession appelé
      expect(spy.levelCalls).toEqual([2]);
    });

    it('niveau franchi par l\'XP d\'un badge : détecté et célébré', () => {
      // 89 XP + 1 (carte fausse -> purple) = 90 ; badge first_card +10 -> 100 = niveau 2
      const env = { player: GI.makePlayer({ totalXP: 89, fastestCorrectAnswer: 5000 }), decks: [GI.makeDeck('d1', 10)] };
      GI.playSession(env, [false, false, false]);
      expect(env.player.badges).toContain('first_card');
      expect(XP.calculateLevel(env.player.stats.totalXP)).toBe(2);
      expect(spy.levelCalls).toEqual([2]);
    });

    it('aucune célébration sans changement de niveau', () => {
      const env = { player: GI.makePlayer({ totalXP: 10, fastestCorrectAnswer: 5000 }), decks: [GI.makeDeck('d1', 10)] };
      GI.playSession(env, [true, false]);
      expect(spy.levelCalls).toEqual([]);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // B4 - annonces des badges
  // ═══════════════════════════════════════════════════════════════

  describe('B4 - attribution et annonces des badges', () => {
    it('une seule fonction d\'attribution : awardBadges (anciennes fonctions supprimées)', () => {
      expect(typeof GameSessionManager.awardBadges).toBe('function');
      expect(GameSessionManager._checkBadges).toBeUndefined();
      expect(GameSessionManager._checkAndAttributeBadges).toBeUndefined();
    });

    it('awardBadges crédite le badge une fois, avec XP et historique, et renvoie les badges', () => {
      const player = GI.makePlayer({ totalCardsPlayed: 1 });
      const awarded = GameSessionManager.awardBadges(player, null);
      expect(awarded.map(b => b.id)).toContain('first_card');
      expect(player.badges).toContain('first_card');
      expect(player.stats.xpHistory.some(h => h.source === 'badge')).toBe(true);
      expect(GI.sumHistory(player)).toBe(player.stats.totalXP);
      expect(GameSessionManager.awardBadges(player, null)).toEqual([]);
    });

    it('awardBadges alimente session.newBadges (résumé) et une seule annonce groupée', () => {
      const player = GI.makePlayer({ totalCardsPlayed: 60, totalGreenCards: 12 });
      const session = createTestSession();
      const awarded = GameSessionManager.awardBadges(player, session, { sessionEnded: false });
      expect(awarded.length).toBeGreaterThan(1);
      expect(session.newBadges.map(b => b.id)).toEqual(awarded.map(b => b.id));
      expect(spy.badgeCalls).toHaveLength(1);
      expect(spy.badgeCalls[0]).toEqual(awarded.map(b => b.id));
    });

    it('awardBadges enchaîne : l\'XP d\'un badge peut débloquer un badge de niveau (même annonce)', () => {
      // 495 XP : niveau 3 ; first_card (+10) amène à 505 -> niveau 3... on vise le niveau 5 (1600) : 1590 + 10
      const player = GI.makePlayer({ totalXP: 1595, totalCardsPlayed: 1 });
      const awarded = GameSessionManager.awardBadges(player, null);
      const ids = awarded.map(b => b.id);
      expect(ids).toContain('first_card');
      expect(ids).toContain('level_5');
      expect(spy.badgeCalls).toHaveLength(1);
    });

    it('les badges obtenus carte par carte figurent dans le résumé de fin de session', () => {
      const env = { player: GI.makePlayer({ fastestCorrectAnswer: 5000 }), decks: [GI.makeDeck('d1', 40)] };
      const session = GI.playSession(env, Array(12).fill(true));
      const ids = session.newBadges.map(b => b.id);
      expect(ids).toContain('first_card');
      expect(ids).toContain('green_streak_5');
      expect(ids).toContain('green_streak_10');
      expect(ids).toContain('first_session');
      // exactement les badges du joueur (aucun doublon, aucun oubli)
      expect([...ids].sort()).toEqual([...env.player.badges].sort());
    });

    it('chaque badge est annoncé exactement une fois sur la séance', () => {
      const env = { player: GI.makePlayer({ fastestCorrectAnswer: 5000 }), decks: [GI.makeDeck('d1', 40)] };
      GI.playSession(env, Array(12).fill(true));
      const announced = spy.badgeCalls.reduce((a, c) => a.concat(c), []);
      expect([...announced].sort()).toEqual([...env.player.badges].sort());
    });

    it('Effects.badgePopup.showMultiple regroupe plusieurs badges en une seule popup', () => {
      spy.restore(); spy = null;
      const badges = [
        { id: 'a', name: 'Alpha', icon: '🅰️', description: 'da', rarity: 'common' },
        { id: 'b', name: 'Beta', icon: '🅱️', description: 'db', rarity: 'rare' },
        { id: 'c', name: 'Gamma', icon: '🔺', description: 'dc', rarity: 'epic' }
      ];
      Effects.badgePopup.queue = []; Effects.badgePopup.isShowing = false;
      document.querySelectorAll('.badge-popup').forEach(e => e.remove());
      Effects.badgePopup.showMultiple(badges);
      const popups = document.querySelectorAll('.badge-popup');
      expect(popups.length).toBe(1);
      const text = popups[0].textContent;
      expect(text).toContain('Alpha');
      expect(text).toContain('Beta');
      expect(text).toContain('Gamma');
      Effects.badgePopup.queue = []; Effects.badgePopup.isShowing = false;
      document.querySelectorAll('.badge-popup').forEach(e => e.remove());
    });

    it('la popup groupée échappe les noms de badges', () => {
      spy.restore(); spy = null;
      Effects.badgePopup.queue = []; Effects.badgePopup.isShowing = false;
      document.querySelectorAll('.badge-popup').forEach(e => e.remove());
      Effects.badgePopup.showMultiple([
        { id: 'x', name: '<img src=x onerror=alert(1)>', icon: '🅰️', rarity: 'common' },
        { id: 'y', name: 'Normal', icon: '🅱️', rarity: 'common' }
      ]);
      expect(document.querySelector('.badge-popup img')).toBeNull();
      Effects.badgePopup.queue = []; Effects.badgePopup.isShowing = false;
      document.querySelectorAll('.badge-popup').forEach(e => e.remove());
    });

    it('un seul badge : popup individuelle inchangée', () => {
      spy.restore(); spy = null;
      Effects.badgePopup.queue = []; Effects.badgePopup.isShowing = false;
      document.querySelectorAll('.badge-popup').forEach(e => e.remove());
      Effects.badgePopup.showMultiple([{ id: 'a', name: 'Solo', icon: '🅰️', description: 'd', rarity: 'common' }]);
      expect(document.querySelectorAll('.badge-popup').length).toBe(1);
      expect(document.querySelector('.badge-popup__name').textContent).toBe('Solo');
      Effects.badgePopup.queue = []; Effects.badgePopup.isShowing = false;
      document.querySelectorAll('.badge-popup').forEach(e => e.remove());
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // B6 / B7 / B9 / B8 - badges défectueux
  // ═══════════════════════════════════════════════════════════════

  describe('B6 - speed_demon', () => {
    it('pas de badge si aucune réponse correcte n\'a été mesurée (null, undefined, Infinity)', () => {
      [null, undefined, Infinity].forEach(v => {
        const p = GI.makePlayer({ fastestCorrectAnswer: v });
        expect(Badges.checkUnlocked(p).map(b => b.id)).not.toContain('speed_demon');
      });
    });

    it('badge obtenu sous 1 seconde', () => {
      const p = GI.makePlayer({ fastestCorrectAnswer: 900 });
      expect(Badges.checkUnlocked(p).map(b => b.id)).toContain('speed_demon');
      const q = GI.makePlayer({ fastestCorrectAnswer: 1000 });
      expect(Badges.checkUnlocked(q).map(b => b.id)).not.toContain('speed_demon');
    });

    it('première réponse fausse sur un joueur existant (fastestCorrectAnswer null) : pas de badge', () => {
      const env = { player: GI.makePlayer({ fastestCorrectAnswer: null }), decks: [GI.makeDeck('d1', 10)] };
      GI.playSession(env, [false, true]);
      expect(env.player.badges).not.toContain('speed_demon');
      expect(typeof env.player.stats.fastestCorrectAnswer).toBe('number');
    });

    it('un joueur ayant déjà reçu le badge à tort le conserve', () => {
      const env = { player: GI.makePlayer({ fastestCorrectAnswer: null }), decks: [GI.makeDeck('d1', 10)] };
      env.player.badges.push('speed_demon');
      GI.playSession(env, [false, true]);
      expect(env.player.badges).toContain('speed_demon');
    });
  });

  describe('B7 - perfect_session', () => {
    const perfect = { stats: { cardsPlayed: 10, correctAnswers: 10, maxGreenStreak: 0 } };

    it('n\'est pas évalué sur une séance en cours', () => {
      const p = GI.makePlayer();
      expect(Badges.checkUnlocked(p, perfect, { sessionEnded: false }).map(b => b.id)).not.toContain('perfect_session');
    });

    it('est évalué sur une séance terminée (comportement par défaut)', () => {
      const p = GI.makePlayer();
      expect(Badges.checkUnlocked(p, perfect).map(b => b.id)).toContain('perfect_session');
      expect(Badges.checkUnlocked(p, perfect, { sessionEnded: true }).map(b => b.id)).toContain('perfect_session');
    });

    it('10 justes puis 10 fausses : jamais de badge', () => {
      const env = { player: GI.makePlayer({ fastestCorrectAnswer: 5000 }), decks: [GI.makeDeck('d1', 30)] };
      GI.playSession(env, [...Array(10).fill(true), ...Array(10).fill(false)]);
      expect(env.player.badges).not.toContain('perfect_session');
    });

    it('10 justes sur 10 cartes : badge obtenu en fin de séance', () => {
      const env = { player: GI.makePlayer({ fastestCorrectAnswer: 5000 }), decks: [GI.makeDeck('d1', 30)] };
      const session = GI.playSession(env, Array(10).fill(true));
      expect(env.player.badges).toContain('perfect_session');
      expect(session.newBadges.map(b => b.id)).toContain('perfect_session');
    });
  });

  describe('B8 - badges de matière', () => {
    it('Badges.getSubjectsForDeck normalise accents, alias et singulier/pluriel', () => {
      expect(Badges.getSubjectsForDeck({ tags: ['math'] })).toEqual(['maths']);
      expect(Badges.getSubjectsForDeck({ tags: ['Mathématiques'] })).toEqual(['maths']);
      expect(Badges.getSubjectsForDeck({ category: ['Français'] })).toEqual(['francais']);
      expect(Badges.getSubjectsForDeck({ tags: ['francais'] })).toEqual(['francais']);
      expect(Badges.getSubjectsForDeck({ tags: ['histoire'] })).toEqual(['histoire']);
      expect(Badges.getSubjectsForDeck({ tags: ['science', 'chimie'] })).toEqual(['sciences']);
      expect(Badges.getSubjectsForDeck({ tags: ['langues'] })).toEqual([]);
      expect(Badges.getSubjectsForDeck({})).toEqual([]);
    });

    it('un deck de maths (qui porte aussi le tag "sciences") ne compte pas pour les sciences', () => {
      expect(Badges.getSubjectsForDeck({ category: ['sciences', 'maths', 'arithmetique'] })).toEqual(['maths']);
    });

    it('_trackSubjectProgress compte des cartes distinctes maîtrisées (vertes), pas des cartes jouées', () => {
      const player = GI.makePlayer();
      const deck = GI.makeDeck('dm', 5, ['math']);
      const card = deck.cards[0];
      for (let i = 0; i < 20; i++) {
        GameSessionManager._trackSubjectProgress(player, deck, card, { newBox: 'green' });
      }
      expect(player.stats.masteredBySubject.maths.length).toBe(1);
      GameSessionManager._trackSubjectProgress(player, deck, deck.cards[1], { newBox: 'purple' });
      GameSessionManager._trackSubjectProgress(player, deck, deck.cards[2], { newBox: 'orange' });
      expect(player.stats.masteredBySubject.maths.length).toBe(1);
      GameSessionManager._trackSubjectProgress(player, deck, deck.cards[3], { newBox: 'green' });
      expect(player.stats.masteredBySubject.maths.length).toBe(2);
    });

    it('le décompte est plafonné (pas de croissance sans fin du joueur stocké)', () => {
      const player = GI.makePlayer();
      const deck = GI.makeDeck('dm', 300, ['maths']);
      deck.cards.forEach(c => GameSessionManager._trackSubjectProgress(player, deck, c, { newBox: 'green' }));
      expect(player.stats.masteredBySubject.maths.length).toBe(100);
      expect(Badges.checkUnlocked(player).map(b => b.id)).toContain('math_expert');
    });

    it('math_beginner : 10 cartes maths distinctes maîtrisées en jouant un deck "math"', () => {
      const env = { player: GI.makePlayer({ fastestCorrectAnswer: 5000 }), decks: [GI.makeDeck('dm', 12, ['math', 'sciences'])] };
      GI.playSession(env, Array(12).fill(true));
      expect(env.player.badges).toContain('math_beginner');
      expect(env.player.badges).not.toContain('math_expert');
      expect(env.player.badges).not.toContain('science_beginner');
    });

    it('rejouer en échouant ne fait pas gagner de badge de matière', () => {
      const env = { player: GI.makePlayer({ fastestCorrectAnswer: 5000 }), decks: [GI.makeDeck('dm', 12, ['maths'])] };
      GI.playSession(env, Array(12).fill(false));
      expect(env.player.badges).not.toContain('math_beginner');
    });

    it('french_beginner est atteignable avec une catégorie "Français" (accent)', () => {
      const env = { player: GI.makePlayer({ fastestCorrectAnswer: 5000 }), decks: [GI.makeDeck('df', 12, ['Français'])] };
      GI.playSession(env, Array(12).fill(true));
      expect(env.player.badges).toContain('french_beginner');
    });

    it('science_beginner et history_beginner atteignables', () => {
      const env = { player: GI.makePlayer({ fastestCorrectAnswer: 5000 }), decks: [GI.makeDeck('ds', 10, ['science']), GI.makeDeck('dh', 10, ['histoire'])] };
      GI.playSession(env, Array(10).fill(true), 2000, 0);
      GI.playSession(env, Array(10).fill(true), 2000, 1);
      expect(env.player.badges).toContain('science_beginner');
      expect(env.player.badges).toContain('history_beginner');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // B9 / B10 / B15 - mode défi (réintégré : une autre façon de réviser)
  // ═══════════════════════════════════════════════════════════════

  describe('Mode défi', () => {
    function playChallenge(player, modeId, difficulty, outcomes) {
      const deck = GI.makeDeck('dc', 20);
      deck.settings = { sequential: true };
      deck.cards.forEach(c => { c.box = 'purple'; c.timesPlayed = 1; c.latencyThreshold = 3; });
      const session = Challenges.createChallengeSession({ modeId, difficulty }, deck, TextUtils.getToday(), player);
      const state = { player, decks: [deck], currentSession: session };
      State.set('decks', [deck]);
      const origNavigate = Router.navigate; Router.navigate = () => {};
      try {
        for (let i = 0; i < outcomes.length && session.currentIndex < session.cards.length; i++) {
          const card = session.cards[session.currentIndex];
          session.cardStartTime = Date.now() - 2000;
          GameAnswerValidator.validate(state, outcomes[i] ? card.answer : 'zzz');
          GameSessionManager.nextCard(state);
        }
      } finally { Router.navigate = origNavigate; }
      return { session, state };
    }

    function showResults(state) {
      const origNavigate = Router.navigate; Router.navigate = () => {};
      try {
        const container = document.createElement('div');
        Pages.challengeResults.mount(container, state);
        return container;
      } finally { Router.navigate = origNavigate; }
    }

    it('B10 : le bonus est crédité une seule fois, même si la page de résultats est réaffichée', () => {
      const player = GI.makePlayer({ fastestCorrectAnswer: 5000 });
      const { state } = playChallenge(player, 'steady', 'easy', Array(5).fill(true));
      const afterEnd = player.stats.totalXP;
      showResults(state);
      showResults(state);
      showResults(state);
      expect(player.stats.totalXP).toBe(afterEnd);
      expect(player.stats.challengeWins).toBe(1);
    });

    it('B10 : le bonus du défi est inscrit dans xpHistory (source challenge) et l\'historique reste cohérent', () => {
      const player = GI.makePlayer({ fastestCorrectAnswer: 5000 });
      playChallenge(player, 'steady', 'easy', Array(5).fill(true));
      const bonus = player.stats.xpHistory.filter(h => h.source === 'challenge' && h.details === 'steady');
      expect(bonus).toHaveLength(1);
      expect(bonus[0].amount).toBe(Challenges.CHALLENGE_BONUS_XP);
      expect(GI.sumHistory(player)).toBe(player.stats.totalXP);
    });

    it('B10 : badges et niveau contrôlés après un défi', () => {
      const player = GI.makePlayer({ fastestCorrectAnswer: 5000, totalXP: 95 });
      playChallenge(player, 'steady', 'easy', Array(5).fill(true));
      expect(player.badges).toContain('first_card');
      expect(spy.levelCalls.length).toBeGreaterThan(0);
      expect(spy.levelCalls[spy.levelCalls.length - 1]).toBe(XP.calculateLevel(player.stats.totalXP));
    });

    it('B10 : le meilleur score est mis à jour', () => {
      const player = GI.makePlayer({ fastestCorrectAnswer: 5000 });
      const { session } = playChallenge(player, 'steady', 'easy', Array(5).fill(true));
      expect(player.challengeScores.steady_easy).toBe(Challenges.evaluateChallenge(session).score);
    });

    it('B9 : untouchable obtenu pour un Sans erreur de 12 cartes sans aucune erreur', () => {
      const player = GI.makePlayer({ fastestCorrectAnswer: 5000 });
      playChallenge(player, 'perfect', 'hard', Array(12).fill(true));
      expect(player.stats.perfectChallengeComplete).toBe(true);
      expect(player.badges).toContain('untouchable');
    });

    it('B9 : pas d\'untouchable avec une erreur, même si la série visée est atteinte', () => {
      const player = GI.makePlayer({ fastestCorrectAnswer: 5000 });
      const { session } = playChallenge(player, 'perfect', 'hard', [false, ...Array(11).fill(true)]);
      expect(session.challengeOutcome.success).toBe(true);
      expect(player.stats.perfectChallengeComplete).toBeFalsy();
      expect(player.badges).not.toContain('untouchable');
    });

    it('B15 : createChallengeSession renvoie null pour un mode ou un niveau inconnus', () => {
      const deck = GI.makeDeck('d', 20);
      expect(Challenges.createChallengeSession({ modeId: 'inconnu', difficulty: 'easy' }, deck, TextUtils.getToday())).toBeNull();
      expect(Challenges.createChallengeSession({ modeId: 'steady', difficulty: 'impossible' }, deck, TextUtils.getToday())).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Mineurs
  // ═══════════════════════════════════════════════════════════════

  describe('Mineurs', () => {
    it('weekend_warrior : la série de weekends traverse le passage d\'année', () => {
      const player = GI.makePlayer();
      // samedis/dimanches : 20-21 déc. 2025 (S51), 27-28 déc. (S52), 3-4 janv. 2026 (S01), 10-11 janv. (S02)
      const weekends = [[2025, 11, 20], [2025, 11, 27], [2026, 0, 3], [2026, 0, 10]];
      weekends.forEach(([y, m, d]) => {
        GameSecretStats._trackWeekend(player, new Date(y, m, d, 10, 0));
        GameSecretStats._trackWeekend(player, new Date(y, m, d + 1, 10, 0));
      });
      expect(player.stats.weekendStreakWeeks).toBe(4);
      expect(Badges.checkUnlocked(player).map(b => b.id)).toContain('weekend_warrior');
    });

    it('weekend : un week-end manqué interrompt la série', () => {
      const player = GI.makePlayer();
      [[2026, 0, 3], [2026, 0, 17], [2026, 0, 24]].forEach(([y, m, d]) => {
        GameSecretStats._trackWeekend(player, new Date(y, m, d, 10, 0));
        GameSecretStats._trackWeekend(player, new Date(y, m, d + 1, 10, 0));
      });
      expect(player.stats.weekendStreakWeeks).toBe(2);
    });

    it('weekend : les anciennes clés numériques (semaine ISO) d\'un joueur existant restent exploitées', () => {
      const player = GI.makePlayer({ weekendWeeks: { 1: { sat: true, sun: true }, 2: { sat: true, sun: true }, 3: { sat: true, sun: true } } });
      sim = GI.installClock(GI.RealDate.UTC(2026, 0, 24, 10, 0)); // samedi, semaine ISO 4
      GameSecretStats._trackWeekend(player, new Date());
      sim.clock.now = GI.RealDate.UTC(2026, 0, 25, 10, 0);
      GameSecretStats._trackWeekend(player, new Date());
      expect(player.stats.weekendStreakWeeks).toBe(4);
    });

    it('golden_hour : l\'indice ne donne pas la condition (aucun chiffre)', () => {
      const hint = Badges.get('golden_hour').hint;
      expect(/\d/.test(hint)).toBe(false);
    });

    it('golden_hour : une réponse à 12:34 suffit (pas besoin de finir la séance à cette minute)', () => {
      sim = GI.installClock(GI.RealDate.UTC(2026, 0, 5, 12, 34, 10));
      const env = { player: GI.makePlayer({ fastestCorrectAnswer: 5000 }), decks: [GI.makeDeck('d1', 10)] };
      // la séance se terminerait à 12:36 : la carte 1 est jouée à 12:34
      const session = {
        deckId: 'd1', type: 'standard', cards: env.decks[0].cards.slice(0, 2).map(c => ({ ...c })), currentIndex: 0,
        isShowingFeedback: false, cardStartTime: Date.now(), results: [],
        stats: { cardsPlayed: 0, correctAnswers: 0, currentGreenStreak: 0, maxGreenStreak: 0, totalXpEarned: 0 }
      };
      const state = { player: env.player, decks: env.decks, currentSession: session };
      GameAnswerValidator._updateSessionStats(session, true, 'green', 2000, 3, session.cards[0]);
      GameSessionManager.nextCard(state);
      expect(env.player.stats.goldenHourPlayed).toBe(true);
      expect(env.player.badges).toContain('golden_hour');
    });

    it('joueur existant mal initialisé (xpHistory absent, fastestCorrectAnswer null) : se charge et joue sans erreur', () => {
      const player = GI.makePlayer({ fastestCorrectAnswer: null, currentStreak: 0 });
      delete player.stats.xpHistory;
      delete player.stats.playedDeckIds;
      const env = { player, decks: [GI.makeDeck('d1', 5)] };
      GI.playSession(env, [true, false, true]);
      expect(player.stats.totalCardsPlayed).toBe(3);
      expect(Array.isArray(player.stats.xpHistory)).toBe(true);
    });
  });
});
