# Realey Automation - End-to-End Test Framework

[![Playwright](https://img.shields.io/badge/Playwright-1.55-green.svg)](https://playwright.dev/)
[![Cucumber](https://img.shields.io/badge/Cucumber.js-12.2-brightgreen.svg)](https://cucumber.io/)
[![Allure Report](https://img.shields.io/badge/Allure-Report-blue.svg)](https://c4u-tech-ltd.github.io/realey-automation/#suites)
[![Node.js](https://img.shields.io/badge/Node.js-24+-blue.svg)](https://nodejs.org/)

Automated End-to-End (E2E) testing framework for the **Realey** platform built using **Playwright**, **Cucumber.js (BDD)**, and **Allure Reports**.

---

## 📑 Table of Contents
1. [Flow Details](#-1-flow-details)
2. [How to Run the Flows](#-2-how-to-run-the-flows)
3. [Flow Execution Order & Dependencies](#-3-flow-execution-order--dependencies)
4. [Automation Reporting](#-4-automation-reporting)
5. [Automation Project Structure](#-5-automation-project-structure)
6. [How to Add a New Flow](#-6-how-to-add-a-new-flow)

---

## 📋 1. Flow Details

Each automation flow represents a complete, self-contained business journey across the Realey platform. Every flow creates its own listing dynamically from scratch, operates independently, and executes cleanly without depending on any other flow.

### Flow Catalog

#### Flow 1: Fixed Price Direct Offer Acceptance and Settlement
* **Flow Name**: `Flow 1 - Fixed Price Direct Offer Acceptance and Settlement`
* **Feature File**: `features/e2e/01-fixed-price-direct-offer.feature`
* **Tags**: `@flow-1`, `@all-flows`, `@fixed-price`, `@direct-offer`
* **Purpose of the Flow**: Verifies the end-to-end direct purchase lifecycle of a Fixed Price property without negotiations. An Agent creates and publishes a Fixed Price listing (assigning a Seller Solicitor), a General User (Buyer) discovers the property and submits an offer, the Agent accepts the offer, and the Buyer completes settlement by selecting conveyancing/mortgage representation and paying the deposit.
* **Any Dependency on Other Flows**: **None**. Generates its own fresh property listing with a unique timestamp (`E2E Fixed Price Automation <timestamp>`).
* **Can It Be Executed Independently?**: **Yes**, completely independent.
* **Execution Order**: Can run as an individual flow or sequentially within the full suite.
* **Report Link**: [Allure Report - Flow 1](https://c4u-tech-ltd.github.io/realey-automation/#suites)

---

#### Flow 2: Offer Price Counter Offer Negotiation and Settlement
* **Flow Name**: `Flow 2 - Offer Price Counter Offer Negotiation and Settlement`
* **Feature File**: `features/e2e/02-offer-price-counter-offer-settlement.feature`
* **Tags**: `@flow-2`, `@all-flows`, `@offer-price`, `@counter-offer`
* **Purpose of the Flow**: Verifies price negotiation for properties listed under "Offer Price". The Agent creates the listing, the Buyer submits an initial offer, the Agent counters via real-time chat, the Buyer counter-negotiates with a revised amount, the Agent accepts the revised terms, and the Buyer completes settlement and deposit payment.
* **Any Dependency on Other Flows**: **None**. Generates and operates on its own unique property listing (`E2E Offer Price Automation <timestamp>`).
* **Can It Be Executed Independently?**: **Yes**, completely independent.
* **Execution Order**: Can run as an individual flow or sequentially within the full suite.
* **Report Link**: [Allure Report - Flow 2](https://c4u-tech-ltd.github.io/realey-automation/#suites)

---

#### Flow 3: Auction Bidding and Settlement
* **Flow Name**: `Flow 3 - Auction Bidding and Settlement`
* **Feature File**: `features/e2e/03-auction-bidding-settlement.feature`
* **Tags**: `@flow-3`, `@all-flows`, `@auction`, `@bidding`
* **Purpose of the Flow**: Verifies multi-bidder competitive bidding in live auctions. The Agent publishes an Auction listing with a reserve price, two independent buyers register as bidders and place incremental bids, Buyer 2 places the highest winning bid above reserve, the auction countdown timer expires, and the winning bidder proceeds to settlement and pays the required deposit.
* **Any Dependency on Other Flows**: **None**. Creates its own auction listing (`E2E Auction Automation <timestamp>`).
* **Can It Be Executed Independently?**: **Yes**, completely independent.
* **Execution Order**: Can run as an individual flow or sequentially within the full suite.
* **Report Link**: [Allure Report - Flow 3](https://c4u-tech-ltd.github.io/realey-automation/#suites)

---

#### Flow 4: Auction Reserve Price Not Met Counter Offer Negotiation and Settlement
* **Flow Name**: `Flow 4 - Auction Reserve Price Not Met Counter Offer Negotiation and Settlement`
* **Feature File**: `features/e2e/04-auction-reserve-not-met-counter-offer.feature`
* **Tags**: `@flow-4`, `@all-flows`, `@auction`, `@reserve-not-met`, `@counter-offer`, `@settlement`
* **Purpose of the Flow**: Verifies post-auction negotiation when bidding concludes without reaching the reserve price. When the auction ends with "Reserve Not Met", the Agent initiates post-auction negotiation with the highest bidder. The parties negotiate terms via chat, the Agent accepts the agreed offer, and the buyer completes settlement and deposit payment.
* **Any Dependency on Other Flows**: **None**. Creates its own independent auction listing (`E2E Auction Reserve Not Met <timestamp>`).
* **Can It Be Executed Independently?**: **Yes**, completely independent.
* **Execution Order**: Can run as an individual flow or sequentially within the full suite.
* **Report Link**: [Allure Report - Flow 4](https://c4u-tech-ltd.github.io/realey-automation/#suites)

---

#### Flow 5: Auction Reserve Price Not Met Counter Rejection and Fixed Price Relisting
* **Flow Name**: `Flow 5 - Auction Reserve Price Not Met Counter Rejection and Fixed Price Relisting`
* **Feature File**: `features/e2e/05-auction-counter-rejected-relist.feature`
* **Tags**: `@flow-5`, `@all-flows`, `@auction`, `@reserve-not-met`, `@counter-reject`, `@relist-fixed`
* **Purpose of the Flow**: Verifies failed post-auction negotiations leading to property re-listing. Bidding closes below the reserve price, the Agent initiates negotiations, the buyer counters, and the Agent rejects the counter. The Agent then initiates the "Re-list" workflow, converts the listing type from Auction to Fixed Price, updates pricing, and republishes the property.
* **Any Dependency on Other Flows**: **None**. Creates its own independent auction listing (`E2E Auction Counter Rejected <timestamp>`).
* **Can It Be Executed Independently?**: **Yes**, completely independent.
* **Execution Order**: Can run as an individual flow or sequentially within the full suite.
* **Report Link**: [Allure Report - Flow 5](https://c4u-tech-ltd.github.io/realey-automation/#suites)

---

#### Flow 6: Fixed Price Settlement Exchange and Document Signing
* **Flow Name**: `Flow 6 - Fixed Price Settlement Exchange and Document Signing`
* **Feature File**: `features/e2e/06-settlement_exchange_signing.feature`
* **Tags**: `@flow-6`, `@all-flows`, `@fixed-price`, `@direct-offer`, `@settlement`, `@exchange`, `@document-signing`
* **Purpose of the Flow**: Verifies the multi-party conveyancing process following settlement initiation. Covers: marking settlement Ready for Exchange, Seller Solicitor contract exchange initiation, Buyer Solicitor assignment, Buyer document signing, document transfer to Seller Solicitor, adding the Vendor, Vendor document signing, and mutual solicitor agreement on the formal settlement date verified against the shared calendar.
* **Any Dependency on Other Flows**: **None**. Creates its own fresh listing and completes initial settlement in its early steps.
* **Can It Be Executed Independently?**: **Yes**, completely independent.
* **Execution Order**: Can run as an individual flow or sequentially within the full suite.
* **Report Link**: [Allure Report - Flow 6](https://c4u-tech-ltd.github.io/realey-automation/#suites)

---

#### Flow 7: Fixed Price Direct Offer Sales Instructions
* **Flow Name**: `Flow 7 - Fixed Price Direct Offer Sales Instructions`
* **Feature File**: `features/e2e/07-sales_instructions.feature`
* **Tags**: `@flow-7`, `@all-flows`, `@fixed-price`, `@settlement`, `@sales-instructions`, `@notifications`
* **Purpose of the Flow**: Validates compliance rules, document generation, multi-channel notification dispatch, and delivery idempotency for Sales Instructions. Asserts that the action is blocked before settlement completion, becomes available upon completion, delivers exactly one chatroom message, email, and in-app notification to Broker, Seller Solicitor, and Buyer Solicitor (while strictly excluding Buyer and Vendor), and generates zero duplicate deliveries when clicked again.
* **Any Dependency on Other Flows**: **None**. Creates its own fresh listing and completes settlement in its early steps.
* **Can It Be Executed Independently?**: **Yes**, completely independent.
* **Execution Order**: Can run as an individual flow or sequentially within the full suite.
* **Report Link**: [Allure Report - Flow 7](https://c4u-tech-ltd.github.io/realey-automation/#suites)

---

## 🚀 2. How to Run the Flows

### Environment Setup & Prerequisites
The automation suite requires the following tools:
* **Node.js**: v20 or v24+ ([Download Node.js](https://nodejs.org/))
* **Google Chrome / Chromium**: Installed on your system

#### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/C4U-TECH-LTD/realey-automation.git
cd realey-automation
npm install
npx playwright install --with-deps chromium
```

#### Step 2: Configure Environment Variables
Copy `.env.example` to a new file named `.env`:
```bash
cp .env.example .env
```
Populate `.env` with valid credentials and settings:
```env
# Application Base URL
BASE_URL=https://uat.realey.au

# Execution Controls (set HEADLESS=false for headed browser debugging)
HEADLESS=false
SLOW_MO=300

# User Role Credentials
AGENT_EMAIL=agent@example.com
AGENT_PASSWORD=Password@123
AGENT_OTP=123456

GENERAL_USER_EMAIL=buyer@example.com
GENERAL_USER_PASSWORD=Password@123
GENERAL_USER_OTP=123456

AUCTION_BUYER_2_EMAIL=buyer2@example.com
AUCTION_BUYER_2_PASSWORD=Password@123
AUCTION_BUYER_2_OTP=123456

BUYER_SOLICITOR_EMAIL=buyer_solicitor@example.com
BUYER_SOLICITOR_PASSWORD=Password@123
BUYER_SOLICITOR_OTP=123456

SELLER_SOLICITOR_EMAIL=seller_solicitor@example.com
SELLER_SOLICITOR_PASSWORD=Password@123
SELLER_SOLICITOR_OTP=123456

VENDOR_EMAIL=vendor@example.com
VENDOR_PASSWORD=Password@123
VENDOR_OTP=123456

# Test Payment Card (Stripe)
TEST_CARD_NUMBER=4242424242424242
TEST_CARD_EXPIRY=12/28
TEST_CARD_CVC=123
```

---

### Executing an Individual Flow
You can execute **any individual flow** using its dedicated tag or npm shortcut:

```bash
# General tag syntax (works for ANY current or future flow):
npx cucumber-js --tags "@flow-<number>"

# Examples:
npx cucumber-js --tags "@flow-1"    # Run Flow 1
npx cucumber-js --tags "@flow-2"    # Run Flow 2
npx cucumber-js --tags "@flow-3"    # Run Flow 3
npx cucumber-js --tags "@flow-4"    # Run Flow 4
npx cucumber-js --tags "@flow-5"    # Run Flow 5
npx cucumber-js --tags "@flow-6"    # Run Flow 6
npx cucumber-js --tags "@flow-7"    # Run Flow 7

# Or run directly by feature file path:
npx cucumber-js features/e2e/01-fixed-price-direct-offer.feature
```

Or using package.json npm scripts:
```bash
npm run test:flow-1
npm run test:flow-2
npm run test:flow-3
npm run test:flow-4
npm run test:flow-5
npm run test:flow-6
npm run test:flow-7
```

---

### Executing All Available Flows Together
To execute **all available flows together**, use the `@all-flows` tag:

```bash
npm run test:all-flows
# or directly:
npx cucumber-js --tags "@all-flows"
```

> [!IMPORTANT]
> **Dynamic & Extensible Suite**: The framework does not hardcode a fixed number of flows. All current and future flows are tagged with `@all-flows`. Whenever a new flow is added with this tag, `npm run test:all-flows` automatically discovers and executes it in sequence without requiring any script changes.

---

## 🔄 3. Flow Execution Order & Dependencies

### Dependency Audit Results
* **Zero Cross-Flow Dependencies**: An exhaustive check confirms that **no flow is connected to or dependent on another flow**.
* Each flow creates its own listing dynamically with a unique timestamped title (`E2E <Type> Automation <timestamp>`), operates with isolated browser contexts, and completes its lifecycle independently.

### Execution Order Guidelines
1. **Independent Execution**: Because there are no inter-flow dependencies, any flow can be executed on its own at any time in any order without prerequisites.
2. **Sequential Execution When Running Together**: When executing all flows together, the suite executes them **sequentially** (`Flow 1` $\rightarrow$ `Flow 2` $\rightarrow$ `Flow 3` $\rightarrow$ ...):
   * **Prevents Server Rate Limits**: Running multiple browser flows in parallel can trigger backend rate limiting (such as the platform's 15-minute OTP and login rate limits). Sequential execution eliminates this risk.
   * **Hardware Resource Protection**: Sequential execution avoids overwhelming local or CI CPU/RAM with multiple simultaneous browser instances.
   * **Clear Chronological Reports**: Preserves a readable, linear timeline in the Allure report dashboard.

---

## 📊 4. Automation Reporting

### Where Reports Are Generated
During each test execution, reports and artifacts are saved to:

| Artifact / Report | Storage Path | Description |
| :--- | :--- | :--- |
| **Allure HTML Report** | `allure-report/index.html` | Interactive report with test status, steps, execution duration, and screenshots. |
| **Allure Raw Results** | `allure-results/` | Raw JSON test execution data and attachments consumed by Allure CLI. |
| **Cucumber HTML Report** | `reports/cucumber/cucumber-report.html` | Single-page standalone HTML report. |
| **Cucumber JSON Report** | `reports/cucumber/cucumber-report.json` | Structured JSON results for CI consumption. |
| **Step Screenshots** | `screenshots/cucumber/` | Full-resolution PNG screenshots captured for each step and on failures. |
| **Video Recordings** | `videos/cucumber/` | Full session `.webm` video recordings of each scenario. |

### Live Report Link
The latest automated test execution results are automatically compiled and published to GitHub Pages:

🔗 **[Realey Automation Allure Report (Suites)](https://c4u-tech-ltd.github.io/realey-automation/#suites)**

### Sequential Flow Numbering in Reports
Allure groups and displays tests by their Gherkin `Feature:` (Suite) and `Scenario:` (Test Case) titles. To ensure crystal-clear reporting:
* Each feature is titled: `Feature: Flow <N> - <Feature Title>`
* Each scenario is titled: `Scenario: Flow <N> - <Scenario Title>`

In the Allure Report (**Suites**, **Behaviors**, and **Timeline** tabs), tests are clearly displayed in sequential order:
```
Flow 1 - Fixed Price Direct Offer Acceptance and Settlement
Flow 2 - Offer Price Counter Offer Negotiation and Settlement
Flow 3 - Auction Bidding and Settlement
Flow 4 - Auction Reserve Price Not Met Counter Offer Negotiation and Settlement
Flow 5 - Auction Reserve Price Not Met Counter Rejection and Fixed Price Relisting
Flow 6 - Fixed Price Direct Offer Settlement Exchange and Document Signing
Flow 7 - Fixed Price Direct Offer Sales Instructions
```

### Local Report Commands
```bash
# Generate HTML report from test results:
npm run report:generate

# Open the compiled Allure report in your default browser:
npm run report:open

# Or generate and serve on a local web server:
npm run report:serve
```

---

## 📁 5. Automation Project Structure

The project follows the **Page Object Model (POM)** and BDD architecture:

```text
realey-automation/
├── .github/
│   └── workflows/                # CI/CD pipeline definitions
│       ├── all-flows-1-to-7.yml  # Workflow for sequential run of all flows & Pages deploy
│       └── flow-*-*.yml          # Individual workflow files per flow
├── features/
│   ├── e2e/                      # End-to-End BDD feature files (ordered sequentially)
│   │   ├── 01-fixed-price-direct-offer.feature
│   │   ├── 02-offer-price-counter-offer-settlement.feature
│   │   ├── 03-auction-bidding-settlement.feature
│   │   ├── 04-auction-reserve-not-met-counter-offer.feature
│   │   ├── 05-auction-counter-rejected-relist.feature
│   │   ├── 06-settlement_exchange_signing.feature
│   │   ├── 07-sales_instructions.feature
│   │   └── ...                   # Location for future flows (08-..., 09-...)
│   ├── step-definitions/         # Cucumber step definitions mapping Gherkin steps to code
│   │   ├── create-listing.steps.js
│   │   ├── offer-page.steps.js
│   │   ├── settlement-exchange-signing.steps.js
│   │   └── ...
│   └── support/                  # Cucumber test runners and hooks
│       ├── hooks.js              # Before/After hooks, screenshots, video capture
│       └── world.js              # Custom Cucumber World & multi-role browser contexts
├── pages/                        # Page Object Model (POM) classes & UI locators
│   ├── LoginPage.js              # Authentication, OTP handling, and role login
│   ├── PropertyLocationPage.js   # Listing creation wizard & solicitor assignment
│   ├── OfferPage.js              # Offer submission, counter-offers, and chat
│   ├── SettlementPage.js         # Settlement wizard, Stripe payments, document signing
│   ├── GeneralUserListingsPage.js# Property browsing, search, and listing details
│   └── ...
├── fixtures/                     # Test data fixtures, seed payloads, and mock data
├── test-assets/                  # Sample test assets (property images, PDFs, attachments)
├── utils/                        # Shared utility helpers (date calculations, formatters)
├── reports/                      # Generated test execution reports
│   └── cucumber/                 # Cucumber HTML and JSON output files
├── allure-results/               # Raw test result metadata generated by test runs
├── allure-report/                # Compiled static Allure HTML dashboard
├── screenshots/                  # Step screenshots captured during test runs
├── videos/                       # Video recordings captured during test runs
├── scripts/                      # Cleanup, setup, and maintenance scripts
├── cucumber.js                   # Cucumber.js runner configuration & reporter options
├── playwright.config.js          # Playwright test configuration
├── package.json                  # Dependencies, test scripts, and CLI shortcuts
├── .env.example                  # Template for required environment variables
└── README.md                     # Framework documentation & run guide
```

### Where to Add Project Components

| What You Want to Add | Target Directory | Notes / Convention |
| :--- | :--- | :--- |
| **New E2E Flow** | `features/e2e/` | Name file with two-digit prefix: `XX-<flow-name>.feature`. Tag with `@all-flows` and `@flow-<N>`. |
| **New Test Case / Scenario** | `features/` or `features/e2e/` | Add `Scenario:` blocks with clear, declarative Gherkin steps. |
| **New Page Object** | `pages/` | Create a class named `<PageName>Page.js` encapsulating selectors and page actions. |
| **New Step Definition** | `features/step-definitions/` | Create or update `<feature-name>.steps.js` using `Given`, `When`, `Then`. |
| **New Test Data & Mock Assets** | `fixtures/` or `test-assets/` | Place JSON fixtures, mock files, or sample images for uploads here. |
| **New Utility / Helper** | `utils/` | Add reusable helper functions (e.g. string formatting, dates, tokens). |
| **New Environment Variables** | `.env.example` & `.env` | Add the variable name to `.env.example` and your local `.env`. |
| **Generated Reports & Logs** | `reports/` & `allure-report/` | Automatically populated during test runs. Ignored by git. |

---

## ➕ 6. How to Add a New Flow

The framework is designed for seamless expansion. When adding a new flow (e.g. Flow 8):

### Step 1: Create the Feature File
Add a new file in `features/e2e/` using sequential two-digit naming:
```
features/e2e/08-new-feature-flow.feature
```

### Step 2: Tag and Title the Flow
Structure the feature file with the next sequential flow number:
```gherkin
@e2e @all-flows @flow-8
Feature: Flow 8 - New Feature Flow Title

  Scenario: Flow 8 - Scenario Description
    Given the agent is logged in for the new flow
    When the agent performs the first action
    Then the expected outcome is verified
```

### Step 3: Implement Page Objects and Steps
1. Add necessary locators and methods to `pages/<NewPage>Page.js`.
2. Add step definitions to `features/step-definitions/<new-feature>.steps.js`.

### Step 4: How Execution is Handled
* **Individual Run**: The new flow is immediately runnable via its tag without modifying any runner configuration:
  ```bash
  npx cucumber-js --tags "@flow-8"
  ```
  You can also optionally add a script shortcut in `package.json`:
  ```json
  "test:flow-8": "cucumber-js --tags \"@flow-8\""
  ```
* **Full Suite Run**: Because it includes `@all-flows`, running `npm run test:all-flows` automatically includes and executes Flow 8 in sequential numerical order.

### Step 5: How Reporting is Handled
* Because the Feature and Scenario are titled `Flow 8 - ...`, Allure automatically registers the suite as `Flow 8` and displays it in its proper sequential position under **Suites** and **Behaviors**.
* No changes to Allure configuration are needed.
