const { expect } = require("@playwright/test");

class PricingSalePage {
  /**
   * @param {import("@playwright/test").Page} page
   */
  constructor(page) {
    this.page = page;

    // =====================================================
    // COMMON
    // =====================================================
    this.sectionHeading = page.getByText(
      "Pricing & Sale Method",
      {
        exact: true,
      }
    );

    this.listingTypeLabel = page.getByText(
      "Listing Type",
      {
        exact: false,
      }
    );

    // First combobox in Pricing step = Listing Type
    this.listingTypeDropdown = page
      .getByRole("combobox")
      .first();

    // Fixed Price / Offers = Price Guide
    // Auction = Reserve Price
    this.priceGuideInput = page.getByPlaceholder(
      "e.g., 950,000",
      {
        exact: true,
      }
    );

    // =====================================================
    // AUCTION ONLY
    // =====================================================

    this.depositPercentInput = page
      .getByText("Deposit %", {
        exact: false,
      })
      .locator("xpath=following::input[1]");

    this.auctionStartDateInput =
      page.getByPlaceholder(
        "Select Start Date",
        {
          exact: true,
        }
      );

    this.auctionStartTimeInput =
      page.getByPlaceholder(
        "Select Start Time",
        {
          exact: true,
        }
      );

    this.auctionEndDateInput =
      page.getByPlaceholder(
        "Select End Date",
        {
          exact: true,
        }
      );

    this.auctionEndTimeInput =
      page.getByPlaceholder(
        "Select End Time",
        {
          exact: true,
        }
      );

    // Correct Starting Price placeholder
    this.startingPriceInput =
      page.getByPlaceholder(
        "e.g., 500,000",
        {
          exact: true,
        }
      );

    this.minimumBidIncrementInput =
      page.getByPlaceholder(
        "e.g., 5,000",
        {
          exact: true,
        }
      );

    // =====================================================
    // NEXT
    // =====================================================
    this.nextButton = page.getByRole("button", {
      name: "Next",
      exact: true,
    });
  }

  // =====================================================
  // WAIT FOR PRICING PAGE
  // =====================================================
  async waitForPage() {
    await expect(
      this.sectionHeading,
      "Pricing & Sale Method section should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.listingTypeDropdown,
      "Listing Type dropdown should be visible"
    ).toBeVisible();

    await expect(
      this.priceGuideInput,
      "Price Guide / Reserve Price input should be visible"
    ).toBeVisible();
  }

  // =====================================================
  // LISTING TYPE
  // =====================================================
  async selectListingType(listingType) {
    if (!listingType) {
      throw new Error(
        "Listing type is required."
      );
    }

    await this.listingTypeDropdown.click();

    const roleOption =
      this.page.getByRole("option", {
        name: listingType,
        exact: true,
      });

    if (
      await roleOption
        .isVisible()
        .catch(() => false)
    ) {
      await roleOption.click();
    } else {
      const visibleTextOption = this.page
        .locator('[role="listbox"]')
        .getByText(listingType, {
          exact: true,
        });

      if (
        await visibleTextOption
          .isVisible()
          .catch(() => false)
      ) {
        await visibleTextOption.click();
      } else {
        await this.page
          .locator(
            "[data-radix-popper-content-wrapper]"
          )
          .getByText(listingType, {
            exact: true,
          })
          .click();
      }
    }

    await expect(
      this.listingTypeDropdown
    ).toContainText(listingType);

    console.log(
      `Listing Type selected: ${listingType}`
    );
  }

  // =====================================================
  // GENERIC MONEY INPUT
  // =====================================================
  async fillMoneyInput(
    locator,
    value,
    fieldName
  ) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      throw new Error(
        `${fieldName} is required.`
      );
    }

    await expect(
      locator,
      `${fieldName} input should be visible`
    ).toBeVisible({
      timeout: 20_000,
    });

    await locator.click();

    await locator.fill("");

    await locator.fill(
      String(value)
    );

    const currentValue =
      await locator.inputValue();

    const actualDigits =
      currentValue.replace(/\D/g, "");

    const expectedDigits =
      String(value).replace(/\D/g, "");

    if (
      actualDigits !== expectedDigits
    ) {
      throw new Error(
        `${fieldName} was not entered correctly. ` +
          `Expected ${expectedDigits}, ` +
          `current value: ${currentValue}`
      );
    }

    console.log(
      `${fieldName} entered: ${currentValue}`
    );
  }

  // =====================================================
  // FIXED PRICE / OFFER PRICE
  // =====================================================
  async enterPriceGuide(priceGuide) {
    await this.fillMoneyInput(
      this.priceGuideInput,
      priceGuide,
      "Price Guide"
    );
  }

  // =====================================================
  // AUCTION RESERVE PRICE
  // =====================================================
  async enterReservePrice(
    reservePrice
  ) {
    await this.fillMoneyInput(
      this.priceGuideInput,
      reservePrice,
      "Reserve Price"
    );
  }

  // =====================================================
  // DEPOSIT %
  // =====================================================
  async enterDepositPercent(
    depositPercent
  ) {
    if (
      depositPercent === undefined ||
      depositPercent === null ||
      depositPercent === ""
    ) {
      return;
    }

    await expect(
      this.depositPercentInput,
      "Deposit % input should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await this.depositPercentInput.fill(
      String(depositPercent)
    );

    await expect(
      this.depositPercentInput
    ).toHaveValue(
      String(depositPercent)
    );

    console.log(
      `Deposit % entered: ${depositPercent}`
    );
  }

  // =====================================================
  // CURRENT LOCAL AUCTION SLOT
  //
  // Example:
  // Current = 09:35 PM
  // Start   = 09:30 PM
  // End     = 09:45 PM
  //
  // Current = 01:20 AM
  // Start   = 01:15 AM
  // End     = 01:30 AM
  //
  // NO Australia/Sydney timezone conversion.
  // Uses the current test machine local time.
  // =====================================================
  getDynamicAuctionSlot({
    slotMinutes = 15,
    durationMinutes = 15,
  } = {}) {
    const now = new Date();

    // -------------------------------------------------
    // START
    // -------------------------------------------------
    const start = new Date(now);

    start.setSeconds(0);
    start.setMilliseconds(0);

    const roundedMinute =
      Math.floor(
        start.getMinutes() /
          slotMinutes
      ) * slotMinutes;

    start.setMinutes(
      roundedMinute
    );

    // -------------------------------------------------
    // END
    // -------------------------------------------------
    const end = new Date(
      start.getTime() +
        durationMinutes *
          60 *
          1000
    );

    // -------------------------------------------------
    // FORMAT DATE DD-MM-YYYY
    // -------------------------------------------------
    const formatDate = (date) => {
      const day = String(
        date.getDate()
      ).padStart(2, "0");

      const month = String(
        date.getMonth() + 1
      ).padStart(2, "0");

      const year =
        date.getFullYear();

      return `${day}-${month}-${year}`;
    };

    // -------------------------------------------------
    // FORMAT TIME HH:MM AM/PM
    // -------------------------------------------------
    const formatTime = (date) => {
      let hour =
        date.getHours();

      const minute = String(
        date.getMinutes()
      ).padStart(2, "0");

      const suffix =
        hour >= 12
          ? "PM"
          : "AM";

      hour =
        hour % 12;

      if (hour === 0) {
        hour = 12;
      }

      return `${String(
        hour
      ).padStart(
        2,
        "0"
      )}:${minute} ${suffix}`;
    };

    const slot = {
      startDate:
        formatDate(start),

      startTime:
        formatTime(start),

      endDate:
        formatDate(end),

      endTime:
        formatTime(end),
    };

    console.log(
      `Current local time: ` +
        `${formatDate(now)} ` +
        `${formatTime(now)}`
    );

    console.log(
      `Auction slot: ` +
        `${slot.startDate} ` +
        `${slot.startTime} -> ` +
        `${slot.endDate} ` +
        `${slot.endTime}`
    );

    return slot;
  }

  // =====================================================
  // DATE INPUT
  // =====================================================
  async fillDateInput(
    input,
    value,
    fieldName
  ) {
    await expect(
      input,
      `${fieldName} input should be visible`
    ).toBeVisible({
      timeout: 20_000,
    });

    await input.click();

    await input.fill(value);

    await input.press("Tab");

    await expect(
      input,
      `${fieldName} should contain ${value}`
    ).toHaveValue(value);

    console.log(
      `${fieldName}: ${value}`
    );
  }

  // =====================================================
  // TIME INPUT
  // =====================================================
  async selectTimeInput(
    input,
    value,
    fieldName
  ) {
    await expect(
      input,
      `${fieldName} input should be visible`
    ).toBeVisible({
      timeout: 20_000,
    });

    await input.click();

    // Realey time dropdown uses 15-minute options
    const dropdownOption =
      this.page
        .locator("body")
        .getByText(value, {
          exact: true,
        });

    const count =
      await dropdownOption.count();

    // Search visible option from bottom
    for (
      let index =
        count - 1;
      index >= 0;
      index -= 1
    ) {
      const candidate =
        dropdownOption.nth(index);

      if (
        await candidate
          .isVisible()
          .catch(() => false)
      ) {
        await candidate.click();

        await expect(
          input
        ).toHaveValue(value);

        console.log(
          `${fieldName}: ${value}`
        );

        return;
      }
    }

    // Fallback
    await input.fill(value);

    await input.press("Tab");

    await expect(
      input
    ).toHaveValue(value);

    console.log(
      `${fieldName}: ${value}`
    );
  }

  // =====================================================
  // COMPLETE AUCTION DATE/TIME
  // =====================================================
  async selectDynamicAuctionDateTime(
    config = {}
  ) {
    const slot =
      this.getDynamicAuctionSlot(
        config
      );

    await this.fillDateInput(
      this.auctionStartDateInput,
      slot.startDate,
      "Auction Start Date"
    );

    await this.selectTimeInput(
      this.auctionStartTimeInput,
      slot.startTime,
      "Auction Start Time"
    );

    await this.fillDateInput(
      this.auctionEndDateInput,
      slot.endDate,
      "Auction End Date"
    );

    await this.selectTimeInput(
      this.auctionEndTimeInput,
      slot.endTime,
      "Auction End Time"
    );

    return slot;
  }

  // =====================================================
  // AUCTION LOCATION
  // =====================================================
  async selectAuctionLocation(
    location = "Online"
  ) {
    const label =
      this.page.getByText(
        "Auction Location *",
        {
          exact: true,
        }
      );

    await expect(
      label,
      "Auction Location label should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    const dropdown =
      label.locator(
        "xpath=following::button[@role='combobox'][1]"
      );

    await expect(
      dropdown,
      "Auction Location dropdown should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await dropdown.click();

    const onlineOption =
      this.page.getByRole(
        "option",
        {
          name: location,
          exact: true,
        }
      );

    await expect(
      onlineOption,
      `"${location}" Auction Location option should be visible`
    ).toBeVisible({
      timeout: 10_000,
    });

    await onlineOption.click();

    await expect(
      dropdown
    ).toContainText(location);

    console.log(
      `Auction Location selected: ${location}`
    );
  }

  // =====================================================
  // STARTING PRICE
  // =====================================================
  async enterStartingPrice(
    startingPrice
  ) {
    await this.fillMoneyInput(
      this.startingPriceInput,
      startingPrice,
      "Starting Price"
    );
  }

  // =====================================================
  // MINIMUM BID INCREMENT
  // =====================================================
  async enterMinimumBidIncrement(
    minimumBidIncrement
  ) {
    await this.fillMoneyInput(
      this.minimumBidIncrementInput,
      minimumBidIncrement,
      "Minimum Bid Increment"
    );
  }

  // =====================================================
  // COMPLETE AUCTION PRICING
  // =====================================================
  async completeAuctionPricingStep({
    listingType = "Auction",
    reservePrice,
    depositPercent,
    auctionLocation,
    startingPrice,
    minimumBidIncrement,
    slotMinutes = 15,
    durationMinutes = 15,
  }) {
    await this.waitForPage();

    await this.selectListingType(
      listingType
    );

    await this.enterReservePrice(
      reservePrice
    );

    await this.enterDepositPercent(
      depositPercent
    );

    const slot =
      await this.selectDynamicAuctionDateTime({
        slotMinutes,
        durationMinutes,
      });

    await this.selectAuctionLocation(
      auctionLocation
    );

    await this.enterStartingPrice(
      startingPrice
    );

    await this.enterMinimumBidIncrement(
      minimumBidIncrement
    );

    await this.clickNext();

    return slot;
  }

  // =====================================================
  // NEXT
  // =====================================================
  async clickNext() {
    await expect(
      this.nextButton,
      "Next button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.nextButton,
      "Next button should be enabled"
    ).toBeEnabled();

    console.log(
      "Clicking Pricing Next button..."
    );

    await this.nextButton.click();

    console.log(
      "Pricing Next button clicked"
    );
  }

  // =====================================================
  // FIXED PRICE / OFFER PRICE
  // KEEP EXISTING FLOW
  // =====================================================
  async completePricingStep({
    listingType,
    priceGuide,
  }) {
    await this.waitForPage();

    await this.selectListingType(
      listingType
    );

    await this.enterPriceGuide(
      priceGuide
    );

    await this.clickNext();
  }
}

module.exports = {
  PricingSalePage,
};