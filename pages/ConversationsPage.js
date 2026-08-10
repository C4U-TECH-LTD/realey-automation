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
    await this.counterNegotiateButton
      .isVisible()
      .catch(() => false) ||
    await this.page
      .getByText(/Counter offer:/i)
      .first()
      .isVisible()
      .catch(() => false);

  if (alreadyOnConversation) {
    return;
  }

  let conversationsVisible =
    await this.conversationsButton
      .isVisible()
      .catch(() => false);

  // =====================================================
  // IF NOT ON DASHBOARD:
  // PROFILE -> VIEW DASHBOARD -> CONVERSATIONS
  // =====================================================

  if (!conversationsVisible) {
    const profileMenuButton = this.page
      .locator('button[aria-haspopup="menu"]')
      .filter({
        hasText: /SZ User|SZ Agent/i,
      })
      .first();

    await expect(
      profileMenuButton,
      "Profile menu button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await profileMenuButton.click();

    // ===================================================
    // CLICK VIEW DASHBOARD
    // ===================================================

    const viewDashboard = this.page
      .getByRole("menuitem")
      .filter({
        hasText: "View Dashboard",
      });

    await expect(
      viewDashboard,
      "View Dashboard menu item should be visible"
    ).toBeVisible({
      timeout: 10_000,
    });

    await viewDashboard.click();

    await this.page.waitForLoadState(
      "domcontentloaded"
    );

    await this.page.waitForTimeout(1000);

    // ===================================================
    // WAIT FOR CONVERSATIONS SIDEBAR BUTTON
    // ===================================================

    conversationsVisible =
      await this.conversationsButton
        .isVisible()
        .catch(() => false);
  }

  // =====================================================
  // CLICK CONVERSATIONS
  // =====================================================

  await expect(
    this.conversationsButton,
    "Conversations menu should be visible"
  ).toBeVisible({
    timeout: 20_000,
  });

  await this.conversationsButton.click();

  await this.page.waitForLoadState(
    "domcontentloaded"
  );

  await this.page.waitForTimeout(700);
}

  async expandConversationList() {
    // The supplied UI uses a small round chevron-down button above the
    // conversation list. Target the button through its chevron SVG so
    // we do not depend on the generated Radix IDs.
    const compactDropdown = this.page
      .locator('button[class*="w-[32px]"][class*="h-[32px]"]')
      .filter({
        has: this.page.locator("svg.lucide-chevron-down"),
      })
      .first();

    if (await compactDropdown.isVisible().catch(() => false)) {
      await compactDropdown.click();
      await this.page.waitForTimeout(400);
      return;
    }

    const fallbackDropdown = this.page
      .locator("button")
      .filter({
        has: this.page.locator("svg.lucide-chevron-down"),
      })
      .last();

    if (await fallbackDropdown.isVisible().catch(() => false)) {
      await fallbackDropdown.click();
      await this.page.waitForTimeout(400);
    }
  }

  async openLatestAgentBuyerConversation() {
    await this.expandConversationList();

    // Prefer a conversation that visibly contains both Buyer and Agent
    // role badges, matching the supplied Realey conversation list UI.
    const counterText = this.page
      .getByText(/Counter offer:\s*\$/i)
      .last();

    if (await counterText.isVisible().catch(() => false)) {
      const roleConversation = counterText.locator(
        "xpath=ancestor::div[.//span[contains(normalize-space(.), 'Buyer')] and .//span[contains(normalize-space(.), 'Agent')]][1]"
      );

      if (await roleConversation.isVisible().catch(() => false)) {
        await roleConversation.click();
        await this.page.waitForTimeout(500);
        return;
      }
    }

    // Fallback to the latest visible counter-offer conversation item.

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
    await expect(
      this.counterAmountInput,
      "Counter negotiation amount input should be visible"
    ).toBeVisible({ timeout: 10_000 });

    await this.counterAmountInput.fill(String(amount));

    const value = await this.counterAmountInput.inputValue();
    const normalized = value.replace(/\D/g, "");

    expect(normalized).toBe(String(amount));

    await expect(
      this.sendCounterButton,
      "Send Counter button should be visible"
    ).toBeVisible({ timeout: 10_000 });

    await expect(this.sendCounterButton).toBeEnabled();
    await this.sendCounterButton.click();

    this.lastNegotiatedAmount = String(amount);
  }

  async verifyCounterNegotiationSent(expectedMessage) {
    const formattedAmount = Number(
      this.lastNegotiatedAmount || 0
    ).toLocaleString("en-US");

    if (formattedAmount !== "0") {
      const amountMessage = this.page
        .getByText(
          new RegExp(`Counter offer:\\s*\\$${formattedAmount}`, "i")
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

    await expect(
      genericMessage,
      "Counter negotiation should appear in the conversation"
    ).toBeVisible({ timeout: 20_000 });
  }

  async acceptNegotiatedOffer() {
    await expect(
      this.acceptButton,
      "Accept button should be visible for the negotiated offer"
    ).toBeVisible({ timeout: 20_000 });

    await this.acceptButton.click();

    const dialog = this.page.getByRole("dialog").last();

    if (await dialog.isVisible().catch(() => false)) {
      const confirmation = dialog.getByRole("button", {
        name: /Accept|Confirm|Yes/i,
      }).last();

      if (await confirmation.isVisible().catch(() => false)) {
        await confirmation.click();
      }
    }
  }

  async verifyNegotiatedOfferAccepted(expectedMessage) {
    const acceptedMessage = this.page
      .getByText(expectedMessage)
      .last();

    if (await acceptedMessage.isVisible().catch(() => false)) {
      await expect(acceptedMessage).toBeVisible();
      return;
    }

    await expect(
      this.acceptButton,
      "Accept button should disappear after accepting the negotiated offer"
    ).not.toBeVisible({ timeout: 15_000 });
  }
}

module.exports = {
  ConversationsPage,
};
