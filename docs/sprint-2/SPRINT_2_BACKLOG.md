# Sprint 2 backlog

**Sprint 2:** 2026-10-13 to 2026-11-03 (3 weeks). **Team:** Davit M (Dav, repo owner, front end,
design, and deployment) and Kaiden Penney (back end, data, AI, and documentation).

**Sprint goal.** Butch AI runs at a public HTTPS URL on Railway, backed by a hosted PostgreSQL,
so teammates, the instructor, and students can use it without Docker Desktop or a local server.
We also show the running app in our video instead of screenshots, and write a short account of
how we used generative AI.

**Planning meeting:** 2026-10-28. Items were chosen from [PRODUCT_BACKLOG.md](PRODUCT_BACKLOG.md).
The project has three sprints; sprint 3 runs 2026-11-03 to 2026-12-06.

**Kanban board:** the "Butch AI Sprint 2 Board" on GitHub Projects,
https://github.com/users/KaidenPenney/projects/4, with the five course columns To Do, In
Progress, Code Review, Testing, Done. The `Sprint 2` milestone on `davmkh/Butch-AI` is due Nov 3
and holds one issue per row below, each with a `points:` label, a `priority:` label, and a
`sprint 2` label. All of them are on the board. Take the "before" screenshot of the board as it
stands, move cards as work happens, then take the "after" screenshot. Both go in
[kanban/](kanban/) and in the slideshow. The sprint 1 board is still at
https://github.com/users/davmkh/projects/2.

Effort is in story points (2, 3, 5, 8, matching the repo's `points:` labels). Acceptance criteria
are the checks listed on each issue, plus the Gherkin scenarios in `e2e/features/`
(`npm run e2e`) where a scenario applies.

## Capacity

Sprint 1 finished 62 of 68 committed points in 4 weeks, about 15 points a week for two people.
Sprint 2 is 3 weeks, so capacity is about 46 points. We plan 48 points to deliver and have 3
already done, which is about 2 over. Completion is graded, so if we fall behind we drop T-41
first, then T-31.

## Selected items

| Issue | ID   | Item                                                      | Owner  | Effort | Acceptance criteria (summary)                                                                                                                                                                                                                                                                                                       | Status      |
| ----- | ---- | --------------------------------------------------------- | ------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| #37   | T-35 | Deploy to Railway: public HTTPS URL for the chat          | Dav    | 8      | The URL loads the chat; a Southside question gets a DeepSeek answer; `/api/health` shows `deepseek` and `postgres`; secrets are Railway variables, not in the repo.                                                                                                                                                                 | In progress |
| #38   | T-39 | Hosted PostgreSQL on Railway (US-20)                      | Dav    | 5      | `db:deploy` applies the migration to Railway Postgres; chats and ratings appear in it; a fresh clone runs against it with no Docker; `npm run check` and `e2e` pass.                                                                                                                                                                | In progress |
| #39   | T-40 | Production database hygiene                               | Dav    | 2      | API uses the private database URL; no public database access left on; separate dev and production databases; usage cap or alert set; SEC-13 items ticked.                                                                                                                                                                           | To do       |
| #40   | T-28 | Branch protection, Dependabot, repo visibility decision   | Dav    | 2      | A direct push to `main` is rejected; Dependabot is on; the SEC-07 decision is recorded, and the instructor can open the repo and board either way.                                                                                                                                                                                  | To do       |
| #41   | T-51 | `CLAUDE.md` for the repository                            | Dav    | 2      | File at the repo root with the rules both of us want Claude to follow (commands, style, conventions); merged to `main` through a pull request the other member reviews.                                                                                                                                                             | In progress |
| #42   | T-48 | Sprint 2 planning documents                               | Kaiden | 3      | Product backlog, sprint backlog, and roadmap updated; `npm run format:check` passes.                                                                                                                                                                                                                                                | In progress |
| #43   | T-07 | Per-developer DeepSeek keys and a separate production key | Kaiden | 2      | Each member has their own small-balance key in a gitignored `.env`; the production key exists only as a Railway variable; no key is ever sent in chat.                                                                                                                                                                              | To do       |
| #44   | T-29 | DeepSeek latency and cost table (carried over)            | Kaiden | 2      | 20 typical questions timed on two models; table in the slideshow; default model chosen and set in `.env.example`.                                                                                                                                                                                                                   | To do       |
| #45   | T-30 | Adversarial question list (25 prompts)                    | Kaiden | 3      | List and results in `docs/`; any bad reply fixed in `persona.ts`.                                                                                                                                                                                                                                                                   | To do       |
| #46   | T-41 | Upgrade dev tooling together (vite, vitest, concurrently) | Kaiden | 2      | `npm audit` shows no critical or high findings; `npm run check` and `npm run e2e` pass.                                                                                                                                                                                                                                             | To do       |
| #47   | T-31 | Knowledge base: Greek life, jobs, housing, parking        | Kaiden | 3      | 8 entries, each with an official source link and `lastVerified`; "Tell me about Sigma Nu" answers from the knowledge base; `retrieval.test.ts` passes.                                                                                                                                                                              | To do       |
| #48   | T-54 | Sprint 2 report and submission package                    | Kaiden | 2      | `SPRINT_2_REPORT.md` filled in from `sprint_report_template-1.md`; Kanban screenshots (before, after, end) in `kanban/`; unlisted YouTube link added.                                                                                                                                                                               | To do       |
| #49   | T-42 | Short AI-use notes and a quick UML read-through           | Both   | 2      | Each member writes a short note in `docs/AI_USAGE.md`: which AI tools, for what, how well they worked, and how the output was checked; we read the UML once and fix errors.                                                                                                                                                         | To do       |
| #52   | T-45 | Demo script and dry run (no screenshots)                  | Both   | 2      | Script run end to end on the deployed URL the day before recording; the board is shown live.                                                                                                                                                                                                                                        | To do       |
| #53   | T-49 | Sprint 2 slideshow                                        | Both   | 3      | Slides cover sprint 2 planning, execution, review, and retrospective, and follow the video outline: goal and backlog, the Kanban board before and after, the demo, responsible AI use, each item against its acceptance criteria, what went well and what to improve (at least 3 action items for sprint 3), and the sprint 3 plan. | To do       |
| #54   | T-50 | Sprint 2 video                                            | Both   | 3      | Screen recording of the deployed app; both members appear and discuss their own work; uploaded as an unlisted YouTube video and linked in the report.                                                                                                                                                                               | To do       |
| #55   | T-53 | Sprint 2 review and retrospective meetings                | Both   | 2      | The review meeting checks every item against its acceptance criteria and notes blockers; the retrospective meeting lists what improved, what is still hard, and at least 3 action items; both outcomes go into the slideshow (T-49).                                                                                                | To do       |
| #56   | T-47 | Answer beyond the knowledge base, more small talk         | Kaiden | 3      | Merged in PR #35 on 2026-10-22 with CI green.                                                                                                                                                                                                                                                                                       | Done        |

**Committed:** 51 points, of which 3 were done before planning. Remaining to deliver: 48.

## Per-member feature

| Member | Items in sprint 2                                                                                                                                        | Points      |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Dav    | Deploy to Railway, hosted PostgreSQL, production database hygiene, branch protection and repo settings, `CLAUDE.md`                                      | 19          |
| Kaiden | Planning documents, DeepSeek keys, latency and cost table, adversarial questions, tooling upgrade, knowledge base entries, sprint report package, PR #35 | 17 + 3 done |
| Both   | AI-use notes, demo script, slideshow, video, review and retrospective (6 points each)                                                                    | 12          |

Totals per person: Dav 25, Kaiden 23 plus 3 done. Each member owns at least five items of their
own plus the shared ones.

## Carried over from sprint 1 (re-estimated)

| ID         | State at sprint 1 end         | Estimate | Decision                                                      |
| ---------- | ----------------------------- | -------- | ------------------------------------------------------------- |
| T-03       | PR to `main` pending          | Done     | Merged in PR #33.                                             |
| T-04       | In review                     | Done     | Merged in PR #33.                                             |
| T-27       | In progress                   | Done     | Submitted and graded.                                         |
| T-07       | To do                         | 2        | In sprint 2: needed before the URL is public (SEC-10).        |
| T-28       | To do                         | 2        | In sprint 2: branch protection, as sprint 1 retro action 3.   |
| T-29       | To do                         | 2        | In sprint 2: DeepSeek key now works, so timings are possible. |
| US-16      | Partial (placeholder SVG art) | 5        | Sprint 3: deployment comes first.                             |
| T-38       | To do (screen reader pass)    | 3        | Sprint 3: run it on the deployed site.                        |
| T-32       | To do (Figma mockups)         | 3        | Sprint 3, low priority now that the UI is built.              |
| US-08 pt 2 | Admin log screen              | 5        | Dropped: admin tools removed. Logs are read in the database.  |
| US-09      | Not started                   | 8        | Dropped: admin tools removed.                                 |
| US-10 sc.2 | `@todo`                       | 1        | Dropped: it needed the admin log screen.                      |

## Not selected and why

Sprint 3 runs 2026-11-03 to 2026-12-06. These items are candidates for it, in priority order.

| ID                   | Item                                                   | Why not in sprint 2                                                        | Moved to |
| -------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------- | -------- |
| US-12                | wsu.edu search with citations                          | Needs a search API; PR #35 only added unchecked general-knowledge answers. | Sprint 3 |
| T-46                 | Mark general-knowledge replies                         | Needs a small server and UI change; do after the deploy is stable.         | Sprint 3 |
| T-52                 | Remaining knowledge entries                            | T-31 covers the highest-demand topics first.                               | Sprint 3 |
| US-16, T-38, T-32    | Mascot art, screen reader pass, Figma mockups          | Deployment comes first.                                                    | Sprint 3 |
| T-37, SEC-11, SEC-16 | Request logging, uptime check, personal-data redaction | Low priority; only if time allows.                                         | Sprint 3 |
| T-55                 | Final polish, docs, test evidence, final demo          | Happens at the end of the project.                                         | Sprint 3 |

## Risks

- **Completion is graded and the plan is about 2 points over capacity.** Drop T-41 first, then
  T-31. Decide at the next check-in, not on Nov 3.
- **Deployment has about 6 days left.** If Railway slips, move T-35 to sprint 3 and demo the local
  app against the hosted database.
- **A public URL makes SEC-10 real.** Anyone can spend the DeepSeek balance. T-07 keeps the
  balance small, and the per-IP rate limits stay on.
- **Railway cost.** Dav's $5 a month credit must cover the API and the database. Check the usage
  page after the first deploy and set the cap in T-40.
- **The board was set up late, and it is private.** The sprint began Oct 13, but the issues and
  the board were only created at the planning meeting. The "before" screenshot shows the board
  as set up that day; say so in the report and do not backdate it. The board belongs to
  Kaiden's account and is private. Dav was added as a writer; the instructor cannot see it until
  it is shared or made public.
- **Instructor access.** If the repo is made private (T-28, SEC-07), add the instructor as a
  collaborator and confirm they can open the project board.
- **The AI-use notes must be our own account**, written by each of us, not generated.

## Retrospective actions carried from sprint 1

| Action (from the sprint 1 report)                                                 | Where it shows up in sprint 2                      |
| --------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1. Create every issue, assign it, and put it on the board before writing code     | First task after planning; Dav checks twice a week |
| 2. One documents home (`docs/sprint-N/`) and one owner per deliverable            | This folder; owners in the table above             |
| 3. One pull request per member per week, reviewed by the other; branch protection | T-28                                               |
| 4. Separate DeepSeek keys per developer with a small balance each                 | T-07                                               |
