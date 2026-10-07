# Requirements traceability

Maps each requirement from _WSU Q&A Butch AI for Current and Prospective Students_
(Assignment 1) to where it's implemented and how it's verified. Unit and component tests run
with `npm test`; Gherkin scenarios run with `npm run e2e`.

## Functional requirements

| ID    | Requirement (short)                       | Implementation                                         | Verified by                                               | Status                                              |
| ----- | ----------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------- | --------------------------------------------------- |
| FR-01 | Type a question; send via button or Enter | `client/src/components/Composer.tsx`                   | `01-submit-question.feature`, `App.test.tsx`              | Done                                                |
| FR-02 | Distinct user and Butch bubbles, in order | `MessageBubble.tsx`, `ChatWindow.tsx`                  | `01-submit-question.feature`, `App.test.tsx`              | Done                                                |
| FR-03 | Answer from a WSU knowledge base          | `server/data/knowledge-base.json`, `services/butch.ts` | `02`, `03`, `04` features, `app.test.ts`                  | Done                                                |
| FR-04 | "Butch is typing…" indicator              | `TypingIndicator.tsx`                                  | `06-theme-and-mascot.feature`, `App.test.tsx`             | Done                                                |
| FR-05 | Fallback with WSU help link when unsure   | `services/fallback.ts`, `data/offices.json`            | `02-fallback.feature`, `butch.test.ts`                    | Done                                                |
| FR-06 | Start a new conversation                  | `Header.tsx`, `useChat.reset()`                        | `10-new-conversation.feature`, `App.test.tsx`             | Done                                                |
| FR-07 | Keep session history while on the page    | `useChat.ts` (in memory for the page session)          | `10-new-conversation.feature`                             | Done                                                |
| FR-08 | Thumbs up/down on each reply              | `RatingButtons.tsx`, `routes/feedback.ts`              | `07-rate-responses.feature`, `app.test.ts`                | Done                                                |
| FR-09 | Log exchanges; no user identity           | `routes/chat.ts`, `store/`                             | `app.test.ts` ("US-08 / FR-09"), `prismaStore.db.test.ts` | Partial: logged in PostgreSQL; admin review pending |
| FR-10 | Admin can add/edit/remove KB entries      | Store already reads KB per request                     | `09-knowledge-base-admin.feature` (@todo)                 | Not started                                         |

## Non-functional requirements

| ID     | Requirement (short)                  | How it's addressed                                                       | Verified by                                 | Status                                                          |
| ------ | ------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------- | --------------------------------------------------------------- |
| NFR-01 | WSU colors, font, college feel       | Crimson `#A60F2D` and gray `#4D4D4D` tokens, Montserrat (WSU web font)   | `06-theme-and-mascot.feature`               | Done                                                            |
| NFR-02 | 200 concurrent users, ≤ 5 s replies  | Rate limiting; fast offline path; `DEEPSEEK_MODEL` tunable               | Not yet load-tested                         | To do                                                           |
| NFR-03 | 99.5% uptime                         | DeepSeek errors fall back to offline answers; health endpoint            | `butch.test.ts`                             | Partial (hosting TBD)                                           |
| NFR-04 | Usable from 320 px to 1920 px        | Mobile-first layout, no sideways scrolling                               | `11-accessibility.feature` (320/768/1920)   | Done                                                            |
| NFR-05 | WCAG 2.1 AA, keyboard, screen reader | Live-region chat log, labels, focus rings, reduced motion, jsx-a11y lint | `11-accessibility.feature` (axe + keyboard) | Done (automated checks; manual screen reader pass still needed) |
| NFR-06 | Admin needs WSU 2FA                  | Not built yet                                                            | `09-knowledge-base-admin.feature` (@todo)   | Not started                                                     |
| NFR-07 | KB edits apply without redeploy      | Server reads the KB from the store on every question                     | Store design; verify with admin UI later    | Partial                                                         |

## User stories

| Story | Feature file                      | Status                                                                 |
| ----- | --------------------------------- | ---------------------------------------------------------------------- |
| US-01 | `01-submit-question.feature`      | Passing                                                                |
| US-02 | `02-fallback.feature`             | Passing                                                                |
| US-03 | `03-dining-hours.feature`         | Passing (hours updated to real Southside times)                        |
| US-04 | `04-academic-deadline.feature`    | Passing ("passed" scenario moved to week 5 to match the real calendar) |
| US-05 | `05-quick-prompts.feature`        | Passing                                                                |
| US-06 | `06-theme-and-mascot.feature`     | Passing (placeholder mascot art)                                       |
| US-07 | `07-rate-responses.feature`       | Passing                                                                |
| US-08 | `08-conversation-logs.feature`    | @todo: needs admin log review screen                                   |
| US-09 | `09-knowledge-base-admin.feature` | @todo: needs admin interface                                           |
| US-10 | `10-new-conversation.feature`     | Scenario 1 passing; scenario 2 @todo (needs US-08 screen)              |

## Gaps noted in Assignment 1

The reflection noted that **US-05** (quick prompts) and **US-06** (theme and animation) had no
matching functional requirement. Suggested additions for the next requirements revision:

- **FR-11:** The system shall display FAQ quick-reply buttons, including up to two of the
  user's own recent questions, that send the question when clicked.
- **FR-12:** The system shall display an animated Butch avatar that changes to a "typing"
  state while a response is being generated.
