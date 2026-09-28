# Roadmap and next steps

Where Butch AI stands after sprint 1's foundation (2026-09-25), and what's left before the
final submission in December. Sprints are two weeks (Scrum, per Milestone 1), roughly lined up
with the Fall 2026 calendar. **Kaiden** leads back end, data, AI, and infrastructure. **Dav**
leads front-end design and graphics. Items marked **Both** need both of you.

Each item has a "done when" so it can become a GitHub issue as-is.

## Where things stand

| Area                           | Status                                                                        |
| ------------------------------ | ----------------------------------------------------------------------------- |
| Chat UI (US-01, 02, 05–07, 10) | Working, accessible, tested                                                   |
| Knowledge base                 | 42 verified facts; keyword search; live hours and deadlines                   |
| AI replies                     | Code done and tested with mocks; **needs an API key to run for real**         |
| Storage                        | PostgreSQL in Docker; every question, reply, and rating saved                 |
| Admin (US-08, US-09)           | Not started (logs are viewable with Prisma Studio locally)                    |
| Deployment                     | Not started                                                                   |
| Tests / CI                     | 80 unit/component/database tests + 22 Gherkin scenarios; CI ready once pushed |

---

## Do first (this week)

1. **Make the repo private (Dav, as owner).** _Settings → General → Danger Zone → Change
   visibility._ Then push the code on a branch and open a PR to `main` (SEC-07).
   _Done when:_ the repo shows "Private" and the code is on GitHub.
2. **Turn on repo protections (Dav).**
   - Branch protection on `main`: require a PR, 1 approval, and CI passing.
   - Dependabot alerts and security updates.
   - Optionally, give Kaiden admin.

   _Done when:_ a direct push to `main` is rejected.

3. **Set up the GitHub Projects board (Both).** One issue per user story and per item below,
   with columns Backlog → Ready → In Progress → In Review → Done (Milestone 1, §2.3.2).
   _Done when:_ the sprint 1 items are on the board.
4. **Get the dev environment running on Dav's machine (Both).** Clone, then follow README Quick
   start: Node 24, Docker Desktop (plus `wsl --install` on Windows), copy `server/.env.example`.
   _Done when:_ Dav can run `npm run dev` and `npm run check`.

---

## Sprint 1 wrap-up (due ~Oct 9): demo-ready

### Kaiden

- **Get a Claude API key and test real answers.**
  1. Create an account at **console.anthropic.com** (separate from the claude.ai Pro plan) and
     add a few dollars of credit.
  2. **Set a monthly spend limit and email alerts first** (SEC-10).
  3. Create a key named e.g. `butch-dev`, put it in `server/.env` as `ANTHROPIC_API_KEY`, and
     restart. `GET /api/health` should show `"responder":"claude"`.

  _Done when:_ Butch answers the quick prompts conversationally, with sources.

- **Tune for speed and cost (NFR-02: replies within 5 s).** Time 20 typical questions with the
  default `claude-opus-5`. Then try `ANTHROPIC_EFFORT=low` or `medium`, and cheaper models
  (`claude-sonnet-5`, `claude-haiku-4-5`) via `ANTHROPIC_MODEL`. Record latency, cost, and
  answer quality in a short table, and pick defaults as a team.
  _Done when:_ the table is in the sprint review notes, and `.env.example` has the chosen defaults.
- **Write an adversarial question list (~25).** Off-topic, "ignore your instructions", rude,
  emergency, personal info, very long, trick dates. Run them in Claude mode and note any bad
  replies; adjust `persona.ts` if needed (SEC-09).
  _Done when:_ the list and results are in `docs/` and no reply would embarrass WSU.
- **Grow the knowledge base for the demo** (see "Knowledge to add" below). Start with what
  people have actually asked: **jobs** and **Greek life** both fell back in testing.
  _Done when:_ 15–20 new verified entries, each with a source link and `lastVerified`.

### Dav

- **Figma mockups** of the chat on desktop and mobile, using the WSU tokens in
  `client/src/index.css` (Milestone 1, §2.3.3).
  _Done when:_ reviewed together and turned into issues.
- **Butch art direction.** Decide the look for the idle / thinking (and maybe greeting /
  celebrating) states. The official Butch logo is a **WSU trademark**, so use original art
  unless WSU grants permission.
  _Done when:_ sketches are approved; the final art can come in sprint 2.
- **UI polish pass.** Spacing, type scale, the quick-prompt row (show that it scrolls),
  empty/error states. Keep the accessible names and test IDs listed in ARCHITECTURE.md §6.7.
  _Done when:_ `npm run e2e` still passes.

### Both

- **Sprint review demo script:** ask about Southside, drop deadlines, Family Weekend, a fallback
  question, rate a reply, show the saved data in Prisma Studio. Then a retrospective.
- **Manual accessibility check.** Use the app with only the keyboard, and with a screen reader
  (NVDA on Windows is free). Note anything that's confusing (NFR-05).

---

## Sprint 2 (Oct 9–23): smarter answers

- **(Kaiden) Answer beyond the knowledge base with WSU web search.** When no entry matches,
  let Claude search, restricted to `wsu.edu`, using Anthropic's web search tool
  (`web_search_20260209` with `allowed_domains: ['wsu.edu']` and a small `max_uses`). Show the
  pages it used as sources. Keep the office fallback when search finds nothing. This fixes
  "Sigma Nu"-style questions. _Done when:_ 5 questions that used to fall back get correct,
  cited answers.
- **(Kaiden) Streaming replies (Server-Sent Events).** Text appears as Claude writes it, which
  feels much faster (NFR-02). Server: `client.messages.stream()`. Client: read the event stream
  in `butchApi.ts` and append to the last bubble. _Done when:_ the first words appear in under
  1 s. **(Dav)** designs how streaming text and the typing indicator hand off.
- **(Kaiden) Follow-up questions.** If a question has almost no topic words ("when does it
  close?"), include the previous question in the search. _Done when:_ the follow-up scenario in
  SCENARIOS.md passes.
- **(Kaiden) Real "most-asked" quick prompts (US-05).** Count the most-matched entries or
  questions in the `messages` table over the last 30 days; fall back to the curated list.
- **(Dav) Mascot art v1** in `MascotAvatar.tsx`: a first pass is in (original SVG of Butch in
  costume with 9 poses the server picks per reply). Refine the drawing, or replace it with
  Lottie (`lottie-react`) animations with a static frame for reduced motion, keeping the
  `state` and `pose` props (Milestone 1, §2.1.5).
- **(Both) New scenarios** from the "worth adding" list in SCENARIOS.md: rate limit, API down,
  follow-ups, ambiguous questions.

## Sprint 3 (Oct 23–Nov 6): admin tools (US-08, US-09, FR-10, NFR-06, NFR-07)

- **(Kaiden) Knowledge base in the database.** Add a `KnowledgeEntry` table and a seed script
  that loads `knowledge-base.json`. `PrismaStore.listKnowledge()` then reads from the database,
  so admin edits apply immediately (NFR-07).
- **(Kaiden) Authentication.** WSU sign-in with 2FA is the requirement (NFR-06). WSU SSO
  access for a class project is uncertain, so ask the instructor early. A reasonable stand-in
  is an OAuth provider (Google or GitHub) plus an admin allow-list, with the gap documented.
  Build: sessions in secure cookies, CSRF protection, and an authorization check on every admin
  route (SEC-08).
- **(Kaiden) Admin API:** knowledge-base create/read/update/delete (with the same zod
  validation), conversation log list and filters, and feedback summary (downvotes, fallbacks,
  most-asked).
- **(Dav) Admin UI:** a login page, a knowledge-base editor (a form for hours and dates), a log
  viewer, and a feedback dashboard.
- **(Both) Turn on the @todo scenarios** in `08-` and `09-*.feature` and US-10 scenario 2.

## Sprint 4 (Nov 6–20): deploy and harden

- **(Kaiden) Deploy to Render** (Milestone 1, §2.4.3):
  - A `Dockerfile` for the API (multi-stage build, non-root user).
  - A Render web service (API), static site (client, with `VITE_API_URL`), and managed PostgreSQL.
  - A GitHub Actions deploy workflow on merge to `main`.
  - Work through the **pre-deployment checklist** in SECURITY_REVIEW.md.
- **(Kaiden) Load test NFR-02:** 200 concurrent users with replies within 5 s (e.g. `autocannon`
  or k6 against offline mode, plus a small Claude-mode sample). Record the results.
- **(Kaiden) Privacy:** redact emails, phone numbers, and student-ID-like numbers before
  saving or sending; delete messages older than the retention period (SEC-11).
- **(Kaiden) Logging and monitoring:** structured request logs (SEC-16), plus an uptime check on
  `/api/health` (NFR-03).
- **(Dav) Static-site security headers** (SEC-14) and a final responsive and accessibility pass.
- **(Dav) Optional: embeddable widget mode** (a floating chat bubble for WSU pages, as
  Milestone 1 mentions).

## Sprint 5 (Nov 30–Dec 11): polish and final submission

Thanksgiving break is Nov 23–27; the last day of classes is Dec 11.

- Fix bugs from testing with real students (friends and classmates), using fallbacks and
  thumbs-downs from the logs.
- Final documentation: update TRACEABILITY.md statuses, add screenshots, and write up the test
  evidence (CI runs, Playwright report, load test, accessibility results).
- Final demo and retrospective.

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

| Decision                                      | Options / notes                                                      |
| --------------------------------------------- | -------------------------------------------------------------------- |
| Default Claude model and effort               | Based on the sprint 1 latency/cost table                             |
| How to meet "WSU 2FA" for admins              | Real WSU SSO (ask instructor) vs. OAuth stand-in documented as a gap |
| Recent questions on shared computers (SEC-15) | Clear button / session-only / opt-in                                 |
| Log retention period (SEC-11)                 | e.g. 30 or 90 days                                                   |
| Mascot art                                    | Original art vs. requesting permission to use official Butch         |
| Add FR-11 / FR-12 to the requirements         | For US-05 and US-06 (see TRACEABILITY.md)                            |
| Who is Product Owner and Scrum Master         | Milestone 1 says the Scrum Master role rotates                       |
