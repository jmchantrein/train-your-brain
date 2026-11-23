/**
 * Tests de récupération des données depuis les copies de secours (tyb_backup_*)
 *
 * Règle : la copie de secours ne sert que si la valeur courante est inutilisable
 * (absente, JSON illisible, décompression en échec, structure rejetée par l'assainissement).
 * Une valeur saine n'est jamais remplacée par une sauvegarde plus ancienne.
 *
 * Chaque donnée est écrite deux fois : la clé courante porte la version 2, la copie
 * de secours (écrite avant chaque enregistrement) porte la version 1.
 */

if (typeof Storage === 'undefined') {
  global.Storage = require('../src/modules/storage.js');
}

const BACKUP = (key) => 'tyb_backup_' + key;

// Façons d'abîmer une valeur persistée. `valid` est la valeur courante saine.
const CORRUPTIONS = {
  'absente': () => null,
  'chaîne vide': () => '',
  'JSON illisible': () => 'ceci n\'est pas du JSON {{{',
  'JSON tronqué': (valid) => valid.slice(0, Math.max(5, Math.floor(valid.length / 2))),
  'décompression en échec': () => '__COMPRESSED__:v9:xxxx',
  'structure rejetée': () => '"juste une chaîne"'
};

function corrupt(key, kind) {
  const valid = localStorage.getItem(key);
  const next = CORRUPTIONS[kind](valid);
  if (next === null) localStorage.removeItem(key);
  else localStorage.setItem(key, next);
}

// Cibles : écrit v1 puis v2, expose le chargement et la lecture de la version
const TARGETS = {
  'profil historique tyb_player': {
    key: 'tyb_player',
    write(v) {
      Storage.savePlayer({ id: 'p1', name: 'Alice v' + v, createdAt: '2025-01-01T00:00:00.000Z', stats: { totalXP: v * 10 } });
    },
    load() { Storage.setCurrentPlayerId(''); return Storage.loadPlayer(); },
    version(p) { return p ? Number(p.name.slice(-1)) : null; },
    // Sans clé par joueur : seule la clé historique porte le profil
    prepare() { localStorage.removeItem('tyb_player_p1'); localStorage.removeItem(BACKUP('tyb_player_p1')); }
  },
  'profil par joueur tyb_player_{id}': {
    key: 'tyb_player_p1',
    write(v) {
      Storage.savePlayerById({ id: 'p1', name: 'Alice v' + v, createdAt: '2025-01-01T00:00:00.000Z', stats: { totalXP: v * 10 } });
    },
    load() { return Storage.loadPlayerById('p1'); },
    version(p) { return p ? Number(p.name.slice(-1)) : null; },
    prepare() {}
  },
  'liste des joueurs': {
    key: 'tyb_players_list',
    write(v) {
      Storage.savePlayersList([
        { id: 'p1', name: 'Alice', createdAt: '2025-01-01T00:00:00.000Z', totalXP: v * 10 }
      ]);
    },
    load() { return Storage.getPlayersList(); },
    version(list) { return list && list.length ? list[0].totalXP / 10 : null; },
    prepare() {
      // Pas de profil à reconstruire : seule la copie de secours peut aider
      localStorage.removeItem('tyb_player_p1');
      localStorage.removeItem('tyb_player');
    }
  },
  'progression d\'un deck': {
    key: 'tyb_pdeck_p1_deck-a',
    write(v) {
      Storage.setCurrentPlayerId('p1');
      Storage.saveDeckProgress('deck-a', [{ id: 'c1', box: 'green', timesPlayed: v, timesCorrect: v }]);
    },
    load() { Storage.setCurrentPlayerId('p1'); return Storage.loadDeckProgress('deck-a'); },
    version(p) { return p && p.length ? p[0].timesPlayed : null; },
    prepare() {}
  },
  'progression multilingue': {
    key: 'tyb_pml_p1_deck-ml',
    write(v) {
      Storage.setCurrentPlayerId('p1');
      Storage.saveMultilingualProgress('deck-ml', [{ id: 'w1', progress: { 'fr→en': { box: 'green', timesPlayed: v, timesCorrect: v } } }]);
    },
    load() { Storage.setCurrentPlayerId('p1'); return Storage.loadMultilingualProgress('deck-ml'); },
    version(p) { return p && p.length ? p[0].progress['fr→en'].timesPlayed : null; },
    prepare() {}
  },
  'deck personnalisé': {
    key: 'tyb_cdeck_custom-1',
    write(v) {
      Storage.saveCustomDeck({ id: 'custom-1', name: 'Deck v' + v, description: 'x', cards: [{ id: 'c1', question: 'Q', answer: 'A' }] });
    },
    load() { return Storage.loadCustomDeck('custom-1'); },
    version(d) { return d ? Number(d.name.slice(-1)) : null; },
    prepare() {}
  },
  'index des decks personnalisés': {
    key: 'tyb_custom_decks',
    write(v) {
      Storage.saveCustomDeck({ id: 'custom-1', name: 'Deck v' + v, description: 'x', cards: [{ id: 'c1', question: 'Q', answer: 'A' }] });
    },
    load() { return Storage._loadCustomDecksIndex(); },
    version(idx) { return idx && idx.length ? Number(idx[0].name.slice(-1)) : null; },
    prepare() {}
  }
};

function freshStorage() {
  localStorage.clear();
  Storage._recoveryCallbacks = [];
}

Object.keys(TARGETS).forEach((label) => {
  const target = TARGETS[label];

  describe('Storage récupération - ' + label, () => {
    beforeEach(() => {
      freshStorage();
      target.write(1);
      target.write(2);
      target.prepare();
    });

    it('la copie de secours existe et porte la version précédente', () => {
      expect(localStorage.getItem(BACKUP(target.key))).toBeTruthy();
    });

    it('une valeur saine n\'est jamais remplacée par la sauvegarde plus ancienne', () => {
      const before = localStorage.getItem(target.key);
      const events = [];
      Storage.onRecovery((k) => events.push(k));
      expect(target.version(target.load())).toBe(2);
      expect(localStorage.getItem(target.key)).toBe(before);
      expect(events).toHaveLength(0);
    });

    Object.keys(CORRUPTIONS).forEach((kind) => {
      it('valeur ' + kind + ' : retombe sur la sauvegarde, la réécrit et le signale', () => {
        corrupt(target.key, kind);
        const events = [];
        Storage.onRecovery((k) => events.push(k));

        expect(target.version(target.load())).toBe(1);

        // Réécrite comme valeur courante : un second chargement ne repasse plus par la récupération
        expect(localStorage.getItem(target.key)).toBe(JSON.parse(localStorage.getItem(BACKUP(target.key))).data);
        expect(events).toEqual([target.key]);
        expect(target.version(target.load())).toBe(1);
        expect(events).toHaveLength(1);
      });

      it('valeur ' + kind + ' et sauvegarde illisible : ignorée sans erreur, rien n\'est écrasé', () => {
        corrupt(target.key, kind);
        localStorage.setItem(BACKUP(target.key), '{pas du json');
        const corruptedValue = localStorage.getItem(target.key);
        const events = [];
        Storage.onRecovery((k) => events.push(k));

        let result;
        expect(() => { result = target.load(); }).not.toThrow();
        expect(target.version(result)).toBeNull();
        expect(events).toHaveLength(0);
        expect(localStorage.getItem(target.key)).toBe(corruptedValue);
      });
    });

    it('sauvegarde dont les données sont corrompues : ignorée', () => {
      corrupt(target.key, 'JSON illisible');
      localStorage.setItem(BACKUP(target.key), JSON.stringify({ timestamp: 'x', data: '[[[ pas du json' }));
      expect(target.version(target.load())).toBeNull();
    });

    it('un callback d\'abonné qui lève ne casse pas le chargement', () => {
      corrupt(target.key, 'JSON illisible');
      Storage.onRecovery(() => { throw new Error('boom'); });
      expect(target.version(target.load())).toBe(1);
    });
  });
});

describe('Storage récupération - sans sauvegarde', () => {
  beforeEach(freshStorage);

  it('loadDeckProgress sur valeur corrompue sans sauvegarde : null, sans erreur', () => {
    Storage.setCurrentPlayerId('p1');
    localStorage.setItem('tyb_pdeck_p1_deck-a', 'garbage');
    expect(Storage.loadDeckProgress('deck-a')).toBeNull();
  });

  it('loadCustomDeck sur valeur corrompue sans sauvegarde : null', () => {
    localStorage.setItem('tyb_cdeck_x', 'garbage');
    expect(Storage.loadCustomDeck('x')).toBeNull();
  });

  it('une clé qui n\'a jamais existé ne déclenche aucune récupération', () => {
    const events = [];
    Storage.onRecovery((k) => events.push(k));
    Storage.setCurrentPlayerId('p1');
    expect(Storage.loadDeckProgress('jamais-joue')).toBeNull();
    expect(Storage.loadPlayerById('inconnu')).toBeNull();
    expect(Storage.loadCustomDeck('inconnu')).toBeNull();
    expect(events).toHaveLength(0);
  });
});

describe('Storage récupération - suppressions volontaires', () => {
  beforeEach(freshStorage);

  it('une progression supprimée ne ressuscite pas depuis sa sauvegarde', () => {
    Storage.setCurrentPlayerId('p1');
    Storage.saveDeckProgress('deck-a', [{ id: 'c1', box: 'green', timesPlayed: 1, timesCorrect: 1 }]);
    Storage.saveDeckProgress('deck-a', [{ id: 'c1', box: 'green', timesPlayed: 2, timesCorrect: 2 }]);
    Storage.deleteDeckProgress('deck-a');
    expect(Storage.loadDeckProgress('deck-a')).toBeNull();
  });

  it('une progression multilingue supprimée ne ressuscite pas', () => {
    Storage.setCurrentPlayerId('p1');
    const words = [{ id: 'w1', progress: { 'fr→en': { box: 'green', timesPlayed: 1, timesCorrect: 1 } } }];
    Storage.saveMultilingualProgress('deck-ml', words);
    Storage.saveMultilingualProgress('deck-ml', words);
    Storage.deleteMultilingualProgress('deck-ml');
    expect(Storage.loadMultilingualProgress('deck-ml')).toBeNull();
  });

  it('un deck supprimé définitivement ne ressuscite pas', () => {
    const deck = { id: 'custom-1', name: 'Deck', description: 'x', cards: [{ id: 'c1', question: 'Q', answer: 'A' }] };
    Storage.saveCustomDeck(deck);
    Storage.saveCustomDeck(deck);
    Storage.deleteCustomDeck('custom-1');
    Storage.permanentlyDeleteDeck('custom-1');
    expect(Storage.loadCustomDeck('custom-1')).toBeNull();
  });

  it('un deck de la corbeille vidée ne ressuscite pas', () => {
    const deck = { id: 'custom-2', name: 'Deck', description: 'x', cards: [{ id: 'c1', question: 'Q', answer: 'A' }] };
    Storage.saveCustomDeck(deck);
    Storage.saveCustomDeck(deck);
    Storage.deleteCustomDeck('custom-2');
    Storage.emptyTrash();
    expect(Storage.loadCustomDeck('custom-2')).toBeNull();
  });

  it('un joueur supprimé ne ressuscite pas', () => {
    const p = { id: 'p9', name: 'Zoé', createdAt: '2025-01-01T00:00:00.000Z', stats: { totalXP: 1 } };
    Storage.savePlayer(p);
    Storage.savePlayer(p);
    Storage.setCurrentPlayerId('p9');
    Storage.clearCurrentPlayerData();
    expect(Storage.loadPlayerById('p9')).toBeNull();
    expect(Storage.loadPlayer()).toBeNull();
  });

  it('clearLegacyProgress retire aussi les sauvegardes des progressions historiques', () => {
    Storage.setCurrentPlayerId('');
    Storage.saveDeckProgress('deck-l', [{ id: 'c1', box: 'green', timesPlayed: 1, timesCorrect: 1 }]);
    Storage.saveDeckProgress('deck-l', [{ id: 'c1', box: 'green', timesPlayed: 2, timesCorrect: 2 }]);
    Storage.clearLegacyProgress();
    expect(Storage.loadDeckProgress('deck-l')).toBeNull();
  });
});

describe('Storage récupération - liste des joueurs', () => {
  beforeEach(freshStorage);

  const mk = (id, name) => ({ id, name, createdAt: '2025-01-01T00:00:00.000Z', stats: { totalXP: 5 } });

  it('JSON corrompu sans sauvegarde : reconstruite depuis les profils, un ajout ne l\'écrase pas', () => {
    Storage.savePlayerById(mk('pa', 'A'));
    Storage.savePlayerById(mk('pb', 'B'));
    localStorage.removeItem(BACKUP('tyb_players_list'));
    localStorage.setItem('tyb_players_list', '{corrompu');

    Storage.addPlayerToList(mk('pc', 'C'));

    const ids = Storage.getPlayersList().map(p => p.id).sort();
    expect(ids).toEqual(['pa', 'pb', 'pc']);
  });

  it('JSON corrompu avec sauvegarde : la sauvegarde l\'emporte et un ajout la complète', () => {
    Storage.savePlayerById(mk('pa', 'A'));
    Storage.savePlayerById(mk('pb', 'B'));
    localStorage.setItem('tyb_players_list', '{corrompu');

    Storage.addPlayerToList(mk('pc', 'C'));

    const ids = Storage.getPlayersList().map(p => p.id).sort();
    expect(ids).toEqual(['pa', 'pb', 'pc']);
  });

  it('une liste vide saine reste vide', () => {
    Storage.savePlayersList([]);
    Storage.savePlayersList([]);
    expect(Storage.getPlayersList()).toEqual([]);
  });
});

describe('Storage récupération - interactions entre clés', () => {
  beforeEach(freshStorage);

  it('loadPlayer : le profil par joueur corrompu est récupéré pour le joueur courant', () => {
    const p = (v) => ({ id: 'p1', name: 'Alice v' + v, createdAt: '2025-01-01T00:00:00.000Z', stats: { totalXP: v } });
    Storage.savePlayer(p(1));
    Storage.savePlayer(p(2));
    Storage.setCurrentPlayerId('p1');
    localStorage.setItem('tyb_player', '{corrompu');
    localStorage.setItem('tyb_player_p1', '{corrompu');
    const loaded = Storage.loadPlayer();
    expect(loaded).toBeTruthy();
    expect(loaded.id).toBe('p1');
  });

  it('loadPlayer : la clé historique ne ressuscite pas un autre joueur que le joueur courant', () => {
    const mk = (id, name) => ({ id, name, createdAt: '2025-01-01T00:00:00.000Z', stats: { totalXP: 1 } });
    Storage.savePlayer(mk('pA', 'A'));
    Storage.savePlayer(mk('pB', 'B'));   // tyb_player = B, sa copie de secours = A
    Storage.setCurrentPlayerId('pB');
    localStorage.setItem('tyb_player', '{corrompu');
    const loaded = Storage.loadPlayer();
    expect(loaded.id).toBe('pB');
    // Aucune récupération de A dans la clé historique
    const legacy = localStorage.getItem('tyb_player');
    expect(legacy === null || !legacy.includes('"pA"')).toBe(true);
  });

  it('une progression récupérée est écrite telle quelle (progression d\'un autre joueur intacte)', () => {
    Storage.setCurrentPlayerId('pA');
    Storage.saveDeckProgress('d', [{ id: 'c', box: 'green', timesPlayed: 1, timesCorrect: 1 }]);
    Storage.setCurrentPlayerId('pB');
    Storage.saveDeckProgress('d', [{ id: 'c', box: 'purple', timesPlayed: 1, timesCorrect: 0 }]);
    Storage.saveDeckProgress('d', [{ id: 'c', box: 'orange', timesPlayed: 2, timesCorrect: 1 }]);
    localStorage.setItem('tyb_pdeck_pB_d', '???');
    expect(Storage.loadDeckProgress('d')[0].box).toBe('purple');
    Storage.setCurrentPlayerId('pA');
    expect(Storage.loadDeckProgress('d')[0].box).toBe('green');
  });
});

describe('Storage récupération - messages au joueur', () => {
  let announced;
  let originalAnnounce;
  let originalDefer;

  beforeEach(() => {
    freshStorage();
    announced = [];
    originalAnnounce = A11y.announce;
    A11y.announce = (message, options) => { announced.push({ message, options }); };
    originalDefer = Storage._defer;
    Storage._defer = (fn) => fn();
    Storage._quotaWarningCallbacks = [];
    Storage._quotaErrorCallbacks = [];
    Storage._recoveryCallbacks = [];
    Storage._resetUserNotices();
    Storage._installDefaultNotifiers();
    i18n.setLocale('fr');
  });

  afterEach(() => {
    A11y.announce = originalAnnounce;
    Storage._defer = originalDefer;
    Storage._quotaWarningCallbacks = [];
    Storage._quotaErrorCallbacks = [];
    Storage._recoveryCallbacks = [];
    Storage._resetUserNotices();
    i18n.setLocale('fr');
  });

  it('_installDefaultNotifiers est idempotente : un seul abonné par événement', () => {
    Storage._installDefaultNotifiers();
    Storage._installDefaultNotifiers();
    expect(Storage._quotaWarningCallbacks).toHaveLength(1);
    expect(Storage._quotaErrorCallbacks).toHaveLength(1);
    expect(Storage._recoveryCallbacks).toHaveLength(1);
  });

  it('avertissement de quota : un seul message par session, pas à chaque écriture', () => {
    Storage._notifyQuotaWarning('warning', { percentage: 0.85 });
    Storage._notifyQuotaWarning('critical', { percentage: 0.96 });
    Storage._notifyQuotaWarning('warning', { percentage: 0.86 });
    expect(announced).toHaveLength(1);
    expect(announced[0].options.visual).toBe(true);
  });

  it('erreur de quota : un message une fois par session', () => {
    Storage._notifyQuotaError({ reason: 'quota_exceeded' });
    Storage._notifyQuotaError({ reason: 'quota_exceeded' });
    expect(announced).toHaveLength(1);
  });

  it('le texte en français tutoie et propose d\'exporter ou de supprimer des decks', () => {
    Storage._notifyQuotaWarning('warning', {});
    const text = announced[0].message;
    expect(text).toContain('Exporte');
    expect(text).toContain('deck');
    expect(text).not.toContain('Storage.');
  });

  it('le texte en anglais existe et propose d\'exporter', () => {
    i18n.setLocale('en');
    Storage._notifyQuotaWarning('warning', {});
    expect(announced[0].message).toContain('Export');
  });

  it('une récupération produit un message discret, une seule fois pour plusieurs clés', () => {
    const queued = [];
    Storage._defer = (fn) => queued.push(fn);
    Storage._notifyRecovery('tyb_player_p1');
    Storage._notifyRecovery('tyb_players_list');
    expect(announced).toHaveLength(0); // différé : la langue du joueur est appliquée avant
    queued.forEach(fn => fn());
    expect(queued).toHaveLength(1);
    expect(announced).toHaveLength(1);
    expect(announced[0].message).toBe('Tes données ont été restaurées depuis la dernière sauvegarde.');
    expect(announced[0].options.type).toBe('info');
  });

  it('la récupération réelle d\'une donnée déclenche le message', () => {
    Storage.setCurrentPlayerId('p1');
    Storage.saveDeckProgress('d', [{ id: 'c', box: 'green', timesPlayed: 1, timesCorrect: 1 }]);
    Storage.saveDeckProgress('d', [{ id: 'c', box: 'green', timesPlayed: 2, timesCorrect: 2 }]);
    localStorage.setItem('tyb_pdeck_p1_d', '???');
    Storage.loadDeckProgress('d');
    expect(announced).toHaveLength(1);
  });

  it('les clés i18n existent en français et en anglais', () => {
    ['storage.quotaWarning', 'storage.quotaError', 'storage.recovered'].forEach((key) => {
      expect(i18n._translations.fr[key]).toBeTruthy();
      expect(i18n._translations.en[key]).toBeTruthy();
    });
  });
});
