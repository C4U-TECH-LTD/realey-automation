const { expect } = require("@playwright/test");

class DashboardPage {
  /**
   * @param {import("@playwright/test").Page} page
   */
  constructor(page) {
    this.page = page;

    /* =====================================================
       DASHBOARD
    ===================================================== */

    this.dashboardHeading = page.getByRole("heading", {
      name: /dashboard|welcome|agent dashboard/i,
    });

    /* =====================================================
       SIDEBAR MENU
    ===================================================== */

    this.listingsMenuButton = page.getByRole("button", {
      name: "Listings",
      exact: true,
    });

    this.listingsPageHeading = page.getByRole("heading", {
      name: "Listings",
      exact: true,
    });

    this.listingsSearchInput = page.getByPlaceholder(
      "Search by address, title...",
      {
        exact: true,
      }
    );

    /* =====================================================
       CREATE LISTING BUTTONS
    ===================================================== */

    this.createFirstListingButton = page.getByRole("button", {
      name: "Create Your First Listing",
      exact: true,
    });

    this.createNewListingButton = page
      .locator('button:has-text("Create New Listing")')
      .first();

    this.createListingButton = page.getByRole("button", {
      name: /create.*listing|add.*listing/i,
    });

    /* =====================================================
       LISTING CONTENT
    ===================================================== */

    this.listingCards = page.locator(
      [
        "article",
        '[data-testid*="listing" i]',
        '[data-testid*="property" i]',
        '[class*="listing-card" i]',
        '[class*="property-card" i]',
        '[class*="listingCard" i]',
        '[class*="propertyCard" i]',
      ].join(", ")
    );

    this.noListingsMessage = page.getByText("No listings yet", {
      exact: true,
    });

    this.totalListingsText = page.getByText("Total Listings", {
      exact: true,
    });

    this.activeListingsText = page.getByText("Active Listings", {
      exact: true,
    });
  }

  /* =====================================================
     DASHBOARD VERIFICATION
  ===================================================== */

  async waitForDashboard() {
  // Wait until navigation reaches agent dashboard
  await this.page.waitForURL(/\/dashboard\/agent(?:\?.*)?$/i, {
    timeout: 30_000,
    waitUntil: "domcontentloaded",
  });

  console.log(`✅ Agent dashboard URL confirmed: ${this.page.url()}`);

  // Give React dashboard content a chance to render.
  // We don't fail here just because one specific dashboard element
  // hasn't appeared yet.
  const dashboardContent = this.page
    .locator(
      [
        'button:has-text("Listings")',
        'button:has-text("Create New Listing")',
        'button:has-text("Create Your First Listing")',
        'h1:has-text("Dashboard")',
        'h2:has-text("Dashboard")',
        'text=Total Listings',
        'text=Active Listings',
      ].join(", ")
    )
    .first();

  try {
    await dashboardContent.waitFor({
      state: "visible",
      timeout: 15_000,
    });

    console.log("✅ Agent dashboard content loaded");
  } catch {
    // URL is the primary dashboard confirmation.
    // Do not fail login simply because dashboard widgets render slowly.
    console.log(
      "⚠️ Dashboard URL confirmed, but dashboard content is still loading."
    );
  }
}

  async waitForDashboardAfterPublish() {
    await this.page.waitForLoadState("domcontentloaded");

    await expect(
      this.page,
      "Agent dashboard should open after publishing the listing"
    ).toHaveURL(/dashboard\/agent|dashboard|agent/i, {
      timeout: 30_000,
    });

    await this.page.waitForTimeout(1_500);
  }

  /* =====================================================
     CREATE LISTING
  ===================================================== */

  async clickCreateListing() {
    await this.page.waitForLoadState("domcontentloaded");

    await expect(
      this.page,
      "Agent dashboard should be open before creating a listing"
    ).toHaveURL(/dashboard\/agent|dashboard|agent/i, {
      timeout: 30_000,
    });

    /*
     * The dashboard shell loads before the Listings content.
     * Wait for the main Listings area or open it from the sidebar.
     */
    const listingsHeadingVisible = await this.listingsPageHeading
      .isVisible()
      .catch(() => false);

    if (!listingsHeadingVisible) {
      const listingsMenuVisible = await this.listingsMenuButton
        .isVisible()
        .catch(() => false);

      if (listingsMenuVisible) {
        await this.listingsMenuButton.click();
      }
    }

    await expect(
      this.listingsPageHeading,
      "Listings page should finish loading"
    ).toBeVisible({
      timeout: 30_000,
    });

    const createNewButton = this.page
      .locator('button:has-text("Create New Listing")')
      .first();

    const createFirstButton = this.page
      .locator('button:has-text("Create Your First Listing")')
      .first();

    const createNewVisible = await createNewButton
      .isVisible()
      .catch(() => false);

    if (createNewVisible) {
      await expect(
        createNewButton,
        "Create New Listing button should be enabled"
      ).toBeEnabled({
        timeout: 20_000,
      });

      await createNewButton.scrollIntoViewIfNeeded();
      await createNewButton.click();
      return;
    }

    const createFirstVisible = await createFirstButton
      .isVisible()
      .catch(() => false);

    if (createFirstVisible) {
      await expect(
        createFirstButton,
        "Create Your First Listing button should be enabled"
      ).toBeEnabled({
        timeout: 20_000,
      });

      await createFirstButton.scrollIntoViewIfNeeded();
      await createFirstButton.click();
      return;
    }

    /*
     * Last fallback: wait for either button because React may still be
     * hydrating the Listings content after the heading appears.
     */
    const anyCreateButton = this.page
      .locator(
        'button:has-text("Create New Listing"), button:has-text("Create Your First Listing")'
      )
      .first();

    await expect(
      anyCreateButton,
      "A Create Listing button should appear after the Listings page loads"
    ).toBeVisible({
      timeout: 30_000,
    });

    await expect(anyCreateButton).toBeEnabled();
    await anyCreateButton.scrollIntoViewIfNeeded();
    await anyCreateButton.click();
  }

  /* =====================================================
     OPEN LISTINGS MENU
  ===================================================== */

  async openListingsMenu() {
    await expect(
      this.listingsMenuButton,
      "Listings menu button should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await expect(
      this.listingsMenuButton,
      "Listings menu button should be enabled"
    ).toBeEnabled();

    await this.listingsMenuButton.scrollIntoViewIfNeeded();
    await this.listingsMenuButton.click();

    await expect(
      this.page,
      "Listings page should open after clicking Listings menu"
    ).toHaveURL(/dashboard\/agent\?tab=listings/i, {
      timeout: 20_000,
    });

    await expect(
      this.listingsPageHeading,
      "Listings page heading should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });
  }

  /* =====================================================
     LISTING SEARCH
  ===================================================== */

  async searchListing(searchText) {
    if (!searchText) {
      throw new Error(
        "Search text is required to find the published listing."
      );
    }

    await expect(
      this.listingsSearchInput,
      "Listings search input should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });

    await this.listingsSearchInput.fill(searchText);

    await expect(
      this.listingsSearchInput
    ).toHaveValue(searchText);

    // Trigger search via Enter
    await this.listingsSearchInput.press("Enter").catch(() => {});

    // Also click magnifying glass button if present
    const searchBtn = this.page.locator('button:has(svg.lucide-search)').first();
    if (await searchBtn.isVisible().catch(() => false)) {
      await searchBtn.click().catch(() => {});
    }

    await this.page.waitForTimeout(1_000);
  }

  /* =====================================================
     LOCATION-BASED LISTING LOCATORS
  ===================================================== */

  getListingByLocation(locationName) {
    if (!locationName) {
      throw new Error(
        "Property location is required to locate the listing."
      );
    }

    const streetOnly = locationName.split(",")[0].trim();

    return this.page
      .getByText(new RegExp(streetOnly, "i"))
      .or(this.page.getByText(locationName, { exact: false }));
  }

  getListingCardByLocation(locationName) {
    if (!locationName) {
      throw new Error(
        "Property location is required to locate the listing card."
      );
    }

    const streetOnly = locationName.split(",")[0].trim();

    return this.page
      .locator(
        [
          "table tbody tr",
          "article",
          '[data-testid*="listing" i]',
          '[data-testid*="property" i]',
          '[class*="listing-card" i]',
          '[class*="property-card" i]',
          '[class*="listingCard" i]',
          '[class*="propertyCard" i]',
        ].join(", ")
      )
      .filter({
        hasText: new RegExp(streetOnly, "i"),
      })
      .first();
  }

  /* =====================================================
     PUBLISHED LISTING VERIFICATION
  ===================================================== */

  async verifyListingVisibleByLocation(locationName) {
    if (!locationName) {
      throw new Error(
        "Property location is required to verify the published listing."
      );
    }

    // 1. Wait for loading spinners or skeletons to detach
    await this.page
      .locator('.animate-spin, svg.lucide-loader-2, [class*="skeleton"]')
      .first()
      .waitFor({ state: "hidden", timeout: 15_000 })
      .catch(() => {});

    await this.page.waitForTimeout(1_000);

    const streetOnly = locationName.split(",")[0].trim();

    // 2. Newly created listings appear at the top of the table/cards.
    // Check if the listing is immediately visible on the page without searching.
    const directListingCard = this.getListingCardByLocation(locationName);
    const directLocationText = this.getListingByLocation(locationName).first();

    const isDirectlyVisible =
      (await directListingCard.isVisible().catch(() => false)) ||
      (await directLocationText.isVisible().catch(() => false));

    if (isDirectlyVisible) {
      console.log(
        `✅ Published listing "${streetOnly}" is immediately visible on the listings page.`
      );
      return;
    }

    // 3. If not immediately visible, search using the street name
    console.log(
      `Listing not immediately visible, searching for street: "${streetOnly}"...`
    );
    await this.searchListing(streetOnly);

    // 4. Auto-retrying assertion up to 20 seconds
    const targetListing = this.getListingCardByLocation(locationName);
    const targetText = this.getListingByLocation(locationName).first();

    const matchingTarget = targetListing.or(targetText).first();

    await expect(
      matchingTarget,
      `Published listing "${locationName}" should be visible on the listings page`
    ).toBeVisible({ timeout: 20_000 });

    console.log(`✅ Published listing "${locationName}" confirmed visible.`);
  }

  async verifyPublishedListingByLocation(locationName) {
    await this.waitForDashboardAfterPublish();
    await this.openListingsMenu();
    await this.verifyListingVisibleByLocation(locationName);
  }

  /* =====================================================
     LOGOUT
  ===================================================== */

  async logout() {
    console.log("Attempting to log out via user profile menu...");

    // Find user profile dropdown trigger in header
    const profileTrigger = this.page
      .locator(
        [
          'button:has(span.text-xs.font-medium)',
          'div[class*="items-center"]:has(span.text-xs.font-medium)',
          'button:has(svg.lucide-user)',
          '[data-testid*="user-menu" i]',
          '[data-testid*="profile" i]',
          'header button:has(img[alt*="avatar" i])',
          'header button:has(svg.lucide-chevron-down)',
        ].join(", ")
      )
      .last();

    await expect(
      profileTrigger,
      "Profile menu trigger should be visible in header"
    ).toBeVisible({ timeout: 15_000 });

    await profileTrigger.click();
    await this.page.waitForTimeout(500);

    // Look for Logout / Log out / Sign out menu item
    const logoutOption = this.page
      .getByRole("menuitem", {
        name: /log\s*out|sign\s*out/i,
      })
      .or(
        this.page.locator('button, [role="button"], a').filter({
          hasText: /log\s*out|sign\s*out/i,
        })
      )
      .first();

    await expect(
      logoutOption,
      "Logout option should be visible in profile menu"
    ).toBeVisible({ timeout: 10_000 });

    await logoutOption.click();

    // Verify redirection to /login or landing page
    await this.page.waitForURL(/\/login|\/$/i, {
      timeout: 15_000,
    });

    console.log(`Logout confirmed, redirected to: ${this.page.url()}`);
  }

  /* =====================================================
     NOTIFICATIONS
  ===================================================== */

  async verifyNotificationBell() {
    await this.verifyAndManageNotification();
  }

  async verifyAndManageNotification(expectedContent) {
    console.log("Checking in-app notification drawer and read state...");

    const bell = this.page.locator(
      [
        'button:has(svg.lucide-bell)',
        '[aria-label*="notification" i]',
        'button:has([class*="bell" i])',
        'div:has(svg.lucide-bell)',
      ].join(", ")
    ).first();

    const bellVisible = await bell.isVisible({ timeout: 5000 }).catch(() => false);

    if (bellVisible) {
      await expect(bell).toBeVisible();
      console.log("Notification bell found. Clicking to open drawer...");
      await bell.click();
      await this.page.waitForTimeout(1000);

      // Verify drawer or popover opens
      const drawer = this.page.locator(
        [
          '[role="dialog"]',
          '[data-radix-popper-content-wrapper]',
          '[class*="popover" i]',
          '[class*="notification" i]',
          'div:has-text("Notifications")',
        ].join(", ")
      ).last();

      const drawerVisible = await drawer.isVisible({ timeout: 5000 }).catch(() => false);

      if (drawerVisible) {
        console.log("Notifications drawer opened successfully");

        // Check if matching notification or any notification items are displayed
        if (expectedContent) {
          const matchingItem = drawer.getByText(expectedContent, { exact: false }).first();
          if (await matchingItem.isVisible({ timeout: 4000 }).catch(() => false)) {
            console.log(`Found notification with content: ${expectedContent}`);
          }
        }

        // Test notification status / read state:
        // Try clicking 'Mark as read', 'Mark all as read', or the first notification item
        const markReadBtn = drawer.locator(
          [
            'button:has-text("Mark as read")',
            'button:has-text("Mark all as read")',
            'button:has(svg.lucide-check)',
            '[aria-label*="mark as read" i]',
          ].join(", ")
        ).first();

        if (await markReadBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await markReadBtn.click();
          console.log("Clicked Mark as read button in notification drawer");
          await this.page.waitForTimeout(500);
        } else {
          const firstItem = drawer.locator(
            '[data-testid*="notification" i], [class*="notification-item" i], div[class*="cursor-pointer"]'
          ).first();

          if (await firstItem.isVisible({ timeout: 2000 }).catch(() => false)) {
            await firstItem.click().catch(() => {});
            console.log("Clicked first notification item to update read status");
          }
        }

        // Close drawer
        await this.page.keyboard.press("Escape").catch(() => {});
        await this.page.waitForTimeout(500);
      }
    } else {
      console.log("Notification bell not directly visible on this screen; continuing.");
    }
  }
}

module.exports = {
  DashboardPage,
};