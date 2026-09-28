# US-07 | FR-08
Feature: Rate Butch's responses
  As a user, I want to rate each response with a thumbs-up or down, so that I can give
  feedback on answer quality.

  Scenario: User submits a thumbs-up rating
    Given Butch has responded to my question
    When I click the thumbs-up icon on that response
    Then the rating is recorded
    And the thumbs-up icon is shown as selected

  Scenario: User changes a rating from thumbs-up to thumbs-down
    Given I already rated a response with a thumbs-up
    When I click the thumbs-down icon on the same response
    Then the rating updates to thumbs-down
    And only one rating is recorded per response
