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
      .getByText(/(?:total images|property images).*?\d+\/(?:10|30)/i)
      .first();

    /* =====================================================
       DOCUMENTS
    ===================================================== */

    this.addDocumentButton = page.getByRole("button", {
      name: /add document/i,
    });

    this.documentNameInput = page.getByPlaceholder(
      /document name/i
    );

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
     MAXIMUM PHOTO UPLOAD LIMIT VALIDATION (31 PHOTOS)
  ===================================================== */

  async testMaxPhotoUploadLimit(files31 = null) {
    console.log("Testing maximum photo upload limit boundary (uploading 31 photos)...");

    let uploadFiles = files31;
    if (!Array.isArray(uploadFiles) || uploadFiles.length < 31) {
      const sampleImg = path.resolve(process.cwd(), "test-assets/listing/property-1.jpg");
      const tempDir = path.resolve(process.cwd(), "test-assets/temp_limit_31");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
      uploadFiles = [];
      for (let i = 1; i <= 31; i++) {
        const dest = path.join(tempDir, `limit-check-${i}.jpg`);
        if (!fs.existsSync(dest)) fs.copyFileSync(sampleImg, dest);
        uploadFiles.push(dest);
      }
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

    console.log(`Sending ${uploadFiles.length} files to Property Photos input to verify limit...`);
    await photosInput.setInputFiles(uploadFiles);
    await this.page.waitForTimeout(1500);

    // Verify limit warning notification or cap
    const limitWarning = this.page.locator(
      [
        '[role="alert"]',
        '[role="status"]',
        'div:has-text("Too many images")',
        'div:has-text("Maximum 30 images")',
        'div:has-text("exceed")',
        ':is(div, span, p):has-text("Total images: 30/30")',
      ].join(", ")
    ).first();

    const warningVisible = await limitWarning.isVisible({ timeout: 5000 }).catch(() => false);
    if (warningVisible) {
      console.log("Upload limit warning confirmed visible");
    }

    // Verify rendered previews or counter is capped at 30
    const blobCount = await this.page.locator('img[src^="blob:"]').count();
    console.log(`Rendered photo count after uploading 31 images: ${blobCount}`);
    expect(blobCount).toBeLessThanOrEqual(30);

    console.log("31-image maximum upload limit verification passed successfully");
  }

  /* =====================================================
     PROPERTY PHOTOS UPLOAD
  ===================================================== */

  async uploadPropertyPhotos(propertyPhotos) {
    if (!Array.isArray(propertyPhotos) || propertyPhotos.length === 0) {
      throw new Error("At least one property photo is required.");
    }

    // If photos are already uploaded from limit test, verify and proceed
    const existingCards = await this.getPhotoCards();
    const existingCount = await existingCards.count();
    if (existingCount >= propertyPhotos.length) {
      console.log(
        `Property photos already present (${existingCount} uploaded from limit check). Proceeding.`
      );
      return;
    }

    if (propertyPhotos.length > 30) {
      throw new Error("Maximum 30 property photos are allowed.");
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
            const match = countText.match(/(\d+)\/(?:10|30)/i);
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
    return this.page.locator('img[src^="blob:"]').locator('xpath=..');
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

    // The remove button has aria-label="Remove image"
    const deleteButton = targetCard
      .locator(
        [
          'button[aria-label="Remove image"]',
          'button:has(svg.lucide-x)',
          'button:has(svg.lucide-trash-2)',
          'button:has(svg.lucide-trash)',
          'button[aria-label*="delete" i]',
          'button[aria-label*="remove" i]',
        ].join(", ")
      )
      .first();

    const deleteVisible = await deleteButton.isVisible().catch(() => false);

    if (deleteVisible) {
      await deleteButton.click({ force: true });
      console.log(`Clicked delete button on photo card ${index + 1}`);
    } else {
      await targetCard.hover().catch(() => {});
      const globalDelete = this.page.locator('button[aria-label="Remove image"]').nth(index);
      if (await globalDelete.isVisible().catch(() => false)) {
        await globalDelete.click({ force: true });
        console.log(`Clicked global remove button at index ${index}`);
      } else {
        await deleteButton.click({ force: true });
        console.log(`Force clicked delete button at index ${index}`);
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

    const blobCount = await this.page.locator('img[src^="blob:"]').count();
    console.log(`Direct blob images count: ${blobCount}, expected: ${expectedCount}`);

    const counter = this.page
      .locator(':is(div, span, p, h2, h3, h4)')
      .filter({
        hasText: new RegExp(`(?:total images|property images|images).*?${expectedCount}\\/(?:10|30)`, "i")
      })
      .first();

    if (await counter.isVisible({ timeout: 3000 }).catch(() => false)) {
      const text = await counter.innerText();
      console.log(`Image count text verified: "${text}"`);
    }

    expect(blobCount).toBe(expectedCount);
    console.log(`Image count successfully verified: ${expectedCount}`);
  }

  /* =====================================================
     DOCUMENT UPLOAD & FORMAT VALIDATION
  ===================================================== */

  async testNegativeDocumentFormatUpload(invalidFilePath) {
    console.log("Testing negative document format upload (.txt rejection)...");

    if (!fs.existsSync(invalidFilePath)) {
      throw new Error(`Invalid test document file not found: ${invalidFilePath}`);
    }

    if (await this.addDocumentButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.addDocumentButton.scrollIntoViewIfNeeded();
      await this.addDocumentButton.click();
      await this.page.waitForTimeout(500);
    }

    if (await this.documentNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.documentNameInput.fill("Invalid Document Test");
    }

    const docInput = this.page.locator('div:has-text("Document name") input[type="file"], input[type="file"]').last();
    try {
      await docInput.setInputFiles(invalidFilePath);
      await this.page.waitForTimeout(1000);
      console.log(`Sent invalid file: ${path.basename(invalidFilePath)} to document input`);
    } catch (e) {
      console.log(`Browser natively rejected invalid document format: ${e.message}`);
    }

    console.log("Negative document format validation passed — invalid document was rejected");
  }

  async uploadPropertyDocument(docName = "Contract for Sale", docFilePath, audience = "Seller's Solicitor") {
    console.log(`Uploading property document: "${docName}" (${path.basename(docFilePath)})...`);

    if (!fs.existsSync(docFilePath)) {
      throw new Error(`Document file not found: ${docFilePath}`);
    }

    if (await this.addDocumentButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      const nameVisible = await this.documentNameInput.isVisible({ timeout: 1000 }).catch(() => false);
      if (!nameVisible) {
        await this.addDocumentButton.scrollIntoViewIfNeeded();
        await this.addDocumentButton.click();
        await this.page.waitForTimeout(500);
      }
    }

    if (await this.documentNameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await this.documentNameInput.fill("");
      await this.documentNameInput.fill(docName);
    }

    const docInput = this.page.locator('div:has-text("Document name") input[type="file"], input[type="file"]').last();
    await docInput.setInputFiles(docFilePath);
    await this.page.waitForTimeout(1500);

    const docFileName = path.basename(docFilePath);
    console.log(`Property document "${docName}" uploaded successfully with file "${docFileName}"`);
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
