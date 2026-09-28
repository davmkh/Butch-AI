import type { GroundedFact, Responder, ResponderInput, ResponderResult } from './types.ts';
import { inButchVoice } from './voice.ts';

/**
 * Answers straight from the knowledge base with no AI. Costs nothing, always
 * gives the same output, and needs no API key. The tests and end-to-end suite
 * use it as the "stubbed model" (Milestone 1, section 2.2.2), and the server
 * uses it when no ANTHROPIC_API_KEY is set.
 *
 * The facts are quoted word for word; Butch's personality goes around them.
 */
export class OfflineResponder implements Responder {
  readonly name = 'offline';

  async respond({ question, facts }: ResponderInput): Promise<ResponderResult> {
    const best = facts[0]!.score;
    // Show equally-strong matches together, e.g. both "Southside" locations.
    const tied = facts.filter((f) => f.score >= best - 1e-9).slice(0, 2);
    const body = tied.map(describe).join('\n\n');
    return { text: inButchVoice(body, facts[0]!.entry.category, question), answered: true };
  }
}

function describe({ entry, liveStatus }: GroundedFact): string {
  if (!liveStatus) return entry.content;
  // For opening hours the status is the answer, so lead with it.
  return entry.hours ? `${liveStatus} ${entry.content}` : `${entry.content} ${liveStatus}`;
}
