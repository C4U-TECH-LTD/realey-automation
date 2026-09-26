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

      // 1. Filter using the search input so the created listing's offers are isolated
      const searchInput = this.page
        .locator('input[placeholder*="Search by address" i], input[placeholder*="search" i]')
        .first();

      if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        console.log(`Filtering Offers & Bids by: ${shortName}`);
        await searchInput.fill(shortName);
        await searchInput.press("Enter");
        await this.page.waitForTimeout(2000);
      }

      // 2. The newest offer is always the first card after filtering
      const firstCard = this.page
        .locator('div[class*="rounded"], div.border, article')
        .filter({ hasText: new RegExp(shortName, "i") })
        .first();

      await expect(firstCard, `Should find at least one offer for ${shortName}`).toBeVisible({ timeout: 15_000 });

      const counterBtn = firstCard.getByRole("button", { name: "Counter via Chat", exact: true });
      const acceptBtn = firstCard.getByRole("button", { name: "Accept", exact: true });

      // Wait for the newest card to finish loading its state
      await this.page.waitForTimeout(1000);

      if (await counterBtn.isVisible().catch(() => false)) {
        this.activeCounterButton = counterBtn;
        console.log(`Found active 'Counter via Chat' button on newest offer for "${propertyName}".`);
        return;
      }

      if (await acceptBtn.isVisible().catch(() => false)) {
        this.activeAcceptButton = acceptBtn;
        console.log(`Found active 'Accept' button on newest offer for "${propertyName}".`);
        return;
      }

      // Check if the newest card is already countered or accepted
      const isCountered = await firstCard
        .getByText(/counter-offer in progress|countered/i)
        .first()
        .isVisible({ timeout: 1000 })
        .catch(() => false);
      if (isCountered) {
        console.log(`Newest offer for "${propertyName}" has counter-offer in progress.`);
        return;
      }

      const isAlreadyAccepted = await firstCard
        .getByText(/accepted|offer accepted/i)
        .first()
        .isVisible({ timeout: 1000 })
        .catch(() => false);
      if (isAlreadyAccepted) {
        console.log(`Newest offer for "${propertyName}" is already in accepted state.`);
        this.isOfferAlreadyAccepted = true;
        return;
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

  async acceptSubmittedOffer() {
    if (this.isOfferAlreadyAccepted) {
      console.log("Offer was already accepted, skipping accept button click.");
      return;
    }

    await this.openOffersAndBids();

    const acceptBtn = this.activeAcceptButton || this.acceptButton;

    await expect(
      acceptBtn,
      "Accept button should be visible on submitted offer"
    ).toBeVisible({ timeout: 20_000 });

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
