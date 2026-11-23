/**
 * Tests : réinitialisation / suppression des données d'un joueur ou d'un deck.
 * Aucune donnée orpheline ne doit subsister, et les autres joueurs restent intacts.
 */
if (typeof Storage === 'undefined') {
  global.Storage = require('../src/modules/storage.js');
}

const tybKeys = () => {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('tyb_')) keys.push(k);
  }
  return keys.sort();
};

/** Crée un joueur complet (profil, mirroir legacy, progression, multilingue, backups, missions). */
function seedPlayer(id, name) {
  const player = {
    id, name, createdAt: '2025-01-01',
    stats: { totalXP: 120 },
    missions: { daily: { date: '2025-01-02', cardsPlayed: 3 } }
  };
  Storage.savePlayerById(player);
  Storage.savePlayerById(player); // second écriture : crée tyb_backup_tyb_player_{id}
  Storage.addPlayerToList(player);
  Storage.setCurrentPlayerId(id);
  Storage.savePlayer(player); // clé historique tyb_player (miroir du joueur courant)
  Storage.savePlayer(player);
  Storage.saveDeckProgress('math', [{ id: 'c1', box: 'green', timesPlayed: 2, timesCorrect: 2 }]);
  Storage.saveDeckProgress('math', [{ id: 'c1', box: 'green', timesPlayed: 3, timesCorrect: 3 }]);
  Storage.saveMultilingualProgress('lang', { words: { w1: { fr_en: { box: 'purple' } } } });
  return player;
}

describe('Storage - clearCurrentPlayerData', () => {
  beforeEach(() => { localStorage.clear(); });

  it('should remove every key of the current player, including the legacy tyb_player key', () => {
    seedPlayer('player_1', 'Alice');
    Storage.clearCurrentPlayerData();

    expect(Storage.loadPlayer()).toBeNull();
    expect(localStorage.getItem('tyb_player')).toBeNull();
    expect(tybKeys().filter(k => k.includes('player_1'))).toEqual([]);
    expect(tybKeys().filter(k => k.startsWith('tyb_backup_tyb_player'))).toEqual([]);
    expect(Storage.getPlayersList()).toEqual([]);
    expect(Storage.getCurrentPlayerId()).toBeFalsy();
    expect(Storage.loadPlayerById('player_1')).toBeNull();
  });

  it('should leave no tyb_ key other than the (empty) players list', () => {
    seedPlayer('player_1', 'Alice');
    Storage.clearCurrentPlayerData();
    expect(tybKeys()).toEqual(['tyb_players_list']);
  });

  it('should keep players whose id has the same prefix (player_1 / player_10)', () => {
    seedPlayer('player_10', 'Bob');
    seedPlayer('player_1', 'Alice'); // courant, et miroir legacy
    const before = {};
    tybKeys().filter(k => k.includes('player_10')).forEach(k => { before[k] = localStorage.getItem(k); });
    expect(Object.keys(before).length).toBeGreaterThan(3);

    Storage.clearCurrentPlayerData();

    Object.keys(before).forEach(k => expect(localStorage.getItem(k)).toBe(before[k]));
    expect(Storage.getPlayersList().map(p => p.id)).toEqual(['player_10']);
    expect(Storage.loadPlayerById('player_10').name).toBe('Bob');
    expect(Storage.loadPlayer()).toBeNull(); // le miroir d'Alice ne doit pas réapparaître
  });

  it('should not delete the legacy key when it mirrors another player', () => {
    seedPlayer('player_10', 'Bob');
    seedPlayer('player_1', 'Alice');
    // Le miroir legacy appartient à Bob, Alice est le joueur courant
    Storage.savePlayer(Storage.loadPlayerById('player_10'));
    Storage.clearCurrentPlayerData();
    expect(Storage.loadPlayer().id).toBe('player_10');
  });
});

describe('Storage - clearCurrentPlayerData spares the other players', () => {
  beforeEach(() => { localStorage.clear(); });

  it('should purge the player (legacy mirror, current id included) and spare others', () => {
    seedPlayer('player_10', 'Bob');
    seedPlayer('player_1', 'Alice'); // courant
    Storage.clearCurrentPlayerData();

    expect(tybKeys().filter(k => /player_1(_|$)/.test(k))).toEqual([]);
    expect(localStorage.getItem('tyb_player')).toBeNull();
    expect(Storage.getCurrentPlayerId()).toBeFalsy();
    expect(Storage.loadPlayerById('player_10').name).toBe('Bob');
    expect(Storage.loadDeckProgress('math')).toBeNull(); // pas de joueur courant : clé legacy absente
    Storage.setCurrentPlayerId('player_10');
    expect(Storage.loadDeckProgress('math')).toBeTruthy();
  });
});

describe('Storage - permanent deck deletion removes progress of every player', () => {
  beforeEach(() => { localStorage.clear(); });

  const seedTwoPlayersWithDeck = () => {
    seedPlayer('player_1', 'Alice');
    seedPlayer('player_2', 'Bob'); // courant
    Storage.saveDeckProgress('other', [{ id: 'c9', box: 'purple', timesPlayed: 1, timesCorrect: 0 }]);
    Storage.setCurrentPlayerId('player_1');
    Storage.saveDeckProgress('other', [{ id: 'c9', box: 'purple', timesPlayed: 1, timesCorrect: 0 }]);
    Storage.saveCustomDeck({ id: 'math', name: 'Math', cards: [{ id: 'c1', question: 'q', answer: 'a' }] });
    Storage.moveToTrash('math');
  };
  const deckKeys = (deckId) => tybKeys().filter(k => /^tyb_(backup_)?(pdeck|pml)_/.test(k) && k.endsWith('_' + deckId));

  it('permanentlyDeleteDeck should delete progress for all players but keep other decks', () => {
    seedTwoPlayersWithDeck();
    expect(Storage.permanentlyDeleteDeck('math')).toBe(true);
    expect(deckKeys('math')).toEqual([]);
    expect(deckKeys('other').length).toBe(2); // une clé par joueur
  });

  it('emptyTrash should delete progress for all players', () => {
    seedTwoPlayersWithDeck();
    expect(Storage.emptyTrash().count).toBe(1);
    expect(deckKeys('math')).toEqual([]);
    expect(deckKeys('other').length).toBe(2);
  });
});

describe('Storage - legacy key migration', () => {
  beforeEach(() => { localStorage.clear(); });

  it('should still read an old tyb_player profile when no per-player profile exists', () => {
    localStorage.setItem('tyb_player', JSON.stringify({ id: 'legacy_user', name: 'Old', createdAt: '2024-01-01' }));
    expect(Storage.loadPlayerById('legacy_user').name).toBe('Old');
    expect(Storage.getPlayersList().map(p => p.id)).toEqual(['legacy_user']);
  });
});

describe('Storage - savePlayer keeps the per-player key in sync', () => {
  beforeEach(() => { localStorage.clear(); });

  const mk = (id, theme) => ({ id, name: id, createdAt: '2025-01-01', settings: { theme } });

  it('should make a setting saved by savePlayer alone visible to loadPlayerById', () => {
    Storage.setCurrentPlayerId('a');
    Storage.savePlayer(mk('a', 'dark'));
    expect(Storage.loadPlayerById('a').settings.theme).toBe('dark');
  });

  it('should keep each player settings across a switch A -> B -> A', () => {
    Storage.addPlayerToList(mk('a', 'light'));
    Storage.addPlayerToList(mk('b', 'light'));
    Storage.setCurrentPlayerId('a');
    Storage.savePlayer(mk('a', 'ocean'));            // réglage de A, via savePlayer seul
    Storage.setCurrentPlayerId('b');
    Storage.savePlayer(Storage.loadPlayerById('b')); // sélection de B (miroir legacy = B)
    Storage.savePlayer(mk('b', 'forest'));
    Storage.setCurrentPlayerId('a');
    expect(Storage.loadPlayerById('a').settings.theme).toBe('ocean');
    expect(Storage.loadPlayerById('b').settings.theme).toBe('forest');
    expect(Storage.loadPlayer().settings.theme).toBe('ocean'); // clé par joueur de A fait foi
  });

  it('should update the player entry in the players list', () => {
    Storage.addPlayerToList({ id: 'a', name: 'Old', createdAt: '2025-01-01' });
    Storage.savePlayer({ id: 'a', name: 'New', createdAt: '2025-01-01', stats: { totalXP: 50 } });
    const entry = Storage.getPlayersList().find(p => p.id === 'a');
    expect(entry.name).toBe('New');
    expect(entry.totalXP).toBe(50);
  });

  it('should prefer the per-player key once both are in sync', () => {
    Storage.setCurrentPlayerId('a');
    Storage.savePlayer(mk('a', 'dark'));
    Storage.savePlayerById(mk('a', 'sepia')); // écriture par joueur seule, plus récente
    expect(Storage.loadPlayer().settings.theme).toBe('sepia');
  });

  it('should migrate an old storage holding only tyb_player without loss', () => {
    localStorage.setItem('tyb_player', JSON.stringify(mk('old', 'dark')));
    Storage.setCurrentPlayerId('old');
    expect(Storage.loadPlayer().settings.theme).toBe('dark');
    expect(Storage.loadPlayerById('old').settings.theme).toBe('dark');
  });

  it('should keep old legacy data (newer than a lagging per-player key) once, then heal', () => {
    // Anciennes données : la clé par joueur est en retard, sans marqueur
    localStorage.setItem('tyb_player_a', JSON.stringify(mk('a', 'light')));
    localStorage.setItem('tyb_player', JSON.stringify(mk('a', 'dark')));
    Storage.setCurrentPlayerId('a');
    expect(Storage.loadPlayer().settings.theme).toBe('dark');
    expect(Storage.loadPlayerById('a').settings.theme).toBe('dark'); // recopié
  });

  it('should leave nothing behind after reset or removal (sync marker included)', () => {
    Storage.addPlayerToList(mk('a', 'dark'));
    Storage.setCurrentPlayerId('a');
    Storage.savePlayer(mk('a', 'dark'));
    Storage.clearCurrentPlayerData();
    expect(tybKeys()).toEqual(['tyb_players_list']);

    Storage.addPlayerToList(mk('b', 'dark'));
    Storage.setCurrentPlayerId('b');
    Storage.savePlayer(mk('b', 'dark'));
    Storage.clearCurrentPlayerData();
    expect(tybKeys()).toEqual(['tyb_players_list']);
  });
});
