/**
 * Module PromptGenerator - Génération de prompts LLM pour créer des decks
 *
 * Ce module génère des prompts optimisés pour que des LLM créent
 * des flashcards pédagogiquement efficaces avec auto-vérification.
 *
 * Améliorations v2:
 * - Exemples concrets BONS vs MAUVAIS
 * - Règles strictes de format de réponse
 * - Contraintes anti-hallucination
 * - Templates par domaine
 * - Instructions de génération SVG
 * - Mode "source fournie" anti-hallucination
 */

const PromptGenerator = {
  // ═══════════════════════════════════════════════════════════════
  // TEMPLATES PAR DOMAINE (Anti-hallucination + Qualité pédagogique)
  // ═══════════════════════════════════════════════════════════════

  DOMAIN_TEMPLATES: {
    'maths': {
      name: 'Mathématiques',
      questionPatterns: [
        'Calculer : {expression}',
        'Simplifier : {expression}',
        'Résoudre : {equation}',
        'Quelle est la formule de {concept} ?',
        'Convertir {valeur} en {unité}',
        'Quel est le résultat de {opération} ?'
      ],
      avoidPatterns: [
        'Qui a inventé/découvert {concept} ?',  // Risque hallucination dates/noms
        'En quelle année {événement} ?',        // Risque hallucination
        'Citez une application de {concept}'    // Trop vague
      ],
      // RÈGLE CRITIQUE: réponses simples uniquement
      complexAnswerRule: 'Si la réponse est une expression complexe (a^n, fractions, formules), utiliser type: mcq avec choix',
      svgOpportunities: [
        'Figures géométriques (triangles, cercles, polygones)',
        'Graphiques de fonctions (axes, courbes)',
        'Diagrammes d\'ensembles (Venn)',
        'Représentations de fractions',
        'Schémas de proportions'
      ],
      responseFormat: 'UNIQUEMENT nombres simples (42, 3.14) ou mots courts. JAMAIS d\'expressions comme a^n, x^2+1, fractions. Pour formules/expressions → utiliser QCM.',
      hallucinationRisk: 'low',
      useLatex: true  // Utiliser LaTeX pour les notations mathématiques
    },
    'histoire': {
      name: 'Histoire',
      questionPatterns: [
        'Quelle est la cause principale de {événement} ?',
        'Quelles sont les conséquences de {événement} ?',
        'Quel régime politique caractérise {période} ?',
        'Quel traité met fin à {conflit} ?'
      ],
      avoidPatterns: [
        'Citez une phrase de {personnage}',     // Risque invention citation
        'Combien exactement de {victimes/participants} ?', // Chiffres contestés
        'Quelle est la date exacte de {événement mineur} ?' // Risque erreur
      ],
      requiredFields: ['source'],  // Dates/faits = source obligatoire
      svgOpportunities: [
        'Frises chronologiques simples',
        'Cartes géographiques schématiques'
      ],
      responseFormat: 'Noms, dates (avec source), termes précis. Éviter les longues phrases.',
      hallucinationRisk: 'high'
    },
    'sciences': {
      name: 'Sciences',
      questionPatterns: [
        'Quelle est la formule de {composé/loi} ?',
        'Quel organe {fonction} ?',
        'De quoi est composé {élément} ?',
        'Quel est le symbole chimique de {élément} ?',
        'Comment s\'appelle le processus de {description} ?'
      ],
      avoidPatterns: [
        'Qui a découvert {élément} et quand ?', // Deux questions = problème
        'Décrivez le mécanisme complet de {processus}' // Trop long
      ],
      // RÈGLE CRITIQUE: réponses simples uniquement
      complexAnswerRule: 'Si la réponse est une formule complexe, utiliser type: mcq avec choix',
      svgOpportunities: [
        'Schémas de cellules/organes simplifiés',
        'Diagrammes de circuits électriques',
        'Modèles atomiques simples',
        'Cycles (eau, carbone) schématiques'
      ],
      responseFormat: 'Symboles simples (H2O, CO2), termes courts. Pour formules complexes (E=mc², PV=nRT) → utiliser QCM.',
      hallucinationRisk: 'medium',
      useLatex: true  // Utiliser LaTeX pour les formules chimiques et physiques
    },
    'langues': {
      name: 'Langues',
      questionPatterns: [
        'Traduire : {mot/expression}',
        'Conjuguer {verbe} au {temps}',
        'Quel est le pluriel de {nom} ?',
        'Quel est le contraire de {adjectif} ?',
        'Compléter : {phrase à trous}'
      ],
      avoidPatterns: [
        'Quelle est l\'étymologie de {mot} ?',  // Souvent contestée
        'Donnez 10 synonymes de {mot}'          // Trop de variations
      ],
      svgOpportunities: [
        'Illustrations d\'objets concrets pour vocabulaire'
      ],
      responseFormat: 'Mots/expressions courts. Toujours inclure alternatives (variantes orthographiques).',
      hallucinationRisk: 'low'
    },
    'geographie': {
      name: 'Géographie',
      questionPatterns: [
        'Quelle est la capitale de {pays} ?',
        'Dans quel continent se trouve {pays} ?',
        'Quel fleuve traverse {ville} ?',
        'Quel pays a pour capitale {ville} ?'
      ],
      avoidPatterns: [
        'Quelle est la population exacte de {lieu} ?', // Change constamment
        'Quelle est la superficie de {lieu} ?'         // Chiffres variables
      ],
      svgOpportunities: [
        'Cartes schématiques de continents',
        'Schémas de reliefs',
        'Représentations de cours d\'eau'
      ],
      responseFormat: 'Noms propres avec alternatives (noms locaux vs français)',
      hallucinationRisk: 'medium'
    },
    'default': {
      name: 'Général',
      questionPatterns: [],
      avoidPatterns: [
        'Citez une phrase/citation de {personne}',
        'Donnez la date exacte de {événement mineur}',
        'Combien exactement {statistique variable}'
      ],
      svgOpportunities: [],
      responseFormat: 'Réponses courtes (1-3 mots), toujours avec alternatives',
      hallucinationRisk: 'medium'
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // EXEMPLES DE CARTES (BONS vs MAUVAIS)
  // ═══════════════════════════════════════════════════════════════

  CARD_EXAMPLES: {
    good: {
      text: `- id: "hist_001"
  question: "Quel événement marque le début de la Révolution française ?"
  answer: "Prise de la Bastille"
  alternatives:
    - "prise de la Bastille"
    - "14 juillet 1789"
    - "Bastille"
  hint: "Un bâtiment symbole de l'absolutisme royal"
  feedback: "Le 14 juillet 1789, la prise de la Bastille symbolise la révolte du peuple contre la monarchie absolue."`,

      numeric: `- id: "math_001"
  question: "Calculer : 7 × 8"
  type: "numeric"
  answer: 56
  feedback: "7 × 8 = 56. Astuce : 7×8 = 56 (5, 6, 7, 8 se suivent)"`,

      mcq: `- id: "bio_001"
  question: "Quel organe produit l'insuline ?"
  type: "mcq"
  choices:
    - id: A
      text: "Foie"
    - id: B
      text: "Pancréas"
    - id: C
      text: "Rein"
    - id: D
      text: "Rate"
  answer: "B"
  feedback: "Le pancréas contient les îlots de Langerhans qui sécrètent l'insuline."`,

      truefalse: `- id: "geo_001"
  question: "L'Australie est à la fois un pays et un continent."
  type: "truefalse"
  answer: true
  feedback: "L'Australie est le seul pays qui occupe un continent entier."`,

      cloze: `- id: "fr_cloze_001"
  question: "La photosynthèse permet aux plantes de transformer le dioxyde de carbone en {{oxygène}}."
  type: "cloze"
  answer: "oxygène"
  alternatives:
    - "O2"
    - "dioxygène"
  feedback: "La photosynthèse produit de l'oxygène à partir du CO2 et de l'eau."`,

      matching: `- id: "geo_match_001"
  question: "Associez chaque pays à sa capitale :"
  type: "matching"
  pairs:
    - term: "France"
      response: "Paris"
    - term: "Allemagne"
      response: "Berlin"
    - term: "Italie"
      response: "Rome"
  answer: "auto"
  feedback: "Capitales des principaux pays européens."`
    },
    bad: {
      text: `# ❌ PROBLÈMES : réponse trop longue, pas d'alternatives, question vague
- id: "hist_001"
  type: "text"  # Inutile (défaut)
  question: "Parlez de la Révolution française"
  answer: "La Révolution française est un événement majeur qui a commencé en 1789"`,

      numeric: `# ❌ PROBLÈMES : type non spécifié, réponse avec texte
- id: "math_001"
  question: "7 fois 8 égale combien ?"
  answer: "56 unités"`,

      mcq: `# ❌ PROBLÈMES : distracteurs absurdes, answer mal formaté
- id: "bio_001"
  question: "L'insuline est produite par :"
  type: "mcq"
  choices:
    - id: A
      text: "La pizza"
    - id: B
      text: "Le pancréas"
    - id: C
      text: "La voiture"
  answer: "Le pancréas"  # Devrait être "B"`,

      cloze: `# ❌ PROBLÈMES CLOZE À ÉVITER :

# 1. Mot isolé entre parenthèses (non naturel)
- id: "bad_cloze_001"
  question: "Les conteneurs Docker sont des conteneurs sans état ({{stateless}})."
  # ❌ Le mot à compléter est isolé entre parenthèses, pas intégré à la phrase

# 2. Deux trous côte à côte (impossible à deviner)
- id: "bad_cloze_002"
  question: "La formule de l'eau est {{H}}{{2}}O."
  # ❌ Deux trous consécutifs rendent la carte ambiguë

# 3. Pas de marqueur de trou
- id: "bad_cloze_003"
  question: "Le soleil se lève à l'est."
  type: "cloze"
  answer: "soleil"
  # ❌ Aucun {{trou}} dans la question

# 4. Réponse trop longue
- id: "bad_cloze_004"
  question: "{{Le soleil}} se lève à l'est."
  type: "cloze"
  answer: "Le soleil"
  # ❌ Réponse de plusieurs mots

# 5. Cloze dans une phrase interrogative
- id: "bad_cloze_005"
  question: "Quel {{organe}} produit l'insuline ?"
  type: "cloze"
  answer: "organe"
  # ❌ Le trou est dans une question, le but du cloze est de compléter une AFFIRMATION`,

      matching: `# ❌ PROBLÈMES : réponses dans les termes, pas de pairs
- id: "geo_match_001"
  question: "Capitales"
  type: "matching"
  answer: "France - Paris, Allemagne - Berlin"  # Devrait utiliser pairs`
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // PATTERNS DE DÉTECTION DE RISQUE D'HALLUCINATION
  // ═══════════════════════════════════════════════════════════════

  HALLUCINATION_PATTERNS: [
    { pattern: /\b(en|le|année)\s+\d{3,4}\b/i, risk: 0.3, desc: 'Date spécifique' },
    { pattern: /"[^"]{20,}"/, risk: 0.5, desc: 'Citation longue' },
    { pattern: /\d+([.,]\d+)?%/, risk: 0.3, desc: 'Pourcentage précis' },
    { pattern: /\d+\s*(millions?|milliards?)/i, risk: 0.4, desc: 'Grand nombre' },
    { pattern: /exactement|précisément/i, risk: 0.3, desc: 'Terme de précision' },
    { pattern: /toujours|jamais|tous les|aucun/i, risk: 0.2, desc: 'Absolu' }
  ],

  // ═══════════════════════════════════════════════════════════════
  // DÉFINITIONS DES CHAMPS DU FORMULAIRE
  // ═══════════════════════════════════════════════════════════════

  FORM_FIELDS: {
    // Informations sur le sujet
    category: {
      id: 'category',
      label: 'Matière et Niveau',
      type: 'tags', // Utilise Components.tagSelector
      required: true,
      section: 'subject',
      help: 'Sélectionnez au moins une matière ET un niveau dans la taxonomie',
      requiredGroups: ['Matières', 'Niveaux'] // Groupes obligatoires
    },
    topic: {
      id: 'topic',
      label: 'Sujet précis',
      type: 'text',
      placeholder: 'Ex: Tables de multiplication, Révolution française...',
      required: true,
      section: 'subject',
      help: 'Le thème spécifique à couvrir'
    },
    subtopics: {
      id: 'subtopics',
      label: 'Sous-thèmes à inclure (optionnel)',
      type: 'textarea',
      placeholder: 'Un sous-thème par ligne...',
      required: false,
      section: 'subject',
      help: 'Liste des points spécifiques à aborder'
    },
    learningObjectives: {
      id: 'learningObjectives',
      label: 'Objectifs pédagogiques',
      type: 'textarea',
      placeholder: 'Ex: Mémoriser les dates clés, Comprendre les causes...',
      required: true,
      section: 'subject',
      help: 'Ce que l\'apprenant doit savoir/savoir faire après'
    },

    // Public cible - Supprimé car intégré dans la taxonomie (category)
    // Le niveau est maintenant sélectionné via les tags de la taxonomy
    prerequisites: {
      id: 'prerequisites',
      label: 'Prérequis supposés (optionnel)',
      type: 'textarea',
      placeholder: 'Ex: Connaître les nombres de 1 à 10, Savoir lire...',
      required: false,
      section: 'subject',
      help: 'Ce que l\'apprenant doit déjà maîtriser'
    },

    // Configuration des cartes
    cardCount: {
      id: 'cardCount',
      label: 'Nombre de cartes souhaité (optionnel)',
      type: 'number',
      min: 5,
      max: 100,
      value: '',
      required: false,
      section: 'cards',
      help: 'Laissez vide pour que le LLM choisisse le nombre optimal pour le sujet'
    },
    questionTypes: {
      id: 'questionTypes',
      label: 'Types de questions',
      type: 'multiselect',
      required: true,
      section: 'cards',
      options: [
        { value: 'text', label: 'Réponse texte libre', description: 'L\'apprenant tape sa réponse' },
        { value: 'numeric', label: 'Réponse numérique', description: 'Pour les calculs' },
        { value: 'mcq', label: 'QCM (choix multiples)', description: '3-4 options avec une ou plusieurs bonnes réponses' },
        { value: 'boolean', label: 'Vrai/Faux', description: 'Affirmations à valider' },
        { value: 'cloze', label: 'Texte à trous', description: 'Compléter une phrase' },
        { value: 'matching', label: 'Association', description: 'Relier des éléments' }
      ]
    },
    difficulty: {
      id: 'difficulty',
      label: 'Répartition de la difficulté (optionnel)',
      type: 'select',
      required: false,
      section: 'cards',
      options: [
        { value: '', label: 'Laisser le LLM décider' },
        { value: 'progressive', label: 'Progressive (facile → difficile)' },
        { value: 'uniform_easy', label: 'Uniformément facile' },
        { value: 'uniform_medium', label: 'Uniformément moyen' },
        { value: 'uniform_hard', label: 'Uniformément difficile' },
        { value: 'mixed', label: 'Mélangé (variété de difficultés)' }
      ]
    },
    includeHints: {
      id: 'includeHints',
      label: 'Inclure des indices',
      type: 'checkbox',
      value: true,
      section: 'cards',
      help: 'Aide optionnelle pour les questions difficiles'
    },
    includeFeedback: {
      id: 'includeFeedback',
      label: 'Inclure un feedback pédagogique',
      type: 'checkbox',
      value: true,
      section: 'cards',
      help: 'Explication affichée en cas de mauvaise réponse'
    },
    // Options pédagogiques avancées
    learningApproach: {
      id: 'learningApproach',
      label: 'Approche pédagogique (optionnel)',
      type: 'select',
      required: false,
      section: 'pedagogy',
      options: [
        { value: '', label: 'Laisser le LLM décider' },
        { value: 'memorization', label: 'Mémorisation (faits, dates, définitions)' },
        { value: 'understanding', label: 'Compréhension (concepts, relations)' },
        { value: 'application', label: 'Application (problèmes, cas pratiques)' },
        { value: 'analysis', label: 'Analyse (comparaison, déduction)' },
        { value: 'mixed', label: 'Mixte (tous les niveaux cognitifs)' }
      ]
    },
    includeCommonMistakes: {
      id: 'includeCommonMistakes',
      label: 'Intégrer les erreurs courantes',
      type: 'checkbox',
      value: true,
      section: 'pedagogy',
      help: 'Questions ciblant les confusions fréquentes'
    },
    includeMnemonics: {
      id: 'includeMnemonics',
      label: 'Proposer des moyens mnémotechniques',
      type: 'checkbox',
      value: false,
      section: 'pedagogy',
      help: 'Astuces pour mémoriser plus facilement'
    },
    includeRealWorldExamples: {
      id: 'includeRealWorldExamples',
      label: 'Inclure des exemples concrets',
      type: 'checkbox',
      value: true,
      section: 'pedagogy',
      help: 'Applications dans la vie réelle'
    },
    bidirectional: {
      id: 'bidirectional',
      label: 'Questions bidirectionnelles',
      type: 'checkbox',
      value: false,
      section: 'pedagogy',
      help: 'Ex: "Capitale de la France?" ET "Paris est la capitale de quel pays?"'
    },

    // Format et langue
    language: {
      id: 'language',
      label: 'Langue du deck',
      type: 'select',
      required: true,
      section: 'format',
      options: [
        { value: 'universal', label: 'Universelle (maths, symboles, formules)' },
        { value: 'fr', label: 'Français' },
        { value: 'en', label: 'Anglais' },
        { value: 'es', label: 'Espagnol' },
        { value: 'de', label: 'Allemand' },
        { value: 'it', label: 'Italien' },
        { value: 'pt', label: 'Portugais' }
      ]
    },
    includeMedia: {
      id: 'includeMedia',
      label: 'Inclure des médias',
      type: 'select',
      required: false,
      section: 'format',
      options: [
        { value: '', label: 'Aucun média' },
        { value: 'generate', label: 'Générer des images (DALL-E, etc.)' },
        { value: 'fetch', label: 'Récupérer des images libres de droits' },
        { value: 'suggest', label: 'Suggestions uniquement (descriptions)' }
      ],
      help: 'Les médias seront encodés en base64 pour fonctionner hors-ligne'
    },
    outputFormat: {
      id: 'outputFormat',
      label: 'Format de sortie',
      type: 'select',
      required: true,
      section: 'format',
      options: [
        { value: 'yaml', label: 'YAML (recommandé)' },
        { value: 'json', label: 'JSON' }
      ]
    },

    // Instructions spéciales
    additionalInstructions: {
      id: 'additionalInstructions',
      label: 'Instructions supplémentaires',
      type: 'textarea',
      placeholder: 'Ex: Éviter les questions sur X, Insister sur Y...',
      required: false,
      section: 'special',
      help: 'Consignes spécifiques pour le LLM'
    },
    sourcesToUse: {
      id: 'sourcesToUse',
      label: 'Sources à privilégier',
      type: 'textarea',
      placeholder: 'Ex: Programme officiel 2024, Manuel Hatier...',
      required: false,
      section: 'special',
      help: 'Références pour garantir l\'exactitude'
    },
    contentToAvoid: {
      id: 'contentToAvoid',
      label: 'Contenu à éviter',
      type: 'textarea',
      placeholder: 'Ex: Questions controversées, Sujets déjà maîtrisés...',
      required: false,
      section: 'special',
      help: 'Éléments à exclure du deck'
    },
    // Mode "Source fournie" - Anti-hallucination
    sourceDocument: {
      id: 'sourceDocument',
      label: '📄 Document source (mode anti-hallucination)',
      type: 'textarea',
      placeholder: 'Collez ici le contenu d\'un cours, manuel, ou document de référence...\n\nLe LLM créera des cartes UNIQUEMENT à partir de ce texte, éliminant le risque d\'invention.',
      required: false,
      section: 'special',
      help: '⚡ Mode recommandé : Le LLM extrait les informations du document au lieu d\'inventer'
    },
    // Génération SVG
    generateSvg: {
      id: 'generateSvg',
      label: 'Générer des schémas SVG',
      type: 'checkbox',
      value: false,
      section: 'format',
      help: 'Génère des schémas SVG inline pour maths, sciences, géographie (expérimental)'
    }
  },

  FORM_SECTIONS: {
    subject: { title: 'Sujet et Objectifs', icon: '📚', order: 1 },
    cards: { title: 'Configuration des Cartes', icon: '🃏', order: 2 },
    pedagogy: { title: 'Approche Pédagogique', icon: '🎓', order: 3 },
    format: { title: 'Format et Langue', icon: '📝', order: 4 },
    special: { title: 'Instructions Spéciales', icon: '⚡', order: 5 }
  },

  // ═══════════════════════════════════════════════════════════════
  // GÉNÉRATION DU PROMPT
  // ═══════════════════════════════════════════════════════════════

  /**
   * Génère le prompt complet à partir des données du formulaire
   *
   * @param {Object} formData - Données du formulaire
   * @returns {string} - Prompt optimisé pour LLM
   */
  generatePrompt(formData) {
    // Détecter le domaine pour les templates (utilise les tags de catégorie)
    const domain = this._detectDomain(formData);
    const template = this.DOMAIN_TEMPLATES[domain] || this.DOMAIN_TEMPLATES.default;

    // Déterminer si LaTeX est pertinent pour ce domaine
    const needsLatex = this._needsLatex(formData, template);

    // Déterminer si SVG est pertinent pour ce domaine
    const needsSvg = formData.generateSvg && this._needsSvg(template);

    const sections = [
      this._generateRoleSection(formData),
      this._generateContextSection(formData),
      // Mode source fournie = prompt simplifié et focalisé sur l'extraction
      formData.sourceDocument ? this._generateSourceDocumentSection(formData) : null,
      this._generateObjectivesSection(formData),
      this._generateCardSpecsSection(formData),
      this._generateDomainGuidanceSection(formData, template),
      // Exemples filtrés par types de cartes demandés
      this._generateCardExamplesSection(formData),
      this._generatePedagogySection(formData),
      this._generateFormatSection(formData),
      // LaTeX seulement si pertinent pour le domaine
      needsLatex ? this._generateLatexSection(formData, template) : null,
      // SVG seulement si pertinent pour le domaine
      needsSvg ? this._generateSvgSection(formData, template) : null,
      this._generateAntiHallucinationSection(formData, template),
      this._generateQualitySection(formData),
      this._generateVerificationSection(formData),
      this._generateOutputSection(formData)
    ].filter(Boolean); // Retire les sections nulles

    return sections.join('\n\n');
  },

  /**
   * Détermine si LaTeX est nécessaire pour ce prompt
   * @private
   */
  _needsLatex(formData, template) {
    // Explicitement demandé via langue universelle
    if (formData.language === 'universal') return true;

    // Le template du domaine l'exige (maths, sciences)
    if (template.useLatex) return true;

    // Domaines où LaTeX n'a pas de sens
    const noLatexDomains = ['histoire', 'langues', 'geographie'];
    const domain = this._detectDomain(formData);
    if (noLatexDomains.includes(domain)) return false;

    // Par défaut, pas de LaTeX
    return false;
  },

  /**
   * Détermine si SVG est pertinent pour ce domaine
   * @private
   */
  _needsSvg(template) {
    // SVG pertinent seulement si le domaine a des opportunités SVG définies
    return template.svgOpportunities && template.svgOpportunities.length > 0;
  },

  /**
   * Détecte le domaine à partir des tags de catégorie et du topic
   */
  _detectDomain(formData) {
    // Mapping des tags de catégorie vers les domaines de templates
    const tagToDomain = {
      'maths': 'maths',
      'arithmetique': 'maths',
      'algebre': 'maths',
      'geometrie': 'maths',
      'analyse': 'maths',
      'probabilites': 'maths',
      'statistiques': 'maths',
      'histoire': 'histoire',
      'geographie': 'geographie',
      'sciences-physiques': 'sciences',
      'sciences-vie': 'sciences',
      'physique': 'sciences',
      'chimie': 'sciences',
      'biologie': 'sciences',
      'langues': 'langues',
      'anglais': 'langues',
      'espagnol': 'langues',
      'allemand': 'langues'
    };

    // Vérifier d'abord les tags de catégorie
    if (formData.category && Array.isArray(formData.category)) {
      for (const tagId of formData.category) {
        if (tagToDomain[tagId]) {
          return tagToDomain[tagId];
        }
      }
    }

    // Fallback sur le topic si pas de tag trouvé
    const topicLower = (formData.topic || '').toLowerCase();

    const domainKeywords = {
      'maths': ['math', 'algèbre', 'géométrie', 'calcul', 'arithmétique', 'statistique', 'probabilité'],
      'histoire': ['histoire', 'historique', 'guerre', 'révolution', 'antiquité', 'moyen-âge', 'civilisation'],
      'sciences': ['physique', 'chimie', 'biologie', 'svt', 'science', 'anatomie', 'électricité', 'optique'],
      'langues': ['anglais', 'espagnol', 'allemand', 'italien', 'langue', 'vocabulaire', 'conjugaison', 'grammaire'],
      'geographie': ['géographie', 'capitale', 'pays', 'continent', 'fleuve', 'montagne', 'climat']
    };

    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      if (keywords.some(kw => topicLower.includes(kw))) {
        return domain;
      }
    }

    return 'default';
  },

  /**
   * Extrait les matières et niveaux des tags sélectionnés
   * @private
   */
  _extractCategoryInfo(formData) {
    const result = {
      matieres: [],
      niveaux: [],
      allLabels: []
    };

    if (!formData.category || !Array.isArray(formData.category)) {
      return result;
    }

    formData.category.forEach(tagId => {
      if (typeof Tags !== 'undefined') {
        const tag = Tags.getById(tagId);
        if (tag) {
          result.allLabels.push(tag.label);
          if (tag.group === 'Matières') {
            result.matieres.push(tag);
          } else if (tag.group === 'Niveaux') {
            result.niveaux.push(tag);
          }
        }
      }
    });

    return result;
  },

  /**
   * Section: Rôle du LLM
   */
  _generateRoleSection(formData) {
    const { matieres } = this._extractCategoryInfo(formData);
    const matiereLabel = matieres.length > 0
      ? matieres.map(t => t.label).join(', ')
      : formData.topic;

    return `# RÔLE ET EXPERTISE

Tu es un expert en création de contenus pédagogiques, spécialisé dans la conception de flashcards pour l'apprentissage par répétition espacée (système Leitner). Tu combines une expertise en :
- Pédagogie et sciences de l'éducation
- Conception de contenus d'apprentissage efficaces
- Le domaine spécifique : **${matiereLabel}**

Tu vas créer un deck de flashcards de haute qualité pédagogique, précis factuellement, et optimisé pour la mémorisation à long terme.`;
  },

  /**
   * Section: Contexte
   */
  _generateContextSection(formData) {
    const { matieres, niveaux, allLabels } = this._extractCategoryInfo(formData);

    // Construire le label de la matière
    const matiereLabel = matieres.length > 0
      ? matieres.map(t => t.label).join(' > ')
      : 'Non spécifié';

    // Construire le label du niveau avec équivalents internationaux
    let niveauLabel = 'Non spécifié';
    let niveauEquivalents = '';
    if (niveaux.length > 0) {
      const niveau = niveaux[niveaux.length - 1]; // Prendre le plus spécifique
      niveauLabel = niveau.label;
      if (niveau.equivalents) {
        const equivParts = [];
        if (niveau.equivalents.en) equivParts.push(`EN: ${niveau.equivalents.en}`);
        if (niveau.equivalents.uk) equivParts.push(`UK: ${niveau.equivalents.uk}`);
        if (niveau.equivalents.de) equivParts.push(`DE: ${niveau.equivalents.de}`);
        niveauEquivalents = equivParts.join(', ');
      }
    }

    let context = `# CONTEXTE

## Sujet
- **Matière** : ${matiereLabel}
- **Thème spécifique** : ${formData.topic}
- **Niveau** : ${niveauLabel}${niveauEquivalents ? ` (équivalents internationaux : ${niveauEquivalents})` : ''}`;

    // Ajouter toutes les catégories/tags sélectionnés
    if (allLabels.length > 0) {
      context += `\n- **Tags** : ${allLabels.join(', ')}`;
    }

    if (formData.subtopics) {
      context += `\n- **Sous-thèmes à couvrir** :\n${formData.subtopics.split('\n').map(s => `  - ${s.trim()}`).join('\n')}`;
    }

    if (formData.prerequisites) {
      context += `\n\n## Prérequis supposés\n${formData.prerequisites}`;
    }

    return context;
  },

  /**
   * Section: Objectifs pédagogiques
   */
  _generateObjectivesSection(formData) {
    return `# OBJECTIFS PÉDAGOGIQUES

À la fin de l'apprentissage avec ce deck, l'apprenant devra être capable de :
${formData.learningObjectives.split('\n').map(o => `- ${o.trim()}`).join('\n')}`;
  },

  /**
   * Section: Spécifications des cartes
   */
  _generateCardSpecsSection(formData) {
    const questionTypeLabels = formData.questionTypes.map(type => {
      const option = this.FORM_FIELDS.questionTypes.options.find(o => o.value === type);
      return option ? `- **${option.label}** : ${option.description}` : `- ${type}`;
    }).join('\n');

    const difficultyLabel = formData.difficulty
      ? (this.FORM_FIELDS.difficulty.options.find(o => o.value === formData.difficulty)?.label || formData.difficulty)
      : null;

    const cardCountText = formData.cardCount
      ? `- **Nombre de cartes** : ${formData.cardCount}`
      : '- **Nombre de cartes** : À déterminer par le LLM (choisir le nombre optimal pour couvrir exhaustivement le sujet)';

    return `# SPÉCIFICATIONS DES CARTES

## Quantité et Types
${cardCountText}
- **Types de questions à utiliser** :
${questionTypeLabels}

${difficultyLabel ? `## Difficulté
- **Répartition** : ${difficultyLabel}
${formData.difficulty === 'progressive' ? '- Commencer par des questions simples et augmenter progressivement la complexité' : ''}` : `## Difficulté
- **Répartition** : À déterminer par le LLM selon le sujet et le public cible`}

## Éléments à inclure
${formData.includeHints ? '- ✅ **Indices** : Fournir un indice optionnel pour les questions difficiles' : '- ❌ Pas d\'indices'}
${formData.includeFeedback ? '- ✅ **Feedback** : Fournir une explication pédagogique (affichée en cas de mauvaise réponse)' : '- ❌ Pas de feedback'}
${formData.bidirectional ? '- ✅ **Bidirectionnel** : Créer des questions dans les deux sens quand pertinent' : ''}`;
  },

  /**
   * Section: Approche pédagogique
   */
  _generatePedagogySection(formData) {
    const approachLabel = formData.learningApproach
      ? (this.FORM_FIELDS.learningApproach.options.find(o => o.value === formData.learningApproach)?.label || formData.learningApproach)
      : null;

    let pedagogy = `# APPROCHE PÉDAGOGIQUE

## Niveau cognitif visé
${approachLabel
    ? `- **Approche principale** : ${approachLabel}`
    : '- **Approche principale** : À déterminer par le LLM (choisir l\'approche cognitive optimale pour le sujet et le public)'}`;

    const techniques = [];
    if (formData.includeCommonMistakes) {
      techniques.push(`- **Erreurs courantes** : Inclure des questions qui ciblent les confusions et erreurs fréquentes dans ce domaine. Dans les QCM, utiliser des distracteurs basés sur les erreurs typiques.`);
    }
    if (formData.includeMnemonics) {
      techniques.push(`- **Mnémotechniques** : Proposer des astuces de mémorisation (acronymes, associations visuelles, phrases mnémotechniques) dans les feedbacks.`);
    }
    if (formData.includeRealWorldExamples) {
      techniques.push(`- **Exemples concrets** : Ancrer les questions dans des situations réelles et des applications pratiques.`);
    }

    if (techniques.length > 0) {
      pedagogy += `\n\n## Techniques pédagogiques\n${techniques.join('\n')}`;
    }

    return pedagogy;
  },

  /**
   * Section: Format de sortie
   */
  _generateFormatSection(formData) {
    const langLabel = this.FORM_FIELDS.language.options
      .find(o => o.value === formData.language)?.label || formData.language;

    const isYaml = formData.outputFormat === 'yaml';
    const isUniversal = formData.language === 'universal';

    // Extraire le niveau depuis les tags de catégorie
    const { niveaux } = this._extractCategoryInfo(formData);
    const niveauLabel = niveaux.length > 0
      ? niveaux[niveaux.length - 1].label
      : 'adapté au public cible';

    let format = `# FORMAT DE SORTIE

## Langue
${isUniversal
    ? `- **Langue universelle** : Utiliser UNIQUEMENT des symboles, formules et notations mathématiques/scientifiques standard
- **AUCUN mot** dans les questions - seulement des expressions symboliques
- Exemples de questions correctes :
  - \`$4 + 5 = ?\`\` (pas "Calculer 4 + 5")
  - \`$\\sqrt{16} = ?\`\` (pas "Quelle est la racine carrée de 16 ?")
  - \`$2x + 3 = 9$, $x = ?\`\` (pas "Résoudre l'équation")
  - \`$H_2O$\` → ? (formule chimique)

### Préambule de réponse
Pour les équations avec variable, inclure le préambule dans la question pour que l'utilisateur n'ait qu'à saisir le résultat :
- Question : \`$2x + 3 = 9$, $x = ?\`\` → Réponse : \`3\` (pas "x = 3")
- Question : \`$y = 2x + 1$, si $x = 3$, $y = ?\`\` → Réponse : \`7\`
- Question : \`$a^2 + b^2 = c^2$, si $a = 3$, $b = 4$, $c = ?\`\` → Réponse : \`5\`

### Format des réponses universelles
- Réponses numériques pures (pas de texte, pas d'unités)
- Utiliser \`type: numeric\` pour toutes les réponses numériques
- Les formules en réponse doivent être en LaTeX : \`$\\frac{1}{2}$\``
    : `- Toutes les cartes doivent être rédigées en **${langLabel}**`}
- Utiliser un vocabulaire adapté au niveau ${niveauLabel}

## Structure du fichier (${formData.outputFormat.toUpperCase()})`;

    // Générer la liste des catégories pour le template YAML (utilise les tags sélectionnés)
    let categoryYaml = formData.category && formData.category.length > 0
      ? formData.category.map(cat => `  - "${cat}"`).join('\n')
      : `  - "general"`;

    // Générer un ID unique avec timestamp
    const uniqueId = `${TextUtils.slugify(formData.topic)}-${Date.now().toString(36)}`;

    if (isYaml) {
      format += `

\`\`\`yaml
id: "${uniqueId}"
name: "${formData.topic}"
description: "Description du deck"
category:
${categoryYaml}
difficulty: 1  # 1-4 (optionnel)
settings:
  bidirectional: ${formData.bidirectional}
  sequential: false
  similarityMatching: false  # true = accepte les réponses similaires (fautes de frappe mineures)

cards:
  # ... voir exemples détaillés ci-dessous
\`\`\`

## EXEMPLES DÉTAILLÉS PAR TYPE DE CARTE

### 1. Carte TEXTE (type par défaut - ne pas spécifier "type")
Réponse libre avec alternatives acceptées.
\`\`\`yaml
- id: "geo_capitale_001"
  question: "Quelle est la capitale de l'Australie ?"
  answer: "Canberra"
  alternatives:
    - "canberra"
    - "Camberra"  # faute courante
  ${formData.includeHints ? 'hint: "Ce n\'est pas Sydney..."' : '# hint: non requis'}
  ${formData.includeFeedback ? 'feedback: "Canberra est la capitale depuis 1913, choisie comme compromis entre Sydney et Melbourne."' : '# feedback: non requis'}
\`\`\`

### 2. Carte NUMÉRIQUE
Pour les réponses numériques exactes (calculs, dates, quantités).
\`\`\`yaml
- id: "math_calc_001"
  question: "Combien font 15 × 7 ?"
  type: numeric
  answer: 105
  # tolerance: 0  # optionnel: marge d'erreur acceptée
  ${formData.includeFeedback ? 'feedback: "15 × 7 = 105"' : ''}
\`\`\`

### 3. Carte QCM (Choix Multiples)
Question avec plusieurs options, une seule bonne réponse.
\`\`\`yaml
- id: "bio_qcm_001"
  question: "Quel organe produit l'insuline ?"
  type: mcq
  choices:
    - id: A
      text: "Le foie"
    - id: B
      text: "Le pancréas"
    - id: C
      text: "Les reins"
    - id: D
      text: "L'estomac"
  answer: "B"
  ${formData.includeFeedback ? 'feedback: "Le pancréas contient les îlots de Langerhans qui produisent l\'insuline."' : ''}
\`\`\`

### 4. Carte VRAI/FAUX
Affirmation à valider.
\`\`\`yaml
- id: "hist_tf_001"
  question: "La Révolution française a commencé en 1789."
  type: truefalse
  answer: true
  ${formData.includeFeedback ? 'feedback: "La prise de la Bastille le 14 juillet 1789 marque le début symbolique."' : ''}

- id: "sci_tf_002"
  question: "Le son se propage plus vite dans le vide que dans l'air."
  type: truefalse
  answer: false
  ${formData.includeFeedback ? 'feedback: "Le son ne peut pas se propager dans le vide car il a besoin d\'un milieu matériel."' : ''}
\`\`\`

### 5. Carte TEXTE À TROUS (Cloze)
Compléter une phrase avec le mot manquant entre {{accolades}}.

**⚠️ RÈGLES STRICTES pour les cartes cloze :**
- Le mot {{à_compléter}} doit être **INTÉGRÉ naturellement** dans la phrase
- ❌ JAMAIS de cloze dans une phrase interrogative (? interdit)
- ❌ JAMAIS de mot isolé entre parenthèses : "({{mot}})"
- ❌ JAMAIS de trous côte à côte : "{{mot1}}{{mot2}}"
- ❌ JAMAIS de plusieurs trous trop proches (< 5 mots d'écart)
- ✅ Le mot doit faire partie intégrante de la structure grammaticale
- ✅ La phrase doit être une **AFFIRMATION**, pas une question

\`\`\`yaml
# ✅ BON : le mot est intégré naturellement dans la phrase
- id: "bio_cloze_001"
  question: "La photosynthèse transforme le CO2 en {{oxygène}} grâce à la lumière."
  type: cloze
  answer: "oxygène"
  alternatives:
    - "O2"
    - "dioxygène"
  ${formData.includeFeedback ? 'feedback: "La photosynthèse produit de l\'oxygène comme sous-produit."' : ''}

# ❌ MAUVAIS : mot isolé entre parenthèses
# question: "Les plantes produisent un gaz ({{oxygène}})."
\`\`\`

### 6. Carte ASSOCIATION (Matching)
Relier des éléments entre eux (paires terme-définition).
\`\`\`yaml
- id: "lang_match_001"
  question: "Associez chaque pays à sa capitale :"
  type: matching
  pairs:
    - term: "France"
      response: "Paris"
    - term: "Espagne"
      response: "Madrid"
    - term: "Italie"
      response: "Rome"
    - term: "Allemagne"
      response: "Berlin"
  answer: "auto"  # Les paires définissent déjà les bonnes associations
  ${formData.includeFeedback ? 'feedback: "Paris, Madrid, Rome et Berlin sont les capitales respectives."' : ''}
\`\`\``;
    } else {
      // Générer la liste des catégories pour JSON
      const categoryJson = formData.category && formData.category.length > 0
        ? formData.category.map(cat => `"${cat}"`).join(', ')
        : '"general"';

      format += `

\`\`\`json
{
  "id": "${uniqueId}",
  "name": "${formData.topic}",
  "description": "Description du deck",
  "category": [${categoryJson}],
  "difficulty": 1,
  "settings": {
    "bidirectional": ${formData.bidirectional},
    "sequential": false
  },
  "cards": [
    {
      "id": "card_001",
      "question": "Question ici",
      "answer": "Réponse attendue",
      "type": "text"${formData.includeHints ? ',\n      "hint": "Indice optionnel"' : ''}${formData.includeFeedback ? ',\n      "feedback": "Explication pédagogique"' : ''}
    }
  ]
}
\`\`\``;
    }

    if (formData.includeMedia === 'generate') {
      format += `\n\n## Médias générés par IA

⚠️ **IMPORTANT - Application 100% hors-ligne** : Les médias DOIVENT être intégrés en base64, PAS via des URLs externes !

### Instructions de génération d'images

Pour chaque carte où une image est pertinente :
1. **Génère l'image** avec DALL-E (ou équivalent) selon les besoins de la carte
2. **Encode l'image en base64** et intègre-la directement dans le YAML
3. **Format obligatoire** :

\`\`\`yaml
media:
  type: "image"
  data: "data:image/png;base64,iVBORw0KGgo..."  # Image complète en base64
\`\`\`

### Style des images à générer
- Images simples, éducatives, style illustration ou schéma
- Fond neutre, contenu clair et lisible
- Taille optimale : 512x512 ou 256x256 pixels
- Privilégier PNG pour les schémas, JPEG pour les photos

Si tu ne peux pas générer d'images, utilise \`mediaSuggestion\` avec une description détaillée.`;
    } else if (formData.includeMedia === 'fetch') {
      format += `\n\n## Médias libres de droits

⚠️ **IMPORTANT - Application 100% hors-ligne** : Les médias DOIVENT être intégrés en base64, PAS via des URLs externes !

### Instructions de récupération d'images

Pour chaque carte où une image est pertinente :
1. **Recherche une image libre de droits** sur :
   - Wikimedia Commons (images éducatives, schémas scientifiques)
   - Unsplash / Pixabay (photos)
   - Ou toute source avec licence Creative Commons / domaine public
2. **Télécharge et encode l'image en base64**
3. **Intègre-la directement** :

\`\`\`yaml
media:
  type: "image"
  data: "data:image/png;base64,iVBORw0KGgo..."  # Image complète en base64
  source: "Wikimedia Commons"  # Attribution optionnelle
  license: "CC BY-SA 4.0"      # Licence optionnelle
\`\`\`

### Critères de sélection
- Images éducatives et pertinentes pour la question
- Résolution raisonnable (éviter les images trop lourdes)
- Privilégier les schémas/illustrations pour les concepts abstraits

Si tu ne peux pas récupérer d'images, utilise \`mediaSuggestion\` avec :
- Description précise de l'image souhaitée
- Mots-clés de recherche suggérés
- URL de suggestion (l'utilisateur téléchargera manuellement)`;
    } else if (formData.includeMedia === 'suggest') {
      format += `\n\n## Suggestions de médias

Pour chaque carte où une image serait pertinente, ajouter un champ \`mediaSuggestion\` :

\`\`\`yaml
mediaSuggestion:
  description: "Schéma montrant le cycle de l'eau avec évaporation, condensation et précipitations"
  keywords: ["cycle eau", "water cycle diagram", "évaporation"]
  sources: ["Wikimedia Commons", "Pixabay"]
\`\`\`

⚠️ L'utilisateur devra ensuite :
1. Rechercher l'image avec les mots-clés fournis
2. Télécharger une image libre de droits
3. La convertir en base64 et l'ajouter au champ \`media\``;
    }

    format += `

## Champs supportés pour les cartes

### Champs obligatoires
- \`id\` : Identifiant unique (format: card_001, card_002...)
- \`question\` : La question posée
- \`answer\` : La réponse attendue
  - Pour texte : la réponse exacte en chaîne
  - Pour numeric : le nombre (ex: 42, 3.14)
  - Pour mcq : ID de la bonne réponse ("A") ou plusieurs ("A,C")
  - Pour truefalse : \`true\` ou \`false\` (booléen YAML, pas une chaîne)
  - Pour matching : "auto" (les paires définissent les réponses)

### Types de cartes disponibles
| Type | Description | Champs spécifiques |
|------|-------------|-------------------|
| (défaut) | Texte libre | \`alternatives\` |
| \`numeric\` | Nombre exact | \`tolerance\` (optionnel) |
| \`mcq\` | Choix multiples | \`choices\` (obligatoire) |
| \`truefalse\` | Vrai/Faux | \`answer: true\` ou \`answer: false\` |
| \`cloze\` | Texte à trous | Question avec \`{{mot}}\` |
| \`matching\` | Associations | \`pairs\` (obligatoire) |

### Champs optionnels par type
- \`alternatives\` : Réponses alternatives acceptées (texte, cloze)
- \`hint\` : Indice sans révéler la réponse
- \`feedback\` : Explication pédagogique après réponse
- \`choices\` : Liste des options pour QCM [{id: "A", text: "..."}]
- \`pairs\` : Liste des associations [{term: "...", response: "..."}]
- \`tolerance\` : Marge d'erreur pour numeric (ex: 0.01)

### ⚠️ Bonnes pratiques CRITIQUES
1. **Ne PAS spécifier type pour les cartes texte** - c'est le défaut
2. **Pour truefalse, answer doit être \`true\` ou \`false\`** (booléen, pas "true" ou "false" en chaîne)
3. **Toujours prévoir des alternatives** pour les réponses textuelles
4. **Réponses courtes** - Facilite la saisie et la correction
5. **IDs uniques** - Chaque carte doit avoir un ID distinct
6. **JAMAIS d'expressions complexes en réponse** - Les réponses ne doivent JAMAIS demander d'écrire des expressions mathématiques complexes comme \`a^n\`, \`(a^n)^m\`, des fractions \`a/b\`, ou des formules. Utiliser QCM (\`type: mcq\`) pour ces cas.

### ⚠️ Règle FONDAMENTALE sur les réponses mathématiques
**La réponse doit TOUJOURS être simple à taper au clavier :**
- ✅ Nombre simple : \`42\`, \`3.14\`, \`-5\`
- ✅ Variable simple : \`x\`, \`y\`
- ✅ Mot court : \`vrai\`, \`carré\`
- ❌ JAMAIS : \`a^n\`, \`x^2 + 1\`, \`(a^n)^m = a^{nm}\`, \`\\frac{1}{2}\`

**Si la réponse attendue est une expression complexe → utiliser type: mcq**
\`\`\`yaml
# ❌ MAUVAIS - réponse complexe à taper
- id: "exp_001"
  question: "Simplifier $(a^n)^m$"
  answer: "a^{nm}"  # Trop complexe !

# ✅ BON - QCM pour les expressions
- id: "exp_001"
  question: "Simplifier $(a^n)^m$"
  type: mcq
  choices:
    - id: "A"
      text: "$a^{nm}$"
    - id: "B"
      text: "$a^{n+m}$"
    - id: "C"
      text: "$a^{n-m}$"
  answer: "A"
\`\`\``;

    return format;
  },

  /**
   * Section: Notations LaTeX pour mathématiques et sciences
   */
  _generateLatexSection(formData, template) {
    const isMath = template.name === 'Mathématiques';
    const isScience = template.name === 'Sciences';
    const isUniversal = formData.language === 'universal';

    let latex = `# NOTATIONS MATHÉMATIQUES EN LATEX

## Règle obligatoire
**Toutes les expressions mathématiques, formules et équations doivent être écrites en LaTeX.**

## Syntaxe LaTeX à utiliser

### Notation inline (dans le texte)
Utilisez \`$...$\` pour les expressions dans une phrase :
- Question : "Calculer $\\frac{3}{4} + \\frac{1}{2}$"
- Réponse : "$\\frac{5}{4}$" ou "$1,25$"

### Notation bloc (équations centrées)
Utilisez \`$$...$$\` pour les équations importantes :
\`\`\`yaml
question: |
  Résoudre l'équation :
  $$2x + 5 = 13$$
answer: "$x = 4$"
\`\`\`

## Exemples par type de contenu`;

    if (isMath || isUniversal) {
      latex += `

### Arithmétique et algèbre
| Expression | LaTeX | Rendu |
|------------|-------|-------|
| Fraction | \`$\\frac{a}{b}$\` | $\\frac{a}{b}$ |
| Puissance | \`$x^2$\` | $x^2$ |
| Racine carrée | \`$\\sqrt{x}$\` | $\\sqrt{x}$ |
| Racine n-ième | \`$\\sqrt[n]{x}$\` | $\\sqrt[n]{x}$ |
| Multiplication | \`$a \\times b$\` | $a \\times b$ |
| Division | \`$a \\div b$\` | $a \\div b$ |
| Plus ou moins | \`$\\pm$\` | $\\pm$ |
| Infini | \`$\\infty$\` | $\\infty$ |

### Comparaisons et ensembles
| Expression | LaTeX | Rendu |
|------------|-------|-------|
| Inférieur ou égal | \`$\\leq$\` | $\\leq$ |
| Supérieur ou égal | \`$\\geq$\` | $\\geq$ |
| Différent | \`$\\neq$\` | $\\neq$ |
| Appartient | \`$\\in$\` | $\\in$ |
| Union | \`$\\cup$\` | $\\cup$ |
| Intersection | \`$\\cap$\` | $\\cap$ |

### Géométrie
| Expression | LaTeX | Rendu |
|------------|-------|-------|
| Angle | \`$\\angle ABC$\` | $\\angle ABC$ |
| Degré | \`$90°$\` ou \`$90^\\circ$\` | $90°$ |
| Parallèle | \`$\\parallel$\` | $\\parallel$ |
| Perpendiculaire | \`$\\perp$\` | $\\perp$ |
| Triangle | \`$\\triangle ABC$\` | $\\triangle ABC$ |
| Pi | \`$\\pi$\` | $\\pi$ |`;
    }

    if (isScience) {
      latex += `

### Formules chimiques
| Expression | LaTeX | Rendu |
|------------|-------|-------|
| Indice (H₂O) | \`$H_2O$\` | $H_2O$ |
| Ion positif | \`$Na^+$\` | $Na^+$ |
| Ion négatif | \`$Cl^-$\` | $Cl^-$ |
| Réaction | \`$\\rightarrow$\` | $\\rightarrow$ |
| Équilibre | \`$\\rightleftharpoons$\` | $\\rightleftharpoons$ |

### Formules physiques
| Expression | LaTeX | Rendu |
|------------|-------|-------|
| Vecteur | \`$\\vec{v}$\` | $\\vec{v}$ |
| Dérivée | \`$\\frac{dv}{dt}$\` | $\\frac{dv}{dt}$ |
| Intégrale | \`$\\int_a^b f(x)dx$\` | $\\int_a^b f(x)dx$ |
| Somme | \`$\\sum_{i=1}^{n}$\` | $\\sum_{i=1}^{n}$ |
| Delta | \`$\\Delta t$\` | $\\Delta t$ |`;
    }

    // Exemples différents selon le mode universel ou non
    if (isUniversal) {
      latex += `

## Exemples de cartes en LANGUE UNIVERSELLE (sans mots)

### ⚠️ RÈGLE ABSOLUE : Aucun mot dans les questions

### Opération simple
\`\`\`yaml
- id: "calc_001"
  question: "$4 + 5 = ?$"
  type: numeric
  answer: 9
\`\`\`

### Fraction
\`\`\`yaml
- id: "frac_001"
  question: "$\\frac{2}{3} + \\frac{1}{6} = ?$"
  type: numeric
  answer: 0.833
  tolerance: 0.01
  alternatives:
    - "5/6"
  feedback: "$\\frac{2}{3} = \\frac{4}{6}$ → $\\frac{4}{6} + \\frac{1}{6} = \\frac{5}{6}$"
\`\`\`

### Équation avec préambule de variable
\`\`\`yaml
- id: "eq_001"
  question: "$2x + 3 = 9$, $x = ?$"
  type: numeric
  answer: 3
  feedback: "$2x = 6$ → $x = 3$"
\`\`\`

### Équation quadratique (deux solutions)
\`\`\`yaml
- id: "eq_002"
  question: "$x^2 - 5x + 6 = 0$, $x = ?$"
  type: text
  answer: "2, 3"
  alternatives:
    - "3, 2"
    - "2 et 3"
    - "{2, 3}"
  feedback: "$(x-2)(x-3) = 0$"
\`\`\`

### Racine carrée
\`\`\`yaml
- id: "sqrt_001"
  question: "$\\sqrt{144} = ?$"
  type: numeric
  answer: 12
\`\`\`

### Puissance
\`\`\`yaml
- id: "pow_001"
  question: "$2^5 = ?$"
  type: numeric
  answer: 32
\`\`\``;
    } else {
      latex += `

## Exemples de cartes avec LaTeX

### Carte mathématique
\`\`\`yaml
- id: "math_frac_001"
  question: "Calculer : $\\frac{2}{3} + \\frac{1}{6}$"
  type: "text"
  answer: "$\\frac{5}{6}$"
  alternatives:
    - "5/6"
    - "0,833"
  hint: "Mettre au même dénominateur"
  feedback: "$\\frac{2}{3} = \\frac{4}{6}$, donc $\\frac{4}{6} + \\frac{1}{6} = \\frac{5}{6}$"
\`\`\`

### Carte équation
\`\`\`yaml
- id: "math_eq_001"
  question: |
    Résoudre :
    $$x^2 - 5x + 6 = 0$$
  type: "text"
  answer: "$x = 2$ ou $x = 3$"
  alternatives:
    - "2 et 3"
    - "x=2, x=3"
    - "{2, 3}"
  feedback: "Factorisation : $(x-2)(x-3) = 0$"
\`\`\``;
    }

    if (isScience) {
      latex += `

### Carte chimie
\`\`\`yaml
- id: "chem_001"
  question: "Équilibrer : $H_2 + O_2 \\rightarrow H_2O$"
  type: "text"
  answer: "$2H_2 + O_2 \\rightarrow 2H_2O$"
  alternatives:
    - "2H2 + O2 → 2H2O"
  feedback: "Conservation des atomes : 4 H et 2 O de chaque côté"
\`\`\``;
    }

    latex += `

## Règles importantes
1. **Cohérence** : Si la question utilise LaTeX, la réponse et les alternatives doivent aussi l'utiliser
2. **Alternatives simples** : Toujours prévoir une alternative en notation simple (ex: "5/6" en plus de "$\\frac{5}{6}$")
3. **Lisibilité** : Pour les expressions complexes, utiliser le mode bloc (\`$$...$$\`)
4. **Échappement** : Dans YAML, les backslashes doivent parfois être doublés (\`\\\\frac\` au lieu de \`\\frac\`)`;

    return latex;
  },

  /**
   * Section: Document source (mode anti-hallucination)
   */
  _generateSourceDocumentSection(formData) {
    if (!formData.sourceDocument) return '';

    return `# 📄 MODE SOURCE FOURNIE (ANTI-HALLUCINATION)

⚠️ **RÈGLE ABSOLUE** : Tu DOIS créer les cartes UNIQUEMENT à partir du document fourni ci-dessous.

## Contraintes strictes
- **Extraction pure** : Chaque carte doit être directement dérivée du texte source
- **Aucune invention** : N'ajoute AUCUNE information qui n'est pas explicitement dans le document
- **Citation fidèle** : Les réponses doivent correspondre exactement aux termes utilisés dans le document
- **Si le document ne contient pas assez de contenu** : Crée moins de cartes mais garde une qualité irréprochable

## Document source à utiliser

\`\`\`
${formData.sourceDocument}
\`\`\`

---

En te basant **EXCLUSIVEMENT** sur ce document, génère les flashcards demandées.`;
  },

  /**
   * Section: Guidance spécifique au domaine
   */
  _generateDomainGuidanceSection(formData, template) {
    if (template.name === 'Général' && template.questionPatterns.length === 0) {
      return '';
    }

    let guidance = `# GUIDANCE SPÉCIFIQUE AU DOMAINE : ${template.name}

## Niveau de risque d'hallucination
- **Risque estimé** : ${template.hallucinationRisk === 'high' ? '🔴 ÉLEVÉ - Prudence maximale requise' : template.hallucinationRisk === 'medium' ? '🟡 MOYEN - Vérification importante' : '🟢 FAIBLE - Contenu généralement vérifiable'}

## Format de réponse recommandé
${template.responseFormat}`;

    if (template.questionPatterns && template.questionPatterns.length > 0) {
      guidance += `

## Patterns de questions recommandés
Ces formulations sont adaptées au domaine et minimisent les risques d'erreur :
${template.questionPatterns.map(p => `- "${p}"`).join('\n')}`;
    }

    if (template.avoidPatterns && template.avoidPatterns.length > 0) {
      guidance += `

## ⚠️ Patterns à ÉVITER
Ces types de questions présentent un risque élevé d'erreur ou d'hallucination :
${template.avoidPatterns.map(p => `- ❌ "${p}"`).join('\n')}`;
    }

    return guidance;
  },

  /**
   * Section: Exemples de cartes BONS vs MAUVAIS
   * Filtre les exemples en fonction des types de cartes demandés
   */
  _generateCardExamplesSection(formData) {
    const requestedTypes = formData.questionTypes || ['text'];

    let section = `# EXEMPLES DE CARTES (À SUIVRE / À ÉVITER)

## ✅ BONNES cartes - À imiter`;

    // Exemples BONS - filtrés par type demandé
    if (requestedTypes.includes('text') || requestedTypes.includes('cloze')) {
      section += `

### Exemple texte (avec alternatives)
\`\`\`yaml
${this.CARD_EXAMPLES.good.text}
\`\`\``;
    }

    if (requestedTypes.includes('numeric')) {
      section += `

### Exemple numérique
\`\`\`yaml
${this.CARD_EXAMPLES.good.numeric}
\`\`\``;
    }

    if (requestedTypes.includes('mcq')) {
      section += `

### Exemple QCM
\`\`\`yaml
${this.CARD_EXAMPLES.good.mcq}
\`\`\``;
    }

    if (requestedTypes.includes('boolean') || requestedTypes.includes('truefalse')) {
      section += `

### Exemple Vrai/Faux
\`\`\`yaml
${this.CARD_EXAMPLES.good.truefalse}
\`\`\``;
    }

    if (requestedTypes.includes('cloze')) {
      section += `

### Exemple Texte à trous (Cloze)
\`\`\`yaml
${this.CARD_EXAMPLES.good.cloze}
\`\`\``;
    }

    if (requestedTypes.includes('matching')) {
      section += `

### Exemple Association (Matching)
\`\`\`yaml
${this.CARD_EXAMPLES.good.matching}
\`\`\``;
    }

    section += `

---

## ❌ MAUVAISES cartes - À NE PAS faire`;

    // Exemples MAUVAIS - filtrés par type demandé
    if (requestedTypes.includes('text')) {
      section += `

### Erreurs courantes texte
\`\`\`yaml
${this.CARD_EXAMPLES.bad.text}
\`\`\``;
    }

    if (requestedTypes.includes('numeric')) {
      section += `

### Erreurs courantes numérique
\`\`\`yaml
${this.CARD_EXAMPLES.bad.numeric}
\`\`\``;
    }

    if (requestedTypes.includes('mcq')) {
      section += `

### Erreurs courantes QCM
\`\`\`yaml
${this.CARD_EXAMPLES.bad.mcq}
\`\`\``;
    }

    if (requestedTypes.includes('cloze')) {
      section += `

### Erreurs courantes Cloze
\`\`\`yaml
${this.CARD_EXAMPLES.bad.cloze}
\`\`\``;
    }

    if (requestedTypes.includes('matching')) {
      section += `

### Erreurs courantes Matching
\`\`\`yaml
${this.CARD_EXAMPLES.bad.matching}
\`\`\``;
    }

    // Règles critiques - adaptées aux types demandés
    section += `

---

## Règles CRITIQUES à retenir`;

    const rules = [];

    // Règles générales toujours incluses
    rules.push('**Réponses de 1-3 mots MAX** - Jamais de phrases complètes');
    rules.push('**Feedback = explication** - Pas juste répéter la réponse');

    // Règles spécifiques aux types demandés
    if (requestedTypes.includes('text') || requestedTypes.includes('cloze')) {
      rules.push('**TOUJOURS des alternatives** pour les cartes texte (synonymes, abréviations)');
      rules.push('**Ne PAS spécifier type: "text"** - c\'est le défaut');
    }

    if (requestedTypes.includes('mcq')) {
      rules.push('**QCM : answer = ID** (ex: "B"), pas le texte');
      rules.push('**Distracteurs QCM plausibles** - Jamais d\'options absurdes');
    }

    if (requestedTypes.includes('boolean') || requestedTypes.includes('truefalse')) {
      rules.push('**Vrai/Faux : answer = booléen** (`true` ou `false`), pas une chaîne');
    }

    if (requestedTypes.includes('numeric')) {
      rules.push('**Numérique : answer = nombre** sans texte ni unité');
    }

    if (requestedTypes.includes('cloze')) {
      rules.push(`**Cloze - règles STRICTES :**
   - Le mot {{à_compléter}} doit être **intégré naturellement** dans la phrase
   - ❌ JAMAIS de mot isolé entre parenthèses : "({{mot}})"
   - ❌ JAMAIS deux trous côte à côte : "{{mot1}}{{mot2}}"
   - ❌ JAMAIS deux trous dans la même proposition
   - Si plusieurs trous nécessaires, les espacer au **maximum** dans la phrase
   - Le mot à compléter = **1 seul mot** (pas de groupe de mots)`);
    }

    if (requestedTypes.includes('matching')) {
      rules.push('**Matching : utiliser `pairs`** avec `term` et `response`, `answer: "auto"`');
    }

    section += '\n\n' + rules.map((r, i) => `${i + 1}. ${r}`).join('\n');

    return section;
  },

  /**
   * Section: Génération SVG
   */
  _generateSvgSection(formData, template) {
    if (!formData.generateSvg) return '';

    let svg = `# GÉNÉRATION DE SCHÉMAS SVG

## Quand générer un SVG
Pour les cartes où un schéma **SIMPLE** améliorerait significativement la compréhension, générer un SVG inline.`;

    if (template.svgOpportunities && template.svgOpportunities.length > 0) {
      svg += `

## Opportunités SVG pour ce domaine (${template.name})
${template.svgOpportunities.map(o => `- ${o}`).join('\n')}`;
    }

    svg += `

## Contraintes techniques SVG
- **Viewbox** : \`100x100\` (carré) ou \`200x100\` (paysage)
- **Couleurs du thème** :
  - Violet : \`#8b5cf6\` (principal)
  - Vert : \`#22c55e\` (succès)
  - Orange : \`#f97316\` (avertissement)
  - Fond sombre : \`#1e293b\`
  - Texte clair : \`#f8fafc\`
- **Style** : Minimaliste, lignes simples, peu de texte
- **Taille** : < 2KB par SVG
- **Pas de** : Portraits, photos réalistes, scènes complexes

## Format d'intégration
\`\`\`yaml
- id: "card_with_svg"
  question: "Quelle est l'aire d'un triangle de base 6 et hauteur 4 ?"
  type: "numeric"
  answer: 12
  media:
    type: "image"
    format: "svg"
    data: |
      <svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
        <polygon points="10,70 90,70 50,10" fill="none" stroke="#8b5cf6" stroke-width="2"/>
        <text x="50" y="78" text-anchor="middle" font-size="10" fill="#f8fafc">b = 6</text>
        <line x1="50" y1="10" x2="50" y2="70" stroke="#22c55e" stroke-dasharray="4"/>
        <text x="55" y="40" font-size="10" fill="#f8fafc">h = 4</text>
      </svg>
\`\`\`

## Règles de génération
1. **Pertinence** : Le SVG doit aider à comprendre, pas décorer
2. **Simplicité** : Max 10-15 éléments par schéma
3. **Lisibilité** : Texte ≥ 10px, contrastes forts
4. **Optionnel** : Ne pas forcer un SVG si non pertinent`;

    return svg;
  },

  /**
   * Section: Contraintes anti-hallucination
   */
  _generateAntiHallucinationSection(formData, template) {
    const isHighRisk = template.hallucinationRisk === 'high';
    const hasSourceDoc = !!formData.sourceDocument;

    let section = `# 🛡️ CONTRAINTES ANTI-HALLUCINATION

## Principes fondamentaux
${hasSourceDoc ? '✅ **Mode source fournie activé** - Risque d\'hallucination minimisé' : '⚠️ **Mode génération libre** - Vigilance requise'}

### Règle d'or
> **Si tu n'es pas SÛR à 100% d'une information, NE L'INCLUS PAS.**

## Types de contenu à risque

### 🔴 Risque ÉLEVÉ - À éviter sauf source vérifiable
- Dates précises (surtout pour événements mineurs)
- Citations directes de personnes
- Statistiques et chiffres précis
- Noms de personnes peu connues
- Affirmations absolues ("toujours", "jamais", "tous")

### 🟡 Risque MOYEN - Vérification requise
- Dates de grands événements historiques
- Définitions techniques
- Listes exhaustives

### 🟢 Risque FAIBLE - Généralement fiable
- Formules mathématiques standards
- Vocabulaire courant (traductions)
- Définitions de base
- Faits scientifiques consensuels`;

    if (isHighRisk) {
      section += `

## ⚠️ ALERTE DOMAINE À RISQUE : ${template.name}

Ce domaine (${template.name}) présente un **risque élevé d'hallucination**.

### Mesures obligatoires
1. **Préférer les questions conceptuelles** aux questions de dates/noms précis
2. **Éviter les chiffres contestés** (victimes, populations historiques)
3. **Ne pas inventer de citations**
4. **Utiliser des formulations prudentes** ("principalement", "notamment")`;
    }

    section += `

## Stratégie de secours
Si tu ne peux pas vérifier une information :
1. **Reformule** la question pour éviter le détail incertain
2. **Remplace** par une question plus générale mais fiable
3. **Supprime** la carte si aucune alternative n'est viable

## Auto-évaluation requise
Pour chaque carte générée, évalue mentalement :
- Confiance dans l'exactitude : 🟢 Sûr / 🟡 Probable / 🔴 Incertain
- **Ne garde que les cartes 🟢**`;

    return section;
  },

  /**
   * Section: Qualité et exactitude
   */
  _generateQualitySection(formData) {
    let quality = `# CRITÈRES DE QUALITÉ

## Exactitude factuelle
- ⚠️ **CRITIQUE** : Toutes les informations doivent être vérifiées et exactes
- Utiliser uniquement des faits établis et consensuels
- En cas de doute sur une information, NE PAS l'inclure`;

    if (formData.sourcesToUse) {
      quality += `\n- **Sources de référence** :\n${formData.sourcesToUse.split('\n').map(s => `  - ${s.trim()}`).join('\n')}`;
    }

    quality += `

## Clarté et précision
- Questions non ambiguës avec une seule interprétation possible
- Réponses précises et sans équivoque
- Vocabulaire adapté au niveau cible
- Éviter les questions pièges ou trompeuses

## Bonnes pratiques ESSENTIELLES pour les flashcards

### 1. Réponses courtes et alternatives (CRITIQUE)
- **Réponses très courtes** : Privilégier des réponses de 1-3 mots maximum
- **TOUJOURS prévoir des alternatives** dans le champ \`alternatives\` :
  - Synonymes : "révolution" → ["révolte", "soulèvement"]
  - Abréviations : "Organisation des Nations Unies" → ["ONU", "UN"]
  - Orthographes variantes : "clé" → ["clef"]
  - Avec/sans article : "le soleil" → ["soleil"]
  - Singulier/pluriel si pertinent

### 2. Format technique optimal
- **Ne pas spécifier type: "text"** - c'est la valeur par défaut, inutile de l'écrire
- **Réponses numériques** : Utiliser \`type: "numeric"\` pour éviter les problèmes de format (espaces, virgules)
- **QCM** : Les choix doivent avoir des IDs courts (A, B, C, D) et le champ answer contient l'ID

### 3. Feedback pédagogique
- **Expliquer le "pourquoi"** : Le feedback doit aider à comprendre, pas juste donner la réponse
- **Contextualiser** : Liens avec d'autres connaissances du deck
- **Indices progressifs** : Le hint guide sans donner la réponse

## Diversité
- Varier les formulations et angles d'approche
- Couvrir l'ensemble des sous-thèmes de manière équilibrée
- Éviter les répétitions et les questions trop similaires`;

    if (formData.contentToAvoid) {
      quality += `\n\n## Contenu à éviter\n${formData.contentToAvoid.split('\n').map(s => `- ${s.trim()}`).join('\n')}`;
    }

    if (formData.additionalInstructions) {
      quality += `\n\n## Instructions spéciales\n${formData.additionalInstructions}`;
    }

    return quality;
  },

  /**
   * Section: Auto-vérification avec Chain-of-Verification (CoVe)
   * Technique anti-hallucination qui force le LLM à vérifier ses propres réponses
   */
  _generateVerificationSection(formData) {
    const { niveaux } = this._extractCategoryInfo(formData);
    const niveauLabel = niveaux.length > 0
      ? niveaux[niveaux.length - 1].label
      : 'le public cible';

    return `# CHAIN-OF-VERIFICATION (CoVe) - OBLIGATOIRE

⚠️ **PROCESSUS DE VÉRIFICATION EN 3 ÉTAPES** - À effectuer pour CHAQUE carte générée :

## ÉTAPE 1 : Génération initiale
Génère d'abord le brouillon de toutes les cartes.

## ÉTAPE 2 : Auto-vérification carte par carte (CRITIQUE)

Pour **CHAQUE carte QCM**, effectuer cette vérification explicite :
\`\`\`
VÉRIFICATION QCM carte [ID]:
Question: "[relire la question]"
Choix A: "[texte]" → [CORRECT/INCORRECT car...]
Choix B: "[texte]" → [CORRECT/INCORRECT car...]
Choix C: "[texte]" → [CORRECT/INCORRECT car...]
Choix D: "[texte]" → [CORRECT/INCORRECT car...]
→ Réponse correcte: [lettre] car [justification]
→ Le champ answer contient bien: "[lettre]" ✓ ou ✗
\`\`\`

Pour **CHAQUE carte texte**, vérifier :
\`\`\`
VÉRIFICATION carte [ID]:
Question: "[relire]"
Réponse attendue: "[answer]"
→ Cette réponse répond-elle EXACTEMENT à la question ? [OUI/NON]
→ Le feedback est-il cohérent avec la réponse ? [OUI/NON]
\`\`\`

Pour **CHAQUE carte cloze**, vérification STRICTE :
\`\`\`
VÉRIFICATION CLOZE carte [ID]:
Phrase complète: "[question avec {{mot}}]"
→ La phrase est-elle une AFFIRMATION (pas de "?") ? [OUI/NON]
   ❌ Phrase interrogative "Quel {{mot}} ... ?" = ERREUR
→ Le {{mot}} est-il INTÉGRÉ naturellement dans la phrase ? [OUI/NON]
   ❌ Mot isolé entre parenthèses "({{mot}})" = NON
   ❌ Mot en fin de phrase explicative "... appelé {{mot}}." = NON
→ Y a-t-il des trous côte à côte "{{a}}{{b}}" ? [OUI = ERREUR]
→ Si plusieurs trous, sont-ils espacés d'au moins 5 mots ? [OUI/NON]
→ Le mot {{entre_accolades}} = \`answer\` ? [OUI/NON]
\`\`\`

### Vérifications obligatoires :
1. **Cohérence Question ↔ Réponse** : Relire la question et vérifier que la réponse y répond
2. **Cohérence Réponse ↔ Feedback** : Le feedback doit confirmer/expliquer la réponse
3. **QCM : ID correct** : Vérifier que \`answer\` contient la LETTRE (A/B/C/D), pas le texte
4. **Vrai/Faux** : Vérifier que \`answer: true\` ou \`answer: false\` est correct

### Erreurs fréquentes à détecter :
❌ QCM avec \`answer: "Le texte de la réponse"\` au lieu de \`answer: "B"\`
❌ Réponse qui ne correspond pas à la question posée
❌ Feedback qui contredit la réponse marquée comme correcte
❌ Carte cloze où \`answer\` ne correspond pas au mot entre {{accolades}}
❌ Carte cloze dans une phrase interrogative (contient "?")
❌ Carte cloze avec mot isolé entre parenthèses : "({{mot}})"
❌ Carte cloze avec trous côte à côte : "{{a}}{{b}}"
❌ Carte cloze avec plusieurs trous trop proches (< 5 mots)

## ÉTAPE 3 : Correction et validation finale

### Checklist technique :
- [ ] Format ${formData.outputFormat.toUpperCase()} valide
- [ ] IDs uniques
- [ ] Champ \`type\` non spécifié pour cartes texte (défaut)
- [ ] Alternatives présentes pour cartes texte/cloze
- [ ] Niveau adapté pour ${niveauLabel}

### Checklist pédagogique :
- [ ] ${formData.cardCount ? `${formData.cardCount} cartes couvrent` : 'Les cartes couvrent'} tous les objectifs
- [ ] Réponses courtes (1-3 mots)
- [ ] Diversité des questions

**⚠️ Si une incohérence est détectée, CORRIGER immédiatement avant de continuer.**

## Rapport de vérification (à fournir)

Après vérification complète, fournir :
\`\`\`
═══ RAPPORT DE VÉRIFICATION CoVe ═══
Cartes créées: X${formData.cardCount ? '/' + formData.cardCount : ''}
Cartes QCM vérifiées: Y (toutes les réponses ID confirmées)
Cartes texte vérifiées: Z (cohérence question↔réponse)
Cartes cloze vérifiées: W (intégration naturelle {{mot}})
Corrections effectuées: [liste si applicable]
Statut: ✅ VALIDÉ / ⚠️ POINTS D'ATTENTION
═══════════════════════════════════════
\`\`\``;
  },

  /**
   * Section: Instructions de sortie
   */
  _generateOutputSection(formData) {
    return `# INSTRUCTIONS DE SORTIE

1. **D'abord**, effectuer toutes les vérifications ci-dessus
2. **Ensuite**, fournir le rapport de vérification
3. **Enfin**, fournir le deck complet au format ${formData.outputFormat.toUpperCase()}

Le deck doit être complet, prêt à l'emploi, et ne nécessiter aucune modification manuelle.

---

**Génère maintenant ${formData.cardCount ? `le deck de ${formData.cardCount} flashcards` : 'un deck complet de flashcards (nombre optimal pour le sujet)'} sur "${formData.topic}" en respectant toutes les spécifications ci-dessus.**`;
  },

  // ═══════════════════════════════════════════════════════════════
  // UTILITAIRES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Valide les données du formulaire
   *
   * @param {Object} formData - Données du formulaire
   * @returns {Object} - { valid: boolean, errors: string[] }
   */
  validateFormData(formData) {
    const errors = [];

    // Vérifier les champs requis
    Object.entries(this.FORM_FIELDS).forEach(([key, field]) => {
      if (field.required) {
        const value = formData[key];
        if (value === undefined || value === null || value === '' ||
            (Array.isArray(value) && value.length === 0)) {
          errors.push(`Le champ "${field.label}" est requis`);
        }
      }
    });

    // Vérifier les groupes requis pour les tags (Matières et Niveaux)
    const categoryField = this.FORM_FIELDS.category;
    if (categoryField.requiredGroups && formData.category && Array.isArray(formData.category)) {
      const selectedTags = formData.category;

      // Vérifier que chaque groupe requis a au moins un tag sélectionné
      if (typeof Tags !== 'undefined') {
        const hasMatiere = selectedTags.some(tagId => {
          const tag = Tags.getById(tagId);
          return tag && tag.group === 'Matières';
        });
        const hasNiveau = selectedTags.some(tagId => {
          const tag = Tags.getById(tagId);
          return tag && tag.group === 'Niveaux';
        });

        if (!hasMatiere) {
          errors.push('Sélectionnez au moins une matière (Sciences, Langues, etc.)');
        }
        if (!hasNiveau) {
          errors.push('Sélectionnez au moins un niveau (Primaire, Collège, etc.)');
        }
      }
    }

    // Vérifier le nombre de cartes (seulement si spécifié)
    if (formData.cardCount !== '' && formData.cardCount !== null && formData.cardCount !== undefined) {
      const count = parseInt(formData.cardCount, 10);
      if (isNaN(count) || count < 5 || count > 100) {
        errors.push('Le nombre de cartes doit être entre 5 et 100 (ou laissez vide)');
      }
    }

    // Vérifier qu'au moins un type de question est sélectionné
    if (!formData.questionTypes || formData.questionTypes.length === 0) {
      errors.push('Sélectionnez au moins un type de question');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  /**
   * Obtient les valeurs par défaut du formulaire
   *
   * @returns {Object} - Données par défaut
   */
  getDefaultFormData() {
    const defaults = {};

    Object.entries(this.FORM_FIELDS).forEach(([key, field]) => {
      if (field.value !== undefined) {
        defaults[key] = field.value;
      } else if (field.type === 'multiselect') {
        defaults[key] = ['text'];
      } else if (field.type === 'select' && field.options?.length > 0) {
        defaults[key] = field.options[0].value;
      } else if (field.type === 'checkbox') {
        defaults[key] = false;
      } else {
        defaults[key] = '';
      }
    });

    // Valeurs par défaut spécifiques
    defaults.questionTypes = ['text', 'mcq'];
    defaults.category = [];  // Tags sélectionnés (matière + niveau requis)
    defaults.difficulty = '';  // Laisser le LLM décider
    defaults.learningApproach = '';  // Laisser le LLM décider
    defaults.language = 'fr';
    defaults.outputFormat = 'yaml';
    defaults.includeHints = true;
    defaults.includeFeedback = true;
    defaults.includeCommonMistakes = true;
    defaults.includeRealWorldExamples = true;

    return defaults;
  },

  // ═══════════════════════════════════════════════════════════════
  // VALIDATION POST-GÉNÉRATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Critères de qualité pour le scoring des cartes
   */
  QUALITY_CRITERIA: {
    // Critères obligatoires (0 ou 1)
    hasValidFormat: { weight: 1, required: true, desc: 'Format valide' },
    hasShortAnswer: { weight: 1, required: true, desc: 'Réponse courte (≤ 3 mots)' },

    // Critères de qualité (0 à 1)
    hasAlternatives: { weight: 0.8, desc: 'Alternatives fournies (texte)' },
    hasFeedback: { weight: 0.6, desc: 'Feedback pédagogique' },
    hasHint: { weight: 0.4, desc: 'Indice disponible' },
    hasMedia: { weight: 0.3, desc: 'Média pertinent' },
    noHallucinationRisk: { weight: 1.0, desc: 'Pas de risque d\'hallucination' },
    mcqValidFormat: { weight: 0.8, desc: 'QCM format correct' }
  },

  /**
   * Valide une carte et retourne un score de qualité
   *
   * @param {Object} card - La carte à valider
   * @returns {Object} - { score, issues, warnings, isValid }
   */
  validateCard(card) {
    const issues = [];      // Problèmes bloquants
    const warnings = [];    // Avertissements
    let score = 0;
    let maxScore = 0;

    // 1. Vérification format obligatoire
    if (!card.question || String(card.question).trim() === '') {
      issues.push('Question manquante');
    }
    if (card.answer === undefined || card.answer === null || String(card.answer).trim() === '') {
      issues.push('Réponse manquante');
    }

    // 2. Vérification longueur réponse
    const answerWords = String(card.answer || '').trim().split(/\s+/).length;
    const isShortAnswer = answerWords <= 5;
    if (!isShortAnswer) {
      warnings.push(`Réponse trop longue (${answerWords} mots, max 3-5 recommandé)`);
    }
    maxScore += this.QUALITY_CRITERIA.hasShortAnswer.weight;
    if (isShortAnswer) score += this.QUALITY_CRITERIA.hasShortAnswer.weight;

    // 3. Vérification alternatives (pour type texte uniquement)
    const isTextType = !card.type || card.type === 'text';
    if (isTextType) {
      const hasAlternatives = card.alternatives && Array.isArray(card.alternatives) && card.alternatives.length > 0;
      maxScore += this.QUALITY_CRITERIA.hasAlternatives.weight;
      if (hasAlternatives) {
        score += this.QUALITY_CRITERIA.hasAlternatives.weight;
      } else {
        warnings.push('Alternatives manquantes (synonymes, abréviations)');
      }
    }

    // 4. Vérification feedback
    maxScore += this.QUALITY_CRITERIA.hasFeedback.weight;
    if (card.feedback && String(card.feedback).trim().length > 10) {
      score += this.QUALITY_CRITERIA.hasFeedback.weight;
    }

    // 5. Vérification hint
    maxScore += this.QUALITY_CRITERIA.hasHint.weight;
    if (card.hint && String(card.hint).trim().length > 0) {
      score += this.QUALITY_CRITERIA.hasHint.weight;
    }

    // 6. Vérification média
    maxScore += this.QUALITY_CRITERIA.hasMedia.weight;
    if (card.media || card.mediaSuggestion) {
      score += this.QUALITY_CRITERIA.hasMedia.weight;
    }

    // 7. Vérification risque hallucination
    const hallucinationRisk = this.assessHallucinationRisk(card);
    maxScore += this.QUALITY_CRITERIA.noHallucinationRisk.weight;
    if (hallucinationRisk.risk < 0.3) {
      score += this.QUALITY_CRITERIA.noHallucinationRisk.weight;
    } else if (hallucinationRisk.risk < 0.6) {
      score += this.QUALITY_CRITERIA.noHallucinationRisk.weight * 0.5;
      warnings.push(`Risque d'hallucination modéré: ${hallucinationRisk.reasons.join(', ')}`);
    } else {
      warnings.push(`⚠️ Risque d'hallucination élevé: ${hallucinationRisk.reasons.join(', ')}`);
    }

    // 8. Vérification format QCM
    if (card.type === 'mcq') {
      maxScore += this.QUALITY_CRITERIA.mcqValidFormat.weight;
      const mcqIssues = this._validateMcqFormat(card);
      if (mcqIssues.length === 0) {
        score += this.QUALITY_CRITERIA.mcqValidFormat.weight;
      } else {
        issues.push(...mcqIssues);
      }
    }

    // 9. Vérification type "text" explicite (anti-pattern)
    if (card.type === 'text') {
      warnings.push('Type "text" explicite inutile (c\'est le défaut)');
    }

    // Calcul score final
    const finalScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

    return {
      score: finalScore,
      issues,
      warnings,
      isValid: issues.length === 0,
      hallucinationRisk: hallucinationRisk.risk
    };
  },

  /**
   * Valide le format d'une carte QCM
   */
  _validateMcqFormat(card) {
    const issues = [];

    if (!card.choices || !Array.isArray(card.choices) || card.choices.length < 2) {
      issues.push('QCM: Au moins 2 choix requis');
      return issues;
    }

    // Vérifier que chaque choix a un ID
    const missingIds = card.choices.filter(c => !c.id).length;
    if (missingIds > 0) {
      issues.push(`QCM: ${missingIds} choix sans ID`);
    }

    // Vérifier que answer est un ID valide
    const answer = String(card.answer || '');
    const answerIds = answer.split(',').map(s => s.trim());
    const choiceIds = card.choices.map(c => c.id);

    const invalidAnswers = answerIds.filter(id => !choiceIds.includes(id));
    if (invalidAnswers.length > 0) {
      issues.push(`QCM: answer "${answer}" ne correspond pas aux IDs des choix (${choiceIds.join(', ')})`);
    }

    // Vérifier que answer n'est pas le texte d'un choix
    const choiceTexts = card.choices.map(c => c.text?.toLowerCase());
    if (choiceTexts.includes(answer.toLowerCase())) {
      issues.push('QCM: answer doit être l\'ID (ex: "A"), pas le texte du choix');
    }

    return issues;
  },

  /**
   * Évalue le risque d'hallucination d'une carte
   *
   * @param {Object} card - La carte à évaluer
   * @returns {Object} - { risk: 0-1, reasons: string[] }
   */
  assessHallucinationRisk(card) {
    let risk = 0;
    const reasons = [];
    const text = `${card.question || ''} ${card.answer || ''}`;

    for (const { pattern, risk: patternRisk, desc } of this.HALLUCINATION_PATTERNS) {
      if (pattern.test(text)) {
        risk += patternRisk;
        reasons.push(desc);
      }
    }

    return {
      risk: Math.min(risk, 1),
      reasons
    };
  },

  /**
   * Valide un deck complet et retourne un rapport
   *
   * @param {Object} deck - Le deck à valider
   * @returns {Object} - Rapport de validation détaillé
   */
  validateDeck(deck) {
    const cardResults = [];
    let totalScore = 0;
    let validCards = 0;
    let cardsWithWarnings = 0;
    let cardsWithIssues = 0;
    let highRiskCards = 0;

    for (const card of (deck.cards || [])) {
      const result = this.validateCard(card);
      cardResults.push({
        cardId: card.id,
        ...result
      });

      totalScore += result.score;
      if (result.isValid) validCards++;
      if (result.warnings.length > 0) cardsWithWarnings++;
      if (result.issues.length > 0) cardsWithIssues++;
      if (result.hallucinationRisk >= 0.5) highRiskCards++;
    }

    const cardCount = deck.cards?.length || 0;
    const averageScore = cardCount > 0 ? Math.round(totalScore / cardCount) : 0;

    // Vérifications niveau deck
    const deckIssues = [];
    if (!deck.id && !deck.name) {
      deckIssues.push('Le deck doit avoir un ID ou un nom');
    }
    if (cardCount === 0) {
      deckIssues.push('Le deck ne contient aucune carte');
    }

    // IDs uniques
    const ids = deck.cards?.map(c => c.id) || [];
    const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (duplicateIds.length > 0) {
      deckIssues.push(`IDs dupliqués: ${[...new Set(duplicateIds)].join(', ')}`);
    }

    return {
      isValid: deckIssues.length === 0 && cardsWithIssues === 0,
      averageScore,
      deckIssues,
      stats: {
        totalCards: cardCount,
        validCards,
        cardsWithWarnings,
        cardsWithIssues,
        highRiskCards
      },
      cardResults
    };
  },

  /**
   * Génère des suggestions d'amélioration pour une carte
   *
   * @param {Object} card - La carte à améliorer
   * @returns {string[]} - Liste de suggestions
   */
  getSuggestions(card) {
    const suggestions = [];
    const validation = this.validateCard(card);

    if (!card.alternatives && (!card.type || card.type === 'text')) {
      suggestions.push(`💡 Ajoutez des alternatives: ["${card.answer}", "variante1", "abréviation"]`);
    }

    if (!card.feedback) {
      suggestions.push('💡 Ajoutez un feedback pédagogique pour expliquer la réponse');
    }

    if (validation.hallucinationRisk >= 0.3) {
      suggestions.push('⚠️ Vérifiez l\'exactitude des informations (dates, chiffres)');
    }

    const answerWords = String(card.answer || '').trim().split(/\s+/).length;
    if (answerWords > 3) {
      suggestions.push(`💡 Raccourcissez la réponse (${answerWords} mots → 1-3 mots)`);
    }

    if (card.type === 'text') {
      suggestions.push('💡 Supprimez type: "text" (c\'est le défaut)');
    }

    return suggestions;
  }
};

// Export pour tests Node.js
if (typeof module !== 'undefined') {
  module.exports = PromptGenerator;
}
