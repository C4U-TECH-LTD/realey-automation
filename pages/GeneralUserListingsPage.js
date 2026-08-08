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

    const resultCard = this.page
      .locator("div")
      .filter({
        has: this.page.getByText(
          searchText,
          { exact: true }
        ),
      })
      .filter({
        has: this.page.getByRole(
          "button",
          { name: "Learn More", exact: true }
        ),
      })
      .first();

    const learnMore = resultCard.getByRole(
      "button",
      {
        name: "Learn More",
        exact: true,
      }
    );

    if (await learnMore.isVisible().catch(() => false)) {
      await learnMore.click();
      return;
    }

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

    await exactTitle.click();
  }
}

module.exports = {
  GeneralUserListingsPage,
};
