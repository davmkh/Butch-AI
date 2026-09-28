# US-04 | FR-03
Feature: Finding an academic deadline
  As a current student, I want to ask about deadlines like the last day to drop a class,
  so that I don't miss important dates.

  Scenario: Deadline hasn't passed
    Given it is the 2nd week of classes
    And the knowledge base contains the academic school calendar
    When the user asks "What is the last day to drop a class?"
    Then Butch responds with a specific date for the deadline to drop classes
    And the date matches the current semester's academic calendar

  # Changed from "2nd week" in the draft: the Fall 2026 drop deadline (Sept. 22) falls in week 5.
  Scenario: Deadline passed
    Given it is the 5th week of classes
    And the knowledge base contains the academic school calendar
    When the user asks "What is the last day to drop a class?"
    Then Butch responds that the drop deadline has already passed
    And includes a link to the Registrar's Office for late withdrawal options
