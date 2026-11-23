/**
 * E2E - Missions : défis quotidiens, quêtes hebdomadaires, bilan de séance
 *
 * Règles testées (docs/GAMIFICATION.md, section « Missions ») :
 * - un joueur qui n'a aucune carte à réviser n'a aucun défi ce jour-là (la page le dit) ;
 * - avec des cartes à réviser (déjà jouées et jouables aujourd'hui) : trois défis, `review_due`,
 *   `accuracy` et `green_streak`, dont les cibles sont bornées par ces cartes (et par 10) ;
 * - les défis se calculent sur la journée entière, sont récompensés une seule fois et
 *   survivent au rechargement ; ils sont propres à chaque joueur ;
 * - le bilan de séance dit ce que la séance a changé ; les confettis demandent 80 % de réussite.
 *
 * Une carte « à réviser » est une carte déjà jouée (timesPlayed > 0) dans la boîte violette.
 * L'horloge est fixée au mercredi 4 mars 2026 (page.clock) : le jour, la semaine et la date de
 * prochaine révision affichée sont alors connus.
 */

const { test, expect } = require('@playwright/test');
const { APP_URL } = require('./app-path.cjs');
const {
  navigateToApp,
  clearStorage,
  createPlayer,
  createTestDeck,
  navigateTo,
  answerCard,
  getStatePlayer,
  getStoredPlayer,
  getStoredPlayerById
} = require('./helpers.cjs');

const TODAY = '2026-03-04';

/** Carte à réviser : déjà jouée, en boîte violette (jouable aujourd'hui). Question « n + n = ? ». */
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

/** Carte jamais jouée. */
const freshCard = (id, n) => ({ id, question: `${n} + ${n} = ?`, answer: String(2 * n), type: 'numeric' });

/** Deck séquentiel de `count` cartes à réviser. */
const dueDeck = (id, count) => ({
  id,
  name: id,
  settings: { sequential: true },
  cards: Array.from({ length: count }, (_, i) => dueCard(`${id}_${i + 1}`, i + 1))
});

/**
 * Joue les `count` premières cartes d'un deck séquentiel de `total` cartes ; les indices de `wrong`
 * reçoivent une mauvaise réponse. La carte est comptée dans les missions à la fin de l'animation
 * qui suit « Continuer » : si la séance continue, on attend donc la carte suivante.
 */
async function playCards(page, count, wrong = [], total = count) {
  for (let i = 0; i < count; i++) {
    await expect(page.locator('.game__card-question')).toHaveText(`${i + 1} + ${i + 1} = ?`);
    await answerCard(page, wrong.includes(i) ? '999' : String(2 * (i + 1)));
    await page.locator('#next-btn').click();
  }
  if (count < total) {
    await expect(page.locator('.game__card-question')).toHaveText(`${count + 1} + ${count + 1} = ?`);
  }
}

/** Recharge l'application et se reconnecte au joueur (écran de profils). */
async function reopenAs(page, player) {
  await page.goto(APP_URL);
  await page.locator(`.splash__player-card[data-player-id="${player.id}"]`).click();
  await expect(page.locator('.page--home')).toBeVisible();
}

const challenges = (page) => page.locator('.challenges__list .challenge');
const xpEntries = (player, source) => player.stats.xpHistory.filter(h => h.source === source);

test.describe('Missions', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date(2026, 2, 4, 10, 0, 0) });
    await navigateToApp(page);
    await clearStorage(page);
  });

  test.describe('Daily challenges without cards to review', () => {
    test('should show no challenge and say why for a player who has not played yet', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, {
        id: 'unplayed-deck',
        cards: [freshCard('u1', 1), freshCard('u2', 2), freshCard('u3', 3)]
      });
      await navigateTo(page, '/challenges');

      await expect(page.locator('.challenges__rest-text')).toHaveText(
        "Rien à réviser aujourd'hui : pas de défi du jour. Reviens quand des cartes seront à revoir."
      );
      await expect(challenges(page)).toHaveCount(0);
      await expect(page.locator('.challenges__tab-badge').first()).toHaveText('0/0');
      expect((await getStatePlayer(page)).missions.daily.challenges).toEqual([]);
    });

    test('should not count a green card that is still resting', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, {
        id: 'resting-deck',
        cards: [{ ...freshCard('r1', 1), box: 'green', timesPlayed: 3, timesCorrect: 3, restDays: 3, restUntil: '2026-03-07' }]
      });
      await navigateTo(page, '/challenges');

      await expect(page.locator('.challenges__rest')).toBeVisible();
      await expect(challenges(page)).toHaveCount(0);
    });

    test('should still list the weekly quests on a day without challenge', async ({ page }) => {
      await createPlayer(page);
      await navigateTo(page, '/challenges');
      await page.locator('.challenges__tab[data-tab="weekly"]').click();

      await expect(page.locator('.challenge--weekly')).toHaveCount(5);
    });
  });

  test.describe('Daily challenges with cards to review', () => {
    test('should offer the three challenges, capped at 10 cards, when many cards are due', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('many-due', 12));
      await navigateTo(page, '/challenges');

      await expect(challenges(page)).toHaveCount(3);
      await expect(page.locator('.challenges__rest')).toHaveCount(0);
      await expect(page.locator('.challenges__tab-badge').first()).toHaveText('0/3');
      await expect(page.locator('.challenges__completed')).toHaveText('0/3 complétés');
      await expect(challenges(page).locator('.challenge__icon')).toHaveText(['🃏', '🎯', '💚']);
      await expect(challenges(page).locator('.challenge__description')).toHaveText([
        "Réviser 10 cartes aujourd'hui",
        'Réussir 70% de bonnes réponses sur la journée (dès 10 cartes)',
        'Enchaîner 3 cartes vertes d\'affilée'
      ]);
      await expect(challenges(page).locator('.challenge__progress-text')).toHaveText([
        '0/10 cartes', '0/10 cartes jouées', '0/3 cartes vertes d\'affilée'
      ]);
      // Petit plus : 5 XP au plus pour la journée, loin devant l'XP des cartes
      await expect(challenges(page).locator('.challenge__reward')).toHaveText(['+3 XP', '+1 XP', '+1 XP']);
      await expect(page.locator('.challenge--completed')).toHaveCount(0);
    });

    test('should bound every target by the cards that can really be reviewed', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('two-due', 2));
      await navigateTo(page, '/challenges');

      await expect(challenges(page)).toHaveCount(3);
      await expect(challenges(page).locator('.challenge__description')).toHaveText([
        "Réviser 2 cartes aujourd'hui",
        'Réussir 70% de bonnes réponses sur la journée (dès 2 cartes)',
        'Enchaîner 2 cartes vertes d\'affilée'
      ]);
      await expect(challenges(page).locator('.challenge__progress-text')).toHaveText([
        '0/2 cartes', '0/2 cartes jouées', '0/2 cartes vertes d\'affilée'
      ]);
    });

    test('should count only the cards already played, not the new ones', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, {
        id: 'mixed-deck',
        settings: { sequential: true },
        cards: [dueCard('m1', 1), dueCard('m2', 2), freshCard('m3', 3), freshCard('m4', 4), freshCard('m5', 5)]
      });
      await navigateTo(page, '/challenges');

      await expect(challenges(page).nth(0).locator('.challenge__description')).toHaveText("Réviser 2 cartes aujourd'hui");
    });

    test('should track the whole day, including a session left unfinished', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('partial-deck', 5));
      await navigateTo(page, '/challenges');
      await expect(challenges(page)).toHaveCount(3);

      await navigateTo(page, '/game/partial-deck');
      await playCards(page, 2, [], 5);
      // La séance est abandonnée : les deux cartes comptent quand même
      await navigateTo(page, '/challenges');

      await expect(challenges(page).locator('.challenge__progress-text')).toHaveText([
        '2/5 cartes', '2/5 cartes jouées', '2/3 cartes vertes d\'affilée'
      ]);
      await expect(page.locator('.challenge--completed')).toHaveCount(0);
      expect((await getStatePlayer(page)).missions.daily.cardsPlayed).toBe(2);
    });

    test('should complete the challenges once, credit their XP once and announce them in the summary', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('full-deck', 3));
      await navigateTo(page, '/challenges');
      await expect(challenges(page)).toHaveCount(3);

      await navigateTo(page, '/game/full-deck');
      await playCards(page, 3);
      await expect(page.locator('.page--session-summary')).toBeVisible();

      // Les trois défis sont terminés par cette séance : annoncés avec leur XP
      await expect(page.locator('.session-summary__challenges-title').first()).toHaveText('🎯 Défis complétés !');
      const announced = page.locator('.session-summary__challenges').first();
      await expect(announced.locator('.session-summary__challenge-text')).toHaveText([
        "Réviser 3 cartes aujourd'hui",
        'Réussir 70% de bonnes réponses sur la journée (dès 3 cartes)',
        'Enchaîner 3 cartes vertes d\'affilée'
      ]);
      await expect(announced.locator('.session-summary__challenge-xp')).toHaveText(['+1 XP', '+1 XP', '+1 XP']);

      const player = await getStatePlayer(page);
      expect(xpEntries(player, 'challenge').map(h => h.amount)).toEqual([1, 1, 1]);
      const totalXp = player.stats.totalXP;

      // Rouvrir la page des missions ne recrédite rien
      await navigateTo(page, '/challenges');
      await expect(page.locator('.challenge--completed')).toHaveCount(3);
      await expect(page.locator('.challenges__completed')).toHaveText('3/3 complétés');
      await expect(page.locator('.challenges__xp-earned')).toHaveText('+3 XP gagnés');
      await expect(challenges(page).locator('.challenge__progress-text')).toHaveText(['Complété !', 'Complété !', 'Complété !']);
      await expect(page.locator('.navbar__challenges .navbar__challenge-count').first()).toHaveText('3/3');

      const after = await getStatePlayer(page);
      expect(xpEntries(after, 'challenge')).toHaveLength(3);
      expect(after.stats.totalXP).toBe(totalXp);
    });

    test('should not give a wrong answer credit for the accuracy challenge', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('wrong-deck', 3));
      await navigateTo(page, '/challenges');
      await navigateTo(page, '/game/wrong-deck');
      await playCards(page, 3, [1]);
      await expect(page.locator('.page--session-summary')).toBeVisible();

      // 2 bonnes réponses sur 3 : 66 % < 70 %, et la série verte est brisée (1 seule d'affilée)
      await navigateTo(page, '/challenges');
      await expect(challenges(page).nth(0)).toHaveClass(/challenge--completed/);
      await expect(challenges(page).nth(1)).not.toHaveClass(/challenge--completed/);
      await expect(challenges(page).nth(1).locator('.challenge__progress-text')).toHaveText('66% / 70%');
      await expect(challenges(page).nth(2)).not.toHaveClass(/challenge--completed/);
      await expect(challenges(page).nth(2).locator('.challenge__progress-text')).toHaveText('1/3 cartes vertes d\'affilée');
    });
  });

  test.describe('Persistence', () => {
    test('should keep daily challenges and their progress after a reload', async ({ page }) => {
      const player = await createPlayer(page);
      await createTestDeck(page, dueDeck('persist-deck', 5));
      await navigateTo(page, '/challenges');
      await navigateTo(page, '/game/persist-deck');
      await playCards(page, 2, [], 5);
      await navigateTo(page, '/challenges');
      const before = (await getStatePlayer(page)).missions.daily;

      await reopenAs(page, player);
      await navigateTo(page, '/challenges');

      await expect(challenges(page)).toHaveCount(3);
      await expect(challenges(page).locator('.challenge__progress-text')).toHaveText([
        '2/5 cartes', '2/5 cartes jouées', '2/3 cartes vertes d\'affilée'
      ]);
      const stored = (await getStoredPlayer(page)).missions.daily;
      expect(stored.day).toBe(TODAY);
      expect(stored.cardsPlayed).toBe(2);
      expect(stored.challenges.map(c => c.id)).toEqual(before.challenges.map(c => c.id));
    });

    test('should keep the weekly quests, their progress and their single XP credit after a reload', async ({ page }) => {
      const player = await createPlayer(page);
      await createTestDeck(page, dueDeck('weekly-deck', 3));
      await navigateTo(page, '/game/weekly-deck');
      await playCards(page, 3);
      await expect(page.locator('.page--session-summary')).toBeVisible();

      await reopenAs(page, player);
      await navigateTo(page, '/challenges');
      await page.locator('.challenges__tab[data-tab="weekly"]').click();

      const quests = page.locator('.challenge--weekly');
      await expect(quests).toHaveCount(5);
      // Quêtes (ordre fixe) : XP, boîte verte, jours, défis gagnés, decks
      await expect(quests.locator('.challenge__description')).toHaveText([
        'Gagner 100 XP en révisant cette semaine',
        'Faire passer 3 cartes en boîte verte',
        'Réviser 3 jours cette semaine',
        'Réussir 2 défis cette semaine (un par jour au plus)',
        'Réviser dans un deck'
      ]);
      // Un jour joué sur 3 ; un deck sur un (terminée) ; 3 cartes passées en vert (terminée)
      await expect(quests.nth(1)).toHaveClass(/challenge--completed/);
      await expect(quests.nth(2).locator('.challenge__progress-text')).toHaveText('1/3');
      await expect(quests.nth(4)).toHaveClass(/challenge--completed/);
      await expect(quests.nth(3)).not.toHaveClass(/challenge--completed/);

      const stored = await getStoredPlayer(page);
      expect(stored.missions.weekly.weekStart).toBe('2026-03-02');
      expect(stored.missions.weekly.daysPlayed).toEqual([TODAY]);
      // Chaque quête terminée a été créditée une seule fois, malgré le rechargement et la page rouverte
      const completed = stored.missions.weekly.quests.filter(q => q.completed);
      expect(completed).toHaveLength(2);
      expect(xpEntries(stored, 'quest')).toHaveLength(2);
    });
  });

  test.describe('Isolation between players', () => {
    test('should give each player their own challenges and progress', async ({ page }) => {
      const playerA = await createPlayer(page, 'Alice');
      await createTestDeck(page, dueDeck('shared-deck', 5));
      await navigateTo(page, '/challenges');
      await navigateTo(page, '/game/shared-deck');
      await playCards(page, 2, [], 5);
      await navigateTo(page, '/challenges');
      await expect(challenges(page).nth(0).locator('.challenge__progress-text')).toHaveText('2/5 cartes');

      // Joueur B : ses propres cartes à réviser, aucune progression
      const playerB = await createPlayer(page, 'Bob');
      await createTestDeck(page, dueDeck('bob-deck', 4));
      await navigateTo(page, '/challenges');
      await expect(challenges(page)).toHaveCount(3);
      await expect(challenges(page).locator('.challenge__progress-text')).toHaveText([
        '0/4 cartes', '0/4 cartes jouées', '0/3 cartes vertes d\'affilée'
      ]);
      await expect(page.locator('.challenge--completed')).toHaveCount(0);

      // Retour au joueur A : sa progression est intacte, celle de B ne l'a pas touchée
      await reopenAs(page, playerA);
      await navigateTo(page, '/challenges');
      await expect(challenges(page).nth(0).locator('.challenge__progress-text')).toHaveText('2/5 cartes');

      const storedA = await getStoredPlayerById(page, playerA.id);
      const storedB = await getStoredPlayerById(page, playerB.id);
      expect(storedA.missions.daily.cardsPlayed).toBe(2);
      expect(storedB.missions.daily.cardsPlayed).toBe(0);
      const idsA = storedA.missions.daily.challenges.map(c => c.id);
      expect(storedB.missions.daily.challenges.every(c => c.target !== undefined)).toBe(true);
      expect(idsA).toHaveLength(3);
      expect(storedB.missions.weekly.daysPlayed).toEqual([]);
      expect(storedA.missions.weekly.daysPlayed).toEqual([TODAY]);
    });
  });

  test.describe('Session summary', () => {
    test('should show what the session changed and when to review next', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('summary-deck', 3));
      await navigateTo(page, '/game/summary-deck');
      await playCards(page, 3);

      await expect(page.locator('.session-summary__learning-title')).toHaveText('🧠 Ce que cette séance a changé');
      await expect(page.locator('.session-summary__learning-item--green')).toHaveText('En boîte verte : 3');
      await expect(page.locator('.session-summary__learning-item:not(.session-summary__learning-item--green)')).toHaveCount(0);
      // Tout est en repos : le bilan indique quand revenir (repos initial de 3 jours doublé par des réponses rapides : mardi 10 mars)
      await expect(page.locator('.session-summary__complete-text')).toHaveText(
        'Rien à réviser avant le mardi 10 mars, bien joué !'
      );
    });

    test('should list the cards to review and not claim there is nothing left to review', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, dueDeck('review-deck', 3));
      await navigateTo(page, '/game/review-deck');
      await playCards(page, 3, [1]);

      await expect(page.locator('.session-summary__learning-item--green')).toHaveText('En boîte verte : 2');
      await expect(page.locator('.session-summary__learning-item:not(.session-summary__learning-item--green)')).toHaveText('À revoir : 1');
      // La carte ratée reste à revoir : pas de « rien à réviser »
      await expect(page.locator('.session-summary__complete')).toHaveCount(0);
      await expect(page.locator('.session-summary__replay')).toBeVisible();
    });

    test('should name tomorrow when the next card to come back rests until tomorrow', async ({ page }) => {
      await createPlayer(page);
      await createTestDeck(page, {
        id: 'tomorrow-deck',
        cards: [
          dueCard('v1', 1),
          { ...freshCard('v2', 2), box: 'green', timesPlayed: 4, timesCorrect: 4, restDays: 1, restUntil: '2026-03-05' }
        ]
      });
      await navigateTo(page, '/game/tomorrow-deck');
      await expect(page.locator('.game__card-question')).toHaveText('1 + 1 = ?');
      await answerCard(page, '2');
      await page.locator('#next-btn').click();
      await expect(page.locator('.page--session-summary')).toBeVisible();

      // La carte jouée part en repos (6 jours), l autre sort demain : prochaine révision demain
      await expect(page.locator('.session-summary__complete-text')).toHaveText('Rien à réviser avant demain, bien joué !');
    });

    for (const { name, wrong, celebrated } of [
      { name: 'should celebrate a session with 80% of correct answers', wrong: [4], celebrated: 1 },
      { name: 'should not launch the confetti below 80% of correct answers', wrong: [3, 4], celebrated: 0 }
    ]) {
      test(name, async ({ page }) => {
        await createPlayer(page);
        await createTestDeck(page, dueDeck('confetti-deck', 5));
        await page.evaluate(() => {
          window.__confettiCalls = 0;
          Effects.confetti.celebrateVictory = () => { window.__confettiCalls++; };
        });
        await navigateTo(page, '/game/confetti-deck');
        await playCards(page, 5, wrong);
        await expect(page.locator('.page--session-summary')).toBeVisible();

        // Les confettis partent après un court délai : on avance l'horloge de la page
        await page.clock.runFor(1000);
        expect(await page.evaluate(() => window.__confettiCalls)).toBe(celebrated);
      });
    }
  });
});
