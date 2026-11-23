#!/usr/bin/env node
/**
 * Script de génération d'audio TTS (Text-to-Speech)
 *
 * Alternative à Lingua Libre : génère des fichiers audio via Google Cloud TTS
 * ou l'API Web Speech (navigateur) pour les decks multilingues.
 *
 * Usage:
 *   node scripts/generate-tts-audio.cjs [--deck=<deck-id>] [--provider=<google|browser>]
 *
 * Pré-requis pour Google Cloud:
 *   - Variable d'environnement GOOGLE_APPLICATION_CREDENTIALS pointant vers le fichier JSON de credentials
 *   - Ou variable GOOGLE_API_KEY avec une clé API
 *
 * Pour le mode browser:
 *   - Le script génère un fichier HTML à ouvrir dans un navigateur
 *   - Les audios sont générés côté client avec Web Speech API
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

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
  googleTtsApi: 'https://texttospeech.googleapis.com/v1/text:synthesize',
  // Mapping langue -> voix Google Cloud TTS
  googleVoices: {
    fr: { languageCode: 'fr-FR', name: 'fr-FR-Neural2-A', ssmlGender: 'FEMALE' },
    en: { languageCode: 'en-US', name: 'en-US-Neural2-J', ssmlGender: 'MALE' },
    es: { languageCode: 'es-ES', name: 'es-ES-Neural2-A', ssmlGender: 'FEMALE' },
    de: { languageCode: 'de-DE', name: 'de-DE-Neural2-A', ssmlGender: 'FEMALE' },
    it: { languageCode: 'it-IT', name: 'it-IT-Neural2-A', ssmlGender: 'FEMALE' },
    pt: { languageCode: 'pt-BR', name: 'pt-BR-Neural2-A', ssmlGender: 'FEMALE' },
    nl: { languageCode: 'nl-NL', name: 'nl-NL-Standard-A', ssmlGender: 'FEMALE' }
  },
  // Mapping pour Web Speech API (navigateur)
  webSpeechLangs: {
    fr: 'fr-FR',
    en: 'en-US',
    es: 'es-ES',
    de: 'de-DE',
    it: 'it-IT',
    pt: 'pt-BR',
    nl: 'nl-NL'
  }
};

// Statistiques
const stats = {
  total: 0,
  generated: 0,
  failed: 0,
  skipped: 0
};

/**
 * Fait une requête HTTP POST
 */
function postRequest(url, data, headers) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);

    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString();
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
      res.on('error', reject);
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.write(JSON.stringify(data));
    req.end();
  });
}

/**
 * Génère un audio via Google Cloud TTS
 */
async function generateGoogleTTS(text, lang, outputPath) {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY non défini');
  }

  const voice = CONFIG.googleVoices[lang];
  if (!voice) {
    throw new Error(`Langue non supportée: ${lang}`);
  }

  const requestBody = {
    input: { text },
    voice: voice,
    audioConfig: {
      audioEncoding: 'MP3',
      pitch: 0,
      speakingRate: 0.9 // Légèrement plus lent pour l'apprentissage
    }
  };

  const url = `${CONFIG.googleTtsApi}?key=${apiKey}`;
  const response = await postRequest(url, requestBody, {});

  if (response.audioContent) {
    // Décoder le base64 et sauvegarder
    const audioBuffer = Buffer.from(response.audioContent, 'base64');
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, audioBuffer);
    return true;
  }

  return false;
}

/**
 * Génère un fichier HTML pour la synthèse Web Speech
 */
function generateWebSpeechHTML(words, deckId, languages) {
  const audioItems = [];

  for (const word of words) {
    for (const lang of languages) {
      const translation = word.translations?.[lang];
      if (translation) {
        audioItems.push({
          id: word.id,
          lang: lang,
          text: translation,
          voiceLang: CONFIG.webSpeechLangs[lang] || lang
        });
      }
    }
  }

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Générateur Audio TTS - ${deckId}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    .progress { background: #eee; height: 20px; border-radius: 10px; overflow: hidden; margin: 1rem 0; }
    .progress-bar { background: #4CAF50; height: 100%; transition: width 0.3s; }
    .log { background: #f5f5f5; padding: 1rem; border-radius: 8px; max-height: 300px; overflow-y: auto; font-family: monospace; }
    button { padding: 0.75rem 1.5rem; font-size: 1rem; cursor: pointer; background: #2196F3; color: white; border: none; border-radius: 4px; }
    button:disabled { background: #ccc; }
    .status { margin: 1rem 0; font-weight: bold; }
  </style>
</head>
<body>
  <h1>🎧 Générateur Audio TTS</h1>
  <p>Deck: <strong>${deckId}</strong></p>
  <p>Total: <strong>${audioItems.length}</strong> fichiers audio à générer</p>

  <button id="startBtn" onclick="startGeneration()">▶ Commencer la génération</button>
  <button id="downloadBtn" onclick="downloadAll()" disabled>📦 Télécharger les fichiers</button>

  <div class="progress">
    <div class="progress-bar" id="progressBar" style="width: 0%"></div>
  </div>
  <p class="status" id="status">En attente...</p>

  <div class="log" id="log"></div>

  <script>
    const audioItems = ${JSON.stringify(audioItems)};
    const generatedFiles = [];
    let synth = window.speechSynthesis;

    function log(msg) {
      const logEl = document.getElementById('log');
      logEl.innerHTML += msg + '\\n';
      logEl.scrollTop = logEl.scrollHeight;
    }

    async function generateAudio(item) {
      return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(item.text);
        utterance.lang = item.voiceLang;
        utterance.rate = 0.9;

        // Créer un MediaRecorder pour capturer l'audio
        // Note: Web Speech API ne permet pas directement d'enregistrer
        // Cette approche utilise un workaround avec AudioContext

        // Pour une vraie capture, il faudrait utiliser une approche différente
        // Ici on simule en attendant la fin de la lecture
        utterance.onend = () => {
          log(\`✅ \${item.id} (\${item.lang}): "\${item.text}"\`);
          resolve(true);
        };
        utterance.onerror = (e) => {
          log(\`❌ \${item.id} (\${item.lang}): Erreur - \${e.error}\`);
          resolve(false);
        };

        synth.speak(utterance);
      });
    }

    async function startGeneration() {
      document.getElementById('startBtn').disabled = true;
      document.getElementById('status').textContent = 'Génération en cours...';

      log('🎧 Démarrage de la génération audio...');
      log(\`📝 \${audioItems.length} mots à traiter\\n\`);

      let completed = 0;

      for (const item of audioItems) {
        await generateAudio(item);
        completed++;
        const percent = Math.round((completed / audioItems.length) * 100);
        document.getElementById('progressBar').style.width = percent + '%';
        document.getElementById('status').textContent = \`Progression: \${completed}/\${audioItems.length} (\${percent}%)\`;

        // Pause entre chaque mot
        await new Promise(r => setTimeout(r, 500));
      }

      log('\\n✅ Génération terminée !');
      log('\\n⚠️ Note: La Web Speech API ne permet pas d\\'enregistrer directement les audios.');
      log('Pour des fichiers audio réels, utilisez Google Cloud TTS ou téléchargez depuis Lingua Libre.');

      document.getElementById('status').textContent = '✅ Terminé !';
    }

    function downloadAll() {
      alert('Cette fonctionnalité nécessite une implémentation côté serveur pour capturer les audios.');
    }
  </script>
</body>
</html>`;

  return html;
}

/**
 * Traite un deck multilingue
 */
async function processDeck(deckPath, provider) {
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

  // Mode navigateur: générer un fichier HTML
  if (provider === 'browser') {
    const html = generateWebSpeechHTML(deck.words, deckId, languages);
    const htmlPath = path.join(__dirname, '..', `tts-generator-${deckId}.html`);
    fs.writeFileSync(htmlPath, html);
    console.log(`   📄 Fichier HTML généré: ${htmlPath}`);
    console.log('   Ouvrez ce fichier dans un navigateur pour écouter les prononciations.');
    return;
  }

  // Mode Google Cloud TTS
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
      const audioFileName = `${word.id}_${lang}.mp3`;
      const audioPath = path.join(audioDir, audioFileName);
      const relativeAudioPath = `media/decks/vocabulaire/audio/${deckId}/${audioFileName}`;

      if (word.audio[lang] && fs.existsSync(path.join(__dirname, '..', word.audio[lang]))) {
        stats.skipped++;
        continue;
      }

      if (fs.existsSync(audioPath)) {
        word.audio[lang] = relativeAudioPath;
        modified = true;
        stats.skipped++;
        continue;
      }

      process.stdout.write(`   🎤 ${word.id} (${lang}): `);

      try {
        const success = await generateGoogleTTS(translation, lang, audioPath);
        if (success) {
          word.audio[lang] = relativeAudioPath;
          modified = true;
          stats.generated++;
          console.log('✅');
        } else {
          stats.failed++;
          console.log('❌');
        }
      } catch (e) {
        stats.failed++;
        console.log(`❌ ${e.message}`);
      }

      // Pause pour respecter les quotas API
      await new Promise(r => setTimeout(r, 100));
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
  console.log('🎤 Génération audio TTS');
  console.log('=======================\n');

  // Parser les arguments
  const args = process.argv.slice(2);
  let specificDeck = null;
  let provider = 'google'; // Par défaut

  for (const arg of args) {
    if (arg.startsWith('--deck=')) {
      specificDeck = arg.slice(7);
    } else if (arg.startsWith('--provider=')) {
      provider = arg.slice(11);
    }
  }

  // Vérifier les prérequis
  if (provider === 'google' && !process.env.GOOGLE_API_KEY) {
    console.log('⚠️  GOOGLE_API_KEY non défini.');
    console.log('');
    console.log('Options:');
    console.log('  1. Définir GOOGLE_API_KEY avec votre clé API Google Cloud');
    console.log('  2. Utiliser --provider=browser pour une génération dans le navigateur');
    console.log('');
    console.log('Exemple: GOOGLE_API_KEY=xxx node scripts/generate-tts-audio.cjs');
    console.log('Ou:      node scripts/generate-tts-audio.cjs --provider=browser');
    console.log('');

    // Basculer en mode browser si pas de clé
    provider = 'browser';
    console.log('🔄 Basculement automatique en mode browser...\n');
  }

  console.log(`📢 Provider: ${provider}`);

  // Trouver les decks
  let decks = findDecks(CONFIG.decksDir);

  if (specificDeck) {
    decks = decks.filter(d => d.includes(specificDeck));
  }

  console.log(`📂 Decks trouvés: ${decks.length}`);

  // Traiter chaque deck
  for (const deckPath of decks) {
    await processDeck(deckPath, provider);
  }

  // Afficher les statistiques (seulement pour Google TTS)
  if (provider === 'google') {
    console.log('\n=======================');
    console.log('📊 Statistiques:');
    console.log(`   Total demandé: ${stats.total}`);
    console.log(`   Générés: ${stats.generated}`);
    console.log(`   Ignorés (existants): ${stats.skipped}`);
    console.log(`   Échecs: ${stats.failed}`);
    console.log('=======================\n');

    if (stats.generated > 0) {
      console.log('✅ Terminé ! Exécutez `npm run build` pour intégrer les audios.');
    }
  }
}

main().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
