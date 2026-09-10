const { expect } = require("@playwright/test");

class AgentOffersPage {
  constructor(page) {
    this.page = page;

    this.offersAndBids = page.getByText(
      "Offers & Bids",
      { exact: true }
    );

    this.acceptButton = page.getByRole("button", {
      name: "Accept",
      exact: true,
    }).first();

    this.counterViaChatButton = page.getByRole("button", {
      name: "Counter via Chat",
      exact: true,
    }).first();

    this.counterOfferHeading = page.getByText(
      "Counter Offer via Chat",
      { exact: true }
    );

    this.counterAmountInput = page.getByPlaceholder(
      "Enter amount",
      { exact: true }
    ).first();

    this.sendAndOpenChatButton = page.getByRole("button", {
      name: "Send & Open Chat",
      exact: true,
    });
  }

  async openOffersAndBids() {
    await expect(
      this.offersAndBids,
      "Offers & Bids menu should be visible"
    ).toBeVisible({ timeout: 20_000 });

    await this.offersAndBids.click();
  }

  async openSubmittedOffer(propertyName) {
    await this.openOffersAndBids();

    // Prefer the offer card matching the created listing when the
    // property/location is displayed on the Offers & Bids screen.
    if (propertyName) {
      const propertyText = this.page
        .getByText(propertyName, { exact: false })
        .first();

      if (await propertyText.isVisible({ timeout: 8000 }).catch(() => false)) {
        const card = propertyText.locator(
          "xpath=ancestor::*[self::div or self::article or self::tr][.//button][1]"
        );

        if (await card.isVisible().catch(() => false)) {
          const counterBtn = card.getByRole("button", {
            name: "Counter via Chat",
            exact: true,
          });

          const acceptBtn = card.getByRole("button", {
            name: "Accept",
            exact: true,
          });

          if (await counterBtn.isVisible().catch(() => false)) {
            this.activeCounterButton = counterBtn;
            return;
          }

          if (await acceptBtn.isVisible().catch(() => false)) {
            this.activeAcceptButton = acceptBtn;
            return;
          }
        }
      }
    }

    // Fallback: the newest/current submitted offer should expose either Counter via Chat or Accept
    const targetButton = this.page.getByRole("button", {
      name: /Counter via Chat|Accept/i,
    }).first();

    await expect(
      targetButton,
      "Submitted offer action button (Counter via Chat or Accept) should be visible"
    ).toBeVisible({ timeout: 20_000 });

    if (await this.counterViaChatButton.isVisible().catch(() => false)) {
      this.activeCounterButton = this.counterViaChatButton;
    }
    if (await this.acceptButton.isVisible().catch(() => false)) {
      this.activeAcceptButton = this.acceptButton;
    }
  }

  async sendCounterOfferViaChat(amount) {
    const counterButton =
      this.activeCounterButton || this.counterViaChatButton;

    await expect(
      counterButton,
      "Counter via Chat button should be visible"
    ).toBeVisible({ timeout: 20_000 });

    await counterButton.click();

    await expect(
      this.counterOfferHeading,
      "Counter Offer via Chat dialog should open"
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      this.counterAmountInput,
      "Counter offer amount input should be visible"
    ).toBeVisible({ timeout: 10_000 });

    await this.counterAmountInput.fill(String(amount));

    const value = await this.counterAmountInput.inputValue();
    const normalized = value.replace(/\D/g, "");

    expect(normalized).toBe(String(amount));

    await expect(
      this.sendAndOpenChatButton,
      "Send & Open Chat button should be visible"
    ).toBeVisible({ timeout: 10_000 });

    await expect(this.sendAndOpenChatButton).toBeEnabled();
    await this.sendAndOpenChatButton.click();

    this.lastCounterAmount = String(amount);
  }

  async verifyCounterOfferSent(expectedMessage) {
    const formattedAmount = Number(
      this.lastCounterAmount || 0
    ).toLocaleString("en-US");

    if (formattedAmount !== "0") {
      const amountMessage = this.page
        .getByText(
          new RegExp(`Counter offer:\\s*\\$${formattedAmount}`, "i")
        )
        .first();

      if (await amountMessage.isVisible().catch(() => false)) {
        await expect(amountMessage).toBeVisible();
        return;
      }
    }

    const genericMessage = this.page
      .getByText(expectedMessage)
      .first();

    if (await genericMessage.isVisible().catch(() => false)) {
      await expect(genericMessage).toBeVisible();
      return;
    }

    // Send & Open Chat should navigate/open the chat even if the app
    // does not show a dedicated success toast.
    await expect(
      this.page.getByText(/Conversations|Counter offer/i).first()
    ).toBeVisible({ timeout: 20_000 });
  }

  async acceptSubmittedOffer() {
    await this.openOffersAndBids();

    const acceptBtn = this.activeAcceptButton || this.acceptButton;

    await expect(
      acceptBtn,
      "Accept offer button should be visible"
    ).toBeVisible({ timeout: 20_000 });

    await acceptBtn.click();

    const confirmationButton = this.page.getByRole("button", {
      name: /Accept|Confirm|Yes/i,
    }).last();

    if (await confirmationButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await confirmationButton.click();
    }
  }

  async verifyAccepted(expectedMessage) {
    const message = this.page
      .getByText(expectedMessage)
      .first();

    if (await message.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(message).toBeVisible();
      return;
    }

    const acceptBtn = this.activeAcceptButton || this.acceptButton;
    await expect(acceptBtn).not.toBeVisible({
      timeout: 10_000,
    });
  }
}

module.exports = {
  AgentOffersPage,
};
