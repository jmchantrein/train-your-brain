/**
 * E2E - Mode défi : une autre façon de faire ses révisions (docs/GAMIFICATION.md, « Mode défi »)
 *
 * Règles testées :
 * - points d'entrée : page des défis et ligne d'un deck ; rien d'incitatif sur l'accueil ;
 * - un défi porte sur les cartes à réviser et fait avancer les cartes exactement comme une séance
 *   normale ; bonus de 3 XP au plus une fois par jour, jamais un multiple de l'XP de carte ;
 * - aucune mécanique de perte : « Pas cette fois », pas de vies ni de « défaite » ;
 * - quatre modes (Parcours, Sans erreur, Contre la montre, Jusqu'au bout) ; Contre la montre jamais
 *   présélectionné ni proposé avec une préférence d'accessibilité, fin douce à zéro ; Jusqu'au bout
 *   porte sur toutes les cartes à réviser, seulement à partir de 20 ;
 * - entraînement libre quand il n'y a rien à réviser : rien n'est enregistré ;
 * - la quête hebdomadaire « défis » est atteignable.
 *
 * L'horloge est fixée au mercredi 4 mars 2026 (page.clock) : une carte rapide passe en boîte verte.
 */

const { test, expect } = require('@playwright/test');
const {
  navigateToApp,
  clearStorage,
  createPlayer,
  createTestDeck,
  navigateTo,
  answerCard,
  getDeck,
  getStatePlayer,
  getStoredPlayer,
  blockExternalNetwork
} = require('./helpers.cjs');

const TODAY = '2026-03-04';

/** Carte à réviser : déjà jouée, en boîte violette. Question « n + n = ? », réponse 2n. */
const dueCard = (id, n) => ({
  id,
  question: `${n} + ${n} = ?`,
  answer: String(2 * n),
  type: 'numeric',
  box: 'purple',
  timesPlayed: 1,
  timesCorrect: 1,
  latencyThreshold: 600
});

/** Carte verte au repos (non jouable aujourd'hui). */
const restingCard = (id, n) => ({
  ...dueCard(id, n),
  box: 'green',
  timesPlayed: 2,
  timesCorrect: 2,
  restDays: 3,
  restUntil: '2026-03-07'
});

const dueDeck = (id, count) => ({
  id,
  name: `Deck ${id}`,
  settings: { sequential: true },
  cards: Array.from({ length: count }, (_, i) => dueCard(`${id}_${i + 1}`, i + 1))
});

const restingDeck = (id, count) => ({
  id,
  name: `Deck ${id}`,
  settings: { sequential: true },
  cards: Array.from({ length: count }, (_, i) => restingCard(`${id}_${i + 1}`, i + 1))
});

/** Répond aux cartes d'un défi (ou d'une séance) : `answers[i]` vrai = bonne réponse, faux = erreur. */
async function playCards(page, answers) {
  for (let i = 0; i < answers.length; i++) {
    await expect(page.locator('.game__card-question')).toHaveText(`${i + 1} + ${i + 1} = ?`);
    await answerCard(page, answers[i] ? String(2 * (i + 1)) : '999');
    await page.locator('#next-btn').click();
    // L'horloge est simulée (page.clock.install) : on avance les minuteurs des animations
    // (rangement de la carte, célébrations) au lieu de les attendre en temps réel, sinon un
    // défi de 12 cartes frôle le délai de 30 s sur un runner de CI.
    await page.clock.runFor(3000);
  }
}

/** Ouvre la page de choix d'un deck et lance le défi (mode et niveau). */
async function startFromSetup(page, deckId, { mode = 'steady', level = 'easy' } = {}) {
  await navigateTo(page, `/challenge-setup/${deckId}`);
  await expect(page.locator('.chalsetup__start')).toBeVisible();
  await page.locator(`input[name="chal-mode"][value="${mode}"]`).check();
  await page.locator(`input[name="chal-level"][value="${level}"]`).check();
  await page.locator('.chalsetup__start').click();
  await expect(page.locator('.chalbar')).toBeVisible();
}

// Bonus des défis du mode défi (les défis quotidiens ont aussi la source 'challenge', avec leur type en détail)
const challengeXpEntries = (player) => player.stats.xpHistory.filter(h => h.source === 'challenge' && ['steady', 'perfect', 'speed', 'endurance'].includes(h.details));

test.describe('Mode défi', () => {
  // Plusieurs scénarios jouent un défi entier de 8 à 12 cartes : ils durent une vingtaine de
  // secondes en local, davantage sur un runner de CI à deux cœurs. Délai doublé pour ce fichier.
  test.describe.configure({ timeout: 60000 });

  let pageErrors;
  let cspViolations;
  let blocked;

  test.beforeEach(async ({ page }) => {
    pageErrors = [];
    cspViolations = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('console', (message) => {
      if (/Content Security Policy|violates the following/i.test(message.text())) cspViolations.push(message.text());
    });
    blocked = await blockExternalNetwork(page);
    await page.clock.install({ time: new Date(2026, 2, 4, 10, 0, 0) });
    await navigateToApp(page);
    await clearStorage(page);
  });

  test.afterEach(() => {
    expect(pageErrors).toEqual([]);
    expect(cspViolations).toEqual([]);
    expect(blocked).toEqual([]);
  });

  test.describe('Points d\'entrée', () => {
    test('should list the started decks on the challenges page and lead to the choice of the mode', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('entry-deck', 6));
      await createTestDeck(page, { id: 'fresh-deck', name: 'Deck fresh-deck', cards: [{ id: 'f1', question: 'x', answer: 'y' }] });
      await navigateTo(page, '/challenges');

      await expect(page.locator('.chalentry')).toBeVisible();
      await expect(page.locator('#chal-deck option')).toHaveText(['Deck entry-deck (6 à réviser)']);
      await page.locator('.chalentry__choose').click();

      await expect(page).toHaveURL(/#\/challenge-setup\/entry-deck$/);
      await expect(page.locator('.chalsetup__title')).toContainText('Choisir un défi');
      await expect(page.locator('.chalsetup__option input[name="chal-mode"]')).toHaveCount(3);
      await expect(page.locator('.chalsetup__option-text').first()).toContainText('Parcours');
    });

    test('should offer a challenge action on the row of a deck that has cards to review', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('row-deck', 6));
      await navigateTo(page, '/explore');
      await navigateTo(page, '/home');

      const row = page.locator('#playable-decks .deck-table__row[data-deck-id="row-deck"]');
      await row.locator('.deck-table__btn--challenge').click();
      await expect(page).toHaveURL(/#\/challenge-setup\/row-deck$/);
    });

    test('should offer it on the explore page for a resting deck, leading to the free practice', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, restingDeck('calm-deck', 3));
      await navigateTo(page, '/explore');

      await page.locator('#explore-decks .deck-table__row[data-deck-id="calm-deck"] .deck-table__btn--challenge').click();
      await expect(page).toHaveURL(/#\/challenge-setup\/calm-deck$/);
      await expect(page.locator('.chalsetup__practice')).toBeVisible();
    });

    test('should not push challenges on the home page', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, restingDeck('quiet-deck', 4));
      await navigateTo(page, '/home');

      await expect(page.locator('.page--home')).toBeVisible();
      await expect(page.locator('.page--home a[href^="#/challenge-setup"]')).toHaveCount(0);
      await expect(page.locator('.page--home a[href^="#/challenge/"]')).toHaveCount(0);
      await expect(page.locator('.page--home .deck-table__btn--challenge')).toHaveCount(0);
    });

    test('should tell a new player to start a deck first, without pushing', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, { id: 'new-deck', cards: [{ id: 'n1', question: 'x', answer: 'y' }] });
      await navigateTo(page, '/challenges');

      await expect(page.locator('.chalentry__empty')).toBeVisible();
      await expect(page.locator('#chal-deck')).toHaveCount(0);
    });
  });

  test.describe('Choix du défi', () => {
    test('should offer three modes, only the levels the deck allows, and start on Parcours', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('setup-deck', 9));
      await navigateTo(page, '/challenge-setup/setup-deck');

      await expect(page.locator('input[name="chal-mode"]')).toHaveCount(3);
      await expect(page.locator('input[name="chal-mode"][value="steady"]')).toBeChecked();
      await expect(page.locator('input[name="chal-mode"][value="speed"]')).not.toBeChecked();
      await expect(page.locator('input[name="chal-mode"][value="endurance"]')).toHaveCount(0);
      await expect(page.locator('input[name="chal-level"][value="easy"]')).toBeEnabled();
      await expect(page.locator('input[name="chal-level"][value="medium"]')).toBeEnabled();
      await expect(page.locator('input[name="chal-level"][value="hard"]')).toBeDisabled();
      await expect(page.locator('input[name="chal-level"][value="expert"]')).toBeDisabled();
      await expect(page.locator('#chal-timer')).toHaveCount(0);
      await expect(page.locator('.chalsetup__help').last()).toContainText('3 XP de bonus, une fois par jour');
    });

    test('should say what each level means for the chosen mode', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('levels-deck', 9));
      await navigateTo(page, '/challenge-setup/levels-deck');

      const easy = page.locator('.chalsetup__option--level').first().locator('small');
      await expect(easy).toContainText('5 cartes');
      await expect(easy).toContainText('60 %');
      await page.locator('input[name="chal-mode"][value="speed"]').check();
      await expect(easy).toContainText('2:30');
      await page.locator('input[name="chal-mode"][value="perfect"]').check();
      await expect(easy).toContainText('série de 4');
    });

    test('should not offer Contre la montre with dyslexia mode, nor with large spacing', async ({ page }) => {
      await createPlayer(page, 'Dys', { settings: { dyslexiaMode: true } });
      await createTestDeck(page, dueDeck('a11y-deck', 6));
      await navigateTo(page, '/challenge-setup/a11y-deck');
      await expect(page.locator('.chalsetup__start')).toBeVisible();
      await expect(page.locator('input[name="chal-mode"]')).toHaveCount(2);
      await expect(page.locator('input[name="chal-mode"][value="speed"]')).toHaveCount(0);

      await page.evaluate(() => {
        const p = State.get('player');
        p.settings.dyslexiaMode = false;
        p.settings.largeSpacing = true;
        State.set('player', p);
      });
      await navigateTo(page, '/challenges');
      await navigateTo(page, '/challenge-setup/a11y-deck');
      await expect(page.locator('.chalsetup__start')).toBeVisible();
      await expect(page.locator('input[name="chal-mode"][value="speed"]')).toHaveCount(0);
    });

    test('should send to the normal session when only a few cards are to review', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('few-deck', 3));
      await navigateTo(page, '/challenge-setup/few-deck');

      await expect(page.locator('.chalsetup__few')).toBeVisible();
      await expect(page.locator('.chalsetup__start')).toHaveCount(0);
      await expect(page.locator('.chalsetup__practice')).toHaveCount(0);
      await page.locator('.chalsetup__play-normal').click();
      await expect(page).toHaveURL(/#\/game\/few-deck$/);
    });
  });

  test.describe('Un défi est une séance de révision', () => {
    test('should make cards progress exactly like a normal session, with a 3 XP bonus on success', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('normal-deck', 5));
      await createTestDeck(page, dueDeck('challenge-deck', 5));
      const answers = [true, false, true, true, false];

      // Séance normale
      await navigateTo(page, '/game/normal-deck');
      await playCards(page, answers);
      await expect(page.locator('.page--session-summary')).toBeVisible();
      const normal = await getStatePlayer(page);
      const normalDeck = await getDeck(page, 'normal-deck');

      // Défi Parcours léger sur le deck équivalent, mêmes réponses (objectif 60 % : 3 sur 5)
      await startFromSetup(page, 'challenge-deck');
      await playCards(page, answers);
      await expect(page.locator('.chalresult')).toBeVisible();
      const challenged = await getStatePlayer(page);
      const challengeDeck = await getDeck(page, 'challenge-deck');

      const progress = (deck) => deck.cards.map(c => [c.box, c.restDays, c.timesPlayed, c.timesCorrect]);
      expect(progress(challengeDeck)).toEqual(progress(normalDeck));
      // 3 bonnes réponses sur 5 = 60 % : objectif atteint
      await expect(page.locator('.chalresult--success')).toBeVisible();
      await expect(page.locator('.chalresult__bonus')).toHaveText('+3 XP de bonus');
      expect(challengeXpEntries(challenged)).toHaveLength(1);
      expect(challengeXpEntries(challenged)[0].amount).toBe(3);
      expect(challenged.stats.totalCardsPlayed).toBe(normal.stats.totalCardsPlayed + 5);
      expect(challenged.stats.challengeWins).toBe(1);
      expect(challenged.stats.lastChallengeDay).toBe(TODAY);
      expect(challenged.stats.totalSessions).toBe(2);
      // L'XP de séance du défi est celui d'une séance normale (le bonus s'y ajoute, rien d'autre)
      const sessionXp = (p) => p.stats.xpHistory.filter(h => h.source === 'session').map(h => h.amount);
      expect(sessionXp(challenged)[1]).toBe(sessionXp(challenged)[0]);
    });

    test('should end on a page that includes the session summary', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('summary-deck', 5));
      await startFromSetup(page, 'summary-deck');
      await playCards(page, [true, true, true, true, true]);

      await expect(page).toHaveURL(/#\/challenge-results$/);
      await expect(page.locator('.chalresult__title')).toHaveText('🎉 Défi réussi !');
      await expect(page.locator('.session-summary__learning')).toBeVisible();
      await expect(page.locator('.session-summary__home')).toBeVisible();
    });

    test('should only count a win and give the bonus once per day, whatever the mode', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('twice-deck', 10));

      // Contre la montre : 3 bonnes réponses sur 3 visées, puis le temps s'arrête
      await startFromSetup(page, 'twice-deck', { mode: 'speed' });
      await playCards(page, [true, true, true]);
      await page.clock.runFor(150000);
      await expect(page.locator('.chalresult--success')).toBeVisible();
      await expect(page.locator('.chalresult__bonus')).toBeVisible();

      // Les trois premières cartes se reposent : le deuxième défi, tous modes confondus, n'a pas de bonus
      await page.locator('.chalresult__another').click();
      await startFromSetup(page, 'twice-deck', { mode: 'speed' });
      for (let n = 4; n <= 6; n++) {
        await expect(page.locator('.game__card-question')).toHaveText(`${n} + ${n} = ?`);
        await answerCard(page, String(2 * n));
        await page.locator('#next-btn').click();
      }
      await page.clock.runFor(150000);
      await expect(page.locator('.chalresult--success')).toBeVisible();
      await expect(page.locator('.chalresult__bonus')).toHaveCount(0);
      await expect(page.locator('.chalresult__bonus-done')).toHaveText('Le bonus du jour est déjà pris : un seul par jour.');

      const player = await getStatePlayer(page);
      expect(challengeXpEntries(player)).toHaveLength(1);
      expect(player.stats.challengeWins).toBe(1);
    });

    test('should never give more than a few XP for a challenge, whatever the level', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('big-deck', 8));
      await startFromSetup(page, 'big-deck', { mode: 'perfect', level: 'medium' });
      await playCards(page, Array(8).fill(true));
      await expect(page.locator('.chalresult--success')).toBeVisible();

      const player = await getStatePlayer(page);
      const bonus = challengeXpEntries(player).reduce((sum, h) => sum + h.amount, 0);
      const cardXp = player.stats.xpHistory.filter(h => h.source === 'session').reduce((sum, h) => sum + h.amount, 0);
      expect(bonus).toBe(3);
      expect(cardXp).toBeGreaterThan(bonus * 5);
      // Le score (x1,5 en Moyen) est un affichage : aucun XP n'en dérive
      expect(player.challengeScores.perfect_medium).toBeGreaterThan(1000);
    });
  });

  test.describe('Sans mécanique de perte', () => {
    test('should end an unsuccessful challenge with what was learned and an invitation to try later', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('again-deck', 5));
      await startFromSetup(page, 'again-deck');
      await playCards(page, [true, false, false, false, false]);

      await expect(page.locator('.chalresult--again')).toBeVisible();
      await expect(page.locator('.chalresult__title')).toHaveText('🌱 Pas cette fois');
      await expect(page.locator('.chalresult__retry-hint')).toContainText('Tu pourras réessayer plus tard');
      await expect(page.locator('.session-summary__learning')).toBeVisible();
      await expect(page.locator('.chalresult__bonus')).toHaveCount(0);
      await expect(page.locator('body')).not.toContainText(/défaite|raté|perdu|💔|vies?\b/i);

      const player = await getStatePlayer(page);
      expect(player.stats.challengeWins).toBeUndefined();
      expect(challengeXpEntries(player)).toHaveLength(0);
    });

    test('should show the farthest run in Sans erreur, without lives or hearts, and play every card', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('run-deck', 5));
      await startFromSetup(page, 'run-deck', { mode: 'perfect' });

      await expect(page.locator('.chalbar__goal')).toHaveText("Objectif : 4 bonnes réponses d'affilée");
      await expect(page.locator('.chalbar__run')).toHaveText('Meilleure série : 0');
      await expect(page.locator('.chalbar')).not.toContainText('❤');

      await answerCard(page, '999');
      await expect(page.locator('.chalbar__run')).toHaveText('Meilleure série : 0');
      await page.locator('#next-btn').click();
      for (let n = 2; n <= 5; n++) {
        await expect(page.locator('.game__card-question')).toHaveText(`${n} + ${n} = ?`);
        await answerCard(page, String(2 * n));
        await expect(page.locator('.chalbar__run')).toHaveText(`Meilleure série : ${n - 1}`);
        await page.locator('#next-btn').click();
      }

      // Une erreur au début : on a joué toutes les cartes, la série de 4 est atteinte
      await expect(page.locator('.chalresult--success')).toBeVisible();
      const player = await getStatePlayer(page);
      expect(player.stats.totalCardsPlayed).toBe(5);
      expect(player.stats.perfectChallengeComplete).toBeFalsy();
    });

    test('should keep the answered cards when quitting, and say so', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('quit-deck', 5));
      await startFromSetup(page, 'quit-deck');
      await playCards(page, [true, true]);
      await expect(page.locator('.game__card-question')).toHaveText('3 + 3 = ?');

      let dialogMessage = null;
      page.once('dialog', async (dialog) => {
        dialogMessage = dialog.message();
        await dialog.accept();
      });
      await page.locator('.game__back').click();
      // Retour au choix du défi : les deux cartes validées ne sont plus à réviser, il en reste 3
      await expect(page.locator('.chalsetup__few')).toBeVisible();
      expect(dialogMessage).toBe('Quitter le défi ? Les cartes déjà validées sont enregistrées.');

      const deck = await getDeck(page, 'quit-deck');
      expect(deck.cards.map(c => c.timesPlayed)).toEqual([2, 2, 1, 1, 1]);
    });
  });

  test.describe('Contre la montre', () => {
    test('should show one countdown for the whole challenge, with the goal of the mode', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('timer-deck', 5));
      await startFromSetup(page, 'timer-deck', { mode: 'speed' });

      await expect(page.locator('.chalbar__mode')).toContainText('Contre la montre');
      await expect(page.locator('.chalbar__goal')).toHaveText('Objectif : 3 bonnes réponses avant la fin du temps');
      await expect(page.locator('.chalbar__timer')).toHaveText('2:30');
      await page.clock.runFor(10000);
      await expect(page.locator('.chalbar__timer')).toHaveText(/^2:(19|20)$/);

      // Le temps de la première carte est décompté une seule fois : pas de remise à zéro par carte
      await answerCard(page, '2');
      await page.locator('#next-btn').click();
      await expect(page.locator('.game__card-question')).toHaveText('2 + 2 = ?');
      await expect(page.locator('.chalbar__timer')).toHaveText(/^2:(19|20)$/);
    });

    test('should end gently at zero: answered cards kept, the others still to review, nothing counted wrong', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('timeup-deck', 5));
      await startFromSetup(page, 'timeup-deck', { mode: 'speed' });
      await playCards(page, [true, true]);
      await expect(page.locator('.chalbar__timer')).toBeVisible();

      await page.clock.runFor(150000);

      await expect(page).toHaveURL(/#\/challenge-results$/);
      await expect(page.locator('.chalresult__timeup')).toHaveText('Le temps est écoulé. Les cartes non atteintes restent à revoir.');
      await expect(page.locator('.chalresult--again')).toBeVisible(); // 2 bonnes réponses sur 3 visées
      await expect(page.locator('.chalresult__stat-value').first()).toHaveText('2/2');
      const deck = await getDeck(page, 'timeup-deck');
      expect(deck.cards.map(c => c.timesPlayed)).toEqual([2, 2, 1, 1, 1]);
      expect(deck.cards.slice(2).every(c => c.box === 'purple')).toBe(true);
    });

    test('should succeed when the target is reached before the time stops, with the usual single bonus', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('fast-deck', 5));
      await startFromSetup(page, 'fast-deck', { mode: 'speed' });
      await playCards(page, [true, true, true]);
      await page.clock.runFor(150000);

      await expect(page.locator('.chalresult--success')).toBeVisible();
      await expect(page.locator('.chalresult__bonus')).toHaveText('+3 XP de bonus');
      const player = await getStatePlayer(page);
      expect(challengeXpEntries(player)).toHaveLength(1);
      const deck = await getDeck(page, 'fast-deck');
      expect(deck.cards.map(c => c.timesPlayed)).toEqual([2, 2, 2, 1, 1]);
    });

    test('should leave everything untouched when the time is up before any answer', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('idle-deck', 5));
      const before = await getStatePlayer(page);
      await startFromSetup(page, 'idle-deck', { mode: 'speed' });

      await page.clock.runFor(150000);

      await expect(page.locator('.chalresult__timeup')).toBeVisible();
      const after = await getStatePlayer(page);
      expect(after.stats.totalXP).toBe(before.stats.totalXP);
      expect(after.stats.totalCardsPlayed).toBe(0);
      const deck = await getDeck(page, 'idle-deck');
      expect(deck.cards.every(c => c.box === 'purple' && c.timesPlayed === 1)).toBe(true);
    });

    test('should never be reachable with an accessibility preference, even by a direct link', async ({ page }) => {
      await createPlayer(page, 'Dys', { settings: { dyslexiaMode: true } });
      await createTestDeck(page, dueDeck('dys-link-deck', 5));
      await navigateTo(page, '/challenge/speed/easy/dys-link-deck');

      await expect(page).toHaveURL(/#\/challenge-setup\/dys-link-deck$/);
      await expect(page.locator('.chalbar__timer')).toHaveCount(0);
    });

    test('should map old links: streak to Sans erreur, a timed Parcours link to Contre la montre', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('old-link-deck', 5));
      await navigateTo(page, '/challenge/streak/easy/old-link-deck');
      await expect(page.locator('.chalbar__mode')).toContainText('Sans erreur');
      await expect(page.locator('.chalbar__timer')).toHaveCount(0);

      await page.evaluate(() => { State.set('currentSession', null); });
      await navigateTo(page, '/challenges');
      await navigateTo(page, '/challenge/steady/easy/old-link-deck/timed');
      await expect(page.locator('.chalbar__mode')).toContainText('Contre la montre');
      await expect(page.locator('.chalbar__timer')).toBeVisible();
    });
  });

  test.describe('Jusqu\'au bout', () => {
    test('should not be offered under 20 cards to review, and never on a direct link', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('mid-deck', 19));
      await navigateTo(page, '/challenge-setup/mid-deck');
      await expect(page.locator('input[name="chal-mode"][value="endurance"]')).toHaveCount(0);

      await navigateTo(page, '/challenge/endurance/easy/mid-deck');
      await expect(page).toHaveURL(/#\/challenge-setup\/mid-deck$/);
    });

    test('should say what the level means from 20 cards: all the cards to review, a level to hold on each half', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('twenty-deck', 20));
      await navigateTo(page, '/challenge-setup/twenty-deck');
      await expect(page.locator('input[name="chal-mode"][value="endurance"]')).not.toBeChecked();
      await page.locator('input[name="chal-mode"][value="endurance"]').check();
      await expect(page.locator('.chalsetup__option--level').first().locator('small')).toContainText('Les 20 cartes à réviser, 60 % sur chaque moitié');
      await expect(page.locator('.chalsetup__help--endurance')).toBeVisible();
      await expect(page.locator('.chalsetup__help--speed')).toBeHidden();
    });

    // Les scénarios suivants jouent un petit deck : le seuil de 20 cartes (couvert par les tests
    // unitaires et par le test ci-dessus) est abaissé dans la page pour ne pas jouer 20 cartes.
    const lowerEnduranceThreshold = (page) => page.evaluate(() => { Challenges.ENDURANCE_MIN_DUE = 6; });
    const smallDeck = () => ({
      id: 'long-deck',
      name: 'Deck long-deck',
      settings: { sequential: true },
      cards: [
        ...Array.from({ length: 6 }, (_, i) => dueCard(`long-deck_${i + 1}`, i + 1)),
        restingCard('long-deck_r1', 40),
        restingCard('long-deck_r2', 41)
      ]
    });

    test('should cover every card to review, no resting card, and succeed when the level holds on both halves', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, smallDeck());
      await lowerEnduranceThreshold(page);
      await startFromSetup(page, 'long-deck', { mode: 'endurance', level: 'easy' });

      await expect(page.locator('.chalbar__mode')).toContainText("Jusqu'au bout");
      await expect(page.locator('.chalbar__goal')).toHaveText("Objectif : 60 % de bonnes réponses sur chaque moitié, jusqu'à la dernière carte");
      await expect(page.locator('.chalbar__timer')).toHaveCount(0);

      // 2 bonnes réponses sur 3 dans chaque moitié : 67 % partout
      await playCards(page, [true, true, false, true, false, true]);

      await expect(page.locator('.chalresult--success')).toBeVisible();
      await expect(page.locator('.chalresult__halves')).toHaveText('Première moitié : 2 sur 3, seconde moitié : 2 sur 3');
      await expect(page.locator('.chalresult__bonus')).toHaveText('+3 XP de bonus');
      const deck = await getDeck(page, 'long-deck');
      expect(deck.cards.slice(0, 6).every(c => c.timesPlayed === 2)).toBe(true);
      // les cartes au repos n'ont pas bougé
      expect(deck.cards.slice(6).every(c => c.timesPlayed === 2 && c.box === 'green' && c.restUntil === '2026-03-07')).toBe(true);
      const player = await getStatePlayer(page);
      expect(player.stats.totalCardsPlayed).toBe(6);
      expect(challengeXpEntries(player)).toHaveLength(1);
      expect(player.challengeScores.endurance_easy).toBeGreaterThan(0);
    });

    test('should say "Pas cette fois" when the level does not hold on the second half, without any penalty', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, smallDeck());
      await lowerEnduranceThreshold(page);
      await startFromSetup(page, 'long-deck', { mode: 'endurance', level: 'easy' });
      // 4 sur 6 au total (67 %), mais la seconde moitié (1 sur 3) ne tient pas 60 %
      await playCards(page, [true, true, true, true, false, false]);

      await expect(page.locator('.chalresult--again')).toBeVisible();
      await expect(page.locator('.chalresult__title')).toHaveText('🌱 Pas cette fois');
      await expect(page.locator('.chalresult__halves')).toHaveText('Première moitié : 3 sur 3, seconde moitié : 1 sur 3');
      await expect(page.locator('.session-summary__learning')).toBeVisible();
      await expect(page.locator('body')).not.toContainText(/défaite|raté|perdu|💔|vies?\b/i);
      const player = await getStatePlayer(page);
      expect(player.stats.challengeWins).toBeUndefined();
      expect(challengeXpEntries(player)).toHaveLength(0);
      expect(player.stats.totalCardsPlayed).toBe(6); // ce qui a été appris reste acquis
    });
  });

  test.describe('Rien à réviser : entraînement libre', () => {
    test('should offer a free practice, clearly announced, and change nothing', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, restingDeck('rest-deck', 4));
      const before = await getStatePlayer(page);
      const deckBefore = await getDeck(page, 'rest-deck');

      await navigateTo(page, '/challenge-setup/rest-deck');
      await expect(page.locator('.chalsetup__start')).toHaveCount(0);
      await expect(page.locator('.chalsetup__practice')).toContainText("Rien n'est enregistré : ni boîte, ni repos, ni XP.");
      await page.locator('.chalsetup__practice-start').click();

      await expect(page.locator('.chalbar__practice')).toContainText('Entraînement libre : tes cartes ne changent pas.');
      for (let n = 1; n <= 4; n++) {
        await expect(page.locator('.game__card-question')).toHaveText(`${n} + ${n} = ?`);
        await answerCard(page, n === 2 ? '999' : String(2 * n));
        await expect(page.locator('.game__card-destination')).toHaveCount(0);
        await expect(page.locator('.game__card-xp')).toHaveCount(0);
        await page.locator('#next-btn').click();
      }

      await expect(page.locator('.chalresult--practice')).toBeVisible();
      await expect(page.locator('.chalresult__count')).toHaveText('3 bonnes réponses sur 4');
      await expect(page.locator('.chalresult__note')).toHaveText("Rien n'a changé pour tes cartes : boîtes, repos et XP sont intacts.");
      await expect(page.locator('.chalresult__score')).toHaveCount(0);

      const after = await getStatePlayer(page);
      expect(after.stats).toEqual(before.stats);
      expect(after.badges).toEqual(before.badges);
      expect(await getDeck(page, 'rest-deck')).toEqual(deckBefore);
      const stored = await getStoredPlayer(page);
      expect(stored.stats.totalSessions).toBe(0);
      expect(stored.stats.totalXP).toBe(0);
    });

    test('should never short-circuit the rest while a card is to review', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, {
        id: 'mixed-deck',
        settings: { sequential: true },
        cards: [dueCard('m1', 1), restingCard('m2', 2), restingCard('m3', 3)]
      });
      await navigateTo(page, '/challenge/practice/easy/mixed-deck');

      await expect(page).toHaveURL(/#\/challenge-setup\/mixed-deck$/);
      await expect(page.locator('.chalsetup__few')).toBeVisible();
      await expect(page.locator('.chalsetup__practice')).toHaveCount(0);
    });
  });

  test.describe('Quête hebdomadaire weekly_challenges', () => {
    test('should complete after two successful challenges on two days', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('week-deck', 10));

      await startFromSetup(page, 'week-deck', { mode: 'speed' });
      await playCards(page, [true, true, true]);
      await page.clock.runFor(150000);
      await expect(page.locator('.chalresult--success')).toBeVisible();

      await page.clock.setSystemTime(new Date(2026, 2, 5, 10, 0, 0));
      await page.evaluate(() => { window.location.hash = '#/challenge-setup/week-deck'; });
      await expect(page.locator('.chalsetup__start')).toBeVisible();
      await page.locator('input[name="chal-mode"][value="speed"]').check();
      await page.locator('.chalsetup__start').click();
      for (let n = 4; n <= 6; n++) {
        await expect(page.locator('.game__card-question')).toHaveText(`${n} + ${n} = ?`);
        await answerCard(page, String(2 * n));
        await page.locator('#next-btn').click();
      }
      await page.clock.runFor(150000);
      await expect(page.locator('.chalresult--success')).toBeVisible();
      await expect(page.locator('.chalresult__bonus')).toBeVisible();
      await expect(page.locator('.session-summary__challenges-title').last()).toContainText('Quêtes');

      await navigateTo(page, '/challenges');
      await page.locator('.challenges__tab[data-tab="weekly"]').click();
      const quest = page.locator('.challenge--weekly').nth(3);
      await expect(quest.locator('.challenge__description')).toHaveText('Réussir 2 défis cette semaine (un par jour au plus)');
      await expect(quest).toHaveClass(/challenge--completed/);
      const player = await getStatePlayer(page);
      expect(player.stats.challengeWins).toBe(2);
    });
  });

  test.describe('Badges liés au défi', () => {
    test('should earn untouchable with a flawless Sans erreur of 12 cards, never a lesser one', async ({ page }) => {
      await createPlayer(page, 'Perfect', { stats: { fastestCorrectAnswer: 5000 } });
      await createTestDeck(page, dueDeck('flawless-deck', 12));
      await startFromSetup(page, 'flawless-deck', { mode: 'perfect', level: 'hard' });
      await playCards(page, Array(12).fill(true));
      await expect(page.locator('.chalresult--success')).toBeVisible();

      const player = await getStatePlayer(page);
      expect(player.stats.perfectChallengeComplete).toBe(true);
      expect(player.badges).toContain('untouchable');
    });
  });

  test.describe('Existing players', () => {
    test('should keep the best scores and the badges of a player who had challenge data', async ({ page }) => {
      await createPlayer(page, 'Veteran', {
        badges: ['challenger'],
        stats: { challengeWins: 4, expertChallengeWins: 1, perfectChallengeComplete: true }
      });
      await page.evaluate(() => {
        const p = State.get('player');
        p.challengeScores = { speed_easy: 900, perfect_hard: 1200, endurance_easy: 300 };
        Storage.savePlayerById(p);
        Storage.savePlayer(p);
        State.set('player', p);
      });
      await createTestDeck(page, dueDeck('old-deck', 5));
      await navigateTo(page, '/challenges');

      await expect(page.locator('.chalentry__records li')).toHaveText([
        'Sans erreur, Soutenu : 1200',
        'Contre la montre, Léger : 900',
        "Jusqu'au bout, Léger : 300"
      ]);
      const stored = await getStoredPlayer(page);
      expect(stored.challengeScores).toEqual({ speed_easy: 900, perfect_hard: 1200, endurance_easy: 300 });
      expect(stored.badges).toContain('challenger');
      expect(stored.stats.challengeWins).toBe(4);
    });
  });
});
