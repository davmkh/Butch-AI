# NFR-04 (320px to 1920px) and NFR-05 (WCAG 2.1 AA, keyboard, screen readers)
Feature: Accessible, responsive chat
  Butch should work for everyone: any screen size, keyboard only, or with a screen reader.

  Scenario: The chat page has no automatically detectable WCAG 2.1 AA violations
    Given I am on the Butch chatbot page
    When the user asks "Is Southside open right now?"
    Then the page has no detectable WCAG 2.1 AA accessibility violations

  Scenario: A question can be asked with only the keyboard
    Given I am on the Butch chatbot page
    When I tab to the question box and type "Tell me about campus life" then press Enter
    Then Butch responds with information about student life at WSU

  Scenario Outline: The chat works on a <width>px wide screen
    Given the screen is <width> pixels wide
    And I am on the Butch chatbot page
    When the user asks "Tell me about campus life"
    Then Butch's reply fits on screen without scrolling sideways

    Examples:
      | width |
      | 320   |
      | 768   |
      | 1920  |
