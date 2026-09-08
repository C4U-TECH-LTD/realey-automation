const {
  When,
  Then,
} = require("@cucumber/cucumber");

const { expect } = require("@playwright/test");

const {
  salesInstructionsFlowData,
} = require("../../fixtures/test-data/salesInstructionsFlowData");


// =====================================================
// TEST DATA HELPERS
// =====================================================

const expectedRecipients = Object.values(
  salesInstructionsFlowData.recipients
);

const excludedRecipients = Object.values(
  salesInstructionsFlowData.excludedRecipients
);

const deliveryChannels = Object.values(
  salesInstructionsFlowData.channels
);


// =====================================================
// HELPERS
// =====================================================

async function getSalesInstructionsButton(page) {
  return page
    .getByRole("button", {
      name: /sales instructions/i,
    })
    .first();
}


async function countSalesInstructionItems(
  page,
  recipient,
  channel
) {
  const channelSelectors = {
    chatroom: [
      '[data-testid="chat-message"]',
      '[data-testid*="chat-message"]',
      ".chat-message",
    ],

    email: [
      '[data-testid="email-item"]',
      '[data-testid*="email"]',
      ".email-item",
    ],

    "in-app": [
      '[data-testid="notification-item"]',
      '[data-testid*="notification"]',
      ".notification-item",
    ],
  };

  const selectors =
    channelSelectors[channel] || [];

  for (const selector of selectors) {
    const locator = page.locator(selector);

    if ((await locator.count()) > 0) {
      const matchingItems = locator
        .filter({
          hasText:
            salesInstructionsFlowData
              .expectedContent
              .title,
        })
        .filter({
          hasText: new RegExp(
            recipient,
            "i"
          ),
        });

      return await matchingItems.count();
    }
  }

  /*
   * Fallback:
   * If your application does not have specific
   * data-testid selectors yet.
   */
  return await page
    .getByText(
      salesInstructionsFlowData
        .expectedContent
        .title
    )
    .count();
}


async function verifyReceived(
  world,
  recipient,
  channel
) {
  const page = world.page;

  const before =
    world.salesInstructionCounts
      .before[recipient][channel];

  const after =
    await countSalesInstructionItems(
      page,
      recipient,
      channel
    );

  expect(
    after,
    `${recipient} should receive exactly one new ${channel} Sales Instructions delivery`
  ).toBe(before + 1);

  if (
    !world.salesInstructionCounts
      .afterFirstSend[recipient]
  ) {
    world.salesInstructionCounts
      .afterFirstSend[recipient] = {};
  }

  world.salesInstructionCounts
    .afterFirstSend[recipient][channel] =
    after;
}


async function verifyNotReceived(
  world,
  recipient,
  channel
) {
  const page = world.page;

  const before =
    world.salesInstructionCounts
      .before[recipient][channel];

  const after =
    await countSalesInstructionItems(
      page,
      recipient,
      channel
    );

  expect(
    after,
    `${recipient} must not receive ${channel} Sales Instructions`
  ).toBe(before);

  if (
    !world.salesInstructionCounts
      .afterFirstSend[recipient]
  ) {
    world.salesInstructionCounts
      .afterFirstSend[recipient] = {};
  }

  world.salesInstructionCounts
    .afterFirstSend[recipient][channel] =
    after;
}


// =====================================================
// NEGATIVE PATH
// =====================================================

Then(
  "the Sales Instructions action should not be available before settlement completion",
  async function () {
    const page = this.page;

    const button =
      await getSalesInstructionsButton(
        page
      );

    const visible =
      await button
        .isVisible()
        .catch(() => false);

    if (visible) {
      await expect(
        button
      ).toBeDisabled();
    } else {
      expect(visible).toBe(false);
    }
  }
);


// =====================================================
// AVAILABLE AFTER SETTLEMENT
// =====================================================

Then(
  "the Sales Instructions action should be available",
  async function () {
    const page = this.page;

    const button =
      await getSalesInstructionsButton(
        page
      );

    await expect(
      button
    ).toBeVisible({
      timeout:
        salesInstructionsFlowData
          .timeout
          .action,
    });

    await expect(
      button
    ).toBeEnabled();
  }
);


// =====================================================
// CAPTURE INITIAL COUNTS
// =====================================================

When(
  "I capture the current Sales Instructions delivery counts",
  async function () {
    const page = this.page;

    this.salesInstructionCounts = {
      before: {},
      afterFirstSend: {},
      afterSecondSend: {},
    };

    const recipients = [
      ...expectedRecipients,
      ...excludedRecipients,
    ];

    for (
      const recipient of recipients
    ) {
      this.salesInstructionCounts
        .before[recipient] = {};

      for (
        const channel of deliveryChannels
      ) {
        this.salesInstructionCounts
          .before[recipient][channel] =
          await countSalesInstructionItems(
            page,
            recipient,
            channel
          );
      }
    }
  }
);


// =====================================================
// FIRST CLICK
// =====================================================

When(
  "the Agent clicks Sales Instructions",
  async function () {
    const page = this.page;

    const button =
      await getSalesInstructionsButton(
        page
      );

    await expect(
      button
    ).toBeVisible({
      timeout:
        salesInstructionsFlowData
          .timeout
          .action,
    });

    await expect(
      button
    ).toBeEnabled();

    await button.click();

    await page.waitForTimeout(
      1500
    );
  }
);


Then(
  "the Sales Instructions should be generated successfully",
  async function () {
    const page = this.page;

    const documentText =
      page
        .getByText(
          salesInstructionsFlowData
            .expected
            .documentGenerated
        )
        .first();

    await expect(
      documentText
    ).toBeVisible({
      timeout:
        salesInstructionsFlowData
          .timeout
          .action,
    });
  }
);


// =====================================================
// DOCUMENT FIELD VALIDATION
// =====================================================

Then(
  "the Sales Instructions document should contain the configured Firm",
  async function () {
    const body =
      await this.page
        .locator("body")
        .innerText();

    expect(
      body
    ).toContain(
      salesInstructionsFlowData
        .document
        .firm
    );
  }
);


Then(
  "the Sales Instructions document should contain the Agent Licence No",
  async function () {
    const body =
      await this.page
        .locator("body")
        .innerText();

    expect(
      body
    ).toContain(
      salesInstructionsFlowData
        .document
        .agentLicenceNo
    );
  }
);


Then(
  "the Sales Instructions document should contain the Agency Licence No",
  async function () {
    const body =
      await this.page
        .locator("body")
        .innerText();

    expect(
      body
    ).toContain(
      salesInstructionsFlowData
        .document
        .agencyLicenceNo
    );
  }
);


Then(
  "the Sales Instructions Firm field should not be blank",
  async function () {
    const page = this.page;

    const firmLabel =
      page
        .getByText(
          salesInstructionsFlowData
            .expected
            .firmLabel
        )
        .first();

    await expect(
      firmLabel
    ).toBeVisible();

    const body =
      await page
        .locator("body")
        .innerText();

    const firm =
      salesInstructionsFlowData
        .document
        .firm;

    expect(
      firm
    ).toBeTruthy();

    expect(
      firm.trim().length
    ).toBeGreaterThan(0);

    expect(
      body
    ).toContain(firm);
  }
);


Then(
  "the Sales Instructions Agent Licence No field should not be blank",
  async function () {
    const page = this.page;

    const label =
      page
        .getByText(
          salesInstructionsFlowData
            .expected
            .agentLicenceLabel
        )
        .first();

    await expect(
      label
    ).toBeVisible();

    const value =
      salesInstructionsFlowData
        .document
        .agentLicenceNo;

    expect(
      value
    ).toBeTruthy();

    expect(
      value.trim().length
    ).toBeGreaterThan(0);

    const body =
      await page
        .locator("body")
        .innerText();

    expect(
      body
    ).toContain(value);
  }
);


Then(
  "the Sales Instructions Agency Licence No field should not be blank",
  async function () {
    const page = this.page;

    const label =
      page
        .getByText(
          salesInstructionsFlowData
            .expected
            .agencyLicenceLabel
        )
        .first();

    await expect(
      label
    ).toBeVisible();

    const value =
      salesInstructionsFlowData
        .document
        .agencyLicenceNo;

    expect(
      value
    ).toBeTruthy();

    expect(
      value.trim().length
    ).toBeGreaterThan(0);

    const body =
      await page
        .locator("body")
        .innerText();

    expect(
      body
    ).toContain(value);
  }
);


// =====================================================
// BROKER
// =====================================================

Then(
  "the Broker should receive one Sales Instructions chatroom message",
  async function () {
    await verifyReceived(
      this,
      salesInstructionsFlowData
        .recipients
        .broker,
      salesInstructionsFlowData
        .channels
        .chatroom
    );
  }
);


Then(
  "the Broker should receive one Sales Instructions email",
  async function () {
    await verifyReceived(
      this,
      salesInstructionsFlowData
        .recipients
        .broker,
      salesInstructionsFlowData
        .channels
        .email
    );
  }
);


Then(
  "the Broker should receive one Sales Instructions in-app notification",
  async function () {
    await verifyReceived(
      this,
      salesInstructionsFlowData
        .recipients
        .broker,
      salesInstructionsFlowData
        .channels
        .inApp
    );
  }
);


// =====================================================
// SELLER SOLICITOR
// =====================================================

Then(
  "the Seller Solicitor should receive one Sales Instructions chatroom message",
  async function () {
    await verifyReceived(
      this,
      salesInstructionsFlowData
        .recipients
        .sellerSolicitor,
      salesInstructionsFlowData
        .channels
        .chatroom
    );
  }
);


Then(
  "the Seller Solicitor should receive one Sales Instructions email",
  async function () {
    await verifyReceived(
      this,
      salesInstructionsFlowData
        .recipients
        .sellerSolicitor,
      salesInstructionsFlowData
        .channels
        .email
    );
  }
);


Then(
  "the Seller Solicitor should receive one Sales Instructions in-app notification",
  async function () {
    await verifyReceived(
      this,
      salesInstructionsFlowData
        .recipients
        .sellerSolicitor,
      salesInstructionsFlowData
        .channels
        .inApp
    );
  }
);


// =====================================================
// BUYER SOLICITOR
// =====================================================

Then(
  "the Buyer Solicitor should receive one Sales Instructions chatroom message",
  async function () {
    await verifyReceived(
      this,
      salesInstructionsFlowData
        .recipients
        .buyerSolicitor,
      salesInstructionsFlowData
        .channels
        .chatroom
    );
  }
);


Then(
  "the Buyer Solicitor should receive one Sales Instructions email",
  async function () {
    await verifyReceived(
      this,
      salesInstructionsFlowData
        .recipients
        .buyerSolicitor,
      salesInstructionsFlowData
        .channels
        .email
    );
  }
);


Then(
  "the Buyer Solicitor should receive one Sales Instructions in-app notification",
  async function () {
    await verifyReceived(
      this,
      salesInstructionsFlowData
        .recipients
        .buyerSolicitor,
      salesInstructionsFlowData
        .channels
        .inApp
    );
  }
);


// =====================================================
// BUYER MUST NOT RECEIVE
// =====================================================

Then(
  "the Buyer should not receive a Sales Instructions chatroom message",
  async function () {
    await verifyNotReceived(
      this,
      salesInstructionsFlowData
        .excludedRecipients
        .buyer,
      salesInstructionsFlowData
        .channels
        .chatroom
    );
  }
);


Then(
  "the Buyer should not receive a Sales Instructions email",
  async function () {
    await verifyNotReceived(
      this,
      salesInstructionsFlowData
        .excludedRecipients
        .buyer,
      salesInstructionsFlowData
        .channels
        .email
    );
  }
);


Then(
  "the Buyer should not receive a Sales Instructions in-app notification",
  async function () {
    await verifyNotReceived(
      this,
      salesInstructionsFlowData
        .excludedRecipients
        .buyer,
      salesInstructionsFlowData
        .channels
        .inApp
    );
  }
);


// =====================================================
// VENDOR MUST NOT RECEIVE
// =====================================================

Then(
  "the Vendor should not receive a Sales Instructions chatroom message",
  async function () {
    await verifyNotReceived(
      this,
      salesInstructionsFlowData
        .excludedRecipients
        .vendor,
      salesInstructionsFlowData
        .channels
        .chatroom
    );
  }
);


Then(
  "the Vendor should not receive a Sales Instructions email",
  async function () {
    await verifyNotReceived(
      this,
      salesInstructionsFlowData
        .excludedRecipients
        .vendor,
      salesInstructionsFlowData
        .channels
        .email
    );
  }
);


Then(
  "the Vendor should not receive a Sales Instructions in-app notification",
  async function () {
    await verifyNotReceived(
      this,
      salesInstructionsFlowData
        .excludedRecipients
        .vendor,
      salesInstructionsFlowData
        .channels
        .inApp
    );
  }
);


// =====================================================
// EXACTLY ONE DELIVERY
// =====================================================

Then(
  "each intended recipient should have exactly one new Sales Instructions delivery per channel",
  async function () {
    for (
      const recipient of expectedRecipients
    ) {
      for (
        const channel of deliveryChannels
      ) {
        const before =
          this.salesInstructionCounts
            .before[recipient][channel];

        const after =
          this.salesInstructionCounts
            .afterFirstSend[recipient][channel];

        expect(
          after,
          `${recipient} ${channel} delivery count is incorrect`
        ).toBe(
          before +
            salesInstructionsFlowData
              .deliveryCount
              .afterFirstSend
        );
      }
    }
  }
);


// =====================================================
// SECOND CLICK / IDEMPOTENCY
// =====================================================

When(
  "the Agent clicks Sales Instructions again",
  async function () {
    const page = this.page;

    this.salesInstructionsErrorBefore =
      await page
        .getByText(
          salesInstructionsFlowData
            .expected
            .errorMessage
        )
        .count();

    const button =
      await getSalesInstructionsButton(
        page
      );

    const visible =
      await button
        .isVisible()
        .catch(() => false);

    const enabled =
      visible
        ? await button
            .isEnabled()
            .catch(() => false)
        : false;

    /*
     * Requirement:
     * Second click silently does nothing.
     *
     * If button remains enabled, click it.
     * If app disables/hides it after first send,
     * that also prevents resend.
     */
    if (
      visible &&
      enabled
    ) {
      await button.click();

      await page.waitForTimeout(
        1500
      );
    }

    for (
      const recipient of expectedRecipients
    ) {
      this.salesInstructionCounts
        .afterSecondSend[recipient] = {};

      for (
        const channel of deliveryChannels
      ) {
        this.salesInstructionCounts
          .afterSecondSend
          [recipient]
          [channel] =
          await countSalesInstructionItems(
            page,
            recipient,
            channel
          );
      }
    }
  }
);


// =====================================================
// NO ADDITIONAL CHATROOM MESSAGE
// =====================================================

Then(
  "no additional Sales Instructions chatroom message should be sent",
  async function () {
    const channel =
      salesInstructionsFlowData
        .channels
        .chatroom;

    for (
      const recipient of expectedRecipients
    ) {
      const first =
        this.salesInstructionCounts
          .afterFirstSend
          [recipient]
          [channel];

      const second =
        this.salesInstructionCounts
          .afterSecondSend
          [recipient]
          [channel];

      expect(
        second,
        `${recipient} received another Sales Instructions chatroom message`
      ).toBe(first);
    }
  }
);


// =====================================================
// NO ADDITIONAL EMAIL
// =====================================================

Then(
  "no additional Sales Instructions email should be sent",
  async function () {
    const channel =
      salesInstructionsFlowData
        .channels
        .email;

    for (
      const recipient of expectedRecipients
    ) {
      const first =
        this.salesInstructionCounts
          .afterFirstSend
          [recipient]
          [channel];

      const second =
        this.salesInstructionCounts
          .afterSecondSend
          [recipient]
          [channel];

      expect(
        second,
        `${recipient} received another Sales Instructions email`
      ).toBe(first);
    }
  }
);


// =====================================================
// NO ADDITIONAL IN-APP NOTIFICATION
// =====================================================

Then(
  "no additional Sales Instructions in-app notification should be sent",
  async function () {
    const channel =
      salesInstructionsFlowData
        .channels
        .inApp;

    for (
      const recipient of expectedRecipients
    ) {
      const first =
        this.salesInstructionCounts
          .afterFirstSend
          [recipient]
          [channel];

      const second =
        this.salesInstructionCounts
          .afterSecondSend
          [recipient]
          [channel];

      expect(
        second,
        `${recipient} received another Sales Instructions in-app notification`
      ).toBe(first);
    }
  }
);


// =====================================================
// DELIVERY COUNTS REMAIN UNCHANGED
// =====================================================

Then(
  "the Sales Instructions delivery counts should remain unchanged",
  async function () {
    for (
      const recipient of expectedRecipients
    ) {
      for (
        const channel of deliveryChannels
      ) {
        const first =
          this.salesInstructionCounts
            .afterFirstSend
            [recipient]
            [channel];

        const second =
          this.salesInstructionCounts
            .afterSecondSend
            [recipient]
            [channel];

        expect(
          second,
          `${recipient} ${channel} was resent after second Sales Instructions click`
        ).toBe(first);
      }
    }
  }
);


// =====================================================
// NO ERROR AFTER SECOND CLICK
// =====================================================

Then(
  "no Sales Instructions error message should be displayed",
  async function () {
    const page = this.page;

    const errorCountAfter =
      await page
        .getByText(
          salesInstructionsFlowData
            .expected
            .errorMessage
        )
        .count();

    expect(
      errorCountAfter
    ).toBe(
      this.salesInstructionsErrorBefore
    );
  }
);