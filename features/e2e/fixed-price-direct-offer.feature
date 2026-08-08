@e2e @fixed-price @direct-offer
Feature: Fixed Price Direct Offer Acceptance and Settlement

  Scenario: Direct offer acceptance and deposit payment
    Given the agent is logged in for the Fixed Price E2E flow

    When the agent creates and publishes a Fixed Price listing
    Then the Fixed Price listing is published successfully

    When I switch from Agent to General User
    And the General User opens the created Fixed Price listing
    And the General User submits the configured offer
    Then the offer is submitted successfully

    When I switch from General User to Agent
    And the Agent accepts the submitted offer
    Then the offer is accepted successfully

    When I switch from Agent to General User
    And the General User opens the created Fixed Price listing again
    And the General User starts the settlement process
    And the General User selects the configured solicitor
    And the General User selects the configured mortgage broker
    And the General User pays the deposit
    Then the deposit payment is successful
