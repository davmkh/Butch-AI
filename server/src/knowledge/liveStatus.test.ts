import { describe, expect, it } from 'vitest';
import { pullman } from '../test/helpers.ts';
import { describeDate, describeHours, summarizeWeek } from './liveStatus.ts';
import type { WeeklyHours } from './schema.ts';

const southside: WeeklyHours = {
  mon: [['07:30', '21:00']],
  tue: [['07:30', '21:00']],
  wed: [['07:30', '21:00']],
  thu: [['07:30', '21:00']],
  fri: [['07:30', '21:00']],
  sat: [['08:30', '21:00']],
  sun: [['08:30', '21:00']],
};
const weekdaysOnly: WeeklyHours = {
  mon: [['10:30', '19:30']],
  tue: [['10:30', '19:30']],
  wed: [['10:30', '19:30']],
  thu: [['10:30', '19:30']],
  fri: [['10:30', '19:30']],
};
const pool: WeeklyHours = {
  mon: [
    ['06:00', '08:00'],
    ['11:00', '13:30'],
    ['16:00', '22:00'],
  ],
};

describe('describeHours (US-03)', () => {
  it('says a place is open and gives today’s closing time', () => {
    // Monday, Sept 21, 2026 at noon
    const text = describeHours('Southside Café', southside, pullman('2026-09-21 12:00'));
    expect(text).toContain('Southside Café: open right now');
    expect(text).toContain('closing at 9:00 PM today');
  });

  it('says a place is closed at midnight and lists the days and times it is open', () => {
    const text = describeHours('Southside Café', southside, pullman('2026-09-22 00:00'));
    expect(text).toContain('closed right now; opens today at 7:30 AM');
    expect(text).toContain('Mon–Fri 7:30 AM–9:00 PM; Sat–Sun 8:30 AM–9:00 PM');
  });

  it('points to tomorrow when it has closed for the day', () => {
    // Friday, Sept 25 at 10 PM, so next open is Saturday's later start
    const text = describeHours('Southside Café', southside, pullman('2026-09-25 22:00'));
    expect(text).toContain('next opens tomorrow (Saturday) at 8:30 AM');
  });

  it('skips closed weekend days', () => {
    const text = describeHours('Hillside Café', weekdaysOnly, pullman('2026-09-25 20:00'));
    expect(text).toContain('next opens on Monday at 10:30 AM');
    expect(text).toContain('Sat–Sun closed');
  });

  it('handles several open blocks in one day', () => {
    // Monday 9 AM is between the 6–8 AM and 11 AM–1:30 PM blocks
    expect(describeHours('SRC Pool', pool, pullman('2026-09-21 09:00'))).toContain(
      'opens today at 11:00 AM',
    );
    expect(describeHours('SRC Pool', pool, pullman('2026-09-21 12:00'))).toContain(
      'closing at 1:30 PM today',
    );
  });

  it('uses Pullman time even in winter (PST)', () => {
    // Monday, Jan 11, 2027 at 7:45 AM PST, open since 7:30
    const text = describeHours('Southside Café', southside, pullman('2027-01-11 07:45', '-08:00'));
    expect(text).toContain('open right now');
  });
});

describe('summarizeWeek', () => {
  it('groups consecutive days with the same hours', () => {
    expect(summarizeWeek(southside)).toBe('Mon–Fri 7:30 AM–9:00 PM; Sat–Sun 8:30 AM–9:00 PM');
  });
});

describe('describeDate (US-04)', () => {
  const now = pullman('2026-09-25 14:00');

  it('says when a deadline has already passed', () => {
    expect(describeDate('2026-09-22', undefined, now)).toBe(
      'Tuesday, September 22, 2026 was 3 days ago, so this date has already passed.',
    );
  });

  it('counts the days until an upcoming deadline', () => {
    expect(describeDate('2026-11-20', undefined, now)).toBe(
      'Friday, November 20, 2026 is 56 days from today.',
    );
  });

  it('recognizes today', () => {
    expect(describeDate('2026-09-25', undefined, now)).toContain("That's today");
  });

  it('describes upcoming, current, and past multi-day events', () => {
    expect(describeDate('2026-10-02', '2026-10-04', now)).toContain('7 days from today');
    expect(describeDate('2026-10-02', '2026-10-04', pullman('2026-10-03 10:00'))).toContain(
      'happening now',
    );
    expect(describeDate('2026-10-02', '2026-10-04', pullman('2026-10-05 10:00'))).toContain(
      'already happened',
    );
  });
});
