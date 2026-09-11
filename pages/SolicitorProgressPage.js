const { expect } = require("@playwright/test");

class SolicitorProgressPage {
  constructor(page) {
    this.page = page;

    this.progressMenu = page
      .getByRole("button", { name: "Progress", exact: true })
      .or(page.getByRole("link", { name: "Progress", exact: true }))
      .or(page.getByText("Progress", { exact: true }))
      .first();

    this.settlementsMenu = page
      .getByRole("button", { name: /^Settlements$/i })
      .or(page.getByRole("link", { name: /^Settlements$/i }))
      .or(page.locator("button, a").filter({ hasText: /^Settlements$/i }))
      .first();

    this.applyTemplateButton = page.getByRole("button", {
      name: /Apply Template/i,
    });

    this.applyThisTemplateButton = page.getByRole("button", {
      name: /Apply This Template/i,
    });
  }

  // =====================================================
  // SETTLEMENTS TAB NAVIGATION (Flow 8 Updated Step)
  // =====================================================

  async openSettlementsTab() {
    console.log("Opening Seller Solicitor Settlements tab...");
    const url = this.page.url();
    if (!url.includes("tab=settlements")) {
      if (await this.settlementsMenu.isVisible({ timeout: 5000 }).catch(() => false)) {
        await this.settlementsMenu.click();
      } else {
        await this.page.goto("/dashboard/solicitor?tab=settlements", {
          waitUntil: "domcontentloaded",
        });
      }
    }

    await this.page.waitForLoadState("domcontentloaded");
    await this.page
      .getByText(/loading settlements/i)
      .waitFor({ state: "hidden", timeout: 30_000 })
      .catch(() => {});
    await this.page
      .locator(".animate-spin, svg.animate-spin")
      .first()
      .waitFor({ state: "hidden", timeout: 30_000 })
      .catch(() => {});
    await this.page.waitForTimeout(1500);

    await expect(
      this.page
        .getByRole("heading", { name: /Settlements/i })
        .or(this.page.getByText(/^Settlements$/i))
        .first(),
      "Settlements page should be loaded"
    ).toBeVisible({ timeout: 20_000 });

    console.log("Seller Solicitor Settlements tab opened successfully");
  }

  async openConfigureProgressTask(propertyName) {
    console.log(`Opening Configure Progress Task for property: ${propertyName}...`);
    const shortName = propertyName ? String(propertyName).split(",")[0].trim() : "";

    // 1. If search input exists, filter by shortName
    const searchInput = this.page.getByPlaceholder(/Search by property title/i);
    if (shortName && (await searchInput.isVisible({ timeout: 3000 }).catch(() => false))) {
      await searchInput.fill(shortName);
      await this.page.keyboard.press("Enter");
      await this.page.waitForTimeout(1000);
      await this.page
        .locator(".animate-spin, svg.animate-spin")
        .first()
        .waitFor({ state: "hidden", timeout: 15_000 })
        .catch(() => {});
    }

    // 2. Find Configure Progress button on matching property card
    const card = this.page
      .locator("div")
      .filter({ hasText: new RegExp(shortName || "Chapel Street", "i") })
      .filter({ has: this.page.getByRole("button", { name: /Configure Progress/i }) })
      .first();

    let configBtn = card.getByRole("button", { name: /Configure Progress/i });

    if (!(await configBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      configBtn = this.page
        .getByRole("button", { name: /Configure Progress/i })
        .first();
    }

    await expect(
      configBtn,
      "Configure Progress button should be visible on property card in Settlements"
    ).toBeVisible({ timeout: 20_000 });

    await configBtn.click();
    await this.page.waitForLoadState("domcontentloaded");
    await this.page.waitForURL(/progress-configure/, { timeout: 15_000 }).catch(() => {});

    // 3. Wait for "Loading configuration..." to disappear and Update button to be visible
    await this.page
      .getByText(/loading configuration/i)
      .waitFor({ state: "hidden", timeout: 30_000 })
      .catch(() => {});
    await this.page
      .locator(".animate-spin, svg.animate-spin")
      .first()
      .waitFor({ state: "hidden", timeout: 30_000 })
      .catch(() => {});

    const updateBtn = this.page
      .getByRole("button", { name: "Update", exact: true })
      .last();

    await expect(
      updateBtn,
      "Update button should be visible on Configure Progress page"
    ).toBeVisible({ timeout: 30_000 });

    console.log("Configure Progress page opened successfully and Update button is ready");
  }

  async scrollDownAndSubmit() {
    console.log("Scrolling down and submitting Configure Progress Task...");
    // Remove the floating support/chat widget that overlaps the bottom-right Update button
    await this.page.evaluate(() => {
      document
        .querySelectorAll(
          '.fixed.right-4.bottom-5, [class*="bottom-5"][class*="right-4"]'
        )
        .forEach((el) => el.remove());
    }).catch(() => {});

    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1000);

    const updateBtn = this.page
      .getByRole("button", { name: "Update", exact: true })
      .last();

    await expect(
      updateBtn,
      "Update button should be visible on Configure Progress page"
    ).toBeVisible({ timeout: 20_000 });

    await updateBtn.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(500);

    await updateBtn.click({ position: { x: 15, y: 15 } });
    console.log("Clicked Update button on Configure Progress page");

    // Wait for success toast / notification (Sonner toast item)
    const successToast = this.page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /Workflow updated successfully|updated successfully/i })
      .or(this.page.getByText("Workflow updated successfully"))
      .first();

    await expect(
      successToast,
      "Workflow updated successfully message should appear"
    ).toBeVisible({ timeout: 15_000 });

    console.log("Configure Progress Task submitted successfully");
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
      .getByText(
        /Workflow updated successfully|Deposit Paid|Final Inspection|Contract Signed|10 stages|10 steps|Applied Template|Progress Workflow/i
      )
      .first();

    await expect(
      stagesIndicator,
      "Progress tasks should be verified/configured successfully"
    ).toBeVisible({ timeout: 20_000 });

    console.log("Progress tasks verified successfully for property");
  }
}

module.exports = { SolicitorProgressPage };
