/**
 * Démonstration de la détection de doublons/similarité dans DeckValidator
 *
 * Ce fichier montre comment utiliser les différentes fonctionnalités de
 * détection de doublons et de similarité de cartes.
 */

import { createRequire } from 'node:module';
const DeckValidator = createRequire(import.meta.url)('../scripts/deck-validator-loader.cjs');

// Exemple 1: Détection de doublons exacts
console.log('═══ Exemple 1: Doublons Exacts ═══\n');

const deck1 = {
  id: 'geo-france',
  name: 'Géographie de France',
  cards: [
    { id: 'card1', question: 'Quelle est la capitale de la France ?', answer: 'Paris' },
    { id: 'card2', question: 'Quelle est la capitale de la France ?', answer: 'Paris' }, // DOUBLON EXACT
    { id: 'card3', question: 'Combien de régions en France métropolitaine ?', answer: '13' }
  ]
};

const duplicates1 = DeckValidator.findDuplicates(deck1.cards);

console.log(`Cartes analysées : ${deck1.cards.length}`);
console.log(`Doublons détectés : ${duplicates1.length}`);
duplicates1.forEach(dup => {
  console.log(`  - ${dup.card1} ↔ ${dup.card2}`);
  console.log(`    Type: ${dup.type}`);
  console.log(`    Similarité: ${dup.similarity}%`);
  console.log(`    Message: ${dup.message}`);
});
console.log('');

// Exemple 2: Détection de questions similaires
console.log('═══ Exemple 2: Questions Similaires ═══\n');

const deck2 = {
  id: 'geo-capitales',
  name: 'Capitales européennes',
  cards: [
    { id: 'card1', question: 'Quelle est la capitale de la France métropolitaine ?', answer: 'Paris' },
    { id: 'card2', question: 'Quelle est la capitale de la France continentale ?', answer: 'Paris' },
    { id: 'card3', question: 'Quelle est la capitale de l\'Allemagne ?', answer: 'Berlin' }
  ]
};

const duplicates2 = DeckValidator.findDuplicates(deck2.cards);

console.log(`Cartes analysées : ${deck2.cards.length}`);
console.log(`Similarités détectées : ${duplicates2.length}`);
duplicates2.forEach(dup => {
  console.log(`  - ${dup.card1} ↔ ${dup.card2}`);
  console.log(`    Similarité questions: ${dup.similarity}%`);
  console.log(`    Similarité réponses: ${dup.answerSimilarity}%`);
  console.log(`    Type: ${dup.type}`);
  console.log(`    Message: ${dup.message}`);
});
console.log('');

// Exemple 3: Questions similaires, réponses différentes
console.log('═══ Exemple 3: Questions Similaires, Réponses Différentes ═══\n');

const deck3 = {
  id: 'history-dates',
  name: 'Dates historiques',
  cards: [
    { id: 'card1', question: 'En quelle année a eu lieu la Révolution française ?', answer: '1789' },
    { id: 'card2', question: 'En quelle année s\'est déroulée la Révolution française ?', answer: '1789' },
    { id: 'card3', question: 'En quelle année a commencé la Révolution française ?', answer: '1789' },
    { id: 'card4', question: 'En quelle année s\'est terminée la Révolution française ?', answer: '1799' }
  ]
};

const duplicates3 = DeckValidator.findDuplicates(deck3.cards);

console.log(`Cartes analysées : ${deck3.cards.length}`);
console.log(`Similarités détectées : ${duplicates3.length}`);
duplicates3.forEach(dup => {
  console.log(`  - ${dup.card1} ↔ ${dup.card2}`);
  console.log(`    Questions: ${dup.similarity}%`);
  console.log(`    Réponses: ${dup.answerSimilarity}%`);
  console.log(`    Type: ${dup.type} (${dup.type === 'question' ? 'questions similaires mais réponses différentes' : 'tout similaire'})`);
});
console.log('');

// Exemple 4: Seuils personnalisés
console.log('═══ Exemple 4: Seuils Personnalisés ═══\n');

const deck4 = {
  id: 'math-operations',
  name: 'Opérations mathématiques',
  cards: [
    { id: 'card1', question: 'Combien font 2 plus 2 ?', answer: '4' },
    { id: 'card2', question: 'Combien font 2 + 2 ?', answer: '4' },
    { id: 'card3', question: 'Résultat de 2 + 2 ?', answer: '4' }
  ]
};

console.log('Avec seuil standard (0.8):');
const standard = DeckValidator.findDuplicates(deck4.cards);
console.log(`  Doublons détectés: ${standard.length}`);

console.log('\nAvec seuil bas (0.5):');
const low = DeckValidator.findDuplicates(deck4.cards, { questionThreshold: 0.5 });
console.log(`  Doublons détectés: ${low.length}`);
low.forEach(dup => {
  console.log(`    - ${dup.card1} ↔ ${dup.card2} (${dup.similarity}%)`);
});

console.log('\nAvec seuil très strict (0.95):');
const strict = DeckValidator.findDuplicates(deck4.cards, { questionThreshold: 0.95 });
console.log(`  Doublons détectés: ${strict.length}`);
console.log('');

// Exemple 5: Utilisation de Levenshtein pour textes courts
console.log('═══ Exemple 5: Levenshtein pour Textes Courts ═══\n');

const deck5 = {
  id: 'vocabulary',
  name: 'Vocabulaire simple',
  cards: [
    { id: 'card1', question: 'Paris', answer: 'Capitale' },
    { id: 'card2', question: 'Pari', answer: 'Capitale' },  // 1 lettre différente
    { id: 'card3', question: 'Paros', answer: 'Capitale' }  // 1 lettre différente
  ]
};

console.log('Sans Levenshtein (Jaccard uniquement):');
const withoutLev = DeckValidator.findDuplicates(deck5.cards);
console.log(`  Doublons détectés: ${withoutLev.length}`);

console.log('\nAvec Levenshtein activé:');
const withLev = DeckValidator.findDuplicates(deck5.cards, {
  questionThreshold: 0.7,
  useLevenshtein: true
});
console.log(`  Doublons détectés: ${withLev.length}`);
withLev.forEach(dup => {
  console.log(`    - ${dup.card1} ↔ ${dup.card2}`);
  console.log(`      Similarité: ${dup.similarity}%`);
  console.log(`      Méthode: ${dup.details.method}`);
});
console.log('');

// Exemple 6: Validation complète de deck avec rapport
console.log('═══ Exemple 6: Rapport de Validation Complet ═══\n');

const fullDeck = {
  id: 'mixed-deck',
  name: 'Deck Mixte avec Doublons',
  cards: [
    { id: 'card1', question: 'Capitale de France ?', answer: 'Paris' },
    { id: 'card2', question: 'Capitale de France ?', answer: 'Paris' }, // Doublon exact
    { id: 'card3', question: 'Quelle est la capitale française ?', answer: 'Paris' }, // Similaire
    { id: 'card4', type: 'numeric', question: '2 + 2', answer: '4' },
    { id: 'card5', type: 'numeric', question: '2 + 2 =', answer: '4' }, // Similaire
    {
      id: 'card6',
      type: 'mcq',
      question: 'Couleur du ciel ?',
      answer: 'A',
      choices: [
        { id: 'A', text: 'Bleu' },
        { id: 'B', text: 'Rouge' }
      ]
    }
  ]
};

const report = DeckValidator.validateDeck(fullDeck);

console.log(`📊 RAPPORT DE VALIDATION`);
console.log(`─────────────────────────────────────`);
console.log(`Deck: ${fullDeck.name}`);
console.log(`Score moyen: ${report.averageScore}% (${report.grade})`);
console.log(`Cartes totales: ${report.stats.totalCards}`);
console.log(`Cartes valides: ${report.stats.validCards}`);
console.log(`Cartes avec erreurs: ${report.stats.cardsWithErrors}`);
console.log(`Cartes avec warnings: ${report.stats.cardsWithWarnings}`);
console.log('');

console.log(`🔍 DOUBLONS DÉTECTÉS: ${report.duplicates.length}`);
report.duplicates.forEach((dup, i) => {
  console.log(`\n  ${i + 1}. ${dup.card1} ↔ ${dup.card2}`);
  console.log(`     Type: ${dup.type}`);
  console.log(`     Similarité: ${dup.similarity}%`);
  console.log(`     Réponses: ${dup.answerSimilarity}%`);
  console.log(`     Sévérité: ${dup.severity}`);
  console.log(`     Message: ${dup.message}`);
});
console.log('');

// Exemple 7: Comparaison des algorithmes
console.log('═══ Exemple 7: Comparaison Jaccard vs Levenshtein ═══\n');

const testCards = [
  { id: 'A', question: 'Programme informatique', answer: 'x' },
  { id: 'B', question: 'Logiciel informatique', answer: 'y' }
];

console.log('Texte 1: "Programme informatique"');
console.log('Texte 2: "Logiciel informatique"');
console.log('');

const jaccardSim = DeckValidator._jaccardSimilarity(
  testCards[0].question,
  testCards[1].question
);
console.log(`Jaccard: ${Math.round(jaccardSim * 100)}%`);
console.log('  → Basé sur ensembles de mots (bon pour textes longs)');

const levenshteinSim = DeckValidator._levenshteinSimilarity(
  testCards[0].question,
  testCards[1].question
);
console.log(`Levenshtein: ${Math.round(levenshteinSim * 100)}%`);
console.log('  → Basé sur édition de caractères (bon pour textes courts)');
console.log('');

// Exemple 8: Performance avec gros deck
console.log('═══ Exemple 8: Test de Performance ═══\n');

const bigDeck = {
  id: 'large-deck',
  name: 'Grand Deck',
  cards: []
};

for (let i = 0; i < 200; i++) {
  bigDeck.cards.push({
    id: `card${i}`,
    question: `Question numéro ${i} sur un sujet spécifique ${Math.floor(i / 10)}`,
    answer: `Réponse ${i}`
  });
}

console.log(`Cartes dans le deck: ${bigDeck.cards.length}`);

const startTime = performance.now();
const bigDuplicates = DeckValidator.findDuplicates(bigDeck.cards);
const duration = performance.now() - startTime;

console.log(`Temps de traitement: ${Math.round(duration)}ms`);
console.log(`Doublons détectés: ${bigDuplicates.length}`);
console.log(`Performance: ${Math.round(bigDeck.cards.length / (duration / 1000))} cartes/seconde`);
console.log('');

console.log('═══════════════════════════════════════════════════════════');
console.log('✅ Démonstration terminée !');
console.log('');
console.log('Points clés:');
console.log('  1. Détection exacte ET similarité');
console.log('  2. Comparaison question + réponse');
console.log('  3. Seuils configurables');
console.log('  4. Deux algorithmes: Jaccard et Levenshtein');
console.log('  5. Performance optimisée');
console.log('  6. Intégré dans validateDeck()');
console.log('═══════════════════════════════════════════════════════════');
