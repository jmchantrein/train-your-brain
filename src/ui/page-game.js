/**
 * Page Game - Session de jeu avec paquets de cartes
 *
 * Supporte deux types de sessions :
 * - Standard : cartes avec question/réponse
 * - Multilingue : mots avec traductions, modes (translation, dictation, image)
 *
 * Modules extraits :
 * - GameCardTypeRenderer : rendu des inputs par type
 * - GameAnswerExtractor : extraction des réponses
 * - GameAnswerValidator : validation des réponses
 * - GameSessionTracker : mise à jour carte/joueur
 * - GameSecretStats : stats pour badges secrets
 * - GameSessionManager : orchestration session
 *
 * Dépendances: escapeHtml, renderWithLatex (components.js)
 * Modules: State, Router, Storage, Leitner, XP, Validator, Badges, Challenges, Audio, Multilingual
 */

// ═══════════════════════════════════════════════════════════════
// GAME - Session de jeu avec paquets de cartes
// ═══════════════════════════════════════════════════════════════

// Niveaux visuels de la série de cartes vertes : définis une seule fois, dans XP.STREAK_TIERS
// (3 actif, 6 chaud, 12 épique, 25 légendaire, 50 mythique), comme les paliers de bonus XP.
const STREAK_TIER_ORDER = ['none', 'active', 'hot', 'epic', 'legendary', 'mythic'];

Pages.game = {
  // État local pour les animations
  _animationState: {
    isFlipping: false,
    isFlying: false,
    targetPile: null
  },

  render(state) {
    const { currentSession } = state;
    const _t = PageUtils.getTranslator();

    if (!currentSession) {
      return `
        <div class="page page--game">
          <div class="game__loading">
            <div class="game__loading-spinner"></div>
            <span>${_t('app.loading')}</span>
          </div>
        </div>
      `;
    }

    const { cards, currentIndex, isShowingFeedback, lastResult, stats } = currentSession;
    const currentCard = cards[currentIndex];
    const progressPercent = ((currentIndex + (isShowingFeedback ? 1 : 0)) / cards.length) * 100;

    // Compter les cartes dans chaque pile
    const pileCounts = this._getPileCounts(currentSession);
    const remainingCards = cards.length - currentIndex - (isShowingFeedback ? 1 : 0);

    // Streak actuel
    const currentStreak = stats?.currentGreenStreak || 0;
    const streakTierRank = STREAK_TIER_ORDER.indexOf(XP.getStreakTier(currentStreak));

    return `
      <div class="page page--game">
        <h1 class="sr-only">${_t('game.title')}</h1>
        <div class="game__background"></div>

        <header class="game__header">
          <button class="game__back" aria-label="${_t('common.quit')}">
            <span class="game__back-icon">←</span>
          </button>

          ${this._renderDirectionIndicator(currentSession)}

          <div class="game__progress-section">
            <div class="game__progress-info">
              <span class="game__progress-current">${currentIndex + 1}</span>
              <span class="game__progress-separator">/</span>
              <span class="game__progress-total">${cards.length}</span>
            </div>
            <div class="game__progress-bar">
              <div class="game__progress-fill" style="width: ${progressPercent}%"></div>
            </div>
          </div>

          ${streakTierRank >= 1 ? `
            <div class="game__streak ${streakTierRank >= 2 ? 'game__streak--hot' : ''} ${streakTierRank >= 3 ? 'game__streak--fire' : ''} ${streakTierRank >= 4 ? 'game__streak--legendary' : ''}">
              <span class="game__streak-icon">🔥</span>
              <span class="game__streak-count">${currentStreak}</span>
            </div>
          ` : ''}
        </header>

        <main class="game__table">
          <!-- Paquets de destination en haut -->
          <div class="game__piles-row">
            <div class="game__pile game__pile--purple" data-pile="purple" tabindex="0"
                 aria-label="${_t('game.leitner.purple.title')}"
                 data-tooltip="${_t('game.leitner.purple.tooltip')}">
              <div class="game__pile-cards">
                ${this._renderPileStack(pileCounts.purple, 'purple')}
              </div>
              <div class="game__pile-symbol" aria-hidden="true">♥</div>
              <div class="game__pile-count">${pileCounts.purple}</div>
              <div class="game__pile-label">${_t('game.pile.heart')}</div>
              <div class="game__pile-tooltip">${_t('game.leitner.purple.tooltip')}</div>
            </div>

            <div class="game__pile game__pile--orange" data-pile="orange" tabindex="0"
                 aria-label="${_t('game.leitner.orange.title')}"
                 data-tooltip="${_t('game.leitner.orange.tooltip')}">
              <div class="game__pile-cards">
                ${this._renderPileStack(pileCounts.orange, 'orange')}
              </div>
              <div class="game__pile-symbol" aria-hidden="true">♣</div>
              <div class="game__pile-count">${pileCounts.orange}</div>
              <div class="game__pile-label">${_t('game.pile.club')}</div>
              <div class="game__pile-tooltip">${_t('game.leitner.orange.tooltip')}</div>
            </div>

            <div class="game__pile game__pile--green" data-pile="green" tabindex="0"
                 aria-label="${_t('game.leitner.green.title')}"
                 data-tooltip="${_t('game.leitner.green.tooltip')}">
              <div class="game__pile-cards">
                ${this._renderPileStack(pileCounts.green, 'green')}
              </div>
              <div class="game__pile-symbol" aria-hidden="true">♠</div>
              <div class="game__pile-count">${pileCounts.green}</div>
              <div class="game__pile-label">${_t('game.pile.spade')}</div>
              <div class="game__pile-tooltip">${_t('game.leitner.green.tooltip')}</div>
            </div>
          </div>

          <!-- Zone centrale : Pioche à gauche + Carte au centre + Sidebar à droite -->
          <div class="game__play-area">
            <!-- Pioche à gauche -->
            <div class="game__draw-pile" data-pile="draw">
              <div class="game__pile-cards">
                ${this._renderPileStack(remainingCards, 'blue')}
              </div>
              <div class="game__pile-symbol game__pile-symbol--blue">♦</div>
              <div class="game__pile-count">${remainingCards}</div>
              <div class="game__pile-label">${_t('game.pile.draw')}</div>
            </div>

            <!-- Carte centrale -->
            <div class="game__center">
              <div class="game__flipcard ${isShowingFeedback ? 'game__flipcard--flipped' : ''}" id="game-flipcard">
                <div class="game__flipcard-inner">
                  <!-- Face avant : Question -->
                  <div class="game__flipcard-front">
                    ${this._renderCardFront(currentCard)}
                  </div>
                  <!-- Face arrière : Feedback -->
                  <div class="game__flipcard-back">
                    ${isShowingFeedback ? this._renderCardBack(currentCard, lastResult) : ''}
                  </div>
                </div>
              </div>

              <!-- Carte fantôme pour animation de vol -->
              <div class="game__flying-card" id="flying-card" style="display: none;"></div>
            </div>

            <!-- Sidebar à droite : stats + jauge streak -->
            <div class="game__sidebar">
              <div class="game__sidebar-stat">
                <span class="game__sidebar-stat-value">${stats?.correctAnswers || 0}</span>
                <span class="game__sidebar-stat-icon">✓</span>
              </div>

              ${this._renderStreakGaugeVertical(currentStreak)}

              <div class="game__sidebar-stat">
                <span class="game__sidebar-stat-value">${stats?.totalXpEarned || 0}</span>
                <span class="game__sidebar-stat-icon">⭐</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    `;
  },

  _renderPileStack(count, color) {
    const maxVisible = Math.min(count, 5);
    let html = '';
    for (let i = 0; i < maxVisible; i++) {
      const offset = i * 2;
      html += `<div class="game__pile-card game__pile-card--${color}" style="transform: translateY(${-offset}px) rotate(${(i - 2) * 2}deg);"></div>`;
    }
    return html;
  },

  /**
   * Rendu de la jauge de streak horizontale intégrée au footer
   * Affiche la progression vers le prochain milestone avec bonus XP
   * @param {number} currentStreak - Nombre de cartes vertes consécutives
   * @returns {string} HTML de la jauge
   */
  _renderStreakGauge(currentStreak) {
    // Ne pas afficher si streak = 0
    if (currentStreak < 1) {
      return '<div class="streak-gauge streak-gauge--empty"></div>';
    }

    // Récupérer les milestones depuis XP (progression logarithmique)
    const allMilestones = (typeof XP !== 'undefined' ? XP.STREAK_BONUSES : [
      { streak: 3, xp: 5 }, { streak: 6, xp: 15 }, { streak: 9, xp: 30 },
      { streak: 12, xp: 50 }, { streak: 18, xp: 75 }, { streak: 25, xp: 110 }
    ]);

    let nextMilestone = allMilestones.find(m => m.streak > currentStreak);
    let prevMilestone = allMilestones.filter(m => m.streak <= currentStreak).pop();

    // Calcul du remplissage (de 0 au prochain milestone)
    const startValue = prevMilestone ? prevMilestone.streak : 0;
    const endValue = nextMilestone ? nextMilestone.streak : (prevMilestone ? prevMilestone.streak : 12);
    const fillPercent = nextMilestone
      ? ((currentStreak - startValue) / (endValue - startValue)) * 100
      : 100;

    // Classe de style selon le niveau
    let gaugeClass = '';
    if (currentStreak >= 50) {
      gaugeClass = 'streak-gauge--mythic';
    } else if (currentStreak >= 25) {
      gaugeClass = 'streak-gauge--legendary';
    } else if (currentStreak >= 12) {
      gaugeClass = 'streak-gauge--epic';
    } else if (currentStreak >= 6) {
      gaugeClass = 'streak-gauge--hot';
    } else if (currentStreak >= 3) {
      gaugeClass = 'streak-gauge--active';
    }

    return `
      <div class="streak-gauge ${gaugeClass}" aria-label="${PageUtils.getTranslator()('game.streakLabel', { count: currentStreak })}">
        <span class="streak-gauge__icon">${this._getStreakLabel(currentStreak)}</span>

        <div class="streak-gauge__current">
          <span class="streak-gauge__count">${currentStreak}</span>
          ${nextMilestone ? `<span class="streak-gauge__next">→ ${nextMilestone.streak}</span>` : ''}
        </div>

        <div class="streak-gauge__track">
          <div class="streak-gauge__fill" style="width: ${Math.min(fillPercent, 100)}%"></div>
        </div>

        ${prevMilestone ? `
          <div class="streak-gauge__bonus">+${prevMilestone.xp} XP</div>
        ` : ''}
      </div>
    `;
  },

  _getStreakLabel(streak) {
    if (streak >= 75) return '👑';
    if (streak >= 50) return '💎';
    if (streak >= 35) return '🌟';
    if (streak >= 25) return '⭐⭐';
    if (streak >= 18) return '⭐';
    if (streak >= 12) return '🔥🔥🔥🔥';
    if (streak >= 9) return '🔥🔥🔥';
    if (streak >= 6) return '🔥🔥';
    return '🔥';
  },

  /**
   * Rendu de la jauge de streak verticale pour la sidebar
   * @param {number} currentStreak - Nombre de cartes vertes consécutives
   * @returns {string} HTML de la jauge verticale
   */
  _renderStreakGaugeVertical(currentStreak) {
    // Ne pas afficher si streak = 0
    if (currentStreak < 1) {
      return '<div class="streak-vertical streak-vertical--empty"></div>';
    }

    // Récupérer les milestones depuis XP
    const allMilestones = (typeof XP !== 'undefined' ? XP.STREAK_BONUSES : [
      { streak: 3, xp: 5 }, { streak: 6, xp: 15 }, { streak: 9, xp: 30 },
      { streak: 12, xp: 50 }, { streak: 18, xp: 75 }, { streak: 25, xp: 110 }
    ]);

    let nextMilestone = allMilestones.find(m => m.streak > currentStreak);
    let prevMilestone = allMilestones.filter(m => m.streak <= currentStreak).pop();

    // Calcul du remplissage
    const startValue = prevMilestone ? prevMilestone.streak : 0;
    const endValue = nextMilestone ? nextMilestone.streak : (prevMilestone ? prevMilestone.streak : 12);
    const fillPercent = nextMilestone
      ? ((currentStreak - startValue) / (endValue - startValue)) * 100
      : 100;

    // Classe de style selon le niveau
    let gaugeClass = '';
    if (currentStreak >= 50) {
      gaugeClass = 'streak-vertical--mythic';
    } else if (currentStreak >= 25) {
      gaugeClass = 'streak-vertical--legendary';
    } else if (currentStreak >= 12) {
      gaugeClass = 'streak-vertical--epic';
    } else if (currentStreak >= 6) {
      gaugeClass = 'streak-vertical--hot';
    } else if (currentStreak >= 3) {
      gaugeClass = 'streak-vertical--active';
    }

    return `
      <div class="streak-vertical ${gaugeClass}" aria-label="${PageUtils.getTranslator()('game.streakLabel', { count: currentStreak })}">
        <div class="streak-vertical__header">
          <span class="streak-vertical__icon">${this._getStreakLabel(currentStreak)}</span>
          <span class="streak-vertical__count">${currentStreak}</span>
        </div>

        <div class="streak-vertical__track">
          <div class="streak-vertical__fill" style="height: ${Math.min(fillPercent, 100)}%"></div>
        </div>

        ${nextMilestone ? `
          <div class="streak-vertical__next">→${nextMilestone.streak}</div>
        ` : ''}

        ${prevMilestone ? `
          <div class="streak-vertical__bonus">+${prevMilestone.xp}</div>
        ` : ''}
      </div>
    `;
  },

  _renderDirectionIndicator(session) {
    if (!session || session.type !== 'multilingual') {
      return '';
    }

    const currentCard = session.cards[session.currentIndex];
    if (!currentCard) return '';

    const { mode, sourceLang, targetLang } = currentCard;
    const flags = typeof Multilingual !== 'undefined' ? Multilingual.LANGUAGE_FLAGS : {};
    const labels = typeof Multilingual !== 'undefined' ? Multilingual.LANGUAGE_LABELS : {};

    let indicator = '';

    if (mode === 'image') {
      indicator = `
        <span class="game__direction-icon">🖼️</span>
        <span class="game__direction-arrow">→</span>
        <span class="game__direction-lang">${flags[targetLang] || ''} ${escapeHtml(labels[targetLang] || targetLang)}</span>
      `;
    } else if (mode === 'dictation') {
      indicator = `
        <span class="game__direction-icon">🔊</span>
        <span class="game__direction-lang">${flags[sourceLang] || ''}</span>
        <span class="game__direction-arrow">→</span>
        <span class="game__direction-lang">${flags[targetLang] || ''}</span>
      `;
    } else {
      indicator = `
        <span class="game__direction-lang">${flags[sourceLang] || ''} ${escapeHtml(labels[sourceLang] || sourceLang)}</span>
        <span class="game__direction-arrow">→</span>
        <span class="game__direction-lang">${flags[targetLang] || ''} ${escapeHtml(labels[targetLang] || targetLang)}</span>
      `;
    }

    return `<div class="game__direction">${indicator}</div>`;
  },

  _renderCardFront(card) {
    const _t = PageUtils.getTranslator();

    // Protection contre carte undefined
    if (!card) {
      return `<div class="game__card-content game__card-content--front">
        <div class="game__card-question">${_t('game.loading') || 'Chargement...'}</div>
      </div>`;
    }

    // Carte multilingue
    if (card.word && card.direction) {
      return this._renderMultilingualCardFront(card);
    }

    // Déléguer le rendu de l'input au module dédié
    const inputHtml = GameCardTypeRenderer.renderByType(card);

    // Rendre les médias
    let mediaHtml = this._renderCardMedia(card);

    // Pour les cartes cloze, la question est déjà incluse dans inputHtml
    // Ne pas afficher la question séparément (sinon elle apparaît 2 fois)
    const isCloze = card.type === 'cloze';

    // Carte standard (non-cloze) : afficher la question séparément
    const questionHtml = !isCloze && typeof renderWithLatex !== 'undefined'
      ? renderWithLatex(card.question)
      : (!isCloze ? escapeHtml(card.question) : '');

    return `
      <div class="game__card-content game__card-content--front">
        ${!isCloze ? `<div class="game__card-question">${questionHtml}</div>` : ''}
        ${mediaHtml ? `<div class="game__card-media">${mediaHtml}</div>` : ''}
        <div class="game__card-input-area">
          ${inputHtml}
          <div class="game__card-buttons">
            <button class="game__card-submit" id="submit-btn">
              ${_t('game.validate')}
            </button>
            <button class="game__card-skip" id="skip-btn" title="${_t('game.iDontKnow') || 'Je ne sais pas'}">
              ${_t('game.iDontKnow') || 'Je ne sais pas'}
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Rend un SVG de deck affichable par <img> : contrairement au SVG inline,
   * <img> exige l'espace de noms XML et une taille intrinsèque.
   * @param {string} svg - Source SVG fournie par le deck
   * @returns {string}
   */
  _prepareSvgForImg(svg) {
    return String(svg).replace(/<svg\b([^>]*)>/i, (tag, attrs) => {
      let extra = '';
      if (!/\sxmlns\s*=/.test(attrs)) {
        extra += ' xmlns="http://www.w3.org/2000/svg"';
      }
      const viewBox = attrs.match(/\sviewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)\s*["']/i);
      if (viewBox && !/\swidth\s*=/.test(attrs) && !/\sheight\s*=/.test(attrs)) {
        extra += ` width="${viewBox[1]}" height="${viewBox[2]}"`;
      }
      return extra ? `<svg${extra}${attrs}>` : tag;
    });
  },

  _renderCardMedia(card) {
    let mediaHtml = '';

    // Support du format media objet (type, format, data)
    if (card.media) {
      if (card.media.type === 'image') {
        if (card.media.format === 'svg' && card.media.data) {
          // SVG non fiable : rendu via <img> (les scripts et gestionnaires d'événements n'y sont pas exécutés)
          const svgSrc = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(this._prepareSvgForImg(card.media.data));
          mediaHtml += `<div class="game__card-image game__card-image--svg"><img src="${svgSrc}" alt="${PageUtils.getTranslator()('game.cardImageAlt')}"></div>`;
        } else if (card.media.data) {
          const src = card.media.data.startsWith('data:') || card.media.data.startsWith('http')
            ? card.media.data
            : `data:image/${card.media.format || 'png'};base64,${card.media.data}`;
          mediaHtml += `<div class="game__card-image">${CardMedia.image(src, { alt: PageUtils.getTranslator()('game.cardImageAlt') })}</div>`;
        }
      } else if (card.media.type === 'audio' && card.media.data) {
        const src = card.media.data.startsWith('data:')
          ? card.media.data
          : `data:audio/${card.media.format || 'mp3'};base64,${card.media.data}`;
        mediaHtml += `<div class="game__card-audio">${CardMedia.audio(src)}</div>`;
      }
    }

    // Support legacy (imageUrl, audioUrl)
    if (card.imageUrl) {
      mediaHtml += `<div class="game__card-image">${CardMedia.image(card.imageUrl, { alt: PageUtils.getTranslator()('game.cardImageAlt') })}</div>`;
    }
    if (card.audioUrl) {
      mediaHtml += `<div class="game__card-audio">${CardMedia.audio(card.audioUrl)}</div>`;
    }

    return mediaHtml;
  },

  _renderMultilingualCardFront(card) {
    const _t = PageUtils.getTranslator();
    const { word, mode, sourceLang, targetLang } = card;

    let questionHtml = '';
    let mediaHtml = '';
    let audioButtonHtml = '';

    // Récupérer l'audio de la langue source (chemin corrigé: translations[lang].audio)
    const sourceAudio = word.translations?.[sourceLang]?.audio;
    const hasSourceAudio = sourceAudio && (sourceAudio.data || typeof sourceAudio === 'string');

    // Construire l'URL audio
    let audioSrc = '';
    if (hasSourceAudio) {
      if (typeof sourceAudio === 'string') {
        audioSrc = sourceAudio;
      } else if (sourceAudio.data) {
        const format = sourceAudio.format || 'ogg';
        audioSrc = sourceAudio.data.startsWith('data:')
          ? sourceAudio.data
          : `data:audio/${format};base64,${sourceAudio.data}`;
      }
    }

    // Audio distant : jamais chargé automatiquement, remplacé par un lien explicite
    const remoteAudioHtml = CardMedia.classify(audioSrc) === 'remote' ? CardMedia.audio(audioSrc) : '';
    audioSrc = CardMedia.embeddedSrc(audioSrc);

    if (mode === 'image') {
      if (word.image) {
        const src = word.image.startsWith('data:') || word.image.startsWith('http')
          ? word.image
          : `data:image/png;base64,${word.image}`;
        mediaHtml = `<div class="game__card-image game__card-image--large">${CardMedia.image(src, { alt: PageUtils.getTranslator()('game.imageToIdentifyAlt') })}</div>`;
      }
      questionHtml = `<span class="game__card-hint">${_t('game.multilingual.writeWord')}</span>`;
    } else if (mode === 'dictation') {
      // Mode dictée: audio obligatoire, pas de texte affiché
      if (audioSrc) {
        mediaHtml = `
          <div class="game__card-audio game__card-audio--large">
            <audio id="dictation-audio" src="${escapeHtml(audioSrc)}"></audio>
            <button class="game__card-audio-btn" id="play-audio-btn" aria-label="${_t('game.multilingual.playAudio')}">
              🔊 ${_t('game.multilingual.listen')}
            </button>
          </div>
        `;
      } else if (remoteAudioHtml) {
        mediaHtml = `<div class="game__card-audio game__card-audio--large">${remoteAudioHtml}</div>`;
      }
      if (sourceLang === targetLang) {
        questionHtml = `<span class="game__card-hint">${_t('game.multilingual.writeHeard')}</span>`;
      } else {
        const flags = typeof Multilingual !== 'undefined' ? Multilingual.LANGUAGE_FLAGS : {};
        questionHtml = `<span class="game__card-hint">${_t('game.multilingual.translateHeard')} ${escapeHtml(flags[targetLang] || targetLang)}</span>`;
      }
    } else {
      // Mode traduction: afficher le mot source + bouton audio si disponible
      const sourceTranslation = word.translations?.[sourceLang];
      const sourceWord = sourceTranslation?.text || sourceTranslation || word.id;
      questionHtml = escapeHtml(sourceWord);

      // Ajouter le bouton audio s'il y a un audio pour le mot source
      if (audioSrc) {
        audioButtonHtml = `
          <div class="game__card-audio game__card-audio--inline">
            <audio id="source-audio" src="${escapeHtml(audioSrc)}"></audio>
            <button class="game__card-audio-btn game__card-audio-btn--small" id="play-audio-btn"
                    aria-label="${_t('game.multilingual.playAudio') || 'Écouter'}"
                    title="${_t('game.multilingual.playAudio') || 'Écouter la prononciation'}">
              🔊
            </button>
          </div>
        `;
      } else if (remoteAudioHtml) {
        audioButtonHtml = `<div class="game__card-audio game__card-audio--inline">${remoteAudioHtml}</div>`;
      }
    }

    const inputHtml = `
      <label for="answer-input" class="sr-only">${_t('game.multilingual.yourAnswer')}</label>
      <input
        type="text"
        class="game__card-input game__card-input--multilingual"
        id="answer-input"
        placeholder="${_t('game.multilingual.yourAnswer')}"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
      >
    `;

    return `
      <div class="game__card-content game__card-content--front game__card-content--multilingual">
        ${mediaHtml ? `<div class="game__card-media">${mediaHtml}</div>` : ''}
        <div class="game__card-question game__card-question--${mode}">
          ${questionHtml}
          ${audioButtonHtml}
        </div>
        <div class="game__card-input-area">
          ${inputHtml}
          <div class="game__card-buttons">
            <button class="game__card-submit" id="submit-btn">
              ${_t('game.validate')}
            </button>
            <button class="game__card-skip" id="skip-btn" title="${_t('game.iDontKnow') || 'Je ne sais pas'}">
              ${_t('game.iDontKnow') || 'Je ne sais pas'}
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Indique si une réponse (fausse) est proche de la bonne (similarité d'au moins 0,6).
   * @param {*} userAnswer
   * @param {*} expected
   * @returns {boolean}
   */
  _isCloseAnswer(userAnswer, expected) {
    if (typeof userAnswer !== 'string' || typeof expected !== 'string' || typeof Validator === 'undefined') return false;
    const a = TextUtils.normalizeText(userAnswer);
    const b = TextUtils.normalizeText(expected);
    if (!a || !b) return false;
    return Validator.similarity(a, b) >= 0.6;
  },

  _renderCardBack(card, result) {
    if (!result || !card) return '';
    const _t = PageUtils.getTranslator();

    const boxLabels = { purple: '💜 ♥', orange: '🧡 ♣', green: '💚 ♠' };
    const boxColors = { purple: 'purple', orange: 'orange', green: 'green' };
    const isWrong = result.newBox === 'purple';


    let expectedAnswer;
    if (card.word && card.direction) {
      const targetTranslation = card.word.translations?.[card.targetLang];
      expectedAnswer = targetTranslation?.text || targetTranslation || card.word.id;
    } else if (card.choices && card.answer) {
      // Pour les MCQ, afficher le texte de la réponse, pas l'ID
      const correctChoice = card.choices.find(c => c.id === card.answer);
      expectedAnswer = correctChoice ? correctChoice.text : card.answer;
    } else {
      expectedAnswer = card.answer;
    }

    // « Presque ! » n'est dit que si la réponse donnée est réellement proche de la bonne
    const isClose = this._isCloseAnswer(result.userAnswer, expectedAnswer);
    const purpleEncouragements = [
      { title: _t('game.feedback.purpleTitle'), subtitle: _t('game.feedback.purpleSubtitle') },
      { title: _t('game.feedback.purple3Title'), subtitle: _t('game.feedback.purple3Subtitle') },
      { title: _t('game.feedback.purple4Title'), subtitle: _t('game.feedback.purple4Subtitle') }
    ];
    if (isClose) {
      purpleEncouragements.push({ title: _t('game.feedback.purple2Title'), subtitle: _t('game.feedback.purple2Subtitle') });
    }
    const randomPurple = purpleEncouragements[Math.floor(Math.random() * purpleEncouragements.length)];

    const feedbackMessages = {
      purple: { icon: '💜', title: randomPurple.title, subtitle: randomPurple.subtitle },
      orange: { icon: '🧡', title: _t('game.feedback.orangeTitle'), subtitle: _t('game.feedback.orangeSubtitle') },
      green: { icon: '💚', title: _t('game.feedback.greenTitle'), subtitle: _t('game.feedback.greenSubtitle') }
    };

    const feedback = feedbackMessages[result.newBox] || feedbackMessages.purple;

    let cardFeedback = null;
    if (card.feedback) {
      if (typeof card.feedback === 'string') {
        // Afficher le feedback dans tous les cas (correct ou incorrect)
        cardFeedback = card.feedback;
      } else if (typeof card.feedback === 'object') {
        // Pour les feedbacks spécifiques, utiliser incorrect/correct selon le cas
        cardFeedback = isWrong ? card.feedback.incorrect : card.feedback.correct;
      }
    }
    // Support pour feedbackCorrect/feedbackIncorrect séparés
    if (!cardFeedback) {
      cardFeedback = isWrong ? card.feedbackIncorrect : card.feedbackCorrect;
    }

    // Récupérer la question pour l'affichage
    let questionText;
    if (card.word && card.direction) {
      const sourceTranslation = card.word.translations?.[card.sourceLang];
      questionText = sourceTranslation?.text || sourceTranslation || card.word.id;
    } else {
      questionText = card.question;
    }

    return `
      <div class="game__card-content game__card-content--back game__card-content--${result.newBox}">
        <div class="game__card-result-icon">${feedback.icon}</div>
        <div class="game__card-result-text">${feedback.title}</div>
        <div class="game__card-result-subtitle">${feedback.subtitle}</div>
        <div class="game__card-question-recap">
          <span class="game__card-question-label">${_t('game.question')}</span>
          <span class="game__card-question-value">${renderWithLatex(questionText || '')}</span>
        </div>
        <div class="game__card-answer">
          <span class="game__card-answer-label">${_t('game.answer')}</span>
          <span class="game__card-answer-value">${renderWithLatex(expectedAnswer)}</span>
        </div>
        ${cardFeedback ? `
          <div class="game__card-feedback">
            <span class="game__card-feedback-icon">💡</span>
            <span class="game__card-feedback-text">${renderWithLatex(cardFeedback)}</span>
          </div>
        ` : ''}
        <div class="game__card-destination game__card-destination--${boxColors[result.newBox]}">
          → ${boxLabels[result.newBox] || result.newBox}
        </div>
        ${(result.xpEarned + (result.bonusXp || 0)) ? `<div class="game__card-xp">+${result.xpEarned + (result.bonusXp || 0)} XP</div>` : ''}
        <button class="game__card-next" id="next-btn">
          ${_t('game.continue')} →
        </button>
      </div>
    `;
  },

  _getPileCounts(session) {
    const counts = { purple: 0, orange: 0, green: 0 };
    session.results.forEach(r => {
      if (counts.hasOwnProperty(r.newBox)) {
        counts[r.newBox]++;
      }
    });
    return counts;
  },

  mount(container, state) {
    container.innerHTML = this.render(state);

    // Initialiser l'audio
    if (typeof Audio !== 'undefined' && Audio.init) {
      Audio.init();
    }

    // Bouton retour
    const backButton = container.querySelector('.game__back');
    const _t = PageUtils.getTranslator();
    if (backButton) {
      backButton.addEventListener('click', () => {
        if (confirm(_t('game.quitConfirm'))) {
          State.set('currentSession', null);
          history.back();
        }
      });
    }

    // Monter les interactions
    if (state.currentSession && !state.currentSession.isShowingFeedback) {
      this._mountQuestion(container, state);
    } else if (state.currentSession && state.currentSession.isShowingFeedback) {
      this._mountFeedback(container, state);
    }
  },

  _mountQuestion(container, state) {
    const button = container.querySelector('#submit-btn');
    const session = state.currentSession;
    const card = session.cards[session.currentIndex];

    // Protection contre carte undefined (fin de session)
    if (!card) return;

    const handleSubmit = () => {
      // Déléguer l'extraction au module dédié
      const answer = GameAnswerExtractor.extractByType(container, card);

      if (!answer) {
        const input = container.querySelector('#answer-input, .game-card__choice, .game-card__tf-option');
        if (input) {
          input.classList.add('shake');
          setTimeout(() => input.classList.remove('shake'), 500);
        }
        return;
      }

      // Déléguer la validation au module dédié
      GameAnswerValidator.validate(state, answer);

      // Jouer le son correspondant
      const updatedSession = State.get('currentSession');
      if (updatedSession && updatedSession.lastResult && typeof Audio !== 'undefined' && Audio.playCardToBox) {
        Audio.playCardToBox(updatedSession.lastResult.newBox);
      }

      // Animer le retournement
      const flipcard = container.querySelector('#game-flipcard');
      if (flipcard) {
        flipcard.classList.add('game__flipcard--flipped');
      }

      // Attendre la fin de l'animation flip, puis re-render
      setTimeout(() => {
        const currentSession = State.get('currentSession');
        const appContainer = document.getElementById('app');
        if (!currentSession || !appContainer) return;
        this.mount(appContainer, State.getAll());
      }, 400);
    };

    if (button) {
      button.addEventListener('click', handleSubmit);
    }

    // Bouton "Je ne sais pas" - soumet une réponse vide (incorrecte)
    const skipBtn = container.querySelector('#skip-btn');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        // Forcer une réponse vide pour marquer comme incorrect
        GameAnswerValidator.validate(state, '');

        // Jouer le son de mauvaise réponse
        if (typeof Audio !== 'undefined' && Audio.playCardToBox) {
          Audio.playCardToBox('purple');
        }

        // Animer le retournement
        const flipcard = container.querySelector('#game-flipcard');
        if (flipcard) {
          flipcard.classList.add('game__flipcard--flipped');
        }

        // Attendre la fin de l'animation flip, puis re-render
        setTimeout(() => {
          const currentSession = State.get('currentSession');
          const appContainer = document.getElementById('app');
          if (!currentSession || !appContainer) return;
          this.mount(appContainer, State.getAll());
        }, 400);
      });
    }

    // Gestion des inputs selon le type
    this._bindInputEvents(container, card, handleSubmit);
  },

  _bindInputEvents(container, card, handleSubmit) {
    // Protection contre carte undefined
    if (!card) return;

    const isMultilingual = card.word && card.direction;
    const type = card.type || 'text';

    if (isMultilingual) {
      const input = container.querySelector('#answer-input');
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') handleSubmit();
        });
        setTimeout(() => input.focus(), 100);
      }

      // Gestion audio (mode dictée OU mode traduction avec audio)
      const playBtn = container.querySelector('#play-audio-btn');
      const audio = container.querySelector('#dictation-audio') || container.querySelector('#source-audio');

      if (playBtn && audio) {
        // Fonction de lecture
        const playAudio = () => {
          audio.currentTime = 0;
          audio.play().catch(() => {
            // Erreur autoplay silencieuse (restrictions navigateur)
          });
          // Animation du bouton
          playBtn.classList.add('game__card-audio-btn--playing');
          audio.onended = () => playBtn.classList.remove('game__card-audio-btn--playing');
        };

        // Clic sur le bouton
        playBtn.addEventListener('click', playAudio);

        // Lecture automatique à l'apparition de la carte
        setTimeout(playAudio, 300);
      }
    } else if (type === 'text' || type === 'numeric') {
      const input = container.querySelector('#answer-input');
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') handleSubmit();
        });
        setTimeout(() => input.focus(), 100);
      }
    } else if (type === 'mcq' || type === 'truefalse') {
      const radioInputs = container.querySelectorAll('input[type="radio"], input[type="checkbox"]');
      radioInputs.forEach(input => {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') handleSubmit();
        });
      });
      const firstChoice = container.querySelector('.game-card__choice-input, .game-card__tf-input');
      if (firstChoice) {
        setTimeout(() => firstChoice.focus(), 100);
      }
    } else if (type === 'cloze') {
      const firstInput = container.querySelector('.game-card__cloze-input, .game-card__cloze-select');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
      const inputs = container.querySelectorAll('.game-card__cloze-input');
      if (inputs.length > 0) {
        inputs[inputs.length - 1].addEventListener('keydown', (e) => {
          if (e.key === 'Enter') handleSubmit();
        });
      }
    } else if (type === 'matching') {
      const firstSelect = container.querySelector('.game-card__match-select');
      if (firstSelect) {
        setTimeout(() => firstSelect.focus(), 100);
      }
    } else if (type === 'audio-choice') {
      // Gestionnaire du bouton audio
      const audioBtn = container.querySelector('.game-card__audio-btn');
      if (audioBtn) {
        const playAudio = () => {
          try {
            const audioData = JSON.parse(audioBtn.dataset.audio);
            // Ajouter l'animation de lecture
            audioBtn.classList.add('playing');
            GameCardTypeRenderer.playAudioChoice(audioData);
            // Retirer l'animation après la durée
            const duration = (audioData.duration || 1.0) * 1000;
            setTimeout(() => audioBtn.classList.remove('playing'), duration);
          } catch (e) {
            console.error('Error playing audio-choice:', e);
          }
        };
        audioBtn.addEventListener('click', playAudio);
        // Jouer automatiquement le son au chargement de la carte
        setTimeout(playAudio, 300);
      }
      // Support Enter pour valider
      const radioInputs = container.querySelectorAll('input[name="audio-choice-answer"]');
      radioInputs.forEach(input => {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') handleSubmit();
        });
      });
      // Focus sur le premier choix
      const firstChoice = container.querySelector('.game-card__choice-input');
      if (firstChoice) {
        setTimeout(() => firstChoice.focus(), 100);
      }
    }
  },

  _mountFeedback(container, state) {
    const button = container.querySelector('#next-btn');
    const session = state.currentSession;
    const result = session.lastResult;

    const goToNext = () => {
      this._animateCardToStack(container, result.newBox, () => {
        // Déléguer à GameSessionManager
        GameSessionManager.nextCard(state);

        // Ne pas remonter si la session est terminée (navigation vers session-summary déjà faite)
        const currentSession = State.get('currentSession');
        if (!currentSession || currentSession.currentIndex >= currentSession.cards.length) {
          return;
        }

        const appContainer = document.getElementById('app');
        this.mount(appContainer, State.getAll());
      });
    };

    if (button) {
      button.addEventListener('click', goToNext);
      button.focus();
    }

    // Support swipe gauche
    const flipcard = container.querySelector('#game-flipcard');
    if (flipcard && typeof A11y !== 'undefined') {
      A11y.enableSwipe(flipcard, {
        onSwipeLeft: goToNext,
        threshold: 50
      });
    }

    // Annoncer le résultat pour lecteurs d'écran
    if (typeof A11y !== 'undefined') {
      const _t = PageUtils.getTranslator();
      const isCorrect = result.isCorrect;
      const message = isCorrect
        ? _t('game.feedback.correct')
        : `${_t('game.feedback.incorrect')} ${_t('game.feedback.correctAnswer')} ${result.correctAnswer}`;
      A11y.announce(message);
    }

    // Afficher le XP flottant animé
    const totalXpGain = (result.xpEarned || 0) + (result.bonusXp || 0);
    if (typeof Effects !== 'undefined' && Effects.floatingXP && totalXpGain > 0) {
      const xpElement = container.querySelector('.game__card-xp');
      setTimeout(() => {
        Effects.floatingXP.show(totalXpGain, { element: xpElement });
      }, 200);
    }
  },

  _animateCardToStack(container, targetBox, callback) {
    const flipcard = container.querySelector('#game-flipcard');
    const flyingCard = container.querySelector('#flying-card');
    const targetPile = container.querySelector(`.game__pile--${targetBox}`);

    if (!flipcard || !flyingCard || !targetPile) {
      callback();
      return;
    }

    const cardRect = flipcard.getBoundingClientRect();
    const pileRect = targetPile.getBoundingClientRect();

    flyingCard.className = `game__flying-card game__flying-card--${targetBox}`;
    flyingCard.style.transition = 'none';
    flyingCard.style.display = 'block';
    flyingCard.style.left = cardRect.left + 'px';
    flyingCard.style.top = cardRect.top + 'px';
    flyingCard.style.width = cardRect.width + 'px';
    flyingCard.style.height = cardRect.height + 'px';
    flyingCard.style.transform = 'translate(0, 0) scale(1) rotate(0deg)';
    flyingCard.style.opacity = '1';

    flipcard.style.visibility = 'hidden';
    flyingCard.offsetHeight; // Force reflow

    const targetX = pileRect.left + pileRect.width / 2 - cardRect.left - cardRect.width / 2;
    const targetY = pileRect.top + pileRect.height / 2 - cardRect.top - cardRect.height / 2;

    flyingCard.style.transition = 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)';

    requestAnimationFrame(() => {
      flyingCard.style.transform = `translate(${targetX}px, ${targetY}px) scale(0.2) rotate(${targetBox === 'purple' ? -15 : targetBox === 'green' ? 15 : 0}deg)`;
      flyingCard.style.opacity = '0.6';
    });

    targetPile.classList.add('game__pile--receiving');

    setTimeout(() => {
      flyingCard.style.display = 'none';
      targetPile.classList.remove('game__pile--receiving');
      callback();
    }, 550);
  }
};
