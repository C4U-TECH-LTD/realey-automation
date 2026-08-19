@e2e @auction @reserve-not-met @counter-offer @settlement
Feature: Auction Reserve Price Not Met Counter Offer Negotiation and Settlement

  Scenario: Reserve price not met, counter negotiation accepted and settlement completed
    Given the agent is logged in for the Auction Reserve Not Met E2E flow

    When the agent creates and publishes an Auction listing for the Reserve Not Met flow
    Then the Auction Reserve Not Met listing is published successfully

    When I switch from Agent to General User for the Auction Reserve Not Met flow
    And the General User opens the created Auction Reserve Not Met listing
    And the General User registers as a bidder for the Auction Reserve Not Met flow
    Then the Auction Reserve Not Met bidder registration is completed successfully

    When the General User places the configured Auction Reserve Not Met bid
    Then the Auction Reserve Not Met bid is submitted successfully

    When I wait for the Auction Reserve Not Met auction to end
    Then the Auction Reserve Not Met auction has ended successfully
    And the Auction reserve price is not met

    When I switch from General User to Agent for the Auction Reserve Not Met flow
    And the Agent opens Bids for the Auction Reserve Not Met flow
    And the Agent starts negotiation for the Auction Reserve Not Met flow
    And the Agent submits the configured Auction Reserve Not Met counter offer
    Then the Auction Reserve Not Met counter offer is sent successfully

    When I switch from Agent to General User for the Auction Reserve Not Met flow
    And the General User opens Conversations for the Auction Reserve Not Met flow
    And the General User opens the Auction Agent conversation
    And the General User selects Counter Negotiate for the Auction Reserve Not Met flow
    And the General User submits the configured Auction Reserve Not Met counter negotiation
    Then the Auction Reserve Not Met counter negotiation is sent successfully

    When I switch from General User to Agent for the Auction Reserve Not Met flow
    And the Agent opens Bids for the Auction Reserve Not Met flow
    And the Agent opens the Auction bidder chat
    And the Agent accepts the Auction negotiated offer
    Then the Auction negotiated offer is accepted successfully

    When I switch from Agent to General User for the Auction Reserve Not Met flow
    And the General User opens the created Auction Reserve Not Met listing again
    And the General User starts the Auction Reserve Not Met settlement process
    And the General User pays the Auction Reserve Not Met deposit
    And the General User continues after the Auction Reserve Not Met payment
    And the General User continues through Auction Reserve Not Met personal details
    And the General User selects the Auction Reserve Not Met configured solicitor
    And the General User selects the Auction Reserve Not Met configured mortgage broker
 
