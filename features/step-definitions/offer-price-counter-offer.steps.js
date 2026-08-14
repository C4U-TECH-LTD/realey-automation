const {
  Given,
  When,
  Then,
} = require("@cucumber/cucumber");

const {
  loginData,
} = require(
  "../../fixtures/test-data/loginData"
);

const {
  offerPriceFlowData,
} = require(
  "../../fixtures/test-data/offerPriceFlowData"
);

// =====================================================
// HELPERS
// =====================================================

async function clearCurrentSession(world) {
  await world.context.clearCookies();

  await world.page.goto(
    world.baseURL || "https://uat.realey.au/"
  );

  await world.page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  await world.page.goto(
    loginData.application.loginPath
  );
}

async function loginAs(world, account) {
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
}

// =====================================================
// AGENT LOGIN
// =====================================================

Given(
  "the agent is logged in for the Offer Price E2E flow",
  async function () {
    await loginAs(
      this,
      loginData.agent
    );

    await this.dashboardPage
      .waitForDashboard();
  }
);

// =====================================================
// CREATE OFFER PRICE LISTING
// =====================================================

When(
  "the agent creates and publishes an Offer Price listing",
  async function () {
    const listing =
      offerPriceFlowData.agent.listing;

    await this.dashboardPage
      .clickCreateListing();

    // -------------------------------------------------
    // Property Location
    // -------------------------------------------------
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

    // -------------------------------------------------
    // Property Details
    // -------------------------------------------------
    await this.propertyDetailsPage
      .waitForPage();

    await this.propertyDetailsPage
      .completeDetailsStep({
        propertyType: listing.propertyType,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        carSpaces: listing.carSpaces,
        landSize: listing.landSize || "",
        buildingSize: listing.buildingSize || "",
        yearBuilt: listing.yearBuilt || "",
      });

    // -------------------------------------------------
    // Pricing & Sale
    // -------------------------------------------------
    await this.pricingSalePage
      .waitForPage();

    await this.pricingSalePage
      .selectListingType(
        listing.listingType
      );

    await this.pricingSalePage
      .enterPriceGuide(
        listing.priceGuide
      );

    await this.pricingSalePage
      .clickNext();

    // -------------------------------------------------
    // Description & Features
    // -------------------------------------------------
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

    // -------------------------------------------------
    // Listing Media
    // -------------------------------------------------
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
  "the Offer Price listing is published successfully",
  async function () {
    const listing =
      offerPriceFlowData.agent.listing;

    await this.dashboardPage
      .waitForDashboardAfterPublish();

    await this.dashboardPage
      .openListingsMenu();

    await this.dashboardPage
      .verifyListingVisibleByLocation(
        listing.expectedPropertyName
      );
  }
);

// =====================================================
// SWITCH AGENT -> GENERAL USER
// Unique text is used so it does not collide with the
// existing Fixed Price step definition.
// =====================================================

When(
  "I switch from Agent to General User for the Offer Price flow",
  async function () {
    await clearCurrentSession(this);

    await loginAs(
      this,
      loginData.generalUser
    );
  }
);

// =====================================================
// GENERAL USER OPENS LISTING + INITIAL OFFER
// =====================================================

When(
  "the General User opens the created Offer Price listing",
  async function () {
    await this.generalUserListingsPage
      .openFirstMatchingListing(
        offerPriceFlowData.generalUser
          .searchText
      );
  }
);

When(
  "the General User submits the Offer Price configured offer",
  async function () {
    await this.offerPage
      .submitOffer(
        offerPriceFlowData.generalUser
          .offerAmount
      );
  }
);

Then(
  "the Offer Price offer is submitted successfully",
  async function () {
    await this.offerPage
      .verifyOfferSubmitted(
        offerPriceFlowData.expected
          .offerSubmitted
      );
  }
);

// =====================================================
// SWITCH GENERAL USER -> AGENT
// =====================================================

When(
  "I switch from General User to Agent for the Offer Price flow",
  async function () {
    await clearCurrentSession(this);

    await loginAs(
      this,
      loginData.agent
    );

    await this.dashboardPage
      .waitForDashboard();
  }
);

// =====================================================
// AGENT COUNTER VIA CHAT
// =====================================================

When(
  "the Agent opens the submitted Offer Price offer",
  async function () {
    await this.agentOffersPage
      .openSubmittedOffer(
        offerPriceFlowData.agent.listing
          .expectedPropertyName
      );
  }
);

When(
  "the Agent sends the configured counter offer via chat",
  async function () {
    await this.agentOffersPage
      .sendCounterOfferViaChat(
        offerPriceFlowData.counterOffer
          .amount
      );
  }
);

Then(
  "the counter offer is sent successfully",
  async function () {
    await this.agentOffersPage
      .verifyCounterOfferSent(
        offerPriceFlowData.expected
          .counterOfferSent
      );
  }
);

// =====================================================
// GENERAL USER CONVERSATIONS + COUNTER NEGOTIATION
// =====================================================

When(
  "the General User opens Conversations for the Offer Price flow",
  async function () {
    await this.conversationsPage
      .openConversations();
  }
);

When(
  "the General User opens the Agent conversation",
  async function () {
    await this.conversationsPage
      .openAgentConversation();
  }
);

When(
  "the General User selects Counter Negotiate",
  async function () {
    await this.conversationsPage
      .clickCounterNegotiate();
  }
);

When(
  "the General User submits the configured counter negotiation",
  async function () {
    await this.conversationsPage
      .sendCounterNegotiation(
        offerPriceFlowData.generalUser
          .negotiatedOfferAmount
      );
  }
);

Then(
  "the counter negotiation is sent successfully",
  async function () {
    await this.conversationsPage
      .verifyCounterNegotiationSent(
        offerPriceFlowData.expected
          .counterNegotiationSent
      );
  }
);

// =====================================================
// AGENT CONVERSATIONS + ACCEPT
// =====================================================

When(
  "the Agent opens Conversations for the Offer Price flow",
  async function () {
    await this.conversationsPage
      .openConversations();
  }
);

When(
  "the Agent opens the Buyer conversation",
  async function () {
    await this.conversationsPage
      .openBuyerConversation();
  }
);

When(
  "the Agent accepts the negotiated offer",
  async function () {
    await this.conversationsPage
      .acceptNegotiatedOffer();
  }
);

Then(
  "the negotiated offer is accepted successfully",
  async function () {
    await this.conversationsPage
      .verifyNegotiatedOfferAccepted(
        offerPriceFlowData.expected
          .offerAccepted
      );
  }
);

// =====================================================
// GENERAL USER RETURNS TO LISTING + SETTLEMENT
// =====================================================

When(
  "the General User opens the created Offer Price listing again",
  async function () {
    await this.generalUserListingsPage
      .openFirstMatchingListing(
        offerPriceFlowData.generalUser
          .searchText
      );
  }
);

When(
  "the General User starts the Offer Price settlement process",
  async function () {
    await this.settlementPage.start();
  }
);

When(
  "the General User selects the Offer Price configured solicitor",
  async function () {
    await this.settlementPage
      .selectSolicitor(
        offerPriceFlowData.settlement
          .solicitorSearch
      );
  }
);

When(
  "the General User selects the Offer Price configured mortgage broker",
  async function () {
    await this.settlementPage
      .selectBroker(
        offerPriceFlowData.settlement
          .brokerSearch
      );
  }
);

When(
  "the General User pays the Offer Price deposit",
  async function () {
    await this.settlementPage
      .payOfferDeposit(
        offerPriceFlowData.payment
      );
  }
);

Then(
  "the Offer Price deposit payment is successful",
  async function () {
    await this.settlementPage
      .verifyPaymentSuccessful(
        offerPriceFlowData.expected
          .paymentSuccessful
      );
  }
);
