const { defineConfig } = require('@playwright/test');
require('dotenv').config();

const baseURL = process.env.BASE_URL || 'https://uat.realey.au/';

module.exports = defineConfig({
  testDir: './tests',

  timeout: 60_000,

  expect: {
    timeout: 10_000,
  },

  fullyParallel: false,

  forbidOnly: Boolean(process.env.CI),

  retries: process.env.CI ? 1 : 0,

  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['list'],

    [
      'html',
      {
        outputFolder: 'playwright-report',
        open: 'never',
      },
    ],

    [
      'allure-playwright',
      {
        outputFolder: 'allure-results',
        detail: true,
        suiteTitle: false,

        environmentInfo: {
          Environment: 'UAT',
          BaseURL: baseURL,
          Browser: 'Google Chrome',
          Platform: process.platform,
        },
      },
    ],
  ],

  use: {
    baseURL,

    headless: Boolean(process.env.CI),

    viewport: process.env.CI
      ? {
          width: 1920,
          height: 1080,
        }
      : null,

    screenshot: 'only-on-failure',

    video: 'retain-on-failure',

    trace: 'retain-on-failure',

    actionTimeout: 15_000,

    navigationTimeout: 30_000,

    ignoreHTTPSErrors: false,

    launchOptions: process.env.CI
      ? {
          args: [
            '--disable-dev-shm-usage',
            '--no-sandbox',
          ],
        }
      : {
          slowMo: 500,
          args: ['--start-maximized'],
        },
  },

  projects: [
    {
      name: 'chrome',

      use: {
        channel: 'chrome',
      },
    },
  ],

  outputDir: 'test-results',
});
