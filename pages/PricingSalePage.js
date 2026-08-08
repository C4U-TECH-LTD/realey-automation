const { expect } = require("@playwright/test");

class PricingSalePage {
  /**
   * @param {import("@playwright/test").Page} page
   */
  constructor(page) {
    this.page = page;

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

    /*
     * Radix UI dropdown.
     * Scoped using the Listing Type label section where possible.
     */
    this.listingTypeDropdown = page
      .getByRole("combobox")
      .first();

    this.priceGuideInput =
      page.getByPlaceholder(
        "e.g., 950,000",
        {
          exact: true,
        }
      );

    this.nextButton = page.getByRole(
      "button",
      {
        name: "Next",
        exact: true,
      }
    );
  }

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
      "Price Guide input should be visible"
    ).toBeVisible();
  }

  async selectListingType(listingType) {
    if (!listingType) {
      throw new Error(
        "Listing type is required."
      );
    }

    await this.listingTypeDropdown.click();

    const option = this.page.getByRole(
      "option",
      {
        name: listingType,
        exact: true,
      }
    );

    const optionVisible = await option
      .isVisible()
      .catch(() => false);

    if (optionVisible) {
      await option.click();
    } else {
      /*
       * Fallback for Radix menu items that are not exposed
       * with option role.
       */
      await this.page
        .getByText(listingType, {
          exact: true,
        })
        .last()
        .click();
    }

    await expect(
      this.listingTypeDropdown
    ).toContainText(listingType);
  }

  async enterPriceGuide(priceGuide) {
    if (!priceGuide) {
      throw new Error(
        "Price guide is required."
      );
    }

    await this.priceGuideInput.click();

    await this.priceGuideInput.fill("");

    await this.priceGuideInput.fill(
      String(priceGuide)
    );

    const currentValue =
      await this.priceGuideInput.inputValue();

    const numericValue =
      currentValue.replace(/\D/g, "");

    if (!numericValue.includes(String(priceGuide))) {
      throw new Error(
        `Price Guide was not entered correctly. Current value: ${currentValue}`
      );
    }
  }

  async clickNext() {
    await expect(
      this.nextButton,
      "Next button should be visible"
    ).toBeVisible();

    await expect(
      this.nextButton,
      "Next button should be enabled"
    ).toBeEnabled();

    await this.nextButton.click();
  }

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