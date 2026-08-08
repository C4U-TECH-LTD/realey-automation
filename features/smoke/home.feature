@smoke @home @regression
Feature: Public home page

  Background:
    Given I open the Realey home page

  Scenario Outline: Home page behavior - <behavior>
    Then the home page behavior "<behavior>" is verified

    Examples:
      | behavior                                               |
      | Homepage loads successfully                            |
      | Hero - View Listing button is visible                  |
      | Hero - View Listing button opens Property Listings     |
      | Featured Properties heading is visible                 |
      | View All Listings button is visible                    |
      | View All Listings button opens Property Listings       |
      | Platform Features heading is visible                   |
      | Platform Features previous button works                |
      | Platform Features next button works                    |
      | Trusted partners heading is visible                    |
      | Real Estate Agents heading is visible                  |
      | Solicitors heading is visible                          |
      | Mortgage Brokers heading is visible                    |
      | FAQ heading is visible                                 |
      | FAQ - Schedule a property visit dropdown works         |
      | FAQ - Property listings verified dropdown works        |
      | FAQ - Home loan dropdown works                         |
      | FAQ - Brokerage and service fees dropdown works        |
      | FAQ - List property dropdown works                     |
      | FAQ - Save properties dropdown works                   |
      | Contact Us button is visible                           |
      | Contact Us button opens help page                      |
