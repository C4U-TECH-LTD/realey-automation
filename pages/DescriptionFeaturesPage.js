const { expect } = require("@playwright/test");

class DescriptionFeaturesPage {
  /**
   * @param {import("@playwright/test").Page} page
   */
  constructor(page) {
    this.page = page;

    this.sectionHeading = page.getByText(
      "Description & Features",
      {
        exact: true,
      }
    );

    this.headlineInput =
      page.getByPlaceholder(
        "e.g., Stunning Family Home in Prestigious Location",
        {
          exact: true,
        }
      );

    this.descriptionEditor =
      page.locator(
        '.ql-editor[contenteditable="true"][data-placeholder="Describe the property..."]'
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
      "Description & Features section should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.headlineInput,
      "Property Headline input should be visible"
    ).toBeVisible();

    await expect(
      this.descriptionEditor,
      "Property Description editor should be visible"
    ).toBeVisible();
  }

  async enterHeadline(headline) {
    if (!headline) {
      throw new Error(
        "Property headline is required."
      );
    }

    await this.headlineInput.fill(
      headline
    );

    await expect(
      this.headlineInput
    ).toHaveValue(headline);
  }

  async enterDescription(description) {
    if (!description) {
      throw new Error(
        "Property description is required."
      );
    }

    await this.descriptionEditor.click();

    await this.descriptionEditor.fill(
      description
    );

    await expect(
      this.descriptionEditor
    ).toContainText(description);
  }

  getFeatureCheckbox(featureName) {
    return this.page.locator(
      `button[role="checkbox"][id="${featureName}"]`
    );
  }

  async selectFeature(featureName) {
    const checkbox =
      this.getFeatureCheckbox(
        featureName
      );

    await expect(
      checkbox,
      `Key Feature checkbox "${featureName}" should be visible`
    ).toBeVisible();

    const checkedState =
      await checkbox.getAttribute(
        "aria-checked"
      );

    if (checkedState !== "true") {
      await checkbox.click();
    }

    await expect(
      checkbox,
      `Key Feature "${featureName}" should be selected`
    ).toHaveAttribute(
      "aria-checked",
      "true"
    );
  }

  async selectFeatures(features) {
    if (
      !Array.isArray(features) ||
      features.length === 0
    ) {
      throw new Error(
        "At least one key feature is required."
      );
    }

    for (const feature of features) {
      await this.selectFeature(feature);
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

  async completeDescriptionStep({
    headline,
    propertyDescription,
    keyFeatures,
  }) {
    await this.waitForPage();

    await this.enterHeadline(
      headline
    );

    await this.enterDescription(
      propertyDescription
    );

    await this.selectFeatures(
      keyFeatures
    );

    await this.clickNext();
  }
}

module.exports = {
  DescriptionFeaturesPage,
};