/**
 * Import d'un fichier YAML depuis le hub des decks (audit de publication C7)
 *
 * Le hub appelait Pages.promptGenerator._validateYaml(), qui n'existe pas : l'import d'un fichier
 * YAML levait "is not a function". La fonction réelle est PromptGeneratorYamlLogic.validateYaml.
 */

describe('Pages.deckHub - import d\'un fichier YAML (C7)', () => {
  const YAML_DECK = 'id: t\nname: Test\ncards:\n  - id: c1\n    question: Q\n    answer: A\n';

  function importFile(name, content) {
    const container = document.createElement('div');
    container.innerHTML = Pages.deckHub.render({ player: Storage.sanitizePlayer({ id: 'p', name: 'P' }), decks: [] });
    Pages.deckHub.mount(container, { player: null, decks: [] });
    const input = container.querySelector('#hub-file-import');
    const OriginalReader = window.FileReader;
    window.FileReader = class { readAsText() { this.onload({ target: { result: content } }); } };
    try {
      Object.defineProperty(input, 'files', { value: [{ name }], configurable: true });
      input.dispatchEvent(new window.Event('change'));
    } finally {
      window.FileReader = OriginalReader;
    }
  }

  it('should have the hub and the YAML logic loaded by the runner', () => {
    expect(typeof Pages.deckHub).toBe('object');
    expect(typeof PromptGeneratorYamlLogic.validateYaml).toBe('function');
  });

  it('should validate a YAML file without throwing and fill the YAML editor state', () => {
    importFile('deck.yaml', YAML_DECK);
    expect(Pages.promptGenerator._yamlContent).toBe(YAML_DECK);
    expect(Pages.promptGenerator._yamlError).toBeNull();
    expect(Pages.promptGenerator._parsedDeck.name).toBe('Test');
    expect(Pages.promptGenerator._validationReport).toBeDefined();
  });

  it('should report a YAML error instead of throwing for an empty file', () => {
    importFile('empty.yaml', '   ');
    expect(Pages.promptGenerator._parsedDeck).toBeNull();
    expect(typeof Pages.promptGenerator._yamlError).toBe('string');
  });
});

describe('Components.playerBar._logout - sauvegarde (même erreur d\'arguments que l\'import)', () => {
  it('should persist the deck progress of every deck, per player, when unsaved changes exist', () => {
    localStorage.clear();
    const player = Storage.sanitizePlayer({ id: 'p1', name: 'A', createdAt: '2026-01-01', stats: { totalXP: 12 } });
    Storage.setCurrentPlayerId('p1');
    const deck = { id: 'dk', cards: [{ id: 'c1', question: 'Q', answer: 'A', box: 'green', timesPlayed: 3, timesCorrect: 3 }] };
    State.set('player', player);
    State.set('decks', [deck]);
    Components.playerBar._logout();
    const progress = Storage.loadDeckProgress('dk');
    expect(progress).not.toBeNull();
    expect(progress[0].box).toBe('green');
    expect(progress[0].timesPlayed).toBe(3);
    expect(Storage.loadPlayerById('p1').stats.totalXP).toBe(12);
  });
});
