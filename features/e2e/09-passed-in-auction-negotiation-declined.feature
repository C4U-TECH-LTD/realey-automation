@e2e @all-flows @flow-9 @auction @passed-in @negotiation-declined
Feature: Flow 9 - Passed-In Auction Negotiation Declined (No Counter-Offer)

  Scenario: Flow 9 - Reserve not met, agent negotiates with highest bidder, highest bidder declines, agent can move to next-highest genuine bidder
    Given the agent is logged in for the Passed-In Auction Negotiation Declined E2E flow

    When the agent creates and publishes an Auction listing for the Passed-In Auction Declined flow
    Then the Passed-In Auction Declined listing is published successfully

    When I switch from Agent to First Buyer for the Passed-In Auction Declined flow
    And the First Buyer opens the created Passed-In Auction Declined listing
    And the First Buyer registers as a bidder for the Passed-In Auction Declined flow
    Then the First Buyer Passed-In Auction Declined bidder registration is completed successfully

    When the First Buyer places the configured Passed-In Auction Declined bid
    Then the First Buyer Passed-In Auction Declined bid is submitted successfully

    When I switch from First Buyer to Second Buyer for the Passed-In Auction Declined flow
    And the Second Buyer opens the created Passed-In Auction Declined listing
    And the Second Buyer registers as a bidder for the Passed-In Auction Declined flow
    Then the Second Buyer Passed-In Auction Declined bidder registration is completed successfully

    When the Second Buyer places the configured Passed-In Auction Declined winning bid
    Then the Second Buyer Passed-In Auction Declined bid is submitted successfully

    When I wait for the Passed-In Auction Declined auction to end
    Then the Passed-In Auction Declined auction has ended successfully
    And the Passed-In Auction Declined reserve price is not met

    When I switch from Second Buyer to Agent for the Passed-In Auction Declined flow
    And the Agent opens Bids for the Passed-In Auction Declined flow
    And the Agent starts negotiation for the Passed-In Auction Declined flow
    And the Agent submits the configured Passed-In Auction Declined counter offer
    Then the Passed-In Auction Declined counter offer is sent successfully

    When I switch from Agent to Second Buyer for the Passed-In Auction Declined flow
    And the Second Buyer opens Conversations for the Passed-In Auction Declined flow
    And the Second Buyer opens the Passed-In Auction Declined agent conversation
    And the Second Buyer declines the Passed-In Auction Declined negotiation
    Then the Passed-In Auction Declined negotiation is declined successfully by the Second Buyer

    When I switch from Second Buyer back to Agent for the Passed-In Auction Declined flow
    And the Agent opens Bids again for the Passed-In Auction Declined flow
    Then the Agent can move to the next-highest genuine bidder for the Passed-In Auction Declined flow
