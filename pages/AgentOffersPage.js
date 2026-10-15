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
      const streetOnly = shortName.replace(/^\d+[\s\/-]*/, "").trim();
      const escapedShort = shortName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const escapedStreet = streetOnly ? streetOnly.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";
      const exactRegex = new RegExp(`(?:^|\\D)${escapedShort}(?:\\D|$)`, "i");

      const inspectCard = async (card, label) => {
        if (!await card.isVisible().catch(() => false)) return false;
        await card.scrollIntoViewIfNeeded().catch(() => {});

        const acceptBtn = card.getByRole("button", { name: /^Accept$/i }).or(card.locator('button').filter({ hasText: /^Accept/i })).first();
        const counterBtn = card.getByRole("button", { name: /Counter via Chat/i }).or(card.locator('button').filter({ hasText: /Counter via Chat/i })).first();

        let hasAccept = await acceptBtn.isVisible().catch(() => false);
        let hasCounter = await counterBtn.isVisible().catch(() => false);

        if (!hasAccept && !hasCounter) {
          const cardText = await card.innerText().catch(() => "");
          if (!/accepted|preparing for contract exchange/i.test(cardText)) {
            const accordionToggle = card.locator('button:has-text("offer"), button:has-text("Offer"), button:has-text("offers"), button:has-text("Offers"), button:has(svg.lucide-chevron-down), svg.lucide-chevron-down').first();
            if (await accordionToggle.isVisible().catch(() => false)) {
              console.log(`Attempting to expand offer accordion on card (${label})...`);
              await accordionToggle.click().catch(() => {});
              await this.page.waitForTimeout(1000);
              hasAccept = await acceptBtn.isVisible().catch(() => false);
              hasCounter = await counterBtn.isVisible().catch(() => false);
            }
          }
        }

        if (hasAccept) {
          this.activeAcceptButton = acceptBtn;
          console.log(`Found active 'Accept' button (${label}).`);
        }
        if (hasCounter) {
          this.activeCounterButton = counterBtn;
          console.log(`Found active 'Counter via Chat' button (${label}).`);
        }

        return Boolean(hasAccept || hasCounter);
      };

      const scanCards = async () => {
        // Priority 1: Direct cards matching exact unique address (e.g. "203 Bourke Street")
        const exactCards = this.page
          .locator('div[class*="rounded"], div.border, article')
          .filter({ hasText: exactRegex });
        const exactCount = await exactCards.count().catch(() => 0);
        for (let i = 0; i < exactCount; i++) {
          if (await inspectCard(exactCards.nth(i), `exact: "${shortName}"`)) return true;
        }

        // Priority 2: Text elements matching exact unique address
        const matchingElements = this.page.getByText(exactRegex);
        const elCount = await matchingElements.count().catch(() => 0);
        for (let i = 0; i < elCount; i++) {
          const el = matchingElements.nth(i);
          const card = el.locator('xpath=ancestor::*[contains(@class, "rounded") or contains(@class, "border") or contains(@class, "bg-card")][last()]');
          if (await inspectCard(card, `exact ancestor: "${shortName}"`)) return true;
        }

        return false;
      };

      const scanStreetFallback = async () => {
        if (!streetOnly) return false;
        const streetRegex = new RegExp(`(?:^|\\D)${escapedStreet}(?:\\D|$)`, "i");
        const streetCards = this.page
          .locator('div[class*="rounded"], div.border, article')
          .filter({ hasText: streetRegex });
        const count = await streetCards.count().catch(() => 0);
        for (let s = 0; s < count; s++) {
          if (await inspectCard(streetCards.nth(s), `street fallback: "${streetOnly}"`)) return true;
        }
        return false;
      };

      // 1. Check if matching card is already visible on current page
      if (await scanCards()) return;

      // 1b. If not immediately visible, wait briefly and reload once to account for backend indexing delay
      console.log(`Offer for "${propertyName}" not immediately visible on page 1. Waiting 3s and reloading...`);
      await this.page.waitForTimeout(3000);
      await this.page.reload({ waitUntil: "domcontentloaded" });
      await this.page.waitForTimeout(2000);
      if (await scanCards()) return;

      // 2. Search by street name (backend matches street name, suburb, or buyer; street numbers yield 0)
      const streetName = shortName.replace(/^\d+[\s\/-]*/, "").trim();
      const searchTerms = [
        streetName,
        "Daniel"
      ].filter(Boolean);

      for (const term of searchTerms) {
        const searchInput = this.page
          .locator('input[placeholder*="Search by address" i], input[placeholder*="search" i]')
          .first();

        if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`Searching Offers & Bids by: "${term}"...`);
          await searchInput.click();
          await searchInput.fill("");
          await searchInput.fill(term);
          await searchInput.dispatchEvent("input").catch(() => {});
          await searchInput.press("Enter").catch(() => {});
          const searchBtn = searchInput
            .locator('xpath=following-sibling::button | ancestor::div[1]//button')
            .filter({ has: this.page.locator('svg.lucide-search') })
            .first();
          if (await searchBtn.isVisible().catch(() => false)) {
            await searchBtn.click().catch(() => {});
          }
          await this.page.waitForTimeout(2500);
          await this.page
            .locator('.animate-spin, svg.animate-spin')
            .waitFor({ state: "hidden", timeout: 10_000 })
            .catch(() => {});

          if (await scanCards()) return;

          // Check all available pages under this search
          for (let p = 1; p <= 5; p++) {
            const nextBtn = this.page.getByRole("button", { name: /^Next$/i }).first();
            if (await nextBtn.isVisible().catch(() => false) && await nextBtn.isEnabled().catch(() => false)) {
              console.log(`Navigating to page ${p + 1} under search "${term}"...`);
              await nextBtn.click();
              await this.page.waitForTimeout(2000);
              await this.page
                .locator('.animate-spin, svg.animate-spin')
                .waitFor({ state: "hidden", timeout: 10_000 })
                .catch(() => {});
              if (await scanCards()) return;
            } else {
              break;
            }
          }
        }
      }

      // If search returned nothing, reset cleanly to base offers list on page 1
      console.log(`Resetting to base offers list on page 1...`);
      const baseUrl = this.page.url().split("&")[0].split("?")[0] + "?tab=offers-bids";
      await this.page.goto(baseUrl, { waitUntil: "domcontentloaded" });
      await this.page.waitForTimeout(2000);
      if (await scanCards()) return;

      // 3. Fallback scan forward up to 5 pages of base list if search did not yield card
      for (let p = 1; p <= 5; p++) {
        const nextBtn = this.page.getByRole("button", { name: /^Next$/i }).first();
        if (await nextBtn.isVisible().catch(() => false) && await nextBtn.isEnabled().catch(() => false)) {
          console.log(`Navigating to next page of offers (page ${p + 1})...`);
          await nextBtn.click();
          await this.page.waitForTimeout(2000);
          await this.page
            .locator('.animate-spin, svg.animate-spin')
            .waitFor({ state: "hidden", timeout: 10_000 })
            .catch(() => {});
          if (await scanCards()) return;
        } else {
          break;
        }
      }

      if (await scanStreetFallback()) return;

      return;
    }

    // Fallback: check newest action button on the page ONLY when propertyName was not specified
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
      counterButton = this.page.getByRole("button", { name: /Counter via Chat/i })
        .or(this.page.locator('button').filter({ hasText: /Counter via Chat/i }))
        .first();
    }

    if (!counterButton || !(await counterButton.isVisible().catch(() => false))) {
      const accordions = this.page.locator('button:has-text("offer"), button:has-text("Offer"), button:has-text("offers"), button:has-text("Offers"), button:has(svg.lucide-chevron-down), svg.lucide-chevron-down');
      const count = await accordions.count().catch(() => 0);
      for (let i = 0; i < count; i++) {
        await accordions.nth(i).click().catch(() => {});
        await this.page.waitForTimeout(500);
        counterButton = this.page.getByRole("button", { name: /Counter via Chat/i })
          .or(this.page.locator('button').filter({ hasText: /Counter via Chat/i }))
          .first();
        if (await counterButton.isVisible().catch(() => false)) break;
      }
    }

    await counterButton.scrollIntoViewIfNeeded().catch(() => {});

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

    let acceptBtn = this.activeAcceptButton;
    if (!acceptBtn && propertyName) {
      const shortName = propertyName.split(",")[0].trim();
      const escaped = shortName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const exactRegex = new RegExp(`(?:^|\\D)${escaped}(?:\\D|$)`, "i");
      const matchingCard = this.page.locator('div[class*="rounded"], div.border, article').filter({ hasText: exactRegex }).first();
      if (await matchingCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        acceptBtn = matchingCard.getByRole("button", { name: /^Accept$/i }).first();
      }

      if (!acceptBtn) {
        const searchStreet = shortName.replace(/^\d+[\s\/-]*/, "").trim();
        if (searchStreet) {
          const streetCard = this.page.locator('div[class*="rounded"], div.border, article')
            .filter({ hasText: new RegExp(searchStreet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") })
            .filter({ has: this.page.getByRole("button", { name: /^Accept$/i }) })
            .first();
          if (await streetCard.isVisible({ timeout: 2000 }).catch(() => false)) {
            acceptBtn = streetCard.getByRole("button", { name: /^Accept$/i }).first();
            console.log(`Found active Accept button on street-matching card for "${searchStreet}".`);
          }
        }
      }
    }
    if (!acceptBtn || !(await acceptBtn.isVisible().catch(() => false))) {
      const accordions = this.page.locator('button:has-text("offer"), button:has-text("Offer"), button:has-text("offers"), button:has-text("Offers"), button:has(svg.lucide-chevron-down), svg.lucide-chevron-down');
      const count = await accordions.count().catch(() => 0);
      for (let i = 0; i < count; i++) {
        await accordions.nth(i).click().catch(() => {});
        await this.page.waitForTimeout(500);
        acceptBtn = this.page
          .getByRole("button", { name: /^Accept$/i })
          .or(this.page.locator('button').filter({ hasText: /^Accept$/i }))
          .or(this.page.getByRole("button", { name: /accept/i }))
          .first();
        if (await acceptBtn.isVisible().catch(() => false)) break;
      }
    }

    if (!acceptBtn) {
      acceptBtn = this.page
        .getByRole("button", { name: /^Accept$/i })
        .or(this.page.locator('button').filter({ hasText: /^Accept$/i }))
        .or(this.page.getByRole("button", { name: /accept/i }))
        .first();
    }

    if (acceptBtn && (await acceptBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
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

      await this.page.waitForTimeout(500);

      // Attempt click with retry if dialog remains visible
      for (let attempt = 1; attempt <= 4; attempt++) {
        const isDialogVisible = await dialog.isVisible().catch(() => false);
        if (!isDialogVisible) break;

        const confirmButton = dialog
          .getByRole("button", { name: /^Confirm$/i })
          .or(dialog.locator('button').filter({ hasText: /^Confirm$/i }))
          .or(dialog.getByRole("button", { name: /Confirm|Accept/i }))
          .first();

        if (await confirmButton.isVisible().catch(() => false)) {
          console.log(`Clicking Confirm button in accept offer dialog (attempt ${attempt})...`);
          try {
            await confirmButton.click({ timeout: 4000 });
          } catch (err) {
            await confirmButton.click({ force: true }).catch(() => {});
          }
        }
        await this.page.waitForTimeout(2000);
      }

      // Wait for dialog to close
      const isClosed = await dialog
        .waitFor({ state: "hidden", timeout: 15_000 })
        .then(() => true)
        .catch(() => false);

      if (!isClosed) {
        console.warn("Accept offer dialog did not report hidden within 15s, checking for success toast or accepted state...");
        const toast = this.page.getByText(/Offer Accepted!|settlement has been created/i).first();
        const hasToast = await toast.isVisible({ timeout: 3000 }).catch(() => false);
        if (!hasToast) {
          await expect(
            dialog,
            "Accept offer dialog should close after confirmation"
          ).toBeHidden({ timeout: 5_000 });
        }
      }

      // Wait for success toast or settlement creation confirmation
      const toast = this.page.getByText(/Offer Accepted!|settlement has been created/i).first();
      await toast.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
      await this.page.waitForTimeout(1000);
      return;
    }

    // Fallback: Check if offer for this property is already accepted or preparing for exchange
    const targetScope = propertyName
      ? this.page.locator('div[class*="rounded"], div.border, article').filter({ hasText: propertyName.split(",")[0].trim() }).first()
      : this.page;

    const acceptedTarget = targetScope
      .getByText(/offer accepted|accepted|preparing for contract exchange/i)
      .or(targetScope.getByRole("button", { name: "Copy Settlement Link" }))
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
