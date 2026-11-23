/**
 * E2E - Éditeur de deck (/deck-editor[/<id>]) et gestion des decks personnalisés
 *
 * L'éditeur est à deux volets synchronisés : code YAML (#yaml-editor) et édition visuelle.
 * Une carte nouvellement ajoutée s'ouvre en mode « étendu » ; les décks se sauvegardent
 * par le bouton « Sauvegarder le deck » (alertes natives, puis retour au hub de création).
 */

const { test, expect } = require('@playwright/test');
const {
  navigateToApp,
  createPlayer,
  createTestDeck,
  navigateTo,
  clearStorage,
  getCustomDecks
} = require('./helpers.cjs');

/** Enregistre les messages des boîtes de dialogue natives et les accepte. */
function collectDialogs(page) {
  const messages = [];
  page.on('dialog', async (dialog) => { messages.push(dialog.message()); await dialog.accept(); });
  return messages;
}

const yaml = (page) => page.locator('#yaml-editor');
const cardsCount = (page) => page.locator('.split-editor__cards-count');

/** Ajoute une carte et remplit sa question / réponse (la carte s'ouvre en mode étendu). */
async function addCard(page, question, answer) {
  await page.locator('.split-editor__add-card-btn').first().click();
  const card = page.locator('.split-editor__card-item--expanded');
  await expect(card).toBeVisible();
  await card.locator('.split-editor__card-question').fill(question);
  await card.locator('.split-editor__card-answer').fill(answer);
  return card;
}

test.describe('Deck Editor', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await clearStorage(page);
    await createPlayer(page);
  });

  test.describe('Accessing Editor', () => {
    test('should open the editor on a blank deck', async ({ page }) => {
      await navigateTo(page, '/deck-editor');

      await expect(page).toHaveURL(/#\/deck-editor$/);
      await expect(page.locator('.split-editor')).toBeVisible();
      await expect(page.locator('.split-editor__title')).toHaveText('Créer un deck');
      await expect(page.locator('#visual-name')).toHaveValue('');
      await expect(yaml(page)).toBeVisible();
      await expect(cardsCount(page)).toHaveText('0 carte');
      await expect(page.locator('.split-editor__empty')).toContainText('Aucune carte');
    });

    test('should open the editor from the create hub', async ({ page }) => {
      await navigateTo(page, '/deck-hub');
      await expect(page.locator('.page--deck-hub')).toBeVisible();

      const createCard = page.locator('.deck-hub__action-card[data-action="create"]');
      await expect(createCard).toBeVisible();
      await createCard.click();

      await expect(page).toHaveURL(/#\/deck-editor$/);
      await expect(page.locator('.split-editor__title')).toHaveText('Créer un deck');
    });

    test('should swap the code and visual panels', async ({ page }) => {
      await navigateTo(page, '/deck-editor');
      const left = page.locator('.split-editor__panel--left');
      const right = page.locator('.split-editor__panel--right');
      await expect(left.locator('#yaml-editor')).toBeVisible();
      await expect(right.locator('#visual-name')).toBeVisible();

      await page.locator('.split-editor__swap-btn').click();

      await expect(left.locator('#visual-name')).toBeVisible();
      await expect(right.locator('#yaml-editor')).toBeVisible();
    });
  });

  test.describe('Creating Deck', () => {
    test('should create a new deck with a card and save it', async ({ page }) => {
      const dialogs = collectDialogs(page);
      await navigateTo(page, '/deck-editor');

      await page.locator('#visual-name').fill('Mon nouveau deck');
      await page.locator('#visual-desc').fill('Description de test');
      const card = await addCard(page, 'Question test ?', 'Réponse test');
      await expect(cardsCount(page)).toHaveText('1 carte');
      await card.locator('.split-editor__collapse-card').last().click();

      // Carte repliée : aperçu de la question et de la réponse
      await expect(page.locator('.split-editor__card-q')).toHaveText('Question test ?');
      await expect(page.locator('.split-editor__card-a')).toHaveText('Réponse test');

      await page.locator('.split-editor__save').first().click();

      // Alerte de confirmation puis retour au hub de création
      await expect.poll(() => dialogs).toContain('Deck « Mon nouveau deck » sauvegardé avec 1 carte !');
      await expect(page).toHaveURL(/#\/deck-hub$/);

      const decks = await getCustomDecks(page);
      expect(decks).toHaveLength(1);
      expect(decks[0]).toMatchObject({ name: 'Mon nouveau deck', description: 'Description de test' });
      expect(decks[0].cards).toHaveLength(1);
      expect(decks[0].cards[0]).toMatchObject({ question: 'Question test ?', answer: 'Réponse test', type: 'text', box: 'never_played' });

      // Le deck apparaît dans la liste des decks
      await navigateTo(page, '/explore');
      await expect(page.locator(`.deck-table__row[data-deck-id="${decks[0].id}"]`)).toContainText('Mon nouveau deck');
    });

    test('should add several cards and number them', async ({ page }) => {
      await navigateTo(page, '/deck-editor');

      await addCard(page, 'Q1 ?', 'R1');
      await page.locator('.split-editor__collapse-card').last().click();
      await addCard(page, 'Q2 ?', 'R2');

      await expect(cardsCount(page)).toHaveText('2 cartes');
      await expect(page.locator('.split-editor__card-item')).toHaveCount(2);
      await expect(page.locator('.split-editor__card-num')).toHaveText(['1', '2']);
    });

    test('should set the card type', async ({ page }) => {
      await navigateTo(page, '/deck-editor');
      const card = await addCard(page, '2 + 2 = ?', '4');

      await card.locator('.split-editor__card-type').selectOption('numeric');

      await expect(card.locator('.split-editor__card-type')).toHaveValue('numeric');
      await expect(yaml(page)).toHaveValue(/type: numeric/);
    });

    test('should store the alternatives of a card', async ({ page }) => {
      const dialogs = collectDialogs(page);
      await navigateTo(page, '/deck-editor');
      await page.locator('#visual-name').fill('Deck alternatives');
      const card = await addCard(page, 'Capitale de la France ?', 'Paris');

      await card.locator('.split-editor__card-alternatives').fill('paris, PARIS');

      await expect(yaml(page)).toHaveValue(/alternatives:/);
      await page.locator('.split-editor__save').first().click();
      await expect.poll(() => dialogs.length).toBeGreaterThan(0);

      const [deck] = await getCustomDecks(page);
      expect(deck.cards[0].alternatives).toEqual(['paris', 'PARIS']);
    });

    test('should keep the YAML code in sync with the visual fields', async ({ page }) => {
      await navigateTo(page, '/deck-editor');

      await page.locator('#visual-name').fill('Deck synchronisé');
      await addCard(page, 'Question YAML ?', 'Réponse YAML');

      const code = yaml(page);
      await expect(code).toHaveValue(/name: .*Deck synchronisé/);
      await expect(code).toHaveValue(/Question YAML \?/);
      await expect(code).toHaveValue(/Réponse YAML/);
    });

    test('should build the visual view from YAML typed in the code panel', async ({ page }) => {
      await navigateTo(page, '/deck-editor');

      await yaml(page).fill(`id: deck-yaml
name: Deck depuis YAML
description: Écrit en YAML
cards:
  - id: y1
    question: "Capitale de l'Italie ?"
    answer: Rome
    type: text
  - id: y2
    question: "2 + 3 = ?"
    answer: "5"
    type: numeric
`);

      await expect(page.locator('#visual-name')).toHaveValue('Deck depuis YAML');
      await expect(page.locator('#visual-desc')).toHaveValue('Écrit en YAML');
      await expect(cardsCount(page)).toHaveText('2 cartes');
      await expect(page.locator('.split-editor__card-q')).toHaveText(["Capitale de l'Italie ?", '2 + 3 = ?']);
      await expect(page.locator('.split-editor__code-status')).not.toHaveClass(/error/);
    });

    test('should report invalid YAML without losing the editor', async ({ page }) => {
      await navigateTo(page, '/deck-editor');

      await yaml(page).fill('name: [pas fermé\ncards: : :');

      await expect(page.locator('.split-editor__code-status')).toHaveClass(/error/);
      await expect(page.locator('.split-editor')).toBeVisible();
    });
  });

  test.describe('Editing Deck', () => {
    test.beforeEach(async ({ page }) => {
      await createTestDeck(page, {
        id: 'edit-test-deck',
        name: 'Deck à éditer',
        description: 'Pour tests édition'
      });
    });

    test('should load an existing deck for editing', async ({ page }) => {
      await navigateTo(page, '/deck-editor/edit-test-deck');

      await expect(page.locator('.split-editor__title')).toHaveText('Modifier le deck');
      await expect(page.locator('#visual-name')).toHaveValue('Deck à éditer');
      await expect(page.locator('#visual-desc')).toHaveValue('Pour tests édition');
      await expect(cardsCount(page)).toHaveText('3 cartes');
      await expect(yaml(page)).toHaveValue(/id: edit-test-deck/);
      await expect(page.locator('.split-editor__card-q').first()).toHaveText('2 + 2 = ?');
    });

    test('should modify the deck name and keep its id and cards', async ({ page }) => {
      const dialogs = collectDialogs(page);
      await navigateTo(page, '/deck-editor/edit-test-deck');

      await page.locator('#visual-name').fill('Deck modifié');
      await page.locator('.split-editor__save').first().click();

      await expect.poll(() => dialogs).toContain('Deck « Deck modifié » sauvegardé avec 3 cartes !');
      const decks = await getCustomDecks(page);
      expect(decks).toHaveLength(1);
      expect(decks[0]).toMatchObject({ id: 'edit-test-deck', name: 'Deck modifié' });
      expect(decks[0].cards).toHaveLength(3);
    });

    test('should edit the content of an existing card', async ({ page }) => {
      const dialogs = collectDialogs(page);
      await navigateTo(page, '/deck-editor/edit-test-deck');

      await page.locator('.split-editor__expand-card').first().click();
      const card = page.locator('.split-editor__card-item--expanded');
      await expect(card.locator('.split-editor__card-question')).toHaveValue('2 + 2 = ?');
      await card.locator('.split-editor__card-answer').fill('quatre');
      await page.locator('.split-editor__save').first().click();

      await expect.poll(() => dialogs.length).toBeGreaterThan(0);
      const [deck] = await getCustomDecks(page);
      expect(deck.cards[0]).toMatchObject({ id: 'card_1', question: '2 + 2 = ?', answer: 'quatre' });
    });

    test('should delete a card after confirmation', async ({ page }) => {
      const dialogs = [];
      page.on('dialog', async (dialog) => { dialogs.push(dialog.message()); await dialog.accept(); });
      await navigateTo(page, '/deck-editor/edit-test-deck');
      await expect(cardsCount(page)).toHaveText('3 cartes');

      await page.locator('.split-editor__delete-card').first().click();

      await expect(cardsCount(page)).toHaveText('2 cartes');
      expect(dialogs).toEqual(['Supprimer cette carte ?']);
      await expect(page.locator('.split-editor__card-q')).toHaveText(['Capital of France?', 'Is the sky blue?']);

      await page.locator('.split-editor__save').first().click();
      await expect.poll(() => dialogs.length).toBe(2);
      const [deck] = await getCustomDecks(page);
      expect(deck.cards.map(c => c.id)).toEqual(['card_2', 'card_3']);
    });

    test('should keep the card when the deletion is cancelled', async ({ page }) => {
      page.once('dialog', (dialog) => dialog.dismiss());
      await navigateTo(page, '/deck-editor/edit-test-deck');

      await page.locator('.split-editor__delete-card').first().click();

      await expect(cardsCount(page)).toHaveText('3 cartes');
      await expect(page.locator('.split-editor__card-item')).toHaveCount(3);
    });

    test('should open the requested deck even after another one was left unsaved', async ({ page }) => {
      await createTestDeck(page, { id: 'second-deck', name: 'Deuxième deck', cards: [{ id: 's1', question: 'S1 ?', answer: 'R1' }] });
      await navigateTo(page, '/deck-editor/edit-test-deck');
      await expect(page.locator('#visual-name')).toHaveValue('Deck à éditer');

      // On quitte l'éditeur sans sauvegarder, puis on ouvre un autre deck
      await navigateTo(page, '/explore');
      await expect(page.locator('.page--explore')).toBeVisible();
      await navigateTo(page, '/deck-editor/second-deck');

      await expect(page.locator('.split-editor__title')).toHaveText('Modifier le deck');
      await expect(page.locator('#visual-name')).toHaveValue('Deuxième deck');
      await expect(cardsCount(page)).toHaveText('1 carte');
    });
  });

  test.describe('Deck Settings', () => {
    test('should store the sequential and similarity options', async ({ page }) => {
      const dialogs = collectDialogs(page);
      await navigateTo(page, '/deck-editor');
      await expect(page.locator('#visual-sequential')).not.toBeChecked();
      await expect(page.locator('#visual-similarity')).not.toBeChecked();

      await page.locator('#visual-name').fill('Deck options');
      await page.locator('#visual-sequential').check();
      await page.locator('#visual-similarity').check();
      await addCard(page, 'Q ?', 'R');
      await page.locator('.split-editor__save').first().click();

      await expect.poll(() => dialogs.length).toBeGreaterThan(0);
      const [deck] = await getCustomDecks(page);
      expect(deck.settings).toMatchObject({ sequential: true, similarityMatching: true });

      // Rouvert, l'éditeur reflète les options enregistrées
      await navigateTo(page, `/deck-editor/${deck.id}`);
      await expect(page.locator('#visual-sequential')).toBeChecked();
      await expect(page.locator('#visual-similarity')).toBeChecked();
    });
  });

  test.describe('Validation', () => {
    test('should require a deck name', async ({ page }) => {
      const dialogs = collectDialogs(page);
      await navigateTo(page, '/deck-editor');
      await addCard(page, 'Q ?', 'R');

      await page.locator('.split-editor__save').first().click();

      await expect.poll(() => dialogs).toEqual(['Le nom du deck est obligatoire.']);
      await expect(page).toHaveURL(/#\/deck-editor$/);
      expect(await getCustomDecks(page)).toHaveLength(0);
    });

    test('should require at least one card', async ({ page }) => {
      const dialogs = collectDialogs(page);
      await navigateTo(page, '/deck-editor');
      await page.locator('#visual-name').fill('Deck vide');

      await page.locator('.split-editor__save').first().click();

      await expect.poll(() => dialogs).toEqual(['Ajoute au moins une carte.']);
      await expect(page).toHaveURL(/#\/deck-editor$/);
      expect(await getCustomDecks(page)).toHaveLength(0);
    });

    test('should refuse a card without answer', async ({ page }) => {
      const dialogs = collectDialogs(page);
      await navigateTo(page, '/deck-editor');
      await page.locator('#visual-name').fill('Test validation');
      await page.locator('.split-editor__add-card-btn').first().click();
      await page.locator('.split-editor__card-question').fill('Question sans réponse');

      await page.locator('.split-editor__save').first().click();
      await expect.poll(() => dialogs.length).toBeGreaterThan(0);

      // Un deck contenant une carte sans réponse ne doit pas être enregistré
      await expect(page).toHaveURL(/#\/deck-editor$/);
      expect(await getCustomDecks(page)).toHaveLength(0);
    });

    test('should ask before leaving the editor with unsaved work', async ({ page }) => {
      await navigateTo(page, '/deck-editor');
      await page.locator('#visual-name').fill('Travail en cours');

      let message = null;
      page.once('dialog', async (dialog) => { message = dialog.message(); await dialog.dismiss(); });
      await page.locator('.split-editor__back').click();
      await expect.poll(() => message).toBe('Quitter sans sauvegarder ?');
      await expect(page.locator('.split-editor')).toBeVisible();
      await expect(page.locator('#visual-name')).toHaveValue('Travail en cours');

      page.once('dialog', (dialog) => dialog.accept());
      await page.locator('.split-editor__back').click();
      await expect(page.locator('.split-editor')).toHaveCount(0);
      expect(await getCustomDecks(page)).toHaveLength(0);
    });
  });

  test.describe('Opening a custom deck from the deck list', () => {
    test('should offer an edit action on custom decks only, and open the editor on that deck', async ({ page }) => {
      await createTestDeck(page, { id: 'list-edit-deck', name: 'Deck depuis la liste' });
      await navigateTo(page, '/explore');
      const row = page.locator('.deck-table__row[data-deck-id="list-edit-deck"]');
      await expect(row).toBeVisible();

      // Les decks intégrés ne sont pas modifiables
      await expect(page.locator('.deck-table__row').filter({ hasNot: page.locator('.deck-table__btn--edit') }).first()).toBeVisible();
      await expect(page.locator('.deck-table__btn--edit')).toHaveCount(1);

      await row.locator('.deck-table__btn--edit').click();

      await expect(page).toHaveURL(/#\/deck-editor\/list-edit-deck$/);
      await expect(page.locator('.split-editor__title')).toHaveText('Modifier le deck');
      await expect(page.locator('#visual-name')).toHaveValue('Deck depuis la liste');
    });

    test('should explain and go back to the creation hub for an unknown deck id', async ({ page }) => {
      const dialogs = collectDialogs(page);
      await navigateTo(page, '/deck-editor/does-not-exist');

      await expect.poll(() => dialogs).toEqual(['Ce deck n\'existe pas ou n\'est plus disponible.']);
      await expect(page).toHaveURL(/#\/deck-hub$/);
    });
  });

  test.describe('Deleting Deck', () => {
    test('should move a custom deck to the trash and restore it', async ({ page }) => {
      await createTestDeck(page, { id: 'deck-to-delete', name: 'Deck à supprimer' });
      await navigateTo(page, '/explore');
      const row = page.locator('.deck-table__row[data-deck-id="deck-to-delete"]');
      await expect(row).toBeVisible();

      // Refus de la confirmation : rien ne change
      page.once('dialog', (dialog) => dialog.dismiss());
      await row.locator('.deck-table__btn--delete').click();
      await expect(row).toBeVisible();
      expect(await getCustomDecks(page)).toHaveLength(1);

      // Confirmation : le deck quitte la liste et part à la corbeille
      let message = null;
      page.once('dialog', async (dialog) => { message = dialog.message(); await dialog.accept(); });
      await row.locator('.deck-table__btn--delete').click();
      await expect.poll(() => message).toContain('Supprimer le deck « Deck à supprimer » ?');
      await expect(page.locator('.deck-table__row[data-deck-id="deck-to-delete"]')).toHaveCount(0);
      expect(await getCustomDecks(page)).toHaveLength(0);

      // Corbeille du hub de création
      await navigateTo(page, '/deck-hub');
      await page.locator('[data-action="toggle-trash"]').click();
      const trashed = page.locator('.deck-hub__trash-item[data-deck-id="deck-to-delete"]');
      await expect(trashed).toBeVisible();
      await expect(trashed.locator('.deck-hub__trash-item-name')).toHaveText('Deck à supprimer');

      await trashed.locator('[data-action="restore"]').click();
      await expect.poll(async () => (await getCustomDecks(page)).map(d => d.id)).toEqual(['deck-to-delete']);
    });
  });
});
