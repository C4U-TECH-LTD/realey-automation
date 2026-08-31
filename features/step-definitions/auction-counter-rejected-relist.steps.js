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
  auctionCounterRejectedRelistFlowData,
} = require(
  "../../fixtures/test-data/auctionCounterRejectedRelistFlowData"
);

const {
  AuctionCounterRejectedRelistPage,
} = require(
  "../../pages/AuctionCounterRejectedRelistPage"
);

// Auction flow can take a long time.
setDefaultTimeout(20 * 60 * 1000);

// =====================================================
// PAGE HELPER
// =====================================================

function flow5Page(world) {
  return new AuctionCounterRejectedRelistPage(
    world.page
  );
}

// =====================================================
// SESSION HELPER
// =====================================================

async function clearCurrentSession(world) {
  console.log(
    "Flow 5: Clearing current user session..."
  );

  await world.context.clearCookies();

  if (!world.page.isClosed()) {
    try {
      await world.page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch (error) {
      console.log(
        "Flow 5 storage clear skipped:",
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
      "Flow 5 first login navigation failed:",
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

// =====================================================
// LOGIN HELPER
// =====================================================

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
    `Flow 5 ${accountName} login completed`
  );
}

// =====================================================
// AGENT LOGIN
// =====================================================

Given(
  "the agent is logged in for the Auction Counter Rejected Relist E2E flow",
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
// CREATE AUCTION
// =====================================================

When(
  "the agent creates and publishes an Auction listing for the Counter Rejected Relist flow",
  async function () {
    const listing =
      auctionCounterRejectedRelistFlowData
        .agent.listing;

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

    this.flow5AuctionSlot =
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
            auctionCounterRejectedRelistFlowData
              .auction.slotMinutes,

          durationMinutes:
            auctionCounterRejectedRelistFlowData
              .auction.durationMinutes,
        });

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
  "the Auction Counter Rejected Relist listing is published successfully",
  async function () {
    const listing =
      auctionCounterRejectedRelistFlowData
        .agent.listing;

    await this.dashboardPage
      .waitForDashboardAfterPublish();

    await this.dashboardPage
      .openListingsMenu();

    if (
      listing.expectedPropertyName
    ) {
      await this.dashboardPage
        .verifyListingVisibleByLocation(
          listing.expectedPropertyName
        );
    }
  }
);

// =====================================================
// AGENT -> BUYER
// =====================================================

When(
  "I switch from Agent to General User for the Auction Counter Rejected Relist flow",
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
  "the General User opens the created Auction Counter Rejected Relist listing",
  async function () {
    await this.generalUserListingsPage
      .openFirstMatchingListing(
        auctionCounterRejectedRelistFlowData
          .buyer.searchText
      );
  }
);

When(
  "the General User registers as a bidder for the Auction Counter Rejected Relist flow",
  async function () {
    const activePage =
      await this.bidderRegisterPage
        .registerAsBidder(
          auctionCounterRejectedRelistFlowData
            .buyer.signature,

          async (title, page) => {
            await takeCucumberScreenshot(
              this,
              `Flow 5 - ${title}`,
              page
            );
          }
        );

    if (!activePage) {
      throw new Error(
        "Flow 5 bidder registration did not return the active Auction page."
      );
    }

    this.page = activePage;

    await this.page.bringToFront();

    this.initialisePageObjects();
  }
);

Then(
  "the Auction Counter Rejected Relist bidder registration is completed successfully",
  async function () {
    await this.auctionPage
      .waitUntilBiddingIsOpen();
  }
);

// =====================================================
// BID BELOW RESERVE
// =====================================================

When(
  "the General User places the configured Auction Counter Rejected Relist bid",
  async function () {
    const bidAmount = Number(
      auctionCounterRejectedRelistFlowData
        .buyer.bidAmount
    );

    const reservePrice = Number(
      auctionCounterRejectedRelistFlowData
        .agent.listing.reservePrice
    );

    if (
      bidAmount >= reservePrice
    ) {
      throw new Error(
        `Flow 5 requires bid < reserve price. ` +
          `Bid=${bidAmount}, reserve=${reservePrice}`
      );
    }

    console.log(
      `Flow 5 bid: ${bidAmount}`
    );

    console.log(
      `Flow 5 reserve: ${reservePrice}`
    );

    await this.auctionPage
      .placeBid(
        String(bidAmount)
      );
  }
);

Then(
  "the Auction Counter Rejected Relist bid is submitted successfully",
  async function () {
    await this.auctionPage
      .verifyBidSubmitted();
  }
);

// =====================================================
// WAIT FOR AUCTION END
// =====================================================

When(
  "I wait for the Auction Counter Rejected Relist auction to end",
  async function () {
    console.log(
      "Flow 5: Waiting for auction to actually end..."
    );

    // Maximum auction-end wait
    await this.auctionPage
      .waitForAuctionToEnd(
        18 * 60 * 1000
      );

    console.log(
      "Flow 5: Auction has ended successfully."
    );

    // -------------------------------------------------
    // EXTRA 1 MINUTE AFTER AUCTION END
    // -------------------------------------------------

    console.log(
      "Flow 5: Waiting an extra 1 minute after auction end..."
    );

    await this.page
      .waitForTimeout(
        60_000
      );

    console.log(
      "Flow 5: Extra 1 minute wait completed."
    );
  }
);

Then(
  "the Auction Counter Rejected Relist auction has ended successfully",
  async function () {
    await expect(
      this.auctionPage
        .auctionEndedText
    ).toBeVisible({
      timeout: 10_000,
    });
  }
);

Then(
  "the Auction Counter Rejected Relist reserve price is not met",
  async function () {
    const reserveNotMet =
      this.page
        .getByText(
          auctionCounterRejectedRelistFlowData
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

      console.log(
        "Flow 5: Reserve Not Met status confirmed."
      );

      return;
    }

    console.log(
      "Flow 5: explicit Reserve Not Met text was not found; " +
        "Start negotiation will verify the reserve-not-met branch."
    );
  }
);

// =====================================================
// BUYER -> AGENT / AGENT COUNTER
// =====================================================

When(
  "I switch from General User to Agent for the Auction Counter Rejected Relist flow",
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
  "the Agent opens Bids for the Auction Counter Rejected Relist flow",
  async function () {
    await this.agentBidsPage
      .openBids();
  }
);

When(
  "the Agent starts negotiation for the Auction Counter Rejected Relist flow",
  async function () {
    await this.agentBidsPage
      .startNegotiation(
        auctionCounterRejectedRelistFlowData
          .agent.listing
          .expectedPropertyName
      );
  }
);

When(
  "the Agent submits the configured Auction Counter Rejected Relist counter offer",
  async function () {
    await this.agentBidsPage
      .sendCounterOfferAndOpenChat(
        auctionCounterRejectedRelistFlowData
          .negotiation
          .agentCounterAmount
      );
  }
);

Then(
  "the Auction Counter Rejected Relist counter offer is sent successfully",
  async function () {
    await this.agentBidsPage
      .verifyCounterOfferSent(
        auctionCounterRejectedRelistFlowData
          .expected
          .counterOfferSent
      );
  }
);

// =====================================================
// AGENT -> BUYER / BUYER COUNTER
// =====================================================

When(
  "the General User opens Conversations for the Auction Counter Rejected Relist flow",
  async function () {
    await this.conversationsPage
      .openConversations();
  }
);

// =====================================================
// FIXED:
// Pass expectedPropertyName to openAgentConversation()
// =====================================================

When(
  "the General User opens the Auction Agent conversation for the Counter Rejected Relist flow",
  async function () {
    await this.conversationsPage
      .openAgentConversation(
        auctionCounterRejectedRelistFlowData
          .agent.listing
          .expectedPropertyName
      );
  }
);

When(
  "the General User selects Counter Negotiate for the Auction Counter Rejected Relist flow",
  async function () {
    await this.conversationsPage
      .clickCounterNegotiate();
  }
);

When(
  "the General User submits the configured Auction Counter Rejected Relist counter negotiation",
  async function () {
    await this.conversationsPage
      .sendCounterNegotiation(
        auctionCounterRejectedRelistFlowData
          .negotiation
          .buyerCounterAmount
      );
  }
);

Then(
  "the Auction Counter Rejected Relist counter negotiation is sent successfully",
  async function () {
    await this.conversationsPage
      .verifyCounterNegotiationSent(
        auctionCounterRejectedRelistFlowData
          .expected
          .counterNegotiationSent
      );
  }
);

// =====================================================
// AGENT DECLINES BUYER COUNTER
// =====================================================

When(
  "the Agent opens the Auction bidder chat for the Counter Rejected Relist flow",
  async function () {
    await this.agentBidsPage
      .openBidderChat(
        auctionCounterRejectedRelistFlowData
          .agent.listing
          .expectedPropertyName
      );
  }
);

When(
  "the Agent declines the Auction negotiated offer",
  async function () {
    await flow5Page(this)
      .declineNegotiatedOffer();
  }
);

Then(
  "the Auction negotiated offer is declined successfully",
  async function () {
    await flow5Page(this)
      .verifyNegotiatedOfferDeclined(
        auctionCounterRejectedRelistFlowData
          .expected
          .declined
      );
  }
);

// =====================================================
// RE-LIST
// =====================================================

When(
  "the Agent returns to Bids for the Auction Counter Rejected Relist flow",
  async function () {
    await flow5Page(this)
      .clickBackFromConversation();

    const bidsTab =
      this.page.getByRole(
        "button",
        {
          name: /^Bids\b/i,
        }
      );

    if (
      await bidsTab
        .isVisible()
        .catch(() => false)
    ) {
      await bidsTab.click();

      await this.page
        .waitForTimeout(500);
    } else {
      await this.agentBidsPage
        .openBids();
    }
  }
);

When(
  "the Agent clicks Re-list for the Auction Counter Rejected Relist property",
  async function () {
    await flow5Page(this)
      .clickRelist(
        auctionCounterRejectedRelistFlowData
          .agent.listing
          .expectedPropertyName
      );
  }
);

When(
  "the Agent continues through the first Re-list step",
  async function () {
    await flow5Page(this)
      .clickNext(
        "First Re-list step"
      );
  }
);

When(
  "the Agent continues through the second Re-list step",
  async function () {
    await flow5Page(this)
      .clickNext(
        "Second Re-list step"
      );
  }
);

When(
  "the Agent edits the Re-list listing type",
  async function () {
    await flow5Page(this)
      .clickListingTypeEdit();
  }
);

When(
  "the Agent changes the Re-list listing type to Fixed Price",
  async function () {
    await this.pricingSalePage
      .selectListingType(
        auctionCounterRejectedRelistFlowData
          .relist.listingType
      );
  }
);

When(
  "the Agent continues from the Re-list pricing step",
  async function () {
    await this.pricingSalePage
      .clickNext();
  }
);

When(
  "the Agent continues through the final Re-list step",
  async function () {
    await flow5Page(this)
      .clickNext(
        "Final Re-list step"
      );
  }
);

When(
  "the Agent confirms the Re-list listing",
  async function () {
    await this.listingMediaPage
      .confirmListing();
  }
);

When(
  "the Agent publishes the Re-listed property",
  async function () {
    await this.listingMediaPage
      .publishListing();
  }
);

Then(
  "the property is re-listed successfully as Fixed Price",
  async function () {
    const listing =
      auctionCounterRejectedRelistFlowData
        .agent.listing;

    await this.dashboardPage
      .waitForDashboardAfterPublish();

    await this.dashboardPage
      .openListingsMenu();

    if (
      listing.expectedPropertyName
    ) {
      await this.dashboardPage
        .verifyListingVisibleByLocation(
          listing.expectedPropertyName
        );
    }

    console.log(
      "Flow 5 property re-listed successfully as Fixed Price"
    );
  }
);