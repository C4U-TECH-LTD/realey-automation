const { expect } = require("@playwright/test");

class BidderRegisterPage {
  /**
   * @param {import("@playwright/test").Page} page
   */
  constructor(page) {
    this.setPage(page);
  }

  // =====================================================
  // SET ACTIVE PAGE + LOCATORS
  // =====================================================
  setPage(page) {
    this.page = page;

    // =====================================================
    // REGISTER TO BID
    // =====================================================
    this.registerToBidButton = page.getByRole("button", {
      name: "Register to Bid",
      exact: true,
    });

    // =====================================================
    // CONTRACT OF SALE
    // =====================================================
    this.contractOfSaleButton = page.getByRole("button", {
      name: /contract of sale/i,
    });

    this.contractReadButton = page.getByRole("button", {
      name: "I have read the Contract of Sale",
      exact: true,
    });

    // =====================================================
    // AUCTION TERMS
    // =====================================================
    this.auctionTermsButton = page.getByRole("button", {
      name: /auction terms and conditions/i,
    });

    this.auctionTermsReadButton = page.getByRole("button", {
      name: "I have read the Auction Terms and Conditions",
      exact: true,
    });

    // =====================================================
    // CHECKBOXES
    // =====================================================
    this.successfulBidderTermsCheckbox = page.locator(
      'input[name="acceptSuccessfulBidderTerms"]'
    );

    this.privacyPolicyCheckbox = page.locator(
      'input[name="acceptPrivacyPolicy"]'
    );

    // =====================================================
    // SIGNATURE
    // =====================================================
    this.signatureCanvas = page.locator(
      "canvas.cursor-crosshair"
    );

    // =====================================================
    // PREVIEW
    // =====================================================
    this.previewButton = page.getByRole("button", {
      name: "Preview",
      exact: true,
    });

    // =====================================================
    // SAVE / SUBMIT / CONFIRM
    //
    // Exact locator based on the current Preview DOM.
    // =====================================================
    this.saveButton = page.getByRole("button", {
      name: "Save",
      exact: true,
    });
  }

  // =====================================================
  // FIRST REGISTER -> NEW TAB
  // SECOND REGISTER -> SAME TAB FORM
  // =====================================================
  async openRegistration() {
    // -----------------------------------------------------
    // FIRST REGISTER TO BID
    // PROPERTY PAGE -> NEW TAB
    // -----------------------------------------------------
    await expect(
      this.registerToBidButton,
      "First Register to Bid button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.registerToBidButton
    ).toBeEnabled();

    console.log(
      "Clicking first Register to Bid..."
    );

    const context = this.page.context();

    const sourcePage = this.page;

    const [registrationTab] = await Promise.all([
      context.waitForEvent("page", {
        timeout: 20_000,
      }),

      this.registerToBidButton.click(),
    ]);

    await registrationTab.waitForLoadState(
      "domcontentloaded"
    );

    const registrationUrl =
      registrationTab.url();

    // -----------------------------------------------------
    // Playwright records one video per page.
    //
    // Continue registration on original scenario page so
    // the complete Agent/Buyer journey stays in one video.
    // -----------------------------------------------------
    await registrationTab.close();

    await sourcePage.goto(registrationUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });

    await sourcePage.bringToFront();

    this.setPage(sourcePage);

    console.log(
      `Auction registration opened on scenario page: ${this.page.url()}`
    );

    // -----------------------------------------------------
    // VERIFY AUCTION REGISTRATION URL
    // -----------------------------------------------------
    await expect
      .poll(
        () => this.page.url(),
        {
          message:
            "Auction registration URL should open",
          timeout: 20_000,
        }
      )
      .toMatch(
        /\/auction\/.*\/register\/?\?token=/i
      );

    // -----------------------------------------------------
    // SECOND REGISTER TO BID
    // SAME TAB -> REGISTRATION FORM
    // -----------------------------------------------------
    await expect(
      this.registerToBidButton,
      "Second Register to Bid button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.registerToBidButton
    ).toBeEnabled();

    console.log(
      "Clicking second Register to Bid..."
    );

    await this.registerToBidButton.click();

    console.log(
      "Second Register to Bid clicked"
    );

    // -----------------------------------------------------
    // WAIT FOR ACTUAL BIDDER REGISTRATION FORM
    // -----------------------------------------------------
    await expect(
      this.contractOfSaleButton,
      "Contract of Sale should be visible on bidder registration form"
    ).toBeVisible({
      timeout: 20_000,
    });

    console.log(
      "Bidder registration form opened successfully"
    );
  }

  // =====================================================
  // CONTRACT OF SALE MODAL
  // =====================================================
  async acceptContractOfSale() {
    await expect(
      this.contractOfSaleButton,
      "Contract of Sale button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    console.log(
      "Opening Contract of Sale..."
    );

    await this.contractOfSaleButton.click();

    await expect(
      this.contractReadButton,
      "Contract of Sale modal confirmation should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    console.log(
      "Contract of Sale modal opened"
    );

    await expect(
      this.contractReadButton
    ).toBeEnabled();

    await this.contractReadButton.click();

    console.log(
      "I have read the Contract of Sale clicked"
    );

    await expect(
      this.contractReadButton
    ).not.toBeVisible({
      timeout: 10_000,
    });

    console.log(
      "Contract of Sale accepted"
    );
  }

  // =====================================================
  // AUCTION TERMS MODAL
  // =====================================================
  async acceptAuctionTerms() {
    await expect(
      this.auctionTermsButton,
      "Auction Terms and Conditions button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    console.log(
      "Opening Auction Terms and Conditions..."
    );

    await this.auctionTermsButton.click();

    await expect(
      this.auctionTermsReadButton,
      "Auction Terms confirmation should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    console.log(
      "Auction Terms modal opened"
    );

    await expect(
      this.auctionTermsReadButton
    ).toBeEnabled();

    await this.auctionTermsReadButton.click();

    console.log(
      "I have read the Auction Terms and Conditions clicked"
    );

    await expect(
      this.auctionTermsReadButton
    ).not.toBeVisible({
      timeout: 10_000,
    });

    console.log(
      "Auction Terms accepted"
    );
  }

  // =====================================================
  // SUCCESSFUL BIDDER TERMS CHECKBOX
  // =====================================================
  async acceptSuccessfulBidderTerms() {
    await expect(
      this.successfulBidderTermsCheckbox,
      "Successful Bidder Terms checkbox should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await this.successfulBidderTermsCheckbox.check();

    await expect(
      this.successfulBidderTermsCheckbox
    ).toBeChecked();

    console.log(
      "Successful Bidder Terms accepted"
    );
  }

  // =====================================================
  // HELPER: DRAW ONE STROKE
  // =====================================================
  async drawStroke(points) {
    if (!points || points.length === 0) {
      return;
    }

    await this.page.mouse.move(
      points[0][0],
      points[0][1]
    );

    await this.page.mouse.down();

    for (
      let index = 1;
      index < points.length;
      index += 1
    ) {
      await this.page.mouse.move(
        points[index][0],
        points[index][1],
        {
          steps: 7,
        }
      );
    }

    await this.page.mouse.up();
  }

  // =====================================================
  // DRAW "SIAM" WITH MOUSE
  // =====================================================
  async drawSiamSignature() {
    await expect(
      this.signatureCanvas,
      "Bidder Signature canvas should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await this.signatureCanvas
      .scrollIntoViewIfNeeded();

    const box =
      await this.signatureCanvas.boundingBox();

    if (!box) {
      throw new Error(
        "Unable to get Bidder Signature canvas position."
      );
    }

    console.log(
      'Drawing bidder signature "SIAM"...'
    );

    const startX =
      box.x + Math.min(80, box.width * 0.08);

    const centerY =
      box.y + box.height / 2;

    const height =
      Math.min(55, box.height * 0.5);

    const width = 32;

    const gap = 22;

    // =================================================
    // S
    // =================================================
    let x = startX;

    await this.drawStroke([
      [x + width, centerY - height / 2],
      [x + 8, centerY - height / 2],
      [x, centerY - height / 4],
      [x + 6, centerY],
      [x + width - 6, centerY],
      [x + width, centerY + height / 4],
      [x + width - 8, centerY + height / 2],
      [x, centerY + height / 2],
    ]);

    // =================================================
    // I
    // =================================================
    x += width + gap;

    await this.drawStroke([
      [x, centerY - height / 2],
      [x, centerY + height / 2],
    ]);

    // =================================================
    // A
    // =================================================
    x += gap;

    await this.drawStroke([
      [x, centerY + height / 2],
      [x + width / 2, centerY - height / 2],
      [x + width, centerY + height / 2],
    ]);

    await this.drawStroke([
      [x + 7, centerY + 5],
      [x + width - 7, centerY + 5],
    ]);

    // =================================================
    // M
    // =================================================
    x += width + gap;

    await this.drawStroke([
      [x, centerY + height / 2],
      [x, centerY - height / 2],
      [x + width / 2, centerY + 5],
      [x + width, centerY - height / 2],
      [x + width, centerY + height / 2],
    ]);

    console.log(
      'Bidder signature "SIAM" completed'
    );
  }

  // =====================================================
  // DRAW "PAL" WITH MOUSE
  // =====================================================
  async drawPalSignature() {
    await expect(
      this.signatureCanvas,
      "Bidder Signature canvas should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await this.signatureCanvas
      .scrollIntoViewIfNeeded();

    const box =
      await this.signatureCanvas.boundingBox();

    if (!box) {
      throw new Error(
        "Unable to get Bidder Signature canvas position."
      );
    }

    console.log(
      'Drawing bidder signature "PAL"...'
    );

    const startX =
      box.x + Math.min(80, box.width * 0.08);

    const centerY =
      box.y + box.height / 2;

    const height =
      Math.min(55, box.height * 0.5);

    const width = 32;

    const gap = 22;

    let x = startX;

    // =================================================
    // P
    // =================================================
    await this.drawStroke([
      [x, centerY + height / 2],
      [x, centerY - height / 2],
      [x + width - 8, centerY - height / 2],
      [x + width, centerY - height / 3],
      [x + width, centerY - 5],
      [x + width - 8, centerY],
      [x, centerY],
    ]);

    // =================================================
    // A
    // =================================================
    x += width + gap;

    await this.drawStroke([
      [x, centerY + height / 2],
      [x + width / 2, centerY - height / 2],
      [x + width, centerY + height / 2],
    ]);

    await this.drawStroke([
      [x + 7, centerY + 5],
      [x + width - 7, centerY + 5],
    ]);

    // =================================================
    // L
    // =================================================
    x += width + gap;

    await this.drawStroke([
      [x, centerY - height / 2],
      [x, centerY + height / 2],
      [x + width, centerY + height / 2],
    ]);

    console.log(
      'Bidder signature "PAL" completed'
    );
  }

  // =====================================================
  // PRIVACY POLICY
  // =====================================================
  async acceptPrivacyPolicy() {
    await expect(
      this.privacyPolicyCheckbox,
      "Privacy Policy checkbox should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await this.privacyPolicyCheckbox.check();

    await expect(
      this.privacyPolicyCheckbox
    ).toBeChecked();

    console.log(
      "Privacy Policy accepted"
    );
  }

  // =====================================================
  // HELPER: FIND PREVIEW ACTION BUTTON
  // =====================================================
  getPreviewActionButton() {
    return this.page
      .getByRole("button")
      .filter({
        hasText:
          /save|submit|confirm|complete registration/i,
      })
      .last();
  }

  // =====================================================
  // HELPER: PRINT VISIBLE BUTTONS
  // =====================================================
  async printVisibleButtons() {
    const buttons =
      this.page.getByRole("button");

    const count =
      await buttons.count();

    console.log(
      `Total buttons found: ${count}`
    );

    for (
      let index = 0;
      index < count;
      index += 1
    ) {
      const button =
        buttons.nth(index);

      const visible =
        await button
          .isVisible()
          .catch(() => false);

      if (!visible) {
        continue;
      }

      const text =
        await button
          .innerText()
          .catch(() => "");

      console.log(
        `Visible button ${index + 1}: "${text.trim()}"`
      );
    }
  }

  // =====================================================
  // PREVIEW
  // SAME TAB
  // =====================================================
  async openPreview() {
    await expect(
      this.previewButton,
      "Preview button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.previewButton,
      "Preview button should be enabled"
    ).toBeEnabled({
      timeout: 20_000,
    });

    await this.previewButton
      .scrollIntoViewIfNeeded();

    console.log(
      "Clicking Preview..."
    );

    await this.previewButton.click();

    console.log(
      "Preview clicked"
    );

    // -----------------------------------------------------
    // Give React/UI time to render Preview
    // -----------------------------------------------------
    await this.page.waitForTimeout(1000);

    console.log(
      "Current URL after Preview:",
      this.page.url()
    );

    // -----------------------------------------------------
    // IMPORTANT:
    //
    // Re-create locator after Preview because the DOM may
    // have changed completely.
    // -----------------------------------------------------
    const previewActionButton =
      this.getPreviewActionButton();

    try {
      await expect(
        previewActionButton,
        "Save/Submit/Confirm button should appear on Preview screen"
      ).toBeVisible({
        timeout: 20_000,
      });

      await expect(
        previewActionButton,
        "Preview action button should be enabled"
      ).toBeEnabled({
        timeout: 10_000,
      });

      // Store actual working locator.
      this.saveButton =
        previewActionButton;

      const actionText =
        await previewActionButton
          .innerText()
          .catch(() => "");

      console.log(
        "Bidder registration Preview opened"
      );

      console.log(
        `Preview action button found: "${actionText.trim()}"`
      );
    } catch (error) {
      console.log(
        "====================================================="
      );

      console.log(
        "PREVIEW DEBUG INFORMATION"
      );

      console.log(
        "====================================================="
      );

      console.log(
        "Preview opened but Save/Submit/Confirm button was not detected."
      );

      console.log(
        "Current URL:",
        this.page.url()
      );

      // ---------------------------------------------------
      // Print every visible button.
      // This will tell us the developer's current text.
      // ---------------------------------------------------
      await this.printVisibleButtons();

      // ---------------------------------------------------
      // Print page text.
      // ---------------------------------------------------
      const bodyText =
        await this.page
          .locator("body")
          .innerText()
          .catch(() => "");

      console.log(
        "====================================================="
      );

      console.log(
        "PREVIEW PAGE TEXT"
      );

      console.log(
        "====================================================="
      );

      console.log(
        bodyText.substring(0, 3000)
      );

      console.log(
        "====================================================="
      );

      throw error;
    }
  }

  // =====================================================
  // SAVE REGISTRATION
  // =====================================================
  async saveRegistration() {
    let saveButton =
      this.saveButton;

    // -----------------------------------------------------
    // Verify stored locator is still available.
    // Preview UI may re-render.
    // -----------------------------------------------------
    let saveButtonVisible = false;

    if (saveButton) {
      saveButtonVisible =
        await saveButton
          .isVisible()
          .catch(() => false);
    }

    // -----------------------------------------------------
    // Find button again if necessary.
    // -----------------------------------------------------
    if (!saveButtonVisible) {
      console.log(
        "Stored Save button locator is not visible. Searching again..."
      );

      saveButton =
        this.getPreviewActionButton();
    }

    try {
      await expect(
        saveButton,
        "Bidder registration Save/Submit/Confirm button should be visible"
      ).toBeVisible({
        timeout: 20_000,
      });

      await expect(
        saveButton,
        "Bidder registration Save/Submit/Confirm button should be enabled"
      ).toBeEnabled({
        timeout: 20_000,
      });
    } catch (error) {
      console.log(
        "Unable to find registration Save/Submit/Confirm button."
      );

      console.log(
        "Current URL:",
        this.page.url()
      );

      await this.printVisibleButtons();

      throw error;
    }

    await saveButton
      .scrollIntoViewIfNeeded();

    const buttonText =
      await saveButton
        .innerText()
        .catch(() => "");

    console.log(
      `Clicking bidder registration action: "${buttonText.trim()}"`
    );

    await saveButton.click();

    console.log(
      "Bidder registration action clicked successfully"
    );

    // -----------------------------------------------------
    // Do NOT wait for bid input here.
    //
    // Buyer 1 and Buyer 2 can have different UI timing/state
    // after registration.
    // -----------------------------------------------------
    await this.page.waitForTimeout(1500);

    console.log(
      "Current page after bidder registration:",
      this.page.url()
    );
  }

  // =====================================================
  // COMPLETE BIDDER REGISTRATION
  // =====================================================
  async registerAsBidder(
    signatureName = "SIAM",
    screenshot = null
  ) {
    console.log(
      "===== BIDDER REGISTRATION START ====="
    );

    // =====================================================
    // OPEN REGISTRATION
    // =====================================================
    await this.openRegistration();

    if (screenshot) {
      await screenshot(
        "Bidder - Registration Form Opened",
        this.page
      );
    }

    // =====================================================
    // CONTRACT OF SALE
    // =====================================================
    await this.acceptContractOfSale();

    if (screenshot) {
      await screenshot(
        "Bidder - Contract Of Sale Accepted",
        this.page
      );
    }

    // =====================================================
    // AUCTION TERMS
    // =====================================================
    await this.acceptAuctionTerms();

    if (screenshot) {
      await screenshot(
        "Bidder - Auction Terms Accepted",
        this.page
      );
    }

    // =====================================================
    // SUCCESSFUL BIDDER TERMS
    // =====================================================
    await this.acceptSuccessfulBidderTerms();

    if (screenshot) {
      await screenshot(
        "Bidder - Successful Bidder Terms Accepted",
        this.page
      );
    }

    // =====================================================
    // SIGNATURE
    // =====================================================
    if (
      String(signatureName).toUpperCase() ===
      "PAL"
    ) {
      await this.drawPalSignature();
    } else {
      await this.drawSiamSignature();
    }

    // IMPORTANT:
    // Do not take any full-page screenshot after drawing the
    // signature and before Preview. In this UI, full-page
    // screenshot can cause the canvas signature to be cleared.
    // The next screenshot is taken only after Preview opens.

    // =====================================================
    // PRIVACY POLICY
    // =====================================================
    await this.acceptPrivacyPolicy();

    // =====================================================
    // PREVIEW
    // =====================================================
    await this.openPreview();

    if (screenshot) {
      await screenshot(
        "Bidder - Registration Preview",
        this.page
      );
    }

    // =====================================================
    // SAVE
    // =====================================================
    await this.saveRegistration();

    if (screenshot) {
      await screenshot(
        "Bidder - Registration Saved",
        this.page
      );
    }

    console.log(
      "===== BIDDER REGISTRATION COMPLETED ====="
    );

    return this.page;
  }
}

module.exports = {
  BidderRegisterPage,
};