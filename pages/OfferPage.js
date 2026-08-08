const { expect } = require("@playwright/test");

class OfferPage {
  constructor(page) {
    this.page = page;

    // Offer price input
    this.offerAmountInput =
      page.getByPlaceholder(
        "Enter offer amount",
        { exact: true }
      );

    // Offer button
    this.offerButton =
      page.getByRole("button", {
        name: "Offer",
        exact: true,
      });

    // Submit Offer button/modal button
    this.submitOfferButton =
      page.getByRole("button", {
        name: "Submit Offer",
        exact: true,
      });
  }

  async submitOffer(amount) {
    // ==========================================
    // 1. Wait for offer input
    // ==========================================

    await expect(
      this.offerAmountInput,
      "Offer amount input should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    // ==========================================
    // 2. Enter offer price
    // ==========================================

    await this.offerAmountInput.fill(
      String(amount)
    );

    // ==========================================
    // 3. Verify amount
    // UI converts 25000 -> 25,000
    // ==========================================

    const displayedValue =
      await this.offerAmountInput.inputValue();

    const normalizedValue =
      displayedValue.replace(/,/g, "");

    expect(normalizedValue).toBe(
      String(amount)
    );

    console.log(
      `Offer amount entered: ${displayedValue}`
    );

    // ==========================================
    // 4. Click Offer
    // ==========================================

    await expect(
      this.offerButton,
      "Offer button should be visible"
    ).toBeVisible({
      timeout: 10_000,
    });

    await expect(
      this.offerButton,
      "Offer button should be enabled"
    ).toBeEnabled();

    await this.offerButton.click();

    // ==========================================
    // 5. Submit Offer confirmation
    // ==========================================

    await expect(
      this.submitOfferButton,
      "Submit Offer button should be visible"
    ).toBeVisible({
      timeout: 10_000,
    });

    await expect(
      this.submitOfferButton
    ).toBeEnabled();

    await this.submitOfferButton.click();
  }

  async verifyOfferSubmitted(
    expectedMessage
  ) {
    await expect(
      this.page
        .getByText(expectedMessage)
        .first(),
      "Offer submitted success message should appear"
    ).toBeVisible({
      timeout: 20_000,
    });
  }
}

module.exports = {
  OfferPage,
};