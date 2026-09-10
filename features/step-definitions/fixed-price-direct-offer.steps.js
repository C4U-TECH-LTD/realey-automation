const path = require("path");
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
  listingData,
} = require(
  "../../fixtures/test-data/listingData"
);

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
    await loginAs(
      this,
      loginData.agent
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
    await this.dashboardPage.logout();
    await loginAs(this, loginData.agent);
    await this.dashboardPage.waitForDashboard();
  }
);

When(
  "the Agent tests the logout and re-login functionality with field validations",
  async function () {
    await this.dashboardPage.logout();
    await this.loginPage.goto(loginData.application.loginPath);
    await this.loginPage.testLoginFieldValidations(
      "invalid-email-format",
      loginData.agent.email,
      loginData.agent.password
    );
    await this.loginPage.clickLogin();
    await this.loginPage.waitForOtpPage();
    await this.loginPage.enterOtp(loginData.agent.otp);
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
    const initialCount = listingData.media.propertyPhotos.length;
    await this.listingMediaPage.removePropertyPhoto(initialCount - 1);
    await this.listingMediaPage.verifyPhotoCount(initialCount - 1);
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
// NOTIFICATIONS STEP
// =====================================================

When(
  "the Agent verifies the in-app notification bell",
  async function () {
    await this.dashboardPage.verifyNotificationBell();
  }
);

When(
  "the General User checks the notification drawer for the offer accepted notification",
  async function () {
    await this.dashboardPage.verifyAndManageNotification("accepted");
  }
);

When(
  "the agent creates and publishes a Fixed Price listing",
  async function () {
    await this.dashboardPage
      .clickCreateListing();

    await this.propertyLocationPage
      .waitForPage();

    await this.propertyLocationPage
      .typeAddressAndSelectFirstSuggestion(
        listingData.location
          .addressSearchText
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
        listingData.description
          .headline
      );

    await this.descriptionFeaturesPage
      .enterDescription(
        listingData.description
          .propertyDescription
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
    await this.dashboardPage
      .waitForDashboardAfterPublish();

    await this.dashboardPage
      .openListingsMenu();

    await this.dashboardPage
      .verifyListingVisibleByLocation(
        listingData.location
          .expectedPropertyName
      );
  }
);

When(
  "I switch from Agent to General User",
  async function () {
    await clearCurrentSession(this);

    await loginAs(
      this,
      loginData.generalUser
    );
  }
);

When(
  "the General User opens the created Fixed Price listing",
  async function () {
    await this.generalUserListingsPage
      .openFirstMatchingListing(
        listingData.fixedPriceFlow
          .generalUser.searchText
      );
  }
);

When(
  "the General User submits the configured offer",
  async function () {
    await this.offerPage.submitOffer(
      listingData.fixedPriceFlow
        .generalUser.offerAmount
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

    await loginAs(
      this,
      loginData.agent
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
    await this.generalUserListingsPage
      .openFirstMatchingListing(
        listingData.fixedPriceFlow
          .generalUser.searchText
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
    await this.settlementPage
      .selectSolicitor(
        listingData.fixedPriceFlow
          .settlement.solicitorSearch
      );
  }
);

When(
  "the General User selects the configured mortgage broker",
  async function () {
    await this.settlementPage
      .selectBroker(
        listingData.fixedPriceFlow
          .settlement.brokerSearch
      );
  }
);

When(
  "the General User pays the deposit",
  async function () {
    await this.settlementPage
      .payFixedDeposit(
        listingData.fixedPriceFlow
          .payment
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
