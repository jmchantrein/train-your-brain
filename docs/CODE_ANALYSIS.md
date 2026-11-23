# Analyse du Code - Train Your Brain

> **État au** : 2026-11-23, après les passes de retrait du code mort (commits `3cd33ee` et `cb72f9d`) et la passe du 2026-11-23 (voir §1)
> **Périmètre** : `src/modules/` (27 fichiers), `src/ui/` (43 fichiers), `src/styles/main.css`, `scripts/`
> **Volumes** : 42 160 lignes JS dans `src/`, 14 275 lignes dans `src/styles/main.css`
> **Historique** : l'analyse détaillée du 2026-11-22 (call graph, environ 40 méthodes mortes, 14 duplications, 35 % de CSS mort) a été remplacée par ce document : ses constats ont été traités ou arbitrés ci-dessous. Elle reste dans l'historique git.

## Méthode et limites

- Recherche par script : pour chaque méthode définie sur un objet global de `src/`, comptage des occurrences de son nom dans `src/`, `tests/`, `scripts/` et `site/`. Un nom apparaissant une seule fois (sa définition) est « sans appelant ». Un nom présent seulement dans `tests/` ou `scripts/` est « appelé uniquement hors application ».
- Heuristique : un nom partagé par deux méthodes masque un symbole mort, et un accès dynamique (`Module[...]`) échapperait à la recherche. Le seul accès dynamique connu est `Pages[pageName]` dans `App._showPage`.
- Rien ci-dessous ne dit qu'un symbole est supprimable sans relire ses appelants.

---

## 1. Retiré

| Quoi | Commit |
|------|--------|
| Fichiers `src/ui/components/deck-card.js`, `src/ui/page-deck.js`, `src/ui/pages.js` (la route `/deck/:id` redirige vers `/game/:id`) | `9b50a72` (manifeste et runner mis en cohérence par `3cd33ee`) |
| Neuf sons inutilisés, accesseurs inutilisés de `Storage`, `Badges`, `Tags`, `YAML`, `A11y`, `State`, `Multilingual`, requête Lingua Libre dont le résultat était ignoré | `3cd33ee` |
| Sept sous-composants de `Components`, assistants de carte de deck de `PageUtils`, deux graphiques, l'effet squelette, copies locales de mélange et de `slugify`, 2 825 lignes de CSS sans balisage correspondant, 83 clés de traduction inutilisées | `cb72f9d` |
| `dev.html` et `scripts/generate-math-decks.cjs` | `b5b673a` |
| Passe du 2026-11-23 : `ComponentCard` (`components/card.js`, avec `tests/card-component.test.js`), `Effects.toast`, `Charts.getXPProgression`, `Leitner._shuffleArray` ; 37 méthodes ou constantes appelées seulement par leurs tests (et `Storage._deletePlayerProgress`, devenue sans appelant) (`A11y` : `focusOn`, `disableSwipe`, `ensureLabel`, `audit` ; `Audio` : `setEnabled`, `convertNoteName`, `playFrequency`, `createContinuousOscillator`, `getAudioContext`, `getMasterGain` ; `Router.getCurrentParams` ; `Themes.checkUnlockedThemes` ; `ErrorHandler` : `safeAsync`, `onError`, `getErrorHistory`, `clearErrorHistory`, `getStorageQuotaInfo` ; `Tags` : `resetCache`, `getByGroup`, `getWithAncestors`, `buildTree` ; `TextUtils` : `normalizeKeepCase`, `truncate` ; `Validator` : `getAccuracyPercentage`, `getDifferences`, `checkAnswerWithDetails` ; `DeckValidator` : `calculateReadability`, `_getExpectedScoreRange` ; `Multilingual.SUPPORTED_LANGUAGES` ; `Compression` : `compressJSON`, `decompressJSON` ; `Storage` : `removePlayerFromList`, `hasBackup`, `clearBackup`, `clearAllBackups`, `listBackups`, `validateSchema`) et leurs tests | `d841a1a` |
| Sauvegardes de secours de `Storage` : branchées (récupération automatique à la lecture, messages de quota et de récupération), voir `docs/ARCHITECTURE.md` | `d841a1a` |
| `scripts/migrate-to-vizutils.cjs`, `scripts/fix-listeners-push.cjs` | `447ae97` |
| `docs/CODE_ANALYSIS_VISUALIZATIONS.md` | `91b23ac` |
| `docs/api/` suivi par git (la JSDoc générée est ignorée) | `1ed035c` |
| Appels vers des méthodes inexistantes (`Validator.check`, `Storage.saveCustomDecks`) | corrigés : plus aucune occurrence dans `src/` |

## 2. Duplications fusionnées dans `TextUtils`

| Utilitaire | Consommateurs qui y délèguent |
|------------|-------------------------------|
| `escapeHtml` (échappe `& < > " '`, sans DOM) | `components.js`, `ErrorHandler`, `LaTeX` |
| `shuffleArray` | `Leitner`, `Challenges`, `Multilingual`, `app.js`, `page-deck-merger.js`, `page-exam.js`, `game/card-type-renderer.js` |
| `levenshteinDistance` | `Validator` (`damerauLevenshtein`, avec transpositions), `Tags`, `DeckValidator` |
| `slugify` | `LinguaLibre`, `PromptGenerator`, `prompt-generator/multilingual-creator.js` |
| `normalizeText` | `Validator`, `DeckValidator` |

La normalisation et l'échappement ne s'écrivent qu'à un endroit : ne pas les réimplémenter (voir `CLAUDE.md`, « Pièges à Éviter »).

## 3. Reste volontairement (liste arbitrée)

| Élément | Raison |
|---------|--------|
| `PromptLearner` (`src/modules/prompt-learner.js`) | Utilisé par le générateur de prompts : `page-prompt-generator.js` (`startSession`, `generatePromptEnhancement`, ajouté au prompt généré) et `prompt-generator/yaml-editor-logic.js` (`recordIteration`, `endSession`). Vérifié le 2026-11-23 : ce sont des appelants réels, le module n'est donc pas supprimé. Sans appelant dans l'application : `compareIterations`, `getCurrentSession` (aucun appelant, test compris) et `exportLearning`, `importLearning`, `getQualityTrend`, `resetDomain` (tests seulement). Documentation : `docs/PROMPT_LEARNER_V2.md` |
| `LeitnerExplanation` (`tutorial.js`) | Appelé seulement par `tests/tutorial.test.js` |
| Méthodes de `DeckTable` sans appelant (`deselectAll`, `getSelectionCount`, `isDeckSelected`, `resetSort`, `resetSourceFilters`, `toggleSourceFilter`) et `DeckEditorSyncController.getMediaCache` | Non traitées : à supprimer ou à brancher |

## 4. API appelée uniquement par les tests ou les scripts

À arbitrer au cas par cas (une API de test peut documenter un comportement) :

- `Audio` : `setVolume` (n'était plus appelée que par `createContinuousOscillator`, retirée)
- `ErrorHandler` : `_errorHistory`, `_addToHistory`, `_notifyCallbacks` et `_errorCallbacks` n'ont plus ni lecteur ni abonné (leurs accesseurs publics sont retirés)
- `Exporter` : `downloadJSON`, `downloadMoodleXML`, `downloadYAML`
- `Storage` : `PLAYER_STATS_FIELDS`
- Autres : `Badges.getByRarity` (retrait laissé à l'agent qui travaille sur `badges.js`), `Challenges._getWeekInfo`, `GameSecretStats._getWeekNumber`, `LaTeX.hasLatex`, `State.update`, `YAML.parseDeck`

## 5. Duplications restantes

| Motif | Emplacements | Note |
|-------|--------------|------|
| Numéro de semaine | `Challenges._getWeekInfo`, `GameSecretStats._getWeekNumber` | Deux implémentations |
| Suppression des accents par `normalize('NFD')` | `tags.js` (1), `deck-validator.js` (2) | Hors `TextUtils` |
| Date en nom de fichier d'export | `components.js`, `page-settings.js` : `toISOString().split('T')[0]` | Date UTC dans un nom de fichier ; le jour du joueur, lui, passe par `TextUtils.getToday` |
| Fabriques de progression de carte et de statistiques de session | `ui/app.js` (littéraux répétés), `scripts/build.js` | Non factorisées |

## 6. Scripts

- `scripts/download-images.cjs`, `download-lingua-libre.cjs`, `generate-tts-audio.cjs` ciblent `decks/vocabulaire/` et `media/decks/vocabulaire/`, deux dossiers absents du dépôt : à corriger ou à archiver avant usage. `scripts/download-audios.cjs` n'a pas été contrôlé.
- `scripts/build.js` : `mangle.reserved` cite `'I18n'` (le global est `i18n`) ; sans effet tant que l'option `toplevel` de Terser n'est pas activée.
- `.claude/agents/viz-auditor.md` : supprimé (commit `6cca04a`).

## 7. Recommandations

1. Décider du sort des méthodes de `PromptLearner` sans appelant (`exportLearning`, `importLearning`, `getQualityTrend`, `resetDomain`, `compareIterations`, `getCurrentSession`).
3. Fusionner les deux calculs de numéro de semaine ; aligner `Tags` et `DeckValidator` sur `TextUtils.normalizeText` pour la suppression des accents.
4. Corriger ou archiver les scripts de téléchargement.
5. Relancer l'analyse après chaque série de retraits : un compteur de méthodes sans appelant qui remonte signale du code mort neuf.
