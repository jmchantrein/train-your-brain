// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const { APP_URL } = require('./app-path.cjs');

/**
 * Playwright Configuration for Train Your Brain
 *
 * Tests are run against the built index.html file using file:// protocol
 */

module.exports = defineConfig({
  testDir: './',
  testMatch: '**/*.spec.cjs',

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,

  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 2 : undefined,

  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list']
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL - using file:// protocol for offline app */
    baseURL: APP_URL,

    /* Interface testée en français (les joueurs de test ont language: 'fr') */
    locale: 'fr-FR',

    /* Collect trace when retrying the failed test */
    trace: process.env.CI ? 'on-first-retry' : 'off',

    /* Screenshot on failure */
    screenshot: 'only-on-failure',

    /* Video on failure */
    video: 'off',
  },

  /* Seul chromium est installé (CI : npx playwright install chromium). Firefox, WebKit et les
     projets mobiles ont été retirés : jamais installés, ils échouaient tous au lancement. */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use system Chrome if PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH is set
        launchOptions: {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
        }
      },
    },
  ],

  /* Timeout settings */
  timeout: 30000,
  expect: {
    timeout: 5000
  },
});
