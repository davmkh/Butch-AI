# Product backlog

Every feature, user story, requirement, and known issue for Butch AI in one place, each with a
unique ID, a one-line description, and a priority. Sprint planning picks from this list; the
items chosen for a sprint are copied into that sprint's backlog (see
[SPRINT_1_BACKLOG.md](SPRINT_1_BACKLOG.md)) with owners, effort, and acceptance criteria.

**ID scheme.** `US-` user stories, `FR-` functional requirements, `NFR-` non-functional
requirements (all three from Assignment 1 and [TRACEABILITY.md](../TRACEABILITY.md)), `T-`
technical and process work, `SEC-` findings from [SECURITY_REVIEW.md](../SECURITY_REVIEW.md).

**Priority.** High = needed for the product to be usable or for a graded deliverable.
Medium = makes answers noticeably better. Low = nice to have.

**Status** is as of 2026-10-15 (end of sprint 1).

## User stories

| ID    | Description                                                                                                     | Priority | Status      | Sprint |
| ----- | --------------------------------------------------------------------------------------------------------------- | -------- | ----------- | ------ |
| US-01 | As a student, I can type a question and send it with the button or Enter so I get an answer.                    | High     | Done        | 1      |
| US-02 | As a student, when Butch is not confident he points me to the right WSU office with a link instead of guessing. | High     | Done        | 1      |
| US-03 | As a student, I can ask whether a dining hall is open right now and get its hours.                              | High     | Done        | 1      |
| US-04 | As a student, I can ask about an academic deadline and learn whether it has passed.                             | High     | Done        | 1      |
| US-05 | As a student, I see FAQ quick-prompt buttons so I can ask common questions with one click.                      | Medium   | Done        | 1      |
| US-06 | As a student, the chat uses WSU colors and an animated Butch avatar that reacts while he is typing.             | Medium   | Done        | 1      |
| US-07 | As a student, I can rate each reply thumbs up or down so the team can improve answers.                          | Medium   | Done        | 1      |
| US-08 | As an administrator, I can review logged conversations (no user identity) to see what students ask.             | High     | Partial     | 1, 3   |
| US-09 | As an administrator, I can add, edit, and remove knowledge-base entries without a redeploy.                     | High     | Not started | 3      |
| US-10 | As a student, I can start a new conversation that clears the window without deleting the server log.            | Medium   | Done        | 1      |
| US-11 | As a student, Butch phrases answers conversationally using an AI model grounded in the knowledge base.          | High     | Done        | 1      |
| US-12 | As a student, Butch can answer questions outside the knowledge base by searching wsu.edu and citing pages.      | Medium   | Not started | 2      |
| US-13 | As a student, I see the reply appear word by word (streaming) so the app feels fast.                            | Medium   | Not started | 2      |
| US-14 | As a student, I can ask a follow-up like "when does it close?" and Butch uses the previous question.            | Medium   | Not started | 2      |
| US-15 | As a student, the quick prompts reflect the most-asked questions of the last 30 days.                           | Low      | Not started | 2      |
| US-16 | As a student, Butch has finished mascot art (or Lottie animation) with a static frame for reduced motion.       | Low      | Partial     | 2      |
| US-17 | As an administrator, I must sign in with WSU 2FA (or a documented stand-in) before using admin tools.           | High     | Not started | 3      |
| US-18 | As an administrator, I see a feedback dashboard: downvotes, fallbacks, and most-asked questions.                | Medium   | Not started | 3      |
| US-19 | As a WSU web editor, I can embed Butch as a floating chat bubble on a WSU page.                                 | Low      | Not started | 4      |

## Functional requirements

| ID    | Description                                                                                    | Priority | Status      | Sprint |
| ----- | ---------------------------------------------------------------------------------------------- | -------- | ----------- | ------ |
| FR-01 | Type a question; send via button or Enter.                                                     | High     | Done        | 1      |
| FR-02 | Distinct user and Butch bubbles shown in order.                                                | High     | Done        | 1      |
| FR-03 | Answer from a curated WSU knowledge base.                                                      | High     | Done        | 1      |
| FR-04 | "Butch is typing" indicator while a reply is generated.                                        | Medium   | Done        | 1      |
| FR-05 | Fallback with a WSU help link when confidence is below the threshold.                          | High     | Done        | 1      |
| FR-06 | Start a new conversation.                                                                      | Medium   | Done        | 1      |
| FR-07 | Keep session history while on the page.                                                        | Medium   | Done        | 1      |
| FR-08 | Thumbs up or down on each reply.                                                               | Medium   | Done        | 1      |
| FR-09 | Log exchanges with timestamps and no user identity.                                            | High     | Partial     | 1, 3   |
| FR-10 | Admin can add, edit, and remove knowledge-base entries.                                        | High     | Not started | 3      |
| FR-11 | Display FAQ quick-reply buttons that send the question when clicked. (Proposed; covers US-05.) | Medium   | Done        | 1      |
| FR-12 | Display an animated Butch avatar with a "typing" state. (Proposed; covers US-06.)              | Medium   | Done        | 1      |

## Non-functional requirements

| ID     | Description                                                   | Priority | Status                                | Sprint |
| ------ | ------------------------------------------------------------- | -------- | ------------------------------------- | ------ |
| NFR-01 | WSU colors, font, and college feel.                           | Medium   | Done                                  | 1      |
| NFR-02 | 200 concurrent users with replies within 5 seconds.           | High     | Not tested                            | 2, 4   |
| NFR-03 | 99.5% uptime; degrade to offline answers if the AI API fails. | High     | Partial                               | 4      |
| NFR-04 | Usable from 320 px to 1920 px wide.                           | Medium   | Done                                  | 1      |
| NFR-05 | WCAG 2.1 AA: keyboard, screen reader, reduced motion.         | High     | Done (automated); manual pass pending | 1, 4   |
| NFR-06 | Admin sign-in requires WSU 2FA.                               | High     | Not started                           | 3      |
| NFR-07 | Knowledge-base edits apply without a redeploy.                | Medium   | Partial                               | 3      |

## Technical and process work

T-01 to T-05, T-07, and T-23 match the GitHub issues Kaiden opened on 2026-10-15. T-06 and
T-08 to T-22 are reserved for the rest of that list and will be filled in when it lands.

| ID   | Description                                                                                     | Priority | Status      | Sprint |
| ---- | ----------------------------------------------------------------------------------------------- | -------- | ----------- | ------ |
| T-01 | Project setup: npm workspaces, TypeScript, Express API, React client, Vitest, Playwright, CI.   | High     | Done        | 1      |
| T-02 | PostgreSQL storage via Prisma, with an in-memory store for tests and no-Docker setups.          | High     | Done        | 1      |
| T-03 | Connect Butch to an AI API (DeepSeek) with an offline fallback when no key is set or it fails.  | High     | Done        | 1      |
| T-04 | UML diagrams: use case, class, collaboration, sequence, each with a description.                | High     | In review   | 1      |
| T-05 | Accessible, responsive chat: axe clean, keyboard-only, 320 to 1920 px.                          | High     | Done        | 1      |
| T-07 | Shared team API key with a spend limit (SEC-10).                                                | Medium   | To do       | 2      |
| T-23 | Improve the AI's replies: conversational, in Butch's voice, grounded, within 5 s.               | High     | Done        | 1      |
| T-24 | Knowledge base v1: 40+ verified WSU facts with source links, keyword search, typo tolerance.    | High     | Done        | 1      |
| T-25 | Security and privacy review of sprint 1 code (SECURITY_REVIEW.md).                              | High     | Done        | 1      |
| T-26 | Documentation set: README, ARCHITECTURE, DATA_STRATEGY, SCENARIOS, TRACEABILITY, ROADMAP.       | Medium   | Done        | 1      |
| T-27 | Sprint 1 submission: Kanban board and screenshots, review, retrospective report, demo video.    | High     | In progress | 1      |
| T-28 | Branch protection on `main`: PR required, 1 approval, CI green.                                 | Medium   | To do       | 2      |
| T-29 | DeepSeek latency and cost table for 20 typical questions; pick the default model.               | Medium   | To do       | 2      |
| T-30 | Adversarial question list (25 prompts) run against DeepSeek mode; adjust persona if needed.     | Medium   | To do       | 2      |
| T-31 | Grow the knowledge base by 15 to 20 entries (jobs, Greek life, parking, financial aid, safety). | Medium   | To do       | 2      |
| T-32 | Figma mockups of the chat on desktop and mobile using the WSU tokens.                           | Low      | To do       | 2      |
| T-33 | Knowledge base moved into the database with a seed script (enables NFR-07).                     | High     | To do       | 3      |
| T-34 | Admin API: knowledge CRUD, log list and filters, feedback summary.                              | High     | To do       | 3      |
| T-35 | Deploy to Render: Dockerfile, web service, static site, managed PostgreSQL, deploy workflow.    | High     | To do       | 4      |
| T-36 | Load test for NFR-02 and record results.                                                        | Medium   | To do       | 4      |
| T-37 | Structured request logging and an uptime check on `/api/health`.                                | Low      | To do       | 4      |
| T-38 | Manual accessibility pass with a screen reader (NVDA or VoiceOver).                             | Medium   | To do       | 2      |

## Open issues from the security review

Fixed findings SEC-01 to SEC-06 are closed. Open ones that need work:

| ID     | Description                                                                 | Priority | Sprint |
| ------ | --------------------------------------------------------------------------- | -------- | ------ |
| SEC-07 | Repository is public; decide whether to make it private before deployment.  | Medium   | 2      |
| SEC-08 | No authentication; admin tools must stay local until US-17 ships.           | High     | 3      |
| SEC-09 | Prompt injection and off-topic replies (covered by T-30).                   | Medium   | 2      |
| SEC-10 | Denial of wallet: keep the DeepSeek balance small; separate production key. | Medium   | 2      |
| SEC-11 | Personal information in free text: redact before saving; retention period.  | Medium   | 4      |
| SEC-13 | Deployment settings checklist (NODE_ENV, CLIENT_ORIGIN, host secrets).      | Medium   | 4      |
| SEC-14 | Security headers for the static site.                                       | Low      | 4      |
| SEC-16 | No request or audit logging (covered by T-37).                              | Low      | 4      |
