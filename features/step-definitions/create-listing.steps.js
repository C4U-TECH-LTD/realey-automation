const { Given, When, Then } = require('@cucumber/cucumber');
const { loginData } = require('../../fixtures/test-data/loginData');
const { listingData } = require('../../fixtures/test-data/listingData');

Given('I am logged in as an agent using the fixed OTP', async function () {
  await this.loginPage.goto(loginData.application.loginPath);
  await this.loginPage.login(loginData.application.email, loginData.application.password);
  await this.loginPage.waitForOtpPage();
  await this.loginPage.enterOtp(loginData.application.otp);
  await this.loginPage.submitOtp();
});

Given('the agent dashboard is open', async function () {
  await this.dashboardPage.waitForDashboard();
});

When('I start creating a listing', async function () {
  await this.dashboardPage.clickCreateListing();
});

Then('the Property Location step is displayed', async function () {
  await this.propertyLocationPage.waitForPage();
});

When('I complete the property location step', async function () {
  await this.propertyLocationPage.typeAddressAndSelectFirstSuggestion(
    listingData.location.addressSearchText,
  );
  await this.propertyLocationPage.waitForAutoFilledLocationFields();
  await this.propertyLocationPage.clickNext();
});

Then('the Property Details step is displayed', async function () {
  await this.propertyDetailsPage.waitForPage();
});

When('I complete the property details step', async function () {
  await this.propertyDetailsPage.completeDetailsStep(listingData.details);
});

Then('the Pricing and Sale Method step is displayed', async function () {
  await this.pricingSalePage.waitForPage();
});

When('I complete the pricing and sale method step', async function () {
  await this.pricingSalePage.selectListingType(listingData.pricing.listingType);
  await this.pricingSalePage.enterPriceGuide(listingData.pricing.priceGuide);
  await this.pricingSalePage.clickNext();
});

Then('the Description and Features step is displayed', async function () {
  await this.descriptionFeaturesPage.waitForPage();
});

When('I complete the description and features step', async function () {
  await this.descriptionFeaturesPage.enterHeadline(listingData.description.headline);
  await this.descriptionFeaturesPage.enterDescription(
    listingData.description.propertyDescription,
  );
  await this.descriptionFeaturesPage.selectFeatures(listingData.description.keyFeatures);
  await this.descriptionFeaturesPage.clickNext();
});

Then('the Property Media step is displayed', async function () {
  await this.listingMediaPage.waitForPage();
});

When('I upload the property photos', async function () {
  await this.listingMediaPage.uploadPropertyPhotos(listingData.media.propertyPhotos);
});

When('I upload the floor plan', async function () {
  await this.listingMediaPage.uploadFloorPlan(listingData.media.floorPlan);
});

When('I confirm and publish the listing', async function () {
  await this.listingMediaPage.confirmListing();
  await this.listingMediaPage.publishListing();
});

Then('the dashboard opens after publishing', async function () {
  await this.dashboardPage.waitForDashboardAfterPublish();
});

When('I open the Listings menu', async function () {
  await this.dashboardPage.openListingsMenu();
});

Then('the newly published property is visible', async function () {
  await this.dashboardPage.verifyListingVisibleByLocation(
    listingData.location.expectedPropertyName,
  );
});
