/**
 * E2E - Paramètres (/settings)
 *
 * Joueurs de test en français (language: 'fr'), navigateur en fr-FR (voir playwright.config.cjs).
 * Les sélecteurs sont structurels (classes BEM, id, attributs data-*) ; les rares textes
 * attendus sont les textes français de l'interface.
 */

const fs = require('fs');
const { test, expect } = require('@playwright/test');
const {
  navigateToApp,
  createPlayer,
  navigateTo,
  clearStorage,
  getStoredPlayer
} = require('./helpers.cjs');

/** Ouvre les paramètres comme un utilisateur : clic sur l'entrée de la barre de navigation. */
async function openSettings(page) {
  await page.locator('.navbar a[href="#/settings"]').click();
  await expect(page.locator('.page--settings')).toBeVisible();
}

/** Radio du groupe de langue, par valeur (le champ natif est masqué : on lit son état ici). */
const radio = (page, value) => page.locator(`input[name="language"][value="${value}"]`);

/** Choisit une langue en cliquant sur son libellé (le champ radio natif est masqué). */
const chooseLanguage = (page, value) =>
  page.locator('.settings__language-option', { has: radio(page, value) }).click();

/** Ouvre le menu du joueur (barre du bas). */
async function openPlayerMenu(page) {
  await page.locator('#player-menu-trigger').click();
  await expect(page.locator('#player-menu')).toHaveAttribute('aria-hidden', 'false');
}

/** Ajoute un second joueur (profil enregistré, non sélectionné) avec ces réglages. */
async function addOtherPlayer(page, settings) {
  await page.evaluate((s) => {
    const other = {
      id: 'player_bob',
      name: 'Bob',
      createdAt: '2025-01-01T00:00:00.000Z',
      stats: { totalXP: 0, totalCardsPlayed: 0, totalSessions: 0, currentStreak: 0, longestStreak: 0, xpHistory: [] },
      badges: [],
      settings: { soundEnabled: true, tutorialCompleted: true, ...s }
    };
    Storage.savePlayerById(other);
    Storage.addPlayerToList(other);
  }, settings);
}

/** Quitte la session (menu du joueur) puis choisit un autre profil sur l'écran d'accueil, sans rechargement. */
async function switchToPlayer(page, playerId) {
  await openPlayerMenu(page);
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#player-logout').click();
  await expect(page.locator('.page--splash')).toBeVisible();
  await page.locator(`.splash__player-card[data-player-id="${playerId}"]`).click();
  await expect(page.locator('.page--home')).toBeVisible();
}

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await clearStorage(page);
    await createPlayer(page);
  });

  test.describe('Settings Page', () => {
    test('should open settings from the navigation bar', async ({ page }) => {
      await openSettings(page);

      await expect(page).toHaveURL(/#\/settings$/);
      await expect(page.locator('h1.settings__title')).toHaveText('⚙️ Paramètres');
      await expect(page.locator('.navbar a[href="#/settings"]')).toHaveAttribute('aria-current', 'page');
      await expect(page).toHaveTitle('Paramètres - Train Your Brain');
    });

    test('should display every settings section', async ({ page }) => {
      await openSettings(page);

      await expect(page.locator('.settings__section-title')).toHaveText([
        /Langue/, /Audio/, /Thèmes/, /Accessibilité/, /Aide/, /Données/, /Avancé/, /À propos/
      ]);
    });
  });

  test.describe('Theme Settings', () => {
    test('should display themes with the current one selected', async ({ page }) => {
      await openSettings(page);

      await expect(page.locator('.settings__theme-card')).toHaveCount(8);
      await expect(page.locator('.settings__theme-card--selected')).toHaveCount(1);
      await expect(page.locator('.settings__theme-card--selected')).toHaveAttribute('data-theme', 'ocean');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'ocean');
      // Les thèmes à débloquer sont désactivés pour un nouveau joueur
      await expect(page.locator('.settings__theme-card--locked').first()).toBeDisabled();
    });

    test('should change theme and persist it after reload', async ({ page }) => {
      await openSettings(page);

      await page.locator('.settings__theme-card[data-theme="forest"]').click();

      await expect(page.locator('.settings__theme-card--selected')).toHaveAttribute('data-theme', 'forest');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'forest');
      expect((await getStoredPlayer(page)).settings.theme).toBe('forest');

      await page.reload();
      await expect(page.locator('.page--settings')).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'forest');
      await expect(page.locator('.settings__theme-card--selected')).toHaveAttribute('data-theme', 'forest');
    });

    test('should not select a locked theme', async ({ page }) => {
      await openSettings(page);

      const locked = page.locator('.settings__theme-card--locked').first();
      await expect(locked).toBeDisabled();
      await locked.click({ force: true });

      await expect(page.locator('.settings__theme-card--selected')).toHaveAttribute('data-theme', 'ocean');
      expect((await getStoredPlayer(page)).settings.theme).toBe('ocean');
    });
  });

  test.describe('Sound Settings', () => {
    test('should toggle sound and persist it after reload', async ({ page }) => {
      await openSettings(page);
      const toggle = page.locator('#sound-toggle');
      await expect(toggle).toBeChecked();

      await toggle.uncheck();
      expect((await getStoredPlayer(page)).settings.soundEnabled).toBe(false);

      await page.reload();
      await expect(page.locator('.page--settings')).toBeVisible();
      await expect(page.locator('#sound-toggle')).not.toBeChecked();

      await page.locator('#sound-toggle').check();
      expect((await getStoredPlayer(page)).settings.soundEnabled).toBe(true);
    });
  });

  test.describe('Language Settings', () => {
    test('should offer automatic, French and English, with the player choice checked', async ({ page }) => {
      await openSettings(page);

      const radios = page.locator('input[name="language"]');
      await expect(radios).toHaveCount(3);
      expect(await radios.evaluateAll(els => els.map(e => e.type))).toEqual(['radio', 'radio', 'radio']);
      expect(await radios.evaluateAll(els => els.map(e => e.value))).toEqual(['auto', 'fr', 'en']);
      await expect(page.locator('.settings__language-label')).toHaveText([
        'Automatique (langue du navigateur)', 'Français', 'English'
      ]);
      await expect(radio(page, 'fr')).toBeChecked();
      await expect(radio(page, 'auto')).not.toBeChecked();
      await expect(radio(page, 'en')).not.toBeChecked();
      await expect(page.locator('.settings__language-option--active')).toHaveCount(1);
      await expect(page.locator('.settings__language-option--active input')).toHaveValue('fr');
    });

    test('should translate the page when the language changes and keep it after reload', async ({ page }) => {
      await openSettings(page);

      await chooseLanguage(page, 'en');

      await expect(page.locator('h1.settings__title')).toHaveText('⚙️ Settings');
      await expect(radio(page, 'en')).toBeChecked();
      await expect(page.locator('.navbar a[href="#/home"]')).toContainText('Home');
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      expect((await getStoredPlayer(page)).settings.language).toBe('en');

      // Les autres pages sont traduites aussi
      await page.locator('.navbar a[href="#/home"]').click();
      await expect(page.locator('.page--home .home__section-title').first()).toContainText('Decks to review');

      // Persistance : après rechargement de la page, l'interface reste en anglais
      await page.reload();
      await expect(page.locator('.page--home')).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.locator('.page--home .home__section-title').first()).toContainText('Decks to review');
      await page.locator('.navbar a[href="#/settings"]').click();
      await expect(page.locator('h1.settings__title')).toHaveText('⚙️ Settings');
      await expect(radio(page, 'en')).toBeChecked();
      await expect(page).toHaveTitle('Settings - Train Your Brain');
    });

    test('should switch back to French', async ({ page }) => {
      await openSettings(page);
      await chooseLanguage(page, 'en');
      await expect(page.locator('h1.settings__title')).toHaveText('⚙️ Settings');

      await chooseLanguage(page, 'fr');

      await expect(page.locator('h1.settings__title')).toHaveText('⚙️ Paramètres');
      await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
      expect((await getStoredPlayer(page)).settings.language).toBe('fr');
    });

    test('should follow the browser language when set to automatic', async ({ page }) => {
      await openSettings(page);
      await chooseLanguage(page, 'en');
      await expect(page.locator('h1.settings__title')).toHaveText('⚙️ Settings');

      // Navigateur en fr-FR : « automatique » donne le français
      await chooseLanguage(page, 'auto');

      await expect(page.locator('h1.settings__title')).toHaveText('⚙️ Paramètres');
      await expect(radio(page, 'auto')).toBeChecked();
      expect((await getStoredPlayer(page)).settings.language).toBe('auto');
    });
  });

  test.describe('Language Settings (English browser)', () => {
    test.use({ locale: 'en-US' });

    test('should use the browser language in automatic mode and the player choice otherwise', async ({ page }) => {
      // Joueur en « automatique » : navigateur en anglais -> interface en anglais
      await clearStorage(page);
      await createPlayer(page, 'AutoPlayer', { settings: { language: 'auto' } });
      await page.locator('.navbar a[href="#/settings"]').click();
      await expect(page.locator('h1.settings__title')).toHaveText('⚙️ Settings');
      await expect(radio(page, 'auto')).toBeChecked();

      // Le choix explicite du français l'emporte sur la langue du navigateur
      await chooseLanguage(page, 'fr');
      await expect(page.locator('h1.settings__title')).toHaveText('⚙️ Paramètres');
    });
  });

  test.describe('Player Profile', () => {
    test('should display the player name and level in the player bar', async ({ page }) => {
      await openSettings(page);

      await expect(page.locator('.player-bar__name')).toHaveText('TestPlayer');
      await expect(page.locator('.player-bar__level')).toContainText('Niv. 1');
    });
  });

  test.describe('Player menu and saved settings', () => {
    test('should keep the player menu working after changing a setting', async ({ page }) => {
      await openSettings(page);

      // Changer de thème ou de langue ré-affiche la page : le menu du joueur doit rester utilisable
      await page.locator('.settings__theme-card[data-theme="forest"]').click();
      await expect(page.locator('.settings__theme-card--selected')).toHaveAttribute('data-theme', 'forest');

      await openPlayerMenu(page);
      await expect(page.locator('#player-logout')).toBeVisible();
    });

    test('should keep the chosen settings when the player logs out and back in', async ({ page }) => {
      page.on('dialog', (dialog) => dialog.accept());
      await openSettings(page);
      await page.locator('.settings__theme-card[data-theme="forest"]').click();
      await page.locator('#sound-toggle').uncheck();
      await page.locator('#high-contrast-toggle').check();

      // Quitter la session puis reprendre le profil depuis l'écran de profils
      await page.reload();
      await openPlayerMenu(page);
      await page.locator('#player-logout').click();
      await expect(page.locator('.page--splash')).toBeVisible();
      await page.locator('.splash__player-card').click();
      await expect(page.locator('.page--home')).toBeVisible();

      await expect(page.locator('html')).toHaveAttribute('data-theme', 'forest');
      const settings = (await getStoredPlayer(page)).settings;
      expect(settings).toMatchObject({ theme: 'forest', soundEnabled: false, highContrast: true });
    });
  });

  test.describe('Appearance of each player', () => {
    test('should keep the theme of each player when switching players and back', async ({ page }) => {
      const alice = await getStoredPlayer(page);
      await openSettings(page);
      await page.locator('.settings__theme-card[data-theme="forest"]').click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'forest');
      await addOtherPlayer(page, { theme: 'ocean', language: 'fr' });

      // Le thème du joueur choisi s'applique dès sa sélection (sans rechargement)
      await switchToPlayer(page, 'player_bob');
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'ocean');
      expect((await getStoredPlayer(page)).id).toBe('player_bob');

      await switchToPlayer(page, alice.id);
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'forest');
      expect((await getStoredPlayer(page)).settings.theme).toBe('forest');

      // ... et au rechargement
      await page.reload();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'forest');
    });

    test('should keep the language of each player when switching players and back', async ({ page }) => {
      const alice = await getStoredPlayer(page);
      await openSettings(page);
      await chooseLanguage(page, 'en');
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await addOtherPlayer(page, { theme: 'ocean', language: 'fr' });

      await switchToPlayer(page, 'player_bob');
      await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
      await expect(page.locator('.navbar a[href="#/home"]')).toContainText('Accueil');

      await switchToPlayer(page, alice.id);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.locator('.navbar a[href="#/home"]')).toContainText('Home');
      expect((await getStoredPlayer(page)).settings.language).toBe('en');
    });
  });

  test.describe('Data Management', () => {
    test('should display the data section with export and reset actions', async ({ page }) => {
      await openSettings(page);

      const section = page.locator('.settings__section', { has: page.locator('h2:has-text("Données")') });
      await expect(section.locator('.settings__section-title')).toHaveText('💾 Données');
      await expect(section.locator('.settings__export')).toHaveText('Exporter');
      await expect(section.locator('.settings__reset')).toHaveText('Réinitialiser');
    });

    test('should export the player data as a JSON backup file', async ({ page }) => {
      await openSettings(page);

      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.locator('.settings__export').click()
      ]);

      expect(download.suggestedFilename()).toMatch(/^train-your-brain-\d{4}-\d{2}-\d{2}\.json$/);
      const data = JSON.parse(fs.readFileSync(await download.path(), 'utf8'));
      expect(data.version).toBeTruthy();
      expect(data.player.name).toBe('TestPlayer');
      expect(data.player.settings.language).toBe('fr');
    });

    test('should import a backup from the profile selection screen', async ({ page }) => {
      const dialogs = [];
      page.on('dialog', async (dialog) => { dialogs.push(dialog.message()); await dialog.accept(); });

      // Sauvegarde d'un autre joueur, au format produit par l'export des paramètres
      const backup = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        player: {
          id: 'imported_player',
          name: 'Importée',
          createdAt: new Date().toISOString(),
          stats: { totalXP: 250, totalCardsPlayed: 40, totalSessions: 5, currentStreak: 0, longestStreak: 0, longestGreenStreak: 0, lastPlayedAt: null, xpHistory: [] },
          badges: [],
          settings: { theme: 'ocean', soundEnabled: true, language: 'fr', tutorialCompleted: true }
        },
        progress: {},
        settings: {}
      };

      // Retour à l'écran de profils (déconnexion du joueur courant)
      await openPlayerMenu(page);
      await page.locator('#player-logout').click();
      await expect(page.locator('.page--splash')).toBeVisible();
      await expect(page.locator('.splash__player-card')).toHaveCount(1);

      await page.locator('#import-file').setInputFiles({
        name: 'sauvegarde.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(backup))
      });

      // Le joueur importé est sélectionné : accueil, barre du joueur, XP repris de la sauvegarde
      await expect(page.locator('.page--home')).toBeVisible();
      await expect(page.locator('.player-bar__name')).toHaveText('Importée');
      await expect(page.locator('.player-bar__xp-text')).toContainText('250');
      expect(dialogs.some(m => m.includes('Importée'))).toBe(true);

      // Les deux profils sont maintenant listés
      const names = await page.evaluate(() => Storage.getPlayersList().map(p => p.name).sort());
      expect(names).toEqual(['Importée', 'TestPlayer']);
    });

    test('should reject an invalid backup file', async ({ page }) => {
      const dialogs = [];
      page.on('dialog', async (dialog) => { dialogs.push(dialog.message()); await dialog.accept(); });

      await openPlayerMenu(page);
      await page.locator('#player-logout').click();
      await expect(page.locator('.page--splash')).toBeVisible();

      await page.locator('#import-file').setInputFiles({
        name: 'invalide.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify({ foo: 'bar' }))
      });

      await expect.poll(() => dialogs.length).toBeGreaterThan(0);
      await expect(page.locator('.page--splash')).toBeVisible();
      await expect(page.locator('.splash__player-card')).toHaveCount(1);
    });

    test('should ask for confirmation before resetting and keep the data when cancelled', async ({ page }) => {
      await openSettings(page);

      let message = null;
      page.once('dialog', async (dialog) => {
        expect(dialog.type()).toBe('confirm');
        message = dialog.message();
        await dialog.dismiss();
      });
      await page.locator('.settings__reset').click();

      await expect.poll(() => message).not.toBeNull();
      expect(message).toContain('Veux-tu vraiment réinitialiser toutes tes données ?');
      expect(message).toContain('"TestPlayer"');

      // Rien n'a été effacé : on reste sur les paramètres, le profil existe toujours
      await expect(page.locator('.page--settings')).toBeVisible();
      expect(await page.evaluate(() => Storage.getPlayersList().map(p => p.name))).toEqual(['TestPlayer']);
      expect((await getStoredPlayer(page)).name).toBe('TestPlayer');
    });

    test('should erase the current player data once the reset is confirmed', async ({ page }) => {
      await openSettings(page);

      page.once('dialog', (dialog) => dialog.accept());
      await page.locator('.settings__reset').click();

      // Rechargement : plus de profil, retour à l'écran de profils sans joueur
      await expect(page.locator('.page--splash')).toBeVisible();
      await expect(page.locator('.splash__player-card')).toHaveCount(0);
      expect(await page.evaluate(() => Storage.getPlayersList())).toEqual([]);
      expect(await page.evaluate(() => Storage.getCurrentPlayerId())).toBeFalsy();
    });
  });

  test.describe('About Section', () => {
    test('should reveal the version and project links when expanded', async ({ page }) => {
      await openSettings(page);

      const toggle = page.locator('.settings__about-toggle');
      const content = page.locator('.settings__about-content');
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await expect(content).toBeHidden();

      await toggle.click();

      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      await expect(content).toBeVisible();
      await expect(page.locator('.settings__about-version')).toContainText('Version 1.0.0');
      await expect(page.locator('.settings__version-badge--alpha')).toHaveText('ALPHA');
      await expect(page.locator('a.settings__about-github')).toHaveAttribute('href', /github\.com\/jmchantrein\/train-your-brain$/);
      const contact = page.locator('a.settings__about-contact');
      await expect(contact).toHaveAttribute('href', 'https://github.com/jmchantrein/train-your-brain/issues');
      await expect(contact).toHaveAttribute('target', '_blank');
      await expect(contact).toHaveAttribute('rel', 'noopener noreferrer');

      await toggle.click();
      await expect(content).toBeHidden();
    });
  });

  test.describe('Help', () => {
    test('should replay the tutorial', async ({ page }) => {
      await openSettings(page);
      await expect(page.locator('.tutorial-overlay')).toHaveCount(0);

      await page.locator('.settings__tutorial').click();

      const overlay = page.locator('.tutorial-overlay');
      await expect(overlay).toBeVisible();
      await expect(overlay).toHaveAttribute('role', 'dialog');
    });
  });

  test.describe('Accessibility Settings', () => {
    test('should offer the accessibility options, all off by default', async ({ page }) => {
      await openSettings(page);

      await expect(page.locator('#dyslexia-toggle')).not.toBeChecked();
      await expect(page.locator('#high-contrast-toggle')).not.toBeChecked();
      await expect(page.locator('#large-spacing-toggle')).not.toBeChecked();
      await expect(page.locator('#colorblind-select')).toHaveValue('');
      await expect(page.locator('#colorblind-select option')).toHaveCount(4);
    });

    test('should apply each accessibility option to the document and store it', async ({ page }) => {
      await openSettings(page);
      const html = page.locator('html');

      await page.locator('#dyslexia-toggle').check();
      await expect(html).toHaveAttribute('data-dyslexia', 'true');

      await page.locator('#high-contrast-toggle').check();
      await expect(html).toHaveAttribute('data-high-contrast', 'true');

      await page.locator('#large-spacing-toggle').check();
      await expect(html).toHaveAttribute('data-large-spacing', 'true');

      await page.locator('#colorblind-select').selectOption('deuteranopia');
      await expect(html).toHaveAttribute('data-colorblind', 'deuteranopia');

      const settings = (await getStoredPlayer(page)).settings;
      expect(settings).toMatchObject({
        dyslexiaMode: true, highContrast: true, largeSpacing: true, colorblindMode: 'deuteranopia'
      });

      // Désactivation
      await page.locator('#high-contrast-toggle').uncheck();
      await expect(html).toHaveAttribute('data-high-contrast', 'false');
      expect((await getStoredPlayer(page)).settings.highContrast).toBe(false);
    });

    test('should restore the accessibility options after reload', async ({ page }) => {
      await openSettings(page);
      await page.locator('#high-contrast-toggle').check();
      await page.locator('#colorblind-select').selectOption('tritanopia');

      await page.reload();

      await expect(page.locator('.page--settings')).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-high-contrast', 'true');
      await expect(page.locator('html')).toHaveAttribute('data-colorblind', 'tritanopia');
      await expect(page.locator('#high-contrast-toggle')).toBeChecked();
      await expect(page.locator('#colorblind-select')).toHaveValue('tritanopia');
    });
  });

  test.describe('Advanced Settings', () => {
    test('should show delete buttons on built-in decks only when allowed', async ({ page }) => {
      await navigateTo(page, '/explore');
      await expect(page.locator('.page--explore .deck-table__row').first()).toBeVisible();
      await expect(page.locator('.deck-table__btn--delete')).toHaveCount(0);

      await navigateTo(page, '/settings');
      await page.locator('#allow-builtin-deletion').check();
      expect((await getStoredPlayer(page)).settings.allowBuiltinDeckDeletion).toBe(true);

      await navigateTo(page, '/explore');
      await expect(page.locator('.deck-table__btn--delete').first()).toBeVisible();
    });
  });
});
