import { formatPullmanDateTime } from '../lib/pullmanTime.ts';
import { BUTCH_SYSTEM_PROMPT } from './persona.ts';
import type { GroundedFact, Responder, ResponderInput, ResponderResult } from './types.ts';

export const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';

export interface DeepSeekResponderOptions {
  apiKey: string;
  model: string;
  /** Defaults to the global fetch. Tests pass a fake so they never call the real (paid) API. */
  fetch?: typeof fetch;
  timeoutMs?: number;
  maxRetries?: number;
}

/** A non-2xx reply from the DeepSeek API. */
export class DeepSeekApiError extends Error {
  readonly status: number;

  constructor(status: number, body: string) {
    super(`DeepSeek API returned ${status}: ${body.slice(0, 200)}`);
    this.name = 'DeepSeekApiError';
    this.status = status;
  }
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletion {
  choices: { finish_reason: string; message: { content: string | null } }[];
}

const MAX_TOKENS = 4096;

/** Writes Butch's reply with DeepSeek, grounded in the retrieved WSU facts (FR-03). */
export class DeepSeekResponder implements Responder {
  readonly name = 'deepseek';
  private readonly apiKey: string;
  private readonly model: string;
  private readonly fetch: typeof fetch;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor({
    apiKey,
    model,
    fetch: fetchFn,
    timeoutMs = 30_000,
    maxRetries = 1,
  }: DeepSeekResponderOptions) {
    this.apiKey = apiKey;
    this.model = model;
    this.fetch = fetchFn ?? globalThis.fetch;
    this.timeoutMs = timeoutMs;
    this.maxRetries = maxRetries;
  }

  async respond(input: ResponderInput): Promise<ResponderResult> {
    const messages: ChatMessage[] = [
      { role: 'system', content: BUTCH_SYSTEM_PROMPT },
      ...toApiHistory(input.history),
      { role: 'user', content: buildPrompt(input) },
    ];
    const body = {
      model: this.model,
      messages,
      // Butch's replies are a few sentences. This cap limits what one request can cost
      // if someone asks for an essay.
      max_tokens: MAX_TOKENS,
      // Short grounded answers don't need reasoning, and skipping it keeps replies fast and cheap.
      thinking: { type: 'disabled' },
      stream: false,
    };

    const completion = await this.post(body);
    const choice = completion.choices[0];

    // No usable answer, so Butch gives the fallback message instead:
    // - content_filter: the safety filter declined
    // - length: cut off mid-reply, usually because someone asked for something very long
    if (!choice || choice.finish_reason !== 'stop') return { text: '', answered: false };

    const text = (choice.message.content ?? '').trim();
    return text ? { text, answered: true } : { text: '', answered: false };
  }

  /** POSTs to the API, retrying once on network errors, 429s, and 5xx responses. */
  private async post(body: object): Promise<ChatCompletion> {
    for (let attempt = 0; ; attempt++) {
      try {
        // Fail fast so a slow API call falls back to an offline answer instead of hanging the chat.
        const res = await this.fetch(DEEPSEEK_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(this.timeoutMs),
        });
        if (res.ok) return (await res.json()) as ChatCompletion;
        throw new DeepSeekApiError(res.status, await res.text());
      } catch (error) {
        const retryable =
          !(error instanceof DeepSeekApiError) || error.status === 429 || error.status >= 500;
        if (!retryable || attempt >= this.maxRetries) throw error;
      }
    }
  }
}

/** Keep the conversation starting with the user, so drop any leading replies. */
function toApiHistory(history: ResponderInput['history']): ChatMessage[] {
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
