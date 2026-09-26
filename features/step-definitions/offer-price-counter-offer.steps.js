const {
  Given,
  When,
  Then,
} = require("@cucumber/cucumber");

const {
  loginData,
} = require("../../fixtures/test-data/loginData");

const {
  offerPriceFlowData,
} = require("../../fixtures/test-data/offerPriceFlowData");

const {
  getNextFlow2SearchAddress,
} = require("../../fixtures/test-data/flow2Counter");

// =====================================================
// HELPERS
// =====================================================

async function checkCounterOfferNotificationInBell(page) {
  console.log("[Flow 2] Checking in-app notification bell for counter offer notification...");
  const bell = page.locator(
    [
      'button:has(img[src*="bell"]):visible',
      'button:has(svg.lucide-bell):visible',
      '[aria-label*="notification" i]:visible',
      'button:has([class*="bell" i]):visible',
    ].join(", ")
  ).first();

  const isBellVisible = await bell.isVisible({ timeout: 5000 }).catch(() => false);
  if (isBellVisible) {
    await bell.click();
    await page.waitForTimeout(1500);

    const drawer = page.locator('[data-radix-popper-content-wrapper], [role="dialog"], [class*="popover" i]').first();
    if (await drawer.isVisible({ timeout: 4000 }).catch(() => false)) {
      const notifItems = drawer.locator('div, li, a').filter({ hasText: /counter offer|counter|Subrato/i });
      const count = await notifItems.count();
      console.log(`[Flow 2] Found ${count} counter offer notification element(s) in bell drawer`);
      if (count > 0) {
        const text = await notifItems.first().innerText().catch(() => "");
        console.log(`[Flow 2] Notification content: ${text.replace(/\n+/g, " ")}`);
      }
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(500);
    }
  } else {
    console.log("[Flow 2] Notification bell not directly visible on current dashboard screen, continuing.");
  }
}

async function clearCurrentSession(world) {
  if (world.context) {
    await world.context.clearCookies().catch(() => {});
  }

  if (world.page) {
    try {
      await world.page.evaluate(() => {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (_) {}
      });
    } catch (_) {}
  }
}

async function loginAs(world, account) {
  if (!account) {
    throw new Error(
      "Login account configuration is missing."
    );
  }

  await clearCurrentSession(world);

  let attempts = 0;
  while (attempts < 2) {
    attempts++;
    try {
      await world.loginPage.goto(
        loginData.application.loginPath
      );

      await world.loginPage.login(
        account.email,
        account.password
      );

      await world.loginPage.waitForOtpPage();

      await world.loginPage.enterOtp(
        account.otp || "123456"
      );

      await world.loginPage.submitOtp();
      break;
    } catch (err) {
      if (attempts < 2 && err.message.includes("expired session")) {
        console.warn(`[Flow 2 Login] Session expired on attempt ${attempts}, clearing session and retrying fresh login...`);
        await clearCurrentSession(world);
        await world.page.waitForTimeout(2000);
        continue;
      }
      throw err;
    }
  }
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

    const { counter, searchAddress } = getNextFlow2SearchAddress("Bourke Street");
    console.log(`[Flow 2] Listing creation using address query: "${searchAddress}" (run counter #${counter})`);

    await this.propertyLocationPage
      .typeAddressAndSelectFirstSuggestion(
        searchAddress
      );

    await this.propertyLocationPage
      .waitForAutoFilledLocationFields();

    // Dynamically retrieve the actual populated address details
    const populatedStreet = (this.propertyLocationPage.selectedStreet || await this.propertyLocationPage.streetAddressInput.inputValue()).trim();
    let populatedSuburb = this.propertyLocationPage.selectedSuburb || "";
    if (!populatedSuburb && this.propertyLocationPage.suburbInput) {
      populatedSuburb = (await this.propertyLocationPage.suburbInput.inputValue().catch(() => "")).trim();
    }
    const fullName = populatedSuburb ? `${populatedStreet}, ${populatedSuburb}` : populatedStreet;

    console.log(`[Flow 2] Selected address: "${fullName}" (street: "${populatedStreet}")`);

    // Dynamically update test data for all subsequent steps in this flow run
    listing.addressSearchText = populatedStreet;
    listing.expectedPropertyName = fullName;
    offerPriceFlowData.generalUser.searchText = populatedStreet;
    this.createdListingTitle = fullName;

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

    this.createdListingTitle = listing.expectedPropertyName;

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
    // Check in-app notification bell on General User dashboard for counter offer notification
    await checkCounterOfferNotificationInBell(this.page);

    await this.conversationsPage
      .openConversations();
  }
);

When(
  "the General User opens the Agent conversation",
  async function () {
    await this.conversationsPage
      .openAgentConversation(
        offerPriceFlowData.agent.listing
          .expectedPropertyName
      );
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
      .openBuyerConversation(
        offerPriceFlowData.agent.listing
          .expectedPropertyName
      );
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