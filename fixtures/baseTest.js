const { test: base, expect } = require('@playwright/test');

const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    page.on('console', (message) => {
      if (message.type() === 'error') {
        console.error(`[Browser console] ${message.text()}`);
      }
    });

    page.on('pageerror', (error) => {
      console.error(`[Uncaught browser error] ${error.message}`);
    });

    await use(page);

    // Add one final screenshot to the test result.
    const finalScreenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach('Final page state', {
      body: finalScreenshot,
      contentType: 'image/png'
    });
  }
});

module.exports = { test, expect };
