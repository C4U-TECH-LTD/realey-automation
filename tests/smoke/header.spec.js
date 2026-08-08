const { test } = require('@playwright/test');

const HomePage = require('../../pages/HomePage');
const Header = require('../../pages/Header');
const { stepWithScreenshot } = require('../../utils/step');

test.describe('Header Tests', () => {
  test.beforeEach(async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.open();
    await page.waitForLoadState('domcontentloaded');
  });

  test(
    'Verify header container and logo',
    async ({ page }, testInfo) => {
      const header = new Header(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Verify header is visible',
        async () => {
          await header.verifyHeaderVisible();
        },
      );

      await stepWithScreenshot(
        page,
        testInfo,
        'Verify Realey logo is visible',
        async () => {
          await header.verifyLogoVisible();
        },
      );
    },
  );

  test(
    'Verify all header navigation buttons',
    async ({ page }, testInfo) => {
      const header = new Header(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Verify Home About Listings Search and Pricing buttons',
        async () => {
          await header.verifyNavigationButtonsVisible();
        },
      );
    },
  );

  test(
    'Verify Login and Get Started buttons',
    async ({ page }, testInfo) => {
      const header = new Header(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Verify Login and Get Started buttons',
        async () => {
          await header.verifyActionButtonsVisible();
        },
      );
    },
  );

  test(
    'Click Home and verify Featured Properties',
    async ({ page }, testInfo) => {
      const header = new Header(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Click Home and verify Featured Properties',
        async () => {
          await header.clickHome();
        },
      );
    },
  );

  test(
    'Click About and verify About Realey',
    async ({ page }, testInfo) => {
      const header = new Header(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Click About and verify About Realey',
        async () => {
          await header.clickAbout();
        },
      );
    },
  );

  test(
    'Click Listings and verify Property Listings',
    async ({ page }, testInfo) => {
      const header = new Header(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Click Listings and verify Property Listings',
        async () => {
          await header.clickListings();
        },
      );
    },
  );

  test(
    'Click Search and verify Find Your Perfect Property',
    async ({ page }, testInfo) => {
      const header = new Header(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Click Search and verify Find Your Perfect Property',
        async () => {
          await header.clickSearch();
        },
      );
    },
  );

  test(
    'Click Pricing and verify Pricing Plans',
    async ({ page }, testInfo) => {
      const header = new Header(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Click Pricing and verify Pricing Plans',
        async () => {
          await header.clickPricing();
        },
      );
    },
  );

  test(
    'Click Login and verify Welcome back',
    async ({ page }, testInfo) => {
      const header = new Header(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Click Login and verify Welcome back',
        async () => {
          await header.clickLogin();
        },
      );
    },
  );

  test(
    'Click Get Started and verify Choose Your Profession',
    async ({ page }, testInfo) => {
      const header = new Header(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Click Get Started and verify Choose Your Profession',
        async () => {
          await header.clickGetStarted();
        },
      );
    },
  );
});