import Anthropic from '@anthropic-ai/sdk';
import type { ReplyKind, SourceLink } from '@butch/shared';
import { liveStatus } from '../knowledge/liveStatus.ts';
import { search } from '../knowledge/retrieval.ts';
import type { OfficesFile } from '../knowledge/schema.ts';
import { pullmanClock } from '../lib/pullmanTime.ts';
import type { GroundedFact, HistoryTurn, Responder, ResponderResult } from '../responders/types.ts';
import type { Store } from '../store/types.ts';
import { buildFallback } from './fallback.ts';

export interface ButchReply {
  text: string;
  kind: ReplyKind;
  sources: SourceLink[];
  /** Knowledge entries the answer was based on (empty for fallbacks). */
  entryIds: string[];
}

export interface ButchOptions {
  store: Store;
  offices: OfficesFile;
  responder: Responder;
  /** Used if the main responder errors, e.g. the Claude API is down (NFR-03). */
  backupResponder: Responder;
  confidenceThreshold: number;
  maxFacts?: number;
  logger?: Pick<Console, 'warn'>;
}

/**
 * Butch's answer pipeline:
 *   1. search the knowledge base for the question
 *   2. not confident?  -> fallback with a link to the right WSU office (FR-05)
 *   3. add live status (open now / deadline passed) to each match
 *   4. have the responder (Claude or offline) write the reply from those facts
 */
export class Butch {
  private readonly options: Required<ButchOptions>;

  constructor(options: ButchOptions) {
    this.options = { maxFacts: 3, logger: console, ...options };
  }

  get responderName(): Responder['name'] {
    return this.options.responder.name;
  }

  async reply(question: string, history: HistoryTurn[], now: Date): Promise<ButchReply> {
    const { store, confidenceThreshold, maxFacts } = this.options;

    const matches = search(await store.listKnowledge(), question, {
      limit: maxFacts,
      today: pullmanClock(now).isoDate,
    }).filter((match) => match.score >= confidenceThreshold);

    if (matches.length === 0) return this.fallback(question);

    const facts: GroundedFact[] = matches.map((match) => ({
      ...match,
      liveStatus: liveStatus(match.entry, now),
    }));

    const result = await this.respond({ question, history, facts, now });
    if (!result.answered) return this.fallback(question);

    return {
      text: result.text,
      kind: 'answer',
      sources: uniqueLinks(facts),
      entryIds: facts.map((f) => f.entry.id),
    };
  }

  private async respond(input: Parameters<Responder['respond']>[0]): Promise<ResponderResult> {
    const { responder, backupResponder, logger } = this.options;
    try {
      return await responder.respond(input);
    } catch (error) {
      const detail =
        error instanceof Anthropic.APIError
          ? `${error.status ?? 'network'} ${error.name}`
          : String(error);
      logger.warn(`[butch] ${responder.name} responder failed (${detail}); using backup.`);
      return backupResponder.respond(input);
    }
  }

  private fallback(question: string): ButchReply {
    return { ...buildFallback(question, this.options.offices), kind: 'fallback', entryIds: [] };
  }
}

function uniqueLinks(facts: GroundedFact[]): SourceLink[] {
  const byUrl = new Map<string, SourceLink>();
  for (const link of facts.flatMap((f) => f.entry.links)) {
    if (!byUrl.has(link.url)) byUrl.set(link.url, link);
  }
  return [...byUrl.values()].slice(0, 3);
}
