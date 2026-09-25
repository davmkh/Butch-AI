import type { GroundedFact, Responder, ResponderInput, ResponderResult } from './types.ts';

/**
 * Answers straight from the knowledge base with no AI. Costs nothing, always
 * gives the same output, and needs no API key. The tests and end-to-end suite
 * use it as the "stubbed model" (Milestone 1, section 2.2.2), and the server
 * uses it when no ANTHROPIC_API_KEY is set.
 */
export class OfflineResponder implements Responder {
  readonly name = 'offline';

  async respond({ facts }: ResponderInput): Promise<ResponderResult> {
    const best = facts[0]!.score;
    // Show equally-strong matches together, e.g. both "Southside" locations.
    const tied = facts.filter((f) => f.score >= best - 1e-9).slice(0, 2);
    return { text: tied.map(describe).join('\n\n'), answered: true };
  }
}

function describe({ entry, liveStatus }: GroundedFact): string {
  if (!liveStatus) return entry.content;
  // For opening hours the status is the answer, so lead with it.
  return entry.hours ? `${liveStatus} ${entry.content}` : `${entry.content} ${liveStatus}`;
}
