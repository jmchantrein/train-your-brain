/**
 * Tests pour le module Leitner
 * Algorithme de répétition espacée
 */

describe('Leitner Module', () => {

  // ═══════════════════════════════════════════════════════════════
  // getNextBox() - Détermine la prochaine boîte
  // ═══════════════════════════════════════════════════════════════

  describe('getNextBox', () => {
    it('should return purple for incorrect answer from any box', () => {
      expect(Leitner.getNextBox('never_played', false, 1000, 2000)).toBe('purple');
      expect(Leitner.getNextBox('purple', false, 1000, 2000)).toBe('purple');
      expect(Leitner.getNextBox('orange', false, 1000, 2000)).toBe('purple');
      expect(Leitner.getNextBox('green', false, 1000, 2000)).toBe('purple');
    });

    it('should return green for correct answer from never_played', () => {
      expect(Leitner.getNextBox('never_played', true, 5000, 2000)).toBe('green');
      expect(Leitner.getNextBox('never_played', true, 1000, 2000)).toBe('green');
    });

    it('should return green for correct and fast answer (≤ threshold)', () => {
      expect(Leitner.getNextBox('purple', true, 1000, 2000)).toBe('green');
      expect(Leitner.getNextBox('orange', true, 2000, 2000)).toBe('green');
      expect(Leitner.getNextBox('green', true, 1500, 2000)).toBe('green');
    });

    it('should return orange for correct and slow answer (> threshold)', () => {
      expect(Leitner.getNextBox('purple', true, 3000, 2000)).toBe('orange');
      expect(Leitner.getNextBox('orange', true, 2500, 2000)).toBe('orange');
      expect(Leitner.getNextBox('green', true, 5000, 2000)).toBe('orange');
    });

    it('should throw error for invalid box', () => {
      expect(() => Leitner.getNextBox('invalid', true, 1000, 2000)).toThrow('Invalid box');
    });

    it('should throw error for non-boolean isCorrect', () => {
      expect(() => Leitner.getNextBox('purple', 'yes', 1000, 2000)).toThrow('isCorrect must be boolean');
    });

    it('should throw error for negative times', () => {
      expect(() => Leitner.getNextBox('purple', true, -100, 2000)).toThrow('Times must be positive');
      expect(() => Leitner.getNextBox('purple', true, 1000, -2000)).toThrow('Times must be positive');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // updateLatencyThreshold() - Met à jour le seuil de latence
  // ═══════════════════════════════════════════════════════════════

  describe('updateLatencyThreshold', () => {
    it('should set initial threshold for never_played card', () => {
      const card = createTestCard({ box: 'never_played', latencyThreshold: null });

      // 1234ms → ceil(1.234) = 2 secondes
      expect(Leitner.updateLatencyThreshold(card, true, 1234)).toBe(2);

      // 2000ms → ceil(2.0) = 2 secondes
      expect(Leitner.updateLatencyThreshold(card, true, 2000)).toBe(2);

      // 2500ms → ceil(2.5) = 3 secondes
      expect(Leitner.updateLatencyThreshold(card, true, 2500)).toBe(3);
    });

    it('should keep threshold on incorrect answer', () => {
      const card = createTestCard({ box: 'purple', latencyThreshold: 5 });

      expect(Leitner.updateLatencyThreshold(card, false, 1000)).toBe(5);
      expect(Leitner.updateLatencyThreshold(card, false, 10000)).toBe(5);
    });

    it('should increment threshold when correct but slow', () => {
      const card = createTestCard({ box: 'orange', latencyThreshold: 3 });

      // 4000ms > 3000ms (threshold) → +1
      expect(Leitner.updateLatencyThreshold(card, true, 4000)).toBe(4);

      const card2 = createTestCard({ box: 'green', latencyThreshold: 5 });
      // 6000ms > 5000ms → +1
      expect(Leitner.updateLatencyThreshold(card2, true, 6000)).toBe(6);
    });

    it('should recalculate threshold when correct and fast', () => {
      const card = createTestCard({ box: 'purple', latencyThreshold: 5 });

      // 2500ms < 5000ms (threshold) → ceil(2.5) = 3
      expect(Leitner.updateLatencyThreshold(card, true, 2500)).toBe(3);

      // 1000ms < 5000ms → ceil(1.0) = 1
      expect(Leitner.updateLatencyThreshold(card, true, 1000)).toBe(1);
    });

    it('should not mutate the original card object', () => {
      const card = createTestCard({ box: 'purple', latencyThreshold: 5 });
      const originalThreshold = card.latencyThreshold;

      Leitner.updateLatencyThreshold(card, true, 2000);

      expect(card.latencyThreshold).toBe(originalThreshold);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // calculateRestDays() - Calcule les jours de repos
  // ═══════════════════════════════════════════════════════════════

  describe('calculateRestDays', () => {
    it('should use minimum coefficient of 1.2', () => {
      // Réponse très lente : ratio = 2000 / 10000 = 0.2 → clamped to 1.2
      const days = Leitner.calculateRestDays(10000, 2000, 0);

      // 3 × 1.2 = 3.6 → round = 4
      expect(days).toBe(4);
    });

    it('should use maximum coefficient of 2.0', () => {
      // Réponse très rapide : ratio = 2000 / 500 = 4.0 → clamped to 2.0
      const days = Leitner.calculateRestDays(500, 2000, 0);

      // 3 × 2.0 = 6
      expect(days).toBe(6);
    });

    it('should return 3 * coefficient for first green (previousRestDays = 0)', () => {
      // Coefficient 1.5 : ratio = 3000 / 2000 = 1.5
      const days = Leitner.calculateRestDays(2000, 3000, 0);

      // 3 × 1.5 = 4.5 → round = 5 (arrondi au plus proche)
      expect(days).toBe(5);
    });

    it('should multiply previous rest days by coefficient', () => {
      // Coefficient 1.5 : ratio = 3000 / 2000 = 1.5
      const days = Leitner.calculateRestDays(2000, 3000, 6);

      // 6 × 1.5 = 9
      expect(days).toBe(9);
    });

    it('should handle progression with different coefficients', () => {
      // Coef 2.0 (très rapide)
      const days1 = Leitner.calculateRestDays(1000, 2000, 0); // 3 × 2.0 = 6
      expect(days1).toBe(6);

      const days2 = Leitner.calculateRestDays(1000, 2000, 6); // 6 × 2.0 = 12
      expect(days2).toBe(12);

      const days3 = Leitner.calculateRestDays(1000, 2000, 12); // 12 × 2.0 = 24
      expect(days3).toBe(24);
    });

    it('should throw error for negative times', () => {
      expect(() => Leitner.calculateRestDays(-100, 2000, 0)).toThrow('Times must be positive');
      expect(() => Leitner.calculateRestDays(1000, -2000, 0)).toThrow('Times must be positive');
    });

    it('should throw error for negative previousRestDays', () => {
      expect(() => Leitner.calculateRestDays(1000, 2000, -5)).toThrow('previousRestDays must be non-negative');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // isCardPlayable() - Vérifie si une carte peut être jouée
  // ═══════════════════════════════════════════════════════════════

  describe('isCardPlayable', () => {
    it('should return true for never_played cards', () => {
      const card = createTestCard({ box: 'never_played', restUntil: null });
      expect(Leitner.isCardPlayable(card, '2025-01-20')).toBe(true);
    });

    it('should return true for purple cards', () => {
      const card = createTestCard({ box: 'purple', restUntil: null });
      expect(Leitner.isCardPlayable(card, '2025-01-20')).toBe(true);
    });

    it('should return true for orange cards', () => {
      const card = createTestCard({ box: 'orange', restUntil: null });
      expect(Leitner.isCardPlayable(card, '2025-01-20')).toBe(true);
    });

    it('should return true for green cards when rest period is over', () => {
      const card = createTestCard({ box: 'green', restUntil: '2025-01-20' });

      expect(Leitner.isCardPlayable(card, '2025-01-20')).toBe(true);
      expect(Leitner.isCardPlayable(card, '2025-01-21')).toBe(true);
    });

    it('should return false for green cards still resting', () => {
      const card = createTestCard({ box: 'green', restUntil: '2025-01-25' });

      expect(Leitner.isCardPlayable(card, '2025-01-20')).toBe(false);
      expect(Leitner.isCardPlayable(card, '2025-01-24')).toBe(false);
    });

    it('should throw error for invalid box', () => {
      const card = createTestCard({ box: 'invalid' });
      expect(() => Leitner.isCardPlayable(card, '2025-01-20')).toThrow('Invalid box');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getCardsForSession() - Sélectionne les cartes pour une session
  // ═══════════════════════════════════════════════════════════════

  describe('getCardsForSession', () => {
    it('should prioritize never_played cards first', () => {
      const deck = createTestDeck({
        cards: [
          createTestCard({ id: 'card1', box: 'orange' }),
          createTestCard({ id: 'card2', box: 'never_played' }),
          createTestCard({ id: 'card3', box: 'purple' }),
          createTestCard({ id: 'card4', box: 'never_played' })
        ]
      });

      const cards = Leitner.getCardsForSession(deck, {
        maxCards: 10,
        today: '2025-01-20',
        sequential: true  // Évite le shuffle pour test déterministe
      });

      // Les deux never_played doivent être en premier (ordre préservé avec sequential)
      expect(cards[0].id).toBe('card2');
      expect(cards[1].id).toBe('card4');
    });

    it('should respect box priority order: never_played → purple → orange → green', () => {
      const deck = createTestDeck({
        cards: [
          createTestCard({ id: 'card1', box: 'green', restUntil: '2025-01-25' }), // Encore en repos
          createTestCard({ id: 'card2', box: 'orange' }),
          createTestCard({ id: 'card3', box: 'never_played' }),
          createTestCard({ id: 'card4', box: 'purple' })
        ]
      });

      const cards = Leitner.getCardsForSession(deck, {
        maxCards: 10,
        today: '2025-01-20',
        ignoreRest: true // Pour inclure la carte verte en repos
      });

      expect(cards[0].box).toBe('never_played');
      expect(cards[1].box).toBe('purple');
      expect(cards[2].box).toBe('orange');
      expect(cards[3].box).toBe('green');
    });

    it('should return expired green cards to never_played (pioche)', () => {
      const deck = createTestDeck({
        cards: [
          createTestCard({ id: 'card1', box: 'green', restUntil: '2025-01-15', latencyThreshold: 3 }),
          createTestCard({ id: 'card2', box: 'purple' })
        ]
      });

      const cards = Leitner.getCardsForSession(deck, {
        maxCards: 10,
        today: '2025-01-20',
        sequential: true
      });

      // La carte verte expirée doit être revenue dans la pioche
      expect(cards[0].id).toBe('card1');
      expect(cards[0].box).toBe('never_played');
      expect(cards[0].restUntil).toBe(null);
      expect(cards[0].latencyThreshold).toBe(3); // Préservé
      expect(cards[1].id).toBe('card2');
      expect(cards[1].box).toBe('purple');
    });

    it('should filter out resting green cards by default', () => {
      const deck = createTestDeck({
        cards: [
          createTestCard({ id: 'card1', box: 'green', restUntil: '2025-01-25' }), // Still resting
          createTestCard({ id: 'card2', box: 'green', restUntil: '2025-01-20' }), // Ready
          createTestCard({ id: 'card3', box: 'purple' })
        ]
      });

      const cards = Leitner.getCardsForSession(deck, {
        maxCards: 10,
        today: '2025-01-20'
      });

      expect(cards).toHaveLength(2);
      expect(cards.find(c => c.id === 'card1')).toBeUndefined();
      expect(cards.find(c => c.id === 'card2')).toBeDefined();
    });

    it('should include resting green cards when ignoreRest is true', () => {
      const deck = createTestDeck({
        cards: [
          createTestCard({ id: 'card1', box: 'green', restUntil: '2025-01-25' }), // Still resting
          createTestCard({ id: 'card2', box: 'green', restUntil: '2025-01-20' }), // Ready
          createTestCard({ id: 'card3', box: 'purple' })
        ]
      });

      const cards = Leitner.getCardsForSession(deck, {
        maxCards: 10,
        today: '2025-01-20',
        ignoreRest: true
      });

      expect(cards).toHaveLength(3);
      expect(cards.find(c => c.id === 'card1')).toBeDefined();
    });

    it('should respect maxCards limit', () => {
      const deck = createTestDeck({
        cards: [
          createTestCard({ id: 'card1', box: 'purple' }),
          createTestCard({ id: 'card2', box: 'purple' }),
          createTestCard({ id: 'card3', box: 'purple' }),
          createTestCard({ id: 'card4', box: 'purple' }),
          createTestCard({ id: 'card5', box: 'purple' })
        ]
      });

      const cards = Leitner.getCardsForSession(deck, {
        maxCards: 3,
        today: '2025-01-20'
      });

      expect(cards).toHaveLength(3);
    });

    it('should shuffle cards by default', () => {
      const deck = createTestDeck({
        cards: Array.from({ length: 20 }, (_, i) =>
          createTestCard({ id: `card${i}`, box: 'purple' })
        )
      });

      const cards1 = Leitner.getCardsForSession(deck, {
        maxCards: 20,
        today: '2025-01-20'
      });

      const cards2 = Leitner.getCardsForSession(deck, {
        maxCards: 20,
        today: '2025-01-20'
      });

      // Il est très improbable que deux shuffles donnent le même ordre
      const sameOrder = cards1.every((card, i) => card.id === cards2[i].id);
      expect(sameOrder).toBe(false);
    });

    it('should not shuffle when sequential is true', () => {
      const deck = createTestDeck({
        cards: [
          createTestCard({ id: 'card1', box: 'purple' }),
          createTestCard({ id: 'card2', box: 'purple' }),
          createTestCard({ id: 'card3', box: 'purple' })
        ]
      });

      const cards1 = Leitner.getCardsForSession(deck, {
        maxCards: 10,
        today: '2025-01-20',
        sequential: true
      });

      const cards2 = Leitner.getCardsForSession(deck, {
        maxCards: 10,
        today: '2025-01-20',
        sequential: true
      });

      // L'ordre doit être identique
      expect(cards1[0].id).toBe(cards2[0].id);
      expect(cards1[1].id).toBe(cards2[1].id);
      expect(cards1[2].id).toBe(cards2[2].id);
    });

    it('should filter by boxes option', () => {
      const deck = createTestDeck({
        cards: [
          createTestCard({ id: 'card1', box: 'never_played' }),
          createTestCard({ id: 'card2', box: 'purple' }),
          createTestCard({ id: 'card3', box: 'orange' }),
          createTestCard({ id: 'card4', box: 'green', restUntil: '2025-01-15' })
        ]
      });

      const cards = Leitner.getCardsForSession(deck, {
        maxCards: 10,
        today: '2025-01-20',
        boxes: ['purple', 'orange']
      });

      expect(cards).toHaveLength(2);
      expect(cards.find(c => c.id === 'card1')).toBeUndefined();
      expect(cards.find(c => c.id === 'card2')).toBeDefined();
      expect(cards.find(c => c.id === 'card3')).toBeDefined();
      expect(cards.find(c => c.id === 'card4')).toBeUndefined();
    });

    it('should use default options when not specified', () => {
      const deck = createTestDeck({
        cards: [
          createTestCard({ id: 'card1', box: 'purple' })
        ]
      });

      const cards = Leitner.getCardsForSession(deck, { today: '2025-01-20' });

      // Should not throw and return cards
      expect(cards).toBeDefined();
      expect(Array.isArray(cards)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Constants validation
  // ═══════════════════════════════════════════════════════════════

  describe('Constants', () => {
    it('should have BOXES constant', () => {
      expect(Leitner.BOXES).toEqual(['never_played', 'purple', 'orange', 'green']);
    });

    it('should have BOX_PRIORITY constant', () => {
      expect(Leitner.BOX_PRIORITY).toEqual({
        never_played: 0,
        purple: 1,
        orange: 2,
        green: 3
      });
    });

    it('should have DEFAULT_REST_DAYS constant', () => {
      expect(Leitner.DEFAULT_REST_DAYS).toBe(3);
    });

    it('should have MIN_COEFFICIENT constant', () => {
      expect(Leitner.MIN_COEFFICIENT).toBe(1.2);
    });

    it('should have MAX_COEFFICIENT constant', () => {
      expect(Leitner.MAX_COEFFICIENT).toBe(2.0);
    });
  });
});

