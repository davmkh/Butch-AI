# US-08 | FR-09
# @todo: needs the admin log-review screen (backlog). The server already logs every
# exchange without personal info; see server/src/app.test.ts ("US-08 / FR-09").
@todo
Feature: Log conversations for administrator review
  As a university administrator, I want conversation logs stored automatically, so that I
  can review anonymous chatbot performance and identify knowledge base gaps.

  Scenario: A completed exchange is logged with a timestamp
    Given a user asks a question and receives a response
    When that information is logged in the database
    Then the system records the question, response, and timestamp in the backend database
    And it is reviewable by administrators to understand the working of the AI

  Scenario: Logged conversations contain no personally identifiable information
    Given an unauthenticated user has a conversation with Butch
    When the exchange is logged
    Then no personally identifiable information is stored with the log entry
    And the log entry can still be reviewed in aggregate for performance trends
