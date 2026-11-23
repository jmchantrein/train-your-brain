#!/usr/bin/env node
/**
 * Script de téléchargement des audios Lingua Libre
 *
 * Télécharge les fichiers audio depuis Lingua Libre pour les decks multilingues
 * et met à jour les fichiers YAML avec les chemins locaux.
 *
 * Usage: node scripts/download-lingua-libre.cjs [--deck=<deck-id>] [--lang=<lang>]
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
  linguaLibreApi: 'https://commons.wikimedia.org/w/api.php',
  // Mapping langue -> code Wikidata (Q-code) utilisé par Lingua Libre
  langCodes: {
    fr: 'Q150',    // Français
    en: 'Q1860',   // Anglais
    es: 'Q1321',   // Espagnol
    de: 'Q188',    // Allemand
    it: 'Q652',    // Italien
    pt: 'Q5146',   // Portugais
    nl: 'Q7411'    // Néerlandais
  },
  // Mapping langue -> code ISO 639-3 (utilisé dans les noms de fichiers)
  iso639_3: {
    fr: 'fra',
    en: 'eng',
    es: 'spa',
    de: 'deu',
    it: 'ita',
    pt: 'por',
    nl: 'nld'
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
function fetch(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, {
      headers: { 'User-Agent': 'TrainYourBrain/1.0 (offline flashcard app)' }
    }, (response) => {
      // Suivre les redirections
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return fetch(response.headers.location).then(resolve).catch(reject);
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
  });
}

/**
 * Vérifie si un nom de fichier correspond au mot recherché
 * Format attendu: LL-Q<langcode> (<iso639-3>)-<speaker>-<word>.<ext>
 */
function matchesWord(fileName, word, langCode, isoCode) {
  // Vérifier le préfixe
  if (!fileName.startsWith(`LL-Q${langCode}`)) {
    return false;
  }

  // Vérifier l'extension audio
  if (!fileName.endsWith('.wav') && !fileName.endsWith('.ogg')) {
    return false;
  }

  // Extraire le mot du nom de fichier (après le dernier tiret, avant l'extension)
  // Format: LL-Q150 (fra)-Speaker-mot.wav
  const match = fileName.match(/-([^-]+)\.(wav|ogg)$/i);
  if (!match) {
    return false;
  }

  const fileWord = match[1].toLowerCase();
  const searchWord = word.toLowerCase();

  // Correspondance exacte (insensible à la casse)
  if (fileWord === searchWord) {
    return true;
  }

  // Correspondance avec normalisation des accents
  const normalizeAccents = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (normalizeAccents(fileWord) === normalizeAccents(searchWord)) {
    return true;
  }

  return false;
}

/**
 * Recherche un fichier audio sur Lingua Libre via Wikimedia Commons
 *
 * Stratégies de recherche:
 * 1. Recherche par titre de fichier avec le mot exact
 * 2. Recherche textuelle dans les fichiers Lingua Libre
 * 3. Parcours de la liste des fichiers (fallback)
 */
async function searchLinguaLibre(word, langCode, lang) {
  const isoCode = CONFIG.iso639_3[lang];

  // Stratégie 1: Recherche directe par nom de fichier
  // Le format exact est: LL-Q<langcode> (<iso>)-<speaker>-<word>.wav
  // On utilise allimages avec un préfixe pour trouver les fichiers
  const searchPrefix = `LL-Q${langCode} (${isoCode})`;

  // Essayer plusieurs variantes du mot
  const wordVariants = [
    word,
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(), // Capitalize
    word.toLowerCase(),
    word.toUpperCase()
  ];

  // Stratégie 2: Recherche textuelle MediaWiki
  for (const variant of wordVariants) {
    // Recherche avec intitle pour cibler les noms de fichiers
    const searchTerm = `intitle:"${searchPrefix}" intitle:"${variant}"`;
    const url = `${CONFIG.linguaLibreApi}?action=query&list=search&srsearch=${encodeURIComponent(searchTerm)}&srnamespace=6&srlimit=10&format=json`;

    try {
      const data = await fetch(url);
      const json = JSON.parse(data.toString());

      if (json.query?.search?.length > 0) {
        for (const result of json.query.search) {
          const fileName = result.title.replace('File:', '');
          if (matchesWord(fileName, word, langCode, isoCode)) {
            return fileName;
          }
        }
      }
    } catch (e) {
      // Continuer avec la prochaine stratégie
    }
  }

  // Stratégie 3: Recherche par catégorie Lingua Libre
  // Les fichiers sont catégorisés par langue
  const categorySearchUrl = `${CONFIG.linguaLibreApi}?action=query&list=categorymembers&cmtitle=Category:Lingua_Libre_pronunciation-${isoCode}&cmlimit=500&cmtype=file&format=json`;

  try {
    const data = await fetch(categorySearchUrl);
    const json = JSON.parse(data.toString());

    if (json.query?.categorymembers) {
      for (const member of json.query.categorymembers) {
        const fileName = member.title.replace('File:', '');
        if (matchesWord(fileName, word, langCode, isoCode)) {
          return fileName;
        }
      }
    }
  } catch (e) {
    // Continuer avec la prochaine stratégie
  }

  // Stratégie 4: Recherche simple par mot-clé
  const simpleSearchUrl = `${CONFIG.linguaLibreApi}?action=query&list=search&srsearch=LL-Q${langCode}%20${encodeURIComponent(word)}&srnamespace=6&srlimit=20&format=json`;

  try {
    const data = await fetch(simpleSearchUrl);
    const json = JSON.parse(data.toString());

    if (json.query?.search?.length > 0) {
      for (const result of json.query.search) {
        const fileName = result.title.replace('File:', '');
        if (matchesWord(fileName, word, langCode, isoCode)) {
          return fileName;
        }
      }
    }
  } catch (e) {
    // Silencieux
  }

  return null;
}

/**
 * Obtient l'URL directe d'un fichier Wikimedia Commons
 */
async function getFileUrl(fileName) {
  const url = `${CONFIG.linguaLibreApi}?action=query&titles=File:${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url&format=json`;

  try {
    const data = await fetch(url);
    const json = JSON.parse(data.toString());

    const pages = json.query?.pages;
    if (pages) {
      const page = Object.values(pages)[0];
      if (page.imageinfo && page.imageinfo[0]) {
        return page.imageinfo[0].url;
      }
    }
  } catch (e) {
    // Silencieux
  }

  return null;
}

/**
 * Télécharge un fichier audio
 */
async function downloadAudio(url, destPath) {
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
async function processDeck(deckPath) {
  console.log(`\n📦 Traitement: ${path.basename(deckPath)}`);

  const content = fs.readFileSync(deckPath, 'utf-8');
  const deck = yaml.load(content);

  if (deck.type !== 'multilingual' || !Array.isArray(deck.words)) {
    console.log('   ⏭️  Pas un deck multilingue, ignoré');
    return;
  }

  const languages = deck.languages || ['fr'];
  const deckId = deck.id || path.basename(deckPath, '.yaml');
  const audioDir = path.join(CONFIG.mediaDir, 'audio', deckId);

  console.log(`   Langues: ${languages.join(', ')}`);
  console.log(`   Mots: ${deck.words.length}`);

  let modified = false;

  for (const word of deck.words) {
    if (!word.audio) {
      word.audio = {};
    }

    for (const lang of languages) {
      stats.total++;

      const translation = word.translations?.[lang];
      if (!translation) {
        stats.skipped++;
        continue;
      }

      // Vérifier si l'audio existe déjà
      const audioFileName = `${word.id}_${lang}.wav`;
      const audioPath = path.join(audioDir, audioFileName);
      const relativeAudioPath = `media/decks/vocabulaire/audio/${deckId}/${audioFileName}`;

      if (word.audio[lang] && fs.existsSync(path.join(__dirname, '..', word.audio[lang]))) {
        stats.skipped++;
        continue;
      }

      if (fs.existsSync(audioPath)) {
        // Fichier existe déjà, mettre à jour le chemin
        word.audio[lang] = relativeAudioPath;
        modified = true;
        stats.skipped++;
        continue;
      }

      // Rechercher sur Lingua Libre
      const langCode = CONFIG.langCodes[lang];
      if (!langCode) {
        stats.skipped++;
        continue;
      }

      process.stdout.write(`   🔍 ${word.id} (${lang}): `);

      const fileName = await searchLinguaLibre(translation, langCode, lang);

      if (!fileName) {
        console.log('non trouvé');
        stats.failed++;
        continue;
      }

      stats.found++;

      // Obtenir l'URL directe
      const fileUrl = await getFileUrl(fileName);

      if (!fileUrl) {
        console.log('URL non trouvée');
        stats.failed++;
        continue;
      }

      // Télécharger
      process.stdout.write('téléchargement... ');

      if (await downloadAudio(fileUrl, audioPath)) {
        word.audio[lang] = relativeAudioPath;
        modified = true;
        stats.downloaded++;
        console.log('✅');
      } else {
        stats.failed++;
      }

      // Petite pause pour éviter de surcharger l'API
      await new Promise(r => setTimeout(r, 200));
    }
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
  console.log('🎧 Téléchargement des audios Lingua Libre');
  console.log('=========================================\n');

  // Parser les arguments
  const args = process.argv.slice(2);
  let specificDeck = null;

  for (const arg of args) {
    if (arg.startsWith('--deck=')) {
      specificDeck = arg.slice(7);
    }
  }

  // Trouver les decks
  let decks = findDecks(CONFIG.decksDir);

  if (specificDeck) {
    decks = decks.filter(d => d.includes(specificDeck));
  }

  console.log(`📂 Decks trouvés: ${decks.length}`);

  // Traiter chaque deck
  for (const deckPath of decks) {
    await processDeck(deckPath);
  }

  // Afficher les statistiques
  console.log('\n=========================================');
  console.log('📊 Statistiques:');
  console.log(`   Total demandé: ${stats.total}`);
  console.log(`   Trouvés: ${stats.found}`);
  console.log(`   Téléchargés: ${stats.downloaded}`);
  console.log(`   Ignorés (existants): ${stats.skipped}`);
  console.log(`   Échecs: ${stats.failed}`);
  console.log('=========================================\n');

  if (stats.downloaded > 0) {
    console.log('✅ Terminé ! Exécutez `npm run build` pour intégrer les audios.');
  }
}

main().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
