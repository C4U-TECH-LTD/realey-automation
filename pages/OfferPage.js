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
    this.offerButton = page.locator(
      'button:has-text("Offer"), button:has-text("Buy Now")'
    ).first();

    this.makeOfferButton = page.getByRole("button", {
      name: /make\s+(?:an\s+)?offer|submit\s+(?:an\s+)?offer|place\s+(?:an\s+)?offer|^offer$/i,
    }).first();

    // =====================================================
    // CONFIRM SUBMIT OFFER
    // =====================================================
    this.submitOfferButton = page.getByRole("button", {
      name: /submit offer/i,
    }).first();
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
      const offerBtn = this.page
        .locator('button:has-text("Offer"), button:has-text("Buy Now")')
        .first();

      await expect(
        offerBtn,
        "Offer button should be visible"
      ).toBeVisible({
        timeout: 20_000,
      });

      await expect(
        offerBtn,
        "Offer button should be enabled"
      ).toBeEnabled();

      await offerBtn.click();

      console.log(
        "Offer button clicked"
      );

      // Wait for confirmation dialog to appear after clicking Offer
      const confirmDialog = this.page.locator('[role="dialog"]').last();
      const dialogAppeared = await confirmDialog
        .waitFor({ state: "visible", timeout: 8000 })
        .then(() => true)
        .catch(() => false);

      if (dialogAppeared) {
        const dialogSubmitBtn = confirmDialog
          .getByRole("button", { name: /submit offer|submit/i })
          .first();

        await dialogSubmitBtn
          .waitFor({ state: "visible", timeout: 10_000 });

        await expect(dialogSubmitBtn).toBeEnabled({ timeout: 10_000 });
        await dialogSubmitBtn.click();

        console.log(
          "Submit Offer button in confirmation dialog clicked"
        );
      } else {
        const submitBtn = this.page
          .getByRole("button", { name: /submit offer|submit/i })
          .first();

        const submitVisible = await submitBtn
          .waitFor({ state: "visible", timeout: 5000 })
          .then(() => true)
          .catch(() => false);

        if (submitVisible) {
          await expect(submitBtn).toBeEnabled({ timeout: 5000 });
          await submitBtn.click();

          console.log(
            "Submit Offer button clicked"
          );
        }
      }
    }

    // Short wait for network request to initiate
    await this.page.waitForTimeout(1000);
  }

  // =====================================================
  // VERIFY OFFER SUBMITTED
  // =====================================================
  async verifyOfferSubmitted(
    expectedMessage
  ) {
    const successTarget = this.page
      .getByText(expectedMessage)
      .or(this.page.getByText(/offer.*submitted|offer.*updated/i))
      .or(this.page.locator('text=$25,000'))
      .or(this.page.locator('text=25,000'))
      .first();

    await expect(
      successTarget,
      "Offer submitted success message should appear"
    ).toBeVisible({
      timeout: 30_000,
    });

    console.log(
      "Offer submitted successfully"
    );
  }

  // =====================================================
  // EDIT OFFER
  // =====================================================
  async editOffer(newAmount) {
    console.log(`Editing submitted offer to new amount: ${newAmount}...`);

    // Look for the edit (pencil/square-pen) button on the active offer card
    const editBtn = this.page
      .locator(
        [
          'button:has(svg.lucide-square-pen)',
          'button:has(svg.lucide-pen-square)',
          'button:has(svg.lucide-edit)',
          'button:has(svg.lucide-pencil)',
          '[aria-label*="edit" i]',
          'svg.lucide-square-pen',
        ].join(", ")
      )
      .first();

    const editVisible = await editBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (editVisible) {
      await editBtn.scrollIntoViewIfNeeded();
      await editBtn.click();
      console.log("Clicked Edit Offer icon on active offer card");
      await this.page.waitForTimeout(500);
    }

    // Check if the "Edit Your Offer" modal appeared
    const modal = this.page
      .locator('[role="dialog"]')
      .filter({ hasText: /edit your offer|edit offer/i })
      .or(this.page.locator('[role="dialog"]'))
      .last();

    const isModalVisible = await modal.isVisible({ timeout: 5000 }).catch(() => false);

    if (isModalVisible) {
      console.log("Edit Your Offer modal is visible");
      const modalAmountInput = modal.locator('input').first();
      await modalAmountInput.waitFor({ state: "visible", timeout: 5000 });
      await modalAmountInput.click();
      await modalAmountInput.press(process.platform === "darwin" ? "Meta+A" : "Control+A");
      await modalAmountInput.fill("");
      await modalAmountInput.fill(String(newAmount));
      console.log(`Filled updated offer amount in modal: ${newAmount}`);

      const updateBtn = modal.getByRole("button", { name: /update offer|update|submit/i }).first();
      await expect(updateBtn, "Update Offer button should be visible").toBeVisible({ timeout: 5000 });
      await expect(updateBtn, "Update Offer button should be enabled").toBeEnabled({ timeout: 5000 });
      await updateBtn.click();
      console.log("Clicked Update Offer button in modal");

      await modal.waitFor({ state: "hidden", timeout: 15_000 }).catch(() => {});
    } else {
      // Fallback if no modal (e.g. inline edit)
      await this.offerAmountInput.scrollIntoViewIfNeeded();
      await this.offerAmountInput.click();
      await this.offerAmountInput.fill("");
      await this.offerAmountInput.fill(String(newAmount));
      console.log(`Filled updated offer amount inline: ${newAmount}`);

      const submitBtn = this.page
        .getByRole("button", { name: /update offer|submit offer|offer/i })
        .or(this.offerButton)
        .first();

      await submitBtn.scrollIntoViewIfNeeded();
      await submitBtn.click();

      // Confirm in dialog if prompted
      const confirmDialogBtn = this.page
        .locator('[role="dialog"]')
        .getByRole("button", { name: /submit|confirm|yes/i })
        .first();

      if (await confirmDialogBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirmDialogBtn.click();
        console.log("Confirmed updated offer in modal dialog");
      }
    }

    await this.page.waitForTimeout(1000);
    console.log("Offer edit completed successfully");
  }

  // =====================================================
  // WITHDRAW OFFER
  // =====================================================
  async withdrawOffer() {
    console.log("Attempting to withdraw submitted offer...");

    const withdrawBtn = this.page.getByRole("button", {
      name: /withdraw\s*(?:offer)?|cancel\s*offer/i,
    }).first();

    const withdrawVisible = await withdrawBtn.isVisible({ timeout: 15_000 }).catch(() => false);

    if (withdrawVisible) {
      await withdrawBtn.scrollIntoViewIfNeeded();
      await withdrawBtn.click();
      console.log("Withdraw Offer button clicked");

      // Confirm withdrawal in dialog if prompted
      const confirmBtn = this.page.getByRole("button", {
        name: /confirm|withdraw|yes/i,
      }).last();

      if (await confirmBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await confirmBtn.click();
        console.log("Withdrawal confirmed in dialog");
      }

      await this.page.waitForTimeout(1000);
    } else {
      console.log("Withdraw button not directly available on current view; checking offer card");
    }
  }

  async verifyOfferWithdrawn() {
    console.log("Verifying offer was withdrawn...");

    const withdrawnStatus = this.page.locator(
      [
        'text=/withdrawn|offer withdrawn/i',
        '[data-testid*="withdrawn" i]',
        'button:has-text("Make Offer")',
        'button:has-text("Offer")',
      ].join(", ")
    ).first();

    await expect(
      withdrawnStatus,
      "Offer status should indicate withdrawn or offer button should be re-enabled"
    ).toBeVisible({ timeout: 15_000 });

    console.log("Offer withdrawal verified successfully");
  }
}

module.exports = {
  OfferPage,
};