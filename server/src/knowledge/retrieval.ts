import type { KnowledgeEntry } from './schema.ts';
import { daysBetween } from '../lib/pullmanTime.ts';

/**
 * Keyword retrieval over the knowledge base.
 *
 * Each entry gets a score from 0 to 1: the share of the question's meaningful
 * words found in the entry. A word counts fully when it's in the entry's
 * title or keywords, and partly when it only appears in the body text. The
 * score doubles as Butch's confidence, so a low score triggers the fallback
 * (FR-05).
 *
 * This is deliberately simple for sprint 1. If it misses too often, the upgrade
 * path from Milestone 1 is semantic search with pgvector embeddings, behind
 * this same `search()` function.
 */

export interface ScoredEntry {
  entry: KnowledgeEntry;
  score: number;
}

const WEAK_MATCH_WEIGHT = 0.4;

/** Everything here is about WSU, so "wsu" and filler words don't help pick an entry. */
const STOPWORDS = new Set(
  (
    'a about am an and any are at be been butch by can could currently did do does for from get ' +
    'got hello hey hi how i if in is it its know like may me might my need now of on or our ' +
    'please right should so some still tell that the there these this those to today us want ' +
    'was we were what when where which who why will with would wsu you your'
  ).split(' '),
);

/**
 * Words about *when* ("open", "hours", "Saturday"). They say the question is
 * about opening hours, not which place, so they don't count toward the topic
 * match. Otherwise "What time does the library close?" would half-match every
 * dining hall.
 */
const TIME_WORDS = new Set(
  (
    'open opens opening close closes closed closing hour hours time tonight tomorrow ' +
    'morning afternoon evening night weekend weekends weekday weekdays ' +
    'monday tuesday wednesday thursday friday saturday sunday'
  )
    .split(' ')
    .map((word) => stem(word)),
);

/** Trims simple English plurals so "classes" matches "class" and "hours" matches "hour". */
function stem(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.endsWith('sses')) return word.slice(0, -2);
  if (word.endsWith('ss') || word.endsWith('us') || word.endsWith('is')) return word;
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
}

/** Lowercases, strips accents and punctuation, drops filler words, and stems. */
export function tokenize(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // "Café" -> "Cafe"
    .toLowerCase()
    .replace(/['’]s\b/g, '') // "Dad's" -> "Dad"
    .replace(/['’]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1 && !STOPWORDS.has(word))
    .map(stem);
}

interface IndexedEntry {
  entry: KnowledgeEntry;
  strong: Set<string>;
  weak: Set<string>;
}

function indexEntry(entry: KnowledgeEntry): IndexedEntry {
  return {
    entry,
    strong: new Set(tokenize([entry.title, ...entry.keywords].join(' '))),
    weak: new Set(tokenize(entry.content)),
  };
}

export interface SearchOptions {
  limit?: number;
  /** Pullman's current date ("YYYY-MM-DD"). Breaks ties toward the nearest date, e.g. this semester's drop deadline over next semester's. */
  today?: string;
}

export function search(
  entries: KnowledgeEntry[],
  question: string,
  { limit = 3, today }: SearchOptions = {},
): ScoredEntry[] {
  const allWords = [...new Set(tokenize(question))];
  const topicWords = allWords.filter((w) => !TIME_WORDS.has(w));
  if (topicWords.length === 0) return [];
  const asksAboutHours = topicWords.length < allWords.length;

  // Tie-breakers: entries with hours for "is X open?" questions, then the nearest date.
  const hoursRank = (entry: KnowledgeEntry) => (asksAboutHours && entry.hours ? 0 : 1);
  const distanceFromToday = (entry: KnowledgeEntry) =>
    today && entry.date ? Math.abs(daysBetween(today, entry.date)) : 0;

  return entries
    .map(indexEntry)
    .map(({ entry, strong, weak }) => {
      const points = topicWords.reduce(
        (sum, w) => sum + (strong.has(w) ? 1 : weak.has(w) ? WEAK_MATCH_WEIGHT : 0),
        0,
      );
      return { entry, score: points / topicWords.length };
    })
    .filter((result) => result.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        hoursRank(a.entry) - hoursRank(b.entry) ||
        distanceFromToday(a.entry) - distanceFromToday(b.entry),
    )
    .slice(0, limit);
}
