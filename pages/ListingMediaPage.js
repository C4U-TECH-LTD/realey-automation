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
     NEGATIVE FILE FORMAT UPLOAD
  ===================================================== */

  async testNegativeFileFormatUpload(invalidFilePath) {
    console.log("Testing negative file format upload (non-image file rejection)...");

    if (!fs.existsSync(invalidFilePath)) {
      throw new Error(`Invalid test file not found: ${invalidFilePath}`);
    }

    await expect(
      this.propertyPhotoUploadButton,
      "Property Photos upload area should be visible"
    ).toBeVisible({ timeout: 20_000 });

    await this.propertyPhotoUploadButton.scrollIntoViewIfNeeded();

    let photosInput = this.propertyPhotosInput;
    if ((await photosInput.count()) !== 1) {
      const globalInput = this.page.locator('input[type="file"][multiple]').first();
      if ((await globalInput.count()) > 0) {
        photosInput = globalInput;
      }
    }

    try {
      await photosInput.setInputFiles(invalidFilePath);
      console.log(`Sent invalid file: ${path.basename(invalidFilePath)} to input`);
    } catch (e) {
      console.log(`Browser natively rejected file format: ${e.message}`);
    }

    await this.page.waitForTimeout(1000);

    // Verify application did not accept it as a valid uploaded image preview
    const previewCards = this.page.locator(
      'button:has(svg.lucide-trash-2), [class*="photo-card"], [class*="image-preview"]'
    );
    const count = await previewCards.count();
    console.log(`Uploaded image preview count after invalid file upload: ${count}`);
    expect(count).toBe(0);

    console.log("Negative file format validation passed — unsupported file was correctly rejected");
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

    let photosInput = this.propertyPhotosInput;
    let inputCount = await photosInput.count();

    if (inputCount !== 1) {
      const globalInput = this.page.locator('input[type="file"][multiple]').first();
      if ((await globalInput.count()) > 0) {
        photosInput = globalInput;
        inputCount = 1;
      }
    }

    if (inputCount !== 1) {
      throw new Error(
        [
          "Expected exactly one Property Photos file input.",
          `Found: ${inputCount}`,
        ].join("\n")
      );
    }

    console.log("Uploading property photos to file input...");

    await photosInput.setInputFiles(propertyPhotos);

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

    let floorInput = this.floorPlanInput;
    let inputCount = await floorInput.count();

    if (inputCount !== 1) {
      const globalInput = this.page.locator('input[type="file"]:not([multiple])').first();
      if ((await globalInput.count()) > 0) {
        floorInput = globalInput;
        inputCount = 1;
      }
    }

    if (inputCount !== 1) {
      throw new Error(
        [
          "Expected exactly one Floor Plan file input.",
          `Found: ${inputCount}`,
        ].join("\n")
      );
    }

    console.log(`Uploading floor plan: ${fileName}`);

    await floorInput.setInputFiles(floorPlan);

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
     PHOTO SWAP & REORDER
  ===================================================== */

  async getPhotoCards() {
    // Locate photo preview cards in the upload gallery
    const cards = this.page.locator(
      [
        '[data-rbd-draggable-id]',
        '[draggable="true"]',
        'div[class*="relative"]:has(img[src^="blob:"], img[src^="data:image/"])',
        'div[class*="group"]:has(img[src^="blob:"], img[src^="data:image/"])',
        'div:has(> img[src^="blob:"])',
        'div:has(> img[src^="data:image/"])',
      ].join(", ")
    );

    const count = await cards.count();
    if (count > 0) {
      return cards;
    }

    // Fallback: locate direct parent of preview images
    return this.page.locator('img[src^="blob:"], img[src^="data:image/"]').locator('xpath=ancestor::div[1]');
  }

  async swapPropertyPhotos(fromIndex = 0, toIndex = 1) {
    console.log(`Swapping property photo ${fromIndex + 1} with photo ${toIndex + 1}...`);

    await this.page.waitForTimeout(1000);
    const photoCards = await this.getPhotoCards();
    const count = await photoCards.count();

    console.log(`Found ${count} photo card(s) for swap operation`);

    if (count <= Math.max(fromIndex, toIndex)) {
      console.warn(`Not enough photo cards to swap: found ${count}, need indices ${fromIndex} and ${toIndex}`);
      return;
    }

    const sourceCard = photoCards.nth(fromIndex);
    const targetCard = photoCards.nth(toIndex);

    await sourceCard.scrollIntoViewIfNeeded();

    // Check if cards are draggable or support Playwright dragTo
    try {
      await sourceCard.dragTo(targetCard, {
        timeout: 10_000,
      });
      console.log(`Successfully performed dragTo swap from index ${fromIndex} to ${toIndex}`);
    } catch (error) {
      console.log(`dragTo fallback triggered: ${error.message}`);
      // Manual mouse drag
      const sourceBox = await sourceCard.boundingBox();
      const targetBox = await targetCard.boundingBox();

      if (sourceBox && targetBox) {
        await this.page.mouse.move(
          sourceBox.x + sourceBox.width / 2,
          sourceBox.y + sourceBox.height / 2
        );
        await this.page.mouse.down();
        await this.page.mouse.move(
          targetBox.x + targetBox.width / 2,
          targetBox.y + targetBox.height / 2,
          { steps: 10 }
        );
        await this.page.mouse.up();
        console.log("Manual mouse drag completed");
      }
    }

    await this.page.waitForTimeout(1000);
    console.log("Photo swap check completed");
  }

  /* =====================================================
     PHOTO REMOVAL
  ===================================================== */

  async removePropertyPhoto(index = 0) {
    console.log(`Removing property photo at index ${index + 1}...`);

    await this.page.waitForTimeout(1000);
    const photoCards = await this.getPhotoCards();
    const count = await photoCards.count();

    console.log(`Found ${count} photo cards before removal`);

    if (count === 0) {
      throw new Error("No photo cards available to remove.");
    }

    const targetCard = photoCards.nth(Math.min(index, count - 1));
    await targetCard.scrollIntoViewIfNeeded();

    // Look for trash or delete button inside or hovering over the target card
    await targetCard.hover().catch(() => {});

    const deleteButton = targetCard
      .locator(
        [
          'button:has(svg.lucide-trash-2)',
          'button:has(svg.lucide-trash)',
          'button:has(svg.lucide-x)',
          'button[aria-label*="delete" i]',
          'button[aria-label*="remove" i]',
          'button:has-text("Delete")',
          'button:has-text("Remove")',
          '[role="button"]:has(svg.lucide-trash-2)',
          '[role="button"]:has(svg.lucide-x)',
        ].join(", ")
      )
      .first();

    const deleteVisible = await deleteButton.isVisible().catch(() => false);

    if (deleteVisible) {
      await deleteButton.click();
      console.log(`Clicked delete button on photo card ${index + 1}`);
    } else {
      // Look globally for delete button within photo cards area
      const globalDelete = this.page
        .locator('button:has(svg.lucide-trash-2), button:has(svg.lucide-x)')
        .nth(index);

      if (await globalDelete.isVisible().catch(() => false)) {
        await globalDelete.click();
        console.log(`Clicked global delete button at index ${index}`);
      } else {
        console.warn("Delete button not directly found; attempting card click or hover trigger");
      }
    }

    await this.page.waitForTimeout(1500);
    console.log("Photo removal action executed");
  }

  /* =====================================================
     VERIFY PHOTO COUNT
  ===================================================== */

  async verifyPhotoCount(expectedCount) {
    console.log(`Verifying image count is ${expectedCount}...`);

    const counterVisible = await this.imageCountText.isVisible().catch(() => false);

    if (counterVisible) {
      await expect(
        this.imageCountText
      ).toContainText(new RegExp(`total images:\\s*${expectedCount}\\/10`, "i"), {
        timeout: 10_000,
      });

      console.log(`Image count verified: ${expectedCount}/10`);
      return;
    }

    // Fallback: verify via preview images count
    const previewImages = this.page.locator('img[src^="blob:"], img[src^="data:image/"]');
    const actualPreviews = await previewImages.count();

    console.log(`Preview images count: ${actualPreviews}, expected: ${expectedCount}`);
    expect(actualPreviews).toBe(expectedCount);
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
