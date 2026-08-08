const { test } = require("@playwright/test");

const {
  LoginPage,
} = require("../../pages/LoginPage");

const {
  DashboardPage,
} = require("../../pages/DashboardPage");

const {
  PropertyLocationPage,
} = require("../../pages/PropertyLocationPage");

const {
  PropertyDetailsPage,
} = require("../../pages/PropertyDetailsPage");

const {
  PricingSalePage,
} = require("../../pages/PricingSalePage");

const {
  DescriptionFeaturesPage,
} = require("../../pages/DescriptionFeaturesPage");

const {
  ListingMediaPage,
} = require("../../pages/ListingMediaPage");

const {
  stepWithScreenshot,
} = require("../../utils/step");

const {
  loginData,
} = require("../../fixtures/test-data/loginData");

const {
  listingData,
} = require("../../fixtures/test-data/listingData");

test.describe("Agent Create Listing Tests", () => {
  test(
    "Agent can login and publish a new listing",
    async ({ page }, testInfo) => {
      test.setTimeout(360_000);

      const loginPage =
        new LoginPage(page);

      const dashboardPage =
        new DashboardPage(page);

      const propertyLocationPage =
        new PropertyLocationPage(page);

      const propertyDetailsPage =
        new PropertyDetailsPage(page);

      const pricingSalePage =
        new PricingSalePage(page);

      const descriptionFeaturesPage =
        new DescriptionFeaturesPage(page);

      const listingMediaPage =
        new ListingMediaPage(page);

      /* =====================================================
         LOGIN
      ===================================================== */

      await stepWithScreenshot(
        page,
        testInfo,
        "Open login page",
        async () => {
          await loginPage.goto(
            loginData.application.loginPath
          );
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Submit valid agent credentials",
        async () => {
          await loginPage.login(
            loginData.application.email,
            loginData.application.password
          );
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Verify OTP page appears",
        async () => {
          await loginPage.waitForOtpPage();
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Enter fixed login OTP",
        async () => {
          await loginPage.enterOtp(
            loginData.application.otp
          );
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Submit login OTP",
        async () => {
          await loginPage.submitOtp();
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Verify agent dashboard opens",
        async () => {
          await dashboardPage.waitForDashboard();
        }
      );

      /* =====================================================
         CREATE LISTING
      ===================================================== */

      await stepWithScreenshot(
        page,
        testInfo,
        "Click Create Your First Listing",
        async () => {
          await dashboardPage.clickCreateListing();
        }
      );

      /* =====================================================
         STEP 1: PROPERTY LOCATION
      ===================================================== */

      await stepWithScreenshot(
        page,
        testInfo,
        "Verify Property Location step",
        async () => {
          await propertyLocationPage.waitForPage();
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Type address and select first suggestion",
        async () => {
          await propertyLocationPage
            .typeAddressAndSelectFirstSuggestion(
              listingData.location
                .addressSearchText
            );
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Verify location fields are auto filled",
        async () => {
          await propertyLocationPage
            .waitForAutoFilledLocationFields();
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Continue from Property Location",
        async () => {
          await propertyLocationPage.clickNext();
        }
      );

      /* =====================================================
         STEP 2: PROPERTY DETAILS
      ===================================================== */

      await stepWithScreenshot(
        page,
        testInfo,
        "Verify Property Details step",
        async () => {
          await propertyDetailsPage.waitForPage();
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Complete Property Details",
        async () => {
          await propertyDetailsPage
            .completeDetailsStep(
              listingData.details
            );
        }
      );

      /* =====================================================
         STEP 3: PRICING AND SALE METHOD
      ===================================================== */

      await stepWithScreenshot(
        page,
        testInfo,
        "Verify Pricing and Sale Method page",
        async () => {
          await pricingSalePage.waitForPage();
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Select listing type Offers",
        async () => {
          await pricingSalePage
            .selectListingType(
              listingData.pricing
                .listingType
            );
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Enter Price Guide",
        async () => {
          await pricingSalePage
            .enterPriceGuide(
              listingData.pricing
                .priceGuide
            );
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Continue from Pricing and Sale Method",
        async () => {
          await pricingSalePage.clickNext();
        }
      );

      /* =====================================================
         STEP 4: DESCRIPTION AND FEATURES
      ===================================================== */

      await stepWithScreenshot(
        page,
        testInfo,
        "Verify Description and Features page",
        async () => {
          await descriptionFeaturesPage
            .waitForPage();
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Enter Property Headline",
        async () => {
          await descriptionFeaturesPage
            .enterHeadline(
              listingData.description
                .headline
            );
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Enter Property Description",
        async () => {
          await descriptionFeaturesPage
            .enterDescription(
              listingData.description
                .propertyDescription
            );
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Select Property Key Features",
        async () => {
          await descriptionFeaturesPage
            .selectFeatures(
              listingData.description
                .keyFeatures
            );
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Continue from Description and Features",
        async () => {
          await descriptionFeaturesPage
            .clickNext();
        }
      );

      /* =====================================================
         STEP 5: PHOTOS AND FLOOR PLAN
      ===================================================== */

      await stepWithScreenshot(
        page,
        testInfo,
        "Verify Property Media page",
        async () => {
          await listingMediaPage.waitForPage();
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Upload Property Photos",
        async () => {
          await listingMediaPage
            .uploadPropertyPhotos(
              listingData.media
                .propertyPhotos
            );
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Upload Floor Plan",
        async () => {
          await listingMediaPage
            .uploadFloorPlan(
              listingData.media
                .floorPlan
            );
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Confirm Listing Information",
        async () => {
          await listingMediaPage
            .confirmListing();
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Click Publish Listing",
        async () => {
          await listingMediaPage
            .publishListing();
        }
      );

      /* =====================================================
         SUCCESS VERIFICATION
      ===================================================== */

      await stepWithScreenshot(
        page,
        testInfo,
        "Verify dashboard opens after publishing",
        async () => {
          await dashboardPage
            .waitForDashboardAfterPublish();
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Open Listings menu",
        async () => {
          await dashboardPage
            .openListingsMenu();
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Verify published listing appears by location",
        async () => {
          await dashboardPage
            .verifyListingVisibleByLocation(
              listingData.location
                .expectedPropertyName
            );
        }
      );
    }
  );
});
