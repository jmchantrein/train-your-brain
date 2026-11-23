/**
 * Base Generator - Classe abstraite pour tous les générateurs procéduraux
 *
 * Chaque générateur hérite de cette classe et implémente la méthode generate().
 * Les decks générés incluent automatiquement les métadonnées de source.
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let taxonomyIds = null;

/**
 * Identifiants de la taxonomie (src/modules/tags-taxonomy.js, lecture seule).
 * Le fichier est un script classique pour le navigateur : on l'évalue dans un contexte isolé.
 * @returns {Set<string>}
 */
function getTaxonomyIds() {
  if (!taxonomyIds) {
    const file = path.join(__dirname, '..', '..', 'src', 'modules', 'tags-taxonomy.js');
    const taxonomy = vm.runInNewContext(fs.readFileSync(file, 'utf8') + '\nTAXONOMY');
    taxonomyIds = new Set(taxonomy.map(t => t.id));
  }
  return taxonomyIds;
}

class BaseGenerator {
  /**
   * @param {Object} config - Configuration du générateur
   * @param {string} config.id - Identifiant unique (ex: "multiplication")
   * @param {string} config.name - Nom affiché (ex: "Tables de multiplication")
   * @param {string[]} config.tags - Tags taxonomie (ex: ["multiplications", "calcul-mental"])
   * @param {string} config.version - Version du générateur (ex: "1.0.0")
   * @param {string} [config.description] - Description du générateur
   */
  constructor(config) {
    if (!config.id || !config.name || !config.tags || !config.version) {
      throw new Error('BaseGenerator requires id, name, tags, and version');
    }

    this.id = config.id;
    this.name = config.name;
    this.tags = config.tags;
    this.version = config.version;
    this.description = config.description || `Généré par ${config.id}`;

    /**
     * Ressources pédagogiques communes à tous les decks de ce générateur.
     * Les générateurs peuvent surcharger cette propriété.
     * @type {Array<Object>}
     */
    this.commonResources = [];

    // Convention unique pour tous les decks générés : voir finalizeDeck().
    // Le filtre de l'explorateur lit deck.category, que le générateur ait écrit
    // category lui-même (decks de maths) ou seulement tags.
    const build = this.buildDecks;
    this.buildDecks = (options = {}) => build.call(this, options).map(d => BaseGenerator.finalizeDeck(d));
  }

  /**
   * Aligne un deck généré sur la convention des decks écrits à la main.
   *
   * `category` est la liste des identifiants de la taxonomie (matière, thème, niveau)
   * qui rend le deck filtrable sur la page d'exploration (elle ne lit que ce champ).
   * Elle reprend la `category` écrite par le générateur (chaîne complète
   * `sciences, maths, arithmetique, ...`), puis ajoute chaque tag de `tags` présent dans
   * la taxonomie (niveau scolaire compris). Les tags hors taxonomie restent dans `tags`
   * seulement. Idempotent ; l'ordre des clés du deck est conservé (category après tags).
   * @param {Object} deck - Deck produit par buildDeck()/buildDecks()
   * @returns {Object} Le même deck, avec category complétée
   */
  static finalizeDeck(deck) {
    const ids = getTaxonomyIds();
    const tags = Array.isArray(deck.tags) ? deck.tags : [];
    const category = [...new Set([
      ...(Array.isArray(deck.category) ? deck.category : []),
      ...tags.filter(t => ids.has(t))
    ])];
    if ('category' in deck) {
      deck.category = category;
      return deck;
    }
    const ordered = {};
    for (const [key, value] of Object.entries(deck)) {
      ordered[key] = value;
      if (key === 'tags') ordered.category = category;
    }
    for (const key of Object.keys(deck)) delete deck[key];
    return Object.assign(deck, ordered);
  }

  /**
   * Génère les cartes - À implémenter par chaque générateur
   * @param {Object} options - Options de génération
   * @returns {Object[]} Tableau de cartes
   */
  generate(options = {}) {
    throw new Error('generate() must be implemented by subclass');
  }

  /**
   * Génère un deck complet avec métadonnées
   * @param {Object} options - Options de génération
   * @param {string} [options.name] - Nom personnalisé du deck
   * @param {string} [options.description] - Description personnalisée
   * @param {string} [options.level] - Niveau éducatif (tag taxonomie)
   * @param {string[]} [options.extraTags] - Tags supplémentaires
   * @param {boolean} [options.sequential] - Cartes dans l'ordre
   * @param {boolean} [options.bidirectional] - Questions réversibles
   * @param {Object} [options.settings] - Autres paramètres du deck
   * @param {Array} [options.resources] - Ressources spécifiques au deck
   * @returns {Object} Deck complet au format YAML-ready
   */
  buildDeck(options = {}) {
    const cards = this.generate(options);

    if (!Array.isArray(cards) || cards.length === 0) {
      throw new Error(`Generator ${this.id} produced no cards`);
    }

    const deck = {
      name: options.name || this.name,
      description: options.description || this.description,
      tags: this._buildTags(options),
      settings: this._buildSettings(options),
      metadata: this._buildMetadata(options),
      cards: this._formatCards(cards)
    };

    // Ajouter les ressources pédagogiques
    const resources = this._buildResources(options);
    if (resources.length > 0) {
      deck.resources = resources;
    }

    return BaseGenerator.finalizeDeck(deck);
  }

  /**
   * Génère plusieurs decks (pour les générateurs qui produisent plusieurs decks)
   * @param {Object} options - Options de génération
   * @returns {Object[]} Tableau de decks
   */
  buildDecks(options = {}) {
    // Par défaut, retourne un seul deck
    // Les générateurs peuvent surcharger cette méthode
    return [this.buildDeck(options)];
  }

  /**
   * Construit la liste des tags
   * @private
   */
  _buildTags(options) {
    const tags = [...this.tags];

    if (options.level) {
      tags.push(options.level);
    }

    if (options.extraTags && Array.isArray(options.extraTags)) {
      tags.push(...options.extraTags);
    }

    // Déduplique les tags
    return [...new Set(tags)];
  }

  /**
   * Construit les settings du deck
   * @private
   */
  _buildSettings(options) {
    return {
      sequential: options.sequential ?? false,
      bidirectional: options.bidirectional ?? false,
      ...options.settings
    };
  }

  /**
   * Construit les métadonnées de source
   * @private
   */
  _buildMetadata(options) {
    return {
      license: BaseGenerator.LICENSE,
      source: {
        type: 'procedural',
        generator: this.id,
        version: this.version,
        generatedAt: BaseGenerator.generatedAt(),
        parameters: this._sanitizeParameters(options)
      }
    };
  }

  /**
   * Construit les ressources pédagogiques du deck
   * Combine les ressources communes avec les ressources spécifiques
   * @private
   * @param {Object} options - Options incluant potentiellement des ressources spécifiques
   * @returns {Array} Liste des ressources formatées
   */
  _buildResources(options) {
    const resources = [];

    // Ajouter les ressources communes du générateur
    if (this.commonResources && this.commonResources.length > 0) {
      resources.push(...this.commonResources);
    }

    // Ajouter les ressources spécifiques au deck (options.resources)
    if (options.resources && Array.isArray(options.resources)) {
      resources.push(...options.resources);
    }

    // Trier par ordre et ajouter un index
    return resources
      .map((res, index) => ({
        ...res,
        order: res.order ?? index
      }))
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Sanitize les paramètres pour les métadonnées (retire les fonctions, etc.)
   * @private
   */
  _sanitizeParameters(options) {
    const sanitized = {};
    for (const [key, value] of Object.entries(options)) {
      if (typeof value !== 'function' && typeof value !== 'undefined') {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Formate les cartes avec IDs uniques
   * @private
   */
  _formatCards(cards) {
    return cards.map((card, index) => {
      const id = card.id || `${this.id}_${String(index + 1).padStart(4, '0')}`;

      const formattedCard = {
        id,
        question: card.question,
        answer: card.answer
      };

      // Ajoute les champs optionnels s'ils existent
      if (card.type && card.type !== 'text') {
        formattedCard.type = card.type;
      }
      if (card.alternatives && card.alternatives.length > 0) {
        formattedCard.alternatives = card.alternatives;
      }
      if (card.feedback) {
        formattedCard.feedback = card.feedback;
      }
      if (card.media) {
        formattedCard.media = card.media;
      }
      if (card.choices) {
        formattedCard.choices = card.choices;
      }
      if (card.pairs) {
        formattedCard.pairs = card.pairs;
      }
      if (card.audio) {
        formattedCard.audio = card.audio;
      }
      if (card.staff) {
        formattedCard.staff = card.staff;
      }

      return formattedCard;
    });
  }

  /**
   * Utilitaire pour créer un SVG simple
   * @param {string} content - Contenu SVG (sans balises svg)
   * @param {number} [width=100] - Largeur
   * @param {number} [height=100] - Hauteur
   * @returns {string} SVG complet encodé en data URI
   */
  createSvg(content, width = 100, height = 100) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${content}</svg>`;
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  }

  /**
   * Générateur pseudo-aléatoire à graine (mulberry32, graine hachée par xmur3).
   * Renvoie une fonction sans argument qui produit des flottants dans [0, 1[.
   * Seule source d'aléa autorisée dans les générateurs (pas de Math.random).
   * @param {string} seed - Graine textuelle
   * @returns {function(): number}
   */
  static createRng(seed) {
    seed = String(seed);
    // xmur3 : hachage de chaîne vers entier 32 bits
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    let a = (h ^ (h >>> 16)) >>> 0;
    // mulberry32
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Crée un générateur pseudo-aléatoire neuf, graine = id du générateur + étiquette.
   * Chaque appel repart de la même graine : le résultat ne dépend ni de l'ordre
   * de génération des autres decks ni du nombre de générations précédentes.
   * @param {string} [label=''] - Étiquette du site d'appel (ex. 'cards')
   * @returns {function(): number}
   */
  rng(label = '') {
    return BaseGenerator.createRng(`${this.id}:${label}`);
  }

  /**
   * Mélange de Fisher-Yates à graine (ne modifie pas le tableau d'origine)
   * @param {Array} array - Tableau à mélanger
   * @param {function(): number|string} [rngOrLabel] - Fonction rng() ou étiquette de graine
   * @returns {Array} Nouveau tableau mélangé
   */
  shuffle(array, rngOrLabel = 'shuffle') {
    const rand = typeof rngOrLabel === 'function' ? rngOrLabel : this.rng(rngOrLabel);
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Licence du contenu des decks générés (identifiant SPDX), émise dans metadata.license.
   * Texte : decks/LICENSE.
   * @type {string}
   */
  static get LICENSE() {
    return 'CC-BY-SA-4.0';
  }

  /**
   * Date de génération (AAAA-MM-JJ). Respecte SOURCE_DATE_EPOCH (builds reproductibles).
   * @returns {string}
   */
  static generatedAt() {
    const epoch = process.env.SOURCE_DATE_EPOCH;
    const d = epoch && /^\d+$/.test(epoch) ? new Date(Number(epoch) * 1000) : new Date();
    return d.toISOString().split('T')[0];
  }

  /**
   * Utilitaire pour générer un ID à partir d'un texte
   * @param {string} text - Texte à convertir
   * @returns {string} ID normalisé
   */
  slugify(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // UTILITAIRES POUR RESSOURCES PÉDAGOGIQUES
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Crée une ressource de type lien Wikipedia
   * @param {string} title - Titre de l'article Wikipedia
   * @param {string} [articleSlug] - Slug de l'article (par défaut: titre encodé)
   * @param {string} [lang='fr'] - Langue Wikipedia
   * @returns {Object} Ressource de type link
   */
  createWikipediaLink(title, articleSlug = null, lang = 'fr') {
    const slug = articleSlug || encodeURIComponent(title.replace(/ /g, '_'));
    return {
      type: 'link',
      title: `Wikipedia : ${title}`,
      url: `https://${lang}.wikipedia.org/wiki/${slug}`,
      icon: '📖'
    };
  }

  /**
   * Crée une ressource de type résumé (avec avertissement IA si applicable)
   * @param {string} title - Titre du résumé
   * @param {string} content - Contenu Markdown
   * @param {boolean} [aiGenerated=true] - Si généré par IA
   * @returns {Object} Ressource de type summary
   */
  createSummary(title, content, aiGenerated = true) {
    return {
      type: 'summary',
      title,
      content,
      aiGenerated,
      icon: '📝'
    };
  }

  /**
   * Crée une ressource de type objectifs d'apprentissage
   * @param {string[]} objectives - Liste des objectifs
   * @returns {Object} Ressource de type objective
   */
  createObjectives(objectives) {
    const content = objectives.map(obj => `- ✅ ${obj}`).join('\n');
    return {
      type: 'objective',
      title: 'Objectifs d\'apprentissage',
      content,
      icon: '🎯'
    };
  }

  /**
   * Crée une ressource de type astuce/mnémotechnique
   * @param {string} title - Titre de l'astuce
   * @param {string} content - Contenu de l'astuce
   * @returns {Object} Ressource de type tip
   */
  createTip(title, content) {
    return {
      type: 'tip',
      title,
      content,
      icon: '💡'
    };
  }

  /**
   * Crée une ressource de type glossaire
   * @param {Object} terms - Dictionnaire terme → définition
   * @returns {Object} Ressource de type glossary
   */
  createGlossary(terms) {
    const content = Object.entries(terms)
      .map(([term, definition]) => `- **${term}** : ${definition}`)
      .join('\n');
    return {
      type: 'glossary',
      title: 'Vocabulaire clé',
      content,
      icon: '📚'
    };
  }

  /**
   * Crée une ressource image de référence
   * @param {string} title - Titre de l'image
   * @param {string} imageData - URL ou base64 data URI
   * @param {boolean} [aiGenerated=false] - Si l'image est générée par IA
   * @returns {Object} Ressource de type image
   */
  createReferenceImage(title, imageData, aiGenerated = false) {
    return {
      type: 'image',
      title,
      image: imageData,
      aiGenerated,
      icon: '📊'
    };
  }
}

module.exports = BaseGenerator;
