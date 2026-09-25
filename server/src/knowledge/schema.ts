import { z } from 'zod';

export const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export type Weekday = (typeof WEEKDAYS)[number];

const isoDate = z.iso.date(); // "2026-09-22"
const clockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour "HH:MM" time');

/** One open period, e.g. ["07:30", "21:00"]. Must close later the same day. */
const TimeRange = z
  .tuple([clockTime, clockTime])
  .refine(([open, close]) => open < close, 'Closing time must be after opening time');

/** Opening hours by day of week. A missing day means closed all day. */
export const WeeklyHoursSchema = z.partialRecord(z.enum(WEEKDAYS), z.array(TimeRange));
export type WeeklyHours = z.infer<typeof WeeklyHoursSchema>;

export const SourceLinkSchema = z.object({
  label: z.string().min(1),
  url: z.url({ protocol: /^https$/ }),
});

export const CATEGORIES = [
  'academic-calendar',
  'admissions',
  'campus-life',
  'dining',
  'events',
  'library',
  'recreation',
  'services',
] as const;

/**
 * One fact Butch can answer from (FR-03).
 *
 * Structured `hours` and `date` fields let the server work out "open right now"
 * (US-03) and "deadline passed" (US-04) itself instead of trusting the AI with
 * date math.
 */
export const KnowledgeEntrySchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/, 'Use lowercase letters, numbers, and dashes'),
    category: z.enum(CATEGORIES),
    /** For entries with `hours`, this is the place name (e.g. "Southside Café"). */
    title: z.string().min(1),
    content: z.string().min(1),
    /** Extra words people might search with: nicknames, synonyms, common phrasings. */
    keywords: z.array(z.string()).default([]),
    /** The first link is the primary source. At least one is required (US-02). */
    links: z.array(SourceLinkSchema).min(1),
    /** When a person last checked this entry against its source. */
    lastVerified: isoDate,
    hours: WeeklyHoursSchema.optional(),
    date: isoDate.optional(),
    /** For multi-day events (e.g. Family Weekend). Requires `date`. */
    endDate: isoDate.optional(),
  })
  .refine((e) => !e.endDate || (e.date && e.date <= e.endDate), {
    message: '`endDate` needs a `date` on or before it',
    path: ['endDate'],
  });

export type KnowledgeEntry = z.infer<typeof KnowledgeEntrySchema>;

export const KnowledgeFileSchema = z.object({
  entries: z.array(KnowledgeEntrySchema),
});

/** A WSU office Butch can refer people to when he can't answer (FR-05, US-02). */
export const OfficeSchema = z.object({
  id: z.string(),
  name: z.string(),
  helpsWith: z.string(),
  keywords: z.array(z.string()),
  link: SourceLinkSchema,
});
export type Office = z.infer<typeof OfficeSchema>;

export const OfficesFileSchema = z.object({
  /** Always offered when nothing more specific matches. */
  general: OfficeSchema,
  offices: z.array(OfficeSchema),
});
export type OfficesFile = z.infer<typeof OfficesFileSchema>;

export const QuickPromptsFileSchema = z.object({
  prompts: z.array(z.object({ id: z.string(), prompt: z.string().min(1) })),
});
