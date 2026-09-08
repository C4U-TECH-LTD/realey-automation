const {
  Given,
  When,
  Then,
  setDefaultTimeout,
} = require("@cucumber/cucumber");

const {
  takeCucumberScreenshot,
} = require("../../utils/cucumberScreenshot");

const { expect } = require("@playwright/test");

const {
  loginData,
} = require("../../fixtures/test-data/loginData");

const {
  auctionFlowData,
} = require("../../fixtures/test-data/auctionFlowData");

// =====================================================
// GLOBAL TIMEOUT
//
// Auction duration = 15 minutes.
// Allow enough time for the long Auction wait step.
// =====================================================

setDefaultTimeout(20 * 60 * 1000);

// =====================================================
// HELPERS
// =====================================================

async function clearCurrentSession(world) {
  console.log("Clearing current user session...");

  // Clear authentication cookies
  await world.context.clearCookies();

  // Clear browser storage from the current page
  if (!world.page.isClosed()) {
    try {
      await world.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      console.log("Browser storage cleared");
    } catch (error) {
      console.log(
        "Storage clear skipped:",
        error.message
      );
    }
  }

  // IMPORTANT:
  // Do NOT navigate to https://uat.realey.au/ first.
  // Go directly to the login page.
  try {
    await world.page.goto(
      loginData.application.loginPath,
      {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      }
    );
  } catch (error) {
    console.log(
      "First login navigation failed:",
      error.message
    );

    // Retry once in case the application aborted
    // navigation because of a redirect/state update.
    await world.page.waitForTimeout(1000);

    await world.page.goto(
      loginData.application.loginPath,
      {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      }
    );
  }

  console.log(
    "Current session cleared and login page opened:",
    world.page.url()
  );
}

async function loginAs(
  world,
  account,
  accountName
) {
  if (
    !account?.email ||
    !account?.password
  ) {
    throw new Error(
      `${accountName} credentials are missing. ` +
        `Configure email/password in .env or GitHub Actions secrets.`
    );
  }

  console.log(
    `Logging in as ${accountName}...`
  );

  await world.loginPage.goto(
    loginData.application.loginPath
  );

  await world.loginPage.login(
    account.email,
    account.password
  );

  await world.loginPage.waitForOtpPage();

  await world.loginPage.enterOtp(
    account.otp
  );

  await world.loginPage.submitOtp();

  console.log(
    `${accountName} login completed`
  );
}

// =====================================================
// AGENT LOGIN
// =====================================================

Given(
  "the agent is logged in for the Auction E2E flow",
  async function () {
    await loginAs(
      this,
      loginData.agent,
      "Agent"
    );

    await this.dashboardPage
      .waitForDashboard();

    console.log(
      "Agent dashboard opened"
    );
  }
);

// =====================================================
// CREATE AUCTION LISTING
// =====================================================

When(
  "the agent creates and publishes an Auction listing",
  async function () {
    const listing =
      auctionFlowData.agent.listing;

    console.log(
      "Starting Auction listing creation..."
    );

    await this.dashboardPage
      .clickCreateListing();

    // =================================================
    // PROPERTY LOCATION
    // =================================================

    await this.propertyLocationPage
      .waitForPage();

    await this.propertyLocationPage
      .typeAddressAndSelectFirstSuggestion(
        listing.addressSearchText
      );

    await this.propertyLocationPage
      .waitForAutoFilledLocationFields();

    await this.propertyLocationPage
      .clickNext();

    // =================================================
    // PROPERTY DETAILS
    // =================================================

    await this.propertyDetailsPage
      .waitForPage();

    await this.propertyDetailsPage
      .completeDetailsStep({
        propertyType:
          listing.propertyType,

        bedrooms:
          listing.bedrooms,

        bathrooms:
          listing.bathrooms,

        carSpaces:
          listing.carSpaces,

        landSize:
          listing.landSize || "",

        buildingSize:
          listing.buildingSize || "",

        yearBuilt:
          listing.yearBuilt || "",
      });

    // =================================================
    // AUCTION PRICING
    // =================================================

    this.auctionSlot =
      await this.pricingSalePage
        .completeAuctionPricingStep({
          listingType:
            listing.listingType,

          reservePrice:
            listing.reservePrice,

          depositPercent:
            listing.depositPercent,

          auctionLocation:
            listing.auctionLocation,

          startingPrice:
            listing.startingPrice,

          minimumBidIncrement:
            listing.minimumBidIncrement,

          slotMinutes:
            auctionFlowData.auction
              .slotMinutes,

          durationMinutes:
            auctionFlowData.auction
              .durationMinutes,
        });

    // =================================================
    // DESCRIPTION & FEATURES
    // =================================================

    await this.descriptionFeaturesPage
      .waitForPage();

    await this.descriptionFeaturesPage
      .enterHeadline(
        listing.headline
      );

    await this.descriptionFeaturesPage
      .enterDescription(
        listing.propertyDescription
      );

    await this.descriptionFeaturesPage
      .selectFeatures(
        listing.keyFeatures
      );

    await this.descriptionFeaturesPage
      .clickNext();

    // =================================================
    // LISTING MEDIA
    // =================================================

    await this.listingMediaPage
      .waitForPage();

    await this.listingMediaPage
      .uploadPropertyPhotos(
        listing.propertyPhotos
      );

    await this.listingMediaPage
      .uploadFloorPlan(
        listing.floorPlan
      );

    await this.listingMediaPage
      .confirmListing();

    await this.listingMediaPage
      .publishListing();

    console.log(
      "Auction listing publish action completed"
    );
  }
);

Then(
  "the Auction listing is published successfully",
  async function () {
    const listing =
      auctionFlowData.agent.listing;

    await this.dashboardPage
      .waitForDashboardAfterPublish();

    await this.dashboardPage
      .openListingsMenu();

    await this.dashboardPage
      .verifyListingVisibleByLocation(
        listing.expectedPropertyName
      );

    console.log(
      "Auction listing published successfully"
    );
  }
);

// =====================================================
// BUYER 1
// =====================================================

When(
  "I switch from Agent to First Auction Buyer",
  async function () {
    await clearCurrentSession(this);

    await loginAs(
      this,
      loginData.generalUser,
      "First Auction Buyer"
    );
  }
);

When(
  "the First Auction Buyer opens the created Auction listing",
  async function () {
    await this.generalUserListingsPage
      .openFirstMatchingListing(
        auctionFlowData.firstBuyer
          .searchText
      );

    console.log(
      "Buyer 1 Auction listing opened"
    );
  }
);

When(
  "the First Auction Buyer registers as a bidder",
  async function () {
    console.log(
      "Starting Buyer 1 bidder registration..."
    );

    // Buyer 1 signature = SIAM
    const activePage =
  await this.bidderRegisterPage
    .registerAsBidder(
      "SIAM",
      async (title, page) => {
        await takeCucumberScreenshot(
          this,
          `Buyer 1 - ${title}`,
          page
        );
      }
    );

    if (!activePage) {
      throw new Error(
        "Buyer 1 bidder registration did not return the active Auction page."
      );
    }

    this.page = activePage;

    await this.page.bringToFront();

    // Important:
    // Rebuild page objects for the new page/tab.
    this.initialisePageObjects();

    console.log(
      "Buyer 1 active page after bidder registration:",
      this.page.url()
    );
  }
);

Then(
  "the First Auction Buyer registration is successful",
  async function () {
    await this.auctionPage
      .waitUntilBiddingIsOpen();

    console.log(
      "Buyer 1 registration successful"
    );
  }
);

When(
  "the First Auction Buyer places the configured Auction bid",
  async function () {
    console.log(
      "Buyer 1 placing Auction bid:",
      auctionFlowData.firstBuyer
        .bidAmount
    );

    await this.auctionPage.placeBid(
      auctionFlowData.firstBuyer
        .bidAmount
    );
  }
);

Then(
  "the First Auction Buyer bid is submitted successfully",
  async function () {
    await this.auctionPage
      .verifyBidSubmitted();

    console.log(
      "Buyer 1 Auction bid submitted successfully"
    );
  }
);

// =====================================================
// BUYER 2
// =====================================================

When(
  "I switch from First Auction Buyer to Second Auction Buyer",
  async function () {
    await clearCurrentSession(this);

    await loginAs(
      this,
      loginData.auctionBuyer2,
      "Second Auction Buyer"
    );
  }
);

When(
  "the Second Auction Buyer opens the created Auction listing",
  async function () {
    await this.generalUserListingsPage
      .openFirstMatchingListing(
        auctionFlowData.secondBuyer
          .searchText
      );

    console.log(
      "Buyer 2 Auction listing opened"
    );
  }
);

When(
  "the Second Auction Buyer registers as a bidder",
  async function () {
    console.log(
      "Starting Buyer 2 bidder registration..."
    );

    // Buyer 2 signature = PAL
    const activePage =
  await this.bidderRegisterPage
    .registerAsBidder(
      "PAL",
      async (title, page) => {
        await takeCucumberScreenshot(
          this,
          `Buyer 2 - ${title}`,
          page
        );
      }
    );

    if (!activePage) {
      throw new Error(
        "Buyer 2 bidder registration did not return the active Auction page."
      );
    }

    this.page = activePage;

    await this.page.bringToFront();

    // Rebuild page objects for new page/tab.
    this.initialisePageObjects();

    console.log(
      "Buyer 2 active page after bidder registration:",
      this.page.url()
    );
  }
);

Then(
  "the Second Auction Buyer registration is successful",
  async function () {
    await this.auctionPage
      .waitUntilBiddingIsOpen();

    console.log(
      "Buyer 2 registration successful"
    );
  }
);

When(
  "the Second Auction Buyer places the configured winning Auction bid",
  async function () {
    console.log(
      "Buyer 2 placing winning Auction bid:",
      auctionFlowData.secondBuyer
        .bidAmount
    );

    await this.auctionPage.placeBid(
      auctionFlowData.secondBuyer
        .bidAmount
    );
  }
);

Then(
  "the Second Auction Buyer bid is submitted successfully",
  async function () {
    await this.auctionPage
      .verifyBidSubmitted();

    console.log(
      "Buyer 2 winning Auction bid submitted successfully"
    );
  }
);

// =====================================================
// WAIT FOR AUCTION END
// =====================================================

When(
  "I wait for the Auction to end",
  async function () {
    console.log(
      "Waiting for Auction to end..."
    );

    // Auction duration = 15 minutes.
    // Give Playwright 18 minutes maximum.
    await this.auctionPage
      .waitForAuctionToEnd(
        18 * 60 * 1000
      );

    console.log(
      "Auction ended. Continuing E2E flow..."
    );
  }
);

Then(
  "the Auction has ended successfully",
  async function () {
    await expect(
      this.auctionPage.auctionEndedText,
      "Auction should be ended"
    ).toBeVisible({
      timeout: 10_000,
    });

    console.log(
      "Auction end verified successfully"
    );
  }
);

// =====================================================
// WINNING BUYER LOGIN FOR SETTLEMENT
//
// IMPORTANT:
// Auction does NOT use:
// settlementPage.start()
// selectSolicitor()
// selectBroker()
//
// Opening the winning property automatically opens
// Property Settlement Process / payment.
// =====================================================

When(
  "I login again as Second Auction Buyer for settlement",
  async function () {
    console.log(
      "Logging Buyer 2 in again for Auction settlement..."
    );

    await clearCurrentSession(this);

    await loginAs(
      this,
      loginData.auctionBuyer2,
      "Second Auction Buyer"
    );

    console.log(
      "Second Auction Buyer logged in again for settlement"
    );
  }
);

When(
  "the Second Auction Buyer opens the created Auction listing again",
  async function () {
    console.log(
      "Searching for winning Auction property..."
    );

    await this.generalUserListingsPage
      .openFirstMatchingListing(
        auctionFlowData.secondBuyer
          .searchText
      );

    console.log(
      "Winning Auction property opened:",
      this.page.url()
    );
  }
);

// =====================================================
// AUCTION SETTLEMENT
//
// DO NOT call:
// this.settlementPage.start()
//
// start() is only for Fixed/Offer because it clicks
// the Continue button.
// =====================================================

When(
  "the Second Auction Buyer starts the Auction settlement process",
  async function () {
    console.log(
      "Waiting for automatic Auction Property Settlement Process..."
    );

    await this.settlementPage
      .waitForAuctionSettlement();

    console.log(
      "Auction Property Settlement Process is ready"
    );
  }
);

// =====================================================
// AUCTION PAYMENT
//
// Card number
// Expiration date
// Security code
// Pay $... AUD
// =====================================================

When(
  "the Second Auction Buyer pays the Auction deposit",
  async function () {
    console.log(
      "Starting Auction deposit payment..."
    );

    await this.settlementPage
      .payAuctionDeposit(
        auctionFlowData.payment
      );
  }
);

// =====================================================
// PAYMENT SUCCESS + POST-PAYMENT SETTLEMENT
// =====================================================

Then(
  "the Auction deposit payment is successful",
  async function () {
    await this.settlementPage
      .verifyAuctionPaymentSuccessful();

    console.log(
      "Auction settlement payment completed successfully"
    );
  }
);

When(
  "the Second Auction Buyer continues after Auction payment",
  async function () {
    await this.settlementPage
      .continueAfterAuctionPayment();
  }
);

When(
  "the Second Auction Buyer continues through Auction personal details",
  async function () {
    await this.settlementPage
      .continueAuctionPersonalDetails();
  }
);

When(
  "the Second Auction Buyer selects the Auction configured solicitor",
  async function () {
    await this.settlementPage
      .selectSolicitor(
        auctionFlowData.settlement
          .solicitorSearch
      );
  }
);

When(
  "the Second Auction Buyer selects the Auction configured mortgage broker",
  async function () {
    await this.settlementPage
      .selectBroker(
        auctionFlowData.settlement
          .brokerSearch,
        {
          expectDeposit: false,
        }
      );
  }
);

When(
  "the Second Auction Buyer completes the Auction settlement",
  async function () {
    await this.settlementPage
      .completeSettlement();
  }
);

Then(
  "the Auction settlement is completed successfully",
  async function () {
    await this.settlementPage
      .verifySettlementCompleted(
        auctionFlowData.expected
          .settlementCompleted
      );

    console.log(
      "Auction Flow 3 settlement completed successfully"
    );
  }
);
