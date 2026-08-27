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

    this.selectPhotosText = page.getByText(
      "Select Photos",
      {
        exact: true,
      }
    );

    this.propertyPhotosInput = page
      .locator('input[type="file"][multiple]')
      .first();

    this.imageCountText = page
      .getByText(/total images:\s*\d+\/10/i)
      .first();

    /* =====================================================
       FLOOR PLAN
    ===================================================== */

    this.selectFloorPlanText = page.getByText(
      "Select Floor Plan",
      {
        exact: true,
      }
    );

    this.floorPlanInput = page
      .locator('input[type="file"]:not([multiple])')
      .first();

    /* =====================================================
       CONFIRM LISTING
    ===================================================== */

    this.confirmListingCheckbox = page.locator(
      'button#confirmListing[role="checkbox"]'
    );

    /* =====================================================
       PUBLISH LISTING
    ===================================================== */

    this.publishListingButton = page.getByRole(
      "button",
      {
        name: "Publish Listing",
        exact: true,
      }
    );

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
    await this.page.waitForLoadState(
      "domcontentloaded"
    );

    console.log(
      "Waiting for Listing Media page..."
    );

    /* -----------------------------
       SELECT PHOTOS
    ----------------------------- */

    await expect(
      this.selectPhotosText,
      "Select Photos should be visible"
    ).toBeVisible({
      timeout: 30_000,
    });

    console.log(
      "Select Photos is visible"
    );

    /* -----------------------------
       SELECT FLOOR PLAN
    ----------------------------- */

    await expect(
      this.selectFloorPlanText,
      "Select Floor Plan should be visible"
    ).toBeVisible({
      timeout: 30_000,
    });

    console.log(
      "Select Floor Plan is visible"
    );

    /* -----------------------------
       CONFIRM CHECKBOX
    ----------------------------- */

    await expect(
      this.confirmListingCheckbox,
      "Confirm Listing checkbox should be visible"
    ).toBeVisible({
      timeout: 30_000,
    });

    console.log(
      "Confirm Listing checkbox is visible"
    );

    /* -----------------------------
       PUBLISH BUTTON
    ----------------------------- */

    await expect(
      this.publishListingButton,
      "Publish Listing button should be visible"
    ).toBeVisible({
      timeout: 30_000,
    });

    console.log(
      "Publish Listing button is visible"
    );

    console.log(
      "Listing Media page loaded successfully"
    );
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

      const extension = path
        .extname(filePath)
        .toLowerCase();

      const supportedExtensions = [
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
      ];

      if (
        !supportedExtensions.includes(
          extension
        )
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

    this.validateFiles(
      propertyPhotos
    );

    console.log(
      "Starting property photos upload..."
    );

    await expect(
      this.selectPhotosText,
      "Select Photos should be visible before upload"
    ).toBeVisible({
      timeout: 20_000,
    });

    /* =====================================================
       FIND PROPERTY PHOTO INPUT
    ===================================================== */

    const photoInputCount =
      await this.propertyPhotosInput.count();

    if (photoInputCount === 0) {
      throw new Error(
        [
          "Property Photos file input was not found.",
          "Select Photos text is visible but no multiple file input exists.",
        ].join("\n")
      );
    }

    /* =====================================================
       SET FILES
    ===================================================== */

    await this.propertyPhotosInput.setInputFiles(
      propertyPhotos
    );

    const uploadedFileNames =
      propertyPhotos.map(
        (filePath) =>
          path.basename(filePath)
      );

    console.log(
      "Property photos selected:",
      uploadedFileNames
    );

    await this.page.waitForTimeout(
      2_000
    );

    /* =====================================================
       VERIFY IMAGE COUNT
    ===================================================== */

    const imageCountVisible =
      await this.imageCountText
        .isVisible()
        .catch(() => false);

    if (imageCountVisible) {
      const countText =
        await this.imageCountText
          .innerText();

      console.log(
        `Property image count: ${countText}`
      );

      const countMatch =
        countText.match(
          /total images:\s*(\d+)\/10/i
        );

      if (countMatch) {
        const uploadedCount =
          Number(
            countMatch[1]
          );

        if (
          uploadedCount <
          propertyPhotos.length
        ) {
          throw new Error(
            [
              "Not all property photos were processed.",
              `Expected: ${propertyPhotos.length}`,
              `Uploaded: ${uploadedCount}`,
            ].join("\n")
          );
        }

        console.log(
          "Property photos uploaded successfully"
        );

        return;
      }
    }

    /* =====================================================
       FALLBACK VERIFY INPUT.FILES
    ===================================================== */

    const selectedFileCount =
      await this.propertyPhotosInput
        .evaluate(
          (input) =>
            input.files?.length || 0
        )
        .catch(() => 0);

    console.log(
      `Property photo input contains ${selectedFileCount} file(s)`
    );

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

    console.log(
      "Property photos uploaded successfully"
    );
  }

  /* =====================================================
     FLOOR PLAN UPLOAD
  ===================================================== */

  async uploadFloorPlan(
    floorPlan
  ) {
    if (!floorPlan) {
      throw new Error(
        "Floor plan file is required."
      );
    }

    this.validateFiles([
      floorPlan,
    ]);

    const fileName =
      path.basename(
        floorPlan
      );

    console.log(
      `Starting floor plan upload: ${fileName}`
    );

    await expect(
      this.selectFloorPlanText,
      "Select Floor Plan should be visible before upload"
    ).toBeVisible({
      timeout: 20_000,
    });

    /* =====================================================
       FIND FLOOR PLAN INPUT
    ===================================================== */

    const floorInputCount =
      await this.floorPlanInput.count();

    if (floorInputCount === 0) {
      throw new Error(
        [
          "Floor Plan file input was not found.",
          "Select Floor Plan text is visible but no single file input exists.",
        ].join("\n")
      );
    }

    /* =====================================================
       SET FLOOR PLAN FILE
    ===================================================== */

    await this.floorPlanInput.setInputFiles(
      floorPlan
    );

    console.log(
      `Floor plan selected: ${fileName}`
    );

    await this.page.waitForTimeout(
      2_000
    );

    /* =====================================================
       VERIFY INPUT
    ===================================================== */

    const selectedFileCount =
      await this.floorPlanInput
        .evaluate(
          (input) =>
            input.files?.length || 0
        )
        .catch(() => 0);

    if (selectedFileCount === 1) {
      console.log(
        "Floor plan uploaded successfully"
      );

      return;
    }

    /* =====================================================
       FALLBACK: LOOK FOR FILE NAME
    ===================================================== */

    const fileNameLocator =
      this.page.getByText(
        fileName,
        {
          exact: false,
        }
      );

    const fileNameVisible =
      await fileNameLocator
        .first()
        .isVisible()
        .catch(() => false);

    if (fileNameVisible) {
      console.log(
        "Floor plan filename is visible"
      );

      return;
    }

    /* =====================================================
       FALLBACK: LOOK FOR IMAGE PREVIEW
    ===================================================== */

    const imagePreview =
      this.page.locator(
        [
          'img[src^="blob:"]',
          'img[src^="data:"]',
          '[class*="floor-plan" i] img',
          '[class*="preview" i] img',
        ].join(", ")
      );

    const previewVisible =
      await imagePreview
        .first()
        .isVisible()
        .catch(() => false);

    if (previewVisible) {
      console.log(
        "Floor plan preview is visible"
      );

      return;
    }

    throw new Error(
      [
        "Floor plan upload could not be verified.",
        `File: ${fileName}`,
      ].join("\n")
    );
  }

  /* =====================================================
     CONFIRM LISTING
  ===================================================== */

  async confirmListing() {
    console.log(
      "Confirming listing..."
    );

    await expect(
      this.confirmListingCheckbox,
      "Confirm Listing checkbox should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await this.confirmListingCheckbox
      .scrollIntoViewIfNeeded();

    let checkedState =
      await this.confirmListingCheckbox
        .getAttribute(
          "aria-checked"
        );

    console.log(
      `Confirm Listing initial state: ${checkedState}`
    );

    if (checkedState !== "true") {
      await this.confirmListingCheckbox
        .click();

      await expect(
        this.confirmListingCheckbox,
        "Confirm Listing checkbox should become checked"
      ).toHaveAttribute(
        "aria-checked",
        "true",
        {
          timeout: 10_000,
        }
      );
    }

    checkedState =
      await this.confirmListingCheckbox
        .getAttribute(
          "aria-checked"
        );

    if (checkedState !== "true") {
      throw new Error(
        "Confirm Listing checkbox was not selected."
      );
    }

    console.log(
      "Confirm Listing checkbox checked successfully"
    );
  }

  /* =====================================================
     PUBLISH LISTING
  ===================================================== */

  async publishListing() {
    console.log(
      "Publishing listing..."
    );

    await expect(
      this.publishListingButton,
      "Publish Listing button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await this.publishListingButton
      .scrollIntoViewIfNeeded();

    await expect(
      this.publishListingButton,
      "Publish Listing button should be enabled"
    ).toBeEnabled({
      timeout: 20_000,
    });

    await this.publishListingButton
      .click();

    console.log(
      "Publish Listing button clicked successfully"
    );
  }

  /* =====================================================
     COMPLETE MEDIA STEP
  ===================================================== */

  async completeMediaStep({
    propertyPhotos,
    floorPlan,
  }) {
    console.log(
      "Starting Listing Media step..."
    );

    await this.waitForPage();

    await this.uploadPropertyPhotos(
      propertyPhotos
    );

    await this.uploadFloorPlan(
      floorPlan
    );

    await this.confirmListing();

    await this.publishListing();

    console.log(
      "Listing Media step completed"
    );
  }
}

module.exports = {
  ListingMediaPage,
};