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
    const mailVideo = mailPage.video();

    let isClosed = false;
    const safeCloseMailPage = async () => {
      if (!isClosed) {
        isClosed = true;
        await mailPage.close().catch(() => {});
      }
    };

    const attachVideoIfAvailable = async () => {
      if (mailVideo && this.world && typeof this.world.attach === "function") {
        try {
          const videoDir = path.resolve(process.cwd(), "videos", "cucumber");
          if (!fs.existsSync(videoDir)) {
            fs.mkdirSync(videoDir, { recursive: true });
          }
          const videoPath = path.join(
            videoDir,
            `yopmail-${cleanUser}-${Date.now()}.webm`
          );
          await mailVideo.saveAs(videoPath).catch(() => {});
          if (fs.existsSync(videoPath)) {
            const videoBuffer = fs.readFileSync(videoPath);
            await this.world.attach(videoBuffer, "video/webm");
            console.log(`[YopmailHelper] Attached YOPmail video (${videoBuffer.length} bytes) to Allure report`);
          }
        } catch (videoErr) {
          console.warn(`[YopmailHelper] Could not save/attach YOPmail video: ${videoErr.message}`);
        }
      }
    };

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

          // Click the email to display full email body in the viewer
          const mailItem = inboxFrame.locator(`text=${subjectRegex}`).first();
          if (await mailItem.isVisible({ timeout: 2000 }).catch(() => false)) {
            await mailItem.click().catch(() => {});
            await mailPage.waitForTimeout(1500);
          }

          // Capture authentic screenshot of the YOPmail inbox + message preview
          const screenshot = await mailPage.screenshot({ fullPage: true }).catch(() => null);
          if (screenshot && this.world && typeof this.world.attach === "function") {
            await this.world.attach(screenshot, "image/png");
            console.log(`[YopmailHelper] Attached YOPmail inbox screenshot (${screenshot.length} bytes) to Allure report`);
          }

          await safeCloseMailPage();
          await attachVideoIfAvailable();

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

      // Capture screenshot of timeout state
      const screenshot = await mailPage.screenshot({ fullPage: true }).catch(() => null);
      if (screenshot && this.world && typeof this.world.attach === "function") {
        await this.world.attach(screenshot, "image/png");
      }

      await safeCloseMailPage();
      await attachVideoIfAvailable();

      return { found: false };
    } catch (err) {
      console.error(`[YopmailHelper] Error checking inbox for ${cleanUser}:`, err.message);

      const screenshot = await mailPage.screenshot({ fullPage: true }).catch(() => null);
      if (screenshot && this.world && typeof this.world.attach === "function") {
        await this.world.attach(screenshot, "image/png");
      }

      await safeCloseMailPage();
      await attachVideoIfAvailable();

      return { found: false, error: err.message };
    } finally {
      await safeCloseMailPage();
    }
  }
}

module.exports = { YopmailHelper };
