# Realey Automation - E2E Test Suite

[![Playwright](https://img.shields.io/badge/Playwright-1.55-green.svg)](https://playwright.dev/)
[![Cucumber](https://img.shields.io/badge/Cucumber.js-12.2-brightgreen.svg)](https://cucumber.io/)
[![Allure Report](https://img.shields.io/badge/Allure-Report-blue.svg)](https://c4u-tech-ltd.github.io/realey-automation/#suites)
[![Node.js](https://img.shields.io/badge/Node.js-24+-blue.svg)](https://nodejs.org/)

Automated End-to-End (E2E) testing framework for the **Realey** real estate platform using **Playwright**, **Cucumber.js (BDD)**, and **Allure Reports**.

---

## 📊 Live Test Report

The latest test execution results, screenshots, and step logs are published on GitHub Pages:

🔗 **[Realey Automation Allure Report (Suites)](https://c4u-tech-ltd.github.io/realey-automation/#suites)**

---

## 🚀 End-to-End Test Flows (1 to 7)

All E2E test flows are self-contained and run sequentially in order from Flow 1 to Flow 7:

| Flow # | Flow Name | Feature File | Tags | Description |
| :---: | :--- | :--- | :---: | :--- |
| **Flow 1** | Fixed Price Direct Offer Acceptance & Settlement | `01-fixed-price-direct-offer.feature` | `@flow-1` `@all-flows` | Agent creates a Fixed Price listing, General User submits direct offer, Agent accepts, General User selects solicitor & broker and completes deposit payment. |
| **Flow 2** | Offer Price Counter Offer Negotiation & Settlement | `02-offer-price-counter-offer-settlement.feature` | `@flow-2` `@all-flows` | Agent creates Offer Price listing, Buyer submits offer, Agent counters via chat, Buyer counter-negotiates, Agent accepts, Buyer pays deposit. |
| **Flow 3** | Auction Bidding & Settlement | `03-auction-bidding-settlement.feature` | `@flow-3` `@all-flows` | Agent creates Auction listing, 2 bidders register, Buyer 1 bids, Buyer 2 places winning bid, auction ends, winning buyer pays deposit and completes details. |
| **Flow 4** | Auction Reserve Not Met Counter Offer Negotiation & Settlement | `04-auction-reserve-not-met-counter-offer.feature` | `@flow-4` `@all-flows` | Agent creates Auction listing, bidder bids below reserve, auction ends with reserve not met, Agent and Buyer negotiate via counter offers, Agent accepts, Buyer completes settlement. |
| **Flow 5** | Auction Reserve Not Met Counter Rejection & Fixed Price Relisting | `05-auction-counter-rejected-relist.feature` | `@flow-5` `@all-flows` | Agent creates Auction listing, bidder bids below reserve, auction ends, Agent rejects buyer counter offer and successfully re-lists the property as Fixed Price. |
| **Flow 6** | Fixed Price Settlement Exchange & Document Signing | `06-settlement_exchange_signing.feature` | `@flow-6` `@all-flows` | Completes direct offer settlement, initiates exchange, Buyer Solicitor assigns Buyer for signing, Seller Solicitor passes documents to Vendor, both sign documents, solicitors agree on settlement date. |
| **Flow 7** | Fixed Price Direct Offer Sales Instructions | `07-sales_instructions.feature` | `@flow-7` `@all-flows` | Verifies Sales Instructions action is blocked before settlement, becomes available upon completion, sends once to Broker and Solicitors, and tests delivery idempotency. |

---

## 🏗️ Architecture & Flow Dependencies

* **Zero Dependencies Between Flows**: Each flow generates its own unique listing dynamically using timestamped property titles (e.g. `E2E Fixed Price Automation <timestamp>`). No flow relies on data, state, or listings created by an earlier flow.
* **Sequential Execution**: Flows run sequentially in numerical order (1 through 7) to avoid race conditions, eliminate server rate-limiting, and ensure predictable Allure test results.
* **Page Object Model (POM)**: Located under `pages/`, encapsulating UI interactions, locators, and resilient waits.
* **Multi-Role Simulation**: Uses separate authenticated contexts for Agent, General User / Buyer 1, Buyer 2, Buyer Solicitor, Seller Solicitor, and Vendor.

---

## 🛠️ Getting Started

### Prerequisites
* **Node.js**: v20 or v24+
* **Google Chrome** or **Chromium**

### Installation
```bash
git clone https://github.com/C4U-TECH-LTD/realey-automation.git
cd realey-automation
npm install
npx playwright install --with-deps chromium
```

### Environment Configuration
Create a `.env` file in the project root with the following variables:
```env
BASE_URL=https://uat.realey.com

# Agent Credentials
AGENT_EMAIL=your_agent@example.com
AGENT_PASSWORD=your_password
AGENT_OTP=your_otp

# General User / Buyer Credentials
GENERAL_USER_EMAIL=your_user@example.com
GENERAL_USER_PASSWORD=your_password
GENERAL_USER_OTP=your_otp

# Auction Buyer 2
AUCTION_BUYER_2_EMAIL=your_buyer2@example.com
AUCTION_BUYER_2_PASSWORD=your_password
AUCTION_BUYER_2_OTP=your_otp

# Solicitors & Vendor
BUYER_SOLICITOR_EMAIL=your_buyer_solicitor@example.com
BUYER_SOLICITOR_PASSWORD=your_password
BUYER_SOLICITOR_OTP=your_otp

SELLER_SOLICITOR_EMAIL=your_seller_solicitor@example.com
SELLER_SOLICITOR_PASSWORD=your_password
SELLER_SOLICITOR_OTP=your_otp

VENDOR_EMAIL=your_vendor@example.com
VENDOR_PASSWORD=your_password
VENDOR_OTP=your_otp

# Test Payment Card
TEST_CARD_NUMBER=4242424242424242
TEST_CARD_EXPIRY=12/28
TEST_CARD_CVC=123
```

---

## 🧪 Running Tests

### Run All Flows (Sequential 1 to 7)
```bash
npm run test:all-flows
```

### Run Individual Flows
```bash
npm run test:flow-1   # Flow 1 - Fixed Price Direct Offer
npm run test:flow-2   # Flow 2 - Offer Price Counter Offer
npm run test:flow-3   # Flow 3 - Auction Bidding
npm run test:flow-4   # Flow 4 - Auction Reserve Not Met Counter Offer
npm run test:flow-5   # Flow 5 - Auction Counter Rejection & Relist
npm run test:flow-6   # Flow 6 - Settlement Exchange & Signing
npm run test:flow-7   # Flow 7 - Sales Instructions
```

---

## 📈 Allure Reporting

### Generate & Open Report Locally
```bash
# Generate HTML report from test results
npm run report:generate

# Open the generated Allure report in browser
npm run report:open

# Or serve directly:
npm run report:serve
```

---

## 🤖 GitHub Actions CI/CD

The repository includes pre-configured workflows under `.github/workflows/`:
* **All Flows (Flow 1 to 7) - Full E2E Suite**: Triggerable via `workflow_dispatch` to run the complete suite sequentially and automatically deploy the Allure report to GitHub Pages.
* **Individual Workflows**: Dedicated workflows for running Flow 1 through Flow 7 independently.
