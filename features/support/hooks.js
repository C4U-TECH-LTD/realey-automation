const fs = require("fs");
const path = require("path");

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

setDefaultTimeout(120_000);

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

  page.on("console", (message) => {
    if (message.type() === "error") {
      console.error(`[Browser console] ${message.text()}`);
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
      fullPage: true,
      timeout: 30_000,
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
  if (!world.video) {
    console.warn("Video skipped because the scenario page has no Playwright video object.");
    return null;
  }

  ensureDirectory(CUCUMBER_VIDEO_DIRECTORY);

  const scenarioName = world.pickle?.name || "unknown-scenario";
  const timestamp = world.scenarioArtifactTimestamp || artifactTimestamp();
  const videoPath = path.join(
    CUCUMBER_VIDEO_DIRECTORY,
    `${sanitize(scenarioName)}__${timestamp}.webm`
  );

  try {
    // Playwright finalizes a video only when its page or browser context closes.
    // The After hook closes the context before calling this function.
    await world.video.saveAs(videoPath);

    if (!fs.existsSync(videoPath)) {
      throw new Error(`Playwright did not create the expected video: ${videoPath}`);
    }

    const videoBuffer = fs.readFileSync(videoPath);
    await world.attach(videoBuffer, "video/webm");
    console.log(`Video saved: ${videoPath}`);
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

  const isGitHub = process.env.CI === "true";
  const headless = isGitHub || process.env.HEADLESS === "true";
  const slowMo = isGitHub ? 0 : Number(process.env.SLOW_MO || 500);

  console.log(`Execution mode: ${isGitHub ? "GitHub Actions" : "Local"}`);
  console.log(`Headless: ${headless}`);
  console.log(`Slow Mo: ${slowMo}ms`);

  this.browser = await chromium.launch({
    channel: "chrome",
    headless,
    slowMo,
    args: headless
      ? ["--disable-dev-shm-usage", "--no-sandbox"]
      : ["--start-maximized"],
  });

  this.context = await this.browser.newContext({
    baseURL: this.baseURL || process.env.BASE_URL || "https://uat.realey.au/",
    viewport: headless ? { width: 1920, height: 1080 } : null,
    ignoreHTTPSErrors: false,
    recordVideo: {
      dir: PLAYWRIGHT_VIDEO_TEMP_DIRECTORY,
      size: { width: 1280, height: 720 },
    },
  });

  // Role changes reuse this context. New tabs are configured, but no hook or
  // role-switching step creates a replacement context.
  this.context.on("page", configurePage);

  this.page = await this.context.newPage();
  configurePage(this.page);

  // Keep the original scenario page and video reference for the whole scenario.
  // Auction registration is normalized back onto this page so one video contains
  // the complete Agent -> Buyer -> Agent -> Buyer journey.
  this.scenarioPage = this.page;
  this.video = this.scenarioPage.video();

  if (typeof this.initialisePageObjects !== "function") {
    throw new Error(
      "Custom RealeyWorld was not loaded. Check cucumber.js support require paths."
    );
  }

  this.initialisePageObjects();
});

BeforeStep(function ({ pickleStep }) {
  this.currentStepName = pickleStep.text;
});

AfterStep(async function ({ pickleStep, result }) {
  const suffix = result?.status === Status.FAILED ? "failed" : "after-step";
  await saveAndAttachScreenshot(this, pickleStep.text, suffix);
});

After(async function ({ result }) {
  try {
    // AfterStep normally captures failed steps. This fallback also covers failures
    // in hooks or teardown paths where a step-level image could not be produced.
    if (result?.status === Status.FAILED) {
      await saveAndAttachScreenshot(
        this,
        this.currentStepName || "scenario",
        "scenario-failed"
      );
    }

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
