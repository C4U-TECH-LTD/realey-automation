const { expect } = require("@playwright/test");

class SettlementPage {
  constructor(page) {
    this.page = page;

    // =====================================================
    // COMMON SETTLEMENT
    // =====================================================

    this.settlementHeading = page.getByRole("heading", {
      name: "Property Settlement Process",
      exact: true,
    });

    this.continueButton = page
      .getByRole("button", {
        name: "Continue",
        exact: true,
      })
      .last();

    // =====================================================
    // SOLICITOR
    // =====================================================

    this.solicitorHeading = page.getByRole("heading", {
      name: "Invite Your Solicitor",
      exact: true,
    });

    this.browseSolicitorsButton = page.getByRole("button", {
      name: /Browse Available Solicitors/i,
    });

    // =====================================================
    // BROKER
    // =====================================================

    this.brokerHeading = page.getByRole("heading", {
      name: "Invite Your Mortgage Broker",
      exact: true,
    });

    this.browseBrokersButton = page.getByRole("button", {
      name: /Browse Available Brokers/i,
    });

    // =====================================================
    // PROFESSIONAL SEARCH
    // =====================================================

    this.professionalSearchInput = page.getByPlaceholder(
      "Search by name, company, or specialization...",
      {
        exact: true,
      }
    );

    // =====================================================
    // DEPOSIT
    // =====================================================

    this.depositHeading = page.getByRole("heading", {
      name: "Deposit Payment",
      exact: true,
    });
  }

  // =====================================================
  // COMMON FIXED / OFFER SETTLEMENT START
  // =====================================================

  async start() {
    await expect(
      this.settlementHeading,
      "Property Settlement Process should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.continueButton,
      "Settlement Continue button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.continueButton,
      "Settlement Continue button should be enabled"
    ).toBeEnabled({
      timeout: 20_000,
    });

    await this.continueButton.click();

    await expect(
      this.solicitorHeading,
      "Invite Your Solicitor step should open"
    ).toBeVisible({
      timeout: 20_000,
    });
  }

  // =====================================================
  // SELECT SOLICITOR
  // =====================================================

  async selectSolicitor(searchText) {
    await expect(
      this.browseSolicitorsButton,
      "Browse Available Solicitors button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await this.browseSolicitorsButton.click();

    await expect(
      this.professionalSearchInput,
      "Professional search input should be visible"
    ).toBeVisible({
      timeout: 10_000,
    });

    await this.professionalSearchInput.fill(searchText);

    const result = this.page
      .locator("div")
      .filter({
        hasText: searchText,
      })
      .filter({
        has: this.page.getByRole("button", {
          name: "Select",
          exact: true,
        }),
      })
      .first();

    const select = result.getByRole("button", {
      name: "Select",
      exact: true,
    });

    await expect(
      select,
      `Solicitor "${searchText}" Select button should be visible`
    ).toBeVisible({
      timeout: 20_000,
    });

    await select.click();

    await expect(
      this.continueButton,
      "Continue button should be visible after solicitor selection"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.continueButton,
      "Continue button should be enabled after solicitor selection"
    ).toBeEnabled({
      timeout: 20_000,
    });

    await this.continueButton.click();

    await expect(
      this.brokerHeading,
      "Invite Your Mortgage Broker step should open"
    ).toBeVisible({
      timeout: 20_000,
    });
  }

  // =====================================================
  // SELECT BROKER
  // =====================================================

  async selectBroker(
  searchText,
  {
    expectDeposit = true,
  } = {}
) {
  console.log(
    `Selecting Mortgage Broker: ${searchText}`
  );

  await expect(
    this.browseBrokersButton,
    "Browse Available Brokers button should be visible"
  ).toBeVisible({
    timeout: 20_000,
  });

  await this.browseBrokersButton.click();

  await expect(
    this.professionalSearchInput,
    "Professional search input should be visible"
  ).toBeVisible({
    timeout: 10_000,
  });

  await this.professionalSearchInput.fill(
    searchText
  );

  const result = this.page
    .locator("div")
    .filter({
      hasText: searchText,
    })
    .filter({
      has: this.page.getByRole("button", {
        name: "Select",
        exact: true,
      }),
    })
    .first();

  const selectButton =
    result.getByRole("button", {
      name: "Select",
      exact: true,
    });

  await expect(
    selectButton,
    `Broker "${searchText}" Select button should be visible`
  ).toBeVisible({
    timeout: 20_000,
  });

  await selectButton.click();

  console.log(
    `Mortgage Broker selected: ${searchText}`
  );

  // ================================================
  // OFFER / FIXED PRICE
  // Broker -> Continue -> Deposit Payment
  // ================================================

  if (expectDeposit) {
    await expect(
      this.continueButton,
      "Continue button should be visible after broker selection"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.continueButton,
      "Continue button should be enabled after broker selection"
    ).toBeEnabled({
      timeout: 20_000,
    });

    await this.continueButton.click();

    await expect(
      this.depositHeading,
      "Deposit Payment step should open"
    ).toBeVisible({
      timeout: 20_000,
    });

    console.log(
      "Broker completed -> Deposit Payment opened"
    );

    return;
  }

  // ================================================
  // AUCTION FLOW 3 / FLOW 4
  // Deposit already paid
  // Broker -> Complete Setup
  // ================================================

  const completeSetupButton =
    this.page.getByRole("button", {
      name: "Complete Setup",
      exact: true,
    });

  await expect(
    completeSetupButton,
    "Complete Setup button should be visible after broker selection"
  ).toBeVisible({
    timeout: 20_000,
  });

  await expect(
    completeSetupButton,
    "Complete Setup button should be enabled"
  ).toBeEnabled({
    timeout: 20_000,
  });

  await completeSetupButton.click();

  console.log(
    "Auction Complete Setup clicked"
  );

  await this.page.waitForTimeout(700);
}

  // =====================================================
  // OLD COMMON PAYMENT FRAME
  //
  // Kept because your existing code may still reference it.
  // =====================================================

  async findPaymentFrame() {
    const frames = this.page.frames();

    for (const frame of frames) {
      const numberInput = frame.locator(
        '#payment-numberInput, input[name="number"], input[aria-label="Card number"]'
      );

      if (
        await numberInput
          .isVisible()
          .catch(() => false)
      ) {
        return frame;
      }
    }

    throw new Error(
      "Stripe payment iframe with card fields was not found."
    );
  }

  // =====================================================
  // OFFER PRICE PAYMENT FRAME
  //
  // KEEP OFFER FLOW SEPARATE
  // =====================================================

  async findOfferPaymentFrame(timeoutMs = 45_000) {
    console.log(
      "Waiting for Offer Price Stripe payment fields..."
    );

    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      for (const frame of this.page.frames()) {
        const cardNumber = frame.locator(
          '#payment-numberInput, input[name="number"], input[aria-label="Card number"]'
        );

        if (
          await cardNumber
            .isVisible()
            .catch(() => false)
        ) {
          console.log(
            "Offer Price payment frame found:",
            frame.url()
          );

          return frame;
        }
      }

      await this.page.waitForTimeout(500);
    }

    throw new Error(
      "Offer Price Stripe payment fields did not load within 45 seconds."
    );
  }

  // =====================================================
  // OFFER PRICE PAYMENT
  // =====================================================

  async payOfferDeposit(payment) {
    await expect(
      this.depositHeading,
      "Offer Price Deposit Payment should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    const frame =
      await this.findOfferPaymentFrame();

    const cardNumber = frame.locator(
      '#payment-numberInput, input[name="number"], input[aria-label="Card number"]'
    );

    const expiry = frame.locator(
      '#payment-expiryInput, input[name="expiry"], input[aria-label="Expiration date"]'
    );

    const cvc = frame.locator(
      '#payment-cvcInput, input[name="cvc"], input[aria-label="Security code"]'
    );

    await expect(
      cardNumber,
      "Offer Price card number should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await cardNumber.fill(
      String(payment.cardNumber)
    );

    await expect(
      expiry,
      "Offer Price expiration date should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expiry.fill(
      String(payment.expiry)
    );

    await expect(
      cvc,
      "Offer Price CVC should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await cvc.fill(
      String(payment.cvc)
    );

    const submitCandidates = [
      this.page
        .locator('button[type="submit"]')
        .last(),

      frame
        .locator('button[type="submit"]')
        .last(),
    ];

    for (const button of submitCandidates) {
      if (
        await button
          .isVisible()
          .catch(() => false)
      ) {
        await expect(
          button,
          "Offer Price payment button should be enabled"
        ).toBeEnabled({
          timeout: 20_000,
        });

        await button.click();

        console.log(
          "Offer Price deposit submitted"
        );

        return;
      }
    }

    throw new Error(
      "Offer Price payment submit button was not found."
    );
  }

  // =====================================================
  // FIXED PRICE PAYMENT FRAME
  //
  // NEW FIX:
  // Fixed Price waits for Stripe to load instead of
  // checking the frame only one time.
  // =====================================================

  async findFixedPaymentFrame(
    timeoutMs = 45_000
  ) {
    console.log(
      "Waiting for Fixed Price Stripe payment fields..."
    );

    const startedAt = Date.now();

    while (
      Date.now() - startedAt < timeoutMs
    ) {
      const frames = this.page.frames();

      for (const frame of frames) {
        const cardNumber = frame.locator(
          '#payment-numberInput, input[name="number"], input[aria-label="Card number"]'
        );

        if (
          await cardNumber
            .isVisible()
            .catch(() => false)
        ) {
          console.log(
            "Fixed Price payment frame found:",
            frame.url()
          );

          return frame;
        }
      }

      await this.page.waitForTimeout(500);
    }

    console.log(
      "Fixed Price payment fields did not appear."
    );

    console.log(
      "Available frames:"
    );

    for (const frame of this.page.frames()) {
      console.log(
        "-",
        frame.url()
      );
    }

    throw new Error(
      `Fixed Price Stripe payment fields did not load within ${timeoutMs}ms.`
    );
  }

  // =====================================================
  // FIXED PRICE PAYMENT
  //
  // ONLY Fixed Price should call this method.
  // =====================================================

  async payFixedDeposit(payment) {
    await expect(
      this.depositHeading,
      "Fixed Price Deposit Payment should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    if (!payment) {
      throw new Error(
        "Fixed Price payment configuration is missing."
      );
    }

    if (!payment.cardNumber) {
      throw new Error(
        "Fixed Price card number is missing."
      );
    }

    if (!payment.expiry) {
      throw new Error(
        "Fixed Price expiry is missing."
      );
    }

    if (!payment.cvc) {
      throw new Error(
        "Fixed Price CVC is missing."
      );
    }

    const frame =
      await this.findFixedPaymentFrame(
        45_000
      );

    const cardNumber = frame.locator(
      '#payment-numberInput, input[name="number"], input[aria-label="Card number"]'
    );

    const expiry = frame.locator(
      '#payment-expiryInput, input[name="expiry"], input[aria-label="Expiration date"]'
    );

    const cvc = frame.locator(
      '#payment-cvcInput, input[name="cvc"], input[aria-label="Security code"]'
    );

    // =================================================
    // CARD NUMBER
    // =================================================

    await expect(
      cardNumber,
      "Fixed Price Card Number field should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await cardNumber.click();

    await cardNumber.fill(
      String(payment.cardNumber)
    );

    console.log(
      "Fixed Price Card Number entered"
    );

    // =================================================
    // EXPIRY
    // =================================================

    await expect(
      expiry,
      "Fixed Price Expiration Date field should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expiry.click();

    await expiry.fill(
      String(payment.expiry)
    );

    console.log(
      "Fixed Price Expiration Date entered"
    );

    // =================================================
    // CVC
    // =================================================

    await expect(
      cvc,
      "Fixed Price CVC field should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await cvc.click();

    await cvc.fill(
      String(payment.cvc)
    );

    console.log(
      "Fixed Price CVC entered"
    );

    // =================================================
    // PAYMENT BUTTON
    // =================================================

    const submitCandidates = [
      this.page
        .locator('button[type="submit"]')
        .last(),

      frame
        .locator('button[type="submit"]')
        .last(),
    ];

    for (const button of submitCandidates) {
      const visible =
        await button
          .isVisible()
          .catch(() => false);

      if (!visible) {
        continue;
      }

      await expect(
        button,
        "Fixed Price payment button should be enabled"
      ).toBeEnabled({
        timeout: 20_000,
      });

      const buttonText =
        await button
          .innerText()
          .catch(() => "Payment button");

      console.log(
        "Fixed Price payment button:",
        buttonText
      );

      await button.click();

      console.log(
        "Fixed Price deposit submitted"
      );

      return;
    }

    throw new Error(
      "Fixed Price payment submit button was not found."
    );
  }

  // =====================================================
  // LEGACY COMMON PAYMENT
  //
  // KEEP FOR COMPATIBILITY.
  // Fixed Price should now use payFixedDeposit().
  // Offer should use payOfferDeposit().
  // =====================================================

  async payDeposit(payment) {
    await expect(
      this.depositHeading,
      "Deposit Payment heading should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    const frame =
      await this.findPaymentFrame();

    const cardNumber = frame.locator(
      '#payment-numberInput, input[name="number"], input[aria-label="Card number"]'
    );

    const expiry = frame.locator(
      '#payment-expiryInput, input[name="expiry"], input[aria-label="Expiration date"]'
    );

    const cvc = frame.locator(
      '#payment-cvcInput, input[name="cvc"], input[aria-label="Security code"]'
    );

    await expect(
      cardNumber,
      "Card Number field should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await cardNumber.fill(
      String(payment.cardNumber)
    );

    await expect(
      expiry,
      "Expiration Date field should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expiry.fill(
      String(payment.expiry)
    );

    await expect(
      cvc,
      "CVC field should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await cvc.fill(
      String(payment.cvc)
    );

    const submitCandidates = [
      this.page
        .locator('button[type="submit"]')
        .last(),

      frame
        .locator('button[type="submit"]')
        .last(),
    ];

    let clicked = false;

    for (const button of submitCandidates) {
      if (
        await button
          .isVisible()
          .catch(() => false)
      ) {
        await expect(
          button,
          "Deposit payment button should be enabled"
        ).toBeEnabled({
          timeout: 20_000,
        });

        await button.click();

        clicked = true;

        break;
      }
    }

    if (!clicked) {
      throw new Error(
        "Deposit payment submit button was not found."
      );
    }
  }

  // =====================================================
  // AUCTION SETTLEMENT
  // =====================================================

  async waitForAuctionSettlement() {
    console.log(
      "Waiting for Auction Property Settlement Process..."
    );

    await expect(
      this.settlementHeading,
      "Auction Property Settlement Process should be visible"
    ).toBeVisible({
      timeout: 30_000,
    });

    console.log(
      "Auction Property Settlement Process opened automatically"
    );

    console.log(
      "Auction settlement URL:",
      this.page.url()
    );
  }

  // =====================================================
  // FIND AUCTION PAYMENT ROOT
  // =====================================================

  async findAuctionPaymentRoot(
    timeoutMs = 45_000
  ) {
    console.log(
      "Waiting for Auction Stripe payment fields..."
    );

    const startedAt = Date.now();

    while (
      Date.now() - startedAt <
      timeoutMs
    ) {
      // ===============================================
      // MAIN PAGE
      // ===============================================

      const mainCard =
        this.page.locator(
          '#payment-numberInput, input[name="number"], input[aria-label="Card number"]'
        );

      if (
        await mainCard
          .isVisible()
          .catch(() => false)
      ) {
        console.log(
          "Auction payment fields found on main page"
        );

        return this.page;
      }

      // ===============================================
      // IFRAMES
      // ===============================================

      for (
        const frame of this.page.frames()
      ) {
        const card = frame.locator(
          '#payment-numberInput, input[name="number"], input[aria-label="Card number"]'
        );

        if (
          await card
            .isVisible()
            .catch(() => false)
        ) {
          console.log(
            "Auction payment fields found inside iframe:",
            frame.url()
          );

          return frame;
        }
      }

      await this.page.waitForTimeout(500);
    }

    console.log(
      "Auction payment fields did not appear."
    );

    console.log(
      "Available frames:"
    );

    for (
      const frame of this.page.frames()
    ) {
      console.log(
        "-",
        frame.url()
      );
    }

    throw new Error(
      `Auction Stripe card fields did not load within ${timeoutMs}ms.`
    );
  }

  // =====================================================
  // AUCTION PAYMENT
  // =====================================================

  async payAuctionDeposit(payment) {
    await this.waitForAuctionSettlement();

    if (!payment) {
      throw new Error(
        "Auction payment configuration is missing."
      );
    }

    if (!payment.cardNumber) {
      throw new Error(
        "Auction payment card number is missing."
      );
    }

    if (!payment.expiry) {
      throw new Error(
        "Auction payment expiry is missing."
      );
    }

    if (!payment.cvc) {
      throw new Error(
        "Auction payment CVC is missing."
      );
    }

    const paymentRoot =
      await this.findAuctionPaymentRoot(
        45_000
      );

    const cardNumber =
      paymentRoot.locator(
        '#payment-numberInput, input[name="number"], input[aria-label="Card number"]'
      );

    const expiry =
      paymentRoot.locator(
        '#payment-expiryInput, input[name="expiry"], input[aria-label="Expiration date"]'
      );

    const cvc =
      paymentRoot.locator(
        '#payment-cvcInput, input[name="cvc"], input[aria-label="Security code"]'
      );

    // =================================================
    // CARD NUMBER
    // =================================================

    await expect(
      cardNumber,
      "Auction Card Number field should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await cardNumber.click();

    await cardNumber.fill(
      String(payment.cardNumber)
    );

    console.log(
      "Auction Card Number entered"
    );

    // =================================================
    // EXPIRY
    // =================================================

    await expect(
      expiry,
      "Auction Expiration Date field should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expiry.click();

    await expiry.fill(
      String(payment.expiry)
    );

    console.log(
      "Auction Expiration Date entered"
    );

    // =================================================
    // CVC
    // =================================================

    await expect(
      cvc,
      "Auction Security Code field should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await cvc.click();

    await cvc.fill(
      String(payment.cvc)
    );

    console.log(
      "Auction CVC entered"
    );

    // =================================================
    // PAY BUTTON
    // =================================================

    const payButtonRegex =
      /^Pay\s+\$[\d,]+(?:\.\d{1,2})?\s+AUD$/i;

    const pagePayButton =
      this.page.getByRole(
        "button",
        {
          name: payButtonRegex,
        }
      );

    let payButton =
      pagePayButton;

    const pagePayVisible =
      await pagePayButton
        .isVisible()
        .catch(() => false);

    if (!pagePayVisible) {
      payButton =
        paymentRoot.getByRole(
          "button",
          {
            name: payButtonRegex,
          }
        );
    }

    await expect(
      payButton,
      "Auction Pay button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      payButton,
      "Auction Pay button should be enabled"
    ).toBeEnabled({
      timeout: 20_000,
    });

    const buttonText =
      await payButton
        .innerText()
        .catch(() => "Pay");

    console.log(
      "Auction Pay button:",
      buttonText
    );

    console.log(
      "Clicking Auction Pay button..."
    );

    await payButton.click();

    console.log(
      "Auction deposit Pay button clicked"
    );
  }

  // =====================================================
  // AUCTION PAYMENT SUCCESS
  // =====================================================

  async verifyAuctionPaymentSuccessful() {
    console.log(
      "Waiting for Auction Payment Successful message..."
    );

    await expect(
      this.page
        .getByText(
          "Payment Successful",
          {
            exact: true,
          }
        )
        .first(),
      "Auction Payment Successful message should appear"
    ).toBeVisible({
      timeout: 30_000,
    });

    console.log(
      "Auction deposit payment successful"
    );
  }

  // =====================================================
  // AUCTION POST-PAYMENT CONTINUE
  //
  // Auction order:
  // Payment Successful
  // -> Continue
  // -> Personal Details
  // -> Continue
  // -> Solicitor
  // -> Broker
  // =====================================================

  async continueAfterAuctionPayment() {
    console.log(
      "Waiting for Auction Payment Successful before Continue..."
    );

    await this.verifyAuctionPaymentSuccessful();

    await expect(
      this.continueButton,
      "Continue button should be visible after Auction payment"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.continueButton,
      "Continue button should be enabled after Auction payment"
    ).toBeEnabled({
      timeout: 20_000,
    });

    await this.continueButton.click();

    console.log(
      "Auction payment Continue clicked"
    );

    const personalDetails = this.page
      .getByText("Personal Details", {
        exact: true,
      })
      .first();

    await expect(
      personalDetails,
      "Personal Details should open after Auction payment Continue"
    ).toBeVisible({
      timeout: 20_000,
    });
  }

  async continueAuctionPersonalDetails() {
    const personalDetails = this.page
      .getByText("Personal Details", {
        exact: true,
      })
      .first();

    await expect(
      personalDetails,
      "Personal Details should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.continueButton,
      "Personal Details Continue button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.continueButton,
      "Personal Details Continue button should be enabled"
    ).toBeEnabled({
      timeout: 20_000,
    });

    await this.continueButton.click();

    console.log(
      "Auction Personal Details Continue clicked"
    );

    await expect(
      this.solicitorHeading,
      "Invite Your Solicitor should open after Personal Details"
    ).toBeVisible({
      timeout: 20_000,
    });
  }

  // =====================================================
  // FIXED / OFFER PAYMENT SUCCESS
  // =====================================================

  async verifyPaymentSuccessful(
    expectedMessage
  ) {
    await expect(
      this.page
        .getByText(
          expectedMessage
        )
        .first(),
      "Payment Successful toast should appear"
    ).toBeVisible({
      timeout: 30_000,
    });
  }


  async completeSettlement() {
  const completeButton = this.page.getByRole("button", {
    name: /Complete Settlement/i,
  }).last();

  await expect(
    completeButton,
    "Complete Settlement button should be visible"
  ).toBeVisible({
    timeout: 30_000,
  });

  await expect(
    completeButton,
    "Complete Settlement button should be enabled"
  ).toBeEnabled({
    timeout: 20_000,
  });

  await completeButton.click();

  // Support an optional confirmation modal without forcing one.
  const dialog = this.page.getByRole("dialog").last();

  if (await dialog.isVisible().catch(() => false)) {
    const confirm = dialog.getByRole("button", {
      name: /Confirm|Complete|Yes/i,
    }).last();

    if (await confirm.isVisible().catch(() => false)) {
      await confirm.click();
    }
  }

  await this.page.waitForTimeout(700);
}

async verifySettlementCompleted(
  expectedMessage = /Settlement Complete|Settlement Completed|Completed/i
) {
  const message = this.page
    .getByText(expectedMessage)
    .last();

  if (await message.isVisible().catch(() => false)) {
    await expect(message).toBeVisible();
    return;
  }

  const completeButton = this.page.getByRole("button", {
    name: /Complete Settlement/i,
  }).last();

  await expect(
    completeButton,
    "Complete Settlement button should disappear after completion"
  ).not.toBeVisible({
    timeout: 20_000,
  });
}

}

module.exports = {
  SettlementPage,
};
