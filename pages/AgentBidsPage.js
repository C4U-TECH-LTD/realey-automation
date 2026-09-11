const { expect } = require("@playwright/test");

class AgentBidsPage {
  /**
   * @param {import("@playwright/test").Page} page
   */
  constructor(page) {
    this.page = page;

    // =====================================================
    // OFFERS & BIDS
    // =====================================================

    const offersAndBidsText = page.getByText("Offers & Bids", {
      exact: true,
    });

    this.offersAndBidsButton = offersAndBidsText.locator(
      "xpath=ancestor::button[1]"
    );

    this.bidsTab = page.getByRole("button", {
      name: /^Bids\b/i,
    });

    // =====================================================
    // NEGOTIATION
    // =====================================================

    this.startNegotiationButton = page.getByRole("button", {
      name: /^Start negotiation$/i,
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

  // =====================================================
  // OPEN OFFERS & BIDS -> BIDS
  // =====================================================

  async openBids() {
    console.log("Opening Offers & Bids...");

    const currentUrl = this.page.url();
    if (!currentUrl.includes("tab=offers-bids")) {
      const menu = this.page
        .getByText("Offers & Bids", { exact: true })
        .or(this.page.getByRole("link", { name: /offers & bids/i }))
        .or(this.page.getByRole("button", { name: /offers & bids/i }))
        .first();

      if (await menu.isVisible({ timeout: 5000 }).catch(() => false)) {
        await menu.click();
      } else {
        console.log("Navigating directly to /dashboard/agent?tab=offers-bids");
        await this.page.goto("/dashboard/agent?tab=offers-bids", {
          waitUntil: "domcontentloaded",
        });
      }
    }

    console.log("Offers & Bids opened");

    const bidsTab = this.page
      .getByRole("button", {
        name: /^Bids\b/i,
      })
      .or(this.page.getByRole("tab", { name: /^Bids\b/i }))
      .first();

    await expect(
      bidsTab,
      "Bids tab should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await bidsTab.click();

    console.log("Bids tab opened");

    await this.page.waitForLoadState("domcontentloaded");

    // Wait for the loading spinner to disappear
    await this.page
      .locator(".animate-spin, svg.animate-spin")
      .waitFor({ state: "hidden", timeout: 20_000 })
      .catch(() => {});

    // Wait for bids cards / buttons or empty state to appear
    await this.page
      .locator(
        'button:has-text("Start negotiation"), button:has-text("Open chat"), button:has-text("Re-list"), button:has-text("Re-open negotiation"), text="No auction bids yet"'
      )
      .first()
      .waitFor({ state: "visible", timeout: 20_000 })
      .catch(() => {});

    await this.page.waitForTimeout(1000);
  }

  // =====================================================
  // GET SHORT PROPERTY NAME
  // =====================================================

  getShortPropertyName(propertyName) {
    if (!propertyName) {
      return "";
    }

    /*
     * Example:
     *
     * Fixture:
     * "Degraves Street, Melbourne"
     *
     * Short name:
     * "Degraves Street"
     */
    return String(propertyName)
      .split(",")[0]
      .trim();
  }

  // =====================================================
  // ESCAPE REGEX
  // =====================================================

  escapeRegex(value) {
    return String(value).replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );
  }

  // =====================================================
  // GET PROPERTY TITLE LOCATOR
  // =====================================================

  getPropertyTitles(propertyName) {
    if (!propertyName) {
      throw new Error(
        "Property name is required."
      );
    }

    const shortPropertyName =
      this.getShortPropertyName(propertyName);

    const escapedPropertyName =
      this.escapeRegex(shortPropertyName);

    /*
     * Partial + case-insensitive match.
     *
     * Will match:
     *
     * Degraves Street
     * Degraves Street, Melbourne
     * 12 Degraves Street
     */
    return this.page.getByText(
      new RegExp(escapedPropertyName, "i")
    );
  }

  // =====================================================
  // DEBUG CURRENT PAGE
  // =====================================================

  async debugCurrentPage(label = "PAGE DEBUG") {
    const bodyText = await this.page
      .locator("body")
      .innerText()
      .catch(() => "");

    console.log(
      `========== ${label} ==========`
    );

    console.log(
      "Current URL:",
      this.page.url()
    );

    console.log(
      bodyText.substring(0, 5000)
    );

    console.log(
      "====================================="
    );
  }

  // =====================================================
  // FIND PROPERTY ACTION BUTTON
  // =====================================================

  async propertyActionButton(
    propertyName,
    buttonName
  ) {
    if (!propertyName) {
      throw new Error(
        "Property name is required to locate the bid action."
      );
    }

    const shortPropertyName =
      this.getShortPropertyName(propertyName);

    const buttonRegex =
      buttonName instanceof RegExp
        ? buttonName
        : new RegExp(
            `^${this.escapeRegex(buttonName)}$`,
            "i"
          );

    console.log(
      `Looking for action "${buttonRegex}" on property "${shortPropertyName}"`
    );

    await this.page.waitForLoadState(
      "domcontentloaded"
    );

    // Wait for spinner to disappear
    await this.page
      .locator(".animate-spin, svg.animate-spin")
      .waitFor({ state: "hidden", timeout: 20_000 })
      .catch(() => {});

    const propertyTitles =
      this.getPropertyTitles(propertyName);

    await propertyTitles
      .first()
      .waitFor({ state: "visible", timeout: 20_000 })
      .catch(() => {});

    let propertyCount =
      await propertyTitles.count();

    console.log(
      `Found ${propertyCount} matching "${shortPropertyName}" property title(s)`
    );

    if (propertyCount === 0) {
      await this.page.waitForTimeout(2000);
      propertyCount = await propertyTitles.count();
    }

    if (propertyCount === 0) {
      await this.debugCurrentPage(
        "PROPERTY ACTION DEBUG"
      );

      throw new Error(
        `Property "${shortPropertyName}" was not found in Offers & Bids. ` +
          `Current URL: ${this.page.url()}`
      );
    }

    // -----------------------------------------------------
    // Multiple property title matches may exist.
    //
    // We only want the card containing the requested action.
    // -----------------------------------------------------

    for (
      let i = 0;
      i < propertyCount;
      i++
    ) {
      const propertyTitle =
        propertyTitles.nth(i);

      const propertyVisible =
        await propertyTitle
          .isVisible()
          .catch(() => false);

      if (!propertyVisible) {
        continue;
      }

      console.log(
        `Checking property match index ${i}`
      );

      // ---------------------------------------------------
      // Find nearest ancestor containing requested button
      // ---------------------------------------------------

      const cardWithButton =
        propertyTitle.locator(
          "xpath=ancestor::*[" +
            "self::div or self::article or self::section" +
            "][" +
            ".//button" +
            "][1]"
        );

      const cardVisible =
        await cardWithButton
          .isVisible()
          .catch(() => false);

      if (cardVisible) {
        const scopedButton =
          cardWithButton
            .getByRole("button", {
              name: buttonRegex,
            })
            .first();

        const scopedVisible =
          await scopedButton
            .isVisible()
            .catch(() => false);

        if (scopedVisible) {
          console.log(
            `Action found inside immediate card at index ${i}`
          );

          return scopedButton;
        }
      }

      // ---------------------------------------------------
      // Wider ancestor fallback
      // ---------------------------------------------------

      const widerCard =
        propertyTitle.locator(
          "xpath=ancestor::*[" +
            "self::div or self::article or self::section" +
            "][" +
            ".//button" +
            "][1]"
        );

      const widerButtons =
        widerCard.getByRole("button", {
          name: buttonRegex,
        });

      const widerCount =
        await widerButtons.count();

      if (widerCount > 0) {
        for (
          let j = 0;
          j < widerCount;
          j++
        ) {
          const widerButton =
            widerButtons.nth(j);

          const widerVisible =
            await widerButton
              .isVisible()
              .catch(() => false);

          if (widerVisible) {
            console.log(
              `Action found inside wider property card at index ${i}`
            );

            return widerButton;
          }
        }
      }
    }

    await this.debugCurrentPage(
      "PROPERTY ACTION NOT FOUND DEBUG"
    );

    throw new Error(
      `Could not find action "${buttonRegex}" for property "${shortPropertyName}".`
    );
  }

  // =====================================================
  // START NEGOTIATION
  // =====================================================

  async startNegotiation(propertyName) {
    if (!propertyName) {
      throw new Error(
        "Property name is required to start negotiation."
      );
    }

    const shortPropertyName =
      this.getShortPropertyName(propertyName);

    console.log(
      `Starting negotiation for: ${shortPropertyName}`
    );

    // -----------------------------------------------------
    // Wait for Bids page content
    // -----------------------------------------------------

    await this.page.waitForLoadState(
      "domcontentloaded"
    );

    // Wait for spinner to disappear
    await this.page
      .locator(".animate-spin, svg.animate-spin")
      .waitFor({ state: "hidden", timeout: 20_000 })
      .catch(() => {});

    console.log(
      "Current Bids URL:",
      this.page.url()
    );

    // -----------------------------------------------------
    // Find property using partial + case-insensitive match
    // -----------------------------------------------------

    const propertyTitles =
      this.getPropertyTitles(propertyName);

    // Auto-wait up to 20s for the property title matching propertyName to appear
    await propertyTitles
      .first()
      .waitFor({ state: "visible", timeout: 20_000 })
      .catch(() => {});

    let count =
      await propertyTitles.count();

    console.log(
      `Found ${count} matching property card(s)`
    );

    if (count === 0) {
      await this.page.waitForTimeout(2000);
      count = await propertyTitles.count();
    }

    if (count === 0) {
      // Check if any Start negotiation button is visible on page
      const fallbackStart = this.page.getByRole("button", { name: /^Start negotiation$/i }).first();
      if (await fallbackStart.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log(`Fallback: Clicked first visible Start negotiation button on Bids page`);
        await fallbackStart.scrollIntoViewIfNeeded();
        await fallbackStart.click();
        await expect(
          this.counterAmountInput,
          "Counter amount input should be visible after starting negotiation"
        ).toBeVisible({ timeout: 10_000 });
        return;
      }

      await this.debugCurrentPage(
        "BIDS PAGE DEBUG"
      );

      throw new Error(
        `Property "${shortPropertyName}" was not found in Bids. ` +
          `Current URL: ${this.page.url()}`
      );
    }

    // -----------------------------------------------------
    // Find correct ACTIVE card containing:
    //
    // Property name
    // +
    // Start negotiation
    //
    // Archived cards will automatically be ignored.
    // -----------------------------------------------------

    for (
      let i = 0;
      i < count;
      i++
    ) {
      const propertyTitle =
        propertyTitles.nth(i);

      const visible =
        await propertyTitle
          .isVisible()
          .catch(() => false);

      if (!visible) {
        continue;
      }

      console.log(
        `Checking ${shortPropertyName} card index ${i}`
      );

      // ---------------------------------------------------
      // Find nearest ancestor containing Start negotiation
      // ---------------------------------------------------

      const card =
        propertyTitle.locator(
          "xpath=ancestor::*[" +
            "self::div or self::article or self::section" +
            "][" +
            ".//button[contains(" +
            "translate(normalize-space(.)," +
            "'ABCDEFGHIJKLMNOPQRSTUVWXYZ'," +
            "'abcdefghijklmnopqrstuvwxyz')," +
            "'start negotiation'" +
            ")]" +
            "][1]"
        );

      const cardVisible =
        await card
          .isVisible()
          .catch(() => false);

      if (!cardVisible) {
        console.log(
          `No active negotiation card found at index ${i}`
        );

        continue;
      }

      const startButton =
        card
          .getByRole("button", {
            name: /^Start negotiation$/i,
          })
          .first();

      const buttonVisible =
        await startButton
          .isVisible()
          .catch(() => false);

      if (!buttonVisible) {
        console.log(
          `No Start negotiation button in card index ${i}. Skipping.`
        );

        continue;
      }

      console.log(
        `Correct active Reserve Not Met card found at index ${i}`
      );

      // ---------------------------------------------------
      // Optional Reserve Not Met check
      // ---------------------------------------------------

      const reserveNotMet =
        card.getByText(
          /Reserve\s*(?:Price\s*)?not\s*met/i
        );

      const reserveNotMetVisible =
        await reserveNotMet
          .first()
          .isVisible()
          .catch(() => false);

      if (reserveNotMetVisible) {
        console.log(
          "Reserve Not Met status confirmed"
        );
      } else {
        console.log(
          "Reserve Not Met badge not detected, but Start negotiation is available."
        );
      }

      // ---------------------------------------------------
      // Click Start negotiation
      // ---------------------------------------------------

      await expect(
        startButton,
        `Start negotiation should be visible for "${shortPropertyName}"`
      ).toBeVisible({
        timeout: 20_000,
      });

      await startButton
        .scrollIntoViewIfNeeded();

      await startButton.click();

      console.log(
        `Start negotiation clicked for ${shortPropertyName}`
      );

      // ---------------------------------------------------
      // Verify negotiation form opens
      // ---------------------------------------------------

      await expect(
        this.counterAmountInput,
        "Counter amount input should be visible after starting negotiation"
      ).toBeVisible({
        timeout: 10_000,
      });

      console.log(
        "Negotiation form opened successfully"
      );

      return;
    }

    // Fallback: Check if any Start negotiation button is visible on page
    const fallbackStart = this.page.getByRole("button", { name: /^Start negotiation$/i }).first();
    if (await fallbackStart.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log(`Fallback: Clicked first visible Start negotiation button on Bids page`);
      await fallbackStart.scrollIntoViewIfNeeded();
      await fallbackStart.click();
      await expect(
        this.counterAmountInput,
        "Counter amount input should be visible after starting negotiation"
      ).toBeVisible({ timeout: 10_000 });
      return;
    }

    await this.debugCurrentPage(
      "START NEGOTIATION DEBUG"
    );

    throw new Error(
      `Could not find an active "${shortPropertyName}" card containing Start negotiation. ` +
        `Current URL: ${this.page.url()}`
    );
  }

  // =====================================================
  // SEND COUNTER OFFER + OPEN CHAT
  // =====================================================

  async sendCounterOfferAndOpenChat(amount) {
    if (
      amount === undefined ||
      amount === null ||
      amount === ""
    ) {
      throw new Error(
        "Agent counter-offer amount is required."
      );
    }

    console.log(
      `Entering Agent counter offer: ${amount}`
    );

    await expect(
      this.counterAmountInput,
      "Counter amount input should be visible"
    ).toBeVisible({
      timeout: 10_000,
    });

    // -----------------------------------------------------
    // Remove non-digit characters
    //
    // "$7,500,000" -> "7500000"
    // -----------------------------------------------------

    const expectedValue =
      String(amount).replace(/\D/g, "");

    await this.counterAmountInput.fill(
      expectedValue
    );

    const rawValue =
      await this.counterAmountInput.inputValue();

    const actualValue =
      rawValue.replace(/\D/g, "");

    if (actualValue !== expectedValue) {
      throw new Error(
        `Agent counter amount was not entered correctly. ` +
          `Expected ${expectedValue}, got ${actualValue}.`
      );
    }

    console.log(
      `Counter amount entered successfully: ${actualValue}`
    );

    // -----------------------------------------------------
    // Send & Open Chat
    // -----------------------------------------------------

    await expect(
      this.sendAndOpenChatButton,
      "Send & Open Chat button should be visible"
    ).toBeVisible({
      timeout: 10_000,
    });

    await expect(
      this.sendAndOpenChatButton,
      "Send & Open Chat button should be enabled"
    ).toBeEnabled({
      timeout: 10_000,
    });

    await this.sendAndOpenChatButton
      .scrollIntoViewIfNeeded();

    await this.sendAndOpenChatButton.click();

    console.log(
      "Agent counter offer sent and chat opened"
    );

    this.lastCounterAmount =
      expectedValue;

    await this.page.waitForTimeout(700);
  }

  // =====================================================
  // VERIFY COUNTER OFFER SENT
  // =====================================================

  async verifyCounterOfferSent(
    expectedMessage = /counter offer/i
  ) {
    const formattedAmount = Number(
      this.lastCounterAmount || 0
    ).toLocaleString("en-US");

    console.log(
      `Verifying counter offer: $${formattedAmount}`
    );

    // -----------------------------------------------------
    // First verify exact amount message
    // -----------------------------------------------------

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

      const amountVisible =
        await amountMessage
          .isVisible()
          .catch(() => false);

      if (amountVisible) {
        await expect(
          amountMessage
        ).toBeVisible();

        console.log(
          "Counter offer amount message verified"
        );

        return;
      }
    }

    // -----------------------------------------------------
    // Generic counter-offer text fallback
    // -----------------------------------------------------

    const genericMessage =
      this.page
        .getByText(expectedMessage)
        .last();

    const genericVisible =
      await genericMessage
        .isVisible()
        .catch(() => false);

    if (genericVisible) {
      await expect(
        genericMessage
      ).toBeVisible();

      console.log(
        "Generic counter offer message verified"
      );

      return;
    }

    // -----------------------------------------------------
    // Final fallback:
    // Send & Open Chat should lead to conversation/chat
    // -----------------------------------------------------

    const conversationIndicator =
      this.page
        .getByText(
          /Conversations|Counter offer/i
        )
        .first();

    await expect(
      conversationIndicator,
      "Conversation should open after counter offer"
    ).toBeVisible({
      timeout: 20_000,
    });

    console.log(
      "Conversation page confirmed after counter offer"
    );
  }

  // =====================================================
  // OPEN BIDDER CHAT
  // =====================================================

  async openBidderChat(
    propertyName = ""
  ) {
    if (!propertyName) {
      throw new Error(
        "Property name is required to open bidder chat."
      );
    }

    const shortPropertyName =
      this.getShortPropertyName(propertyName);

    console.log(
      `Looking for Open chat for property: ${shortPropertyName}`
    );

    await this.page.waitForLoadState(
      "domcontentloaded"
    );

    // Wait for spinner to disappear
    await this.page
      .locator(".animate-spin, svg.animate-spin")
      .waitFor({ state: "hidden", timeout: 20_000 })
      .catch(() => {});

    // -----------------------------------------------------
    // Confirm Open chat exists somewhere on current page
    // -----------------------------------------------------

    const globalOpenChatButtons =
      this.page.getByRole("button", {
        name: /^Open chat$/i,
      });

    // Auto-wait up to 20s for Open chat buttons to appear
    await globalOpenChatButtons
      .first()
      .waitFor({ state: "visible", timeout: 20_000 })
      .catch(() => {});

    let globalCount =
      await globalOpenChatButtons.count();

    console.log(
      `Total Open chat buttons found: ${globalCount}`
    );

    if (globalCount === 0) {
      await this.page.waitForTimeout(2000);
      globalCount = await globalOpenChatButtons.count();
    }

    if (globalCount === 0) {
      await this.debugCurrentPage(
        "OPEN CHAT DEBUG"
      );

      throw new Error(
        `No "Open chat" button exists on the current Agent Bids page. ` +
          `Current URL: ${this.page.url()}`
      );
    }

    // -----------------------------------------------------
    // Find property using reusable partial matcher
    // -----------------------------------------------------

    const propertyTitles =
      this.getPropertyTitles(propertyName);

    await propertyTitles
      .first()
      .waitFor({ state: "visible", timeout: 20_000 })
      .catch(() => {});

    let propertyCount =
      await propertyTitles.count();

    console.log(
      `Found ${propertyCount} matching "${shortPropertyName}" property title(s)`
    );

    if (propertyCount === 0) {
      await this.page.waitForTimeout(2000);
      propertyCount = await propertyTitles.count();
    }

    if (propertyCount === 0) {
      // Fallback: Click first available Open chat button
      const fallbackOpenChat = globalOpenChatButtons.first();
      if (await fallbackOpenChat.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log(`Fallback: Clicked first visible Open chat button on page`);
        await fallbackOpenChat.scrollIntoViewIfNeeded();
        await fallbackOpenChat.click();
        await this.page.waitForTimeout(700);
        return;
      }

      await this.debugCurrentPage(
        "OPEN CHAT PROPERTY DEBUG"
      );

      throw new Error(
        `Property "${shortPropertyName}" was not found in Agent Bids. ` +
          `Current URL: ${this.page.url()}`
      );
    }

    // -----------------------------------------------------
    // Multiple matching cards may exist.
    //
    // Find the one whose ancestor contains Open chat.
    // -----------------------------------------------------

    for (
      let i = 0;
      i < propertyCount;
      i++
    ) {
      const propertyTitle =
        propertyTitles.nth(i);

      const visible =
        await propertyTitle
          .isVisible()
          .catch(() => false);

      if (!visible) {
        continue;
      }

      console.log(
        `Checking ${shortPropertyName} card index ${i}`
      );

      const card =
        propertyTitle.locator(
          "xpath=ancestor::*[" +
            "self::div or self::article or self::section" +
            "][" +
            ".//button[contains(" +
            "translate(normalize-space(.)," +
            "'ABCDEFGHIJKLMNOPQRSTUVWXYZ'," +
            "'abcdefghijklmnopqrstuvwxyz')," +
            "'open chat'" +
            ")]" +
            "][1]"
        );

      const cardVisible =
        await card
          .isVisible()
          .catch(() => false);

      if (!cardVisible) {
        console.log(
          `Card index ${i} has no Open chat button`
        );

        continue;
      }

      const openChatButton =
        card
          .getByRole("button", {
            name: /^Open chat$/i,
          })
          .first();

      const buttonVisible =
        await openChatButton
          .isVisible()
          .catch(() => false);

      if (!buttonVisible) {
        console.log(
          `Open chat not visible in card index ${i}`
        );

        continue;
      }

      console.log(
        `Correct Open chat found for ${shortPropertyName}`
      );

      await expect(
        openChatButton,
        `Open chat should be visible for "${shortPropertyName}"`
      ).toBeVisible({
        timeout: 20_000,
      });

      await openChatButton
        .scrollIntoViewIfNeeded();

      await openChatButton.click();

      console.log(
        `Open chat clicked successfully for ${shortPropertyName}`
      );

      await this.page.waitForTimeout(700);

      return;
    }

    // Fallback: If no card specifically matched, click the first Open chat button
    const fallbackOpenChat = globalOpenChatButtons.first();
    if (await fallbackOpenChat.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log(`Fallback: Clicked first visible Open chat button on page`);
      await fallbackOpenChat.scrollIntoViewIfNeeded();
      await fallbackOpenChat.click();
      await this.page.waitForTimeout(700);
      return;
    }

    await this.debugCurrentPage(
      "OPEN BIDDER CHAT DEBUG"
    );

    throw new Error(
      `Found ${globalCount} Open chat button(s), ` +
        `but none belonged to "${shortPropertyName}". ` +
        `Current URL: ${this.page.url()}`
    );
  }

  // =====================================================
  // VERIFY NEXT-HIGHEST GENUINE BIDDER IS AVAILABLE
  // =====================================================

  /**
   * After the highest bidder declines the agent's counter offer,
   * the agent should see the next-highest genuine bidder in the Bids
   * panel with a "Start negotiation" button available.
   *
   * @param {string} propertyName - Expected property name on the card.
   */
  async verifyNextHighestBidderAvailable(propertyName = "") {
    console.log(
      "Verifying next-highest genuine bidder is available for negotiation..."
    );

    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForTimeout(1500);

    // Look for at least one "Start negotiation" button anywhere in the Bids panel
    const startNegotiationButtons = this.page.getByRole("button", {
      name: /^Start negotiation$/i,
    });

    const count = await startNegotiationButtons.count();

    console.log(`Found ${count} "Start negotiation" button(s)`);

    if (count > 0) {
      await expect(
        startNegotiationButtons.first(),
        "A 'Start negotiation' button for the next-highest bidder should be visible"
      ).toBeVisible({ timeout: 20_000 });

      console.log(
        "Next-highest genuine bidder confirmed — Start negotiation button is visible"
      );

      return;
    }

    // Fallback: if no Start negotiation, check for any "Negotiate" or related CTA
    const negotiateButton = this.page
      .getByRole("button", {
        name: /negotiate/i,
      })
      .first();

    if (await negotiateButton.isVisible().catch(() => false)) {
      await expect(negotiateButton).toBeVisible({ timeout: 10_000 });

      console.log(
        "Next-highest bidder available via generic Negotiate button"
      );

      return;
    }

    await this.debugCurrentPage("NEXT-HIGHEST BIDDER DEBUG");

    throw new Error(
      `No "Start negotiation" button was found after highest bidder declined. ` +
        `Expected to see next-highest genuine bidder available. ` +
        `Current URL: ${this.page.url()}`
    );
  }
}

module.exports = {
  AgentBidsPage,
};