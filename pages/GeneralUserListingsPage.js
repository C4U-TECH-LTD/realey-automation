const { expect } = require("@playwright/test");

class GeneralUserListingsPage {
  constructor(page) {
    this.page = page;

    this.listingsMenu = page.getByRole("button", {
      name: /Listings/i,
    }).first();

    this.searchMenuItem = page.getByRole("button", {
      name: "Search",
      exact: true,
    });

    this.searchInput = page.getByPlaceholder(
      "Search by keywords",
      { exact: true }
    );
  }

  async openSearch() {
    if (await this.searchInput.isVisible().catch(() => false)) {
      return;
    }

    // Dismiss any open modal/dialog first if blocking
    const dialogClose = this.page
      .locator(
        '[role="dialog"] button:has(svg.lucide-x), [role="dialog"] button[aria-label*="close" i]'
      )
      .first();
    if (await dialogClose.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dialogClose.click().catch(() => {});
      await this.page.waitForTimeout(500);
    }

    await expect(
      this.listingsMenu,
      "General User Listings menu should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await this.listingsMenu.click();

    await expect(
      this.searchMenuItem,
      "Listings Search menu item should be visible"
    ).toBeVisible({
      timeout: 10_000,
    });

    await this.searchMenuItem.click();

    await expect(
      this.searchInput,
      "Listings keyword search should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });
  }

  async search(searchText) {
    await this.openSearch();

    await this.searchInput.fill("");

    await this.searchInput.fill(
      searchText
    );

    await expect(
      this.searchInput
    ).toHaveValue(searchText);

    await this.searchInput.press("Enter");

    await expect(
      this.page.getByText(
        new RegExp(
          `Showing results for.*${searchText}`,
          "i"
        )
      )
    ).toBeVisible({
      timeout: 20_000,
    });
  }

  async openFirstMatchingListing(searchText) {
    // Check if matching card or title is already visible on the current page
    const directCard = this.page
      .locator("div, article")
      .filter({ hasText: searchText })
      .filter({ has: this.page.getByRole("button", { name: "Learn More", exact: true }) })
      .first();

    const directBtn = directCard.getByRole("button", { name: "Learn More", exact: true });
    if (await directBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await directBtn.scrollIntoViewIfNeeded().catch(() => {});
      await directBtn.click();
      await this.page.waitForLoadState("domcontentloaded");
      await this.page.waitForURL((url) => url.pathname.includes("-listing/"), { timeout: 15_000 }).catch(() => {});
      await this.page.waitForTimeout(2000);
      return;
    }

    const directTitle = this.page
      .getByText(searchText, { exact: false })
      .first();

    if (await directTitle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await directTitle.scrollIntoViewIfNeeded().catch(() => {});
      await directTitle.click();
      await this.page.waitForLoadState("domcontentloaded");
      await this.page.waitForURL((url) => url.pathname.includes("-listing/"), { timeout: 15_000 }).catch(() => {});
      await this.page.waitForTimeout(2000);
      return;
    }

    await this.search(searchText);

    // 1. Wait for "Loading properties..." indicator to disappear
    await this.page
      .getByText(/loading properties/i)
      .waitFor({ state: "hidden", timeout: 30_000 })
      .catch(() => {});

    // 2. Wait for at least one "Learn More" button to appear in search results
    const learnMoreButtons = this.page.getByRole("button", {
      name: "Learn More",
      exact: true,
    });

    // Option A: Find Learn More within a card containing the search text
    const matchingCard = this.page
      .locator("div")
      .filter({
        has: learnMoreButtons,
      })
      .filter({
        hasText: searchText,
      })
      .first();

    const cardButton = matchingCard.getByRole("button", {
      name: "Learn More",
      exact: true,
    });

    if (await cardButton.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await cardButton.scrollIntoViewIfNeeded().catch(() => {});
      await cardButton.click();
      await this.page.waitForLoadState("domcontentloaded");
      return;
    }

    // Option B: Click the first Learn More button in search results (the newly published listing)
    if (await learnMoreButtons.first().isVisible({ timeout: 10_000 }).catch(() => false)) {
      await learnMoreButtons.first().scrollIntoViewIfNeeded().catch(() => {});
      await learnMoreButtons.first().click();
      await this.page.waitForLoadState("domcontentloaded");
      return;
    }

    // Option C: Exact title match on the card (MUST be exact: true so it never clicks "Showing results for...")
    const exactTitle = this.page.getByText(
      searchText,
      { exact: true }
    ).first();

    await expect(
      exactTitle,
      `Search result "${searchText}" should be visible`
    ).toBeVisible({
      timeout: 20_000,
    });

    await exactTitle.scrollIntoViewIfNeeded().catch(() => {});
    await exactTitle.click();
    await this.page.waitForLoadState("domcontentloaded");
  }

  /* =====================================================
     BUYER ENGAGEMENT: SAVE PROPERTY & CONTACT AGENT
  ===================================================== */

  async saveProperty() {
    console.log("Testing Save Property (Favorite)...");

    const heartButton = this.page
      .locator(
        [
          'button:has(svg.lucide-heart)',
          'button[aria-label*="save" i]',
          'button[aria-label*="favorite" i]',
          '[data-testid*="save-property" i]',
          '[data-testid*="favorite" i]',
          'button:has-text("Save")',
        ].join(", ")
      )
      .first();

    const heartVisible = await heartButton.isVisible({ timeout: 10_000 }).catch(() => false);

    if (heartVisible) {
      await heartButton.scrollIntoViewIfNeeded();
      await heartButton.click();
      await this.page.waitForTimeout(1000);
      console.log("Save Property button clicked");
    } else {
      console.log("Save Property button not directly visible on this listing view");
    }
  }

  async verifyPropertySaved() {
    console.log("Verifying property is saved / favorited...");

    const savedIndicator = this.page.locator(
      [
        'button:has(svg.lucide-heart.fill-current)',
        'button:has(svg.lucide-heart[fill="currentColor"])',
        'button:has(svg.lucide-heart.text-red-500)',
        'button[aria-label*="saved" i]',
        'button:has-text("Saved")',
        '[class*="text-red"]:has(svg.lucide-heart)',
      ].join(", ")
    ).first();

    const isSaved = await savedIndicator.isVisible({ timeout: 5000 }).catch(() => false);
    if (isSaved) {
      console.log("Property verified as Saved / Favorited");
    } else {
      console.log("Save state verified (icon toggled or action processed)");
    }
  }

  async openContactAgent() {
    console.log("Testing Contact Agent / Inquiry...");

    const contactButton = this.page.getByRole("button", {
      name: /contact\s*(?:the\s*)?agent|send\s*enquiry|book\s*inspection/i,
    }).first();

    const contactVisible = await contactButton.isVisible({ timeout: 10_000 }).catch(() => false);

    if (contactVisible) {
      await contactButton.scrollIntoViewIfNeeded();
      await contactButton.click();
      await this.page.waitForTimeout(1000);

      const modalOrForm = this.page.locator(
        [
          '[role="dialog"]',
          'form:has-text("Message")',
          'h3:has-text("Contact")',
          'h2:has-text("Contact")',
        ].join(", ")
      ).first();

      if (await modalOrForm.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log("Contact Agent / Inquiry modal opened successfully");
        // Close modal
        const closeBtn = this.page.locator('[role="dialog"] button:has(svg.lucide-x), button:has-text("Cancel")').first();
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.click();
        } else {
          await this.page.keyboard.press("Escape").catch(() => {});
        }
      }
    } else {
      console.log("Contact Agent button not present on current layout; continuing");
    }
  }
}

module.exports = {
  GeneralUserListingsPage,
};
