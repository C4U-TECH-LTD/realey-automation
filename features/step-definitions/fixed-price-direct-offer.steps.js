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
