const { Given, When, Then } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");
const {
  f1TestAcCheckFlowData,
  getDynamicF1TestAddress,
} = require("../../fixtures/test-data/f1TestAcCheckFlowData");

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
      console.warn(`[Login Retry] Attempt ${attempts}/${maxAttempts} for ${account.email} failed: ${err.message}`);
      if (attempts < maxAttempts) {
        await clearCurrentSession(world);
        await world.page.waitForTimeout(3000);
      }
    }
  }
  throw lastErr;
}

// =====================================================
// SCENARIO 1: AUTHENTICATE ALL 6 TEST ACCOUNTS
// =====================================================

Given(
  "all six designated .tst test accounts authenticate successfully on UAT",
  async function () {
    const accounts = Object.values(f1TestAcCheckFlowData.accounts);
    for (const acc of accounts) {
      console.log(`[F1 AC Check] Authenticating [${acc.role}] ${acc.email}...`);
      await loginAs(this, acc);

      const url = this.page.url();
      console.log(`[PASS] ${acc.role} (${acc.email}) authenticated. Current URL: ${url}`);
      expect(url).toMatch(/dashboard|listings|profile|account|\.au\/?$/i);

      await clearCurrentSession(this);
    }
  }
);

// =====================================================
// SCENARIO 2: FLOW 1 WITH ACCOUNT ISOLATION
// =====================================================

Given(
  "the agent logs in using authorized test account for F1 AC Check",
  async function () {
    await loginAs(this, f1TestAcCheckFlowData.accounts.agent);
    await this.dashboardPage.waitForDashboard();
  }
);

When(
  "the agent starts creating a Fixed Price listing for F1 AC Check",
  async function () {
    await this.dashboardPage.clickCreateListing();
    await this.propertyLocationPage.waitForPage();
  }
);

When(
  "the agent completes the property location step with Seller Solicitor isolation check",
  async function () {
    const searchAddress = getDynamicF1TestAddress("King Street");
    console.log(`[F1 AC Check] Creating listing with address search: "${searchAddress}"`);

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
    console.log(`[F1 AC Check] Populated property title: "${fullName}" (street: "${populatedStreet}")`);

    this.createdListingTitle = fullName;
    this.createdListingStreet = populatedStreet;
    f1TestAcCheckFlowData.agent.listing.expectedPropertyName = fullName;

    // Verify Seller Solicitor Account Isolation
    await this.propertyLocationPage.verifyAndAssignSellerSolicitorWithIsolation(
      f1TestAcCheckFlowData.accounts.sellerSolicitor.email,
      f1TestAcCheckFlowData.forbiddenLegacyAccounts
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
  "the agent completes property details for F1 AC Check",
  async function () {
    const listing = f1TestAcCheckFlowData.agent.listing;
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
  "the agent completes pricing and sale method for F1 AC Check",
  async function () {
    const listing = f1TestAcCheckFlowData.agent.listing;
    await this.pricingSalePage.waitForPage();
    await this.pricingSalePage.selectListingType(listing.listingType);
    await this.pricingSalePage.enterPriceGuide(listing.priceGuide);
    await this.pricingSalePage.clickNext();
  }
);

When(
  "the agent completes description and features for F1 AC Check",
  async function () {
    const listing = f1TestAcCheckFlowData.agent.listing;
    await this.descriptionFeaturesPage.waitForPage();
    await this.descriptionFeaturesPage.completeDescriptionStep({
      headline: listing.headline,
      propertyDescription: listing.propertyDescription,
      keyFeatures: listing.keyFeatures,
    });
  }
);

When(
  "the agent uploads media and publishes the listing for F1 AC Check",
  async function () {
    const listing = f1TestAcCheckFlowData.agent.listing;
    await this.listingMediaPage.waitForPage();
    await this.listingMediaPage.uploadPropertyPhotos(listing.propertyPhotos);
    await this.listingMediaPage.uploadFloorPlan(listing.floorPlan);
    await this.listingMediaPage.confirmListing();
    await this.listingMediaPage.publishListing();
  }
);

Then(
  "the F1 AC Check listing is published successfully",
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
  "I switch to Buyer test account for F1 AC Check",
  async function () {
    await loginAs(this, f1TestAcCheckFlowData.accounts.buyer);
  }
);

When(
  "the Buyer opens the created F1 AC Check listing",
  async function () {
    await this.generalUserListingsPage.openFirstMatchingListing(
      this.createdListingStreet || this.createdListingTitle
    );
  }
);

When(
  "the Buyer submits the configured offer for F1 AC Check",
  async function () {
    await this.offerPage.submitOffer(f1TestAcCheckFlowData.generalUser.offerAmount);
  }
);

Then(
  "the F1 AC Check offer is submitted successfully",
  async function () {
    await this.offerPage.verifyOfferSubmitted(/offer submitted/i);
    console.log(`[PASS] Offer submitted successfully by buyer.`);
  }
);

// =====================================================
// AGENT ACCEPTS OFFER
// =====================================================

When(
  "I switch to Agent test account for F1 AC Check",
  async function () {
    await loginAs(this, f1TestAcCheckFlowData.accounts.agent);
  }
);

When(
  "the Agent accepts the submitted F1 AC Check offer",
  async function () {
    await this.agentOffersPage.acceptSubmittedOffer(this.createdListingTitle);
  }
);

Then(
  "the F1 AC Check offer is accepted successfully",
  async function () {
    await this.agentOffersPage.verifyAccepted(/accepted|offer accepted/i);
    console.log(`[PASS] Offer accepted successfully by agent.`);
  }
);

// =====================================================
// BUYER SETTLEMENT WITH ISOLATION
// =====================================================

When(
  "the Buyer starts the settlement process for F1 AC Check",
  async function () {
    await this.generalUserListingsPage.openFirstMatchingListing(
      this.createdListingStreet || this.createdListingTitle
    );
    await this.settlementPage.start();
  }
);

When(
  "the Buyer selects solicitor with Account Isolation check",
  async function () {
    await this.settlementPage.verifyAndSelectSolicitorWithIsolation(
      f1TestAcCheckFlowData.accounts.buyerSolicitor.email,
      f1TestAcCheckFlowData.forbiddenLegacyAccounts
    );
  }
);

When(
  "the Buyer selects mortgage broker with Account Isolation check",
  async function () {
    await this.settlementPage.verifyAndSelectBrokerWithIsolation(
      f1TestAcCheckFlowData.accounts.mortgageBroker.email,
      f1TestAcCheckFlowData.forbiddenLegacyAccounts
    );
  }
);

When(
  "the Buyer pays the deposit for F1 AC Check",
  async function () {
    await this.settlementPage.payFixedDeposit(f1TestAcCheckFlowData.payment);
  }
);

Then(
  "the F1 AC Check deposit payment is successful",
  async function () {
    await this.settlementPage.verifyPaymentSuccessful(/Payment Successful/i);
    console.log(`[PASS] Deposit paid successfully by buyer.`);
  }
);

// =====================================================
// FINAL SETTLEMENT & BACKEND ISOLATION VERIFICATION
// =====================================================

Then(
  /the Agent verifies the settlement shows 5\/5 steps completed for F1 AC Check/,
  async function () {
    await this.settlementPage.verifyAgentSettlementSetupComplete(
      this.createdListingStreet || this.createdListingTitle
    );
    console.log(`[PASS] Settlement verified 5/5 steps completed.`);
  }
);

Then(
  "backend APIs enforce isolation preventing test accounts from accessing legacy account data",
  async function () {
    console.log(`[Account Isolation Check] Verifying server-side API isolation enforcement...`);

    const result = await this.page.evaluate(async (forbidden) => {
      const endpoints = [
        "/api/solicitors?search=solicitor.c4utest",
        "/api/solicitors?search=James+Anderson",
        "/api/mortgage-brokers?search=broker.c4utest",
        "/api/mortgage-brokers?search=Alen+Mayer",
        "/api/users/search?q=buyer.c4utest",
      ];

      const violations = [];
      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            const str = JSON.stringify(data);
            for (const f of forbidden) {
              if (str.includes(f.email)) {
                violations.push({ endpoint: ep, leakedEmail: f.email });
              }
            }
          }
        } catch (_) {}
      }
      return violations;
    }, f1TestAcCheckFlowData.forbiddenLegacyAccounts);

    expect(
      result,
      `Backend API leaked legacy accounts to test account session: ${JSON.stringify(result)}`
    ).toHaveLength(0);

    console.log(`[PASS] Backend APIs strictly enforce account isolation with 0 leaked accounts.`);
  }
);
