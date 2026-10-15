# Sprint 1 backlog

**Sprint 1:** 2026-09-18 to 2026-10-15 (4 weeks). **Team:** Davit M (Dav, repo owner, front end
and design) and Kaiden Penney (back end, data, AI, infrastructure).

**Sprint goal.** A working Butch AI chat that answers WSU questions from a curated knowledge
base, with real AI-phrased replies, a fallback for unknowns, ratings, and logging, plus the
tests, CI, and documentation to build on. Course expectation: at least 25% of features done and
at least one feature per team member.

**Kanban board:** GitHub Projects on `davmkh/Butch-AI` with columns To Do, In Progress, Code
Review, Testing, Done. Each row below is one GitHub issue (number in the first column).

Effort is in story points (1, 2, 3, 5, 8). Acceptance criteria are the Gherkin scenarios in
`e2e/features/` (run with `npm run e2e`) plus the checks on each issue; see
[SCENARIOS.md](../SCENARIOS.md) for what each scenario does.

## Selected items

| Issue | ID    | Item                                             | Owner  | Effort | Acceptance criteria (summary)                                                                                                                                                          | Result                                                     |
| ----- | ----- | ------------------------------------------------ | ------ | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| #11   | T-01  | Project setup, tests, and CI                     | Kaiden | 5      | `npm run check` and `npm run e2e` pass; CI runs on every pull request.                                                                                                                 | Done (PR #1, 2026-09-25)                                   |
| #2    | US-01 | Ask Butch a question                             | Dav    | 3      | `01-submit-question.feature`: send via button and Enter; empty message blocked; user and Butch bubbles distinct and in order (FR-01, FR-02).                                           | Done                                                       |
| #3    | US-02 | Fallback link when Butch isn't sure              | Kaiden | 3      | `02-fallback.feature`: above threshold answers; below threshold gives the fallback text with a WSU office link (FR-05).                                                                | Done                                                       |
| #4    | US-03 | Dining hall hours                                | Kaiden | 5      | `03-dining-hours.feature`: open with today's hours, or closed with next opening; hours match dining.wsu.edu.                                                                           | Done                                                       |
| #5    | US-04 | Academic deadlines                               | Kaiden | 3      | `04-academic-deadline.feature`: upcoming deadline shows date and days left; past deadline says so.                                                                                     | Done                                                       |
| #6    | US-05 | FAQ quick prompts                                | Dav    | 3      | `05-quick-prompts.feature`: click sends the prompt; returning user sees own recent questions; new user sees the curated list (FR-11).                                                  | Done (site-wide most-asked list is curated)                |
| #7    | US-06 | WSU theme and Butch animation                    | Dav    | 5      | `06-theme-and-mascot.feature`: WSU crimson and gray, Montserrat; avatar in thinking state while pending; server picks a pose (FR-04, FR-12).                                           | Done with original SVG art; Lottie pending                 |
| #8    | US-07 | Rate responses                                   | Dav    | 3      | `07-rate-responses.feature`: thumbs up saved and shown; change to thumbs down updates; unknown message IDs rejected (FR-08).                                                           | Done                                                       |
| #9    | US-08 | Conversation logging (part 1)                    | Kaiden | 3      | Every question, reply, and rating saved in PostgreSQL with a timestamp and no user identity (`prismaStore.db.test.ts`).                                                                | Done; admin review screen is part 2, sprint 3              |
| #10   | US-10 | New conversation                                 | Dav    | 2      | `10-new-conversation.feature` scenario 1: button clears the window and shows the greeting (FR-06, FR-07).                                                                              | Done; scenario 2 waits on US-08 part 2                     |
| #12   | T-02  | PostgreSQL storage                               | Kaiden | 5      | With Docker, questions, replies, and ratings appear in the database; without Docker the app runs in memory. `npm run test:db` passes.                                                  | Done                                                       |
| #13   | T-03  | Connect Butch to an AI API                       | Dav    | 5      | With a key set, replies are written by DeepSeek from the retrieved facts only; if the API fails Butch still answers; responder tests pass.                                             | Done (commit 4c579e4 on `dav-dev-1`); PR to `main` pending |
| #16   | T-23  | Improve the AI's replies                         | Dav    | 3      | Replies short, in Butch's voice, grounded in retrieved facts, within 5 s (about 2 s in a live check on 2026-10-15).                                                                    | Done                                                       |
| #15   | T-05  | Accessible, responsive chat                      | Dav    | 3      | `11-accessibility.feature`: no axe WCAG 2.1 AA violations; keyboard-only question works; 320, 768, and 1920 px (NFR-04, NFR-05).                                                       | Done                                                       |
| #14   | T-04  | UML diagrams                                     | Both   | 3      | Use case, class, collaboration, and sequence diagrams match the code, each with a written description ([UML.md](UML.md)).                                                              | In review                                                  |
| #27   | T-24  | Knowledge base v1 and search                     | Kaiden | 5      | 40+ entries with official source links and `lastVerified`; typo-tolerant keyword search with synonyms; `retrieval.test.ts` passes.                                                     | Done (42 entries)                                          |
| #29   | T-25  | Security and privacy review                      | Kaiden | 3      | `docs/SECURITY_REVIEW.md` with severities; SEC-01 to SEC-06 fixed; `npm audit` has no high findings.                                                                                   | Done                                                       |
| #30   | T-26  | Documentation set                                | Dav    | 3      | README quick start works on a fresh clone; ARCHITECTURE, SCENARIOS, TRACEABILITY, ROADMAP, DATA_STRATEGY in `docs/`.                                                                   | Done                                                       |
| #32   | T-27  | Sprint 1 submission: board, review, retro, video | Both   | 3      | Board with the five course columns and screenshots at start, midway, end; review held against this table; retro report with 3+ action items; unlisted YouTube video with both members. | In progress                                                |

**Committed:** 68 points. **Done at sprint end:** 62 points. Open: T-04 (in review) and T-27
(the submission work finishing this week).

IDs T-06 and T-08 to T-22 are reserved for Kaiden's backlog numbering and are reconciled in
[PRODUCT_BACKLOG.md](PRODUCT_BACKLOG.md) when that list lands.

## Per-member feature

| Member | Features completed in sprint 1                                                                                                                                                     | Issues                                  |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| Dav    | Chat UI stories: ask a question, quick prompts, theme and animation, ratings, new conversation; accessible responsive chat; DeepSeek responder and reply tuning; documentation set | #2, #6, #7, #8, #10, #13, #15, #16, #30 |
| Kaiden | Fallback, dining hours, deadlines, conversation logging; project setup and CI; PostgreSQL storage; knowledge base and search; security review                                      | #3, #4, #5, #9, #11, #12, #27, #29      |
| Both   | UML diagrams; sprint 1 submission (board, review, retro, video)                                                                                                                    | #14, #32                                |

Points: Dav 30, Kaiden 32, shared 6.

## Not completed and why

| ID         | What is left                           | Why                                                                                | Moved to |
| ---------- | -------------------------------------- | ---------------------------------------------------------------------------------- | -------- |
| US-08 pt 2 | Admin log review screen                | Needs authentication first (SEC-08); logs are viewable locally with Prisma Studio. | Sprint 3 |
| US-09      | Admin knowledge-base editor            | Same dependency on authentication; not planned for sprint 1.                       | Sprint 3 |
| US-16      | Final mascot art / Lottie animation    | Original SVG placeholder shipped; art direction not settled.                       | Sprint 2 |
| T-07       | Shared team API key with a spend limit | Key is on one machine for now; sharing it safely is a sprint 2 item (SEC-10).      | Sprint 2 |
| T-29       | DeepSeek latency and cost table        | Key only arrived in the last week of the sprint.                                   | Sprint 2 |
| T-32       | Figma mockups                          | Deprioritized behind getting the DeepSeek integration working.                     | Sprint 2 |

## Blockers encountered

- The API key arrived late in the sprint, so real AI answers were only verified in the last week.
- The provider changed mid-sprint (Anthropic to DeepSeek), which meant rewriting the responder
  and its tests.
- The Kanban board and backlog documents were set up at the end of the sprint rather than the
  start, so daily board updates did not happen. This is the first retrospective action item.
