/**
 * Page Challenge - Mode défi : choix, défi en cours, fin de défi
 *
 * Un défi est une autre façon de faire ses révisions (docs/GAMIFICATION.md, « Mode défi ») :
 * - Pages.challengeSetup : choix du mode (Parcours, Sans erreur, Contre la montre, Jusqu'au bout) et
 *   du niveau pour un deck ; Contre la montre n'est jamais présélectionné ni proposé avec le mode
 *   dyslexie ou l'espacement large, Jusqu'au bout seulement à partir de 20 cartes à réviser ;
 *   quand le deck n'a rien à réviser, propose l'entraînement libre (cartes au repos, rien
 *   d'enregistré) ;
 * - Pages.challengeGame : la page de jeu (Pages.game, dont elle hérite) avec une barre d'objectif.
 *   La réponse, la carte, l'XP, la série et les missions passent par le chemin commun
 *   (GameAnswerValidator, GameSessionManager) : aucune seconde implémentation de la progression ;
 * - Pages.challengeResults : fin de défi, qui intègre le bilan de séance (Pages.sessionSummary).
 *
 * Aucune mécanique de perte : pas de vies, pas de « défaite ». Un défi non réussi dit ce qui a été
 * appris et invite à réessayer plus tard.
 *
 * Dépendances: Pages (pages-base.js), Pages.game et Pages.sessionSummary (résolu à l'appel),
 * State, Router, Challenges, GameSessionManager, PageUtils, escapeHtml
 */

// ═══════════════════════════════════════════════════════════════
// CHALLENGE SETUP - Choix du défi pour un deck
// ═══════════════════════════════════════════════════════════════

Pages.challengeSetup = {
  /**
   * @param {Object} state - État global (`player`, `decks`)
   * @param {string[]} [params] - Paramètres de route : [deckId]
   * @returns {string} HTML, ou '' après redirection (deck inconnu ou multilingue)
   */
  render(state, params = []) {
    const _t = PageUtils.getTranslator();
    const { player, decks } = state;
    const deck = (decks || []).find(d => d.id === params[0]);
    if (!deck || deck.type === 'multilingual' || !Array.isArray(deck.cards)) {
      Router.navigate('/challenges');
      return '';
    }

    const today = PageUtils.getToday();
    const due = Challenges.dueChallengeCards(deck, today).length;
    const minCards = Challenges.CHALLENGE_MODES.steady.rules.easy.cardsCount;
    const tiers = Challenges.availableTiers(due);

    let body;
    if (tiers.length > 0) {
      body = this._renderChoice(deck, player, due, _t);
    } else if (due > 0) {
      body = `
        <section class="chalsetup__few">
          <p>${escapeHtml(_t('challengeSetup.few', { count: due, min: minCards }))}</p>
          <button type="button" class="btn btn--primary chalsetup__play-normal" data-deck-id="${escapeHtml(deck.id)}">${escapeHtml(_t('challengeSetup.playNormal'))}</button>
        </section>`;
    } else {
      body = this._renderPractice(deck, today, _t);
    }

    return `
      <div class="page page--challenge-setup">
        <main class="page__content chalsetup" id="main-content" role="main">
          <h1 class="chalsetup__title">🎯 ${escapeHtml(_t('challengeSetup.title'))}</h1>
          <p class="chalsetup__deck">📚 ${escapeHtml(deck.name)}</p>
          <p class="chalsetup__intro">${escapeHtml(_t('challengeSetup.intro'))}</p>
          ${body}
          <a href="#/challenges" class="btn btn--ghost chalsetup__back">${escapeHtml(_t('challengeSetup.back'))}</a>
        </main>
        ${PageUtils.renderFooter(player, 'challenges')}
      </div>
    `;
  },

  /**
   * Texte de niveau d'un mode : ce que le niveau demande pour ce mode (taille, objectif, temps)
   * @private
   */
  _levelLine(modeId, levelId, due, _t) {
    const rule = Challenges.CHALLENGE_MODES[modeId].rules[levelId];
    switch (modeId) {
      case 'perfect':
        return _t('challenge.levelLine.perfect', { count: rule.cardsCount, run: rule.targetRun });
      case 'speed':
        return _t('challenge.levelLine.speed', {
          count: rule.cardsCount,
          correct: rule.targetCorrect,
          time: Pages.challengeGame._formatClock(rule.cardsCount * Challenges.DIFFICULTY_LEVELS[levelId].secondsPerCard * 1000)
        });
      case 'endurance':
        return _t('challenge.levelLine.endurance', { count: due, percent: rule.minAccuracy });
      default:
        return _t('challenge.levelLine.steady', { count: rule.cardsCount, percent: rule.minAccuracy });
    }
  },

  /** Niveaux d'un mode pour un deck (re-rendus quand le mode change) @private */
  _renderLevels(modeId, due, checkedId, _t) {
    const tiers = Challenges.availableTiers(due, modeId);
    const selected = tiers.includes(checkedId) ? checkedId : tiers[0];
    return Object.keys(Challenges.DIFFICULTY_LEVELS).map(id => {
      const level = Challenges.DIFFICULTY_LEVELS[id];
      const available = tiers.includes(id);
      const detail = available
        ? this._levelLine(modeId, id, due, _t)
        : _t('challengeSetup.levelNeeds', { count: Challenges.CHALLENGE_MODES[modeId].rules[id].cardsCount });
      return `
      <label class="chalsetup__option chalsetup__option--level ${available ? '' : 'chalsetup__option--off'}">
        <input type="radio" name="chal-level" value="${id}" ${id === selected ? 'checked' : ''} ${available ? '' : 'disabled'}>
        <span class="chalsetup__option-text">
          <strong>${level.icon} ${escapeHtml(_t('challenge.diff.' + id))}</strong>
          <small>${escapeHtml(detail)}</small>
        </span>
      </label>`;
    }).join('');
  },

  /** Choix du mode et du niveau (au moins un mode possible ; Parcours est coché, toujours) @private */
  _renderChoice(deck, player, due, _t) {
    const modes = Challenges.CHALLENGE_MODES;
    const offered = Challenges.availableModes(due, player);
    const first = offered[0];
    const modeOptions = offered.map((id) => `
      <label class="chalsetup__option chalsetup__option--mode">
        <input type="radio" name="chal-mode" value="${id}" ${id === first ? 'checked' : ''}>
        <span class="chalsetup__option-text">
          <strong>${modes[id].icon} ${escapeHtml(_t('challenge.mode.' + id))}</strong>
          <small>${escapeHtml(_t('challenge.modeDesc.' + id))}</small>
        </span>
      </label>`).join('');

    const firstScore = Challenges.getBestScore(player, first, Challenges.availableTiers(due, first)[0]);

    return `
      <p class="chalsetup__due">${escapeHtml(_t('challengeSetup.dueCount', { count: due }))}</p>
      <fieldset class="chalsetup__group chalsetup__modes">
        <legend>${escapeHtml(_t('challengeSetup.modeLegend'))}</legend>
        ${modeOptions}
      </fieldset>
      <p class="chalsetup__help chalsetup__help--speed" hidden>${escapeHtml(_t('challengeSetup.speedHelp'))}</p>
      <p class="chalsetup__help chalsetup__help--endurance" hidden>${escapeHtml(_t('challengeSetup.enduranceHelp'))}</p>
      <fieldset class="chalsetup__group">
        <legend>${escapeHtml(_t('challengeSetup.levelLegend'))}</legend>
        <div class="chalsetup__levels">${this._renderLevels(first, due, null, _t)}</div>
      </fieldset>
      <p class="chalsetup__record" aria-live="polite">${firstScore > 0 ? escapeHtml(_t('challengeSetup.record', { score: firstScore })) : ''}</p>
      <p class="chalsetup__help">${escapeHtml(_t('challengeSetup.bonusNote', { xp: Challenges.CHALLENGE_BONUS_XP }))}</p>
      <button type="button" class="btn btn--primary chalsetup__start" data-deck-id="${escapeHtml(deck.id)}">${escapeHtml(_t('challengeSetup.start'))}</button>
    `;
  },

  /** Rien à réviser : entraînement libre sur des cartes au repos, annoncé comme tel @private */
  _renderPractice(deck, today, _t) {
    const resting = Challenges.restingCards(deck, today).length;
    if (resting === 0) {
      return `<section class="chalsetup__nothing"><p>${escapeHtml(_t('challengeSetup.nothing'))}</p></section>`;
    }
    return `
      <section class="chalsetup__practice">
        <p>${escapeHtml(_t('challengeSetup.nothing'))}</p>
        <h2 class="chalsetup__practice-title">🌿 ${escapeHtml(_t('challengeSetup.practiceTitle'))}</h2>
        <p>${escapeHtml(_t('challengeSetup.practiceNote'))}</p>
        <p class="chalsetup__due">${escapeHtml(_t('challengeSetup.practiceCount', { count: resting }))}</p>
        <button type="button" class="btn btn--primary chalsetup__practice-start" data-deck-id="${escapeHtml(deck.id)}">${escapeHtml(_t('challengeSetup.practiceStart'))}</button>
      </section>`;
  },

  mount(container, state, params = []) {
    container.innerHTML = this.render(state, params);
    const _t = PageUtils.getTranslator();
    const player = state.player;

    const selected = (name) => {
      const input = container.querySelector(`input[name="${name}"]:checked`);
      return input ? input.value : null;
    };

    const start = container.querySelector('.chalsetup__start');
    if (start) {
      const due = Challenges.dueChallengeCards(
        state.decks.find(d => d.id === start.dataset.deckId), PageUtils.getToday()).length;
      const record = container.querySelector('.chalsetup__record');
      const levels = container.querySelector('.chalsetup__levels');
      const updateRecord = () => {
        const score = Challenges.getBestScore(player, selected('chal-mode'), selected('chal-level'));
        record.textContent = score > 0 ? _t('challengeSetup.record', { score }) : '';
      };
      // Le mode change ce que les niveaux demandent (cartes, objectif, temps) : on les redessine
      const updateMode = () => {
        const mode = selected('chal-mode');
        levels.innerHTML = this._renderLevels(mode, due, selected('chal-level'), _t);
        levels.querySelectorAll('input[name="chal-level"]').forEach(input => input.addEventListener('change', updateRecord));
        container.querySelectorAll('.chalsetup__help--speed, .chalsetup__help--endurance').forEach(help => {
          help.hidden = !help.classList.contains(`chalsetup__help--${mode}`);
        });
        updateRecord();
      };
      container.querySelectorAll('input[name="chal-mode"]').forEach(input => input.addEventListener('change', updateMode));
      levels.querySelectorAll('input[name="chal-level"]').forEach(input => input.addEventListener('change', updateRecord));

      start.addEventListener('click', () => {
        Router.navigate(`/challenge/${selected('chal-mode')}/${selected('chal-level')}/${start.dataset.deckId}`);
      });
    }

    const practice = container.querySelector('.chalsetup__practice-start');
    if (practice) {
      practice.addEventListener('click', () => {
        Router.navigate(`/challenge/practice/easy/${practice.dataset.deckId}`);
      });
    }

    const playNormal = container.querySelector('.chalsetup__play-normal');
    if (playNormal) {
      playNormal.addEventListener('click', () => Router.navigate(`/game/${playNormal.dataset.deckId}`));
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// CHALLENGE GAME - Défi en cours (page de jeu + barre d'objectif)
// ═══════════════════════════════════════════════════════════════

// Hérite de Pages.game : cartes, réponses, animations et chemin de progression sont ceux d'une
// séance normale. Les remontages de Pages.game (`this.mount`) passent par cet objet, la barre
// d'objectif et le chronomètre sont donc remis en place à chaque carte.
Pages.challengeGame = Object.create(Pages.game);

Object.assign(Pages.challengeGame, {
  _timerInterval: null,

  /** Temps restant en « m:ss » (arrondi à la seconde supérieure, jamais négatif) @private */
  _formatClock(ms) {
    const total = Math.max(0, Math.ceil(ms / 1000));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  },

  /** Objectif du défi, dans la langue courante (selon le mode) @private */
  _goalText(challenge, _t) {
    const target = challenge.target;
    switch (challenge.modeId) {
      case 'perfect': return _t('challenge.goal.perfect', { run: target.run });
      case 'speed': return _t('challenge.goal.speed', { correct: target.correct });
      case 'endurance': return _t('challenge.goal.endurance', { percent: target.accuracy });
      default: return _t('challenge.goal.steady', { percent: target.accuracy });
    }
  },

  /** Barre du défi : mode, objectif, avancement, chronomètre éventuel @private */
  _renderBar(session) {
    const _t = PageUtils.getTranslator();
    const challenge = session.challenge;
    const label = escapeHtml(_t('challenge.barLabel'));

    if (challenge.practice) {
      return `
        <div class="chalbar chalbar--practice" role="region" aria-label="${label}">
          <span class="chalbar__practice">🌿 ${escapeHtml(_t('challenge.practiceBanner'))}</span>
        </div>`;
    }

    const evaluation = Challenges.evaluateChallenge(session);
    const mode = Challenges.CHALLENGE_MODES[challenge.modeId];
    const level = Challenges.DIFFICULTY_LEVELS[challenge.difficulty];
    const perfect = challenge.modeId === 'perfect';
    const goal = this._goalText(challenge, _t);
    const progress = perfect
      ? _t('challenge.progress.perfect', { run: evaluation.bestRun })
      : _t('challenge.progress.steady', { correct: evaluation.correct, answered: evaluation.answered });
    const remaining = Challenges.remainingMs(session);

    return `
      <div class="chalbar" role="region" aria-label="${label}">
        <span class="chalbar__mode">${mode.icon} ${escapeHtml(_t('challenge.mode.' + challenge.modeId))} · ${level.icon} ${escapeHtml(_t('challenge.diff.' + challenge.difficulty))}</span>
        <span class="chalbar__goal">${escapeHtml(goal)}</span>
        <span class="chalbar__progress ${perfect ? 'chalbar__run' : 'chalbar__correct'}">${escapeHtml(progress)}</span>
        ${remaining === null ? '' : `<span class="chalbar__timer" id="chal-clock" role="timer" aria-label="${escapeHtml(_t('challenge.timerLabel'))}">${this._formatClock(remaining)}</span>`}
      </div>`;
  },

  render(state) {
    const session = state.currentSession;
    const html = Pages.game.render.call(this, state);
    if (!session || !session.challenge) return html;

    let out = html.replace('</header>', `</header>${this._renderBar(session)}`);
    if (session.challenge.practice) {
      // Entraînement libre : rien ne change pour les cartes, donc ni piles, ni destination, ni XP
      const _t = PageUtils.getTranslator();
      const note = escapeHtml(_t(session.lastResult && session.lastResult.isCorrect ? 'challenge.practiceRight' : 'challenge.practiceWrong'));
      out = out
        .replace('class="page page--game"', 'class="page page--game chal--practice"')
        .replace(/<div class="game__card-destination[^"]*">[\s\S]*?<\/div>/, '')
        .replace(/<div class="game__card-xp">[\s\S]*?<\/div>/, '')
        // Le texte habituel parle de « carte maîtrisée » : faux ici, rien n'est enregistré
        .replace(/(<div class="game__card-result-subtitle">)[\s\S]*?(<\/div>)/, (m, open, close) => `${open}${note}${close}`);
    }
    return out;
  },

  _clearTimer() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  },

  mount(container, state) {
    this._clearTimer();
    const session = state.currentSession;
    const challenge = session && session.challenge;

    // Chronomètre arrivé à zéro entre deux cartes : le défi s'arrête doucement
    if (challenge && challenge.timed && !session.isShowingFeedback && Challenges.remainingMs(session) <= 0) {
      GameSessionManager.stopChallenge(state, 'time');
      return;
    }

    Pages.game.mount.call(this, container, state);
    if (!challenge) return;
    this._rebindQuit(container, challenge);
    if (challenge.timed && !session.isShowingFeedback) this._startTimer(container);
  },

  /** Le bouton retour confirme avec le texte du défi (les cartes déjà validées sont gardées) @private */
  _rebindQuit(container, challenge) {
    const back = container.querySelector('.game__back');
    if (!back) return;
    const fresh = back.cloneNode(true);
    back.replaceWith(fresh);
    fresh.addEventListener('click', () => {
      const _t = PageUtils.getTranslator();
      if (confirm(_t(challenge.practice ? 'challenge.quitPracticeConfirm' : 'challenge.quitConfirm'))) {
        this._clearTimer();
        State.set('currentSession', null);
        history.back();
      }
    });
  },

  /** Affichage du temps restant ; le budget n'est décompté que pendant les questions @private */
  _startTimer(container) {
    const clock = container.querySelector('#chal-clock');
    if (!clock) return;
    this._timerInterval = setInterval(() => {
      const session = State.get('currentSession');
      if (!clock.isConnected || !session || !session.challenge || session.isShowingFeedback) {
        this._clearTimer();
        return;
      }
      const left = Challenges.remainingMs(session);
      clock.textContent = this._formatClock(left);
      if (left <= 0) {
        this._clearTimer();
        GameSessionManager.stopChallenge(State.getAll(), 'time');
      }
    }, 1000);
  }
});

// ═══════════════════════════════════════════════════════════════
// CHALLENGE RESULTS - Fin de défi
// ═══════════════════════════════════════════════════════════════

Pages.challengeResults = {
  /** Panneau du résultat : titre, objectif, chiffres, score affiché, bonus @private */
  _renderPanel(session) {
    const _t = PageUtils.getTranslator();
    const challenge = session.challenge;
    const outcome = session.challengeOutcome;

    if (challenge.practice) {
      return `
        <section class="chalresult chalresult--practice" aria-labelledby="chalresult-title">
          <h1 class="session-summary__title chalresult__title" id="chalresult-title">🌿 ${escapeHtml(_t('challengeResults.practiceTitle'))}</h1>
          <p class="chalresult__count">${escapeHtml(_t('challengeResults.practiceCount', { correct: outcome.correct, answered: outcome.answered }))}</p>
          <p class="chalresult__note">${escapeHtml(_t('challengeResults.practiceNote'))}</p>
          <div class="chalresult__actions">
            <button type="button" class="btn btn--primary chalresult__another">${escapeHtml(_t('challengeResults.another'))}</button>
            <button type="button" class="btn btn--secondary chalresult__back">${escapeHtml(_t('challengeResults.back'))}</button>
          </div>
        </section>`;
    }

    const perfect = challenge.modeId === 'perfect';
    const level = Challenges.DIFFICULTY_LEVELS[challenge.difficulty];
    const goal = Pages.challengeGame._goalText(challenge, _t);
    const modeLine = `${Challenges.CHALLENGE_MODES[challenge.modeId].icon} ${_t('challenge.mode.' + challenge.modeId)} · ${level.icon} ${_t('challenge.diff.' + challenge.difficulty)}`;
    const halves = outcome.halves
      ? `<p class="chalresult__halves">${escapeHtml(_t('challengeResults.halves', {
        first: outcome.halves[0].correct, firstTotal: outcome.halves[0].answered,
        second: outcome.halves[1].correct, secondTotal: outcome.halves[1].answered
      }))}</p>` : '';
    const success = outcome.success;

    let reward = '';
    if (success && outcome.bonusXp > 0) {
      reward = `<p class="chalresult__bonus">${escapeHtml(_t('challengeResults.bonus', { xp: outcome.bonusXp }))}</p>`;
    } else if (success) {
      reward = `<p class="chalresult__bonus-done">${escapeHtml(_t('challengeResults.bonusDone'))}</p>`;
    }

    const record = outcome.isNewRecord
      ? `<p class="chalresult__record">${escapeHtml(_t('challengeResults.record'))}</p>`
      : (outcome.previousBest > 0 ? `<p class="chalresult__best">${escapeHtml(_t('challengeResults.bestScore', { score: outcome.previousBest }))}</p>` : '');

    return `
      <section class="chalresult ${success ? 'chalresult--success' : 'chalresult--again'}" aria-labelledby="chalresult-title">
        <h1 class="session-summary__title chalresult__title" id="chalresult-title">${success ? '🎉 ' : '🌱 '}${escapeHtml(_t(success ? 'challengeResults.success' : 'challengeResults.again'))}</h1>
        ${success ? `<p class="chalresult__well-done">${escapeHtml(_t('challengeResults.wellDone'))}</p>` : ''}
        <p class="chalresult__mode">${escapeHtml(modeLine)}</p>
        <p class="chalresult__goal">${escapeHtml(goal)}</p>
        ${halves}
        ${outcome.timedOut ? `<p class="chalresult__timeup">${escapeHtml(_t('challengeResults.timeUp'))}</p>` : ''}
        <div class="chalresult__stats">
          <div class="chalresult__stat">
            <div class="chalresult__stat-value">${outcome.correct}/${outcome.answered}</div>
            <div class="chalresult__stat-label">${escapeHtml(_t('challengeResults.statCorrect'))}</div>
          </div>
          <div class="chalresult__stat">
            <div class="chalresult__stat-value">${outcome.bestRun}</div>
            <div class="chalresult__stat-label">${escapeHtml(_t('challengeResults.statBestRun'))}</div>
          </div>
          <div class="chalresult__stat">
            <div class="chalresult__stat-value chalresult__score">${outcome.score}</div>
            <div class="chalresult__stat-label">${escapeHtml(_t('challengeResults.statScore'))}</div>
          </div>
        </div>
        ${record}
        ${reward}
        ${success ? '' : `<p class="chalresult__retry-hint">${escapeHtml(_t('challengeResults.againHint'))}</p>`}
        <div class="chalresult__actions">
          <button type="button" class="btn btn--primary chalresult__another">${escapeHtml(_t('challengeResults.another'))}</button>
        </div>
      </section>`;
  },

  /** Séance sans carte répondue ou entraînement libre : pas de bilan de séance à intégrer @private */
  _isStandalone(session) {
    return session.challenge.practice || session.results.length === 0;
  },

  render(state) {
    const session = state.currentSession;
    if (!session || !session.challenge || !session.challengeOutcome) {
      Router.navigate('/challenges');
      return '';
    }
    const panel = this._renderPanel(session);

    if (this._isStandalone(session)) {
      return `
        <div class="page page--challenge-results">
          <div class="session-summary" role="main">${panel}</div>
        </div>`;
    }
    // Le bilan de séance (mémoire, badges, missions) suit le panneau du défi, qui remplace son titre
    const summary = Pages.sessionSummary.render(state);
    const title = /<h1[^>]*session-summary__title[^>]*>[\s\S]*?<\/h1>/;
    if (title.test(summary)) return summary.replace(title, () => panel);
    const root = /<div class="session-summary"[^>]*>/;
    return root.test(summary) ? summary.replace(root, (open) => open + panel) : panel + summary;
  },

  mount(container, state) {
    const session = state.currentSession;
    if (!session || !session.challenge || !session.challengeOutcome) {
      Router.navigate('/challenges');
      return;
    }

    if (this._isStandalone(session)) {
      container.innerHTML = this.render(state);
    } else {
      // Réutilise le montage du bilan de séance (boutons, confettis) avec le rendu du défi ;
      // les confettis sont réservés à un défi réussi
      const outcome = session.challengeOutcome;
      const host = Object.create(Pages.sessionSummary, {
        render: { value: (s) => this.render(s) },
        _shouldCelebrate: { value: () => !!outcome.success }
      });
      host.mount(container, state);
    }

    const leave = (path) => {
      State.set('currentSession', null);
      State.set('showSessionSummary', false);
      Router.navigate(path);
    };
    container.querySelector('.chalresult__another')?.addEventListener('click', () => {
      leave(`/challenge-setup/${session.deckId}`);
    });
    container.querySelector('.chalresult__back')?.addEventListener('click', () => leave('/challenges'));
  }
};
