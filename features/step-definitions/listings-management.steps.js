const {
  Given,
  When,
  Then,
} = require("@cucumber/cucumber");

const {
  listingData,
} = require(
  "../../fixtures/test-data/listingData"
);

// =====================================================
// OPEN LISTINGS
// =====================================================

Given(
  "I open Listings Management",
  async function () {
    await this.listingsPage.open();
  }
);

Then(
  "the Listings Management page is displayed",
  async function () {
    await this.listingsPage.waitForPage();
  }
);

// =====================================================
// SEARCH
// =====================================================

When(
  "I search for the management listing",
  async function () {
    await this.listingsPage.searchListing(
      listingData.management.search
        .listingName
    );
  }
);

Then(
  "the searched management listing is displayed",
  async function () {
    await this.listingsPage
      .verifyListingVisible(
        listingData.management.search
          .listingName
      );
  }
);

// =====================================================
// FILTER
// =====================================================

When(
  "I open the listing status filter",
  async function () {
    await this.listingsPage
      .openStatusFilter();
  }
);

Then(
  "all listing status filter options are displayed",
  async function () {
    await this.listingsPage
      .verifyStatusFilterOptions(
        listingData.management.filters
      );
  }
);

When(
  "I filter listings by the configured management status",
  async function () {
    await this.listingsPage
      .selectStatusFilter(
        listingData.management
          .filterStatus
      );
  }
);

Then(
  "the filtered listings result is displayed",
  async function () {
    const tableVisible =
      await this.listingsPage.table
        .isVisible()
        .catch(() => false);

    const gridVisible =
      await this.listingsPage
        .gridContainer
        .isVisible()
        .catch(() => false);

    const noListingsVisible =
      await this.page
        .getByText(/no listings/i)
        .isVisible()
        .catch(() => false);

    if (
      !tableVisible &&
      !gridVisible &&
      !noListingsVisible
    ) {
      throw new Error(
        "Filtered Listings result was not displayed."
      );
    }
  }
);

// =====================================================
// LIST VIEW
// =====================================================

When(
  "I switch listings to List view",
  async function () {
    await this.listingsPage
      .switchToListView();
  }
);

Then(
  "the listings table is displayed",
  async function () {
    await this.expect(
      this.listingsPage.table
    ).toBeVisible();
  }
);

// =====================================================
// GRID VIEW
// =====================================================

When(
  "I switch listings to Grid view",
  async function () {
    await this.listingsPage
      .switchToGridView();
  }
);

Then(
  "the listings grid is displayed",
  async function () {
    await this.expect(
      this.listingsPage.gridContainer
    ).toBeVisible();
  }
);

// =====================================================
// EDIT LISTING
// =====================================================

When(
  "I edit the first listing",
  async function () {
    await this.listingsPage
      .openEditListing(
        listingData.management.edit
          .propertyName
      );
  }
);

Then(
  "the listing edit flow is displayed",
  async function () {
    await this.expect(
      this.listingsPage.nextButton
    ).toBeVisible({
      timeout: 20_000,
    });
  }
);

When(
  "I update the first listing management details",
  async function () {
    await this.listingsPage
      .completeEditListing(
        listingData.management.edit
      );
  }
);

Then(
  "the edited listing is published successfully",
  async function () {
    const editData =
      listingData.management.edit;

    await this.dashboardPage
      .waitForDashboardAfterPublish();

    await this.listingsPage.open();

    await this.listingsPage
      .verifyPublishedListing(
        editData.propertyName,
        listingData.management
          .publishing.expectedStatus
      );
  }
);

// =====================================================
// ARCHIVE
// =====================================================

When(
  "I archive the configured listing",
  async function () {
    await this.listingsPage
      .archiveListing(
        listingData.management.archive
          .propertyName
      );
  }
);

Then(
  "the listing is archived successfully",
  async function () {
    await this.listingsPage
      .verifyListingArchived(
        listingData.management.archive
          .propertyName
      );
  }
);

// =====================================================
// DETAILS
// =====================================================

When(
  "I expand the configured listing details",
  async function () {
    await this.listingsPage
      .expandListingDetails(
        listingData.management.details
          .propertyName
      );
  }
);

Then(
  "the complete listing details are displayed",
  async function () {
    await this.listingsPage
      .verifyExpandedDetails(
        listingData.management.details
      );
  }
);

// =====================================================
// STATUS
// =====================================================

Then(
  "the configured listing status is correct",
  async function () {
    await this.listingsPage
      .verifyListingStatus(
        listingData.management.status
          .propertyName,

        listingData.management.status
          .expectedStatus
      );
  }
);

// =====================================================
// PUBLISH
// =====================================================

Then(
  "the configured published listing is visible",
  async function () {
    await this.listingsPage
      .verifyPublishedListing(
        listingData.management.publishing
          .propertyName,

        listingData.management.publishing
          .expectedStatus
      );
  }
);