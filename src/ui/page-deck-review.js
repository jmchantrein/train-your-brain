/**
 * Page Deck Review - Consultation des cartes Q/R
 *
 * Permet de consulter toutes les cartes d'un deck avec :
 * - Question et réponse
 * - Feedback/explications si disponible
 * - Alternatives acceptées
 * - Statut de la carte (boîte Leitner)
 */

Pages.deckReview = {
  render(state, params) {
    const deckId = params[0];
    const decks = state.decks || [];
    const deck = decks.find(d => d.id === deckId);
    const _t = PageUtils.getTranslator();

    if (!deck) {
      return `
        <div class="page page--deck-review">
          <div class="page__content">
            <div class="review__empty">
              <span class="review__empty-icon">❌</span>
              <p>${i18n.t('deckReview.notFound')}</p>
              <a href="#/explore" class="btn btn--primary">${i18n.t('deckReview.backToExplore')}</a>
            </div>
          </div>
        </div>
      `;
    }

    const cards = deck.cards || [];
    const isMultilingual = deck.type === 'multilingual' && Array.isArray(deck.words);

    return `
      <div class="page page--deck-review">
        <header class="review__header">
          <a href="#/explore" class="review__back" title="${i18n.t('common.back')}">← ${i18n.t('common.back')}</a>
          <div class="review__title-section">
            <h1 class="review__title">📖 ${escapeHtml(deck.name)}</h1>
            <p class="review__subtitle">${i18n.tn('deckReview.cardsToReview', cards.length)}</p>
          </div>
        </header>

        <main class="review__content">
          ${isMultilingual
            ? this._renderMultilingualCards(deck)
            : this._renderCards(cards)
          }
        </main>

        <footer class="review__footer">
          <a href="#/explore" class="btn btn--secondary">← ${i18n.t('common.back')}</a>
          <a href="#/game/${escapeHtml(deckId)}" class="btn btn--primary">▶️ ${i18n.t('deckReview.play')}</a>
        </footer>
      </div>
    `;
  },

  /**
   * Rend les cartes standard
   * @private
   */
  _renderCards(cards) {
    if (cards.length === 0) {
      return `
        <div class="review__empty">
          <span class="review__empty-icon">📭</span>
          <p>${i18n.t('stats.noCardsInDeck')}</p>
        </div>
      `;
    }

    return `
      <div class="review__cards-list">
        ${cards.map((card, index) => this._renderCard(card, index)).join('')}
      </div>
    `;
  },

  /**
   * Rend une carte individuelle
   * @private
   */
  _renderCard(card, index) {
    const boxInfo = this._getBoxInfo(card.box);
    const hasAlternatives = card.alternatives && card.alternatives.length > 1;
    const hasFeedback = card.feedback || card.explanation;
    const hasMedia = card.media;

    return `
      <article class="review__card" data-card-id="${escapeHtml(card.id || index)}">
        <div class="review__card-header">
          <span class="review__card-number">#${index + 1}</span>
          <span class="review__card-box ${boxInfo.class}" title="${boxInfo.title}">
            ${boxInfo.icon}
          </span>
        </div>

        <div class="review__card-content">
          <div class="review__question">
            <span class="review__label">${i18n.t('game.question')}</span>
            <div class="review__question-text">${this._renderContent(card.question)}</div>
            ${hasMedia ? this._renderMedia(card.media) : ''}
          </div>

          <div class="review__answer">
            <span class="review__label">${i18n.t('deckReview.answer')}</span>
            <div class="review__answer-text">${this._renderContent(card.answer)}</div>
          </div>

          ${hasAlternatives ? `
            <div class="review__alternatives">
              <span class="review__label">${i18n.t('deckReview.acceptedAnswers')}</span>
              <ul class="review__alternatives-list">
                ${card.alternatives.map(alt => `<li>${this._renderContent(alt)}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${hasFeedback ? `
            <div class="review__feedback">
              <span class="review__label">💡 ${i18n.t('deckReview.explanation')}</span>
              <div class="review__feedback-text">${this._renderContent(card.feedback || card.explanation)}</div>
            </div>
          ` : ''}
        </div>
      </article>
    `;
  },

  /**
   * Rend le contenu avec support LaTeX
   * @private
   */
  _renderContent(content) {
    if (!content) return '';
    // Utiliser renderWithLatex pour supporter les formules LaTeX
    if (typeof renderWithLatex === 'function') {
      return renderWithLatex(String(content));
    }
    // Fallback: échapper simplement
    return escapeHtml(String(content));
  },

  /**
   * Rend un média
   * @private
   */
  _renderMedia(media) {
    if (!media) return '';

    if (media.type === 'image') {
      const src = media.data || media.url || '';
      return `
        <div class="review__media">
          ${CardMedia.image(src, { alt: i18n.t('deckReview.illustration'), attrs: 'class="review__media-img"' })}
        </div>
      `;
    }

    if (media.type === 'audio') {
      return `
        <div class="review__media">
          <span class="review__media-audio">🔊 ${i18n.t('deckReview.audioAvailable')}</span>
        </div>
      `;
    }

    return '';
  },

  /**
   * Obtient les infos de la boîte Leitner
   * @private
   */
  _getBoxInfo(box) {
    const boxes = {
      'never_played': { icon: '🆕', class: 'review__card-box--new', title: i18n.t('deckReview.boxNever') },
      'purple': { icon: '💜', class: 'review__card-box--purple', title: i18n.t('deckReview.boxPurple') },
      'orange': { icon: '🧡', class: 'review__card-box--orange', title: i18n.t('deckReview.boxOrange') },
      'green': { icon: '💚', class: 'review__card-box--green', title: i18n.t('deckReview.boxGreen') }
    };
    return boxes[box] || boxes['never_played'];
  },

  /**
   * Rend les mots pour un deck multilingue
   * @private
   */
  _renderMultilingualCards(deck) {
    const words = deck.words || [];
    const languages = deck.languages || [];

    if (words.length === 0) {
      return `
        <div class="review__empty">
          <span class="review__empty-icon">📭</span>
          <p>${i18n.t('deckReview.noWords')}</p>
        </div>
      `;
    }

    return `
      <div class="review__cards-list">
        ${words.map((word, index) => this._renderMultilingualWord(word, index, languages)).join('')}
      </div>
    `;
  },

  /**
   * Rend un mot multilingue
   * @private
   */
  _renderMultilingualWord(word, index, languages) {
    const translations = word.translations || {};

    return `
      <article class="review__card review__card--multilingual" data-word-index="${index}">
        <div class="review__card-header">
          <span class="review__card-number">#${index + 1}</span>
        </div>

        <div class="review__card-content">
          <div class="review__translations">
            ${languages.map(lang => {
              const value = translations[lang.code];
              if (!value) return '';
              return `
                <div class="review__translation">
                  <span class="review__translation-lang">${escapeHtml(lang.flag || '')} ${escapeHtml(lang.name)}</span>
                  <span class="review__translation-value">${escapeHtml(value)}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </article>
    `;
  },

  mount(container, state, params) {
    container.innerHTML = this.render(state, params);

    // Scroll en haut de la page
    window.scrollTo(0, 0);
  }
};
