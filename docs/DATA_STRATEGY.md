# Data strategy: where Butch's knowledge comes from

## Short answer: curate and retrieve, don't train

Butch doesn't need a trained model. Claude already knows how to write; what it lacks is
current, WSU-specific facts. So we keep our own **knowledge base** of WSU facts, look up the
relevant ones for each question, and have Claude answer only from those. This is usually
called retrieval-augmented generation (RAG), and it's what the Milestone 1 plan describes
("we call a hosted model rather than train one").

Why this beats training for us:

- **Facts go stale every semester.** Dining hours, deadlines, and events change. Editing a
  JSON entry (later: an admin form, US-09) takes seconds; retraining takes days and money.
- **Every answer can cite its source.** Each entry has a link, so students can verify.
- **No made-up answers.** When nothing matches, Butch says so and links the right office.
- **Thumbs up/down (FR-08) improve the data, not the model.** Downvotes and fallbacks in
  the logs show which entries are wrong or missing.

## What's in the knowledge base now

`server/data/knowledge-base.json` has **42 entries**, all copied from official WSU pages and
verified on 2026-09-25:

| Topic                 | Source                                                             |
| --------------------- | ------------------------------------------------------------------ |
| Academic calendar     | catalog.wsu.edu/AcademicCalendar (Fall 2026 and Spring 2027 dates) |
| Dining hours          | dining.wsu.edu/facility-hours (regular fall hours, 9 locations)    |
| Library hours         | libraries.wsu.edu/hours (Holland and Terrell, Owen)                |
| Rec Center            | urec.wsu.edu (hours, pool hours, amenities)                        |
| Family Weekend        | family.wsu.edu/family-weekends (Fall 2026, Spring 2027)            |
| Admissions            | admission.wsu.edu (2026-27 dates and deadlines)                    |
| CougarCard, Registrar | cougarcard.wsu.edu, registrar.wsu.edu                              |
| Campus life           | pullman.wsu.edu/community-life, getinvolved.wsu.edu                |

`server/data/offices.json` lists WSU offices for fallback answers (parking, housing,
financial aid, and others). Parking is deliberately **not** in the knowledge base, so US-02's
"parking permit refund" scenario exercises the fallback.

## Two kinds of entries

- **Text facts** (`content`): admissions, campus life, the CougarCard process.
- **Structured facts**: weekly `hours` (`"mon": [["07:30", "21:00"]]`) and `date`/`endDate`.
  The server computes "open right now" and "deadline passed" from these. **If a fact
  involves a time or date, put it in a structured field**, not only in the text.

## Adding or updating an entry

1. Open `server/data/knowledge-base.json` and copy a similar entry.
2. Give it a unique `id` (lowercase-with-dashes), a clear `title`, and factual `content`
   written as it should be read aloud.
3. Add `keywords`: the words students actually type ("drop a class", "rec center", "dorm").
   These matter most for matching. You don't need every typo or synonym: typos are matched
   automatically, and whole synonym groups ("gym" = "rec") live in
   `server/src/knowledge/synonyms.ts`.
4. Add at least one `links` entry to the official page, and set `lastVerified` to today.
5. Run `npm test -w server`. The loader rejects typos (bad times, missing links, duplicate IDs).
6. Ask Butch the question in the app to confirm it matches.

## Refresh plan

| When                      | What                                                                |
| ------------------------- | ------------------------------------------------------------------- |
| Start of each semester    | New academic calendar dates; regular dining, library, and Rec hours |
| Before breaks and finals  | Holiday or finals hours (currently regular hours only; Butch warns) |
| Weekly during development | Review fallbacks and downvotes in logs to spot gaps                 |
| Before every demo         | Re-verify entries whose `lastVerified` is older than a month        |

## About scraping

Scraping can help later, but it isn't the first step:

- **Many key WSU pages are rendered with JavaScript** (the academic calendar, dining hours,
  UREC hours). A plain HTTP scraper sees an empty page, so you'd need a headless browser.
- **Some sites block scripts** (the Libraries site returned 403 to non-browser requests).
  Respect that and don't try to get around it.
- **wsu.edu's robots.txt** only disallows `/wp-admin/`, but still keep requests slow, identify
  the bot, and only fetch public pages.
- **Scraped text still needs structuring.** Hours and dates must become `hours` and `date`
  fields to power "open right now".

Suggested path: keep curating by hand for sprint 1 and 2. Later, a small **ingestion script**
can fetch a fixed list of pages with Playwright, extract hours and dates, and produce a
_diff for a human to review_ rather than overwriting the knowledge base directly. Always keep a
person in the loop for anything Butch states as fact.

## Later: semantic search

Keyword matching misses paraphrases that share no words with an entry. If fallbacks show that
happening often, add embeddings with PostgreSQL's pgvector (already in the Milestone 1 plan)
behind the same `search()` function in `server/src/knowledge/retrieval.ts`.
