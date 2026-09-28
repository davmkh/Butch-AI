# US-03 | FR-03
Feature: Checking dining hall hours
  As a hungry student, I want to ask when a dining hall is open, so that I don't walk
  across campus to a closed building.

  # Updated from the draft (7:00 AM to 8:00 PM) to Southside Café's real fall 2026 hours.
  Scenario: Dining hall is open
    Given it is 12:00 PM on a Monday
    And Southside Café is open from 7:30 AM to 9:00 PM on Mondays
    When the user asks "Is Southside open right now?"
    Then Butch responds that Southside is currently open
    And the response includes today's closing time of 9:00 PM

  Scenario: Dining hall is closed
    Given it is midnight
    And Southside Café is open from 7:30 AM to 9:00 PM on Mondays
    When the user asks "Is Southside open right now?"
    Then Butch responds that Southside is currently closed
    And the response includes the times and days that Southside is open
