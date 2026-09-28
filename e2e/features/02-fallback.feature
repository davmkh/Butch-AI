# US-02 | FR-03, FR-05
Feature: Fallback when Butch can't answer
  As a current student, I want Butch to give me a link to the right WSU office when he
  can't answer, so that I'm not stuck with a wrong or made-up answer.

  Scenario: Question meets the confidence threshold
    Given the knowledge base has information about Parents Weekend Fall 2026 dates
    When the user asks "When is Parents Weekend Fall 2026?"
    Then Butch responds with a specific range of dates that match the knowledge base
    And will include a link to the actual Parents Weekend information website

  Scenario: Question is below the confidence threshold
    Given the knowledge base has no information about parking permit refunds
    When the user asks "How do I get a refund on my parking permit?"
    Then Butch responds with a fallback message instead of guessing
    And the response includes at least one working link to a WSU help resource
