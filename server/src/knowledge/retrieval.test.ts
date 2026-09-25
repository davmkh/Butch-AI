import { beforeAll, describe, expect, it } from 'vitest';
import { loadKnowledgeBase } from './loadData.ts';
import { search, tokenize } from './retrieval.ts';
import type { KnowledgeEntry } from './schema.ts';

const THRESHOLD = 0.6;
let kb: KnowledgeEntry[];

beforeAll(async () => {
  kb = await loadKnowledgeBase();
});

const topId = (question: string, today = '2026-09-25') =>
  search(kb, question, { today })[0]?.entry.id;

describe('tokenize', () => {
  it('drops filler words, accents, possessives, and plurals', () => {
    expect(tokenize('Is Southside Café open right now?')).toEqual(['southside', 'cafe', 'open']);
    expect(tokenize("When is Dad's Weekend for WSU classes?")).toEqual(['dad', 'weekend', 'class']);
  });
});

describe('search against the seed knowledge base', () => {
  it.each([
    ['Is Southside open right now?', 'dining-southside-cafe'],
    ['What is the last day to drop a class?', 'fall-2026-drop-deadline'],
    ['When is Parents Weekend Fall 2026?', 'fall-2026-family-weekend'],
    ['Tell me about campus life', 'campus-life'],
    ['Tell me about the amenities in the rec center', 'rec-src-amenities'],
    ['How do I get a Cougar Card?', 'cougar-card'],
    ['What are the admission deadlines?', 'admissions-dates'],
    ['When is spring break?', 'spring-2027-spring-break'],
    ['What are the rec center hours?', 'rec-src-hours'],
  ])('%s -> %s', (question, expectedId) => {
    const [best] = search(kb, question, { today: '2026-09-25' });
    expect(best?.entry.id).toBe(expectedId);
    expect(best?.score).toBeGreaterThanOrEqual(THRESHOLD);
  });

  it('is not confident about topics the knowledge base does not cover (US-02)', () => {
    const [best] = search(kb, 'How do I get a refund on my parking permit?');
    expect(best?.score ?? 0).toBeLessThan(THRESHOLD);
  });

  it('does not let time words drag in unrelated places', () => {
    const results = search(kb, 'What time does the library close?');
    expect(results.map((r) => r.entry.category)).toEqual(['library', 'library']);
  });

  it('prefers the deadline closest to today when two semesters tie', () => {
    expect(topId('What is the last day to drop a class?', '2026-09-25')).toBe(
      'fall-2026-drop-deadline',
    );
    expect(topId('What is the last day to drop a class?', '2027-01-20')).toBe(
      'spring-2027-drop-deadline',
    );
  });

  it('returns nothing for questions with no topic words', () => {
    expect(search(kb, 'What time is it?')).toEqual([]);
  });
});
