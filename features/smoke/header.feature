@smoke @header @regression
Feature: Public header

  Background:
    Given I open the Realey home page

  Scenario Outline: Header behavior - <behavior>
    Then the header behavior "<behavior>" is verified

    Examples:
      | behavior                                           |
      | Verify header container and logo                   |
      | Verify all header navigation buttons               |
      | Verify Login and Get Started buttons               |
      | Click Home and verify Featured Properties          |
      | Click About and verify About Realey                |
      | Click Listings and verify Property Listings        |
      | Click Search and verify Find Your Perfect Property |
      | Click Pricing and verify Pricing Plans             |
      | Click Login and verify Welcome back                |
      | Click Get Started and verify Choose Your Profession|
