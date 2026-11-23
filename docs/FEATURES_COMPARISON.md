# Comparaison des Fonctionnalités

> **État** : document historique, non maintenu (analyse du 2025-12-11). Il compare avec un autre dépôt (SvelteKit) : les chemins `src/lib/...` cités n'existent pas ici. L'état réel du dépôt : `CLAUDE.md`, `docs/SPECIFICATIONS.md`.

> **Date d'analyse** : 2025-12-11
> **Source** : Analyse de l'ancienne version SvelteKit (SvelteKit/TypeScript, dépôt séparé)
> **Cible** : Train Your Brain (Vanilla JS single-file)

Ce document liste les fonctionnalités présentes dans l'ancienne version SvelteKit (version avancée) qui ne sont **pas encore implémentées** dans Train Your Brain.

---

## Table des Matières

1. [Architecture & Stockage](#1-architecture--stockage)
2. [Accessibilité Avancée](#2-accessibilité-avancée)
3. [UI & Effets Visuels](#3-ui--effets-visuels)
4. [Composants Visuels Mathématiques](#4-composants-visuels-mathématiques)
5. [Tutoriel & Onboarding](#5-tutoriel--onboarding)
6. [Gestion des Decks](#6-gestion-des-decks)
7. [Statistiques Avancées](#7-statistiques-avancées)
8. [Gamification Étendue](#8-gamification-étendue)
9. [Audio Avancé](#9-audio-avancé)
10. [Paramètres Étendus](#10-paramètres-étendus)
11. [Génération IA (Prompt Generator)](#11-génération-ia-prompt-generator)
12. [Validation & Sécurité](#12-validation--sécurité)
13. [Import/Export](#13-importexport)
14. [Recommandations de Priorité](#14-recommandations-de-priorité)

---

## 1. Architecture & Stockage

| Feature | Description | Complexité | Statut |
|---------|-------------|------------|--------|
| **IndexedDB** | Stockage persistant plus robuste que localStorage, supporte de gros volumes | Moyenne | ☐ |
| **Service Worker (PWA)** | Application installable, fonctionne offline avec cache | Élevée | ☐ |
| **Tauri Build** | Application desktop native (~3-4MB) via Rust/Webview | Élevée | ☐ |

### Notes
- IndexedDB permet de stocker des decks volumineux sans limite de 5-10MB du localStorage
- Le Service Worker cache les assets pour un vrai mode offline
- Tauri génère des binaires `.deb`, `.AppImage`, `.msi`, `.dmg`

---

## 2. Accessibilité Avancée

| Feature | Description | Complexité | Statut |
|---------|-------------|------------|--------|
| **Mode daltonien** | Support protanopia, deuteranopia, tritanopia via filtres CSS/SVG | Facile | ☐ |
| **Police dyslexie** | Police OpenDyslexic pour faciliter la lecture | Facile | ☐ |
| **Espacement lettres** | Options normal/wide/extra-wide | Facile | ☐ |
| **Hauteur de ligne** | Options normal/tall/extra-tall | Facile | ☐ |
| **Lettres colorées** | Coloration alternée pour aide à la lecture | Facile | ☐ |
| **Haut contraste** | Mode contrast élevé pour malvoyants | Facile | ☐ |

### Structure des Settings
```javascript
accessibilitySettings = {
  highContrast: false,
  fontSize: "medium",        // "small" | "medium" | "large"
  colorBlindMode: "none",    // "none" | "protanopia" | "deuteranopia" | "tritanopia"
  dyslexiaFont: false,
  letterSpacing: "normal",   // "normal" | "wide" | "extra-wide"
  lineHeight: "normal",      // "normal" | "tall" | "extra-tall"
  coloredLetters: false
}
```

---

## 3. UI & Effets Visuels

| Feature | Description | Complexité | Statut |
|---------|-------------|------------|--------|
| **Confettis** | Animation célébration fin session (Canvas/particles) | Facile | ☐ |
| **Particules célébration** | Effets visuels badges/niveaux | Facile | ☐ |
| **XP flottant animé** | Animation "+XP" qui s'envole avec styles par source | Moyenne | ☐ |
| **Toast notifications** | Système de notifications empilables avec auto-dismiss | Moyenne | ☐ |
| **Scroll to Top** | Bouton flottant retour en haut de page | Facile | ☐ |
| **Graphiques (Charts)** | BarChart, PieChart, ProgressBar en SVG | Moyenne | ☐ |

### Types de Toast
```javascript
type ToastType = "success" | "error" | "warning" | "challenge" | "badge" | "levelup" | "info"
```

---

## 4. Composants Visuels Mathématiques

### Formes 2D

| Composant | Props principales | Complexité | Statut |
|-----------|-------------------|------------|--------|
| **Circle** | radius, fillColor, strokeColor | Facile | ☐ |
| **Triangle** | sideA, sideB, sideC, angleA, angleB, angleC | Moyenne | ☐ |
| **Rectangle** | width, height, showDiagonal | Facile | ☐ |
| **Trapezoid** | topWidth, bottomWidth, height | Facile | ☐ |
| **Parallelogram** | width, height, angle | Facile | ☐ |
| **Rhombus** | diagonal1, diagonal2 | Facile | ☐ |
| **RegularPolygon** | sides, radius | Moyenne | ☐ |
| **Angle** | degrees, showArc, showLabel | Facile | ☐ |
| **LineSegment** | length, showMeasure | Facile | ☐ |
| **CartesianPlane** | xRange, yRange, points[], functions[] | Moyenne | ☐ |

### Solides 3D (CSS transforms)

| Composant | Props principales | Complexité | Statut |
|-----------|-------------------|------------|--------|
| **Cube3D** | size, rotateX, rotateY, faceColors | Moyenne | ☐ |
| **Cuboid3D** | width, height, depth | Moyenne | ☐ |
| **Pyramid3D** | baseSize, height, faces | Élevée | ☐ |
| **Tetrahedron3D** | size | Élevée | ☐ |
| **Cylinder3D** | radius, height | Élevée | ☐ |
| **Cone3D** | radius, height | Élevée | ☐ |
| **Sphere3D** | radius (approximation CSS) | Élevée | ☐ |
| **Prism3D** | baseSides, height | Élevée | ☐ |

### Visualisations Arithmétiques

| Composant | Description | Complexité | Statut |
|-----------|-------------|------------|--------|
| **DotsAddition** | Grilles de points pour visualiser additions | Facile | ☐ |
| **DotsSubtraction** | Points barrés pour soustractions | Facile | ☐ |
| **DotsDivision** | Groupements de points | Facile | ☐ |
| **GridMultiplication** | Grille rectangulaire pour multiplications | Facile | ☐ |

---

## 5. Tutoriel & Onboarding

| Feature | Description | Complexité | Statut |
|---------|-------------|------------|--------|
| **Tour guidé** | Modal multi-étapes avec illustrations | Moyenne | ☐ |
| **Explication Leitner** | Composant pédagogique du système 4 boîtes | Facile | ☐ |

### Étapes du Tour Guidé
1. Bienvenue
2. Navigation principale
3. Sélection d'un deck
4. Session de jeu
5. Système de streak
6. XP et niveaux
7. Badges et défis
8. Statistiques détaillées
9. Personnalisation
10. Prêt à commencer

---

## 6. Gestion des Decks

| Feature | Description | Complexité | Statut |
|---------|-------------|------------|--------|
| **Corbeille (Trash)** | Soft delete avec restauration possible | Moyenne | ☐ |
| **Explorateur de decks** | Navigation par taxonomie avec import depuis registry | Moyenne | ☐ |
| **Filtres avancés** | Par niveau scolaire, collection, recherche textuelle | Moyenne | ☐ |
| **Vue arborescence** | Drill-down par catégories hiérarchiques | Moyenne | ☐ |
| **Section "Reprendre"** | Decks en cours avec progression affichée | Facile | ☐ |

### API Corbeille
```javascript
getTrashedDecks()           // Liste les decks supprimés
restoreDeckFromTrash(id)    // Restaure un deck
permanentlyDeleteDeck(id)   // Suppression définitive
emptyTrash()                // Vide la corbeille
```

---

## 7. Statistiques Avancées

| Feature | Description | Complexité | Statut |
|---------|-------------|------------|--------|
| **Historique XP détaillé** | Tous les gains trackés par source et date | Moyenne | ☐ |
| **Stats par carte** | Détails timing, seuils, dates de révision | Moyenne | ☐ |
| **Barre Leitner globale** | Progression visuelle toutes boîtes (% par couleur) | Facile | ☐ |
| **Profil joueur stats** | Composant résumé complet du joueur | Moyenne | ☐ |

### Structure Historique XP
```javascript
xpHistory = [
  {
    date: "2025-12-11",
    amount: 45,
    source: "session",   // "session" | "badge" | "challenge" | "bonus"
    details: "Additions 1-10"
  },
  // ...
]
```

---

## 8. Gamification Étendue

| Feature | Description | Complexité | Statut |
|---------|-------------|------------|--------|
| **Jauge streak verticale** | Barre latérale animée montrant le streak en cours | Facile | ☐ |
| **Indicateur combo** | Affichage du multiplicateur de combo | Facile | ☐ |
| **Barre badges récents** | Affichage en jeu des derniers badges débloqués | Facile | ☐ |
| **Avatar personnalisable** | Sélection parmi emojis prédéfinis | Facile | ☐ |

### Avatars Prédéfinis
```javascript
const PREDEFINED_AVATARS = [
  '👤', '🧑‍🎓', '👨‍💻', '👩‍💻', '🧑‍🏫', '👨‍🔬', '👩‍🔬',
  '🦊', '🐱', '🐶', '🐼', '🐨', '🦁', '🐯', '🐸',
  '🌟', '⭐', '🎮', '🎯', '📚', '🧠', '💡', '🎓',
  '🚀', '🌈', '🔥', '💎', '🏆', '🎨', '🎵', '🌸'
];
```

---

## 9. Audio Avancé

| Feature | Description | Complexité | Statut |
|---------|-------------|------------|--------|
| **Sons par événement** | Toggle individuel pour chaque type de son | Moyenne | ☐ |
| **Sons streak par tier** | 4 mélodies distinctes selon le palier atteint | Facile | ☐ |

### Structure AudioSettings
```javascript
audioSettings = {
  enabled: true,
  purpleBox: true,      // Son réponse incorrecte
  orangeBox: true,      // Son réponse lente
  greenBox: true,       // Son réponse correcte
  sessionComplete: true,
  challengeComplete: true,
  badgeUnlocked: true,
  levelUp: true,
  streakBonus: true     // Sons des paliers 3/6/9/12
}
```

---

## 10. Paramètres Étendus

| Feature | Description | Complexité | Statut |
|---------|-------------|------------|--------|
| **Thèmes visuels** | Ocean, Forest, Sunset, etc. (CSS variables) | Facile | ☐ |
| **Thématiques messages** | Messages de feedback personnalisés par thème | Moyenne | ☐ |
| **Vue par défaut decks** | Grid / List / Tree | Facile | ☐ |
| **Recharger decks** | Refresh des decks prédéfinis depuis YAML | Facile | ☐ |
| **Reset base de données** | Nettoyage complet avec confirmation | Facile | ☐ |

### Thèmes Disponibles
```javascript
const themes = [
  { value: 'ocean', label: 'Océan', emoji: '🌊', colors: ['#0891b2', '#38bdf8', '#0d9488'] },
  { value: 'forest', label: 'Forêt', emoji: '🌲', colors: ['#059669', '#10b981', '#65a30d'] },
  // ... autres thèmes
];
```

---

## 11. Génération IA (Prompt Generator)

| Feature | Description | Complexité | Statut |
|---------|-------------|------------|--------|
| **Templates par catégorie** | Maths, langues, programmation, etc. avec types recommandés | Moyenne | ☐ |
| **Mode compact/détaillé** | Génération de prompt optimisée selon le besoin | Facile | ☐ |
| **Documentation visuels** | Inclusion auto des 17 composants dans le prompt | Facile | ☐ |

### Catégories avec Types Recommandés
```javascript
CATEGORY_TEMPLATES = {
  mathematiques: { defaultAnswerType: "numeric", supportsVisualAid: true },
  langues: { defaultAnswerType: "fuzzy_text", supportsVisualAid: false },
  programmation: { defaultAnswerType: "exact_text", supportsVisualAid: false },
  histoire: { defaultAnswerType: "numeric", supportsVisualAid: false },
  sciences: { defaultAnswerType: "fuzzy_text", supportsVisualAid: true },
  geographie: { defaultAnswerType: "fuzzy_text", supportsVisualAid: false },
  culture_generale: { defaultAnswerType: "mcq", supportsVisualAid: false },
}
```

---

## 12. Validation & Sécurité

| Feature | Description | Complexité | Statut |
|---------|-------------|------------|--------|
| **Damerau-Levenshtein** | Gestion des transpositions (>80% des typos humaines) | Moyenne | ☐ |
| **Réponses multiples** | Array de réponses acceptées pour une carte | Facile | ☐ |
| **Type MCQ** | QCM avec validation exacte de la sélection | Facile | ☐ |
| **Type exact_text** | Comparaison stricte (syntaxe code, commandes) | Facile | ☐ |

### Types de Réponse
```javascript
type AnswerType = "numeric" | "textual" | "fuzzy_text" | "exact_text" | "mcq"
```

---

## 13. Import/Export

| Feature | Description | Complexité | Statut |
|---------|-------------|------------|--------|
| **Import profil joueur** | Restauration complète d'un profil exporté | Moyenne | ☐ |
| **Export complet YAML** | Player + progression + decks dans un seul fichier | Moyenne | ☐ |

---

## 14. Recommandations de Priorité

### Phase 1 - Quick Wins (Facile, forte valeur)
1. Modes daltonien, dyslexie, espacement
2. Confettis et effets visuels simples
3. Scroll to Top
4. Avatar personnalisable
5. Jauge streak verticale
6. Thèmes visuels CSS
7. Explication Leitner

### Phase 2 - Valeur Ajoutée (Moyenne complexité)
8. Toast notifications
9. Historique XP détaillé
10. Corbeille (soft delete)
11. Tutorial/Tour guidé
12. Graphiques statistiques
13. Formes 2D (SVG)
14. Section "Reprendre"

### Phase 3 - Avancé (Complexité élevée)
15. Composants visuels 3D CSS
16. IndexedDB migration
17. PWA/Service Worker
18. Tauri build desktop
19. Explorateur de decks avec taxonomie

---

## Annexe : Fichiers Sources de Référence

Les fichiers suivants de l'ancienne version SvelteKit ont servi de référence pour cette analyse :

```
src/lib/stores/
├── accessibility.ts    # Paramètres accessibilité
├── animations.ts       # Contrôle animations
├── audio.ts            # Audio + notifications toast
├── badges.ts           # Gestion badges
├── challenges.ts       # Défis quotidiens
├── decks.ts            # Gestion decks + corbeille
├── player.ts           # Profil joueur
└── settings.ts         # Paramètres généraux

src/lib/components/
├── effects/
│   ├── Confettis.svelte
│   └── CelebrationParticles.svelte
├── game/
│   ├── StreakGauge.svelte
│   ├── StreakGaugeVertical.svelte
│   ├── ComboIndicator.svelte
│   └── RecentBadgesBar.svelte
├── tutorial/
│   ├── TutorialModal.svelte
│   └── LeitnerExplanation.svelte
├── ui/
│   ├── FloatingXP.svelte
│   ├── ScrollToTop.svelte
│   ├── charts/
│   │   ├── BarChart.svelte
│   │   ├── PieChart.svelte
│   │   └── ProgressBar.svelte
│   └── visuals/
│       ├── Circle.svelte
│       ├── Triangle.svelte
│       ├── Rectangle.svelte
│       ├── ... (autres formes 2D)
│       └── solids3d/
│           ├── Cube3D.svelte
│           └── ... (autres solides 3D)
└── stats/
    ├── LeitnerProgressBar.svelte
    ├── PlayerProfileStats.svelte
    └── XPHistorySection.svelte

src/lib/controllers/
├── AnswerValidator.ts  # Validation réponses
├── GameController.ts   # Logique de jeu
├── LeitnerController.ts
└── XPController.ts

src/lib/services/
└── AudioService.ts     # Web Audio API

src/lib/utils/
├── promptTemplates.ts  # Génération prompts IA
└── validation.ts       # Validation données
```

---

*Document généré pour servir de référence lors de l'implémentation des fonctionnalités manquantes.*
