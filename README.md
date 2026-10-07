# Butch AI

A WSU Q&A chatbot for current and prospective students. Ask Butch the Cougar about dining
hours, academic deadlines, admissions, the Rec Center, or campus life, and he answers from
official WSU sources, links them, and points you to the right office when he isn't sure.

By Davit Mkhoyan & Kaiden Penney. A student project, not an official WSU service.

## Quick start

You need **Node.js 24** (`node --version`) and **Docker Desktop** (for the database).

```bash
npm install
cp server/.env.example server/.env   # first time only
npm run db:up                        # start PostgreSQL in Docker
npm run db:migrate                   # first time, or after the schema changes
npm run dev
```

Open http://localhost:5173. The API runs on http://localhost:3001.

- **No Docker?** Remove `DATABASE_URL` from `server/.env` and the server keeps everything in
  memory instead (lost when it restarts).
- **No API key?** Butch runs in **offline mode**: he answers straight from the knowledge base
  with no AI. To use DeepSeek, put your `DEEPSEEK_API_KEY` in `server/.env` and restart.
- **Never commit `.env`. This repo is public.**

## Seeing what users asked and rated

Every question, reply, and thumbs up/down is saved in PostgreSQL. To browse it:

```bash
npm run db:studio
```

This opens Prisma Studio (http://localhost:5555) with three tables:

- `messages`: each question and reply, whether the reply was an `answer` or a `fallback`, and
  which knowledge entries it used. Click the `created_at` column to sort by time.
- `feedback`: one thumbs `up`/`down` per reply, linked by `message_id`.
- `conversations`: one row per chat session.

Fallbacks and thumbs-downs show where the knowledge base needs work.

## Scripts (run from the repo root)

| Command                     | What it does                                            |
| --------------------------- | ------------------------------------------------------- |
| `npm run dev`               | Starts the API and the web app with hot reload          |
| `npm run check`             | Lint + typecheck + unit tests (run before every PR)     |
| `npm test`                  | Unit and component tests (Vitest)                       |
| `npm run e2e`               | Gherkin acceptance tests in a real browser (Playwright) |
| `npm run lint`              | ESLint, including accessibility rules                   |
| `npm run format`            | Prettier: formats every file                            |
| `npm run build`             | Production build of the web app into `client/dist`      |
| `npm run db:up` / `db:down` | Start / stop PostgreSQL in Docker (data is kept)        |
| `npm run db:migrate`        | Apply database schema changes (creates a migration)     |
| `npm run db:studio`         | Browse the database in your browser                     |
| `npm run test:db`           | Database tests against PostgreSQL (needs `db:up`)       |

**First e2e run:** the tests use Google Chrome if it's installed. For Playwright's own
browser (what CI uses), run `npm run install-browsers -w e2e` once (about 150 MB).

## Project layout

```
client/     React 19 + Vite + Tailwind web app (the chat UI)
server/     Node 24 + Express API: retrieval, live hours/deadline status, DeepSeek
  data/       knowledge-base.json, offices.json, quick-prompts.json (seed data)
  prisma/     Database schema and migrations (PostgreSQL)
shared/     TypeScript types shared by client and server (the API contract)
e2e/        Playwright + playwright-bdd: one .feature file per user story
docs/       Guides (see Documentation below)
```

## Documentation

| Guide                                         | Read it to…                                                          |
| --------------------------------------------- | -------------------------------------------------------------------- |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md)       | Understand the whole codebase, starting from one question end to end |
| [SCENARIOS.md](docs/SCENARIOS.md)             | See what every user-story scenario checks and which code handles it  |
| [SECURITY_REVIEW.md](docs/SECURITY_REVIEW.md) | Know the risks, what's fixed, and the pre-deployment checklist       |
| [ROADMAP.md](docs/ROADMAP.md)                 | Pick up the next task (sprint plan through December)                 |
| [DATA_STRATEGY.md](docs/DATA_STRATEGY.md)     | Add or update WSU facts in the knowledge base                        |
| [TRACEABILITY.md](docs/TRACEABILITY.md)       | Map each requirement to its code and tests                           |

## How Butch answers

1. **Search** the knowledge base for the question (keyword retrieval with a confidence score).
2. **Not confident?** Reply with a link to the WSU office that can help instead of guessing
   (FR-05).
3. **Work out live facts in code:** "open right now until 9 PM", "that deadline passed 3 days ago".
4. **Write the reply** with DeepSeek, grounded only in those facts. Offline mode uses the facts
   as-is.

The full walkthrough is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Sprint 1 status

| Story                              | Status                                              |
| ---------------------------------- | --------------------------------------------------- |
| US-01 Ask a question               | Done                                                |
| US-02 Fallback link when unsure    | Done                                                |
| US-03 Dining hours / open now      | Done                                                |
| US-04 Academic deadlines           | Done                                                |
| US-05 FAQ quick prompts            | Done (site list is curated for now; see roadmap)    |
| US-06 WSU theme + mascot animation | Done with placeholder art; Lottie animation pending |
| US-07 Thumbs up/down               | Done                                                |
| US-08 Conversation logs            | Logged in PostgreSQL; admin review screen pending   |
| US-09 Admin knowledge-base editor  | Not started                                         |
| US-10 New conversation             | Done                                                |

Full requirement-to-code-to-test map: [docs/TRACEABILITY.md](docs/TRACEABILITY.md).

## Roadmap

Next up: a DeepSeek API key and real answers, more knowledge, WSU web search, streaming replies,
mascot art, admin tools with sign-in, and deployment. The sprint-by-sprint plan is in
[docs/ROADMAP.md](docs/ROADMAP.md).

## Team workflow

- Branch from `main` (`feature/us-03-dining-hours`), open a PR, get one review, merge when CI is green.
- Reference the user story in the PR (the template asks for it).
- Format on save is set up in `.vscode/`; install the recommended extensions when VS Code asks.
