#!/usr/bin/env node
/**
 * Script de téléchargement d'images depuis Wikimedia Commons
 *
 * Télécharge des images libres de droits pour les decks de vocabulaire
 * et met à jour les fichiers YAML avec les chemins locaux.
 *
 * Usage: node scripts/download-images.cjs [--deck=<deck-id>] [--force]
 *
 * Options:
 *   --deck=<id>  Traiter uniquement un deck spécifique
 *   --force      Re-télécharger même si l'image existe déjà
 *   --dry-run    Afficher ce qui serait fait sans télécharger
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Charger le parser YAML
let yaml;
try {
  yaml = require('js-yaml');
} catch (e) {
  console.error('❌ js-yaml non installé. Exécutez: npm install js-yaml');
  process.exit(1);
}

// Configuration
const CONFIG = {
  decksDir: path.join(__dirname, '..', 'decks', 'vocabulaire'),
  mediaDir: path.join(__dirname, '..', 'media', 'decks', 'vocabulaire'),
  commonsApi: 'https://commons.wikimedia.org/w/api.php',
  maxImageWidth: 400, // Taille max en pixels
  preferredFormats: ['jpg', 'jpeg', 'png', 'svg'],
  // Traductions pour améliorer les recherches
  searchHints: {
    // Mots dont le sens est ambigu - ajouter des contextes
    'main': 'hand anatomy',
    'pied': 'foot anatomy',
    'coeur': 'heart anatomy',
    'os': 'bone anatomy',
    'sang': 'blood cells',
    'langue': 'tongue anatomy',
    'dent': 'tooth anatomy',
    'tete': 'human head',
    'oeil': 'human eye',
    'nez': 'human nose',
    'bouche': 'human mouth',
    'oreille': 'human ear'
  }
};

// Statistiques
const stats = {
  total: 0,
  found: 0,
  downloaded: 0,
  failed: 0,
  skipped: 0
};

/**
 * Fait une requête HTTP/HTTPS
 */
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);

    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'TrainYourBrain/1.0 (offline flashcard app; https://github.com/jmchantrein/train-your-brain)',
        ...options.headers
      }
    };

    const request = protocol.request(reqOptions, (response) => {
      // Suivre les redirections
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        let redirectUrl = response.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = `${urlObj.protocol}//${urlObj.host}${redirectUrl}`;
        }
        return fetch(redirectUrl, options).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });

    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Timeout'));
    });

    request.end();
  });
}

/**
 * Recherche une image sur Wikimedia Commons
 */
async function searchImage(word, englishWord) {
  // Construire les termes de recherche
  const searchTerms = [];

  // Utiliser le hint si disponible
  if (CONFIG.searchHints[word]) {
    searchTerms.push(CONFIG.searchHints[word]);
  }

  // Ajouter le mot anglais (meilleure couverture sur Commons)
  if (englishWord && englishWord !== word) {
    searchTerms.push(englishWord);
  }

  // Ajouter le mot original
  searchTerms.push(word);

  for (const term of searchTerms) {
    // Recherche via l'API MediaWiki
    const searchUrl = `${CONFIG.commonsApi}?action=query&list=search&srsearch=${encodeURIComponent(term)}&srnamespace=6&srlimit=10&format=json`;

    try {
      const data = await fetch(searchUrl);
      const json = JSON.parse(data.toString());

      if (json.query?.search?.length > 0) {
        // Filtrer pour garder seulement les images
        for (const result of json.query.search) {
          const fileName = result.title.replace('File:', '');
          const ext = fileName.split('.').pop().toLowerCase();

          if (CONFIG.preferredFormats.includes(ext)) {
            // Vérifier que ce n'est pas une icône, un logo ou un drapeau
            const lowerName = fileName.toLowerCase();
            if (!lowerName.includes('flag') &&
                !lowerName.includes('icon') &&
                !lowerName.includes('logo') &&
                !lowerName.includes('symbol') &&
                !lowerName.includes('coat of arms')) {
              return fileName;
            }
          }
        }
      }
    } catch (e) {
      // Continuer avec le prochain terme
    }
  }

  // Recherche par catégorie si pas trouvé
  if (englishWord) {
    const categoryUrl = `${CONFIG.commonsApi}?action=query&list=categorymembers&cmtitle=Category:${encodeURIComponent(englishWord)}&cmlimit=10&cmtype=file&format=json`;

    try {
      const data = await fetch(categoryUrl);
      const json = JSON.parse(data.toString());

      if (json.query?.categorymembers?.length > 0) {
        for (const member of json.query.categorymembers) {
          const fileName = member.title.replace('File:', '');
          const ext = fileName.split('.').pop().toLowerCase();

          if (CONFIG.preferredFormats.includes(ext)) {
            return fileName;
          }
        }
      }
    } catch (e) {
      // Silencieux
    }
  }

  return null;
}

/**
 * Obtient l'URL de téléchargement d'une image (avec redimensionnement)
 */
async function getImageUrl(fileName, maxWidth = CONFIG.maxImageWidth) {
  const url = `${CONFIG.commonsApi}?action=query&titles=File:${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url&iiurlwidth=${maxWidth}&format=json`;

  try {
    const data = await fetch(url);
    const json = JSON.parse(data.toString());

    const pages = json.query?.pages;
    if (pages) {
      const page = Object.values(pages)[0];
      if (page.imageinfo && page.imageinfo[0]) {
        // Préférer la version redimensionnée si disponible
        return page.imageinfo[0].thumburl || page.imageinfo[0].url;
      }
    }
  } catch (e) {
    // Silencieux
  }

  return null;
}

/**
 * Télécharge une image
 */
async function downloadImage(url, destPath) {
  try {
    const data = await fetch(url);

    // Créer le dossier parent si nécessaire
    const dir = path.dirname(destPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(destPath, data);
    return true;
  } catch (e) {
    console.error(`    ❌ Erreur téléchargement: ${e.message}`);
    return false;
  }
}

/**
 * Traite un deck multilingue
 */
async function processDeck(deckPath, options) {
  console.log(`\n📦 Traitement: ${path.basename(deckPath)}`);

  const content = fs.readFileSync(deckPath, 'utf-8');
  const deck = yaml.load(content);

  if (deck.type !== 'multilingual' || !Array.isArray(deck.words)) {
    console.log('   ⏭️  Pas un deck multilingue, ignoré');
    return;
  }

  const deckId = deck.id || path.basename(deckPath, '.yaml');
  const imageDir = path.join(CONFIG.mediaDir, 'images', deckId);

  console.log(`   Mots: ${deck.words.length}`);

  let modified = false;

  for (const word of deck.words) {
    stats.total++;

    // Vérifier si l'image existe déjà
    const imageFileName = `${word.id}.jpg`; // On standardise en jpg
    const imagePath = path.join(imageDir, imageFileName);
    const relativeImagePath = `media/decks/vocabulaire/images/${deckId}/${imageFileName}`;

    if (!options.force) {
      if (word.image && fs.existsSync(path.join(__dirname, '..', word.image))) {
        stats.skipped++;
        continue;
      }

      if (fs.existsSync(imagePath)) {
        word.image = relativeImagePath;
        modified = true;
        stats.skipped++;
        continue;
      }
    }

    // Rechercher une image
    const frenchWord = word.translations?.fr || word.id;
    const englishWord = word.translations?.en;

    process.stdout.write(`   🔍 ${word.id}: `);

    if (options.dryRun) {
      console.log(`recherche "${frenchWord}" / "${englishWord}"`);
      continue;
    }

    const fileName = await searchImage(frenchWord, englishWord);

    if (!fileName) {
      console.log('non trouvé');
      stats.failed++;
      continue;
    }

    stats.found++;

    // Obtenir l'URL
    const imageUrl = await getImageUrl(fileName);

    if (!imageUrl) {
      console.log('URL non trouvée');
      stats.failed++;
      continue;
    }

    // Télécharger
    process.stdout.write('téléchargement... ');

    if (await downloadImage(imageUrl, imagePath)) {
      word.image = relativeImagePath;
      modified = true;
      stats.downloaded++;
      console.log('✅');
    } else {
      stats.failed++;
    }

    // Pause pour éviter de surcharger l'API
    await new Promise(r => setTimeout(r, 300));
  }

  // Sauvegarder le deck modifié
  if (modified) {
    const newContent = yaml.dump(deck, {
      lineWidth: -1,
      quotingType: "'",
      forceQuotes: false
    });
    fs.writeFileSync(deckPath, newContent);
    console.log(`   💾 Deck mis à jour`);
  }
}

/**
 * Trouve tous les decks multilingues
 */
function findDecks(dir) {
  const decks = [];

  if (!fs.existsSync(dir)) {
    return decks;
  }

  const items = fs.readdirSync(dir);

  for (const item of items) {
    const itemPath = path.join(dir, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
      decks.push(...findDecks(itemPath));
    } else if (item.endsWith('.yaml') || item.endsWith('.yml')) {
      decks.push(itemPath);
    }
  }

  return decks;
}

/**
 * Main
 */
async function main() {
  console.log('🖼️  Téléchargement d\'images Wikimedia Commons');
  console.log('=============================================\n');

  // Parser les arguments
  const args = process.argv.slice(2);
  const options = {
    specificDeck: null,
    force: false,
    dryRun: false
  };

  for (const arg of args) {
    if (arg.startsWith('--deck=')) {
      options.specificDeck = arg.slice(7);
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    }
  }

  if (options.dryRun) {
    console.log('🔍 Mode dry-run: aucun téléchargement effectué\n');
  }

  // Trouver les decks
  let decks = findDecks(CONFIG.decksDir);

  if (options.specificDeck) {
    decks = decks.filter(d => d.includes(options.specificDeck));
  }

  console.log(`📂 Decks trouvés: ${decks.length}`);

  // Traiter chaque deck
  for (const deckPath of decks) {
    await processDeck(deckPath, options);
  }

  // Afficher les statistiques
  if (!options.dryRun) {
    console.log('\n=============================================');
    console.log('📊 Statistiques:');
    console.log(`   Total: ${stats.total}`);
    console.log(`   Trouvées: ${stats.found}`);
    console.log(`   Téléchargées: ${stats.downloaded}`);
    console.log(`   Ignorées (existantes): ${stats.skipped}`);
    console.log(`   Échecs: ${stats.failed}`);
    console.log('=============================================\n');

    if (stats.downloaded > 0) {
      console.log('✅ Terminé ! Exécutez `npm run build` pour intégrer les images.');
    }
  }
}

main().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
