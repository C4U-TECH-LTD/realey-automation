@e2e @all-flows @flow-6 @fixed-price @direct-offer @settlement @exchange @document-signing
Feature: Flow 6 - Fixed Price Direct Offer Settlement Exchange and Document Signing

  Scenario: Flow 6 - Complete settlement exchange document signing and confirm settlement date
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

    When the General User completes the settlement process
    Then the settlement process is completed successfully

    When I switch from General User to Agent
    And the Agent opens the Settlements tab
    And the Agent verifies the settlement shows 5/5 steps completed
    And the Agent opens the settlement for the created Fixed Price listing
    And the Agent marks the settlement as Ready for Exchange
    Then the settlement status should be Ready for Exchange

    When I switch from Agent to Seller Solicitor
    And the Seller Solicitor opens the settlement for the created Fixed Price listing
    And the Seller Solicitor initiates the exchange
    Then the exchange should be initiated successfully

    When I switch from Seller Solicitor to Buyer Solicitor
    And the Buyer Solicitor opens the settlement for the created Fixed Price listing
    And the Buyer Solicitor assigns the Buyer for document signing
    Then the Buyer should be assigned for document signing successfully

    When I switch from Buyer Solicitor to General User
    And the General User opens the settlement documents
    And the General User signs all required settlement documents
    Then the Buyer settlement documents should be signed successfully

    When I switch from General User to Buyer Solicitor
    And the Buyer Solicitor opens the settlement for the created Fixed Price listing
    Then the Buyer Solicitor should see the Buyer documents as signed

    When the Buyer Solicitor passes the signed documents to the Seller Solicitor
    Then the signed documents should be passed to the Seller Solicitor successfully

    When I switch from Buyer Solicitor to Agent
    And the Agent opens the settlement for the created Fixed Price listing
    And the Agent adds the configured Vendor
    Then the Vendor should be added successfully

    When I switch from Agent to Seller Solicitor
    And the Seller Solicitor opens the settlement for the created Fixed Price listing
    And the Seller Solicitor passes the settlement documents to the Vendor
    Then the settlement documents should be passed to the Vendor successfully

    When I switch from Seller Solicitor to Vendor
    And the Vendor opens the settlement documents
    And the Vendor signs all required settlement documents
    Then the Vendor settlement documents should be signed successfully

    When I switch from Vendor to Seller Solicitor
    And the Seller Solicitor opens the settlement for the created Fixed Price listing
    Then the Seller Solicitor should see the Vendor documents as signed

    When the Seller Solicitor proposes the configured settlement date
    Then the settlement date should be proposed successfully

    When I switch from Seller Solicitor to Buyer Solicitor
    And the Buyer Solicitor opens the settlement for the created Fixed Price listing
    And the Buyer Solicitor accepts the proposed settlement date
    Then the settlement date should be accepted successfully

    And all relevant parties should receive the settlement date notification
    And the accepted settlement date should be added to the calendar
    And the calendar settlement date should match the configured settlement date