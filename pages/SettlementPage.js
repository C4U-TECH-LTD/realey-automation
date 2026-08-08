const { expect } = require("@playwright/test");

class SettlementPage {
  constructor(page) {
    this.page = page;

    this.settlementHeading =
      page.getByRole("heading", {
        name: "Property Settlement Process",
        exact: true,
      });

    this.continueButton =
      page.getByRole("button", {
        name: "Continue",
        exact: true,
      }).last();

    this.solicitorHeading =
      page.getByRole("heading", {
        name: "Invite Your Solicitor",
        exact: true,
      });

    this.browseSolicitorsButton =
      page.getByRole("button", {
        name: /Browse Available Solicitors/i,
      });

    this.brokerHeading =
      page.getByRole("heading", {
        name: "Invite Your Mortgage Broker",
        exact: true,
      });

    this.browseBrokersButton =
      page.getByRole("button", {
        name: /Browse Available Brokers/i,
      });

    this.professionalSearchInput =
      page.getByPlaceholder(
        "Search by name, company, or specialization...",
        { exact: true }
      );

    this.depositHeading =
      page.getByRole("heading", {
        name: "Deposit Payment",
        exact: true,
      });
  }

  async start() {
    await expect(
      this.settlementHeading,
      "Property Settlement Process should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.continueButton
    ).toBeVisible();

    await this.continueButton.click();

    await expect(
      this.solicitorHeading,
      "Invite Your Solicitor step should open"
    ).toBeVisible({
      timeout: 20_000,
    });
  }

  async selectSolicitor(searchText) {
    await expect(
      this.browseSolicitorsButton
    ).toBeVisible();

    await this.browseSolicitorsButton.click();

    await expect(
      this.professionalSearchInput
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
          { name: "Select", exact: true }
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
      this.continueButton
    ).toBeVisible();

    await this.continueButton.click();

    await expect(
      this.brokerHeading,
      "Invite Your Mortgage Broker step should open"
    ).toBeVisible({
      timeout: 20_000,
    });
  }

  async selectBroker(searchText) {
    await expect(
      this.browseBrokersButton
    ).toBeVisible();

    await this.browseBrokersButton.click();

    await expect(
      this.professionalSearchInput
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
          { name: "Select", exact: true }
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

    await this.continueButton.click();

    await expect(
      this.depositHeading,
      "Deposit Payment step should open"
    ).toBeVisible({
      timeout: 20_000,
    });
  }

  async findPaymentFrame() {
    const frames = this.page.frames();

    for (const frame of frames) {
      const numberInput =
        frame.locator(
          '#payment-numberInput, input[name="number"]'
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

  async payDeposit(payment) {
    await expect(
      this.depositHeading
    ).toBeVisible({
      timeout: 20_000,
    });

    const frame =
      await this.findPaymentFrame();

    const cardNumber = frame.locator(
      '#payment-numberInput, input[name="number"]'
    );

    const expiry = frame.locator(
      '#payment-expiryInput, input[name="expiry"]'
    );

    const cvc = frame.locator(
      '#payment-cvcInput, input[name="cvc"]'
    );

    await expect(cardNumber).toBeVisible();
    await cardNumber.fill(
      String(payment.cardNumber)
    );

    await expect(expiry).toBeVisible();
    await expiry.fill(
      String(payment.expiry)
    );

    await expect(cvc).toBeVisible();
    await cvc.fill(
      String(payment.cvc)
    );

    const submitCandidates = [
      this.page.locator('button[type="submit"]').last(),
      frame.locator('button[type="submit"]').last(),
    ];

    let clicked = false

    for (const button of submitCandidates) {
      if (
        await button
          .isVisible()
          .catch(() => false)
      ) {
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

  async verifyPaymentSuccessful(expectedMessage) {
    await expect(
      this.page.getByText(
        expectedMessage
      ).first(),
      "Payment Successful toast should appear"
    ).toBeVisible({
      timeout: 30_000,
    });
  }

  async completeSettlement() {
    /*
     * Final Complete Settlement control was not supplied.
     * Keep this explicit rather than inventing a locator.
     */
    throw new Error(
      "Complete Settlement locator is not configured yet. " +
      "Add the final Complete Settlement button/page outerHTML."
    );
  }
}

module.exports = {
  SettlementPage,
};
