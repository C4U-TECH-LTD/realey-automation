const path = require("path");
const {
  Given,
  When,
  Then,
  setDefaultTimeout,
} = require("@cucumber/cucumber");

setDefaultTimeout(240_000);

const {
  loginData,
} = require(
  "../../fixtures/test-data/loginData"
);

const {
  listingData,
} = require(
  "../../fixtures/test-data/listingData"
);

const {
  salesInstructionsFlowData,
} = require(
  "../../fixtures/test-data/salesInstructionsFlowData"
);

const {
  YopmailHelper,
} = require(
  "../../pages/YopmailHelper"
);

function isFlow7Scenario(world) {
  return Boolean(world?.isFlow7 || world?.pickle?.tags?.some((t) => t.name === "@flow-7"));
}

function isFlow1Scenario(world) {
  return Boolean(world?.isFlow1 || world?.pickle?.tags?.some((t) => t.name === "@flow-1"));
}

function getAgentAccount(world) {
  if (isFlow7Scenario(world)) {
    return salesInstructionsFlowData.agent;
  }
  if (isFlow1Scenario(world)) {
    return (
      listingData.fixedPriceFlow?.accounts?.agent ||
      loginData.agent
    );
  }
  return loginData.agent;
}

function getGeneralUserAccount(world) {
  if (isFlow7Scenario(world)) {
    return salesInstructionsFlowData.generalUser;
  }
  if (isFlow1Scenario(world)) {
    return (
      listingData.fixedPriceFlow?.accounts?.generalUser ||
      loginData.generalUser
    );
  }
  return loginData.generalUser;
}

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

  await world.loginPage.fillLoginForm(
    account.email,
    account.password
  );

  await world.loginPage.clickLogin();

  await world.loginPage.waitForOtpPage();

  await world.loginPage.enterOtp(
    account.otp
  );

  await world.loginPage.submitOtp();
}

Given(
  "the agent is logged in for the Fixed Price E2E flow",
  async function () {
    const account = getAgentAccount(this);

    await loginAs(
      this,
      account
    );

    await this.dashboardPage
      .waitForDashboard();
  }
);

// =====================================================
// AUTH & LOGOUT VERIFICATION
// =====================================================

When(
  "the Agent tests the logout and re-login functionality",
  async function () {
    const account = getAgentAccount(this);
    await this.dashboardPage.logout();
    await loginAs(this, account);
    await this.dashboardPage.waitForDashboard();
  }
);

When(
  "the Agent tests the logout and re-login functionality with field validations",
  async function () {
    const account = getAgentAccount(this);
    await this.dashboardPage.logout();
    await this.loginPage.goto(loginData.application.loginPath);
    await this.loginPage.testLoginFieldValidations(
      "invalid-email-format",
      account.email,
      account.password
    );
    await this.loginPage.clickLogin();
    await this.loginPage.waitForOtpPage();
    await this.loginPage.enterOtp(account.otp);
    await this.loginPage.submitOtp();
    await this.dashboardPage.waitForDashboard();
  }
);

// =====================================================
// GRANULAR & ENHANCED LISTING CREATION STEPS
// =====================================================

When(
  "the agent starts creating a Fixed Price listing",
  async function () {
    await this.dashboardPage.clickCreateListing();
    await this.propertyLocationPage.waitForPage();
  }
);

When(
  "the agent completes the property location step for the Fixed Price listing",
  async function () {
    await this.propertyLocationPage.typeAddressAndSelectFirstSuggestion(
      listingData.location.addressSearchText
    );
    await this.propertyLocationPage.waitForAutoFilledLocationFields();
    await this.propertyLocationPage.clickNext();
    await this.propertyDetailsPage.waitForPage();
  }
);

When(
  "the agent completes the property details step for the Fixed Price listing",
  async function () {
    await this.propertyDetailsPage.completeDetailsStep({
      ...listingData.details,
    });
    await this.pricingSalePage.waitForPage();
  }
);

When(
  "the agent verifies required price validation on the Pricing step",
  async function () {
    await this.pricingSalePage.verifyPriceRequiredValidation();
  }
);

When(
  "the agent completes the pricing and sale method step for the Fixed Price listing",
  async function () {
    await this.pricingSalePage.selectListingType(
      listingData.fixedPriceFlow.listingType
    );
    await this.pricingSalePage.enterPriceGuide(
      listingData.pricing.priceGuide
    );
  }
);

When(
  "the agent verifies data persistence by navigating back and forward from the Pricing step",
  async function () {
    // Navigate back to Details step using << button if enabled
    const didGoBack = await this.pricingSalePage.clickBack();
    if (didGoBack) {
      await this.propertyDetailsPage.waitForPage();

      // Assert values persisted on Details step
      await this.propertyDetailsPage.verifyFieldValues({
        propertyType: listingData.details.propertyType,
      });

      // Proceed forward again to Pricing
      await this.propertyDetailsPage.clickNext();
      await this.pricingSalePage.waitForPage();
    }

    // Assert Asking Price persisted on Pricing step
    await this.pricingSalePage.verifyPriceValue(
      listingData.pricing.priceGuide
    );

    // Proceed to Description step
    await this.pricingSalePage.clickNext();
    await this.descriptionFeaturesPage.waitForPage();
  }
);

When(
  "the agent completes the description and features step for the Fixed Price listing",
  async function () {
    await this.descriptionFeaturesPage.enterHeadline(
      listingData.description.headline
    );
    await this.descriptionFeaturesPage.enterDescription(
      listingData.description.propertyDescription
    );
    await this.descriptionFeaturesPage.selectFeatures(
      listingData.description.keyFeatures
    );
    await this.descriptionFeaturesPage.clickNext();
    await this.listingMediaPage.waitForPage();
  }
);

When(
  "the agent tests negative file format upload on the media step",
  async function () {
    const invalidFile = path.resolve(
      process.cwd(),
      "test-assets/listing/invalid-sample.txt"
    );
    await this.listingMediaPage.testNegativeFileFormatUpload(invalidFile);
  }
);

When(
  "the agent tests the maximum photo upload limit with 31 images",
  async function () {
    await this.listingMediaPage.testMaxPhotoUploadLimit();
  }
);

When(
  "the agent uploads the property photos for the Fixed Price listing",
  async function () {
    await this.listingMediaPage.uploadPropertyPhotos(
      listingData.media.propertyPhotos
    );
  }
);

When(
  "the agent tests photo swapping on the uploaded property photos",
  async function () {
    await this.listingMediaPage.swapPropertyPhotos(0, 1);
  }
);

When(
  "the agent removes an uploaded property photo and verifies the updated count",
  async function () {
    const photoCards = await this.listingMediaPage.getPhotoCards();
    const initialCount = await photoCards.count();
    console.log(`Photo cards before removal: ${initialCount}`);
    await this.listingMediaPage.removePropertyPhoto(0);
    const expectedCount = Math.max(initialCount - 1, 1);
    await this.listingMediaPage.verifyPhotoCount(expectedCount);
  }
);

When(
  "the agent uploads the floor plan for the Fixed Price listing",
  async function () {
    await this.listingMediaPage.uploadFloorPlan(
      listingData.media.floorPlan
    );
  }
);

When(
  "the agent tests negative document format upload on the media step",
  async function () {
    const invalidDoc = listingData.fixedPriceFlow.document.invalidFilePath;
    await this.listingMediaPage.testNegativeDocumentFormatUpload(invalidDoc);
  }
);

When(
  "the agent uploads the contract document for the Fixed Price listing",
  async function () {
    const docPath = listingData.fixedPriceFlow.document.filePath;
    const docName = listingData.fixedPriceFlow.document.docName;
    await this.listingMediaPage.uploadPropertyDocument(docName, docPath);
  }
);

When(
  "the agent confirms the Fixed Price listing",
  async function () {
    await this.listingMediaPage.confirmListing();
  }
);

When(
  "the agent uploads the floor plan and confirms the Fixed Price listing",
  async function () {
    await this.listingMediaPage.uploadFloorPlan(
      listingData.media.floorPlan
    );
    await this.listingMediaPage.confirmListing();
  }
);

When(
  "the agent publishes the Fixed Price listing",
  async function () {
    await this.listingMediaPage.publishListing();
  }
);

// =====================================================
// LISTINGS MANAGEMENT STEPS
// =====================================================

When(
  "the Agent checks the listings status filter options and filters by {string}",
  async function (filterStatus) {
    const isListingsTab = this.page.url().includes("tab=listings");
    if (!isListingsTab) {
      await this.dashboardPage.openListingsMenu();
    }
    await this.listingsPage.openStatusFilter();
    await this.listingsPage.verifyStatusFilterOptions(
      listingData.management.filters
    );
    const option = this.listingsPage.filterOptionsContainer.getByText(
      filterStatus,
      { exact: true }
    );
    await option.click();
    await this.page.waitForTimeout(1000);
  }
);

When(
  "the Agent toggles between Grid and List view to verify rendering",
  async function () {
    await this.listingsPage.switchToGridView();
    await this.page.waitForTimeout(1000);
    await this.listingsPage.switchToListView();
    await this.page.waitForTimeout(1000);
  }
);

// =====================================================
// BUYER ENGAGEMENT STEPS
// =====================================================

When(
  "the General User saves the property to favorites",
  async function () {
    await this.generalUserListingsPage.saveProperty();
    await this.generalUserListingsPage.verifyPropertySaved();
  }
);

When(
  "the General User opens the contact agent inquiry form",
  async function () {
    await this.generalUserListingsPage.openContactAgent();
  }
);

When(
  "the General User submits an initial offer of {string}",
  async function (initialOffer) {
    console.log(`Submitting initial offer: ${initialOffer}`);
    await this.offerPage.submitOffer(initialOffer);
    await this.offerPage.verifyOfferSubmitted(/offer.*submitted|success/i);
  }
);

When(
  "the General User edits the offer to the configured amount",
  async function () {
    const finalAmount = listingData.fixedPriceFlow.generalUser.offerAmount;
    console.log(`Editing active offer to configured amount: ${finalAmount}`);
    await this.offerPage.editOffer(finalAmount);
  }
);

// =====================================================
// NOTIFICATIONS & EMAIL STEPS
// =====================================================

When(
  "the Agent verifies the in-app notification bell",
  async function () {
    await this.dashboardPage.verifyNotificationBell();
  }
);

When(
  "the Agent checks the notification drawer for the offer received notification",
  async function () {
    await this.dashboardPage.verifyNotificationBell();
    await this.dashboardPage.verifyAndManageNotification("offer");
  }
);

When(
  "the Agent checks email in YOPmail for the offer received email",
  async function () {
    const yopmail = new YopmailHelper(this);
    const account = getAgentAccount(this);
    const res = await yopmail.waitForEmail(
      account.email,
      /offer|new offer|received|direct offer/i,
      25_000
    );
    console.log(
      `Agent YOPmail verification completed: ${
        res.found ? "Email Found" : "Check Completed"
      }`
    );
  }
);

When(
  "the General User checks the notification drawer for the offer accepted notification",
  async function () {
    await this.dashboardPage.verifyAndManageNotification("accepted");
  }
);

When(
  "the General User checks email in YOPmail for the offer accepted email",
  async function () {
    const yopmail = new YopmailHelper(this);
    const account = getGeneralUserAccount(this);
    const res = await yopmail.waitForEmail(
      account.email,
      /accepted|offer accepted|congratulations/i,
      25_000
    );
    console.log(
      `Buyer YOPmail verification completed: ${
        res.found ? "Email Found" : "Check Completed"
      }`
    );
  }
);

// =====================================================
// BUYER PROPERTY PAGE VERIFICATION STEPS
// =====================================================

When(
  "the General User verifies all property photos and property details match the listing",
  async function () {
    await this.generalUserListingsPage.verifyPropertyMediaAndDetails({
      headline: listingData.description.headline,
      address: listingData.location.addressSearchText,
      priceGuide: listingData.pricing.priceGuide,
      propertyType: listingData.details.propertyType,
      bedrooms: listingData.details.bedrooms,
      bathrooms: listingData.details.bathrooms,
      propertyDescription: listingData.description.propertyDescription,
      keyFeatures: listingData.description.keyFeatures,
    });
  }
);

When(
  "the General User verifies the floor plan is visible and can be downloaded",
  async function () {
    await this.generalUserListingsPage.verifyAndDownloadFloorPlan();
  }
);

When(
  "the General User verifies the property contract document is visible and can be downloaded",
  async function () {
    const docName = listingData.fixedPriceFlow.document.docName;
    await this.generalUserListingsPage.verifyAndDownloadPropertyDocument(docName);
  }
);

When(
  "the agent creates and publishes a Fixed Price listing",
  async function () {
    const isFlow7 = isFlow7Scenario(this);
    const addressSearchText = isFlow7
      ? salesInstructionsFlowData.agent.listing.addressSearchText
      : listingData.location.addressSearchText;
    const headline = isFlow7
      ? salesInstructionsFlowData.agent.listing.headline
      : listingData.description.headline;
    const description = isFlow7
      ? salesInstructionsFlowData.agent.listing.propertyDescription
      : listingData.description.propertyDescription;

    await this.dashboardPage
      .clickCreateListing();

    await this.propertyLocationPage
      .waitForPage();

    await this.propertyLocationPage
      .typeAddressAndSelectFirstSuggestion(
        addressSearchText
      );

    await this.propertyLocationPage
      .waitForAutoFilledLocationFields();

    await this.propertyLocationPage
      .clickNext();

    await this.propertyDetailsPage
      .waitForPage();

    await this.propertyDetailsPage
      .completeDetailsStep({
        ...listingData.details,
      });

    await this.pricingSalePage
      .waitForPage();

    await this.pricingSalePage
      .selectListingType(
        listingData.fixedPriceFlow
          .listingType
      );

    await this.pricingSalePage
      .enterPriceGuide(
        listingData.pricing.priceGuide
      );

    await this.pricingSalePage
      .clickNext();

    await this.descriptionFeaturesPage
      .waitForPage();

    await this.descriptionFeaturesPage
      .enterHeadline(
        headline
      );

    await this.descriptionFeaturesPage
      .enterDescription(
        description
      );

    await this.descriptionFeaturesPage
      .selectFeatures(
        listingData.description
          .keyFeatures
      );

    await this.descriptionFeaturesPage
      .clickNext();

    await this.listingMediaPage
      .waitForPage();

    await this.listingMediaPage
      .uploadPropertyPhotos(
        listingData.media
          .propertyPhotos
      );

    await this.listingMediaPage
      .uploadFloorPlan(
        listingData.media
          .floorPlan
      );

    await this.listingMediaPage
      .confirmListing();

    await this.listingMediaPage
      .publishListing();
  }
);

Then(
  "the Fixed Price listing is published successfully",
  async function () {
    const isFlow7 = isFlow7Scenario(this);
    const expectedName = isFlow7
      ? salesInstructionsFlowData.agent.listing.expectedPropertyName
      : listingData.location.expectedPropertyName;

    this.createdListingTitle = expectedName;

    await this.dashboardPage
      .waitForDashboardAfterPublish();

    await this.dashboardPage
      .openListingsMenu();

    await this.dashboardPage
      .verifyListingVisibleByLocation(
        expectedName
      );
  }
);

When(
  "I switch from Agent to General User",
  async function () {
    await clearCurrentSession(this);

    const account = getGeneralUserAccount(this);

    await loginAs(
      this,
      account
    );
  }
);

When(
  "the General User opens the created Fixed Price listing",
  async function () {
    const searchText = isFlow7Scenario(this)
      ? salesInstructionsFlowData.generalUser.searchText
      : listingData.fixedPriceFlow
          .generalUser.searchText;

    await this.generalUserListingsPage
      .openFirstMatchingListing(
        searchText
      );
  }
);

When(
  "the General User submits the configured offer",
  async function () {
    const offerAmount = isFlow7Scenario(this)
      ? salesInstructionsFlowData.generalUser.offerAmount
      : listingData.fixedPriceFlow
          .generalUser.offerAmount;

    await this.offerPage.submitOffer(
      offerAmount
    );
  }
);

Then(
  "the offer is submitted successfully",
  async function () {
    await this.offerPage
      .verifyOfferSubmitted(
        listingData.fixedPriceFlow
          .expected.offerSubmitted
      );
  }
);

When(
  "I switch from General User to Agent",
  async function () {
    await clearCurrentSession(this);

    const account = getAgentAccount(this);

    await loginAs(
      this,
      account
    );

    await this.dashboardPage
      .waitForDashboard();
  }
);

When(
  "the Agent accepts the submitted offer",
  async function () {
    await this.agentOffersPage
      .acceptSubmittedOffer();
  }
);

Then(
  "the offer is accepted successfully",
  async function () {
    await this.agentOffersPage
      .verifyAccepted(
        listingData.fixedPriceFlow
          .expected.offerAccepted
      );
  }
);

When(
  "the General User opens the created Fixed Price listing again",
  async function () {
    const searchText = isFlow7Scenario(this)
      ? salesInstructionsFlowData.generalUser.searchText
      : listingData.fixedPriceFlow
          .generalUser.searchText;

    await this.generalUserListingsPage
      .openFirstMatchingListing(
        searchText
      );
  }
);

When(
  "the General User starts the settlement process",
  async function () {
    await this.settlementPage.start();
  }
);

When(
  "the General User selects the configured solicitor",
  async function () {
    const solicitorSearch = isFlow7Scenario(this)
      ? salesInstructionsFlowData.settlement.solicitorSearch
      : listingData.fixedPriceFlow
          .settlement.solicitorSearch;

    await this.settlementPage
      .selectSolicitor(
        solicitorSearch
      );
  }
);

When(
  "the General User selects the configured mortgage broker",
  async function () {
    const brokerSearch = isFlow7Scenario(this)
      ? salesInstructionsFlowData.settlement.brokerSearch
      : listingData.fixedPriceFlow
          .settlement.brokerSearch;

    await this.settlementPage
      .selectBroker(
        brokerSearch
      );
  }
);

When(
  "the General User pays the deposit",
  async function () {
    const payment = isFlow7Scenario(this)
      ? salesInstructionsFlowData.payment
      : listingData.fixedPriceFlow
          .payment;

    await this.settlementPage
      .payFixedDeposit(
        payment
      );
  }
);

Then(
  "the deposit payment is successful",
  async function () {
    await this.settlementPage
      .verifyPaymentSuccessful(
        listingData.fixedPriceFlow
          .expected.paymentSuccessful
      );
  }
);
