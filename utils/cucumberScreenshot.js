const fs = require("fs");
const path = require("path");

function sanitize(value) {
  return String(value)
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

async function takeCucumberScreenshot(
  world,
  title,
  page = world.page
) {
  if (!page || page.isClosed()) {
    console.log(
      `Screenshot skipped - page unavailable: ${title}`
    );
    return;
  }

  const directory = path.join(
    "screenshots",
    "cucumber"
  );

  fs.mkdirSync(directory, {
    recursive: true,
  });

  const filename =
    `${Date.now()}-${sanitize(title)}.png`;

  const screenshotPath =
    path.join(directory, filename);

  const screenshot =
    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

  // Attach to Cucumber / Allure
  if (typeof world.attach === "function") {
    await world.attach(
      screenshot,
      "image/png"
    );
  }

  console.log(
    `Screenshot saved: ${screenshotPath}`
  );
}

module.exports = {
  takeCucumberScreenshot,
};