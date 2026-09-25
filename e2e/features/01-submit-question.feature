# US-01 | FR-01, FR-02
Feature: Submit a question to Butch
  As a prospective student, I want to type a question to Butch and submit it with a button
  or the Enter key, so that I can quickly ask about campus information.

  Scenario: Successful submission via Send button
    Given I am on the Butch chatbot page
    When I type "What time does the library close?" in the response bar
    And I click the "Send" button
    Then my message appears as a new chat bubble

  # Added: the story also promises the Enter key.
  Scenario: Successful submission via the Enter key
    Given I am on the Butch chatbot page
    When I type "What time does the library close?" in the response bar
    And I press Enter
    Then my message appears as a new chat bubble

  Scenario: Empty message cannot be submitted
    Given I am on the Butch chatbot page
    And the response bar is empty
    When I click the "Send" button
    Then no new chat bubble is added to the conversation
