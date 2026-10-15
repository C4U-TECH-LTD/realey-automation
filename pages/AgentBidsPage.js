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

    // Wait for bids cards / buttons to appear (do NOT treat temporary "No auction bids yet" placeholder as loaded)
    await this.page
      .locator(
        'button:has-text("Start negotiation"), button:has-text("Open chat"), button:has-text("Re-list"), button:has-text("Re-open negotiation")'
      )
      .first()
      .waitFor({ state: "visible", timeout: 20_000 })
      .catch(() => {});

    // Clear any leftover search filter so view is fresh
    const searchInputs = this.page.locator(
      'input[placeholder*="Search by address" i], input[placeholder*="Search by property" i], input[placeholder*="search" i]'
    );
    if (await searchInputs.first().isVisible().catch(() => false)) {
      const val = await searchInputs.first().inputValue().catch(() => "");
      if (val) {
        await searchInputs.first().fill("");
        await searchInputs.first().press("Enter").catch(() => {});
        await this.page.waitForTimeout(500);
      }
    }

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
  // FILTER BIDS BY ADDRESS / SEARCH
  // =====================================================

  async filterByAddress(propertyName) {
    const shortPropertyName = this.getShortPropertyName(propertyName);
    if (!shortPropertyName) {
      return;
    }

    // Realey backend searches against `street` or `suburb`, which do not include street numbers.
    // Strip leading house number (e.g. "78 Elizabeth Street" -> "Elizabeth Street").
    const streetName = shortPropertyName.replace(/^\d+[\s\/-]*/, "").trim();
    const searchTerm = streetName || shortPropertyName;

    const searchInputs = this.page.locator(
      'input[placeholder*="Search by address" i], input[placeholder*="Search by property" i], input[placeholder*="search" i]'
    );

    const count = await searchInputs.count();
    for (let i = 0; i < count; i++) {
      const input = searchInputs.nth(i);
      if (await input.isVisible().catch(() => false)) {
        console.log(`Filtering Bids page by: "${searchTerm}"`);
        await input.fill(searchTerm);
        await input.press("Enter").catch(() => {});
        await this.page.waitForTimeout(1500);
        await this.page
          .locator('.animate-spin, svg.animate-spin, [class*="animate-spin"]')
          .waitFor({ state: "hidden", timeout: 10_000 })
          .catch(() => {});
        break;
      }
    }
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

    const streetName = shortPropertyName.replace(/^\d+[\s\/-]*/, "").trim();
    if (streetName && streetName !== shortPropertyName) {
      const escapedStreet = this.escapeRegex(streetName);
      return this.page.getByText(
        new RegExp(`(?:${escapedPropertyName}|${escapedStreet})`, "i")
      );
    }

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

    // Check if card matching propertyName with action button is already visible before filtering
    const initialTitles = this.getPropertyTitles(propertyName);
    const initialCount = await initialTitles.count();
    for (let i = 0; i < initialCount; i++) {
      const propertyTitle = initialTitles.nth(i);
      if (!await propertyTitle.isVisible().catch(() => false)) continue;

      const card = propertyTitle.locator(
        "xpath=ancestor::*[contains(@class, 'bg-card') or contains(@class, 'rounded') or contains(@class, 'border')][1]"
      );
      if (await card.isVisible().catch(() => false)) {
        const scopedButton = card.getByRole("button", { name: buttonRegex }).first();
        if (await scopedButton.isVisible().catch(() => false)) {
          console.log(`Action "${buttonRegex}" already visible for "${shortPropertyName}" before filtering.`);
          return scopedButton;
        }
      }
    }

    await this.filterByAddress(propertyName);

    await this.page.waitForLoadState(
      "domcontentloaded"
    );

    // Wait for spinner to disappear
    await this.page
      .locator(".animate-spin, svg.animate-spin")
      .waitFor({ state: "hidden", timeout: 20_000 })
      .catch(() => {});

    const maxPages = 5;
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const propertyTitles = this.getPropertyTitles(propertyName);
      const propertyCount = await propertyTitles.count();

      for (let i = 0; i < propertyCount; i++) {
        const propertyTitle = propertyTitles.nth(i);
        if (!await propertyTitle.isVisible().catch(() => false)) continue;

        const cardWithButton = propertyTitle.locator(
          "xpath=ancestor::*[contains(@class, 'bg-card') or contains(@class, 'rounded') or contains(@class, 'border')][1]"
        );

        if (await cardWithButton.isVisible().catch(() => false)) {
          const scopedButton = cardWithButton
            .getByRole("button", { name: buttonRegex })
            .first();

          if (await scopedButton.isVisible().catch(() => false)) {
            console.log(`Action "${buttonRegex}" found on page ${pageNum} for "${shortPropertyName}".`);
            return scopedButton;
          }
        }
      }

      // Check Next page
      const nextBtn = this.page
        .getByRole("button", { name: /^Next$/i })
        .or(this.page.locator('button:has(svg.lucide-chevron-right)'))
        .or(this.page.locator('button[aria-label*="next" i]'))
        .first();
      if (await nextBtn.isVisible().catch(() => false) && await nextBtn.isEnabled().catch(() => false)) {
        console.log(`[AgentBidsPage] Checking next page (${pageNum + 1}) for action "${buttonRegex}"...`);
        await nextBtn.scrollIntoViewIfNeeded().catch(() => {});
        await nextBtn.click();
        await this.page.waitForTimeout(2000);
      } else {
        break;
      }
    }

    // Fallback: check any visible button with buttonRegex on page
    const fallbackButton = this.page.getByRole("button", { name: buttonRegex }).first();
    if (await fallbackButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log(`Fallback: Found action "${buttonRegex}" on page`);
      return fallbackButton;
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

  async _findAndClickStartNegotiation(propertyName, targetBidderName = null, maxPages = 5) {
    const shortPropertyName = this.getShortPropertyName(propertyName);

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      console.log(`[AgentBidsPage] Checking Bids page ${pageNum} for "${shortPropertyName}"...`);

      const propertyTitles = this.getPropertyTitles(propertyName);
      const count = await propertyTitles.count();

      for (let i = 0; i < count; i++) {
        const propertyTitle = propertyTitles.nth(i);
        if (!await propertyTitle.isVisible().catch(() => false)) continue;

        let card = propertyTitle.locator(
          "xpath=ancestor::*[.//button[contains(., 'Start negotiation')]][1]"
        );
        if (!await card.isVisible().catch(() => false)) {
          card = propertyTitle.locator(
            "xpath=ancestor::*[contains(@class, 'bg-card') or contains(@class, 'rounded') or contains(@class, 'border')][1]"
          );
        }
        if (!await card.isVisible().catch(() => false)) continue;

        let startButton = null;
        if (targetBidderName) {
          const bidderRow = card
            .locator("div, tr, li, section")
            .filter({ hasText: new RegExp(targetBidderName, "i") });
          const bidderBtn = bidderRow
            .getByRole("button", { name: /^Start negotiation$/i })
            .first();
          if (await bidderBtn.isVisible().catch(() => false)) {
            startButton = bidderBtn;
          }
        }
        if (!startButton) {
          const highestBidderRow = card
            .locator("div, tr, li, section")
            .filter({ hasText: /highest bidder/i });
          const highestBidderBtn = highestBidderRow
            .getByRole("button", { name: /^Start negotiation$/i })
            .first();
          if (await highestBidderBtn.isVisible().catch(() => false)) {
            startButton = highestBidderBtn;
          }
        }
        if (!startButton) {
          startButton = card
            .getByRole("button", { name: /^Start negotiation$/i })
            .first();
        }

        if (startButton && await startButton.isVisible().catch(() => false)) {
          console.log(`Active Reserve Not Met card found on page ${pageNum} for ${shortPropertyName}`);
          await startButton.scrollIntoViewIfNeeded();
          await startButton.click();
          console.log(`Start negotiation clicked for ${shortPropertyName}`);
          await expect(
            this.counterAmountInput,
            "Counter amount input should be visible after starting negotiation"
          ).toBeVisible({ timeout: 15_000 });
          console.log("Negotiation form opened successfully");
          return true;
        }
      }

      // Check Next page
      const nextBtn = this.page
        .getByRole("button", { name: /^Next$/i })
        .or(this.page.locator('button:has(svg.lucide-chevron-right)'))
        .or(this.page.locator('button[aria-label*="next" i]'))
        .first();
      if (await nextBtn.isVisible().catch(() => false) && await nextBtn.isEnabled().catch(() => false)) {
        await nextBtn.scrollIntoViewIfNeeded().catch(() => {});
        await nextBtn.click();
        await this.page.waitForTimeout(2000);
        await this.page
          .locator(".animate-spin, svg.animate-spin")
          .waitFor({ state: "hidden", timeout: 10_000 })
          .catch(() => {});
      } else {
        break;
      }
    }
    return false;
  }

  async startNegotiation(propertyName, targetBidderName = null) {
    if (!propertyName) {
      throw new Error("Property name is required to start negotiation.");
    }

    const shortPropertyName = this.getShortPropertyName(propertyName);
    console.log(
      `Starting negotiation for: ${shortPropertyName}${targetBidderName ? ` (target bidder: ${targetBidderName})` : ""}`
    );

    await this.page.waitForLoadState("domcontentloaded");
    await this.page
      .locator(".animate-spin, svg.animate-spin")
      .waitFor({ state: "hidden", timeout: 20_000 })
      .catch(() => {});

    // Stage 1: Check unfiltered Bids list across pages (1..5) first
    console.log(`Checking unfiltered Bids pages for "${shortPropertyName}"...`);
    let found = await this._findAndClickStartNegotiation(propertyName, targetBidderName, 5);
    if (found) return;

    // Stage 2: Filter by street name without house number (matches backend DB street column)
    const streetName = shortPropertyName.replace(/^\d+[\s\/-]*/, "").trim();
    if (streetName) {
      console.log(`Filtering Bids page by street name: "${streetName}"`);
      await this.openBids();
      await this.filterByAddress(streetName);
      found = await this._findAndClickStartNegotiation(propertyName, targetBidderName, 5);
      if (found) return;
    }

    // Stage 3: Filter by full shortPropertyName
    if (streetName && streetName !== shortPropertyName) {
      console.log(`Not found by street name, filtering Bids page by: "${shortPropertyName}"`);
      await this.openBids();
      await this.filterByAddress(shortPropertyName);
      found = await this._findAndClickStartNegotiation(propertyName, targetBidderName, 5);
      if (found) return;
    }

    // Stage 4: Filter by suburb if available
    const parts = String(propertyName).split(",");
    if (parts.length > 1) {
      const suburb = parts[1].trim();
      if (suburb) {
        console.log(`Filtering Bids page by suburb: "${suburb}"`);
        await this.openBids();
        await this.filterByAddress(suburb);
        found = await this._findAndClickStartNegotiation(propertyName, targetBidderName, 5);
        if (found) return;
      }
    }

    // Fallback: Check if any Start negotiation button is visible on current view (or reopen Bids)
    let fallbackStartButtons = this.page
      .getByRole("button", { name: /^Start negotiation$/i })
      .or(this.page.locator('button:has-text("Start negotiation")'));
    let fallbackCount = await fallbackStartButtons.count();
    if (fallbackCount === 0) {
      await this.openBids().catch(() => {});
      fallbackStartButtons = this.page
        .getByRole("button", { name: /^Start negotiation$/i })
        .or(this.page.locator('button:has-text("Start negotiation")'));
      fallbackCount = await fallbackStartButtons.count();
    }
    for (let f = 0; f < fallbackCount; f++) {
      const btn = fallbackStartButtons.nth(f);
      if (await btn.isVisible().catch(() => false)) {
        console.log(`Fallback: Clicked Start negotiation button index ${f} on Bids page`);
        await btn.scrollIntoViewIfNeeded().catch(() => {});
        await btn.click();
        await expect(
          this.counterAmountInput,
          "Counter amount input should be visible after starting negotiation"
        ).toBeVisible({ timeout: 10_000 });
        return;
      }
    }

    await this.debugCurrentPage("START NEGOTIATION DEBUG");

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

    // Wait for the modal dialog to disappear (request submitted)
    const counterModal = this.page
      .locator('[role="dialog"]')
      .filter({ hasText: /Counter Offer/i })
      .first();
    await counterModal.waitFor({ state: "hidden", timeout: 20_000 }).catch(() => {});

    // Wait for chat navigation and view to load
    await this.page.waitForURL(/tab=conversations|\/chat\//, { timeout: 20_000 }).catch(() => {});
    await this.page.waitForLoadState("domcontentloaded");

    await this.page
      .locator('.animate-spin, svg.animate-spin, [class*="animate-spin"]')
      .waitFor({ state: "hidden", timeout: 15_000 })
      .catch(() => {});

    console.log(
      "Agent counter offer sent and chat opened"
    );

    this.lastCounterAmount =
      expectedValue;

    await this.page.waitForTimeout(1500);
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

    // Ensure we are inside the chatroom
    await this.page.waitForURL(/tab=conversations|\/chat\//, { timeout: 15_000 }).catch(() => {});

    // Wait for chat message container or input to confirm chat view is active
    const chatInput = this.page.locator(
      'textarea[placeholder*="message" i], textarea, input[placeholder*="message" i]'
    ).first();
    await chatInput.waitFor({ state: "visible", timeout: 15_000 }).catch(() => {});

    const staleTimePattern = /\b(?:\d+\s*d(?:ays?)?\s*ago|\d+d\s*ago|\byesterday\b|\bweeks?\s*ago|\bmonths?\s*ago|\b\d{1,2}\/\d{1,2}\b)\b/i;
    const recentTimePattern = /(?:just now|few seconds ago|\b\d+\s*s(?:ec)?(?:onds)?\s*ago\b|\b[0-5]?\d\s*m(?:in)?(?:utes)?\s*ago\b|\btoday\b|\b\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?\b)/i;

    const targetPattern = formattedAmount !== "0"
      ? new RegExp(`\\$${formattedAmount}|Counter offer`, "i")
      : expectedMessage;

    // Check chat message bubbles
    const chatRows = this.page.locator('div, tr, [class*="chat" i], [class*="message" i]').filter({ hasText: targetPattern });
    const count = await chatRows.count();
    for (let i = 0; i < count; i++) {
      const text = await chatRows.nth(i).innerText().catch(() => "");
      if (recentTimePattern.test(text) && !staleTimePattern.test(text)) {
        console.log(`[AgentBidsPage] Verified fresh counter-offer timestamp in chat: ${text.replace(/\n+/g, " ")}`);
        return;
      }
    }

    if (formattedAmount !== "0") {
      const amountMessage =
        this.page
          .getByText(
            new RegExp(
              `\\$${formattedAmount}`,
              "i"
            )
          )
          .last();

      const amountVisible =
        await amountMessage
          .isVisible({ timeout: 10_000 })
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

    // Helper to find and click Open chat across pages
    const findAndClickOpenChat = async (maxPages = 5) => {
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const propertyTitles = this.getPropertyTitles(propertyName);
        const propertyCount = await propertyTitles.count();

        for (let i = 0; i < propertyCount; i++) {
          const propertyTitle = propertyTitles.nth(i);
          if (!await propertyTitle.isVisible().catch(() => false)) continue;

          let card = propertyTitle.locator(
            "xpath=ancestor::*[.//button[contains(., 'Open chat')]][1]"
          );
          if (!await card.isVisible().catch(() => false)) {
            card = propertyTitle.locator(
              "xpath=ancestor::*[contains(@class, 'bg-card') or contains(@class, 'rounded') or contains(@class, 'border')][1]"
            );
          }

          if (await card.isVisible().catch(() => false)) {
            const openChatButton = card.getByRole("button", { name: /^Open chat$/i }).first();
            if (await openChatButton.isVisible().catch(() => false)) {
              console.log(`Open chat button found on page ${pageNum} for "${shortPropertyName}".`);
              await openChatButton.scrollIntoViewIfNeeded();
              await openChatButton.click();
              await this.page.waitForURL(/tab=conversations|\/chat\//, { timeout: 15_000 }).catch(() => {});
              await this.page.waitForLoadState("domcontentloaded");
              await this.page
                .locator('.animate-spin, svg.animate-spin, [class*="animate-spin"], [class*="loading"]')
                .waitFor({ state: "hidden", timeout: 15_000 })
                .catch(() => {});
              await this.page.waitForTimeout(1000);
              return true;
            }
          }
        }

        const nextBtn = this.page
          .getByRole("button", { name: /^Next$/i })
          .or(this.page.locator('button:has(svg.lucide-chevron-right)'))
          .or(this.page.locator('button[aria-label*="next" i]'))
          .first();
        if (await nextBtn.isVisible().catch(() => false) && await nextBtn.isEnabled().catch(() => false)) {
          console.log(`[AgentBidsPage] Checking next page (${pageNum + 1}) for Open chat...`);
          await nextBtn.scrollIntoViewIfNeeded().catch(() => {});
          await nextBtn.click();
          await this.page.waitForTimeout(2000);
          await this.page
            .locator('.animate-spin, svg.animate-spin, [class*="animate-spin"]')
            .waitFor({ state: "hidden", timeout: 10_000 })
            .catch(() => {});
        } else {
          break;
        }
      }
      return false;
    };

    // Stage 1: Check unfiltered list across pages (1..5) first
    let found = await findAndClickOpenChat(5);
    if (found) return;

    // Stage 2: Filter by street name without house number
    const streetName = shortPropertyName.replace(/^\d+[\s\/-]*/, "").trim();
    if (streetName) {
      console.log(`Filtering Bids page by street name for Open chat: "${streetName}"`);
      await this.openBids();
      await this.filterByAddress(streetName);
      found = await findAndClickOpenChat(5);
      if (found) return;
    }

    // Stage 3: Filter by full shortPropertyName
    if (streetName && streetName !== shortPropertyName) {
      console.log(`Filtering Bids page by full address for Open chat: "${shortPropertyName}"`);
      await this.openBids();
      await this.filterByAddress(shortPropertyName);
      found = await findAndClickOpenChat(5);
      if (found) return;
    }

    // Reset to fresh Bids Page 1 before attempting fallback
    await this.openBids();

    // Fallback: Click first available Open chat button on page
    const fallbackOpenChat = this.page.getByRole("button", { name: /^Open chat$/i }).first();
    if (await fallbackOpenChat.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log(`Fallback: Clicked first visible Open chat button on page`);
      await fallbackOpenChat.scrollIntoViewIfNeeded();
      await fallbackOpenChat.click();
      await this.page.waitForURL(/tab=conversations|\/chat\//, { timeout: 15_000 }).catch(() => {});
      await this.page.waitForLoadState("domcontentloaded");
      await this.page
        .locator('.animate-spin, svg.animate-spin, [class*="animate-spin"], [class*="loading"]')
        .waitFor({ state: "hidden", timeout: 15_000 })
        .catch(() => {});
      await this.page.waitForTimeout(1000);
      return;
    }

    await this.debugCurrentPage(
      "OPEN BIDDER CHAT DEBUG"
    );

    throw new Error(
      `Could not find an active Open chat button for "${shortPropertyName}". ` +
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
      `Verifying next-highest genuine bidder is available for negotiation (property: "${propertyName}")...`
    );

    await this.page.waitForLoadState("domcontentloaded");

    // Wait for any spinner or temporary "No auction bids yet" placeholder to clear
    await this.page
      .locator('.animate-spin, svg.animate-spin, [class*="animate-spin"]')
      .waitFor({ state: "hidden", timeout: 20_000 })
      .catch(() => {});

    await this.page
      .getByText("No auction bids yet")
      .waitFor({ state: "hidden", timeout: 15_000 })
      .catch(() => {});

    // If propertyName is provided, find and scope to the property's bids card
    if (propertyName) {
      await this.filterByAddress(propertyName);
      const shortPropertyName = this.getShortPropertyName(propertyName);
      const propertyTitles = this.getPropertyTitles(propertyName);

      const titleAppeared = await propertyTitles
        .first()
        .waitFor({ state: "visible", timeout: 30_000 })
        .then(() => true)
        .catch(() => false);

      if (titleAppeared) {
        console.log(`Property "${shortPropertyName}" card is visible in Bids.`);
        const propertyCard = propertyTitles
          .first()
          .locator("xpath=ancestor::*[self::div or self::article or self::section][.//button][1]");

        const scopedStartBtn = propertyCard
          .getByRole("button", { name: /^Start negotiation$/i })
          .or(propertyCard.locator('button:has-text("Start negotiation")'))
          .first();

        if (await scopedStartBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
          await expect(
            scopedStartBtn,
            `Start negotiation button for next-highest bidder should be visible on "${shortPropertyName}"`
          ).toBeVisible();
          console.log(`Next-highest genuine bidder confirmed on property "${shortPropertyName}" card!`);
          return;
        }
      }
    }

    // Global fallback: wait up to 30s for any "Start negotiation" button in the Bids panel
    const startNegotiationButtons = this.page
      .getByRole("button", {
        name: /^Start negotiation$/i,
      })
      .or(
        this.page.locator('button:has-text("Start negotiation")')
      );

    await expect(
      startNegotiationButtons.first(),
      "A 'Start negotiation' button for the next-highest genuine bidder should be visible in Bids"
    ).toBeVisible({ timeout: 30_000 });

    console.log(
      "Next-highest genuine bidder confirmed — Start negotiation button is visible"
    );
  }
}

module.exports = {
  AgentBidsPage,
};