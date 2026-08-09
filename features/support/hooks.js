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

// =====================================================
// HELPERS
// =====================================================

function sanitize(value = "step") {
  return value
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function ensureDirectory(directory) {
  fs.mkdirSync(
    directory,
    {
      recursive: true,
    }
  );
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

  ensureDirectory(directory);

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

async function saveAndAttachVideo(
  world
) {
  if (!world.video) {
    console.log(
      "No Playwright video object found."
    );

    return;
  }

  const scenarioName =
    world.pickle?.name ||
    "unknown-scenario";

  const videoDirectory =
    path.join(
      "videos",
      "cucumber"
    );

  ensureDirectory(
    videoDirectory
  );

  const videoPath =
    path.join(
      videoDirectory,
      `${Date.now()}-${sanitize(
        scenarioName
      )}.webm`
    );

  try {
    /*
     * Playwright saveAs() waits until
     * the page/context video is finalized.
     */
    await world.video.saveAs(
      videoPath
    );

    if (
      !fs.existsSync(
        videoPath
      )
    ) {
      console.log(
        `Video was not found at: ${videoPath}`
      );

      return;
    }

    const videoBuffer =
      fs.readFileSync(
        videoPath
      );

    /*
     * Cucumber attachment is picked up
     * by the Allure Cucumber reporter.
     */
    await world.attach(
      videoBuffer,
      "video/webm"
    );

    console.log(
      `Video saved: ${videoPath}`
    );
  } catch (error) {
    console.error(
      `Unable to save/attach video: ${error.message}`
    );
  }
}

// =====================================================
// BEFORE ALL
// =====================================================

BeforeAll(function () {
  ensureDirectory(
    "screenshots/cucumber"
  );

  ensureDirectory(
    "reports/cucumber"
  );

  ensureDirectory(
    "videos/cucumber"
  );
});

// =====================================================
// BEFORE EACH SCENARIO
// =====================================================

Before(
  async function ({ pickle }) {
    this.pickle = pickle;

    /*
     * Important:
     *
     * HEADLESS=false
     * => visible Chrome
     *
     * HEADLESS=true
     * => hidden/headless Chrome
     */
    const headless =
      process.env.HEADLESS ===
      "true";

    const slowMo =
      headless
        ? 0
        : Number(
            process.env.SLOW_MO ||
            500
          );

    // =================================================
    // BROWSER
    // =================================================

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

    // =================================================
    // CONTEXT
    // =================================================

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

        /*
         * Record the complete scenario.
         */
        recordVideo: {
          dir:
            "videos/playwright-temp",

          size: {
            width: 1280,
            height: 720,
          },
        },
      });

    // =================================================
    // PAGE
    // =================================================

    this.page =
      await this.context.newPage();

    /*
     * Save video object BEFORE context closes.
     */
    this.video =
      this.page.video();

    this.page.setDefaultTimeout(
      15_000
    );

    this.page.setDefaultNavigationTimeout(
      30_000
    );

    // =================================================
    // CONSOLE
    // =================================================

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

    // =================================================
    // PAGE ERROR
    // =================================================

    this.page.on(
      "pageerror",
      (error) => {
        console.error(
          `[Uncaught browser error] ${error.message}`
        );
      }
    );

    // =================================================
    // PAGE OBJECTS
    // =================================================

    if (
      typeof this
        .initialisePageObjects ===
      "function"
    ) {
      this.initialisePageObjects();
    } else {
      throw new Error(
        "Custom RealeyWorld was not loaded. " +
        "Check cucumber.js support require paths."
      );
    }
  }
);

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
// AFTER EACH SCENARIO
// =====================================================

After(
  async function ({ result }) {
    try {
      // ===============================================
      // FAILURE SCREENSHOT
      // ===============================================

      if (
        result?.status ===
        Status.FAILED
      ) {
        await saveAndAttachScreenshot(
          this,
          "scenario-failed"
        );
      }

      /*
       * Video is fully finalized only
       * when the browser context closes.
       */
      if (this.context) {
        await this.context
          .close()
          .catch(
            (error) => {
              console.error(
                `Context close error: ${error.message}`
              );
            }
          );
      }

      // ===============================================
      // SAVE + ATTACH VIDEO
      // ===============================================

      await saveAndAttachVideo(
        this
      );
    } finally {
      // ===============================================
      // CLOSE BROWSER
      // ===============================================

      if (this.browser) {
        await this.browser
          .close()
          .catch(
            (error) => {
              console.error(
                `Browser close error: ${error.message}`
              );
            }
          );
      }
    }
  }
);

module.exports = {
  saveAndAttachScreenshot,
  saveAndAttachVideo,
};