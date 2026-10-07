# Security and privacy review

**Date:** 2026-09-25 · **Scope:** the whole repository (client, server, database, CI, tooling)
at the end of sprint 1 · **Method:** code review, dependency audit (`npm audit`), secret scan
of all files, and review of deployment assumptions.

Butch AI is a public, anonymous chatbot. It has **no logins yet**, stores **chat logs and
ratings**, and will call a **paid AI API**. So the main risks are cost abuse, privacy of what
people type, embarrassing output under WSU branding, and (once added) the admin interface.

## Summary

| ID     | Finding                                                          | Severity                          | Status                     |
| ------ | ---------------------------------------------------------------- | --------------------------------- | -------------------------- |
| SEC-01 | Dev database reachable from other devices on the network         | Medium                            | **Fixed**                  |
| SEC-02 | No cap on AI reply length (cost abuse)                           | Medium                            | **Fixed**                  |
| SEC-03 | Only `/api/chat` was rate-limited                                | Low                               | **Fixed**                  |
| SEC-04 | Test clock hook on by default outside production                 | Low                               | **Fixed**                  |
| SEC-05 | 4 high-severity advisories in Prisma CLI dependencies            | Low                               | **Fixed**                  |
| SEC-06 | Chats saved without telling users                                | Low                               | **Fixed**                  |
| SEC-07 | GitHub repository is public                                      | Medium                            | **Open**: needs repo owner |
| SEC-08 | No authentication; admin tools must not be exposed               | High (before admin features ship) | Open                       |
| SEC-09 | Prompt injection / off-topic or inappropriate replies            | Medium                            | Partly mitigated           |
| SEC-10 | Denial of wallet: many IPs can still run up the AI bill          | Medium                            | Open                       |
| SEC-11 | Personal information typed by users is stored and sent to the AI | Medium                            | Partly mitigated           |
| SEC-12 | Conversation ID works like a password for that chat              | Low                               | Accepted for now           |
| SEC-13 | Deployment settings that must be right                           | Medium (at deploy)                | Checklist below            |
| SEC-14 | Security headers for the static website                          | Low                               | Open (at deploy)           |
| SEC-15 | Recent questions visible to the next person on a shared computer | Low                               | Open: team decision        |
| SEC-16 | No request/audit logging                                         | Low                               | Open                       |
| SEC-17 | Health endpoint reveals configuration                            | Info                              | Accepted                   |
| SEC-18 | Repository and supply-chain settings                             | Info                              | Open: needs repo owner     |
| SEC-19 | Future risks to design for                                       | Info                              | Guidance                   |

Severity is judged for this project's actual situation: a class project, anonymous users, no
production deployment yet.

---

## Fixed in this review

### SEC-01: Dev database reachable from other devices (Medium, fixed)

`docker-compose.yml` published PostgreSQL on all network interfaces. Anyone on the same Wi-Fi
(a dorm, a café) could connect with the dev password `butch`. **Fix:** bound it to
`127.0.0.1`, so only your own computer can connect.

### SEC-02: No cap on AI reply length (Medium, fixed)

The model was allowed up to 16,000 output tokens per reply. Someone could repeatedly ask for "a
5,000-word essay," costing up to about $0.40 per request with the default model. **Fix:**
`max_tokens` is 4,096 (Butch's answers are a few sentences), and a reply that hits the cap is
discarded in favor of the fallback. Tested in `deepseekResponder.test.ts`.

### SEC-03: Only chat was rate-limited (Low, fixed)

`/api/feedback` writes to the database but had no limit, so a script could flood it.
**Fix:** a looser API-wide limit (5 × `RATE_LIMIT_PER_MINUTE`, so 100/min per IP by default)
on every `/api` route, on top of the stricter chat limit.

### SEC-04: Test clock hook on by default (Low, fixed)

The `X-Butch-Fake-Now` header (which changes "now" for a request) was honored whenever
`NODE_ENV` wasn't `production`, and `NODE_ENV` defaults to `development`. A deployment that
forgot `NODE_ENV` would have left it on. The impact was small (misleading answers to that one
requester only). **Fix:** it now needs `BUTCH_TEST_HOOKS=true`, which only the e2e suite sets,
and the server refuses to start with it in production.

### SEC-05: Vulnerable dependencies (Low actual risk, fixed)

`npm audit` reported 4 high-severity advisories in `mysql2` and `deepmerge-ts`. Both are
bundled inside Prisma's **command-line tool** (a development tool); neither is reachable by
users, and we don't use MySQL. **Fix:** `overrides` in the root `package.json` force the
patched versions. Prisma's validate, generate, and migrate commands and the database tests were
re-run to confirm nothing broke. `npm audit`: **0 vulnerabilities**. Remove the overrides once
Prisma ships the patched versions itself.

### SEC-06: Chats saved without notice (Low, fixed)

FR-09 logs every exchange. **Fix:** the footer now says chats are saved anonymously and asks
users not to share personal information.

---

## Open findings

### SEC-07: The GitHub repository is public (Medium)

`github.com/davmkh/Butch-AI` is public. Nothing secret is in the code, but a public repo exposes
unfinished security work, the database layout, and the knowledge base, and one accidental
commit of `.env` would publish the API key instantly. **Action:** Davit (the owner) should make
it private before any code is pushed: _Settings → General → Danger Zone → Change repository
visibility._ Kaiden's account has push but not admin rights, so it can't make this change.

### SEC-08: No authentication yet; admin tools must stay local (High before admin ships)

Everything is anonymous, which is fine for students asking questions. But:

- **Prisma Studio** (`npm run db:studio`) gives full read/write access to every chat log with no
  login. Only run it on your own machine. Never deploy it or open port 5555.
- The admin features (US-08 log review, US-09 knowledge-base editing) must require
  **authentication and authorization** (NFR-06: WSU sign-in with 2FA). Plan:
  - Server-side sessions in secure, `HttpOnly`, `SameSite` cookies.
  - An admin allow-list.
  - An authorization check on every admin route. Hiding the page isn't enough.
  - CSRF protection once cookies exist.
  - Rate limits on login.
  - Tests for "not logged in → redirected" (already written as US-09 scenario 2).

### SEC-09: Prompt injection and off-topic or inappropriate replies (Medium)

Anyone can type anything. They might try "ignore your instructions and…" to make Butch say
something embarrassing under WSU branding, or use him as a free general-purpose AI.

**Already in place:**

- **Butch has no tools and no access to data.** An injection can't read other users' chats,
  change data, or take actions. The worst case is a bad reply to the person who asked.
- Questions that don't match the knowledge base **never reach DeepSeek** (FR-05).
- The persona prompt restricts topics and tells the model to decline unsafe or off-topic requests.
- DeepSeek's content filter, and treating a `content_filter` stop as a fallback.
- The 500-character question limit, output cap, and rate limits.
- Replies render as **plain text**, so they can't inject HTML or scripts.

**Recommended:**

- Keep a list of adversarial test questions and re-run it whenever the prompt or model changes
  (see SCENARIOS.md).
- Review fallbacks and thumbs-downs in the logs.
- If web search is added, restrict it to `wsu.edu`.
- Treat any scraped web content as untrusted, since it can contain injected instructions.

### SEC-10: Denial of wallet (Medium)

Rate limits are per IP and kept in server memory, so someone with many IPs (or several server
instances) can still generate a lot of DeepSeek calls.

**Actions:**

1. **Keep only a small prepaid balance on the DeepSeek platform** (and set a balance alert if
   offered) before putting a key anywhere. This is the most important cost control.
2. Use a separate key for development and for production. Rotate a key immediately if it's
   ever exposed.
3. Consider a daily cap on DeepSeek calls in the server (a circuit breaker that switches to
   offline mode).
4. Cache answers to common questions.
5. Choose the model deliberately (ROADMAP.md).

### SEC-11: Personal information in free text (Medium, privacy)

No identifying _columns_ are stored, but students may type names, student IDs, phone numbers,
or sensitive situations ("I'm failing and stressed…"). That text is saved in `messages` and,
in DeepSeek mode, sent to DeepSeek.

**Recommended:**

- Redact obvious patterns (emails, phone numbers, 8-digit WSU IDs) before saving and sending.
- Set a **retention period** and delete old messages automatically (e.g. after 90 days).
- Restrict who can read logs (SEC-08).
- Never use real students' data in demos.
- Before any real deployment for WSU, check WSU's data policies (and FERPA, which protects
  student education records) and DeepSeek's API data-retention and data-location terms (its servers are in China).

### SEC-12: Conversation ID as a bearer token (Low, accepted)

Whoever has a conversation's ID can continue it, and the model sees the earlier turns, so they
could ask "what did I ask before?" IDs are random UUIDs that live only in the page's memory
(never in URLs or storage), so guessing or stealing one is impractical. Revisit this if
conversations ever become resumable or shareable.

### SEC-13: Deployment settings that must be right (Medium at deploy time)

See the checklist below. The critical ones:

- `NODE_ENV=production`. It turns on `trust proxy`. Without it, every user behind the host's
  proxy shares **one** rate-limit bucket, and the whole site gets rate-limited at 20 questions
  a minute.
- The correct `CLIENT_ORIGIN`.
- Secrets set in the host's environment settings, never in files.

### SEC-14: Security headers for the static website (Low, at deploy)

The API sends Helmet's security headers, but the React site will be served by a static host
(e.g. Render static site). There, configure:

- a `Content-Security-Policy` (scripts from self only; `connect-src` for the API origin);
- `frame-ancestors` / `X-Frame-Options` (use an allow-list if the widget must be embedded in a
  WSU page);
- `Referrer-Policy`.

### SEC-15: Recent questions on shared computers (Low, team decision)

US-05's personalization keeps the last 5 questions in the browser's `localStorage` and shows 2
as buttons. On a library or lab computer, the next person sees them. "New conversation" doesn't
clear them. **Options:**

- add a "Clear my recent questions" control;
- keep them only for the browser session;
- make personalization opt-in.

Dav and Kaiden should pick one.

### SEC-16: No request or audit logging (Low)

There are only `console` messages, so there's no way to investigate abuse after the fact. Add
structured logging (e.g. `pino`) with request IDs, status codes, rate-limit hits, and errors,
**without** message text or IP addresses in long-term logs.

### SEC-17: Health endpoint reveals configuration (Info, accepted)

`GET /api/health` returns which responder (`deepseek`/`offline`) and storage (`postgres`/`memory`)
is active. That's useful for debugging and low risk. Trim it in production if preferred.

### SEC-18: Repository and supply-chain settings (Info)

**Already good:**

- The lockfile is committed and CI installs with `npm ci`.
- npm 12's `allowScripts` limits which packages may run install scripts.
- The CI token has read-only permissions.
- `.env` files are git-ignored, and a secret scan found no keys in the code.

**For the repo owner to enable:**

- **branch protection** on `main` (require a PR, 1 review, and passing CI);
- **Dependabot alerts and security updates**;
- secret scanning, if available for the repo.

Optional hardening: pin GitHub Actions to commit SHAs instead of `@v5`.

### SEC-19: Future risks to design for (Info)

- **Markdown in replies:** replies are plain text today (React escapes them). If replies ever
  render Markdown or HTML, use a sanitizer. Never use `dangerouslySetInnerHTML` on AI output.
- **Admin cookies** → CSRF protection and `SameSite` cookies (SEC-08).
- **Scraped content** → untrusted: review before it enters the knowledge base (SEC-09).
- **Web search tool** → restrict to `wsu.edu` and cap uses per request.
- **Uploaded files** (if ever added) → type and size limits, stored outside the web root.

---

## Controls already in place

| Area              | Control                                                                                |
| ----------------- | -------------------------------------------------------------------------------------- |
| Input validation  | zod on every request body; question 1–500 chars; JSON bodies ≤ 10 KB; UUID checks      |
| Config validation | Server refuses to start on invalid or unsafe settings                                  |
| Data validation   | Knowledge-base links must be `https`; times and dates validated at startup             |
| XSS               | React escapes all text; no `dangerouslySetInnerHTML`; replies are plain text           |
| SQL injection     | Prisma queries only (parameterized); the one raw query is a constant `SELECT 1`        |
| Secrets           | API key only on the server; `.env` git-ignored; only `VITE_*` values reach the browser |
| HTTP              | Helmet headers; CORS allow-list; external links use `rel="noopener noreferrer"`        |
| Abuse             | Per-IP rate limits (chat + API-wide); output token cap; no-match questions skip the AI |
| Errors            | Generic 500 message; internals only in server logs                                     |
| Privacy           | No identifying columns; anonymous random IDs; notice in the footer                     |
| AI safety         | Persona limits; refusal handling + server-side fallback; no tools or data access       |
| Dependencies      | `npm audit` clean; lockfile; install-script allow-list                                 |

## Pre-deployment checklist

- [ ] Repo is private; branch protection and Dependabot are on (SEC-07, SEC-18)
- [ ] DeepSeek balance kept small and monitored; separate production key (SEC-10)
- [ ] `NODE_ENV=production`, correct `CLIENT_ORIGIN`, `DATABASE_URL` and `DEEPSEEK_API_KEY` set as host secrets (SEC-13)
- [ ] `BUTCH_FAKE_NOW` and `BUTCH_TEST_HOOKS` **not** set (the server refuses them in production)
- [ ] `npm run db:deploy -w server` applied migrations to the production database
- [ ] Production database is not publicly reachable and has a strong, unique password; backups on
- [ ] Static site sends CSP, frame-ancestors, and Referrer-Policy headers (SEC-14)
- [ ] Prisma Studio is not running anywhere public (SEC-08)
- [ ] Privacy notice reviewed; retention period decided (SEC-11)
- [ ] `npm audit` clean, CI green, adversarial test questions re-run (SEC-09)

## Team habits

- **Never commit secrets.** Keys go in `server/.env` (git-ignored) or the host's settings. If a
  key is ever committed, even briefly, **revoke it on the DeepSeek platform**. Deleting the
  commit isn't enough.
- Share `.env` values privately (e.g. in person or a password manager), not in Discord or git.
- Every change goes through a PR with a review, and CI must pass.
- Re-run `npm audit` when adding dependencies.
