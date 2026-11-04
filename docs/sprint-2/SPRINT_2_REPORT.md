# Sprint 2 Report

**Submit one report per team.** Keep it to **1–2 pages**, using brief bullet points.

**Team/Project Name:** Butch AI (Davit Mkhoyan and Kaiden Penney)  
**Sprint Dates:** 2026-10-13 to 2026-11-05  
**Demo Video Link:** _(add after upload: unlisted YouTube link)_

Repo: https://github.com/davmkh/Butch-AI · Live site: https://butch-ai-production.up.railway.app ·
Board: https://github.com/users/KaidenPenney/projects/4 (private; share with the instructor before
submitting)

## 1. Work Completed

- **Butch answers beyond the knowledge base:** DeepSeek answers WSU questions the data does not cover, plus more small talk — [#56](https://github.com/davmkh/Butch-AI/issues/56) (PR #35, merged Oct 22)
- **Deployed to Railway:** one public HTTPS URL serves the chat and the API; `/api/health` reports `deepseek` and `postgres` — [#37](https://github.com/davmkh/Butch-AI/issues/37) (live Nov 3; PR #59 merged to `main`)
- **Hosted PostgreSQL:** chats and ratings are saved in Railway's PostgreSQL, so running Butch needs no Docker Desktop — [#38](https://github.com/davmkh/Butch-AI/issues/38) (live Nov 3)
- **Production database hygiene:** Dav's production database settings for the hosted site — [#39](https://github.com/davmkh/Butch-AI/issues/39)
- **`CLAUDE.md`:** project goals, design rules, commands, and safety rules for AI assistants — [#41](https://github.com/davmkh/Butch-AI/issues/41) (PR #57, merged)
- **Sprint 2 planning documents:** product backlog, sprint backlog, roadmap, and updated UML — [#42](https://github.com/davmkh/Butch-AI/issues/42) (PR #58, merged)
- **AI-use notes:** each member's account in `docs/AI_USAGE.md` — [#49](https://github.com/davmkh/Butch-AI/issues/49)
- **Review and retrospective meetings:** held Nov 3 — [#55](https://github.com/davmkh/Butch-AI/issues/55)

## 2. Incomplete Work

| Task / GitHub Issue                                                                                                                                                                                                 | Reason Incomplete                                                 | Next Step                              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------- |
| [#40](https://github.com/davmkh/Butch-AI/issues/40) branch protection, [#43](https://github.com/davmkh/Butch-AI/issues/43) DeepSeek keys, [#45](https://github.com/davmkh/Butch-AI/issues/45) adversarial questions | Not started; the deploy and sprint documents came first           | Moved to sprint 3 (milestone Sprint 3) |
| [#46](https://github.com/davmkh/Butch-AI/issues/46) tooling upgrade, [#47](https://github.com/davmkh/Butch-AI/issues/47) knowledge entries                                                                          | Moved out of sprint 2 on Nov 3 to keep the sprint within capacity | Moved to sprint 3 (milestone Sprint 3) |
| [#44](https://github.com/davmkh/Butch-AI/issues/44) latency table, [#52](https://github.com/davmkh/Butch-AI/issues/52) demo script                                                                                  | Dropped at the sprint 2 retrospective                             | None (closed as not planned)           |

## 3. Team Contributions

| Team Member   | Main Contribution                                                                                                                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Davit (Dav)   | Deployed Butch to Railway with a hosted PostgreSQL: serves the web app from the API, requires `DATABASE_URL` in production, and fixes rate limiting behind Railway's two proxies.                                 |
| Kaiden Penney | Sprint 2 planning: product and sprint backlogs, GitHub issues, milestone, and board; updated UML (including a new deployment diagram); `CLAUDE.md` and hosting notes; PR #35 (answers beyond the knowledge base). |

## 4. Code for Review

- [Pull request #35](https://github.com/davmkh/Butch-AI/pull/35) — DeepSeek answers WSU questions outside the knowledge base (`Butch.answerWithoutFacts`, `NO_ANSWER`), plus more small talk.
- [Pull request #59](https://github.com/davmkh/Butch-AI/pull/59) (commit 986289e) — `server/src/app.ts` serves `client/dist` and sets `trust proxy` to 2; `server/src/config.ts` requires `DATABASE_URL` in production.
- [Pull request #57](https://github.com/davmkh/Butch-AI/pull/57) — `CLAUDE.md` and the Railway hosting notes.

## 5. Reflection and Next Sprint

**What went well?**

- Butch is live at one public URL with a hosted database, so nobody needs Docker Desktop to use it. We checked health, chat, ratings, and error handling from outside.
- We split the work by strength: Dav on deployment, Kaiden on planning and documents.

**What should improve?**

- The issues and board were created at the Oct 28 planning meeting, not on Oct 13, and the deployed code only reached `main` through a late pull request.
- Keep the board current as work happens, and open pull requests early.

**What will you focus on next sprint?**

- Answer outside the knowledge base with cited wsu.edu pages, and mark replies that come from general AI knowledge.
- The items moved from sprint 2 (DeepSeek keys, branch protection, adversarial questions, tooling upgrade, knowledge entries), the mascot art, a manual screen-reader pass, and final bug fixes and docs.

---

**Before submitting:** Check that all links are accessible, GitHub issues show their current status and assigned contributors, and unfinished issues are moved to an appropriate future sprint.
