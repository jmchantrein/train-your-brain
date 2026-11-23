/**
 * E2E - Jeu et système Leitner
 *
 * Parties sur des decks personnalisés créés par createTestDeck (API de l'application).
 * Les decks à ordre déterministe sont séquentiels (settings.sequential) ou ne comptent qu'une carte.
 */

const { test, expect } = require('@playwright/test');
const {
  navigateToApp,
  createPlayer,
  createTestDeck,
  navigateTo,
  clearStorage,
  getDeck,
  getStatePlayer,
  answerCard
} = require('./helpers.cjs');

const num = (id, question, answer, extra = {}) => ({ id, question, answer: String(answer), type: 'numeric', ...extra });

/** Progression enregistrée d'une carte (boîte, repos, compteurs), lue dans le stockage du joueur. */
const progressOf = (page, deckId, cardId) =>
  page.evaluate(([d, c]) => (Storage.loadDeckProgress(d) || []).find(p => p.id === c) || null, [deckId, cardId]);

/** Date locale du jour au format AAAA-MM-JJ (comme PageUtils.getToday). */
const today = (page) => page.evaluate(() => PageUtils.getToday());

test.describe('Game', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await clearStorage(page);
    await createPlayer(page);
  });

  test.describe('Starting a Game', () => {
    test('should start a game from the play button of a deck in the list', async ({ page }) => {
      await createTestDeck(page);
      await navigateTo(page, '/explore');

      const row = page.locator('.deck-table__row[data-deck-id="test-deck"]');
      await expect(row).toContainText('Test Deck');
      await row.locator('.deck-table__btn--play').click();

      await expect(page).toHaveURL(/#\/game\/test-deck$/);
      await expect(page.locator('.page--game')).toBeVisible();
      await expect(page.locator('.game__card-question')).toBeVisible();
    });

    test('should start a game when clicking on a deck row', async ({ page }) => {
      await createTestDeck(page);
      await navigateTo(page, '/explore');

      await page.locator('.deck-table__row[data-deck-id="test-deck"] .deck-table__name').click();

      // /deck/<id> redirige vers /game/<id>
      await expect(page).toHaveURL(/#\/game\/test-deck$/);
      await expect(page.locator('.game__card-question')).toBeVisible();
    });

    test('should display the first card with its answer area and the piles', async ({ page }) => {
      await createTestDeck(page, {
        id: 'first-card',
        settings: { sequential: true },
        cards: [num('n1', '1 + 1 = ?', 2), num('n2', '2 + 2 = ?', 4), num('n3', '3 + 3 = ?', 6)]
      });
      await navigateTo(page, '/game/first-card');

      await expect(page.locator('.game__card-question')).toHaveText('1 + 1 = ?');
      await expect(page.locator('#answer-input')).toBeVisible();
      await expect(page.locator('#submit-btn')).toBeVisible();
      await expect(page.locator('.game__progress-current')).toHaveText('1');
      await expect(page.locator('.game__progress-total')).toHaveText('3');
      // Pioche : 3 cartes à jouer ; défausses violette / orange / verte vides
      await expect(page.locator('.game__draw-pile .game__pile-count')).toHaveText('3');
      for (const pile of ['purple', 'orange', 'green']) {
        await expect(page.locator(`.game__pile--${pile} .game__pile-count`)).toHaveText('0');
      }
    });

    test('should go back to the home page for an unknown deck', async ({ page }) => {
      await navigateTo(page, '/game/does-not-exist');

      await expect(page).toHaveURL(/#\/home$/);
      await expect(page.locator('.page--home')).toBeVisible();
    });

    test('should go back to the home page when every card is resting', async ({ page }) => {
      const tomorrow = await page.evaluate(() => {
        const d = new Date(); d.setDate(d.getDate() + 3);
        return d.toISOString().slice(0, 10);
      });
      await createTestDeck(page, {
        id: 'resting-deck',
        cards: [num('r1', '1 + 1 = ?', 2, { box: 'green', restUntil: tomorrow, latencyThreshold: 3 })]
      });

      await navigateTo(page, '/game/resting-deck');

      await expect(page).toHaveURL(/#\/home$/);
      await expect(page.locator('.page--game')).toHaveCount(0);
    });

    test('should ask for confirmation before quitting a session', async ({ page }) => {
      await createTestDeck(page, { id: 'quit-deck', cards: [num('q1', '1 + 1 = ?', 2)] });
      await navigateTo(page, '/home');
      await expect(page.locator('.page--home')).toBeVisible();
      await navigateTo(page, '/game/quit-deck');
      await expect(page.locator('.game__card-question')).toBeVisible();

      // Refus : on reste dans la partie
      let message = null;
      page.once('dialog', async (dialog) => { message = dialog.message(); await dialog.dismiss(); });
      await page.locator('.game__back').click();
      await expect.poll(() => message).toBe('Veux-tu vraiment quitter cette session ?');
      await expect(page.locator('.game__card-question')).toBeVisible();

      // Acceptation : retour à la page précédente
      page.once('dialog', (dialog) => dialog.accept());
      await page.locator('.game__back').click();
      await expect(page).toHaveURL(/#\/home$/);
      await expect(page.locator('.page--home')).toBeVisible();
    });
  });

  test.describe('Answering Cards', () => {
    test('should accept a correct answer for a numeric card', async ({ page }) => {
      await createTestDeck(page, { id: 'single-numeric', name: 'Single Numeric', cards: [num('n1', '2 + 2 = ?', 4)] });
      await navigateTo(page, '/game/single-numeric');

      await expect(page.locator('.game__card-question')).toHaveText('2 + 2 = ?');
      await answerCard(page, '4');

      // Face verso en boîte verte (première réponse juste), +3 XP
      await expect(page.locator('.game__card-content--back.game__card-content--green')).toBeVisible();
      await expect(page.locator('.game__card-result-icon')).toHaveText('💚');
      await expect(page.locator('.game__card-answer-value')).toHaveText('4');
      await expect(page.locator('.game__card-xp')).toHaveText('+3 XP');
    });

    test('should reject an incorrect answer and show the right one', async ({ page }) => {
      await createTestDeck(page, { id: 'single-numeric', name: 'Single Numeric', cards: [num('n1', '2 + 2 = ?', 4)] });
      await navigateTo(page, '/game/single-numeric');

      await answerCard(page, '999');

      await expect(page.locator('.game__card-content--back.game__card-content--purple')).toBeVisible();
      await expect(page.locator('.game__card-result-icon')).toHaveText('💜');
      await expect(page.locator('.game__card-answer-value')).toHaveText('4');
      await expect(page.locator('.game__card-xp')).toHaveText('+1 XP');
      await expect(page.locator('.game__card-content--green')).toHaveCount(0);
    });

    test('should submit with the Enter key', async ({ page }) => {
      await createTestDeck(page, { id: 'enter-deck', cards: [num('n1', '5 + 5 = ?', 10)] });
      await navigateTo(page, '/game/enter-deck');

      await page.locator('#answer-input').fill('10');
      await page.locator('#answer-input').press('Enter');

      await expect(page.locator('.game__card-content--back.game__card-content--green')).toBeVisible();
    });

    test('should not validate an empty answer', async ({ page }) => {
      await createTestDeck(page, { id: 'empty-deck', cards: [num('n1', '5 + 5 = ?', 10)] });
      await navigateTo(page, '/game/empty-deck');

      await page.locator('#submit-btn').click();

      await expect(page.locator('#answer-input')).toHaveClass(/shake/);
      await expect(page.locator('.game__card-content--back')).toHaveCount(0);
      await expect(page.locator('.game__card-question')).toBeVisible();
    });

    test('should count "I do not know" as a wrong answer', async ({ page }) => {
      await createTestDeck(page, { id: 'skip-deck', cards: [num('n1', '7 + 1 = ?', 8)] });
      await navigateTo(page, '/game/skip-deck');

      await page.locator('#skip-btn').click();

      await expect(page.locator('.game__card-content--back.game__card-content--purple')).toBeVisible();
      await expect(page.locator('.game__card-answer-value')).toHaveText('8');
    });

    test('should handle true/false cards', async ({ page }) => {
      await createTestDeck(page, {
        id: 'tf-deck',
        name: 'True False Deck',
        settings: { sequential: true },
        cards: [
          { id: 'tf_1', question: 'Le ciel est bleu.', answer: true, type: 'truefalse' },
          { id: 'tf_2', question: 'Un carré a 5 côtés.', answer: false, type: 'truefalse' },
          { id: 'tf_3', question: 'Paris est en Italie.', answer: false, type: 'truefalse' }
        ]
      });
      await navigateTo(page, '/game/tf-deck');

      await expect(page.locator('.game-card__tf-text')).toHaveText(['Vrai', 'Faux']);

      // Bonne réponse (vrai) -> verte
      await answerCard(page, true, { isTrueFalse: true });
      await expect(page.locator('.game__card-content--green')).toBeVisible();
      await page.locator('#next-btn').click();

      // Bonne réponse (faux) -> verte
      await expect(page.locator('.game__card-question')).toHaveText('Un carré a 5 côtés.');
      await answerCard(page, false, { isTrueFalse: true });
      await expect(page.locator('.game__card-content--green')).toBeVisible();
      await page.locator('#next-btn').click();

      // Mauvaise réponse -> violette
      await expect(page.locator('.game__card-question')).toHaveText('Paris est en Italie.');
      await answerCard(page, true, { isTrueFalse: true });
      await expect(page.locator('.game__card-content--purple')).toBeVisible();
    });

    test('should handle multiple choice cards', async ({ page }) => {
      await createTestDeck(page, {
        id: 'mcq-deck',
        settings: { sequential: true },
        cards: [
          {
            id: 'mcq_1',
            question: 'Capitale de la France ?',
            type: 'mcq',
            single: true,
            answer: 'B',
            choices: [{ id: 'A', text: 'Lyon' }, { id: 'B', text: 'Paris' }, { id: 'C', text: 'Nice' }]
          },
          {
            id: 'mcq_2',
            question: 'Capitale de l\'Italie ?',
            type: 'mcq',
            single: true,
            answer: 'A',
            choices: [{ id: 'A', text: 'Rome' }, { id: 'B', text: 'Milan' }]
          }
        ]
      });
      await navigateTo(page, '/game/mcq-deck');

      await expect(page.locator('[data-choice-id]')).toHaveCount(3);
      await answerCard(page, 'B', { isMCQ: true });
      await expect(page.locator('.game__card-content--green')).toBeVisible();
      await page.locator('#next-btn').click();

      await expect(page.locator('.game__card-question')).toHaveText("Capitale de l'Italie ?");
      await answerCard(page, 'B', { isMCQ: true });
      await expect(page.locator('.game__card-content--purple')).toBeVisible();
    });

    test('should advance to the next card and end on the summary', async ({ page }) => {
      await createTestDeck(page, {
        id: 'advance-test-deck',
        name: 'Advance Test Deck',
        settings: { sequential: true },
        cards: [num('adv_c1', '1 + 1 = ?', 2), num('adv_c2', '3 + 3 = ?', 6)]
      });
      await navigateTo(page, '/game/advance-test-deck');

      const question = page.locator('.game__card-question');
      const progress = page.locator('.game__progress-current');

      await expect(question).toHaveText('1 + 1 = ?');
      await expect(progress).toHaveText('1');
      await answerCard(page, '2');

      // L'animation de rangement dure ~0,6 s avant d'afficher la carte suivante
      await page.locator('#next-btn').click();
      await expect(question).toHaveText('3 + 3 = ?');
      await expect(progress).toHaveText('2');
      await expect(page.locator('#answer-input')).toHaveValue('');

      await answerCard(page, '6');
      await page.locator('#next-btn').click();
      await expect(page).toHaveURL(/#\/session-summary$/);
      await expect(page.locator('.page--session-summary')).toBeVisible();
    });
  });

  test.describe('Alternative Answers', () => {
    test('should accept the main answer and every alternative, and reject others', async ({ page }) => {
      await createTestDeck(page, {
        id: 'alt-deck',
        name: 'Alt Answers',
        settings: { sequential: true },
        cards: [
          { id: 'alt_1', question: 'Capitale de la France ?', answer: 'Paris', alternatives: ['Ville Lumière', 'Paname'] },
          { id: 'alt_2', question: 'Capitale de la France (bis) ?', answer: 'Paris', alternatives: ['Ville Lumière', 'Paname'] },
          { id: 'alt_3', question: 'Capitale de la France (ter) ?', answer: 'Paris', alternatives: ['Ville Lumière', 'Paname'] }
        ]
      });
      await navigateTo(page, '/game/alt-deck');

      // Une alternative (casse et accents normalisés)
      await answerCard(page, 'ville lumiere');
      await expect(page.locator('.game__card-content--green')).toBeVisible();
      await page.locator('#next-btn').click();

      // Une autre alternative
      await expect(page.locator('.game__card-question')).toHaveText('Capitale de la France (bis) ?');
      await answerCard(page, 'PANAME');
      await expect(page.locator('.game__card-content--green')).toBeVisible();
      await page.locator('#next-btn').click();

      // Une réponse qui n'est ni la réponse ni une alternative
      await expect(page.locator('.game__card-question')).toHaveText('Capitale de la France (ter) ?');
      await answerCard(page, 'Lyon');
      await expect(page.locator('.game__card-content--purple')).toBeVisible();
      await expect(page.locator('.game__card-answer-value')).toHaveText('Paris');
    });
  });

  test.describe('Leitner System', () => {
    test('should move a never played card to green on the first correct answer', async ({ page }) => {
      await createTestDeck(page, { id: 'leitner-new', cards: [num('c1', '2 + 2 = ?', 4)] });
      await navigateTo(page, '/game/leitner-new');

      await answerCard(page, '4');
      await expect(page.locator('.game__card-content--green')).toBeVisible();
      await page.locator('#next-btn').click();
      await expect(page).toHaveURL(/#\/session-summary$/);

      // La carte est rangée dans la pile verte, avec une date de repos dans le futur
      await expect.poll(() => progressOf(page, 'leitner-new', 'c1').then(p => p && p.box)).toBe('green');
      const progress = await progressOf(page, 'leitner-new', 'c1');
      expect(progress.timesPlayed).toBe(1);
      expect(progress.timesCorrect).toBe(1);
      expect(progress.restUntil > (await today(page))).toBe(true);
      expect((await getDeck(page, 'leitner-new')).cards[0].box).toBe('green');
    });

    test('should move a never played card to purple on a wrong answer', async ({ page }) => {
      await createTestDeck(page, { id: 'leitner-wrong', cards: [num('c1', '2 + 2 = ?', 4)] });
      await navigateTo(page, '/game/leitner-wrong');

      await answerCard(page, '999');
      await page.locator('#next-btn').click();
      await expect(page).toHaveURL(/#\/session-summary$/);

      await expect.poll(() => progressOf(page, 'leitner-wrong', 'c1').then(p => p && p.box)).toBe('purple');
      const progress = await progressOf(page, 'leitner-wrong', 'c1');
      expect(progress.timesPlayed).toBe(1);
      expect(progress.timesCorrect).toBe(0);
      expect(progress.restUntil).toBeNull();
    });

    test('should move a green card back to purple on a wrong answer', async ({ page }) => {
      await createTestDeck(page, {
        id: 'leitner-green',
        cards: [num('c1', '5 + 5 = ?', 10, { box: 'green', latencyThreshold: 3 })]
      });
      await navigateTo(page, '/game/leitner-green');

      await answerCard(page, '999');
      await page.locator('#next-btn').click();
      await expect(page).toHaveURL(/#\/session-summary$/);

      await expect.poll(() => progressOf(page, 'leitner-green', 'c1').then(p => p && p.box)).toBe('purple');
    });

    test('should move a purple card to green on a fast correct answer', async ({ page }) => {
      await createTestDeck(page, {
        id: 'leitner-fast',
        cards: [num('c1', '5 + 5 = ?', 10, { box: 'purple', latencyThreshold: 60, timesPlayed: 1 })]
      });
      await navigateTo(page, '/game/leitner-fast');

      await answerCard(page, '10');
      await expect(page.locator('.game__card-content--green')).toBeVisible();
      await page.locator('#next-btn').click();
      await expect(page).toHaveURL(/#\/session-summary$/);

      await expect.poll(() => progressOf(page, 'leitner-fast', 'c1').then(p => p && p.box)).toBe('green');
    });

    test('should move a purple card to orange on a slow correct answer', async ({ page }) => {
      await page.clock.install();
      await createTestDeck(page, {
        id: 'leitner-slow',
        cards: [num('c1', '5 + 5 = ?', 10, { box: 'purple', latencyThreshold: 1, timesPlayed: 1 })]
      });
      await navigateTo(page, '/game/leitner-slow');
      await expect(page.locator('.game__card-question')).toBeVisible();

      // Plus lent que le seuil de latence de la carte (1 s)
      await page.clock.fastForward(5000);
      await answerCard(page, '10');

      await expect(page.locator('.game__card-content--orange')).toBeVisible();
      await expect(page.locator('.game__card-result-icon')).toHaveText('🧡');
      await expect(page.locator('.game__card-xp')).toHaveText('+2 XP');
      await page.locator('#next-btn').click();
      await expect(page).toHaveURL(/#\/session-summary$/);
      await expect.poll(() => progressOf(page, 'leitner-slow', 'c1').then(p => p && p.box)).toBe('orange');
    });

    test('should show the piles filling up as cards are answered', async ({ page }) => {
      await createTestDeck(page, {
        id: 'mixed-deck',
        name: 'Mixed Deck',
        settings: { sequential: true },
        cards: [
          num('c1', '1 + 1 = ?', 2),
          num('c2', '2 + 2 = ?', 4),
          num('c3', '3 + 3 = ?', 6)
        ]
      });
      await navigateTo(page, '/game/mixed-deck');
      const count = (pile) => page.locator(`.game__pile--${pile} .game__pile-count`);
      const draw = page.locator('.game__draw-pile .game__pile-count');

      await answerCard(page, '2');            // verte
      await page.locator('#next-btn').click();
      await expect(page.locator('.game__card-question')).toHaveText('2 + 2 = ?');
      await expect(count('green')).toHaveText('1');
      await expect(draw).toHaveText('2');

      await answerCard(page, '999');          // violette
      await page.locator('#next-btn').click();
      await expect(page.locator('.game__card-question')).toHaveText('3 + 3 = ?');
      await expect(count('green')).toHaveText('1');
      await expect(count('purple')).toHaveText('1');
      await expect(count('orange')).toHaveText('0');
      await expect(draw).toHaveText('1');
    });

    test('should play never played, purple and orange cards but not resting green ones', async ({ page }) => {
      const later = await page.evaluate(() => {
        const d = new Date(); d.setDate(d.getDate() + 5);
        return d.toISOString().slice(0, 10);
      });
      await createTestDeck(page, {
        id: 'boxes-deck',
        cards: [
          num('c_new', '1 + 0 = ?', 1),
          num('c_purple', '2 + 0 = ?', 2, { box: 'purple', latencyThreshold: 3 }),
          num('c_orange', '3 + 0 = ?', 3, { box: 'orange', latencyThreshold: 3 }),
          num('c_green', '4 + 0 = ?', 4, { box: 'green', restUntil: later, latencyThreshold: 3 })
        ]
      });
      await navigateTo(page, '/game/boxes-deck');

      // 3 cartes jouables sur 4 : la carte verte au repos est exclue de la pioche
      await expect(page.locator('.game__progress-total')).toHaveText('3');
      await expect(page.locator('.game__draw-pile .game__pile-count')).toHaveText('3');
    });
  });

  test.describe('Session Summary', () => {
    test('should show the summary after completing all cards', async ({ page }) => {
      await createTestDeck(page, { id: 'single-card', name: 'Single Card Deck', cards: [num('only_card', '1 + 1 = ?', 2)] });
      await navigateTo(page, '/game/single-card');

      await answerCard(page, '2');
      await page.locator('#next-btn').click();

      await expect(page).toHaveURL(/#\/session-summary$/);
      await expect(page.locator('.session-summary__title')).toHaveText('🎉 Session terminée !');
      const stats = page.locator('.session-summary__stat');
      await expect(stats.nth(0).locator('.session-summary__stat-value')).toHaveText('1');
      await expect(stats.nth(0).locator('.session-summary__stat-label')).toHaveText('Cartes');
      await expect(stats.nth(1).locator('.session-summary__stat-value')).toHaveText('100%');
      await expect(stats.nth(1).locator('.session-summary__stat-label')).toHaveText('Précision');
    });

    test('should display the XP earned in the session and add it to the player', async ({ page }) => {
      await createTestDeck(page, {
        id: 'xp-test',
        name: 'XP Test',
        settings: { sequential: true },
        cards: [num('x1', '3 + 3 = ?', 6), num('x2', '1 + 1 = ?', 2)]
      });
      await navigateTo(page, '/game/xp-test');

      await answerCard(page, '6');            // verte : +3 XP
      await page.locator('#next-btn').click();
      await expect(page.locator('.game__card-question')).toHaveText('1 + 1 = ?');
      await answerCard(page, '999');          // violette : +1 XP
      await page.locator('#next-btn').click();

      await expect(page.locator('.page--session-summary')).toBeVisible();
      const stats = page.locator('.session-summary__stat');
      await expect(stats.nth(0).locator('.session-summary__stat-value')).toHaveText('2');
      await expect(stats.nth(1).locator('.session-summary__stat-value')).toHaveText('50%');
      await expect(stats.nth(2).locator('.session-summary__stat-label')).toHaveText('XP');
      await expect(stats.nth(2).locator('.session-summary__stat-value')).toHaveText('4');

      const player = await getStatePlayer(page);
      expect(player.stats.totalCardsPlayed).toBe(2);
      expect(player.stats.totalSessions).toBe(1);
      expect(player.stats.xpHistory.find(h => h.source === 'session').amount).toBe(4);
    });

    test('should replay only the cards that were not mastered', async ({ page }) => {
      await createTestDeck(page, {
        id: 'replay-deck',
        settings: { sequential: true },
        cards: [num('p1', '1 + 1 = ?', 2), num('p2', '2 + 2 = ?', 4)]
      });
      await navigateTo(page, '/game/replay-deck');
      await answerCard(page, '2');
      await page.locator('#next-btn').click();
      await expect(page.locator('.game__card-question')).toHaveText('2 + 2 = ?');
      await answerCard(page, '999');
      await page.locator('#next-btn').click();

      await expect(page.locator('.session-summary__replay')).toHaveText('Rejouer (1)');
      await page.locator('.session-summary__replay').click();

      await expect(page).toHaveURL(/#\/game\/replay-deck$/);
      await expect(page.locator('.game__card-question')).toHaveText('2 + 2 = ?');
      await expect(page.locator('.game__progress-total')).toHaveText('1');
    });

    test('should go back to the home page from the summary', async ({ page }) => {
      await createTestDeck(page, { id: 'home-deck', cards: [num('h1', '1 + 1 = ?', 2)] });
      await navigateTo(page, '/game/home-deck');
      await answerCard(page, '2');
      await page.locator('#next-btn').click();
      await expect(page.locator('.page--session-summary')).toBeVisible();

      await page.locator('.session-summary__home').click();

      await expect(page).toHaveURL(/#\/home$/);
      await expect(page.locator('.page--home')).toBeVisible();
    });
  });

  test.describe('Card Media', () => {
    // Les SVG fournis par un deck sont rendus via <img src="data:image/svg+xml,...">
    // (jamais injectés en ligne : les scripts et gestionnaires d'événements n'y sont pas exécutés).
    // NB : pour s'afficher comme image, le SVG doit déclarer xmlns (comme tous les SVG des decks du dépôt).
    const svgCard = (data) => ({
      id: 'img_card',
      question: 'What shape is this?',
      answer: 'circle',
      media: { type: 'image', format: 'svg', data }
    });

    test('should display images in cards', async ({ page }) => {
      await createTestDeck(page, {
        id: 'image-deck',
        name: 'Image Deck',
        cards: [svgCard('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="blue"/></svg>')]
      });

      await navigateTo(page, '/game/image-deck');
      await expect(page.locator('.game__card-question')).toHaveText('What shape is this?');

      // Rendu en <img> data-URI, pas en <svg> inline
      const img = page.locator('.game__card-image--svg img');
      await expect(img).toBeVisible();
      await expect(img).toHaveAttribute('src', /^data:image\/svg\+xml/);
      await expect(page.locator('.game__card-image svg')).toHaveCount(0);

      // L'image est réellement décodée et a une taille à l'écran
      const info = await img.evaluate(el => ({
        complete: el.complete,
        naturalWidth: el.naturalWidth,
        naturalHeight: el.naturalHeight,
        width: el.getBoundingClientRect().width,
        height: el.getBoundingClientRect().height
      }));
      expect(info.complete).toBe(true);
      expect(info.naturalWidth).toBeGreaterThan(0);
      expect(info.naturalHeight).toBeGreaterThan(0);
      expect(info.width).toBeGreaterThan(0);
      expect(info.height).toBeGreaterThan(0);
    });

    test('should not execute scripts embedded in SVG media', async ({ page }) => {
      await createTestDeck(page, {
        id: 'evil-svg-deck',
        name: 'Evil SVG Deck',
        cards: [svgCard('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" onload="window.__svgPwned=1"><script>window.__svgPwned=2</script><circle cx="50" cy="50" r="40"/></svg>')]
      });

      await navigateTo(page, '/game/evil-svg-deck');
      const img = page.locator('.game__card-image--svg img');
      await expect(img).toBeVisible();
      await expect.poll(() => img.evaluate(el => el.naturalWidth)).toBeGreaterThan(0);

      expect(await page.evaluate(() => window.__svgPwned)).toBeUndefined();
      await expect(page.locator('.game__card-image script')).toHaveCount(0);
    });
  });
});
