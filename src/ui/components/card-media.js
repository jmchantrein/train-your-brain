/**
 * CardMedia - Règle de confidentialité des médias de deck
 *
 * Dépendances: escapeHtml (components.js), PageUtils (résolu à l'appel)
 */

// Un deck (importé ou non) ne déclenche jamais de requête réseau à l'affichage d'une carte : sinon son
// auteur saurait quand et d'où la carte est jouée (pixel de suivi). Seules les sources embarquées
// (data:, blob:) sont rendues ; une source http(s) est remplacée par un lien explicite que l'utilisateur
// choisit d'ouvrir (nouvel onglet, sans Referer). Toute autre source (javascript:, chemin relatif,
// file:...) n'est pas rendue. Utilisé par tous les écrans qui affichent un média de deck.

const CardMedia = {
  /**
   * Normalise une source comme le fait le navigateur (tabulations et retours ligne ignorés, espaces de
   * bord retirés) pour qu'on ne puisse pas masquer « http: » par « ht\ntp: ».
   * @param {*} src
   * @returns {string}
   */
  _normalize(src) {
    return typeof src === 'string' ? src.replace(/[\t\n\r]/g, '').trim() : '';
  },

  /**
   * @param {*} src - Source d'un média de deck
   * @returns {'embedded'|'remote'|'blocked'}
   */
  classify(src) {
    const value = this._normalize(src);
    if (/^(data|blob):/i.test(value)) return 'embedded';
    if (/^(https?:)?\/\//i.test(value)) return 'remote';
    return 'blocked';
  },

  /** @returns {string} Source sûre à mettre dans src="" (chaîne vide si non embarquée) */
  embeddedSrc(src) {
    return this.classify(src) === 'embedded' ? this._normalize(src) : '';
  },

  /** Nom d'hôte d'une source distante (pour l'avertissement) */
  _host(value) {
    try {
      return new URL(value.startsWith('//') ? `https:${value}` : value).hostname || value;
    } catch (e) {
      return value;
    }
  },

  /**
   * Lien explicite vers un média distant, avec avertissement
   * @param {string} src - Source distante
   * @param {'image'|'audio'} kind
   * @returns {string} HTML
   */
  _remoteLink(src, kind) {
    const _t = PageUtils.getTranslator();
    const value = this._normalize(src);
    const href = value.startsWith('//') ? `https:${value}` : value;
    const host = this._host(href);
    const label = _t(kind === 'audio' ? 'media.openRemoteAudio' : 'media.openRemoteImage');
    return `<div class="card-media__remote">
      <span class="card-media__remote-warning">${escapeHtml(_t('media.remoteWarning', { host }))}</span>
      <a class="card-media__remote-link" href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer nofollow">${escapeHtml(label)} (${escapeHtml(host)})</a>
    </div>`;
  },

  /**
   * Image de deck : <img> si embarquée, lien explicite si distante, rien sinon
   * @param {string} src
   * @param {Object} [opts]
   * @param {string} [opts.alt] - Texte alternatif
   * @param {boolean} [opts.link=true] - false : simple espace réservé passif, sans lien (cartes cliquables)
   * @param {string} [opts.attrs] - Attributs supplémentaires déjà échappés (class="...")
   * @returns {string} HTML
   */
  image(src, opts = {}) {
    const kind = this.classify(src);
    if (kind === 'embedded') {
      return `<img src="${escapeHtml(this._normalize(src))}" alt="${escapeHtml(opts.alt || '')}"${opts.attrs ? ' ' + opts.attrs : ''}>`;
    }
    if (kind === 'remote') {
      if (opts.link === false) {
        const text = PageUtils.getTranslator()('media.remoteImagePlaceholder');
        return `<span class="card-media__placeholder" title="${escapeHtml(text)}">🖼️ ${escapeHtml(text)}</span>`;
      }
      return this._remoteLink(src, 'image');
    }
    return '';
  },

  /**
   * Son de deck : <audio controls> si embarqué, lien explicite si distant, rien sinon
   * @param {string} src
   * @param {Object} [opts]
   * @param {string} [opts.attrs] - Attributs supplémentaires déjà échappés
   * @returns {string} HTML
   */
  audio(src, opts = {}) {
    const kind = this.classify(src);
    if (kind === 'embedded') {
      return `<audio controls src="${escapeHtml(this._normalize(src))}"${opts.attrs ? ' ' + opts.attrs : ''}></audio>`;
    }
    if (kind === 'remote') return this._remoteLink(src, 'audio');
    return '';
  }
};
