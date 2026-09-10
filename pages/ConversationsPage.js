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

    let conversationsVisible = await this.conversationsButton
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

      const profileButton = profileInner.locator(
        "xpath=ancestor::button[1]"
      );

      if (
        await profileButton
          .isVisible()
          .catch(() => false)
      ) {
        await profileButton.click();
      } else {
        await profileInner.click();
      }

      const viewDashboard = this.page.getByRole("menuitem", {
        name: "View Dashboard",
        exact: true,
      });

      await expect(
        viewDashboard,
        "View Dashboard should be visible"
      ).toBeVisible({ timeout: 20_000 });

      await viewDashboard.click();

      await this.page.waitForLoadState("domcontentloaded");
      await this.page.waitForTimeout(1000);

      conversationsVisible = await this.conversationsButton
        .isVisible()
        .catch(() => false);
    }

    await expect(
      this.conversationsButton,
      "Conversations menu should be visible"
    ).toBeVisible({ timeout: 20_000 });

    await this.conversationsButton.click();

    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForTimeout(700);
  }

  /**
   * Finds the first/latest property row matching the supplied property name.
   *
   * Example:
   * "Bates Drive, Kareela"
   */
  async getPropertyRow(expectedPropertyName) {
    if (!expectedPropertyName) {
      throw new Error(
        "expectedPropertyName is required to locate the conversation."
      );
    }

    console.log(
      `Looking for first conversation row: ${expectedPropertyName}`
    );

    const propertyName = this.page
      .getByText(expectedPropertyName, {
        exact: true,
      })
      .first();

    await expect(
      propertyName,
      `Property "${expectedPropertyName}" should be visible in Conversations`
    ).toBeVisible({ timeout: 20_000 });

    /*
     * Go upward from the property text until we reach the row
     * that also contains the chat count / dropdown control.
     */
    const propertyRow = propertyName.locator(
      "xpath=ancestor::div[" +
        ".//button[.//*[contains(@class,'lucide-chevron-down')]]" +
        " or " +
        ".//*[contains(normalize-space(.),'chat')]" +
        "][1]"
    );

    await expect(
      propertyRow,
      `Conversation row for "${expectedPropertyName}" should be visible`
    ).toBeVisible({ timeout: 20_000 });

    return {
      propertyName,
      propertyRow,
    };
  }

  async expandConversationList(expectedPropertyName) {
    const { propertyName, propertyRow } =
      await this.getPropertyRow(expectedPropertyName);

    const dropdownButton = propertyRow
      .locator("button")
      .filter({
        has: this.page.locator(
          "svg.lucide-chevron-down"
        ),
      })
      .last();

    if (
      await dropdownButton
        .isVisible()
        .catch(() => false)
    ) {
      console.log(
        `Expanding property conversation: ${expectedPropertyName}`
      );

      await dropdownButton.click();
      await this.page.waitForTimeout(500);

      return propertyRow;
    }

    /*
     * Fallback in case the complete row itself is clickable.
     */
    console.log(
      `Dropdown not found. Clicking property name: ${expectedPropertyName}`
    );

    await propertyName.click();
    await this.page.waitForTimeout(500);

    return propertyRow;
  }

  async openLatestAgentBuyerConversation(
    expectedPropertyName
  ) {
    if (!expectedPropertyName) {
      throw new Error(
        "expectedPropertyName is required to open Agent/Buyer conversation."
      );
    }

    console.log(
      `Opening latest Agent/Buyer conversation for: ${expectedPropertyName}`
    );

    /*
     * Step 1:
     * Find FIRST property from top.
     *
     * Example:
     * Bates Drive, Kareela
     */
    const propertyRow =
      await this.expandConversationList(
        expectedPropertyName
      );

    await this.page.waitForTimeout(500);

    /*
     * Step 2:
     * After expanding the correct property row,
     * try to find a Buyer/Agent conversation.
     */
    const buyerText = this.page
      .getByText(/^Buyer$/i)
      .first();

    const agentText = this.page
      .getByText(/^Agent$/i)
      .first();

    /*
     * First try to find Buyer and Agent inside
     * the selected property row.
     */
    const roleConversation = propertyRow
      .locator("div")
      .filter({
        has: this.page.getByText(/Buyer/i),
      })
      .filter({
        has: this.page.getByText(/Agent/i),
      })
      .last();

    if (
      await roleConversation
        .isVisible()
        .catch(() => false)
    ) {
      console.log(
        "Agent/Buyer conversation found inside selected property."
      );

      await roleConversation.click();
      await this.page.waitForTimeout(500);
      return;
    }

    /*
     * Some UIs render expanded child chats outside
     * the parent row DOM.
     *
     * In that case try a nearby conversation
     * containing Buyer + Agent.
     */
    const globalRoleConversation = this.page
      .locator("div")
      .filter({
        has: buyerText,
      })
      .filter({
        has: agentText,
      })
      .last();

    if (
      await globalRoleConversation
        .isVisible()
        .catch(() => false)
    ) {
      console.log(
        "Agent/Buyer conversation found after expanding property."
      );

      await globalRoleConversation.click();
      await this.page.waitForTimeout(500);
      return;
    }

    /*
     * If this property only has one chat,
     * clicking the "1 chat" area may open it directly.
     */
    const chatCount = propertyRow
      .getByText(/\d+\s*chat(?:s)?/i)
      .first();

    if (
      await chatCount
        .isVisible()
        .catch(() => false)
    ) {
      console.log(
        `Opening available chat for ${expectedPropertyName}`
      );

      await chatCount.click();
      await this.page.waitForTimeout(500);

      /*
       * Confirm we reached an actual chat using
       * controls/text expected inside the conversation.
       */
      const conversationOpened =
        (await this.counterNegotiateButton
          .isVisible()
          .catch(() => false)) ||
        (await this.page
          .getByText(/Counter offer:/i)
          .last()
          .isVisible()
          .catch(() => false));

      if (conversationOpened) {
        return;
      }
    }

    /*
     * Last fallback:
     * Click the property row itself.
     */
    await propertyRow.click();
    await this.page.waitForTimeout(500);

    const conversationOpened =
      (await this.counterNegotiateButton
        .isVisible()
        .catch(() => false)) ||
      (await this.page
        .getByText(/Counter offer:/i)
        .last()
        .isVisible()
        .catch(() => false));

    if (conversationOpened) {
      return;
    }

    throw new Error(
      `Could not open Agent/Buyer conversation for "${expectedPropertyName}".`
    );
  }

  async openAgentConversation(
    expectedPropertyName
  ) {
    await this.openLatestAgentBuyerConversation(
      expectedPropertyName
    );
  }

  async openBuyerConversation(
    expectedPropertyName
  ) {
    await this.openLatestAgentBuyerConversation(
      expectedPropertyName
    );
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
    if (
      amount === undefined ||
      amount === null ||
      amount === ""
    ) {
      throw new Error(
        "Counter negotiation amount is required."
      );
    }

    const expectedValue = String(amount).replace(
      /\D/g,
      ""
    );

    await expect(
      this.counterAmountInput,
      "Counter negotiation amount input should be visible"
    ).toBeVisible({ timeout: 10_000 });

    await this.counterAmountInput.fill(
      expectedValue
    );

    const rawValue =
      await this.counterAmountInput.inputValue();

    const actualValue = rawValue.replace(
      /\D/g,
      ""
    );

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

    this.lastNegotiatedAmount =
      expectedValue;

    await this.page.waitForTimeout(700);
  }

  async verifyCounterNegotiationSent(
    expectedMessage = /counter offer/i
  ) {
    const formattedAmount = Number(
      this.lastNegotiatedAmount || 0
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

      if (
        await amountMessage
          .isVisible()
          .catch(() => false)
      ) {
        await expect(
          amountMessage
        ).toBeVisible();

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
   * Decline negotiated offer (BUYER side).
   *
   * When the Agent sends a counter offer, the Buyer's conversation
   * view shows "Decline" and "Counter Negotiate" buttons.
   * This method clicks "Decline" then confirms.
   */
  async declineNegotiation() {
    // Wait for any loading spinner to detach first
    await this.page
      .locator('.animate-spin, svg.lucide-loader-2, [class*="loading"]')
      .first()
      .waitFor({ state: "hidden", timeout: 15_000 })
      .catch(() => {});

    const declineButton = this.page.getByRole("button", {
      name: "Decline",
      exact: true,
    });

    await expect(
      declineButton,
      "Decline button should be visible for the agent's counter offer"
    ).toBeVisible({ timeout: 20_000 });

    await expect(
      declineButton,
      "Decline button should be enabled"
    ).toBeEnabled({ timeout: 10_000 });

    await declineButton.click();

    console.log("Decline button clicked by buyer");

    // Some UIs show a confirmation dialog after clicking Decline
    const confirmDeclineButton = this.page
      .getByRole("button", {
        name: /Decline Offer|Decline|Confirm/i,
      })
      .last();

    const confirmVisible = await confirmDeclineButton
      .isVisible()
      .catch(() => false);

    if (confirmVisible) {
      const isEnabled = await confirmDeclineButton
        .isEnabled()
        .catch(() => false);

      if (isEnabled) {
        await confirmDeclineButton.click();
        console.log("Decline confirmed in dialog");
      }
    }

    await this.page.waitForTimeout(1000);
  }

  /**
   * Verify the negotiation was declined (BUYER side).
   *
   * After the buyer clicks Decline, the conversation should
   * reflect the declined state (e.g. "Declined" badge) and
   * the Decline / Counter Negotiate buttons should disappear.
   */
  async verifyNegotiationDeclined(
    expectedMessage = /declined|offer declined|decline/i
  ) {
    // First check for an explicit declined status text
    const statusText = this.page
      .getByText(expectedMessage)
      .last();

    if (await statusText.isVisible().catch(() => false)) {
      await expect(statusText).toBeVisible({ timeout: 10_000 });
      console.log("Buyer-side negotiation declined status confirmed");
      return;
    }

    // Fallback: verify Counter Negotiate button has gone away
    await expect(
      this.counterNegotiateButton,
      "Counter Negotiate button should disappear after buyer declines"
    ).not.toBeVisible({ timeout: 20_000 });

    console.log("Negotiation decline verified — Counter Negotiate button gone");
  }

  /**
   * Accept negotiated offer.
   *
   * Expected:
   * <button>Accept</button>
   *
   * Then:
   * <button>Confirm</button>
   */
  async acceptNegotiatedOffer() {
    // Wait for any chat loading spinner to detach
    await this.page
      .locator('.animate-spin, svg.lucide-loader-2, [class*="loading"]')
      .first()
      .waitFor({ state: "hidden", timeout: 15_000 })
      .catch(() => {});

    await expect(
      this.acceptButton,
      "Accept button should be visible for negotiated offer"
    ).toBeVisible({ timeout: 20_000 });

    await this.acceptButton.click();

    console.log("Accept button clicked");

    const dialog = this.page.locator('[role="dialog"]').last();
    const dialogAppeared = await dialog
      .waitFor({ state: "visible", timeout: 8000 })
      .then(() => true)
      .catch(() => false);

    if (dialogAppeared) {
      const confirmButton = dialog
        .getByRole("button", {
          name: /Confirm|Accept|Yes/i,
        })
        .first();

      await expect(
        confirmButton,
        "Confirm button should be visible"
      ).toBeVisible({ timeout: 10_000 });

      await expect(confirmButton).toBeEnabled();
      await confirmButton.click();
      console.log("Offer acceptance confirmed in dialog");
    } else {
      /*
       * Fallback for UI where modal
       * does not expose role="dialog".
       */
      const confirmButton = this.page
        .getByRole("button", {
          name: /Confirm|Accept|Yes/i,
        })
        .last();

      if (await confirmButton.isVisible().catch(() => false)) {
        await confirmButton.click();
        console.log("Offer acceptance confirmed via fallback button");
      }
    }

    await this.page.waitForTimeout(1000);
  }

  async verifyNegotiatedOfferAccepted(
    expectedMessage
  ) {
    // 1. Assert that the card or screen reflects acceptance (badge, toast, or copy settlement link)
    const successTarget = this.page
      .getByText(expectedMessage || /accepted/i)
      .or(this.page.getByText(/copy settlement link/i))
      .or(this.page.getByText(/offer accepted/i))
      .last();

    await expect(
      successTarget,
      "Negotiated offer should be accepted and show Accepted state"
    ).toBeVisible({ timeout: 20_000 });

    // 2. Accept button must have disappeared
    await expect(
      this.acceptButton,
      "Accept button should disappear after acceptance"
    ).not.toBeVisible({ timeout: 15_000 });

    console.log("Negotiated offer accepted successfully");
  }

  getProgressTaskListLocator() {
    return this.page
      .getByRole("button", {
        name: /Configure Progress Task List|Configure Progress|Progress Task List|Task List/i,
      })
      .or(
        this.page.getByRole("link", {
          name: /Configure Progress Task List|Configure Progress|Progress Task List|Task List/i,
        })
      )
      .or(
        this.page.locator(
          'button:has-text("Configure Progress"), button:has-text("Task List")'
        )
      )
      .or(this.page.getByText(/Configure Progress Task List/i))
      .or(
        this.page.locator(
          '[data-testid*="task-list"], [aria-label*="task list" i]'
        )
      )
      .first();
  }

  async verifyProgressTaskListNotAvailable() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForTimeout(1500);

    const taskList = this.getProgressTaskListLocator();

    const isVisible = await taskList.isVisible().catch(() => false);

    if (isVisible) {
      const isEnabled = await taskList.isEnabled().catch(() => false);

      if (isEnabled) {
        throw new Error(
          "Configure Progress Task List is visible and interactive, but it should NOT be visible or interactive at this stage."
        );
      }

      console.log(
        "Configure Progress Task List is visible but disabled/non-interactive as expected."
      );
      return;
    }

    await expect(
      taskList,
      "Configure Progress Task List should not be visible"
    ).not.toBeVisible({ timeout: 5000 });

    console.log(
      "Configure Progress Task List is not visible as expected."
    );
  }

  async verifyProgressTaskListAvailable() {
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForTimeout(2000);

    const taskList = this.getProgressTaskListLocator();

    await expect(
      taskList,
      "Configure Progress Task List should automatically appear in the chatroom"
    ).toBeVisible({ timeout: 30_000 });

    await expect(
      taskList,
      "Configure Progress Task List should be interactive/enabled"
    ).toBeEnabled({ timeout: 10_000 });

    console.log(
      "Configure Progress Task List is visible and interactive as expected."
    );
  }
}

module.exports = {
  ConversationsPage,
};