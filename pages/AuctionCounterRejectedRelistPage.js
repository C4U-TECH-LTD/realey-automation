const { expect } = require("@playwright/test");

class AuctionCounterRejectedRelistPage {
  constructor(page) {
    this.page = page;

    this.declineButton = page.getByRole("button", {
      name: "Decline",
      exact: true,
    });

    this.declineOfferButton = page.getByRole("button", {
      name: "Decline Offer",
      exact: true,
    });

    this.relistButton = page.getByRole("button", {
      name: "Re-list",
      exact: true,
    });

    this.nextButton = page
      .getByRole("button", {
        name: "Next",
        exact: true,
      })
      .last();
  }

  async declineNegotiatedOffer() {
    await expect(
      this.declineButton,
      "Decline button should be visible for the negotiated offer"
    ).toBeVisible({ timeout: 20_000 });

    await expect(
      this.declineButton,
      "Decline button should be enabled"
    ).toBeEnabled({ timeout: 20_000 });

    await this.declineButton.click();

    await expect(
      this.declineOfferButton,
      "Decline Offer confirmation button should be visible"
    ).toBeVisible({ timeout: 20_000 });

    await expect(
      this.declineOfferButton,
      "Decline Offer confirmation button should be enabled"
    ).toBeEnabled({ timeout: 20_000 });

    await this.declineOfferButton.click();

    console.log("Flow 5 negotiated offer declined");

    await this.page.waitForTimeout(700);
  }

  async verifyNegotiatedOfferDeclined(
    expectedMessage = /declined|offer declined|decline/i
  ) {
    const statusText = this.page
      .getByText(expectedMessage)
      .last();

    if (
      await statusText
        .isVisible()
        .catch(() => false)
    ) {
      await expect(statusText).toBeVisible();
      return;
    }

    await expect(
      this.declineButton,
      "Decline button should disappear after offer rejection"
    ).not.toBeVisible({
      timeout: 20_000,
    });
  }

  async clickBackFromConversation() {
    const backButton = this.page
      .locator("button")
      .filter({
        has: this.page.locator(
          "svg.lucide-chevrons-left"
        ),
      })
      .first();

    await expect(
      backButton,
      "Back button should be visible after declining the offer"
    ).toBeVisible({
      timeout: 20_000,
    });

    await backButton.click();

    console.log("Returned from conversation");

    await this.page.waitForTimeout(500);
  }

  async clickRelist(propertyName = "") {
    // Wait for loading spinner to disappear
    await this.page
      .locator(".animate-spin, svg.animate-spin")
      .waitFor({ state: "hidden", timeout: 20_000 })
      .catch(() => {});

    let button = this.relistButton.first();

    if (propertyName) {
      const shortPropertyName = String(propertyName)
        .split(",")[0]
        .trim();
      const escaped = shortPropertyName.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
      const propertyText = this.page
        .getByText(new RegExp(escaped, "i"))
        .first();

      if (
        await propertyText
          .isVisible()
          .catch(() => false)
      ) {
        const card = propertyText.locator(
          "xpath=ancestor::*[self::div or self::article][.//button][1]"
        );

        if (
          await card
            .isVisible()
            .catch(() => false)
        ) {
          const scopedButton = card
            .getByRole("button", {
              name: /re-?list/i,
            })
            .first();

          if (
            await scopedButton
              .isVisible()
              .catch(() => false)
          ) {
            button = scopedButton;
          }
        }
      }
    }

    await expect(
      button,
      "Re-list button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      button,
      "Re-list button should be enabled"
    ).toBeEnabled({
      timeout: 20_000,
    });

    await button.click();

    console.log("Re-list clicked");

    // Wait for the Relist dialog to actually open before continuing
    const relistModal = this.page
      .locator('[role="dialog"]')
      .filter({ hasText: /relist property/i })
      .first();

    await expect(
      relistModal,
      "Relist Property modal should appear"
    ).toBeVisible({ timeout: 25_000 });

    // Wait for any loading spinner inside modal to disappear
    await this.page
      .locator(".animate-spin, svg.animate-spin")
      .waitFor({ state: "hidden", timeout: 15_000 })
      .catch(() => {});

    await this.page.waitForTimeout(1000);
  }

  async clickNext(stepName = "Re-list") {
    const dialog = this.page
      .locator('[role="dialog"]')
      .filter({ hasText: /relist property|property details|pricing|description|photos/i })
      .or(this.page.locator('[role="dialog"]'))
      .last();

    await expect(
      dialog,
      `${stepName} dialog should be visible`
    ).toBeVisible({ timeout: 20_000 });

    const targetButton = dialog
      .getByRole("button", {
        name: "Next",
        exact: true,
      })
      .or(dialog.locator('button:has-text("Next")'))
      .last();

    await expect(
      targetButton,
      `${stepName} Next button should be visible`
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      targetButton,
      `${stepName} Next button should be enabled`
    ).toBeEnabled({
      timeout: 20_000,
    });

    await targetButton.scrollIntoViewIfNeeded();
    await targetButton.click();

    console.log(`${stepName} Next clicked`);

    await this.page.waitForTimeout(1000);
  }

  async clickListingTypeEdit() {
    const dialog = this.page
      .locator('[role="dialog"]')
      .last();

    const pencil = dialog
      .locator("svg.lucide-pencil")
      .or(this.page.locator("svg.lucide-pencil"))
      .first();

    await expect(
      pencil,
      "Listing Type pencil icon should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    const button = pencil.locator(
      "xpath=ancestor::button[1]"
    );

    if (
      await button
        .isVisible()
        .catch(() => false)
    ) {
      await button.click();
    } else {
      await pencil.click();
    }

    console.log("Listing Type edit clicked");

    await this.page.waitForTimeout(500);
  }
}

module.exports = {
  AuctionCounterRejectedRelistPage,
};
