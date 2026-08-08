const { Given, When, Then } = require('@cucumber/cucumber');
const { loginData } = require('../../fixtures/test-data/loginData');

Given('I open the Realey login page', async function () {
  await this.loginPage.goto(loginData.application.loginPath);
});

Then('the login page content and default control states are correct', async function () {
  await this.loginPage.verifyLoginPageIsVisible();
  await this.expect(this.loginPage.emailInput).toHaveAttribute('type', 'email');
  await this.expect(this.loginPage.passwordInput).toHaveAttribute('type', 'password');
  await this.expect(this.loginPage.loginButton).toBeDisabled();
  await this.expect(this.loginPage.rememberMeCheckbox).not.toBeChecked();
});

When('I enter valid login credentials', async function () {
  await this.loginPage.fillLoginForm(
    loginData.application.email,
    loginData.application.password,
  );
});

Then('the login button is enabled', async function () {
  await this.expect(this.loginPage.loginButton).toBeEnabled();
});

When('I enter the valid password', async function () {
  await this.loginPage.fillPassword(loginData.application.password);
});

Then('the password is hidden', async function () {
  await this.expect(this.loginPage.passwordInput).toHaveAttribute('type', 'password');
});

When('I show the password', async function () {
  await this.loginPage.showPassword();
});

Then('the password is visible', async function () {
  await this.expect(this.loginPage.passwordInput).toHaveAttribute('type', 'text');
});

When('I hide the password', async function () {
  await this.loginPage.hidePassword();
});

When('I select Remember me', async function () {
  await this.loginPage.checkRememberMe();
});

Then('Remember me is selected', async function () {
  await this.expect(this.loginPage.rememberMeCheckbox).toBeChecked();
});

When('I submit invalid login credentials', async function () {
  await this.loginPage.login(loginData.invalidUser.email, loginData.invalidUser.password);
});

Then('a login error message is displayed', async function () {
  await this.expect(
    this.loginPage.errorMessage,
    'An error message should appear for invalid credentials',
  ).toBeVisible({ timeout: 20_000 });
});

When('I open Forgot Password', async function () {
  await this.loginPage.clickForgotPassword();
});

Then('the Forgot Password page is displayed', async function () {
  await this.loginPage.verifyForgotPasswordOpened();
});

When('I open Create Profile', async function () {
  await this.loginPage.clickCreateProfile();
});

Then('the profession selection page is displayed', async function () {
  await this.loginPage.verifyCreateProfileOpened();
});

When('I submit valid login credentials', async function () {
  await this.loginPage.login(
    loginData.application.email,
    loginData.application.password,
  );
});

Then('the OTP page is displayed', async function () {
  await this.loginPage.waitForOtpPage();
});

When('I enter and submit the fixed login OTP', async function () {
  await this.loginPage.enterOtp(loginData.application.otp);
  await this.loginPage.submitOtp();
});

Then('login is successful', async function () {
  await this.expect(this.page).toHaveURL(loginData.expected.successUrlPattern, {
    timeout: 30_000,
  });
});
