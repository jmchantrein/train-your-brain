#!/usr/bin/env node

/**
 * Build Script - Train Your Brain
 *
 * Assemble tous les fichiers sources en un seul index.html
 * - Utilise build.manifest.json pour l'ordre de chargement
 * - Valide et convertit les decks YAML → JSON
 * - Encode les médias en Base64
 * - Concatène les modules JS dans l'ordre défini
 * - Inline les styles CSS
 * - Optionnel: minification JS/CSS avec --minify
 *
 * Options de ligne de commande:
 *   --minify, -m         Minifier JS et CSS (production)
 *   --validate           Valider les decks sans builder
 *   --strict             Échouer si warnings ou erreurs de validation
 *   --skip-validation    Ne pas valider les decks (plus rapide)
 *   --help, -h           Afficher l'aide
 *
 * Exemples:
 *   node scripts/build.js                    # Build dev avec validation
 *   node scripts/build.js --minify           # Build prod avec minification
 *   node scripts/build.js --validate         # Valider les decks uniquement
 *   node scripts/build.js --strict           # Build avec validation stricte (échec si warnings)
 *   node scripts/build.js --skip-validation  # Build sans validation (rapide)
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import yaml from 'js-yaml';
import { minify as terserMinify } from 'terser';
import CleanCSS from 'clean-css';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// Version de l'application : package.json est la source unique
const PACKAGE_VERSION = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;

// Horodatage du build ; SOURCE_DATE_EPOCH (secondes) permet un build reproductible
function buildTimestamp() {
  const epoch = process.env.SOURCE_DATE_EPOCH;
  return /^\d+$/.test(epoch || '') ? new Date(Number(epoch) * 1000).toISOString() : new Date().toISOString();
}

// Créer require pour importer les modules CommonJS
const require = createRequire(import.meta.url);

// Importer le DeckValidator via le loader
let DeckValidator = null;
try {
  DeckValidator = require('./deck-validator-loader.cjs');
  if (!DeckValidator || !DeckValidator.validateDeck) {
    throw new Error('DeckValidator.validateDeck not found');
  }
} catch (err) {
  console.warn('⚠️  DeckValidator non disponible - validation ignorée');
  console.warn(`   Erreur: ${err.message}`);
}

// Importer les générateurs procéduraux
let ProceduralGenerators = null;
try {
  ProceduralGenerators = require('./generators/index.cjs');
  if (!ProceduralGenerators || !ProceduralGenerators.loadGenerators) {
    throw new Error('ProceduralGenerators.loadGenerators not found');
  }
} catch (err) {
  console.warn('⚠️  Générateurs procéduraux non disponibles');
  console.warn(`   Erreur: ${err.message}`);
}

// Options de ligne de commande
const MINIFY = process.argv.includes('--minify') || process.argv.includes('-m');
const VALIDATE_ONLY = process.argv.includes('--validate');
const STRICT_MODE = process.argv.includes('--strict');
const SKIP_VALIDATION = process.argv.includes('--skip-validation');

/**
 * Lit --output <chemin> ou --output=<chemin> (relatif au dossier courant).
 * @returns {string|null}
 */
function readOutputArg() {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--output' || argv[i] === '-o') {
      if (!argv[i + 1] || argv[i + 1].startsWith('-')) {
        console.error('❌ --output nécessite un chemin');
        process.exit(1);
      }
      return argv[i + 1];
    }
    if (argv[i].startsWith('--output=')) {
      const value = argv[i].slice('--output='.length);
      if (!value) {
        console.error('❌ --output nécessite un chemin');
        process.exit(1);
      }
      return value;
    }
  }
  return null;
}
const OUTPUT_ARG = readOutputArg();

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  // Dossiers sources
  decksDir: path.join(ROOT, 'decks'),
  mediaDir: path.join(ROOT, 'media'),
  srcDir: path.join(ROOT, 'src'),
  modulesDir: path.join(ROOT, 'src', 'modules'),
  uiDir: path.join(ROOT, 'src', 'ui'),
  stylesDir: path.join(ROOT, 'src', 'styles'),

  // Fichiers de configuration
  manifestFile: path.join(ROOT, 'build.manifest.json'),

  // Fichier de sortie
  outputFile: OUTPUT_ARG ? path.resolve(process.cwd(), OUTPUT_ARG) : path.join(ROOT, 'index.html'),

  // Types MIME pour les médias
  mimeTypes: {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg'
  }
};

// ═══════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES
// ═══════════════════════════════════════════════════════════════

function log(message) {
  console.log(message);
}

function logStep(step, message) {
  console.log(`\n${step} ${message}`);
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// ═══════════════════════════════════════════════════════════════
// MINIFICATION
// ═══════════════════════════════════════════════════════════════

/**
 * Minifie le code JavaScript avec Terser
 * @param {string} code - Code JS à minifier
 * @returns {Promise<string>} Code minifié
 */
async function minifyJS(code) {
  if (!MINIFY) return code;

  try {
    const result = await terserMinify(code, {
      compress: {
        dead_code: true,
        drop_console: false, // Garder console.log/error
        drop_debugger: true,
        passes: 2
      },
      mangle: {
        reserved: [
          // Préserver les noms globaux utilisés
          'App', 'State', 'Storage', 'Router', 'Leitner', 'XP',
          'Validator', 'Badges', 'Challenges', 'Tags', 'Themes',
          'Audio', 'LaTeX', 'YAML', 'Moodle', 'Exporter',
          'PromptGenerator', 'Components', 'Pages', 'I18n',
          'DECKS', 'MEDIA'
        ]
      },
      format: {
        comments: false
      }
    });

    if (result.code) {
      return result.code;
    }
    throw new Error('Terser n\'a retourné aucun code');
  } catch (error) {
    // Ne pas livrer en silence un build "minifié" qui ne l'est pas
    throw new Error(`Erreur minification JS: ${error.message}`);
  }
}

/**
 * Minifie le code CSS avec CleanCSS
 * @param {string} css - Code CSS à minifier
 * @returns {string} CSS minifié
 */
function minifyCSS(css) {
  if (!MINIFY) return css;

  try {
    const result = new CleanCSS({
      level: 2, // Optimisations avancées
      compatibility: '*' // Compatibilité maximale
    }).minify(css);

    if (result.errors.length > 0) {
      console.warn('   ⚠️ Erreurs CleanCSS:', result.errors);
    }

    if (result.styles) {
      return result.styles;
    }
    return css;
  } catch (error) {
    throw new Error(`Erreur minification CSS: ${error.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// LECTURE DU MANIFESTE
// ═══════════════════════════════════════════════════════════════

function loadManifest() {
  if (fs.existsSync(CONFIG.manifestFile)) {
    const content = fs.readFileSync(CONFIG.manifestFile, 'utf8');
    return JSON.parse(content);
  }
  // Sans manifeste, l'ordre de chargement (et les vendors) serait perdu en silence
  throw new Error(`Manifeste introuvable: ${CONFIG.manifestFile}`);
}

// ═══════════════════════════════════════════════════════════════
// VALIDATION DES DECKS
// ═══════════════════════════════════════════════════════════════

/**
 * Valide un deck et affiche le rapport
 * @param {Object} deck - Le deck à valider
 * @param {string} filename - Nom du fichier
 * @returns {Object} { isValid, hasWarnings, report }
 */
function validateAndReportDeck(deck, filename) {
  if (!DeckValidator) {
    return { isValid: true, hasWarnings: false, report: null };
  }

  const report = DeckValidator.validateDeck(deck);
  const cardCount = deck.cards ? deck.cards.length : 0;

  // Déterminer l'icône
  let icon = '✓';
  if (!report.isValid || report.stats.cardsWithErrors > 0) {
    icon = '✗';
  } else if (report.stats.cardsWithWarnings > 0 || report.duplicates.length > 0) {
    icon = '⚠';
  }

  // Afficher la ligne principale
  log(`   ${icon} ${filename} (${cardCount} cartes, score ${report.averageScore}%)`);

  // Afficher les warnings
  if (report.stats.cardsWithWarnings > 0) {
    log(`     - ${report.stats.cardsWithWarnings} carte(s) avec warnings`);
  }

  // Afficher les erreurs
  if (report.stats.cardsWithErrors > 0) {
    log(`     - ${report.stats.cardsWithErrors} carte(s) avec erreurs`);
  }

  // Afficher les doublons
  if (report.duplicates.length > 0) {
    log(`     - ${report.duplicates.length} doublon(s) détecté(s)`);
  }

  // Afficher les erreurs détaillées
  if (report.deckIssues.length > 0) {
    for (const issue of report.deckIssues) {
      if (issue.severity === 'error') {
        log(`     - ✗ ${issue.message}`);
      }
    }
  }

  // Afficher les erreurs de cartes (limitées)
  const errorCards = report.cardResults.filter(c => c.issues.length > 0).slice(0, 3);
  for (const cardResult of errorCards) {
    for (const issue of cardResult.issues) {
      log(`     - ✗ ${cardResult.cardId}: ${issue.message}`);
    }
  }

  if (report.cardResults.filter(c => c.issues.length > 0).length > 3) {
    const remaining = report.cardResults.filter(c => c.issues.length > 0).length - 3;
    log(`     - ... et ${remaining} autre(s) erreur(s)`);
  }

  return {
    isValid: report.isValid,
    hasWarnings: report.stats.cardsWithWarnings > 0 || report.duplicates.length > 0,
    report
  };
}

// ═══════════════════════════════════════════════════════════════
// CONVERSION DES DECKS
// ═══════════════════════════════════════════════════════════════

function convertDecks() {
  const decks = [];
  const validationResults = {
    total: 0,
    valid: 0,
    withWarnings: 0,
    withErrors: 0
  };

  function processDir(dir) {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        processDir(fullPath);
      } else if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const deck = yaml.load(content);

          validationResults.total++;

          // Valider le deck si validation activée
          if (!SKIP_VALIDATION) {
            const validation = validateAndReportDeck(deck, entry.name);

            if (!validation.isValid) {
              validationResults.withErrors++;

              if (STRICT_MODE) {
                console.error(`\n❌ Build interrompu : le deck "${entry.name}" contient des erreurs en mode --strict`);
                process.exit(1);
              }
            } else if (validation.hasWarnings) {
              validationResults.withWarnings++;

              if (STRICT_MODE) {
                console.error(`\n❌ Build interrompu : le deck "${entry.name}" contient des warnings en mode --strict`);
                process.exit(1);
              }
            } else {
              validationResults.valid++;
            }
          } else {
            // Pas de validation - juste compter
            validationResults.valid++;
            log(`   ✓ ${deck.id || entry.name}`);
          }

          // Générer un ID si le deck n'en a pas
          if (!deck.id && deck.name) {
            deck.id = deck.name
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '');
          }

          // Initialiser les champs de progression pour chaque carte
          if (deck.cards) {
            deck.cards = deck.cards.map(card => ({
              ...card,
              box: 'never_played',
              latencyThreshold: null,
              bestResponseTimeMs: null,
              lastResponseTimeMs: null,
              restUntil: null,
              timesPlayed: 0,
              timesCorrect: 0
            }));
          }

          decks.push(deck);
        } catch (e) {
          validationResults.total++;
          validationResults.withErrors++;
          // Deck non chargé : le build doit le signaler par son code de sortie
          process.exitCode = 1;
          console.error(`   ✗ Erreur: ${fullPath} - ${e.message}`);

          if (STRICT_MODE) {
            console.error(`\n❌ Build interrompu : erreur de parsing en mode --strict`);
            process.exit(1);
          }
        }
      }
    }
  }

  processDir(CONFIG.decksDir);

  // Afficher le résumé de validation
  if (!SKIP_VALIDATION && validationResults.total > 0) {
    log('');
    log(`   Résumé: ${validationResults.valid} valide(s), ${validationResults.withWarnings} warning(s), ${validationResults.withErrors} erreur(s)`);
  }

  return decks;
}

// ═══════════════════════════════════════════════════════════════
// GÉNÉRATION PROCÉDURALE
// ═══════════════════════════════════════════════════════════════

/**
 * Génère les decks procéduraux et les valide
 * @returns {Object[]} - Tableau de decks générés
 */
function generateProceduralDecks() {
  if (!ProceduralGenerators) {
    return [];
  }

  const decks = [];
  const validationResults = {
    total: 0,
    valid: 0,
    withWarnings: 0,
    withErrors: 0
  };

  try {
    // Charger tous les générateurs
    ProceduralGenerators.loadGenerators();
    const generators = ProceduralGenerators.registry.list();

    if (generators.length === 0) {
      log('   Aucun générateur disponible');
      return [];
    }

    log(`   ${generators.length} générateur(s) trouvé(s)`);

    // Générer les decks
    const generatorIds = generators.map(g => g.id);
    const generatedDecks = ProceduralGenerators.generateDecks(generatorIds, null);

    for (const deck of generatedDecks) {
      validationResults.total++;

      // Générer un ID si le deck n'en a pas
      if (!deck.id) {
        deck.id = deck.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');
      }

      // Valider le deck si validation activée
      if (!SKIP_VALIDATION && DeckValidator) {
        const deckName = deck.name || 'procedural-deck';
        const validation = validateAndReportDeck(deck, `[proc] ${deckName}`);

        if (!validation.isValid) {
          validationResults.withErrors++;

          if (STRICT_MODE) {
            console.error(`\n❌ Build interrompu : le deck procédural "${deckName}" contient des erreurs en mode --strict`);
            process.exit(1);
          }
        } else if (validation.hasWarnings) {
          validationResults.withWarnings++;

          if (STRICT_MODE) {
            console.error(`\n❌ Build interrompu : le deck procédural "${deckName}" contient des warnings en mode --strict`);
            process.exit(1);
          }
        } else {
          validationResults.valid++;
        }
      } else {
        validationResults.valid++;
        log(`   ✓ [proc] ${deck.name || 'unknown'}`);
      }

      // Initialiser les champs de progression pour chaque carte
      if (deck.cards) {
        deck.cards = deck.cards.map(card => ({
          ...card,
          box: 'never_played',
          latencyThreshold: null,
          bestResponseTimeMs: null,
          lastResponseTimeMs: null,
          restUntil: null,
          timesPlayed: 0,
          timesCorrect: 0
        }));
      }

      decks.push(deck);
    }
  } catch (err) {
    // Ne pas livrer un build sans les decks procéduraux en silence
    throw new Error(`Génération procédurale: ${err.message}`);
  }

  // Afficher le résumé de validation
  if (!SKIP_VALIDATION && validationResults.total > 0) {
    log('');
    log(`   Procédural: ${validationResults.valid} valide(s), ${validationResults.withWarnings} warning(s), ${validationResults.withErrors} erreur(s)`);
  }

  return decks;
}

// ═══════════════════════════════════════════════════════════════
// ENCODAGE DES MÉDIAS
// ═══════════════════════════════════════════════════════════════

function encodeMedia() {
  const media = {};

  function processDir(dir, prefix = '') {
    if (!fs.existsSync(dir)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        processDir(fullPath, relativePath);
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        const mimeType = CONFIG.mimeTypes[ext];

        if (mimeType) {
          const buffer = fs.readFileSync(fullPath);
          const base64 = buffer.toString('base64');
          media[relativePath] = `data:${mimeType};base64,${base64}`;
          log(`   ✓ ${relativePath} (${formatSize(buffer.length)})`);
        }
      }
    }
  }

  processDir(CONFIG.mediaDir);
  return media;
}

// ═══════════════════════════════════════════════════════════════
// LECTURE DES SOURCES (avec ordre du manifeste)
// ═══════════════════════════════════════════════════════════════

function readModulesOrdered(dir, orderedFiles) {
  if (!fs.existsSync(dir)) return [];

  const result = [];

  // D'abord les fichiers dans l'ordre spécifié
  if (orderedFiles && orderedFiles.length > 0) {
    for (const filename of orderedFiles) {
      const filePath = path.join(dir, filename);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        log(`   ✓ ${filename}`);
        result.push({ name: filename, content });
      } else {
        throw new Error(`Fichier listé dans build.manifest.json introuvable: ${path.relative(ROOT, filePath)}`);
      }
    }
  }

  // Puis les fichiers non listés (triés alphabétiquement)
  const existingFiles = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
  const loadedFiles = new Set(result.map(r => r.name));

  for (const filename of existingFiles.sort()) {
    if (!loadedFiles.has(filename)) {
      const filePath = path.join(dir, filename);
      const content = fs.readFileSync(filePath, 'utf8');
      log(`   ✓ ${filename} (non listé)`);
      result.push({ name: filename, content });
    }
  }

  return result;
}

function readStyles() {
  const cssFile = path.join(CONFIG.stylesDir, 'main.css');
  if (fs.existsSync(cssFile)) {
    const content = fs.readFileSync(cssFile, 'utf8');
    log(`   ✓ main.css`);
    return content;
  }
  return '/* No styles */';
}

/**
 * Lecture des bibliothèques vendor depuis le manifeste
 * @param {Object[]} vendorFiles - Liste des fichiers vendor du manifeste
 * @returns {Array} - Contenu des fichiers vendor
 */
function readVendorFiles(vendorFiles) {
  const result = [];

  if (!vendorFiles || !Array.isArray(vendorFiles)) return result;

  for (const vendor of vendorFiles) {
    const filePath = path.join(ROOT, vendor.path);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      log(`   ✓ ${vendor.name} (${formatSize(content.length)})`);
      result.push({
        name: vendor.name,
        content,
        global: vendor.global
      });
    } else {
      throw new Error(`Bibliothèque vendor introuvable: ${vendor.name} (${vendor.path})`);
    }
  }

  return result;
}

/**
 * Lecture des styles vendor avec embedding des fonts en base64
 * @param {Object[]} vendorStyles - Liste des styles vendor du manifeste
 * @returns {string} - CSS avec fonts inline
 */
function readVendorStyles(vendorStyles) {
  if (!vendorStyles || !Array.isArray(vendorStyles)) return '';

  let result = '';

  for (const style of vendorStyles) {
    const cssPath = path.join(ROOT, style.path);
    if (!fs.existsSync(cssPath)) {
      throw new Error(`CSS vendor introuvable: ${style.name} (${style.path})`);
    }

    let css = fs.readFileSync(cssPath, 'utf8');
    const fontsDir = style.fontsPath ? path.join(ROOT, style.fontsPath) : null;

    // Si embedFonts est activé, remplacer les URLs de fonts par du base64
    if (style.embedFonts && fontsDir && fs.existsSync(fontsDir)) {
      // Regex pour trouver les url(fonts/xxx.woff2)
      // Les feuilles @fontsource désignent leurs fichiers par ./files/..., KaTeX par fonts/...
      const urlRegex = /url\((?:\.\/)?(?:fonts|files)\/([^)]+)\)/g;
      let fontsEmbedded = 0;
      let fontsSkipped = 0;

      // Sources de repli woff/ttf/otf (avec leur format()) : retirées, seul woff2 est embarqué
      css = css.replace(/,?\s*url\((?:\.\/)?(?:fonts|files)\/[^)]+\.(?:woff|ttf|otf)\)\s*format\((?:"[^"]*"|'[^']*')\)/g, () => {
        fontsSkipped++;
        return '';
      });

      css = css.replace(urlRegex, (match, fontFile) => {
        const fontPath = path.join(fontsDir, fontFile);

        if (fs.existsSync(fontPath)) {
          const ext = path.extname(fontFile).toLowerCase();
          let mimeType = 'application/octet-stream';

          if (ext === '.woff2') mimeType = 'font/woff2';
          else if (ext === '.woff') mimeType = 'font/woff';
          else if (ext === '.ttf') mimeType = 'font/ttf';
          else if (ext === '.otf') mimeType = 'font/otf';

          // Ne garder que woff2 pour réduire la taille (le plus compact)
          if (ext === '.woff2') {
            const buffer = fs.readFileSync(fontPath);
            const base64 = buffer.toString('base64');
            fontsEmbedded++;
            return `url(data:${mimeType};base64,${base64})`;
          } else {
            // Supprimer les fallbacks woff et ttf
            fontsSkipped++;
            return '';
          }
        }

        return match; // Garder l'original si fichier non trouvé
      });

      // Nettoyer les format() orphelins après suppression des fallbacks
      css = css.replace(/,url\(\)\s*format\("[^"]*"\)/g, '');
      css = css.replace(/url\(\)\s*format\("[^"]*"\),?/g, '');

      log(`   ✓ ${style.name} (${fontsEmbedded} fonts woff2, ${fontsSkipped} fallbacks ignorés)`);
    } else {
      log(`   ✓ ${style.name} (sans fonts)`);
    }

    result += `/* ${style.name} */\n${css}\n\n`;
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// ASSEMBLAGE DU CODE JS
// ═══════════════════════════════════════════════════════════════

function assembleJS({ decks, media, vendor, modules, ui }) {
  const timestamp = buildTimestamp();

  // Si minification activée, JSON compact
  const jsonIndent = MINIFY ? null : 2;

  // Assembler les bibliothèques vendor
  const vendorCode = vendor.length > 0
    ? `// ═══════════════════════════════════════════════════════════════
// BIBLIOTHÈQUES TIERCES
// ═══════════════════════════════════════════════════════════════

${vendor.map(v => `// ${v.name}\n${v.content}`).join('\n\n')}`
    : '';

  return `
// ═══════════════════════════════════════════════════════════════
// TRAIN YOUR BRAIN
// Version: ${PACKAGE_VERSION}
// Build: ${timestamp}
// ═══════════════════════════════════════════════════════════════

"use strict";

${vendorCode}

// ═══════════════════════════════════════════════════════════════
// DONNÉES EMBARQUÉES
// ═══════════════════════════════════════════════════════════════

const DECKS = ${JSON.stringify(decks, null, jsonIndent)};

const MEDIA = ${JSON.stringify(media, null, jsonIndent)};

// ═══════════════════════════════════════════════════════════════
// MODULES
// ═══════════════════════════════════════════════════════════════

${modules.map(m => m.content).join('\n\n')}

// ═══════════════════════════════════════════════════════════════
// UI
// ═══════════════════════════════════════════════════════════════

${ui.map(m => m.content).join('\n\n')}

// ═══════════════════════════════════════════════════════════════
// INITIALISATION
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  if (typeof App !== 'undefined' && App.init) {
    App.init();
  } else {
    console.log('Train Your Brain - Ready');
    console.log('Decks:', DECKS.length);
    console.log('Media:', Object.keys(MEDIA).length);
  }
});
`;
}

// ═══════════════════════════════════════════════════════════════
// COMPOSANTS TIERS REDISTRIBUÉS (source unique des mentions de licence)
// ═══════════════════════════════════════════════════════════════
//
// Utilisé pour l'en-tête de licence de index.html (conservé en mode --minify : il est écrit hors du
// JS/CSS, que Terser et CleanCSS réécrivent sans commentaires). Les textes complets des licences sont
// dans THIRD-PARTY-NOTICES.md, dont le build vérifie qu'il cite chaque composant listé ici.
// Ajouter ici tout nouveau composant tiers embarqué.

const THIRD_PARTY = [
  {
    name: 'js-yaml', pkg: 'js-yaml', noticeTitle: 'js-yaml',
    copyright: 'Copyright (C) 2011-2015 by Vitaly Puzrin',
    license: 'MIT', url: 'https://github.com/nodeca/js-yaml'
  },
  {
    name: 'KaTeX', pkg: 'katex', noticeTitle: 'KaTeX',
    copyright: 'Copyright (c) 2013-2020 Khan Academy and other contributors',
    license: 'MIT', url: 'https://github.com/KaTeX/KaTeX'
  },
  {
    name: 'KaTeX fonts (woff2 embedded in the stylesheet)', pkg: 'katex', noticeTitle: 'Polices KaTeX',
    copyright: 'Copyright (c) 2009-2010 Design Science, Inc.; Copyright (c) 2014-2018 Khan Academy',
    license: 'SIL Open Font License 1.1', url: 'https://github.com/KaTeX/KaTeX'
  },
  {
    name: 'OpenDyslexic fonts (2 woff2 embedded in the stylesheet)', pkg: '@fontsource/opendyslexic', noticeTitle: 'OpenDyslexic',
    copyright: 'Copyright (c) 12/2012 - 2019 Abbie Gonzalez (https://abbiecod.es), with Reserved Font Name OpenDyslexic',
    license: 'SIL Open Font License 1.1', url: 'https://opendyslexic.org'
  },
  {
    name: 'LZ-String (adapted in the Compression module)', pkg: null, noticeTitle: 'LZ-String', version: 'version not recorded',
    copyright: 'Copyright (c) 2013 pieroxy',
    license: 'MIT', url: 'https://github.com/pieroxy/lz-string'
  }
];

// Texte de la licence MIT (hors ligne de copyright), identique pour les composants MIT ci-dessus
const MIT_PERMISSION_TEXT = `Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;

/**
 * Version installée d'un composant tiers (lue dans node_modules, donc celle qui est embarquée)
 * @param {Object} component - Entrée de THIRD_PARTY
 * @returns {string}
 */
function thirdPartyVersion(component) {
  if (!component.pkg) return component.version || 'unknown version';
  const pkgFile = path.join(ROOT, 'node_modules', component.pkg, 'package.json');
  if (!fs.existsSync(pkgFile)) {
    throw new Error(`Composant tiers introuvable: ${component.pkg} (${pkgFile})`);
  }
  return JSON.parse(fs.readFileSync(pkgFile, 'utf8')).version;
}

/**
 * Vérifie que THIRD-PARTY-NOTICES.md cite chaque composant de THIRD_PARTY avec sa version
 * (garde-fou contre la dérive entre l'en-tête de index.html et le fichier de textes complets).
 */
function checkThirdPartyNotices() {
  const file = path.join(ROOT, 'THIRD-PARTY-NOTICES.md');
  if (!fs.existsSync(file)) {
    throw new Error('THIRD-PARTY-NOTICES.md introuvable (textes de licence des composants tiers)');
  }
  const notices = fs.readFileSync(file, 'utf8');
  for (const component of THIRD_PARTY) {
    if (!notices.includes(`## ${component.noticeTitle}`)) {
      throw new Error(`THIRD-PARTY-NOTICES.md n'a pas de section « ${component.noticeTitle} »`);
    }
    if (component.pkg && !notices.includes(thirdPartyVersion(component))) {
      throw new Error(`THIRD-PARTY-NOTICES.md ne cite pas la version installée de ${component.pkg} (${thirdPartyVersion(component)})`);
    }
  }
}

/**
 * Commentaire HTML de licence placé en tête de index.html
 * @returns {string} Commentaire HTML (sans « -- » interne, interdit dans un commentaire)
 */
function buildLicenseHeader() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const components = THIRD_PARTY.map(c =>
    `  - ${c.name} ${thirdPartyVersion(c)}: ${c.copyright}. License: ${c.license}. ${c.url}`
  ).join('\n');
  const text = `Train Your Brain ${pkg.version}
Copyright (C) 2025-2026 Jean-Mathieu Chantrein
This application is free software, licensed under the GNU Affero General Public License
version 3 or (at your option) any later version (${pkg.license}). The license text is the LICENSE file of the source repository.

Third-party components embedded in this file:
${components}

MIT License (js-yaml, KaTeX, LZ-String), each with the copyright notice listed above:
${MIT_PERMISSION_TEXT.replace(/^/gm, '  ')}

SIL Open Font License 1.1 (KaTeX fonts and OpenDyslexic fonts): the license text is in
THIRD-PARTY-NOTICES.md and at http://scripts.sil.org/OFL ; the reserved font names are the KaTeX_*
family names and OpenDyslexic.
Full texts of all licenses: THIRD-PARTY-NOTICES.md in the source repository.`;
  if (text.includes('--')) {
    throw new Error('En-tête de licence invalide: la séquence "--" est interdite dans un commentaire HTML');
  }
  return `<!--\n${text}\n-->`;
}

// ═══════════════════════════════════════════════════════════════
// CONTENT-SECURITY-POLICY
// ═══════════════════════════════════════════════════════════════
//
// Politique écrite dans une balise <meta http-equiv> (le fichier est ouvert en file:// ou servi par
// GitHub Pages : aucun en-tête HTTP n'est disponible). Détail et limites : docs/ARCHITECTURE.md.
//
// - Scripts : pas de 'unsafe-inline'. Le <script> unique est autorisé par son empreinte SHA-256, calculée
//   ici sur le texte exact placé dans la page. Un script injecté dans le DOM (XSS) ne s'exécute donc pas.
//   Les gestionnaires en ligne (onclick="...") ne sont tolérés que s'ils sont statiques : leur empreinte
//   est ajoutée avec 'unsafe-hashes'. Un gestionnaire dynamique (${...}) fait échouer le build.
// - Styles : 'unsafe-inline' est nécessaire (feuille unique en ligne, attributs style="" générés par
//   l'interface et par KaTeX). Une injection peut donc encore styler la page, mais pas charger de
//   ressource : img-src, font-src, media-src et connect-src sont fermés.
// - Réseau : uniquement les services que l'utilisateur déclenche depuis les créateurs de decks
//   (src/modules/lingua-libre.js). Aucune ressource distante de deck n'est chargée (CardMedia).

const CSP_CONNECT_HOSTS = [
  'https://lingualibre.org',        // recherche d'enregistrements et listes de mots (Lingua Libre)
  'https://commons.wikimedia.org',  // recherche et métadonnées (licence, auteur) des fichiers audio
  'https://upload.wikimedia.org',   // téléchargement du fichier audio (converti en data: puis embarqué)
  'https://query.wikidata.org',     // traductions : requête SPARQL
  'https://www.wikidata.org'        // traductions : libellés des entités
];

/**
 * Empreinte CSP d'un texte (script ou valeur d'attribut)
 * @param {string} text
 * @returns {string} « 'sha256-...' »
 */
function cspHash(text) {
  return `'sha256-${crypto.createHash('sha256').update(text, 'utf8').digest('base64')}'`;
}

/**
 * Relève les gestionnaires d'événements en ligne (onclick="...") écrits dans le JavaScript assemblé
 * @param {string} js
 * @returns {string[]} Valeurs distinctes des attributs
 * @throws {Error} Si une valeur est construite dynamiquement (empreinte impossible)
 */
function findInlineHandlers(js) {
  const handlers = new Set();
  const regex = /\son[a-z]+\s*=\s*"([^"]*)"/g;
  let match;
  while ((match = regex.exec(js)) !== null) {
    if (match[1].includes('${')) {
      throw new Error(`Gestionnaire en ligne dynamique incompatible avec la CSP : ${match[0].slice(0, 80)}. Utiliser addEventListener.`);
    }
    handlers.add(match[1]);
  }
  return [...handlers];
}

/**
 * @param {string} scriptText - Texte exact du <script> unique
 * @param {string[]} handlers - Gestionnaires en ligne statiques
 * @returns {string} Valeur de l'attribut content de la balise <meta>
 */
function buildContentSecurityPolicy(scriptText, handlers) {
  const scriptSrc = [cspHash(scriptText)];
  if (handlers.length > 0) {
    scriptSrc.push("'unsafe-hashes'", ...handlers.map(cspHash));
  }
  return [
    "default-src 'none'",
    `script-src ${scriptSrc.join(' ')}`,
    "style-src 'unsafe-inline'",
    "img-src data: blob:",
    "media-src data: blob:",
    "font-src data:",
    `connect-src ${CSP_CONNECT_HOSTS.join(' ')} data: blob:`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'none'"
  ].join('; ');
}

// ═══════════════════════════════════════════════════════════════
// ASSEMBLAGE HTML
// ═══════════════════════════════════════════════════════════════

function assembleHtml({ js, css }) {
  const timestamp = buildTimestamp();
  const scriptText = `\n${js}\n  `;
  const csp = buildContentSecurityPolicy(scriptText, findInlineHandlers(js));

  return `<!DOCTYPE html>
${buildLicenseHeader()}
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="description" content="Train Your Brain - Application de révision par flashcards">
  <meta name="theme-color" content="#0f172a">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <title>Train Your Brain</title>

  <!-- Favicon SVG inline (fonctionne en file://) -->
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%238b5cf6'/%3E%3Cstop offset='100%25' stop-color='%2322c55e'/%3E%3C/linearGradient%3E%3C/defs%3E%3Ccircle cx='50' cy='50' r='45' fill='url(%23g)'/%3E%3Ctext x='50' y='68' text-anchor='middle' font-size='50' fill='white'%3E🧠%3C/text%3E%3C/svg%3E">

  <!-- Généré le ${timestamp}${MINIFY ? ' (minifié)' : ''} -->

  <style>
${css}
  </style>
</head>
<body>
  <div id="app"></div>

  <script>${scriptText}</script>
</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════
// AIDE
// ═══════════════════════════════════════════════════════════════

function showHelp() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║          TRAIN YOUR BRAIN - BUILD                             ║
╚═══════════════════════════════════════════════════════════════╝

Usage: node scripts/build.js [options]

Options:
  --minify, -m         Minifier JS et CSS (production)
  --validate           Valider les decks sans builder
  --strict             Échouer si warnings ou erreurs
  --skip-validation    Ne pas valider les decks (plus rapide)
  --output, -o <chemin> Fichier de sortie (défaut : index.html à la racine)
  --help, -h           Afficher cette aide

Exemples:
  node scripts/build.js                    # Build dev sans minification
  node scripts/build.js --minify           # Build prod avec minification
  node scripts/build.js --validate         # Valider les decks uniquement
  node scripts/build.js --strict           # Build avec validation stricte
  node scripts/build.js --output tmp/app.html   # Construire ailleurs
`);
}

// ═══════════════════════════════════════════════════════════════
// BUILD PRINCIPAL
// ═══════════════════════════════════════════════════════════════

async function build() {
  // Afficher l'aide si demandé
  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║          TRAIN YOUR BRAIN - BUILD                             ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');

  // Mode validation uniquement
  if (VALIDATE_ONLY) {
    log('\n🔍 Mode: VALIDATION UNIQUEMENT (pas de build)');
    if (STRICT_MODE) {
      log('⚠️  Mode strict: le build échouera si warnings ou erreurs');
    }
  } else if (MINIFY) {
    log('\n🔧 Mode: PRODUCTION (minification activée)');
  } else {
    log('\n🔧 Mode: DÉVELOPPEMENT (utilisez --minify pour minifier)');
  }

  if (SKIP_VALIDATION) {
    log('⏭️  Validation des decks ignorée (--skip-validation)');
  }

  // Charger le manifeste
  const manifest = loadManifest();
  if (manifest) {
    log(`📋 Manifeste chargé: ${manifest.name} v${manifest.version}`);
  }

  // 1. Convertir et valider les decks YAML
  logStep('📦', SKIP_VALIDATION ? 'Conversion des decks YAML → JSON...' : 'Validation et conversion des decks YAML → JSON...');
  const yamlDecks = convertDecks();
  log(`   Total: ${yamlDecks.length} deck(s) YAML`);

  // 2. Générer les decks procéduraux
  logStep('🔧', 'Génération des decks procéduraux...');
  const proceduralDecks = generateProceduralDecks();
  log(`   Total: ${proceduralDecks.length} deck(s) procédural(aux)`);

  // Fusionner les decks avec déduplication
  // Priorité : YAML > Procédural (si même ID)
  const deckById = new Map();
  const deckByName = new Map();
  const duplicates = { byId: [], byName: [] };

  // Ajouter les decks YAML en premier (prioritaires)
  for (const deck of yamlDecks) {
    if (deckById.has(deck.id)) {
      duplicates.byId.push({ id: deck.id, name: deck.name, source: 'YAML' });
    } else {
      deckById.set(deck.id, deck);
    }
    // Tracker les noms pour détecter les doublons
    if (deckByName.has(deck.name)) {
      duplicates.byName.push({ name: deck.name, id: deck.id, existingId: deckByName.get(deck.name) });
    } else {
      deckByName.set(deck.name, deck.id);
    }
  }

  // Ajouter les decks procéduraux (seulement si ID n'existe pas déjà)
  for (const deck of proceduralDecks) {
    if (deckById.has(deck.id)) {
      duplicates.byId.push({ id: deck.id, name: deck.name, source: 'procedural (ignoré)' });
    } else {
      deckById.set(deck.id, deck);
      // Vérifier aussi les noms
      if (deckByName.has(deck.name)) {
        duplicates.byName.push({ name: deck.name, id: deck.id, existingId: deckByName.get(deck.name) });
      } else {
        deckByName.set(deck.name, deck.id);
      }
    }
  }

  // Afficher les doublons détectés
  if (duplicates.byId.length > 0) {
    console.warn(`\n⚠️  ${duplicates.byId.length} doublon(s) par ID détecté(s) :`);
    duplicates.byId.forEach(d => console.warn(`   - ${d.id} (${d.name}) [${d.source}]`));
  }
  if (duplicates.byName.length > 0) {
    console.warn(`\n⚠️  ${duplicates.byName.length} doublon(s) par NOM détecté(s) :`);
    duplicates.byName.forEach(d => console.warn(`   - "${d.name}" (ID: ${d.id} vs ${d.existingId})`));
  }

  const decks = Array.from(deckById.values());
  log(`   Total combiné: ${decks.length} deck(s) (après déduplication)`);

  // Si mode --validate uniquement, s'arrêter ici
  if (VALIDATE_ONLY) {
    console.log('\n╔═══════════════════════════════════════════════════════════════╗');
    console.log('║                 VALIDATION TERMINÉE                           ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝');
    console.log('\n✅ Validation terminée - utilisez sans --validate pour builder');
    return;
  }

  // 3. Encoder les médias
  logStep('🖼️ ', 'Encodage des médias en Base64...');
  const media = encodeMedia();
  log(`   Total: ${Object.keys(media).length} fichier(s)`);

  // 4. Lire les bibliothèques vendor
  logStep('📚', 'Chargement des bibliothèques tierces...');
  const vendorFiles = manifest?.vendor?.files || [];
  const vendor = readVendorFiles(vendorFiles);
  log(`   Total: ${vendor.length} bibliothèque(s)`);

  // 5. Lire les modules JS (avec ordre du manifeste)
  logStep('📝', 'Lecture des modules JavaScript...');
  const modulesOrder = manifest?.modules?.order || [];
  const modules = readModulesOrdered(CONFIG.modulesDir, modulesOrder);
  log(`   Total: ${modules.length} module(s)`);

  // 6. Lire les composants UI (avec ordre du manifeste)
  logStep('🎨', 'Lecture des composants UI...');
  const uiOrder = manifest?.ui?.order || [];
  const ui = readModulesOrdered(CONFIG.uiDir, uiOrder);
  log(`   Total: ${ui.length} fichier(s)`);

  // 7. Lire les styles vendor (KaTeX, etc.)
  logStep('💅', 'Lecture des styles vendor...');
  const vendorStyles = manifest?.vendor?.styles || [];
  const vendorCSS = readVendorStyles(vendorStyles);

  // 8. Lire les styles de l'application
  logStep('🎨', 'Lecture des styles CSS...');
  const appCSS = readStyles();

  // Combiner les styles (vendor en premier)
  let css = vendorCSS + appCSS;

  // 9. Assembler le JavaScript
  logStep('🔗', 'Assemblage du code JavaScript...');
  let js = assembleJS({ decks, media, vendor, modules, ui });
  const jsOriginalSize = js.length;

  // 10. Minification (si activée)
  if (MINIFY) {
    logStep('🗜️ ', 'Minification en cours...');

    // Minifier CSS
    log('   ⏳ CSS...');
    const cssOriginalSize = css.length;
    css = minifyCSS(css);
    log(`   ✓ CSS: ${formatSize(cssOriginalSize)} → ${formatSize(css.length)} (-${Math.round((1 - css.length / cssOriginalSize) * 100)}%)`);

    // Minifier JS
    log('   ⏳ JavaScript (cela peut prendre un moment)...');
    js = await minifyJS(js);
    log(`   ✓ JS: ${formatSize(jsOriginalSize)} → ${formatSize(js.length)} (-${Math.round((1 - js.length / jsOriginalSize) * 100)}%)`);
  }

  // 11. Assembler le HTML final
  logStep('📄', 'Génération du fichier HTML...');
  checkThirdPartyNotices();
  const html = assembleHtml({ js, css });

  // 12. Écrire le fichier final
  fs.mkdirSync(path.dirname(CONFIG.outputFile), { recursive: true });
  fs.writeFileSync(CONFIG.outputFile, html);
  const stats = fs.statSync(CONFIG.outputFile);

  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                      BUILD TERMINÉ                            ║');
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log(`║  Fichier: ${path.relative(process.cwd(), CONFIG.outputFile).slice(0, 50).padEnd(50)}║`);
  console.log(`║  Taille:  ${formatSize(stats.size).padEnd(50)}║`);
  console.log(`║  Decks:   ${String(decks.length).padEnd(50)}║`);
  console.log(`║  Médias:  ${String(Object.keys(media).length).padEnd(50)}║`);
  console.log(`║  Minifié: ${MINIFY ? 'Oui'.padEnd(50) : 'Non'.padEnd(50)}║`);
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log(`\n✅ Ouvrez ${path.relative(process.cwd(), CONFIG.outputFile)} dans votre navigateur (double-clic)`);
}

// Exécuter
build().catch(err => {
  console.error('\n❌ Erreur de build:', err.message);
  process.exit(1);
});
