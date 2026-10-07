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
      const shortName = propertyName.split(",")[0].trim();
      const escaped = shortName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const exactRegex = new RegExp(`(?:^|\\D)${escaped}(?:\\D|$)`, "i");

      // Check if matching card with active action button is already visible before searching
      const initialCards = this.page
        .locator('div[class*="rounded"], div.border, article')
        .filter({ hasText: exactRegex });

      const initialCount = await initialCards.count().catch(() => 0);
      for (let i = 0; i < initialCount; i++) {
        const card = initialCards.nth(i);
        const counterBtn = card.getByRole("button", { name: "Counter via Chat", exact: true });
        const acceptBtn = card.getByRole("button", { name: "Accept", exact: true });

        if (await counterBtn.isVisible().catch(() => false)) {
          this.activeCounterButton = counterBtn;
          console.log(`Found active 'Counter via Chat' button on initial card #${i + 1} for "${propertyName}".`);
          return;
        }
        if (await acceptBtn.isVisible().catch(() => false)) {
          this.activeAcceptButton = acceptBtn;
          console.log(`Found active 'Accept' button on initial card #${i + 1} for "${propertyName}".`);
          return;
        }
      }

      // 1. Filter using the search input if not found immediately
      const searchInput = this.page
        .locator('input[placeholder*="Search by address" i], input[placeholder*="search" i]')
        .first();

      if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log(`Filtering Offers & Bids by: ${shortName}`);
        await searchInput.fill(shortName);
        await searchInput.press("Enter");
        await this.page.waitForTimeout(2000);
      }

      // 2. Look for cards matching this specific property after filtering with active buttons
      const matchingCards = this.page
        .locator('div[class*="rounded"], div.border, article')
        .filter({ hasText: exactRegex });

      const cardCount = await matchingCards.count().catch(() => 0);
      for (let i = 0; i < cardCount; i++) {
        const card = matchingCards.nth(i);
        const counterBtn = card.getByRole("button", { name: "Counter via Chat", exact: true });
        const acceptBtn = card.getByRole("button", { name: "Accept", exact: true });

        if (await counterBtn.isVisible().catch(() => false)) {
          this.activeCounterButton = counterBtn;
          console.log(`Found active 'Counter via Chat' button on offer card #${i + 1} for "${propertyName}".`);
          return;
        }

        if (await acceptBtn.isVisible().catch(() => false)) {
          this.activeAcceptButton = acceptBtn;
          console.log(`Found active 'Accept' button on offer card #${i + 1} for "${propertyName}".`);
          return;
        }
      }

      // 3. Only if no active button was found on any card, check if already accepted
      for (let i = 0; i < cardCount; i++) {
        const card = matchingCards.nth(i);
        const alreadyAccepted = await card
          .getByText(/accepted|preparing for contract exchange/i)
          .or(card.getByRole("button", { name: "Re-list", exact: true }))
          .first()
          .isVisible({ timeout: 500 })
          .catch(() => false);
        if (alreadyAccepted) {
          console.log(`Matching offer card #${i + 1} for "${propertyName}" is already accepted.`);
          this.isOfferAlreadyAccepted = true;
          return;
        }
      }

      // If search returned 0 cards, clear search to expose all newest offers
      if (cardCount === 0 && (await searchInput.isVisible().catch(() => false))) {
        console.log(`No cards found for "${shortName}", clearing search input...`);
        await searchInput.fill("");
        await searchInput.press("Enter");
        await this.page.waitForTimeout(1500);
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
    console.log("Verifying 'Counter Offer Sent' confirmation message on upper right...");

    // 1. Verify confirmation message "Counter Offer Sent" on upper right
    const counterOfferSentToast = this.page
      .locator('[data-sonner-toast], [role="status"], [class*="toast" i], div.fixed')
      .getByText(/Counter Offer Sent/i)
      .or(this.page.getByText(/Counter Offer Sent/i))
      .first();

    await expect(
      counterOfferSentToast,
      "Confirmation message 'Counter Offer Sent' should be displayed on upper right"
    ).toBeVisible({ timeout: 15_000 });

    console.log("Confirmation message 'Counter Offer Sent' confirmed on upper right.");

    // 2. Verify redirect to chat URL
    console.log("Verifying redirect to chat URL...");
    await this.page.waitForURL(
      (url) => url.pathname.includes("/chat") || url.search.includes("tab=conversations"),
      { timeout: 20_000 }
    );

    console.log("Redirected to chat successfully:", this.page.url());
  }

  async acceptSubmittedOffer(propertyName) {
    if (this.isOfferAlreadyAccepted) {
      console.log("Offer was already accepted, skipping accept button click.");
      return;
    }

    if (propertyName) {
      await this.openSubmittedOffer(propertyName);
    } else {
      await this.openOffersAndBids();
    }

    if (this.isOfferAlreadyAccepted) {
      console.log("Offer was already accepted after opening, skipping accept button click.");
      return;
    }

    const acceptBtn = this.activeAcceptButton || this.acceptButton;

    if (await acceptBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await acceptBtn.click();
      console.log("Clicked Accept button on offer card");

      // Wait for the confirmation dialog
      const dialog = this.page.locator('[role="dialog"]').last();
      await expect(
        dialog,
        "Accept offer confirmation dialog should appear"
      ).toBeVisible({ timeout: 10_000 });

      const confirmButton = dialog.getByRole("button", {
        name: /Confirm/i,
      });

      await expect(
        confirmButton,
        "Confirm button in accept dialog should be visible"
      ).toBeVisible({ timeout: 10_000 });

      await expect(confirmButton).toBeEnabled({ timeout: 10_000 });
      await confirmButton.click();
      console.log("Clicked Confirm button in accept offer dialog");

      // Wait for dialog to close
      await expect(
        dialog,
        "Accept offer dialog should close after confirmation"
      ).toBeHidden({ timeout: 15_000 });

      // Wait for success toast or settlement creation confirmation
      const toast = this.page.getByText(/Offer Accepted!|settlement has been created/i).first();
      await toast.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
      await this.page.waitForTimeout(1000);
    } else {
      // Check if offer on page is already accepted or preparing for exchange
      const acceptedTarget = this.page
        .getByText(/offer accepted|accepted|preparing for contract exchange/i)
        .or(this.page.getByRole("button", { name: "Copy Settlement Link" }))
        .first();

      await expect(
        acceptedTarget,
        "Offer should show Accepted state or Accept button should be visible"
      ).toBeVisible({ timeout: 15_000 });

      console.log("Offer was already in accepted state on Offers & Bids page.");
    }
  }

  async verifyAccepted(expectedMessage) {
    // 1. Check for success toast
    const toast = this.page
      .getByText(/Offer Accepted!|settlement has been created/i)
      .first();

    if (await toast.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log("Offer accepted toast confirmed");
      return;
    }

    // 2. Check that the offer card shows accepted state or settlement options
    const acceptedTarget = this.page
      .getByText(expectedMessage || /Offer accepted|preparing for contract exchange/i)
      .or(this.page.getByRole("button", { name: "Copy Settlement Link" }))
      .first();

    await expect(
      acceptedTarget,
      "Offer should show Accepted state or settlement options"
    ).toBeVisible({ timeout: 15_000 });

    console.log("Offer acceptance verified successfully on Agent side");
  }
}

module.exports = {
  AgentOffersPage,
};
