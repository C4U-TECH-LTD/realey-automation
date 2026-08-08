const { expect } = require("@playwright/test");

class PropertyLocationPage {
  /**
   * @param {import("@playwright/test").Page} page
   */
  constructor(page) {
    this.page = page;

    this.modalTitle = page.getByRole("heading", {
      name: "List Your Property",
      exact: true,
    });

    this.sectionHeading = page.getByText(
      "Property Location",
      {
        exact: true,
      }
    );

    this.streetAddressInput = page.getByPlaceholder(
      "e.g., 15 Smith Avenue",
      {
        exact: true,
      }
    );

    /*
     * Google Places autocomplete suggestions are usually rendered
     * inside .pac-container and .pac-item.
     */
    this.googleSuggestionList = page.locator(
      ".pac-container"
    );

    this.googleSuggestions = page.locator(
      ".pac-container .pac-item"
    );

    this.suburbInput = page
      .getByText("Suburb", {
        exact: false,
      })
      .locator("xpath=following::input[1]");

    this.postcodeInput = page
      .getByText("Postcode", {
        exact: false,
      })
      .locator("xpath=following::input[1]");

    this.stateDropdown = page
      .getByRole("combobox")
      .first();

    this.councilInput = page.getByPlaceholder(
      "e.g., ACT Government",
      {
        exact: true,
      }
    );

    this.nextButton = page
      .getByRole("button", {
        name: "Next",
        exact: true,
      })
      .last();
  }

  async waitForPage() {
    await expect(
      this.modalTitle,
      "List Your Property modal should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.sectionHeading,
      "Property Location step should be visible"
    ).toBeVisible();

    await expect(
      this.streetAddressInput,
      "Street Address input should be visible"
    ).toBeVisible();

    await expect(
      this.nextButton,
      "Next button should be visible"
    ).toBeVisible();
  }

  async typeAddressAndSelectFirstSuggestion(
    searchText = "a"
  ) {
    if (!searchText) {
      throw new Error(
        "Address search text is required."
      );
    }

    await this.streetAddressInput.click();

    await this.streetAddressInput.fill("");

    await this.streetAddressInput.type(
      searchText,
      {
        delay: 200,
      }
    );

    /*
     * Wait for Google Places suggestions.
     */
    await expect(
      this.googleSuggestionList,
      "Google address suggestion list should appear"
    ).toBeVisible({
      timeout: 15_000,
    });

    const firstSuggestion =
      this.googleSuggestions.first();

    await expect(
      firstSuggestion,
      "First Google address suggestion should be visible"
    ).toBeVisible({
      timeout: 15_000,
    });

    const suggestionText =
      await firstSuggestion.innerText();

    console.log(
      `Selecting first address suggestion: ${suggestionText}`
    );

    await firstSuggestion.click();

    /*
     * After selection, Google usually fills the full address.
     */
    await expect(
      this.streetAddressInput,
      "Street Address should be populated after selecting a suggestion"
    ).not.toHaveValue(searchText, {
      timeout: 15_000,
    });

    const selectedAddress =
      await this.streetAddressInput.inputValue();

    if (!selectedAddress.trim()) {
      throw new Error(
        "Google address suggestion was selected, but Street Address remained empty."
      );
    }

    console.log(
      `Selected address: ${selectedAddress}`
    );
  }

  async waitForAutoFilledLocationFields() {
    /*
     * These fields may be auto-filled by Google Places.
     * They are optional checks because the application may fill them asynchronously.
     */
    const suburbVisible =
      await this.suburbInput
        .isVisible()
        .catch(() => false);

    if (suburbVisible) {
      await expect(
        this.suburbInput,
        "Suburb should be auto-filled"
      ).not.toHaveValue("", {
        timeout: 15_000,
      });
    }

    const postcodeVisible =
      await this.postcodeInput
        .isVisible()
        .catch(() => false);

    if (postcodeVisible) {
      await expect(
        this.postcodeInput,
        "Postcode should be auto-filled"
      ).not.toHaveValue("", {
        timeout: 15_000,
      });
    }

    const stateVisible =
      await this.stateDropdown
        .isVisible()
        .catch(() => false);

    if (stateVisible) {
      const stateText =
        await this.stateDropdown.innerText();

      if (!stateText.trim()) {
        throw new Error(
          "State was not auto-filled after selecting address."
        );
      }
    }
  }

  async clickNext() {
    await expect(
      this.nextButton,
      "Location step Next button should be visible"
    ).toBeVisible();

    await expect(
      this.nextButton,
      "Location step Next button should be enabled"
    ).toBeEnabled();

    await this.nextButton.scrollIntoViewIfNeeded();

    await this.nextButton.click();
  }

  async completeLocationStep({
    addressSearchText = "a",
  } = {}) {
    await this.waitForPage();

    await this.typeAddressAndSelectFirstSuggestion(
      addressSearchText
    );

    await this.waitForAutoFilledLocationFields();

    await this.clickNext();
  }
}

module.exports = {
  PropertyLocationPage,
};