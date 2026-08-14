const { expect } = require("@playwright/test");

class SettlementPage {
  constructor(page) {
    this.page = page;

    // =====================================================
    // COMMON SETTLEMENT
    // =====================================================

    this.settlementHeading =
      page.getByRole("heading", {
        name: "Property Settlement Process",
        exact: true,
      });

    this.continueButton =
      page
        .getByRole("button", {
          name: "Continue",
          exact: true,
        })
        .last();

    // =====================================================
    // SOLICITOR
    // =====================================================

    this.solicitorHeading =
      page.getByRole("heading", {
        name: "Invite Your Solicitor",
        exact: true,
      });

    this.browseSolicitorsButton =
      page.getByRole("button", {
        name: /Browse Available Solicitors/i,
      });

    // =====================================================
    // BROKER
    // =====================================================

    this.brokerHeading =
      page.getByRole("heading", {
        name: "Invite Your Mortgage Broker",
        exact: true,
      });

    this.browseBrokersButton =
      page.getByRole("button", {
        name: /Browse Available Brokers/i,
      });

    // =====================================================
    // PROFESSIONAL SEARCH
    // =====================================================

    this.professionalSearchInput =
      page.getByPlaceholder(
        "Search by name, company, or specialization...",
        {
          exact: true,
        }
      );

    // =====================================================
    // DEPOSIT
    // =====================================================

    this.depositHeading =
      page.getByRole("heading", {
        name: "Deposit Payment",
        exact: true,
      });
  }



  // =====================================================
  // FIXED / OFFER FLOW
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

    await this.professionalSearchInput.fill(
      searchText
    );

    const result = this.page
      .locator("div")
      .filter({
        hasText: searchText,
      })
      .filter({
        has: this.page.getByRole(
          "button",
          {
            name: "Select",
            exact: true,
          }
        ),
      })
      .first();

    const select = result.getByRole(
      "button",
      {
        name: "Select",
        exact: true,
      }
    );

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

  async selectBroker(searchText) {
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
        has: this.page.getByRole(
          "button",
          {
            name: "Select",
            exact: true,
          }
        ),
      })
      .first();

    const select = result.getByRole(
      "button",
      {
        name: "Select",
        exact: true,
      }
    );

    await expect(
      select,
      `Broker "${searchText}" Select button should be visible`
    ).toBeVisible({
      timeout: 20_000,
    });

    await select.click();

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
  }

  // =====================================================
  // FIND PAYMENT FRAME
  // FIXED / OFFER
  // =====================================================

  async findPaymentFrame() {
    const frames = this.page.frames();

    for (const frame of frames) {
      const numberInput =
        frame.locator(
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

  await expect(cardNumber).toBeVisible({
    timeout: 20_000,
  });

  await cardNumber.fill(
    String(payment.cardNumber)
  );

  await expect(expiry).toBeVisible({
    timeout: 20_000,
  });

  await expiry.fill(
    String(payment.expiry)
  );

  await expect(cvc).toBeVisible({
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
      await expect(button).toBeEnabled({
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
  // FIXED / OFFER PAYMENT
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

    const cardNumber =
      frame.locator(
        '#payment-numberInput, input[name="number"], input[aria-label="Card number"]'
      );

    const expiry =
      frame.locator(
        '#payment-expiryInput, input[name="expiry"], input[aria-label="Expiration date"]'
      );

    const cvc =
      frame.locator(
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
  //
  // Waits until real Stripe card inputs are mounted.
  // Checks:
  // 1. Main page
  // 2. All iframes
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
      // CHECK MAIN PAGE
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
      // CHECK ALL FRAMES
      // ===============================================

      for (
        const frame of this.page.frames()
      ) {
        const card =
          frame.locator(
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

    // Wait for actual payment UI
    const paymentRoot =
      await this.findAuctionPaymentRoot(
        45_000
      );

    // =================================================
    // CARD NUMBER
    // =================================================

    const cardNumber =
      paymentRoot.locator(
        '#payment-numberInput, input[name="number"], input[aria-label="Card number"]'
      );

    // =================================================
    // EXPIRY
    // =================================================

    const expiry =
      paymentRoot.locator(
        '#payment-expiryInput, input[name="expiry"], input[aria-label="Expiration date"]'
      );

    // =================================================
    // CVC
    // =================================================

    const cvc =
      paymentRoot.locator(
        '#payment-cvcInput, input[name="cvc"], input[aria-label="Security code"]'
      );

    // =================================================
    // FILL CARD NUMBER
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
    // FILL EXPIRATION DATE
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
    // FILL CVC
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
    //
    // Examples:
    // Pay $375,000 AUD
    // Pay $32,500 AUD
    // Pay $1,000.00 AUD
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

  // =====================================================
  // COMPLETE SETTLEMENT
  // =====================================================

  async completeSettlement() {
    throw new Error(
      "Complete Settlement locator is not configured yet. " +
        "Add the final Complete Settlement button/page outerHTML."
    );
  }
}

module.exports = {
  SettlementPage,
};