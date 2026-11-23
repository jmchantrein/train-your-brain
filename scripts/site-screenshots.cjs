#!/usr/bin/env node
/**
 * Captures du site (GitHub Pages) : accueil, jeu, bilan de séance, badges.
 *
 * Usage : node scripts/site-screenshots.cjs <chemin-du-build.html> [échelle=0.8]
 *   Le build s'obtient avec : node scripts/build.js --skip-validation --output tmp/site/app.html
 * Écrit uniquement dans site/assets/ (app-accueil.png, app-jeu.png, app-bilan.png, app-badges.png).
 *
 * Le profil est créé par les API de l'application (Storage, State, Badges), en français,
 * tutoriel fermé. La séance de jeu est jouée par l'interface. Aucune requête réseau n'est
 * autorisée. Playwright : celui du projet, sinon le Playwright global.
 */

const path = require('path');
const fs = require('fs');

let chromium;
try { ({ chromium } = require('@playwright/test')); } catch (e) {
  ({ chromium } = require('/opt/node22/lib/node_modules/playwright'));
}

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'site', 'assets');
const build = process.argv[2];
if (!build || !fs.existsSync(build)) {
  console.error('Usage : node scripts/site-screenshots.cjs <chemin-du-build.html>');
  process.exit(1);
}
// Facteur d'échelle (viewport 1280x800 CSS). Chromium tramé les dégradés (pas de bandes), ce qui
// rend les PNG lourds : à l'échelle 2 la page de jeu pèse 1,5 Mo, à 1 elle pèse 520 Ko. On réduit
// donc les dimensions (0,8 : 1024x640 px, jeu ~340 Ko) plutôt que le nombre de couleurs.
const SCALE = Number(process.argv[3] || 0.8);
const URL = 'file://' + path.resolve(build);

/** Progression d'un deck : part de cartes par boîte (l'interface ne lit la boîte que de là). */
const PROGRESS = {
  'capitales-europe': { green: 0.40, orange: 0.17, purple: 0.10 },
  'conversions-de-longueurs': { green: 0.40, orange: 0.20, purple: 0.12 },
  'fractions-equivalentes': { green: 0.35, orange: 0.20, purple: 0.12 },
  'alphabet-grec-lettres': { green: 0.30, orange: 0.20, purple: 0.15 },
  'table-de-multiplication-de-7': { green: 0.2, orange: 0.1, purple: 0.1 }
};

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }, deviceScaleFactor: SCALE,
    locale: 'fr-FR', timezoneId: 'Europe/Paris', colorScheme: 'dark', reducedMotion: 'reduce'
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route(/^(https?|wss?):/i, (route) => route.abort('blockedbyclient'));

  await page.goto(URL);
  await page.waitForSelector('#app');
  await page.evaluate(() => localStorage.clear());

  // Profil : une progression crédible, créée par les API de l'application
  const playerId = 'site_camille';
  await page.evaluate(({ id, progress }) => {
    const player = {
      id, name: 'Camille', createdAt: '2026-10-05T08:00:00.000Z',
      stats: {
        totalXP: 2650, totalCardsPlayed: 1100, totalSessions: 40, totalGreenCards: 240,
        currentStreak: 8, longestStreak: 8, longestGreenStreak: 14, perfectSessions: 0,
        lastPlayedAt: null, xpHistory: []
      },
      badges: [],
      settings: { theme: 'ocean', soundEnabled: false, language: 'fr', tutorialCompleted: true }
    };
    // Badges de séance déjà obtenus : le bilan montre alors la prochaine révision utile
    // sans bloc « Nouveaux badges » qui le repousserait sous le pli
    player.badges = [...new Set([...Badges.recalculateAll(player), 'green_streak_5', 'perfect_session'])];
    Storage.savePlayerById(player);
    Storage.addPlayerToList(player);
    Storage.setCurrentPlayerId(id);
    Storage.savePlayer(player);

    const day = 86400000;
    for (const deck of State.get('decks')) {
      const share = progress[deck.id];
      if (!share) continue;
      const n = deck.cards.length;
      const cards = deck.cards.map((c, i) => {
        const r = i / n;
        let box = 'never_played';
        if (r < share.green) box = 'green';
        else if (r < share.green + share.orange) box = 'orange';
        else if (r < share.green + share.orange + share.purple) box = 'purple';
        const played = box !== 'never_played';
        return {
          id: c.id, box, latencyThreshold: played ? 4000 : null,
          bestResponseTimeMs: played ? 1800 : null, lastResponseTimeMs: played ? 2600 : null,
          restUntil: box === 'green' ? new Date(Date.now() + (1 + (i % 5)) * day).toISOString().slice(0, 10) : null,
          restDays: box === 'green' ? 1 + (i % 5) : 0,
          timesPlayed: played ? 2 + (i % 3) : 0, timesCorrect: played ? 2 : 0
        };
      });
      Storage.saveDeckProgress(deck.id, cards);
    }
  }, { id: playerId, progress: PROGRESS });

  await page.goto(URL);
  await page.locator(`.splash__player-card[data-player-id="${playerId}"]`).click();
  await page.waitForSelector('.page--home');
  await page.waitForSelector('.deck-table__row');

  const shot = (name) => page.screenshot({ path: path.join(OUT, name) });
  const settle = () => page.evaluate(() => document.fonts.ready);

  // 1. Accueil
  await settle();
  await shot('app-accueil.png');

  // Réponse exacte à la carte affichée, lue dans la séance en cours (State.currentSession)
  const answerCurrent = async (correct) => {
    try { await page.waitForSelector('#answer-input', { timeout: 8000 }); } catch (e) {
      await page.screenshot({ path: path.join(ROOT, 'tmp', 'site', 'debug.png') });
      throw e;
    }
    await page.waitForTimeout(300); // fin du rendu de la carte
    const ans = await page.evaluate(() => {
      const s = State.get('currentSession');
      return String(s.cards[s.currentIndex].answer);
    });
    const q = ans;
    await page.locator('#answer-input').fill(correct ? ans : 'je ne sais pas');
    await page.locator('#submit-btn').click();
    try {
      await page.locator('.game__card-content--back').waitFor({ timeout: 5000 });
    } catch (e) {
      await page.screenshot({ path: path.join(ROOT, 'tmp', 'site', 'debug.png') });
      console.error('Question :', q, '| réponse :', ans);
      throw e;
    }
  };

  // 2. Jeu : Capitales - Europe, quelques bonnes réponses puis une carte en cours
  await page.evaluate(() => { window.location.hash = '#/game/capitales-europe'; });
  await page.waitForSelector('.game__card-question');
  for (let i = 0; i < 4; i++) {
    await answerCurrent(true);
    await page.locator('#next-btn').click();
    await page.waitForSelector('.game__card-content--front, .game__card-question');
  }
  await page.waitForSelector('#answer-input');
  await settle();
  await page.waitForTimeout(2500); // l'indicateur « +XP » de la carte précédente disparaît
  await shot('app-jeu.png');

  // Les autres decks commencés passent en repos (cartes vertes) : après la séance suivante il ne
  // reste rien à réviser aujourd'hui, et le bilan indique la prochaine révision utile
  await page.evaluate((ids) => {
    const day = 86400000;
    for (const deck of State.get('decks')) {
      if (!ids.includes(deck.id)) continue;
      const cards = deck.cards.map((c, i) => ({
        id: c.id, box: 'green', latencyThreshold: 4000, bestResponseTimeMs: 1800,
        lastResponseTimeMs: 2600, restUntil: new Date(Date.now() + (2 + (i % 4)) * day).toISOString().slice(0, 10),
        restDays: 2 + (i % 4), timesPlayed: 3, timesCorrect: 3
      }));
      Storage.saveDeckProgress(deck.id, cards);
    }
    State.set('decks', App._loadDecks());
  }, Object.keys(PROGRESS).filter((id) => id !== 'table-de-multiplication-de-7'));

  // 3. Bilan : séance complète sur « Table de multiplication de 7 », séance parfaite (la prochaine révision utile s'affiche)
  await page.evaluate(() => { window.location.hash = '#/game/table-de-multiplication-de-7'; });
  await page.waitForSelector('.game__card-question');
  for (let i = 0; i < 40 && !(await page.locator('.page--session-summary').count()); i++) {
    if (!(await page.locator('#answer-input').count())) break;
    await answerCurrent(true);
    await page.locator('#next-btn').click();
    await page.waitForSelector('#answer-input:visible, .page--session-summary');
  }
  await page.waitForSelector('.page--session-summary');
  await settle();
  await page.waitForTimeout(2500);
  await shot('app-bilan.png');

  // 4. Badges
  await page.evaluate(() => { window.location.hash = '#/badges'; });
  await page.waitForSelector('.page--badges');
  await settle();
  await shot('app-badges.png');

  const stats = await page.evaluate(() => ({
    badges: Badges.ALL.length, unlocked: State.get('player').badges.length
  }));
  console.log('Badges :', stats.unlocked, '/', stats.badges);
  await browser.close();
  if (errors.length) { console.error('Erreurs de page :', errors); process.exit(1); }
}

main().catch((e) => { console.error(e); process.exit(1); });
