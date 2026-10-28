# Roadmap and next steps

Where Butch AI stands on 2026-10-28 (sprint 2 of 3), and what's left before the end of
sprint 3 on Dec 6. Sprints follow Scrum, per Milestone 1. **Kaiden** leads back end, data,
AI, and documentation. **Dav** leads front-end design, graphics, and deployment. Items marked
**Both** need both of you.

Each item has a "done when" so it can become a GitHub issue as-is. IDs match
[PRODUCT_BACKLOG.md](sprint-2/PRODUCT_BACKLOG.md); the sprint 2 commitments, owners, and
acceptance criteria are in [SPRINT_2_BACKLOG.md](sprint-2/SPRINT_2_BACKLOG.md).

## Where things stand

| Area                           | Status                                                                                                                                               |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chat UI (US-01, 02, 05–07, 10) | Working, accessible, tested                                                                                                                          |
| Knowledge base                 | 56 verified facts; keyword search; live hours and deadlines                                                                                          |
| AI replies                     | DeepSeek live, about 1 to 2 seconds. Questions outside the knowledge base are answered from the AI's general knowledge, which is not verified (T-46) |
| Storage                        | PostgreSQL in Docker for local work; hosted PostgreSQL on Railway in progress (T-39)                                                                 |
| Logs                           | Every question, reply, and rating is saved; read them with the database viewer (Prisma Studio locally). There is no admin screen                     |
| Deployment                     | Railway deploy in progress (T-35)                                                                                                                    |
| Tests / CI                     | 132 unit and component tests, 4 database tests, 22 Gherkin scenarios; CI green                                                                       |

---

## Sprint 2 (Oct 13–Nov 3): hosted and documented

Goal: Butch runs at a public URL with a hosted PostgreSQL, and we can show it live and explain
how we built it.

### Dav

- **Deploy to Railway (T-35).** One service for the API and the built client, with Railway
  variables for secrets (`DEEPSEEK_API_KEY`, `DATABASE_URL`, `CLIENT_ORIGIN`, `NODE_ENV=production`).
  _Done when:_ the public URL answers a Southside question and `/api/health` shows `deepseek`
  and `postgres`.
- **Hosted PostgreSQL on Railway (T-39).** Point the server at it, apply migrations with
  `npm run db:deploy -w server`, and make the connection error message stop mentioning Docker.
  _Done when:_ a fresh clone runs against the hosted database with no Docker.
- **Production database hygiene (T-40).** Private database URL for the API, separate dev and
  production databases, a usage cap or alert. _Done when:_ the SEC-13 items for the database are
  ticked in SECURITY_REVIEW.md.
- **Repo protections (T-28).** Branch protection on `main` (PR, 1 approval, CI passing),
  Dependabot, and the public-or-private decision (SEC-07). _Done when:_ a direct push to `main`
  is rejected.
- **`CLAUDE.md` (T-51).** The rules both of us want Claude to follow when either of us prompts it.
  _Done when:_ it is merged to `main` through a reviewed pull request.

### Kaiden

- **Planning documents (T-48).** Product backlog, sprint backlog, and this roadmap.
- **DeepSeek keys (T-07).** Each of us uses our own small-balance key in a gitignored `.env`; the
  production key exists only as a Railway variable (SEC-10).
- **Latency and cost table (T-29).** Time 20 typical questions on `deepseek-flash` and one other
  model; pick the default. _Done when:_ the table is in the slideshow and `.env.example` has
  the chosen default.
- **Adversarial question list (T-30).** About 25 prompts: off-topic, "ignore your instructions",
  rude, emergency, personal information, very long, trick dates. Run them in DeepSeek mode and
  adjust `persona.ts` if needed (SEC-09).
- **Dev tooling upgrade (T-41).** Upgrade vite, vitest, and concurrently together to clear the
  remaining `npm audit` findings.
- **Sprint 2 report and submission package (T-54).** The report from the course template, Kanban
  screenshots (before, after, end), the video link, and instructor access to the repo and board.
- **Knowledge base entries (T-31).** Greek life, jobs, housing, and parking: 8 entries with
  source links. _Done when:_ "Tell me about Sigma Nu" answers from the knowledge base.

### Both

- **AI-use notes (T-42).** A short note each in `docs/AI_USAGE.md`: which AI tools we used for
  code, tests, and UML, how well they worked, and how we checked the output. We also read the UML
  once against the code and fix anything wrong.
- **Demo script and dry run (T-45).** Run the script on the deployed URL the day before: ask about
  Southside, drop deadlines, Family Weekend, a fallback question, rate a reply, and show the
  saved data in the hosted database.
- **Slideshow (T-49), video (T-50), and the review and retrospective meetings (T-53).**
  Planning, execution (the Kanban board before and after), review, and retrospective are covered in
  the slideshow, not in separate documents; only the sprint backlog and the sprint report are
  turned in. The video follows the course outline: introduction, backlog, Kanban walkthrough,
  feature demo, responsible use of AI, review and retrospective, conclusion. Both of us appear and
  talk about our own work.

---

## Sprint 3 (Nov 3–Dec 6): polish and final submission

Thanksgiving break is Nov 23–27. Pick from this list by capacity at sprint 3 planning, high
priority first.

- **(Kaiden) Answer beyond the knowledge base with WSU web search (US-12).** Search `wsu.edu`
  with a web search API (DeepSeek's API has no built-in search tool), pass the top results to
  DeepSeek, and show the pages as sources. _Done when:_ 5 questions that used to fall back get
  correct, cited answers.
- **(Kaiden) Mark general-knowledge replies (T-46)** and **add the remaining knowledge entries
  (T-52).**
- **(Dav) Mascot art (US-16)** and the **manual accessibility pass (T-38)** on the deployed site.
  Figma mockups (T-32) only if time allows.
- **(Dav) Automatic deploys:** deploy on merge to `main` once CI is green.
- **(Kaiden, if time) Logging and privacy:** structured request logs and an uptime check on
  `/api/health` (T-37, SEC-16), and redacting emails, phone numbers, and student-ID-like numbers
  before saving or sending (SEC-11).
- **(Both) Final polish (T-55).** Fix bugs from testing with real students (friends and
  classmates), using fallbacks and thumbs-downs from the logs. Update TRACEABILITY.md statuses and
  write up the test evidence (CI runs, Playwright report, accessibility results). Final live
  demo, review, and retrospective.

---

## Knowledge to add

Prioritize what students ask about. Every entry needs an official WSU source link and
`lastVerified`. Verify each fact on the page itself, not from search results. Links marked ✓
were checked on 2026-09-25; the others need you to find the official page.

| Topic                           | Example questions                                         | Where to look                                  |
| ------------------------------- | --------------------------------------------------------- | ---------------------------------------------- |
| Student jobs and careers        | "What jobs are available?"                                | WSU student employment / career center pages   |
| Greek life chapters             | "Tell me about Sigma Nu"                                  | WSU Greek life pages (gogreek.wsu.edu)         |
| Housing                         | "When is move-in?", "How do I apply for a dorm?"          | housing.wsu.edu ✓                              |
| Parking and transit             | "How do I get a parking permit?", "Bus routes?"           | transportation.wsu.edu ✓, Pullman Transit      |
| Financial aid and tuition dates | "When is tuition due?", "FAFSA deadline?"                 | financialaid.wsu.edu ✓, academic calendar ✓    |
| Health and counseling           | "Where's the health center?", "I need to talk to someone" | Cougar Health Services, counseling services    |
| Safety                          | "How do I get WSU Alerts?", "Campus police number?"       | WSU police / emergency management pages        |
| Tutoring and writing help       | "Is there free tutoring?"                                 | Academic success / writing center pages        |
| IT help                         | "How do I reset my password?"                             | WSU IT service desk pages                      |
| Events and athletics            | "When's the next home football game?", "Homecoming?"      | athletics site, events calendar                |
| Accessibility services          | "How do I get accommodations?"                            | WSU Access Center pages                        |
| Break and holiday hours         | "Is Southside open over Thanksgiving?"                    | dining.wsu.edu/facility-hours ✓ (week by week) |

---

## Decisions the team needs to make

| Decision                                      | Options / notes                                                               |
| --------------------------------------------- | ----------------------------------------------------------------------------- |
| Default DeepSeek model                        | Based on the sprint 2 latency/cost table (T-29)                               |
| Railway budget                                | Whether Dav's $5 a month credit covers the API and database; set a cap (T-40) |
| Repo visibility (SEC-07)                      | Keep public (no secrets committed) or make private before the URL goes public |
| Recent questions on shared computers (SEC-15) | Clear button / session-only / opt-in                                          |
| Log retention period (SEC-11)                 | e.g. 30 or 90 days                                                            |
| Mascot art                                    | Original art vs. requesting permission to use official Butch                  |
| Who is Product Owner and Scrum Master         | Milestone 1 says the Scrum Master role rotates                                |
