#!/usr/bin/env node

/**
 * Build du site statique (GitHub Pages) - Train Your Brain
 *
 * Produit _site/ :
 *   - le contenu de site/ (page d'accueil, 404.html, robots.txt, assets/), jetons {{VERSION}} et
 *     {{SITE_URL}} remplacés dans les .html ;
 *   - app/index.html : l'application minifiée ;
 *   - api/           : la JSDoc, générée à la volée (docs/api/ n'est pas touché) ;
 *   - .nojekyll.
 *
 * Usage : node scripts/build-site.js [--src <dossier>] [--out <dossier>]
 *   --src  sources statiques (défaut : site/ ; variable SITE_SRC)
 *   --out  dossier de sortie (défaut : _site/ ; variable SITE_OUT)
 *   --jsdoc-config  configuration JSDoc (défaut : jsdoc.json)
 * Variable SITE_URL : adresse publique du site, sans barre finale (défaut :
 * https://jmchantrein.github.io/train-your-brain). Le workflow Pages y met la sortie
 * `base_url` de actions/configure-pages, ce qui suit un éventuel renommage du dépôt.
 * Échoue (code 1) si une étape échoue ou si <src>/index.html est absent.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function readArg(name, fallback) {
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === name) {
      if (!argv[i + 1]) fail(`${name} nécessite une valeur`);
      return argv[i + 1];
    }
    if (argv[i].startsWith(`${name}=`)) return argv[i].slice(name.length + 1);
  }
  return fallback;
}

function fail(message) {
  console.error(`❌ build-site : ${message}`);
  process.exit(1);
}

function run(label, command, args) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(command, args, { cwd: ROOT, stdio: 'inherit' });
  if (result.error) fail(`${label} : ${result.error.message}`);
  if (result.status !== 0) fail(`${label} a échoué (code ${result.status})`);
}

/** Copie récursive ; remplace {{VERSION}} et {{SITE_URL}} dans les fichiers .html. */
function copyDir(src, dest, version, siteUrl) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to, version, siteUrl);
    } else if (entry.isFile()) {
      if (entry.name.toLowerCase().endsWith('.html')) {
        fs.writeFileSync(to, fs.readFileSync(from, 'utf8')
          .replaceAll('{{VERSION}}', version)
          .replaceAll('{{SITE_URL}}', siteUrl));
      } else {
        fs.copyFileSync(from, to);
      }
    }
  }
}

const srcDir = path.resolve(ROOT, readArg('--src', process.env.SITE_SRC || 'site'));
const outDir = path.resolve(ROOT, readArg('--out', process.env.SITE_OUT || '_site'));

if (!fs.existsSync(path.join(srcDir, 'index.html'))) {
  fail(`${path.relative(ROOT, path.join(srcDir, 'index.html'))} est absent`);
}
if (outDir === ROOT || outDir === srcDir || ROOT.startsWith(outDir + path.sep)) {
  fail(`dossier de sortie refusé : ${outDir}`);
}

const jsdocConfig = path.resolve(ROOT, readArg('--jsdoc-config', 'jsdoc.json'));
const DEFAULT_SITE_URL = 'https://jmchantrein.github.io/train-your-brain';
const siteUrl = (process.env.SITE_URL || DEFAULT_SITE_URL).trim().replace(/\/+$/, '');
if (!/^https?:\/\/[^\s"'<>]+$/.test(siteUrl)) fail(`SITE_URL invalide : ${siteUrl}`);
const { version } = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

console.log(`Site : ${path.relative(ROOT, srcDir)}/ → ${path.relative(ROOT, outDir)}/ (version ${version}, URL ${siteUrl})`);
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

console.log('\n▶ Copie des sources statiques');
copyDir(srcDir, outDir, version, siteUrl);

run('Build de l\'application (minifiée)', process.execPath, [
  'scripts/build.js', '--minify', '--output', path.join(outDir, 'app', 'index.html')
]);

// JSDoc : un code de sortie non nul (type non reconnu dans un commentaire, plantage) est fatal.
// Le site publié ne doit pas contenir une documentation d'API partielle.
console.log('\n▶ JSDoc');
const jsdoc = spawnSync(process.execPath, [
  path.join('node_modules', 'jsdoc', 'jsdoc.js'), '-c', jsdocConfig, '-d', path.join(outDir, 'api')
], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
if (jsdoc.error) fail(`JSDoc : ${jsdoc.error.message}`);
if (jsdoc.stderr) process.stderr.write(jsdoc.stderr);
if (jsdoc.status !== 0) fail(`JSDoc a échoué (code ${jsdoc.status})`);

for (const required of ['index.html', 'app/index.html', 'api/index.html']) {
  if (!fs.existsSync(path.join(outDir, required))) fail(`${required} manquant dans ${outDir}`);
}

fs.writeFileSync(path.join(outDir, '.nojekyll'), '');
console.log(`\n✅ Site construit dans ${path.relative(ROOT, outDir)}/`);
