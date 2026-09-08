const { expect } = require("@playwright/test");

class OfferPage {
  constructor(page) {
    this.page = page;

    // =====================================================
    // OFFER AMOUNT INPUT
    // Supports current and possible changed placeholder
    // =====================================================
    this.offerAmountInput = page.getByPlaceholder(
      /enter offer amount|offer amount/i
    );

    // =====================================================
    // OPEN / ACTION OFFER BUTTON
    // =====================================================
    this.offerButton = page.getByRole("button", {
      name: /^Offer$/i,
    });

    this.makeOfferButton = page.getByRole("button", {
      name: /make offer|submit an offer|place offer/i,
    });

    // =====================================================
    // CONFIRM SUBMIT OFFER
    // =====================================================
    this.submitOfferButton = page.getByRole("button", {
      name: "Submit Offer",
      exact: true,
    });
  }

  // =====================================================
  // ENSURE OFFER FORM IS OPEN
  // =====================================================
  async ensureOfferFormOpen() {
    console.log(
      "Checking whether Offer amount input is already visible..."
    );

    const inputAlreadyVisible =
      await this.offerAmountInput
        .isVisible()
        .catch(() => false);

    if (inputAlreadyVisible) {
      console.log(
        "Offer amount input is already visible"
      );

      return;
    }

    console.log(
      "Offer amount input not visible. Trying to open Offer form..."
    );

    // Try Make Offer style button first
    if (
      await this.makeOfferButton
        .isVisible()
        .catch(() => false)
    ) {
      await expect(
        this.makeOfferButton,
        "Make Offer button should be enabled"
      ).toBeEnabled();

      await this.makeOfferButton.click();

      console.log(
        "Make Offer button clicked"
      );
    }

    // If still not visible, try Offer button
    if (
      !(
        await this.offerAmountInput
          .isVisible()
          .catch(() => false)
      )
    ) {
      if (
        await this.offerButton
          .isVisible()
          .catch(() => false)
      ) {
        await expect(
          this.offerButton,
          "Offer button should be enabled"
        ).toBeEnabled();

        await this.offerButton.click();

        console.log(
          "Offer button clicked to open form"
        );
      }
    }

    // Final wait for input
    await expect(
      this.offerAmountInput,
      "Offer amount input should be visible"
    ).toBeVisible({
      timeout: 30_000,
    });

    console.log(
      "Offer amount input is visible"
    );
  }

  // =====================================================
  // SUBMIT OFFER
  // =====================================================
  async submitOffer(amount) {
    if (
      amount === undefined ||
      amount === null ||
      amount === ""
    ) {
      throw new Error(
        "Offer amount is required."
      );
    }

    await this.ensureOfferFormOpen();

    // =================================================
    // ENTER OFFER PRICE
    // =================================================

    await this.offerAmountInput.click();

    await this.offerAmountInput.fill("");

    await this.offerAmountInput.fill(
      String(amount)
    );

    // =================================================
    // VERIFY ENTERED VALUE
    // UI can format 25000 -> 25,000
    // =================================================

    const displayedValue =
      await this.offerAmountInput.inputValue();

    const normalizedValue =
      displayedValue.replace(/[^\d]/g, "");

    const expectedValue =
      String(amount).replace(/[^\d]/g, "");

    if (
      normalizedValue !== expectedValue
    ) {
      throw new Error(
        `Offer amount was not entered correctly. ` +
          `Expected ${expectedValue}, got ${normalizedValue}. ` +
          `Raw value: "${displayedValue}"`
      );
    }

    console.log(
      `Offer amount entered: ${displayedValue}`
    );

    // =================================================
    // CLICK OFFER
    // =================================================

    await expect(
      this.offerButton,
      "Offer button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.offerButton,
      "Offer button should be enabled"
    ).toBeEnabled();

    await this.offerButton.click();

    console.log(
      "Offer button clicked"
    );

    // =================================================
    // CONFIRM SUBMIT OFFER
    // =================================================

    await expect(
      this.submitOfferButton,
      "Submit Offer button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.submitOfferButton,
      "Submit Offer button should be enabled"
    ).toBeEnabled();

    await this.submitOfferButton.click();

    console.log(
      "Submit Offer button clicked"
    );
  }

  // =====================================================
  // VERIFY OFFER SUBMITTED
  // =====================================================
  async verifyOfferSubmitted(
    expectedMessage
  ) {
    await expect(
      this.page
        .getByText(expectedMessage)
        .first(),
      "Offer submitted success message should appear"
    ).toBeVisible({
      timeout: 30_000,
    });

    console.log(
      "Offer submitted successfully"
    );
  }
}

module.exports = {
  OfferPage,
};