import type { ButchPose } from '@butch/shared';
import type { KnowledgeEntry } from '../knowledge/schema.ts';

/**
 * Butch's voice for replies written without AI: a hyper, outgoing cougar who
 * bleeds crimson. The facts in between always come word for word from the
 * knowledge base; only the wrapping has personality.
 *
 * Lines are picked by hashing the question, so the same question always gets
 * the same reply (tests stay stable) while different questions get variety.
 */

type Category = KnowledgeEntry['category'];

const OPENERS: Record<Category | 'default', string[]> = {
  default: [
    'Ooh, ooh, I know this one!',
    'Great question, Coug!',
    'Oh heck yes, let’s go!',
    'Say no more, I got you!',
    'You came to the right cougar!',
  ],
  'academic-calendar': [
    'Mark your calendar, Coug!',
    'Dates? I LOVE dates! Calendar dates, I mean.',
    'Ooh, planning ahead? That’s big brain energy!',
  ],
  'academic-support': [
    'Asking for help is a total power move, Coug!',
    'Big brain moves! I love to see it!',
    'Let’s get you that W!',
  ],
  admissions: [
    'A future Coug?! Oh, I’m SO excited!',
    'Welcome to the Cougar family (almost)! Here’s the scoop!',
  ],
  athletics: [
    'OH, now we’re talking!',
    'Ahh, my favorite subject! Game time, baby!',
    'Is it game day?! Every day is game day in my heart!',
  ],
  'campus-life': [
    'Oh, there’s SO much going on around here!',
    'Life on the Palouse is the best life, Coug!',
  ],
  dining: [
    'Ooh, food talk! I’m always hungry!',
    'My stomach just growled. Here’s the scoop!',
    'Snack time? Always snack time!',
  ],
  events: ['Ooh, a Cougar get-together? Count me in!', 'Get hyped, Coug, this one’s a blast!'],
  // Health questions can be serious, so Butch dials it down here.
  health: ['Good call reaching out, Coug.', 'Taking care of yourself is a big win.'],
  housing: ['Home sweet Palouse!', 'Let’s find you a den, Coug!'],
  library: ['Time to hit the books, Coug!', 'Ooh, study mode! Let’s gooo!'],
  recreation: ['Let’s get those gains, Coug!', 'Time to get moving! I’ve got energy for DAYS!'],
  research: ['Ooh, future researcher alert! I love it!', 'Big-brain Coug energy! Let’s go!'],
  services: ['Easy peasy, Coug!', 'I got you, Coug!'],
};

const CLOSERS = [
  'Go Cougs!',
  'Go Cougs! 🐾',
  'Anything else? I’ve got energy for days!',
  'Once a Coug, always a Coug!',
  'Bleed crimson, Coug!',
  'Hit me with another one!',
];

const GENTLE_CLOSERS = ['I’m rooting for you, Coug.', 'Take care of yourself, Coug. 🐾'];

/** How the avatar acts out an answer about each topic. */
const POSE_BY_CATEGORY: Record<Category, ButchPose> = {
  'academic-calendar': 'study',
  'academic-support': 'study',
  admissions: 'point',
  athletics: 'hype',
  'campus-life': 'hype',
  dining: 'thumbsup',
  events: 'hype',
  health: 'point',
  housing: 'point',
  library: 'study',
  recreation: 'flex',
  research: 'study',
  services: 'point',
};

export function poseFor(category: Category): ButchPose {
  return POSE_BY_CATEGORY[category];
}

/** A small, stable hash so the same text always picks the same line. */
function hash(text: string): number {
  let h = 0;
  for (const char of text) h = (h * 31 + char.charCodeAt(0)) >>> 0;
  return h;
}

export function pick<T>(options: readonly T[], seed: string): T {
  return options[hash(seed) % options.length]!;
}

/** Wraps knowledge-base facts in Butch's voice. */
export function inButchVoice(body: string, category: Category, seed: string): string {
  const opener = pick(OPENERS[category] ?? OPENERS.default, seed);
  const closer = pick(category === 'health' ? GENTLE_CLOSERS : CLOSERS, `${seed}!`);
  return `${opener} ${body}\n\n${closer}`;
}
