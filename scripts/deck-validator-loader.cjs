/**
 * Wrapper CommonJS pour charger le DeckValidator
 * Permet de l'utiliser depuis le script de build ES6
 *
 * Les modules de src/ sont des scripts navigateur : dans ce package
 * ("type": "module"), require() les traiterait comme des modules ES sans
 * export. Ils sont donc évalués ici avec un faux `module`.
 */

const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, '..', 'src', 'modules');

function loadBrowserModule(filename, globals = {}) {
  const filepath = path.join(modulesDir, filename);
  const context = {
    module: { exports: {} },
    exports: {},
    require,
    __dirname: modulesDir,
    __filename: filepath,
    console,
    process,
    ...globals
  };
  const func = new Function(...Object.keys(context), fs.readFileSync(filepath, 'utf8'));
  func(...Object.values(context));
  return context.module.exports;
}

// Même ordre de dépendance que build.manifest.json : TextUtils avant DeckValidator
const TextUtils = loadBrowserModule('text-utils.js');

module.exports = loadBrowserModule('deck-validator.js', { TextUtils });
