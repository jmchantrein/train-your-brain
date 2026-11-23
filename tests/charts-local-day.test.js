/**
 * Graphiques : le « jour » est le jour local (TextUtils.getLocalDateString), pas le jour UTC.
 *
 * Un gain d'XP fait à 23 h 30 (ou 0 h 30) heure locale est enregistré avec la date locale
 * (TextUtils.getToday). Les graphiques doivent le ranger sous ce même jour, quel que soit le
 * fuseau. À lancer aussi avec TZ=America/New_York et TZ=Pacific/Auckland :
 *   TZ=America/New_York TEST_FILTER=charts-local-day node tests/node-runner.cjs
 */

describe('Charts - jour local (fuseaux)', () => {
  const RealDate = Date;
  let restore = null;

  /** Fige « maintenant » à une heure locale donnée */
  function freezeNow(y, m, d, h, min) {
    const fixed = new RealDate(y, m, d, h, min, 0, 0);
    class FrozenDate extends RealDate {
      constructor(...args) { if (args.length === 0) super(fixed.getTime()); else super(...args); }
      static now() { return fixed.getTime(); }
    }
    window.Date = FrozenDate;
    restore = () => { window.Date = RealDate; };
  }

  afterEach(() => { if (restore) { restore(); restore = null; } });

  const CASES = [
    { label: '23h30 locale', args: [2026, 10, 22, 23, 30], day: '2026-11-22' },
    { label: '00h30 locale', args: [2026, 10, 23, 0, 30], day: '2026-11-23' }
  ];

  CASES.forEach(({ label, args, day }) => {
    it(`should file an XP gain made at ${label} under its local day`, () => {
      freezeNow(...args);
      expect(TextUtils.getToday()).toBe(day);
      const player = { stats: { totalXP: 10, xpHistory: [{ date: day, amount: 10, source: 'session', cardsPlayed: 4 }] } };

      const weekly = Charts.getWeeklyActivity(player);
      expect(weekly[weekly.length - 1].date).toBe(day);
      expect(weekly[weekly.length - 1].value).toBe(4);

      const evolution = Charts.getEvolutionData ? Charts.getEvolutionData(player, 7) : null;
      if (evolution && evolution.dates) {
        expect(evolution.dates[evolution.dates.length - 1].date).toBe(day);
      }

      const comparative = Charts.getComparativeStats(player);
      expect(comparative.daily.current.xp).toBe(10);
      expect(comparative.daily.previous.xp).toBe(0);
      expect(comparative.weekly.current.xp).toBe(10);
    });

    it(`should render the heatmap cell of ${label} with its count`, () => {
      freezeNow(...args);
      const player = { stats: { xpHistory: [{ date: day, amount: 1, source: 'session', cardsPlayed: 6 }] } };
      const data = Charts.getActivityHeatmap(player);
      const svg = Charts.renderHeatmap ? Charts.renderHeatmap(data, { weeks: 2 }) : '';
      if (svg) expect(svg).toContain('6');
      expect(data[day]).toBe(6);
    });
  });

  it('should count yesterday gain as yesterday, not as today', () => {
    freezeNow(2026, 10, 23, 0, 30);
    const player = { stats: { xpHistory: [{ date: '2026-11-22', amount: 7, source: 'session', cardsPlayed: 2 }] } };
    const comparative = Charts.getComparativeStats(player);
    expect(comparative.daily.current.xp).toBe(0);
    expect(comparative.daily.previous.xp).toBe(7);
  });
});
