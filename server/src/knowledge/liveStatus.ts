import type { KnowledgeEntry, Weekday, WeeklyHours } from './schema.ts';
import {
  daysBetween,
  formatIsoDate,
  formatMinutes,
  pullmanClock,
  toMinutes,
} from '../lib/pullmanTime.ts';

/**
 * Works out time-sensitive facts ("open right now", "deadline passed") in code,
 * so neither the AI nor the offline responder has to do date math.
 * Covers US-03 (dining hours) and US-04 (academic deadlines).
 */
export function liveStatus(entry: KnowledgeEntry, now: Date): string | undefined {
  if (entry.hours) return describeHours(entry.title, entry.hours, now);
  if (entry.date) return describeDate(entry.date, entry.endDate, now);
  return undefined;
}

// ---------------------------------------------------------------------------
// Opening hours
// ---------------------------------------------------------------------------

const DAY_ORDER: Weekday[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const WEEK_DISPLAY_ORDER: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_NAME: Record<Weekday, string> = {
  sun: 'Sunday',
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
};
const DAY_ABBR: Record<Weekday, string> = {
  sun: 'Sun',
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
};

type Range = [open: number, close: number];

function rangesOn(hours: WeeklyHours, day: Weekday): Range[] {
  return (hours[day] ?? [])
    .map(([open, close]): Range => [toMinutes(open), toMinutes(close)])
    .sort((a, b) => a[0] - b[0]);
}

export function describeHours(place: string, hours: WeeklyHours, now: Date): string {
  const { weekday, minutes } = pullmanClock(now);
  const today = rangesOn(hours, weekday);
  const current = today.find(([open, close]) => minutes >= open && minutes < close);

  let status: string;
  if (current) {
    status = `${place}: open right now, closing at ${formatMinutes(current[1])} today.`;
  } else {
    const laterToday = today.find(([open]) => open > minutes);
    if (laterToday) {
      status = `${place}: closed right now; opens today at ${formatMinutes(laterToday[0])}.`;
    } else {
      const next = nextOpening(hours, weekday);
      status = next
        ? `${place}: closed right now; next opens ${next.when} at ${formatMinutes(next.open)}.`
        : `${place}: closed right now, with no regular hours listed.`;
    }
  }
  return `${status} Regular hours: ${summarizeWeek(hours)}.`;
}

function nextOpening(hours: WeeklyHours, from: Weekday): { when: string; open: number } | null {
  const start = DAY_ORDER.indexOf(from);
  for (let offset = 1; offset <= 7; offset++) {
    const day = DAY_ORDER[(start + offset) % 7]!;
    const first = rangesOn(hours, day)[0];
    if (first) {
      const when = offset === 1 ? `tomorrow (${DAY_NAME[day]})` : `on ${DAY_NAME[day]}`;
      return { when, open: first[0] };
    }
  }
  return null;
}

/** "Mon–Fri 7:30 AM–9:00 PM; Sat–Sun 8:30 AM–9:00 PM" */
export function summarizeWeek(hours: WeeklyHours): string {
  const labelFor = (day: Weekday) => {
    const ranges = rangesOn(hours, day);
    return ranges.length === 0
      ? 'closed'
      : ranges.map(([o, c]) => `${formatMinutes(o)}–${formatMinutes(c)}`).join(', ');
  };

  const groups: { first: Weekday; last: Weekday; label: string }[] = [];
  for (const day of WEEK_DISPLAY_ORDER) {
    const label = labelFor(day);
    const prev = groups.at(-1);
    if (prev && prev.label === label) prev.last = day;
    else groups.push({ first: day, last: day, label });
  }

  return groups
    .map(({ first, last, label }) => {
      const days = first === last ? DAY_ABBR[first] : `${DAY_ABBR[first]}–${DAY_ABBR[last]}`;
      return `${days} ${label}`;
    })
    .join('; ');
}

// ---------------------------------------------------------------------------
// Dates and deadlines
// ---------------------------------------------------------------------------

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function describeDate(date: string, endDate: string | undefined, now: Date): string {
  const today = pullmanClock(now).isoDate;

  if (!endDate || endDate === date) {
    const days = daysBetween(today, date);
    if (days < 0) {
      return `${formatIsoDate(date)} was ${plural(-days, 'day')} ago, so this date has already passed.`;
    }
    if (days === 0) return `That's today (${formatIsoDate(date)})!`;
    return `${formatIsoDate(date)} is ${plural(days, 'day')} from today.`;
  }

  const untilStart = daysBetween(today, date);
  const untilEnd = daysBetween(today, endDate);
  if (untilEnd < 0) return `This already happened; it ended ${formatIsoDate(endDate)}.`;
  if (untilStart <= 0) return `This is happening now, through ${formatIsoDate(endDate)}.`;
  return `It starts ${formatIsoDate(date)}, ${plural(untilStart, 'day')} from today, and runs through ${formatIsoDate(endDate)}.`;
}
