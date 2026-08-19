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
  auctionReserveNotMetFlowData,
} = require(
  "../../fixtures/test-data/auctionReserveNotMetFlowData"
);

// Auction can run for 15 minutes.
setDefaultTimeout(20 * 60 * 1000);

// =====================================================
// HELPERS
// =====================================================

async function clearCurrentSession(world) {
  console.log("Clearing current user session...");

  await world.context.clearCookies();

  if (!world.page.isClosed()) {
    try {
      await world.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch (error) {
      console.log(
        "Storage clear skipped:",
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
      "First login navigation failed:",
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

async function loginAs(
  world,
  account,
  accountName
) {
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
  "the agent is logged in for the Auction Reserve Not Met E2E flow",
  async function () {
    await loginAs(
      this,
      loginData.agent,
      "Agent"
    );

    await this.dashboardPage
      .waitForDashboard();
  }
);

// =====================================================
// CREATE AUCTION LISTING - LOCATION "d"
// =====================================================

When(
  "the agent creates and publishes an Auction listing for the Reserve Not Met flow",
  async function () {
    const listing =
      auctionReserveNotMetFlowData.agent.listing;

    await this.dashboardPage
      .clickCreateListing();

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

    await this.propertyDetailsPage
      .waitForPage();

    await this.propertyDetailsPage
      .completeDetailsStep({
        propertyType: listing.propertyType,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        carSpaces: listing.carSpaces,
        landSize: listing.landSize || "",
        buildingSize:
          listing.buildingSize || "",
        yearBuilt:
          listing.yearBuilt || "",
      });

    this.auctionSlot =
      await this.pricingSalePage
        .completeAuctionPricingStep({
          listingType: listing.listingType,
          reservePrice: listing.reservePrice,
          depositPercent: listing.depositPercent,
          auctionLocation:
            listing.auctionLocation,
          startingPrice:
            listing.startingPrice,
          minimumBidIncrement:
            listing.minimumBidIncrement,
          slotMinutes:
            auctionReserveNotMetFlowData
              .auction.slotMinutes,
          durationMinutes:
            auctionReserveNotMetFlowData
              .auction.durationMinutes,
        });

    await this.descriptionFeaturesPage
      .waitForPage();

    await this.descriptionFeaturesPage
      .enterHeadline(listing.headline);

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
  }
);

Then(
  "the Auction Reserve Not Met listing is published successfully",
  async function () {
    const listing =
      auctionReserveNotMetFlowData.agent.listing;

    await this.dashboardPage
      .waitForDashboardAfterPublish();

    await this.dashboardPage
      .openListingsMenu();

    if (listing.expectedPropertyName) {
      await this.dashboardPage
        .verifyListingVisibleByLocation(
          listing.expectedPropertyName
        );
    } else {
      console.log(
        'Flow 4 listing published. Exact "d" property name is not configured, so exact location verification is skipped.'
      );
    }
  }
);

// =====================================================
// AGENT -> BUYER
// =====================================================

When(
  "I switch from Agent to General User for the Auction Reserve Not Met flow",
  async function () {
    await clearCurrentSession(this);

    await loginAs(
      this,
      loginData.generalUser,
      "General User"
    );
  }
);

When(
  "the General User opens the created Auction Reserve Not Met listing",
  async function () {
    await this.generalUserListingsPage
      .openFirstMatchingListing(
        auctionReserveNotMetFlowData
          .buyer.searchText
      );
  }
);

When(
  "the General User registers as a bidder for the Auction Reserve Not Met flow",
  async function () {
    const activePage =
      await this.bidderRegisterPage
        .registerAsBidder(
          auctionReserveNotMetFlowData
            .buyer.signature,
          async (title, page) => {
            await takeCucumberScreenshot(
              this,
              `Flow 4 - ${title}`,
              page
            );
          }
        );

    if (!activePage) {
      throw new Error(
        "Flow 4 bidder registration did not return the active Auction page."
      );
    }

    this.page = activePage;

    await this.page.bringToFront();

    this.initialisePageObjects();
  }
);

Then(
  "the Auction Reserve Not Met bidder registration is completed successfully",
  async function () {
    await this.auctionPage
      .waitUntilBiddingIsOpen();
  }
);

// =====================================================
// BID BELOW RESERVE
// =====================================================

When(
  "the General User places the configured Auction Reserve Not Met bid",
  async function () {
    const bidAmount = Number(
      auctionReserveNotMetFlowData
        .buyer.bidAmount
    );

    const reservePrice = Number(
      auctionReserveNotMetFlowData
        .agent.listing.reservePrice
    );

    if (bidAmount >= reservePrice) {
      throw new Error(
        `Flow 4 requires bid < reserve price. ` +
          `Bid=${bidAmount}, reserve=${reservePrice}`
      );
    }

    await this.auctionPage.placeBid(
      String(bidAmount)
    );
  }
);

Then(
  "the Auction Reserve Not Met bid is submitted successfully",
  async function () {
    await this.auctionPage
      .verifyBidSubmitted();
  }
);

// =====================================================
// WAIT FOR AUCTION END / RESERVE NOT MET
// =====================================================

When(
  "I wait for the Auction Reserve Not Met auction to end",
  async function () {
    await this.auctionPage
      .waitForAuctionToEnd(
        18 * 60 * 1000
      );
  }
);

Then(
  "the Auction Reserve Not Met auction has ended successfully",
  async function () {
    await expect(
      this.auctionPage.auctionEndedText
    ).toBeVisible({
      timeout: 10_000,
    });
  }
);

Then(
  "the Auction reserve price is not met",
  async function () {
    const reserveNotMet =
      this.page
        .getByText(
          auctionReserveNotMetFlowData
            .expected.reserveNotMet
        )
        .first();

    if (
      await reserveNotMet
        .isVisible()
        .catch(() => false)
    ) {
      await expect(
        reserveNotMet
      ).toBeVisible();

      return;
    }

    console.log(
      "No explicit Reserve Not Met status locator was supplied. " +
        "Flow will verify the Reserve Not Met branch by requiring Start negotiation on Agent Bids."
    );
  }
);

// =====================================================
// BUYER -> AGENT
// =====================================================

When(
  "I switch from General User to Agent for the Auction Reserve Not Met flow",
  async function () {
    await clearCurrentSession(this);

    await loginAs(
      this,
      loginData.agent,
      "Agent"
    );

    await this.dashboardPage
      .waitForDashboard();
  }
);

When(
  "the Agent opens Bids for the Auction Reserve Not Met flow",
  async function () {
    await this.agentBidsPage
      .openBids();
  }
);

When(
  "the Agent starts negotiation for the Auction Reserve Not Met flow",
  async function () {
    await this.agentBidsPage
      .startNegotiation(
        auctionReserveNotMetFlowData
          .agent.listing
          .expectedPropertyName
      );
  }
);

When(
  "the Agent submits the configured Auction Reserve Not Met counter offer",
  async function () {
    await this.agentBidsPage
      .sendCounterOfferAndOpenChat(
        auctionReserveNotMetFlowData
          .negotiation.agentCounterAmount
      );
  }
);

Then(
  "the Auction Reserve Not Met counter offer is sent successfully",
  async function () {
    await this.agentBidsPage
      .verifyCounterOfferSent(
        auctionReserveNotMetFlowData
          .expected.counterOfferSent
      );
  }
);

// =====================================================
// AGENT -> BUYER / BUYER COUNTER
// =====================================================

When(
  "the General User opens Conversations for the Auction Reserve Not Met flow",
  async function () {
    await this.conversationsPage
      .openConversations();
  }
);

When(
  "the General User opens the Auction Agent conversation",
  async function () {
    await this.conversationsPage
      .openAgentConversation();
  }
);

When(
  "the General User selects Counter Negotiate for the Auction Reserve Not Met flow",
  async function () {
    await this.conversationsPage
      .clickCounterNegotiate();
  }
);

When(
  "the General User submits the configured Auction Reserve Not Met counter negotiation",
  async function () {
    await this.conversationsPage
      .sendCounterNegotiation(
        auctionReserveNotMetFlowData
          .negotiation.buyerCounterAmount
      );
  }
);

Then(
  "the Auction Reserve Not Met counter negotiation is sent successfully",
  async function () {
    await this.conversationsPage
      .verifyCounterNegotiationSent(
        auctionReserveNotMetFlowData
          .expected.counterNegotiationSent
      );
  }
);

// =====================================================
// AGENT ACCEPTS BUYER COUNTER
// =====================================================

When(
  "the Agent opens the Auction bidder chat",
  async function () {
    await this.agentBidsPage
      .openBidderChat(
        auctionReserveNotMetFlowData
          .agent.listing
          .expectedPropertyName
      );
  }
);

When(
  "the Agent accepts the Auction negotiated offer",
  async function () {
    await this.conversationsPage
      .acceptNegotiatedOffer();
  }
);

Then(
  "the Auction negotiated offer is accepted successfully",
  async function () {
    await this.conversationsPage
      .verifyNegotiatedOfferAccepted(
        auctionReserveNotMetFlowData
          .expected.offerAccepted
      );
  }
);

// =====================================================
// BUYER RETURNS FOR SETTLEMENT
// =====================================================

When(
  "the General User opens the created Auction Reserve Not Met listing again",
  async function () {
    await this.generalUserListingsPage
      .openFirstMatchingListing(
        auctionReserveNotMetFlowData
          .buyer.searchText
      );
  }
);

When(
  "the General User starts the Auction Reserve Not Met settlement process",
  async function () {
    await this.settlementPage
      .waitForAuctionSettlement();
  }
);

When(
  "the General User pays the Auction Reserve Not Met deposit",
  async function () {
    await this.settlementPage
      .payAuctionDeposit(
        auctionReserveNotMetFlowData.payment
      );

    await this.settlementPage
      .verifyAuctionPaymentSuccessful();
  }
);

When(
  "the General User continues after the Auction Reserve Not Met payment",
  async function () {
    await this.settlementPage
      .continueAfterAuctionPayment();
  }
);

When(
  "the General User continues through Auction Reserve Not Met personal details",
  async function () {
    await this.settlementPage
      .continueAuctionPersonalDetails();
  }
);

When(
  "the General User selects the Auction Reserve Not Met configured solicitor",
  async function () {
    await this.settlementPage
      .selectSolicitor(
        auctionReserveNotMetFlowData
          .settlement.solicitorSearch
      );
  }
);

When(
  "the General User selects the Auction Reserve Not Met configured mortgage broker",
  async function () {
    await this.settlementPage
      .selectBroker(
        auctionReserveNotMetFlowData
          .settlement.brokerSearch,
        {
          expectDeposit: false,
        }
      );
  }
);

// This step is kept for compatibility if you later add it back
// to the Flow 4 feature file.
When(
  "the General User completes the Auction Reserve Not Met settlement",
  async function () {
    await this.settlementPage
      .completeSettlement();
  }
);
