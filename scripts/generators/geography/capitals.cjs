/**
 * Générateur de capitales du monde
 *
 * Génère des decks par continent/région
 * Questions bidirectionnelles: pays→capitale et capitale→pays
 *
 * Niveau: cm1-cm2 (France et voisins), collège (Europe), lycée (monde)
 */

const path = require('path');
const fs = require('fs');
const BaseGenerator = require('../base-generator.cjs');

// Normalisation réelle de l'app (src/modules/text-utils.js, script navigateur évalué ici)
const TextUtils = (() => {
  const file = path.join(__dirname, '..', '..', '..', 'src', 'modules', 'text-utils.js');
  const ctx = { module: { exports: {} } };
  new Function('module', fs.readFileSync(file, 'utf8'))(ctx.module);
  return ctx.module.exports;
})();

class CapitalsGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'capitals',
      name: 'Capitales du monde',
      tags: ['geographie', 'capitales', 'pays', 'culture-generale'],
      version: '1.0.0',
      description: 'Capitales des pays du monde par région'
    });

    // Charger les données
    this.countries = require('../data/countries.json');

    // Configuration par région
    this.regionConfig = {
      'Europe': { priority: 1 },
      'Africa': { priority: 2 },
      'Asia': { priority: 2 },
      'Americas': { priority: 2 },
      'Oceania': { priority: 3 }
    };
  }

  /**
   * Génère les cartes pour une région
   * @param {string} region - Nom de la région
   * @returns {Object[]} Cartes
   */
  generateRegionCards(region) {
    const cards = [];
    const regionCountries = this.countries.filter(c => c.region === region);

    for (const country of regionCountries) {
      const capital = country.capital_fr;
      const de = country.grammar.de; // « de la France », « du Danemark », « d'Israël »…
      const code = country.cca2.toLowerCase();

      // Question: Pays → Capitale
      const toCap = {
        id: `cap_${code}_to_cap`,
        question: `Quelle est la capitale ${de} ${country.flag} ?`,
        answer: capital,
        feedback: country.capital_note || `${capital} est la capitale ${de}.`
      };
      const capAlts = this._uniqueAlternatives(capital, country.capital_alt);
      if (capAlts.length > 0) toCap.alternatives = capAlts;
      cards.push(toCap);

      // Question: Capitale → Pays
      // Le nom anglais peut coïncider avec la capitale (Mexico) : ce serait la réponse de l'autre carte du pays
      const countryAlts = this._uniqueAlternatives(country.name.fr, [country.name.en, ...(country.name.fr_alt || [])])
        .filter(a => TextUtils.normalizeText(a) !== TextUtils.normalizeText(capital));
      // La réponse figure dans la question : pas de carte « capitale → pays »
      if (this._answerInQuestion(capital, [country.name.fr, ...countryAlts])) continue;
      const fromCap = {
        id: `cap_${code}_from_cap`,
        question: `${capital} est la capitale de quel pays ?`,
        answer: country.name.fr,
        feedback: country.capital_note || `${capital} est la capitale ${de} ${country.flag}.`
      };
      if (countryAlts.length > 0) fromCap.alternatives = countryAlts;
      cards.push(fromCap);
    }

    return cards;
  }

  /**
   * Vrai quand la réponse de la carte « capitale → pays » se lit dans sa question : le nom du pays
   * ou une de ses formes acceptées est identique à la capitale au sens de TextUtils.normalizeText.
   * @private
   * @param {string} capital - Nom de la capitale
   * @param {string[]} countryForms - Nom du pays et formes acceptées
   * @returns {boolean}
   */
  _answerInQuestion(capital, countryForms) {
    const cap = TextUtils.normalizeText(capital);
    return countryForms.some(f => TextUtils.normalizeText(f) === cap);
  }

  /**
   * Alternatives sans doublon et différentes de la réponse, au sens de
   * TextUtils.normalizeText (casse, accents… ignorés : « Benin » pour « Bénin » est inutile)
   * @private
   */
  _uniqueAlternatives(answer, candidates) {
    const seen = new Set([TextUtils.normalizeText(answer)]);
    const result = [];
    for (const c of candidates) {
      if (!c) continue;
      const key = TextUtils.normalizeText(c);
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(c);
    }
    return result;
  }

  /**
   * Génère un deck pour une région
   * @param {string} region - Nom de la région
   * @returns {Object} Deck complet
   */
  buildRegionDeck(region) {
    const config = this.regionConfig[region] || { priority: 3 };
    const regionCountries = this.countries.filter(c => c.region === region);

    // Noms de régions en français
    const regionNamesFr = {
      'Europe': 'Europe',
      'Africa': 'Afrique',
      'Asia': 'Asie',
      'Americas': 'Amériques',
      'Oceania': 'Océanie'
    };

    // Complément du nom : « d'Afrique », « des Amériques »…
    const regionOf = {
      'Europe': "d'Europe",
      'Africa': "d'Afrique",
      'Asia': "d'Asie",
      'Americas': 'des Amériques',
      'Oceania': "d'Océanie"
    };

    return {
      name: `Capitales - ${regionNamesFr[region] || region}`,
      description: `Capitales des pays ${regionOf[region] || `de ${regionNamesFr[region] || region}`} (${regionCountries.length} pays)`,
      // Culture générale : aucun niveau scolaire
      tags: ['geographie', 'capitales', 'pays', 'culture-generale'],
      settings: {
        sequential: false,
        bidirectional: false // Les questions sont déjà dans les deux sens
      },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { region }
        }
      },
      cards: this.generateRegionCards(region)
    };
  }

  /**
   * Override: Génère un deck par région
   */
  buildDecks(options = {}) {
    const decks = [];
    const regions = ['Europe', 'Africa', 'Asia', 'Americas', 'Oceania'];

    for (const region of regions) {
      decks.push(this.buildRegionDeck(region));
    }

    return decks;
  }

  /**
   * Génère toutes les cartes (utilisé si buildDeck() est appelé directement)
   */
  generate(options = {}) {
    const cards = [];
    const regions = ['Europe', 'Africa', 'Asia', 'Americas', 'Oceania'];

    for (const region of regions) {
      cards.push(...this.generateRegionCards(region));
    }

    return cards;
  }
}

module.exports = CapitalsGenerator;
