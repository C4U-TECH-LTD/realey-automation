@smoke @footer @regression
Feature: Public footer

  Background:
    Given I open the Realey home page

  Scenario Outline: Footer behavior - <behavior>
    Then the footer behavior "<behavior>" is verified

    Examples:
      | behavior                                      |
      | Verify footer main information                |
      | Verify footer email subscription              |
      | Verify Fixed Price section elements           |
      | Verify Auctions section elements              |
      | Verify bottom footer elements                 |
      | Fixed Price - Listings link                   |
      | Fixed Price - Recently Added link             |
      | Fixed Price - Recently Ended link             |
      | Auctions - Listings link                      |
      | Auctions - Ending Soon link                   |
      | Auctions - Starting Soon link                 |
      | Auctions - Recently Added link                |
      | Auctions - Recently Ended link                |
      | Bottom Footer - Privacy Policy link           |
      | Bottom Footer - Terms and Conditions link     |
      | Bottom Footer - Instagram link                |
      | Bottom Footer - LinkedIn link                 |
