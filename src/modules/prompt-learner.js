/**
 * Module PromptLearner - Apprentissage et amélioration des prompts
 *
 * Ce module collecte les données de validation pour :
 * - Suivre l'historique des corrections (itérations)
 * - Détecter les patterns d'erreurs récurrents
 * - Suggérer des améliorations au prompt initial
 * - Mesurer l'efficacité des corrections
 * - Analyser les tendances de qualité par domaine
 * - Générer des recommandations contextuelles
 *
 * Version 2.0 - Améliorations :
 * - Catégorisation avancée des erreurs (format, contenu, pédagogie)
 * - Analyse des tendances de qualité (trend analysis)
 * - Suggestions contextuelles adaptées au domaine
 * - Export/Import de l'apprentissage
 * - Intégration DeckValidator (hallucinations, readability)
 * - Scoring de qualité du prompt
 */

const PromptLearner = {
  // ═══════════════════════════════════════════════════════════════
  // CONSTANTES
  // ═══════════════════════════════════════════════════════════════

  VERSION: 2,

  /**
   * Catégories d'erreurs
   */
  ERROR_CATEGORIES: {
    FORMAT: 'format',           // Erreurs de structure YAML, IDs manquants
    CONTENT: 'content',         // Erreurs de contenu (réponse manquante, QCM mal formé)
    PEDAGOGY: 'pedagogy',       // Problèmes pédagogiques (réponse trop longue, pas d'alternatives)
    QUALITY: 'quality',         // Qualité (lisibilité, hallucinations, risque factuel)
    DUPLICATION: 'duplication'  // Doublons
  },

  /**
   * Mapping code d'erreur → catégorie
   */
  ERROR_CODE_TO_CATEGORY: {
    'CARD_ID_MISSING': 'format',
    'QUESTION_MISSING': 'format',
    'ANSWER_MISSING': 'format',
    'DECK_ID_MISSING': 'format',
    'CARDS_MISSING': 'format',
    'CARDS_EMPTY': 'format',
    'INVALID_TYPE': 'format',
    'DUPLICATE_IDS': 'format',

    'MCQ_OPTIONS_MISSING': 'content',
    'MCQ_INVALID_ANSWER': 'content',
    'MCQ_ANSWER_IS_TEXT': 'content',
    'MCQ_OPTION_NO_ID': 'content',
    'MCQ_OPTION_NO_TEXT': 'content',
    'MCQ_TOO_FEW_OPTIONS': 'content',
    'BOOLEAN_INVALID_ANSWER': 'content',
    'NUMERIC_INVALID_ANSWER': 'content',

    'ANSWER_TOO_LONG': 'pedagogy',
    'NO_ALTERNATIVES': 'pedagogy',
    'ANSWER_IN_QUESTION': 'pedagogy',
    'MCQ_ANSWER_TEXT_IN_QUESTION': 'pedagogy',
    'MCQ_FLAW': 'pedagogy',

    'FACTUAL_RISK': 'quality',
    'HALLUCINATION_DATE': 'quality',
    'HALLUCINATION_PERCENTAGE': 'quality',
    'HALLUCINATION_STATISTIC': 'quality',
    'HALLUCINATION_QUOTE': 'quality',
    'HALLUCINATION_PROPER_NOUN': 'quality',
    'HALLUCINATION_ABSOLUTE': 'quality',
    'READABILITY_MISMATCH': 'quality',
    'DECK_READABILITY_MISMATCH': 'quality',

    'DUPLICATES': 'duplication'
  },

  // ═══════════════════════════════════════════════════════════════
  // STOCKAGE DES DONNÉES D'APPRENTISSAGE
  // ═══════════════════════════════════════════════════════════════

  STORAGE_KEY: 'tyb_prompt_learner',

  /**
   * Structure des données stockées (version 2.0)
   */
  _defaultData: {
    version: 2,
    sessions: [],           // Historique des sessions de génération
    errorPatterns: {},      // Patterns d'erreurs détectés { code: count }
    errorsByCategory: {},   // Erreurs par catégorie { category: { code: count } }
    domainStats: {},        // Stats par domaine { domain: { ... } }
    correctionHistory: [],  // Historique des corrections efficaces
    qualityTrends: {},      // Tendances de qualité { domain: [{ date, score, sessions }] }
    lastUpdated: null
  },

  // ═══════════════════════════════════════════════════════════════
  // SESSION DE GÉNÉRATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Démarre une nouvelle session de génération
   *
   * @param {Object} config - Configuration du prompt
   * @returns {Object} - Session créée
   */
  startSession(config) {
    const session = {
      id: `session_${Date.now()}`,
      startedAt: new Date().toISOString(),
      config: {
        domain: config.domain,
        topic: config.topic,
        count: config.count,
        difficulty: config.difficulty,
        cardTypes: config.cardTypes
      },
      iterations: [],
      status: 'started'
    };

    this._currentSession = session;
    return session;
  },

  /**
   * Enregistre une itération (validation + correction)
   *
   * @param {Object} validationReport - Rapport de DeckValidator
   * @param {Object} deck - Le deck validé
   * @returns {Object} - Itération enregistrée
   */
  recordIteration(validationReport, deck) {
    if (!this._currentSession) {
      this._currentSession = this.startSession({ domain: 'unknown', topic: 'unknown' });
    }

    const iteration = {
      number: this._currentSession.iterations.length + 1,
      timestamp: new Date().toISOString(),
      cardsCount: deck?.cards?.length || 0,
      score: validationReport.averageScore,
      grade: validationReport.grade,
      stats: { ...validationReport.stats },
      errorCodes: this._extractErrorCodes(validationReport),
      isValid: validationReport.isValid
    };

    this._currentSession.iterations.push(iteration);

    // Mettre à jour les patterns d'erreurs
    this._updateErrorPatterns(iteration.errorCodes);

    return iteration;
  },

  /**
   * Termine la session et sauvegarde les données
   *
   * @param {boolean} imported - Si le deck a été importé
   */
  endSession(imported = false) {
    if (!this._currentSession) return;

    this._currentSession.endedAt = new Date().toISOString();
    this._currentSession.status = imported ? 'imported' : 'abandoned';
    this._currentSession.finalScore = this._currentSession.iterations.length > 0
      ? this._currentSession.iterations[this._currentSession.iterations.length - 1].score
      : 0;

    // Sauvegarder la session
    const data = this._loadData();
    data.sessions.push(this._currentSession);

    // Mettre à jour les stats du domaine
    this._updateDomainStats(data, this._currentSession);

    // Limiter l'historique (garder les 50 dernières sessions)
    if (data.sessions.length > 50) {
      data.sessions = data.sessions.slice(-50);
    }

    data.lastUpdated = new Date().toISOString();
    this._saveData(data);

    this._currentSession = null;
  },

  // ═══════════════════════════════════════════════════════════════
  // ANALYSE DES PATTERNS D'ERREURS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Extrait les codes d'erreur d'un rapport de validation
   */
  _extractErrorCodes(report) {
    const codes = [];

    // Issues du deck
    for (const issue of report.deckIssues || []) {
      codes.push(issue.code);
    }

    // Issues des cartes
    for (const cardResult of report.cardResults || []) {
      for (const issue of cardResult.issues || []) {
        codes.push(issue.code);
      }
      for (const warning of cardResult.warnings || []) {
        codes.push(warning.code);
      }
    }

    // Doublons
    if (report.duplicates?.length > 0) {
      codes.push('DUPLICATES');
    }

    return codes;
  },

  /**
   * Met à jour les patterns d'erreurs globaux
   */
  _updateErrorPatterns(errorCodes) {
    const data = this._loadData();

    for (const code of errorCodes) {
      data.errorPatterns[code] = (data.errorPatterns[code] || 0) + 1;

      // Catégoriser l'erreur
      const category = this._getErrorCategory(code);
      if (!data.errorsByCategory[category]) {
        data.errorsByCategory[category] = {};
      }
      data.errorsByCategory[category][code] = (data.errorsByCategory[category][code] || 0) + 1;
    }

    this._saveData(data);
  },

  /**
   * Détermine la catégorie d'une erreur
   */
  _getErrorCategory(code) {
    return this.ERROR_CODE_TO_CATEGORY[code] || 'quality';
  },

  /**
   * Met à jour les stats par domaine
   */
  _updateDomainStats(data, session) {
    const domain = session.config?.domain || 'unknown';

    if (!data.domainStats[domain]) {
      data.domainStats[domain] = {
        sessionsCount: 0,
        totalErrors: 0,
        totalWarnings: 0,
        totalScore: 0,
        avgScore: 0,
        importedCount: 0
      };
    }

    const stats = data.domainStats[domain];
    stats.sessionsCount++;

    if (session.iterations.length > 0) {
      const lastIteration = session.iterations[session.iterations.length - 1];
      stats.totalErrors += lastIteration.stats?.cardsWithErrors || 0;
      stats.totalWarnings += lastIteration.stats?.cardsWithWarnings || 0;
      stats.totalScore += lastIteration.score || 0;
      stats.avgScore = Math.round(stats.totalScore / stats.sessionsCount);
    }

    if (session.status === 'imported') {
      stats.importedCount++;
    }
  },

  /**
   * Récupère les erreurs les plus fréquentes
   *
   * @param {number} limit - Nombre max d'erreurs à retourner
   * @returns {Object[]} - Liste des erreurs triées par fréquence
   */
  getTopErrors(limit = 10) {
    const data = this._loadData();
    const sorted = Object.entries(data.errorPatterns)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit);

    return sorted.map(([code, count]) => ({
      code,
      count,
      description: this._getErrorDescription(code)
    }));
  },

  /**
   * Description des codes d'erreur pour l'affichage
   */
  _getErrorDescription(code) {
    const descriptions = {
      'ANSWER_MISSING': 'Réponse manquante',
      'QUESTION_MISSING': 'Question manquante',
      'CARD_ID_MISSING': 'ID de carte manquant',
      'MCQ_OPTIONS_MISSING': 'Options QCM manquantes',
      'MCQ_INVALID_ANSWER': 'Réponse QCM invalide (doit être l\'ID)',
      'MCQ_ANSWER_IS_TEXT': 'Réponse QCM est le texte au lieu de l\'ID',
      'ANSWER_TOO_LONG': 'Réponse trop longue',
      'DUPLICATES': 'Cartes en doublon',
      'NO_ALTERNATIVES': 'Pas d\'alternatives pour réponse texte',
      'BOOLEAN_INVALID_ANSWER': 'Réponse vrai/faux invalide',
      'NUMERIC_INVALID_ANSWER': 'Réponse numérique invalide',
      'ANSWER_IN_QUESTION': 'Réponse visible dans la question',
      'FACTUAL_RISK': 'Risque factuel détecté'
    };

    return descriptions[code] || code;
  },

  // ═══════════════════════════════════════════════════════════════
  // AMÉLIORATION DU PROMPT
  // ═══════════════════════════════════════════════════════════════

  /**
   * Génère des améliorations pour le prompt basées sur l'historique
   *
   * @param {string} domain - Domaine concerné
   * @returns {Object} - Suggestions d'amélioration
   */
  getPromptImprovements(domain = null) {
    const data = this._loadData();
    const topErrors = this.getTopErrors(5);
    const improvements = [];

    // Analyser les erreurs fréquentes
    for (const error of topErrors) {
      if (error.count >= 3) {
        const improvement = this._getImprovementForError(error.code);
        if (improvement) {
          improvements.push(improvement);
        }
      }
    }

    // Stats du domaine si spécifié
    let domainAdvice = null;
    if (domain && data.domainStats[domain]) {
      const stats = data.domainStats[domain];
      if (stats.avgScore < 60) {
        domainAdvice = `Le domaine "${domain}" a un score moyen de ${stats.avgScore}%. Considérez fournir plus d'exemples spécifiques.`;
      }
    }

    return {
      improvements,
      domainAdvice,
      summary: this._generateImprovementSummary(improvements)
    };
  },

  /**
   * Génère une amélioration pour un type d'erreur
   */
  _getImprovementForError(code) {
    const improvements = {
      'MCQ_INVALID_ANSWER': {
        type: 'prompt_addition',
        priority: 'high',
        text: '⚠️ IMPORTANT pour les QCM : `answer` doit être l\'ID de l\'option (ex: "B"), PAS le texte de la réponse.',
        example: 'answer: "B"  # Correct\nanswer: "Paris"  # INCORRECT'
      },
      'MCQ_ANSWER_IS_TEXT': {
        type: 'prompt_addition',
        priority: 'high',
        text: '⚠️ ERREUR FRÉQUENTE QCM : Ne mettez PAS le texte de la réponse dans `answer`, utilisez l\'ID (A, B, C, D).',
        example: null
      },
      'ANSWER_TOO_LONG': {
        type: 'prompt_addition',
        priority: 'medium',
        text: '📏 Les réponses doivent être COURTES : 1-3 mots maximum. Pas de phrases complètes.',
        example: 'answer: "Paris"  # Correct\nanswer: "La capitale de la France est Paris"  # TROP LONG'
      },
      'NO_ALTERNATIVES': {
        type: 'prompt_addition',
        priority: 'low',
        text: '🔄 Pour les cartes texte, ajoutez des alternatives (synonymes, abréviations).',
        example: 'alternatives:\n  - "ONU"\n  - "Nations Unies"'
      },
      'BOOLEAN_INVALID_ANSWER': {
        type: 'prompt_addition',
        priority: 'high',
        text: '✅❌ Pour type "truefalse", `answer` doit être `true` ou `false` (booléen YAML).',
        example: 'answer: true  # ou false'
      },
      'DUPLICATES': {
        type: 'prompt_addition',
        priority: 'medium',
        text: '🔍 Évitez les questions similaires ou redondantes. Chaque carte doit apporter une information unique.',
        example: null
      }
    };

    return improvements[code] || null;
  },

  /**
   * Génère un résumé des améliorations à ajouter au prompt
   */
  _generateImprovementSummary(improvements) {
    if (improvements.length === 0) return null;

    const highPriority = improvements.filter(i => i.priority === 'high');
    const mediumPriority = improvements.filter(i => i.priority === 'medium');

    let summary = '\n## ⚠️ ERREURS FRÉQUENTES À ÉVITER\n\n';

    if (highPriority.length > 0) {
      summary += '### Critiques\n';
      for (const imp of highPriority) {
        summary += `- ${imp.text}\n`;
        if (imp.example) summary += `  \`\`\`yaml\n  ${imp.example}\n  \`\`\`\n`;
      }
    }

    if (mediumPriority.length > 0) {
      summary += '\n### Importants\n';
      for (const imp of mediumPriority) {
        summary += `- ${imp.text}\n`;
      }
    }

    return summary;
  },

  /**
   * Génère une section d'amélioration à injecter dans le prompt
   *
   * @param {string} domain - Domaine concerné
   * @returns {string} - Section markdown à ajouter au prompt
   */
  generatePromptEnhancement(domain = null) {
    const { improvements, summary } = this.getPromptImprovements(domain);

    if (!summary) return '';

    return summary;
  },

  // ═══════════════════════════════════════════════════════════════
  // ANALYSE AVANCÉE DES ERREURS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Analyse détaillée des patterns d'erreurs
   *
   * @param {string} domain - Domaine spécifique (optionnel)
   * @returns {Object} - Analyse complète des erreurs
   */
  getErrorAnalysis(domain = null) {
    const data = this._loadData();
    let sessions = data.sessions;

    // Filtrer par domaine si spécifié
    if (domain) {
      sessions = sessions.filter(s => s.config?.domain === domain);
    }

    // Collecte des erreurs depuis toutes les itérations
    const errorCounts = {};
    const errorsByCategory = {};
    const errorsByDomain = {};
    const recentErrors = []; // Dernières 10 sessions

    for (const session of sessions.slice(-10)) {
      for (const iteration of session.iterations || []) {
        for (const code of iteration.errorCodes || []) {
          // Compter globalement
          errorCounts[code] = (errorCounts[code] || 0) + 1;

          // Par catégorie
          const category = this._getErrorCategory(code);
          if (!errorsByCategory[category]) {
            errorsByCategory[category] = {};
          }
          errorsByCategory[category][code] = (errorsByCategory[category][code] || 0) + 1;

          // Par domaine
          const sessionDomain = session.config?.domain || 'unknown';
          if (!errorsByDomain[sessionDomain]) {
            errorsByDomain[sessionDomain] = {};
          }
          errorsByDomain[sessionDomain][code] = (errorsByDomain[sessionDomain][code] || 0) + 1;

          // Erreurs récentes
          recentErrors.push({
            code,
            category,
            domain: sessionDomain,
            sessionId: session.id,
            timestamp: iteration.timestamp
          });
        }
      }
    }

    // Trier par fréquence
    const topErrors = Object.entries(errorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([code, count]) => ({
        code,
        count,
        category: this._getErrorCategory(code),
        description: this._getErrorDescription(code),
        percentage: sessions.length > 0 ? Math.round((count / sessions.length) * 100) : 0
      }));

    // Erreurs récurrentes (présentes dans >50% des sessions)
    const recurrentErrors = Object.entries(errorCounts)
      .filter(([, count]) => sessions.length > 0 && count / sessions.length > 0.5)
      .map(([code, count]) => ({
        code,
        count,
        frequency: sessions.length > 0 ? Math.round((count / sessions.length) * 100) : 0,
        category: this._getErrorCategory(code),
        description: this._getErrorDescription(code)
      }));

    // Distribution par catégorie
    const categoryDistribution = {};
    for (const [category, errors] of Object.entries(errorsByCategory)) {
      const totalInCategory = Object.values(errors).reduce((sum, count) => sum + count, 0);
      categoryDistribution[category] = {
        total: totalInCategory,
        percentage: Object.values(errorCounts).reduce((sum, count) => sum + count, 0) > 0
          ? Math.round((totalInCategory / Object.values(errorCounts).reduce((sum, count) => sum + count, 0)) * 100)
          : 0,
        topErrors: Object.entries(errors)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([code, count]) => ({ code, count, description: this._getErrorDescription(code) }))
      };
    }

    // Tendance (amélioration ou dégradation)
    const trend = this._calculateErrorTrend(sessions);

    return {
      domain: domain || 'global',
      totalSessions: sessions.length,
      totalErrors: Object.values(errorCounts).reduce((sum, count) => sum + count, 0),
      uniqueErrorTypes: Object.keys(errorCounts).length,
      topErrors,
      recurrentErrors,
      categoryDistribution,
      errorsByDomain: domain ? null : errorsByDomain,
      recentErrors: recentErrors.slice(-20),
      trend
    };
  },

  /**
   * Calcule la tendance d'évolution des erreurs
   */
  _calculateErrorTrend(sessions) {
    if (sessions.length < 2) {
      return { direction: 'insufficient_data', change: 0 };
    }

    // Comparer les 5 dernières sessions avec les 5 précédentes
    const recent = sessions.slice(-5);
    const previous = sessions.slice(-10, -5);

    if (previous.length === 0) {
      return { direction: 'insufficient_data', change: 0 };
    }

    const recentErrorCount = recent.reduce((sum, s) =>
      sum + (s.iterations || []).reduce((iSum, i) => iSum + (i.errorCodes || []).length, 0), 0
    ) / recent.length;

    const previousErrorCount = previous.reduce((sum, s) =>
      sum + (s.iterations || []).reduce((iSum, i) => iSum + (i.errorCodes || []).length, 0), 0
    ) / previous.length;

    const change = previousErrorCount > 0
      ? Math.round(((recentErrorCount - previousErrorCount) / previousErrorCount) * 100)
      : 0;

    let direction;
    if (change < -10) direction = 'improving';
    else if (change > 10) direction = 'degrading';
    else direction = 'stable';

    return {
      direction,
      change,
      recentAvg: Math.round(recentErrorCount * 10) / 10,
      previousAvg: Math.round(previousErrorCount * 10) / 10
    };
  },

  // ═══════════════════════════════════════════════════════════════
  // SUGGESTIONS CONTEXTUELLES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Génère des suggestions d'amélioration contextuelles
   *
   * @param {string} domain - Domaine spécifique
   * @param {number} limit - Nombre max de suggestions (défaut: 5)
   * @returns {Object[]} - Liste de suggestions priorisées
   */
  getSuggestions(domain = null, limit = 5) {
    const analysis = this.getErrorAnalysis(domain);
    const suggestions = [];

    // Suggestions basées sur les erreurs récurrentes
    for (const error of analysis.recurrentErrors) {
      const suggestion = this._getSuggestionForError(error.code, error.category, domain);
      if (suggestion) {
        suggestions.push({
          ...suggestion,
          priority: this._calculateSuggestionPriority(error.frequency, error.category),
          frequency: error.frequency,
          errorCode: error.code
        });
      }
    }

    // Suggestions basées sur les erreurs les plus fréquentes (non récurrentes)
    for (const error of analysis.topErrors.slice(0, 5)) {
      if (!analysis.recurrentErrors.find(re => re.code === error.code)) {
        const suggestion = this._getSuggestionForError(error.code, error.category, domain);
        if (suggestion) {
          suggestions.push({
            ...suggestion,
            priority: this._calculateSuggestionPriority(error.percentage, error.category),
            frequency: error.percentage,
            errorCode: error.code
          });
        }
      }
    }

    // Suggestions spécifiques au domaine
    if (domain) {
      const domainSuggestions = this._getDomainSpecificSuggestions(domain, analysis);
      suggestions.push(...domainSuggestions);
    }

    // Trier par priorité (high > medium > low) puis par fréquence
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    suggestions.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return (b.frequency || 0) - (a.frequency || 0);
    });

    // Dédupliquer (garder la meilleure priorité)
    const seen = new Set();
    const uniqueSuggestions = suggestions.filter(s => {
      if (seen.has(s.text)) return false;
      seen.add(s.text);
      return true;
    });

    return uniqueSuggestions.slice(0, limit);
  },

  /**
   * Calcule la priorité d'une suggestion
   */
  _calculateSuggestionPriority(frequency, category) {
    // Catégories critiques
    if (category === 'format' || category === 'content') {
      return frequency > 30 ? 'high' : 'medium';
    }

    // Catégories importantes
    if (category === 'pedagogy' || category === 'duplication') {
      return frequency > 50 ? 'high' : frequency > 20 ? 'medium' : 'low';
    }

    // Catégories qualité
    return frequency > 60 ? 'medium' : 'low';
  },

  /**
   * Génère une suggestion pour un code d'erreur
   */
  _getSuggestionForError(code, category, domain) {
    const baseSuggestions = this._getImprovementForError(code);
    if (!baseSuggestions) return null;

    // Adapter la suggestion au domaine
    let adaptedText = baseSuggestions.text;
    let adaptedExample = baseSuggestions.example;

    if (domain) {
      const domainContext = this._getDomainContext(domain);
      if (domainContext) {
        adaptedText = `${adaptedText} ${domainContext.hint || ''}`.trim();
        adaptedExample = domainContext.example || adaptedExample;
      }
    }

    return {
      type: baseSuggestions.type,
      text: adaptedText,
      example: adaptedExample,
      category
    };
  },

  /**
   * Retourne le contexte spécifique à un domaine
   */
  _getDomainContext(domain) {
    const contexts = {
      'maths': {
        hint: 'Pour les maths, privilégiez les réponses numériques précises.',
        example: 'answer: 42  # Pas "quarante-deux"'
      },
      'histoire': {
        hint: 'Pour l\'histoire, vérifiez toujours les dates et noms propres.',
        example: 'Vérifiez les dates dans des sources fiables (Wikipedia, encyclopédies)'
      },
      'géographie': {
        hint: 'Pour la géographie, vérifiez l\'orthographe des lieux.',
        example: 'alternatives:\n  - "États-Unis"\n  - "USA"\n  - "Etats-Unis"'
      },
      'langues': {
        hint: 'Pour les langues, ajoutez toujours des alternatives (synonymes, variantes).',
        example: 'alternatives:\n  - "bonjour"\n  - "salut"\n  - "hello"'
      },
      'sciences': {
        hint: 'Pour les sciences, soyez précis et vérifiez les termes techniques.',
        example: 'Utilisez la nomenclature scientifique exacte'
      }
    };

    return contexts[domain?.toLowerCase()] || null;
  },

  /**
   * Génère des suggestions spécifiques au domaine
   */
  _getDomainSpecificSuggestions(domain, analysis) {
    const suggestions = [];
    const domainStats = this._loadData().domainStats[domain];

    if (!domainStats) return suggestions;

    // Si score moyen bas
    if (domainStats.avgScore < 60) {
      suggestions.push({
        type: 'domain_quality',
        text: `Le domaine "${domain}" a un score moyen de ${domainStats.avgScore}%. Envisagez de fournir plus d'exemples spécifiques au contexte.`,
        example: 'Ajoutez des exemples concrets dans le prompt initial',
        category: 'quality',
        priority: 'high',
        frequency: 100
      });
    }

    // Si beaucoup d'erreurs de qualité
    const qualityErrors = analysis.categoryDistribution?.quality?.total || 0;
    const totalErrors = analysis.totalErrors;
    if (totalErrors > 0 && qualityErrors / totalErrors > 0.4) {
      suggestions.push({
        type: 'domain_verification',
        text: `${Math.round((qualityErrors / totalErrors) * 100)}% des erreurs sont liées à la qualité. Demandez au LLM de vérifier les faits.`,
        example: '## IMPORTANT\nVérifiez TOUS les faits (dates, chiffres, noms) dans des sources fiables avant de générer.',
        category: 'quality',
        priority: 'high',
        frequency: Math.round((qualityErrors / totalErrors) * 100)
      });
    }

    return suggestions;
  },

  // ═══════════════════════════════════════════════════════════════
  // ANALYSE DE TENDANCE DE QUALITÉ
  // ═══════════════════════════════════════════════════════════════

  /**
   * Analyse l'évolution de la qualité sur plusieurs sessions
   *
   * @param {number} sessionCount - Nombre de sessions à analyser (défaut: 10)
   * @returns {Object} - Tendances de qualité
   */
  getQualityTrend(sessionCount = 10) {
    const data = this._loadData();
    const recentSessions = data.sessions.slice(-sessionCount);

    if (recentSessions.length === 0) {
      return {
        trend: 'insufficient_data',
        sessions: [],
        averageScore: 0,
        improvement: 0,
        recommendation: 'Générez plus de decks pour analyser les tendances'
      };
    }

    // Calculer les scores par session
    const sessionScores = recentSessions.map(session => {
      const iterations = session.iterations || [];
      if (iterations.length === 0) {
        return {
          sessionId: session.id,
          date: session.startedAt,
          domain: session.config?.domain,
          score: 0,
          iterations: 0,
          finalScore: 0,
          improved: false
        };
      }

      const firstScore = iterations[0]?.score || 0;
      const lastScore = iterations[iterations.length - 1]?.score || 0;

      return {
        sessionId: session.id,
        date: session.startedAt,
        domain: session.config?.domain,
        score: lastScore,
        iterations: iterations.length,
        firstScore,
        finalScore: lastScore,
        improved: lastScore > firstScore,
        improvement: lastScore - firstScore
      };
    });

    // Calculer les métriques
    const avgScore = sessionScores.reduce((sum, s) => sum + s.score, 0) / sessionScores.length;
    const avgIterations = sessionScores.reduce((sum, s) => sum + s.iterations, 0) / sessionScores.length;
    const improvementRate = sessionScores.filter(s => s.improved).length / sessionScores.length;

    // Tendance (comparer première moitié vs seconde moitié)
    const midpoint = Math.floor(sessionScores.length / 2);
    const firstHalfAvg = sessionScores.slice(0, midpoint).reduce((sum, s) => sum + s.score, 0) / midpoint || 0;
    const secondHalfAvg = sessionScores.slice(midpoint).reduce((sum, s) => sum + s.score, 0) / (sessionScores.length - midpoint) || 0;
    const overallImprovement = secondHalfAvg - firstHalfAvg;

    let trend;
    if (overallImprovement > 10) trend = 'improving';
    else if (overallImprovement < -10) trend = 'degrading';
    else trend = 'stable';

    // Recommandation
    let recommendation;
    if (trend === 'degrading') {
      recommendation = 'Les prompts se dégradent. Revoyez les consignes de base et les exemples.';
    } else if (avgScore < 60) {
      recommendation = 'Score moyen faible. Ajoutez plus de contraintes et d\'exemples au prompt.';
    } else if (avgIterations > 3) {
      recommendation = 'Trop d\'itérations nécessaires. Renforcez les consignes initiales.';
    } else if (trend === 'improving') {
      recommendation = 'Bonne progression ! Continuez à affiner les prompts.';
    } else {
      recommendation = 'Qualité stable. Explorez de nouveaux domaines.';
    }

    // Identifier les domaines problématiques
    const domainScores = {};
    for (const session of sessionScores) {
      if (session.domain) {
        if (!domainScores[session.domain]) {
          domainScores[session.domain] = { scores: [], count: 0 };
        }
        domainScores[session.domain].scores.push(session.score);
        domainScores[session.domain].count++;
      }
    }

    const domainAverages = {};
    for (const [domain, data] of Object.entries(domainScores)) {
      domainAverages[domain] = Math.round(data.scores.reduce((sum, s) => sum + s, 0) / data.count);
    }

    return {
      trend,
      sessions: sessionScores,
      averageScore: Math.round(avgScore),
      averageIterations: Math.round(avgIterations * 10) / 10,
      improvementRate: Math.round(improvementRate * 100),
      overallImprovement: Math.round(overallImprovement),
      domainAverages,
      recommendation
    };
  },

  // ═══════════════════════════════════════════════════════════════
  // EXPORT / IMPORT
  // ═══════════════════════════════════════════════════════════════

  /**
   * Exporte toutes les données d'apprentissage
   *
   * @returns {string} - JSON des données
   */
  exportLearning() {
    const data = this._loadData();

    // Ajouter métadonnées d'export
    const exportData = {
      ...data,
      exportedAt: new Date().toISOString(),
      exportVersion: this.VERSION
    };

    return JSON.stringify(exportData, null, 2);
  },

  /**
   * Importe des données d'apprentissage
   *
   * @param {string|Object} jsonData - Données JSON ou objet
   * @param {Object} options - Options d'import
   * @param {boolean} options.merge - Fusionner avec données existantes (défaut: false)
   * @param {boolean} options.overwrite - Écraser les données existantes (défaut: true)
   * @returns {Object} - Résultat de l'import
   */
  importLearning(jsonData, options = {}) {
    const { merge = false, overwrite = true } = options;

    try {
      // Parser si string
      const importedData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

      // Valider la structure
      if (!importedData.version || !importedData.sessions) {
        return {
          success: false,
          error: 'Format de données invalide (version ou sessions manquant)'
        };
      }

      // Vérifier la compatibilité de version
      if (importedData.version > this.VERSION) {
        return {
          success: false,
          error: `Version incompatible (données: v${importedData.version}, module: v${this.VERSION})`
        };
      }

      // Charger les données actuelles
      const currentData = this._loadData();

      let finalData;

      if (merge) {
        // Fusionner les données
        finalData = this._mergeData(currentData, importedData);
      } else if (overwrite) {
        // Remplacer complètement
        finalData = {
          ...this._defaultData,
          ...importedData,
          version: this.VERSION,
          lastUpdated: new Date().toISOString()
        };
      } else {
        return {
          success: false,
          error: 'Options d\'import invalides (merge=false et overwrite=false)'
        };
      }

      // Sauvegarder
      this._saveData(finalData);

      return {
        success: true,
        sessionsImported: importedData.sessions?.length || 0,
        mode: merge ? 'merge' : 'overwrite',
        message: merge
          ? `${importedData.sessions.length} sessions fusionnées avec succès`
          : `${importedData.sessions.length} sessions importées avec succès`
      };

    } catch (error) {
      return {
        success: false,
        error: `Erreur d'import: ${error.message}`
      };
    }
  },

  /**
   * Fusionne deux ensembles de données
   */
  _mergeData(current, imported) {
    return {
      version: this.VERSION,
      sessions: [...current.sessions, ...imported.sessions],
      errorPatterns: this._mergeObjectCounts(current.errorPatterns, imported.errorPatterns),
      errorsByCategory: this._mergeNestedCounts(current.errorsByCategory, imported.errorsByCategory),
      domainStats: this._mergeDomainStats(current.domainStats, imported.domainStats),
      correctionHistory: [...(current.correctionHistory || []), ...(imported.correctionHistory || [])],
      qualityTrends: this._mergeQualityTrends(current.qualityTrends, imported.qualityTrends),
      lastUpdated: new Date().toISOString()
    };
  },

  /**
   * Fusionne deux objets de comptage { key: count }
   */
  _mergeObjectCounts(obj1, obj2) {
    const result = { ...obj1 };
    for (const [key, count] of Object.entries(obj2 || {})) {
      result[key] = (result[key] || 0) + count;
    }
    return result;
  },

  /**
   * Fusionne deux objets de comptage imbriqués { category: { code: count } }
   */
  _mergeNestedCounts(obj1, obj2) {
    const result = { ...obj1 };
    for (const [category, codes] of Object.entries(obj2 || {})) {
      if (!result[category]) {
        result[category] = {};
      }
      for (const [code, count] of Object.entries(codes)) {
        result[category][code] = (result[category][code] || 0) + count;
      }
    }
    return result;
  },

  /**
   * Fusionne les stats de domaine
   */
  _mergeDomainStats(stats1, stats2) {
    const result = { ...stats1 };
    for (const [domain, stats] of Object.entries(stats2 || {})) {
      if (!result[domain]) {
        result[domain] = { ...stats };
      } else {
        result[domain] = {
          sessionsCount: result[domain].sessionsCount + stats.sessionsCount,
          totalErrors: result[domain].totalErrors + stats.totalErrors,
          totalWarnings: result[domain].totalWarnings + stats.totalWarnings,
          totalScore: result[domain].totalScore + stats.totalScore,
          avgScore: Math.round((result[domain].totalScore + stats.totalScore) /
                              (result[domain].sessionsCount + stats.sessionsCount)),
          importedCount: result[domain].importedCount + stats.importedCount
        };
      }
    }
    return result;
  },

  /**
   * Fusionne les tendances de qualité
   */
  _mergeQualityTrends(trends1, trends2) {
    const result = { ...trends1 };
    for (const [domain, data] of Object.entries(trends2 || {})) {
      if (!result[domain]) {
        result[domain] = data;
      } else {
        result[domain] = [...result[domain], ...data];
      }
    }
    return result;
  },

  /**
   * Réinitialise les données d'un domaine spécifique
   *
   * @param {string} domain - Domaine à réinitialiser
   * @returns {Object} - Résultat de l'opération
   */
  resetDomain(domain) {
    const data = this._loadData();

    // Compter les sessions avant suppression
    const sessionsBefore = data.sessions.length;
    const sessionsOfDomain = data.sessions.filter(s => s.config?.domain === domain);
    const sessionsToDelete = sessionsOfDomain.length;

    if (sessionsToDelete === 0) {
      return {
        success: false,
        message: `Aucune session trouvée pour le domaine "${domain}"`
      };
    }

    // Supprimer les sessions du domaine
    data.sessions = data.sessions.filter(s => s.config?.domain !== domain);

    // Supprimer les stats du domaine
    delete data.domainStats[domain];
    delete data.qualityTrends[domain];

    // Recalculer les patterns d'erreurs (en excluant le domaine supprimé)
    data.errorPatterns = {};
    data.errorsByCategory = {};

    for (const session of data.sessions) {
      for (const iteration of session.iterations || []) {
        for (const code of iteration.errorCodes || []) {
          data.errorPatterns[code] = (data.errorPatterns[code] || 0) + 1;

          const category = this._getErrorCategory(code);
          if (!data.errorsByCategory[category]) {
            data.errorsByCategory[category] = {};
          }
          data.errorsByCategory[category][code] = (data.errorsByCategory[category][code] || 0) + 1;
        }
      }
    }

    data.lastUpdated = new Date().toISOString();
    this._saveData(data);

    return {
      success: true,
      domain,
      sessionsDeleted: sessionsToDelete,
      sessionsRemaining: data.sessions.length,
      message: `Domaine "${domain}" réinitialisé (${sessionsToDelete} sessions supprimées)`
    };
  },

  // ═══════════════════════════════════════════════════════════════
  // MÉTRIQUES ET STATISTIQUES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Récupère les statistiques globales
   *
   * @returns {Object} - Statistiques
   */
  getStats() {
    const data = this._loadData();

    const totalSessions = data.sessions.length;
    const importedSessions = data.sessions.filter(s => s.status === 'imported').length;
    const avgIterations = totalSessions > 0
      ? Math.round(data.sessions.reduce((sum, s) => sum + s.iterations.length, 0) / totalSessions * 10) / 10
      : 0;

    const avgFinalScore = totalSessions > 0
      ? Math.round(data.sessions.reduce((sum, s) => sum + (s.finalScore || 0), 0) / totalSessions)
      : 0;

    // Calculer le taux d'amélioration (première vs dernière itération)
    let improvementRate = 0;
    let sessionsWithMultipleIterations = 0;
    for (const session of data.sessions) {
      if (session.iterations.length >= 2) {
        sessionsWithMultipleIterations++;
        const firstScore = session.iterations[0].score;
        const lastScore = session.iterations[session.iterations.length - 1].score;
        improvementRate += (lastScore - firstScore);
      }
    }
    if (sessionsWithMultipleIterations > 0) {
      improvementRate = Math.round(improvementRate / sessionsWithMultipleIterations);
    }

    return {
      totalSessions,
      importedSessions,
      importRate: totalSessions > 0 ? Math.round((importedSessions / totalSessions) * 100) : 0,
      avgIterations,
      avgFinalScore,
      improvementRate,
      topErrors: this.getTopErrors(5),
      domainStats: data.domainStats
    };
  },

  /**
   * Récupère l'historique de la session en cours
   *
   * @returns {Object|null} - Session en cours
   */
  getCurrentSession() {
    return this._currentSession || null;
  },

  /**
   * Calcule l'amélioration entre deux itérations
   *
   * @param {Object} previous - Itération précédente
   * @param {Object} current - Itération actuelle
   * @returns {Object} - Différences
   */
  compareIterations(previous, current) {
    if (!previous || !current) return null;

    return {
      scoreDelta: current.score - previous.score,
      scoreImproved: current.score > previous.score,
      errorsDelta: (current.stats?.cardsWithErrors || 0) - (previous.stats?.cardsWithErrors || 0),
      errorsReduced: (current.stats?.cardsWithErrors || 0) < (previous.stats?.cardsWithErrors || 0),
      warningsDelta: (current.stats?.cardsWithWarnings || 0) - (previous.stats?.cardsWithWarnings || 0),
      summary: current.score > previous.score
        ? `+${current.score - previous.score} points (${previous.score}% → ${current.score}%)`
        : current.score < previous.score
          ? `${current.score - previous.score} points (régression)`
          : 'Pas de changement'
    };
  },

  // ═══════════════════════════════════════════════════════════════
  // PERSISTANCE
  // ═══════════════════════════════════════════════════════════════

  _loadData() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);

        // Migration de version si nécessaire
        if (!data.version || data.version < this.VERSION) {
          return this._migrateData(data);
        }

        return data;
      }
    } catch (e) {
      console.warn('PromptLearner: Erreur lecture localStorage', e);
    }
    return { ...this._defaultData };
  },

  /**
   * Migre les données d'une ancienne version
   */
  _migrateData(oldData) {
    const version = oldData.version || 1;

    // Migration v1 → v2
    if (version < 2) {
      return {
        ...this._defaultData,
        ...oldData,
        version: 2,
        errorsByCategory: this._buildErrorsByCategory(oldData.errorPatterns || {}),
        qualityTrends: {},
        lastUpdated: new Date().toISOString()
      };
    }

    return oldData;
  },

  /**
   * Construit errorsByCategory depuis errorPatterns
   */
  _buildErrorsByCategory(errorPatterns) {
    const errorsByCategory = {};

    for (const [code, count] of Object.entries(errorPatterns)) {
      const category = this._getErrorCategory(code);
      if (!errorsByCategory[category]) {
        errorsByCategory[category] = {};
      }
      errorsByCategory[category][code] = count;
    }

    return errorsByCategory;
  },

  _saveData(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('PromptLearner: Erreur écriture localStorage', e);
    }
  },

  /**
   * Réinitialise toutes les données d'apprentissage
   */
  reset() {
    localStorage.removeItem(this.STORAGE_KEY);
    this._currentSession = null;
  }
};

// Export pour tests Node.js
if (typeof module !== 'undefined') {
  module.exports = PromptLearner;
}
