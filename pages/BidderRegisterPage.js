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
    // PREVIEW + SAVE
    // =====================================================
    this.previewButton = page.getByRole("button", {
      name: "Preview",
      exact: true,
    });

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

    const [registrationTab] = await Promise.all([
      context.waitForEvent("page", {
        timeout: 20_000,
      }),
      this.registerToBidButton.click(),
    ]);

    await registrationTab.waitForLoadState(
      "domcontentloaded"
    );

    await registrationTab.bringToFront();

    // Switch page object to new tab
    this.setPage(registrationTab);

    console.log(
      `Auction registration tab opened: ${registrationTab.url()}`
    );

    // Verify we are on auction registration URL
    await expect
      .poll(
        () => this.page.url(),
        {
          message:
            "Auction registration URL should open",
          timeout: 20_000,
        }
      )
      .toMatch(/\/auction\/.*\/register\?token=/i);

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

    // Wait for actual bidder registration form
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
    ).toBeEnabled();

    console.log("Clicking Preview...");

    await this.previewButton.click();

    // Wait until Preview screen is ready
    await expect(
      this.saveButton,
      "Save button should appear on Preview screen"
    ).toBeVisible({
      timeout: 20_000,
    });

    console.log(
      "Bidder registration Preview opened"
    );
  }

  // =====================================================
  // SAVE
  // =====================================================
 async saveRegistration() {
  await expect(
    this.saveButton,
    "Save button should be visible"
  ).toBeVisible({
    timeout: 20_000,
  });

  await expect(
    this.saveButton,
    "Save button should be enabled"
  ).toBeEnabled();

  console.log(
    "Clicking bidder registration Save..."
  );

  await this.saveButton.click();

  console.log(
    "Bidder registration Save clicked successfully"
  );

  // Do NOT wait for the bid input here.
  // Buyer 1 and Buyer 2 can have different UI timing/state
  // after registration.
  await this.page.waitForTimeout(1500);

  console.log(
    "Current page after bidder registration Save:",
    this.page.url()
  );
}

  // =====================================================
  // COMPLETE BIDDER REGISTRATION
  // =====================================================
  async registerAsBidder() {
    console.log(
      "===== BIDDER REGISTRATION START ====="
    );

    // Property page -> new Auction registration tab
    // then second Register -> same-tab registration form
    await this.openRegistration();

    // Same registration tab
    await this.acceptContractOfSale();

    await this.acceptAuctionTerms();

    await this.acceptSuccessfulBidderTerms();

    await this.drawSiamSignature();

    await this.acceptPrivacyPolicy();

    // Same tab Preview
    await this.openPreview();

    // Save
    await this.saveRegistration();

    console.log(
      "===== BIDDER REGISTRATION COMPLETED ====="
    );

    // Important: return the active registration tab
    return this.page;
  }
}

module.exports = {
  BidderRegisterPage,
};
