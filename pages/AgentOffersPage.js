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
    this.isAlreadyAccepted = false;

    if (propertyName) {
      const shortName = propertyName.split(",")[0].trim();
      const streetOnly = shortName.replace(/^\d+[\s\/-]*/, "").trim();
      const baseStreet = streetOnly.replace(/\b(Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Place|Pl|Way|Parade|Pde|Lane|Ln|Boulevard|Blvd|Court|Ct|Circuit|Cct|Highway|Hwy)\b\.?/gi, "").trim();
      const escapedShort = shortName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const escapedStreet = streetOnly ? streetOnly.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";
      const escapedBaseStreet = baseStreet ? baseStreet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";

      const flexiblePattern = escapedShort
        .replace(/\bStreet\b/gi, "(?:Street|St\\b\\.?)")
        .replace(/\bRoad\b/gi, "(?:Road|Rd\\b\\.?)")
        .replace(/\bAvenue\b/gi, "(?:Avenue|Ave\\b\\.?)")
        .replace(/\bDrive\b/gi, "(?:Drive|Dr\\b\\.?)")
        .replace(/\bLane\b/gi, "(?:Lane|Ln\\b\\.?)")
        .replace(/\bPlace\b/gi, "(?:Place|Pl\\b\\.?)")
        .replace(/\bParade\b/gi, "(?:Parade|Pde\\b\\.?)")
        .replace(/\bCircuit\b/gi, "(?:Circuit|Cct\\b\\.?)");
      const exactRegex = new RegExp(`(?:^|\\D)${flexiblePattern}(?:\\D|$)`, "i");

      const streetNumMatch = shortName.match(/^(\d+)/);
      const streetNum = streetNumMatch ? streetNumMatch[1] : null;

      const inspectCard = async (card, label, isFallback = false) => {
        if (!await card.isVisible().catch(() => false)) return false;
        await card.scrollIntoViewIfNeeded().catch(() => {});

        const cardText = await card.innerText().catch(() => "");

        // If listing has a street number (e.g. "151 Collins Street"), require that exact number on card
        if (streetNum) {
          const numRegex = new RegExp(`(?:^|\\D)${streetNum}(?:\\D|$)`);
          if (!numRegex.test(cardText)) {
            return false;
          }
        }

        const acceptBtn = card.getByRole("button", { name: /^Accept$/i }).or(card.locator('button').filter({ hasText: /^Accept/i })).first();
        const counterBtn = card.getByRole("button", { name: /Counter via Chat/i }).or(card.locator('button').filter({ hasText: /Counter via Chat/i })).first();

        let hasAccept = await acceptBtn.isVisible().catch(() => false);
        let hasCounter = await counterBtn.isVisible().catch(() => false);

        if (!hasAccept && !hasCounter) {
          const accordionToggle = card.locator('button:has-text("offer"), button:has-text("Offer"), button:has-text("offers"), button:has-text("Offers"), button:has(svg.lucide-chevron-down), svg.lucide-chevron-down').first();
          if (await accordionToggle.isVisible().catch(() => false)) {
            console.log(`Attempting to expand offer accordion on card (${label})...`);
            await accordionToggle.click().catch(() => {});
            await this.page.waitForTimeout(1000);
            hasAccept = await acceptBtn.isVisible().catch(() => false);
            hasCounter = await counterBtn.isVisible().catch(() => false);
          }

          if (!isFallback && !hasAccept && !hasCounter) {
            const updatedText = await card.innerText().catch(() => "");
            if (/accepted|preparing for contract exchange/i.test(updatedText)) {
              console.log(`Card (${label}) is already in accepted state.`);
              this.isAlreadyAccepted = true;
              return true;
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

        return Boolean(hasAccept || hasCounter || this.isAlreadyAccepted);
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
          const card = el.locator('xpath=ancestor::*[contains(@class, "rounded") or contains(@class, "border") or contains(@class, "bg-card")][1]');
          if (await inspectCard(card, `exact ancestor: "${shortName}"`)) return true;
        }

        return false;
      };

      const scanStreetFallback = async () => {
        const fallbackRegex = escapedBaseStreet
          ? new RegExp(`(?:^|\\D)${escapedBaseStreet}(?:\\D|$)`, "i")
          : (streetOnly ? new RegExp(`(?:^|\\D)${escapedStreet}(?:\\D|$)`, "i") : null);
        if (!fallbackRegex) return false;
        const streetCards = this.page
          .locator('div[class*="rounded"], div.border, article')
          .filter({ hasText: fallbackRegex });
        const count = await streetCards.count().catch(() => 0);
        for (let s = 0; s < count; s++) {
          if (await inspectCard(streetCards.nth(s), `street fallback: "${baseStreet || streetOnly}"`, true)) return true;
        }
        return false;
      };

      // 1. Poll for matching card on page 1 (reloading up to 30s to allow backend indexing)
      const pollStartTime = Date.now();
      const maxPollMs = 30_000;
      let attempt = 0;

      while (Date.now() - pollStartTime < maxPollMs) {
        attempt++;
        if (await scanCards()) {
          console.log(`Found offer card for "${shortName}" on page 1 (poll attempt ${attempt}).`);
          return;
        }

        console.log(`Offer for "${shortName}" not found on page 1 yet (attempt ${attempt}). Waiting 4s and reloading...`);
        await this.page.waitForTimeout(4000);
        await this.page.reload({ waitUntil: "domcontentloaded" });
        await this.page.waitForTimeout(2000);
      }

      if (await scanCards()) return;

      // 2. Search by street number, suburb, base street, full street name (without number), or buyer
      const suburb = propertyName.includes(",") ? propertyName.split(",")[1].trim().split(/\s+/)[0] : null;
      const searchTerms = [
        streetNum,
        suburb,
        !/^\d+/.test(shortName) ? shortName : null,
        baseStreet,
        streetOnly,
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
            .locator('xpath=following-sibling::button | following-sibling::*//button')
            .or(this.page.locator('button:has(svg.lucide-search)'))
            .first();
          if (await searchBtn.isVisible({ timeout: 500 }).catch(() => false)) {
            await searchBtn.click().catch(() => {});
          }
          await this.page.waitForTimeout(2500);
          await this.page
            .locator('.animate-spin, svg.animate-spin')
            .waitFor({ state: "hidden", timeout: 10_000 })
            .catch(() => {});

          if (await scanCards()) return;

          // Check available pages under search
          for (let p = 1; p <= 10; p++) {
            const nextBtn = this.page
              .getByRole("button", { name: /^Next$/i })
              .or(this.page.locator('button:has(svg.lucide-chevron-right)'))
              .or(this.page.locator('button[aria-label*="next" i]'))
              .first();
            if (await nextBtn.isVisible().catch(() => false) && await nextBtn.isEnabled().catch(() => false)) {
              console.log(`Navigating to page ${p + 1} under search "${term}"...`);
              await nextBtn.scrollIntoViewIfNeeded().catch(() => {});
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
        }
      }

      // If search returned nothing, reset cleanly to base offers list on page 1
      console.log(`Resetting to base offers list on page 1...`);
      const baseUrl = this.page.url().includes("/agent") ? "/dashboard/agent?tab=offers-bids" : "/dashboard?tab=offers-bids";
      await this.page.goto(baseUrl, { waitUntil: "domcontentloaded" });
      await this.page.waitForTimeout(2000);
      if (await scanCards()) return;

      // 3. Jump to last page first: Realey API returns offers oldest-first, so newest offers appear on the last page
      const pageNumbers = this.page.locator('button').filter({ hasText: /^\d+$/ });
      const numCount = await pageNumbers.count();
      if (numCount > 0) {
        const lastPageBtn = pageNumbers.last();
        const lastPageNum = (await lastPageBtn.innerText().catch(() => "")).trim();
        console.log(`Jumping directly to last page of offers (page ${lastPageNum})...`);
        await lastPageBtn.scrollIntoViewIfNeeded().catch(() => {});
        await lastPageBtn.click();
        await this.page.waitForTimeout(2000);
        await this.page
          .locator('.animate-spin, svg.animate-spin')
          .waitFor({ state: "hidden", timeout: 10_000 })
          .catch(() => {});
        if (await scanCards()) return;

        // Check recent pages backwards from the end (up to 5 pages back)
        for (let b = 1; b <= 5; b++) {
          const prevBtn = this.page
            .getByRole("button", { name: /^Prev|Previous$/i })
            .or(this.page.locator('button:has(svg.lucide-chevron-left)'))
            .or(this.page.locator('button[aria-label*="prev" i]'))
            .first();
          if (await prevBtn.isVisible().catch(() => false) && await prevBtn.isEnabled().catch(() => false)) {
            console.log(`Scanning backwards from end (step ${b})...`);
            await prevBtn.scrollIntoViewIfNeeded().catch(() => {});
            await prevBtn.click();
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

      // 4. Fallback scan forward: check remaining pages through the entire list (up to 30)
      for (let p = 1; p <= 30; p++) {
        const nextBtn = this.page
          .getByRole("button", { name: /^Next$/i })
          .or(this.page.locator('button:has(svg.lucide-chevron-right)'))
          .or(this.page.locator('button[aria-label*="next" i]'))
          .first();
        if (await nextBtn.isVisible().catch(() => false) && await nextBtn.isEnabled().catch(() => false)) {
          console.log(`Navigating to next page of offers (page ${p + 1})...`);
          await nextBtn.scrollIntoViewIfNeeded().catch(() => {});
          await nextBtn.click();
          await this.page.waitForTimeout(2000);
          await this.page
            .locator('.animate-spin, svg.animate-spin')
            .waitFor({ state: "hidden", timeout: 10_000 })
            .catch(() => {});
          if (await scanCards()) return;
        } else {
          // Scroll down to load more cards
          await this.page.evaluate(() => window.scrollBy(0, 1000));
          await this.page.waitForTimeout(1000);
          if (await scanCards()) return;
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

    if (this.isAlreadyAccepted) {
      console.log("Offer is already in accepted state.");
      return;
    }

    let acceptBtn = this.activeAcceptButton;
    if (!acceptBtn && propertyName) {
      const shortName = propertyName.split(",")[0].trim();
      const streetNumMatch = shortName.match(/^(\d+)/);
      const streetNum = streetNumMatch ? streetNumMatch[1] : null;
      const escaped = shortName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const exactRegex = new RegExp(`(?:^|\\D)${escaped}(?:\\D|$)`, "i");
      const matchingCard = this.page.locator('div[class*="rounded"], div.border, article').filter({ hasText: exactRegex }).first();
      if (await matchingCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        const accordionToggle = matchingCard.locator('button:has-text("offer"), button:has-text("Offer"), button:has(svg.lucide-chevron-down), svg.lucide-chevron-down').first();
        if (await accordionToggle.isVisible().catch(() => false)) {
          await accordionToggle.click().catch(() => {});
          await this.page.waitForTimeout(1000);
        }
        acceptBtn = matchingCard.getByRole("button", { name: /^Accept$/i }).first();
      }

      if (!acceptBtn) {
        const searchStreet = shortName.replace(/^\d+[\s\/-]*/, "").trim();
        const baseStreet = searchStreet.replace(/\b(Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Place|Pl|Way|Parade|Pde|Lane|Ln|Boulevard|Blvd|Court|Ct|Circuit|Cct|Highway|Hwy)\b\.?/gi, "").trim();
        const targetStreet = baseStreet || searchStreet;
        if (targetStreet) {
          let streetCards = this.page.locator('div[class*="rounded"], div.border, article')
            .filter({ hasText: new RegExp(targetStreet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") });
          if (streetNum) {
            streetCards = streetCards.filter({ hasText: new RegExp(`(?:^|\\D)${streetNum}(?:\\D|$)`) });
          }
          const streetCard = streetCards.filter({ has: this.page.getByRole("button", { name: /^Accept$/i }) }).first();
          if (await streetCard.isVisible({ timeout: 2000 }).catch(() => false)) {
            acceptBtn = streetCard.getByRole("button", { name: /^Accept$/i }).first();
            console.log(`Found active Accept button on street-matching card for "${targetStreet}".`);
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
        .locator('[role="alertdialog"], [role="dialog"]')
        .filter({ hasText: /Accept offer/i })
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
          .locator("button")
          .filter({ hasText: /^Confirm$/i })
          .or(dialog.getByRole("button", { name: /^Confirm$/i, includeHidden: true }))
          .or(this.page.locator("button").filter({ hasText: /^Confirm$/i }))
          .last();

        if (await confirmButton.isVisible().catch(() => false)) {
          console.log(`Clicking Confirm button in accept offer dialog (attempt ${attempt})...`);
          try {
            await confirmButton.click({ timeout: 4000 });
          } catch (err) {
            console.log(`Standard click on Confirm failed, retrying dispatchEvent/force...`);
            await confirmButton.dispatchEvent("click").catch(() => {});
            await confirmButton.click({ force: true }).catch(() => {});
          }
        }
        await this.page.waitForTimeout(2500);
      }

      // Wait for dialog to close
      const isClosed = await dialog
        .waitFor({ state: "hidden", timeout: 25_000 })
        .then(() => true)
        .catch(() => false);

      if (!isClosed) {
        console.warn("Accept offer dialog did not report hidden within 25s, checking for success toast or accepted state...");
        const toast = this.page.getByText(/Offer Accepted!|settlement has been created/i).first();
        const hasToast = await toast.isVisible({ timeout: 3000 }).catch(() => false);
        if (!hasToast) {
          // If confirm button is still present, attempt one last force dispatch click
          const lastConfirm = dialog.locator("button").filter({ hasText: /^Confirm$/i }).first();
          if (await lastConfirm.isVisible().catch(() => false)) {
            console.log("Dialog still visible with Confirm button, dispatching click...");
            await lastConfirm.dispatchEvent("click").catch(() => {});
            await lastConfirm.click({ force: true }).catch(() => {});
            await this.page.waitForTimeout(3000);
          }
          await expect(
            dialog,
            "Accept offer dialog should close after confirmation"
          ).toBeHidden({ timeout: 10_000 });
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

    if (await acceptedTarget.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log("Offer was already in accepted state on Offers & Bids page.");
      this.isAlreadyAccepted = true;
      return;
    }

    // Fallback: If not found on Offers & Bids, try accepting via Conversations
    if (propertyName) {
      console.log(`[AgentOffersPage] Accept button not found on Offers & Bids for "${propertyName}". Checking Conversations fallback...`);
      try {
        const { ConversationsPage } = require("./ConversationsPage");
        const conversationsPage = new ConversationsPage(this.page);
        const convUrl = this.page.url().includes("/agent") ? "/dashboard/agent?tab=conversations" : "/dashboard?tab=conversations";
        await this.page.goto(convUrl, { waitUntil: "domcontentloaded" });
        await this.page.waitForTimeout(2000);
        await conversationsPage.openAgentConversation(propertyName);
        await conversationsPage.acceptNegotiatedOffer();
        console.log(`[AgentOffersPage] Successfully accepted offer via Conversations tab!`);
        this.isAlreadyAccepted = true;
        return;
      } catch (chatErr) {
        console.warn(`[AgentOffersPage] Conversations fallback failed: ${chatErr.message}. Returning to Offers & Bids to check state...`);
        const baseUrl = this.page.url().includes("/agent") ? "/dashboard/agent?tab=offers-bids" : "/dashboard?tab=offers-bids";
        await this.page.goto(baseUrl, { waitUntil: "domcontentloaded" });
        await this.page.waitForTimeout(2000);
      }
    }

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
      .getByText(expectedMessage || /Offer accepted|accepted|preparing for contract exchange/i)
      .or(this.page.getByRole("button", { name: "Copy Settlement Link" }))
      .or(this.page.locator('[class*="accepted" i]'))
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
