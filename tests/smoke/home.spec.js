const { test } = require('../../fixtures/baseTest');
const { stepWithScreenshot } = require('../../utils/step');

const HomePage = require('../../pages/HomePage');

test.describe('Home Page Tests', () => {
  test.beforeEach(async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.open();
  });

  // ==================================================
  // Page load
  // ==================================================

  test(
    'Homepage loads successfully',
    async ({ page }, testInfo) => {
      const homePage = new HomePage(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Verify homepage is loaded',
        async () => {
          await homePage.verifyPageLoaded();
        },
      );
    },
  );

  // ==================================================
  // Hero section
  // ==================================================

  test(
    'Hero - View Listing button is visible',
    async ({ page }, testInfo) => {
      const homePage = new HomePage(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Verify View Listing button',
        async () => {
          await homePage.verifyViewListingButtonVisible();
        },
      );
    },
  );

  test(
    'Hero - View Listing button opens Property Listings',
    async ({ page }, testInfo) => {
      const homePage = new HomePage(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Click View Listing and verify Property Listings',
        async () => {
          await homePage.clickViewListingAndVerify();
        },
      );
    },
  );

  // ==================================================
  // Featured Properties
  // ==================================================

  test(
    'Featured Properties heading is visible',
    async ({ page }, testInfo) => {
      const homePage = new HomePage(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Verify Featured Properties heading',
        async () => {
          await homePage.verifyFeaturedPropertiesHeading();
        },
      );
    },
  );

  test(
    'View All Listings button is visible',
    async ({ page }, testInfo) => {
      const homePage = new HomePage(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Verify View All Listings button',
        async () => {
          await homePage.verifyViewAllListingsButtonVisible();
        },
      );
    },
  );

  test(
    'View All Listings button opens Property Listings',
    async ({ page }, testInfo) => {
      const homePage = new HomePage(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Click View All Listings and verify Property Listings',
        async () => {
          await homePage.clickViewAllListingsAndVerify();
        },
      );
    },
  );

  // ==================================================
  // Platform Features
  // ==================================================

  test(
    'Platform Features heading is visible',
    async ({ page }, testInfo) => {
      const homePage = new HomePage(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Verify Platform Features heading',
        async () => {
          await homePage.verifyPlatformFeaturesHeading();
        },
      );
    },
  );

  test(
    'Platform Features previous button works',
    async ({ page }, testInfo) => {
      const homePage = new HomePage(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Click Platform Features previous button',
        async () => {
          await homePage.verifyPlatformPreviousButtonWorks();
        },
      );
    },
  );

  test(
    'Platform Features next button works',
    async ({ page }, testInfo) => {
      const homePage = new HomePage(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Click Platform Features next button',
        async () => {
          await homePage.verifyPlatformNextButtonWorks();
        },
      );
    },
  );

  // ==================================================
  // Trusted Partners
  // ==================================================

  test(
    'Trusted partners heading is visible',
    async ({ page }, testInfo) => {
      const homePage = new HomePage(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Verify trusted partners heading',
        async () => {
          await homePage.verifyTrustedPartnersHeading();
        },
      );
    },
  );

  test(
    'Real Estate Agents heading is visible',
    async ({ page }, testInfo) => {
      const homePage = new HomePage(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Verify Real Estate Agents heading',
        async () => {
          await homePage.verifyRealEstateAgentsHeading();
        },
      );
    },
  );

  test(
    'Solicitors heading is visible',
    async ({ page }, testInfo) => {
      const homePage = new HomePage(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Verify Solicitors heading',
        async () => {
          await homePage.verifySolicitorsHeading();
        },
      );
    },
  );

  test(
    'Mortgage Brokers heading is visible',
    async ({ page }, testInfo) => {
      const homePage = new HomePage(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Verify Mortgage Brokers heading',
        async () => {
          await homePage.verifyMortgageBrokersHeading();
        },
      );
    },
  );

  // ==================================================
  // FAQ
  // ==================================================

  test(
    'FAQ heading is visible',
    async ({ page }, testInfo) => {
      const homePage = new HomePage(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Verify Frequently Ask Questions heading',
        async () => {
          await homePage.verifyFaqHeading();
        },
      );
    },
  );

  test(
    'FAQ - Schedule a property visit dropdown works',
    async ({ page }, testInfo) => {
      const homePage = new HomePage(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Open schedule property visit FAQ',
        async () => {
          await homePage.verifyScheduleVisitFaqWorks();
        },
      );
    },
  );

  test(
    'FAQ - Property listings verified dropdown works',
    async ({ page }, testInfo) => {
      const homePage = new HomePage(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Open verified listings FAQ',
        async () => {
          await homePage.verifyListingsVerifiedFaqWorks();
        },
      );
    },
  );

  test(
    'FAQ - Home loan dropdown works',
    async ({ page }, testInfo) => {
      const homePage = new HomePage(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Open home loan FAQ',
        async () => {
          await homePage.verifyHomeLoanFaqWorks();
        },
      );
    },
  );

  test(
    'FAQ - Brokerage and service fees dropdown works',
    async ({ page }, testInfo) => {
      const homePage = new HomePage(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Open brokerage and service fees FAQ',
        async () => {
          await homePage.verifyServiceFeesFaqWorks();
        },
      );
    },
  );

  test(
    'FAQ - List property dropdown works',
    async ({ page }, testInfo) => {
      const homePage = new HomePage(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Open list property FAQ',
        async () => {
          await homePage.verifyListPropertyFaqWorks();
        },
      );
    },
  );

  test(
    'FAQ - Save properties dropdown works',
    async ({ page }, testInfo) => {
      const homePage = new HomePage(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Open save properties FAQ',
        async () => {
          await homePage.verifySavePropertiesFaqWorks();
        },
      );
    },
  );

  // ==================================================
  // Contact Us
  // ==================================================

  test(
    'Contact Us button is visible',
    async ({ page }, testInfo) => {
      const homePage = new HomePage(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Verify Contact Us button',
        async () => {
          await homePage.verifyContactUsButtonVisible();
        },
      );
    },
  );

  test(
    'Contact Us button opens help page',
    async ({ page }, testInfo) => {
      const homePage = new HomePage(page);

      await stepWithScreenshot(
        page,
        testInfo,
        'Click Contact Us and verify How can we help',
        async () => {
          await homePage.clickContactUsAndVerify();
        },
      );
    },
  );
});
