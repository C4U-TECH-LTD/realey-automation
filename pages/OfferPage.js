const { expect } = require("@playwright/test");

class OfferPage {
  constructor(page) {
    this.page = page;

    // =====================================================
    // OFFER AMOUNT INPUT
    // Supports current and possible changed placeholder
    // =====================================================
    this.offerAmountInput = page.locator(
      'input[placeholder*="amount" i], input[placeholder*="offer" i], input[name*="amount" i], input[name*="offer" i], input[type="number"]'
    ).first();

    // =====================================================
    // OPEN / ACTION OFFER BUTTON
    // =====================================================
    this.offerButton = page.getByRole("button", {
      name: /^Offer$/i,
    });

    this.makeOfferButton = page.getByRole("button", {
      name: /make\s+(?:an\s+)?offer|submit\s+(?:an\s+)?offer|place\s+(?:an\s+)?offer|^offer$/i,
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

    const dialog = this.page.locator('[role="dialog"]').last();
    if (await dialog.isVisible().catch(() => false)) {
      console.log("Offer modal dialog is already open");
      return;
    }

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
      } else {
        const anyOfferBtn = this.page.locator('button:has-text("Offer"), button:has-text("Buy Now")').first();
        if (await anyOfferBtn.isVisible().catch(() => false)) {
          await anyOfferBtn.click();
          console.log("Fallback Offer button clicked");
        }
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

    // Check if modal dialog is open
    const dialog = this.page.locator('[role="dialog"]').last();
    const isDialog = await dialog.isVisible().catch(() => false);

    const input = isDialog
      ? dialog
          .locator(
            'input[placeholder*="amount" i], input[placeholder*="offer" i], input[name*="amount" i], input[name*="offer" i], input[type="number"], input'
          )
          .first()
      : this.offerAmountInput;

    await input.click();

    await input.fill("");

    await input.fill(
      String(amount)
    );

    const displayedValue =
      await input.inputValue();

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

    if (isDialog) {
      const submitBtn = dialog
        .getByRole("button", { name: /submit offer/i })
        .first();

      await expect(
        submitBtn,
        "Submit Offer button should be visible"
      ).toBeVisible({
        timeout: 20_000,
      });

      await expect(
        submitBtn,
        "Submit Offer button should be enabled"
      ).toBeEnabled();

      await submitBtn.click();

      console.log(
        "Submit Offer button in dialog clicked"
      );
    } else {
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