import type { SourceLink } from '@butch/shared';
import { tokenize } from '../knowledge/retrieval.ts';
import type { Office, OfficesFile } from '../knowledge/schema.ts';

/**
 * What Butch says when he isn't confident (FR-05, US-02): no guessing, just a
 * pointer to the WSU office most likely to help, plus the main WSU site.
 */
export function buildFallback(
  question: string,
  offices: OfficesFile,
): { text: string; sources: SourceLink[] } {
  const office = pickOffice(question, offices.offices);
  if (office) {
    return {
      text: `Aw, shucks! I don't have a confident answer for that one, and I'd never guess on you, Coug. Your best bet is ${office.name}. They can help with ${office.helpsWith}. Try me on something else anytime!`,
      sources: [office.link, offices.general.link],
    };
  }
  return {
    text: "Aw, shucks! I don't have a confident answer for that one, and I'd never guess on you, Coug. The WSU website is a great place to start. Or hit me with a question about dining, deadlines, admissions, Cougar sports, undergrad research, tutoring, Cougar Health, housing, the Rec, or campus life!",
    sources: [offices.general.link],
  };
}

/** The office whose keywords overlap the question the most, if any do. */
export function pickOffice(question: string, offices: Office[]): Office | undefined {
  const words = new Set(tokenize(question));
  let best: { office: Office; hits: number } | undefined;
  for (const office of offices) {
    const keywords = new Set(tokenize(office.keywords.join(' ')));
    const hits = [...words].filter((w) => keywords.has(w)).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { office, hits };
  }
  return best?.office;
}
