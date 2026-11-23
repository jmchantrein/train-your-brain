# Système de Gestion d'Erreurs - Train Your Brain

> **Version** : 1.0.0
> **Module** : `src/modules/error-handler.js`
> **Tests** : `tests/error-handler.test.js`, `tests/error-handler-csp.test.js`
> **Dépendance** : `TextUtils` (`src/modules/text-utils.js`) est chargé avant `error-handler.js` : l'affichage échappe tout texte par `TextUtils.escapeHtml`. Aucun gestionnaire en ligne (`onclick`) : les boutons sont reliés par `addEventListener` (attributs `data-error-action`), car la CSP du build les refuse.
> **Styles** : `src/styles/main.css` (section ERROR HANDLING)

---

## Vue d'Ensemble

Le système de gestion d'erreurs fournit une approche centralisée et user-friendly pour capturer, logger et afficher les erreurs dans l'application Train Your Brain.

### Caractéristiques

- ✅ Capture automatique des erreurs globales (window.onerror, unhandledrejection)
- ✅ Messages user-friendly avec actions suggérées
- ✅ Affichage contextuel (toasts pour warnings, modals pour erreurs critiques)
- ✅ Historique interne des erreurs (`_errorHistory`, sans accesseur public)
- ✅ Wrappers sécurisés pour fonctions synchrones et pages
- ✅ Gestion spéciale des erreurs localStorage

---

## Initialisation

Le module ErrorHandler est initialisé automatiquement au démarrage de l'application dans `app.js` :

```javascript
ErrorHandler.init({
  enableLogging: true,        // Activer les logs console (défaut: true)
  enableGlobalHandlers: true, // Capturer les erreurs globales (défaut: true)
  showToastDuration: 5000,    // Durée d'affichage des toasts en ms (défaut: 5000)
  maxLogHistory: 50           // Nombre max d'erreurs en historique (défaut: 50)
});
```

---

## Utilisation

### 1. Gestion Manuelle d'Erreurs

```javascript
try {
  // Code potentiellement dangereux
  riskyOperation();
} catch (error) {
  ErrorHandler.handleError(error, {
    source: 'my_function',
    userId: player.id,
    customContext: 'any data'
  });
}
```

### 2. Wrappers Sécurisés

#### Pour fonctions synchrones

```javascript
const result = ErrorHandler.safe(() => {
  return dangerousFunction();
}, { source: 'dangerous_operation' });

// result === null si erreur
// result === valeur retournée si succès
```

#### Pour montage de pages

```javascript
// Automatique dans app.js via _showPage
ErrorHandler.safeMountPage(
  'pageName',
  page.mount.bind(page),
  container,
  state,
  params
);
```

### 3. Affichage de Messages

#### Toast (erreurs non-critiques)

```javascript
ErrorHandler.showErrorToast(
  'Avertissement',
  'Cette opération a échoué, veuillez réessayer.',
  'warning' // ou 'error'
);
```

#### Modal (erreurs critiques)

```javascript
ErrorHandler.showErrorModal(
  'Erreur Critique',
  'L\'application ne peut pas continuer.',
  [
    'Rechargez la page',
    'Vérifiez votre connexion',
    'Contactez le support'
  ]
);
```

### 4. Utilitaires localStorage

```javascript
// Tester l'accès localStorage
if (!ErrorHandler.testLocalStorageAccess()) {
  console.error('localStorage not accessible');
}
```

L'usage du quota est surveillé par `Storage` (`onQuotaWarning` / `onQuotaError`), qui prévient le joueur une fois par session : voir `docs/ARCHITECTURE.md`, « Copies de secours et récupération ».

---

## Types d'Erreurs

Le module identifie automatiquement plusieurs types d'erreurs et adapte les messages :

| Type | Détection | Sévérité | Affichage |
|------|-----------|----------|-----------|
| `STORAGE_QUOTA` | QuotaExceededError | Critical | Modal |
| `STORAGE_CORRUPTED` | Parse errors, corrupt data | Warning | Toast |
| `STORAGE_ACCESS` | localStorage non disponible | Critical | Modal |
| `PAGE_MOUNT` | Erreur lors du montage d'une page | Error | Toast + Page erreur |
| `GENERIC` | Toutes autres erreurs | Error | Toast |

---

## Structure d'une Erreur Enrichie

Quand une erreur est traitée, elle est enrichie avec :

```javascript
{
  timestamp: "2025-12-05T10:30:00.000Z",
  error: Error,              // Objet Error original
  message: "Error message",
  stack: "Error stack trace",
  type: "STORAGE_QUOTA",     // Type identifié
  context: {                  // Contexte fourni
    source: "save_data",
    userId: "player_123"
  },
  userMessage: {              // Message user-friendly
    type: "storage_quota",
    title: "Espace de stockage insuffisant",
    message: "L'application ne peut plus sauvegarder...",
    userActions: [
      "Supprimez des decks...",
      "Exportez vos données..."
    ],
    severity: "critical"
  }
}
```

---

## Messages User-Friendly

### STORAGE_QUOTA

**Titre** : Espace de stockage insuffisant

**Message** : L'application ne peut plus sauvegarder vos données car l'espace de stockage est plein.

**Actions** :
- Supprimez des decks personnalisés que vous n'utilisez plus
- Exportez vos données et réinitialisez l'application
- Libérez de l'espace dans votre navigateur

### STORAGE_CORRUPTED

**Titre** : Données corrompues

**Message** : Certaines données sauvegardées semblent corrompues.

**Actions** :
- Rechargez la page pour réessayer
- Si le problème persiste, importez une sauvegarde récente
- En dernier recours, réinitialisez vos données

### STORAGE_ACCESS

**Titre** : Accès au stockage impossible

**Message** : L'application ne peut pas accéder au stockage local. Vos données ne seront pas sauvegardées.

**Actions** :
- Vérifiez que votre navigateur autorise le stockage local
- Désactivez le mode navigation privée
- Vérifiez les paramètres de sécurité de votre navigateur

### PAGE_MOUNT

**Titre** : Erreur de chargement

**Message** : La page n'a pas pu se charger correctement.

**Actions** :
- Rechargez la page
- Retournez à l'accueil
- Si le problème persiste, signalez le bug

---

## Styles CSS

Les styles pour les toasts et modaux sont définis dans `src/styles/main.css` :

### Classes Principales

- `.error-toast-container` : Container fixe pour les toasts
- `.error-toast` : Toast individuel
- `.error-toast--error` : Toast d'erreur (bordure rouge)
- `.error-toast--warning` : Toast d'avertissement (bordure jaune)
- `.error-modal-overlay` : Overlay du modal
- `.error-modal` : Modal d'erreur
- `.error-page` : Page d'erreur de fallback

### Animations

- `slideInRight` : Entrée des toasts depuis la droite
- `slideOutRight` : Sortie des toasts vers la droite
- `fadeIn` : Apparition du modal
- `scaleIn` : Zoom du contenu du modal

---

## Intégration dans App.js

Le système est intégré à plusieurs niveaux dans `app.js` :

### 1. Initialisation

```javascript
App.init() {
  // Initialiser ErrorHandler en premier
  ErrorHandler.init({ ... });

  // Vérifier l'accès localStorage
  if (!ErrorHandler.testLocalStorageAccess()) {
    ErrorHandler.handleError(...);
  }

  // ... reste de l'initialisation
}
```

### 2. Chargement Sécurisé des Données

```javascript
_safeLoadPlayer() {
  return ErrorHandler.safe(() => {
    return Storage.loadPlayer();
  }, { source: 'load_player' });
}

_safeLoadDecks() {
  const result = ErrorHandler.safe(() => {
    return this._loadDecks();
  }, { source: 'load_decks' });
  return result || [];
}
```

### 3. Montage Sécurisé des Pages

```javascript
_showPage(pageName, params) {
  // ... vérifications ...

  ErrorHandler.safeMountPage(
    pageName,
    page.mount.bind(page),
    container,
    state,
    params
  );
}
```

---

## Tests

Les tests sont disponibles dans `tests/error-handler.test.js` :

### Couverture

- ✅ Configuration et initialisation
- ✅ Identification des types d'erreurs
- ✅ Gestion des erreurs (Error objects, strings)
- ✅ Historique interne des erreurs
- ✅ Wrappers sécurisés (sync, pages)
- ✅ Affichage UI (toasts, modals)
- ✅ Utilitaires localStorage
- ✅ Échappement HTML (sécurité XSS)

### Exécution

Lancer `TEST_FILTER=error-handler npm test` (ou `npm test` pour tous les tests).

---

## Bonnes Pratiques

### ✅ À Faire

1. **Toujours fournir un contexte** lors de l'appel à `handleError()` :
   ```javascript
   ErrorHandler.handleError(error, {
     source: 'fonction_appelante',
     userId: player.id,
     deckId: deck.id
   });
   ```

2. **Utiliser les wrappers sécurisés** pour les opérations à risque :
   ```javascript
   const data = ErrorHandler.safe(() => parseJSON(input));
   ```

3. **Tester l'accès localStorage** avant les opérations critiques :
   ```javascript
   if (!ErrorHandler.testLocalStorageAccess()) {
     // Gérer l'impossibilité de sauvegarder
   }
   ```

4. **Le quota est surveillé par `Storage`** : un message unique par session prévient le joueur quand le stockage est presque plein ou dépassé.

### ❌ À Éviter

1. **Ne pas swallower les erreurs** sans les logger :
   ```javascript
   // ❌ MAUVAIS
   try {
     riskyOp();
   } catch (e) {
     // Silence...
   }

   // ✅ BON
   try {
     riskyOp();
   } catch (e) {
     ErrorHandler.handleError(e, { source: 'riskyOp' });
   }
   ```

2. **Ne pas afficher trop de toasts** en même temps :
   ```javascript
   // ❌ MAUVAIS : spam de toasts
   errors.forEach(e => ErrorHandler.showErrorToast(...));

   // ✅ BON : grouper les erreurs
   ErrorHandler.showErrorToast('Erreurs multiples', `${errors.length} erreurs`);
   ```

3. **Ne pas utiliser de HTML non-échappé** :
   ```javascript
   // ❌ MAUVAIS : XSS possible
   container.innerHTML = errorMessage;

   // ✅ BON : les méthodes d'affichage échappent via TextUtils.escapeHtml
   ErrorHandler.showErrorToast(title, message);
   ```

---

## Dépannage

### Les erreurs ne sont pas capturées

Vérifier que :
1. ErrorHandler est initialisé avec `enableGlobalHandlers: true`
2. Le module est chargé avant les autres dans `build.manifest.json`
3. Les handlers globaux ne sont pas désactivés par un autre code

### Les toasts ne s'affichent pas

Vérifier que :
1. Les styles CSS sont chargés (`main.css`)
2. Pas de conflits de z-index avec d'autres éléments
3. Le container `.error-toast-container` est bien créé dans le DOM

### Les modals ne se ferment pas

Vérifier que :
1. `ErrorHandler.closeModal(modalId)` est appelé avec le bon ID
2. L'event listener sur le bouton "Fermer" est bien configuré
3. Pas d'erreurs JavaScript qui empêchent l'exécution

### localStorage non accessible

Causes possibles :
1. Mode navigation privée activé
2. Cookies/Storage désactivés dans les paramètres du navigateur
3. Quota dépassé (5-10 MB selon navigateurs)
4. Extension de navigateur qui bloque l'accès

---

## Évolutions Futures

### Fonctionnalités Potentielles

- [ ] Export automatique des erreurs vers fichier JSON
- [ ] Intégration avec service de monitoring externe (Sentry, etc.)
- [ ] Graphiques de tendance des erreurs
- [ ] Détection des erreurs récurrentes
- [ ] Suggestions de corrections automatiques
- [ ] Mode offline pour queue d'erreurs
- [ ] Filtrage par sévérité/type dans l'historique
- [ ] Notification push pour erreurs critiques

---

## Références

- **Module source** : `/src/modules/error-handler.js`
- **Tests** : `/tests/error-handler.test.js`
- **Styles** : `/src/styles/main.css` (section ERROR HANDLING)
- **Intégration** : `/src/ui/app.js`
- **Manifest** : `/build.manifest.json`

---

**Dernière mise à jour** : 2026-11-22
