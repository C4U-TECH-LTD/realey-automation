const { expect } = require("@playwright/test");

class ConversationsPage {
  constructor(page) {
    this.page = page;

    // =====================================================
    // MAIN CONVERSATIONS BUTTON
    // =====================================================

    this.conversationsButton = page.getByRole("button", {
      name: "Conversations",
      exact: true,
    });

    // =====================================================
    // COUNTER NEGOTIATION
    // =====================================================

    this.counterNegotiateButton = page.getByRole("button", {
      name: "Counter Negotiate",
      exact: true,
    });

    this.counterAmountInput = page.locator("#counterAmount");

    this.sendCounterButton = page.getByRole("button", {
      name: "Send Counter",
      exact: true,
    });

    // =====================================================
    // ACCEPT OFFER
    // =====================================================

    this.acceptButton = page.getByRole("button", {
      name: "Accept",
      exact: true,
    });
  }

  // =====================================================
  // OPEN CONVERSATIONS
  // =====================================================

  async openConversations() {
    // -----------------------------------------------------
    // If already inside a conversation, do nothing
    // -----------------------------------------------------

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

    // -----------------------------------------------------
    // Check whether Conversations is already visible
    // -----------------------------------------------------

    let conversationsVisible =
      await this.conversationsButton
        .isVisible()
        .catch(() => false);

    // =====================================================
    // IF NOT ON DASHBOARD
    //
    // PROFILE DROPDOWN
    // -> VIEW DASHBOARD
    // -> CONVERSATIONS
    // =====================================================

    if (!conversationsVisible) {
      console.log(
        "Conversations button not visible. Opening profile dropdown..."
      );

      // ===================================================
      // FIND PROFILE USER NAME
      //
      // Current HTML:
      //
      // <div class="flex items-center gap-1 md:gap-3">
      //   avatar
      //
      //   <div>
      //     <span class="text-xs font-medium ...">
      //       Siam Mondol
      //     </span>
      //   </div>
      //
      //   <svg class="lucide-chevron-down">
      //
      // Do NOT depend on actual username.
      // ===================================================

      const profileName = this.page
        .locator("span.text-xs.font-medium")
        .filter({
          hasText: /\S+/,
        })
        .first();

      await expect(
        profileName,
        "Profile user name should be visible"
      ).toBeVisible({
        timeout: 20_000,
      });

      console.log("Profile user name found");

      // ===================================================
      // FIND PROFILE CONTAINER
      //
      // Start from username and find the nearest container
      // which also contains the profile chevron.
      // ===================================================

      const profileInner = profileName.locator(
        "xpath=ancestor::div[contains(@class,'items-center')]" +
          "[.//*[contains(@class,'lucide-chevron-down')]][1]"
      );

      await expect(
        profileInner,
        "Profile container should be visible"
      ).toBeVisible({
        timeout: 20_000,
      });

      console.log("Profile container found");

      // ===================================================
      // FIND CLICKABLE PROFILE PARENT
      //
      // The HTML you supplied is the inner div.
      // The actual trigger may be a parent button.
      // ===================================================

      const profileButton = profileInner.locator(
        "xpath=ancestor::button[1]"
      );

      const profileButtonVisible =
        await profileButton
          .isVisible()
          .catch(() => false);

      if (profileButtonVisible) {
        console.log(
          "Clickable profile parent button found"
        );

        await profileButton.click();
      } else {
        console.log(
          "No parent button found. Clicking profile container"
        );

        await profileInner.click();
      }

      console.log(
        "Profile dropdown trigger clicked"
      );

      // ===================================================
      // WAIT FOR VIEW DASHBOARD MENU ITEM
      // ===================================================

      const viewDashboard =
        this.page.getByRole("menuitem", {
          name: "View Dashboard",
          exact: true,
        });

      await expect(
        viewDashboard,
        "View Dashboard menu item should appear after profile dropdown opens"
      ).toBeVisible({
        timeout: 20_000,
      });

      console.log(
        "Profile dropdown opened successfully"
      );

      // ===================================================
      // CLICK VIEW DASHBOARD
      // ===================================================

      await viewDashboard.click();

      console.log(
        "View Dashboard clicked"
      );

      await this.page.waitForLoadState(
        "domcontentloaded"
      );

      await this.page.waitForTimeout(1000);

      // ---------------------------------------------------
      // Re-check Conversations after dashboard opens
      // ---------------------------------------------------

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

    console.log(
      "Conversations button clicked"
    );

    await this.page.waitForLoadState(
      "domcontentloaded"
    );

    await this.page.waitForTimeout(700);

    console.log(
      "Conversations page opened"
    );
  }

  // =====================================================
  // EXPAND CONVERSATION LIST
  // =====================================================

  async expandConversationList() {
    // -----------------------------------------------------
    // Preferred compact dropdown
    // -----------------------------------------------------

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

      console.log(
        "Conversation list dropdown expanded"
      );

      return;
    }

    // -----------------------------------------------------
    // Fallback
    // -----------------------------------------------------

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

      console.log(
        "Conversation list dropdown expanded using fallback"
      );
    }
  }

  // =====================================================
  // OPEN LATEST AGENT / BUYER CONVERSATION
  // =====================================================

  async openLatestAgentBuyerConversation() {
    await this.expandConversationList();

    const counterText = this.page
      .getByText(
        /Counter offer:\s*\$/i
      )
      .last();

    // -----------------------------------------------------
    // Prefer conversation containing Buyer + Agent
    // -----------------------------------------------------

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

        console.log(
          "Agent/Buyer conversation opened"
        );

        return;
      }
    }

    // -----------------------------------------------------
    // Fallback: latest counter offer conversation
    // -----------------------------------------------------

    await expect(
      counterText,
      "An Agent/Buyer counter-offer conversation should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await counterText.click();

    await this.page.waitForTimeout(500);

    console.log(
      "Latest counter-offer conversation opened"
    );
  }

  // =====================================================
  // OPEN AGENT CONVERSATION
  // =====================================================

  async openAgentConversation() {
    await this.openLatestAgentBuyerConversation();
  }

  // =====================================================
  // OPEN BUYER CONVERSATION
  // =====================================================

  async openBuyerConversation() {
    await this.openLatestAgentBuyerConversation();
  }

  // =====================================================
  // CLICK COUNTER NEGOTIATE
  // =====================================================

  async clickCounterNegotiate() {
    await expect(
      this.counterNegotiateButton,
      "Counter Negotiate button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await this.counterNegotiateButton.click();

    await expect(
      this.counterAmountInput,
      "Counter negotiation amount input should be visible"
    ).toBeVisible({
      timeout: 10_000,
    });

    console.log(
      "Counter Negotiate opened"
    );
  }

  // =====================================================
  // SEND COUNTER NEGOTIATION
  // =====================================================

  async sendCounterNegotiation(amount) {
    if (
      amount === undefined ||
      amount === null ||
      amount === ""
    ) {
      throw new Error(
        "Counter negotiation amount is required."
      );
    }

    await expect(
      this.counterAmountInput,
      "Counter negotiation amount input should be visible"
    ).toBeVisible({
      timeout: 10_000,
    });

    await this.counterAmountInput.fill(
      String(amount)
    );

    const value =
      await this.counterAmountInput.inputValue();

    const normalized =
      value.replace(/\D/g, "");

    const expectedValue =
      String(amount).replace(/\D/g, "");

    if (
      normalized !== expectedValue
    ) {
      throw new Error(
        `Counter negotiation amount was not entered correctly. ` +
          `Expected ${expectedValue}, got ${normalized}. ` +
          `Raw value: "${value}"`
      );
    }

    console.log(
      `Counter negotiation amount entered: ${value}`
    );

    await expect(
      this.sendCounterButton,
      "Send Counter button should be visible"
    ).toBeVisible({
      timeout: 10_000,
    });

    await expect(
      this.sendCounterButton,
      "Send Counter button should be enabled"
    ).toBeEnabled({
      timeout: 10_000,
    });

    await this.sendCounterButton.click();

    this.lastNegotiatedAmount =
      String(amount);

    console.log(
      "Counter negotiation sent"
    );
  }

  // =====================================================
  // VERIFY COUNTER NEGOTIATION
  // =====================================================

  async verifyCounterNegotiationSent(
    expectedMessage
  ) {
    const formattedAmount =
      Number(
        this.lastNegotiatedAmount || 0
      ).toLocaleString("en-US");

    if (
      formattedAmount !== "0"
    ) {
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
        await expect(
          amountMessage
        ).toBeVisible();

        console.log(
          "Counter negotiation verified by amount"
        );

        return;
      }
    }

    const genericMessage =
      this.page
        .getByText(
          expectedMessage
        )
        .last();

    await expect(
      genericMessage,
      "Counter negotiation should appear in the conversation"
    ).toBeVisible({
      timeout: 20_000,
    });

    console.log(
      "Counter negotiation verified"
    );
  }

  // =====================================================
  // ACCEPT NEGOTIATED OFFER
  // =====================================================

  async acceptNegotiatedOffer() {
    await expect(
      this.acceptButton,
      "Accept button should be visible for the negotiated offer"
    ).toBeVisible({
      timeout: 20_000,
    });

    await this.acceptButton.click();

    console.log(
      "Accept button clicked"
    );

    const dialog =
      this.page
        .getByRole("dialog")
        .last();

    if (
      await dialog
        .isVisible()
        .catch(() => false)
    ) {
      const confirmation =
        dialog
          .getByRole(
            "button",
            {
              name: /Accept|Confirm|Yes/i,
            }
          )
          .last();

      if (
        await confirmation
          .isVisible()
          .catch(() => false)
      ) {
        await confirmation.click();

        console.log(
          "Offer acceptance confirmed"
        );
      }
    }
  }

  // =====================================================
  // VERIFY NEGOTIATED OFFER ACCEPTED
  // =====================================================

  async verifyNegotiatedOfferAccepted(
    expectedMessage
  ) {
    const acceptedMessage =
      this.page
        .getByText(
          expectedMessage
        )
        .last();

    if (
      await acceptedMessage
        .isVisible()
        .catch(() => false)
    ) {
      await expect(
        acceptedMessage
      ).toBeVisible();

      console.log(
        "Negotiated offer accepted message visible"
      );

      return;
    }

    await expect(
      this.acceptButton,
      "Accept button should disappear after accepting the negotiated offer"
    ).not.toBeVisible({
      timeout: 15_000,
    });

    console.log(
      "Negotiated offer accepted successfully"
    );
  }
}

module.exports = {
  ConversationsPage,
};