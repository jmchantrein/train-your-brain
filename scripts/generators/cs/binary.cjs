/**
 * Générateur de conversions binaires
 *
 * Génère des decks pour :
 * - Conversion décimal → binaire (0-15, puis 0-255)
 * - Conversion binaire → décimal
 * - Puissances de 2
 * - Conversion hexadécimal ↔ binaire
 *
 * Niveau: troisième (initiation), seconde (complet)
 */

const BaseGenerator = require('../base-generator.cjs');

class BinaryGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'binary',
      name: 'Conversions binaires',
      tags: ['informatique', 'binaire', 'numeration'],
      version: '1.0.0',
      description: 'Conversions entre systèmes décimal, binaire et hexadécimal'
    });
  }

  /**
   * Convertit un nombre en binaire
   * @param {number} n - Nombre décimal
   * @returns {string} Représentation binaire
   */
  toBinary(n) {
    return n.toString(2);
  }

  /**
   * Convertit un nombre en hexadécimal
   * @param {number} n - Nombre décimal
   * @returns {string} Représentation hexadécimale
   */
  toHex(n) {
    return n.toString(16).toUpperCase();
  }

  /**
   * Génère les cartes décimal ↔ binaire pour une plage
   * @param {number} start - Début de la plage
   * @param {number} end - Fin de la plage
   * @returns {Object[]} Cartes
   */
  generateDecimalBinaryCards(start, end) {
    const cards = [];

    for (let n = start; n <= end; n++) {
      const binary = this.toBinary(n);

      // Décimal → Binaire
      cards.push({
        id: `bin_dec_to_bin_${n}`,
        question: `Convertir ${n} en binaire :`,
        answer: binary,
        alternatives: [`0b${binary}`, binary.padStart(8, '0')],
        feedback: `${n}₁₀ = ${binary}₂`
      });

      // Binaire → Décimal
      cards.push({
        id: `bin_bin_to_dec_${n}`,
        question: `Convertir ${binary}₂ en décimal :`,
        answer: String(n),
        feedback: `${binary}₂ = ${n}₁₀`
      });
    }

    return cards;
  }

  /**
   * Génère les cartes pour les puissances de 2
   * @param {number} maxPower - Puissance maximale
   * @returns {Object[]} Cartes
   */
  generatePowersOf2Cards(maxPower) {
    const cards = [];

    for (let p = 0; p <= maxPower; p++) {
      const value = Math.pow(2, p);

      // 2^n = ?
      cards.push({
        id: `bin_pow2_${p}`,
        question: `2^${p} = ?`,
        answer: String(value),
        feedback: `2^${p} = ${value}`
      });

      // ? = 2^n
      if (p > 0) {
        cards.push({
          id: `bin_pow2_reverse_${p}`,
          question: `${value} = 2^?`,
          answer: String(p),
          feedback: `${value} = 2^${p}`
        });
      }
    }

    return cards;
  }

  /**
   * Génère les cartes hexadécimal ↔ binaire
   * @returns {Object[]} Cartes
   */
  generateHexBinaryCards() {
    const cards = [];

    for (let n = 0; n <= 15; n++) {
      const hex = this.toHex(n);
      const binary = this.toBinary(n).padStart(4, '0');

      // Hex → Binaire
      cards.push({
        id: `bin_hex_to_bin_${n}`,
        question: `Convertir 0x${hex} en binaire (4 bits) :`,
        answer: binary,
        alternatives: [this.toBinary(n)],
        feedback: `0x${hex} = ${binary}₂ = ${n}₁₀`
      });

      // Binaire → Hex
      cards.push({
        id: `bin_bin_to_hex_${n}`,
        question: `Convertir ${binary}₂ en hexadécimal :`,
        answer: hex,
        alternatives: [`0x${hex}`, hex.toLowerCase()],
        feedback: `${binary}₂ = 0x${hex} = ${n}₁₀`
      });
    }

    return cards;
  }

  /**
   * Génère un deck pour les bases (0-15)
   */
  buildBasicsDeck() {
    const cards = [
      ...this.generateDecimalBinaryCards(0, 15),
      ...this.generatePowersOf2Cards(4)
    ];

    return {
      name: 'Binaire - Initiation (0-15)',
      description: 'Conversions décimal ↔ binaire pour les nombres 0 à 15',
      tags: ['informatique', 'binaire', 'numeration', 'architecture-ordinateurs', 'seconde', 'premiere'],
      settings: {
        sequential: false,
        bidirectional: false
      },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'basics' }
        }
      },
      cards
    };
  }

  /**
   * Génère un deck pour les puissances de 2 étendues
   */
  buildPowersDeck() {
    const cards = this.generatePowersOf2Cards(16);

    return {
      // Id historique conservé : la progression des joueurs est indexée dessus
      id: 'puissances-de-2',
      name: 'Binaire - Puissances de 2 (2^0 à 2^16)',
      description: 'Puissances de 2 de 2^0 à 2^16',
      tags: ['informatique', 'binaire', 'numeration', 'architecture-ordinateurs', 'premiere'],
      settings: {
        sequential: true, // Ordre croissant recommandé pour l'apprentissage
        bidirectional: false
      },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'powers' }
        }
      },
      cards
    };
  }

  /**
   * Génère un deck pour l'hexadécimal
   */
  buildHexDeck() {
    const cards = this.generateHexBinaryCards();

    return {
      name: 'Hexadécimal - Binaire',
      description: 'Conversions hexadécimal ↔ binaire (0-F)',
      tags: ['informatique', 'binaire', 'hexadecimal', 'numeration', 'architecture-ordinateurs', 'premiere'],
      settings: {
        sequential: false,
        bidirectional: false
      },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'hex' }
        }
      },
      cards
    };
  }

  /**
   * Génère un deck pour les octets (0-255) - échantillon
   */
  buildBytesDeck() {
    // Sélectionner des nombres représentatifs (pas tous les 256)
    const selectedNumbers = [
      // Puissances de 2
      1, 2, 4, 8, 16, 32, 64, 128,
      // Puissances de 2 - 1 (tous les bits à 1)
      3, 7, 15, 31, 63, 127, 255,
      // Nombres courants
      10, 100, 200, 42, 99, 170, 85
    ].sort((a, b) => a - b);

    const cards = [];
    for (const n of selectedNumbers) {
      const binary = this.toBinary(n);

      cards.push({
        id: `bin_byte_dec_to_bin_${n}`,
        question: `Convertir ${n} en binaire :`,
        answer: binary,
        alternatives: [binary.padStart(8, '0')],
        feedback: `${n}₁₀ = ${binary}₂`
      });

      cards.push({
        id: `bin_byte_bin_to_dec_${n}`,
        question: `Convertir ${binary}₂ en décimal :`,
        answer: String(n),
        feedback: `${binary}₂ = ${n}₁₀`
      });
    }

    return {
      name: 'Binaire - Octets (0-255)',
      description: 'Conversions pour les valeurs d\'un octet',
      tags: ['informatique', 'binaire', 'numeration', 'architecture-ordinateurs', 'premiere'],
      settings: {
        sequential: false,
        bidirectional: false
      },
      metadata: {
        license: BaseGenerator.LICENSE,
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: BaseGenerator.generatedAt(),
          parameters: { type: 'bytes' }
        }
      },
      cards
    };
  }

  /**
   * Override: Génère plusieurs decks
   */
  buildDecks(options = {}) {
    return [
      this.buildBasicsDeck(),
      this.buildPowersDeck(),
      this.buildHexDeck(),
      this.buildBytesDeck()
    ];
  }

  /**
   * Génère toutes les cartes
   */
  generate(options = {}) {
    return [
      ...this.generateDecimalBinaryCards(0, 255),
      ...this.generatePowersOf2Cards(16),
      ...this.generateHexBinaryCards()
    ];
  }
}

module.exports = BinaryGenerator;
