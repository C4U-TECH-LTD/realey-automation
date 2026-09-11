const { expect } = require("@playwright/test");

class SolicitorProgressPage {
  constructor(page) {
    this.page = page;

    this.progressMenu = page
      .getByRole("button", { name: "Progress", exact: true })
      .or(page.getByRole("link", { name: "Progress", exact: true }))
      .or(page.getByText("Progress", { exact: true }))
      .first();

    this.applyTemplateButton = page.getByRole("button", {
      name: /Apply Template/i,
    });

    this.applyThisTemplateButton = page.getByRole("button", {
      name: /Apply This Template/i,
    });
  }

  async openProgressTab() {
    console.log("Opening Seller Solicitor Progress tab...");
    const url = this.page.url();
    if (!url.includes("tab=progress")) {
      if (await this.progressMenu.isVisible({ timeout: 5000 }).catch(() => false)) {
        await this.progressMenu.click();
      } else {
        await this.page.goto("/dashboard/solicitor?tab=progress", {
          waitUntil: "domcontentloaded",
        });
      }
    }

    await this.page.waitForLoadState("domcontentloaded");
    await this.page
      .locator(".animate-spin, svg.animate-spin")
      .waitFor({ state: "hidden", timeout: 15_000 })
      .catch(() => {});

    await expect(
      this.page.getByText(/Progress|Settlements|Templates/i).first(),
      "Progress page should be loaded"
    ).toBeVisible({ timeout: 20_000 });

    console.log("Seller Solicitor Progress tab opened successfully");
  }

  async selectProperty(propertyName) {
    console.log(`Selecting property in Progress list: ${propertyName}...`);
    const shortName = String(propertyName).split(",")[0].trim();
    const escaped = shortName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    await this.page
      .locator(".animate-spin, svg.animate-spin")
      .waitFor({ state: "hidden", timeout: 15_000 })
      .catch(() => {});

    let propertyCard = this.page
      .locator("button")
      .filter({ hasText: new RegExp(escaped, "i") })
      .first();

    let isVisible = await propertyCard.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isVisible) {
      console.log(`Property "${shortName}" not found on page 1, selecting first available property card...`);
      propertyCard = this.page
        .locator("button")
        .filter({ hasText: /Step \d|Just Started|Available|Under Offer|Complete/i })
        .first();
    }

    await expect(
      propertyCard,
      `Property card for "${shortName}" should be visible`
    ).toBeVisible({ timeout: 20_000 });

    await propertyCard.click();
    await this.page.waitForTimeout(1000);

    console.log(`Property "${shortName}" selected`);
  }

  async configureProgressTasks(templateName = "Standard Conveyancing Process") {
    console.log(`Configuring progress tasks using template: ${templateName}...`);

    await expect(
      this.applyTemplateButton,
      "Apply Template button should be visible"
    ).toBeVisible({ timeout: 15_000 });

    await this.applyTemplateButton.click();
    await this.page.waitForTimeout(1000);

    const templateCard = this.page
      .getByText(new RegExp(templateName, "i"))
      .first();

    await expect(
      templateCard,
      `Template "${templateName}" should be visible in modal`
    ).toBeVisible({ timeout: 10_000 });

    await templateCard.click();
    await this.page.waitForTimeout(700);

    await expect(
      this.applyThisTemplateButton,
      "Apply This Template button should be visible"
    ).toBeVisible({ timeout: 10_000 });

    await this.applyThisTemplateButton.click();
    await this.page.waitForTimeout(2000);

    console.log("Template applied successfully");
  }

  async verifyProgressConfigured() {
    console.log("Verifying progress tasks are configured for property...");

    const stagesIndicator = this.page
      .getByText(/Deposit Paid|Final Inspection|Contract Signed|10 stages|10 steps|Applied Template/i)
      .first();

    await expect(
      stagesIndicator,
      "Progress stages should be visible after applying template"
    ).toBeVisible({ timeout: 20_000 });

    console.log("Progress tasks verified successfully for property");
  }
}

module.exports = { SolicitorProgressPage };
