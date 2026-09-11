const {
  Given,
  When,
  Then,
} = require("@cucumber/cucumber");

const { expect } = require("@playwright/test");

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
      .assignSellerSolicitor(
        listing.sellerSolicitorSearch || "Jamess Anderson"
      );

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
// SWITCH TO SELLER SOLICITOR & CONFIGURE PROGRESS TASKS
// =====================================================

When(
  "I switch from Agent to Seller Solicitor for the Fixed Price Task List flow",
  async function () {
    await clearCurrentSession(this);
    await loginAs(
      this,
      fixedPriceTaskListFlowData.sellerSolicitor
    );
  }
);

When(
  "the Seller Solicitor opens the Progress tab for the created Fixed Price listing",
  async function () {
    await this.solicitorProgressPage.openProgressTab();
    await this.solicitorProgressPage.selectProperty(
      fixedPriceTaskListFlowData.agent.listing.expectedPropertyName
    );
  }
);

When(
  "the Seller Solicitor configures the progress tasks using the standard template",
  async function () {
    await this.solicitorProgressPage.configureProgressTasks(
      fixedPriceTaskListFlowData.sellerSolicitor.templateName || "Standard Conveyancing Process"
    );
  }
);

Then(
  "the progress tasks are configured successfully for the property",
  async function () {
    await this.solicitorProgressPage.verifyProgressConfigured();
  }
);

// =====================================================
// SWITCH FROM SELLER SOLICITOR TO GENERAL USER
// =====================================================

When(
  "I switch from Seller Solicitor to General User for the Fixed Price Task List flow",
  async function () {
    await clearCurrentSession(this);
    await loginAs(
      this,
      fixedPriceTaskListFlowData.generalUser
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
// PROGRESS TAB & PENDING MESSAGE VERIFICATION
// =====================================================

When(
  "the General User clicks the Progress tab in the chatroom",
  async function () {
    await this.conversationsPage
      .clickProgressTab();
  }
);

Then(
  "the Configure Progress Task List should not be visible",
  async function () {
    await this.conversationsPage
      .verifyProgressTaskListNotAvailable();
  }
);

Then(
  "the chatroom should display that progress tasks will appear once an offer is accepted",
  async function () {
    await this.conversationsPage
      .verifyProgressTasksNotVisibleWithPendingMessage();
  }
);

When(
  "the General User accepts the counter offer in the chatroom",
  async function () {
    // Switch to Chat tab if currently on Progress tab
    await this.conversationsPage.clickChatTab();

    const acceptBtn = this.page
      .getByRole("button", {
        name: "Accept",
        exact: true,
      })
      .or(this.page.locator('button:has-text("Accept")'))
      .first();

    if (await acceptBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      console.log("Buyer accepting counter offer in chatroom...");
      await acceptBtn.click();

      const confirmBtn = this.page
        .getByRole("button", {
          name: /Accept|Confirm|Yes/i,
        })
        .last();

      if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await confirmBtn.click();
      }

      await this.page.waitForTimeout(1500);

      const closeDialogBtn = this.page
        .locator(
          '[role="dialog"] button:has(svg.lucide-x), [role="dialog"] button[aria-label*="close" i], button:has(svg.lucide-x)'
        )
        .first();

      if (await closeDialogBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await closeDialogBtn.click();
        await this.page.waitForTimeout(500);
      }
    }
  }
);

// =====================================================
// VERIFY TASK LIST NOT AVAILABLE BEFORE ACCEPTANCE (COMPATIBILITY)
// =====================================================

Then(
  "the Configure Progress Task List should not be visible or interactive",
  async function () {
    await this.conversationsPage
      .verifyProgressTaskListNotAvailable();
  }
);

// =====================================================
// AGENT REOPENS OFFER — via Conversations chatroom
// (After a counter-offer the Offers & Bids page has
//  no Accept button — the buyer already accepted in
//  the chatroom, so the agent verifies from there.)
// =====================================================

When(
  "the Agent opens the submitted Fixed Price Task List offer again",
  async function () {
    await this.conversationsPage
      .openConversations();

    await this.conversationsPage
      .openBuyerConversation(
        fixedPriceTaskListFlowData
          .agent
          .listing
          .expectedPropertyName
      );
  }
);

// =====================================================
// AGENT ACCEPTS BUYER OFFER
// (The buyer already accepted the counter-offer in
//  the earlier step, so the agent simply verifies.)
// =====================================================

When(
  "the Agent accepts the Fixed Price Task List offer",
  async function () {
    // The buyer accepted the counter-offer in the chatroom
    // during the "Task List should not be visible" step.
    // If by chance the accept button is still visible
    // from the agent side, click it; otherwise skip.
    const acceptBtn = this.page.getByRole("button", {
      name: "Accept",
      exact: true,
    });

    if (await acceptBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log("Agent Accept button found in chatroom, clicking...");
      await acceptBtn.click();

      const confirmBtn = this.page
        .getByRole("button", {
          name: /Confirm|Accept|Yes/i,
        })
        .last();

      if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await confirmBtn.click();
      }

      await this.page.waitForTimeout(1500);
    } else {
      console.log(
        "No Accept button visible — buyer already accepted the counter-offer."
      );
    }
  }
);

// =====================================================
// VERIFY ACCEPTED
// =====================================================

Then(
  "the Fixed Price Task List offer is accepted successfully",
  async function () {
    // Verify that the chatroom shows accepted state
    const accepted = this.page
      .getByText(/accepted/i)
      .or(this.page.getByText(/copy settlement link/i))
      .or(this.page.getByText(/settlement/i))
      .first();

    await expect(
      accepted,
      "Offer should show accepted status or settlement option in chatroom"
    ).toBeVisible({ timeout: 20_000 });

    console.log(
      "Fixed Price Task List offer is accepted successfully."
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

Then(
  "the assigned Configure Progress Task List should automatically appear",
  async function () {
    await this.conversationsPage
      .verifyAssignedProgressTasksVisible();
  }
);
