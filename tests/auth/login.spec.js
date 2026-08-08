const { test, expect } = require("@playwright/test");

const {
  LoginPage,
} = require("../../pages/LoginPage");

const {
  loginData,
} = require("../../fixtures/test-data/loginData");

const {
  stepWithScreenshot,
} = require("../../utils/step");

test.describe("Realey Login and Fixed OTP Tests", () => {
  let loginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test(
    "Login page UI is displayed correctly",
    async ({ page }, testInfo) => {
      await stepWithScreenshot(
        page,
        testInfo,
        "Open login page",
        async () => {
          await loginPage.goto(
            loginData.application.loginPath
          );
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Verify login page content",
        async () => {
          await loginPage.verifyLoginPageIsVisible();

          await expect(
            loginPage.emailInput
          ).toHaveAttribute(
            "type",
            "email"
          );

          await expect(
            loginPage.passwordInput
          ).toHaveAttribute(
            "type",
            "password"
          );

          await expect(
            loginPage.loginButton
          ).toBeDisabled();

          await expect(
            loginPage.rememberMeCheckbox
          ).not.toBeChecked();
        }
      );
    }
  );

  test(
    "Login button becomes enabled after entering credentials",
    async ({ page }, testInfo) => {
      await stepWithScreenshot(
        page,
        testInfo,
        "Open login page",
        async () => {
          await loginPage.goto(
            loginData.application.loginPath
          );
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Enter valid email and password",
        async () => {
          await loginPage.fillLoginForm(
            loginData.application.email,
            loginData.application.password
          );
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Verify login button is enabled",
        async () => {
          await expect(
            loginPage.loginButton
          ).toBeEnabled();
        }
      );
    }
  );

  test(
    "Password visibility toggle works",
    async ({ page }, testInfo) => {
      await stepWithScreenshot(
        page,
        testInfo,
        "Open login page",
        async () => {
          await loginPage.goto(
            loginData.application.loginPath
          );
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Enter password",
        async () => {
          await loginPage.fillPassword(
            loginData.application.password
          );

          await expect(
            loginPage.passwordInput
          ).toHaveAttribute(
            "type",
            "password"
          );
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Show password",
        async () => {
          await loginPage.showPassword();

          await expect(
            loginPage.passwordInput
          ).toHaveAttribute(
            "type",
            "text"
          );
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Hide password",
        async () => {
          await loginPage.hidePassword();

          await expect(
            loginPage.passwordInput
          ).toHaveAttribute(
            "type",
            "password"
          );
        }
      );
    }
  );

  test(
    "Remember me checkbox can be selected",
    async ({ page }, testInfo) => {
      await stepWithScreenshot(
        page,
        testInfo,
        "Open login page",
        async () => {
          await loginPage.goto(
            loginData.application.loginPath
          );
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Select Remember me",
        async () => {
          await loginPage.checkRememberMe();

          await expect(
            loginPage.rememberMeCheckbox
          ).toBeChecked();
        }
      );
    }
  );

  test(
    "Invalid login credentials show an error",
    async ({ page }, testInfo) => {
      await stepWithScreenshot(
        page,
        testInfo,
        "Open login page",
        async () => {
          await loginPage.goto(
            loginData.application.loginPath
          );
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Submit invalid credentials",
        async () => {
          await loginPage.login(
            loginData.invalidUser.email,
            loginData.invalidUser.password
          );
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Verify login error message",
        async () => {
          await expect(
            loginPage.errorMessage,
            "An error message should appear for invalid credentials"
          ).toBeVisible({
            timeout: 20_000,
          });
        }
      );
    }
  );

  test(
    "Forgot Password button is clickable",
    async ({ page }, testInfo) => {
      await stepWithScreenshot(
        page,
        testInfo,
        "Open login page",
        async () => {
          await loginPage.goto(
            loginData.application.loginPath
          );
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Click Forgot Password",
        async () => {
          await loginPage.clickForgotPassword();
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Verify Forgot Password heading",
        async () => {
          await loginPage.verifyForgotPasswordOpened();
        }
      );
    }
  );

  test(
    "Create profile button is clickable",
    async ({ page }, testInfo) => {
      await stepWithScreenshot(
        page,
        testInfo,
        "Open login page",
        async () => {
          await loginPage.goto(
            loginData.application.loginPath
          );
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Click Create profile",
        async () => {
          await loginPage.clickCreateProfile();
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Verify Choose Your Profession text",
        async () => {
          await loginPage.verifyCreateProfileOpened();
        }
      );
    }
  );

  test(
    "User can login using fixed OTP",
    async ({ page }, testInfo) => {
      test.setTimeout(120_000);

      await stepWithScreenshot(
        page,
        testInfo,
        "Open login page",
        async () => {
          await loginPage.goto(
            loginData.application.loginPath
          );
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Submit valid login credentials",
        async () => {
          await loginPage.login(
            loginData.application.email,
            loginData.application.password
          );
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Verify OTP page appears",
        async () => {
          await loginPage.waitForOtpPage();
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Enter fixed login OTP",
        async () => {
          await loginPage.enterOtp(
            loginData.application.otp
          );
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Submit login OTP",
        async () => {
          await loginPage.submitOtp();
        }
      );

      await stepWithScreenshot(
        page,
        testInfo,
        "Verify successful login",
        async () => {
          await expect(page).toHaveURL(
            loginData.expected
              .successUrlPattern,
            {
              timeout: 30_000,
            }
          );
        }
      );
    }
  );
});
