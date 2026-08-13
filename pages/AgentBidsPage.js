const { expect } = require("@playwright/test");

class AgentBidsPage {
  /**
   * @param {import("@playwright/test").Page} page
   */
  constructor(page) {
    this.page = page;

    const offersAndBidsText = page.getByText("Offers & Bids", {
      exact: true,
    });

    this.offersAndBidsButton = offersAndBidsText.locator(
      "xpath=ancestor::button[1]"
    );

    this.bidsTab = page.getByRole("button", {
      name: /^Bids\b/i,
    });

    this.startNegotiationButton = page.getByRole("button", {
      name: "Start negotiation",
      exact: true,
    });
  }

  async openBids() {
    await expect(
      this.offersAndBidsButton,
      "Offers & Bids menu should be visible"
    ).toBeVisible({ timeout: 20_000 });

    await this.offersAndBidsButton.click();

    await expect(this.bidsTab, "Bids tab should be visible").toBeVisible({
      timeout: 20_000,
    });

    await this.bidsTab.click();
  }

  async startNegotiation() {
    await expect(
      this.startNegotiationButton,
      "Start negotiation button should be visible"
    ).toBeVisible({ timeout: 20_000 });

    await this.startNegotiationButton.click();
  }
}

module.exports = {
  AgentBidsPage,
};
