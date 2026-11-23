/**
 * Module YAML - Wrapper autour de js-yaml pour le parsing de decks
 *
 * Utilise la bibliothèque js-yaml pour le parsing robuste,
 * et ajoute des fonctions spécifiques aux decks.
 *
 * Note: js-yaml est chargé globalement comme 'jsyaml' par le build
 */

const YAML = {
  // Pattern pour détecter un placeholder de média
  // Format: [base64:type/subtype:taille]
  MEDIA_PLACEHOLDER_REGEX: /^\[base64:(image|audio)\/[\w+-]+:[\d.]+[KM]B\]$/,

  /**
   * Génère un placeholder pour un média base64
   * @param {string} base64Data - Données base64 complètes (data:type;base64,...)
   * @returns {string} Placeholder lisible
   */
  _createMediaPlaceholder(base64Data) {
    if (typeof base64Data !== 'string' || !base64Data.startsWith('data:')) return null;

    // Extraire le type MIME
    const match = base64Data.match(/^data:([\w+-]+\/[\w+-]+);base64,/);
    if (!match) return null;

    const mimeType = match[1];
    // Calculer la taille approximative (base64 = ~4/3 de la taille originale)
    const base64Part = base64Data.split(',')[1] || '';
    const sizeBytes = Math.round(base64Part.length * 3 / 4);
    const sizeStr = sizeBytes >= 1024 * 1024
      ? `${(sizeBytes / (1024 * 1024)).toFixed(1)}MB`
      : `${(sizeBytes / 1024).toFixed(1)}KB`;

    return `[base64:${mimeType}:${sizeStr}]`;
  },

  /**
   * Vérifie si une valeur est un placeholder de média
   * @param {string} value - Valeur à vérifier
   * @returns {boolean}
   */
  isMediaPlaceholder(value) {
    return typeof value === 'string' && this.MEDIA_PLACEHOLDER_REGEX.test(value);
  },

  /**
   * Parse une chaîne YAML et retourne un objet JavaScript
   * Utilise js-yaml pour un parsing robuste
   *
   * @param {string} yamlString - Contenu YAML à parser
   * @returns {Object} - Objet JavaScript parsé
   * @throws {Error} - Si le YAML est invalide
   */
  parse(yamlString) {
    if (!yamlString || typeof yamlString !== 'string') {
      throw new Error('YAML invalide: chaîne vide ou non-string');
    }

    // Utiliser js-yaml (chargé globalement comme jsyaml)
    if (typeof jsyaml !== 'undefined') {
      return jsyaml.load(yamlString);
    }

    // Fallback: erreur si js-yaml n'est pas disponible
    throw new Error('js-yaml non disponible. Vérifiez que la bibliothèque est chargée.');
  },

  /**
   * Parse un fichier YAML et retourne un deck formaté
   *
   * @param {string} yamlString - Contenu YAML du fichier
   * @param {string} [deckName] - Nom du deck (optionnel, utilise celui du fichier sinon)
   * @returns {Object} - Deck avec les cartes parsées
   */
  parseDeck(yamlString, deckName = null) {
    const data = this.parse(yamlString);

    // Validation minimale
    if (!data.cards || !Array.isArray(data.cards)) {
      throw new Error('Format YAML invalide: propriété "cards" manquante ou invalide');
    }

    // Construire le deck
    const deck = {
      id: data.id || 'yaml_' + Date.now(),
      name: deckName || data.name || 'Import YAML',
      description: data.description || `Importé depuis YAML (${data.cards.length} cartes)`,
      category: data.category || ['import', 'yaml'],
      difficulty: data.difficulty || 2,
      language: data.language || 'fr',
      ...(Array.isArray(data.tags) && data.tags.length > 0 && { tags: data.tags }),
      // Licence et source du deck (attribution CC BY-SA), conservées telles quelles
      ...(data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata) && { metadata: data.metadata }),
      settings: data.settings || {
        bidirectional: false,
        sequential: false
      },
      cards: data.cards.map((card, index) => ({
        id: card.id || `yaml_${Date.now()}_${index}`,
        question: card.question || '',
        // Gérer correctement les booléens (false, true) et les nombres (0)
        answer: card.answer === false ? 'false' : card.answer === true ? 'true' : String(card.answer ?? ''),
        type: card.type || 'text',
        // Propriétés optionnelles
        ...(card.choices && { choices: card.choices }),
        ...(card.pairs && { pairs: card.pairs }),
        ...(card.blanks && { blanks: card.blanks }),
        ...(card.tolerance !== undefined && card.tolerance !== null && { tolerance: card.tolerance }),
        ...(card.acceptedAnswers && { acceptedAnswers: card.acceptedAnswers }),
        ...(card.alternatives && { alternatives: card.alternatives }),
        ...(card.feedback && { feedback: card.feedback }),
        ...(card.hint && { hint: card.hint }),
        ...(card.media && { media: card.media }),
        ...(card.feedbackCorrect && { feedbackCorrect: card.feedbackCorrect }),
        ...(card.feedbackIncorrect && { feedbackIncorrect: card.feedbackIncorrect }),
        ...(card.options && { options: card.options }),
        ...(card.mediaSuggestion && { mediaSuggestion: card.mediaSuggestion }),
        ...(card.imageUrl && { imageUrl: card.imageUrl }),
        ...(card.audioUrl && { audioUrl: card.audioUrl }),
        ...(card.points !== undefined && card.points !== null && { points: card.points }),
        ...(card.penalty !== undefined && card.penalty !== null && { penalty: card.penalty }),
        ...(Array.isArray(card.tags) && { tags: card.tags }),
        ...(card.xpOverride !== undefined && card.xpOverride !== null && { xpOverride: card.xpOverride }),
        // Initialiser la progression
        box: 'never_played',
        latencyThreshold: null,
        bestResponseTimeMs: null,
        lastResponseTimeMs: null,
        restUntil: null,
        timesPlayed: 0,
        timesCorrect: 0
      }))
    };

    return deck;
  },

  // ═══════════════════════════════════════════════════════════════
  // SERIALIZATION
  // ═══════════════════════════════════════════════════════════════

  /**
   * Sérialise un objet JavaScript en chaîne YAML
   * Utilise js-yaml pour la sérialisation
   *
   * @param {Object} obj - Objet à sérialiser
   * @param {number} [indent=2] - Niveau d'indentation
   * @returns {string} - Chaîne YAML
   */
  stringify(obj, indent = 2) {
    // Utiliser js-yaml si disponible
    if (typeof jsyaml !== 'undefined') {
      return jsyaml.dump(obj, {
        indent: indent,
        lineWidth: -1, // Pas de limite de largeur
        noRefs: true,  // Pas de références &anchor/*alias
        sortKeys: false
      });
    }

    // Fallback: sérialisation basique
    return this._stringifyBasic(obj, 0);
  },

  /**
   * Sérialisation basique (fallback)
   * @private
   */
  _stringifyBasic(obj, indent) {
    const spaces = '  '.repeat(indent);
    let result = '';

    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) continue;

      if (Array.isArray(value)) {
        result += `${spaces}${key}:\n`;
        for (const item of value) {
          if (typeof item === 'object' && item !== null) {
            const itemLines = this._stringifyBasic(item, 0).split('\n').filter(l => l);
            result += `${spaces}  - ${itemLines[0]}\n`;
            for (let i = 1; i < itemLines.length; i++) {
              result += `${spaces}    ${itemLines[i]}\n`;
            }
          } else {
            result += `${spaces}  - ${this._stringifyValue(item)}\n`;
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        result += `${spaces}${key}:\n`;
        result += this._stringifyBasic(value, indent + 1);
      } else {
        result += `${spaces}${key}: ${this._stringifyValue(value)}\n`;
      }
    }

    return result;
  },

  /**
   * Sérialise un deck avec un format lisible
   *
   * @param {Object} deck - Deck à sérialiser
   * @param {Object} [options] - Options de sérialisation
   * @param {boolean} [options.hideMedia=false] - Remplacer les médias par des placeholders
   * @returns {string} - Chaîne YAML formatée
   */
  stringifyDeck(deck, options = {}) {
    const { hideMedia = false } = options;
    let result = '';

    // Métadonnées en premier (ordre lisible)
    if (deck.id) result += `id: ${this._escapeString(deck.id)}\n`;
    if (deck.name) result += `name: ${this._escapeString(deck.name)}\n`;
    if (deck.description) result += `description: ${this._escapeString(deck.description)}\n`;

    // Tags
    if (deck.tags && deck.tags.length > 0) {
      result += 'tags:\n';
      deck.tags.forEach(tag => {
        result += `  - ${this._escapeString(tag)}\n`;
      });
    }

    // Settings
    if (deck.settings) {
      const hasSettings = Object.entries(deck.settings).some(([, v]) => v);
      if (hasSettings) {
        result += 'settings:\n';
        if (deck.settings.sequential) result += '  sequential: true\n';
        if (deck.settings.bidirectional) result += '  bidirectional: true\n';
        if (deck.settings.similarityMatching) {
          result += '  similarityMatching: true\n';
          result += `  similarityThreshold: ${deck.settings.similarityThreshold || 0.8}\n`;
        }
      }
    }

    // Cards
    if (deck.cards && deck.cards.length > 0) {
      result += 'cards:\n';
      deck.cards.forEach(card => {
        result += `  - question: ${this._escapeString(String(card.question || ''))}\n`;
        result += `    answer: ${this._escapeString(String(card.answer ?? ''))}\n`;
        // Ne pas écrire type si c'est 'text' (valeur par défaut)
        if (card.type && card.type !== 'text') result += `    type: ${card.type}\n`;
        // Choix pour QCM
        if (card.type === 'mcq' && card.choices && Array.isArray(card.choices) && card.choices.length > 0) {
          result += '    choices:\n';
          card.choices.forEach(choice => {
            result += `      - id: ${choice.id}\n`;
            result += `        text: ${this._escapeString(String(choice.text || ''))}\n`;
          });
        }
        // Paires pour matching
        if (card.type === 'matching' && card.pairs && Array.isArray(card.pairs) && card.pairs.length > 0) {
          result += '    pairs:\n';
          card.pairs.forEach(pair => {
            result += `      - term: ${this._escapeString(String(pair.term || ''))}\n`;
            result += `        response: ${this._escapeString(String(pair.response || ''))}\n`;
          });
        }
        // Réponses alternatives (pour types non-QCM)
        if (card.type !== 'mcq' && card.alternatives && Array.isArray(card.alternatives) && card.alternatives.length > 0) {
          result += '    alternatives:\n';
          card.alternatives.forEach(alt => {
            result += `      - ${this._escapeString(String(alt))}\n`;
          });
        }
        if (card.feedback) result += `    feedback: ${this._escapeString(card.feedback)}\n`;
        if (card.hint) result += `    hint: ${this._escapeString(card.hint)}\n`;
        // Média (image ou audio en base64)
        if (card.media) {
          if (hideMedia) {
            // Afficher un placeholder au lieu du base64 complet
            const placeholder = this._createMediaPlaceholder(card.media);
            if (placeholder) {
              result += `    media: ${placeholder}\n`;
            }
          } else {
            result += `    media: ${this._escapeString(card.media)}\n`;
          }
        }
      });
    }

    return result;
  },

  /**
   * Sérialise une valeur simple
   * @private
   */
  _stringifyValue(value) {
    if (value === null || value === undefined) return '~';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'number') return String(value);
    if (typeof value === 'string') {
      return this._escapeString(value);
    }
    return String(value);
  },

  /**
   * Retourne la chaîne telle quelle si elle est sans ambiguïté en YAML,
   * sinon entre guillemets doubles (échappement JSON, valide en YAML).
   * Sont quotés : textes pouvant être lus comme nombre, booléen, null, alias, tag,
   * collection ou indicateur YAML (ex. "0.50", "True", "- a", "[a]", "*x").
   * @private
   */
  _escapeString(str) {
    if (!str) return '""';
    str = String(str);
    const isPlain = /^\p{L}[^\n\r\t:#"'\\\[\]{},&*!|>%@`]*$/u.test(str) &&
      str === str.trim() &&
      !/^(true|false|null|yes|no|on|off|y|n)$/i.test(str);
    return isPlain ? str : JSON.stringify(str);
  }
};

// Export pour tests Node.js
if (typeof module !== 'undefined') {
  module.exports = YAML;
}
