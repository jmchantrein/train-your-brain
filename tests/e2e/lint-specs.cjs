#!/usr/bin/env node
/**
 * Contrôle statique des specs e2e : repère les tests qui peuvent passer sans rien vérifier.
 *
 *   node tests/e2e/lint-specs.cjs [fichier.spec.cjs ...]      (défaut : tous les *.spec.cjs)
 *
 * Détecte :
 *  - route : navigateTo / hash / goto vers une route absente de Router.register (src/ui/app.js) ;
 *  - cond  : `if (await x.isVisible())`, `.count()`, `.isChecked()`... qui enveloppent des assertions ;
 *  - or    : `.or(...)` (localisateur fourre-tout : le test passe si UN des cas existe) ;
 *  - wait  : waitForTimeout (attente fixe) ;
 *  - skip  : test.skip / test.fixme laissés dans le code.
 *
 * Une ligne contenant `lint-ignore` est ignorée (route inconnue voulue, par exemple).
 *
 * Code de sortie 1 si au moins un problème est trouvé.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const appSource = fs.readFileSync(path.join(root, 'src/ui/app.js'), 'utf8');
const routes = new Set([...appSource.matchAll(/Router\.register\('(\/[^']*)'/g)].map(m => m[1]));

const files = process.argv.length > 2
  ? process.argv.slice(2)
  : fs.readdirSync(__dirname).filter(f => f.endsWith('.spec.cjs')).map(f => path.join(__dirname, f));

const rules = [
  { id: 'cond', re: /\bif\s*\(\s*(?:!\s*)?await\b[^)]*\.(?:isVisible|isHidden|isChecked|isEnabled|count)\s*\(/ },
  { id: 'cond', re: /\bif\s*\(\s*await\s+[^)]*\.(?:isVisible|count)\(/ },
  { id: 'or', re: /\.or\(/ },
  { id: 'wait', re: /waitForTimeout\(/ },
  { id: 'skip', re: /\btest\.(?:skip|fixme)\(/ }
];
const routeRe = /(?:navigateTo\(\s*page\s*,\s*|location\.hash\s*=\s*|\.goto\(\s*)[`'"]#?(\/[^`'"?#]*)/g;

let problems = 0;
const counts = {};
for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const report = (id, detail) => {
      problems++;
      counts[id] = (counts[id] || 0) + 1;
      console.log(`${path.relative(root, file)}:${i + 1}: [${id}] ${detail}`);
    };
    if (/^\s*(\/\/|\*)/.test(line) || line.includes('lint-ignore')) return;
    for (const m of line.matchAll(routeRe)) {
      const first = '/' + m[1].split('/').filter(Boolean)[0];
      if (m[1] !== '/' && !routes.has(first)) report('route', `route inexistante ${m[1]}`);
    }
    const seen = new Set();
    for (const { id, re } of rules) {
      if (!seen.has(id) && re.test(line)) { seen.add(id); report(id, line.trim()); }
    }
  });
}
console.log(problems === 0
  ? `OK : ${files.length} fichier(s), aucune spec suspecte (routes connues : ${[...routes].join(' ')})`
  : `${problems} problème(s) : ${JSON.stringify(counts)}`);
process.exit(problems === 0 ? 0 : 1);
