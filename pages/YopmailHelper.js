const fs = require("fs");
const path = require("path");

class YopmailHelper {
  /**
   * @param {import("@playwright/test").Page | object} pageOrWorld
   * @param {object} [world]
   */
  constructor(pageOrWorld, world = null) {
    if (pageOrWorld && pageOrWorld.page) {
      this.page = pageOrWorld.page;
      this.world = pageOrWorld;
    } else {
      this.page = pageOrWorld;
      this.world = world;
    }
  }

  /**
   * Check if an email matching the subjectRegex arrived for the given yopmail username.
   * Navigates the main scenario page directly so that the email verification is visibly
   * recorded in the final continuous walkthrough video, and then returns to the active Realey page.
   *
   * @param {string} username e.g. "broker.c4utest" or "solicitor.c4utest"
   * @param {RegExp|string} subjectRegex
   * @param {number} timeoutMs default 60,000ms (1 minute)
   */
  async waitForEmail(username, subjectRegex = /sales instructions|sales document/i, timeoutMs = 60_000) {
    const cleanUser = String(username || "")
      .replace(/@yopmail\.com$/i, "")
      .trim();

    console.log(`[YopmailHelper] Checking inbox in-tab for "${cleanUser}" with pattern: ${subjectRegex}`);

    const page = this.page;
    const returnUrl = page.url();

    try {
      await page.goto(`https://yopmail.com?login=${encodeURIComponent(cleanUser)}`, {
        timeout: 30_000,
        waitUntil: "domcontentloaded",
      });
      await page.waitForTimeout(2000);

      const loginInput = page.locator("#login");
      if (await loginInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await loginInput.fill(cleanUser);
        const submitBtn = page.locator("#refreshbut button, #refreshbut, button.material-icons-outlined").first();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(2000);
        }
      }

      const startTime = Date.now();
      const pollInterval = 5000;

      while (Date.now() - startTime < timeoutMs) {
        // Switch to inbox iframe
        const inboxFrame = page.frameLocator("#ifinbox");
        const bodyText = await inboxFrame.locator("body").innerText().catch(() => "");

        if (subjectRegex.test(bodyText)) {
          console.log(`[YopmailHelper] Email matching ${subjectRegex} FOUND for ${cleanUser}!`);

          // Click the email to display full email body in the viewer
          const mailItem = inboxFrame.locator(`text=${subjectRegex}`).first();
          if (await mailItem.isVisible({ timeout: 2000 }).catch(() => false)) {
            await mailItem.click().catch(() => {});
            // Pause so the rendered email is visibly recorded in the final walkthrough video
            await page.waitForTimeout(2500);
          }

          // Capture authentic screenshot of the YOPmail inbox + message preview
          const screenshot = await page.screenshot({ fullPage: true }).catch(() => null);
          if (screenshot && this.world && typeof this.world.attach === "function") {
            await this.world.attach(screenshot, "image/png");
            console.log(`[YopmailHelper] Attached YOPmail inbox screenshot (${screenshot.length} bytes) to Allure report`);
          }

          return { found: true, bodySnippet: bodyText.substring(0, 300) };
        }

        console.log(`[YopmailHelper] No matching email yet for ${cleanUser}. Refreshing... (${Math.round((Date.now() - startTime) / 1000)}s elapsed)`);

        // Click refresh button inside YOPmail
        const refreshBtn = page.locator("#refresh, #lrefr").first();
        if (await refreshBtn.isVisible().catch(() => false)) {
          await refreshBtn.click().catch(() => {});
        } else {
          await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
        }

        await page.waitForTimeout(pollInterval);
      }

      console.warn(`[YopmailHelper] Timeout (${timeoutMs}ms) waiting for email matching ${subjectRegex} for ${cleanUser}`);

      // Capture screenshot of timeout state
      const screenshot = await page.screenshot({ fullPage: true }).catch(() => null);
      if (screenshot && this.world && typeof this.world.attach === "function") {
        await this.world.attach(screenshot, "image/png");
      }

      return { found: false };
    } catch (err) {
      console.error(`[YopmailHelper] Error checking inbox for ${cleanUser}:`, err.message);

      const screenshot = await page.screenshot({ fullPage: true }).catch(() => null);
      if (screenshot && this.world && typeof this.world.attach === "function") {
        await this.world.attach(screenshot, "image/png");
      }

      return { found: false, error: err.message };
    } finally {
      // Seamlessly return the main scenario page back to Realey so the walkthrough video continues
      if (returnUrl && returnUrl !== "about:blank" && page.url() !== returnUrl) {
        console.log(`[YopmailHelper] Returning page back to Realey: ${returnUrl}`);
        await page.goto(returnUrl, { waitUntil: "domcontentloaded" }).catch(() => {});
        await page.waitForTimeout(1500);
      }
    }
  }
}

module.exports = { YopmailHelper };
