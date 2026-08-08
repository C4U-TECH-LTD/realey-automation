@listing @regression
Feature: Listings Management - Agent

  Background:
    Given I am logged in as an agent using the fixed OTP
    And the agent dashboard is open
    And I open Listings Management

  @smoke @open-listings
  Scenario: Open Listings page
    Then the Listings Management page is displayed

  @search
  Scenario: Search listings
    When I search for the management listing
    Then the searched management listing is displayed

  @filter
  Scenario: View listing status filter options
    When I open the listing status filter
    Then all listing status filter options are displayed

  @filter
  Scenario: Filter listings
    When I filter listings by the configured management status
    Then the filtered listings result is displayed

  @view
  Scenario: Switch between List and Grid view
    When I switch listings to List view
    Then the listings table is displayed
    When I switch listings to Grid view
    Then the listings grid is displayed

  @edit
  Scenario: Edit and republish the first listing
    When I edit the first listing
    Then the listing edit flow is displayed
    When I update the first listing management details
    Then the edited listing is published successfully

  @archive
  Scenario: Archive the second listing
    When I archive the second listing
    Then the second listing is archived successfully

  @details
  Scenario: View listing details
    When I expand the first listing details
    Then the complete listing details are displayed

  @status
  Scenario: Validate listing status
    When I switch listings to List view
    Then the configured listing status is correct

  @publish
  Scenario: Verify listing publishing
    When I switch listings to List view
    Then the configured published listing is visible
