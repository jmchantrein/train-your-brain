/**
 * Générateur de conversions d'unités
 *
 * Génère des decks pour le calcul mental :
 * - Longueurs (km, m, cm, mm)
 * - Masses (kg, g, mg)
 * - Volumes (L, dL, cL, mL)
 * - Temps (h, min, s)
 *
 * Niveau: CE2 à 6ème
 */

const BaseGenerator = require('../base-generator.cjs');

class ConversionsGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'conversions',
      name: 'Conversions d\'unités',
      tags: ['math', 'conversions', 'unites', 'calcul-mental'],
      version: '1.0.0',
      description: 'Conversions entre unités de mesure'
    });

    // Ressources pédagogiques communes
    this.commonResources = [
      this.createSummary(
        'Les conversions d\'unités',
        `Les **conversions** permettent d'exprimer une même mesure avec différentes unités.

Le système métrique est basé sur des puissances de 10 :
- kilo (k) = 1000
- hecto (h) = 100
- déca (da) = 10
- unité = 1
- déci (d) = 0,1
- centi (c) = 0,01
- milli (m) = 0,001

Convertir c'est multiplier ou diviser par 10, 100, 1000...`,
        true
      ),
      this.createWikipediaLink('Système métrique', 'Système_métrique'),
      this.createGlossary({
        'Conversion': 'Changement d\'unité pour une même mesure',
        'Préfixe': 'Symbole indiquant le multiple (k, c, m...)',
        'Unité SI': 'Unité du Système International',
        'Multiple': 'Unité plus grande (km, kg)',
        'Sous-multiple': 'Unité plus petite (mm, mg)'
      })
    ];
  }

  /**
   * Génère les cartes pour les longueurs
   */
  generateLengthConversions() {
    const cards = [];

    // km ↔ m
    for (const km of [1, 2, 3, 5, 10, 0.5, 0.1, 1.5, 2.5]) {
      const m = km * 1000;
      cards.push({
        id: `conv_km_to_m_${km}`.replace('.', '_'),
        question: `${km} km = ? m`,
        answer: String(m),
        feedback: `${km} km × 1000 = ${m} m`
      });
    }

    for (const m of [1000, 2000, 5000, 500, 100, 250, 1500, 3500]) {
      const km = m / 1000;
      cards.push({
        id: `conv_m_to_km_${m}`,
        question: `${m} m = ? km`,
        answer: String(km),
        feedback: `${m} m ÷ 1000 = ${km} km`
      });
    }

    // m ↔ cm
    for (const m of [1, 2, 5, 10, 0.5, 1.5, 0.25, 3.5]) {
      const cm = m * 100;
      cards.push({
        id: `conv_m_to_cm_${m}`.replace('.', '_'),
        question: `${m} m = ? cm`,
        answer: String(cm),
        feedback: `${m} m × 100 = ${cm} cm`
      });
    }

    for (const cm of [100, 200, 50, 150, 250, 500, 75, 125]) {
      const m = cm / 100;
      cards.push({
        id: `conv_cm_to_m_${cm}`,
        question: `${cm} cm = ? m`,
        answer: String(m),
        feedback: `${cm} cm ÷ 100 = ${m} m`
      });
    }

    // cm ↔ mm
    for (const cm of [1, 2, 5, 10, 15, 20, 0.5, 2.5]) {
      const mm = cm * 10;
      cards.push({
        id: `conv_cm_to_mm_${cm}`.replace('.', '_'),
        question: `${cm} cm = ? mm`,
        answer: String(mm),
        feedback: `${cm} cm × 10 = ${mm} mm`
      });
    }

    return cards;
  }

  /**
   * Génère les cartes pour les masses
   */
  generateMassConversions() {
    const cards = [];

    // kg ↔ g
    for (const kg of [1, 2, 5, 0.5, 0.1, 1.5, 2.5, 0.25]) {
      const g = kg * 1000;
      cards.push({
        id: `conv_kg_to_g_${kg}`.replace('.', '_'),
        question: `${kg} kg = ? g`,
        answer: String(g),
        feedback: `${kg} kg × 1000 = ${g} g`
      });
    }

    for (const g of [1000, 2000, 500, 250, 100, 1500, 750, 3000]) {
      const kg = g / 1000;
      cards.push({
        id: `conv_g_to_kg_${g}`,
        question: `${g} g = ? kg`,
        answer: String(kg),
        feedback: `${g} g ÷ 1000 = ${kg} kg`
      });
    }

    // g ↔ mg
    for (const g of [1, 2, 5, 0.5, 0.1, 10]) {
      const mg = g * 1000;
      cards.push({
        id: `conv_g_to_mg_${g}`.replace('.', '_'),
        question: `${g} g = ? mg`,
        answer: String(mg),
        feedback: `${g} g × 1000 = ${mg} mg`
      });
    }

    return cards;
  }

  /**
   * Génère les cartes pour les volumes
   */
  generateVolumeConversions() {
    const cards = [];

    // L ↔ mL
    for (const l of [1, 2, 0.5, 0.25, 1.5, 0.1, 0.75, 3]) {
      const ml = l * 1000;
      cards.push({
        id: `conv_l_to_ml_${l}`.replace('.', '_'),
        question: `${l} L = ? mL`,
        answer: String(ml),
        feedback: `${l} L × 1000 = ${ml} mL`
      });
    }

    for (const ml of [1000, 500, 250, 100, 750, 1500, 2000, 50]) {
      const l = ml / 1000;
      cards.push({
        id: `conv_ml_to_l_${ml}`,
        question: `${ml} mL = ? L`,
        answer: String(l),
        feedback: `${ml} mL ÷ 1000 = ${l} L`
      });
    }

    // L ↔ cL
    for (const l of [1, 2, 0.5, 1.5, 0.25, 0.75]) {
      const cl = l * 100;
      cards.push({
        id: `conv_l_to_cl_${l}`.replace('.', '_'),
        question: `${l} L = ? cL`,
        answer: String(cl),
        feedback: `${l} L × 100 = ${cl} cL`
      });
    }

    for (const cl of [100, 50, 25, 75, 33, 150, 200]) {
      const l = cl / 100;
      cards.push({
        id: `conv_cl_to_l_${cl}`,
        question: `${cl} cL = ? L`,
        answer: String(l),
        feedback: `${cl} cL ÷ 100 = ${l} L`
      });
    }

    return cards;
  }

  /**
   * Génère les cartes pour le temps
   */
  generateTimeConversions() {
    const cards = [];

    // heures ↔ minutes
    for (const h of [1, 2, 3, 0.5, 1.5, 2.5, 0.25, 0.75]) {
      const min = h * 60;
      cards.push({
        id: `conv_h_to_min_${h}`.replace('.', '_'),
        question: `${h} h = ? min`,
        answer: String(min),
        feedback: `${h} h × 60 = ${min} min`
      });
    }

    for (const min of [60, 120, 30, 90, 45, 15, 180, 150]) {
      const h = min / 60;
      const hStr = Number.isInteger(h) ? String(h) : h.toFixed(2).replace(/\.?0+$/, '');
      cards.push({
        id: `conv_min_to_h_${min}`,
        question: `${min} min = ? h`,
        answer: hStr,
        alternatives: Number.isInteger(h) ? [] : [`${Math.floor(min/60)}h${min%60}`],
        feedback: `${min} min ÷ 60 = ${hStr} h`
      });
    }

    // minutes ↔ secondes
    for (const min of [1, 2, 5, 10, 0.5, 1.5, 3, 15]) {
      const s = min * 60;
      cards.push({
        id: `conv_min_to_s_${min}`.replace('.', '_'),
        question: `${min} min = ? s`,
        answer: String(s),
        feedback: `${min} min × 60 = ${s} s`
      });
    }

    for (const s of [60, 120, 180, 30, 90, 300, 600, 45]) {
      const min = s / 60;
      const minStr = Number.isInteger(min) ? String(min) : min.toFixed(2).replace(/\.?0+$/, '');
      cards.push({
        id: `conv_s_to_min_${s}`,
        question: `${s} s = ? min`,
        answer: minStr,
        feedback: `${s} s ÷ 60 = ${minStr} min`
      });
    }

    return cards;
  }

  /**
   * Deck longueurs
   */
  buildLengthDeck() {
    const deckResources = [
      ...this.commonResources,
      this.createObjectives([
        'Convertir km ↔ m ↔ cm ↔ mm',
        'Multiplier/diviser par 10, 100, 1000',
        'Mémoriser les équivalences'
      ]),
      this.createTip(
        'Conversions de longueurs',
        `Rappels :
• 1 km = 1000 m
• 1 m = 100 cm = 1000 mm
• 1 cm = 10 mm

Pour convertir :
• Vers plus petit → multiplier
• Vers plus grand → diviser`
      )
    ];

    return {
      name: 'Conversions de longueurs',
      description: 'km, m, cm, mm',
      tags: ['math', 'conversions', 'longueurs', 'ce2', 'cm1'],
      category: ['sciences', 'maths', 'arithmetique', 'mesures', 'conversions'],
      settings: { sequential: false, bidirectional: false },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'length' }
        }
      },
      resources: deckResources,
      cards: this.generateLengthConversions()
    };
  }

  /**
   * Deck masses
   */
  buildMassDeck() {
    const deckResources = [
      ...this.commonResources,
      this.createObjectives([
        'Convertir kg ↔ g ↔ mg',
        'Manipuler les multiples de 1000',
        'Applications pratiques (courses, cuisine)'
      ]),
      this.createTip(
        'Conversions de masses',
        `Rappels :
• 1 kg = 1000 g
• 1 g = 1000 mg
• 1 tonne = 1000 kg

Exemples pratiques :
• 500 g = 0,5 kg (demi-kilo)
• 250 g = 0,25 kg (quart de kilo)`
      )
    ];

    return {
      name: 'Conversions de masses',
      description: 'kg, g, mg',
      tags: ['math', 'conversions', 'masses', 'ce2', 'cm1'],
      category: ['sciences', 'maths', 'arithmetique', 'mesures', 'conversions'],
      settings: { sequential: false, bidirectional: false },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'mass' }
        }
      },
      resources: deckResources,
      cards: this.generateMassConversions()
    };
  }

  /**
   * Deck volumes
   */
  buildVolumeDeck() {
    const deckResources = [
      ...this.commonResources,
      this.createObjectives([
        'Convertir L ↔ cL ↔ mL',
        'Reconnaître les contenances courantes',
        'Applications cuisine et vie quotidienne'
      ]),
      this.createTip(
        'Conversions de volumes',
        `Rappels :
• 1 L = 100 cL = 1000 mL
• 1 cL = 10 mL

Repères pratiques :
• Canette = 33 cL
• Bouteille d'eau = 50 cL ou 1,5 L
• Verre = 20-25 cL
• Cuillère à soupe = 1,5 cL`
      )
    ];

    return {
      name: 'Conversions de volumes',
      description: 'L, cL, mL',
      tags: ['math', 'conversions', 'volumes', 'cm1', 'cm2'],
      category: ['sciences', 'maths', 'arithmetique', 'mesures', 'conversions'],
      settings: { sequential: false, bidirectional: false },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'volume' }
        }
      },
      resources: deckResources,
      cards: this.generateVolumeConversions()
    };
  }

  /**
   * Deck temps
   */
  buildTimeDeck() {
    const deckResources = [
      ...this.commonResources,
      this.createObjectives([
        'Convertir heures ↔ minutes ↔ secondes',
        'Maîtriser la base 60',
        'Calculer des durées'
      ]),
      this.createTip(
        'Conversions de temps',
        `Attention, le temps est en base 60 !

• 1 h = 60 min = 3600 s
• 1 min = 60 s

Fractions d'heure :
• 0,5 h = 30 min
• 0,25 h = 15 min
• 0,75 h = 45 min`
      )
    ];

    return {
      name: 'Conversions de temps',
      description: 'heures, minutes, secondes',
      tags: ['math', 'conversions', 'temps', 'cm1', 'cm2'],
      category: ['sciences', 'maths', 'arithmetique', 'mesures', 'conversions'],
      settings: { sequential: false, bidirectional: false },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'time' }
        }
      },
      resources: deckResources,
      cards: this.generateTimeConversions()
    };
  }

  /**
   * Override: Génère plusieurs decks
   */
  buildDecks(options = {}) {
    return [
      this.buildLengthDeck(),
      this.buildMassDeck(),
      this.buildVolumeDeck(),
      this.buildTimeDeck()
    ];
  }

  /**
   * Génère toutes les cartes
   */
  generate(options = {}) {
    return [
      ...this.generateLengthConversions(),
      ...this.generateMassConversions(),
      ...this.generateVolumeConversions(),
      ...this.generateTimeConversions()
    ];
  }
}

module.exports = ConversionsGenerator;
