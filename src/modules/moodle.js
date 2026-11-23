/**
 * Module Moodle - Import de fichiers XML Moodle
 *
 * Parse les fichiers XML au format Moodle et les convertit en cartes
 * Types supportés : multichoice, truefalse, shortanswer, numerical, matching, cloze
 *
 * @see https://docs.moodle.org/test/Moodle_XML_format
 */

const Moodle = {
  /**
   * Parse un fichier XML Moodle et retourne un deck
   *
   * @param {string} xmlString - Contenu XML du fichier Moodle
   * @param {string} deckName - Nom du deck à créer
   * @returns {Object} - Deck avec les cartes parsées
   */
  parseXML(xmlString, deckName = 'Import Moodle') {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');

    // Vérifier les erreurs de parsing
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      throw new Error('Erreur de parsing XML: ' + parseError.textContent);
    }

    const questions = doc.querySelectorAll('question');
    const cards = [];

    questions.forEach((question, index) => {
      const type = question.getAttribute('type');

      // Ignorer les questions de type "category" (utilisées pour organiser)
      if (type === 'category') return;

      try {
        const card = this._parseQuestion(question, type, index);
        if (card) {
          cards.push(card);
        }
      } catch (e) {
        console.warn(`Erreur parsing question ${index}:`, e.message);
      }
    });

    return {
      id: 'moodle_' + Date.now(),
      name: deckName,
      description: `Importé depuis Moodle (${cards.length} questions)`,
      category: ['import', 'moodle'],
      difficulty: 2,
      language: 'fr',
      settings: {
        bidirectional: false,
        sequential: false
      },
      cards: cards.map(card => ({
        ...card,
        box: 'never_played',
        latencyThreshold: null,
        bestResponseTimeMs: null,
        lastResponseTimeMs: null,
        restUntil: null,
        timesPlayed: 0,
        timesCorrect: 0
      }))
    };
  },

  /**
   * Parse une question selon son type
   */
  _parseQuestion(question, type, index) {
    const name = this._getText(question, 'name > text') || `Question ${index + 1}`;
    const questionText = this._getText(question, 'questiontext > text') || '';

    const baseCard = {
      id: `moodle_${Date.now()}_${index}`,
      name: name
    };

    switch (type) {
      case 'multichoice':
        return this._parseMultichoice(question, questionText, baseCard);

      case 'truefalse':
        return this._parseTrueFalse(question, questionText, baseCard);

      case 'shortanswer':
        return this._parseShortAnswer(question, questionText, baseCard);

      case 'numerical':
        return this._parseNumerical(question, questionText, baseCard);

      case 'matching':
      case 'match':
        return this._parseMatching(question, questionText, baseCard);

      case 'cloze':
      case 'multianswer':
        return this._parseCloze(question, questionText, baseCard);

      default:
        console.warn(`Type de question non supporté: ${type}`);
        return null;
    }
  },

  /**
   * Parse une question à choix multiples
   */
  _parseMultichoice(question, questionText, baseCard) {
    const answers = question.querySelectorAll('answer');
    const choices = [];
    let correctAnswers = [];

    answers.forEach((answer, i) => {
      const text = this._getText(answer, 'text') || '';
      const fraction = parseFloat(answer.getAttribute('fraction') || '0');

      choices.push({
        id: String.fromCharCode(65 + i), // A, B, C, D...
        text: text
      });

      if (fraction > 0) {
        correctAnswers.push({
          id: String.fromCharCode(65 + i),
          text: text,
          fraction: fraction
        });
      }
    });

    // Déterminer si c'est une question à réponse unique ou multiple
    const single = this._getText(question, 'single') !== 'false';

    return {
      ...baseCard,
      question: questionText,
      type: 'mcq',
      choices: choices,
      answer: correctAnswers.map(a => a.id).join(','),
      correctAnswers: correctAnswers,
      single: single,
      shuffleChoices: this._getText(question, 'shuffleanswers') !== '0'
    };
  },

  /**
   * Parse une question Vrai/Faux
   */
  _parseTrueFalse(question, questionText, baseCard) {
    const answers = question.querySelectorAll('answer');
    let correctAnswer = 'true';

    answers.forEach(answer => {
      const fraction = parseFloat(answer.getAttribute('fraction') || '0');
      const text = this._getText(answer, 'text') || '';

      if (fraction === 100) {
        correctAnswer = text.toLowerCase() === 'true' || text.toLowerCase() === 'vrai' ? 'true' : 'false';
      }
    });

    return {
      ...baseCard,
      question: questionText,
      type: 'truefalse',
      answer: correctAnswer,
      choices: [
        { id: 'true', text: 'Vrai' },
        { id: 'false', text: 'Faux' }
      ]
    };
  },

  /**
   * Parse une question à réponse courte
   */
  _parseShortAnswer(question, questionText, baseCard) {
    const answers = question.querySelectorAll('answer');
    const acceptedAnswers = [];

    answers.forEach(answer => {
      const fraction = parseFloat(answer.getAttribute('fraction') || '0');
      if (fraction > 0) {
        const text = this._getText(answer, 'text') || '';
        acceptedAnswers.push(text);
      }
    });

    return {
      ...baseCard,
      question: questionText,
      type: 'text',
      answer: acceptedAnswers[0] || '',
      acceptedAnswers: acceptedAnswers
    };
  },

  /**
   * Parse une question numérique
   */
  _parseNumerical(question, questionText, baseCard) {
    const answers = question.querySelectorAll('answer');
    let correctAnswer = '';
    let tolerance = 0;

    answers.forEach(answer => {
      const fraction = parseFloat(answer.getAttribute('fraction') || '0');
      if (fraction > 0) {
        correctAnswer = this._getText(answer, 'text') || '';
        tolerance = parseFloat(this._getText(answer, 'tolerance') || '0');
      }
    });

    return {
      ...baseCard,
      question: questionText,
      type: 'numeric',
      answer: correctAnswer,
      tolerance: tolerance
    };
  },

  /**
   * Parse une question d'appariement (matching)
   */
  _parseMatching(question, questionText, baseCard) {
    const subquestions = question.querySelectorAll('subquestion');
    const pairs = [];

    subquestions.forEach((subq, i) => {
      const premise = this._getText(subq, 'text') || '';
      const response = this._getText(subq, 'answer > text') || '';

      if (premise && response) {
        pairs.push({
          id: i,
          premise: premise,
          response: response
        });
      }
    });

    return {
      ...baseCard,
      question: questionText,
      type: 'matching',
      pairs: pairs,
      answer: pairs.map(p => `${p.id}:${p.response}`).join('|')
    };
  },

  /**
   * Parse une question à trous (cloze/multianswer)
   * Format: {1:SHORTANSWER:=answer} ou {1:MULTICHOICE:=correct~wrong}
   */
  _parseCloze(question, questionText, baseCard) {
    const blanks = [];
    let processedText = questionText;
    let blankIndex = 0;

    // Regex pour trouver les trous : {grade:TYPE:answers}
    const clozeRegex = /\{(\d*):?(SHORTANSWER|SA|MW|SHORTANSWER_C|SAC|MWC|NUMERICAL|NM|MULTICHOICE|MC|MULTICHOICE_S|MCS|MULTICHOICE_H|MCH|MULTICHOICE_V|MCV|MULTICHOICE_HS|MCHS|MULTICHOICE_VS|MCVS):([^}]+)\}/gi;

    let match;
    while ((match = clozeRegex.exec(questionText)) !== null) {
      const grade = match[1] || '1';
      const type = match[2].toUpperCase();
      const answersStr = match[3];

      const blank = this._parseClozeBlank(type, answersStr, blankIndex);
      blank.grade = parseFloat(grade);
      blanks.push(blank);

      // Remplacer par un placeholder
      processedText = processedText.replace(match[0], `{{blank_${blankIndex}}}`);
      blankIndex++;
    }

    return {
      ...baseCard,
      question: processedText,
      type: 'cloze',
      blanks: blanks,
      answer: blanks.map(b => b.correctAnswer).join('|')
    };
  },

  /**
   * Parse un trou individuel dans une question cloze
   */
  _parseClozeBlank(type, answersStr, index) {
    const isMultichoice = type.startsWith('MULTICHOICE') || type.startsWith('MC');
    const isNumerical = type === 'NUMERICAL' || type === 'NM';
    const isCaseSensitive = type.includes('_C') || type === 'SAC' || type === 'MWC';

    const choices = [];
    let correctAnswer = '';

    // Parser les réponses : =correct#feedback~wrong#feedback~%50%partial
    const parts = answersStr.split('~');

    parts.forEach((part, i) => {
      let text = part;
      let isCorrect = false;
      let fraction = 0;
      let feedback = '';

      // Extraire le feedback après #
      if (text.includes('#')) {
        [text, feedback] = text.split('#');
      }

      // Vérifier si c'est la réponse correcte (commence par =)
      if (text.startsWith('=')) {
        text = text.substring(1);
        isCorrect = true;
        fraction = 100;
      }
      // Vérifier si c'est une réponse partielle (%50%)
      else if (text.match(/^%(\d+)%/)) {
        const percentMatch = text.match(/^%(\d+)%/);
        fraction = parseFloat(percentMatch[1]);
        text = text.substring(percentMatch[0].length);
        isCorrect = fraction > 0;
      }

      if (isCorrect && !correctAnswer) {
        correctAnswer = text;
      }

      choices.push({
        id: String.fromCharCode(65 + i),
        text: text,
        isCorrect: isCorrect,
        fraction: fraction,
        feedback: feedback
      });
    });

    return {
      id: index,
      type: isMultichoice ? 'mcq' : (isNumerical ? 'numeric' : 'text'),
      choices: isMultichoice ? choices : [],
      correctAnswer: correctAnswer,
      caseSensitive: isCaseSensitive,
      acceptedAnswers: choices.filter(c => c.isCorrect).map(c => c.text)
    };
  },

  /**
   * Utilitaire pour extraire le texte d'un élément
   */
  _getText(parent, selector) {
    const el = parent.querySelector(selector);
    if (!el) return null;

    // Gérer les CDATA
    let text = el.textContent || '';

    // Nettoyer le HTML basique
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<p>/gi, '');
    text = text.replace(/<\/p>/gi, '\n');
    text = text.replace(/<[^>]+>/g, '');
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&amp;/g, '&');
    text = text.trim();

    return text;
  },

  /**
   * Valide un fichier XML Moodle
   */
  validate(xmlString) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlString, 'text/xml');

      if (doc.querySelector('parsererror')) {
        return { valid: false, error: 'XML invalide' };
      }

      const quiz = doc.querySelector('quiz');
      if (!quiz) {
        return { valid: false, error: 'Balise <quiz> non trouvée' };
      }

      const questions = doc.querySelectorAll('question');
      const validQuestions = Array.from(questions).filter(q =>
        q.getAttribute('type') !== 'category'
      );

      if (validQuestions.length === 0) {
        return { valid: false, error: 'Aucune question trouvée' };
      }

      return {
        valid: true,
        questionCount: validQuestions.length,
        types: [...new Set(validQuestions.map(q => q.getAttribute('type')))]
      };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }
};

// Export pour tests Node.js
if (typeof module !== 'undefined') {
  module.exports = Moodle;
}
