const {
  Given,
  When,
  Then,
} = require("@cucumber/cucumber");

const {
  loginData,
} = require("../../fixtures/test-data/loginData");

const {
  fixedPriceTaskListFlowData,
} = require(
  "../../fixtures/test-data/fixedPriceTaskListFlowData"
);

// =====================================================
// HELPERS
// =====================================================

async function clearCurrentSession(world) {
  await world.context.clearCookies();

  await world.page.goto(
    world.baseURL ||
      "https://uat.realey.au/"
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
  if (!account) {
    throw new Error(
      "Login account configuration is missing."
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
}

// =====================================================
// AGENT LOGIN
// =====================================================

Given(
  "the agent is logged in for the Fixed Price Task List flow",
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
// CREATE FIXED PRICE LISTING
// =====================================================

When(
  "the agent creates and publishes a Fixed Price listing for the Task List flow",
  async function () {
    const listing =
      fixedPriceTaskListFlowData
        .agent
        .listing;

    // -------------------------------------------------
    // CREATE LISTING
    // -------------------------------------------------

    await this.dashboardPage
      .clickCreateListing();

    // -------------------------------------------------
    // STEP 1 - PROPERTY LOCATION
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
    // STEP 2 - PROPERTY DETAILS
    // -------------------------------------------------

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

    // -------------------------------------------------
    // STEP 3 - PRICING & SALE
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
    // STEP 4 - DESCRIPTION & FEATURES
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
    // STEP 5 - LISTING MEDIA
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

// =====================================================
// VERIFY LISTING PUBLISHED
// =====================================================

Then(
  "the Fixed Price Task List listing is published successfully",
  async function () {
    const listing =
      fixedPriceTaskListFlowData
        .agent
        .listing;

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
// =====================================================

When(
  "I switch from Agent to General User for the Fixed Price Task List flow",
  async function () {
    await clearCurrentSession(this);

    await loginAs(
      this,
      loginData.generalUser
    );
  }
);

// =====================================================
// BUYER OPENS LISTING
// =====================================================

When(
  "the General User opens the created Fixed Price Task List listing",
  async function () {
    await this.generalUserListingsPage
      .openFirstMatchingListing(
        fixedPriceTaskListFlowData
          .generalUser
          .searchText
      );
  }
);

// =====================================================
// BUYER SUBMITS DIRECT OFFER
// =====================================================

When(
  "the General User submits the configured Fixed Price Task List offer",
  async function () {
    await this.offerPage
      .submitOffer(
        fixedPriceTaskListFlowData
          .generalUser
          .offerAmount
      );
  }
);

Then(
  "the Fixed Price Task List offer is submitted successfully",
  async function () {
    await this.offerPage
      .verifyOfferSubmitted(
        fixedPriceTaskListFlowData
          .expected
          .offerSubmitted
      );
  }
);

// =====================================================
// SWITCH GENERAL USER -> AGENT
// =====================================================

When(
  "I switch from General User to Agent for the Fixed Price Task List flow",
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
// AGENT OPENS OFFER
// =====================================================

When(
  "the Agent opens the submitted Fixed Price Task List offer",
  async function () {
    await this.agentOffersPage
      .openSubmittedOffer(
        fixedPriceTaskListFlowData
          .agent
          .listing
          .expectedPropertyName
      );
  }
);

// =====================================================
// AGENT SENDS COUNTER OFFER
// =====================================================

When(
  "the Agent sends the Fixed Price Task List counter offer via chat",
  async function () {
    await this.agentOffersPage
      .sendCounterOfferViaChat(
        fixedPriceTaskListFlowData
          .counterOffer
          .amount
      );
  }
);

Then(
  "the Fixed Price Task List counter offer is sent successfully",
  async function () {
    await this.agentOffersPage
      .verifyCounterOfferSent(
        fixedPriceTaskListFlowData
          .expected
          .counterOfferSent
      );
  }
);

// =====================================================
// BUYER OPENS CONVERSATIONS
// =====================================================

When(
  "the General User opens Conversations for the Fixed Price Task List flow",
  async function () {
    await this.conversationsPage
      .openConversations();
  }
);

// =====================================================
// BUYER OPENS AGENT CONVERSATION
// =====================================================

When(
  "the General User opens the Agent conversation for the Fixed Price Task List flow",
  async function () {
    await this.conversationsPage
      .openAgentConversation(
        fixedPriceTaskListFlowData
          .agent
          .listing
          .expectedPropertyName
      );
  }
);

// =====================================================
// VERIFY TASK LIST NOT AVAILABLE BEFORE ACCEPTANCE
// =====================================================

Then(
  "the Configure Progress Task List should not be visible or interactive",
  async function () {
    await this.conversationsPage
      .verifyProgressTaskListNotAvailable();
  }
);

// =====================================================
// AGENT REOPENS OFFER
// =====================================================

When(
  "the Agent opens the submitted Fixed Price Task List offer again",
  async function () {
    await this.agentOffersPage
      .openSubmittedOffer(
        fixedPriceTaskListFlowData
          .agent
          .listing
          .expectedPropertyName
      );
  }
);

// =====================================================
// AGENT ACCEPTS BUYER OFFER
// =====================================================

When(
  "the Agent accepts the Fixed Price Task List offer",
  async function () {
    await this.agentOffersPage
      .acceptSubmittedOffer();
  }
);

// =====================================================
// VERIFY ACCEPTED
// =====================================================

Then(
  "the Fixed Price Task List offer is accepted successfully",
  async function () {
    await this.agentOffersPage
      .verifyAccepted(
        fixedPriceTaskListFlowData
          .expected
          .offerAccepted
      );
  }
);

// =====================================================
// TASK LIST MUST STILL BE HIDDEN
// =====================================================

Then(
  "the Configure Progress Task List should still not be visible or interactive",
  async function () {
    await this.conversationsPage
      .verifyProgressTaskListNotAvailable();
  }
);

// =====================================================
// BUYER REOPENS LISTING
// =====================================================

When(
  "the General User opens the created Fixed Price Task List listing again",
  async function () {
    /*
     * If currently inside a conversation, use the existing
     * GeneralUserListingsPage navigation/search method.
     */

    await this.generalUserListingsPage
      .openFirstMatchingListing(
        fixedPriceTaskListFlowData
          .generalUser
          .searchText
      );
  }
);

// =====================================================
// START SETTLEMENT
// =====================================================

When(
  "the General User starts the Fixed Price Task List settlement process",
  async function () {
    await this.settlementPage
      .start();
  }
);

// =====================================================
// SELECT SOLICITOR
// =====================================================

When(
  "the General User selects the Fixed Price Task List configured solicitor",
  async function () {
    await this.settlementPage
      .selectSolicitor(
        fixedPriceTaskListFlowData
          .settlement
          .solicitorSearch
      );
  }
);

// =====================================================
// SELECT MORTGAGE BROKER
// =====================================================

When(
  "the General User selects the Fixed Price Task List configured mortgage broker",
  async function () {
    await this.settlementPage
      .selectBroker(
        fixedPriceTaskListFlowData
          .settlement
          .brokerSearch
      );
  }
);

// =====================================================
// FIXED PRICE DEPOSIT
// =====================================================

When(
  "the General User pays the Fixed Price Task List deposit",
  async function () {
    /*
     * IMPORTANT:
     *
     * Use payFixedDeposit().
     *
     * Do NOT use payOfferDeposit() here.
     */

    await this.settlementPage
      .payFixedDeposit(
        fixedPriceTaskListFlowData
          .payment
      );
  }
);

// =====================================================
// VERIFY PAYMENT
// =====================================================

Then(
  "the Fixed Price Task List deposit payment is successful",
  async function () {
    await this.settlementPage
      .verifyPaymentSuccessful(
        fixedPriceTaskListFlowData
          .expected
          .paymentSuccessful
      );
  }
);

// =====================================================
// TASK LIST AVAILABLE AFTER SETTLEMENT
// =====================================================

Then(
  "the Configure Progress Task List should automatically appear and be interactive",
  async function () {
    await this.conversationsPage
      .verifyProgressTaskListAvailable();
  }
);
