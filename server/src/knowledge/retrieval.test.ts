import { beforeAll, describe, expect, it } from 'vitest';
import { loadKnowledgeBase } from './loadData.ts';
import { search, tokenize, typoDistance } from './retrieval.ts';
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
    expect(results.slice(0, 2).map((r) => r.entry.category)).toEqual(['library', 'library']);
    expect(results.map((r) => r.entry.category)).not.toContain('dining');
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

describe('understanding how students actually type', () => {
  it.each([
    // Typos
    ['wen is sprng brake', 'spring-2027-spring-break'],
    ['wheres the libary', 'library-holland-terrell'],
    ['wat time does southsid close', 'dining-southside-cafe'],
    ['last day to drop a clas', 'fall-2026-drop-deadline'],
    ['fmaily weekend', 'fall-2026-family-weekend'],
    ['how do i get studnet tickets', 'athletics-student-sports-pass'],
    ['how do i get into undergrad reserch', 'research-getting-started'],
    ['hey butch whats the deal with commencment', 'fall-2026-commencement'],
    // Synonyms, slang, and shorthand
    ['is the gym open', 'rec-src-hours'],
    ['where do i grab some grub', 'dining-overview'],
    ['where can i get tutoring for chem', 'support-tutoring'],
    ['i need a doctor', 'health-cougar-health-services'],
    ['im feeling really stressed and anxious', 'health-counseling-caps'],
    ['help with my resume', 'support-career-coaching'],
    // New topics
    ['when do the cougs play football at home', 'athletics-football-2026-home-games'],
    ['when is the apple cup', 'athletics-apple-cup-2026'],
    ['basketball games', 'athletics-mens-basketball-2026'],
    ['i wanna do research in a lab', 'research-getting-started'],
    ['when is surca', 'research-surca-2027'],
    ['research grants', 'research-awards-2027-28'],
  ])('%s -> %s', (question, expectedId) => {
    const [best] = search(kb, question, { today: '2026-09-28' });
    expect(best?.entry.id).toBe(expectedId);
    expect(best?.score).toBeGreaterThanOrEqual(THRESHOLD);
  });

  it('does not "correct" a real word into a different topic', () => {
    // "parking" must not become "park" ~ "part", and "deal" must not become "meal".
    expect(search(kb, 'who do i talk to about parking')[0]?.score ?? 0).toBeLessThan(THRESHOLD);
    expect(search(kb, 'what is the meaning of life')[0]?.score ?? 0).toBeLessThan(THRESHOLD);
    expect(search(kb, 'who won the super bowl')).toEqual([]);
  });
});

describe('typoDistance', () => {
  it('counts one typo for a swap, a missing letter, an extra letter, or a wrong letter', () => {
    expect(typoDistance('teh', 'the', 2)).toBe(1);
    expect(typoDistance('libary', 'library', 2)).toBe(1);
    expect(typoDistance('classs', 'class', 2)).toBe(1);
    expect(typoDistance('fotball', 'football', 2)).toBe(1);
    expect(typoDistance('cougar', 'cougar', 2)).toBe(0);
  });

  it('gives up past the limit', () => {
    expect(typoDistance('dining', 'research', 1)).toBe(2);
  });
});
