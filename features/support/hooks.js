const fs = require("fs");
const path = require("path");

const {
  BeforeAll,
  Before,
  AfterStep,
  After,
  Status,
  setDefaultTimeout,
} = require("@cucumber/cucumber");

const {
  chromium,
} = require("@playwright/test");

require("dotenv").config();

setDefaultTimeout(120_000);

function sanitize(value = "step") {
  return value
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

async function saveAndAttachScreenshot(
  world,
  name
) {
  if (
    !world.page ||
    world.page.isClosed()
  ) {
    return;
  }

  const scenarioName =
    world.pickle?.name ||
    "unknown-scenario";

  const directory = path.join(
    "screenshots",
    "cucumber",
    sanitize(scenarioName)
  );

  fs.mkdirSync(
    directory,
    {
      recursive: true,
    }
  );

  const screenshotPath =
    path.join(
      directory,
      `${Date.now()}-${sanitize(name)}.png`
    );

  const screenshot =
    await world.page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

  await world.attach(
    screenshot,
    "image/png"
  );
}

BeforeAll(function () {
  fs.mkdirSync(
    "screenshots/cucumber",
    {
      recursive: true,
    }
  );

  fs.mkdirSync(
    "reports/cucumber",
    {
      recursive: true,
    }
  );
});

Before(async function ({ pickle }) {
  this.pickle = pickle;

  // =====================================================
  // IMPORTANT:
  // HEADLESS=false => visible Chrome
  // HEADLESS=true  => headless Chrome
  // =====================================================

  const headless =
    process.env.HEADLESS === "true";

  const slowMo =
    headless
      ? 0
      : Number(
          process.env.SLOW_MO ||
          500
        );

  // =====================================================
  // BROWSER
  // =====================================================

  this.browser =
    await chromium.launch({
      channel: "chrome",

      headless,

      slowMo,

      args: headless
        ? [
            "--disable-dev-shm-usage",
            "--no-sandbox",
          ]
        : [
            "--start-maximized",
          ],
    });

  // =====================================================
  // BROWSER CONTEXT
  // =====================================================

  this.context =
    await this.browser.newContext({
      baseURL:
        this.baseURL ||
        process.env.BASE_URL ||
        "https://uat.realey.au/",

      viewport:
        headless
          ? {
              width: 1920,
              height: 1080,
            }
          : null,

      ignoreHTTPSErrors:
        false,
    });

  // =====================================================
  // PAGE
  // =====================================================

  this.page =
    await this.context.newPage();

  this.page.setDefaultTimeout(
    15_000
  );

  this.page.setDefaultNavigationTimeout(
    30_000
  );

  // =====================================================
  // BROWSER CONSOLE ERRORS
  // =====================================================

  this.page.on(
    "console",
    (message) => {
      if (
        message.type() ===
        "error"
      ) {
        console.error(
          `[Browser console] ${message.text()}`
        );
      }
    }
  );

  // =====================================================
  // PAGE ERRORS
  // =====================================================

  this.page.on(
    "pageerror",
    (error) => {
      console.error(
        `[Uncaught browser error] ${error.message}`
      );
    }
  );

  // =====================================================
  // INITIALISE PAGE OBJECTS
  // =====================================================

  if (
    typeof this.initialisePageObjects ===
    "function"
  ) {
    this.initialisePageObjects();
  } else {
    throw new Error(
      "Custom RealeyWorld was not loaded. " +
      "Check cucumber.js support require paths."
    );
  }
});

// =====================================================
// SCREENSHOT AFTER EVERY STEP
// =====================================================

AfterStep(
  async function ({
    pickleStep,
  }) {
    await saveAndAttachScreenshot(
      this,
      pickleStep.text
    );
  }
);

// =====================================================
// AFTER SCENARIO
// =====================================================

After(async function ({ result }) {
  try {
    if (
      result?.status ===
      Status.FAILED
    ) {
      await saveAndAttachScreenshot(
        this,
        "scenario-failed"
      );
    }
  } finally {
    await this.context
      ?.close()
      .catch(() => {});

    await this.browser
      ?.close()
      .catch(() => {});
  }
});

module.exports = {
  saveAndAttachScreenshot,
};