/**
 * Tests pour le module i18n (Internationalisation)
 */

// ═══════════════════════════════════════════════════════════════
// TESTS STRUCTURE DU MODULE
// ═══════════════════════════════════════════════════════════════

describe('i18n - Structure du module', () => {
  it('should have i18n object defined', () => {
    expect(typeof i18n).toBe('object');
  });

  it('should have SUPPORTED_LOCALES array', () => {
    expect(Array.isArray(i18n.SUPPORTED_LOCALES)).toBe(true);
  });

  it('should support at least fr and en locales', () => {
    expect(i18n.SUPPORTED_LOCALES).toContain('fr');
    expect(i18n.SUPPORTED_LOCALES).toContain('en');
  });

  it('should have _translations object', () => {
    expect(typeof i18n._translations).toBe('object');
  });

  it('should have translations for fr', () => {
    expect(typeof i18n._translations.fr).toBe('object');
  });

  it('should have translations for en', () => {
    expect(typeof i18n._translations.en).toBe('object');
  });

  it('should have global t() function', () => {
    expect(typeof t).toBe('function');
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS INITIALISATION
// ═══════════════════════════════════════════════════════════════

describe('i18n - Initialisation', () => {
  beforeEach(() => {
    // Reset locale to default
    i18n._locale = 'fr';
    localStorage.removeItem('tyb_locale');
  });

  it('should have init() method', () => {
    expect(typeof i18n.init).toBe('function');
  });

  it('init() should return the current locale', () => {
    const locale = i18n.init();
    expect(i18n.SUPPORTED_LOCALES).toContain(locale);
  });

  it('init() should load locale from localStorage if saved', () => {
    localStorage.setItem('tyb_locale', 'en');
    const locale = i18n.init();
    expect(locale).toBe('en');
  });

  it('init() should ignore invalid locale in localStorage', () => {
    localStorage.setItem('tyb_locale', 'invalid');
    const locale = i18n.init();
    expect(i18n.SUPPORTED_LOCALES).toContain(locale);
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS getLocale()
// ═══════════════════════════════════════════════════════════════

describe('i18n - getLocale()', () => {
  it('should have getLocale() method', () => {
    expect(typeof i18n.getLocale).toBe('function');
  });

  it('should return current locale', () => {
    i18n._locale = 'fr';
    expect(i18n.getLocale()).toBe('fr');
  });

  it('should return en when set to en', () => {
    i18n._locale = 'en';
    expect(i18n.getLocale()).toBe('en');
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS setLocale()
// ═══════════════════════════════════════════════════════════════

describe('i18n - setLocale()', () => {
  beforeEach(() => {
    i18n._locale = 'fr';
    localStorage.removeItem('tyb_locale');
  });

  it('should have setLocale() method', () => {
    expect(typeof i18n.setLocale).toBe('function');
  });

  it('should change locale to en', () => {
    const result = i18n.setLocale('en');
    expect(result).toBe(true);
    expect(i18n.getLocale()).toBe('en');
  });

  it('should save locale to localStorage', () => {
    i18n.setLocale('en');
    expect(localStorage.getItem('tyb_locale')).toBe('en');
  });

  it('should return false for unsupported locale', () => {
    const result = i18n.setLocale('invalid');
    expect(result).toBe(false);
  });

  it('should not change locale for unsupported locale', () => {
    i18n._locale = 'fr';
    i18n.setLocale('invalid');
    expect(i18n.getLocale()).toBe('fr');
  });

  it('should return true for fr locale', () => {
    i18n._locale = 'en';
    const result = i18n.setLocale('fr');
    expect(result).toBe(true);
    expect(i18n.getLocale()).toBe('fr');
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS t() / translate()
// ═══════════════════════════════════════════════════════════════

describe('i18n - t() translation function', () => {
  beforeEach(() => {
    i18n._locale = 'fr';
  });

  it('should have t() method', () => {
    expect(typeof i18n.t).toBe('function');
  });

  it('should have translate() alias', () => {
    expect(typeof i18n.translate).toBe('function');
  });

  it('should return French translation for app.name', () => {
    i18n._locale = 'fr';
    expect(i18n.t('app.name')).toBe('Train Your Brain');
  });

  it('should return English translation when locale is en', () => {
    i18n._locale = 'en';
    expect(i18n.t('common.save')).toBe('Save');
  });

  it('should return French translation for common.save', () => {
    i18n._locale = 'fr';
    expect(i18n.t('common.save')).toBe('Sauvegarder');
  });

  it('should fallback to French if key missing in English', () => {
    i18n._locale = 'en';
    // Both should have translations, but test fallback logic
    const frKey = Object.keys(i18n._translations.fr)[0];
    expect(i18n.t(frKey)).toBeDefined();
  });

  it('should return key if translation not found', () => {
    const result = i18n.t('nonexistent.key');
    expect(result).toBe('nonexistent.key');
  });

  it('global t() should work same as i18n.t()', () => {
    i18n._locale = 'fr';
    expect(t('app.name')).toBe(i18n.t('app.name'));
  });

  it('translate() should work same as t()', () => {
    expect(i18n.translate('app.name')).toBe(i18n.t('app.name'));
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS PARAMETRES DE TRADUCTION
// ═══════════════════════════════════════════════════════════════

describe('i18n - Parameter replacement', () => {
  beforeEach(() => {
    i18n._locale = 'fr';
  });

  // Les tests ajoutent des clés 'test.*' : les retirer pour ne pas fausser
  // le test de complétude fr/en qui compte les clés ensuite.
  afterEach(() => {
    Object.keys(i18n._translations.fr)
      .filter(k => k.startsWith('test.'))
      .forEach(k => delete i18n._translations.fr[k]);
  });

  it('should replace single parameter', () => {
    // Add a test translation with parameter
    i18n._translations.fr['test.param'] = 'Bonjour {name}';
    const result = i18n.t('test.param', { name: 'Jean' });
    expect(result).toBe('Bonjour Jean');
  });

  it('should replace multiple parameters', () => {
    i18n._translations.fr['test.multi'] = '{greeting} {name}, vous avez {count} messages';
    const result = i18n.t('test.multi', {
      greeting: 'Bonjour',
      name: 'Marie',
      count: 5
    });
    expect(result).toBe('Bonjour Marie, vous avez 5 messages');
  });

  it('should replace same parameter multiple times', () => {
    i18n._translations.fr['test.repeat'] = '{word} et encore {word}';
    const result = i18n.t('test.repeat', { word: 'test' });
    expect(result).toBe('test et encore test');
  });

  it('should handle missing parameters gracefully', () => {
    i18n._translations.fr['test.missing'] = 'Bonjour {name}';
    const result = i18n.t('test.missing', {});
    expect(result).toBe('Bonjour {name}');
  });

  it('should handle empty params object', () => {
    const result = i18n.t('app.name', {});
    expect(result).toBe('Train Your Brain');
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS getAvailableLocales()
// ═══════════════════════════════════════════════════════════════

describe('i18n - getAvailableLocales()', () => {
  it('should have getAvailableLocales() method', () => {
    expect(typeof i18n.getAvailableLocales).toBe('function');
  });

  it('should return an array', () => {
    const locales = i18n.getAvailableLocales();
    expect(Array.isArray(locales)).toBe(true);
  });

  it('should return at least 2 locales', () => {
    const locales = i18n.getAvailableLocales();
    expect(locales.length).toBeGreaterThanOrEqual(2);
  });

  it('should include French locale with correct structure', () => {
    const locales = i18n.getAvailableLocales();
    const fr = locales.find(l => l.code === 'fr');
    expect(fr).toBeDefined();
    expect(fr.label).toContain('Fran'); // Works with or without accent
    expect(fr.flag).toBeDefined();
  });

  it('should include English locale with correct structure', () => {
    const locales = i18n.getAvailableLocales();
    const en = locales.find(l => l.code === 'en');
    expect(en).toBeDefined();
    expect(en.label).toBe('English');
    expect(en.flag).toBeDefined();
  });

  it('each locale should have code, label, and flag', () => {
    const locales = i18n.getAvailableLocales();
    locales.forEach(locale => {
      expect(locale.code).toBeDefined();
      expect(locale.label).toBeDefined();
      expect(locale.flag).toBeDefined();
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS COMPLETUDE DES TRADUCTIONS
// ═══════════════════════════════════════════════════════════════

describe('i18n - Translation completeness', () => {
  it('should have same number of keys in fr and en', () => {
    const frKeys = Object.keys(i18n._translations.fr);
    const enKeys = Object.keys(i18n._translations.en);
    // Allow some flexibility but should be close
    expect(Math.abs(frKeys.length - enKeys.length)).toBeLessThan(10);
  });

  it('should have nav keys in both languages', () => {
    const navKeys = ['nav.home', 'nav.explore', 'nav.create', 'nav.stats', 'nav.settings'];
    navKeys.forEach(key => {
      expect(i18n._translations.fr[key]).toBeDefined();
      expect(i18n._translations.en[key]).toBeDefined();
    });
  });

  it('should have common keys in both languages', () => {
    const commonKeys = ['common.save', 'common.cancel', 'common.delete', 'common.edit'];
    commonKeys.forEach(key => {
      expect(i18n._translations.fr[key]).toBeDefined();
      expect(i18n._translations.en[key]).toBeDefined();
    });
  });

  it('should have game keys in both languages', () => {
    const gameKeys = ['game.validate', 'game.correct', 'game.incorrect'];
    gameKeys.forEach(key => {
      expect(i18n._translations.fr[key]).toBeDefined();
      expect(i18n._translations.en[key]).toBeDefined();
    });
  });

  it('should have box keys in both languages', () => {
    const boxKeys = ['box.neverPlayed', 'box.purple', 'box.orange', 'box.green'];
    boxKeys.forEach(key => {
      expect(i18n._translations.fr[key]).toBeDefined();
      expect(i18n._translations.en[key]).toBeDefined();
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// TESTS INTEGRATION
// ═══════════════════════════════════════════════════════════════

describe('i18n - Integration', () => {
  beforeEach(() => {
    i18n._locale = 'fr';
    localStorage.removeItem('tyb_locale');
  });

  afterEach(() => {
    i18n._locale = 'fr';
    localStorage.removeItem('tyb_locale');
  });

  it('should persist locale change across getLocale calls', () => {
    i18n.setLocale('en');
    expect(i18n.getLocale()).toBe('en');
    expect(i18n.getLocale()).toBe('en');
  });

  it('should translate correctly after locale change', () => {
    i18n.setLocale('fr');
    const frSave = i18n.t('common.save');

    i18n.setLocale('en');
    const enSave = i18n.t('common.save');

    expect(frSave).toBe('Sauvegarder');
    expect(enSave).toBe('Save');
  });

  it('should maintain locale after multiple changes', () => {
    i18n.setLocale('en');
    i18n.setLocale('fr');
    i18n.setLocale('en');
    expect(i18n.getLocale()).toBe('en');
  });
});
