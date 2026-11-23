# Vocabulaire Thématique Multilingue

> **Status** : Implémenté
> **Version** : 1.0.0

## Vue d'ensemble

Fonctionnalité permettant de créer des decks de vocabulaire multilingues avec traductions automatiques via Wikidata et audio via Lingua Libre, jouables dans plusieurs langues et modes.

## Différence avec le mode Dictée existant

| Aspect | Mode Dictée (existant) | Vocabulaire Multilingue |
|--------|------------------------|--------------------------|
| Source des mots | Utilisateur tape ses mots | Utilisateur tape ses mots |
| Traductions | Non (même langue) | Automatiques via Wikidata |
| Langues | Une seule | Multiples (FR, EN, ES, DE, IT, PT, NL) |
| Modes de jeu | Dictée uniquement | Traduction, Dictée, Image |
| Direction | Fixe | Configurable + Bidirectionnel |
| Choix langue | À la génération | Au moment de jouer |

## Interface de création

Accessible depuis la page "Générateur de Deck IA" via le bouton "🌍 Mode Multilingue".

### Étapes de création

1. **Nommer le deck** : Ex: "Fruits et légumes FR/EN/ES"
2. **Choisir la langue source** : Langue des mots que tu vas saisir
3. **Sélectionner les langues cibles** : Cocher les langues de traduction souhaitées
4. **Entrer la liste des mots** : Un mot par ligne
5. **Générer** : Récupère automatiquement les traductions et l'audio

### Processus de génération

Pour chaque mot :
1. Recherche de traductions via l'API Wikidata
2. Téléchargement de l'audio via Lingua Libre (si disponible)
3. Construction du deck avec progression Leitner par direction

### Résultat

Affiche un résumé avec :
- Nombre de mots traités
- Nombre de langues incluses
- Traductions complètes vs partielles
- Mots avec audio

Options :
- **Sauvegarder** : Enregistre le deck localement
- **Exporter YAML** : Télécharge le fichier pour partage/backup

## Structure de données

### Deck Multilingue

```javascript
{
  id: "theme-legumes-abc123",
  name: "Légumes",
  type: "multilingual",           // Nouveau type !
  source: "lingualibre",
  sourceList: "List:Fra/Légumes",
  description: "Vocabulaire des légumes",

  // Langues disponibles dans ce deck
  languages: ["fr", "en", "es"],

  // Mots avec traductions
  words: [
    {
      id: "carrot",
      image: "data:image/...",    // Optionnel, base64
      translations: {
        fr: {
          text: "carotte",        // Transcription P5 exacte
          audio: "data:audio/...", // Base64
          alternatives: ["la carotte"]
        },
        en: {
          text: "carrot",
          audio: "data:audio/...",
          alternatives: ["a carrot", "the carrot"]
        },
        es: {
          text: "zanahoria",
          audio: "data:audio/...",
          alternatives: ["la zanahoria"]
        }
      },
      // Progression Leitner par direction
      progress: {
        "fr→en": {
          box: "never_played",
          latencyThreshold: null,
          restUntil: null,
          restDays: 0,
          timesPlayed: 0,
          timesCorrect: 0
        },
        "en→fr": { ... },
        "fr→es": { ... },
        "es→fr": { ... },
        "image→fr": { ... },
        "image→en": { ... }
      }
    }
  ],

  settings: {
    // Pas de bidirectional ici, c'est choisi au moment de jouer
  },

  createdAt: "2025-12-06T...",
  updatedAt: "2025-12-06T..."
}
```

### Configuration de session de jeu

```javascript
{
  deckId: "theme-legumes-abc123",
  mode: "translation" | "dictation" | "image",

  // Pour modes translation et dictation
  sourceLang: "fr",
  targetLang: "en",
  bidirectional: false,

  // Pour mode image (pas de sourceLang ni bidirectional)
  // targetLang: "fr"
}
```

## Modes de jeu

### 1. Mode Traduction

```
┌────────────────────────────────┐
│  FR → EN                       │
│                                │
│       « carotte »              │
│                                │
│  Réponse: [_______________]    │
│                                │
│  Réponse attendue: "carrot"    │
└────────────────────────────────┘
```

- **Question** : Texte dans langue source
- **Réponse** : Texte dans langue cible
- **Validation** : Insensible à la casse, accepte alternatives

### 2. Mode Dictée Audio

```
┌────────────────────────────────┐
│  Dictée FR                     │
│                                │
│       🔊 [▶ Écouter]           │
│                                │
│  Réponse: [_______________]    │
│                                │
│  Réponse attendue: "carotte"   │
└────────────────────────────────┘
```

- **Question** : Audio dans langue source
- **Réponse** : Texte (même langue ou langue cible)
- **Validation** : Transcription P5 exacte, insensible à la casse

### 3. Mode Image

```
┌────────────────────────────────┐
│  Image → FR                    │
│                                │
│       🥕 [image carotte]       │
│                                │
│  Réponse: [_______________]    │
│                                │
│  Réponse attendue: "carotte"   │
└────────────────────────────────┘
```

- **Question** : Image (pas de langue)
- **Réponse** : Texte dans langue cible
- **Pas de bidirectionnel** (l'image n'a pas de langue)

## Mode Bidirectionnel

Quand activé (modes Traduction et Dictée uniquement) :

- Chaque carte peut être FR→EN ou EN→FR (aléatoire)
- L'indicateur de direction est affiché clairement
- Chaque direction a sa propre progression Leitner

```
Carte 1: FR→EN  "carotte" → ? (réponse: carrot)
Carte 2: EN→FR  "bean" → ? (réponse: haricot)
Carte 3: FR→EN  "poivron" → ? (réponse: pepper)
```

## Clés de progression Leitner

Format : `{source}→{target}`

| Mode | Clé exemple | Description |
|------|-------------|-------------|
| Traduction FR→EN | `fr→en` | Traduire du français vers anglais |
| Traduction EN→FR | `en→fr` | Traduire de l'anglais vers français |
| Dictée FR | `audio:fr→fr` | Écouter FR, écrire FR |
| Dictée FR→EN | `audio:fr→en` | Écouter FR, écrire EN |
| Image→FR | `image→fr` | Voir image, écrire FR |
| Image→EN | `image→en` | Voir image, écrire EN |

## Interface utilisateur

### Écran de sélection avant jeu

```
┌─────────────────────────────────────────────┐
│  📚 Légumes                                 │
│  Langues: 🇫🇷 🇬🇧 🇪🇸                          │
│  42 mots                                    │
├─────────────────────────────────────────────┤
│                                             │
│  Mode de jeu:                               │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ 📝      │ │ 🔊      │ │ 🖼️      │       │
│  │ Traduc. │ │ Dictée  │ │ Image   │       │
│  └─────────┘ └─────────┘ └─────────┘       │
│       ●           ○           ○             │
│                                             │
├─────────────────────────────────────────────┤
│  Langue question: [ Français      ▼]        │
│  Langue réponse:  [ English       ▼]        │
│                                             │
│  ☐ Mode bidirectionnel (aléatoire)          │
│                                             │
├─────────────────────────────────────────────┤
│  📊 Progression FR→EN:                      │
│  ████████░░ 23/42 maîtrisés                 │
│                                             │
│           [ ▶ Commencer ]                   │
└─────────────────────────────────────────────┘
```

### Écran de jeu (mode Traduction)

```
┌─────────────────────────────────────────────┐
│  ← Retour          3/42          FR → EN    │
├─────────────────────────────────────────────┤
│                                             │
│              « carotte »                    │
│                                             │
│     ┌─────────────────────────────────┐     │
│     │                                 │     │
│     └─────────────────────────────────┘     │
│                                             │
│              [ Valider ]                    │
│                                             │
└─────────────────────────────────────────────┘
```

## API Lingua Libre

### Récupérer les listes thématiques

```javascript
// GET https://lingualibre.org/api.php?action=query&list=allpages&apprefix=List:Fra/&apnamespace=0

// Retourne: List:Fra/Légumes, List:Fra/Pays, List:Fra/Animaux, ...
```

### Récupérer les mots d'une liste + audio + transcription

```sparql
SELECT ?word ?transcription ?audio WHERE {
  # Mots de la liste "Légumes" en français
  ?record prop:P5 ?transcription .  # Transcription exacte (P5)
  ?record prop:P7 ?audio .          # Fichier audio
  ?record prop:P4 ?lang .
  ?lang wdt:P1 wd:Q150 .            # Français
  # Filtrer par liste/catégorie...
}
```

## Validation des réponses

```javascript
function validateAnswer(userAnswer, expectedAnswer, alternatives = []) {
  const normalize = (s) => s.trim().toLowerCase();

  const expected = normalize(expectedAnswer);
  const user = normalize(userAnswer);

  // Correspondance exacte
  if (user === expected) return true;

  // Alternatives
  for (const alt of alternatives) {
    if (user === normalize(alt)) return true;
  }

  return false;
}
```

## Stratégie de tests

### Tests unitaires critiques

#### 1. Génération de clés de progression

```javascript
describe('getProgressKey', () => {
  it('should generate translation key', () => {
    expect(getProgressKey('translation', 'fr', 'en')).toBe('fr→en');
  });

  it('should generate dictation key with audio prefix', () => {
    expect(getProgressKey('dictation', 'fr', 'fr')).toBe('audio:fr→fr');
    expect(getProgressKey('dictation', 'fr', 'en')).toBe('audio:fr→en');
  });

  it('should generate image key without source', () => {
    expect(getProgressKey('image', null, 'fr')).toBe('image→fr');
  });
});
```

#### 2. Sélection de cartes en mode bidirectionnel

```javascript
describe('getCardsForSession bidirectional', () => {
  it('should include both directions', () => {
    const cards = getCardsForSession(deck, {
      bidirectional: true,
      langs: ['fr', 'en']
    });

    const directions = cards.map(c => c.direction);
    expect(directions).toContain('fr→en');
    expect(directions).toContain('en→fr');
  });

  it('should respect Leitner rest periods per direction', () => {
    // fr→en is resting, en→fr is playable
    const word = {
      progress: {
        'fr→en': { box: 'green', restUntil: '2099-01-01' },
        'en→fr': { box: 'orange', restUntil: null }
      }
    };

    const cards = getCardsForSession(deck, { bidirectional: true });
    expect(cards.find(c => c.direction === 'fr→en')).toBeUndefined();
    expect(cards.find(c => c.direction === 'en→fr')).toBeDefined();
  });
});
```

#### 3. Validation des réponses multilingues

```javascript
describe('validateMultilingualAnswer', () => {
  it('should be case insensitive', () => {
    expect(validate('Carrot', 'carrot')).toBe(true);
    expect(validate('CAROTTE', 'carotte')).toBe(true);
  });

  it('should accept alternatives', () => {
    expect(validate('the carrot', 'carrot', ['the carrot', 'a carrot'])).toBe(true);
  });

  it('should use P5 transcription exactly', () => {
    expect(validate('famille', 'la famille')).toBe(false);
    expect(validate('la famille', 'la famille')).toBe(true);
  });
});
```

#### 4. Mode image sans bidirectionnel

```javascript
describe('image mode', () => {
  it('should not allow bidirectional option', () => {
    const config = createSessionConfig(deck, {
      mode: 'image',
      bidirectional: true
    });

    expect(config.bidirectional).toBe(false); // Forcé à false
  });

  it('should not require source language', () => {
    const config = createSessionConfig(deck, {
      mode: 'image',
      targetLang: 'fr'
    });

    expect(config.sourceLang).toBeUndefined();
  });
});
```

#### 5. Mise à jour progression Leitner par direction

```javascript
describe('updateWordProgress', () => {
  it('should update only the played direction', () => {
    const word = createTestWord();

    updateProgress(word, 'fr→en', { isCorrect: true, timeMs: 1000 });

    expect(word.progress['fr→en'].box).toBe('green');
    expect(word.progress['en→fr'].box).toBe('never_played'); // Inchangé
  });

  it('should track each direction independently', () => {
    const word = createTestWord();

    // Jouer fr→en 10 fois = maîtrisé
    for (let i = 0; i < 10; i++) {
      updateProgress(word, 'fr→en', { isCorrect: true, timeMs: 500 });
    }

    // en→fr toujours never_played
    expect(word.progress['fr→en'].timesPlayed).toBe(10);
    expect(word.progress['en→fr'].timesPlayed).toBe(0);
  });
});
```

### Tests d'intégration

```javascript
describe('Multilingual Vocabulary E2E', () => {
  it('should generate deck from Lingua Libre theme', async () => {
    const deck = await generateFromTheme('List:Fra/Légumes', ['fr', 'en']);

    expect(deck.type).toBe('multilingual');
    expect(deck.languages).toContain('fr');
    expect(deck.languages).toContain('en');
    expect(deck.words.length).toBeGreaterThan(0);
    expect(deck.words[0].translations.fr.text).toBeDefined();
  });

  it('should play full session in translation mode', () => {
    // Simuler une session complète
  });

  it('should save and restore progress correctly', () => {
    // Vérifier persistance localStorage
  });
});
```

### Matrice de tests combinatoires

| Mode | Direction | Bidirectionnel | Test |
|------|-----------|----------------|------|
| Traduction | FR→EN | Non | ✓ |
| Traduction | EN→FR | Non | ✓ |
| Traduction | FR↔EN | Oui | ✓ |
| Dictée | FR→FR | Non | ✓ |
| Dictée | FR→EN | Non | ✓ |
| Dictée | FR↔EN | Oui | ✓ |
| Image | →FR | N/A | ✓ |
| Image | →EN | N/A | ✓ |

## Plan d'implémentation

### Phase 1 : Structure de données
- [ ] Créer type `multilingual` pour les decks
- [ ] Structure `word.progress` par direction
- [ ] Helpers pour générer clés de progression

### Phase 2 : Génération de deck
- [ ] API pour lister thèmes Lingua Libre
- [ ] Récupérer mots + transcription P5 + audio
- [ ] Récupérer traductions via Wikidata
- [ ] UI sélection de thème

### Phase 3 : Configuration de jeu
- [ ] Écran de sélection mode/langues/direction
- [ ] Validation config selon mode (image sans bidi)
- [ ] Affichage progression par direction

### Phase 4 : Moteur de jeu
- [ ] Adapter page-game.js pour mode multilingue
- [ ] Afficher indicateur de direction
- [ ] Validation avec alternatives
- [ ] Mise à jour progression par direction

### Phase 5 : Tests
- [ ] Tests unitaires (voir ci-dessus)
- [ ] Tests d'intégration
- [ ] Tests manuels matrice combinatoire

---

**Dernière mise à jour** : 2025-12-12
