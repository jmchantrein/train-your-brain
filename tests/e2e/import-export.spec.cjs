/**
 * E2E - Import / export
 *
 * Chemins réels de l'application :
 *  - export d'un deck en YAML : bouton 📥 d'une ligne de la liste des decks (/explore) ;
 *  - import d'un deck : hub de création (/deck-hub) -> « Coller du YAML » (éditeur YAML du
 *    générateur) ou « Importer un fichier » (YAML, JSON, Moodle XML) ;
 *  - sauvegarde de progression : menu du joueur (YAML) ; sauvegarde complète : paramètres (JSON,
 *    couvert dans settings.spec.cjs).
 */

const fs = require('fs');
const { test, expect } = require('@playwright/test');
const {
  navigateToApp,
  createPlayer,
  createTestDeck,
  navigateTo,
  clearStorage,
  getCustomDecks,
  getDeck,
  answerCard
} = require('./helpers.cjs');

/** Enregistre et accepte les boîtes de dialogue natives (alert / confirm) ; retourne leurs messages. */
function collectDialogs(page) {
  const messages = [];
  page.on('dialog', async (dialog) => { messages.push(dialog.message()); await dialog.accept(); });
  return messages;
}

const VALID_YAML = `
id: imported-deck
name: Deck Importé
description: Test import
category:
  - test
difficulty: 1
cards:
  - id: imp_c1
    question: "Capitale de l'Italie ?"
    answer: Rome
    type: text
  - id: imp_c2
    question: "2 + 2 = ?"
    answer: "4"
    type: numeric
`;

/** Ouvre l'éditeur YAML du générateur depuis le hub (« Coller du YAML ») et y saisit du code. */
async function openYamlEditor(page, content) {
  await navigateTo(page, '/deck-hub');
  await page.locator('.deck-hub__action-card[data-action="paste"]').click();
  await expect(page).toHaveURL(/#\/prompt-generator$/);
  await expect(page.locator('.yaml-editor')).toBeVisible();
  if (content !== undefined) {
    await page.locator('.yaml-editor__textarea').fill(content);
  }
}

test.describe('Import/Export', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToApp(page);
    await clearStorage(page);
    await createPlayer(page);
  });

  test.describe('Export Deck', () => {
    test('should download a deck as a YAML file from the deck list', async ({ page }) => {
      await createTestDeck(page, {
        id: 'export-deck',
        name: 'Deck pour export',
        description: 'Test export',
        cards: [{ id: 'c1', question: 'Q1 ?', answer: 'A1' }]
      });
      await navigateTo(page, '/explore');

      const row = page.locator('.deck-table__row[data-deck-id="export-deck"]');
      await expect(row).toContainText('Deck pour export');

      const [download] = await Promise.all([
        page.waitForEvent('download'),
        row.locator('.deck-table__btn--export').click()
      ]);

      expect(download.suggestedFilename()).toBe('export-deck.yaml');
      const content = fs.readFileSync(await download.path(), 'utf8');
      expect(content).toContain('id: export-deck');
      expect(content).toContain('name: Deck pour export');
      expect(content).toContain('question: "Q1 ?"');
      expect(content).toContain('answer: "A1"');
    });

    test('should export a deck that re-imports identically through the YAML editor', async ({ page }) => {
      const dialogs = collectDialogs(page);
      await createTestDeck(page, {
        id: 'roundtrip-deck',
        name: 'Aller-retour',
        cards: [
          { id: 'r1', question: 'Capitale ?', answer: 'Paris', alternatives: ['paris'], hint: 'Ville Lumière', feedback: 'La Seine la traverse' },
          { id: 'r2', question: '1 + 1 = ?', answer: '2', type: 'numeric' }
        ]
      });
      await navigateTo(page, '/explore');
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.locator('.deck-table__row[data-deck-id="roundtrip-deck"] .deck-table__btn--export').click()
      ]);
      const exported = fs.readFileSync(await download.path(), 'utf8');

      // Réimport sous un autre identifiant
      await openYamlEditor(page, exported.replace('id: roundtrip-deck', 'id: roundtrip-copy'));
      await page.locator('.yaml-editor__validate').click();
      await page.locator('.yaml-editor__import').click();
      await expect.poll(() => dialogs.some(m => m.includes('importé avec succès'))).toBe(true);

      const copy = (await getCustomDecks(page)).find(d => d.id === 'roundtrip-copy');
      expect(copy.name).toBe('Aller-retour');
      expect(copy.cards.map(c => [c.question, c.answer, c.type || 'text'])).toEqual([
        ['Capitale ?', 'Paris', 'text'],
        ['1 + 1 = ?', '2', 'numeric']
      ]);
      // Les réponses alternatives, l'indice et le feedback ne doivent pas se perdre à l'export
      expect(exported).toMatch(/alternatives:/);
      expect(copy.cards[0].alternatives).toEqual(['paris']);
      expect(copy.cards[0].hint).toBe('Ville Lumière');
      expect(copy.cards[0].feedback).toBe('La Seine la traverse');
    });
  });

  test.describe('Import Deck from YAML', () => {
    test('should offer the YAML editor from the create hub', async ({ page }) => {
      await openYamlEditor(page);

      await expect(page.locator('.yaml-editor__header h2')).toHaveText('✏️ Éditeur de deck');
      await expect(page.locator('.yaml-editor__textarea')).toHaveValue('');
      await expect(page.locator('.yaml-editor__validate')).toBeVisible();
      // Rien à importer tant que le YAML n'est pas validé
      await expect(page.locator('.yaml-editor__import')).toHaveCount(0);
    });

    test('should validate then import a valid YAML deck', async ({ page }) => {
      const dialogs = collectDialogs(page);
      await openYamlEditor(page, VALID_YAML);

      await page.locator('.yaml-editor__validate').click();

      // Aperçu du deck validé
      const preview = page.locator('.yaml-editor__deck-preview');
      await expect(preview).toContainText('Deck Importé');
      await expect(preview).toContainText('2 cartes');
      await expect(page.locator('.yaml-editor__error')).toHaveCount(0);

      await page.locator('.yaml-editor__import').click();

      await expect.poll(() => dialogs).toContain('Deck « Deck Importé » importé avec succès ! (2 cartes)');
      await expect(page).toHaveURL(/#\/home$/);

      const imported = (await getCustomDecks(page)).find(d => d.id === 'imported-deck');
      expect(imported.name).toBe('Deck Importé');
      expect(imported.cards).toHaveLength(2);
      expect(imported.cards[0]).toMatchObject({ id: 'imp_c1', question: "Capitale de l'Italie ?", answer: 'Rome', box: 'never_played', timesPlayed: 0 });

      // Le deck importé est listé et jouable
      await navigateTo(page, '/explore');
      await expect(page.locator('.deck-table__row[data-deck-id="imported-deck"]')).toContainText('Deck Importé');
      expect((await getDeck(page, 'imported-deck')).cards).toHaveLength(2);
    });

    test('should reject syntactically invalid YAML', async ({ page }) => {
      await openYamlEditor(page, 'name: [pas fermé\ncards: : :');

      await page.locator('.yaml-editor__validate').click();

      await expect(page.locator('.yaml-editor__error-text')).toContainText('Erreur d\'analyse du YAML');
      await expect(page.locator('.yaml-editor__import')).toHaveCount(0);
      expect(await getCustomDecks(page)).toHaveLength(0);
    });

    test('should reject a deck without cards or name', async ({ page }) => {
      await openYamlEditor(page, 'id: incomplete\ncards: []\n');
      await page.locator('.yaml-editor__validate').click();
      await expect(page.locator('.yaml-editor__error-text')).toContainText('au moins une carte');
      await expect(page.locator('.yaml-editor__import')).toHaveCount(0);

      await page.locator('.yaml-editor__textarea').fill('description: sans id ni nom\ncards:\n  - id: a\n    question: Q\n    answer: R\n');
      await page.locator('.yaml-editor__validate').click();
      await expect(page.locator('.yaml-editor__error-text')).toContainText('Le deck doit avoir un « id » ou un « name »');
      expect(await getCustomDecks(page)).toHaveLength(0);
    });

    test('should reject cards without question or answer', async ({ page }) => {
      await openYamlEditor(page, 'id: bad-cards\nname: Cartes incomplètes\ncards:\n  - id: a\n    question: Q sans réponse\n  - id: b\n    answer: R sans question\n');

      await page.locator('.yaml-editor__validate').click();

      await expect(page.locator('.yaml-editor__error-text')).toContainText('Carte 1 : champ « answer » manquant');
      await expect(page.locator('.yaml-editor__error-text')).toContainText('Carte 2 : champ « question » manquant');
      await expect(page.locator('.yaml-editor__import')).toHaveCount(0);
    });

    test('should ask before replacing a deck with the same id', async ({ page }) => {
      await createTestDeck(page, { id: 'imported-deck', name: 'Deck Original', cards: [{ id: 'o1', question: 'Q', answer: 'R' }] });
      await openYamlEditor(page, VALID_YAML);
      await page.locator('.yaml-editor__validate').click();

      // Refus : le deck d'origine est conservé
      let message = null;
      page.once('dialog', async (dialog) => { message = dialog.message(); await dialog.dismiss(); });
      await page.locator('.yaml-editor__import').click();
      await expect.poll(() => message).toBe('Un deck avec l\'identifiant « imported-deck » existe déjà. Veux-tu le remplacer ?');
      expect((await getCustomDecks(page)).find(d => d.id === 'imported-deck').name).toBe('Deck Original');
      await expect(page).toHaveURL(/#\/prompt-generator$/);

      // Acceptation : le deck est remplacé
      const dialogs = collectDialogs(page);
      await page.locator('.yaml-editor__import').click();
      await expect.poll(() => dialogs.some(m => m.includes('importé avec succès'))).toBe(true);
      const decks = await getCustomDecks(page);
      expect(decks.filter(d => d.id === 'imported-deck')).toHaveLength(1);
      expect(decks.find(d => d.id === 'imported-deck').name).toBe('Deck Importé');
    });
  });

  test.describe('Import from File', () => {
    test.beforeEach(async ({ page }) => {
      await navigateTo(page, '/deck-hub');
      await expect(page.locator('.page--deck-hub')).toBeVisible();
    });

    test('should expose a hidden file input for YAML, JSON and Moodle XML files', async ({ page }) => {
      const input = page.locator('#hub-file-import');
      await expect(input).toHaveAttribute('type', 'file');
      await expect(input).toHaveAttribute('accept', '.xml,.yaml,.yml,.json');
      await expect(page.locator('.deck-hub__action-card[data-action="file"]')).toBeVisible();
    });

    test('should open a YAML file in the editor, already validated', async ({ page }) => {
      await page.locator('#hub-file-import').setInputFiles({
        name: 'deck.yaml', mimeType: 'text/yaml', buffer: Buffer.from(VALID_YAML)
      });

      await expect(page).toHaveURL(/#\/prompt-generator$/);
      await expect(page.locator('.yaml-editor__textarea')).toHaveValue(/id: imported-deck/);
      await expect(page.locator('.yaml-editor__deck-preview')).toContainText('Deck Importé');
      await expect(page.locator('.yaml-editor__import')).toBeVisible();
    });

    test('should import a JSON deck directly', async ({ page }) => {
      const dialogs = collectDialogs(page);

      await page.locator('#hub-file-import').setInputFiles({
        name: 'deck.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify({
          id: 'json-deck',
          name: 'Deck JSON',
          cards: [{ id: 'j1', question: 'Q JSON ?', answer: 'R JSON' }, { id: 'j2', question: 'Q2 ?', answer: 'R2' }]
        }))
      });

      await expect.poll(() => dialogs).toContain('Deck « Deck JSON » importé avec succès !\n2 cartes ajoutées.');
      const deck = (await getCustomDecks(page)).find(d => d.id === 'json-deck');
      expect(deck.cards).toHaveLength(2);
      expect(deck.cards[0]).toMatchObject({ question: 'Q JSON ?', answer: 'R JSON', box: 'never_played' });
    });

    test('should refuse a JSON file that is not a deck', async ({ page }) => {
      const dialogs = collectDialogs(page);

      await page.locator('#hub-file-import').setInputFiles({
        name: 'pas-un-deck.json', mimeType: 'application/json', buffer: Buffer.from('{"foo": 1}')
      });

      await expect.poll(() => dialogs).toContain("Erreur d'import JSON : Format JSON invalide : aucun deck trouvé");
      expect(await getCustomDecks(page)).toHaveLength(0);
    });

    test('should import a Moodle XML quiz after asking for the deck name', async ({ page }) => {
      const messages = [];
      page.on('dialog', async (dialog) => {
        messages.push(`${dialog.type()}: ${dialog.message()}`);
        await (dialog.type() === 'prompt' ? dialog.accept('Quiz Moodle') : dialog.accept());
      });
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="multichoice">
    <name><text>Addition</text></name>
    <questiontext format="html"><text><![CDATA[<p>Combien font 2 + 2 ?</p>]]></text></questiontext>
    <single>true</single>
    <answer fraction="100"><text>4</text></answer>
    <answer fraction="0"><text>5</text></answer>
  </question>
  <question type="truefalse">
    <name><text>Ciel</text></name>
    <questiontext format="html"><text>Le ciel est bleu.</text></questiontext>
    <answer fraction="100"><text>true</text></answer>
    <answer fraction="0"><text>false</text></answer>
  </question>
</quiz>`;

      await page.locator('#hub-file-import').setInputFiles({
        name: 'quiz.xml', mimeType: 'text/xml', buffer: Buffer.from(xml)
      });

      await expect.poll(() => messages.some(m => m.startsWith('alert:') && m.includes('importé avec succès'))).toBe(true);
      expect(messages[0]).toBe('prompt: Nom du deck :');
      const deck = (await getCustomDecks(page)).find(d => d.name === 'Quiz Moodle');
      expect(deck.cards).toHaveLength(2);
      expect(deck.cards.map(c => c.type)).toEqual(['mcq', 'truefalse']);
      expect(deck.cards[0].question).toContain('2 + 2');
    });

    test('should refuse an invalid Moodle XML file', async ({ page }) => {
      const dialogs = collectDialogs(page);

      await page.locator('#hub-file-import').setInputFiles({
        name: 'vide.xml', mimeType: 'text/xml', buffer: Buffer.from('<quiz></quiz>')
      });

      await expect.poll(() => dialogs).toContain('Erreur Moodle XML : Aucune question trouvée');
      expect(await getCustomDecks(page)).toHaveLength(0);
    });
  });

  test.describe('Progress backup (player menu)', () => {
    async function downloadProgress(page) {
      await page.locator('#player-menu-trigger').click();
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.locator('#player-export-progress').click()
      ]);
      return download;
    }

    test('should export the player progress as a YAML file', async ({ page }) => {
      await createTestDeck(page, { id: 'progress-deck', name: 'Progress', cards: [{ id: 'p1', question: '1 + 1 = ?', answer: '2', type: 'numeric' }] });
      await navigateTo(page, '/game/progress-deck');
      await answerCard(page, '2');
      await page.locator('#next-btn').click();
      await expect(page.locator('.page--session-summary')).toBeVisible();
      await page.locator('.session-summary__home').click();
      await expect(page.locator('.page--home')).toBeVisible();

      const download = await downloadProgress(page);

      expect(download.suggestedFilename()).toMatch(/^testplayer-train-your-brain-progress-\d{4}-\d{2}-\d{2}\.yaml$/);
      const content = fs.readFileSync(await download.path(), 'utf8');
      expect(content).toContain('name: TestPlayer');
      expect(content).toContain('id: progress-deck');
      expect(content).toMatch(/box: green/);
    });

    test('should restore the deck progress from an exported file', async ({ page }) => {
      const dialogs = collectDialogs(page);
      await createTestDeck(page, { id: 'restore-deck', name: 'Restore', cards: [{ id: 'p1', question: '1 + 1 = ?', answer: '2', type: 'numeric' }] });
      await navigateTo(page, '/game/restore-deck');
      await answerCard(page, '2');
      await page.locator('#next-btn').click();
      await expect(page.locator('.page--session-summary')).toBeVisible();
      await page.locator('.session-summary__home').click();
      await expect(page.locator('.page--home')).toBeVisible();
      const download = await downloadProgress(page);
      const exportedFile = await download.path();

      // Perte de la progression (autre navigateur, effacement...)
      await page.evaluate(() => { Storage.deleteDeckProgress('restore-deck'); State.set('decks', App._loadDecks()); });
      expect((await getDeck(page, 'restore-deck')).cards[0].box).toBe('never_played');

      // Import de la sauvegarde depuis le menu du joueur
      await page.locator('#player-menu-trigger').click();
      const [chooser] = await Promise.all([
        page.waitForEvent('filechooser'),
        page.locator('#player-import-progress').click()
      ]);
      await chooser.setFiles(exportedFile);
      await expect.poll(() => dialogs.some(m => m.includes('TestPlayer'))).toBe(true);

      // L'application se recharge ; la progression restaurée doit avoir été enregistrée
      await page.waitForEvent('load');
      await expect(page.locator('#app')).toBeVisible();
      await page.waitForFunction(() => typeof State !== 'undefined' && State.get('decks') && State.get('decks').length > 0);
      expect((await getDeck(page, 'restore-deck')).cards[0].box).toBe('green');
    });
  });
});
