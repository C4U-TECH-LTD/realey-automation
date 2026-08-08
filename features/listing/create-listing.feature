@listing @regression
Feature: Agent listing creation

  @smoke
  Scenario: Agent can login and publish a new listing
    Given I am logged in as an agent using the fixed OTP
    And the agent dashboard is open
    When I start creating a listing
    Then the Property Location step is displayed
    When I complete the property location step
    Then the Property Details step is displayed
    When I complete the property details step
    Then the Pricing and Sale Method step is displayed
    When I complete the pricing and sale method step
    Then the Description and Features step is displayed
    When I complete the description and features step
    Then the Property Media step is displayed
    When I upload the property photos
    And I upload the floor plan
    And I confirm and publish the listing
    Then the dashboard opens after publishing
    When I open the Listings menu
    Then the newly published property is visible
