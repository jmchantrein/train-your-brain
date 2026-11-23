# Guide d'Implémentation des Fonctionnalités

> **État** : document historique, non maintenu. Il décrit des fonctionnalités envisagées et des fichiers qui n'existent pas (ou plus) dans le dépôt (`toast.js`, `pages.js`) ou sous un autre nom (`Storage.getTrashedDecks` et `Storage.permanentlyDelete` : voir `Storage.loadTrashDecks` et `Storage.permanentlyDeleteDeck`). L'état réel du dépôt : `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/SPECIFICATIONS.md`.

> **Objectif** : Ce document fournit les détails d'implémentation pour chaque fonctionnalité manquante,
> permettant à une future instance Claude de les implémenter sans accès aux sources originales.
>
> **Architecture cible** : Vanilla JS (ES2022+), single-file HTML, fonctionne en `file://`

---
IMPLEMENTÉ DANS L'ANCIENNE VERSION SVELTEKIT (pas dans TRAIN YOUR BRAIN)
  ♿ ACCESSIBILITÉ AVANCÉE

  | #   | Feature            | Description                                  | Implémentation                                                                      | Complexité |
  |-----|--------------------|----------------------------------------------|-------------------------------------------------------------------------------------|------------|
  | ☐   | Mode daltonien     | Support protanopia, deuteranopia, tritanopia | stores/accessibility.ts - CSS data-attributes [data-color-blind-mode] + filtres SVG | 🟢 Facile  |
  | ☐   | Police dyslexie    | Police spéciale pour dyslexiques             | data-dyslexia-font - OpenDyslexic via CSS                                           | 🟢 Facile  |
  | ☐   | Espacement lettres | normal/wide/extra-wide                       | letterSpacing dans settings, CSS letter-spacing                                     | 🟢 Facile  |
  | ☐   | Hauteur de ligne   | normal/tall/extra-tall                       | lineHeight dans settings, CSS line-height                                           | 🟢 Facile  |
  | ☐   | Lettres colorées   | Aide visuelle lecture                        | coloredLetters - coloration alternée                                                | 🟢 Facile  |
  | ☐   | Haut contraste     | Mode contrast élevé                          | highContrast - CSS variables inversées                                              | 🟢 Facile  |

  ---
  🎨 UI & EFFETS VISUELS

  | #   | Feature                | Description                         | Implémentation                                         | Complexité |
  |-----|------------------------|-------------------------------------|--------------------------------------------------------|------------|
  | ☐   | Confettis              | Animation célébration fin session   | components/effects/Confettis.svelte - Canvas/particles | 🟢 Facile  |
  | ☐   | Particules célébration | Effets visuels badges/niveaux       | CelebrationParticles.svelte                            | 🟢 Facile  |
  | ☐   | XP flottant animé      | Animation "+XP" qui s'envole        | ui/FloatingXP.svelte - CSS animations multi-sources    | 🟡 Moyenne |
  | ☐   | Toast notifications    | Système de notifications empilables | ToastNotifications.svelte + audio.ts store             | 🟡 Moyenne |
  | ☐   | Scroll to Top          | Bouton retour en haut               | ui/ScrollToTop.svelte                                  | 🟢 Facile  |
  | ☐   | Graphiques (Charts)    | BarChart, PieChart, ProgressBar     | ui/charts/*.svelte - SVG ou Canvas                     | 🟡 Moyenne |

  ---
  📐 COMPOSANTS VISUELS MATHÉMATIQUES

  | #   | Feature             | Description                                                                       | Implémentation                                                 | Complexité        |
  |-----|---------------------|-----------------------------------------------------------------------------------|----------------------------------------------------------------|-------------------|
  | ☐   | Formes 2D           | Cercle, Triangle, Rectangle, Trapèze, Parallélogramme, Losange, Polygone régulier | ui/visuals/*.svelte - SVG avec props (côtés, angles, couleurs) | 🟡 Moyenne        |
  | ☐   | Solides 3D CSS      | Cube3D, Cuboid3D, Pyramid3D, Tetrahedron3D, Cylinder3D, Cone3D, Sphere3D, Prism3D | ui/visuals/solids3d/*.svelte - CSS 3D transforms               | 🔶 Moyenne-Élevée |
  | ☐   | Plan cartésien      | Graphique avec axes et points                                                     | CartesianPlane.svelte - SVG grille + coordonnées               | 🟡 Moyenne        |
  | ☐   | Angles              | Visualisation d'angles                                                            | Angle.svelte - SVG arc avec mesure                             | 🟢 Facile         |
  | ☐   | Segments            | Droites avec mesures                                                              | LineSegment.svelte                                             | 🟢 Facile         |
  | ☐   | Dots arithmétique   | Addition/Soustraction/Division visuels                                            | DotsAddition.svelte, etc. - grilles de points animées          | 🟢 Facile         |
  | ☐   | Grid multiplication | Table de multiplication visuelle                                                  | GridMultiplication.svelte                                      | 🟢 Facile         |

  ---
  🎓 TUTORIEL & ONBOARDING

  | #   | Feature             | Description                      | Implémentation                                               | Complexité |
  |-----|---------------------|----------------------------------|--------------------------------------------------------------|------------|
  | ☐   | Tour guidé          | Modal étape par étape            | tutorial/TutorialModal.svelte - 10 étapes avec illustrations | 🟡 Moyenne |
  | ☐   | Explication Leitner | Composant pédagogique du système | tutorial/LeitnerExplanation.svelte - visuel des 4 boîtes     | 🟢 Facile  |

  ---
  🗑 GESTION DES DECKS

  | #   | Feature              | Description                                          | Implémentation                                                                      | Complexité |
  |-----|----------------------|------------------------------------------------------|-------------------------------------------------------------------------------------|------------|
  | ☐   | Corbeille (Trash)    | Soft delete avec restauration                        | routes/trash/+page.svelte + getTrashedDecks(), restoreDeckFromTrash(), emptyTrash() | 🟡 Moyenne |
  | ☐   | Explorateur de decks | Navigation par taxonomie avec import depuis registry | routes/explore/+page.svelte - charge depuis /decks/registry.json                    | 🟡 Moyenne |
  | ☐   | Filtres avancés      | Par niveau, collection, recherche                    | components/DeckFilters.svelte - filtres combinables                                 | 🟡 Moyenne |
  | ☐   | Vue arborescence     | Drill-down par catégories                            | DrillDownDeckTree.svelte - navigation hiérarchique                                  | 🟡 Moyenne |
  | ☐   | Section "Reprendre"  | Decks en cours avec progression                      | ResumeDecksSection.svelte - cartes "continue where you left off"                    | 🟢 Facile  |

  ---
  📊 STATISTIQUES AVANCÉES

  | #   | Feature                | Description                       | Implémentation                                                       | Complexité |
  |-----|------------------------|-----------------------------------|----------------------------------------------------------------------|------------|
  | ☐   | Historique XP détaillé | Tous les gains trackés par source | player.stats.xpHistory[] avec source (session/badge/challenge/bonus) | 🟡 Moyenne |
  | ☐   | Stats par carte        | Détails timing et révisions       | routes/stats/cards/+page.svelte - temps, seuils, dates révision      | 🟡 Moyenne |
  | ☐   | Barre Leitner globale  | Progression toutes boîtes         | stats/LeitnerProgressBar.svelte - % par couleur                      | 🟢 Facile  |
  | ☐   | Profil joueur stats    | Composant résumé complet          | stats/PlayerProfileStats.svelte                                      | 🟡 Moyenne |

  ---
  🎮 GAMIFICATION ÉTENDUE

  | #   | Feature                | Description                          | Implémentation                                          | Complexité |
  |-----|------------------------|--------------------------------------|---------------------------------------------------------|------------|
  | ☐   | Jauge streak verticale | Indicateur visuel streak en jeu      | game/StreakGaugeVertical.svelte - barre latérale animée | 🟢 Facile  |
  | ☐   | Indicateur combo       | Affichage multiplicateur             | game/ComboIndicator.svelte                              | 🟢 Facile  |
  | ☐   | Barre badges récents   | Affichage en jeu des derniers badges | game/RecentBadgesBar.svelte                             | 🟢 Facile  |
  | ☐   | Avatar personnalisable | Sélection parmi emojis prédéfinis    | Settings avec PREDEFINED_AVATARS array                  | 🟢 Facile  |

  ---
  🔊 AUDIO AVANCÉ

  | #   | Feature              | Description                        | Implémentation                                                                                                         | Complexité |
  |-----|----------------------|------------------------------------|------------------------------------------------------------------------------------------------------------------------|------------|
  | ☐   | Sons par événement   | Toggle individuel par type         | AudioSettings: purpleBox, orangeBox, greenBox, sessionComplete, challengeComplete, badgeUnlocked, levelUp, streakBonus | 🟡 Moyenne |
  | ☐   | Sons streak par tier | Sons différents selon palier (1-4) | playStreakBonusSound(tier) - 4 mélodies distinctes                                                                     | 🟢 Facile  |

  ---
  ⚙ PARAMÈTRES ÉTENDUS

  | #   | Feature               | Description                        | Implémentation                                     | Complexité |
  |-----|-----------------------|------------------------------------|----------------------------------------------------|------------|
  | ☐   | Thèmes visuels        | Ocean, Forest, Sunset, etc.        | stores/settings.ts avec setTheme() - CSS variables | 🟢 Facile  |
  | ☐   | Thématiques messages  | Messages de feedback personnalisés | loadAllThemes() - JSON avec variations par thème   | 🟡 Moyenne |
  | ☐   | Vue par défaut decks  | Grid/List/Tree                     | defaultDeckView setting                            | 🟢 Facile  |
  | ☐   | Recharger decks       | Refresh decks prédéfinis           | reloadDefaultDecks() dans devTools                 | 🟢 Facile  |
  | ☐   | Reset base de données | Nettoyage complet                  | clearDatabase() avec confirmation                  | 🟢 Facile  |

  ---
  🤖 GÉNÉRATION IA (Prompt Generator)

  | #   | Feature                 | Description                         | Implémentation                                                         | Complexité |
  |-----|-------------------------|-------------------------------------|------------------------------------------------------------------------|------------|
  | ☐   | Templates par catégorie | Maths, langues, programmation, etc. | promptTemplates.ts - CATEGORY_TEMPLATES avec types réponse recommandés | 🟡 Moyenne |
  | ☐   | Mode compact/détaillé   | Génération prompt optimisée         | generatePrompt() avec options mode                                     | 🟢 Facile  |
  | ☐   | Documentation visuels   | Doc des 17 composants dans prompt   | Inclusion automatique dans template                                    | 🟢 Facile  |

  ---
  🔐 VALIDATION & SÉCURITÉ

  | #   | Feature             | Description                         | Implémentation                     | Complexité |
  |-----|---------------------|-------------------------------------|------------------------------------|------------|
  | ☐   | Damerau-Levenshtein | Gestion transpositions (>80% typos) | AnswerValidator.ts - algo amélioré | 🟡 Moyenne |
  | ☐   | Réponses multiples  | Array de réponses acceptées         | validateMultipleAnswers()          | 🟢 Facile  |
  | ☐   | Type MCQ            | QCM avec validation exacte          | validateMCQ()                      | 🟢 Facile  |
  | ☐   | Type exact_text     | Comparaison stricte (syntaxe code)  | validateExactText()                | 🟢 Facile  |

  ---
  📱 IMPORT/EXPORT

  | #   | Feature              | Description                  | Implémentation                                 | Complexité |
  |-----|----------------------|------------------------------|------------------------------------------------|------------|
  | ☐   | Import profil joueur | Restauration complète        | routes/import-player/+page.svelte              | 🟡 Moyenne |
  | ☐   | Export complet YAML  | Player + progression + decks | downloadCompletePlayerExport() dans YAMLParser | 🟡 Moyenne |

---

## Table des Matières

1. [Accessibilité Avancée](#1-accessibilité-avancée)
2. [Effets Visuels (Confettis, Particules)](#2-effets-visuels)
3. [Toast Notifications](#3-toast-notifications)
4. [XP Flottant Animé](#4-xp-flottant-animé)
5. [Composants Visuels 2D (SVG)](#5-composants-visuels-2d)
6. [Solides 3D (CSS)](#6-solides-3d-css)
7. [Tutoriel / Tour Guidé](#7-tutoriel--tour-guidé)
8. [Corbeille (Soft Delete)](#8-corbeille-soft-delete)
9. [Historique XP Détaillé](#9-historique-xp-détaillé)
10. [Jauge Streak Verticale](#10-jauge-streak-verticale)
11. [Avatar Personnalisable](#11-avatar-personnalisable)
12. [Thèmes Visuels](#12-thèmes-visuels)
13. [Audio Avancé par Événement](#13-audio-avancé-par-événement)
14. [Validation Damerau-Levenshtein](#14-validation-damerau-levenshtein)
15. [Graphiques SVG](#15-graphiques-svg)
16. [Scroll to Top](#16-scroll-to-top)

---

## 1. Accessibilité Avancée

### 1.1 Structure des Settings

Ajouter dans le modèle `Player.settings` :

```javascript
// Dans src/modules/storage.js ou player model
const DEFAULT_ACCESSIBILITY = {
  highContrast: false,
  fontSize: 'medium',        // 'small' | 'medium' | 'large'
  colorBlindMode: 'none',    // 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
  dyslexiaFont: false,
  letterSpacing: 'normal',   // 'normal' | 'wide' | 'extra-wide'
  lineHeight: 'normal',      // 'normal' | 'tall' | 'extra-tall'
  coloredLetters: false
};
```

### 1.2 Application CSS via Data Attributes

```javascript
// src/modules/a11y.js - Ajouter cette fonction
const A11y = {
  // ... code existant ...

  /**
   * Applique les paramètres d'accessibilité au document
   * @param {Object} settings - AccessibilitySettings
   */
  applySettings(settings) {
    const root = document.documentElement;

    // High Contrast
    if (settings.highContrast) {
      root.setAttribute('data-high-contrast', 'true');
    } else {
      root.removeAttribute('data-high-contrast');
    }

    // Font Size
    root.setAttribute('data-font-size', settings.fontSize || 'medium');

    // Color Blind Mode
    root.setAttribute('data-color-blind-mode', settings.colorBlindMode || 'none');

    // Dyslexia Font
    if (settings.dyslexiaFont) {
      root.setAttribute('data-dyslexia-font', 'true');
    } else {
      root.removeAttribute('data-dyslexia-font');
    }

    // Letter Spacing
    root.setAttribute('data-letter-spacing', settings.letterSpacing || 'normal');

    // Line Height
    root.setAttribute('data-line-height', settings.lineHeight || 'normal');

    // Colored Letters
    if (settings.coloredLetters) {
      root.setAttribute('data-colored-letters', 'true');
    } else {
      root.removeAttribute('data-colored-letters');
    }
  }
};
```

### 1.3 CSS Correspondant

```css
/* src/styles/main.css - Ajouter ces règles */

/* ═══════════════════════════════════════════════════════════════
   ACCESSIBILITÉ - Font Size
   ═══════════════════════════════════════════════════════════════ */
:root[data-font-size="small"] {
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 20px;
}

:root[data-font-size="medium"] {
  --font-size-base: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;
}

:root[data-font-size="large"] {
  --font-size-base: 20px;
  --font-size-lg: 24px;
  --font-size-xl: 32px;
}

/* ═══════════════════════════════════════════════════════════════
   ACCESSIBILITÉ - High Contrast
   ═══════════════════════════════════════════════════════════════ */
:root[data-high-contrast="true"] {
  --color-bg: #000000;
  --color-text: #ffffff;
  --color-purple: #ff00ff;
  --color-orange: #ffaa00;
  --color-green: #00ff00;
  --color-border: #ffffff;
}

:root[data-high-contrast="true"] .card,
:root[data-high-contrast="true"] .btn {
  border: 2px solid var(--color-border);
}

/* ═══════════════════════════════════════════════════════════════
   ACCESSIBILITÉ - Daltonisme (Color Blind Modes)
   ═══════════════════════════════════════════════════════════════ */

/* Protanopia - Rouge faible */
:root[data-color-blind-mode="protanopia"] {
  --color-purple: #0077bb;  /* Bleu au lieu de violet */
  --color-orange: #eecc66;  /* Jaune au lieu d'orange */
  --color-green: #009988;   /* Cyan au lieu de vert */
}

/* Deuteranopia - Vert faible */
:root[data-color-blind-mode="deuteranopia"] {
  --color-purple: #aa4499;  /* Magenta */
  --color-orange: #ddcc77;  /* Jaune pâle */
  --color-green: #88ccee;   /* Bleu clair */
}

/* Tritanopia - Bleu faible */
:root[data-color-blind-mode="tritanopia"] {
  --color-purple: #ee3377;  /* Rose vif */
  --color-orange: #ee7733;  /* Orange vif */
  --color-green: #009988;   /* Teal */
}

/* ═══════════════════════════════════════════════════════════════
   ACCESSIBILITÉ - Police Dyslexie
   ═══════════════════════════════════════════════════════════════ */

/* Charger OpenDyslexic (inclure la font en base64 ou depuis CDN si online) */
@font-face {
  font-family: 'OpenDyslexic';
  src: url('data:font/woff2;base64,...') format('woff2');
  /* Alternative: utiliser une police système plus lisible */
}

:root[data-dyslexia-font="true"] {
  --font-family: 'OpenDyslexic', 'Comic Sans MS', 'Arial', sans-serif;
}

:root[data-dyslexia-font="true"] body,
:root[data-dyslexia-font="true"] input,
:root[data-dyslexia-font="true"] button {
  font-family: var(--font-family);
}

/* ═══════════════════════════════════════════════════════════════
   ACCESSIBILITÉ - Espacement des lettres
   ═══════════════════════════════════════════════════════════════ */
:root[data-letter-spacing="normal"] {
  --letter-spacing: normal;
}

:root[data-letter-spacing="wide"] {
  --letter-spacing: 0.05em;
}

:root[data-letter-spacing="extra-wide"] {
  --letter-spacing: 0.1em;
}

body {
  letter-spacing: var(--letter-spacing, normal);
}

/* ═══════════════════════════════════════════════════════════════
   ACCESSIBILITÉ - Hauteur de ligne
   ═══════════════════════════════════════════════════════════════ */
:root[data-line-height="normal"] {
  --line-height: 1.5;
}

:root[data-line-height="tall"] {
  --line-height: 1.8;
}

:root[data-line-height="extra-tall"] {
  --line-height: 2.2;
}

body {
  line-height: var(--line-height, 1.5);
}

/* ═══════════════════════════════════════════════════════════════
   ACCESSIBILITÉ - Lettres colorées (aide lecture)
   ═══════════════════════════════════════════════════════════════ */
:root[data-colored-letters="true"] .card__question,
:root[data-colored-letters="true"] .card__answer {
  /* Appliquer via JS car nécessite traitement caractère par caractère */
}
```

### 1.4 UI Settings Page

```javascript
// Dans la page settings, ajouter une section accessibilité
function renderAccessibilitySettings(player) {
  const settings = player.settings.accessibility || {};

  return `
    <div class="settings-section">
      <h3>♿ Accessibilité</h3>

      <!-- High Contrast -->
      <label class="toggle-row">
        <span>Contraste élevé</span>
        <input type="checkbox"
               id="highContrast"
               ${settings.highContrast ? 'checked' : ''}
               onchange="toggleAccessibility('highContrast')">
      </label>

      <!-- Font Size -->
      <label class="select-row">
        <span>Taille du texte</span>
        <select id="fontSize" onchange="setAccessibility('fontSize', this.value)">
          <option value="small" ${settings.fontSize === 'small' ? 'selected' : ''}>Petit</option>
          <option value="medium" ${settings.fontSize === 'medium' ? 'selected' : ''}>Moyen</option>
          <option value="large" ${settings.fontSize === 'large' ? 'selected' : ''}>Grand</option>
        </select>
      </label>

      <!-- Color Blind Mode -->
      <label class="select-row">
        <span>Mode daltonien</span>
        <select id="colorBlindMode" onchange="setAccessibility('colorBlindMode', this.value)">
          <option value="none" ${settings.colorBlindMode === 'none' ? 'selected' : ''}>Aucun</option>
          <option value="protanopia" ${settings.colorBlindMode === 'protanopia' ? 'selected' : ''}>Protanopie (rouge)</option>
          <option value="deuteranopia" ${settings.colorBlindMode === 'deuteranopia' ? 'selected' : ''}>Deutéranopie (vert)</option>
          <option value="tritanopia" ${settings.colorBlindMode === 'tritanopia' ? 'selected' : ''}>Tritanopie (bleu)</option>
        </select>
      </label>

      <!-- Dyslexia Font -->
      <label class="toggle-row">
        <span>Police dyslexie</span>
        <input type="checkbox"
               id="dyslexiaFont"
               ${settings.dyslexiaFont ? 'checked' : ''}
               onchange="toggleAccessibility('dyslexiaFont')">
      </label>

      <!-- Letter Spacing -->
      <label class="select-row">
        <span>Espacement lettres</span>
        <select id="letterSpacing" onchange="setAccessibility('letterSpacing', this.value)">
          <option value="normal" ${settings.letterSpacing === 'normal' ? 'selected' : ''}>Normal</option>
          <option value="wide" ${settings.letterSpacing === 'wide' ? 'selected' : ''}>Large</option>
          <option value="extra-wide" ${settings.letterSpacing === 'extra-wide' ? 'selected' : ''}>Très large</option>
        </select>
      </label>

      <!-- Line Height -->
      <label class="select-row">
        <span>Hauteur de ligne</span>
        <select id="lineHeight" onchange="setAccessibility('lineHeight', this.value)">
          <option value="normal" ${settings.lineHeight === 'normal' ? 'selected' : ''}>Normal</option>
          <option value="tall" ${settings.lineHeight === 'tall' ? 'selected' : ''}>Grand</option>
          <option value="extra-tall" ${settings.lineHeight === 'extra-tall' ? 'selected' : ''}>Très grand</option>
        </select>
      </label>
    </div>
  `;
}

// Fonctions handlers
async function toggleAccessibility(key) {
  const player = State.get('player');
  if (!player.settings.accessibility) {
    player.settings.accessibility = { ...DEFAULT_ACCESSIBILITY };
  }
  player.settings.accessibility[key] = !player.settings.accessibility[key];
  A11y.applySettings(player.settings.accessibility);
  await Storage.savePlayer(player);
}

async function setAccessibility(key, value) {
  const player = State.get('player');
  if (!player.settings.accessibility) {
    player.settings.accessibility = { ...DEFAULT_ACCESSIBILITY };
  }
  player.settings.accessibility[key] = value;
  A11y.applySettings(player.settings.accessibility);
  await Storage.savePlayer(player);
}
```

---

## 2. Effets Visuels

### 2.1 Confettis (Canvas)

```javascript
// src/ui/components.js - Ajouter
const Confetti = {
  canvas: null,
  ctx: null,
  particles: [],
  animationId: null,

  /**
   * Initialise et lance l'animation de confettis
   * @param {number} duration - Durée en ms (défaut 3000)
   */
  launch(duration = 3000) {
    this._createCanvas();
    this._createParticles(150);
    this._animate();

    setTimeout(() => this.stop(), duration);
  },

  _createCanvas() {
    // Supprimer canvas existant
    if (this.canvas) {
      this.canvas.remove();
    }

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'confetti-canvas';
    this.canvas.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 9999;
    `;
    document.body.appendChild(this.canvas);

    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx = this.canvas.getContext('2d');
  },

  _createParticles(count) {
    const colors = ['#8b5cf6', '#f97316', '#22c55e', '#3b82f6', '#ec4899', '#eab308'];

    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height - this.canvas.height,
        w: Math.random() * 10 + 5,
        h: Math.random() * 6 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        velocity: {
          x: (Math.random() - 0.5) * 4,
          y: Math.random() * 3 + 2
        },
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }
  },

  _animate() {
    if (!this.ctx) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    let activeParticles = 0;

    this.particles.forEach(p => {
      if (p.opacity <= 0) return;
      activeParticles++;

      // Update position
      p.x += p.velocity.x;
      p.y += p.velocity.y;
      p.rotation += p.rotationSpeed;
      p.velocity.y += 0.1; // Gravity

      // Fade out when near bottom
      if (p.y > this.canvas.height * 0.8) {
        p.opacity -= 0.02;
      }

      // Draw
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation * Math.PI / 180);
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      this.ctx.restore();
    });

    if (activeParticles > 0) {
      this.animationId = requestAnimationFrame(() => this._animate());
    } else {
      this.stop();
    }
  },

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
      this.ctx = null;
    }
    this.particles = [];
  }
};
```

### 2.2 Particules de Célébration (pour badges/level up)

```javascript
const CelebrationParticles = {
  /**
   * Lance des particules depuis un élément
   * @param {HTMLElement} element - Élément source
   * @param {string} type - 'badge' | 'levelup' | 'challenge'
   */
  emit(element, type = 'badge') {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const colors = {
      badge: ['#fbbf24', '#f59e0b', '#d97706'],      // Or
      levelup: ['#a855f7', '#8b5cf6', '#7c3aed'],    // Violet
      challenge: ['#22c55e', '#16a34a', '#15803d']   // Vert
    };

    const particleCount = 20;
    const colorSet = colors[type] || colors.badge;

    for (let i = 0; i < particleCount; i++) {
      this._createParticle(centerX, centerY, colorSet);
    }
  },

  _createParticle(x, y, colors) {
    const particle = document.createElement('div');
    particle.className = 'celebration-particle';

    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 100 + 50;
    const size = Math.random() * 8 + 4;

    particle.style.cssText = `
      position: fixed;
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      background: ${colors[Math.floor(Math.random() * colors.length)]};
      border-radius: 50%;
      pointer-events: none;
      z-index: 10000;
    `;

    document.body.appendChild(particle);

    // Animation
    const duration = 800 + Math.random() * 400;
    const endX = x + Math.cos(angle) * velocity;
    const endY = y + Math.sin(angle) * velocity + 50; // Gravity effect

    particle.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: `translate(${endX - x}px, ${endY - y}px) scale(0)`, opacity: 0 }
    ], {
      duration,
      easing: 'cubic-bezier(0, 0.5, 0.5, 1)'
    }).onfinish = () => particle.remove();
  }
};
```

---

## 3. Toast Notifications

### 3.1 Module Toast

```javascript
// src/ui/components.js ou nouveau fichier src/modules/toast.js
const Toast = {
  container: null,
  notifications: [],

  /**
   * Initialise le conteneur de toasts
   */
  init() {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.id = 'toast-container';
    this.container.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 9000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 350px;
    `;
    document.body.appendChild(this.container);
  },

  /**
   * Affiche une notification toast
   * @param {Object} options
   * @param {string} options.type - 'success' | 'error' | 'warning' | 'info' | 'badge' | 'challenge' | 'levelup'
   * @param {string} options.title - Titre du toast
   * @param {string} options.message - Message du toast
   * @param {string} [options.icon] - Emoji/icône (auto si non fourni)
   * @param {number} [options.duration=4000] - Durée en ms (0 = permanent)
   */
  show({ type = 'info', title, message, icon, duration = 4000 }) {
    this.init();

    const id = Date.now().toString();
    const defaultIcons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      badge: '🎖️',
      challenge: '🏆',
      levelup: '⭐'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.dataset.id = id;
    toast.innerHTML = `
      <div class="toast__icon">${icon || defaultIcons[type] || 'ℹ️'}</div>
      <div class="toast__content">
        <div class="toast__title">${escapeHtml(title)}</div>
        <div class="toast__message">${escapeHtml(message)}</div>
      </div>
      <button class="toast__close" onclick="Toast.dismiss('${id}')">&times;</button>
    `;

    // Animation d'entrée
    toast.style.animation = 'toast-slide-in 0.3s ease-out';

    this.container.appendChild(toast);
    this.notifications.push({ id, element: toast });

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }

    return id;
  },

  /**
   * Ferme une notification
   * @param {string} id - ID du toast
   */
  dismiss(id) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index === -1) return;

    const { element } = this.notifications[index];
    element.style.animation = 'toast-slide-out 0.3s ease-in forwards';

    setTimeout(() => {
      element.remove();
      this.notifications.splice(index, 1);
    }, 300);
  },

  // Raccourcis
  success(title, message) {
    return this.show({ type: 'success', title, message, duration: 3000 });
  },

  error(title, message) {
    return this.show({ type: 'error', title, message, duration: 5000 });
  },

  warning(title, message) {
    return this.show({ type: 'warning', title, message, duration: 4000 });
  },

  info(title, message) {
    return this.show({ type: 'info', title, message, duration: 3000 });
  },

  badge(badgeName) {
    return this.show({
      type: 'badge',
      title: 'Badge débloqué !',
      message: badgeName,
      duration: 5000
    });
  },

  challenge(challengeName) {
    return this.show({
      type: 'challenge',
      title: 'Défi réussi !',
      message: challengeName,
      duration: 4000
    });
  },

  levelUp(newLevel) {
    return this.show({
      type: 'levelup',
      title: 'Niveau supérieur !',
      message: `Vous êtes maintenant niveau ${newLevel}`,
      duration: 5000
    });
  }
};
```

### 3.2 CSS Toast

```css
/* Toast Notifications */
.toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-surface);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border-left: 4px solid;
}

.toast--success { border-color: var(--color-green); }
.toast--error { border-color: #ef4444; }
.toast--warning { border-color: #f59e0b; }
.toast--info { border-color: #3b82f6; }
.toast--badge { border-color: #fbbf24; background: linear-gradient(135deg, var(--color-surface), #fef3c7); }
.toast--challenge { border-color: var(--color-green); background: linear-gradient(135deg, var(--color-surface), #dcfce7); }
.toast--levelup { border-color: var(--color-purple); background: linear-gradient(135deg, var(--color-surface), #f3e8ff); }

.toast__icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.toast__content {
  flex: 1;
  min-width: 0;
}

.toast__title {
  font-weight: 600;
  margin-bottom: 2px;
}

.toast__message {
  font-size: 0.875rem;
  opacity: 0.8;
}

.toast__close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  opacity: 0.5;
  padding: 0;
  line-height: 1;
}

.toast__close:hover {
  opacity: 1;
}

@keyframes toast-slide-in {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes toast-slide-out {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
```

---

## 4. XP Flottant Animé

### 4.1 Composant FloatingXP

```javascript
const FloatingXP = {
  /**
   * Affiche une animation XP flottante
   * @param {number} amount - Montant XP
   * @param {string} source - 'card' | 'badge' | 'challenge' | 'streak'
   * @param {HTMLElement} [anchor] - Élément d'ancrage (optionnel)
   */
  show(amount, source = 'card', anchor = null) {
    const element = document.createElement('div');
    element.className = `floating-xp floating-xp--${source}`;

    const icons = {
      card: '🃏',
      badge: '🎖️',
      challenge: '🏆',
      streak: '🔥'
    };

    element.innerHTML = `
      <span class="floating-xp__icon">${icons[source] || ''}</span>
      <span class="floating-xp__amount">+${amount} XP</span>
    `;

    // Position
    if (anchor) {
      const rect = anchor.getBoundingClientRect();
      element.style.left = `${rect.left + rect.width / 2}px`;
      element.style.top = `${rect.top}px`;
    } else {
      // Position par défaut (centre-haut)
      element.style.left = '50%';
      element.style.top = '30%';
      element.style.transform = 'translateX(-50%)';
    }

    document.body.appendChild(element);

    // Animation et suppression
    element.addEventListener('animationend', () => {
      element.remove();
    });
  }
};
```

### 4.2 CSS FloatingXP

```css
.floating-xp {
  position: fixed;
  pointer-events: none;
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 1.1rem;
  animation: float-up 1.5s ease-out forwards;
}

.floating-xp--card {
  background: linear-gradient(135deg, #8b5cf6, #a78bfa);
  color: white;
}

.floating-xp--badge {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #78350f;
}

.floating-xp--challenge {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
}

.floating-xp--streak {
  background: linear-gradient(135deg, #f97316, #ea580c);
  color: white;
}

.floating-xp__icon {
  font-size: 1.2em;
}

@keyframes float-up {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  50% {
    opacity: 1;
    transform: translateY(-30px) scale(1.1);
  }
  100% {
    opacity: 0;
    transform: translateY(-80px) scale(0.9);
  }
}
```

---

## 5. Composants Visuels 2D

### 5.1 Fonction Générique SVG

```javascript
// src/ui/components.js - Section Visuals
const Visuals = {
  /**
   * Crée un conteneur SVG
   * @param {number} width
   * @param {number} height
   * @param {string} viewBox - optionnel
   */
  _createSVG(width, height, viewBox = null) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', viewBox || `0 0 ${width} ${height}`);
    svg.style.overflow = 'visible';
    return svg;
  },

  /**
   * Cercle
   * @param {Object} options
   * @param {number} options.radius - Rayon (défaut 50)
   * @param {string} options.fill - Couleur de remplissage
   * @param {string} options.stroke - Couleur de contour
   * @param {number} options.strokeWidth - Épaisseur contour
   * @param {boolean} options.showRadius - Afficher le rayon
   * @param {boolean} options.showCenter - Afficher le centre
   */
  circle({ radius = 50, fill = 'none', stroke = 'currentColor', strokeWidth = 2, showRadius = false, showCenter = false } = {}) {
    const size = (radius + strokeWidth) * 2 + 20;
    const center = size / 2;
    const svg = this._createSVG(size, size);

    // Cercle principal
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', center);
    circle.setAttribute('cy', center);
    circle.setAttribute('r', radius);
    circle.setAttribute('fill', fill);
    circle.setAttribute('stroke', stroke);
    circle.setAttribute('stroke-width', strokeWidth);
    svg.appendChild(circle);

    // Point central
    if (showCenter) {
      const centerPoint = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      centerPoint.setAttribute('cx', center);
      centerPoint.setAttribute('cy', center);
      centerPoint.setAttribute('r', 3);
      centerPoint.setAttribute('fill', stroke);
      svg.appendChild(centerPoint);
    }

    // Rayon
    if (showRadius) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', center);
      line.setAttribute('y1', center);
      line.setAttribute('x2', center + radius);
      line.setAttribute('y2', center);
      line.setAttribute('stroke', stroke);
      line.setAttribute('stroke-width', 1);
      line.setAttribute('stroke-dasharray', '4,2');
      svg.appendChild(line);

      // Label rayon
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', center + radius / 2);
      text.setAttribute('y', center - 8);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '12');
      text.setAttribute('fill', stroke);
      text.textContent = `r=${radius}`;
      svg.appendChild(text);
    }

    return svg;
  },

  /**
   * Rectangle
   * @param {Object} options
   * @param {number} options.width - Largeur
   * @param {number} options.height - Hauteur
   * @param {string} options.fill - Remplissage
   * @param {string} options.stroke - Contour
   * @param {boolean} options.showDimensions - Afficher dimensions
   * @param {boolean} options.showDiagonal - Afficher diagonale
   */
  rectangle({ width = 100, height = 60, fill = 'none', stroke = 'currentColor', strokeWidth = 2, showDimensions = false, showDiagonal = false } = {}) {
    const padding = 30;
    const svgWidth = width + padding * 2;
    const svgHeight = height + padding * 2;
    const svg = this._createSVG(svgWidth, svgHeight);

    // Rectangle
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', padding);
    rect.setAttribute('y', padding);
    rect.setAttribute('width', width);
    rect.setAttribute('height', height);
    rect.setAttribute('fill', fill);
    rect.setAttribute('stroke', stroke);
    rect.setAttribute('stroke-width', strokeWidth);
    svg.appendChild(rect);

    // Diagonale
    if (showDiagonal) {
      const diag = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      diag.setAttribute('x1', padding);
      diag.setAttribute('y1', padding);
      diag.setAttribute('x2', padding + width);
      diag.setAttribute('y2', padding + height);
      diag.setAttribute('stroke', stroke);
      diag.setAttribute('stroke-width', 1);
      diag.setAttribute('stroke-dasharray', '4,2');
      svg.appendChild(diag);
    }

    // Dimensions
    if (showDimensions) {
      // Largeur (en bas)
      const widthText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      widthText.setAttribute('x', padding + width / 2);
      widthText.setAttribute('y', padding + height + 20);
      widthText.setAttribute('text-anchor', 'middle');
      widthText.setAttribute('font-size', '12');
      widthText.setAttribute('fill', stroke);
      widthText.textContent = width;
      svg.appendChild(widthText);

      // Hauteur (à droite)
      const heightText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      heightText.setAttribute('x', padding + width + 15);
      heightText.setAttribute('y', padding + height / 2);
      heightText.setAttribute('text-anchor', 'start');
      heightText.setAttribute('font-size', '12');
      heightText.setAttribute('fill', stroke);
      heightText.textContent = height;
      svg.appendChild(heightText);
    }

    return svg;
  },

  /**
   * Triangle
   * @param {Object} options
   * @param {number} options.base - Base du triangle
   * @param {number} options.height - Hauteur
   * @param {string} options.type - 'equilateral' | 'isoceles' | 'right' | 'scalene'
   */
  triangle({ base = 100, height = 80, type = 'isoceles', fill = 'none', stroke = 'currentColor', strokeWidth = 2 } = {}) {
    const padding = 20;
    const svgWidth = base + padding * 2;
    const svgHeight = height + padding * 2;
    const svg = this._createSVG(svgWidth, svgHeight);

    let points;
    const baseY = padding + height;
    const leftX = padding;
    const rightX = padding + base;

    switch (type) {
      case 'equilateral':
        points = `${leftX},${baseY} ${rightX},${baseY} ${padding + base/2},${padding}`;
        break;
      case 'right':
        points = `${leftX},${baseY} ${rightX},${baseY} ${leftX},${padding}`;
        break;
      case 'isoceles':
      default:
        points = `${leftX},${baseY} ${rightX},${baseY} ${padding + base/2},${padding}`;
    }

    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points);
    polygon.setAttribute('fill', fill);
    polygon.setAttribute('stroke', stroke);
    polygon.setAttribute('stroke-width', strokeWidth);
    svg.appendChild(polygon);

    return svg;
  },

  /**
   * Polygone régulier
   * @param {Object} options
   * @param {number} options.sides - Nombre de côtés (3-12)
   * @param {number} options.radius - Rayon
   */
  regularPolygon({ sides = 6, radius = 50, fill = 'none', stroke = 'currentColor', strokeWidth = 2 } = {}) {
    const size = (radius + strokeWidth) * 2 + 20;
    const center = size / 2;
    const svg = this._createSVG(size, size);

    const points = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI / sides) - Math.PI / 2; // Start from top
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      points.push(`${x},${y}`);
    }

    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', points.join(' '));
    polygon.setAttribute('fill', fill);
    polygon.setAttribute('stroke', stroke);
    polygon.setAttribute('stroke-width', strokeWidth);
    svg.appendChild(polygon);

    return svg;
  },

  /**
   * Grille de multiplication visuelle
   * @param {number} a - Premier facteur
   * @param {number} b - Second facteur
   * @param {number} dotSize - Taille des points
   */
  gridMultiplication(a, b, dotSize = 12) {
    const gap = dotSize * 1.5;
    const padding = 20;
    const width = b * gap + padding * 2;
    const height = a * gap + padding * 2;
    const svg = this._createSVG(width, height);

    for (let row = 0; row < a; row++) {
      for (let col = 0; col < b; col++) {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', padding + col * gap + dotSize / 2);
        circle.setAttribute('cy', padding + row * gap + dotSize / 2);
        circle.setAttribute('r', dotSize / 2 - 1);
        circle.setAttribute('fill', 'var(--color-purple)');
        svg.appendChild(circle);
      }
    }

    return svg;
  },

  /**
   * Points addition
   * @param {number} a - Premier nombre
   * @param {number} b - Second nombre
   */
  dotsAddition(a, b, dotSize = 14) {
    const gap = dotSize * 1.8;
    const padding = 15;
    const maxPerRow = 10;

    const totalDots = a + b;
    const rows = Math.ceil(totalDots / maxPerRow);
    const width = Math.min(totalDots, maxPerRow) * gap + padding * 2;
    const height = rows * gap + padding * 2;
    const svg = this._createSVG(width, height);

    let dotIndex = 0;
    for (let i = 0; i < a + b; i++) {
      const row = Math.floor(dotIndex / maxPerRow);
      const col = dotIndex % maxPerRow;

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', padding + col * gap + dotSize / 2);
      circle.setAttribute('cy', padding + row * gap + dotSize / 2);
      circle.setAttribute('r', dotSize / 2 - 1);
      circle.setAttribute('fill', i < a ? 'var(--color-purple)' : 'var(--color-green)');
      svg.appendChild(circle);

      dotIndex++;
    }

    return svg;
  },

  /**
   * Points soustraction (avec points barrés)
   * @param {number} a - Nombre initial
   * @param {number} b - Nombre à soustraire
   */
  dotsSubtraction(a, b, dotSize = 14) {
    const gap = dotSize * 1.8;
    const padding = 15;
    const maxPerRow = 10;

    const rows = Math.ceil(a / maxPerRow);
    const width = Math.min(a, maxPerRow) * gap + padding * 2;
    const height = rows * gap + padding * 2;
    const svg = this._createSVG(width, height);

    for (let i = 0; i < a; i++) {
      const row = Math.floor(i / maxPerRow);
      const col = i % maxPerRow;
      const cx = padding + col * gap + dotSize / 2;
      const cy = padding + row * gap + dotSize / 2;

      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', cx);
      circle.setAttribute('cy', cy);
      circle.setAttribute('r', dotSize / 2 - 1);
      circle.setAttribute('fill', i < a - b ? 'var(--color-purple)' : 'var(--color-orange)');
      circle.setAttribute('opacity', i < a - b ? '1' : '0.4');
      svg.appendChild(circle);

      // Barrer les points soustraits
      if (i >= a - b) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', cx - dotSize / 2);
        line.setAttribute('y1', cy - dotSize / 2);
        line.setAttribute('x2', cx + dotSize / 2);
        line.setAttribute('y2', cy + dotSize / 2);
        line.setAttribute('stroke', '#ef4444');
        line.setAttribute('stroke-width', 2);
        svg.appendChild(line);
      }
    }

    return svg;
  }
};
```

---

## 6. Solides 3D CSS

### 6.1 Cube 3D

```javascript
// src/ui/components.js - Section 3D
const Visuals3D = {
  /**
   * Crée un cube 3D en CSS pur
   * @param {Object} options
   * @param {number} options.size - Taille du côté (défaut 100)
   * @param {Object} options.colors - Couleurs des faces { front, back, left, right, top, bottom }
   * @param {number} options.rotateX - Rotation X initiale
   * @param {number} options.rotateY - Rotation Y initiale
   * @param {boolean} options.animated - Animation rotation auto
   */
  cube({ size = 100, colors = {}, rotateX = -20, rotateY = 30, animated = false } = {}) {
    const defaultColors = {
      front: 'rgba(139, 92, 246, 0.8)',   // Violet
      back: 'rgba(139, 92, 246, 0.6)',
      left: 'rgba(249, 115, 22, 0.8)',    // Orange
      right: 'rgba(249, 115, 22, 0.6)',
      top: 'rgba(34, 197, 94, 0.8)',      // Vert
      bottom: 'rgba(34, 197, 94, 0.6)'
    };
    const c = { ...defaultColors, ...colors };

    const container = document.createElement('div');
    container.className = 'cube-container';
    container.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      perspective: ${size * 4}px;
      perspective-origin: 50% 50%;
    `;

    const cube = document.createElement('div');
    cube.className = 'cube';
    cube.style.cssText = `
      width: 100%;
      height: 100%;
      position: relative;
      transform-style: preserve-3d;
      transform: rotateX(${rotateX}deg) rotateY(${rotateY}deg);
      ${animated ? 'animation: cube-rotate 8s linear infinite;' : ''}
    `;

    const faces = [
      { name: 'front', transform: `translateZ(${size/2}px)`, color: c.front },
      { name: 'back', transform: `translateZ(${-size/2}px) rotateY(180deg)`, color: c.back },
      { name: 'left', transform: `translateX(${-size/2}px) rotateY(-90deg)`, color: c.left },
      { name: 'right', transform: `translateX(${size/2}px) rotateY(90deg)`, color: c.right },
      { name: 'top', transform: `translateY(${-size/2}px) rotateX(90deg)`, color: c.top },
      { name: 'bottom', transform: `translateY(${size/2}px) rotateX(-90deg)`, color: c.bottom }
    ];

    faces.forEach(face => {
      const faceEl = document.createElement('div');
      faceEl.className = `cube-face cube-face--${face.name}`;
      faceEl.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${face.color};
        border: 2px solid rgba(255,255,255,0.3);
        transform: ${face.transform};
        backface-visibility: visible;
      `;
      cube.appendChild(faceEl);
    });

    container.appendChild(cube);
    return container;
  },

  /**
   * Crée une pyramide 3D
   */
  pyramid({ baseSize = 100, height = 120, color = 'rgba(139, 92, 246, 0.7)', rotateX = -20, rotateY = 30 } = {}) {
    const container = document.createElement('div');
    container.className = 'pyramid-container';
    container.style.cssText = `
      width: ${baseSize}px;
      height: ${height}px;
      perspective: 500px;
      position: relative;
    `;

    const pyramid = document.createElement('div');
    pyramid.className = 'pyramid';
    pyramid.style.cssText = `
      width: 100%;
      height: 100%;
      position: relative;
      transform-style: preserve-3d;
      transform: rotateX(${rotateX}deg) rotateY(${rotateY}deg);
    `;

    // Base carrée
    const base = document.createElement('div');
    base.style.cssText = `
      position: absolute;
      width: ${baseSize}px;
      height: ${baseSize}px;
      background: ${color};
      transform: translateY(${height}px) rotateX(90deg);
      transform-origin: top;
    `;
    pyramid.appendChild(base);

    // 4 faces triangulaires (approximation avec clip-path)
    const faceColors = [
      'rgba(139, 92, 246, 0.9)',
      'rgba(139, 92, 246, 0.7)',
      'rgba(139, 92, 246, 0.5)',
      'rgba(139, 92, 246, 0.6)'
    ];

    for (let i = 0; i < 4; i++) {
      const face = document.createElement('div');
      const angle = i * 90;
      face.style.cssText = `
        position: absolute;
        width: ${baseSize}px;
        height: ${height}px;
        background: ${faceColors[i]};
        clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        transform-origin: bottom center;
        transform: rotateY(${angle}deg) translateZ(${baseSize/2}px) rotateX(30deg);
      `;
      pyramid.appendChild(face);
    }

    container.appendChild(pyramid);
    return container;
  }
};
```

### 6.2 CSS 3D Animations

```css
/* Animations 3D */
@keyframes cube-rotate {
  from {
    transform: rotateX(-20deg) rotateY(0deg);
  }
  to {
    transform: rotateX(-20deg) rotateY(360deg);
  }
}

.cube-container {
  margin: 20px auto;
}

/* Pour que les interactions soient possibles */
.cube-container:hover .cube {
  animation-play-state: paused;
}
```

---

## 7. Tutoriel / Tour Guidé

### 7.1 Module Tutorial

```javascript
const Tutorial = {
  steps: [
    {
      id: 'welcome',
      title: 'Bienvenue dans Train Your Brain ! 🧠',
      content: 'Découvrez comment utiliser l\'application pour mémoriser efficacement avec le système Leitner.',
      emoji: '👋'
    },
    {
      id: 'navigation',
      title: 'Navigation principale',
      content: 'Utilisez le menu pour accéder aux différentes sections : Accueil, Decks, Stats, Badges et Défis.',
      emoji: '🧭',
      highlight: '.nav-menu' // Sélecteur CSS à mettre en évidence
    },
    {
      id: 'deck-selection',
      title: 'Sélection d\'un deck',
      content: 'Choisissez un deck thématique pour commencer. Vous pouvez filtrer par catégorie ou créer vos propres decks.',
      emoji: '📚'
    },
    {
      id: 'game-session',
      title: 'Session de jeu',
      content: 'Répondez aux questions. Les cartes évoluent dans 4 boîtes selon vos performances :\n💜 Violet → 🟠 Orange → 🟢 Vert (maîtrisé)',
      emoji: '🎮'
    },
    {
      id: 'streak',
      title: 'Système de streak',
      content: 'Enchaînez les bonnes réponses rapides (🟢) pour augmenter votre streak et gagner des bonus XP !',
      emoji: '🔥'
    },
    {
      id: 'xp-levels',
      title: 'XP et niveaux',
      content: 'Gagnez de l\'XP à chaque réponse :\n+1 XP (💜), +2 XP (🟠), +3 XP (🟢)\nMontez de niveau et débloquez des badges !',
      emoji: '⭐'
    },
    {
      id: 'badges-challenges',
      title: 'Badges et défis',
      content: 'Débloquez plus de 40 badges en atteignant des objectifs. Complétez les 3 défis quotidiens pour des bonus XP !',
      emoji: '🏆'
    },
    {
      id: 'stats',
      title: 'Statistiques',
      content: 'Suivez votre progression globale et par deck. Consultez vos temps de réponse et performances.',
      emoji: '📊'
    },
    {
      id: 'settings',
      title: 'Personnalisation',
      content: 'Personnalisez l\'expérience : thèmes, sons, animations, accessibilité et plus encore.',
      emoji: '⚙️'
    },
    {
      id: 'ready',
      title: 'Prêt à commencer !',
      content: 'Vous avez toutes les clés en main. Bonne révision !',
      emoji: '🚀'
    }
  ],

  currentStep: 0,
  modal: null,
  overlay: null,

  /**
   * Lance le tutoriel
   */
  start() {
    this.currentStep = 0;
    this._createOverlay();
    this._showStep();
  },

  /**
   * Passe à l'étape suivante
   */
  next() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this._showStep();
    } else {
      this.close();
    }
  },

  /**
   * Revient à l'étape précédente
   */
  prev() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this._showStep();
    }
  },

  /**
   * Ferme le tutoriel
   */
  close() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
    // Marquer comme vu dans les settings du joueur
    const player = State.get('player');
    if (player) {
      player.settings.tutorialCompleted = true;
      Storage.savePlayer(player);
    }
  },

  _createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.className = 'tutorial-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9998;
    `;
    document.body.appendChild(this.overlay);
  },

  _showStep() {
    const step = this.steps[this.currentStep];

    // Supprimer modal existant
    if (this.modal) {
      this.modal.remove();
    }

    // Créer nouveau modal
    this.modal = document.createElement('div');
    this.modal.className = 'tutorial-modal';
    this.modal.innerHTML = `
      <div class="tutorial-modal__header">
        <span class="tutorial-modal__emoji">${step.emoji}</span>
        <span class="tutorial-modal__progress">${this.currentStep + 1} / ${this.steps.length}</span>
      </div>
      <h2 class="tutorial-modal__title">${step.title}</h2>
      <p class="tutorial-modal__content">${step.content.replace(/\n/g, '<br>')}</p>
      <div class="tutorial-modal__actions">
        ${this.currentStep > 0 ? '<button class="btn btn--secondary" onclick="Tutorial.prev()">← Précédent</button>' : ''}
        <button class="btn btn--primary" onclick="Tutorial.next()">
          ${this.currentStep < this.steps.length - 1 ? 'Suivant →' : 'Terminer ✓'}
        </button>
      </div>
      <button class="tutorial-modal__skip" onclick="Tutorial.close()">Passer le tutoriel</button>
    `;

    document.body.appendChild(this.modal);

    // Highlight élément si spécifié
    if (step.highlight) {
      const el = document.querySelector(step.highlight);
      if (el) {
        el.classList.add('tutorial-highlight');
      }
    }
  }
};
```

### 7.2 CSS Tutorial

```css
.tutorial-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--color-surface);
  border-radius: 16px;
  padding: 30px;
  max-width: 450px;
  width: 90%;
  z-index: 9999;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  animation: modal-appear 0.3s ease-out;
}

.tutorial-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.tutorial-modal__emoji {
  font-size: 3rem;
}

.tutorial-modal__progress {
  font-size: 0.875rem;
  opacity: 0.6;
}

.tutorial-modal__title {
  font-size: 1.5rem;
  margin-bottom: 15px;
}

.tutorial-modal__content {
  margin-bottom: 25px;
  line-height: 1.6;
  opacity: 0.9;
}

.tutorial-modal__actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.tutorial-modal__skip {
  margin-top: 15px;
  background: none;
  border: none;
  color: var(--color-text);
  opacity: 0.5;
  cursor: pointer;
  font-size: 0.875rem;
}

.tutorial-modal__skip:hover {
  opacity: 1;
  text-decoration: underline;
}

.tutorial-highlight {
  position: relative;
  z-index: 9999;
  box-shadow: 0 0 0 4px var(--color-purple), 0 0 20px var(--color-purple);
  border-radius: 8px;
}

@keyframes modal-appear {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
```

---

## 8. Corbeille (Soft Delete)

### 8.1 Extension du Storage

```javascript
// Dans src/modules/storage.js - Ajouter ces méthodes

const Storage = {
  // ... code existant ...

  /**
   * Déplace un deck vers la corbeille (soft delete)
   * @param {string} deckId - ID du deck
   * @returns {boolean} - Succès
   */
  async trashDeck(deckId) {
    const deck = await this.getDeck(deckId);
    if (!deck) return false;

    // Ajouter métadonnées de suppression
    const trashedDeck = {
      ...deck,
      deletedAt: new Date().toISOString(),
      originalId: deckId
    };

    // Sauvegarder dans la zone corbeille
    const trash = this._getTrash();
    trash.push(trashedDeck);
    localStorage.setItem('tyb_trash', JSON.stringify(trash));

    // Supprimer de la liste principale
    await this.deleteDeck(deckId);

    return true;
  },

  /**
   * Récupère les decks de la corbeille
   * @returns {Array} - Liste des decks supprimés
   */
  getTrashedDecks() {
    return this._getTrash();
  },

  /**
   * Restaure un deck depuis la corbeille
   * @param {string} deckId - ID du deck (originalId)
   * @returns {boolean} - Succès
   */
  async restoreFromTrash(deckId) {
    const trash = this._getTrash();
    const index = trash.findIndex(d => d.originalId === deckId || d.id === deckId);

    if (index === -1) return false;

    const deck = trash[index];

    // Supprimer les métadonnées de suppression
    delete deck.deletedAt;
    delete deck.originalId;

    // Restaurer le deck
    await this.saveDeck(deck);

    // Retirer de la corbeille
    trash.splice(index, 1);
    localStorage.setItem('tyb_trash', JSON.stringify(trash));

    return true;
  },

  /**
   * Supprime définitivement un deck de la corbeille
   * @param {string} deckId - ID du deck
   * @returns {boolean} - Succès
   */
  permanentlyDelete(deckId) {
    const trash = this._getTrash();
    const index = trash.findIndex(d => d.originalId === deckId || d.id === deckId);

    if (index === -1) return false;

    trash.splice(index, 1);
    localStorage.setItem('tyb_trash', JSON.stringify(trash));

    return true;
  },

  /**
   * Vide la corbeille
   * @returns {number} - Nombre de decks supprimés
   */
  emptyTrash() {
    const trash = this._getTrash();
    const count = trash.length;
    localStorage.setItem('tyb_trash', JSON.stringify([]));
    return count;
  },

  _getTrash() {
    try {
      return JSON.parse(localStorage.getItem('tyb_trash') || '[]');
    } catch {
      return [];
    }
  }
};
```

### 8.2 Page Corbeille

```javascript
// Dans src/ui/pages.js - Ajouter la page trash
Pages.trash = {
  render() {
    const trashedDecks = Storage.getTrashedDecks();

    return `
      <div class="page trash-page">
        <header class="page-header">
          <h1>🗑️ Corbeille</h1>
          ${trashedDecks.length > 0 ? `
            <button class="btn btn--danger" onclick="Pages.trash.emptyTrash()">
              Vider la corbeille
            </button>
          ` : ''}
        </header>

        ${trashedDecks.length === 0 ? `
          <div class="empty-state">
            <span class="empty-state__icon">🗑️</span>
            <p>La corbeille est vide</p>
          </div>
        ` : `
          <div class="trash-list">
            ${trashedDecks.map(deck => `
              <div class="trash-item">
                <div class="trash-item__info">
                  <h3>${escapeHtml(deck.name)}</h3>
                  <p class="trash-item__meta">
                    ${deck.cards?.length || 0} cartes •
                    Supprimé le ${new Date(deck.deletedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div class="trash-item__actions">
                  <button class="btn btn--secondary" onclick="Pages.trash.restore('${deck.originalId || deck.id}')">
                    ♻️ Restaurer
                  </button>
                  <button class="btn btn--danger-outline" onclick="Pages.trash.permanentDelete('${deck.originalId || deck.id}')">
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  },

  async restore(deckId) {
    if (await Storage.restoreFromTrash(deckId)) {
      Toast.success('Deck restauré', 'Le deck a été restauré avec succès');
      App.render();
    } else {
      Toast.error('Erreur', 'Impossible de restaurer le deck');
    }
  },

  async permanentDelete(deckId) {
    if (!confirm('⚠️ Cette action est IRRÉVERSIBLE. Supprimer définitivement ce deck ?')) {
      return;
    }

    if (Storage.permanentlyDelete(deckId)) {
      Toast.info('Supprimé', 'Le deck a été supprimé définitivement');
      App.render();
    }
  },

  async emptyTrash() {
    if (!confirm('⚠️ Vider la corbeille ? Cette action est IRRÉVERSIBLE.')) {
      return;
    }

    const count = Storage.emptyTrash();
    Toast.info('Corbeille vidée', `${count} deck(s) supprimé(s) définitivement`);
    App.render();
  }
};
```

---

## 9. Historique XP Détaillé

### 9.1 Structure de Données

```javascript
// Ajouter à player.stats
player.stats.xpHistory = [
  {
    date: "2025-12-11",
    amount: 45,
    source: "session",    // "session" | "badge" | "challenge" | "bonus" | "streak"
    details: "Additions 1-10",
    timestamp: 1733929200000  // Pour tri précis
  }
];
```

### 9.2 Fonctions d'Enregistrement

```javascript
// Dans src/modules/xp.js - Ajouter
const XP = {
  // ... code existant ...

  /**
   * Ajoute de l'XP avec historique
   * @param {Object} player - Le joueur
   * @param {number} amount - Montant XP
   * @param {string} source - Source de l'XP
   * @param {string} details - Détails (nom deck, badge, etc.)
   * @returns {Object} - Joueur mis à jour
   */
  addWithHistory(player, amount, source, details = '') {
    const updated = { ...player };

    // Ajouter l'XP
    updated.stats.totalXP = (updated.stats.totalXP || 0) + amount;

    // Initialiser l'historique si nécessaire
    if (!updated.stats.xpHistory) {
      updated.stats.xpHistory = [];
    }

    // Ajouter à l'historique
    updated.stats.xpHistory.push({
      date: new Date().toISOString().split('T')[0],
      amount,
      source,
      details,
      timestamp: Date.now()
    });

    // Limiter l'historique aux 1000 dernières entrées
    if (updated.stats.xpHistory.length > 1000) {
      updated.stats.xpHistory = updated.stats.xpHistory.slice(-1000);
    }

    return updated;
  },

  /**
   * Récupère l'historique XP d'une période
   * @param {Object} player - Le joueur
   * @param {number} days - Nombre de jours (défaut 30)
   */
  getHistoryByPeriod(player, days = 30) {
    if (!player.stats.xpHistory) return [];

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    return player.stats.xpHistory.filter(entry => entry.date >= cutoffStr);
  },

  /**
   * Calcule l'XP par source
   * @param {Object} player - Le joueur
   */
  getXPBySource(player) {
    if (!player.stats.xpHistory) return {};

    return player.stats.xpHistory.reduce((acc, entry) => {
      acc[entry.source] = (acc[entry.source] || 0) + entry.amount;
      return acc;
    }, {});
  }
};
```

---

## 10. Jauge Streak Verticale

```javascript
// src/ui/components.js
function renderStreakGauge(currentStreak, maxForBonus = 12) {
  const percentage = Math.min((currentStreak / maxForBonus) * 100, 100);
  const tiers = [
    { threshold: 3, label: '🔥', color: 'var(--color-orange)' },
    { threshold: 6, label: '🔥🔥', color: 'var(--color-orange)' },
    { threshold: 9, label: '🔥🔥🔥', color: '#ef4444' },
    { threshold: 12, label: '💥', color: '#dc2626' }
  ];

  const currentTier = tiers.filter(t => currentStreak >= t.threshold).pop();

  return `
    <div class="streak-gauge-vertical">
      <div class="streak-gauge-vertical__track">
        <div class="streak-gauge-vertical__fill" style="height: ${percentage}%; background: ${currentTier?.color || 'var(--color-green)'}">
        </div>
        ${tiers.map(tier => `
          <div class="streak-gauge-vertical__marker" style="bottom: ${(tier.threshold / maxForBonus) * 100}%">
            <span class="streak-gauge-vertical__marker-label">${tier.label}</span>
          </div>
        `).join('')}
      </div>
      <div class="streak-gauge-vertical__value">${currentStreak}</div>
    </div>
  `;
}
```

### CSS Streak Gauge

```css
.streak-gauge-vertical {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
}

.streak-gauge-vertical__track {
  width: 20px;
  height: 200px;
  background: var(--color-surface);
  border-radius: 10px;
  position: relative;
  overflow: hidden;
  border: 2px solid var(--color-border);
}

.streak-gauge-vertical__fill {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  transition: height 0.3s ease-out, background 0.3s;
  border-radius: 8px;
}

.streak-gauge-vertical__marker {
  position: absolute;
  left: -30px;
  transform: translateY(50%);
}

.streak-gauge-vertical__marker-label {
  font-size: 0.75rem;
}

.streak-gauge-vertical__value {
  font-size: 1.5rem;
  font-weight: bold;
}
```

---

## 11. Avatar Personnalisable

```javascript
const PREDEFINED_AVATARS = [
  '👤', '🧑‍🎓', '👨‍💻', '👩‍💻', '🧑‍🏫', '👨‍🔬', '👩‍🔬',
  '🦊', '🐱', '🐶', '🐼', '🐨', '🦁', '🐯', '🐸',
  '🌟', '⭐', '🎮', '🎯', '📚', '🧠', '💡', '🎓',
  '🚀', '🌈', '🔥', '💎', '🏆', '🎨', '🎵', '🌸'
];

function renderAvatarSelector(currentAvatar) {
  return `
    <div class="avatar-selector">
      <h4>Choisir un avatar</h4>
      <div class="avatar-grid">
        ${PREDEFINED_AVATARS.map(avatar => `
          <button
            class="avatar-option ${avatar === currentAvatar ? 'avatar-option--selected' : ''}"
            onclick="selectAvatar('${avatar}')"
          >
            ${avatar}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

async function selectAvatar(avatar) {
  const player = State.get('player');
  player.avatar = avatar;
  await Storage.savePlayer(player);
  App.render();
}
```

---

## 12. Thèmes Visuels

```javascript
const THEMES = {
  default: {
    name: 'Défaut',
    emoji: '🎨',
    colors: {
      '--color-bg': '#0f172a',
      '--color-surface': '#1e293b',
      '--color-text': '#f8fafc',
      '--color-purple': '#8b5cf6',
      '--color-orange': '#f97316',
      '--color-green': '#22c55e'
    }
  },
  ocean: {
    name: 'Océan',
    emoji: '🌊',
    colors: {
      '--color-bg': '#0c1929',
      '--color-surface': '#1a3a52',
      '--color-text': '#e0f2fe',
      '--color-purple': '#0891b2',
      '--color-orange': '#38bdf8',
      '--color-green': '#0d9488'
    }
  },
  forest: {
    name: 'Forêt',
    emoji: '🌲',
    colors: {
      '--color-bg': '#0f1f0f',
      '--color-surface': '#1a3a1a',
      '--color-text': '#dcfce7',
      '--color-purple': '#059669',
      '--color-orange': '#65a30d',
      '--color-green': '#10b981'
    }
  },
  sunset: {
    name: 'Coucher de soleil',
    emoji: '🌅',
    colors: {
      '--color-bg': '#1f1315',
      '--color-surface': '#3d1f24',
      '--color-text': '#fef2f2',
      '--color-purple': '#db2777',
      '--color-orange': '#f97316',
      '--color-green': '#eab308'
    }
  }
};

function applyTheme(themeId) {
  const theme = THEMES[themeId] || THEMES.default;
  const root = document.documentElement;

  Object.entries(theme.colors).forEach(([prop, value]) => {
    root.style.setProperty(prop, value);
  });
}
```

---

## 13. Audio Avancé par Événement

```javascript
// Étendre src/modules/audio.js
const DEFAULT_AUDIO_SETTINGS = {
  enabled: true,
  volume: 0.5,
  purpleBox: true,
  orangeBox: true,
  greenBox: true,
  sessionComplete: true,
  challengeComplete: true,
  badgeUnlocked: true,
  levelUp: true,
  streakBonus: true
};

const Audio = {
  // ... code existant ...

  /**
   * Joue un son selon le type et les settings
   * @param {string} type - Type de son
   */
  play(type) {
    const player = State.get('player');
    const settings = player?.settings?.audio || DEFAULT_AUDIO_SETTINGS;

    if (!settings.enabled) return;
    if (settings[type] === false) return;

    switch (type) {
      case 'purpleBox':
        this.playIncorrect();
        break;
      case 'orangeBox':
        this.playPartialCorrect();
        break;
      case 'greenBox':
        this.playCorrect();
        break;
      case 'sessionComplete':
        this.playSessionComplete();
        break;
      case 'badgeUnlocked':
        this.playBadgeUnlock();
        break;
      case 'levelUp':
        this.playLevelUp();
        break;
      case 'streakBonus':
        this.playStreakBonus(arguments[1]); // tier
        break;
    }
  },

  /**
   * Sons streak par palier
   */
  playStreakBonus(tier) {
    if (!this._context || !this._enabled) return;

    const melodies = {
      1: [523, 659, 784],           // Do Mi Sol
      2: [523, 659, 784, 1047],     // Do Mi Sol Do+
      3: [523, 659, 784, 1047, 1319], // + Mi+
      4: [523, 659, 784, 1047, 1319, 1568] // + Sol+
    };

    const notes = melodies[tier] || melodies[1];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this._playNote(freq, 0.2);
      }, i * 100);
    });
  }
};
```

---

## 14. Validation Damerau-Levenshtein

```javascript
// Dans src/modules/validator.js - Remplacer Levenshtein par Damerau-Levenshtein

/**
 * Calcule la distance Damerau-Levenshtein
 * Gère les transpositions (>80% des fautes de frappe humaines)
 * @param {string} a - Première chaîne
 * @param {string} b - Seconde chaîne
 * @returns {number} - Distance
 */
function damerauLevenshtein(a, b) {
  const lenA = a.length;
  const lenB = b.length;

  if (lenA === 0) return lenB;
  if (lenB === 0) return lenA;

  // Matrice de distances
  const d = Array(lenA + 1).fill(null).map(() => Array(lenB + 1).fill(0));

  for (let i = 0; i <= lenA; i++) d[i][0] = i;
  for (let j = 0; j <= lenB; j++) d[0][j] = j;

  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      d[i][j] = Math.min(
        d[i - 1][j] + 1,      // Suppression
        d[i][j - 1] + 1,      // Insertion
        d[i - 1][j - 1] + cost // Substitution
      );

      // Transposition (Damerau)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
      }
    }
  }

  return d[lenA][lenB];
}

/**
 * Calcule la similarité entre deux chaînes (0-1)
 * @param {string} a - Première chaîne
 * @param {string} b - Seconde chaîne
 * @returns {number} - Similarité (0 = différent, 1 = identique)
 */
function similarity(a, b) {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;

  const distance = damerauLevenshtein(a.toLowerCase(), b.toLowerCase());
  return 1 - (distance / maxLen);
}

// Export dans Validator
const Validator = {
  // ... code existant ...

  damerauLevenshtein,
  similarity,

  /**
   * Valide une réponse textuelle avec tolérance
   * @param {string} userAnswer - Réponse utilisateur
   * @param {string|string[]} correctAnswers - Réponse(s) correcte(s)
   * @param {number} threshold - Seuil de similarité (0-100, défaut 65)
   */
  validateFuzzyText(userAnswer, correctAnswers, threshold = 65) {
    const answers = Array.isArray(correctAnswers) ? correctAnswers : [correctAnswers];
    const normalizedUser = this.normalize(userAnswer);

    for (const answer of answers) {
      const normalizedCorrect = this.normalize(answer);
      const sim = this.similarity(normalizedUser, normalizedCorrect);

      if (sim * 100 >= threshold) {
        return {
          isCorrect: true,
          similarity: sim,
          matchedAnswer: answer
        };
      }
    }

    return {
      isCorrect: false,
      similarity: 0,
      matchedAnswer: null
    };
  }
};
```

---

## 15. Graphiques SVG

### 15.1 BarChart

```javascript
const Charts = {
  /**
   * Crée un graphique en barres
   * @param {Array} data - [{ label, value, color }]
   * @param {Object} options - { width, height, showValues, showLabels }
   */
  bar(data, { width = 300, height = 200, showValues = true, showLabels = true } = {}) {
    const padding = { top: 20, right: 20, bottom: 40, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxValue = Math.max(...data.map(d => d.value));
    const barWidth = chartWidth / data.length - 10;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('class', 'chart chart--bar');

    // Barres
    data.forEach((item, i) => {
      const barHeight = (item.value / maxValue) * chartHeight;
      const x = padding.left + i * (barWidth + 10) + 5;
      const y = padding.top + chartHeight - barHeight;

      // Barre
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', x);
      rect.setAttribute('y', y);
      rect.setAttribute('width', barWidth);
      rect.setAttribute('height', barHeight);
      rect.setAttribute('fill', item.color || 'var(--color-purple)');
      rect.setAttribute('rx', 4);
      svg.appendChild(rect);

      // Valeur
      if (showValues) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x + barWidth / 2);
        text.setAttribute('y', y - 5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '12');
        text.setAttribute('fill', 'var(--color-text)');
        text.textContent = item.value;
        svg.appendChild(text);
      }

      // Label
      if (showLabels) {
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', x + barWidth / 2);
        label.setAttribute('y', height - 10);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '11');
        label.setAttribute('fill', 'var(--color-text)');
        label.textContent = item.label;
        svg.appendChild(label);
      }
    });

    return svg;
  },

  /**
   * Crée un graphique circulaire (pie/donut)
   * @param {Array} data - [{ label, value, color }]
   * @param {Object} options - { size, donut, showLegend }
   */
  pie(data, { size = 200, donut = false, showLegend = true } = {}) {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    const radius = size / 2 - 10;
    const innerRadius = donut ? radius * 0.6 : 0;
    const center = size / 2;

    const container = document.createElement('div');
    container.className = 'chart-container';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('class', 'chart chart--pie');

    let currentAngle = -Math.PI / 2;

    data.forEach(item => {
      const sliceAngle = (item.value / total) * Math.PI * 2;
      const endAngle = currentAngle + sliceAngle;

      const x1 = center + radius * Math.cos(currentAngle);
      const y1 = center + radius * Math.sin(currentAngle);
      const x2 = center + radius * Math.cos(endAngle);
      const y2 = center + radius * Math.sin(endAngle);

      const largeArc = sliceAngle > Math.PI ? 1 : 0;

      let d;
      if (donut) {
        const ix1 = center + innerRadius * Math.cos(currentAngle);
        const iy1 = center + innerRadius * Math.sin(currentAngle);
        const ix2 = center + innerRadius * Math.cos(endAngle);
        const iy2 = center + innerRadius * Math.sin(endAngle);
        d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
      } else {
        d = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      }

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', item.color);
      svg.appendChild(path);

      currentAngle = endAngle;
    });

    container.appendChild(svg);

    // Légende
    if (showLegend) {
      const legend = document.createElement('div');
      legend.className = 'chart-legend';
      legend.innerHTML = data.map(item => `
        <div class="chart-legend__item">
          <span class="chart-legend__color" style="background: ${item.color}"></span>
          <span class="chart-legend__label">${item.label}</span>
          <span class="chart-legend__value">${Math.round(item.value / total * 100)}%</span>
        </div>
      `).join('');
      container.appendChild(legend);
    }

    return container;
  }
};
```

---

## 16. Scroll to Top

```javascript
// Composant simple à ajouter dans app.js
function initScrollToTop() {
  const button = document.createElement('button');
  button.id = 'scroll-to-top';
  button.innerHTML = '↑';
  button.setAttribute('aria-label', 'Retour en haut');
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--color-purple);
    color: white;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.3s, visibility 0.3s, transform 0.3s;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  `;

  document.body.appendChild(button);

  // Afficher/masquer selon le scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      button.style.opacity = '1';
      button.style.visibility = 'visible';
    } else {
      button.style.opacity = '0';
      button.style.visibility = 'hidden';
    }
  });

  // Action de scroll
  button.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Hover effect
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.1)';
  });
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
  });
}

// Appeler dans App.init()
```

---

## Annexe : Checklist d'Implémentation

Pour chaque fonctionnalité :

1. **[ ]** Créer/modifier le module JS
2. **[ ]** Ajouter les styles CSS
3. **[ ]** Mettre à jour le modèle Player si nécessaire
4. **[ ]** Ajouter dans la page Settings si c'est un paramètre
5. **[ ]** Écrire les tests unitaires
6. **[ ]** Tester en mode `file://`
7. **[ ]** Mettre à jour `build.manifest.json`
8. **[ ]** Rebuild `index.html`

---

*Guide créé le 2025-12-11 pour faciliter l'implémentation future des fonctionnalités.*
