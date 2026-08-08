const { expect } = require('@playwright/test');

class HomePage {
  constructor(page) {
    this.page = page;
    this.body = page.locator('body');

    // ==================================================
    // Hero section
    // ==================================================

    this.viewListingButton = page.getByRole('button', {
      name: 'View Listing',
      exact: true,
    });

    // ==================================================
    // Featured Properties
    // ==================================================

    this.featuredPropertiesHeading = page.getByRole('heading', {
      name: 'Featured Properties',
      exact: true,
    });

    this.viewAllListingsButton = page.getByRole('button', {
      name: 'View All Listings',
      exact: true,
    });

    this.propertyListingsHeading = page.getByRole('heading', {
      name: 'Property Listings',
      exact: true,
    });

    // ==================================================
    // Platform Features
    // ==================================================

    this.platformFeaturesHeading = page.getByRole('heading', {
      name: 'Platform Features',
      exact: true,
    });

    // Use the SVG icon classes shown in the DOM.
    // This is more reliable than searching from the heading with a broad XPath.
    this.platformPreviousButton = page
      .locator('button:has(svg.lucide-chevron-left)')
      .first();

    this.platformNextButton = page
      .locator('button:has(svg.lucide-chevron-right)')
      .first();

    // ==================================================
    // Trusted Partners
    // ==================================================

    this.trustedPartnersHeading = page.getByRole('heading', {
      name: "Connect with Realey's trusted partners!",
      exact: true,
    });

    this.realEstateAgentsHeading = page.getByRole('heading', {
      name: 'Real Estate Agents',
      exact: true,
    });

    this.solicitorsHeading = page.getByRole('heading', {
      name: 'Solicitors',
      exact: true,
    });

    this.mortgageBrokersHeading = page.getByRole('heading', {
      name: 'Mortgage Brokers',
      exact: true,
    });

    // ==================================================
    // FAQ section
    // ==================================================

    this.faqHeading = page.getByRole('heading', {
      name: 'Frequently Ask Questions',
      exact: true,
    });

    this.contactUsButton = page.getByRole('button', {
      name: 'Contact Us',
      exact: true,
    });

    this.contactPageHeading = page.getByRole('heading', {
      name: 'How can we help?',
      exact: true,
    });

    this.scheduleVisitQuestion = page.getByRole('button', {
      name: 'How do I schedule a property visit?',
      exact: true,
    });

    this.verifiedListingsQuestion = page.getByRole('button', {
      name: 'Are the property listings verified?',
      exact: true,
    });

    this.homeLoanQuestion = page.getByRole('button', {
      name: 'Can I apply for a home loan through the platform?',
      exact: true,
    });

    this.serviceFeesQuestion = page.getByRole('button', {
      name: 'Do you charge any brokerage or service fees?',
      exact: true,
    });

    this.listPropertyQuestion = page.getByRole('button', {
      name: 'How can I list my property for sale or rent?',
      exact: true,
    });

    this.savePropertiesQuestion = page.getByRole('button', {
      name: 'Can I save properties to view later?',
      exact: true,
    });

    this.pageNotFoundHeading = page.getByRole('heading', {
      name: 'Page Not Found',
      exact: true,
    });
  }

  // ==================================================
  // Common
  // ==================================================

  async open() {
    await this.page.goto('/', {
      waitUntil: 'domcontentloaded',
    });

    await expect(
      this.body,
      'Homepage body is not visible',
    ).toBeVisible();
  }

  async verifyPageLoaded() {
    await expect(
      this.body,
      'Homepage did not load',
    ).toBeVisible();

    await expect(
      this.page,
      'Homepage URL is incorrect',
    ).toHaveURL(/https:\/\/uat\.realey\.au\/?/);
  }

  async verifyPageNotFoundIsAbsent() {
    await expect(
      this.pageNotFoundHeading,
      'The page opened a Page Not Found screen',
    ).toHaveCount(0);
  }

  async clickAndVerifyListings(button) {
    await expect(
      button,
      'Listing navigation button is not visible',
    ).toBeVisible();

    await expect(
      button,
      'Listing navigation button is disabled',
    ).toBeEnabled();

    await button.click();
    await this.page.waitForLoadState('domcontentloaded');

    await expect(
      this.propertyListingsHeading,
      'Property Listings heading was not displayed',
    ).toBeVisible({
      timeout: 10_000,
    });

    await this.verifyPageNotFoundIsAbsent();
  }

  async verifyFaqOpens(questionButton) {
    await questionButton.scrollIntoViewIfNeeded();

    await expect(
      questionButton,
      'FAQ question button is not visible',
    ).toBeVisible();

    await expect(
      questionButton,
      'FAQ question button is disabled',
    ).toBeEnabled();

    // The answer <p> is inside the rounded FAQ card, not always inside
    // the button's immediate parent in every rendered layout.
    const faqCard = questionButton.locator(
      'xpath=ancestor::div[contains(@class,"rounded-2xl")][1]',
    );

    const answer = faqCard.locator('p').first();

    // If already open, close it first so the test proves the click works.
    if (await answer.isVisible().catch(() => false)) {
      await questionButton.click();
      await expect(answer).toBeHidden({ timeout: 10_000 });
    }

    await questionButton.click();

    await expect(
      answer,
      'FAQ answer did not open after clicking the question',
    ).toBeVisible({
      timeout: 10_000,
    });
  }

  // ==================================================
  // Hero
  // ==================================================

  async verifyViewListingButtonVisible() {
    await expect(
      this.viewListingButton,
      'View Listing button is missing',
    ).toBeVisible();

    await expect(
      this.viewListingButton,
      'View Listing button is disabled',
    ).toBeEnabled();
  }

  async clickViewListingAndVerify() {
    await this.clickAndVerifyListings(this.viewListingButton);
  }

  // ==================================================
  // Featured Properties
  // ==================================================

  async verifyFeaturedPropertiesHeading() {
    await expect(
      this.featuredPropertiesHeading,
      'Featured Properties heading is missing',
    ).toBeVisible();
  }

  async verifyViewAllListingsButtonVisible() {
    await expect(
      this.viewAllListingsButton,
      'View All Listings button is missing',
    ).toBeVisible();

    await expect(
      this.viewAllListingsButton,
      'View All Listings button is disabled',
    ).toBeEnabled();
  }

  async clickViewAllListingsAndVerify() {
    await this.clickAndVerifyListings(this.viewAllListingsButton);
  }

  // ==================================================
  // Platform Features
  // ==================================================

  async verifyPlatformFeaturesHeading() {
    await expect(
      this.platformFeaturesHeading,
      'Platform Features heading is missing',
    ).toBeVisible();
  }

  async verifyPlatformPreviousButtonWorks() {
    await this.platformFeaturesHeading.scrollIntoViewIfNeeded();

    await expect(
      this.platformPreviousButton,
      'Platform Features previous button is missing',
    ).toBeVisible();

    await expect(
      this.platformPreviousButton,
      'Platform Features previous button is disabled',
    ).toBeEnabled();

    await this.platformPreviousButton.click();
    await this.verifyPageNotFoundIsAbsent();
  }

  async verifyPlatformNextButtonWorks() {
    await this.platformFeaturesHeading.scrollIntoViewIfNeeded();

    await expect(
      this.platformNextButton,
      'Platform Features next button is missing',
    ).toBeVisible();

    await expect(
      this.platformNextButton,
      'Platform Features next button is disabled',
    ).toBeEnabled();

    await this.platformNextButton.click();
    await this.verifyPageNotFoundIsAbsent();
  }

  // ==================================================
  // Trusted Partners
  // ==================================================

  async verifyTrustedPartnersHeading() {
    await expect(
      this.trustedPartnersHeading,
      'Trusted partners heading is missing',
    ).toBeVisible();
  }

  async verifyRealEstateAgentsHeading() {
    await expect(
      this.realEstateAgentsHeading,
      'Real Estate Agents heading is missing',
    ).toBeVisible();
  }

  async verifySolicitorsHeading() {
    await expect(
      this.solicitorsHeading,
      'Solicitors heading is missing',
    ).toBeVisible();
  }

  async verifyMortgageBrokersHeading() {
    await expect(
      this.mortgageBrokersHeading,
      'Mortgage Brokers heading is missing',
    ).toBeVisible();
  }

  // ==================================================
  // FAQ
  // ==================================================

  async verifyFaqHeading() {
    await expect(
      this.faqHeading,
      'Frequently Ask Questions heading is missing',
    ).toBeVisible();
  }

  async verifyScheduleVisitFaqWorks() {
    await this.verifyFaqOpens(this.scheduleVisitQuestion);
  }

  async verifyListingsVerifiedFaqWorks() {
    await this.verifyFaqOpens(this.verifiedListingsQuestion);
  }

  async verifyHomeLoanFaqWorks() {
    await this.verifyFaqOpens(this.homeLoanQuestion);
  }

  async verifyServiceFeesFaqWorks() {
    await this.verifyFaqOpens(this.serviceFeesQuestion);
  }

  async verifyListPropertyFaqWorks() {
    await this.verifyFaqOpens(this.listPropertyQuestion);
  }

  async verifySavePropertiesFaqWorks() {
    await this.verifyFaqOpens(this.savePropertiesQuestion);
  }

  async verifyContactUsButtonVisible() {
    await expect(
      this.contactUsButton,
      'Contact Us button is missing',
    ).toBeVisible();

    await expect(
      this.contactUsButton,
      'Contact Us button is disabled',
    ).toBeEnabled();
  }

  async clickContactUsAndVerify() {
    await this.contactUsButton.scrollIntoViewIfNeeded();
    await this.contactUsButton.click();
    await this.page.waitForLoadState('domcontentloaded');

    await expect(
      this.contactPageHeading,
      'How can we help heading was not displayed',
    ).toBeVisible({
      timeout: 10_000,
    });

    await this.verifyPageNotFoundIsAbsent();
  }
}

module.exports = HomePage;
