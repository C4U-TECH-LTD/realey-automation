const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const {
  BeforeAll,
  Before,
  BeforeStep,
  AfterStep,
  After,
  Status,
  setDefaultTimeout,
} = require("@cucumber/cucumber");
const { chromium } = require("@playwright/test");

require("dotenv").config();

setDefaultTimeout(25 * 60 * 1000);

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const CUCUMBER_SCREENSHOT_DIRECTORY = path.join(
  PROJECT_ROOT,
  "screenshots",
  "cucumber"
);
const CUCUMBER_VIDEO_DIRECTORY = path.join(
  PROJECT_ROOT,
  "videos",
  "cucumber"
);
const PLAYWRIGHT_VIDEO_TEMP_DIRECTORY = path.join(
  PROJECT_ROOT,
  "videos",
  "playwright-temp"
);
const CUCUMBER_REPORT_DIRECTORY = path.join(
  PROJECT_ROOT,
  "reports",
  "cucumber"
);

function sanitize(value = "unnamed") {
  const sanitized = String(value)
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return sanitized || "unnamed";
}

function ensureDirectory(directory) {
  fs.mkdirSync(directory, { recursive: true });
}

function artifactTimestamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, "-");
}

function configurePage(page) {
  page.setDefaultTimeout(15_000);
  page.setDefaultNavigationTimeout(30_000);

  if (typeof page.addLocatorHandler === "function") {
    // 1. Notification popup handler ("Never miss a message" / "Enable notification" / "Turn on notifications")
    page.addLocatorHandler(
      page.locator('[role="dialog"]:not([aria-hidden="true"])').filter({
        hasText: /Never miss a message|enable.*notification|turn on notification/i,
      }),
      async (dialog) => {
        console.log("[AutoHandler] Notification popup detected, dismissing...");
        const closeBtn = dialog
          .locator('button.absolute.right-3.top-3, button.absolute, button:has(svg.lucide-x), [aria-label*="close" i], button:has-text("Close"), button:has-text("✕"), button:has-text("×")')
          .or(dialog.getByRole("button", { name: /^close$/i }))
          .first();

        if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log("[AutoHandler] Clicking cross (✕) button on notification popup...");
          await closeBtn.click({ force: true }).catch(() => {});
        } else {
          const skipBtn = dialog
            .getByRole("button", { name: /^skip/i })
            .or(dialog.locator('button:has-text("Skip")'))
            .first();
          if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log("[AutoHandler] Clicking 'Skip' button on notification popup...");
            await skipBtn.click({ force: true }).catch(() => {});
          } else {
            const laterBtn = dialog
              .getByRole("button", { name: /later|not now/i })
              .or(dialog.locator('button:has-text("Later"), button:has-text("Maybe later"), button:has-text("Not now")'))
              .first();
            if (await laterBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
              console.log("[AutoHandler] Clicking 'Later' / 'Not now' button on notification popup...");
              await laterBtn.click({ force: true }).catch(() => {});
            }
          }
        }

        // Force-hide/remove dialog in DOM so Playwright addLocatorHandler doesn't hang waiting for it
        await dialog.evaluate((el) => {
          try {
            const btn = Array.from(el.querySelectorAll('button')).find((b) =>
              /not now|later|skip|close/i.test(b.textContent || b.getAttribute('aria-label') || '')
            );
            if (btn) btn.click();
            el.remove();
          } catch (_) {
            el.style.display = 'none';
          }
          if (document.body) {
            document.body.style.pointerEvents = '';
            document.body.removeAttribute('data-scroll-locked');
            document.body.style.overflow = '';
          }
          if (document.documentElement) {
            document.documentElement.style.pointerEvents = '';
          }
        }).catch(() => {});

        await dialog.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
        await page.evaluate(() => {
          if (document.body) {
            document.body.style.pointerEvents = '';
            document.body.removeAttribute('data-scroll-locked');
            document.body.style.overflow = '';
          }
          if (document.documentElement) {
            document.documentElement.style.pointerEvents = '';
          }
        }).catch(() => {});
      }
    );

    // 2. Welcome to Realey popup modal handler
    page.addLocatorHandler(
      page.locator('[role="dialog"]:not([aria-hidden="true"])').filter({ hasText: /Welcome to Realey/i }),
      async (dialog) => {
        console.log("[AutoHandler] Dismissing 'Welcome to Realey' popup modal...");
        const closeBtn = dialog
          .locator('button.absolute.right-3.top-3, button.absolute, button:has(svg.lucide-x), [aria-label*="close" i], button:has-text("Close"), button:has-text("✕"), button:has-text("×")')
          .or(dialog.getByRole("button", { name: /^close$/i }))
          .first();

        if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log("[AutoHandler] Clicking cross (✕) button on Welcome to Realey modal...");
          await closeBtn.click({ force: true }).catch(() => {});
        } else {
          const skipBtn = dialog
            .getByRole("button", { name: /^skip$/i })
            .or(dialog.locator('button:has-text("Skip")'))
            .first();
          if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            console.log("[AutoHandler] Cross button not found, clicking 'Skip' button on Welcome to Realey modal...");
            await skipBtn.click({ force: true }).catch(() => {});
          } else {
            const laterBtn = dialog
              .getByRole("button", { name: /later|not now/i })
              .or(dialog.locator('button:has-text("Later"), button:has-text("Maybe later"), button:has-text("Not now")'))
              .first();
            if (await laterBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
              console.log("[AutoHandler] Cross button not found, clicking 'Later' / 'Not now' button on Welcome to Realey modal...");
              await laterBtn.click({ force: true }).catch(() => {});
            }
          }
        }

        // Force-hide/remove dialog in DOM so Playwright addLocatorHandler doesn't hang waiting for it
        await dialog.evaluate((el) => {
          try {
            const btn = Array.from(el.querySelectorAll('button')).find((b) =>
              /skip|close/i.test(b.textContent || b.getAttribute('aria-label') || '')
            );
            if (btn) btn.click();
            el.remove();
          } catch (_) {
            el.style.display = 'none';
          }
          if (document.body) {
            document.body.style.pointerEvents = '';
            document.body.removeAttribute('data-scroll-locked');
            document.body.style.overflow = '';
          }
          if (document.documentElement) {
            document.documentElement.style.pointerEvents = '';
          }
        }).catch(() => {});

        await dialog.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
        await page.evaluate(() => {
          if (document.body) {
            document.body.style.pointerEvents = '';
            document.body.removeAttribute('data-scroll-locked');
            document.body.style.overflow = '';
          }
          if (document.documentElement) {
            document.documentElement.style.pointerEvents = '';
          }
        }).catch(() => {});
      }
    );
  }

  let lastConsoleError = "";
  let duplicateConsoleErrorCount = 0;

  page.on("console", (message) => {
    if (message.type() === "error") {
      const text = message.text();
      if (text === lastConsoleError) {
        duplicateConsoleErrorCount++;
        if (duplicateConsoleErrorCount > 5) return;
      } else {
        lastConsoleError = text;
        duplicateConsoleErrorCount = 0;
      }
      console.error(`[Browser console] ${text}`);
    }
  });

  page.on("pageerror", (error) => {
    console.error(`[Uncaught browser error] ${error.message}`);
  });
}

async function saveAndAttachScreenshot(world, stepName, suffix = "after-step") {
  const page = world.page;

  if (!page || page.isClosed()) {
    console.warn(`Screenshot skipped because the active page is unavailable: ${stepName}`);
    return null;
  }

  ensureDirectory(CUCUMBER_SCREENSHOT_DIRECTORY);

  const scenarioName = world.pickle?.name || "unknown-scenario";
  const timestamp = artifactTimestamp();
  const filename = [
    sanitize(scenarioName),
    sanitize(stepName),
    sanitize(suffix),
    timestamp,
  ].join("__") + ".png";
  const screenshotPath = path.join(CUCUMBER_SCREENSHOT_DIRECTORY, filename);

  try {
    const screenshot = await page.screenshot({
      path: screenshotPath,
      fullPage: false,
      timeout: 5_000,
    });

    await world.attach(screenshot, "image/png");
    console.log(`Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  } catch (error) {
    console.error(`Unable to save/attach screenshot for "${stepName}": ${error.message}`);
    return null;
  }
}

async function saveAndAttachVideo(world) {
  ensureDirectory(CUCUMBER_VIDEO_DIRECTORY);
  ensureDirectory(PLAYWRIGHT_VIDEO_TEMP_DIRECTORY);

  const scenarioName = world.pickle?.name || "unknown-scenario";
  const timestamp = world.scenarioArtifactTimestamp || artifactTimestamp();
  const videoPath = path.join(
    CUCUMBER_VIDEO_DIRECTORY,
    `${sanitize(scenarioName)}__${timestamp}.webm`
  );

  const uniquePages = Array.from(new Set(world.allPages || []));
  const pagesWithVideo = uniquePages.filter((p) => {
    try {
      return p && typeof p.video === "function" && p.video() !== null;
    } catch (_) {
      return false;
    }
  });

  if (pagesWithVideo.length === 0 && !world.video) {
    console.warn("Video skipped because no Playwright video object was found.");
    return null;
  }

  try {
    const videoObjects = [];
    const seenVideos = new Set();
    for (const p of pagesWithVideo) {
      try {
        const v = typeof p.video === "function" ? p.video() : null;
        if (v && !seenVideos.has(v)) {
          seenVideos.add(v);
          videoObjects.push(v);
        }
      } catch (_) {}
    }
    if (videoObjects.length === 0 && world.video) {
      videoObjects.push(world.video);
    }

    const savedParts = [];
    for (let i = 0; i < videoObjects.length; i++) {
      const v = videoObjects[i];
      const partPath = path.join(
        PLAYWRIGHT_VIDEO_TEMP_DIRECTORY,
        `${sanitize(scenarioName)}__part_${i}_${timestamp}.webm`
      );
      try {
        await v.saveAs(partPath);
        if (fs.existsSync(partPath) && fs.statSync(partPath).size > 0) {
          savedParts.push(partPath);
        }
      } catch (err) {
        console.warn(`[Video] Failed saving video part ${i}:`, err.message);
      }
    }

    if (savedParts.length === 0) {
      console.warn("Video skipped: No non-empty video files were produced.");
      return null;
    }

    if (savedParts.length === 1) {
      fs.copyFileSync(savedParts[0], videoPath);
      try { fs.unlinkSync(savedParts[0]); } catch (_) {}
    } else {
      console.log(`[Video] Combining ${savedParts.length} screen/tab recordings into single video via ffmpeg...`);
      const concatListFile = path.join(
        PLAYWRIGHT_VIDEO_TEMP_DIRECTORY,
        `concat_${sanitize(scenarioName)}_${timestamp}.txt`
      );
      const fileListContent = savedParts
        .map((filePath) => `file '${filePath.replace(/\\/g, "/")}'`)
        .join("\n");
      fs.writeFileSync(concatListFile, fileListContent, "utf-8");

      let concatSuccess = false;
      try {
        execSync(
          `ffmpeg -y -f concat -safe 0 -i "${concatListFile}" -c copy "${videoPath}"`,
          { stdio: "ignore", timeout: 30000 }
        );
        concatSuccess = fs.existsSync(videoPath) && fs.statSync(videoPath).size > 0;
      } catch (_) {
        concatSuccess = false;
      }

      if (!concatSuccess) {
        try {
          execSync(
            `ffmpeg -y -f concat -safe 0 -i "${concatListFile}" -c:v libvpx-vp9 -b:v 1M "${videoPath}"`,
            { stdio: "ignore", timeout: 60000 }
          );
          concatSuccess = fs.existsSync(videoPath) && fs.statSync(videoPath).size > 0;
        } catch (_) {
          concatSuccess = false;
        }
      }

      try { fs.unlinkSync(concatListFile); } catch (_) {}

      if (!concatSuccess) {
        console.warn("[Video] ffmpeg concat failed, falling back to primary/longest recording.");
        const sortedBySize = [...savedParts].sort(
          (a, b) => fs.statSync(b).size - fs.statSync(a).size
        );
        const primaryPart = sortedBySize[0];
        if (primaryPart && fs.existsSync(primaryPart)) {
          fs.copyFileSync(primaryPart, videoPath);
        }
      }

      for (const part of savedParts) {
        try { fs.unlinkSync(part); } catch (_) {}
      }
    }

    if (!fs.existsSync(videoPath) || fs.statSync(videoPath).size === 0) {
      throw new Error(`Expected final video not found or empty: ${videoPath}`);
    }

    const videoBuffer = fs.readFileSync(videoPath);
    await world.attach(videoBuffer, "video/webm");
    console.log(`Unified scenario video attached to Allure: ${videoPath}`);
    return videoPath;
  } catch (error) {
    console.error(`Unable to save/attach scenario video: ${error.message}`);
    return null;
  }
}

BeforeAll(function () {
  ensureDirectory(CUCUMBER_SCREENSHOT_DIRECTORY);
  ensureDirectory(CUCUMBER_VIDEO_DIRECTORY);
  ensureDirectory(PLAYWRIGHT_VIDEO_TEMP_DIRECTORY);
  ensureDirectory(CUCUMBER_REPORT_DIRECTORY);
});

Before(async function ({ pickle }) {
  this.pickle = pickle;
  this.currentStepName = null;
  this.scenarioArtifactTimestamp = artifactTimestamp();

  // Cooldown buffer between scenarios to allow CloudFront / AWS WAF / Auth rate limit tokens to refresh
  const isStaging = (process.env.BASE_URL || "").includes("staging");
  const interScenarioCooldown = isStaging ? 15000 : 3000;
  await new Promise((resolve) => setTimeout(resolve, interScenarioCooldown));

  const isGitHub = process.env.CI === "true";
  const headless = isGitHub || process.env.HEADLESS === "true";
  const slowMo = (isGitHub || headless) ? 0 : Number(process.env.SLOW_MO || 500);

  console.log(`Execution mode: ${isGitHub ? "GitHub Actions" : "Local"}`);
  console.log(`Headless: ${headless}`);
  console.log(`Slow Mo: ${slowMo}ms`);

  const launchArgs = headless
    ? ["--disable-dev-shm-usage", "--no-sandbox"]
    : ["--start-maximized", "--window-position=0,0", "--activate-on-launch"];

  try {
    this.browser = await chromium.launch({
      channel: "chrome",
      headless,
      slowMo,
      args: launchArgs,
    });
  } catch (_) {
    this.browser = await chromium.launch({
      headless,
      slowMo,
      args: launchArgs,
    });
  }

  this.context = await this.browser.newContext({
    baseURL: this.baseURL || process.env.BASE_URL || "https://uat.realey.au/",
    viewport: { width: 1920, height: 1080 },
    permissions: ["notifications"],
    ignoreHTTPSErrors: false,
    recordVideo: {
      dir: PLAYWRIGHT_VIDEO_TEMP_DIRECTORY,
      size: { width: 1280, height: 720 },
    },
  });

  // Track all pages and tabs created under this context
  this.allPages = [];

  this.context.on("page", (newPage) => {
    configurePage(newPage);
    if (!this.allPages.includes(newPage)) {
      this.allPages.push(newPage);
    }
  });

  this.page = await this.context.newPage();
  if (!this.allPages.includes(this.page)) {
    this.allPages.push(this.page);
  }
  configurePage(this.page);
  await this.page.bringToFront().catch(() => {});

  // Keep the original scenario page and video reference for the whole scenario.
  this.scenarioPage = this.page;
  this.video = this.scenarioPage.video();

  if (typeof this.initialisePageObjects !== "function") {
    throw new Error(
      "Custom RealeyWorld was not loaded. Check cucumber.js support require paths."
    );
  }

  this.initialisePageObjects();
});

BeforeStep(async function ({ pickleStep }) {
  this.currentStepName = pickleStep.text;
  if (this.page && !this.page.isClosed()) {
    await this.page.evaluate(() => {
      if (document.body && document.body.style.pointerEvents === 'none') {
        document.body.style.pointerEvents = '';
        document.body.removeAttribute('data-scroll-locked');
        document.body.style.overflow = '';
      }
      if (document.documentElement && document.documentElement.style.pointerEvents === 'none') {
        document.documentElement.style.pointerEvents = '';
      }
    }).catch(() => {});
  }
});

AfterStep(async function ({ pickleStep, result }) {
  const suffix = result?.status === Status.FAILED ? "failed" : "after-step";
  await saveAndAttachScreenshot(this, pickleStep.text, suffix);
});

After(async function ({ result }) {
  try {
    const isFailed = result?.status === Status.FAILED;
    const finalSuffix = isFailed ? "scenario-failed" : "scenario-completed";
    await saveAndAttachScreenshot(
      this,
      this.currentStepName || "scenario",
      finalSuffix
    );

    if (this.context) {
      await this.context.close().catch((error) => {
        console.error(`Context close error: ${error.message}`);
      });
    }

    await saveAndAttachVideo(this);
  } finally {
    if (this.browser) {
      await this.browser.close().catch((error) => {
        console.error(`Browser close error: ${error.message}`);
      });
    }
  }
});

module.exports = {
  saveAndAttachScreenshot,
  saveAndAttachVideo,
};
