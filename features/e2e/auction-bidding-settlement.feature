@e2e @auction @bidding
Feature: Auction Bidding and Settlement

  Scenario: Two bidders place bids and the winning bidder proceeds to settlement
    Given the agent is logged in for the Auction E2E flow

    When the agent creates and publishes an Auction listing
    Then the Auction listing is published successfully

    When I switch from Agent to First Auction Buyer
    And the First Auction Buyer opens the created Auction listing
    And the First Auction Buyer registers as a bidder
    Then the First Auction Buyer registration is successful

    When the First Auction Buyer places the configured Auction bid
    Then the First Auction Buyer bid is submitted successfully

    When I switch from First Auction Buyer to Second Auction Buyer
    And the Second Auction Buyer opens the created Auction listing
    And the Second Auction Buyer registers as a bidder
    Then the Second Auction Buyer registration is successful

    When the Second Auction Buyer places the configured winning Auction bid
    Then the Second Auction Buyer bid is submitted successfully

    When I wait for the Auction to end
    Then the Auction has ended successfully

    When I login again as Second Auction Buyer for settlement
    And the Second Auction Buyer opens the created Auction listing again
    And the Second Auction Buyer starts the Auction settlement process
    And the Second Auction Buyer pays the Auction deposit
    Then the Auction deposit payment is successful

    When the Second Auction Buyer continues after Auction payment
    And the Second Auction Buyer continues through Auction personal details
    And the Second Auction Buyer selects the Auction configured solicitor
    And the Second Auction Buyer selects the Auction configured mortgage broker
 
   