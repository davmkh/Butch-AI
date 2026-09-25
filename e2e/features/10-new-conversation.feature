# US-10 | FR-06, FR-07
Feature: Start a new conversation
  As a returning user, I want to start a new conversation and clear my chat history, so
  that I can ask about a new topic without old messages cluttering the screen.

  Scenario: Starting a new conversation clears the chat window
    Given I have an active conversation with 5 exchanged messages
    When I click "New Conversation"
    Then the chat window is cleared
    And I see Butch's default greeting message

  # @todo: checking the backend log end-to-end needs the admin log screen (US-08).
  # The server test "keeps the same conversation ... (US-10)" already covers it.
  @todo
  Scenario: Clearing the chat window does not delete the backend log
    Given I have an active conversation
    When I click "New Conversation"
    Then the prior conversation is still recorded in the backend log
    And only the visible chat window is cleared
