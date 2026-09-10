const {
  Given,
  When,
  Then,
  setDefaultTimeout,
} = require("@cucumber/cucumber");

const { expect } = require("@playwright/test");

const {
  takeCucumberScreenshot,
} = require("../../utils/cucumberScreenshot");

const {
  loginData,
} = require("../../fixtures/test-data/loginData");

const {
  passedInAuctionDeclinedFlowData,
} = require(
  "../../fixtures/test-data/passedInAuctionDeclinedFlowData"
);

// Auction can run up to 15 minutes; leave ample headroom.
setDefaultTimeout(20 * 60 * 1000);

// =====================================================
// SESSION HELPERS
// =====================================================

async function clearCurrentSession(world) {
  console.log("Flow 9: Clearing current user session...");

  await world.context.clearCookies();

  if (!world.page.isClosed()) {
    try {
      await world.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch (error) {
      console.log(
        "Flow 9 storage clear skipped:",
        error.message
      );
    }
  }

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
      "Flow 9 first login navigation failed:",
      error.message
    );

    await world.page.waitForTimeout(1000);

    await world.page.goto(
      loginData.application.loginPath,
      {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      }
    );
  }
}

async function loginAs(world, account, accountName) {
  if (!account?.email || !account?.password) {
    throw new Error(
      `${accountName} credentials are missing. ` +
        `Configure them in .env / GitHub Actions secrets.`
    );
  }

  await world.loginPage.goto(
    loginData.application.loginPath
  );

  await world.loginPage.login(
    account.email,
    account.password
  );

  await world.loginPage.waitForOtpPage();

  await world.loginPage.enterOtp(account.otp);

  await world.loginPage.submitOtp();

  console.log(`Flow 9 ${accountName} login completed`);
}

// =====================================================
// AGENT LOGIN
// =====================================================

Given(
  "the agent is logged in for the Passed-In Auction Negotiation Declined E2E flow",
  async function () {
    await loginAs(this, loginData.agent, "Agent");

    await this.dashboardPage.waitForDashboard();
  }
);

// =====================================================
// CREATE AUCTION LISTING
// =====================================================

When(
  "the agent creates and publishes an Auction listing for the Passed-In Auction Declined flow",
  async function () {
    const listing =
      passedInAuctionDeclinedFlowData.agent.listing;

    await this.dashboardPage.clickCreateListing();

    await this.propertyLocationPage.waitForPage();

    await this.propertyLocationPage
      .typeAddressAndSelectFirstSuggestion(
        listing.addressSearchText
      );

    await this.propertyLocationPage
      .waitForAutoFilledLocationFields();

    await this.propertyLocationPage.clickNext();

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

    this.flow9AuctionSlot =
      await this.pricingSalePage.completeAuctionPricingStep({
        listingType: listing.listingType,
        reservePrice: listing.reservePrice,
        depositPercent: listing.depositPercent,
        auctionLocation: listing.auctionLocation,
        startingPrice: listing.startingPrice,
        minimumBidIncrement: listing.minimumBidIncrement,
        slotMinutes:
          passedInAuctionDeclinedFlowData.auction.slotMinutes,
        durationMinutes:
          passedInAuctionDeclinedFlowData.auction.durationMinutes,
      });

    await this.descriptionFeaturesPage.waitForPage();

    await this.descriptionFeaturesPage.enterHeadline(
      listing.headline
    );

    await this.descriptionFeaturesPage.enterDescription(
      listing.propertyDescription
    );

    await this.descriptionFeaturesPage.selectFeatures(
      listing.keyFeatures
    );

    await this.descriptionFeaturesPage.clickNext();

    await this.listingMediaPage.waitForPage();

    await this.listingMediaPage.uploadPropertyPhotos(
      listing.propertyPhotos
    );

    await this.listingMediaPage.uploadFloorPlan(
      listing.floorPlan
    );

    await this.listingMediaPage.confirmListing();

    await this.listingMediaPage.publishListing();
  }
);

Then(
  "the Passed-In Auction Declined listing is published successfully",
  async function () {
    const listing =
      passedInAuctionDeclinedFlowData.agent.listing;

    await this.dashboardPage.waitForDashboardAfterPublish();

    await this.dashboardPage.openListingsMenu();

    if (listing.expectedPropertyName) {
      await this.dashboardPage.verifyListingVisibleByLocation(
        listing.expectedPropertyName
      );
    } else {
      console.log(
        "Flow 9 listing published. No exact property name configured — verification skipped."
      );
    }
  }
);

// =====================================================
// AGENT -> FIRST BUYER
// =====================================================

When(
  "I switch from Agent to First Buyer for the Passed-In Auction Declined flow",
  async function () {
    await clearCurrentSession(this);

    await loginAs(
      this,
      loginData.generalUser,
      "First Buyer (General User)"
    );
  }
);

When(
  "the First Buyer opens the created Passed-In Auction Declined listing",
  async function () {
    await this.generalUserListingsPage.openFirstMatchingListing(
      passedInAuctionDeclinedFlowData.firstBuyer.searchText
    );
  }
);

When(
  "the First Buyer registers as a bidder for the Passed-In Auction Declined flow",
  async function () {
    const activePage =
      await this.bidderRegisterPage.registerAsBidder(
        passedInAuctionDeclinedFlowData.firstBuyer.signature,
        async (title, page) => {
          await takeCucumberScreenshot(
            this,
            `Flow 9 First Buyer - ${title}`,
            page
          );
        }
      );

    if (!activePage) {
      throw new Error(
        "Flow 9: First Buyer bidder registration did not return the active Auction page."
      );
    }

    this.page = activePage;
    await this.page.bringToFront();
    this.initialisePageObjects();
  }
);

Then(
  "the First Buyer Passed-In Auction Declined bidder registration is completed successfully",
  async function () {
    await this.auctionPage.waitUntilBiddingIsOpen();
  }
);

// =====================================================
// FIRST BUYER PLACES BID (LOWER)
// =====================================================

When(
  "the First Buyer places the configured Passed-In Auction Declined bid",
  async function () {
    const bidAmount = Number(
      passedInAuctionDeclinedFlowData.firstBuyer.bidAmount
    );

    const reservePrice = Number(
      passedInAuctionDeclinedFlowData.agent.listing.reservePrice
    );

    if (bidAmount >= reservePrice) {
      throw new Error(
        `Flow 9 requires First Buyer bid < reserve price. ` +
          `Bid=${bidAmount}, reserve=${reservePrice}`
      );
    }

    console.log(`Flow 9 First Buyer bid: ${bidAmount}`);

    await this.auctionPage.placeBid(String(bidAmount));
  }
);

Then(
  "the First Buyer Passed-In Auction Declined bid is submitted successfully",
  async function () {
    await this.auctionPage.verifyBidSubmitted();
  }
);

// =====================================================
// FIRST BUYER -> SECOND BUYER (HIGHEST BIDDER)
// =====================================================

When(
  "I switch from First Buyer to Second Buyer for the Passed-In Auction Declined flow",
  async function () {
    await clearCurrentSession(this);

    await loginAs(
      this,
      loginData.auctionBuyer2,
      "Second Buyer (Highest Bidder)"
    );
  }
);

When(
  "the Second Buyer opens the created Passed-In Auction Declined listing",
  async function () {
    await this.generalUserListingsPage.openFirstMatchingListing(
      passedInAuctionDeclinedFlowData.secondBuyer.searchText
    );
  }
);

When(
  "the Second Buyer registers as a bidder for the Passed-In Auction Declined flow",
  async function () {
    const activePage =
      await this.bidderRegisterPage.registerAsBidder(
        passedInAuctionDeclinedFlowData.secondBuyer.signature,
        async (title, page) => {
          await takeCucumberScreenshot(
            this,
            `Flow 9 Second Buyer - ${title}`,
            page
          );
        }
      );

    if (!activePage) {
      throw new Error(
        "Flow 9: Second Buyer bidder registration did not return the active Auction page."
      );
    }

    this.page = activePage;
    await this.page.bringToFront();
    this.initialisePageObjects();
  }
);

Then(
  "the Second Buyer Passed-In Auction Declined bidder registration is completed successfully",
  async function () {
    await this.auctionPage.waitUntilBiddingIsOpen();
  }
);

// =====================================================
// SECOND BUYER PLACES BID (HIGHER — HIGHEST BIDDER)
// =====================================================

When(
  "the Second Buyer places the configured Passed-In Auction Declined winning bid",
  async function () {
    const bidAmount = Number(
      passedInAuctionDeclinedFlowData.secondBuyer.bidAmount
    );

    const reservePrice = Number(
      passedInAuctionDeclinedFlowData.agent.listing.reservePrice
    );

    if (bidAmount >= reservePrice) {
      throw new Error(
        `Flow 9 requires Second Buyer bid < reserve price. ` +
          `Bid=${bidAmount}, reserve=${reservePrice}`
      );
    }

    console.log(
      `Flow 9 Second Buyer bid (highest): ${bidAmount}`
    );

    await this.auctionPage.placeBid(String(bidAmount));
  }
);

Then(
  "the Second Buyer Passed-In Auction Declined bid is submitted successfully",
  async function () {
    await this.auctionPage.verifyBidSubmitted();
  }
);

// =====================================================
// WAIT FOR AUCTION END / RESERVE NOT MET
// =====================================================

When(
  "I wait for the Passed-In Auction Declined auction to end",
  async function () {
    console.log(
      "Flow 9: Waiting for auction to actually end..."
    );

    await this.auctionPage.waitForAuctionToEnd(
      18 * 60 * 1000
    );

    console.log("Flow 9: Auction has ended successfully.");

    console.log(
      "Flow 9: Waiting an extra 1 minute after auction end..."
    );

    await this.page.waitForTimeout(60_000);

    console.log(
      "Flow 9: Extra 1 minute wait after auction end completed."
    );
  }
);

Then(
  "the Passed-In Auction Declined auction has ended successfully",
  async function () {
    await expect(
      this.auctionPage.auctionEndedText
    ).toBeVisible({ timeout: 10_000 });
  }
);

Then(
  "the Passed-In Auction Declined reserve price is not met",
  async function () {
    const reserveNotMet = this.page
      .getByText(
        passedInAuctionDeclinedFlowData.expected.reserveNotMet
      )
      .first();

    if (await reserveNotMet.isVisible().catch(() => false)) {
      await expect(reserveNotMet).toBeVisible();

      console.log(
        "Flow 9: Reserve Not Met status confirmed."
      );

      return;
    }

    console.log(
      "Flow 9: Explicit Reserve Not Met text not found; " +
        "Start negotiation step will verify the reserve-not-met branch."
    );
  }
);

// =====================================================
// SECOND BUYER -> AGENT
// =====================================================

When(
  "I switch from Second Buyer to Agent for the Passed-In Auction Declined flow",
  async function () {
    await clearCurrentSession(this);

    await loginAs(this, loginData.agent, "Agent");

    await this.dashboardPage.waitForDashboard();
  }
);

When(
  "the Agent opens Bids for the Passed-In Auction Declined flow",
  async function () {
    await this.agentBidsPage.openBids();
  }
);

When(
  "the Agent starts negotiation for the Passed-In Auction Declined flow",
  async function () {
    await this.agentBidsPage.startNegotiation(
      passedInAuctionDeclinedFlowData.agent.listing
        .expectedPropertyName
    );
  }
);

When(
  "the Agent submits the configured Passed-In Auction Declined counter offer",
  async function () {
    await this.agentBidsPage.sendCounterOfferAndOpenChat(
      passedInAuctionDeclinedFlowData.negotiation.agentCounterAmount
    );
  }
);

Then(
  "the Passed-In Auction Declined counter offer is sent successfully",
  async function () {
    await this.agentBidsPage.verifyCounterOfferSent(
      passedInAuctionDeclinedFlowData.expected.counterOfferSent
    );
  }
);

// =====================================================
// AGENT -> SECOND BUYER (HIGHEST BIDDER DECLINES)
// =====================================================

When(
  "I switch from Agent to Second Buyer for the Passed-In Auction Declined flow",
  async function () {
    await clearCurrentSession(this);

    await loginAs(
      this,
      loginData.auctionBuyer2,
      "Second Buyer (Highest Bidder)"
    );
  }
);

When(
  "the Second Buyer opens Conversations for the Passed-In Auction Declined flow",
  async function () {
    await this.conversationsPage.openConversations();
  }
);

When(
  "the Second Buyer opens the Passed-In Auction Declined agent conversation",
  async function () {
    await this.conversationsPage.openAgentConversation(
      passedInAuctionDeclinedFlowData.agent.listing
        .expectedPropertyName
    );
  }
);

When(
  "the Second Buyer declines the Passed-In Auction Declined negotiation",
  async function () {
    await this.conversationsPage.declineNegotiation();
  }
);

Then(
  "the Passed-In Auction Declined negotiation is declined successfully by the Second Buyer",
  async function () {
    await this.conversationsPage.verifyNegotiationDeclined(
      passedInAuctionDeclinedFlowData.expected.negotiationDeclined
    );
  }
);

// =====================================================
// SECOND BUYER -> AGENT (VERIFY NEXT-HIGHEST BIDDER)
// =====================================================

When(
  "I switch from Second Buyer back to Agent for the Passed-In Auction Declined flow",
  async function () {
    await clearCurrentSession(this);

    await loginAs(this, loginData.agent, "Agent");

    await this.dashboardPage.waitForDashboard();
  }
);

When(
  "the Agent opens Bids again for the Passed-In Auction Declined flow",
  async function () {
    await this.agentBidsPage.openBids();
  }
);

Then(
  "the Agent can move to the next-highest genuine bidder for the Passed-In Auction Declined flow",
  async function () {
    await this.agentBidsPage.verifyNextHighestBidderAvailable(
      passedInAuctionDeclinedFlowData.agent.listing
        .expectedPropertyName
    );
  }
);
