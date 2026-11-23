/**
 * Page Splash - Écran de bienvenue / sélection profil
 *
 * Dépendances: Pages (pages-base.js), Storage, State, Router, XP
 */

// ═══════════════════════════════════════════════════════════════
// SPLASH - Écran de bienvenue / sélection profil
// ═══════════════════════════════════════════════════════════════

Pages.splash = {
  _showNewPlayer: false,

  render() {
    const players = Storage.getPlayersList();
    const hasPlayers = players.length > 0;
    const _t = PageUtils.getTranslator();

    return `
      <div class="page page--splash">
        <div class="splash">
          <h1 class="splash__title">🧠 ${_t('app.name')}</h1>
          <p class="splash__subtitle">${_t('splash.subtitle')}</p>

          ${hasPlayers && !this._showNewPlayer ? this._renderPlayersList(players) : this._renderNewPlayerForm()}
        </div>
      </div>
    `;
  },

  _renderPlayersList(players) {
    const _t = PageUtils.getTranslator();
    return `
      <div class="splash__players">
        <h2 class="splash__section-title">${_t('splash.chooseProfile')}</h2>
        <div class="splash__players-list">
          ${players.map(p => {
            // Calculer le niveau et l'XP requis pour le prochain niveau
            const rawXP = Number(p.totalXP);
            const totalXP = Number.isFinite(rawXP) && rawXP > 0 ? rawXP : 0;
            let level = 1;
            let nextLevelXP = 100;
            if (typeof XP !== 'undefined') {
              level = XP.calculateLevel(totalXP);
              nextLevelXP = XP.xpForLevel(level + 1);
            }
            return `
              <button class="splash__player-card" data-player-id="${escapeHtml(p.id)}">
                <span class="splash__player-avatar">👤</span>
                <span class="splash__player-name">${escapeHtml(p.name)}</span>
                <div class="splash__player-stats">
                  <span class="splash__player-level">⭐ ${_t('splash.level')} ${escapeHtml(level)}</span>
                  <span class="splash__player-xp">${escapeHtml(totalXP)} / ${escapeHtml(nextLevelXP)} XP</span>
                </div>
              </button>
            `;
          }).join('')}
        </div>

        <div class="splash__actions">
          <button class="btn btn--secondary splash__new-player">
            + ${_t('splash.newPlayer')}
          </button>
          <button class="btn btn--secondary splash__import">
            📥 ${_t('common.import')}
          </button>
        </div>

        <input type="file" id="import-file" accept=".json" style="display: none;">
      </div>
    `;
  },

  _renderNewPlayerForm() {
    const hasPlayers = Storage.getPlayersList().length > 0;
    const _t = PageUtils.getTranslator();

    return `
      <div class="splash__form">
        ${hasPlayers ? `
          <button class="splash__back-btn" aria-label="${_t('common.back')}">← ${_t('common.back')}</button>
        ` : ''}
        <label for="player-name" class="splash__label">${_t('splash.yourName')}</label>
        <input type="text" id="player-name" class="splash__input" placeholder="${_t('splash.enterName')}" autocomplete="name">
        <button class="btn btn--primary splash__start">${_t('splash.start')}</button>

        ${!hasPlayers ? `
          <div class="splash__import-section">
            <span class="splash__or">${_t('common.or')}</span>
            <button class="btn btn--secondary splash__import">
              📥 ${_t('splash.importSave')}
            </button>
            <input type="file" id="import-file" accept=".json" style="display: none;">
          </div>
        ` : ''}
      </div>
    `;
  },

  mount(container) {
    container.innerHTML = this.render();
    this._bindEvents(container);
  },

  _bindEvents(container) {
    // Sélection d'un joueur existant
    container.querySelectorAll('.splash__player-card').forEach(card => {
      card.addEventListener('click', () => {
        const playerId = card.dataset.playerId;
        this._selectPlayer(playerId);
      });
    });

    // Bouton nouveau joueur
    const newPlayerBtn = container.querySelector('.splash__new-player');
    if (newPlayerBtn) {
      newPlayerBtn.addEventListener('click', () => {
        this._showNewPlayer = true;
        this.mount(container);
      });
    }

    // Bouton retour
    const backBtn = container.querySelector('.splash__back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this._showNewPlayer = false;
        this.mount(container);
      });
    }

    // Formulaire nouveau joueur
    const input = container.querySelector('#player-name');
    const startBtn = container.querySelector('.splash__start');
    if (input && startBtn) {
      const handleStart = () => {
        const name = input.value.trim();
        if (!name) {
          alert(PageUtils.getTranslator()('splash.nameRequired'));
          return;
        }
        this._createAndSelectPlayer(name);
      };

      startBtn.addEventListener('click', handleStart);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleStart();
      });
      input.focus();
    }

    // Import de sauvegarde
    const importBtn = container.querySelector('.splash__import');
    const importFile = container.querySelector('#import-file');
    if (importBtn && importFile) {
      importBtn.addEventListener('click', () => importFile.click());
      importFile.addEventListener('change', (e) => this._handleImport(e, container));
    }
  },

  _selectPlayer(playerId) {
    const player = Storage.loadPlayerById(playerId);
    if (player) {
      Storage.setCurrentPlayerId(playerId);
      Storage.savePlayer(player); // Pour compatibilité legacy
      State.set('player', player);

      // Recharger les decks avec la progression du nouveau joueur
      if (typeof App !== 'undefined' && typeof App._loadDecks === 'function') {
        const decks = App._loadDecks();
        State.set('decks', decks);
      }

      Router.navigate('/home');
    }
  },

  _createAndSelectPlayer(name) {
    const player = this._createPlayer(name);

    // Sauvegarder le joueur
    Storage.savePlayerById(player);
    Storage.addPlayerToList(player);
    Storage.setCurrentPlayerId(player.id);
    Storage.savePlayer(player); // Pour compatibilité legacy

    State.set('player', player);

    // Recharger les decks avec la progression du nouveau joueur (vide pour un nouveau joueur)
    if (typeof App !== 'undefined' && typeof App._loadDecks === 'function') {
      const decks = App._loadDecks();
      State.set('decks', decks);
    }

    this._showNewPlayer = false;
    Router.navigate('/home');
  },

  _handleImport(event, container) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);

        if (!data || !data.player) {
          alert(PageUtils.getTranslator()('splash.importInvalid'));
          return;
        }

        // Le fichier est une entrée non fiable : joueur ramené à ses types (nombres finis,
        // chaînes, tableaux...) ; une structure inexploitable est rejetée sans rien écrire.
        const importedPlayer = Storage.sanitizePlayer(data.player);
        if (!importedPlayer) {
          alert(PageUtils.getTranslator()('splash.importInvalid'));
          return;
        }

        // Importer les données (lève une erreur, sans écriture partielle, si invalides)
        Storage.importAll({ ...data, player: importedPlayer });

        // Ajouter le joueur à la liste
        Storage.addPlayerToList(importedPlayer);
        Storage.savePlayerById(importedPlayer);

        // Sélectionner le joueur importé
        Storage.setCurrentPlayerId(importedPlayer.id);
        State.set('player', importedPlayer);

        // Recharger les decks avec la progression du joueur importé
        if (typeof App !== 'undefined' && typeof App._loadDecks === 'function') {
          const decks = App._loadDecks();
          State.set('decks', decks);
        }

        alert(PageUtils.getTranslator()('splash.importSuccess', { name: importedPlayer.name }));
        this._showNewPlayer = false;
        Router.navigate('/home');
      } catch (err) {
        console.error('[Import] Error:', err);
        const _t = PageUtils.getTranslator();
        alert(_t('common.importError', { message: _t('common.invalidFile') }));
      }
    };
    reader.readAsText(file);
  },

  _createPlayer(name) {
    return {
      id: 'player_' + Date.now(),
      name,
      createdAt: new Date().toISOString(),
      stats: {
        totalXP: 0,
        totalCardsPlayed: 0,
        totalSessions: 0,
        currentStreak: 0,
        longestStreak: 0,
        longestGreenStreak: 0,
        totalGreenCards: 0,
        lastPlayedAt: null,
        fastestCorrectAnswer: null,
        uniqueDecksPlayed: 0,
        playedDeckIds: [],
        xpHistory: []
      },
      badges: [],
      settings: {
        soundEnabled: true,
        theme: 'dark',
        allowBuiltinDeckDeletion: false
      }
    };
  }
};
