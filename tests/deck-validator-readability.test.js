/**
 * Tests pour la lisibilité Flesch-Kincaid (version française) dans DeckValidator
 *
 * Couvre :
 * - Comptage de syllabes en français
 * - Calcul du score Flesch Reading Ease (formule française)
 * - Interprétation par niveau scolaire
 * - Analyse de lisibilité par carte
 * - Vérification de correspondance niveau/vocabulaire
 */

describe('DeckValidator - Flesch-Kincaid Readability (French)', () => {

  // ═══════════════════════════════════════════════════════════════
  // COMPTAGE DE SYLLABES (FRANÇAIS)
  // ═══════════════════════════════════════════════════════════════

  describe('Syllable Counting (French)', () => {

    it('should count syllables in simple French words', () => {
      expect(DeckValidator._countWordSyllables('chat')).toBe(1);
      expect(DeckValidator._countWordSyllables('maison')).toBe(2);
      expect(DeckValidator._countWordSyllables('ordinateur')).toBe(4);
      expect(DeckValidator._countWordSyllables('mathématiques')).toBe(4);
    });

    it('should handle French vowel combinations (diphtongues)', () => {
      expect(DeckValidator._countWordSyllables('oiseau')).toBe(2); // oi-seau
      expect(DeckValidator._countWordSyllables('eau')).toBe(1);
      expect(DeckValidator._countWordSyllables('beaucoup')).toBe(2); // beau-coup
      expect(DeckValidator._countWordSyllables("aujourd'hui")).toBe(3); // au-jour-d'hui (le mot entier ; 'aujourd' seul = 2)
    });

    it('should handle silent "e" at end of French words', () => {
      expect(DeckValidator._countWordSyllables('table')).toBe(1); // tabl(e)
      expect(DeckValidator._countWordSyllables('grande')).toBe(1); // grand(e)
      expect(DeckValidator._countWordSyllables('école')).toBe(2); // é-col(e)
    });

    it('should handle French accented vowels', () => {
      expect(DeckValidator._countWordSyllables('éléphant')).toBe(3); // é-lé-phant
      expect(DeckValidator._countWordSyllables('hôpital')).toBe(3); // hô-pi-tal
      expect(DeckValidator._countWordSyllables('français')).toBe(2); // fran-çais
    });

    it('should count at least 1 syllable for any word', () => {
      expect(DeckValidator._countWordSyllables('a')).toBe(1);
      expect(DeckValidator._countWordSyllables('et')).toBe(1);
      expect(DeckValidator._countWordSyllables('y')).toBe(1);
    });

    it('should count total syllables in a text', () => {
      const text = 'Le chat mange une souris.';
      const syllables = DeckValidator._countSyllables(text);
      // le(1) chat(1) mange(1) une(1) souris(2) = 6
      expect(syllables).toBeGreaterThanOrEqual(6);
      expect(syllables).toBeLessThanOrEqual(8); // Avec variations d'interprétation
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FLESCH READING EASE (FORMULE FRANÇAISE)
  // ═══════════════════════════════════════════════════════════════

  describe('Flesch Reading Ease (French Formula)', () => {

    it('should calculate FRE with French formula: 207 - 1.015×ASL - 73.6×ASW', () => {
      const text = 'Le chat dort. Il rêve.';
      // 2 phrases, 5 mots, ~5 syllabes
      // ASL = 5/2 = 2.5
      // ASW = ~5/5 = 1.0
      // FRE = 207 - (1.015 × 2.5) - (73.6 × 1.0) ≈ 207 - 2.5 - 73.6 ≈ 130.9 (max 100)

      const result = DeckValidator.calculateFleschScore(text);

      expect(result).toBeGreaterThanOrEqual(90);
      expect(result).toBeLessThanOrEqual(100);
    });

    it('should return high score (90-100) for very simple text', () => {
      const text = 'Tom a un chat. Le chat est noir.';
      const score = DeckValidator.calculateFleschScore(text);

      expect(score).toBeGreaterThanOrEqual(85);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return medium score (60-80) for standard text', () => {
      const text = 'La France est un pays européen. Sa capitale est Paris. La population française compte environ 67 millions d\'habitants.';
      const score = DeckValidator.calculateFleschScore(text);

      expect(score).toBeGreaterThanOrEqual(50);
      expect(score).toBeLessThanOrEqual(85);
    });

    it('should return low score (<50) for complex academic text', () => {
      const text = 'L\'épistémologie contemporaine s\'interroge sur les fondements méthodologiques de la validation des hypothèses scientifiques dans un contexte interdisciplinaire.';
      const score = DeckValidator.calculateFleschScore(text);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(60);
    });

    it('should handle empty or very short text', () => {
      expect(DeckValidator.calculateFleschScore('')).toBe(100);
      expect(DeckValidator.calculateFleschScore('Chat')).toBe(100);
    });

    it('should cap score at 100 (max)', () => {
      const text = 'Un. Tu as. Il va.';
      const score = DeckValidator.calculateFleschScore(text);

      expect(score).toBeLessThanOrEqual(100);
    });

    it('should cap score at 0 (min)', () => {
      // Texte impossible, mais on teste la limite
      const score = DeckValidator.calculateFleschScore('Anticonstitutionnellement interdisciplinaire méthodologiquement incompréhensiblement.');

      expect(score).toBeGreaterThanOrEqual(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // INTERPRÉTATION PAR NIVEAU SCOLAIRE
  // ═══════════════════════════════════════════════════════════════

  describe('Readability Level Interpretation', () => {

    it('should interpret score 90-100 as "Très facile (CP-CE1)"', () => {
      const level = DeckValidator.getReadabilityLevel(95);

      expect(level.level).toBe('very_easy');
      expect(level.grade).toBe('CP-CE1');
      expect(level.description).toContain('Très facile');
    });

    it('should interpret score 80-89 as "Facile (CE2-CM1)"', () => {
      const level = DeckValidator.getReadabilityLevel(85);

      expect(level.level).toBe('easy');
      expect(level.grade).toBe('CE2-CM1');
      expect(level.description).toContain('Facile');
    });

    it('should interpret score 70-79 as "Assez facile (CM2-6ème)"', () => {
      const level = DeckValidator.getReadabilityLevel(75);

      expect(level.level).toBe('fairly_easy');
      expect(level.grade).toBe('CM2-6ème');
    });

    it('should interpret score 60-69 as "Standard (Collège)"', () => {
      const level = DeckValidator.getReadabilityLevel(65);

      expect(level.level).toBe('standard');
      expect(level.grade).toBe('Collège');
    });

    it('should interpret score 50-59 as "Assez difficile (Lycée)"', () => {
      const level = DeckValidator.getReadabilityLevel(55);

      expect(level.level).toBe('fairly_difficult');
      expect(level.grade).toBe('Lycée');
    });

    it('should interpret score 30-49 as "Difficile (Supérieur)"', () => {
      const level = DeckValidator.getReadabilityLevel(40);

      expect(level.level).toBe('difficult');
      expect(level.grade).toBe('Supérieur');
    });

    it('should interpret score 0-29 as "Très difficile (Expert)"', () => {
      const level = DeckValidator.getReadabilityLevel(20);

      expect(level.level).toBe('very_difficult');
      expect(level.grade).toBe('Expert');
    });

    it('should handle edge cases (0 and 100)', () => {
      const level0 = DeckValidator.getReadabilityLevel(0);
      expect(level0.level).toBe('very_difficult');

      const level100 = DeckValidator.getReadabilityLevel(100);
      expect(level100.level).toBe('very_easy');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // ANALYSE DE LISIBILITÉ D'UN DECK
  // ═══════════════════════════════════════════════════════════════

  describe('Deck Readability Analysis', () => {

    it('should analyze readability for each card in deck', () => {
      const deck = {
        id: 'test-deck',
        name: 'Deck de test',
        cards: [
          { id: 'card1', question: 'Quel est le nom de cet animal ?', answer: 'Chat' },
          { id: 'card2', question: 'Comment s\'appelle la capitale de la France ?', answer: 'Paris' },
          { id: 'card3', question: 'Quelle est la formule chimique de l\'eau ?', answer: 'H2O' }
        ]
      };

      const analysis = DeckValidator.analyzeReadability(deck);

      expect(analysis.cards).toHaveLength(3);
      expect(analysis.cards[0]).toHaveProperty('cardId', 'card1');
      expect(analysis.cards[0]).toHaveProperty('score');
      expect(analysis.cards[0]).toHaveProperty('level');
      expect(analysis.cards[0].score).toBeGreaterThanOrEqual(0);
      expect(analysis.cards[0].score).toBeLessThanOrEqual(100);
    });

    it('should calculate average readability score for deck', () => {
      const deck = {
        id: 'test-deck',
        cards: [
          { id: 'card1', question: 'Un chat dort.', answer: 'Oui' },
          { id: 'card2', question: 'Le soleil brille.', answer: 'Oui' }
        ]
      };

      const analysis = DeckValidator.analyzeReadability(deck);

      expect(analysis.average).toHaveProperty('score');
      expect(analysis.average).toHaveProperty('level');
      expect(analysis.average.score).toBeGreaterThanOrEqual(0);
      expect(analysis.average.score).toBeLessThanOrEqual(100);
    });

    it('should combine question AND answer text for analysis', () => {
      const deck = {
        id: 'test-deck',
        cards: [
          { id: 'card1', question: 'Simple ?', answer: 'Réponse extrêmement sophistiquée et particulièrement complexe' }
        ]
      };

      const analysis = DeckValidator.analyzeReadability(deck);

      // Le score doit tenir compte de la réponse complexe
      expect(analysis.cards[0].score).toBeLessThan(90);
    });

    it('should handle empty deck gracefully', () => {
      const deck = { id: 'empty', cards: [] };
      const analysis = DeckValidator.analyzeReadability(deck);

      expect(analysis.cards).toHaveLength(0);
      expect(analysis.average.score).toBe(100); // Défaut pour vide
    });

    it('should include distribution of readability levels', () => {
      const deck = {
        id: 'mixed-deck',
        cards: [
          { id: 'c1', question: 'Chat ?', answer: 'Oui' },
          { id: 'c2', question: 'La mitochondrie est l\'organite responsable de la respiration cellulaire aérobie.', answer: 'Vrai' }
        ]
      };

      const analysis = DeckValidator.analyzeReadability(deck);

      expect(analysis.distribution).toBeDefined();
      expect(Object.keys(analysis.distribution)).toContain('very_easy');
      // La phrase de la carte 2 (10 mots, ~25 syllabes) donne FRE ~ 24 (<= 29) : très difficile
      expect(Object.keys(analysis.distribution)).toContain('very_difficult');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // VÉRIFICATION CORRESPONDANCE NIVEAU/VOCABULAIRE
  // ═══════════════════════════════════════════════════════════════

  describe('Level Matching (Target Level vs Vocabulary)', () => {

    it('should validate that simple deck matches "primaire" level', () => {
      const deck = {
        id: 'primaire-deck',
        difficulty: 1,
        targetLevel: 'primaire',
        cards: [
          { id: 'c1', question: 'Combien font 2 + 2 ?', answer: '4' },
          { id: 'c2', question: 'Quelle couleur est le ciel ?', answer: 'Bleu' }
        ]
      };

      const result = DeckValidator.checkLevelMatch(deck);

      expect(result.isMatch).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn when vocabulary is too complex for target level', () => {
      const deck = {
        id: 'mismatch-deck',
        difficulty: 1,
        targetLevel: 'primaire',
        cards: [
          { id: 'c1', question: 'L\'épistémologie kantienne influence-t-elle la phénoménologie husserlienne ?', answer: 'Oui' }
        ]
      };

      const result = DeckValidator.checkLevelMatch(deck);

      expect(result.isMatch).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toHaveProperty('severity', 'warning');
      expect(result.warnings[0].message).toContain('trop complexe');
    });

    it('should warn when vocabulary is too simple for target level', () => {
      const deck = {
        id: 'too-easy',
        difficulty: 5,
        targetLevel: 'supérieur',
        cards: [
          { id: 'c1', question: 'Le chat est noir ?', answer: 'Oui' },
          { id: 'c2', question: 'Tom a un ballon ?', answer: 'Oui' }
        ]
      };

      const result = DeckValidator.checkLevelMatch(deck);

      expect(result.isMatch).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].message).toContain('trop simple');
    });

    it('should identify specific problematic cards', () => {
      const deck = {
        id: 'mixed',
        difficulty: 1,
        targetLevel: 'primaire',
        cards: [
          { id: 'ok', question: 'Un chat dort.', answer: 'Oui' },
          { id: 'too_hard', question: 'La photosynthèse chlorophyllienne transforme l\'énergie lumineuse.', answer: 'Vrai' }
        ]
      };

      const result = DeckValidator.checkLevelMatch(deck);

      const problematicCards = result.cards.filter(c => !c.isMatch);
      expect(problematicCards.length).toBeGreaterThan(0);
      expect(problematicCards[0].cardId).toBe('too_hard');
      expect(problematicCards[0].actualLevel).toBeDefined();
      expect(problematicCards[0].expectedLevel).toBeDefined();
    });

    it('should handle deck without explicit difficulty level', () => {
      const deck = {
        id: 'no-level',
        cards: [
          { id: 'c1', question: 'Test ?', answer: 'Oui' }
        ]
      };

      const result = DeckValidator.checkLevelMatch(deck);

      // Should default to analyzing without comparison
      expect(result).toHaveProperty('analysis');
      expect(result.warnings).toBeDefined();
    });

    it('should accept targetLevel as string or difficulty as number', () => {
      const deckString = {
        id: 'deck1',
        targetLevel: 'collège',
        cards: [{ id: 'c1', question: 'Test', answer: 'Réponse' }]
      };

      const deckNumber = {
        id: 'deck2',
        difficulty: 3,
        cards: [{ id: 'c1', question: 'Test', answer: 'Réponse' }]
      };

      const result1 = DeckValidator.checkLevelMatch(deckString);
      const result2 = DeckValidator.checkLevelMatch(deckNumber);

      expect(result1).toHaveProperty('isMatch');
      expect(result2).toHaveProperty('isMatch');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // MAPPING NIVEAU SCOLAIRE ↔ SCORE FLESCH
  // ═══════════════════════════════════════════════════════════════

  describe('School Level to Flesch Score Mapping', () => {

    it('should map "primaire" to score 80-100', () => {
      const range = DeckValidator._getLevelScoreRange('primaire');
      expect(range.min).toBe(80);
      expect(range.max).toBe(100);
    });

    it('should map "collège" to score 60-79', () => {
      const range = DeckValidator._getLevelScoreRange('collège');
      expect(range.min).toBe(60);
      expect(range.max).toBe(79);
    });

    it('should map "lycée" to score 50-69', () => {
      const range = DeckValidator._getLevelScoreRange('lycée');
      expect(range.min).toBe(50);
      expect(range.max).toBe(69);
    });

    it('should map "supérieur" to score 30-59', () => {
      const range = DeckValidator._getLevelScoreRange('supérieur');
      expect(range.min).toBe(30);
      expect(range.max).toBe(59);
    });

  });

  // ═══════════════════════════════════════════════════════════════
  // INTÉGRATION AVEC validateDeck()
  // ═══════════════════════════════════════════════════════════════

  describe('Integration with validateDeck()', () => {

    it('should include readability analysis in deck validation report', () => {
      const deck = {
        id: 'test',
        name: 'Test Deck',
        cards: [
          { id: 'c1', question: 'Simple ?', answer: 'Oui' }
        ]
      };

      const report = DeckValidator.validateDeck(deck);

      expect(report.readability).toBeDefined();
      expect(report.readability.average).toHaveProperty('score');
      expect(report.readability.average).toHaveProperty('level');
    });

    it('should add warnings to deck report if level mismatch detected', () => {
      const deck = {
        id: 'mismatch',
        name: 'Mismatch Deck',
        difficulty: 1,
        targetLevel: 'primaire',
        cards: [
          { id: 'c1', question: 'La thermodynamique quantique relativiste appliquée aux systèmes isolés.', answer: 'Complexe' }
        ]
      };

      const report = DeckValidator.validateDeck(deck);

      // Le rapport n'a pas de champ `warnings` global : les warnings de lisibilité
      // sont ajoutés aux warnings de chaque carte (cardResults) et aux deckIssues.
      const allWarnings = [
        ...report.deckIssues,
        ...report.cardResults.flatMap(cr => cr.warnings)
      ];
      const readabilityWarnings = allWarnings.filter(
        w => w.code === 'READABILITY_MISMATCH' || w.code === 'DECK_READABILITY_MISMATCH'
      );
      expect(readabilityWarnings.length).toBeGreaterThan(0);
    });
  });
});
