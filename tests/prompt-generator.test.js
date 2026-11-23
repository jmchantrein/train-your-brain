/**
 * Tests pour le module PromptGenerator
 */

describe('PromptGenerator', () => {

  // ═══════════════════════════════════════════════════════════════
  // DOMAIN_TEMPLATES
  // ═══════════════════════════════════════════════════════════════

  describe('DOMAIN_TEMPLATES', () => {

    it('devrait avoir des templates pour les domaines principaux', () => {
      expect(PromptGenerator.DOMAIN_TEMPLATES).toBeDefined();
      expect(PromptGenerator.DOMAIN_TEMPLATES.maths).toBeDefined();
      expect(PromptGenerator.DOMAIN_TEMPLATES.histoire).toBeDefined();
      expect(PromptGenerator.DOMAIN_TEMPLATES.sciences).toBeDefined();
      expect(PromptGenerator.DOMAIN_TEMPLATES.langues).toBeDefined();
    });

    it('chaque template devrait avoir les champs requis', () => {
      for (const [key, template] of Object.entries(PromptGenerator.DOMAIN_TEMPLATES)) {
        expect(template.name).toBeDefined();
        expect(template.questionPatterns).toBeDefined();
        expect(Array.isArray(template.questionPatterns)).toBe(true);
        expect(template.hallucinationRisk).toBeDefined();
      }
    });

    it('maths devrait avoir useLatex à true', () => {
      expect(PromptGenerator.DOMAIN_TEMPLATES.maths.useLatex).toBe(true);
    });

    it('sciences devrait avoir useLatex à true', () => {
      expect(PromptGenerator.DOMAIN_TEMPLATES.sciences.useLatex).toBe(true);
    });

  });

  // ═══════════════════════════════════════════════════════════════
  // generatePrompt()
  // (anciennement generate({domain, topic, count, cardTypes, source}) : l'API
  // actuelle prend les données du formulaire, voir FORM_FIELDS / getDefaultFormData)
  // ═══════════════════════════════════════════════════════════════

  // Données de formulaire valides + surcharges
  const makeForm = (overrides = {}) => ({
    ...PromptGenerator.getDefaultFormData(),
    topic: 'Additions',
    learningObjectives: 'Savoir additionner',
    ...overrides
  });

  describe('generatePrompt()', () => {

    it('devrait générer un prompt non vide', () => {
      const prompt = PromptGenerator.generatePrompt(makeForm({ cardCount: 10, questionTypes: ['numeric'] }));

      expect(prompt).toBeDefined();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(100);
    });

    it('devrait inclure le sujet dans le prompt', () => {
      const prompt = PromptGenerator.generatePrompt(makeForm({ topic: 'Fractions', cardCount: 5 }));

      expect(prompt).toContain('Fractions');
    });

    it('devrait inclure le nombre de cartes demandées', () => {
      const prompt = PromptGenerator.generatePrompt(makeForm({ topic: 'Révolution française', cardCount: 15 }));

      expect(prompt).toContain('15');
    });

    it('devrait inclure les types de cartes demandés', () => {
      const prompt = PromptGenerator.generatePrompt(makeForm({
        topic: 'Chimie',
        cardCount: 10,
        questionTypes: ['mcq', 'boolean']
      }));

      // Le prompt liste les types par leur libellé (FORM_FIELDS), pas par leur id
      expect(prompt).toContain('QCM (choix multiples)');
      expect(prompt).toContain('Vrai/Faux');
    });

    it('devrait inclure le format YAML dans le prompt', () => {
      const prompt = PromptGenerator.generatePrompt(makeForm({ topic: 'Vocabulaire anglais', outputFormat: 'yaml' }));

      expect(prompt).toContain('YAML');
    });

    it('devrait mentionner les champs obligatoires', () => {
      const prompt = PromptGenerator.generatePrompt(makeForm({ topic: 'Géométrie', cardCount: 5 }));

      expect(prompt).toContain('question');
      expect(prompt).toContain('answer');
    });

  });

  // ═══════════════════════════════════════════════════════════════
  // Génération avec document source
  // ═══════════════════════════════════════════════════════════════

  describe('generatePrompt() avec source', () => {

    it('devrait inclure le texte source dans le prompt', () => {
      const sourceText = 'La photosynthèse est un processus biologique.';
      const prompt = PromptGenerator.generatePrompt(makeForm({
        topic: 'Biologie',
        cardCount: 5,
        sourceDocument: sourceText
      }));

      expect(prompt).toContain(sourceText);
    });

    it('devrait ajouter des instructions anti-hallucination avec source', () => {
      const prompt = PromptGenerator.generatePrompt(makeForm({
        topic: 'Moyen Âge',
        cardCount: 5,
        sourceDocument: 'Charlemagne fut couronné empereur en 800.'
      }));

      expect(prompt).toContain('ANTI-HALLUCINATION');
      expect(prompt).toContain('Aucune invention');
    });

  });

  // ═══════════════════════════════════════════════════════════════
  // Format de sortie
  // ═══════════════════════════════════════════════════════════════

  describe('format de sortie', () => {

    it('devrait inclure un exemple de carte dans le prompt', () => {
      const prompt = PromptGenerator.generatePrompt(makeForm({ cardCount: 10 }));

      // Devrait contenir un exemple YAML
      expect(prompt).toContain('id:');
    });

    it('devrait mentionner les types de cartes supportés', () => {
      const types = ['text', 'numeric', 'mcq', 'boolean', 'cloze', 'matching'];
      const prompt = PromptGenerator.generatePrompt(makeForm({
        topic: 'Physique',
        cardCount: 10,
        questionTypes: types
      }));

      PromptGenerator.FORM_FIELDS.questionTypes.options.forEach(o => {
        expect(prompt).toContain(o.label);
      });
    });

  });

  // ═══════════════════════════════════════════════════════════════
  // FORM_FIELDS (remplace getDomains() / getCardTypes(), supprimées)
  // ═══════════════════════════════════════════════════════════════

  describe('FORM_FIELDS.questionTypes', () => {

    it('devrait proposer les 6 types de cartes', () => {
      const options = PromptGenerator.FORM_FIELDS.questionTypes.options;

      expect(Array.isArray(options)).toBe(true);
      expect(options.length).toBe(6);
    });

    it('devrait inclure tous les types standards', () => {
      const typeIds = PromptGenerator.FORM_FIELDS.questionTypes.options.map(t => t.value);

      ['text', 'numeric', 'mcq', 'boolean', 'cloze', 'matching'].forEach(t => {
        expect(typeIds).toContain(t);
      });
    });

  });

});
