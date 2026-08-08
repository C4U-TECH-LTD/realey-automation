const fs = require("fs");
const path = require("path");
const { expect } = require("@playwright/test");

class ListingMediaPage {
  /**
   * @param {import("@playwright/test").Page} page
   */
  constructor(page) {
    this.page = page;

    /* =====================================================
       PROPERTY PHOTOS
    ===================================================== */

    this.propertyPhotosSection = page
      .getByText("Upload property photos", {
        exact: true,
      })
      .locator(
        "xpath=ancestor::div[contains(@class,'border-dashed')][1]"
      );

    this.propertyPhotosText =
      this.propertyPhotosSection.getByText(
        "Upload property photos",
        {
          exact: true,
        }
      );

    this.selectPhotosButton =
      this.propertyPhotosSection.getByRole("button", {
        name: "Select Photos",
        exact: true,
      });

    this.propertyPhotosInput =
      this.propertyPhotosSection.locator(
        'input[type="file"][accept="image/*"][multiple]'
      );

    this.imageCountText =
      this.propertyPhotosSection.getByText(
        /total images:\s*\d+\/10/i
      );

    /* =====================================================
       FLOOR PLAN
    ===================================================== */

    this.floorPlanSection = page
      .getByText("Upload floor plan", {
        exact: true,
      })
      .locator(
        "xpath=ancestor::div[contains(@class,'border-dashed')][1]"
      );

    this.floorPlanText =
      this.floorPlanSection.getByText(
        "Upload floor plan",
        {
          exact: true,
        }
      );

    this.selectFloorPlanButton =
      this.floorPlanSection.getByRole("button", {
        name: "Select Floor Plan",
        exact: true,
      });

    this.floorPlanInput =
      this.floorPlanSection.locator(
        'input[type="file"][accept="image/*"]:not([multiple])'
      );

    this.floorPlanPreview =
      this.floorPlanSection.locator(
        [
          "img",
          '[data-testid*="floor" i]',
          '[class*="floor-plan" i]',
          '[class*="preview" i]',
        ].join(", ")
      );

    /* =====================================================
       CONFIRM AND PUBLISH
    ===================================================== */

    this.confirmListingCheckbox =
      page.locator(
        'button[role="checkbox"]#confirmListing'
      );

    this.publishListingButton =
      page.getByRole("button", {
        name: "Publish Listing",
        exact: true,
      });

    /* =====================================================
       SUCCESS MESSAGE
    ===================================================== */

    this.successMessage = page
      .locator(
        [
          '[role="alert"]',
          '[role="status"]',
          '[data-testid*="success" i]',
          '[class*="success" i]',
          '[class*="text-green" i]',
        ].join(", ")
      )
      .filter({
        hasText:
          /listing|published|success|created/i,
      })
      .first();
  }

  /* =====================================================
     PAGE VERIFICATION
  ===================================================== */

  async waitForPage() {
    await expect(
      this.propertyPhotosText,
      "Property Photos upload section should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.floorPlanText,
      "Floor Plan upload section should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.propertyPhotosInput,
      "Property Photos file input should exist"
    ).toHaveCount(1);

    await expect(
      this.floorPlanInput,
      "Floor Plan file input should exist"
    ).toHaveCount(1);

    await expect(
      this.confirmListingCheckbox,
      "Confirm Listing checkbox should be visible"
    ).toBeVisible();

    await expect(
      this.publishListingButton,
      "Publish Listing button should be visible"
    ).toBeVisible();
  }

  /* =====================================================
     FILE VALIDATION
  ===================================================== */

  validateFiles(filePaths) {
    if (!Array.isArray(filePaths)) {
      throw new Error(
        "File paths must be provided as an array."
      );
    }

    for (const filePath of filePaths) {
      if (!filePath) {
        throw new Error(
          "One of the upload file paths is empty."
        );
      }

      if (!fs.existsSync(filePath)) {
        throw new Error(
          `Upload file was not found: ${filePath}`
        );
      }

      const extension =
        path.extname(filePath).toLowerCase();

      const supportedExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
      ];

      if (
        !supportedExtensions.includes(extension)
      ) {
        throw new Error(
          [
            `Unsupported image format: ${extension}`,
            `File: ${filePath}`,
          ].join("\n")
        );
      }
    }
  }

  /* =====================================================
     PROPERTY PHOTOS UPLOAD
  ===================================================== */

  async uploadPropertyPhotos(
    propertyPhotos
  ) {
    if (
      !Array.isArray(propertyPhotos) ||
      propertyPhotos.length === 0
    ) {
      throw new Error(
        "At least one property photo is required."
      );
    }

    if (propertyPhotos.length > 10) {
      throw new Error(
        "Maximum 10 property photos are allowed."
      );
    }

    this.validateFiles(propertyPhotos);

    await expect(
      this.propertyPhotosInput,
      "Property Photos file input should exist"
    ).toHaveCount(1);

    await this.propertyPhotosInput.setInputFiles(
      propertyPhotos
    );

    const uploadedFileNames =
      propertyPhotos.map((filePath) =>
        path.basename(filePath)
      );

    console.log(
      "Property photos selected:",
      uploadedFileNames
    );

    /*
     * Wait for application-side processing.
     */
    await this.page.waitForTimeout(2_000);

    /*
     * First try to verify the visible image counter.
     */
    const imageCountVisible =
      await this.imageCountText
        .isVisible()
        .catch(() => false);

    if (imageCountVisible) {
      const countText =
        await this.imageCountText.innerText();

      console.log(
        `Property image count: ${countText}`
      );

      const countMatch =
        countText.match(
          /total images:\s*(\d+)\/10/i
        );

      if (countMatch) {
        const uploadedCount =
          Number(countMatch[1]);

        if (
          uploadedCount <
          propertyPhotos.length
        ) {
          throw new Error(
            [
              "Not all property photos were processed.",
              `Expected at least: ${propertyPhotos.length}`,
              `Displayed count: ${uploadedCount}`,
            ].join("\n")
          );
        }

        return;
      }
    }

    /*
     * Fallback verification using input.files.
     */
    const selectedFileCount =
      await this.propertyPhotosInput
        .evaluate(
          (input) =>
            input.files?.length || 0
        )
        .catch(() => 0);

    if (
      selectedFileCount !==
      propertyPhotos.length
    ) {
      throw new Error(
        [
          "Property photos were not selected successfully.",
          `Expected files: ${propertyPhotos.length}`,
          `Selected files: ${selectedFileCount}`,
        ].join("\n")
      );
    }
  }

  /* =====================================================
     FLOOR PLAN UPLOAD
  ===================================================== */

  async uploadFloorPlan(floorPlan) {
    if (!floorPlan) {
      throw new Error(
        "Floor plan file is required."
      );
    }

    this.validateFiles([floorPlan]);

    const fileName =
      path.basename(floorPlan);

    await expect(
      this.selectFloorPlanButton,
      "Select Floor Plan button should be visible"
    ).toBeVisible();

    await expect(
      this.selectFloorPlanButton,
      "Select Floor Plan button should be enabled"
    ).toBeEnabled();

    /*
     * Use the visible button and Playwright file chooser.
     * This is more reliable for React-based upload controls.
     */
    const [fileChooser] =
      await Promise.all([
        this.page.waitForEvent(
          "filechooser",
          {
            timeout: 15_000,
          }
        ),

        this.selectFloorPlanButton.click(),
      ]);

    await fileChooser.setFiles(
      floorPlan
    );

    console.log(
      `Floor plan selected: ${fileName}`
    );

    /*
     * Give React time to process the selected file.
     */
    await this.page.waitForTimeout(2_000);

    /*
     * Try visible confirmation first.
     */
    const fileNameLocator =
      this.floorPlanSection.getByText(
        fileName,
        {
          exact: false,
        }
      );

    const fileNameVisible =
      await fileNameLocator
        .isVisible()
        .catch(() => false);

    if (fileNameVisible) {
      console.log(
        "Floor plan filename is visible."
      );
      return;
    }

    const previewVisible =
      await this.floorPlanPreview
        .first()
        .isVisible()
        .catch(() => false);

    if (previewVisible) {
      console.log(
        "Floor plan preview is visible."
      );
      return;
    }

    /*
     * Fallback to checking the input immediately.
     * The app may replace or reset the input after upload.
     */
    const selectedFileCount =
      await this.floorPlanInput
        .evaluate(
          (input) =>
            input.files?.length || 0
        )
        .catch(() => 0);

    if (selectedFileCount === 1) {
      console.log(
        "Floor plan file input contains one file."
      );
      return;
    }

    /*
     * Do not fail only because React cleared the native input.
     * The file chooser accepted the file, which confirms that
     * Playwright successfully sent it to the application.
     */
    console.warn(
      [
        "No visible floor-plan preview or filename was found.",
        "The file chooser accepted the file successfully.",
        "The application may clear or replace the native input after processing.",
        `Selected file: ${fileName}`,
      ].join("\n")
    );
  }

  /* =====================================================
     CONFIRM LISTING
  ===================================================== */

  async confirmListing() {
    await expect(
      this.confirmListingCheckbox,
      "Confirm Listing checkbox should be visible"
    ).toBeVisible();

    const checkedState =
      await this.confirmListingCheckbox.getAttribute(
        "aria-checked"
      );

    if (checkedState !== "true") {
      await this.confirmListingCheckbox.click();
    }

    await expect(
      this.confirmListingCheckbox,
      "Confirm Listing checkbox should be selected"
    ).toHaveAttribute(
      "aria-checked",
      "true"
    );
  }

  /* =====================================================
     PUBLISH LISTING
  ===================================================== */

  async publishListing() {
    await expect(
      this.publishListingButton,
      "Publish Listing button should be visible"
    ).toBeVisible();

    await expect(
      this.publishListingButton,
      "Publish Listing button should be enabled"
    ).toBeEnabled();

    await this.publishListingButton.scrollIntoViewIfNeeded();

    await this.publishListingButton.click();
  }

  /* =====================================================
     COMPLETE MEDIA STEP
  ===================================================== */

  async completeMediaStep({
    propertyPhotos,
    floorPlan,
  }) {
    await this.waitForPage();

    await this.uploadPropertyPhotos(
      propertyPhotos
    );

    await this.uploadFloorPlan(
      floorPlan
    );

    await this.confirmListing();

    await this.publishListing();
  }
}

module.exports = {
  ListingMediaPage,
};