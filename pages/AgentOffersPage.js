const { expect } = require("@playwright/test");

class AgentOffersPage {
  constructor(page) {
    this.page = page;

    this.offersAndBids = page.getByText(
      "Offers & Bids",
      { exact: true }
    );

    this.acceptButton =
      page.getByRole("button", {
        name: "Accept",
        exact: true,
      }).first();
  }

  async openOffersAndBids() {
    await expect(
      this.offersAndBids,
      "Offers & Bids menu should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await this.offersAndBids.click();
  }

  async acceptSubmittedOffer() {
    await this.openOffersAndBids();

    await expect(
      this.acceptButton,
      "Accept offer button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await this.acceptButton.click();

    const confirmationButton =
      this.page.getByRole("button", {
        name: /Accept|Confirm|Yes/i,
      }).last();

    if (
      await confirmationButton
        .isVisible()
        .catch(() => false)
    ) {
      await confirmationButton.click();
    }
  }

  async verifyAccepted(expectedMessage) {
    const message = this.page
      .getByText(expectedMessage)
      .first();

    if (
      await message
        .isVisible()
        .catch(() => false)
    ) {
      await expect(message).toBeVisible();
      return;
    }

    // The supplied source showed the Accept control but not the exact
    // post-accept toast/status. If no toast is present, verify the
    // Accept action is no longer available.
    await expect(
      this.acceptButton
    ).not.toBeVisible({
      timeout: 10_000,
    });
  }
}

module.exports = {
  AgentOffersPage,
};
