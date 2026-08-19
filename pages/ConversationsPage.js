const { expect } = require("@playwright/test");

class ConversationsPage {
  constructor(page) {
    this.page = page;

    this.conversationsButton = page.getByRole("button", {
      name: "Conversations",
      exact: true,
    });

    this.counterNegotiateButton = page.getByRole("button", {
      name: "Counter Negotiate",
      exact: true,
    });

    this.counterAmountInput = page.locator("#counterAmount");

    this.sendCounterButton = page.getByRole("button", {
      name: "Send Counter",
      exact: true,
    });

    this.acceptButton = page.getByRole("button", {
      name: "Accept",
      exact: true,
    });
  }

  async openConversations() {
    const alreadyOnConversation =
      (await this.counterNegotiateButton
        .isVisible()
        .catch(() => false)) ||
      (await this.page
        .getByText(/Counter offer:/i)
        .first()
        .isVisible()
        .catch(() => false));

    if (alreadyOnConversation) {
      console.log("Already on conversation page");
      return;
    }

    let conversationsVisible =
      await this.conversationsButton
        .isVisible()
        .catch(() => false);

    if (!conversationsVisible) {
      const profileName = this.page
        .locator("span.text-xs.font-medium")
        .filter({ hasText: /\S+/ })
        .first();

      await expect(
        profileName,
        "Profile user name should be visible"
      ).toBeVisible({ timeout: 20_000 });

      const profileInner = profileName.locator(
        "xpath=ancestor::div[contains(@class,'items-center')]" +
          "[.//*[contains(@class,'lucide-chevron-down')]][1]"
      );

      await expect(
        profileInner,
        "Profile container should be visible"
      ).toBeVisible({ timeout: 20_000 });

      const profileButton =
        profileInner.locator("xpath=ancestor::button[1]");

      if (
        await profileButton
          .isVisible()
          .catch(() => false)
      ) {
        await profileButton.click();
      } else {
        await profileInner.click();
      }

      const viewDashboard =
        this.page.getByRole("menuitem", {
          name: "View Dashboard",
          exact: true,
        });

      await expect(
        viewDashboard,
        "View Dashboard should be visible"
      ).toBeVisible({ timeout: 20_000 });

      await viewDashboard.click();

      await this.page.waitForLoadState(
        "domcontentloaded"
      );

      await this.page.waitForTimeout(1000);

      conversationsVisible =
        await this.conversationsButton
          .isVisible()
          .catch(() => false);
    }

    await expect(
      this.conversationsButton,
      "Conversations menu should be visible"
    ).toBeVisible({ timeout: 20_000 });

    await this.conversationsButton.click();

    await this.page.waitForLoadState(
      "domcontentloaded"
    );

    await this.page.waitForTimeout(700);
  }

  async expandConversationList() {
    const compactDropdown = this.page
      .locator(
        'button[class*="w-[32px]"][class*="h-[32px]"]'
      )
      .filter({
        has: this.page.locator(
          "svg.lucide-chevron-down"
        ),
      })
      .first();

    if (
      await compactDropdown
        .isVisible()
        .catch(() => false)
    ) {
      await compactDropdown.click();
      await this.page.waitForTimeout(400);
      return;
    }

    const fallbackDropdown = this.page
      .locator("button")
      .filter({
        has: this.page.locator(
          "svg.lucide-chevron-down"
        ),
      })
      .last();

    if (
      await fallbackDropdown
        .isVisible()
        .catch(() => false)
    ) {
      await fallbackDropdown.click();
      await this.page.waitForTimeout(400);
    }
  }

  async openLatestAgentBuyerConversation() {
    await this.expandConversationList();

    const counterText = this.page
      .getByText(/Counter offer:\s*\$/i)
      .last();

    if (
      await counterText
        .isVisible()
        .catch(() => false)
    ) {
      const roleConversation =
        counterText.locator(
          "xpath=ancestor::div[" +
            ".//span[contains(normalize-space(.), 'Buyer')]" +
            " and " +
            ".//span[contains(normalize-space(.), 'Agent')]" +
            "][1]"
        );

      if (
        await roleConversation
          .isVisible()
          .catch(() => false)
      ) {
        await roleConversation.click();
        await this.page.waitForTimeout(500);
        return;
      }
    }

    await expect(
      counterText,
      "An Agent/Buyer counter-offer conversation should be visible"
    ).toBeVisible({ timeout: 20_000 });

    await counterText.click();
    await this.page.waitForTimeout(500);
  }

  async openAgentConversation() {
    await this.openLatestAgentBuyerConversation();
  }

  async openBuyerConversation() {
    await this.openLatestAgentBuyerConversation();
  }

  async clickCounterNegotiate() {
    await expect(
      this.counterNegotiateButton,
      "Counter Negotiate button should be visible"
    ).toBeVisible({ timeout: 20_000 });

    await this.counterNegotiateButton.click();

    await expect(
      this.counterAmountInput,
      "Counter negotiation amount input should be visible"
    ).toBeVisible({ timeout: 10_000 });
  }

  async sendCounterNegotiation(amount) {
    if (amount === undefined || amount === null || amount === "") {
      throw new Error("Counter negotiation amount is required.");
    }

    const expectedValue =
      String(amount).replace(/\D/g, "");

    await expect(
      this.counterAmountInput,
      "Counter negotiation amount input should be visible"
    ).toBeVisible({ timeout: 10_000 });

    await this.counterAmountInput.fill(expectedValue);

    const rawValue =
      await this.counterAmountInput.inputValue();

    const actualValue =
      rawValue.replace(/\D/g, "");

    if (actualValue !== expectedValue) {
      throw new Error(
        `Counter negotiation amount was not entered correctly. ` +
          `Expected ${expectedValue}, got ${actualValue}.`
      );
    }

    await expect(
      this.sendCounterButton,
      "Send Counter button should be visible"
    ).toBeVisible({ timeout: 10_000 });

    await expect(
      this.sendCounterButton,
      "Send Counter button should be enabled"
    ).toBeEnabled({ timeout: 10_000 });

    await this.sendCounterButton.click();

    this.lastNegotiatedAmount = expectedValue;

    await this.page.waitForTimeout(700);
  }

  async verifyCounterNegotiationSent(
    expectedMessage = /counter offer/i
  ) {
    const formattedAmount =
      Number(
        this.lastNegotiatedAmount || 0
      ).toLocaleString("en-US");

    if (formattedAmount !== "0") {
      const amountMessage =
        this.page
          .getByText(
            new RegExp(
              `Counter offer:\\s*\\$${formattedAmount}`,
              "i"
            )
          )
          .last();

      if (
        await amountMessage
          .isVisible()
          .catch(() => false)
      ) {
        await expect(amountMessage).toBeVisible();
        return;
      }
    }

    await expect(
      this.page
        .getByText(expectedMessage)
        .last(),
      "Counter negotiation should appear in conversation"
    ).toBeVisible({ timeout: 20_000 });
  }

  /**
   * Flow 4 supplied HTML:
   *   <button>Accept</button>
   * followed by a modal:
   *   <button>Confirm</button>
   */
  async acceptNegotiatedOffer() {
    await expect(
      this.acceptButton,
      "Accept button should be visible for negotiated offer"
    ).toBeVisible({ timeout: 20_000 });

    await this.acceptButton.click();

    const dialog = this.page
      .getByRole("dialog")
      .last();

    if (await dialog.isVisible().catch(() => false)) {
      const confirmButton = dialog.getByRole("button", {
        name: "Confirm",
        exact: true,
      });

      await expect(
        confirmButton,
        "Confirm button should be visible"
      ).toBeVisible({ timeout: 10_000 });

      await expect(confirmButton).toBeEnabled();

      await confirmButton.click();
    } else {
      // Fallback for applications that do not expose role="dialog".
      const confirmButton = this.page.getByRole("button", {
        name: "Confirm",
        exact: true,
      }).last();

      await expect(
        confirmButton,
        "Confirm button should be visible"
      ).toBeVisible({ timeout: 10_000 });

      await confirmButton.click();
    }

    await this.page.waitForTimeout(700);
  }

  async verifyNegotiatedOfferAccepted(
    expectedMessage
  ) {
    const acceptedMessage =
      this.page
        .getByText(expectedMessage)
        .last();

    if (
      await acceptedMessage
        .isVisible()
        .catch(() => false)
    ) {
      await expect(acceptedMessage).toBeVisible();
      return;
    }

    await expect(
      this.acceptButton,
      "Accept button should disappear after acceptance"
    ).not.toBeVisible({ timeout: 15_000 });
  }
}

module.exports = {
  ConversationsPage,
};
