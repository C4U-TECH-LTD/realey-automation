const { expect } = require('@playwright/test');
const { dismissWelcomeAndNotificationModals } = require('../utils/modalHelper');

class AgentboxIntegrationsPage {
  constructor(page) {
    this.page = page;

    // Navigation & Status
    this.integrationsMenu = page.locator('aside, nav, [class*="sidebar"]').getByText('Integrations', { exact: true });
    this.agentboxCard = page.locator('div:has-text("Agentbox")').first();
    this.connectedBadge = page.locator('span, div').filter({ hasText: /^Connected$/i }).first();

    // Sync Controls
    this.toggleSyncOffButton = page.getByRole('button', { name: /turn syncing off/i });
    this.toggleSyncOnButton = page.getByRole('button', { name: /turn syncing on/i });
    this.syncNowButton = page.getByRole('button', { name: /sync now/i });
    this.startSyncingModalButton = page.getByRole('button', { name: /start syncing/i });

    // Activity Log
    this.activitySection = page.locator('div:has-text("Activity")').first();
    this.filterChangesTab = page.locator('button, [role="tab"]').filter({ hasText: /^Changes$/i }).first();
    this.filterAllTab = page.locator('button, [role="tab"]').filter({ hasText: /^All$/i }).first();
    this.refreshActivityButton = page.getByRole('button', { name: /refresh/i });
  }

  async navigateToIntegrations() {
    await this.page.goto('https://staging.realey.au/dashboard/agent?tab=integrations', { waitUntil: 'domcontentloaded' });
    await this.page.waitForTimeout(3000);
    await dismissWelcomeAndNotificationModals(this.page);
  }

  async verifyConnected() {
    await expect(this.connectedBadge).toBeVisible({ timeout: 10000 });
  }

  async toggleSyncing(targetState) {
    if (targetState === 'off') {
      if (await this.toggleSyncOffButton.isVisible({ timeout: 3000 })) {
        await this.toggleSyncOffButton.click();
        await this.page.waitForTimeout(2000);
        await expect(this.toggleSyncOnButton).toBeVisible({ timeout: 5000 });
      }
    } else {
      if (await this.toggleSyncOnButton.isVisible({ timeout: 3000 })) {
        await this.toggleSyncOnButton.click();
        await this.page.waitForTimeout(2000);
        await expect(this.toggleSyncOffButton).toBeVisible({ timeout: 5000 });
      }
    }
  }

  async triggerManualSync() {
    await this.syncNowButton.click();
    await this.page.waitForTimeout(1000);
    if (await this.startSyncingModalButton.isVisible({ timeout: 3000 })) {
      await this.startSyncingModalButton.click();
    }
    await this.page.waitForTimeout(6000);
  }

  async filterActivityLog(filterType) {
    if (filterType.toLowerCase() === 'changes') {
      await this.filterChangesTab.click();
    } else {
      await this.filterAllTab.click();
    }
    await this.page.waitForTimeout(1500);
  }

  async getLatestSyncMetrics() {
    const text = await this.activitySection.innerText();
    const regex = /fetched\s*(\d+),\s*created\s*(\d+),\s*updated\s*(\d+),\s*skipped\s*(\d+),\s*archived\s*(\d+),\s*failed\s*(\d+)/i;
    const match = text.match(regex);
    if (!match) {
      throw new Error(`Could not parse sync metrics from Activity Log: "${text.substring(0, 300)}"`);
    }
    return {
      fetched: parseInt(match[1], 10),
      created: parseInt(match[2], 10),
      updated: parseInt(match[3], 10),
      skipped: parseInt(match[4], 10),
      archived: parseInt(match[5], 10),
      failed: parseInt(match[6], 10),
      raw: match[0]
    };
  }

  async verifyOfferPushSuccess() {
    const logText = await this.activitySection.innerText();
    expect(logText).toMatch(/Offer push.*succeeded on attempt 1/i);
  }
}

module.exports = { AgentboxIntegrationsPage };
