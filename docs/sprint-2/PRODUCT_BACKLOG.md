# Product backlog (Sprint 2)

Every feature, user story, requirement, and known issue for the Butch AI **app** in one place,
each with a unique ID, a one-line description, and a priority. Course deliverables (slideshow,
video, review and retrospective meetings, reports) are not product work, so they are not listed
here; the sprint 2 ones are tracked in the sprint backlog and on the board. Sprint planning picks from this list; the
items chosen for a sprint are copied into that sprint's backlog (see
[SPRINT_2_BACKLOG.md](SPRINT_2_BACKLOG.md)) with owners, effort, and acceptance criteria. The
sprint 1 version is kept as the record of that sprint: [../sprint-1/PRODUCT_BACKLOG.md](../sprint-1/PRODUCT_BACKLOG.md).

The project has three sprints. Sprint 1 ran 2026-09-18 to 2026-10-15, sprint 2 runs 2026-10-13 to
2026-11-05, and sprint 3 runs 2026-11-05 to 2026-12-06.

**ID scheme.** `US-` user stories, `FR-` functional requirements, `NFR-` non-functional
requirements (all three from Assignment 1 and [TRACEABILITY.md](../TRACEABILITY.md)), `T-`
technical work, `SEC-` findings from [SECURITY_REVIEW.md](../SECURITY_REVIEW.md).

**Priority.** High = needed for the product to be usable or for a graded deliverable.
Medium = makes answers noticeably better. Low = nice to have.

**Status** is as of 2026-11-03 (the midpoint of the board).

## What changed since sprint 1

| Source                      | What we learned                                                                                                                           | Backlog items           |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| Sprint 1 retrospective      | Separate DeepSeek keys per developer, and protect `main` with reviews and CI.                                                             | T-07, T-28              |
| Team goal for sprint 2      | Run Butch from a server with a hosted PostgreSQL, so running it does not need Docker Desktop.                                             | US-20, T-35, T-39, T-40 |
| Live testing, 2026-10-27    | "Tell me about Sigma Nu" still falls back; jobs and password answers come from the AI's general knowledge, not the data.                  | T-31, T-46, T-52        |
| Live testing, 2026-10-27    | `npm audit` flagged 4 runtime packages (patched) and 5 dev-tool packages that need a coordinated upgrade.                                 | T-41                    |
| Live site check, 2026-11-03 | Butch is live on Railway. General-knowledge answers can include claims nobody verified (for example mascot history).                      | T-46, US-12             |
| Live site check, 2026-11-03 | The deployed code is on `feature/railway-deploy`, not `main`, so CI has not run on it.                                                    | T-35, T-39              |
| Team decision               | Only three sprints, so work planned for later sprints moves to sprint 3 or is dropped. Several features and the admin tools were removed. | -                       |

## User stories

| ID    | Description                                                                                                     | Priority | Status                                                                  | Sprint |
| ----- | --------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------- | ------ |
| US-01 | As a student, I can type a question and send it with the button or Enter so I get an answer.                    | High     | Done                                                                    | 1      |
| US-02 | As a student, when Butch is not confident he points me to the right WSU office with a link instead of guessing. | High     | Done                                                                    | 1      |
| US-03 | As a student, I can ask whether a dining hall is open right now and get its hours.                              | High     | Done                                                                    | 1      |
| US-04 | As a student, I can ask about an academic deadline and learn whether it has passed.                             | High     | Done                                                                    | 1      |
| US-05 | As a student, I see FAQ quick-prompt buttons so I can ask common questions with one click.                      | Medium   | Done                                                                    | 1      |
| US-06 | As a student, the chat uses WSU colors and an animated Butch avatar that reacts while he is typing.             | Medium   | Done                                                                    | 1      |
| US-07 | As a student, I can rate each reply thumbs up or down so the team can improve answers.                          | Medium   | Done                                                                    | 1      |
| US-08 | As an administrator, I can review logged conversations (no user identity) to see what students ask.             | High     | Done: logs are saved and read with the database viewer; no admin screen | 1      |
| US-10 | As a student, I can start a new conversation that clears the window without deleting the server log.            | Medium   | Done                                                                    | 1      |
| US-11 | As a student, Butch phrases answers conversationally using an AI model grounded in the knowledge base.          | High     | Done                                                                    | 1      |
| US-12 | As a student, Butch can answer questions outside the knowledge base by searching wsu.edu and citing pages.      | Medium   | Partial (answers from AI general knowledge, no search or citations)     | 3      |
| US-16 | As a student, Butch has finished mascot art (or Lottie animation) with a static frame for reduced motion.       | Low      | Partial                                                                 | 3      |
| US-20 | As a developer, I can run Butch against a hosted PostgreSQL without installing Docker Desktop.                  | High     | Done: live Nov 3                                                        | 2      |

## Functional requirements

| ID    | Description                                                                                    | Priority | Status                        | Sprint |
| ----- | ---------------------------------------------------------------------------------------------- | -------- | ----------------------------- | ------ |
| FR-01 | Type a question; send via button or Enter.                                                     | High     | Done                          | 1      |
| FR-02 | Distinct user and Butch bubbles shown in order.                                                | High     | Done                          | 1      |
| FR-03 | Answer from a curated WSU knowledge base.                                                      | High     | Done                          | 1      |
| FR-04 | "Butch is typing" indicator while a reply is generated.                                        | Medium   | Done                          | 1      |
| FR-05 | Fallback with a WSU help link when confidence is below the threshold.                          | High     | Done                          | 1      |
| FR-06 | Start a new conversation.                                                                      | Medium   | Done                          | 1      |
| FR-07 | Keep session history while on the page.                                                        | Medium   | Done                          | 1      |
| FR-08 | Thumbs up or down on each reply.                                                               | Medium   | Done                          | 1      |
| FR-09 | Log exchanges with timestamps and no user identity.                                            | High     | Done                          | 1      |
| FR-10 | Admin can add, edit, and remove knowledge-base entries.                                        | High     | Dropped (admin tools removed) | -      |
| FR-11 | Display FAQ quick-reply buttons that send the question when clicked. (Proposed; covers US-05.) | Medium   | Done                          | 1      |
| FR-12 | Display an animated Butch avatar with a "typing" state. (Proposed; covers US-06.)              | Medium   | Done                          | 1      |

## Non-functional requirements

| ID     | Description                                                   | Priority | Status                                                      | Sprint |
| ------ | ------------------------------------------------------------- | -------- | ----------------------------------------------------------- | ------ |
| NFR-01 | WSU colors, font, and college feel.                           | Medium   | Done                                                        | 1      |
| NFR-02 | 200 concurrent users with replies within 5 seconds.           | High     | Dropped (cannot be tested without 200 real users)           | -      |
| NFR-03 | 99.5% uptime; degrade to offline answers if the AI API fails. | High     | Partial: the offline fallback works; uptime is not measured | 2      |
| NFR-04 | Usable from 320 px to 1920 px wide.                           | Medium   | Done                                                        | 1      |
| NFR-05 | WCAG 2.1 AA: keyboard, screen reader, reduced motion.         | High     | Done (automated); manual pass pending                       | 1, 3   |
| NFR-06 | Admin sign-in requires WSU 2FA.                               | High     | Dropped (admin tools removed)                               | -      |
| NFR-07 | Knowledge-base edits apply without a redeploy.                | Medium   | Dropped (admin tools removed)                               | -      |

## Technical work

Only work on the app itself, its data, its hosting, and the repository. The sprint reports, slides,
video, and meetings are course deliverables, not product backlog items. IDs that were used for
documents and process in sprint 1 (T-04 UML, T-26 docs, T-27 sprint 1 submission, T-32 Figma
mockups) are retired and not reused.

| ID   | Description                                                                                      | Priority | Status                                                | Sprint |
| ---- | ------------------------------------------------------------------------------------------------ | -------- | ----------------------------------------------------- | ------ |
| T-01 | Project setup: npm workspaces, TypeScript, Express API, React client, Vitest, Playwright, CI.    | High     | Done                                                  | 1      |
| T-02 | PostgreSQL storage via Prisma, with an in-memory store for tests and no-Docker setups.           | High     | Done                                                  | 1      |
| T-03 | Connect Butch to an AI API (DeepSeek) with an offline fallback when no key is set or it fails.   | High     | Done (merged in PR #33)                               | 1      |
| T-05 | Accessible, responsive chat: axe clean, keyboard-only, 320 to 1920 px.                           | High     | Done                                                  | 1      |
| T-07 | Per-developer DeepSeek keys with a small balance each, and a separate production key (SEC-10).   | High     | To do                                                 | 2      |
| T-23 | Improve the AI's replies: conversational, in Butch's voice, grounded, within 5 s.                | High     | Done                                                  | 1      |
| T-24 | Knowledge base v1: 40+ verified WSU facts with source links, keyword search, typo tolerance.     | High     | Done                                                  | 1      |
| T-25 | Security and privacy review of the code (SECURITY_REVIEW.md).                                    | High     | Done                                                  | 1      |
| T-28 | Branch protection on `main`: PR required, 1 approval, CI green; Dependabot; repo visibility.     | Medium   | To do                                                 | 2      |
| T-29 | DeepSeek latency and cost table for 20 typical questions; pick the default model.                | Medium   | To do                                                 | 2      |
| T-30 | Adversarial question list (25 prompts) run against DeepSeek mode; adjust persona if needed.      | Medium   | To do                                                 | 2      |
| T-31 | Knowledge base: 8 entries on Greek life, jobs, housing, and parking, each with a source link.    | Medium   | To do                                                 | 2      |
| T-35 | Deploy to Railway: public HTTPS URL for the chat, API and client together.                       | High     | Testing: live Nov 3; code on `feature/railway-deploy` | 2      |
| T-37 | Structured request logging and an uptime check on `/api/health`.                                 | Low      | To do                                                 | 3      |
| T-38 | Manual accessibility pass with a screen reader (NVDA or VoiceOver).                              | Medium   | To do                                                 | 3      |
| T-39 | Hosted PostgreSQL on Railway: connection settings, migrations applied, no Docker needed (US-20). | High     | Testing: live Nov 3; waiting on pull request and CI   | 2      |
| T-40 | Production database hygiene: private URL, separate dev and production databases, usage cap.      | High     | To do                                                 | 2      |
| T-41 | Upgrade dev tooling together (vite, vitest, concurrently) to clear `npm audit` findings.         | Medium   | To do                                                 | 2      |
| T-46 | Mark replies that come from general AI knowledge, not verified facts.                            | Medium   | To do                                                 | 3      |
| T-47 | Let DeepSeek answer WSU questions the knowledge base does not cover, plus more small talk.       | Medium   | Done (PR #35)                                         | 2      |
| T-51 | `CLAUDE.md` with project rules for AI coding assistants.                                         | Medium   | Code review (PR #57)                                  | 2      |
| T-52 | Knowledge base: remaining entries (financial aid, safety, health, IT help, athletics).           | Medium   | To do                                                 | 3      |

## Open issues from the security review

Fixed findings SEC-01 to SEC-06 are closed. Open ones that need work:

| ID     | Description                                                                                                    | Priority | Sprint |
| ------ | -------------------------------------------------------------------------------------------------------------- | -------- | ------ |
| SEC-07 | Repository is public; decide whether to make it private (T-28).                                                | Medium   | 2      |
| SEC-08 | No authentication. Fine while there are no admin routes; add sign-in before any admin route is ever added.     | Low      | -      |
| SEC-09 | Prompt injection and off-topic replies (covered by T-30).                                                      | Medium   | 2      |
| SEC-10 | Denial of wallet: small DeepSeek balance, separate production key (T-07). Matters more once the URL is public. | High     | 2      |
| SEC-11 | Personal information in free text: redact before saving; retention period. Do it if time allows.               | Medium   | 3      |
| SEC-13 | Deployment settings checklist (NODE_ENV, CLIENT_ORIGIN, host secrets) (T-35, T-40).                            | High     | 2      |
| SEC-14 | Security headers for the site (T-35).                                                                          | Medium   | 2      |
| SEC-16 | No request or audit logging (covered by T-37). Do it if time allows.                                           | Low      | 3      |
| SEC-18 | Repository and supply-chain settings: branch protection, Dependabot (T-28).                                    | Medium   | 2      |
