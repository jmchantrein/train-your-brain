#!/usr/bin/env node

/**
 * Générateurs Procéduraux - CLI et Registre
 *
 * Usage:
 *   node scripts/generators/index.js --all           # Génère tous les decks
 *   node scripts/generators/index.js --list          # Liste les générateurs
 *   node scripts/generators/index.js --gen=mult      # Génère un générateur spécifique
 *   node scripts/generators/index.js --category=math # Génère une catégorie
 *   node scripts/generators/index.js --output=decks/procedural  # Dossier de sortie
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// YAML Serializer (simple, sans dépendance externe)
// ============================================================================

function toYaml(obj, indent = 0, isArrayItem = false) {
  const spaces = '  '.repeat(indent);
  let result = '';

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (typeof item === 'object' && item !== null) {
        // Pour un objet dans un tableau, on met le premier champ sur la même ligne que le -
        const entries = Object.entries(item).filter(([k, v]) => v !== undefined && v !== null);
        if (entries.length === 0) {
          result += `${spaces}- {}\n`;
        } else {
          const [firstKey, firstValue] = entries[0];
          // Premier champ sur la même ligne que le tiret
          if (Array.isArray(firstValue)) {
            if (firstValue.length === 0) {
              result += `${spaces}- ${firstKey}: []\n`;
            } else if (typeof firstValue[0] === 'object') {
              result += `${spaces}- ${firstKey}:\n${toYaml(firstValue, indent + 2)}`;
            } else {
              const inlineValues = firstValue.map(v => formatYamlValue(v)).join(', ');
              result += `${spaces}- ${firstKey}: [${inlineValues}]\n`;
            }
          } else if (typeof firstValue === 'object' && firstValue !== null) {
            result += `${spaces}- ${firstKey}:\n${toYaml(firstValue, indent + 2)}`;
          } else {
            result += `${spaces}- ${firstKey}: ${formatYamlValue(firstValue)}\n`;
          }
          // Reste des champs avec l'indentation correcte
          for (let i = 1; i < entries.length; i++) {
            const [key, value] = entries[i];
            const itemSpaces = spaces + '  ';
            if (Array.isArray(value)) {
              if (value.length === 0) {
                result += `${itemSpaces}${key}: []\n`;
              } else if (typeof value[0] === 'object') {
                result += `${itemSpaces}${key}:\n${toYaml(value, indent + 2)}`;
              } else {
                const inlineValues = value.map(v => formatYamlValue(v)).join(', ');
                result += `${itemSpaces}${key}: [${inlineValues}]\n`;
              }
            } else if (typeof value === 'object' && value !== null) {
              result += `${itemSpaces}${key}:\n${toYaml(value, indent + 2)}`;
            } else {
              result += `${itemSpaces}${key}: ${formatYamlValue(value)}\n`;
            }
          }
        }
      } else {
        result += `${spaces}- ${formatYamlValue(item)}\n`;
      }
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null) continue;

      if (Array.isArray(value)) {
        if (value.length === 0) {
          result += `${spaces}${key}: []\n`;
        } else if (typeof value[0] === 'object') {
          result += `${spaces}${key}:\n${toYaml(value, indent + 1)}`;
        } else {
          // Inline array for simple values
          const inlineValues = value.map(v => formatYamlValue(v)).join(', ');
          result += `${spaces}${key}: [${inlineValues}]\n`;
        }
      } else if (typeof value === 'object') {
        result += `${spaces}${key}:\n${toYaml(value, indent + 1)}`;
      } else {
        result += `${spaces}${key}: ${formatYamlValue(value)}\n`;
      }
    }
  }

  return result;
}

// Chaînes que YAML 1.1/1.2 (js-yaml inclus) relirait comme autre chose qu'une chaîne
const YAML_AMBIGUOUS = /^(?:[-+]?(?:\d[\d_,]*)?\.?\d+(?:[eE][-+]?\d+)?|[-+]?\d[\d_,]*(?:\.\d*)?(?:[eE][-+]?\d+)?|[-+]?\.(?:inf|Inf|INF)|\.(?:nan|NaN|NAN)|[-+]?0[box][0-9a-fA-F_]+|[-+]?0[0-7_]+|[-+]?\d+(?::[0-5]?\d)+(?:\.\d*)?|\d{4}-\d{1,2}-\d{1,2}.*|true|True|TRUE|false|False|FALSE|null|Null|NULL|~|yes|Yes|YES|no|No|NO|on|On|ON|off|Off|OFF|y|Y|n|N|=|<<)$/;

function formatYamlValue(value) {
  if (typeof value === 'string') {
    // Quote toute chaîne que YAML réinterpréterait ou qui casse la syntaxe
    if (
      value === '' ||
      YAML_AMBIGUOUS.test(value) ||
      /^[-?:,\[\]{}#&*!|>'"%@`\s]/.test(value) ||
      /[\s]$/.test(value) ||
      /: |:$| #|[,\[\]{}"\\]|[\n\r\t]/.test(value) ||
      value.includes("'")
    ) {
      const escaped = value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      return `"${escaped}"`;
    }
    return value;
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return String(value);
}

// ============================================================================
// Registry - Enregistrement des générateurs
// ============================================================================

const registry = {
  generators: {},
  categories: {
    math: [],
    science: [],
    geography: [],
    languages: [],
    cs: [],
    music: []
  },

  /**
   * Enregistre un générateur
   * @param {string} category - Catégorie (math, science, etc.)
   * @param {BaseGenerator} generator - Instance du générateur
   */
  register(category, generator) {
    if (!this.categories[category]) {
      this.categories[category] = [];
    }
    this.generators[generator.id] = { generator, category };
    this.categories[category].push(generator.id);
  },

  /**
   * Récupère un générateur par ID
   */
  get(id) {
    return this.generators[id]?.generator;
  },

  /**
   * Liste tous les générateurs
   */
  list() {
    const result = [];
    for (const [category, ids] of Object.entries(this.categories)) {
      for (const id of ids) {
        const gen = this.generators[id].generator;
        result.push({
          id,
          category,
          name: gen.name,
          version: gen.version
        });
      }
    }
    return result;
  },

  /**
   * Récupère tous les IDs d'une catégorie
   */
  getByCategory(category) {
    return this.categories[category] || [];
  }
};

// ============================================================================
// Chargement dynamique des générateurs
// ============================================================================

function loadGenerators() {
  const generatorsDir = __dirname;
  const categories = ['math', 'science', 'geography', 'languages', 'cs', 'music'];

  for (const category of categories) {
    const categoryDir = path.join(generatorsDir, category);

    if (!fs.existsSync(categoryDir)) continue;

    const files = fs.readdirSync(categoryDir).filter(f => f.endsWith('.cjs'));

    for (const file of files) {
      try {
        const GeneratorClass = require(path.join(categoryDir, file));
        if (typeof GeneratorClass === 'function') {
          const generator = new GeneratorClass();
          registry.register(category, generator);
        }
      } catch (err) {
        console.error(`Erreur chargement ${category}/${file}:`, err.message);
      }
    }
  }
}

// ============================================================================
// Génération des decks
// ============================================================================

function generateDecks(generatorIds, outputDir) {
  const decks = [];

  for (const id of generatorIds) {
    const generator = registry.get(id);
    if (!generator) {
      console.warn(`Générateur inconnu: ${id}`);
      continue;
    }

    try {
      console.log(`Génération: ${generator.name}...`);
      const generatedDecks = generator.buildDecks({});

      for (const deck of generatedDecks) {
        decks.push(deck);

        if (outputDir) {
          const filename = `${generator.id}-${deck.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.yaml`;
          const filepath = path.join(outputDir, filename);
          const yaml = toYaml(deck);
          fs.writeFileSync(filepath, yaml, 'utf8');
          console.log(`  → ${filepath} (${deck.cards.length} cartes)`);
        }
      }
    } catch (err) {
      console.error(`Erreur génération ${id}:`, err.message);
    }
  }

  return decks;
}

// ============================================================================
// CLI
// ============================================================================

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    all: false,
    list: false,
    generators: [],
    categories: [],
    output: null,
    json: false
  };

  for (const arg of args) {
    if (arg === '--all') {
      options.all = true;
    } else if (arg === '--list') {
      options.list = true;
    } else if (arg === '--json') {
      options.json = true;
    } else if (arg.startsWith('--gen=')) {
      options.generators.push(arg.slice(6));
    } else if (arg.startsWith('--category=')) {
      options.categories.push(arg.slice(11));
    } else if (arg.startsWith('--output=')) {
      options.output = arg.slice(9);
    }
  }

  return options;
}

function main() {
  loadGenerators();

  const options = parseArgs();

  // Liste des générateurs
  if (options.list) {
    const generators = registry.list();
    console.log('\nGénérateurs disponibles:\n');
    for (const gen of generators) {
      console.log(`  [${gen.category}] ${gen.id} - ${gen.name} (v${gen.version})`);
    }
    console.log(`\nTotal: ${generators.length} générateurs`);
    return;
  }

  // Déterminer quels générateurs exécuter
  let generatorIds = [];

  if (options.all) {
    generatorIds = registry.list().map(g => g.id);
  } else if (options.categories.length > 0) {
    for (const cat of options.categories) {
      generatorIds.push(...registry.getByCategory(cat));
    }
  } else if (options.generators.length > 0) {
    generatorIds = options.generators;
  } else {
    // Afficher l'aide
    console.log(`
Générateurs Procéduraux - Train Your Brain

Usage:
  node scripts/generators/index.js --all                  Génère tous les decks
  node scripts/generators/index.js --list                 Liste les générateurs
  node scripts/generators/index.js --gen=multiplication   Génère un générateur
  node scripts/generators/index.js --category=math        Génère une catégorie
  node scripts/generators/index.js --output=decks/proc    Dossier de sortie
  node scripts/generators/index.js --json                 Sortie JSON (pour build)
`);
    return;
  }

  // Créer le dossier de sortie si nécessaire
  if (options.output && !fs.existsSync(options.output)) {
    fs.mkdirSync(options.output, { recursive: true });
  }

  // Générer
  console.log(`\nGénération de ${generatorIds.length} générateur(s)...\n`);
  const decks = generateDecks(generatorIds, options.output);

  // Résumé
  const totalCards = decks.reduce((sum, d) => sum + d.cards.length, 0);
  console.log(`\n✓ ${decks.length} decks générés (${totalCards} cartes au total)`);

  // Sortie JSON pour intégration build
  if (options.json) {
    console.log('\n--- JSON OUTPUT ---');
    console.log(JSON.stringify(decks, null, 2));
  }
}

// Export pour utilisation par le build
module.exports = {
  registry,
  loadGenerators,
  generateDecks,
  toYaml
};

// Exécution CLI
if (require.main === module) {
  main();
}
