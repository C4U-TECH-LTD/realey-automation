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

    // =====================================================
    // GOOGLE AUTOCOMPLETE
    // =====================================================

    this.googleSuggestionList = page.locator(
      ".pac-container"
    );

    this.googleSuggestions = page.locator(
      ".pac-container .pac-item"
    );

    // =====================================================
    // LOCATION FIELDS
    //
    // IMPORTANT:
    // Do NOT use:
    // getByText("Postcode").locator("following::input[1]")
    //
    // because it can accidentally select Council/other inputs.
    // =====================================================

    this.suburbInput = page
      .locator("label")
      .filter({
        hasText: /^Suburb\b/i,
      })
      .locator("xpath=following-sibling::*//input | following-sibling::input")
      .first();

    this.postcodeInput = page
      .locator("label")
      .filter({
        hasText: /^Postcode\b/i,
      })
      .locator("xpath=following-sibling::*//input | following-sibling::input")
      .first();

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

  // =====================================================
  // WAIT FOR PAGE
  // =====================================================

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
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.streetAddressInput,
      "Street Address input should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.nextButton,
      "Next button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });
  }

  // =====================================================
  // SELECT GOOGLE ADDRESS
  // =====================================================

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

    // =====================================================
    // WAIT FOR ADDRESS TO ACTUALLY CHANGE
    // =====================================================

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

    // Give Google Places / React state a short moment
    // to populate the remaining fields.
    await this.page.waitForTimeout(700);
  }

  // =====================================================
  // FIND FIELD BY LABEL
  //
  // Fallback helper in case the DOM wrapper differs
  // between different listing flows.
  // =====================================================

  async findInputNearLabel(labelText) {
    const label = this.page
      .getByText(labelText, {
        exact: false,
      })
      .filter({
        visible: true,
      })
      .first();

    if (
      !(await label
        .isVisible()
        .catch(() => false))
    ) {
      return null;
    }

    const parent = label.locator(
      "xpath=ancestor::*[self::div or self::label][1]"
    );

    const parentInput = parent
      .locator("input")
      .first();

    if (
      await parentInput
        .isVisible()
        .catch(() => false)
    ) {
      return parentInput;
    }

    const siblingInput = label.locator(
      "xpath=following-sibling::input[1]"
    );

    if (
      await siblingInput
        .isVisible()
        .catch(() => false)
    ) {
      return siblingInput;
    }

    const nextContainerInput = label.locator(
      "xpath=following-sibling::*[1]//input[1]"
    );

    if (
      await nextContainerInput
        .isVisible()
        .catch(() => false)
    ) {
      return nextContainerInput;
    }

    return null;
  }

  // =====================================================
  // WAIT FOR AUTO-FILLED FIELDS
  // =====================================================

  async waitForAutoFilledLocationFields() {
    console.log(
      "Waiting for auto-filled location fields..."
    );

    // =====================================================
    // SUBURB
    // =====================================================

    let suburbInput = this.suburbInput;

    let suburbVisible =
      await suburbInput
        .isVisible()
        .catch(() => false);

    if (!suburbVisible) {
      const fallback =
        await this.findInputNearLabel(
          "Suburb"
        );

      if (fallback) {
        suburbInput = fallback;
        suburbVisible = true;
      }
    }

    if (suburbVisible) {
      await expect(
        suburbInput,
        "Suburb should be auto-filled"
      ).not.toHaveValue("", {
        timeout: 15_000,
      });

      console.log(
        "Suburb:",
        await suburbInput.inputValue()
      );
    } else {
      console.log(
        "Suburb input not found - skipping optional verification"
      );
    }

    // =====================================================
    // POSTCODE
    // =====================================================

    let postcodeInput = this.postcodeInput;

    let postcodeVisible =
      await postcodeInput
        .isVisible()
        .catch(() => false);

    if (!postcodeVisible) {
      const fallback =
        await this.findInputNearLabel(
          "Postcode"
        );

      if (fallback) {
        postcodeInput = fallback;
        postcodeVisible = true;
      }
    }

    if (postcodeVisible) {
      const placeholder =
        await postcodeInput
          .getAttribute("placeholder")
          .catch(() => "");

      console.log(
        "Postcode input placeholder:",
        placeholder
      );

      // Safety:
      // Never treat Council input as Postcode input.
      if (
        placeholder &&
        /ACT Government/i.test(
          placeholder
        )
      ) {
        throw new Error(
          "Wrong Postcode locator detected: Council input was selected instead of Postcode."
        );
      }

      await expect(
        postcodeInput,
        "Postcode should be auto-filled"
      ).not.toHaveValue("", {
        timeout: 15_000,
      });

      const postcode =
        await postcodeInput.inputValue();

      console.log(
        `Postcode: ${postcode}`
      );
    } else {
      console.log(
        "Postcode input not found - skipping optional verification"
      );
    }

    // =====================================================
    // STATE
    // =====================================================

    const stateVisible =
      await this.stateDropdown
        .isVisible()
        .catch(() => false);

    if (stateVisible) {
      const stateText =
        await this.stateDropdown
          .innerText();

      if (!stateText.trim()) {
        throw new Error(
          "State was not auto-filled after selecting address."
        );
      }

      console.log(
        `State: ${stateText.trim()}`
      );
    }

    console.log(
      "Location auto-fill verification completed"
    );
  }

  // =====================================================
  // NEXT
  // =====================================================

  async clickNext() {
    await expect(
      this.nextButton,
      "Location step Next button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.nextButton,
      "Location step Next button should be enabled"
    ).toBeEnabled({
      timeout: 20_000,
    });

    await this.nextButton
      .scrollIntoViewIfNeeded();

    await this.nextButton.click();
  }

  // =====================================================
  // COMPLETE LOCATION STEP
  // =====================================================

  async completeLocationStep({
    addressSearchText = "a",
  } = {}) {
    await this.waitForPage();

    await this
      .typeAddressAndSelectFirstSuggestion(
        addressSearchText
      );

    await this
      .waitForAutoFilledLocationFields();

    await this.clickNext();
  }
}

module.exports = {
  PropertyLocationPage,
};