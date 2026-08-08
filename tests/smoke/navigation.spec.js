const { test, expect } = require('../../fixtures/baseTest');
const { stepWithScreenshot } = require('../../utils/step');
const HomePage = require('../../pages/HomePage');

test('Public navigation links can be inspected', async ({ page }, testInfo) => {
  const homePage = new HomePage(page);

  await stepWithScreenshot(page, testInfo, 'Open homepage', async () => {
    await homePage.open();
  });

  await stepWithScreenshot(page, testInfo, 'Collect visible navigation links', async () => {
    const links = page.locator('a:visible');
    expect(await links.count()).toBeGreaterThan(0);

    const linkDetails = await links.evaluateAll((elements) =>
      elements.slice(0, 50).map((element) => ({
        text: (element.textContent || '').trim(),
        href: element.href
      }))
    );

    await testInfo.attach('Visible navigation links', {
      body: JSON.stringify(linkDetails, null, 2),
      contentType: 'application/json'
    });
  });
});
