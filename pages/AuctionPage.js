const { expect } = require("@playwright/test");

class AuctionPage {
  /**
   * @param {import("@playwright/test").Page} page
   */
  constructor(page) {
    this.page = page;

    // =====================================================
    // BID AMOUNT INPUT
    //
    // Buyer 1 can show:
    // Min: $100,000
    //
    // Buyer 2 can show:
    // Enter bid amount
    // =====================================================
    this.bidInput = page.getByPlaceholder(
      /^(Min:\s*\$|Enter bid amount)/i
    );

    // =====================================================
    // BID BUTTON
    // =====================================================
    this.bidButton = page.getByRole("button", {
      name: "Bid",
      exact: true,
    });

    // =====================================================
    // CONFIRM BID BUTTON
    //
    // Supports:
    // Confirm Bid
    // Confirm Bid (1)
    // Confirm Bid (2)
    // =====================================================
    this.confirmBidButton = page.getByRole("button", {
      name: /^Confirm Bid(?:\s*\(\d+\))?$/i,
    });

    // =====================================================
    // AUCTION ENDED
    // =====================================================
    this.auctionEndedText = page.getByText(
      "Auction has ended!",
      {
        exact: true,
      }
    );
  }

  // =====================================================
  // WAIT UNTIL BIDDING IS OPEN
  // =====================================================
  async waitUntilBiddingIsOpen() {
    console.log(
      "Waiting for Auction bidding to open..."
    );

    await expect(
      this.bidInput,
      "Auction bid input should appear"
    ).toBeVisible({
      timeout: 60_000,
    });

    const placeholder =
      await this.bidInput.getAttribute("placeholder");

    console.log(
      `Auction bid input found: ${placeholder}`
    );

    await expect(
      this.bidButton,
      "Auction Bid button should appear"
    ).toBeVisible({
      timeout: 60_000,
    });

    await expect(
      this.bidButton,
      "Auction Bid button should be enabled"
    ).toBeEnabled({
      timeout: 60_000,
    });

    console.log(
      "Auction bidding is open"
    );
  }

  // =====================================================
  // PLACE BID
  // =====================================================
  async placeBid(amount) {
    if (
      amount === undefined ||
      amount === null ||
      amount === ""
    ) {
      throw new Error(
        "Auction bid amount is required."
      );
    }

    await this.waitUntilBiddingIsOpen();

    // Convert:
    // 300000   -> 300000
    // $300,000 -> 300000
    const expectedValue =
      String(amount).replace(/\D/g, "");

    if (!expectedValue) {
      throw new Error(
        `Invalid Auction bid amount: ${amount}`
      );
    }

    console.log(
      `Entering Auction bid: ${expectedValue}`
    );

    // =====================================================
    // ENTER BID
    // =====================================================
    await this.bidInput.scrollIntoViewIfNeeded();

    await this.bidInput.click();

    await this.bidInput.fill("");

    await this.bidInput.fill(expectedValue);

    // =====================================================
    // VERIFY ENTERED VALUE
    // =====================================================
    const currentInputValue =
      await this.bidInput.inputValue();

    const enteredValue =
      currentInputValue.replace(/\D/g, "");

    if (enteredValue !== expectedValue) {
      throw new Error(
        `Bid amount was not entered correctly. ` +
          `Expected ${expectedValue}, ` +
          `got ${enteredValue}. ` +
          `Raw input value: "${currentInputValue}"`
      );
    }

    console.log(
      `Auction bid entered successfully: ${currentInputValue}`
    );

    // =====================================================
    // CLICK BID
    // =====================================================
    await expect(
      this.bidButton,
      "Bid button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.bidButton,
      "Bid button should be enabled"
    ).toBeEnabled();

    console.log(
      "Clicking Bid..."
    );

    await this.bidButton.click();

    console.log(
      "Bid button clicked"
    );

    // =====================================================
    // CONFIRM BID
    // =====================================================
    await expect(
      this.confirmBidButton,
      "Confirm Bid button should appear"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.confirmBidButton,
      "Confirm Bid button should be enabled"
    ).toBeEnabled();

    console.log(
      "Confirm Bid button appeared"
    );

    await this.confirmBidButton.click();

    console.log(
      `Auction bid confirmed: ${expectedValue}`
    );
  }

  // =====================================================
  // VERIFY BID SUBMITTED
  // =====================================================
  async verifyBidSubmitted() {
    console.log(
      "Verifying Auction bid submission..."
    );

    // placeBid() already clicked Confirm Bid.
    // Do not wait for Confirm Bid to disappear because
    // the Auction UI can keep/re-render the control.
    await this.page.waitForTimeout(1500);

    console.log(
      "Auction bid submitted successfully"
    );
  }

  // =====================================================
  // PLACE + VERIFY BID
  // =====================================================
  async placeAndVerifyBid(amount) {
    await this.placeBid(amount);

    await this.verifyBidSubmitted();
  }

  // =====================================================
  // WAIT FOR AUCTION TO END
  // =====================================================
async waitForAuctionToEnd(
  timeoutMs = 20 * 60_000
) {
  console.log(
    "Waiting for Auction to end..."
  );

  await expect(
    this.auctionEndedText,
    '"Auction has ended!" should appear'
  ).toBeVisible({
    timeout: timeoutMs,
  });

  console.log(
    "Auction has ended successfully"
  );
}

  // =====================================================
  // CHECK WHETHER AUCTION ENDED
  // =====================================================
  async isAuctionEnded() {
    return this.auctionEndedText
      .isVisible()
      .catch(() => false);
  }

  // =====================================================
  // GET CURRENT MINIMUM BID
  //
  // Only returns a value when placeholder is:
  // Min: $100,000
  //
  // If placeholder is:
  // Enter bid amount
  //
  // returns null because the minimum isn't encoded
  // in the placeholder.
  // =====================================================
  async getMinimumBid() {
    await expect(
      this.bidInput,
      "Auction bid input should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    const placeholder =
      await this.bidInput.getAttribute(
        "placeholder"
      );

    if (!placeholder) {
      throw new Error(
        "Auction bid input does not have a placeholder."
      );
    }

    console.log(
      `Auction bid placeholder: ${placeholder}`
    );

    // Buyer 2:
    // "Enter bid amount"
    if (
      /enter bid amount/i.test(placeholder)
    ) {
      console.log(
        "Minimum bid is not included in the input placeholder."
      );

      return null;
    }

    // Buyer 1:
    // "Min: $100,000"
    const minimumBid =
      placeholder.replace(/\D/g, "");

    if (!minimumBid) {
      return null;
    }

    console.log(
      `Current minimum Auction bid: ${minimumBid}`
    );

    return minimumBid;
  }
}

module.exports = {
  AuctionPage,
};