@f1-prod-test-ac @prod @prod-f1-test-ac
Feature: Prod F1 Test AC - Production Flow 1 E2E with Test Account Isolation

  @prod-auth-check
  Scenario: 01. Authenticate all six authorized Prod test accounts
    Given all six designated Prod test accounts authenticate successfully on Production

  @prod-flow-1
  Scenario: 02. Flow 1 E2E execution with Prod test accounts
    # Agent Flow: Create and Publish Fixed Price Listing
    Given the agent logs in using authorized Prod test account
    When the agent starts creating a Fixed Price listing for Prod Flow 1
    And the agent completes the property location step for Prod Flow 1
    And the agent completes property details for Prod Flow 1
    And the agent completes pricing and sale method for Prod Flow 1
    And the agent completes description and features for Prod Flow 1
    And the agent uploads media and publishes the listing for Prod Flow 1
    Then the Prod Flow 1 listing is published successfully

    # Buyer Flow: Offer Submission
    When I switch to Buyer test account for Prod Flow 1
    And the Buyer opens the created Prod Flow 1 listing
    And the Buyer submits the configured offer for Prod Flow 1
    Then the Prod Flow 1 offer is submitted successfully

    # Agent Flow: Offer Acceptance
    When I switch to Agent test account for Prod Flow 1
    And the Agent accepts the submitted Prod Flow 1 offer
    Then the Prod Flow 1 offer is accepted successfully

    # Buyer Flow: Settlement Setup with Solicitor & Mortgage Broker
    When I switch to Buyer test account for Prod Flow 1
    And the Buyer starts the settlement process for Prod Flow 1
    And the Buyer selects solicitor for Prod Flow 1
    And the Buyer selects mortgage broker for Prod Flow 1
    And the Buyer pays the deposit for Prod Flow 1
    Then the Prod Flow 1 deposit payment is successful

    # Settlement Verification
    When I switch to Agent test account for Prod Flow 1
    Then the Agent verifies the settlement shows 5/5 steps completed for Prod Flow 1
