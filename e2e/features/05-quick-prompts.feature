# US-05 | FAQ quick-reply buttons
Feature: Using an FAQ quick prompt
  As a returning user, I want pre-made prompts in small button form for the most asked
  questions, so that I save time when asking a common question.

  Scenario: User clicks a quick prompt button
    Given the user is on the chat page
    And the "Tell me about campus life" button is visible
    When the user clicks the "Tell me about campus life" button
    Then that chat is sent as a user message without typing anything
    And Butch responds with information about student life at WSU

  Scenario: Returning user sees personalized quick prompts
    Given I am a returning user with prior chat history
    When the chatbot page loads
    Then the quick-reply buttons include at least one question relevant to my prior activity

  # Split out from the draft's last line ("...the site-wide most-asked questions if I have no history").
  Scenario: New user sees the site-wide most-asked questions
    Given I am a new user with no chat history
    When the chatbot page loads
    Then the quick-reply buttons show the site-wide most-asked questions
