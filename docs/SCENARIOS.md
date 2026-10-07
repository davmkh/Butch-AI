# Scenarios: what each one checks and how

Every acceptance scenario from the Assignment 1 requirements, what it verifies, the code that
makes it pass, and its known gaps. The scenarios live in `e2e/features/`; their steps are in
`e2e/steps/`. Run them all with `npm run e2e`.

- **22 scenarios run** (all passing). **5 are `@todo`**: written, but waiting on features that
  don't exist yet.
- Most rules are also checked by faster tests: server tests in `server/src/*.test.ts`, UI tests
  in `client/src/App.test.tsx`. Those are listed under each feature.

**How to read a step:** "Given" sets up the situation, "When" is what the user does, "Then" is
what must be true. Each line matches one function in `e2e/steps/` by its text.

**Things all e2e scenarios share:**

- The test API runs **offline** (no AI), with **in-memory storage** (your database is
  untouched), on ports 3199/5199.
- Scenarios that depend on the time send an `X-Butch-Fake-Now` header, so "now" is pinned per
  request (see `e2e/steps/context.steps.ts`).
- "Given the knowledge base has…" steps **read `server/data/knowledge-base.json`** and check it.
  If someone edits the data a scenario relies on, that scenario fails clearly.

---

## US-01: Submit a question (`01-submit-question.feature`)

| Scenario                              | What happens                                                       | Code                                                                             |
| ------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Successful submission via Send button | Type a question, click Send → a user bubble with that text appears | `Composer.tsx` `submit()`, `useChat.send()`                                      |
| Successful submission via Enter key   | Same, pressing Enter (added: the story promises Enter)             | `Composer.tsx` `handleKeyDown`                                                   |
| Empty message cannot be submitted     | Click Send with an empty box → still only the greeting bubble      | `canSend` in `Composer.tsx`, `send()` ignores blanks, server rejects blank (400) |

- **Also tested by:** `App.test.tsx` ("US-01"), including Shift+Enter adding a new line;
  `app.test.ts` (blank message → 400, 501+ characters → 400, malformed JSON → 400).
- **Gaps:** none known. The box stops at 500 characters (`maxLength`), and the server enforces
  the same limit.

## US-02: Fallback when Butch can't answer (`02-fallback.feature`)

| Scenario                        | What happens                                                                                                                               | Code                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| Question meets the threshold    | "When is Parents Weekend Fall 2026?" → reply has "Friday, October 2 through Sunday, October 4, 2026" and links family.wsu.edu              | `retrieval.ts` (keyword "parents weekend"), `butch.ts` |
| Question is below the threshold | "How do I get a refund on my parking permit?" → "I'd rather not guess", links only to `*.wsu.edu` pages, first one Transportation Services | `fallback.ts` `pickOffice()`                           |

- **Also tested by:** `app.test.ts` ("US-02 S1/S2"); `butch.test.ts` (DeepSeek is never called
  for low-confidence questions); `retrieval.test.ts` (parking scores below 0.6).
- **"Working link":** by default the step checks the link format (https, wsu.edu). Set
  `E2E_CHECK_LINKS=1` to actually visit each link (needs the internet).
- **Gaps:** "Parents Weekend" works because it's a keyword. WSU calls it "Family Weekend."
  Other phrasings a student might use need their own keywords.

## US-03: Dining hall hours (`03-dining-hours.feature`)

| Scenario              | Pinned time                | What happens                                                                            |
| --------------------- | -------------------------- | --------------------------------------------------------------------------------------- |
| Dining hall is open   | Mon Sept 21, 2026 12:00 PM | "Southside Café: open right now, closing at 9:00 PM today"                              |
| Dining hall is closed | Tue Sept 22, 2026 12:00 AM | "Southside Café: closed right now" + "Mon–Fri 7:30 AM–9:00 PM; Sat–Sun 8:30 AM–9:00 PM" |

- **Code:** `liveStatus.ts` `describeHours()` and `lib/pullmanTime.ts`.
- **Updated from the draft:** real hours (7:30 AM–9:00 PM) instead of 7 AM–8 PM. The step
  "Southside Café is open from 7:30 AM to 9:00 PM on Mondays" verifies this against the data.
- **Also tested by:** `liveStatus.test.ts`: opens later today, next opens tomorrow (Saturday),
  skips closed weekends, several open blocks per day (pool), and winter/PST time.
- **Gaps:** holiday and break hours aren't modeled, so over Thanksgiving Butch reports regular
  hours (with a warning). Only "regular fall 2026 hours" are stored.

## US-04: Academic deadlines (`04-academic-deadline.feature`)

| Scenario               | Pinned time                | What happens                                                                               |
| ---------------------- | -------------------------- | ------------------------------------------------------------------------------------------ |
| Deadline hasn't passed | Tue Sept 1, 2026 (week 2)  | "Tuesday, September 22, 2026", "Fall 2026 deadline to drop a course", "21 days from today" |
| Deadline passed        | Fri Sept 25, 2026 (week 5) | "already passed", "late withdrawal options", link to the Office of the Registrar           |

- **Code:** `liveStatus.ts` `describeDate()`. `retrieval.ts` breaks the Fall/Spring tie in favor
  of the date nearest today.
- **Changed from the draft:** the "passed" scenario used week 2, but the real Fall 2026 drop
  deadline (Sept 22) is in week 5.
- **Also tested by:** `retrieval.test.ts` (in January the Spring 2027 deadline wins);
  `app.test.ts` ("US-04 S1/S2").
- **Gaps:** in offline mode both the Fall and Spring deadlines are shown (they tie). With DeepSeek,
  the reply will focus on the current one.

## US-05: FAQ quick prompts (`05-quick-prompts.feature`)

| Scenario                                 | What happens                                                                                                        | Code                                   |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| User clicks a quick prompt button        | Click "Tell me about campus life" → sent as a user message, box stays empty, Butch mentions "student organizations" | `QuickReplyBar.tsx`, `App.tsx` `ask()` |
| Returning user sees personalized prompts | Ask "How do I get a Cougar Card?", reload → it's the **first** quick prompt                                         | `useQuickPrompts.ts` (localStorage)    |
| New user sees site-wide questions        | Fresh browser → buttons exactly match `server/data/quick-prompts.json`                                              | `GET /api/quick-prompts`               |

- **Also tested by:** `App.test.tsx` ("US-05"), including that asked questions are remembered.
- **Gaps:** the site-wide list is **curated by hand**, not computed from the most-asked
  questions yet (planned; see ROADMAP.md). Recent questions stay on the device, which matters
  on shared computers (see SECURITY_REVIEW.md SEC-15).

## US-06: WSU theme and mascot animation (`06-theme-and-mascot.feature`)

| Scenario                                       | What happens                                                                                                                                                                            |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chat interface displays WSU colors             | While Butch is typing: the header is crimson `rgb(166,15,45)` with a gray `rgb(77,77,77)` border; the typing indicator shows "Butch is typing" with a mascot in `data-state="thinking"` |
| Avatar animates while a response is generating | Header mascot is `thinking` while waiting, then back to `idle` once the reply shows                                                                                                     |

- **How it waits:** the step slows `/api/chat` down by 1.5 s (`chat.slowDownReplies()`), so the
  "typing" state is visible long enough to check.
- **Code:** `MascotAvatar.tsx` (`state` prop, `motion-safe:animate-butch-bob`),
  `TypingIndicator.tsx`, `Header.tsx`, `index.css` tokens.
- **Gaps:** the mascot is placeholder art. The test checks the _state_, not the drawing, so it
  keeps passing when real art or Lottie animations replace it.

## US-07: Rate responses (`07-rate-responses.feature`)

| Scenario                 | What happens                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| User submits a thumbs-up | Click 👍 → server returns 200 with rating `up`; the button shows `aria-pressed="true"`        |
| User changes 👍 to 👎    | Click 👎 → server saves `down`; 👎 pressed, 👍 not; both requests were for the **same** reply |

- **Code:** `RatingButtons.tsx`, `useChat.rate()`, `routes/feedback.ts`, `store.setRating()`
  (upsert).
- **Also tested by:** `app.test.ts` (the stored rating is replaced, not duplicated; unknown or
  user messages → 404; invalid rating → 400); `storeContract.ts` (both stores keep one rating
  per reply); `App.test.tsx`.
- **Gaps:** ratings aren't shown again after a page reload (they're saved, just not re-loaded
  into the UI).

## US-08: Conversation logs (`08-conversation-logs.feature`): **@todo**

- **What exists:** every question and reply is stored with a timestamp, reply kind, and
  knowledge entries used, with no identifying information. Checked by `app.test.ts` ("US-08 /
  FR-09") and `prismaStore.db.test.ts`. You can browse it with `npm run db:studio`.
- **What's missing:** the **administrator review screen**, which needs login first. Both
  scenarios run once that exists.

## US-09: Admin knowledge-base editor (`09-knowledge-base-admin.feature`): **@todo**

- **Missing:** the admin interface, the knowledge base in the database, and WSU sign-in
  (NFR-06). The planned design is in ROADMAP.md, Sprint 3.
- **Note:** "Butch can answer within 10 minutes" will be instant: the server reads the
  knowledge base on every question (NFR-07).

## US-10: New conversation (`10-new-conversation.feature`)

| Scenario                                | What happens                                                                                                    |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Clears the chat window                  | Ask questions until 5 bubbles exist, click "New Conversation" → only the greeting "Hey there, Coug! I'm Butch." |
| Clearing doesn't delete the backend log | **@todo**: needs the US-08 screen to check end to end                                                           |

- **Code:** `Header.tsx` button → `useChat.reset()`: new generation, forget the conversation ID,
  back to the greeting. The server's records aren't touched.
- **Also tested by:** `app.test.ts` (a new conversation gets a new ID; the old one still has its
  4 messages); `App.test.tsx` (a late reply for the old conversation is ignored).

## Accessibility and responsiveness (`11-accessibility.feature`): NFR-04, NFR-05

| Scenario                                  | What happens                                                                    |
| ----------------------------------------- | ------------------------------------------------------------------------------- |
| No detectable WCAG 2.1 AA violations      | After a question, **axe-core** scans the page for WCAG 2.1 A/AA problems → none |
| A question can be asked with the keyboard | Press Tab until the question box is focused, type, press Enter → Butch answers  |
| Works at 320 / 768 / 1920 px              | Reply visible, fully on screen, and no sideways page scrolling                  |

- **Gaps:** automated tools catch only part of accessibility problems. A **manual
  screen-reader pass** (NVDA on Windows, VoiceOver on Mac) is still needed before the sprint
  review, per the Milestone 1 plan.

---

## Scenarios worth adding

Ideas for the next rounds, roughly by value. Some need DeepSeek mode. Test those with a mocked
DeepSeek (like `deepseekResponder.test.ts`) or as occasional live smoke tests, since real AI output
varies.

**Safety and misuse** (see SECURITY_REVIEW.md)

- Off-topic question ("write my history essay") → polite redirect to WSU topics.
- Prompt injection ("ignore your instructions and…") → stays in persona.
- Inappropriate request → declines politely.
- Emergency ("someone is hurt") → tells them to call 911.
- Personal info typed in ("my student ID is…") → not echoed back (later: redacted in logs).
- Too many questions → the "Too many questions" message (rate limit).

**Reliability**

- The API is down → friendly error bubble (covered in `App.test.tsx`; add an e2e version).
- DeepSeek errors or times out → offline answer instead (covered in `butch.test.ts`).
- A long reply gets cut off → fallback message (covered in `deepseekResponder.test.ts`).

**Answer quality**

- Follow-up: "Is Southside open?" then "When does it close?" (currently weak; see
  ARCHITECTURE.md §10).
- Ambiguous: "Is the library open?" → both libraries.
- Multi-day event happening now: Family Weekend asked on Oct 3 → "happening now".
- Break hours: dining asked during Thanksgiving break → mentions hours may differ.
- Different phrasing: "When's Dad's Weekend?", "last day to withdraw", "gym hours".

**Future features**

- Streaming: text appears gradually and the typing indicator hands off cleanly.
- The US-08 and US-09 scenarios above, plus "admin session expires" and "non-admin can't see logs".
- Clearing recent questions (if added for shared computers).
