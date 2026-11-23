/**
 * Module Components - Composants UI réutilisables
 *
 * Ensemble de composants HTML réactifs pour l'interface utilisateur.
 *
 * Les gros composants ont été extraits dans des fichiers séparés :
 * - components/tag-selector.js (ComponentTagSelector)
 * - components/card-media.js (CardMedia) et components/deck-table.js (DeckTable)
 *
 * @module Components
 */

// ═══════════════════════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════════════════════

/**
 * Échappe le HTML pour prévenir les XSS
 *
 * @param {*} text - Texte à échapper
 * @returns {string} - Texte échappé
 */
function escapeHtml(text) {
  return TextUtils.escapeHtml(text);
}

/**
 * Rend du texte avec support LaTeX
 * Échappe le HTML sauf les formules LaTeX entre $...$
 *
 * @param {string} text - Texte à rendre
 * @returns {string} - HTML avec LaTeX rendu
 */
function renderWithLatex(text) {
  if (text == null) return '';
  text = String(text);

  // Si pas de LaTeX, simplement échapper
  if (!text.includes('$')) {
    return escapeHtml(text);
  }

  // Si le module LaTeX (et KaTeX) est disponible, l'utiliser.
  // Sans KaTeX, le rendu de repli de LaTeX n'échappe pas son entrée : on échappe tout.
  if (typeof LaTeX !== 'undefined' && LaTeX.render && LaTeX.isAvailable?.()) {
    // Séparer les parties LaTeX des parties texte
    // et échapper uniquement les parties texte
    let result = '';
    let inLatex = false;
    let buffer = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      if (char === '$') {
        if (inLatex) {
          // Fin du LaTeX
          result += '$' + buffer + '$';
          buffer = '';
          inLatex = false;
        } else {
          // Début du LaTeX - échapper ce qu'on a avant
          result += escapeHtml(buffer);
          buffer = '';
          inLatex = true;
        }
      } else {
        buffer += char;
      }
    }

    // Traiter le reste
    // Un '$' non fermé n'est pas du LaTeX : tout le reste doit être échappé
    if (buffer) {
      result += inLatex ? escapeHtml('$' + buffer) : escapeHtml(buffer);
    }

    return LaTeX.render(result);
  }

  // Fallback: juste échapper
  return escapeHtml(text);
}

/**
 * Combine les classes CSS en filtrant les valeurs falsy
 *
 * @param {...(string|boolean|null|undefined)} classes - Classes à combiner
 * @returns {string} - Classes combinées
 *
 * @example
 * classNames('card', isActive && 'card--active', null) // → 'card card--active'
 */
function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

// ═══════════════════════════════════════════════════════════════
// COMPOSANTS
// ═══════════════════════════════════════════════════════════════

const Components = {
  /**
   * Barre joueur compacte (au-dessus de la navbar)
   */
  playerBar: {
    /**
     * Rendu de la barre joueur
     *
     * @param {Object} props - Propriétés
     * @param {Object} props.player - Joueur { name, stats: { totalXP }, badges }
     * @returns {string} - HTML de la barre joueur
     */
    render(props) {
      const { player } = props;

      if (!player) return '';

      const _t = PageUtils.getTranslator();

      // Calculer niveau et progression
      let level = 1;
      let xpProgress = 0;
      let nextLevelXP = 100;

      // Les stats viennent de données importables : forcer un nombre fini (défense en profondeur,
      // la source est assainie par Storage.sanitizePlayer)
      const rawXP = Number(player.stats?.totalXP);
      const totalXP = Number.isFinite(rawXP) && rawXP > 0 ? rawXP : 0;

      if (typeof XP !== 'undefined') {
        level = XP.calculateLevel(totalXP);
        xpProgress = XP.xpProgress(totalXP);
        nextLevelXP = XP.xpForLevel(level + 1);
      }

      const progressPercent = Math.round(xpProgress * 100);

      // Calculer XP pour niveau actuel et suivant pour le tooltip
      const currentLevelXP = typeof XP !== 'undefined' ? XP.xpForLevel(level) : 0;
      const xpInCurrentLevel = totalXP - currentLevelXP;
      const xpNeededForNext = nextLevelXP - currentLevelXP;

      // Vérifier si des modifications non sauvegardées
      const isDirty = typeof State !== 'undefined' && State.isDirty();

      return `
        <div class="player-bar">
          <div class="player-bar__info">
            <button class="player-bar__name-btn" id="player-menu-trigger" aria-haspopup="true" aria-expanded="false">
              <span class="player-bar__name-row">
                <span class="player-bar__name">${escapeHtml(player.name)}</span>
                ${isDirty ? `<span class="player-bar__badge" title="${_t('player.unsaved')}"></span>` : ''}
                <span class="player-bar__chevron">▾</span>
              </span>
              <span class="player-bar__level" title="${_t('player.levelTitle', { level, current: xpInCurrentLevel, needed: xpNeededForNext, next: level + 1 })}">⭐ ${_t('player.levelShort', { level })}</span>
            </button>
            <div class="player-bar__menu" id="player-menu" role="menu" aria-hidden="true">
              <button class="player-bar__menu-item" id="player-export-progress" role="menuitem">
                💾 ${_t('player.saveProgress')}
              </button>
              <button class="player-bar__menu-item" id="player-import-progress" role="menuitem">
                📂 ${_t('player.importProgress')}
              </button>
              <hr class="player-bar__menu-divider">
              <a class="player-bar__menu-item" href="#/settings" role="menuitem">
                ⚙️ ${_t('nav.settings')}
              </a>
              <a class="player-bar__menu-item" href="#/stats" role="menuitem">
                👤 ${_t('player.profile')}
              </a>
              <hr class="player-bar__menu-divider">
              <button class="player-bar__menu-item player-bar__menu-item--danger" id="player-logout" role="menuitem">
                🚪 ${_t('player.logout')}
              </button>
            </div>
          </div>
          <div class="player-bar__xp" title="${_t('player.xpTitle', { current: xpInCurrentLevel, needed: xpNeededForNext, next: level + 1 })}">
            <div class="player-bar__xp-bar" role="progressbar" aria-valuenow="${progressPercent}" aria-valuemin="0" aria-valuemax="100" aria-label="${_t('player.xpProgress', { next: level + 1 })}">
              <div class="player-bar__xp-fill" style="width: ${progressPercent}%"></div>
            </div>
            <span class="player-bar__xp-text">${escapeHtml(totalXP)} / ${escapeHtml(nextLevelXP)} XP</span>
          </div>
        </div>
      `;
    },

    /**
     * Bind les événements du menu joueur
     * @param {HTMLElement} container - Conteneur
     */
    bind(container) {
      // bind() est rappelé à chaque changement de page : retirer les listeners globaux précédents
      if (this._removeGlobalListeners) {
        this._removeGlobalListeners();
        this._removeGlobalListeners = null;
      }

      const trigger = container.querySelector('#player-menu-trigger');
      const menu = container.querySelector('#player-menu');

      if (!trigger || !menu) {
        // PlayerBar not rendered on this page (e.g., splash) - silently return
        return;
      }

      // Toggle menu
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = menu.getAttribute('aria-hidden') === 'false';
        this._toggleMenu(trigger, menu, !isOpen);
      });

      // Fermer au clic extérieur
      const onDocumentClick = (e) => {
        if (!trigger.contains(e.target) && !menu.contains(e.target)) {
          this._toggleMenu(trigger, menu, false);
        }
      };
      document.addEventListener('click', onDocumentClick);

      // Fermer avec Escape
      const onDocumentKeydown = (e) => {
        if (e.key === 'Escape' && menu.getAttribute('aria-hidden') === 'false') {
          this._toggleMenu(trigger, menu, false);
          trigger.focus();
        }
      };
      document.addEventListener('keydown', onDocumentKeydown);

      this._removeGlobalListeners = () => {
        document.removeEventListener('click', onDocumentClick);
        document.removeEventListener('keydown', onDocumentKeydown);
      };

      // Export progression
      const exportBtn = container.querySelector('#player-export-progress');
      if (exportBtn) {
        exportBtn.addEventListener('click', () => {
          this._exportProgress();
          this._toggleMenu(trigger, menu, false);
        });
      }

      // Import progression
      const importBtn = container.querySelector('#player-import-progress');
      if (importBtn) {
        importBtn.addEventListener('click', () => {
          this._importProgress();
          this._toggleMenu(trigger, menu, false);
        });
      }

      // Logout (quitter la session)
      const logoutBtn = container.querySelector('#player-logout');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          this._logout();
          this._toggleMenu(trigger, menu, false);
        });
      }

      // Fermer menu si on clique sur un lien
      menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          this._toggleMenu(trigger, menu, false);
        });
      });

      // S'abonner aux changements dirty pour mettre à jour le badge
      if (typeof State !== 'undefined') {
        const unsubscribeDirty = State.subscribe('_dirty', (isDirty) => {
          const badge = container.querySelector('.player-bar__badge');
          if (isDirty && !badge) {
            const nameSpan = container.querySelector('.player-bar__name');
            if (nameSpan) {
              const newBadge = document.createElement('span');
              newBadge.className = 'player-bar__badge';
              newBadge.title = i18n.t('player.unsaved');
              nameSpan.after(newBadge);
            }
          } else if (!isDirty && badge) {
            badge.remove();
          }
        });
        const removeBase = this._removeGlobalListeners;
        this._removeGlobalListeners = () => {
          removeBase();
          if (typeof unsubscribeDirty === 'function') unsubscribeDirty();
        };
      }
    },

    /**
     * Toggle le menu
     * @private
     */
    _toggleMenu(trigger, menu, open) {
      trigger.setAttribute('aria-expanded', open);
      menu.setAttribute('aria-hidden', !open);
      menu.classList.toggle('player-bar__menu--open', open);
    },

    /**
     * Exporte la progression du joueur en YAML
     * @private
     */
    _exportProgress() {
      if (typeof State === 'undefined' || typeof YAML === 'undefined') {
        alert(PageUtils.getTranslator()('player.exportUnavailable'));
        return;
      }

      const player = State.get('player');
      const decks = State.get('decks') || [];

      if (!player) {
        alert(PageUtils.getTranslator()('player.nothingToSave'));
        return;
      }

      // Récupérer les decks masqués
      const hiddenDecks = typeof Storage !== 'undefined' && Storage.getHiddenDecks
        ? Storage.getHiddenDecks()
        : [];

      // Récupérer les défis quotidiens/hebdos si disponibles
      const dailyChallenges = typeof Challenges !== 'undefined' && Challenges.getDailyChallenges
        ? Challenges.getDailyChallenges(player)
        : null;
      const weeklyChallenges = typeof Challenges !== 'undefined' && Challenges.getWeeklyChallenges
        ? Challenges.getWeeklyChallenges(player)
        : null;

      // Préparer les données d'export complètes
      const exportData = {
        version: '1.1',
        exportDate: new Date().toISOString(),
        player: {
          id: player.id,
          name: player.name,
          createdAt: player.createdAt,
          stats: player.stats,
          secretStats: player.secretStats || {},
          badges: player.badges || [],
          settings: player.settings || {},
          dailyChallenges: dailyChallenges,
          weeklyChallenges: weeklyChallenges
        },
        hiddenDecks: hiddenDecks,
        decksProgress: decks.map(deck => ({
          id: deck.id,
          name: deck.name,
          cards: (deck.cards || []).map(card => ({
            id: card.id,
            box: card.box,
            timesPlayed: card.timesPlayed,
            timesCorrect: card.timesCorrect,
            bestResponseTimeMs: card.bestResponseTimeMs,
            lastResponseTimeMs: card.lastResponseTimeMs,
            latencyThreshold: card.latencyThreshold,
            restUntil: card.restUntil,
            restDays: card.restDays,
            responseTimeHistory: card.responseTimeHistory
          })).filter(c => c.timesPlayed > 0 || c.box !== 'never_played')
        })).filter(d => d.cards.length > 0)
      };

      // Générer le YAML
      const yamlContent = YAML.stringify(exportData);

      // Télécharger le fichier
      const blob = new Blob([yamlContent], { type: 'text/yaml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Sanitize player name for filename (remove special characters)
      const safeName = (player.name || 'player').replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      a.download = `${safeName}-train-your-brain-progress-${new Date().toISOString().split('T')[0]}.yaml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Marquer comme propre
      State.clearDirty();

      // Notification
      if (typeof A11y !== 'undefined') {
        A11y.announce(PageUtils.getTranslator()('player.saved'), { visual: true, type: 'success' });
      }
    },

    /**
     * Fusionne le joueur d'un fichier de progression importé dans le joueur courant.
     * Le fichier est une entrée non fiable : ses champs sont ramenés à leurs types
     * (Storage.sanitizePlayer) et seuls ceux qu'il mentionne remplacent les valeurs courantes.
     * @private
     * @param {Object} currentPlayer - Joueur courant
     * @param {*} importedPlayer - Section `player` du fichier importé
     * @returns {Object} Nouveau joueur
     * @throws {Error} Si le joueur importé est inexploitable
     */
    _mergeImportedPlayer(currentPlayer, importedPlayer) {
      const raw = importedPlayer !== null && typeof importedPlayer === 'object' ? importedPlayer : null;
      // L'identité du joueur courant est conservée : seul le contenu est importé
      const clean = raw ? Storage.sanitizePlayer({ ...raw, id: currentPlayer.id, createdAt: currentPlayer.createdAt }) : null;
      if (!clean) {
        throw new Error(PageUtils.getTranslator()('common.invalidFile'));
      }

      const rawStats = raw.stats !== null && typeof raw.stats === 'object' ? raw.stats : {};
      const importedStats = {};
      Object.keys(rawStats).forEach(key => {
        if (Object.prototype.hasOwnProperty.call(clean.stats, key)) importedStats[key] = clean.stats[key];
      });

      return {
        ...currentPlayer,
        name: typeof raw.name === 'string' && raw.name !== '' ? clean.name : currentPlayer.name,
        stats: { ...currentPlayer.stats, ...importedStats },
        secretStats: { ...currentPlayer.secretStats, ...(clean.secretStats || {}) },
        badges: Array.isArray(raw.badges) ? clean.badges : (currentPlayer.badges || []),
        settings: { ...currentPlayer.settings, ...clean.settings }
      };
    },

    /**
     * Applique la progression des cartes d'un fichier importé aux decks en mémoire.
     * Chaque entrée est assainie : seuls les champs de progression sont repris (jamais la
     * question ni la réponse).
     * @private
     * @param {Object[]} decks - Decks en mémoire (modifiés)
     * @param {*} decksProgress - Section `decksProgress` du fichier importé
     */
    _applyImportedProgress(decks, decksProgress) {
      if (!Array.isArray(decksProgress)) return;
      decksProgress.forEach(savedDeck => {
        if (!savedDeck || typeof savedDeck !== 'object' || !Array.isArray(savedDeck.cards)) return;
        const deck = decks.find(d => d.id === savedDeck.id);
        if (!deck || !Array.isArray(deck.cards)) return;
        savedDeck.cards.forEach(savedCard => {
          const progress = Storage.sanitizeCardProgress(savedCard);
          if (!progress) return;
          const card = deck.cards.find(c => c.id === progress.id);
          if (card) {
            Object.assign(card, progress);
          }
        });
      });
    },

    /**
     * Importe une sauvegarde de progression
     * @private
     */
    _importProgress() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.yaml,.yml';

      input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
          const content = await file.text();
          const data = YAML.parse(content);

          if (!data || !data.player) {
            throw new Error(PageUtils.getTranslator()('common.invalidFile'));
          }

          // Confirmer l'import
          const _t = PageUtils.getTranslator();
          const playerName = data.player.name || _t('player.unknownName');
          if (!confirm(_t('player.importConfirm', { name: playerName }))) {
            return;
          }

          // Mettre à jour le joueur (champs ramenés à leurs types, voir Storage.sanitizePlayer)
          const currentPlayer = State.get('player');
          const updatedPlayer = this._mergeImportedPlayer(currentPlayer, data.player);

          // Mettre à jour les decks
          const decks = State.get('decks') || [];
          this._applyImportedProgress(decks, data.decksProgress);

          // Restaurer les decks masqués
          if (data.hiddenDecks && Array.isArray(data.hiddenDecks) && typeof Storage !== 'undefined') {
            // Effacer d'abord les decks masqués actuels puis restaurer
            const currentHidden = Storage.getHiddenDecks();
            currentHidden.forEach(id => Storage.unhideDeck(id));
            data.hiddenDecks.filter(id => typeof id === 'string').forEach(id => Storage.hideDeck(id));
          }

          // Sauvegarder
          if (typeof Storage !== 'undefined') {
            Storage.savePlayer(updatedPlayer);
            decks.forEach(deck => Storage.saveDeckProgress(deck.id, deck.cards || []));
          }

          State.set('player', updatedPlayer);
          State.set('decks', decks);
          State.clearDirty();

          if (typeof A11y !== 'undefined') {
            A11y.announce(PageUtils.getTranslator()('player.imported'), { visual: true, type: 'success' });
          }

          // Recharger la page pour appliquer les changements
          setTimeout(() => window.location.reload(), 1000);

        } catch (error) {
          console.error('Import error:', error);
          alert(PageUtils.getTranslator()('common.importError', { message: error.message }));
        }
      });

      input.click();
    },

    /**
     * Quitte la session (retour à l'écran de démarrage)
     * @private
     */
    _logout() {
      // Demander confirmation
      const player = typeof State !== 'undefined' ? State.get('player') : null;
      const playerName = player?.name || PageUtils.getTranslator()('player.defaultName');

      const message = PageUtils.getTranslator()('player.logoutConfirm', { name: playerName });

      if (!confirm(message)) {
        return;
      }

      // Sauvegarder avant de quitter (si modifications non sauvegardées)
      if (typeof State !== 'undefined' && State.isDirty()) {
        if (typeof Storage !== 'undefined' && player) {
          // Profil du joueur courant (clé par joueur, lue en priorité au chargement) et progression
          // de chaque deck : saveDeckProgress attend (deckId, cartes), pas le deck
          Storage.savePlayerById(player);
          const decks = State.get('decks') || [];
          decks.forEach(deck => Storage.saveDeckProgress(deck.id, deck.cards || []));
        }
        State.clearDirty();
      }

      // Effacer le joueur de l'état (pas du localStorage)
      if (typeof State !== 'undefined') {
        State.set('player', null);
      }

      // Rediriger vers l'écran de démarrage
      if (typeof Router !== 'undefined') {
        Router.navigate('/');
      } else {
        window.location.hash = '#/';
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 2. CARD - Carte de jeu : plus de composant ici (ComponentCard, components/card.js, supprimé)
  // ═══════════════════════════════════════════════════════════════
  // La carte de jeu est rendue par game/card-type-renderer.js et page-game.js ;
  // les médias de carte par components/card-media.js

  // ═══════════════════════════════════════════════════════════════
  // 6. BADGE - Badge individuel
  // ═══════════════════════════════════════════════════════════════

  badge: {
    /**
     * Rendu du badge
     *
     * @param {Object} props - Propriétés
     * @param {Object} props.badge - Badge { id, name, description, icon, rarity, hidden, hint }
     * @param {boolean} props.unlocked - Badge débloqué ?
     * @param {string} [props.unlockedAt] - Date de débloquage (ISO)
     * @returns {string} - HTML du badge
     */
    render(props) {
      const { badge, unlocked, unlockedAt } = props;

      // Pour les badges cachés non débloqués, masquer les infos
      const isHiddenAndLocked = badge.hidden && !unlocked;
      const displayName = isHiddenAndLocked ? '???' : badge.name;
      const displayDescription = isHiddenAndLocked ? (badge.hint || i18n.t('badge.secret')) : badge.description;
      const displayIcon = isHiddenAndLocked ? '❓' : (unlocked ? badge.icon : '🔒');

      const badgeClass = classNames(
        'badge',
        `badge--${badge.rarity}`,
        !unlocked && 'badge--locked',
        isHiddenAndLocked && 'badge--hidden'
      );

      const unlockedDate = unlockedAt ? (typeof i18n !== 'undefined' ? i18n.formatDate(unlockedAt) : new Date(unlockedAt).toLocaleDateString()) : '';

      return `
        <div class="${badgeClass}" data-badge-id="${escapeHtml(badge.id)}">
          <div class="badge__icon" aria-hidden="true">
            ${displayIcon}
          </div>
          <div class="badge__content">
            <h4 class="badge__name">${escapeHtml(displayName)}</h4>
            <p class="badge__description">${escapeHtml(displayDescription)}</p>
            ${unlocked && unlockedDate ? `
              <span class="badge__date">${PageUtils.getTranslator()('badge.unlockedOn', { date: unlockedDate })}</span>
            ` : ''}
            ${!unlocked && !isHiddenAndLocked ? `
              <span class="badge__locked-text">${PageUtils.getTranslator()('badge.locked')}</span>
            ` : ''}
            ${isHiddenAndLocked ? `
              <span class="badge__locked-text badge__secret-hint">${PageUtils.getTranslator()('badge.secret')}</span>
            ` : ''}
          </div>
        </div>
      `;
    },

    /**
     * Monte le badge dans le DOM
     *
     * @param {HTMLElement} container - Conteneur
     * @param {Object} props - Propriétés
     * @param {Object} callbacks - Callbacks { onClick }
     */
    mount(container, props, callbacks = {}) {
      container.innerHTML = this.render(props);

      if (callbacks.onClick) {
        const badgeEl = container.querySelector('.badge');
        badgeEl.addEventListener('click', () => callbacks.onClick(props.badge));
      }
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 8. NAVBAR - Barre de navigation
  // ═══════════════════════════════════════════════════════════════

  navbar: {
    /**
     * Récupère le compteur de défis (quotidiens et hebdomadaires)
     * @returns {Object} { daily: { done, total }, weekly: { done, total } }
     */
    _getChallengeProgress() {
      const defaultProgress = {
        daily: { done: 0, total: 3 },
        weekly: { done: 0, total: 5 }
      };

      if (typeof State === 'undefined') return defaultProgress;

      const dailyChallenges = State.get('dailyChallenges') || [];
      const weeklyQuests = State.get('weeklyQuests') || [];

      return {
        daily: {
          done: dailyChallenges.filter(c => c.completed).length,
          total: 3
        },
        weekly: {
          done: weeklyQuests.filter(q => q.completed).length,
          total: 5
        }
      };
    },

    /**
     * Rendu de la navbar
     *
     * @param {Object} props - Propriétés
     * @param {string} props.activeRoute - Route active
     * @returns {string} - HTML de la navbar
     */
    render(props) {
      const { activeRoute = 'home' } = props;

      // Utilise les traductions si disponibles
      const _t = PageUtils.getTranslator();

      // Récupérer la progression des défis
      const challengeProgress = this._getChallengeProgress();

      const navItems = [
        { route: 'home', label: _t('nav.home'), icon: '🏠' },
        { route: 'explore', label: _t('nav.explore'), icon: '🔍' },
        { route: 'deck-hub', label: _t('nav.create'), icon: '➕', isCreate: true },
        { route: 'stats', label: _t('nav.stats'), icon: '📊' },
        { route: 'settings', label: _t('nav.settings'), icon: '⚙️' }
      ];

      return `
        <nav class="navbar" id="main-nav" role="navigation" aria-label="${_t('nav.main')}">
          ${navItems.map(item => {
            const isActive = activeRoute === item.route;
            const itemClass = classNames(
              'navbar__item',
              isActive && 'navbar__item--active',
              item.isCreate && 'navbar__item--create'
            );

            const badgeHtml = item.badge ? `<span class="navbar__badge navbar__badge--${item.badge}">${item.badge}</span>` : '';

            return `
              <a
                href="#/${item.route}"
                class="${itemClass}"
                aria-current="${isActive ? 'page' : 'false'}"
              >
                <span class="navbar__icon" aria-hidden="true">${item.icon}</span>
                <span class="navbar__label">${item.label}${badgeHtml}</span>
              </a>
            `;
          }).join('')}

          <!-- Indicateurs de défis -->
          <a href="#/challenges" class="navbar__challenges ${activeRoute === 'challenges' ? 'navbar__challenges--active' : ''}" aria-label="${_t('nav.challenges')}">
            <span class="navbar__challenge-item navbar__challenge-item--daily" title="${_t('nav.dailyChallenges')}">
              <span class="navbar__challenge-icon">📅</span>
              <span class="navbar__challenge-count ${challengeProgress.daily.done === challengeProgress.daily.total ? 'navbar__challenge-count--complete' : ''}">${challengeProgress.daily.done}/${challengeProgress.daily.total}</span>
            </span>
            <span class="navbar__challenge-item navbar__challenge-item--weekly" title="${_t('nav.weeklyChallenges')}">
              <span class="navbar__challenge-icon">📆</span>
              <span class="navbar__challenge-count ${challengeProgress.weekly.done === challengeProgress.weekly.total ? 'navbar__challenge-count--complete' : ''}">${challengeProgress.weekly.done}/${challengeProgress.weekly.total}</span>
            </span>
          </a>

          <!-- Badge version Alpha -->
          <span class="navbar__version-badge navbar__version-badge--alpha"
                title="${_t('nav.alphaNotice')}">
            ALPHA
          </span>

          <!-- Bouton épingle (visible uniquement en mode focus) -->
          <button class="navbar__pin-toggle" id="navbar-pin-toggle" aria-label="${_t('nav.pinToggle')}">
            <span class="navbar__pin-icon">📌</span>
          </button>
        </nav>
      `;
    },

    /**
     * Monte la navbar dans le DOM
     *
     * @param {HTMLElement} container - Conteneur
     * @param {Object} props - Propriétés
     */
    mount(container, props) {
      container.innerHTML = this.render(props);
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 12. TAG SELECTOR → Extrait vers components/tag-selector.js
  // ═══════════════════════════════════════════════════════════════
  // Voir ComponentTagSelector dans components/tag-selector.js
  // Assigné dynamiquement après chargement du fichier
};

// ═══════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════

// Export pour tests Node.js et utilisation navigateur
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Components;
}
