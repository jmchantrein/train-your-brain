/**
 * E2E - Gamification : XP, niveaux, badges, séries, défis, statistiques
 *
 * Barèmes (docs/GAMIFICATION.md) : carte verte +3 XP, orange +2, violette +1 ;
 * bonus de série de cartes vertes : 3 d'affilée = +5 XP ; niveau = floor(sqrt(XP / 100)) + 1.
 */

const { test, expect } = require('@playwright/test');
const {
  navigateToApp,
  createPlayer,
  createPlayerWithStats,
  createTestDeck,
  navigateTo,
  clearStorage,
  getStatePlayer,
  answerCard,
  getCurrentXP,
  getCurrentLevel
} = require('./helpers.cjs');

const num = (id, question, answer) => ({ id, question, answer: String(answer), type: 'numeric' });

/** Carte « à réviser » : déjà jouée, en boîte violette. Question « n + n = ? ». */
const due = (id, n) => ({
  ...num(id, `${n} + ${n} = ?`, 2 * n),
  box: 'purple',
  timesPlayed: 1,
  timesCorrect: 1,
  latencyThreshold: 600
});

/** Joue toutes les cartes d'un deck séquentiel : answers[i] est la réponse donnée à la carte i. */
async function playSession(page, questions, answers) {
  for (let i = 0; i < questions.length; i++) {
    await expect(page.locator('.game__card-question')).toHaveText(questions[i]);
    await answerCard(page, answers[i]);
    await page.locator('#next-btn').click();
  }
  await expect(page.locator('.page--session-summary')).toBeVisible();
}

const stat = (page, label) =>
  page.locator('.stats__stat', { has: page.locator('.stats__stat-label', { hasText: new RegExp(`^${label}$`) }) })
    .locator('.stats__stat-value');

test.describe('Gamification', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await clearStorage(page);
  });

  test.describe('XP System', () => {
    test('should start with 0 XP at level 1 for a new player', async ({ page }) => {
      await createPlayer(page);

      expect((await getStatePlayer(page)).stats.totalXP).toBe(0);
      await expect(page.locator('.player-bar__xp-text')).toHaveText('0 / 100 XP');
      await expect(page.locator('.player-bar__level')).toContainText('Niv. 1');
      expect(await getCurrentXP(page)).toBe(0);
      expect(await getCurrentLevel(page)).toBe(1);
    });

    test('should display XP and level of an experienced player in the player bar', async ({ page }) => {
      await createPlayerWithStats(page, { xp: 150 });

      await expect(page.locator('.player-bar__xp-text')).toHaveText('150 / 400 XP');
      await expect(page.locator('.player-bar__level')).toContainText('Niv. 2');
      expect(await getCurrentLevel(page)).toBe(2);
    });

    test('should earn XP for the cards of a session', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, { id: 'xp-deck', cards: [num('xp_c1', '1 + 1 = ?', 2)] });
      await navigateTo(page, '/game/xp-deck');

      await answerCard(page, '2');
      await expect(page.locator('.game__card-xp')).toHaveText('+3 XP');
      await page.locator('#next-btn').click();
      await expect(page.locator('.page--session-summary')).toBeVisible();

      // +3 XP de session (plus d'éventuels bonus de badges), cumulés dans le profil
      const player = await getStatePlayer(page);
      const sessionEntry = player.stats.xpHistory.find(h => h.source === 'session');
      expect(sessionEntry.amount).toBe(3);
      expect(player.stats.totalXP).toBeGreaterThanOrEqual(3);

      // La barre du joueur affiche le même total
      await page.locator('.session-summary__home').click();
      await expect(page.locator('.page--home')).toBeVisible();
      expect(await getCurrentXP(page)).toBe(player.stats.totalXP);
    });
  });

  test.describe('Level System', () => {
    test('should show the progress inside the current level', async ({ page }) => {
      await createPlayerWithStats(page, { xp: 50 });

      // Niveau 1 : de 0 à 100 XP -> 50 %
      await expect(page.locator('.player-bar__xp-bar')).toHaveAttribute('aria-valuenow', '50');
      await expect(page.locator('.player-bar__xp-fill')).toHaveAttribute('style', /width:\s*50%/);
      await expect(page.locator('.player-bar__xp-text')).toHaveText('50 / 100 XP');
    });

    test('should level up when the XP threshold is crossed', async ({ page }) => {
      await createPlayerWithStats(page, { xp: 95 });
      await expect(page.locator('.player-bar__level')).toContainText('Niv. 1');
      await createTestDeck(page, { id: 'levelup-deck', cards: [num('lvl_c1', '5 + 5 = ?', 10)] });
      await navigateTo(page, '/game/levelup-deck');

      await answerCard(page, '10');
      await page.locator('#next-btn').click();
      await expect(page.locator('.page--session-summary')).toBeVisible();
      await page.locator('.session-summary__home').click();
      await expect(page.locator('.page--home')).toBeVisible();

      // 95 + 3 XP de session + bonus de badges >= 100 : niveau 2 (seuil du niveau 2 : 100 XP)
      const player = await getStatePlayer(page);
      expect(player.stats.totalXP).toBeGreaterThanOrEqual(100);
      await expect(page.locator('.player-bar__level')).toContainText('Niv. 2');
    });
  });

  test.describe('Badges', () => {
    test('should show the badges page with every category and nothing unlocked', async ({ page }) => {
      await createPlayer(page);
      await navigateTo(page, '/badges');

      await expect(page.locator('h1.badges__title')).toHaveText('🏆 Badges');
      await expect(page.locator('.badges__section-title')).toHaveText([
        'Accomplissements', 'Maîtrise', 'Niveau', 'Séries', 'Performance', 'Matières', '🔮 Secrets'
      ]);
      const total = await page.locator('.badge').count();
      expect(total).toBeGreaterThan(10);
      await expect(page.locator('.badges__count')).toHaveText(`0 / ${total}`);
      await expect(page.locator('.badge:not(.badge--locked)')).toHaveCount(0);
    });

    test('should display unlocked badges as active and the others as locked', async ({ page }) => {
      await createPlayer(page, 'TestPlayer', { badges: ['first_card', 'first_session'] });
      await navigateTo(page, '/badges');

      const total = await page.locator('.badge').count();
      await expect(page.locator('.badges__count')).toHaveText(`2 / ${total}`);
      await expect(page.locator('.badge:not(.badge--locked)')).toHaveCount(2);
      for (const id of ['first_card', 'first_session']) {
        await expect(page.locator(`.badge[data-badge-id="${id}"]`)).not.toHaveClass(/badge--locked/);
      }
      await expect(page.locator('.badge[data-badge-id="first_card"] .badge__name')).toHaveText('Premier Pas');
      await expect(page.locator('.badge[data-badge-id="first_card"] .badge__icon')).toHaveText('🎯');
    });

    test('should show locked badges grayed out with their goal, and hide secret ones', async ({ page }) => {
      await createPlayer(page);
      await navigateTo(page, '/badges');

      const locked = page.locator('.badge[data-badge-id="mastery_10"]');
      await expect(locked).toHaveClass(/badge--locked/);
      await expect(locked.locator('.badge__icon')).toHaveText('🔒');
      await expect(locked.locator('.badge__locked-text')).toHaveText('Non débloqué');
      await expect(locked.locator('.badge__description')).not.toHaveText('');

      // Un badge secret verrouillé ne révèle ni son nom ni son icône
      const secret = page.locator('.badge--hidden').first();
      await expect(secret.locator('.badge__name')).toHaveText('???');
      await expect(secret.locator('.badge__icon')).toHaveText('❓');
    });

    test('should unlock the first badges after the first session', async ({ page }) => {
      await createPlayer(page);
      expect((await getStatePlayer(page)).badges).toEqual([]);
      await createTestDeck(page, { id: 'badge-deck', cards: [num('b_c1', '1 + 0 = ?', 1)] });
      await navigateTo(page, '/game/badge-deck');

      await answerCard(page, '1');
      await page.locator('#next-btn').click();

      // Le résumé annonce le badge de fin de première session
      await expect(page.locator('.session-summary__badges-title')).toHaveText('🏆 Nouveaux badges !');
      await expect(page.locator('.session-summary__badge-name', { hasText: "C'est Parti !" })).toBeVisible();

      const badges = (await getStatePlayer(page)).badges;
      expect(badges).toContain('first_card');
      expect(badges).toContain('first_session');

      // ... et la page des badges les montre débloqués
      await navigateTo(page, '/badges');
      await expect(page.locator('.badge[data-badge-id="first_card"]')).not.toHaveClass(/badge--locked/);
      await expect(page.locator('.badge[data-badge-id="first_session"]')).not.toHaveClass(/badge--locked/);
    });
  });

  test.describe('Streaks', () => {
    test('should track the green streak during a session and grant the streak bonus', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, {
        id: 'streak-deck',
        settings: { sequential: true },
        cards: [num('s1', '1 + 1 = ?', 2), num('s2', '2 + 2 = ?', 4), num('s3', '3 + 3 = ?', 6)]
      });
      await navigateTo(page, '/game/streak-deck');
      const streak = page.locator('.streak-vertical__count');

      await expect(page.locator('.streak-vertical--empty')).toHaveCount(1);
      for (const [i, [question, answer]] of [['1 + 1 = ?', '2'], ['2 + 2 = ?', '4'], ['3 + 3 = ?', '6']].entries()) {
        await expect(page.locator('.game__card-question')).toHaveText(question);
        await answerCard(page, answer);
        await expect(streak).toHaveText(String(i + 1));
        await page.locator('#next-btn').click();
      }

      // 3 cartes vertes (3 x 3 XP) + bonus de série de 3 (+5 XP)
      await expect(page.locator('.page--session-summary')).toBeVisible();
      await expect(page.locator('.session-summary__stat').nth(2).locator('.session-summary__stat-value')).toHaveText('14');
      expect((await getStatePlayer(page)).stats.longestGreenStreak).toBe(3);
    });

    test('should reset the green streak after a wrong answer', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, {
        id: 'streak-reset',
        settings: { sequential: true },
        cards: [num('s1', '1 + 1 = ?', 2), num('s2', '2 + 2 = ?', 4), num('s3', '3 + 3 = ?', 6)]
      });
      await navigateTo(page, '/game/streak-reset');

      await answerCard(page, '2');
      await expect(page.locator('.streak-vertical__count')).toHaveText('1');
      await page.locator('#next-btn').click();

      await expect(page.locator('.game__card-question')).toHaveText('2 + 2 = ?');
      await answerCard(page, '999');
      await expect(page.locator('.streak-vertical--empty')).toHaveCount(1);
      await expect(page.locator('.streak-vertical__count')).toHaveCount(0);
      await page.locator('#next-btn').click();

      await expect(page.locator('.game__card-question')).toHaveText('3 + 3 = ?');
      await answerCard(page, '6');
      await expect(page.locator('.streak-vertical__count')).toHaveText('1');
    });
  });

  test.describe('Daily Challenges', () => {
    test('should show the challenge counters in the navigation bar and open the missions page', async ({ page }) => {
      await createPlayer(page);

      const indicator = page.locator('.navbar__challenges');
      await expect(indicator.locator('.navbar__challenge-count')).toHaveText(['0/3', '0/5']);

      await indicator.click();

      await expect(page).toHaveURL(/#\/challenges$/);
      await expect(page.locator('.challenges__title')).toHaveText('🎯 Missions');
    });

    test('should list the three daily challenges with their progress and reward when cards are due', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, { id: 'due-deck', cards: [due('d1', 1), due('d2', 2), due('d3', 3), due('d4', 4)] });
      await navigateTo(page, '/challenges');

      await expect(page.locator('.challenges__tab--active')).toContainText('Quotidiens');
      await expect(page.locator('.challenges__tab-badge').first()).toHaveText('0/3');
      await expect(page.locator('.challenges__completed')).toHaveText('0/3 complétés');

      const challenges = page.locator('.challenges__list .challenge');
      await expect(challenges).toHaveCount(3);
      await expect(challenges.locator('.challenge__icon')).toHaveText(['🃏', '🎯', '💚']);
      // Cibles bornées par les 4 cartes à réviser
      await expect(challenges.nth(0).locator('.challenge__description')).toHaveText("Réviser 4 cartes aujourd'hui");
      await expect(challenges.nth(0).locator('.challenge__progress-text')).toHaveText('0/4 cartes');
      await expect(challenges.nth(1).locator('.challenge__description')).toContainText('70%');
      await expect(challenges.nth(2).locator('.challenge__description')).toHaveText("Enchaîner 3 cartes vertes d'affilée");
      await expect(challenges.nth(2).locator('.challenge__progress-text')).toHaveText("0/3 cartes vertes d'affilée");
      await expect(challenges.locator('.challenge__reward')).toHaveText([/\+\d+ XP/, /\+\d+ XP/, /\+\d+ XP/]);
      await expect(page.locator('.challenge--completed')).toHaveCount(0);
    });

    test('should offer no daily challenge to a new player with nothing to review', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, { id: 'new-cards-deck' });
      await navigateTo(page, '/challenges');

      await expect(page.locator('.challenges__rest')).toBeVisible();
      await expect(page.locator('.challenges__list .challenge')).toHaveCount(0);
      await expect(page.locator('.challenges__tab-badge').first()).toHaveText('0/0');
    });

    test('should list the five weekly quests in the weekly tab', async ({ page }) => {
      await createPlayer(page);
      await navigateTo(page, '/challenges');

      await page.locator('.challenges__tab[data-tab="weekly"]').click();

      await expect(page.locator('.challenges__tab--active')).toContainText('Hebdomadaires');
      await expect(page.locator('.challenge--weekly')).toHaveCount(5);
      await expect(page.locator('.challenges__completed')).toHaveText('0/5 complétés');
    });

    test('should update the challenge progress and counters after playing', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, {
        id: 'challenge-deck',
        settings: { sequential: true },
        cards: [due('c1', 1), due('c2', 2), due('c3', 3)]
      });
      await navigateTo(page, '/challenges');
      await expect(page.locator('.challenges__list .challenge')).toHaveCount(3);

      await navigateTo(page, '/game/challenge-deck');
      await playSession(page, ['1 + 1 = ?', '2 + 2 = ?', '3 + 3 = ?'], ['2', '4', '6']);

      // Les 3 cartes à réviser sont réussies d'affilée : les trois défis sont accomplis
      await expect(page.locator('.session-summary__challenges-title').first()).toHaveText('🎯 Défis complétés !');
      await expect(page.locator('.session-summary__challenges').first()).toContainText("Enchaîner 3 cartes vertes d'affilée");
      await navigateTo(page, '/challenges');
      const challenges = page.locator('.challenges__list .challenge');
      await expect(challenges.locator('.challenge__progress-text')).toHaveText(['Complété !', 'Complété !', 'Complété !']);
      await expect(page.locator('.challenge--completed')).toHaveCount(3);
      await expect(page.locator('.challenges__completed')).toHaveText('3/3 complétés');
      await expect(page.locator('.navbar__challenges .navbar__challenge-count').first()).toHaveText('3/3');
    });
  });

  test.describe('Stats Page', () => {
    test('should display the player statistics', async ({ page }) => {
      await createPlayerWithStats(page, { xp: 500, cardsPlayed: 100, sessions: 15, streak: 5 });
      await page.locator('.navbar a[href="#/stats"]').click();

      await expect(page.locator('h1.stats__title')).toHaveText('📊 Statistiques');
      await expect(stat(page, 'Niveau')).toHaveText('3');
      await expect(stat(page, 'XP')).toHaveText('500');
      await expect(stat(page, 'Cartes jouées')).toHaveText('100');
      await expect(stat(page, 'Sessions')).toHaveText('15');
    });

    test('should display the current streak and the record', async ({ page }) => {
      await createPlayerWithStats(page, { streak: 7 });
      await navigateTo(page, '/stats');

      await expect(stat(page, 'Série actuelle')).toHaveText('🔥 7');
      await expect(stat(page, 'Record')).toHaveText('🏆 7');
    });

    test('should show empty statistics for a new player', async ({ page }) => {
      await createPlayer(page);
      await navigateTo(page, '/stats');

      await expect(stat(page, 'Niveau')).toHaveText('1');
      await expect(stat(page, 'XP')).toHaveText('0');
      await expect(stat(page, 'Cartes jouées')).toHaveText('0');
      await expect(stat(page, 'Sessions')).toHaveText('0');
    });
  });
});
