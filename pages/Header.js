const { expect } = require('@playwright/test');

class Header {
  constructor(page) {
    this.page = page;

    // Main desktop header container
    this.header = page
      .locator('div.mx-auto.flex.items-center.justify-between.max-w-6xl')
      .first();

    // Logo
    this.logo = this.header.getByRole('img', {
      name: 'Realey',
      exact: true,
    });

    // Desktop navigation
    this.desktopNavigation = this.header.locator('nav');

    this.homeButton = this.desktopNavigation.getByRole('button', {
      name: 'Home',
      exact: true,
    });

    this.aboutButton = this.desktopNavigation.getByRole('button', {
      name: 'About',
      exact: true,
    });

    this.listingsButton = this.desktopNavigation.getByRole('button', {
      name: 'Listings',
      exact: true,
    });

    this.searchButton = this.desktopNavigation.getByRole('button', {
      name: 'Search',
      exact: true,
    });

    this.pricingButton = this.desktopNavigation.getByRole('button', {
      name: 'Pricing',
      exact: true,
    });

    // Desktop action buttons
    this.desktopActionArea = this.header
      .locator('div.hidden.lg\\:block')
      .last();

    this.loginButton = this.desktopActionArea.getByRole('button', {
      name: 'Login',
      exact: true,
    });

    this.getStartedButton = this.desktopActionArea.getByRole('button', {
      name: 'Get Started',
      exact: true,
    });

    // Page verification elements
    this.homePageHeading = page.getByRole('heading', {
      name: 'Featured Properties',
      exact: true,
    });

    this.aboutPageText = page.getByText('About Realey', {
      exact: true,
    });

    this.listingsPageHeading = page.getByRole('heading', {
      name: 'Property Listings',
      exact: true,
    });

    this.searchPageHeading = page
      .getByText(/Find Your\s*Perfect\s*Property/i)
      .first();

    this.pricingPageHeading = page.getByRole('heading', {
      name: 'Pricing Plans',
      exact: true,
    });

    this.loginPageHeading = page.getByRole('heading', {
      name: 'Welcome back',
      exact: true,
    });

    this.getStartedPageHeading = page
      .getByText(/Choose Your\s*Profession/i)
      .first();
  }

  async verifyHeaderVisible() {
    await expect(
      this.header,
      'Main header container is missing',
    ).toBeVisible();
  }

  async verifyLogoVisible() {
    await expect(
      this.logo,
      'Realey header logo is missing',
    ).toBeVisible();

    await expect(
      this.logo,
      'Realey logo source is incorrect',
    ).toHaveAttribute('src', '/images/logo.png');

    await expect(
      this.logo,
      'Realey logo alt text is incorrect',
    ).toHaveAttribute('alt', 'Realey');
  }

  async verifyNavigationButtonsVisible() {
    await expect(
      this.desktopNavigation,
      'Desktop navigation container is missing',
    ).toBeVisible();

    await expect.soft(
      this.homeButton,
      'Home navigation button is missing',
    ).toBeVisible();

    await expect.soft(
      this.aboutButton,
      'About navigation button is missing',
    ).toBeVisible();

    await expect.soft(
      this.listingsButton,
      'Listings navigation button is missing',
    ).toBeVisible();

    await expect.soft(
      this.searchButton,
      'Search navigation button is missing',
    ).toBeVisible();

    await expect.soft(
      this.pricingButton,
      'Pricing navigation button is missing',
    ).toBeVisible();
  }

  async verifyActionButtonsVisible() {
    await expect.soft(
      this.loginButton,
      'Login button is missing',
    ).toBeVisible();

    await expect.soft(
      this.getStartedButton,
      'Get Started button is missing',
    ).toBeVisible();
  }

  async verifyAllHeaderElements() {
    await this.verifyHeaderVisible();
    await this.verifyLogoVisible();
    await this.verifyNavigationButtonsVisible();
    await this.verifyActionButtonsVisible();
  }

  async clickLogo() {
    await this.logo.click();
  }

  async clickHome() {
    await expect(this.homeButton).toBeVisible();
    await this.homeButton.click();

    await expect(
      this.homePageHeading,
      'Featured Properties heading is not visible after clicking Home',
    ).toBeVisible();
  }

  async clickAbout() {
    await expect(this.aboutButton).toBeVisible();
    await this.aboutButton.click();

    await expect(
      this.aboutPageText,
      'About Realey text is not visible after clicking About',
    ).toBeVisible();
  }

  async clickListings() {
    await expect(this.listingsButton).toBeVisible();
    await this.listingsButton.click();

    await expect(
      this.listingsPageHeading,
      'Property Listings heading is not visible after clicking Listings',
    ).toBeVisible();
  }

  async clickSearch() {
    await expect(this.searchButton).toBeVisible();
    await this.searchButton.click();

    await expect(
      this.searchPageHeading,
      'Find Your Perfect Property text is not visible after clicking Search',
    ).toBeVisible();
  }

  async clickPricing() {
    await expect(this.pricingButton).toBeVisible();
    await this.pricingButton.click();

    await expect(
      this.pricingPageHeading,
      'Pricing Plans heading is not visible after clicking Pricing',
    ).toBeVisible();
  }

  async clickLogin() {
    await expect(this.loginButton).toBeVisible();
    await this.loginButton.click();

    await expect(
      this.loginPageHeading,
      'Welcome back heading is not visible after clicking Login',
    ).toBeVisible();
  }

  async clickGetStarted() {
    await expect(this.getStartedButton).toBeVisible();
    await this.getStartedButton.click();

    await expect(
      this.getStartedPageHeading,
      'Choose Your Profession text is not visible after clicking Get Started',
    ).toBeVisible();
  }
}

module.exports = Header;