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
    // 1. If "Go to Conversation" button is present in a settlement modal, click it
    const goToConvBtn = this.page
      .getByRole("button", { name: /Go to Conversation/i })
      .or(this.page.locator('button:has-text("Go to Conversation")'))
      .first();

    if (await goToConvBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log("Clicking 'Go to Conversation' button from modal...");
      await goToConvBtn.click();
      await this.page.waitForLoadState("domcontentloaded");
      await this.page.waitForTimeout(1000);
      return;
    }

    // 2. Dismiss any open modal/dialog if present
    const closeDialogBtn = this.page
      .locator(
        '[role="dialog"] button:has(svg.lucide-x), [role="dialog"] button[aria-label*="close" i]'
      )
      .first();
    if (await closeDialogBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await closeDialogBtn.click().catch(() => {});
      await this.page.waitForTimeout(500);
    }

    const alreadyOnConversation =
      (await this.counterNegotiateButton
        .isVisible()
        .catch(() => false)) ||
      (await this.page
        .getByText(/Counter offer:/i)
        .first()
        .isVisible()
        .catch(() => false)) ||
      this.page.url().includes("tab=conversations") ||
      this.page.url().includes("/chat/");

    if (alreadyOnConversation) {
      console.log("Already on conversation page");
      return;
    }

    let conversationsVisible = await this.conversationsButton
      .isVisible()
      .catch(() => false);

    if (!conversationsVisible) {
      // Try direct navigation fallback based on current dashboard/user context
      const isAgent = this.page.url().includes("agent");
      const fallbackUrl = isAgent
        ? "/dashboard/agent?tab=conversations"
        : "/dashboard/general-user?tab=conversations";

      try {
        await this.page.goto(fallbackUrl, { waitUntil: "domcontentloaded" });
        await this.page.waitForTimeout(1000);

        conversationsVisible = await this.conversationsButton
          .isVisible()
          .catch(() => false);

        if (this.page.url().includes("tab=conversations")) {
          return;
        }
      } catch {}
    }

    if (!conversationsVisible) {
      const profileName = this.page
        .locator("span.text-xs.font-medium")
        .filter({ hasText: /\S+/ })
        .first();

      if (await profileName.isVisible({ timeout: 5000 }).catch(() => false)) {
        const profileInner = profileName.locator(
          "xpath=ancestor::div[contains(@class,'items-center')]" +
            "[.//*[contains(@class,'lucide-chevron-down')]][1]"
        );

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

        if (await viewDashboard.isVisible({ timeout: 5000 }).catch(() => false)) {
          await viewDashboard.click();
          await this.page.waitForLoadState("domcontentloaded");
          await this.page.waitForTimeout(1000);
        }
      }
    }

    const convBtn = this.page
      .getByRole("button", { name: "Conversations", exact: true })
      .or(this.page.locator('aside, nav, [class*="sidebar"]').locator('text=Conversations').first())
      .first();

    await expect(
      convBtn,
      "Conversations menu should be visible"
    ).toBeVisible({ timeout: 20_000 });

    await convBtn.click();

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

    // Wait for any loading spinner on Conversations page to finish
    await this.page
      .locator(".animate-spin, svg.animate-spin")
      .first()
      .waitFor({ state: "hidden", timeout: 30_000 })
      .catch(() => {});
    await this.page.waitForTimeout(1000);

    const shortName = expectedPropertyName.split(",")[0].trim();

    // If still showing 0 Properties / loading, wait for data to populate
    const zeroProperties = this.page.getByText(/^0\s*Properties$/i);
    if (await zeroProperties.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log("Conversations list showing 0 properties, waiting for data to populate...");
      await this.page.waitForTimeout(3000);
      if (await zeroProperties.isVisible().catch(() => false)) {
        console.log("Reloading conversations page...");
        await this.page.reload({ waitUntil: "domcontentloaded" });
        await this.page
          .locator(".animate-spin, svg.animate-spin")
          .first()
          .waitFor({ state: "hidden", timeout: 30_000 })
          .catch(() => {});
        await this.page.waitForTimeout(2000);
      }
    }

    // Look for isolated property cards
    const cardCandidates = this.page
      .locator('div[class*="rounded-2xl"], div[class*="bg-card"], div.border')
      .filter({ hasText: new RegExp(shortName, "i") })
      .filter({
        has: this.page.locator(
          "button.cursor-pointer, svg.lucide-chevron-down, svg.lucide-chevron-up, svg.lucide-chevron-right, [class*='lucide-chevron']"
        ),
      });

    const cardCount = await cardCandidates.count();
    if (cardCount > 0) {
      // Prioritize card with "1 new" or "new" or "unread" badge
      const newCard = cardCandidates.filter({ hasText: /\b(?:new|unread)\b/i }).first();
      const matchedCard = (await newCard.isVisible({ timeout: 1500 }).catch(() => false))
        ? newCard
        : cardCandidates.first();

      return {
        propertyName: matchedCard.getByText(new RegExp(shortName, "i")).first(),
        propertyRow: matchedCard,
      };
    }

    const propertyLocator = this.page
      .getByText(expectedPropertyName, { exact: true })
      .or(this.page.getByText(expectedPropertyName))
      .or(
        this.page
          .locator("button, div")
          .filter({ hasText: new RegExp(`^${shortName}`, "i") })
      )
      .or(this.page.getByText(new RegExp(shortName, "i")))
      .first();

    await expect(
      propertyLocator,
      `Property "${expectedPropertyName}" should be visible in Conversations`
    ).toBeVisible({ timeout: 30_000 });

    /*
     * Go upward from the property text until we reach the row
     * that also contains the chat count / dropdown control.
     */
    const propertyRow = propertyLocator.locator(
      "xpath=ancestor::div[" +
        ".//button[.//*[contains(@class,'lucide-chevron-down') or contains(@class,'lucide-chevron-up') or contains(@class,'lucide-chevron-right')]]" +
        " or " +
        ".//*[contains(normalize-space(.),'chat')]" +
        " or " +
        ".//*[contains(normalize-space(.),'Agent')]" +
        "][1]"
    );

    if (await propertyRow.isVisible({ timeout: 3000 }).catch(() => false)) {
      return {
        propertyName: propertyLocator,
        propertyRow,
      };
    }

    return {
      propertyName: propertyLocator,
      propertyRow: propertyLocator.locator("xpath=ancestor::div[1]"),
    };
  }

  async expandConversationList(expectedPropertyName) {
    const { propertyName, propertyRow } =
      await this.getPropertyRow(expectedPropertyName);

    // If already expanded in THIS property card, return
    const isAlreadyExpanded = await propertyRow
      .locator("svg.lucide-chevron-up, [class*='lucide-chevron-up']")
      .isVisible()
      .catch(() => false);

    if (isAlreadyExpanded) {
      console.log(`Property conversation is already expanded: ${expectedPropertyName}`);
      return propertyRow;
    }

    const dropdownButton = propertyRow
      .locator("button")
      .filter({
        has: this.page.locator("svg.lucide-chevron-down, svg.lucide-chevron-right, [class*='lucide-chevron']"),
      })
      .or(propertyRow.locator("button.cursor-pointer"))
      .first();

    if (
      await dropdownButton
        .isVisible()
        .catch(() => false)
    ) {
      console.log(
        `Expanding property conversation: ${expectedPropertyName}`
      );

      await dropdownButton.click();
      await this.page.waitForTimeout(1000);

      return propertyRow;
    }

    /*
     * Fallback in case the complete row itself is clickable.
     */
    console.log(
      `Dropdown not found. Clicking property row: ${expectedPropertyName}`
    );

    await propertyRow.locator("button.cursor-pointer, button.w-full, div.cursor-pointer").first().click().catch(async () => {
      await propertyName.click();
    });
    await this.page.waitForTimeout(1000);

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

    const shortName = expectedPropertyName.split(",")[0].trim();

    // 1. Check if chatroom for this property or Agent is ALREADY open
    if (this.page.url().includes("/chat/")) {
      const chatContainer = this.page.locator(
        'main, [class*="chat-container"], [class*="chat_container"]'
      ).first();
      const chatText = await chatContainer.innerText().catch(() => "");
      if (new RegExp(shortName, "i").test(chatText) || /\bAgent\b/i.test(chatText)) {
        console.log(
          `Agent/Buyer conversation for "${expectedPropertyName}" is already open.`
        );
        return;
      }
    }

    console.log(
      `Opening latest Agent/Buyer conversation for: ${expectedPropertyName}`
    );

    // 2. Check if a direct unread conversation card is present at the top of the conversations page
    const topCard = this.page
      .locator('div[class*="cursor-pointer"], button[class*="cursor-pointer"], [role="button"]')
      .filter({ hasText: /\bAgent\b|Subrato/i })
      .filter({ hasText: /Counter offer|\$|negotiat/i })
      .first();

    if (await topCard.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log("Top unread conversation card found, clicking directly...");
      await topCard.click();
      const reachedChat = await this.page.waitForURL(/\/chat\//, { timeout: 10_000 }).then(() => true).catch(() => false);
      if (reachedChat) {
        console.log("Navigated to chatroom via top card:", this.page.url());
        return;
      }
    }

    // 3. Filter property list in sidebar if search input exists
    const searchInput = this.page
      .locator('input[placeholder*="Search by property title or address" i], input[placeholder*="search" i]')
      .first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log(`Filtering conversation list by: ${shortName}`);
      await searchInput.fill(shortName);
      await this.page.waitForTimeout(1000);
    }

    // 4. Expand the property card
    const propertyRow = await this.expandConversationList(expectedPropertyName);
    await this.page.waitForTimeout(1000);

    // 5. Click the Agent child chat (strictly matching Agent badge/role, excluding Broker)
    const agentChatButton = propertyRow
      .locator('button.cursor-pointer, button[class*="hover"], div[class*="cursor-pointer"]')
      .filter({ hasText: /\bAgent\b|Subrato/i })
      .filter({ hasNotText: /\bBroker\b/i })
      .first();

    if (await agentChatButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log("Agent child chat button found, clicking to open chat...");
      await agentChatButton.click();

      // Wait for navigation into /chat/
      const inChat = await this.page.waitForURL(/\/chat\//, { timeout: 15_000 }).then(() => true).catch(() => false);
      if (!inChat) {
        console.warn("URL did not change to /chat/, retrying force click on agent child button...");
        await agentChatButton.click({ force: true });
        await this.page.waitForURL(/\/chat\//, { timeout: 10_000 }).catch(() => {});
      }

      // Verify chat container / elements visible (NOT generic site navbar header)
      const chatTarget = this.page.locator(
        'main, [class*="chat-container"], [class*="chat_container"], textarea, input[placeholder*="message" i], button:has-text("Decline"), button:has-text("Counter")'
      ).first();
      await expect(
        chatTarget,
        `Chatroom with Agent for ${expectedPropertyName} should be open`
      ).toBeVisible({ timeout: 15_000 });
      return;
    }

    // Fallback: click propertyRow itself
    await propertyRow.click();
    await this.page.waitForURL(/\/chat\//, { timeout: 10_000 }).catch(() => {});
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
    if (!expectedPropertyName) {
      throw new Error(
        "expectedPropertyName is required to open Buyer conversation."
      );
    }

    const shortName = expectedPropertyName.split(",")[0].trim();

    // 1. Check if buyer chat for this property is ALREADY open on screen
    if (this.page.url().includes("/chat/")) {
      const chatContainer = this.page.locator(
        'main, [class*="chat-container"], [class*="chat_container"]'
      ).first();
      const chatText = await chatContainer.innerText().catch(() => "");
      if (new RegExp(shortName, "i").test(chatText) || /\bBuyer\b/i.test(chatText)) {
        console.log(
          `Buyer conversation for "${expectedPropertyName}" is already open.`
        );
        return;
      }
    }

    console.log(
      `Opening Buyer conversation for: ${expectedPropertyName}`
    );

    // Filter via sidebar search if present
    const searchInput = this.page
      .locator('input[placeholder*="Search by property title or address" i], input[placeholder*="search" i]')
      .first();
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchInput.fill(shortName);
      await this.page.waitForTimeout(1000);
    }

    // 2. Expand property row
    const propertyRow = await this.expandConversationList(expectedPropertyName);
    await this.page.waitForTimeout(1000);

    // 3. Specifically locate the Buyer child chat (excluding Agent and Broker)
    const buyerChatButton = propertyRow
      .locator('button.cursor-pointer, button[class*="hover"], div[class*="cursor-pointer"]')
      .filter({ hasText: /\bBuyer\b/i })
      .filter({ hasNotText: /\bAgent\b|\bBroker\b/i })
      .or(
        propertyRow
          .locator("button")
          .filter({ hasText: /Counter offer|offer|\$/i })
      )
      .first();

    if (await buyerChatButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log("Buyer child chat button found, clicking...");
      await buyerChatButton.click();

      const inChat = await this.page.waitForURL(/\/chat\//, { timeout: 15_000 }).then(() => true).catch(() => false);
      if (!inChat) {
        console.warn("URL did not change to /chat/, retrying force click on buyer child button...");
        await buyerChatButton.click({ force: true });
        await this.page.waitForURL(/\/chat\//, { timeout: 10_000 }).catch(() => {});
      }

      const chatTarget = this.page.locator(
        'main, [class*="chat-container"], [class*="chat_container"], textarea, input[placeholder*="message" i]'
      ).first();
      await expect(
        chatTarget,
        `Chat with Buyer for ${expectedPropertyName} should be open`
      ).toBeVisible({ timeout: 15_000 });
      return;
    }

    // Fallback: call openLatestAgentBuyerConversation
    await this.openLatestAgentBuyerConversation(expectedPropertyName);
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
    // If not in /chat/ yet, try navigating into chat first
    if (!this.page.url().includes("/chat/")) {
      console.warn("[declineNegotiation] Not on /chat/ page yet. URL:", this.page.url());
      const clickableChat = this.page
        .locator('button.cursor-pointer, div[class*="cursor-pointer"], [role="button"]')
        .filter({ hasText: /Counter offer|Agent|Subrato/i })
        .first();
      if (await clickableChat.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log("[declineNegotiation] Clicking conversation item to enter chat...");
        await clickableChat.click();
        await this.page.waitForURL(/\/chat\//, { timeout: 10_000 }).catch(() => {});
      }
    }

    // Wait for any loading spinner to detach first
    await this.page
      .locator('.animate-spin, svg.lucide-loader-2, [class*="loading"]')
      .first()
      .waitFor({ state: "hidden", timeout: 15_000 })
      .catch(() => {});

    const declineButton = this.page.getByRole("button", {
      name: "Decline",
      exact: true,
    }).or(
      this.page.locator('button:has-text("Decline")')
    ).first();

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

    // Some UIs show a confirmation dialog after clicking Decline: "Decline Offer"
    const confirmDeclineButton = this.page
      .getByRole("button", {
        name: /^Decline Offer$/i,
      })
      .or(
        this.page.getByRole("button", {
          name: /Decline Offer|Confirm/i,
        })
      )
      .or(
        this.page.locator('div[role="dialog"] button:has-text("Decline"), div[role="dialog"] button:has-text("Confirm")')
      )
      .first();

    const confirmVisible = await confirmDeclineButton
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (confirmVisible) {
      const isEnabled = await confirmDeclineButton
        .isEnabled()
        .catch(() => true);

      if (isEnabled) {
        await confirmDeclineButton.click();
        console.log("Decline confirmed in dialog");
      }
    } else {
      console.log("No confirmation dialog appeared, decline was direct");
    }

    await this.page.waitForTimeout(2000);
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
    const staleTimePattern = /\b(?:\d+\s*d(?:ays?)?\s*ago|\d+d\s*ago|\byesterday\b|\bweeks?\s*ago|\bmonths?\s*ago|\b\d{1,2}\/\d{1,2}\b)\b/i;
    const recentTimePattern = /(?:just now|few seconds ago|\b\d+\s*s(?:ec)?(?:onds)?\s*ago\b|\b[0-5]?\d\s*m(?:in)?(?:utes)?\s*ago\b|\btoday\b|\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?\b)/i;

    // Check for explicit declined status text with timestamp verification
    const statusRows = this.page
      .locator('div, tr, [class*="chat" i], [class*="message" i]')
      .filter({ hasText: expectedMessage });
    const count = await statusRows.count();
    for (let i = 0; i < count; i++) {
      const text = await statusRows.nth(i).innerText().catch(() => "");
      if (recentTimePattern.test(text) && !staleTimePattern.test(text)) {
        console.log(`[ConversationsPage] Buyer-side negotiation declined status confirmed with fresh timestamp: ${text.replace(/\n+/g, " ")}`);
        return;
      }
    }

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

    const isDirectlyVisible = await taskList.isVisible({ timeout: 5000 }).catch(() => false);

    if (isDirectlyVisible) {
      await expect(
        taskList,
        "Configure Progress Task List should be interactive/enabled"
      ).toBeEnabled({ timeout: 10_000 });

      console.log(
        "Configure Progress Task List is visible and interactive as expected."
      );
      return;
    }

    // Check right panel tabs: if Tasks or Progress tab is present, activate and verify task list
    const sideTab = this.page
      .getByRole("button", { name: /^Tasks$|^Progress$/i })
      .or(this.page.locator('button:has-text("Tasks"), button:has-text("Progress")'))
      .first();

    if (await sideTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sideTab.click();
      await this.page.waitForTimeout(1000);

      const sideTaskList = this.page
        .getByText(/Tasks & Requests|Property Progress|Task List|Configure Progress/i)
        .first();

      if (await sideTaskList.isVisible({ timeout: 10_000 }).catch(() => false)) {
        console.log("Task list / Progress verified in chat panel as expected.");
        return;
      }
    }

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

  getChatroomTab(tabName) {
    return this.page
      .locator('div[class*="border-[#E5E5E5]"], div[class*="overflow-x-auto"], [role="tablist"]')
      .locator("button")
      .filter({ hasText: new RegExp(`^\\s*${tabName}\\s*$`, "i") })
      .or(
        this.page
          .locator('div[class*="border-[#E5E5E5]"], div[class*="overflow-x-auto"]')
          .locator("button")
          .filter({ hasText: new RegExp(tabName, "i") })
      )
      .or(
        this.page
          .locator("button")
          .filter({ hasText: new RegExp(`^\\s*${tabName}\\s*$`, "i") })
      )
      .last();
  }

  async clickProgressTab() {
    console.log("Clicking Progress tab in chatroom...");
    const progressTab = this.getChatroomTab("Progress");

    await expect(
      progressTab,
      "Progress tab should be visible in chatroom"
    ).toBeVisible({ timeout: 15_000 });

    await progressTab.click();
    await this.page.waitForTimeout(1000);
    console.log("Progress tab clicked in chatroom");
  }

  async clickChatTab() {
    console.log("Clicking Chat/Messages tab in chatroom...");
    const chatTab = this.getChatroomTab("Chat")
      .or(this.getChatroomTab("Messages"))
      .first();

    if (await chatTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await chatTab.click();
      await this.page.waitForTimeout(800);
      console.log("Chat tab clicked in chatroom");
    }
  }

  async verifyProgressTasksNotVisibleWithPendingMessage() {
    console.log("Verifying progress tasks not visible and pending message displayed...");

    const pendingMessage = this.page.getByText(
      /Progress tasks will appear once an offer for this property is accepted/i
    );

    await expect(
      pendingMessage,
      'Message "Progress tasks will appear once an offer for this property is accepted." should be displayed'
    ).toBeVisible({ timeout: 15_000 });

    const taskList = this.getProgressTaskListLocator();
    const isTaskListVisible = await taskList.isVisible().catch(() => false);
    if (isTaskListVisible) {
      const isEnabled = await taskList.isEnabled().catch(() => false);
      if (isEnabled) {
        throw new Error(
          "Progress task list is visible and enabled before offer acceptance!"
        );
      }
    }

    console.log(
      "Verified: Progress task list is not visible and pending message is displayed"
    );
  }

  async verifyAssignedProgressTasksVisible() {
    console.log("Verifying assigned Configure Progress Task List appears in chatroom...");
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForTimeout(2000);

    // Ensure Progress tab is activated
    const progressTab = this.getChatroomTab("Progress");

    if (await progressTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await progressTab.click();
      await this.page.waitForTimeout(1000);
    }

    // Check if the chatroom needs a refresh to fetch the latest settlement progress
    const pendingMsg = this.page.getByText(
      /Progress tasks will appear once an offer for this property is accepted/i
    );
    const noSteps = this.page.getByText(/No progress steps available/i);

    if (
      (await pendingMsg.isVisible({ timeout: 3000 }).catch(() => false)) ||
      (await noSteps.isVisible({ timeout: 2000 }).catch(() => false))
    ) {
      console.log("Chatroom progress panel still showing pending/empty state, refreshing chat to sync settlement data...");
      await this.page.reload({ waitUntil: "domcontentloaded" });
      await this.page.waitForTimeout(3000);

      // Re-activate chat and progress tab if needed
      const reTab = this.getChatroomTab("Progress");
      if (await reTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await reTab.click();
        await this.page.waitForTimeout(1000);
      }
    }

    // Pending message MUST not be visible at this final stage
    await expect(
      pendingMsg,
      'Pending message "Progress tasks will appear once an offer for this property is accepted." should disappear after settlement is complete'
    ).not.toBeVisible({ timeout: 15_000 });

    const assignedTasks = this.page
      .getByText(
        /Deposit Paid|Standard Conveyancing Process|Final Inspection|Contract Signed|Overall Progress|Property Progress|Tasks & Requests|Configure Progress|10 stages|10 steps/i
      )
      .first();

    await expect(
      assignedTasks,
      "Assigned Configure Progress Task List / stages should automatically appear"
    ).toBeVisible({ timeout: 30_000 });

    console.log(
      "Assigned Configure Progress Task List automatically appeared as expected"
    );
  }

  /**
   * Verify a recent message in the active chatroom/conversation.
   * Strictly rejects messages with stale timestamps (e.g. 1 day ago, 2d ago, yesterday)
   * and accepts only fresh timestamps (just now, Xs ago, Xm ago, today, HH:MM clock time).
   */
  async verifyRecentMessage(expectedRegex, propertyName = null, timeoutMs = 20000) {
    const staleTimePattern = /\b(?:\d+\s*d(?:ays?)?\s*ago|\d+d\s*ago|\byesterday\b|\bweeks?\s*ago|\bmonths?\s*ago|\b\d{1,2}\/\d{1,2}\b)\b/i;
    const recentTimePattern = /(?:just now|few seconds ago|\b\d+\s*s(?:ec)?(?:onds)?\s*ago\b|\b[0-5]?\d\s*m(?:in)?(?:utes)?\s*ago\b|\btoday\b|\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?\b)/i;

    // Only click property item if NOT already in chat
    if (propertyName && !this.page.url().includes("/chat/")) {
      const propItem = this.page
        .locator('div[class*="cursor-pointer"], tr, li, button.cursor-pointer')
        .filter({ hasText: propertyName })
        .first();
      if (await propItem.isVisible({ timeout: 3000 }).catch(() => false)) {
        await propItem.click().catch(() => {});
        await this.page.waitForTimeout(1000);
      }
    }

    const pollStart = Date.now();
    while (Date.now() - pollStart < timeoutMs) {
      const chatRows = this.page
        .locator('main, [class*="chat-container"], [class*="chat_container"], div, tr, [class*="chat" i], [class*="message" i]')
        .filter({ hasText: expectedRegex });
      const count = await chatRows.count();
      for (let i = 0; i < count; i++) {
        const rowText = await chatRows.nth(i).innerText().catch(() => "");
        const isStale = staleTimePattern.test(rowText);
        const isRecent = recentTimePattern.test(rowText);
        if (isRecent && !isStale) {
          console.log(`[ConversationsPage] Confirmed RECENT chat message: ${rowText.replace(/\n+/g, " ")}`);
          return true;
        } else if (isStale) {
          console.warn(`[ConversationsPage] REJECTED stale chat message from past day: ${rowText.replace(/\n+/g, " ")}`);
        }
      }
      await this.page.waitForTimeout(1500);
    }
    return false;
  }
}

module.exports = {
  ConversationsPage,
};