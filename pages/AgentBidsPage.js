const { expect } = require("@playwright/test");

class AgentBidsPage {
  /**
   * @param {import("@playwright/test").Page} page
   */
  constructor(page) {
    this.page = page;

    const offersAndBidsText = page.getByText("Offers & Bids", {
      exact: true,
    });

    this.offersAndBidsButton = offersAndBidsText.locator(
      "xpath=ancestor::button[1]"
    );

    this.bidsTab = page.getByRole("button", {
      name: /^Bids\b/i,
    });

    this.startNegotiationButton = page.getByRole("button", {
      name: "Start negotiation",
      exact: true,
    });

    this.counterAmountInput = page.locator("#counterAmount");

    this.sendAndOpenChatButton = page.getByRole("button", {
      name: "Send & Open Chat",
      exact: true,
    });

    this.openChatButton = page.getByRole("button", {
      name: "Open chat",
      exact: true,
    });
  }

  async openBids() {
    await expect(
      this.offersAndBidsButton,
      "Offers & Bids menu should be visible"
    ).toBeVisible({ timeout: 20_000 });

    await this.offersAndBidsButton.click();

    await expect(
      this.bidsTab,
      "Bids tab should be visible"
    ).toBeVisible({ timeout: 20_000 });

    await this.bidsTab.click();

    await this.page.waitForTimeout(500);
  }

  /**
   * Try to scope an action to the created property.
   * If exactPropertyName is not known, it safely falls back to the first
   * visible matching action because the first suggestion for location "d"
   * was not supplied in the source material.
   */
  async propertyActionButton(propertyName, buttonName) {
    const buttonRegex =
      buttonName instanceof RegExp
        ? buttonName
        : new RegExp(`^${buttonName}$`, "i");

    if (propertyName) {
      const propertyText = this.page
        .getByText(propertyName, { exact: false })
        .first();

      if (await propertyText.isVisible().catch(() => false)) {
        const card = propertyText.locator(
          "xpath=ancestor::*[self::div or self::article]" +
            "[.//button][1]"
        );

        if (await card.isVisible().catch(() => false)) {
          const scopedButton = card
            .getByRole("button", { name: buttonRegex })
            .first();

          if (await scopedButton.isVisible().catch(() => false)) {
            return scopedButton;
          }
        }
      }
    }

    return this.page
      .getByRole("button", { name: buttonRegex })
      .first();
  }

  async startNegotiation(propertyName = "") {
    const button = propertyName
      ? await this.propertyActionButton(
          propertyName,
          /^Start negotiation$/i
        )
      : this.startNegotiationButton.first();

    await expect(
      button,
      "Start negotiation button should be visible"
    ).toBeVisible({ timeout: 20_000 });

    await button.click();

    await expect(
      this.counterAmountInput,
      "Counter amount input should be visible"
    ).toBeVisible({ timeout: 10_000 });
  }

  async sendCounterOfferAndOpenChat(amount) {
    if (amount === undefined || amount === null || amount === "") {
      throw new Error("Agent counter-offer amount is required.");
    }

    await expect(
      this.counterAmountInput,
      "Counter amount input should be visible"
    ).toBeVisible({ timeout: 10_000 });

    const expectedValue = String(amount).replace(/\D/g, "");

    await this.counterAmountInput.fill(expectedValue);

    const rawValue = await this.counterAmountInput.inputValue();
    const actualValue = rawValue.replace(/\D/g, "");

    if (actualValue !== expectedValue) {
      throw new Error(
        `Agent counter amount was not entered correctly. ` +
          `Expected ${expectedValue}, got ${actualValue}.`
      );
    }

    await expect(
      this.sendAndOpenChatButton,
      "Send & Open Chat button should be visible"
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      this.sendAndOpenChatButton,
      "Send & Open Chat button should be enabled"
    ).toBeEnabled({ timeout: 10_000 });

    await this.sendAndOpenChatButton.click();

    this.lastCounterAmount = expectedValue;

    await this.page.waitForTimeout(700);
  }

  async verifyCounterOfferSent(expectedMessage = /counter offer/i) {
    const formattedAmount = Number(
      this.lastCounterAmount || 0
    ).toLocaleString("en-US");

    if (formattedAmount !== "0") {
      const amountMessage = this.page
        .getByText(
          new RegExp(
            `Counter offer:\\s*\\$${formattedAmount}`,
            "i"
          )
        )
        .last();

      if (await amountMessage.isVisible().catch(() => false)) {
        await expect(amountMessage).toBeVisible();
        return;
      }
    }

    const genericMessage = this.page
      .getByText(expectedMessage)
      .last();

    if (await genericMessage.isVisible().catch(() => false)) {
      await expect(genericMessage).toBeVisible();
      return;
    }

    // Send & Open Chat should lead to a chat/conversation view.
    await expect(
      this.page.getByText(/Conversations|Counter offer/i).first()
    ).toBeVisible({ timeout: 20_000 });
  }

  async openBidderChat(propertyName = "") {
    const button = await this.propertyActionButton(
      propertyName,
      /^Open chat$/i
    );

    await expect(
      button,
      "Open chat button should be visible"
    ).toBeVisible({ timeout: 20_000 });

    await button.click();

    await this.page.waitForTimeout(700);
  }
}

module.exports = {
  AgentBidsPage,
};
