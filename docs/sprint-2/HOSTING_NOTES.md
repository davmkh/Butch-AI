# Hosting notes: Railway and the hosted PostgreSQL

For Dav and his Claude agent. This covers T-35 (deploy to Railway, issue #37), T-39 (hosted
PostgreSQL, #38), T-40 (database hygiene, #39), and what `CLAUDE.md` (T-51, #41) can point to.

Written from the code on `main` on 2026-10-28. Check anything here against the code before relying
on it. Things marked **unverified** come from memory and need checking in Railway's dashboard.

## The goal

Butch runs at a public HTTPS URL on Railway, backed by a hosted PostgreSQL, so nobody needs Docker
Desktop to run it against a database (US-20). The acceptance criteria are in
[SPRINT_2_BACKLOG.md](SPRINT_2_BACKLOG.md). In short:

- **T-35:** the URL loads the chat, a Southside question gets a DeepSeek answer, `/api/health`
  shows `deepseek` and `postgres`, and secrets are Railway variables, not in the repo.
- **T-39:** `db:deploy` applies the migration to Railway Postgres, chats and ratings appear in it,
  and a fresh clone runs against it with no Docker.
- **T-40:** the API uses the private database URL, there are separate dev and production
  databases, and a usage cap or alert is set.

## How the server is set up today

### Environment variables

From `server/.env.example` and `server/src/config.ts`.

| Variable                     | What it does                                                      | Notes for production                                         |
| ---------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------ |
| `NODE_ENV`                   | `development`, `test`, or `production`                            | `production` turns on `trust proxy` (see below)              |
| `PORT`                       | Port to listen on, default 3001                                   | Railway sets its own; `config.ts` already reads it           |
| `CLIENT_ORIGIN`              | The one origin allowed by CORS, default `http://localhost:5173`   | Must be the public site URL if the client is a separate site |
| `RATE_LIMIT_PER_MINUTE`      | Chat requests per IP per minute, default 20 (other routes 5x)     | Keep it on; the URL is public                                |
| `DATABASE_URL`               | PostgreSQL connection string. Unset means in-memory storage       | Use Railway's private URL for the API                        |
| `BUTCH_RESPONDER`            | `auto`, `deepseek`, or `offline`. `auto` uses DeepSeek with a key | `deepseek` fails to start without a key                      |
| `DEEPSEEK_API_KEY`           | The DeepSeek key                                                  | A separate production key (T-07, #43)                        |
| `DEEPSEEK_MODEL`             | Default `deepseek-flash`                                          |                                                              |
| `BUTCH_CONFIDENCE_THRESHOLD` | Default 0.6                                                       |                                                              |
| `BUTCH_FAKE_NOW`             | Pretend it is a different time (dev only)                         | **Never set.** The server refuses to start if it is          |
| `BUTCH_TEST_HOOKS`           | Lets tests send a fake-time header (e2e only)                     | **Never set.** The server refuses to start if it is `true`   |

`config.ts` does not require `DATABASE_URL` in production. Without it the server quietly keeps
everything in memory and loses it on restart, so consider requiring it when `NODE_ENV=production`
(and add a case in `config.test.ts`).

### Database code

- `server/src/index.ts`, `createStore()`: with `DATABASE_URL` set it builds a `PrismaStore` and calls
  `checkConnection()`. On failure it prints a Docker-specific message ("Is Docker running?...") and
  exits. That message needs rewording for a hosted database.
- `server/src/store/prismaStore.ts`, line 18: `new PrismaPg({ connectionString })`. There are no
  SSL or pool options. The adapter also accepts a `pg.Pool` config, so `ssl` and a small `max` can
  be added if Railway needs them. Check how `pg` treats `sslmode` in the URL before relying on it.
- `server/prisma.config.ts`, line 15: the migration URL comes from `DATABASE_URL` only. Prisma 7's
  config has no `directUrl`. If migrations need a different URL from the app, read
  `DIRECT_URL ?? DATABASE_URL` there.
- Migrations: one so far, `server/prisma/migrations/20260925230047_init`. Apply with
  `npm run db:deploy -w server`. Do not use `db:migrate` in production; it creates new migrations.
- Tables: `conversations`, `messages`, `feedback` (`server/prisma/schema.prisma`).
- The Prisma client is generated into `server/src/generated/` (gitignored). `prestart` and `predev`
  run `prisma generate`, which needs no database.

### Starting the server

- `npm start -w server` runs `prisma generate`, then `node --env-file-if-exists=.env src/index.ts`.
  Node 24 runs the `.ts` files directly, so there is no server build step. `.nvmrc` is `24` and
  `engines` is `>=24`.
- Health check: `GET /api/health` returns `{ status, responder, storage }`.
- `NODE_ENV=production` sets `trust proxy` to 1 (`server/src/app.ts`). Without it every visitor
  behind Railway's proxy shares one rate-limit bucket, and the whole site gets limited at 20
  questions a minute (SEC-13 in [SECURITY_REVIEW.md](../SECURITY_REVIEW.md)).

### The client

- `npm run build` builds only the client, into `client/dist`.
- `client/src/api/butchApi.ts` calls `VITE_API_URL`, or the page origin if that is blank.
  `client/.env.example` still shows an `onrender.com` example, which is out of date.
- **The API does not serve `client/dist` today.** There are two ways to deploy:
  - **One service:** add static serving and a single-page-app fallback to `app.ts`. One URL, no CORS
    setup, and the cheapest on a $5 credit. Helmet's default Content-Security-Policy may need a
    tweak.
  - **Two services:** a static site built with `VITE_API_URL`, plus the API with `CLIENT_ORIGIN`.

  Decide this in T-35, then update the deployment diagram (`docs/sprint-2/uml/`) to match.

## A suggested order

1. Create the Railway project and PostgreSQL. Note the private and public URLs.
2. Apply the migration: `npm run db:deploy -w server` with the URL pointed at Railway. Check that the
   three tables exist.
3. Set variables in Railway: `NODE_ENV=production`, `DATABASE_URL` (private URL), `CLIENT_ORIGIN`,
   `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`. Never `BUTCH_FAKE_NOW` or `BUTCH_TEST_HOOKS`.
4. Make the code changes: the connection error message, requiring `DATABASE_URL` in production,
   `ssl` and pool settings if needed, and serving the client if you pick one service.
5. Run `npm run check` and `npm run e2e` before the pull request. The e2e suite always uses
   in-memory storage and the offline responder, so it does not touch the hosted database.
6. Deploy, then check `/api/health`, ask a Southside question, rate the reply, and confirm the rows
   appear in the database.
7. T-40: use the private URL for the API, separate dev and production databases, a usage cap or
   alert, and no public database access left on. Tick the SEC-13 items in `SECURITY_REVIEW.md`.

## Watch out for

- **The DeepSeek key.** Use a separate production key with a small balance (T-07). With a public
  URL anyone can spend it (SEC-10), so the rate limits stay on.
- **The repo is public.** Never commit `.env` or a key. `server/.env` is gitignored.
- **Database tests.** `npm run test:db` reads `DATABASE_URL`, creates its own rows, and cleans up.
  Run it only against a dev database, never production. CI's database job uses its own PostgreSQL
  service container and does not change.
- **Docker Desktop stays optional.** `docker-compose.yml` and `npm run db:up` still work for local
  offline work; the point of US-20 is that they are not required.
- **Unverified, check in Railway:** private versus public database URLs and whether SSL is
  required; how usage credit is metered and whether $5 covers an API plus a database; whether
  backups are included; the supported Node version; and where to run the migration (a pre-deploy
  step or from your laptop).

## What `CLAUDE.md` can point to

Keep it short and link to these instead of copying them.

- **Commands** (README, "Scripts"): `npm install`, `npm run dev`, `npm run check` (lint, typecheck,
  unit tests; run before every PR), `npm test`, `npm run e2e` (needs Chrome, or
  `npm run install-browsers -w e2e`), `npm run format`, `npm run test:db` (needs PostgreSQL), and
  `npm run db:up`, `db:down`, `db:deploy -w server`.
- **Style:** Prettier (`.prettierrc.json`: single quotes, semicolons, trailing commas, width 100),
  ESLint with `jsx-a11y`, `.editorconfig`, and LF line endings (`.gitattributes`). CI also runs
  `npm run format:check`.
- **Tests:** Vitest for unit tests, and Gherkin e2e with one `.feature` per user story. Tests use the
  offline responder and in-memory storage, so they need no API key and no Docker.
- **Workflow** (README, "Team workflow"): branch from `main`, open a PR that references the user
  story (the PR template asks), get one review from the other person within 2 days, merge when CI
  is green. Branch protection is still to do (T-28, #40).
- **Safety rules for an agent:** never commit `.env` or keys, never force-push `main`, never point
  `test:db` at production, and ask before anything destructive.
- **Where to read first:** [ARCHITECTURE.md](../ARCHITECTURE.md) (start with section 2),
  [SECURITY_REVIEW.md](../SECURITY_REVIEW.md), [ROADMAP.md](../ROADMAP.md), and
  [SPRINT_2_BACKLOG.md](SPRINT_2_BACKLOG.md).
- **Scope decisions:** streaming, follow-up questions, most-asked prompts, the embeddable widget,
  the admin screens and sign-in, and the 200-user load test were dropped. There are three sprints
  in total, and sprint 3 ends on 2026-12-06.
