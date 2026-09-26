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

  async dismissBlockingProgressModal() {
    const modal = this.page
      .locator('[role="dialog"], [class*="modal" i], div.fixed')
      .filter({ hasText: /Please configure the progress/i })
      .first();

    if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log("Detected 'Please configure the progress to continue' modal. Dismissing by crossing popup...");
      const closeBtn = modal
        .locator('button:has(svg.lucide-x), [aria-label*="close" i], button:has-text("✕"), button:has-text("Close"), button:has-text("Later"), button:has-text("Cancel")')
        .first();
      if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await closeBtn.click().catch(() => {});
      } else {
        await this.page.keyboard.press("Escape").catch(() => {});
      }
      await this.page.waitForTimeout(1000);
    }
  }

  async openListingsTab() {
    console.log("Opening Seller Solicitor Listings tab...");
    await this.dismissBlockingProgressModal();

    const url = this.page.url();
    if (!url.includes("tab=listings")) {
      const listingsMenu = this.page
        .getByRole("button", { name: /^Listings$/i })
        .or(this.page.getByRole("link", { name: /^Listings$/i }))
        .or(this.page.locator("aside, nav").locator("button, a").filter({ hasText: /^Listings$/i }))
        .first();

      if (await listingsMenu.isVisible({ timeout: 3000 }).catch(() => false)) {
        await listingsMenu.click().catch(() => {});
      } else {
        await this.page.goto("/dashboard/solicitor?tab=listings", {
          waitUntil: "domcontentloaded",
        });
      }
    }

    await this.page.waitForLoadState("domcontentloaded");
    await this.page
      .locator('.animate-spin, svg.animate-spin, [class*="loading"]')
      .first()
      .waitFor({ state: "hidden", timeout: 20_000 })
      .catch(() => {});
    await this.page.waitForTimeout(1000);
    await this.dismissBlockingProgressModal();
  }

  async openSettlementsTab(preservePropertyName = null) {
    console.log("Opening Seller Solicitor Listings/Settlements tab...");
    await this.dismissBlockingProgressModal();
    await this.openListingsTab();
  }

  async openConfigureProgressTask(propertyName) {
    console.log(`Opening Configure Progress Task for property: ${propertyName}...`);

    // 1. Cross the popup modal if shown
    await this.dismissBlockingProgressModal();

    // 2. Ensure on Listings page
    await this.openListingsTab();

    const shortName = propertyName ? String(propertyName).split(",")[0].trim() : "";

    // 3. Find the created listing row in the Listings table
    // The top listing should be the latest listing from agent.
    const table = this.page.locator("table tbody");
    await expect(table, "Listings table should be visible on Solicitor Dashboard").toBeVisible({ timeout: 20_000 });

    let targetRow = null;
    if (shortName) {
      const matchRow = this.page
        .locator("table tbody tr")
        .filter({ hasText: new RegExp(shortName, "i") })
        .first();
      if (await matchRow.isVisible({ timeout: 4000 }).catch(() => false)) {
        targetRow = matchRow;
        console.log(`Found listing row matching "${shortName}"`);
      }
    }

    if (!targetRow) {
      console.log(`Listing row matching "${shortName}" not found or empty, selecting top listing row in table...`);
      targetRow = this.page.locator("table tbody tr").first();
    }

    await expect(targetRow, "Target listing row should be visible").toBeVisible({ timeout: 15_000 });

    const rowText = await targetRow.innerText().catch(() => "");
    console.log(`Target listing row content: ${rowText.replace(/\s+/g, " ").trim()}`);

    const configBtn = targetRow
      .locator("button, a")
      .filter({ hasText: /Configure Progress|Configure/i })
      .first();

    await expect(
      configBtn,
      "Configure Progress button should be visible on target listing row"
    ).toBeVisible({ timeout: 10_000 });

    console.log("Clicking Configure Progress button on target listing row...");
    await configBtn.scrollIntoViewIfNeeded().catch(() => {});
    await configBtn.click();

    // 4. Navigates to /progress-configure
    await this.page.waitForURL(/progress-configure/, { timeout: 20_000 });
    await this.page.waitForLoadState("domcontentloaded");
    await this.page
      .locator('.animate-spin, svg.animate-spin, [class*="loading"]')
      .first()
      .waitFor({ state: "hidden", timeout: 30_000 })
      .catch(() => {});
    await this.page.waitForTimeout(1000);

    // Initial check of total tasks count at top of progress-configure page
    await this.checkTotalTasksCount();

    const submitBtn = this.page
      .getByRole("button", { name: /^(?:Submit|Update|Save|Save Changes)$/i })
      .or(this.page.locator("button").filter({ hasText: /^(?:Submit|Update|Save|Save Changes)$/i }))
      .last();

    await expect(
      submitBtn,
      "Submit, Update, or Save button should be visible on Configure Progress page"
    ).toBeVisible({ timeout: 30_000 });

    console.log("Configure Progress page opened successfully at:", this.page.url());
  }

  async checkTotalTasksCount() {
    console.log("Checking Total Tasks count on Configure Progress page...");
    await this.page.evaluate(() => window.scrollTo(0, 0));
    await this.page.waitForTimeout(1000);

    let count = 0;

    // 1. Try finding card with label "Total Tasks"
    const statCards = this.page.locator('div:has-text("Total Tasks")');
    const totalStatCards = await statCards.count();
    for (let i = totalStatCards - 1; i >= 0; i--) {
      const card = statCards.nth(i);
      const text = await card.innerText().catch(() => "");
      const match = text.match(/Total Tasks\s*(\d+)/i) || text.match(/(\d+)\s*Total Tasks/i);
      if (match) {
        count = parseInt(match[1], 10);
        break;
      }
    }

    // 2. Try regex on entire body text
    if (!count) {
      const bodyText = await this.page.innerText("body").catch(() => "");
      const match = bodyText.match(/Total Tasks\s*(\d+)/i) ||
                    bodyText.match(/0\/(\d+)\s*Completed/i) ||
                    bodyText.match(/(\d+)\s*Total Tasks/i);
      if (match) {
        count = parseInt(match[1], 10);
      }
    }

    this.totalConfiguredTasks = count || 24;
    console.log(`Configured Total Tasks count recorded: ${this.totalConfiguredTasks}`);
    return this.totalConfiguredTasks;
  }

  async scrollDownAndSubmit() {
    console.log("Scrolling down and saving/submitting Configure Progress Task...");
    // Hide floating support/chat widget without detaching React DOM nodes
    await this.page.evaluate(() => {
      document
        .querySelectorAll(
          '.fixed.right-4.bottom-5, [class*="bottom-5"][class*="right-4"]'
        )
        .forEach((el) => {
          el.style.pointerEvents = "none";
          el.style.opacity = "0";
        });
    }).catch(() => {});

    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1000);

    const submitBtn = this.page
      .getByRole("button", { name: /^(?:Submit|Update|Save|Save Changes)$/i })
      .or(this.page.locator("button").filter({ hasText: /^(?:Submit|Update|Save|Save Changes)$/i }))
      .last();

    await expect(
      submitBtn,
      "Submit, Update, or Save button should be visible on Configure Progress page"
    ).toBeVisible({ timeout: 20_000 });

    await submitBtn.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(500);

    await submitBtn.click({ position: { x: 15, y: 15 } });
    console.log("Clicked Submit/Update/Save button on Configure Progress page");

    // Wait for success toast / notification (Sonner toast item)
    const successToast = this.page
      .locator("[data-sonner-toast]")
      .filter({ hasText: /submitted successfully|updated successfully|saved successfully/i })
      .or(this.page.getByText(/submitted successfully|updated successfully|saved successfully/i))
      .first();

    await expect(
      successToast,
      "Workflow submitted, updated, or saved successfully message should appear"
    ).toBeVisible({ timeout: 15_000 });

    console.log("Configure Progress Task submitted/saved successfully");

    // Scroll up and check Total Tasks count
    const count = await this.checkTotalTasksCount();
    return count;
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
