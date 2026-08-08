const {
  setWorldConstructor,
  World,
} = require("@cucumber/cucumber");

const {
  expect,
} = require("@playwright/test");

const {
  LoginPage,
} = require("../../pages/LoginPage");

const {
  DashboardPage,
} = require("../../pages/DashboardPage");

const {
  PropertyLocationPage,
} = require("../../pages/PropertyLocationPage");

const {
  PropertyDetailsPage,
} = require("../../pages/PropertyDetailsPage");

const {
  PricingSalePage,
} = require("../../pages/PricingSalePage");

const {
  DescriptionFeaturesPage,
} = require("../../pages/DescriptionFeaturesPage");

const {
  ListingMediaPage,
} = require("../../pages/ListingMediaPage");

const {
  ListingsPage,
} = require("../../pages/ListingsPage");

const {
  GeneralUserListingsPage,
} = require("../../pages/GeneralUserListingsPage");

const {
  OfferPage,
} = require("../../pages/OfferPage");

const {
  AgentOffersPage,
} = require("../../pages/AgentOffersPage");

const {
  SettlementPage,
} = require("../../pages/SettlementPage");

const HomePage =
  require("../../pages/HomePage");

const Header =
  require("../../pages/Header");

const Footer =
  require("../../pages/Footer");

class RealeyWorld extends World {
  constructor(options) {
    super(options);

    this.expect = expect;

    this.baseURL =
      process.env.BASE_URL ||
      "https://uat.realey.au/";
  }

  initialisePageObjects() {
    this.loginPage =
      new LoginPage(this.page);

    this.dashboardPage =
      new DashboardPage(this.page);

    this.propertyLocationPage =
      new PropertyLocationPage(this.page);

    this.propertyDetailsPage =
      new PropertyDetailsPage(this.page);

    this.pricingSalePage =
      new PricingSalePage(this.page);

    this.descriptionFeaturesPage =
      new DescriptionFeaturesPage(this.page);

    this.listingMediaPage =
      new ListingMediaPage(this.page);

    this.listingsPage =
      new ListingsPage(this.page);

    this.generalUserListingsPage =
      new GeneralUserListingsPage(
        this.page
      );

    this.offerPage =
      new OfferPage(this.page);

    this.agentOffersPage =
      new AgentOffersPage(this.page);

    this.settlementPage =
      new SettlementPage(this.page);

    this.homePage =
      new HomePage(this.page);

    this.header =
      new Header(this.page);

    this.footer =
      new Footer(this.page);
  }
}

setWorldConstructor(
  RealeyWorld
);

module.exports = {
  RealeyWorld,
};
