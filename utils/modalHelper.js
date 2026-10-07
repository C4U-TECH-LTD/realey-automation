/**
 * Reusable helper to dismiss "Welcome to Realey" or "Enable Notification" popup modals.
 * Supports clicking Cross (✕), Skip, or Later / Not now across any profile.
 */
async function dismissWelcomeAndNotificationModals(page, options = {}) {
  if (!page || typeof page.locator !== "function") return;
  const timeout = options.timeout || 3000;

  try {
    const modalSelector = '[role="dialog"], div.fixed[class*="z-"]';
    const modal = page
      .locator(modalSelector)
      .filter({
        hasText: /Welcome to Realey|enable.*notification|never miss a message|turn on notification|please configure the progress to continue/i,
      })
      .first();

    if (await modal.isVisible({ timeout }).catch(() => false)) {
      console.log("[ModalHelper] Welcome/Notification modal detected, attempting dismissal...");

      // 1. Try Cross / Close button
      const closeBtn = modal
        .locator(
          'button.absolute.right-3.top-3, button.absolute, button:has(svg.lucide-x), [aria-label*="close" i], button:has-text("✕"), button:has-text("×")'
        )
        .or(modal.getByRole("button", { name: /^close$/i }))
        .first();

      if (await closeBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
        console.log("[ModalHelper] Clicking cross (✕) button...");
        await closeBtn.click().catch(() => {});
      } else {
        // 2. Try Skip button
        const skipBtn = modal
          .getByRole("button", { name: /^skip/i })
          .or(modal.locator('button:has-text("Skip")'))
          .first();

        if (await skipBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
          console.log("[ModalHelper] Clicking 'Skip' button...");
          await skipBtn.click().catch(() => {});
        } else {
          // 3. Try Later / Not now button
          const laterBtn = modal
            .getByRole("button", { name: /later|not now/i })
            .or(
              modal.locator(
                'button:has-text("Later"), button:has-text("Maybe later"), button:has-text("Not now"), button:has-text("Ask me later")'
              )
            )
            .first();

          if (await laterBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
            console.log("[ModalHelper] Clicking 'Later' / 'Not now' button...");
            await laterBtn.click().catch(() => {});
          }
        }
      }

      await modal.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
      console.log("[ModalHelper] Modal dismissed successfully.");
    }
  } catch (err) {
    console.warn("[ModalHelper] Error during modal dismissal:", err.message);
  }
}

module.exports = {
  dismissWelcomeAndNotificationModals,
};
