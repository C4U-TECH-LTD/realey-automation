const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

function sanitize(value) {
  return value
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

/**
 * Runs one named Playwright step, stores a PNG file, and attaches the image
 * to that exact step in Playwright/Allure.
 */
async function stepWithScreenshot(page, testInfo, title, action) {
  return test.step(title, async (step) => {
    let actionError;

    try {
      await action();
    } catch (error) {
      actionError = error;
    }

    const testName = sanitize(testInfo.title);
    const stepName = sanitize(title);
    const projectName = sanitize(testInfo.project.name);
    const directory = path.join(
      'screenshots',
      projectName,
      testName
    );

    fs.mkdirSync(directory, { recursive: true });

    const screenshotPath = path.join(
      directory,
      `${Date.now()}-${stepName}.png`
    );

    const screenshot = await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });

    await step.attach(`${title} - screenshot`, {
      body: screenshot,
      contentType: 'image/png'
    });

    if (actionError) {
      throw actionError;
    }
  });
}

module.exports = { stepWithScreenshot };
