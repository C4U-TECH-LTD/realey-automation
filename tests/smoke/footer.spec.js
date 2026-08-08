const { test } = require('@playwright/test');

const HomePage = require('../../pages/HomePage');
const Footer = require('../../pages/Footer');
const { stepWithScreenshot } = require('../../utils/step');

test.describe('Footer Tests', () => {
  test.beforeEach(async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.open();
    await page.waitForLoadState('domcontentloaded');
  });

  // ==================================================
  // Main footer tests
  // ==================================================

  test(
    'Verify footer main information',
    async ({ page }, testInfo) => {
      const footer = new Footer(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Scroll to footer',
        async () => {
          await footer.scrollToFooter();
        },
      );

      await stepWithScreenshot(
        page,
        testInfo,
        'Verify footer and Let’s Talk heading',
        async () => {
          await footer.verifyFooterVisible();
        },
      );

      await stepWithScreenshot(
        page,
        testInfo,
        'Verify Realey footer logo',
        async () => {
          await footer.verifyLogoVisible();
        },
      );

      await stepWithScreenshot(
        page,
        testInfo,
        'Verify footer description',
        async () => {
          await footer.verifyDescriptionVisible();
        },
      );
    },
  );

  test(
    'Verify footer email subscription',
    async ({ page }, testInfo) => {
      const footer = new Footer(page);
      const testEmail = `qa.footer.${Date.now()}@example.com`;

      await footer.scrollToFooter();

      await stepWithScreenshot(
        page,
        testInfo,
        'Verify email input and submit button',
        async () => {
          await footer.verifyEmailSubscriptionElements();
        },
      );

      await stepWithScreenshot(
        page,
        testInfo,
        'Enter valid email address',
        async () => {
          await footer.enterEmail(testEmail);
        },
      );

      await stepWithScreenshot(
        page,
        testInfo,
        'Submit email subscription',
        async () => {
          await footer.submitEmail();
        },
      );

      await stepWithScreenshot(
        page,
        testInfo,
        'Verify email submitted successfully',
        async () => {
          await footer.verifySubscriptionResult();
        },
      );
    },
  );

  test(
    'Verify Fixed Price section elements',
    async ({ page }, testInfo) => {
      const footer = new Footer(page);

      await footer.scrollToFooter();

      await stepWithScreenshot(
        page,
        testInfo,
        'Verify Fixed Price heading and links',
        async () => {
          await footer.verifyFixedPriceSection();
        },
      );
    },
  );

  test(
    'Verify Auctions section elements',
    async ({ page }, testInfo) => {
      const footer = new Footer(page);

      await footer.scrollToFooter();

      await stepWithScreenshot(
        page,
        testInfo,
        'Verify Auctions heading and links',
        async () => {
          await footer.verifyAuctionsSection();
        },
      );
    },
  );

  test(
    'Verify bottom footer elements',
    async ({ page }, testInfo) => {
      const footer = new Footer(page);

      await footer.scrollToFooter();

      await stepWithScreenshot(
        page,
        testInfo,
        'Verify copyright policy terms and social links',
        async () => {
          await footer.verifyBottomFooterElements();
        },
      );
    },
  );

  // ==================================================
  // Fixed Price links - each link is a separate test
  // ==================================================

  test(
    'Fixed Price - Listings link',
    async ({ page }, testInfo) => {
      const footer = new Footer(page);
      await footer.scrollToFooter();

      await stepWithScreenshot(
        page,
        testInfo,
        'Click Fixed Price Listings and verify Property Listings',
        async () => {
          await footer.clickFixedPriceListingsAndVerify();
        },
      );
    },
  );

  test(
    'Fixed Price - Recently Added link',
    async ({ page }, testInfo) => {
      const footer = new Footer(page);
      await footer.scrollToFooter();

      await stepWithScreenshot(
        page,
        testInfo,
        'Click Fixed Price Recently Added and verify Page Not Found is absent',
        async () => {
          await footer.clickFixedPriceRecentlyAddedAndVerify();
        },
      );
    },
  );

  test(
    'Fixed Price - Recently Ended link',
    async ({ page }, testInfo) => {
      const footer = new Footer(page);
      await footer.scrollToFooter();

      await stepWithScreenshot(
        page,
        testInfo,
        'Click Fixed Price Recently Ended and verify Page Not Found is absent',
        async () => {
          await footer.clickFixedPriceRecentlyEndedAndVerify();
        },
      );
    },
  );

  // ==================================================
  // Auctions links - each link is a separate test
  // ==================================================

  test(
    'Auctions - Listings link',
    async ({ page }, testInfo) => {
      const footer = new Footer(page);
      await footer.scrollToFooter();

      await stepWithScreenshot(
        page,
        testInfo,
        'Click Auctions Listings and verify Property Listings',
        async () => {
          await footer.clickAuctionsListingsAndVerify();
        },
      );
    },
  );

  test(
    'Auctions - Ending Soon link',
    async ({ page }, testInfo) => {
      const footer = new Footer(page);
      await footer.scrollToFooter();

      await stepWithScreenshot(
        page,
        testInfo,
        'Click Auctions Ending Soon and verify Page Not Found is absent',
        async () => {
          await footer.clickAuctionsEndingSoonAndVerify();
        },
      );
    },
  );

  test(
    'Auctions - Starting Soon link',
    async ({ page }, testInfo) => {
      const footer = new Footer(page);
      await footer.scrollToFooter();

      await stepWithScreenshot(
        page,
        testInfo,
        'Click Auctions Starting Soon and verify Page Not Found is absent',
        async () => {
          await footer.clickAuctionsStartingSoonAndVerify();
        },
      );
    },
  );

  test(
    'Auctions - Recently Added link',
    async ({ page }, testInfo) => {
      const footer = new Footer(page);
      await footer.scrollToFooter();

      await stepWithScreenshot(
        page,
        testInfo,
        'Click Auctions Recently Added and verify Page Not Found is absent',
        async () => {
          await footer.clickAuctionsRecentlyAddedAndVerify();
        },
      );
    },
  );

  test(
    'Auctions - Recently Ended link',
    async ({ page }, testInfo) => {
      const footer = new Footer(page);
      await footer.scrollToFooter();

      await stepWithScreenshot(
        page,
        testInfo,
        'Click Auctions Recently Ended and verify Page Not Found is absent',
        async () => {
          await footer.clickAuctionsRecentlyEndedAndVerify();
        },
      );
    },
  );

  // ==================================================
  // Bottom footer links - each link is a separate test
  // ==================================================

  test(
    'Bottom Footer - Privacy Policy link',
    async ({ page }, testInfo) => {
      const footer = new Footer(page);
      await footer.scrollToFooter();

      await stepWithScreenshot(
        page,
        testInfo,
        'Click Privacy Policy and verify page',
        async () => {
          await footer.clickPrivacyPolicyAndVerify();
        },
      );
    },
  );

  test(
    'Bottom Footer - Terms and Conditions link',
    async ({ page }, testInfo) => {
      const footer = new Footer(page);
      await footer.scrollToFooter();

      await stepWithScreenshot(
        page,
        testInfo,
        'Click Terms and Conditions and verify page',
        async () => {
          await footer.clickTermsConditionsAndVerify();
        },
      );
    },
  );

  test(
    'Bottom Footer - Instagram link',
    async ({ page }, testInfo) => {
      const footer = new Footer(page);
      await footer.scrollToFooter();

      await stepWithScreenshot(
        page,
        testInfo,
        'Click Instagram and verify URL',
        async () => {
          await footer.clickInstagramAndVerify();
        },
      );
    },
  );

  test(
    'Bottom Footer - LinkedIn link',
    async ({ page }, testInfo) => {
      const footer = new Footer(page);
      await footer.scrollToFooter();

      await stepWithScreenshot(
        page,
        testInfo,
        'Click LinkedIn and verify URL',
        async () => {
          await footer.clickLinkedInAndVerify();
        },
      );
    },
  );
});
