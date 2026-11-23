/**
 * Card Type Renderer - Rendu des inputs selon le type de carte
 *
 * Gère le rendu des différents types d'inputs :
 * - text/numeric : champ texte simple
 * - mcq : choix multiples (radio/checkbox)
 * - truefalse : vrai/faux
 * - cloze : texte à trous
 * - matching : appariement
 * - audio-choice : choix avec son à écouter (ear training)
 * - staff-note : note sur portée musicale à identifier
 *
 * Dépendances: escapeHtml, renderWithLatex (components.js), Leitner, PageUtils, Audio, StaffVisualizer
 */

const GameCardTypeRenderer = {
  /**
   * Rend l'input approprié selon le type de carte
   * @param {Object} card - Carte à rendre
   * @returns {string} HTML de l'input
   */
  renderByType(card) {
    const type = card.type || 'text';

    switch (type) {
      case 'mcq':
        return this.renderMCQ(card);
      case 'truefalse':
        return this.renderTrueFalse(card);
      case 'cloze':
        return this.renderCloze(card);
      case 'matching':
        return this.renderMatching(card);
      case 'audio-choice':
        return this.renderAudioChoice(card);
      case 'staff-note':
        return this.renderStaffNote(card);
      case 'numeric':
      case 'text':
      default:
        return this.renderText(card);
    }
  },

  /**
   * Rend un input texte ou numérique
   * @param {Object} card - Carte
   * @returns {string} HTML
   */
  renderText(card) {
    const _t = PageUtils.getTranslator();
    const placeholder = card.type === 'numeric' ? _t('game.enterNumber') : _t('game.yourResponse');
    const inputType = card.type === 'numeric' ? 'number' : 'text';

    return `
      <input
        type="${inputType}"
        class="game__card-input"
        id="answer-input"
        placeholder="${placeholder}"
        aria-label="${placeholder}"
        autocomplete="off"
      >
    `;
  },

  /**
   * Rend des choix multiples (QCM)
   * Les choix sont mélangés aléatoirement pour éviter la mémorisation de position
   * Par défaut, plusieurs choix peuvent être sélectionnés (checkbox)
   * Utiliser card.single = true pour forcer un seul choix (radio)
   * @param {Object} card - Carte avec choices[]
   * @returns {string} HTML
   */
  renderMCQ(card) {
    const choices = card.choices || [];
    // Par défaut: checkbox (multiple), sauf si single === true
    const inputType = card.single === true ? 'radio' : 'checkbox';

    // Mélanger les choix pour éviter la mémorisation de l'ordre
    const shuffledChoices = TextUtils.shuffleArray([...choices]);

    return `
      <div class="game-card__choices" role="group">
        ${shuffledChoices.map(choice => `
          <label class="game-card__choice" data-choice-id="${escapeHtml(choice.id)}">
            <input type="${inputType}" name="mcq-answer" value="${escapeHtml(choice.id)}" class="game-card__choice-input">
            <span class="game-card__choice-text">${typeof renderWithLatex !== 'undefined' ? renderWithLatex(choice.text) : escapeHtml(choice.text)}</span>
          </label>
        `).join('')}
      </div>
    `;
  },

  /**
   * Rend un choix vrai/faux
   * @param {Object} card - Carte
   * @returns {string} HTML
   */
  renderTrueFalse(card) {
    const _t = PageUtils.getTranslator();

    return `
      <div class="game-card__truefalse" role="group">
        <label class="game-card__tf-option game-card__tf-option--true">
          <input type="radio" name="truefalse" value="true" class="game-card__tf-input">
          <span class="game-card__tf-icon">✓</span>
          <span class="game-card__tf-text">${_t('game.true')}</span>
        </label>
        <label class="game-card__tf-option game-card__tf-option--false">
          <input type="radio" name="truefalse" value="false" class="game-card__tf-input">
          <span class="game-card__tf-icon">✗</span>
          <span class="game-card__tf-text">${_t('game.false')}</span>
        </label>
      </div>
    `;
  },

  /**
   * Rend une question à trous (cloze)
   * Supporte deux formats :
   * - Format simple (Anki-style) : question: "Le {{mot}} est..." avec answer: "mot"
   * - Format avancé : question: "Le {{blank_0}} est..." avec blanks: [{correctAnswer: "mot"}]
   *
   * @param {Object} card - Carte avec blanks[] ou format {{mot}}
   * @returns {string} HTML
   */
  renderCloze(card) {
    const _t = PageUtils.getTranslator();

    // Détecter le format utilisé
    let blanks = card.blanks || [];
    let questionText = card.question;

    // Si pas de blanks mais la question contient {{mot}}, convertir le format simple
    if (blanks.length === 0) {
      const simplePattern = /\{\{([^}]+)\}\}/g;
      const matches = [...questionText.matchAll(simplePattern)];

      if (matches.length > 0) {
        // Format simple détecté : {{mot}} dans la question
        // Convertir en format interne avec blanks
        blanks = matches.map((match, index) => ({
          correctAnswer: match[1], // Le mot entre {{ }}
          type: 'text'
        }));

        // Remplacer {{mot}} par {{blank_N}} pour le traitement standard
        let blankIndex = 0;
        questionText = questionText.replace(simplePattern, () => {
          return `{{blank_${blankIndex++}}}`;
        });

        // Stocker les blanks générés sur la carte pour la validation
        card._generatedBlanks = blanks;
      }
    }

    const questionHtml = typeof renderWithLatex !== 'undefined'
      ? renderWithLatex(questionText)
      : escapeHtml(questionText);

    let processedHtml = questionHtml;

    blanks.forEach((blank, index) => {
      const placeholder = `{{blank_${index}}}`;
      let inputHtml = '';

      if (blank.type === 'mcq' && blank.choices && blank.choices.length > 0) {
        // Mélanger les choix pour éviter la mémorisation de l'ordre
        const shuffledBlankChoices = TextUtils.shuffleArray([...blank.choices]);
        inputHtml = `
          <select class="game-card__cloze-select" data-blank-id="${index}">
            <option value="">${_t('game.choose')}</option>
            ${shuffledBlankChoices.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.text)}</option>`).join('')}
          </select>
        `;
      } else {
        inputHtml = `
          <input type="${blank.type === 'numeric' ? 'number' : 'text'}" class="game-card__cloze-input" data-blank-id="${index}" placeholder="..." autocomplete="off" aria-label="${_t('game.blankLabel', { n: index + 1 })}">
        `;
      }

      processedHtml = processedHtml.replace(placeholder, inputHtml);
    });

    return `<div class="game-card__cloze"><div class="game-card__cloze-text">${processedHtml}</div></div>`;
  },

  /**
   * Rend une question d'appariement (matching)
   * @param {Object} card - Carte avec pairs[]
   * @returns {string} HTML
   */
  renderMatching(card) {
    const _t = PageUtils.getTranslator();
    const pairs = card.pairs || [];
    const responses = TextUtils.shuffleArray(pairs.map(p => p.response));

    return `
      <div class="game-card__matching">
        ${pairs.map((pair, index) => {
          // Support pour term OU premise (compatibilité)
          const leftText = pair.term || pair.premise || '';
          const pairId = pair.id || index;
          return `
          <div class="game-card__match-row" data-pair-id="${escapeHtml(pairId)}">
            <span class="game-card__match-premise">${typeof renderWithLatex !== 'undefined' ? renderWithLatex(leftText) : escapeHtml(leftText)}</span>
            <span class="game-card__match-arrow">→</span>
            <select class="game-card__match-select" data-pair-id="${escapeHtml(pairId)}">
              <option value="">${_t('game.match')}</option>
              ${responses.map(r => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('')}
            </select>
          </div>
        `;}).join('')}
      </div>
    `;
  },

  /**
   * Rend une question audio avec choix (ear training)
   * Supporte plusieurs types d'audio :
   * - note : joue une seule note
   * - interval : joue deux notes successives
   * - chord : joue plusieurs notes simultanément
   *
   * @param {Object} card - Carte avec audio{} et choices[]
   * @returns {string} HTML
   */
  renderAudioChoice(card) {
    const _t = PageUtils.getTranslator();
    const choices = card.choices || [];
    const audio = card.audio || {};
    const audioType = audio.type || 'note';

    // Préparer les données audio pour le bouton
    const audioData = {
      type: audioType,
      note: audio.note,
      notes: audio.notes,
      timbre: audio.timbre || 'piano',
      duration: audio.duration || 1.0
    };

    // Mélanger les choix pour éviter la mémorisation de l'ordre
    const shuffledChoices = TextUtils.shuffleArray([...choices]);

    // Générer une icône selon le type d'audio
    let audioIcon = '🎵';
    let audioLabel = _t('game.audioChoice.listenNote');
    if (audioType === 'interval') {
      audioIcon = '🎶';
      audioLabel = _t('game.audioChoice.listenInterval');
    } else if (audioType === 'chord') {
      audioIcon = '🎹';
      audioLabel = _t('game.audioChoice.listenChord');
    }

    return `
      <div class="game-card__audio-choice">
        <div class="game-card__audio-player">
          <button type="button" class="game-card__audio-btn" data-audio='${escapeHtml(JSON.stringify(audioData))}' aria-label="${escapeHtml(audioLabel)}">
            <span class="game-card__audio-icon">${audioIcon}</span>
            <span class="game-card__audio-text">${escapeHtml(audioLabel)}</span>
          </button>
          <div class="game-card__audio-hint">${_t('game.audioChoice.hint')}</div>
        </div>
        <div class="game-card__choices game-card__choices--audio" role="group">
          ${shuffledChoices.map(choice => `
            <label class="game-card__choice" data-choice-id="${escapeHtml(choice.id)}">
              <input type="radio" name="audio-choice-answer" value="${escapeHtml(choice.id)}" class="game-card__choice-input">
              <span class="game-card__choice-text">${escapeHtml(choice.text)}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  },

  /**
   * Joue l'audio d'une carte audio-choice
   * Appelé par le gestionnaire d'événements de page-game
   * @param {Object} audioData - Données audio {type, note, notes, timbre, duration}
   */
  playAudioChoice(audioData) {
    if (typeof Audio === 'undefined' || !Audio.playNote) {
      console.warn('Audio module not available for audio-choice');
      return;
    }

    const timbre = audioData.timbre || 'piano';
    const duration = audioData.duration || 1.0;

    switch (audioData.type) {
      case 'note':
        if (audioData.note) {
          Audio.playNoteWithTimbre(audioData.note, timbre, duration);
        }
        break;

      case 'interval':
        if (audioData.notes && audioData.notes.length >= 2) {
          Audio.playInterval(audioData.notes[0], audioData.notes[1], timbre, duration);
        }
        break;

      case 'chord':
        if (audioData.notes && audioData.notes.length >= 2) {
          Audio.playChord(audioData.notes, timbre, duration);
        }
        break;

      default:
        console.warn('Unknown audio type:', audioData.type);
    }
  },

  /**
   * Rend une note sur portée musicale à identifier
   * La carte contient :
   * - staff.note : la note à afficher (ex: "C4", "G#5")
   * - staff.clef : la clé (treble, bass, alto, tenor)
   * - choices[] : les choix de réponse
   *
   * @param {Object} card - Carte avec staff{} et choices[]
   * @returns {string} HTML
   */
  renderStaffNote(card) {
    const _t = PageUtils.getTranslator();
    const staff = card.staff || {};
    const note = staff.note || 'C4';
    const clef = staff.clef || 'treble';
    const choices = card.choices || [];

    // Générer le SVG de la portée avec la note
    let staffSvg = '';
    if (typeof StaffVisualizer !== 'undefined') {
      staffSvg = StaffVisualizer.renderStaffWithNote(note, clef, {
        width: 200,
        height: 120,
        showNoteName: false,
        noteColor: '#8b5cf6'
      });
    } else {
      // Fallback si StaffVisualizer n'est pas disponible
      staffSvg = `<div class="game-card__staff-fallback">🎼 ${escapeHtml(note)}</div>`;
    }

    // Mélanger les choix pour éviter la mémorisation de l'ordre
    const shuffledChoices = TextUtils.shuffleArray([...choices]);

    return `
      <div class="game-card__staff-note">
        <div class="game-card__staff-display">
          ${staffSvg}
        </div>
        <div class="game-card__staff-choices" role="group">
          ${shuffledChoices.map(choice => `
            <label class="game-card__staff-choice">
              <input type="radio" name="staff-note-answer" value="${escapeHtml(choice.id)}" class="game-card__staff-choice-input">
              <span class="game-card__staff-choice-label">${escapeHtml(choice.text)}</span>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  }
};

// Export pour Node.js (tests) et navigateur
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameCardTypeRenderer;
}
