const {
  When,
  Then,
} = require("@cucumber/cucumber");

const { expect } = require("@playwright/test");

const {
  settlementExchangeFlowData,
} = require("../../fixtures/test-data/settlementExchangeFlowData");


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


async function logoutIfNeeded(page) {
  const profileButton = page
    .getByRole("button", {
      name: /profile|account|user|menu/i,
    })
    .first();

  const profileVisible =
    await profileButton
      .isVisible()
      .catch(() => false);

  if (!profileVisible) {
    return;
  }

  await profileButton.click();

  const logoutButton = page
    .getByText(
      /logout|log out|sign out/i
    )
    .first();

  const logoutVisible =
    await logoutButton
      .isVisible()
      .catch(() => false);

  if (logoutVisible) {
    await logoutButton.click();

    await page.waitForLoadState(
      "domcontentloaded"
    );
  }
}


async function login(page, user) {
  if (
    !user ||
    !user.email ||
    !user.password
  ) {
    throw new Error(
      "Login credentials are missing for the requested role."
    );
  }

  await page.goto(
    process.env.BASE_URL ||
      "https://uat.realey.au/"
  );

  await waitForPage(page);

  const emailInput = page
    .locator(
      'input[type="email"], input[name="email"], input[placeholder*="email" i]'
    )
    .first();

  const passwordInput = page
    .locator(
      'input[type="password"], input[name="password"]'
    )
    .first();

  await expect(emailInput).toBeVisible({
    timeout:
      settlementExchangeFlowData
        .timeouts
        .navigation,
  });

  await emailInput.fill(
    user.email
  );

  await passwordInput.fill(
    user.password
  );

  const loginButton = page
    .getByRole("button", {
      name: /login|log in|sign in/i,
    })
    .first();

  await expect(loginButton).toBeVisible();

  await loginButton.click();

  await page.waitForLoadState(
    "domcontentloaded"
  );

  /*
   * OTP support
   *
   * If the role has an OTP configured and
   * an OTP input is visible, fill it.
   */
  if (user.otp) {
    const otpInput = page
      .locator(
        'input[name="otp"], input[placeholder*="otp" i], input[autocomplete="one-time-code"]'
      )
      .first();

    const otpVisible =
      await otpInput
        .isVisible()
        .catch(() => false);

    if (otpVisible) {
      await otpInput.fill(
        user.otp
      );

      const verifyButton = page
        .getByRole("button", {
          name: /verify|continue|submit/i,
        })
        .first();

      if (
        await verifyButton
          .isVisible()
          .catch(() => false)
      ) {
        await verifyButton.click();

        await page.waitForLoadState(
          "domcontentloaded"
        );
      }
    }
  }
}


async function switchRole(
  page,
  user
) {
  await logoutIfNeeded(page);

  await login(
    page,
    user
  );
}


async function openCreatedSettlement(
  world
) {
  const page = world.page;

  const settlements = page
    .getByText(
      /settlements?/i
    )
    .first();

  const settlementsVisible =
    await settlements
      .isVisible()
      .catch(() => false);

  if (settlementsVisible) {
    await settlements.click();

    await waitForPage(page);
  }

  const listingTitle =
    world.createdListingTitle ||
    settlementExchangeFlowData
      .agent
      .listing
      .expectedPropertyName;

  const listing = page
    .getByText(
      listingTitle,
      {
        exact: false,
      }
    )
    .first();

  const listingVisible =
    await listing
      .isVisible()
      .catch(() => false);

  if (listingVisible) {
    await listing.click();

    await waitForPage(page);

    return;
  }

  /*
   * Fallback if exact property title is
   * not shown on Settlement page.
   */
  const searchText =
    settlementExchangeFlowData
      .generalUser
      .searchText;

  const searchListing = page
    .getByText(
      searchText,
      {
        exact: false,
      }
    )
    .first();

  const searchVisible =
    await searchListing
      .isVisible()
      .catch(() => false);

  if (searchVisible) {
    await searchListing.click();

    await waitForPage(page);

    return;
  }

  /*
   * Last fallback:
   * open the first settlement row.
   */
  const firstSettlement = page
    .locator(
      'table tbody tr, [data-testid*="settlement"]'
    )
    .first();

  await expect(
    firstSettlement
  ).toBeVisible({
    timeout:
      settlementExchangeFlowData
        .timeouts
        .navigation,
  });

  await firstSettlement.click();

  await waitForPage(page);
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

    await expect(
      completeButton
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .action,
    });

    await completeButton.click();

    await page.waitForLoadState(
      "domcontentloaded"
    );
  }
);


Then(
  "the settlement process is completed successfully",
  async function () {
    const page = this.page;

    const success = page
      .getByText(
        settlementExchangeFlowData
          .expected
          .settlementCompleted
      )
      .first();

    await expect(
      success
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .action,
    });
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
    const page = this.page;

    const listingTitle =
      this.createdListingTitle ||
      settlementExchangeFlowData
        .agent
        .listing
        .expectedPropertyName;

    const listing = page
      .getByText(
        listingTitle,
        {
          exact: false,
        }
      )
      .first();

    if (
      await listing
        .isVisible()
        .catch(() => false)
    ) {
      await listing.click();

      await waitForPage(page);

      return;
    }

    const searchText =
      settlementExchangeFlowData
        .generalUser
        .searchText;

    const searchListing = page
      .getByText(
        searchText,
        {
          exact: false,
        }
      )
      .first();

    if (
      await searchListing
        .isVisible()
        .catch(() => false)
    ) {
      await searchListing.click();

      await waitForPage(page);

      return;
    }

    const firstSettlement = page
      .locator(
        'table tbody tr, [data-testid*="settlement"]'
      )
      .first();

    await expect(
      firstSettlement
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .navigation,
    });

    await firstSettlement.click();

    await waitForPage(page);
  }
);


When(
  "the Agent marks the settlement as Ready for Exchange",
  async function () {
    const page = this.page;

    const readyButton = page
      .getByRole("button", {
        name:
          /ready for exchange/i,
      })
      .first();

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
      this.page,
      settlementExchangeFlowData
        .sellerSolicitor
    );
  }
);


When(
  "I switch from Seller Solicitor to Buyer Solicitor",
  async function () {
    await switchRole(
      this.page,
      settlementExchangeFlowData
        .buyerSolicitor
    );
  }
);


When(
  "I switch from Buyer Solicitor to General User",
  async function () {
    await switchRole(
      this.page,
      settlementExchangeFlowData
        .generalUser
    );
  }
);


When(
  "I switch from General User to Buyer Solicitor",
  async function () {
    await switchRole(
      this.page,
      settlementExchangeFlowData
        .buyerSolicitor
    );
  }
);


When(
  "I switch from Buyer Solicitor to Agent",
  async function () {
    await switchRole(
      this.page,
      settlementExchangeFlowData
        .agent
    );
  }
);


When(
  "I switch from Seller Solicitor to Vendor",
  async function () {
    await switchRole(
      this.page,
      settlementExchangeFlowData
        .vendor
    );
  }
);


When(
  "I switch from Vendor to Seller Solicitor",
  async function () {
    await switchRole(
      this.page,
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
          /confirm|continue|yes/i,
      })
      .first();

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

    const documents = page
      .getByText(
        /settlement documents|sign documents|documents/i
      )
      .first();

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

    const addVendorButton = page
      .getByRole("button", {
        name:
          /add vendor/i,
      })
      .first();

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

    const documents = page
      .getByText(
        /settlement documents|sign documents|documents/i
      )
      .first();

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

    const proposeButton = page
      .getByRole("button", {
        name:
          /propose settlement date|settlement date/i,
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

    const dateInput = page
      .locator(
        'input[type="date"], input[name*="settlement" i], input[placeholder*="date" i]'
      )
      .first();

    await expect(
      dateInput
    ).toBeVisible();

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

    await dateInput.fill(
      htmlDate
    );

    const submitButton = page
      .getByRole("button", {
        name:
          /propose|submit|confirm/i,
      })
      .last();

    await expect(
      submitButton
    ).toBeVisible();

    await submitButton.click();

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
      .getByText(
        settlementExchangeFlowData
          .expected
          .calendar
      )
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