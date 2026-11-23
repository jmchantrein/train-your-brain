# Taxonomie DeckHub - Internationalisation

> **Statut** : ⚠️ NON IMPLÉMENTÉ - Spécification pour implémentation future
> **Langue de référence** : Anglais (système)
> **Dernière mise à jour** : 2025-12-12

---

## Principe

La taxonomie utilise l'anglais comme langue système. Chaque tag possède :
- `id` : Identifiant unique en anglais (snake_case)
- `icon` : Emoji représentatif
- `parents` : Tags parents (support multi-parents)
- `translations` : Traductions dans toutes les langues supportées

### Exemple

```yaml
mathematics:
  icon: "🔢"
  parents: []
  translations:
    en: Mathematics
    fr: Mathématiques
    es: Matemáticas
    de: Mathematik
```

---

## Fichier taxonomy.yaml (structure)

```yaml
version: 1
default_language: en
supported_languages:
  - en
  - fr
  - es
  - de

# ═══════════════════════════════════════════════════════════════
# RACINES PRINCIPALES - MATIÈRES
# ═══════════════════════════════════════════════════════════════

categories:

  # --- MATHEMATICS ---
  mathematics:
    icon: "🔢"
    group: subjects
    parents: []
    translations:
      en: Mathematics
      fr: Mathématiques
      es: Matemáticas
      de: Mathematik

  arithmetic:
    icon: "➕"
    group: subjects
    parents: [mathematics]
    translations:
      en: Arithmetic
      fr: Arithmétique
      es: Aritmética
      de: Arithmetik

  basic_operations:
    icon: "✖️"
    group: subjects
    parents: [arithmetic]
    translations:
      en: Basic operations
      fr: Opérations de base
      es: Operaciones básicas
      de: Grundrechenarten

  additions:
    icon: "➕"
    group: subjects
    parents: [basic_operations]
    translations:
      en: Additions
      fr: Additions
      es: Sumas
      de: Additionen

  subtractions:
    icon: "➖"
    group: subjects
    parents: [basic_operations]
    translations:
      en: Subtractions
      fr: Soustractions
      es: Restas
      de: Subtraktionen

  multiplications:
    icon: "✖️"
    group: subjects
    parents: [basic_operations]
    translations:
      en: Multiplications
      fr: Multiplications
      es: Multiplicaciones
      de: Multiplikationen

  divisions:
    icon: "➗"
    group: subjects
    parents: [basic_operations]
    translations:
      en: Divisions
      fr: Divisions
      es: Divisiones
      de: Divisionen

  fractions:
    icon: "½"
    group: subjects
    parents: [arithmetic]
    translations:
      en: Fractions
      fr: Fractions
      es: Fracciones
      de: Brüche

  algebra:
    icon: "𝑥"
    group: subjects
    parents: [mathematics]
    translations:
      en: Algebra
      fr: Algèbre
      es: Álgebra
      de: Algebra

  geometry:
    icon: "📐"
    group: subjects
    parents: [mathematics]
    translations:
      en: Geometry
      fr: Géométrie
      es: Geometría
      de: Geometrie

  # --- COMPUTER SCIENCE ---
  computer_science:
    icon: "💻"
    group: subjects
    parents: []
    translations:
      en: Computer Science
      fr: Informatique
      es: Informática
      de: Informatik

  programming:
    icon: "👨‍💻"
    group: subjects
    parents: [computer_science]
    translations:
      en: Programming
      fr: Programmation
      es: Programación
      de: Programmierung

  algorithms:
    icon: "🔄"
    group: subjects
    parents: [computer_science]
    translations:
      en: Algorithms
      fr: Algorithmique
      es: Algorítmica
      de: Algorithmen

  # --- SCIENCES ---
  sciences:
    icon: "🔬"
    group: subjects
    parents: []
    translations:
      en: Sciences
      fr: Sciences
      es: Ciencias
      de: Wissenschaften

  physics:
    icon: "⚛️"
    group: subjects
    parents: [sciences]
    translations:
      en: Physics
      fr: Physique
      es: Física
      de: Physik

  chemistry:
    icon: "🧪"
    group: subjects
    parents: [sciences]
    translations:
      en: Chemistry
      fr: Chimie
      es: Química
      de: Chemie

  biology:
    icon: "🧬"
    group: subjects
    parents: [sciences]
    translations:
      en: Biology
      fr: Biologie
      es: Biología
      de: Biologie

  # --- HUMANITIES ---
  humanities:
    icon: "🏛️"
    group: subjects
    parents: []
    translations:
      en: Humanities
      fr: Sciences humaines
      es: Humanidades
      de: Geisteswissenschaften

  history:
    icon: "📜"
    group: subjects
    parents: [humanities]
    translations:
      en: History
      fr: Histoire
      es: Historia
      de: Geschichte

  geography:
    icon: "🗺️"
    group: subjects
    parents: [humanities]
    translations:
      en: Geography
      fr: Géographie
      es: Geografía
      de: Geografie

  philosophy:
    icon: "🤔"
    group: subjects
    parents: [humanities]
    translations:
      en: Philosophy
      fr: Philosophie
      es: Filosofía
      de: Philosophie

  # --- LANGUAGES ---
  languages:
    icon: "🗣️"
    group: subjects
    parents: []
    translations:
      en: Languages
      fr: Langues
      es: Idiomas
      de: Sprachen

  english:
    icon: "🇬🇧"
    group: subjects
    parents: [languages]
    translations:
      en: English
      fr: Anglais
      es: Inglés
      de: Englisch

  french:
    icon: "🇫🇷"
    group: subjects
    parents: [languages]
    translations:
      en: French
      fr: Français
      es: Francés
      de: Französisch

  spanish:
    icon: "🇪🇸"
    group: subjects
    parents: [languages]
    translations:
      en: Spanish
      fr: Espagnol
      es: Español
      de: Spanisch

  german:
    icon: "🇩🇪"
    group: subjects
    parents: [languages]
    translations:
      en: German
      fr: Allemand
      es: Alemán
      de: Deutsch

  # --- ARTS ---
  arts:
    icon: "🎨"
    group: subjects
    parents: []
    translations:
      en: Arts
      fr: Arts
      es: Artes
      de: Kunst

  music:
    icon: "🎵"
    group: subjects
    parents: [arts]
    translations:
      en: Music
      fr: Musique
      es: Música
      de: Musik

# ═══════════════════════════════════════════════════════════════
# NIVEAUX SCOLAIRES
# ═══════════════════════════════════════════════════════════════

  kindergarten:
    icon: "👶"
    group: levels
    parents: []
    translations:
      en: Kindergarten
      fr: Maternelle
      es: Preescolar
      de: Kindergarten

  elementary:
    icon: "🎒"
    group: levels
    parents: []
    translations:
      en: Elementary
      fr: Primaire
      es: Primaria
      de: Grundschule

  middle_school:
    icon: "🏫"
    group: levels
    parents: []
    translations:
      en: Middle School
      fr: Collège
      es: Secundaria
      de: Mittelstufe

  high_school:
    icon: "🎓"
    group: levels
    parents: []
    translations:
      en: High School
      fr: Lycée
      es: Bachillerato
      de: Oberstufe

  higher_education:
    icon: "🎓"
    group: levels
    parents: []
    translations:
      en: Higher Education
      fr: Supérieur
      es: Universidad
      de: Hochschule

# ═══════════════════════════════════════════════════════════════
# DIFFICULTÉ
# ═══════════════════════════════════════════════════════════════

  beginner:
    icon: "🌱"
    group: difficulty
    parents: []
    translations:
      en: Beginner
      fr: Débutant
      es: Principiante
      de: Anfänger

  intermediate:
    icon: "📈"
    group: difficulty
    parents: []
    translations:
      en: Intermediate
      fr: Intermédiaire
      es: Intermedio
      de: Mittelstufe

  advanced:
    icon: "🚀"
    group: difficulty
    parents: []
    translations:
      en: Advanced
      fr: Avancé
      es: Avanzado
      de: Fortgeschritten

  expert:
    icon: "🏆"
    group: difficulty
    parents: []
    translations:
      en: Expert
      fr: Expert
      es: Experto
      de: Experte

# ═══════════════════════════════════════════════════════════════
# TYPES D'APPRENTISSAGE
# ═══════════════════════════════════════════════════════════════

  memorization:
    icon: "🧠"
    group: type
    parents: []
    translations:
      en: Memorization
      fr: Mémorisation
      es: Memorización
      de: Auswendiglernen

  comprehension:
    icon: "💡"
    group: type
    parents: []
    translations:
      en: Comprehension
      fr: Compréhension
      es: Comprensión
      de: Verständnis

  practice:
    icon: "💪"
    group: type
    parents: []
    translations:
      en: Practice
      fr: Entraînement
      es: Práctica
      de: Übung

  review:
    icon: "🔄"
    group: type
    parents: []
    translations:
      en: Review
      fr: Révision
      es: Repaso
      de: Wiederholung

  exam:
    icon: "📝"
    group: type
    parents: []
    translations:
      en: Exam
      fr: Examen
      es: Examen
      de: Prüfung
```

---

## Utilisation dans l'app

### Mapping tag système → locale

```javascript
// Dans src/modules/tags.js (futur)
const Tags = {
  // Taxonomie chargée depuis taxonomy.yaml
  _taxonomy: null,

  /**
   * Traduit un tag système vers une locale
   * @param {string} tagId - ID système (ex: "mathematics")
   * @param {string} locale - Locale cible (ex: "fr")
   * @returns {string} - Label traduit
   */
  translate(tagId, locale = 'fr') {
    const tag = this._taxonomy[tagId];
    if (!tag) return tagId;
    return tag.translations[locale] || tag.translations['en'] || tagId;
  },

  /**
   * Trouve un tag à partir d'un texte dans n'importe quelle langue
   * @param {string} text - Texte de recherche (ex: "Mathématiques")
   * @returns {string|null} - ID système ou null
   */
  findByText(text) {
    const normalized = text.toLowerCase().trim();

    for (const [tagId, tag] of Object.entries(this._taxonomy)) {
      for (const [, translation] of Object.entries(tag.translations)) {
        if (translation.toLowerCase() === normalized) {
          return tagId;
        }
      }
    }
    return null;
  },

  /**
   * Traduit un chemin de tags
   * @param {string} path - Ex: "mathematics/arithmetic/additions"
   * @param {string} locale - Locale cible
   * @returns {string} - Ex: "Mathématiques / Arithmétique / Additions"
   */
  translatePath(path, locale = 'fr') {
    return path
      .split('/')
      .map(tagId => this.translate(tagId, locale))
      .join(' / ');
  }
};
```

### Dans l'UI

```javascript
// Affichage d'un tag
function renderTag(tagId, locale = 'fr') {
  const tag = Tags.getById(tagId);
  const label = Tags.translate(tagId, locale);

  return `
    <span class="tag" data-tag="${tagId}">
      ${tag?.icon || ''} ${escapeHtml(label)}
    </span>
  `;
}
```

---

## Migration depuis la taxonomie actuelle

La taxonomie actuelle dans `src/modules/tags.js` utilise des IDs en français. Pour migrer :

1. **Mapping existant** : Créer une table de correspondance `fr_id → en_id`
2. **Migration des decks** : Script pour convertir les tags
3. **Rétrocompatibilité** : Supporter les anciens IDs pendant une période

```javascript
// Mapping fr → en (partiel)
const LEGACY_MAPPING = {
  'maths': 'mathematics',
  'arithmetique': 'arithmetic',
  'additions': 'additions',
  'algebre': 'algebra',
  'informatique': 'computer_science',
  'programmation': 'programming',
  // ... etc
};
```

---

## Extension de la taxonomie

Pour ajouter un nouveau tag :

1. **Créer une PR** sur le repo deckhub-community
2. **Ajouter l'entrée** dans `taxonomy.yaml` avec toutes les traductions
3. **Review** par un modérateur
4. **Merge** → Le tag est disponible

---

## Notes importantes

- Les tags système sont **immuables** une fois publiés (pas de renommage)
- Les traductions peuvent être ajoutées/corrigées à tout moment
- Un deck peut utiliser des tags dans n'importe quelle langue dans son YAML, le système les normalise vers les IDs système

---

**Voir aussi** : [README.md](./README.md) - Architecture générale DeckHub
