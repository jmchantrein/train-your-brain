/**
 * E2E - Mode dictée du générateur de decks (/prompt-generator, bouton « Mode Dictée » du hub)
 *
 * Le mode dictée interroge des services externes (Lingua Libre, Wikimedia). Ces tests n'en
 * dépendent jamais : TOUTE requête http(s) est interceptée et interrompue par page.route
 * (voir blockExternalNetwork), et chaque test vérifie qu'aucune requête n'a été tentée en dehors
 * du seul scénario de génération. Le service est remplacé (stub dans la page) pour tester
 * l'écran de résultat, la sauvegarde et l'export sans réseau.
 *
 * Non couvert ici, faute de pouvoir le tester hors réseau : la recherche réelle des fichiers
 * audio, le téléchargement des sons et la lecture audio des cartes.
 */

const fs = require('fs');
const { test, expect } = require('@playwright/test');
const {
  navigateToApp,
  createPlayer,
  navigateTo,
  clearStorage,
  getCustomDecks,
  blockExternalNetwork
} = require('./helpers.cjs');

/** Ouvre le mode dictée par la carte « Mode Dictée » du hub de création. */
async function openDictation(page) {
  await navigateTo(page, '/deck-hub');
  await page.locator('.deck-hub__action-card[data-action="dictation"]').click();
  await expect(page).toHaveURL(/#\/prompt-generator$/);
  await expect(page.locator('.dictation')).toBeVisible();
}

/** Remplace la recherche d'audio : renvoie un deck de `count` cartes et `missing` mots introuvables. */
async function stubGeneration(page, { count, missing }) {
  await page.evaluate(({ count, missing }) => {
    LinguaLibre.generateDictationDeck = async (words, lang, info, onProgress) => {
      const cards = words.slice(0, count).map((word, i) => ({
        id: `dict_${i}`,
        question: 'Écris le mot que tu entends',
        answer: word,
        type: 'exact_text',
        alternatives: [word.toUpperCase()],
        media: { type: 'audio', format: 'audio/ogg', data: 'data:audio/ogg;base64,T2dnUw==' },
        hint: `${word.length} lettres`,
        box: 'never_played'
      }));
      const errors = words.slice(count, count + missing).map(w => `"${w}" : audio non trouvé sur Lingua Libre/Wikimedia`);
      return {
        deck: {
          id: 'dictee-stub',
          name: info.name,
          description: `Dictée de ${cards.length} mots`,
          category: info.category,
          language: lang,
          cards
        },
        errors
      };
    };
  }, { count, missing });
}

test.describe('Dictation Mode', () => {
  let blocked;

  test.beforeEach(async ({ page }) => {
    blocked = await blockExternalNetwork(page);
    await navigateToApp(page);
    await clearStorage(page);
    await createPlayer(page);
  });

  test.afterEach(() => {
    // Garde-fou : hors scénario de génération réelle, aucune requête externe n'est tentée
    if (!test.info().title.includes('[network-attempts]')) {
      expect(blocked).toEqual([]);
    }
  });

  test.describe('Accessing Dictation Generator', () => {
    test('should open the dictation generator from the create hub', async ({ page }) => {
      await openDictation(page);

      await expect(page.locator('.dictation__title')).toHaveText('🎧 Générateur de dictée');
      await expect(page.locator('.dictation__description')).toContainText('Lingua Libre');
    });

    test('should go back to the AI prompt generator with the back button', async ({ page }) => {
      await openDictation(page);

      await page.locator('.dictation__back').click();

      await expect(page.locator('.dictation')).toHaveCount(0);
      await expect(page.locator('.prompt-gen__title')).toHaveText('🤖 Générateur de Deck IA');
    });

    test('should open the AI prompt generator, not the dictation, from the AI card', async ({ page }) => {
      await navigateTo(page, '/deck-hub');
      await page.locator('.deck-hub__action-card[data-action="ai"]').click();

      await expect(page).toHaveURL(/#\/prompt-generator$/);
      await expect(page.locator('.prompt-gen__title')).toBeVisible();
      await expect(page.locator('.dictation')).toHaveCount(0);
    });
  });

  test.describe('Dictation Form', () => {
    test.beforeEach(async ({ page }) => {
      await openDictation(page);
    });

    test('should display the deck name, language and word list fields', async ({ page }) => {
      await expect(page.locator('label[for="dictation-name"]')).toHaveText('Nom du deck');
      await expect(page.locator('#dictation-name')).toHaveValue('');
      await expect(page.locator('label[for="dictation-lang"]')).toHaveText('Langue');
      await expect(page.locator('#dictation-words')).toBeVisible();
      await expect(page.locator('#dictation-words')).toHaveValue('');
      await expect(page.locator('.dictation__hint')).toHaveText('0 mot');
    });

    test('should offer the supported languages, French first', async ({ page }) => {
      const select = page.locator('#dictation-lang');
      const options = await select.locator('option').evaluateAll(els => els.map(o => [o.value, o.textContent.trim()]));

      expect(options.length).toBeGreaterThan(5);
      expect(options[0]).toEqual(['fr', 'Français']);
      for (const expected of [['en', 'English'], ['es', 'Español'], ['de', 'Deutsch']]) {
        expect(options).toContainEqual(expected);
      }
      await expect(select).toHaveValue('fr');

      await select.selectOption('es');
      await expect(select).toHaveValue('es');
    });

    test('should count the words and enable generation only when there are some', async ({ page }) => {
      const generate = page.locator('.dictation__generate');
      await expect(generate).toBeDisabled();

      await page.locator('#dictation-words').fill('bonjour\nmerci\nécole\nmaison');
      await expect(page.locator('.dictation__hint')).toHaveText('4 mots');
      await expect(generate).toBeEnabled();

      // Les lignes vides ne comptent pas
      await page.locator('#dictation-words').fill('bonjour\n\n   \nmerci\n');
      await expect(page.locator('.dictation__hint')).toHaveText('2 mots');

      await page.locator('#dictation-words').fill('   \n  ');
      await expect(generate).toBeDisabled();
      await page.locator('#dictation-words').fill('');
      await expect(page.locator('.dictation__hint')).toHaveText('0 mot');
      await expect(generate).toBeDisabled();
    });

    test('should warn that audio download needs an internet connection', async ({ page }) => {
      await expect(page.locator('.dictation__warning-text')).toContainText('connexion internet est nécessaire');
      await expect(page.locator('.dictation__warning-text')).toContainText('hors ligne');
    });

    test('should not generate anything while the word list is empty', async ({ page }) => {
      await page.locator('#dictation-name').fill('Dictée vide');
      await page.locator('.dictation__generate').click({ force: true });

      await expect(page.locator('.dictation__generate')).toBeDisabled();
      await expect(page.locator('.dictation--progress')).toHaveCount(0);
      await expect(page.locator('.dictation--result')).toHaveCount(0);
      expect(blocked).toEqual([]);
    });
  });

  test.describe('Generate Dictation Deck', () => {
    test('should list every word as not found when the audio services are unreachable [network-attempts]', async ({ page }) => {
      await openDictation(page);
      await page.locator('#dictation-name').fill('Dictée hors réseau');
      await page.locator('#dictation-words').fill('bonjour\nmerci');

      await page.locator('.dictation__generate').click();

      // Aucune requête n'a quitté la machine (toutes interrompues par page.route), tout est signalé
      await expect(page.locator('.dictation--result')).toBeVisible({ timeout: 15000 });
      await expect(page.locator('.dictation__result-stat').first().locator('.dictation__result-stat-value')).toHaveText('0');
      await expect(page.locator('.dictation__result-stat--error .dictation__result-stat-value')).toHaveText('2');
      await expect(page.locator('.dictation__errors-details summary')).toHaveText('Voir les 2 erreurs');
      await page.locator('.dictation__errors-details summary').click();
      await expect(page.locator('.dictation__errors-list li')).toHaveText([
        '"bonjour" : audio non trouvé sur Lingua Libre/Wikimedia',
        '"merci" : audio non trouvé sur Lingua Libre/Wikimedia'
      ]);

      expect(blocked.length).toBeGreaterThan(0);
      for (const url of blocked) {
        expect(new URL(url).hostname).toMatch(/(lingualibre\.org|wikidata\.org|wikimedia\.org)$/);
      }
    });
  });

  test.describe('Dictation Results (generation service stubbed)', () => {
    test.beforeEach(async ({ page }) => {
      await openDictation(page);
      await stubGeneration(page, { count: 5, missing: 1 });
      await page.locator('#dictation-name').fill('Dictée CE1');
      await page.locator('#dictation-words').fill('bonjour\nmerci\nécole\nmaison\nfamille\nintrouvable');
      await page.locator('.dictation__generate').click();
      await expect(page.locator('.dictation--result')).toBeVisible();
    });

    test('should summarise the cards with audio and the words not found', async ({ page }) => {
      await expect(page.locator('.dictation__title')).toHaveText('✅ Deck généré !');
      const stats = page.locator('.dictation__result-stat');
      await expect(stats.nth(0).locator('.dictation__result-stat-value')).toHaveText('5');
      await expect(stats.nth(0).locator('.dictation__result-stat-label')).toHaveText('cartes avec audio');
      await expect(stats.nth(1).locator('.dictation__result-stat-value')).toHaveText('1');
      await expect(stats.nth(1).locator('.dictation__result-stat-label')).toHaveText('mots non trouvés');

      await page.locator('.dictation__errors-details summary').click();
      await expect(page.locator('.dictation__errors-list li')).toHaveText(['"introuvable" : audio non trouvé sur Lingua Libre/Wikimedia']);
    });

    test('should preview the first three cards of the deck', async ({ page }) => {
      await expect(page.locator('.dictation__result-preview h3')).toHaveText('Aperçu du deck : Dictée CE1');
      await expect(page.locator('.dictation__card-word')).toHaveText(['bonjour', 'merci', 'école']);
      await expect(page.locator('.dictation__card-audio')).toHaveCount(3);
      await expect(page.locator('.dictation__card-more')).toHaveText('+2 autres...');
    });

    test('should save the deck and list it in the deck list', async ({ page }) => {
      let message = null;
      page.once('dialog', async (dialog) => { message = dialog.message(); await dialog.accept(); });

      await page.locator('.dictation__save').click();

      await expect.poll(() => message).toBe('Deck « Dictée CE1 » sauvegardé avec 5 cartes !');
      await expect(page).toHaveURL(/#\/explore$/);
      await expect(page.locator('.deck-table__row[data-deck-id="dictee-stub"]')).toContainText('Dictée CE1');
      const deck = (await getCustomDecks(page)).find(d => d.id === 'dictee-stub');
      expect(deck.cards).toHaveLength(5);
      expect(deck.cards[0]).toMatchObject({ answer: 'bonjour', type: 'exact_text' });
    });

    test('should export the generated deck as YAML', async ({ page }) => {
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.locator('.dictation__export-yaml').click()
      ]);

      expect(download.suggestedFilename()).toBe('dictee-stub.yaml');
      const content = fs.readFileSync(await download.path(), 'utf8');
      expect(content).toContain('Dictée CE1');
      expect(content).toContain('bonjour');
    });

    test('should start a new dictation with the back button', async ({ page }) => {
      await page.locator('.dictation__back').click();

      // L'état de la dictée est remis à zéro : retour au générateur de deck IA
      await expect(page.locator('.dictation')).toHaveCount(0);
      await expect(page.locator('.prompt-gen__title')).toBeVisible();
    });
  });

  test.describe('Empty result', () => {
    test('should not offer to save a deck without any card', async ({ page }) => {
      await openDictation(page);
      await stubGeneration(page, { count: 0, missing: 2 });
      await page.locator('#dictation-words').fill('introuvable1\nintrouvable2');
      await page.locator('.dictation__generate').click();
      await expect(page.locator('.dictation--result')).toBeVisible();

      // Un deck sans carte est inutilisable (l'éditeur le refuse aussi) : pas de bouton de sauvegarde
      await expect(page.locator('.dictation__save')).toHaveCount(0);
    });
  });
});
