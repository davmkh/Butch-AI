# US-06 | FR-04, NFR-01
Feature: WSU theme and Butch typing animation
  As a current or prospective student, I want the website to follow the traditional WSU
  colors and theme with a changing animation of Butch when typing, so that I can feel more
  immersed in the WSU college spirit.

  Scenario: Chat interface displays WSU colors and branding
    Given I load the Butch chatbot page
    When the user submits a response and Butch is typing
    Then the page shows WSU-themed crimson and gray colors
    And there is an animation that indicates Butch is typing, with a Butch graphic displayed near the chat window

  Scenario: Butch's avatar animates while a response is generating
    Given I have submitted a question
    When Butch is generating a response
    Then the Butch avatar switches to its "typing" animation or image
    And the avatar returns to its default state once the response is displayed
