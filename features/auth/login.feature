@login @regression
Feature: Realey login and fixed OTP

  Background:
    Given I open the Realey login page

  @smoke
  Scenario: Login page UI is displayed correctly
    Then the login page content and default control states are correct

  Scenario: Login button becomes enabled after entering credentials
    When I enter valid login credentials
    Then the login button is enabled

  Scenario: Password visibility toggle works
    When I enter the valid password
    Then the password is hidden
    When I show the password
    Then the password is visible
    When I hide the password
    Then the password is hidden

  Scenario: Remember me checkbox can be selected
    When I select Remember me
    Then Remember me is selected

  Scenario: Invalid login credentials show an error
    When I submit invalid login credentials
    Then a login error message is displayed

  Scenario: Forgot Password button is clickable
    When I open Forgot Password
    Then the Forgot Password page is displayed

  Scenario: Create profile button is clickable
    When I open Create Profile
    Then the profession selection page is displayed

  @smoke
  Scenario: User can login using fixed OTP
    When I submit valid login credentials
    Then the OTP page is displayed
    When I enter and submit the fixed login OTP
    Then login is successful
