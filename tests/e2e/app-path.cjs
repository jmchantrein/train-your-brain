/**
 * Chemin du fichier construit testé par les specs e2e.
 * Défaut : index.html à la racine du dépôt (comportement de la CI).
 * E2E_APP=<chemin> pointe vers un autre build (relatif au dossier courant).
 */
const path = require('path');

const APP_FILE = process.env.E2E_APP
  ? path.resolve(process.cwd(), process.env.E2E_APP)
  : path.resolve(__dirname, '../../index.html');

module.exports = { APP_FILE, APP_URL: `file://${APP_FILE}` };
