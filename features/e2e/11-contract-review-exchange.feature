@e2e @exchange @contract-review @reale-1252 @reale-1257
Feature: Flow 11 - Contract Review Loop Before Exchange Signing

  As a Seller's Solicitor and Buyer's Solicitor
  I want to review, comment on, and revise contract drafts before exchange signing
  So that contract negotiations are completed collaboratively while locking and isolating drafts from signers until finalized

  @tc-01 @token-holding @read-only-lockout
  Scenario: TC-01 - Token holding and read-only lockout between solicitors
    Given the Seller Solicitor is logged into the Solicitor dashboard
    When the Seller Solicitor navigates to the Exchange tab
    Then the initiated contract card displays the active version and current token holder status
    And when the token is held by the other solicitor, the current solicitor sees a read-only lockout banner and cannot modify the contract

  @tc-02 @append-only-comments
  Scenario: TC-02 - Append-only comments thread bound to contract versions
    Given the solicitor holding the review token opens the Comments tab on the exchange card
    When the solicitor submits a review comment on the active contract version
    Then the comment is appended to the comments thread with author name, role tag, version badge, and timestamp
    And the comments thread is strictly append-only with no edit or delete controls available

  @tc-03 @negative-upload @version-replacement
  Scenario: TC-03 - File type validation and multi-version contract history
    Given the solicitor holding the review token opens the "Upload new version" dialog
    When the solicitor attempts to upload a non-PDF file
    Then the upload dialog rejects the file and enforces PDF format up to 50 MB
    When the solicitor uploads a valid contract PDF with a descriptive version note
    Then the contract version increments to the new version number
    And the Versions history tab lists all chronological versions with direct view links, author tags, and version notes

  @tc-04 @return-loop @signature-box-requirement
  Scenario: TC-04 - Return workflow and signature placement prerequisite
    Given the Buyer Solicitor returns the revised contract to the Seller Solicitor
    When the Seller Solicitor inspects the returned contract on the Exchange tab
    Then the status updates to indicate the contract is with the Seller Solicitor
    And the "Send to buyer's solicitor" action is disabled until signature boxes are placed on the new version
    When the Seller Solicitor places required signature boxes using the wizard
    Then the "Send to buyer's solicitor" action becomes enabled

  @tc-05 @contract-locking @boldsign-dispatch
  Scenario: TC-05 - Contract locking and signing dispatch via Add Buyer as Signer
    Given the Buyer Solicitor holds the finalized contract version
    When the Buyer Solicitor assigns the buyer as signer
    Then the contract transitions to "Locked for signing"
    And all draft replacement and return review controls are permanently hidden
    And the contract document is dispatched to BoldSign for signing

  @tc-06 @party-isolation
  Scenario: TC-06 - Participant privacy and draft isolation
    Given the Buyer logs into the Buyer dashboard
    When the Buyer navigates to the Exchange tab
    Then the Buyer sees the action to sign the buyer counterpart
    And the internal solicitor review draft versions and negotiation comments are completely hidden
