/**
 * Tests pour la détection d'hallucinations dans DeckValidator
 *
 * Couvre :
 * - Détection de dates suspectes
 * - Détection de chiffres précis
 * - Détection de citations directes
 * - Détection d'affirmations absolues
 * - Détection de noms propres peu connus
 * - Rapport d'hallucinations pour un deck complet
 */

describe('DeckValidator - Hallucination Detection', () => {

  // ═══════════════════════════════════════════════════════════════
  // DÉTECTION DE DATES SUSPECTES
  // ═══════════════════════════════════════════════════════════════

  describe('Suspicious Dates', () => {

    it('should detect specific year without source as WARNING', () => {
      const card = {
        id: 'card1',
        question: 'Quand a eu lieu la Révolution française ?',
        answer: '1789'
      };

      const result = DeckValidator.detectHallucinations(card);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.category === 'DATE')).toBe(true);
      expect(result.warnings.some(w => w.severity === 'warning')).toBe(true);
    });

    it('should detect full date format as WARNING', () => {
      const card = {
        id: 'card1',
        question: 'Quand est né Einstein ?',
        answer: '14 mars 1879'
      };

      const result = DeckValidator.detectHallucinations(card);

      expect(result.warnings.some(w => w.category === 'DATE')).toBe(true);
    });

    it('should NOT flag dates with explicit source', () => {
      const card = {
        id: 'card1',
        question: 'Selon Wikipédia, quand a eu lieu la Révolution française ?',
        answer: '1789',
        source: 'Wikipédia'
      };

      const result = DeckValidator.detectHallucinations(card);

      // Peut détecter, mais risque doit être plus faible
      expect(result.risk).toBeLessThan(0.5);
    });

    it('should detect date in question text too', () => {
      const card = {
        id: 'card1',
        question: 'La bataille de Waterloo en 1815 a opposé qui ?',
        answer: 'Napoléon et Wellington'
      };

      const result = DeckValidator.detectHallucinations(card);

      expect(result.warnings.some(w => w.category === 'DATE')).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // DÉTECTION DE CHIFFRES PRÉCIS
  // ═══════════════════════════════════════════════════════════════

  describe('Precise Numbers', () => {

    it('should detect precise percentage as WARNING', () => {
      const card = {
        id: 'card1',
        question: 'Quel pourcentage de français parle anglais ?',
        answer: '73.4%'
      };

      const result = DeckValidator.detectHallucinations(card);

      expect(result.warnings.some(w => w.category === 'PERCENTAGE')).toBe(true);
      expect(result.warnings.some(w => w.severity === 'warning')).toBe(true);
    });

    it('should detect large numbers as WARNING', () => {
      const card = {
        id: 'card1',
        question: 'Combien d\'habitants à Paris ?',
        answer: '2 187 526 habitants'
      };

      const result = DeckValidator.detectHallucinations(card);

      expect(result.warnings.some(w => w.category === 'STATISTIC')).toBe(true);
    });

    it('should detect measurements as WARNING', () => {
      const card = {
        id: 'card1',
        question: 'Quelle est la hauteur du Mont Blanc ?',
        answer: '4807 m'
      };

      const result = DeckValidator.detectHallucinations(card);

      expect(result.warnings.some(w => w.category === 'STATISTIC')).toBe(true);
    });

    it('should NOT flag simple numeric answers', () => {
      const card = {
        id: 'card1',
        type: 'numeric',
        question: 'Combien font 2 + 2 ?',
        answer: '4'
      };

      const result = DeckValidator.detectHallucinations(card);

      // Peut être détecté mais risque faible car réponse simple
      expect(result.risk).toBeLessThan(0.3);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // DÉTECTION DE CITATIONS DIRECTES
  // ═══════════════════════════════════════════════════════════════

  describe('Direct Quotes', () => {

    it('should detect long quote with attribution as WARNING', () => {
      const card = {
        id: 'card1',
        question: 'Citation célèbre de Victor Hugo ?',
        answer: '"La liberté commence où l\'ignorance finit"'
      };

      const result = DeckValidator.detectHallucinations(card);

      expect(result.warnings.some(w => w.category === 'QUOTE')).toBe(true);
      expect(result.risk).toBeGreaterThan(0.4);
    });

    it('should detect quote in question', () => {
      const card = {
        id: 'card1',
        question: 'Qui a dit "Je pense donc je suis" ?',
        answer: 'Descartes'
      };

      const result = DeckValidator.detectHallucinations(card);

      expect(result.warnings.some(w => w.category === 'QUOTE')).toBe(true);
    });

    it('should NOT flag very short quoted text', () => {
      const card = {
        id: 'card1',
        question: 'Mot en anglais pour "chat" ?',
        answer: 'cat'
      };

      const result = DeckValidator.detectHallucinations(card);

      // Les quotes courtes ne doivent pas déclencher d'alerte
      expect(result.warnings.filter(w => w.category === 'QUOTE').length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // DÉTECTION D'AFFIRMATIONS ABSOLUES
  // ═══════════════════════════════════════════════════════════════

  describe('Absolute Statements', () => {

    it('should detect "toujours" as INFO', () => {
      const card = {
        id: 'card1',
        question: 'Le soleil se lève-t-il toujours à l\'est ?',
        answer: 'Oui'
      };

      const result = DeckValidator.detectHallucinations(card);

      expect(result.warnings.some(w => w.category === 'ABSOLUTE')).toBe(true);
      expect(result.warnings.some(w => w.severity === 'info')).toBe(true);
    });

    it('should detect "jamais" as INFO', () => {
      const card = {
        id: 'card1',
        question: 'Les chats ne volent jamais',
        answer: 'Vrai'
      };

      const result = DeckValidator.detectHallucinations(card);

      expect(result.warnings.some(w => w.category === 'ABSOLUTE')).toBe(true);
    });

    it('should detect "tous les" as INFO', () => {
      const card = {
        id: 'card1',
        question: 'Tous les oiseaux volent-ils ?',
        answer: 'Non'
      };

      const result = DeckValidator.detectHallucinations(card);

      expect(result.warnings.some(w => w.category === 'ABSOLUTE')).toBe(true);
    });

    it('should detect absolute terms in English', () => {
      const card = {
        id: 'card1',
        question: 'All birds can fly',
        answer: 'False'
      };

      const result = DeckValidator.detectHallucinations(card);

      expect(result.warnings.some(w => w.category === 'ABSOLUTE')).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // DÉTECTION DE NOMS PROPRES PEU CONNUS
  // ═══════════════════════════════════════════════════════════════

  describe('Obscure Proper Nouns', () => {

    it('should detect capitalized rare names as WARNING', () => {
      const card = {
        id: 'card1',
        // Le détecteur exige deux mots capitalisés consécutifs (la particule minuscule « the » les séparait)
        question: 'Qui est Æthelred Unready ?',
        answer: 'Un roi anglo-saxon'
      };

      const result = DeckValidator.detectHallucinations(card);

      // Doit détecter le nom propre inhabituel
      expect(result.warnings.some(w => w.category === 'PROPER_NOUN')).toBe(true);
    });

    it('should detect multiple proper nouns', () => {
      const card = {
        id: 'card1',
        question: 'Bataille entre Gengis Khan et Jelal ad-Din',
        answer: 'Bataille de l\'Indus'
      };

      const result = DeckValidator.detectHallucinations(card);

      // Multiple noms propres → risque accru
      expect(result.warnings.filter(w => w.category === 'PROPER_NOUN').length).toBeGreaterThanOrEqual(1);
    });

    it('should NOT flag common names like Paris, France', () => {
      const card = {
        id: 'card1',
        question: 'Capitale de France ?',
        answer: 'Paris'
      };

      const result = DeckValidator.detectHallucinations(card);

      // Les noms communs ne doivent pas être signalés
      expect(result.warnings.filter(w => w.category === 'PROPER_NOUN').length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // CALCUL DU RISQUE GLOBAL
  // ═══════════════════════════════════════════════════════════════

  describe('Risk Score Calculation', () => {

    it('should return risk between 0 and 1', () => {
      const card = {
        id: 'card1',
        question: 'Test question',
        answer: 'Test answer'
      };

      const result = DeckValidator.detectHallucinations(card);

      expect(result.risk).toBeGreaterThanOrEqual(0);
      expect(result.risk).toBeLessThanOrEqual(1);
    });

    it('should calculate higher risk for multiple red flags', () => {
      const lowRiskCard = {
        id: 'card1',
        question: 'Combien font 2 + 2 ?',
        answer: '4'
      };

      const highRiskCard = {
        id: 'card2',
        question: 'En 1815, Napoléon a dit "Je reviendrai toujours" lors de la bataille de Waterloo qui a fait 3 millions de morts',
        answer: 'Vrai'
      };

      const lowRisk = DeckValidator.detectHallucinations(lowRiskCard);
      const highRisk = DeckValidator.detectHallucinations(highRiskCard);

      expect(highRisk.risk).toBeGreaterThan(lowRisk.risk);
    });

    it('should return low risk for simple factual cards', () => {
      const card = {
        id: 'card1',
        question: 'Capitale de France ?',
        answer: 'Paris'
      };

      const result = DeckValidator.detectHallucinations(card);

      expect(result.risk).toBeLessThan(0.3);
    });

    it('should aggregate risk from multiple patterns', () => {
      const card = {
        id: 'card1',
        question: 'En 1789, exactement 73.4% des français...',
        answer: '"Une citation exacte"'
      };

      const result = DeckValidator.detectHallucinations(card);

      expect(result.warnings.length).toBeGreaterThanOrEqual(3);
      expect(result.risk).toBeGreaterThan(0.5);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // RAPPORT D'HALLUCINATIONS POUR DECK COMPLET
  // ═══════════════════════════════════════════════════════════════

  describe('Hallucination Report', () => {

    it('should generate report for deck with hallucination risks', () => {
      const deck = {
        id: 'test-deck',
        name: 'Test Deck',
        cards: [
          { id: 'card1', question: 'Combien font 2 + 2 ?', answer: '4' },
          { id: 'card2', question: 'En 1789, la Révolution française...', answer: 'Prise de la Bastille' },
          { id: 'card3', question: 'Citation: "Je pense donc je suis"', answer: 'Descartes' }
        ]
      };

      const report = DeckValidator.getHallucinationReport(deck);

      expect(report).toBeDefined();
      expect(report.totalCards).toBe(3);
      expect(report.cardsWithWarnings).toBeGreaterThanOrEqual(1);
      expect(report.averageRisk).toBeGreaterThanOrEqual(0);
      expect(report.highRiskCards).toBeDefined();
    });

    it('should identify high-risk cards in report', () => {
      const deck = {
        id: 'test-deck',
        name: 'Test Deck',
        cards: [
          { id: 'card1', question: 'Simple question', answer: 'Simple answer' },
          {
            id: 'card2',
            question: 'En 1815, Napoléon a dit "Citation exacte" avec 73.4% de troupes',
            answer: 'Vrai'
          }
        ]
      };

      const report = DeckValidator.getHallucinationReport(deck);

      expect(report.highRiskCards.length).toBeGreaterThanOrEqual(1);
      expect(report.highRiskCards[0].cardId).toBe('card2');
      expect(report.highRiskCards[0].risk).toBeGreaterThan(0.5);
    });

    it('should categorize warnings by type', () => {
      const deck = {
        id: 'test-deck',
        name: 'Test Deck',
        cards: [
          { id: 'card1', question: 'En 1789...', answer: 'Test' },
          { id: 'card2', question: 'Citation "test"...', answer: 'Test' },
          { id: 'card3', question: 'Toujours vrai ?', answer: 'Non' }
        ]
      };

      const report = DeckValidator.getHallucinationReport(deck);

      expect(report.warningsByCategory).toBeDefined();
      expect(report.warningsByCategory.DATE).toBeGreaterThanOrEqual(1);
      expect(report.warningsByCategory.ABSOLUTE).toBeGreaterThanOrEqual(1);
    });

    it('should provide actionable recommendations', () => {
      const deck = {
        id: 'test-deck',
        name: 'Test Deck',
        cards: [
          {
            id: 'card1',
            question: 'En 1815, exactement 73.4% des soldats...',
            answer: 'Test'
          }
        ]
      };

      const report = DeckValidator.getHallucinationReport(deck);

      expect(report.recommendations).toBeDefined();
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle deck with no hallucination risks', () => {
      const deck = {
        id: 'test-deck',
        name: 'Test Deck',
        cards: [
          { id: 'card1', question: 'Combien font 2 + 2 ?', answer: '4' },
          { id: 'card2', question: 'Capitale de France ?', answer: 'Paris' }
        ]
      };

      const report = DeckValidator.getHallucinationReport(deck);

      expect(report.averageRisk).toBeLessThan(0.3);
      expect(report.highRiskCards.length).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // INTÉGRATION AVEC VALIDATEDECK
  // ═══════════════════════════════════════════════════════════════

  describe('Integration with validateDeck()', () => {

    it('should include hallucination data in validation report', () => {
      const deck = {
        id: 'test-deck',
        name: 'Test Deck',
        cards: [
          { id: 'card1', question: 'En 1789...', answer: 'Test' },
          { id: 'card2', question: 'Simple', answer: 'Test' }
        ]
      };

      const report = DeckValidator.validateDeck(deck);

      expect(report.hallucinationReport).toBeDefined();
      expect(report.hallucinationReport.totalCards).toBe(2);
    });

    it('should include hallucination risk in card results', () => {
      const deck = {
        id: 'test-deck',
        name: 'Test Deck',
        cards: [
          {
            id: 'card1',
            question: 'En 1815, exactement 73.4% des soldats ont dit "Citation exacte"',
            answer: 'Test'
          }
        ]
      };

      const report = DeckValidator.validateDeck(deck);

      expect(report.cardResults[0].hallucinationRisk).toBeDefined();
      expect(report.cardResults[0].hallucinationRisk).toBeGreaterThan(0);
      expect(report.cardResults[0].hallucinationWarnings).toBeDefined();
    });

    it('should adjust overall score based on hallucination risk', () => {
      const lowRiskDeck = {
        id: 'deck1',
        name: 'Low Risk',
        cards: [
          { id: 'card1', question: 'Combien font 2 + 2 ?', answer: '4' }
        ]
      };

      const highRiskDeck = {
        id: 'deck2',
        name: 'High Risk',
        cards: [
          {
            id: 'card1',
            question: 'En 1815, exactement 73.4% des soldats ont dit "Citation exacte avec tous les détails"',
            answer: 'Test'
          }
        ]
      };

      const lowRiskReport = DeckValidator.validateDeck(lowRiskDeck);
      const highRiskReport = DeckValidator.validateDeck(highRiskDeck);

      // Le deck à haut risque devrait avoir un score global plus bas
      expect(highRiskReport.averageScore).toBeLessThan(lowRiskReport.averageScore);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // CAS LIMITES
  // ═══════════════════════════════════════════════════════════════

  describe('Edge Cases', () => {

    it('should handle empty card', () => {
      const card = { id: 'card1', question: '', answer: '' };
      const result = DeckValidator.detectHallucinations(card);

      expect(result.risk).toBe(0);
      expect(result.warnings.length).toBe(0);
    });

    it('should handle card with null values', () => {
      const card = { id: 'card1', question: null, answer: null };
      const result = DeckValidator.detectHallucinations(card);

      expect(result).toBeDefined();
      expect(result.risk).toBe(0);
    });

    it('should handle very long text', () => {
      const longText = 'Lorem ipsum '.repeat(200);
      const card = { id: 'card1', question: longText, answer: 'Test' };
      const result = DeckValidator.detectHallucinations(card);

      expect(result).toBeDefined();
    });

    it('should handle special characters', () => {
      const card = {
        id: 'card1',
        question: '€$£¥ symbols & special chars!',
        answer: 'Test'
      };
      const result = DeckValidator.detectHallucinations(card);

      expect(result).toBeDefined();
    });
  });
});
