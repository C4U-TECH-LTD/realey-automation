@e2e @auction @reserve-not-me @counter-reject @relist-fixed
Feature: Auction Reserve Price Not Met Counter Rejection and Fixed Price Relisting

  Scenario: Reserve price not met, buyer counter rejected and property re-listed as Fixed Price
    Given the agent is logged in for the Auction Counter Rejected Relist E2E flow

    When the agent creates and publishes an Auction listing for the Counter Rejected Relist flow
    Then the Auction Counter Rejected Relist listing is published successfully

    When I switch from Agent to General User for the Auction Counter Rejected Relist flow
    And the General User opens the created Auction Counter Rejected Relist listing
    And the General User registers as a bidder for the Auction Counter Rejected Relist flow
    Then the Auction Counter Rejected Relist bidder registration is completed successfully

    When the General User places the configured Auction Counter Rejected Relist bid
    Then the Auction Counter Rejected Relist bid is submitted successfully

    When I wait for the Auction Counter Rejected Relist auction to end
    Then the Auction Counter Rejected Relist auction has ended successfully
    And the Auction Counter Rejected Relist reserve price is not met

    When I switch from General User to Agent for the Auction Counter Rejected Relist flow
    And the Agent opens Bids for the Auction Counter Rejected Relist flow
    And the Agent starts negotiation for the Auction Counter Rejected Relist flow
    And the Agent submits the configured Auction Counter Rejected Relist counter offer
    Then the Auction Counter Rejected Relist counter offer is sent successfully

    When I switch from Agent to General User for the Auction Counter Rejected Relist flow
    And the General User opens Conversations for the Auction Counter Rejected Relist flow
    And the General User opens the Auction Agent conversation for the Counter Rejected Relist flow
    And the General User selects Counter Negotiate for the Auction Counter Rejected Relist flow
    And the General User submits the configured Auction Counter Rejected Relist counter negotiation
    Then the Auction Counter Rejected Relist counter negotiation is sent successfully

    When I switch from General User to Agent for the Auction Counter Rejected Relist flow
    And the Agent opens Bids for the Auction Counter Rejected Relist flow
    And the Agent opens the Auction bidder chat for the Counter Rejected Relist flow
    And the Agent declines the Auction negotiated offer
    Then the Auction negotiated offer is declined successfully

    When the Agent returns to Bids for the Auction Counter Rejected Relist flow
    And the Agent clicks Re-list for the Auction Counter Rejected Relist property
    And the Agent continues through the first Re-list step
    And the Agent continues through the second Re-list step
    And the Agent edits the Re-list listing type
    And the Agent changes the Re-list listing type to Fixed Price
    And the Agent continues from the Re-list pricing step
    And the Agent continues through the final Re-list step
    And the Agent confirms the Re-list listing
    And the Agent publishes the Re-listed property
   
