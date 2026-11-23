/**
 * Page Exam - Mode examen avec notation
 *
 * Inclut Pages.exam et Pages.examResults
 *
 * Dépendances: Pages (pages-base.js), State, Router, Validator
 */

// ═══════════════════════════════════════════════════════════════
// EXAM - Mode examen avec notation
// ═══════════════════════════════════════════════════════════════

Pages.exam = {
  render(state) {
    const exam = state.currentExam;
    const _t = PageUtils.getTranslator();

    if (!exam) {
      return `<div class="page page--exam"><div class="exam__loading">${_t('app.loading')}</div></div>`;
    }

    const { cards, currentIndex, isShowingFeedback, lastResult, stats, maxScore, currentScore } = exam;
    const currentCard = cards[currentIndex];
    const progressPercent = ((currentIndex + (isShowingFeedback ? 1 : 0)) / cards.length) * 100;
    const scorePercent = maxScore > 0 ? Math.round((currentScore / maxScore) * 100) : 0;

    return `
      <div class="page page--exam">
        <h1 class="sr-only">📝 ${_t('exam.title')}</h1>
        <header class="exam__header">
          <button class="exam__quit" aria-label="${_t('common.quit')}">✕</button>
          <div class="exam__info">
            <span class="exam__title">📝 ${_t('exam.title')}</span>
            <span class="exam__progress">${currentIndex + 1} / ${cards.length}</span>
          </div>
          <div class="exam__score-display">
            <span class="exam__score">${currentScore.toFixed(1)} / ${maxScore}</span>
            <span class="exam__percent">(${scorePercent}%)</span>
          </div>
        </header>

        <div class="exam__progress-bar">
          <div class="exam__progress-fill" style="width: ${progressPercent}%"></div>
        </div>

        <main class="exam__content">
          <div class="exam__card ${isShowingFeedback ? 'exam__card--revealed' : ''}">
            ${isShowingFeedback ? this._renderFeedback(currentCard, lastResult) : this._renderQuestion(currentCard)}
          </div>
        </main>

        <footer class="exam__footer">
          ${isShowingFeedback ? `
            <button class="btn btn--primary exam__next">
              ${currentIndex < cards.length - 1 ? _t('exam.nextQuestion') : _t('common.seeResults')}
            </button>
          ` : ''}
        </footer>
      </div>
    `;
  },

  _renderQuestion(card) {
    const _t = PageUtils.getTranslator();
    const questionHtml = typeof renderWithLatex !== 'undefined'
      ? renderWithLatex(card.question)
      : escapeHtml(card.question);

    let mediaHtml = '';
    if (card.imageUrl) {
      mediaHtml += `<div class="exam__media">${CardMedia.image(card.imageUrl, { alt: _t('exam.imageAlt') })}</div>`;
    }
    if (card.audioUrl) {
      mediaHtml += `<div class="exam__media">${CardMedia.audio(card.audioUrl)}</div>`;
    }

    const inputHtml = this._renderInputByType(card);

    return `
      <div class="exam__question">${questionHtml}</div>
      ${mediaHtml}
      <div class="exam__input-area">
        ${inputHtml}
        <button class="btn btn--primary exam__submit">${_t('game.validate')}</button>
      </div>
      <div class="exam__points-info">${i18n.tn('exam.pointsInfo', card.points || 1, { points: escapeHtml(card.points || 1) })}</div>
    `;
  },

  _renderInputByType(card) {
    const _t = PageUtils.getTranslator();
    const type = card.type || 'text';

    switch (type) {
      case 'mcq':
        return this._renderMCQInput(card);
      case 'truefalse':
        return this._renderTrueFalseInput(card);
      default:
        return `<label for="exam-answer" class="sr-only">${_t('game.yourAnswer')}</label><input type="${type === 'numeric' ? 'number' : 'text'}" class="exam__input" id="exam-answer" placeholder="${_t('game.yourResponse')}" step="any">`;
    }
  },

  _renderMCQInput(card) {
    if (!card.choices) return '';
    // Mélanger les choix pour éviter la mémorisation de l'ordre
    const shuffledChoices = TextUtils.shuffleArray([...card.choices]);
    return `
      <div class="exam__mcq-choices">
        ${shuffledChoices.map(choice => `
          <label class="exam__mcq-choice">
            <input type="radio" name="exam-mcq" value="${escapeHtml(choice.id)}">
            <span class="exam__mcq-label">${escapeHtml(choice.text)}</span>
          </label>
        `).join('')}
      </div>
    `;
  },

  _renderTrueFalseInput(card) {
    const _t = PageUtils.getTranslator();
    return `
      <div class="exam__truefalse-choices">
        <label class="exam__truefalse-choice">
          <input type="radio" name="exam-tf" value="true">
          <span>${_t('game.true')}</span>
        </label>
        <label class="exam__truefalse-choice">
          <input type="radio" name="exam-tf" value="false">
          <span>${_t('game.false')}</span>
        </label>
      </div>
    `;
  },

  _renderFeedback(card, result) {
    const _t = PageUtils.getTranslator();
    const isCorrect = result?.isCorrect;
    const points = Number(card.points) || 1;
    const earnedPoints = isCorrect ? points : -(card.penalty || 0) * points / 100;

    const questionHtml = typeof renderWithLatex !== 'undefined'
      ? renderWithLatex(card.question)
      : escapeHtml(card.question);

    return `
      <div class="exam__feedback ${isCorrect ? 'exam__feedback--correct' : 'exam__feedback--wrong'}">
        <div class="exam__feedback-icon">${isCorrect ? '✓' : '✗'}</div>
        <div class="exam__feedback-title">${isCorrect ? _t('game.correct') : _t('game.incorrect')}</div>
        <div class="exam__feedback-points ${earnedPoints >= 0 ? 'positive' : 'negative'}">
          ${i18n.tn('exam.pointsDelta', earnedPoints, { points: (earnedPoints >= 0 ? '+' : '') + earnedPoints.toFixed(1) })}
        </div>
      </div>

      <div class="exam__question-review">
        <div class="exam__question-text">${questionHtml}</div>
        <div class="exam__answer-section">
          <div class="exam__your-answer">
            <span class="exam__answer-label">${_t('exam.yourAnswer')}</span>
            <span class="exam__answer-value ${isCorrect ? '' : 'wrong'}">${escapeHtml(result?.userAnswer || '-')}</span>
          </div>
          ${!isCorrect ? `
            <div class="exam__correct-answer">
              <span class="exam__answer-label">${_t('exam.correctAnswer')}</span>
              <span class="exam__answer-value correct">${escapeHtml(card.answer)}</span>
            </div>
          ` : ''}
        </div>
        ${card.feedbackCorrect && isCorrect ? `<div class="exam__feedback-message">${renderWithLatex(card.feedbackCorrect)}</div>` : ''}
        ${card.feedbackIncorrect && !isCorrect ? `<div class="exam__feedback-message">${renderWithLatex(card.feedbackIncorrect)}</div>` : ''}
      </div>
    `;
  },

  mount(container, state) {
    container.innerHTML = this.render(state);
    this._bindEvents(container);
  },

  _bindEvents(container) {
    const exam = State.get('currentExam');
    if (!exam) return;

    // Quit button
    container.querySelector('.exam__quit')?.addEventListener('click', () => {
      if (confirm(PageUtils.getTranslator()('exam.quitConfirm'))) {
        State.set('currentExam', null);
        Router.navigate('/home');
      }
    });

    // Submit button
    container.querySelector('.exam__submit')?.addEventListener('click', () => {
      this._submitAnswer(container);
    });

    // Enter key to submit
    container.querySelector('.exam__input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._submitAnswer(container);
    });

    // Next button
    container.querySelector('.exam__next')?.addEventListener('click', () => {
      this._nextQuestion(container);
    });

    // Focus input
    container.querySelector('.exam__input')?.focus();
  },

  _submitAnswer(container) {
    const exam = State.get('currentExam');
    if (!exam || exam.isShowingFeedback) return;

    const card = exam.cards[exam.currentIndex];
    const type = card.type || 'text';

    let userAnswer = '';
    if (type === 'mcq') {
      userAnswer = container.querySelector('input[name="exam-mcq"]:checked')?.value || '';
    } else if (type === 'truefalse') {
      userAnswer = container.querySelector('input[name="exam-tf"]:checked')?.value || '';
    } else {
      userAnswer = container.querySelector('#exam-answer')?.value?.trim() || '';
    }

    if (!userAnswer) {
      alert(PageUtils.getTranslator()('validation.emptyInput'));
      return;
    }

    // Validate answer
    const deck = (State.get('decks') || []).find(d => d.id === exam.deckId);
    const isCorrect = GameAnswerValidator.checkAnswer(card, userAnswer, deck);
    const points = Number(card.points) || 1;
    const earnedPoints = isCorrect ? points : -(card.penalty || 0) * points / 100;

    // Update exam state
    exam.results.push({
      cardId: card.id,
      userAnswer,
      isCorrect,
      earnedPoints
    });

    exam.currentScore = Math.max(0, exam.currentScore + earnedPoints);
    exam.stats.cardsAnswered++;
    if (isCorrect) {
      exam.stats.correctAnswers++;
    } else {
      exam.stats.wrongAnswers++;
    }

    exam.isShowingFeedback = true;
    exam.lastResult = { userAnswer, isCorrect, earnedPoints };

    State.set('currentExam', exam);
    this.mount(container, State.getAll());
  },

  _nextQuestion(container) {
    const exam = State.get('currentExam');
    if (!exam) return;

    exam.currentIndex++;
    exam.isShowingFeedback = false;
    exam.lastResult = null;

    if (exam.currentIndex >= exam.cards.length) {
      // Exam finished - show results
      exam.endedAt = new Date().toISOString();
      State.set('currentExam', exam);
      Router.navigate('/exam-results');
    } else {
      State.set('currentExam', exam);
      this.mount(container, State.getAll());
    }
  }
};

// ═══════════════════════════════════════════════════════════════
// EXAM RESULTS - Résultats de l'examen
// ═══════════════════════════════════════════════════════════════

Pages.examResults = {
  render(state) {
    const exam = state.currentExam;
    const _t = PageUtils.getTranslator();

    if (!exam) {
      Router.navigate('/home');
      return '';
    }

    const { results, maxScore, currentScore, stats, deckName, startedAt, endedAt } = exam;
    const scorePercent = maxScore > 0 ? Math.round((currentScore / maxScore) * 100) : 0;
    const accuracy = stats.cardsAnswered > 0 ? Math.round((stats.correctAnswers / stats.cardsAnswered) * 100) : 0;

    // Calculer le temps total
    const duration = endedAt && startedAt
      ? Math.round((new Date(endedAt) - new Date(startedAt)) / 1000)
      : 0;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;

    // Déterminer l'appréciation
    let appreciation = '';
    let appreciationClass = '';
    if (scorePercent >= 90) {
      appreciation = '🌟 ' + _t('exam.excellent');
      appreciationClass = 'excellent';
    } else if (scorePercent >= 70) {
      appreciation = '👍 ' + _t('exam.good');
      appreciationClass = 'good';
    } else if (scorePercent >= 50) {
      appreciation = '📚 ' + _t('exam.average');
      appreciationClass = 'average';
    } else {
      appreciation = '💪 ' + _t('exam.poor');
      appreciationClass = 'poor';
    }

    return `
      <div class="page page--exam-results">
        <div class="exam-results">
          <h1 class="exam-results__title">📊 ${_t('exam.resultsTitle')}</h1>

          <div class="exam-results__score-section">
            <div class="exam-results__score ${appreciationClass}">
              ${currentScore.toFixed(1)} / ${maxScore}
            </div>
            <div class="exam-results__percent">${scorePercent}%</div>
            <div class="exam-results__appreciation ${appreciationClass}">${appreciation}</div>
          </div>

          <div class="exam-results__stats">
            <div class="exam-results__stat">
              <div class="exam-results__stat-value">${stats.correctAnswers}</div>
              <div class="exam-results__stat-label">${_t('exam.statCorrect')}</div>
            </div>
            <div class="exam-results__stat">
              <div class="exam-results__stat-value">${stats.wrongAnswers}</div>
              <div class="exam-results__stat-label">${_t('exam.statWrong')}</div>
            </div>
            <div class="exam-results__stat">
              <div class="exam-results__stat-value">${minutes}:${String(seconds).padStart(2, '0')}</div>
              <div class="exam-results__stat-label">${_t('exam.statTime')}</div>
            </div>
          </div>

          <div class="exam-results__actions">
            <button class="btn btn--primary exam-results__home">${_t('game.backHome')}</button>
            <button class="btn btn--secondary exam-results__retry">${_t('exam.retry')}</button>
          </div>
        </div>
      </div>
    `;
  },

  mount(container, state) {
    container.innerHTML = this.render(state);

    const exam = state.currentExam;
    if (!exam) return;

    // Home button
    container.querySelector('.exam-results__home')?.addEventListener('click', () => {
      State.set('currentExam', null);
      Router.navigate('/home');
    });

    // Retry button
    container.querySelector('.exam-results__retry')?.addEventListener('click', () => {
      const deckId = exam.deckId;
      State.set('currentExam', null);
      Router.navigate(`/exam/${deckId}`);
    });
  }
};
