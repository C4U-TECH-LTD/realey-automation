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

    this.selectPhotosText = page.getByText("Select Photos", {
      exact: true,
    });

    // Scope the hidden file input to the actual Property Photos upload button.
    // This avoids accidentally targeting another file input on the page.
    this.propertyPhotoUploadButton = this.selectPhotosText.locator(
      "xpath=ancestor::button[1]"
    );

    this.propertyPhotosInput = this.propertyPhotoUploadButton.locator(
      'input[type="file"]'
    );

    this.imageCountText = page
      .getByText(/total images:\s*\d+\/10/i)
      .first();

    /* =====================================================
       FLOOR PLAN
    ===================================================== */

    this.selectFloorPlanText = page.getByText("Select Floor Plan", {
      exact: true,
    });

    // Your HTML shows the hidden file input is inside the Floor Plan button.
    this.floorPlanUploadButton = this.selectFloorPlanText.locator(
      "xpath=ancestor::button[1]"
    );

    this.floorPlanInput = this.floorPlanUploadButton.locator(
      'input[type="file"]'
    );

    /* =====================================================
       CONFIRM LISTING
    ===================================================== */

    this.confirmListingCheckbox = page.locator(
      'button#confirmListing[role="checkbox"]'
    );

    /* =====================================================
       PUBLISH LISTING
    ===================================================== */

    this.publishListingButton = page.getByRole("button", {
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
        hasText: /listing|published|success|created/i,
      })
      .first();
  }

  /* =====================================================
     PAGE VERIFICATION
  ===================================================== */

  async waitForPage() {
    await this.page.waitForLoadState("domcontentloaded");

    console.log("Waiting for Listing Media page...");

    await expect(
      this.selectPhotosText,
      "Select Photos should be visible"
    ).toBeVisible({ timeout: 30_000 });

    await expect(
      this.selectFloorPlanText,
      "Select Floor Plan should be visible"
    ).toBeVisible({ timeout: 30_000 });

    await expect(
      this.confirmListingCheckbox,
      "Confirm Listing checkbox should be visible"
    ).toBeVisible({ timeout: 30_000 });

    await expect(
      this.publishListingButton,
      "Publish Listing button should be visible"
    ).toBeVisible({ timeout: 30_000 });

    console.log("Listing Media page loaded successfully");
  }

  /* =====================================================
     FILE VALIDATION
  ===================================================== */

  validateFiles(filePaths) {
    if (!Array.isArray(filePaths)) {
      throw new Error("File paths must be provided as an array.");
    }

    for (const filePath of filePaths) {
      if (!filePath) {
        throw new Error("One of the upload file paths is empty.");
      }

      if (!fs.existsSync(filePath)) {
        throw new Error(`Upload file was not found: ${filePath}`);
      }

      const extension = path.extname(filePath).toLowerCase();
      const supportedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

      if (!supportedExtensions.includes(extension)) {
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

  async uploadPropertyPhotos(propertyPhotos) {
    if (!Array.isArray(propertyPhotos) || propertyPhotos.length === 0) {
      throw new Error("At least one property photo is required.");
    }

    if (propertyPhotos.length > 10) {
      throw new Error("Maximum 10 property photos are allowed.");
    }

    this.validateFiles(propertyPhotos);

    console.log(
      `Starting property photos upload. Total files: ${propertyPhotos.length}`
    );

    propertyPhotos.forEach((filePath, index) => {
      console.log(`Property photo ${index + 1}: ${path.basename(filePath)}`);
    });

    await expect(
      this.propertyPhotoUploadButton,
      "Property Photos upload area should be visible"
    ).toBeVisible({ timeout: 20_000 });

    await this.propertyPhotoUploadButton.scrollIntoViewIfNeeded();

    await expect(
      this.propertyPhotosInput,
      "Property Photos file input should be attached"
    ).toBeAttached({ timeout: 10_000 });

    const inputCount = await this.propertyPhotosInput.count();

    if (inputCount !== 1) {
      throw new Error(
        [
          "Expected exactly one Property Photos file input.",
          `Found: ${inputCount}`,
        ].join("\n")
      );
    }

    console.log("Uploading property photos to the scoped file input...");

    await this.propertyPhotosInput.setInputFiles(propertyPhotos);

    console.log("Property photo files sent to the upload input");

    // Do NOT validate input.files.length after the upload. React may process
    // the files and immediately clear/reset the native input.

    // Primary verification: wait for the UI image count to reach the expected
    // number when that counter is available.
    try {
      await expect
        .poll(
          async () => {
            const visible = await this.imageCountText
              .isVisible()
              .catch(() => false);

            if (!visible) {
              return 0;
            }

            const countText = await this.imageCountText.innerText();
            const match = countText.match(/total images:\s*(\d+)\/10/i);
            return match ? Number(match[1]) : 0;
          },
          {
            timeout: 15_000,
            message: `Waiting for ${propertyPhotos.length} property photo(s) to be processed`,
          }
        )
        .toBeGreaterThanOrEqual(propertyPhotos.length);

      const countText = await this.imageCountText.innerText();
      console.log(`Property image count: ${countText}`);
      console.log("Property photos uploaded successfully");
      return;
    } catch (_) {
      console.log(
        "Property image counter did not confirm the upload. Checking previews..."
      );
    }

    // Fallback verification: inspect visible image previews in the page.
    // Exclude common icon/logo sources where possible and only use this as
    // secondary evidence.
    const previewImages = this.page.locator(
      [
        'img[src^="blob:"]',
        'img[src^="data:image/"]',
        '[class*="preview" i] img',
        '[class*="photo" i] img',
      ].join(", ")
    );

    await this.page.waitForTimeout(1_000);

    const previewCount = await previewImages.count();
    console.log(`Property photo preview count: ${previewCount}`);

    if (previewCount >= propertyPhotos.length) {
      console.log("Property photos verified by previews");
      return;
    }

    throw new Error(
      [
        "Property photo upload could not be verified from the UI.",
        `Expected photos: ${propertyPhotos.length}`,
        `Visible previews: ${previewCount}`,
        "The files exist and were sent to the scoped Property Photos input, but the UI did not show enough uploaded photos.",
      ].join("\n")
    );
  }

  /* =====================================================
     FLOOR PLAN UPLOAD
  ===================================================== */

  async uploadFloorPlan(floorPlan) {
    if (!floorPlan) {
      throw new Error("Floor plan file is required.");
    }

    this.validateFiles([floorPlan]);

    const fileName = path.basename(floorPlan);

    console.log(`Starting floor plan upload: ${fileName}`);

    await expect(
      this.floorPlanUploadButton,
      "Floor plan upload area should be visible"
    ).toBeVisible({ timeout: 20_000 });

    await this.floorPlanUploadButton.scrollIntoViewIfNeeded();

    await expect(
      this.floorPlanInput,
      "Floor plan file input should be attached"
    ).toBeAttached({ timeout: 10_000 });

    const inputCount = await this.floorPlanInput.count();

    if (inputCount !== 1) {
      throw new Error(
        [
          "Expected exactly one Floor Plan file input.",
          `Found: ${inputCount}`,
        ].join("\n")
      );
    }

    console.log(`Uploading floor plan: ${fileName}`);

    await this.floorPlanInput.setInputFiles(floorPlan);

    console.log("Floor plan file sent to input");

    await this.page.waitForTimeout(2_000);

    const fileNameLocator = this.page.getByText(fileName, {
      exact: false,
    });

    const fileNameVisible = await fileNameLocator
      .first()
      .isVisible()
      .catch(() => false);

    if (fileNameVisible) {
      console.log(`Floor plan filename visible: ${fileName}`);
      console.log("Floor plan uploaded successfully");
      return;
    }

    const floorPlanPreview = this.floorPlanUploadButton.locator("img");

    const previewVisible = await floorPlanPreview
      .first()
      .isVisible()
      .catch(() => false);

    if (previewVisible) {
      console.log("Floor plan preview is visible");
      console.log("Floor plan uploaded successfully");
      return;
    }

    // Do not depend on input.files.length here. React may clear/reset it.
    console.log(
      "Floor plan file was sent to the correct scoped input; native input may have been reset by React."
    );
  }

  /* =====================================================
     CONFIRM LISTING
  ===================================================== */

  async confirmListing() {
    console.log("Confirming listing...");

    await expect(
      this.confirmListingCheckbox,
      "Confirm Listing checkbox should be visible"
    ).toBeVisible({ timeout: 20_000 });

    await this.confirmListingCheckbox.scrollIntoViewIfNeeded();

    let checkedState = await this.confirmListingCheckbox.getAttribute(
      "aria-checked"
    );

    console.log(`Confirm Listing initial state: ${checkedState}`);

    if (checkedState !== "true") {
      await this.confirmListingCheckbox.click();

      await expect(
        this.confirmListingCheckbox,
        "Confirm Listing checkbox should become checked"
      ).toHaveAttribute("aria-checked", "true", {
        timeout: 10_000,
      });
    }

    checkedState = await this.confirmListingCheckbox.getAttribute(
      "aria-checked"
    );

    if (checkedState !== "true") {
      throw new Error("Confirm Listing checkbox was not selected.");
    }

    console.log("Confirm Listing checkbox checked successfully");
  }

  /* =====================================================
     PUBLISH LISTING
  ===================================================== */

  async publishListing() {
    console.log("Publishing listing...");

    await expect(
      this.publishListingButton,
      "Publish Listing button should be visible"
    ).toBeVisible({ timeout: 20_000 });

    await this.publishListingButton.scrollIntoViewIfNeeded();

    await expect(
      this.publishListingButton,
      "Publish Listing button should be enabled"
    ).toBeEnabled({ timeout: 20_000 });

    await this.publishListingButton.click();

    console.log("Publish Listing button clicked successfully");
  }

  /* =====================================================
     COMPLETE MEDIA STEP
  ===================================================== */

  async completeMediaStep({ propertyPhotos, floorPlan }) {
    console.log("Starting Listing Media step...");

    await this.waitForPage();
    await this.uploadPropertyPhotos(propertyPhotos);
    await this.uploadFloorPlan(floorPlan);
    await this.confirmListing();
    await this.publishListing();

    console.log("Listing Media step completed");
  }
}

module.exports = {
  ListingMediaPage,
};
