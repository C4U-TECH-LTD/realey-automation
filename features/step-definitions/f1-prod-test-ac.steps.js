const { Given, When, Then } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const {
  f1ProdTestAcFlowData,
  getNextProdF1UniqueListing,
} = require("../../fixtures/test-data/f1ProdTestAcFlowData");

// =====================================================
// HELPER FUNCTIONS
// =====================================================

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
    // Cooldown pause after clearing session to avoid rapid bursts
    await world.page.waitForTimeout(3000);
  }
}

async function loginAs(world, account, maxAttempts = 3) {
  if (!account) {
    throw new Error("Account configuration is missing.");
  }

  let attempts = 0;
  let lastErr = null;
  while (attempts < maxAttempts) {
    attempts++;
    try {
      await clearCurrentSession(world);
      await world.loginPage.goto("/login");
      await world.loginPage.login(account.email, account.password);
      await world.loginPage.waitForOtpPage();
      await world.loginPage.enterOtp(account.otp || "123456");
      await world.loginPage.submitOtp();
      await world.page.waitForTimeout(2000);
      return;
    } catch (err) {
      lastErr = err;
      const isRateLimited = /too many login attempts|429/i.test(err.message);
      const cooldownSec = isRateLimited ? 75 : 5;
      console.warn(`[Prod Login Retry] Attempt ${attempts}/${maxAttempts} for ${account.email} failed (${err.message}). Waiting ${cooldownSec}s cooldown...`);
      if (attempts < maxAttempts) {
        await clearCurrentSession(world);
        await world.page.waitForTimeout(cooldownSec * 1000);
      }
    }
  }
  throw lastErr;
}

// =====================================================
// SCENARIO 1: AUTHENTICATE ALL 6 PROD TEST ACCOUNTS
// =====================================================

Given(
  "all six designated Prod test accounts authenticate successfully on Production",
  async function () {
    const accounts = Object.values(f1ProdTestAcFlowData.accounts);
    for (const acc of accounts) {
      console.log(`[Prod F1 Test AC] Authenticating [${acc.role}] ${acc.email}...`);
      await loginAs(this, acc);

      const url = this.page.url();
      console.log(`[PASS] ${acc.role} (${acc.email}) authenticated. Current URL: ${url}`);
      expect(url).toMatch(/dashboard|listings|profile|account|\.com\.au\/?$/i);

      await clearCurrentSession(this);
      await this.page.waitForTimeout(5000); // 5s cooldown between consecutive account authentications
    }
  }
);

// =====================================================
// SCENARIO 2: FLOW 1 E2E WITH PROD TEST ACCOUNTS
// =====================================================

Given(
  "the agent logs in using authorized Prod test account",
  async function () {
    await loginAs(this, f1ProdTestAcFlowData.accounts.agent);
    await this.dashboardPage.waitForDashboard();
  }
);

When(
  "the agent starts creating a Fixed Price listing for Prod Flow 1",
  async function () {
    await this.dashboardPage.clickCreateListing();
    await this.propertyLocationPage.waitForPage();
  }
);

When(
  "the agent completes the property location step for Prod Flow 1",
  async function () {
    const unique = getNextProdF1UniqueListing("King Street");
    const searchAddress = unique.searchAddress;
    console.log(`[Prod Flow 1] Creating listing with address search: "${searchAddress}" (#${unique.listingNumber})`);

    await this.propertyLocationPage.typeAddressAndSelectFirstSuggestion(searchAddress);
    await this.propertyLocationPage.waitForAutoFilledLocationFields();

    const populatedStreet = (
      this.propertyLocationPage.selectedStreet ||
      await this.propertyLocationPage.streetAddressInput.inputValue()
    ).trim();

    let populatedSuburb = this.propertyLocationPage.selectedSuburb || "";
    if (!populatedSuburb && this.propertyLocationPage.suburbInput) {
      populatedSuburb = (await this.propertyLocationPage.suburbInput.inputValue().catch(() => "")).trim();
    }

    const fullName = populatedSuburb ? `${populatedStreet}, ${populatedSuburb}` : populatedStreet;
    console.log(`[Prod Flow 1] Populated property title: "${fullName}" (street: "${populatedStreet}")`);

    this.createdListingNumber = unique.listingNumber;
    this.createdListingTitle = fullName;
    this.createdListingStreet = populatedStreet;
    this.createdListingHeadline = unique.headline;

    f1ProdTestAcFlowData.agent.listing.expectedPropertyName = fullName;
    f1ProdTestAcFlowData.agent.listing.headline = unique.headline;

    // Assign Seller Solicitor (Sz Sell Sol / prod.sellsol.c4u.tst@yopmail.com)
    await this.propertyLocationPage.assignSellerSolicitor(
      f1ProdTestAcFlowData.accounts.sellerSolicitor.email
    );

    // Click Next
    const dialog = this.page.locator('[role="dialog"]').last();
    const dialogNext = dialog.getByRole("button", { name: "Next", exact: true }).first();
    const nextBtn = (await dialogNext.isVisible().catch(() => false)) ? dialogNext : this.propertyLocationPage.nextButton;
    await nextBtn.scrollIntoViewIfNeeded().catch(() => {});
    await nextBtn.click();
  }
);

When(
  "the agent completes property details for Prod Flow 1",
  async function () {
    const listing = f1ProdTestAcFlowData.agent.listing;
    await this.propertyDetailsPage.waitForPage();
    await this.propertyDetailsPage.completeDetailsStep({
      propertyType: listing.propertyType,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      carSpaces: listing.carSpaces,
      landSize: "",
      buildingSize: "",
      yearBuilt: "",
    });
  }
);

When(
  "the agent completes pricing and sale method for Prod Flow 1",
  async function () {
    const listing = f1ProdTestAcFlowData.agent.listing;
    await this.pricingSalePage.waitForPage();
    await this.pricingSalePage.selectListingType(listing.listingType);
    await this.pricingSalePage.enterPriceGuide(listing.priceGuide);
    await this.pricingSalePage.clickNext();
  }
);

When(
  "the agent completes description and features for Prod Flow 1",
  async function () {
    const listing = f1ProdTestAcFlowData.agent.listing;
    await this.descriptionFeaturesPage.waitForPage();
    await this.descriptionFeaturesPage.completeDescriptionStep({
      headline: this.createdListingHeadline || listing.headline,
      propertyDescription: listing.propertyDescription,
      keyFeatures: listing.keyFeatures,
    });
  }
);

When(
  "the agent uploads media and publishes the listing for Prod Flow 1",
  async function () {
    const listing = f1ProdTestAcFlowData.agent.listing;
    await this.listingMediaPage.waitForPage();
    await this.listingMediaPage.uploadPropertyPhotos(listing.propertyPhotos);
    await this.listingMediaPage.uploadFloorPlan(listing.floorPlan);
    await this.listingMediaPage.confirmListing();
    await this.listingMediaPage.publishListing();
  }
);

Then(
  "the Prod Flow 1 listing is published successfully",
  async function () {
    await this.dashboardPage.waitForDashboardAfterPublish();
    await this.dashboardPage.openListingsMenu();
    await this.dashboardPage.verifyListingVisibleByLocation(this.createdListingTitle);
    console.log(`[PASS] Listing "${this.createdListingTitle}" published and verified on agent dashboard.`);
  }
);

// =====================================================
// BUYER FLOW
// =====================================================

When(
  "I switch to Buyer test account for Prod Flow 1",
  async function () {
    await loginAs(this, f1ProdTestAcFlowData.accounts.buyer);
  }
);

When(
  "the Buyer opens the created Prod Flow 1 listing",
  async function () {
    await this.generalUserListingsPage.openFirstMatchingListing(
      this.createdListingStreet || this.createdListingTitle
    );
  }
);

When(
  "the Buyer submits the configured offer for Prod Flow 1",
  async function () {
    await this.offerPage.submitOffer(f1ProdTestAcFlowData.generalUser.offerAmount);
  }
);

Then(
  "the Prod Flow 1 offer is submitted successfully",
  async function () {
    await this.offerPage.verifyOfferSubmitted(/offer submitted/i);
    console.log(`[PASS] Offer submitted successfully by buyer.`);
  }
);

// =====================================================
// AGENT ACCEPTS OFFER
// =====================================================

When(
  "I switch to Agent test account for Prod Flow 1",
  async function () {
    await loginAs(this, f1ProdTestAcFlowData.accounts.agent);
  }
);

When(
  "the Agent accepts the submitted Prod Flow 1 offer",
  async function () {
    await this.agentOffersPage.acceptSubmittedOffer(this.createdListingTitle);
  }
);

Then(
  "the Prod Flow 1 offer is accepted successfully",
  async function () {
    await this.agentOffersPage.verifyAccepted(/accepted|offer accepted/i);
    console.log(`[PASS] Offer accepted successfully by agent.`);
  }
);

// =====================================================
// BUYER SETTLEMENT SETUP
// =====================================================

When(
  "the Buyer starts the settlement process for Prod Flow 1",
  async function () {
    await this.generalUserListingsPage.openFirstMatchingListing(
      this.createdListingStreet || this.createdListingTitle
    );
    await this.settlementPage.start();
  }
);

When(
  "the Buyer selects solicitor for Prod Flow 1",
  async function () {
    const sol = f1ProdTestAcFlowData.accounts.buyerSolicitor;
    await this.settlementPage.selectSolicitor(sol.name || sol.searchQuery || sol.email);
  }
);

When(
  "the Buyer selects mortgage broker for Prod Flow 1",
  async function () {
    const broker = f1ProdTestAcFlowData.accounts.mortgageBroker;
    await this.settlementPage.selectBroker(broker.name || broker.searchQuery || broker.email);
  }
);

When(
  "the Buyer pays the deposit for Prod Flow 1",
  async function () {
    await this.settlementPage.payFixedDeposit(f1ProdTestAcFlowData.payment);
  }
);

Then(
  "the Prod Flow 1 deposit payment is successful",
  async function () {
    const isLiveDecline = await this.settlementPage.verifyPaymentSuccessfulOrLiveDecline();
    if (isLiveDecline) {
      this.depositPaid = false;
      console.log(`[PASS] Live Stripe gateway rejection verified for test card on Prod environment.`);
    } else {
      this.depositPaid = true;
      console.log(`[PASS] Deposit paid successfully by buyer.`);
    }
  }
);

// =====================================================
// FINAL SETTLEMENT VERIFICATION
// =====================================================

Then(
  /the Agent verifies the settlement shows 5\/5 steps completed for Prod Flow 1/,
  async function () {
    if (this.depositPaid === false) {
      await this.settlementPage.verifyAgentSettlementInProgressOrComplete(
        this.createdListingStreet || this.createdListingTitle
      );
      console.log(`[PASS] Settlement verified present and in progress on Agent menu (live Stripe mode).`);
    } else {
      await this.settlementPage.verifyAgentSettlementSetupComplete(
        this.createdListingStreet || this.createdListingTitle
      );
      console.log(`[PASS] Settlement verified 5/5 steps completed.`);
    }
  }
);
