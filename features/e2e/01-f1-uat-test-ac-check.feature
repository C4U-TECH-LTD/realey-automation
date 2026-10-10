@f1-uat-test-ac-check @uat @account-isolation
Feature: F1 UAT TEST AC Check - UAT Test Account Isolation and Flow 1 E2E

  Scenario: 01. Authenticate all six authorized .tst test accounts
    Given all six designated .tst test accounts authenticate successfully on UAT

  Scenario: 02. Flow 1 E2E execution with strict Account Isolation verification
    Given the agent logs in using authorized test account for F1 AC Check
    When the agent starts creating a Fixed Price listing for F1 AC Check
    And the agent completes the property location step with Seller Solicitor isolation check
    And the agent completes property details for F1 AC Check
    And the agent completes pricing and sale method for F1 AC Check
    And the agent completes description and features for F1 AC Check
    And the agent uploads media and publishes the listing for F1 AC Check
    Then the F1 AC Check listing is published successfully

    # Buyer Flow: Offer Submission
    When I switch to Buyer test account for F1 AC Check
    And the Buyer opens the created F1 AC Check listing
    And the Buyer submits the configured offer for F1 AC Check
    Then the F1 AC Check offer is submitted successfully

    # Agent Flow: Offer Acceptance
    When I switch to Agent test account for F1 AC Check
    And the Agent accepts the submitted F1 AC Check offer
    Then the F1 AC Check offer is accepted successfully

    # Buyer Flow: Settlement with Buyer Solicitor & Broker Isolation Check
    When I switch to Buyer test account for F1 AC Check
    And the Buyer starts the settlement process for F1 AC Check
    And the Buyer selects solicitor with Account Isolation check
    And the Buyer selects mortgage broker with Account Isolation check
    And the Buyer pays the deposit for F1 AC Check
    Then the F1 AC Check deposit payment is successful

    # Settlement Verification
    When I switch to Agent test account for F1 AC Check
    Then the Agent verifies the settlement shows 5/5 steps completed for F1 AC Check
    And backend APIs enforce isolation preventing test accounts from accessing legacy account data
