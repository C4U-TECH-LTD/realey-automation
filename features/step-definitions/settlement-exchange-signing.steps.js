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
    const page = this.page;

    const completeButton = page
      .getByRole("button", {
        name:
          /complete settlement|complete/i,
      })
      .last();

    if (await completeButton.isVisible({ timeout: 15_000 }).catch(() => false)) {
      await expect(completeButton).toBeEnabled({ timeout: 10_000 });
      await completeButton.click();
      await page.waitForTimeout(1000);
    }

    // Handle possible confirmation modal / dialog
    const dialog = page.getByRole("dialog").first();
    if (await dialog.isVisible({ timeout: 4000 }).catch(() => false)) {
      const confirm = dialog.getByRole("button", {
        name: /Confirm|Complete|Yes|Proceed/i,
      }).last();
      if (await confirm.isVisible().catch(() => false)) {
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

    await clickButton(
      page,
      /initiate exchange|start exchange/i
    );

    const confirm = page
      .getByRole("button", {
        name:
          /confirm|continue|yes|initiate/i,
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

    const assignButton = page
      .getByRole("button", {
        name:
          /assign.*buyer|assign for signing/i,
      })
      .first();

    await expect(
      assignButton
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .action,
    });

    await assignButton.click();

    const confirm = page
      .getByRole("button", {
        name:
          /assign|confirm/i,
      })
      .last();

    if (
      await confirm
        .isVisible()
        .catch(() => false)
    ) {
      await confirm.click();
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

    let documents = page
      .getByRole("link", { name: /documents/i })
      .or(page.getByRole("button", { name: /documents|sign/i }))
      .or(page.getByText(/settlement documents|sign documents|documents/i))
      .first();

    if (!(await documents.isVisible({ timeout: 3000 }).catch(() => false))) {
      const docsNav = page.getByRole("link", { name: /^documents$/i }).first();
      if (await docsNav.isVisible({ timeout: 2000 }).catch(() => false)) {
        await docsNav.click();
        await waitForPage(page);
      }
      documents = page
        .getByText(/settlement documents|sign documents|documents/i)
        .first();
    }

    await expect(
      documents
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .documentSigning,
    });

    await documents.click();
  }
);


When(
  "the General User signs all required settlement documents",
  async function () {
    const page = this.page;

    const signButtons = page
      .getByRole("button", {
        name:
          /sign document|sign/i,
      });

    const count =
      await signButtons.count();

    if (count === 0) {
      throw new Error(
        "No Buyer document signing buttons were found."
      );
    }

    for (
      let i = 0;
      i < count;
      i++
    ) {
      const button =
        signButtons.nth(i);

      const visible =
        await button
          .isVisible()
          .catch(() => false);

      if (!visible) {
        continue;
      }

      await button.click();

      const confirm = page
        .getByRole("button", {
          name:
            /confirm|agree|sign/i,
        })
        .last();

      if (
        await confirm
          .isVisible()
          .catch(() => false)
      ) {
        await confirm.click();
      }

      await page.waitForTimeout(
        500
      );
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

    const passButton = page
      .getByRole("button", {
        name:
          /pass.*seller solicitor|send.*seller solicitor/i,
      })
      .first();

    await expect(
      passButton
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .action,
    });

    await passButton.click();

    const confirm = page
      .getByRole("button", {
        name:
          /confirm|send|continue|yes/i,
      })
      .last();

    if (
      await confirm
        .isVisible()
        .catch(() => false)
    ) {
      await confirm.click();
    }
  }
);


Then(
  "the signed documents should be passed to the Seller Solicitor successfully",
  async function () {
    const page = this.page;

    await expect(
      page
        .getByText(
          settlementExchangeFlowData
            .expected
            .passedToSellerSolicitor
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
// AGENT ADD VENDOR
// =====================================================

When(
  "the Agent adds the configured Vendor",
  async function () {
    const page = this.page;

    let addVendorButton = page
      .getByRole("button", {
        name:
          /add vendor/i,
      })
      .first();

    if (!(await addVendorButton.isVisible({ timeout: 3000 }).catch(() => false))) {
      const viewDetailsBtn = page
        .locator('button, a, [role="button"]')
        .filter({ hasText: /view details/i })
        .first();
      if (await viewDetailsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await viewDetailsBtn.click();
        await page.waitForTimeout(1000);
      }
      const contactsTab = page
        .getByRole("tab", { name: /contacts/i })
        .or(page.getByText(/contacts/i))
        .first();
      if (await contactsTab.isVisible({ timeout: 2000 }).catch(() => false)) {
        await contactsTab.click();
      }
      addVendorButton = page
        .getByRole("button", {
          name: /add vendor/i,
        })
        .first();
    }

    await expect(
      addVendorButton
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .action,
    });

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

    await expect(
      saveButton
    ).toBeVisible();

    await saveButton.click();
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
      .first();

    await expect(
      vendor
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .action,
    });
  }
);


// =====================================================
// SELLER SOLICITOR -> VENDOR
// =====================================================

When(
  "the Seller Solicitor passes the settlement documents to the Vendor",
  async function () {
    const page = this.page;

    const passButton = page
      .getByRole("button", {
        name:
          /pass.*vendor|send.*vendor/i,
      })
      .first();

    await expect(
      passButton
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .action,
    });

    await passButton.click();

    const confirm = page
      .getByRole("button", {
        name:
          /confirm|send|continue|yes/i,
      })
      .last();

    if (
      await confirm
        .isVisible()
        .catch(() => false)
    ) {
      await confirm.click();
    }
  }
);


Then(
  "the settlement documents should be passed to the Vendor successfully",
  async function () {
    const page = this.page;

    await expect(
      page
        .getByText(
          settlementExchangeFlowData
            .expected
            .passedToVendor
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
// VENDOR DOCUMENT SIGNING
// =====================================================

When(
  "the Vendor opens the settlement documents",
  async function () {
    const page = this.page;

    let documents = page
      .getByRole("link", { name: /documents/i })
      .or(page.getByRole("button", { name: /documents|sign/i }))
      .or(page.getByText(/settlement documents|sign documents|documents/i))
      .first();

    if (!(await documents.isVisible({ timeout: 3000 }).catch(() => false))) {
      const docsNav = page.getByRole("link", { name: /^documents$/i }).first();
      if (await docsNav.isVisible({ timeout: 2000 }).catch(() => false)) {
        await docsNav.click();
        await waitForPage(page);
      }
      documents = page
        .getByText(/settlement documents|sign documents|documents/i)
        .first();
    }

    await expect(
      documents
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .documentSigning,
    });

    await documents.click();
  }
);


When(
  "the Vendor signs all required settlement documents",
  async function () {
    const page = this.page;

    const signButtons = page
      .getByRole("button", {
        name:
          /sign document|sign/i,
      });

    const count =
      await signButtons.count();

    if (count === 0) {
      throw new Error(
        "No Vendor document signing buttons were found."
      );
    }

    for (
      let i = 0;
      i < count;
      i++
    ) {
      const button =
        signButtons.nth(i);

      const visible =
        await button
          .isVisible()
          .catch(() => false);

      if (!visible) {
        continue;
      }

      await button.click();

      const confirm = page
        .getByRole("button", {
          name:
            /confirm|agree|sign/i,
        })
        .last();

      if (
        await confirm
          .isVisible()
          .catch(() => false)
      ) {
        await confirm.click();
      }

      await page.waitForTimeout(
        500
      );
    }
  }
);


Then(
  "the Vendor settlement documents should be signed successfully",
  async function () {
    const page = this.page;

    await expect(
      page
        .getByText(
          settlementExchangeFlowData
            .expected
            .vendorSigned
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
  "the Seller Solicitor should see the Vendor documents as signed",
  async function () {
    const page = this.page;

    await expect(
      page
        .getByText(
          settlementExchangeFlowData
            .expected
            .vendorSigned
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
// SETTLEMENT DATE - SELLER SOLICITOR
// =====================================================

When(
  "the Seller Solicitor proposes the configured settlement date",
  async function () {
    const page = this.page;

    const configuredDate =
      settlementExchangeFlowData
        .settlementDate
        .proposedDate;

    /*
     * Test data format:
     * DD/MM/YYYY
     *
     * HTML date input requires:
     * YYYY-MM-DD
     */
    const parts =
      configuredDate.split("/");

    const htmlDate =
      parts.length === 3
        ? `${parts[2]}-${parts[1]}-${parts[0]}`
        : configuredDate;

    // Check if date input is already rendered directly on the settlement card
    let dateInput = page
      .locator(
        'input[type="date"], input[placeholder*="yyyy" i], input[name*="settlement" i], input[placeholder*="date" i]'
      )
      .first();

    if (await dateInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dateInput.fill(htmlDate);

      const setDateBtn = page
        .getByRole("button", {
          name: /set date|propose|confirm|submit/i,
        })
        .first();

      await setDateBtn.click();
    } else {
      const proposeButton = page
        .getByRole("button", {
          name:
            /propose settlement date|settlement date|set date/i,
        })
        .first();

      await expect(
        proposeButton
      ).toBeVisible({
        timeout:
          settlementExchangeFlowData
            .timeouts
            .action,
      });

      await proposeButton.click();

      dateInput = page
        .locator(
          'input[type="date"], input[placeholder*="yyyy" i], input[name*="settlement" i], input[placeholder*="date" i]'
        )
        .first();

      await expect(
        dateInput
      ).toBeVisible({
        timeout: 5000,
      });

      await dateInput.fill(
        htmlDate
      );

      const submitButton = page
        .getByRole("button", {
          name:
            /propose|submit|confirm|set date/i,
        })
        .last();

      await expect(
        submitButton
      ).toBeVisible();

      await submitButton.click();
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

    const acceptButton = page
      .getByRole("button", {
        name:
          /accept.*settlement date|accept date|accept/i,
      })
      .first();

    await expect(
      acceptButton
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .action,
    });

    await acceptButton.click();

    const confirm = page
      .getByRole("button", {
        name:
          /confirm|yes|accept/i,
      })
      .last();

    if (
      await confirm
        .isVisible()
        .catch(() => false)
    ) {
      await confirm.click();
    }
  }
);


Then(
  "the settlement date should be accepted successfully",
  async function () {
    const page = this.page;

    await expect(
      page
        .getByText(
          settlementExchangeFlowData
            .expected
            .settlementDateAccepted
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
// SETTLEMENT DATE NOTIFICATION
// =====================================================

Then(
  "all relevant parties should receive the settlement date notification",
  async function () {
    const page = this.page;

    const notification = page
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

    await expect(
      notification
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .notification,
    });
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

    await expect(
      calendarLink
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .calendar,
    });

    await calendarLink.click();

    await waitForPage(page);

    const settlementEntry = page
      .getByText(
        /settlement/i
      )
      .first();

    await expect(
      settlementEntry
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .calendar,
    });
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

    expect(
      bodyText,
      `Expected calendar to contain settlement date ${expectedDate}`
    ).toContain(
      expectedDate
    );
  }
);