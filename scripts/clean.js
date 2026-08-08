const fs = require('fs');

[
  'allure-results',
  'allure-report',
  'playwright-report',
  'test-results',
  'screenshots'
].forEach((directory) => {
  fs.rmSync(directory, { recursive: true, force: true });
});

console.log('Generated reports, screenshots, and test results removed.');
