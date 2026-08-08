const { expect } = require("@playwright/test");

class PropertyDetailsPage {
  /**
   * @param {import("@playwright/test").Page} page
   */
  constructor(page) {
    this.page = page;

    /* =====================================================
       STEP INDICATORS
    ===================================================== */

    this.listPropertyTitle = page.getByRole("heading", {
      name: "List Your Property",
      exact: true,
    });

    this.detailsStepText = page.getByText("Details", {
      exact: true,
    });

    this.stepCounter = page.getByText(/Step 2 of 5/i);

    /* =====================================================
       PROPERTY TYPE
    ===================================================== */

    /*
     * Uses the first combobox on the Details step.
     * Update this locator later if the page has multiple dropdowns.
     */
    this.propertyTypeDropdown = page
      .getByRole("combobox")
      .first();

    /* =====================================================
       PROPERTY DETAIL FIELDS
    ===================================================== */

    /*
     * Flexible locators support inputs using:
     * - name
     * - id
     * - placeholder
     * - aria-label
     */

    this.bedroomsInput = page
      .locator(
        [
          'input[name*="bedroom" i]',
          'input[id*="bedroom" i]',
          'input[placeholder*="bedroom" i]',
          'input[aria-label*="bedroom" i]',
          'input[name="beds"]',
          'input[id="beds"]',
        ].join(", ")
      )
      .first();

    this.bathroomsInput = page
      .locator(
        [
          'input[name*="bathroom" i]',
          'input[id*="bathroom" i]',
          'input[placeholder*="bathroom" i]',
          'input[aria-label*="bathroom" i]',
          'input[name="baths"]',
          'input[id="baths"]',
        ].join(", ")
      )
      .first();

    this.carSpacesInput = page
      .locator(
        [
          'input[name*="car" i]',
          'input[id*="car" i]',
          'input[placeholder*="car" i]',
          'input[aria-label*="car" i]',
          'input[name*="garage" i]',
          'input[id*="garage" i]',
          'input[placeholder*="garage" i]',
          'input[aria-label*="garage" i]',
        ].join(", ")
      )
      .first();

    this.landSizeInput = page
      .locator(
        [
          'input[name*="land" i]',
          'input[id*="land" i]',
          'input[placeholder*="land" i]',
          'input[aria-label*="land" i]',
        ].join(", ")
      )
      .first();

    this.buildingSizeInput = page
      .locator(
        [
          'input[name*="building" i]',
          'input[id*="building" i]',
          'input[placeholder*="building" i]',
          'input[aria-label*="building" i]',
          'input[name*="floor-area" i]',
          'input[id*="floor-area" i]',
        ].join(", ")
      )
      .first();

    this.yearBuiltInput = page
      .locator(
        [
          'input[name*="year" i]',
          'input[id*="year" i]',
          'input[placeholder*="year" i]',
          'input[aria-label*="year" i]',
        ].join(", ")
      )
      .first();

    /* =====================================================
       NAVIGATION
    ===================================================== */

    this.nextButton = page
      .getByRole("button", {
        name: "Next",
        exact: true,
      })
      .last();

    this.backButton = page
      .getByRole("button", {
        name: /back|previous/i,
      })
      .last();
  }

  /* =====================================================
     PAGE VERIFICATION
  ===================================================== */

  async waitForPage() {
    await expect(
      this.listPropertyTitle,
      "List Your Property modal should remain visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    const stepCounterVisible = await this.stepCounter
      .isVisible()
      .catch(() => false);

    const detailsTextVisible = await this.detailsStepText
      .isVisible()
      .catch(() => false);

    if (!stepCounterVisible && !detailsTextVisible) {
      throw new Error(
        [
          "Property Details step was not detected.",
          `Current URL: ${this.page.url()}`,
        ].join("\n")
      );
    }

    await expect(
      this.nextButton,
      "Details step Next button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });
  }

  /* =====================================================
     PROPERTY TYPE
  ===================================================== */

  async selectPropertyType(propertyType) {
    if (!propertyType) {
      return;
    }

    const dropdownVisible = await this.propertyTypeDropdown
      .isVisible()
      .catch(() => false);

    if (!dropdownVisible) {
      console.warn(
        "Property Type dropdown was not found. Skipping property type selection."
      );
      return;
    }

    await this.propertyTypeDropdown.click();

    const roleOption = this.page.getByRole("option", {
      name: propertyType,
      exact: true,
    });

    const textOption = this.page
      .getByText(propertyType, {
        exact: true,
      })
      .last();

    if (await roleOption.isVisible().catch(() => false)) {
      await roleOption.click();
    } else {
      await expect(
        textOption,
        `Property Type option "${propertyType}" should be visible`
      ).toBeVisible({
        timeout: 10_000,
      });

      await textOption.click();
    }

    await expect(
      this.propertyTypeDropdown,
      `Property Type should be "${propertyType}"`
    ).toContainText(propertyType);
  }

  /* =====================================================
     INPUT HELPERS
  ===================================================== */

  async fillInputIfVisible(locator, value, fieldName) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return;
    }

    const visible = await locator
      .isVisible()
      .catch(() => false);

    if (!visible) {
      console.warn(
        `${fieldName} field was not found. Skipping this field.`
      );
      return;
    }

    const stringValue = String(value);

    await locator.click();

    await locator.fill("");

    await locator.fill(stringValue);

    await expect(
      locator,
      `${fieldName} should contain "${stringValue}"`
    ).toHaveValue(stringValue);
  }

  async fillBedrooms(value) {
    await this.fillInputIfVisible(
      this.bedroomsInput,
      value,
      "Bedrooms"
    );
  }

  async fillBathrooms(value) {
    await this.fillInputIfVisible(
      this.bathroomsInput,
      value,
      "Bathrooms"
    );
  }

  async fillCarSpaces(value) {
    await this.fillInputIfVisible(
      this.carSpacesInput,
      value,
      "Car Spaces"
    );
  }

  async fillLandSize(value) {
    await this.fillInputIfVisible(
      this.landSizeInput,
      value,
      "Land Size"
    );
  }

  async fillBuildingSize(value) {
    await this.fillInputIfVisible(
      this.buildingSizeInput,
      value,
      "Building Size"
    );
  }

  async fillYearBuilt(value) {
    await this.fillInputIfVisible(
      this.yearBuiltInput,
      value,
      "Year Built"
    );
  }

  /* =====================================================
     NEXT BUTTON
  ===================================================== */

  async clickNext() {
    await expect(
      this.nextButton,
      "Details step Next button should be visible"
    ).toBeVisible();

    await expect(
      this.nextButton,
      "Details step Next button should be enabled"
    ).toBeEnabled();

    await this.nextButton.scrollIntoViewIfNeeded();

    await this.nextButton.click();
  }

  /* =====================================================
     COMPLETE STEP
  ===================================================== */

  async completeDetailsStep({
    propertyType,
    bedrooms,
    bathrooms,
    carSpaces,
    landSize,
    buildingSize,
    yearBuilt,
  } = {}) {
    await this.waitForPage();

    await this.selectPropertyType(propertyType);

    await this.fillBedrooms(bedrooms);

    await this.fillBathrooms(bathrooms);

    await this.fillCarSpaces(carSpaces);

    await this.fillLandSize(landSize);

    await this.fillBuildingSize(buildingSize);

    await this.fillYearBuilt(yearBuilt);

    await this.clickNext();
  }
}

module.exports = {
  PropertyDetailsPage,
};