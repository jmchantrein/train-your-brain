/**
 * E2E - Navigation, routeur par hash et écran de profils
 *
 * Routes réelles : voir Router.register dans src/ui/app.js.
 */

const { test, expect } = require('@playwright/test');
const {
  navigateToApp,
  createPlayer,
  createTestDeck,
  navigateTo,
  clearStorage
} = require('./helpers.cjs');

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await clearStorage(page);
    await page.reload();
    await expect(page.locator('#app')).toBeVisible();
  });

  test.describe('First Launch', () => {
    test('should show the profile creation form on first visit', async ({ page }) => {
      await expect(page.locator('.page--splash')).toBeVisible();
      await expect(page.locator('.splash__title')).toContainText('Train Your Brain');
      await expect(page.locator('label[for="player-name"]')).toHaveText('Quel nom veux-tu utiliser ?');
      await expect(page.locator('#player-name')).toBeVisible();
      await expect(page.locator('.splash__start')).toBeVisible();
      // Aucun profil existant : ni carte de joueur, ni bouton retour
      await expect(page.locator('.splash__player-card')).toHaveCount(0);
      await expect(page.locator('.splash__back-btn')).toHaveCount(0);
    });

    test('should refuse an empty player name', async ({ page }) => {
      let message = null;
      page.once('dialog', async (dialog) => { message = dialog.message(); await dialog.accept(); });

      await page.locator('.splash__start').click();

      await expect.poll(() => message).toBe('Saisis un nom pour continuer');
      await expect(page.locator('.page--splash')).toBeVisible();
      expect(await page.evaluate(() => Storage.getPlayersList())).toEqual([]);
    });

    test('should create a player and open the home page with the tutorial', async ({ page }) => {
      await page.locator('#player-name').fill('Alice');
      await page.locator('.splash__start').click();

      await expect(page).toHaveURL(/#\/home$/);
      await expect(page.locator('.page--home')).toBeVisible();
      await expect(page.locator('.player-bar__name')).toHaveText('Alice');
      // Premier lancement : le tutoriel s'ouvre sur l'accueil
      await expect(page.locator('.tutorial-overlay')).toBeVisible();
      expect(await page.evaluate(() => Storage.getPlayersList().map(p => p.name))).toEqual(['Alice']);
    });

    test('should also create the player with the Enter key', async ({ page }) => {
      await page.locator('#player-name').fill('Bob');
      await page.locator('#player-name').press('Enter');

      await expect(page).toHaveURL(/#\/home$/);
      await expect(page.locator('.player-bar__name')).toHaveText('Bob');
    });

    test('should send a visitor without profile back to the profile screen', async ({ page }) => {
      await navigateTo(page, '/settings');

      await expect(page).toHaveURL(/#\/$/);
      await expect(page.locator('.page--splash')).toBeVisible();
      await expect(page.locator('.page--settings')).toHaveCount(0);
    });

    test('should let an existing player pick their profile', async ({ page }) => {
      await createPlayer(page);
      await page.goto(page.url().split('#')[0]);

      await expect(page.locator('.splash__section-title')).toHaveText('Choisir un profil');
      await expect(page.locator('.splash__player-card')).toHaveCount(1);
      await expect(page.locator('.splash__player-name')).toHaveText('TestPlayer');
      await expect(page.locator('.splash__player-level')).toContainText('Niveau 1');
      await expect(page.locator('.splash__new-player')).toBeVisible();

      await page.locator('.splash__player-card').click();
      await expect(page).toHaveURL(/#\/home$/);
      await expect(page.locator('.player-bar__name')).toHaveText('TestPlayer');
    });

    test('should add a second player from the profile screen', async ({ page }) => {
      await createPlayer(page);
      await page.goto(page.url().split('#')[0]);

      await page.locator('.splash__new-player').click();
      await expect(page.locator('#player-name')).toBeVisible();
      // Avec un profil existant, le formulaire propose de revenir à la liste
      await page.locator('.splash__back-btn').click();
      await expect(page.locator('.splash__player-card')).toHaveCount(1);

      await page.locator('.splash__new-player').click();
      await page.locator('#player-name').fill('Zoé');
      await page.locator('.splash__start').click();

      await expect(page.locator('.player-bar__name')).toHaveText('Zoé');
      expect(await page.evaluate(() => Storage.getPlayersList().map(p => p.name).sort())).toEqual(['TestPlayer', 'Zoé']);
    });
  });

  test.describe('Main Navigation', () => {
    test.beforeEach(async ({ page }) => {
      await createPlayer(page);
    });

    test('should display the home page', async ({ page }) => {
      await expect(page).toHaveURL(/#\/home$/);
      await expect(page.locator('h1.sr-only')).toHaveText('Accueil');
      await expect(page.locator('.home__section-title').first()).toHaveText('📚 Decks à réviser');
      // Nouveau joueur : aucun deck déjà joué, l'accueil le dit
      await expect(page.locator('#playable-decks .deck-table__empty')).toHaveText("Aucune carte à réviser aujourd'hui ! 🎉");
      await expect(page.locator('#playable-decks .deck-table__row')).toHaveCount(0);
    });

    test('should list on the home page a deck that has cards to review', async ({ page }) => {
      await createTestDeck(page, {
        id: 'review-deck',
        name: 'Deck à réviser',
        cards: [
          { id: 'r1', question: 'Q1', answer: 'A1', box: 'purple' },
          { id: 'r2', question: 'Q2', answer: 'A2' }
        ]
      });
      await navigateTo(page, '/explore');
      await navigateTo(page, '/home');

      const row = page.locator('#playable-decks .deck-table__row[data-deck-id="review-deck"]');
      await expect(row).toBeVisible();
      await expect(row).toContainText('Deck à réviser');
      await expect(page.locator('#playable-decks .deck-table__empty')).toHaveCount(0);

      // Le bouton « Jouer » de la ligne lance la partie
      await row.locator('.deck-table__btn--play').click();
      await expect(page).toHaveURL(/#\/game\/review-deck$/);
    });

    test('should show the navigation bar with the five entries and the active page', async ({ page }) => {
      const items = page.locator('.navbar__item');
      await expect(items).toHaveCount(5);
      expect(await items.evaluateAll(els => els.map(e => e.getAttribute('href')))).toEqual([
        '#/home', '#/explore', '#/deck-hub', '#/stats', '#/settings'
      ]);
      await expect(page.locator('.navbar__item--active')).toHaveCount(1);
      await expect(page.locator('.navbar a[href="#/home"]')).toHaveAttribute('aria-current', 'page');
      await expect(page.locator('.navbar__item--create')).toHaveAttribute('href', '#/deck-hub');
    });

    for (const [href, pageClass, title] of [
      ['#/explore', '.page--explore', 'Explorer'],
      ['#/deck-hub', '.page--deck-hub', 'Créer & Gérer'],
      ['#/stats', '.page--stats', 'Stats'],
      ['#/settings', '.page--settings', 'Paramètres']
    ]) {
      test(`should navigate to ${href} from the navigation bar`, async ({ page }) => {
        await page.locator(`.navbar a[href="${href}"]`).click();

        await expect(page).toHaveURL(new RegExp(`${href}$`));
        await expect(page.locator(pageClass)).toBeVisible();
        await expect(page.locator('.navbar__item--active')).toHaveAttribute('href', href);
        await expect(page).toHaveTitle(`${title} - Train Your Brain`);

        // ... et revenir à l'accueil
        await page.locator('.navbar a[href="#/home"]').click();
        await expect(page.locator('.page--home')).toBeVisible();
      });
    }

    test('should navigate to the deck list with the "view all" link', async ({ page }) => {
      const viewAll = page.locator('a.home__view-all');
      await expect(viewAll).toBeVisible();
      await expect(viewAll).toHaveAttribute('href', '#/explore');
      await viewAll.click();

      await expect(page).toHaveURL(/#\/explore$/);
      await expect(page.locator('.page--explore')).toBeVisible();
    });

    test('should open the badges page from the badges sidebar', async ({ page }) => {
      // Les badges ne sont pas dans la barre de navigation : la sidebar des badges
      // (cachée hors écran à gauche) apparaît quand la souris touche le bord gauche.
      const sidebar = page.locator('.badges-sidebar');
      await expect(sidebar).not.toHaveClass(/badges-sidebar--visible/);

      await page.mouse.move(300, 300);
      await page.mouse.move(2, 300);
      await expect(sidebar).toHaveClass(/badges-sidebar--visible/);

      const badgesLink = sidebar.locator('a.badges-sidebar__link');
      await expect(badgesLink).toHaveAttribute('href', '#/badges');
      await badgesLink.click();

      await expect(page).toHaveURL(/#\/badges$/);
      await expect(page.locator('.page--badges')).toBeVisible();
    });

    test('should reach the settings from the player menu', async ({ page }) => {
      await page.locator('#player-menu-trigger').click();
      await expect(page.locator('#player-menu')).toHaveAttribute('aria-hidden', 'false');

      await page.locator('#player-menu a[href="#/settings"]').click();

      await expect(page).toHaveURL(/#\/settings$/);
      await expect(page.locator('.page--settings')).toBeVisible();
      // Le menu se referme après le clic sur un lien
      await expect(page.locator('#player-menu')).toHaveAttribute('aria-hidden', 'true');
    });

    test('should log out from the player menu and come back to the profile screen', async ({ page }) => {
      await page.locator('#player-menu-trigger').click();
      let message = null;
      page.once('dialog', async (dialog) => { message = dialog.message(); await dialog.accept(); });
      await page.locator('#player-logout').click();

      await expect.poll(() => message).toContain('Changer de profil ?');
      await expect(page).toHaveURL(/#\/$/);
      await expect(page.locator('.page--splash')).toBeVisible();
      // Les données du joueur sont conservées : son profil est toujours proposé
      await expect(page.locator('.splash__player-name')).toHaveText('TestPlayer');
    });

    test('should stay on the page when the logout is cancelled', async ({ page }) => {
      await page.locator('#player-menu-trigger').click();
      page.once('dialog', (dialog) => dialog.dismiss());
      await page.locator('#player-logout').click();

      await expect(page.locator('.page--home')).toBeVisible();
      await expect(page).toHaveURL(/#\/home$/);
    });
  });

  test.describe('Hash Router', () => {
    test.beforeEach(async ({ page }) => {
      await createPlayer(page);
    });

    test('should render the page of a hash typed directly', async ({ page }) => {
      await navigateTo(page, '/explore');
      await expect(page.locator('.page--explore')).toBeVisible();

      await navigateTo(page, '/badges');
      await expect(page.locator('.page--badges')).toBeVisible();
      await expect(page.locator('h1.badges__title')).toHaveText('🏆 Badges');
    });

    test('should go back and forward through the history', async ({ page }) => {
      await navigateTo(page, '/explore');
      await expect(page.locator('.page--explore')).toBeVisible();
      await navigateTo(page, '/stats');
      await expect(page.locator('.page--stats')).toBeVisible();

      await page.goBack();
      await expect(page).toHaveURL(/#\/explore$/);
      await expect(page.locator('.page--explore')).toBeVisible();

      await page.goBack();
      await expect(page).toHaveURL(/#\/home$/);
      await expect(page.locator('.page--home')).toBeVisible();

      await page.goForward();
      await expect(page.locator('.page--explore')).toBeVisible();
    });

    test('should redirect an unknown route to the profile screen', async ({ page }) => {
      await navigateTo(page, '/invalid-route-xyz'); // lint-ignore : route inconnue voulue

      await expect(page).toHaveURL(/#\/$/);
      await expect(page.locator('.page--splash')).toBeVisible();
    });

    test('should redirect /deck/<id> to the game of that deck', async ({ page }) => {
      await createTestDeck(page, { id: 'redirect-deck', name: 'Redirect Deck' });

      await navigateTo(page, '/deck/redirect-deck');

      await expect(page).toHaveURL(/#\/game\/redirect-deck$/);
      await expect(page.locator('.page--game')).toBeVisible();
    });

    test('should redirect /deck without id to the deck list', async ({ page }) => {
      await navigateTo(page, '/deck');

      await expect(page).toHaveURL(/#\/explore$/);
      await expect(page.locator('.page--explore')).toBeVisible();
    });

    test('should open the deck editor on a blank deck from its route', async ({ page }) => {
      await navigateTo(page, '/deck-editor');
      await expect(page.locator('.split-editor__title')).toHaveText('Créer un deck');
    });
  });

  test.describe('Player Bar', () => {
    test.beforeEach(async ({ page }) => {
      await createPlayer(page);
    });

    test('should display the player name, level and XP', async ({ page }) => {
      await expect(page.locator('.player-bar__name')).toHaveText('TestPlayer');
      await expect(page.locator('.player-bar__level')).toContainText('Niv. 1');
      await expect(page.locator('.player-bar__xp-text')).toHaveText('0 / 100 XP');
      await expect(page.locator('.player-bar__xp-bar')).toHaveAttribute('aria-valuenow', '0');
    });

    test('should stay visible on every main page', async ({ page }) => {
      for (const route of ['/explore', '/stats', '/settings', '/deck-hub']) {
        await navigateTo(page, route);
        await expect(page.locator('.player-bar__name')).toHaveText('TestPlayer');
      }
    });
  });

  test.describe('Responsive Navigation', () => {
    test('should fit a phone viewport without horizontal scrolling', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await createPlayer(page);

      await expect(page.locator('.navbar')).toBeVisible();
      await expect(page.locator('.navbar__item')).toHaveCount(5);
      for (const item of await page.locator('.navbar__item').all()) {
        await expect(item).toBeVisible();
      }

      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
});
