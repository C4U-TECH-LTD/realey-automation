const { expect } = require("@playwright/test");

class LoginPage {
  /**
   * @param {import("@playwright/test").Page} page
   */
  constructor(page) {
    this.page = page;

    /* =====================================================
       LOGIN FORM
    ===================================================== */

    this.heading = page.getByRole("heading", {
      name: "Welcome back",
      exact: true,
    });

    /*
     * Scope all login controls inside the section that contains
     * the "Welcome back" heading.
     *
     * This prevents the navbar Login button from conflicting
     * with the form Login button.
     */
    this.loginForm = this.heading.locator(
      "xpath=ancestor::div[contains(@class,'flex-1')][1]"
    );

    this.description = this.loginForm.getByText(
      "Sign in to access your professional dashboard",
      {
        exact: true,
      }
    );

    this.emailInput = this.loginForm.getByPlaceholder(
      "Enter your email",
      {
        exact: true,
      }
    );

    this.passwordInput = this.loginForm.getByPlaceholder(
      "Enter your password",
      {
        exact: true,
      }
    );

    this.passwordVisibilityButton = this.passwordInput
      .locator("xpath=following-sibling::button")
      .first();

    this.rememberMeCheckbox =
      this.loginForm.getByRole("checkbox");

    this.rememberMeLabel = this.loginForm.getByText(
      "Remember me",
      {
        exact: true,
      }
    );

    this.forgotPasswordButton =
      this.loginForm.getByRole("button", {
        name: "Forgot Password?",
        exact: true,
      });

    this.loginButton =
      this.loginForm.getByRole("button", {
        name: "Login",
        exact: true,
      });

    this.termsButton =
      this.loginForm.getByRole("button", {
        name: "T&C",
        exact: true,
      });

    this.privacyPolicyButton =
      this.loginForm.getByRole("button", {
        name: "Privacy Policy",
        exact: true,
      });

    this.createProfileButton =
      this.loginForm.getByRole("button", {
        name: "Create profile",
        exact: true,
      });

    /* =====================================================
       FORGOT PASSWORD PAGE
    ===================================================== */

    this.forgotPasswordHeading = page.getByRole("heading", {
      name: "Forgot Password",
      exact: true,
    });

    /* =====================================================
       CREATE PROFILE PAGE
    ===================================================== */

    /*
     * The visible text is rendered across nested spans:
     * Choose Your + Profession
     */
    this.chooseYourProfessionText = page.getByText(
      /Choose Your\s*Profession/i
    );

    /* =====================================================
       OTP PAGE
    ===================================================== */

    /*
     * Supports:
     * - one input for the complete OTP
     * - multiple one-digit OTP inputs
     */
    this.otpInputs = page.locator(
      [
        'input[autocomplete="one-time-code"]',
        'input[name*="otp" i]',
        'input[id*="otp" i]',
        'input[inputmode="numeric"]',
        'input[aria-label*="otp" i]',
        'input[placeholder*="otp" i]',
        'input[placeholder*="code" i]',
        'input[maxlength="1"]',
      ].join(", ")
    );

    this.otpHeading = page.getByRole("heading", {
      name: /login verification|verify|verification|enter.*code|otp/i,
    });

    this.verifyOtpButton = page.getByRole("button", {
      name: /verify|continue|confirm|submit|complete login/i,
    });

    this.resendOtpButton = page.getByRole("button", {
      name: /resend/i,
    });

    /* =====================================================
       MESSAGES
    ===================================================== */

    this.errorMessage = page
      .locator(
        [
          '[role="alert"]',
          '[data-testid*="error" i]',
          '[class*="text-red"]',
          '[class*="error" i]',
        ].join(", ")
      )
      .first();

    this.successMessage = page
      .locator(
        [
          '[role="status"]',
          '[data-testid*="success" i]',
          '[class*="text-green"]',
          '[class*="success" i]',
        ].join(", ")
      )
      .first();
  }

  /* =====================================================
     NAVIGATION
  ===================================================== */

  async goto(path = "/login") {
    await this.page.goto(path, {
      waitUntil: "domcontentloaded",
    });

    await expect(
      this.heading,
      "Welcome back heading should be visible"
    ).toBeVisible({
      timeout: 20_000,
    });
  }

  /* =====================================================
     LOGIN PAGE VERIFICATION
  ===================================================== */

  async verifyLoginPageIsVisible() {
    await expect(this.heading).toBeVisible();
    await expect(this.loginForm).toBeVisible();
    await expect(this.description).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
    await expect(this.rememberMeCheckbox).toBeVisible();
    await expect(this.rememberMeLabel).toBeVisible();
    await expect(this.forgotPasswordButton).toBeVisible();
    await expect(this.termsButton).toBeVisible();
    await expect(this.privacyPolicyButton).toBeVisible();
    await expect(this.createProfileButton).toBeVisible();
  }

  /* =====================================================
     LOGIN FORM ACTIONS
  ===================================================== */

  async fillEmail(email) {
    if (!email) {
      throw new Error("Login email is required.");
    }

    await this.emailInput.fill(email);

    await expect(
      this.emailInput,
      "Email field should contain the entered email"
    ).toHaveValue(email);
  }

  async fillPassword(password) {
    if (!password) {
      throw new Error("Login password is required.");
    }

    await this.passwordInput.fill(password);

    await expect(
      this.passwordInput,
      "Password field should contain the entered password"
    ).toHaveValue(password);
  }

  async fillLoginForm(email, password) {
    await this.fillEmail(email);
    await this.fillPassword(password);
  }

  async clickLogin() {
    await expect(
      this.loginButton,
      "Login button should be visible"
    ).toBeVisible();

    await expect(
      this.loginButton,
      "Login button should be enabled after entering credentials"
    ).toBeEnabled();

    await this.loginButton.click();
  }

  async login(email, password) {
    await this.fillLoginForm(email, password);
    await this.clickLogin();
  }

  /* =====================================================
     REMEMBER ME
  ===================================================== */

  async checkRememberMe() {
    await this.rememberMeCheckbox.check();

    await expect(
      this.rememberMeCheckbox,
      "Remember me checkbox should be selected"
    ).toBeChecked();
  }

  async uncheckRememberMe() {
    await this.rememberMeCheckbox.uncheck();

    await expect(
      this.rememberMeCheckbox,
      "Remember me checkbox should not be selected"
    ).not.toBeChecked();
  }

  /* =====================================================
     PASSWORD VISIBILITY
  ===================================================== */

  async verifyPasswordIsHidden() {
    await expect(
      this.passwordInput
    ).toHaveAttribute("type", "password");
  }

  async verifyPasswordIsVisible() {
    await expect(
      this.passwordInput
    ).toHaveAttribute("type", "text");
  }

  async showPassword() {
    await this.verifyPasswordIsHidden();

    await expect(
      this.passwordVisibilityButton,
      "Password visibility button should be visible"
    ).toBeVisible();

    await this.passwordVisibilityButton.click();

    await this.verifyPasswordIsVisible();
  }

  async hidePassword() {
    await expect(
      this.passwordVisibilityButton,
      "Password visibility button should be visible"
    ).toBeVisible();

    await this.passwordVisibilityButton.click();

    await this.verifyPasswordIsHidden();
  }

  /* =====================================================
     OTP PAGE
  ===================================================== */

  async waitForOtpPage() {
    const firstOtpInput = this.otpInputs.first();

    const otpPageFound = await Promise.race([
      firstOtpInput
        .waitFor({
          state: "visible",
          timeout: 30_000,
        })
        .then(() => true)
        .catch(() => false),

      this.otpHeading
        .waitFor({
          state: "visible",
          timeout: 30_000,
        })
        .then(() => true)
        .catch(() => false),
    ]);

    if (!otpPageFound) {
      throw new Error(
        "OTP verification page did not appear after login."
      );
    }

    await expect(
      firstOtpInput,
      "At least one OTP input should be visible"
    ).toBeVisible({
      timeout: 10_000,
    });
  }

  async getVisibleOtpInputs() {
    const totalInputs = await this.otpInputs.count();
    const visibleInputs = [];

    for (
      let index = 0;
      index < totalInputs;
      index += 1
    ) {
      const input = this.otpInputs.nth(index);

      if (await input.isVisible()) {
        visibleInputs.push(input);
      }
    }

    return visibleInputs;
  }

  async enterOtp(otp) {
    const otpValue = String(otp || "").trim();

    if (!/^\d{6}$/.test(otpValue)) {
      throw new Error(
        `OTP must contain exactly 6 digits. Received: "${otpValue}"`
      );
    }

    const visibleInputs =
      await this.getVisibleOtpInputs();

    if (visibleInputs.length === 0) {
      throw new Error(
        "No visible OTP input fields were found."
      );
    }

    /*
     * One input for the complete OTP
     */
    if (visibleInputs.length === 1) {
      await visibleInputs[0].fill(otpValue);

      await expect(
        visibleInputs[0],
        "OTP input should contain the complete OTP"
      ).toHaveValue(otpValue);

      return;
    }

    /*
     * One input for each OTP digit
     */
    if (visibleInputs.length < otpValue.length) {
      throw new Error(
        [
          `OTP contains ${otpValue.length} digits.`,
          `Only ${visibleInputs.length} visible OTP fields were found.`,
        ].join(" ")
      );
    }

    for (
      let index = 0;
      index < otpValue.length;
      index += 1
    ) {
      await visibleInputs[index].fill(
        otpValue[index]
      );

      await expect(
        visibleInputs[index],
        `OTP field ${index + 1} should contain the correct digit`
      ).toHaveValue(otpValue[index]);
    }
  }

  async submitOtp() {
    await expect(
      this.verifyOtpButton,
      "OTP verification button should be visible"
    ).toBeVisible();

    await expect(
      this.verifyOtpButton,
      "OTP verification button should be enabled"
    ).toBeEnabled();

    await this.verifyOtpButton.click();
  }

  async completeOtpVerification(otp) {
    await this.enterOtp(otp);
    await this.submitOtp();
  }

  async clickResendOtp() {
    await expect(
      this.resendOtpButton,
      "Resend OTP button should be visible"
    ).toBeVisible();

    await expect(
      this.resendOtpButton,
      "Resend OTP button should be enabled"
    ).toBeEnabled();

    await this.resendOtpButton.click();
  }

  /* =====================================================
     FORGOT PASSWORD
  ===================================================== */

  async clickForgotPassword() {
    await expect(
      this.forgotPasswordButton,
      "Forgot Password button should be visible"
    ).toBeVisible();

    await expect(
      this.forgotPasswordButton,
      "Forgot Password button should be enabled"
    ).toBeEnabled();

    await this.forgotPasswordButton.click();
  }

  async verifyForgotPasswordOpened() {
    await expect(
      this.forgotPasswordHeading,
      '"Forgot Password" heading should be visible'
    ).toBeVisible({
      timeout: 15_000,
    });
  }

  /* =====================================================
     CREATE PROFILE
  ===================================================== */

  async clickCreateProfile() {
    await expect(
      this.createProfileButton,
      "Create Profile button should be visible"
    ).toBeVisible();

    await expect(
      this.createProfileButton,
      "Create Profile button should be enabled"
    ).toBeEnabled();

    await this.createProfileButton.click();
  }

  async verifyCreateProfileOpened() {
    await expect(
      this.chooseYourProfessionText,
      '"Choose Your Profession" text should be visible'
    ).toBeVisible({
      timeout: 15_000,
    });
  }

  /* =====================================================
     OTHER NAVIGATION BUTTONS
  ===================================================== */

  async clickTerms() {
    await expect(
      this.termsButton,
      "T&C button should be visible"
    ).toBeVisible();

    await this.termsButton.click();
  }

  async clickPrivacyPolicy() {
    await expect(
      this.privacyPolicyButton,
      "Privacy Policy button should be visible"
    ).toBeVisible();

    await this.privacyPolicyButton.click();
  }
}

module.exports = {
  LoginPage,
};