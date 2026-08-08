const { expect } = require("@playwright/test");

class ListingsPage {
  /**
   * @param {import("@playwright/test").Page} page
   */
  constructor(page) {
    this.page = page;

    // =====================================================
    // LISTINGS PAGE
    // =====================================================

    this.listingsMenuButton = page.getByRole("button", {
      name: "Listings",
      exact: true,
    });

    this.listingsPageHeading = page.getByRole("heading", {
      name: "Listings",
      exact: true,
    });

    this.searchInput = page.getByPlaceholder(
      "Search by address, title...",
      {
        exact: true,
      }
    );

    // Search icon
    this.searchButton = page
      .locator("button")
      .filter({
        has: page.locator("svg.lucide-search"),
      })
      .first();

    // =====================================================
    // FILTER
    // =====================================================

    /*
     * Actual live Filter SVG does NOT have lucide-funnel class.
     * Locate using its unique path.
     */
    this.filterButton = page
      .locator("button")
      .filter({
        has: page.locator(
          'svg path[d^="M10 20a1 1 0 0 0"]'
        ),
      })
      .first();

    this.filterOptionsContainer = page
      .locator("div.flex.flex-wrap.gap-2")
      .filter({
        hasText: "Settlement Pending",
      })
      .first();

    // =====================================================
    // GRID / LIST VIEW
    // =====================================================

    this.gridViewButton = page
      .locator("button")
      .filter({
        has: page.locator(
          "svg.lucide-grid3x3"
        ),
      })
      .first();

    this.listViewButton = page
      .locator("button")
      .filter({
        has: page.locator(
          "svg.lucide-list"
        ),
      })
      .last();

    // =====================================================
    // LIST VIEW
    // =====================================================

    this.table = page.locator("table").first();

    this.listingRows = this.table.locator(
      "tbody tr"
    );

    this.addressHeader =
      this.table.getByRole("columnheader", {
        name: "Address",
        exact: true,
      });

    // =====================================================
    // GRID VIEW
    // =====================================================

    this.gridContainer = page.locator(
      "div.grid.grid-cols-1.lg\\:grid-cols-2"
    );

    // =====================================================
    // EDIT FLOW
    // =====================================================

    this.nextButton = page
      .getByRole("button", {
        name: "Next",
        exact: true,
      })
      .last();

    this.propertyTypeDropdown = page
      .getByRole("combobox")
      .first();

    this.landSizeInput =
      page.getByPlaceholder("e.g., 650", {
        exact: true,
      });

    this.yearBuiltInput =
      page.getByPlaceholder("e.g., 1985", {
        exact: true,
      });

    this.confirmListingCheckbox =
      page.locator(
        'button[role="checkbox"]#confirmListing'
      );

    this.publishListingButton =
      page.getByRole("button", {
        name: "Publish Listing",
        exact: true,
      });

    // =====================================================
    // EXPANDED DETAILS
    // =====================================================

    this.propertyDetailsHeading =
      page.getByRole("heading", {
        name: "Property Details",
        exact: true,
      });

    this.listingDetailsHeading =
      page.getByRole("heading", {
        name: "Listing Details",
        exact: true,
      });

    this.additionalInfoHeading =
      page.getByRole("heading", {
        name: "Additional Info",
        exact: true,
      });

    this.propertyHeadlineHeading =
      page.getByRole("heading", {
        name: "Property Headline",
        exact: true,
      });

    this.descriptionHeading =
      page.getByRole("heading", {
        name: "Description",
        exact: true,
      });

    this.featuresHeading =
      page.getByRole("heading", {
        name: "Features",
        exact: true,
      });
  }

  // =====================================================
  // OPEN LISTINGS
  // =====================================================

  async open() {
    await expect(
      this.listingsMenuButton,
      "Listings menu button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.listingsMenuButton
    ).toBeEnabled();

    await this.listingsMenuButton.click();

    await this.waitForPage();
  }

  async waitForPage() {
    await this.page.waitForLoadState(
      "domcontentloaded"
    );

    await expect(
      this.page,
      "Listings page URL should open"
    ).toHaveURL(
      /dashboard\/agent\?tab=listings/i,
      {
        timeout: 30_000,
      }
    );

    await expect(
      this.listingsPageHeading,
      "Listings heading should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.searchInput,
      "Search input should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });
  }

  // =====================================================
  // SEARCH
  // =====================================================

  async searchListing(searchText) {
    if (!searchText) {
      throw new Error(
        "Listing search text is required."
      );
    }

    await expect(
      this.searchInput
    ).toBeVisible();

    await this.searchInput.fill("");

    await this.searchInput.fill(
      searchText
    );

    await expect(
      this.searchInput
    ).toHaveValue(searchText);

    const searchButtonVisible =
      await this.searchButton
        .isVisible()
        .catch(() => false);

    if (searchButtonVisible) {
      await this.searchButton.click();
    } else {
      await this.searchInput.press(
        "Enter"
      );
    }

    await this.page.waitForTimeout(
      1_000
    );
  }

  async verifyListingVisible(
    listingName
  ) {
    await expect(
      this.page
        .getByText(listingName, {
          exact: true,
        })
        .first(),
      `Listing "${listingName}" should be visible`
    ).toBeVisible({
      timeout: 20_000,
    });
  }

  async clearSearch() {
    await this.searchInput.fill("");

    await this.searchInput
      .press("Enter")
      .catch(() => {});

    await this.page.waitForTimeout(
      700
    );
  }

  // =====================================================
  // FILTER
  // =====================================================

  async openStatusFilter() {
    await expect(
      this.filterButton,
      "Filter button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await this.filterButton.click();

    await expect(
      this.filterOptionsContainer,
      "Filter options should be displayed"
    ).toBeVisible({
      timeout: 10_000,
    });
  }

  async verifyStatusFilterOptions(
    expectedOptions
  ) {
    for (
      const option of expectedOptions
    ) {
      await expect(
        this.filterOptionsContainer.getByText(
          option,
          {
            exact: true,
          }
        ),
        `Filter option "${option}" should be visible`
      ).toBeVisible();
    }
  }

  async selectStatusFilter(
    status
  ) {
    await this.openStatusFilter();

    const option =
      this.filterOptionsContainer.getByText(
        status,
        {
          exact: true,
        }
      );

    await expect(
      option,
      `Status "${status}" should be visible`
    ).toBeVisible();

    await option.click();

    await this.page.waitForTimeout(
      1_000
    );
  }

  // =====================================================
  // LIST VIEW
  // =====================================================

  async switchToListView() {
    const tableAlreadyVisible =
      await this.table
        .isVisible()
        .catch(() => false);

    if (!tableAlreadyVisible) {
      await expect(
        this.listViewButton,
        "List View button should be visible"
      ).toBeVisible({
        timeout: 20_000,
      });

      await this.listViewButton.click();
    }

    await expect(
      this.table,
      "Listings table should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.addressHeader
    ).toBeVisible();
  }

  // =====================================================
  // GRID VIEW
  // =====================================================

  async switchToGridView() {
    await expect(
      this.gridViewButton,
      "Grid View button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await this.gridViewButton.click();

    await expect(
      this.gridContainer,
      "Listings Grid View should be displayed"
    ).toBeVisible({
      timeout: 20_000,
    });
  }

  // =====================================================
  // FIND LISTING BY NAME
  // =====================================================

  getListingRowByName(
    listingName
  ) {
    return this.page
      .locator("table tbody tr")
      .filter({
        hasText: listingName,
      })
      .first();
  }

  async verifyListingRowExists(
    listingName
  ) {
    await this.switchToListView();

    const row =
      this.getListingRowByName(
        listingName
      );

    await expect(
      row,
      `Listing row "${listingName}" should exist`
    ).toBeVisible({
      timeout: 20_000,
    });

    return row;
  }

  // =====================================================
  // 3 DOT MENU
  // =====================================================

  async openListingActions(
    listingName
  ) {
    const row =
      await this.verifyListingRowExists(
        listingName
      );

    const menuButton = row
      .locator(
        'button[aria-haspopup="menu"]'
      )
      .first();

    await expect(
      menuButton,
      `3-dot menu for "${listingName}" should be visible`
    ).toBeVisible();

    await menuButton.click();
  }

  // =====================================================
  // EDIT LISTING
  // =====================================================

  async openEditListing(
    listingName
  ) {
    await this.openListingActions(
      listingName
    );

    const editOption =
      this.page.getByRole(
        "menuitem",
        {
          name: "Edit",
          exact: true,
        }
      );

    await expect(
      editOption,
      "Edit menu item should be visible"
    ).toBeVisible({
      timeout: 10_000,
    });

    await editOption.click();

    /*
     * Do NOT check "List Your Property".
     * Your edit screen does not use that heading.
     *
     * Verify using Next button instead.
     */
    await expect(
      this.nextButton,
      "Edit flow Next button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });
  }

  async clickEditNext() {
    await expect(
      this.nextButton,
      "Next button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.nextButton
    ).toBeEnabled();

    await this.nextButton.click();

    await this.page.waitForTimeout(
      700
    );
  }

  async selectEditPropertyType(
    propertyType
  ) {
    await expect(
      this.propertyTypeDropdown,
      "Property Type dropdown should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await this.propertyTypeDropdown.click();

    const roleOption =
      this.page.getByRole("option", {
        name: propertyType,
        exact: true,
      });

    if (
      await roleOption
        .isVisible()
        .catch(() => false)
    ) {
      await roleOption.click();
    } else {
      await this.page
        .getByText(propertyType, {
          exact: true,
        })
        .last()
        .click();
    }

    await expect(
      this.propertyTypeDropdown
    ).toContainText(propertyType);
  }

  async fillEditLandSize(
    landSize
  ) {
    await expect(
      this.landSizeInput,
      "Land Size input should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await this.landSizeInput.fill(
      ""
    );

    await this.landSizeInput.fill(
      String(landSize)
    );

    await expect(
      this.landSizeInput
    ).toHaveValue(
      String(landSize)
    );
  }

  async fillEditYearBuilt(
    yearBuilt
  ) {
    await expect(
      this.yearBuiltInput,
      "Year Built input should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await this.yearBuiltInput.fill(
      ""
    );

    await this.yearBuiltInput.fill(
      String(yearBuilt)
    );

    await expect(
      this.yearBuiltInput
    ).toHaveValue(
      String(yearBuilt)
    );
  }

  async completeEditListing(
    editData
  ) {
    /*
     * STEP 1
     * Edit opens first edit page.
     */
    await this.clickEditNext();

    /*
     * STEP 2 - Property Details
     */
    await this.selectEditPropertyType(
      editData.propertyType
    );

    await this.fillEditLandSize(
      editData.landSize
    );

    await this.fillEditYearBuilt(
      editData.yearBuilt
    );

    /*
     * Continue Property Details
     */
    await this.clickEditNext();

    /*
     * Pricing page
     * Keep previous values.
     */
    await this.clickEditNext();

    /*
     * Description / Features page
     * Keep previous values.
     */
    await this.clickEditNext();

    /*
     * Media / Confirm page
     */
    await expect(
      this.confirmListingCheckbox,
      "Confirm Listing checkbox should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    const checked =
      await this.confirmListingCheckbox.getAttribute(
        "aria-checked"
      );

    if (checked !== "true") {
      await this.confirmListingCheckbox.click();
    }

    await expect(
      this.confirmListingCheckbox
    ).toHaveAttribute(
      "aria-checked",
      "true"
    );

    await expect(
      this.publishListingButton,
      "Publish Listing button should be visible"
    ).toBeVisible();

    await expect(
      this.publishListingButton
    ).toBeEnabled();

    await this.publishListingButton.click();
  }

  // =====================================================
  // ARCHIVE LISTING
  // =====================================================

  async archiveListing(
    listingName
  ) {
    await this.openListingActions(
      listingName
    );

    const archiveOption =
      this.page.getByRole(
        "menuitem",
        {
          name: "Archive",
          exact: true,
        }
      );

    await expect(
      archiveOption,
      "Archive menu item should be visible"
    ).toBeVisible({
      timeout: 10_000,
    });

    await archiveOption.click();

    /*
     * Optional confirmation popup.
     */
    const confirmArchive =
      this.page
        .getByRole("button", {
          name: /archive|confirm|yes/i,
        })
        .last();

    if (
      await confirmArchive
        .isVisible()
        .catch(() => false)
    ) {
      await confirmArchive.click();
    }

    await this.page.waitForTimeout(
      1_500
    );
  }

  async verifyListingArchived(
    listingName
  ) {
    /*
     * First look for Archive/Inactive status.
     */
    const row =
      this.getListingRowByName(
        listingName
      );

    const rowVisible =
      await row
        .isVisible()
        .catch(() => false);

    if (rowVisible) {
      const archivedStatus =
        row.getByText(
          /archived|inactive/i
        );

      if (
        await archivedStatus
          .first()
          .isVisible()
          .catch(() => false)
      ) {
        return;
      }
    }

    /*
     * Try toast/status message.
     */
    const archiveMessage =
      this.page
        .locator(
          '[role="alert"], [role="status"], [class*="toast" i]'
        )
        .filter({
          hasText:
            /archive|archived/i,
        })
        .first();

    if (
      await archiveMessage
        .isVisible()
        .catch(() => false)
    ) {
      return;
    }

    /*
     * Listing may disappear from Active list.
     */
    if (!rowVisible) {
      return;
    }

    throw new Error(
      `Could not confirm that "${listingName}" was archived.`
    );
  }

  // =====================================================
  // VIEW DETAILS
  // =====================================================

  async expandListingDetails(
    listingName
  ) {
    const row =
      await this.verifyListingRowExists(
        listingName
      );

    /*
     * Exact live locator supplied:
     * button containing lucide-chevron-down.
     */
    const expandButton = row
      .locator("button")
      .filter({
        has: this.page.locator(
          "svg.lucide-chevron-down"
        ),
      })
      .last();

    await expect(
      expandButton,
      `Expand button for "${listingName}" should be visible`
    ).toBeVisible({
      timeout: 20_000,
    });

    await expandButton.click();

    await expect(
      this.propertyDetailsHeading
    ).toBeVisible({
      timeout: 10_000,
    });
  }

  async verifyExpandedDetails(
    expected
  ) {
    await expect(
      this.propertyDetailsHeading
    ).toBeVisible();

    await expect(
      this.listingDetailsHeading
    ).toBeVisible();

    await expect(
      this.additionalInfoHeading
    ).toBeVisible();

    await expect(
      this.propertyHeadlineHeading
    ).toBeVisible();

    await expect(
      this.descriptionHeading
    ).toBeVisible();

    await expect(
      this.featuresHeading
    ).toBeVisible();

    if (
      expected.bedrooms !==
      undefined
    ) {
      await expect(
        this.page.getByText(
          `${expected.bedrooms} Bedrooms`,
          {
            exact: true,
          }
        )
      ).toBeVisible();
    }

    if (
      expected.bathrooms !==
      undefined
    ) {
      await expect(
        this.page.getByText(
          `${expected.bathrooms} Bathrooms`,
          {
            exact: true,
          }
        )
      ).toBeVisible();
    }

    if (expected.headline) {
      await expect(
        this.page.getByText(
          expected.headline,
          {
            exact: true,
          }
        )
      ).toBeVisible();
    }

    if (
      Array.isArray(
        expected.expectedFeatures
      )
    ) {
      for (
        const feature of
        expected.expectedFeatures
      ) {
        await expect(
          this.page.getByText(
            feature,
            {
              exact: true,
            }
          )
        ).toBeVisible();
      }
    }
  }

  // =====================================================
  // STATUS
  // =====================================================

  async verifyListingStatus(
    listingName,
    expectedStatus
  ) {
    const row =
      await this.verifyListingRowExists(
        listingName
      );

    await expect(
      row.getByText(
        expectedStatus,
        {
          exact: true,
        }
      ),
      `"${listingName}" should have status "${expectedStatus}"`
    ).toBeVisible();
  }

  // =====================================================
  // PUBLISH VERIFICATION
  // =====================================================

  async verifyPublishedListing(
    listingName,
    expectedStatus
  ) {
    await this.searchListing(
      listingName
    );

    await this.verifyListingVisible(
      listingName
    );

    await this.switchToListView();

    const row =
      this.getListingRowByName(
        listingName
      );

    await expect(
      row
    ).toBeVisible();

    if (expectedStatus) {
      await expect(
        row.getByText(
          expectedStatus,
          {
            exact: true,
          }
        )
      ).toBeVisible();
    }
  }
}

module.exports = {
  ListingsPage,
};