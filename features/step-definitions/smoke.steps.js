const { Given, Then } = require('@cucumber/cucumber');

Given('I open the Realey home page', async function () {
  await this.homePage.open();
  await this.page.waitForLoadState('domcontentloaded');
});

const headerBehaviors = {
  'Verify header container and logo': async (header) => {
    await header.verifyHeaderVisible();
    await header.verifyLogoVisible();
  },
  'Verify all header navigation buttons': (header) =>
    header.verifyNavigationButtonsVisible(),
  'Verify Login and Get Started buttons': (header) =>
    header.verifyActionButtonsVisible(),
  'Click Home and verify Featured Properties': (header) => header.clickHome(),
  'Click About and verify About Realey': (header) => header.clickAbout(),
  'Click Listings and verify Property Listings': (header) => header.clickListings(),
  'Click Search and verify Find Your Perfect Property': (header) => header.clickSearch(),
  'Click Pricing and verify Pricing Plans': (header) => header.clickPricing(),
  'Click Login and verify Welcome back': (header) => header.clickLogin(),
  'Click Get Started and verify Choose Your Profession': (header) =>
    header.clickGetStarted(),
};

Then('the header behavior {string} is verified', async function (behavior) {
  const action = headerBehaviors[behavior];
  if (!action) throw new Error(`Unknown header behavior: ${behavior}`);
  await action(this.header);
});

const footerBehaviors = {
  'Verify footer main information': async (footer) => {
    await footer.scrollToFooter();
    await footer.verifyFooterVisible();
    await footer.verifyLogoVisible();
    await footer.verifyDescriptionVisible();
  },
  'Verify Fixed Price section elements': async (footer) => {
    await footer.scrollToFooter();
    await footer.verifyFixedPriceSection();
  },
  'Verify Auctions section elements': async (footer) => {
    await footer.scrollToFooter();
    await footer.verifyAuctionsSection();
  },
  'Verify bottom footer elements': async (footer) => {
    await footer.scrollToFooter();
    await footer.verifyBottomFooterElements();
  },
  'Fixed Price - Listings link': (footer) => footer.clickFixedPriceListingsAndVerify(),
  'Fixed Price - Recently Added link': (footer) =>
    footer.clickFixedPriceRecentlyAddedAndVerify(),
  'Fixed Price - Recently Ended link': (footer) =>
    footer.clickFixedPriceRecentlyEndedAndVerify(),
  'Auctions - Listings link': (footer) => footer.clickAuctionsListingsAndVerify(),
  'Auctions - Ending Soon link': (footer) => footer.clickAuctionsEndingSoonAndVerify(),
  'Auctions - Starting Soon link': (footer) => footer.clickAuctionsStartingSoonAndVerify(),
  'Auctions - Recently Added link': (footer) => footer.clickAuctionsRecentlyAddedAndVerify(),
  'Auctions - Recently Ended link': (footer) => footer.clickAuctionsRecentlyEndedAndVerify(),
  'Bottom Footer - Privacy Policy link': (footer) => footer.clickPrivacyPolicyAndVerify(),
  'Bottom Footer - Terms and Conditions link': (footer) =>
    footer.clickTermsConditionsAndVerify(),
  'Bottom Footer - Instagram link': (footer) => footer.clickInstagramAndVerify(),
  'Bottom Footer - LinkedIn link': (footer) => footer.clickLinkedInAndVerify(),
};

Then('the footer behavior {string} is verified', async function (behavior) {
  if (behavior === 'Verify footer email subscription') {
    const testEmail = `qa.footer.${Date.now()}@example.com`;
    await this.footer.scrollToFooter();
    await this.footer.verifyEmailSubscriptionElements();
    await this.footer.enterEmail(testEmail);
    await this.footer.submitEmail();
    await this.footer.verifySubscriptionResult();
    return;
  }

  const action = footerBehaviors[behavior];
  if (!action) throw new Error(`Unknown footer behavior: ${behavior}`);
  await this.footer.scrollToFooter();
  await action(this.footer);
});

const homeBehaviors = {
  'Homepage loads successfully': 'verifyPageLoaded',
  'Hero - View Listing button is visible': 'verifyViewListingButtonVisible',
  'Hero - View Listing button opens Property Listings': 'clickViewListingAndVerify',
  'Featured Properties heading is visible': 'verifyFeaturedPropertiesHeading',
  'View All Listings button is visible': 'verifyViewAllListingsButtonVisible',
  'View All Listings button opens Property Listings': 'clickViewAllListingsAndVerify',
  'Platform Features heading is visible': 'verifyPlatformFeaturesHeading',
  'Platform Features previous button works': 'verifyPlatformPreviousButtonWorks',
  'Platform Features next button works': 'verifyPlatformNextButtonWorks',
  'Trusted partners heading is visible': 'verifyTrustedPartnersHeading',
  'Real Estate Agents heading is visible': 'verifyRealEstateAgentsHeading',
  'Solicitors heading is visible': 'verifySolicitorsHeading',
  'Mortgage Brokers heading is visible': 'verifyMortgageBrokersHeading',
  'FAQ heading is visible': 'verifyFaqHeading',
  'FAQ - Schedule a property visit dropdown works': 'verifyScheduleVisitFaqWorks',
  'FAQ - Property listings verified dropdown works': 'verifyListingsVerifiedFaqWorks',
  'FAQ - Home loan dropdown works': 'verifyHomeLoanFaqWorks',
  'FAQ - Brokerage and service fees dropdown works': 'verifyServiceFeesFaqWorks',
  'FAQ - List property dropdown works': 'verifyListPropertyFaqWorks',
  'FAQ - Save properties dropdown works': 'verifySavePropertiesFaqWorks',
  'Contact Us button is visible': 'verifyContactUsButtonVisible',
  'Contact Us button opens help page': 'clickContactUsAndVerify',
};

Then('the home page behavior {string} is verified', async function (behavior) {
  const methodName = homeBehaviors[behavior];
  if (!methodName || typeof this.homePage[methodName] !== 'function') {
    throw new Error(`Unknown home page behavior: ${behavior}`);
  }
  await this.homePage[methodName]();
});

Then('visible public navigation links are collected', async function () {
  const links = this.page.locator('a:visible');
  this.expect(await links.count()).toBeGreaterThan(0);
  const linkDetails = await links.evaluateAll((elements) =>
    elements.slice(0, 50).map((element) => ({
      text: (element.textContent || '').trim(),
      href: element.href,
    })),
  );
  await this.attach(JSON.stringify(linkDetails, null, 2), 'application/json');
});
