import type { KnowledgeEntry } from './schema.ts';
import { SYNONYM_GROUPS, WORD_FIXES } from './synonyms.ts';
import { daysBetween } from '../lib/pullmanTime.ts';

/**
 * Keyword retrieval over the knowledge base, forgiving of how students
 * actually type.
 *
 * Each entry gets a score from 0 to 1: the share of the question's meaningful
 * words found in the entry. A word counts fully when it's in the entry's
 * title or keywords (or a synonym of one), and partly when it only appears in
 * the body text. The score doubles as Butch's confidence, so a low score
 * triggers the fallback (FR-05).
 *
 * Before scoring, each question word is "understood":
 *   1. shorthand and known misspellings are fixed ("chem", "libary")
 *   2. words the knowledge base doesn't use are matched to the closest word it
 *      does use, allowing a typo or two ("footbal" -> "football")
 *   3. typos of filler words are dropped ("wen", "teh")
 * Synonyms ("gym" = "rec") are handled when indexing entries.
 *
 * If this still misses too often, the upgrade path from Milestone 1 is
 * semantic search with pgvector embeddings, behind this same `search()`.
 */

export interface ScoredEntry {
  entry: KnowledgeEntry;
  score: number;
}

const WEAK_MATCH_WEIGHT = 0.4;
/** A typo-corrected word counts slightly less, so an exact match wins a tie. */
const TYPO_MATCH_WEIGHT = 0.9;

/** Everything here is about WSU, so "wsu" and filler words don't help pick an entry. */
const STOPWORDS = new Set(
  (
    'a about am an and any anything are ask at be been butch by can could currently deal did do does feel feeling ' +
    'find for from get got grab guys hello hey hi how i if im in info information into is it its just ' +
    'know like look looking lol may me might my need now of ok okay on or our please pls plz ' +
    'question really right should so some something still stuff tell thank thanks that the there ' +
    'these thing things this those to today um us want wanna was we were what whats when where ' +
    'which who why will with wondering would wsu yo you your'
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

/**
 * Trims simple English endings so "classes" matches "class", "hours" matches
 * "hour", and "swimming" matches "swim".
 */
function stem(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith('ing') && word.length >= 7) {
    const root = word.slice(0, -3);
    // "swimming" -> "swimm" -> "swim"
    return root.at(-1) === root.at(-2) ? root.slice(0, -1) : root;
  }
  if (word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.endsWith('sses')) return word.slice(0, -2);
  if (word.endsWith('ss') || word.endsWith('us') || word.endsWith('is')) return word;
  if (word.endsWith('s')) return word.slice(0, -1);
  return word;
}

/** Lowercases and strips accents, apostrophes, and punctuation. Keeps every word. */
function words(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // "Café" -> "Cafe"
    .toLowerCase()
    .replace(/['’]s\b/g, '') // "Dad's" -> "Dad"
    .replace(/['’]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 1);
}

/** Lowercases, strips accents and punctuation, drops filler words, and stems. */
export function tokenize(text: string): string[] {
  return words(text)
    .filter((word) => !STOPWORDS.has(word))
    .map(stem);
}

// ---------------------------------------------------------------------------
// Typo tolerance
// ---------------------------------------------------------------------------

/** How many typos a word of this length may have and still match. */
function allowedTypos(word: string): number {
  if (word.length <= 3) return 0;
  if (word.length <= 7) return 1;
  return 2;
}

/**
 * Edit distance counting insertions, deletions, substitutions, and swapped
 * neighbors ("teh" -> "the") as one typo each. Gives up early past `max`.
 */
export function typoDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prevPrev: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let d = Math.min(prev[j]! + 1, row[j - 1]! + 1, prev[j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d = Math.min(d, prevPrev[j - 2]! + 1);
      }
      row.push(d);
      rowMin = Math.min(rowMin, d);
    }
    if (rowMin > max) return max + 1;
    prevPrev = prev;
    prev = row;
  }
  return prev[b.length]!;
}

function closest(word: string, candidates: Iterable<string>, max: number): string | undefined {
  let best: { word: string; distance: number } | undefined;
  for (const candidate of candidates) {
    const distance = typoDistance(word, candidate, max);
    if (distance <= max && (!best || distance < best.distance))
      best = { word: candidate, distance };
  }
  return best?.word;
}

/** The known word this is probably a typo of, if any. */
function correct(word: string, vocabulary: Set<string>): string | undefined {
  const max = allowedTypos(word);
  if (max === 0) return undefined;
  // People rarely fumble the first letter, and requiring it stops real words
  // from turning into other real words ("deal" -> "meal", "parking" -> "spark").
  const sameStart = [...vocabulary, ...TIME_WORDS].filter((known) => known[0] === word[0]);
  return closest(word, sameStart, max);
}

interface QuestionWord {
  word: string;
  /** 1 for a word typed as-is, less for a typo-corrected one. */
  weight: number;
}

/** Turns a question into the words to search for, fixing typos along the way. */
export function understand(question: string, vocabulary: Set<string>): QuestionWord[] {
  const result: QuestionWord[] = [];
  for (const raw of words(question)) {
    if (STOPWORDS.has(raw)) continue;
    const fixed = WORD_FIXES[raw];
    const word = stem(fixed ?? raw);
    if (STOPWORDS.has(word)) continue; // "hows" -> "how"
    if (fixed || vocabulary.has(word) || TIME_WORDS.has(word)) {
      result.push({ word, weight: 1 });
      continue;
    }
    // Match typos on the word as typed: stemming a typo can mangle it ("clas" -> "cla"),
    // and a short stem is too easy to confuse ("parking" -> "park" ~ "part").
    const corrected = correct(raw, vocabulary);
    if (corrected) {
      result.push({ word: corrected, weight: TYPO_MATCH_WEIGHT });
    } else if (raw.length >= 3 && closest(raw, STOPWORDS, 1)) {
      // A typo'd filler word, like "wen" or "teh". Ignore it.
    } else {
      // A real word the knowledge base doesn't cover. It lowers confidence.
      result.push({ word, weight: 1 });
    }
  }
  // Keep each word once.
  return [...new Map(result.map((w) => [w.word, w])).values()];
}

// ---------------------------------------------------------------------------
// Index
// ---------------------------------------------------------------------------

const SYNONYMS_OF: Map<string, string[]> = (() => {
  const map = new Map<string, string[]>();
  for (const group of SYNONYM_GROUPS) {
    const stemmed = [...new Set(group.map((w) => stem(w.toLowerCase())))];
    for (const word of stemmed) map.set(word, [...(map.get(word) ?? []), ...stemmed]);
  }
  return map;
})();

interface IndexedEntry {
  entry: KnowledgeEntry;
  strong: Set<string>;
  weak: Set<string>;
}

interface Index {
  entries: IndexedEntry[];
  vocabulary: Set<string>;
}

function indexEntry(entry: KnowledgeEntry): IndexedEntry {
  const strong = new Set(tokenize([entry.title, ...entry.keywords].join(' ')));
  for (const word of [...strong]) {
    for (const synonym of SYNONYMS_OF.get(word) ?? []) strong.add(synonym);
  }
  return { entry, strong, weak: new Set(tokenize(entry.content)) };
}

// The store hands back the same array each time, so index it once.
const indexCache = new WeakMap<KnowledgeEntry[], Index>();

function indexFor(entries: KnowledgeEntry[]): Index {
  let index = indexCache.get(entries);
  if (!index) {
    const indexed = entries.map(indexEntry);
    const vocabulary = new Set(indexed.flatMap((e) => [...e.strong, ...e.weak]));
    index = { entries: indexed, vocabulary };
    indexCache.set(entries, index);
  }
  return index;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

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
  const index = indexFor(entries);
  const allWords = understand(question, index.vocabulary);
  const topicWords = allWords.filter(({ word }) => !TIME_WORDS.has(word));
  if (topicWords.length === 0) return [];
  const asksAboutHours = topicWords.length < allWords.length;

  // Tie-breakers: entries with hours for "is X open?" questions, then the nearest date.
  const hoursRank = (entry: KnowledgeEntry) => (asksAboutHours && entry.hours ? 0 : 1);
  const distanceFromToday = (entry: KnowledgeEntry) =>
    today && entry.date ? Math.abs(daysBetween(today, entry.date)) : 0;

  return index.entries
    .map(({ entry, strong, weak }) => {
      const points = topicWords.reduce(
        (sum, { word, weight }) =>
          sum + weight * (strong.has(word) ? 1 : weak.has(word) ? WEAK_MATCH_WEIGHT : 0),
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
