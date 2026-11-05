@e2e @integrations @agentbox @crm
Feature: Flow 10 - Agentbox CRM Integration & Dynamic Synchronization

  Background:
    Given the agent is logged in for the Fixed Price E2E flow

  @tc-01 @tc-02 @tc-03
  Scenario: TC-01 to TC-03 - Agentbox Connection Status and Sync Toggle Controls
    When the Agent navigates to the Integrations dashboard
    Then the Agentbox integration card shows status "Connected"
    When the Agent turns syncing off
    Then the sync status toggles to disabled
    When the Agent turns syncing back on
    Then the sync status toggles to enabled

  @tc-04 @tc-08 @tc-12
  Scenario: TC-04, TC-08, TC-12 - Dynamic Manual Sync and Cross-Workspace Protection
    When the Agent navigates to the Integrations dashboard
    And the Agent triggers a manual "Sync now" batch
    Then the sync executes immediately without waiting for hourly schedule
    And the Agentbox activity log records dynamic sync counts with mathematical balance
    And the count of created listings in the activity log matches the Agentbox listings count on the Listings page
    And duplicate listings from other workspaces are skipped with protection message

  @tc-09 @tc-10 @tc-11
  Scenario: TC-09 to TC-11 - Inbound Listing Sync, S3 Media Transfer and Solicitor Flow
    When the Agent checks the imported Agentbox property on the Listings page
    Then the property shows the "Agentbox" source badge and valid formatted price
    And the property photos are served from S3 storage
    And the initial solicitor assignment starts blank awaiting agent action
    When the Agent assigns configured seller solicitor to the listing
    Then the listing reflects the assigned solicitor successfully

  @tc-25 @tc-26 @offers-push
  Scenario: TC-25 & TC-26 - Outbound Offer Push and CRM Contact Auto-Creation
    When I switch from Agent to General User
    And the General User opens the created Fixed Price listing
    And the General User submits an initial offer of "240000"
    Then the offer is submitted successfully
    When I switch from General User to Agent
    And the Agent navigates to the Integrations dashboard
    Then the Activity log confirms the offer push succeeded on attempt 1
    And the offer is registered in Agentbox CRM under the listing's Offers tab
    And the buyer is auto-created as a contact in Agentbox CRM

  @tc-15 @deal-protection
  Scenario: TC-15 - Deal Protection on CRM Listing Status Change
    Given an active offer exists on the imported Agentbox listing
    When the listing status is marked Withdrawn or Offline in Agentbox CRM
    And the Agent triggers a manual "Sync now" in Realey
    Then Deal Protection keeps the listing active because an active offer exists
    And listings under offer or contract are never archived automatically

  @tc-auction-rules @auctions
  Scenario: Auction Listing Synchronization and 48-Hour Timing Rules
    When an auction listing is imported from Agentbox
    Then Realey sets the auction end time to 48 hours after the start date
    And the listing is flagged with "Review auction" status in the Activity log
    And auctions with start dates older than 10 days are skipped

  @tc-33 @tc-34 @activity-notifications
  Scenario: TC-33 & TC-34 - Activity Log Filtering and Agent Sync Notification Emails
    When the Agent navigates to the Integrations dashboard
    And the Agent switches activity filter between "Changes" and "All"
    Then only change-based events are visible under "Changes"
    And the Agent checks email in YOPmail for the "Agentbox sync complete" summary report
