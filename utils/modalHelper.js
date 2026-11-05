/**
 * Reusable helper to dismiss "Welcome to Realey" or "Enable Notification" popup modals.
 * Supports clicking Cross (✕), Skip, or Later / Not now across any profile.
 */
async function dismissWelcomeAndNotificationModals(page, options = {}) {
  if (!page || typeof page.locator !== "function") return;
  const timeout = options.timeout || 3000;

  try {
    for (let i = 0; i < 5; i++) {
      let dismissedAny = false;

      // 1. Check for "Never miss a message" / Notification modal first (it overlays everything)
      const notNowBtn = page.locator('button:has-text("Not now"), button:has-text("Later"), button:has-text("Maybe later")').first();
      if (await notNowBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        console.log("[ModalHelper] Notification modal detected, clicking 'Not now'...");
        await notNowBtn.click({ force: true }).catch(() => {});
        dismissedAny = true;
        await page.waitForTimeout(500);
      }

      // 2. Check for "Please configure the progress" or other dialogs
      const dialog = page.locator('[role="dialog"]').first();
      if (await dialog.isVisible({ timeout: 500 }).catch(() => false)) {
        console.log("[ModalHelper] Open dialog detected, attempting to dismiss...");
        const closeBtn = dialog.locator('button:has(svg.lucide-x), button.absolute.right-3.top-3, button.absolute.right-4.top-4, button:has-text("✕"), button:has-text("×")').first();
        if (await closeBtn.isVisible({ timeout: 500 }).catch(() => false)) {
          console.log("[ModalHelper] Clicking dialog close button...");
          await closeBtn.click({ force: true }).catch(() => {});
          dismissedAny = true;
          await page.waitForTimeout(500);
        } else {
          const closeTextBtn = dialog.getByRole('button', { name: /^close$/i }).or(dialog.locator('button:has-text("Close")')).first();
          if (await closeTextBtn.isVisible({ timeout: 500 }).catch(() => false)) {
            console.log("[ModalHelper] Clicking dialog 'Close' text button...");
            await closeTextBtn.click({ force: true }).catch(() => {});
            dismissedAny = true;
            await page.waitForTimeout(500);
          }
        }
      }

      // 3. Check for any remaining modal backdrop
      const backdrop = page.locator('div.fixed.inset-0.z-\\[99\\], div.fixed[class*="bg-black/80"]').first();
      if (!dismissedAny && !(await backdrop.isVisible({ timeout: 500 }).catch(() => false))) {
        break;
      }
      await page.waitForTimeout(300);
    }
    console.log("[ModalHelper] Modal dismissal phase finished.");
  } catch (err) {
    console.warn("[ModalHelper] Error during modal dismissal:", err.message);
  }
}

module.exports = {
  dismissWelcomeAndNotificationModals,
};
