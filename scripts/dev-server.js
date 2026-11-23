#!/usr/bin/env node

/**
 * Serveur de Développement - Train Your Brain
 *
 * Cycle de développement :
 * - construit index.html vers .dev/index.html (ignoré par git, jamais la racine) ;
 * - le sert sur http://localhost:3000/ ;
 * - reconstruit quand src/, decks/ ou build.manifest.json changent (anti-rebond) ;
 *   le navigateur doit être rechargé à la main (pas de rechargement automatique).
 *
 * Option --test : sert le dépôt et ouvre tests/runner.html (tests dans le navigateur).
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  port: 3000,
  host: 'localhost',
  devDir: path.join(ROOT, '.dev'),
  debounceMs: 300,
  watched: ['src', 'decks', 'build.manifest.json']
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.yaml': 'text/yaml; charset=utf-8',
  '.yml': 'text/yaml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg'
};

// ═══════════════════════════════════════════════════════════════
// ARGUMENTS
// ═══════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const isTestMode = args.includes('--test');

// ═══════════════════════════════════════════════════════════════
// SERVEUR HTTP
// ═══════════════════════════════════════════════════════════════

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache'
    });
    res.end(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
    }
  }
}

function handleRequest(req, res) {
  let urlPath = req.url.split('?')[0];

  // Redirection racine
  if (urlPath === '/') {
    urlPath = isTestMode ? '/tests/runner.html' : '/index.html';
  }

  // Mode dev : on ne sert que le build (.dev/) ; mode test : tout le dépôt
  const base = isTestMode ? ROOT : CONFIG.devDir;
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('400 Bad Request');
    return;
  }
  const filePath = path.join(base, decoded);

  // Vérifier que le fichier est dans le dossier servi
  if (filePath !== base && !filePath.startsWith(base + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // Servir le fichier
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    serveFile(res, filePath);
  } else if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    // Essayer index.html dans le dossier
    const indexPath = path.join(filePath, 'index.html');
    if (fs.existsSync(indexPath)) {
      serveFile(res, indexPath);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
}

// ═══════════════════════════════════════════════════════════════
// BUILD ET SURVEILLANCE (mode développement)
// ═══════════════════════════════════════════════════════════════

let building = false;
let rebuildQueued = false;

function build() {
  if (building) {
    rebuildQueued = true;
    return Promise.resolve();
  }
  building = true;
  const started = Date.now();
  console.log('🔨 Build en cours...');
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [
      path.join(__dirname, 'build.js'), '--skip-validation', '--output', path.join(CONFIG.devDir, 'index.html')
    ], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', (d) => { output += d; });
    child.stderr.on('data', (d) => { output += d; });
    child.on('close', (code) => {
      building = false;
      if (code === 0) {
        console.log(`✅ Build terminé en ${((Date.now() - started) / 1000).toFixed(1)} s : rechargez la page`);
      } else {
        console.error(`❌ Build échoué (code ${code}), l'ancien fichier reste servi :\n${output.split('\n').slice(-15).join('\n')}`);
      }
      resolve();
      if (rebuildQueued) {
        rebuildQueued = false;
        build();
      }
    });
  });
}

function watch() {
  let timer = null;
  const onChange = (dir, filename) => {
    if (filename && /(^|[\\/])\./.test(String(filename))) return; // fichiers cachés / temporaires
    clearTimeout(timer);
    timer = setTimeout(() => {
      console.log(`📝 Changement détecté (${path.join(dir, String(filename || ''))})`);
      build();
    }, CONFIG.debounceMs);
  };
  for (const entry of CONFIG.watched) {
    const target = path.join(ROOT, entry);
    if (!fs.existsSync(target)) continue;
    const isDir = fs.statSync(target).isDirectory();
    fs.watch(target, { recursive: isDir }, (_event, filename) => onChange(entry, filename));
  }
}

// ═══════════════════════════════════════════════════════════════
// DÉMARRAGE
// ═══════════════════════════════════════════════════════════════

const server = http.createServer(handleRequest);

server.on('error', (err) => {
  console.error(`❌ Impossible de démarrer le serveur : ${err.message}`);
  process.exit(1);
});

function start() {
  server.listen(CONFIG.port, CONFIG.host, () => {
    console.log(`\nTrain Your Brain - serveur de ${isTestMode ? 'tests' : 'développement'}`);
    console.log(`URL : http://${CONFIG.host}:${CONFIG.port}/`);
    if (!isTestMode) {
      console.log('Surveillance : src/, decks/, build.manifest.json (rechargement manuel du navigateur)');
    }
    console.log('Ctrl+C pour arrêter\n');
  });
}

if (isTestMode) {
  start();
} else {
  build().then(() => {
    if (!fs.existsSync(path.join(CONFIG.devDir, 'index.html'))) {
      console.error('❌ Premier build échoué : arrêt.');
      process.exit(1);
    }
    watch();
    start();
  });
}

// Gestion de l'arrêt
process.on('SIGINT', () => {
  console.log('\n👋 Arrêt du serveur...');
  server.close();
  process.exit(0);
});
