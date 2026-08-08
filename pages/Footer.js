const { expect } = require('@playwright/test');

class Footer {
  constructor(page) {
    this.page = page;

    // ==================================================
    // Main footer
    // ==================================================

    this.footerHeading = page.getByRole('heading', {
      name: /let['’]s talk/i,
    });

    this.footer = this.footerHeading.locator(
      'xpath=ancestor::div[contains(@class,"max-w-6xl")][1]',
    );

    this.logo = this.footer.getByRole('img', {
      name: 'Realey Logo',
      exact: true,
    });

    this.description = this.footer.getByText(
      /Realey is a platform dedicated to property buyers, sellers, and agents/i,
    );

    // ==================================================
    // Email subscription
    // ==================================================

    this.emailInput = this.footer.getByPlaceholder('Enter your email', {
      exact: true,
    });

    this.emailSection = this.emailInput.locator('xpath=parent::*');
    this.emailSubmitButton = this.emailSection.locator('button').first();

    this.subscriptionSuccessMessage = page
      .getByText(/Email submitted successfully/i)
      .first();

    // ==================================================
    // Fixed Price
    // ==================================================

    this.fixedPriceHeading = this.footer.getByRole('heading', {
      name: 'Fixed Price',
      exact: true,
    });

    this.fixedPriceSection = this.fixedPriceHeading.locator(
      'xpath=parent::*',
    );

    this.fixedPriceListingsLink =
      this.fixedPriceSection.getByRole('link', {
        name: 'Listings',
        exact: true,
      });

    this.fixedPriceRecentlyAddedLink =
      this.fixedPriceSection.getByRole('link', {
        name: 'Recently Added',
        exact: true,
      });

    this.fixedPriceRecentlyEndedLink =
      this.fixedPriceSection.getByRole('link', {
        name: 'Recently Ended',
        exact: true,
      });

    // ==================================================
    // Auctions
    // ==================================================

    this.auctionsHeading = this.footer.getByRole('heading', {
      name: 'Auctions',
      exact: true,
    });

    this.auctionsSection = this.auctionsHeading.locator(
      'xpath=parent::*',
    );

    this.auctionsListingsLink =
      this.auctionsSection.getByRole('link', {
        name: 'Listings',
        exact: true,
      });

    this.auctionsEndingSoonLink =
      this.auctionsSection.getByRole('link', {
        name: 'Ending Soon',
        exact: true,
      });

    this.auctionsStartingSoonLink =
      this.auctionsSection.getByRole('link', {
        name: 'Starting Soon',
        exact: true,
      });

    this.auctionsRecentlyAddedLink =
      this.auctionsSection.getByRole('link', {
        name: 'Recently Added',
        exact: true,
      });

    this.auctionsRecentlyEndedLink =
      this.auctionsSection.getByRole('link', {
        name: 'Recently Ended',
        exact: true,
      });

    // ==================================================
    // Bottom footer
    // ==================================================

    this.copyrightText = page.getByText(
      '© 2026 Realey. All rights reserved.',
      { exact: true },
    );

    this.privacyPolicyLink = page.getByRole('link', {
      name: 'Privacy Policy',
      exact: true,
    });

    this.termsConditionsLink = page.getByRole('link', {
      name: 'Terms & Conditions',
      exact: true,
    });

    this.instagramLink = page.locator(
      'a[href="https://www.instagram.com/realey.au/"]',
    );

    this.linkedinLink = page.locator(
      'a[href="https://www.linkedin.com/company/realey/"]',
    );

    // ==================================================
    // Destination page elements
    // ==================================================

    this.propertyListingsHeading = page.getByRole('heading', {
      name: 'Property Listings',
      exact: true,
    });

    this.pageNotFoundHeading = page.getByRole('heading', {
      name: 'Page Not Found',
      exact: true,
    });

    this.privacyPolicyHeading = page
      .getByText(/Privacy\s*Policy/i)
      .first();

    this.termsConditionsHeading = page
      .getByText(/Terms\s*&\s*Conditions/i)
      .first();
  }

  // ==================================================
  // Common helpers
  // ==================================================

  async scrollToFooter() {
    await this.footerHeading.scrollIntoViewIfNeeded();

    await expect(
      this.footerHeading,
      'Footer heading is not visible after scrolling',
    ).toBeVisible();
  }

  async waitForInternalNavigation() {
    await this.page.waitForLoadState('domcontentloaded');
  }

  async verifyPageNotFoundIsAbsent() {
    await expect(
      this.pageNotFoundHeading,
      'The clicked footer link opened a Page Not Found page',
    ).toHaveCount(0);
  }

  async verifyPropertyListingsIsVisible() {
    await expect(
      this.propertyListingsHeading,
      'Property Listings heading was not displayed',
    ).toBeVisible({
      timeout: 10_000,
    });

    await this.verifyPageNotFoundIsAbsent();
  }

  // ==================================================
  // Main footer verification
  // ==================================================

  async verifyFooterVisible() {
    await expect(
      this.footer,
      'Footer container is not visible',
    ).toBeVisible();

    await expect(
      this.footerHeading,
      'Let’s Talk heading is missing',
    ).toBeVisible();
  }

  async verifyLogoVisible() {
    await expect(
      this.logo,
      'Realey footer logo is missing',
    ).toBeVisible();

    await expect(this.logo).toHaveAttribute(
      'src',
      '/images/logo.png',
    );

    await expect(this.logo).toHaveAttribute(
      'alt',
      'Realey Logo',
    );
  }

  async verifyDescriptionVisible() {
    await expect(
      this.description,
      'Footer description is missing',
    ).toBeVisible();
  }

  // ==================================================
  // Email subscription
  // ==================================================

  async verifyEmailSubscriptionElements() {
    await expect(
      this.emailInput,
      'Email subscription input is missing',
    ).toBeVisible();

    await expect(this.emailInput).toHaveAttribute(
      'type',
      'email',
    );

    await expect(this.emailInput).toHaveAttribute(
      'placeholder',
      'Enter your email',
    );

    await expect(
      this.emailSubmitButton,
      'Email submit arrow button is missing',
    ).toBeVisible();

    await expect(
      this.emailSubmitButton,
      'Email submit arrow button is disabled',
    ).toBeEnabled();
  }

  async enterEmail(email) {
    await this.emailInput.fill(email);

    await expect(
      this.emailInput,
      'Entered email value was not saved',
    ).toHaveValue(email);
  }

  async submitEmail() {
    await expect(this.emailSubmitButton).toBeVisible();
    await expect(this.emailSubmitButton).toBeEnabled();

    await this.emailSubmitButton.click();
  }

  async verifySubscriptionResult() {
    await expect(
      this.subscriptionSuccessMessage,
      'Email success message was not displayed',
    ).toBeVisible({
      timeout: 10_000,
    });
  }

  // ==================================================
  // Fixed Price section verification
  // ==================================================

  async verifyFixedPriceSection() {
    await expect.soft(
      this.fixedPriceHeading,
      'Fixed Price heading is missing',
    ).toBeVisible();

    await expect.soft(
      this.fixedPriceListingsLink,
      'Fixed Price Listings link is missing',
    ).toBeVisible();

    await expect.soft(
      this.fixedPriceRecentlyAddedLink,
      'Fixed Price Recently Added link is missing',
    ).toBeVisible();

    await expect.soft(
      this.fixedPriceRecentlyEndedLink,
      'Fixed Price Recently Ended link is missing',
    ).toBeVisible();
  }

  async clickFixedPriceListingsAndVerify() {
    await this.fixedPriceListingsLink.click();
    await this.waitForInternalNavigation();
    await this.verifyPropertyListingsIsVisible();
  }

  async clickFixedPriceRecentlyAddedAndVerify() {
    await this.fixedPriceRecentlyAddedLink.click();
    await this.waitForInternalNavigation();
    await this.verifyPageNotFoundIsAbsent();
  }

  async clickFixedPriceRecentlyEndedAndVerify() {
    await this.fixedPriceRecentlyEndedLink.click();
    await this.waitForInternalNavigation();
    await this.verifyPageNotFoundIsAbsent();
  }

  // ==================================================
  // Auctions section verification
  // ==================================================

  async verifyAuctionsSection() {
    await expect.soft(
      this.auctionsHeading,
      'Auctions heading is missing',
    ).toBeVisible();

    await expect.soft(
      this.auctionsListingsLink,
      'Auctions Listings link is missing',
    ).toBeVisible();

    await expect.soft(
      this.auctionsEndingSoonLink,
      'Auctions Ending Soon link is missing',
    ).toBeVisible();

    await expect.soft(
      this.auctionsStartingSoonLink,
      'Auctions Starting Soon link is missing',
    ).toBeVisible();

    await expect.soft(
      this.auctionsRecentlyAddedLink,
      'Auctions Recently Added link is missing',
    ).toBeVisible();

    await expect.soft(
      this.auctionsRecentlyEndedLink,
      'Auctions Recently Ended link is missing',
    ).toBeVisible();
  }

  async clickAuctionsListingsAndVerify() {
    await this.auctionsListingsLink.click();
    await this.waitForInternalNavigation();
    await this.verifyPropertyListingsIsVisible();
  }

  async clickAuctionsEndingSoonAndVerify() {
    await this.auctionsEndingSoonLink.click();
    await this.waitForInternalNavigation();
    await this.verifyPageNotFoundIsAbsent();
  }

  async clickAuctionsStartingSoonAndVerify() {
    await this.auctionsStartingSoonLink.click();
    await this.waitForInternalNavigation();
    await this.verifyPageNotFoundIsAbsent();
  }

  async clickAuctionsRecentlyAddedAndVerify() {
    await this.auctionsRecentlyAddedLink.click();
    await this.waitForInternalNavigation();
    await this.verifyPageNotFoundIsAbsent();
  }

  async clickAuctionsRecentlyEndedAndVerify() {
    await this.auctionsRecentlyEndedLink.click();
    await this.waitForInternalNavigation();
    await this.verifyPageNotFoundIsAbsent();
  }

  // ==================================================
  // Bottom footer verification
  // ==================================================

  async verifyBottomFooterElements() {
    await expect(
      this.copyrightText,
      'Copyright text is missing',
    ).toBeVisible();

    await expect(
      this.privacyPolicyLink,
      'Privacy Policy link is missing',
    ).toBeVisible();

    await expect(
      this.termsConditionsLink,
      'Terms & Conditions link is missing',
    ).toBeVisible();

    await expect(
      this.instagramLink,
      'Instagram link is missing',
    ).toBeVisible();

    await expect(
      this.linkedinLink,
      'LinkedIn link is missing',
    ).toBeVisible();
  }

  async clickPrivacyPolicyAndVerify() {
    await this.privacyPolicyLink.click();
    await this.waitForInternalNavigation();

    await expect(
      this.privacyPolicyHeading,
      'Privacy Policy page text was not displayed',
    ).toBeVisible();

    await this.verifyPageNotFoundIsAbsent();
  }

  async clickTermsConditionsAndVerify() {
    await this.termsConditionsLink.click();
    await this.waitForInternalNavigation();

    await expect(
      this.termsConditionsHeading,
      'Terms & Conditions page text was not displayed',
    ).toBeVisible();

    await this.verifyPageNotFoundIsAbsent();
  }

  async clickInstagramAndVerify() {
    const [instagramPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.instagramLink.click(),
    ]);

    await instagramPage.waitForLoadState('domcontentloaded');

    await expect(instagramPage).toHaveURL(
      /instagram\.com\/realey\.au\/?/i,
    );

    await instagramPage.close();
  }

  async clickLinkedInAndVerify() {
    const [linkedinPage] = await Promise.all([
      this.page.context().waitForEvent('page'),
      this.linkedinLink.click(),
    ]);

    await linkedinPage.waitForLoadState('domcontentloaded');

    await expect(linkedinPage).toHaveURL(
      /linkedin\.com\/company\/realey/i,
    );

    await linkedinPage.close();
  }

  async verifyAllFooterElements() {
    await this.verifyFooterVisible();
    await this.verifyLogoVisible();
    await this.verifyDescriptionVisible();
    await this.verifyEmailSubscriptionElements();
    await this.verifyFixedPriceSection();
    await this.verifyAuctionsSection();
    await this.verifyBottomFooterElements();
  }
}

module.exports = Footer;
