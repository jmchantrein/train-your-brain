# ROADMAP - Train Your Brain

> **État** : document historique, non maintenu (contenu daté de 2025-12-13). Les fichiers et fonctions cités qui n'existent pas dans le dépôt (par exemple `category-xp.js`) sont des propositions non réalisées. L'état réel du dépôt : `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/SPECIFICATIONS.md`.

> **Dernière mise à jour** : 2025-12-13
> **Version actuelle** : 1.0.0-dev

---

## Fonctionnalités à implémenter

### 1. Système XP par Catégorie (Priorité: Haute)

**Contexte** : Actuellement, les XP sont globaux. L'utilisateur souhaite un système de progression par catégorie/tag pour suivre la maîtrise par domaine.

#### 1.1 Granularité par Taxonomie

**Spécification** :
- Utiliser le niveau le plus fin de la taxonomie existante (`src/modules/tags-taxonomy.js`)
- Chaque tag leaf (feuille) accumule ses propres XP
- Les XP remontent dans l'arbre : un XP gagné sur "algèbre > équations > premier-degré" compte aussi pour "algèbre > équations" et "algèbre"

**Structure de données proposée** :
```javascript
player.categoryXP = {
  'maths': { xp: 1500, level: 5 },
  'maths.algebre': { xp: 800, level: 3 },
  'maths.algebre.equations': { xp: 400, level: 2 },
  'maths.geometrie': { xp: 700, level: 3 },
  // ...
}
```

**Calcul** :
- Quand une carte avec tag `maths.algebre.equations` est réussie :
  1. +XP sur `maths.algebre.equations`
  2. +XP sur `maths.algebre` (parent)
  3. +XP sur `maths` (racine)

#### 1.2 Système de Dégradation

**Spécification** :
- Les niveaux par catégorie peuvent **baisser** avec le temps si non pratiqués
- Dégradation **douce** pour ne pas frustrer l'utilisateur
- Option dans les paramètres pour **désactiver** la dégradation

**Règles de dégradation proposées** :
```javascript
// Après X jours sans pratiquer une catégorie
const DEGRADATION_RULES = {
  daysBeforeStart: 14,      // Commence après 14 jours d'inactivité
  xpLossPerDay: 5,          // Perd 5 XP par jour après le seuil
  maxLossPercent: 20,       // Ne peut pas perdre plus de 20% du total
  minLevel: 1,              // Ne descend jamais en dessous du niveau 1
  protectedDays: 7          // 7 jours de "grâce" après une session
};
```

**Option paramètres** :
```javascript
player.settings.degradationEnabled = true; // Par défaut activé
// Toggle dans page-settings.js
```

**Restauration** :
- Si dégradation a eu lieu, afficher un message encourageant
- "Tu as perdu quelques XP en Maths, mais tu peux les récupérer !"
- Option pour "annuler la dégradation" (one-time) dans paramètres

#### 1.3 Visualisation Arbre Interactif

**Spécification** :
- Nouvelle page ou section dans Stats : "Maîtrise par domaine"
- Arbre interactif (expandable/collapsible)
- Chaque nœud affiche : nom, niveau, XP, progression

**Maquette** :
```
📊 Maîtrise par Domaine
├── 🔢 Mathématiques [Niveau 5] ████████░░ 80%
│   ├── 📐 Algèbre [Niveau 3] ██████░░░░ 60%
│   │   ├── Équations [Niveau 2] ████░░░░░░ 40%
│   │   └── Factorisation [Niveau 4] ███████░░░ 70%
│   └── 📏 Géométrie [Niveau 3] ██████░░░░ 55%
│       ├── Triangles [Niveau 3] ██████░░░░ 58%
│       └── Cercles [Niveau 2] ████░░░░░░ 35%
├── 🌍 Histoire [Niveau 2] ████░░░░░░ 45%
│   └── ...
```

**Interactions** :
- Clic sur une catégorie → détails (cartes maîtrisées, dernière session, etc.)
- Expand/collapse les branches
- Filtre : "Montrer seulement les catégories avec cartes"

#### 1.4 Nouveaux Badges liés aux Catégories

**Badges proposés** :

| ID | Nom | Condition | Rareté |
|----|-----|-----------|--------|
| `category_first` | Premier Pas | Atteindre niveau 2 dans une catégorie | common |
| `category_specialist` | Spécialiste | Atteindre niveau 5 dans une catégorie | rare |
| `category_expert` | Expert | Atteindre niveau 10 dans une catégorie | epic |
| `category_master` | Maître | Atteindre niveau 15 dans une catégorie | legendary |
| `polymath_3` | Touche-à-tout | Niveau 3+ dans 3 catégories différentes | rare |
| `polymath_5` | Polymathe | Niveau 5+ dans 5 catégories différentes | epic |
| `polymath_10` | Génie Universel | Niveau 5+ dans 10 catégories différentes | legendary |
| `comeback` | Retour en Force | Récupérer 100 XP perdus par dégradation | rare |
| `consistent_category` | Régularité | Pratiquer la même catégorie 7 jours de suite | rare |

---

## Fichiers à modifier/créer

### Nouveaux fichiers
- `src/modules/category-xp.js` - Logique XP par catégorie
- `src/ui/page-category-tree.js` - Page visualisation arbre
- `tests/category-xp.test.js` - Tests unitaires

### Fichiers à modifier
- `src/modules/types.js` - Ajouter types CategoryXP
- `src/modules/storage.js` - Sauvegarder categoryXP
- `src/modules/badges.js` - Ajouter badges catégorie
- `src/ui/game/session-tracker.js` - Calculer XP par catégorie
- `src/ui/page-settings.js` - Option dégradation
- `src/ui/page-stats.js` - Lien vers arbre catégories
- `docs/GAMIFICATION.md` - Documenter le système

---

## Notes de discussion

**Décisions prises** :
1. Granularité = niveau le plus fin de la taxonomie
2. Dégradation = douce, désactivable
3. Visualisation = arbre interactif (pas juste une liste)
4. Badges = liés aux catégories + polymathe

**Questions ouvertes** :
- Comment gérer les cartes avec plusieurs tags ? (XP divisé ou XP complet pour chaque ?)
- Afficher la dégradation potentielle avant qu'elle ne se produise ?
- Sons/animations spécifiques pour level-up par catégorie ?

---

## Ordre d'implémentation suggéré

1. **Phase 1** : Structure de données + calcul XP par catégorie
2. **Phase 2** : Visualisation arbre (lecture seule)
3. **Phase 3** : Système de dégradation + option paramètres
4. **Phase 4** : Badges liés aux catégories
5. **Phase 5** : Polish (animations, sons, feedback)

---

## Audit & Correctifs (Priorité: Haute)

### 2. Audit du Calcul XP en Session de Jeu

**Problème identifié** : Le calcul des points XP pendant les sessions de jeu semble incorrect. Une analyse approfondie est nécessaire.

#### 2.1 Points à vérifier

**Sources d'XP à auditer** :
- XP par transition de boîte (purple: +1, orange: +2, green: +3)
- XP bonus de streak (3→+5, 6→+15, 9→+30, 12→+50)
- XP des badges débloqués en session
- XP des défis complétés

**Fichiers concernés** :
- `src/ui/game/session-tracker.js` - Calcul des résultats par carte
- `src/ui/game/session-manager.js` - Mise à jour stats joueur et XP
- `src/modules/xp.js` - Formules et constantes XP
- `src/modules/badges.js` - Attribution badges et XP bonus

#### 2.2 Mécanisme de vérification à implémenter

**Objectif** : Créer un système de vérification qui trace et valide chaque attribution d'XP.

**Proposition** :
```javascript
// Session stats avec traçabilité complète
session.xpBreakdown = {
  cards: [
    { cardId: 'xxx', box: 'green', xp: 3, timestamp: '...' },
    // ...
  ],
  streaks: [
    { streak: 3, bonus: 5, timestamp: '...' },
    { streak: 6, bonus: 15, timestamp: '...' },
  ],
  badges: [
    { badgeId: 'xxx', xp: 50, timestamp: '...' }
  ],
  challenges: [
    { challengeId: 'xxx', xp: 25, timestamp: '...' }
  ],
  calculatedTotal: 0,  // Somme de tous les XP ci-dessus
  reportedTotal: 0,    // Ce qui est affiché à l'utilisateur
  discrepancy: 0       // Différence (devrait être 0)
};
```

**Tests à ajouter** :
```javascript
// tests/xp-calculation.test.js
describe('XP Calculation Audit', () => {
  it('should correctly sum XP from card transitions');
  it('should correctly award streak bonuses');
  it('should not double-count XP sources');
  it('should match session total with player XP increase');
  it('should handle edge cases (session end, card skip, etc.)');
});
```

#### 2.3 Actions requises

1. [ ] Créer un test qui simule une session complète et vérifie chaque source d'XP
2. [ ] Ajouter du logging temporaire pour tracer l'attribution XP en dev
3. [ ] Identifier les écarts entre XP calculé et XP affiché
4. [ ] Corriger les bugs identifiés
5. [ ] Documenter les formules exactes dans `docs/GAMIFICATION.md`

---

## 3. Decks Générés Procéduralement (Priorité: Moyenne)

### 3.1 Concept et Différenciation

**Génération procédurale** = génération **algorithmique** à partir de données structurées, sans LLM.

| Aspect | Génération IA | Génération Procédurale | Manuel |
|--------|--------------|------------------------|--------|
| **Source** | LLM invente | Données vérifiées + algorithmes | Humain |
| **Hallucination** | Risque élevé | **Impossible** | Impossible |
| **Coût** | Tokens API | **Gratuit, local** | Temps humain |
| **Personnalisation** | Limitée | **Infinie** (paramétrable) | Totale |
| **Intégration** | Copier-coller | **YAML inline dans index.html** | YAML |

### 3.2 Métadonnées de Source des Cartes

**Nouveau champ `source` dans les decks** pour tracer l'origine :

```yaml
# Deck généré procéduralement
metadata:
  source:
    type: "procedural"           # "procedural" | "manual" | "ai"
    generator: "multiplication"  # ID du générateur (si procedural)
    version: "1.0.0"             # Version du générateur
    generatedAt: "2025-01-15"    # Date de génération

# Deck généré par IA
metadata:
  source:
    type: "ai"
    model: "claude-3-5-sonnet"   # Modèle utilisé
    provider: "anthropic"        # Fournisseur
    promptVersion: "2.1"         # Version du prompt-generator
    generatedAt: "2025-01-15"
    verifiedBy: "human"          # "human" | "cove" | "unverified"

# Deck créé manuellement
metadata:
  source:
    type: "manual"
    author: "Jean Dupont"        # Auteur (optionnel)
    createdAt: "2025-01-15"
```

**Affichage UI** : Badge dans la liste des decks indiquant la source :
- 🤖 IA (hover → nom du modèle)
- ⚙️ Procédural (hover → nom du générateur)
- ✍️ Manuel

### 3.3 Architecture Technique

```
scripts/
├── build.js                      # Build existant
└── generators/                   # NOUVEAU
    ├── index.js                  # Registre des générateurs
    ├── base-generator.js         # Classe abstraite
    │
    ├── math/                     # 🔢 MATHÉMATIQUES
    │   ├── multiplication.js     # Tables × (1-12)
    │   ├── addition.js           # Tables + (1-20)
    │   ├── subtraction.js        # Soustractions
    │   ├── division.js           # Divisions
    │   ├── powers.js             # Puissances (carrés, cubes, 2^n)
    │   ├── roots.js              # Racines carrées
    │   ├── fractions.js          # Fractions ↔ décimales
    │   └── percentages.js        # Pourcentages courants
    │
    ├── science/                  # 🔬 SCIENCES
    │   ├── periodic-table.js     # Éléments chimiques
    │   ├── si-units.js           # Unités SI + préfixes
    │   ├── constants.js          # Constantes physiques
    │   └── conversions.js        # Conversions unités
    │
    ├── geography/                # 🌍 GÉOGRAPHIE
    │   ├── capitals.js           # Pays ↔ Capitales
    │   ├── flags.js              # Drapeaux (SVG inline)
    │   ├── continents.js         # Pays → Continent
    │   └── fr-departments.js     # Départements français
    │
    ├── languages/                # 🗣️ LANGUES
    │   ├── conjugation-fr.js     # Conjugaison française
    │   ├── irregular-en.js       # Verbes irréguliers anglais
    │   └── frequency.js          # Vocabulaire fréquent
    │
    ├── cs/                       # 💻 INFORMATIQUE
    │   ├── ascii.js              # Table ASCII
    │   ├── binary.js             # Conversions binaire/hex
    │   ├── http-codes.js         # Codes HTTP
    │   ├── complexity.js         # Complexité O()
    │   └── regex.js              # Patterns regex courants
    │
    ├── music/                    # 🎵 MUSIQUE
    │   ├── notes.js              # Notes → Fréquences
    │   ├── intervals.js          # Intervalles musicaux
    │   └── scales.js             # Gammes majeures/mineures
    │
    └── data/                     # 📊 DONNÉES SOURCE
        ├── countries.json        # 193 pays UN
        ├── elements.json         # 118 éléments
        ├── verbs-fr.json         # ~300 verbes FR
        ├── verbs-en-irregular.json # ~200 verbes EN
        ├── si-prefixes.json      # Préfixes SI
        └── constants.json        # Constantes physiques

decks/procedural/                 # Decks générés (gitignored sauf exemples)
├── .gitkeep
└── README.md                     # Documentation des générateurs
```

**Workflow de build** :
```bash
# 1. Générer les decks procéduraux
node scripts/generators/index.cjs --all

# 2. Build standard (inclut les decks générés)
node scripts/build.js
```

### 3.4 Stratégie de Génération : Build-time

**Décision : Génération au BUILD, pas à la volée**

| Aspect | Build-time ✅ | Runtime ❌ |
|--------|--------------|-----------|
| Taille index.html | YAML prégénéré (~300KB) | Scripts + Data (~500KB+) |
| Performance | Instantané | Délai au chargement |
| Validation | Avant distribution | Erreurs possibles en prod |
| Complexité | Simple | Embarquer moteur JS complet |

Les générateurs restent dans `scripts/generators/` (non embarqués), seuls les YAML résultants sont inlinés.

### 3.5 Niveaux Éducatifs par Deck

Chaque deck généré doit avoir un niveau associé :

```yaml
metadata:
  source:
    type: "procedural"
    generator: "multiplication"
  level: "ce2"  # Tag de niveau (voir tags-taxonomy.js)
```

**Mapping des niveaux** (IDs de la taxonomie `tags-taxonomy.js`) :

| Générateur | Niveau (tag ID) |
|------------|-----------------|
| Tables ×/+ (1-5) | `cp` |
| Tables ×/+ (6-10) | `ce2` |
| Tables complètes | `cm1` |
| Fractions simples | `cm1` |
| Fractions complexes | `sixieme` |
| Puissances | `quatrieme` |
| Éléments (1-20) | `cinquieme` |
| Éléments complets | `seconde` |
| Capitales Europe | `cm2` |
| Capitales Monde | `sixieme` |
| Verbes irréguliers EN | `sixieme` |
| Conjugaison FR présent | `ce2` |
| ASCII/Binaire | `seconde` |
| HTTP codes | `licence` |

### 3.6 Médias SVG Pédagogiques

Pour chaque domaine, identifier les représentations visuelles utiles :

#### 🔢 Mathématiques - SVG

| Deck | Type SVG | Description | Exemple |
|------|----------|-------------|---------|
| Multiplications | Grille rectangulaire | 3×4 = grille 3 colonnes × 4 lignes | `<rect>` avec subdivisions |
| Fractions | Cercle/Barre divisé | 1/4 = cercle avec 1 part colorée | `<circle>` + `<path>` secteur |
| Pourcentages | Barre de progression | 25% = barre 1/4 remplie | `<rect>` empilés |
| Géométrie | Figures annotées | Triangle avec côtés a, b, c | `<polygon>` + `<text>` |
| Puissances | Carrés/Cubes visuels | 3² = carré 3×3, 2³ = cube | `<rect>` ou perspective 3D |

#### ⚛️ Sciences - SVG

| Deck | Type SVG | Description |
|------|----------|-------------|
| Éléments chimiques | Modèle atomique simplifié | Noyau + couches électroniques |
| Formules chimiques | Molécules 2D | Liaisons entre atomes (H-O-H) |
| Circuits électriques | Schéma circuit | Symboles normalisés (résistance, pile) |
| Unités SI | Échelle visuelle | Comparaison nano→kilo→mega |

#### 🌍 Géographie - SVG

| Deck | Type SVG | Description |
|------|----------|-------------|
| Pays/Capitales | Contour pays simplifié | Silhouette reconnaissable |
| Drapeaux | Drapeau SVG | Couleurs + motifs exacts |
| Continents | Carte monde | Continent coloré en surbrillance |
| Départements FR | Carte France | Département coloré |

#### 🗣️ Langues - SVG

| Deck | Type SVG | Description |
|------|----------|-------------|
| Hiragana/Katakana | Tracé du caractère | Animation ordre des traits |
| Alphabet arabe | Forme isolée/connectée | Les 4 formes contextuelles |
| Hangul | Composition syllabe | Blocs consonnes + voyelles |

#### 🎵 Musique - SVG

| Deck | Type SVG | Description |
|------|----------|-------------|
| Notes | Portée avec note | Clé de sol + note positionnée |
| Intervalles | Clavier piano | Touches colorées pour l'intervalle |
| Gammes | Cercle des quintes | Position dans le cercle |
| Accords | Diagramme guitare/piano | Doigtés visualisés |

### 3.7 Découpage Précis des Decks

**Principe** : 1 deck = 20-50 cartes max pour une session gérable.

#### 🔢 MATHÉMATIQUES - Découpage

| Deck ID | Nom | Cartes | Tags taxonomie |
|---------|-----|--------|----------------|
| `mult-table-2` | Table de 2 | 11 | `multiplications` |
| `mult-table-3` | Table de 3 | 11 | `multiplications` |
| ... | ... | ... | ... |
| `mult-table-12` | Table de 12 | 11 | `multiplications` |
| `mult-carres` | Carrés parfaits 1-20 | 20 | `puissances`, `multiplications` |
| `mult-complete-1-5` | Tables 1-5 complètes | 36 | `multiplications`, `calcul-mental` |
| `mult-complete-6-10` | Tables 6-10 complètes | 36 | `multiplications`, `calcul-mental` |
| `add-table-1-10` | Additions résultat ≤10 | 55 | `additions` |
| `add-table-11-20` | Additions résultat 11-20 | 100 | `additions` |
| `sub-positive-20` | Soustractions positives ≤20 | 100 | `soustractions` |
| `div-tables-2-5` | Divisions par 2,3,4,5 | 40 | `divisions` |
| `div-tables-6-10` | Divisions par 6-10 | 50 | `divisions` |
| `pow-squares-1-15` | Carrés 1²-15² | 15 | `puissances` |
| `pow-squares-16-30` | Carrés 16²-30² | 15 | `puissances` |
| `pow-cubes` | Cubes 1³-10³ | 10 | `puissances` |
| `pow-2n` | Puissances de 2 (2⁰-2¹⁵) | 16 | `puissances` |
| `frac-halves-quarters` | Moitiés et quarts | 20 | `fractions` |
| `frac-thirds-fifths` | Tiers et cinquièmes | 20 | `fractions` |
| `frac-to-decimal` | Fractions → Décimales | 30 | `fractions`, `decimaux` |
| `percent-common` | Pourcentages courants | 20 | `pourcentages` |
| `trig-remarkable` | Valeurs remarquables sin/cos | 24 | `sinus-cosinus`, `trigonometrie` |

**Total Maths** : ~25 decks, ~600 cartes

#### 💻 INFORMATIQUE - Découpage

| Deck ID | Nom | Cartes | Tags taxonomie |
|---------|-----|--------|----------------|
| `ascii-printable` | ASCII imprimables (32-126) | 95 | `architecture-ordinateurs` |
| `ascii-control` | ASCII contrôle (0-31) | 32 | `architecture-ordinateurs` |
| `binary-0-15` | Binaire 0-15 | 16 | `architecture-ordinateurs` |
| `binary-16-255` | Binaire 16-255 (par 16) | 48 | `architecture-ordinateurs` |
| `hex-0-255` | Hexadécimal 0-255 | 50 | `architecture-ordinateurs` |
| `http-success` | HTTP 2xx Success | 10 | `http-https` |
| `http-redirect` | HTTP 3xx Redirect | 8 | `http-https` |
| `http-client-error` | HTTP 4xx Client Error | 15 | `http-https` |
| `http-server-error` | HTTP 5xx Server Error | 8 | `http-https` |
| `complexity-basic` | Complexité O() de base | 15 | `complexite` |
| `complexity-algos` | Complexité algorithmes courants | 25 | `complexite`, `algorithmique` |
| `logic-gates` | Portes logiques | 32 | `portes-logiques`, `circuits-logiques` |
| `boolean-laws` | Lois booléennes | 15 | `algebre-boole` |
| `linux-files` | Commandes fichiers Linux | 25 | `commandes-linux` |
| `linux-system` | Commandes système Linux | 25 | `commandes-linux` |
| `regex-basics` | Regex de base | 20 | `expressions-regulieres` |
| `subnets-cidr` | Masques CIDR courants | 16 | `sous-reseaux`, `adressage-ip` |

**Total Info** : ~17 decks, ~450 cartes

#### ⚛️ SCIENCES PHYSIQUES - Découpage

| Deck ID | Nom | Cartes | Tags taxonomie |
|---------|-----|--------|----------------|
| `elem-1-20` | Éléments 1-20 (H→Ca) | 40 | `tableau-periodique` |
| `elem-21-40` | Éléments 21-40 (Sc→Zr) | 40 | `tableau-periodique` |
| `elem-41-60` | Éléments 41-60 (Nb→Nd) | 40 | `tableau-periodique` |
| `elem-metals` | Métaux courants | 30 | `tableau-periodique` |
| `elem-nonmetals` | Non-métaux | 20 | `tableau-periodique` |
| `elem-symbols-quiz` | Symboles → Noms | 50 | `tableau-periodique` |
| `formulas-common` | Formules courantes (H₂O, CO₂...) | 30 | `liaisons-chimiques` |
| `formulas-acids` | Acides courants | 15 | `acides-bases` |
| `si-units-base` | 7 unités SI de base | 7 | `mecanique-classique` |
| `si-prefixes` | Préfixes SI (n→T) | 20 | `mecanique-classique` |
| `constants-physics` | Constantes physiques | 15 | `mecanique-classique` |
| `convert-length` | Conversions longueur | 20 | `mecanique-classique` |
| `convert-mass` | Conversions masse | 15 | `mecanique-classique` |
| `convert-temp` | Conversions température | 20 | `thermodynamique` |
| `ohm-law` | Applications loi d'Ohm | 25 | `loi-ohm`, `circuits-electriques` |
| `resistor-colors` | Code couleurs résistances | 30 | `circuits-electriques` |

**Total Sciences** : ~16 decks, ~420 cartes

#### 🌍 GÉOGRAPHIE - Découpage

| Deck ID | Nom | Cartes | Tags taxonomie |
|---------|-----|--------|----------------|
| `geo-europe-capitals` | Capitales Europe | 44 | `geographie` |
| `geo-asia-capitals` | Capitales Asie | 48 | `geographie` |
| `geo-africa-capitals` | Capitales Afrique | 54 | `geographie` |
| `geo-americas-capitals` | Capitales Amériques | 35 | `geographie` |
| `geo-oceania-capitals` | Capitales Océanie | 14 | `geographie` |
| `geo-europe-flags` | Drapeaux Europe | 44 | `geographie` |
| `geo-asia-flags` | Drapeaux Asie | 48 | `geographie` |
| `geo-africa-flags` | Drapeaux Afrique | 54 | `geographie` |
| `geo-americas-flags` | Drapeaux Amériques | 35 | `geographie` |
| `geo-fr-dept-01-25` | Départements FR 01-25 | 25 | `geographie` |
| `geo-fr-dept-26-50` | Départements FR 26-50 | 25 | `geographie` |
| `geo-fr-dept-51-75` | Départements FR 51-75 | 25 | `geographie` |
| `geo-fr-dept-76-95` | Départements FR 76-95 | 20 | `geographie` |
| `geo-fr-dom-tom` | DOM-TOM | 6 | `geographie` |
| `geo-fr-regions` | Régions → Préfectures | 13 | `geographie` |
| `geo-us-states` | États USA → Capitales | 50 | `geographie` |

**Total Géo** : ~16 decks, ~540 cartes

#### 🗣️ LANGUES - Découpage

| Deck ID | Nom | Cartes | Tags taxonomie |
|---------|-----|--------|----------------|
| `fr-conj-present-1` | Présent 1er groupe (50v) | 300 | `fr-conjugaison` |
| `fr-conj-present-2` | Présent 2ème groupe (30v) | 180 | `fr-conjugaison` |
| `fr-conj-present-3` | Présent 3ème groupe (50v) | 300 | `fr-conjugaison` |
| `fr-conj-pc-1` | Passé composé 1er gr | 300 | `fr-conjugaison` |
| `fr-conj-pc-2-3` | Passé composé 2-3ème gr | 300 | `fr-conjugaison` |
| `fr-conj-imparfait` | Imparfait (50v) | 300 | `fr-conjugaison` |
| `fr-conj-futur` | Futur simple (50v) | 300 | `fr-conjugaison` |
| `en-irreg-a-g` | Verbes irréguliers A-G | 70 | `en-conjugation` |
| `en-irreg-h-p` | Verbes irréguliers H-P | 70 | `en-conjugation` |
| `en-irreg-r-z` | Verbes irréguliers R-Z | 60 | `en-conjugation` |
| `en-irreg-common-50` | 50 verbes les plus courants | 50 | `en-conjugation` |
| `ja-hiragana` | Hiragana (46 caractères) | 46 | `ja-hiragana` |
| `ja-katakana` | Katakana (46 caractères) | 46 | `ja-katakana` |
| `ru-cyrillic` | Alphabet cyrillique | 33 | `ru-alphabet` |
| `ar-alphabet` | Alphabet arabe | 28 | `ar-alphabet` |
| `ko-hangul-vowels` | Hangul voyelles | 21 | `ko-hangul` |
| `ko-hangul-consonants` | Hangul consonnes | 19 | `ko-hangul` |
| `grc-alphabet` | Alphabet grec | 24 | `grc-alphabet` |
| `fr-freq-500` | 500 mots FR fréquents | 500 | `fr-vocabulaire` |
| `en-freq-500` | 500 mots EN fréquents | 500 | `en-vocabulary` |

**Total Langues** : ~20 decks, ~3500 cartes

#### 🎵 MUSIQUE - Découpage

| Deck ID | Nom | Cartes | Tags taxonomie |
|---------|-----|--------|----------------|
| `music-notes-treble` | Notes clé de sol | 20 | `lecture-notes`, `solfege` |
| `music-notes-bass` | Notes clé de fa | 20 | `lecture-notes`, `solfege` |
| `music-intervals` | Intervalles | 12 | `intervalles`, `solfege` |
| `music-scales-major` | Gammes majeures | 12 | `gammes`, `solfege` |
| `music-scales-minor` | Gammes mineures | 12 | `gammes`, `solfege` |
| `music-chords-major` | Accords majeurs | 12 | `accords-musique` |
| `music-chords-minor` | Accords mineurs | 12 | `accords-musique` |
| `music-key-sig` | Armures (# et ♭) | 15 | `solfege` |
| `music-tempo-terms` | Termes de tempo | 25 | `theorie-musicale` |
| `music-dynamics` | Nuances (pp→ff) | 15 | `theorie-musicale` |

**Total Musique** : ~10 decks, ~155 cartes

### 3.8 Résumé du Découpage

| Domaine | Decks | Cartes | Tags couverts |
|---------|-------|--------|---------------|
| Mathématiques | 25 | ~600 | 12 tags |
| Informatique | 17 | ~450 | 15 tags |
| Sciences Physiques | 16 | ~420 | 8 tags |
| Géographie | 16 | ~540 | 1 tag (+ sous-tags) |
| Langues | 20 | ~3500 | 18 tags |
| Musique | 10 | ~155 | 6 tags |
| **TOTAL** | **104** | **~5665** | **60 tags** |

### 3.9 Validation Taxonomie

**Question : Notre taxonomie couvre-t-elle tous les decks ?**

✅ **OUI**, tous les decks peuvent être catégorisés :

```
sciences
├── maths
│   ├── arithmetique
│   │   ├── multiplications ✅
│   │   ├── additions ✅
│   │   ├── soustractions ✅
│   │   ├── divisions ✅
│   │   ├── fractions ✅
│   │   ├── pourcentages ✅
│   │   └── puissances ✅
│   └── geometrie
│       └── trigonometrie
│           └── sinus-cosinus ✅
├── informatique
│   ├── architecture-ordinateurs ✅ (ASCII, binaire)
│   ├── algorithmique
│   │   └── complexite ✅
│   ├── reseaux
│   │   ├── protocoles-reseau
│   │   │   └── http-https ✅
│   │   └── adressage-ip
│   │       └── sous-reseaux ✅
│   └── theorie-informatique
│       └── circuits-logiques
│           ├── portes-logiques ✅
│           └── algebre-boole ✅
└── sciences-physiques
    ├── chimie
    │   ├── tableau-periodique ✅
    │   ├── liaisons-chimiques ✅
    │   └── acides-bases ✅
    └── physique
        ├── mecanique-classique ✅ (SI, constantes)
        ├── thermodynamique ✅
        └── electromagnetisme
            └── circuits-electriques ✅

sciences-humaines
└── geographie ✅ (capitales, drapeaux, départements)

langues
├── francais
│   ├── fr-conjugaison ✅
│   └── fr-vocabulaire ✅
├── anglais
│   ├── en-conjugation ✅
│   └── en-vocabulary ✅
├── japonais
│   ├── ja-hiragana ✅
│   └── ja-katakana ✅
├── russe
│   └── ru-alphabet ✅
├── arabe
│   └── ar-alphabet ✅
├── coreen
│   └── ko-hangul ✅
└── grec-ancien
    └── grc-alphabet ✅

arts
└── musique
    ├── solfege
    │   ├── lecture-notes ✅
    │   ├── intervalles ✅
    │   └── gammes ✅
    ├── accords-musique ✅
    └── theorie-musicale ✅
```

**Couverture** : 60/800+ tags de la taxonomie utilisés (~7,5%)
Potentiel d'extension important pour de futurs générateurs.

### 3.10 Liste Exhaustive des Sujets (alignés taxonomie)

#### 🔢 MATHÉMATIQUES (`sciences` → `maths`)

| Tag taxonomie | Générateur | Paramètres | Cartes | Priorité |
|--------------|------------|------------|--------|----------|
| `multiplications` | multiplication.js | plage 1-12, carrés only | 144+ | ⭐⭐⭐ |
| `additions` | addition.js | plage 1-20, résultat max | 400+ | ⭐⭐⭐ |
| `soustractions` | subtraction.js | avec/sans négatifs | 400+ | ⭐⭐ |
| `divisions` | division.js | dividende/diviseur max | 100+ | ⭐⭐ |
| `puissances` | powers.js | carrés 1-30, cubes 1-15, 2^n | 65+ | ⭐⭐ |
| `racines` | roots.js | √1 à √400 (entiers parfaits) | 20 | ⭐⭐ |
| `fractions` | fractions.js | équivalences, ↔ décimales | 100+ | ⭐⭐ |
| `pourcentages` | percentages.js | 10%, 25%, 33%, 50%, 75%... | 30+ | ⭐⭐ |
| `calcul-mental` | mental-math.js | combinaisons opérations | 500+ | ⭐⭐⭐ |
| `sinus-cosinus` | trig-values.js | valeurs remarquables 0°-360° | 24 | ⭐ |
| `identites-remarquables` | identities.js | (a+b)², a²-b², etc. | 10 | ⭐ |

#### 💻 INFORMATIQUE (`sciences` → `informatique`)

| Tag taxonomie | Générateur | Contenu | Cartes | Priorité |
|--------------|------------|---------|--------|----------|
| `architecture-ordinateurs` | ascii.js | Table ASCII 32-126 | 95 | ⭐⭐ |
| `architecture-ordinateurs` | binary.js | Binaire ↔ Décimal 0-255 | 256 | ⭐⭐ |
| `architecture-ordinateurs` | hex.js | Hexadécimal ↔ Décimal | 256 | ⭐⭐ |
| `http-https` | http-codes.js | Codes HTTP (200, 404, 500...) | 40+ | ⭐⭐ |
| `complexite` | complexity.js | O(1), O(n), O(log n)... | 25 | ⭐⭐ |
| `expressions-regulieres` | regex.js | Patterns courants | 30 | ⭐ |
| `portes-logiques` | logic-gates.js | AND, OR, XOR, NOT tables | 32 | ⭐⭐ |
| `algebre-boole` | boolean.js | Lois de De Morgan, etc. | 15 | ⭐ |
| `sous-reseaux` | subnets.js | CIDR, masques courants | 20 | ⭐ |
| `commandes-linux` | linux-cmd.js | Commandes essentielles | 50+ | ⭐⭐ |
| `raccourcis-clavier` | shortcuts.js | VS Code, Terminal, etc. | 100+ | ⭐ |

#### ⚛️ SCIENCES PHYSIQUES (`sciences` → `sciences-physiques`)

| Tag taxonomie | Générateur | Contenu | Cartes | Priorité |
|--------------|------------|---------|--------|----------|
| `tableau-periodique` | periodic-table.js | Symboles ↔ Noms (1-118) | 236 | ⭐⭐⭐ |
| `tableau-periodique` | atomic-numbers.js | Z = 1-30 | 30 | ⭐⭐ |
| `liaisons-chimiques` | common-formulas.js | H₂O, CO₂, NaCl... | 50 | ⭐⭐ |
| `mecanique-classique` | si-units.js | 7 unités de base SI | 7 | ⭐⭐ |
| `mecanique-classique` | si-prefixes.js | nano→tera (préfixes) | 20 | ⭐⭐ |
| `mecanique-classique` | constants.js | c, G, h, NA, k... | 15 | ⭐ |
| `mecanique-classique` | conversions.js | km↔miles, kg↔lb... | 50+ | ⭐⭐ |
| `loi-ohm` | ohms-law.js | V=IR applications | 30 | ⭐ |
| `circuits-electriques` | resistors.js | Code couleurs résistances | 30 | ⭐ |
| `thermodynamique` | temperature.js | °C↔°F↔K conversions | 30 | ⭐ |

#### 🌍 GÉOGRAPHIE (`sciences-humaines` → `geographie`)

| Tag taxonomie | Générateur | Contenu | Cartes | Priorité |
|--------------|------------|---------|--------|----------|
| `geographie` | capitals.js | 193 pays UN → Capitales | 386 | ⭐⭐⭐ |
| `geographie` | flags.js | Drapeaux → Pays (SVG) | 193 | ⭐⭐⭐ |
| `geographie` | continents.js | Pays → Continent | 193 | ⭐⭐ |
| `geographie` | currencies.js | Pays → Monnaie | 150+ | ⭐ |
| `geographie` | fr-departments.js | 101 départements FR | 202 | ⭐⭐ |
| `geographie` | fr-regions.js | 13 régions → Préfectures | 26 | ⭐ |
| `geographie` | us-states.js | 50 états USA → Capitales | 100 | ⭐⭐ |

#### 🗣️ LANGUES

| Tag taxonomie | Générateur | Contenu | Cartes | Priorité |
|--------------|------------|---------|--------|----------|
| `fr-conjugaison` | conj-fr-present.js | Présent (300 verbes × 6) | 1800 | ⭐⭐⭐ |
| `fr-conjugaison` | conj-fr-pc.js | Passé composé | 1800 | ⭐⭐ |
| `fr-conjugaison` | conj-fr-imparfait.js | Imparfait | 1800 | ⭐⭐ |
| `fr-conjugaison` | conj-fr-futur.js | Futur simple | 1800 | ⭐⭐ |
| `en-conjugation` | irregular-en.js | V1/V2/V3 (200 verbes) | 600 | ⭐⭐⭐ |
| `es-conjugacion` | conj-es-presente.js | Présent espagnol | 1500+ | ⭐⭐ |
| `de-konjugation` | conj-de-prasens.js | Présent allemand | 1500+ | ⭐⭐ |
| `fr-vocabulaire` | freq-fr.js | Top 1000 mots FR | 1000 | ⭐⭐ |
| `en-vocabulary` | freq-en.js | Top 1000 mots EN | 1000 | ⭐⭐ |
| `ja-hiragana` | hiragana.js | 46 caractères | 92 | ⭐⭐ |
| `ja-katakana` | katakana.js | 46 caractères | 92 | ⭐⭐ |
| `zh-pinyin` | pinyin-tones.js | Tons 1-4 + neutre | 50 | ⭐ |
| `ru-alphabet` | cyrillic.js | Alphabet cyrillique | 66 | ⭐⭐ |
| `ar-alphabet` | arabic-letters.js | Alphabet arabe | 56 | ⭐⭐ |
| `ko-hangul` | hangul.js | Syllabes de base | 140 | ⭐⭐ |
| `grc-alphabet` | greek-letters.js | Alphabet grec | 48 | ⭐ |

#### 🎵 MUSIQUE (`arts` → `musique`)

| Tag taxonomie | Générateur | Contenu | Cartes | Priorité |
|--------------|------------|---------|--------|----------|
| `lecture-notes` | notes-freq.js | Notes → Fréquences (A4=440) | 88 | ⭐ |
| `intervalles` | intervals.js | Demi-tons → Nom intervalle | 12 | ⭐⭐ |
| `gammes` | scales.js | Gammes majeures 12 tonalités | 24 | ⭐⭐ |
| `accords-musique` | chords.js | Maj/min/7 (36 accords) | 36 | ⭐ |
| `solfege` | key-signatures.js | Armures (# et ♭) | 15 | ⭐ |
| `theorie-musicale` | italian-terms.js | Termes tempo/dynamique | 50 | ⭐ |

### 3.5 Interface Générateur

```javascript
// scripts/generators/base-generator.cjs
class BaseGenerator {
  constructor(config) {
    this.id = config.id;           // "multiplication"
    this.name = config.name;       // "Tables de multiplication"
    this.tags = config.tags;       // ["multiplications", "calcul-mental"]
    this.version = config.version; // "1.0.0"
  }

  // À implémenter par chaque générateur
  generate(options) {
    throw new Error('generate() must be implemented');
  }

  // Génère le deck complet avec métadonnées
  buildDeck(options = {}) {
    const cards = this.generate(options);

    return {
      name: options.name || this.name,
      description: options.description || `Généré par ${this.id}`,
      tags: [...this.tags, ...(options.extraTags || [])],
      settings: {
        sequential: options.sequential ?? false,
        bidirectional: options.bidirectional ?? false,
        ...options.settings
      },
      metadata: {
        source: {
          type: 'procedural',
          generator: this.id,
          version: this.version,
          generatedAt: new Date().toISOString().split('T')[0],
          parameters: options  // Traçabilité des paramètres
        }
      },
      cards: cards.map((card, i) => ({
        id: `${this.id}_${String(i + 1).padStart(3, '0')}`,
        ...card
      }))
    };
  }
}
```

### 3.6 Exemple de Générateur

```javascript
// scripts/generators/math/multiplication.cjs
const BaseGenerator = require('../base-generator');

class MultiplicationGenerator extends BaseGenerator {
  constructor() {
    super({
      id: 'multiplication',
      name: 'Tables de multiplication',
      tags: ['multiplications', 'calcul-mental', 'arithmetique'],
      version: '1.0.0'
    });
  }

  generate(options = {}) {
    const {
      minFactor = 1,
      maxFactor = 12,
      squaresOnly = false,
      excludeOne = false,
      excludeZero = true
    } = options;

    const cards = [];
    const start = excludeZero ? Math.max(minFactor, 1) : minFactor;

    for (let a = start; a <= maxFactor; a++) {
      const bStart = squaresOnly ? a : start;
      for (let b = bStart; b <= maxFactor; b++) {
        if (excludeOne && (a === 1 || b === 1)) continue;

        cards.push({
          question: `${a} × ${b} = ?`,
          answer: a * b,
          type: 'numeric',
          feedback: `${a} × ${b} = ${a * b}`
        });

        // Bidirectionnel si pas carré
        if (!squaresOnly && a !== b) {
          cards.push({
            question: `${b} × ${a} = ?`,
            answer: b * a,
            type: 'numeric',
            feedback: `${b} × ${a} = ${b * a}`
          });
        }
      }
    }

    return cards;
  }
}

module.exports = MultiplicationGenerator;
```

### 3.7 Plan d'Implémentation

#### Phase 1 : Infrastructure (2-3 jours)
- [ ] Créer `scripts/generators/base-generator.cjs`
- [ ] Créer `scripts/generators/index.cjs` (registre + CLI)
- [ ] Modifier `scripts/build.js` pour inclure decks procéduraux
- [ ] Ajouter type `source` dans `types.js`
- [ ] UI : Badge source dans liste des decks

#### Phase 2 : Générateurs Prioritaires (5-7 jours)
- [ ] `multiplication.js` - Tables de multiplication
- [ ] `capitals.js` - Pays/Capitales (193)
- [ ] `periodic-table.js` - Éléments chimiques (118)
- [ ] `irregular-en.js` - Verbes irréguliers anglais (~200)
- [ ] `conj-fr-present.js` - Conjugaison FR présent

#### Phase 3 : Générateurs Secondaires (5-7 jours)
- [ ] `addition.js`, `subtraction.js`, `division.js`
- [ ] `powers.js`, `roots.js`
- [ ] `ascii.js`, `binary.js`, `http-codes.js`
- [ ] `si-units.js`, `si-prefixes.js`, `conversions.js`
- [ ] `flags.js` (avec SVG inline)

#### Phase 4 : Générateurs Avancés (optionnel)
- [ ] Conjugaison FR autres temps
- [ ] Conjugaison ES, DE
- [ ] Alphabets (hiragana, katakana, cyrillique, arabe)
- [ ] Musique (intervalles, gammes)

### 3.8 Fichiers Données Source

Les données structurées seront stockées dans `scripts/generators/data/` :

| Fichier | Contenu | Source |
|---------|---------|--------|
| `countries.json` | 193 pays UN + capitales + codes ISO | UN + Wikipedia |
| `elements.json` | 118 éléments + symboles + Z | IUPAC |
| `verbs-fr.json` | ~300 verbes + conjugaisons | Bescherelle |
| `verbs-en-irregular.json` | ~200 verbes V1/V2/V3 | Oxford |
| `si-prefixes.json` | yocto→yotta | BIPM |
| `constants.json` | Constantes physiques + valeurs | CODATA |
| `frequencies-fr.json` | Top 5000 mots FR | Lexique.org |
| `frequencies-en.json` | Top 5000 mots EN | COCA |

---

## 4. TODO Lists Détaillées - Génération Procédurale

> **⚠️ SECTION À VALIDER AVANT IMPLÉMENTATION**
> Ces todo lists sont basées sur des recherches web approfondies. Chaque domaine inclut les sources, les décisions pédagogiques et les spécifications techniques.

### 4.1 🔢 MATHÉMATIQUES - Todo List

#### Recherches effectuées

**Sources consultées** :
- [The Hechinger Report - Flashcards vs Repetition](https://hechingerreport.org/proof-points-flashcards-prevail-over-repetition-in-memorizing-multiplication-tables/) - Étude 2023 (Pays-Bas) : flashcards > répétition orale
- [SpringerLink - Teaching Multiplication Tables](https://link.springer.com/chapter/10.1007/978-3-030-28561-6_6) - Drill structuré puis aléatoire
- [Kate's Homeschool Math](https://kateshomeschoolmath.com/everything-you-need-teach-addition-facts/) - Maîtrise additions en CP-CE1
- [Third Space Learning](https://thirdspacelearning.com/us/blog/teaching-addition-subtraction-elementary/) - Progression pédagogique

**Décisions pédagogiques** :
- ✅ Tables de multiplication : 1-12 (standard international, horloge)
- ✅ Ordre : d'abord séquentiel par table, puis aléatoire pour consolidation
- ✅ "Friends of 10" (compléments à 10) = deck prioritaire pour additions
- ✅ Pas de feedback pour calculs triviaux (3+3=6 → pas de "parce que 3+3=6")
- ✅ Feedback utile pour patterns : "9×n = 10n - n" ou "carrés parfaits"
- ✅ SVG : grilles rectangulaires pour multiplications, secteurs pour fractions

#### Todo List Mathématiques

```
GÉNÉRATEUR: multiplication.js
├── [ ] Tables individuelles 2-12 (11 decks × 11 cartes = 121)
│   ├── Paramètres: table=n, includeSquare=true
│   ├── Format: "n × m = ?" → réponse numérique
│   ├── SVG: grille n×m colorée
│   └── Niveaux: `ce1` (tables 2-5), `ce2` (6-9), `cm1` (10-12)
├── [ ] Deck "Carrés parfaits 1-20" (20 cartes)
│   ├── Format: "n² = ?" et "√m = ?" (bidirectionnel)
│   ├── SVG: carré n×n avec comptage visuel
│   └── Feedback: "n² = n × n"
├── [ ] Deck "Tables complètes mélangées" (144 cartes, sans doublons)
│   ├── Mode aléatoire obligatoire
│   └── Niveau: `cm1`
└── [ ] Tests unitaires
    ├── Vérifier 0 doublons
    ├── Vérifier couverture 2×2 à 12×12
    └── Vérifier format YAML valide

GÉNÉRATEUR: addition.js
├── [ ] "Compléments à 10" (Friends of 10) - 10 cartes - PRIORITÉ
│   ├── 1+9, 2+8, 3+7, 4+6, 5+5
│   ├── Bidirectionnel: "1 + ? = 10" et "10 - 1 = ?"
│   ├── SVG: barre divisée en 2 couleurs
│   └── Niveau: `cp`
├── [ ] Additions résultat ≤10 (55 cartes)
│   └── 0+0 à 5+5 (combinaisons uniques)
├── [ ] Additions résultat 11-20 (cartes "pont du 10")
│   ├── Ex: 8+5 = 8+2+3 = 10+3 = 13
│   └── Feedback: décomposition par le 10
└── [ ] Doubles (1+1 à 10+10) - 10 cartes
    └── Mnémotechniques: "2+2 = 4 pattes du chien"

GÉNÉRATEUR: subtraction.js
├── [ ] Soustractions simples (résultat positif ≤20)
├── [ ] Soustractions "défaire l'addition" (complémentaires)
└── [ ] Option: inclure négatifs (niveau collège)

GÉNÉRATEUR: division.js
├── [ ] Divisions par 2-10 (tables inversées)
│   ├── Format: "24 ÷ 6 = ?" ET "24 ÷ ? = 4"
│   └── Feedback: lien avec multiplication
└── [ ] Divisions avec reste (niveau CM)

GÉNÉRATEUR: powers.js
├── [ ] Carrés 1²-30² (30 cartes)
├── [ ] Cubes 1³-10³ (10 cartes)
├── [ ] Puissances de 2: 2⁰-2¹⁵ (16 cartes)
│   └── Informatique: 1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024...
└── [ ] Puissances de 10: 10⁰-10⁹ (10 cartes)
    └── Avec préfixes SI associés

GÉNÉRATEUR: fractions.js
├── [ ] Fractions → Décimales (1/2, 1/3, 1/4, 1/5, 1/8, 1/10...)
├── [ ] Pourcentages ↔ Fractions (50%=1/2, 25%=1/4, 33%≈1/3...)
├── [ ] SVG: cercle/barre divisé avec partie colorée
└── [ ] Équivalences: 1/2 = 2/4 = 3/6...

GÉNÉRATEUR: roman-numerals.js (NOUVEAU)
├── [ ] Chiffres romains 1-100 (priorité: 1-12 pour horloges)
├── [ ] Règles: I=1, V=5, X=10, L=50, C=100, D=500, M=1000
│   └── Niveau: `cm1` (1-100), `sixieme` (1-1000)
└── Source: [GeeksforGeeks - Roman Numerals](https://www.geeksforgeeks.org/maths/roman-numerals/)

GÉNÉRATEUR: trig-values.js
├── [ ] Valeurs remarquables sin/cos/tan (0°, 30°, 45°, 60°, 90°)
├── [ ] Format: "sin(30°) = ?" → "1/2" ou "0.5"
└── [ ] Niveau: `troisieme`
```

**Cartes totales Maths** : ~700+ cartes

---

### 4.2 💻 INFORMATIQUE - Todo List

#### Recherches effectuées

**Sources consultées** :
- [GitHub Education - Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf) - Commandes Git officielles
- [Ubuntu - Command Line for Beginners](https://ubuntu.com/tutorials/command-line-for-beginners) - Commandes Linux essentielles
- [VS Code Shortcuts - DEV Community](https://dev.to/devland/100-crucial-keyboard-shortcuts-for-vs-code-users-4474) - 100 raccourcis
- [GeeksforGeeks - Binary Conversion](https://www.geeksforgeeks.org/digital-logic/number-system-and-base-conversions/) - Conversions numériques
- [Quizlet - Binary/Hex Practice](https://quizlet.com/481962210/binary-decimal-hexadecimal-practice-flash-cards/) - Format flashcards

**Décisions pédagogiques** :
- ✅ Binaire/Hex : groupes de 4 bits = 1 hex (méthode Cambridge IGCSE)
- ✅ ASCII : seulement printables (32-126), contrôle en deck séparé avancé
- ✅ HTTP codes : regroupés par catégorie (2xx, 3xx, 4xx, 5xx)
- ✅ Git : 12 commandes essentielles pour débutants (init, clone, add, commit, push, pull, branch, checkout, merge, status, log, diff)
- ✅ Linux : commandes fichiers d'abord (ls, cd, pwd, mkdir, cp, mv, rm, cat)

#### Todo List Informatique

```
GÉNÉRATEUR: binary.js
├── [ ] Décimal → Binaire (0-15) - 16 cartes - PRIORITÉ
│   ├── Format: "13 en binaire = ?" → "1101"
│   └── SVG: représentation bits colorés
├── [ ] Binaire → Décimal (0-15) - 16 cartes
├── [ ] Décimal → Binaire (16-255 par pas de 16) - 16 cartes
└── [ ] Puissances de 2 positions (2⁰=1, 2¹=2, 2²=4...)
    Source: Cambridge IGCSE 8-bit standard

GÉNÉRATEUR: hex.js
├── [ ] Hex → Décimal (0-F) - 16 cartes
│   ├── A=10, B=11, C=12, D=13, E=14, F=15
│   └── Niveau: `seconde`
├── [ ] Décimal → Hex (0-255) - sélection de 50
├── [ ] Binaire → Hex (conversion 4 bits) - 16 cartes
│   └── Feedback: "0000=0, 0001=1, ..., 1111=F"
└── [ ] Couleurs web: #RGB → nom (ex: #FF0000 = red)

GÉNÉRATEUR: ascii.js
├── [ ] ASCII printables essentiels (espace, A-Z, a-z, 0-9)
│   ├── Format: "Code ASCII de 'A' ?" → "65"
│   └── Bidirectionnel: "Caractère ASCII 65 ?" → "A"
├── [ ] Caractères spéciaux courants (~, @, #, $, %, etc.)
└── [ ] Deck avancé: codes contrôle (optionnel)
    ├── NUL=0, TAB=9, LF=10, CR=13, ESC=27
    └── ⚠️ Point d'attention: peu utile pédagogiquement

GÉNÉRATEUR: http-codes.js
├── [ ] 2xx Success (200, 201, 204) - 5 cartes
│   └── Format: "HTTP 200 = ?" → "OK"
├── [ ] 3xx Redirect (301, 302, 304) - 5 cartes
├── [ ] 4xx Client Error (400, 401, 403, 404, 405, 429) - 10 cartes
├── [ ] 5xx Server Error (500, 502, 503, 504) - 5 cartes
└── [ ] Feedback: cas d'usage concret
    Source: MDN Web Docs (officiel)

GÉNÉRATEUR: complexity.js
├── [ ] Notation Big O de base
│   ├── O(1), O(log n), O(n), O(n log n), O(n²), O(2ⁿ), O(n!)
│   └── SVG: courbes de croissance comparatives
├── [ ] Complexité algorithmes courants
│   ├── Binary search → O(log n)
│   ├── Bubble sort → O(n²)
│   ├── Quick sort → O(n log n) avg
│   ├── Hash table lookup → O(1) avg
│   └── Etc.
└── [ ] Niveau: `seconde`

GÉNÉRATEUR: logic-gates.js
├── [ ] Tables de vérité AND, OR, NOT, XOR, NAND, NOR
│   ├── Format: "1 AND 0 = ?" → "0"
│   ├── SVG: symbole de la porte
│   └── Toutes combinaisons (4 par porte à 2 entrées)
└── [ ] Lois booléennes
    ├── De Morgan: ¬(A∧B) = ¬A∨¬B
    ├── Distributivité, associativité, etc.
    └── Niveau: `premiere` (spé NSI)

GÉNÉRATEUR: git-commands.js (NOUVEAU)
├── [ ] 12 commandes essentielles débutant
│   ├── git init, clone, add, commit, push, pull
│   ├── git branch, checkout, merge, status, log, diff
│   ├── Format: "Commande pour voir l'historique ?" → "git log"
│   └── Bidirectionnel: "git add fait quoi ?" → "Stage les changements"
├── [ ] Options courantes (git commit -m, git push -u origin)
└── [ ] Pas de feedback trivial
    Source: [GitHub Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

GÉNÉRATEUR: linux-commands.js (NOUVEAU)
├── [ ] Commandes fichiers (ls, cd, pwd, mkdir, cp, mv, rm, cat, head, tail)
├── [ ] Commandes système (ps, kill, top, df, du, chmod, chown)
├── [ ] Commandes réseau (ping, curl, wget, ssh, scp)
├── [ ] Format: "Afficher le contenu d'un fichier ?" → "cat"
└── [ ] Niveau: `seconde` (NSI, BTS)
    Source: [Ubuntu Tutorial](https://ubuntu.com/tutorials/command-line-for-beginners)

GÉNÉRATEUR: vscode-shortcuts.js (NOUVEAU)
├── [ ] 20 raccourcis essentiels
│   ├── Ctrl+P (fichiers), Ctrl+Shift+P (commandes)
│   ├── Ctrl+/ (commenter), Ctrl+D (sélection multiple)
│   ├── F12 (Go to definition), Ctrl+` (terminal)
│   └── Format: "Ouvrir la palette de commandes ?" → "Ctrl+Shift+P"
├── [ ] Variantes Mac (Cmd au lieu de Ctrl)
└── [ ] Optionnel: autres IDE (IntelliJ, Vim)
    Source: [DEV Community](https://dev.to/devland/100-crucial-keyboard-shortcuts-for-vs-code-users-4474)

GÉNÉRATEUR: regex.js
├── [ ] Métacaractères de base (., *, +, ?, ^, $, [], {})
├── [ ] Classes de caractères (\d, \w, \s, \b)
├── [ ] Patterns courants (email, téléphone, URL)
└── [ ] Niveau: avancé (Sup)
```

**Cartes totales Info** : ~500+ cartes

---

### 4.3 ⚛️ SCIENCES PHYSIQUES - Todo List

#### Recherches effectuées

**Sources consultées** :
- [American Chemical Society - Periodic Table](https://www.acs.org/education/whatischemistry/periodictable/educational-resources-for-ages-12-14.html) - Ressources pédagogiques par âge
- [NIST - SI Units](https://www.nist.gov/pml/owm/metric-si/si-units) - Définitions officielles SI
- [BIPM - International System of Units](https://www.bipm.org/en/measurement-units) - 7 unités de base + préfixes
- [Physics Info - Equations](https://physics.info/equations/) - Formules physique secondaire
- [Vedantu - SI Units List](https://www.vedantu.com/physics/si-units-list) - Liste pédagogique

**Décisions pédagogiques** :
- ✅ Tableau périodique : 1-20 d'abord (ACS middle school), puis reste
- ✅ Focus sur éléments courants (H, C, N, O, Na, Cl, Fe...) avant rares
- ✅ SI : 7 unités de base + 24 préfixes officiels BIPM
- ✅ Constantes : seulement valeurs utilisées au lycée (c, g, NA, etc.)
- ✅ SVG : modèles atomiques simplifiés (noyau + couches électroniques)
- ✅ Feedback utile : "Au (Or) vient du latin 'Aurum'"

#### Todo List Sciences

```
GÉNÉRATEUR: periodic-table.js
├── [ ] Éléments 1-20 (H→Ca) - PRIORITÉ - 40 cartes
│   ├── Symbole → Nom: "Na = ?" → "Sodium"
│   ├── Nom → Symbole: "Fer = ?" → "Fe"
│   ├── SVG: modèle atomique simplifié (couches)
│   └── Feedback: étymologie + usage courant
│       Ex: "Na (Sodium) - du latin 'natrium', sel de cuisine NaCl"
├── [ ] Éléments 21-40 (Sc→Zr) - 40 cartes
├── [ ] Éléments 41-60 (Nb→Nd) - 40 cartes
├── [ ] Éléments 61-118 (reste) - deck avancé
├── [ ] Métaux courants (Fe, Cu, Au, Ag, Al, Zn...) - 20 cartes
│   └── Focus pratique: "métal rouge conducteur ?" → "Cuivre (Cu)"
├── [ ] Non-métaux importants (C, N, O, S, P, Cl...) - 15 cartes
├── [ ] Gaz nobles (He, Ne, Ar, Kr, Xe, Rn) - 6 cartes
└── [ ] Numéros atomiques (Z) - 30 cartes
    └── "Z = 6 ?" → "Carbone (C)"

DONNÉES: elements.json
Source: [IUPAC Periodic Table](https://iupac.org/what-we-do/periodic-table-of-elements/)
├── 118 éléments avec: symbol, name, atomicNumber, atomicMass
├── category (metal, nonmetal, metalloid, noble gas...)
├── electronConfiguration (simplifié)
└── Licence: données scientifiques (domaine public)

GÉNÉRATEUR: si-units.js
├── [ ] 7 unités SI de base - 7 cartes
│   ├── mètre (longueur), kilogramme (masse), seconde (temps)
│   ├── ampère (courant), kelvin (température)
│   ├── mole (quantité de matière), candela (intensité lumineuse)
│   └── Format: "Unité SI de masse ?" → "kilogramme (kg)"
├── [ ] 22 unités dérivées avec noms spéciaux
│   ├── hertz (Hz), newton (N), pascal (Pa), joule (J), watt (W)
│   ├── coulomb (C), volt (V), ohm (Ω), farad (F), etc.
│   └── Format: "Unité de force ?" → "newton (N)"
└── [ ] Relations: "1 N = ?" → "1 kg·m/s²"
    Source: [BIPM SI Units](https://www.bipm.org/en/measurement-units)

GÉNÉRATEUR: si-prefixes.js
├── [ ] 24 préfixes officiels BIPM - 24 cartes
│   ├── quecto (10⁻³⁰) → quetta (10³⁰) [ajoutés 2022]
│   ├── yocto, zepto, atto, femto, pico, nano, micro, milli
│   ├── centi, déci, (unité), déca, hecto, kilo
│   ├── méga, giga, téra, péta, exa, zetta, yotta
│   └── Format: "kilo = ?" → "10³ = 1000"
├── [ ] Conversions pratiques
│   └── "1 km = ? m" → "1000 m"
└── [ ] SVG: échelle logarithmique visuelle
    Source: [BIPM SI Prefixes](https://www.bipm.org/en/measurement-units)

GÉNÉRATEUR: constants.js
├── [ ] Constantes physiques fondamentales - 15 cartes
│   ├── c = 3×10⁸ m/s (vitesse lumière)
│   ├── g = 9.81 m/s² (accélération pesanteur)
│   ├── G = 6.67×10⁻¹¹ N·m²/kg² (constante gravitationnelle)
│   ├── NA = 6.02×10²³ mol⁻¹ (Avogadro)
│   ├── h = 6.63×10⁻³⁴ J·s (Planck)
│   ├── k = 1.38×10⁻²³ J/K (Boltzmann)
│   ├── e = 1.60×10⁻¹⁹ C (charge élémentaire)
│   └── R = 8.31 J/(mol·K) (gaz parfaits)
├── [ ] Constantes mathématiques - 5 cartes
│   ├── π ≈ 3.14159, e ≈ 2.71828, φ ≈ 1.61803
│   └── Feedback: définition et usage
└── [ ] Format: "Symbole de la constante d'Avogadro ?" → "NA"
    Source: [CODATA Values](https://physics.nist.gov/cuu/Constants/)

GÉNÉRATEUR: conversions.js
├── [ ] Longueurs - 20 cartes
│   ├── km ↔ m, m ↔ cm, cm ↔ mm
│   ├── miles ↔ km (1 mi ≈ 1.609 km)
│   ├── pouces ↔ cm (1 in = 2.54 cm)
│   └── pieds ↔ m (1 ft = 0.3048 m)
├── [ ] Masses - 15 cartes
│   ├── kg ↔ g, g ↔ mg
│   ├── livre ↔ kg (1 lb ≈ 0.454 kg)
│   └── once ↔ g (1 oz ≈ 28.35 g)
├── [ ] Températures - 10 cartes
│   ├── °C → K : K = °C + 273.15
│   ├── °C → °F : °F = °C × 9/5 + 32
│   └── Points remarquables: 0°C=32°F=273K, 100°C=212°F=373K
└── [ ] Volumes, surfaces (optionnel)

GÉNÉRATEUR: formulas-physics.js (NOUVEAU)
├── [ ] Mécanique - 15 cartes
│   ├── v = d/t, a = Δv/Δt, F = ma
│   ├── E_c = ½mv², E_p = mgh, W = F·d
│   └── Format: "Formule énergie cinétique ?" → "E_c = ½mv²"
├── [ ] Électricité - 10 cartes
│   ├── U = R×I (Ohm), P = U×I
│   ├── Associations résistances série/parallèle
│   └── SVG: schéma circuit simple
├── [ ] Optique - 5 cartes
│   ├── n₁ sin θ₁ = n₂ sin θ₂ (Snell-Descartes)
│   └── 1/f = 1/p + 1/p'
└── [ ] Niveau: `troisieme`
    Source: [Physics Hypertextbook](https://physics.info/equations/)

GÉNÉRATEUR: resistor-colors.js (NOUVEAU)
├── [ ] Code couleurs résistances - 30 cartes
│   ├── Noir=0, Marron=1, Rouge=2, Orange=3, Jaune=4
│   ├── Vert=5, Bleu=6, Violet=7, Gris=8, Blanc=9
│   ├── Multiplicateurs: Or=×0.1, Argent=×0.01
│   └── Tolérances: Or=5%, Argent=10%, Sans=20%
├── [ ] SVG: résistance avec bandes colorées
└── [ ] Mnémotechnique: "Ne Mangez Rien Ou Jeûnez, Voilà Bien Votre Grande Bêtise"
```

**Cartes totales Sciences** : ~500+ cartes

---

### 4.4 🌍 GÉOGRAPHIE - Todo List

#### Recherches effectuées

**Sources consultées** :
- [mledoze/countries (GitHub)](https://github.com/mledoze/countries) - 250 pays/territoires en JSON avec coordonnées
- [data.gouv.fr - Départements](https://www.data.gouv.fr/datasets/departements-et-leurs-regions/) - JSON officiel France
- [france-geojson](https://france-geojson.gregoiredavid.fr/) - GeoJSON départements/régions (IGN)
- [samayo/country-json](https://github.com/samayo/country-json) - Capitales, drapeaux, monnaies

**Décisions pédagogiques** :
- ✅ 193 pays membres ONU (source officielle)
- ✅ Decks par continent pour sessions gérables
- ✅ Drapeaux en SVG inline (pas d'images externes)
- ✅ France : 101 départements + 13 régions
- ✅ Bidirectionnel : Pays→Capitale ET Capitale→Pays
- ✅ SVG : silhouettes pays simplifiées + drapeaux

#### Todo List Géographie

```
DONNÉES: countries.json
Source: [mledoze/countries](https://github.com/mledoze/countries)
├── 250 entrées (193 ONU + territoires)
├── Champs: name, capital, region, subregion, flag (emoji)
├── Codes ISO: cca2 (FR), cca3 (FRA), ccn3 (250)
├── Coordonnées: latlng pour cartographie
└── Licence: Open Database License (ODbL)
⚠️ ATTENTION: Vérifier capitales contestées (ex: Israël/Jérusalem)

DONNÉES: fr-departments.json
Source: [data.gouv.fr](https://www.data.gouv.fr/datasets/departements-et-leurs-regions/)
├── 101 départements (96 métro + 5 DROM)
├── Champs: code, nom, region, chef_lieu
└── Licence: Licence Ouverte Etalab

GÉNÉRATEUR: capitals.js
├── [ ] Europe (44 pays) - 88 cartes
│   ├── Pays → Capitale: "France ?" → "Paris"
│   ├── Capitale → Pays: "Berlin ?" → "Allemagne"
│   ├── Niveau: `cm2`
│   └── SVG: silhouette Europe avec pays coloré
├── [ ] Asie (48 pays) - 96 cartes
│   └── Niveau: `sixieme`
├── [ ] Afrique (54 pays) - 108 cartes
│   └── Niveau: `sixieme`
├── [ ] Amériques (35 pays) - 70 cartes
│   ├── Amérique du Nord (3), Centrale (7), Caraïbes (13), Sud (12)
│   └── Niveau: `sixieme`
├── [ ] Océanie (14 pays) - 28 cartes
│   └── Niveau: `sixieme`
└── [ ] Monde complet mélangé (193 cartes × 2)
    └── Mode révision consolidation

GÉNÉRATEUR: flags.js
├── [ ] Drapeaux Europe - 44 cartes
│   ├── Format: SVG drapeau → "Quel pays ?"
│   ├── SVG inline (pas d'URL externe!)
│   └── Source: [country-flags](https://github.com/hampusborgos/country-flags)
├── [ ] Drapeaux Asie - 48 cartes
├── [ ] Drapeaux Afrique - 54 cartes
├── [ ] Drapeaux Amériques - 35 cartes
└── [ ] Drapeaux Océanie - 14 cartes
⚠️ ATTENTION: Optimiser SVG (< 5KB par drapeau)
Alternative: utiliser emojis 🇫🇷 si SVG trop lourd

GÉNÉRATEUR: continents.js
├── [ ] Pays → Continent (193 cartes)
│   ├── "Le Japon est sur quel continent ?" → "Asie"
│   └── 7 réponses possibles: Afrique, Amérique du Nord, Amérique du Sud, Antarctique, Asie, Europe, Océanie
└── [ ] Niveau: `cm1`

GÉNÉRATEUR: fr-departments.js
├── [ ] Départements par numéro - 101 cartes
│   ├── "Département 75 ?" → "Paris"
│   ├── "Département Gironde ?" → "33"
│   └── SVG: carte France avec département coloré
├── [ ] Préfectures - 101 cartes
│   ├── "Préfecture du Rhône ?" → "Lyon"
│   └── "Lyon est préfecture de ?" → "Rhône (69)"
├── [ ] Régions - 13 cartes
│   └── "Région de Lyon ?" → "Auvergne-Rhône-Alpes"
└── [ ] DOM-TOM - 6 cartes
    └── Guadeloupe (971), Martinique (972), Guyane (973), Réunion (974), Mayotte (976)

GÉNÉRATEUR: us-states.js
├── [ ] 50 États → Capitales - 100 cartes
│   ├── ⚠️ Pièges courants: New York→Albany (pas NYC), Californie→Sacramento (pas LA)
│   └── Niveau: collège+ (optionnel)
└── [ ] Abréviations (CA, NY, TX...) - 50 cartes
```

**Cartes totales Géo** : ~700+ cartes

---

### 4.5 🗣️ LANGUES - Todo List

#### Recherches effectuées

**Sources consultées** :
- [British Council - A1-A2 Vocabulary](https://learnenglish.britishcouncil.org/vocabulary/a1-a2-vocabulary) - Vocabulaire CECRL
- [Oxford 3000/5000](https://www.oxfordlearnersdictionaries.com/about/wordlists/cefr) - Listes officielles par niveau
- [ESL-Lounge - CEFR Word Lists](https://www.esl-lounge.com/student/reference/a1-cefr-vocabulary-word-list.php) - A1 à B2 gratuit
- [LanGeek](https://langeek.co/en/vocab/level-based) - Vocabulaire par niveau avec exercices

**Décisions pédagogiques** :
- ✅ Conjugaison FR : présent d'abord, puis passé composé, imparfait, futur
- ✅ Verbes irréguliers EN : 50 les plus fréquents d'abord
- ✅ Vocabulaire par fréquence (pas alphabétique)
- ✅ Alphabets non-latins : avec audio TTS si possible, sinon romanisation
- ✅ Pas de feedback pour conjugaisons triviales
- ✅ SVG pour alphabets (tracé du caractère avec ordre des traits)

#### Todo List Langues

```
DONNÉES: verbs-fr.json
Source: Bescherelle / Lexique.org
├── 300+ verbes avec toutes conjugaisons
├── Groupes: 1er (-er), 2ème (-ir), 3ème (irréguliers)
├── Temps: présent, passé composé, imparfait, futur, conditionnel, subjonctif
└── Licence: à vérifier (données linguistiques)

DONNÉES: verbs-en-irregular.json
Source: [Oxford Learner's Dictionary](https://www.oxfordlearnersdictionaries.com/)
├── ~200 verbes V1/V2/V3
├── Avec prononciation IPA
└── Fréquence d'usage

GÉNÉRATEUR: conj-fr-present.js
├── [ ] 1er groupe (-er) - 50 verbes × 6 personnes = 300 cartes
│   ├── Format: "parler, je ?" → "parle"
│   ├── Verbes: parler, manger, jouer, regarder, écouter, chercher...
│   └── Niveau: `ce2`
├── [ ] 2ème groupe (-ir) - 30 verbes × 6 = 180 cartes
│   ├── finir, choisir, réussir, grandir, rougir...
│   └── Niveau: `cm1`
├── [ ] 3ème groupe (irréguliers) - 50 verbes × 6 = 300 cartes
│   ├── être, avoir, aller, faire, dire, voir, venir, prendre...
│   ├── ⚠️ Feedback utile pour irrégularités
│   └── Niveau: `cm1`
└── [ ] Auxiliaires être/avoir seuls - 12 cartes
    └── Priorité maximale (prérequis passé composé)

GÉNÉRATEUR: conj-fr-passe-compose.js
├── [ ] Avec auxiliaire avoir - 200 cartes
│   ├── "manger, j'..." → "ai mangé"
│   └── Accord: jamais avec avoir (sauf COD antéposé)
├── [ ] Avec auxiliaire être (Dr Mrs Vandertramp) - 100 cartes
│   ├── Verbes: devenir, revenir, monter, rester, sortir...
│   ├── Accord sujet: "elle est partie"
│   └── Feedback: règle Dr Mrs Vandertramp
└── [ ] Pronominaux - 50 cartes
    └── "se laver, je..." → "me suis lavé(e)"

GÉNÉRATEUR: conj-fr-autres-temps.js
├── [ ] Imparfait (régulier, radical présent nous) - 300 cartes
├── [ ] Futur simple (infinitif + ai/as/a/ons/ez/ont) - 300 cartes
├── [ ] Conditionnel présent (infinitif + imparfait) - 200 cartes
└── [ ] Subjonctif présent (que je/tu/il...) - 200 cartes (avancé)

GÉNÉRATEUR: irregular-en.js
├── [ ] Top 50 verbes les plus courants - PRIORITÉ - 150 cartes
│   ├── Format: "go (past) ?" → "went"
│   ├── Format: "go (past participle) ?" → "gone"
│   ├── be/was-were/been, have/had/had, do/did/done
│   ├── go/went/gone, say/said/said, make/made/made
│   ├── get/got/gotten, see/saw/seen, know/knew/known...
│   └── Niveau: `sixieme`
├── [ ] Verbes A-G - 70 cartes
├── [ ] Verbes H-P - 70 cartes
├── [ ] Verbes R-Z - 60 cartes
└── [ ] Tous mélangés (révision) - 200 cartes
    Source: Oxford list of irregular verbs

GÉNÉRATEUR: freq-vocabulary.js
├── [ ] Top 500 mots FR (Lexique.org) - 500 cartes
│   ├── Format: définition → mot OU mot → définition
│   └── Niveau: `sixieme` (CECRL A1-A2)
├── [ ] Top 500 mots EN (Oxford 3000) - 500 cartes
│   ├── Format: FR → EN et EN → FR
│   └── Niveau: `sixieme` (CECRL A1-A2)
├── [ ] Vocabulaire thématique
│   ├── Couleurs, nombres, jours, mois, famille, corps, maison, nourriture...
│   └── 20-30 cartes par thème
└── [ ] Faux amis FR-EN - 50 cartes
    └── actually ≠ actuellement, library ≠ librairie...

GÉNÉRATEUR: hiragana.js
├── [ ] 46 hiragana de base - 92 cartes (bidirectionnel)
│   ├── あ → "a", い → "i", う → "u", え → "e", お → "o"
│   ├── か → "ka", き → "ki", く → "ku"...
│   ├── SVG: tracé du caractère avec ordre des traits
│   └── Audio: prononciation (TTS ou enregistrement)
├── [ ] Hiragana combinés (きゃ, しゅ...) - 36 cartes
└── [ ] Niveau: débutant japonais

GÉNÉRATEUR: katakana.js
├── [ ] 46 katakana de base - 92 cartes
│   ├── ア → "a", イ → "i"...
│   └── Même structure que hiragana
├── [ ] Katakana combinés - 36 cartes
└── [ ] Mots d'emprunt courants - 50 cartes
    └── コンピュータ → "computer", テレビ → "TV"...

GÉNÉRATEUR: cyrillic.js
├── [ ] Alphabet cyrillique russe - 33 lettres × 2 = 66 cartes
│   ├── А→"a", Б→"b", В→"v", Г→"g"...
│   ├── Faux amis: Р→"r" (pas P!), Н→"n", В→"v"
│   └── SVG: majuscule + minuscule
└── [ ] Niveau: débutant russe

GÉNÉRATEUR: arabic-letters.js
├── [ ] Alphabet arabe - 28 lettres × 4 formes = 112 cartes
│   ├── 4 formes: isolée, initiale, médiane, finale
│   ├── ا (alif), ب (ba), ت (ta), ث (tha)...
│   ├── SVG: formes contextuelles
│   └── Direction: droite → gauche
├── [ ] Voyelles courtes (harakat) - 6 cartes
└── [ ] Niveau: débutant arabe

GÉNÉRATEUR: hangul.js
├── [ ] Voyelles coréennes - 21 cartes
│   ├── ㅏ→"a", ㅓ→"eo", ㅗ→"o"...
│   └── SVG: construction visuelle
├── [ ] Consonnes coréennes - 19 cartes
│   ├── ㄱ→"g/k", ㄴ→"n", ㄷ→"d/t"...
│   └── Position dans la syllabe
├── [ ] Syllabes de base - 100 cartes
│   └── 가 (ga), 나 (na), 다 (da)...
└── [ ] Niveau: débutant coréen

GÉNÉRATEUR: greek-letters.js
├── [ ] Alphabet grec - 24 lettres × 2 = 48 cartes
│   ├── Α/α→"Alpha", Β/β→"Beta", Γ/γ→"Gamma"...
│   ├── Usage: math (π, Σ, Δ), sciences (α, β, γ rayons)
│   └── Prononciation moderne vs ancienne
└── [ ] Niveau: `troisieme` (maths/sciences)
```

**Cartes totales Langues** : ~4000+ cartes

---

### 4.6 🎵 MUSIQUE - Todo List

#### Recherches effectuées

**Sources consultées** :
- [VexFlow](https://www.vexflow.com/) - Bibliothèque JavaScript SVG pour notation musicale (MIT)
- [abcjs](https://github.com/paulrosen/abcjs) - Rendu ABC notation vers SVG
- [Musical-U - Interval Ear Training](https://www.musical-u.com/learn/ultimate-guide-to-interval-ear-training/) - Pédagogie intervalles
- [Music Theory Practice](https://music-theory-practice.com/) - Flashcards interactives
- [Musicards](http://musicards.net/) - Flashcards théorie musicale
- [apprendrelesolfege.com](https://www.apprendrelesolfege.com/les-gammes-majeures) - Solfège en français

**Décisions pédagogiques** :
- ✅ Notation française (Do-Ré-Mi) ET internationale (C-D-E)
- ✅ VexFlow pour SVG portées (licence MIT, compatible inline)
- ✅ Ordre intervalles : unisson, octave, puis 5te, 4te, 3ces, 2des, 7èmes, 6tes
- ✅ Méthode "song references" pour intervalles (chansons connues)
- ✅ Clé de sol d'abord, clé de fa ensuite
- ✅ Pas de feedback trivial ("Do grave car c'est Do")

#### Todo List Musique

```
SVG: Intégration VexFlow
├── [ ] Évaluer VexFlow pour génération SVG au build
│   ├── Alternative: templates SVG statiques
│   └── Contrainte: SVG < 10KB par carte
├── [ ] Créer helper renderStaff(notes, clef)
│   ├── Paramètres: notes[], clef ('treble'|'bass'), time
│   └── Retourne: SVG string inline
└── Source: [VexFlow GitHub](https://github.com/vexflow/vexflow)
⚠️ Si VexFlow trop lourd, utiliser SVG templates simples

GÉNÉRATEUR: notes-reading.js
├── [ ] Notes clé de sol (lignes + interlignes) - 20 cartes
│   ├── SVG: portée avec une note
│   ├── Format: [portée SVG] "?" → "Sol" ou "G4"
│   ├── Mi-Sol-Si-Ré-Fa (lignes), Fa-La-Do-Mi (interlignes)
│   └── Option: notation FR (Do) ou EN (C)
├── [ ] Notes clé de fa - 20 cartes
│   ├── Sol-Si-Ré-Fa-La (lignes), La-Do-Mi-Sol (interlignes)
│   └── Niveau: intermédiaire
├── [ ] Altérations (# et ♭) - 14 cartes
│   └── Ex: "Sol# en clé de sol" [SVG avec dièse]
├── [ ] Bidirectionnel: "Où se trouve le La en clé de sol ?" → [SVG]
└── [ ] Niveau: débutant solfège

GÉNÉRATEUR: intervals.js
├── [ ] 12 intervalles (demi-tons 0-12) - 24 cartes
│   ├── Unisson (0), seconde mineure (1), seconde majeure (2)
│   ├── Tierce mineure (3), tierce majeure (4), quarte juste (5)
│   ├── Triton (6), quinte juste (7), sixte mineure (8)
│   ├── Sixte majeure (9), septième mineure (10), septième majeure (11)
│   ├── Octave (12)
│   └── Format: "7 demi-tons = ?" → "Quinte juste"
├── [ ] Références chansons connues - 24 cartes
│   ├── Quinte: Star Wars, Also Sprach Zarathustra
│   ├── Quarte: Here Comes the Bride
│   ├── Tierce majeure: Kumbaya, Oh When the Saints
│   ├── Tierce mineure: Greensleeves
│   ├── Seconde majeure: Frère Jacques, Happy Birthday
│   └── Octave: Somewhere Over the Rainbow
├── [ ] SVG: clavier piano avec touches colorées
└── [ ] Niveau: `autodidacte`

GÉNÉRATEUR: scales.js
├── [ ] 12 gammes majeures - 24 cartes
│   ├── Do majeur: Do-Ré-Mi-Fa-Sol-La-Si-Do (0 altération)
│   ├── Sol majeur: Sol-La-Si-Do-Ré-Mi-Fa#-Sol (1#)
│   ├── Fa majeur: Fa-Sol-La-Sib-Do-Ré-Mi-Fa (1♭)
│   ├── ... jusqu'à 6# et 6♭
│   └── Format: "Gamme de Ré majeur ?" → "Ré-Mi-Fa#-Sol-La-Si-Do#-Ré"
├── [ ] Structure intervalles majeur
│   └── Ton-Ton-½ton-Ton-Ton-Ton-½ton
├── [ ] 12 gammes mineures naturelles - 24 cartes
│   └── Structure: Ton-½ton-Ton-Ton-½ton-Ton-Ton
├── [ ] Relatives majeures/mineures - 12 cartes
│   └── "Relative mineure de Do majeur ?" → "La mineur"
└── [ ] SVG: cercle des quintes

GÉNÉRATEUR: key-signatures.js
├── [ ] Armures à la clé - 15 cartes
│   ├── 0 altération → Do majeur / La mineur
│   ├── 1# → Sol majeur / Mi mineur
│   ├── 2# → Ré majeur / Si mineur
│   ├── ... jusqu'à 7#/7♭
│   ├── Format: [SVG armure 2#] "?" → "Ré majeur"
│   └── Mnémotechnique: "Fa-Do-Sol-Ré-La-Mi-Si" (ordre des #)
└── [ ] Bidirectionnel: "Armure de Mi majeur ?" → [SVG 4#]

GÉNÉRATEUR: chords.js
├── [ ] Accords majeurs (12 tonalités) - 12 cartes
│   ├── Do majeur = Do-Mi-Sol (tierce majeure + tierce mineure)
│   └── SVG: clavier avec touches colorées
├── [ ] Accords mineurs (12 tonalités) - 12 cartes
│   └── Do mineur = Do-Mi♭-Sol (tierce mineure + tierce majeure)
├── [ ] Accords 7ème - 12 cartes (avancé)
├── [ ] Chiffrages (I, IV, V, vi...) - 7 cartes
│   └── "V en Do majeur ?" → "Sol majeur"
└── [ ] Niveau: intermédiaire

GÉNÉRATEUR: music-terms.js
├── [ ] Termes de tempo italiens - 25 cartes
│   ├── Largo (très lent), Adagio (lent), Andante (modéré)
│   ├── Moderato (modéré), Allegro (rapide), Vivace (vif)
│   ├── Presto (très rapide), Prestissimo (le plus rapide)
│   └── Format: "Allegro ?" → "Rapide (~120-168 BPM)"
├── [ ] Nuances - 15 cartes
│   ├── ppp, pp, p, mp, mf, f, ff, fff
│   ├── crescendo, decrescendo, sforzando
│   └── Format: "ff ?" → "Fortissimo (très fort)"
├── [ ] Articulations - 10 cartes
│   └── Staccato, legato, accent, tenuto...
└── [ ] Niveau: `autodidacte`
```

**Cartes totales Musique** : ~250+ cartes

---

### 4.7 📋 Résumé Global des Todo Lists

| Domaine | Générateurs | Cartes estimées | Priorité |
|---------|-------------|-----------------|----------|
| Mathématiques | 10 | ~700 | ⭐⭐⭐ |
| Informatique | 10 | ~500 | ⭐⭐ |
| Sciences Physiques | 8 | ~500 | ⭐⭐ |
| Géographie | 5 | ~700 | ⭐⭐⭐ |
| Langues | 12 | ~4000 | ⭐⭐⭐ |
| Musique | 6 | ~250 | ⭐⭐ |
| **TOTAL** | **51** | **~6650** | |

### 4.8 Sources de Données à Télécharger

| Fichier | Source | Licence | Taille | URL |
|---------|--------|---------|--------|-----|
| `countries.json` | mledoze/countries | ODbL | ~2MB | [GitHub](https://github.com/mledoze/countries) |
| `fr-departments.json` | data.gouv.fr | Etalab | ~50KB | [data.gouv.fr](https://www.data.gouv.fr/datasets/departements-et-leurs-regions/) |
| `elements.json` | IUPAC | Domaine public | ~100KB | À créer manuellement |
| `verbs-fr.json` | Lexique.org | CC BY-SA | ~500KB | [Lexique.org](http://www.lexique.org/) |
| `verbs-en-irregular.json` | Oxford | Usage éducatif | ~50KB | À créer manuellement |
| `si-prefixes.json` | BIPM | Domaine public | ~5KB | [BIPM](https://www.bipm.org/en/measurement-units) |
| `country-flags/` | hampusborgos | MIT | ~5MB | [GitHub](https://github.com/hampusborgos/country-flags) |

**⚠️ Points d'attention** :
1. **Drapeaux** : Optimiser SVG (< 5KB/drapeau) ou utiliser emojis 🇫🇷
2. **Capitales** : Vérifier cas contestés (Jérusalem, Taipei, etc.)
3. **Conjugaison FR** : Données Bescherelle protégées, utiliser Lexique.org (CC)
4. **VexFlow** : Évaluer si taille acceptable pour inline

### 4.9 Ordre d'Implémentation Recommandé

**Phase 1 - Infrastructure (2-3 jours)**
- [ ] `scripts/generators/base-generator.cjs`
- [ ] `scripts/generators/index.cjs` (CLI + registre)
- [ ] Modification `scripts/build.js` pour intégration
- [ ] Tests infrastructure

**Phase 2 - Données sources (2-3 jours)**
- [ ] Télécharger et nettoyer `countries.json`
- [ ] Créer `elements.json` (manuel, ~2h)
- [ ] Télécharger `fr-departments.json`
- [ ] Créer `verbs-en-irregular.json` (top 200)

**Phase 3 - Générateurs prioritaires (5-7 jours)**
1. [ ] `multiplication.js` - Tables 1-12
2. [ ] `capitals.js` - Pays/Capitales par continent
3. [ ] `periodic-table.js` - Éléments 1-118
4. [ ] `irregular-en.js` - Verbes irréguliers anglais
5. [ ] `binary.js` - Conversions binaire/décimal

**Phase 4 - Générateurs secondaires (7-10 jours)**
- [ ] `addition.js`, `subtraction.js`, `division.js`, `powers.js`
- [ ] `fr-departments.js`, `flags.js`
- [ ] `ascii.js`, `http-codes.js`, `git-commands.js`, `linux-commands.js`
- [ ] `si-units.js`, `si-prefixes.js`, `conversions.js`

**Phase 5 - Générateurs langues (7-10 jours)**
- [ ] `conj-fr-present.js`, `conj-fr-passe-compose.js`
- [ ] `hiragana.js`, `katakana.js`
- [ ] `cyrillic.js`, `arabic-letters.js`, `hangul.js`
- [ ] `freq-vocabulary.js`

**Phase 6 - Générateurs musique + SVG (5-7 jours)**
- [ ] Évaluation VexFlow ou templates SVG
- [ ] `notes-reading.js`, `intervals.js`
- [ ] `scales.js`, `key-signatures.js`
- [ ] `music-terms.js`

**Phase 7 - Polish et tests (3-5 jours)**
- [ ] Tests exhaustifs de tous les générateurs
- [ ] Validation YAML généré
- [ ] Optimisation taille (compression SVG)
- [ ] Documentation finale

---

## 5. Outils de Visualisation Interactifs (Page Outils)

> **Objectif** : Proposer des outils de visualisation interactifs pour apprendre par l'exploration, inspirés de [PhET](https://phet.colorado.edu/), [GeoGebra](https://www.geogebra.org/), et [Desmos](https://www.desmos.com/).

### 5.1 Outils retirés (état au 2026-11-22)

> Ces outils ont été implémentés puis **retirés de l'application** par le commit `1c85f61` (« refactor: remove all visualization tools from application », 2025-12-19). `src/ui/components/` ne contient plus que `card.js`, `deck-card.js`, `deck-table.js` et `tag-selector.js`. Le tableau ci-dessous est conservé comme historique ; les sections 5.2 à 5.9 décrivent des idées non démarrées.

| Outil | Composant (supprimé) | Description |
|-------|-----------|-------------|
| 🎵 Wave Visualizer | `wave-visualizer.js` | Visualisation des ondes sonores, fréquences |
| 🎹 Staff Visualizer | `staff-visualizer.js` | Portée musicale interactive, lecture de notes |
| 🎼 Harmonics Visualizer | `harmonics-visualizer.js` | Série harmonique, timbres |
| 🥁 Rhythm Machine | `rhythm-machine.js` | Boîte à rythmes, signatures temporelles |
| 🗺️ Knowledge Map | `knowledge-map.js` | Cartographie des connaissances |
| 🔮 Multiplication Circle | `multiplication-circle.js` | Cercle de multiplication modulaire (cardioïde, néphroïde) |

### 5.2 📐 MATHÉMATIQUES - Outils à créer

| Outil | Priorité | Description | Inspiration |
|-------|----------|-------------|-------------|
| **Cercle trigonométrique** | ⭐⭐⭐ | Visualisation sin/cos/tan sur cercle unité, angles, radians | [PhET Trig Tour](https://phet.colorado.edu/en/simulations/trig-tour), [Math is Fun](https://www.mathsisfun.com/algebra/trig-interactive-unit-circle.html) |
| **Grapheur de fonctions** | ⭐⭐⭐ | Tracer f(x), dérivées, intégrales, sliders | [Desmos](https://www.desmos.com/), [GeoGebra](https://www.geogebra.org/) |
| **Visualiseur de vecteurs** | ⭐⭐ | Addition, soustraction, produit scalaire/vectoriel | [Physics Classroom](https://www.physicsclassroom.com/interactive) |
| **Nombres complexes** | ⭐⭐ | Plan complexe, forme polaire, rotations | GeoGebra |
| **Transformées de Fourier** | ⭐ | Décomposition en sinusoïdes, spectre | 3Blue1Brown |
| **Fractales** | ⭐ | Mandelbrot, Julia, triangle de Sierpinski | Interactif |
| **Probabilités** | ⭐⭐ | Loi normale, binomiale, simulations Monte Carlo | PhET |
| **Géométrie 2D/3D** | ⭐⭐ | Constructions, transformations, polyèdres | GeoGebra |

### 5.3 ⚛️ PHYSIQUE - Outils à créer

| Outil | Priorité | Description | Inspiration |
|-------|----------|-------------|-------------|
| **Cinématique** | ⭐⭐⭐ | Position, vitesse, accélération, graphiques | [oPhysics](https://ophysics.com/), PhET |
| **Projectile** | ⭐⭐ | Trajectoire parabolique, angle, vélocité initiale | PhET Projectile Motion |
| **Ondes mécaniques** | ⭐⭐ | Interférences, diffraction, onde stationnaire | [PhET Wave Interference](https://phet.colorado.edu/) |
| **Optique géométrique** | ⭐⭐ | Réflexion, réfraction, lentilles, miroirs | PhET Geometric Optics |
| **Circuits électriques** | ⭐⭐⭐ | Loi d'Ohm, résistances, condensateurs | PhET Circuit Construction Kit |
| **Champs électriques** | ⭐ | Lignes de champ, potentiel, charges | PhET Electric Field |
| **Pendule simple** | ⭐⭐ | Oscillations, période, énergie | PhET Pendulum Lab |
| **Ressorts** | ⭐⭐ | Loi de Hooke, oscillations harmoniques | PhET Masses and Springs |

### 5.4 🧪 CHIMIE - Outils à créer

| Outil | Priorité | Description | Inspiration |
|-------|----------|-------------|-------------|
| **Tableau périodique interactif** | ⭐⭐⭐ | Configurations électroniques, orbitales 3D, tendances | [Ptable](https://ptable.com/), [Electron Orbital Simulator](http://electronorbitalsimulator.com/) |
| **Visualiseur de molécules** | ⭐⭐ | Structures 3D, liaisons, angles | MolView, RCSB PDB |
| **Structures de Lewis** | ⭐⭐ | Dessiner des structures, doublets, charges | ChemDraw simplifié |
| **Équilibrage d'équations** | ⭐⭐ | Équilibrer visuellement réactifs/produits | PhET Balancing Chemical Equations |
| **pH et solutions** | ⭐ | Échelle pH, acides/bases, dilutions | PhET pH Scale |
| **Orbitales atomiques** | ⭐ | Visualisation 3D des orbitales s, p, d, f | HyperPhysics |

### 5.5 🧬 BIOLOGIE - Outils à créer

| Outil | Priorité | Description | Inspiration |
|-------|----------|-------------|-------------|
| **Cellule interactive** | ⭐⭐ | Anatomie cellulaire, organites, fonctions | HHMI BioInteractive, Cells Alive! |
| **ADN/ARN** | ⭐⭐ | Structure double hélice, transcription, traduction | DNA Learning Center |
| **Génétique mendélienne** | ⭐⭐ | Carrés de Punnett, hérédité, probabilités | PhET Gene Expression |
| **Mitose/Méiose** | ⭐ | Phases de division cellulaire animées | BioInteractive |
| **Système nerveux** | ⭐ | Potentiel d'action, synapse | PhET Neuron |

### 5.6 🌍 GÉOGRAPHIE/HISTOIRE - Outils à créer

| Outil | Priorité | Description | Inspiration |
|-------|----------|-------------|-------------|
| **Globe interactif** | ⭐⭐ | Pays, capitales, quiz géographique | Google Earth, D3.js |
| **Frise chronologique** | ⭐⭐ | Événements historiques, périodes, zoom | TimelineJS |
| **Cartes thématiques** | ⭐ | Population, PIB, climat par pays | DataWrapper |

### 5.7 🎵 MUSIQUE - Outils à créer (extensions)

| Outil | Priorité | Description | Inspiration |
|-------|----------|-------------|-------------|
| **Piano virtuel** | ⭐⭐ | Clavier interactif, accords, gammes | Tonejs Piano |
| **Dictée musicale** | ⭐⭐ | Reconnaissance d'intervalles, accords | Teoria, EarMaster |
| **Cercle des quintes** | ⭐⭐⭐ | Relations tonales, armures, accords relatifs | Interactif |
| **Métronome avancé** | ⭐ | Subdivisions, accents, tap tempo | Existe déjà dans RhythmMachine |

### 5.8 💻 INFORMATIQUE - Outils à créer

| Outil | Priorité | Description | Inspiration |
|-------|----------|-------------|-------------|
| **Visualiseur de tri** | ⭐⭐⭐ | Algorithmes de tri animés (bubble, quick, merge) | Sorting Algorithms Visualized |
| **Automates finis** | ⭐⭐ | DFA, NFA, regex, acceptation de chaînes | JFLAP |
| **Arbres binaires** | ⭐⭐ | BST, parcours, insertion, suppression | VisuAlgo |
| **Graphes** | ⭐⭐ | BFS, DFS, Dijkstra, plus court chemin | VisuAlgo |
| **Portes logiques** | ⭐⭐ | Circuits logiques, tables de vérité | CircuitVerse |
| **Turing Tumble** | ⭐⭐ | Ordinateur mécanique à billes, portes logiques, bits | [Turing Tumble](https://upperstory.com/en/turingtumble/) |
| **Convertisseur bases** | ⭐ | Binaire, octal, décimal, hexadécimal interactif | Existant mais améliorable |

#### 🌐 Réseaux Informatiques

| Outil | Priorité | Description | Inspiration |
|-------|----------|-------------|-------------|
| **Simulateur réseau** | ⭐⭐⭐ | Construire des LAN/VLAN, switches, routeurs, passerelles | SopiremInfo, PT Anywhere |
| **Modèle OSI interactif** | ⭐⭐ | Visualiser les 7 couches, encapsulation/désencapsulation | - |
| **Calculateur sous-réseaux** | ⭐⭐ | Adressage IP, masques, CIDR, plages d'hôtes | - |

**Concepts réseau à couvrir** :
- **Couche 1-2** : Ethernet, trames, adresses MAC, collisions, hubs, switches
- **Couche 2-3** : VLANs (niveau 1 et 2), spanning tree
- **Couche 3** : IP, masques, sous-réseaux, routage, passerelle, ARP
- **Couche 4** : TCP/UDP, ports, segments
- **Couche 7** : HTTP, FTP, DNS (simulation basique)

**Fonctionnalités simulateur** :
- Mode pas-à-pas pour visualiser le trajet des paquets
- Animation des trames/paquets entre équipements
- Tables ARP, tables de routage éditables
- Ping entre machines
- Configuration VLAN sur switches

#### 🐜 Métaheuristiques et Algorithmes Bio-inspirés

| Outil | Priorité | Description | Inspiration |
|-------|----------|-------------|-------------|
| **Colonie de fourmis** | ⭐⭐ | ACO (Ant Colony Optimization), phéromones, TSP | Visualisation chemin optimal |
| **Physarum / Blob** | ⭐⭐ | Slime mold, réseau optimal, labyrinthe | Simulations de Physarum polycephalum |
| **Algorithme génétique** | ⭐⭐ | Sélection, croisement, mutation, fitness | Évolution de populations |
| **Essaim de particules** | ⭐ | PSO (Particle Swarm), optimisation | Visualisation convergence |
| **Recuit simulé** | ⭐ | Simulated annealing, température, énergie | Minimisation de fonction |
| **Automates cellulaires** | ⭐⭐ | Game of Life, règle 110, Langton's ant | Émergence et complexité |
| **Boids / Flocking** | ⭐ | Comportement de groupe, séparation, alignement, cohésion | Simulation de nuées |

### 5.9 ⚠️ Considérations Pédagogiques - Contrôle du Temps

> **Réflexion importante** : Les outils de visualisation sont fascinants et peuvent captiver l'attention, particulièrement chez les enfants. Il est crucial de ne pas les transformer en source de distraction par rapport à l'objectif principal (révision des cartes).

#### Mécanismes envisagés (à implémenter ultérieurement)

| Fonctionnalité | Description | Priorité |
|----------------|-------------|----------|
| **Minuteur d'utilisation** | Timer visible indiquant le temps passé sur les outils | ⭐⭐ |
| **Limite quotidienne** | Temps maximum autorisé par jour sur les outils (configurable) | ⭐⭐ |
| **Déblocage par révision** | Accès aux outils conditionné à X cartes révisées | ⭐⭐⭐ |
| **Mode parent** | Mot de passe pour accéder aux paramètres de limitation | ⭐⭐ |
| **Rappels doux** | Notifications suggérant de retourner aux révisions | ⭐ |
| **Statistiques d'usage** | Graphique temps outils vs temps révision | ⭐ |

#### Équilibre à trouver
- Les outils doivent rester **accessibles** pour l'apprentissage exploratoire
- Ne pas **frustrer** l'utilisateur avec des restrictions trop rigides
- Encourager l'**autonomie** tout en guidant vers les objectifs
- Permettre un mode **libre** pour les adultes ou contextes non scolaires

### 5.10 Ordre d'Implémentation Suggéré

**Phase 1 - Fondations Mathématiques** (Priorité haute)
1. Cercle trigonométrique (réutilise le canvas existant)
2. Grapheur de fonctions simple
3. Visualiseur de vecteurs

**Phase 2 - Physique de base**
4. Cinématique (position/vitesse/accélération)
5. Circuits électriques basiques
6. Pendule simple

**Phase 3 - Chimie et Biologie**
7. Tableau périodique interactif enrichi
8. Cellule interactive
9. Structures de Lewis

**Phase 4 - Informatique**
10. Visualiseur de tri
11. Arbres binaires / Graphes
12. Automates cellulaires (Game of Life)
13. Turing Tumble (ordinateur mécanique à billes)

**Phase 5 - Extensions Musique**
14. Cercle des quintes
15. Piano virtuel

**Phase 6 - Métaheuristiques** (Avancé)
16. Colonie de fourmis
17. Algorithme génétique
18. Physarum / Blob

### 5.11 Sources et Inspirations

- **PhET Interactive Simulations** : https://phet.colorado.edu/
- **GeoGebra** : https://www.geogebra.org/
- **Desmos** : https://www.desmos.com/
- **oPhysics** : https://ophysics.com/
- **Physics Classroom** : https://www.physicsclassroom.com/interactive
- **Ptable (Periodic Table)** : https://ptable.com/
- **VisuAlgo** : https://visualgo.net/
- **3Blue1Brown** : Chaîne YouTube pour inspiration mathématique
- **Turing Tumble** : https://upperstory.com/en/turingtumble/ (ordinateur mécanique à billes)

---

## Autres fonctionnalités futures (non détaillées)

- [ ] Mode examen chronométré
- [ ] Partage de decks entre utilisateurs
- [ ] Statistiques avancées (courbes de progression)
- [ ] Mode hors-ligne PWA (Service Worker)
- [ ] Import depuis Anki
