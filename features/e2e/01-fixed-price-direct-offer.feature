@e2e @all-flows @flow-1 @fixed-price @direct-offer @notifications @yopmail
Feature: Flow 1 - Fixed Price Direct Offer Acceptance and Settlement

  Scenario: Flow 1 - Direct offer acceptance, validations, photo swapping and settlement
    Given the agent is logged in for the Fixed Price E2E flow
    When the Agent tests the logout and re-login functionality with field validations

    When the agent starts creating a Fixed Price listing
    And the agent completes the property location step for the Fixed Price listing
    And the agent completes the property details step for the Fixed Price listing
    And the agent verifies required price validation on the Pricing step
    And the agent completes the pricing and sale method step for the Fixed Price listing
    And the agent verifies data persistence by navigating back and forward from the Pricing step
    And the agent completes the description and features step for the Fixed Price listing
    And the agent tests negative file format upload on the media step
    And the agent tests the maximum photo upload limit with 31 images
    And the agent uploads the property photos for the Fixed Price listing
    And the agent tests photo swapping on the uploaded property photos
    And the agent removes an uploaded property photo and verifies the updated count
    And the agent uploads the floor plan for the Fixed Price listing
    And the agent tests negative document format upload on the media step
    And the agent uploads the contract document for the Fixed Price listing
    And the agent confirms the Fixed Price listing
    And the agent publishes the Fixed Price listing
    Then the Fixed Price listing is published successfully

    # Agent Dashboard Listings Management
    When the Agent checks the listings status filter options and filters by "Active"
    And the Agent toggles between Grid and List view to verify rendering

    # Buyer Login and Property Verification
    When I switch from Agent to General User
    And the General User opens the created Fixed Price listing
    And the General User verifies all property photos and property details match the listing
    And the General User verifies the floor plan is visible and can be downloaded
    And the General User verifies the property contract document is visible and can be downloaded
    And the General User saves the property to favorites
    And the General User opens the contact agent inquiry form
    And the General User submits an initial offer of "20000"
    And the General User edits the offer to the configured amount
    Then the offer is submitted successfully

    # Agent Notification & Email Check on Offer Submission
    When I switch from General User to Agent
    And the Agent checks the notification drawer for the offer received notification
    And the Agent checks email in YOPmail for the offer received email
    And the Agent accepts the submitted offer
    Then the offer is accepted successfully

    # Buyer Notification & Email Check on Offer Acceptance, and Settlement
    When I switch from Agent to General User
    And the General User checks the notification drawer for the offer accepted notification
    And the General User checks email in YOPmail for the offer accepted email
    And the General User opens the created Fixed Price listing again
    And the General User starts the settlement process
    And the General User selects the configured solicitor
    And the General User selects the configured mortgage broker
    And the General User pays the deposit
    Then the deposit payment is successful

    # Settlement Verification
    When I switch from General User to Agent
    Then the Agent verifies the settlement shows 5/5 steps completed

