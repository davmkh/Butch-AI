# CLAUDE.md

Guidance for Claude (or any AI assistant) working in this repository. Keep this file short: link to
the docs instead of copying them.

## What this project is

**Butch AI** is a Q&A chatbot for current and prospective Washington State University students. Ask
Butch the Cougar about dining hours, academic deadlines, admissions, the Rec Center, or campus life.
He answers from verified WSU facts, links his sources, and points to the right WSU office when he is
not sure. It is a Software Engineering class project by Davit Mkhoyan (Dav) and Kaiden Penney, not an
official WSU service.

- Live site: https://butch-ai-production.up.railway.app (Railway: one web service plus PostgreSQL)
- Repo: https://github.com/davmkh/Butch-AI (public)

## Where we are and where we are going

The project has three sprints. Sprint 1 built the app. Sprint 2 (ends 2026-11-05) put it online on
Railway with a hosted PostgreSQL. Sprint 3 (2026-11-05 to 2026-12-06) is polish and the final
submission.

Sprint 3 candidates, in priority order (the team picks at planning): answer outside the knowledge
base by searching wsu.edu with cited sources (US-12), mark replies that come from general AI
knowledge rather than verified facts (T-46), add the remaining knowledge entries (T-52), finish the
mascot art (US-16), a manual screen-reader pass (T-38), and final bug fixes, docs, and demo.

**Out of scope, do not build:** streaming replies, follow-up questions, "most-asked" quick prompts,
admin screens or sign-in, an embeddable widget, and a 200-user load test. Say so rather than adding
them.

## Design rules (decided; see docs/ARCHITECTURE.md section 9)

- **Retrieval, not training.** Butch answers from `server/data/knowledge-base.json`. Edit data, not
  models.
- **Facts come first.** Every entry has an official WSU source link and a `lastVerified` date. Never
  invent dates, hours, prices, phone numbers, or names. If unsure, the reply is the office fallback
  (FR-05).
- **Time-sensitive facts are computed in code** ("open right now", "that deadline passed"), never
  left to the AI. The AI only phrases the reply.
- **Offline mode must keep working.** With no API key or a failing API, Butch still answers from the
  knowledge base.
- **Anonymous logging.** Chats are saved without any user identity (FR-09).
- **Accessible and responsive.** WCAG 2.1 AA, keyboard only, 320 to 1920 px. Keep the accessible names
  and test IDs listed in docs/ARCHITECTURE.md section 6.7.

## Commands (run from the repo root)

| Command                           | What it does                                                     |
| --------------------------------- | ---------------------------------------------------------------- |
| `npm install`                     | Install everything (Node 24, see `.nvmrc`)                       |
| `npm run dev`                     | API on :3001 and web app on :5173 with hot reload                |
| `npm run check`                   | Lint, typecheck, unit tests. **Run before every PR**             |
| `npm run e2e`                     | Gherkin acceptance tests in a real browser (Playwright)          |
| `npm run format` / `format:check` | Prettier (CI runs the check on all files, including Markdown)    |
| `npm run db:up` / `db:down`       | Start or stop the local PostgreSQL in Docker (optional)          |
| `npm run db:deploy -w server`     | Apply migrations (use this, not `db:migrate`, outside local dev) |
| `npm run test:db`                 | Database tests; needs a **development** PostgreSQL               |

## Code map

Four npm workspaces: `shared/` (API types), `server/` (Express API, retrieval, responders, Prisma
store), `client/` (React 19, Vite, Tailwind), `e2e/` (Playwright with one `.feature` per user story).
Start with docs/ARCHITECTURE.md section 2, which follows one question end to end. Other docs:
docs/SECURITY_REVIEW.md, docs/SCENARIOS.md, docs/TRACEABILITY.md, docs/ROADMAP.md, and
docs/sprint-2/ for the sprint backlog and hosting notes.

## Conventions

- TypeScript throughout. Prettier: single quotes, semicolons, trailing commas, width 100. ESLint
  including `jsx-a11y`. LF line endings.
- **Change behavior and tests together.** Server and client logic gets Vitest tests. A user-visible
  change gets a new or updated `.feature` scenario. Tests use the offline responder and in-memory
  storage, so they need no API key and no Docker.
- Match the style of the surrounding code, including comment density. Prefer editing existing files
  to adding new ones.
- Keep docs in step with code. If a change affects a requirement, a scenario, or the architecture,
  update docs/TRACEABILITY.md, docs/SCENARIOS.md, or docs/ARCHITECTURE.md in the same PR.

## Workflow

- Branch from `main` (`feature/...`, `fix/...`, `docs/...`). Never push to `main` directly or force
  push.
- Open a PR using the template, reference the issue and user story, and get one review from the other
  teammate within two days. Merge when CI is green.
- Update the GitHub project board when a PR opens and when it merges.
- AI-assisted commits keep the `Co-Authored-By` trailer. Whoever commits has read the change and can
  explain, change, and maintain it. We disclose how we use AI in our sprint work.

## Production and safety

- **The repo is public.** Never commit `.env` files, API keys, or database URLs.
- In production (`NODE_ENV=production`) the API also serves `client/dist`, `DATABASE_URL` is required,
  and `trust proxy` is 2 because Railway adds two proxy hops. The server refuses to start with
  `BUTCH_FAKE_NOW` or `BUTCH_TEST_HOOKS` set. Details: docs/sprint-2/HOSTING_NOTES.md.
- The DeepSeek key costs money and the site is public: keep rate limits on, use a small balance, and
  do not write loops that call the real API.
- Never point `npm run test:db` or any reset at the production database.
- Ask before anything destructive or outward-facing: deleting branches or issues, rewriting history,
  closing or opening many issues, changing repo settings, or deploying.

## Working with Claude

- Be concise. Say what you changed and what you checked.
- Read the code before relying on a doc, and flag anything you could not verify.
- Do not expand scope beyond the current sprint. Ask when a request conflicts with the out-of-scope
  list above.
