class YopmailHelper {
  /**
   * @param {import("@playwright/test").Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Check if an email matching the subjectRegex arrived for the given yopmail username
   * @param {string} username e.g. "broker.c4utest" or "solicitor.c4utest"
   * @param {RegExp|string} subjectRegex
   * @param {number} timeoutMs default 60,000ms (1 minute)
   */
  async waitForEmail(username, subjectRegex = /sales instructions|sales document/i, timeoutMs = 60_000) {
    const cleanUser = String(username || "")
      .replace(/@yopmail\.com$/i, "")
      .trim();

    console.log(`[YopmailHelper] Checking inbox for "${cleanUser}" with pattern: ${subjectRegex}`);

    const context = this.page.context();
    const mailPage = await context.newPage();

    try {
      await mailPage.goto(`https://yopmail.com?login=${encodeURIComponent(cleanUser)}`, {
        timeout: 30_000,
        waitUntil: "domcontentloaded",
      });
      await mailPage.waitForTimeout(2000);

      const loginInput = mailPage.locator("#login");
      if (await loginInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await loginInput.fill(cleanUser);
        const submitBtn = mailPage.locator("#refreshbut button, #refreshbut, button.material-icons-outlined").first();
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await mailPage.waitForTimeout(2000);
        }
      }

      const startTime = Date.now();
      const pollInterval = 5000;

      while (Date.now() - startTime < timeoutMs) {
        // Switch to inbox iframe
        const inboxFrame = mailPage.frameLocator("#ifinbox");
        const bodyText = await inboxFrame.locator("body").innerText().catch(() => "");

        if (subjectRegex.test(bodyText)) {
          console.log(`[YopmailHelper] Email matching ${subjectRegex} FOUND for ${cleanUser}!`);
          return { found: true, bodySnippet: bodyText.substring(0, 300) };
        }

        console.log(`[YopmailHelper] No matching email yet for ${cleanUser}. Refreshing... (${Math.round((Date.now() - startTime) / 1000)}s elapsed)`);

        // Click refresh button inside YOPmail
        const refreshBtn = mailPage.locator("#refresh, #lrefr").first();
        if (await refreshBtn.isVisible().catch(() => false)) {
          await refreshBtn.click().catch(() => {});
        } else {
          await mailPage.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
        }

        await mailPage.waitForTimeout(pollInterval);
      }

      console.warn(`[YopmailHelper] Timeout (${timeoutMs}ms) waiting for email matching ${subjectRegex} for ${cleanUser}`);
      return { found: false };
    } catch (err) {
      console.error(`[YopmailHelper] Error checking inbox for ${cleanUser}:`, err.message);
      return { found: false, error: err.message };
    } finally {
      await mailPage.close().catch(() => {});
    }
  }
}

module.exports = { YopmailHelper };
