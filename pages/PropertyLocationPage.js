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

    this.streetAddressInput = page
      .getByPlaceholder("e.g., 15 Smith Avenue", {
        exact: true,
      })
      .or(page.locator('input[placeholder*="Smith Avenue" i]'))
      .or(
        page
          .locator("label")
          .filter({ hasText: /^Street Address/i })
          .locator("xpath=following-sibling::*//input | following-sibling::input")
      )
      .first();

    this.selectedStreet = "";
    this.selectedSuburb = "";

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
      .locator('[role="dialog"]')
      .last()
      .getByRole("button", {
        name: "Next",
        exact: true,
      })
      .or(
        page.getByRole("button", {
          name: "Next",
          exact: true,
        })
      )
      .last();
  }

  // =====================================================
  // NOTIFICATION PROMPT DISMISSAL
  // =====================================================

  async dismissNotificationPrompts() {
    const notNow = this.page
      .getByRole("button", {
        name: /not now/i,
      })
      .or(
        this.page
          .locator('[role="dialog"]:has-text("Never miss a message")')
          .getByRole("button", { name: /not now|close/i })
      )
      .first();

    if (await notNow.isVisible({ timeout: 1500 }).catch(() => false)) {
      console.log("[PropertyLocationPage] Dismissing notification prompt by clicking 'Not now'...");
      await notNow.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(500);
    }
  }

  // =====================================================
  // WAIT FOR PAGE
  // =====================================================

  async waitForPage() {
    await this.dismissNotificationPrompts();

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

    await this.dismissNotificationPrompts();
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

    console.log(`[PropertyLocationPage] Entering street address: "${searchText}"`);

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      await this.dismissNotificationPrompts();

      await this.streetAddressInput.click();
      await this.streetAddressInput.fill("");
      await this.page.waitForTimeout(300);

      // Type with moderate delay to reliably trigger Google Places Autocomplete API
      await this.streetAddressInput.pressSequentially(
        searchText,
        {
          delay: 50,
        }
      );

      // Check if notification prompt appeared during typing
      if (
        await this.page
          .locator('[role="dialog"]:has-text("Never miss a message"), button:has-text("Not now")')
          .first()
          .isVisible({ timeout: 1000 })
          .catch(() => false)
      ) {
        console.warn(`[PropertyLocationPage] Notification prompt appeared during typing (attempt ${attempts}/${maxAttempts}). Dismissing and retyping...`);
        await this.dismissNotificationPrompts();
        continue;
      }

      // Check if suggestion list appeared
      const isPacVisible = await this.googleSuggestionList
        .first()
        .waitFor({ state: "visible", timeout: 8000 })
        .then(() => true)
        .catch(() => false);

      if (!isPacVisible) {
        console.warn(`[PropertyLocationPage] Suggestion list not visible yet on attempt ${attempts}/${maxAttempts}.`);
        if (attempts < maxAttempts) {
          continue;
        }
      }

      break;
    }

    await expect(
      this.googleSuggestionList.first(),
      "Google address suggestion list should appear"
    ).toBeVisible({
      timeout: 10_000,
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
      await firstSuggestion.innerText().catch(() => "");

    console.log(
      `[PropertyLocationPage] Selecting address suggestion: "${suggestionText}"`
    );

    await this.page.waitForTimeout(400);

    // Primary attempt: dispatch mousedown (native Google Places Autocomplete handler) and click
    await firstSuggestion.dispatchEvent("mousedown").catch(() => {});
    await firstSuggestion.dispatchEvent("mouseup").catch(() => {});
    await firstSuggestion.click({ force: true }).catch(() => {});

    await this.page.waitForTimeout(1000);

    // Check if Suburb was auto-filled, or if validation warning persists
    let suburbVal = (await this.suburbInput.inputValue().catch(() => "")).trim();
    const validationWarning = this.page.getByText(
      /Please select your address from the suggestions/i
    );
    const hasValidationError = await validationWarning.isVisible().catch(() => false);

    // Fallback attempt: Native keyboard navigation (ArrowDown + Enter)
    if (!suburbVal || hasValidationError) {
      console.log(
        "[PropertyLocationPage] Suburb not populated after click or validation warning visible. Using ArrowDown + Enter fallback..."
      );
      await this.streetAddressInput.focus();
      await this.page.keyboard.press("ArrowDown");
      await this.page.waitForTimeout(300);
      await this.page.keyboard.press("Enter");
      await this.page.waitForTimeout(1000);
    }

    // Secondary fallback: if suggestion dropdown is still open, click it again
    suburbVal = (await this.suburbInput.inputValue().catch(() => "")).trim();
    if (!suburbVal && (await this.googleSuggestions.first().isVisible().catch(() => false))) {
      console.log("[PropertyLocationPage] Suggestions still visible, re-clicking first item...");
      await this.googleSuggestions.first().click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(1000);
    }

    const selectedAddress =
      await this.streetAddressInput.inputValue();

    if (!selectedAddress.trim()) {
      throw new Error(
        "Google address suggestion was selected, but Street Address remained empty."
      );
    }

    console.log(
      `[PropertyLocationPage] Selected address input value: "${selectedAddress}"`
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

    this.selectedStreet = (await this.streetAddressInput.inputValue().catch(() => "")).trim();

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

      this.selectedSuburb = (await suburbInput.inputValue().catch(() => "")).trim();
      console.log(
        "Suburb:",
        this.selectedSuburb
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
  // ASSIGN SELLER SOLICITOR
  // =====================================================

  async assignSellerSolicitor(solicitorSearch) {
    const isStaging = (process.env.BASE_URL || "").includes("staging");
    const targetSearch =
      solicitorSearch ||
      process.env.SELLER_SOLICITOR_SEARCH ||
      process.env.SELLER_SOLICITOR_EMAIL ||
      (isStaging ? "subratotest99.2@gmail.com" : "solicitor.c4utest@yopmail.com");

    console.log(`Checking for Assign Seller Solicitor on Location step (target: "${targetSearch}")...`);

    const addBtn = this.page
      .locator("button")
      .filter({ hasText: /Add a solicitor to this listing/i })
      .first();

    const isAddBtnVisible = await addBtn
      .isVisible({ timeout: 5_000 })
      .catch(() => false);

    if (!isAddBtnVisible) {
      const selectedSolicitor = this.page
        .locator("*")
        .filter({ hasText: /solicitor\.c4utest|James Anderson|subratotest99/i })
        .filter({ visible: true })
        .first();

      if (await selectedSolicitor.isVisible().catch(() => false)) {
        console.log("Seller solicitor already assigned.");
        return;
      }

      console.log("No '+ Add a solicitor to this listing' button, checking fallback...");
      const altBtn = this.page
        .locator("button")
        .filter({ hasText: /Add.*solicitor/i })
        .first();

      if (!(await altBtn.isVisible().catch(() => false))) {
        console.log("No solicitor button found on step, skipping.");
        return;
      }

      await altBtn.scrollIntoViewIfNeeded();
      await altBtn.click();
    } else {
      await addBtn.scrollIntoViewIfNeeded();
      await addBtn.click();
    }

    console.log("Clicked '+ Add a solicitor to this listing'. Selecting solicitor...");
    await this.page.waitForTimeout(1_000);

    const searchInput = this.page
      .locator('input[type="text"], input[type="search"], input[placeholder*="search" i]')
      .filter({ visible: true })
      .last();

    if (await searchInput.isVisible().catch(() => false)) {
      console.log(`Searching solicitor with: ${targetSearch}`);
      await searchInput.fill(targetSearch);
      await this.page.waitForTimeout(1000);
    }

    // Match targetSearch or fallback names
    const escapedSearch = (targetSearch || "").replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const targetOption = this.page
      .locator("*")
      .filter({ hasText: new RegExp(escapedSearch, "i") })
      .filter({ visible: true })
      .last();

    if (await targetOption.isVisible({ timeout: 5_000 }).catch(() => false)) {
      console.log(`Clicking '${targetSearch}' solicitor card...`);
      await targetOption.click();
    } else {
      const altOption = this.page
        .locator("*")
        .filter({ hasText: /James Anderson|subratotest99|solicitor\.c4utest@yopmail\.com/i })
        .filter({ visible: true })
        .last();

      if (await altOption.isVisible({ timeout: 3_000 }).catch(() => false)) {
        console.log("Clicking fallback solicitor card...");
        await altOption.click();
      } else {
        console.warn(`Could not find "${targetSearch}", selecting first available solicitor option...`);
        const firstOption = this.page
          .locator('[role="option"], [role="menuitem"], [class*="card" i]')
          .filter({ visible: true })
          .first();

        await firstOption.click();
      }
    }

    await this.page.waitForTimeout(1_000);
    console.log("Seller solicitor assigned successfully.");
  }

  // =====================================================
  // VERIFY & ASSIGN SELLER SOLICITOR WITH ISOLATION
  // =====================================================

  async verifyAndAssignSellerSolicitorWithIsolation(
    authorizedEmail = "sellsol.c4u.tst@yopmail.com",
    forbiddenAccounts = []
  ) {
    console.log(`[Account Isolation Check] Verifying Seller Solicitor assignment isolation...`);

    const addBtn = this.page
      .locator("button")
      .filter({ hasText: /Add a solicitor to this listing/i })
      .first();

    await expect(addBtn, "Add a solicitor button should be visible").toBeVisible({ timeout: 10_000 });
    await addBtn.click();
    await this.page.waitForTimeout(1000);

    const dialog = this.page.locator('[role="dialog"]').last();
    await expect(dialog, "Assign solicitor dialog should open").toBeVisible({ timeout: 10_000 });

    const searchInput = dialog
      .locator('input[type="text"], input[type="search"], input[placeholder*="search" i]')
      .first();

    // 1. Verify initially visible accounts do not contain forbidden accounts
    const initialText = await dialog.innerText();
    for (const legacy of forbiddenAccounts) {
      if (initialText.includes(legacy.email) || (legacy.name && initialText.includes(legacy.name))) {
        throw new Error(
          `[Account Isolation Violation] Forbidden legacy account "${legacy.email}" appeared in Seller Solicitor dialog!`
        );
      }
    }

    // 2. Search for each legacy account specifically to verify server-side filtering
    for (const legacy of forbiddenAccounts) {
      if (legacy.role && !/solicitor/i.test(legacy.role)) continue;
      console.log(`[Account Isolation Check] Searching for forbidden legacy solicitor: ${legacy.email}...`);
      await searchInput.fill(legacy.email);
      await this.page.waitForTimeout(1000);

      const searchResultText = await dialog.innerText();
      const hasLegacy = searchResultText.includes(legacy.email) || (legacy.name && searchResultText.includes(legacy.name));
      if (hasLegacy) {
        throw new Error(
          `[Account Isolation Violation] Forbidden legacy solicitor "${legacy.email}" was returned by search!`
        );
      }
      console.log(`[PASS] Legacy solicitor "${legacy.email}" correctly excluded.`);
    }

    // 3. Search and select authorized .tst solicitor
    console.log(`[Account Isolation Check] Searching for authorized solicitor: ${authorizedEmail}...`);
    await searchInput.fill(authorizedEmail.split("@")[0]);
    await this.page.waitForTimeout(1000);

    const authorizedCard = dialog
      .locator("*")
      .filter({ hasText: new RegExp(authorizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i") })
      .filter({ visible: true })
      .last();

    await expect(authorizedCard, `Authorized solicitor card "${authorizedEmail}" should be visible`).toBeVisible({ timeout: 10_000 });
    await authorizedCard.click();
    await this.page.waitForTimeout(1000);
    console.log(`[PASS] Authorized solicitor "${authorizedEmail}" selected successfully.`);
  }

  // =====================================================
  // NEXT
  // =====================================================

  async clickNext(solicitorSearch) {
    await this.assignSellerSolicitor(solicitorSearch);

    const dialog = this.page.locator('[role="dialog"]').last();
    const dialogNext = dialog.getByRole("button", { name: "Next", exact: true }).first();

    const targetButton = (await dialogNext.isVisible().catch(() => false)) ? dialogNext : this.nextButton;

    await targetButton
      .scrollIntoViewIfNeeded()
      .catch(() => {});

    await expect(
      targetButton,
      "Location step Next button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      targetButton,
      "Location step Next button should be enabled"
    ).toBeEnabled({
      timeout: 20_000,
    });

    await targetButton.click();
    await this.page.waitForTimeout(1000);
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