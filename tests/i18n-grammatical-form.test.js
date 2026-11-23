/**
 * Tests de la forme grammaticale choisie par le joueur (i18n)
 *
 * Règle : les textes français qui désignent la personne qui joue sont au féminin par défaut ;
 * player.settings.grammaticalForm = 'feminine' | 'masculine' | 'inclusive' (point médian).
 * Une valeur de dictionnaire est une chaîne ou un objet { f, m, x }.
 */

function formPlayer(form, id) {
  const settings = { soundEnabled: true, theme: 'dark', language: 'fr' };
  if (form !== undefined) settings.grammaticalForm = form;
  return { id: id || 'p_form', name: 'Forme', settings, stats: {}, badges: [], createdAt: '2025-01-01T00:00:00.000Z' };
}

function withTestEntries(fn) {
  const fr = i18n._translations.fr;
  const en = i18n._translations.en;
  fr['test.variant'] = { f: 'Apprentie {n}', m: 'Apprenti {n}', x: 'Apprenti·e {n}' };
  en['test.variant'] = 'Learner {n}';
  fr['test.partial'] = { f: 'Joueuse seule' };
  en['test.partial'] = 'Player only';
  fr['test.plain'] = 'Bienvenue !';
  en['test.plain'] = 'Welcome!';
  try { fn(); } finally {
    delete fr['test.variant']; delete en['test.variant'];
    delete fr['test.partial']; delete en['test.partial'];
    delete fr['test.plain']; delete en['test.plain'];
  }
}

describe('i18n - grammatical form mechanism', () => {
  beforeEach(() => { i18n.setLocale('fr'); i18n.setGrammaticalForm('feminine'); });
  afterEach(() => { i18n.setLocale('fr'); i18n.setGrammaticalForm('feminine'); });

  it('exposes the three forms and the feminine default', () => {
    expect(i18n.GRAMMATICAL_FORMS).toEqual(['feminine', 'masculine', 'inclusive']);
    expect(i18n.DEFAULT_GRAMMATICAL_FORM).toBe('feminine');
  });

  it('picks the variant of the active form', () => {
    withTestEntries(() => {
      expect(i18n.t('test.variant', { n: 1 })).toBe('Apprentie 1');
      i18n.setGrammaticalForm('masculine');
      expect(i18n.t('test.variant', { n: 2 })).toBe('Apprenti 2');
      i18n.setGrammaticalForm('inclusive');
      expect(i18n.t('test.variant', { n: 3 })).toBe('Apprenti·e 3');
    });
  });

  it('falls back to the feminine variant when a variant is missing', () => {
    withTestEntries(() => {
      i18n.setGrammaticalForm('masculine');
      expect(i18n.t('test.partial')).toBe('Joueuse seule');
      i18n.setGrammaticalForm('inclusive');
      expect(i18n.t('test.partial')).toBe('Joueuse seule');
    });
  });

  it('leaves plain strings unchanged in every form', () => {
    withTestEntries(() => {
      for (const form of i18n.GRAMMATICAL_FORMS) {
        i18n.setGrammaticalForm(form);
        expect(i18n.t('test.plain')).toBe('Bienvenue !');
      }
    });
  });

  it('uses the English string whatever the form', () => {
    withTestEntries(() => {
      i18n.setLocale('en');
      i18n.setGrammaticalForm('inclusive');
      expect(i18n.t('test.variant', { n: 4 })).toBe('Learner 4');
    });
  });

  it('rejects an unknown form and keeps the current one', () => {
    i18n.setGrammaticalForm('masculine');
    expect(i18n.setGrammaticalForm('neutral')).toBe(false);
    expect(i18n.getGrammaticalForm()).toBe('masculine');
  });

  it('resolveGrammaticalForm maps unknown values to the default', () => {
    expect(i18n.resolveGrammaticalForm('inclusive')).toBe('inclusive');
    expect(i18n.resolveGrammaticalForm('masculine')).toBe('masculine');
    expect(i18n.resolveGrammaticalForm(undefined)).toBe('feminine');
    expect(i18n.resolveGrammaticalForm('x')).toBe('feminine');
    expect(i18n.resolveGrammaticalForm(42)).toBe('feminine');
  });

  it('notifies listeners when the form changes, not when it stays the same', () => {
    let calls = 0;
    const off = i18n.onLocaleChange(() => { calls++; });
    i18n.setGrammaticalForm('masculine');
    i18n.setGrammaticalForm('masculine');
    i18n.setGrammaticalForm('inclusive');
    off();
    expect(calls).toBe(2);
  });
});

describe('i18n - the player carries the grammatical form', () => {
  beforeEach(() => { i18n.setLocale('fr'); i18n.setGrammaticalForm('feminine'); });
  afterEach(() => { i18n.setLocale('fr'); i18n.setGrammaticalForm('feminine'); });

  it('is feminine for a player who chose nothing (existing players)', () => {
    i18n.setGrammaticalForm('masculine');
    i18n.applyPlayerLanguage(formPlayer(undefined));
    expect(i18n.getGrammaticalForm()).toBe('feminine');
  });

  it('applies the form chosen by the player', () => {
    i18n.applyPlayerLanguage(formPlayer('inclusive'));
    expect(i18n.getGrammaticalForm()).toBe('inclusive');
    i18n.applyPlayerLanguage(formPlayer('masculine'));
    expect(i18n.getGrammaticalForm()).toBe('masculine');
  });

  it('follows the player when switching profile', () => {
    i18n.applyPlayerLanguage(formPlayer('masculine', 'a'));
    i18n.applyPlayerLanguage(formPlayer('inclusive', 'b'));
    expect(i18n.getGrammaticalForm()).toBe('inclusive');
    i18n.applyPlayerLanguage(formPlayer(undefined, 'c'));
    expect(i18n.getGrammaticalForm()).toBe('feminine');
  });

  it('handles a missing player like no choice', () => {
    i18n.setGrammaticalForm('masculine');
    i18n.applyPlayerLanguage(null);
    expect(i18n.getGrammaticalForm()).toBe('feminine');
  });

  it('ignores an unknown stored value', () => {
    i18n.applyPlayerLanguage(formPlayer('banana'));
    expect(i18n.getGrammaticalForm()).toBe('feminine');
  });
});

describe('Storage - grammaticalForm setting', () => {
  it('keeps the three valid values', () => {
    for (const form of ['feminine', 'masculine', 'inclusive']) {
      expect(Storage.sanitizeSettings({ grammaticalForm: form }).grammaticalForm).toBe(form);
    }
  });

  it('replaces an unknown value by the default', () => {
    expect(Storage.sanitizeSettings({ grammaticalForm: 'plural' }).grammaticalForm).toBe('feminine');
    expect(Storage.sanitizeSettings({ grammaticalForm: 7 }).grammaticalForm).toBe('feminine');
    expect(Storage.sanitizeSettings({ grammaticalForm: true }).grammaticalForm).toBe('feminine');
  });

  it('does not invent a value when the setting is absent', () => {
    expect('grammaticalForm' in Storage.sanitizeSettings({ language: 'fr' })).toBe(false);
  });

  it('is kept by sanitizePlayer', () => {
    const p = Storage.sanitizePlayer(formPlayer('inclusive'));
    expect(p.settings.grammaticalForm).toBe('inclusive');
    const bad = Storage.sanitizePlayer(formPlayer('oops'));
    expect(bad.settings.grammaticalForm).toBe('feminine');
  });

  it('survives an export / import round trip', () => {
    localStorage.clear();
    const player = formPlayer('masculine', 'p_round');
    expect(Storage.savePlayer(player)).toBe(true);
    const exported = JSON.parse(JSON.stringify(Storage.exportAll()));
    expect(exported.player.settings.grammaticalForm).toBe('masculine');
    localStorage.clear();
    Storage.importAll(exported);
    expect(Storage.loadPlayer().settings.grammaticalForm).toBe('masculine');
    localStorage.clear();
  });
});

describe('i18n - French dictionary conventions', () => {
  const fr = () => i18n._translations.fr;
  const en = () => i18n._translations.en;
  // Les clés du mode défi sont gérées par un autre chantier
  const own = (k) => !k.startsWith('challenge.');
  const variantsOf = (v) => (v !== null && typeof v === 'object') ? v : null;

  it('every key with variants has f, m and x, and nothing else', () => {
    const bad = [];
    for (const loc of i18n.SUPPORTED_LOCALES) {
      for (const [k, v] of Object.entries(i18n._translations[loc])) {
        const obj = variantsOf(v);
        if (!obj) continue;
        const keys = Object.keys(obj).sort().join(',');
        if (keys !== 'f,m,x' || Object.values(obj).some(s => typeof s !== 'string' || s.trim() === '')) bad.push(loc + ':' + k);
      }
    }
    expect(bad).toEqual([]);
  });

  it('the three variants of a key use the same {parameters}', () => {
    const ph = s => (s.match(/\{[a-zA-Z]+\}/g) || []).sort().join(',');
    const bad = [];
    for (const [k, v] of Object.entries(fr())) {
      const obj = variantsOf(v);
      if (obj && !(ph(obj.f) === ph(obj.m) && ph(obj.f) === ph(obj.x))) bad.push(k);
    }
    expect(bad).toEqual([]);
  });

  it('the inclusive variant has at most one middle dot per word', () => {
    const bad = [];
    for (const [k, v] of Object.entries(fr())) {
      const obj = variantsOf(v);
      if (obj && /[\p{L}]+·[\p{L}]+·/u.test(obj.x)) bad.push(k);
    }
    expect(bad).toEqual([]);
  });

  it('the inclusive variant differs from the feminine one (otherwise a plain string is enough)', () => {
    const same = [];
    for (const [k, v] of Object.entries(fr())) {
      const obj = variantsOf(v);
      if (obj && obj.f === obj.m && obj.f === obj.x) same.push(k);
    }
    expect(same).toEqual([]);
  });

  it('no middle dot once resolved to the feminine or masculine form', () => {
    const bad = [];
    for (const [k, v] of Object.entries(fr())) {
      for (const form of ['feminine', 'masculine']) {
        const text = i18n.resolveVariant(v, form);
        if (typeof text !== 'string' || text.includes('·')) bad.push(k + ' (' + form + ')');
      }
    }
    expect(bad).toEqual([]);
  });

  it('the French dictionary is addressed with "tu": no vous / votre / vos', () => {
    const bad = [];
    for (const [k, v] of Object.entries(fr())) {
      if (!own(k)) continue;
      for (const form of i18n.GRAMMATICAL_FORMS) {
        const text = i18n.resolveVariant(v, form);
        if (/(^|[^\p{L}])(vous|votre|vos|veuillez)([^\p{L}]|$)/iu.test(text)) { bad.push(k); break; }
      }
    }
    expect(bad).toEqual([]);
  });

  it('no sentence starts with a vous-form imperative (-ez)', () => {
    const allowed = new Set(['assez', 'chez', 'nez', 'rez']);
    const bad = [];
    for (const [k, v] of Object.entries(fr())) {
      if (!own(k)) continue;
      const text = i18n.resolveVariant(v, 'feminine');
      const re = /(?:^|[.!?:]\s+)(\p{L}+ez)(?=[\s.!?,:;]|$)/gu;
      let m;
      while ((m = re.exec(text))) if (!allowed.has(m[1].toLowerCase())) bad.push(k + ': ' + m[1]);
    }
    expect(bad).toEqual([]);
  });

  it('plurals are never written with a parenthesis "(s)"', () => {
    const bad = [];
    for (const loc of i18n.SUPPORTED_LOCALES) {
      for (const [k, v] of Object.entries(i18n._translations[loc])) {
        if (/\([sx]\)/.test(i18n.resolveVariant(v, 'feminine'))) bad.push(loc + ':' + k);
      }
    }
    expect(bad).toEqual([]);
  });

  it('a variant is used only when the text designates the player: the three forms differ', () => {
    // garde-fou inverse : un texte à variantes dont f, m et x sont identiques ne devrait pas exister
    const bad = Object.entries(fr()).filter(([, v]) => variantsOf(v) && v.f === v.m && v.m === v.x).map(([k]) => k);
    expect(bad).toEqual([]);
  });

  it('the English dictionary does not use variants', () => {
    const withVariants = Object.entries(en()).filter(([, v]) => variantsOf(v)).map(([k]) => k);
    expect(withVariants).toEqual([]);
  });
});

describe('Badges, themes and tutorial follow the language and the form without reloading', () => {
  beforeEach(() => { i18n.setLocale('fr'); i18n.setGrammaticalForm('feminine'); });
  afterEach(() => { i18n.setLocale('fr'); i18n.setGrammaticalForm('feminine'); });

  it('the 20 gendered badge names have three different forms', () => {
    const gendered = BADGES.filter(b => {
      const v = i18n._translations.fr['badge.' + b.id + '.name'];
      return v !== null && typeof v === 'object';
    });
    expect(gendered.length).toBe(20);
  });

  it('badge names are feminine by default, then masculine, then with a middle dot', () => {
    const badge = BADGES.find(b => b.id === 'mastery_10');
    expect(badge.name).toBe('Apprentie');
    i18n.setGrammaticalForm('masculine');
    expect(badge.name).toBe('Apprenti');
    i18n.setGrammaticalForm('inclusive');
    expect(badge.name).toBe('Apprenti·e');
    expect(BADGES.find(b => b.id === 'explorer').name).toBe('Explorateur·ice');
    i18n.setGrammaticalForm('feminine');
    expect(BADGES.find(b => b.id === 'math_beginner').name).toBe('Matheuse Débutante');
  });

  it('no badge name or hint contains a middle dot unless the form is inclusive', () => {
    for (const form of ['feminine', 'masculine']) {
      i18n.setGrammaticalForm(form);
      const bad = BADGES.filter(b => /·/.test(b.name + b.description + (b.hint || '')));
      expect(bad.map(b => b.id)).toEqual([]);
    }
  });

  it('every badge has a name and a description in both languages, and a hint when secret', () => {
    for (const loc of ['fr', 'en']) {
      i18n.setLocale(loc);
      const missing = BADGES.filter(b => !b.name || b.name.includes('.') && b.name.startsWith('badge.')
        || !b.description || b.description.startsWith('badge.') || (b.hidden && (!b.hint || b.hint.startsWith('badge.'))));
      expect(missing.map(b => b.id)).toEqual([]);
    }
  });

  it('the English badge names do not depend on the form', () => {
    i18n.setLocale('en');
    const a = BADGES.map(b => b.name);
    i18n.setGrammaticalForm('inclusive');
    expect(BADGES.map(b => b.name)).toEqual(a);
  });

  it('the comeback badge no longer talks about absence', () => {
    const b = BADGES.find(x => x.id === 'comeback_kid');
    expect(b.name).toBe('Bon retour !');
    expect(b.description).toContain('pause');
    expect(/absence/.test(b.description)).toBe(false);
  });

  it('theme labels are accented French, then English, without reload', () => {
    expect(Themes.THEMES.ocean.name).toBe('Océan');
    expect(Themes.THEMES.forest.name).toBe('Forêt');
    expect(Themes.THEMES.arctic.unlockText).toBe('Maîtriser 50 cartes (boîte verte)');
    i18n.setLocale('en');
    expect(Themes.THEMES.ocean.name).toBe('Ocean');
    expect(Themes.THEMES.arctic.unlockText).toBe('Master 50 cards (green box)');
  });

  it('no theme or badge text is written without accents any more', () => {
    const texts = Object.values(Themes.THEMES).flatMap(t => [t.name, t.description, t.unlockText || '']);
    expect(/Theme |defaut|boite|Maitriser|consecutifs|defis|Foret/.test(texts.join(' '))).toBe(false);
  });

  it('the tutorial states the real XP bonus range and the real badge count', () => {
    const bonuses = XP.STREAK_BONUSES.map(b => b.xp);
    const xpStep = Tutorial.steps.find(s => s.id === 'xp');
    expect(xpStep.content).toContain('+' + Math.min(...bonuses));
    expect(xpStep.content).toContain('+' + Math.max(...bonuses));
    expect(/\+50 XP/.test(xpStep.content)).toBe(false);
    expect(xpStep.content).toMatch(/Réponse incorrecte[^<]*<strong>\+1 XP/);
    const badgeStep = Tutorial.steps.find(s => s.id === 'badges');
    expect(badgeStep.content).toContain('<strong>' + BADGES.length + ' badges</strong>');
  });

  it('the tutorial no longer claims anything is "scientifiquement prouvé" and glosses XP and deck', () => {
    const all = Tutorial.steps.map(s => s.title + ' ' + s.content).join(' ');
    expect(/scientifiquement prouvé/.test(all)).toBe(false);
    expect(all).toMatch(/XP \(points d'expérience\)/);
    expect(all).toMatch(/deck<\/strong> \(paquet de cartes\)/);
  });

  it('the tutorial is in English when the interface is', () => {
    i18n.setLocale('en');
    const all = Tutorial.steps.map(s => s.title + ' ' + s.content).join(' ');
    expect(all).toContain('Welcome to Train Your Brain!');
    expect(/Bienvenue|Réponse|boîtes/.test(all)).toBe(false);
    expect(LeitnerExplanation.render()).toContain('How does the Leitner system work?');
  });
});

describe('French wording decisions', () => {
  beforeEach(() => i18n.setLocale('fr'));
  afterEach(() => i18n.setLocale('fr'));

  it('uses "Réponse incorrecte" and an encouraging exam wording', () => {
    expect(i18n.t('game.feedback.incorrect')).toBe('Réponse incorrecte.');
    expect(i18n.t('exam.average')).toBe('Un bon début');
    expect(/Continuez/.test(i18n.t('exam.poor'))).toBe(false);
  });

  it('does not promise that the next answer will be right', () => {
    const texts = Object.entries(i18n._translations.fr).filter(([k]) => k.startsWith('game.feedback.')).map(([, v]) => v).join(' ');
    expect(/prochaine sera la bonne|tu y arriveras/i.test(texts)).toBe(false);
  });

  it('uses one label for the correct answer', () => {
    expect(i18n.t('game.answer')).toBe('Bonne réponse :');
    expect(i18n.t('game.rightAnswerLabel')).toBe('Bonne réponse :');
    expect(i18n.t('game.feedback.correctAnswer')).toBe('Bonne réponse :');
    expect(i18n.t('exam.correctAnswer')).toBe('Bonne réponse :');
  });

  it('has plural and singular forms for the counters', () => {
    expect(i18n.tn('merger.selectedCount', 1)).toBe('1 deck sélectionné');
    expect(i18n.tn('merger.selectedCount', 3)).toBe('3 decks sélectionnés');
    expect(i18n.tn('exam.pointsInfo', 1, { points: 1 })).toBe('Cette question vaut 1 point');
    expect(i18n.tn('exam.pointsInfo', 3, { points: 3 })).toBe('Cette question vaut 3 points');
    i18n.setLocale('en');
    expect(i18n.tn('merger.selectedCount', 1)).toBe('1 deck selected');
    expect(i18n.tn('merger.selectedCount', 0)).toBe('0 decks selected');
  });

  it('avoids the jargon navbar, sidebar and LLM', () => {
    const all = Object.entries(i18n._translations.fr).map(([, v]) => i18n.resolveVariant(v, 'feminine')).join('\n');
    expect(/navbar|sidebar|\bLLM\b/i.test(all)).toBe(false);
  });

  it('describes the colour-blind modes by their effect first', () => {
    expect(i18n.t('settings.protanopia')).toMatch(/^Rouge difficile à voir/);
    expect(i18n.t('settings.tritanopia')).toMatch(/difficile à voir \(tritanopie\)/);
  });

  it('has no leftover read-aloud markers', () => {
    expect(i18n.t('game.choose')).toBe('Choisir');
    expect(i18n.t('game.match')).toBe('Associer');
  });
});
