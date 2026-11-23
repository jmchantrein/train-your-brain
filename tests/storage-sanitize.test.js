/**
 * Tests de sanitisation des données importées / rechargées (audit de publication B1)
 *
 * Une sauvegarde JSON ou un fichier de progression YAML est une entrée non fiable : les champs
 * numériques du joueur finissent insérés dans du HTML. La correction est à la source : chaque champ
 * est ramené à son type attendu (types.js) à l'import et au chargement ; une structure
 * inexploitable est rejetée sans écriture partielle.
 */

if (typeof Storage === 'undefined') {
  global.Storage = require('../src/modules/storage.js');
}

const XSS_PAYLOAD = '<img src=x onerror=window.__xss=1>';

describe('Storage.sanitizePlayer - types attendus', () => {
  it('should force every numeric stat back to a finite number', () => {
    const player = Storage.sanitizePlayer({
      id: 'p1',
      name: 'Alice',
      createdAt: '2025-01-01T00:00:00Z',
      stats: {
        totalXP: XSS_PAYLOAD,
        totalCardsPlayed: { toString: 'x' },
        totalSessions: [1, 2],
        currentStreak: '<svg onload=1>',
        longestStreak: NaN,
        longestGreenStreak: Infinity,
        totalGreenCards: true
      }
    });

    for (const field of ['totalXP', 'totalCardsPlayed', 'totalSessions', 'currentStreak',
      'longestStreak', 'longestGreenStreak', 'totalGreenCards']) {
      expect(typeof player.stats[field]).toBe('number');
      expect(Number.isFinite(player.stats[field])).toBe(true);
      expect(player.stats[field]).toBe(0);
    }
  });

  it('should keep valid numbers and accept numeric strings, never negatives', () => {
    const player = Storage.sanitizePlayer({
      id: 'p1', name: 'A', createdAt: '2025-01-01',
      stats: { totalXP: 250, totalCardsPlayed: '12', totalSessions: -4 }
    });
    expect(player.stats.totalXP).toBe(250);
    expect(player.stats.totalCardsPlayed).toBe(12);
    expect(player.stats.totalSessions).toBe(0);
  });

  it('should coerce name, id and dates to safe values', () => {
    const player = Storage.sanitizePlayer({
      id: 'p1', name: 42, createdAt: XSS_PAYLOAD,
      stats: { lastPlayedAt: XSS_PAYLOAD }
    });
    expect(typeof player.name).toBe('string');
    expect(Number.isNaN(Date.parse(player.createdAt))).toBe(false);
    expect(player.stats.lastPlayedAt).toBeNull();
  });

  it('should keep a valid lastPlayedAt date', () => {
    const player = Storage.sanitizePlayer({
      id: 'p1', name: 'A', createdAt: '2025-01-01',
      stats: { lastPlayedAt: '2025-03-04' }
    });
    expect(player.stats.lastPlayedAt).toBe('2025-03-04');
  });

  it('should reduce badges to an array of strings', () => {
    const ok = Storage.sanitizePlayer({ id: 'p', name: 'A', createdAt: '2025-01-01', badges: ['a', 3, null, { x: 1 }, 'b'] });
    expect(ok.badges).toEqual(['a', 'b']);

    const notArray = Storage.sanitizePlayer({ id: 'p', name: 'A', createdAt: '2025-01-01', badges: XSS_PAYLOAD });
    expect(notArray.badges).toEqual([]);
  });

  it('should reduce optional stats to their expected type', () => {
    const player = Storage.sanitizePlayer({
      id: 'p', name: 'A', createdAt: '2025-01-01',
      stats: {
        fastestCorrectAnswer: XSS_PAYLOAD,
        uniqueDecksPlayed: XSS_PAYLOAD,
        playedDeckIds: ['d1', 5, { a: 1 }, 'd2'],
        cardsBySubject: { maths: 3, evil: XSS_PAYLOAD, nested: { a: 1 } },
        goldenHourPlayed: XSS_PAYLOAD,
        perfectChallengeComplete: true,
        xpHistory: [
          { date: '2025-01-02', amount: 5, source: 'session', cardsPlayed: 3 },
          { date: XSS_PAYLOAD, amount: XSS_PAYLOAD, source: XSS_PAYLOAD },
          'garbage',
          null
        ],
        weekendWeeks: { '2025-W01': { sat: true, sun: XSS_PAYLOAD }, bad: 3 }
      }
    });
    const s = player.stats;
    expect(s.fastestCorrectAnswer).toBeNull();
    expect(s.uniqueDecksPlayed).toBe(0);
    expect(s.playedDeckIds).toEqual(['d1', 'd2']);
    expect(s.cardsBySubject).toEqual({ maths: 3 });
    expect(s.goldenHourPlayed).toBe(false);
    expect(s.perfectChallengeComplete).toBe(true);
    expect(s.xpHistory[0].amount).toBe(5);
    expect(s.xpHistory[0].cardsPlayed).toBe(3);
    for (const entry of s.xpHistory) {
      expect(typeof entry.amount).toBe('number');
      expect(Number.isNaN(Date.parse(entry.date))).toBe(false);
    }
    expect(s.weekendWeeks['2025-W01']).toEqual({ sat: true, sun: false });
    expect(s.weekendWeeks.bad).toBeUndefined();
  });

  it('should keep the other numeric secret stats and drop non-primitive unknown stats', () => {
    const player = Storage.sanitizePlayer({
      id: 'p', name: 'A', createdAt: '2025-01-01',
      stats: { nightSessions: 2, longestSession: '40', futureFlag: true, futureObj: { a: 1 }, futureStr: XSS_PAYLOAD }
    });
    expect(player.stats.nightSessions).toBe(2);
    expect(player.stats.longestSession).toBe(40);
    expect(player.stats.futureFlag).toBe(true);
    expect(player.stats.futureObj).toBeUndefined();
    expect(player.stats.futureStr).toBeUndefined();
  });

  it('should reduce secretStats and settings to primitives', () => {
    const player = Storage.sanitizePlayer({
      id: 'p', name: 'A', createdAt: '2025-01-01',
      secretStats: { nightOwlSessions: XSS_PAYLOAD, weekendSessions: 2 },
      settings: { soundEnabled: 'yes', theme: 'dark', nested: { a: 1 }, language: 'fr' },
      challengeScores: { classic_easy: 120, evil: XSS_PAYLOAD }
    });
    expect(player.secretStats.nightOwlSessions).toBe(0);
    expect(player.secretStats.weekendSessions).toBe(2);
    expect(player.settings.nested).toBeUndefined();
    expect(player.settings.theme).toBe('dark');
    expect(player.settings.language).toBe('fr');
    expect(player.challengeScores).toEqual({ classic_easy: 120 });
  });

  it('should not pollute prototypes through __proto__ keys', () => {
    const hostile = JSON.parse('{"id":"p","name":"A","createdAt":"2025-01-01","stats":{"__proto__":{"polluted":1},"cardsBySubject":{"__proto__":5}},"settings":{"__proto__":{"polluted":1}}}');
    const player = Storage.sanitizePlayer(hostile);
    expect(({}).polluted).toBeUndefined();
    expect(player.stats.polluted).toBeUndefined();
    expect(player.settings.polluted).toBeUndefined();
  });

  it('should reject a structure that cannot be used', () => {
    expect(Storage.sanitizePlayer(null)).toBeNull();
    expect(Storage.sanitizePlayer('alice')).toBeNull();
    expect(Storage.sanitizePlayer([])).toBeNull();
    expect(Storage.sanitizePlayer({ name: 'no id' })).toBeNull();
    expect(Storage.sanitizePlayer({ id: { a: 1 }, name: 'x' })).toBeNull();
    expect(Storage.sanitizePlayer({ id: '', name: 'x' })).toBeNull();
  });

  it('should be idempotent', () => {
    const once = Storage.sanitizePlayer({ id: 'p', name: 'A', createdAt: '2025-01-01', stats: { totalXP: '7' }, badges: ['a'] });
    const twice = Storage.sanitizePlayer(once);
    expect(JSON.stringify(twice)).toBe(JSON.stringify(once));
  });

  it('should not mutate its input', () => {
    const input = { id: 'p', name: 'A', createdAt: '2025-01-01', stats: { totalXP: XSS_PAYLOAD } };
    Storage.sanitizePlayer(input);
    expect(input.stats.totalXP).toBe(XSS_PAYLOAD);
  });
});

describe('Storage - chargement d\'un profil hostile déjà en localStorage', () => {
  beforeEach(() => { localStorage.clear(); });

  const hostile = () => ({
    id: 'evil', name: 'Eve', createdAt: '2025-01-01T00:00:00Z',
    stats: { totalXP: XSS_PAYLOAD, totalCardsPlayed: XSS_PAYLOAD, totalSessions: XSS_PAYLOAD,
      currentStreak: XSS_PAYLOAD, longestStreak: XSS_PAYLOAD, totalGreenCards: XSS_PAYLOAD },
    badges: [], settings: {}
  });

  it('should sanitize loadPlayerById (profil existant avant correctif)', () => {
    localStorage.setItem(Storage.KEYS.PLAYER_PREFIX + 'evil', JSON.stringify(hostile()));
    const loaded = Storage.loadPlayerById('evil');
    expect(loaded.stats.totalXP).toBe(0);
    expect(loaded.stats.totalGreenCards).toBe(0);
  });

  it('should sanitize loadPlayer (legacy)', () => {
    Storage.savePlayer(hostile());
    const loaded = Storage.loadPlayer();
    expect(loaded.stats.totalXP).toBe(0);
    expect(typeof loaded.stats.currentStreak).toBe('number');
  });

  it('should sanitize the players list totals (shown on the splash screen)', () => {
    localStorage.setItem(Storage.KEYS.PLAYERS_LIST, JSON.stringify([
      { id: 'evil', name: 'Eve', createdAt: '2025-01-01', totalXP: XSS_PAYLOAD },
      { id: 'ok', name: 'Bob', createdAt: '2025-01-01', totalXP: 30 },
      'garbage',
      { name: 'no id' }
    ]));
    const list = Storage.getPlayersList();
    expect(list).toHaveLength(2);
    expect(list[0].totalXP).toBe(0);
    expect(list[1].totalXP).toBe(30);
  });

  it('should compute totalXP of the list from sanitized values', () => {
    Storage.addPlayerToList(hostile());
    expect(Storage.getPlayersList()[0].totalXP).toBe(0);
  });
});

describe('Storage.importAll - données hostiles', () => {
  beforeEach(() => { localStorage.clear(); });

  const payload = () => ({
    version: '1.0.0',
    player: {
      id: 'evil', name: 'Eve', createdAt: '2025-01-01T00:00:00Z',
      stats: { totalXP: XSS_PAYLOAD, totalGreenCards: XSS_PAYLOAD },
      badges: ['a', XSS_PAYLOAD]
    },
    progress: {
      d1: [{ id: 'c1', box: XSS_PAYLOAD, latencyThreshold: XSS_PAYLOAD, timesPlayed: XSS_PAYLOAD,
        restDays: XSS_PAYLOAD, question: 'overwritten', answer: 'overwritten' }]
    }
  });

  it('should store only sanitized data', () => {
    Storage.importAll(payload());
    const stored = JSON.parse(Storage._decompressData(localStorage.getItem(Storage.KEYS.PLAYER)));
    expect(stored.stats.totalXP).toBe(0);
    expect(stored.stats.totalGreenCards).toBe(0);
    expect(stored.badges).toEqual(['a']);

    Storage.setCurrentPlayerId('evil');
    const progress = Storage.loadDeckProgress('d1');
    expect(progress[0].box).toBe('never_played');
    expect(progress[0].latencyThreshold).toBeNull();
    expect(progress[0].timesPlayed).toBe(0);
    expect(progress[0].restDays).toBe(0);
  });

  it('should reject a player without usable id, writing nothing', () => {
    const bad = payload();
    bad.player = { name: 'no id', stats: { totalXP: 5 } };
    bad.settings = { theme: 'light' };
    expect(() => Storage.importAll(bad)).toThrow('Invalid import data');
    expect(Storage.loadPlayer()).toBeNull();
    expect(Storage.loadSettings()).toBeNull();
    expect(Storage.loadDeckProgress('d1')).toBeNull();
  });

  it('should reject progress entries without a card id, writing nothing', () => {
    const bad = payload();
    bad.progress.d1 = [{ box: 'green' }];
    expect(() => Storage.importAll(bad)).toThrow('Invalid import data');
    expect(Storage.loadPlayer()).toBeNull();
  });

  it('should reduce global settings to primitives', () => {
    Storage.importAll({ version: '1.0.0', settings: { theme: 'light', sound: true, nested: { a: 1 }, arr: [1] } });
    expect(Storage.loadSettings()).toEqual({ theme: 'light', sound: true });
  });
});

describe('Storage.sanitizeCardProgress', () => {
  it('should keep only the progression fields (no question/answer overwrite)', () => {
    const p = Storage.sanitizeCardProgress({ id: 'c1', box: 'green', question: 'x', answer: 'y', html: XSS_PAYLOAD });
    expect(p.question).toBeUndefined();
    expect(p.answer).toBeUndefined();
    expect(p.html).toBeUndefined();
    expect(p.box).toBe('green');
  });

  it('should coerce every field to its type', () => {
    const p = Storage.sanitizeCardProgress({
      id: 'c1', box: 'orange',
      latencyThreshold: '4.5', bestResponseTimeMs: XSS_PAYLOAD, lastResponseTimeMs: -3,
      restUntil: XSS_PAYLOAD, restDays: '3', timesPlayed: 4.7, timesCorrect: XSS_PAYLOAD,
      responseTimeHistory: [{ time: 1200, date: '2025-01-01', correct: true }, { time: XSS_PAYLOAD, date: XSS_PAYLOAD, correct: 1 }, 'x']
    });
    expect(p.latencyThreshold).toBe(4.5);
    expect(p.bestResponseTimeMs).toBeNull();
    expect(p.lastResponseTimeMs).toBeNull();
    expect(p.restUntil).toBeNull();
    expect(p.restDays).toBe(3);
    expect(p.timesPlayed).toBe(4);
    expect(p.timesCorrect).toBe(0);
    expect(p.responseTimeHistory).toHaveLength(1);
    expect(p.responseTimeHistory[0].correct).toBe(true);
  });

  it('should reject entries without an id', () => {
    expect(Storage.sanitizeCardProgress({ box: 'green' })).toBeNull();
    expect(Storage.sanitizeCardProgress('x')).toBeNull();
    expect(Storage.sanitizeCardProgress(null)).toBeNull();
  });

  it('should sanitize loadDeckProgress from a hostile stored value', () => {
    localStorage.clear();
    Storage.setCurrentPlayerId('p1');
    localStorage.setItem(Storage._getPlayerProgressKey('d1'), JSON.stringify([
      { id: 'c1', box: XSS_PAYLOAD, timesPlayed: XSS_PAYLOAD, restDays: XSS_PAYLOAD }, 'junk'
    ]));
    const progress = Storage.loadDeckProgress('d1');
    expect(progress).toHaveLength(1);
    expect(progress[0].box).toBe('never_played');
    expect(progress[0].timesPlayed).toBe(0);
  });
});

describe('Storage - métadonnées de decks importés', () => {
  beforeEach(() => { localStorage.clear(); });

  it('should sanitize the custom decks index (wordCount, createdAt)', () => {
    localStorage.setItem(Storage.KEYS.CUSTOM_DECKS, Storage._compressData(JSON.stringify([
      { id: 'd1', name: 'Ok', wordCount: XSS_PAYLOAD, createdAt: XSS_PAYLOAD, hasExternalAudio: 'x' },
      'junk',
      { name: 'no id' }
    ])));
    const index = Storage._loadCustomDecksIndex();
    expect(index).toHaveLength(1);
    expect(index[0].wordCount).toBe(0);
    expect(Number.isNaN(Date.parse(index[0].createdAt))).toBe(false);
    expect(index[0].hasExternalAudio).toBe(false);
  });

  it('should normalize top-level deck metadata of a stored custom deck', () => {
    Storage.saveCustomDeck({ id: 'd1', name: 'Deck', cards: [{ id: 'c1', question: 'Q', answer: 'A' }] });
    const raw = JSON.parse(Storage._decompressData(localStorage.getItem(Storage.KEYS.CUSTOM_DECK_PREFIX + 'd1')));
    raw.difficulty = XSS_PAYLOAD;
    raw.tags = [XSS_PAYLOAD, 5];
    raw.createdAt = XSS_PAYLOAD;
    raw.settings = { sequential: XSS_PAYLOAD, maxCards: XSS_PAYLOAD, similarityThreshold: 7 };
    localStorage.setItem(Storage.KEYS.CUSTOM_DECK_PREFIX + 'd1', Storage._compressData(JSON.stringify(raw)));

    const deck = Storage.loadCustomDeck('d1');
    expect(deck.difficulty).toBeUndefined();
    expect(deck.tags).toEqual([XSS_PAYLOAD]);
    expect(deck.createdAt).toBeUndefined();
    expect(deck.settings.sequential).toBe(false);
    expect(deck.settings.maxCards).toBeUndefined();
    expect(deck.settings.similarityThreshold).toBe(1);
    expect(deck.cards[0].question).toBe('Q');
  });
});

describe('Storage.loadMultilingualProgress - données hostiles', () => {
  it('should reduce each direction progress to its Leitner fields', () => {
    localStorage.clear();
    Storage.setCurrentPlayerId('p1');
    localStorage.setItem(Storage._getPlayerMultilingualKey('ml1'), JSON.stringify([
      { id: 'w1', progress: { 'fr→en': { box: XSS_PAYLOAD, timesPlayed: XSS_PAYLOAD, restUntil: '2025-02-01', extra: XSS_PAYLOAD }, bad: 'x' } },
      'junk',
      { progress: {} }
    ]));
    const progress = Storage.loadMultilingualProgress('ml1');
    expect(progress).toHaveLength(1);
    const dir = progress[0].progress['fr→en'];
    expect(dir.box).toBe('never_played');
    expect(dir.timesPlayed).toBe(0);
    expect(dir.restUntil).toBe('2025-02-01');
    expect(dir.extra).toBeUndefined();
    expect(dir.id).toBeUndefined();
    expect(progress[0].progress.bad).toBeUndefined();
  });
});

describe('Storage.sanitizePlayerStats - champs de la gamification (types.js PlayerStats)', () => {
  const full = () => ({
    totalXP: 120, totalCardsPlayed: 40, totalSessions: 5, currentStreak: 3, longestStreak: 4, longestGreenStreak: 6,
    lastPlayedAt: '2026-11-22T10:00:00.000Z',
    lastStreakDay: '2026-11-22',
    nextReviewDay: '2026-11-25',
    longestAbsence: 9,
    fastestCorrectAnswer: 850,
    masteredBySubject: { maths: ['deck-a/c1', 'deck-a/w2:fr→en'], francais: ['d/x'] },
    weekendWeeks: { '2026-W47': { sat: true, sun: false } }
  });

  it('should keep every documented PlayerStats field with its type', () => {
    const s = Storage.sanitizePlayerStats(full());
    expect(s.lastStreakDay).toBe('2026-11-22');
    expect(s.nextReviewDay).toBe('2026-11-25');
    expect(s.longestAbsence).toBe(9);
    expect(s.fastestCorrectAnswer).toBe(850);
    expect(s.masteredBySubject).toEqual({ maths: ['deck-a/c1', 'deck-a/w2:fr→en'], francais: ['d/x'] });
    expect(s.weekendWeeks['2026-W47']).toEqual({ sat: true, sun: false });
  });

  it('should keep nextReviewDay null and drop malformed days (strict YYYY-MM-DD)', () => {
    expect(Storage.sanitizePlayerStats({ nextReviewDay: null }).nextReviewDay).toBeNull();
    const bad = Storage.sanitizePlayerStats({ lastStreakDay: XSS_PAYLOAD, nextReviewDay: '2026-11-22T10:00:00Z' });
    expect(bad.lastStreakDay).toBeUndefined();
    expect(bad.nextReviewDay).toBeNull();
  });

  it('should filter masteredBySubject (ids, subjects, cap, dangerous keys)', () => {
    const many = Array.from({ length: 150 }, (_, i) => 'd/c' + i);
    const hostile = JSON.parse('{"masteredBySubject":{"maths":["ok",5,{"a":1}],"__proto__":["x"],"<b>":["y"],"sciences":"nope"}}');
    hostile.masteredBySubject.histoire = many;
    const s = Storage.sanitizePlayerStats(hostile);
    expect(s.masteredBySubject.maths).toEqual(['ok']);
    expect(s.masteredBySubject.histoire).toHaveLength(100);
    expect(s.masteredBySubject['<b>']).toBeUndefined();
    expect(s.masteredBySubject.sciences).toBeUndefined();
    expect(({}).x).toBeUndefined();
  });

  it('should survive a save/load round trip of a player with a running streak', () => {
    localStorage.clear();
    const player = { id: 'p1', name: 'A', createdAt: '2026-01-01', stats: full(), badges: ['first_steps'], settings: { tutorialCompleted: true, soundEnabled: false, language: 'en' } };
    Storage.savePlayerById(player);
    const loaded = Storage.loadPlayerById('p1');
    expect(loaded.stats.currentStreak).toBe(3);
    expect(loaded.stats.lastStreakDay).toBe('2026-11-22');
    expect(loaded.stats.masteredBySubject.maths).toHaveLength(2);
    expect(loaded.settings.tutorialCompleted).toBe(true);
    expect(loaded.badges).toEqual(['first_steps']);
  });

  it('should survive export then import of a player with a running streak', () => {
    localStorage.clear();
    Storage.savePlayer({ id: 'p1', name: 'A', createdAt: '2026-01-01', stats: full(), badges: [], settings: {} });
    const exported = JSON.parse(JSON.stringify(Storage.exportAll()));
    localStorage.clear();
    Storage.importAll(exported);
    const loaded = Storage.loadPlayer();
    expect(loaded.stats.lastStreakDay).toBe('2026-11-22');
    expect(loaded.stats.nextReviewDay).toBe('2026-11-25');
    expect(loaded.stats.currentStreak).toBe(3);
    expect(loaded.stats.masteredBySubject.francais).toEqual(['d/x']);
  });

  it('should register every player stat written anywhere in src/ (non-regression)', () => {
    // Un champ écrit sur player.stats mais inconnu de la sanitisation serait effacé à chaque chargement.
    const WRITE = '\\s*(?:=(?!=)|\\+=|-=|\\+\\+|--|\\[[^\\]]*\\]\\s*=(?!=)|\\.push\\()';
    const found = new Map();
    for (const file of listSourceFiles()) {
      if (file.path === 'src/modules/storage.js') continue;
      const patterns = [new RegExp('\\b(?:player|updatedPlayer|p)\\??\\.stats\\??\\.([A-Za-z]+)' + WRITE, 'g')];
      if (/const\s+stats\s*=\s*player\.stats\s*;/.test(file.content)) patterns.push(new RegExp('(?<![.\\w])stats\\.([A-Za-z]+)' + WRITE, 'g'));
      for (const re of patterns) {
        let m;
        while ((m = re.exec(file.content))) { if (!found.has(m[1])) found.set(m[1], file.path); }
      }
    }
    expect(found.size).toBeGreaterThan(10);
    const unknown = [...found].filter(([name]) => !Storage.PLAYER_STATS_FIELDS.includes(name));
    expect(unknown.map(([n, f]) => n + ' (' + f + ')').join(', ')).toBe('');
    // chaque champ trouvé survit avec une valeur représentative de son type
    const SAMPLE = {
      counter: 7, number: 7, boolean: true, day: '2026-11-22', date: '2026-11-22T10:00:00Z', array: ['a'],
      object: { maths: ['a'] }
    };
    const SPECIAL = {
      xpHistory: [{ date: '2026-01-01', amount: 1, source: 's' }],
      weekendWeeks: { '2026-W01': { sat: true, sun: true } }
    };
    for (const name of found.keys()) {
      const value = name in SPECIAL ? SPECIAL[name] : SAMPLE[Storage.PLAYER_STATS_TYPES[name]];
      const out = Storage.sanitizePlayerStats({ [name]: value });
      expect(name + ':' + (out[name] === undefined ? 'perdu' : 'ok')).toBe(name + ':ok');
    }
  });
});
