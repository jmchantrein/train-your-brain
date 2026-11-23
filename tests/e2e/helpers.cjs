/**
 * Utilitaires e2e pour Train Your Brain
 *
 * Principes :
 * - aucune attente à durée fixe : on attend un état de la page (sélecteur, URL, valeur) ;
 * - les données de test sont écrites par les API de l'application (Storage, State, App),
 *   jamais par des clés localStorage écrites à la main (le stockage est compressé / indexé) ;
 * - l'interface est testée en français (joueurs de test : language 'fr', locale du navigateur fr-FR).
 */

const { expect } = require('@playwright/test');
const { APP_URL } = require('./app-path.cjs');

/** Ouvre l'application (index.html construit, voir E2E_APP) et attend le conteneur. */
async function navigateToApp(page) {
  await page.goto(APP_URL);
  await page.waitForSelector('#app');
}

/** Efface tout le localStorage (à appeler avant de créer un joueur). */
async function clearStorage(page) {
  await page.evaluate(() => localStorage.clear());
}

/**
 * Change de page par le hash (comme un lien interne). Certaines routes redirigent
 * (/deck/<id>, routes inconnues) : l'appelant attend donc la page ou l'URL attendue
 * avec une assertion (expect(...).toBeVisible / toHaveURL), pas ici.
 */
async function navigateTo(page, route) {
  await page.evaluate((r) => { window.location.hash = r; }, route);
}

/** Construit un joueur de test complet. */
function buildPlayer(name, opts = {}) {
  const stats = opts.stats || {};
  return {
    id: opts.id || 'test_player_' + Math.random().toString(36).slice(2, 10),
    name,
    createdAt: new Date().toISOString(),
    stats: {
      totalXP: 0,
      totalCardsPlayed: 0,
      totalSessions: 0,
      currentStreak: 0,
      longestStreak: 0,
      longestGreenStreak: 0,
      lastPlayedAt: null,
      xpHistory: [],
      ...stats
    },
    badges: opts.badges || [],
    settings: {
      theme: 'ocean',
      soundEnabled: true,
      language: 'fr',
      // Le tutoriel de premier lancement recouvre l'écran et intercepte les clics
      tutorialCompleted: true,
      ...(opts.settings || {})
    }
  };
}

/**
 * Crée un joueur de test, puis le sélectionne depuis l'écran de profils (clic sur sa carte).
 * À appeler après navigateToApp (et clearStorage si besoin).
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} [name]
 * @param {{stats?: object, badges?: string[], settings?: object, id?: string}} [opts]
 * @returns {Promise<object>} le joueur créé
 */
async function createPlayer(page, name = 'TestPlayer', opts = {}) {
  const player = buildPlayer(name, opts);

  await page.evaluate((p) => {
    Storage.savePlayerById(p);
    Storage.addPlayerToList(p);
    Storage.setCurrentPlayerId(p.id);
    Storage.savePlayer(p);
  }, player);

  // Recharger : au démarrage sans hash, l'application affiche l'écran de profils
  await page.goto(APP_URL);
  await page.locator(`.splash__player-card[data-player-id="${player.id}"]`).click();
  await expect(page.locator('.page--home')).toBeVisible();
  return player;
}

/** Variante de createPlayer avec des statistiques de départ (xp, cardsPlayed, sessions, streak...). */
async function createPlayerWithStats(page, stats = {}, name = 'TestPlayer') {
  return createPlayer(page, name, {
    badges: stats.badges,
    stats: {
      totalXP: stats.xp || 0,
      totalCardsPlayed: stats.cardsPlayed || 0,
      totalSessions: stats.sessions || 0,
      currentStreak: stats.streak || 0,
      longestStreak: stats.longestStreak || stats.streak || 0,
      longestGreenStreak: stats.longestGreenStreak || 0
    }
  });
}

/** Valeurs par défaut d'une carte de jeu. */
function withCardDefaults(card) {
  return {
    box: 'never_played',
    latencyThreshold: null,
    bestResponseTimeMs: null,
    lastResponseTimeMs: null,
    restUntil: null,
    restDays: 0,
    timesPlayed: 0,
    timesCorrect: 0,
    ...card
  };
}

/**
 * Ajoute un deck personnalisé par l'API de l'application (Storage.saveCustomDeck) et rafraîchit
 * l'état. Si une carte porte une boîte autre que never_played (box: 'green'...), cette boîte est
 * enregistrée comme progression du joueur courant (l'application ne lit la boîte que de là).
 * Le joueur doit déjà être connecté. Pas de rechargement de page.
 */
async function createTestDeck(page, deckConfig = {}) {
  const testDeck = {
    id: deckConfig.id || 'test-deck',
    name: deckConfig.name || 'Test Deck',
    description: deckConfig.description || 'A test deck for E2E testing',
    category: deckConfig.category || ['test'],
    difficulty: deckConfig.difficulty || 1,
    settings: {
      bidirectional: false,
      sequential: false,
      ...(deckConfig.settings || {})
    },
    cards: (deckConfig.cards || [
      { id: 'card_1', question: '2 + 2 = ?', answer: '4', type: 'numeric' },
      { id: 'card_2', question: 'Capital of France?', answer: 'Paris', alternatives: ['paris'] },
      { id: 'card_3', question: 'Is the sky blue?', answer: true, type: 'truefalse' }
    ]).map(withCardDefaults)
  };

  await page.evaluate((deck) => {
    Storage.saveCustomDeck(deck);
    if (deck.cards.some(c => c.box !== 'never_played')) {
      Storage.saveDeckProgress(deck.id, deck.cards);
    }
    State.set('decks', App._loadDecks());
  }, testDeck);

  return testDeck;
}

/** Lit un deck (progression comprise) dans l'état de l'application. */
async function getDeck(page, deckId) {
  return page.evaluate((id) => {
    const deck = State.get('decks').find(d => d.id === id);
    return deck ? JSON.parse(JSON.stringify(deck)) : null;
  }, deckId);
}

/** Decks personnalisés enregistrés (lecture par l'API de stockage, cartes comprises). */
async function getCustomDecks(page) {
  return page.evaluate(() => JSON.parse(JSON.stringify(Storage.loadCustomDecks())));
}

/** Joueur courant tel qu'enregistré et relu par l'application au démarrage (Storage.loadPlayer). */
async function getStoredPlayer(page) {
  return page.evaluate(() => JSON.parse(JSON.stringify(Storage.loadPlayer())));
}

/** Profil du joueur enregistré sous son identifiant (celui que relit la sélection de profil). */
async function getStoredPlayerById(page, playerId) {
  return page.evaluate((id) => JSON.parse(JSON.stringify(Storage.loadPlayerById(id))), playerId);
}

/** Joueur courant en mémoire (State), tel qu'affiché par l'interface. */
async function getStatePlayer(page) {
  return page.evaluate(() => JSON.parse(JSON.stringify(State.get('player'))));
}

/**
 * Répond à la carte affichée (texte, numérique, vrai/faux, QCM) puis valide.
 * Attend que le verso de la carte soit affiché.
 */
async function answerCard(page, answer, options = {}) {
  const { isTrueFalse = false, isMCQ = false } = options;

  if (isTrueFalse) {
    await page.locator(`.game-card__tf-option--${answer === true ? 'true' : 'false'}`).click();
  } else if (isMCQ) {
    await page.locator(`[data-choice-id="${answer}"]`).click();
  } else {
    await page.locator('#answer-input').fill(String(answer));
  }

  await page.locator('#submit-btn').click();
  await expect(page.locator('.game__card-content--back')).toBeVisible();
}

/** Clique sur « Continuer ». */
async function clickNextCard(page) {
  await page.locator('#next-btn').click();
}

/** XP total affiché dans la barre du joueur (« 12 / 100 XP » -> 12). */
async function getCurrentXP(page) {
  const text = await page.locator('.player-bar__xp-text').textContent();
  return parseInt(text.split('/')[0], 10);
}

/** Niveau affiché dans la barre du joueur (« ⭐ Niv. 2 » -> 2). */
async function getCurrentLevel(page) {
  const text = await page.locator('.player-bar__level').textContent();
  return parseInt(text.replace(/[^0-9]/g, ''), 10);
}

/**
 * Empêche toute requête réseau externe (http/https/ws) pendant le test.
 * Les requêtes sont interrompues et enregistrées ; le tableau retourné permet de vérifier
 * qu'aucune n'a été tentée. Le fichier de l'application (file://) n'est pas concerné.
 *
 * @returns {Promise<string[]>} URLs des requêtes bloquées (remplies au fil du test)
 */
async function blockExternalNetwork(page) {
  const blocked = [];
  await page.route(/^(https?|wss?):/i, (route) => {
    blocked.push(route.request().url());
    return route.abort('blockedbyclient');
  });
  return blocked;
}

module.exports = {
  navigateToApp,
  clearStorage,
  navigateTo,
  createPlayer,
  createPlayerWithStats,
  createTestDeck,
  getDeck,
  getCustomDecks,
  getStoredPlayer,
  getStoredPlayerById,
  getStatePlayer,
  answerCard,
  clickNextCard,
  getCurrentXP,
  getCurrentLevel,
  blockExternalNetwork
};
