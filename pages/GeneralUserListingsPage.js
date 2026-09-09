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
}

module.exports = {
  GeneralUserListingsPage,
};
