@e2e @offer-price @counter-offer
Feature: Offer Price Counter Offer Negotiation and Settlement

  Scenario: Counter offer negotiation, acceptance and deposit payment
    Given the agent is logged in for the Offer Price E2E flow

    When the agent creates and publishes an Offer Price listing
    Then the Offer Price listing is published successfully

    When I switch from Agent to General User for the Offer Price flow
    And the General User opens the created Offer Price listing
    And the General User submits the Offer Price configured offer
    Then the Offer Price offer is submitted successfully

    When I switch from General User to Agent for the Offer Price flow
    And the Agent opens the submitted Offer Price offer
    And the Agent sends the configured counter offer via chat
    Then the counter offer is sent successfully

    When I switch from Agent to General User for the Offer Price flow
    And the General User opens Conversations for the Offer Price flow
    And the General User opens the Agent conversation
    And the General User selects Counter Negotiate
    And the General User submits the configured counter negotiation
    Then the counter negotiation is sent successfully

    When I switch from General User to Agent for the Offer Price flow
    And the Agent opens Conversations for the Offer Price flow
    And the Agent opens the Buyer conversation
    And the Agent accepts the negotiated offer
    Then the negotiated offer is accepted successfully

    When I switch from Agent to General User for the Offer Price flow
    And the General User opens the created Offer Price listing again
    And the General User starts the Offer Price settlement process
    And the General User selects the Offer Price configured solicitor
    And the General User selects the Offer Price configured mortgage broker
    And the General User pays the Offer Price deposit
    Then the Offer Price deposit payment is successful
