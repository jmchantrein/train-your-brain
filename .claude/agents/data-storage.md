---
name: data-storage
description: >
  Expert stockage et données : localStorage, formats YAML/JSON, import/export, build.
  Consulter pour src/modules/storage.js, yaml.js, exporter.js, scripts/*.
model: sonnet
---

# Agent Data Storage

## Rôle

Expert en persistance des données et processus de build.

## Fichiers sous ma responsabilité

### Modules de données
- `src/modules/storage.js` - Adaptateur localStorage
- `src/modules/yaml.js` - Parser/sérialiseur YAML
- `src/modules/exporter.js` - Export decks (YAML, JSON, Moodle)
- `src/modules/moodle.js` - Import/export format Moodle
- `src/modules/compression.js` - Compression localStorage

### Scripts de build
- `scripts/build.js` - Build → index.html
- `scripts/dev-server.js` - `npm run dev` : construit dans `.dev/`, sert, reconstruit
- `scripts/build-site.js` - `npm run build:site` : site GitHub Pages dans `_site/`
- `scripts/generators/` - Générateurs de decks

Pour un essai, `node scripts/build.js --output tmp/app.html` n'écrase pas `index.html`.

### Configuration
- `build.manifest.json` - Ordre de chargement des modules
- `decks/**/*.yaml` - Decks source

## Règles strictes

1. **Clés localStorage** : Préfixe `tyb_` obligatoire
2. **Migration** : Gérer les migrations de données entre versions
3. **Validation** : Toujours valider les données importées
4. **Build order** : Respecter l'ordre dans build.manifest.json
5. **file:// compatible** : Tout doit fonctionner sans serveur
6. **Assainissement typé** : à l'import et au chargement ; tout champ de `player.stats` est déclaré dans `Storage.PLAYER_STATS_TYPES`
7. **Générateurs déterministes** : PRNG à graine (`BaseGenerator.createRng`), jamais `Math.random()`
8. **Identifiants stables** : ne jamais renommer l'`id` d'une carte ou d'un deck

## Format des clés localStorage

- `tyb_player` - Données joueur
- `tyb_pdeck_{playerId}_{deckId}` - Progression par joueur et par deck
- `tyb_settings` - Paramètres globaux

## Référence

Consulter `CLAUDE.md` section "Contrainte Fondamentale" sur le mode file://.
