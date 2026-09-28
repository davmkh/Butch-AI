import Anthropic from '@anthropic-ai/sdk';
import { formatPullmanDateTime } from '../lib/pullmanTime.ts';
import { BUTCH_SYSTEM_PROMPT } from './persona.ts';
import type { GroundedFact, Responder, ResponderInput, ResponderResult } from './types.ts';

type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export interface ClaudeResponderOptions {
  /** Only `beta.messages.create` is used, so tests can pass a small fake. */
  client: Pick<Anthropic, 'beta'>;
  model: string;
  effort?: Effort;
}

/**
 * Models where we opt in to Anthropic's server-side refusal fallback: if the
 * model's safety classifier declines, the API retries on a fallback model in
 * the same call. Add more model IDs here once confirmed to support it.
 */
const REFUSAL_FALLBACK_MODELS = new Set(['claude-opus-5']);

const MAX_TOKENS = 4096;

/** Writes Butch's reply with Claude, grounded in the retrieved WSU facts (FR-03). */
export class ClaudeResponder implements Responder {
  readonly name = 'claude';
  private readonly client: Pick<Anthropic, 'beta'>;
  private readonly model: string;
  private readonly effort?: Effort;

  constructor({ client, model, effort }: ClaudeResponderOptions) {
    this.client = client;
    this.model = model;
    this.effort = effort;
  }

  async respond(input: ResponderInput): Promise<ResponderResult> {
    const params: Anthropic.Beta.MessageCreateParamsNonStreaming = {
      model: this.model,
      // Butch's replies are a few sentences. This cap leaves room for the model's thinking
      // while limiting what one request can cost if someone asks for an essay.
      max_tokens: MAX_TOKENS,
      system: BUTCH_SYSTEM_PROMPT,
      messages: [...toApiHistory(input.history), { role: 'user', content: buildPrompt(input) }],
    };
    if (this.effort) params.output_config = { effort: this.effort };
    if (REFUSAL_FALLBACK_MODELS.has(this.model)) {
      params.betas = ['server-side-fallback-2026-07-01'];
      params.fallbacks = 'default';
    }

    const response = await this.client.beta.messages.create(params);

    // No usable answer, so Butch gives the fallback message instead:
    // - refusal: the safety filter declined (even after the server-side fallback)
    // - max_tokens: cut off mid-reply, usually because someone asked for something very long
    if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') {
      return { text: '', answered: false };
    }

    const text = response.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('')
      .trim();
    return text ? { text, answered: true } : { text: '', answered: false };
  }
}

/** The API requires the first message to be from the user, so drop any leading replies. */
function toApiHistory(history: ResponderInput['history']): Anthropic.Beta.BetaMessageParam[] {
  const firstUser = history.findIndex((turn) => turn.role === 'user');
  if (firstUser === -1) return [];
  return history.slice(firstUser).map((turn) => ({ role: turn.role, content: turn.text }));
}

/** Per-request context: the current time, the retrieved facts, then the question. */
export function buildPrompt({ question, facts, now }: ResponderInput): string {
  return [
    `<current_time>${formatPullmanDateTime(now)} (Pullman, WA)</current_time>`,
    '',
    '<wsu_facts>',
    ...facts.map(formatFact),
    '</wsu_facts>',
    '',
    `<question>${question}</question>`,
  ].join('\n');
}

function formatFact({ entry, liveStatus }: GroundedFact): string {
  const attr = (value: string) => value.replaceAll('"', "'");
  const lines = [
    `<fact title="${attr(entry.title)}" source="${attr(entry.links[0]!.label)}">`,
    entry.content,
  ];
  if (liveStatus) lines.push(`Live status: ${liveStatus}`);
  lines.push('</fact>');
  return lines.join('\n');
}
