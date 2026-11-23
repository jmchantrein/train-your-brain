/**
 * Tests pour le module State
 * State management réactif avec pattern Observer
 */

describe('State Module', () => {

  beforeEach(() => {
    // Réinitialiser l'état avant chaque test
    State.reset();
  });

  // ═══════════════════════════════════════════════════════════════
  // get() / set() - Lecture et écriture basiques
  // ═══════════════════════════════════════════════════════════════

  describe('get / set', () => {
    it('should set and get simple values', () => {
      State.set('name', 'John');
      expect(State.get('name')).toBe('John');

      State.set('age', 25);
      expect(State.get('age')).toBe(25);

      State.set('active', true);
      expect(State.get('active')).toBe(true);
    });

    it('should set and get objects', () => {
      const player = { id: '1', name: 'Test' };
      State.set('player', player);
      expect(State.get('player')).toEqual(player);
    });

    it('should set and get arrays', () => {
      const items = [1, 2, 3];
      State.set('items', items);
      expect(State.get('items')).toEqual(items);
    });

    it('should return undefined for unset keys', () => {
      expect(State.get('nonexistent')).toBeUndefined();
    });

    it('should overwrite existing values', () => {
      State.set('key', 'value1');
      State.set('key', 'value2');
      expect(State.get('key')).toBe('value2');
    });

    it('should return the set value', () => {
      const result = State.set('key', 'value');
      expect(result).toBe('value');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // update() - Merge partiel
  // ═══════════════════════════════════════════════════════════════

  describe('update', () => {
    it('should merge updates with existing object', () => {
      State.set('player', { id: '1', name: 'John', score: 0 });
      State.update('player', { score: 10 });

      const updated = State.get('player');
      expect(updated.id).toBe('1');
      expect(updated.name).toBe('John');
      expect(updated.score).toBe(10);
    });

    it('should create object if key does not exist', () => {
      State.update('settings', { theme: 'dark' });
      expect(State.get('settings')).toEqual({ theme: 'dark' });
    });

    it('should handle null existing value', () => {
      State.set('config', null);
      State.update('config', { enabled: true });
      expect(State.get('config')).toEqual({ enabled: true });
    });

    it('should overwrite properties with new values', () => {
      State.set('player', { name: 'John', score: 5 });
      State.update('player', { name: 'Jane', level: 2 });

      const updated = State.get('player');
      expect(updated.name).toBe('Jane');
      expect(updated.score).toBe(5);
      expect(updated.level).toBe(2);
    });

    it('should return the updated value', () => {
      State.set('player', { score: 0 });
      const result = State.update('player', { score: 10 });
      expect(result).toEqual({ score: 10 });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // subscribe() - Abonnement aux changements
  // ═══════════════════════════════════════════════════════════════

  describe('subscribe', () => {
    it('should call callback when value is set', () => {
      let callCount = 0;
      let receivedValue = null;
      let receivedOldValue = null;

      State.subscribe('name', (newValue, oldValue) => {
        callCount++;
        receivedValue = newValue;
        receivedOldValue = oldValue;
      });

      State.set('name', 'John');

      expect(callCount).toBe(1);
      expect(receivedValue).toBe('John');
      expect(receivedOldValue).toBeUndefined();
    });

    it('should pass old value to callback', () => {
      let receivedOldValue = null;

      State.set('count', 5);

      State.subscribe('count', (newValue, oldValue) => {
        receivedOldValue = oldValue;
      });

      State.set('count', 10);

      expect(receivedOldValue).toBe(5);
    });

    it('should return unsubscribe function', () => {
      const unsubscribe = State.subscribe('key', () => {});
      expect(typeof unsubscribe).toBe('function');
    });

    it('should not call callback after unsubscribe', () => {
      let callCount = 0;

      const unsubscribe = State.subscribe('name', () => {
        callCount++;
      });

      State.set('name', 'John');
      expect(callCount).toBe(1);

      unsubscribe();

      State.set('name', 'Jane');
      expect(callCount).toBe(1); // Pas de nouvel appel
    });

    it('should allow multiple subscribers to same key', () => {
      let call1 = 0;
      let call2 = 0;

      State.subscribe('name', () => { call1++; });
      State.subscribe('name', () => { call2++; });

      State.set('name', 'John');

      expect(call1).toBe(1);
      expect(call2).toBe(1);
    });

    it('should call all subscribers when value changes', () => {
      const values = [];

      State.subscribe('count', (v) => values.push(v));
      State.subscribe('count', (v) => values.push(v * 2));
      State.subscribe('count', (v) => values.push(v * 3));

      State.set('count', 5);

      expect(values).toEqual([5, 10, 15]);
    });

    it('should not call subscribers for other keys', () => {
      let call1 = 0;
      let call2 = 0;

      State.subscribe('key1', () => { call1++; });
      State.subscribe('key2', () => { call2++; });

      State.set('key1', 'value1');

      expect(call1).toBe(1);
      expect(call2).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // _notify() - Notification des subscribers
  // ═══════════════════════════════════════════════════════════════

  describe('_notify', () => {
    it('should handle subscriber errors gracefully', () => {
      let successCallCount = 0;

      // Premier subscriber qui échoue
      State.subscribe('key', () => {
        throw new Error('Subscriber error');
      });

      // Second subscriber qui devrait quand même être appelé
      State.subscribe('key', () => {
        successCallCount++;
      });

      // Ne devrait pas lancer d'erreur
      expect(() => {
        State.set('key', 'value');
      }).not.toThrow();

      // Le second subscriber a été appelé malgré l'erreur du premier
      expect(successCallCount).toBe(1);
    });

    it('should not call subscribers if there are none', () => {
      // Ne devrait pas lancer d'erreur
      expect(() => {
        State.set('key', 'value');
      }).not.toThrow();
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // update() avec subscribers - Notifications
  // ═══════════════════════════════════════════════════════════════

  describe('update with subscribers', () => {
    it('should notify subscribers when update is called', () => {
      let callCount = 0;
      let receivedValue = null;

      State.set('player', { score: 0 });

      State.subscribe('player', (newValue) => {
        callCount++;
        receivedValue = newValue;
      });

      State.update('player', { score: 10 });

      expect(callCount).toBe(1);
      expect(receivedValue.score).toBe(10);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // getAll() - Récupérer tout l'état (debug)
  // ═══════════════════════════════════════════════════════════════

  describe('getAll', () => {
    it('should return copy of all data', () => {
      State.set('key1', 'value1');
      State.set('key2', 'value2');

      const all = State.getAll();

      expect(all).toEqual({
        key1: 'value1',
        key2: 'value2'
      });
    });

    it('should return shallow copy (not reference)', () => {
      State.set('key', 'value');

      const all1 = State.getAll();
      const all2 = State.getAll();

      expect(all1).not.toBe(all2); // Différentes instances
      expect(all1).toEqual(all2); // Même contenu
    });

    it('should return empty object if no data', () => {
      const all = State.getAll();
      expect(all).toEqual({});
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // reset() - Réinitialisation
  // ═══════════════════════════════════════════════════════════════

  describe('reset', () => {
    it('should clear all data', () => {
      State.set('key1', 'value1');
      State.set('key2', 'value2');

      State.reset();

      expect(State.get('key1')).toBeUndefined();
      expect(State.get('key2')).toBeUndefined();
      expect(State.getAll()).toEqual({});
    });

    it('should clear all subscribers', () => {
      let callCount = 0;

      State.subscribe('key', () => { callCount++; });

      State.reset();

      State.set('key', 'value');

      // Le subscriber ne devrait pas être appelé car il a été supprimé
      expect(callCount).toBe(0);
    });

    it('should allow setting values after reset', () => {
      State.set('key', 'value1');
      State.reset();
      State.set('key', 'value2');

      expect(State.get('key')).toBe('value2');
    });

    it('should allow new subscriptions after reset', () => {
      let callCount = 0;

      State.subscribe('key', () => { callCount++; });
      State.reset();

      State.subscribe('key', () => { callCount++; });
      State.set('key', 'value');

      expect(callCount).toBe(1);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // Integration Tests - Scénarios réalistes
  // ═══════════════════════════════════════════════════════════════

  describe('integration scenarios', () => {
    it('should handle player state updates', () => {
      const updates = [];

      // Initialiser le joueur
      State.set('player', { name: 'John', xp: 0, level: 1 });

      // S'abonner aux changements
      State.subscribe('player', (player) => {
        updates.push({ ...player });
      });

      // Gagner de l'XP
      State.update('player', { xp: 100 });
      expect(updates[0].xp).toBe(100);
      expect(updates[0].level).toBe(1);

      // Monter de niveau
      State.update('player', { level: 2, xp: 0 });
      expect(updates[1].level).toBe(2);
      expect(updates[1].xp).toBe(0);
    });

    it('should handle multiple independent state keys', () => {
      const playerUpdates = [];
      const sessionUpdates = [];

      State.subscribe('player', (p) => playerUpdates.push(p));
      State.subscribe('session', (s) => sessionUpdates.push(s));

      State.set('player', { name: 'John' });
      State.set('session', { active: true });

      expect(playerUpdates).toHaveLength(1);
      expect(sessionUpdates).toHaveLength(1);

      State.update('player', { score: 10 });

      expect(playerUpdates).toHaveLength(2);
      expect(sessionUpdates).toHaveLength(1); // Pas changé
    });
  });
});
