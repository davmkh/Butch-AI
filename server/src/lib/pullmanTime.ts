import type { Weekday } from '../knowledge/schema.ts';

/** WSU Pullman's time zone. All hours and deadlines are in Pullman time. */
export const PULLMAN_TIME_ZONE = 'America/Los_Angeles';

const WEEKDAY_BY_SHORT_NAME: Record<string, Weekday> = {
  Sun: 'sun',
  Mon: 'mon',
  Tue: 'tue',
  Wed: 'wed',
  Thu: 'thu',
  Fri: 'fri',
  Sat: 'sat',
};

const partsFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: PULLMAN_TIME_ZONE,
  weekday: 'short',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export interface PullmanClock {
  weekday: Weekday;
  /** Minutes since local midnight, 0 to 1439. */
  minutes: number;
  /** Local calendar date, "YYYY-MM-DD". */
  isoDate: string;
}

/** What day and time it is in Pullman at the given instant. */
export function pullmanClock(now: Date): PullmanClock {
  const parts = Object.fromEntries(partsFormatter.formatToParts(now).map((p) => [p.type, p.value]));
  return {
    weekday: WEEKDAY_BY_SHORT_NAME[parts.weekday!]!,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
    isoDate: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

/** "Friday, September 25, 2026 at 2:15 PM" (Pullman time). */
export function formatPullmanDateTime(now: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: PULLMAN_TIME_ZONE,
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(now);
}

/** "HH:MM" to minutes since midnight. */
export function toMinutes(clockTime: string): number {
  const [h, m] = clockTime.split(':').map(Number);
  return h! * 60 + m!;
}

/** Minutes since midnight to "7:30 AM". */
export function formatMinutes(minutes: number): string {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const suffix = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

/** Calendar dates are timezone-free, so do their math in UTC to avoid DST surprises. */
function utcDay(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00Z`);
}

/** "2026-09-22" to "Tuesday, September 22, 2026". */
export function formatIsoDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', dateStyle: 'full' }).format(
    utcDay(isoDate),
  );
}

/** Whole calendar days from `fromIso` to `toIso` (negative if `toIso` is earlier). */
export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((utcDay(toIso).getTime() - utcDay(fromIso).getTime()) / 86_400_000);
}
