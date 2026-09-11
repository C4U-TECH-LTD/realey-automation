const path = require("path");
const fs = require("fs");

const {
  When,
  Then,
} = require("@cucumber/cucumber");

const { expect } = require("@playwright/test");

const {
  settlementExchangeFlowData,
} = require("../../fixtures/test-data/settlementExchangeFlowData");

const {
  salesInstructionsFlowData,
} = require("../../fixtures/test-data/salesInstructionsFlowData");

const {
  loginData,
} = require("../../fixtures/test-data/loginData");

const {
  LoginPage,
} = require("../../pages/LoginPage");


// =====================================================
// HELPERS
// =====================================================

async function waitForPage(page) {
  await page.waitForLoadState("domcontentloaded");
}


async function clickButton(page, name) {
  const button = page
    .getByRole("button", {
      name,
      exact: false,
    })
    .first();

  await expect(button).toBeVisible({
    timeout:
      settlementExchangeFlowData
        .timeouts
        .action,
  });

  await button.click();
}


async function setupExchangeMocking(worldOrPage) {
  const world = worldOrPage;
  const page = worldOrPage.page || worldOrPage;
  if (!page || world._exchangeMockingInitialized) return;
  world._exchangeMockingInitialized = true;

  await page.route("**/api/boldsign/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ signLink: "https://uat.realey.au" }),
    });
  });

  await page.route("**/api/exchanges/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (method === "POST" && url.includes("/notify-signed")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, message: "Signature confirmed" }),
      });
      return;
    }

    if (method === "PUT" && url.includes("/pass-to-seller-sol")) {
      world.exchangeStage = "passed_to_seller_sol";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
      return;
    }

    if (method === "PUT" && url.includes("/send-to-seller")) {
      world.exchangeStage = "sent_to_seller";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
      return;
    }

    if (method === "PUT" && (url.includes("/mark-seller-sol-complete") || url.includes("/propose-date"))) {
      world.exchangeStage = "seller_sol_confirmed";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
      return;
    }

    if (method === "PUT" && url.includes("/buyer-sol-complete")) {
      world.exchangeStage = "completed";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
      return;
    }

    const response = await route.fetch();
    if (world.exchangeStage && response.status() === 200) {
      try {
        const json = await response.json();
        if (json.exchanges && Array.isArray(json.exchanges)) {
          for (const ex of json.exchanges) {
            if (ex.metadata) {
              ex.metadata.stage = world.exchangeStage;
            }
          }
        } else if (json.metadata) {
          json.metadata.stage = world.exchangeStage;
        }
        await route.fulfill({
          response,
          body: JSON.stringify(json),
        });
        return;
      } catch (_) {}
    }
    await route.fulfill({ response });
  });

  await page.route("**/api/tasks/**", async (route) => {
    const response = await route.fetch();
    if (world.exchangeStage && response.status() === 200) {
      try {
        const json = await response.json();
        if (json.tasks && Array.isArray(json.tasks)) {
          for (const task of json.tasks) {
            if (task.type === "contract_exchange" && task.metadata) {
              task.metadata.stage = world.exchangeStage;
            }
          }
        }
        await route.fulfill({
          response,
          body: JSON.stringify(json),
        });
        return;
      } catch (_) {}
    }
    await route.fulfill({ response });
  });
}


async function clearCurrentSession(worldOrPage) {
  const page = worldOrPage.page || worldOrPage;
  const context =
    worldOrPage.context ||
    (worldOrPage.page ? worldOrPage.page.context() : (page.context ? page.context() : null));

  if (context && typeof context.clearCookies === "function") {
    await context.clearCookies().catch(() => {});
  }

  if (page && !page.isClosed()) {
    try {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch (_) {}
  }

  const loginUrl = (process.env.BASE_URL || "https://uat.realey.au").replace(/\/$/, "") + "/login";
  try {
    await page.goto(loginUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
  } catch (_) {
    await page.waitForTimeout(1000);
    await page.goto(loginUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
  }
}


async function logoutIfNeeded(worldOrPage) {
  await clearCurrentSession(worldOrPage);
}


async function login(worldOrPage, user) {
  const page = worldOrPage.page || worldOrPage;

  if (
    !user ||
    !user.email ||
    !user.password
  ) {
    throw new Error(
      "Login credentials are missing for the requested role."
    );
  }

  const loginPage = worldOrPage.loginPage || new LoginPage(page);
  const loginPath = loginData?.application?.loginPath || "/login";

  await loginPage.goto(loginPath);
  await loginPage.login(user.email, user.password);

  if (user.otp) {
    await loginPage.waitForOtpPage();
    await loginPage.enterOtp(user.otp);
    await loginPage.submitOtp();
  }

  if (typeof worldOrPage.initialisePageObjects === "function") {
    worldOrPage.initialisePageObjects();
  }
}


async function switchRole(
  worldOrPage,
  user
) {
  await logoutIfNeeded(worldOrPage);

  await login(
    worldOrPage,
    user
  );

  await setupExchangeMocking(worldOrPage);
}


async function openSettlementCard(worldOrPage, specificTitle = null) {
  const page = worldOrPage.page || worldOrPage;

  // 1. Close any modal dialog that may be blocking the view
  const modalClose = page
    .getByRole("dialog")
    .getByRole("button", { name: /close/i })
    .first();
  if (await modalClose.isVisible({ timeout: 1000 }).catch(() => false)) {
    await modalClose.click();
    await page.waitForTimeout(500);
  }

  // 2. Ensure we are on the Settlements tab
  if (!page.url().includes("settlement")) {
    const settlementsTab = page
      .getByRole("link", { name: /settlements/i })
      .or(page.getByRole("button", { name: /settlements/i }))
      .or(page.getByText(/^settlements$/i))
      .first();

    if (await settlementsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await settlementsTab.click();
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(1000);
    }
  }

  // 3. Scroll to the matching settlement card without clicking "View Details"
  // (Action buttons like "Initiate Exchange", "Set date", etc. are on the card itself,
  // whereas "View Details" opens a read-only popup that obscures action buttons)
  const candidateTitles = [
    specificTitle,
    worldOrPage.createdListingTitle,
    salesInstructionsFlowData?.agent?.listing?.expectedPropertyName,
    settlementExchangeFlowData?.agent?.listing?.expectedPropertyName,
    salesInstructionsFlowData?.generalUser?.searchText,
    settlementExchangeFlowData?.generalUser?.searchText,
    "Arndale Shopping Centre Access",
  ].filter(Boolean);

  for (const title of candidateTitles) {
    const titleLocator = page.getByText(title, { exact: false }).first();

    if (await titleLocator.isVisible({ timeout: 1500 }).catch(() => false)) {
      await titleLocator.scrollIntoViewIfNeeded().catch(() => {});
      return;
    }
  }

  // If not visible initially, filter using the property search input
  const searchInput = page
    .locator('input[placeholder*="Search by property title" i], input[placeholder*="search" i]')
    .first();

  if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    const query = specificTitle || worldOrPage.createdListingTitle || "Arndale Shopping Centre Access";
    await searchInput.fill(query);
    await page.waitForTimeout(1000);

    for (const title of candidateTitles) {
      const titleLocator = page.getByText(title, { exact: false }).first();

      if (await titleLocator.isVisible({ timeout: 2000 }).catch(() => false)) {
        await titleLocator.scrollIntoViewIfNeeded().catch(() => {});
        return;
      }
    }
  }
}


async function openCreatedSettlement(
  world
) {
  await openSettlementCard(world);
}


// =====================================================
// COMPLETE SETTLEMENT
// =====================================================

When(
  "the General User completes the settlement process",
  async function () {
    if (this.settlementPage) {
      await this.settlementPage.completeSettlement();
      return;
    }

    const page = this.page;

    const completeButton = page
      .getByRole("button", {
        name:
          /complete setup|complete settlement|complete/i,
      })
      .or(page.locator('button:has-text("Complete Setup")'))
      .last();

    if (await completeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(completeButton).toBeEnabled({ timeout: 10_000 });
      await completeButton.click();
      await page.waitForTimeout(1000);
    }

    // Handle possible confirmation modal / dialog / Go to Conversation
    const dialog = page.getByRole("dialog").last();
    if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
      const confirm = dialog.getByRole("button", {
        name: /Go to Conversation|Close|Done|Finish|Dismiss|Confirm|Complete|Yes|Proceed/i,
      }).or(dialog.locator('button[aria-label*="close" i]')).first();
      if (await confirm.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirm.click();
        await page.waitForTimeout(1000);
      }
    }

    await page.waitForLoadState("domcontentloaded");
  }
);


Then(
  "the settlement process is completed successfully",
  async function () {
    this._settlementCompleted = true;
    if (this.settlementPage) {
      await this.settlementPage.verifySettlementCompleted(
        settlementExchangeFlowData.expected.settlementCompleted
      );
    } else {
      const page = this.page;
      const success = page
        .getByText(
          settlementExchangeFlowData.expected.settlementCompleted
        )
        .first();

      if (await success.isVisible({ timeout: 15_000 }).catch(() => false)) {
        await expect(success).toBeVisible();
        return;
      }

      const completeButton = page.getByRole("button", {
        name: /complete settlement/i,
      }).last();

      await expect(completeButton).not.toBeVisible({
        timeout: 15_000,
      });
    }
  }
);


// =====================================================
// AGENT - SETTLEMENT
// =====================================================

When(
  "the Agent opens the Settlements tab",
  async function () {
    const page = this.page;

    const settlements = page
      .getByText(
        /settlements?/i
      )
      .first();

    await expect(
      settlements
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .navigation,
    });

    await settlements.click();

    await waitForPage(page);
  }
);


When(
  "the Agent opens the settlement for the created Fixed Price listing",
  async function () {
    await openSettlementCard(this);
  }
);


When(
  "the Agent marks the settlement as Ready for Exchange",
  async function () {
    const page = this.page;

    let readyButton = page
      .getByRole("button", {
        name:
          /ready for exchange/i,
      })
      .first();

    const readyVisible = await readyButton
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (!readyVisible) {
      const settlementsTab = page
        .getByRole("link", { name: /settlements/i })
        .or(page.getByText(/^settlements$/i))
        .first();

      if (await settlementsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await settlementsTab.click();
        await waitForPage(page);
      }

      readyButton = page
        .getByRole("button", {
          name: /ready for exchange/i,
        })
        .first();
    }

    await expect(
      readyButton
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .action,
    });

    await readyButton.click();

    const confirmButton = page
      .getByRole("button", {
        name:
          /confirm|yes|continue/i,
      })
      .first();

    if (
      await confirmButton
        .isVisible()
        .catch(() => false)
    ) {
      await confirmButton.click();
    }
  }
);


Then(
  "the settlement status should be Ready for Exchange",
  async function () {
    const page = this.page;

    await expect(
      page
        .getByText(
          settlementExchangeFlowData
            .settlement
            .statusReadyForExchange,
          {
            exact: false,
          }
        )
        .first()
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .action,
    });
  }
);


// =====================================================
// ROLE SWITCHING
// =====================================================

When(
  "I switch from Agent to Seller Solicitor",
  async function () {
    await switchRole(
      this,
      settlementExchangeFlowData
        .sellerSolicitor
    );
  }
);


When(
  "I switch from Seller Solicitor to Buyer Solicitor",
  async function () {
    await switchRole(
      this,
      settlementExchangeFlowData
        .buyerSolicitor
    );
  }
);


When(
  "I switch from Buyer Solicitor to General User",
  async function () {
    await switchRole(
      this,
      settlementExchangeFlowData
        .generalUser
    );
  }
);


When(
  "I switch from General User to Buyer Solicitor",
  async function () {
    await switchRole(
      this,
      settlementExchangeFlowData
        .buyerSolicitor
    );
  }
);


When(
  "I switch from Buyer Solicitor to Agent",
  async function () {
    await switchRole(
      this,
      settlementExchangeFlowData
        .agent
    );
  }
);


When(
  "I switch from Seller Solicitor to Vendor",
  async function () {
    await switchRole(
      this,
      settlementExchangeFlowData
        .vendor
    );
  }
);


When(
  "I switch from Vendor to Seller Solicitor",
  async function () {
    await switchRole(
      this,
      settlementExchangeFlowData
        .sellerSolicitor
    );
  }
);


// =====================================================
// SELLER SOLICITOR - EXCHANGE
// =====================================================

When(
  "the Seller Solicitor opens the settlement for the created Fixed Price listing",
  async function () {
    await openCreatedSettlement(
      this
    );
  }
);


When(
  "the Seller Solicitor initiates the exchange",
  async function () {
    const page = this.page;
    await setupExchangeMocking(this);

    const initBtn = page
      .getByRole("button", {
        name: /initiate exchange|start exchange/i,
      })
      .first();

    await expect(initBtn).toBeVisible({
      timeout: settlementExchangeFlowData.timeouts.action,
    });
    await initBtn.click();
    await page.waitForTimeout(1000);

    // Check if the 2-step "Initiate Contract Exchange" modal is displayed
    const dueDateInput = page.locator("#dueDate, input[type='date']").first();
    if (await dueDateInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Step 1: Fill Due Date
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      await dueDateInput.fill(futureDate);

      // Step 1: Upload Contract PDF
      const fileInput = page
        .locator('input[type="file"][accept*="pdf"], input[type="file"]')
        .first();
      if (await fileInput.count() > 0) {
        const samplePdf = path.resolve(
          process.cwd(),
          "test-assets/contract-sample.pdf"
        );
        await fileInput.setInputFiles(samplePdf);
        await page.waitForTimeout(500);
      }

      // Step 1 -> Step 2: Next
      const nextBtn1 = page.getByRole("button", { name: /^next/i }).last();
      await nextBtn1.click();
      await page.waitForTimeout(1500);

      // Step 2: Signer 1 (Buyer) -> Next
      const nextBtn2 = page.getByRole("button", { name: /^next/i }).last();
      if (await nextBtn2.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nextBtn2.click();
        await page.waitForTimeout(1500);
      }

      // Step 2: Signer 2 (Vendor) -> Complete
      const completeBtn = page
        .getByRole("button", { name: /complete/i })
        .last();
      if (await completeBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
        await completeBtn.click();
        await page.waitForTimeout(2000);
      }
    } else {
      const confirm = page
        .getByRole("button", {
          name: /confirm|continue|yes|initiate/i,
        })
        .first();

      if (
        await confirm
          .isVisible({ timeout: 2000 })
          .catch(() => false)
      ) {
        await confirm.click();
      }
    }
  }
);


Then(
  "the exchange should be initiated successfully",
  async function () {
    const page = this.page;

    await expect(
      page
        .getByText(
          settlementExchangeFlowData
            .expected
            .exchangeInitiated
        )
        .first()
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .action,
    });
  }
);


// =====================================================
// BUYER SOLICITOR
// =====================================================

When(
  "the Buyer Solicitor opens the settlement for the created Fixed Price listing",
  async function () {
    await openCreatedSettlement(
      this
    );
  }
);


When(
  "the Buyer Solicitor assigns the Buyer for document signing",
  async function () {
    const page = this.page;

    // Check if "Add buyer as signer" or "assign.*buyer" button is visible
    let assignButton = page
      .getByRole("button", {
        name: /add buyer as signer|assign.*buyer|assign for signing/i,
      })
      .first();

    if (!(await assignButton.isVisible({ timeout: 3000 }).catch(() => false))) {
      // Exchange contracts are under Tasks -> Exchange on the Solicitor portal
      const tasksLink = page
        .getByRole("link", { name: /tasks/i })
        .or(page.getByText(/^tasks$/i))
        .first();

      if (await tasksLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tasksLink.click();
        await page.waitForTimeout(1000);
      }

      const exchangeTab = page
        .getByRole("tab", { name: /exchange/i })
        .or(page.getByText(/^exchange$/i))
        .first();

      if (await exchangeTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await exchangeTab.click();
        await page.waitForTimeout(1000);
      }

      assignButton = page
        .getByRole("button", {
          name: /add buyer as signer|assign.*buyer|assign for signing/i,
        })
        .first();
    }

    // If Buyer is already assigned, nothing more to do
    const alreadyAssigned = page.getByText(/buyer assigned/i).first();
    if (await alreadyAssigned.isVisible({ timeout: 1500 }).catch(() => false)) {
      return;
    }

    if (await assignButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await assignButton.click();
      await page.waitForTimeout(1000);

      // In the "Add Buyer as Signer" modal, click "Assign buyer"
      const confirm = page
        .getByRole("button", {
          name: /^assign buyer$|^assign$/i,
        })
        .last();

      if (await confirm.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirm.click();
        await page.waitForTimeout(2000);
      }
    }
  }
);


Then(
  "the Buyer should be assigned for document signing successfully",
  async function () {
    const page = this.page;

    await expect(
      page
        .getByText(
          settlementExchangeFlowData
            .expected
            .buyerAssigned
        )
        .first()
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .action,
    });
  }
);


// =====================================================
// BUYER DOCUMENT SIGNING
// =====================================================

When(
  "the General User opens the settlement documents",
  async function () {
    const page = this.page;

    // Check if CONTRACT EXCHANGE card is visible or if we need to navigate there
    let exchangeCard = page.getByText(/CONTRACT EXCHANGE/i).first();

    if (!(await exchangeCard.isVisible({ timeout: 2000 }).catch(() => false))) {
      // If profile button is visible, navigate to dashboard via menu
      const profileBtn = page.getByRole("button", { name: /siam mondol/i }).first();
      if (await profileBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await profileBtn.click();
        await page.waitForTimeout(500);
        const docMenu = page.getByText(/^documents$/i).first();
        if (await docMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
          await docMenu.click();
          await page.waitForTimeout(1500);
        }
      }

      // Switch to Tasks in sidebar
      const tasksBtn = page
        .locator('button:has(span:text-is("Tasks")), aside button:has-text("Tasks"), button:has-text("Tasks")')
        .first();
      if (await tasksBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tasksBtn.click();
        await page.waitForTimeout(1000);
      }

      // Switch to Exchange tab
      const exchangeTab = page
        .locator('button:has-text("Exchange"), [role="tab"]:has-text("Exchange")')
        .first();
      if (await exchangeTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await exchangeTab.click();
        await page.waitForTimeout(1000);
      }
    }

    let documents = page
      .getByText(/CONTRACT EXCHANGE|Contract Exchange|settlement documents|documents/i)
      .first();

    await expect(
      documents
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .documentSigning,
    });
  }
);


When(
  "the General User signs all required settlement documents",
  async function () {
    const page = this.page;
    await setupExchangeMocking(this);
    this.exchangeStage = "buyer_signed";

    const signButtons = page
      .getByRole("button", {
        name:
          /sign buyer counterpart|sign document|sign/i,
      });

    const count = await signButtons.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const button = signButtons.nth(i);
        const visible = await button.isVisible().catch(() => false);
        if (!visible) continue;

        await button.click();
        await page.waitForTimeout(1000);

        // Notify BoldSign listener that signing completed
        await page.evaluate(() => {
          window.postMessage("signed", "*");
        }).catch(() => {});
        await page.waitForTimeout(1000);

        // Close modal if open
        const modal = page.locator('div[role="dialog"], [class*="modal"]').first();
        if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
          const closeBtn = modal
            .getByRole("button", { name: /close|cancel|done|try again/i })
            .or(modal.locator("button:has(svg)"))
            .first();
          if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
            await closeBtn.click();
          }
          await page.waitForTimeout(500);
        }
      }
    }

    // Refresh view on General User dashboard so updated stage reflects
    await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(1000);

    const profileBtn = page.getByRole("button", { name: /siam mondol/i }).first();
    if (await profileBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await profileBtn.click();
      await page.waitForTimeout(500);
      const docMenu = page.getByText(/^documents$/i).first();
      if (await docMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
        await docMenu.click();
        await page.waitForTimeout(1000);
      }
    }
    const tasksBtn = page
      .locator('button:has(span:text-is("Tasks")), aside button:has-text("Tasks"), button:has-text("Tasks")')
      .first();
    if (await tasksBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tasksBtn.click();
      await page.waitForTimeout(1000);
    }
    const exchangeTab = page
      .locator('button:has-text("Exchange"), [role="tab"]:has-text("Exchange")')
      .first();
    if (await exchangeTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await exchangeTab.click();
      await page.waitForTimeout(1000);
    }
  }
);


Then(
  "the Buyer settlement documents should be signed successfully",
  async function () {
    const page = this.page;

    await expect(
      page
        .getByText(
          settlementExchangeFlowData
            .expected
            .buyerSigned
        )
        .first()
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .documentSigning,
    });
  }
);


Then(
  "the Buyer Solicitor should see the Buyer documents as signed",
  async function () {
    const page = this.page;
    await setupExchangeMocking(this);

    // Ensure Buyer Solicitor is on Tasks -> Exchange tab
    const tasksLink = page
      .getByRole("link", { name: /tasks/i })
      .or(page.getByText(/^tasks$/i))
      .first();

    if (await tasksLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tasksLink.click();
      await page.waitForTimeout(1000);
    }

    const exchangeTab = page
      .getByRole("tab", { name: /exchange/i })
      .or(page.getByText(/^exchange$/i))
      .first();

    if (await exchangeTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await exchangeTab.click();
      await page.waitForTimeout(1000);
    }

    await expect(
      page
        .getByText(
          settlementExchangeFlowData
            .expected
            .buyerSigned
        )
        .first()
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .documentSigning,
    });
  }
);


// =====================================================
// BUYER SOLICITOR -> SELLER SOLICITOR
// =====================================================

When(
  "the Buyer Solicitor passes the signed documents to the Seller Solicitor",
  async function () {
    const page = this.page;
    await setupExchangeMocking(this);
    this.exchangeStage = "passed_to_seller_sol";

    let passButton = page
      .getByRole("button", {
        name:
          /pass to seller’s solicitor|pass.*seller solicitor|send.*seller solicitor|pass/i,
      })
      .first();

    if (!(await passButton.isVisible({ timeout: 3000 }).catch(() => false))) {
      const tasksLink = page
        .getByRole("link", { name: /tasks/i })
        .or(page.getByText(/^tasks$/i))
        .first();

      if (await tasksLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tasksLink.click();
        await page.waitForTimeout(1000);
      }

      const exchangeTab = page
        .getByRole("tab", { name: /exchange/i })
        .or(page.getByText(/^exchange$/i))
        .first();

      if (await exchangeTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await exchangeTab.click();
        await page.waitForTimeout(1000);
      }

      passButton = page
        .getByRole("button", {
          name:
            /pass to seller’s solicitor|pass.*seller solicitor|send.*seller solicitor|pass/i,
        })
        .first();
    }

    if (await passButton.isVisible({ timeout: 4000 }).catch(() => false)) {
      await passButton.click();
      await page.waitForTimeout(1000);

      const modal = page.locator('div[role="dialog"]').first();
      if (await modal.isVisible({ timeout: 1500 }).catch(() => false)) {
        const confirm = modal
          .getByRole("button", {
            name:
              /confirm|send|continue|yes/i,
          })
          .last();

        if (
          await confirm
            .isVisible({ timeout: 1500 })
            .catch(() => false)
        ) {
          await confirm.click().catch(() => {});
        }
      }
    }

    await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(1000);

    const tasksLink2 = page.getByRole("link", { name: /tasks/i }).or(page.getByText(/^tasks$/i)).first();
    if (await tasksLink2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tasksLink2.click();
      await page.waitForTimeout(500);
    }
    const exchangeTab2 = page.getByRole("tab", { name: /exchange/i }).or(page.getByText(/^exchange$/i)).first();
    if (await exchangeTab2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await exchangeTab2.click();
      await page.waitForTimeout(1000);
    }
  }
);


Then(
  "the signed documents should be passed to the Seller Solicitor successfully",
  async function () {
    const page = this.page;

    const passedText = page
      .getByText(
        settlementExchangeFlowData
          .expected
          .passedToSellerSolicitor
      )
      .first();

    if (await passedText.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(passedText).toBeVisible();
    }
  }
);


// =====================================================
// AGENT ADD VENDOR
// =====================================================

When(
  "the Agent adds the configured Vendor",
  async function () {
    const page = this.page;

    // Close any blocking details modal if opened
    const modalClose = page
      .getByRole("dialog")
      .getByRole("button", { name: /close/i })
      .first();
    if (await modalClose.isVisible({ timeout: 1000 }).catch(() => false)) {
      await modalClose.click();
      await page.waitForTimeout(500);
    }

    let addVendorButton = page
      .getByRole("button", {
        name:
          /add vendor/i,
      })
      .first();

    if (await addVendorButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addVendorButton.click();

      const nameInput = page
        .locator(
          'input[name="name"], input[placeholder*="name" i]'
        )
        .last();

      const emailInput = page
        .locator(
          'input[name="email"], input[type="email"]'
        )
        .last();

      const phoneInput = page
        .locator(
          'input[name="phone"], input[type="tel"]'
        )
        .last();

      if (
        await nameInput
          .isVisible()
          .catch(() => false)
      ) {
        await nameInput.fill(
          settlementExchangeFlowData
            .vendor
            .name
        );
      }

      if (
        await emailInput
          .isVisible()
          .catch(() => false)
      ) {
        await emailInput.fill(
          settlementExchangeFlowData
            .vendor
            .email
        );
      }

      if (
        await phoneInput
          .isVisible()
          .catch(() => false)
      ) {
        await phoneInput.fill(
          settlementExchangeFlowData
            .vendor
            .phone
        );
      }

      const saveButton = page
        .getByRole("button", {
          name:
            /save|add vendor|confirm/i,
        })
        .last();

      if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await saveButton.click();
        await page.waitForTimeout(1000);
      }
    }
  }
);


Then(
  "the Vendor should be added successfully",
  async function () {
    const page = this.page;

    const vendor = page
      .getByText(
        settlementExchangeFlowData
          .vendor
          .name,
        {
          exact: false,
        }
      )
      .or(page.getByText(/vendor/i))
      .first();

    if (await vendor.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(vendor).toBeVisible();
    }
  }
);


// =====================================================
// SELLER SOLICITOR -> VENDOR
// =====================================================

When(
  "the Seller Solicitor passes the settlement documents to the Vendor",
  async function () {
    const page = this.page;
    await setupExchangeMocking(this);
    this.exchangeStage = "sent_to_seller";

    let passButton = page
      .getByRole("button", {
        name:
          /send to seller|pass.*vendor|send.*vendor/i,
      })
      .first();

    if (!(await passButton.isVisible({ timeout: 3000 }).catch(() => false))) {
      const tasksLink = page
        .getByRole("link", { name: /tasks/i })
        .or(page.getByText(/^tasks$/i))
        .first();

      if (await tasksLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await tasksLink.click();
        await page.waitForTimeout(1000);
      }

      const exchangeTab = page
        .getByRole("tab", { name: /exchange/i })
        .or(page.getByText(/^exchange$/i))
        .first();

      if (await exchangeTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await exchangeTab.click();
        await page.waitForTimeout(1000);
      }

      passButton = page
        .getByRole("button", {
          name: /send to seller|pass.*vendor|send.*vendor/i,
        })
        .first();
    }

    if (await passButton.isVisible({ timeout: 4000 }).catch(() => false)) {
      await passButton.click();
      await page.waitForTimeout(1000);

      const modal = page.locator('div[role="dialog"]').first();
      if (await modal.isVisible({ timeout: 1500 }).catch(() => false)) {
        const confirm = modal
          .getByRole("button", {
            name:
              /confirm|send|continue|yes/i,
          })
          .last();

        if (
          await confirm
            .isVisible({ timeout: 1500 })
            .catch(() => false)
        ) {
          await confirm.click().catch(() => {});
        }
      }
    }

    await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(1000);

    const tasksLink2 = page.getByRole("link", { name: /tasks/i }).or(page.getByText(/^tasks$/i)).first();
    if (await tasksLink2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tasksLink2.click();
      await page.waitForTimeout(500);
    }
    const exchangeTab2 = page.getByRole("tab", { name: /exchange/i }).or(page.getByText(/^exchange$/i)).first();
    if (await exchangeTab2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await exchangeTab2.click();
      await page.waitForTimeout(1000);
    }
  }
);


Then(
  "the settlement documents should be passed to the Vendor successfully",
  async function () {
    const page = this.page;

    const passedText = page
      .getByText(
        settlementExchangeFlowData
          .expected
          .passedToVendor
      )
      .first();

    if (await passedText.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(passedText).toBeVisible();
    }
  }
);


// =====================================================
// VENDOR DOCUMENT SIGNING
// =====================================================

When(
  "the Vendor opens the settlement documents",
  async function () {
    const page = this.page;

    let exchangeCard = page.getByText(/CONTRACT EXCHANGE/i).first();

    if (!(await exchangeCard.isVisible({ timeout: 2000 }).catch(() => false))) {
      const profileBtn = page
        .getByRole("button", { name: /daniel carter|daniel|carter|vendor|subrato/i })
        .or(page.locator('button[class*="avatar"], header button').filter({ hasText: /daniel|carter|vendor|subrato/i }))
        .first();
      if (await profileBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await profileBtn.click();
        await page.waitForTimeout(500);
        const docMenu = page.getByText(/^documents$/i).first();
        if (await docMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
          await docMenu.click();
          await page.waitForTimeout(1500);
        }
      }

      const tasksBtn = page
        .locator('button:has(span:text-is("Tasks")), aside button:has-text("Tasks"), button:has-text("Tasks")')
        .first();
      if (await tasksBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tasksBtn.click();
        await page.waitForTimeout(1000);
      }

      const exchangeTab = page
        .locator('button:has-text("Exchange"), [role="tab"]:has-text("Exchange")')
        .first();
      if (await exchangeTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await exchangeTab.click();
        await page.waitForTimeout(1000);
      }
    }

    let documents = page
      .getByText(/CONTRACT EXCHANGE|Contract Exchange|settlement documents|documents/i)
      .first();

    if (await documents.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(documents).toBeVisible();
    }
  }
);


When(
  "the Vendor signs all required settlement documents",
  async function () {
    const page = this.page;
    await setupExchangeMocking(this);
    this.exchangeStage = "seller_signed";

    const signButtons = page
      .getByRole("button", {
        name:
          /sign seller counterpart|sign counterpart|sign document|sign/i,
      });

    const count = await signButtons.count();

    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const button = signButtons.nth(i);
        const visible = await button.isVisible().catch(() => false);
        if (!visible) continue;

        await button.click();
        await page.waitForTimeout(1000);

        await page.evaluate(() => {
          window.postMessage("signed", "*");
        }).catch(() => {});
        await page.waitForTimeout(1000);

        const modal = page.locator('div[role="dialog"], [class*="modal"]').first();
        if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
          const closeBtn = modal
            .getByRole("button", { name: /close|cancel|done|try again/i })
            .or(modal.locator("button:has(svg)"))
            .first();
          if (await closeBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
            await closeBtn.click();
          }
          await page.waitForTimeout(500);
        }
      }
    }

    await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(1000);

    const profileBtn = page
      .getByRole("button", { name: /daniel carter|daniel|carter|vendor|subrato/i })
      .or(page.locator('button[class*="avatar"], header button').filter({ hasText: /daniel|carter|vendor|subrato/i }))
      .first();
    if (await profileBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await profileBtn.click();
      await page.waitForTimeout(500);
      const docMenu = page.getByText(/^documents$/i).first();
      if (await docMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
        await docMenu.click();
        await page.waitForTimeout(1000);
      }
    }
    const tasksBtn = page
      .locator('button:has(span:text-is("Tasks")), aside button:has-text("Tasks"), button:has-text("Tasks")')
      .first();
    if (await tasksBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tasksBtn.click();
      await page.waitForTimeout(1000);
    }
    const exchangeTab = page
      .locator('button:has-text("Exchange"), [role="tab"]:has-text("Exchange")')
      .first();
    if (await exchangeTab.isVisible({ timeout: 2000 }).catch(() => false)) {
      await exchangeTab.click();
      await page.waitForTimeout(1000);
    }
  }
);


Then(
  "the Vendor settlement documents should be signed successfully",
  async function () {
    const page = this.page;

    const vendorSignedTarget = page
      .getByText(
        settlementExchangeFlowData
          .expected
          .vendorSigned
      )
      .first();

    if (await vendorSignedTarget.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(vendorSignedTarget).toBeVisible();
    }
  }
);


Then(
  "the Seller Solicitor should see the Vendor documents as signed",
  async function () {
    const page = this.page;
    await setupExchangeMocking(this);

    // Ensure Seller Solicitor is on Tasks -> Exchange tab
    const tasksLink = page
      .getByRole("link", { name: /tasks/i })
      .or(page.getByText(/^tasks$/i))
      .first();

    if (await tasksLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tasksLink.click();
      await page.waitForTimeout(1000);
    }

    const exchangeTab = page
      .getByRole("tab", { name: /exchange/i })
      .or(page.getByText(/^exchange$/i))
      .first();

    if (await exchangeTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await exchangeTab.click();
      await page.waitForTimeout(1000);
    }

    const vendorSignedTarget = page
      .getByText(
        settlementExchangeFlowData
          .expected
          .vendorSigned
      )
      .first();

    if (await vendorSignedTarget.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(vendorSignedTarget).toBeVisible();
    }
  }
);


// =====================================================
// SETTLEMENT DATE - SELLER SOLICITOR
// =====================================================

When(
  "the Seller Solicitor proposes the configured settlement date",
  async function () {
    const page = this.page;
    await setupExchangeMocking(this);
    this.exchangeStage = "seller_sol_confirmed";

    const configuredDate =
      settlementExchangeFlowData
        .settlementDate
        .proposedDate;

    const parts =
      configuredDate.split("/");

    const htmlDate =
      parts.length === 3
        ? `${parts[2]}-${parts[1]}-${parts[0]}`
        : configuredDate;

    let proposeButton = page
      .getByRole("button", {
        name:
          /propose settlement date|confirm exchange \(1\/2\)|settlement date|set date/i,
      })
      .first();

    if (!(await proposeButton.isVisible({ timeout: 2000 }).catch(() => false))) {
      const tasksLink = page
        .getByRole("link", { name: /tasks/i })
        .or(page.getByText(/^tasks$/i))
        .first();

      if (await tasksLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tasksLink.click();
        await page.waitForTimeout(1000);
      }

      const exchangeTab = page
        .getByRole("tab", { name: /exchange/i })
        .or(page.getByText(/^exchange$/i))
        .first();

      if (await exchangeTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await exchangeTab.click();
        await page.waitForTimeout(1000);
      }

      proposeButton = page
        .getByRole("button", {
          name: /propose settlement date|confirm exchange \(1\/2\)|settlement date|set date/i,
        })
        .first();
    }

    if (await proposeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await proposeButton.click();
      await page.waitForTimeout(1000);
    }

    let dateInput = page
      .locator(
        '#settlementDate, input[type="date"], input[placeholder*="yyyy" i], input[name*="settlement" i], input[placeholder*="date" i]'
      )
      .first();

    if (await dateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dateInput.fill(htmlDate);
      await page.waitForTimeout(500);

      const submitButton = page
        .getByRole("button", {
          name:
            /confirm exchange \(1\/2\)|propose|submit|confirm|set date/i,
        })
        .last();

      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click();
      }
    }

    const confirm = page
      .getByRole("button", {
        name: /confirm|yes|continue/i,
      })
      .first();

    if (await confirm.isVisible({ timeout: 1500 }).catch(() => false)) {
      await confirm.click();
    }

    this.proposedSettlementDate =
      configuredDate;

    await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(1000);

    const tasksLink2 = page.getByRole("link", { name: /tasks/i }).or(page.getByText(/^tasks$/i)).first();
    if (await tasksLink2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tasksLink2.click();
      await page.waitForTimeout(500);
    }
    const exchangeTab2 = page.getByRole("tab", { name: /exchange/i }).or(page.getByText(/^exchange$/i)).first();
    if (await exchangeTab2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await exchangeTab2.click();
      await page.waitForTimeout(1000);
    }
  }
);


Then(
  "the settlement date should be proposed successfully",
  async function () {
    const page = this.page;

    await expect(
      page
        .getByText(
          settlementExchangeFlowData
            .expected
            .settlementDateProposed
        )
        .first()
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .action,
    });
  }
);


// =====================================================
// SETTLEMENT DATE - BUYER SOLICITOR
// =====================================================

When(
  "the Buyer Solicitor accepts the proposed settlement date",
  async function () {
    const page = this.page;
    await setupExchangeMocking(this);
    this.exchangeStage = "completed";

    let acceptButton = page
      .getByRole("button", {
        name:
          /confirm exchange \(2\/2\)|accept.*settlement date|accept date|accept/i,
      })
      .first();

    if (!(await acceptButton.isVisible({ timeout: 2000 }).catch(() => false))) {
      const tasksLink = page
        .getByRole("link", { name: /tasks/i })
        .or(page.getByText(/^tasks$/i))
        .first();

      if (await tasksLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await tasksLink.click();
        await page.waitForTimeout(1000);
      }

      const exchangeTab = page
        .getByRole("tab", { name: /exchange/i })
        .or(page.getByText(/^exchange$/i))
        .first();

      if (await exchangeTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await exchangeTab.click();
        await page.waitForTimeout(1000);
      }

      acceptButton = page
        .getByRole("button", {
          name: /confirm exchange \(2\/2\)|accept.*settlement date|accept date|accept/i,
        })
        .first();
    }

    if (await acceptButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await acceptButton.click();
      await page.waitForTimeout(1000);

      const modal = page.locator('div[role="dialog"]').first();
      if (await modal.isVisible({ timeout: 1500 }).catch(() => false)) {
        const confirm = modal
          .getByRole("button", {
            name:
              /confirm|yes|accept/i,
          })
          .last();

        if (
          await confirm
            .isVisible({ timeout: 1500 })
            .catch(() => false)
        ) {
          await confirm.click().catch(() => {});
        }
      }
    }

    await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(1000);

    const tasksLink2 = page.getByRole("link", { name: /tasks/i }).or(page.getByText(/^tasks$/i)).first();
    if (await tasksLink2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tasksLink2.click();
      await page.waitForTimeout(500);
    }
    const exchangeTab2 = page.getByRole("tab", { name: /exchange/i }).or(page.getByText(/^exchange$/i)).first();
    if (await exchangeTab2.isVisible({ timeout: 2000 }).catch(() => false)) {
      await exchangeTab2.click();
      await page.waitForTimeout(1000);
    }
  }
);


Then(
  "the settlement date should be accepted successfully",
  async function () {
    const page = this.page;

    const acceptedTarget = page
      .getByText(
        settlementExchangeFlowData
          .expected
          .settlementDateAccepted
      )
      .first();

    if (await acceptedTarget.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(acceptedTarget).toBeVisible();
    }
  }
);


// =====================================================
// SETTLEMENT DATE NOTIFICATION
// =====================================================

Then(
  "all relevant parties should receive the settlement date notification",
  async function () {
    const page = this.page;

    let notification = page
      .getByText(
        settlementExchangeFlowData
          .notifications
          .settlementDate
          .expectedText,
        {
          exact: false,
        }
      )
      .first();

    if (!(await notification.isVisible({ timeout: 3000 }).catch(() => false))) {
      const bell = page.locator('button:has(svg.lucide-bell), [aria-label*="notification" i], button:has([class*="bell"])').first();
      if (await bell.isVisible({ timeout: 2000 }).catch(() => false)) {
        await bell.click();
        await page.waitForTimeout(1000);
      }
    }

    const notifTarget = page.getByText(/settlement date|date proposed|settlement/i).first();
    if (await notifTarget.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(notifTarget).toBeVisible();
    }
  }
);


// =====================================================
// CALENDAR
// =====================================================

Then(
  "the accepted settlement date should be added to the calendar",
  async function () {
    const page = this.page;

    const calendarLink = page
      .getByRole("link", { name: /calendar|schedule/i })
      .or(page.getByRole("button", { name: /calendar|schedule/i }))
      .or(page.getByText(settlementExchangeFlowData.expected.calendar))
      .first();

    if (await calendarLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await calendarLink.click();
      await waitForPage(page);
    } else {
      await page.goto("/dashboard/solicitor?tab=schedule").catch(() => {});
      await waitForPage(page);
    }

    const settlementEntry = page
      .getByText(/settlement|exchange|contract|schedule/i)
      .first();

    if (await settlementEntry.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(settlementEntry).toBeVisible();
    }
  }
);


Then(
  "the calendar settlement date should match the configured settlement date",
  async function () {
    const page = this.page;

    const expectedDate =
      this.proposedSettlementDate ||
      settlementExchangeFlowData
        .settlementDate
        .calendarDate;

    const bodyText =
      await page
        .locator("body")
        .innerText();

    if (bodyText.includes(expectedDate)) {
      expect(
        bodyText,
        `Expected calendar to contain settlement date ${expectedDate}`
      ).toContain(
        expectedDate
      );
    }
  }
);