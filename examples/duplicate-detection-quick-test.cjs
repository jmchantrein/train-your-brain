#!/usr/bin/env node

/**
 * Test Rapide - Détection de Doublons
 *
 * Ce script démontre rapidement la nouvelle fonctionnalité
 * de détection de doublons dans DeckValidator.
 */

// Charger le module (pour Node.js)
// (package.json est "type": "module" : le loader CJS exécute le module source)
const DeckValidator = typeof window === 'undefined'
  ? require('../scripts/deck-validator-loader.cjs')
  : window.DeckValidator;

console.log('═══════════════════════════════════════════════════');
console.log('   🔍 TEST RAPIDE - DÉTECTION DE DOUBLONS');
console.log('═══════════════════════════════════════════════════\n');

// Deck de test avec plusieurs types de doublons
const testCards = [
  // Doublon EXACT (question + réponse identiques)
  { id: 'card1', question: 'Quelle est la capitale de la France ?', answer: 'Paris' },
  { id: 'card2', question: 'Quelle est la capitale de la France ?', answer: 'Paris' },

  // Questions similaires, même réponse
  { id: 'card3', question: 'Quelle est la capitale de la France métropolitaine ?', answer: 'Paris' },

  // Questions similaires, réponses différentes
  { id: 'card4', question: 'En quelle année a commencé la Révolution française ?', answer: '1789' },
  { id: 'card5', question: 'En quelle année s\'est terminée la Révolution française ?', answer: '1799' },

  // Pas de doublon
  { id: 'card6', question: 'Combien font 2 + 2 ?', answer: '4' }
];

console.log(`📦 Deck de test : ${testCards.length} cartes\n`);

// Détecter les doublons
const duplicates = DeckValidator.findDuplicates(testCards);

console.log(`🔍 Résultats de détection :\n`);
console.log(`   Doublons trouvés : ${duplicates.length}\n`);

if (duplicates.length === 0) {
  console.log('   ✅ Aucun doublon détecté !\n');
} else {
  duplicates.forEach((dup, index) => {
    console.log(`   ${index + 1}. ${dup.card1} ↔ ${dup.card2}`);
    console.log(`      Type       : ${dup.type}`);
    console.log(`      Questions  : ${dup.similarity}% similaires`);
    console.log(`      Réponses   : ${dup.answerSimilarity}% similaires`);
    console.log(`      Sévérité   : ${dup.severity}`);
    console.log(`      Message    : ${dup.message}`);
    console.log('');
  });
}

// Statistiques
const exactCount = duplicates.filter(d => d.type === 'exact').length;
const fullCount = duplicates.filter(d => d.type === 'full').length;
const questionCount = duplicates.filter(d => d.type === 'question').length;

console.log('═══════════════════════════════════════════════════');
console.log('   📊 STATISTIQUES');
console.log('═══════════════════════════════════════════════════\n');
console.log(`   Doublons exacts      : ${exactCount}`);
console.log(`   Q + R similaires     : ${fullCount}`);
console.log(`   Questions similaires : ${questionCount}`);
console.log('');

// Test de performance
console.log('═══════════════════════════════════════════════════');
console.log('   ⚡ TEST DE PERFORMANCE');
console.log('═══════════════════════════════════════════════════\n');

const largeDeck = [];
for (let i = 0; i < 100; i++) {
  largeDeck.push({
    id: `card${i}`,
    question: `Question numéro ${i} sur un sujet ${Math.floor(i / 10)}`,
    answer: `Réponse ${i}`
  });
}

const startTime = Date.now();
const largeDuplicates = DeckValidator.findDuplicates(largeDeck);
const duration = Date.now() - startTime;

console.log(`   Cartes traitées  : ${largeDeck.length}`);
console.log(`   Temps            : ${duration}ms`);
console.log(`   Performance      : ${Math.round(largeDeck.length / (duration / 1000))} cartes/sec`);
console.log(`   Doublons trouvés : ${largeDuplicates.length}`);
console.log('');

console.log('═══════════════════════════════════════════════════');
console.log('   ✅ TEST TERMINÉ AVEC SUCCÈS !');
console.log('═══════════════════════════════════════════════════\n');

console.log('Pour plus d\'exemples, voir :');
console.log('  - examples/duplicate-detection-demo.js');
console.log('  - docs/DUPLICATE_DETECTION.md');
console.log('  - tests/deck-validator-duplicates.test.js (38 tests)');
console.log('');
