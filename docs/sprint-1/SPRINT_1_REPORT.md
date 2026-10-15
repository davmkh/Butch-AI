# Sprint 1 Report

Video Link: _(added after upload)_

**Team:** Davit M (Dav) and Kaiden Penney · **Sprint:** 2026-09-18 to 2026-10-15 ·
**Repo:** https://github.com/davmkh/Butch-AI · **Board:** https://github.com/users/davmkh/projects/2

## What's New (User Facing)

- Ask Butch a question in a WSU-themed chat and get an answer from a curated knowledge base of
  42 verified WSU facts, each with a source link.
- Replies are written in Butch's voice by an AI model (DeepSeek), grounded only in the retrieved
  facts; when no API key is set or the API fails, an offline mode still answers.
- Live answers: "Is Southside open right now?" uses real dining hours; deadline questions say
  how many days are left or that the date has passed.
- When Butch isn't confident he says so and links the right WSU office instead of guessing.
- FAQ quick-prompt buttons, including up to two of your own recent questions.
- Thumbs up or down on every reply.
- "New conversation" button that clears the window.
- Animated Butch mascot that thinks while a reply is on its way and acts out each answer.
- Works with keyboard only and a screen reader, from 320 px phones to 1920 px desktops.

## Work Summary (Developer Facing)

We split the work along the front-end/back-end line. Kaiden built the foundation first: an npm
workspace monorepo (shared types, Express API, React client, Playwright end-to-end tests),
GitHub Actions CI, PostgreSQL storage through Prisma with an in-memory store for tests, and the
knowledge base with typo-tolerant keyword search. Dav took the chat UI stories, accessibility,
and the AI responder. Every user story was written as a Gherkin feature file first, so the
acceptance criteria doubled as the end-to-end test suite (22 scenarios, run in CI). The biggest
barrier was the AI provider: we started on Anthropic's SDK, then switched to DeepSeek in the
last week of the sprint for cost, which meant rewriting the responder and its tests with plain
`fetch`, a timeout, and a retry. We also learned the hard way that the Kanban board and backlog
documents should exist on day one: we set them up at the end of the sprint and briefly
duplicated each other's work on the backlog and UML diagrams before consolidating on one set.
Security was reviewed as a deliverable, not an afterthought: a written review found and fixed
six issues (database port exposure, unbounded AI reply length, missing rate limits, a test clock
hook on by default, vulnerable dependencies, and unannounced chat logging).

## Unfinished Work

One sprint item is still open: the sprint 1 submission itself (#32), which closes when the demo
video is uploaded. Two larger stories were planned from the start for later sprints and were not
in the sprint 1 backlog: the admin log-review screen (US-08 part 2) and the admin knowledge-base
editor (US-09) both depend on authentication (NFR-06), which is sprint 3 work. The final mascot
art (Lottie animation) and Figma mockups were deprioritized behind getting the DeepSeek
integration working and move to sprint 2. Each carried item has a "Moved to" entry in
[SPRINT_1_BACKLOG.md](SPRINT_1_BACKLOG.md) and is on the Sprint 2 milestone.

## Completed Issues/User Stories

Here are links to the issues that we completed in this sprint:

- https://github.com/davmkh/Butch-AI/issues/2 US-01 Ask Butch a question (Dav, 3 pts)
- https://github.com/davmkh/Butch-AI/issues/3 US-02 Fallback link when Butch isn't sure (Kaiden, 3 pts)
- https://github.com/davmkh/Butch-AI/issues/4 US-03 Dining hall hours (Kaiden, 5 pts)
- https://github.com/davmkh/Butch-AI/issues/5 US-04 Academic deadlines (Kaiden, 3 pts)
- https://github.com/davmkh/Butch-AI/issues/6 US-05 FAQ quick prompts (Dav, 3 pts)
- https://github.com/davmkh/Butch-AI/issues/7 US-06 WSU theme and Butch animation (Dav, 5 pts)
- https://github.com/davmkh/Butch-AI/issues/8 US-07 Rate responses (Dav, 3 pts)
- https://github.com/davmkh/Butch-AI/issues/9 US-08 Conversation logging, part 1 (Kaiden, 3 pts)
- https://github.com/davmkh/Butch-AI/issues/10 US-10 New conversation (Dav, 2 pts)
- https://github.com/davmkh/Butch-AI/issues/11 T-01 Project setup, tests, and CI (Kaiden, 5 pts)
- https://github.com/davmkh/Butch-AI/issues/12 T-02 PostgreSQL storage (Kaiden, 5 pts)
- https://github.com/davmkh/Butch-AI/issues/13 T-03 Connect Butch to an AI API (Dav, 5 pts)
- https://github.com/davmkh/Butch-AI/issues/14 T-04 UML diagrams (Kaiden 2 pts, Dav 1 pt)
- https://github.com/davmkh/Butch-AI/issues/15 T-05 Accessible, responsive chat (Dav, 3 pts)
- https://github.com/davmkh/Butch-AI/issues/16 T-23 Improve the AI's replies (Dav, 3 pts)
- https://github.com/davmkh/Butch-AI/issues/27 T-24 Knowledge base v1 and search (Kaiden, 5 pts)
- https://github.com/davmkh/Butch-AI/issues/29 T-25 Security and privacy review (Kaiden, 3 pts)
- https://github.com/davmkh/Butch-AI/issues/30 T-26 Documentation set (Dav, 3 pts)

Pull requests: [#1](https://github.com/davmkh/Butch-AI/pull/1) (foundation, knowledge base,
UI, tests) and [#33](https://github.com/davmkh/Butch-AI/pull/33) (DeepSeek responder, sprint 1
docs, UML). Story points this sprint: Dav 31, Kaiden 34. Every issue is on the Sprint 1
milestone, has a `points:` label, and has a comment stating each member's contribution. We did
not record before-and-after videos for the pull requests this sprint; the demo video covers the
same ground.

## Incomplete Issues/User Stories

Here are links to issues we worked on but did not complete in this sprint:

- https://github.com/davmkh/Butch-AI/issues/32 T-27 Sprint 1 submission: closes when the demo video is uploaded; the board, backlog, and report are done.

## Code Files for Review

Please review the following code files, which were actively developed during this sprint, for quality:

- [server/src/responders/deepseekResponder.ts](https://github.com/davmkh/Butch-AI/blob/main/server/src/responders/deepseekResponder.ts) (AI responder: prompt building, timeout, retry)
- [server/src/services/butch.ts](https://github.com/davmkh/Butch-AI/blob/main/server/src/services/butch.ts) (answer pipeline: small talk, retrieval, responder, fallback)
- [server/src/knowledge/retrieval.ts](https://github.com/davmkh/Butch-AI/blob/main/server/src/knowledge/retrieval.ts) (typo-tolerant keyword search)
- [server/src/routes/chat.ts](https://github.com/davmkh/Butch-AI/blob/main/server/src/routes/chat.ts) (validation, rate limit, conversation history, logging)
- [client/src/hooks/useChat.ts](https://github.com/davmkh/Butch-AI/blob/main/client/src/hooks/useChat.ts) (chat state, optimistic ratings, reset)

## Retrospective Summary

Here's what went well:

- Writing each story as a Gherkin scenario first gave us acceptance criteria and an end-to-end
  test in one step; 22 scenarios plus 118 unit tests run on every pull request.
- The responder and store interfaces paid off immediately: swapping Anthropic for DeepSeek
  touched one folder, and tests run with no API key and no Docker.
- We shipped more than the 25% target: every sprint 1 story is done and demoable.
- Documentation was written alongside the code (architecture, scenarios, traceability, security
  review), so the sprint 1 docs were mostly assembling, not writing from scratch.

Here's what we'd like to improve:

- The Kanban board, issues, and backlog documents were created in the last days of the sprint,
  so there were no daily board updates and no true "start of sprint" board state.
- We briefly did the same work twice (sprint backlog and UML diagrams) because we had not agreed
  on one place for documents or who owned which deliverable.
- The API key arrived late, so real AI answers were only verified in the final week, and the
  provider change forced a rewrite under time pressure.
- Git history shows most commits under one name; pair work and design input are not visible.

Here are changes we plan to implement in the next sprint:

1. Create every sprint 2 issue, assign it, and put it on the board before writing any code, and
   update the board when a PR opens and when it merges (Dav owns the board check twice a week).
2. One documents home (`docs/sprint-N/`) and one owner per deliverable, agreed at sprint planning.
3. Each member opens at least one pull request per week under their own GitHub account, with
   one review from the other member before merge; turn on branch protection on `main` (T-28).
4. Use separate DeepSeek keys per developer with a small balance each, so a leaked key costs
   little and nobody is blocked waiting for a shared key (T-07, SEC-10).
