@e2e @all-flows @flow-7 @fixed-price @direct-offer @settlement @sales-instructions @notifications
Feature: Flow 7 - Fixed Price Direct Offer Sales Instructions

  Scenario: Flow 7 - Sales Instructions become available only after settlement completion and are sent once
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

    # Negative validation before settlement completion
    When the Agent opens the Settlements tab
    And the Agent opens the settlement for the created Fixed Price listing
    Then the Sales Instructions action should not be available before settlement completion

    When I switch from Agent to General User
    And the General User opens the created Fixed Price listing again
    And the General User starts the settlement process
    And the General User selects the configured solicitor
    And the General User selects the configured mortgage broker
    And the General User pays the deposit
    Then the deposit payment is successful

    When the General User completes the settlement process
    Then the settlement process is completed successfully

    When I switch from General User to Agent
    And the Agent opens the Settlements tab
    And the Agent verifies the settlement shows 5/5 steps completed
    And the Agent opens the settlement for the created Fixed Price listing
    Then the Sales Instructions action should be available

    # Confirm initial unissued state before first send
    When the Agent confirms Sales Instructions has not yet been issued
    And the Agent clicks Sales Instructions
    Then the Sales Instructions should be generated successfully

    # Generated document validations
    And the Sales Instructions document should contain the configured Firm
    And the Sales Instructions document should contain the Agent Licence No
    And the Sales Instructions document should contain the Agency Licence No
    And the Sales Instructions Firm field should not be blank
    And the Sales Instructions Agent Licence No field should not be blank
    And the Sales Instructions Agency Licence No field should not be blank

    # Broker delivery validation
    And the Broker should receive one Sales Instructions chatroom message
    And the Sales Instructions document in chat should have populated Firm, Agent Licence No, and Agency Licence No
    And the Broker should receive one Sales Instructions email
    And the Broker should receive one Sales Instructions in-app notification

    # Seller Solicitor delivery validation
    And the Seller Solicitor should receive one Sales Instructions chatroom message
    And the Seller Solicitor should receive one Sales Instructions email
    And the Seller Solicitor should receive one Sales Instructions in-app notification

    # Buyer Solicitor delivery validation
    And the Buyer Solicitor should receive one Sales Instructions chatroom message
    And the Buyer Solicitor should receive one Sales Instructions email
    And the Buyer Solicitor should receive one Sales Instructions in-app notification

    # Excluded recipient validation
    And the Buyer should not receive a Sales Instructions chatroom message
    And the Buyer should not receive a Sales Instructions email
    And the Buyer should not receive a Sales Instructions in-app notification

    And the Vendor should not receive a Sales Instructions chatroom message
    And the Vendor should not receive a Sales Instructions email
    And the Vendor should not receive a Sales Instructions in-app notification

    # Verify first click generated single delivery cycle
    And each intended recipient is confirmed to have received a single Sales Instructions delivery

    # Idempotency validation
    When the Agent clicks Sales Instructions again
    Then the Sales Instructions should display the already issued status
    And the Submit and Issue action should not be available
    And no Sales Instructions error message should be displayed