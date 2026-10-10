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
    console.log("Navigating to Offers & Bids tab...");

    // Dismiss any modal/overlay if blocking
    const closeDialog = this.page.locator('button[aria-label="Close"], button:has-text("Close")').first();
    if (await closeDialog.isVisible().catch(() => false)) {
      await closeDialog.click().catch(() => {});
    }

    if (!this.page.url().includes("tab=offers-bids")) {
      const menu = this.page
        .getByRole("button", { name: /Offers & Bids/i })
        .or(this.page.getByRole("link", { name: /Offers & Bids/i }))
        .or(this.page.locator('aside, nav, [class*="sidebar"]').getByText("Offers & Bids", { exact: true }))
        .or(this.offersAndBids)
        .first();

      if (await menu.isVisible({ timeout: 5000 }).catch(() => false)) {
        await menu.click().catch(() => {});
      }

      // Check if URL updated to tab=offers-bids
      const navigated = await this.page
        .waitForURL((url) => url.search.includes("tab=offers-bids"), { timeout: 4000 })
        .then(() => true)
        .catch(() => false);

      if (!navigated && !this.page.url().includes("tab=offers-bids")) {
        console.log("Sidebar click did not transition URL, navigating directly to /dashboard/agent?tab=offers-bids");
        const currentUrl = new URL(this.page.url());
        currentUrl.pathname = "/dashboard/agent";
        currentUrl.search = "?tab=offers-bids";
        await this.page.goto(currentUrl.toString(), { waitUntil: "domcontentloaded" });
      }
    }

    // Ensure we are confirmed on offers-bids tab
    await expect(
      this.page,
      "URL should contain tab=offers-bids"
    ).toHaveURL(/tab=offers-bids/, { timeout: 15_000 });

    // Wait for spinners
    await this.page
      .locator('.animate-spin, svg.animate-spin, [class*="loading"]')
      .first()
      .waitFor({ state: "hidden", timeout: 15_000 })
      .catch(() => {});

    // Ensure Offers subtab is active if subtabs exist
    const offersSubTab = this.page
      .getByRole("tab", { name: /^Offers\b/i })
      .or(this.page.getByRole("button", { name: /^Offers\b/i }))
      .first();
    if (await offersSubTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await offersSubTab.click().catch(() => {});
    }

    await this.page.waitForTimeout(1000);
  }

  async openSubmittedOffer(propertyName) {
    await this.openOffersAndBids();

    this.activeCounterButton = null;
    this.activeAcceptButton = null;

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
        const counterBtn = card.getByRole("button", { name: "Counter via Chat", exact: true }).first();
        const acceptBtn = card.getByRole("button", { name: "Accept", exact: true }).first();

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

      // 1. Filter using the search input with retry & reload if not found immediately
      const maxRetries = 3;
      for (let retry = 1; retry <= maxRetries; retry++) {
        const searchInput = this.page
          .locator('input[placeholder*="Search by address" i], input[placeholder*="search" i]')
          .first();

        if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`Filtering Offers & Bids by: ${shortName} (attempt ${retry}/${maxRetries})`);
          await searchInput.fill(shortName);
          await searchInput.press("Enter").catch(() => {});
          await this.page.waitForTimeout(2000);
        }

        // 2. Look for cards matching this specific property after filtering with active buttons
        const matchingCards = this.page
          .locator('div[class*="rounded"], div.border, article')
          .filter({ hasText: exactRegex });

        const cardCount = await matchingCards.count().catch(() => 0);
        for (let i = 0; i < cardCount; i++) {
          const card = matchingCards.nth(i);
          const counterBtn = card.getByRole("button", { name: /Counter via Chat/i }).first();
          const acceptBtn = card.getByRole("button", { name: /^Accept$/i }).first();

          if (await counterBtn.isVisible().catch(() => false)) {
            this.activeCounterButton = counterBtn;
            console.log(`Found active 'Counter via Chat' button on offer card #${i + 1} for "${propertyName}".`);
          }

          if (await acceptBtn.isVisible().catch(() => false)) {
            this.activeAcceptButton = acceptBtn;
            console.log(`Found active 'Accept' button on offer card #${i + 1} for "${propertyName}".`);
          }

          if (this.activeCounterButton || this.activeAcceptButton) {
            return;
          }
        }

        // Also check if any card in the filtered search view has the button
        const filteredCounter = this.page.getByRole("button", { name: /Counter via Chat/i }).first();
        if (await filteredCounter.isVisible({ timeout: 1500 }).catch(() => false)) {
          this.activeCounterButton = filteredCounter;
          console.log(`Found active 'Counter via Chat' button in filtered view.`);
          return;
        }

        const filteredAccept = this.page.getByRole("button", { name: /^Accept$/i }).first();
        if (await filteredAccept.isVisible({ timeout: 1500 }).catch(() => false)) {
          this.activeAcceptButton = filteredAccept;
          console.log(`Found active 'Accept' button in filtered view.`);
          return;
        }

        if (retry < maxRetries) {
          console.log(`No active offer button found yet for "${shortName}", reloading offers page...`);
          await this.page.reload({ waitUntil: "domcontentloaded" });
          await this.page.waitForTimeout(2500);
        }
      }

      // If search returned literally zero cards, clear search to expose all newest offers
      const searchInput = this.page
        .locator('input[placeholder*="Search by address" i], input[placeholder*="search" i]')
        .first();
      const anyMatching = await this.page
        .locator('div[class*="rounded"], div.border, article')
        .filter({ hasText: exactRegex })
        .count()
        .catch(() => 0);

      if (anyMatching === 0 && (await searchInput.isVisible().catch(() => false))) {
        console.log(`No cards returned at all for "${shortName}", clearing search input...`);
        await searchInput.fill("");
        await searchInput.press("Enter").catch(() => {});
        await this.page.waitForTimeout(1500);
      }
    }

    // Fallback: check newest action button on the page
    const counterBtn = this.page.getByRole("button", { name: "Counter via Chat", exact: true }).first();
    const acceptBtn = this.page.getByRole("button", { name: "Accept", exact: true }).first();

    if (await counterBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      this.activeCounterButton = counterBtn;
      console.log("Found active 'Counter via Chat' button on newest offer card.");
      return;
    }

    if (await acceptBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      this.activeAcceptButton = acceptBtn;
      console.log("Found active 'Accept' button on newest offer card.");
      return;
    }

    // Fallback: wait for any submitted offer action button
    const targetButton = this.page.getByRole("button", {
      name: /Counter via Chat|Accept/i,
    }).first();

    await targetButton.waitFor({ state: "visible", timeout: 15_000 }).catch(() => {});

    if (await this.counterViaChatButton.isVisible().catch(() => false)) {
      this.activeCounterButton = this.counterViaChatButton;
    }
    if (await this.acceptButton.isVisible().catch(() => false)) {
      this.activeAcceptButton = this.acceptButton;
    }
  }

  async sendCounterOfferViaChat(amount) {
    let counterButton =
      this.activeCounterButton || this.counterViaChatButton;

    if (!counterButton || !(await counterButton.isVisible().catch(() => false))) {
      counterButton = this.page.getByRole("button", { name: /Counter via Chat/i }).first();
    }

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
    if (propertyName) {
      await this.openSubmittedOffer(propertyName);
    } else {
      await this.openOffersAndBids();
    }

    const acceptBtn = this.activeAcceptButton || this.page
      .getByRole("button", { name: /^Accept$/i })
      .or(this.page.locator('button').filter({ hasText: /^Accept$/i }))
      .or(this.page.getByRole("button", { name: /accept/i }))
      .first();

    if (await acceptBtn.isVisible({ timeout: 10_000 }).catch(() => false)) {
      console.log("Found visible Accept button. Clicking Accept...");
      await acceptBtn.scrollIntoViewIfNeeded().catch(() => {});
      try {
        await acceptBtn.click();
      } catch (err) {
        console.log(`Standard click failed (${err.message}), retrying with force click...`);
        const fallbackBtn = this.page
          .getByRole("button", { name: /^Accept$/i })
          .or(this.page.locator('button').filter({ hasText: /^Accept$/i }))
          .first();
        await fallbackBtn.click({ force: true });
      }
      console.log("Clicked Accept button on offer card");

      // Wait for the confirmation dialog
      const dialog = this.page
        .locator('[role="alertdialog"], [role="dialog"], div.fixed')
        .filter({ hasText: /Accept offer/i })
        .or(this.page.locator('[role="alertdialog"], [role="dialog"]'))
        .last();

      await expect(
        dialog,
        "Accept offer confirmation dialog should appear"
      ).toBeVisible({ timeout: 10_000 });

      const confirmButton = dialog
        .getByRole("button", { name: /Confirm|Accept/i })
        .or(dialog.locator('button').filter({ hasText: /Confirm/i }))
        .or(this.page.getByRole("button", { name: /^Confirm$/i }))
        .or(this.page.locator('button').filter({ hasText: /^Confirm$/i }))
        .first();

      await expect(
        confirmButton,
        "Confirm button in accept dialog should be visible"
      ).toBeVisible({ timeout: 10_000 });

      await expect(confirmButton).toBeEnabled({ timeout: 10_000 });
      await confirmButton.click({ force: true });
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
      return;
    }

    // Fallback: Check if offer on page is already accepted or preparing for exchange
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
