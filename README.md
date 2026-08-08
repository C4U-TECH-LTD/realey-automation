# Realey UAT - Playwright JavaScript, Cucumber BDD, and Allure

This starter framework targets:

`https://uat.realey.au/`

It uses:

- Playwright Test with JavaScript
- Cucumber BDD with JavaScript/CommonJS
- Page Object Model
- Allure reporting
- A screenshot saved and attached after every named test step
- Final-state screenshots
- Video and trace retention for failed tests
- Desktop Chrome, Firefox, Safari-compatible WebKit, and mobile Chrome projects

## 1. Requirements

Install:

- Node.js 20 or later
- Java 8 or later for the Allure command-line application

Verify:

```bash
node -v
npm -v
java -version
```

## 2. Install the project

```bash
npm install
npx playwright install
```

For Linux CI/server dependencies:

```bash
npx playwright install --with-deps
```

## 3. Environment configuration

Create `.env` from the example:

Windows CMD:

```cmd
copy .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

Linux/macOS:

```bash
cp .env.example .env
```

Add approved UAT accounts:

```env
BASE_URL=https://uat.realey.au
BUYER_EMAIL=buyer@example.com
BUYER_PASSWORD=your-password
AGENT_EMAIL=agent@example.com
AGENT_PASSWORD=your-password
LOGIN_OTP=your-fixed-uat-otp
INVALID_EMAIL=invalid-test-user@example.com
INVALID_PASSWORD=invalid-test-password
```

Never commit `.env`.

## 4. Run tests

Run all Playwright tests in Chrome:

```bash
npm test
```

Run Chrome only:

```bash
npm run test:chrome
```

Run in a visible browser:

```bash
npm run test:headed
```

Run only smoke tests:

```bash
npm run test:smoke
```

Run all Cucumber scenarios:

```bash
npm run test:cucumber
```

Run tagged Cucumber suites:

```bash
npm run test:cucumber:smoke
npm run test:cucumber:login
npm run test:cucumber:listing
npm run test:cucumber:regression
```

Cucumber runs headed Chrome locally and headless Chrome when `CI` is set or
`HEADLESS=true`. HTML and JSON reports are written to `reports/cucumber/`.
Cucumber step screenshots are written to `screenshots/cucumber/`. The original
Playwright tests and `stepWithScreenshot` helper remain unchanged.

## 5. Generate and open Allure

```bash
npm run report:generate
npm run report:open
```

Or generate a temporary report directly:

```bash
npm run report:serve
```

## 6. Screenshot behavior

Every business action should use:

```javascript
await stepWithScreenshot(page, testInfo, 'Open homepage', async () => {
  await page.goto('/');
});
```

The helper does two things:

1. Saves a physical PNG under:

```text
screenshots/<browser>/<test-name>/
```

2. Attaches the same PNG to the exact step displayed in Allure.

The fixture also attaches a final page-state screenshot. Failed tests retain
Playwright video, trace, and a failure screenshot.

## 7. Recommended test suites

```text
tests/
├── smoke/        # public availability and navigation
├── auth/         # buyer and agent login/logout
├── listing/      # listing creation and validation
├── offer/        # buyer offer and agent decision
├── settlement/   # five-step settlement process
├── profile/      # account and personal details
└── e2e/          # complete business journeys
```

## 8. Important testing practice

Do not automate destructive UAT flows using uncontrolled production-like data.
Use approved UAT buyer/agent accounts, unique listing titles, and cleanup logic.

Prefer accessible locators:

```javascript
page.getByRole('button', { name: 'Continue' });
page.getByLabel('Email');
page.getByTestId('listing-submit');
```

Ask developers to add stable `data-testid` attributes where text or layout is
likely to change.
