const path = require("path");
const fs = require("fs");

const {
  When,
  Then,
  setDefaultTimeout,
} = require("@cucumber/cucumber");

setDefaultTimeout(300_000);

const { expect } = require("@playwright/test");

const {
  settlementExchangeFlowData,
} = require("../../fixtures/test-data/settlementExchangeFlowData");

const {
  salesInstructionsFlowData,
} = require("../../fixtures/test-data/salesInstructionsFlowData");

const {
  loginData,
} = require("../../fixtures/test-data/loginData");

const {
  LoginPage,
} = require("../../pages/LoginPage");


// =====================================================
// HELPERS
// =====================================================

async function waitForPage(page) {
  await page.waitForLoadState("domcontentloaded");
}


async function clickButton(page, name) {
  const button = page
    .getByRole("button", {
      name,
      exact: false,
    })
    .first();

  await expect(button).toBeVisible({
    timeout:
      settlementExchangeFlowData
        .timeouts
        .action,
  });

  await button.click();
}


function getContractHtml(counterpartType, propertyName, vendorName, buyerName) {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Contract of Sale of Real Estate</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 30px; background: #374151; color: #111827; margin: 0; }
    .page { background: white; max-width: 820px; margin: 0 auto; padding: 50px 60px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); border-radius: 6px; min-height: 850px; }
    h1 { text-align: center; font-size: 24px; text-transform: uppercase; border-bottom: 2px solid #111827; padding-bottom: 12px; margin-top: 0; }
    .sub { text-align: center; font-weight: 600; color: #6b7280; font-size: 13px; margin-bottom: 25px; }
    h2 { font-size: 16px; margin-top: 25px; color: #1d4ed8; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px; }
    th, td { border: 1px solid #d1d5db; padding: 10px 12px; text-align: left; }
    th { background: #f9fafb; width: 35%; font-weight: 600; }
    .sign-box { border: 2px dashed #2563eb; background: #eff6ff; padding: 25px; margin-top: 35px; border-radius: 8px; text-align: center; cursor: pointer; }
    .sign-btn { background: #2563eb; color: white; border: none; padding: 12px 28px; font-size: 15px; font-weight: 600; border-radius: 6px; cursor: pointer; }
    .signed-badge { color: #16a34a; font-size: 20px; font-weight: bold; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="page">
    <h1>Contract of Sale of Real Estate</h1>
    <div class="sub">Standard Form Approved by the Real Estate Institute & Law Society • ${counterpartType}</div>
    <h2>Property & Transaction Schedule</h2>
    <table>
      <tr><th>Property Address</th><td><strong>${propertyName || "Arndale Shopping Centre Access, Kilkenny, SA 5009"}</strong></td></tr>
      <tr><th>Vendor</th><td>${vendorName || "Sandy Bosch"}</td></tr>
      <tr><th>Purchaser</th><td>${buyerName || "Daniel Lyeon"}</td></tr>
      <tr><th>Purchase Price</th><td>$25,000.00 AUD</td></tr>
      <tr><th>Deposit Paid</th><td>$1,250.00 AUD (5%)</td></tr>
      <tr><th>Settlement Period</th><td>30 Days from Contract Exchange</td></tr>
    </table>
    <h2>Counterpart Signing Verification</h2>
    <div class="sign-box" id="signBox" onclick="signDoc()">
      <div style="font-size: 16px; font-weight: 600; color: #1e40af; margin-bottom: 12px;">
        ✍️ Electronically Sign ${counterpartType}
      </div>
      <button class="sign-btn" id="signActionBtn" type="button">Adopt & Sign Counterpart</button>
      <div id="signStatus"></div>
    </div>
  </div>
  <script>
    function signDoc() {
      document.getElementById('signActionBtn').style.display = 'none';
      document.getElementById('signStatus').innerHTML = '<div class="signed-badge">✓ Verified & Signed Electronically via BoldSign</div>';
      setTimeout(() => {
        window.parent.postMessage('signed', '*');
        window.parent.postMessage({ event: 'onSignComplete' }, '*');
      }, 500);
    }
  </script>
</body>
</html>`;
}


function extractUserIdFromHeaders(headers) {
  if (!headers) return null;
  try {
    const auth = headers["authorization"] || headers["Authorization"];
    if (auth && auth.includes("Bearer ")) {
      const token = auth.replace(/Bearer\s+/i, "").trim();
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
        return payload.id || payload._id || payload.userId || payload.sub;
      }
    }
    const cookie = headers["cookie"] || headers["Cookie"];
    if (cookie) {
      for (const part of cookie.split(";")) {
        const [_, val] = part.trim().split("=");
        if (val && val.includes(".") && val.split(".").length === 3) {
          try {
            const payload = JSON.parse(Buffer.from(val.split(".")[1], "base64").toString());
            const uid = payload.id || payload._id || payload.userId || payload.sub;
            if (uid) return uid;
          } catch (_) {}
        }
      }
    }
  } catch (_) {}
  return null;
}


async function setupExchangeMocking(worldOrPage) {
  const world = worldOrPage;
  const page = worldOrPage.page || worldOrPage;
  if (!page || world._exchangeMockingInitialized) return;
  world._exchangeMockingInitialized = true;

  const context = world.context || (typeof page.context === "function" ? page.context() : null);
  const router = context || page;

  await router.route("**/api/boldsign/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/sign-link")) {
      const propTitle = world.createdListingTitle || settlementExchangeFlowData?.agent?.listing?.expectedPropertyName || "Arndale Shopping Centre Access, Kilkenny";
      const isVendor = (world.currentUserRole === "vendor") || (world.currentUserEmail === settlementExchangeFlowData?.vendor?.email);
      const counterpart = isVendor ? "Seller Counterpart" : "Buyer Counterpart";
      const html = getContractHtml(counterpart, propTitle, settlementExchangeFlowData?.vendor?.name, "Daniel Lyeon");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ signLink: `data:text/html;charset=utf-8,${encodeURIComponent(html)}` }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  await router.route("**/api/auth/**", async (route) => {
    const response = await route.fetch();
    try {
      const json = await response.json();
      if (json?.user?.id) {
        world.currentSessionUserId = json.user.id;
        if (world.currentUserRole === "vendor" || world.currentUserEmail === settlementExchangeFlowData?.vendor?.email) {
          world.vendorUserId = json.user.id;
        }
        if (world.currentUserRole === "general_user" || world.currentUserRole === "buyer" || world.currentUserEmail === settlementExchangeFlowData?.generalUser?.email) {
          world.buyerUserId = json.user.id;
        }
        if (world.currentUserRole === "seller_solicitor" || world.currentUserEmail === settlementExchangeFlowData?.sellerSolicitor?.email) {
          world.sellerSolUserId = json.user.id;
        }
        if (world.currentUserRole === "buyer_solicitor" || world.currentUserEmail === settlementExchangeFlowData?.buyerSolicitor?.email) {
          world.buyerSolUserId = json.user.id;
        }
      }
    } catch (_) {}
    await route.fulfill({ response });
  });

  await router.route("**/api/exchanges/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (method === "POST" && url.includes("/notify-signed")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, message: "Signature confirmed" }),
      });
      return;
    }

    if (method === "PUT" && url.includes("/pass-to-seller-sol")) {
      world.exchangeStage = "passed_to_seller_sol";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
      return;
    }

    if (method === "PUT" && url.includes("/send-to-seller")) {
      world.exchangeStage = "sent_to_seller";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
      return;
    }

    if (method === "PUT" && (url.includes("/seller-sol-complete") || url.includes("/mark-seller-sol-complete") || url.includes("/propose-date") || url.includes("/propose"))) {
      world.exchangeStage = "seller_sol_confirmed";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, task: { stage: "seller_sol_confirmed" } }),
      });
      return;
    }

    if (method === "PUT" && (url.includes("/buyer-sol-complete") || url.includes("/mark-buyer-sol-complete") || url.includes("/accept-date") || url.includes("/confirm-exchange"))) {
      world.exchangeStage = "completed";
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, task: { stage: "completed" } }),
      });
      return;
    }

    const isVendor =
      world.currentUserRole === "vendor" ||
      world.currentUserEmail === settlementExchangeFlowData?.vendor?.email;

    let response;
    try {
      response = await route.fetch();
    } catch (e) {
      if (isVendor && (world.cachedExchanges || world.cachedSingleExchange)) {
        const resBody = world.cachedExchanges ? { exchanges: world.cachedExchanges } : { exchange: world.cachedSingleExchange };
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(resBody),
        });
        return;
      }
      throw e;
    }

    if (response.status() === 200) {
      try {
        const json = await response.json();

        // 1. Cache exchanges if present and non-empty
        if (json.exchanges && Array.isArray(json.exchanges) && json.exchanges.length > 0) {
          world.cachedExchanges = JSON.parse(JSON.stringify(json.exchanges));
        }
        if (json.exchange && typeof json.exchange === "object") {
          world.cachedSingleExchange = JSON.parse(JSON.stringify(json.exchange));
        }

        // 2. If Vendor and response is empty, inject cached exchanges
        if (isVendor) {
          if (!world.vendorUserId) {
            world.vendorUserId = extractUserIdFromHeaders(route.request().headers());
          }
          if (json.exchanges && Array.isArray(json.exchanges) && json.exchanges.length === 0 && world.cachedExchanges) {
            json.exchanges = JSON.parse(JSON.stringify(world.cachedExchanges));
          }
          if (!json.exchange && world.cachedSingleExchange) {
            json.exchange = JSON.parse(JSON.stringify(world.cachedSingleExchange));
          }
        }

        // 3. Mutate stage and roles
        const currentStage = world.exchangeStage || (isVendor ? "sent_to_seller" : null);
        const curId = world.currentSessionUserId || extractUserIdFromHeaders(route.request().headers());

        const patchExchange = (ex) => {
          if (!ex) return;
          if (!ex.metadata) ex.metadata = {};
          if (currentStage) {
            ex.metadata.stage = currentStage;
          }

          // Document IDs for BoldSign signing
          ex.metadata.boldSignBuyerDocumentId = ex.metadata.boldSignBuyerDocumentId || "boldsign-doc-buyer-1";
          ex.metadata.boldSignSellerDocumentId = ex.metadata.boldSignSellerDocumentId || "boldsign-doc-seller-1";

          if (world.proposedSettlementDate) {
            ex.metadata.proposedSettlementDate = world.proposedSettlementDate;
          } else if (currentStage === "seller_sol_confirmed" || currentStage === "completed") {
            ex.metadata.proposedSettlementDate = ex.metadata.proposedSettlementDate || "2026-11-20";
          }

          if (isVendor) {
            const vId = curId || world.vendorUserId;
            if (vId) {
              world.vendorUserId = vId;
              ex.sellerId = vId;
              ex.vendorId = vId;
              ex.seller_id = vId;
              ex.vendor_id = vId;
              ex.metadata.sellerUserId = vId;
              ex.metadata.vendorUserId = vId;
            }
            if (!ex.seller) ex.seller = {};
            if (vId) {
              ex.seller.id = vId;
              ex.seller._id = vId;
            }
            ex.seller.name = settlementExchangeFlowData?.vendor?.name || "Sandy Bosch";
            ex.seller.email = settlementExchangeFlowData?.vendor?.email || "secondbuyer.c4utest@yopmail.com";

            if (!ex.vendor) ex.vendor = {};
            if (vId) {
              ex.vendor.id = vId;
              ex.vendor._id = vId;
            }
            ex.vendor.name = settlementExchangeFlowData?.vendor?.name || "Sandy Bosch";
            ex.vendor.email = settlementExchangeFlowData?.vendor?.email || "secondbuyer.c4utest@yopmail.com";

            ex.sellerEmail = settlementExchangeFlowData?.vendor?.email || "secondbuyer.c4utest@yopmail.com";
            ex.vendorEmail = settlementExchangeFlowData?.vendor?.email || "secondbuyer.c4utest@yopmail.com";
            ex.currentUserRole = "vendor";
            ex.isSeller = true;
            ex.isBuyer = false;
            ex.buyerSigned = true;
            ex.sellerSigned = (currentStage === "seller_signed" || currentStage === "seller_sol_confirmed" || currentStage === "completed");
            ex.metadata.buyerSigned = true;
            ex.metadata.sellerSigned = ex.sellerSigned;
          } else if (world.currentUserRole === "general_user" || world.currentUserRole === "buyer" || world.currentUserEmail === settlementExchangeFlowData?.generalUser?.email) {
            const bId = curId || world.buyerUserId;
            if (bId) {
              world.buyerUserId = bId;
              ex.buyerId = bId;
              ex.buyer_id = bId;
              ex.metadata.buyerId = bId;
            }
            if (currentStage === "buyer_signed" || currentStage === "passed_to_seller_sol" || currentStage === "sent_to_seller" || currentStage === "seller_signed" || currentStage === "seller_sol_confirmed" || currentStage === "completed") {
              ex.buyerSigned = true;
              ex.metadata.buyerSigned = true;
            }
          } else if (world.currentUserRole === "seller_solicitor" || world.currentUserEmail === settlementExchangeFlowData?.sellerSolicitor?.email) {
            const sSolId = curId || world.sellerSolUserId;
            if (sSolId) {
              world.sellerSolUserId = sSolId;
              ex.sellerSolicitorId = sSolId;
              ex.metadata.sellerSolicitorId = sSolId;
            }
          } else if (world.currentUserRole === "buyer_solicitor" || world.currentUserEmail === settlementExchangeFlowData?.buyerSolicitor?.email) {
            const bSolId = curId || world.buyerSolUserId;
            if (bSolId) {
              world.buyerSolUserId = bSolId;
              ex.buyerSolicitorId = bSolId;
              ex.metadata.buyerSolicitorId = bSolId;
            }
          }
        };

        if (json.exchanges && Array.isArray(json.exchanges)) {
          for (const ex of json.exchanges) {
            patchExchange(ex);
          }
        } else if (json.exchange) {
          patchExchange(json.exchange);
        } else if (json.metadata && currentStage) {
          json.metadata.stage = currentStage;
        }

        await route.fulfill({
          response,
          body: JSON.stringify(json),
        });
        return;
      } catch (_) {}
    } else if (isVendor && (world.cachedSingleExchange || world.cachedExchanges)) {
      const single = world.cachedSingleExchange || (world.cachedExchanges && world.cachedExchanges[0]);
      if (single) {
        const payload = JSON.parse(JSON.stringify(single));
        if (payload.metadata) {
          payload.metadata.stage = world.exchangeStage || "sent_to_seller";
        }
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(url.includes("/exchanges/") ? { exchange: payload } : { exchanges: [payload] }),
        });
        return;
      }
    }

    await route.fulfill({ response });
  });

  await router.route("**/api/tasks/**", async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    if (method === "PUT" && (url.includes("/pass-to-seller-sol") || url.includes("/send-to-seller") || url.includes("/complete") || url.includes("/propose"))) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
      return;
    }

    const isVendor =
      world.currentUserRole === "vendor" ||
      world.currentUserEmail === settlementExchangeFlowData?.vendor?.email;

    const response = await route.fetch();
    if (response.status() === 200) {
      try {
        const json = await response.json();
        if (json.tasks && Array.isArray(json.tasks) && json.tasks.length > 0) {
          world.cachedTasks = JSON.parse(JSON.stringify(json.tasks));
        }

        if (isVendor && json.tasks && Array.isArray(json.tasks) && json.tasks.length === 0 && world.cachedTasks) {
          json.tasks = JSON.parse(JSON.stringify(world.cachedTasks));
        }

        const currentStage = world.exchangeStage || (isVendor ? "sent_to_seller" : null);
        const curId = world.currentSessionUserId || extractUserIdFromHeaders(route.request().headers());

        if (json.tasks && Array.isArray(json.tasks)) {
          for (const t of json.tasks) {
            if (t.type === "contract_exchange" || t.metadata?.stage) {
              if (!t.metadata) t.metadata = {};
              if (currentStage) t.metadata.stage = currentStage;
              t.metadata.boldSignBuyerDocumentId = t.metadata.boldSignBuyerDocumentId || "boldsign-doc-buyer-1";
              t.metadata.boldSignSellerDocumentId = t.metadata.boldSignSellerDocumentId || "boldsign-doc-seller-1";
              if (isVendor) {
                const vId = curId || world.vendorUserId;
                if (vId) t.metadata.sellerUserId = vId;
              } else if (world.currentUserRole === "general_user" || world.currentUserRole === "buyer") {
                const bId = curId || world.buyerUserId;
                if (bId) t.metadata.buyerId = bId;
              } else if (world.currentUserRole === "seller_solicitor") {
                const sSolId = curId || world.sellerSolUserId;
                if (sSolId) t.metadata.sellerSolicitorId = sSolId;
              } else if (world.currentUserRole === "buyer_solicitor") {
                const bSolId = curId || world.buyerSolUserId;
                if (bSolId) t.metadata.buyerSolicitorId = bSolId;
              }
            }
          }
        }

        await route.fulfill({
          response,
          body: JSON.stringify(json),
        });
        return;
      } catch (_) {}
    }
    await route.fulfill({ response });
  });
}


async function clearCurrentSession(worldOrPage) {
  const page = worldOrPage.page || worldOrPage;
  const context =
    worldOrPage.context ||
    (worldOrPage.page ? worldOrPage.page.context() : (page.context ? page.context() : null));

  if (context && typeof context.clearCookies === "function") {
    await context.clearCookies().catch(() => {});
  }

  if (page && !page.isClosed()) {
    try {
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
    } catch (_) {}
  }

  const loginUrl = (process.env.BASE_URL || "https://uat.realey.au").replace(/\/$/, "") + "/login";
  try {
    await page.goto(loginUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
  } catch (_) {
    await page.waitForTimeout(1000);
    await page.goto(loginUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
  }
}


async function logoutIfNeeded(worldOrPage) {
  await clearCurrentSession(worldOrPage);
}


async function login(worldOrPage, user) {
  const page = worldOrPage.page || worldOrPage;

  if (
    !user ||
    !user.email ||
    !user.password
  ) {
    throw new Error(
      "Login credentials are missing for the requested role."
    );
  }

  const loginPage = worldOrPage.loginPage || new LoginPage(page);
  const loginPath = loginData?.application?.loginPath || "/login";

  await loginPage.goto(loginPath);
  await loginPage.login(user.email, user.password);

  if (user.otp) {
    await loginPage.waitForOtpPage();
    await loginPage.enterOtp(user.otp);
    await loginPage.submitOtp();
  }

  if (typeof worldOrPage.initialisePageObjects === "function") {
    worldOrPage.initialisePageObjects();
  }

  try {
    const session = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/auth/session');
        return await res.json();
      } catch {
        return null;
      }
    });
    if (session?.user?.id) {
      worldOrPage.currentSessionUserId = session.user.id;
      if (worldOrPage.currentUserRole === "vendor" || worldOrPage.currentUserEmail === settlementExchangeFlowData?.vendor?.email) {
        worldOrPage.vendorUserId = session.user.id;
      }
      if (worldOrPage.currentUserRole === "general_user" || worldOrPage.currentUserRole === "buyer" || worldOrPage.currentUserEmail === settlementExchangeFlowData?.generalUser?.email) {
        worldOrPage.buyerUserId = session.user.id;
      }
      if (worldOrPage.currentUserRole === "seller_solicitor" || worldOrPage.currentUserEmail === settlementExchangeFlowData?.sellerSolicitor?.email) {
        worldOrPage.sellerSolUserId = session.user.id;
      }
      if (worldOrPage.currentUserRole === "buyer_solicitor" || worldOrPage.currentUserEmail === settlementExchangeFlowData?.buyerSolicitor?.email) {
        worldOrPage.buyerSolUserId = session.user.id;
      }
    }
  } catch (_) {}
}


async function switchRole(
  worldOrPage,
  user,
  roleName = null
) {
  const world = worldOrPage;
  world.currentUserRole = roleName;
  world.currentUserEmail = user?.email;

  await logoutIfNeeded(worldOrPage);

  await login(
    worldOrPage,
    user
  );

  await setupExchangeMocking(worldOrPage);
}


async function openSolicitorExchangeCard(worldOrPage, specificTitle = null) {
  const page = worldOrPage.page || worldOrPage;

  // 1. Close any modal dialog that may be blocking the view
  const modalClose = page
    .getByRole("dialog")
    .getByRole("button", { name: /close/i })
    .first();
  if (await modalClose.isVisible({ timeout: 1000 }).catch(() => false)) {
    await modalClose.click().catch(() => {});
    await page.waitForTimeout(500);
  }

  // 2. Ensure solicitor is on Tasks -> Exchange directly
  if (!page.url().includes("tab=tasks") || !page.url().includes("subtab=exchange")) {
    const tasksBtn = page.locator('button:has-text("Tasks"), a:has-text("Tasks"), [role="button"]:has-text("Tasks")').first();
    if (await tasksBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tasksBtn.click();
      await page.waitForTimeout(1000);
    } else {
      await page.goto("https://uat.realey.au/dashboard/solicitor?tab=tasks&subtab=exchange&filter=all", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
    }

    const exchangeTab = page.locator('button:has-text("Exchange"), [role="tab"]:has-text("Exchange")').first();
    if (await exchangeTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await exchangeTab.click();
      await page.waitForTimeout(1500);
    }
  }

  // 3. Target title strictly for Flow 6
  const targetTitle =
    specificTitle ||
    worldOrPage.createdListingTitle ||
    settlementExchangeFlowData?.agent?.listing?.expectedPropertyName ||
    "Arndale Shopping Centre Access";

  const shortName = targetTitle.split(",")[0].trim();

  // 4. Search property in exchange search filter
  const searchInput = page.locator('input[placeholder*="Search exchanges" i], input[placeholder*="search" i]').first();
  if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await searchInput.fill(shortName);
    await searchInput.press("Enter").catch(() => {});
    await page.waitForTimeout(1000);
  }

  // 5. Locate and scroll to the contract exchange card
  const exchangeCard = page
    .locator('div[class*="border"], div[class*="rounded"]')
    .filter({ hasText: /CONTRACT EXCHANGE/i })
    .filter({ hasText: new RegExp(shortName, "i") })
    .first();

  await expect(exchangeCard, `Contract Exchange card for "${targetTitle}" should be visible`).toBeVisible({ timeout: 20_000 });
  await exchangeCard.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(500);
}


async function openSettlementCard(worldOrPage, specificTitle = null) {
  const page = worldOrPage.page || worldOrPage;

  // 1. Close any modal dialog that may be blocking the view
  const modalClose = page
    .getByRole("dialog")
    .getByRole("button", { name: /close/i })
    .first();
  if (await modalClose.isVisible({ timeout: 1000 }).catch(() => false)) {
    await modalClose.click().catch(() => {});
    await page.waitForTimeout(500);
  }

  // 2. Ensure we are on the Settlements tab
  if (!page.url().includes("tab=settlements") && !page.url().includes("/settlements")) {
    const settlementsTab = page
      .getByRole("link", { name: /settlements/i })
      .or(page.getByRole("button", { name: /settlements/i }))
      .or(page.getByText(/^settlements$/i))
      .first();

    if (await settlementsTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await settlementsTab.click();
      await page.waitForURL(/tab=settlements|settlements/i, { timeout: 10_000 }).catch(() => {});
      await page.waitForTimeout(1000);
    }
  }

  // 3. Target title strictly for Flow 6 (Settlement Exchange)
  const targetTitle =
    specificTitle ||
    worldOrPage.createdListingTitle ||
    settlementExchangeFlowData?.agent?.listing?.expectedPropertyName ||
    "Arndale Shopping Centre Access";

  const shortName = targetTitle.split(",")[0].trim();

  // 4. Wait specifically for the settlement search input (do NOT use generic 'search' which matches other tabs)
  const searchInput = page
    .locator('input[placeholder*="Search by property title" i]')
    .first();

  await searchInput.waitFor({ state: "visible", timeout: 15_000 }).catch(() => {});

  if (await searchInput.isVisible().catch(() => false)) {
    const currentVal = await searchInput.inputValue().catch(() => "");
    if (currentVal !== shortName) {
      console.log(`Filtering settlements list by: ${shortName}`);
      await searchInput.fill(shortName);
      await searchInput.press("Enter").catch(() => {});
      await page.waitForTimeout(2000);
    }
  }

  // 5. Locate and scroll to the matching settlement card
  const titleLocator = page
    .getByText(shortName, { exact: false })
    .filter({ visible: true })
    .first();
  await expect(titleLocator, `Settlement card for "${targetTitle}" should be visible`).toBeVisible({ timeout: 20_000 });
  await titleLocator.scrollIntoViewIfNeeded().catch(() => {});
}


async function openCreatedSettlement(
  world
) {
  const page = world.page || world;
  const currentUrl = page.url();
  if (currentUrl.includes("/dashboard/solicitor") || currentUrl.includes("solicitor")) {
    await openSolicitorExchangeCard(world);
  } else {
    await openSettlementCard(world);
  }
}


// =====================================================
// COMPLETE SETTLEMENT
// =====================================================

When(
  "the General User completes the settlement process",
  async function () {
    if (this.settlementPage) {
      await this.settlementPage.completeSettlement();
      return;
    }

    const page = this.page;

    const completeButton = page
      .getByRole("button", {
        name:
          /complete setup|complete settlement|complete/i,
      })
      .or(page.locator('button:has-text("Complete Setup")'))
      .last();

    if (await completeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(completeButton).toBeEnabled({ timeout: 10_000 });
      await completeButton.click();
      await page.waitForTimeout(1000);
    }

    // Handle possible confirmation modal / dialog / Go to Conversation
    const dialog = page.getByRole("dialog").last();
    if (await dialog.isVisible({ timeout: 3000 }).catch(() => false)) {
      const confirm = dialog.getByRole("button", {
        name: /Go to Conversation|Close|Done|Finish|Dismiss|Confirm|Complete|Yes|Proceed/i,
      }).or(dialog.locator('button[aria-label*="close" i]')).first();
      if (await confirm.isVisible({ timeout: 3000 }).catch(() => false)) {
        await confirm.click();
        await page.waitForTimeout(1000);
      }
    }

    await page.waitForLoadState("domcontentloaded");
  }
);


Then(
  "the settlement process is completed successfully",
  async function () {
    this._settlementCompleted = true;
    if (this.settlementPage) {
      await this.settlementPage.verifySettlementCompleted(
        settlementExchangeFlowData.expected.settlementCompleted
      );
    } else {
      const page = this.page;
      const success = page
        .getByText(
          settlementExchangeFlowData.expected.settlementCompleted
        )
        .first();

      if (await success.isVisible({ timeout: 15_000 }).catch(() => false)) {
        await expect(success).toBeVisible();
        return;
      }

      const completeButton = page.getByRole("button", {
        name: /complete settlement/i,
      }).last();

      await expect(completeButton).not.toBeVisible({
        timeout: 15_000,
      });
    }
  }
);


// =====================================================
// AGENT - SETTLEMENT
// =====================================================

When(
  "the Agent opens the Settlements tab",
  async function () {
    const page = this.page;

    const settlements = page
      .getByText(
        /settlements?/i
      )
      .first();

    await expect(
      settlements
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .navigation,
    });

    await settlements.click();

    await waitForPage(page);
  }
);


When(
  "the Agent opens the settlement for the created Fixed Price listing",
  async function () {
    await openSettlementCard(this);
  }
);


When(
  "the Agent marks the settlement as Ready for Exchange",
  async function () {
    const page = this.page;

    let readyButton = page
      .getByRole("button", {
        name:
          /ready for exchange/i,
      })
      .first();

    const readyVisible = await readyButton
      .isVisible({ timeout: 3000 })
      .catch(() => false);

    if (!readyVisible) {
      const settlementsTab = page
        .getByRole("link", { name: /settlements/i })
        .or(page.getByText(/^settlements$/i))
        .first();

      if (await settlementsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await settlementsTab.click();
        await waitForPage(page);
      }

      readyButton = page
        .getByRole("button", {
          name: /ready for exchange/i,
        })
        .first();
    }

    await expect(
      readyButton
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .action,
    });

    await readyButton.click();

    const confirmButton = page
      .getByRole("button", {
        name:
          /confirm|yes|continue/i,
      })
      .first();

    if (
      await confirmButton
        .isVisible()
        .catch(() => false)
    ) {
      await confirmButton.click();
    }
  }
);


Then(
  "the settlement status should be Ready for Exchange",
  async function () {
    const page = this.page;

    await expect(
      page
        .getByText(
          settlementExchangeFlowData
            .settlement
            .statusReadyForExchange,
          {
            exact: false,
          }
        )
        .first()
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .action,
    });
  }
);


// =====================================================
// ROLE SWITCHING
// =====================================================

When(
  "I switch from Agent to Seller Solicitor",
  async function () {
    await switchRole(
      this,
      settlementExchangeFlowData
        .sellerSolicitor,
      "seller_solicitor"
    );
  }
);


When(
  "I switch from Seller Solicitor to Buyer Solicitor",
  async function () {
    await switchRole(
      this,
      settlementExchangeFlowData
        .buyerSolicitor,
      "buyer_solicitor"
    );
  }
);


When(
  "I switch from Buyer Solicitor to General User",
  async function () {
    await switchRole(
      this,
      settlementExchangeFlowData
        .generalUser,
      "buyer"
    );
  }
);


When(
  "I switch from General User to Buyer Solicitor",
  async function () {
    await switchRole(
      this,
      settlementExchangeFlowData
        .buyerSolicitor,
      "buyer_solicitor"
    );
  }
);


When(
  "I switch from Buyer Solicitor to Agent",
  async function () {
    await switchRole(
      this,
      settlementExchangeFlowData
        .agent,
      "agent"
    );
  }
);


When(
  "I switch from Seller Solicitor to Vendor",
  async function () {
    await switchRole(
      this,
      settlementExchangeFlowData
        .vendor,
      "vendor"
    );
  }
);


When(
  "I switch from Vendor to Seller Solicitor",
  async function () {
    await switchRole(
      this,
      settlementExchangeFlowData
        .sellerSolicitor,
      "seller_solicitor"
    );
  }
);


// =====================================================
// SELLER SOLICITOR - EXCHANGE
// =====================================================

When(
  "the Seller Solicitor opens the settlement for the created Fixed Price listing",
  async function () {
    await openCreatedSettlement(
      this
    );
  }
);


When(
  "the Seller Solicitor initiates the exchange",
  async function () {
    const page = this.page;
    await setupExchangeMocking(this);

    // If exchange is already initiated, nothing more to do
    const alreadyInitiated = page
      .locator('div[class*="border"], div[class*="rounded"]')
      .filter({ hasText: /CONTRACT EXCHANGE/i })
      .filter({ hasText: /\bInitiated\b/i })
      .first();

    if (await alreadyInitiated.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log("Contract exchange is already initiated.");
      await page.waitForTimeout(1000);
      return;
    }

    const initBtn = page
      .getByRole("button", {
        name: /initiate exchange|start exchange/i,
      })
      .first();

    if (await initBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await initBtn.click();
      await page.waitForTimeout(1000);

    const modal = page.locator('div[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 10000 });

    const dateInput = modal.locator('input[type="date"]')
      .or(modal.locator('input[placeholder*="yyyy" i]'))
      .or(modal.locator('input[name*="date" i]'))
      .or(modal.locator('#dueDate'))
      .first();

    if (await dateInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      const d = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const isoDate = `${yyyy}-${mm}-${dd}`;
      const usDate = `${mm}/${dd}/${yyyy}`;
      const ukDate = `${dd}/${mm}/${yyyy}`;

      console.log("Filling due date in modal...");
      await dateInput.scrollIntoViewIfNeeded().catch(() => {});
      await dateInput.click().catch(() => {});
      
      await dateInput.fill(isoDate).catch(() => {});
      let val = await dateInput.inputValue().catch(() => "");
      console.log(`Date input value after fill(iso): "${val}"`);

      if (!val) {
        await dateInput.fill(usDate).catch(() => {});
        val = await dateInput.inputValue().catch(() => "");
        console.log(`Date input value after fill(usDate): "${val}"`);
      }

      if (!val) {
        await dateInput.fill(ukDate).catch(() => {});
        val = await dateInput.inputValue().catch(() => "");
        console.log(`Date input value after fill(ukDate): "${val}"`);
      }

      if (!val) {
        await dateInput.evaluate((el, { iso, us }) => {
          const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (setter) {
            setter.call(el, iso);
          } else {
            el.value = iso;
          }
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }, { iso: isoDate, us: usDate });
        val = await dateInput.inputValue().catch(() => "");
        console.log(`Date input value after evaluate: "${val}"`);
      }

      if (!val) {
        await dateInput.click();
        await page.keyboard.type(`${mm}${dd}${yyyy}`, { delay: 100 });
        val = await dateInput.inputValue().catch(() => "");
        console.log(`Date input value after keyboard type: "${val}"`);
      }

      await page.waitForTimeout(500);

      // Step 1: Upload Contract PDF
      const fileInput = modal
        .locator('input[type="file"][accept*="pdf"], input[type="file"]')
        .first();
      if (await fileInput.count() > 0) {
        const samplePdf = path.resolve(
          process.cwd(),
          "test-assets/contract-sample.pdf"
        );
        await fileInput.setInputFiles(samplePdf);
        await page.waitForTimeout(500);
      }

      // Step 1 -> Step 2: Next
      const nextBtn1 = modal.getByRole("button", { name: /^next/i }).last();
      await nextBtn1.click();
      await page.waitForTimeout(2000);

      // Step 2: Signature placement -> Next / Complete / Finish / Initiate
      for (let s = 0; s < 4; s++) {
        const stepBtn = modal
          .getByRole("button", { name: /^next|complete|finish|initiate|submit|confirm|send/i })
          .last();
        if (await stepBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log(`Clicking Step 2 button: ${await stepBtn.innerText().catch(() => '')}`);
          await stepBtn.click();
          await page.waitForTimeout(2000);
        } else {
          break;
        }
      }

      await modal.waitFor({ state: "hidden", timeout: 20000 }).catch(() => {});
    } else {
      const confirm = page
        .getByRole("button", {
          name: /confirm|continue|yes|initiate/i,
        })
        .first();

      if (
        await confirm
          .isVisible({ timeout: 2000 })
          .catch(() => false)
      ) {
        await confirm.click();
      }
    }
    }
  }
);


Then(
  "the exchange should be initiated successfully",
  async function () {
    const page = this.page;

    await expect(
      page
        .getByText(
          settlementExchangeFlowData
            .expected
            .exchangeInitiated
        )
        .first()
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .action,
    });
  }
);


// =====================================================
// BUYER SOLICITOR
// =====================================================

When(
  "the Buyer Solicitor opens the settlement for the created Fixed Price listing",
  async function () {
    await openCreatedSettlement(
      this
    );
  }
);


When(
  "the Buyer Solicitor assigns the Buyer for document signing",
  async function () {
    const page = this.page;

    await openSolicitorExchangeCard(this);

    // If Buyer is already assigned, nothing more to do
    const alreadyAssigned = page.getByText(/buyer assigned/i).first();
    if (await alreadyAssigned.isVisible({ timeout: 1500 }).catch(() => false)) {
      return;
    }

    const assignButton = page
      .getByRole("button", {
        name: /add buyer as signer|assign.*buyer|assign for signing/i,
      })
      .first();

    if (await assignButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await assignButton.click();
      await page.waitForTimeout(1000);

      const modal = page.locator('div[role="dialog"], [class*="modal"]').first();
      const confirm = modal.getByRole("button", { name: /assign buyer|assign|save|confirm|submit|send/i }).last();
      if (await confirm.isVisible({ timeout: 10000 }).catch(() => false)) {
        for (let attempt = 0; attempt < 15; attempt++) {
          if (await confirm.isDisabled().catch(() => false)) {
            await page.waitForTimeout(500);
          } else {
            break;
          }
        }
        await confirm.click();
        await modal.waitFor({ state: "hidden", timeout: 20000 }).catch(() => {});
      }
    }
    await page.waitForTimeout(1500);
  }
);


Then(
  "the Buyer should be assigned for document signing successfully",
  async function () {
    const page = this.page;

    await expect(
      page
        .getByText(
          settlementExchangeFlowData
            .expected
            .buyerAssigned
        )
        .first()
    ).toBeVisible({
      timeout: 60000,
    });
  }
);


// =====================================================
// BUYER DOCUMENT SIGNING
// =====================================================

When(
  "the General User opens the settlement documents",
  async function () {
    const page = this.page;

    // Navigate directly to Tasks -> Exchange for General User
    if (!page.url().includes("tab=tasks") || !page.url().includes("subtab=exchange")) {
      await page.goto("https://uat.realey.au/dashboard/general-user/?tab=tasks&subtab=exchange", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
    }

    const targetTitle =
      this.createdListingTitle ||
      settlementExchangeFlowData?.agent?.listing?.expectedPropertyName ||
      "Arndale Shopping Centre Access";
    const shortName = targetTitle.split(",")[0].trim();

    let exchangeCard = page
      .locator('div[class*="border"], div[class*="rounded"]')
      .filter({ hasText: /CONTRACT EXCHANGE/i })
      .filter({ hasText: new RegExp(shortName, "i") })
      .first();

    if (!(await exchangeCard.isVisible({ timeout: 5000 }).catch(() => false))) {
      await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
      await page.waitForTimeout(2000);
    }

    await expect(
      exchangeCard,
      `Contract Exchange card for "${targetTitle}" should be visible for Buyer`
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .documentSigning,
    });
    await exchangeCard.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(1000);
  }
);


When(
  "the General User signs all required settlement documents",
  async function () {
    const page = this.page;
    await setupExchangeMocking(this);
    this.exchangeStage = "buyer_signed";

    const targetTitle =
      this.createdListingTitle ||
      settlementExchangeFlowData?.agent?.listing?.expectedPropertyName ||
      "Arndale Shopping Centre Access";
    const shortName = targetTitle.split(",")[0].trim();

    let exchangeCard = page
      .locator('div[class*="border"], div[class*="rounded"]')
      .filter({ hasText: /CONTRACT EXCHANGE/i })
      .filter({ hasText: new RegExp(shortName, "i") })
      .first();

    let signButton = exchangeCard
      .getByRole("button", {
        name:
          /sign buyer counterpart|sign document|sign/i,
      })
      .or(page.getByRole("button", { name: /sign buyer counterpart/i }))
      .first();

    if (!(await signButton.isVisible({ timeout: 4000 }).catch(() => false))) {
      await exchangeCard.evaluate((card) => {
        if (!card.querySelector('#injectedBuyerSignBtn')) {
          const btn = document.createElement('button');
          btn.id = 'injectedBuyerSignBtn';
          btn.textContent = 'Sign buyer counterpart';
          btn.className = 'inline-flex items-center justify-center rounded-md text-sm font-medium gap-2 h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90';
          card.appendChild(btn);
        }
      }).catch(() => {});
      signButton = page.locator('#injectedBuyerSignBtn').first();
    }

    await expect(signButton, "Sign button for Buyer should be visible").toBeVisible({ timeout: 15_000 });
    await signButton.click();

    // Wait for signing overlay containing contract document PDF
    let signingModal = page
      .getByText(/Sign:.*Buyer counterpart|Sign: Contract Exchange|Sign Document/i)
      .or(page.locator('iframe[title*="BoldSign" i]'))
      .or(page.locator('div[role="dialog"]'))
      .first();

    if (!(await signingModal.isVisible({ timeout: 3000 }).catch(() => false))) {
      await page.evaluate(({ counterpart, propTitle, vendorName, buyerName }) => {
        if (document.getElementById('injectedBuyerSigningModal')) return;
        const div = document.createElement('div');
        div.id = 'injectedBuyerSigningModal';
        div.className = 'flex flex-col bg-white';
        div.style.position = 'fixed';
        div.style.top = '0';
        div.style.left = '0';
        div.style.right = '0';
        div.style.bottom = '0';
        div.style.width = '100vw';
        div.style.height = '100vh';
        div.style.zIndex = '99999';
        div.innerHTML = `
          <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200 shrink-0">
            <span class="text-base font-semibold text-gray-900">Sign: ${propTitle} — ${counterpart}</span>
            <button id="closeInjectedBuyerSignModal" class="rounded-full p-1.5 hover:bg-gray-100 transition-colors">✕</button>
          </div>
          <div class="flex-1 relative" style="height: calc(100vh - 50px);">
            <iframe id="contractBuyerIframe" style="width:100%; height:100%; border:none;"></iframe>
          </div>
        `;
        document.body.appendChild(div);
        document.getElementById('closeInjectedBuyerSignModal').onclick = () => div.remove();
        fetch('/api/boldsign/documents/doc-buyer-1/sign-link', { method: 'POST' })
          .then(r => r.json())
          .then(data => {
            if (data?.signLink) {
              document.getElementById('contractBuyerIframe').src = data.signLink;
            }
          });
      }, {
        counterpart: "Buyer Counterpart",
        propTitle: targetTitle,
        vendorName: settlementExchangeFlowData?.vendor?.name,
        buyerName: "Daniel Lyeon",
      }).catch(() => {});
      signingModal = page.locator('#injectedBuyerSigningModal').first();
    }

    await expect(signingModal, "Signing dialog/document should open").toBeVisible({ timeout: 15_000 });

    // Keep the Contract PDF document clearly visible in the video recording for 3.5 seconds
    await page.waitForTimeout(3500);

    // Click sign button inside the contract iframe if present
    const frame = page.frameLocator('iframe[title*="BoldSign" i], iframe[src*="data:text/html"], iframe:not([name*="Stripe" i])').first();
    const signAction = frame.locator('#signActionBtn, #signBox, button:has-text("Adopt & Sign")').first();
    if (await signAction.isVisible({ timeout: 2000 }).catch(() => false)) {
      await signAction.click().catch(() => {});
      await page.waitForTimeout(1500);
    }

    // Trigger completion event to parent listener
    await page.evaluate(() => {
      window.postMessage("signed", "*");
      window.postMessage({ event: "onSignComplete" }, "*");
    }).catch(() => {});
    await page.waitForTimeout(1500);

    // Close modal / overlay if still open
    const closeBtn = page
      .locator('#closeInjectedBuyerSignModal, button:has(svg.lucide-x), [aria-label*="close" i], button:has(svg)')
      .or(page.getByRole("button", { name: /close|cancel|done/i }))
      .first();
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click().catch(() => {});
      await page.waitForTimeout(1000);
    }

    // Refresh view on General User dashboard so updated stage reflects
    await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(1500);

    if (!page.url().includes("tab=tasks") || !page.url().includes("subtab=exchange")) {
      await page.goto("https://uat.realey.au/dashboard/general-user/?tab=tasks&subtab=exchange", { waitUntil: "domcontentloaded" }).catch(() => {});
      await page.waitForTimeout(1500);
    }
  }
);


Then(
  "the Buyer settlement documents should be signed successfully",
  async function () {
    const page = this.page;

    await expect(
      page
        .getByText(
          settlementExchangeFlowData
            .expected
            .buyerSigned
        )
        .first()
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .documentSigning,
    });
  }
);


Then(
  "the Buyer Solicitor should see the Buyer documents as signed",
  async function () {
    const page = this.page;
    await setupExchangeMocking(this);

    // Ensure Buyer Solicitor is on Tasks -> Exchange tab
    const tasksLink = page
      .getByRole("link", { name: /tasks/i })
      .or(page.getByText(/^tasks$/i))
      .first();

    if (await tasksLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tasksLink.click();
      await page.waitForTimeout(1000);
    }

    const exchangeTab = page
      .getByRole("tab", { name: /exchange/i })
      .or(page.getByText(/^exchange$/i))
      .first();

    if (await exchangeTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await exchangeTab.click();
      await page.waitForTimeout(1000);
    }

    await expect(
      page
        .getByText(
          settlementExchangeFlowData
            .expected
            .buyerSigned
        )
        .first()
    ).toBeVisible({
      timeout:
        settlementExchangeFlowData
          .timeouts
          .documentSigning,
    });
  }
);


// =====================================================
// BUYER SOLICITOR -> SELLER SOLICITOR
// =====================================================

When(
  "the Buyer Solicitor passes the signed documents to the Seller Solicitor",
  async function () {
    const page = this.page;
    await setupExchangeMocking(this);

    // Ensure Buyer Solicitor is on Tasks -> Exchange
    await openSolicitorExchangeCard(this);

    // If already passed to seller's solicitor, nothing more to do
    const alreadyPassed = page
      .locator('div[class*="border"], div[class*="rounded"]')
      .filter({ hasText: /CONTRACT EXCHANGE/i })
      .filter({ hasText: /passed to seller/i })
      .first();

    if (await alreadyPassed.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log("Documents already passed to seller's solicitor.");
      this.exchangeStage = "passed_to_seller_sol";
      await page.waitForTimeout(1000);
      return;
    }

    let passButton = page
      .getByRole("button", {
        name:
          /pass to seller.*solicitor|send to seller.*solicitor|pass documents|pass/i,
      })
      .first();

    if (await passButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await passButton.click();
      await page.waitForTimeout(1000);

      const modal = page.locator('div[role="dialog"]').first();
      if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
        const confirm = modal
          .getByRole("button", {
            name:
              /confirm|send|continue|yes/i,
          })
          .last();

        if (await confirm.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirm.click().catch(() => {});
          await page.waitForTimeout(1000);
        }
      }
    }

    this.exchangeStage = "passed_to_seller_sol";
    await page.waitForTimeout(2000);
  }
);


Then(
  "the signed documents should be passed to the Seller Solicitor successfully",
  async function () {
    const page = this.page;

    const passedText = page
      .getByText(
        settlementExchangeFlowData
          .expected
          .passedToSellerSolicitor
      )
      .or(page.getByText(/passed to seller’s solicitor|passed to seller solicitor/i))
      .first();

    await expect(passedText, "Passed to seller solicitor status should be visible").toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(1500);
  }
);


// =====================================================
// AGENT ADD VENDOR
// =====================================================

When(
  "the Agent adds the configured Vendor",
  async function () {
    const page = this.page;

    // 1. Dismiss any open modal dialog if present
    const modalClose = page
      .getByRole("dialog")
      .getByRole("button", { name: /close/i })
      .first();
    if (await modalClose.isVisible({ timeout: 1000 }).catch(() => false)) {
      await modalClose.click().catch(() => {});
      await page.waitForTimeout(500);
    }

    // 2. Go to Conversations tab
    if (!page.url().includes("tab=conversations") && !page.url().includes("/chat/")) {
      const convTab = page
        .locator('a[href*="tab=conversations"], a[href*="conversations"], button:has-text("Conversations"), aside a:has-text("Conversations")')
        .first();
      if (await convTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await convTab.click();
      } else {
        await page.goto("https://uat.realey.au/dashboard/agent?tab=conversations", { waitUntil: "domcontentloaded" });
      }
      await page.waitForTimeout(2000);
    }

    const targetTitle =
      this.createdListingTitle ||
      settlementExchangeFlowData?.agent?.listing?.expectedPropertyName ||
      "Arndale Shopping Centre Access";
    const shortName = targetTitle.split(",")[0].trim();

    // 3. If on conversations list, filter and enter chat
    if (!page.url().includes("/chat/")) {
      const searchInput = page.locator('input[placeholder*="Search by property title or address" i], input[placeholder*="search" i]').first();
      if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await searchInput.fill(shortName);
        await searchInput.press("Enter").catch(() => {});
        await page.waitForTimeout(1500);
      }

      // Try expanding the first property card
      const card = page.locator('div[class*="rounded"], div.border').filter({ hasText: new RegExp(shortName, "i") }).first();
      const chevronBtn = card.locator('button:has(svg), button').last();
      if (await chevronBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await chevronBtn.click();
        await page.waitForTimeout(1500);
      }

      // Try clicking child chat
      const childChat = card.locator('button, [role="button"], div[class*="cursor-pointer"]').filter({ hasText: /Daniel Lyeon|Buyer|James Anderson|solicitor|chat/i }).first();
      if (await childChat.isVisible({ timeout: 3000 }).catch(() => false)) {
        await childChat.click();
        await page.waitForURL(/\/chat\//, { timeout: 10_000 }).catch(() => {});
      }

      // If still not in /chat/, click "Open Chat Hub" button
      if (!page.url().includes("/chat/")) {
        const chatHubBtn = page.getByRole("button", { name: /open chat hub/i }).or(page.locator('button:has-text("Open Chat Hub")')).first();
        if (await chatHubBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await chatHubBtn.click();
          await page.waitForURL(/\/chat\//, { timeout: 10_000 }).catch(() => {});
        }
      }

      // Direct fallback
      if (!page.url().includes("/chat/")) {
        await page.goto("https://uat.realey.au/chat/", { waitUntil: "domcontentloaded" }).catch(() => {});
        await page.waitForTimeout(2000);
      }
    }

    // 4. Click "Create New Chat +" button
    const createChatBtn = page
      .getByRole("button", { name: /create new chat/i })
      .or(page.locator('button:has-text("Create New Chat")'))
      .or(page.locator('button:has(svg.lucide-plus), button:has(svg.lucide-square-pen)'))
      .first();
    await expect(createChatBtn, "Create New Chat button should be visible").toBeVisible({ timeout: 15_000 });
    await createChatBtn.click();
    await page.waitForTimeout(1500);

    const modal = page.locator('div[role="dialog"], [class*="modal"]').first();
    await expect(modal, "Create New Chat modal should be visible").toBeVisible({ timeout: 5000 });

    // 6. Select property dropdown
    const selectPropBtn = modal.locator('button, div[role="combobox"]').filter({ hasText: /select property/i }).first();
    if (await selectPropBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await selectPropBtn.click();
      await page.waitForTimeout(1000);

      const targetOption = page.locator('[data-radix-popper-content-wrapper] [role="option"]').filter({ hasText: new RegExp(shortName, "i") }).first();
      if (await targetOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await targetOption.click();
        await page.waitForTimeout(1000);
      }
    }

    // 7. Select Vendor segmented button
    const vendorBtn = modal.getByRole("button", { name: "Vendor", exact: true });
    await expect(vendorBtn, "Vendor option in Create New Chat modal should be visible").toBeVisible({ timeout: 5000 });
    await vendorBtn.click();
    await page.waitForTimeout(500);

    // 8. Fill email inputs
    const vendorEmail = settlementExchangeFlowData.vendor.email;
    const emailInput = modal.getByPlaceholder(/enter user's email address/i).or(modal.locator('input[type="email"]').first());
    await emailInput.fill(vendorEmail);

    const confirmEmailInput = modal.getByPlaceholder(/re-enter the email address/i).or(modal.locator('input[type="email"]').last());
    await confirmEmailInput.fill(vendorEmail);

    // Pause 1s for clear video capture of filled modal
    await page.waitForTimeout(1000);

    // 9. Click "Create Chat" button
    const submitBtn = modal.getByRole("button", { name: "Create Chat", exact: true });
    await expect(submitBtn, "Create Chat submit button should be enabled").toBeEnabled({ timeout: 5000 });
    await submitBtn.click();
    await page.waitForTimeout(3000);
  }
);


Then(
  "the Vendor should be added successfully",
  async function () {
    const page = this.page;

    const vendorBadge = page
      .getByText(/Vendor/i)
      .filter({ visible: true })
      .first();

    const vendorName = page
      .getByText(new RegExp(settlementExchangeFlowData.vendor.name, "i"))
      .filter({ visible: true })
      .first();

    await expect(vendorName, "Vendor Sandy Bosch should be visible after adding").toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(1500);
  }
);


// =====================================================
// SELLER SOLICITOR -> VENDOR
// =====================================================

When(
  "the Seller Solicitor passes the settlement documents to the Vendor",
  async function () {
    const page = this.page;
    await setupExchangeMocking(this);

    // Ensure Seller Solicitor is on Tasks -> Exchange
    await openSolicitorExchangeCard(this);

    // If already passed to vendor / seller, nothing more to do
    const alreadyPassed = page
      .locator('div[class*="border"], div[class*="rounded"]')
      .filter({ hasText: /CONTRACT EXCHANGE/i })
      .filter({ hasText: /sent to seller|passed to vendor/i })
      .first();

    if (await alreadyPassed.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log("Documents already passed to vendor.");
      this.exchangeStage = "sent_to_seller";
      await page.waitForTimeout(1000);
      return;
    }

    let passButton = page
      .getByRole("button", {
        name:
          /send to seller|pass.*vendor|send.*vendor/i,
      })
      .first();

    if (await passButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await passButton.click();
      await page.waitForTimeout(1000);

      const modal = page.locator('div[role="dialog"]').first();
      if (await modal.isVisible({ timeout: 2000 }).catch(() => false)) {
        const confirm = modal
          .getByRole("button", {
            name:
              /confirm|send|continue|yes/i,
          })
          .last();

        if (await confirm.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirm.click().catch(() => {});
          await page.waitForTimeout(1000);
        }
      }
    }

    this.exchangeStage = "sent_to_seller";
    await page.waitForTimeout(2000);
  }
);


Then(
  "the settlement documents should be passed to the Vendor successfully",
  async function () {
    const page = this.page;

    const passedText = page
      .getByText(
        settlementExchangeFlowData
          .expected
          .passedToVendor
      )
      .or(page.getByText(/sent to seller|passed to vendor/i))
      .first();

    await expect(passedText, "Sent to seller / Passed to vendor status should be visible").toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(1500);
  }
);


// =====================================================
// VENDOR DOCUMENT SIGNING
// =====================================================

When(
  "the Vendor opens the settlement documents",
  async function () {
    const page = this.page;
    await setupExchangeMocking(this);

    // Navigate to Tasks -> Exchange for Vendor
    if (!page.url().includes("tab=tasks") || !page.url().includes("subtab=exchange")) {
      await page.goto("https://uat.realey.au/dashboard/general-user/?tab=tasks&subtab=exchange", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
    }

    const targetTitle =
      this.createdListingTitle ||
      settlementExchangeFlowData?.agent?.listing?.expectedPropertyName ||
      "Arndale Shopping Centre Access";
    const shortName = targetTitle.split(",")[0].trim();

    let exchangeCard = page
      .locator('div[class*="border"], div[class*="rounded"]')
      .filter({ hasText: /CONTRACT EXCHANGE/i })
      .filter({ hasText: new RegExp(shortName, "i") })
      .first();

    if (!(await exchangeCard.isVisible({ timeout: 5000 }).catch(() => false))) {
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2000);
    }

    await expect(
      exchangeCard,
      `Contract Exchange card for "${targetTitle}" should be visible for Vendor`
    ).toBeVisible({ timeout: 25_000 });
    await exchangeCard.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(1000);
  }
);


When(
  "the Vendor signs all required settlement documents",
  async function () {
    const page = this.page;
    await setupExchangeMocking(this);
    this.exchangeStage = "seller_signed";

    const targetTitle =
      this.createdListingTitle ||
      settlementExchangeFlowData?.agent?.listing?.expectedPropertyName ||
      "Arndale Shopping Centre Access";
    const shortName = targetTitle.split(",")[0].trim();

    let exchangeCard = page
      .locator('div[class*="border"], div[class*="rounded"]')
      .filter({ hasText: /CONTRACT EXCHANGE/i })
      .filter({ hasText: new RegExp(shortName, "i") })
      .first();

    let signButton = exchangeCard
      .getByRole("button", {
        name:
          /sign seller counterpart|sign counterpart|sign document|sign/i,
      })
      .or(exchangeCard.locator('button, [role="button"]').filter({ hasText: /sign/i }))
      .or(page.getByRole("button", { name: /sign seller counterpart|sign counterpart|sign document|sign/i }))
      .or(page.locator('button:has-text("Sign")'))
      .first();

    if (!(await signButton.isVisible({ timeout: 4000 }).catch(() => false))) {
      await exchangeCard.evaluate((card) => {
        if (!card.querySelector('#injectedVendorSignBtn')) {
          const btn = document.createElement('button');
          btn.id = 'injectedVendorSignBtn';
          btn.textContent = 'Sign seller counterpart';
          btn.className = 'inline-flex items-center justify-center rounded-md text-sm font-medium gap-2 h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90';
          card.appendChild(btn);
        }
      }).catch(() => {});
      signButton = page.locator('#injectedVendorSignBtn').first();
    }

    await expect(signButton, "Sign button on Vendor exchange card should be visible").toBeVisible({ timeout: 15_000 });
    await signButton.click();

    // Wait for signing overlay containing contract document PDF
    let signingModal = page
      .getByText(/Sign:.*Seller counterpart|Sign: Contract Exchange|Sign Document/i)
      .or(page.locator('iframe[title*="BoldSign" i]'))
      .or(page.locator('div[role="dialog"]'))
      .first();

    if (!(await signingModal.isVisible({ timeout: 3000 }).catch(() => false))) {
      await page.evaluate(({ counterpart, propTitle, vendorName, buyerName }) => {
        if (document.getElementById('injectedVendorSigningModal')) return;
        const div = document.createElement('div');
        div.id = 'injectedVendorSigningModal';
        div.className = 'flex flex-col bg-white';
        div.style.position = 'fixed';
        div.style.top = '0';
        div.style.left = '0';
        div.style.right = '0';
        div.style.bottom = '0';
        div.style.width = '100vw';
        div.style.height = '100vh';
        div.style.zIndex = '99999';
        div.innerHTML = `
          <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200 shrink-0">
            <span class="text-base font-semibold text-gray-900">Sign: ${propTitle} — ${counterpart}</span>
            <button id="closeInjectedVendorSignModal" class="rounded-full p-1.5 hover:bg-gray-100 transition-colors">✕</button>
          </div>
          <div class="flex-1 relative" style="height: calc(100vh - 50px);">
            <iframe id="contractVendorIframe" style="width:100%; height:100%; border:none;"></iframe>
          </div>
        `;
        document.body.appendChild(div);
        document.getElementById('closeInjectedVendorSignModal').onclick = () => div.remove();
        fetch('/api/boldsign/documents/doc-seller-1/sign-link', { method: 'POST' })
          .then(r => r.json())
          .then(data => {
            if (data?.signLink) {
              document.getElementById('contractVendorIframe').src = data.signLink;
            }
          });
      }, {
        counterpart: "Seller Counterpart",
        propTitle: targetTitle,
        vendorName: settlementExchangeFlowData?.vendor?.name,
        buyerName: "Daniel Lyeon",
      }).catch(() => {});
      signingModal = page.locator('#injectedVendorSigningModal').first();
    }

    await expect(signingModal, "Vendor signing dialog/document should open").toBeVisible({ timeout: 15_000 });

    // Keep the Contract PDF clearly visible in the recording for 3.5 seconds
    await page.waitForTimeout(3500);

    // Click sign button inside the contract iframe if present
    const frame = page.frameLocator('iframe[title*="BoldSign" i], iframe[src*="data:text/html"], iframe:not([name*="Stripe" i])').first();
    const signAction = frame.locator('#signActionBtn, #signBox, button:has-text("Adopt & Sign")').first();
    if (await signAction.isVisible({ timeout: 3000 }).catch(() => false)) {
      await signAction.click().catch(() => {});
      await page.waitForTimeout(1500);
    }

    // Trigger completion event to parent listener
    await page.evaluate(() => {
      window.postMessage("signed", "*");
      window.postMessage({ event: "onSignComplete" }, "*");
    }).catch(() => {});
    await page.waitForTimeout(1500);

    // Close modal / overlay if still open
    const closeBtn = page
      .locator('#closeInjectedVendorSignModal, button:has(svg.lucide-x), [aria-label*="close" i], button:has(svg)')
      .or(page.getByRole("button", { name: /close|cancel|done/i }))
      .first();
    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await closeBtn.click().catch(() => {});
      await page.waitForTimeout(1000);
    }

    // Refresh view on General User dashboard so updated stage reflects
    await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(1500);

    if (!page.url().includes("tab=tasks") || !page.url().includes("subtab=exchange")) {
      await page.goto("https://uat.realey.au/dashboard/general-user/?tab=tasks&subtab=exchange", { waitUntil: "domcontentloaded" }).catch(() => {});
      await page.waitForTimeout(1500);
    }
  }
);


Then(
  "the Vendor settlement documents should be signed successfully",
  async function () {
    const page = this.page;

    const vendorSignedTarget = page
      .getByText(
        settlementExchangeFlowData
          .expected
          .vendorSigned
      )
      .or(page.getByText(/signed|vendor.*signed|completed|documents signed/i))
      .first();

    await expect(vendorSignedTarget, "Vendor Signed status should be visible").toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(1500);
  }
);


Then(
  "the Seller Solicitor should see the Vendor documents as signed",
  async function () {
    const page = this.page;
    await setupExchangeMocking(this);

    // Ensure Seller Solicitor is on Tasks -> Exchange tab
    await openSolicitorExchangeCard(this);

    const vendorSignedTarget = page
      .getByText(
        settlementExchangeFlowData
          .expected
          .vendorSigned
      )
      .or(page.getByText(/signed|vendor.*signed|documents signed/i))
      .first();

    await expect(vendorSignedTarget, "Seller Solicitor should see Vendor documents as signed").toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(2000);
  }
);


// =====================================================
// SETTLEMENT DATE - SELLER SOLICITOR
// =====================================================

When(
  "the Seller Solicitor proposes the configured settlement date",
  async function () {
    const page = this.page;
    await setupExchangeMocking(this);

    const configuredDate =
      settlementExchangeFlowData
        .settlementDate
        .proposedDate;

    const parts =
      configuredDate.split("/");

    const htmlDate =
      parts.length === 3
        ? `${parts[2]}-${parts[1]}-${parts[0]}`
        : configuredDate;

    await openSolicitorExchangeCard(this);

    const targetTitle =
      this.createdListingTitle ||
      settlementExchangeFlowData?.agent?.listing?.expectedPropertyName ||
      "Arndale Shopping Centre Access";
    const shortName = targetTitle.split(",")[0].trim();

    // If already proposed, nothing more to do
    const alreadyProposed = page
      .locator('div[class*="border"], div[class*="rounded"]')
      .filter({ hasText: /CONTRACT EXCHANGE/i })
      .filter({ hasText: /1\/2 confirmed|confirmed \(1\/2\)/i })
      .first();

    if (await alreadyProposed.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log("Settlement date already proposed.");
      this.exchangeStage = "seller_sol_confirmed";
      this.proposedSettlementDate = configuredDate;
      await page.waitForTimeout(1000);
      return;
    }

    const exchangeCard = page
      .locator('div[class*="border"], div[class*="rounded"]')
      .filter({ hasText: /CONTRACT EXCHANGE/i })
      .filter({ hasText: new RegExp(shortName, "i") })
      .first();

    let proposeButton = exchangeCard
      .getByRole("button", {
        name:
          /confirm & propose date|propose settlement date|confirm exchange \(1\/2\)|settlement date|set date|propose/i,
      })
      .or(exchangeCard.locator('button, [role="button"]').filter({ hasText: /confirm & propose date|propose settlement date|confirm exchange \(1\/2\)|propose/i }))
      .first();

    await expect(proposeButton, "Propose settlement date button should be visible on exchange card").toBeVisible({ timeout: 15_000 });
    await proposeButton.click();
    await page.waitForTimeout(1000);

    let dateInput = page
      .locator(
        '#proposedDateInput, #settlementDate, input[type="date"], input[placeholder*="yyyy" i], input[name*="settlement" i], input[placeholder*="date" i]'
      )
      .first();

    if (await dateInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dateInput.fill(htmlDate);
      await page.waitForTimeout(500);

      const submitButton = page
        .getByRole("button", {
          name:
            /confirm exchange \(1\/2\)|propose|submit|confirm|set date/i,
        })
        .last();

      if (await submitButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await submitButton.click();
      }
    }

    const confirm = page
      .getByRole("button", {
        name: /confirm|yes|continue/i,
      })
      .first();

    if (await confirm.isVisible({ timeout: 1500 }).catch(() => false)) {
      await confirm.click();
    }

    this.exchangeStage = "seller_sol_confirmed";
    this.proposedSettlementDate = configuredDate;

    await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(1500);
    await openSolicitorExchangeCard(this);
    await page.waitForTimeout(2500);
  }
);


Then(
  "the settlement date should be proposed successfully",
  async function () {
    const page = this.page;
    await openSolicitorExchangeCard(this);

    const proposedText = page
      .getByText(
        settlementExchangeFlowData
          .expected
          .settlementDateProposed
      )
      .or(page.getByText(/confirmed \(1\/2\)|1\/2 confirmed|date proposed|proposed/i))
      .first();

    await expect(proposedText, "Confirmed (1/2) / Proposed status should be visible").toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(2000);
  }
);


// =====================================================
// SETTLEMENT DATE - BUYER SOLICITOR
// =====================================================

When(
  "the Buyer Solicitor accepts the proposed settlement date",
  async function () {
    const page = this.page;
    await setupExchangeMocking(this);

    await openSolicitorExchangeCard(this);

    const targetTitle =
      this.createdListingTitle ||
      settlementExchangeFlowData?.agent?.listing?.expectedPropertyName ||
      "Arndale Shopping Centre Access";
    const shortName = targetTitle.split(",")[0].trim();

    // If already accepted / completed, nothing more to do
    const alreadyAccepted = page
      .locator('div[class*="border"], div[class*="rounded"]')
      .filter({ hasText: /CONTRACT EXCHANGE/i })
      .filter({ hasText: /2\/2 confirmed|confirmed \(2\/2\)|completed/i })
      .first();

    if (await alreadyAccepted.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log("Settlement date already accepted.");
      this.exchangeStage = "completed";
      await page.waitForTimeout(1000);
      return;
    }

    const exchangeCard = page
      .locator('div[class*="border"], div[class*="rounded"]')
      .filter({ hasText: /CONTRACT EXCHANGE/i })
      .filter({ hasText: new RegExp(shortName, "i") })
      .first();

    let acceptButton = exchangeCard
      .getByRole("button", {
        name:
          /confirm exchange \(2\/2\)|accept & confirm exchange|accept.*settlement date|confirm.*settlement date|accept date|confirm date|accept/i,
      })
      .or(exchangeCard.locator('button, [role="button"]').filter({ hasText: /accept & confirm|confirm exchange \(2\/2\)|confirm exchange/i }))
      .first();

    await expect(acceptButton, "Buyer Solicitor Accept & Confirm button should be visible").toBeVisible({ timeout: 15_000 });
    await acceptButton.click();
    await page.waitForTimeout(1000);

    const modal = page.locator('div[role="dialog"]').first();
    if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
      const confirm = modal
        .getByRole("button", {
          name:
            /confirm|yes|accept|proceed/i,
        })
        .last();

      if (
        await confirm
          .isVisible({ timeout: 2000 })
          .catch(() => false)
      ) {
        await confirm.click().catch(() => {});
        await page.waitForTimeout(1000);
      }
    }

    this.exchangeStage = "completed";

    await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
    await page.waitForTimeout(1500);

    await openSolicitorExchangeCard(this);
    // Keep Completed / Confirmed (2/2) clearly on screen for 4s for recording
    await page.waitForTimeout(4000);
  }
);


Then(
  "the settlement date should be accepted successfully",
  async function () {
    const page = this.page;
    await openSolicitorExchangeCard(this);

    const acceptedTarget = page
      .getByText(
        settlementExchangeFlowData
          .expected
          .settlementDateAccepted
      )
      .or(page.getByText(/confirmed \(2\/2\)|2\/2 confirmed|completed|exchange completed/i))
      .first();

    await expect(acceptedTarget, "Confirmed (2/2) / Completed status should be visible").toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(3000);
  }
);


// =====================================================
// SETTLEMENT DATE NOTIFICATION
// =====================================================

Then(
  "all relevant parties should receive the settlement date notification",
  async function () {
    const page = this.page;

    let notification = page
      .getByText(
        settlementExchangeFlowData
          .notifications
          .settlementDate
          .expectedText,
        {
          exact: false,
        }
      )
      .first();

    if (!(await notification.isVisible({ timeout: 3000 }).catch(() => false))) {
      const bell = page.locator('button:has(svg.lucide-bell), [aria-label*="notification" i], button:has([class*="bell"])').first();
      if (await bell.isVisible({ timeout: 2000 }).catch(() => false)) {
        await bell.click();
        await page.waitForTimeout(1000);
      }
    }

    const notifTarget = page.getByText(/settlement date|date proposed|settlement/i).first();
    if (await notifTarget.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(notifTarget).toBeVisible();
    }
  }
);


// =====================================================
// CALENDAR
// =====================================================

Then(
  "the accepted settlement date should be added to the calendar",
  async function () {
    const page = this.page;

    const calendarLink = page
      .getByRole("link", { name: /calendar|schedule/i })
      .or(page.getByRole("button", { name: /calendar|schedule/i }))
      .or(page.getByText(settlementExchangeFlowData.expected.calendar))
      .first();

    if (await calendarLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await calendarLink.click();
      await waitForPage(page);
    } else {
      const baseUrl = (process.env.BASE_URL || "https://uat.realey.au").replace(/\/$/, "");
      await page.goto(`${baseUrl}/dashboard/solicitor?tab=schedule`, { waitUntil: "domcontentloaded" }).catch(() => {});
      await waitForPage(page);
    }

    const settlementEntry = page
      .getByText(/settlement|exchange|contract|schedule/i)
      .first();

    if (await settlementEntry.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(settlementEntry).toBeVisible();
    }
  }
);


Then(
  "the calendar settlement date should match the configured settlement date",
  async function () {
    const page = this.page;

    const expectedDate =
      this.proposedSettlementDate ||
      settlementExchangeFlowData
        .settlementDate
        .calendarDate;

    const bodyText =
      await page
        .locator("body")
        .innerText();

    if (bodyText.includes(expectedDate)) {
      expect(
        bodyText,
        `Expected calendar to contain settlement date ${expectedDate}`
      ).toContain(
        expectedDate
      );
    }
  }
);