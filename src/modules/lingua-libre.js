/**
 * Module LinguaLibre - Récupération d'audio de prononciation
 *
 * Utilise Lingua Libre (projet Wikimedia) pour obtenir des prononciations
 * audio sous licence libre pour les mots dans différentes langues. Chaque locuteur choisit la
 * licence de ses enregistrements (certaines exigent l'attribution) : la licence et l'auteur
 * renvoyés par l'API sont conservés avec l'audio, jamais présumés (voir audioAttribution).
 *
 * API: SPARQL via Wikidata Query Service
 * Fichiers: Hébergés sur Wikimedia Commons
 */

const LinguaLibre = {
  // Endpoint SPARQL de Wikidata
  SPARQL_ENDPOINT: 'https://query.wikidata.org/sparql',

  // ═══════════════════════════════════════════════════════════════
  // LICENCES
  // ═══════════════════════════════════════════════════════════════

  /** Licence enregistrée quand l'API n'en renvoie aucune : jamais CC0 par défaut */
  UNKNOWN_LICENSE: 'Unknown',

  /**
   * Réduit un champ de métadonnées Commons (l'auteur y est du HTML, ex. un lien vers la page
   * utilisateur) à du texte brut, sans balise.
   * @param {*} value - Valeur renvoyée par l'API (extmetadata.*.value)
   * @returns {string|null} Texte nettoyé, ou null si vide ou « Unknown »
   */
  cleanAttribution(value) {
    if (typeof value !== 'string') return null;
    const text = value
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#0*39;|&#x0*27;/gi, "'")
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200);
    return text === '' || text.toLowerCase() === 'unknown' ? null : text;
  },

  /**
   * Métadonnées d'attribution à conserver avec un enregistrement (audio d'un mot, média d'une carte).
   * @param {{license: (string|undefined), artist: (string|undefined), sourceUrl: (string|undefined)}} [info] - Résultat de findAudio
   * @returns {{license: string, artist: (string|undefined), sourceUrl: (string|undefined)}}
   */
  audioAttribution(info) {
    const attribution = {
      license: this.cleanAttribution(info?.license) || this.UNKNOWN_LICENSE
    };
    const artist = this.cleanAttribution(info?.artist);
    if (artist) attribution.artist = artist;
    if (typeof info?.sourceUrl === 'string' && /^https?:\/\//i.test(info.sourceUrl)) {
      attribution.sourceUrl = info.sourceUrl;
    }
    return attribution;
  },

  /**
   * Ligne d'affichage « auteur - licence » (texte brut, à échapper avant insertion dans le HTML)
   * @param {({license: (string|undefined), artist: (string|undefined)}|null)} attribution
   * @returns {string}
   */
  describeAttribution(attribution) {
    if (!attribution) return '';
    const artist = this.cleanAttribution(attribution.artist) || 'auteur inconnu';
    const license = this.cleanAttribution(attribution.license) || 'licence inconnue';
    return `${artist} - ${license === this.UNKNOWN_LICENSE ? 'licence inconnue' : license}`;
  },

  /**
   * Liste l'attribution de chaque enregistrement d'un deck (multilingue : words[].translations[lang].audio ;
   * dictée : cards[].media de type audio).
   * @param {Object} deck
   * @returns {Array<{word: string, lang: (string|undefined), license: string, artist: (string|undefined), sourceUrl: (string|undefined)}>}
   */
  listAttributions(deck) {
    const entries = [];
    const push = (word, lang, audio) => {
      const a = this.audioAttribution(audio);
      entries.push({ word, lang, license: a.license, artist: a.artist, sourceUrl: a.sourceUrl });
    };
    for (const w of (deck?.words || [])) {
      for (const [lang, tr] of Object.entries(w.translations || {})) {
        if (tr && tr.audio) push(tr.text || w.id, lang, tr.audio);
      }
    }
    for (const card of (deck?.cards || [])) {
      if (card && card.media && typeof card.media === 'object' && card.media.type === 'audio') {
        push(card.answer, deck.language, card.media);
      }
    }
    return entries;
  },

  /**
   * Licences considérées comme "permissives" (partageables sans contrainte)
   * Ces licences permettent une réutilisation libre, y compris commerciale
   */
  PERMISSIVE_LICENSES: [
    'CC0',                    // Public Domain
    'CC-Zero',
    'Public domain',
    'PD',
    'CC BY 4.0',              // Attribution only
    'CC BY 3.0',
    'CC BY 2.5',
    'CC BY 2.0',
    'CC BY',
  ],

  /**
   * Vérifie si une licence est permissive (partage libre)
   * @param {string} license - Nom court de la licence
   * @returns {boolean}
   */
  isPermissiveLicense(license) {
    if (!license) return false;
    const normalizedLicense = license.trim().toUpperCase();
    return this.PERMISSIVE_LICENSES.some(l =>
      normalizedLicense.includes(l.toUpperCase())
    );
  },

  // Codes Wikidata pour les langues
  LANGUAGE_CODES: {
    'fr': 'Q150',      // Français
    'en': 'Q1860',     // Anglais
    'es': 'Q1321',     // Espagnol
    'de': 'Q188',      // Allemand
    'it': 'Q652',      // Italien
    'pt': 'Q5146',     // Portugais
    'nl': 'Q7411',     // Néerlandais
    'ru': 'Q7737',     // Russe
    'zh': 'Q7850',     // Chinois
    'ja': 'Q5287',     // Japonais
    'ko': 'Q9176',     // Coréen
    'ar': 'Q13955',    // Arabe
    'pl': 'Q809',      // Polonais
    'sv': 'Q9027',     // Suédois
    'ca': 'Q7026',     // Catalan
    'oc': 'Q14185',    // Occitan
    'br': 'Q12107',    // Breton
    'eu': 'Q8752',     // Basque
  },

  // Labels pour l'UI
  LANGUAGE_LABELS: {
    'fr': 'Français',
    'en': 'English',
    'es': 'Español',
    'de': 'Deutsch',
    'it': 'Italiano',
    'pt': 'Português',
    'nl': 'Nederlands',
    'ru': 'Русский',
    'zh': '中文',
    'ja': '日本語',
    'ko': '한국어',
    'ar': 'العربية',
    'pl': 'Polski',
    'sv': 'Svenska',
    'ca': 'Català',
    'oc': 'Occitan',
    'br': 'Brezhoneg',
    'eu': 'Euskara',
  },

  // Mapping des codes Lingua Libre (3 lettres) vers ISO 639-1 (2 lettres)
  // Lingua Libre utilise des codes comme "Fra", "Eng", "Spa" dans les URLs des listes
  LINGUA_LIBRE_TO_ISO: {
    'fra': 'fr',
    'eng': 'en',
    'spa': 'es',
    'deu': 'de',
    'ita': 'it',
    'por': 'pt',
    'nld': 'nl',
    'rus': 'ru',
    'zho': 'zh',
    'jpn': 'ja',
    'kor': 'ko',
    'ara': 'ar',
    'pol': 'pl',
    'swe': 'sv',
    'cat': 'ca',
    'oci': 'oc',
    'bre': 'br',
    'eus': 'eu',
  },

  /**
   * Convertit un code langue Lingua Libre (3 lettres) en ISO 639-1 (2 lettres)
   * @param {string} linguaCode - Code Lingua Libre (ex: "fra", "eng")
   * @returns {string} Code ISO (ex: "fr", "en")
   */
  _linguaToIso(linguaCode) {
    if (!linguaCode) return 'fr';
    const code = linguaCode.toLowerCase();
    // Si c'est déjà un code ISO (2 lettres), le retourner tel quel
    if (code.length === 2) return code;
    return this.LINGUA_LIBRE_TO_ISO[code] || code.slice(0, 2);
  },

  /**
   * Recherche l'audio d'un mot sur Lingua Libre
   * @param {string} word - Le mot à chercher
   * @param {string} langCode - Code langue (fr, en, es, ...)
   * @param {Object} options - Options de recherche
   * @param {boolean} options.permissiveOnly - Si true, ne retourne que les fichiers sous licence permissive (CC0, CC BY)
   * @returns {Promise<{url: string, speaker: string, license: (string|undefined), artist: (string|undefined)}|null>} URL de l'audio ou null
   */
  async findAudio(word, langCode, options = {}) {
    const wikidataLang = this.LANGUAGE_CODES[langCode];
    if (!wikidataLang) {
      throw new Error(`Langue non supportée: ${langCode}`);
    }

    // Normaliser le mot (minuscules, trim)
    const normalizedWord = word.trim().toLowerCase();

    try {
      // Chercher sur Wikimedia Commons via Wikidata (la licence est lue dans la réponse, jamais présumée ; filtrage permissif optionnel)
      return await this._queryWikidataCommons(normalizedWord, langCode, wikidataLang, options);
    } catch (error) {
      console.error(`Erreur recherche audio pour "${word}":`, error);
      return null;
    }
  },

  /**
   * Recherche sur Wikimedia Commons via l'API
   * @param {string} word - Mot à chercher
   * @param {string} langCode - Code langue
   * @param {string} wikidataLang - Code Wikidata
   * @param {Object} options - Options de filtrage
   * @param {boolean} options.permissiveOnly - Si true, filtre les licences non-permissives
   */
  async _queryWikidataCommons(word, langCode, wikidataLang, options = {}) {
    // Rechercher des fichiers de prononciation sur Commons
    const searchTerms = [
      `${langCode}-${word}.ogg`,
      `${langCode.toUpperCase()}-${word}.ogg`,
      `LL-Q${wikidataLang.substring(1)}-${word}`,
    ];

    for (const searchTerm of searchTerms) {
      const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&srnamespace=6&format=json&origin=*`;

      try {
        const response = await fetch(url);
        if (!response.ok) continue;

        const data = await response.json();
        const results = data.query?.search || [];

        for (const result of results) {
          const title = result.title;
          if (title.endsWith('.ogg') || title.endsWith('.mp3') || title.endsWith('.wav')) {
            // Obtenir l'URL directe du fichier avec licence
            const fileInfo = await this._getCommonsFileUrl(title);
            if (fileInfo) {
              // Filtrer par licence si demandé
              if (options.permissiveOnly && !this.isPermissiveLicense(fileInfo.license)) {
                continue; // Passer au fichier suivant
              }
              return {
                url: fileInfo.url,
                speaker: 'Wikimedia Commons',
                license: fileInfo.license,
                artist: fileInfo.artist,
                sourceUrl: fileInfo.sourceUrl
              };
            }
          }
        }
      } catch (e) {
        continue;
      }
    }

    // Dernière tentative: recherche générique
    return await this._searchCommonsGeneric(word, langCode, options);
  },

  /**
   * Recherche générique sur Commons
   * @param {string} word - Mot à chercher
   * @param {string} langCode - Code langue
   * @param {Object} options - Options de filtrage
   * @param {boolean} options.permissiveOnly - Si true, filtre les licences non-permissives
   */
  async _searchCommonsGeneric(word, langCode, options = {}) {
    const searchQuery = `"${word}" pronunciation ${this.LANGUAGE_LABELS[langCode] || langCode}`;
    const url = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchQuery)}&srnamespace=6&format=json&origin=*&srlimit=10`;

    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const data = await response.json();
      const results = data.query?.search || [];

      for (const result of results) {
        const title = result.title;
        // Vérifier que c'est un fichier audio et qu'il correspond au mot
        if ((title.endsWith('.ogg') || title.endsWith('.mp3')) &&
            title.toLowerCase().includes(word.toLowerCase())) {
          const fileInfo = await this._getCommonsFileUrl(title);
          if (fileInfo) {
            // Filtrer par licence si demandé
            if (options.permissiveOnly && !this.isPermissiveLicense(fileInfo.license)) {
              continue;
            }
            return {
              url: fileInfo.url,
              speaker: 'Wikimedia Commons',
              license: fileInfo.license,
              artist: fileInfo.artist,
              sourceUrl: fileInfo.sourceUrl
            };
          }
        }
      }
    } catch (e) {
      // Silencieux
    }

    return null;
  },

  /**
   * Obtient l'URL directe d'un fichier sur Wikimedia Commons avec info de licence
   * @param {string} title - Titre du fichier sur Commons
   * @returns {Promise<{url: string, license: string, artist: (string|null), sourceUrl: (string|undefined)}|null>}
   *   license vaut UNKNOWN_LICENSE si l'API n'en renvoie pas ; artist est du texte brut ou null
   */
  async _getCommonsFileUrl(title) {
    // Ajouter extmetadata pour obtenir les infos de licence
    const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`;

    try {
      const response = await fetch(url);
      if (!response.ok) return null;

      const data = await response.json();
      const pages = data.query?.pages || {};

      for (const page of Object.values(pages)) {
        if (page.imageinfo && page.imageinfo[0]) {
          const info = page.imageinfo[0];
          const extmetadata = info.extmetadata || {};

          return {
            url: info.url,
            license: this.cleanAttribution(extmetadata.LicenseShortName?.value) || this.UNKNOWN_LICENSE,
            artist: this.cleanAttribution(extmetadata.Artist?.value),
            sourceUrl: typeof info.descriptionurl === 'string' && /^https?:\/\//i.test(info.descriptionurl)
              ? info.descriptionurl : undefined
          };
        }
      }
    } catch (e) {
      // Silencieux
    }

    return null;
  },

  /**
   * Télécharge un fichier audio et le convertit en base64
   * @param {string} url - URL du fichier audio
   * @returns {Promise<{data: string, format: string}>} Base64 et format
   */
  async downloadAsBase64(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const blob = await response.blob();
      const format = this._getFormatFromMime(blob.type) || this._getFormatFromUrl(url);

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          // Extraire le base64 sans le préfixe data:...
          const base64 = reader.result.split(',')[1];
          resolve({ data: base64, format });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error(`Erreur téléchargement audio:`, error);
      throw error;
    }
  },

  /**
   * Détermine le format audio depuis le type MIME
   */
  _getFormatFromMime(mimeType) {
    const mimeMap = {
      'audio/ogg': 'ogg',
      'audio/mpeg': 'mp3',
      'audio/mp3': 'mp3',
      'audio/wav': 'wav',
      'audio/webm': 'webm',
    };
    return mimeMap[mimeType];
  },

  /**
   * Détermine le format audio depuis l'URL
   */
  _getFormatFromUrl(url) {
    const ext = url.split('.').pop().toLowerCase().split('?')[0];
    return ['ogg', 'mp3', 'wav', 'webm'].includes(ext) ? ext : 'ogg';
  },

  /**
   * Génère un deck de dictée complet
   * @param {string[]} words - Liste des mots
   * @param {string} langCode - Code langue
   * @param {Object} deckInfo - Infos du deck (name, description, category)
   * @param {Function} onProgress - Callback de progression (word, index, total, status)
   * @returns {Promise<{deck: Object, errors: string[]}>}
   */
  async generateDictationDeck(words, langCode, deckInfo, onProgress = null) {
    const errors = [];
    const cards = [];
    const total = words.length;

    for (let i = 0; i < words.length; i++) {
      const word = words[i].trim();
      if (!word) continue;

      if (onProgress) {
        onProgress(word, i, total, 'searching');
      }

      try {
        // Chercher l'audio
        const audioInfo = await this.findAudio(word, langCode);

        if (!audioInfo) {
          errors.push(`"${word}" : audio non trouvé sur Lingua Libre/Wikimedia`);
          if (onProgress) {
            onProgress(word, i, total, 'not_found');
          }
          continue;
        }

        if (onProgress) {
          onProgress(word, i, total, 'downloading');
        }

        // Télécharger et convertir en base64
        const audioData = await this.downloadAsBase64(audioInfo.url);

        // Créer la carte avec toutes les propriétés Leitner requises
        cards.push({
          id: `dict_${this._slugify(word)}_${i}`,
          question: this._getQuestionTemplate(langCode),
          answer: word,
          type: 'exact_text',
          alternatives: this._generateAlternatives(word),
          media: {
            type: 'audio',
            format: audioData.format,
            data: audioData.data,
            ...this.audioAttribution(audioInfo)
          },
          hint: `${word.length} lettres`,
          // Propriétés Leitner
          box: 'never_played',
          latencyThreshold: null,
          bestResponseTimeMs: null,
          lastResponseTimeMs: null,
          restUntil: null,
          restDays: 0,
          timesPlayed: 0,
          timesCorrect: 0
        });

        if (onProgress) {
          onProgress(word, i, total, 'success');
        }

      } catch (error) {
        errors.push(`"${word}" : ${error.message}`);
        if (onProgress) {
          onProgress(word, i, total, 'error');
        }
      }

      // Petit délai pour éviter de surcharger les APIs
      await this._sleep(200);
    }

    // Construire le deck
    const deck = {
      id: deckInfo.id || `dictee-${langCode}-${Date.now().toString(36)}`,
      name: deckInfo.name || `Dictée ${this.LANGUAGE_LABELS[langCode] || langCode}`,
      description: deckInfo.description || `Dictée de ${cards.length} mots en ${this.LANGUAGE_LABELS[langCode] || langCode}`,
      category: deckInfo.category || ['langues', 'dictee', langCode],
      tags: deckInfo.tags || ['langues', 'dictee', langCode],
      difficulty: deckInfo.difficulty || 1,
      language: langCode,
      settings: {
        bidirectional: false,
        sequential: false
      },
      cards
    };

    return { deck, errors };
  },

  /**
   * Template de question selon la langue
   */
  _getQuestionTemplate(langCode) {
    const templates = {
      'fr': 'Écris le mot que tu entends',
      'en': 'Write the word you hear',
      'es': 'Escribe la palabra que escuchas',
      'de': 'Schreibe das Wort, das du hörst',
      'it': 'Scrivi la parola che senti',
      'pt': 'Escreva a palavra que você ouve',
    };
    return templates[langCode] || templates['en'];
  },

  /**
   * Génère des alternatives (majuscule, minuscule, etc.)
   */
  _generateAlternatives(word) {
    const alts = new Set();
    alts.add(word.toLowerCase());
    alts.add(word.toUpperCase());
    alts.add(word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
    // Retirer le mot original
    alts.delete(word);
    return Array.from(alts);
  },

  /**
   * Convertit un texte en slug
   */
  _slugify(text) {
    return TextUtils.slugify(text, { separator: '_', unicode: true });
  },

  /**
   * Pause async
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Convertit un deck en YAML
   */
  deckToYaml(deck) {
    // Utiliser le module YAML si disponible, sinon formatter manuellement
    if (typeof YAML !== 'undefined' && YAML.stringify) {
      return YAML.stringify(deck);
    }

    // Formatage manuel simplifié
    let yaml = '';
    yaml += `id: "${deck.id}"\n`;
    yaml += `name: "${deck.name}"\n`;
    yaml += `description: "${deck.description}"\n`;
    yaml += `category:\n`;
    deck.category.forEach(cat => {
      yaml += `  - "${cat}"\n`;
    });
    yaml += `difficulty: ${deck.difficulty}\n`;
    yaml += `settings:\n`;
    yaml += `  bidirectional: ${deck.settings.bidirectional}\n`;
    yaml += `  sequential: ${deck.settings.sequential}\n`;
    yaml += `\ncards:\n`;

    deck.cards.forEach(card => {
      yaml += `  - id: "${card.id}"\n`;
      yaml += `    question: "${card.question}"\n`;
      yaml += `    answer: "${card.answer}"\n`;
      if (card.alternatives && card.alternatives.length > 0) {
        yaml += `    alternatives:\n`;
        card.alternatives.forEach(alt => {
          yaml += `      - "${alt}"\n`;
        });
      }
      if (card.hint) {
        yaml += `    hint: "${card.hint}"\n`;
      }
      if (card.media) {
        yaml += `    media:\n`;
        yaml += `      type: "${card.media.type}"\n`;
        yaml += `      format: "${card.media.format}"\n`;
        if (card.media.license) yaml += `      license: ${JSON.stringify(String(card.media.license))}\n`;
        if (card.media.artist) yaml += `      artist: ${JSON.stringify(String(card.media.artist))}\n`;
        if (card.media.sourceUrl) yaml += `      sourceUrl: ${JSON.stringify(String(card.media.sourceUrl))}\n`;
        yaml += `      data: |\n`;
        // Découper le base64 en lignes de 76 caractères
        const base64 = card.media.data;
        for (let i = 0; i < base64.length; i += 76) {
          yaml += `        ${base64.substring(i, i + 76)}\n`;
        }
      }
    });

    return yaml;
  },

  // ═══════════════════════════════════════════════════════════════
  // VOCABULAIRE THÉMATIQUE MULTILINGUE
  // ═══════════════════════════════════════════════════════════════

  /**
   * Récupère la liste des thèmes disponibles pour une langue
   * Les listes sont de la forme List:{LangCode}/{ThemeName}
   *
   * @param {string} langCode - Code langue (fr, en, es, ...)
   * @returns {Promise<Array<{id: string, name: string, langCode: string}>>}
   */
  async getThematicLists(langCode) {
    // Utiliser le code langue avec majuscule (Fra, Eng, etc.) comme sur Lingua Libre
    const langCodeMap = {
      'fr': 'Fra',
      'en': 'Eng',
      'es': 'Spa',
      'de': 'Deu',
      'it': 'Ita',
      'pt': 'Por',
      'nl': 'Nld',
      'ru': 'Rus',
      'zh': 'Cmn',
      'ja': 'Jpn',
      'ko': 'Kor',
      'ar': 'Ara',
      'pl': 'Pol',
      'sv': 'Swe',
      'ca': 'Cat',
      'oc': 'Oci',
      'br': 'Bre',
      'eu': 'Eus'
    };

    const langPrefix = langCodeMap[langCode] || langCode.charAt(0).toUpperCase() + langCode.slice(1).toLowerCase();
    const searchPrefix = `List:${langPrefix}/`;

    // Utiliser l'API search pour trouver les listes thématiques par préfixe
    // Note: Ne pas utiliser intitle: car cela ne fonctionne pas avec ce préfixe
    const apiUrl = `https://lingualibre.org/api.php?action=query&list=search&srsearch=${encodeURIComponent(searchPrefix)}&srlimit=100&format=json&origin=*`;

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const results = data.query?.search || [];

      // Filtrer et formater les résultats
      const lists = results
        .filter(page => page.title.startsWith('List:'))
        .map(page => {
          const fullId = page.title;
          const name = page.title.replace(`List:${langPrefix}/`, '').replace(/_/g, ' ');
          return {
            id: fullId,
            name: name,
            langCode: langCode
          };
        })
        // Filtrer les listes techniques
        .filter(list => {
          const lower = list.name.toLowerCase();
          return !lower.includes('lemmas-without-audio') &&
                 !lower.includes('test') &&
                 !lower.includes('sandbox') &&
                 !lower.includes('all lemmas') &&
                 list.name.length > 0;
        })
        // Trier par nom
        .sort((a, b) => a.name.localeCompare(b.name, langCode));

      return lists;
    } catch (error) {
      console.error(`Erreur récupération listes thématiques pour ${langCode}:`, error);
      throw error; // Propager l'erreur pour afficher un message
    }
  },

  /**
   * Récupère les mots d'une liste thématique avec leur transcription exacte
   *
   * @param {string} listId - Identifiant de la liste (ex: "List:Fra/Légumes")
   * @param {Object} options - Options de retour
   * @param {boolean} options.withStats - Si true, retourne aussi les statistiques de filtrage
   * @returns {Promise<Array<{word: string, transcription: string}>|{words: Array, stats: Object}>}
   */
  async getWordsFromList(listId, options = {}) {
    // Récupérer le contenu de la page wiki
    const apiUrl = `https://lingualibre.org/api.php?action=query&titles=${encodeURIComponent(listId)}&prop=revisions&rvprop=content&format=json&origin=*`;

    // Statistiques de filtrage
    const stats = {
      totalCandidates: 0,
      filteredTechnical: 0,
      validWords: 0
    };

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const pages = data.query?.pages || {};
      const pageId = Object.keys(pages)[0];

      if (pageId === '-1') {
        throw new Error(`Liste non trouvée: ${listId}`);
      }

      const content = pages[pageId]?.revisions?.[0]?.['*'] || '';

      // Parser le contenu pour extraire les mots
      // Format typique: lignes avec {{Q|xxx}} ou texte simple
      const words = [];
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('==') || trimmed.startsWith('{{')) continue;

        // Enlever les marqueurs de liste wiki et formattage
        // * = liste non ordonnée, # = liste ordonnée
        let word = trimmed
          .replace(/^[*#]+\s*/, '')  // Enlever * ou # (marqueurs de liste wiki)
          .replace(/\[\[([^\]|]+)(\|[^\]]+)?\]\]/g, '$1') // [[word]] ou [[word|display]]
          .replace(/'''?/g, '')
          .trim();

        // Compter les candidats (mots non vides après nettoyage)
        if (word && word.length > 0) {
          stats.totalCandidates++;

          // Pas de lignes techniques
          if (word.startsWith('|') || word.includes('{{') || word.length >= 100) {
            stats.filteredTechnical++;
            continue;
          }

          // Mot valide
          stats.validWords++;
          words.push({
            word: word,
            transcription: word // La transcription exacte = le mot tel qu'écrit
          });
        }
      }

      // Retourner avec ou sans stats selon l'option
      if (options.withStats) {
        return { words, stats };
      }
      return words;
    } catch (error) {
      console.error(`Erreur récupération mots de ${listId}:`, error);
      if (options.withStats) {
        return { words: [], stats };
      }
      return [];
    }
  },

  /**
   * Récupère les traductions d'un mot via Wikidata
   *
   * @param {string} word - Le mot à traduire
   * @param {string} sourceLang - Langue source
   * @param {string[]} targetLangs - Langues cibles
   * @returns {Promise<Object<string, string>>} Traductions par langue
   */
  async getTranslations(word, sourceLang, targetLangs) {
    const translations = {};
    translations[sourceLang] = word; // Le mot source est toujours inclus

    // Requête SPARQL pour trouver l'entité et ses labels
    const query = `
      SELECT ?item ?itemLabel WHERE {
        ?item rdfs:label "${word}"@${sourceLang} .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "${targetLangs.join(',')},${sourceLang}" . }
      }
      LIMIT 1
    `;

    try {
      const url = `${this.SPARQL_ENDPOINT}?query=${encodeURIComponent(query)}&format=json`;
      console.log(`[LinguaLibre] Fetching translations for "${word}" (${sourceLang} -> ${targetLangs.join(',')})`);

      const response = await fetch(url, {
        headers: { 'Accept': 'application/sparql-results+json' }
      });

      if (!response.ok) {
        console.warn(`[LinguaLibre] SPARQL query failed: ${response.status}`);
        return translations;
      }

      const data = await response.json();
      const results = data.results?.bindings || [];

      if (results.length === 0) {
        console.warn(`[LinguaLibre] No Wikidata entity found for "${word}"`);
        return translations;
      }

      const itemId = results[0].item?.value?.split('/').pop();
      console.log(`[LinguaLibre] Found Wikidata entity: ${itemId}`);

      if (itemId) {
        // Récupérer les labels dans toutes les langues cibles
        const labelsUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${itemId}&props=labels&languages=${targetLangs.join('|')}&format=json&origin=*`;
        const labelsResponse = await fetch(labelsUrl);

        if (labelsResponse.ok) {
          const labelsData = await labelsResponse.json();
          const labels = labelsData.entities?.[itemId]?.labels || {};

          console.log(`[LinguaLibre] Labels found:`, Object.keys(labels));

          for (const lang of targetLangs) {
            if (labels[lang]) {
              translations[lang] = labels[lang].value;
              console.log(`[LinguaLibre] Translation ${lang}: ${labels[lang].value}`);
            } else {
              console.warn(`[LinguaLibre] No label for ${lang}`);
            }
          }
        }
      }
    } catch (error) {
      console.error(`[LinguaLibre] Error getting translations for "${word}":`, error);
    }

    return translations;
  },

  /**
   * Génère un deck multilingue à partir d'une liste thématique
   *
   * @param {string} listId - ID de la liste (ex: "List:Fra/Légumes")
   * @param {string[]} languages - Langues à inclure (ex: ['fr', 'en', 'es'])
   * @param {Object} options - Options de génération
   * @param {boolean} options.permissiveOnly - Si true, ne télécharge que les audios sous licence permissive (CC0, CC BY)
   * @param {Function} onProgress - Callback de progression
   * @returns {Promise<{deck: Object, errors: string[]}>}
   */
  async generateMultilingualDeck(listId, languages, options = {}, onProgress = null) {
    const permissiveOnly = options.permissiveOnly || false;
    const errors = [];
    const words = [];

    // Extraire le code langue de la liste
    const listMatch = listId.match(/List:(\w+)\//);
    const rawLangCode = listMatch ? listMatch[1].toLowerCase() : 'fr';
    const listLangCode = this._linguaToIso(rawLangCode);
    console.log(`[LinguaLibre] List language: ${rawLangCode} -> ${listLangCode}`);

    // 1. Récupérer les mots de la liste avec statistiques
    if (onProgress) onProgress({ phase: 'fetching_list', progress: 0 });

    const result = await this.getWordsFromList(listId, { withStats: true });
    const { words: listWords, stats } = result;

    if (listWords.length === 0) {
      // Message d'erreur spécifique selon le type de filtrage
      if (stats.totalCandidates === 0) {
        errors.push(`Liste vide ou inaccessible: ${listId}`);
      } else {
        errors.push(`Aucun mot valide trouvé dans la liste ${listId} (${stats.filteredTechnical} entrées techniques filtrées)`);
      }
      return { deck: null, errors };
    }

    const total = listWords.length;

    // 2. Pour chaque mot, récupérer traductions et audio
    for (let i = 0; i < listWords.length; i++) {
      const { word, transcription } = listWords[i];

      if (onProgress) {
        onProgress({
          phase: 'processing_word',
          progress: (i + 1) / total,
          current: i + 1,
          total,
          word
        });
      }

      try {
        // Récupérer les traductions
        const translations = await this.getTranslations(word, listLangCode, languages);

        // Structure du mot multilingue
        const multiWord = {
          id: this._slugify(word),
          translations: {}
        };

        // Pour chaque langue, récupérer l'audio si disponible
        for (const lang of languages) {
          const text = translations[lang] || word;

          multiWord.translations[lang] = {
            text: text,
            alternatives: this._generateAlternatives(text),
            audio: null // Sera rempli si on trouve l'audio
          };

          // Essayer de récupérer l'audio (avec filtrage licence si demandé)
          try {
            const audioInfo = await this.findAudio(text, lang, { permissiveOnly });
            if (audioInfo) {
              const audioData = await this.downloadAsBase64(audioInfo.url);
              multiWord.translations[lang].audio = {
                format: audioData.format,
                data: audioData.data,
                ...this.audioAttribution(audioInfo)
              };
            }
          } catch (audioError) {
            // Audio non trouvé, pas grave
          }
        }

        words.push(multiWord);

        // Petit délai pour éviter de surcharger les APIs
        await this._sleep(100);

      } catch (error) {
        errors.push(`Erreur pour "${word}": ${error.message}`);
      }
    }

    if (words.length === 0) {
      errors.push('Aucun mot n\'a pu être traité');
      return { deck: null, errors };
    }

    // 3. Construire le deck
    const listName = listId.replace(/^List:\w+\//, '').replace(/_/g, ' ');

    const deck = {
      id: `vocab-${this._slugify(listName)}-${Date.now().toString(36)}`,
      name: options.name || listName,
      type: 'multilingual',
      source: 'lingualibre',
      sourceList: listId,
      description: options.description || `Vocabulaire: ${listName}`,
      languages: languages,
      difficulty: options.difficulty || 1,
      settings: {
        bidirectional: false,
        sequential: false
      },
      words: words,
      createdAt: new Date().toISOString()
    };

    // Initialiser la progression Leitner pour chaque mot
    if (typeof Multilingual !== 'undefined') {
      Multilingual.initializeDeckProgress(deck);
    }

    if (onProgress) onProgress({ phase: 'complete', progress: 1 });

    return { deck, errors };
  },

};

// Export pour tests Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LinguaLibre;
}
