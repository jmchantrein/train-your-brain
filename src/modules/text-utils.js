/**
 * TextUtils Module
 * Centralizes text processing utilities for DRY compliance
 */

const TextUtils = {
  /**
   * Normalise un texte pour comparaison
   * - Minuscules
   * - Suppression des accents LATINS (via NFD) ; les diacritiques des autres
   *   écritures sont conservés (й, ё, dakuten des kana...)
   * - Trait d'union et apostrophe (droite ou typographique) entre deux lettres
   *   ou chiffres traités comme une espace (« Porto-Novo » = « porto novo »)
   * - Suppression de la ponctuation de phrase (lettres/chiffres de toutes
   *   les écritures conservés, \p{L} \p{N})
   * - Conservation des symboles porteurs de sens : signe moins devant un
   *   nombre, barre de fraction et séparateur décimal entre chiffres
   *   (',' équivaut à '.'), ♭ ♮ ♯, + ^ % # ° et symboles mathématiques
   * - Trim et espaces multiples réduits
   *
   * @param {string} text - Texte à normaliser
   * @returns {string} - Texte normalisé
   */
  normalizeText(text) {
    if (typeof text !== 'string') {
      return '';
    }
    return this._normalize(text.toLowerCase());
  },

  /**
   * Pipeline de normalisation commun (méthode privée, source unique de la logique)
   * @private
   * @param {string} text - Texte (déjà mis en minuscules si besoin)
   * @returns {string}
   */
  _normalize(text) {
    // Marqueurs internes (zone à usage privé) pour protéger minus / fraction / décimale
    const MINUS = '\uE000';
    const SLASH = '\uE001';
    const DECIMAL = '\uE002';

    return text
      .replace(/[\uE000-\uE002]/g, '')
      // Ligatures (œ, æ) avant NFD
      .replace(/œ/g, 'oe').replace(/Œ/g, 'OE')
      .replace(/æ/g, 'ae').replace(/Æ/g, 'AE')
      // Sigma final = sigma (ς dépend de la position dans le mot)
      .replace(/ς/g, 'σ')
      // Accents : NFD puis retrait des diacritiques UNIQUEMENT sur base latine
      // (й = и + U+0306, ё = е + U+0308, が = か + U+3099 doivent rester distincts)
      .normalize('NFD')
      .replace(/([A-Za-z])[\u0300-\u036f]+/g, '$1')
      .normalize('NFC')
      // Trait d'union / apostrophe entre deux lettres ou chiffres = séparateur de mots
      // (« Porto-Novo » = « Porto Novo », « l'eau » = « l eau »). Le signe moins U+2212
      // n'en fait pas partie. Les cas en bord de mot (« -12 », « abc- ») ne sont pas touchés.
      .replace(/([\p{L}\p{N}\p{M}])[-\u2010\u2011\u2012\u2013'\u2019\u02BC\u2018`\u00B4]+(?=[\p{L}\p{N}])/gu, '$1 ')
      // Symboles porteurs de sens, protégés avant suppression de la ponctuation
      .replace(/(^|[\s=(])[-\u2212\u2012\u2013](?=\p{N})/gu, `$1${MINUS}`)
      .replace(/(\p{N})[\/\u2044\u2215](?=\p{N})/gu, `$1${SLASH}`)
      .replace(/(\p{N})[.,](?=\p{N})/gu, `$1${DECIMAL}`)
      // Suppression de la ponctuation (garde lettres, chiffres, marques, espaces, _,
      // symboles mathématiques, + ^ % °, ♭ ♮ ♯ et marqueurs)
      .replace(/[^\p{L}\p{N}\p{M}\p{Sm}\s_^%#\u00B0\u266D-\u266F\uE000-\uE002]/gu, '')
      // Restitution des marqueurs
      .replace(/\uE000/g, '-')
      .replace(/\uE001/g, '/')
      .replace(/\uE002/g, '.')
      // Espaces multiples et trim
      .replace(/\s+/g, ' ')
      .trim();
  },

  /**
   * Échappe les caractères HTML (& < > " ') : sûr en contenu comme en attribut.
   * Implémentation unique : les modules de src/modules/ y délèguent. N'utilise pas le DOM.
   * @param {*} text - Valeur à échapper (null/undefined -> chaîne vide, le reste est converti en chaîne)
   * @returns {string} - Texte échappé
   */
  escapeHtml(text) {
    if (text == null) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  /**
   * Mélange un tableau (Fisher-Yates) et retourne une copie ; l'original n'est pas modifié.
   * Implémentation unique de mélange (Leitner, Challenges, Multilingual et l'interface l'appellent directement).
   * @param {Array} array - Tableau à mélanger
   * @param {function(): number} [random=Math.random] - Source aléatoire dans [0, 1) (injectable pour les tests)
   * @returns {Array} - Nouveau tableau mélangé
   */
  shuffleArray(array, random = Math.random) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  /**
   * Convertit un texte en slug (implémentation unique : PromptGenerator, LinguaLibre, etc. y délèguent)
   * Minuscules, diacritiques retirés, chaque suite de caractères hors [a-z0-9] devient un séparateur,
   * séparateurs de bord supprimés.
   * @param {string} text - Texte à convertir (une valeur qui n'est pas une chaîne donne '')
   * @param {Object} [options]
   * @param {string} [options.separator='-'] - Séparateur
   * @param {boolean} [options.unicode=false] - Conserve les lettres et chiffres de toutes les écritures
   *   (ß devient ss, les diacritiques ne sont retirés que sur base latine) au lieu de se limiter à [a-z0-9]
   * @returns {string} - Slug
   */
  slugify(text, { separator = '-', unicode = false } = {}) {
    if (typeof text !== 'string') return '';
    let s = text.toLowerCase();
    if (unicode) {
      s = s.replace(/ß/g, 'ss')
        .normalize('NFD')
        .replace(/([a-z])[\u0300-\u036f]+/g, '$1')
        .normalize('NFC')
        .replace(/[^\p{L}\p{N}]+/gu, separator);
    } else {
      s = s.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, separator);
    }
    // Séparateurs de bord (échappés : le séparateur est libre)
    const sep = separator.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return sep === '' ? s : s.replace(new RegExp(`^(?:${sep})+|(?:${sep})+$`, 'g'), '');
  },

  /**
   * Distance de Levenshtein (nombre minimal d'insertions, suppressions, substitutions)
   * Implémentation unique : DeckValidator, Tags et Validator (Damerau) y délèguent.
   * @param {string} s1 - Première chaîne
   * @param {string} s2 - Seconde chaîne
   * @param {Object} [options]
   * @param {boolean} [options.transpositions=false] - Compte l'échange de deux caractères adjacents
   *   pour une seule opération (Damerau-Levenshtein, variante « optimal string alignment »)
   * @returns {number} - Distance (0 = identique)
   */
  levenshteinDistance(s1, s2, { transpositions = false } = {}) {
    const len1 = s1.length;
    const len2 = s2.length;
    if (len1 === 0) return len2;
    if (len2 === 0) return len1;
    if (s1 === s2) return 0;

    const matrix = Array.from({ length: len1 + 1 }, () => Array(len2 + 1).fill(0));
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,       // Suppression
          matrix[i][j - 1] + 1,       // Insertion
          matrix[i - 1][j - 1] + cost // Substitution
        );
        if (transpositions && i > 1 && j > 1 &&
            s1[i - 1] === s2[j - 2] && s1[i - 2] === s2[j - 1]) {
          matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + cost);
        }
      }
    }
    return matrix[len1][len2];
  },

  // ═══════════════════════════════════════════════════════════════
  // DATES CALENDAIRES LOCALES
  // Source unique du « jour » : série quotidienne, repos Leitner, badges, défis.
  // Le jour est celui du fuseau de l'appareil (pas UTC) : minuit local change de jour.
  // ═══════════════════════════════════════════════════════════════

  /**
   * Formate une date en jour calendaire local (YYYY-MM-DD)
   * @param {Date} [date] - Date à formater (défaut : maintenant)
   * @returns {string} - Jour local au format YYYY-MM-DD
   */
  getLocalDateString(date = new Date()) {
    const y = String(date.getFullYear()).padStart(4, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  /**
   * Retourne le jour calendaire local d'aujourd'hui (YYYY-MM-DD)
   * Centralisé pour éviter les duplications
   * @returns {string} - Date au format YYYY-MM-DD
   */
  getToday() {
    return this.getLocalDateString(new Date());
  },

  /**
   * Ajoute des jours à un jour calendaire (arithmétique pure, sans fuseau ni heure d'été)
   * @param {string} dateStr - Jour de départ (YYYY-MM-DD)
   * @param {number} days - Nombre de jours (négatif accepté)
   * @returns {string} - Jour résultant (YYYY-MM-DD)
   */
  addDays(dateStr, days) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const result = new Date(Date.UTC(y, m - 1, d + days));
    return result.toISOString().split('T')[0];
  },

  /**
   * Nombre de jours calendaires entre deux jours (to - from)
   * @param {string} fromStr - Jour de départ (YYYY-MM-DD)
   * @param {string} toStr - Jour d'arrivée (YYYY-MM-DD)
   * @returns {number} - Nombre de jours (négatif si to est avant from)
   */
  daysBetween(fromStr, toStr) {
    const [y1, m1, d1] = fromStr.split('-').map(Number);
    const [y2, m2, d2] = toStr.split('-').map(Number);
    return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
  },

  /**
   * Premier jour (lundi) de la semaine locale contenant la date
   * @param {Date} [date] - Date (défaut : maintenant)
   * @returns {string} - Lundi de la semaine (YYYY-MM-DD)
   */
  getWeekStart(date = new Date()) {
    const dayStr = this.getLocalDateString(date);
    const [y, m, d] = dayStr.split('-').map(Number);
    const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = dimanche
    const sinceMonday = dow === 0 ? 6 : dow - 1;
    return this.addDays(dayStr, -sinceMonday);
  }
};

// Export pour tests Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TextUtils;
}
