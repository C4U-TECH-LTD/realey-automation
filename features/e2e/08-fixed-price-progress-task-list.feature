@e2e @all-flows @flow-8 @fixed-price @direct-offer @task-list @settlement
Feature: Flow 8 - Fixed Price Direct Offer Progress Task List

  Scenario: Configure Progress Task List appears only after buyer completes settlement

    Given the agent is logged in for the Fixed Price Task List flow
    When the agent creates and publishes a Fixed Price listing for the Task List flow
    Then the Fixed Price Task List listing is published successfully

    When I switch from Agent to Seller Solicitor for the Fixed Price Task List flow
    And the Seller Solicitor opens the Settlements tab for the created Fixed Price listing
    And the Seller Solicitor opens Configure Progress Task for the created Fixed Price listing
    And the Seller Solicitor scrolls down and submits the progress tasks configuration
    Then the progress tasks are configured successfully for the property

    When I switch from Seller Solicitor to General User for the Fixed Price Task List flow
    And the General User opens the created Fixed Price Task List listing
    And the General User submits the configured Fixed Price Task List offer
    Then the Fixed Price Task List offer is submitted successfully

    When I switch from General User to Agent for the Fixed Price Task List flow
    And the Agent opens the submitted Fixed Price Task List offer
    And the Agent sends the Fixed Price Task List counter offer via chat
    Then the Fixed Price Task List counter offer is sent successfully

    When I switch from Agent to General User for the Fixed Price Task List flow
    And the General User opens Conversations for the Fixed Price Task List flow
    And the General User opens the Agent conversation for the Fixed Price Task List flow
    And the General User clicks the Progress tab in the chatroom
    Then the Configure Progress Task List should not be visible
    And the chatroom should display that progress tasks will appear once an offer is accepted

    When the General User accepts the counter offer in the chatroom

    When I switch from General User to Agent for the Fixed Price Task List flow
    And the Agent opens the submitted Fixed Price Task List offer again
    And the Agent accepts the Fixed Price Task List offer
    Then the Fixed Price Task List offer is accepted successfully

    When I switch from Agent to General User for the Fixed Price Task List flow
    And the General User opens the created Fixed Price Task List listing again
    And the General User starts the Fixed Price Task List settlement process
    And the General User selects the Fixed Price Task List configured solicitor
    And the General User selects the Fixed Price Task List configured mortgage broker
    And the General User pays the Fixed Price Task List deposit
    Then the Fixed Price Task List deposit payment is successful

    When the General User opens Conversations for the Fixed Price Task List flow
    And the General User opens the Agent conversation for the Fixed Price Task List flow
    And the General User clicks the Progress tab in the chatroom
    Then the assigned Configure Progress Task List should automatically appear
