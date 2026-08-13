const {
  Given,
  When,
  Then,
  setDefaultTimeout,
} = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");

setDefaultTimeout(20 * 60 * 1000);

const { loginData } = require("../../fixtures/test-data/loginData");
const {
  auctionFlowData,
} = require("../../fixtures/test-data/auctionFlowData");

// =====================================================
// HELPERS
// =====================================================

async function clearCurrentSession(world) {
  await world.context.clearCookies();

  await world.page.goto(world.baseURL || "https://uat.realey.au/");

  await world.page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await world.page.goto(loginData.application.loginPath);
}

async function loginAs(world, account, accountName) {
  if (!account?.email || !account?.password) {
    throw new Error(
      `${accountName} credentials are missing. Configure email/password in .env or GitHub Actions secrets.`
    );
  }

  await world.loginPage.goto(loginData.application.loginPath);
  await world.loginPage.login(account.email, account.password);
  await world.loginPage.waitForOtpPage();
  await world.loginPage.enterOtp(account.otp);
  await world.loginPage.submitOtp();
}

// =====================================================
// AGENT LOGIN
// =====================================================

Given("the agent is logged in for the Auction E2E flow", async function () {
  await loginAs(this, loginData.agent, "Agent");
  await this.dashboardPage.waitForDashboard();
});

// =====================================================
// CREATE AUCTION LISTING
// =====================================================

When("the agent creates and publishes an Auction listing", async function () {
  const listing = auctionFlowData.agent.listing;

  await this.dashboardPage.clickCreateListing();

  // Property Location
  await this.propertyLocationPage.waitForPage();
  await this.propertyLocationPage.typeAddressAndSelectFirstSuggestion(
    listing.addressSearchText
  );
  await this.propertyLocationPage.waitForAutoFilledLocationFields();
  await this.propertyLocationPage.clickNext();

  // Property Details
  await this.propertyDetailsPage.waitForPage();
  await this.propertyDetailsPage.completeDetailsStep({
    propertyType: listing.propertyType,
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    carSpaces: listing.carSpaces,
    landSize: listing.landSize || "",
    buildingSize: listing.buildingSize || "",
    yearBuilt: listing.yearBuilt || "",
  });

  // Auction Pricing & Sale Method
  this.auctionSlot = await this.pricingSalePage.completeAuctionPricingStep({
    listingType: listing.listingType,
    reservePrice: listing.reservePrice,
    depositPercent: listing.depositPercent,
    auctionLocation: listing.auctionLocation,
    startingPrice: listing.startingPrice,
    minimumBidIncrement: listing.minimumBidIncrement,
    slotMinutes: auctionFlowData.auction.slotMinutes,
    durationMinutes: auctionFlowData.auction.durationMinutes,
  });

  // Description & Features
  await this.descriptionFeaturesPage.waitForPage();
  await this.descriptionFeaturesPage.enterHeadline(listing.headline);
  await this.descriptionFeaturesPage.enterDescription(
    listing.propertyDescription
  );
  await this.descriptionFeaturesPage.selectFeatures(listing.keyFeatures);
  await this.descriptionFeaturesPage.clickNext();

  // Listing Media
  await this.listingMediaPage.waitForPage();
  await this.listingMediaPage.uploadPropertyPhotos(listing.propertyPhotos);
  await this.listingMediaPage.uploadFloorPlan(listing.floorPlan);
  await this.listingMediaPage.confirmListing();
  await this.listingMediaPage.publishListing();
});

Then("the Auction listing is published successfully", async function () {
  const listing = auctionFlowData.agent.listing;

  await this.dashboardPage.waitForDashboardAfterPublish();
  await this.dashboardPage.openListingsMenu();
  await this.dashboardPage.verifyListingVisibleByLocation(
    listing.expectedPropertyName
  );
});

// =====================================================
// BUYER 1
// =====================================================

When("I switch from Agent to First Auction Buyer", async function () {
  await clearCurrentSession(this);
  await loginAs(this, loginData.generalUser, "First Auction Buyer");
});

When(
  "the First Auction Buyer opens the created Auction listing",
  async function () {
    await this.generalUserListingsPage.openFirstMatchingListing(
      auctionFlowData.firstBuyer.searchText
    );
  }
);

When("the First Auction Buyer registers as a bidder", async function () {
  const activePage = await this.bidderRegisterPage.registerAsBidder();

  if (!activePage) {
    throw new Error("Bidder registration did not return the active Auction page.");
  }

  this.page = activePage;
  await this.page.bringToFront();

  this.initialisePageObjects();

  console.log(
    "Buyer 1 active page after bidder registration:",
    this.page.url()
  );
});

Then("the First Auction Buyer registration is successful", async function () {
  await this.auctionPage.waitUntilBiddingIsOpen();
});

When(
  "the First Auction Buyer places the configured Auction bid",
  async function () {
    await this.auctionPage.placeBid(auctionFlowData.firstBuyer.bidAmount);
  }
);

Then("the First Auction Buyer bid is submitted successfully", async function () {
  await this.auctionPage.verifyBidSubmitted();
});

// =====================================================
// BUYER 2
// =====================================================

When(
  "I switch from First Auction Buyer to Second Auction Buyer",
  async function () {
    await clearCurrentSession(this);
    await loginAs(this, loginData.auctionBuyer2, "Second Auction Buyer");
  }
);

When(
  "the Second Auction Buyer opens the created Auction listing",
  async function () {
    await this.generalUserListingsPage.openFirstMatchingListing(
      auctionFlowData.secondBuyer.searchText
    );
  }
);

When("the Second Auction Buyer registers as a bidder", async function () {
  const activePage = await this.bidderRegisterPage.registerAsBidder();

  if (!activePage) {
    throw new Error("Buyer 2 bidder registration did not return the active Auction page.");
  }

  this.page = activePage;
  await this.page.bringToFront();

  this.initialisePageObjects();

  console.log(
    "Buyer 2 active page after bidder registration:",
    this.page.url()
  );
});

Then("the Second Auction Buyer registration is successful", async function () {
  await this.auctionPage.waitUntilBiddingIsOpen();
});

When(
  "the Second Auction Buyer places the configured winning Auction bid",
  async function () {
    await this.auctionPage.placeBid(auctionFlowData.secondBuyer.bidAmount);
  }
);

Then(
  "the Second Auction Buyer bid is submitted successfully",
  async function () {
    await this.auctionPage.verifyBidSubmitted();
  }
);

// =====================================================
// WAIT FOR END
// =====================================================

// =====================================================
// WAIT FOR AUCTION END
// =====================================================

When("I wait for the Auction to end", async function () {
  console.log(
    "Waiting for Auction to end..."
  );

  // Auction duration = 15 minutes
  // Playwright gets 18 minutes maximum as safety margin
  await this.auctionPage.waitForAuctionToEnd(
    18 * 60 * 1000
  );

  console.log(
    "Auction ended. Continuing the E2E flow..."
  );
});

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
// AGENT -> BIDS -> NEGOTIATION
// =====================================================

When(
  "I switch from Second Auction Buyer to Agent for the Auction flow",
  async function () {
    await clearCurrentSession(this);
    await loginAs(this, loginData.agent, "Agent");
    await this.dashboardPage.waitForDashboard();
  }
);

When("the Agent opens Auction Bids", async function () {
  await this.agentBidsPage.openBids();
});

When("the Agent starts negotiation with the winning bidder", async function () {
  await this.agentBidsPage.startNegotiation();
});

// =====================================================
// WINNING BUYER SETTLEMENT
// =====================================================

When(
  "I login again as Second Auction Buyer for settlement",
  async function () {
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
    await this.generalUserListingsPage.openFirstMatchingListing(
      auctionFlowData.secondBuyer.searchText
    );
  }
);

When(
  "the Second Auction Buyer starts the Auction settlement process",
  async function () {
    await this.settlementPage.start();
  }
);

When(
  "the Second Auction Buyer selects the configured solicitor",
  async function () {
    await this.settlementPage.selectSolicitor(
      auctionFlowData.settlement.solicitorSearch
    );
  }
);

When(
  "the Second Auction Buyer selects the configured mortgage broker",
  async function () {
    await this.settlementPage.selectBroker(
      auctionFlowData.settlement.brokerSearch
    );
  }
);

When("the Second Auction Buyer pays the Auction deposit", async function () {
  await this.settlementPage.payDeposit(auctionFlowData.payment);
});

Then("the Auction deposit payment is successful", async function () {
  await this.settlementPage.verifyPaymentSuccessful(
    auctionFlowData.expected.paymentSuccessful
  );
});
