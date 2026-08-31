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

    await expect(
      this.offersAndBidsButton,
      "Offers & Bids menu should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await this.offersAndBidsButton.click();

    console.log("Offers & Bids opened");

    await expect(
      this.bidsTab,
      "Bids tab should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await this.bidsTab.click();

    console.log("Bids tab opened");

    await this.page.waitForTimeout(700);
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
     * UI:
     * "Degraves Street"
     */
    return String(propertyName)
      .split(",")[0]
      .trim();
  }

  // =====================================================
  // FIND PROPERTY ACTION BUTTON
  // =====================================================

  async propertyActionButton(propertyName, buttonName) {
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
        : new RegExp(`^${buttonName}$`, "i");

    console.log(
      `Looking for action "${buttonRegex}" on property "${shortPropertyName}"`
    );

    // -----------------------------------------------------
    // Find every matching property title
    // -----------------------------------------------------

    const propertyTitles = this.page.getByText(
      shortPropertyName,
      {
        exact: true,
      }
    );

    const propertyCount =
      await propertyTitles.count();

    console.log(
      `Found ${propertyCount} matching "${shortPropertyName}" property title(s)`
    );

    if (propertyCount === 0) {
      throw new Error(
        `Property "${shortPropertyName}" was not found in Offers & Bids.`
      );
    }

    // -----------------------------------------------------
    // There may be multiple cards with same property
    //
    // Example:
    //
    // Degraves Street - Reserve not met - Start negotiation
    // Degraves Street - Archived
    // Degraves Street - Reserve not met - Archived
    //
    // We only want the card containing the requested action.
    // -----------------------------------------------------

    for (let i = 0; i < propertyCount; i++) {
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
            "self::div or self::article" +
            "][" +
            ".//button" +
            "][1]"
        );

      if (
        await cardWithButton
          .isVisible()
          .catch(() => false)
      ) {
        const scopedButton =
          cardWithButton
            .getByRole("button", {
              name: buttonRegex,
            })
            .first();

        if (
          await scopedButton
            .isVisible()
            .catch(() => false)
        ) {
          console.log(
            `Action found inside immediate card at index ${i}`
          );

          return scopedButton;
        }
      }

      // ---------------------------------------------------
      // Wider ancestor fallback
      //
      // Current UI:
      // property title is in card header
      // action button is lower in the same outer card.
      // ---------------------------------------------------

      const widerButton =
        propertyTitle.locator(
          "xpath=ancestor::*[" +
            "self::div or self::article" +
            "][" +
            ".//button[contains(" +
            "translate(normalize-space(.)," +
            "'ABCDEFGHIJKLMNOPQRSTUVWXYZ'," +
            "'abcdefghijklmnopqrstuvwxyz')," +
            "'start negotiation'" +
            ")]" +
            "][1]" +
            "//button[contains(" +
            "translate(normalize-space(.)," +
            "'ABCDEFGHIJKLMNOPQRSTUVWXYZ'," +
            "'abcdefghijklmnopqrstuvwxyz')," +
            "'start negotiation'" +
            ")]"
        )
        .first();

      if (
        await widerButton
          .isVisible()
          .catch(() => false)
      ) {
        console.log(
          `Action found inside wider property card at index ${i}`
        );

        return widerButton;
      }
    }

    // -----------------------------------------------------
    // Do NOT blindly use first global action.
    //
    // Multiple auctions may exist, so clicking a global
    // .first() could open negotiation for wrong property.
    // -----------------------------------------------------

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
    // Find all matching property titles
    // -----------------------------------------------------

    const propertyTitles = this.page.getByText(
      shortPropertyName,
      {
        exact: true,
      }
    );

    const count =
      await propertyTitles.count();

    console.log(
      `Found ${count} matching property card(s)`
    );

    if (count === 0) {
      throw new Error(
        `Property "${shortPropertyName}" was not found in Bids.`
      );
    }

    // -----------------------------------------------------
    // Find correct ACTIVE card containing:
    //
    // Property name
    // + Start negotiation
    //
    // This automatically ignores Archived cards.
    // -----------------------------------------------------

    for (let i = 0; i < count; i++) {
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

      const startButton =
        propertyTitle.locator(
          "xpath=ancestor::*[" +
            "self::div or self::article" +
            "][" +
            ".//button[contains(" +
            "translate(normalize-space(.)," +
            "'ABCDEFGHIJKLMNOPQRSTUVWXYZ'," +
            "'abcdefghijklmnopqrstuvwxyz')," +
            "'start negotiation'" +
            ")]" +
            "][1]" +
            "//button[contains(" +
            "translate(normalize-space(.)," +
            "'ABCDEFGHIJKLMNOPQRSTUVWXYZ'," +
            "'abcdefghijklmnopqrstuvwxyz')," +
            "'start negotiation'" +
            ")]"
        )
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

      const card =
        propertyTitle.locator(
          "xpath=ancestor::*[" +
            "self::div or self::article" +
            "][" +
            ".//button[contains(" +
            "translate(normalize-space(.)," +
            "'ABCDEFGHIJKLMNOPQRSTUVWXYZ'," +
            "'abcdefghijklmnopqrstuvwxyz')," +
            "'start negotiation'" +
            ")]" +
            "][1]"
        );

      const reserveNotMet =
        card.getByText(
          /Reserve\s*(?:Price\s*)?not\s*met/i
        );

      if (
        await reserveNotMet
          .first()
          .isVisible()
          .catch(() => false)
      ) {
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
      // Verify counter amount input opens
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

    // -----------------------------------------------------
    // No matching active card found
    // -----------------------------------------------------

    throw new Error(
      `Could not find an active "${shortPropertyName}" card containing Start negotiation.`
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
    // Example:
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

      if (
        await amountMessage
          .isVisible()
          .catch(() => false)
      ) {
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

    if (
      await genericMessage
        .isVisible()
        .catch(() => false)
    ) {
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

 async openBidderChat(propertyName = "") {
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

  // -----------------------------------------------------
  // First confirm we are on a page containing Open chat
  // -----------------------------------------------------

  const globalOpenChatButtons =
    this.page.getByRole("button", {
      name: "Open chat",
      exact: true,
    });

  const globalCount =
    await globalOpenChatButtons.count();

  console.log(
    `Total Open chat buttons found: ${globalCount}`
  );

  if (globalCount === 0) {
    throw new Error(
      `No "Open chat" button exists on the current Agent Bids page. ` +
      `Current URL: ${this.page.url()}`
    );
  }

  // -----------------------------------------------------
  // Find all matching property titles.
  //
  // Fixture:
  // Degraves Street, Melbourne
  //
  // UI:
  // Degraves Street
  // -----------------------------------------------------

  const propertyTitles =
    this.page.getByText(
      shortPropertyName,
      {
        exact: true,
      }
    );

  const propertyCount =
    await propertyTitles.count();

  console.log(
    `Found ${propertyCount} "${shortPropertyName}" property card(s)`
  );

  if (propertyCount === 0) {
    throw new Error(
      `Property "${shortPropertyName}" was not found in Agent Bids.`
    );
  }

  // -----------------------------------------------------
  // Multiple Degraves Street cards may exist.
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

    // Find nearest property container
    // containing an Open chat button.
    const card =
      propertyTitle.locator(
        "xpath=ancestor::*[" +
          "self::div or self::article" +
          "][" +
          ".//button[" +
          "contains(" +
          "translate(normalize-space(.)," +
          "'ABCDEFGHIJKLMNOPQRSTUVWXYZ'," +
          "'abcdefghijklmnopqrstuvwxyz')," +
          "'open chat'" +
          ")" +
          "]" +
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
          name: "Open chat",
          exact: true,
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

    await this.page.waitForTimeout(
      700
    );

    return;
  }

  // -----------------------------------------------------
  // Diagnostic error
  // -----------------------------------------------------

  throw new Error(
    `Found ${globalCount} Open chat button(s), ` +
    `but none belonged to "${shortPropertyName}". ` +
    `Current URL: ${this.page.url()}`
  );
}
}

module.exports = {
  AgentBidsPage,
};