#!/usr/bin/env node
/**
 * Script pour télécharger les audios depuis LinguaLibre/Wikimedia Commons
 * et les ajouter à un deck multilingue
 *
 * Usage: node scripts/download-audios.js <deck.yaml>
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Charger le parser YAML
const yaml = require('js-yaml');

// Configuration
const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

// Codes Wikidata pour les langues (utilisés par Lingua Libre)
const WIKIDATA_LANG_CODES = {
  'fr': 'Q150',
  'en': 'Q1860',
  'es': 'Q1321',
  'de': 'Q188',
  'it': 'Q652',
  'pt': 'Q5146'
};

const LANGUAGE_LABELS = {
  'fr': 'French',
  'en': 'English',
  'es': 'Spanish',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese'
};

/**
 * Fait une requête HTTPS GET
 */
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'TrainYourBrain/1.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Suivre la redirection
        return httpsGet(res.headers.location).then(resolve).catch(reject);
      }

      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Recherche un fichier audio sur Wikimedia Commons
 */
async function findAudioOnCommons(word, langCode) {
  const langLabel = LANGUAGE_LABELS[langCode] || langCode;
  const wikidataCode = WIKIDATA_LANG_CODES[langCode] || 'Q150';
  const wordLower = word.toLowerCase();

  // Patterns de recherche pour Lingua Libre et Commons
  // Format Lingua Libre: LL-Q{code} ({isocode})-speaker-word.wav
  const searchPatterns = [
    `LL-${wikidataCode} ${wordLower}`,           // Lingua Libre avec code Wikidata
    `${langCode.toUpperCase()}-${wordLower}`,    // FR-chat, EN-cat
    `${langCode}-${wordLower}`,                  // fr-chat, en-cat
    `pronunciation ${langLabel} ${wordLower}`,   // pronunciation French chat
    `${wordLower} ${langLabel}`,                 // chat French
  ];

  for (const pattern of searchPatterns) {
    const searchUrl = `${COMMONS_API}?action=query&list=search&srsearch=${encodeURIComponent(pattern)}&srnamespace=6&format=json&srlimit=10`;

    try {
      const response = await httpsGet(searchUrl);
      const data = JSON.parse(response.toString());
      const results = data.query?.search || [];

      for (const result of results) {
        const title = result.title;
        const titleLower = title.toLowerCase();

        // Vérifier que c'est un fichier audio
        if (!titleLower.endsWith('.ogg') && !titleLower.endsWith('.mp3') && !titleLower.endsWith('.wav')) {
          continue;
        }

        // Vérifier que le titre contient le mot (avec variations)
        const wordVariants = [wordLower, wordLower.replace(/[éèêë]/g, 'e'), wordLower.normalize('NFD').replace(/[\u0300-\u036f]/g, '')];
        const hasWord = wordVariants.some(v => titleLower.includes(v));

        // Vérifier que c'est la bonne langue
        const hasLang = titleLower.includes(langCode) ||
                        titleLower.includes(`-${wikidataCode.toLowerCase()}`) ||
                        titleLower.includes(`(${langCode})`) ||
                        title.includes(`LL-${wikidataCode}`);

        if (hasWord && hasLang) {
          const fileUrl = await getCommonsFileUrl(title);
          if (fileUrl) {
            return { url: fileUrl.url, title, license: fileUrl.license };
          }
        }
      }
    } catch (e) {
      // Continuer avec le pattern suivant
    }
  }

  return null;
}

/**
 * Récupère l'URL directe d'un fichier sur Commons
 */
async function getCommonsFileUrl(title) {
  const url = `${COMMONS_API}?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|extmetadata&format=json`;

  try {
    const response = await httpsGet(url);
    const data = JSON.parse(response.toString());
    const pages = data.query?.pages || {};

    for (const page of Object.values(pages)) {
      if (page.imageinfo && page.imageinfo[0]) {
        const info = page.imageinfo[0];
        const extmetadata = info.extmetadata || {};
        return {
          url: info.url,
          license: extmetadata.LicenseShortName?.value || 'Unknown'
        };
      }
    }
  } catch (e) {
    // Silencieux
  }

  return null;
}

/**
 * Télécharge un fichier audio et le convertit en base64
 */
async function downloadAsBase64(url) {
  const buffer = await httpsGet(url);
  return buffer.toString('base64');
}

/**
 * Détermine le format audio depuis l'URL
 */
function getFormatFromUrl(url) {
  const ext = url.split('.').pop().toLowerCase().split('?')[0];
  return ['ogg', 'mp3', 'wav', 'webm'].includes(ext) ? ext : 'ogg';
}

/**
 * Pause async
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Script principal
 */
async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log('Usage: node scripts/download-audios.js <deck.yaml>');
    process.exit(1);
  }

  const inputFile = args[0];
  if (!fs.existsSync(inputFile)) {
    console.error(`Fichier non trouvé: ${inputFile}`);
    process.exit(1);
  }

  console.log(`📂 Lecture de ${inputFile}...`);
  const content = fs.readFileSync(inputFile, 'utf-8');
  const deck = yaml.load(content);

  if (!deck.words || !deck.languages) {
    console.error('Ce deck n\'est pas un deck multilingue valide');
    process.exit(1);
  }

  console.log(`📦 Deck: ${deck.name}`);
  console.log(`🌍 Langues: ${deck.languages.join(', ')}`);
  console.log(`📝 Mots: ${deck.words.length}`);
  console.log('');

  let downloaded = 0;
  let failed = 0;

  for (const word of deck.words) {
    console.log(`\n🔤 ${word.id}`);

    for (const lang of deck.languages) {
      const translation = word.translations[lang];
      if (!translation) continue;

      const text = translation.text;

      // Skip si pas de hasAudio ou si audio déjà présent
      if (!translation.hasAudio) {
        console.log(`   ${lang}: pas d'audio requis`);
        continue;
      }

      if (translation.audio && translation.audio.data) {
        console.log(`   ${lang}: audio déjà présent`);
        continue;
      }

      console.log(`   ${lang}: recherche "${text}"...`);

      try {
        const audioInfo = await findAudioOnCommons(text, lang);

        if (!audioInfo) {
          console.log(`   ${lang}: ❌ non trouvé`);
          failed++;
          // Supprimer hasAudio si pas trouvé
          delete translation.hasAudio;
          continue;
        }

        console.log(`   ${lang}: téléchargement...`);
        const base64 = await downloadAsBase64(audioInfo.url);
        const format = getFormatFromUrl(audioInfo.url);

        // Remplacer hasAudio par les vraies données
        delete translation.hasAudio;
        translation.audio = {
          format: format,
          data: base64,
          license: audioInfo.license || 'CC0'
        };

        console.log(`   ${lang}: ✅ ${format} (${Math.round(base64.length / 1024)}KB)`);
        downloaded++;

        // Pause pour ne pas surcharger l'API
        await sleep(300);

      } catch (error) {
        console.log(`   ${lang}: ❌ erreur: ${error.message}`);
        failed++;
        delete translation.hasAudio;
      }
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Téléchargés: ${downloaded}`);
  console.log(`❌ Échecs: ${failed}`);

  // Sauvegarder le fichier mis à jour
  const outputFile = inputFile.replace('.yaml', '-with-audio.yaml');
  const yamlOutput = yaml.dump(deck, {
    lineWidth: -1,  // Pas de retour à la ligne automatique
    quotingType: '"',
    forceQuotes: false
  });

  fs.writeFileSync(outputFile, yamlOutput);
  console.log(`\n💾 Sauvegardé: ${outputFile}`);
}

main().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
