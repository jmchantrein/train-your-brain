/**
 * Tags Taxonomy - Données de la taxonomie hiérarchique
 *
 * Ce fichier contient uniquement les données de taxonomie.
 * La logique de manipulation est dans tags.js
 *
 * Structure d'un tag:
 * - id: Identifiant unique (string)
 * - label: Libellé affiché (string)
 * - icon: Emoji (string)
 * - group: Groupe pour l'affichage (string)
 * - parents: IDs des parents [] (multi-parents supporté)
 * - equivalents: { lang: label } pour l'i18n (optionnel)
 */

// ═══════════════════════════════════════════════════════════════════════════
// TAXONOMIE COMPLÈTE
// ═══════════════════════════════════════════════════════════════════════════

const TAXONOMY = [
  // ============================================================================
  // RACINES PRINCIPALES - MATIÈRES
  // ============================================================================
  { id: 'sciences', label: 'Sciences', icon: '🔬', group: 'Matières', parents: [] },
  { id: 'sciences-humaines', label: 'Sciences humaines', icon: '🏛️', group: 'Matières', parents: [] },
  { id: 'langues', label: 'Langues', icon: '🗣️', group: 'Matières', parents: [] },
  { id: 'arts', label: 'Arts', icon: '🎨', group: 'Matières', parents: [] },
  { id: 'techniques', label: 'Techniques', icon: '🔧', group: 'Matières', parents: [] },

  // ============================================================================
  // SCIENCES - Niveau 2 (grandes branches)
  // ============================================================================
  { id: 'maths', label: 'Mathématiques', icon: '🔢', group: 'Sciences', parents: ['sciences'] },
  { id: 'informatique', label: 'Informatique', icon: '💻', group: 'Sciences', parents: ['sciences'] },
  { id: 'sciences-physiques', label: 'Sciences physiques', icon: '⚛️', group: 'Sciences', parents: ['sciences'] },
  { id: 'sciences-vie', label: 'Sciences de la vie', icon: '🧬', group: 'Sciences', parents: ['sciences'] },
  { id: 'sciences-terre-univers', label: 'Sciences de la Terre et de l\'univers', icon: '🌍', group: 'Sciences', parents: ['sciences'] },

  // ============================================================================
  // MATHÉMATIQUES - Niveau 2
  // ============================================================================
  { id: 'arithmetique', label: 'Arithmétique', icon: '➕', group: 'Mathématiques', parents: ['maths'] },
  { id: 'algebre', label: 'Algèbre', icon: '𝑥', group: 'Mathématiques', parents: ['maths'] },
  { id: 'analyse', label: 'Analyse', icon: '∫', group: 'Mathématiques', parents: ['maths'] },
  { id: 'geometrie', label: 'Géométrie', icon: '📐', group: 'Mathématiques', parents: ['maths'] },
  { id: 'probabilites', label: 'Probabilités', icon: '🎲', group: 'Mathématiques', parents: ['maths'] },
  { id: 'statistiques', label: 'Statistiques', icon: '📊', group: 'Mathématiques', parents: ['maths'] },
  { id: 'logique-maths', label: 'Logique mathématique', icon: '⊢', group: 'Mathématiques', parents: ['maths'] },
  { id: 'theorie-ensembles', label: 'Théorie des ensembles', icon: '∅', group: 'Mathématiques', parents: ['maths'] },
  { id: 'theorie-nombres', label: 'Théorie des nombres', icon: '🔣', group: 'Mathématiques', parents: ['maths'] },
  { id: 'maths-discretes', label: 'Mathématiques discrètes', icon: '🔶', group: 'Mathématiques', parents: ['maths'] },
  { id: 'topologie', label: 'Topologie', icon: '🍩', group: 'Mathématiques', parents: ['maths'] },
  { id: 'maths-appliquees', label: 'Mathématiques appliquées', icon: '📈', group: 'Mathématiques', parents: ['maths'] },

  // ARITHMÉTIQUE - Niveau 3
  { id: 'operations-base', label: 'Opérations de base', icon: '✖️', group: 'Mathématiques', parents: ['arithmetique'] },
  { id: 'additions', label: 'Additions', icon: '➕', group: 'Mathématiques', parents: ['operations-base'] },
  { id: 'soustractions', label: 'Soustractions', icon: '➖', group: 'Mathématiques', parents: ['operations-base'] },
  { id: 'multiplications', label: 'Multiplications', icon: '✖️', group: 'Mathématiques', parents: ['operations-base'] },
  { id: 'divisions', label: 'Divisions', icon: '➗', group: 'Mathématiques', parents: ['operations-base'] },
  { id: 'fractions', label: 'Fractions', icon: '½', group: 'Mathématiques', parents: ['arithmetique'] },
  { id: 'decimaux', label: 'Nombres décimaux', icon: '🔸', group: 'Mathématiques', parents: ['arithmetique'] },
  { id: 'pourcentages', label: 'Pourcentages', icon: '%', group: 'Mathématiques', parents: ['arithmetique'] },
  { id: 'puissances', label: 'Puissances', icon: '²', group: 'Mathématiques', parents: ['arithmetique'] },
  { id: 'racines', label: 'Racines', icon: '√', group: 'Mathématiques', parents: ['arithmetique'] },
  { id: 'divisibilite', label: 'Divisibilité', icon: '÷', group: 'Mathématiques', parents: ['arithmetique', 'theorie-nombres'] },
  { id: 'pgcd-ppcm', label: 'PGCD et PPCM', icon: '🔗', group: 'Mathématiques', parents: ['divisibilite'] },
  { id: 'nombres-premiers', label: 'Nombres premiers', icon: '🥇', group: 'Mathématiques', parents: ['theorie-nombres'] },
  { id: 'calcul-mental', label: 'Calcul mental', icon: '🧮', group: 'Mathématiques', parents: ['arithmetique'] },

  // ALGÈBRE - Niveau 3
  { id: 'calcul-litteral', label: 'Calcul littéral', icon: '📝', group: 'Mathématiques', parents: ['algebre'] },
  { id: 'equations', label: 'Équations', icon: '⚖️', group: 'Mathématiques', parents: ['algebre'] },
  { id: 'inequations', label: 'Inéquations', icon: '≤', group: 'Mathématiques', parents: ['algebre'] },
  { id: 'systemes-equations', label: 'Systèmes d\'équations', icon: '🔀', group: 'Mathématiques', parents: ['algebre'] },
  { id: 'polynomes', label: 'Polynômes', icon: '📜', group: 'Mathématiques', parents: ['algebre'] },
  { id: 'algebre-lineaire', label: 'Algèbre linéaire', icon: '📋', group: 'Mathématiques', parents: ['algebre'] },
  { id: 'algebre-abstraite', label: 'Algèbre abstraite', icon: '🔷', group: 'Mathématiques', parents: ['algebre'] },
  { id: 'nombres-complexes', label: 'Nombres complexes', icon: '🌀', group: 'Mathématiques', parents: ['algebre'] },

  // ALGÈBRE - Niveau 4
  { id: 'equations-premier-degre', label: 'Équations 1er degré', icon: '1️⃣', group: 'Mathématiques', parents: ['equations'] },
  { id: 'equations-second-degre', label: 'Équations 2nd degré', icon: '2️⃣', group: 'Mathématiques', parents: ['equations'] },
  { id: 'matrices', label: 'Matrices', icon: '⬛', group: 'Mathématiques', parents: ['algebre-lineaire'] },
  { id: 'vecteurs', label: 'Vecteurs', icon: '➡️', group: 'Mathématiques', parents: ['algebre-lineaire', 'geometrie'] },
  { id: 'espaces-vectoriels', label: 'Espaces vectoriels', icon: '🌐', group: 'Mathématiques', parents: ['algebre-lineaire'] },
  { id: 'applications-lineaires', label: 'Applications linéaires', icon: '↔️', group: 'Mathématiques', parents: ['algebre-lineaire'] },
  { id: 'determinants', label: 'Déterminants', icon: '🔲', group: 'Mathématiques', parents: ['matrices'] },
  { id: 'valeurs-propres', label: 'Valeurs propres', icon: '🎯', group: 'Mathématiques', parents: ['matrices'] },
  { id: 'groupes', label: 'Groupes', icon: '🔵', group: 'Mathématiques', parents: ['algebre-abstraite'] },
  { id: 'anneaux', label: 'Anneaux', icon: '💍', group: 'Mathématiques', parents: ['algebre-abstraite'] },
  { id: 'corps', label: 'Corps', icon: '🏛️', group: 'Mathématiques', parents: ['algebre-abstraite'] },

  // ANALYSE - Niveau 3
  { id: 'fonctions', label: 'Fonctions', icon: 'ƒ', group: 'Mathématiques', parents: ['analyse'] },
  { id: 'limites', label: 'Limites', icon: '🎯', group: 'Mathématiques', parents: ['analyse'] },
  { id: 'continuite', label: 'Continuité', icon: '〰️', group: 'Mathématiques', parents: ['analyse'] },
  { id: 'derivation', label: 'Dérivation', icon: '📉', group: 'Mathématiques', parents: ['analyse'] },
  { id: 'integration', label: 'Intégration', icon: '∫', group: 'Mathématiques', parents: ['analyse'] },
  { id: 'suites', label: 'Suites', icon: '🔢', group: 'Mathématiques', parents: ['analyse'] },
  { id: 'series', label: 'Séries', icon: 'Σ', group: 'Mathématiques', parents: ['analyse'] },
  { id: 'equations-differentielles', label: 'Équations différentielles', icon: '🌊', group: 'Mathématiques', parents: ['analyse'] },
  { id: 'analyse-complexe', label: 'Analyse complexe', icon: '🌀', group: 'Mathématiques', parents: ['analyse', 'nombres-complexes'] },
  { id: 'analyse-fonctionnelle', label: 'Analyse fonctionnelle', icon: '🔄', group: 'Mathématiques', parents: ['analyse'] },

  // ANALYSE - Niveau 4
  { id: 'fonctions-affines', label: 'Fonctions affines', icon: '📏', group: 'Mathématiques', parents: ['fonctions'] },
  { id: 'fonctions-carrees', label: 'Fonctions carrées', icon: '⏹️', group: 'Mathématiques', parents: ['fonctions'] },
  { id: 'fonctions-polynomiales', label: 'Fonctions polynomiales', icon: '🎢', group: 'Mathématiques', parents: ['fonctions'] },
  { id: 'fonctions-rationnelles', label: 'Fonctions rationnelles', icon: '➗', group: 'Mathématiques', parents: ['fonctions'] },
  { id: 'fonctions-trigonometriques', label: 'Fonctions trigonométriques', icon: '🔺', group: 'Mathématiques', parents: ['fonctions', 'trigonometrie'] },
  { id: 'fonctions-exponentielles', label: 'Fonctions exponentielles', icon: '📈', group: 'Mathématiques', parents: ['fonctions'] },
  { id: 'fonctions-logarithmes', label: 'Fonctions logarithmes', icon: '📉', group: 'Mathématiques', parents: ['fonctions'] },
  { id: 'suites-arithmetiques', label: 'Suites arithmétiques', icon: '➕', group: 'Mathématiques', parents: ['suites'] },
  { id: 'suites-geometriques', label: 'Suites géométriques', icon: '✖️', group: 'Mathématiques', parents: ['suites'] },
  { id: 'integration-parties', label: 'Intégration par parties', icon: '🔀', group: 'Mathématiques', parents: ['integration'] },
  { id: 'primitives', label: 'Primitives', icon: '📋', group: 'Mathématiques', parents: ['integration'] },
  { id: 'integrales-definies', label: 'Intégrales définies', icon: '📊', group: 'Mathématiques', parents: ['integration'] },

  // GÉOMÉTRIE - Niveau 3
  { id: 'geometrie-plane', label: 'Géométrie plane', icon: '📄', group: 'Mathématiques', parents: ['geometrie'] },
  { id: 'geometrie-espace', label: 'Géométrie dans l\'espace', icon: '📦', group: 'Mathématiques', parents: ['geometrie'] },
  { id: 'geometrie-analytique', label: 'Géométrie analytique', icon: '📍', group: 'Mathématiques', parents: ['geometrie'] },
  { id: 'trigonometrie', label: 'Trigonométrie', icon: '📐', group: 'Mathématiques', parents: ['geometrie', 'analyse'] },
  { id: 'geometrie-euclidienne', label: 'Géométrie euclidienne', icon: '📏', group: 'Mathématiques', parents: ['geometrie'] },
  { id: 'geometrie-non-euclidienne', label: 'Géométrie non-euclidienne', icon: '🌍', group: 'Mathématiques', parents: ['geometrie'] },
  { id: 'transformations-geometriques', label: 'Transformations géométriques', icon: '🔄', group: 'Mathématiques', parents: ['geometrie'] },

  // GÉOMÉTRIE - Niveau 4
  { id: 'triangles', label: 'Triangles', icon: '🔺', group: 'Mathématiques', parents: ['geometrie-plane'] },
  { id: 'quadrilateres', label: 'Quadrilatères', icon: '⬜', group: 'Mathématiques', parents: ['geometrie-plane'] },
  { id: 'cercles', label: 'Cercles', icon: '⭕', group: 'Mathématiques', parents: ['geometrie-plane'] },
  { id: 'polygones', label: 'Polygones', icon: '⬡', group: 'Mathématiques', parents: ['geometrie-plane'] },
  { id: 'droites-plans', label: 'Droites et plans', icon: '📐', group: 'Mathématiques', parents: ['geometrie-espace'] },
  { id: 'volumes', label: 'Volumes', icon: '📦', group: 'Mathématiques', parents: ['geometrie-espace'] },
  { id: 'polyedres', label: 'Polyèdres', icon: '🔷', group: 'Mathématiques', parents: ['geometrie-espace'] },
  { id: 'solides-revolution', label: 'Solides de révolution', icon: '🎱', group: 'Mathématiques', parents: ['geometrie-espace'] },
  { id: 'thales', label: 'Théorème de Thalès', icon: '📏', group: 'Mathématiques', parents: ['triangles'] },
  { id: 'pythagore', label: 'Théorème de Pythagore', icon: '📐', group: 'Mathématiques', parents: ['triangles'] },
  { id: 'sinus-cosinus', label: 'Sinus et Cosinus', icon: '🌊', group: 'Mathématiques', parents: ['trigonometrie'] },
  { id: 'tangente', label: 'Tangente', icon: '📈', group: 'Mathématiques', parents: ['trigonometrie'] },
  { id: 'coordonnees-cartesiennes', label: 'Coordonnées cartésiennes', icon: '📍', group: 'Mathématiques', parents: ['geometrie-analytique'] },
  { id: 'equations-droites', label: 'Équations de droites', icon: '📏', group: 'Mathématiques', parents: ['geometrie-analytique'] },
  { id: 'equations-cercles', label: 'Équations de cercles', icon: '⭕', group: 'Mathématiques', parents: ['geometrie-analytique'] },
  { id: 'coniques', label: 'Coniques', icon: '🥚', group: 'Mathématiques', parents: ['geometrie-analytique'] },
  { id: 'symetries', label: 'Symétries', icon: '🪞', group: 'Mathématiques', parents: ['transformations-geometriques'] },
  { id: 'rotations', label: 'Rotations', icon: '🔄', group: 'Mathématiques', parents: ['transformations-geometriques'] },
  { id: 'translations', label: 'Translations', icon: '➡️', group: 'Mathématiques', parents: ['transformations-geometriques'] },
  { id: 'homotheties', label: 'Homothéties', icon: '🔍', group: 'Mathématiques', parents: ['transformations-geometriques'] },

  // PROBABILITÉS - Niveau 3 & 4
  { id: 'probabilites-elementaires', label: 'Probabilités élémentaires', icon: '🎰', group: 'Mathématiques', parents: ['probabilites'] },
  { id: 'probabilites-conditionnelles', label: 'Probabilités conditionnelles', icon: '🔗', group: 'Mathématiques', parents: ['probabilites'] },
  { id: 'variables-aleatoires', label: 'Variables aléatoires', icon: '🎲', group: 'Mathématiques', parents: ['probabilites'] },
  { id: 'lois-probabilite', label: 'Lois de probabilité', icon: '📊', group: 'Mathématiques', parents: ['probabilites'] },
  { id: 'combinatoire', label: 'Combinatoire', icon: '🎯', group: 'Mathématiques', parents: ['maths-discretes'] },
  { id: 'denombrement', label: 'Dénombrement', icon: '🔢', group: 'Mathématiques', parents: ['probabilites-elementaires', 'combinatoire'] },
  { id: 'arbres-probabilite', label: 'Arbres de probabilité', icon: '🌳', group: 'Mathématiques', parents: ['probabilites-elementaires'] },
  { id: 'bayes', label: 'Théorème de Bayes', icon: '🔄', group: 'Mathématiques', parents: ['probabilites-conditionnelles'] },
  { id: 'esperance', label: 'Espérance', icon: '🎯', group: 'Mathématiques', parents: ['variables-aleatoires'] },
  { id: 'variance', label: 'Variance', icon: '📏', group: 'Mathématiques', parents: ['variables-aleatoires'] },
  { id: 'loi-binomiale', label: 'Loi binomiale', icon: '🎲', group: 'Mathématiques', parents: ['lois-probabilite'] },
  { id: 'loi-normale', label: 'Loi normale', icon: '🔔', group: 'Mathématiques', parents: ['lois-probabilite'] },
  { id: 'loi-poisson', label: 'Loi de Poisson', icon: '🐟', group: 'Mathématiques', parents: ['lois-probabilite'] },
  { id: 'loi-exponentielle', label: 'Loi exponentielle', icon: '📈', group: 'Mathématiques', parents: ['lois-probabilite'] },

  // STATISTIQUES - Niveau 3 & 4
  { id: 'statistiques-descriptives', label: 'Statistiques descriptives', icon: '📋', group: 'Mathématiques', parents: ['statistiques'] },
  { id: 'statistiques-inferentielles', label: 'Statistiques inférentielles', icon: '🔍', group: 'Mathématiques', parents: ['statistiques'] },
  { id: 'moyenne-mediane', label: 'Moyenne et médiane', icon: '📊', group: 'Mathématiques', parents: ['statistiques-descriptives'] },
  { id: 'ecart-type', label: 'Écart-type', icon: 'σ', group: 'Mathématiques', parents: ['statistiques-descriptives'] },
  { id: 'quartiles', label: 'Quartiles', icon: '📏', group: 'Mathématiques', parents: ['statistiques-descriptives'] },
  { id: 'diagrammes-statistiques', label: 'Diagrammes statistiques', icon: '📈', group: 'Mathématiques', parents: ['statistiques-descriptives'] },
  { id: 'regression', label: 'Régression', icon: '📉', group: 'Mathématiques', parents: ['statistiques-inferentielles'] },
  { id: 'correlation', label: 'Corrélation', icon: '🔗', group: 'Mathématiques', parents: ['statistiques-inferentielles'] },
  { id: 'tests-statistiques', label: 'Tests statistiques', icon: '✅', group: 'Mathématiques', parents: ['statistiques-inferentielles'] },
  { id: 'intervalles-confiance', label: 'Intervalles de confiance', icon: '📐', group: 'Mathématiques', parents: ['statistiques-inferentielles'] },

  // ============================================================================
  // INFORMATIQUE - Niveau 2
  // ============================================================================
  { id: 'algorithmique', label: 'Algorithmique', icon: '🔄', group: 'Informatique', parents: ['informatique'] },
  { id: 'programmation', label: 'Programmation', icon: '👨‍💻', group: 'Informatique', parents: ['informatique'] },
  { id: 'structures-donnees', label: 'Structures de données', icon: '📦', group: 'Informatique', parents: ['informatique'] },
  { id: 'bases-donnees', label: 'Bases de données', icon: '🗄️', group: 'Informatique', parents: ['informatique'] },
  { id: 'reseaux', label: 'Réseaux', icon: '🌐', group: 'Informatique', parents: ['informatique'] },
  { id: 'systemes-exploitation', label: 'Systèmes d\'exploitation', icon: '🖥️', group: 'Informatique', parents: ['informatique'] },
  { id: 'architecture-ordinateurs', label: 'Architecture des ordinateurs', icon: '🔧', group: 'Informatique', parents: ['informatique'] },
  { id: 'intelligence-artificielle', label: 'Intelligence artificielle', icon: '🤖', group: 'Informatique', parents: ['informatique'] },
  { id: 'cybersecurite', label: 'Cybersécurité', icon: '🔒', group: 'Informatique', parents: ['informatique'] },
  { id: 'developpement-web', label: 'Développement web', icon: '🌍', group: 'Informatique', parents: ['informatique'] },
  { id: 'developpement-mobile', label: 'Développement mobile', icon: '📱', group: 'Informatique', parents: ['informatique'] },
  { id: 'devops', label: 'DevOps', icon: '⚙️', group: 'Informatique', parents: ['informatique'] },
  { id: 'genie-logiciel', label: 'Génie logiciel', icon: '🏗️', group: 'Informatique', parents: ['informatique'] },
  { id: 'theorie-informatique', label: 'Théorie de l\'informatique', icon: '📐', group: 'Informatique', parents: ['informatique'] },

  // ALGORITHMIQUE - Niveau 3
  { id: 'complexite', label: 'Complexité algorithmique', icon: '⏱️', group: 'Informatique', parents: ['algorithmique'] },
  { id: 'tri', label: 'Algorithmes de tri', icon: '📊', group: 'Informatique', parents: ['algorithmique'] },
  { id: 'recherche-algo', label: 'Algorithmes de recherche', icon: '🔍', group: 'Informatique', parents: ['algorithmique'] },
  { id: 'recursivite', label: 'Récursivité', icon: '🔁', group: 'Informatique', parents: ['algorithmique'] },
  { id: 'programmation-dynamique', label: 'Programmation dynamique', icon: '📈', group: 'Informatique', parents: ['algorithmique'] },
  { id: 'algorithmes-gloutons', label: 'Algorithmes gloutons', icon: '🍴', group: 'Informatique', parents: ['algorithmique'] },
  { id: 'diviser-regner', label: 'Diviser pour régner', icon: '✂️', group: 'Informatique', parents: ['algorithmique'] },
  { id: 'backtracking', label: 'Backtracking', icon: '↩️', group: 'Informatique', parents: ['algorithmique'] },
  { id: 'algorithmes-graphes', label: 'Algorithmes sur les graphes', icon: '🕸️', group: 'Informatique', parents: ['algorithmique'] },
  { id: 'algorithmes-chaines', label: 'Algorithmes sur les chaînes', icon: '🔤', group: 'Informatique', parents: ['algorithmique'] },

  // ALGORITHMIQUE - Niveau 4 (Tri)
  { id: 'tri-bulle', label: 'Tri à bulles', icon: '🫧', group: 'Informatique', parents: ['tri'] },
  { id: 'tri-selection', label: 'Tri par sélection', icon: '👆', group: 'Informatique', parents: ['tri'] },
  { id: 'tri-insertion', label: 'Tri par insertion', icon: '📥', group: 'Informatique', parents: ['tri'] },
  { id: 'tri-fusion', label: 'Tri fusion', icon: '🔀', group: 'Informatique', parents: ['tri', 'diviser-regner'] },
  { id: 'tri-rapide', label: 'Tri rapide (Quicksort)', icon: '⚡', group: 'Informatique', parents: ['tri', 'diviser-regner'] },
  { id: 'tri-tas', label: 'Tri par tas (Heapsort)', icon: '🏔️', group: 'Informatique', parents: ['tri'] },
  { id: 'tri-comptage', label: 'Tri par comptage', icon: '🔢', group: 'Informatique', parents: ['tri'] },

  // ALGORITHMIQUE - Niveau 4 (Graphes)
  { id: 'parcours-largeur', label: 'Parcours en largeur (BFS)', icon: '↔️', group: 'Informatique', parents: ['algorithmes-graphes'] },
  { id: 'parcours-profondeur', label: 'Parcours en profondeur (DFS)', icon: '↕️', group: 'Informatique', parents: ['algorithmes-graphes'] },
  { id: 'dijkstra', label: 'Algorithme de Dijkstra', icon: '🛤️', group: 'Informatique', parents: ['algorithmes-graphes'] },
  { id: 'bellman-ford', label: 'Bellman-Ford', icon: '🔔', group: 'Informatique', parents: ['algorithmes-graphes'] },
  { id: 'floyd-warshall', label: 'Floyd-Warshall', icon: '🌐', group: 'Informatique', parents: ['algorithmes-graphes'] },
  { id: 'kruskal-prim', label: 'Kruskal / Prim (arbres couvrants)', icon: '🌲', group: 'Informatique', parents: ['algorithmes-graphes'] },
  { id: 'detection-cycles', label: 'Détection de cycles', icon: '🔄', group: 'Informatique', parents: ['algorithmes-graphes'] },
  { id: 'tri-topologique', label: 'Tri topologique', icon: '📏', group: 'Informatique', parents: ['algorithmes-graphes'] },

  // ALGORITHMIQUE - Niveau 4 (Chaînes)
  { id: 'recherche-motif', label: 'Recherche de motif', icon: '🔎', group: 'Informatique', parents: ['algorithmes-chaines'] },
  { id: 'kmp', label: 'Knuth-Morris-Pratt', icon: '📝', group: 'Informatique', parents: ['algorithmes-chaines'] },
  { id: 'rabin-karp', label: 'Rabin-Karp', icon: '#️⃣', group: 'Informatique', parents: ['algorithmes-chaines'] },
  { id: 'distance-levenshtein', label: 'Distance de Levenshtein', icon: '📐', group: 'Informatique', parents: ['algorithmes-chaines', 'programmation-dynamique'] },
  { id: 'lcs', label: 'Plus longue sous-séquence commune', icon: '🔗', group: 'Informatique', parents: ['algorithmes-chaines', 'programmation-dynamique'] },

  // PROGRAMMATION - Niveau 3 (Langages)
  { id: 'python', label: 'Python', icon: '🐍', group: 'Informatique', parents: ['programmation'] },
  { id: 'javascript', label: 'JavaScript', icon: '🟨', group: 'Informatique', parents: ['programmation'] },
  { id: 'java', label: 'Java', icon: '☕', group: 'Informatique', parents: ['programmation'] },
  { id: 'c-langage', label: 'C', icon: '🔵', group: 'Informatique', parents: ['programmation'] },
  { id: 'cpp', label: 'C++', icon: '➕', group: 'Informatique', parents: ['programmation'] },
  { id: 'csharp', label: 'C#', icon: '🟣', group: 'Informatique', parents: ['programmation'] },
  { id: 'rust', label: 'Rust', icon: '🦀', group: 'Informatique', parents: ['programmation'] },
  { id: 'go', label: 'Go', icon: '🐹', group: 'Informatique', parents: ['programmation'] },
  { id: 'php', label: 'PHP', icon: '🐘', group: 'Informatique', parents: ['programmation'] },
  { id: 'ruby', label: 'Ruby', icon: '💎', group: 'Informatique', parents: ['programmation'] },
  { id: 'swift', label: 'Swift', icon: '🦅', group: 'Informatique', parents: ['programmation'] },
  { id: 'kotlin', label: 'Kotlin', icon: '🟠', group: 'Informatique', parents: ['programmation'] },
  { id: 'scala', label: 'Scala', icon: '🔴', group: 'Informatique', parents: ['programmation'] },
  { id: 'haskell', label: 'Haskell', icon: 'λ', group: 'Informatique', parents: ['programmation', 'programmation-fonctionnelle'] },
  { id: 'typescript', label: 'TypeScript', icon: '🔷', group: 'Informatique', parents: ['programmation', 'javascript'] },
  { id: 'sql-langage', label: 'SQL (langage)', icon: '📊', group: 'Informatique', parents: ['programmation'] },
  { id: 'bash-shell', label: 'Bash / Shell', icon: '🐚', group: 'Informatique', parents: ['programmation'] },

  // PROGRAMMATION - Niveau 3 (Paradigmes)
  { id: 'poo', label: 'Programmation orientée objet', icon: '🎯', group: 'Informatique', parents: ['programmation'] },
  { id: 'programmation-fonctionnelle', label: 'Programmation fonctionnelle', icon: 'λ', group: 'Informatique', parents: ['programmation'] },
  { id: 'programmation-imperative', label: 'Programmation impérative', icon: '➡️', group: 'Informatique', parents: ['programmation'] },
  { id: 'programmation-reactive', label: 'Programmation réactive', icon: '⚡', group: 'Informatique', parents: ['programmation'] },
  { id: 'programmation-concurrente', label: 'Programmation concurrente', icon: '🔀', group: 'Informatique', parents: ['programmation'] },

  // POO - Niveau 4
  { id: 'classes-objets', label: 'Classes et objets', icon: '📦', group: 'Informatique', parents: ['poo'] },
  { id: 'heritage', label: 'Héritage', icon: '👨‍👦', group: 'Informatique', parents: ['poo'] },
  { id: 'polymorphisme', label: 'Polymorphisme', icon: '🔄', group: 'Informatique', parents: ['poo'] },
  { id: 'encapsulation', label: 'Encapsulation', icon: '📦', group: 'Informatique', parents: ['poo'] },
  { id: 'abstraction', label: 'Abstraction', icon: '🎨', group: 'Informatique', parents: ['poo'] },
  { id: 'interfaces', label: 'Interfaces', icon: '🔌', group: 'Informatique', parents: ['poo'] },

  // PROGRAMMATION FONCTIONNELLE - Niveau 4
  { id: 'fonctions-pures', label: 'Fonctions pures', icon: '✨', group: 'Informatique', parents: ['programmation-fonctionnelle'] },
  { id: 'immutabilite', label: 'Immutabilité', icon: '🔒', group: 'Informatique', parents: ['programmation-fonctionnelle'] },
  { id: 'fonctions-ordre-superieur', label: 'Fonctions d\'ordre supérieur', icon: '⬆️', group: 'Informatique', parents: ['programmation-fonctionnelle'] },
  { id: 'map-filter-reduce', label: 'Map / Filter / Reduce', icon: '🗺️', group: 'Informatique', parents: ['programmation-fonctionnelle'] },
  { id: 'monades', label: 'Monades', icon: '📦', group: 'Informatique', parents: ['programmation-fonctionnelle'] },

  // PROGRAMMATION CONCURRENTE - Niveau 4
  { id: 'threads', label: 'Threads', icon: '🧵', group: 'Informatique', parents: ['programmation-concurrente'] },
  { id: 'mutex-semaphores', label: 'Mutex et sémaphores', icon: '🚦', group: 'Informatique', parents: ['programmation-concurrente'] },
  { id: 'async-await', label: 'Async / Await', icon: '⏳', group: 'Informatique', parents: ['programmation-concurrente'] },
  { id: 'deadlocks', label: 'Deadlocks', icon: '🔐', group: 'Informatique', parents: ['programmation-concurrente'] },

  // STRUCTURES DE DONNÉES - Niveau 3
  { id: 'tableaux', label: 'Tableaux', icon: '📋', group: 'Informatique', parents: ['structures-donnees'] },
  { id: 'listes-chainees', label: 'Listes chaînées', icon: '🔗', group: 'Informatique', parents: ['structures-donnees'] },
  { id: 'piles', label: 'Piles (Stack)', icon: '📚', group: 'Informatique', parents: ['structures-donnees'] },
  { id: 'files', label: 'Files (Queue)', icon: '🚶‍♂️', group: 'Informatique', parents: ['structures-donnees'] },
  { id: 'arbres-donnees', label: 'Arbres', icon: '🌳', group: 'Informatique', parents: ['structures-donnees'] },
  { id: 'graphes-donnees', label: 'Graphes', icon: '🕸️', group: 'Informatique', parents: ['structures-donnees'] },
  { id: 'tables-hachage', label: 'Tables de hachage', icon: '#️⃣', group: 'Informatique', parents: ['structures-donnees'] },
  { id: 'tas-heap', label: 'Tas (Heap)', icon: '🏔️', group: 'Informatique', parents: ['structures-donnees'] },
  { id: 'tries', label: 'Tries (arbres préfixes)', icon: '🔤', group: 'Informatique', parents: ['structures-donnees'] },

  // ARBRES - Niveau 4
  { id: 'arbres-binaires', label: 'Arbres binaires', icon: '🌲', group: 'Informatique', parents: ['arbres-donnees'] },
  { id: 'abr', label: 'Arbres binaires de recherche', icon: '🔍', group: 'Informatique', parents: ['arbres-donnees'] },
  { id: 'arbres-avl', label: 'Arbres AVL', icon: '⚖️', group: 'Informatique', parents: ['arbres-donnees'] },
  { id: 'arbres-rouge-noir', label: 'Arbres rouge-noir', icon: '🔴', group: 'Informatique', parents: ['arbres-donnees'] },
  { id: 'arbres-b', label: 'Arbres B / B+', icon: '📂', group: 'Informatique', parents: ['arbres-donnees'] },

  // GRAPHES - Niveau 4
  { id: 'graphes-orientes', label: 'Graphes orientés', icon: '➡️', group: 'Informatique', parents: ['graphes-donnees'] },
  { id: 'graphes-ponderes', label: 'Graphes pondérés', icon: '⚖️', group: 'Informatique', parents: ['graphes-donnees'] },
  { id: 'representation-graphes', label: 'Représentation (matrice, listes)', icon: '📊', group: 'Informatique', parents: ['graphes-donnees'] },

  // BASES DE DONNÉES - Niveau 3
  { id: 'bdd-relationnelles', label: 'Bases relationnelles', icon: '🔗', group: 'Informatique', parents: ['bases-donnees'] },
  { id: 'nosql', label: 'NoSQL', icon: '📦', group: 'Informatique', parents: ['bases-donnees'] },
  { id: 'modelisation-bdd', label: 'Modélisation', icon: '📐', group: 'Informatique', parents: ['bases-donnees'] },
  { id: 'optimisation-bdd', label: 'Optimisation et indexation', icon: '⚡', group: 'Informatique', parents: ['bases-donnees'] },
  { id: 'transactions-bdd', label: 'Transactions (ACID)', icon: '🔒', group: 'Informatique', parents: ['bases-donnees'] },

  // BDD RELATIONNELLES - Niveau 4
  { id: 'sql', label: 'SQL', icon: '📊', group: 'Informatique', parents: ['bdd-relationnelles'] },
  { id: 'postgresql', label: 'PostgreSQL', icon: '🐘', group: 'Informatique', parents: ['bdd-relationnelles'] },
  { id: 'mysql', label: 'MySQL / MariaDB', icon: '🐬', group: 'Informatique', parents: ['bdd-relationnelles'] },
  { id: 'sqlite', label: 'SQLite', icon: '📁', group: 'Informatique', parents: ['bdd-relationnelles'] },
  { id: 'oracle-db', label: 'Oracle DB', icon: '🔶', group: 'Informatique', parents: ['bdd-relationnelles'] },
  { id: 'jointures-sql', label: 'Jointures SQL', icon: '🔗', group: 'Informatique', parents: ['sql'] },
  { id: 'sous-requetes', label: 'Sous-requêtes', icon: '📦', group: 'Informatique', parents: ['sql'] },
  { id: 'agregation-sql', label: 'Agrégation (GROUP BY)', icon: '📊', group: 'Informatique', parents: ['sql'] },

  // NOSQL - Niveau 4
  { id: 'mongodb', label: 'MongoDB', icon: '🍃', group: 'Informatique', parents: ['nosql'] },
  { id: 'redis', label: 'Redis', icon: '🔴', group: 'Informatique', parents: ['nosql'] },
  { id: 'elasticsearch', label: 'Elasticsearch', icon: '🔍', group: 'Informatique', parents: ['nosql'] },
  { id: 'cassandra', label: 'Cassandra', icon: '👁️', group: 'Informatique', parents: ['nosql'] },
  { id: 'neo4j', label: 'Neo4j (graphes)', icon: '🕸️', group: 'Informatique', parents: ['nosql'] },

  // MODÉLISATION - Niveau 4
  { id: 'merise', label: 'Merise (MCD/MLD)', icon: '📐', group: 'Informatique', parents: ['modelisation-bdd'] },
  { id: 'uml-bdd', label: 'UML pour BDD', icon: '📊', group: 'Informatique', parents: ['modelisation-bdd'] },
  { id: 'normalisation', label: 'Normalisation (1NF, 2NF, 3NF)', icon: '📏', group: 'Informatique', parents: ['modelisation-bdd'] },

  // RÉSEAUX - Niveau 3
  { id: 'modele-osi', label: 'Modèle OSI', icon: '📚', group: 'Informatique', parents: ['reseaux'] },
  { id: 'protocoles-reseau', label: 'Protocoles', icon: '📜', group: 'Informatique', parents: ['reseaux'] },
  { id: 'adressage-ip', label: 'Adressage IP', icon: '🔢', group: 'Informatique', parents: ['reseaux'] },
  { id: 'routage', label: 'Routage', icon: '🛤️', group: 'Informatique', parents: ['reseaux'] },
  { id: 'reseaux-sans-fil', label: 'Réseaux sans fil', icon: '📶', group: 'Informatique', parents: ['reseaux'] },
  { id: 'securite-reseau', label: 'Sécurité réseau', icon: '🔒', group: 'Informatique', parents: ['reseaux', 'cybersecurite'] },

  // PROTOCOLES - Niveau 4
  { id: 'tcp-ip', label: 'TCP/IP', icon: '🌐', group: 'Informatique', parents: ['protocoles-reseau'] },
  { id: 'udp', label: 'UDP', icon: '📤', group: 'Informatique', parents: ['protocoles-reseau'] },
  { id: 'http-https', label: 'HTTP / HTTPS', icon: '🔐', group: 'Informatique', parents: ['protocoles-reseau'] },
  { id: 'dns', label: 'DNS', icon: '📛', group: 'Informatique', parents: ['protocoles-reseau'] },
  { id: 'dhcp', label: 'DHCP', icon: '🔄', group: 'Informatique', parents: ['protocoles-reseau'] },
  { id: 'ftp-sftp', label: 'FTP / SFTP', icon: '📁', group: 'Informatique', parents: ['protocoles-reseau'] },
  { id: 'ssh', label: 'SSH', icon: '🔑', group: 'Informatique', parents: ['protocoles-reseau'] },
  { id: 'smtp-imap', label: 'SMTP / IMAP / POP3', icon: '📧', group: 'Informatique', parents: ['protocoles-reseau'] },
  { id: 'websocket', label: 'WebSocket', icon: '🔌', group: 'Informatique', parents: ['protocoles-reseau'] },

  // ADRESSAGE - Niveau 4
  { id: 'ipv4', label: 'IPv4', icon: '4️⃣', group: 'Informatique', parents: ['adressage-ip'] },
  { id: 'ipv6', label: 'IPv6', icon: '6️⃣', group: 'Informatique', parents: ['adressage-ip'] },
  { id: 'sous-reseaux', label: 'Sous-réseaux (CIDR)', icon: '🔢', group: 'Informatique', parents: ['adressage-ip'] },
  { id: 'nat', label: 'NAT', icon: '🔄', group: 'Informatique', parents: ['adressage-ip'] },

  // SYSTÈMES D'EXPLOITATION - Niveau 3
  { id: 'linux', label: 'Linux', icon: '🐧', group: 'Informatique', parents: ['systemes-exploitation'] },
  { id: 'windows', label: 'Windows', icon: '🪟', group: 'Informatique', parents: ['systemes-exploitation'] },
  { id: 'macos', label: 'macOS', icon: '🍎', group: 'Informatique', parents: ['systemes-exploitation'] },
  { id: 'gestion-processus', label: 'Gestion des processus', icon: '⚙️', group: 'Informatique', parents: ['systemes-exploitation'] },
  { id: 'gestion-memoire', label: 'Gestion de la mémoire', icon: '🧠', group: 'Informatique', parents: ['systemes-exploitation'] },
  { id: 'systemes-fichiers', label: 'Systèmes de fichiers', icon: '📂', group: 'Informatique', parents: ['systemes-exploitation'] },
  { id: 'ordonnancement', label: 'Ordonnancement', icon: '📋', group: 'Informatique', parents: ['systemes-exploitation'] },

  // LINUX - Niveau 4
  { id: 'commandes-linux', label: 'Commandes Linux', icon: '💻', group: 'Informatique', parents: ['linux'] },
  { id: 'permissions-linux', label: 'Permissions', icon: '🔐', group: 'Informatique', parents: ['linux'] },
  { id: 'scripts-shell', label: 'Scripts shell', icon: '📜', group: 'Informatique', parents: ['linux', 'bash-shell'] },
  { id: 'systemd', label: 'Systemd', icon: '⚙️', group: 'Informatique', parents: ['linux'] },

  // GESTION MÉMOIRE - Niveau 4
  { id: 'pagination', label: 'Pagination', icon: '📄', group: 'Informatique', parents: ['gestion-memoire'] },
  { id: 'memoire-virtuelle', label: 'Mémoire virtuelle', icon: '💭', group: 'Informatique', parents: ['gestion-memoire'] },
  { id: 'garbage-collection', label: 'Garbage collection', icon: '🗑️', group: 'Informatique', parents: ['gestion-memoire'] },

  // ARCHITECTURE DES ORDINATEURS - Niveau 3
  { id: 'processeur', label: 'Processeur (CPU)', icon: '🔲', group: 'Informatique', parents: ['architecture-ordinateurs'] },
  { id: 'memoire-hardware', label: 'Mémoire', icon: '💾', group: 'Informatique', parents: ['architecture-ordinateurs'] },
  { id: 'bus-io', label: 'Bus et E/S', icon: '🔌', group: 'Informatique', parents: ['architecture-ordinateurs'] },
  { id: 'assembleur', label: 'Assembleur', icon: '⚙️', group: 'Informatique', parents: ['architecture-ordinateurs'] },
  { id: 'circuits-logiques', label: 'Circuits logiques', icon: '🔣', group: 'Informatique', parents: ['architecture-ordinateurs'] },

  // PROCESSEUR - Niveau 4
  { id: 'jeu-instructions', label: 'Jeu d\'instructions', icon: '📋', group: 'Informatique', parents: ['processeur'] },
  { id: 'pipeline', label: 'Pipeline', icon: '➡️', group: 'Informatique', parents: ['processeur'] },
  { id: 'cache', label: 'Mémoire cache', icon: '⚡', group: 'Informatique', parents: ['processeur'] },
  { id: 'risc-cisc', label: 'RISC vs CISC', icon: '⚖️', group: 'Informatique', parents: ['processeur'] },

  // CIRCUITS LOGIQUES - Niveau 4
  { id: 'portes-logiques', label: 'Portes logiques', icon: '🚪', group: 'Informatique', parents: ['circuits-logiques'] },
  { id: 'algebre-boole', label: 'Algèbre de Boole', icon: '🔢', group: 'Informatique', parents: ['circuits-logiques'] },
  { id: 'bascules', label: 'Bascules et registres', icon: '🔄', group: 'Informatique', parents: ['circuits-logiques'] },

  // INTELLIGENCE ARTIFICIELLE - Niveau 3
  { id: 'machine-learning', label: 'Machine Learning', icon: '🧠', group: 'Informatique', parents: ['intelligence-artificielle'] },
  { id: 'deep-learning', label: 'Deep Learning', icon: '🔮', group: 'Informatique', parents: ['intelligence-artificielle'] },
  { id: 'nlp', label: 'Traitement du langage naturel', icon: '💬', group: 'Informatique', parents: ['intelligence-artificielle'] },
  { id: 'computer-vision', label: 'Vision par ordinateur', icon: '👁️', group: 'Informatique', parents: ['intelligence-artificielle'] },
  { id: 'reinforcement-learning', label: 'Apprentissage par renforcement', icon: '🎮', group: 'Informatique', parents: ['intelligence-artificielle'] },
  { id: 'ia-symbolique', label: 'IA symbolique', icon: '🔣', group: 'Informatique', parents: ['intelligence-artificielle'] },

  // MACHINE LEARNING - Niveau 4
  { id: 'regression-ml', label: 'Régression', icon: '📈', group: 'Informatique', parents: ['machine-learning'] },
  { id: 'classification', label: 'Classification', icon: '🏷️', group: 'Informatique', parents: ['machine-learning'] },
  { id: 'clustering', label: 'Clustering', icon: '🎯', group: 'Informatique', parents: ['machine-learning'] },
  { id: 'arbres-decision', label: 'Arbres de décision', icon: '🌳', group: 'Informatique', parents: ['machine-learning'] },
  { id: 'svm', label: 'SVM', icon: '📊', group: 'Informatique', parents: ['machine-learning'] },
  { id: 'knn', label: 'k-NN', icon: '👥', group: 'Informatique', parents: ['machine-learning'] },
  { id: 'naive-bayes', label: 'Naive Bayes', icon: '🎲', group: 'Informatique', parents: ['machine-learning'] },
  { id: 'random-forest', label: 'Random Forest', icon: '🌲', group: 'Informatique', parents: ['machine-learning'] },

  // DEEP LEARNING - Niveau 4
  { id: 'perceptron', label: 'Perceptron', icon: '🔴', group: 'Informatique', parents: ['deep-learning'] },
  { id: 'reseaux-neurones', label: 'Réseaux de neurones', icon: '🧠', group: 'Informatique', parents: ['deep-learning'] },
  { id: 'cnn', label: 'CNN (Convolutionnels)', icon: '🖼️', group: 'Informatique', parents: ['deep-learning'] },
  { id: 'rnn', label: 'RNN (Récurrents)', icon: '🔄', group: 'Informatique', parents: ['deep-learning'] },
  { id: 'transformers', label: 'Transformers', icon: '🤖', group: 'Informatique', parents: ['deep-learning'] },
  { id: 'gan', label: 'GAN', icon: '🎨', group: 'Informatique', parents: ['deep-learning'] },
  { id: 'backpropagation', label: 'Rétropropagation', icon: '↩️', group: 'Informatique', parents: ['deep-learning'] },

  // NLP - Niveau 4
  { id: 'tokenisation', label: 'Tokenisation', icon: '✂️', group: 'Informatique', parents: ['nlp'] },
  { id: 'embeddings', label: 'Embeddings (Word2Vec)', icon: '📊', group: 'Informatique', parents: ['nlp'] },
  { id: 'analyse-sentiment', label: 'Analyse de sentiment', icon: '😊', group: 'Informatique', parents: ['nlp'] },
  { id: 'ner', label: 'Reconnaissance d\'entités (NER)', icon: '🏷️', group: 'Informatique', parents: ['nlp'] },
  { id: 'llm', label: 'LLM (GPT, Claude, etc.)', icon: '🤖', group: 'Informatique', parents: ['nlp', 'transformers'] },

  // CYBERSÉCURITÉ - Niveau 3
  { id: 'cryptographie', label: 'Cryptographie', icon: '🔐', group: 'Informatique', parents: ['cybersecurite'] },
  { id: 'authentification', label: 'Authentification', icon: '🔑', group: 'Informatique', parents: ['cybersecurite'] },
  { id: 'vulnerabilites', label: 'Vulnérabilités', icon: '🐛', group: 'Informatique', parents: ['cybersecurite'] },
  { id: 'securite-web', label: 'Sécurité web', icon: '🌐', group: 'Informatique', parents: ['cybersecurite', 'developpement-web'] },
  { id: 'forensique', label: 'Forensique', icon: '🔍', group: 'Informatique', parents: ['cybersecurite'] },

  // CRYPTOGRAPHIE - Niveau 4
  { id: 'chiffrement-symetrique', label: 'Chiffrement symétrique', icon: '🔑', group: 'Informatique', parents: ['cryptographie'] },
  { id: 'chiffrement-asymetrique', label: 'Chiffrement asymétrique', icon: '🔐', group: 'Informatique', parents: ['cryptographie'] },
  { id: 'fonctions-hachage', label: 'Fonctions de hachage', icon: '#️⃣', group: 'Informatique', parents: ['cryptographie'] },
  { id: 'signatures-numeriques', label: 'Signatures numériques', icon: '✍️', group: 'Informatique', parents: ['cryptographie'] },
  { id: 'certificats-ssl', label: 'Certificats SSL/TLS', icon: '📜', group: 'Informatique', parents: ['cryptographie'] },

  // VULNÉRABILITÉS - Niveau 4
  { id: 'injection-sql', label: 'Injection SQL', icon: '💉', group: 'Informatique', parents: ['vulnerabilites', 'securite-web'] },
  { id: 'xss', label: 'XSS', icon: '📝', group: 'Informatique', parents: ['vulnerabilites', 'securite-web'] },
  { id: 'csrf', label: 'CSRF', icon: '🎭', group: 'Informatique', parents: ['vulnerabilites', 'securite-web'] },
  { id: 'buffer-overflow', label: 'Buffer overflow', icon: '💥', group: 'Informatique', parents: ['vulnerabilites'] },
  { id: 'owasp-top-10', label: 'OWASP Top 10', icon: '🔟', group: 'Informatique', parents: ['vulnerabilites'] },

  // DEV WEB - Niveau 3
  { id: 'html', label: 'HTML', icon: '📄', group: 'Informatique', parents: ['developpement-web'] },
  { id: 'css', label: 'CSS', icon: '🎨', group: 'Informatique', parents: ['developpement-web'] },
  { id: 'frontend', label: 'Frontend', icon: '🖥️', group: 'Informatique', parents: ['developpement-web'] },
  { id: 'backend', label: 'Backend', icon: '⚙️', group: 'Informatique', parents: ['developpement-web'] },
  { id: 'api-web', label: 'APIs Web', icon: '🔌', group: 'Informatique', parents: ['developpement-web'] },
  { id: 'responsive-design', label: 'Responsive design', icon: '📱', group: 'Informatique', parents: ['developpement-web'] },
  { id: 'accessibilite-web', label: 'Accessibilité (a11y)', icon: '♿', group: 'Informatique', parents: ['developpement-web'] },

  // FRONTEND - Niveau 4
  { id: 'react', label: 'React', icon: '⚛️', group: 'Informatique', parents: ['frontend'] },
  { id: 'vue', label: 'Vue.js', icon: '💚', group: 'Informatique', parents: ['frontend'] },
  { id: 'angular', label: 'Angular', icon: '🅰️', group: 'Informatique', parents: ['frontend'] },
  { id: 'svelte', label: 'Svelte', icon: '🔥', group: 'Informatique', parents: ['frontend'] },
  { id: 'dom', label: 'DOM', icon: '🌳', group: 'Informatique', parents: ['frontend'] },

  // CSS - Niveau 4
  { id: 'flexbox', label: 'Flexbox', icon: '📦', group: 'Informatique', parents: ['css'] },
  { id: 'grid-css', label: 'CSS Grid', icon: '🔲', group: 'Informatique', parents: ['css'] },
  { id: 'sass-less', label: 'SASS / LESS', icon: '🎨', group: 'Informatique', parents: ['css'] },
  { id: 'tailwind', label: 'Tailwind CSS', icon: '💨', group: 'Informatique', parents: ['css'] },
  { id: 'animations-css', label: 'Animations CSS', icon: '🎬', group: 'Informatique', parents: ['css'] },

  // BACKEND - Niveau 4
  { id: 'nodejs', label: 'Node.js', icon: '💚', group: 'Informatique', parents: ['backend', 'javascript'] },
  { id: 'express', label: 'Express.js', icon: '🚂', group: 'Informatique', parents: ['backend', 'nodejs'] },
  { id: 'django', label: 'Django', icon: '🎸', group: 'Informatique', parents: ['backend', 'python'] },
  { id: 'flask', label: 'Flask', icon: '🧪', group: 'Informatique', parents: ['backend', 'python'] },
  { id: 'fastapi', label: 'FastAPI', icon: '⚡', group: 'Informatique', parents: ['backend', 'python'] },
  { id: 'spring', label: 'Spring', icon: '🌱', group: 'Informatique', parents: ['backend', 'java'] },
  { id: 'laravel', label: 'Laravel', icon: '🔴', group: 'Informatique', parents: ['backend', 'php'] },
  { id: 'rails', label: 'Ruby on Rails', icon: '🛤️', group: 'Informatique', parents: ['backend', 'ruby'] },
  { id: 'dotnet', label: '.NET', icon: '🟣', group: 'Informatique', parents: ['backend', 'csharp'] },

  // APIs - Niveau 4
  { id: 'api-rest', label: 'REST API', icon: '🔗', group: 'Informatique', parents: ['api-web'] },
  { id: 'graphql', label: 'GraphQL', icon: '◼️', group: 'Informatique', parents: ['api-web'] },
  { id: 'grpc', label: 'gRPC', icon: '📡', group: 'Informatique', parents: ['api-web'] },
  { id: 'openapi', label: 'OpenAPI / Swagger', icon: '📖', group: 'Informatique', parents: ['api-web'] },

  // DEV MOBILE - Niveau 3
  { id: 'android', label: 'Android', icon: '🤖', group: 'Informatique', parents: ['developpement-mobile'] },
  { id: 'ios', label: 'iOS', icon: '🍎', group: 'Informatique', parents: ['developpement-mobile'] },
  { id: 'cross-platform', label: 'Cross-platform', icon: '🔄', group: 'Informatique', parents: ['developpement-mobile'] },

  // CROSS-PLATFORM - Niveau 4
  { id: 'react-native', label: 'React Native', icon: '⚛️', group: 'Informatique', parents: ['cross-platform'] },
  { id: 'flutter', label: 'Flutter', icon: '🦋', group: 'Informatique', parents: ['cross-platform'] },
  { id: 'ionic', label: 'Ionic', icon: '⚡', group: 'Informatique', parents: ['cross-platform'] },

  // DEVOPS - Niveau 3
  { id: 'containerisation', label: 'Conteneurisation', icon: '📦', group: 'Informatique', parents: ['devops'] },
  { id: 'orchestration', label: 'Orchestration', icon: '🎼', group: 'Informatique', parents: ['devops'] },
  { id: 'ci-cd', label: 'CI/CD', icon: '🔄', group: 'Informatique', parents: ['devops'] },
  { id: 'monitoring', label: 'Monitoring', icon: '📊', group: 'Informatique', parents: ['devops'] },
  { id: 'infrastructure-code', label: 'Infrastructure as Code', icon: '📝', group: 'Informatique', parents: ['devops'] },
  { id: 'git', label: 'Git', icon: '📦', group: 'Informatique', parents: ['devops'] },

  // CONTENEURISATION - Niveau 4
  { id: 'docker', label: 'Docker', icon: '🐳', group: 'Informatique', parents: ['containerisation'] },
  { id: 'dockerfile', label: 'Dockerfile', icon: '📄', group: 'Informatique', parents: ['docker'] },
  { id: 'docker-compose', label: 'Docker Compose', icon: '🔗', group: 'Informatique', parents: ['docker'] },

  // ORCHESTRATION - Niveau 4
  { id: 'kubernetes', label: 'Kubernetes', icon: '☸️', group: 'Informatique', parents: ['orchestration'] },
  { id: 'docker-swarm', label: 'Docker Swarm', icon: '🐝', group: 'Informatique', parents: ['orchestration'] },

  // CI/CD - Niveau 4
  { id: 'github-actions', label: 'GitHub Actions', icon: '🐙', group: 'Informatique', parents: ['ci-cd'] },
  { id: 'gitlab-ci', label: 'GitLab CI', icon: '🦊', group: 'Informatique', parents: ['ci-cd'] },
  { id: 'jenkins', label: 'Jenkins', icon: '🤵', group: 'Informatique', parents: ['ci-cd'] },

  // INFRASTRUCTURE AS CODE - Niveau 4
  { id: 'terraform', label: 'Terraform', icon: '🏗️', group: 'Informatique', parents: ['infrastructure-code'] },
  { id: 'ansible', label: 'Ansible', icon: '🔧', group: 'Informatique', parents: ['infrastructure-code'] },

  // GIT - Niveau 4
  { id: 'git-branches', label: 'Branches', icon: '🌿', group: 'Informatique', parents: ['git'] },
  { id: 'git-merge-rebase', label: 'Merge et Rebase', icon: '🔀', group: 'Informatique', parents: ['git'] },
  { id: 'git-workflow', label: 'Workflows (GitFlow)', icon: '📋', group: 'Informatique', parents: ['git'] },

  // GÉNIE LOGICIEL - Niveau 3
  { id: 'design-patterns', label: 'Design patterns', icon: '🏗️', group: 'Informatique', parents: ['genie-logiciel'] },
  { id: 'architecture-logicielle', label: 'Architecture logicielle', icon: '🏛️', group: 'Informatique', parents: ['genie-logiciel'] },
  { id: 'tests-logiciels', label: 'Tests', icon: '🧪', group: 'Informatique', parents: ['genie-logiciel'] },
  { id: 'methodologies', label: 'Méthodologies', icon: '📋', group: 'Informatique', parents: ['genie-logiciel'] },
  { id: 'clean-code', label: 'Clean Code', icon: '✨', group: 'Informatique', parents: ['genie-logiciel'] },

  // DESIGN PATTERNS - Niveau 4
  { id: 'patterns-creation', label: 'Patterns de création', icon: '🏭', group: 'Informatique', parents: ['design-patterns'] },
  { id: 'patterns-structure', label: 'Patterns de structure', icon: '🔗', group: 'Informatique', parents: ['design-patterns'] },
  { id: 'patterns-comportement', label: 'Patterns de comportement', icon: '🎭', group: 'Informatique', parents: ['design-patterns'] },
  { id: 'singleton', label: 'Singleton', icon: '1️⃣', group: 'Informatique', parents: ['patterns-creation'] },
  { id: 'factory', label: 'Factory', icon: '🏭', group: 'Informatique', parents: ['patterns-creation'] },
  { id: 'observer', label: 'Observer', icon: '👀', group: 'Informatique', parents: ['patterns-comportement'] },
  { id: 'strategy', label: 'Strategy', icon: '🎯', group: 'Informatique', parents: ['patterns-comportement'] },
  { id: 'decorator', label: 'Decorator', icon: '🎀', group: 'Informatique', parents: ['patterns-structure'] },

  // ARCHITECTURE LOGICIELLE - Niveau 4
  { id: 'mvc', label: 'MVC', icon: '📐', group: 'Informatique', parents: ['architecture-logicielle'] },
  { id: 'microservices', label: 'Microservices', icon: '🔲', group: 'Informatique', parents: ['architecture-logicielle'] },
  { id: 'monolithique', label: 'Architecture monolithique', icon: '🧱', group: 'Informatique', parents: ['architecture-logicielle'] },
  { id: 'hexagonale', label: 'Architecture hexagonale', icon: '⬡', group: 'Informatique', parents: ['architecture-logicielle'] },
  { id: 'event-driven', label: 'Event-driven', icon: '📡', group: 'Informatique', parents: ['architecture-logicielle'] },

  // TESTS - Niveau 4
  { id: 'tests-unitaires', label: 'Tests unitaires', icon: '🔬', group: 'Informatique', parents: ['tests-logiciels'] },
  { id: 'tests-integration', label: 'Tests d\'intégration', icon: '🔗', group: 'Informatique', parents: ['tests-logiciels'] },
  { id: 'tests-e2e', label: 'Tests E2E', icon: '🎯', group: 'Informatique', parents: ['tests-logiciels'] },
  { id: 'tdd', label: 'TDD', icon: '🔴', group: 'Informatique', parents: ['tests-logiciels'] },
  { id: 'bdd', label: 'BDD', icon: '📖', group: 'Informatique', parents: ['tests-logiciels'] },

  // MÉTHODOLOGIES - Niveau 4
  { id: 'agile', label: 'Agile', icon: '🏃', group: 'Informatique', parents: ['methodologies'] },
  { id: 'scrum', label: 'Scrum', icon: '🏈', group: 'Informatique', parents: ['methodologies', 'agile'] },
  { id: 'kanban', label: 'Kanban', icon: '📋', group: 'Informatique', parents: ['methodologies', 'agile'] },
  { id: 'waterfall', label: 'Waterfall', icon: '🌊', group: 'Informatique', parents: ['methodologies'] },

  // THÉORIE DE L'INFORMATIQUE - Niveau 3
  { id: 'langages-formels', label: 'Langages formels', icon: '📜', group: 'Informatique', parents: ['theorie-informatique'] },
  { id: 'automates', label: 'Automates', icon: '🤖', group: 'Informatique', parents: ['theorie-informatique'] },
  { id: 'calculabilite', label: 'Calculabilité', icon: '🔢', group: 'Informatique', parents: ['theorie-informatique'] },
  { id: 'compilation', label: 'Compilation', icon: '⚙️', group: 'Informatique', parents: ['theorie-informatique'] },
  { id: 'logique-informatique', label: 'Logique', icon: '🧮', group: 'Informatique', parents: ['theorie-informatique'] },

  // AUTOMATES - Niveau 4
  { id: 'automates-finis', label: 'Automates finis', icon: '🔄', group: 'Informatique', parents: ['automates'] },
  { id: 'expressions-regulieres', label: 'Expressions régulières', icon: '📝', group: 'Informatique', parents: ['automates'] },
  { id: 'grammaires', label: 'Grammaires', icon: '📚', group: 'Informatique', parents: ['automates'] },
  { id: 'machine-turing', label: 'Machine de Turing', icon: '🖥️', group: 'Informatique', parents: ['automates'] },

  // COMPILATION - Niveau 4
  { id: 'analyse-lexicale', label: 'Analyse lexicale', icon: '🔤', group: 'Informatique', parents: ['compilation'] },
  { id: 'analyse-syntaxique', label: 'Analyse syntaxique', icon: '🌳', group: 'Informatique', parents: ['compilation'] },
  { id: 'analyse-semantique', label: 'Analyse sémantique', icon: '🎯', group: 'Informatique', parents: ['compilation'] },
  { id: 'generation-code', label: 'Génération de code', icon: '⚙️', group: 'Informatique', parents: ['compilation'] },

  // ============================================================================
  // SCIENCES PHYSIQUES - Niveau 3
  // ============================================================================
  { id: 'physique', label: 'Physique', icon: '⚛️', group: 'Sciences', parents: ['sciences-physiques'] },
  { id: 'chimie', label: 'Chimie', icon: '🧪', group: 'Sciences', parents: ['sciences-physiques'] },

  // SCIENCES DE LA VIE - Niveau 3
  { id: 'biologie', label: 'Biologie', icon: '🧬', group: 'Sciences', parents: ['sciences-vie'] },
  { id: 'ecologie', label: 'Écologie', icon: '🌿', group: 'Sciences', parents: ['sciences-vie'] },
  { id: 'svt', label: 'SVT', icon: '🌱', group: 'Sciences', parents: ['sciences-vie'] },

  // SCIENCES DE LA TERRE ET UNIVERS - Niveau 3
  { id: 'geologie', label: 'Géologie', icon: '🪨', group: 'Sciences', parents: ['sciences-terre-univers'] },
  { id: 'meteorologie', label: 'Météorologie', icon: '🌤️', group: 'Sciences', parents: ['sciences-terre-univers'] },
  { id: 'oceanographie', label: 'Océanographie', icon: '🌊', group: 'Sciences', parents: ['sciences-terre-univers'] },
  { id: 'astronomie', label: 'Astronomie', icon: '🔭', group: 'Sciences', parents: ['sciences-terre-univers'] },
  { id: 'cosmologie', label: 'Cosmologie', icon: '🌌', group: 'Sciences', parents: ['sciences-terre-univers'] },

  // PHYSIQUE - Niveau 4
  { id: 'mecanique-classique', label: 'Mécanique classique', icon: '⚙️', group: 'Physique', parents: ['physique'] },
  { id: 'thermodynamique', label: 'Thermodynamique', icon: '🌡️', group: 'Physique', parents: ['physique'] },
  { id: 'electromagnetisme', label: 'Électromagnétisme', icon: '⚡', group: 'Physique', parents: ['physique'] },
  { id: 'optique', label: 'Optique', icon: '🔦', group: 'Physique', parents: ['physique'] },
  { id: 'mecanique-quantique', label: 'Mécanique quantique', icon: '🔮', group: 'Physique', parents: ['physique'] },
  { id: 'relativite', label: 'Relativité', icon: '🌌', group: 'Physique', parents: ['physique'] },

  // PHYSIQUE - Niveau 4
  { id: 'cinematique', label: 'Cinématique', icon: '🚗', group: 'Physique', parents: ['mecanique-classique'] },
  { id: 'dynamique', label: 'Dynamique', icon: '💪', group: 'Physique', parents: ['mecanique-classique'] },
  { id: 'lois-newton', label: 'Lois de Newton', icon: '📜', group: 'Physique', parents: ['dynamique'] },
  { id: 'energie-travail', label: 'Énergie et travail', icon: '⚡', group: 'Physique', parents: ['mecanique-classique'] },
  { id: 'circuits-electriques', label: 'Circuits électriques', icon: '🔌', group: 'Physique', parents: ['electromagnetisme'] },
  { id: 'loi-ohm', label: 'Loi d\'Ohm', icon: 'Ω', group: 'Physique', parents: ['circuits-electriques'] },

  // CHIMIE - Niveau 3
  { id: 'chimie-generale', label: 'Chimie générale', icon: '🧪', group: 'Chimie', parents: ['chimie'] },
  { id: 'chimie-organique', label: 'Chimie organique', icon: '🔬', group: 'Chimie', parents: ['chimie'] },
  { id: 'biochimie', label: 'Biochimie', icon: '🧬', group: 'Chimie', parents: ['chimie', 'biologie'] },

  // CHIMIE - Niveau 4
  { id: 'structure-atome', label: 'Structure de l\'atome', icon: '⚛️', group: 'Chimie', parents: ['chimie-generale'] },
  { id: 'tableau-periodique', label: 'Tableau périodique', icon: '📋', group: 'Chimie', parents: ['chimie-generale'] },
  { id: 'liaisons-chimiques', label: 'Liaisons chimiques', icon: '🔗', group: 'Chimie', parents: ['chimie-generale'] },
  { id: 'reactions-chimiques', label: 'Réactions chimiques', icon: '💥', group: 'Chimie', parents: ['chimie-generale'] },
  { id: 'acides-bases', label: 'Acides et bases', icon: '🧪', group: 'Chimie', parents: ['chimie-generale'] },
  { id: 'oxydoreduction', label: 'Oxydoréduction', icon: '⚡', group: 'Chimie', parents: ['chimie-generale'] },

  // BIOLOGIE - Niveau 4
  { id: 'biologie-cellulaire', label: 'Biologie cellulaire', icon: '🔬', group: 'Biologie', parents: ['biologie'] },
  { id: 'genetique', label: 'Génétique', icon: '🧬', group: 'Biologie', parents: ['biologie'] },
  { id: 'microbiologie', label: 'Microbiologie', icon: '🦠', group: 'Biologie', parents: ['biologie'] },
  { id: 'botanique', label: 'Botanique', icon: '🌱', group: 'Biologie', parents: ['biologie'] },
  { id: 'zoologie', label: 'Zoologie', icon: '🐾', group: 'Biologie', parents: ['biologie'] },
  { id: 'anatomie', label: 'Anatomie', icon: '🦴', group: 'Biologie', parents: ['biologie'] },
  { id: 'physiologie', label: 'Physiologie', icon: '❤️', group: 'Biologie', parents: ['biologie'] },
  { id: 'evolution', label: 'Évolution', icon: '🐒', group: 'Biologie', parents: ['biologie'] },

  // BIOLOGIE - Niveau 4
  { id: 'adn-arn', label: 'ADN et ARN', icon: '🧬', group: 'Biologie', parents: ['genetique'] },
  { id: 'heredite', label: 'Hérédité', icon: '👨‍👩‍👧', group: 'Biologie', parents: ['genetique'] },
  { id: 'photosynthese', label: 'Photosynthèse', icon: '☀️', group: 'Biologie', parents: ['biologie-cellulaire'] },
  { id: 'respiration-cellulaire', label: 'Respiration cellulaire', icon: '💨', group: 'Biologie', parents: ['biologie-cellulaire'] },

  // ============================================================================
  // SCIENCES HUMAINES - Niveau 2
  // ============================================================================
  { id: 'histoire', label: 'Histoire', icon: '📜', group: 'Sciences humaines', parents: ['sciences-humaines'] },
  { id: 'geographie', label: 'Géographie', icon: '🗺️', group: 'Sciences humaines', parents: ['sciences-humaines'] },
  { id: 'economie', label: 'Économie', icon: '💰', group: 'Sciences humaines', parents: ['sciences-humaines'] },
  { id: 'philosophie', label: 'Philosophie', icon: '🤔', group: 'Sciences humaines', parents: ['sciences-humaines'] },
  { id: 'sociologie', label: 'Sociologie', icon: '👥', group: 'Sciences humaines', parents: ['sciences-humaines'] },
  { id: 'psychologie', label: 'Psychologie', icon: '🧠', group: 'Sciences humaines', parents: ['sciences-humaines'] },
  { id: 'droit', label: 'Droit', icon: '⚖️', group: 'Sciences humaines', parents: ['sciences-humaines'] },

  // HISTOIRE - Niveau 3
  { id: 'antiquite', label: 'Antiquité', icon: '🏛️', group: 'Histoire', parents: ['histoire'] },
  { id: 'moyen-age', label: 'Moyen Âge', icon: '🏰', group: 'Histoire', parents: ['histoire'] },
  { id: 'temps-modernes', label: 'Temps modernes', icon: '⛵', group: 'Histoire', parents: ['histoire'] },
  { id: 'epoque-contemporaine', label: 'Époque contemporaine', icon: '🏭', group: 'Histoire', parents: ['histoire'] },
  { id: 'histoire-france', label: 'Histoire de France', icon: '🇫🇷', group: 'Histoire', parents: ['histoire'] },

  // HISTOIRE - Niveau 4
  { id: 'revolution-francaise', label: 'Révolution française', icon: '🇫🇷', group: 'Histoire', parents: ['epoque-contemporaine', 'histoire-france'] },
  { id: 'premiere-guerre-mondiale', label: 'Première Guerre mondiale', icon: '⚔️', group: 'Histoire', parents: ['epoque-contemporaine'] },
  { id: 'seconde-guerre-mondiale', label: 'Seconde Guerre mondiale', icon: '🌍', group: 'Histoire', parents: ['epoque-contemporaine'] },

  // GÉOGRAPHIE - Niveau 3
  { id: 'geographie-physique', label: 'Géographie physique', icon: '🏔️', group: 'Géographie', parents: ['geographie'] },
  { id: 'geographie-humaine', label: 'Géographie humaine', icon: '👥', group: 'Géographie', parents: ['geographie'] },
  { id: 'cartographie', label: 'Cartographie', icon: '🗺️', group: 'Géographie', parents: ['geographie'] },

  // ============================================================================
  // LANGUES - Niveau 2
  // ============================================================================
  { id: 'francais', label: 'Français', icon: '🇫🇷', group: 'Langues', parents: ['langues'] },
  { id: 'anglais', label: 'Anglais', icon: '🇬🇧', group: 'Langues', parents: ['langues'] },
  { id: 'espagnol', label: 'Espagnol', icon: '🇪🇸', group: 'Langues', parents: ['langues'] },
  { id: 'allemand', label: 'Allemand', icon: '🇩🇪', group: 'Langues', parents: ['langues'] },
  { id: 'italien', label: 'Italien', icon: '🇮🇹', group: 'Langues', parents: ['langues'] },
  { id: 'portugais', label: 'Portugais', icon: '🇵🇹', group: 'Langues', parents: ['langues'] },
  { id: 'chinois', label: 'Chinois', icon: '🇨🇳', group: 'Langues', parents: ['langues'] },
  { id: 'japonais', label: 'Japonais', icon: '🇯🇵', group: 'Langues', parents: ['langues'] },
  { id: 'russe', label: 'Russe', icon: '🇷🇺', group: 'Langues', parents: ['langues'] },
  { id: 'arabe', label: 'Arabe', icon: '🇸🇦', group: 'Langues', parents: ['langues'] },
  { id: 'coreen', label: 'Coréen', icon: '🇰🇷', group: 'Langues', parents: ['langues'] },
  { id: 'neerlandais', label: 'Néerlandais', icon: '🇳🇱', group: 'Langues', parents: ['langues'] },
  { id: 'grec-moderne', label: 'Grec moderne', icon: '🇬🇷', group: 'Langues', parents: ['langues'] },
  { id: 'latin', label: 'Latin', icon: '📜', group: 'Langues', parents: ['langues'] },
  { id: 'grec-ancien', label: 'Grec ancien', icon: '🏛️', group: 'Langues', parents: ['langues'] },

  // FRANÇAIS - Niveau 3
  { id: 'fr-orthographe', label: 'Orthographe', icon: '✍️', group: 'Français', parents: ['francais'] },
  { id: 'fr-grammaire', label: 'Grammaire', icon: '📝', group: 'Français', parents: ['francais'] },
  { id: 'fr-conjugaison', label: 'Conjugaison', icon: '🔄', group: 'Français', parents: ['francais'] },
  { id: 'fr-vocabulaire', label: 'Vocabulaire', icon: '📚', group: 'Français', parents: ['francais'] },
  { id: 'fr-litterature', label: 'Littérature', icon: '📖', group: 'Français', parents: ['francais'] },
  { id: 'fr-expression', label: 'Expression écrite', icon: '✏️', group: 'Français', parents: ['francais'] },
  { id: 'fr-comprehension', label: 'Compréhension', icon: '👂', group: 'Français', parents: ['francais'] },
  { id: 'fr-oral', label: 'Expression orale', icon: '🗣️', group: 'Français', parents: ['francais'] },

  // ANGLAIS - Niveau 3
  { id: 'en-grammar', label: 'Grammar', icon: '📝', group: 'Anglais', parents: ['anglais'] },
  { id: 'en-vocabulary', label: 'Vocabulary', icon: '📚', group: 'Anglais', parents: ['anglais'] },
  { id: 'en-spelling', label: 'Spelling', icon: '✍️', group: 'Anglais', parents: ['anglais'] },
  { id: 'en-conjugation', label: 'Tenses & Conjugation', icon: '🔄', group: 'Anglais', parents: ['anglais'] },
  { id: 'en-literature', label: 'Literature', icon: '📖', group: 'Anglais', parents: ['anglais'] },
  { id: 'en-writing', label: 'Writing', icon: '✏️', group: 'Anglais', parents: ['anglais'] },
  { id: 'en-listening', label: 'Listening', icon: '👂', group: 'Anglais', parents: ['anglais'] },
  { id: 'en-speaking', label: 'Speaking', icon: '🗣️', group: 'Anglais', parents: ['anglais'] },
  { id: 'en-idioms', label: 'Idioms & Expressions', icon: '💬', group: 'Anglais', parents: ['anglais'] },
  { id: 'en-phonetics', label: 'Phonetics', icon: '🔊', group: 'Anglais', parents: ['anglais'] },

  // ESPAGNOL - Niveau 3
  { id: 'es-gramatica', label: 'Gramática', icon: '📝', group: 'Espagnol', parents: ['espagnol'] },
  { id: 'es-vocabulario', label: 'Vocabulario', icon: '📚', group: 'Espagnol', parents: ['espagnol'] },
  { id: 'es-ortografia', label: 'Ortografía', icon: '✍️', group: 'Espagnol', parents: ['espagnol'] },
  { id: 'es-conjugacion', label: 'Conjugación', icon: '🔄', group: 'Espagnol', parents: ['espagnol'] },
  { id: 'es-literatura', label: 'Literatura', icon: '📖', group: 'Espagnol', parents: ['espagnol'] },
  { id: 'es-expresion', label: 'Expresión escrita', icon: '✏️', group: 'Espagnol', parents: ['espagnol'] },
  { id: 'es-comprension', label: 'Comprensión', icon: '👂', group: 'Espagnol', parents: ['espagnol'] },
  { id: 'es-oral', label: 'Expresión oral', icon: '🗣️', group: 'Espagnol', parents: ['espagnol'] },

  // ALLEMAND - Niveau 3
  { id: 'de-grammatik', label: 'Grammatik', icon: '📝', group: 'Allemand', parents: ['allemand'] },
  { id: 'de-wortschatz', label: 'Wortschatz', icon: '📚', group: 'Allemand', parents: ['allemand'] },
  { id: 'de-rechtschreibung', label: 'Rechtschreibung', icon: '✍️', group: 'Allemand', parents: ['allemand'] },
  { id: 'de-konjugation', label: 'Konjugation', icon: '🔄', group: 'Allemand', parents: ['allemand'] },
  { id: 'de-deklination', label: 'Deklination (cas)', icon: '📋', group: 'Allemand', parents: ['allemand'] },
  { id: 'de-literatur', label: 'Literatur', icon: '📖', group: 'Allemand', parents: ['allemand'] },
  { id: 'de-ausdruck', label: 'Schriftlicher Ausdruck', icon: '✏️', group: 'Allemand', parents: ['allemand'] },
  { id: 'de-hoeren', label: 'Hörverstehen', icon: '👂', group: 'Allemand', parents: ['allemand'] },
  { id: 'de-sprechen', label: 'Sprechen', icon: '🗣️', group: 'Allemand', parents: ['allemand'] },

  // ITALIEN - Niveau 3
  { id: 'it-grammatica', label: 'Grammatica', icon: '📝', group: 'Italien', parents: ['italien'] },
  { id: 'it-vocabolario', label: 'Vocabolario', icon: '📚', group: 'Italien', parents: ['italien'] },
  { id: 'it-ortografia', label: 'Ortografia', icon: '✍️', group: 'Italien', parents: ['italien'] },
  { id: 'it-coniugazione', label: 'Coniugazione', icon: '🔄', group: 'Italien', parents: ['italien'] },
  { id: 'it-letteratura', label: 'Letteratura', icon: '📖', group: 'Italien', parents: ['italien'] },
  { id: 'it-espressione', label: 'Espressione scritta', icon: '✏️', group: 'Italien', parents: ['italien'] },
  { id: 'it-ascolto', label: 'Ascolto', icon: '👂', group: 'Italien', parents: ['italien'] },
  { id: 'it-parlato', label: 'Parlato', icon: '🗣️', group: 'Italien', parents: ['italien'] },

  // PORTUGAIS - Niveau 3
  { id: 'pt-gramatica', label: 'Gramática', icon: '📝', group: 'Portugais', parents: ['portugais'] },
  { id: 'pt-vocabulario', label: 'Vocabulário', icon: '📚', group: 'Portugais', parents: ['portugais'] },
  { id: 'pt-ortografia', label: 'Ortografia', icon: '✍️', group: 'Portugais', parents: ['portugais'] },
  { id: 'pt-conjugacao', label: 'Conjugação', icon: '🔄', group: 'Portugais', parents: ['portugais'] },
  { id: 'pt-literatura', label: 'Literatura', icon: '📖', group: 'Portugais', parents: ['portugais'] },
  { id: 'pt-expressao', label: 'Expressão escrita', icon: '✏️', group: 'Portugais', parents: ['portugais'] },
  { id: 'pt-compreensao', label: 'Compreensão', icon: '👂', group: 'Portugais', parents: ['portugais'] },
  { id: 'pt-oral', label: 'Expressão oral', icon: '🗣️', group: 'Portugais', parents: ['portugais'] },

  // CHINOIS - Niveau 3
  { id: 'zh-hanzi', label: 'Caractères (汉字)', icon: '🀄', group: 'Chinois', parents: ['chinois'] },
  { id: 'zh-pinyin', label: 'Pinyin', icon: '🔤', group: 'Chinois', parents: ['chinois'] },
  { id: 'zh-tons', label: 'Tons', icon: '🎵', group: 'Chinois', parents: ['chinois'] },
  { id: 'zh-grammaire', label: 'Grammaire', icon: '📝', group: 'Chinois', parents: ['chinois'] },
  { id: 'zh-vocabulaire', label: 'Vocabulaire', icon: '📚', group: 'Chinois', parents: ['chinois'] },
  { id: 'zh-comprehension', label: 'Compréhension', icon: '👂', group: 'Chinois', parents: ['chinois'] },
  { id: 'zh-oral', label: 'Expression orale', icon: '🗣️', group: 'Chinois', parents: ['chinois'] },
  { id: 'zh-calligraphie', label: 'Calligraphie', icon: '🖌️', group: 'Chinois', parents: ['chinois'] },

  // JAPONAIS - Niveau 3
  { id: 'ja-hiragana', label: 'Hiragana', icon: 'あ', group: 'Japonais', parents: ['japonais'] },
  { id: 'ja-katakana', label: 'Katakana', icon: 'ア', group: 'Japonais', parents: ['japonais'] },
  { id: 'ja-kanji', label: 'Kanji', icon: '漢', group: 'Japonais', parents: ['japonais'] },
  { id: 'ja-grammaire', label: 'Grammaire', icon: '📝', group: 'Japonais', parents: ['japonais'] },
  { id: 'ja-vocabulaire', label: 'Vocabulaire', icon: '📚', group: 'Japonais', parents: ['japonais'] },
  { id: 'ja-keigo', label: 'Keigo (politesse)', icon: '🎎', group: 'Japonais', parents: ['japonais'] },
  { id: 'ja-comprehension', label: 'Compréhension', icon: '👂', group: 'Japonais', parents: ['japonais'] },
  { id: 'ja-oral', label: 'Expression orale', icon: '🗣️', group: 'Japonais', parents: ['japonais'] },

  // RUSSE - Niveau 3
  { id: 'ru-alphabet', label: 'Alphabet cyrillique', icon: 'Я', group: 'Russe', parents: ['russe'] },
  { id: 'ru-grammaire', label: 'Grammaire', icon: '📝', group: 'Russe', parents: ['russe'] },
  { id: 'ru-vocabulaire', label: 'Vocabulaire', icon: '📚', group: 'Russe', parents: ['russe'] },
  { id: 'ru-declinaison', label: 'Déclinaisons (cas)', icon: '📋', group: 'Russe', parents: ['russe'] },
  { id: 'ru-conjugaison', label: 'Conjugaison', icon: '🔄', group: 'Russe', parents: ['russe'] },
  { id: 'ru-comprehension', label: 'Compréhension', icon: '👂', group: 'Russe', parents: ['russe'] },
  { id: 'ru-oral', label: 'Expression orale', icon: '🗣️', group: 'Russe', parents: ['russe'] },

  // ARABE - Niveau 3
  { id: 'ar-alphabet', label: 'Alphabet arabe', icon: 'ع', group: 'Arabe', parents: ['arabe'] },
  { id: 'ar-grammaire', label: 'Grammaire', icon: '📝', group: 'Arabe', parents: ['arabe'] },
  { id: 'ar-vocabulaire', label: 'Vocabulaire', icon: '📚', group: 'Arabe', parents: ['arabe'] },
  { id: 'ar-conjugaison', label: 'Conjugaison', icon: '🔄', group: 'Arabe', parents: ['arabe'] },
  { id: 'ar-comprehension', label: 'Compréhension', icon: '👂', group: 'Arabe', parents: ['arabe'] },
  { id: 'ar-oral', label: 'Expression orale', icon: '🗣️', group: 'Arabe', parents: ['arabe'] },
  { id: 'ar-calligraphie', label: 'Calligraphie', icon: '🖌️', group: 'Arabe', parents: ['arabe'] },

  // CORÉEN - Niveau 3
  { id: 'ko-hangul', label: 'Hangul (한글)', icon: '한', group: 'Coréen', parents: ['coreen'] },
  { id: 'ko-grammaire', label: 'Grammaire', icon: '📝', group: 'Coréen', parents: ['coreen'] },
  { id: 'ko-vocabulaire', label: 'Vocabulaire', icon: '📚', group: 'Coréen', parents: ['coreen'] },
  { id: 'ko-honorifiques', label: 'Niveaux de politesse', icon: '🎎', group: 'Coréen', parents: ['coreen'] },
  { id: 'ko-comprehension', label: 'Compréhension', icon: '👂', group: 'Coréen', parents: ['coreen'] },
  { id: 'ko-oral', label: 'Expression orale', icon: '🗣️', group: 'Coréen', parents: ['coreen'] },

  // LATIN - Niveau 3
  { id: 'la-declinaisons', label: 'Déclinaisons', icon: '📋', group: 'Latin', parents: ['latin'] },
  { id: 'la-conjugaisons', label: 'Conjugaisons', icon: '🔄', group: 'Latin', parents: ['latin'] },
  { id: 'la-vocabulaire', label: 'Vocabulaire', icon: '📚', group: 'Latin', parents: ['latin'] },
  { id: 'la-syntaxe', label: 'Syntaxe', icon: '📝', group: 'Latin', parents: ['latin'] },
  { id: 'la-litterature', label: 'Littérature latine', icon: '📖', group: 'Latin', parents: ['latin'] },
  { id: 'la-civilisation', label: 'Civilisation romaine', icon: '🏛️', group: 'Latin', parents: ['latin'] },

  // GREC ANCIEN - Niveau 3
  { id: 'grc-alphabet', label: 'Alphabet grec', icon: 'Ω', group: 'Grec ancien', parents: ['grec-ancien'] },
  { id: 'grc-declinaisons', label: 'Déclinaisons', icon: '📋', group: 'Grec ancien', parents: ['grec-ancien'] },
  { id: 'grc-conjugaisons', label: 'Conjugaisons', icon: '🔄', group: 'Grec ancien', parents: ['grec-ancien'] },
  { id: 'grc-vocabulaire', label: 'Vocabulaire', icon: '📚', group: 'Grec ancien', parents: ['grec-ancien'] },
  { id: 'grc-syntaxe', label: 'Syntaxe', icon: '📝', group: 'Grec ancien', parents: ['grec-ancien'] },
  { id: 'grc-litterature', label: 'Littérature grecque', icon: '📖', group: 'Grec ancien', parents: ['grec-ancien'] },
  { id: 'grc-civilisation', label: 'Civilisation grecque', icon: '🏛️', group: 'Grec ancien', parents: ['grec-ancien'] },

  // ============================================================================
  // ARTS - Niveau 2
  // ============================================================================
  { id: 'arts-visuels', label: 'Arts visuels', icon: '🖼️', group: 'Arts', parents: ['arts'] },
  { id: 'musique', label: 'Musique', icon: '🎵', group: 'Arts', parents: ['arts'] },
  { id: 'theatre', label: 'Théâtre', icon: '🎭', group: 'Arts', parents: ['arts'] },
  { id: 'cinema', label: 'Cinéma', icon: '🎬', group: 'Arts', parents: ['arts'] },
  { id: 'danse', label: 'Danse', icon: '💃', group: 'Arts', parents: ['arts'] },
  { id: 'arts-appliques', label: 'Arts appliqués', icon: '🎨', group: 'Arts', parents: ['arts'] },
  { id: 'histoire-art', label: 'Histoire de l\'art', icon: '📜', group: 'Arts', parents: ['arts'] },

  // ARTS VISUELS - Niveau 3
  { id: 'peinture', label: 'Peinture', icon: '🖌️', group: 'Arts', parents: ['arts-visuels'] },
  { id: 'dessin', label: 'Dessin', icon: '✏️', group: 'Arts', parents: ['arts-visuels'] },
  { id: 'sculpture', label: 'Sculpture', icon: '🗿', group: 'Arts', parents: ['arts-visuels'] },
  { id: 'photographie', label: 'Photographie', icon: '📷', group: 'Arts', parents: ['arts-visuels'] },
  { id: 'gravure', label: 'Gravure', icon: '🖼️', group: 'Arts', parents: ['arts-visuels'] },

  // MUSIQUE - Niveau 3
  { id: 'solfege', label: 'Solfège', icon: '🎼', group: 'Musique', parents: ['musique'] },
  { id: 'histoire-musique', label: 'Histoire de la musique', icon: '📜', group: 'Musique', parents: ['musique'] },
  { id: 'instruments', label: 'Instruments', icon: '🎸', group: 'Musique', parents: ['musique'] },
  { id: 'theorie-musicale', label: 'Théorie musicale', icon: '🎵', group: 'Musique', parents: ['musique'] },
  { id: 'composition', label: 'Composition', icon: '📝', group: 'Musique', parents: ['musique'] },

  // SOLFÈGE - Niveau 4
  { id: 'lecture-notes', label: 'Lecture de notes', icon: '🎵', group: 'Musique', parents: ['solfege'] },
  { id: 'rythme', label: 'Rythme', icon: '🥁', group: 'Musique', parents: ['solfege'] },
  { id: 'intervalles', label: 'Intervalles', icon: '📏', group: 'Musique', parents: ['solfege'] },
  { id: 'gammes', label: 'Gammes et modes', icon: '🎹', group: 'Musique', parents: ['solfege'] },
  { id: 'accords-musique', label: 'Accords', icon: '🎸', group: 'Musique', parents: ['solfege'] },

  // INSTRUMENTS - Niveau 4
  { id: 'piano', label: 'Piano', icon: '🎹', group: 'Musique', parents: ['instruments'] },
  { id: 'guitare', label: 'Guitare', icon: '🎸', group: 'Musique', parents: ['instruments'] },
  { id: 'violon', label: 'Violon', icon: '🎻', group: 'Musique', parents: ['instruments'] },
  { id: 'batterie', label: 'Batterie', icon: '🥁', group: 'Musique', parents: ['instruments'] },
  { id: 'instruments-vent', label: 'Vents', icon: '🎺', group: 'Musique', parents: ['instruments'] },

  // THÉORIE MUSICALE - Niveau 4
  { id: 'armures', label: 'Armures', icon: '♯', group: 'Musique', parents: ['theorie-musicale', 'solfege'] },
  { id: 'tonalites', label: 'Tonalités', icon: '🎵', group: 'Musique', parents: ['theorie-musicale', 'solfege'] },
  { id: 'modes', label: 'Modes', icon: '🎼', group: 'Musique', parents: ['gammes'] },
  { id: 'chromatique', label: 'Chromatisme', icon: '🎹', group: 'Musique', parents: ['gammes'] },

  // ENTRAÎNEMENT AUDITIF - Niveau 3
  { id: 'entrainement-auditif', label: 'Entraînement auditif', icon: '👂', group: 'Musique', parents: ['musique'] },
  { id: 'oreille', label: 'Oreille musicale', icon: '👂', group: 'Musique', parents: ['entrainement-auditif'] },
  { id: 'dictee-musicale', label: 'Dictée musicale', icon: '📝', group: 'Musique', parents: ['entrainement-auditif'] },

  // ACOUSTIQUE - Niveau 3 (physique du son)
  { id: 'acoustique', label: 'Acoustique', icon: '🔊', group: 'Musique', parents: ['musique'] },
  { id: 'harmoniques', label: 'Harmoniques', icon: '〜', group: 'Musique', parents: ['acoustique'] },
  { id: 'timbre', label: 'Timbre', icon: '🎵', group: 'Musique', parents: ['acoustique'] },
  { id: 'frequences', label: 'Fréquences', icon: '📊', group: 'Musique', parents: ['acoustique'] },

  // GENRES MUSICAUX - Niveau 3
  { id: 'genres-musicaux', label: 'Genres musicaux', icon: '🎸', group: 'Musique', parents: ['musique'] },
  { id: 'blues', label: 'Blues', icon: '🎷', group: 'Musique', parents: ['genres-musicaux'] },
  { id: 'rock', label: 'Rock', icon: '🎸', group: 'Musique', parents: ['genres-musicaux'] },
  { id: 'jazz', label: 'Jazz', icon: '🎺', group: 'Musique', parents: ['genres-musicaux'] },
  { id: 'classique', label: 'Classique', icon: '🎻', group: 'Musique', parents: ['genres-musicaux'] },
  { id: 'musiques-monde', label: 'Musiques du monde', icon: '🌍', group: 'Musique', parents: ['genres-musicaux'] },

  // ALIAS MUSIQUE (tags courants pointant vers les entrées principales)
  { id: 'ear-training', label: 'Ear Training', icon: '👂', group: 'Musique', parents: ['entrainement-auditif'] },
  { id: 'audio', label: 'Audio', icon: '🔊', group: 'Musique', parents: ['acoustique'] },
  { id: 'notes', label: 'Notes', icon: '🎵', group: 'Musique', parents: ['lecture-notes'] },
  { id: 'lecture', label: 'Lecture', icon: '📖', group: 'Musique', parents: ['lecture-notes'] },
  { id: 'theorie', label: 'Théorie', icon: '📚', group: 'Musique', parents: ['theorie-musicale'] },
  { id: 'accords', label: 'Accords', icon: '🎸', group: 'Musique', parents: ['accords-musique'] },

  // CINÉMA - Niveau 3
  { id: 'analyse-film', label: 'Analyse filmique', icon: '🎬', group: 'Cinéma', parents: ['cinema'] },
  { id: 'histoire-cinema', label: 'Histoire du cinéma', icon: '📜', group: 'Cinéma', parents: ['cinema'] },
  { id: 'realisation', label: 'Réalisation', icon: '🎥', group: 'Cinéma', parents: ['cinema'] },
  { id: 'scenarisation', label: 'Scénarisation', icon: '📝', group: 'Cinéma', parents: ['cinema'] },

  // THÉÂTRE - Niveau 3
  { id: 'histoire-theatre', label: 'Histoire du théâtre', icon: '📜', group: 'Théâtre', parents: ['theatre'] },
  { id: 'dramaturgie', label: 'Dramaturgie', icon: '📖', group: 'Théâtre', parents: ['theatre'] },
  { id: 'jeu-acteur', label: 'Jeu d\'acteur', icon: '🎭', group: 'Théâtre', parents: ['theatre'] },
  { id: 'mise-scene', label: 'Mise en scène', icon: '🎬', group: 'Théâtre', parents: ['theatre'] },

  // DANSE - Niveau 3
  { id: 'danse-classique', label: 'Danse classique', icon: '🩰', group: 'Danse', parents: ['danse'] },
  { id: 'danse-contemporaine', label: 'Danse contemporaine', icon: '💃', group: 'Danse', parents: ['danse'] },
  { id: 'histoire-danse', label: 'Histoire de la danse', icon: '📜', group: 'Danse', parents: ['danse'] },

  // ARTS APPLIQUÉS - Niveau 3
  { id: 'design-graphique', label: 'Design graphique', icon: '🎨', group: 'Arts', parents: ['arts-appliques'] },
  { id: 'design-produit', label: 'Design produit', icon: '🪑', group: 'Arts', parents: ['arts-appliques'] },
  { id: 'architecture', label: 'Architecture', icon: '🏛️', group: 'Arts', parents: ['arts-appliques'] },
  { id: 'mode', label: 'Mode', icon: '👗', group: 'Arts', parents: ['arts-appliques'] },

  // HISTOIRE DE L'ART - Niveau 3
  { id: 'art-antique', label: 'Art antique', icon: '🏛️', group: 'Arts', parents: ['histoire-art'] },
  { id: 'art-medieval', label: 'Art médiéval', icon: '🏰', group: 'Arts', parents: ['histoire-art'] },
  { id: 'art-renaissance', label: 'Renaissance', icon: '🎨', group: 'Arts', parents: ['histoire-art'] },
  { id: 'art-moderne', label: 'Art moderne', icon: '🖼️', group: 'Arts', parents: ['histoire-art'] },
  { id: 'art-contemporain', label: 'Art contemporain', icon: '🎭', group: 'Arts', parents: ['histoire-art'] },

  // ============================================================================
  // TECHNIQUES - Niveau 2
  // ============================================================================
  { id: 'electronique', label: 'Électronique', icon: '🔌', group: 'Techniques', parents: ['techniques'] },
  { id: 'mecanique', label: 'Mécanique', icon: '⚙️', group: 'Techniques', parents: ['techniques'] },
  { id: 'electricite', label: 'Électricité', icon: '⚡', group: 'Techniques', parents: ['techniques'] },
  { id: 'bricolage', label: 'Bricolage', icon: '🔨', group: 'Techniques', parents: ['techniques'] },
  { id: 'cuisine', label: 'Cuisine', icon: '👨‍🍳', group: 'Techniques', parents: ['techniques'] },
  { id: 'jardinage', label: 'Jardinage', icon: '🌱', group: 'Techniques', parents: ['techniques'] },
  { id: 'couture', label: 'Couture', icon: '🧵', group: 'Techniques', parents: ['techniques'] },
  { id: 'sport', label: 'Sport', icon: '⚽', group: 'Techniques', parents: ['techniques'] },

  // ÉLECTRONIQUE - Niveau 3
  { id: 'composants-elec', label: 'Composants', icon: '🔧', group: 'Techniques', parents: ['electronique'] },
  { id: 'arduino', label: 'Arduino', icon: '🤖', group: 'Techniques', parents: ['electronique'] },
  { id: 'raspberry-pi', label: 'Raspberry Pi', icon: '🍓', group: 'Techniques', parents: ['electronique'] },

  // MÉCANIQUE - Niveau 3
  { id: 'automobile', label: 'Automobile', icon: '🚗', group: 'Techniques', parents: ['mecanique'] },
  { id: 'velo', label: 'Vélo', icon: '🚲', group: 'Techniques', parents: ['mecanique'] },

  // CUISINE - Niveau 3
  { id: 'patisserie', label: 'Pâtisserie', icon: '🍰', group: 'Techniques', parents: ['cuisine'] },
  { id: 'cuisine-monde', label: 'Cuisines du monde', icon: '🌍', group: 'Techniques', parents: ['cuisine'] },
  { id: 'techniques-culinaires', label: 'Techniques culinaires', icon: '🔪', group: 'Techniques', parents: ['cuisine'] },

  // SPORT - Niveau 3
  { id: 'sports-collectifs', label: 'Sports collectifs', icon: '⚽', group: 'Techniques', parents: ['sport'] },
  { id: 'sports-individuels', label: 'Sports individuels', icon: '🏃', group: 'Techniques', parents: ['sport'] },
  { id: 'sports-combat', label: 'Arts martiaux', icon: '🥋', group: 'Techniques', parents: ['sport'] },
  { id: 'regles-sport', label: 'Règles', icon: '📖', group: 'Techniques', parents: ['sport'] },

  // ============================================================================
  // NIVEAUX SCOLAIRES (avec équivalences internationales)
  // Champ 'equivalents': { en: 'US', uk: 'UK', de: 'DE', es: 'ES' }
  // ============================================================================
  { id: 'maternelle', label: 'Maternelle', icon: '👶', group: 'Niveaux', parents: [],
    equivalents: { en: 'Kindergarten', uk: 'Reception/Nursery', de: 'Kindergarten', es: 'Educación Infantil' } },
  { id: 'primaire', label: 'Primaire', icon: '🎒', group: 'Niveaux', parents: [],
    equivalents: { en: 'Elementary School', uk: 'Primary School', de: 'Grundschule', es: 'Educación Primaria' } },
  { id: 'college', label: 'Collège', icon: '🏫', group: 'Niveaux', parents: [],
    equivalents: { en: 'Middle School', uk: 'Secondary School (KS3)', de: 'Sekundarstufe I', es: 'ESO' } },
  { id: 'lycee', label: 'Lycée', icon: '🎓', group: 'Niveaux', parents: [],
    equivalents: { en: 'High School', uk: 'Secondary School (KS4-5)', de: 'Gymnasium/Sekundarstufe II', es: 'Bachillerato' } },
  { id: 'superieur', label: 'Supérieur', icon: '🎓', group: 'Niveaux', parents: [],
    equivalents: { en: 'Higher Education', uk: 'Higher Education', de: 'Hochschulbildung', es: 'Educación Superior' } },
  { id: 'concours', label: 'Concours', icon: '🏆', group: 'Niveaux', parents: [],
    equivalents: { en: 'Competitive Exams', uk: 'Entrance Exams', de: 'Aufnahmeprüfungen', es: 'Oposiciones' } },

  // MATERNELLE - Détail
  { id: 'petite-section', label: 'Petite section', icon: '👶', group: 'Niveaux', parents: ['maternelle'],
    equivalents: { en: 'Pre-K (age 3)', uk: 'Nursery', de: 'Kindergarten (3 J.)', es: '1º Infantil' } },
  { id: 'moyenne-section', label: 'Moyenne section', icon: '👶', group: 'Niveaux', parents: ['maternelle'],
    equivalents: { en: 'Pre-K (age 4)', uk: 'Pre-Reception', de: 'Kindergarten (4 J.)', es: '2º Infantil' } },
  { id: 'grande-section', label: 'Grande section', icon: '👶', group: 'Niveaux', parents: ['maternelle'],
    equivalents: { en: 'Kindergarten', uk: 'Reception', de: 'Vorschule', es: '3º Infantil' } },

  // PRIMAIRE - Détail
  { id: 'cp', label: 'CP', icon: '1️⃣', group: 'Niveaux', parents: ['primaire'],
    equivalents: { en: 'Grade 1', uk: 'Year 2', de: '1. Klasse', es: '1º Primaria' } },
  { id: 'ce1', label: 'CE1', icon: '2️⃣', group: 'Niveaux', parents: ['primaire'],
    equivalents: { en: 'Grade 2', uk: 'Year 3', de: '2. Klasse', es: '2º Primaria' } },
  { id: 'ce2', label: 'CE2', icon: '3️⃣', group: 'Niveaux', parents: ['primaire'],
    equivalents: { en: 'Grade 3', uk: 'Year 4', de: '3. Klasse', es: '3º Primaria' } },
  { id: 'cm1', label: 'CM1', icon: '4️⃣', group: 'Niveaux', parents: ['primaire'],
    equivalents: { en: 'Grade 4', uk: 'Year 5', de: '4. Klasse', es: '4º Primaria' } },
  { id: 'cm2', label: 'CM2', icon: '5️⃣', group: 'Niveaux', parents: ['primaire'],
    equivalents: { en: 'Grade 5', uk: 'Year 6', de: '5. Klasse', es: '5º Primaria' } },

  // COLLÈGE - Détail
  { id: 'sixieme', label: '6e', icon: '6️⃣', group: 'Niveaux', parents: ['college'],
    equivalents: { en: 'Grade 6', uk: 'Year 7', de: '6. Klasse', es: '6º Primaria' } },
  { id: 'cinquieme', label: '5e', icon: '5️⃣', group: 'Niveaux', parents: ['college'],
    equivalents: { en: 'Grade 7', uk: 'Year 8', de: '7. Klasse', es: '1º ESO' } },
  { id: 'quatrieme', label: '4e', icon: '4️⃣', group: 'Niveaux', parents: ['college'],
    equivalents: { en: 'Grade 8', uk: 'Year 9', de: '8. Klasse', es: '2º ESO' } },
  { id: 'troisieme', label: '3e', icon: '3️⃣', group: 'Niveaux', parents: ['college'],
    equivalents: { en: 'Grade 9', uk: 'Year 10', de: '9. Klasse', es: '3º ESO' } },
  { id: 'brevet', label: 'Brevet', icon: '📝', group: 'Niveaux', parents: ['troisieme'],
    equivalents: { en: 'Middle School Diploma', uk: 'GCSEs', de: 'Mittlerer Schulabschluss', es: 'Graduado ESO' } },

  // LYCÉE - Détail
  { id: 'seconde', label: 'Seconde', icon: '🔟', group: 'Niveaux', parents: ['lycee'],
    equivalents: { en: 'Grade 10', uk: 'Year 11', de: '10. Klasse', es: '4º ESO' } },
  { id: 'premiere', label: 'Première', icon: '1️⃣', group: 'Niveaux', parents: ['lycee'],
    equivalents: { en: 'Grade 11', uk: 'Year 12 (Lower Sixth)', de: '11. Klasse', es: '1º Bachillerato' } },
  { id: 'terminale', label: 'Terminale', icon: '🎯', group: 'Niveaux', parents: ['lycee'],
    equivalents: { en: 'Grade 12', uk: 'Year 13 (Upper Sixth)', de: '12. Klasse', es: '2º Bachillerato' } },
  { id: 'bac', label: 'Baccalauréat', icon: '🎓', group: 'Niveaux', parents: ['terminale'],
    equivalents: { en: 'High School Diploma / SAT', uk: 'A-Levels', de: 'Abitur', es: 'Selectividad/EBAU' } },

  // SUPÉRIEUR - Détail
  { id: 'licence', label: 'Licence', icon: 'L', group: 'Niveaux', parents: ['superieur'],
    equivalents: { en: 'Bachelor\'s Degree', uk: 'Bachelor\'s Degree', de: 'Bachelor', es: 'Grado' } },
  { id: 'master', label: 'Master', icon: 'M', group: 'Niveaux', parents: ['superieur'],
    equivalents: { en: 'Master\'s Degree', uk: 'Master\'s Degree', de: 'Master', es: 'Máster' } },
  { id: 'doctorat', label: 'Doctorat', icon: 'D', group: 'Niveaux', parents: ['superieur'],
    equivalents: { en: 'PhD / Doctorate', uk: 'PhD / Doctorate', de: 'Promotion', es: 'Doctorado' } },
  { id: 'prepa', label: 'Classes préparatoires', icon: '📖', group: 'Niveaux', parents: ['superieur'],
    equivalents: { en: 'Prep School', uk: 'Foundation Year', de: 'Studienkolleg', es: 'Curso preparatorio' } },
  { id: 'bts-dut', label: 'BTS / DUT', icon: '📚', group: 'Niveaux', parents: ['superieur'],
    equivalents: { en: 'Associate Degree', uk: 'HND', de: 'Ausbildung', es: 'Ciclo Formativo Superior' } },

  // AUTRES NIVEAUX
  { id: 'autodidacte', label: 'Autodidacte / Grand public', icon: '📖', group: 'Niveaux', parents: [],
    equivalents: { en: 'Self-learner / General Public', uk: 'Self-learner', de: 'Autodidakt', es: 'Autodidacta' } },
  { id: 'formation-pro', label: 'Formation professionnelle', icon: '💼', group: 'Niveaux', parents: [],
    equivalents: { en: 'Vocational Training', uk: 'Vocational Training', de: 'Berufsausbildung', es: 'Formación Profesional' } },

  // ============================================================================
  // TYPES D'APPRENTISSAGE
  // ============================================================================
  { id: 'memorisation-type', label: 'Mémorisation', icon: '🧠', group: 'Type', parents: [] },
  { id: 'comprehension-type', label: 'Compréhension', icon: '💡', group: 'Type', parents: [] },
  { id: 'application-type', label: 'Application', icon: '✏️', group: 'Type', parents: [] },
  { id: 'entrainement-type', label: 'Entraînement', icon: '💪', group: 'Type', parents: [] },
  { id: 'revision', label: 'Révision', icon: '🔄', group: 'Type', parents: [] },
  { id: 'examen', label: 'Examen', icon: '📝', group: 'Type', parents: [] },
  { id: 'decouverte', label: 'Découverte', icon: '🔭', group: 'Type', parents: [] },

  // ============================================================================
  // NIVEAUX DE DIFFICULTÉ
  // ============================================================================
  { id: 'debutant', label: 'Initiation', icon: '🌱', group: 'Difficulté', parents: [] },
  { id: 'intermediaire', label: 'Intermédiaire', icon: '📈', group: 'Difficulté', parents: [] },
  { id: 'avance', label: 'Avancé', icon: '🎯', group: 'Difficulté', parents: [] },
  { id: 'expert', label: 'Expertise', icon: '🏆', group: 'Difficulté', parents: [] },

  // ============================================================================
  // DIVERS
  // ============================================================================
  { id: 'culture', label: 'Culture', icon: '🌟', group: 'Divers', parents: ['culture-generale'] },
  { id: 'culture-generale', label: 'Culture générale', icon: '🌟', group: 'Divers', parents: [] },
  { id: 'quiz', label: 'Quiz', icon: '❓', group: 'Divers', parents: [] },
  { id: 'jeux', label: 'Jeux', icon: '🎮', group: 'Divers', parents: [] },
];

// Export pour Node.js (tests)
if (typeof module !== 'undefined') module.exports = TAXONOMY;
