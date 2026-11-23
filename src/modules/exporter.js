/**
 * Module Exporter - Export de decks vers différents formats
 *
 * Supporte l'export vers :
 * - JSON (format natif de l'application)
 * - Moodle XML (compatible avec Moodle)
 * - YAML (format source lisible)
 */

const Exporter = {
  /**
   * Champs de contenu d'une carte écrits à l'export (types.js : Card, plus les champs propres aux types
   * de carte). id, question, answer et type sont écrits à part. Les champs de progression (box,
   * latencyThreshold, bestResponseTimeMs, lastResponseTimeMs, responseTimeHistory, restUntil, restDays,
   * timesPlayed, timesCorrect) ne font pas partie de l'export d'un deck : liste blanche, pas liste noire.
   */
  _CARD_CONTENT_FIELDS: [
    'alternatives', 'hint', 'feedback', 'feedbackCorrect', 'feedbackIncorrect',
    'choices', 'options', 'pairs', 'blanks', 'tolerance', 'acceptedAnswers',
    'media', 'mediaSuggestion', 'imageUrl', 'audioUrl',
    'points', 'penalty', 'tags', 'xpOverride'
  ],

  /** Réglages de deck (types.js : DeckSettings) écrits à l'export ; sequential et bidirectional toujours */
  _DECK_SETTING_FIELDS: ['maxCards', 'similarityMatching', 'similarityThreshold'],

  /** Licence d'un enregistrement dont la licence est inconnue (même valeur que LinguaLibre.UNKNOWN_LICENSE) */
  _UNKNOWN_LICENSE: 'Unknown',

  /**
   * Exporte un deck au format JSON
   *
   * @param {Object} deck - Deck à exporter
   * @param {boolean} includeProgress - Inclure la progression (défaut: false)
   * @returns {string} - JSON formaté
   */
  toJSON(deck, includeProgress = false) {
    // Détecter si c'est un deck multilingue
    if (deck.type === 'multilingual' && deck.words) {
      return this._multilingualToJSON(deck, includeProgress);
    }

    const exportDeck = {
      id: deck.id,
      name: deck.name,
      description: deck.description,
      category: deck.category,
      difficulty: deck.difficulty,
      language: deck.language || 'fr',
      settings: deck.settings,
      ...(deck.tags && deck.tags.length > 0 && { tags: deck.tags }),
      ...(this._hasMetadata(deck) && { metadata: deck.metadata }),
      exportedAt: new Date().toISOString(),
      cards: (deck.cards || []).map(card => {
        const exportCard = {
          id: card.id,
          question: card.question,
          answer: card.answer,
          type: card.type || 'text'
        };

        // Tous les champs de contenu présents (voir _CARD_CONTENT_FIELDS)
        for (const field of this._CARD_CONTENT_FIELDS) {
          if (card[field] !== undefined && card[field] !== null) exportCard[field] = card[field];
        }

        // Attribution d'un enregistrement audio (licence et auteur à conserver quand le deck est partagé)
        if (card.media && typeof card.media === 'object' && card.media.type === 'audio') {
          exportCard.mediaLicense = card.media.license || this._UNKNOWN_LICENSE;
          if (card.media.artist) exportCard.mediaArtist = card.media.artist;
          if (card.media.sourceUrl) exportCard.mediaSourceUrl = card.media.sourceUrl;
        }

        // Inclure la progression si demandé
        if (includeProgress) {
          exportCard.box = card.box;
          exportCard.latencyThreshold = card.latencyThreshold;
          exportCard.bestResponseTimeMs = card.bestResponseTimeMs;
          exportCard.lastResponseTimeMs = card.lastResponseTimeMs;
          exportCard.restUntil = card.restUntil;
          exportCard.timesPlayed = card.timesPlayed;
          exportCard.timesCorrect = card.timesCorrect;
        }

        return exportCard;
      })
    };

    return JSON.stringify(exportDeck, null, 2);
  },

  /**
   * Exporte un deck multilingue au format JSON
   * @private
   */
  _multilingualToJSON(deck, includeProgress = false) {
    const exportDeck = {
      id: deck.id,
      name: deck.name,
      type: 'multilingual',
      description: deck.description,
      languages: deck.languages,
      difficulty: deck.difficulty,
      settings: deck.settings,
      source: deck.source,
      sourceList: deck.sourceList,
      ...(this._hasMetadata(deck) && { metadata: deck.metadata }),
      exportedAt: new Date().toISOString(),
      words: (deck.words || []).map(word => {
        const exportWord = {
          id: word.id,
          translations: {}
        };

        for (const [lang, translation] of Object.entries(word.translations || {})) {
          exportWord.translations[lang] = {
            text: translation.text,
            alternatives: translation.alternatives
          };

          // Inclure les audios (sans les données base64 pour réduire la taille)
          if (translation.audio) {
            exportWord.translations[lang].hasAudio = true;
            // Attribution : licence (« Unknown » si inconnue, jamais présumée), auteur et page source
            exportWord.translations[lang].audioLicense = translation.audio.license || this._UNKNOWN_LICENSE;
            if (translation.audio.artist) {
              exportWord.translations[lang].audioArtist = translation.audio.artist;
            }
            if (translation.audio.sourceUrl) {
              exportWord.translations[lang].audioSourceUrl = translation.audio.sourceUrl;
            }
          }
        }

        // Inclure la progression si demandé
        if (includeProgress) {
          exportWord.box = word.box;
          exportWord.latencyThreshold = word.latencyThreshold;
          exportWord.restUntil = word.restUntil;
          exportWord.restDays = word.restDays;
          exportWord.timesPlayed = word.timesPlayed;
          exportWord.timesCorrect = word.timesCorrect;
        }

        return exportWord;
      })
    };

    return JSON.stringify(exportDeck, null, 2);
  },

  /**
   * Exporte un deck au format Moodle XML
   *
   * @param {Object} deck - Deck à exporter
   * @returns {string} - XML Moodle formaté
   */
  toMoodleXML(deck) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<quiz>\n';

    // Catégorie du quiz
    xml += '  <question type="category">\n';
    xml += '    <category>\n';
    xml += `      <text>$course$/top/${this._escapeXML(deck.name)}</text>\n`;
    xml += '    </category>\n';
    xml += '  </question>\n\n';

    // Exporter chaque carte
    deck.cards.forEach((card, index) => {
      xml += this._cardToMoodleQuestion(card, index);
    });

    xml += '</quiz>\n';
    return xml;
  },

  /**
   * Convertit une carte en question Moodle XML
   * @private
   */
  _cardToMoodleQuestion(card, index) {
    const type = card.type || 'text';
    const name = card.name || `Question ${index + 1}`;

    switch (type) {
      case 'mcq':
        return this._mcqToMoodle(card, name);
      case 'truefalse':
        return this._trueFalseToMoodle(card, name);
      case 'numeric':
        return this._numericToMoodle(card, name);
      case 'matching':
        return this._matchingToMoodle(card, name);
      case 'cloze':
        return this._clozeToMoodle(card, name);
      case 'text':
      default:
        return this._shortAnswerToMoodle(card, name);
    }
  },

  /**
   * Export MCQ vers Moodle
   * @private
   */
  _mcqToMoodle(card, name) {
    const grade = this._xmlNumber(card.points, 1);
    const penalty = this._xmlNumber(card.penalty, 0) / 100;

    let xml = '  <question type="multichoice">\n';
    xml += `    <name><text>${this._escapeXML(name)}</text></name>\n`;
    xml += `    <questiontext format="html">\n`;
    xml += `      <text>${this._cdata(card.question)}</text>\n`;
    xml += '    </questiontext>\n';
    xml += `    <defaultgrade>${grade}</defaultgrade>\n`;
    xml += `    <penalty>${penalty}</penalty>\n`;
    xml += '    <single>true</single>\n';
    xml += '    <shuffleanswers>true</shuffleanswers>\n';
    xml += this._feedbackToMoodleXML(card);

    const correctAnswers = card.answer.split(',');

    card.choices.forEach(choice => {
      const isCorrect = correctAnswers.includes(choice.id);
      const fraction = isCorrect ? '100' : '0';
      xml += `    <answer fraction="${fraction}" format="html">\n`;
      xml += `      <text>${this._cdata(choice.text)}</text>\n`;
      xml += '    </answer>\n';
    });

    xml += '  </question>\n\n';
    return xml;
  },

  /**
   * Export True/False vers Moodle
   * @private
   */
  _trueFalseToMoodle(card, name) {
    const isTrue = card.answer === 'true';
    const grade = this._xmlNumber(card.points, 1);
    const penalty = this._xmlNumber(card.penalty, 0) / 100;

    let xml = '  <question type="truefalse">\n';
    xml += `    <name><text>${this._escapeXML(name)}</text></name>\n`;
    xml += `    <questiontext format="html">\n`;
    xml += `      <text>${this._cdata(card.question)}</text>\n`;
    xml += '    </questiontext>\n';
    xml += `    <defaultgrade>${grade}</defaultgrade>\n`;
    xml += `    <penalty>${penalty}</penalty>\n`;
    xml += this._feedbackToMoodleXML(card);

    // Réponse Vrai
    xml += `    <answer fraction="${isTrue ? '100' : '0'}" format="html">\n`;
    xml += '      <text>true</text>\n';
    xml += '    </answer>\n';

    // Réponse Faux
    xml += `    <answer fraction="${isTrue ? '0' : '100'}" format="html">\n`;
    xml += '      <text>false</text>\n';
    xml += '    </answer>\n';

    xml += '  </question>\n\n';
    return xml;
  },

  /**
   * Export numérique vers Moodle
   * @private
   */
  _numericToMoodle(card, name) {
    const grade = this._xmlNumber(card.points, 1);
    const penalty = this._xmlNumber(card.penalty, 0) / 100;

    let xml = '  <question type="numerical">\n';
    xml += `    <name><text>${this._escapeXML(name)}</text></name>\n`;
    xml += `    <questiontext format="html">\n`;
    xml += `      <text>${this._cdata(card.question)}</text>\n`;
    xml += '    </questiontext>\n';
    xml += `    <defaultgrade>${grade}</defaultgrade>\n`;
    xml += `    <penalty>${penalty}</penalty>\n`;
    xml += this._feedbackToMoodleXML(card);

    xml += '    <answer fraction="100" format="moodle_auto_format">\n';
    xml += `      <text>${this._escapeXML(card.answer)}</text>\n`;
    xml += `      <tolerance>${this._xmlNumber(card.tolerance, 0)}</tolerance>\n`;
    xml += '    </answer>\n';

    xml += '  </question>\n\n';
    return xml;
  },

  /**
   * Export réponse courte vers Moodle
   * @private
   */
  _shortAnswerToMoodle(card, name) {
    const grade = this._xmlNumber(card.points, 1);
    const penalty = this._xmlNumber(card.penalty, 0) / 100;

    let xml = '  <question type="shortanswer">\n';
    xml += `    <name><text>${this._escapeXML(name)}</text></name>\n`;
    xml += `    <questiontext format="html">\n`;
    xml += `      <text>${this._cdata(card.question)}</text>\n`;
    xml += '    </questiontext>\n';
    xml += `    <defaultgrade>${grade}</defaultgrade>\n`;
    xml += `    <penalty>${penalty}</penalty>\n`;
    xml += '    <usecase>0</usecase>\n';
    xml += this._feedbackToMoodleXML(card);

    // Réponse principale
    xml += '    <answer fraction="100" format="moodle_auto_format">\n';
    xml += `      <text>${this._escapeXML(card.answer)}</text>\n`;
    xml += '    </answer>\n';

    // Réponses alternatives
    if (card.acceptedAnswers) {
      card.acceptedAnswers.forEach(alt => {
        if (alt !== card.answer) {
          xml += '    <answer fraction="100" format="moodle_auto_format">\n';
          xml += `      <text>${this._escapeXML(alt)}</text>\n`;
          xml += '    </answer>\n';
        }
      });
    }

    xml += '  </question>\n\n';
    return xml;
  },

  /**
   * Export matching vers Moodle
   * @private
   */
  _matchingToMoodle(card, name) {
    const grade = this._xmlNumber(card.points, 1);
    const penalty = this._xmlNumber(card.penalty, 0) / 100;

    let xml = '  <question type="matching">\n';
    xml += `    <name><text>${this._escapeXML(name)}</text></name>\n`;
    xml += `    <questiontext format="html">\n`;
    xml += `      <text>${this._cdata(card.question)}</text>\n`;
    xml += '    </questiontext>\n';
    xml += `    <defaultgrade>${grade}</defaultgrade>\n`;
    xml += `    <penalty>${penalty}</penalty>\n`;
    xml += '    <shuffleanswers>true</shuffleanswers>\n';
    xml += this._feedbackToMoodleXML(card);

    if (card.pairs) {
      card.pairs.forEach(pair => {
        xml += '    <subquestion format="html">\n';
        xml += `      <text>${this._cdata(pair.premise)}</text>\n`;
        xml += '      <answer>\n';
        xml += `        <text>${this._escapeXML(pair.response)}</text>\n`;
        xml += '      </answer>\n';
        xml += '    </subquestion>\n';
      });
    }

    xml += '  </question>\n\n';
    return xml;
  },

  /**
   * Export cloze vers Moodle
   * @private
   */
  _clozeToMoodle(card, name) {
    const grade = this._xmlNumber(card.points, 1);
    const penalty = this._xmlNumber(card.penalty, 0) / 100;

    let xml = '  <question type="cloze">\n';
    xml += `    <name><text>${this._escapeXML(name)}</text></name>\n`;
    xml += `    <questiontext format="html">\n`;

    // Reconstruire le texte avec la syntaxe cloze
    let questionText = card.question;
    if (card.blanks) {
      card.blanks.forEach((blank, i) => {
        const placeholder = `{{blank_${i}}}`;
        let clozeText = '';

        if (blank.type === 'mcq' && blank.choices) {
          // Format: {1:MULTICHOICE:=correct~wrong1~wrong2}
          const answers = blank.choices.map(c =>
            c.isCorrect ? `=${c.text}` : c.text
          ).join('~');
          clozeText = `{1:MULTICHOICE:${answers}}`;
        } else if (blank.type === 'numeric') {
          // Format: {1:NUMERICAL:=answer}
          clozeText = `{1:NUMERICAL:=${blank.correctAnswer}}`;
        } else {
          // Format: {1:SHORTANSWER:=answer}
          const answers = blank.acceptedAnswers && blank.acceptedAnswers.length > 1
            ? blank.acceptedAnswers.map(a => `=${a}`).join('~')
            : `=${blank.correctAnswer}`;
          clozeText = `{1:SHORTANSWER:${answers}}`;
        }

        questionText = questionText.replace(placeholder, clozeText);
      });
    }

    xml += `      <text>${this._cdata(questionText)}</text>\n`;
    xml += '    </questiontext>\n';
    xml += '    <defaultgrade>1</defaultgrade>\n';

    xml += '  </question>\n\n';
    return xml;
  },

  /**
   * Exporte un deck au format YAML
   *
   * @param {Object} deck - Deck à exporter
   * @returns {string} - YAML formaté
   */
  toYAML(deck) {
    // Détecter si c'est un deck multilingue
    if (deck.type === 'multilingual' && deck.words) {
      return this._multilingualToYAML(deck);
    }

    // Le nom en commentaire ne doit pas contenir de retour à la ligne (sinon il sort du commentaire)
    let yaml = `# Deck: ${String(deck.name ?? '').replace(/[\r\n]+/g, ' ')}\n`;
    yaml += '# Train Your Brain\n\n';

    yaml += `id: ${this._yamlScalar(deck.id)}\n`;
    yaml += `name: ${this._yamlScalar(deck.name)}\n`;
    yaml += `description: ${this._yamlScalar(deck.description)}\n`;

    // Catégories
    yaml += 'category:\n';
    const categories = deck.category || ['import'];
    categories.forEach(cat => {
      yaml += `  - ${this._yamlScalar(cat)}\n`;
    });

    yaml += `difficulty: ${deck.difficulty || 1}\n`;
    yaml += `language: ${this._yamlScalar(deck.language || 'fr')}\n`;
    if (deck.tags && deck.tags.length > 0) {
      yaml += 'tags:\n';
      deck.tags.forEach(tag => { yaml += `  - ${this._yamlScalar(tag)}\n`; });
    }
    yaml += this._metadataToYAML(deck);
    yaml += '\n';

    // Settings
    yaml += 'settings:\n';
    yaml += `  bidirectional: ${deck.settings?.bidirectional || false}\n`;
    yaml += `  sequential: ${deck.settings?.sequential || false}\n`;
    for (const key of this._DECK_SETTING_FIELDS) {
      const value = deck.settings?.[key];
      if (value !== undefined && value !== null) yaml += `  ${key}: ${JSON.stringify(value)}\n`;
    }
    yaml += '\n';

    // Cards
    yaml += 'cards:\n';
    if (deck.cards && deck.cards.length > 0) {
      deck.cards.forEach(card => {
        yaml += this._cardToYAML(card);
      });
    }

    return yaml;
  },

  /**
   * Exporte un deck multilingue au format YAML
   * @private
   */
  _multilingualToYAML(deck) {
    let yaml = `# Deck Multilingue: ${deck.name}\n`;
    yaml += '# Train Your Brain\n\n';

    yaml += `id: ${deck.id}\n`;
    yaml += `name: "${this._escapeYAMLString(deck.name)}"\n`;
    yaml += `type: multilingual\n`;
    yaml += `description: "${this._escapeYAMLString(deck.description || '')}"\n`;

    // Langues
    yaml += 'languages:\n';
    (deck.languages || []).forEach(lang => {
      yaml += `  - ${lang}\n`;
    });

    yaml += `difficulty: ${deck.difficulty || 1}\n`;
    yaml += this._metadataToYAML(deck);
    yaml += '\n';

    // Settings
    yaml += 'settings:\n';
    yaml += `  bidirectional: ${deck.settings?.bidirectional || false}\n`;
    yaml += `  sequential: ${deck.settings?.sequential || false}\n\n`;

    // Words
    yaml += 'words:\n';
    (deck.words || []).forEach(word => {
      yaml += `  - id: ${word.id}\n`;
      yaml += '    translations:\n';

      for (const [lang, translation] of Object.entries(word.translations || {})) {
        yaml += `      ${lang}:\n`;
        yaml += `        text: "${this._escapeYAMLString(translation.text || '')}"\n`;

        if (translation.alternatives && translation.alternatives.length > 0) {
          yaml += '        alternatives:\n';
          translation.alternatives.forEach(alt => {
            yaml += `          - "${this._escapeYAMLString(alt)}"\n`;
          });
        }

        // Ne pas inclure les données audio base64 dans YAML (trop volumineux)
        if (translation.audio) {
          yaml += `        hasAudio: true\n`;
          yaml += `        audioLicense: "${this._escapeYAMLString(translation.audio.license || this._UNKNOWN_LICENSE)}"\n`;
          if (translation.audio.artist) {
            yaml += `        audioArtist: "${this._escapeYAMLString(translation.audio.artist)}"\n`;
          }
          if (translation.audio.sourceUrl) {
            yaml += `        audioSourceUrl: "${this._escapeYAMLString(translation.audio.sourceUrl)}"\n`;
          }
        }
      }
      yaml += '\n';
    });

    return yaml;
  },

  /**
   * Convertit une carte en YAML
   * @private
   */
  _cardToYAML(card) {
    let yaml = `  - id: ${this._yamlScalar(card.id)}\n`;
    yaml += `    question: "${this._escapeYAMLString(card.question)}"\n`;
    yaml += `    answer: "${this._escapeYAMLString(String(card.answer))}"\n`;
    yaml += `    type: ${this._yamlScalar(card.type || 'text')}\n`;

    // Attribution d'un enregistrement audio (les données base64 ne sont pas exportées ici)
    if (card.media && typeof card.media === 'object' && card.media.type === 'audio') {
      yaml += `    mediaLicense: "${this._escapeYAMLString(card.media.license || this._UNKNOWN_LICENSE)}"\n`;
      if (card.media.artist) {
        yaml += `    mediaArtist: "${this._escapeYAMLString(card.media.artist)}"\n`;
      }
      if (card.media.sourceUrl) {
        yaml += `    mediaSourceUrl: "${this._escapeYAMLString(card.media.sourceUrl)}"\n`;
      }
    }

    // Champs de contenu présents. Les valeurs sont écrites en JSON (sous-ensemble de YAML) : les chaînes
    // ambiguës (yes, 007, "a: b"...), les retours à la ligne et les objets imbriqués se relisent à l'identique.
    for (const field of this._CARD_CONTENT_FIELDS) {
      const value = card[field];
      if (value === undefined || value === null) continue;
      if (Array.isArray(value) && value.length > 0 && value.every(v => typeof v !== 'object')) {
        yaml += `    ${field}:\n`;
        value.forEach(v => { yaml += `      - ${JSON.stringify(v)}\n`; });
      } else {
        yaml += `    ${field}: ${JSON.stringify(value)}\n`;
      }
    }

    yaml += '\n';
    return yaml;
  },

  /**
   * Enveloppe un contenu dans une section CDATA.
   * Une séquence "]]>" dans le contenu fermerait la section et laisserait le reste s'interpréter
   * comme du XML : elle est coupée en deux sections ("]]" puis ">").
   * @private
   * @param {*} value - Contenu texte
   * @returns {string} Section CDATA (sans balise englobante)
   */
  _cdata(value) {
    const text = value === null || value === undefined ? '' : String(value);
    return `<![CDATA[${text.replace(/\]\]>/g, ']]]]><![CDATA[>')}]]>`;
  },

  /**
   * Nombre écrit dans un élément XML (note, pénalité, tolérance) : jamais de texte libre.
   * @private
   * @param {*} value - Valeur de la carte
   * @param {number} fallback - Valeur si absente, nulle ou non numérique
   * @returns {number}
   */
  _xmlNumber(value, fallback) {
    const n = Number(value);
    return Number.isFinite(n) && n !== 0 ? n : fallback;
  },

  /**
   * Échappe les caractères spéciaux XML
   * @private
   */
  _escapeXML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /**
   * Génère le XML de feedback pour Moodle
   * @private
   */
  _feedbackToMoodleXML(card) {
    let xml = '';

    // Feedback général (affiché après réponse)
    if (card.feedbackCorrect || card.feedbackIncorrect) {
      xml += '    <generalfeedback format="html">\n';
      xml += '      <text></text>\n';
      xml += '    </generalfeedback>\n';
    }

    // Feedback pour bonne réponse
    if (card.feedbackCorrect) {
      xml += '    <correctfeedback format="html">\n';
      xml += `      <text>${this._cdata(card.feedbackCorrect)}</text>\n`;
      xml += '    </correctfeedback>\n';
    }

    // Feedback pour mauvaise réponse
    if (card.feedbackIncorrect) {
      xml += '    <incorrectfeedback format="html">\n';
      xml += `      <text>${this._cdata(card.feedbackIncorrect)}</text>\n`;
      xml += '    </incorrectfeedback>\n';
    }

    return xml;
  },

  /**
   * Échappe les caractères spéciaux pour YAML
   * @private
   */
  _escapeYAMLString(str) {
    if (!str) return '';
    return String(str)
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
  },

  /**
   * Le deck porte-t-il des métadonnées à exporter (objet non vide) ? Licence et source du deck
   * (metadata.license, metadata.source) sont exportées telles quelles : la CC BY-SA exige
   * l'attribution et la mention de licence.
   * @private
   */
  _hasMetadata(deck) {
    const m = deck && deck.metadata;
    return !!m && typeof m === 'object' && !Array.isArray(m) &&
      Object.keys(m).some(k => m[k] !== undefined);
  },

  /**
   * Bloc YAML `metadata:` du deck (chaîne vide sans métadonnées)
   * @private
   */
  _metadataToYAML(deck) {
    if (!this._hasMetadata(deck)) return '';
    return 'metadata:\n' + this._yamlNode(deck.metadata, 1);
  },

  /**
   * Sérialise récursivement un objet en YAML par blocs (indentation de 2 espaces par niveau).
   * Les chaînes passent par _yamlScalar (guillemets si ambiguës, par exemple une date).
   * @private
   */
  _yamlNode(obj, depth) {
    const pad = '  '.repeat(depth);
    const scalar = (v) => {
      if (v === null) return 'null';
      if (typeof v === 'string') return v === '' ? '""' : this._yamlScalar(v);
      if (typeof v === 'number' || typeof v === 'boolean') return String(v);
      return null;
    };
    const key = (k) => (/^[A-Za-z_][\w-]*$/.test(k) ? k : JSON.stringify(k));
    let out = '';
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined || typeof v === 'function') continue;
      const sc = scalar(v);
      if (sc !== null) {
        out += `${pad}${key(k)}: ${sc}\n`;
      } else if (Array.isArray(v)) {
        if (v.length === 0) { out += `${pad}${key(k)}: []\n`; continue; }
        out += `${pad}${key(k)}:\n`;
        for (const item of v) {
          const isc = scalar(item);
          out += `${pad}  - ${isc !== null ? isc : JSON.stringify(item)}\n`;
        }
      } else if (typeof v === 'object') {
        if (Object.keys(v).length === 0) { out += `${pad}${key(k)}: {}\n`; continue; }
        out += `${pad}${key(k)}:\n` + this._yamlNode(v, depth + 1);
      }
    }
    return out;
  },

  /**
   * Valeur scalaire YAML : telle quelle si sans ambiguïté (lettre en tête, aucun
   * caractère spécial, pas un mot réservé), sinon entre guillemets doubles.
   * @private
   */
  _yamlScalar(value) {
    const str = value === null || value === undefined ? '' : String(value);
    if (str === '') return '';
    const isPlain = /^\p{L}[^\n\r\t:#"'\\\[\]{},&*!|>%@`]*$/u.test(str) &&
      str === str.trim() &&
      !/^(true|false|null|yes|no|on|off|y|n)$/i.test(str);
    return isPlain ? str : `"${this._escapeYAMLString(str)}"`;
  },

  /**
   * Télécharge un fichier avec le contenu donné
   *
   * @param {string} content - Contenu du fichier
   * @param {string} filename - Nom du fichier
   * @param {string} mimeType - Type MIME du fichier
   */
  download(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
  },

  /**
   * Alias de download pour compatibilité
   *
   * @param {string} content - Contenu du fichier
   * @param {string} filename - Nom du fichier
   * @param {string} mimeType - Type MIME du fichier
   */
  downloadFile(content, filename, mimeType) {
    this.download(content, filename, mimeType);
  },

  /**
   * Exporte et télécharge un deck au format JSON
   *
   * @param {Object} deck - Deck à exporter
   * @param {boolean} includeProgress - Inclure la progression
   */
  downloadJSON(deck, includeProgress = false) {
    const content = this.toJSON(deck, includeProgress);
    const filename = `${deck.id || 'deck'}.json`;
    this.download(content, filename, 'application/json');
  },

  /**
   * Exporte et télécharge un deck au format Moodle XML
   *
   * @param {Object} deck - Deck à exporter
   */
  downloadMoodleXML(deck) {
    const content = this.toMoodleXML(deck);
    const filename = `${deck.id || 'deck'}_moodle.xml`;
    this.download(content, filename, 'application/xml');
  },

  /**
   * Exporte et télécharge un deck au format YAML
   *
   * @param {Object} deck - Deck à exporter
   */
  downloadYAML(deck) {
    const content = this.toYAML(deck);
    const filename = `${deck.id || 'deck'}.yaml`;
    this.download(content, filename, 'text/yaml');
  },

  /**
   * Exporte un deck dans le format spécifié et déclenche le téléchargement
   *
   * @param {Object} deck - Deck à exporter
   * @param {string} format - Format d'export ('json', 'yaml', 'moodle')
   * @param {Object} options - Options d'export
   * @param {boolean} options.includeProgress - Inclure la progression (pour JSON)
   * @returns {{success: boolean, filename: string}} Résultat de l'export
   */
  exportDeck(deck, format, options = {}) {
    if (!deck) {
      throw new Error('Deck requis pour l\'export');
    }

    let content;
    let filename;
    let mimeType;

    switch (format) {
      case 'json':
        content = this.toJSON(deck, options.includeProgress || false);
        filename = `${deck.id || 'deck'}.json`;
        mimeType = 'application/json';
        break;

      case 'yaml':
        content = this.toYAML(deck);
        filename = `${deck.id || 'deck'}.yaml`;
        mimeType = 'text/yaml';
        break;

      case 'moodle':
        content = this.toMoodleXML(deck);
        filename = `${deck.id || 'deck'}_moodle.xml`;
        mimeType = 'application/xml';
        break;

      default:
        throw new Error(`Format d'export non supporté: ${format}`);
    }

    return {
      success: true,
      content: content,
      filename: filename,
      mimeType: mimeType
    };
  }
};

// Export pour tests Node.js
if (typeof module !== 'undefined') {
  module.exports = Exporter;
}
