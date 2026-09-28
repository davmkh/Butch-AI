import { readFileSync } from 'node:fs';
import path from 'node:path';
import { expect } from '@playwright/test';
import { Given } from './fixtures.ts';

/**
 * "Given" preconditions about time and the knowledge base. Data preconditions
 * are checked against the real seed file, so a scenario fails loudly if someone
 * edits the data out from under it.
 */

interface SeedEntry {
  id: string;
  category: string;
  title: string;
  keywords: string[];
  date?: string;
  endDate?: string;
  hours?: Record<string, [string, string][]>;
}

const knowledgeBase: SeedEntry[] = JSON.parse(
  readFileSync(path.resolve(import.meta.dirname, '../../server/data/knowledge-base.json'), 'utf8'),
).entries;

// ---------------------------------------------------------------------------
// Time: pinned per request with the dev-only X-Butch-Fake-Now header
// ---------------------------------------------------------------------------

const MOMENTS: Record<string, string> = {
  '12:00 PM on a Monday': '2026-09-21T12:00:00-07:00',
  midnight: '2026-09-22T00:00:00-07:00', // the start of Tuesday
  'the 2nd week of classes': '2026-09-01T10:00:00-07:00', // Fall 2026 began Aug. 24
  'the 5th week of classes': '2026-09-25T10:00:00-07:00',
};

Given(
  /^it is (12:00 PM on a Monday|midnight|the 2nd week of classes|the 5th week of classes)$/,
  async ({ page }, moment: string) => {
    await page.setExtraHTTPHeaders({ 'X-Butch-Fake-Now': MOMENTS[moment]! });
  },
);

// ---------------------------------------------------------------------------
// Knowledge base preconditions
// ---------------------------------------------------------------------------

Given('the knowledge base has information about Parents Weekend Fall 2026 dates', async () => {
  const entry = knowledgeBase.find(
    (e) => e.keywords.includes('parents weekend') && e.date?.startsWith('2026'),
  );
  expect(entry).toMatchObject({ date: '2026-10-02', endDate: '2026-10-04' });
});

Given('the knowledge base has no information about parking permit refunds', async () => {
  const mentionsParking = knowledgeBase.filter((e) =>
    JSON.stringify(e).toLowerCase().includes('parking'),
  );
  expect(mentionsParking).toEqual([]);
});

Given('the knowledge base contains the academic school calendar', async () => {
  const calendar = knowledgeBase.filter((e) => e.category === 'academic-calendar');
  expect(calendar.length).toBeGreaterThan(10);
});

/** "7:30 AM" -> "07:30" */
function to24Hour(time: string): string {
  const [, h, m, ampm] = time.match(/^(\d{1,2}):(\d{2}) ([AP]M)$/)!;
  const hour = (Number(h) % 12) + (ampm === 'PM' ? 12 : 0);
  return `${String(hour).padStart(2, '0')}:${m}`;
}

Given(
  /^(.+) is open from (\d{1,2}:\d{2} [AP]M) to (\d{1,2}:\d{2} [AP]M) on Mondays$/,
  async ({}, place: string, open: string, close: string) => {
    const entry = knowledgeBase.find((e) => e.title === place);
    expect(entry?.hours?.mon).toEqual([[to24Hour(open), to24Hour(close)]]);
  },
);
