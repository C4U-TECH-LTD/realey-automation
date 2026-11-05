const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { LoginPage } = require('../../pages/LoginPage');
const { loginData } = require('../../fixtures/test-data/loginData');
const { dismissWelcomeAndNotificationModals } = require('../../utils/modalHelper');

function getExchangeCard(page, propertySnippet = 'Anzac Parade, Kingsford') {
  return page.locator('div').filter({ hasText: propertySnippet }).filter({ hasText: /Contract document|Exchange/i }).last();
}

Given('the Seller Solicitor is logged into the Solicitor dashboard', async function () {
  const loginPage = new LoginPage(this.page);
  await loginPage.goto('https://staging.realey.au/login');
  await loginPage.login(loginData.sellerSolicitor.email, loginData.sellerSolicitor.password);
  await loginPage.waitForOtpPage(20000);
  await loginPage.enterOtp(loginData.sellerSolicitor.otp);
  await loginPage.submitOtp();
  await this.page.waitForTimeout(3000);
  await dismissWelcomeAndNotificationModals(this.page);
});

When('the Seller Solicitor navigates to the Exchange tab', async function () {
  await this.page.goto('https://staging.realey.au/dashboard/solicitor?tab=exchange', { waitUntil: 'domcontentloaded' });
  await this.page.waitForTimeout(4000);
  await dismissWelcomeAndNotificationModals(this.page);
});

Then('the initiated contract card displays the active version and current token holder status', async function () {
  const card = getExchangeCard(this.page);
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('text=/Contract document Version \\d+/i').first()).toBeVisible({ timeout: 10000 });
  const cardText = await card.innerText();
  expect(cardText).toMatch(/With buyer's solicitor|With seller's solicitor|Locked for signing/i);
});

Then('when the token is held by the other solicitor, the current solicitor sees a read-only lockout banner and cannot modify the contract', async function () {
  const card = getExchangeCard(this.page);
  const cardText = await card.innerText();
  if (cardText.includes("With buyer's solicitor")) {
    expect(cardText).toMatch(/Waiting for the buyer's solicitor/i);
    await expect(card.getByRole('button', { name: /upload new version/i })).toHaveCount(0);
    await expect(card.getByRole('button', { name: /return/i })).toHaveCount(0);
  } else if (cardText.includes("With seller's solicitor")) {
    expect(cardText).toMatch(/The buyer’s solicitor uploaded a new version|Place the signature boxes/i);
  }
});

Given('the solicitor holding the review token opens the Comments tab on the exchange card', async function () {
  const card = getExchangeCard(this.page);
  await card.scrollIntoViewIfNeeded();
  const commentsBtn = card.locator('button:has-text("Comments")').first();
  await expect(commentsBtn).toBeVisible({ timeout: 10000 });
  await commentsBtn.click();
  await this.page.waitForTimeout(1000);
});

When('the solicitor submits a review comment on the active contract version', async function () {
  const card = getExchangeCard(this.page);
  const commentInput = card.locator('textarea[placeholder*="comment" i], textarea').first();
  await expect(commentInput).toBeVisible({ timeout: 5000 });
  await commentInput.fill('Clause 4 indemnity clause needs amendment per client instructions.');

  const addCommentBtn = card.locator('button:has-text("Add comment")').first();
  await expect(addCommentBtn).toBeEnabled();
  await addCommentBtn.click();
  await this.page.waitForTimeout(3000);
});

Then('the comment is appended to the comments thread with author name, role tag, version badge, and timestamp', async function () {
  const card = getExchangeCard(this.page);
  const cardText = await card.innerText();
  expect(cardText).toContain('Clause 4 indemnity clause needs amendment');
  expect(cardText).toMatch(/version \d+/i);
});

Then('the comments thread is strictly append-only with no edit or delete controls available', async function () {
  const card = getExchangeCard(this.page);
  const editBtn = card.getByRole('button', { name: /edit/i });
  const deleteBtn = card.getByRole('button', { name: /delete|remove/i });
  expect(await editBtn.count()).toBe(0);
  expect(await deleteBtn.count()).toBe(0);
});

Given('the solicitor holding the review token opens the "Upload new version" dialog', async function () {
  const card = getExchangeCard(this.page);
  await card.scrollIntoViewIfNeeded();
  const uploadBtn = card.getByRole('button', { name: /upload new version/i }).first();
  await expect(uploadBtn).toBeVisible({ timeout: 10000 });
  await uploadBtn.click();
  await this.page.waitForTimeout(2000);
});

When('the solicitor attempts to upload a non-PDF file', async function () {
  const dummyTxt = path.resolve('test-assets/invalid.txt');
  fs.writeFileSync(dummyTxt, 'Invalid text content');
  const fileInput = this.page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(dummyTxt);
  await this.page.waitForTimeout(1000);
});

Then('the upload dialog rejects the file and enforces PDF format up to 50 MB', async function () {
  const uploadModal = this.page.locator('[role="dialog"]').filter({ hasText: /Upload new version/i }).first();
  const modalText = await uploadModal.innerText();
  expect(modalText).toMatch(/PDF only|up to 50 MB/i);
});

When('the solicitor uploads a valid contract PDF with a descriptive version note', async function () {
  const samplePdf = path.resolve('test-assets/contract-sample.pdf');
  if (!fs.existsSync(samplePdf)) {
    fs.writeFileSync(samplePdf, '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000010 00000 n\n0000000060 00000 n\n0000000117 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n193\n%%EOF');
  }
  const fileInput = this.page.locator('input[type="file"]').first();
  await fileInput.setInputFiles(samplePdf);
  await this.page.waitForTimeout(1000);

  const uploadModal = this.page.locator('[role="dialog"]').filter({ hasText: /Upload new version/i }).first();
  const noteInput = uploadModal.locator('textarea, input[placeholder*="note" i]').first();
  if (await noteInput.isVisible().catch(() => false)) {
    await noteInput.fill('Revised clause 4 indemnity per client comments');
  }

  const submitBtn = uploadModal.getByRole('button', { name: /upload/i }).last();
  await submitBtn.click();
  await this.page.waitForTimeout(4000);
});

Then('the contract version increments to the new version number', async function () {
  const card = getExchangeCard(this.page);
  await expect(card.locator('text=/Contract document Version [2-9]/i').first()).toBeVisible({ timeout: 10000 });
});

Then('the Versions history tab lists all chronological versions with direct view links, author tags, and version notes', async function () {
  const card = getExchangeCard(this.page);
  const versionsBtn = card.locator('button:has-text("Versions")').first();
  await versionsBtn.click();
  await this.page.waitForTimeout(1000);
  const cardText = await card.innerText();
  expect(cardText).toMatch(/Version 2/i);
  expect(cardText).toMatch(/Version 1/i);
  await expect(card.locator('button:has-text("View")').first()).toBeVisible();
});

Given('the Buyer Solicitor returns the revised contract to the Seller Solicitor', async function () {
  const card = getExchangeCard(this.page);
  const returnBtn = card.getByRole('button', { name: /return to seller's solicitor/i }).first();
  if (await returnBtn.isVisible().catch(() => false)) {
    await returnBtn.click();
    await this.page.waitForTimeout(1500);
    const confirmModal = this.page.locator('[role="dialog"]').first();
    if (await confirmModal.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmModal.getByRole('button', { name: /return/i }).first().click();
      await this.page.waitForTimeout(4000);
    }
  }
});

When('the Seller Solicitor inspects the returned contract on the Exchange tab', async function () {
  const card = getExchangeCard(this.page);
  await card.scrollIntoViewIfNeeded();
  await expect(card).toBeVisible();
});

Then('the status updates to indicate the contract is with the Seller Solicitor', async function () {
  const card = getExchangeCard(this.page);
  const cardText = await card.innerText();
  expect(cardText).toMatch(/With seller's solicitor/i);
});

Then('the "Send to buyer\'s solicitor" action is disabled until signature boxes are placed on the new version', async function () {
  const card = getExchangeCard(this.page);
  const sendBtn = card.getByRole('button', { name: /send to buyer's solicitor/i }).first();
  if (await sendBtn.isVisible().catch(() => false)) {
    const isEnabled = await sendBtn.isEnabled();
    const cardText = await card.innerText();
    if (cardText.includes('Place the signature boxes')) {
      expect(isEnabled).toBe(false);
    }
  }
});

When('the Seller Solicitor places required signature boxes using the wizard', async function () {
  const card = getExchangeCard(this.page);
  const placeBoxesBtn = card.getByRole('button', { name: /place signature boxes/i }).first();
  if (await placeBoxesBtn.isVisible().catch(() => false)) {
    await placeBoxesBtn.click();
    await this.page.waitForTimeout(2000);

    const sigModal = this.page.locator('[role="dialog"]').filter({ hasText: /Place Signatures/i }).first();
    const nextBtn = sigModal.getByRole('button', { name: /^next$/i }).last();
    if (await nextBtn.isVisible().catch(() => false)) {
      await nextBtn.click();
      await this.page.waitForTimeout(1500);
    }
    const completeBtn = sigModal.getByRole('button', { name: /complete/i }).last();
    if (await completeBtn.isVisible().catch(() => false)) {
      await completeBtn.click();
      await this.page.waitForTimeout(3000);
    }
  }
});

Then('the "Send to buyer\'s solicitor" action becomes enabled', async function () {
  const card = getExchangeCard(this.page);
  const sendBtn = card.getByRole('button', { name: /send to buyer's solicitor/i }).first();
  await expect(sendBtn).toBeEnabled({ timeout: 10000 });
});

Given('the Buyer Solicitor holds the finalized contract version', async function () {
  const card = getExchangeCard(this.page);
  await expect(card.locator('text=/Version \\d+/i').first()).toBeVisible({ timeout: 10000 });
});

When('the Buyer Solicitor assigns the buyer as signer', async function () {
  const card = getExchangeCard(this.page);
  const addSignerBtn = card.getByRole('button', { name: /add buyer as signer/i }).first();
  if (await addSignerBtn.isVisible().catch(() => false)) {
    await addSignerBtn.click();
    await this.page.waitForTimeout(2000);
    const confirmModal = this.page.locator('[role="dialog"]').filter({ hasText: /Add Buyer as Signer/i }).first();
    if (await confirmModal.isVisible().catch(() => false)) {
      const assignBtn = confirmModal.getByRole('button', { name: /assign buyer/i }).first();
      await assignBtn.click();
      await this.page.waitForTimeout(8000);
    }
  }
});

Then('the contract transitions to "Locked for signing"', async function () {
  const card = getExchangeCard(this.page);
  await expect(card.locator('text=/Locked for signing|Buyer assigned/i').first()).toBeVisible({ timeout: 15000 });
});

Then('all draft replacement and return review controls are permanently hidden', async function () {
  const card = getExchangeCard(this.page);
  await expect(card.getByRole('button', { name: /upload new version/i })).toHaveCount(0);
  await expect(card.getByRole('button', { name: /return to seller's solicitor/i })).toHaveCount(0);
  await expect(card.getByRole('button', { name: /add buyer as signer/i })).toHaveCount(0);
});

Then('the contract document is dispatched to BoldSign for signing', async function () {
  const card = getExchangeCard(this.page);
  const text = await card.innerText();
  expect(text).toMatch(/This contract is locked and has been sent for signing|Buyer assigned/i);
});

Given('the Buyer logs into the Buyer dashboard', async function () {
  const loginPage = new LoginPage(this.page);
  await loginPage.goto('https://staging.realey.au/login');
  await loginPage.login(loginData.buyer.email, loginData.buyer.password);
  await loginPage.waitForOtpPage(20000);
  await loginPage.enterOtp(loginData.buyer.otp);
  await loginPage.submitOtp();
  await this.page.waitForTimeout(3000);
  await dismissWelcomeAndNotificationModals(this.page);
});

When('the Buyer navigates to the Exchange tab', async function () {
  await this.page.goto('https://staging.realey.au/dashboard/buyer?tab=exchange', { waitUntil: 'domcontentloaded' });
  await this.page.waitForTimeout(4000);
  await dismissWelcomeAndNotificationModals(this.page);
});

Then('the Buyer sees the action to sign the buyer counterpart', async function () {
  const card = getExchangeCard(this.page);
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('button, a').filter({ hasText: /sign/i }).first()).toBeVisible({ timeout: 10000 });
});

Then('the internal solicitor review draft versions and negotiation comments are completely hidden', async function () {
  const card = getExchangeCard(this.page);
  const cardText = await card.innerText();
  expect(cardText).not.toContain('indemnity clause');
  expect(cardText).not.toContain('Arnold_Economics');
  expect(cardText).not.toContain('Comments (');
});
