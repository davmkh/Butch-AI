# US-09 | FR-10, NFR-06, NFR-07
# @todo: needs the admin interface and WSU sign-in (backlog).
@todo
Feature: Manage the chatbot knowledge base
  As an authorized administrator, I want to add, edit, or remove knowledge-base entries
  through an admin interface, so that I can keep Butch's answers accurate without needing
  a developer.

  Scenario: Administrator successfully adds a new knowledge-base entry
    Given I am logged in as an authorized administrator
    When I add a new Q&A entry for "How do I get a Cougar Card?"
    Then the entry is saved
    And Butch can answer that question within 10 minutes

  Scenario: An unauthorized user cannot access the admin interface
    Given I am not logged in as an administrator
    When I attempt to navigate to the admin interface URL directly
    Then I am redirected to a login page
    And I cannot view or edit knowledge-base entries
